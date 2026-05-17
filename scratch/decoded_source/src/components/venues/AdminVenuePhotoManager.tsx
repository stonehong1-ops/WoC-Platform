'use client';

import React, { useState, useEffect, useRef } from 'react';
import { venueService } from '@/lib/firebase/venueService';
import { storageService } from '@/lib/firebase/storageService';
import { Venue } from '@/types/venue';

export default function AdminVenuePhotoManager() {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [fetchingId, setFetchingId] = useState<string | null>(null);
  const [fetchedPhotos, setFetchedPhotos] = useState<Record<string, string[]>>({});
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeUploadVenue, setActiveUploadVenue] = useState<Venue | null>(null);

  useEffect(() => {
    const unsubscribe = venueService.subscribeVenues((data) => {
      setVenues(data);
    });
    return () => unsubscribe();
  }, []);

  const handleFetchPhotos = async (venue: Venue) => {
    if (!venue.name && !venue.address) {
      alert('Venue needs a name or address to search.');
      return;
    }
    setFetchingId(venue.id);
    try {
      const query = `${venue.name} ${venue.address}`.trim();
      const res = await fetch(`/api/places/photo?query=${encodeURIComponent(query)}`);
      const data = await res.json();
      
      if (res.ok && data.photoUrls && data.photoUrls.length > 0) {
        setFetchedPhotos(prev => ({ ...prev, [venue.id]: data.photoUrls }));
      } else {
        alert(data.error || 'No photos found for this location.');
      }
    } catch (error) {
      console.error(error);
      alert('Error fetching photos.');
    } finally {
      setFetchingId(null);
    }
  };

  const handleSelectPhoto = async (venueId: string, url: string) => {
    try {
      await venueService.updateVenue(venueId, { imageUrl: url });
      alert('Representative photo updated successfully!');
      // Clear fetched photos for this venue so it collapses
      setFetchedPhotos(prev => {
        const next = { ...prev };
        delete next[venueId];
        return next;
      });
    } catch (error) {
      console.error('Update failed:', error);
      alert('Failed to update venue.');
    }
  };

  const triggerUpload = (venue: Venue) => {
    setActiveUploadVenue(venue);
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeUploadVenue) return;

    setUploadingId(activeUploadVenue.id);
    try {
      const path = `venues/${activeUploadVenue.id}/${Date.now()}_${file.name}`;
      const downloadUrl = await storageService.uploadFile(file, path);
      await venueService.updateVenue(activeUploadVenue.id, { imageUrl: downloadUrl });
      alert('Local photo uploaded and set successfully!');
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Failed to upload photo.');
    } finally {
      setUploadingId(null);
      setActiveUploadVenue(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Group venues by region
  const groupedVenues = venues.reduce((acc, venue) => {
    const region = venue.region || 'Unknown Region';
    if (!acc[region]) acc[region] = [];
    acc[region].push(venue);
    return acc;
  }, {} as Record<string, Venue[]>);

  return (
    <div className="min-h-screen bg-[#f0f2f5] p-6 pb-20">
      <div className="max-w-4xl mx-auto space-y-8">
        <header>
          <h1 className="text-3xl font-black text-[#2d3435] mb-2">Venue Photo Manager</h1>
          <p className="text-[#596061]">Simple tool to quickly fetch and assign representative photos to venues.</p>
        </header>

        {Object.entries(groupedVenues).map(([region, regionVenues]) => (
          <section key={region} className="space-y-4">
            <h2 className="text-xl font-bold text-[#1A73E8] border-b-2 border-[#1A73E8]/20 pb-2">{region}</h2>
            <div className="grid gap-4">
              {regionVenues.map(venue => (
                <div key={venue.id} className="bg-white rounded-xl shadow-sm border border-black/5 p-4 flex flex-col md:flex-row gap-6">
                  {/* Current Photo */}
                  <div className="w-full md:w-48 h-32 bg-[#f7f7ff] rounded-lg overflow-hidden border border-black/10 flex-shrink-0 flex items-center justify-center">
                    {venue.imageUrl ? (
                      <img src={venue.imageUrl} alt={venue.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-[#596061]/50 text-sm font-medium">No Photo</span>
                    )}
                  </div>

                  {/* Venue Info & Actions */}
                  <div className="flex-1 flex flex-col">
                    <div className="mb-4">
                      <h3 className="font-bold text-lg text-[#2d3435]">{venue.name} <span className="text-sm font-normal text-[#596061] ml-2">{venue.category}</span></h3>
                      <p className="text-sm text-[#596061]">{venue.address}</p>
                    </div>
                    
                    <div className="mt-auto flex flex-wrap gap-2">
                      <button 
                        onClick={() => handleFetchPhotos(venue)}
                        disabled={fetchingId === venue.id}
                        className="px-4 py-2 bg-[#1A73E8] text-white text-sm font-bold rounded-lg hover:bg-[#1557b0] transition-colors disabled:opacity-50 flex items-center gap-2"
                      >
                        <span className="material-symbols-rounded text-[18px]">
                          {fetchingId === venue.id ? 'hourglass_empty' : 'travel_explore'}
                        </span>
                        {fetchingId === venue.id ? 'Fetching...' : 'Fetch Photos'}
                      </button>

                      <button 
                        onClick={() => triggerUpload(venue)}
                        disabled={uploadingId === venue.id}
                        className="px-4 py-2 bg-white text-[#596061] border border-[#dde4e5] text-sm font-bold rounded-lg hover:bg-[#f7f7ff] transition-colors disabled:opacity-50 flex items-center gap-2"
                      >
                        <span className="material-symbols-rounded text-[18px]">
                          {uploadingId === venue.id ? 'hourglass_empty' : 'upload_file'}
                        </span>
                        {uploadingId === venue.id ? 'Uploading...' : 'Upload Local File'}
                      </button>
                    </div>

                    {/* Fetched Photos Selection */}
                    {fetchedPhotos[venue.id] && (
                      <div className="mt-4 pt-4 border-t border-black/5">
                        <p className="text-xs font-bold text-[#1A73E8] mb-2 uppercase tracking-wide">Select a photo to apply:</p>
                        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                          {fetchedPhotos[venue.id].map((url, idx) => (
                            <button 
                              key={idx}
                              onClick={() => handleSelectPhoto(venue.id, url)}
                              className="relative w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden border-2 border-transparent hover:border-[#1A73E8] transition-all group"
                            >
                              <img src={url} alt={`Option ${idx}`} className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                <span className="material-symbols-rounded text-white">check_circle</span>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
      
      {/* Hidden File Input */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept="image/*" 
        className="hidden" 
      />
    </div>
  );
}
