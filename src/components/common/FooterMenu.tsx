'use client';

import React, { useRef, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NAV_ITEMS, NavGroup } from '@/lib/constants/navigation';
import { cn } from '@/lib/utils'; // Assuming basic cn utility
import { useAuth } from '@/components/providers/AuthProvider';
import { notificationService } from '@/lib/firebase/notificationService';

export default function FooterMenu() {
  const pathname = usePathname();
  const scrollRef = useRef<HTMLDivElement>(null);
  const { profile } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!profile?.uid) return;
    
    const unsubscribe = notificationService.subscribeToUserNotifications(profile.uid, (notifications) => {
      const unread = notifications.filter(n => !n.isRead).length;
      setUnreadCount(unread);
    });

    return () => unsubscribe();
  }, [profile?.uid]);

  // Group items for rendering labels
  const sectors: { name: NavGroup; items: typeof NAV_ITEMS }[] = [
    { name: 'Tango World', items: NAV_ITEMS.filter(i => i.group === 'Tango World') },
    { name: 'Activity', items: NAV_ITEMS.filter(i => i.group === 'Activity') },
    { name: 'Space', items: NAV_ITEMS.filter(i => i.group === 'Space') },
    { name: 'My Page', items: NAV_ITEMS.filter(i => i.group === 'My Page') },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-gray-100 z-50">
      <div 
        ref={scrollRef}
        className="overflow-x-auto flex items-end px-4 h-[72px] no-scrollbar gap-6 scroll-smooth"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {sectors.map((sector, sIdx) => (
          <div key={sector.name} className="flex flex-col h-full justify-between py-2 shrink-0">
            {/* Sector Label - Now on Top */}
            <span className="text-[9px] font-black text-on-surface/20 uppercase tracking-[0.2em] whitespace-nowrap pt-1">
              {sector.name}
            </span>
            
            {/* Items Group */}
            <div className="flex gap-1 items-center pb-1">
              {sector.items.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                const showBadge = item.id === 'profile' && unreadCount > 0;
                
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    className={cn(
                      "flex flex-col items-center justify-center min-w-[56px] h-[40px] rounded-2xl transition-all duration-200 relative",
                      isActive 
                        ? "text-primary bg-primary/5 font-bold" 
                        : "text-on-surface/40 hover:text-on-surface hover:bg-surface-container-low"
                    )}
                  >
                    <div className="relative">
                      <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                      {showBadge && (
                        <span className="absolute -top-1.5 -right-2 flex items-center justify-center min-w-[16px] h-[16px] px-[4px] text-[9px] font-bold text-white bg-red-500 rounded-full border-[1.5px] border-white z-10 shadow-sm">
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] mt-0.5 tracking-tight">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
        {/* Padding for end of scroll */}
        <div className="min-w-[20px] shrink-0" />
      </div>
      
      {/* Scroll indicator gradient - optional but helpful */}
      <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent pointer-events-none opacity-40" />
    </nav>
  );
}
