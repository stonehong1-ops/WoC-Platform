'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { groupService } from '@/lib/firebase/groupService';
import { auth } from '@/lib/firebase/clientApp';

interface CreateEventPopupProps {
  groupId: string;
  selectedDate: Date;
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateEventPopup({ groupId, selectedDate, isOpen, onClose }: CreateEventPopupProps) {
  const [title, setTitle] = useState('');
  const [startTime, setStartTime] = useState('19:00');
  const [endTime, setEndTime] = useState('21:00');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [tag, setTag] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when opened
  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setStartTime('19:00');
      setEndTime('21:00');
      setLocation('');
      setDescription('');
      setTag('');
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        alert('Please sign in to add events.');
        setIsSubmitting(false);
        return;
      }

      const eventDate = format(selectedDate, 'yyyy-MM-dd');
      await groupService.addCalendarEvent(groupId, {
        title: title.trim(),
        startDate: eventDate,
        startTime,
        endTime,
        location: location.trim(),
        description: description.trim(),
        tag: tag.trim(),
        category: 'Group',
        type: 'event',
        createdBy: user.uid,
        author: {
          id: user.uid,
          name: user.displayName || 'Member',
          avatar: user.photoURL || ''
        }
      });
      onClose();
    } catch (error: any) {
      console.error('Failed to add event:', error);
      alert(`Failed to save event: ${error.message || 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTagChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val.length <= 10) {
      setTag(val);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center">
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          
          {/* Modal Container */}
          <motion.div 
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full h-full md:h-[90vh] md:max-w-2xl bg-white md:rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="px-6 py-5 border-b border-[#a3abd7]/10 flex items-center justify-between bg-white sticky top-0 z-10">
              <button 
                onClick={onClose}
                className="text-[13px] font-bold text-[#515981] hover:text-[#242c51] transition-colors"
              >
                Cancel
              </button>
              <h2 className="font-headline font-extrabold text-lg text-[#242c51]">New Event</h2>
              <button 
                onClick={handleSubmit}
                disabled={!title.trim() || isSubmitting}
                className="text-[13px] font-bold text-[#0057bd] disabled:opacity-30 hover:text-[#004ca6] transition-colors"
              >
                {isSubmitting ? 'Saving...' : 'Save'}
              </button>
            </div>

            {/* Form Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar pb-24">
              {/* Date Header */}
              <div className="flex items-center gap-3 bg-[#F1F5F9] p-4 rounded-2xl">
                <div className="w-12 h-12 bg-white rounded-xl flex flex-col items-center justify-center shadow-sm">
                  <span className="text-[10px] font-black text-[#0057bd] uppercase tracking-tighter">{format(selectedDate, 'MMM')}</span>
                  <span className="text-lg font-black text-[#242c51] leading-none">{format(selectedDate, 'd')}</span>
                </div>
                <div>
                  <p className="text-xs font-bold text-[#515981] uppercase tracking-wider">{format(selectedDate, 'EEEE')}</p>
                  <p className="text-sm font-black text-[#242c51]">{format(selectedDate, 'MMMM do, yyyy')}</p>
                </div>
              </div>

              {/* Input Fields */}
              <div className="space-y-6">
                {/* Title */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-[#515981]/60 px-1">Title</label>
                  <input 
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Event name"
                    className="w-full bg-[#F1F5F9] border-none rounded-2xl p-4 text-base font-bold text-[#242c51] placeholder:text-[#515981]/30 focus:ring-2 focus:ring-[#0057bd]/20 transition-all"
                  />
                </div>

                {/* Time Section */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-[#515981]/60 px-1">Start Time</label>
                    <input 
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full bg-[#F1F5F9] border-none rounded-2xl p-4 text-base font-bold text-[#242c51] focus:ring-2 focus:ring-[#0057bd]/20 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-[#515981]/60 px-1">End Time</label>
                    <input 
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full bg-[#F1F5F9] border-none rounded-2xl p-4 text-base font-bold text-[#242c51] focus:ring-2 focus:ring-[#0057bd]/20 transition-all"
                    />
                  </div>
                </div>

                {/* Tag Input (Special Feature) */}
                <div className="space-y-2">
                  <div className="flex justify-between items-end px-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-[#515981]/60">Tag</label>
                    <span className={`text-[9px] font-bold ${tag.length >= 10 ? 'text-red-500' : 'text-[#515981]/40'}`}>
                      {tag.length}/10
                    </span>
                  </div>
                  <div className="relative">
                    <input 
                      type="text"
                      value={tag}
                      onChange={handleTagChange}
                      placeholder="Add a custom tag (e.g. Milonga)"
                      className={`w-full bg-[#F1F5F9] border-none rounded-2xl p-4 text-base font-bold text-[#242c51] placeholder:text-[#515981]/30 focus:ring-2 transition-all ${tag.length >= 10 ? 'focus:ring-red-500/20' : 'focus:ring-[#0057bd]/20'}`}
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-[#515981]/20 text-lg">sell</span>
                  </div>
                </div>

                {/* Location */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-[#515981]/60 px-1">Location</label>
                  <div className="relative">
                    <input 
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="Where is it happening?"
                      className="w-full bg-[#F1F5F9] border-none rounded-2xl p-4 text-base font-bold text-[#242c51] placeholder:text-[#515981]/30 focus:ring-2 focus:ring-[#0057bd]/20 transition-all pl-12"
                    />
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-[#0057bd] text-xl">location_on</span>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-[#515981]/60 px-1">Description</label>
                  <textarea 
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="What's this event about?"
                    rows={4}
                    className="w-full bg-[#F1F5F9] border-none rounded-2xl p-4 text-base font-bold text-[#242c51] placeholder:text-[#515981]/30 focus:ring-2 focus:ring-[#0057bd]/20 transition-all resize-none"
                  />
                </div>
              </div>
            </div>
            
            {/* Bottom Safe Area Padding for mobile */}
            <div className="h-6 bg-white md:hidden"></div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
