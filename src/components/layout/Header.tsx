'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

import { useNavigation } from '@/components/providers/NavigationProvider';
import { useAuth } from "@/components/providers/AuthProvider";
import { useLocation } from "@/components/providers/LocationProvider";
import { useNotification } from '@/contexts/NotificationContext';
import { chatService } from '@/lib/firebase/chatService';

import { useLanguage } from '@/contexts/LanguageContext';

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { toggleDrawer, openNotiTray } = useNavigation();
  const { user, profile, setShowLogin } = useAuth();
  const { location, toggleSelector } = useLocation();
  const { unreadCount: notiUnreadCount, todoCount } = useNotification();
  const [unreadCount, setUnreadCount] = React.useState(0);
  const { language, toggleLanguage, t } = useLanguage();

  React.useEffect(() => {
    if (!user) return;
    const unsub = chatService.subscribeTotalUnreadCount(user.uid, (count) => {
      setUnreadCount(count);
    });
    return () => unsub();
  }, [user]);

  // Hide on login page, landing page, stay detail, or space pages (App-in-App)
  if (pathname === '/login' || pathname === '/' || (pathname.startsWith('/stay/') && pathname !== '/stay') || (pathname.startsWith('/rental/') && pathname !== '/rental') || pathname.startsWith('/group/')) return null;

  const routeMap: Record<string, { headlineKey: string; sub: string }> = {
    '/': { headlineKey: 'header.home', sub: 'SOCIETY' },
    '/home': { headlineKey: 'header.home', sub: 'SOCIETY' },
    '/plaza': { headlineKey: 'header.plaza', sub: 'SOCIETY' },
    '/venues': { headlineKey: 'header.venues', sub: 'SOCIETY' },
    '/groups': { headlineKey: 'header.groups', sub: 'SOCIETY' },
    
    '/social': { headlineKey: 'header.social', sub: 'Activity' },
    '/class': { headlineKey: 'header.class', sub: 'Activity' },
    '/events': { headlineKey: 'header.events', sub: 'Activity' },
    '/shop': { headlineKey: 'header.shop', sub: 'Activity' },
    '/stay': { headlineKey: 'header.stay', sub: 'Activity' },
    '/rental': { headlineKey: 'header.freestyle_tango', sub: 'Activity' },
    '/service': { headlineKey: 'header.service', sub: 'Activity' },
    
    '/resale': { headlineKey: 'header.resale', sub: 'Town' },
    '/lost-found': { headlineKey: 'header.lost_found', sub: 'Town' },
    '/arcade': { headlineKey: 'header.arcade', sub: 'Town' },
    
    '/chat': { headlineKey: 'header.chat', sub: 'Social' },
    '/wallet': { headlineKey: 'header.wallet', sub: 'My' },
    '/history': { headlineKey: 'header.history', sub: 'My' },
    '/my-info': { headlineKey: 'header.my_info', sub: 'My' },
    '/admin/people': { headlineKey: 'header.people', sub: 'Admin' },
    '/admin/place': { headlineKey: 'header.place', sub: 'Admin' },
    '/admin/others': { headlineKey: 'header.others', sub: 'Admin' },
    '/notification': { headlineKey: 'header.notification', sub: 'System' },
    '/search': { headlineKey: 'header.search', sub: 'System' },
    '/live': { headlineKey: 'header.live', sub: 'Activity' },
    '/live/create': { headlineKey: 'header.live', sub: 'Activity' },
  };

  let current = routeMap[pathname];
  if (!current) {
    if (pathname.startsWith('/class/')) {
      current = { headlineKey: 'header.class', sub: 'Activity' };
    } else if (pathname.startsWith('/lost-found/')) {
      current = { headlineKey: 'header.lost_found', sub: 'Town' };
    } else if (pathname.startsWith('/rental/')) {
      current = { headlineKey: 'header.freestyle_tango', sub: 'Activity' };
    } else {
      current = { headlineKey: 'header.community', sub: 'SOCIETY' };
    }
  }

  const totalNotiCount = notiUnreadCount + todoCount;

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
        {/* Title */}
        <div className="flex flex-col">
          <h1 className="font-display text-[18px] font-black tracking-tight text-on-surface leading-none uppercase">{t(current.headlineKey)}</h1>
        </div>
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

          {/* Language Toggle */}
          <button 
            onClick={toggleLanguage}
            className="relative hover:opacity-70 transition-opacity active:scale-95 duration-100 flex items-center justify-center w-8 h-8"
          >
            <span className="font-bold text-[13px] text-on-surface tracking-tight">{language.toUpperCase()}</span>
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
      </div>
    </header>
  );
}
