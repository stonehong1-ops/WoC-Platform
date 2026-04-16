"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { GoogleMap, Marker, Autocomplete } from '@react-google-maps/api';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from '@/components/providers/LocationProvider';
import { db } from '@/lib/firebase/clientApp';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { CITY_COORDINATES, DEFAULT_COORDINATES } from '@/lib/constants/locations';

interface Venue {
  id: string;
  name: string;
  category: string;
  coordinates: { latitude: number; longitude: number; };
  address: string;
  city: string;
  status: string;
}

const mapContainerStyle = { width: '100%', height: '100dvh' };
const CIRCLE_PATH = 0;

export default function MapComponent({ onRegisterOpen, isLoaded }: { onRegisterOpen: () => void; isLoaded: boolean; }) {
  const { location } = useLocation();
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  const categories = ['All', 'Studio', 'Academy', 'Club', 'Shop', 'Cafe', 'Eats', 'Beauty', 'Stay'];

  useEffect(() => {
    if (!location?.city) return;
    const q = query(collection(db, "venues"), where("city", "==", location.city.toUpperCase()));
    return onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Venue));
      setVenues(docs.filter(v => v.coordinates?.latitude && v.coordinates?.longitude));
    });
  }, [location?.city]);

  const filteredVenues = useMemo(() => {
    return venues.filter(v => {
      const matchCat = activeCategory === 'All' || v.category === activeCategory;
      const matchSearch = v.name.toLowerCase().includes(searchTerm.toLowerCase()) || v.address.toLowerCase().includes(searchTerm.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [venues, activeCategory, searchTerm]);

  const handleEnterKey = () => {
    if (!searchTerm) return;
    const service = new google.maps.places.AutocompleteService();
    service.getPlacePredictions({ input: searchTerm }, (predictions) => {
      if (predictions && predictions.length > 0) {
        const ds = new google.maps.places.PlacesService(document.createElement('div'));
        ds.getDetails({ placeId: predictions[0].place_id }, (place) => {
          if (place?.geometry?.location) {
            map?.panTo(place.geometry.location);
            map?.setZoom(16);
            setSearchTerm(place.formatted_address || place.name || '');
          }
        });
      }
    });
  };

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#eef5f6]">
      {/* Layer 1: Floating Header - Main Search & Filters (Lowered further to ensure total header clearance) */}
      <div className="absolute top-36 left-6 right-6 z-50 flex flex-col gap-4 pointer-events-none animate-in fade-in slide-in-from-top-6 duration-1000">
        <div className="relative w-full pointer-events-auto">
          {isLoaded ? (
            <Autocomplete 
              onLoad={setAutocomplete} 
              onPlaceChanged={() => {
                if (autocomplete) {
                  const place = autocomplete.getPlace();
                  if (place.geometry?.location) {
                    map?.panTo(place.geometry.location);
                    map?.setZoom(16);
                    setSearchTerm(place.formatted_address || place.name || '');
                  }
                }
              }}
              options={{
                bounds: location?.city ? (() => {
                  const coords = CITY_COORDINATES[location.city.toUpperCase() as keyof typeof CITY_COORDINATES] || DEFAULT_COORDINATES;
                  return {
                    north: coords.lat + 0.1,
                    south: coords.lat - 0.1,
                    east: coords.lng + 0.1,
                    west: coords.lng - 0.1,
                  };
                })() : undefined,
                componentRestrictions: { country: "kr" }
              }}
            >
              <input 
                type="text" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleEnterKey()}
                placeholder="City, Zone, Place Name"
                className="w-full bg-white/80 backdrop-blur-3xl border-none rounded-3xl pl-12 pr-4 py-5 text-[#2D3435] font-black focus:bg-white focus:ring-4 focus:ring-[#005BC0]/5 shadow-[0_20px_48px_rgba(22,29,30,0.15)] transition-all text-[15px] outline-none placeholder:text-[#596061]/40"
              />
            </Autocomplete>
          ) : <div className="w-full h-16 bg-white/40 animate-pulse rounded-3xl" />}
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#005BC0] text-[22px]">search</span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar px-1 pointer-events-auto">
          {categories.map((cat) => (
            <button 
              key={cat} 
              onClick={() => setActiveCategory(cat)} 
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-[9.5px] font-black transition-all border uppercase tracking-[0.1em] ${
                activeCategory === cat 
                ? 'bg-[#005BC0] text-white border-[#005BC0] shadow-[0_4px_12px_rgba(0,91,192,0.3)]' 
                : 'bg-white/50 backdrop-blur-md text-[#596061] border-white/20 hover:bg-white/80'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Layer 0: Map */}
      <div className="w-full h-full -mt-16">
        {isLoaded ? (
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={
              location?.city 
              ? (CITY_COORDINATES[location.city.toUpperCase() as keyof typeof CITY_COORDINATES] || DEFAULT_COORDINATES)
              : DEFAULT_COORDINATES
            }
            zoom={14}
            onLoad={setMap}
            options={{ disableDefaultUI: true, mapId: "425069951fef97d91810ab94", gestureHandling: 'greedy' }}
          >
            {filteredVenues.map((v) => (
              <Marker key={v.id} position={{ lat: v.coordinates.latitude, lng: v.coordinates.longitude }} onClick={() => map?.panTo({ lat: v.coordinates.latitude, lng: v.coordinates.longitude })} icon={{ path: CIRCLE_PATH, fillColor: "#005BC0", fillOpacity: 1, strokeWeight: 4, strokeColor: "#ffffff", scale: 8 }} />
            ))}
          </GoogleMap>
        ) : <div className="w-full h-full flex items-center justify-center bg-[#f4fbfb]"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#005BC0]"></div></div>}
      </div>

      {/* Layer 2: Bottom Sheet - Venue List */}
      <motion.div initial={{ y: "65dvh" }} animate={{ y: "65dvh" }} drag="y" dragConstraints={{ top: 0, bottom: 0 }} dragElastic={0.05} style={{ height: '100dvh', top: '15dvh' }} className="absolute left-0 w-full z-40">
        <div className="h-full bg-white rounded-t-[2.5rem] shadow-[0px_-20px_48px_rgba(22,29,30,0.1)] flex flex-col pt-3 border-t border-white/40">
          <div className="w-12 h-1.5 bg-[#e8eff0] rounded-full mx-auto mb-7 shrink-0 cursor-grab active:cursor-grabbing"></div>
          <div className="px-6 flex flex-col h-full overflow-hidden">
            <div className="flex items-center justify-between mb-6 shrink-0">
              <h2 className="text-[17px] font-bold font-headline tracking-tighter text-[#2D3435] uppercase">
                <span className="text-[#005BC0] mr-1">{filteredVenues.length}</span> Venues in {location?.city || ''}
              </h2>
              <button onClick={onRegisterOpen} className="bg-[#005BC0] text-white px-6 py-3 rounded-2xl flex items-center gap-2 shadow-[0_8px_16px_rgba(0,91,192,0.25)] active:scale-90 transition-all z-10">
                <span className="material-symbols-outlined text-[18px]">add</span>
                <span className="text-[12px] font-black uppercase tracking-widest">Register</span>
              </button>
            </div>
            
            <div className="flex-grow overflow-y-auto no-scrollbar pb-40">
              <div className="grid grid-cols-1 gap-3">
                {filteredVenues.map((v) => (
                  <button key={v.id} onClick={() => { map?.panTo({ lat: v.coordinates.latitude, lng: v.coordinates.longitude }); map?.setZoom(17); }} className="flex items-center gap-4 p-4 bg-[#f4fbfb] hover:bg-[#eef5f6] rounded-2xl border border-transparent hover:border-[#dde4e5] transition-all group text-left">
                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-[#005BC0] font-black text-[10px] shadow-sm group-hover:scale-105 transition-transform uppercase">{v.category.slice(0,3)}</div>
                    <div className="flex-grow">
                      <h3 className="text-[14px] font-black text-[#2D3435] tracking-tight">{v.name}</h3>
                      <p className="text-[10px] text-[#596061] font-bold mt-0.5 line-clamp-1 opacity-70">{v.address}</p>
                    </div>
                    <span className="material-symbols-outlined text-[#c2c6d5] group-hover:text-[#005BC0] transition-colors">arrow_forward_ios</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
