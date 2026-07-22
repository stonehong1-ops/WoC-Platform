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
  const { t, language } = useLanguage();
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

  const [step, setStep] = useState(1);
  const TOTAL_STEPS = 2;

  const isStep1Valid = !!(title.trim() && (existingUrls.length + mediaFiles.length) > 0);
  const isStep2Valid = !!(price.trim() && parseInt(price, 10) > 0 && region);

  const handleNextOrSave = () => {
    if (step === 1) {
      if (!title.trim()) {
        alert(t('resale.title_placeholder') || '상품명을 입력해 주세요.');
        return;
      }
      if (existingUrls.length + mediaFiles.length === 0) {
        alert(t('shop.msg_upload_photo') || '최소 1장의 사진을 등록해 주세요.');
        return;
      }
      setStep(2);
    } else {
      if (!price.trim()) {
        alert(t('shop.msg_enter_price') || '올바른 가격을 입력해 주세요.');
        return;
      }
      handleSubmit();
    }
  };

  const modalTitle = itemToEdit
    ? (t('resale.edit_title') || '중고상품 수정')
    : (t('resale.create_title') || '중고상품 등록');

  const stepCategoryTitle = step === 1
    ? (t('shop.product_details') || '상품 기본정보')
    : (t('shop.price_and_location') || '가격 및 위치');

  const hasDraftContent = Boolean(title.trim() || price.trim() || description.trim() || mediaFiles.length > 0);

  return (
    <FullScreenRegistration
      id="resale"
      isOpen={isOpen}
      onClose={onClose}
      title={modalTitle}
      submitLabel={isSubmitting ? `${uploadProgress}%` : (step < TOTAL_STEPS ? t('common.next_step') : (itemToEdit ? (language === 'KR' ? '저장' : 'Save') : (language === 'KR' ? '등록' : 'Register')))}
      submittingLabel={`${uploadProgress}%`}
      onSubmit={handleNextOrSave}
      isSubmitting={isSubmitting}
      isValid={step === 1 ? isStep1Valid : isStep2Valid}
      hasDraftContent={hasDraftContent}
    >
      {/* Step Indicator Bar */}
      <div className="w-full mb-6">
        <div className="flex items-center justify-between border border-slate-100 bg-slate-50/80 backdrop-blur rounded-2xl px-4 py-3 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-slate-700">
              Step {step} of {TOTAL_STEPS}
            </span>
            <span className="text-xs font-bold text-[#007AFF] bg-[#007AFF]/10 px-2.5 py-0.5 rounded-full">
              {stepCategoryTitle}
            </span>
          </div>
          <div className="w-20 h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#007AFF] transition-all duration-300"
              style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
            />
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Photos Card */}
            <div className="border border-[#e0e4e5] rounded-2xl bg-white shadow-sm overflow-hidden">
              <div className="bg-[#f8f9fa] px-4 py-3 border-b border-[#e0e4e5] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-rounded text-sm text-[#007AFF]">photo_library</span>
                  <p className="text-[14px] font-bold text-[#007AFF]">
                    {t('resale.add_photo') || 'PHOTOS'} <span className="text-red-500">*</span>
                  </p>
                </div>
                <span className="text-xs font-bold text-slate-400">{previewUrls.length}/{MAX_PHOTOS}</span>
              </div>
              <div className="p-4">
                <div className="flex gap-3 overflow-x-auto no-scrollbar py-1">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="shrink-0 w-24 h-30 border-2 border-dashed border-[#e0e4e5] rounded-2xl flex flex-col items-center justify-center gap-1 hover:border-[#007AFF] hover:bg-blue-50/50 transition-colors"
                  >
                    <span className="material-symbols-rounded text-2xl text-[#007AFF]">add_a_photo</span>
                    <span className="text-[11px] font-bold text-slate-500">Add Photo</span>
                  </button>
                  <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleFileChange} className="hidden" />

                  {previewUrls.map((url, idx) => (
                    <div key={idx} className="relative shrink-0 w-24 h-30 border border-slate-200 rounded-2xl overflow-hidden shadow-sm group">
                      <img src={url} alt={`Preview ${idx}`} className="w-full h-full object-cover" />
                      {idx === 0 && (
                        <div className="absolute top-1.5 left-1.5 bg-[#FF9500] text-white text-[9px] font-black tracking-wider px-1.5 py-0.5 rounded shadow-sm z-10">
                          PRIMARY
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => removePhoto(idx)}
                        className="absolute top-1.5 right-1.5 bg-black/60 text-white rounded-full p-1 hover:bg-red-500 transition-colors"
                      >
                        <span className="material-symbols-rounded text-[14px]">close</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Basic Details Card */}
            <div className="border border-[#e0e4e5] rounded-2xl bg-white shadow-sm overflow-hidden space-y-4">
              <div className="bg-[#f8f9fa] px-4 py-3 border-b border-[#e0e4e5] flex items-center gap-2">
                <span className="material-symbols-rounded text-sm text-[#007AFF]">info</span>
                <p className="text-[14px] font-bold text-[#007AFF]">Basic Info</p>
              </div>
              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {t('resale.what_sharing') || 'Title'} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={t('resale.title_placeholder') || 'e.g. Comme il Faut Tango Shoes Size 37'}
                    className="w-full bg-[#f8f9fa] border border-[#e0e4e5] rounded-xl px-4 py-3 text-sm font-bold focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF] outline-none transition-all placeholder:text-[#acb3b4] placeholder:font-normal"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {t('resale.category') || 'Category'}
                  </label>
                  <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                    {categories.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setCategory(c)}
                        className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                          category === c
                            ? 'bg-[#007AFF] text-white border-[#007AFF] shadow-sm'
                            : 'bg-[#f8f9fa] text-slate-600 border-[#e0e4e5] hover:border-slate-300'
                        }`}
                      >
                        {t(`resale.cat_${c.toLowerCase()}`) || c}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {t('resale.condition') || 'Condition'}
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {conditions.map((c) => (
                      <button
                        key={c.val}
                        type="button"
                        onClick={() => setCondition(c.val)}
                        className={`py-3 rounded-xl border text-center transition-all ${
                          condition === c.val
                            ? 'bg-[#007AFF] text-white border-[#007AFF] shadow-sm'
                            : 'bg-[#f8f9fa] text-slate-600 border-[#e0e4e5] hover:border-slate-300'
                        }`}
                      >
                        <div className="text-sm font-black uppercase">{c.val}</div>
                        <div className="text-[10px] font-medium opacity-80">{c.label}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {t('resale.story') || 'Description'}
                  </label>
                  <textarea
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={t('resale.story_placeholder') || 'Describe your item condition, usage history...'}
                    className="w-full bg-[#f8f9fa] border border-[#e0e4e5] rounded-xl px-4 py-3 text-sm font-bold focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF] outline-none transition-all resize-none leading-relaxed placeholder:text-[#acb3b4] placeholder:font-normal"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Price Card */}
            <div className="border border-[#e0e4e5] rounded-2xl bg-white shadow-sm overflow-hidden">
              <div className="bg-[#f8f9fa] px-4 py-3 border-b border-[#e0e4e5] flex items-center gap-2">
                <span className="material-symbols-rounded text-sm text-[#007AFF]">payments</span>
                <p className="text-[14px] font-bold text-[#007AFF]">Pricing</p>
              </div>
              <div className="p-4 space-y-4">
                <div className="flex gap-3">
                  <div className="w-[100px] shrink-0">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Currency</label>
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="w-full bg-[#f8f9fa] border border-[#e0e4e5] rounded-xl px-3 py-3 text-sm font-bold focus:border-[#007AFF] outline-none"
                    >
                      {CURRENCIES.map(curr => (
                        <option key={curr} value={curr}>{curr}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      {t('resale.price') || 'Price'} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formatPrice(price)}
                      onChange={handlePriceChange}
                      placeholder="0"
                      className="w-full bg-[#f8f9fa] border border-[#e0e4e5] rounded-xl px-4 py-3 text-[16px] font-bold text-right focus:border-[#007AFF] outline-none placeholder:text-[#acb3b4] placeholder:font-normal"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setCanNegotiate(false)}
                    className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all border ${
                      !canNegotiate
                        ? 'bg-[#007AFF] text-white border-[#007AFF]'
                        : 'bg-[#f8f9fa] text-slate-600 border-[#e0e4e5]'
                    }`}
                  >
                    {t('resale.fixed_price') || 'Fixed Price'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setCanNegotiate(true)}
                    className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all border ${
                      canNegotiate
                        ? 'bg-[#007AFF] text-white border-[#007AFF]'
                        : 'bg-[#f8f9fa] text-slate-600 border-[#e0e4e5]'
                    }`}
                  >
                    {t('resale.negotiation_ok') || 'Negotiable'}
                  </button>
                </div>
              </div>
            </div>

            {/* Location & Trade Method Card */}
            <div className="border border-[#e0e4e5] rounded-2xl bg-white shadow-sm overflow-hidden">
              <div className="bg-[#f8f9fa] px-4 py-3 border-b border-[#e0e4e5] flex items-center gap-2">
                <span className="material-symbols-rounded text-sm text-[#007AFF]">location_on</span>
                <p className="text-[14px] font-bold text-[#007AFF]">Location & Trade Method</p>
              </div>
              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {t('resale.location') || 'Location'} <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                    {cityOptions.map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setRegion(r)}
                        className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                          region === r
                            ? 'bg-[#007AFF] text-white border-[#007AFF] shadow-sm'
                            : 'bg-[#f8f9fa] text-slate-600 border-[#e0e4e5] hover:border-slate-300'
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {t('resale.trade_method') || 'Trade Method'}
                  </label>
                  <select
                    value={tradeMethod}
                    onChange={(e) => setTradeMethod(e.target.value as TradeMethod)}
                    className="w-full bg-[#f8f9fa] border border-[#e0e4e5] rounded-xl px-4 py-3 text-sm font-bold focus:border-[#007AFF] outline-none"
                  >
                    <option value="direct">{t('resale.trade_direct') || 'Direct'}</option>
                    <option value="delivery">{t('resale.trade_delivery') || 'Delivery'}</option>
                    <option value="both">{t('resale.trade_both') || 'Both'}</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </FullScreenRegistration>
  );
}
