"use client";

import React, { useState } from 'react';
import { db } from '@/lib/firebase/clientApp';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

interface ManageEntryProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ManageEntry({ isOpen, onClose }: ManageEntryProps) {
  const [formData, setFormData] = useState({
    name: '',
    nativeName: '',
    category: 'Studio',
    address: '',
    description: '',
    latitude: 37.5575,
    longitude: 126.9245,
    imageUrl: ''
  });

  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await addDoc(collection(db, "venues"), {
        ...formData,
        coordinates: {
          latitude: Number(formData.latitude),
          longitude: Number(formData.longitude)
        },
        status: 'active',
        createdAt: serverTimestamp()
      });
      alert('Venue registered successfully!');
      onClose();
    } catch (error) {
      console.error("Error saving venue:", error);
      alert('Failed to register venue.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-2xl rounded-[32px] overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300">
        <div className="relative p-8 max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-3xl font-black text-gray-900 tracking-tighter uppercase">Manage Entry</h2>
              <p className="text-xs text-[#0061ff] font-bold tracking-widest uppercase mt-1">Add New Workspace</p>
            </div>
            <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 text-gray-400 hover:bg-gray-200 transition-colors">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Venue Name</label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-[#f8f9fa] border-none rounded-2xl p-4 text-sm focus:ring-2 focus:ring-[#0061ff] transition-all"
                  placeholder="e.g. Hongdae Flow Studio"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Native Name (Optional)</label>
                <input 
                  type="text" 
                  value={formData.nativeName}
                  onChange={(e) => setFormData({...formData, nativeName: e.target.value})}
                  className="w-full bg-[#f8f9fa] border-none rounded-2xl p-4 text-sm focus:ring-2 focus:ring-[#0061ff] transition-all"
                  placeholder="홍대 플로우 스튜디오"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Category</label>
                <select 
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  className="w-full bg-[#f8f9fa] border-none rounded-2xl p-4 text-sm focus:ring-2 focus:ring-[#0061ff] transition-all appearance-none"
                >
                  <option>Studio</option>
                  <option>Academy</option>
                  <option>Club</option>
                  <option>Shop</option>
                  <option>Service</option>
                  <option>Other</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Image URL</label>
                <input 
                  type="url" 
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({...formData, imageUrl: e.target.value})}
                  className="w-full bg-[#f8f9fa] border-none rounded-2xl p-4 text-sm focus:ring-2 focus:ring-[#0061ff] transition-all"
                  placeholder="https://images.unsplash.com/..."
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Address</label>
              <input 
                type="text" 
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                className="w-full bg-[#f8f9fa] border-none rounded-2xl p-4 text-sm focus:ring-2 focus:ring-[#0061ff] transition-all"
                placeholder="Seoul, Mapo-gu, Yanghwa-ro 160"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Latitude</label>
                <input 
                  type="number" 
                  step="any"
                  value={formData.latitude}
                  onChange={(e) => setFormData({...formData, latitude: parseFloat(e.target.value)})}
                  className="w-full bg-[#f8f9fa] border-none rounded-2xl p-4 text-sm focus:ring-2 focus:ring-[#0061ff] transition-all"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Longitude</label>
                <input 
                  type="number" 
                  step="any"
                  value={formData.longitude}
                  onChange={(e) => setFormData({...formData, longitude: parseFloat(e.target.value)})}
                  className="w-full bg-[#f8f9fa] border-none rounded-2xl p-4 text-sm focus:ring-2 focus:ring-[#0061ff] transition-all"
                />
              </div>
            </div>

            <div className="pt-4">
              <button 
                type="submit"
                disabled={saving}
                className="w-full py-4 bg-[#0061ff] text-white rounded-2xl font-black uppercase tracking-widest hover:bg-[#0052d9] transition-all disabled:opacity-50 shadow-xl shadow-[#0061ff]/20"
              >
                {saving ? 'Registering...' : 'Complete Registration'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
