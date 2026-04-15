'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Footer() {
  const pathname = usePathname();

  // Hide on landing page and login page
  if (pathname === '/' || pathname === '/login') return null;

  const isActive = (href: string) => pathname === href;

  return (
    <footer className="fixed bottom-0 left-0 w-full z-50 bg-white shadow-[0_-8px_30px_rgb(0,0,0,0.04)] h-[72px] flex flex-col justify-end pb-1.5">
      {/* Integrated Scrollable Menu System */}
      <div className="overflow-x-auto no-scrollbar scroll-smooth">
        <div className="flex items-stretch min-w-max px-4 gap-6">
          
          {/* 1. TANGO WORLD PARTITION */}
          <Section label={<><span className="text-primary">TANGO</span> WORLD</>}>
            <NavItem href="/home" icon="home" label="HOME" active={isActive('/home')} />
            <NavItem href="/plaza" icon="layers" label="PLAZA" active={isActive('/plaza')} />
            <NavItem href="/venues" icon="location_on" label="VENUES" active={isActive('/venues')} />
            <NavItem href="/groups" icon="group" label="GROUPS" active={isActive('/groups')} />
          </Section>

          {/* 2. ACTIVITY PARTITION */}
          <Section label="Activity">
            <NavItem href="/social" icon="nightlife" label="SOCIAL" active={isActive('/social')} />
            <NavItem href="/class" icon="school" label="CLASS" active={isActive('/class')} />
            <NavItem href="/events" icon="event" label="EVENTS" active={isActive('/events')} />
            <NavItem href="/shop" icon="storefront" label="SHOP" active={isActive('/shop')} />
            <NavItem href="/stay" icon="bed" label="STAY" active={isActive('/stay')} />
            <NavItem href="/service" icon="medical_services" label="SERVICE" active={isActive('/service')} />
          </Section>

          {/* 3. TOWN PARTITION */}
          <Section label="Town">
            <NavItem href="/resale" icon="shopping_bag" label="RESALE" active={isActive('/resale')} />
            <NavItem href="/lost" icon="find_in_page" label="LOST" active={isActive('/lost')} />
            <NavItem href="/arcade" icon="videogame_asset" label="ARCADE" active={isActive('/arcade')} />
          </Section>

          {/* 4. MY PARTITION */}
          <Section label="My">
            <NavItem href="/wallet" icon="account_balance_wallet" label="WALLET" active={isActive('/wallet')} />
            <NavItem href="/history" icon="history" label="HISTORY" active={isActive('/history')} />
            <NavItem href="/my-info" icon="manage_accounts" label="MY INFO" active={isActive('/my-info')} />
          </Section>

          {/* 5. ADMIN PARTITION */}
          <Section label="Admin" isLast>
            <NavItem href="/admin/people" icon="person_search" label="PEOPLE" active={isActive('/admin/people')} />
            <NavItem href="/admin/place" icon="location_city" label="PLACE" active={isActive('/admin/place')} />
            <NavItem href="/admin/others" icon="more_horiz" label="OTHERS" active={isActive('/admin/others')} />
          </Section>

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
      className={`flex flex-col items-center gap-1 px-3 py-1 transition-all rounded whitespace-nowrap tracking-tight leading-none ${
        active 
          ? 'text-primary bg-primary/10 shadow-[0_0_10px_rgba(26,115,232,0.1)]' 
          : 'text-gray-400 hover:text-gray-900 hover:bg-gray-50'
      }`}
    >
      <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0" }}>
        {icon}
      </span>
      <span className="text-[9px] font-bold uppercase tracking-wider">{label}</span>
    </Link>
  );
}
