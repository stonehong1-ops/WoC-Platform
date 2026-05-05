'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';

const navItems = [
  { label: 'common.nav_home', icon: '🏠', path: '/' },
  { label: 'common.nav_search', icon: '🔍', path: '#' },
  { label: 'common.nav_post', icon: '➕', path: '#' },
  { label: 'common.nav_activity', icon: '🔔', path: '#' },
  { label: 'common.nav_profile', icon: '👤', path: '#' },
];

export default function BottomNavigation() {
  const pathname = usePathname();
  const { t } = useLanguage();

  return (
    <nav className="bottom-nav">
      {navItems.map((item) => (
        <Link 
          key={item.label} 
          href={item.path} 
          className={`nav-item ${pathname === item.path ? 'active' : ''}`}
        >
          <span className="nav-icon">{item.icon}</span>
          <span className="nav-label">{t(item.label)}</span>
        </Link>
      ))}
    </nav>
  );
}
