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
  const { isHeaderShrink } = useNavigation();
  const { location, setIsSelectorOpen } = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [unreadNotiCount, setUnreadNotiCount] = useState(0);

  useEffect(() => {
    if (!user?.uid) return;
    
    // Chat unread count
    const unsubChat = chatService.subscribeTotalUnreadCount(user.uid, (count) => {
      setUnreadChatCount(count);
    });

    // Notification unread count (status == 'PENDING')
    const notiQuery = query(
      collection(db, 'notifications'), 
      where('targetUserId', '==', user.uid),
      where('status', '==', 'PENDING')
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
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
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
      {/* Sticky Top Navigation */}
      <header className={`sticky top-0 left-0 right-0 z-50 bg-white transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${(isScrolled || isHeaderShrink) ? 'shadow-[0_4px_24px_rgba(11,90,192,0.10)]' : 'shadow-[0_2px_12px_rgba(11,90,192,0.05)] border-b border-slate-100/30'}`}>
        
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
            {/* Search and Filter Bar */}
            <div className={`flex items-center gap-3 px-4 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${(isScrolled || isHeaderShrink) ? 'py-2' : 'py-3'}`}>
              <div className="relative flex-1 flex items-center h-[42px] bg-[#FAF8FF] rounded-full pl-3 pr-1.5 border border-slate-100/50 shadow-sm">
                <span className="material-symbols-outlined text-[20px] text-[#64748B] mr-2">search</span>
                
                <div className="flex-1"></div>
                
                {/* Filter Chip */}
                <div 
                  onClick={() => setIsSelectorOpen(true)}
                  className="flex items-center bg-[rgba(0,122,255,0.1)] text-[#007AFF] px-3 py-1.5 rounded-full text-[12px] font-semibold tracking-tight cursor-pointer active:scale-95 transition-all"
                >
                  <span className="truncate max-w-[120px]">
                    {location.city}, {location.country}
                  </span>
                  <span className="material-symbols-outlined text-[14px] ml-1 font-bold">expand_more</span>
                </div>
              </div>
            </div>

            {/* Scrolling Sub-Menu */}
            <nav className={`flex w-full px-0 border-b border-slate-100/60 transition-all duration-300 ${isScrolled ? 'pb-0 pt-0' : 'pb-0 pt-0.5'}`}>
              <div className="flex w-full items-end justify-between px-2">
                {subMenu.map((item) => {
                  const isActive = pathname === item.path || (item.path !== "/" && pathname.startsWith(item.path));
                  return (
                    <Link key={item.name} href={item.path} className={`flex flex-col items-center justify-end flex-1 transition-all duration-300 border-b-2 ${isActive ? 'border-[#007AFF]' : 'border-transparent'}`}>
                      <span className={`material-symbols-outlined transition-all duration-300 ease-in-out ${isActive ? 'text-[#007AFF]' : 'text-[#1E293B]'} ${(isScrolled || isHeaderShrink) ? 'h-0 opacity-0 mb-0 m-0 overflow-hidden' : '!text-[17px] mb-0.5 opacity-100'}`}>
                        {item.icon}
                      </span>
                      <span className={`text-[11px] tracking-wider pb-1.5 transition-all duration-300 ease-in-out ${isActive ? 'font-bold text-[#007AFF]' : 'font-semibold text-[#1E293B]'} ${(isScrolled || isHeaderShrink) ? 'pt-3 pb-3' : ''}`}>
                        {item.name}
                      </span>
                    </Link>
                  );
                })}
                
                {/* Show Admin link inside My tab if user is admin */}
                {activeTab === "My" && profile?.isAdmin && (
                  <Link href="/admin/people" className={`flex flex-col items-center justify-end flex-1 transition-all duration-300 border-b-2 border-transparent opacity-50`}>
                    <span className={`material-symbols-outlined transition-all duration-300 ease-in-out text-[#1E293B] ${(isScrolled || isHeaderShrink) ? 'h-0 opacity-0 mb-0 m-0 overflow-hidden' : '!text-[17px] mb-0.5 opacity-100'}`}>admin_panel_settings</span>
                    <span className={`text-[11px] font-semibold text-[#1E293B] pb-1.5 transition-all duration-300 ease-in-out ${(isScrolled || isHeaderShrink) ? 'pt-3 pb-3' : ''}`}>ADMIN</span>
                  </Link>
                )}
              </div>
            </nav>
          </>
        )}
      </header>

      {/* Main Content */}
      <main className={`flex-1 w-full relative bg-[#faf8ff] ${pathname === '/venues' ? 'pb-0' : 'pb-[120px]'}`}>
        {children}
      </main>

      {/* Bottom Navigation Bar */}
      <footer 
        className="fixed bottom-0 left-0 w-full z-50 bg-white rounded-t-2xl px-6 flex justify-around items-center shadow-[0_-8px_30px_rgba(11,90,192,0.14)]"
        style={{ 
          height: 'calc(64px + max(env(safe-area-inset-bottom), 12px))',
          paddingBottom: 'max(env(safe-area-inset-bottom), 12px)'
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
                <div className="relative flex items-center justify-center">
                  <UserAvatar 
                    photoURL={profile?.photoURL}
                    className={`!w-[32px] !h-[32px] rounded-full transition-all duration-300 ${isActive ? 'ring-[2.5px] ring-[#007AFF] ring-offset-1' : 'opacity-80 hover:opacity-100'}`}
                    iconSize="24px"
                  />
                  {(unreadNotiCount > 0 || unreadChatCount > 0) && (
                    <div className="absolute -top-1 -right-2 flex gap-[2px] z-10">
                      {unreadNotiCount > 0 && (
                        <span className="flex h-3.5 min-w-[14px] items-center justify-center rounded-full bg-[#FF3B30] px-1 text-[8px] font-black text-white outline outline-[1.5px] outline-white shadow-sm">
                          {unreadNotiCount > 99 ? '99+' : unreadNotiCount}
                        </span>
                      )}
                      {unreadChatCount > 0 && (
                        <span className="flex h-3.5 min-w-[14px] items-center justify-center rounded-full bg-[#007AFF] px-1 text-[8px] font-black text-white outline outline-[1.5px] outline-white shadow-sm">
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

