"use client";

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { useJsApiLoader } from '@react-google-maps/api';
import PageWrapper from '@/components/layout/PageWrapper';
import ManageEntry from '@/components/venues/ManageEntry';

// Defensive Architecture 2: Dynamically import MapComponent with ssr: false
const MapComponent = dynamic(() => import('@/components/venues/MapComponent'), { 
  ssr: false,
  loading: () => <div className="h-screen w-full bg-background flex items-center justify-center">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#005BC0]"></div>
  </div>
});

const libraries: ("places" | "drawing" | "geometry" | "visualization")[] = ["places"];

export default function VenuesPage() {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    mapIds: ["425069951fef97d91810ab94"],
    libraries
  });

  if (loadError) return <div className="p-10 text-center font-bold text-error">Error loading maps system.</div>;

  return (
    <PageWrapper>
      <div className="relative h-screen w-full -mt-16 sm:mt-0 overflow-hidden">
        <MapComponent 
          isLoaded={isLoaded}
          onRegisterOpen={() => setIsEditModalOpen(true)}
        />

        <ManageEntry
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          isLoaded={isLoaded}
        />
      </div>
    </PageWrapper>
  );
}
