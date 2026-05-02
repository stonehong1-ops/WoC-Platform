"use client";

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { useJsApiLoader } from '@react-google-maps/api';
import PageWrapper from '@/components/layout/PageWrapper';
import ManageEntry from '@/components/venues/ManageEntry';
import { venueService } from '@/lib/firebase/venueService';
import { Venue } from '@/types/venue';

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
  const [editingVenue, setEditingVenue] = useState<Venue | null>(null);
  const [editMode, setEditMode] = useState<'edit' | 'geo'>('edit');

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    mapIds: ["425069951fef97d91810ab94"],
    libraries
  });

  const handleRegisterOpen = () => {
    setEditingVenue(null);
    setEditMode('edit');
    setIsEditModalOpen(true);
  };

  const handleEdit = (venue: any, mode: 'edit' | 'geo' = 'edit') => {
    // Map minimal venue type to full Venue type if needed, 
    // but here we just pass it to ManageEntry which should handle it.
    setEditingVenue(venue as Venue);
    setEditMode(mode);
    setIsEditModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this venue?')) {
      try {
        await venueService.deleteVenue(id);
      } catch (error) {
        console.error('Failed to delete venue:', error);
        alert('Failed to delete venue.');
      }
    }
  };

  if (loadError) return <div className="p-10 text-center font-bold text-error">Error loading maps system.</div>;

  return (
    <PageWrapper>
      <div className="fixed inset-0 w-full overflow-hidden" style={{ top: 'var(--header-height, 120px)', bottom: 'calc(64px + max(env(safe-area-inset-bottom), 12px))' }}>
        <MapComponent 
          isLoaded={isLoaded}
          onRegisterOpen={handleRegisterOpen}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />

        <ManageEntry
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingVenue(null);
          }}
          isLoaded={isLoaded}
          initialData={editingVenue}
          mode={editMode}
        />
      </div>
    </PageWrapper>
  );
}
