import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { resaleService } from '@/lib/firebase/resaleService';
import { plazaService } from '@/lib/firebase/plazaService';
import { ResaleItem, ItemCondition, TradeMethod } from '@/types/resale';
import FullScreenRegistration from '@/components/common/FullScreenRegistration';
import { useLanguage } from '@/contexts/LanguageContext';
import { CITY_COORDINATES } from '@/constants/locations';
import { useLocation } from '@/components/providers/LocationProvider';
import { REGIONS } from '@/components/layout/LocationSelector';

interface CreateResaleItemProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  itemToEdit?: ResaleItem;
}

const CURRENCIES = ['KRW', 'USD', 'EUR', 'JPY', 'CNY'];
const MAX_PHOTOS = 20;

export default function CreateResaleItem({ isOpen, onClose, onSuccess, itemToEdit }: CreateResaleItemProps) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { location } = useLocation();
  const router = useRouter();
  
  const currentCountry = location?.country || 'KOREA';
  const countryData = REGIONS.flatMap(r => r.countries).find(c => c.name === currentCountry);
  const cityOptions = countryData ? countryData.cities.map(c => c.name) : [];
  
  const defaultCity = location?.city && location.city !== 'ALL' && cityOptions.includes(location.city) 
    ? location.city 
    : (cityOptions[0] || '');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const [title, setTitle] = useState(itemToEdit ? itemToEdit.title : '');
  const [price, setPrice] = useState(itemToEdit ? itemToEdit.price.toString() : '');
  const [currency, setCurrency] = useState(itemToEdit ? itemToEdit.currency : 'KRW');
  const [canNegotiate, setCanNegotiate] = useState(itemToEdit ? itemToEdit.canNegotiate : false);

  const [region, setRegion] = useState(itemToEdit ? itemToEdit.location : defaultCity);
  
  const [category, setCategory] = useState(itemToEdit ? itemToEdit.category : 'Others');
  const [condition, setCondition] = useState<ItemCondition>(itemToEdit ? itemToEdit.condition : 'A');
  const [tradeMethod, setTradeMethod] = useState<TradeMethod>(itemToEdit ? itemToEdit.tradeMethod : 'both');
  const [description, setDescription] = useState(itemToEdit ? itemToEdit.description : '');
  
  const [existingUrls, setExistingUrls] = useState<string[]>(itemToEdit ? (itemToEdit.imageUrls || [itemToEdit.imageUrl].filter(Boolean) as string[]) : []);
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>(itemToEdit ? (itemToEdit.imageUrls || [itemToEdit.imageUrl].filter(Boolean) as string[]) : []);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const categories = ['Shoes', 'Apparel', 'Accessories', 'Equipment', 'Others'];
  const conditions: { val: ItemCondition; label: string }[] = [
    { val: 'S', label: 'New' },
    { val: 'A', label: 'Like New' },
    { val: 'B', label: 'Good' },
    { val: 'C', label: 'Well-used' }
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const totalPhotosCount = existingUrls.length + mediaFiles.length;
    const availableSlots = MAX_PHOTOS - totalPhotosCount;
    const filesToAdd = files.slice(0, availableSlots);

    if (files.length > availableSlots) {
      alert(t('resale.msg_max_photos') || `You can only upload up to ${MAX_PHOTOS} photos.`);
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

  const handleSubmit = async () => {
    const totalPhotosCount = existingUrls.length + mediaFiles.length;
    if (!user || !title || !price || totalPhotosCount === 0 || !region) {
      return;
    }

    setIsSubmitting(true);
    setUploadProgress(0);
    
    try {
      let uploadedUrls: string[] = [];
      const totalFiles = mediaFiles.length;
      
      if (totalFiles > 0) {
        uploadedUrls = await Promise.all(
          mediaFiles.map(async (file, index) => {
            const url = await plazaService.uploadMedia(file, (p) => {
              setUploadProgress(Math.round(((index * 100) + p) / totalFiles));
            });
            return url;
          })
        );
      }

      const finalImageUrls = [...existingUrls, ...uploadedUrls];

      const itemPayload = {
        title,
        description,
        price: parseInt(price, 10),
        currency,
        location: region,
        locationDetail: '',
        category,
        imageUrl: finalImageUrls[0] || '',
        imageUrls: finalImageUrls,
        sellerId: user.uid,
        sellerName: user.displayName || 'Anonymous',
        condition,
        tradeMethod,
        canNegotiate,
      };

      let newId: string | undefined;
      if (itemToEdit) {
        await resaleService.updateItem(itemToEdit.id, itemPayload);
        onSuccess?.();
        onClose();
      } else {
        newId = await resaleService.registerItem(itemPayload);
        onSuccess?.();
        router.replace('/create-success?type=resale&id=' + (newId || ''));
      }
    } catch (error) {
      console.error("Error saving resale item:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isValid = !!(title && price && (existingUrls.length + mediaFiles.length) > 0 && region);

  return (
    <FullScreenRegistration
      id="resale"
      isOpen={isOpen}
      onClose={onClose}
      title={itemToEdit ? (t('resale.edit_title') || 'EDIT RESALE') : (t('resale.create_title') || 'CREATE RESALE')}
      submitLabel="SAVE"
      submittingLabel={`${t('resale.posting') || 'UPLOADING'} ${uploadProgress}%`}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      isValid={isValid}
    >
      <div className="space-y-10 pt-4">
        
        {/* Photo Upload Area */}
        <div className="space-y-3">
          <div className="flex items-center justify-between ml-1">
            <label className="text-[14px] font-bold text-gray-400">
              {t('resale.add_photo') || 'PHOTOS'} <span className="text-primary">*</span>
            </label>
            <span className="text-[13px] font-bold text-gray-400">{previewUrls.length}/{MAX_PHOTOS}</span>
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

        {/* Title */}
        <div className="space-y-2">
          <label className="text-[14px] font-bold text-gray-400 ml-1">
            {t('resale.what_sharing') || 'TITLE'} <span className="text-primary">*</span>
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t('resale.title_placeholder') || 'What are you selling?'}
            className="w-full text-[16px] font-bold border-none focus:ring-0 placeholder:text-gray-200 p-0 bg-transparent"
            required
          />
        </div>

        {/* Category */}
        <div className="space-y-3">
          <label className="text-[14px] font-bold text-gray-400 ml-1">
            {t('resale.category') || 'CATEGORY'}
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
                {t(`resale.cat_${c.toLowerCase()}`) || c}
              </button>
            ))}
          </div>
        </div>

        {/* Price & Currency & Negotiation */}
        <div className="space-y-4">
          <label className="text-[14px] font-bold text-gray-400 ml-1">
            {t('resale.price') || 'PRICE'} <span className="text-primary">*</span>
          </label>
          
          <div className="flex w-full items-center gap-3">
            <select 
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="bg-gray-50 border-none rounded-2xl px-4 py-4 text-[16px] font-bold focus:ring-2 focus:ring-primary/10 w-[100px] shrink-0"
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
              className="flex-1 min-w-0 bg-gray-50 border-none rounded-2xl px-5 py-4 text-[16px] font-bold focus:ring-2 focus:ring-primary/10 text-right overflow-hidden"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3 mt-3">
            <button 
              type="button"
              onClick={() => setCanNegotiate(false)}
              className={`w-full py-3.5 rounded-2xl text-xs font-bold transition-all border-2 ${
                !canNegotiate 
                  ? 'border-gray-900 text-gray-900 bg-white' 
                  : 'border-transparent text-gray-400 bg-gray-50 hover:bg-gray-100'
              }`}
            >
              {t('resale.fixed_price') || 'Fixed Price'}
            </button>
            <button 
              type="button"
              onClick={() => setCanNegotiate(true)}
              className={`w-full py-3.5 rounded-2xl text-xs font-bold transition-all border-2 ${
                canNegotiate 
                  ? 'border-primary text-primary bg-primary/5' 
                  : 'border-transparent text-gray-400 bg-gray-50 hover:bg-gray-100'
              }`}
            >
              {t('resale.negotiation_ok') || 'Negotiable'}
            </button>
          </div>
        </div>

        {/* Location Region Selector */}
        <div className="space-y-3">
          <label className="text-[14px] font-bold text-gray-400 ml-1">
            {t('resale.location') || 'LOCATION'} <span className="text-primary">*</span>
          </label>
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
            {cityOptions.map(r => (
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

        {/* Condition Selector */}
        <div className="space-y-3">
           <label className="text-[14px] font-bold text-gray-400 ml-1">
             {t('resale.condition') || 'CONDITION'}
           </label>
           <div className="grid grid-cols-4 gap-3">
              {conditions.map(c => (
                <button
                  key={c.val}
                  type="button"
                  onClick={() => setCondition(c.val)}
                  className={`py-3.5 rounded-2xl text-[12px] font-black transition-all border ${
                    condition === c.val 
                      ? 'border-gray-900 bg-gray-900 text-white' 
                      : 'border-gray-100 bg-white text-gray-400 hover:border-gray-300'
                  }`}
                >
                  <div className="text-lg leading-tight uppercase mb-0.5">{c.val}</div>
                  <div className="text-[9px] opacity-80 uppercase tracking-widest">
                    {t(`resale.cond_${c.val.toLowerCase()}`) || c.label}
                  </div>
                </button>
              ))}
           </div>
        </div>

        {/* Trade Options */}
        <div className="space-y-3">
          <label className="text-[14px] font-bold text-gray-400 ml-1">
            {t('resale.trade_method') || 'TRADE METHOD'}
          </label>
          <select 
            value={tradeMethod}
            onChange={(e) => setTradeMethod(e.target.value as TradeMethod)}
            className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-[16px] font-bold focus:ring-2 focus:ring-primary/10"
          >
            <option value="direct">{t('resale.trade_direct') || 'Direct'}</option>
            <option value="delivery">{t('resale.trade_delivery') || 'Delivery'}</option>
            <option value="both">{t('resale.trade_both') || 'Both'}</option>
          </select>
        </div>

        {/* Description */}
        <div className="space-y-3 pb-8">
          <label className="text-[14px] font-bold text-gray-400 ml-1">
            {t('resale.story') || 'DESCRIPTION'}
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t('resale.story_placeholder') || 'Describe your item in detail...'}
            className="w-full min-h-[160px] bg-gray-50 border-none rounded-[28px] px-6 py-5 text-[16px] font-medium focus:ring-2 focus:ring-primary/10 resize-y leading-relaxed"
          />
        </div>
        
      </div>
    </FullScreenRegistration>
  );
}
