'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { socialService } from '@/lib/firebase/socialService';
import { plazaService } from '@/lib/firebase/plazaService';
import { Social, SocialType } from '@/types/social';

interface EditSocialEventProps {
  onClose: () => void;
  onSuccess?: () => void;
  socialData?: Social; // If provided, edit mode
}

export default function EditSocialEvent({ onClose, onSuccess, socialData }: EditSocialEventProps) {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // 1. Form State
  const [title, setTitle] = useState(socialData?.title || '');
  const [type, setType] = useState<SocialType>(socialData?.type || 'regular');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState(socialData?.startTime || '19:00');
  const [endTime, setEndTime] = useState(socialData?.endTime || '23:00');
  const [dayOfWeek, setDayOfWeek] = useState<number>(socialData?.dayOfWeek ?? 4); // Default Friday (5) or Fri-index (4)? Let's use 0-6 (Sun-Sat). Fri=5.
  const [venueName, setVenueName] = useState(socialData?.venueName || '');
  const [djName, setDjName] = useState(socialData?.djName || '');
  const [dressCode, setDressCode] = useState('');
  
  // Social Events (Sub-programs)
  const [socialEvents, setSocialEvents] = useState<{ id: number; title: string }[]>([
    { id: 1, title: 'Welcome Drinks' },
    { id: 2, title: 'Main Performance' }
  ]);

  // Gallery
  const [images, setImages] = useState<string[]>(socialData?.imageUrl ? [socialData.imageUrl] : []);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S']; // Visual Mon-Sun
  const dayIndices = [1, 2, 3, 4, 5, 6, 0]; // Mapping to JS Date Sun=0

  const handleAddSocialEvent = () => {
    setSocialEvents([...socialEvents, { id: Date.now(), title: '' }]);
  };

  const handleRemoveSocialEvent = (id: number) => {
    setSocialEvents(socialEvents.filter(e => e.id !== id));
  };

  const handleSocialEventTitleChange = (id: number, val: string) => {
    setSocialEvents(socialEvents.map(e => e.id === id ? { ...e, title: val } : e));
  };

  const handleSave = async () => {
    if (!user || !title || images.length === 0) return alert("Please fill title and add a poster");
    
    setIsSubmitting(true);
    try {
      // For demo, we use first image as poster
      const finalData: Omit<Social, 'id' | 'createdAt'> = {
        title,
        type,
        organizerId: user.uid,
        organizerName: user.displayName || 'Anonymous',
        venueId: 'v1',
        venueName,
        imageUrl: images[0],
        startTime,
        endTime,
        dayOfWeek: type === 'regular' ? dayOfWeek : undefined,
        djName,
        // Other meta could go here
      };

      // Implementation of save logic
      // await socialService.saveSocial(finalData); 

      onSuccess?.();
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-[#f9f9f9] overflow-y-auto animate-in fade-in duration-300">
      <style dangerouslySetInnerHTML={{ __html: `
        .material-symbols-outlined { font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24; }
      `}} />

      {/* TopAppBar */}
      <header className="fixed top-0 left-0 w-full z-[210] flex justify-between items-center px-4 h-16 bg-white/85 backdrop-blur-md shadow-[0px_12px_32px_rgba(22,29,30,0.06)]">
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="hover:bg-[#EEF5F6] p-2 transition-colors active:opacity-70 rounded">
            <span className="material-symbols-outlined text-[#005BC0]">close</span>
          </button>
        </div>
        <h1 className="text-xl font-bold font-manrope text-[#2D3435]">{socialData ? 'Edit Event' : 'Create Event'}</h1>
        <div className="flex items-center gap-2">
          <button 
            onClick={handleSave}
            disabled={isSubmitting}
            className="flex items-center gap-2 px-3 py-2 hover:bg-[#EEF5F6] transition-colors active:scale-95 rounded text-[#005BC0]"
          >
            <span className="material-symbols-outlined">{isSubmitting ? 'sync' : 'save'}</span>
            <span className="text-sm font-medium">Save</span>
          </button>
          <button className="p-2 hover:bg-[#EEF5F6] transition-colors active:opacity-70 rounded">
            <span className="material-symbols-outlined text-[#ba1a1a]">delete</span>
          </button>
        </div>
        {/* Separation Line */}
        <div className="absolute bottom-0 left-0 w-full bg-[#EEF5F6] h-[1px]"></div>
      </header>

      {/* Main Content Canvas */}
      <main className="pt-24 pb-20 max-w-3xl mx-auto px-6">
        {/* 1. Event Title */}
        <section className="mb-12 text-left">
          <label className="block text-xs font-bold uppercase tracking-wider text-[#2D3435]/60 mb-3 font-inter">Event Title</label>
          <input 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-[#dde4e5] border-none focus:bg-white focus:ring-2 focus:ring-[#005BC0]/40 p-4 text-lg font-semibold rounded text-[#2D3435] placeholder:text-[#2D3435]/30 transition-all outline-none" 
            placeholder="Enter social name..." 
            type="text"
          />
        </section>

        {/* 2. Gallery */}
        <section className="mb-12 text-left">
          <div className="flex justify-between items-end mb-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#2D3435]/60 mb-1 font-inter">Gallery</label>
              <p className="text-xs text-[#2D3435]/40 font-medium">Up to 20 photos. First image is the Primary Poster.</p>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {/* Primary Poster Slot */}
            <div className="col-span-2 row-span-2 relative group aspect-square rounded overflow-hidden bg-white border-2 border-dashed border-[#005BC0]/20 flex flex-col items-center justify-center cursor-pointer hover:border-[#005BC0]/50 transition-all">
              {images[0] ? (
                <>
                  <img className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" src={images[0]} alt="poster" />
                  <div className="absolute top-3 left-3 bg-[#005BC0] text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm z-10">PRIMARY POSTER</div>
                </>
              ) : (
                <div className="flex flex-col items-center text-[#2D3435]/20">
                  <span className="material-symbols-outlined text-4xl mb-1">add_a_photo</span>
                  <span className="text-[10px] font-bold">Add Cover</span>
                </div>
              )}
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white drop-shadow-md z-20">
                <span className="material-symbols-outlined text-3xl mb-1">add_a_photo</span>
                <span className="text-xs font-bold">{images[0] ? 'Replace Cover' : 'Add Cover'}</span>
              </div>
            </div>
            {/* Thumbnails */}
            {[...Array(4)].map((_, i) => (
              <div key={i} className="aspect-square bg-[#EEF5F6] rounded flex items-center justify-center cursor-pointer border-2 border-transparent hover:border-[#005BC0]/30 transition-all">
                <span className="material-symbols-outlined text-[#2D3435]/20">add</span>
              </div>
            ))}
          </div>
        </section>

        {/* 3. Event Type */}
        <section className="mb-12 text-left">
          <label className="block text-xs font-bold uppercase tracking-wider text-[#2D3435]/60 mb-4 font-inter">Event Type</label>
          <div className="flex gap-2">
            <button 
              onClick={() => setType('regular')}
              className={`flex-1 py-4 rounded font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                type === 'regular' ? 'bg-[#004493] text-white shadow-md' : 'bg-[#e2e9ea] text-[#2D3435]/60 hover:bg-[#dde4e5]'
              }`}
            >
              <span className="material-symbols-outlined" style={{ fontVariationSettings: type === 'regular' ? "'FILL' 1" : "'FILL' 0" }}>calendar_today</span>
              Regular
            </button>
            <button 
              onClick={() => setType('popup')}
              className={`flex-1 py-4 rounded font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                type === 'popup' ? 'bg-[#004493] text-white shadow-md' : 'bg-[#e2e9ea] text-[#2D3435]/60 hover:bg-[#dde4e5]'
              }`}
            >
              <span className="material-symbols-outlined" style={{ fontVariationSettings: type === 'popup' ? "'FILL' 1" : "'FILL' 0" }}>bolt</span>
              Popup
            </button>
          </div>
        </section>

        {/* 4. Date & Time */}
        <section className="mb-12 p-6 bg-[#EEF5F6] rounded text-left">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Date Picker */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#2D3435]/60 mb-3 font-inter">Start Date</label>
              <div className="relative">
                <input 
                  className="w-full bg-white border-none p-3 rounded font-semibold text-[#2D3435] focus:ring-2 focus:ring-[#005BC0]/40 outline-none" 
                  type="date"
                />
              </div>
            </div>
            {/* Time Pickers */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#2D3435]/60 mb-3 font-inter">Time Interval</label>
              <div className="flex items-center gap-3">
                <input 
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="flex-1 bg-white border-none p-3 rounded font-semibold text-[#2D3435] focus:ring-2 focus:ring-[#005BC0]/40 outline-none" 
                  type="time"
                />
                <span className="text-[#2D3435]/30">to</span>
                <input 
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="flex-1 bg-white border-none p-3 rounded font-semibold text-[#2D3435] focus:ring-2 focus:ring-[#005BC0]/40 outline-none" 
                  type="time"
                />
              </div>
            </div>
            {/* Day Selector (Recurring Days) */}
            <div className={`col-span-full transition-opacity ${type === 'regular' ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#2D3435]/60 mb-3 font-inter">Recurring Day (Single Select)</label>
              <div className="flex justify-between gap-1">
                {days.map((day, idx) => {
                  const isActive = dayOfWeek === dayIndices[idx];
                  return (
                    <button 
                      key={idx}
                      onClick={() => setDayOfWeek(dayIndices[idx])}
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                        isActive ? 'bg-[#004493] text-white shadow-lg' : 'bg-white text-[#2D3435]/40 hover:bg-[#005BC0]/10'
                      }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* 5 & 6. Venue & DJ */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12 text-left">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#2D3435]/60 mb-3 font-inter">Venue Selection</label>
            <div className="relative group">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#2D3435]/40">location_on</span>
              <input 
                value={venueName}
                onChange={(e) => setVenueName(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-white border-none rounded shadow-sm focus:ring-2 focus:ring-[#005BC0]/40 font-medium outline-none" 
                placeholder="Search venues..." 
                type="text"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#2D3435]/60 mb-3 font-inter">DJ Selection</label>
            <div className="relative group">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#2D3435]/40">person</span>
              <input 
                value={djName}
                onChange={(e) => setDjName(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-white border-none rounded shadow-sm focus:ring-2 focus:ring-[#005BC0]/40 font-medium outline-none" 
                placeholder="Search artists..." 
                type="text"
              />
            </div>
          </div>
        </section>

        {/* 7. Dress Code */}
        <section className="mb-12 text-left">
          <label className="block text-xs font-bold uppercase tracking-wider text-[#2D3435]/60 mb-3 font-inter">Dress Code</label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#2D3435]/40">checkroom</span>
            <input 
              value={dressCode}
              onChange={(e) => setDressCode(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-white border-none rounded shadow-sm focus:ring-2 focus:ring-[#005BC0]/40 font-medium outline-none" 
              placeholder="e.g. Cocktail Attire, All White..." 
              type="text"
            />
          </div>
        </section>

        {/* 8. Social Events Schedule */}
        <section className="mb-20 text-left">
          <div className="flex items-center justify-between mb-6">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#2D3435]/60 font-inter">Social Events Schedule</label>
            <button 
              onClick={handleAddSocialEvent}
              className="text-xs font-bold text-[#005BC0] flex items-center gap-1 hover:underline active:opacity-70"
            >
              <span className="material-symbols-outlined text-sm">add_circle</span>
              ADD SOCIAL EVENT
            </button>
          </div>
          <div className="space-y-3">
            {socialEvents.map(event => (
              <div key={event.id} className="flex items-center gap-4 bg-white p-4 rounded shadow-sm group animate-in slide-in-from-right-4 duration-300">
                <div className="flex-1">
                  <input 
                    value={event.title}
                    onChange={(e) => handleSocialEventTitleChange(event.id, e.target.value)}
                    className="w-full bg-transparent border-none p-0 focus:ring-0 font-bold text-[#2D3435] outline-none" 
                    type="text" 
                    placeholder="Enter social event title..."
                  />
                  <p className="text-[10px] text-[#2D3435]/40 font-bold uppercase mt-1">Social Event Name</p>
                </div>
                <button 
                  onClick={() => handleRemoveSocialEvent(event.id)}
                  className="p-2 opacity-0 group-hover:opacity-100 text-[#ba1a1a] transition-opacity"
                >
                  <span className="material-symbols-outlined">remove_circle</span>
                </button>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
