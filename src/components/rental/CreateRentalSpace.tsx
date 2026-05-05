import React, { useState, useRef } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { rentalService } from '@/lib/firebase/rentalService';
import { plazaService } from '@/lib/firebase/plazaService';
import FullScreenRegistration from '@/components/common/FullScreenRegistration';
import { useLanguage } from '@/contexts/LanguageContext';
import { CITY_COORDINATES } from '@/lib/constants/locations';

interface CreateRentalSpaceProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const CURRENCIES = ['KRW', 'USD', 'EUR', 'JPY', 'CNY'];
const MAX_PHOTOS = 20;

export default function CreateRentalSpace({ isOpen, onClose, onSuccess }: CreateRentalSpaceProps) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const [title, setTitle] = useState('');
  const [studioName, setStudioName] = useState('');
  const [category, setCategory] = useState('rental.category_studio');
  const [pricePerHour, setPricePerHour] = useState('');
  const [currency, setCurrency] = useState('KRW');
  const [minHours, setMinHours] = useState('1');
  const [capacity, setCapacity] = useState('');
  const [size, setSize] = useState('rental.size_medium');
  const [region, setRegion] = useState('SEOUL');
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');
  const [facilities, setFacilities] = useState<string[]>([]);
  const [newFacility, setNewFacility] = useState('');
  const [rules, setRules] = useState('');
  
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const categories = [
    'rental.category_studio', 
    'rental.category_practice', 
    'rental.category_party', 
    'rental.category_gallery', 
    'rental.category_hall', 
    'rental.category_other'
  ];
  
  const sizes = [
    'rental.size_small', 
    'rental.size_medium', 
    'rental.size_large', 
    'rental.size_extra_large'
  ];

  const regions = Object.keys(CITY_COORDINATES);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const availableSlots = MAX_PHOTOS - mediaFiles.length;
    const filesToAdd = files.slice(0, availableSlots);

    if (files.length > availableSlots) {
      alert(`You can only upload up to ${MAX_PHOTOS} photos.`);
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

  const addFacility = () => {
    if (newFacility.trim() && !facilities.includes(newFacility.trim())) {
      setFacilities([...facilities, newFacility.trim()]);
      setNewFacility('');
    }
  };

  const removeFacility = (f: string) => {
    setFacilities(facilities.filter(item => item !== f));
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9]/g, '');
    setPricePerHour(val);
  };

  const formatPrice = (val: string) => {
    if (!val) return '';
    return parseInt(val, 10).toLocaleString();
  };

  const handleSubmit = async () => {
    if (!user || !title || !pricePerHour || mediaFiles.length === 0 || !region) {
      alert(t('rental.msg_fill_required') || 'Please fill in required fields and add at least one photo.');
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

      await rentalService.addSpace({
        title,
        description,
        location: region,
        address,
        images: uploadedUrls,
        category: t(category),
        pricePerHour: parseInt(pricePerHour),
        currency,
        minHours: parseInt(minHours),
        capacity: capacity ? parseInt(capacity) : undefined,
        size: t(size),
        studioName,
        facilities,
        rules,
        hostId: user.uid,
        regularClasses: []
      });

      onSuccess?.();
      onClose();
    } catch (error) {
      console.error("Error creating rental space:", error);
      alert(t('rental.msg_post_failed') || 'Failed to post space.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isValid = !!(title && pricePerHour && mediaFiles.length > 0 && region);

  return (
    <FullScreenRegistration
      id="rental"
      isOpen={isOpen}
      onClose={onClose}
      title={t('rental.create_title') || 'CREATE RENTAL SPACE'}
      submitLabel={t('rental.share_space') || 'SAVE'}
      submittingLabel={`${t('common.uploading') || 'UPLOADING'} ${uploadProgress}%`}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      isValid={isValid}
    >
      <div className="space-y-10 pt-4">
        
        {/* Photo Upload Area */}
        <div className="space-y-3">
          <div className="flex items-center justify-between ml-1">
            <label className="text-[13px] font-black text-gray-400 uppercase tracking-widest">
              {t('rental.add_photo') || 'PHOTOS'} <span className="text-primary">*</span>
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

        {/* Space Title */}
        <div className="space-y-2">
          <label className="text-[13px] font-black text-gray-400 uppercase tracking-widest ml-1">
            {t('rental.space_name') || 'SPACE TITLE'} <span className="text-primary">*</span>
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t('rental.space_name_placeholder') || 'What is the name of your space?'}
            className="w-full text-[24px] font-black tracking-tighter border-none focus:ring-0 placeholder:text-gray-200 p-0 bg-transparent"
            required
          />
        </div>

        {/* Studio Name */}
        <div className="space-y-3">
          <label className="text-[13px] font-black text-gray-400 uppercase tracking-widest ml-1">
            {t('rental.studio_name') || 'STUDIO NAME'}
          </label>
          <input
            value={studioName}
            onChange={(e) => setStudioName(e.target.value)}
            placeholder={t('rental.studio_name_placeholder') || 'Enter studio name'}
            className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-primary/10"
          />
        </div>

        {/* Category */}
        <div className="space-y-3">
          <label className="text-[13px] font-black text-gray-400 uppercase tracking-widest ml-1">
            {t('rental.category_label') || 'CATEGORY'}
          </label>
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
            {categories.map(c => (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                className={`px-5 py-2.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${
                  category === c 
                    ? 'bg-gray-900 text-white border-gray-900 shadow-md' 
                    : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                }`}
              >
                {t(c)}
              </button>
            ))}
          </div>
        </div>

        {/* Price & Currency */}
        <div className="space-y-4">
          <label className="text-[13px] font-black text-gray-400 uppercase tracking-widest ml-1">
            {t('rental.price_per_hour') || 'PRICE PER HOUR'} <span className="text-primary">*</span>
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
              value={formatPrice(pricePerHour)}
              onChange={handlePriceChange}
              placeholder="0"
              className="flex-1 min-w-0 bg-gray-50 border-none rounded-2xl px-5 py-4 text-lg font-black focus:ring-2 focus:ring-primary/10 text-right overflow-hidden"
              required
            />
          </div>
        </div>

        {/* Hours & Capacity */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-3">
            <label className="text-[13px] font-black text-gray-400 uppercase tracking-widest ml-1">
              {t('rental.min_booking_time') || 'MIN HOURS'}
            </label>
            <input
              type="number"
              value={minHours}
              onChange={(e) => setMinHours(e.target.value)}
              placeholder="1"
              className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-primary/10"
              required
            />
          </div>
          <div className="space-y-3">
            <label className="text-[13px] font-black text-gray-400 uppercase tracking-widest ml-1">
              {t('rental.capacity_label') || 'CAPACITY'}
            </label>
            <input
              type="number"
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              placeholder={t('rental.capacity_placeholder') || 'E.g. 10'}
              className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-primary/10"
            />
          </div>
        </div>

        {/* Space Size */}
        <div className="space-y-3">
          <label className="text-[13px] font-black text-gray-400 uppercase tracking-widest ml-1">
            {t('rental.space_size_label') || 'SIZE'}
          </label>
          <select
            value={size}
            onChange={(e) => setSize(e.target.value)}
            className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-primary/10"
          >
            {sizes.map(s => <option key={s} value={s}>{t(s)}</option>)}
          </select>
        </div>

        {/* Location Region Selector */}
        <div className="space-y-3">
          <label className="text-[13px] font-black text-gray-400 uppercase tracking-widest ml-1">
            {t('rental.location_label') || 'LOCATION'} <span className="text-primary">*</span>
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

        {/* Location Detail Text Input */}
        <div className="space-y-3">
          <label className="text-[13px] font-black text-gray-400 uppercase tracking-widest ml-1">
            {t('rental.detail_address_placeholder') || 'ADDRESS'}
          </label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Enter specific address details"
            className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-primary/10"
          />
        </div>

        {/* Facilities */}
        <div className="space-y-3">
           <label className="text-[13px] font-black text-gray-400 uppercase tracking-widest ml-1">
             {t('rental.amenities_label') || 'AMENITIES'}
           </label>
           <div className="flex gap-2">
              <input
                value={newFacility}
                onChange={(e) => setNewFacility(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addFacility())}
                placeholder={t('rental.amenities_placeholder') || 'E.g. Mirror, Speaker, WiFi'}
                className="flex-1 bg-gray-50 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-primary/10"
              />
              <button
                type="button"
                onClick={addFacility}
                className="bg-gray-900 text-white w-[52px] h-[52px] shrink-0 rounded-2xl flex items-center justify-center shadow-md active:scale-95 transition-all"
              >
                <span className="material-symbols-rounded">add</span>
              </button>
           </div>
           {facilities.length > 0 && (
             <div className="flex flex-wrap gap-2 mt-2">
                {facilities.map(f => (
                  <span key={f} className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white text-gray-700 rounded-xl text-xs font-bold border border-gray-200 shadow-sm">
                    {f}
                    <button onClick={() => removeFacility(f)} className="material-symbols-rounded text-[16px] text-gray-400 hover:text-red-500">close</button>
                  </span>
                ))}
             </div>
           )}
        </div>

        {/* Description */}
        <div className="space-y-3">
          <label className="text-[13px] font-black text-gray-400 uppercase tracking-widest ml-1">
            {t('rental.description_label') || 'DESCRIPTION'}
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t('rental.description_placeholder') || 'Describe the space in detail...'}
            className="w-full min-h-[160px] bg-gray-50 border-none rounded-[28px] px-6 py-5 text-sm font-medium focus:ring-2 focus:ring-primary/10 resize-y leading-relaxed"
          />
        </div>

        {/* Rules */}
        <div className="space-y-3 pb-8">
          <label className="text-[13px] font-black text-gray-400 uppercase tracking-widest ml-1">
            {t('rental.rules_label') || 'RULES'}
          </label>
          <textarea
            value={rules}
            onChange={(e) => setRules(e.target.value)}
            placeholder={t('rental.rules_placeholder') || 'Enter rules for users...'}
            className="w-full min-h-[120px] bg-gray-50 border-none rounded-[28px] px-6 py-5 text-sm font-medium focus:ring-2 focus:ring-primary/10 resize-y leading-relaxed"
          />
        </div>

      </div>
    </FullScreenRegistration>
  );
}

