import React, { useState } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { useLocation } from '@/components/providers/LocationProvider';
import { eventService } from '@/lib/firebase/eventService';
import { EventCategory } from '@/types/event';
import { Timestamp } from 'firebase/firestore';
import UniversalCompose from '@/components/common/UniversalCompose';

interface CreateEventProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function CreateEvent({ isOpen, onClose, onSuccess }: CreateEventProps) {
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

  const handleSubmit = async () => {
    if (!user || !title || !startDate) {
      alert("Please fill in the required fields (Title and Start Date).");
      return;
    }

    setIsSubmitting(true);
    try {
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
    <UniversalCompose
      id="event"
      isOpen={isOpen}
      onClose={onClose}
      title="Host Event"
      label="New Experience"
      submitLabel={isSubmitting ? "Launching..." : "Publish Event"}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
    >
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
    </UniversalCompose>
  );
}
