'use client';

import React, { useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NAV_ITEMS, NavGroup } from '@/lib/constants/navigation';
import { cn } from '@/lib/utils'; // Assuming basic cn utility

export default function FooterMenu() {
  const pathname = usePathname();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Group items for rendering labels
  const sectors: { name: NavGroup; items: typeof NAV_ITEMS }[] = [
    { name: 'World', items: NAV_ITEMS.filter(i => i.group === 'World') },
    { name: 'Tango Korea', items: NAV_ITEMS.filter(i => i.group === 'Tango Korea') },
    { name: 'Town', items: NAV_ITEMS.filter(i => i.group === 'Town') },
    { name: 'My Page', items: NAV_ITEMS.filter(i => i.group === 'My Page') },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-[64px] bg-background/60 backdrop-blur-xl border-t border-glass-border z-50 overflow-hidden">
      <div 
        ref={scrollRef}
        className="h-full overflow-x-auto flex items-center px-4 no-scrollbar gap-0 scroll-smooth"
      >
        {sectors.map((sector, sIdx) => (
          <div key={sector.name} className="flex h-full items-center">
            {/* Sector Section */}
            <div className="flex flex-col items-center px-1">
              <span className="text-[8px] font-bold text-muted-foreground/50 uppercase tracking-widest whitespace-nowrap mb-1">
                {sector.name}
              </span>
              <div className="flex gap-0.5">
                {sector.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  
                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      className={cn(
                        "flex flex-col items-center justify-center min-w-[52px] h-[40px] rounded-lg transition-all duration-300",
                        isActive 
                          ? "text-primary bg-primary/10 shadow-[0_0_15px_rgba(var(--primary-rgb),0.1)]" 
                          : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                      )}
                    >
                      <Icon size={18} strokeWidth={isActive ? 2.5 : 2} className={cn("transition-transform", isActive && "scale-110")} />
                      <span className="text-[9px] font-semibold mt-0.5">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
            
            {/* Elegant Divider */}
            {sIdx < sectors.length - 1 && (
              <div className="h-8 w-[1px] bg-gradient-to-b from-transparent via-glass-border to-transparent mx-2 self-center opacity-50" />
            )}
          </div>
        ))}
        {/* Padding for end of scroll */}
        <div className="min-w-[16px] h-full" />
      </div>
      
      {/* Scroll indicator gradient - optional but helpful */}
      <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent pointer-events-none opacity-40" />
    </nav>
  );
}
