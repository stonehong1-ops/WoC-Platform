'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { label: '홈', icon: '🏠', path: '/' },
  { label: '검색', icon: '🔍', path: '#' },
  { label: '게시', icon: '➕', path: '#' },
  { label: '활동', icon: '🔔', path: '#' },
  { label: '프로필', icon: '👤', path: '#' },
];

export default function BottomNavigation() {
  const pathname = usePathname();

  return (
    <nav className="bottom-nav">
      {navItems.map((item) => (
        <Link 
          key={item.label} 
          href={item.path} 
          className={`nav-item ${pathname === item.path ? 'active' : ''}`}
        >
          <span className="nav-icon">{item.icon}</span>
          <span className="nav-label">{item.label}</span>
        </Link>
      ))}
    </nav>
  );
}
