'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { rentalService } from '@/lib/firebase/rentalService';
import { RentalSpace, RentalLike } from '@/types/rental';
import { useRouter } from 'next/navigation';
import RentalWishlistTray from '@/components/rental/RentalWishlistTray';
import RentalDetail from '@/components/rental/RentalDetail';

type SortOption = 'latest' | 'price_asc' | 'popular';

const SORT_OPTIONS: { key: SortOption; label: string; icon: string }[] = [
  { key: 'latest', label: 'Latest', icon: 'schedule' },
  { key: 'price_asc', label: 'Price: Low to High', icon: 'payments' },
  { key: 'popular', label: 'Popular', icon: 'trending_up' },
];

const RENTAL_SIZES = [
  { key: 'All', label: 'All', icon: '' },
  { key: 'very_large', label: 'Very Large', icon: 'view_comfy_alt' },
  { key: 'large', label: 'Large', icon: 'crop_5_4' },
  { key: 'medium', label: 'Medium', icon: 'crop_3_2' },
  { key: 'small', label: 'Small', icon: 'crop_7_5' },
  { key: 'very_small', label: 'Very Small', icon: 'crop_din' },
];

export default function RentalPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [spaces, setSpaces] = useState<RentalSpace[]>([]);
  const [selectedSpace, setSelectedSpace] = useState<RentalSpace | null>(null);
  const [activeSize, setActiveSize] = useState('All');
  const [activeStudio, setActiveStudio] = useState('All');
  const [sortOption, setSortOption] = useState<SortOption>('latest');
  const [searchQuery, setSearchQuery] = useState('');
  const [likes, setLikes] = useState<RentalLike[]>([]);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [togglingLike, setTogglingLike] = useState<string | null>(null);
  const [showStudioFilter, setShowStudioFilter] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  useEffect(() => {
    const unsub = rentalService.subscribeSpaces(
      activeSize !== 'All' ? activeSize : null,
      activeStudio !== 'All' ? activeStudio : null,
      (data) => setSpaces(data)
    );
    return () => unsub();
  }, [activeSize, activeStudio]);

  useEffect(() => {
    if (!user) return;
    const unsub = rentalService.subscribeMyLikes(user.uid, (likesData) => {
      setLikes(likesData);
      setLikedIds(new Set(likesData.map(l => l.spaceId)));
    });
    return () => unsub();
  }, [user]);

  const studios = useMemo(() => {
    const stds = Array.from(new Set(spaces.map(s => s.studioName || s.location || 'Unknown Studio').filter(Boolean)));
    return ['All', ...stds.sort()];
  }, [spaces]);

  const filteredSpaces = useMemo(() => {
    let result = [...spaces];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(s =>
        (s.title || '').toLowerCase().includes(q) ||
        (s.studioName || '').toLowerCase().includes(q) ||
        (s.location || '').toLowerCase().includes(q)
      );
    }

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
  }, [spaces, searchQuery, sortOption]);

  const handleToggleLike = async (e: React.MouseEvent, space: RentalSpace) => {
    e.stopPropagation();
    e.preventDefault();
    if (!user) return alert("Login is required.");
    setTogglingLike(space.id);
    try { await rentalService.toggleLike(user.uid, space.id); } catch (err) { console.error(err); }
    setTogglingLike(null);
  };

  return (
    <main className="max-w-md mx-auto w-full relative min-h-screen bg-[#FAF8FF]">
      <style dangerouslySetInnerHTML={{ __html: `
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .material-symbols-rounded { font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24; }
      `}} />

      {/* Filter & Sort Bar */}
      <div className="w-full bg-[#FAF8FF] border-b border-slate-100/50 px-3 py-2 flex flex-col gap-3">
        {/* Scrollable Tabs */}
        <div className="w-full flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {RENTAL_SIZES.map((filter) => (
            <button
              key={filter.key}
              onClick={() => setActiveSize(filter.key)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-[12px] font-bold tracking-wide transition-all whitespace-nowrap ${
                activeSize === filter.key
                  ? 'bg-[#1E293B] text-white shadow-sm'
                  : 'bg-slate-50 text-slate-500 border border-slate-100 hover:bg-slate-100'
              }`}
            >
              {filter.icon && (
                <span className="material-symbols-rounded text-[14px] align-middle mr-1">
                  {filter.icon}
                </span>
              )}
              {filter.label}
            </button>
          ))}
        </div>
        
        {/* Bottom Actions (Text + Arrow) */}
        <div className="w-full flex items-center justify-between px-1">
          <div className="text-[11px] font-medium text-[#007AFF]">
            {filteredSpaces.length} spaces
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
              {activeStudio === 'All' ? 'Studio' : activeStudio}
              <span className="material-symbols-outlined text-[14px]">expand_more</span>
            </button>

            {/* Sort Trigger */}
            <button 
              onClick={() => {
                setShowSortDropdown(!showSortDropdown);
                if (!showSortDropdown) setShowStudioFilter(false);
              }}
              className="flex items-center gap-0.5 text-[12px] font-bold text-slate-600 hover:text-slate-800 transition-all"
            >
              {SORT_OPTIONS.find(o => o.key === sortOption)?.label || 'Sort'}
              <span className="material-symbols-outlined text-[14px]">expand_more</span>
            </button>
          </div>
        </div>
      </div>

      {/* Studio Selector Modal/Dropdown */}
      {showStudioFilter && (
        <div className="absolute top-[90px] left-4 right-4 z-40 bg-white rounded-2xl shadow-2xl border border-slate-100 p-4 max-h-[300px] overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center justify-between mb-3 px-1">
            <span className="text-[13px] font-bold text-slate-800">Select Studio</span>
            <button onClick={() => setShowStudioFilter(false)} className="text-slate-400 hover:text-slate-600">
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
                className={`px-3 py-2 rounded-xl text-[12px] font-semibold text-left transition-all ${
                  activeStudio === std ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {std}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Sort Options Modal/Dropdown */}
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
              <span className="material-symbols-rounded text-[18px]">{opt.icon}</span>
              <span className="text-[13px]">{opt.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* ③ Rental List Area */}
      <div className="pt-4 px-4 mb-10 text-left min-h-[400px]">


        {filteredSpaces.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center opacity-30">
            <span className="material-symbols-rounded text-6xl mb-4">search_off</span>
            <p className="text-xs font-black uppercase tracking-widest">No spaces registered</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {filteredSpaces.map(space => (
              <div key={space.id} onClick={() => setSelectedSpace(space)} className="group cursor-pointer animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="relative aspect-[4/5] rounded-xl bg-[#f2f4f4] overflow-hidden mb-3">
                  {/* Fallback View */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-[#c4cacc]">
                    <span className="material-symbols-outlined text-4xl mb-1">home</span>
                    <span className="text-[10px] font-bold tracking-wider uppercase">No Image</span>
                  </div>

                  {/* Actual Image */}
                  {space.images?.[0] && space.images[0].trim() !== '' && (
                    <img
                      alt={space.title}
                      className="absolute inset-0 z-10 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 bg-[#f2f4f4]"
                      src={space.images[0]}
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  )}

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
                  <p className="text-[10px] font-bold text-[#5c5f62] tracking-tighter font-label flex items-center gap-1">
                    <span className="material-symbols-rounded text-[12px]">location_on</span>
                    {space.location}
                  </p>
                  <h4 className="text-sm font-semibold text-[#2d3435] font-body truncate mt-0.5">{space.title}</h4>
                  <div className="flex items-center gap-1.5 mt-1.5 mb-1 overflow-x-auto no-scrollbar">
                    {space.capacity && (
                      <span className="flex items-center gap-0.5 text-[9px] font-bold text-[#596061] bg-slate-100 px-1.5 py-0.5 rounded-md whitespace-nowrap">
                        <span className="material-symbols-rounded text-[11px]">person</span> Max {space.capacity}
                      </span>
                    )}
                    {space.floorMaterial && (
                      <span className="flex items-center gap-0.5 text-[9px] font-bold text-[#596061] bg-slate-100 px-1.5 py-0.5 rounded-md whitespace-nowrap">
                        <span className="material-symbols-rounded text-[11px]">layers</span> {space.floorMaterial}
                      </span>
                    )}
                    <span className="flex items-center gap-0.5 text-[9px] font-bold text-[#596061] bg-slate-100 px-1.5 py-0.5 rounded-md whitespace-nowrap">
                      <span className="material-symbols-rounded text-[11px]">crop_portrait</span> {space.hasMirror ? 'Mirror O' : 'Mirror X'}
                    </span>
                  </div>
                  <div className="flex flex-col mt-1">
                    <span className="text-sm font-bold text-[#2d3435] font-headline">
                      ₩ {((space as any).minPrice || space.pricePerHour || 0).toLocaleString()} 
                      {(space as any).maxPrice && (space as any).maxPrice !== ((space as any).minPrice || space.pricePerHour) 
                        ? ` ~ ₩${(space as any).maxPrice.toLocaleString()}` 
                        : ''}
                      <span className="text-[10px] text-[#596061] font-normal ml-1">/ hr</span>
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
          onSpaceClick={(space) => setSelectedSpace(space)} 
        />
      )}

      {/* Detail Modal */}
      {selectedSpace && (
        <RentalDetail
          space={selectedSpace}
          isLiked={likedIds.has(selectedSpace.id)}
          onClose={() => setSelectedSpace(null)}
          onToggleLike={handleToggleLike}
        />
      )}
    </main>
  );
}

