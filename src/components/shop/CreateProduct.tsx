'use client';

import React, { useState, useRef } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { shopService } from '@/lib/firebase/shopService';
import { plazaService } from '@/lib/firebase/plazaService';
import FullScreenRegistration from '@/components/common/FullScreenRegistration';
import { useLanguage } from '@/contexts/LanguageContext';
import { CITY_COORDINATES } from '@/lib/constants/locations';

interface CreateProductProps {
  onClose?: () => void;
  onSuccess?: () => void;
}

const CURRENCIES = ['KRW', 'USD', 'EUR', 'JPY', 'CNY'];
const MAX_PHOTOS = 20;

export default function CreateProduct({ onClose, onSuccess }: CreateProductProps) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [price, setPrice] = useState('');
  const [currency, setCurrency] = useState('KRW');
  const [category, setCategory] = useState('Shoes');
  const [description, setDescription] = useState('');
  
  const [region, setRegion] = useState('SEOUL');
  const [locationDetail, setLocationDetail] = useState('');

  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const categories = ['Shoes', 'Dresses', 'Accessories', 'Bikes', 'Yoga Wear', 'Equipments'];
  const regions = Object.keys(CITY_COORDINATES);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const availableSlots = MAX_PHOTOS - mediaFiles.length;
    const filesToAdd = files.slice(0, availableSlots);

    if (files.length > availableSlots) {
      alert(t('shop.msg_max_photos') || `You can only upload up to ${MAX_PHOTOS} photos.`);
    }

    setMediaFiles(prev => [...prev, ...filesToAdd]);
    
    const newPreviewUrls = filesToAdd.map(f => URL.createObjectURL(f));
    setPreviewUrls(prev => [...prev, ...newPreviewUrls]);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removePhoto = (index: number) => {
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => {
      const urls = [...prev];
      URL.revokeObjectURL(urls[index]);
      urls.splice(index, 1);
      return urls;
    });
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9]/g, '');
    setPrice(val);
  };

  const formatPrice = (val: string) => {
    if (!val) return '';
    return parseInt(val, 10).toLocaleString();
  };

  const handleSubmit = async () => {
    if (!user || !name || !price || mediaFiles.length === 0 || !region) {
      alert(t('shop.msg_fill_required') || "Please fill in all required fields and add at least one photo.");
      return;
    }

    setIsSubmitting(true);
    setUploadProgress(0);
    
    try {
      let uploadedUrls: string[] = [];
      const totalFiles = mediaFiles.length;
      
      uploadedUrls = await Promise.all(
        mediaFiles.map(async (file, index) => {
          const url = await plazaService.uploadMedia(file, (p) => {
            setUploadProgress(Math.round(((index * 100) + p) / totalFiles));
          });
          return url;
        })
      );

      // Register Product
      await shopService.addProduct({
        title: name,
        brand,
        price: parseInt(price, 10),
        category,
        description,
        images: uploadedUrls,
        groupId: '',
        groupName: '',
        currency,
        location: region,
        locationDetail,
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
      setMediaFiles([]);
      setPreviewUrls([]);
      setDescription('');
    } catch (error) {
      console.error("Error creating product:", error);
      alert(t('shop.msg_fail_register', "Failed to register product. Please check your connection."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const isValid = !!(name && price && mediaFiles.length > 0 && region);

  return (
    <FullScreenRegistration
      id="shop"
      title={t('shop.host_product', "Host a Product")}
      submitLabel={t('common.save') || 'SAVE'}
      submittingLabel={`${t('shop.hosting', 'Hosting')} ${uploadProgress}%`}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      isValid={isValid}
      onClose={onClose}
    >
      <div className="space-y-10 pt-4">
        {/* Photo Upload Area */}
        <div className="space-y-3">
          <div className="flex items-center justify-between ml-1">
            <label className="text-[13px] font-black text-gray-400 uppercase tracking-widest">
              {t('shop.upload_photo', 'PHOTOS')} <span className="text-primary">*</span>
            </label>
            <span className="text-[13px] font-bold text-gray-400">{mediaFiles.length}/{MAX_PHOTOS}</span>
          </div>
          
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 items-center">
            {mediaFiles.length < MAX_PHOTOS && (
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="shrink-0 w-24 h-24 rounded-2xl bg-gray-50 border-2 border-dashed border-gray-200 flex flex-col items-center justify-center hover:border-primary/40 hover:bg-primary/5 transition-all"
              >
                <span className="material-symbols-outlined text-gray-400 mb-1">add_a_photo</span>
                <span className="text-[9px] font-black text-gray-400 uppercase">ADD</span>
              </button>
            )}
            
            {previewUrls.map((url, i) => (
              <div key={i} className="shrink-0 relative w-24 h-24 rounded-2xl overflow-hidden group">
                <img src={url} className="w-full h-full object-cover" alt={`Preview ${i}`} />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button 
                    type="button"
                    onClick={() => removePhoto(i)}
                    className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center backdrop-blur-md transition-all"
                  >
                    <span className="material-symbols-outlined text-white text-[18px]">delete</span>
                  </button>
                </div>
                {i === 0 && (
                  <div className="absolute top-2 left-2 bg-primary px-2 py-0.5 rounded text-[8px] font-black text-white uppercase tracking-widest shadow-sm">
                    Main
                  </div>
                )}
              </div>
            ))}
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" multiple onChange={handleFileChange} />
          </div>
        </div>

        {/* Product Basic Info */}
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[13px] font-black text-gray-400 uppercase tracking-widest ml-1">{t('shop.brand_name', 'Brand Name')}</label>
            <input
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              placeholder={t('shop.ex_brand', "Ex. Tango Elite")}
              className="w-full text-[16px] font-bold border-none focus:ring-0 placeholder:text-gray-200 p-0 bg-transparent"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[13px] font-black text-gray-400 uppercase tracking-widest ml-1">
              {t('shop.product_name', 'Product Name')} <span className="text-primary">*</span>
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('shop.ex_product_name', "Ex. Performance Leather Shoes")}
              className="w-full text-[24px] font-black tracking-tighter border-none focus:ring-0 placeholder:text-gray-200 p-0 bg-transparent"
              required
            />
          </div>
        </div>

        {/* Category */}
        <div className="space-y-3">
          <label className="text-[13px] font-black text-gray-400 uppercase tracking-widest ml-1">{t('shop.category', 'Category')}</label>
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
            {categories.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`px-5 py-2.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${
                  category === cat 
                    ? 'bg-gray-900 text-white border-gray-900 shadow-md' 
                    : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                }`}
              >
                {t(`shop.cat_${cat.toLowerCase().replace(/ /g, '_')}`, cat)}
              </button>
            ))}
          </div>
        </div>

        {/* Price & Currency */}
        <div className="space-y-4">
          <label className="text-[13px] font-black text-gray-400 uppercase tracking-widest ml-1">
            {t('shop.price', 'PRICE')} <span className="text-primary">*</span>
          </label>
          <div className="flex w-full items-center gap-3">
            <select 
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="bg-gray-50 border-none rounded-2xl px-4 py-4 text-sm font-black focus:ring-2 focus:ring-primary/10 w-[100px] shrink-0"
            >
              {CURRENCIES.map(curr => (
                <option key={curr} value={curr}>{curr}</option>
              ))}
            </select>
            <input
              type="text"
              value={formatPrice(price)}
              onChange={handlePriceChange}
              placeholder="0"
              className="flex-1 min-w-0 bg-gray-50 border-none rounded-2xl px-5 py-4 text-lg font-black focus:ring-2 focus:ring-primary/10 text-right overflow-hidden"
              required
            />
          </div>
        </div>

        {/* Location Region Selector */}
        <div className="space-y-3">
          <label className="text-[13px] font-black text-gray-400 uppercase tracking-widest ml-1">
            {t('shop.location', 'LOCATION')} <span className="text-primary">*</span>
          </label>
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
            {regions.map(r => (
              <button
                key={r}
                type="button"
                onClick={() => setRegion(r)}
                className={`px-5 py-2.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${
                  region === r 
                    ? 'bg-primary text-white border-primary shadow-md' 
                    : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Location Detail */}
        <div className="space-y-3">
          <label className="text-[13px] font-black text-gray-400 uppercase tracking-widest ml-1">
            {t('shop.location_detail', 'LOCATION DETAIL')}
          </label>
          <input
            type="text"
            value={locationDetail}
            onChange={(e) => setLocationDetail(e.target.value)}
            placeholder={t('shop.location_detail_placeholder', 'Enter specific location details')}
            className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-primary/10"
          />
        </div>

        {/* Description */}
        <div className="space-y-3 pb-8">
          <label className="text-[13px] font-black text-gray-400 uppercase tracking-widest ml-1">{t('shop.product_story', 'Product Story')}</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t('shop.product_story_placeholder', "Tell us about the condition, materials, and why you're selling...")}
            className="w-full min-h-[160px] bg-gray-50 border-none rounded-[28px] px-6 py-5 text-sm font-medium focus:ring-2 focus:ring-primary/10 resize-none leading-relaxed"
          />
        </div>
      </div>
    </FullScreenRegistration>
  );
}
