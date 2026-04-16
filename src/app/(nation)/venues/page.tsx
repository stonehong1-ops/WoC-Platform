"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import { db } from '@/lib/firebase/clientApp';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { useLocation } from '@/components/providers/LocationProvider';
import { CITY_COORDINATES, DEFAULT_COORDINATES } from '@/lib/constants/locations';
import PageWrapper from '@/components/layout/PageWrapper';
import ManageEntry from '@/components/venues/ManageEntry';
import { motion, AnimatePresence } from 'framer-motion';

interface Venue {
  id: string;
  name: string;
  nativeName?: string;
  category: string;
  categories?: string[];
  address: string;
  detailAddress?: string;
  city: string;
  country: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  description?: string;
  imageUrl?: string;
  ownerName?: string;
}

const libraries: ("places" | "drawing" | "geometry" | "visualization")[] = ["places"];

export default function VenuesPage() {
  const { location } = useLocation();
  const [venues, setVenues] = useState<Venue[]>([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [map, setMap] = useState<google.maps.Map | null>(null);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    mapIds: ["425069951fef97d91810ab94"],
    libraries
  });

  const currentCenter = useMemo(() => {
    const cityKey = location.city.toUpperCase();
    return CITY_COORDINATES[cityKey] || DEFAULT_COORDINATES;
  }, [location.city]);

  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, "venues"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const venueData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Venue[];
      
      const filtered = venueData.filter(v => 
        !v.city || v.city.toUpperCase() === location.city.toUpperCase()
      );
      
      setVenues(filtered);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [location.city]);

  const filteredVenues = useMemo(() => {
    return venues.filter(v => {
      const matchCategory = activeCategory === 'All' || 
                           v.category === activeCategory || 
                           (v.categories && v.categories.includes(activeCategory));
      const matchSearch = !searchTerm || 
        v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.address.toLowerCase().includes(searchTerm.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [venues, activeCategory, searchTerm]);

  useEffect(() => {
    if (map) {
      map.panTo({ lat: currentCenter.lat, lng: currentCenter.lng });
      map.setZoom(currentCenter.zoom);
    }
  }, [currentCenter, map]);

  const categories = ['All', 'Studio', 'Academy', 'Club', 'Shop', 'Service', 'Stay'];

  if (loadError) return <div className="p-10 text-center">Error loading maps. Check API Key.</div>;

  return (
    <PageWrapper>
      <div className="relative h-[calc(100vh-72px)] w-full overflow-hidden bg-[#f4fbfb] select-none">
        
        {/* Layer 1: Full-screen Map */}
        <div className="absolute inset-0 z-0">
          {isLoaded ? (
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
                  position={{ lat: venue.coordinates.latitude, lng: venue.coordinates.longitude }}
                  onClick={() => {
                    setSelectedVenue(venue);
                    map?.panTo({ lat: venue.coordinates.latitude, lng: venue.coordinates.longitude });
                  }}
                  icon={{
                    path: google.maps.SymbolPath.CIRCLE,
                    fillColor: selectedVenue?.id === venue.id ? "#005BC0" : "#005BC0",
                    fillOpacity: 1,
                    strokeWeight: selectedVenue?.id === venue.id ? 4 : 2,
                    strokeColor: "#ffffff",
                    scale: selectedVenue?.id === venue.id ? 10 : 7,
                  }}
                />
              ))}
            </GoogleMap>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-surface-container">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          )}
        </div>

        {/* Layer 2: Overlay Search & Filters */}
        <div className="absolute top-6 left-1/2 -translate-x-1/2 w-[92%] max-w-lg z-20 flex flex-col gap-3 pointer-events-none">
          {/* Search Bar */}
          <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-[0px_12px_32px_rgba(22,29,30,0.06)] px-5 py-3.5 flex items-center gap-3 pointer-events-auto border border-white/40">
            <span className="material-symbols-outlined text-[#727784] text-[20px]">search</span>
            <input 
              type="text" 
              placeholder={`Search around ${location.city.toUpperCase()}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent border-none focus:ring-0 text-[#2D3435] placeholder:text-[#727784]/60 w-full text-[15px] font-semibold font-body"
            />
          </div>
          
          {/* Subtle Filters */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar px-1 pointer-events-auto">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`flex-shrink-0 px-4 py-1.5 rounded-full text-[12px] font-bold transition-all border ${
                  activeCategory === cat 
                  ? 'bg-[#005BC0] text-white border-[#005BC0] shadow-md' 
                  : 'bg-white/40 backdrop-blur-sm text-[#2D3435]/80 border-white/20 hover:bg-white/60'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Layer 3: Draggable Bottom Sheet */}
        <motion.div 
          initial={{ y: "65%" }}
          animate={{ y: "65%" }}
          drag="y"
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={0.05}
          onDrag={(e, info) => {
            // Drag logic for full expansion if needed
          }}
          style={{ height: '100%', top: '15%' }}
          className="absolute left-0 w-full z-40"
        >
          <div className="h-full bg-white/95 backdrop-blur-xl rounded-t-[2.5rem] shadow-[0px_-12px_32px_rgba(22,29,30,0.06)] flex flex-col pt-3 border-t border-white/40">
            {/* Grab Handle */}
            <div className="w-12 h-1.5 bg-[#dde4e5] rounded-full mx-auto mb-6 shrink-0"></div>

            <div className="px-6 flex flex-col h-full overflow-hidden">
              {/* Bottom Sheet Header */}
              <div className="flex items-center justify-between mb-5 shrink-0">
                <h2 className="text-[17px] font-bold font-headline tracking-tight text-[#2D3435]">
                  <span className="text-[#005BC0] mr-1">{filteredVenues.length}</span> 
                  Venues found
                </h2>
                <button 
                  onClick={() => setIsEditModalOpen(true)}
                  className="bg-[#005BC0] text-white px-4 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
                >
                  <span className="material-symbols-outlined text-[18px]">add</span>
                  <span className="text-[11px] font-bold">Register</span>
                </button>
              </div>

              {/* Venue List */}
              <div className="flex-grow overflow-y-auto no-scrollbar pb-32">
                <div className="space-y-3">
                  {filteredVenues.map((venue) => (
                    <div 
                      key={venue.id}
                      onClick={() => {
                        setSelectedVenue(venue);
                        map?.panTo({ lat: venue.coordinates.latitude, lng: venue.coordinates.longitude });
                        map?.setZoom(17);
                      }}
                      className={`flex items-center gap-3 p-3 rounded-2xl border transition-all active:scale-[0.98] ${
                        selectedVenue?.id === venue.id 
                        ? 'bg-[#005BC0]/05 border-[#005BC0]/20' 
                        : 'bg-[#f4fbfb]/40 border-transparent hover:bg-[#f4fbfb]/80'
                      }`}
                    >
                      <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-surface-container">
                        {venue.imageUrl ? (
                          <img src={venue.imageUrl} alt={venue.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[#727784]/20">
                            <span className="material-symbols-outlined text-xl">image</span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="text-[14px] font-bold text-[#2D3435] truncate uppercase tracking-tight">{venue.name}</h3>
                          <div className="flex gap-1 shrink-0">
                            <span className="px-1.5 py-0.5 bg-[#dde4e5] rounded text-[9px] font-bold text-[#424753] uppercase tracking-wider">
                              {venue.category}
                            </span>
                          </div>
                        </div>
                        <p className="text-[11px] text-[#727784] font-semibold truncate mt-0.5">
                          {venue.ownerName || 'Unknown Host'} • {venue.address}
                        </p>
                      </div>
                    </div>
                  ))}
                  {filteredVenues.length === 0 && !loading && (
                    <div className="py-20 text-center">
                      <p className="text-[13px] font-bold text-[#2D3435]/20 italic">No venues in this area.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <ManageEntry
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
        />
      </div>
    </PageWrapper>
  );
}
