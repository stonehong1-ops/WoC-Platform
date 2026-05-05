'use client';

import React, { useState, useRef } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { lostService } from '@/lib/firebase/lostService';
import { plazaService } from '@/lib/firebase/plazaService';
import { LostCategory } from '@/types/lost';
import UniversalCompose from '@/components/common/UniversalCompose';

interface CreateLostItemProps {
  isOpen?: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function CreateLostItem({ isOpen, onClose, onSuccess }: CreateLostItemProps) {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const [category, setCategory] = useState<LostCategory>('Lost');
  const [title, setTitle] = useState('');
  const [itemType, setItemType] = useState('Personal Gear');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const itemTypes = ['Personal Gear', 'Electronics', 'Hobby Gear', 'Clothing', 'Others'];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMediaFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async () => {
    if (!user || !title || !location || !mediaFile) return;

    setIsSubmitting(true);
    setUploadProgress(0);
    
    try {
      const imageUrl = await plazaService.uploadMedia(mediaFile, (p) => setUploadProgress(Math.round(p)));

      await lostService.registerItem({
        category,
        title,
        description,
        location,
        itemType,
        imageUrl,
        reportedById: user.uid,
        reportedByName: user.displayName || 'Anonymous',
      });

      onSuccess?.();
      onClose();
    } catch (error) {
      console.error("Error creating lost report:", error);
      alert("Failed to post report. Please check your connection.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <UniversalCompose
      id="lost-found"
      title="Report a Case"
      label="Guardian Network"
      submitLabel="Publish Report"
      submittingLabel={`Broadcasting ${uploadProgress}%`}
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
    >
      <div className="space-y-8">
        {/* Category Toggle (Lost vs Found) */}
        <div className="flex p-1 bg-gray-100 rounded-full">
          <button
            type="button"
            onClick={() => setCategory('Lost')}
            className={`flex-1 py-3 rounded-full text-xs font-black uppercase tracking-widest transition-all ${
              category === 'Lost' ? 'bg-[#9f403d] text-white shadow-lg' : 'text-gray-400'
            }`}
          >
            Lost Item
          </button>
          <button
            type="button"
            onClick={() => setCategory('Found')}
            className={`flex-1 py-3 rounded-full text-xs font-black uppercase tracking-widest transition-all ${
              category === 'Found' ? 'bg-[#1A73E8] text-white shadow-lg' : 'text-gray-400'
            }`}
          >
            Found Item
          </button>
        </div>

        {/* Photo Upload Area */}
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="relative h-64 w-full rounded-3xl bg-gray-50 border-2 border-dashed border-gray-100 flex flex-col items-center justify-center cursor-pointer overflow-hidden group hover:border-primary/20 transition-all"
        >
          {previewUrl ? (
            <img src={previewUrl} className="w-full h-full object-cover" alt="preview" />
          ) : (
            <>
              <div className="w-16 h-16 rounded-full bg-white shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-gray-300 text-[32px]">manage_search</span>
              </div>
              <span className="text-[11px] font-black text-gray-300 uppercase tracking-widest text-center px-6">Upload {category === 'Lost' ? 'Reference' : 'Found'} Photo</span>
            </>
          )}
          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
        </div>

        {/* Core Info */}
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 text-left block">Case Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={category === 'Lost' ? "Ex. Blue Leica Camera missing" : "Ex. Found a pair of Ballet shoes"}
              className="w-full text-[24px] font-black tracking-tighter border-none focus:ring-0 placeholder:text-gray-200 p-0"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 text-left block">Type</label>
              <select 
                value={itemType}
                onChange={(e) => setItemType(e.target.value)}
                className="w-full bg-gray-50 border-none rounded-2xl px-4 py-3.5 text-sm font-bold focus:ring-2 focus:ring-primary/10"
              >
                {itemTypes.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 text-left block">Location</label>
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Ex. Main Stage left"
                className="w-full bg-gray-50 border-none rounded-2xl px-4 py-3.5 text-sm font-bold focus:ring-2 focus:ring-primary/10"
                required
              />
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="space-y-2 pb-4 text-left">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 block">Detailed Story</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Provide as much detail as possible to help the owner identify the item..."
            className="w-full min-h-[120px] bg-gray-50 border-none rounded-[28px] px-5 py-4 text-sm font-medium focus:ring-2 focus:ring-primary/10 resize-none"
          />
        </div>
      </div>
    </UniversalCompose>
  );
}
