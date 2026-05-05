'use client';

import React, { useState, useRef } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { stayService } from '@/lib/firebase/stayService';
import { plazaService } from '@/lib/firebase/plazaService';
import { StayType } from '@/types/stay';
import UniversalCompose from '@/components/common/UniversalCompose';

interface CreateStayProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function CreateStay({ isOpen, onClose, onSuccess }: CreateStayProps) {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const [title, setTitle] = useState('');
  const [type, setType] = useState<StayType>('1-Room');
  const [location, setLocation] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');

  const [amenities, setAmenities] = useState<string[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const stayTypes: StayType[] = ['Couchsurfing', 'Dormitory', '1-Room', '2-Room', '3-Room', 'Pension'];
  const amenityOptions = ['wifi', 'desk', 'coffee', 'studio', 'gym', 'kitchen'];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMediaFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const toggleAmenity = (amenity: string) => {
    setAmenities(prev => 
      prev.includes(amenity) ? prev.filter(a => a !== amenity) : [...prev, amenity]
    );
  };

  const handleSubmit = async () => {
    if (!user || !title || !price || !mediaFile) {
      alert("Please fill in all required fields and add a photo.");
      return;
    }

    setIsSubmitting(true);
    setUploadProgress(0);
    
    try {
      const imageUrl = await plazaService.uploadMedia(mediaFile, (p) => setUploadProgress(Math.round(p)));

      await stayService.registerStay({
        groupId: '', // Will be set when creating from group context
        title,
        type,
        location: {
          address: location,
          city: '',
          district: '',
        },
        pricing: {
          currency: 'KRW',
          baseRate: parseInt(price),
        },
        images: [imageUrl],
        checkInTime: '15:00',
        checkOutTime: '11:00',
        maxGuests: 2,
        doorCode: '9999',
        payment: {
          methods: [
            { type: 'bank_domestic', enabled: false },
            { type: 'bank_international', enabled: false },
            { type: 'card', enabled: false },
          ],
          transferDeadlineHours: 2,
        },
        host: {
          userId: user.uid,
          name: user.displayName || 'Anonymous',
          photo: user.photoURL || '',
        },
        amenities,
        isActive: false,
        isNewlyListed: true,
      });

      onSuccess?.();
      onClose();
    } catch (error) {
      console.error("Error creating stay:", error);
      alert("Failed to register stay. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <UniversalCompose
      id="stay"
      isOpen={isOpen}
      onClose={onClose}
      title="Host a Stay"
      label="Accommodation"
      submittingLabel={`Launching Stay ${uploadProgress}%`}
      submitLabel="Open for Bookings"
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
    >
      {/* Main Photo Upload */}
      <div 
        onClick={() => fileInputRef.current?.click()}
        className="relative h-64 w-full rounded-[24px] bg-gray-50 border-2 border-dashed border-gray-100 flex flex-col items-center justify-center cursor-pointer overflow-hidden group hover:border-primary/20 transition-all"
      >
        {previewUrl ? (
          <img src={previewUrl} className="w-full h-full object-cover" alt="preview" />
        ) : (
          <>
            <div className="w-14 h-14 rounded-full bg-white shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <span className="material-symbols-rounded text-gray-300 text-[28px]">add_a_photo</span>
            </div>
            <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Main Lobby Photo</span>
          </>
        )}
        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
      </div>

      {/* Basic Info */}
      <div className="space-y-6">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Stay Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex. The Creative Nomad Loft"
            className="w-full text-[24px] font-black tracking-tighter border-none focus:ring-0 placeholder:text-gray-200 p-0"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-8">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Type</label>
            <select 
              value={type}
              onChange={(e) => setType(e.target.value as StayType)}
              className="w-full bg-gray-50 border-none rounded-2xl px-4 py-3.5 text-sm font-bold focus:ring-2 focus:ring-primary/10 appearance-none"
            >
              {stayTypes.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Price / Night (₩)</label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0"
              className="w-full bg-gray-50 border-none rounded-2xl px-4 py-3.5 text-sm font-bold focus:ring-2 focus:ring-primary/10"
              required
            />
          </div>
        </div>
      </div>

      {/* Location */}
      <div className="space-y-2">
        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Location Address</label>
        <input
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Ex. Berlin, Germany or Specific Avenue"
          className="w-full bg-gray-50 border-none rounded-2xl px-5 py-3.5 text-sm font-bold focus:ring-2 focus:ring-primary/10"
          required
        />
      </div>

      {/* Amenities */}
      <div className="space-y-4">
        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Amenities</label>
        <div className="flex flex-wrap gap-2">
          {amenityOptions.map(opt => (
            <button
              key={opt}
              type="button"
              onClick={() => toggleAmenity(opt)}
              className={`px-4 py-2 rounded-full text-[11px] font-black transition-all flex items-center gap-1.5 uppercase ${
                amenities.includes(opt) ? 'bg-primary text-white scale-105' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
              }`}
            >
              <span className="material-symbols-rounded text-[16px]">{opt}</span>
              {opt}
            </button>
          ))}
        </div>
      </div>

      {/* Description */}
      <div className="space-y-2 pb-4">
        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">The Experience</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe what makes your stay special for hobbyists..."
          className="w-full min-h-[140px] bg-gray-50 border-none rounded-[28px] px-5 py-4 text-sm font-medium focus:ring-2 focus:ring-primary/10 resize-none"
        />
      </div>
    </UniversalCompose>
  );
}
