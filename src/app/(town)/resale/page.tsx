'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { resaleService } from '@/lib/firebase/resaleService';
import { ResaleItem } from '@/types/resale';
import CreateResaleItem from '@/components/resale/CreateResaleItem';
import ResaleItemDetail from '@/components/resale/ResaleItemDetail';
import { AnimatePresence } from 'framer-motion';
import { safeDate } from '@/lib/utils/safeData';

type SortOption = 'latest' | 'popular' | 'price_asc' | 'price_desc';

const SORT_OPTIONS: { key: SortOption; label: string; icon: string }[] = [
  { key: 'latest', label: 'Latest', icon: 'schedule' },
  { key: 'popular', label: 'Popular', icon: 'trending_up' },
  { key: 'price_asc', label: 'Price ↑', icon: 'arrow_upward' },
  { key: 'price_desc', label: 'Price ↓', icon: 'arrow_downward' },
];

const RESALE_FILTER_DEFS: Record<string, { label: string; fullLabel?: string; icon?: string }> = {
  All: { label: 'All', fullLabel: 'All Items' },
  Shoes: { label: 'Shoes', fullLabel: 'Shoes', icon: 'steps' },
  Apparel: { label: 'Apparel', fullLabel: 'Apparel', icon: 'checkroom' },
  Accessories: { label: 'Accessories', fullLabel: 'Accessories', icon: 'diamond' },
  Equipment: { label: 'Equipment', fullLabel: 'Equipment', icon: 'fitness_center' },
  Others: { label: 'Others', fullLabel: 'Others', icon: 'more_horiz' },
};

const RESALE_FILTER_KEYS = ['All', 'Shoes', 'Apparel', 'Accessories', 'Equipment', 'Others'];

export default function ResalePage() {
  const { user, setShowLogin } = useAuth();
  const [items, setItems] = useState<ResaleItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showLocationFilter, setShowLocationFilter] = useState(false);
  const [sortOption, setSortOption] = useState<SortOption>('latest');
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ResaleItem | null>(null);

  const [userLikes, setUserLikes] = useState<Set<string>>(new Set());

  const resaleFilters = useMemo(() => {
    return RESALE_FILTER_KEYS.map(key => ({ key, ...RESALE_FILTER_DEFS[key] }));
  }, []);

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

  // Sync likes
  useEffect(() => {
    if (!user) {
      setUserLikes(new Set());
    }
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

  const filtered = useMemo(() => {
    let result = items.filter(s => {
      const matchSearch = !searchQuery ||
        s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.location.toLowerCase().includes(searchQuery.toLowerCase());
      const matchType = activeFilter === 'All' || s.category === activeFilter;
      return matchSearch && matchType;
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
  }, [items, activeFilter, searchQuery, sortOption]);

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

  return (
    <main className="max-w-md mx-auto w-full relative">
      <style dangerouslySetInnerHTML={{ __html: `
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .material-symbols-rounded { font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24; }
      `}} />

      {/* ③ Product Grid (Resale Listings) */}
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
                  onClick={() => setSelectedItem(item)}
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
                        userLikes.has(item.id) || item.likesCount > 0 ? 'bg-red-50 text-red-500' : 'bg-white/90 text-[#2d3435] hover:text-red-500'
                      }`}
                    >
                      <span className="material-symbols-rounded text-lg" style={{ fontVariationSettings: userLikes.has(item.id) || item.likesCount > 0 ? "'FILL' 1" : "'FILL' 0" }}>favorite</span>
                    </button>
                  </div>
                  
                  <div className="px-1">
                    <p className="text-[10px] font-bold text-[#5c5f62] uppercase tracking-tighter font-label truncate">
                      {item.location} • {getRelativeTime(item.createdAt)}
                    </p>
                    <h4 className="text-sm font-semibold text-[#2d3435] font-body truncate">{item.title}</h4>
                    <div className="flex items-center justify-between mt-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-bold text-[#2d3435] font-headline">
                          ₩{item.price.toLocaleString()}
                        </span>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); setSelectedItem(item); }}
                        className={`p-1.5 rounded-lg transition-all ${
                          userLikes.has(item.id) || item.likesCount > 0 ? 'bg-red-50 text-red-500' : 'bg-[#d8e2ff] text-[#004fa8] hover:bg-primary hover:text-white'
                        }`}
                      >
                        <span className="material-symbols-rounded text-[18px] leading-none">chat_bubble</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Global Resale FAB */}
      <button 
        onClick={() => setShowCreateModal(true)}
        className="fixed bottom-28 right-6 w-14 h-14 bg-primary text-white rounded-full shadow-lg shadow-primary/30 flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-50"
      >
        <span className="material-symbols-rounded text-[32px] group-hover:rotate-90 transition-transform duration-300">add</span>
      </button>

      {/* Create Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <CreateResaleItem 
            onClose={() => setShowCreateModal(false)}
            onSuccess={() => {}}
          />
        )}
        {selectedItem && (
          <ResaleItemDetail 
            item={selectedItem} 
            onClose={() => setSelectedItem(null)} 
          />
        )}
      </AnimatePresence>
    </main>
  );
}
