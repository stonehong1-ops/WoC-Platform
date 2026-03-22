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
            <Link href="/social/new" className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary/20 rounded-xl transition-colors">
              <Plus size={14} strokeWidth={3} />
              <span className="text-xs font-bold">등록</span>
            </Link>
          </div>
          <div className="flex overflow-x-auto no-scrollbar gap-4 pb-2 -mx-1 px-1">
            {TODAY_SOCIALS.map((event) => (
              <SocialCard key={event.id} event={event} />
            ))}
          </div>
        </section>

        {/* 4. 이번 주 (This Week) Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black tracking-tight">이번 주</h3>
            <Link href="/social/new" className="flex items-center gap-1.5 px-3 py-1.5 bg-glass-hover text-foreground/80 hover:bg-glass rounded-xl transition-colors border border-glass-border">
              <Plus size={14} />
              <span className="text-xs font-bold">등록</span>
            </Link>
          </div>
          <div className="space-y-4">
            {WEEKLY_SOCIALS.map((event) => (
              <div key={event.id} className="space-y-2">
                <div className="flex items-center gap-2 text-primary">
                  <Calendar size={14} />
                  <span className="text-xs font-black">{event.day}</span>
                  {event.day?.includes('내일') && (
                    <span className="text-[10px] font-bold text-accent">내일</span>
                  )}
                </div>
                <SocialCard event={event} variant="large" />
              </div>
            ))}
            {/* Pagination / More Dots Mockup */}
            <div className="flex justify-center gap-1.5 pt-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary" />
              <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30" />
              <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30" />
            </div>
          </div>
        </section>

        {/* 5. 팝업/스페셜 Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black tracking-tight">팝업 / 스페셜</h3>
            <Link href="/social/new" className="text-xs font-bold text-muted-foreground hover:text-primary transition-colors flex items-center gap-0.5">
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

      {/* Floating Action Button Refined */}
      <button className="fixed bottom-[84px] right-6 w-14 h-14 bg-primary text-white rounded-full shadow-2xl shadow-primary/40 flex items-center justify-center transition-transform hover:scale-110 active:scale-95 z-40">
        <Plus size={28} strokeWidth={2.5} />
      </button>

      {/* Contextual Info Bar Refined */}
      <div className="fixed bottom-[80px] left-6 right-6 hidden md:flex h-12 bg-black/90 text-white rounded-full items-center px-6 justify-between z-30 ring-1 ring-white/10 backdrop-blur-md">
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
