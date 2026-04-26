'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { lostService } from '@/lib/firebase/lostService';
import { LostItem } from '@/types/lost';
import CreateLostItem from '@/components/lost/CreateLostItem';
import LostItemDetail from '@/components/lost/LostItemDetail';
import { motion, AnimatePresence } from 'framer-motion';

export default function LostPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<LostItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<'All' | 'Lost' | 'Found'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<LostItem | null>(null);

  // 1. Subscribe to real-time reports
  useEffect(() => {
    const unsub = lostService.subscribeItems(
      activeCategory !== 'All' ? activeCategory : null,
      (data) => setItems(data)
    );
    return () => unsub();
  }, [activeCategory]);

  // 2. Local Filter for Search
  const filteredItems = items.filter(item => 
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    item.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.itemType.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <main className="max-w-4xl mx-auto px-4 pt-24 pb-8 space-y-8 bg-white min-h-screen relative">
      <style dangerouslySetInnerHTML={{ __html: `
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .material-symbols-outlined { font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24; }
      `}} />

      {/* Hero Section */}
      <section className="text-left space-y-2">
        <span className="text-primary font-black text-[10px] uppercase tracking-[0.25em]">Guardian Network</span>
        <h1 className="text-4xl font-headline font-black text-gray-900 tracking-tighter uppercase leading-none">Lost & Found</h1>
        <p className="text-sm text-gray-500 font-medium max-w-sm">Recovering hobby passion by reconnecting lost items to their owners.</p>
      </section>

      {/* Control Bar */}
      <div className="flex flex-col sm:flex-row gap-4 sticky top-16 bg-white/95 backdrop-blur-md z-30 py-4 border-b border-gray-100">
        <div className="flex-1 relative">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">search</span>
          <input 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-primary/10 text-sm font-bold placeholder:text-gray-300"
            placeholder="Search by item or location..."
            type="text" 
          />
        </div>
        <div className="flex p-1 bg-gray-50 rounded-2xl">
          {['All', 'Lost', 'Found'].map((cat) => (
            <button
               key={cat}
               onClick={() => setActiveCategory(cat as any)}
               className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                 activeCategory === cat ? 'bg-white text-primary shadow-sm' : 'text-gray-400 hover:text-gray-600'
               }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Items Grid */}
      {filteredItems.length === 0 ? (
        <div className="py-40 flex flex-col items-center justify-center text-center opacity-20">
          <span className="material-symbols-outlined text-6xl mb-4">manage_search</span>
          <p className="text-sm font-black uppercase tracking-widest">No reports found in this sector</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 pb-32">
          {filteredItems.map((item) => (
            <div 
              key={item.id}
              onClick={() => setSelectedItem(item)}
              className="group flex flex-col bg-white rounded-[24px] border border-gray-100 overflow-hidden hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 animate-in fade-in zoom-in-95 cursor-pointer"
            >
              <div className="relative aspect-[4/5] overflow-hidden bg-gray-50">
                <img 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                  alt={item.title} 
                  src={item.imageUrl} 
                />
                <div className={`absolute top-4 left-4 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl flex items-center gap-1 ${
                   item.category === 'Lost' ? 'bg-[#9f403d] text-white' : 'bg-[#1A73E8] text-white'
                }`}>
                   <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                   {item.category}
                </div>
                {item.status === 'returned' && (
                  <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center">
                    <span className="bg-green-500 text-white px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest shadow-2xl">Returned</span>
                  </div>
                )}
              </div>
              <div className="p-5 flex-1 flex flex-col text-left">
                <div className="space-y-1 mb-4 flex-1">
                   <h3 className="font-headline font-black text-gray-900 leading-tight group-hover:text-primary transition-colors line-clamp-2 uppercase tracking-tighter">
                     {item.title}
                   </h3>
                   <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      <span className="material-symbols-outlined text-[14px]">location_on</span>
                      <span className="truncate">{item.location}</span>
                   </div>
                </div>
                <div className="pt-4 border-t border-gray-50 flex items-center justify-between">
                   <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest">{item.itemType}</span>
                   <span className="material-symbols-outlined text-gray-200 group-hover:text-primary transition-colors">arrow_forward</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Global Safety FAB (Guardian Context) */}
      <button 
        onClick={() => setShowCreateModal(true)}
        className="fixed bottom-10 right-10 w-20 h-20 bg-[#9f403d] text-white rounded-full shadow-2xl shadow-[#9f403d]/40 flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-50 group"
      >
        <div className="absolute inset-0 bg-white/20 rounded-full scale-0 group-hover:scale-100 transition-transform duration-500" />
        <span className="material-symbols-outlined text-[36px] font-bold relative z-10 animate-pulse">emergency</span>
      </button>

      {/* Create Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <CreateLostItem 
            onClose={() => setShowCreateModal(false)}
            onSuccess={() => {}}
          />
        )}
        {selectedItem && (
          <LostItemDetail
            item={selectedItem}
            onClose={() => setSelectedItem(null)}
          />
        )}
      </AnimatePresence>
    </main>
  );
}
