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
  RefreshCcw,
  FlipHorizontal,
  SlidersHorizontal
} from 'lucide-react';
import { galleryService, GalleryPost, GalleryComment, GalleryTag } from '@/lib/firebase/galleryService';
import { useAuth } from '@/components/providers/AuthProvider';
import { safeDate } from '@/lib/utils/safeDate';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigation } from '@/components/providers/NavigationProvider';
import BottomSheet from '@/components/common/BottomSheet';

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
  const { user } = useAuth();
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

  const [showDashboardIntro, setShowDashboardIntro] = useState(!entityType && !entityId && !userId);
  
  // entityType, entityId, userId가 존재하거나 비동기로 넘어오면 대시보드 인트로를 강제로 비활성화합니다.
  useEffect(() => {
    if (entityType || entityId || userId) {
      setShowDashboardIntro(false);
    }
  }, [entityType, entityId, userId]);

  const [firstCardReady, setFirstCardReady] = useState(false);
  const [loadingPercent, setLoadingPercent] = useState(0);
  const [isClassVideoLoaded, setIsClassVideoLoaded] = useState(false);
  const [isSocialVideoLoaded, setIsSocialVideoLoaded] = useState(false);
  const [isEventVideoLoaded, setIsEventVideoLoaded] = useState(false);

  const handleProgress = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = e.currentTarget;
    if (video.buffered.length > 0 && video.duration) {
      const bufferedEnd = video.buffered.end(video.buffered.length - 1);
      const percent = Math.round((bufferedEnd / video.duration) * 100);
      setLoadingPercent(Math.min(percent, 100));
    }
  };

  const [activeFilter, setActiveFilter] = useState<LiveFilter>({ category: 'all' });
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [tempFilter, setTempFilter] = useState<LiveFilter>({ category: 'all' });
  const [activeCategoryTab, setActiveCategoryTab] = useState<'all' | 'social' | 'class' | 'event' | 'na'>('all');

  const stats = React.useMemo(() => {
    const yesterday = Date.now() - 24 * 60 * 60 * 1000;
    
    // 어제 게시물 필터링
    const yesterdayPosts = posts.filter(post => {
      const createdTime = safeDate(post.createdAt)?.getTime() || 0;
      return createdTime >= yesterday;
    });

    const targetPosts = yesterdayPosts.length >= 3 ? yesterdayPosts : posts.slice(0, 15);

    const classes = targetPosts.filter(p => Array.isArray(p.tags) && p.tags.some(t => t && t.type === 'class'));
    const socials = targetPosts.filter(p => Array.isArray(p.tags) && p.tags.some(t => t && t.type === 'social'));
    const events = targetPosts.filter(p => Array.isArray(p.tags) && (p.tags.some(t => t && t.type === 'event') || p.eventId));
    const groups = targetPosts.filter(p => Array.isArray(p.tags) && p.tags.some(t => t && t.type === 'group'));
    const my = targetPosts.filter(p => p.authorId === user?.uid);

    const getMediaInfo = (filteredPosts: GalleryPost[], fallbackUrl: string) => {
      const post = filteredPosts[0]; // 다른 카테고리의 데이터를 절대 임의로 훔쳐오지 않음
      if (!post || !post.media?.[0]) {
        return { url: fallbackUrl, isVideo: false };
      }
      const url = post.media[0];
      const isVideo = post.mediaTypes ? post.mediaTypes[0] === 'video' : (url.toLowerCase().includes('.mp4') || url.toLowerCase().includes('.mov') || url.toLowerCase().includes('.webm') || url.toLowerCase().includes('video'));
      return { url, isVideo };
    };

    const classMedia = getMediaInfo(classes, 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?q=80&w=500&auto=format&fit=crop');
    const socialMedia = getMediaInfo(socials, 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=500&auto=format&fit=crop');
    const eventMedia = getMediaInfo(events, 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?q=80&w=500&auto=format&fit=crop');

    return {
      classCount: classes.length,
      socialCount: socials.length,
      eventCount: events.length,
      groupCount: groups.length,
      myCount: my.length,
      classMedia,
      socialMedia,
      eventMedia,
    };
  }, [posts, user?.uid]);

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

    const preloadMedia = (url: string) => {
      if (!url) return;
      try {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = url.toLowerCase().includes('.mp4') || url.toLowerCase().includes('.mov') || url.toLowerCase().includes('.webm') ? 'video' : 'image';
        link.href = url;
        document.head.appendChild(link);
      } catch (e) {
        console.error('Preload failed:', e);
      }
    };

    const unsubscribe = galleryService.subscribeFeed(
      (data) => {
        setPosts(data);
        setLoading(false);

        // 대시보드 영상/이미지 백그라운드 프리로드 최적화
        try {
          if (data && data.length > 0) {
            const yesterday = Date.now() - 24 * 60 * 60 * 1000;
            const yesterdayPosts = data.filter(post => {
              const createdTime = safeDate(post.createdAt)?.getTime() || 0;
              return createdTime >= yesterday;
            });
            const targetPosts = yesterdayPosts.length >= 3 ? yesterdayPosts : data.slice(0, 15);
            
            const classes = targetPosts.filter(p => Array.isArray(p.tags) && p.tags.some(t => t && t.type === 'class'));
            const socials = targetPosts.filter(p => Array.isArray(p.tags) && p.tags.some(t => t && t.type === 'social'));
            const events = targetPosts.filter(p => Array.isArray(p.tags) && (p.tags.some(t => t && t.type === 'event') || p.eventId));
            
            const classPost = classes[0] || data.find(p => p.media?.[0]);
            const socialPost = socials[0] || data.find(p => p.media?.[0]);
            const eventPost = events[0] || data.find(p => p.media?.[0]);
            
            if (classPost?.media?.[0]) preloadMedia(classPost.media[0]);
            if (socialPost?.media?.[0]) preloadMedia(socialPost.media[0]);
            if (eventPost?.media?.[0]) preloadMedia(eventPost.media[0]);
          }
        } catch (err) {
          console.error("Dashboard preloading failed:", err);
        }
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

      {/* 어제 현황판 인트로 대시보드 */}
      <AnimatePresence>
        {showDashboardIntro && !entityType && !entityId && !userId && (
          <motion.div
            initial={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '-100%', scale: 0.95 }}
            transition={{ type: 'spring', damping: 26, stiffness: 170 }}
            className="absolute inset-0 bg-[#070709] z-[120] flex flex-col justify-between p-6 select-none overflow-hidden"
          >
            {/* 은은하게 깔리는 글로우 스크림 */}
            <div className="absolute top-[-20%] left-[-10%] w-[120%] h-[60%] bg-gradient-to-b from-[#007AFF]/15 to-transparent blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[80%] h-[50%] bg-gradient-to-t from-purple-500/10 to-transparent blur-[100px] rounded-full pointer-events-none" />

            {/* 상단 바 - Skip 서클 */}
            <div className="relative z-10 flex justify-between items-center w-full mt-safe pt-safe">
              <span className="text-[11px] font-black tracking-widest text-[#007AFF] uppercase bg-[#007AFF]/10 px-3 py-1 rounded-full border border-[#007AFF]/20">
                WoC Live
              </span>
              <button
                onClick={() => setShowDashboardIntro(false)}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 active:scale-95 transition-all text-white text-xs font-bold backdrop-blur-md shadow-lg"
              >
                <span>Skip</span>
                <SlidersHorizontal size={12} className="rotate-90 opacity-60" />
              </button>
            </div>

            {/* 중앙 마름모(다이아몬드) 썸네일 그리드 */}
            <div className="relative flex-1 w-full flex items-center justify-center py-8">
              <div className="relative w-full max-w-[340px] h-[340px] flex items-center justify-center">
                
                {/* 1. 좌측 마름모 카드 (수업 시연) */}
                <motion.div
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
                  className="absolute left-0 bottom-4 w-[130px] h-[130px] z-10 flex flex-col items-center"
                >
                  <div 
                    className="w-full h-full shadow-[0_15px_30px_rgba(0,0,0,0.5)] border border-white/20 transition-all duration-300 hover:border-[#007AFF]/50 cursor-pointer overflow-hidden relative"
                    style={{ 
                      clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
                    }}
                  >
                    {stats.classMedia.isVideo && (
                      <video 
                        src={stats.classMedia.url} 
                        muted 
                        playsInline 
                        autoPlay 
                        loop 
                        preload="auto"
                        onCanPlay={() => setIsClassVideoLoaded(true)}
                        onPlaying={() => setIsClassVideoLoaded(true)}
                        className="w-full h-full object-cover"
                      />
                    )}
                    <img 
                      src="https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?q=80&w=500&auto=format&fit=crop"
                      alt="" 
                      className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
                        (stats.classMedia.isVideo && isClassVideoLoaded) ? 'opacity-0 pointer-events-none' : 'opacity-100'
                      }`}
                    />
                  </div>
                  {/* 글로우 텍스트 배지 */}
                  <div className="absolute bottom-[-16px] bg-black/85 px-2.5 py-1 rounded-full border border-white/10 shadow-[0_0_12px_rgba(255,255,255,0.05)] flex items-center gap-1 backdrop-blur-md shrink-0">
                    <span className="text-[9px] font-black text-white whitespace-nowrap">🎬 {stats.classCount} Classes</span>
                  </div>
                </motion.div>

                {/* 2. 중앙 메인 마름모 카드 (소셜 밀롱가) */}
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute z-20 w-[170px] h-[170px] flex flex-col items-center"
                  style={{ top: '22%' }}
                >
                  <div 
                    className="w-full h-full shadow-[0_20px_45px_rgba(0,74,255,0.3)] border-2 border-white/30 transition-all duration-300 hover:border-[#007AFF] cursor-pointer overflow-hidden relative"
                    style={{ 
                      clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
                    }}
                  >
                    {stats.socialMedia.isVideo && (
                      <video 
                        src={stats.socialMedia.url} 
                        muted 
                        playsInline 
                        autoPlay 
                        loop 
                        preload="auto"
                        onCanPlay={() => setIsSocialVideoLoaded(true)}
                        onPlaying={() => setIsSocialVideoLoaded(true)}
                        className="w-full h-full object-cover"
                      />
                    )}
                    <img 
                      src="https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=500&auto=format&fit=crop"
                      alt="" 
                      className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
                        (stats.socialMedia.isVideo && isSocialVideoLoaded) ? 'opacity-0 pointer-events-none' : 'opacity-100'
                      }`}
                    />
                  </div>
                  {/* 글로우 텍스트 배지 */}
                  <div className="absolute bottom-[-20px] bg-black/90 px-3.5 py-1.5 rounded-full border border-[#007AFF]/40 shadow-[0_0_15px_rgba(0,122,255,0.3)] flex items-center gap-1 backdrop-blur-md shrink-0">
                    <span className="text-[10px] font-black text-[#007AFF] whitespace-nowrap">💃 {stats.socialCount} Socials</span>
                  </div>
                </motion.div>

                {/* 3. 우측 마름모 카드 (특별 공연) */}
                <motion.div
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
                  className="absolute right-0 bottom-4 w-[130px] h-[130px] z-10 flex flex-col items-center"
                >
                  <div 
                    className="w-full h-full shadow-[0_15px_30px_rgba(0,0,0,0.5)] border border-white/20 transition-all duration-300 hover:border-purple-500/50 cursor-pointer overflow-hidden relative"
                    style={{ 
                      clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
                    }}
                  >
                    {stats.eventMedia.isVideo && (
                      <video 
                        src={stats.eventMedia.url} 
                        muted 
                        playsInline 
                        autoPlay 
                        loop 
                        preload="auto"
                        onCanPlay={() => setIsEventVideoLoaded(true)}
                        onPlaying={() => setIsEventVideoLoaded(true)}
                        className="w-full h-full object-cover"
                      />
                    )}
                    <img 
                      src="https://images.unsplash.com/photo-1465847899084-d164df4dedc6?q=80&w=500&auto=format&fit=crop"
                      alt="" 
                      className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
                        (stats.eventMedia.isVideo && isEventVideoLoaded) ? 'opacity-0 pointer-events-none' : 'opacity-100'
                      }`}
                    />
                  </div>
                  {/* 글로우 텍스트 배지 */}
                  <div className="absolute bottom-[-16px] bg-black/85 px-2.5 py-1 rounded-full border border-white/10 shadow-[0_0_12px_rgba(255,255,255,0.05)] flex items-center gap-1 backdrop-blur-md shrink-0">
                    <span className="text-[9px] font-black text-white whitespace-nowrap">🎪 {stats.eventCount} Events</span>
                  </div>
                </motion.div>

              </div>
            </div>

            {/* 하단부 감성 텍스트 타이포 및 Enter 버튼 */}
            <div className="relative z-10 w-full flex flex-col items-center text-center gap-4 mb-safe pb-4">
              <div className="flex flex-col gap-1">
                <h1 className="text-lg font-black tracking-tight text-white/90 drop-shadow-md">
                  Yesterday in Tango Society
                </h1>
                <p className="text-[11px] text-white/50 font-bold max-w-xs leading-relaxed drop-shadow-sm px-4">
                  어제 우리 커뮤니티에는 수많은 교감의 모먼트들이 기록되었습니다. 준비 완료된 라이브 속으로 입장해 보세요!
                </p>
              </div>

              {/* 스톤님 제안: ENTER LIVE 버튼 */}
              <button
                onClick={() => setShowDashboardIntro(false)}
                className="w-full max-w-[260px] py-4 rounded-2xl text-[11px] font-black tracking-widest uppercase transition-all duration-300 active:scale-95 shadow-lg border flex items-center justify-center gap-2.5 select-none bg-primary text-white border-primary/20 hover:bg-primary-dark cursor-pointer shadow-[0_0_20px_rgba(0,122,255,0.4)] animate-pulse"
              >
                <span>ENTER LIVE</span>
                {firstCardReady ? (
                  <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                ) : (
                  <div className="flex items-center gap-1.5 ml-1 bg-black/35 px-2 py-0.5 rounded-full border border-white/10">
                    <div className="w-2.5 h-2.5 border border-white/20 border-t-[#007AFF] rounded-full animate-spin shrink-0" />
                    <span className="text-[8px] font-black tracking-tighter text-[#007AFF]">{loadingPercent}%</span>
                  </div>
                )}
              </button>

              {/* Closed 보안 개체 정직한 통계 배지 */}
              <div className="flex items-center gap-3.5 bg-white/5 border border-white/10 px-4 py-2 rounded-full backdrop-blur-md shadow-md mt-1">
                <div className="flex items-center gap-1.5 text-[9px] font-black text-white/50 tracking-wider">
                  <span className="material-symbols-outlined text-[11px] text-white/40">lock</span>
                  <span>{stats.groupCount} Group Streams</span>
                </div>
                <div className="w-[1px] h-2.5 bg-white/15" />
                <div className="flex items-center gap-1.5 text-[9px] font-black text-white/50 tracking-wider">
                  <span className="material-symbols-outlined text-[11px] text-white/40">person</span>
                  <span>{stats.myCount} My Moments</span>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-1">
                <div className="w-1.5 h-1.5 bg-[#007AFF] rounded-full animate-ping" />
                <span className="text-[8px] font-black tracking-widest text-[#007AFF] uppercase">Yesterday Dashboard</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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

        {filteredPosts.map((post, idx) => (
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
            onFirstCardLoaded={idx === 0 ? () => setFirstCardReady(true) : undefined}
            loadingPercent={idx === 0 ? loadingPercent : undefined}
            handleProgress={idx === 0 ? handleProgress : undefined}
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
  activeFilter,
  onFirstCardLoaded,
  loadingPercent: parentLoadingPercent,
  handleProgress: parentHandleProgress
}: {
  post: GalleryPost,
  onOpenComments: () => void,
  isImmersive: boolean,
  onOpenImmersive: () => void,
  onCloseImmersive: () => void,
  onOpenFilter?: () => void,
  activeFilter?: LiveFilter,
  onFirstCardLoaded?: () => void,
  loadingPercent?: number,
  handleProgress?: (e: React.SyntheticEvent<HTMLVideoElement>) => void
}) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [activeDot, setActiveDot] = useState(0);
  const [isMirrored, setIsMirrored] = useState(false);
  const [isVideoLoading, setIsVideoLoading] = useState(true);
  const [localLoadingPercent, setLocalLoadingPercent] = useState(0);
  
  const effectiveLoadingPercent = parentLoadingPercent !== undefined ? parentLoadingPercent : localLoadingPercent;

  const handleProgress = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = e.currentTarget;
    if (video.buffered.length > 0 && video.duration) {
      const bufferedEnd = video.buffered.end(video.buffered.length - 1);
      const percent = Math.round((bufferedEnd / video.duration) * 100);
      const targetPercent = Math.min(percent, 100);
      setLocalLoadingPercent(targetPercent);
      if (parentHandleProgress) {
        parentHandleProgress(e);
      }
    }
  };

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
                <div className="relative w-full h-full">
                  <video
                    ref={el => { videoRefs.current[idx] = el }}
                    src={url}
                    className={`w-full h-full object-cover transition-transform duration-300 ${isMirrored ? 'scale-x-[-1]' : 'scale-x-[1]'}`}
                    loop
                    muted={isMuted}
                    playsInline
                    onProgress={handleProgress}
                    onWaiting={() => setIsVideoLoading(true)}
                    onPlaying={() => { setIsVideoLoading(false); onFirstCardLoaded?.(); }}
                    onCanPlay={() => { setIsVideoLoading(false); onFirstCardLoaded?.(); }}
                    onLoadedData={() => { setIsVideoLoading(false); onFirstCardLoaded?.(); }}
                  />
                  <AnimatePresence>
                    {isVideoLoading && (
                      <motion.div
                        initial={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.35 }}
                        className="absolute inset-0 bg-black flex items-center justify-center z-10 overflow-hidden"
                      >
                        {/* 썸네일 먼저 선노출 - 원본 선명도 유지 */}
                        <div 
                          className="absolute inset-0 bg-cover bg-center opacity-100 scale-100 transition-all duration-300"
                          style={{ backgroundImage: `url(${post.media[0] || ''})` }}
                        />
                        {/* 이미지 위의 어두운 스크림 필터 */}
                        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
                        
                        {/* Stitch 프리미엄 퍼센티지 원형 로딩 게이지 */}
                        <div className="relative flex flex-col items-center gap-3 z-20">
                          <div className="relative w-16 h-16 flex items-center justify-center select-none">
                            <div className="absolute inset-0 border-4 border-white/10 border-t-[#007AFF] rounded-full animate-spin shadow-[0_0_15px_rgba(0,122,255,0.4)]" />
                            <span className="text-[12px] text-white font-black tracking-tighter drop-shadow-lg z-10">
                              {effectiveLoadingPercent}%
                            </span>
                          </div>
                          <span className="text-[10px] text-white font-black tracking-widest uppercase bg-black/55 px-3 py-1 rounded-full border border-white/10 shadow-lg backdrop-blur-xs select-none">
                            Buffering
                          </span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <img 
                  src={url} 
                  alt="" 
                  className={`w-full h-full object-cover transition-transform duration-300 ${isMirrored ? 'scale-x-[-1]' : 'scale-x-[1]'}`} 
                />
              )}

              {!isPlaying && isVideo && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 z-[5]">
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

          {/* Mirror Toggle Button */}
          <button 
            className="flex flex-col items-center group" 
            onClick={(e) => {
              e.stopPropagation();
              setIsMirrored(!isMirrored);
            }}
            title={t('gallery.mirror_mode') || 'Mirror Mode'}
          >
            <div className={`w-9 h-9 rounded-full flex items-center justify-center bg-black/20 backdrop-blur-md border transition-all duration-300 active:scale-90 cursor-pointer ${
              isMirrored
                ? 'text-[#007AFF] border-[#007AFF]/50 bg-[#007AFF]/10 shadow-[0_0_8px_rgba(0,122,255,0.4)]'
                : 'text-white border-white/10'
            }`}>
              <FlipHorizontal size={18} className="drop-shadow-md" />
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
