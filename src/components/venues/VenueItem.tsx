'use client';

import React from 'react';
import { Edit2, Trash2, MapPin, Star } from 'lucide-react';
import { Venue } from '@/types/venue';

interface VenueItemProps {
  venue: Venue;
  onEdit: (venue: Venue) => void;
  onDelete: (id: string) => void;
}

export default function VenueItem({ venue, onEdit, onDelete }: VenueItemProps) {
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

      {/* Action Overlay (Visible on Hover/Desktop or always on Mobile) */}
      <div className="absolute top-2 right-2 flex gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
        <button 
          onClick={() => onEdit(venue)}
          className="w-8 h-8 rounded-lg bg-white shadow-md flex items-center justify-center text-[#596061] hover:text-[#1A73E8] transition-colors"
        >
          <Edit2 size={14} />
        </button>
        <button 
          onClick={() => venue.id && onDelete(venue.id)}
          className="w-8 h-8 rounded-lg bg-white shadow-md flex items-center justify-center text-[#596061] hover:text-[#E53935] transition-colors"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}
