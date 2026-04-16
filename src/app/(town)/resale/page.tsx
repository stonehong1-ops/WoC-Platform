'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { resaleService } from '@/lib/firebase/resaleService';
import { ResaleItem } from '@/types/resale';
import CreateResaleItem from '@/components/resale/CreateResaleItem';
import { motion, AnimatePresence } from 'framer-motion';

export default function ResalePage() {
  const { user } = useAuth();
  const [items, setItems] = useState<ResaleItem[]>([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [userLikes, setUserLikes] = useState<string[]>([]);

  // 1. Subscribe to real-time resale items
  useEffect(() => {
    const unsub = resaleService.subscribeItems(
      activeCategory !== 'All' ? activeCategory : null,
      (data) => setItems(data)
    );
    return () => unsub();
  }, [activeCategory]);

  // 2. Filter products locally based on search
  const filteredItems = items.filter(item => 
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    item.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const categories = ['All', 'Shoes', 'Apparel', 'Accessories', 'Equipment', 'Others'];

  const handleLike = async (e: React.MouseEvent, itemId: string) => {
    e.stopPropagation();
    if (!user) return alert("Please login to like items");
    await resaleService.toggleLike(user.uid, itemId);
  };

  const getRelativeTime = (timestamp: any) => {
    if (!timestamp) return 'Just now';
    const now = new Date();
    const date = timestamp.toDate();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  return (
    <main className="max-w-2xl mx-auto min-h-screen flex flex-col pt-16 bg-white relative">
      <style dangerouslySetInnerHTML={{ __html: `
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .material-symbols-outlined { font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24; }
      `}} />

      {/* 1. Search and Location Header Section */}
      <section className="bg-white/95 backdrop-blur-md px-4 pt-4 pb-2 sticky top-16 z-40 border-b border-surface-container-highest">
        <div className="flex flex-col gap-3">
          {/* Location Picker */}
          <div className="flex items-center gap-1 group cursor-pointer w-fit">
            <span className="material-symbols-outlined text-primary text-[20px]">location_on</span>
            <span className="font-headline font-bold text-sm tracking-tight text-[#2d3435]">Seoul, Gangnam-gu</span>
            <span className="material-symbols-outlined text-on-surface-variant text-[16px]">expand_more</span>
          </div>
          {/* Search Bar */}
          <div className="relative flex items-center mb-2">
            <span className="material-symbols-outlined absolute left-4 text-on-surface-variant">search</span>
            <input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-[#f2f4f4] border-none rounded-xl focus:ring-2 focus:ring-primary/20 text-sm font-medium placeholder:text-on-surface-variant/60 outline-none transition-all" 
              placeholder="Search in this Society..." 
              type="text"
            />
          </div>
        </div>
      </section>

      {/* 2. Category Scroll Navigation */}
      <section className="bg-white py-4 border-b border-surface-container-highest z-30">
        <div className="flex gap-2 overflow-x-auto px-4 no-scrollbar scroll-smooth">
          {categories.map((cat, i) => (
            <button 
              key={i}
              onClick={() => setActiveCategory(cat)}
              className={`px-5 py-2 rounded-full font-headline text-xs font-bold whitespace-nowrap transition-all active:scale-95 ${
                activeCategory === cat 
                  ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                  : 'bg-[#f2f4f4] text-[#596061] hover:bg-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* 3. Product Listing: Vertical Bento Style */}
      <section className="flex flex-col p-4 gap-4 pb-32 min-h-[60vh]">
        {filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-40 opacity-20">
            <span className="material-symbols-outlined text-6xl mb-4">inventory_2</span>
            <p className="text-sm font-black uppercase tracking-widest">No listings found</p>
          </div>
        ) : (
          filteredItems.map((item) => (
            <div 
              key={item.id}
              className="flex gap-4 p-3 bg-white rounded-xl shadow-sm hover:shadow-lg transition-all group cursor-pointer border border-surface-container-highest/50 animate-in fade-in slide-in-from-bottom-4 duration-500"
            >
              <div className="relative w-32 h-32 flex-shrink-0 overflow-hidden rounded-lg bg-surface-container">
                <img 
                  alt={item.title} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                  src={item.imageUrl} 
                />
                {item.status !== 'active' && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <span className="text-white text-[10px] font-black uppercase tracking-widest bg-black/60 px-2 py-1 rounded">
                      {item.status}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex flex-col justify-between flex-grow overflow-hidden">
                <div className="text-left">
                  <h3 className="font-headline font-bold text-[#2d3435] text-base leading-tight group-hover:text-primary transition-colors truncate">
                    {item.title}
                  </h3>
                  <div className="mt-1 flex items-center gap-1 text-[11px] text-[#596061]/80 font-medium uppercase tracking-wide">
                    <span>{item.location}</span>
                    <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                    <span>{getRelativeTime(item.createdAt)}</span>
                    <span className="w-1 h-1 rounded-full bg-gray-300 ml-1"></span>
                    <span className="text-primary font-bold">[{item.condition}]</span>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-auto">
                  <span className="font-headline font-extrabold text-primary text-xl">
                    ₩{item.price.toLocaleString()}
                  </span>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 text-[#596061]">
                      <span className="material-symbols-outlined text-[18px]">chat_bubble</span>
                      <span className="text-xs font-bold">{item.chatsCount}</span>
                    </div>
                    <button 
                      onClick={(e) => handleLike(e, item.id)}
                      className={`flex items-center gap-1 transition-all ${item.likesCount > 0 ? 'text-red-500' : 'text-[#596061]'} hover:scale-110`}
                    >
                      <span 
                        className="material-symbols-outlined text-[18px]" 
                        style={{ fontVariationSettings: item.likesCount > 0 ? "'FILL' 1" : "'FILL' 0" }}
                      >
                        favorite
                      </span>
                      <span className="text-xs font-bold">{item.likesCount}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}

        {filteredItems.length > 0 && (
          <div className="py-12 flex flex-col items-center justify-center gap-2 opacity-30">
            <span className="material-symbols-outlined text-4xl">inventory_2</span>
            <p className="text-xs font-bold uppercase tracking-widest">End of the line</p>
          </div>
        )}
      </section>

      {/* 4. Global Resale FAB */}
      <button 
        onClick={() => setShowCreateModal(true)}
        className="fixed bottom-24 right-6 w-16 h-16 bg-[#1f1f1f] text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 hover:bg-primary active:scale-95 transition-all z-50 group shadow-primary/20"
      >
        <span className="material-symbols-outlined text-[32px] group-hover:rotate-90 transition-transform duration-300">add</span>
      </button>

      {/* Create Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <CreateResaleItem 
            onClose={() => setShowCreateModal(false)}
            onSuccess={() => {}}
          />
        )}
      </AnimatePresence>
    </main>
  );
}
