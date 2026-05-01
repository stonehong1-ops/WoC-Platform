'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { lostFoundService } from '@/lib/firebase/lostFoundService';
import { LostFoundItem, LostFoundLike, LostFoundType } from '@/types/lostFound';
import { useRouter } from 'next/navigation';

type SortOption = 'latest' | 'reward_desc' | 'popular';

const SORT_OPTIONS: { key: SortOption; label: string; icon: string }[] = [
  { key: 'latest', label: 'Latest', icon: 'schedule' },
  { key: 'reward_desc', label: 'Highest Reward', icon: 'payments' },
  { key: 'popular', label: 'Most Popular', icon: 'trending_up' },
];

const LF_FILTER_DEFS: Record<string, { label: string; fullLabel: string; icon: string; type?: LostFoundType }> = {
  all: { label: 'All', fullLabel: 'All Lost & Found', icon: 'list_alt' },
  lost: { label: 'Lost', fullLabel: 'Looking for... (LOST)', icon: 'search_off', type: 'LOST' },
  found: { label: 'Found', fullLabel: 'Looking for owner... (FOUND)', icon: 'wb_incandescent', type: 'FOUND' },
};

export default function LostFoundPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [allItems, setAllItems] = useState<LostFoundItem[]>([]);
  const [activeFilter, setActiveFilter] = useState('all');
  const [activeLocation, setActiveLocation] = useState('All');
  const [sortOption, setSortOption] = useState<SortOption>('latest');
  const [searchQuery, setSearchQuery] = useState('');
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [likes, setLikes] = useState<LostFoundLike[]>([]);
  const [togglingLike, setTogglingLike] = useState<string | null>(null);
  const [showLocationFilter, setShowLocationFilter] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  const lfFilters = useMemo(() => {
    return ['all', 'lost', 'found'].map(key => ({ key, ...LF_FILTER_DEFS[key] }));
  }, []);

  // 1. Subscribe to items
  useEffect(() => {
    const typeFilter = LF_FILTER_DEFS[activeFilter]?.type || 'ALL';
    const unsub = lostFoundService.subscribeItems(typeFilter, 'All', (data) => {
      setAllItems(data);
    });
    return () => unsub();
  }, [activeFilter]);

  // 2. Subscribe to my likes
  useEffect(() => {
    if (!user) return;
    const unsub = lostFoundService.subscribeMyLikes(user.uid, (likesData) => {
      setLikedIds(new Set(likesData.map(l => l.itemId)));
      setLikes(likesData);
    });
    return () => unsub();
  }, [user]);

  // 3. Dynamic locations from data
  const locations = useMemo(() => {
    const locs = Array.from(new Set(allItems.map(p => p.location).filter(Boolean)));
    return ['All', ...locs.sort()];
  }, [allItems]);

  // 4. Filter + Sort
  const filteredItems = useMemo(() => {
    let result = [...allItems];

    // Location filter
    if (activeLocation !== 'All') {
      result = result.filter(p => p.location === activeLocation);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p =>
        (p.title || '').toLowerCase().includes(q) ||
        (p.description || '').toLowerCase().includes(q) ||
        (p.location || '').toLowerCase().includes(q)
      );
    }

    switch (sortOption) {
      case 'popular':
        result.sort((a, b) => (b.likesCount || 0) - (a.likesCount || 0));
        break;
      case 'reward_desc':
        result.sort((a, b) => (b.reward || 0) - (a.reward || 0));
        break;
      case 'latest':
      default: 
        result.sort((a, b) => {
          const tA = a.createdAt?.toMillis?.() || 0;
          const tB = b.createdAt?.toMillis?.() || 0;
          return tB - tA;
        });
        break;
    }
    return result;
  }, [allItems, activeLocation, searchQuery, sortOption]);

  const handleToggleLike = async (e: React.MouseEvent, item: LostFoundItem) => {
    e.stopPropagation();
    e.preventDefault();
    if (!user) return alert("Login is required.");
    setTogglingLike(item.id);
    try { await lostFoundService.toggleLike(user.uid, item.id); } catch (err) { console.error('Failed to toggle like:', err); }
    setTogglingLike(null);
  };

  const handleCardClick = (id: string) => {
    router.push(`/lost-found/${id}`);
  };

  return (
    <main className="max-w-md mx-auto w-full relative">
      <style dangerouslySetInnerHTML={{ __html: `
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .material-symbols-rounded { font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24; }
      `}} />

      {/* ⑤ Items Grid */}
      <div className="mt-4 px-4 mb-10 text-left min-h-[400px]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-headline text-lg font-bold text-[#2d3435]">
            {LF_FILTER_DEFS[activeFilter]?.fullLabel}
            <span className="text-sm font-normal text-[#596061] ml-1">({filteredItems.length})</span>
          </h3>
          {/* Sort Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowSortDropdown(!showSortDropdown)}
              className="flex items-center gap-1 text-sm font-semibold text-[#596061] hover:text-[#2d3435] transition-colors"
            >
              {SORT_OPTIONS.find(o => o.key === sortOption)?.label || 'Latest'}
              <span className="material-symbols-rounded text-base">expand_more</span>
            </button>
            {showSortDropdown && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowSortDropdown(false)} />
                <div className="absolute top-full mt-1 right-0 bg-white rounded-xl shadow-xl border border-slate-100 min-w-[150px] z-50 overflow-hidden">
                  {SORT_OPTIONS.map(opt => (
                    <button
                      key={opt.key}
                      onClick={() => { setSortOption(opt.key); setShowSortDropdown(false); }}
                      className={`w-full text-left px-4 py-2.5 text-sm font-medium flex items-center gap-2 transition-colors ${
                        sortOption === opt.key ? 'bg-primary/10 text-[#1A73E8] font-bold' : 'text-[#2d3435] hover:bg-slate-50'
                      }`}
                    >
                      <span className="material-symbols-rounded text-base">{opt.icon}</span>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center opacity-30">
            <span className="material-symbols-rounded text-6xl mb-4">search_off</span>
            <p className="text-xs font-black uppercase tracking-widest">No items registered</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {filteredItems.map(item => (
              <div key={item.id} onClick={() => handleCardClick(item.id)} className="group cursor-pointer animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="relative aspect-square rounded-xl bg-[#f2f4f4] overflow-hidden mb-3 border border-slate-100">
                  {/* Fallback View */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-[#c4cacc]">
                    <span className="material-symbols-outlined text-4xl mb-1">help_outline</span>
                  </div>
                  
                  {/* Actual Image */}
                  {item.images?.[0] && (
                    <img
                      alt={item.title}
                      className="absolute inset-0 z-10 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 bg-[#f2f4f4]"
                      src={item.images[0]}
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                  )}
                  
                  {/* Status & Type badge */}
                  <span className={`absolute z-20 top-3 left-3 text-[10px] font-black px-2 py-0.5 rounded-full ${
                    item.status === 'RESOLVED' ? 'bg-gray-800 text-white' : 
                    item.type === 'LOST' ? 'bg-red-500 text-white' : 'bg-primary text-white'
                  }`}>
                    {item.status === 'RESOLVED' ? 'Resolved' : item.type === 'LOST' ? 'Lost' : 'Found'}
                  </span>

                  <button
                    onClick={(e) => handleToggleLike(e, item)}
                    className={`absolute z-20 top-3 right-3 w-8 h-8 backdrop-blur rounded-full flex items-center justify-center shadow-sm transition-colors active:scale-90 ${
                      likedIds.has(item.id) ? 'bg-red-50 text-red-500' : 'bg-white/90 text-[#2d3435] hover:text-red-500'
                    }`}
                    disabled={togglingLike === item.id}
                  >
                    <span className="material-symbols-rounded text-lg" style={{ fontVariationSettings: likedIds.has(item.id) ? "'FILL' 1" : "'FILL' 0" }}>favorite</span>
                  </button>
                </div>
                <div className="px-1">
                  <p className="text-[10px] font-bold text-[#5c5f62] tracking-tighter font-label flex items-center gap-1">
                    <span className="material-symbols-rounded text-[12px]">location_on</span>
                    {item.location}
                  </p>
                  <h4 className="text-sm font-semibold text-[#2d3435] font-body truncate mt-0.5">{item.title}</h4>
                  <div className="flex items-center justify-between mt-1">
                    <div className="flex flex-col">
                      <span className="text-[11px] text-[#596061]">{item.date}</span>
                      {item.reward && item.reward > 0 && (
                        <span className="text-sm font-bold text-[#1A73E8] font-headline mt-0.5 flex items-center gap-1">
                          <span className="material-symbols-rounded text-[14px]">payments</span>
                          Reward: ${item.reward.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Register FAB */}
      {user && (
        <div className="fixed bottom-24 right-4 z-40">
          <button 
            onClick={() => router.push('/lost-found/register')}
            className="flex items-center justify-center w-14 h-14 bg-primary text-white rounded-full shadow-[0_4px_20px_rgba(0,0,0,0.2)] hover:scale-105 active:scale-95 transition-transform"
          >
            <span className="material-symbols-rounded text-3xl">add</span>
          </button>
        </div>
      )}
    </main>
  );
}
