'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { stayService } from '@/lib/firebase/stayService';
import { useAuth } from '@/components/providers/AuthProvider';
import { Stay, StayLike } from '@/types/stay';
import StayWishlistTray from '@/components/stay/StayWishlistTray';
import { useRouter } from 'next/navigation';

type SortOption = 'latest' | 'popular' | 'price_asc' | 'price_desc';

const SORT_OPTIONS: { key: SortOption; label: string; icon: string }[] = [
  { key: 'latest', label: 'Latest', icon: 'schedule' },
  { key: 'popular', label: 'Popular', icon: 'trending_up' },
  { key: 'price_asc', label: 'Price ↑', icon: 'arrow_upward' },
  { key: 'price_desc', label: 'Price ↓', icon: 'arrow_downward' },
];

const STAY_FILTER_DEFS: Record<string, { label: string; fullLabel?: string }> = {
  all: { label: 'All', fullLabel: 'All' },
  '1-Room': { label: '1-Room', fullLabel: '1-Room' },
  '2-Room': { label: '2-Room', fullLabel: '2-Room' },
  '3-Room': { label: '3-Room', fullLabel: '3-Room' },
  'Pension': { label: 'Pension', fullLabel: 'Pension' },
  'Dormitory': { label: 'Dormitory', fullLabel: 'Dormitory' },
  'Couchsurfing': { label: 'Couch', fullLabel: 'Couchsurfing' },
};

const STAY_FILTER_KEYS = ['all', '1-Room', '2-Room', '3-Room', 'Dormitory', 'Couchsurfing', 'Pension'];

export default function StayPage() {
  const [stays, setStays] = useState<Stay[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [showLocationFilter, setShowLocationFilter] = useState(false);
  const [sortOption, setSortOption] = useState<SortOption>('latest');
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  
  const { user, setShowLogin } = useAuth();
  const [likes, setLikes] = useState<StayLike[]>([]);
  const [likedStayIds, setLikedStayIds] = useState<Set<string>>(new Set());
  const router = useRouter();

  const stayFilters = useMemo(() => {
    return STAY_FILTER_KEYS.map(key => ({ key, ...STAY_FILTER_DEFS[key] }));
  }, []);

  useEffect(() => {
    const unsub = stayService.subscribeActiveStays(null, (data) => {
      setStays(data);
      setIsLoading(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (user) {
      const unsub = stayService.subscribeMyLikes(user.uid, (data) => {
        setLikes(data);
        setLikedStayIds(new Set(data.map(l => l.stayId)));
      });
      return () => unsub();
    } else {
      setLikes([]);
      setLikedStayIds(new Set());
    }
  }, [user]);

  const toggleLike = async (e: React.MouseEvent, stayId: string) => {
    e.preventDefault();
    if (!user) {
      setShowLogin(true);
      return;
    }
    const isLiking = !likedStayIds.has(stayId);
    
    // Optimistic update
    setLikedStayIds(prev => {
      const newSet = new Set(prev);
      if (isLiking) newSet.add(stayId);
      else newSet.delete(stayId);
      return newSet;
    });

    try {
      await stayService.toggleLike(user.uid, stayId);
    } catch (error) {
      console.error("Failed to toggle like:", error);
      // Revert optimistic update
      setLikedStayIds(prev => {
        const newSet = new Set(prev);
        if (isLiking) newSet.delete(stayId);
        else newSet.add(stayId);
        return newSet;
      });
    }
  };

  const filtered = useMemo(() => {
    let result = stays.filter(s => {
      const matchSearch = !searchQuery ||
        s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.location?.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.location?.city?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchType = activeFilter === 'all' || s.type === activeFilter || (activeFilter === 'Couchsurfing' && s.type === 'Couchsurfing');
      return matchSearch && matchType;
    });

    switch (sortOption) {
      case 'popular':
        result.sort((a, b) => (b.likesCount || 0) - (a.likesCount || 0));
        break;
      case 'price_asc':
        result.sort((a, b) => (a.pricing?.baseRate || 0) - (b.pricing?.baseRate || 0));
        break;
      case 'price_desc':
        result.sort((a, b) => (b.pricing?.baseRate || 0) - (a.pricing?.baseRate || 0));
        break;
      case 'latest':
      default:
        result.sort((a, b) => {
          const timeA = typeof a.createdAt === 'object' && a.createdAt !== null && 'seconds' in a.createdAt ? (a.createdAt as any).seconds : 0;
          const timeB = typeof b.createdAt === 'object' && b.createdAt !== null && 'seconds' in b.createdAt ? (b.createdAt as any).seconds : 0;
          return timeB - timeA;
        });
        break;
    }
    return result;
  }, [stays, activeFilter, searchQuery, sortOption]);

  const formatPrice = (stay: Stay) => {
    const rate = stay.pricing?.baseRate || 0;
    const currency = stay.pricing?.currency || 'KRW';
    const symbol = currency === 'KRW' ? '₩' : '$';
    return `${symbol}${rate.toLocaleString()}`;
  };

  return (
    <main className="max-w-md mx-auto w-full relative min-h-screen bg-[#FAF8FF]">
      <style dangerouslySetInnerHTML={{ __html: `
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .material-symbols-rounded { font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24; }
      `}} />

      {/* Filter & Sort Bar (Shop pattern) */}
      <div className="w-full bg-[#FAF8FF] border-b border-slate-100/50 px-3 py-2 flex flex-col gap-3">
        {/* Scrollable Tabs (Shop pattern — no icons, rounded-lg, small) */}
        <div className="w-full flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {stayFilters.map((filter) => (
            <button
              key={filter.key}
              onClick={() => setActiveFilter(filter.key)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-[12px] font-bold tracking-wide transition-all whitespace-nowrap ${
                activeFilter === filter.key
                  ? 'bg-[#1E293B] text-white shadow-sm'
                  : 'bg-slate-50 text-slate-500 border border-slate-100 hover:bg-slate-100'
              }`}
            >
              {filter.fullLabel || filter.label}
            </button>
          ))}
        </div>
        
        {/* Bottom Actions — items count + Sort (Shop pattern) */}
        <div className="w-full flex items-center justify-between px-1">
          <div className="text-[11px] font-medium text-[#007AFF]">
            {filtered.length} items
          </div>
          
          <div className="flex items-center gap-4">
            {/* Sort Trigger (Shop pattern) */}
            <button 
              onClick={() => setShowSortDropdown(!showSortDropdown)}
              className="flex items-center gap-0.5 text-[12px] font-bold text-slate-600 hover:text-slate-800 transition-all"
            >
              {SORT_OPTIONS.find(o => o.key === sortOption)?.label || 'Sort'}
              <span className="material-symbols-outlined text-[14px]">expand_more</span>
            </button>
          </div>
        </div>
      </div>

      {/* Sort Options Modal/Dropdown (Shop pattern) */}
      {showSortDropdown && (
        <div className="absolute top-[90px] right-4 z-40 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 min-w-[160px] animate-in fade-in slide-in-from-top-2 duration-300">
          {SORT_OPTIONS.map(opt => (
            <button
              key={opt.key}
              onClick={() => {
                setSortOption(opt.key);
                setShowSortDropdown(false);
              }}
              className={`w-full px-4 py-2.5 flex items-center gap-3 hover:bg-slate-50 transition-colors text-left ${
                sortOption === opt.key ? 'text-blue-600 font-bold' : 'text-slate-600 font-medium'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">{opt.icon}</span>
              <span className="text-[13px]">{opt.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* ④ Stay Grid (필터+정렬 결과) */}
      <div className="pt-4 px-4 mb-10 text-left min-h-[400px]">


        {isLoading ? (
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="animate-pulse">
                <div className="aspect-square rounded-xl bg-[#f2f4f4] mb-3" />
                <div className="h-3 bg-[#e8eaec] rounded w-1/2 mb-2" />
                <div className="h-4 bg-[#f2f4f4] rounded w-3/4 mb-2" />
                <div className="h-4 bg-[#e8eaec] rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center opacity-30">
            <span className="material-symbols-rounded text-6xl mb-4">bed</span>
            <p className="text-xs font-black uppercase tracking-widest">
              No stays found
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {filtered.map(stay => {
              const locationStr = stay.location?.city && stay.location?.district 
              ? `${stay.location.city}, ${stay.location.district}` 
              : stay.location?.city || stay.location?.address || 'Location';

              return (
                <Link key={stay.id} href={`/stay/${stay.id}`} className="group cursor-pointer animate-in fade-in slide-in-from-bottom-2 duration-500 block">
                  <div className="relative aspect-square rounded-xl bg-[#f2f4f4] overflow-hidden mb-3">
                    {/* Fallback View */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-[#c4cacc]">
                      <span className="material-symbols-outlined text-4xl mb-1">bed</span>
                      <span className="text-[10px] font-bold tracking-wider uppercase">No Image</span>
                    </div>
                    
                    {/* Actual Image */}
                    {stay.images?.[0] && (
                      <img
                        alt={stay.title}
                        className="absolute inset-0 z-10 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 bg-[#f2f4f4]"
                        src={stay.images[0]}
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    )}
                    
                    <button
                      onClick={(e) => toggleLike(e, stay.id)}
                      className={`absolute z-20 top-3 right-3 w-8 h-8 backdrop-blur rounded-full flex items-center justify-center shadow-sm transition-colors active:scale-90 ${
                        likedStayIds.has(stay.id) ? 'bg-red-50 text-red-500' : 'bg-white/90 text-[#2d3435] hover:text-red-500'
                      }`}
                    >
                      <span className="material-symbols-rounded text-lg" style={{ fontVariationSettings: likedStayIds.has(stay.id) ? "'FILL' 1" : "'FILL' 0" }}>favorite</span>
                    </button>
                  </div>
                  
                  <div className="px-1">
                    <p className="text-[10px] font-bold text-[#5c5f62] uppercase tracking-tighter font-label truncate">{locationStr}</p>
                    <h4 className="text-sm font-semibold text-[#2d3435] font-body truncate">{stay.title}</h4>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-bold text-[#2d3435] font-headline">
                        {formatPrice(stay)}
                      </span>
                      <span className="text-[10px] text-[#596061] mt-[2px]">/ night</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {user && (
        <StayWishlistTray 
          likes={likes} 
          userId={user.uid} 
          onStayClick={(id) => router.push(`/stay/${id}`)} 
        />
      )}
    </main>
  );
}
