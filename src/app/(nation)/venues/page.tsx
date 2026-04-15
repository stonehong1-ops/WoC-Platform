'use client';

import React, { useState, useEffect } from 'react';
import VenueManagement from '@/components/venues/VenueManagement';
import { Venue, venueService } from '@/lib/firebase/venueService';
import { MapPin, Navigation, Info, Search } from 'lucide-react';

export default function VenuesPage() {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [filteredVenues, setFilteredVenues] = useState<Venue[]>([]);
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Hongdae Station Coordinates (Center Point)
  const HONGDAE_CENTER = { lat: 37.5575, lng: 126.9245 };

  useEffect(() => {
    const unsubscribe = venueService.subscribeVenues((data) => {
      setVenues(data);
    });
    return () => unsubscribe();
  }, []);

  // Filter logic
  useEffect(() => {
    let result = venues;
    
    if (selectedCategory !== 'All') {
      result = result.filter(v => v.category === selectedCategory);
    }
    
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter(v => 
        v.name.toLowerCase().includes(lowerSearch) || 
        (v.nameNative && v.nameNative.toLowerCase().includes(lowerSearch)) ||
        v.address.toLowerCase().includes(lowerSearch)
      );
    }
    
    setFilteredVenues(result);
  }, [venues, searchTerm, selectedCategory]);

  return (
    <main className="relative h-screen flex flex-col pt-16 overflow-hidden bg-[#f0f2f5]">
      {/* Top Search & Filter Bar Section */}
      <div className="z-40 bg-white/80 backdrop-blur-xl border-b border-[#dde4e5] w-full flex flex-col">
        {/* Search Bar Area */}
        <div className="px-4 pt-3 pb-1">
          <div className="relative flex items-center">
            <Search size={18} className="absolute left-3 text-[#596061]/60" />
            <input
              className="w-full bg-[#f0f2f5] border-none rounded-xl py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-[#1A73E8]/10 placeholder:text-[#596061]/40 font-medium transition-all"
              placeholder="Search venues, studios, or events"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        {/* Filter Bar */}
        <div className="w-full overflow-x-auto no-scrollbar py-3 px-4 flex gap-2 items-center">
          {['All', 'Studio', 'Academy', 'Club', 'Shop', 'Service'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`flex items-center gap-1 flex-none px-4 py-1.5 rounded-full text-xs transition-all ${
                selectedCategory === cat 
                ? 'bg-[#1A73E8] text-[#f7f7ff] font-black shadow-lg shadow-[#1A73E8]/20' 
                : 'bg-white border border-[#acb3b4]/30 font-bold text-[#596061] hover:bg-[#f0f2f5]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content: Interactive Map */}
      <div className="relative flex-grow bg-[#dde4e5] overflow-hidden">
        {/* Stylized Hongdae Map Background (Representational) */}
        <div
          className="absolute inset-0 grayscale contrast-[0.8] opacity-80 transition-opacity duration-1000 ease-in-out"
          style={{
            backgroundColor: '#dde4e5',
            backgroundImage: "url('https://images.unsplash.com/photo-1596464716127-f2a82984de30?q=80&w=2070&auto=format&fit=crop')", // High quality but cached CDN map-like image
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        ></div>
        
        <div className="absolute inset-0 bg-blue-900/5 mix-blend-multiply pointer-events-none"></div>

        {/* Dynamic Flag Markers */}
        {filteredVenues.map((venue) => {
          // Calculate relative position based on Hongdae Center (Simplified Mapping)
          const yOffset = (venue.coordinates.lat - HONGDAE_CENTER.lat) * 5000 + 50; 
          const xOffset = (venue.coordinates.lng - HONGDAE_CENTER.lng) * 5000 + 50;
          
          return (
            <div 
              key={venue.id}
              className={`absolute transition-all duration-700 cursor-pointer group z-10 ${selectedVenue?.id === venue.id ? 'scale-125 z-20' : ''}`}
              style={{ 
                top: `${yOffset}%`, 
                left: `${xOffset}%`,
                display: (yOffset < 0 || yOffset > 100 || xOffset < 0 || xOffset > 100) ? 'none' : 'block'
              }}
              onClick={() => setSelectedVenue(venue)}
            >
              <div className="flex flex-col items-center">
                {/* Flag Design Pin */}
                <div className="relative">
                  <div className={`px-3 py-1.5 rounded-r-xl rounded-tl-xl shadow-2xl flex items-center gap-2 transition-all ${
                    selectedVenue?.id === venue.id ? 'bg-[#1A73E8] text-white' : 'bg-white text-[#2d3435]'
                  }`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${selectedVenue?.id === venue.id ? 'bg-white' : 'bg-[#1A73E8] animate-pulse'}`}></div>
                    <span className="text-[10px] font-black whitespace-nowrap uppercase tracking-tighter">
                      {venue.name}
                    </span>
                  </div>
                  {/* Flag Pole */}
                  <div className={`w-0.5 h-4 mx-auto -mt-0.5 ${selectedVenue?.id === venue.id ? 'bg-[#1A73E8]' : 'bg-[#1A73E8]/60'}`}></div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Home Button (Center on Hongdae) */}
        <button 
          onClick={() => setSelectedVenue(null)}
          className="absolute left-4 bottom-8 w-12 h-12 bg-white rounded-2xl shadow-xl border border-[#dde4e5] flex items-center justify-center text-[#1A73E8] active:scale-95 transition-all z-20"
        >
          <Navigation size={22} className={selectedVenue ? '' : 'fill-current'} />
        </button>

        {/* Map Interaction UI */}
        <div className="absolute right-4 top-4 flex flex-col gap-3 z-20">
          <VenueManagement />
          <div className="flex flex-col bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-[#dde4e5] overflow-hidden">
            <button className="w-12 h-12 flex items-center justify-center text-[#596061] hover:text-[#1A73E8] transition-colors">
              <span className="material-symbols-outlined text-[20px]">add</span>
            </button>
            <div className="h-[1px] bg-[#dde4e5] mx-2"></div>
            <button className="w-12 h-12 flex items-center justify-center text-[#596061] hover:text-[#1A73E8] transition-colors">
              <span className="material-symbols-outlined text-[20px]">remove</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Sheet */}
      <div 
        className="absolute bottom-0 left-0 w-full bg-white rounded-t-[32px] shadow-[0_-20px_40px_rgba(0,0,0,0.06)] z-50 flex flex-col transition-all duration-500 ease-out" 
        style={{ height: selectedVenue ? '65%' : '40%' }}
      >
        {/* Handle */}
        <div className="w-full flex justify-center py-4 cursor-pointer" onClick={() => selectedVenue && setSelectedVenue(null)}>
          <div className="w-12 h-1.5 bg-[#f0f2f5] rounded-full"></div>
        </div>

        {/* Content Area */}
        <div className="px-6 flex flex-col h-full overflow-hidden">
          <div className="flex justify-between items-end mb-6">
            <div>
              <p className="text-[10px] font-black text-[#1A73E8] uppercase tracking-[0.2em] mb-1">
                {selectedVenue ? selectedVenue.category : 'Nearby Community'}
              </p>
              <h2 className="font-headline font-black text-2xl text-[#2d3435] leading-tight uppercase">
                {selectedVenue ? selectedVenue.name : `${filteredVenues.length} Spaces Found`}
              </h2>
            </div>
            {selectedVenue && (
              <button 
                onClick={() => setSelectedVenue(null)}
                className="text-[#596061] text-[10px] font-black uppercase tracking-widest border border-[#dde4e5] px-4 py-2 rounded-xl bg-[#f0f2f5]/50 active:scale-95 transition-all"
              >
                Back to List
              </button>
            )}
          </div>

          {/* List or Detail View */}
          <div className="flex-grow overflow-y-auto pb-32 no-scrollbar space-y-8">
            {selectedVenue ? (
              <div className="animate-in fade-in slide-in-from-bottom-8 duration-500">
                <div className="w-full h-56 bg-[#f0f2f5] rounded-[32px] overflow-hidden mb-8 shadow-inner">
                  <img 
                    src={selectedVenue.imageUrl || 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&q=80'} 
                    alt={selectedVenue.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="space-y-8">
                  <div className="flex items-start gap-5">
                    <div className="w-12 h-12 bg-[#f7f7ff] rounded-2xl flex items-center justify-center text-[#1A73E8] flex-none shadow-sm">
                      <MapPin size={22} />
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-[#596061] uppercase tracking-widest mb-1">Location Address</p>
                      <p className="text-base font-bold text-[#2d3435] leading-snug">{selectedVenue.address}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-5">
                    <div className="w-12 h-12 bg-[#f7f7ff] rounded-2xl flex items-center justify-center text-[#1A73E8] flex-none shadow-sm">
                      <Navigation size={22} />
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-[#596061] uppercase tracking-widest mb-1">Operator & Contact</p>
                      <p className="text-base font-bold text-[#2d3435] leading-snug">{selectedVenue.owner} • {selectedVenue.contact}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-4">
                    <div className="bg-[#f7f7ff] p-4 rounded-2xl">
                      <p className="text-[10px] font-bold text-[#596061] uppercase tracking-widest mb-1">Rating</p>
                      <div className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[#1A73E8] text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                        <span className="text-lg font-black text-[#2d3435]">{selectedVenue.rating || 'N/A'}</span>
                      </div>
                    </div>
                    <div className="bg-[#f7f7ff] p-4 rounded-2xl">
                      <p className="text-[10px] font-bold text-[#596061] uppercase tracking-widest mb-1">Price</p>
                      <p className="text-base font-black text-[#1A73E8]">{selectedVenue.price || 'Contact'}</p>
                    </div>
                  </div>
                  <button className="w-full py-5 bg-[#1A73E8] text-white rounded-3xl font-black text-sm shadow-2xl shadow-[#1A73E8]/30 flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all">
                    <Info size={20} />
                    EXPLORE FULL PROFILE
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                {filteredVenues.map((venue) => (
                  <div 
                    key={venue.id} 
                    className="flex gap-6 p-2 rounded-3xl hover:bg-[#f7f7ff] transition-all group cursor-pointer"
                    onClick={() => setSelectedVenue(venue)}
                  >
                    <div className="w-28 h-28 rounded-[24px] overflow-hidden flex-none bg-[#f0f2f5] shadow-sm">
                      <img
                        alt={venue.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        src={venue.imageUrl || 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=300&q=80'}
                      />
                    </div>
                    <div className="flex flex-col justify-center flex-grow min-w-0 pr-2">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[9px] font-black uppercase tracking-[0.15em] px-2.5 py-1 bg-white border border-[#dde4e5] text-[#1A73E8] rounded-md shadow-sm">
                          {venue.category}
                        </span>
                        {venue.rating && (
                          <div className="flex items-center gap-1 ml-auto">
                            <span className="material-symbols-outlined text-[14px] text-[#1A73E8]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                            <span className="text-[11px] font-black">{venue.rating}</span>
                          </div>
                        )}
                      </div>
                      <h3 className="font-headline font-black text-[#2d3435] text-lg leading-tight uppercase tracking-tight truncate group-hover:text-[#1A73E8] transition-colors">
                        {venue.name}
                      </h3>
                      <p className="text-[#596061] text-xs font-medium mt-1 truncate leading-relaxed">{venue.address}</p>
                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-[#1A73E8] font-black text-[11px] tracking-wider uppercase">
                          {venue.price || 'INQUIRE NOW'}
                        </span>
                        <span className="material-symbols-outlined text-[#dde4e5] group-hover:text-[#1A73E8] transition-colors">arrow_forward</span>
                      </div>
                    </div>
                  </div>
                ))}
                {filteredVenues.length === 0 && (
                  <div className="py-20 text-center">
                    <p className="font-headline font-black text-[#dde4e5] text-4xl mb-4">NO SPACES</p>
                    <p className="text-[#596061] font-bold text-sm">Try adjusting your filters or search term.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </main>
  );
}
