"use client";

import React, { useState, useEffect, useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/providers/AuthProvider";
import { useNavigation } from "@/components/providers/NavigationProvider";
import { useLocation } from "@/components/providers/LocationProvider";
import UserAvatar from "@/components/common/UserAvatar";
import { useNotification } from '@/contexts/NotificationContext';
import { chatService } from '@/lib/firebase/chatService';
import { COUNTRY_MAPPING } from "@/constants/locations";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from 'sonner';
import CreateMenuBottomSheet from "@/components/common/CreateMenuBottomSheet";
import BottomSheet from "@/components/common/BottomSheet";

// App Shell v2: 1단 연속 좌우 스크롤 푸터 메뉴 구조
const FOOTER_MENU = [
  {
    section: 'nav.section_society',
    items: [
      { name: 'nav.today', icon: 'today', path: '/home' },
      { name: 'nav.social', icon: 'diversity_3', path: '/today' },
      { name: 'nav.live', icon: 'cell_tower', path: '/live' },
      { name: 'nav.plaza', icon: 'account_balance', path: '/plaza' },
    ],
  },
  {
    section: 'nav.section_activity',
    items: [
      { name: 'nav.class', icon: 'school', path: '/class' },
      { name: 'nav.events', icon: 'celebration', path: '/events' },
      { name: 'nav.groups', icon: 'communities', path: '/groups' },
      { name: 'nav.map', icon: 'map', path: '/venues' },
    ],
  },
  {
    section: 'nav.section_market',
    items: [
      { name: 'nav.shop', icon: 'shopping_bag', path: '/shop' },
      { name: 'nav.resale', icon: 'sell', path: '/resale' },
      { name: 'nav.rental', icon: 'diamond', path: '/rental' },
      { name: 'nav.stay', icon: 'cottage', path: '/stay' },
    ],
  },
  {
    section: 'nav.section_lounge',
    items: [
      { name: 'nav.people', icon: 'person', path: '/people' },
      { name: 'nav.pics', icon: 'photo_library', path: '/pics' },
      { name: 'nav.lost_found', icon: 'help', path: '/lost' },
      { name: 'nav.jump', icon: 'near_me', path: '/explore' },
    ],
  },
  {
    section: 'nav.section_my',
    items: [
      { name: 'nav.acts', icon: 'star', path: '/profile?tab=schedule' },
      { name: 'nav.my_pay', icon: 'account_balance_wallet', path: '/wallet' },
      { name: 'nav.my_live', icon: 'broadcast_on_personal', path: '/live?view=my' },
      { name: 'nav.ai_lab', icon: 'science', path: '/profile/ai-tryon' },
      { name: 'nav.profile', icon: 'person', path: '/profile?tab=profile' },
    ],
  },
];

// 모든 메뉴 항목의 경로를 평탄화하여 activeTab 판별에 사용
const ALL_MENU_PATHS = FOOTER_MENU.flatMap(group => group.items.map(item => ({
  ...item,
  section: group.section,
})));

export default function GlobalNavigation(props: { children: React.ReactNode }) {
  const { t } = useLanguage();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  if (pathname.startsWith('/pt') || pathname.startsWith('/fys')) {
    return <>{props.children}</>;
  }
  const { children } = props;
  const [isCreateMenuOpen, setIsCreateMenuOpen] = useState(false);
  const [isSocialSelectOpen, setIsSocialSelectOpen] = useState(false);
  const router = useRouter();
  const { user, profile } = useAuth();

  // + 버튼 페이지별 분기 핸들러
  const handleCreatePress = useCallback(() => {
    if (!user) {
      toast(t('create_menu.no_permission', '로그인이 필요합니다'));
      return;
    }

    // 바로 열기 (등록창 직행)
    if (pathname.startsWith('/plaza')) { router.push('/plaza?createFlow=true'); return; }
    if (pathname.startsWith('/venues')) { router.push('/venues?editId=new'); return; }
    if (pathname.startsWith('/people')) { router.push('/people/register'); return; }
    if (pathname.startsWith('/resale')) { router.push('/resale?create=true'); return; }
    if (pathname.startsWith('/events')) { router.push('/events?create=true'); return; }
    if (pathname.startsWith('/lost')) { router.push('/lost/register'); return; }
    if (pathname.startsWith('/groups')) { router.push('/groups?action=create'); return; }
    if (pathname.startsWith('/coaching')) { router.push('/coaching'); return; }
    if (pathname.startsWith('/profile/ai-tryon')) { toast(t('create_btn.no_register', '등록 기능이 없습니다')); return; }
    if (pathname.startsWith('/live')) { router.push('/live/create?source=live'); return; }

    // 선택 바텀시트 (밀롱가 / 쁘락띠까)
    if (pathname.startsWith('/today') || pathname.startsWith('/social')) {
      setIsSocialSelectOpen(true);
      return;
    }

    // 토스트 (등록 불가 안내)
    if (pathname.startsWith('/home')) { toast(t('create_btn.admin_only', '관리자만 설정 가능합니다')); return; }
    if (pathname.startsWith('/shop')) { toast(t('create_btn.group_owner_only', '그룹에서 오너만 등록 가능합니다')); return; }
    if (pathname.startsWith('/rental')) { toast(t('create_btn.group_owner_setting', '그룹에서 오너만 설정 가능합니다')); return; }
    if (pathname.startsWith('/stay')) { toast(t('create_btn.group_owner_setting', '그룹에서 오너만 설정 가능합니다')); return; }
    if (pathname.startsWith('/class')) { toast(t('create_btn.group_instructor_only', '그룹에서 오너 또는 강사만 등록 가능합니다')); return; }
    if (pathname.startsWith('/pics')) { toast(t('create_btn.ai_photos_only', '시스템에서 AI가 생성한 사진만 등록됩니다')); return; }
    if (pathname.startsWith('/hub')) { toast(t('create_btn.hub_admin_only', '물품입고는 WoC 관리자만 등록 가능합니다')); return; }
    if (pathname.startsWith('/explore')) { toast(t('create_btn.jump_admin_only', '취미는 WoC 관리자만 등록 가능합니다')); return; }
    if (pathname.startsWith('/wallet')) { toast(t('create_btn.no_register', '등록 기능이 없습니다')); return; }
    if (pathname.startsWith('/profile')) {
      const params = new URLSearchParams(window.location.search);
      if (params.get('tab') === 'schedule') { toast(t('create_btn.in_development', '개발진행중')); return; }
      toast(t('create_btn.admin_only', '관리자만 설정 가능합니다'));
      return;
    }
    if (pathname.startsWith('/notification')) { toast(t('create_btn.admin_only', '관리자만 설정 가능합니다')); return; }
    if (pathname.startsWith('/chat')) { toast(t('create_btn.chat_hint', '피플 검색 후 대화를 입력할 수 있습니다')); return; }
    if (pathname.startsWith('/search')) { toast(t('create_btn.search_hint', '검색창에서 직접 입력할 수 있습니다')); return; }

    // 매칭 안 되는 나머지 페이지 → 기본 CreateMenu
    setIsCreateMenuOpen(true);
  }, [pathname, user, router, t]);



  const { isHeaderShrink, subHeader, setSubHeader, subHeaderHeight, isHeaderVisible, setIsHeaderVisible, isGlobalNavHidden, setGlobalNavHidden } = useNavigation();
  const { location, setIsSelectorOpen } = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const headerRef = React.useRef<HTMLElement>(null);
  const footerRef = React.useRef<HTMLElement>(null);
  const currentTranslateY = React.useRef(0);
  const lastScrollY = React.useRef(0);
  const accumulatedScrollUp = React.useRef(0);
  const lastSentVisibility = React.useRef<boolean | null>(null);


  const { unreadCount: notiUnreadCount } = useNotification();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    const unsub = chatService.subscribeTotalUnreadCount(user.uid, (count) => {
      setUnreadCount(count);
    });
    return () => unsub();
  }, [user]);



  const totalNotiCount = notiUnreadCount;

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          if (isGlobalNavHidden) return;
          const currentScrollY = window.scrollY;
          const delta = currentScrollY - lastScrollY.current;
          const headerHeight = headerRef.current?.offsetHeight || 60;
          const footerHeight = footerRef.current?.offsetHeight || 56;
          
          let nextTranslateY = currentTranslateY.current;
          const scrollUpThreshold = 15;

          if (delta > 0) {
            accumulatedScrollUp.current = 0;
            nextTranslateY -= delta;
          } else {
            accumulatedScrollUp.current += Math.abs(delta);
            if (accumulatedScrollUp.current > scrollUpThreshold || currentScrollY <= 10) {
              nextTranslateY -= delta;
            }
          }
          
          if (nextTranslateY > 0) nextTranslateY = 0;
          if (nextTranslateY < -headerHeight) nextTranslateY = -headerHeight;
          if (currentScrollY <= 5) nextTranslateY = 0;
          
          currentTranslateY.current = nextTranslateY;
          
          if (headerRef.current) {
            headerRef.current.style.transform = `translateY(${nextTranslateY}px)`;
          }

          if (footerRef.current) {
            const hideRatio = nextTranslateY / -headerHeight;
            const footerTranslateY = hideRatio * footerHeight;
            footerRef.current.style.transform = `translateY(${footerTranslateY}px)`;
            document.documentElement.style.setProperty('--woc-bottom-nav-y', `${footerTranslateY}px`);
          }
          
          const isFullyVisible = nextTranslateY >= -1;
          if (lastSentVisibility.current !== isFullyVisible) {
            setIsHeaderVisible(isFullyVisible);
            lastSentVisibility.current = isFullyVisible;
          }
          
          setIsScrolled(currentScrollY > 40);
          lastScrollY.current = currentScrollY;
          ticking = false;
        });
        ticking = true;
      }
    };
    
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  
  const isGroupDetailPage = pathname.startsWith("/groups/");

  if (isGroupDetailPage) {
    return (
      <div className="min-h-screen bg-[#faf8ff] font-manrope flex flex-col">
        <main className="flex-1 w-full relative">
          {children}
        </main>
      </div>
    );
  }

  // 헤더 60px 고정 (서브메뉴 제거)
  const placeholderHeight = subHeader ? 60 + subHeaderHeight : 60;

  // Compute effective hidden state based on context and pathname
  const isDetailPage = /^\/(?:class|shop|people|social|resale|rental|stay|events)\/[^\/]+/.test(pathname);
  const isAppPage = pathname === '/app' || pathname.startsWith('/app/');
  const isHiddenPath = pathname === '/' || pathname.startsWith('/admin') || pathname.includes('/checkout') || pathname.includes('/register') || isDetailPage || isAppPage || pathname === '/yedamche' || pathname.startsWith('/yedamche/');
  const effectiveIsGlobalNavHidden = isGlobalNavHidden || isHiddenPath;

  // 가시성 복구 시 스크롤 위치 및 인라인 transform 오프셋 강제 리셋 (Hit Test 영역 0px 편차 복원 방어막)
  useEffect(() => {
    if (!effectiveIsGlobalNavHidden) {
      currentTranslateY.current = 0;
      accumulatedScrollUp.current = 0;
      lastScrollY.current = typeof window !== 'undefined' ? window.scrollY : 0;

      // 헤더와 푸터의 인라인 transform 스타일을 즉시 0px로 리셋하여 강제 복귀시킴
      if (headerRef.current) {
        headerRef.current.style.transform = 'translateY(0px)';
      }
      if (footerRef.current) {
        footerRef.current.style.transform = 'translateY(0px)';
        document.documentElement.style.setProperty('--woc-bottom-nav-y', '0px');
      }
      setIsHeaderVisible(true);
      lastSentVisibility.current = true;
    }
  }, [effectiveIsGlobalNavHidden, setIsHeaderVisible]);

  return (
    <div className="min-h-screen bg-[#faf8ff] font-manrope flex flex-col">
      {/* Header Placeholder to prevent layout shift and scroll thrashing */}
      <div 
        className="w-full flex-shrink-0 transition-all duration-200" 
        style={{ 
          height: `${effectiveIsGlobalNavHidden ? 0 : placeholderHeight}px`,
          visibility: effectiveIsGlobalNavHidden ? 'hidden' : 'visible',
          opacity: effectiveIsGlobalNavHidden ? 0 : 1
        }} 
      />

      {/* Fixed Top Navigation */}
      <header 
        ref={headerRef}
        className={`fixed top-0 left-0 right-0 z-50 bg-white transition-all duration-200 transform will-change-transform notranslate ${
          (isScrolled || isHeaderShrink) 
            ? 'shadow-[0_4px_24px_rgba(11,90,192,0.10)]' 
            : 'shadow-[0_2px_12px_rgba(11,90,192,0.05)] border-b border-slate-100/30'
        } ${effectiveIsGlobalNavHidden ? 'opacity-0 pointer-events-none invisible translate-y-[-100px]' : 'opacity-100 translate-y-0'}`}
        style={{ transition: 'transform 0.2s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.2s, visibility 0.2s' }}
      >
        {/* Exact Image Replication: Header Top Row */}
          <div className="flex items-center justify-between pl-5 pr-4 h-[60px] border-b border-slate-100/50 bg-white">
            {/* Left Side: Location */}
            <button 
              onClick={() => setIsSelectorOpen(true)}
              className="flex flex-col justify-center items-start hover:opacity-70 transition-opacity active:scale-95 duration-100"
            >
              <div className="flex items-center gap-1">
                <span className="text-[14px] font-bold text-[#1E293B] leading-none tracking-tight">
                  {location.country === 'GLOBAL' 
                    ? "All Tango Society" 
                    : `${location.city || "Seoul"}, ${COUNTRY_MAPPING[location.country.toUpperCase()] || location.country}`}
                </span>
                <span className="material-symbols-outlined !text-[20px] text-[#1E293B] font-medium leading-none">keyboard_arrow_down</span>
              </div>
              <span className="text-[11px] font-medium text-slate-500 leading-none uppercase mt-1 tracking-wide">
                TANGO SOCIETY
              </span>
            </button>

            {/* Right Side: Action Icons */}
            <div className="flex items-center gap-1">
              {/* Notification */}
              <Link 
                href="/notification" 
                className={`w-[32px] h-[32px] rounded-full flex items-center justify-center active:scale-95 transition-all relative ${
                  pathname === '/notification' ? 'bg-[#007AFF]/10 text-[#007AFF]' : 'bg-[#F1F5F9] text-[#1E293B]'
                }`}
                title={t('notification.title', '알림')}
              >
                <span 
                  className="material-symbols-outlined !text-[20px]"
                  style={{ fontVariationSettings: pathname === '/notification' ? "'FILL' 1" : "'FILL' 0" }}
                >
                  notifications
                </span>
                {totalNotiCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-red-500 text-[9px] font-black text-white outline outline-2 outline-white animate-pulse">
                    {totalNotiCount > 99 ? '99+' : totalNotiCount}
                  </span>
                )}
              </Link>

              {/* Chat */}
              <Link 
                href="/chat" 
                className={`w-[32px] h-[32px] rounded-full flex items-center justify-center active:scale-95 transition-all relative ${
                  pathname.startsWith('/chat') ? 'bg-[#007AFF]/10 text-[#007AFF]' : 'bg-[#F1F5F9] text-[#1E293B]'
                }`}
                title={t('chatroom.room_chat', '채팅')}
              >
                <span 
                  className="material-symbols-outlined !text-[20px]"
                  style={{ fontVariationSettings: pathname.startsWith('/chat') ? "'FILL' 1" : "'FILL' 0" }}
                >
                  chat_bubble
                </span>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-red-500 text-[9px] font-black text-white outline outline-2 outline-white animate-pulse">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </Link>

              {/* Search */}
              <Link 
                href="/search" 
                className={`w-[32px] h-[32px] rounded-full flex items-center justify-center active:scale-95 transition-all ${
                  pathname.startsWith('/search') ? 'bg-[#007AFF]/10 text-[#007AFF]' : 'bg-[#F1F5F9] text-[#1E293B]'
                }`}
              >
                <span 
                  className="material-symbols-outlined !text-[20px]"
                  style={{ fontVariationSettings: pathname.startsWith('/search') ? "'FILL' 1" : "'FILL' 0" }}
                >
                  search
                </span>
              </Link>

              {/* Create (+) Button - 강조 */}
              <button
                onClick={handleCreatePress}
                className="w-[32px] h-[32px] rounded-full flex items-center justify-center active:scale-90 transition-all bg-[#007AFF] text-white hover:bg-[#0066DD] shadow-sm shadow-blue-200"
                title={t('nav.create', '등록')}
              >
                <span 
                  className="material-symbols-outlined !text-[20px]"
                  style={{ fontVariationSettings: "'FILL' 1, 'wght' 600" }}
                >
                  add
                </span>
              </button>
            </div>
          </div>

          {/* Custom Sub-Header Slot (e.g. Shop Filters) */}
          {subHeader && (
            <div className="w-full">
              {subHeader}
            </div>
          )}
        </header>

      {/* Main Content */}
      <main className={`flex-1 w-full relative bg-[#faf8ff] ${effectiveIsGlobalNavHidden ? 'pb-0' : (pathname === '/venues' || pathname.startsWith('/chat') || pathname.startsWith('/notification') || pathname.startsWith('/search') ? 'pb-0' : 'pb-[120px]')}`}>
        {children}
      </main>



      {/* Bottom Navigation Bar - 그룹별 세로 구조(위:라벨, 아래:아이콘+텍스트) */}
      <footer 
        ref={footerRef}
        className={`fixed bottom-0 left-0 w-full z-50 bg-white/95 backdrop-blur-md rounded-t-2xl shadow-[0_-4px_20px_rgba(11,90,192,0.10)] will-change-transform transition-all duration-200 ${
          effectiveIsGlobalNavHidden ? 'opacity-0 pointer-events-none invisible translate-y-[100px]' : 'opacity-100 translate-y-0'
        }`}
        style={{ 
          height: 'calc(76px + max(env(safe-area-inset-bottom), 8px))',
          paddingBottom: 'max(env(safe-area-inset-bottom), 8px)',
          transition: 'transform 0.2s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.2s, visibility 0.2s'
        }}
      >
        <div className="w-full h-full overflow-x-auto no-scrollbar">
          <div className="flex items-end h-full px-2 gap-0 min-w-max">
            {FOOTER_MENU.map((group, groupIdx) => {
              return (
                <React.Fragment key={group.section}>
                  {/* 그룹 간 구분자 */}
                  {groupIdx > 0 && (
                    <div className="w-px h-12 bg-slate-200/60 mx-1 shrink-0 self-center" />
                  )}
                  {/* 그룹 컨테이너: 위 라벨 + 아래 메뉴 */}
                  <div className="flex flex-col shrink-0">
                    {/* 그룹 라벨 (단순 정보사항) */}
                    <span className="text-[9px] font-semibold text-slate-300 uppercase tracking-wider px-1 pb-0.5 select-none">
                      {t(group.section)}
                    </span>
                    {/* 메뉴 항목들 가로 나열 */}
                    <div className="flex items-center">
                      {group.items.map((item) => {
                        const [itemPath, itemQuery] = item.path.split('?');
                        let isActive = false;
                        if (itemQuery) {
                          // query parameter가 있는 메뉴: searchParams로 비교
                          const params = new URLSearchParams(itemQuery);
                          const pathMatches = pathname === itemPath;
                          const paramsMatch = Array.from(params.entries()).every(([key, val]) => {
                            return searchParams.get(key) === val;
                          });
                          isActive = pathMatches && paramsMatch;
                        } else {
                          // query 없는 메뉴: 같은 pathname을 공유하는 query-based 메뉴가 현재 active이면 자신은 비활성화
                          const hasQuerySibling = ALL_MENU_PATHS.some(m => {
                            const [mp, mq] = m.path.split('?');
                            if (!mq || mp !== item.path) return false;
                            const mqParams = new URLSearchParams(mq);
                            return pathname === mp && Array.from(mqParams.entries()).every(([k, v]) => searchParams.get(k) === v);
                          });
                          if (hasQuerySibling) {
                            isActive = false;
                          } else {
                            isActive = pathname === item.path || (item.path !== '/' && pathname.startsWith(item.path) && !item.path.includes('?'));
                          }
                        }
                        return (
                          <Link
                            key={item.name + item.path}
                            href={item.path}
                            className={`shrink-0 flex flex-col items-center justify-center w-[50px] h-[50px] transition-all duration-200 ${
                              isActive
                                ? 'text-[#007AFF]'
                                : 'text-slate-500 hover:text-slate-700 active:bg-slate-50'
                            }`}
                          >
                            <span
                              className="material-symbols-outlined !text-[22px] leading-none"
                              style={{ fontVariationSettings: isActive ? "'FILL' 1, 'wght' 400" : "'FILL' 0, 'wght' 300" }}
                            >
                              {item.icon}
                            </span>
                            <span className={`text-[10px] leading-tight mt-0.5 tracking-tight whitespace-nowrap ${
                              isActive ? 'font-extrabold' : 'font-medium'
                            }`}>
                              {t(item.name)}
                            </span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </footer>

        {/* Create Menu Bottom Sheet (폴백용) */}
        <CreateMenuBottomSheet 
          isOpen={isCreateMenuOpen} 
          onClose={() => setIsCreateMenuOpen(false)} 
        />

        {/* 오늘/소셜 밀롱가·쁘락띠까 선택 바텀시트 */}
        <BottomSheet
          isOpen={isSocialSelectOpen}
          onClose={() => setIsSocialSelectOpen(false)}
          title={t('create_btn.social_select_title', '등록 유형 선택')}
          height="auto"
        >
          <div className="flex flex-col gap-3 py-4 px-2 font-manrope">
            <button
              onClick={() => {
                setIsSocialSelectOpen(false);
                router.push('/social?createSocial=true&socialType=milonga');
              }}
              className="flex items-center gap-4 p-4 rounded-2xl text-white transition-all active:scale-[0.98] hover:shadow-lg"
              style={{ background: 'linear-gradient(135deg, #FF2D55, #FF9500)' }}
            >
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                <span className="material-symbols-outlined !text-[24px] text-white" style={{ fontFamily: "'Material Symbols Outlined'" }}>celebration</span>
              </div>
              <div>
                <h5 className="text-[14px] font-black tracking-tight">{t('create_btn.milonga', '밀롱가 등록')}</h5>
              </div>
            </button>
            <button
              onClick={() => {
                setIsSocialSelectOpen(false);
                router.push('/social?createSocial=true&socialType=practica');
              }}
              className="flex items-center gap-4 p-4 rounded-2xl text-white transition-all active:scale-[0.98] hover:shadow-lg"
              style={{ background: 'linear-gradient(135deg, #007AFF, #5856D6)' }}
            >
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                <span className="material-symbols-outlined !text-[24px] text-white" style={{ fontFamily: "'Material Symbols Outlined'" }}>school</span>
              </div>
              <div>
                <h5 className="text-[14px] font-black tracking-tight">{t('create_btn.practica', '쁘락띠까 등록')}</h5>
              </div>
            </button>
          </div>
        </BottomSheet>
    </div>
  );
}

// SubMenuNavigation 및 MySubMenuNavigation 제거됨 (App Shell v2 개편)

