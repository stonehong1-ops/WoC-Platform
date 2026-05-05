'use client';

import React, { useState, useRef } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { shopService } from '@/lib/firebase/shopService';
import { plazaService } from '@/lib/firebase/plazaService';
import UniversalCompose from '@/components/common/UniversalCompose';

interface CreateProductProps {
  onClose?: () => void;
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

  const handleSubmit = async () => {
    if (!user || !name || !price || !mediaFile) {
      alert("Please fill in all required fields and add a photo.");
      return;
    }

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
      onClose?.();
      
      // Reset form
      setName('');
      setBrand('');
      setPrice('');
      setMediaFile(null);
      setPreviewUrl('');
      setDescription('');
    } catch (error) {
      console.error("Error creating product:", error);
      alert("Failed to register product. Please check your connection.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <UniversalCompose
      id="shop"
      title="Host a Product"
      label="Marketplace"
      submitLabel={isSubmitting ? `Hosting ${uploadProgress}%` : "Register Product"}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      onClose={onClose}
    >
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
    </UniversalCompose>
  );
}
