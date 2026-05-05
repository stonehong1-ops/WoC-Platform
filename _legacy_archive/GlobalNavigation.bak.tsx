"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/providers/AuthProvider";
import { useNavigation } from "@/components/providers/NavigationProvider";
import { useLocation } from "@/components/providers/LocationProvider";
import UserAvatar from "@/components/common/UserAvatar";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/clientApp";
import { chatService } from "@/lib/firebase/chatService";
const NAV_STRUCTURE = {
  World: [
    { name: "PLAZA", icon: "quick_phrases", path: "/plaza" },
    { name: "MAP", icon: "map", path: "/venues" },
    { name: "ARCADE", icon: "airline_stops", path: "/arcade" },
    { name: "SOCIETY", icon: "radio_button_unchecked", path: "/home" },
    { name: "EXPLORE", icon: "explore", path: "/explore" },
  ],
  Market: [
    { name: "SHOP", icon: "storefront", path: "/shop" },
    { name: "RESALE", icon: "local_mall", path: "/resale" },
    { name: "RENTAL", icon: "barefoot", path: "/rental" },
    { name: "STAY", icon: "night_shelter", path: "/stay" },
    { name: "CLASS", icon: "school", path: "/class" },
  ],
  Play: [
    { name: "SOCIAL", icon: "autoplay", path: "/social" },
    { name: "EVENT", icon: "calendar_today", path: "/events" },
    { name: "GALLERY", icon: "cinematic_blur", path: "/gallery" },
    { name: "LOST", icon: "eye_tracking", path: "/lost-found" },
  ],
  Group: [
    { name: "MY GROUPS", icon: "groups", path: "/groups" },
  ],
  My: [
    { name: "NOTI", icon: "notifications", path: "/notification" },
    { name: "CHAT", icon: "chat", path: "/chat" },
    { name: "WALLET", icon: "account_balance_wallet", path: "/wallet" },
    { name: "HISTORY", icon: "history", path: "/history" },
    { name: "PROFILE", icon: "person", path: "/my-info" },
  ],
  Admin: [
    { name: "PEOPLE", icon: "people", path: "/admin/people" },
    { name: "PLACE", icon: "place", path: "/admin/place" },
    { name: "OTHERS", icon: "more_horiz", path: "/admin/others" },
  ],
};

const BOTTOM_TABS = [
  { id: "World", icon: "globe", basePath: "/plaza" },
  { id: "Market", icon: "redeem", basePath: "/shop" },
  { id: "Play", icon: "contactless", basePath: "/social" },
  { id: "Group", icon: "communities", basePath: "/groups" },
  { id: "My", icon: "photo", basePath: "/notification" },
];

export default function GlobalNavigation({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, profile } = useAuth();
  const { isHeaderShrink, subHeader, isHeaderVisible, setIsHeaderVisible } = useNavigation();
  const { location, setIsSelectorOpen } = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const headerRef = React.useRef<HTMLElement>(null);
  const footerRef = React.useRef<HTMLElement>(null);
  const currentTranslateY = React.useRef(0);
  const lastScrollY = React.useRef(0);
  const accumulatedScrollUp = React.useRef(0);
  const lastSentVisibility = React.useRef<boolean | null>(null);
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [unreadNotiCount, setUnreadNotiCount] = useState(0);

  useEffect(() => {
    if (!user?.uid) return;
    
    // Chat unread count
    const unsubChat = chatService.subscribeTotalUnreadCount(user.uid, (count) => {
      setUnreadChatCount(count);
    });

    // Notification unread count (isRead == false)
    const notiQuery = query(
      collection(db, 'notifications'), 
      where('targetUserId', '==', user.uid),
      where('isRead', '==', false)
    );
    const unsubNoti = onSnapshot(notiQuery, (snapshot) => {
      setUnreadNotiCount(snapshot.docs.length);
    });

    return () => {
      unsubChat();
      unsubNoti();
    };
  }, [user?.uid]);

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
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
  } else if (pathname.startsWith("/social") || pathname.startsWith("/events") || pathname.startsWith("/gallery") || pathname.startsWith("/lost-found")) {
    activeTab = "Play";
  } else if (pathname.startsWith("/groups") || pathname.startsWith("/group/")) {
    activeTab = "Group";
  } else if (pathname.startsWith("/my") || pathname.startsWith("/notification") || pathname.startsWith("/chat") || pathname.startsWith("/wallet") || pathname.startsWith("/history") || pathname.startsWith("/my-info")) {
    activeTab = "My";
  } else if (pathname.startsWith("/admin")) {
    activeTab = "Admin";
  }

  // Handle default tab for "/"
  if (pathname === "/") {
    activeTab = "Play";
  }

  const isGroupDetailPage = pathname.startsWith("/group/");

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

  return (
    <div className="min-h-screen bg-[#faf8ff] font-manrope flex flex-col">
      {/* Header Placeholder to prevent layout shift and scroll thrashing */}
      <div 
        className="w-full flex-shrink-0 transition-all duration-300" 
        style={{ 
          height: activeTab === 'Group' ? '72px' : subHeader ? '194px' : '110px' 
        }} 
      />

      {/* Fixed Top Navigation */}
      <header 
        ref={headerRef}
        className={`fixed top-0 left-0 right-0 z-50 bg-white transition-shadow duration-300 transform will-change-transform ${
          (isScrolled || isHeaderShrink) 
            ? 'shadow-[0_4px_24px_rgba(11,90,192,0.10)]' 
            : 'shadow-[0_2px_12px_rgba(11,90,192,0.05)] border-b border-slate-100/30'
        }`}
        style={{ transition: 'transform 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)' }}
      >
        
        {activeTab === "Group" ? (
          /* Specialized Group Header */
          <div className={`flex items-center justify-between px-6 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${(isScrolled || isHeaderShrink) ? 'py-3' : 'py-5'}`}>
            <Link href="/groups?view=my" className="flex items-center gap-1 cursor-pointer group">
              <span className="text-[20px] font-bold text-[#1E293B] group-hover:text-[#007AFF] transition-colors">My Group</span>
              <span className="material-symbols-outlined text-[24px] text-[#007AFF] font-bold">chevron_right</span>
            </Link>
            
            <Link href="/groups?action=create" className="flex items-center gap-1.5 bg-[#007AFF] text-white px-4 py-2 rounded-full text-[13px] font-bold shadow-lg shadow-blue-100 active:scale-95 transition-all">
              <span className="material-symbols-outlined text-[18px]">add</span>
              Add Group
            </Link>
          </div>
        ) : (
          <>
            {/* Exact Image Replication: Header Top Row */}
            <div className="flex items-center justify-between px-5 h-[72px] border-b border-slate-100/50 bg-white">
              {/* Left Side: Location & Society Name */}
              <button 
                onClick={() => setIsSelectorOpen(true)}
                className="flex flex-col justify-center items-start hover:opacity-70 transition-opacity active:scale-95 duration-100"
              >
                <div className="flex items-center gap-1">
                  <span className="text-[17px] font-extrabold text-[#1E293B] tracking-tight leading-none uppercase">
                    {location.city}, {location.country}
                  </span>
                  <span className="material-symbols-outlined !text-[20px] text-[#1E293B] font-bold">expand_more</span>
                </div>
                <span className="text-[11px] font-bold text-[#64748B] tracking-[0.02em] uppercase mt-1">
                  TANGO SOCIETY
                </span>
              </button>

              {/* Right Side: Action Icons (Circular Style) */}
              <div className="flex items-center gap-2">
                {/* Add Icon */}
                <button 
                  className="w-10 h-10 rounded-full bg-[#F1F5F9] flex items-center justify-center hover:bg-[#E2E8F0] active:scale-90 transition-all text-[#1E293B]"
                >
                  <span className="material-symbols-outlined !text-[24px]">add</span>
                </button>

                {/* Notification Icon */}
                <button 
                  onClick={() => {}} // Integration for Notification Tray
                  className="relative w-10 h-10 rounded-full bg-[#F1F5F9] flex items-center justify-center hover:bg-[#E2E8F0] active:scale-90 transition-all text-[#1E293B]"
                >
                  <span className="material-symbols-outlined !text-[24px]">notifications</span>
                  {unreadNotiCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#FF3B30] px-1 text-[9px] font-black text-white outline outline-2 outline-white shadow-sm">
                      {unreadNotiCount > 99 ? '99+' : unreadNotiCount}
                    </span>
                  )}
                </button>

                {/* Chat Icon */}
                <Link 
                  href="/chat"
                  className="relative w-10 h-10 rounded-full bg-[#F1F5F9] flex items-center justify-center hover:bg-[#E2E8F0] active:scale-90 transition-all text-[#1E293B]"
                >
                  <span className="material-symbols-outlined !text-[24px]">chat_bubble_outline</span>
                  {unreadChatCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#007AFF] px-1 text-[9px] font-black text-white outline outline-2 outline-white shadow-sm">
                      {unreadChatCount > 99 ? '99+' : unreadChatCount}
                    </span>
                  )}
                </Link>

                {/* Search Icon */}
                <Link 
                  href="/search"
                  className="w-10 h-10 rounded-full bg-[#F1F5F9] flex items-center justify-center hover:bg-[#E2E8F0] active:scale-90 transition-all text-[#1E293B]"
                >
                  <span className="material-symbols-outlined !text-[24px]">search</span>
                </Link>
              </div>
            </div>

            {/* Scrolling Sub-Menu */}
            <nav className="flex w-full px-0 border-b border-slate-100/60 transition-all duration-300 pb-0 pt-0.5">
              <div className="flex w-full items-end justify-between px-2">
                {subMenu.map((item) => {
                  const isActive = pathname === item.path || (item.path !== "/" && pathname.startsWith(item.path));
                  return (
                    <Link key={item.name} href={item.path} className={`flex flex-col items-center justify-end flex-1 transition-all duration-300 border-b-2 ${isActive ? 'border-[#007AFF]' : 'border-transparent'}`}>
                      <span className={`material-symbols-outlined transition-all duration-300 ease-in-out ${isActive ? 'text-[#007AFF]' : 'text-[#1E293B]'} !text-[17px] mb-0.5 opacity-100`}>
                        {item.icon}
                      </span>
                      <span className={`text-[11px] tracking-wider pb-1.5 transition-all duration-300 ease-in-out ${isActive ? 'font-bold text-[#007AFF]' : 'font-semibold text-[#1E293B]'}`}>
                        {item.name}
                      </span>
                    </Link>
                  );
                })}
                
                {/* Show Admin link inside My tab if user is admin */}
                {activeTab === "My" && profile?.isAdmin && (
                  <Link href="/admin/people" className={`flex flex-col items-center justify-end flex-1 transition-all duration-300 border-b-2 border-transparent opacity-50`}>
                    <span className="material-symbols-outlined transition-all duration-300 ease-in-out text-[#1E293B] !text-[17px] mb-0.5 opacity-100">admin_panel_settings</span>
                    <span className="text-[11px] font-semibold text-[#1E293B] pb-1.5 transition-all duration-300 ease-in-out">ADMIN</span>
                  </Link>
                )}
              </div>
            </nav>

            {/* Custom Sub-Header Slot (e.g. Shop Filters) */}
            {subHeader && (
              <div className="w-full">
                {subHeader}
              </div>
            )}
          </>
        )}
      </header>

      {/* Main Content */}
      <main className={`flex-1 w-full relative bg-[#faf8ff] ${pathname === '/venues' ? 'pb-0' : 'pb-[120px]'}`}>
        {children}
      </main>

      {/* Bottom Navigation Bar */}
      <footer 
        ref={footerRef}
        className="fixed bottom-0 left-0 w-full z-50 bg-white rounded-t-2xl px-6 flex justify-around items-center shadow-[0_-8px_30px_rgba(11,90,192,0.14)] will-change-transform"
        style={{ 
          height: 'calc(64px + max(env(safe-area-inset-bottom), 12px))',
          paddingBottom: 'max(env(safe-area-inset-bottom), 12px)',
          transition: 'transform 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)'
        }}
      >
        {[
          ...BOTTOM_TABS,
          ...(profile?.isAdmin ? [{ id: "Admin", icon: "admin_panel_settings", basePath: "/admin/people" }] : [])
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          const isPhotoTab = tab.icon === "photo";
          const targetPath = (isActive && tab.id === "My") ? "/my-info" : tab.basePath;
          return (
            <Link 
              key={tab.id} 
              href={targetPath} 
              className={`relative flex flex-col items-center justify-center w-[48px] h-[48px] transition-all duration-300 ${isActive ? 'text-[#007AFF]' : 'text-slate-400 hover:text-slate-600'}`}
            >
              {/* Aura Background (Same for all tabs) */}
              <div 
                className={`absolute top-1/2 left-1/2 z-[-1] rounded-full transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                  isActive ? 'scale-100 bg-[rgba(0,122,255,0.08)]' : 'scale-0 bg-[rgba(0,122,255,0.08)]'
                }`}
                style={{ 
                  width: '48px', 
                  height: '48px',
                  marginTop: '-24px',
                  marginLeft: '-24px',
                  transformOrigin: 'center'
                }}
              />
              {isPhotoTab ? (
                <div className="relative flex items-center justify-center w-[32px] h-[32px]">
                  <UserAvatar 
                    photoURL={profile?.photoURL}
                    className={`!w-[32px] !h-[32px] rounded-full transition-all duration-300 ${isActive ? 'ring-[2.5px] ring-[#007AFF] ring-offset-1' : 'opacity-80 hover:opacity-100'}`}
                    iconSize="24px"
                  />
                  {/* Badges Container at Top-Right, expanding to the right */}
                  {(unreadChatCount > 0 || unreadNotiCount > 0) && (
                    <div className="absolute -top-[4px] left-[21px] flex items-center gap-[2px] z-10">
                      {unreadNotiCount > 0 && (
                        <span className="flex h-[15px] min-w-[15px] items-center justify-center rounded-full bg-[#FF3B30] px-1 text-[8px] font-black text-white outline outline-[1.5px] outline-white shadow-sm">
                          {unreadNotiCount > 99 ? '99+' : unreadNotiCount}
                        </span>
                      )}
                      {unreadChatCount > 0 && (
                        <span className="flex h-[15px] min-w-[15px] items-center justify-center rounded-full bg-[#007AFF] px-1 text-[8px] font-black text-white outline outline-[1.5px] outline-white shadow-sm">
                          {unreadChatCount > 99 ? '99+' : unreadChatCount}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <span 
                  className="material-symbols-outlined !text-[32px] transition-colors duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
                  style={{ fontVariationSettings: isActive ? "'FILL' 1, 'wght' 500" : "'FILL' 0, 'wght' 500" }}
                >
                  {tab.icon}
                </span>
              )}
            </Link>
          );
        })}
      </footer>
    </div>
  );
}

