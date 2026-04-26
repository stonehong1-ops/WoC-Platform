'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Post, ReactionType } from '@/types/feed';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { feedService } from '@/lib/firebase/feedService';
import ReactionSelector from './ReactionSelector';
import ReactionListBottomSheet from './ReactionListBottomSheet';
import CommentBottomSheet from './CommentBottomSheet';
import MediaViewerPopup from './MediaViewerPopup';
import { DualText } from '@/components/social/SocialHeroCard';

interface FeedPostCardProps {
  post: Post;
  currentUser?: any;
  onEdit?: (post: Post) => void;
  onDelete?: (postId: string) => void;
}

export default function FeedPostCard({ post, currentUser, onEdit, onDelete }: FeedPostCardProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [isReactionSelectorOpen, setIsReactionSelectorOpen] = useState(false);
  const [isReactionListOpen, setIsReactionListOpen] = useState(false);
  const [isCommentSheetOpen, setIsCommentSheetOpen] = useState(false);
  const reactionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [isMediaViewerOpen, setIsMediaViewerOpen] = useState(false);
  const [initialMediaIndex, setInitialMediaIndex] = useState(0);
  const [localMyReaction, setLocalMyReaction] = useState<ReactionType | null>(post.myReaction || null);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!currentUser?.uid || !post.id) return;
    let isMounted = true;
    const fetchReaction = async () => {
      try {
        const { getDoc, doc } = await import('firebase/firestore');
        const { db } = await import('@/lib/firebase/clientApp');
        const reactionRef = doc(db, 'feeds', post.id, 'reactions', currentUser.uid);
        const snap = await getDoc(reactionRef);
        if (isMounted) {
          if (snap.exists()) {
            setLocalMyReaction(snap.data().type as ReactionType);
          } else {
            setLocalMyReaction(null);
          }
        }
      } catch(e) {
        console.error('Failed to fetch reaction', e);
      }
    };
    fetchReaction();
    return () => { isMounted = false; };
  }, [post.id, currentUser]);

  const mediaItems = post.media || [];
  const normalizedMedia = mediaItems.map(m => {
    if (typeof m === 'string') return { url: m, type: 'image' as const };
    return { url: m.url, type: m.type || 'image' };
  });
  const hasMedia = normalizedMedia.length > 0;
  const isShortText = !hasMedia && !post.isAnnouncement && post.content.length <= 70;
  const isAuthor = currentUser?.uid === post.userId;

  const getTimeAgo = () => {
    if (!post.createdAt) return '방금 전';
    try {
      const date = typeof (post.createdAt as any).toDate === 'function' 
        ? (post.createdAt as any).toDate() 
        : new Date(post.createdAt as any);
      return formatDistanceToNow(date, { addSuffix: true, locale: ko });
    } catch (e) {
      return '최근';
    }
  };

  const timeAgo = getTimeAgo();
  const myReaction = (() => {
    const type = localMyReaction || post.myReaction;
    if (!type) return { icon: 'favorite', color: 'text-on-surface-variant/50', emoji: null };
    const info: Record<ReactionType, { icon: string; color: string; emoji: string }> = {
      LIKE: { icon: 'favorite', color: 'text-[#FF3B30]', emoji: '❤️' },
      LOVE: { icon: 'recommend', color: 'text-[#007AFF]', emoji: '👍' },
      FIRE: { icon: 'local_fire_department', color: 'text-[#FF9500]', emoji: '🔥' },
      HAHA: { icon: 'sentiment_very_satisfied', color: 'text-[#FFCC00]', emoji: '😂' },
      WOW: { icon: 'sentiment_surprised', color: 'text-[#AF52DE]', emoji: '😮' },
      SAD: { icon: 'sentiment_dissatisfied', color: 'text-[#8E8E93]', emoji: '😢' },
    };
    return info[type] || { icon: 'favorite', color: 'text-[#FF3B30]', emoji: '❤️' };
  })();

  const [localLikesCount, setLocalLikesCount] = useState(post.likesCount || 0);

  useEffect(() => {
    setLocalLikesCount(post.likesCount || 0);
  }, [post.likesCount]);

  const handleReactionSelect = async (type: ReactionType) => {
    if (!currentUser?.uid) {
      alert("로그인이 필요한 기능입니다.");
      return;
    }
    
    const previousReaction = localMyReaction;
    const isSameReaction = previousReaction === type;
    
    // Optimistic UI update
    setLocalMyReaction(isSameReaction ? null : type);
    if (!previousReaction) {
      setLocalLikesCount(prev => prev + 1);
    } else if (isSameReaction) {
      setLocalLikesCount(prev => Math.max(0, prev - 1));
    }
    
    setIsReactionSelectorOpen(false);
    
    try {
      await feedService.toggleReaction(post.id, currentUser.uid, currentUser.displayName || 'Anonymous', type);
    } catch (error) { 
      console.error(error); 
      // Revert on error
      setLocalMyReaction(previousReaction);
      if (!previousReaction) {
        setLocalLikesCount(prev => Math.max(0, prev - 1));
      } else if (isSameReaction) {
        setLocalLikesCount(prev => prev + 1);
      }
    }
  };

  const renderHeader = (isOfficial = false) => (
    <div className="flex justify-between items-start mb-4">
      <div className="flex gap-3 items-center">
        {isOfficial ? (
          <div className="w-10 h-10 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-bold font-headline">
            FT
          </div>
        ) : (
          <img
            alt={post.userName}
            className="w-10 h-10 rounded-full object-cover border border-outline-variant/10"
            src={post.userPhoto || post.authorPhoto || 'https://lh3.googleusercontent.com/a/default-user'}
          />
        )}
        <div>
          {isOfficial ? (
            <div className="flex items-baseline gap-1.5 flex-wrap">
              <h3 className="font-headline font-bold text-on-surface text-sm leading-tight">
                Freestyle Tango Official
              </h3>
            </div>
          ) : (
            <DualText 
              text={post.userName || post.authorName || 'Unknown User'}
              subText={post.userNameNative || post.authorNameNative}
              primaryClassName="font-headline font-bold text-on-surface text-sm leading-tight"
              secondaryClassName="text-[11px] font-medium text-on-surface-variant leading-tight"
              containerClassName="flex-wrap items-baseline gap-1.5"
            />
          )}
          <p className="text-on-surface-variant text-xs font-medium">{timeAgo}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {post.isAnnouncement && (
          <span className="bg-tertiary-container/30 text-on-tertiary-container font-label text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full">
            Announcement
          </span>
        )}
        <div className="relative" ref={menuRef}>
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-on-surface-variant hover:bg-surface p-1 rounded-full transition-colors">
            <span className="material-symbols-outlined">more_horiz</span>
          </button>
          {isMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-surface-container-lowest rounded-xl shadow-xl border border-outline-variant/10 z-50 py-1 overflow-hidden">
              {isAuthor ? (
                <>
                  <button onClick={() => { onEdit?.(post); setIsMenuOpen(false); }} className="w-full px-4 py-2 text-left text-sm hover:bg-primary/10 flex items-center gap-3 text-on-surface">
                    <span className="material-symbols-outlined text-lg">edit</span> Edit Post
                  </button>
                  <button onClick={() => { onDelete?.(post.id); setIsMenuOpen(false); }} className="w-full px-4 py-2 text-left text-sm hover:bg-error/10 flex items-center gap-3 text-error">
                    <span className="material-symbols-outlined text-lg">delete</span> Delete Post
                  </button>
                </>
              ) : (
                <button onClick={() => setIsMenuOpen(false)} className="w-full px-4 py-2 text-left text-sm hover:bg-primary/10 flex items-center gap-3 text-on-surface">
                  <span className="material-symbols-outlined text-lg">report</span> Report
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderFooter = (bgColor = "transparent") => (
    <div className={`p-4 sm:px-6 border-t border-outline-variant/10 flex justify-between items-center text-on-surface-variant`} style={{ backgroundColor: bgColor }}>
      <div className="flex gap-6">
        <div className="flex items-center gap-1.5 relative">
          <button 
            onClick={() => handleReactionSelect('LIKE')}
            onMouseEnter={() => !('ontouchstart' in window) && setIsReactionSelectorOpen(true)}
            className={`flex items-center transition-all active:scale-90 group ${myReaction.color}`}
          >
            {localMyReaction || post.myReaction ? (
              <span className="text-xl">{myReaction.emoji}</span>
            ) : (
              <span className="material-symbols-outlined group-hover:scale-110 transition-transform">favorite</span>
            )}
          </button>
          <button onClick={() => setIsReactionListOpen(true)} className="text-xs font-bold hover:underline">
            {localLikesCount}
          </button>
          <AnimatePresence>
            {isReactionSelectorOpen && (
              <ReactionSelector onSelect={handleReactionSelect} onClose={() => setIsReactionSelectorOpen(false)} />
            )}
          </AnimatePresence>
        </div>
        <button onClick={() => setIsCommentSheetOpen(true)} className="flex items-center gap-2 hover:text-primary transition-colors group">
          <span className="material-symbols-outlined group-hover:scale-110 transition-transform">chat_bubble</span>
          <span className="text-xs font-medium">{post.commentsCount || 0}</span>
        </button>
      </div>
      <button className="hover:text-primary transition-colors group">
        <span className="material-symbols-outlined group-hover:scale-110 transition-transform">share</span>
      </button>
      
      <ReactionListBottomSheet post={post} isOpen={isReactionListOpen} onClose={() => setIsReactionListOpen(false)} />
      <CommentBottomSheet post={post} isOpen={isCommentSheetOpen} onClose={() => setIsCommentSheetOpen(false)} currentUser={currentUser} />
    </div>
  );

  // Announcement Style
  if (post.isAnnouncement) {
    const eventDate = typeof (post.createdAt as any).toDate === 'function' ? (post.createdAt as any).toDate() : new Date(post.createdAt as any);
    return (
      <article className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/10 overflow-hidden transform transition-transform hover:scale-[0.99]">
        <div className="p-4 sm:p-6 pb-3">
          {renderHeader(true)}
          {post.title && <h4 className="font-headline font-bold text-lg mb-2 text-primary">{post.title}</h4>}
          <p className="text-on-surface text-sm mb-4 leading-relaxed whitespace-pre-wrap">{post.content}</p>
          
          <div className="bg-surface rounded-lg p-3 flex items-center gap-4 mb-4">
            <div className="bg-surface-container-lowest w-12 h-12 rounded flex flex-col items-center justify-center border border-outline-variant/20 shadow-sm">
              <span className="text-[10px] font-bold text-error uppercase">{eventDate.toLocaleDateString('en-US', { month: 'short' })}</span>
              <span className="text-lg font-headline font-extrabold leading-none">{eventDate.getDate()}</span>
            </div>
            <div>
              <p className="font-bold text-sm">Official Event / Announcement</p>
              <p className="text-xs text-on-surface-variant">{eventDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>
            </div>
            <div className="ml-auto">
              <button className="bg-secondary-container text-on-secondary-container font-label text-[11px] font-bold uppercase tracking-wider px-4 py-2 rounded-full hover:bg-secondary-container/80 transition-colors">
                Detail
              </button>
            </div>
          </div>
        </div>
        {renderFooter("rgba(0,0,0,0.02)")}
      </article>
    );
  }

  // Quote Style
  if (isShortText) {
    return (
      <article className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/10 p-4 sm:p-6 transform transition-transform hover:scale-[0.99]">
        {renderHeader()}
        <div className="bg-secondary-container/20 rounded-lg p-4 mb-4 border border-secondary-container/50">
          <p className="text-on-surface text-lg font-headline font-semibold leading-tight text-center">
            "{post.content}"
          </p>
        </div>
        {renderFooter()}
      </article>
    );
  }

  // Standard / Image Style
  return (
    <article className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/10 overflow-hidden transform transition-transform hover:scale-[0.99]">
      <div className="p-4 sm:p-6 pb-3">
        {renderHeader()}
        <p className="text-on-surface text-sm mb-4 leading-relaxed whitespace-pre-wrap">{post.content}</p>
      </div>
      
      {hasMedia && (
        <div className="px-4 sm:px-6 mb-4">
          <div className={`grid gap-2 ${normalizedMedia.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
            <div 
              className={`aspect-square rounded-xl overflow-hidden border border-outline-variant/10 relative cursor-pointer group ${normalizedMedia.length === 1 ? 'aspect-video' : ''}`}
              onClick={() => { setInitialMediaIndex(0); setIsMediaViewerOpen(true); }}
            >
              {normalizedMedia[0].type === 'video' ? (
                <>
                  <video src={normalizedMedia[0].url} className="w-full h-full object-cover" muted playsInline />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
                    <div className="w-12 h-12 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white">
                      <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
                    </div>
                  </div>
                </>
              ) : (
                <img alt="Post content" className="w-full h-full object-cover group-hover:brightness-95 transition-all" src={normalizedMedia[0].url} />
              )}
            </div>
            
            {normalizedMedia.length > 1 && (
              <div className="grid grid-rows-2 gap-2">
                <div 
                  className="aspect-square rounded-xl overflow-hidden border border-outline-variant/10 relative cursor-pointer group"
                  onClick={() => { setInitialMediaIndex(1); setIsMediaViewerOpen(true); }}
                >
                  {normalizedMedia[1].type === 'video' ? (
                    <>
                      <video src={normalizedMedia[1].url} className="w-full h-full object-cover" muted playsInline />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
                        <div className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white">
                          <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <img alt="Post content" className="w-full h-full object-cover group-hover:brightness-95 transition-all" src={normalizedMedia[1].url} />
                  )}
                </div>
                
                {normalizedMedia.length > 2 ? (
                  <div 
                    className="aspect-square rounded-xl overflow-hidden border border-outline-variant/10 relative cursor-pointer group"
                    onClick={() => { setInitialMediaIndex(2); setIsMediaViewerOpen(true); }}
                  >
                    {normalizedMedia[2].type === 'video' ? (
                      <video src={normalizedMedia[2].url} className="w-full h-full object-cover" muted playsInline />
                    ) : (
                      <img alt="Post content" className="w-full h-full object-cover group-hover:brightness-95 transition-all" src={normalizedMedia[2].url} />
                    )}
                    {normalizedMedia[2].type === 'video' && normalizedMedia.length <= 3 && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
                        <div className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white">
                          <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
                        </div>
                      </div>
                    )}
                    {normalizedMedia.length > 3 && (
                      <div className="absolute inset-0 bg-black/50 hover:bg-black/60 transition-colors flex items-center justify-center text-white font-bold text-2xl">
                        +{normalizedMedia.length - 3}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="aspect-square rounded-xl bg-surface border border-outline-variant/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-outline-variant text-4xl opacity-50">image</span>
                  </div>
                )}
              </div>
            )}
          </div>
          {(post.likesCount || 0) > 10 && (
            <div className="mt-3 inline-flex items-center gap-1 bg-surface-container-lowest/90 backdrop-blur-md px-3 py-1 rounded-full shadow-sm border border-outline-variant/10">
              <span className="material-symbols-outlined text-[14px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>local_fire_department</span>
              <span className="font-label text-[10px] font-bold text-primary uppercase tracking-wider">Trending</span>
            </div>
          )}
        </div>
      )}
      {renderFooter()}
      <MediaViewerPopup 
        isOpen={isMediaViewerOpen} 
        onClose={() => setIsMediaViewerOpen(false)} 
        media={normalizedMedia as any} 
        initialIndex={initialMediaIndex} 
      />
    </article>
  );
}
