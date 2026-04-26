'use client';

import React, { useState } from 'react';
import { LostItem } from '@/types/lost';
import { lostService } from '@/lib/firebase/lostService';
import { useAuth } from '@/components/providers/AuthProvider';

interface LostItemDetailProps {
  item: LostItem;
  onClose: () => void;
}

export default function LostItemDetail({ item, onClose }: LostItemDetailProps) {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isReporter = user?.uid === item.reportedById;

  const handleClaim = async () => {
    setIsSubmitting(true);
    try {
      await lostService.markAsReturned(item.id);
      onClose();
    } catch (error) {
      console.error("Error claiming item:", error);
      alert("Failed to update status. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white w-full max-w-md rounded-t-[32px] sm:rounded-[32px] shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300 flex flex-col max-h-[95vh]">
        {/* Header */}
        <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-10 font-manrope">
          <div className="flex flex-col text-left">
            <span className="text-[10px] font-black text-primary tracking-[0.25em] uppercase mb-1">Guardian Network</span>
            <h3 className="text-[20px] font-black text-gray-900 uppercase tracking-tighter">Case Details</h3>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-50 hover:bg-gray-100 transition-all text-gray-400">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar scroll-smooth">
          {/* Photo */}
          <div className="w-full aspect-square bg-gray-50 relative">
            {item.imageUrl ? (
              <img src={item.imageUrl} className="w-full h-full object-cover" alt={item.title} />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-300">
                <span className="material-symbols-outlined text-6xl">image_not_supported</span>
              </div>
            )}
            <div className={`absolute top-4 left-4 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl flex items-center gap-1 ${
               item.category === 'Lost' ? 'bg-[#9f403d] text-white' : 'bg-[#1A73E8] text-white'
            }`}>
               <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
               {item.category}
            </div>
            {item.status === 'returned' && (
              <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center">
                <span className="bg-green-500 text-white px-6 py-3 rounded-full text-sm font-black uppercase tracking-widest shadow-2xl">Case Closed</span>
              </div>
            )}
          </div>

          <div className="p-8 space-y-8">
            {/* Core Info */}
            <div className="space-y-4">
              <h2 className="text-3xl font-black tracking-tighter text-gray-900 uppercase leading-none">{item.title}</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-2xl p-4 flex flex-col gap-1">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Type</span>
                  <span className="text-sm font-bold text-gray-900">{item.itemType}</span>
                </div>
                <div className="bg-gray-50 rounded-2xl p-4 flex flex-col gap-1">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Location</span>
                  <span className="text-sm font-bold text-gray-900 truncate">{item.location}</span>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Detailed Story</span>
              <p className="text-sm text-gray-600 leading-relaxed font-medium bg-gray-50 rounded-2xl p-5">
                {item.description || "No detailed description provided."}
              </p>
            </div>
            
            {/* Reporter Info */}
            <div className="flex items-center gap-2 border-t border-gray-100 pt-6">
              <span className="material-symbols-outlined text-gray-300">account_circle</span>
              <span className="text-xs font-bold text-gray-500">Reported by {item.reportedByName}</span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        {item.status !== 'returned' && (
          <div className="p-6 border-t border-gray-50 bg-white">
            <button
              onClick={handleClaim}
              disabled={isSubmitting}
              className={`w-full h-14 rounded-full font-black text-[15px] transition-all flex items-center justify-center gap-2 uppercase tracking-widest shadow-xl ${
                isSubmitting
                  ? 'bg-gray-100 text-gray-300'
                  : 'bg-primary text-white shadow-primary/30 hover:scale-[1.02] active:scale-[0.98]'
              }`}
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <span>
                  {isReporter 
                    ? 'Close Case' 
                    : item.category === 'Lost' ? 'I Found This!' : 'This is Mine!'}
                </span>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
