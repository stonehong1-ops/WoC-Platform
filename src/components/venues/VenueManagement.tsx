'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Settings, Search, SlidersHorizontal, ChevronLeft, MapPin } from 'lucide-react';
import { venueService } from '@/lib/firebase/venueService';
import { Venue } from '@/types/venue';
import VenueItem from './VenueItem';
import VenueForm from './VenueForm';

export default function VenueManagement() {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingVenue, setEditingVenue] = useState<Venue | null>(null);
  const [isManagementMode, setIsManagementMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const unsubscribe = venueService.subscribeVenues((data) => {
      setVenues(data);
    });
    return () => unsubscribe();
  }, []);

  const handleEdit = (venue: Venue) => {
    setEditingVenue(venue);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to remove this venue? This action cannot be undone.')) {
      try {
        await venueService.deleteVenue(id);
      } catch (error) {
        console.error('Delete failed:', error);
      }
    }
  };

  const filteredVenues = venues.filter(v => 
    v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isManagementMode) {
    return (
      <>
        {/* Management Trigger (Gear) - Stays Top Right with Zoom Controls */}
        <button 
          onClick={() => setIsManagementMode(true)}
          className="w-12 h-12 bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-[#dde4e5] flex items-center justify-center text-[#596061] hover:text-[#1A73E8] transition-all hover:scale-105 active:scale-95"
          title="Manage Venues"
        >
          <Settings size={22} className="animate-spin-slow" />
        </button>

        {/* Global Add Button (Rounded +) - ABSOLUTE BOTTOM RIGHT FLOATING */}
        <div className="fixed bottom-28 right-6 z-[100]">
          <button 
            onClick={() => {
              setEditingVenue(null);
              setIsFormOpen(true);
            }}
            className="w-16 h-16 bg-[#1A73E8] text-white rounded-full shadow-[0_12px_24px_rgba(26,115,232,0.4)] flex items-center justify-center hover:scale-110 active:scale-90 transition-all group pointer-events-auto"
            title="Register New Venue"
          >
            <Plus size={32} className="group-hover:rotate-90 transition-transform duration-300" />
          </button>
        </div>

        {/* Venue Form Modal */}
        <VenueForm 
          isOpen={isFormOpen} 
          onClose={() => setIsFormOpen(false)} 
          initialData={editingVenue} 
        />
      </>
    );
  }

  return (
    <div className="fixed inset-0 z-[60] bg-white flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 flex items-center gap-4 bg-white/80 backdrop-blur-md border-b border-[#f0f2f5] sticky top-0 z-10">
        <button 
          onClick={() => setIsManagementMode(false)}
          className="w-10 h-10 rounded-full bg-[#f0f2f5] flex items-center justify-center text-[#596061]"
        >
          <ChevronLeft size={20} />
        </button>
        <div>
          <h1 className="font-headline font-black text-lg text-[#2d3435] leading-none uppercase tracking-tight">
            Venue Management
          </h1>
          <p className="text-[10px] font-bold text-[#1A73E8] uppercase tracking-widest mt-1">
            {venues.length} spaces listed globally
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button className="w-10 h-10 bg-[#f0f2f5] rounded-xl flex items-center justify-center text-[#596061]">
            <SlidersHorizontal size={18} />
          </button>
        </div>
      </div>

      {/* Search Bar Container */}
      <div className="px-6 py-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#596061]/40" size={18} />
          <input 
            type="text"
            placeholder="Search within your venues..."
            className="w-full bg-[#f7f7ff] border-none rounded-2xl py-4 pl-12 pr-4 text-sm font-medium focus:ring-2 focus:ring-[#1A73E8]/10 placeholder:text-[#596061]/30 transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Venue List */}
      <div className="flex-grow overflow-y-auto px-6 pb-32 no-scrollbar space-y-3">
        {filteredVenues.length > 0 ? (
          filteredVenues.map((venue) => (
            <VenueItem 
              key={venue.id} 
              venue={venue} 
              onEdit={handleEdit} 
              onDelete={handleDelete} 
            />
          ))
        ) : (
          <div className="py-20 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-[#f7f7ff] rounded-3xl flex items-center justify-center text-[#596061]/20 mb-4">
              <MapPin size={32} />
            </div>
            <h3 className="font-headline font-bold text-[#2d3435]">No venues found</h3>
            <p className="text-xs text-[#596061] mt-1 max-w-[200px]">
              Register your first community space to get started.
            </p>
          </div>
        )}
      </div>

      {/* Floating Add Button - Rounded Standard */}
      <div className="fixed bottom-10 right-6 z-[70]">
        <button 
          onClick={() => {
            setEditingVenue(null);
            setIsFormOpen(true);
          }}
          className="w-16 h-16 bg-[#1A73E8] text-white rounded-full shadow-2xl shadow-[#1A73E8]/40 flex items-center justify-center hover:scale-110 active:scale-90 transition-all group"
        >
          <Plus size={32} className="group-hover:rotate-90 transition-transform duration-300" />
        </button>
      </div>

      {/* Venue Form Modal */}
      <VenueForm 
        isOpen={isFormOpen} 
        onClose={() => setIsFormOpen(false)} 
        initialData={editingVenue} 
      />

      <style jsx>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .animate-spin-slow {
          animation: spin 8s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
