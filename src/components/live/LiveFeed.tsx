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
  const [loadingPercent, setLoadingPercent] = useState(100);
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

  // 100% 무결한 시간순 내림차순(최신순) 강제 정렬 포스트 목록 생성
  const sortedPosts = React.useMemo(() => {
    return [...posts].sort((a, b) => {
      const timeA = safeDate(a.createdAt)?.getTime() || 0;
      const timeB = safeDate(b.createdAt)?.getTime() || 0;
      return timeB - timeA; // 최신이 위로!
    });
  }, [posts]);

  // 최초 렌더링용 대표 영상 (가장 최신 라이브 피드 포스트 비디오) URL 정밀 추출
  const firstVideoUrl = React.useMemo(() => {
    const firstPost = sortedPosts[0];
    if (!firstPost || !firstPost.media?.[0]) return null;
    const url = firstPost.media[0];
    const isVideo = firstPost.mediaTypes 
      ? firstPost.mediaTypes[0] === 'video' 
      : (url.toLowerCase().includes('.mp4') || url.toLowerCase().includes('.mov') || url.toLowerCase().includes('.webm') || url.toLowerCase().includes('video'));
    return isVideo ? url : null;
  }, [sortedPosts]);

  const stats = React.useMemo(() => {
    // 스톤님 지침: 최근 초기이므로 최근 30일(한 달) 기준으로 집계
    const last30Days = Date.now() - 30 * 24 * 60 * 60 * 1000;
    
    // 최근 30일 게시물 필터링 (최신순 정렬된 sortedPosts 활용)
    const recentPosts = sortedPosts.filter(post => {
      const createdTime = safeDate(post.createdAt)?.getTime() || 0;
      return createdTime >= last30Days;
    });

    const targetPosts = recentPosts.length >= 3 ? recentPosts : sortedPosts.slice(0, 15);

    const classes = targetPosts.filter(p => Array.isArray(p.tags) && p.tags.some(t => t && t.type === 'class'));
    const socials = targetPosts.filter(p => Array.isArray(p.tags) && p.tags.some(t => t && t.type === 'social'));
    const events = targetPosts.filter(p => Array.isArray(p.tags) && (p.tags.some(t => t && t.type === 'event') || p.eventId));
    const groups = targetPosts.filter(p => Array.isArray(p.tags) && p.tags.some(t => t && t.type === 'group'));
    const my = targetPosts.filter(p => p.authorId === user?.uid);

    const getMediaInfo = (filteredPosts: GalleryPost[], fallbackUrl: string) => {
      const post = filteredPosts[0]; // 무결하게 정렬된 최신 게시글 0번째 요소를 활용
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

  // 스톤님 정적 HTML DIVE IN 버튼 이벤트 위임 핸들러 (비동기 데이터 갱신에 100% 면역 및 로딩 잠금 결합)
  const handleDashboardClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const btn = (e.target as HTMLElement).closest('button[aria-label="Enter Live"]');
    if (btn) {
      // 100% 로딩 완료 전에는 진입 차단 (잠금 장치)
      if (loadingPercent < 100) {
        return;
      }
      setShowDashboardIntro(false);
    }
  };

  // 대시보드 진입 즉시 비디오 강제 가동 엔진
  useEffect(() => {
    if (!showDashboardIntro) return;
    
    const container = containerRef.current;
    if (!container) return;

    const playAllDashboardVideos = () => {
      if (!container) return;
      const videos = container.querySelectorAll('video');
      videos.forEach((video) => {
        // 비디오가 멈추지 않고 즉시 구동될 수 있도록 재생 강제 트리거 발사
        video.play().catch(() => {
          // 브라우저 정책상 재생 거부 시 조용히 넘김
        });
      });
    };

    // DOM이 안전하게 렌더링된 후 강제 재생 가동
    const timer = setTimeout(() => {
      playAllDashboardVideos();
    }, 150);

    return () => {
      clearTimeout(timer);
    };
  }, [showDashboardIntro]);

  // DIVE IN 버튼의 상시 활성화 인스턴트 트리거 효과
  useEffect(() => {
    if (!showDashboardIntro) return;
    const container = containerRef.current;
    if (!container) return;

    const button = container.querySelector('[aria-label="Enter Live"]') as HTMLButtonElement | null;
    if (button) {
      button.style.opacity = '1.0';
      button.style.cursor = 'pointer';
      button.classList.add('animate-bounce-subtle');
    }
  }, [showDashboardIntro]);

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

  // 스톤님 정적 HTML 동적 데이터 바인딩 치환 헬퍼 (애니메이션, 영상, 7일 집계 카운트 자동 매핑)
  const getDashboardHtml = () => {
    if (typeof window === "undefined") return "";
    
    // 1. 순수 바디 HTML 조각 복원
    let html = decodeURIComponent(atob(ANTIGRAVITY_HTML).split("").map(function(c) { 
      return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2); 
    }).join(""));

    // [이중 바디 방지 핵심 조치] 중간에 묻어 있는 </head> 및 <body> 찌꺼기를 완전히 도려내어 파서 교란을 방지합니다.
    html = html.replace('</head>', '');
    html = html.replace(/<body[^>]*>/i, '');

    // 다이아몬드 레이아웃이 모바일 뷰포트 공간 내에 정교하게 핏(Fit)되도록 상한 가로 크기를 250px로 우아하게 스케일 다운합니다.
    // 이렇게 하면 밀려 올라가서 안 보였던 상단 Streams / Moments 정보바가 상단 탭 바로 아래에 100% 온전히 드러납니다!
    html = html.replace('max-width: 320px;', 'max-width: 250px;');

    // 2. 카운트 데이터 실시간 바인딩 치환
    html = html.replace('7 Group Streams', `${stats.groupCount} Group Streams`);
    html = html.replace('3 My Moments', `${stats.myCount} My Moments`);
    html = html.replace('3 Socials', `${stats.socialCount} Socials`);
    html = html.replace('0 Events', `${stats.eventCount} Events`);
    html = html.replace('3 Classes', `${stats.classCount} Classes`);

    // 2.5. 0% 및 진행률 링을 배제하고 즉시 활성화된 컴팩트 재생 아이콘으로 상시 고정
    const initialRingHtml = `
<div class="relative w-8 h-8 flex items-center justify-center bg-primary rounded-full shrink-0">
<span class="material-symbols-outlined text-[16px] font-bold text-white select-none">play_arrow</span>
</div>
    `.trim();

    const ringPattern = /<div class="relative w-8 h-8 flex items-center justify-center bg-black\/20 rounded-full shrink-0">[\s\S]*?<\/div>/;
    html = html.replace(ringPattern, initialRingHtml);

    // DIVE IN 버튼 초기 비활성화/활성화 인라인 스타일 동적 매핑
    const initialOpacity = '1.0';
    const initialCursor = 'pointer';
    const initialBounceClass = ' animate-bounce-subtle';
    
    html = html.replace(
      '<button aria-label="Enter Live" class="',
      `<button aria-label="Enter Live" style="opacity: ${initialOpacity}; cursor: ${initialCursor};" class="${initialBounceClass} `
    );

    // DIVE IN 버튼 배경 그라디언트 대비 및 가독성 개선 (흰색 글씨와 겹치는 primary-container를 진한 WoC 시그니처 블루로 치환)
    html = html.replace('from-primary-container to-primary', 'from-[#0057bd] to-[#0984e3]');

    // 3. 미디어(이미지 및 비디오) 리얼타임 동적 스왑 바인딩
    // Top Social Diamond
    if (stats.socialMedia.isVideo) {
      const socialPoster = 'https://lh3.googleusercontent.com/aida-public/AB6AXuBoLBgIoFjrCPv3ecTx1KjvquuH8D8fF_vfuOzg0uYlLNIUxmZ_iZ1baVNy-fIb23AK5MdEcYsvejAm3rrWwE-wC7_UpQB9TGr86NGHQeISKGYTo4JT63BJa6gdCZZxFSreuQ16G-4_z02wF0HHdXXFAOUFCDXWRffPiCxzWkdI_RJBnsNKud5b7DquLHJxLxZ4rLGca4rYn_KVJeU3NtlqGI5Qu5JSJkSCyAXvh2Y-O58vufupimBLzoGbs-pQEMZCV5_P7ZukfcKr';
      html = html.replace(
        `<img alt="Tango Social Event" class="diamond-img" src="${socialPoster}"/>`,
        `<video class="diamond-img" src="${stats.socialMedia.url}" poster="${socialPoster}" autoPlay loop muted playsInline preload="auto" />`
      );
    } else {
      html = html.replace(
        'https://lh3.googleusercontent.com/aida-public/AB6AXuBoLBgIoFjrCPv3ecTx1KjvquuH8D8fF_vfuOzg0uYlLNIUxmZ_iZ1baVNy-fIb23AK5MdEcYsvejAm3rrWwE-wC7_UpQB9TGr86NGHQeISKGYTo4JT63BJa6gdCZZxFSreuQ16G-4_z02wF0HHdXXFAOUFCDXWRffPiCxzWkdI_RJBnsNKud5b7DquLHJxLxZ4rLGca4rYn_KVJeU3NtlqGI5Qu5JSJkSCyAXvh2Y-O58vufupimBLzoGbs-pQEMZCV5_P7ZukfcKr',
        stats.socialMedia.url
      );
    }

    // Bottom Left Events Diamond (0 Events 라벨이 붙은 탱고 이벤트 퍼포먼스 이미지)
    if (stats.eventMedia.isVideo) {
      const eventPoster = 'https://lh3.googleusercontent.com/aida-public/AB6AXuBLZtZiHjgb9n4h41W4-Yy8Us7Of-l5RN8_SWlnOt5rF5TWoKsugs_FZmktcFz2kTQSDmd9gsAjAmIvl5i_UcyqJo308W7iOPhcD3O4cF2zGvtoGaO05xayARNQXBbynXhWGomy2J3bEIImZKHzHk8TMtnJ5zq1dIhbS8JQtxirTWKdJbFzmV5EN8YF9J1MnHwzasY6cOLLo3UJUAXd1ENMIIDrzZuXKsxss_xNo2-Ui7jY1M4GfyeZo7jOTY4UpKDPxKIpztk-7Wmm';
      html = html.replace(
        `<img alt="Tango Event Performance" class="diamond-img" src="${eventPoster}"/>`,
        `<video class="diamond-img" src="${stats.eventMedia.url}" poster="${eventPoster}" autoPlay loop muted playsInline preload="auto" />`
      );
    } else {
      html = html.replace(
        'https://lh3.googleusercontent.com/aida-public/AB6AXuBLZtZiHjgb9n4h41W4-Yy8Us7Of-l5RN8_SWlnOt5rF5TWoKsugs_FZmktcFz2kTQSDmd9gsAjAmIvl5i_UcyqJo308W7iOPhcD3O4cF2zGvtoGaO05xayARNQXBbynXhWGomy2J3bEIImZKHzHk8TMtnJ5zq1dIhbS8JQtxirTWKdJbFzmV5EN8YF9J1MnHwzasY6cOLLo3UJUAXd1ENMIIDrzZuXKsxss_xNo2-Ui7jY1M4GfyeZo7jOTY4UpKDPxKIpztk-7Wmm',
        stats.eventMedia.url
      );
    }

    // Bottom Right Classes Diamond (3 Classes 라벨이 붙은 탱고 클래스 이미지)
    if (stats.classMedia.isVideo) {
      const classPoster = 'https://lh3.googleusercontent.com/aida-public/AB6AXuAklN_kd0yAyHkvd4ERre0XpOU-Th5WUC7IHRv1g-YjWgFZrYZFC0_j5-_rfSxv62kY0Zh1WKelSdeRJZTxG3WCxdm4Gx3cu9ODbUMhUtG-D7DmJK7zAK_bKwB04Tzei8wezqWVabv8iHJFTdZ1bDvLGu-6WW8P4sPxgDW0PMKeAcRzYko1DUr7qlhcSRMhzOneih5rbMoeHTcbhm5O117SF3FEzMw-8NbuKXCVkTgDo9F3A91PGrqrkF_DGCnYj_QVMQGCWAMdHIos';
      html = html.replace(
        `<img alt="Tango Class" class="diamond-img" src="${classPoster}"/>`,
        `<video class="diamond-img" src="${stats.classMedia.url}" poster="${classPoster}" autoPlay loop muted playsInline preload="auto" />`
      );
    } else {
      html = html.replace(
        'https://lh3.googleusercontent.com/aida-public/AB6AXuAklN_kd0yAyHkvd4ERre0XpOU-Th5WUC7IHRv1g-YjWgFZrYZFC0_j5-_rfSxv62kY0Zh1WKelSdeRJZTxG3WCxdm4Gx3cu9ODbUMhUtG-D7DmJK7zAK_bKwB04Tzei8wezqWVabv8iHJFTdZ1bDvLGu-6WW8P4sPxgDW0PMKeAcRzYko1DUr7qlhcSRMhzOneih5rbMoeHTcbhm5O117SF3FEzMw-8NbuKXCVkTgDo9F3A91PGrqrkF_DGCnYj_QVMQGCWAMdHIos',
        stats.classMedia.url
      );
    }

    return html;
  };

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
    <div 
      ref={containerRef}
      className={`${isImmersive ? 'fixed inset-0 z-[100]' : 'relative w-full h-full min-h-[500px]'} bg-black overflow-hidden flex flex-col ${className}`}
    >
      {showDashboardIntro ? (
        /* 어제 현황판 인트로 대시보드 (하단 푸터바 가림 방지 pb-20 적용 및 동적 데이터 바인딩 헬퍼 결합) */
        <div 
          className="w-full h-full bg-surface text-on-surface font-sans flex flex-col items-center justify-start gap-4 pt-[120px] pb-20 px-4 selection:bg-primary selection:text-white select-none overflow-y-auto"
          onClick={handleDashboardClick}
          dangerouslySetInnerHTML={{ __html: getDashboardHtml() }}
        />
      ) : (
        /* Feed Container - Vertical Snap */
        <div
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
      )}

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

const ANTIGRAVITY_HTML = "PHN0eWxlIGRhdGEtcHVycG9zZT0iZGlhbW9uZC1sYXlvdXQiPgogICAgLyogRGlhbW9uZCBzaGFwaW5nIGFuZCBwb3NpdGlvbmluZyAqLwogICAgLmRpYW1vbmQtY29udGFpbmVyIHsKICAgICAgcG9zaXRpb246IHJlbGF0aXZlOwogICAgICB3aWR0aDogMTAwJTsKICAgICAgYXNwZWN0LXJhdGlvOiAxIC8gMS4xOyAvKiBBZGp1c3QgcmF0aW8gZm9yIHN0YWdnZXJlZCBsYXlvdXQgKi8KICAgICAgbWF4LXdpZHRoOiAzMjBweDsKICAgICAgbWFyZ2luOiAwIGF1dG87CiAgICB9CiAgICAKICAgIC5kaWFtb25kLXdyYXBwZXIgewogICAgICBwb3NpdGlvbjogYWJzb2x1dGU7CiAgICAgIHdpZHRoOiA1NSU7CiAgICAgIGFzcGVjdC1yYXRpbzogMSAvIDE7CiAgICAgIGJvcmRlci1yYWRpdXM6IDFyZW07IC8qIFNvZnRlbmVkIGNvcm5lcnMgZm9yIGRpYW1vbmQgKi8KICAgICAgb3ZlcmZsb3c6IGhpZGRlbjsKICAgICAgLyogQW5pbWF0aW9uIGFwcGxpZWQgaW4gdGFpbHdpbmQgY2xhc3NlcyAqLwogICAgICB0cmFuc2l0aW9uOiBhbGwgMC4zcyBlYXNlOwogICAgfQogICAgCiAgICAvKiBDb3VudGVyLXJvdGF0ZSBpbWFnZSBpbnNpZGUgZGlhbW9uZCAqLwogICAgLmRpYW1vbmQtaW1nIHsKICAgICAgd2lkdGg6IDE1MCU7CiAgICAgIGhlaWdodDogMTUwJTsKICAgICAgb2JqZWN0LWZpdDogY292ZXI7CiAgICAgIHRyYW5zZm9ybTogcm90YXRlKC00NWRlZykgc2NhbGUoMS40KTsKICAgICAgdHJhbnNmb3JtLW9yaWdpbjogY2VudGVyIGNlbnRlcjsKICAgIH0KCiAgICAvKiBQb3NpdGlvbmluZyBpbmRpdmlkdWFsIGRpYW1vbmRzICovCiAgICAuZGlhbW9uZC10b3AgewogICAgICB0b3A6IDA7CiAgICAgIGxlZnQ6IDUwJTsKICAgICAgdHJhbnNmb3JtOiB0cmFuc2xhdGVYKC01MCUpIHJvdGF0ZSg0NWRlZyk7CiAgICAgIHotaW5kZXg6IDEwOwogICAgfQogICAgCiAgICAuZGlhbW9uZC1ib3R0b20tbGVmdCB7CiAgICAgIHRvcDogNDUlOwogICAgICBsZWZ0OiA1JTsKICAgICAgdHJhbnNmb3JtOiByb3RhdGUoNDVkZWcpOwogICAgfQogICAgCiAgICAuZGlhbW9uZC1ib3R0b20tcmlnaHQgewogICAgICB0b3A6IDQ1JTsKICAgICAgcmlnaHQ6IDUlOwogICAgICB0cmFuc2Zvcm06IHJvdGF0ZSg0NWRlZyk7CiAgICB9CgogICAgLyogRmxvYXRpbmcgbGFiZWxzICovCiAgICAuZmxvYXRpbmctbGFiZWwgewogICAgICBwb3NpdGlvbjogYWJzb2x1dGU7CiAgICAgIHotaW5kZXg6IDIwOwogICAgICB0cmFuc2Zvcm06IHRyYW5zbGF0ZVgoLTUwJSk7CiAgICAgIHdoaXRlLXNwYWNlOiBub3dyYXA7CiAgICB9CiAgICAKICAgIC5sYWJlbC10b3AgewogICAgICB0b3A6IGNhbGMoNDUlIC0gMS41cmVtKTsKICAgICAgbGVmdDogNTAlOwogICAgfQogICAgCiAgICAubGFiZWwtYm90dG9tLWxlZnQgewogICAgICB0b3A6IGNhbGMoOTAlICsgMXJlbSk7CiAgICAgIGxlZnQ6IDI3LjUlOwogICAgfQogICAgCiAgICAubGFiZWwtYm90dG9tLXJpZ2h0IHsKICAgICAgdG9wOiBjYWxjKDkwJSArIDFyZW0pOwogICAgICBsZWZ0OiA3Mi41JTsKICAgIH0KICA8L3N0eWxlPgo8L2hlYWQ+Cjxib2R5IGNsYXNzPSJiZy1zdXJmYWNlIHRleHQtb24tc3VyZmFjZSBmb250LXNhbnMgaC1bMTAwZHZoXSBvdmVyZmxvdy1oaWRkZW4gZmxleCBmbGV4LWNvbCBpdGVtcy1jZW50ZXIganVzdGlmeS1iZXR3ZWVuIHB5LTYgcHgtNCBzZWxlY3Rpb246YmctcHJpbWFyeSBzZWxlY3Rpb246dGV4dC13aGl0ZSI+CjwhLS0gQkVHSU46IFRvcCBJbmZvIEJhciAtLT4KPGhlYWRlciBjbGFzcz0idy1mdWxsIG1heC13LW1kIGZsZXgganVzdGlmeS1zdGFydCBnYXAtMyBtdC00IiBkYXRhLXB1cnBvc2U9InRvcC1pbmZvIj4KPGRpdiBjbGFzcz0iZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTIgYmctc3VyZmFjZS1kaW0vNDAgYm9yZGVyIGJvcmRlci1vdXRsaW5lLzIwIHB4LTMgcHktMS41IHJvdW5kZWQtZnVsbCB0ZXh0LXhzIGZvbnQtc2VtaWJvbGQgdGV4dC1vbi1zdXJmYWNlLXZhcmlhbnQgc2hhZG93LXNtIGJhY2tkcm9wLWJsdXItc20iPgo8c3ZnIGZpbGw9Im5vbmUiIGhlaWdodD0iMTQiIHN0cm9rZT0iY3VycmVudENvbG9yIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIHN0cm9rZS13aWR0aD0iMiIgdmlld2JveD0iMCAwIDI0IDI0IiB3aWR0aD0iMTQiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3QgaGVpZ2h0PSIxMSIgcng9IjIiIHJ5PSIyIiB3aWR0aD0iMTgiIHg9IjMiIHk9IjExIj48L3JlY3Q+PHBhdGggZD0iTTcgMTFWN2E1IDUgMCAwIDEgMTAgMHY0Ij48L3BhdGg+PC9zdmc+CjxzcGFuPjcgR3JvdXAgU3RyZWFtczwvc3Bhbj4KPC9kaXY+CjxkaXYgY2xhc3M9ImZsZXggaXRlbXMtY2VudGVyIGdhcC0yIGJnLXN1cmZhY2UtZGltLzQwIGJvcmRlciBib3JkZXItb3V0bGluZS8yMCBweC0zIHB5LTEuNSByb3VuZGVkLWZ1bGwgdGV4dC14cyBmb250LXNlbWlib2xkIHRleHQtb24tc3VyZmFjZS12YXJpYW50IHNoYWRvdy1zbSBiYWNrZHJvcC1ibHVyLXNtIj4KPHN2ZyBmaWxsPSJub25lIiBoZWlnaHQ9IjE0IiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBzdHJva2Utd2lkdGg9IjIiIHZpZXdib3g9IjAgMCAyNCAyNCIgd2lkdGg9IjE0IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxwYXRoIGQ9Ik0yMCAyMXYtMmE0IDQgMCAwIDAtNC00SDhhNCA0IDAgMCAwLTQgNHYyIj48L3BhdGg+PGNpcmNsZSBjeD0iMTIiIGN5PSI3IiByPSI0Ij48L2NpcmNsZT48L3N2Zz4KPHNwYW4+MyBNeSBNb21lbnRzPC9zcGFuPgo8L2Rpdj4KPC9oZWFkZXI+CjwhLS0gRU5EOiBUb3AgSW5mbyBCYXIgLS0+CjwhLS0gQkVHSU46IERpYW1vbmQgR2FsbGVyeSAtLT4KPG1haW4gY2xhc3M9InctZnVsbCBmbGV4LTEgZmxleCBmbGV4LWNvbCBqdXN0aWZ5LWNlbnRlciBpdGVtcy1jZW50ZXIgbWItMiBtYXgtdy1tZCBtdC0wIiBkYXRhLXB1cnBvc2U9ImdhbGxlcnktYXJlYSI+CjxkaXYgY2xhc3M9ImRpYW1vbmQtY29udGFpbmVyIj4KPCEtLSBUb3AgRGlhbW9uZDogU29jaWFscyAtLT4KPGRpdiBjbGFzcz0iZGlhbW9uZC13cmFwcGVyIGRpYW1vbmQtdG9wIGFuaW1hdGUtcHVsc2Utc2VxLTEgc2hhZG93LW1kIGJnLXdoaXRlIGJvcmRlci0yIGJvcmRlci13aGl0ZS81MCI+CjxpbWcgYWx0PSJUYW5nbyBTb2NpYWwgRXZlbnQiIGNsYXNzPSJkaWFtb25kLWltZyIgc3JjPSJodHRwczovL2xoMy5nb29nbGV1c2VyY29udGVudC5jb20vYWlkYS1wdWJsaWMvQUI2QVh1Qm9MQmdJb0ZqckNQdjNlY1R4MUtqdnF1dUg4RDhmRl92ZnVPemcwdVlsTE5JVXhtWl9pWjFiYVZOeS1mSWIyM0FLNU1kRWNZc3ZlakFtM3JyV3dFLXdDN19VcFFCOVRHcjg2TkdIUWVJU0tHWVRvNEpUNjNCSmE2Z2RDWlp4RlNyZXVRMTZHLTRfejAyd0YwSEhkWFhGQU9VRkNEWFdSZmZQaUN4eldrZElfUkpCbnNOS3VkNWI3RHF1TEhKeEx4WjRyTEdjYTRyWW5fS1ZKZVUzTnRscUdJNVF1NUpTSmtTQ3lBWHZoMlktTzU4dnVmdXBpbUJMem9HYnMtcFFFTVpDVjVfUDdadWtmY0tyIi8+CjwvZGl2Pgo8IS0tIExhYmVsIC0tPgo8ZGl2IGNsYXNzPSJmbG9hdGluZy1sYWJlbCBsYWJlbC10b3AgYmctYmxhY2sgdGV4dC13aGl0ZSBweC00IHB5LTEuNSByb3VuZGVkLWZ1bGwgdGV4dC1zbSBmb250LWJvbGQgZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTIgc2hhZG93LWxnIGJvcmRlciBib3JkZXItcHJpbWFyeS8zMCBzaGFkb3ctcHJpbWFyeS8yMCI+CjxzcGFuPvCfkoM8L3NwYW4+IDxzcGFuIGNsYXNzPSJ0ZXh0LXByaW1hcnkiPjMgU29jaWFsczwvc3Bhbj4KPC9kaXY+CjwhLS0gQm90dG9tIExlZnQgRGlhbW9uZDogQ2xhc3NlcyAtLT4KPGRpdiBjbGFzcz0iZGlhbW9uZC13cmFwcGVyIGRpYW1vbmQtYm90dG9tLWxlZnQgYW5pbWF0ZS1wdWxzZS1zZXEtMiBzaGFkb3ctbWQgYmctd2hpdGUgYm9yZGVyLTIgYm9yZGVyLXdoaXRlLzUwIj4KPGltZyBhbHQ9IlRhbmdvIEV2ZW50IFBlcmZvcm1hbmNlIiBjbGFzcz0iZGlhbW9uZC1pbWciIHNyYz0iaHR0cHM6Ly9saDMuZ29vZ2xldXNlcmNvbnRlbnQuY29tL2FpZGEtcHVibGljL0FCNkFYdUJMWnRaaUhqZ2I5bjRoNDFXNC1ZeThVczdPZi1sNVJOOF9TV2xuT3Q1ckY1VFdvS3N1Z3NfRlpta3RjRnoya1RRU0RtZDlnc0FqQW1Jdmw1aV9VY3lxSm8zMDhXN2lPUGhjRDNPNGNGMnpHdnRvR2FPMDV4YXlBUk5RWEJieW5YaFdHb215MkozYkVJSW1aS0h6SGs4VE10bko1enExZEloYlM4SlF0eGlyVFdLZEpiRnptVjVFTjhZRjlKMU1uSHd6YXNZNmNPTExvM1VKVUFYZDFFTk1JSURyelp1WEtzeHNzX3hObzItVWk3alkxTTRHZnllWm83ak9UWTRVcEtEUHhLSXB6dGstN1dtbSIvPgo8L2Rpdj4KPCEtLSBMYWJlbCAtLT4KPGRpdiBjbGFzcz0iZmxvYXRpbmctbGFiZWwgbGFiZWwtYm90dG9tLWxlZnQgYmctc3VyZmFjZS1kaW0gdGV4dC1vbi1zdXJmYWNlIHB4LTMgcHktMSByb3VuZGVkLWZ1bGwgdGV4dC14cyBmb250LWJvbGQgZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTEuNSBzaGFkb3ctbWQgYm9yZGVyIGJvcmRlci1vdXRsaW5lLzEwIj4KPHNwYW4+8J+Oqjwvc3Bhbj4gPHNwYW4+MCBFdmVudHM8L3NwYW4+CjwvZGl2Pgo8IS0tIEJvdHRvbSBSaWdodCBEaWFtb25kOiBFdmVudHMgLS0+CjxkaXYgY2xhc3M9ImRpYW1vbmQtd3JhcHBlciBkaWFtb25kLWJvdHRvbS1yaWdodCBhbmltYXRlLXB1bHNlLXNlcS0zIHNoYWRvdy1tZCBiZy13aGl0ZSBib3JkZXItMiBib3JkZXItd2hpdGUvNTAiPgo8aW1nIGFsdD0iVGFuZ28gQ2xhc3MiIGNsYXNzPSJkaWFtb25kLWltZyIgc3JjPSJodHRwczovL2xoMy5nb29nbGV1c2VyY29udGVudC5jb20vYWlkYS1wdWJsaWMvQUI2QVh1QWtsTl9rZDB5QXlIa3ZkNEVScmUwWHBPVS1UaDVXVUM3SUhSdjFnLVlqV2dGWnJZWkZDMF9qNS1fcmZTeHY2MmtZMFpoMVdLZWxTZGVSSlpUeEczV0N4ZG00R3gzY3U5T0RiVU1oVXRHLUQ3RG1KSzd6QUtfYkt3QjA0VHplaTh3ZXpxV1ZhYnY4aUhKRlRkWjFiRHZMR3UtNldXOFA0c1B4Z0RXMFBNS2VBY1J6WWtvMURVcjdxbGhjU1JNaHpPbmVpaDVyYk1vZUhUY2JobTVPMTE3U0YzRkV6TXctOE5idUtYQ1ZrVGdEbzlGM0E5MVBHcnFya0ZfREdDbllqX1FWTVFHQ1dBTWRISW9zIi8+CjwvZGl2Pgo8IS0tIExhYmVsIC0tPgo8ZGl2IGNsYXNzPSJmbG9hdGluZy1sYWJlbCBsYWJlbC1ib3R0b20tcmlnaHQgYmctc3VyZmFjZS1kaW0gdGV4dC1vbi1zdXJmYWNlIHB4LTMgcHktMSByb3VuZGVkLWZ1bGwgdGV4dC14cyBmb250LWJvbGQgZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTEuNSBzaGFkb3ctbWQgYm9yZGVyIGJvcmRlci1vdXRsaW5lLzEwIj4KPHNwYW4+8J+OrDwvc3Bhbj4gPHNwYW4+MyBDbGFzc2VzPC9zcGFuPgo8L2Rpdj4KPC9kaXY+CjwvbWFpbj4KPCEtLSBFTkQ6IERpYW1vbmQgR2FsbGVyeSAtLT4KPCEtLSBCRUdJTjogQm90dG9tIEFjdGlvbiBBcmVhIC0tPgo8Zm9vdGVyIGNsYXNzPSJ3LWZ1bGwgbWF4LXctbWQgZmxleCBmbGV4LWNvbCBpdGVtcy1jZW50ZXIgbWItNiBnYXAtNCIgZGF0YS1wdXJwb3NlPSJib3R0b20tYWN0aW9ucyI+CjwhLS0gVGV4dCBDb250ZW50IC0tPgo8ZGl2IGNsYXNzPSJ0ZXh0LWNlbnRlciBweC00IHNwYWNlLXktMiI+CjxoMSBjbGFzcz0idGV4dC1bMS4zNXJlbV0gd2hpdGVzcGFjZS1ub3dyYXAgZm9udC1leHRyYWJvbGQgdHJhY2tpbmctdGlnaHQgdGV4dC1vbi1zdXJmYWNlIj5ZZXN0ZXJkYXkgaW4gVEFOR08gU09DSUVUWTwvaDE+CjxwIGNsYXNzPSJ0ZXh0LVsxMXB4XSB3aGl0ZXNwYWNlLW5vd3JhcCB0cmFja2luZy10aWdodCBmb250LW1lZGl1bSB0ZXh0LW9uLXN1cmZhY2UtdmFyaWFudCBsZWFkaW5nLXJlbGF4ZWQiPuyImCDrp47snYAg6rWQ6rCQ7J2YIOyInOqwhOydtCDquLDroZ3rkJjsl4jsirXri4jri6QuPC9wPgo8L2Rpdj4KPCEtLSBDVEEgQnV0dG9uIC0tPgo8YnV0dG9uIGFyaWEtbGFiZWw9IkVudGVyIExpdmUiIGNsYXNzPSJ3LVs5MCVdIG1heC13LVszNDBweF0gaG92ZXI6YmctcHJpbWFyeS85MCB0ZXh0LXdoaXRlIHJvdW5kZWQtZnVsbCBweS00IHB4LTYgZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1iZXR3ZWVuIGZvbnQtYm9sZCB0ZXh0LWxnIHRyYWNraW5nLXdpZGUgdHJhbnNpdGlvbi10cmFuc2Zvcm0gYWN0aXZlOnNjYWxlLTk1IGJnLWdyYWRpZW50LXRvLXIgZnJvbS1wcmltYXJ5LWNvbnRhaW5lciB0by1wcmltYXJ5IGJhY2tkcm9wLWJsdXItbWQgYm9yZGVyIGJvcmRlci13aGl0ZS8yMCBzaGFkb3ctMnhsIHNoYWRvdy1wcmltYXJ5LzQwIj4KPHNwYW4gY2xhc3M9ImZsZXgtMSB0ZXh0LWNlbnRlciBwbC04Ij5ESVZFIElOPC9zcGFuPgo8IS0tIFByb2dyZXNzIFJpbmcgSW5kaWNhdG9yIC0tPgo8ZGl2IGNsYXNzPSJyZWxhdGl2ZSB3LTggaC04IGZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIGJnLWJsYWNrLzIwIHJvdW5kZWQtZnVsbCBzaHJpbmstMCI+CjxzdmcgY2xhc3M9InctZnVsbCBoLWZ1bGwgLXJvdGF0ZS05MCIgdmlld2JveD0iMCAwIDM2IDM2Ij4KPHBhdGggY2xhc3M9InRleHQtd2hpdGUvMjAiIGQ9Ik0xOCAyLjA4NDUgYSAxNS45MTU1IDE1LjkxNTUgMCAwIDEgMCAzMS44MzEgYSAxNS45MTU1IDE1LjkxNTUgMCAwIDEgMCAtMzEuODMxIiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIzIj48L3BhdGg+CjwhLS0gMCUgcHJvZ3Jlc3MsIHNvIG5vIHN0cm9rZS1kYXNoYXJyYXkgbmVlZGVkIGZvciB0aGUgZmlsbGVkIHBhcnQsIGp1c3Qga2VlcGluZyBpdCBlbXB0eSAtLT4KPC9zdmc+CjxzcGFuIGNsYXNzPSJhYnNvbHV0ZSB0ZXh0LVsxMHB4XSBmb250LWJvbGQiPjAlPC9zcGFuPgo8L2Rpdj4KPC9idXR0b24+CjwvZm9vdGVyPg==";

