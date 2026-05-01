'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { rentalService } from '@/lib/firebase/rentalService';
import { RentalSpace, RentalLike } from '@/types/rental';
import { useRouter } from 'next/navigation';
import RentalWishlistTray from '@/components/rental/RentalWishlistTray';

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
    <main className="max-w-md mx-auto w-full relative">
      <style dangerouslySetInnerHTML={{ __html: `
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .material-symbols-rounded { font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24; }
      `}} />

      {/* Spaces Grid */}
      <div className="pt-4 px-4 mb-10 text-left min-h-[400px]">


        {filteredSpaces.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center opacity-30">
            <span className="material-symbols-rounded text-6xl mb-4">search_off</span>
            <p className="text-xs font-black uppercase tracking-widest">No spaces registered</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {filteredSpaces.map(space => (
              <div key={space.id} onClick={() => router.push(`/rental/${space.id}`)} className="group cursor-pointer animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="relative aspect-[4/5] rounded-xl bg-[#f2f4f4] overflow-hidden mb-3 border border-slate-100 flex items-center justify-center">
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
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-[#c4cacc]">
                    <span className="material-symbols-rounded text-4xl mb-1">home</span>
                    <span className="text-[10px] font-bold tracking-wider uppercase">No Image</span>
                  </div>

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
                  <div className="mt-1 flex flex-col">
                    <span className="text-sm font-bold text-[#1A73E8] font-headline mt-0.5">
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
          onSpaceClick={(spaceId) => router.push(`/rental/${spaceId}`)} 
        />
      )}
    </main>
  );
}

