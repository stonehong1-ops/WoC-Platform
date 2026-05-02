'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { resaleService } from '@/lib/firebase/resaleService';
import { chatService } from '@/lib/firebase/chatService';
import { ResaleItem } from '@/types/resale';
import ImageWithFallback from '@/components/common/ImageWithFallback';

type Step = 'summary' | 'complete';

interface ResalePurchaseFlowProps {
  item: ResaleItem;
  onClose: () => void;
  onComplete: () => void;
}

const fmt = (n: number) => n.toLocaleString();

export default function ResalePurchaseFlow({ item, onClose, onComplete }: ResalePurchaseFlowProps) {
  const { user, profile } = useAuth();
  const [step, setStep] = useState<Step>('summary');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [buyerPhone, setBuyerPhone] = useState('');

  useEffect(() => {
    if (profile?.phoneNumber) {
      setBuyerPhone(profile.phoneNumber);
    }
  }, [profile]);

  const handleConfirmOrder = async () => {
    if (!user || isSubmitting) return;
    if (!buyerPhone.trim()) {
      alert("Please enter a contact number so the seller can reach you.");
      return;
    }

    setIsSubmitting(true);
    try {
      // Update wishlist status to in_progress
      await resaleService.setProductInProgressStatus(user.uid, item.id);

      // Automated Chat Notification to Seller
      try {
        const sellerId = item.sellerId;
        if (sellerId && sellerId !== user.uid) {
          const roomId = await chatService.getOrCreatePrivateRoom([user.uid, sellerId], user.uid, 'business');
          
          const orderMsg = `📦 [PURCHASE REQUEST]\n` +
            `Product: ${item.title}\n` +
            `Price: ₩${fmt(item.price)}\n` +
            `Contact: ${buyerPhone}\n` +
            `I would like to purchase this item!`;

          await chatService.sendMessage({
            roomId,
            senderId: user.uid,
            senderName: user.displayName || 'User',
            text: orderMsg,
            type: 'text'
          });
        }
      } catch (chatErr) {
        console.error('Failed to send order chat notification:', chatErr);
      }

      setStep('complete');
    } catch (err) {
      console.error('Purchase request failed:', err);
      alert('Failed to request purchase. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (step === 'summary') {
    return (
      <div className="fixed inset-0 z-[200] flex items-end justify-center" onClick={onClose}>
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
        <div className="relative w-full max-w-md bg-white rounded-t-3xl animate-in slide-in-from-bottom duration-300 max-h-[85vh] overflow-y-auto"
          onClick={e => e.stopPropagation()}>
          
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 rounded-full bg-[#e0e4e5]" />
          </div>

          {/* Header */}
          <div className="px-5 pt-2 pb-4 flex items-center justify-between">
            <h2 className="text-lg font-black text-[#2d3435]">Order Summary</h2>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-[#f2f4f4] flex items-center justify-center">
              <span className="material-symbols-outlined text-sm text-[#596061]">close</span>
            </button>
          </div>

          {/* Product */}
          <div className="px-5 pb-4">
            <div className="flex gap-3 p-3 bg-[#f8f9fa] rounded-2xl border border-[#e0e4e5]">
              <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-slate-100">
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-slate-100 text-[#acb3b4]">
                    <span className="material-symbols-outlined text-xl">image</span>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold text-[#acb3b4] uppercase">{item.category}</p>
                <p className="text-sm font-bold text-[#2d3435] truncate">{item.title}</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  <span className="text-[10px] bg-[#e8eaec] text-[#596061] px-2 py-0.5 rounded-full font-bold">Condition: {item.condition}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div className="px-5 pb-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[#596061]">Contact Number</label>
              <div className="w-full bg-[#f8f9fa] border border-[#e0e4e5] rounded-xl px-4 py-3 text-sm text-[#2d3435]">
                {buyerPhone || 'No contact number available'}
              </div>
              <p className="text-[10px] text-[#acb3b4]">Seller will contact you at this number regarding your purchase.</p>
            </div>
          </div>

          {/* Confirm Button */}
          <div className="px-5 pb-6 pt-2">
            <button
              onClick={handleConfirmOrder}
              disabled={isSubmitting}
              className="w-full bg-[#0057bd] text-white py-4 rounded-2xl font-black text-sm tracking-wide shadow-lg shadow-[#0057bd]/20 active:scale-[0.98] transition-transform disabled:opacity-50"
            >
              {isSubmitting ? 'Processing...' : `Confirm · ₩${fmt(item.price)}`}
            </button>
            <p className="text-[10px] text-[#acb3b4] text-center mt-2">
              By confirming, you are sending a purchase request to the seller.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ━━━ STEP 2: ORDER COMPLETE ━━━
  return (
    <div className="fixed inset-0 z-[200] bg-white flex flex-col items-center justify-center animate-in fade-in duration-500 px-6">
      {/* Success Icon */}
      <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mb-6 animate-in zoom-in duration-500">
        <span className="material-symbols-outlined text-4xl text-emerald-600" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
      </div>

      <h2 className="text-xl font-black text-[#2d3435] mb-2">Purchase Requested!</h2>
      <p className="text-sm text-[#596061] text-center leading-relaxed mb-8">
        Your purchase request has been sent to the seller.
        <br />The seller will contact you shortly.
      </p>

      {/* Actions */}
      <div className="w-full max-w-sm">
        <button
          onClick={onComplete}
          className="w-full bg-[#0057bd] text-white py-4 rounded-2xl font-black text-sm tracking-wide shadow-lg shadow-[#0057bd]/20 active:scale-[0.98] transition-transform"
        >
          Go to Resale
        </button>
      </div>
    </div>
  );
}
