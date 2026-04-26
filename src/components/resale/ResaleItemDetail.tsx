'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { resaleService } from '@/lib/firebase/resaleService';
import { ResaleItem, UserReputation } from '@/types/resale';

interface ResaleItemDetailProps {
  item: ResaleItem;
  onClose: () => void;
}

export default function ResaleItemDetail({ item, onClose }: ResaleItemDetailProps) {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sellerReputation, setSellerReputation] = useState<UserReputation | null>(null);

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

  const handleStatusChange = async (newStatus: 'active' | 'reserved' | 'sold') => {
    if (!isOwner) return;
    setIsSubmitting(true);
    try {
      await resaleService.updateItemStatus(item.id, newStatus);
      onClose(); // Close modal after action, or you can keep it open depending on preference
    } catch (error) {
      console.error("Failed to update status:", error);
      alert("Failed to update status.");
    } finally {
      setIsSubmitting(false);
    }
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
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white w-full max-w-xl rounded-t-[32px] sm:rounded-[32px] shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300 flex flex-col max-h-[95vh]">
        
        {/* Header - Transparent overlay on image */}
        <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-20 bg-gradient-to-b from-black/50 to-transparent">
          <div className="flex gap-2">
            <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-white text-[10px] font-black uppercase tracking-widest">
              {item.category}
            </span>
            {item.status !== 'active' && (
              <span className="px-3 py-1 bg-primary text-white rounded-full text-[10px] font-black uppercase tracking-widest">
                {item.status}
              </span>
            )}
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full flex items-center justify-center bg-black/20 backdrop-blur-md hover:bg-black/40 transition-all text-white">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto no-scrollbar scroll-smooth">
          {/* Hero Image */}
          <div className="w-full h-80 relative bg-surface-container">
            <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
          </div>

          <div className="p-6 sm:p-8 space-y-8">
            {/* Seller Info Profile */}
            <div className="flex items-center justify-between pb-6 border-b border-surface-container-highest">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-2xl">person</span>
                </div>
                <div>
                  <h4 className="font-headline font-bold text-base text-[#2d3435]">{item.sellerName}</h4>
                  <div className="text-[11px] font-medium text-[#596061] uppercase tracking-wider">{item.location}</div>
                </div>
              </div>
              
              <div className="flex flex-col items-end">
                <div className="flex items-center gap-1">
                  <span className="text-[10px] font-black text-[#596061] uppercase tracking-widest">Manner Temp</span>
                  <span className="material-symbols-outlined text-[14px] text-red-500">thermostat</span>
                </div>
                <div className="font-headline font-black text-xl text-primary">
                  {sellerReputation ? `${sellerReputation.hobbyScore.toFixed(1)}°C` : '...'}
                </div>
              </div>
            </div>

            {/* Item Details */}
            <div className="space-y-4">
              <div>
                <h2 className="text-2xl font-black text-gray-900 tracking-tighter leading-tight mb-2">
                  {item.title}
                </h2>
                <div className="flex items-center gap-2 text-[11px] font-bold text-[#596061] uppercase tracking-wider">
                  <span>{getRelativeTime(item.createdAt)}</span>
                  <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                  <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">chat_bubble</span> {item.chatsCount}</span>
                  <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">favorite</span> {item.likesCount}</span>
                </div>
              </div>

              <div className="text-3xl font-black text-primary">
                ₩{item.price.toLocaleString()}
                {!item.canNegotiate && <span className="text-sm text-gray-400 ml-2 uppercase tracking-widest font-bold">Fixed</span>}
              </div>

              {/* Badges / Specs */}
              <div className="grid grid-cols-2 gap-3 py-4">
                <div className="bg-[#f2f4f4] rounded-2xl p-4 flex flex-col gap-1">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Condition</span>
                  <span className="font-bold text-sm text-gray-900">{conditionLabels[item.condition] || item.condition} (Grade {item.condition})</span>
                </div>
                <div className="bg-[#f2f4f4] rounded-2xl p-4 flex flex-col gap-1">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Trade Method</span>
                  <span className="font-bold text-sm text-gray-900">{tradeMethodLabels[item.tradeMethod] || item.tradeMethod}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-surface-container-highest">
                <p className="text-sm font-medium text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {item.description}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Footer */}
        <div className="p-6 border-t border-surface-container-highest bg-white flex gap-3">
          {isOwner ? (
            <>
              {item.status !== 'sold' && (
                <button
                  onClick={() => handleStatusChange(item.status === 'reserved' ? 'active' : 'reserved')}
                  disabled={isSubmitting}
                  className="flex-1 h-14 rounded-full font-black text-[13px] bg-gray-100 text-gray-900 hover:bg-gray-200 transition-all uppercase tracking-widest"
                >
                  {item.status === 'reserved' ? 'Cancel Reservation' : 'Mark as Reserved'}
                </button>
              )}
              {item.status !== 'sold' && (
                <button
                  onClick={() => handleStatusChange('sold')}
                  disabled={isSubmitting}
                  className="flex-1 h-14 rounded-full font-black text-[13px] bg-primary text-white hover:scale-[1.02] active:scale-[0.98] transition-all uppercase tracking-widest shadow-xl shadow-primary/30"
                >
                  Mark as Sold
                </button>
              )}
              {item.status === 'sold' && (
                <button
                  disabled
                  className="w-full h-14 rounded-full font-black text-[13px] bg-gray-100 text-gray-400 transition-all uppercase tracking-widest cursor-not-allowed"
                >
                  Item is Sold
                </button>
              )}
            </>
          ) : (
            <button
              onClick={() => alert("Chat functionality coming soon!")}
              disabled={item.status === 'sold'}
              className={`w-full h-14 rounded-full font-black text-[15px] flex items-center justify-center gap-2 uppercase tracking-widest transition-all ${
                item.status === 'sold' 
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-primary text-white shadow-xl shadow-primary/30 hover:scale-[1.02] active:scale-[0.98]'
              }`}
            >
              <span className="material-symbols-outlined">chat_bubble</span>
              {item.status === 'sold' ? 'Sold Out' : 'Chat with Seller'}
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
