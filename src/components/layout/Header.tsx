'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { useNavigation } from '@/components/providers/NavigationProvider';
import { useAuth } from "@/components/providers/AuthProvider";
import { useLocation } from "@/components/providers/LocationProvider";

export default function Header() {
  const pathname = usePathname();
  const { toggleDrawer } = useNavigation();
  const { user, profile, setShowLogin } = useAuth();
  const { location, toggleSelector } = useLocation();

  // Hide on login page only
  if (pathname === '/login') return null;
  // If we are on landing page, Header is already there as a custom nav, 
  // but if the user wants this global Header instead, we should decide.
  // The provided HTML design usually replaces the landing page nav.
  if (pathname === '/') return null; 

  const routeMap: Record<string, { headline: string; sub: string }> = {
    '/home': { headline: 'HOME', sub: 'Tango World' },
    '/plaza': { headline: 'PLAZA', sub: 'Tango World' },
    '/venues': { headline: 'VENUES', sub: 'Tango World' },
    '/groups': { headline: 'GROUPS', sub: 'Tango World' },
    
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

  const current = routeMap[pathname] || { headline: 'SALON', sub: 'Tango World' };

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
          <span className="font-label text-[9px] font-black text-on-surface/30 leading-none mb-1 uppercase tracking-widest">{current.sub}</span>
          <h1 className="font-display text-[16px] font-black tracking-tight text-on-surface leading-none">{current.headline}</h1>
        </div>
      </div>

      <div className="flex items-center">
        {/* Action Group */}
        <div className="flex items-center gap-1.5">
          {/* Notifications */}
          <Link 
            href="/notification" 
            className="relative hover:opacity-70 transition-opacity active:scale-95 duration-100 flex items-center justify-center w-8 h-8"
          >
            <span className="material-symbols-outlined text-on-surface !text-[22px]" data-icon="notifications">notifications</span>
            <span className="absolute top-0 right-0 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-primary text-[8px] font-black text-white outline outline-2 outline-white">3</span>
          </Link>

          {/* Chat */}
          <Link 
            href="/chat" 
            className="relative hover:opacity-70 transition-opacity active:scale-95 duration-100 flex items-center justify-center w-8 h-8"
          >
            <span className="material-symbols-outlined text-on-surface !text-[22px]" data-icon="chat_bubble">chat_bubble</span>
            <span className="absolute top-0 right-0 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-primary text-[8px] font-black text-white outline outline-2 outline-white">5</span>
          </Link>

          {/* Search */}
          <Link 
            href="/search" 
            className="hover:opacity-70 transition-opacity active:scale-95 duration-100 flex items-center justify-center w-8 h-8"
          >
            <span className="material-symbols-outlined text-on-surface !text-[22px]" data-icon="search">search</span>
          </Link>
        </div>

        {/* Vertical Divider */}
        <div className="h-6 w-[1px] bg-outline-variant/20 mx-2"></div>

        {/* Location Group - Interactive */}
        <button 
          onClick={toggleSelector}
          className="flex flex-col justify-center items-end hover:opacity-70 transition-opacity active:scale-95 duration-100"
        >
          <span className="font-label text-[9px] font-black tracking-widest text-on-surface/30 uppercase leading-none">
            {location.country}
          </span>
          <span className="font-label text-[13px] font-black leading-none text-primary flex items-center gap-0.5 mt-1 uppercase">
            {location.city}{location.zone ? ` · ${location.zone}` : ''}
            <span className="material-symbols-outlined !text-[18px] leading-none text-primary" data-icon="expand_more">expand_more</span>
          </span>
        </button>

        {/* Profile Button */}
        <div className="ml-3">
          <button 
            onClick={() => {
              if (user && profile?.isRegistered) {
                // Navigate to my info
              } else {
                setShowLogin(true);
              }
            }}
            className="flex items-center justify-center p-0.5 rounded-full hover:bg-gray-100 transition-colors outline-none"
          >
            {/* ONLY show photo if isRegistered is true */}
            {user && profile?.isRegistered && (profile.photoURL || user.photoURL) ? (
              <img src={profile.photoURL || user.photoURL || ''} alt="Profile" className="w-8 h-8 rounded-full" />
            ) : (
              <span className="material-symbols-outlined text-gray-400 !text-2xl">account_circle</span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
