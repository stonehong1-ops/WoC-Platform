'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';

export default function Footer() {
  const pathname = usePathname();
  const { profile } = useAuth();

  // Hide on landing page, login page, stay detail, and space detail pages
  if (pathname === '/' || pathname === '/login' || (pathname.startsWith('/stay/') && pathname !== '/stay') || pathname?.startsWith('/groups/')) return null;

  const isActive = (href: string) => pathname === href;

  // Preserve society context across navigation
  const society = typeof window !== 'undefined' ? (new URLSearchParams(window.location.search).get('society') || sessionStorage.getItem('woc_society')) : null;
  const eventsHref = society ? `/events?society=${society}` : '/events';

  return (
    <footer className="fixed bottom-0 left-0 w-full z-50 bg-white shadow-[0_-8px_30px_rgb(0,0,0,0.04)] pt-[6px] pb-[16px] flex flex-col justify-end">
      {/* Integrated Scrollable Menu System */}
      <div className="overflow-x-auto no-scrollbar scroll-smooth">
        <div className="flex items-stretch min-w-max px-4 gap-4">
          
          {/* 1. WORLD PARTITION */}
          <Section label={<><span className="text-primary">WORLD</span></>}>
            <NavItem href="/home" icon="radio_button_unchecked" label="SOCIETY" active={isActive('/home')} />
            <NavItem href="/plaza" icon="quick_phrases" label="PLAZA" active={isActive('/plaza')} />
            <NavItem href="/venues" icon="map" label="MAP" active={isActive('/venues')} />
            <NavItem href="/people" icon="group" label="PEOPLE" active={isActive('/people')} />
          </Section>

          <div className="w-[1px] bg-gray-200/60 my-1.5" />

          {/* 2. MARKET PARTITION */}
          <Section label="Market">
            <NavItem href="/shop" icon="storefront" label="SHOP" active={isActive('/shop')} />
            <NavItem href="/resale" icon="cached" label="RESALE" active={isActive('/resale')} />
            <NavItem href="/rental" icon="key" label="RENTAL" active={isActive('/rental')} />
            <NavItem href="/stay" icon="bed" label="STAY" active={isActive('/stay')} />
          </Section>

          <div className="w-[1px] bg-gray-200/60 my-1.5" />

          {/* 3. NOW PARTITION */}
          <Section label="Now">
            <NavItem href="/social" icon="autoplay" label="SOCIAL" active={isActive('/social')} />
            <NavItem href="/live" icon="cinematic_blur" label="LIVE" active={isActive('/live')} />
            <NavItem href="/class" icon="school" label="CLASS" active={isActive('/class')} />
            <NavItem href={eventsHref} icon="calendar_today" label="EVENTS" active={isActive('/events')} />
          </Section>

          <div className="w-[1px] bg-gray-200/60 my-1.5" />

          {/* 4. LOUNGE PARTITION */}
          <Section label="Lounge">
            <NavItem href="/pics" icon="photo_library" label="PICS" active={isActive('/pics')} />
            <NavItem href="/lost" icon="find_in_page" label="LOST" active={isActive('/lost')} />
            <NavItem href="/hub" icon="airline_stops" label="HUB" active={isActive('/hub')} />
            <NavItem href="/explore" icon="explore" label="JUMP" active={isActive('/explore')} />
          </Section>

          <div className="w-[1px] bg-gray-200/60 my-1.5" />

          {/* 5. GROUPS PARTITION */}
          <Section label="Groups">
            <NavItem href="/groups" icon="groups" label="GROUPS" active={isActive('/groups')} />
          </Section>

          <div className="w-[1px] bg-gray-200/60 my-1.5" />

          {/* 6. MY PARTITION */}
          <Section label="My" isLast={!profile?.isAdmin}>
            <NavItem href="/history" icon="history" label="HISTORY" active={isActive('/history')} />
            <NavItem href="/wallet" icon="account_balance_wallet" label="WALLET" active={isActive('/wallet')} />
            <NavItem href="/profile" icon="manage_accounts" label="MY INFO" active={isActive('/profile')} />
          </Section>

          {profile?.isAdmin && <div className="w-[1px] bg-gray-200/60 my-1.5" />}

          {/* 7. ADMIN PARTITION */}
          {profile?.isAdmin && (
            <Section label="Admin" isLast>
              <NavItem href="/admin/people" icon="admin_panel_settings" label="PEOPLE" active={isActive('/admin/people')} />
              <NavItem href="/admin/banners" icon="view_carousel" label="BANNERS" active={isActive('/admin/banners')} />
              <NavItem href="/admin/pics" icon="wallpaper" label="PICs" active={isActive('/admin/pics')} />
            </Section>
          )}

        </div>
      </div>
    </footer>
  );
}

function Section({ label, children, isLast }: { label: React.ReactNode; children: React.ReactNode; isLast?: boolean }) {
  return (
    <div className={`flex flex-col flex-shrink-0 ${isLast ? 'pr-8' : ''}`}>
      <div className="px-1 mb-1.5 flex items-center gap-1.5 opacity-30">
        <span className="text-[8px] font-black tracking-[0.25em] uppercase text-black leading-none">{label}</span>
      </div>
      <div className="flex gap-1 items-center">
        {children}
      </div>
    </div>
  );
}

function NavItem({ href, icon, label, active }: { href: string; icon: string; label: string; active: boolean }) {
  return (
    <Link 
      href={href}
      className={`flex flex-col items-center gap-[2px] px-2 transition-all whitespace-nowrap tracking-tight leading-none ${
        active ? 'text-[#007AFF]' : 'text-gray-400 hover:text-gray-900'
      }`}
    >
      <div className="relative flex items-center justify-center w-[40px] h-[40px]">
        {active && (
          <div className="absolute inset-0 rounded-full" style={{ backgroundColor: 'rgba(0, 122, 255, 0.08)' }} />
        )}
        <span 
          className="material-symbols-outlined relative z-10" 
          style={{ 
            fontSize: '28px',
            fontVariationSettings: `'FILL' ${active ? 1 : 0}, 'wght' 400`
          }}
        >
          {icon}
        </span>
      </div>
      <span className="text-[9px] font-bold uppercase tracking-wider">{label}</span>
    </Link>
  );
}
