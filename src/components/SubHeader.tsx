import React from 'react';
import Link from 'next/link';

const menus = [
  'Social', 'Map', 'Shop', 'Play', 'News', 'Talk', 'Wiki', 'Tool', 'Job', 'Event', 'Vote', 'Fund', 'More'
];

export default function SubHeader() {
  return (
    <header className="fixed top-0 left-0 right-0 bg-white/90 backdrop-blur-md z-50 border-b border-outline-variant/30 h-14 flex items-center justify-between px-4">
      <div className="flex items-center gap-4 overflow-x-auto no-scrollbar py-2">
        {menus.map((menu) => (
          <Link
            key={menu}
            href={`/${menu.toLowerCase()}`}
            className="text-[10px] font-bold tracking-[0.2em] uppercase text-on-surface-variant hover:text-primary transition-colors whitespace-nowrap px-2 py-1"
          >
            {menu}
          </Link>
        ))}
      </div>
      <button className="p-2 ml-2 flex-shrink-0">
        <span className="material-symbols-outlined text-2xl text-on-surface">account_circle</span>
      </button>
    </header>
  );
}
