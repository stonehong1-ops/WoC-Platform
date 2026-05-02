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
import UserBadge from '@/components/common/UserBadge';
interface FeedPostCardProps {
  post: Post;
  currentUser?: any;
  profile?: any;
  onEdit?: (post: Post) => void;
  onDelete?: (postId: string) => void;
}

export default function FeedPostCard({ post, currentUser, profile, onEdit, onDelete }: FeedPostCardProps) {
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
      alert("Please sign in first.");
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

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/plaza`;
    if (navigator.share) {
      try {
        await navigator.share({ title: post.userName ? `${post.userName}의 게시물` : 'WoC 게시물', text: post.content?.slice(0, 100), url: shareUrl });
      } catch (e) { /* user cancelled */ }
    } else {
      await navigator.clipboard.writeText(shareUrl);
      alert('Link copied to clipboard.');
    }
  };

  const renderHeader = (isOfficial = false) => (
    <div className="flex justify-between items-start mb-4">
      {isOfficial ? (
        <div className="flex gap-3 items-center">
          <div className="w-10 h-10 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-bold font-headline">
            FT
          </div>
          <div>
            <div className="flex items-baseline gap-1.5 flex-wrap">
              <h3 className="font-headline font-bold text-on-surface text-sm leading-tight">
                Freestyle Tango Official
              </h3>
            </div>
            <p className="text-on-surface-variant text-xs font-medium">{timeAgo}</p>
          </div>
        </div>
      ) : (
        <UserBadge
          uid={post.userId || (post as any).authorId || ''}
          nickname={post.userName || (post as any).authorName || 'Unknown User'}
          nativeNickname={post.userNameNative || (post as any).authorNameNative}
          photoURL={post.userPhoto || (post as any).authorPhoto}
          avatarSize="w-10 h-10"
          nameClassName="font-headline font-bold text-on-surface text-sm leading-tight"
          nativeClassName="text-[11px] font-medium text-on-surface-variant leading-tight"
          subText={<p className="text-on-surface-variant text-xs font-medium">{timeAgo}</p>}
        />
      )}
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
                <>
                  <button onClick={async () => {
                    setIsMenuOpen(false);
                    if (!currentUser) return;
                    const pinnedPostIds = (profile as any)?.pinnedPostIds || [];
                    const isPinned = pinnedPostIds.includes(post.id);
                    try {
                      await feedService.togglePinPost(currentUser.uid, post.id, isPinned);
                    } catch (error) {
                      alert("Failed to update pin status.");
                    }
                  }} className="w-full px-4 py-2 text-left text-sm hover:bg-primary/10 flex items-center gap-3 text-on-surface">
                    <span className="material-symbols-outlined text-lg">{((profile as any)?.pinnedPostIds || []).includes(post.id) ? 'keep_off' : 'keep'}</span> 
                    {((profile as any)?.pinnedPostIds || []).includes(post.id) ? 'Unpin Post' : 'Pin Post'}
                  </button>
                  <button onClick={() => setIsMenuOpen(false)} className="w-full px-4 py-2 text-left text-sm hover:bg-primary/10 flex items-center gap-3 text-on-surface">
                    <span className="material-symbols-outlined text-lg">report</span> Report
                  </button>
                </>
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
        {/* Reaction 영역: 호버 딜레이로 깜빡임 방지 */}
        <div
          className="flex items-center gap-1.5 relative"
          onMouseEnter={() => { if (reactionTimerRef.current) clearTimeout(reactionTimerRef.current); }}
          onMouseLeave={() => {
            reactionTimerRef.current = setTimeout(() => setIsReactionSelectorOpen(false), 250);
          }}
        >
          <button
            onClick={(e) => { e.stopPropagation(); setIsReactionSelectorOpen(prev => !prev); }}
            onMouseEnter={() => { if (!('ontouchstart' in window)) { if (reactionTimerRef.current) clearTimeout(reactionTimerRef.current); setIsReactionSelectorOpen(true); } }}
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
      <button onClick={handleShare} className="hover:text-primary transition-colors group">
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

  // Quote / Color Style
  if (isShortText) {
    const style = (post as any).shortTextStyle;
    const hasColorStyle = style?.bgColor && style.bgColor !== 'transparent';
    const contentClass = hasColorStyle
      ? `${style.impactClass || 'text-xl font-normal'} ${(style.emphasisClasses || []).join(' ')}`
      : 'text-on-surface text-lg font-headline font-semibold leading-tight';
    return (
      <article className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/10 overflow-hidden transform transition-transform hover:scale-[0.99]">
        <div className="p-4 sm:p-6 pb-0">{renderHeader()}</div>
        {hasColorStyle ? (
          <div
            className="mx-4 sm:mx-6 mb-4 rounded-xl p-6 min-h-[120px] flex items-center justify-center"
            style={{ background: style.bgColor, color: style.textColor }}
          >
            <p className={`text-center break-words w-full ${contentClass}`} style={{ color: style.textColor }}>
              {post.content}
            </p>
          </div>
        ) : (
          <div className="mx-4 sm:mx-6 mb-4 bg-secondary-container/20 rounded-lg p-4 border border-secondary-container/50">
            <p className={`text-center ${contentClass}`}>"{post.content}"</p>
          </div>
        )}
        {renderFooter()}
      </article>
    );
  }

  // 미디어 아이템 렌더 헬퍼 (비디오 아이콘 + 오버레이 포함)
  const renderMediaThumb = (item: { url: string; type: string }, index: number, showMoreOverlay?: boolean, moreCount?: number) => (
    <div
      key={index}
      className="relative w-full h-full overflow-hidden cursor-pointer group"
      onClick={() => { setInitialMediaIndex(index); setIsMediaViewerOpen(true); }}
    >
      {item.type === 'video' ? (
        <>
          <video src={item.url} className="w-full h-full object-cover" autoPlay loop muted playsInline />
          {!showMoreOverlay && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/25 group-hover:bg-black/35 transition-colors">
              <div className="w-11 h-11 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white shadow-lg">
                <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
              </div>
            </div>
          )}
        </>
      ) : (
        <img
          alt={`Post media ${index + 1}`}
          src={item.url}
          className="w-full h-full object-cover group-hover:brightness-95 transition-all duration-200 select-none"
          draggable={false}
        />
      )}
      {showMoreOverlay && (
        <div className="absolute inset-0 bg-black/55 group-hover:bg-black/65 transition-colors flex items-center justify-center">
          <span className="text-white font-bold text-2xl drop-shadow-lg">+{moreCount}</span>
        </div>
      )}
    </div>
  );

  // 미디어 그리드 레이아웃
  const renderMediaGrid = () => {
    const count = normalizedMedia.length;
    if (count === 0) return null;

    // 1장: 풀 너비, 4:5 세로 비율
    if (count === 1) {
      return (
        <div className="rounded-xl overflow-hidden border border-outline-variant/10 aspect-[4/5]">
          {renderMediaThumb(normalizedMedia[0], 0)}
        </div>
      );
    }

    // 2장: 50:50 나란히, 1:1
    if (count === 2) {
      return (
        <div className="grid grid-cols-2 gap-1.5">
          {normalizedMedia.map((item, i) => (
            <div key={i} className="aspect-square rounded-xl overflow-hidden border border-outline-variant/10">
              {renderMediaThumb(item, i)}
            </div>
          ))}
        </div>
      );
    }

    // 3장: 상단 1장 풀너비(16:9) + 하단 2장 균등(1:1)
    if (count === 3) {
      return (
        <div className="flex flex-col gap-1.5">
          <div className="aspect-video rounded-xl overflow-hidden border border-outline-variant/10">
            {renderMediaThumb(normalizedMedia[0], 0)}
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {[normalizedMedia[1], normalizedMedia[2]].map((item, i) => (
              <div key={i + 1} className="aspect-square rounded-xl overflow-hidden border border-outline-variant/10">
                {renderMediaThumb(item, i + 1)}
              </div>
            ))}
          </div>
        </div>
      );
    }

    // 4장: 2×2 균등 그리드
    if (count === 4) {
      return (
        <div className="grid grid-cols-2 gap-1.5">
          {normalizedMedia.map((item, i) => (
            <div key={i} className="aspect-square rounded-xl overflow-hidden border border-outline-variant/10">
              {renderMediaThumb(item, i)}
            </div>
          ))}
        </div>
      );
    }

    // 5장+: 2×2 + 마지막 셀에 +N 오버레이
    return (
      <div className="grid grid-cols-2 gap-1.5">
        {normalizedMedia.slice(0, 3).map((item, i) => (
          <div key={i} className="aspect-square rounded-xl overflow-hidden border border-outline-variant/10">
            {renderMediaThumb(item, i)}
          </div>
        ))}
        <div className="aspect-square rounded-xl overflow-hidden border border-outline-variant/10">
          {renderMediaThumb(normalizedMedia[3], 3, true, count - 4)}
        </div>
      </div>
    );
  };

  // Standard / Image Style
  return (
    <article className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/10 overflow-hidden transform transition-transform hover:scale-[0.99]">
      <div className="p-4 sm:p-6 pb-3">
        {renderHeader()}
        <p className="text-on-surface text-sm mb-4 leading-relaxed whitespace-pre-wrap">{post.content}</p>
      </div>

      {hasMedia && (
        <div className="px-4 sm:px-6 mb-4">
          {renderMediaGrid()}
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
