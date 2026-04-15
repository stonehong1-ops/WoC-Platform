"use client";

import React, { useState } from 'react';
import { db } from '@/lib/firebase/clientApp';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useLocation } from '@/components/providers/LocationProvider';

interface ManageEntryProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ManageEntry({ isOpen, onClose }: ManageEntryProps) {
  const { location } = useLocation();
  const [formData, setFormData] = useState({
    name: '',
    nativeName: '',
    categories: [] as string[],
    address: '',
    detailAddress: '',
    description: '',
    latitude: 37.5575,
    longitude: 126.9244,
    images: [] as File[]
  });

  const [saving, setSaving] = useState(false);
  const categoriesList = ['Studio', 'Academy', 'Club', 'Shop', 'Service', 'Other'];

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      if (filesArray.length + formData.images.length > 20) {
        alert('You can select a maximum of 20 images.');
        return;
      }
      setFormData(prev => ({ ...prev, images: [...prev.images, ...filesArray] }));
    }
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const toggleCategory = (category: string) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category]
    }));
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.categories.length === 0) {
      alert('Please select at least one category.');
      return;
    }
    setSaving(true);
    try {
      await addDoc(collection(db, "venues"), {
        name: formData.name,
        nativeName: formData.nativeName,
        categories: formData.categories,
        category: formData.categories[0], // Legacy support
        address: formData.address,
        detailAddress: formData.detailAddress,
        city: location.city.toUpperCase(),
        country: location.country.toUpperCase(),
        coordinates: {
          latitude: Number(formData.latitude),
          longitude: Number(formData.longitude)
        },
        status: 'active',
        createdAt: serverTimestamp()
      });
      onClose();
    } catch (error) {
      console.error("Error saving venue:", error);
      alert('Failed to register venue.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-2xl rounded-t-[40px] sm:rounded-[40px] overflow-hidden shadow-2xl animate-in slide-in-from-bottom sm:zoom-in duration-500">
        <div className="relative p-8 max-h-[90vh] overflow-y-auto no-scrollbar">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-xl font-black text-on-surface tracking-tight uppercase">Venue</h2>
            <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full bg-on-surface/[0.04] text-on-surface/40 hover:bg-on-surface/[0.08] transition-all">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Image Selection */}
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase text-on-surface/30 ml-1 tracking-widest">Images (Max 20)</label>
              <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                <label className="flex-shrink-0 w-24 h-24 rounded-3xl border-2 border-dashed border-on-surface/10 flex flex-col items-center justify-center cursor-pointer hover:bg-on-surface/[0.02] transition-all">
                  <span className="material-symbols-outlined text-on-surface/20">add_a_photo</span>
                  <input type="file" multiple accept="image/*" onChange={handleImageChange} className="hidden" />
                </label>
                {formData.images.map((img, idx) => (
                  <div key={idx} className="relative flex-shrink-0 w-24 h-24 rounded-3xl bg-on-surface/[0.05] overflow-hidden">
                    <img src={URL.createObjectURL(img)} className="w-full h-full object-cover" alt="" />
                    <button 
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="absolute top-1 right-1 w-6 h-6 bg-black/50 text-white rounded-full flex items-center justify-center"
                    >
                      <span className="material-symbols-outlined text-sm">close</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-on-surface/30 ml-1 tracking-widest">Space Name</label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-on-surface/[0.03] border-none rounded-2xl p-4 text-[14px] font-bold focus:ring-1 focus:ring-primary/30"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-on-surface/30 ml-1 tracking-widest">Native Name</label>
                <input 
                  type="text" 
                  value={formData.nativeName}
                  onChange={(e) => setFormData({...formData, nativeName: e.target.value})}
                  className="w-full bg-on-surface/[0.03] border-none rounded-2xl p-4 text-[14px] font-bold focus:ring-1 focus:ring-primary/30"
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase text-on-surface/30 ml-1 tracking-widest block">Categories</label>
              <div className="flex flex-wrap gap-1.5">
                {categoriesList.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => toggleCategory(cat)}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                      formData.categories.includes(cat)
                      ? 'bg-primary text-white'
                      : 'bg-on-surface/[0.03] text-on-surface/40 hover:bg-on-surface/[0.06]'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-on-surface/30 ml-1 tracking-widest">Address</label>
                <input 
                  type="text" 
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  className="w-full bg-on-surface/[0.03] border-none rounded-2xl p-4 text-[14px] font-bold focus:ring-1 focus:ring-primary/30"
                  placeholder="Street address..."
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-on-surface/30 ml-1 tracking-widest">Detail Address</label>
                <input 
                  type="text" 
                  value={formData.detailAddress}
                  onChange={(e) => setFormData({...formData, detailAddress: e.target.value})}
                  className="w-full bg-on-surface/[0.03] border-none rounded-2xl p-4 text-[14px] font-bold focus:ring-1 focus:ring-primary/30"
                  placeholder="Floor, Suite, etc."
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 opacity-60">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-on-surface/30 ml-1 tracking-widest">Latitude</label>
                <input 
                  type="number" 
                  readOnly
                  value={formData.latitude}
                  className="w-full bg-on-surface/[0.01] border-none rounded-2xl p-4 text-[12px] font-mono font-bold cursor-not-allowed outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-on-surface/30 ml-1 tracking-widest">Longitude</label>
                <input 
                  type="number" 
                  readOnly
                  value={formData.longitude}
                  className="w-full bg-on-surface/[0.01] border-none rounded-2xl p-4 text-[12px] font-mono font-bold cursor-not-allowed outline-none"
                />
              </div>
            </div>

            <div className="pt-4">
              <button 
                type="submit"
                disabled={saving}
                className="w-full py-5 bg-on-surface text-white rounded-[24px] text-[14px] font-black uppercase tracking-[0.2em] shadow-xl active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Submit'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
