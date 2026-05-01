'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { resaleService } from '@/lib/firebase/resaleService';
import { ResaleItem, UserReputation } from '@/types/resale';
import { motion } from 'framer-motion';
import { safeDate } from '@/lib/utils/safeData';

interface ResaleItemDetailProps {
  item: ResaleItem;
  onClose: () => void;
}

export default function ResaleItemDetail({ item, onClose }: ResaleItemDetailProps) {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sellerReputation, setSellerReputation] = useState<UserReputation | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const isOwner = user?.uid === item.sellerId;

  useEffect(() => {
    // Fetch seller reputation
    const fetchReputation = async () => {
      try {
        const rep = await resaleService.getUserReputation(item.sellerId);
        setSellerReputation(rep);
      } catch (error) {
        console.error("Failed to fetch seller reputation", error);
      }
    };
    fetchReputation();
  }, [item.sellerId]);

  useEffect(() => {
    const handleScroll = () => {
      if (scrollRef.current) {
        setIsScrolled(scrollRef.current.scrollTop > 50);
      }
    };
    const scrollEl = scrollRef.current;
    if (scrollEl) {
      scrollEl.addEventListener('scroll', handleScroll);
    }
    return () => {
      if (scrollEl) {
        scrollEl.removeEventListener('scroll', handleScroll);
      }
    };
  }, []);

  const handleStatusChange = async (newStatus: 'active' | 'reserved' | 'sold') => {
    if (!isOwner) return;
    setIsSubmitting(true);
    try {
      await resaleService.updateItemStatus(item.id, newStatus);
      onClose();
    } catch (error) {
      console.error("Failed to update status:", error);
      alert("Failed to update status.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRelativeTime = (timestamp: any) => {
    if (!timestamp) return 'Just now';
    const date = safeDate(timestamp);
    if (!date) return 'Just now';
    
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  const conditionLabels: Record<string, string> = {
    'S': 'New',
    'A': 'Like New',
    'B': 'Good',
    'C': 'Well-used'
  };

  const tradeMethodLabels: Record<string, string> = {
    'direct': 'Direct Meeting',
    'delivery': 'Global Delivery',
    'both': 'Both Available'
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 50 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed inset-0 z-[100] bg-white flex flex-col max-w-md mx-auto h-[100dvh] overflow-hidden"
    >
      <style dangerouslySetInnerHTML={{ __html: `
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .material-symbols-rounded { font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24; }
      `}} />

      {/* Header - Glassmorphic / Scroll-responsive */}
      <div className={`absolute top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-white/90 backdrop-blur-md shadow-sm border-b border-surface-container' : 'bg-gradient-to-b from-black/50 to-transparent'}`}>
        <div className="flex justify-between items-center px-4 py-4 max-w-md mx-auto">
          <button 
            onClick={onClose} 
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isScrolled ? 'bg-surface-container text-[#2d3435]' : 'bg-black/20 text-white backdrop-blur-md hover:bg-black/40'}`}
          >
            <span className="material-symbols-rounded text-xl leading-none">arrow_back</span>
          </button>
          
          <div className="flex gap-2">
            {item.status !== 'active' && (
              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center ${isScrolled ? 'bg-primary/10 text-primary' : 'bg-primary text-white'}`}>
                {item.status}
              </span>
            )}
            <button 
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isScrolled ? 'bg-surface-container text-[#2d3435]' : 'bg-black/20 text-white backdrop-blur-md hover:bg-black/40'}`}
            >
              <span className="material-symbols-rounded text-xl leading-none">share</span>
            </button>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto no-scrollbar scroll-smooth bg-white pb-28">
        {/* Hero Image */}
        <div className="w-full aspect-square relative bg-surface-container">
          {item.imageUrl ? (
            <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-surface-container text-[#596061]/50">
              <span className="material-symbols-rounded text-6xl">image</span>
            </div>
          )}
        </div>

        <div className="p-5 space-y-6">
          {/* Seller Info Profile */}
          <div className="flex items-center justify-between pb-6 border-b border-surface-container-highest">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <span className="material-symbols-rounded text-2xl">person</span>
              </div>
              <div>
                <h4 className="font-headline font-bold text-base text-[#2d3435]">{item.sellerName}</h4>
                <div className="text-[11px] font-medium text-[#596061] uppercase tracking-wider">{item.location}</div>
              </div>
            </div>
            
            <div className="flex flex-col items-end">
              <div className="flex items-center gap-1">
                <span className="text-[10px] font-black text-[#596061] uppercase tracking-widest">Manner Temp</span>
                <span className="material-symbols-rounded text-[14px] text-red-500">thermostat</span>
              </div>
              <div className="font-headline font-black text-xl text-primary">
                {sellerReputation ? `${sellerReputation.hobbyScore.toFixed(1)}°C` : '...'}
              </div>
            </div>
          </div>

          {/* Item Details */}
          <div className="space-y-4">
            <div>
              <span className="inline-block px-2 py-1 bg-surface-container rounded text-[10px] font-bold text-[#596061] mb-2 uppercase tracking-wider">{item.category}</span>
              <h2 className="text-2xl font-black text-[#2d3435] tracking-tighter leading-tight mb-2">
                {item.title}
              </h2>
              <div className="flex items-center gap-2 text-[11px] font-bold text-[#596061] uppercase tracking-wider">
                <span>{getRelativeTime(item.createdAt)}</span>
                <span className="w-1 h-1 rounded-full bg-[#acb3b4]"></span>
                <span className="flex items-center gap-1"><span className="material-symbols-rounded text-[14px]">chat_bubble</span> {item.chatsCount}</span>
                <span className="flex items-center gap-1"><span className="material-symbols-rounded text-[14px]">favorite</span> {item.likesCount}</span>
              </div>
            </div>

            {/* Badges / Specs */}
            <div className="grid grid-cols-2 gap-3 py-4">
              <div className="bg-[#f2f4f4] rounded-2xl p-4 flex flex-col gap-1">
                <span className="text-[10px] font-black text-[#596061] uppercase tracking-widest">Condition</span>
                <span className="font-bold text-sm text-[#2d3435]">{conditionLabels[item.condition] || item.condition}</span>
              </div>
              <div className="bg-[#f2f4f4] rounded-2xl p-4 flex flex-col gap-1">
                <span className="text-[10px] font-black text-[#596061] uppercase tracking-widest">Trade Method</span>
                <span className="font-bold text-sm text-[#2d3435]">{tradeMethodLabels[item.tradeMethod] || item.tradeMethod}</span>
              </div>
            </div>

            <div className="pt-2">
              <p className="text-sm font-medium text-[#596061] leading-relaxed whitespace-pre-wrap">
                {item.description}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Fixed Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-surface-container-highest px-4 py-3 pb-8 max-w-md mx-auto">
        <div className="flex items-center gap-4">
          <div className="flex flex-col justify-center flex-shrink-0">
            <span className="text-[10px] font-bold text-[#596061] uppercase tracking-widest mb-0.5">Price</span>
            <div className="text-xl font-black text-primary flex items-end gap-2">
              ₩{item.price.toLocaleString()}
              {!item.canNegotiate && <span className="text-[10px] text-[#acb3b4] uppercase tracking-widest font-bold mb-1 border border-[#acb3b4] rounded px-1">Fixed</span>}
            </div>
          </div>
          
          <div className="h-10 w-[1px] bg-surface-container-highest mx-1"></div>

          <div className="flex-1">
            {isOwner ? (
              <div className="flex gap-2">
                {item.status !== 'sold' && (
                  <button
                    onClick={() => handleStatusChange(item.status === 'reserved' ? 'active' : 'reserved')}
                    disabled={isSubmitting}
                    className="flex-1 h-12 rounded-xl font-bold text-sm bg-surface-container text-[#2d3435] hover:bg-surface-container-high transition-all"
                  >
                    {item.status === 'reserved' ? 'Cancel' : 'Reserve'}
                  </button>
                )}
                {item.status !== 'sold' && (
                  <button
                    onClick={() => handleStatusChange('sold')}
                    disabled={isSubmitting}
                    className="flex-1 h-12 rounded-xl font-bold text-sm bg-primary text-white hover:bg-primary/90 transition-all shadow-md shadow-primary/20"
                  >
                    Mark Sold
                  </button>
                )}
                {item.status === 'sold' && (
                  <button
                    disabled
                    className="w-full h-12 rounded-xl font-bold text-sm bg-surface-container text-[#596061] transition-all cursor-not-allowed"
                  >
                    Sold Out
                  </button>
                )}
              </div>
            ) : (
              <button
                onClick={() => alert("Chat functionality coming soon!")}
                disabled={item.status === 'sold'}
                className={`w-full h-12 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                  item.status === 'sold' 
                    ? 'bg-surface-container text-[#596061] cursor-not-allowed'
                    : 'bg-primary text-white shadow-md shadow-primary/20 hover:bg-primary/90'
                }`}
              >
                <span className="material-symbols-rounded text-[18px]">chat_bubble</span>
                {item.status === 'sold' ? 'Sold Out' : 'Chat with Seller'}
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
