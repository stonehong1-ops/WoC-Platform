'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { lostFoundService } from '@/lib/firebase/lostFoundService';
import { LostFoundItem, LostFoundLike, LostFoundType } from '@/types/lostFound';
import { useRouter } from 'next/navigation';
import { useModalNavigation } from '@/hooks/useModalNavigation';
import { useNavigation } from '@/components/providers/NavigationProvider';
import LostFoundDetail from '@/components/lost/LostFoundDetail';
import CreateLostItem from '@/components/lost/CreateLostItem';
import LostFoundWishlistTray from '@/components/lost/LostFoundWishlistTray';
import { AnimatePresence } from 'framer-motion';

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

function LostFoundPageContent() {
  const { user } = useAuth();
  const router = useRouter();
  const { value: modalId, openModal, closeModal } = useModalNavigation('lostId');
  const { isOpen: showCreateModal, openModal: openCreate, closeModal: closeCreate } = useModalNavigation('create');
  const { setSubHeader } = useNavigation();
  
  // Listen to global compose event
  useEffect(() => {
    const handleComposeOpen = (e: CustomEvent) => {
      if (e.detail?.id === 'lost-found') {
        openCreate('true');
      }
    };
    window.addEventListener('woc:compose:open', handleComposeOpen as EventListener);
    return () => window.removeEventListener('woc:compose:open', handleComposeOpen as EventListener);
  }, [openCreate]);
  
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
    openModal(id);
  };

  // Teleport Filter Bar to Header (Dual Line Standard)
  useEffect(() => {
    const filterBar = (
      <div className="w-full bg-white border-b border-slate-100/50 px-3 py-2 flex flex-col gap-3">
        {/* Row 1: Type Filters */}
        <div className="w-full flex items-center justify-start gap-1.5 overflow-x-auto no-scrollbar">
          {lfFilters.map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setActiveFilter(tab.key);
                window.scrollTo({ top: 0, behavior: 'instant' });
              }}
              className={`flex-shrink-0 px-4 py-1.5 rounded-lg text-[12px] font-bold tracking-tight transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeFilter === tab.key
                  ? 'bg-[#1E293B] text-white shadow-sm'
                  : 'bg-slate-50 text-slate-500 border border-slate-100 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Row 2: Info & Sort */}
        <div className="w-full flex items-center justify-between px-1 relative">
          <div className="text-[11px] font-medium text-slate-400 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#1A73E8]/50" />
            <span className="text-[#1A73E8] font-semibold">{filteredItems.length}</span>
            <span className="text-slate-500">items listed</span>
          </div>

          <div className="relative">
            <button
              onClick={() => setShowSortDropdown(!showSortDropdown)}
              className="flex items-center gap-0.5 text-[12px] font-bold text-slate-600 hover:text-slate-800 transition-all"
            >
              {SORT_OPTIONS.find(o => o.key === sortOption)?.label || 'Latest'}
              <span className={`material-symbols-rounded text-[16px] transition-transform duration-200 ${showSortDropdown ? 'rotate-180' : ''}`}>
                keyboard_arrow_down
              </span>
            </button>

            {showSortDropdown && (
              <div className="absolute top-full right-0 z-[60] bg-white shadow-2xl border border-slate-100 py-1.5 rounded-xl min-w-[160px] animate-in fade-in slide-in-from-top-1 duration-200 mt-1">
                {SORT_OPTIONS.map(opt => (
                  <button
                    key={opt.key}
                    onClick={() => { setSortOption(opt.key); setShowSortDropdown(false); }}
                    className={`w-full px-4 py-2.5 flex items-center gap-3 hover:bg-slate-50 transition-colors text-left ${
                      sortOption === opt.key ? 'text-[#1A73E8] font-bold' : 'text-slate-600 font-medium'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">{opt.icon}</span>
                    <span className="text-[13px]">{opt.label}</span>
                    {sortOption === opt.key && <span className="material-symbols-outlined text-[16px] ml-auto">check</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );

    setSubHeader(filterBar);
    return () => setSubHeader(null);
  }, [activeFilter, filteredItems.length, sortOption, showSortDropdown, setSubHeader, lfFilters]);

  return (
    <main className="max-w-md mx-auto w-full relative">
      <style dangerouslySetInnerHTML={{ __html: `
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .material-symbols-rounded { font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24; }
      `}} />

      {/* ⑤ Items Grid */}
      <div className="px-4 mb-10 text-left min-h-[400px]">

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
      {user && (
        <LostFoundWishlistTray 
          likes={likes} 
          userId={user.uid} 
          onItemClick={(id) => openModal(id)} 
        />
      )}


      {/* Item Detail Modal */}
      <AnimatePresence>
        {modalId && (
          <LostFoundDetail id={modalId} onClose={closeModal} />
        )}
        {showCreateModal && (
          <CreateLostItem onClose={closeCreate} onSuccess={() => {}} />
        )}
      </AnimatePresence>
    </main>
  );
}

export default function LostFoundPage() {
  return (
    <Suspense fallback={
      <div className="max-w-md mx-auto w-full min-h-screen bg-[#FAF8FF] flex items-center justify-center">
        <span className="material-symbols-rounded animate-spin text-slate-300 text-4xl">progress_activity</span>
      </div>
    }>
      <LostFoundPageContent />
    </Suspense>
  );
}
