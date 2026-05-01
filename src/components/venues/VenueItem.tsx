'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Edit2, Trash2, MapPin, Star, MoreVertical } from 'lucide-react';
import { Venue } from '@/types/venue';

interface VenueItemProps {
  venue: Venue;
  onEdit: (venue: Venue, mode?: 'edit' | 'geo') => void;
  onDelete: (id: string) => void;
}

export default function VenueItem({ venue, onEdit, onDelete }: VenueItemProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getKakaoMapUrl = (v: Venue) => `https://map.kakao.com/link/map/${v.nameKo || v.name},${v.coordinates.latitude},${v.coordinates.longitude}`;
  const getNaverMapUrl = (v: Venue) => `https://map.naver.com/v5/search/${v.nameKo || v.name}?c=${v.coordinates.longitude},${v.coordinates.latitude},15,0,0,0,dh`;
  const getGoogleMapUrl = (v: Venue) => `https://www.google.com/maps/search/?api=1&query=${v.coordinates.latitude},${v.coordinates.longitude}`;

  return (
    <div className="group relative bg-[#f7f7ff] hover:bg-[#f0f2f5] rounded-2xl p-4 transition-all duration-300">
      <div className="flex gap-4">
        {/* Thumbnail */}
        <div className="w-20 h-20 rounded-xl bg-[#ebeeef] overflow-hidden flex-none shadow-sm">
          <img 
            src={venue.imageUrl || 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=200&q=80'} 
            alt={venue.name}
            className="w-full h-full object-cover transition-transform group-hover:scale-110"
          />
        </div>

        {/* Info */}
        <div className="flex-grow flex flex-col justify-center min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 bg-[#1A73E8]/10 text-[#1A73E8] rounded-[4px]">
              {venue.category}
            </span>
            {venue.rating && (
              <div className="flex items-center gap-0.5 ml-auto">
                <Star size={10} className="fill-[#1A73E8] text-[#1A73E8]" />
                <span className="text-[10px] font-bold text-[#2d3435]">{venue.rating}</span>
              </div>
            )}
          </div>
          <h3 className="font-headline font-bold text-[#2d3435] text-sm truncate uppercase tracking-tight">
            {venue.name}
          </h3>
          <div className="flex items-center gap-1 mt-1 text-[#596061]">
            <MapPin size={10} />
            <span className="text-[10px] font-medium truncate">{venue.address}</span>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-[10px] font-bold text-[#1A73E8]">{venue.price || 'Contact for price'}</span>
            <span className="text-[10px] text-[#596061]/60 font-medium">By {venue.owner}</span>
          </div>
        </div>
      </div>

      {/* Kebab Menu */}
      <div className="absolute top-2 right-2" ref={menuRef}>
        <button 
          onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
          className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center text-[#596061] hover:text-[#1A73E8] transition-colors"
        >
          <MoreVertical size={16} />
        </button>

        {menuOpen && (
          <div className="absolute right-0 bottom-full mb-2 w-40 bg-white rounded-xl shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.3)] border border-slate-100 z-50 overflow-hidden origin-bottom-right">
            <div className="flex items-center justify-between px-2 py-2 border-b border-slate-50 gap-1 bg-slate-50/50">
              <a href={getKakaoMapUrl(venue)} target="_blank" rel="noreferrer" className="flex-1 text-center bg-[#FEE500] text-black text-[9px] font-black py-1.5 rounded shadow-sm hover:brightness-95 transition-all" onClick={e => e.stopPropagation()}>
                K
              </a>
              <a href={getNaverMapUrl(venue)} target="_blank" rel="noreferrer" className="flex-1 text-center bg-[#03C75A] text-white text-[9px] font-black py-1.5 rounded shadow-sm hover:brightness-95 transition-all" onClick={e => e.stopPropagation()}>
                N
              </a>
              <a href={getGoogleMapUrl(venue)} target="_blank" rel="noreferrer" className="flex-1 text-center bg-white border border-slate-200 text-[#4285F4] text-[9px] font-black py-1.5 rounded shadow-sm hover:bg-slate-50 transition-all" onClick={e => e.stopPropagation()}>
                G
              </a>
            </div>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onEdit(venue, 'geo');
                setMenuOpen(false);
              }}
              className="w-full px-4 py-2.5 text-left text-xs font-bold text-[#1A73E8] hover:bg-[#1A73E8]/5 border-b border-slate-50 flex items-center justify-between transition-colors"
            >
              <span>Geo tuning</span>
              <span className="material-symbols-rounded text-[14px]">my_location</span>
            </button>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onEdit(venue);
                setMenuOpen(false);
              }}
              className="w-full px-4 py-2 text-left text-xs font-bold text-slate-700 hover:bg-slate-50 border-b border-slate-50 transition-colors"
            >
              Edit
            </button>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                if(venue.id) onDelete(venue.id);
                setMenuOpen(false);
              }}
              className="w-full px-4 py-2 text-left text-xs font-bold text-red-500 hover:bg-red-50 transition-colors"
            >
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
