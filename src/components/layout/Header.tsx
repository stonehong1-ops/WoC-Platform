'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

import { useNavigation } from '@/components/providers/NavigationProvider';
import { useAuth } from "@/components/providers/AuthProvider";
import { useLocation } from "@/components/providers/LocationProvider";
import { chatService } from '@/lib/firebase/chatService';

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { toggleDrawer } = useNavigation();
  const { user, profile, setShowLogin } = useAuth();
  const { location, toggleSelector } = useLocation();
  const [unreadCount, setUnreadCount] = React.useState(0);

  React.useEffect(() => {
    if (!user) return;
    const unsub = chatService.subscribeTotalUnreadCount(user.uid, (count) => {
      setUnreadCount(count);
    });
    return () => unsub();
  }, [user]);

  // Hide on login page, landing page, stay detail, or space pages (App-in-App)
  if (pathname === '/login' || pathname === '/' || (pathname.startsWith('/stay/') && pathname !== '/stay') || (pathname.startsWith('/rental/') && pathname !== '/rental') || pathname.startsWith('/group/')) return null;

  const routeMap: Record<string, { headline: string; sub: string }> = {
    '/': { headline: 'HOME', sub: 'SOCIETY' },
    '/home': { headline: 'HOME', sub: 'SOCIETY' },
    '/plaza': { headline: 'PLAZA', sub: 'SOCIETY' },
    '/venues': { headline: 'VENUES', sub: 'SOCIETY' },
    '/groups': { headline: 'GROUPS', sub: 'SOCIETY' },
    
    '/social': { headline: 'SOCIAL', sub: 'Activity' },
    '/class': { headline: 'CLASS', sub: 'Activity' },
    '/events': { headline: 'EVENTS', sub: 'Activity' },
    '/shop': { headline: 'SHOP', sub: 'Activity' },
    '/stay': { headline: 'STAY', sub: 'Activity' },
    '/rental': { headline: 'Freestyle Tango', sub: 'Activity' },
    '/service': { headline: 'SERVICE', sub: 'Activity' },
    
    '/resale': { headline: 'RESALE', sub: 'Town' },
    '/lost-found': { headline: 'Losts & Found', sub: 'Town' },
    '/arcade': { headline: 'ARCADE', sub: 'Town' },
    
    '/chat': { headline: 'CHAT', sub: 'Social' },
    '/wallet': { headline: 'WALLET', sub: 'My' },
    '/history': { headline: 'HISTORY', sub: 'My' },
    '/my-info': { headline: 'MY INFO', sub: 'My' },
    '/admin/people': { headline: 'PEOPLE', sub: 'Admin' },
    '/admin/place': { headline: 'PLACE', sub: 'Admin' },
    '/admin/others': { headline: 'OTHERS', sub: 'Admin' },
    '/notification': { headline: 'NOTIFICATION', sub: 'System' },
    '/search': { headline: 'SEARCH', sub: 'System' },
    '/gallery': { headline: 'GALLERY', sub: 'Activity' },
    '/gallery/create': { headline: 'GALLERY', sub: 'Activity' },
  };

  let current = routeMap[pathname];
  if (!current) {
    if (pathname.startsWith('/class/')) {
      current = { headline: 'CLASS', sub: 'Activity' };
    } else if (pathname.startsWith('/lost-found/')) {
      current = { headline: 'Losts & Found', sub: 'Town' };
    } else if (pathname.startsWith('/rental/')) {
      current = { headline: 'Freestyle Tango', sub: 'Activity' };
    } else {
      current = { headline: 'COMMUNITY', sub: 'SOCIETY' };
    }
  }

  return (
    <header className="fixed top-0 w-full z-50 bg-[#FAF8FF]/80 backdrop-blur-md border-b border-slate-100 h-16 px-3 flex items-center justify-between">
      <div className="flex items-center gap-3 shrink-0">
        {/* Hamburger Menu - Re-attached link via toggleDrawer */}
        <button 
          onClick={toggleDrawer}
          className="hover:opacity-70 transition-opacity active:scale-95 duration-100 flex items-center justify-center w-8 h-8"
          aria-label="Open menu"
        >
          <span className="material-symbols-outlined text-on-surface !text-[18px]" data-icon="menu">menu</span>
        </button>
      </div>

      <div className="flex items-center">
        {/* Action Group */}
        <div className="flex items-center gap-1">
          {/* Map / Location Trigger */}
          <button 
            onClick={toggleSelector}
            className="hover:opacity-70 transition-opacity active:scale-95 duration-100 flex items-center justify-center w-8 h-8"
          >
            <span className="material-symbols-outlined text-on-surface !text-[18px]" data-icon="pin_drop">pin_drop</span>
          </button>

          {/* Chat */}
          <Link 
            href="/chat" 
            className="relative hover:opacity-70 transition-opacity active:scale-95 duration-100 flex items-center justify-center w-8 h-8"
          >
            <span className="material-symbols-outlined text-on-surface !text-[18px]" data-icon="chat_bubble">chat_bubble</span>
            {unreadCount > 0 && (
              <span className="absolute top-0 right-0 flex h-3 w-3 items-center justify-center rounded-full bg-primary text-[7px] font-black text-white outline outline-1 outline-white animate-in zoom-in">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </Link>

          {/* Search */}
          <Link 
            href="/search" 
            className="hover:opacity-70 transition-opacity active:scale-95 duration-100 flex items-center justify-center w-8 h-8"
          >
            <span className="material-symbols-outlined text-on-surface !text-[18px]" data-icon="search">search</span>
          </Link>
        </div>

        {/* Vertical Divider - Separating Action Group from Location */}
        <div className="h-5 w-[1px] bg-outline-variant/30 ml-2"></div>

        {/* Location Group - Interactive (Flush Left to Divider) */}
        <button 
          onClick={toggleSelector}
          className="flex flex-col justify-center items-start hover:opacity-70 transition-opacity active:scale-95 duration-100 pl-1.5 pr-1"
        >
          <span className="font-label text-[8px] font-black tracking-widest text-on-surface/30 uppercase leading-none">
            {location.country}
          </span>
          <span className="font-label text-[11px] font-black leading-none text-primary flex items-center gap-0.5 mt-0.5 uppercase whitespace-nowrap">
            {location.city}{location.zone ? ` · ${location.zone}` : ''}
            <span className="material-symbols-outlined !text-[14px] leading-none text-primary" data-icon="expand_more">expand_more</span>
          </span>
        </button>

      </div>
    </header>


  );
}
