'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Social } from '@/types/social';

interface SocialEventDetailProps {
  social: Social;
  onClose: () => void;
}

export default function SocialEventDetail({ social, onClose }: SocialEventDetailProps) {
  const [activeTab, setActiveTab] = useState('Info');
  
  const tabs = ['Info', 'Photos', 'Event', 'Table', 'Talk'];
  const weekNames = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const dayIndices = [1, 2, 3, 4, 5, 6, 0]; // Mon-Sun mapping to JS Date

  // Format date if popup
  const formattedDate = social.date 
    ? social.date.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', weekday: 'short' })
    : 'Every Week';

  return (
    <div className="fixed inset-0 z-[150] bg-[#f4fbfb] flex flex-col animate-in fade-in slide-in-from-bottom-8 duration-500 overflow-hidden font-body text-[#161d1e]">
      <style dangerouslySetInnerHTML={{ __html: `
        .material-symbols-outlined { font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />

      {/* TopAppBar */}
      <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-4 h-16 bg-white/90 backdrop-blur-md shadow-[0px_12px_32px_rgba(22,29,30,0.06)]">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <button onClick={onClose} className="hover:bg-gray-100 p-2 transition-colors active:opacity-70 rounded-full shrink-0">
            <span className="material-symbols-outlined text-gray-900">close</span>
          </button>
          <h1 className="text-lg font-extrabold font-headline text-gray-900 truncate uppercase tracking-tighter">{social.title}</h1>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button className="p-2 hover:bg-gray-100 transition-colors active:scale-95 rounded text-gray-500">
            <span className="material-symbols-outlined">share</span>
          </button>
          <button className="p-2 hover:bg-gray-100 transition-colors active:scale-95 rounded text-gray-500">
            <span className="material-symbols-outlined">bookmark</span>
          </button>
        </div>
        <div className="absolute bottom-0 left-0 w-full bg-gray-100 h-[1px]"></div>
      </header>

      {/* Tab Bar */}
      <nav className="fixed top-16 left-0 w-full z-40 bg-white/90 backdrop-blur-md border-b border-gray-100 flex items-center px-4 h-14 overflow-x-auto no-scrollbar gap-6">
        {tabs.map(tab => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`h-full border-b-2 text-sm whitespace-nowrap px-1 transition-all ${
              activeTab === tab ? 'border-primary text-primary font-bold' : 'border-transparent text-gray-500 hover:text-gray-900 font-semibold'
            }`}
          >
            {tab}
          </button>
        ))}
      </nav>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pt-[128px] pb-32 no-scrollbar">
        <div className="max-w-3xl mx-auto w-full">
          {activeTab === 'Info' && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              {/* 1. Image Swipe / Carousel Area */}
              <section className="px-6">
                <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden shadow-lg bg-gray-200">
                  <img alt={social.title} className="w-full h-full object-cover" src={social.imageUrl} />
                  <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-white shadow"></span>
                    <span className="w-2 h-2 rounded-full bg-white/40"></span>
                    <span className="w-2 h-2 rounded-full bg-white/40"></span>
                  </div>
                </div>
              </section>

              <section className="px-6 space-y-10 text-left">
                {/* 2. Date & Time */}
                <div className="p-6 bg-[#EEF5F6] rounded-xl border border-gray-100">
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="block text-[10px] font-black uppercase tracking-[0.15em] text-gray-400">Date & Time</label>
                      <p className="text-xl font-bold text-gray-900">{formattedDate}, {social.startTime} — {social.endTime}</p>
                    </div>
                    {social.type === 'regular' && (
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-[0.15em] text-gray-400 mb-3">Recurring Schedule</label>
                        <div className="flex justify-between gap-1 max-w-xs">
                          {weekNames.map((name, idx) => {
                            const isActive = social.dayOfWeek === dayIndices[idx];
                            return (
                              <span 
                                key={idx}
                                className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-sm ${
                                  isActive ? 'bg-primary text-white' : 'bg-white text-gray-300'
                                }`}
                              >
                                {name}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 3. DJ */}
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-primary shrink-0">
                    <span className="material-symbols-outlined text-2xl">person</span>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-[0.15em] text-gray-400 mb-1 leading-none">DJ</label>
                    <p className="font-bold text-gray-900">{social.djName || 'TBA'}</p>
                    <p className="text-sm text-gray-500">Live Mix</p>
                  </div>
                </div>

                {/* 4. Venue */}
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-primary shrink-0">
                    <span className="material-symbols-outlined text-2xl">location_on</span>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-[0.15em] text-gray-400 mb-1 leading-none">Venue</label>
                    <p className="font-bold text-gray-900">{social.venueName}</p>
                    <p className="text-sm text-gray-500">Main Hall, Downtown</p>
                  </div>
                </div>

                {/* 5. Hosted By */}
                <div className="space-y-4">
                  <label className="block text-[10px] font-black uppercase tracking-[0.15em] text-gray-400">Hosted By</label>
                  <div className="flex flex-wrap gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold border border-primary/20">
                        {social.organizerName.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">{social.organizerName}</p>
                        <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Main Host</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="pb-10">
                  <label className="block text-[10px] font-black uppercase tracking-[0.15em] text-gray-400 mb-3">Event Description</label>
                  <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                    <p className="text-gray-600 leading-relaxed font-medium">
                       {social.description || 'Join us for an unforgettable evening of music and connection. Experience the perfect blend of structural aesthetics and immersive house rhythms in an iconic setting.'}
                    </p>
                  </div>
                </div>
              </section>
            </motion.div>
          )}

          {activeTab !== 'Info' && (
            <div className="py-40 flex flex-col items-center justify-center opacity-20">
              <span className="material-symbols-outlined text-6xl mb-4">tab_unselected</span>
              <p className="text-xs font-black uppercase tracking-widest">{activeTab} system under construction</p>
            </div>
          )}
        </div>
      </main>

      {/* Bottom Action Bar */}
      <footer className="fixed bottom-0 left-0 w-full p-4 bg-white/80 backdrop-blur-md border-t border-gray-100 z-50">
        <div className="max-w-3xl mx-auto flex items-center gap-4">
          <div className="flex-1 text-left">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] mb-0.5">Pricing</p>
            <p className="text-lg font-black text-gray-900">FREE ENTRY</p>
          </div>
          <button className="flex-[2] bg-primary text-white font-black py-4 rounded-xl shadow-[0px_8px_24px_rgba(0,68,147,0.3)] hover:scale-[1.02] active:scale-95 transition-all text-center uppercase tracking-widest text-sm">
            Register for Event
          </button>
        </div>
      </footer>
    </div>
  );
}
