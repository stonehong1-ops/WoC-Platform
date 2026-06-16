'use client';

import React, { useState, useEffect } from 'react';
import CreateFeedPopup from './CreateFeedPopup';
import FeedPostCard from './FeedPostCard';
import { feedService } from '@/lib/firebase/feedService';
import { Post } from '@/types/feed';
import UserAvatar from '@/components/common/UserAvatar';
import { useModalNavigation } from '@/hooks/useModalNavigation';
import { useLocation } from '@/components/providers/LocationProvider';
import { COUNTRY_MAPPING } from '@/constants/locations';
import { useLanguage } from '@/contexts/LanguageContext';
import { matchLocationGroup } from '@/app/social/constants/regionMapping';

interface UniversalFeedProps {
  context: any;
  currentUser: any;
  profile?: any;
  activeFilter?: string;
}

export default function UniversalFeed({ context, currentUser, profile, activeFilter: propFilter }: UniversalFeedProps) {
  // 0ms의 즉각적인 체감 성능을 위해 무거운 URL 쿼리 대신 순수 로컬 상태로 모달을 초고속 제어합니다.
  const [createFlowValue, setCreateFlowValue] = useState<string | null>(null);
  const openCreate = (value: string) => setCreateFlowValue(value);
  const closeCreate = () => setCreateFlowValue(null);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [localFilter, setLocalFilter] = useState('all');
  const { t } = useLanguage();

  const [visibleLimit, setVisibleLimit] = useState(15);
  const [hasMore, setHasMore] = useState(true);

  // 스크롤 감지를 통한 무한 스크롤 트리거
  useEffect(() => {
    if (loading) return;
    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
      if (scrollHeight - scrollTop - clientHeight < 150) {
        if (posts.length >= visibleLimit) {
          setVisibleLimit(prev => prev + 15);
        } else {
          setHasMore(false);
        }
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loading, posts.length, visibleLimit]);

  const isCreateModalOpen = !!createFlowValue;
  const editingPost = createFlowValue && createFlowValue !== 'new' ? posts.find(p => p.id === createFlowValue) || null : null;

  const activeFilter = propFilter || localFilter;
  const tabs = [
    { id: 'all', label: t('plaza.tab_all') },
    { id: 'hot', label: t('plaza.tab_hot') },
    { id: 'bookmark', label: t('plaza.tab_bookmark') },
    { id: 'my_log', label: t('plaza.tab_my_log') },
  ];

  useEffect(() => {
    let targetId = context.scope === 'plaza' ? 'plaza' : (context.scopeId || 'freestyle-tango');
    if (context.scope === 'helpdesk') targetId = 'helpdesk';
    
    setLoading(true);
    const unsubscribe = feedService.subscribePosts(
      targetId,
      (newPosts) => {
        setPosts(newPosts);
        setLoading(false);
        if (newPosts.length < visibleLimit) {
          setHasMore(false);
        } else {
          setHasMore(true);
        }
      },
      { limitCount: visibleLimit },
      (error) => {
        console.error("Feed subscription error:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [context.scopeId, visibleLimit]);

  const { location } = useLocation();

  // Derive filtered posts based on activeFilter
  const filteredPosts = React.useMemo(() => {
    let result = [...posts];

    // 1. Regional Filtering (Only for Plaza scope)
    if (context.scope === 'plaza' && location.country !== 'GLOBAL') {
      result = result.filter(p => {
        // If post has no location metadata, skip filtering or decide based on UX (usually skip)
        if (!p.location?.country) return false; 
        
        const countryMatch = p.location.country.toUpperCase() === location.country.toUpperCase();
        if (location.city === 'ALL') {
          return countryMatch;
        }
        
        const cityMatch = matchLocationGroup(location.city, p.location.city);
        return countryMatch && cityMatch;
      });
    }

    // 2. Tab Filtering
    switch (activeFilter) {
      case 'hot':
        // Ranked by engagement (likes + comments)
        result.sort((a, b) => {
          const aScore = (a.likesCount || 0) + (a.commentsCount || 0);
          const bScore = (b.likesCount || 0) + (b.commentsCount || 0);
          if (bScore !== aScore) return bScore - aScore;
          // If scores are equal, sort by date
          const aTime = a.createdAt?.seconds || 0;
          const bTime = b.createdAt?.seconds || 0;
          return bTime - aTime;
        });
        break;
      case 'my_log':
      case 'my': // fallback for old filter name
        // User's own posts
        result = result.filter(p => p.userId === currentUser?.uid);
        break;
      case 'bookmark':
      case 'pin':
      case 'pinned': // fallback for old filter name
        // Posts I pinned
        const pinnedPostIds = profile?.pinnedPostIds || [];
        result = result.filter(p => pinnedPostIds.includes(p.id));
        break;
      case 'favorites':
      case 'friends': // fallback for old filter name
        // Authors I interacted with (liked/commented on their posts)
        const interactedUserIds = profile?.interactedUserIds || [];
        result = result.filter(p => interactedUserIds.includes(p.userId));
        break;
      case 'all':
      default:
        // Already chronological by default (subscribePosts orders by createdAt desc)
        break;
    }

    return result;
  }, [posts, activeFilter, currentUser, profile, location, context.scope]);

  // 1. 공지글/공식글을 상단 Spotlight 영역으로 분리
  const spotlightPosts = posts.filter(p => p.isAnnouncement || p.isOfficial);
  // 아래 타임라인 목록에서는 중복 렌더링되지 않도록 Spotlight 글은 제외
  const regularPosts = filteredPosts.filter(p => !p.isAnnouncement && !p.isOfficial);

  // [스톤님 기획안] 격자 뷰모드일 때 텍스트 전용 글은 100% 필터링(제외)하여 순수 미디어 갤러리화
  const gridMediaPosts = regularPosts.filter(p => {
    const mediaItems = p.media || [];
    const hasMedia = mediaItems.filter((m: any) => typeof m === 'string' || m.type !== 'link').length > 0;
    const hasLink = mediaItems.filter((m: any) => typeof m !== 'string' && m.type === 'link').length > 0;
    return hasMedia || hasLink;
  });

  return (
    <div className={`text-on-surface font-body relative ${context.scope === 'plaza' ? 'min-h-screen' : ''}`}>
      {/* Ambient Background Effects */}
      <div className={`${context.scope === 'plaza' ? 'fixed inset-0 z-[-1] overflow-hidden pointer-events-none' : 'hidden'}`}>
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/5 blur-3xl rounded-full"></div>
        <div className="absolute bottom-[20%] right-[-5%] w-[40%] h-[60%] bg-tertiary/5 blur-3xl rounded-full"></div>
      </div>

      <main className={`max-w-[600px] mx-auto flex flex-col ${context.scope === 'plaza' ? 'pt-0' : 'pt-0 pb-16'}`}>
        <div className="flex flex-col w-full">


        {/* 📌 Spotlight Carousel (공지/공식글 상단 배너) */}
        {spotlightPosts.length > 0 && (
          <div className="mx-4 mb-4 mt-2 overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 to-tertiary/5 backdrop-blur-md p-4 shadow-md relative">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-primary text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>push_pin</span>
                <span className="text-[11px] font-black text-primary tracking-wider uppercase">Plaza Spotlight</span>
              </div>
              <span className="text-[9px] font-bold text-primary/70 bg-primary-container px-2 py-0.5 rounded-full uppercase tracking-wider">Official Announcement</span>
            </div>
            <div className="flex flex-col gap-3">
              {spotlightPosts.map((post) => (
                <div key={post.id} className="bg-white/80 rounded-xl p-3 border border-outline-variant/10 shadow-sm relative group overflow-hidden">
                  <FeedPostCard
                    post={post}
                    currentUser={currentUser}
                    profile={profile}
                    hideUserInfo={context.scope === 'helpdesk'}
                    onEdit={(post) => openCreate(post.id)}
                    onDelete={async (postId) => {
                      if (window.confirm(t('plaza.confirm_delete_post'))) {
                        try {
                          await feedService.deletePost(postId);
                        } catch (error) {
                          alert(t('plaza.fail_delete'));
                        }
                      }
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ⚡ 프리미엄 피드 한 줄 툴바 (브랜드 글쓰기 프롬프트 + 고급 세그먼티드 뷰 스위치) */}
        <div className="mx-4 my-3 px-3 py-2 bg-white/95 backdrop-blur-md rounded-3xl border border-slate-100/80 shadow-sm shadow-slate-100/50 flex items-center justify-between gap-3 shrink-0">


          {/* 우측: 슬랙/애플 감성의 부드러운 뷰 세그먼트 스위치 */}
          <div className="flex bg-slate-50/80 p-0.5 rounded-2xl border border-slate-200/20 shrink-0 select-none">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-xl flex items-center transition-all active:scale-95 duration-100 ${
                viewMode === 'list'
                  ? 'bg-white text-blue-600 shadow-[0_2px_6px_rgba(0,0,0,0.06)] border border-slate-200/40 font-bold scale-[1.01]'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
              title={t('plaza.list_view', 'List View')}
            >
              <span className="material-symbols-outlined text-[14px]">format_list_bulleted</span>
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 rounded-xl flex items-center transition-all active:scale-95 duration-100 ${
                viewMode === 'grid'
                  ? 'bg-white text-blue-600 shadow-[0_2px_6px_rgba(0,0,0,0.06)] border border-slate-200/40 font-bold scale-[1.01]'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
              title={t('plaza.board_view', 'Pinterest Board')}
            >
              <span className="material-symbols-outlined text-[14px]">dashboard</span>
            </button>
          </div>
        </div>

        {/* Feed Posts List */}
        <div className="flex flex-col pb-24 w-full">
          {loading && posts.length === 0 ? (
            <div className="flex flex-col gap-0 w-full">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-surface-container-lowest h-80 animate-pulse border-b border-outline-variant/10 shadow-sm w-full" />
              ))}
            </div>
          ) : regularPosts.length === 0 ? (
            <div className="py-20 text-center bg-surface-container-lowest border-b border-outline-variant/10 shadow-sm w-full">
              <span className="material-symbols-outlined text-outline-variant text-6xl mb-4">post_add</span>
              <p className="text-on-surface-variant font-medium px-10">
                {location.country === 'GLOBAL' 
                  ? t('plaza.last_feed_global') 
                  : `${location.city}, ${COUNTRY_MAPPING[location.country.toUpperCase()] || location.country}${t('plaza.last_feed_local')}`}
              </p>
            </div>
          ) : (
            <>
              {viewMode === 'list' ? (
                <div className="flex flex-col gap-0 w-full">
                  {regularPosts.map((post) => (
                    <FeedPostCard
                      key={post.id}
                      post={post}
                      currentUser={currentUser}
                      profile={profile}
                      hideUserInfo={context.scope === 'helpdesk'}
                      onEdit={(post) => openCreate(post.id)}
                      onDelete={async (postId) => {
                        if (window.confirm(t('plaza.confirm_delete_post'))) {
                          try {
                            await feedService.deletePost(postId);
                          } catch (error) {
                            alert(t('plaza.fail_delete'));
                          }
                        }
                      }}
                    />
                  ))}
                </div>
              ) : (
                <div className="columns-2 gap-3 mx-4 pb-4 [column-fill:balance] break-inside-avoid-wrap">
                  {gridMediaPosts.map((post) => (
                    <div key={post.id} className="break-inside-avoid mb-3 inline-block w-full">
                      <FeedPostCard
                        post={post}
                        currentUser={currentUser}
                        profile={profile}
                        hideUserInfo={context.scope === 'helpdesk'}
                        isGridView={true}
                        onEdit={(post) => openCreate(post.id)}
                        onDelete={async (postId) => {
                          if (window.confirm(t('plaza.confirm_delete_post'))) {
                            try {
                              await feedService.deletePost(postId);
                            } catch (error) {
                              alert(t('plaza.fail_delete'));
                            }
                          }
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Infinite Scroll Loader & Ending Caption */}
              {hasMore ? (
                <div className="py-6 flex items-center justify-center">
                  <span className="material-symbols-rounded animate-spin text-slate-300 text-3xl">progress_activity</span>
                </div>
              ) : (
                <div className="py-10 text-center text-slate-400 text-xs font-bold tracking-wider uppercase select-none">
                  {t('pics.end_of_collection', 'End of Collection')}
                </div>
              )}
            </>
          )}
        </div>
        </div>
      </main>

      {/* Full Screen Post Creation Popup */}
      <CreateFeedPopup
        isOpen={isCreateModalOpen}
        onClose={closeCreate}
        context={context}
        editingPost={editingPost}
      />
    </div>
  );
}
