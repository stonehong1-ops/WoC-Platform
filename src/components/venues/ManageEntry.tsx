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
    description: '',
    latitude: 37.5575,
    longitude: 126.9245,
    imageUrl: ''
  });

  const [saving, setSaving] = useState(false);

  const categoriesList = ['Studio', 'Academy', 'Club', 'Shop', 'Service', 'Other'];

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
        ...formData,
        // Map to primary category for legacy support
        category: formData.categories[0], 
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
          <div className="flex justify-between items-start mb-10">
            <div>
              <span className="text-[10px] font-black text-primary tracking-[0.25em] uppercase mb-1 block">Space Management</span>
              <h2 className="text-3xl font-black text-on-surface tracking-tighter uppercase">Register Space</h2>
              <p className="text-[12px] font-bold text-on-surface/30 mt-1">Registering in {location.city}, {location.country}</p>
            </div>
            <button onClick={onClose} className="w-12 h-12 flex items-center justify-center rounded-full bg-on-surface/[0.04] text-on-surface/40 hover:bg-on-surface/[0.08] transition-all">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-on-surface/30 ml-1 tracking-widest">Space Name</label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-on-surface/[0.03] border-none rounded-2xl p-5 text-[15px] font-bold focus:ring-1 focus:ring-primary/30 transition-all placeholder:text-on-surface/20"
                  placeholder="e.g. Hongdae Flow Studio"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-on-surface/30 ml-1 tracking-widest">Native Name</label>
                <input 
                  type="text" 
                  value={formData.nativeName}
                  onChange={(e) => setFormData({...formData, nativeName: e.target.value})}
                  className="w-full bg-on-surface/[0.03] border-none rounded-2xl p-5 text-[15px] font-bold focus:ring-1 focus:ring-primary/30 transition-all placeholder:text-on-surface/20"
                  placeholder="홍대 플로우 스튜디오"
                />
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase text-on-surface/30 ml-1 tracking-widest block">Categories (Select Multiple)</label>
              <div className="flex flex-wrap gap-2">
                {categoriesList.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => toggleCategory(cat)}
                    className={`px-6 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${
                      formData.categories.includes(cat)
                      ? 'bg-primary text-white shadow-lg shadow-primary/20'
                      : 'bg-on-surface/[0.03] text-on-surface/40 hover:bg-on-surface/[0.06]'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-on-surface/30 ml-1 tracking-widest">Image URL</label>
              <input 
                type="url" 
                value={formData.imageUrl}
                onChange={(e) => setFormData({...formData, imageUrl: e.target.value})}
                className="w-full bg-on-surface/[0.03] border-none rounded-2xl p-5 text-[15px] font-bold focus:ring-1 focus:ring-primary/30 transition-all placeholder:text-on-surface/20"
                placeholder="https://images.unsplash.com/..."
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-on-surface/30 ml-1 tracking-widest">Full Address</label>
              <input 
                type="text" 
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                className="w-full bg-on-surface/[0.03] border-none rounded-2xl p-5 text-[15px] font-bold focus:ring-1 focus:ring-primary/30 transition-all placeholder:text-on-surface/20"
                placeholder="Seoul, Mapo-gu, Yanghwa-ro 160"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-on-surface/30 ml-1 tracking-widest">Latitude</label>
                <input 
                  type="number" 
                  step="any"
                  value={formData.latitude}
                  onChange={(e) => setFormData({...formData, latitude: parseFloat(e.target.value)})}
                  className="w-full bg-on-surface/[0.03] border-none rounded-2xl p-5 text-[15px] font-bold focus:ring-1 focus:ring-primary/30 transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-on-surface/30 ml-1 tracking-widest">Longitude</label>
                <input 
                  type="number" 
                  step="any"
                  value={formData.longitude}
                  onChange={(e) => setFormData({...formData, longitude: parseFloat(e.target.value)})}
                  className="w-full bg-on-surface/[0.03] border-none rounded-2xl p-5 text-[15px] font-bold focus:ring-1 focus:ring-primary/30 transition-all"
                />
              </div>
            </div>

            <div className="pt-6">
              <button 
                type="submit"
                disabled={saving}
                className="w-full py-5 bg-primary text-white rounded-[24px] text-[15px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-primary/30 active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {saving ? 'Processing...' : 'Complete Registration'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
