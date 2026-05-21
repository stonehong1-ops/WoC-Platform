'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Post, ReactionType } from '@/types/feed';

import { motion, AnimatePresence } from 'framer-motion';
import { feedService } from '@/lib/firebase/feedService';
import ReactionSelector from './ReactionSelector';
import ReactionListBottomSheet from './ReactionListBottomSheet';
import CommentBottomSheet from './CommentBottomSheet';
import MediaViewerPopup from './MediaViewerPopup';
import { DualText } from '@/components/social/SocialHeroCard';
import UserBadge from '@/components/common/UserBadge';
import { useModalNavigation } from '@/hooks/useModalNavigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { KIND_ICON, KIND_COLOR } from '@/constants/tags';

interface FeedPostCardProps {
  post: Post;
  currentUser?: any;
  profile?: any;
  onEdit?: (post: Post) => void;
  onDelete?: (postId: string) => void;
  hideUserInfo?: boolean;
}

export default function FeedPostCard({ post, currentUser, profile, onEdit, onDelete, hideUserInfo }: FeedPostCardProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [isReactionSelectorOpen, setIsReactionSelectorOpen] = useState(false);
  const { t, language, formatRelativeTime, formatDate } = useLanguage();
  
  const { openModal: openReactions, closeModal: closeReactions, value: reactionsPostId } = useModalNavigation('reactions');
  const { openModal: openComments, closeModal: closeComments, value: commentsPostId } = useModalNavigation('comments');
  const { openModal: openMedia, closeModal: closeMedia, value: mediaPostId, searchParams } = useModalNavigation('media');
  
  const isReactionListOpen = reactionsPostId === post.id;
  const isCommentSheetOpen = commentsPostId === post.id;
  const isMediaViewerOpen = mediaPostId === post.id;
  const initialMediaIndex = parseInt(searchParams.get('mediaIdx') || '0');

  const reactionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [localMyReaction, setLocalMyReaction] = useState<ReactionType | null>(post.myReaction || null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [prevPostId, setPrevPostId] = useState(post.id);

  if (post.id !== prevPostId) {
    setIsExpanded(false);
    setPrevPostId(post.id);
  }

  const cardRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = cardRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) {
          setIsExpanded(false);
        }
      },
      {
        threshold: 0,
      }
    );

    observer.observe(element);
    return () => {
      observer.unobserve(element);
    };
  }, []);

  const getTruncatedContent = (content: string) => {
    if (isExpanded) return { text: content, shouldTruncate: false };
    const lines = content.split('\n');
    const MAX_LINES = 5;
    const MAX_CHARS = 180;
    let needsTruncation = false;
    let truncatedText = content;
    if (lines.length > MAX_LINES) {
      truncatedText = lines.slice(0, MAX_LINES).join('\n');
      needsTruncation = true;
    }
    if (truncatedText.length > MAX_CHARS) {
      truncatedText = truncatedText.slice(0, MAX_CHARS);
      needsTruncation = true;
    }
    return {
      text: truncatedText,
      shouldTruncate: needsTruncation || content.length > truncatedText.length
    };
  };
  
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
  const isAdmin = profile?.systemRole === 'admin' || profile?.isAdmin;
  const canEditOrDelete = isAuthor || isAdmin;

  const getTimeAgo = () => {
    if (!post.createdAt) return t('plaza.just_now');
    try {
      return formatRelativeTime(post.createdAt);
    } catch (e) {
      return t('plaza.recent');
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
      alert(t('plaza.sign_in_first'));
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
        await navigator.share({ title: post.userName ? `${post.userName}'s post` : 'WoC Post', text: post.content?.slice(0, 100), url: shareUrl });
      } catch (e) { /* user cancelled */ }
    } else {
      await navigator.clipboard.writeText(shareUrl);
      alert(t('plaza.link_copied'));
    }
  };

  const renderTags = () => {
    const tags = post.postTags || post.tags;
    if (!tags || tags.length === 0) return null;
    return (
      <div className="flex flex-wrap gap-2 mt-3 mb-1 px-1">
        {tags.map((tag: any, idx: number) => {
          if (typeof tag === 'string') {
            return (
              <span key={idx} className="px-3 py-1 bg-surface-container rounded-full font-label-sm text-label-sm text-on-surface-variant">#{tag}</span>
            );
          }
          return (
            <div key={tag.id || idx} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-outline-variant/30 font-label-sm text-xs ${KIND_COLOR[tag.kind] || 'text-on-surface-variant bg-surface-container'}`}>
              <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                {KIND_ICON[tag.kind] || 'label'}
              </span>
              <span className="font-medium truncate max-w-[120px]">{tag.label}</span>
            </div>
          );
        })}
      </div>
    );
  };

  const renderHeader = (isOfficial = false) => (
    <div className="flex justify-between items-center mb-3">
      {isOfficial ? (
        <div className="flex gap-3 items-center">
          <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-bold font-headline text-xs">
            FT
          </div>
          <div>
            <div className="flex items-baseline gap-1.5 flex-wrap">
              <h3 className="font-headline font-bold text-on-surface text-[13px] leading-tight">
                Freestyle Tango Official
              </h3>
            </div>
          </div>
        </div>
      ) : (
        <UserBadge
          uid={hideUserInfo ? '' : (post.userId || (post as any).authorId || '')}
          nickname={hideUserInfo ? t('help_desk.anonymous') : (post.userName || (post as any).authorName || 'Unknown User')}
          nativeNickname={hideUserInfo ? null : (post.userNameNative || (post as any).authorNameNative)}
          photoURL={hideUserInfo ? null : (post.userPhoto || (post as any).authorPhoto)}
          avatarSize="w-8 h-8"
          nameClassName="font-headline font-bold text-on-surface text-[13px] leading-tight"
          nativeClassName="text-[11px] font-normal text-on-surface-variant leading-tight ml-1"
          subText={null}
        />
      )}
      <div className="flex items-center gap-2">
        {post.isAnnouncement && (
          <span className="bg-tertiary-container/30 text-on-tertiary-container font-label text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
            {t('plaza.announcement')}
          </span>
        )}
        <div className="relative" ref={menuRef}>
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-on-surface hover:bg-surface-container p-1 rounded-full transition-colors flex items-center">
            <span className="material-symbols-outlined text-[20px]">more_horiz</span>
          </button>
          {isMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-surface-container-lowest rounded-xl shadow-xl border border-outline-variant/10 z-50 py-1 overflow-hidden">
              {canEditOrDelete ? (
                <>
                  <button onClick={() => { onEdit?.(post); setIsMenuOpen(false); }} className="w-full px-4 py-2 text-left text-sm hover:bg-primary/10 flex items-center gap-3 text-on-surface">
                    <span className="material-symbols-outlined text-lg">edit</span> {t('plaza.edit_post')}
                  </button>
                  <button onClick={() => { onDelete?.(post.id); setIsMenuOpen(false); }} className="w-full px-4 py-2 text-left text-sm hover:bg-error/10 flex items-center gap-3 text-error">
                    <span className="material-symbols-outlined text-lg">delete</span> {t('plaza.delete_post')}
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => setIsMenuOpen(false)} className="w-full px-4 py-2 text-left text-sm hover:bg-primary/10 flex items-center gap-3 text-on-surface">
                    <span className="material-symbols-outlined text-lg">report</span> {t('plaza.report')}
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderActionBar = () => (
    <div className="flex justify-between items-center">
      <div className="flex gap-4 items-center text-on-surface">
        <div
          className="relative flex items-center"
          onMouseEnter={() => { if (reactionTimerRef.current) clearTimeout(reactionTimerRef.current); }}
          onMouseLeave={() => {
            reactionTimerRef.current = setTimeout(() => setIsReactionSelectorOpen(false), 250);
          }}
        >
          <button
            onClick={(e) => { e.stopPropagation(); setIsReactionSelectorOpen(prev => !prev); }}
            onMouseEnter={() => { if (!('ontouchstart' in window)) { if (reactionTimerRef.current) clearTimeout(reactionTimerRef.current); setIsReactionSelectorOpen(true); } }}
            className={`transition-transform active:scale-90 flex items-center gap-1 whitespace-nowrap ${localMyReaction || post.myReaction ? myReaction.color : 'text-on-surface'}`}
          >
            {localMyReaction || post.myReaction ? (
              <span className="text-[24px] leading-none">{myReaction.emoji}</span>
            ) : (
              <span className="material-symbols-outlined text-[24px] font-light">favorite</span>
            )}
            {localLikesCount > 0 && (
              <span className="text-xs font-semibold">{localLikesCount}</span>
            )}
          </button>
          <AnimatePresence>
            {isReactionSelectorOpen && (
              <ReactionSelector onSelect={handleReactionSelect} onClose={() => setIsReactionSelectorOpen(false)} />
            )}
          </AnimatePresence>
        </div>
        <button onClick={() => openComments(post.id)} className="transition-transform active:scale-90 flex items-center gap-1 whitespace-nowrap text-on-surface">
          <span className="material-symbols-outlined text-[24px] font-light">chat_bubble</span>
          {post.commentsCount > 0 && (
            <span className="text-xs font-semibold">{post.commentsCount}</span>
          )}
        </button>
        <button onClick={handleShare} className="transition-transform active:scale-90 flex items-center text-on-surface">
          <span className="material-symbols-outlined text-[24px] font-light">share</span>
        </button>
      </div>
      <button onClick={async () => {
        if (!currentUser) {
          alert(t('plaza.sign_in_first'));
          return;
        }
        const pinnedPostIds = (profile as any)?.pinnedPostIds || [];
        const isPinned = pinnedPostIds.includes(post.id);
        try {
          await feedService.togglePinPost(currentUser.uid, post.id, isPinned);
        } catch (error) {
          alert(t('plaza.fail_pin'));
        }
      }} className="transition-transform active:scale-90 flex items-center text-on-surface">
        <span className="material-symbols-outlined text-[24px] font-light">{((profile as any)?.pinnedPostIds || []).includes(post.id) ? 'bookmark' : 'bookmark_border'}</span>
      </button>

      <ReactionListBottomSheet post={post} isOpen={isReactionListOpen} onClose={closeReactions} />
      <CommentBottomSheet post={post} isOpen={isCommentSheetOpen} onClose={closeComments} currentUser={currentUser} profile={profile} hideUserInfo={hideUserInfo} />
    </div>
  );

  // Announcement Style
  if (post.isAnnouncement) {
    const eventDate = typeof (post.createdAt as any).toDate === 'function' ? (post.createdAt as any).toDate() : new Date(post.createdAt as any);
    const { text: renderedContent, shouldTruncate } = getTruncatedContent(post.content);
    return (
      <article ref={cardRef} className="mx-4 mb-4 rounded-2xl border border-outline-variant/30 shadow-sm bg-surface-container-lowest overflow-hidden">
        <div className="px-4 py-3 pb-3">
          {renderHeader(true)}
          {post.title && <h4 className="font-headline font-bold text-[15px] mb-2 text-primary">{post.title}</h4>}
          <p className="text-on-surface text-[14px] font-medium leading-relaxed whitespace-pre-wrap">
            {renderedContent}
            {shouldTruncate && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsExpanded(true);
                }}
                className="text-primary hover:underline ml-1 font-medium text-sm"
              >
                ...more
              </button>
            )}
          </p>
          {renderTags()}
          
          <div className="bg-surface rounded-lg p-3 flex items-center gap-4 mb-2 mt-4">
            <div className="bg-surface-container-lowest w-12 h-12 rounded flex flex-col items-center justify-center border border-outline-variant/20 shadow-sm">
              <span className="text-[10px] font-bold text-error uppercase">{formatDate(eventDate, 'shortMonth')}</span>
              <span className="text-lg font-headline font-extrabold leading-none">{formatDate(eventDate, 'dayOnly')}</span>
            </div>
            <div>
              <p className="font-bold text-sm">{t('plaza.official_event')}</p>
              <p className="text-xs text-on-surface-variant">{formatDate(eventDate, 'timeOnly')}</p>
            </div>
          </div>
        </div>
        <div className="px-4 pb-3">
          {renderActionBar()}
          <p className="text-[10px] text-on-surface-variant font-medium tracking-wide uppercase mt-2">{timeAgo}</p>
        </div>
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
      <article ref={cardRef} className="mx-4 mb-4 rounded-2xl border border-outline-variant/30 shadow-sm bg-surface-container-lowest overflow-hidden">
        <div className="px-4 py-3 pb-2">{renderHeader(post.isOfficial)}</div>
        {hasColorStyle ? (
          <div
            className="w-full py-10 px-6 flex flex-col items-center justify-center min-h-[180px]"
            style={{ background: style.bgColor, color: style.textColor }}
          >
            <p className={`text-center break-words w-full ${contentClass}`} style={{ color: style.textColor }}>
              {post.content}
            </p>
          </div>
        ) : (
          <div className="px-4">
             <div className="bg-secondary-container/20 rounded-lg p-6 border border-secondary-container/50 min-h-[160px] flex items-center justify-center">
               <p className={`text-center ${contentClass}`}>"{post.content}"</p>
             </div>
          </div>
        )}
        <div className="px-4 py-3">
          {renderTags()}
          {renderActionBar()}
          <p className="text-[10px] text-on-surface-variant font-medium tracking-wide uppercase mt-2">{timeAgo}</p>
        </div>
      </article>
    );
  }

  // 미디어 아이템 렌더 헬퍼 (비디오 아이콘 + 오버레이 포함)
  const renderMediaThumb = (item: { url: string; type: string }, index: number, showMoreOverlay?: boolean, moreCount?: number) => (
    <div
      key={index}
      className="relative w-full h-full overflow-hidden cursor-pointer group"
      onClick={() => { openMedia(post.id, { mediaIdx: index.toString() }); }}
    >
      {item.type === 'video' ? (
        <>
          <video src={item.url} className="w-full h-full object-cover" autoPlay loop muted playsInline />
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
        <div className="w-full aspect-[4/5] bg-surface-container-low">
          {renderMediaThumb(normalizedMedia[0], 0)}
        </div>
      );
    }

    // 2장: 50:50 나란히, 1:1
    if (count === 2) {
      return (
        <div className="grid grid-cols-2 gap-[1px]">
          {normalizedMedia.map((item, i) => (
            <div key={i} className="aspect-square bg-surface-container-low">
              {renderMediaThumb(item, i)}
            </div>
          ))}
        </div>
      );
    }

    // 3장: 상단 1장 풀너비(16:9) + 하단 2장 균등(1:1)
    if (count === 3) {
      return (
        <div className="flex flex-col gap-[1px]">
          <div className="aspect-video bg-surface-container-low">
            {renderMediaThumb(normalizedMedia[0], 0)}
          </div>
          <div className="grid grid-cols-2 gap-[1px]">
            {[normalizedMedia[1], normalizedMedia[2]].map((item, i) => (
              <div key={i + 1} className="aspect-square bg-surface-container-low">
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
        <div className="grid grid-cols-2 gap-[1px]">
          {normalizedMedia.map((item, i) => (
            <div key={i} className="aspect-square bg-surface-container-low">
              {renderMediaThumb(item, i)}
            </div>
          ))}
        </div>
      );
    }

    // 5장+: 2×2 + 마지막 셀에 +N 오버레이
    return (
      <div className="grid grid-cols-2 gap-[1px]">
        {normalizedMedia.slice(0, 3).map((item, i) => (
          <div key={i} className="aspect-square bg-surface-container-low">
            {renderMediaThumb(item, i)}
          </div>
        ))}
        <div className="aspect-square bg-surface-container-low relative">
          {renderMediaThumb(normalizedMedia[3], 3, true, count - 4)}
        </div>
      </div>
    );
  };

  // Standard / Image Style
  const { text: renderedContent, shouldTruncate } = getTruncatedContent(post.content);
  return (
    <article ref={cardRef} className="mx-4 mb-4 rounded-2xl border border-outline-variant/30 shadow-sm bg-surface-container-lowest overflow-hidden">
      <div className="px-4 pt-3 pb-1">
        {renderHeader(post.isOfficial)}
      </div>

      {hasMedia && (
        <div className="w-full">
          {renderMediaGrid()}
        </div>
      )}

      <div className="px-4 py-2">
        {renderActionBar()}
        
        <p className="text-[14px] font-medium text-on-surface leading-relaxed whitespace-pre-wrap break-words mt-2">
          {renderedContent}
          {shouldTruncate && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(true);
              }}
              className="text-primary hover:underline ml-1 font-medium text-sm animate-pulse"
            >
              ...more
            </button>
          )}
        </p>

        {renderTags()}

        <p className="text-[10px] text-on-surface-variant font-medium tracking-wide uppercase mt-2">
          {timeAgo}
        </p>
      </div>

      <MediaViewerPopup
        isOpen={isMediaViewerOpen}
        onClose={closeMedia}
        media={normalizedMedia as any}
        initialIndex={initialMediaIndex}
      />
    </article>
  );
}
