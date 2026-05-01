'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';

export default function Footer() {
  const pathname = usePathname();
  const { profile } = useAuth();

  // Hide on landing page, login page, stay detail, and space detail pages
  if (pathname === '/' || pathname === '/login' || (pathname.startsWith('/stay/') && pathname !== '/stay') || pathname?.startsWith('/group/')) return null;

  const isActive = (href: string) => pathname === href;

  return (
    <footer className="fixed bottom-0 left-0 w-full z-50 bg-white shadow-[0_-8px_30px_rgb(0,0,0,0.04)] pt-[12px] pb-[32px] flex flex-col justify-end">
      {/* Integrated Scrollable Menu System */}
      <div className="overflow-x-auto no-scrollbar scroll-smooth">
        <div className="flex items-stretch min-w-max px-4 gap-4">
          
          {/* 1. TANGO WORLD PARTITION */}
          <Section label={<><span className="text-primary">TANGO</span> WORLD</>}>
            <NavItem href="/plaza" icon="forum" label="PLAZA" active={isActive('/plaza')} />
            <NavItem href="/home" icon="home" label="HOME" active={isActive('/home')} />
            <NavItem href="/venues" icon="location_on" label="MAP" active={isActive('/venues')} />
            <NavItem href="/arcade" icon="videogame_asset" label="ARCADE" active={isActive('/arcade')} />
            <NavItem href="/explore" icon="explore" label="EXPLORE" active={isActive('/explore')} />
          </Section>

          <div className="w-[1px] bg-gray-200/60 my-1.5" />

          {/* 2. ACTIVITY PARTITION */}
          <Section label="Activity">
            <NavItem href="/social" icon="nightlife" label="SOCIAL" active={isActive('/social')} />
            <NavItem href="/gallery" icon="photo_library" label="GALLERY" active={isActive('/gallery')} />
            <NavItem href="/events" icon="event" label="EVENTS" active={isActive('/events')} />
            <NavItem href="/class" icon="school" label="CLASS" active={isActive('/class')} />
            <NavItem href="/groups" icon="groups" label="GROUP" active={isActive('/groups')} />
          </Section>

          <div className="w-[1px] bg-gray-200/60 my-1.5" />

          {/* 3. TOWN PARTITION */}
          <Section label="Town">
            <NavItem href="/resale" icon="shopping_bag" label="RESALE" active={isActive('/resale')} />
            <NavItem href="/rental" icon="handshake" label="RENTAL" active={isActive('/rental')} />
            <NavItem href="/lost-found" icon="find_in_page" label="LOST" active={isActive('/lost-found')} />
          </Section>

          <div className="w-[1px] bg-gray-200/60 my-1.5" />

          {/* 4. MY PARTITION */}
          <Section label="My" isLast={!profile?.isAdmin}>
            <NavItem href="/my-info" icon="manage_accounts" label="MY INFO" active={isActive('/my-info')} />
            <NavItem href="/wallet" icon="account_balance_wallet" label="WALLET" active={isActive('/wallet')} />
            <NavItem href="/history" icon="history" label="HISTORY" active={isActive('/history')} />
          </Section>

          {profile?.isAdmin && <div className="w-[1px] bg-gray-200/60 my-1.5" />}

          {/* 5. ADMIN PARTITION */}
          {profile?.isAdmin && (
            <Section label="Admin" isLast>
              <NavItem href="/admin/people" icon="person_search" label="PEOPLE" active={isActive('/admin/people')} />
              <NavItem href="/admin/place" icon="location_city" label="PLACE" active={isActive('/admin/place')} />
              <NavItem href="/admin/others" icon="more_horiz" label="OTHERS" active={isActive('/admin/others')} />
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
