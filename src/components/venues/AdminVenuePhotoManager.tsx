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
    <div className="min-h-screen bg-surface p-6 pb-24">
      <div className="max-w-4xl mx-auto space-y-10">
        <header className="pb-4 border-b border-outline-variant/30">
          <h1 className="text-3xl font-black text-on-surface tracking-tight">Venue Photo Manager</h1>
          <p className="text-xs text-outline mt-1.5">플랫폼에 등록된 장소들의 이미지를 검색하거나 수동 업로드하여 완벽하게 매칭하는 도구입니다.</p>
        </header>

        {Object.entries(groupedVenues).map(([region, regionVenues]) => (
          <section key={region} className="space-y-6">
            <h2 className="text-base font-black text-primary flex items-center gap-2 border-b border-primary/20 pb-2 uppercase tracking-wider">
              <span className="material-symbols-rounded text-[20px]">distance</span>
              {region}
            </h2>
            <div className="grid gap-6">
              {regionVenues.map(venue => (
                <div key={venue.id} className="bg-white rounded-2xl shadow-sm border border-outline-variant/30 p-5 flex flex-col md:flex-row gap-6 hover:shadow-md transition-all">
                  {/* Current Photo */}
                  <div className="w-full md:w-48 h-36 bg-surface-container rounded-xl overflow-hidden border border-outline-variant/20 flex-shrink-0 flex items-center justify-center shadow-inner relative">
                    {venue.imageUrl ? (
                      <img src={venue.imageUrl} alt={venue.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center gap-1.5 text-outline">
                        <span className="material-symbols-rounded text-2xl">image_not_supported</span>
                        <span className="text-[10px] font-bold uppercase tracking-wider">No Photo</span>
                      </div>
                    )}
                  </div>

                  {/* Venue Info & Actions */}
                  <div className="flex-grow flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-4 mb-2">
                        <h3 className="font-extrabold text-lg text-on-surface leading-snug">
                          {venue.name}
                        </h3>
                        <span className="shrink-0 px-2.5 py-1 bg-surface-container-high text-outline text-[10px] font-bold rounded-lg uppercase tracking-wider">
                          {venue.category}
                        </span>
                      </div>
                      <p className="text-xs text-outline flex items-center gap-1">
                        <span className="material-symbols-rounded text-[14px]">pin_drop</span>
                        {venue.address}
                      </p>
                    </div>
                    
                    <div className="mt-6 flex flex-wrap gap-2.5">
                      <button 
                        onClick={() => handleFetchPhotos(venue)}
                        disabled={fetchingId === venue.id}
                        className="px-4 py-2.5 bg-primary text-on-primary text-xs font-bold rounded-xl hover:brightness-105 active:scale-95 transition-all disabled:opacity-50 flex items-center gap-2 shadow-md shadow-primary/10 cursor-pointer"
                      >
                        <span className="material-symbols-rounded text-[16px] font-bold">
                          {fetchingId === venue.id ? 'autorenew' : 'travel_explore'}
                        </span>
                        {fetchingId === venue.id ? 'Fetching...' : 'Fetch Photos'}
                      </button>

                      <button 
                        onClick={() => triggerUpload(venue)}
                        disabled={uploadingId === venue.id}
                        className="px-4 py-2.5 bg-white text-on-surface border border-outline-variant/60 text-xs font-bold rounded-xl hover:bg-surface-container-low transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2 shadow-sm cursor-pointer"
                      >
                        <span className="material-symbols-rounded text-[16px]">
                          {uploadingId === venue.id ? 'autorenew' : 'upload_file'}
                        </span>
                        {uploadingId === venue.id ? 'Uploading...' : 'Upload Local File'}
                      </button>
                    </div>

                    {/* Fetched Photos Selection */}
                    {fetchedPhotos[venue.id] && (
                      <div className="mt-5 pt-5 border-t border-outline-variant/30">
                        <p className="text-xs font-bold text-primary mb-3 uppercase tracking-wider flex items-center gap-1">
                          <span className="material-symbols-rounded text-[14px]">add_photo_alternate</span>
                          Select a photo to apply
                        </p>
                        <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                          {fetchedPhotos[venue.id].map((url, idx) => (
                            <button 
                              key={idx}
                              onClick={() => handleSelectPhoto(venue.id, url)}
                              className="relative w-24 h-24 flex-shrink-0 rounded-xl overflow-hidden border-2 border-transparent hover:border-primary hover:shadow-lg transition-all group cursor-pointer"
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
