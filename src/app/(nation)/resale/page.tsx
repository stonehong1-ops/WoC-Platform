'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { useNavigation } from '@/components/providers/NavigationProvider';
import { resaleService } from '@/lib/firebase/resaleService';
import { ResaleItem } from '@/types/resale';
import CreateResaleItem from '@/components/resale/CreateResaleItem';
import ResaleItemDetail from '@/components/resale/ResaleItemDetail';
import { AnimatePresence } from 'framer-motion';
import { safeDate } from '@/lib/utils/safeDate';
import ResaleWishlistTray from '@/components/resale/ResaleWishlistTray';
import { useModalNavigation } from '@/hooks/useModalNavigation';

type SortOption = 'latest' | 'popular' | 'price_asc' | 'price_desc';

const SORT_OPTIONS: { key: SortOption; label: string; icon: string }[] = [
  { key: 'latest', label: 'Latest', icon: 'schedule' },
  { key: 'popular', label: 'Popular', icon: 'trending_up' },
  { key: 'price_asc', label: 'Price ↑', icon: 'arrow_upward' },
  { key: 'price_desc', label: 'Price ↓', icon: 'arrow_downward' },
];

const RESALE_FILTER_DEFS: Record<string, { label: string; fullLabel?: string; icon?: string }> = {
  All: { label: 'All', fullLabel: 'All' },
  Shoes: { label: 'Shoes', fullLabel: 'Shoes', icon: 'steps' },
  Apparel: { label: 'Apparel', fullLabel: 'Apparel', icon: 'checkroom' },
  Accessories: { label: 'Accessories', fullLabel: 'Accessories', icon: 'diamond' },
  Equipment: { label: 'Equipment', fullLabel: 'Equipment', icon: 'fitness_center' },
  Others: { label: 'Others', fullLabel: 'Others', icon: 'more_horiz' },
};

const RESALE_FILTER_KEYS = ['All', 'Shoes', 'Apparel', 'Accessories', 'Equipment', 'Others'];

function ResalePageContent() {
  const { user, setShowLogin } = useAuth();
  const { value: itemId, openModal: openDetail, closeModal: closeDetail } = useModalNavigation('itemId');
  const { isOpen: showCreateModal, openModal: openCreate, closeModal: closeCreate } = useModalNavigation('create');

  const [items, setItems] = useState<ResaleItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('All');
  const [activePerson, setActivePerson] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showLocationFilter, setShowLocationFilter] = useState(false);
  const [sortOption, setSortOption] = useState<SortOption>('latest');
  const [showPersonFilter, setShowPersonFilter] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const { setSubHeader } = useNavigation();
  
  // Listen to global compose event
  useEffect(() => {
    const handleComposeOpen = (e: CustomEvent) => {
      if (e.detail?.id === 'resale') {
        openCreate('true');
      }
    };
    window.addEventListener('woc:compose:open', handleComposeOpen as EventListener);
    return () => window.removeEventListener('woc:compose:open', handleComposeOpen as EventListener);
  }, [openCreate]);
  
  // URL-based states
  const selectedItem = useMemo(() => items.find(i => i.id === itemId) || null, [items, itemId]);

  const [userLikes, setUserLikes] = useState<Set<string>>(new Set());

  const resaleFilters = useMemo(() => {
    return RESALE_FILTER_KEYS.map(key => ({ key, ...RESALE_FILTER_DEFS[key] }));
  }, []);

  const persons = useMemo(() => {
    const ps = Array.from(new Set(items.map(i => i.sellerName).filter(Boolean)));
    return ['All', ...ps.sort()];
  }, [items]);

  // Subscribe to real-time resale items
  useEffect(() => {
    const unsub = resaleService.subscribeItems(
      null,
      (data) => {
        setItems(data);
        setIsLoading(false);
      }
    );
    return () => unsub();
  }, []);

  const [myLikes, setMyLikes] = useState<any[]>([]);

  // Sync likes
  useEffect(() => {
    if (!user) {
      setUserLikes(new Set());
      setMyLikes([]);
      return;
    }
    const unsub = resaleService.subscribeMyLikes(user.uid, (likes) => {
      setMyLikes(likes);
      setUserLikes(new Set(likes.map((l: any) => l.itemId)));
    });
    return () => unsub();
  }, [user]);

  const handleLike = async (e: React.MouseEvent, itemId: string) => {
    e.stopPropagation();
    if (!user) {
      alert("Please login to like items");
      return;
    }
    
    // Optimistic UI Update for user likes tracking
    setUserLikes(prev => {
       const newSet = new Set(prev);
       if (newSet.has(itemId)) newSet.delete(itemId);
       else newSet.add(itemId);
       return newSet;
    });

    await resaleService.toggleLike(user.uid, itemId);
  };

  // Handlers removed in favor of hook methods

  const filtered = useMemo(() => {
    let result = items.filter(s => {
      const matchSearch = !searchQuery ||
        s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.location.toLowerCase().includes(searchQuery.toLowerCase());
      const matchType = activeFilter === 'All' || s.category === activeFilter;
      const matchPerson = activePerson === 'All' || s.sellerName === activePerson;
      return matchSearch && matchType && matchPerson;
    });

    switch (sortOption) {
      case 'popular':
        result.sort((a, b) => (b.likesCount || 0) - (a.likesCount || 0));
        break;
      case 'price_asc':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price_desc':
        result.sort((a, b) => b.price - a.price);
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
  }, [items, activeFilter, activePerson, searchQuery, sortOption]);

  const getRelativeTime = (timestamp: any) => {
    if (!timestamp) return 'Just now';
    const date = safeDate(timestamp);
    if (!date) return 'Just now';
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  // Teleport Filter Bar to Header (Premium Standard: Dual Row)
  useEffect(() => {
    const filterBar = (
      <div className="relative w-full bg-white flex flex-col shadow-[0_20px_40px_-15px_rgba(0,0,0,0.15)]">
        {/* Row 1: Scrollable Tabs */}
        <div className="w-full px-3 py-2 flex items-center gap-2 overflow-x-auto no-scrollbar">
          {resaleFilters.map((filter) => (
            <button
              key={filter.key}
              onClick={() => setActiveFilter(filter.key)}
              className={`flex-shrink-0 px-2.5 py-1 rounded-xl text-[12px] font-bold tracking-tight transition-all whitespace-nowrap border ${
                activeFilter === filter.key
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-100'
                  : 'bg-slate-50/50 text-slate-500 border-slate-100 hover:bg-slate-100/80 hover:text-slate-700'
              }`}
            >
              {filter.fullLabel || filter.label}
            </button>
          ))}
        </div>
        
        {/* Row 2: Stats & Filters */}
        <div className="w-full h-11 px-4 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            <div className="text-[11px] font-bold text-slate-600 uppercase tracking-widest">
              {filtered.length} <span className="text-slate-400 font-medium">Items</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Person Filter Trigger */}
            <button 
              onClick={() => {
                setShowPersonFilter(!showPersonFilter);
                if (!showPersonFilter) setShowSortDropdown(false);
              }}
              className={`flex items-center gap-0.5 text-[12px] font-bold transition-all ${
                activePerson !== 'All' 
                  ? 'text-blue-600' 
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              {activePerson === 'All' ? 'Person' : activePerson}
              <span className={`material-symbols-outlined text-[16px] transition-transform ${showPersonFilter ? 'rotate-180' : ''}`}>expand_more</span>
            </button>

            {/* Sort Trigger */}
            <button 
              onClick={() => {
                setShowSortDropdown(!showSortDropdown);
                if (!showSortDropdown) setShowPersonFilter(false);
              }}
              className="flex items-center gap-0.5 text-[12px] font-bold text-slate-600 hover:text-slate-800 transition-all"
            >
              {SORT_OPTIONS.find(o => o.key === sortOption)?.label || 'Sort'}
              <span className={`material-symbols-outlined text-[16px] transition-transform ${showSortDropdown ? 'rotate-180' : ''}`}>expand_more</span>
            </button>
          </div>
        </div>

        {/* Person Selector Dropdown */}
        {showPersonFilter && (
          <div className="absolute top-full left-0 right-0 z-40 bg-white shadow-2xl border-t border-slate-100 p-4 max-h-[300px] overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-center justify-between mb-3 px-1">
              <span className="text-[13px] font-bold text-slate-800">Filter by Person</span>
              <button onClick={() => setShowPersonFilter(false)} className="text-slate-400 hover:text-slate-600">
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {persons.map(person => (
                <button
                  key={person}
                  onClick={() => {
                    setActivePerson(person);
                    setShowPersonFilter(false);
                  }}
                  className={`px-3 py-2 rounded-xl text-[12px] font-semibold text-left transition-all ${
                    activePerson === person ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {person}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Premium Sort Dropdown */}
        {showSortDropdown && (
          <div className="absolute top-full right-0 z-40 bg-white shadow-2xl border-t border-slate-100 py-2 min-w-[160px] animate-in fade-in slide-in-from-top-2 duration-300">
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
      </div>
    );
    setSubHeader(filterBar);
    return () => setSubHeader(null);
  }, [
    activeFilter, activePerson, sortOption, filtered.length, 
    showPersonFilter, showSortDropdown, resaleFilters, persons, setSubHeader
  ]);

  return (
    <main className="max-w-md mx-auto w-full relative min-h-screen bg-[#FAF8FF]">
      <style dangerouslySetInnerHTML={{ __html: `
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .material-symbols-rounded { font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24; }
      `}} />

      {/* Integrated Registration Action */}
      <div className="px-6 py-2 flex items-center justify-between bg-white border-b border-slate-50">
        <p className="text-[12px] font-bold text-slate-400 uppercase tracking-tight">
          Have items to share?
        </p>
        <button 
          onClick={() => openCreate('true')}
          className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700 transition-colors py-2"
        >
          <span className="text-[13px] font-bold">Post Item</span>
          <span className="material-symbols-outlined text-[18px]">add_circle</span>
        </button>
      </div>

      {/* ⑤ Product Grid (필터+정렬 결과) */}
      <div className="pt-4 px-4 mb-10 text-left min-h-[400px]">


        {isLoading ? (
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="animate-pulse">
                <div className="aspect-square rounded-xl bg-surface-container-lowest border border-outline-variant/20 mb-3" />
                <div className="h-3 bg-surface-container rounded w-1/2 mb-2" />
                <div className="h-4 bg-surface-container-low rounded w-3/4 mb-2" />
                <div className="h-4 bg-surface-container rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center opacity-30">
            <span className="material-symbols-rounded text-6xl mb-4">inventory_2</span>
            <p className="text-xs font-black uppercase tracking-widest">
              No items found
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {filtered.map(item => {
              return (
                <div 
                  key={item.id} 
                  onClick={() => openDetail(item.id)}
                  className="group cursor-pointer animate-in fade-in slide-in-from-bottom-2 duration-500 block relative"
                >
                  <div className="relative aspect-square rounded-xl bg-[#f2f4f4] overflow-hidden mb-3">
                    {/* Fallback View */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-[#c4cacc]">
                      <span className="material-symbols-outlined text-4xl mb-1">image</span>
                      <span className="text-[10px] font-bold tracking-wider uppercase">No Image</span>
                    </div>
                    
                    {/* Actual Image */}
                    {item.imageUrl && (
                      <img
                        alt={item.title}
                        className={`absolute inset-0 z-10 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 bg-[#f2f4f4] ${item.status !== 'active' ? 'opacity-50' : ''}`}
                        src={item.imageUrl}
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    )}

                    {item.status !== 'active' && (
                      <div className="absolute inset-0 z-15 bg-black/40 flex items-center justify-center">
                        <span className="text-white text-[10px] font-black uppercase tracking-widest bg-black/60 px-2 py-1 rounded">
                          {item.status}
                        </span>
                      </div>
                    )}
                    
                    <button
                      onClick={(e) => handleLike(e, item.id)}
                      className={`absolute z-20 top-3 right-3 w-8 h-8 backdrop-blur rounded-full flex items-center justify-center shadow-sm transition-colors active:scale-90 ${
                        userLikes.has(item.id) ? 'bg-red-50 text-red-500' : 'bg-white/90 text-[#2d3435] hover:text-red-500'
                      }`}
                    >
                      <span className="material-symbols-rounded text-lg" style={{ fontVariationSettings: userLikes.has(item.id) ? "'FILL' 1" : "'FILL' 0" }}>favorite</span>
                    </button>
                  </div>
                  
                  <div className="px-1">
                    <p className="text-[10px] font-bold text-[#5c5f62] uppercase tracking-tighter font-label truncate">
                      {item.location} • {getRelativeTime(item.createdAt)}
                    </p>
                    <h4 className="text-sm font-semibold text-[#2d3435] font-body truncate">{item.title}</h4>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-bold text-[#2d3435] font-headline">
                        ₩{item.price.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>



      {/* Create Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <CreateResaleItem 
            isOpen={showCreateModal}
            onClose={closeCreate}
            onSuccess={() => {}}
          />
        )}
        {selectedItem && (
          <ResaleItemDetail 
            item={selectedItem} 
            onClose={closeDetail} 
          />
        )}
      </AnimatePresence>

      {user && (
        <ResaleWishlistTray 
          likes={myLikes} 
          userId={user.uid} 
          onProductClick={(productId) => {
            openDetail(productId);
          }} 
        />
      )}
    </main>
  );
}

export default function ResalePage() {
  return (
    <React.Suspense fallback={
      <div className="max-w-md mx-auto w-full min-h-screen bg-[#FAF8FF] flex items-center justify-center">
        <span className="material-symbols-outlined animate-spin text-4xl text-blue-500">progress_activity</span>
      </div>
    }>
      <ResalePageContent />
    </React.Suspense>
  );
}

