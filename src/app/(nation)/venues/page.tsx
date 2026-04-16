"use client";

import React, { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useJsApiLoader } from '@react-google-maps/api';
import { db } from '@/lib/firebase/clientApp';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { useLocation } from '@/components/providers/LocationProvider';
import { CITY_COORDINATES, DEFAULT_COORDINATES } from '@/lib/constants/locations';
import PageWrapper from '@/components/layout/PageWrapper';
import ManageEntry from '@/components/venues/ManageEntry';

// Defensive Architecture 2: Dynamically import MapComponent with ssr: false
const MapComponent = dynamic(() => import('@/components/venues/MapComponent'), { 
  ssr: false,
  loading: () => <div className="h-screen w-full bg-background flex items-center justify-center">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-surface-tint"></div>
  </div>
});

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

// Defensive Architecture 1: Constant libraries array outside component
const libraries: ("places" | "drawing" | "geometry" | "visualization")[] = ["places"];

export default function VenuesPage() {
  const { location, setLocation } = useLocation();
  const [venues, setVenues] = useState<Venue[]>([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    mapIds: ["425069951fef97d91810ab94"],
    libraries
  });

  const currentCenter = useMemo(() => {
    if (!location?.city) return DEFAULT_COORDINATES;
    const cityKey = location.city.toUpperCase();
    return CITY_COORDINATES[cityKey] || DEFAULT_COORDINATES;
  }, [location?.city]);

  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, "venues"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const venueData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Venue[];
      
      const city = location?.city?.toUpperCase();
      const filtered = venueData.filter(v => {
        // Essential data check to prevent crash (Architecture 3)
        if (!v.name || !v.coordinates) return false;
        if (!city) return true;
        return !v.city || v.city.toUpperCase() === city;
      });
      
      setVenues(filtered);
      setLoading(false);
    }, (error) => {
      console.error("Firestore error:", error);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [location?.city]);

  if (loadError) return <div className="p-10 text-center font-bold text-error">Error loading maps system.</div>;

  return (
    <PageWrapper>
      <div className="relative h-screen w-full -mt-16 sm:mt-0 overflow-hidden">
        {isLoaded ? (
          <MapComponent 
            venues={venues}
            currentCenter={currentCenter}
            selectedVenue={selectedVenue}
            onVenueSelect={setSelectedVenue}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            activeCategory={activeCategory}
            setActiveCategory={setActiveCategory}
            onRegisterOpen={() => setIsEditModalOpen(true)}
            location={location}
            setLocation={setLocation}
          />
        ) : (
          <div className="h-screen w-full bg-background flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-surface-tint"></div>
          </div>
        )}

        <ManageEntry
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          isLoaded={isLoaded}
        />
      </div>
    </PageWrapper>
  );
}
