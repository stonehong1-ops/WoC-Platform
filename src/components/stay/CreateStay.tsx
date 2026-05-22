// 신규 장소(숙박 및 수련회/Stay) 등록 모달
'use client';

import React, { useState, useRef } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { stayService } from '@/lib/firebase/stayService';
import { plazaService } from '@/lib/firebase/plazaService';
import { StayType } from '@/types/stay';
import { useLanguage } from '@/contexts/LanguageContext';
import { CITY_COORDINATES } from '@/lib/constants/locations';
import { motion } from 'framer-motion';

interface CreateStayProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const CURRENCIES = ['KRW', 'USD', 'EUR', 'JPY', 'CNY'];
const MAX_PHOTOS = 20;

export default function CreateStay({ isOpen, onClose, onSuccess }: CreateStayProps) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  
  const [title, setTitle] = useState('');
  const [type, setType] = useState<StayType>('1-Room');
  
  const [region, setRegion] = useState('SEOUL');
  const [addressDetail, setAddressDetail] = useState('');
  
  const [price, setPrice] = useState('');
  const [currency, setCurrency] = useState('KRW');
  const [description, setDescription] = useState('');
  
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  const [amenities, setAmenities] = useState<string[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const stayTypes: StayType[] = ['Couchsurfing', 'Dormitory', '1-Room', '2-Room', '3-Room', 'Pension'];
  const amenityOptions = ['wifi', 'desk', 'coffee', 'studio', 'gym', 'kitchen'];
  const regions = Object.keys(CITY_COORDINATES);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const availableSlots = MAX_PHOTOS - mediaFiles.length;
    const filesToAdd = files.slice(0, availableSlots);

    if (files.length > availableSlots) {
      alert(t('stay.create.alert.max_photos').replace('{max}', MAX_PHOTOS.toString()));
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

  const toggleAmenity = (amenity: string) => {
    setAmenities(prev => 
      prev.includes(amenity) ? prev.filter(a => a !== amenity) : [...prev, amenity]
    );
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
    if (!user || !title || !price || mediaFiles.length === 0 || !region) {
      alert(t('stay.create.alert.required_fields'));
      return;
    }

    setIsSubmitting(true);
    setUploadProgress(0);
    
    try {
      let uploadedUrls: string[] = [];
      const totalFiles = mediaFiles.length;
      setUploadProgress(0);
      
      for (let i = 0; i < totalFiles; i++) {
        const file = mediaFiles[i];
        const url = await plazaService.uploadMedia(file, (p) => {
          setUploadProgress(Math.round(((i * 100) + p) / totalFiles));
        });
        uploadedUrls.push(url);
      }

      await stayService.registerStay({
        groupId: '', // Will be set when creating from group context
        title,
        type,
        location: {
          address: addressDetail,
          city: region,
          district: '',
        },
        pricing: {
          currency,
          baseRate: parseInt(price),
        },
        images: uploadedUrls,
        checkInTime: '15:00',
        checkOutTime: '11:00',
        maxGuests: 2,
        doorCode: '9999',
        payment: {
          methods: [
            { type: 'bank_domestic', enabled: false },
            { type: 'bank_international', enabled: false },
            { type: 'card', enabled: false },
          ],
          transferDeadlineHours: 2,
        },
        host: {
          userId: user.uid,
          name: user.displayName || 'Anonymous',
          photo: user.photoURL || '',
        },
        guides: {
          facilityGuide: description
        },
        amenities,
        isActive: false,
        isNewlyListed: true,
      });

      onSuccess?.();
      onClose();
    } catch (error) {
      console.error("Error creating stay:", error);
      alert(t('stay.create.alert.failed'));
    } finally {
      setIsSubmitting(false);
      setUploadProgress(null);
    }
  };

  const isValid = !!(title && price && mediaFiles.length > 0 && region);

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center font-['Plus_Jakarta_Sans']"
    >
      <motion.main
        initial={{ opacity: 0, y: '100%' }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="relative w-full max-w-md h-[100dvh] sm:h-[85vh] bg-white flex flex-col overflow-hidden sm:rounded-3xl sm:shadow-2xl text-left"
      >
        {/* Header */}
        <div className="flex-shrink-0 bg-white border-b border-[#e0e4e5]/30 px-4 h-14 flex items-center justify-between z-50">
          <button type="button" onClick={onClose} className="w-10 h-10 flex items-center justify-center -ml-2 active:scale-95 transition-transform text-slate-700">
            <span className="material-symbols-outlined text-2xl">arrow_back</span>
          </button>
          <h1 className="text-[14px] font-black uppercase tracking-widest text-slate-800">
            {t('stay.create.title')}
          </h1>
          <div className="w-10" />
        </div>

        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="flex-1 flex flex-col overflow-hidden">
          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto px-5 py-6 space-y-6 no-scrollbar text-left">
            
            {/* Photo Upload Area */}
            <div className="space-y-3">
              <div className="flex items-center justify-between ml-1">
                <label className="block text-xs font-bold text-[#596061] uppercase tracking-wider">
                  {t('stay.create.photos')} <span className="text-primary">*</span>
                </label>
                <span className="text-[11px] font-bold text-gray-400">{mediaFiles.length}/{MAX_PHOTOS}</span>
              </div>
              
              <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 items-center">
                {mediaFiles.length < MAX_PHOTOS && (
                  <button 
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="shrink-0 w-24 h-24 rounded-2xl bg-[#f8f9fa] border border-[#e0e4e5] border-dashed flex flex-col items-center justify-center hover:border-primary/40 hover:bg-primary/5 transition-all active:scale-95"
                  >
                    <span className="material-symbols-outlined text-gray-400 mb-1">add_a_photo</span>
                    <span className="text-[9px] font-black text-gray-400 uppercase">{t('stay.create.add')}</span>
                  </button>
                )}
                
                {previewUrls.map((url, i) => (
                  <div key={i} className="shrink-0 relative w-24 h-24 rounded-2xl overflow-hidden group border border-[#e0e4e5]">
                    <img src={url} className="w-full h-full object-cover" alt={`Preview ${i}`} />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button 
                        type="button"
                        onClick={() => removePhoto(i)}
                        className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center backdrop-blur-md transition-all active:scale-90"
                      >
                        <span className="material-symbols-outlined text-white text-[18px]">delete</span>
                      </button>
                    </div>
                    {i === 0 && (
                      <div className="absolute top-2 left-2 bg-primary px-2 py-0.5 rounded text-[8px] font-black text-white uppercase tracking-widest shadow-sm">
                        {t('stay.create.main')}
                      </div>
                    )}
                  </div>
                ))}
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" multiple onChange={handleFileChange} />
              </div>
            </div>

            {/* Basic Info */}
            <div>
              <label className="block text-xs font-bold text-[#596061] mb-1.5 uppercase tracking-wider">
                {t('stay.create.stay_title')} <span className="text-primary">*</span>
              </label>
              <input
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t('stay.create.title_placeholder')}
                className="w-full bg-[#f8f9fa] border border-[#e0e4e5] rounded-xl px-4 py-3.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-medium"
                type="text"
              />
            </div>

            {/* Stay Type */}
            <div>
              <label className="block text-xs font-bold text-[#596061] mb-1.5 uppercase tracking-wider">
                {t('stay.create.type')}
              </label>
              <div className="relative">
                <select 
                  value={type}
                  onChange={(e) => setType(e.target.value as StayType)}
                  className="w-full bg-[#f8f9fa] border border-[#e0e4e5] rounded-xl px-4 py-3.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all appearance-none pr-10 font-bold"
                >
                  {stayTypes.map(st => <option key={st} value={st}>{t(`stay.type.${st}`)}</option>)}
                </select>
                <span className="material-symbols-rounded absolute right-3 top-1/2 -translate-y-1/2 text-[#acb3b4] pointer-events-none">expand_more</span>
              </div>
            </div>
            
            {/* Price & Currency */}
            <div>
              <label className="block text-xs font-bold text-[#596061] mb-1.5 uppercase tracking-wider">
                {t('stay.create.price_night')} <span className="text-primary">*</span>
              </label>
              
              <div className="flex w-full items-center gap-3">
                <div className="relative w-[100px] shrink-0">
                  <select 
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full bg-[#f8f9fa] border border-[#e0e4e5] rounded-xl px-4 py-3.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all appearance-none pr-8 font-black"
                  >
                    {CURRENCIES.map(curr => (
                      <option key={curr} value={curr}>{curr}</option>
                    ))}
                  </select>
                  <span className="material-symbols-rounded absolute right-3 top-1/2 -translate-y-1/2 text-[#acb3b4] pointer-events-none">expand_more</span>
                </div>
                <input
                  required
                  type="text"
                  value={formatPrice(price)}
                  onChange={handlePriceChange}
                  placeholder="0"
                  className="flex-1 min-w-0 bg-[#f8f9fa] border border-[#e0e4e5] rounded-xl px-4 py-3.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-right font-black"
                />
              </div>
            </div>

            {/* Location Region Selector */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-[#596061] mb-1.5 uppercase tracking-wider">
                {t('stay.create.location')} <span className="text-primary">*</span>
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
                    {t(`common.${r.toLowerCase()}`) || r}
                  </button>
                ))}
              </div>
            </div>

            {/* Location Detail Text Input */}
            <div>
              <label className="block text-xs font-bold text-[#596061] mb-1.5 uppercase tracking-wider">
                {t('stay.create.location_detail')}
              </label>
              <input
                type="text"
                value={addressDetail}
                onChange={(e) => setAddressDetail(e.target.value)}
                placeholder={t('stay.create.location_detail_placeholder')}
                className="w-full bg-[#f8f9fa] border border-[#e0e4e5] rounded-xl px-4 py-3.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
              />
            </div>

            {/* Amenities */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-[#596061] mb-1.5 uppercase tracking-wider">
                {t('stay.create.amenities')}
              </label>
              <div className="flex flex-wrap gap-2">
                {amenityOptions.map(opt => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => toggleAmenity(opt)}
                    className={`px-4 py-2.5 rounded-full text-[11px] font-black transition-all flex items-center gap-1.5 uppercase border ${
                      amenities.includes(opt) 
                        ? 'bg-gray-900 text-white border-gray-900 shadow-md' 
                        : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <span className="material-symbols-rounded text-[16px]">{opt}</span>
                    {t(`stay.amenity.${opt}`)}
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold text-[#596061] mb-1.5 uppercase tracking-wider">
                {t('stay.create.experience')}
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t('stay.create.experience_placeholder')}
                className="w-full min-h-[140px] bg-[#f8f9fa] border border-[#e0e4e5] rounded-xl px-4 py-3.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all resize-none leading-relaxed"
              />
              <div className="flex justify-end mt-1.5 mr-1">
                <span className="text-[10px] font-bold text-gray-300">{description?.length || 0} / 2000</span>
              </div>
            </div>

          </div>

          {/* Submit Floating Bar */}
          <div className="flex-shrink-0 w-full p-4 border-t border-slate-100 bg-white pb-[calc(1rem+env(safe-area-inset-bottom))] z-50">
            <button 
              type="submit" 
              disabled={isSubmitting || !isValid}
              className="w-full bg-primary text-white font-bold py-3.5 rounded-xl shadow-lg shadow-primary/20 active:scale-[0.98] transition-transform disabled:opacity-50 flex items-center justify-center"
            >
              {isSubmitting ? (
                uploadProgress !== null ? (
                  `${uploadProgress}%`
                ) : (
                  t('stay.create.saving')
                )
              ) : (
                t('stay.create.save')
              )}
            </button>
          </div>
        </form>
      </motion.main>
    </motion.div>
  );
}
