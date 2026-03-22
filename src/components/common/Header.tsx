'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { NAV_ITEMS } from '@/lib/constants/navigation';
import { Bell, MessageCircle, Search, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Header() {
  const pathname = usePathname();
  
  // Find current nav item label for title
  const currentItem = NAV_ITEMS.find(item => item.href === pathname);
  const title = currentItem ? currentItem.label : 'WoC';

  return (
    <header className="fixed top-0 left-0 right-0 h-[56px] bg-background/60 backdrop-blur-xl border-b border-glass-border z-50 flex items-center justify-between px-4">
      <div className="flex items-center gap-3">
        {/* Logo Mockup */}
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
          <span className="text-primary font-black text-lg">N</span>
        </div>
        <h1 className="text-lg font-bold tracking-tight">{title}</h1>
      </div>
      
      <div className="flex items-center gap-1 text-muted-foreground mr-1">
        <button 
          onClick={() => window.dispatchEvent(new CustomEvent('woc:compose:open', { detail: { id: pathname.split('/')[1] || 'default' } }))}
          className="p-2 text-foreground active:scale-95 transition-all"
          title="추가"
        >
          <Plus size={24} strokeWidth={2} />
        </button>
        <button className="p-2 hover:bg-black/5 rounded-full transition-colors">
          <Bell size={20} />
        </button>
        <button className="p-2 hover:bg-black/5 rounded-full transition-colors hidden sm:block">
          <MessageCircle size={20} />
        </button>
        <button className="p-2 hover:bg-black/5 rounded-full transition-colors text-foreground">
          <Search size={22} />
        </button>
      </div>
    </header>
  );
}
