'use client';

import React, { useState } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { useLocation } from '@/components/providers/LocationProvider';
import { eventService } from '@/lib/firebase/eventService';
import { EventCategory } from '@/types/event';
import { Timestamp } from 'firebase/firestore';

interface CreateEventProps {
  onClose: () => void;
  onSuccess?: () => void;
}

export default function CreateEvent({ onClose, onSuccess }: CreateEventProps) {
  const { user } = useAuth();
  const { location } = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [title, setTitle] = useState('');
  const [titleNative, setTitleNative] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<EventCategory>('SOCIAL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [locationName, setLocationName] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !title || !startDate) return;

    setIsSubmitting(true);
    try {
      // Normalize to midnight UTC/Local depending on browser, but consistent
      const startObj = new Date(startDate);
      startObj.setHours(0, 0, 0, 0);
      
      const endObj = endDate ? new Date(endDate) : new Date(startDate);
      endObj.setHours(0, 0, 0, 0);
      
      await eventService.createEvent({
        title,
        titleNative,
        description,
        category,
        location: locationName || `${location?.city || 'Globe'}, ${location?.country || ''}`,
        startDate: Timestamp.fromDate(startObj),
        endDate: Timestamp.fromDate(endObj),
        hostId: user.uid,
        hostName: user.displayName || 'Anonymous',
        hostPhoto: user.photoURL || '',
      });

      onSuccess?.();
      onClose();
    } catch (error) {
      console.error("Error creating event:", error);
      alert("Failed to create event. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const categories: EventCategory[] = ['CONFERENCE', 'WORKSHOP', 'NETWORKING', 'PARTY', 'SOCIAL'];

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white w-full max-w-xl rounded-t-[32px] sm:rounded-[32px] shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300 flex flex-col max-h-[90vh]">
        {/* Header (Same as CreatePost for 1px consistency) */}
        <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-10 font-manrope">
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-primary tracking-[0.25em] uppercase mb-1">New Experience</span>
            <h3 className="text-[20px] font-black text-gray-900 uppercase tracking-tighter">Host Event</h3>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-50 hover:bg-gray-100 transition-all text-gray-400"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar scroll-smooth">
          {/* Title Input */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Event Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What's the name of your event?"
              className="w-full text-[24px] font-black tracking-tighter border-none focus:ring-0 placeholder:text-gray-200 p-0"
              autoFocus
              required
            />
          </div>

          {/* Native Name Input */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Native Name (Optional)</label>
            <input
              value={titleNative}
              onChange={(e) => setTitleNative(e.target.value)}
              placeholder="자국어(한글)명 (예: 서울 탱고 페스티벌)"
              className="w-full text-[16px] font-bold tracking-tight border-none focus:ring-0 placeholder:text-gray-200 p-0"
            />
          </div>

          {/* Category Selector */}
          <div className="space-y-4">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 text-center block">Category</label>
            <div className="flex flex-wrap gap-2 justify-center">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`px-4 py-2 rounded-full text-[11px] font-black transition-all tracking-tight ${
                    category === cat 
                      ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-105' 
                      : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 pt-4">
            {/* Date Input */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-5 py-3.5 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-primary/10 transition-all"
                required
              />
            </div>
            {/* End Date Input */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-5 py-3.5 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-primary/10 transition-all"
                placeholder="Optional"
              />
            </div>
          </div>

          {/* Location Input */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Location / Venue</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-300 text-[20px]">location_on</span>
              <input
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                placeholder="Ex. Seoul, South Korea or Venue Name"
                className="w-full pl-12 pr-5 py-3.5 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-primary/10 transition-all"
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Tell us more</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What will happen at this event? Share the vibes..."
              className="w-full min-h-[140px] px-5 py-4 bg-gray-50 border-none rounded-3xl text-sm font-medium focus:ring-2 focus:ring-primary/10 transition-all resize-none"
            />
          </div>

        </form>

        {/* Footer Content */}
        <div className="p-6 border-t border-gray-50 bg-white">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !title || !startDate}
            className={`w-full h-14 rounded-full font-black text-[15px] transition-all flex items-center justify-center gap-2 uppercase tracking-widest shadow-xl ${
              (isSubmitting || !title || !startDate)
                ? 'bg-gray-100 text-gray-300'
                : 'bg-primary text-white shadow-primary/30 hover:scale-[1.02] active:scale-[0.98]'
            }`}
          >
            {isSubmitting ? (
              <>
                <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Launching...</span>
              </>
            ) : (
              <span>Publish Event</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
