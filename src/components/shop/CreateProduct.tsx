'use client';

import React, { useState, useRef } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { shopService } from '@/lib/firebase/shopService';
import { plazaService } from '@/lib/firebase/plazaService'; // Using existing upload logic
import { motion, AnimatePresence } from 'framer-motion';

interface CreateProductProps {
  onClose: () => void;
  onSuccess?: () => void;
}

export default function CreateProduct({ onClose, onSuccess }: CreateProductProps) {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('Shoes');
  const [description, setDescription] = useState('');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const categories = ['Shoes', 'Dresses', 'Accessories', 'Bikes', 'Yoga Wear', 'Equipments'];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMediaFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !name || !price || !mediaFile) return;

    setIsSubmitting(true);
    setUploadProgress(0);
    
    try {
      // 1. Upload Image
      const imageUrl = await plazaService.uploadMedia(mediaFile, (p) => setUploadProgress(Math.round(p)));

      // 2. Register Product
      await shopService.addProduct({
        title: name,
        brand,
        price: parseFloat(price),
        category,
        description,
        images: [imageUrl],
        groupId: '',
        groupName: '',
        currency: 'KRW',
        options: [],
        stock: 1,
        status: 'Active',
        deliveryType: 'shipping',
        sellerId: user.uid,
        sellerName: user.displayName || 'Anonymous',
      } as any);

      onSuccess?.();
      onClose();
    } catch (error) {
      console.error("Error creating product:", error);
      alert("Failed to register product. Please check your connection.");
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
            <span className="text-[10px] font-black text-primary tracking-[0.25em] uppercase mb-1">Marketplace</span>
            <h3 className="text-[20px] font-black text-gray-900 uppercase tracking-tighter">Sell Product</h3>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-50 hover:bg-gray-100 transition-all text-gray-400">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar scroll-smooth">
          {/* Image Upload Area */}
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="relative aspect-square w-full rounded-[32px] bg-gray-50 border-2 border-dashed border-gray-100 flex flex-col items-center justify-center cursor-pointer overflow-hidden group hover:border-primary/20 transition-all"
          >
            {previewUrl ? (
              <img src={previewUrl} className="w-full h-full object-cover" alt="preview" />
            ) : (
              <>
                <div className="w-16 h-16 rounded-full bg-white shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-gray-300 text-[32px]">add_a_photo</span>
                </div>
                <span className="text-[11px] font-black text-gray-300 uppercase tracking-widest">Upload Product Photo</span>
              </>
            )}
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
          </div>

          {/* Product Basic Info */}
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Brand Name</label>
              <input
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="Ex. Tango Elite"
                className="w-full text-[16px] font-bold border-none focus:ring-0 placeholder:text-gray-200 p-0"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Product Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex. Performance Leather Shoes"
                className="w-full text-[24px] font-black tracking-tighter border-none focus:ring-0 placeholder:text-gray-200 p-0"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8">
             {/* Category */}
             <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Category</label>
                <select 
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-gray-50 border-none rounded-2xl px-4 py-3.5 text-sm font-bold focus:ring-2 focus:ring-primary/10"
                >
                  {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
             </div>
             {/* Price */}
             <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Price ($)</label>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-gray-50 border-none rounded-2xl px-4 py-3.5 text-sm font-bold focus:ring-2 focus:ring-primary/10"
                  required
                />
             </div>
          </div>

          {/* Description */}
          <div className="space-y-2 pb-4">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Product Story</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell us about the condition, materials, and why you're selling..."
              className="w-full min-h-[120px] bg-gray-50 border-none rounded-[28px] px-5 py-4 text-sm font-medium focus:ring-2 focus:ring-primary/10 resize-none"
            />
          </div>
        </form>

        {/* Action Button */}
        <div className="p-6 border-t border-gray-50 bg-white">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !name || !price || !mediaFile}
            className={`w-full h-15 rounded-full font-black text-[15px] transition-all flex items-center justify-center gap-2 uppercase tracking-widest shadow-xl h-14 ${
              (isSubmitting || !name || !price || !mediaFile)
                ? 'bg-gray-100 text-gray-300'
                : 'bg-primary text-white shadow-primary/30 hover:scale-[1.02] active:scale-[0.98]'
            }`}
          >
            {isSubmitting ? (
              <>
                <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Hosting Item {uploadProgress}%</span>
              </>
            ) : (
              <span>Register Product</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
