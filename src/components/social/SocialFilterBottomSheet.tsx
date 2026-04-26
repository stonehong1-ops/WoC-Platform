'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { socialService } from '@/lib/firebase/socialService';

interface SocialFilterBottomSheetProps {
  onClose: () => void;
  onApply: (filters: { organizers: string[]; venues: string[] }) => void;
  selectedOrganizers: string[];
  selectedVenues: string[];
  availableOrganizers?: string[];
  availableVenues?: string[];
}

export default function SocialFilterBottomSheet({ 
  onClose, 
  onApply,
  selectedOrganizers: initialOrganizers,
  selectedVenues: initialVenues,
  availableOrganizers = [],
  availableVenues = []
}: SocialFilterBottomSheetProps) {
  const [filterType, setFilterType] = useState<'Organizers' | 'Clubs'>('Organizers');
  const [organizers, setOrganizers] = useState<string[]>(availableOrganizers);
  const [venues, setVenues] = useState<string[]>(availableVenues);
  
  const [tempOrg, setTempOrg] = useState<string[]>(initialOrganizers);
  const [tempVen, setTempVen] = useState<string[]>(initialVenues);

  useEffect(() => {
    setOrganizers(availableOrganizers);
    setVenues(availableVenues);
  }, [availableOrganizers, availableVenues]);

  const toggleTarget = (name: string) => {
    if (filterType === 'Organizers') {
      setTempOrg(prev => prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]);
    } else {
      setTempVen(prev => prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]);
    }
  };

  const handleClear = () => {
    setTempOrg([]);
    setTempVen([]);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center animate-in fade-in duration-200">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
      
      {/* Modal Bottom Sheet */}
      <motion.div 
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="relative w-full max-w-xl bg-white rounded-t-[2.5rem] shadow-[0px_-12px_48px_rgba(0,0,0,0.12)] z-50 overflow-hidden flex flex-col h-[90vh] max-h-[795px]"
      >
        {/* Drag Handle */}
        <div className="w-full flex justify-center pt-4 pb-2">
          <div className="w-12 h-1.5 bg-surface-container-highest/60 rounded-full"></div>
        </div>

        {/* Header */}
        <header className="px-8 pt-4 pb-6 flex items-center justify-between shrink-0">
          <h1 className="text-[1.5rem] font-extrabold tracking-tight text-on-surface font-headline">Filter Socials</h1>
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </header>

        {/* Scrollable Content */}
        <main className="px-8 pb-36 overflow-y-auto space-y-10 flex-1 no-scrollbar">
          {/* Quick Filters */}
          <section>
            <h2 className="text-[0.75rem] font-bold uppercase tracking-[0.1em] text-on-surface-variant/80 mb-4">Quick Filters</h2>
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => setFilterType('Organizers')}
                className={`relative overflow-hidden group h-32 rounded-2xl p-5 flex flex-col justify-between text-left transition-all ${
                  filterType === 'Organizers' ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'bg-surface-container-low hover:bg-surface-container-high text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-3xl opacity-90" style={{ fontVariationSettings: "'FILL' 1" }}>verified_user</span>
                <p className="font-headline font-bold text-lg leading-tight">Organizers</p>
                <div className="absolute -right-2 -bottom-2 opacity-10 group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-8xl" style={{ fontVariationSettings: "'FILL' 1" }}>verified_user</span>
                </div>
              </button>
              <button 
                onClick={() => setFilterType('Clubs')}
                className={`relative overflow-hidden group h-32 rounded-2xl p-5 flex flex-col justify-between text-left transition-all ${
                  filterType === 'Clubs' ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'bg-surface-container-low hover:bg-surface-container-high text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: filterType === 'Clubs' ? "'FILL' 1" : "'FILL' 0" }}>groups</span>
                <p className="font-headline font-bold text-lg leading-tight">Clubs</p>
                <div className="absolute -right-2 -bottom-2 opacity-10 group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-8xl">groups</span>
                </div>
              </button>
            </div>
          </section>

          {/* List Section */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[0.75rem] font-bold uppercase tracking-[0.1em] text-on-surface-variant/80">Venues & Organizers</h2>
              <button onClick={handleClear} className="text-[0.75rem] font-semibold text-primary hover:underline">Clear all</button>
            </div>
            <div className="divide-y divide-outline-variant/10">
              {(filterType === 'Organizers' ? organizers : venues).map((item) => {
                const isSelected = filterType === 'Organizers' ? tempOrg.includes(item) : tempVen.includes(item);
                return (
                  <button 
                    key={item}
                    onClick={() => toggleTarget(item)}
                    className="w-full py-4 flex items-center justify-between group text-left"
                  >
                    <div className="flex flex-col">
                      <div className="flex items-baseline gap-2">
                        <span className="font-bold text-on-surface text-base">{item}</span>
                        {filterType === 'Organizers' && <span className="text-xs text-on-surface-variant font-medium">Organizer</span>}
                      </div>
                    </div>
                    <span 
                      className={`material-symbols-outlined ${isSelected ? 'text-primary' : 'text-outline-variant group-hover:text-primary transition-colors'}`}
                      style={{ fontVariationSettings: isSelected ? "'FILL' 1" : "'FILL' 0" }}
                    >
                      {isSelected ? 'check_circle' : 'circle'}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Decorative Context */}
          <section className="rounded-[1.25rem] overflow-hidden relative h-24 bg-surface-container-low border border-outline-variant/10 flex items-center p-4">
            <div className="flex-1">
              <p className="text-sm font-bold text-on-surface">Experience Buenos Aires</p>
              <p className="text-[0.75rem] text-on-surface-variant leading-tight mt-0.5">Recommended socials based on your history</p>
            </div>
            <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 shadow-sm border border-white">
              <img alt="Tango dancers" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAqeyDeC8p1ucpSE-r88HHGostnOWvjsybfZNcCpldM_gkxsLvwEqcU7siT-Ny2ZbBT1u5Afp12slnTzPIOwan0qjJmyX2Mq0jZQIWt7lXxWvI0o72KF2QT5B1riS_73hS9NnueKSCRyie0NxmF--bkCBfE9ZTN4ayu5Pm1auJvHaWg-ZVkl0LRpkPuSR_ilwqW36a55trNy66BiA9VlqRm6bX4-IIkz9kJ23uuMT7GZdKq3_0XFtjZ0EhEMmSedQNC41NYbHmC8rIK"/>
            </div>
          </section>
        </main>

        {/* Sticky Primary Action */}
        <footer className="shrink-0 p-6 pb-10 bg-white shadow-[0px_-24px_32px_rgba(255,255,255,0.9)] z-10 border-t border-outline-variant/10">
          <button 
            onClick={() => onApply({ organizers: tempOrg, venues: tempVen })}
            className="w-full h-14 rounded-2xl bg-primary text-white font-headline font-bold text-lg shadow-xl shadow-primary/20 hover:opacity-95 active:scale-[0.98] transition-all"
          >
            Show Results
          </button>
        </footer>
      </motion.div>
    </div>
  );
}
