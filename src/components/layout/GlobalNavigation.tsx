"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/providers/AuthProvider";

const NAV_STRUCTURE = {
  World: [
    { name: "PLAZA", icon: "explore", path: "/plaza" },
    { name: "HOME", icon: "home", path: "/home" },
    { name: "MAP", icon: "map", path: "/venues" },
    { name: "ARCADE", icon: "sports_esports", path: "/arcade" },
    { name: "EXPLORE", icon: "explore", path: "/explore" },
  ],
  Market: [
    { name: "SHOP", icon: "storefront", path: "/shop" },
    { name: "RESALE", icon: "local_mall", path: "/resale" },
    { name: "RENTAL", icon: "key", path: "/rental" },
    { name: "STAY", icon: "hotel", path: "/stay" },
    { name: "CLASS", icon: "school", path: "/class" },
  ],
  Play: [
    { name: "SOCIAL", icon: "diversity_3", path: "/social" },
    { name: "EVENT", icon: "calendar_today", path: "/events" },
    { name: "GALLERY", icon: "gallery_thumbnail", path: "/gallery" },
    { name: "LOST", icon: "help_center", path: "/lost-found" },
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
  { id: "World", icon: "public", basePath: "/plaza" },
  { id: "Market", icon: "storefront", basePath: "/shop" },
  { id: "Play", icon: "play_circle", basePath: "/social" },
  { id: "Group", icon: "groups", basePath: "/groups" },
  { id: "My", icon: "person", basePath: "/notification" },
];

export default function GlobalNavigation({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { profile } = useAuth();
  
  const [isScrolled, setIsScrolled] = useState(false);

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
  } else if (pathname.startsWith("/groups")) {
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

  const subMenu = NAV_STRUCTURE[activeTab as keyof typeof NAV_STRUCTURE] || [];

  return (
    <div className="min-h-screen bg-[#faf8ff] font-manrope flex flex-col">
      {/* Sticky Top Navigation */}
      <header className={`sticky top-0 z-50 bg-white transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${isScrolled ? 'shadow-[0_4px_20px_rgba(0,122,255,0.08)]' : 'border-b border-slate-100/50'}`}>
        
        {activeTab === "Group" ? (
          /* Specialized Group Header */
          <div className={`flex items-center justify-between px-6 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${isScrolled ? 'py-3' : 'py-5'}`}>
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
            <div className={`flex items-center gap-3 px-4 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${isScrolled ? 'py-2' : 'py-3'}`}>
              <div className="relative flex-1 flex items-center h-[42px] bg-[#FAF8FF] rounded-full pl-3 pr-1.5 border border-slate-100/50 shadow-sm">
                <span className="material-symbols-outlined text-[20px] text-[#64748B] mr-2">search</span>
                
                <div className="flex-1"></div>
                
                {/* Filter Chip */}
                <div className="flex items-center bg-[rgba(0,122,255,0.1)] text-[#007AFF] px-3 py-1.5 rounded-full text-[12px] font-semibold tracking-tight">
                  Seoul, Korea
                  <span className="material-symbols-outlined text-[14px] ml-1 font-bold cursor-pointer">close</span>
                </div>
              </div>
              
              <button className="flex items-center justify-center w-[42px] h-[42px] rounded-xl border border-slate-100 bg-white shadow-[0_2px_8px_rgba(0,0,0,0.02)] text-[#007AFF] hover:bg-slate-50 transition-all duration-300">
                <span className="material-symbols-outlined text-[22px]">tune</span>
              </button>
            </div>

            {/* Scrolling Sub-Menu */}
            <nav className={`flex w-full px-0 border-b border-slate-100/60 transition-all duration-300 ${isScrolled ? 'pb-0 pt-0' : 'pb-0 pt-1'}`}>
              <div className="flex w-full items-end justify-between px-2">
                {subMenu.map((item) => {
                  const isActive = pathname === item.path || (item.path !== "/" && pathname.startsWith(item.path));
                  return (
                    <Link key={item.name} href={item.path} className={`flex flex-col items-center justify-end flex-1 transition-all duration-300 border-b-2 ${isActive ? 'border-[#007AFF]' : 'border-transparent'}`}>
                      <span className={`material-symbols-outlined mb-1 transition-all duration-300 ease-in-out ${isActive ? 'text-[#007AFF]' : 'text-[#1E293B]'} ${isScrolled ? 'h-0 opacity-0 mb-0 m-0' : 'h-[18px] text-[18px] opacity-100'}`}>
                        {item.icon}
                      </span>
                      <span className={`text-[11px] tracking-wider pb-2.5 transition-all duration-300 ease-in-out ${isActive ? 'font-bold text-[#007AFF]' : 'font-semibold text-[#1E293B]'} ${isScrolled ? 'pt-3 pb-3' : ''}`}>
                        {item.name}
                      </span>
                    </Link>
                  );
                })}
                
                {/* Show Admin link inside My tab if user is admin */}
                {activeTab === "My" && profile?.isAdmin && (
                  <Link href="/admin/people" className={`flex flex-col items-center justify-end flex-1 transition-all duration-300 border-b-2 border-transparent opacity-50`}>
                    <span className={`material-symbols-outlined mb-1 transition-all duration-300 ease-in-out text-[#1E293B] ${isScrolled ? 'h-0 opacity-0 mb-0 m-0' : 'h-[18px] text-[18px] opacity-100'}`}>admin_panel_settings</span>
                    <span className={`text-[11px] font-semibold text-[#1E293B] pb-2.5 transition-all duration-300 ease-in-out ${isScrolled ? 'pt-3 pb-3' : ''}`}>ADMIN</span>
                  </Link>
                )}
              </div>
            </nav>
          </>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full pb-[120px] relative bg-[#faf8ff]">
        {children}
      </main>

      {/* Bottom Navigation Bar */}
      <footer 
        className="fixed bottom-0 left-0 w-full z-50 bg-white/90 backdrop-blur-xl border-t border-slate-100/50 px-8 flex justify-between items-center shadow-[0_-4px_20px_rgba(0,122,255,0.05)]"
        style={{ 
          height: 'calc(64px + max(env(safe-area-inset-bottom), 12px))',
          paddingBottom: 'max(env(safe-area-inset-bottom), 12px)'
        }}
      >
        {BOTTOM_TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <Link 
              key={tab.id} 
              href={tab.basePath} 
              className={`relative flex flex-col items-center justify-center w-[44px] h-[44px] transition-all duration-300 ${isActive ? 'text-[#007AFF]' : 'text-slate-400 hover:text-slate-600'}`}
            >
              {/* Aura Background */}
              <div 
                className={`absolute top-1/2 left-1/2 z-[-1] rounded-full bg-[rgba(0,122,255,0.08)] transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${isActive ? 'scale-100' : 'scale-0'}`}
                style={{ 
                  width: '52px', 
                  height: '52px',
                  marginTop: '-26px',
                  marginLeft: '-26px',
                  transformOrigin: 'center'
                }}
              />
              <span 
                className="material-symbols-outlined text-[28px] transition-colors duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
                style={{ fontVariationSettings: isActive ? "'FILL' 1, 'wght' 500" : "'FILL' 0, 'wght' 500" }}
              >
                {tab.icon}
              </span>
            </Link>
          );
        })}
      </footer>
    </div>
  );
}

