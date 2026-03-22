'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Plus, ChevronRight, Calendar } from 'lucide-react';
import { 
  HERO_BANNER, 
  TODAY_SOCIALS, 
  WEEKLY_SOCIALS, 
  SPECIAL_EVENTS 
} from '@/lib/constants/socialData';
import SocialCard from '@/components/social/SocialCard';
import RegionFilter from '@/components/social/RegionFilter';
import { cn } from '@/lib/utils';

export default function SocialPageClient() {
  const [region, setRegion] = useState('서울');

  // Persistence: Load region from localStorage on mount
  useEffect(() => {
    const savedRegion = localStorage.getItem('woc-preferred-region');
    if (savedRegion) {
      setRegion(savedRegion);
    }
  }, []);

  const handleRegionChange = (newRegion: string) => {
    setRegion(newRegion);
    localStorage.setItem('woc-preferred-region', newRegion);
  };

  return (
    <div className="animate-in pb-20">
      {/* 1. Single Hero Banner */}
      <section className="relative w-full aspect-[21/9] md:aspect-[3/1] overflow-hidden group">
        <Image 
          src={HERO_BANNER.imageUrl} 
          alt={HERO_BANNER.title}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-105"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        <div className="absolute bottom-6 left-6 right-6 text-white">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary mb-1">Featured Event</p>
          <h2 className="text-2xl font-black mb-1">{HERO_BANNER.title}</h2>
          <p className="text-xs text-white/70 font-medium">{HERO_BANNER.subtitle}</p>
          <div className="mt-4 flex items-center justify-between">
            <span className="text-[10px] text-white/50">{HERO_BANNER.organizer}</span>
            <Link 
              href={HERO_BANNER.href}
              className="px-4 py-1.5 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all"
            >
              상세보기
            </Link>
          </div>
        </div>
      </section>

      <div className="px-4 mt-6 space-y-8">
        {/* 2. Region Filter */}
        <RegionFilter currentRegion={region} onRegionChange={handleRegionChange} />

        {/* 3. 오늘 (Today) Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-black tracking-tight">오늘</h3>
              <span className="px-2 py-0.5 bg-accent/10 text-accent text-[10px] font-bold rounded-md">
                {TODAY_SOCIALS.length}
              </span>
            </div>
          </div>
          <div className="flex overflow-x-auto no-scrollbar gap-4 pb-2 -mx-1 px-1">
            {TODAY_SOCIALS.map((event) => (
              <SocialCard key={event.id} event={event} />
            ))}
          </div>
        </section>

        {/* 4. 이번 주 (This Week) Section - Refined to Day-by-Day Summary */}
        <section className="space-y-6">
          <div className="flex items-center justify-between border-b border-glass-border pb-2">
            <h3 className="text-lg font-black tracking-tight">이번 주</h3>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Weekly Overview</span>
          </div>
          
          <div className="space-y-8">
            {WEEKLY_SOCIALS.map((dayGroup) => (
              <div key={dayGroup.day} className="space-y-3">
                <div className="flex items-center gap-2 border-l-2 border-primary pl-3">
                  <span className="text-sm font-black text-foreground">{dayGroup.day}</span>
                  <span className="text-[10px] font-bold text-muted-foreground">
                    {dayGroup.events.length}개의 이벤트
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-1">
                  {dayGroup.events.slice(0, 5).map((event) => (
                    <SocialCard key={event.id} event={event} variant="line" />
                  ))}
                  {dayGroup.events.length > 5 && (
                    <button className="text-[10px] font-bold text-primary/60 hover:text-primary transition-colors py-2 text-center border-t border-glass-border">
                      {dayGroup.events.length - 5}개 더보기 <ChevronRight size={10} className="inline" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 5. 팝업 / 스페셜 Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black tracking-tight">팝업 / 스페셜</h3>
            <Link href="/social/all-specials" className="text-xs font-bold text-muted-foreground hover:text-primary transition-colors flex items-center gap-0.5">
              전체보기 <ChevronRight size={14} />
            </Link>
          </div>
          <div className="space-y-3">
            {SPECIAL_EVENTS.map((event) => (
              <SocialCard key={event.id} event={event} variant="large" />
            ))}
          </div>
        </section>
      </div>

      {/* Floating Action Button - Global Register Button */}
      <Link 
        href="/social/new" 
        className="fixed bottom-[84px] right-6 w-14 h-14 bg-primary text-white rounded-full shadow-2xl shadow-primary/40 flex items-center justify-center transition-transform hover:scale-110 active:scale-95 z-40"
        aria-label="Add Event"
      >
        <Plus size={28} strokeWidth={2.5} />
      </Link>

      {/* Contextual Info Bar Refined for Light Mode */}
      <div className="fixed bottom-[80px] left-6 right-6 hidden md:flex h-12 bg-white/90 text-foreground rounded-full items-center px-6 justify-between z-30 ring-1 ring-black/5 backdrop-blur-md shadow-lg">
        <div className="flex items-center gap-4">
          <span className="text-xs font-black text-primary">{region}</span>
          <div className="h-3 w-[1px] bg-white/20" />
          <span className="text-xs font-medium">03.23 (월요일)</span>
        </div>
        <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
          WoC Social System Active
        </div>
      </div>
    </div>
  );
}
