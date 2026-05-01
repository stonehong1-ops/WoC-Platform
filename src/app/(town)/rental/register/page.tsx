'use client';

import React, { useState, useRef, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { rentalService } from '@/lib/firebase/rentalService';
import { storageService } from '@/lib/firebase/storageService';
import { RentalSpace } from '@/types/rental';

const CATEGORIES = ['Dance Studio', 'Party Room', 'Practice Room'];

function RegisterPageContent() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [address, setAddress] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [pricePerHour, setPricePerHour] = useState<number | ''>('');
  const [minHours, setMinHours] = useState<number | ''>(1);
  const [facilitiesInput, setFacilitiesInput] = useState('');
  const [rules, setRules] = useState('');
  
  const [images, setImages] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load existing item if editing
  useEffect(() => {
    if (!editId) return;
    const fetchItem = async () => {
      try {
        const data = await rentalService.getSpace(editId);
        if (data) {
          if (data.hostId !== user?.uid) {
            alert('No permission.');
            router.back();
            return;
          }
          setTitle(data.title);
          setDescription(data.description || '');
          setLocation(data.location);
          setAddress(data.address);
          setCategory(data.category);
          setPricePerHour(data.pricePerHour || '');
          setMinHours(data.minHours || 1);
          setFacilitiesInput(data.facilities?.join(', ') || '');
          setRules(data.rules || '');
          setExistingImages(data.images || []);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchItem();
  }, [editId, user]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      if (images.length + existingImages.length + selectedFiles.length > 5) {
        alert('You can upload up to 5 images.');
        return;
      }
      setImages(prev => [...prev, ...selectedFiles]);
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };
  const removeExistingImage = (index: number) => {
    setExistingImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert('Login required.');
      return;
    }
    if (!title.trim() || !location.trim() || !address.trim() || pricePerHour === '' || minHours === '') {
      alert('Please fill in all required fields.');
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Upload new images
      const uploadedUrls: string[] = [];
      for (const file of images) {
        const path = `rental/${Date.now()}_${Math.random().toString(36).substring(7)}`;
        const url = await storageService.uploadFile(file, path);
        uploadedUrls.push(url);
      }

      const finalImages = [...existingImages, ...uploadedUrls];
      const facilities = facilitiesInput.split(',').map(s => s.trim()).filter(Boolean);

      const spaceData: Partial<RentalSpace> = {
        title,
        description,
        location,
        address,
        category,
        pricePerHour: Number(pricePerHour),
        minHours: Number(minHours),
        facilities,
        rules,
        images: finalImages,
        hostId: user.uid,
        regularClasses: [], // MVP for now
      };

      if (editId) {
        await rentalService.updateSpace(editId, spaceData);
        alert('Successfully updated.');
        router.back();
      } else {
        await rentalService.addSpace(spaceData as Omit<RentalSpace, 'id' | 'createdAt' | 'updatedAt' | 'likesCount'>);
        alert('Rental space successfully registered.');
        router.replace('/rental');
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred during processing.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="max-w-md mx-auto min-h-screen pb-24 bg-white relative pt-16">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-slate-100 px-4 py-3 flex items-center justify-between">
        <button onClick={() => router.back()} className="w-10 h-10 -ml-2 rounded-full flex items-center justify-center text-[#2d3435] active:bg-slate-100">
          <span className="material-symbols-rounded text-xl">arrow_back</span>
        </button>
        <h1 className="text-base font-bold text-[#2d3435]">{editId ? 'Edit Rental Space' : 'Register Rental Space'}</h1>
        <div className="w-10" />
      </div>

      <form onSubmit={handleSubmit} className="px-5 mt-4 space-y-6">
        
        {/* Category Toggle */}
        <div className="flex bg-[#f2f4f4] rounded-xl p-1">
          {CATEGORIES.map(c => (
            <button key={c} type="button" onClick={() => setCategory(c)}
              className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all ${category === c ? 'bg-white shadow-sm text-primary' : 'text-[#596061]'}`}>
              {c}
            </button>
          ))}
        </div>

        {/* Images */}
        <div>
          <label className="block text-xs font-bold text-[#596061] mb-2 uppercase tracking-wider">Space Photos ({images.length + existingImages.length}/5)</label>
          <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
            <button type="button" onClick={() => fileInputRef.current?.click()}
              className="w-20 h-20 flex-shrink-0 flex flex-col items-center justify-center border-2 border-dashed border-[#acb3b4] rounded-xl text-[#596061] bg-[#f8f9fa] active:scale-95 transition-transform">
              <span className="material-symbols-rounded text-2xl mb-1">add_a_photo</span>
            </button>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" multiple onChange={handleImageChange} />
            
            {existingImages.map((url, i) => (
              <div key={`existing-${i}`} className="w-20 h-20 flex-shrink-0 relative rounded-xl overflow-hidden border border-slate-100">
                <img src={url} alt="Uploaded" className="w-full h-full object-cover" />
                <button type="button" onClick={() => removeExistingImage(i)} className="absolute top-1 right-1 w-5 h-5 bg-black/50 rounded-full text-white flex items-center justify-center">
                  <span className="material-symbols-rounded text-[14px]">close</span>
                </button>
              </div>
            ))}

            {images.map((file, i) => (
              <div key={`new-${i}`} className="w-20 h-20 flex-shrink-0 relative rounded-xl overflow-hidden border border-slate-100">
                <img src={URL.createObjectURL(file)} alt="Upload preview" className="w-full h-full object-cover" />
                <button type="button" onClick={() => removeImage(i)} className="absolute top-1 right-1 w-5 h-5 bg-black/50 rounded-full text-white flex items-center justify-center">
                  <span className="material-symbols-rounded text-[14px]">close</span>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Details */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#596061] mb-1.5 uppercase tracking-wider">Space Name <span className="text-red-400">*</span></label>
            <input required type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Gangnam Exit 1 Dance Studio"
              className="w-full bg-[#f8f9fa] border border-[#e0e4e5] rounded-xl px-4 py-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" />
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs font-bold text-[#596061] mb-1.5 uppercase tracking-wider">Region (City/District) <span className="text-red-400">*</span></label>
              <input required type="text" value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Gangnam-gu"
                className="w-full bg-[#f8f9fa] border border-[#e0e4e5] rounded-xl px-4 py-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-bold text-[#596061] mb-1.5 uppercase tracking-wider">Detailed Address <span className="text-red-400">*</span></label>
              <input required type="text" value={address} onChange={e => setAddress(e.target.value)} placeholder="e.g. 123 Teheran-ro B1"
                className="w-full bg-[#f8f9fa] border border-[#e0e4e5] rounded-xl px-4 py-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" />
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs font-bold text-[#596061] mb-1.5 uppercase tracking-wider">Price Per Hour <span className="text-red-400">*</span></label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-[#acb3b4]">₩</span>
                <input required type="number" min="0" value={pricePerHour} onChange={e => setPricePerHour(e.target.value ? Number(e.target.value) : '')} placeholder="10000"
                  className="w-full bg-[#f8f9fa] border border-[#e0e4e5] rounded-xl pl-9 pr-4 py-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" />
              </div>
            </div>
            <div className="flex-1">
              <label className="block text-xs font-bold text-[#596061] mb-1.5 uppercase tracking-wider">Min. Hours <span className="text-red-400">*</span></label>
              <div className="relative">
                <input required type="number" min="1" value={minHours} onChange={e => setMinHours(e.target.value ? Number(e.target.value) : '')} placeholder="1"
                  className="w-full bg-[#f8f9fa] border border-[#e0e4e5] rounded-xl px-4 py-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-right pr-12" />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-[#acb3b4]">hrs</span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#596061] mb-1.5 uppercase tracking-wider">Facilities (comma separated)</label>
            <input type="text" value={facilitiesInput} onChange={e => setFacilitiesInput(e.target.value)} placeholder="e.g. Wall Mirror, Bluetooth Speaker, Water Dispenser"
              className="w-full bg-[#f8f9fa] border border-[#e0e4e5] rounded-xl px-4 py-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#596061] mb-1.5 uppercase tracking-wider">Detailed Description</label>
            <textarea rows={5} value={description} onChange={e => setDescription(e.target.value)} placeholder="Please enter a detailed description of the space."
              className="w-full bg-[#f8f9fa] border border-[#e0e4e5] rounded-xl px-4 py-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all resize-none" />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#596061] mb-1.5 uppercase tracking-wider">Rules & Refund Policy</label>
            <textarea rows={4} value={rules} onChange={e => setRules(e.target.value)} placeholder="Indoor shoes required, No food allowed, etc."
              className="w-full bg-[#f8f9fa] border border-[#e0e4e5] rounded-xl px-4 py-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all resize-none" />
          </div>
        </div>

        {/* Submit */}
        <div className="pt-4 pb-10">
          <button type="submit" disabled={isSubmitting}
            className="w-full bg-primary text-white font-bold py-3.5 rounded-xl shadow-lg shadow-primary/20 active:scale-[0.98] transition-transform disabled:opacity-50">
            {isSubmitting ? 'Processing...' : editId ? 'Save Changes' : 'Register Space'}
          </button>
        </div>
      </form>
    </main>
  );
}

export default function RentalRegisterPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <RegisterPageContent />
    </Suspense>
  );
}
