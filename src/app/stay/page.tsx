"use client";

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/providers/AuthProvider';
import { useNavigation } from '@/components/providers/NavigationProvider';
import { stayService } from '@/lib/firebase/stayService';
import { Stay, StayLike } from '@/types/stay';
import StayWishlistTray from '@/components/stay/StayWishlistTray';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useModalNavigation } from '@/hooks/useModalNavigation';
import StayDetail from '@/components/stay/StayDetail';
import CreateStay from '@/components/stay/CreateStay';
import { useLanguage } from '@/contexts/LanguageContext';


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

function StayPageContent() {
  const { t } = useLanguage();
  const [stays, setStays] = useState<Stay[]>(() => {
    if (typeof window !== 'undefined') {
      const cached = sessionStorage.getItem('woc_stay_active_stays');
      if (cached) {
        try {
          return JSON.parse(cached);
        } catch (e) {
          console.error("Failed to parse cached stays", e);
        }
      }
    }
    return [];
  });
  const [isLoading, setIsLoading] = useState(() => {
    if (typeof window !== 'undefined') {
      const cached = sessionStorage.getItem('woc_stay_active_stays');
      if (cached) return false;
    }
    return true;
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [activeCity, setActiveCity] = useState('All');
  const [showCityFilter, setShowCityFilter] = useState(false);
  const [sortOption, setSortOption] = useState<SortOption>('latest');
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const { setSubHeader } = useNavigation();
  
  const { user, setShowLogin } = useAuth();
  const [likes, setLikes] = useState<StayLike[]>([]);
  const [likedStayIds, setLikedStayIds] = useState<Set<string>>(new Set());
  const {
    isOpen: isDetailOpen,
    value: itemId,
    openModal: openDetail,
    closeModal: handleCloseDetail,
    searchParams
  } = useModalNavigation('itemId');

  const {
    isOpen: showCreateModal,
    openModal: openCreate,
    closeModal: closeCreate
  } = useModalNavigation('create');

  const handleOpenDetail = (id: string) => {
    openDetail(id);
  };

  const stayFilters = useMemo(() => {
    return STAY_FILTER_KEYS.map(key => ({ key, ...STAY_FILTER_DEFS[key] }));
  }, []);

  // Listen to global compose event
  useEffect(() => {
    const handleComposeOpen = (e: CustomEvent) => {
      if (e.detail?.id === 'stay') {
        openCreate('true');
      }
    };
    window.addEventListener('woc:compose:open', handleComposeOpen as EventListener);
    return () => window.removeEventListener('woc:compose:open', handleComposeOpen as EventListener);
  }, [openCreate]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const cached = sessionStorage.getItem('woc_stay_active_stays');
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (parsed && parsed.length > 0) {
            setStays(parsed);
            setIsLoading(false);
          }
        } catch (e) {
          console.error("Error restoring stays cache", e);
        }
      }
    }

    const unsub = stayService.subscribeActiveStays(null, (data) => {
      setStays(data);
      setIsLoading(false);
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('woc_stay_active_stays', JSON.stringify(data));
      }
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

  // Dynamic cities from data
  const cities = useMemo(() => {
    const cs = Array.from(new Set(stays.map(s => s.location?.city).filter(Boolean)));
    return ['All', ...cs.sort()];
  }, [stays]);

  const filtered = useMemo(() => {
    let result = stays.filter(s => {
      const matchSearch = !searchQuery ||
        s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.location?.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.location?.city?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchType = activeFilter === 'all' || s.type === activeFilter || (activeFilter === 'Couchsurfing' && s.type === 'Couchsurfing');
      const matchCity = activeCity === 'All' || s.location?.city === activeCity;
      return matchSearch && matchType && matchCity;
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
  }, [stays, activeFilter, activeCity, searchQuery, sortOption]);

  const formatPrice = (stay: Stay) => {
    const rate = stay.pricing?.baseRate || 0;
    const currency = stay.pricing?.currency || 'KRW';
    const symbol = currency === 'KRW' ? '₩' : '$';
    return `${symbol}${rate.toLocaleString()}`;
  };

  // Teleport Filter Bar to Header (Premium Standard: Dual Row)
  useEffect(() => {
    const filterBar = (
      <div className="relative w-full bg-white flex flex-col shadow-[0_20px_40px_-15px_rgba(0,0,0,0.15)]">
        {/* Row 1: Scrollable Tabs */}
        <div className="w-full px-3 py-2 flex items-center gap-2 overflow-x-auto no-scrollbar">
          {stayFilters.map((filter) => (
            <button
              key={filter.key}
              onClick={() => setActiveFilter(filter.key)}
              className={`flex-shrink-0 px-2.5 py-1 rounded-xl text-[12px] font-bold tracking-tight transition-all whitespace-nowrap border ${
                activeFilter === filter.key
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-100'
                  : 'bg-slate-50/50 text-slate-500 border-slate-100 hover:bg-slate-100/80 hover:text-slate-700'
              }`}
            >
              {t(`stay.filter_${filter.key.replace('-', '_').toLowerCase()}_full`)}
            </button>
          ))}
        </div>
        
        {/* Row 2: Stats & Filters */}
        <div className="w-full h-11 px-4 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            <div className="text-[11px] font-bold text-slate-600 uppercase tracking-widest">
              {filtered.length} <span className="text-slate-400 font-medium">{t('stay.stats_stays')}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Sort Trigger */}
            <button 
              onClick={() => {
                setShowSortDropdown(!showSortDropdown);
              }}
              className="flex items-center gap-0.5 text-[12px] font-bold text-slate-600 hover:text-slate-800 transition-all"
            >
              {t(`stay.sort_${sortOption}`) || t('stay.filter_sort')}
              <span className={`material-symbols-outlined text-[16px] transition-transform ${showSortDropdown ? 'rotate-180' : ''}`}>expand_more</span>
            </button>
          </div>
        </div>


  
        {/* Sort Options Dropdown */}
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
                <span className="text-[13px]">{t(`stay.sort_${opt.key}`)}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    );
    setSubHeader(filterBar);
    return () => setSubHeader(null);
  }, [
    activeFilter, activeCity, sortOption, filtered.length, 
    showCityFilter, showSortDropdown, stayFilters, cities, setSubHeader
  ]);

  return (
    <main className="max-w-md mx-auto w-full relative min-h-screen bg-[#FAF8FF]">
      <style dangerouslySetInnerHTML={{ __html: `
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .material-symbols-rounded { font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24; }
      `}} />

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
              {t('stay.no_stays')}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {filtered.map(stay => {
              const locationStr = stay.location?.city && stay.location?.district 
              ? `${stay.location.city}, ${stay.location.district}` 
              : stay.location?.city || stay.location?.address || t('stay.fallback_location');

              return (
                <div 
                  key={stay.id} 
                  onClick={() => handleOpenDetail(stay.id)}
                  className="group cursor-pointer animate-in fade-in slide-in-from-bottom-2 duration-500 block text-left"
                >
                  <div className="relative aspect-square rounded-xl bg-[#f2f4f4] overflow-hidden mb-3">
                    {/* Fallback View */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-[#c4cacc]">
                      <span className="material-symbols-outlined text-4xl mb-1">bed</span>
                      <span className="text-[10px] font-bold tracking-wider uppercase">{t('stay.no_image')}</span>
                    </div>
                    
                    {/* Actual Image */}
                    {stay.images?.[0] && (
                      <img
                        alt={stay.title}
                        className="absolute inset-0 z-10 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 bg-[#f2f4f4]"
                        src={stay.images[0]}
                        loading="lazy"
                        decoding="async"
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
                      <span className="text-[10px] text-[#596061] mt-[2px]">{t('stay.per_night')}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {user && (
        <StayWishlistTray 
          likes={likes} 
          userId={user.uid} 
          onStayClick={(id) => handleOpenDetail(id)} 
        />
      )}

      {showCreateModal && (
        <CreateStay 
          isOpen={showCreateModal}
          onClose={closeCreate}
        />
      )}

      {itemId && (
        <StayDetail 
          stayId={itemId}
          isLiked={likedStayIds.has(itemId)}
          onClose={handleCloseDetail}
          onToggleLike={(e) => toggleLike(e, itemId)}
        />
      )}
    </main>
  );
}

export default function StayPage() {
  return (
    <Suspense fallback={
      <div className="max-w-md mx-auto w-full min-h-screen bg-[#FAF8FF] flex items-center justify-center">
        <span className="material-symbols-rounded animate-spin text-slate-300 text-4xl">progress_activity</span>
      </div>
    }>
      <StayPageContent />
    </Suspense>
  );
}
