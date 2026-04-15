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
    <footer className="fixed bottom-0 left-0 w-full z-50 bg-white border-t border-gray-100 px-4 py-2 flex items-center justify-between h-[64px]">
      {/* Left: Branding */}
      <div className="flex flex-col shrink-0">
        <p className="text-[10px] font-black tracking-wider uppercase leading-none">
          <span className="text-primary italic">TANGO</span>
        </p>
        <p className="text-[8px] font-black text-gray-400 uppercase tracking-tighter mt-0.5">
          WORLD
        </p>
      </div>

      {/* Center: Main Navigation */}
      <nav className="flex items-center gap-1">
        <NavItem href="/home" icon="home" label="HOME" active={isActive('/home')} />
        <NavItem href="/plaza" icon="layers" label="PLAZA" active={isActive('/plaza')} />
        <NavItem href="/venues" icon="location_on" label="VENUES" active={isActive('/venues')} />
        <NavItem href="/groups" icon="group" label="GROUPS" active={isActive('/groups')} />
      </nav>

      {/* Right: Activity Label & Icon */}
      <div className="flex flex-col items-end shrink-0 opacity-40">
        <p className="text-[9px] font-black text-gray-900 uppercase tracking-widest leading-none mb-1">
          ACTIVITY
        </p>
        <span className="material-symbols-outlined text-[18px]">split_scene</span>
      </div>
    </footer>
  );
}

function NavItem({ href, icon, label, active }: { href: string; icon: string; label: string; active: boolean }) {
  return (
    <Link 
      href={href}
      className={`flex items-center gap-1.5 px-3 py-2 transition-all rounded-full ${
        active 
          ? 'bg-primary/10 text-primary shadow-sm' 
          : 'text-gray-400 hover:text-primary'
      }`}
    >
      <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0" }}>
        {icon}
      </span>
      <span className="text-[10px] font-black tracking-tight">{label}</span>
    </Link>
  );
}
