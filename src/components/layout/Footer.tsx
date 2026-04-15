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
    <footer className="fixed bottom-0 left-0 w-full z-50 bg-white border-t border-gray-100 shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
      {/* Integrated Scrollable Menu System */}
      <div className="overflow-x-auto no-scrollbar scroll-smooth">
        <div className="flex items-stretch divide-x divide-gray-100 min-w-max">
          
          {/* TANGO WORLD PARTITION */}
          <div className="flex flex-col px-3.5 py-2.5 flex-shrink-0">
            <div className="flex items-center gap-1.5 mb-2">
              <p className="text-[10px] font-black tracking-wider uppercase">
                <span className="text-primary italic">TANGO</span>
                <span className="text-gray-400 ml-1 text-[8px]">WORLD</span>
              </p>
            </div>
            <div className="flex gap-1.5 items-center">
              <NavItem href="/home" icon="home" label="HOME" active={isActive('/home')} />
              <NavItem href="/plaza" icon="layers" label="PLAZA" active={isActive('/plaza')} />
              <NavItem href="/venues" icon="location_on" label="VENUES" active={isActive('/venues')} />
              <NavItem href="/groups" icon="group" label="GROUPS" active={isActive('/groups')} />
            </div>
          </div>

          {/* ACTIVITY PARTITION */}
          <div className="flex flex-col px-3.5 py-2.5 flex-shrink-0">
            <div className="flex items-center gap-1.5 mb-2">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">ACTIVITY</p>
            </div>
            <div className="flex gap-1.5 items-center">
              <NavItem href="/social" icon="nightlife" label="SOCIAL" active={isActive('/social')} />
              <NavItem href="/class" icon="school" label="CLASS" active={isActive('/class')} />
              <NavItem href="/events" icon="event" label="EVENTS" active={isActive('/events')} />
              <NavItem href="/shop" icon="storefront" label="SHOP" active={isActive('/shop')} />
              <NavItem href="/stay" icon="bed" label="STAY" active={isActive('/stay')} />
              <NavItem href="/service" icon="medical_services" label="SERVICE" active={isActive('/service')} />
            </div>
          </div>

          {/* TOWN PARTITION */}
          <div className="flex flex-col px-3.5 py-2.5 flex-shrink-0">
            <div className="flex items-center gap-1.5 mb-2">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">TOWN</p>
            </div>
            <div className="flex gap-1.5 items-center">
              <NavItem href="/resale" icon="shopping_bag" label="RESALE" active={isActive('/resale')} />
              <NavItem href="/lost" icon="find_in_page" label="L&F" active={isActive('/lost')} />
              <NavItem href="/arcade" icon="videogame_asset" label="ARCADE" active={isActive('/arcade')} />
            </div>
          </div>

          {/* MY PARTITION */}
          <div className="flex flex-col px-3.5 py-2.5 flex-shrink-0">
            <div className="flex items-center gap-1.5 mb-2">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">MY</p>
            </div>
            <div className="flex gap-1.5 items-center">
              <NavItem href="/wallet" icon="account_balance_wallet" label="WALLET" active={isActive('/wallet')} />
              <NavItem href="/history" icon="history" label="HISTORY" active={isActive('/history')} />
              <NavItem href="/my-info" icon="manage_accounts" label="MY INFO" active={isActive('/my-info')} />
            </div>
          </div>

          {/* ADMIN PARTITION */}
          <div className="flex flex-col px-3.5 py-2.5 flex-shrink-0 pr-12">
            <div className="flex items-center gap-1.5 mb-2">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">ADMIN</p>
            </div>
            <div className="flex gap-1.5 items-center">
              <NavItem href="/admin/people" icon="person_search" label="PEOPLE" active={isActive('/admin/people')} />
              <NavItem href="/admin/place" icon="location_city" label="PLACE" active={isActive('/admin/place')} />
              <NavItem href="/admin/others" icon="more_horiz" label="OTHERS" active={isActive('/admin/others')} />
            </div>
          </div>

        </div>
      </div>
    </footer>
  );
}

function NavItem({ href, icon, label, active }: { href: string; icon: string; label: string; active: boolean }) {
  return (
    <Link 
      href={href}
      className={`flex items-center gap-1 px-2 py-1.5 text-[11px] font-extrabold transition-all rounded-full whitespace-nowrap ${
        active 
          ? 'bg-primary/10 text-primary shadow-sm' 
          : 'text-gray-500 hover:text-primary hover:bg-gray-50'
      }`}
    >
      <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0" }}>
        {icon}
      </span>
      {label}
    </Link>
  );
}
