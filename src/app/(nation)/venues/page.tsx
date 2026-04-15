"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import { db } from '@/lib/firebase/clientApp';
import { collection, query, orderBy, onSnapshot, where } from 'firebase/firestore';
import { useLocation } from '@/components/providers/LocationProvider';
import { CITY_COORDINATES, DEFAULT_COORDINATES } from '@/lib/constants/locations';
import PageWrapper from '@/components/layout/PageWrapper';
import ManageEntry from '@/components/venues/ManageEntry';

interface Venue {
  id: string;
  name: string;
  nativeName?: string;
  category: string;
  categories?: string[];
  address: string;
  city: string;
  country: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  description?: string;
  imageUrl?: string;
}

const mapContainerStyle = {
  width: '100%',
  height: '100%'
};

const libraries: ("places" | "drawing" | "geometry" | "visualization")[] = ["places"];

// Editorial Map Style (Silver/Clean)
const MAP_OPTIONS = {
  disableDefaultUI: true,
  zoomControl: false,
  styles: [
    { elementType: "geometry", stylers: [{ color: "#f5f5f5" }] },
    { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
    { elementType: "labels.text.fill", stylers: [{ color: "#616161" }] },
    { elementType: "labels.text.stroke", stylers: [{ color: "#f5f5f5" }] },
    { featureType: "administrative.land_parcel", elementType: "labels.text.fill", stylers: [{ color: "#bdbdbd" }] },
    { featureType: "poi", elementType: "geometry", stylers: [{ color: "#eeeeee" }] },
    { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#757575" }] },
    { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#e5e5e5" }] },
    { featureType: "road", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
    { featureType: "road.arterial", elementType: "labels.text.fill", stylers: [{ color: "#757575" }] },
    { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#dadada" }] },
    { featureType: "road.highway", elementType: "labels.text.fill", stylers: [{ color: "#616161" }] },
    { featureType: "water", elementType: "geometry", stylers: [{ color: "#c9c9c9" }] },
    { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#9e9e9e" }] },
  ]
};

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

  // Center based on global location
  const currentCenter = useMemo(() => {
    const cityKey = location.city.toUpperCase();
    return CITY_COORDINATES[cityKey] || DEFAULT_COORDINATES;
  }, [location.city]);

  // Fetch Venues filtered by City/Country
  useEffect(() => {
    setLoading(true);
    // Note: In a real production app, we query by city/country fields.
    // To handle initial legacy data, we fetch all first but ideally use 'where("city", "==", location.city)'
    const q = query(collection(db, "venues"), orderBy("createdAt", "desc"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const venueData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Venue[];
      
      // Client-side filtering for city if fields are missing, or strict filtering if present
      const filtered = venueData.filter(v => 
        !v.city || v.city.toUpperCase() === location.city.toUpperCase()
      );
      
      setVenues(filtered);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [location.city, location.country]);

  // Secondary Filter Logic (Category & Search)
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

  // Pan to center when location changes
  useEffect(() => {
    if (map) {
      map.panTo({ lat: currentCenter.lat, lng: currentCenter.lng });
      map.setZoom(currentCenter.zoom);
    }
  }, [currentCenter, map]);

  const categories = ['All', 'Studio', 'Academy', 'Club', 'Shop', 'Service', 'Other'];

  if (loadError) return <div className="p-10 text-center">Error loading maps. Check API Key.</div>;

  return (
    <PageWrapper>
      <div className="flex flex-col h-[calc(100vh-72px)] bg-surface font-manrope overflow-hidden pb-[72px]">
        {/* Editorial Header */}
        <div className="bg-white px-6 pt-5 pb-5 shrink-0">
          <div className="flex justify-between items-baseline mb-5">
            <div>
              <span className="text-[10px] font-black tracking-[0.2em] text-primary uppercase mb-1 block">Spaces in</span>
              <h1 className="text-3xl font-black text-on-surface tracking-tighter uppercase">{location.city}</h1>
            </div>
            <span className="text-[12px] font-bold text-on-surface/30">{filteredVenues.length} Results</span>
          </div>

          <div className="relative mb-6">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface/20 text-xl">search</span>
            <input 
              type="text" 
              placeholder={`Search around ${location.city}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-on-surface/[0.03] border-none rounded-2xl py-4 pl-12 pr-4 text-[14px] focus:ring-1 focus:ring-primary/30 transition-all font-medium placeholder:text-on-surface/20"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar shrink-0">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`flex-shrink-0 px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                  activeCategory === cat 
                  ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-[1.02]' 
                  : 'bg-on-surface/[0.03] text-on-surface/40 hover:text-on-surface'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Map View */}
        <div className="relative flex-grow bg-on-surface/[0.02] border-t border-on-surface/[0.05]">
          {isLoaded ? (
            <GoogleMap
              mapContainerStyle={mapContainerStyle}
              center={{ lat: currentCenter.lat, lng: currentCenter.lng }}
              zoom={currentCenter.zoom}
              onLoad={(m) => setMap(m)}
              options={{
                disableDefaultUI: true,
                zoomControl: false,
                mapId: "425069951fef97d91810ab94"
              }}
            >
              {filteredVenues.map((venue) => (
                <Marker
                  key={venue.id}
                  position={{ lat: venue.coordinates.latitude, lng: venue.coordinates.longitude }}
                  onClick={() => setSelectedVenue(venue)}
                  icon={{
                    path: google.maps.SymbolPath.CIRCLE,
                    fillColor: selectedVenue?.id === venue.id ? "#0061ff" : "#ffffff",
                    fillOpacity: 1,
                    strokeWeight: 4,
                    strokeColor: selectedVenue?.id === venue.id ? "#ffffff" : "#0061ff",
                    scale: selectedVenue?.id === venue.id ? 10 : 7,
                  }}
                />
              ))}

              {selectedVenue && (
                <InfoWindow
                  position={{ lat: selectedVenue.coordinates.latitude, lng: selectedVenue.coordinates.longitude }}
                  onCloseClick={() => setSelectedVenue(null)}
                >
                  <div className="p-4 min-w-[220px] bg-white rounded-3xl font-manrope border-none shadow-none">
                    <span className="text-[9px] font-black text-primary uppercase tracking-widest mb-1 block">{selectedVenue.category}</span>
                    <h3 className="font-black text-lg text-on-surface leading-tight uppercase tracking-tighter mb-1">{selectedVenue.name}</h3>
                    <p className="text-[11px] text-on-surface/40 flex items-start gap-1">
                      <span className="material-symbols-outlined text-[14px]">location_on</span>
                      {selectedVenue.address}
                    </p>
                    <button 
                      className="w-full mt-4 py-3 bg-on-surface/[0.03] hover:bg-primary hover:text-white text-on-surface text-[10px] font-black uppercase tracking-widest rounded-xl transition-all"
                      onClick={() => setSelectedVenue(selectedVenue)}
                    >
                      View Profile
                    </button>
                  </div>
                </InfoWindow>
              )}
            </GoogleMap>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          )}
        </div>

        {/* Horizontal Venue List (Editorial Style) */}
        <div className="bg-white border-t border-on-surface/[0.05] pt-5 pb-8 shrink-0">
          <div className="px-6 flex justify-between items-center mb-4">
            <h2 className="text-[14px] font-black text-on-surface uppercase tracking-tight">Community Spaces</h2>
            <button 
              onClick={() => setIsEditModalOpen(true)}
              className="text-[11px] font-black text-primary uppercase tracking-widest flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-sm">add</span>
              Register Space
            </button>
          </div>
          
          <div className="flex gap-4 overflow-x-auto px-6 no-scrollbar">
            {filteredVenues.map((venue) => (
              <div 
                key={venue.id}
                onClick={() => {
                  setSelectedVenue(venue);
                  map?.panTo({ lat: venue.coordinates.latitude, lng: venue.coordinates.longitude });
                }}
                className={`flex-shrink-0 w-[280px] p-4 rounded-[28px] border transition-all active:scale-[0.98] ${
                  selectedVenue?.id === venue.id 
                  ? 'border-primary bg-primary/[0.02]' 
                  : 'border-on-surface/[0.05] bg-on-surface/[0.01] hover:border-on-surface/20'
                }`}
              >
                <div className="flex gap-4">
                  <div className="w-20 h-20 rounded-2xl bg-on-surface/[0.05] overflow-hidden shrink-0">
                    {venue.imageUrl ? (
                      <img src={venue.imageUrl} alt={venue.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-on-surface/10">
                        <span className="material-symbols-outlined text-3xl">image</span>
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex flex-col justify-center">
                    <span className="text-[9px] font-black text-primary uppercase tracking-widest mb-0.5">{venue.category}</span>
                    <h4 className="font-black text-[15px] text-on-surface leading-snug uppercase truncate">{venue.name}</h4>
                    <p className="text-[11px] text-on-surface/40 mt-1 truncate">{venue.address}</p>
                  </div>
                </div>
              </div>
            ))}
            {filteredVenues.length === 0 && !loading && (
              <div className="w-full py-6 text-center text-on-surface/20">
                <p className="text-[12px] font-bold italic tracking-tight">No spaces registered in {location.city} yet.</p>
              </div>
            )}
          </div>
        </div>

        <ManageEntry
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
        />
      </div>
    </PageWrapper>
  );
}
