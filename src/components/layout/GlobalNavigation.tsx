"use client";

import React, { useState, useEffect, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/providers/AuthProvider";
import { useNavigation } from "@/components/providers/NavigationProvider";
import { useLocation } from "@/components/providers/LocationProvider";
import UserAvatar from "@/components/common/UserAvatar";
import CreateProduct from "@/components/shop/CreateProduct";
import { useNotification } from '@/contexts/NotificationContext';
import { chatService } from '@/lib/firebase/chatService';
import { COUNTRY_MAPPING } from "@/constants/locations";
import { useLanguage } from "@/contexts/LanguageContext";

const NAV_STRUCTURE = {
  World: [
    { name: "nav.home", icon: "radio_button_unchecked", path: "/home" },
    { name: "nav.plaza", icon: "quick_phrases", path: "/plaza" },
    { name: "nav.venues", icon: "map", path: "/venues" },
    { name: "nav.people", icon: "group", path: "/people" },
  ],
  Market: [
    { name: "nav.shop", icon: "storefront", path: "/shop" },
    { name: "nav.resale", icon: "cached", path: "/resale" },
    { name: "nav.rental", icon: "key", path: "/rental" },
    { name: "nav.stay", icon: "bed", path: "/stay" },
  ],
  Now: [
    { name: "nav.today", icon: "today", path: "/today" },
    { name: "nav.live", icon: "cinematic_blur", path: "/live" },
    { name: "nav.social", icon: "autoplay", path: "/social" },
    { name: "nav.class", icon: "school", path: "/class" },
    { name: "nav.events", icon: "calendar_today", path: "/events" },
  ],
  Lounge: [
    { name: "nav.pics", icon: "photo_library", path: "/pics" },
    { name: "nav.lost_found", icon: "find_in_page", path: "/lost" },
    { name: "nav.hub", icon: "airline_stops", path: "/hub" },
    { name: "nav.explore", icon: "explore", path: "/explore" },
  ],
  Groups: [
    { name: "nav.groups", icon: "groups", path: "/groups" },
  ],
  My: [
    { name: "myinfo.schedule_tab", icon: "calendar_today", path: "/profile?tab=schedule" },
    { name: "nav.coaching", icon: "psychology", path: "/coaching" },
    { name: "nav.live", icon: "cinematic_blur", path: "/live?view=my" },
    { name: "nav.wallet", icon: "account_balance_wallet", path: "/wallet" },
    { name: "nav.my_info", icon: "person", path: "/profile?tab=profile" },
  ],
};

// COUNTRY_MAPPING moved to constants

const BOTTOM_TABS = [
  { id: "World", icon: "globe", label: "nav.world", basePath: "/home" },
  { id: "Market", icon: "redeem", label: "nav.market", basePath: "/shop" },
  { id: "Now", icon: "contactless", label: "nav.now", basePath: "/today" },
  { id: "Lounge", icon: "weekend", label: "nav.lounge", basePath: "/pics" },
  { id: "Groups", icon: "communities", label: "nav.groups", basePath: "/groups" },
];

export default function GlobalNavigation({ children }: { children: React.ReactNode }) {
  const { t } = useLanguage();
  const pathname = usePathname();
  const [isMyView, setIsMyView] = useState(false);
  const { user, profile } = useAuth();

  useEffect(() => {
    // Detect view mode from URL search params on client side
    const params = new URLSearchParams(window.location.search);
    setIsMyView(params.get('view') === 'my');
  }, [pathname]); // Re-check when navigation occurs
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

  // pathname 변경 시 nav hidden 상태 강제 복원 (SocialViewer cleanup 실패 방어)
  useEffect(() => {
    setGlobalNavHidden(false);
  }, [pathname, setGlobalNavHidden]);

  const totalNotiCount = notiUnreadCount;

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          if (isGlobalNavHidden) return;
          const currentScrollY = window.scrollY;
          const delta = currentScrollY - lastScrollY.current;
          const headerHeight = headerRef.current?.offsetHeight || 110;
          const footerHeight = footerRef.current?.offsetHeight || 80;
          
          // Calculate new translation based on delta with threshold
          let nextTranslateY = currentTranslateY.current;
          const scrollUpThreshold = 15; // Sensitivity: scroll up this much before showing

          if (delta > 0) {
            // Scrolling down: Hide immediately
            accumulatedScrollUp.current = 0;
            nextTranslateY -= delta;
          } else {
            // Scrolling up: Show only after threshold
            accumulatedScrollUp.current += Math.abs(delta);
            if (accumulatedScrollUp.current > scrollUpThreshold || currentScrollY <= 10) {
              nextTranslateY -= delta;
            }
          }
          
          // Clamp between -headerHeight and 0
          if (nextTranslateY > 0) nextTranslateY = 0;
          if (nextTranslateY < -headerHeight) nextTranslateY = -headerHeight;
          
          // Force show at the very top
          if (currentScrollY <= 5) nextTranslateY = 0;
          
          currentTranslateY.current = nextTranslateY;
          
          // Apply to Header
          if (headerRef.current) {
            headerRef.current.style.transform = `translateY(${nextTranslateY}px)`;
          }

          // Apply to Footer (Synchronized)
          if (footerRef.current) {
            // Footer slides DOWN when header goes UP
            // Ratio-based translation to ensure they hide/show at the same pace relative to their heights
            const hideRatio = nextTranslateY / -headerHeight; // 0 to 1
            const footerTranslateY = hideRatio * footerHeight;
            footerRef.current.style.transform = `translateY(${footerTranslateY}px)`;
            
            // Set global variable for other floating UIs (like FABs) to sync
            document.documentElement.style.setProperty('--woc-bottom-nav-y', `${footerTranslateY}px`);

          }
          
          // Update global visibility state for components that need delayed show (like FAB)
          // Lenient check for zero to handle potential floating point precision issues
          const isFullyVisible = nextTranslateY >= -1;
          if (lastSentVisibility.current !== isFullyVisible) {
            setIsHeaderVisible(isFullyVisible);
            lastSentVisibility.current = isFullyVisible;
          }
          
          // Shadow logic
          setIsScrolled(currentScrollY > 40);
          
          lastScrollY.current = currentScrollY;
          ticking = false;
        });
        ticking = true;
      }
    };
    
    window.addEventListener("scroll", handleScroll, { passive: true });
    // Initial check
    handleScroll();
    
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  
  // Determine active primary tab based on pathname
  let activeTab = "World";
  if (pathname.startsWith("/shop") || pathname.startsWith("/resale") || pathname.startsWith("/rental") || pathname.startsWith("/stay")) {
    activeTab = "Market";
  } else if (pathname.startsWith("/today") || pathname.startsWith("/social") || pathname.startsWith("/events") || pathname.startsWith("/class") || (pathname.startsWith("/live") && !isMyView)) {
    activeTab = "Now";
  } else if (pathname.startsWith("/pics") || pathname.startsWith("/lost") || pathname.startsWith("/hub") || pathname.startsWith("/explore")) {
    activeTab = "Lounge";
  } else if (pathname.startsWith("/groups")) {
    activeTab = "Groups";
  } else if (pathname.startsWith("/my") || pathname.startsWith("/wallet") || pathname.startsWith("/history") || pathname.startsWith("/profile") || pathname.startsWith("/coaching") || (pathname.startsWith("/live") && isMyView)) {
    activeTab = "My";
  } else if (pathname.startsWith("/admin")) {
    activeTab = "My";
  } else if (pathname.startsWith("/notification") || pathname.startsWith("/chat")) {
    activeTab = "None"; // Don't highlight any main tab for notifications/chat
  }

  // Handle default tab for "/"
  if (pathname === "/") {
    activeTab = "Now";
  }

  const isGroupDetailPage = pathname.startsWith("/groups/");
  const isSearchPage = pathname.startsWith("/search");
  const isNoSubMenuPage = isSearchPage || pathname.startsWith("/groups") || pathname.startsWith("/notification") || pathname.startsWith("/chat");

  if (isGroupDetailPage) {
    return (
      <div className="min-h-screen bg-[#faf8ff] font-manrope flex flex-col">
        <main className="flex-1 w-full relative">
          {children}
        </main>
      </div>
    );
  }

  const subMenu = NAV_STRUCTURE[activeTab as keyof typeof NAV_STRUCTURE] || [];
  
  // Calculate placeholder height
  const baseHeaderHeight = isNoSubMenuPage ? 60 : 110;
  const placeholderHeight = subHeader ? baseHeaderHeight + subHeaderHeight : baseHeaderHeight;

  // Compute effective hidden state based on context and pathname
  const isDetailPage = /^\/(class|shop|people|social|resale|rental|stay|events)\/[^\/]+/.test(pathname);
  const isAppPage = pathname === '/app' || pathname.startsWith('/app/');
  const isHiddenPath = pathname === '/' || pathname.startsWith('/admin') || pathname.includes('/checkout') || pathname.includes('/register') || isDetailPage || isAppPage;
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

              {/* My Profile Avatar (상단 이전 배치) */}
              <Link 
                href="/profile?tab=schedule" 
                className={`w-[32px] h-[32px] rounded-full flex items-center justify-center active:scale-95 transition-all overflow-hidden relative ${
                  pathname.startsWith('/profile') ? 'ring-[2px] ring-[#007AFF] ring-offset-1' : 'opacity-80 hover:opacity-100'
                }`}
                title={t('nav.my', '마이')}
              >
                <UserAvatar 
                  photoURL={profile?.photoURL}
                  className="!w-[28px] !h-[28px] rounded-full"
                  iconSize="18px"
                />
              </Link>
            </div>
          </div>

          {/* Scrolling Sub-Menu: Refined to match image (Icons Removed) */}
          {/* Scrolling Sub-Menu: Refined to match image (Icons Removed) */}
          {!isNoSubMenuPage && (
            <Suspense fallback={<div className="h-[43px] bg-white border-b border-slate-100/60" />}>
              <SubMenuNavigation subMenu={subMenu} pathname={pathname} />
            </Suspense>
          )}

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



      {/* Bottom Navigation Bar */}
      <footer 
        ref={footerRef}
        className={`fixed bottom-0 left-0 w-full z-50 bg-white rounded-t-2xl px-6 flex justify-around items-center shadow-[0_-8px_30px_rgba(11,90,192,0.14)] will-change-transform transition-all duration-200 ${
          effectiveIsGlobalNavHidden ? 'opacity-0 pointer-events-none invisible translate-y-[100px]' : 'opacity-100 translate-y-0'
        }`}
        style={{ 
          height: 'calc(64px + max(env(safe-area-inset-bottom), 12px))',
          paddingBottom: 'max(env(safe-area-inset-bottom), 12px)',
          transition: 'transform 0.2s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.2s, visibility 0.2s'
        }}
      >
        {BOTTOM_TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const isPhotoTab = tab.icon === "photo";
          const targetPath = tab.basePath;
          return (
            <Link 
              key={tab.id} 
              href={targetPath} 
              className={`relative flex flex-col items-center justify-center gap-0.5 min-w-[52px] h-[52px] transition-all duration-300 ${isActive ? 'text-[#007AFF]' : 'text-slate-400 hover:text-slate-600'}`}
            >
              {isPhotoTab ? (
                <div className="relative flex items-center justify-center w-[24px] h-[24px]">
                  <UserAvatar 
                     photoURL={profile?.photoURL}
                     className={`!w-[24px] !h-[24px] rounded-full transition-all duration-300 ${isActive ? 'ring-[2px] ring-[#007AFF] ring-offset-1' : 'opacity-80 hover:opacity-100'}`}
                     iconSize="18px"
                  />
                </div>
              ) : (
                <span 
                  className="material-symbols-outlined !text-[22px] transition-colors duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
                  style={{ fontVariationSettings: isActive ? "'FILL' 1, 'wght' 500" : "'FILL' 0, 'wght' 500" }}
                >
                  {tab.icon}
                </span>
              )}
                {/* Localized label */}
                <span className={`text-[11px] leading-none tracking-tight ${isActive ? 'font-extrabold' : 'font-medium'}`}>
                  {t(tab.label)}
                </span>
              </Link>
            );
          })}
        </footer>
    </div>
  );
}

function SubMenuNavigation({ subMenu, pathname }: { subMenu: any[]; pathname: string }) {
  const searchParams = useSearchParams();
  const { t } = useLanguage();

  return (
    <nav className="flex w-full px-0 border-b border-slate-100/60 bg-white">
      <div className="flex w-full items-end justify-between px-3">
        {subMenu.map((item) => {
          if (!item || !item.path || typeof item.path !== 'string') return null;
          // tab=schedule, tab=profile 등 쿼리 파라미터 추출 판별
          const [itemPathname, itemQuery] = item.path.split('?');
          const itemParams = new URLSearchParams(itemQuery || '');
          
          let isActive = false;
          if (itemQuery) {
            const pathMatches = pathname === itemPathname;
            const paramsMatch = Array.from(itemParams.entries()).every(([key, val]) => searchParams.get(key) === val);
            isActive = pathMatches && paramsMatch;
          } else {
            isActive = pathname === item.path || (item.path !== "/" && pathname.startsWith(item.path) && !item.path.includes('?'));
          }

          const society = searchParams.get('society') || (typeof window !== 'undefined' ? sessionStorage.getItem('woc_society') : null);
          const resolvedPath = item.path === '/events' && society ? `/events?society=${society}` : item.path;

          return (
            <Link 
              key={item.name} 
              href={resolvedPath} 
              className={`flex flex-col items-center justify-end flex-1 pt-3.5 pb-2.5 transition-all duration-300 border-b-[3px] ${isActive ? 'border-[#007AFF]' : 'border-transparent'}`}
            >
              <span className={`text-[14px] tracking-tight uppercase transition-all duration-300 ${isActive ? 'font-black text-[#007AFF]' : 'font-bold text-slate-500'}`}>
                {t(item.name)}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

