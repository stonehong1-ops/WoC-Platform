"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import { db } from '@/lib/firebase/clientApp';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import PageWrapper from '@/components/layout/PageWrapper';
import ManageEntry from '@/components/venues/ManageEntry';

interface Venue {
  id: string;
  name: string;
  nativeName?: string;
  category: string;
  address: string;
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

const center = {
  lat: 37.5575, // Hongdae Station
  lng: 126.9245
};

const libraries: ("places" | "drawing" | "geometry" | "localContext" | "visualizationOrders")[] = ["places"];

export default function VenuesPage() {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [filteredVenues, setFilteredVenues] = useState<Venue[]>([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries
  });

  // Fetch Venues from Firestore
  useEffect(() => {
    const q = query(collection(db, "venues"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const venueData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Venue[];
      setVenues(venueData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Filter Logic
  useEffect(() => {
    let result = venues;
    if (activeCategory !== 'All') {
      result = result.filter(v => v.category === activeCategory);
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(v => 
        v.name.toLowerCase().includes(term) || 
        v.nativeName?.toLowerCase().includes(term) ||
        v.address.toLowerCase().includes(term)
      );
    }
    setFilteredVenues(result);
  }, [venues, activeCategory, searchTerm]);

  const categories = ['All', 'Studio', 'Academy', 'Club', 'Shop', 'Service', 'Other'];

  if (loadError) {
    return <div>Error loading maps</div>;
  }

  return (
    <PageWrapper>
      <div className="flex flex-col h-screen bg-[#f8f9fa] font-manrope">
        {/* Search & Tabs Header */}
        <div className="bg-white px-4 pt-6 pb-4 border-b border-gray-100 z-10 shadow-sm">
          <div className="relative mb-4">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">search</span>
            <input 
              type="text" 
              placeholder="Search venues, studios, or events"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#f1f3f4] border-none rounded-2xl py-3 pl-12 pr-4 text-sm focus:ring-2 focus:ring-[#0061ff] transition-all"
            />
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`flex-shrink-0 px-5 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                  activeCategory === cat 
                  ? 'bg-[#0061ff] text-white shadow-md' 
                  : 'bg-white text-gray-500 border border-gray-200 hover:border-gray-400'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Main Content: Interactive Google Map */}
        <div className="relative flex-grow overflow-hidden">
          {isLoaded ? (
            <GoogleMap
              mapContainerStyle={mapContainerStyle}
              center={center}
              zoom={15}
              options={{
                disableDefaultUI: true,
                zoomControl: true,
                styles: [
                  {
                    featureType: "all",
                    elementType: "geometry",
                    stylers: [{ color: "#f5f5f5" }]
                  },
                  {
                    featureType: "water",
                    elementType: "geometry",
                    stylers: [{ color: "#e9e9e9" }]
                  }
                ]
              }}
            >
              {filteredVenues.map((venue) => (
                <Marker
                  key={venue.id}
                  position={{ lat: venue.coordinates.latitude, lng: venue.coordinates.longitude }}
                  onClick={() => setSelectedVenue(venue)}
                  icon={{
                    path: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z",
                    fillColor: selectedVenue?.id === venue.id ? "#ff3b30" : "#0061ff",
                    fillOpacity: 1,
                    strokeWeight: 2,
                    strokeColor: "#ffffff",
                    scale: 1.5,
                    anchor: new google.maps.Point(12, 22)
                  }}
                />
              ))}

              {selectedVenue && (
                <InfoWindow
                  position={{ lat: selectedVenue.coordinates.latitude, lng: selectedVenue.coordinates.longitude }}
                  onCloseClick={() => setSelectedVenue(null)}
                >
                  <div className="p-2 max-w-[200px]">
                    <h3 className="font-bold text-sm text-gray-900">{selectedVenue.name}</h3>
                    <p className="text-[10px] text-gray-500 mt-1">{selectedVenue.address}</p>
                    <button 
                      className="mt-2 text-[#0061ff] text-[10px] font-bold"
                      onClick={() => {/* Detail logic */}}
                    >
                      VIEW DETAILS
                    </button>
                  </div>
                </InfoWindow>
              )}
            </GoogleMap>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-[#f1f3f4]">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0061ff]"></div>
            </div>
          )}
        </div>

        {/* List Sheet (Bottom) */}
        <div className="bg-white rounded-t-3xl shadow-[0_-10px_30px_rgba(0,0,0,0.05)] px-6 pt-3 pb-8 z-10">
          <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6"></div>
          <div className="flex justify-between items-end mb-4">
            <div>
              <p className="text-[10px] font-black tracking-widest text-[#0061ff] uppercase mb-1">Nearby Community</p>
              <h2 className="text-2xl font-black text-gray-800 tracking-tighter uppercase">{filteredVenues.length} Spaces Found</h2>
            </div>
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="text-xs text-gray-400 hover:text-gray-600 transition-colors underline underline-offset-4"
              >
                Clear Search
              </button>
            )}
          </div>
          
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
            {filteredVenues.map((venue) => (
              <div 
                key={venue.id}
                onClick={() => setSelectedVenue(venue)}
                className={`flex-shrink-0 w-64 p-4 rounded-2xl border transition-all ${
                  selectedVenue?.id === venue.id 
                  ? 'border-[#0061ff] bg-[#0061ff]/5' 
                  : 'border-gray-100 hover:border-gray-300 bg-[#fbfbfb]'
                }`}
              >
                <div className="flex gap-4">
                  <div className="w-16 h-16 rounded-xl bg-gray-200 overflow-hidden flex-shrink-0">
                    {venue.imageUrl ? (
                      <img src={venue.imageUrl} alt={venue.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-300">
                        <span className="material-symbols-outlined">image</span>
                      </div>
                    )}
                  </div>
                  <div className="overflow-hidden">
                    <h4 className="font-bold text-gray-900 truncate">{venue.name}</h4>
                    <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-tighter font-semibold">{venue.category}</p>
                    <p className="text-[11px] text-gray-400 mt-2 truncate">{venue.address}</p>
                  </div>
                </div>
              </div>
            ))}
            {filteredVenues.length === 0 && !loading && (
              <div className="w-full py-12 text-center text-gray-400">
                <p className="text-sm">No venues found in this area.</p>
              </div>
            )}
          </div>
        </div>

        {/* Floating Action Button (FAB): Add Venue */}
        <button
          onClick={() => setIsEditModalOpen(true)}
          className="fixed bottom-32 right-6 w-14 h-14 bg-[#0061ff] text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-20"
        >
          <span className="material-symbols-outlined text-2xl">add</span>
        </button>

        {/* Integrated Entry/Edit Modal */}
        <ManageEntry
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
        />
      </div>

      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </PageWrapper>
  );
}
