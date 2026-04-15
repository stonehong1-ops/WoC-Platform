'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

import { useNavigation } from '@/components/providers/NavigationProvider';
import { useAuth } from "@/components/providers/AuthProvider";
import { useLocation } from "@/components/providers/LocationProvider";

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { toggleDrawer } = useNavigation();
  const { user, profile, setShowLogin } = useAuth();
  const { location, toggleSelector } = useLocation();

  // Hide on login page or landing page
  if (pathname === '/login' || pathname === '/') return null;

  const routeMap: Record<string, { headline: string; sub: string }> = {
    '/home': { headline: 'HOME', sub: 'SOCIETY' },
    '/plaza': { headline: 'PLAZA', sub: 'SOCIETY' },
    '/venues': { headline: 'VENUES', sub: 'SOCIETY' },
    '/groups': { headline: 'GROUPS', sub: 'SOCIETY' },
    
    '/social': { headline: 'SOCIAL', sub: 'Activity' },
    '/class': { headline: 'CLASS', sub: 'Activity' },
    '/events': { headline: 'EVENTS', sub: 'Activity' },
    '/shop': { headline: 'SHOP', sub: 'Activity' },
    '/stay': { headline: 'STAY', sub: 'Activity' },
    '/service': { headline: 'SERVICE', sub: 'Activity' },
    
    '/resale': { headline: 'RESALE', sub: 'Town' },
    '/lost': { headline: 'L&F', sub: 'Town' },
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
  };

  const current = routeMap[pathname] || { headline: 'SALON', sub: 'SOCIETY' };

  return (
    <header className="fixed top-0 w-full z-50 bg-white border-b border-outline-variant/20 h-16 px-3 flex items-center justify-between">
      <div className="flex items-center gap-3 shrink-0">
        {/* Hamburger Menu - Re-attached link via toggleDrawer */}
        <button 
          onClick={toggleDrawer}
          className="hover:opacity-70 transition-opacity active:scale-95 duration-100 flex items-center justify-center p-1"
          aria-label="Open menu"
        >
          <span className="material-symbols-outlined text-on-surface" data-icon="menu">menu</span>
        </button>
        {/* Title */}
        <div className="flex flex-col">
          <h1 className="font-display text-[18px] font-black tracking-tight text-on-surface leading-none">{current.headline}</h1>
        </div>
      </div>

      <div className="flex items-center">
        {/* Action Group */}
        <div className="flex items-center gap-1">
          {/* Notifications */}
          <Link 
            href="/notification" 
            className="relative hover:opacity-70 transition-opacity active:scale-95 duration-100 flex items-center justify-center w-8 h-8"
          >
            <span className="material-symbols-outlined text-on-surface !text-[20px]" data-icon="notifications">notifications</span>
            <span className="absolute top-0 right-0 flex h-3 w-3 items-center justify-center rounded-full bg-primary text-[7px] font-black text-white outline outline-1 outline-white">3</span>
          </Link>

          {/* Chat */}
          <Link 
            href="/chat" 
            className="relative hover:opacity-70 transition-opacity active:scale-95 duration-100 flex items-center justify-center w-8 h-8"
          >
            <span className="material-symbols-outlined text-on-surface !text-[20px]" data-icon="chat_bubble">chat_bubble</span>
            <span className="absolute top-0 right-0 flex h-3 w-3 items-center justify-center rounded-full bg-primary text-[7px] font-black text-white outline outline-1 outline-white">5</span>
          </Link>

          {/* Search */}
          <Link 
            href="/search" 
            className="hover:opacity-70 transition-opacity active:scale-95 duration-100 flex items-center justify-center w-8 h-8"
          >
            <span className="material-symbols-outlined text-on-surface !text-[20px]" data-icon="search">search</span>
          </Link>
        </div>



        {/* Location Group - Interactive */}
        <button 
          onClick={toggleSelector}
          className="flex flex-col justify-center items-end hover:opacity-70 transition-opacity active:scale-95 duration-100 pr-1"
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
