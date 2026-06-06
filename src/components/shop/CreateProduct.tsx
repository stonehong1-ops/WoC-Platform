'use client';

// 상품 등록창의 레이아웃 및 폼 UI를 분실물 등록창의 스타일과 100% 매칭하는 컴포넌트
import React, { useState, useRef } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { shopService } from '@/lib/firebase/shopService';
import { plazaService } from '@/lib/firebase/plazaService';
import { useLanguage } from '@/contexts/LanguageContext';
import { CITY_COORDINATES } from '@/constants/locations';

import { Product } from '@/types/shop';

interface CreateProductProps {
  onClose?: () => void;
  onSuccess?: () => void;
  productToEdit?: Product;
}

const CURRENCIES = ['KRW', 'USD', 'EUR', 'JPY', 'CNY'];
const MAX_PHOTOS = 20;

export default function CreateProduct({ onClose, onSuccess, productToEdit }: CreateProductProps) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  
  const [name, setName] = useState(productToEdit ? (productToEdit.title || productToEdit.name || '') : '');
  const [brand, setBrand] = useState(productToEdit ? productToEdit.brand : '');
  const [price, setPrice] = useState(productToEdit ? productToEdit.price.toString() : '');
  const [currency, setCurrency] = useState(productToEdit ? productToEdit.currency : 'KRW');
  const [category, setCategory] = useState(productToEdit ? productToEdit.category : 'Shoes');
  const [description, setDescription] = useState(productToEdit ? productToEdit.description : '');
  
  const [region, setRegion] = useState(productToEdit ? (productToEdit.location || 'SEOUL') : 'SEOUL');
  const [locationDetail, setLocationDetail] = useState(productToEdit ? (productToEdit.locationDetail || '') : '');

  const [existingUrls, setExistingUrls] = useState<string[]>(productToEdit ? (productToEdit.images || [productToEdit.imageUrl].filter(Boolean) as string[]) : []);
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>(productToEdit ? (productToEdit.images || [productToEdit.imageUrl].filter(Boolean) as string[]) : []);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const categories = ['Shoes', 'Dresses', 'Accessories', 'Bikes', 'Yoga Wear', 'Equipments'];
  const regions = Object.keys(CITY_COORDINATES);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const totalPhotosCount = existingUrls.length + mediaFiles.length;
    const availableSlots = MAX_PHOTOS - totalPhotosCount;
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
    const isExisting = index < existingUrls.length;
    if (isExisting) {
      setExistingUrls(prev => prev.filter((_, i) => i !== index));
      setPreviewUrls(prev => prev.filter((_, i) => i !== index));
    } else {
      const fileIndex = index - existingUrls.length;
      setMediaFiles(prev => prev.filter((_, i) => i !== fileIndex));
      setPreviewUrls(prev => {
        const urls = [...prev];
        URL.revokeObjectURL(urls[index]);
        urls.splice(index, 1);
        return urls;
      });
    }
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9]/g, '');
    setPrice(val);
  };

  const formatPrice = (val: string) => {
    if (!val) return '';
    return parseInt(val, 10).toLocaleString();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert(t('shop.msg_login_first') || 'Please login first.');
      return;
    }
    const totalPhotosCount = existingUrls.length + mediaFiles.length;
    if (!name.trim() || !price.trim() || totalPhotosCount === 0 || !region) {
      alert(t('shop.msg_fill_required_photo') || "Please fill in all required fields and add at least one photo.");
      return;
    }

    setIsSubmitting(true);
    setUploadProgress(0);
    
    try {
      const uploadedUrls: string[] = [];
      if (mediaFiles.length > 0) {
        for (let i = 0; i < mediaFiles.length; i++) {
          const file = mediaFiles[i];
          const url = await plazaService.uploadMedia(file, (p) => {
            const overall = Math.round(((i * 100) + p) / mediaFiles.length);
            setUploadProgress(overall);
          });
          uploadedUrls.push(url);
        }
        setUploadProgress(null);
      }

      const finalImageUrls = [...existingUrls, ...uploadedUrls];

      const productPayload = {
        title: name,
        brand,
        price: parseInt(price, 10),
        category,
        description,
        images: finalImageUrls,
        groupId: productToEdit ? productToEdit.groupId : '',
        groupName: productToEdit ? productToEdit.groupName : '',
        currency,
        location: region,
        locationDetail,
        options: productToEdit ? productToEdit.options : [],
        stock: productToEdit ? productToEdit.stock : 1,
        status: productToEdit ? productToEdit.status : 'Active',
        deliveryType: productToEdit ? productToEdit.deliveryType : 'shipping',
        sellerId: productToEdit ? productToEdit.sellerId : user.uid,
        sellerName: productToEdit ? productToEdit.sellerName : (user.displayName || 'Anonymous'),
      };

      if (productToEdit) {
        await shopService.updateProduct(productToEdit.id, productPayload as any);
        alert(t('shop.alert_update_success') || 'Product updated successfully.');
      } else {
        await shopService.addProduct(productPayload as any);
      }

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
      console.error("Error saving product:", error);
      alert(productToEdit ? (t('shop.alert_update_failed') || 'Failed to update product.') : (t('shop.msg_fail_register') || "Failed to register product."));
    } finally {
      setIsSubmitting(false);
      setUploadProgress(null);
    }
  };

  const isValid = !!(name.trim() && price.trim() && (existingUrls.length + mediaFiles.length) > 0 && region);

  return (
    <main className="max-w-md mx-auto h-[100dvh] bg-white flex flex-col overflow-hidden relative text-left">
      {/* Header */}
      <div className="flex-shrink-0 bg-white border-b border-slate-100 px-4 h-14 flex items-center justify-between z-50">
        <button type="button" onClick={onClose} className="w-10 h-10 flex items-center justify-center -ml-2 active:scale-95 transition-transform text-slate-700">
          <span className="material-symbols-rounded text-2xl">arrow_back</span>
        </button>
        <h1 className="text-[14px] font-black uppercase tracking-widest text-slate-800">
          {productToEdit ? (t('shop.edit_product') || 'Edit Product') : (t('shop.host_product') || 'Host Product')}
        </h1>
        <div className="w-10" />
      </div>

      <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
        {/* Form Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-4 mt-4 space-y-6 pb-6 text-left no-scrollbar">
          
          {/* Images */}
          <div>
            <label className="block text-xs font-bold text-[#596061] mb-2 uppercase tracking-wider">
              {t('shop.upload_photo') || 'PHOTOS'} ({mediaFiles.length}/{MAX_PHOTOS}) <span className="text-red-400">*</span>
            </label>
            <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
              {mediaFiles.length < MAX_PHOTOS && (
                <button type="button" onClick={() => fileInputRef.current?.click()}
                  className="w-20 h-20 flex-shrink-0 flex flex-col items-center justify-center border-2 border-dashed border-[#acb3b4] rounded-xl text-[#596061] bg-[#f8f9fa] active:scale-95 transition-transform">
                  <span className="material-symbols-rounded text-2xl mb-1">add_a_photo</span>
                </button>
              )}
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" multiple onChange={handleFileChange} />
              
              {previewUrls.map((url, i) => (
                <div key={i} className="w-20 h-20 flex-shrink-0 relative rounded-xl overflow-hidden border border-slate-100">
                  <img src={url} alt={`Preview ${i}`} className="w-full h-full object-cover" />
                  <button type="button" onClick={() => removePhoto(i)} className="absolute top-1 right-1 w-5 h-5 bg-black/50 rounded-full text-white flex items-center justify-center">
                    <span className="material-symbols-rounded text-[14px]">close</span>
                  </button>
                  {i === 0 && (
                    <div className="absolute bottom-1 left-1 bg-primary px-1.5 py-0.5 rounded text-[8px] font-black text-white uppercase tracking-widest shadow-sm">
                      {t('shop.main_photo') || 'Main'}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Details */}
          <div className="space-y-4">
            {/* Brand Name */}
            <div>
              <label className="block text-xs font-bold text-[#596061] mb-1.5 uppercase tracking-wider">
                {t('shop.brand_name') || 'Brand Name'}
              </label>
              <input type="text" value={brand} onChange={e => setBrand(e.target.value)} placeholder={t('shop.ex_brand') || "Ex. Tango Elite"}
                className="w-full bg-[#f8f9fa] border border-[#e0e4e5] rounded-xl px-4 py-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" />
            </div>

            {/* Product Name */}
            <div>
              <label className="block text-xs font-bold text-[#596061] mb-1.5 uppercase tracking-wider">
                {t('shop.product_name') || 'Product Name'} <span className="text-red-400">*</span>
              </label>
              <input required type="text" value={name} onChange={e => setName(e.target.value)} placeholder={t('shop.ex_product_name') || "Ex. Performance Leather Shoes"}
                className="w-full bg-[#f8f9fa] border border-[#e0e4e5] rounded-xl px-4 py-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" />
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-bold text-[#596061] mb-1.5 uppercase tracking-wider">
                {t('shop.category') || 'Category'}
              </label>
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                {categories.map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                      category === cat 
                        ? 'bg-[#596061] text-white border-[#596061] shadow-sm' 
                        : 'bg-[#f8f9fa] text-gray-500 border-[#e0e4e5] hover:border-gray-300'
                    }`}
                  >
                    {t(`shop.cat_${cat.toLowerCase().replace(/ /g, '_')}`, cat)}
                  </button>
                ))}
              </div>
            </div>

            {/* Price & Currency */}
            <div className="flex gap-3">
              <div className="w-[100px] shrink-0">
                <label className="block text-xs font-bold text-[#596061] mb-1.5 uppercase tracking-wider">
                  {t('shop.currency') || 'Currency'}
                </label>
                <select 
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full bg-[#f8f9fa] border border-[#e0e4e5] rounded-xl px-3 py-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-bold"
                >
                  {CURRENCIES.map(curr => (
                    <option key={curr} value={curr}>{curr}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-xs font-bold text-[#596061] mb-1.5 uppercase tracking-wider">
                  {t('shop.price') || 'Price'} <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-[#acb3b4]">
                    {currency === 'KRW' ? '₩' : currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'JPY' ? '¥' : '¥'}
                  </span>
                  <input required type="text" value={formatPrice(price)} onChange={handlePriceChange} placeholder="0"
                    className="w-full bg-[#f8f9fa] border border-[#e0e4e5] rounded-xl pl-9 pr-4 py-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-bold text-right" />
                </div>
              </div>
            </div>

            {/* Location Region Selector */}
            <div>
              <label className="block text-xs font-bold text-[#596061] mb-1.5 uppercase tracking-wider">
                {t('shop.location') || 'Location'} <span className="text-red-400">*</span>
              </label>
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                {regions.map(r => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRegion(r)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                      region === r 
                        ? 'bg-[#596061] text-white border-[#596061] shadow-sm' 
                        : 'bg-[#f8f9fa] text-gray-500 border-[#e0e4e5] hover:border-gray-300'
                    }`}
                  >
                    {t(`common.${r.toLowerCase()}`) || r}
                  </button>
                ))}
              </div>
            </div>

            {/* Location Detail */}
            <div>
              <label className="block text-xs font-bold text-[#596061] mb-1.5 uppercase tracking-wider">
                {t('shop.location_detail') || 'Location Detail'}
              </label>
              <input type="text" value={locationDetail} onChange={e => setLocationDetail(e.target.value)} placeholder={t('shop.location_detail_placeholder') || 'Enter specific location details'}
                className="w-full bg-[#f8f9fa] border border-[#e0e4e5] rounded-xl px-4 py-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold text-[#596061] mb-1.5 uppercase tracking-wider">
                {t('shop.product_story') || 'Product Story'}
              </label>
              <textarea rows={5} value={description} onChange={e => setDescription(e.target.value)} placeholder={t('shop.product_story_placeholder') || "Tell us about the condition, materials, and why you're selling..."}
                className="w-full bg-[#f8f9fa] border border-[#e0e4e5] rounded-xl px-4 py-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all resize-none" />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex-shrink-0 w-full p-4 border-t border-slate-100 bg-white pb-[calc(1rem+env(safe-area-inset-bottom))] z-50">
          <button type="submit" disabled={isSubmitting || !isValid}
            className="w-full bg-primary text-white font-bold py-3.5 rounded-xl shadow-lg shadow-primary/20 active:scale-[0.98] transition-transform disabled:opacity-50">
            {isSubmitting ? (
              uploadProgress !== null ? (
                `${uploadProgress}%`
              ) : (
                productToEdit ? (t('common.saving') || 'Saving...') : (t('shop.status_registering') || 'Registering...')
              )
            ) : (
              productToEdit ? (t('common.save') || 'Save') : (t('shop.button_register') || 'Host Product')
            )}
          </button>
        </div>
      </form>
    </main>
  );
}
