"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/providers/AuthProvider";
import { useNavigation } from "@/components/providers/NavigationProvider";
import { useLocation } from "@/components/providers/LocationProvider";
import UserAvatar from "@/components/common/UserAvatar";
import CreateProduct from "@/components/shop/CreateProduct";
import { useNotification } from '@/contexts/NotificationContext';
import { chatService } from '@/lib/firebase/chatService';
import { COUNTRY_MAPPING } from "@/lib/constants/locations";
import { useLanguage } from "@/contexts/LanguageContext";

const NAV_STRUCTURE = {
  World: [
    { name: "nav.home", icon: "radio_button_unchecked", path: "/home" },
    { name: "nav.plaza", icon: "quick_phrases", path: "/plaza" },
    { name: "nav.venues", icon: "map", path: "/venues" },
    { name: "nav.people", icon: "group", path: "/people" },
    { name: "nav.explore", icon: "explore", path: "/explore" },
  ],
  Market: [
    { name: "nav.shop", icon: "storefront", path: "/shop" },
    { name: "nav.resale", icon: "cached", path: "/resale" },
    { name: "nav.rental", icon: "key", path: "/rental" },
    { name: "nav.stay", icon: "bed", path: "/stay" },
    { name: "nav.class", icon: "school", path: "/class" },
  ],
  Now: [
    { name: "nav.social", icon: "autoplay", path: "/social" },
    { name: "nav.live", icon: "cinematic_blur", path: "/live" },
    { name: "nav.events", icon: "calendar_today", path: "/events" },
    { name: "nav.lost_found", icon: "eye_tracking", path: "/lost" },
    { name: "nav.hub", icon: "airline_stops", path: "/hub" },
  ],
  Groups: [
    { name: "nav.groups", icon: "groups", path: "/groups" },
  ],
  My: [
    { name: "nav.history", icon: "history", path: "/history" },
    { name: "nav.wallet", icon: "account_balance_wallet", path: "/wallet" },
    { name: "nav.my_info", icon: "person", path: "/profile" },
  ],
};

// COUNTRY_MAPPING moved to constants

const BOTTOM_TABS = [
  { id: "World", icon: "globe", label: "nav.tango_world", basePath: "/home" },
  { id: "Market", icon: "redeem", label: "nav.shop", basePath: "/shop" },
  { id: "Now", icon: "contactless", label: "nav.now", basePath: "/social" },
  { id: "Groups", icon: "communities", label: "nav.groups", basePath: "/groups" },
  { id: "My", icon: "photo", label: "nav.my", basePath: "/profile" },
];

export default function GlobalNavigation({ children }: { children: React.ReactNode }) {
  const { language, toggleLanguage, t } = useLanguage();
  const pathname = usePathname();
  const { user, profile } = useAuth();
  const { isHeaderShrink, subHeader, setSubHeader, subHeaderHeight, isHeaderVisible, setIsHeaderVisible, isGlobalNavHidden } = useNavigation();
  const { location, setIsSelectorOpen } = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const headerRef = React.useRef<HTMLElement>(null);
  const footerRef = React.useRef<HTMLElement>(null);
  const currentTranslateY = React.useRef(0);
  const lastScrollY = React.useRef(0);
  const accumulatedScrollUp = React.useRef(0);
  const lastSentVisibility = React.useRef<boolean | null>(null);


  const { unreadCount: notiUnreadCount, todoCount } = useNotification();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    const unsub = chatService.subscribeTotalUnreadCount(user.uid, (count) => {
      setUnreadCount(count);
    });
    return () => unsub();
  }, [user]);

  const totalNotiCount = notiUnreadCount + todoCount;

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
  if (pathname.startsWith("/shop") || pathname.startsWith("/resale") || pathname.startsWith("/rental") || pathname.startsWith("/stay") || pathname.startsWith("/class")) {
    activeTab = "Market";
  } else if (pathname.startsWith("/social") || pathname.startsWith("/events") || pathname.startsWith("/live") || pathname.startsWith("/lost") || pathname.startsWith("/hub")) {
    activeTab = "Now";
  } else if (pathname.startsWith("/groups")) {
    activeTab = "Groups";
  } else if (pathname.startsWith("/my") || pathname.startsWith("/wallet") || pathname.startsWith("/history") || pathname.startsWith("/profile")) {
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

  // Hide global navigation layout for admin pages (used in popups)
  if (pathname.startsWith('/admin')) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-[#faf8ff] font-manrope flex flex-col">
      {/* Header Placeholder to prevent layout shift and scroll thrashing */}
      {!isGlobalNavHidden && (
        <div 
          className="w-full flex-shrink-0 transition-all duration-300" 
          style={{ 
            height: `${placeholderHeight}px`
          }} 
        />
      )}

      {/* Fixed Top Navigation */}
      <header 
        ref={headerRef}
        className={`fixed top-0 left-0 right-0 z-50 bg-white transition-shadow duration-300 transform will-change-transform ${
          isGlobalNavHidden ? 'hidden' : ''
        } ${
          (isScrolled || isHeaderShrink) 
            ? 'shadow-[0_4px_24px_rgba(11,90,192,0.10)]' 
            : 'shadow-[0_2px_12px_rgba(11,90,192,0.05)] border-b border-slate-100/30'
        }`}
        style={{ transition: 'transform 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)' }}
      >
        
        <>
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
              >
                <span 
                  className="material-symbols-outlined !text-[18px]"
                  style={{ fontVariationSettings: pathname === '/notification' ? "'FILL' 1" : "'FILL' 0" }}
                >
                  notifications
                </span>
                {totalNotiCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-primary text-[7px] font-black text-white outline outline-2 outline-white animate-in zoom-in">
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
              >
                <span 
                  className="material-symbols-outlined !text-[18px]"
                  style={{ fontVariationSettings: pathname.startsWith('/chat') ? "'FILL' 1" : "'FILL' 0" }}
                >
                  chat_bubble
                </span>
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-primary text-[7px] font-black text-white outline outline-2 outline-white animate-in zoom-in">
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
                  className="material-symbols-outlined !text-[18px]"
                  style={{ fontVariationSettings: pathname.startsWith('/search') ? "'FILL' 1" : "'FILL' 0" }}
                >
                  search
                </span>
              </Link>

              {/* Helpdesk */}
              <Link 
                href="/helpdesk" 
                className={`w-[32px] h-[32px] rounded-full flex items-center justify-center active:scale-95 transition-all ${
                  pathname === '/helpdesk' ? 'bg-[#007AFF]/10 text-[#007AFF]' : 'bg-[#F1F5F9] text-[#1E293B]'
                }`}
              >
                <span 
                  className="material-symbols-outlined !text-[18px]"
                  style={{ fontVariationSettings: pathname === '/helpdesk' ? "'FILL' 1" : "'FILL' 0" }}
                >
                  support_agent
                </span>
              </Link>


              {/* Separator */}
              <div className="w-[1px] h-[20px] bg-slate-200 mx-0.5" />

              {/* Language Toggle - Rightmost */}
              <button 
                onClick={toggleLanguage}
                className="w-[32px] h-[32px] rounded-full flex items-center justify-center active:scale-95 transition-all bg-[#F1F5F9] text-[#1E293B]"
              >
                <span className="font-bold text-[11px] tracking-tight">{language.toUpperCase()}</span>
              </button>
            </div>
          </div>

          {/* Scrolling Sub-Menu: Refined to match image (Icons Removed) */}
          {!isNoSubMenuPage && (
            <nav className="flex w-full px-0 border-b border-slate-100/60 bg-white">
              <div className="flex w-full items-end justify-between px-3">
                {subMenu.map((item) => {
                  const isActive = pathname === item.path || (item.path !== "/" && pathname.startsWith(item.path));
                  return (
                    <Link 
                      key={item.name} 
                      href={item.path} 
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
          )}

          {/* Custom Sub-Header Slot (e.g. Shop Filters) */}
          {subHeader && (
            <div className="w-full">
              {subHeader}
            </div>
          )}
        </>
      </header>

      {/* Main Content */}
      <main className={`flex-1 w-full relative bg-[#faf8ff] ${pathname === '/venues' || pathname.startsWith('/chat') || pathname.startsWith('/notification') || pathname.startsWith('/search') ? 'pb-0' : 'pb-[120px]'}`}>
        {children}
      </main>



      {/* Bottom Navigation Bar */}
      <footer 
        ref={footerRef}
        className={`fixed bottom-0 left-0 w-full z-50 bg-white rounded-t-2xl px-6 flex justify-around items-center shadow-[0_-8px_30px_rgba(11,90,192,0.14)] will-change-transform ${
          isGlobalNavHidden ? 'hidden' : ''
        }`}
        style={{ 
          height: 'calc(64px + max(env(safe-area-inset-bottom), 12px))',
          paddingBottom: 'max(env(safe-area-inset-bottom), 12px)',
          transition: 'transform 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)'
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

