'use client';

import React, { useState, useRef } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { resaleService } from '@/lib/firebase/resaleService';
import { plazaService } from '@/lib/firebase/plazaService';
import { ItemCondition, TradeMethod } from '@/types/resale';

interface CreateResaleItemProps {
  onClose: () => void;
  onSuccess?: () => void;
}

export default function CreateResaleItem({ onClose, onSuccess }: CreateResaleItemProps) {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [location, setLocation] = useState('Seoul, Korea');
  const [category, setCategory] = useState('Others');
  const [condition, setCondition] = useState<ItemCondition>('A');
  const [tradeMethod, setTradeMethod] = useState<TradeMethod>('both');
  const [canNegotiate, setCanNegotiate] = useState(false);
  const [description, setDescription] = useState('');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const categories = ['Shoes', 'Apparel', 'Accessories', 'Equipment', 'Others'];
  const conditions: { val: ItemCondition; label: string }[] = [
    { val: 'S', label: 'New' },
    { val: 'A', label: 'Like New' },
    { val: 'B', label: 'Good' },
    { val: 'C', label: 'Well-used' }
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMediaFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !title || !price || !mediaFile) return;

    setIsSubmitting(true);
    setUploadProgress(0);
    
    try {
      const imageUrl = await plazaService.uploadMedia(mediaFile, (p) => setUploadProgress(Math.round(p)));

      await resaleService.registerItem({
        title,
        description,
        price: parseInt(price),
        location,
        category,
        imageUrl,
        sellerId: user.uid,
        sellerName: user.displayName || 'Anonymous',
        condition,
        tradeMethod,
        canNegotiate,
      });

      onSuccess?.();
      onClose();
    } catch (error) {
      console.error("Error creating resale item:", error);
      alert("Failed to post item. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white w-full max-w-xl rounded-t-[32px] sm:rounded-[32px] shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300 flex flex-col max-h-[95vh]">
        {/* Header */}
        <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-10 font-manrope">
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-primary tracking-[0.25em] uppercase mb-1">Pre-owned</span>
            <h3 className="text-[20px] font-black text-gray-900 uppercase tracking-tighter">Post an Echo</h3>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-50 hover:bg-gray-100 transition-all text-gray-400">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar scroll-smooth">
          {/* Photo Upload Area */}
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="relative h-64 w-full rounded-3xl bg-gray-50 border-2 border-dashed border-gray-100 flex flex-col items-center justify-center cursor-pointer overflow-hidden group hover:border-primary/20 transition-all"
          >
            {previewUrl ? (
              <img src={previewUrl} className="w-full h-full object-cover" alt="preview" />
            ) : (
              <>
                <div className="w-16 h-16 rounded-full bg-white shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-gray-300 text-[32px]">camera</span>
                </div>
                <span className="text-[11px] font-black text-gray-300 uppercase tracking-widest">Add Item Photo</span>
              </>
            )}
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
          </div>

          {/* Core Info */}
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">What are you sharing?</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex. Vintage Hand-painted Fan"
                className="w-full text-[24px] font-black tracking-tighter border-none focus:ring-0 placeholder:text-gray-200 p-0"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Category</label>
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                {categories.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCategory(c)}
                    className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                      category === c 
                        ? 'bg-primary text-white shadow-md' 
                        : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Price (₩)</label>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0"
                  className="w-full bg-gray-50 border-none rounded-2xl px-4 py-3.5 text-sm font-bold focus:ring-2 focus:ring-primary/10"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Location</label>
                <div className="w-full bg-gray-50 border-none rounded-2xl px-4 py-3.5 text-sm font-bold flex items-center gap-2">
                   <span className="material-symbols-outlined text-[18px] text-primary">location_on</span>
                   <span className="truncate">{location}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Condition Selector */}
          <div className="space-y-4">
             <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Condition</label>
             <div className="grid grid-cols-4 gap-2">
                {conditions.map(c => (
                  <button
                    key={c.val}
                    type="button"
                    onClick={() => setCondition(c.val)}
                    className={`py-3 rounded-2xl text-[12px] font-black transition-all ${
                      condition === c.val ? 'bg-primary text-white scale-105' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
                    }`}
                  >
                    <div className="text-lg leading-tight uppercase">{c.val}</div>
                    <div className="text-[8px] opacity-70 uppercase tracking-tighter">{c.label}</div>
                  </button>
                ))}
             </div>
          </div>

          {/* Trade Options */}
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Trade Method</label>
              <select 
                value={tradeMethod}
                onChange={(e) => setTradeMethod(e.target.value as TradeMethod)}
                className="w-full bg-gray-50 border-none rounded-2xl px-4 py-3.5 text-sm font-bold focus:ring-2 focus:ring-primary/10"
              >
                <option value="direct">Direct Meeting</option>
                <option value="delivery">Global Delivery</option>
                <option value="both">Both Available</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Price Offer</label>
              <button 
                type="button"
                onClick={() => setCanNegotiate(!canNegotiate)}
                className={`w-full py-3.5 rounded-2xl text-xs font-bold transition-all border-2 ${
                  canNegotiate ? 'border-primary text-primary bg-primary/5' : 'border-gray-100 text-gray-400 bg-gray-50'
                }`}
              >
                {canNegotiate ? 'Negotiation OK' : 'Fixed Price'}
              </button>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2 pb-4">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Story of the Item</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell us about the history of this item and its current condition..."
              className="w-full min-h-[120px] bg-gray-50 border-none rounded-[28px] px-5 py-4 text-sm font-medium focus:ring-2 focus:ring-primary/10 resize-none"
            />
          </div>
        </form>

        {/* Action Button */}
        <div className="p-6 border-t border-gray-50 bg-white">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !title || !price || !mediaFile}
            className={`w-full h-14 rounded-full font-black text-[15px] transition-all flex items-center justify-center gap-2 uppercase tracking-widest shadow-xl ${
              (isSubmitting || !title || !price || !mediaFile)
                ? 'bg-gray-100 text-gray-300'
                : 'bg-primary text-white shadow-primary/30 hover:scale-[1.02] active:scale-[0.98]'
            }`}
          >
            {isSubmitting ? (
              <>
                <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Posting {uploadProgress}%</span>
              </>
            ) : (
              <span>Share My Item</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
