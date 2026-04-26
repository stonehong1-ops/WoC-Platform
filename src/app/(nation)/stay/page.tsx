'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { stayService } from '@/lib/firebase/stayService';
import { Stay } from '@/types/stay';
import CreateStay from '@/components/stay/CreateStay';
import { motion, AnimatePresence } from 'framer-motion';

export default function StayPage() {
  const { user } = useAuth();
  const [stays, setStays] = useState<Stay[]>([]);
  const [activeType, setActiveType] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([]);

  // 1. Subscribe to real-time stays
  useEffect(() => {
    const unsub = stayService.subscribeStays(
      activeType !== 'All' ? { type: activeType } : null,
      (data) => setStays(data)
    );
    return () => unsub();
  }, [activeType]);

  // 2. Local Filter for Search
  const filteredStays = stays.filter(s => 
    s.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.hostName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stayTypes = ['All', 'Couchsurfing', 'Dormitory', '1-Room', '2-Room', '3-Room', 'Pension'];

  const toggleCompare = (id: string) => {
    setSelectedForCompare(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : (prev.length < 2 ? [...prev, id] : [prev[1], id])
    );
  };

  // Bento Mapping Logic (Design Preservation)
  const featureStay = filteredStays[0];
  const secondaryStays = filteredStays.slice(1, 3);
  const wideStay = filteredStays[3];
  const otherStays = filteredStays.slice(4);

  return (
    <main className="max-w-7xl mx-auto px-4 pt-24 pb-8 space-y-8 bg-[#fefefe] min-h-screen relative">
      <style dangerouslySetInnerHTML={{ __html: `
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .material-symbols-outlined { font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24; }
      `}} />

      {/* Search & Filter Section */}
      <div className="space-y-6">
        <div className="relative max-w-2xl mx-auto">
          <div className="flex items-center bg-white rounded-full border border-[#acb3b4]/40 px-6 py-4 shadow-sm focus-within:ring-4 focus-within:ring-primary/5 transition-all">
            <span className="material-symbols-outlined text-[#757c7d] mr-4">search</span>
            <input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none focus:ring-0 w-full font-body text-[#2d3435] placeholder:text-[#596061]" 
              placeholder="Search by location or hostname" 
              type="text" 
            />
            <button className="p-2 hover:bg-[#ebeeef] rounded-full text-primary transition-colors">
              <span className="material-symbols-outlined">tune</span>
            </button>
          </div>
        </div>

        <div className="flex overflow-x-auto gap-3 pb-2 no-scrollbar">
          {stayTypes.map(t => (
            <button 
              key={t}
              onClick={() => setActiveType(t)}
              className={`px-5 py-2.5 rounded-full font-label text-sm whitespace-nowrap transition-all ${
                activeType === t ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-white text-[#596061] border border-[#acb3b4]/40 hover:border-primary'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Global Floating Action Button for Hosting */}
        <button 
          onClick={() => setShowCreateModal(true)}
          className="fixed top-24 right-8 bg-primary text-white px-6 py-3 rounded-full font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/30 flex items-center gap-2 hover:scale-110 active:scale-95 transition-all z-30"
        >
          <span className="material-symbols-outlined text-[18px]">add_home</span>
          Host a Stay
        </button>
      </div>

      {filteredStays.length === 0 ? (
        <div className="py-40 flex flex-col items-center justify-center text-center opacity-30">
          <span className="material-symbols-outlined text-6xl mb-4">home_work</span>
          <p className="text-sm font-black uppercase tracking-widest">No Stays Found in this area</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pb-20">
          {/* 1. Feature Card (Main Listing) */}
          {featureStay && (
            <div className="md:col-span-8 group relative bg-white rounded-xl overflow-hidden border border-[#acb3b4]/30 hover:shadow-2xl transition-all duration-500 animate-in fade-in zoom-in-95">
              <div className="relative h-[400px]">
                <img className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" alt={featureStay.title} src={featureStay.imageUrl} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>
                <button className="absolute top-4 right-4 p-2 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white hover:text-red-500 transition-all">
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
                </button>
                <div className="absolute bottom-6 left-6 text-white text-left">
                  <div className="flex items-center gap-2 mb-2">
                    {featureStay.isCommunityChoice && <span className="px-2 py-1 bg-primary text-white text-[10px] font-bold rounded uppercase">Group Choice</span>}
                    <span className="flex items-center gap-1 text-sm font-medium"><span className="material-symbols-outlined text-sm">location_on</span>{featureStay.location}</span>
                  </div>
                  <h2 className="text-3xl font-headline font-extrabold tracking-tight">{featureStay.title}</h2>
                </div>
              </div>
              <div className="p-6 flex justify-between items-end">
                <div className="flex items-center gap-4">
                  <img className="w-12 h-12 rounded-full border-2 border-primary object-cover" alt={featureStay.hostName} src={featureStay.hostPhoto || "https://lh3.googleusercontent.com/a/default-user"} />
                  <div className="text-left">
                    <p className="font-headline text-lg font-bold text-[#2d3435]">Hosted by {featureStay.hostName}</p>
                    <p className="text-sm text-[#596061]">{featureStay.hostRole} • ⭐ {featureStay.hostRating || 'New'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-headline font-black text-primary">${featureStay.pricePerNight}<span className="text-sm font-normal text-[#596061]">/night</span></p>
                  <div className="mt-2 flex items-center gap-2">
                    <input checked={selectedForCompare.includes(featureStay.id)} onChange={() => toggleCompare(featureStay.id)} className="w-4 h-4 rounded border-[#acb3b4] text-primary focus:ring-primary" id={`compare-${featureStay.id}`} type="checkbox" />
                    <label className="text-xs font-bold text-[#596061] uppercase tracking-widest cursor-pointer" htmlFor={`compare-${featureStay.id}`}>Compare</label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2. Secondary Cards */}
          <div className="md:col-span-4 flex flex-col gap-6 text-left">
            {secondaryStays.map(s => (
              <div key={s.id} className="bg-white rounded-xl overflow-hidden border border-[#acb3b4]/30 hover:shadow-xl transition-all cursor-pointer animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="h-48 relative">
                  <img className="w-full h-full object-cover" alt={s.title} src={s.imageUrl} />
                  <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded text-[10px] font-bold text-primary shadow-sm uppercase tracking-tighter">{s.distance || 'Near event'}</div>
                </div>
                <div className="p-4">
                  <h3 className="font-headline font-bold text-lg mb-1 text-[#2d3435] truncate">{s.title}</h3>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="material-symbols-outlined text-xs text-[#596061]">person</span>
                    <span className="text-xs text-[#596061] font-medium">{s.hostName}, {s.hostRole}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="font-headline font-extrabold text-lg text-[#2d3435]">${s.pricePerNight}<span className="text-xs font-normal">/night</span></p>
                    <input checked={selectedForCompare.includes(s.id)} onChange={() => toggleCompare(s.id)} className="w-4 h-4 rounded border-[#acb3b4] text-primary focus:ring-primary" type="checkbox" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 3. Wide Card */}
          {wideStay && (
            <div className="md:col-span-12 group bg-white rounded-xl overflow-hidden border border-[#acb3b4]/30 flex flex-col md:flex-row hover:shadow-xl transition-all text-left animate-in fade-in slide-in-from-bottom-8 duration-700">
              <div className="md:w-1/3 h-64 md:h-auto overflow-hidden">
                <img className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt={wideStay.title} src={wideStay.imageUrl} />
              </div>
              <div className="p-8 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      {wideStay.isNewlyListed && <span className="text-primary font-bold text-[10px] uppercase tracking-widest block mb-1">Newly Listed</span>}
                      <h3 className="text-2xl font-headline font-extrabold text-[#2d3435]">{wideStay.title}</h3>
                    </div>
                    <span className="flex items-center gap-1 font-bold text-primary">
                      <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                      {wideStay.hostRating || 'New'}
                    </span>
                  </div>
                  <p className="text-[#596061] leading-relaxed mb-6 max-w-2xl line-clamp-3">{wideStay.description}</p>
                  <div className="flex flex-wrap gap-4">
                    {wideStay.amenities.map(a => (
                      <div key={a} className="flex items-center gap-1 bg-[#f2f4f4] px-3 py-1 rounded-full text-xs font-semibold text-[#596061] uppercase tracking-tighter">
                        <span className="material-symbols-outlined text-sm">{a}</span> {a}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex justify-between items-center mt-8 pt-6 border-t border-[#acb3b4]/30">
                  <div className="flex items-center gap-3">
                    <img className="w-10 h-10 rounded-full object-cover" alt={wideStay.hostName} src={wideStay.hostPhoto || "https://lh3.googleusercontent.com/a/default-user"} />
                    <span className="text-sm font-bold text-[#2d3435]">Hosted by {wideStay.hostName}</span>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-xl font-headline font-black text-primary">${wideStay.pricePerNight}<span className="text-sm font-normal text-[#596061]">/night</span></p>
                    </div>
                    <input checked={selectedForCompare.includes(wideStay.id)} onChange={() => toggleCompare(wideStay.id)} className="w-5 h-5 rounded border-[#acb3b4] text-primary focus:ring-primary" type="checkbox" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 4. Rest of Stays */}
          {otherStays.map(s => (
             <div key={s.id} className="md:col-span-4 bg-white rounded-xl overflow-hidden border border-[#acb3b4]/30 hover:shadow-xl transition-all cursor-pointer animate-in fade-in duration-500">
               <div className="h-48 relative">
                 <img className="w-full h-full object-cover" alt={s.title} src={s.imageUrl} />
               </div>
               <div className="p-4">
                 <h3 className="font-headline font-bold text-lg mb-1 text-[#2d3435] truncate">{s.title}</h3>
                 <p className="text-xs text-[#596061] mb-4 truncate">{s.location}</p>
                 <div className="flex justify-between items-center">
                   <p className="font-headline font-extrabold text-lg text-[#2d3435]">${s.pricePerNight}<span className="text-xs font-normal">/night</span></p>
                   <input checked={selectedForCompare.includes(s.id)} onChange={() => toggleCompare(s.id)} className="w-4 h-4 rounded border-[#acb3b4] text-primary focus:ring-primary" type="checkbox" />
                 </div>
               </div>
             </div>
          ))}
        </div>
      )}

      {/* Floating Interaction Bar: Compare Selection */}
      <AnimatePresence>
        {selectedForCompare.length > 0 && (
          <motion.div 
            initial={{ y: 100, x: '-50%', opacity: 0 }}
            animate={{ y: 0, x: '-50%', opacity: 1 }}
            exit={{ y: 100, x: '-50%', opacity: 0 }}
            className="fixed bottom-24 left-1/2 z-40 w-[max-content]"
          >
            <div className="bg-[#0c0f0f] text-[#9c9d9d] px-8 py-4 rounded-full shadow-2xl flex items-center gap-10 border border-white/10 backdrop-blur-xl bg-opacity-90">
              <div className="flex items-center gap-4">
                <div className="flex -space-x-3">
                  {selectedForCompare.map(id => (
                    <div key={id} className="w-10 h-10 rounded-full border-2 border-[#0c0f0f] overflow-hidden bg-[#d8e2ff] animate-in zoom-in">
                      <img className="w-full h-full object-cover" alt="selected" src={stays.find(s => s.id === id)?.imageUrl} />
                    </div>
                  ))}
                  {selectedForCompare.length < 2 && (
                    <div className="w-10 h-10 rounded-full border-2 border-[#0c0f0f] overflow-hidden bg-[#d8e2ff] flex items-center justify-center">
                      <span className="material-symbols-outlined text-[#9c9d9d] opacity-40">add</span>
                    </div>
                  )}
                </div>
                <p className="font-label text-sm font-bold">{selectedForCompare.length} item{selectedForCompare.length > 1 ? 's' : ''} selected for <span className="text-[#c2d4ff]">Comparison</span></p>
              </div>
              <div className="h-6 w-px bg-white/20"></div>
              <button className="bg-primary text-white px-6 py-2 rounded-full font-label text-sm font-bold hover:scale-105 active:scale-95 transition-all">
                Compare Now
              </button>
              <button 
                onClick={() => setSelectedForCompare([])}
                className="text-[#9c9d9d]/60 hover:text-white transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Stay Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <CreateStay onClose={() => setShowCreateModal(false)} />
        )}
      </AnimatePresence>
    </main>
  );
}
