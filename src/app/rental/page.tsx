'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { useNavigation } from '@/components/providers/NavigationProvider';
import { rentalService } from '@/lib/firebase/rentalService';
import { venueService } from '@/lib/firebase/venueService';
import { RentalSpace, RentalLike } from '@/types/rental';
import { Venue } from '@/types/venue';
import { useModalNavigation } from '@/hooks/useModalNavigation';
import RentalWishlistTray from '@/components/rental/RentalWishlistTray';
import RentalDetail from '@/components/rental/RentalDetail';
import CreateRentalSpace from '@/components/rental/CreateRentalSpace';
import ImageWithFallback from '@/components/common/ImageWithFallback';
import { useLanguage } from '@/contexts/LanguageContext';


type SortOption = 'latest' | 'price_asc' | 'popular';

const SORT_OPTIONS: { key: SortOption; label: string; icon: string }[] = [
  { key: 'latest', label: 'Latest', icon: 'schedule' },
  { key: 'price_asc', label: 'Price: Low', icon: 'payments' },
  { key: 'popular', label: 'Popular', icon: 'trending_up' },
];

const RENTAL_SIZES = [
  { key: 'All', label: 'All' },
  { key: 'very_large', label: 'Very Large' },
  { key: 'large', label: 'Large' },
  { key: 'medium', label: 'Medium' },
  { key: 'small', label: 'Small' },
  { key: 'very_small', label: 'Very Small' },
];

function RentalPageContent() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { isOpen: isDetailOpen, value: itemId, openModal: openDetail, closeModal: closeDetail } = useModalNavigation('itemId');
  const { isOpen: isComposeOpen, openModal: openCompose, closeModal: closeCompose } = useModalNavigation('compose');

  const [spaces, setSpaces] = useState<RentalSpace[]>([]);
  const [allVenues, setAllVenues] = useState<Venue[]>([]);
  const [activeSize, setActiveSize] = useState('All');
  const [activeStudio, setActiveStudio] = useState('All');
  const [sortOption, setSortOption] = useState<SortOption>('latest');
  const [searchQuery, setSearchQuery] = useState('');
  const [likes, setLikes] = useState<RentalLike[]>([]);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [togglingLike, setTogglingLike] = useState<string | null>(null);
  const [showStudioFilter, setShowStudioFilter] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const { setSubHeader } = useNavigation();

  // Listen to global compose event
  useEffect(() => {
    const handleComposeOpen = (e: CustomEvent) => {
      if (e.detail?.id === 'rental') {
        openCompose('true');
      }
    };
    window.addEventListener('woc:compose:open', handleComposeOpen as EventListener);
    return () => window.removeEventListener('woc:compose:open', handleComposeOpen as EventListener);
  }, [openCompose]);

  useEffect(() => {
    const unsub = rentalService.subscribeSpaces((data) => setSpaces(data));
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = venueService.subscribeVenues((data) => setAllVenues(data));
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user) return;
    const unsub = rentalService.subscribeMyLikes(user.uid, (likesData) => {
      setLikes(likesData);
      setLikedIds(new Set(likesData.map(l => l.spaceId)));
    });
    return () => unsub();
  }, [user]);

  const studios = useMemo(() => {
    const studioVenues = allVenues.filter(v => 
      v.status === 'active' && 
      (v.types.includes('Studio') || v.category === 'Studio')
    );
    const names = Array.from(new Set(studioVenues.map(v => v.name).filter(Boolean)));
    return ['All', ...names.sort()];
  }, [allVenues]);

  const filteredSpaces = useMemo(() => {
    let result = [...spaces];

    // Apply Studio Filter
    if (activeStudio !== 'All') {
      result = result.filter(s => (s.studioName || s.location || 'Unknown Studio') === activeStudio);
    }

    // Apply Size Filter
    if (activeSize !== 'All') {
      result = result.filter(s => s.size === activeSize);
    }

    // Apply Search Query
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(s =>
        (s.title || '').toLowerCase().includes(q) ||
        (s.studioName || '').toLowerCase().includes(q) ||
        (s.location || '').toLowerCase().includes(q)
      );
    }

    // Apply Sort
    switch (sortOption) {
      case 'popular':
        result.sort((a, b) => (b.likesCount || 0) - (a.likesCount || 0));
        break;
      case 'price_asc':
        result.sort((a, b) => (a.pricePerHour || 0) - (b.pricePerHour || 0));
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
  }, [spaces, searchQuery, sortOption, activeSize, activeStudio]);

  const selectedSpace = useMemo(() => {
    if (!itemId) return null;
    return spaces.find(s => s.id === itemId) || null;
  }, [itemId, spaces]);

  const handleToggleLike = async (e: React.MouseEvent, space: RentalSpace) => {
    e.stopPropagation();
    e.preventDefault();
    if (!user) return alert("Login is required.");
    setTogglingLike(space.id);
    try { await rentalService.toggleLike(user.uid, space.id); } catch (err) { console.error(err); }
    setTogglingLike(null);
  };

  // Teleport Filter Bar to Header (Premium Standard: Dual Row)
  useEffect(() => {
    const filterBar = (
      <div className="relative w-full bg-white flex flex-col shadow-[0_20px_40px_-15px_rgba(0,0,0,0.15)]">
        {/* Row 1: Scrollable Tabs */}
        <div className="w-full px-3 py-2 flex items-center gap-2 overflow-x-auto no-scrollbar">
          {RENTAL_SIZES.map((filter) => (
            <button
              key={filter.key}
              onClick={() => setActiveSize(filter.key)}
              className={`flex-shrink-0 px-2.5 py-1 rounded-xl text-[12px] font-bold tracking-tight transition-all whitespace-nowrap border ${
                activeSize === filter.key
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-100'
                  : 'bg-slate-50/50 text-slate-500 border-slate-100 hover:bg-slate-100/80'
              }`}
            >
              {t(`rental.size_${filter.key.toLowerCase()}`)}
            </button>
          ))}
        </div>
        
        {/* Row 2: Stats & Filters */}
        <div className="w-full h-11 px-4 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            <div className="text-[11px] font-bold text-slate-600 uppercase tracking-widest">
              {filteredSpaces.length} <span className="text-slate-400 font-medium">{t('rental.stats_spaces')}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Studio Filter Trigger */}
            <button 
              onClick={() => {
                setShowStudioFilter(!showStudioFilter);
                if (!showStudioFilter) setShowSortDropdown(false);
              }}
              className={`flex items-center gap-0.5 text-[12px] font-bold transition-all ${
                activeStudio !== 'All' 
                  ? 'text-blue-600' 
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              {activeStudio === 'All' ? t('rental.filter_studio') : activeStudio}
              <span className={`material-symbols-outlined text-[16px] transition-transform ${showStudioFilter ? 'rotate-180' : ''}`}>expand_more</span>
            </button>

            {/* Sort Trigger */}
            <button 
              onClick={() => {
                setShowSortDropdown(!showSortDropdown);
                if (!showSortDropdown) setShowStudioFilter(false);
              }}
              className="flex items-center gap-0.5 text-[12px] font-bold text-slate-600 hover:text-slate-800 transition-all"
            >
              {t(`rental.sort_${sortOption}`).split(':')[0]}
              <span className={`material-symbols-outlined text-[16px] transition-transform ${showSortDropdown ? 'rotate-180' : ''}`}>expand_more</span>
            </button>
          </div>
        </div>

        {/* Studio Selector Dropdown (Premium Brand Grid) */}
        {showStudioFilter && (
          <div className="absolute top-full left-0 right-0 z-40 bg-white shadow-2xl border-t border-slate-100 p-4 max-h-[280px] overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-center justify-between mb-4 px-1">
              <span className="text-[14px] font-black text-slate-800 uppercase tracking-tight">{t('rental.filter_title_studio')}</span>
              <button 
                onClick={() => setShowStudioFilter(false)} 
                className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-50 text-slate-400 hover:text-slate-600 active:scale-90 transition-all"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {studios.map(std => (
                <button
                  key={std}
                  onClick={() => {
                    setActiveStudio(std);
                    setShowStudioFilter(false);
                  }}
                  className={`px-4 py-3 rounded-2xl text-[12px] font-bold text-left transition-all border ${
                    activeStudio === std 
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-100' 
                      : 'bg-slate-50/50 text-slate-600 border-transparent hover:bg-slate-100/80'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="truncate pr-2">{std}</span>
                    {activeStudio === std && (
                      <span className="material-symbols-outlined text-[14px]">check_circle</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-slate-50 flex justify-center">
              <button 
                onClick={() => setShowStudioFilter(false)}
                className="text-[11px] font-bold text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors"
              >
                {t('rental.filter_close')}
              </button>
            </div>
          </div>
        )}
  
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
                <span className="text-[13px]">{t(`rental.sort_${opt.key}`).split(':')[0]}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    );
    setSubHeader(filterBar);
    return () => setSubHeader(null);
  }, [
    activeSize, activeStudio, sortOption, filteredSpaces.length, 
    showStudioFilter, showSortDropdown, studios, setSubHeader
  ]);

  return (
    <main className="max-w-md mx-auto w-full relative min-h-screen bg-[#FAF8FF]">
      <style dangerouslySetInnerHTML={{ __html: `
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .material-symbols-rounded { font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24; }
      `}} />

      {/* ③ Rental List Area */}
      <div className="pt-4 px-4 mb-10 text-left min-h-[400px]">


        {filteredSpaces.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center opacity-30">
            <span className="material-symbols-rounded text-6xl mb-4">search_off</span>
            <p className="text-xs font-black uppercase tracking-widest">{t('rental.no_spaces')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {filteredSpaces.map(space => (
              <div key={space.id} onClick={() => openDetail(space.id)} className="group cursor-pointer animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="relative aspect-square rounded-xl bg-[#f2f4f4] overflow-hidden mb-3">
                  {(() => {
                    let firstImage = (space as any).groupCoverImage || '';

                    if (!firstImage) {
                      const imgData = space.images || (space as any).imageUrls || (space as any).image;
                      if (Array.isArray(imgData) && imgData.length > 0) {
                        firstImage = imgData[0];
                      } else if (typeof imgData === 'string') {
                        firstImage = imgData;
                      }
                    }

                    return (
                      <ImageWithFallback
                        alt={space.title}
                        className="absolute inset-0 z-10 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 bg-[#f2f4f4]"
                        src={firstImage}
                        fallbackType="cover"
                        category={(space as any).groupCategory || 'Rental'}
                      />
                    );
                  })()}

                  <button
                    onClick={(e) => handleToggleLike(e, space)}
                    className={`absolute z-20 top-3 right-3 w-8 h-8 backdrop-blur rounded-full flex items-center justify-center shadow-sm transition-colors active:scale-90 ${
                      likedIds.has(space.id) ? 'bg-red-50 text-red-500' : 'bg-white/90 text-[#2d3435] hover:text-red-500'
                    }`}
                    disabled={togglingLike === space.id}
                  >
                    <span className="material-symbols-rounded text-lg" style={{ fontVariationSettings: likedIds.has(space.id) ? "'FILL' 1" : "'FILL' 0" }}>favorite</span>
                  </button>
                </div>
                <div className="px-1">
                  <p className="text-[10px] font-bold text-[#5c5f62] uppercase tracking-tighter font-label">
                    {space.studioName || space.location}
                  </p>
                  <h4 className="text-sm font-semibold text-[#2d3435] font-body truncate mt-0.5">{space.title}</h4>
                  
                  {/* Space Tags (Simplified) */}
                  <div className="flex items-center gap-1 mt-1 mb-1.5 overflow-x-auto no-scrollbar">
                    {space.capacity && (
                      <span className="text-[9px] font-bold text-slate-400 border border-slate-100 px-1.5 py-0.5 rounded-md whitespace-nowrap uppercase">
                        {t('rental.tag_max')} {space.capacity}
                      </span>
                    )}
                    {space.hasMirror && (
                      <span className="text-[9px] font-bold text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded-md whitespace-nowrap uppercase">
                        {t('rental.tag_mirror')}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between mt-1">
                    <span className="text-sm font-bold text-[#2d3435] font-headline">
                      ₩{((space as any).minPrice || space.pricePerHour || 0).toLocaleString()} 
                      <span className="text-[10px] text-[#596061] font-normal ml-0.5">{t('rental.per_hr')}</span>
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {user && (
        <RentalWishlistTray 
          likes={likes} 
          userId={user.uid} 
          onSpaceClick={(spaceId) => openDetail(spaceId)} 
        />
      )}

      {/* Detail Modal */}
      {selectedSpace && (
        <RentalDetail
          space={selectedSpace}
          isLiked={likedIds.has(selectedSpace.id)}
          onClose={closeDetail}
          onToggleLike={handleToggleLike}
        />
      )}

      {/* Create Modal */}
      <CreateRentalSpace
        isOpen={isComposeOpen}
        onClose={closeCompose}
      />
    </main>
  );
}

export default function RentalPage() {
  return (
    <React.Suspense fallback={
      <div className="max-w-md mx-auto w-full min-h-screen bg-[#FAF8FF] flex items-center justify-center">
        <span className="material-symbols-outlined animate-spin text-4xl text-blue-500">progress_activity</span>
      </div>
    }>
      <RentalPageContent />
    </React.Suspense>
  );
}


