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

interface FeedPostCardProps {
  post: Post;
  currentUser?: any;
  onEdit?: (post: Post) => void;
  onDelete?: (postId: string) => void;
}

export default function FeedPostCard({ post, currentUser, onEdit, onDelete }: FeedPostCardProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  
  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 1. 데이터 기반 조건 설정 (타입 가드 및 필드 정규화)
  const mediaItems = post.media || [];
  const mediaUrls = mediaItems.map(m => typeof m === 'string' ? m : m.url);
  const hasMedia = mediaUrls.length > 0;
  const isShortText = !hasMedia && post.content.length <= 70;
  const isMultiMedia = mediaUrls.length > 1;
  const isAuthor = currentUser?.uid === post.userId;

  // 상대 시간 계산 (Firebase Timestamp 대응)
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

  // 공통 헤더 렌더링
  const renderHeader = () => (
    <div className="flex justify-between items-start mb-4">
      <div className="flex gap-3 items-center">
        <img
          alt={post.userName}
          className="w-10 h-10 rounded-full object-cover border border-outline-variant/10"
          src={post.userPhoto || post.authorPhoto || 'https://lh3.googleusercontent.com/a/default-user'}
        />
        <div>
          <h3 className="font-headline font-bold text-on-surface text-sm leading-tight">{post.userName || post.authorName}</h3>
          <div className="flex items-center gap-1.5 text-on-surface-variant text-xs font-medium mt-0.5">
            <span>{timeAgo}</span>
            {post.location?.city && (
              <>
                <span className="w-1 h-1 rounded-full bg-on-surface-variant/30" />
                <span className="flex items-center gap-0.5">
                  <span className="material-symbols-outlined text-[14px]">location_on</span>
                  {post.location.city}
                </span>
              </>
            )}
          </div>
        </div>
      </div>
      
      <div className="relative" ref={menuRef}>
        <button 
          onClick={(e) => {
            e.stopPropagation();
            setIsMenuOpen(!isMenuOpen);
          }}
          className="text-on-surface-variant hover:bg-surface p-1 rounded-full transition-colors"
        >
          <span className="material-symbols-outlined">more_horiz</span>
        </button>

        {isMenuOpen && (
          <div className="absolute right-0 mt-2 w-48 bg-surface-container-highest rounded-xl shadow-xl border border-outline-variant/10 z-50 py-1 overflow-hidden">
            {isAuthor ? (
              <>
                <button 
                  onClick={() => {
                    onEdit?.(post);
                    setIsMenuOpen(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-primary/10 flex items-center gap-3 text-on-surface transition-colors"
                >
                  <span className="material-symbols-outlined text-lg">edit</span>
                  Edit Post
                </button>
                <button 
                  onClick={() => {
                    onDelete?.(post.id);
                    setIsMenuOpen(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-error/10 flex items-center gap-3 text-error transition-colors"
                >
                  <span className="material-symbols-outlined text-lg">delete</span>
                  Delete Post
                </button>
              </>
            ) : (
              <button 
                onClick={() => {
                  alert('Reporting is not implemented yet.');
                  setIsMenuOpen(false);
                }}
                className="w-full px-4 py-2 text-left text-sm hover:bg-primary/10 flex items-center gap-3 text-on-surface transition-colors"
              >
                <span className="material-symbols-outlined text-lg">report</span>
                Report Post
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );

  const [isReactionSelectorOpen, setIsReactionSelectorOpen] = useState(false);
  const [isReactionListOpen, setIsReactionListOpen] = useState(false);
  const [isCommentSheetOpen, setIsCommentSheetOpen] = useState(false);
  const reactionTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 반응 처리
  const handleReactionSelect = async (type: ReactionType) => {
    if (!currentUser) {
      alert('로그인이 필요한 기능입니다.');
      return;
    }
    
    try {
      await feedService.toggleReaction(
        post.id, 
        currentUser.uid, 
        currentUser.displayName || 'Anonymous', 
        type
      );
      setIsReactionSelectorOpen(false);
    } catch (error) {
      console.error("Failed to toggle reaction:", error);
    }
  };

  const handleHeartPress = () => {
    // 탭하면 기본 'LIKE' 토글
    handleReactionSelect('LIKE');
  };

  const handleHeartLongPressStart = () => {
    reactionTimerRef.current = setTimeout(() => {
      setIsReactionSelectorOpen(true);
    }, 500);
  };

  const handleHeartLongPressEnd = () => {
    if (reactionTimerRef.current) {
      clearTimeout(reactionTimerRef.current);
    }
  };

  // 내 반응 아이콘/컬러 결정
  const getMyReactionInfo = () => {
    const type = post.myReaction;
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
  };

  const myReaction = getMyReactionInfo();

  // 공통 푸터 렌더링
  const renderFooter = () => (
    <div className="p-4 sm:px-6 border-t border-outline-variant/10 flex justify-between items-center text-on-surface-variant">
      <div className="flex gap-6">
        <div className="flex items-center gap-1.5 relative">
          <button 
            onClick={handleHeartPress}
            onMouseDown={handleHeartLongPressStart}
            onMouseUp={handleHeartLongPressEnd}
            onMouseLeave={handleHeartLongPressEnd}
            onTouchStart={handleHeartLongPressStart}
            onTouchEnd={handleHeartLongPressEnd}
            onMouseEnter={() => !('ontouchstart' in window) && setIsReactionSelectorOpen(true)}
            className={`flex items-center transition-all active:scale-90 group ${myReaction.color}`}
          >
            {post.myReaction ? (
              <span className="text-xl animate-in zoom-in-50 duration-300">{myReaction.emoji}</span>
            ) : (
              <span className={`material-symbols-outlined group-hover:scale-110 transition-transform`} style={{ fontVariationSettings: "'FILL' 0" }}>
                {myReaction.icon}
              </span>
            )}
          </button>

          {/* Likes Count (Clickable to show list) */}
          <button 
            onClick={() => setIsReactionListOpen(true)}
            className="text-xs font-bold hover:underline text-on-surface-variant"
          >
            {post.likesCount || post.likes || 0}
          </button>
          
          {/* Reaction Selector Popup */}
          <AnimatePresence>
            {isReactionSelectorOpen && (
              <ReactionSelector 
                onSelect={handleReactionSelect} 
                onClose={() => setIsReactionSelectorOpen(false)} 
              />
            )}
          </AnimatePresence>
        </div>

        <button 
          onClick={() => setIsCommentSheetOpen(true)}
          className="flex items-center gap-2 hover:text-primary transition-colors group text-on-surface-variant"
        >
          <span className="material-symbols-outlined group-hover:scale-110 transition-transform">chat_bubble</span>
          <span className="text-xs font-medium">{post.commentsCount || 0}</span>
        </button>
      </div>
      <button className="flex items-center gap-2 hover:text-primary transition-colors group">
        <span className="material-symbols-outlined group-hover:scale-110 transition-transform">share</span>
      </button>

      {/* Bottom Sheets */}
      <ReactionListBottomSheet 
        post={post} 
        isOpen={isReactionListOpen} 
        onClose={() => setIsReactionListOpen(false)} 
      />
      <CommentBottomSheet 
        post={post} 
        isOpen={isCommentSheetOpen} 
        onClose={() => setIsCommentSheetOpen(false)} 
        currentUser={currentUser}
      />
    </div>
  );

  // Case 1: 70자 이하 텍스트 Only (Highlight/Quote Design)
  if (isShortText) {
    return (
      <article className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/10 p-4 sm:p-6 transform transition-transform hover:scale-[0.99]">
        {renderHeader()}
        <div className="bg-secondary-container/20 rounded-lg p-6 mb-4 border border-secondary-container/50 relative overflow-hidden">
          <span className="material-symbols-outlined absolute -top-2 -left-1 text-secondary-container/30 text-6xl select-none">format_quote</span>
          <p className="text-on-surface text-lg font-headline font-semibold leading-tight text-center relative z-10 italic">
            "{post.content}"
          </p>
        </div>
        {renderFooter()}
      </article>
    );
  }

  // Case 3 & 4: 이미지/미디어가 있는 경우
  if (hasMedia) {
    return (
      <article className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/10 overflow-hidden transform transition-transform hover:scale-[0.99]">
        <div className="p-4 sm:p-6 pb-3">
          {renderHeader()}
          <p className="text-on-surface text-sm mb-4 leading-relaxed whitespace-pre-wrap">
            {post.content}
          </p>
        </div>

        <div className="w-full bg-surface relative">
          {isMultiMedia ? (
            <div className={`grid gap-0.5 grid-cols-2`}>
              {mediaItems.slice(0, 4).map((item, idx) => {
                const url = typeof item === 'string' ? item : item.url;
                const type = typeof item === 'string' ? 'image' : item.type;
                
                return (
                  <div key={idx} className={`relative overflow-hidden ${mediaItems.length === 3 && idx === 0 ? 'row-span-2' : 'aspect-square'}`}>
                    {type === 'video' ? (
                      <video 
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                        src={url}
                        muted
                        playsInline
                        loop
                        autoPlay
                      />
                    ) : (
                      <img
                        alt={`Post media ${idx + 1}`}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                        src={url}
                      />
                    )}
                    {idx === 3 && mediaItems.length > 4 && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <span className="text-white font-bold text-lg">+{mediaItems.length - 4}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="aspect-video overflow-hidden">
              {mediaItems[0]?.type === 'video' ? (
                <video 
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                  src={typeof mediaItems[0] === 'string' ? mediaItems[0] : mediaItems[0].url}
                  controls
                  playsInline
                />
              ) : (
                <img
                  alt="Post content"
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                  src={typeof mediaItems[0] === 'string' ? mediaItems[0] : mediaItems[0].url}
                />
              )}
            </div>
          )}

          {/* Trending Tag */}
          {(post.likesCount || post.likes || 0) > 10 && (
            <div className="absolute bottom-4 left-4 bg-surface-container-lowest/90 backdrop-blur-md px-3 py-1 rounded-full shadow-sm flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>local_fire_department</span>
              <span className="font-label text-[10px] font-bold text-primary uppercase tracking-wider">Trending</span>
            </div>
          )}
        </div>

        {renderFooter()}
      </article>
    );
  }

  // Case 2: 70자 초과 텍스트 Only (Standard Design)
  return (
    <article className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/10 overflow-hidden transform transition-transform hover:scale-[0.99]">
      <div className="p-4 sm:p-6 pb-3">
        {renderHeader()}
        <p className="text-on-surface text-sm mb-4 leading-relaxed whitespace-pre-wrap">
          {post.content}
        </p>
      </div>
      {renderFooter()}
    </article>
  );
}
