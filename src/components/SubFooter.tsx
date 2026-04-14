import React from 'react';
import Link from 'next/link';

const menus = [
  'Social', 'Map', 'Shop', 'Play', 'News', 'Talk', 'Wiki', 'Tool', 'Job', 'Event', 'Vote', 'Fund', 'More'
];

export default function SubFooter() {
  return (
    <footer className="bg-surface-container-lowest border-t border-outline-variant/30 py-12 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-12">
          {menus.map((menu) => (
            <Link
              key={menu}
              href={`/${menu.toLowerCase()}`}
              className="text-[11px] font-bold tracking-widest uppercase text-on-surface hover:text-primary transition-colors py-2"
            >
              {menu}
            </Link>
          ))}
          {/* HUB button to return home */}
          <Link
            href="/"
            className="text-[11px] font-black tracking-[0.2em] uppercase text-primary border-2 border-primary rounded-full px-6 py-2 text-center hover:bg-primary hover:text-on-primary transition-all col-span-2 md:col-span-1"
          >
            HUB
          </Link>
        </div>
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pt-8 border-t border-outline-variant/20">
          <div className="space-y-1">
            <p className="text-[10px] font-bold tracking-widest uppercase text-on-surface">WORLD OF COMMUNITY_</p>
            <p className="text-[9px] font-medium tracking-widest uppercase text-on-surface-variant/60">Digital Editorial Archive © 2024</p>
          </div>
          <div className="flex gap-6 uppercase text-[9px] font-bold tracking-[0.15em] text-on-surface-variant">
            <a href="#" className="hover:text-primary">About</a>
            <a href="#" className="hover:text-primary">Archive</a>
            <a href="#" className="hover:text-primary">Editorial</a>
            <a href="#" className="hover:text-primary">Legal</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
