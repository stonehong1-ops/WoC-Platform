"use client";

import React, { useState, useEffect, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useJsApiLoader } from '@react-google-maps/api';
import PageWrapper from '@/components/layout/PageWrapper';
import ManageEntry from '@/components/venues/ManageEntry';
import { venueService } from '@/lib/firebase/venueService';
import { Venue } from '@/types/venue';
import { useModalNavigation } from '@/hooks/useModalNavigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/clientApp';

// Defensive Architecture 2: Dynamically import MapComponent with ssr: false
const MapComponent = dynamic(() => import('@/components/venues/MapComponent'), { 
  ssr: false,
  loading: () => <div className="h-screen w-full bg-background flex items-center justify-center">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#005BC0]"></div>
  </div>
});

const libraries: ("places" | "drawing" | "geometry" | "visualization")[] = ["places"];

function VenuesPageContent() {
  const { isOpen: isEditModalOpen, value: editId, openModal: openEdit, closeModal: closeEdit } = useModalNavigation('editId');
  
  const [editingVenue, setEditingVenue] = useState<Venue | null>(null);
  const [editMode, setEditMode] = useState<'edit' | 'geo'>('edit');

  // Fetch editing venue if editId is present
  useEffect(() => {
    const fetchEditingVenue = async () => {
      if (!editId) {
        setEditingVenue(null);
        return;
      }
      try {
        const docRef = doc(db, "venues", editId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setEditingVenue({ id: docSnap.id, ...docSnap.data() } as Venue);
        }
      } catch (error) {
        console.error("Error fetching editing venue:", error);
      }
    };
    fetchEditingVenue();
  }, [editId]);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    mapIds: ["425069951fef97d91810ab94"],
    libraries
  });

  const handleRegisterOpen = () => {
    setEditingVenue(null);
    setEditMode('edit');
    openEdit('new');
  };

  // Listen to global compose event
  useEffect(() => {
    const handleComposeOpen = (e: CustomEvent) => {
      if (e.detail?.id === 'venues') {
        handleRegisterOpen();
      }
    };
    window.addEventListener('woc:compose:open', handleComposeOpen as EventListener);
    return () => window.removeEventListener('woc:compose:open', handleComposeOpen as EventListener);
  }, [openEdit]);

  const handleEdit = (venue: any, mode: 'edit' | 'geo' = 'edit') => {
    setEditMode(mode);
    openEdit(venue.id);
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
            closeEdit();
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

export default function VenuesPage() {
  return (
    <Suspense fallback={
      <div className="h-screen w-full bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#005BC0]"></div>
      </div>
    }>
      <VenuesPageContent />
    </Suspense>
  );
}
