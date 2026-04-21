'use client';

import React, { useState, useEffect } from 'react';
import { venueService } from '@/lib/firebase/venueService';
import { Venue, VenueType } from '@/types/venue';

interface VenueFormProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: Venue | null;
}

const CATEGORY_OPTIONS = [
  { id: 'Shop', icon: 'shopping_bag', label: 'Shop' },
  { id: 'Studio', icon: 'palette', label: 'Studio' },
  { id: 'Stay', icon: 'bed', label: 'Stay' },
  { id: 'Academy', icon: 'school', label: 'Academy' },
  { id: 'Club', icon: 'groups', label: 'Club' },
  { id: 'Cafe', icon: 'coffee', label: 'Cafe' },
  { id: 'Eats', icon: 'restaurant', label: 'Eats' },
  { id: 'Beauty', icon: 'content_cut', label: 'Beauty' },
];

export default function VenueForm({ isOpen, onClose, initialData }: VenueFormProps) {
  const [formData, setFormData] = useState<Omit<Venue, 'id' | 'createdAt'>>({
    name: '',
    nameKo: '',
    types: ['Club'],
    category: 'Club',
    address: '',
    region: 'Seoul',
    city: 'Seoul',
    district: '',
    status: 'active',
    coordinates: { latitude: 37.5665, longitude: 126.9780 },
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        nameKo: initialData.nameKo || '',
        types: initialData.types || ['Club'],
        category: initialData.category,
        address: initialData.address,
        region: initialData.region,
        city: initialData.city,
        district: initialData.district,
        status: initialData.status,
        coordinates: initialData.coordinates,
      });
    }
  }, [initialData, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (initialData?.id) {
        await venueService.updateVenue(initialData.id, formData);
      } else {
        await venueService.addVenue(formData);
      }
      onClose();
    } catch (error) {
      console.error('Failed to save venue:', error);
      alert('Failed to save venue. Please check your connection and permissions.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!initialData?.id || !confirm('Are you sure you want to delete this venue?')) return;
    try {
      await venueService.deleteVenue(initialData.id);
      onClose();
    } catch (error) {
      console.error('Failed to delete venue:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] bg-background font-body text-on-background overflow-y-auto animate-slide-up no-scrollbar">
      {/* Header (TopAppBar) */}
      <header className="fixed top-0 left-0 w-full bg-surface border-b border-outline-variant/30 h-16 px-4 flex justify-between items-center z-[120]">
        <div className="flex items-center gap-4">
          <button 
            onClick={onClose}
            className="p-2 hover:bg-surface-container rounded-full transition-colors flex items-center justify-center"
          >
            <span className="material-symbols-outlined text-on-surface-variant">arrow_back</span>
          </button>
          <h1 className="font-headline text-base font-bold text-on-surface">
            {initialData ? 'Edit Entry' : 'Manage Entry'}
          </h1>
        </div>
        <div className="flex items-center gap-1">
          <div className="text-[10px] font-extrabold text-on-surface-variant tracking-tighter uppercase mr-2 hidden md:block">World of Group</div>
          {initialData && (
            <button 
              onClick={handleDelete}
              className="p-2 hover:bg-error-container/10 rounded-full transition-colors flex items-center justify-center group"
            >
              <span className="material-symbols-outlined text-on-surface-variant group-hover:text-error">delete</span>
            </button>
          )}
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 pt-24 pb-12 md:pt-32 md:pb-20">
        <header className="mb-12">
          <h2 className="font-headline text-3xl md:text-4xl font-extrabold text-on-surface tracking-tight mb-3">
            {initialData ? 'Update your space.' : 'Configure your space.'}
          </h2>
          <p className="text-on-surface-variant text-base leading-relaxed">Keep your venue details up to date for the local group.</p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-16">
          {/* 1. Venue Name */}
          <section>
            <div className="flex items-center gap-2 mb-6">
              <span className="material-symbols-outlined text-primary">edit_square</span>
              <h3 className="font-headline text-xl font-bold text-on-surface">Venue Name</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest ml-1" htmlFor="venue-name-en">Venue Name (English) *</label>
                <input 
                  className="w-full px-4 py-4 bg-surface-container-lowest border-none ring-1 ring-outline-variant focus:ring-2 focus:ring-primary rounded-xl transition-all font-body text-on-surface" 
                  id="venue-name-en" 
                  placeholder="e.g. Blue Coffee Roasters" 
                  required 
                  type="text" 
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest ml-1" htmlFor="venue-name-ko">Venue Name (Korean) <span className="normal-case opacity-70">(If applicable)</span></label>
                <input 
                  className="w-full px-4 py-4 bg-surface-container-lowest border-none ring-1 ring-outline-variant focus:ring-2 focus:ring-primary rounded-xl transition-all font-body text-on-surface" 
                  id="venue-name-ko" 
                  placeholder="e.g. 탱고라이프" 
                  type="text" 
                  value={formData.nameKo}
                  onChange={(e) => setFormData({ ...formData, nameKo: e.target.value })}
                />
              </div>
            </div>
          </section>

          {/* 2. Venue Category */}
          <section>
            <div className="flex items-center gap-2 mb-6">
              <span className="material-symbols-outlined text-primary">category</span>
              <h3 className="font-headline text-xl font-bold text-on-surface">Venue Category *</h3>
            </div>
            <div className="bento-grid">
              {CATEGORY_OPTIONS.map((cat) => (
                <label key={cat.id} className="group relative cursor-pointer">
                  <input 
                    className="peer sr-only" 
                    name="category" 
                    type="radio" 
                    checked={formData.category === cat.id}
                    onChange={() => setFormData({ ...formData, category: cat.id as VenueType })}
                  />
                  <div className="flex flex-col items-center justify-center p-4 aspect-square bg-surface-container-low rounded-xl border-2 border-transparent transition-all group-hover:bg-surface-container peer-checked:border-primary peer-checked:bg-primary-container/30">
                    <span className="material-symbols-outlined text-on-surface-variant peer-checked:text-primary mb-2">{cat.icon}</span>
                    <span className="font-label text-xs font-semibold text-on-surface-variant group-hover:text-on-surface">{cat.label}</span>
                  </div>
                </label>
              ))}
            </div>
          </section>

          {/* 3. Owner/Operator */}
          <section>
            <div className="flex items-center gap-2 mb-6">
              <span className="material-symbols-outlined text-primary">person_pin</span>
              <h3 className="font-headline text-xl font-bold text-on-surface">Owner / Operator *</h3>
            </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center overflow-hidden">
                  <span className="material-symbols-outlined text-primary text-xl">person</span>
                </div>
                <span className="font-body text-sm font-semibold text-on-surface">Admin Mode</span>
              </div>
          </section>

          {/* 4. Global Details (Timezone Only) */}
          <section>
            <div className="flex items-center gap-2 mb-6">
              <span className="material-symbols-outlined text-primary">public</span>
              <h3 className="font-headline text-xl font-bold text-on-surface">Global Details</h3>
            </div>
            <div className="grid grid-cols-1 gap-6">
              <div className="space-y-2">
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest ml-1" htmlFor="timezone">Venue Timezone</label>
                <div className="flex items-center gap-3 w-full px-4 py-4 bg-surface-container-low/50 border-none ring-1 ring-outline-variant/30 rounded-xl font-body text-on-surface-variant">
                  <span className="material-symbols-outlined text-primary/70 text-lg">auto_mode</span>
                  <span className="text-sm font-medium">Auto-detected: <span className="text-on-surface font-semibold">Singapore/Beijing (UTC+08:00)</span></span>
                </div>
                <p className="text-[10px] text-on-surface-variant italic px-1">Derived automatically from your pinned map location.</p>
              </div>
            </div>
          </section>

          {/* 5. Location Details */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">location_on</span>
                <h3 className="font-headline text-xl font-bold text-on-surface">Location Details *</h3>
              </div>
              <button className="text-primary text-xs font-bold uppercase tracking-wider flex items-center gap-1 hover:underline" type="button">
                <span className="material-symbols-outlined text-sm">push_pin</span>
                Pin on map
              </button>
            </div>
            <div className="space-y-6">
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline">search</span>
                <input 
                  className="w-full pl-12 pr-4 py-4 bg-surface-container-lowest border-none ring-1 ring-outline-variant focus:ring-2 focus:ring-primary rounded-xl transition-all font-body text-on-surface" 
                  placeholder="Address or phone number" 
                  type="text" 
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
              <div className="relative overflow-hidden rounded-2xl border border-outline-variant/30 h-72 md:h-80 shadow-inner">
                <img 
                  className="w-full h-full object-cover" 
                  alt="map" 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuC8tfDbQWKDDv515KjvIZwUg8Lh4_Q-Jd_xdlIeFh7yK7IrNeAq-VSLnYgKFUc9I6TinG58w206YtxavEb0ZpKL1SbczWkHlsVClREBc4r9Eew9jTNCRXk9D7J-VwGJ5bcrpGmEplXN9RacpentTG91wQjqc4yaxqAaiKbQOXiwDE8CJ4icvMGFpxT14yC5BRWOwA3OEu65PObN5C3YzHIr0wCSpTvc8O7pBOTcWg083IMfTcsAcTdbfkF-6XKZFdEemccreB7GZ5XB"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent flex items-end p-4">
                  <div className="bg-surface-container-lowest/95 backdrop-blur-md px-4 py-3 rounded-xl flex items-center justify-between w-full shadow-lg">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-primary">explore</span>
                      <div>
                        <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Selected Coordinates</p>
                        <p className="text-xs font-mono font-bold text-on-surface">
                          {formData.coordinates.latitude.toFixed(6)}, {formData.coordinates.longitude.toFixed(6)}
                        </p>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-outline-variant">zoom_in</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <footer className="pt-8 flex flex-col gap-4">
            <button 
              disabled={isSubmitting}
              className="w-full bg-[#005BC0] text-on-primary py-4 rounded-xl font-headline font-bold text-lg hover:shadow-xl hover:shadow-primary/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-70" 
              type="submit"
            >
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
              {isSubmitting ? 'Saving...' : 'Complete'}
            </button>
            <button 
              onClick={onClose}
              className="w-full px-8 py-4 bg-transparent text-outline font-bold rounded-xl border-2 border-outline-variant hover:bg-surface-container-low transition-all" 
              type="button"
            >
              Cancel
            </button>
          </footer>
        </form>
      </main>

      <style jsx>{`
        .bento-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
          gap: 12px;
        }
        @keyframes slide-up {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-slide-up {
          animation: slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}
