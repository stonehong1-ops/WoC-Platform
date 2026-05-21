'use client';

import '../../app/live/live.css';
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart,
  MessageCircle,
  Send,
  MapPin,
  Calendar,
  Plus,
  X,
  MoreVertical,
  Trash2,
  Edit2,
  Music,
  GraduationCap,
  Building2,
  AlertCircle,
  RefreshCcw
} from 'lucide-react';
import { galleryService, GalleryPost, GalleryComment, GalleryTag } from '@/lib/firebase/galleryService';
import { useAuth } from '@/components/providers/AuthProvider';
import { safeDate } from '@/lib/utils/safeDate';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigation } from '@/components/providers/NavigationProvider';
import BottomSheet from '@/components/common/BottomSheet';
import { SlidersHorizontal } from 'lucide-react';

interface LiveFilter {
  category: 'all' | 'social' | 'class' | 'event' | 'na';
  id?: string;        // socialId, groupId
  name?: string;      // 필터 대상 이름
  subId?: string;     // 수업시연의 경우 classId
  subName?: string;   // 수업시연의 경우 className
}

interface LiveFeedProps {
  entityType?: 'social' | 'group' | 'event' | 'class' | 'venue' | 'people';
  entityId?: string;
  userId?: string;
  className?: string;
}

export default function LiveFeed({ entityType, entityId, userId, className = '' }: LiveFeedProps) {
  const [posts, setPosts] = useState<GalleryPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [activeCommentPost, setActiveCommentPost] = useState<string | null>(null);
  const { t } = useLanguage();
  const { setIsHeaderVisible, setGlobalNavHidden } = useNavigation();
  const [mounted, setMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isImmersive, setIsImmersive] = useState(false);

  const [activeFilter, setActiveFilter] = useState<LiveFilter>({ category: 'all' });
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [tempFilter, setTempFilter] = useState<LiveFilter>({ category: 'all' });
  const [activeCategoryTab, setActiveCategoryTab] = useState<'all' | 'social' | 'class' | 'event' | 'na'>('all');

  // Dynamic filter options extraction
  const filterOptions = React.useMemo(() => {
    const socials: { id: string; name: string }[] = [];
    const events: { id: string; name: string }[] = [];
    const clubsMap: { [groupId: string]: { id: string; name: string; classes: { id: string; name: string }[] } } = {};

    posts.forEach(post => {
      if (!Array.isArray(post.tags)) return;

      post.tags.forEach(tag => {
        if (!tag) return;

        if (tag.type === 'social') {
          if (!socials.some(s => s.id === tag.id)) {
            socials.push({ id: tag.id, name: tag.name });
          }
        }

        if (tag.type === 'event') {
          if (!events.some(e => e.id === tag.id)) {
            events.push({ id: tag.id, name: tag.name });
          }
        }

        if (tag.type === 'class') {
          const groupId = tag.groupId || '';
          if (groupId) {
            let groupName = '기타 클럽';
            const groupTag = post.tags?.find(t => t && t.type === 'group' && t.id === groupId);
            if (groupTag) {
              groupName = groupTag.name;
            }

            if (!clubsMap[groupId]) {
              clubsMap[groupId] = {
                id: groupId,
                name: groupName,
                classes: []
              };
            }

            if (!clubsMap[groupId].classes.some(c => c.id === tag.id)) {
              clubsMap[groupId].classes.push({ id: tag.id, name: tag.name });
            }
          }
        }
      });

      if (post.eventId && post.eventName) {
        if (!events.some(e => e.id === post.eventId)) {
          events.push({ id: post.eventId, name: post.eventName });
        }
      }
    });

    return {
      socials,
      events,
      clubs: Object.values(clubsMap)
    };
  }, [posts]);

  // Client-side filtering logic
  const filteredPosts = React.useMemo(() => {
    return posts.filter(post => {
      if (activeFilter.category === 'all') return true;

      if (activeFilter.category === 'social') {
        return Array.isArray(post.tags) && post.tags.some(tag => tag && tag.type === 'social' && tag.id === activeFilter.id);
      }

      if (activeFilter.category === 'class') {
        return Array.isArray(post.tags) && post.tags.some(tag => tag && tag.type === 'class' && tag.id === activeFilter.subId);
      }

      if (activeFilter.category === 'event') {
        const hasTag = Array.isArray(post.tags) && post.tags.some(tag => tag && tag.type === 'event' && tag.id === activeFilter.id);
        const hasLegacy = post.eventId === activeFilter.id;
        return hasTag || hasLegacy;
      }

      if (activeFilter.category === 'na') {
        if (!post.tags || post.tags.length === 0) return true;
        const hasValidTag = post.tags.some(tag => tag && ['social', 'class', 'group', 'event'].includes(tag.type));
        const hasLegacy = !!post.eventId;
        return !hasValidTag && !hasLegacy;
      }

      return true;
    });
  }, [posts, activeFilter]);

  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const handleCommentClose = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('modal');
    params.delete('commentPostId');
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const handleImmersiveClose = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('modal');
    params.delete('immersivePostId');
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const handleOpenComments = (postId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('modal', 'live-comments');
    params.set('commentPostId', postId);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const handleOpenImmersive = (postId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('modal', 'live-immersive');
    params.set('immersivePostId', postId);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  // Dual-Binding Mode: Sync searchParams with local modal states
  useEffect(() => {
    const modal = searchParams.get('modal');
    const commentPostId = searchParams.get('commentPostId');

    if (modal === 'live-immersive') {
      setIsImmersive(true);
    } else {
      setIsImmersive(false);
    }

    if (modal === 'live-comments' && commentPostId) {
      setActiveCommentPost(commentPostId);
    } else {
      setActiveCommentPost(null);
    }
  }, [searchParams]);

  useEffect(() => {
    if (isImmersive) {
      setIsHeaderVisible(false);
      setGlobalNavHidden(true);
    } else {
      setIsHeaderVisible(true);
      setGlobalNavHidden(false);
    }
    return () => {
      setIsHeaderVisible(true);
      setGlobalNavHidden(false);
    };
  }, [isImmersive, setIsHeaderVisible, setGlobalNavHidden]);

  useEffect(() => {
    setMounted(true);
    setLoading(true);
    setError(null);
    const unsubscribe = galleryService.subscribeFeed(
      (data) => {
        setPosts(data);
        setLoading(false);
      },
      { entityType, entityId, userId },
      (err) => {
        console.error("LiveFeed subscription error:", err);
        setError(err.message || "Failed to load live feed");
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [entityType, entityId, userId, retryCount]);

  // Listen to global compose event
  useEffect(() => {
    const handleComposeOpen = (e: CustomEvent) => {
      if (e.detail?.id === 'gallery') {
        router.push('/live/create?source=live');
      }
    };
    window.addEventListener('woc:compose:open', handleComposeOpen as EventListener);
    return () => window.removeEventListener('woc:compose:open', handleComposeOpen as EventListener);
  }, [router]);

  if (!mounted) return null;

  if (error) {
    return (
      <div className={`flex flex-col items-center justify-center min-h-[calc(100vh-64px)] bg-black text-white ${className}`}>
        <div className="bg-white/10 p-6 rounded-full mb-4 backdrop-blur-md">
          <AlertCircle size={48} className="text-red-500" />
        </div>
        <p className="font-bold text-lg mb-2">Something went wrong</p>
        <p className="text-sm text-white/60 mb-8 max-w-xs text-center">{error}</p>
        <button
          onClick={() => setRetryCount(prev => prev + 1)}
          className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-full font-bold hover:bg-primary/90 transition-colors"
        >
          <RefreshCcw size={18} />
          Try Again
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={`flex items-center justify-center min-h-[calc(100vh-64px)] bg-black ${className}`}>
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className={`${isImmersive ? 'fixed inset-0 z-[100]' : 'relative w-full h-full min-h-[500px]'} bg-black overflow-hidden flex flex-col ${className}`}>
      {/* Floating Filter Button */}
      {!isImmersive && (
        <div className="absolute top-[125px] left-4 z-30 flex flex-col gap-2 items-start pointer-events-none">
          <button
            onClick={() => {
              setTempFilter(activeFilter);
              setActiveCategoryTab(activeFilter.category);
              setIsFilterOpen(true);
            }}
            className={`pointer-events-auto flex items-center gap-1.5 px-4 py-2.5 rounded-full text-xs font-black tracking-tight transition-all shadow-lg border backdrop-blur-md active:scale-95 cursor-pointer ${
              activeFilter.category !== 'all'
                ? 'bg-blue-600/90 text-white border-blue-500/30'
                : 'bg-black/40 text-white/90 border-white/10 hover:bg-black/60'
            }`}
          >
            <SlidersHorizontal size={14} className="shrink-0" />
            <span>{t('gallery.filter.title')}</span>
            {activeFilter.category !== 'all' && (
              <span className="bg-white text-blue-600 rounded-full w-4 h-4 flex items-center justify-center text-[9px] font-black ml-0.5">
                1
              </span>
            )}
          </button>

          {/* Active Filter Badge / Chip */}
          {activeFilter.category !== 'all' && (
            <div className="pointer-events-auto flex items-center gap-1 bg-blue-600/20 backdrop-blur-md text-blue-400 border border-blue-500/20 px-2.5 py-1 rounded-full text-[10px] font-bold shadow-md">
              <span className="truncate max-w-[150px]">
                {activeFilter.category === 'social' && `${t('gallery.filter.social')}: ${activeFilter.name}`}
                {activeFilter.category === 'class' && `${t('gallery.filter.class')}: ${activeFilter.subName}`}
                {activeFilter.category === 'event' && `${t('gallery.filter.event')}: ${activeFilter.name}`}
                {activeFilter.category === 'na' && t('gallery.filter.na')}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveFilter({ category: 'all' });
                }}
                className="w-3.5 h-3.5 rounded-full bg-blue-500/20 hover:bg-blue-500/40 text-blue-300 flex items-center justify-center ml-0.5 transition-colors shrink-0"
              >
                <X size={10} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Feed Container - Vertical Snap */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-scroll snap-y snap-mandatory no-scrollbar"
        style={{ scrollBehavior: 'smooth' }}
      >
        {posts.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-white/50 pb-20">
            <Link href="/live/create?source=live" className="bg-white/10 p-6 rounded-full mb-4 backdrop-blur-md hover:bg-white/20 transition-colors">
              <Plus size={40} />
            </Link>
            <p className="font-bold">{t('gallery.no_posts')}</p>
            <p className="text-sm">{t('gallery.be_first')}</p>
          </div>
        )}

        {posts.length > 0 && filteredPosts.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-white/50 pb-20 px-6 text-center">
            <div className="bg-white/10 p-5 rounded-full mb-4 backdrop-blur-md">
              <span className="material-symbols-outlined text-[36px] text-white/60 select-none">filter_list_off</span>
            </div>
            <p className="font-bold text-sm text-white">{t('pics.no_assets_found') || '조건에 맞는 라이브 피드가 없습니다.'}</p>
            <p className="text-xs text-white/40 mt-1">{t('pics.try_adjusting_filters') || '필터를 조정해 보세요.'}</p>
            <button
              onClick={() => setActiveFilter({ category: 'all' })}
              className="mt-6 px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-full text-xs font-black transition-all active:scale-95 border border-white/10 shadow-md"
            >
              {t('gallery.filter.reset') || '필터 초기화'}
            </button>
          </div>
        )}

        {filteredPosts.map((post) => (
          <GalleryCard
            key={post.id}
            post={post}
            onOpenComments={() => handleOpenComments(post.id)}
            isImmersive={isImmersive}
            onOpenImmersive={() => handleOpenImmersive(post.id)}
            onCloseImmersive={handleImmersiveClose}
            onOpenFilter={() => {
              setTempFilter(activeFilter);
              setActiveCategoryTab(activeFilter.category);
              setIsFilterOpen(true);
            }}
            activeFilter={activeFilter}
          />
        ))}
      </div>

      {/* Comment Bottom Sheet */}
      <AnimatePresence>
        {activeCommentPost && (
          <CommentBottomSheet
            postId={activeCommentPost}
            onClose={handleCommentClose}
          />
        )}
      </AnimatePresence>

      {/* Filter Bottom Sheet */}
      <BottomSheet
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        title={t('gallery.filter.title')}
        height="auto"
        footer={
          <div className="p-4 flex items-center gap-3 bg-surface-container-lowest border-t border-outline-variant/10">
            <button
              onClick={() => {
                setTempFilter({ category: 'all' });
                setActiveCategoryTab('all');
              }}
              className="flex-1 py-3.5 text-[14px] font-bold text-on-surface-variant bg-surface-container-high rounded-[16px] transition-all hover:bg-surface-container-highest active:scale-95 border border-outline-variant/10"
            >
              {t('gallery.filter.reset')}
            </button>
            <button
              onClick={() => {
                setActiveFilter(tempFilter);
                setIsFilterOpen(false);
              }}
              className="flex-[2] py-3.5 text-[14px] font-bold text-on-primary bg-primary rounded-[16px] transition-all hover:bg-primary-dark active:scale-95 shadow-md shadow-primary/10"
            >
              {t('gallery.filter.apply')}
            </button>
          </div>
        }
      >
        <div className="flex flex-col gap-6 py-2 px-1">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2.5 no-scrollbar border-b border-outline-variant/15 shrink-0">
            <style dangerouslySetInnerHTML={{ __html: `
              .no-scrollbar::-webkit-scrollbar { display: none; }
              .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}} />
            {(['all', 'social', 'class', 'event', 'na'] as const).map((cat) => {
              const isActive = activeCategoryTab === cat;
              return (
                <button
                  key={cat}
                  onClick={() => {
                    setActiveCategoryTab(cat);
                    if (cat === 'all' || cat === 'na') {
                      setTempFilter({ category: cat });
                    }
                  }}
                  className={`flex-shrink-0 px-3.5 py-2.5 rounded-xl text-[12px] font-bold tracking-tight transition-all whitespace-nowrap border flex items-center gap-1 ${
                    isActive
                      ? 'bg-primary text-on-primary border-primary shadow-sm shadow-primary/10'
                      : 'bg-surface-container-low text-on-surface-variant border-outline-variant/30 hover:bg-surface-container'
                  }`}
                >
                  {cat === 'all' && t('gallery.filter.all')}
                  {cat === 'social' && t('gallery.filter.social')}
                  {cat === 'class' && t('gallery.filter.class')}
                  {cat === 'event' && t('gallery.filter.event')}
                  {cat === 'na' && t('gallery.filter.na')}
                </button>
              );
            })}
          </div>

          {/* Sub-options based on activeCategoryTab */}
          <div className="min-h-[180px] max-h-[45vh] overflow-y-auto pr-1 no-scrollbar">
            {activeCategoryTab === 'all' && (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <span className="material-symbols-outlined text-[48px] text-primary/40 mb-3 select-none">all_inclusive</span>
                <p className="text-sm font-bold text-on-surface">{t('gallery.filter.all')}</p>
                <p className="text-xs text-on-surface-variant/70 mt-1.5 px-4 leading-relaxed">모든 라이브 스트림과 포스트를 제한 없이 시청합니다.</p>
              </div>
            )}

            {activeCategoryTab === 'na' && (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <span className="material-symbols-outlined text-[48px] text-primary/40 mb-3 select-none">label_off</span>
                <p className="text-sm font-bold text-on-surface">{t('gallery.filter.na')}</p>
                <p className="text-xs text-on-surface-variant/70 mt-1.5 px-4 leading-relaxed">특정 그룹, 소셜, 클래스에 연결되지 않은 기본 피드만 시청합니다.</p>
              </div>
            )}

            {activeCategoryTab === 'social' && (
              <div className="flex flex-col gap-1.5">
                {filterOptions.socials.length === 0 ? (
                  <div className="py-12 flex flex-col items-center justify-center text-center text-on-surface-variant/40 text-xs font-bold gap-2">
                    <span className="material-symbols-outlined text-[32px] opacity-40">music_note</span>
                    <span>등록된 소셜 라이브가 없습니다.</span>
                  </div>
                ) : (
                  filterOptions.socials.map((social) => {
                    const isSelected = tempFilter.category === 'social' && tempFilter.id === social.id;
                    return (
                      <button
                        key={social.id}
                        onClick={() => setTempFilter({ category: 'social', id: social.id, name: social.name })}
                        className={`w-full py-4 px-5 flex items-center gap-3.5 hover:bg-on-surface/5 active:bg-on-surface/10 transition-all text-left text-[14px] rounded-2xl border ${
                          isSelected
                            ? 'text-primary font-bold bg-primary/5 border-primary/20 shadow-sm'
                            : 'text-on-surface-variant border-transparent font-medium'
                        }`}
                      >
                        <Music size={16} className={isSelected ? 'text-primary' : 'text-on-surface-variant/60'} />
                        <span className="flex-1 truncate">{social.name}</span>
                        {isSelected && (
                          <span className="material-symbols-outlined text-[18px] text-primary font-bold">check</span>
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            )}

            {activeCategoryTab === 'event' && (
              <div className="flex flex-col gap-1.5">
                {filterOptions.events.length === 0 ? (
                  <div className="py-12 flex flex-col items-center justify-center text-center text-on-surface-variant/40 text-xs font-bold gap-2">
                    <span className="material-symbols-outlined text-[32px] opacity-40">event</span>
                    <span>등록된 공연 라이브가 없습니다.</span>
                  </div>
                ) : (
                  filterOptions.events.map((event) => {
                    const isSelected = tempFilter.category === 'event' && tempFilter.id === event.id;
                    return (
                      <button
                        key={event.id}
                        onClick={() => setTempFilter({ category: 'event', id: event.id, name: event.name })}
                        className={`w-full py-4 px-5 flex items-center gap-3.5 hover:bg-on-surface/5 active:bg-on-surface/10 transition-all text-left text-[14px] rounded-2xl border ${
                          isSelected
                            ? 'text-primary font-bold bg-primary/5 border-primary/20 shadow-sm'
                            : 'text-on-surface-variant border-transparent font-medium'
                        }`}
                      >
                        <Calendar size={16} className={isSelected ? 'text-primary' : 'text-on-surface-variant/60'} />
                        <span className="flex-1 truncate">{event.name}</span>
                        {isSelected && (
                          <span className="material-symbols-outlined text-[18px] text-primary font-bold">check</span>
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            )}

            {activeCategoryTab === 'class' && (
              <div className="flex flex-col gap-4">
                {filterOptions.clubs.length === 0 ? (
                  <div className="py-12 flex flex-col items-center justify-center text-center text-on-surface-variant/40 text-xs font-bold gap-2">
                    <span className="material-symbols-outlined text-[32px] opacity-40">school</span>
                    <span>등록된 수업시연 라이브가 없습니다.</span>
                  </div>
                ) : (
                  filterOptions.clubs.map((club) => (
                    <div
                      key={club.id}
                      className="border border-outline-variant/30 rounded-[20px] bg-surface-container-low/40 overflow-hidden shadow-sm"
                    >
                      {/* Club Header */}
                      <div className="bg-surface-container-high/30 px-4.5 py-3 flex items-center gap-2 border-b border-outline-variant/10">
                        <Building2 size={14} className="text-on-surface-variant/70" />
                        <span className="text-[11px] font-black tracking-wider text-on-surface-variant uppercase">
                          {club.name}
                        </span>
                      </div>

                      {/* Classes List */}
                      <div className="p-2 flex flex-col gap-1 bg-surface-container-lowest">
                        {club.classes.map((cls) => {
                          const isSelected = tempFilter.category === 'class' && tempFilter.subId === cls.id;
                          return (
                            <button
                              key={cls.id}
                              onClick={() =>
                                setTempFilter({
                                  category: 'class',
                                  id: club.id,
                                  name: club.name,
                                  subId: cls.id,
                                  subName: cls.name,
                                })
                              }
                              className={`w-full py-3.5 px-4 flex items-center gap-3 hover:bg-on-surface/5 active:bg-on-surface/10 transition-all text-left text-[13px] rounded-2xl border ${
                                isSelected
                                  ? 'text-primary font-bold bg-primary/5 border-primary/20 shadow-xs'
                                  : 'text-on-surface border-transparent font-medium'
                              }`}
                            >
                              <GraduationCap
                                size={15}
                                className={isSelected ? 'text-primary' : 'text-on-surface-variant/70'}
                              />
                              <span className="flex-1 truncate">{cls.name}</span>
                              {isSelected && (
                                <span className="material-symbols-outlined text-[16px] text-primary font-bold">check</span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </BottomSheet>
    </div>
  );
}

const GalleryCard = ({
  post,
  onOpenComments,
  isImmersive,
  onOpenImmersive,
  onCloseImmersive,
  onOpenFilter,
  activeFilter
}: {
  post: GalleryPost,
  onOpenComments: () => void,
  isImmersive: boolean,
  onOpenImmersive: () => void,
  onCloseImmersive: () => void,
  onOpenFilter?: () => void,
  activeFilter?: LiveFilter
}) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [activeDot, setActiveDot] = useState(0);

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const shareUrl = `${window.location.origin}/live?modal=live-immersive&immersivePostId=${post.id}`;
    const shareText = `[WoC Live] ${post.authorName}: ${post.caption || ''}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'World of Community - Live',
          text: shareText,
          url: shareUrl
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareUrl);
        alert(t('gallery.link_copied'));
      } catch (err) {
        console.error('Failed to copy link:', err);
        alert('링크 복사에 실패했습니다.');
      }
    }
  };
  const carouselRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const isLiked = (post.likedBy || []).includes(user?.uid || '');
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  const isMuted = !isImmersive;

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setIsPlaying(true);
          videoRefs.current.forEach(video => {
            if (video) video.play().catch(() => { });
          });
        } else {
          setIsPlaying(false);
          videoRefs.current.forEach(video => {
            if (video) video.pause();
          });
        }
      });
    }, { threshold: 0.6 });

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => {
      if (cardRef.current) {
        observer.unobserve(cardRef.current);
      }
    };
  }, []);

  const handleScroll = () => {
    if (carouselRef.current) {
      const scrollLeft = carouselRef.current.scrollLeft;
      const width = carouselRef.current.offsetWidth;
      const index = Math.round(scrollLeft / width);
      setActiveDot(index);
    }
  };

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return alert(t('gallery.sign_in_first'));
    const newIsLiked = !isLiked;
    await galleryService.toggleLike(post.id, user.uid, isLiked);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user || user.uid !== post.authorId) return;
    if (confirm(t('gallery.confirm_delete'))) {
      await galleryService.deletePost(post.id);
    }
  };

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
    videoRefs.current.forEach(video => {
      if (video) {
        if (isPlaying) video.pause();
        else video.play();
      }
    });
  };

  const handleMediaClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isImmersive) {
      onOpenImmersive();
      videoRefs.current.forEach(video => {
        if (video) video.muted = false;
      });
    } else {
      togglePlay();
    }
  };

  const handleExitImmersive = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isImmersive) {
      onCloseImmersive();
    }
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp) return '';
    const date = safeDate(timestamp);
    if (!date) return '';
    const now = new Date();
    const diff = Math.max(0, now.getTime() - date.getTime());
    const mins = Math.floor(diff / 60000);
    const hrs = Math.floor(mins / 60);
    const days = Math.floor(hrs / 24);

    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins} min${mins !== 1 ? 's' : ''} ago`;
    if (hrs < 24) return `${hrs} hour${hrs !== 1 ? 's' : ''} ago`;
    if (days < 7) return `${days} day${days !== 1 ? 's' : ''} ago`;
    const weeks = Math.floor(days / 7);
    if (weeks < 4) return `${weeks} week${weeks !== 1 ? 's' : ''} ago`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months} month${months !== 1 ? 's' : ''} ago`;
    const years = Math.floor(days / 365);
    return `${years} year${years !== 1 ? 's' : ''} ago`;
  };

  return (
    <div ref={cardRef} className="relative h-full w-full snap-start snap-always bg-black">
      {/* Media Carousel */}
      <div
        className="absolute inset-0 flex overflow-x-auto snap-x snap-mandatory no-scrollbar"
        ref={carouselRef}
        onScroll={handleScroll}
        onClick={handleMediaClick}
      >
        {(Array.isArray(post.media) ? post.media : (post.media ? [post.media] : [])).map((url, idx) => {
          const urlString = typeof url === 'string' ? url : '';
          const isVideo = post.mediaTypes ? post.mediaTypes[idx] === 'video' : (urlString.toLowerCase().includes('.mp4') || urlString.toLowerCase().includes('.mov') || urlString.toLowerCase().includes('.webm') || urlString.toLowerCase().includes('video'));
          return (
            <div key={idx} className="relative flex-none w-full h-full snap-start flex items-center justify-center">
              {isVideo ? (
                <video
                  ref={el => { videoRefs.current[idx] = el }}
                  src={url}
                  className="w-full h-full object-cover"
                  loop
                  muted={isMuted}
                  playsInline
                />
              ) : (
                <img src={url} alt="" className="w-full h-full object-cover" />
              )}

              {!isPlaying && isVideo && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                  <div className="w-16 h-16 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white">
                    <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Top Header */}
      <AnimatePresence>
        <motion.div
          key="top-header"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
          className={`absolute top-0 left-0 right-0 p-4 ${isImmersive ? 'pt-safe' : 'pt-4'} bg-gradient-to-b from-black/60 via-black/30 to-transparent z-10 flex justify-between items-start pointer-events-none gap-2`}
        >
          <div className="flex items-center gap-3 pointer-events-auto min-w-0">
            {post.authorPhoto && post.authorPhoto !== '/default-avatar.png' ? (
              <img src={post.authorPhoto} alt="" className="w-8 h-8 rounded-full border border-white/20 object-cover shrink-0" />
            ) : (
              <div className="w-8 h-8 rounded-full border border-white/20 bg-black/40 backdrop-blur-sm flex items-center justify-center text-[12px] font-bold text-white shadow-sm shrink-0">
                {String(post.authorName || 'A').charAt(0).toUpperCase()}
              </div>
            )}
            <div className="flex flex-col text-white drop-shadow-md min-w-0">
              <span className="font-bold text-sm tracking-tight leading-tight truncate">{post.authorName}</span>
              <span className="text-[10px] text-white/70 font-medium truncate">{formatTime(post.createdAt)}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 pointer-events-auto shrink-0">
            {user?.uid === post.authorId && (
              <>
                <Link
                  href={`/live/create?edit=${post.id}&source=live`}
                  className="w-8 h-8 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/20 transition-colors border border-white/10 shadow-sm"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Edit2 size={14} />
                </Link>
                <button
                  className="w-8 h-8 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-red-500/80 transition-colors border border-white/10 shadow-sm"
                  onClick={handleDelete}
                >
                  <Trash2 size={14} />
                </button>
              </>
            )}
            {isImmersive && (
              <button
                onClick={handleExitImmersive}
                className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/60 transition-colors border border-white/20 shadow-lg"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Bottom Overlay Info */}
      <AnimatePresence>
        <motion.div
          key="bottom-info"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
          className={`absolute left-0 right-0 p-4 pr-16 bg-gradient-to-t from-black/80 via-black/40 to-transparent z-10 flex flex-col justify-end text-white transition-all duration-300 pointer-events-none ${isImmersive ? 'bottom-0 pb-safe' : 'bottom-0 pb-4 md:pb-8'}`}
        >
          {(Array.isArray(post.media) && post.media.length > 1) && (
            <div className="flex gap-1.5 mb-2 pointer-events-auto">
              {post.media.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-1.5 rounded-full transition-all duration-300 ${activeDot === idx ? 'w-4 bg-white' : 'w-1.5 bg-white/40'}`}
                />
              ))}
            </div>
          )}

          <p className="text-sm font-medium leading-snug truncate drop-shadow-md mb-2 pointer-events-auto">
            {post.caption}
          </p>

          <div className="flex flex-wrap items-center gap-2 pointer-events-auto">
            {(Array.isArray(post.tags) && post.tags.length > 0) ? (
              post.tags.filter((tag: GalleryTag) => tag && tag.type !== 'people').map((tag: GalleryTag) => {
                const href = tag.type === 'group' ? `/groups/${tag.id}`
                  : tag.type === 'social' ? `/social?id=${tag.id}`
                    : tag.type === 'event' ? `/events?id=${tag.id}`
                      : `/groups/${tag.groupId}?class=${tag.id}`;
                const TagIcon = tag.type === 'group' ? Building2
                  : tag.type === 'social' ? Music
                    : tag.type === 'event' ? Calendar
                      : GraduationCap;
                return (
                  <Link
                    key={`${tag.type}-${tag.id}`}
                    href={href}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/30 backdrop-blur-md text-xs font-semibold border border-white/20 hover:bg-black/50 transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <TagIcon size={12} className="text-white/80" />
                    <span className="text-white drop-shadow-sm">{tag.name}</span>
                    {tag.instructors && <span className="opacity-70 text-[10px] ml-0.5 border-l border-white/20 pl-1">{tag.instructors}</span>}
                  </Link>
                );
              })
            ) : (
              <>
                {post.venueName && (
                  <Link href={`/venues?id=${post.venueId}`} className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/30 backdrop-blur-md text-xs font-semibold border border-white/20" onClick={(e) => e.stopPropagation()}>
                    <Building2 size={12} className="text-white/80" />
                    <span className="text-white drop-shadow-sm">{post.venueName}</span>
                  </Link>
                )}
                {post.eventName && (
                  <Link href={`/events?id=${post.eventId}`} className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/30 backdrop-blur-md text-xs font-semibold border border-white/20" onClick={(e) => e.stopPropagation()}>
                    <Calendar size={12} className="text-white/80" />
                    <span className="text-white drop-shadow-sm">{post.eventName}</span>
                  </Link>
                )}
              </>
            )}
            {Array.isArray(post.tags) && post.tags.filter((t: GalleryTag) => t && t.type === 'people').length > 0 && (
              <div className="flex items-center -space-x-1.5 ml-1">
                {post.tags.filter((t: GalleryTag) => t && t.type === 'people').map((t: GalleryTag) => (
                  <div key={t.id} className="relative group/person cursor-pointer" title={t.name}>
                    {t.avatar
                      ? <img src={t.avatar} alt={t.name || ''} className="w-6 h-6 rounded-full border border-white/50 object-cover shadow-sm" />
                      : <div className="w-6 h-6 rounded-full border border-white/50 bg-black/40 backdrop-blur-sm flex items-center justify-center text-[10px] font-bold text-white shadow-sm">{String(t.name || 'U').charAt(0).toUpperCase()}</div>
                    }
                    {t.role === 'organizer' && <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-purple-500 rounded-full border border-black/50 flex items-center justify-center text-[7px] font-bold text-white">O</div>}
                    {t.role === 'instructor' && <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-blue-500 rounded-full border border-black/50 flex items-center justify-center text-[7px] font-bold text-white">I</div>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Right Side Vertical Actions */}
      <AnimatePresence>
        <motion.div
          key="right-actions"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
          className={`absolute right-2 flex flex-col items-center gap-4 z-20 transition-all duration-300 pointer-events-auto ${isImmersive ? 'bottom-12 pb-safe' : 'bottom-12 md:bottom-16'}`}
        >
          {!isImmersive && (
            <Link href="/live/create?source=live" onClick={(e) => e.stopPropagation()} className="flex flex-col items-center group">
              <div className="w-9 h-9 rounded-full flex items-center justify-center bg-black/20 backdrop-blur-md border border-white/10 text-white transition-transform active:scale-90 shadow-sm">
                <Plus size={18} className="drop-shadow-md" />
              </div>
            </Link>
          )}

          {/* Filter Button (Positioned under Plus button, always visible) */}
          <button 
            className="flex flex-col items-center group" 
            onClick={(e) => {
              e.stopPropagation();
              onOpenFilter?.();
            }}
          >
            <div className={`w-9 h-9 rounded-full flex items-center justify-center bg-black/20 backdrop-blur-md border transition-all duration-300 active:scale-90 cursor-pointer ${
              activeFilter?.category !== 'all'
                ? 'text-[#007AFF] border-[#007AFF]/50 bg-[#007AFF]/10 shadow-[0_0_8px_rgba(0,122,255,0.4)]'
                : 'text-white border-white/10'
            }`}>
              <SlidersHorizontal size={18} className="drop-shadow-md" />
            </div>
          </button>

          <button className="relative flex flex-col items-center group" onClick={handleLike}>
            <div className={`w-9 h-9 rounded-full flex items-center justify-center bg-black/20 backdrop-blur-md border border-white/10 transition-transform active:scale-90 ${isLiked ? 'text-[#ff2d55]' : 'text-white'}`}>
              <Heart size={18} fill={isLiked ? "#ff2d55" : "none"} className={isLiked ? "drop-shadow-[0_0_8px_rgba(255,45,85,0.5)]" : ""} />
            </div>
            <span className="absolute -bottom-1.5 bg-black/60 px-1.5 py-0.5 rounded-full border border-white/10 text-white text-[8px] font-black tracking-tight drop-shadow-md scale-90">
              {post.likesCount || 0}
            </span>
          </button>

          <button className="relative flex flex-col items-center group" onClick={onOpenComments}>
            <div className="w-9 h-9 rounded-full flex items-center justify-center bg-black/20 backdrop-blur-md border border-white/10 text-white transition-transform active:scale-90">
              <MessageCircle size={18} fill="white" className="text-white drop-shadow-md" />
            </div>
            <span className="absolute -bottom-1.5 bg-black/60 px-1.5 py-0.5 rounded-full border border-white/10 text-white text-[8px] font-black tracking-tight drop-shadow-md scale-90">
              {post.commentsCount || 0}
            </span>
          </button>

          <button className="flex flex-col items-center group" onClick={handleShare}>
            <div className="w-9 h-9 rounded-full flex items-center justify-center bg-black/20 backdrop-blur-md border border-white/10 text-white transition-transform active:scale-90">
              <span className="material-symbols-outlined text-[18px] drop-shadow-md">share</span>
            </div>
          </button>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

const CommentBottomSheet = ({ postId, onClose }: { postId: string, onClose: () => void }) => {
  const [comments, setComments] = useState<GalleryComment[]>([]);
  const [inputText, setInputText] = useState('');
  const { user } = useAuth();
  const { t } = useLanguage();

  useEffect(() => {
    const unsubscribe = galleryService.subscribeComments(postId, (data) => {
      setComments(data);
    });
    return () => unsubscribe();
  }, [postId]);

  const handleSubmit = async () => {
    if (!user) return alert(t('gallery.sign_in_first'));
    if (!inputText.trim()) return;

    await galleryService.addComment(postId, {
      authorId: user.uid,
      authorName: user.displayName || 'Anonymous',
      authorPhoto: user.photoURL || '',
      text: inputText,
      postId: postId
    });
    setInputText('');
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-end justify-center">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="relative w-full max-w-xl h-[70vh] bg-white rounded-t-[2rem] flex flex-col overflow-hidden shadow-2xl"
      >
        <div className="w-full flex justify-center pt-3 pb-2 shrink-0">
          <div className="w-12 h-1.5 bg-outline-variant rounded-full"></div>
        </div>

        <div className="px-6 pb-4 border-b border-outline-variant flex justify-between items-center shrink-0">
          <h2 className="text-lg font-extrabold text-on-surface font-headline">{comments.length} {t('gallery.comments')}</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-surface-container transition-colors">
            <X size={20} className="text-on-surface-variant" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-4">
              <img src={comment.authorPhoto || '/default-avatar.png'} alt="" className="w-10 h-10 rounded-full object-cover border border-outline-variant shrink-0" />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-sm text-on-surface">{comment.authorName}</span>
                  <span className="text-xs text-on-surface-variant font-medium">
                    {comment.createdAt ? t('gallery.just_now') : ''}
                  </span>
                </div>
                <p className="text-sm text-on-surface leading-relaxed">{comment.text}</p>
                <div className="flex gap-4 mt-2 text-xs font-bold text-on-surface-variant">
                  <button className="hover:text-on-surface transition-colors">{t('gallery.reply')}</button>
                </div>
              </div>
              <button className="text-outline hover:text-error transition-colors shrink-0 pt-2">
                <Heart size={16} />
              </button>
            </div>
          ))}
          {comments.length === 0 && (
            <div className="py-20 flex flex-col items-center justify-center text-on-surface-variant">
              <MessageCircle size={40} className="mb-4 opacity-20" />
              <p className="font-medium">{t('gallery.no_comments')}</p>
              <p className="text-sm opacity-80">{t('gallery.start_conversation')}</p>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-outline-variant bg-surface shrink-0 mb-safe">
          <div className="flex items-center gap-3 bg-surface-container-lowest p-2 rounded-full border border-outline shadow-sm focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all">
            <img src={user?.photoURL || '/default-avatar.png'} alt="" className="w-8 h-8 rounded-full ml-1 object-cover" />
            <input
              type="text"
              className="flex-1 bg-transparent border-none text-sm focus:outline-none px-2 text-on-surface"
              placeholder={t('gallery.add_comment')}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            />
            <button
              className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center disabled:opacity-50 disabled:bg-outline-variant transition-all shrink-0"
              onClick={handleSubmit}
              disabled={!inputText.trim()}
            >
              <Send size={14} className="ml-0.5" />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
