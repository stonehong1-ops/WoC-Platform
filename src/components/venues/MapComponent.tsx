"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { GoogleMap, Marker, Autocomplete } from '@react-google-maps/api';
import { motion } from 'framer-motion';

interface Venue {
  id: string;
  name: string;
  category: string;
  categories?: string[];
  address: string;
  detailAddress?: string;
  city: string;
  country: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  imageUrl?: string;
  ownerName?: string;
}

interface MapComponentProps {
  venues: Venue[];
  currentCenter: { lat: number; lng: number; zoom: number };
  selectedVenue: Venue | null;
  onVenueSelect: (venue: Venue) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  activeCategory: string;
  setActiveCategory: (cat: string) => void;
  onRegisterOpen: () => void;
  location: { city: string; country: string };
  setLocation: (loc: { city: string; country: string }) => void;
}

const CIRCLE_PATH = 0;

export default function MapComponent({
  venues,
  currentCenter,
  selectedVenue,
  onVenueSelect,
  searchTerm,
  setSearchTerm,
  activeCategory,
  setActiveCategory,
  onRegisterOpen,
  location,
  setLocation
}: MapComponentProps) {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);

  const categories = ['All', 'Studio', 'Academy', 'Club', 'Shop', 'Cafe', 'Eats', 'Beauty', 'Stay', 'Other'];

  const onPlaceChanged = () => {
    if (autocomplete !== null) {
      const place = autocomplete.getPlace();
      if (place.geometry && place.geometry.location) {
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        map?.panTo({ lat, lng });
        map?.setZoom(15);

        let city = '';
        let country = '';
        place.address_components?.forEach(comp => {
          if (comp.types.includes('locality')) city = comp.long_name;
          if (comp.types.includes('country')) country = comp.long_name;
        });
        
        if (city && country) {
          setLocation({ city, country });
        }
      }
    }
  };

  const safeVenues = useMemo(() => {
    return venues.filter(v => v.coordinates && v.coordinates.latitude && v.coordinates.longitude);
  }, [venues]);

  const filteredVenues = useMemo(() => {
    return safeVenues.filter(v => {
      const matchCategory = activeCategory === 'All' || 
                           v.category === activeCategory || 
                           (v.categories && v.categories.includes(activeCategory));
      const matchSearch = !searchTerm || 
        v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.address.toLowerCase().includes(searchTerm.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [safeVenues, activeCategory, searchTerm]);

  return (
    <div className="relative h-screen w-full overflow-hidden bg-background select-none">
      
      {/* Map Layer */}
      <div className="absolute inset-0 z-0">
        <GoogleMap
          mapContainerStyle={{ width: '100%', height: '100%' }}
          center={{ lat: currentCenter.lat, lng: currentCenter.lng }}
          zoom={currentCenter.zoom}
          onLoad={(m) => setMap(m)}
          options={{
            disableDefaultUI: true,
            zoomControl: false,
            mapId: "425069951fef97d91810ab94",
            gestureHandling: 'greedy'
          }}
        >
          {filteredVenues.map((venue) => (
            <Marker
              key={venue.id}
              position={{ lat: venue.coordinates!.latitude, lng: venue.coordinates!.longitude }}
              onClick={() => onVenueSelect(venue)}
              icon={{
                path: CIRCLE_PATH,
                fillColor: selectedVenue?.id === venue.id ? "#005BC0" : "#005BC0",
                fillOpacity: 1,
                strokeWeight: selectedVenue?.id === venue.id ? 4 : 2,
                strokeColor: "#ffffff",
                scale: selectedVenue?.id === venue.id ? 10 : 7,
              }}
            />
          ))}
        </GoogleMap>
      </div>

      {/* Floating Controls */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[92%] max-w-lg z-20 flex flex-col gap-3 pointer-events-none">
        <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-[0px_12px_32px_rgba(22,29,30,0.06)] px-5 py-3.5 flex items-center gap-3 pointer-events-auto border border-white/40">
          <span className="material-symbols-outlined text-[#727784] text-[20px]">search</span>
          <Autocomplete 
            onLoad={(auto) => setAutocomplete(auto)} 
            onPlaceChanged={onPlaceChanged}
          >
            <input 
              type="text" 
              placeholder={`Search around ${location?.city?.toUpperCase() || ''}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent border-none focus:ring-0 text-[#161D1E] placeholder:text-[#727784]/60 w-full text-[15px] font-semibold font-body"
            />
          </Autocomplete>
        </div>
        
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar px-1 pointer-events-auto">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-[11px] font-bold transition-all border uppercase tracking-tight ${
                activeCategory === cat 
                ? 'bg-[#005BC0] text-white border-[#005BC0] shadow-md' 
                : 'bg-white/40 backdrop-blur-sm text-[#2D3435] border-white/20 hover:bg-white/60 font-black'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Bottom Sheet */}
      <motion.div 
        initial={{ y: "70dvh" }}
        animate={{ y: "70dvh" }}
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.05}
        style={{ height: '100dvh', top: '15dvh' }}
        className="absolute left-0 w-full z-40"
      >
        <div className="h-full bg-white rounded-t-[2.5rem] shadow-[0px_-12px_32px_rgba(22,29,30,0.06)] flex flex-col pt-3 border-t border-white/40">
          <div className="w-12 h-1.5 bg-[#e8eff0] rounded-full mx-auto mb-6 shrink-0 cursor-grab active:cursor-grabbing"></div>
          <div className="px-6 flex flex-col h-full overflow-hidden">
            <div className="flex items-center justify-between mb-5 shrink-0">
              <h2 className="text-[17px] font-bold font-headline tracking-tighter text-[#2D3435] uppercase">
                <span className="text-[#005BC0] mr-1">{filteredVenues.length}</span> 
                Venues in {location?.city || ''}
              </h2>
              <button 
                onClick={onRegisterOpen}
                className="bg-[#005BC0] text-white px-5 py-2.5 rounded-xl flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
                <span className="text-[11px] font-black uppercase tracking-tight">Register</span>
              </button>
            </div>

            <div className="flex-grow overflow-y-auto no-scrollbar pb-60">
              <div className="space-y-3">
                {filteredVenues.map((venue) => (
                  <div 
                    key={venue.id}
                    onClick={() => {
                      onVenueSelect(venue);
                      if (venue.coordinates) {
                        map?.panTo({ lat: venue.coordinates.latitude, lng: venue.coordinates.longitude });
                        map?.setZoom(17);
                      }
                    }}
                    className={`flex items-center gap-4 p-4 rounded-2xl border transition-all active:scale-[0.98] ${
                      selectedVenue?.id === venue.id 
                      ? 'bg-surface-container border-surface-tint/20' 
                      : 'bg-surface-container-low border-transparent hover:bg-surface-container'
                    }`}
                  >
                    <div className="w-14 h-14 rounded-2xl overflow-hidden shrink-0 bg-surface-container-highest">
                      {venue.imageUrl ? (
                        <img src={venue.imageUrl} alt={venue.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-outline/30">
                          <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 0" }}>image</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-[15px] font-extrabold text-on-surface truncate uppercase tracking-tight leading-none">{venue.name}</h3>
                        <span className="px-2 py-0.5 bg-surface-container-highest rounded text-[9px] font-black text-on-surface-variant uppercase tracking-widest shrink-0">
                          {venue.category}
                        </span>
                      </div>
                      <p className="text-[11px] text-on-surface-variant font-medium truncate mt-1">
                        {venue.ownerName || 'Unknown Host'} • {venue.address}
                      </p>
                    </div>
                  </div>
                ))}
                {filteredVenues.length === 0 && (
                  <div className="py-20 text-center">
                    <p className="text-[13px] font-bold text-outline/30 italic">No venues in this area.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
