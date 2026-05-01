'use client';

import React, { useState, useRef } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { stayService } from '@/lib/firebase/stayService';
import { plazaService } from '@/lib/firebase/plazaService';
import { StayType } from '@/types/stay';

interface CreateStayProps {
  onClose: () => void;
  onSuccess?: () => void;
}

export default function CreateStay({ onClose, onSuccess }: CreateStayProps) {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !title || !price || !mediaFile) return;

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
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white w-full max-w-xl rounded-t-[32px] sm:rounded-[32px] shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300 flex flex-col max-h-[95vh]">
        {/* Header */}
        <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-10 font-manrope">
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-primary tracking-[0.25em] uppercase mb-1">Accommodation</span>
            <h3 className="text-[20px] font-black text-gray-900 uppercase tracking-tighter">Host a Stay</h3>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-50 hover:bg-gray-100 transition-all text-gray-400">
            <span className="material-symbols-rounded text-[20px]">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar scroll-smooth">
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
                  className="w-full bg-gray-50 border-none rounded-2xl px-4 py-3.5 text-sm font-bold focus:ring-2 focus:ring-primary/10"
                >
                  {stayTypes.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Price / Night ($)</label>
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
        </form>

        {/* Footer */}
        <div className="p-6 border-t border-gray-50 bg-white">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !title || !price || !mediaFile}
            className={`w-full h-14 rounded-full font-black text-[15px] transition-all flex items-center justify-center gap-2 uppercase tracking-widest shadow-xl ${
              (isSubmitting || !title || !price || !mediaFile)
                ? 'bg-gray-100 text-gray-300'
                : 'bg-primary text-white shadow-primary/30 hover:scale-[1.02] active:scale-[0.98]'
            }`}
          >
            {isSubmitting ? (
              <>
                <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Launching Stay {uploadProgress}%</span>
              </>
            ) : (
              <span>Open for Bookings</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
