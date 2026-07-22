'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '@/components/providers/AuthProvider';
import { shopService } from '@/lib/firebase/shopService';
import { groupService } from '@/lib/firebase/groupService';
import { plazaService } from '@/lib/firebase/plazaService';
import { storageService } from '@/lib/firebase/storageService';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigation } from '@/components/providers/NavigationProvider';

import { useLocation } from '@/components/providers/LocationProvider';
import { REGIONS } from '@/components/layout/LocationSelector';
import { CITY_COORDINATES } from '@/constants/locations';
import { Product, ProductStatus } from '@/types/shop';
import { Group } from '@/types/group';

interface CreateProductProps {
  isOpen?: boolean;
  onClose?: () => void;
  onSuccess?: () => void;
  productToEdit?: Product;
  initialGroupId?: string;
  initialGroupName?: string;
}

const CURRENCIES = ['KRW', 'USD', 'EUR', 'JPY', 'CNY'];
const MAX_PHOTOS = 20;
const TOTAL_STEPS = 2;

export default function CreateProduct({ isOpen = true, onClose, onSuccess, productToEdit, initialGroupId, initialGroupName }: CreateProductProps) {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const { setGlobalNavHidden } = useNavigation();
  const { location: userLocation } = useLocation();

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);

  // Form states
  const [name, setName] = useState(productToEdit ? (productToEdit.title || productToEdit.name || '') : '');
  const [brand, setBrand] = useState(productToEdit ? productToEdit.brand : '');
  const [price, setPrice] = useState(productToEdit ? productToEdit.price.toString() : '');
  const [currency, setCurrency] = useState(productToEdit ? productToEdit.currency : 'KRW');
  const [category, setCategory] = useState(productToEdit ? productToEdit.category : 'Shoes');
  const [description, setDescription] = useState(productToEdit ? productToEdit.description : '');
  const [region, setRegion] = useState(productToEdit ? (productToEdit.location || 'SEOUL') : 'SEOUL');
  const [locationDetail, setLocationDetail] = useState(productToEdit ? (productToEdit.locationDetail || '') : '');

  const [existingUrls, setExistingUrls] = useState<string[]>(
    productToEdit ? (productToEdit.images || [productToEdit.imageUrl].filter(Boolean) as string[]) : []
  );
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>(
    productToEdit ? (productToEdit.images || [productToEdit.imageUrl].filter(Boolean) as string[]) : []
  );

  // Group states
  const [selectedGroupId, setSelectedGroupId] = useState(productToEdit?.groupId || initialGroupId || '');
  const [selectedGroupName, setSelectedGroupName] = useState(productToEdit?.groupName || initialGroupName || '');
  const [myOwnerGroups, setMyOwnerGroups] = useState<Group[]>([]);
  const [showGroupSelector, setShowGroupSelector] = useState(false);
  const [groupSearchQuery, setGroupSearchQuery] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const categories = ['Shoes', 'Dresses', 'Accessories', 'Bikes', 'Yoga Wear', 'Equipments'];
  
  const currentCountry = userLocation?.country || 'KOREA';
  const regions = React.useMemo(() => {
    for (const reg of REGIONS) {
      const match = reg.countries.find(c => c.name.toUpperCase() === currentCountry.toUpperCase());
      if (match) {
        return match.cities.map(ct => ct.name);
      }
    }
    return ['SEOUL', 'BUSAN', 'DAEJEON', 'GWANGJU'];
  }, [currentCountry]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!user) return;
    if (selectedGroupId && selectedGroupName) return;

    groupService.getGroups().then(allGroups => {
      const owned = allGroups.filter(g =>
        g.ownerId === user.uid ||
        ((g as any).staffs && (g as any).staffs.includes(user.uid))
      );
      setMyOwnerGroups(owned.length > 0 ? owned : allGroups);

      if (!selectedGroupId) {
        if (owned.length > 0) {
          setSelectedGroupId(owned[0].id);
          setSelectedGroupName(owned[0].name || '');
        } else if (allGroups.length > 0) {
          setSelectedGroupId(allGroups[0].id);
          setSelectedGroupName(allGroups[0].name || '');
        }
      } else if (!selectedGroupName) {
        const match = allGroups.find(g => g.id === selectedGroupId);
        if (match) setSelectedGroupName(match.name || '');
      }
    }).catch(err => console.error("Failed to load user groups:", err));
  }, [user, selectedGroupId, selectedGroupName]);

  // Handle global nav visibility
  useEffect(() => {
    if (isOpen) {
      setGlobalNavHidden(true);
    } else {
      setGlobalNavHidden(false);
    }
    return () => {
      if (isOpen) setGlobalNavHidden(false);
    };
  }, [isOpen, setGlobalNavHidden]);

  // Back Button Logic — Step > 1이면 이전 스텝, Step === 1이면 닫기 안내
  const handleStep1Back = useCallback(() => {
    const hasContent = Boolean(name.trim() || previewUrls.length > 0 || price.trim() || description.trim());
    if (hasContent) {
      if (confirm(t('common.confirm_discard', '작성 중인 내용이 있습니다. 정말 나가시겠습니까?'))) {
        onClose?.();
      }
    } else {
      onClose?.();
    }
  }, [name, previewUrls.length, price, description, t, onClose]);

  const handleHeaderBack = useCallback(() => {
    if (step > 1) {
      setStep(1);
    } else {
      handleStep1Back();
    }
  }, [step, handleStep1Back]);



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

  const isStep1Valid = name.trim().length > 0;
  const isStep2Valid = price.trim().length > 0 && parseInt(price, 10) > 0;

  const handleSubmit = async () => {
    if (!user) {
      alert(t('common.login_required', '로그인이 필요합니다.'));
      return;
    }

    setIsSubmitting(true);
    setUploadProgress(0);

    try {
      const uploadedUrls: string[] = [];
      if (mediaFiles.length > 0) {
        setUploadProgress(0);
        for (let i = 0; i < mediaFiles.length; i++) {
          const file = mediaFiles[i];
          const path = `shop/${Date.now()}_${Math.random().toString(36).substring(7)}`;
          const url = await storageService.uploadFile(file, path, (progress: number) => {
            const overall = Math.round(((i * 100) + progress) / mediaFiles.length);
            setUploadProgress(overall);
          });
          uploadedUrls.push(url);
        }
      }

      const finalImages = [...existingUrls, ...uploadedUrls];
      const mainImageUrl = finalImages[0] || '';

      const productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'likesCount' | 'viewsCount'> = {
        groupId: selectedGroupId || productToEdit?.groupId || '',
        groupName: selectedGroupName || productToEdit?.groupName || '',
        name,
        title: name,
        brand: brand || 'Generic',
        price: parseInt(price, 10) || 0,
        currency,
        category,
        description,
        location: region,
        locationDetail,
        imageUrl: mainImageUrl,
        images: finalImages,
        options: productToEdit?.options || [],
        stock: productToEdit?.stock ?? 1,
        status: (productToEdit?.status || 'Active') as ProductStatus,
        deliveryType: productToEdit?.deliveryType || 'both',
        sellerId: user.uid,
        sellerName: user.displayName || 'Anonymous',
      };

      if (productToEdit?.id) {
        await shopService.updateProduct(productToEdit.id, productData);
      } else {
        await shopService.addProduct(productData);
      }

      onSuccess?.();
      onClose?.();
    } catch (error) {
      console.error('Failed to save product:', error);
      alert(t('common.save_failed', '저장에 실패했습니다. 다시 시도해 주세요.'));
    } finally {
      setIsSubmitting(false);
      setUploadProgress(null);
    }
  };

  const handleNextOrSave = () => {
    if (step === 1) {
      if (!isStep1Valid) {
        if (!selectedGroupId) {
          alert(t('shop.select_group') || '상품을 등록할 그룹을 선택해 주세요.');
          return;
        }
        if (!name.trim()) {
          alert(t('shop.msg_enter_title') || '상품명을 입력해 주세요.');
          return;
        }
        if (previewUrls.length === 0 && existingUrls.length === 0) {
          alert(t('shop.msg_upload_photo') || '최소 1장의 사진을 등록해 주세요.');
          return;
        }
      }
      setStep(2);
    } else {
      if (!isStep2Valid) {
        alert(t('shop.msg_enter_price') || '올바른 가격을 입력해 주세요.');
        return;
      }
      handleSubmit();
    }
  };

  if (!isOpen || !mounted) return null;

  const modalTitle = productToEdit
    ? (language === 'KR' ? '상품 수정' : 'Edit Product')
    : (language === 'KR' ? '상품 등록' : 'Register Product');

  const stepCategoryTitle = step === 1
    ? (language === 'KR' ? '상품 기본정보' : 'Product Details')
    : (language === 'KR' ? '가격 및 위치' : 'Price & Location');

  return createPortal(
    <div className="fixed inset-0 z-[100000] bg-[#FAF8FF] text-slate-800 font-body antialiased flex flex-col animate-in fade-in duration-200 notranslate">
      {/* 1. Standard Header */}
      <header
        className="fixed top-0 left-0 w-full flex-shrink-0 bg-white border-b border-slate-100 px-4 flex items-center justify-between z-[100010]"
        style={{
          paddingTop: 'env(safe-area-inset-top, 0px)',
          height: 'calc(56px + env(safe-area-inset-top, 0px))'
        }}
      >
        <button
          type="button"
          onClick={handleHeaderBack}
          className="w-10 h-10 flex items-center justify-center -ml-2 active:scale-95 transition-transform text-slate-700"
        >
          <span className="material-symbols-rounded text-2xl">arrow_back</span>
        </button>
        <h1 className="text-[16px] font-bold text-slate-800 truncate">
          {modalTitle}
        </h1>
        <div className="w-10" />
      </header>

      {/* Header Spacer */}
      <div
        className="w-full flex-shrink-0"
        style={{ height: 'calc(56px + env(safe-area-inset-top, 0px))' }}
      />

      {/* 2. Step Indicator Bar */}
      <div className="max-w-2xl mx-auto w-full px-4 mt-3 flex-shrink-0">
        <div className="flex items-center justify-between border border-slate-100 bg-slate-50/80 backdrop-blur rounded-2xl px-4 py-3 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-slate-700">
              {language === 'KR' ? `${step} / ${TOTAL_STEPS} 단계` : `Step ${step} of ${TOTAL_STEPS}`}
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

      {/* 3. Form Content (Scrollable) */}
      <main className="flex-1 w-full max-w-2xl mx-auto px-4 py-4 overflow-y-auto pb-28 space-y-6">
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Target Group Selector Card */}
            <div className="border border-[#e0e4e5] rounded-2xl bg-white shadow-sm p-4 space-y-2">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-rounded text-sm text-[#007AFF]">groups</span>
                  <p className="text-[13px] font-bold text-slate-700">
                    {t('shop.target_group')} <span className="text-red-500">*</span>
                  </p>
                </div>
              </div>
              <div
                onClick={() => myOwnerGroups.length > 1 && setShowGroupSelector(true)}
                className={`flex items-center gap-3 p-3 rounded-xl border border-[#e0e4e5] bg-[#f8f9fa] ${myOwnerGroups.length > 1 ? 'cursor-pointer hover:bg-slate-100 transition-colors' : ''}`}
              >
                <div className="w-10 h-10 rounded-lg bg-[#007AFF]/10 text-[#007AFF] font-extrabold flex items-center justify-center shrink-0">
                  {selectedGroupName ? selectedGroupName.charAt(0).toUpperCase() : 'G'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-800 truncate">
                    {selectedGroupName || (myOwnerGroups.length === 0 ? t('shop.no_owned_groups') : t('shop.select_group'))}
                  </p>
                  <p className="text-xs text-slate-400 truncate">
                    {selectedGroupId ? `ID: ${selectedGroupId}` : 'Community Commerce'}
                  </p>
                </div>
                {myOwnerGroups.length > 1 && (
                  <span className="material-symbols-rounded text-slate-400">unfold_more</span>
                )}
              </div>
            </div>

            {/* Photos Card */}
            <div className="border border-[#e0e4e5] rounded-2xl bg-white shadow-sm overflow-hidden">
              <div className="bg-[#f8f9fa] px-4 py-3 border-b border-[#e0e4e5] flex items-center gap-2">
                <span className="material-symbols-rounded text-sm text-[#007AFF]">photo_library</span>
                <p className="text-[14px] font-bold text-[#007AFF]">
                  {language === 'KR' ? '상품 사진' : 'Product Photos'} ({previewUrls.length}/{MAX_PHOTOS})
                </p>
              </div>
              <div className="p-4">
                <div className="flex gap-3 overflow-x-auto no-scrollbar py-1">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-shrink-0 w-24 h-30 border-2 border-dashed border-[#e0e4e5] rounded-2xl flex flex-col items-center justify-center gap-1 hover:border-[#007AFF] hover:bg-blue-50/50 transition-colors"
                  >
                    <span className="material-symbols-rounded text-2xl text-[#007AFF]">add_a_photo</span>
                    <span className="text-[11px] font-bold text-slate-500">
                      {language === 'KR' ? '사진 추가' : 'Add Photo'}
                    </span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  {previewUrls.map((url, idx) => (
                    <div key={idx} className="relative flex-shrink-0 w-24 h-30 border border-slate-200 rounded-2xl overflow-hidden shadow-sm group">
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

            {/* Basic Info Card */}
            <div className="border border-[#e0e4e5] rounded-2xl bg-white shadow-sm overflow-hidden space-y-4">
              <div className="bg-[#f8f9fa] px-4 py-3 border-b border-[#e0e4e5] flex items-center gap-2">
                <span className="material-symbols-rounded text-sm text-[#007AFF]">info</span>
                <p className="text-[14px] font-bold text-[#007AFF]">
                  {language === 'KR' ? '기본 정보' : 'Basic Details'}
                </p>
              </div>
              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-[13px] font-bold text-slate-600 mb-1.5">
                    {t('shop.product_name') || 'Product Name'} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t('shop.product_name_placeholder') || 'e.g. Comme des Garcons Tango Shoes'}
                    className="w-full bg-[#f8f9fa] border border-[#e0e4e5] rounded-xl px-4 py-3 text-[15px] font-medium focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF] outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[13px] font-bold text-slate-600 mb-1.5">
                    {t('shop.category') || 'Category'} <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setCategory(cat)}
                        className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                          category === cat
                            ? 'bg-[#007AFF] text-white border-[#007AFF] shadow-sm'
                            : 'bg-[#f8f9fa] text-slate-600 border-[#e0e4e5] hover:border-slate-300'
                        }`}
                      >
                        {t(`shop.cat_${cat.toLowerCase().replace(/ /g, '_')}`, cat)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Story & Brand Card (Step 1으로 이관) */}
            <div className="border border-[#e0e4e5] rounded-2xl bg-white shadow-sm overflow-hidden">
              <div className="bg-[#f8f9fa] px-4 py-3 border-b border-[#e0e4e5] flex items-center gap-2">
                <span className="material-symbols-rounded text-sm text-[#007AFF]">description</span>
                <p className="text-[14px] font-bold text-[#007AFF]">
                  {t('shop.story_and_brand')}
                </p>
              </div>
              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-[13px] font-bold text-slate-600 mb-1.5">
                    {t('shop.brand') || 'Brand'}
                  </label>
                  <input
                    type="text"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    placeholder={t('shop.brand_placeholder') || 'e.g. Bandolera, Comme il Faut'}
                    className="w-full bg-[#f8f9fa] border border-[#e0e4e5] rounded-xl px-4 py-3 text-[15px] font-medium focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF] outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[13px] font-bold text-slate-600 mb-1.5">
                    {t('shop.product_story') || 'Product Story'}
                  </label>
                  <textarea
                    rows={4}
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder={t('shop.product_story_placeholder') || "Tell us about the condition, materials, and why you're selling..."}
                    className="w-full bg-[#f8f9fa] border border-[#e0e4e5] rounded-xl px-4 py-3 text-[15px] font-medium focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF] outline-none transition-all resize-none leading-relaxed"
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
                <p className="text-[14px] font-bold text-[#007AFF]">
                  {language === 'KR' ? '가격 설정' : 'Pricing'}
                </p>
              </div>
              <div className="p-4 space-y-4">
                <div className="flex gap-3">
                  <div className="w-[100px] shrink-0">
                    <label className="block text-[13px] font-bold text-slate-600 mb-1.5">
                      {t('shop.currency') || 'Currency'}
                    </label>
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="w-full bg-[#f8f9fa] border border-[#e0e4e5] rounded-xl px-3 py-3 text-[15px] font-bold focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF] outline-none transition-all"
                    >
                      {CURRENCIES.map(curr => (
                        <option key={curr} value={curr}>{curr}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="block text-[13px] font-bold text-slate-600 mb-1.5">
                      {t('shop.price') || 'Price'} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formatPrice(price)}
                      onChange={handlePriceChange}
                      placeholder="0"
                      className="w-full bg-[#f8f9fa] border border-[#e0e4e5] rounded-xl px-4 py-3 text-[16px] font-bold text-right focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF] outline-none transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Location Card */}
            <div className="border border-[#e0e4e5] rounded-2xl bg-white shadow-sm overflow-hidden">
              <div className="bg-[#f8f9fa] px-4 py-3 border-b border-[#e0e4e5] flex items-center gap-2">
                <span className="material-symbols-rounded text-sm text-[#007AFF]">location_on</span>
                <p className="text-[14px] font-bold text-[#007AFF]">
                  {language === 'KR' ? '거래 지역 & 희망 위치' : 'Location'}
                </p>
              </div>
              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-[13px] font-bold text-slate-600 mb-1.5">
                    {t('shop.location') || 'Location Region'} <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                    {regions.map(r => (
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
                        {t(`common.${r.toLowerCase()}`) || r}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[13px] font-bold text-slate-600 mb-1.5">
                    {t('shop.location_detail') || 'Location Detail'}
                  </label>
                  <input
                    type="text"
                    value={locationDetail}
                    onChange={e => setLocationDetail(e.target.value)}
                    placeholder={t('shop.location_detail_placeholder') || '만나기 편한 지역'}
                    className="w-full bg-[#f8f9fa] border border-[#e0e4e5] rounded-xl px-4 py-3 text-[15px] font-medium focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF] outline-none transition-all"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* 4. Fixed Bottom Navigation Bar (노치 및 홈 바 Safe Area 자동 적용) */}
      <footer
        className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-4 flex gap-3 items-center justify-between z-[100010] shadow-lg"
        style={{
          paddingTop: '16px',
          paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 0px))',
          height: 'calc(76px + env(safe-area-inset-bottom, 0px))'
        }}
      >
        {step > 1 && (
          <button
            type="button"
            onClick={() => setStep(prev => prev - 1)}
            disabled={isSubmitting}
            className="flex-1 py-3.5 rounded-full border border-slate-200 text-slate-700 text-sm font-bold active:scale-95 transition-all disabled:opacity-50"
          >
            {t('common.previous')}
          </button>
        )}
        <button
          type="button"
          onClick={handleNextOrSave}
          disabled={isSubmitting || (step === 1 && !isStep1Valid) || (step === 2 && !isStep2Valid)}
          className="flex-1 py-3.5 rounded-full bg-[#007AFF] text-white text-sm font-bold active:scale-95 transition-all disabled:opacity-50 shadow-sm"
        >
          {isSubmitting ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>{uploadProgress !== null ? `${uploadProgress}%` : (t('common.saving') || 'Saving...')}</span>
            </div>
          ) : (
            step < TOTAL_STEPS
              ? t('common.next_step')
              : (t('common.save') || 'Save Product')
          )}
        </button>
      </footer>

      {/* Group Selector Modal */}
      {showGroupSelector && (
        <div className="fixed inset-0 z-[100020] bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-2xl max-h-[85vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-200">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <span className="material-symbols-rounded text-[#007AFF]">groups</span>
                {t('shop.target_group')}
              </h3>
              <button
                type="button"
                onClick={() => setShowGroupSelector(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-slate-200"
              >
                <span className="material-symbols-rounded text-sm">close</span>
              </button>
            </div>
            <div className="p-4 border-b border-slate-100">
              <div className="relative">
                <span className="material-symbols-rounded absolute left-3 top-3 text-slate-400 text-sm">search</span>
                <input
                  type="text"
                  value={groupSearchQuery}
                  onChange={e => setGroupSearchQuery(e.target.value)}
                  placeholder={t('feed.search_tag_placeholder') || 'Search group...'}
                  className="w-full bg-[#f8f9fa] border border-[#e0e4e5] rounded-xl pl-9 pr-4 py-2.5 text-sm font-medium focus:border-[#007AFF] outline-none"
                />
              </div>
            </div>
            <div className="p-4 overflow-y-auto max-h-[50vh] space-y-2">
              {myOwnerGroups
                .filter(g => (g.name || '').toLowerCase().includes(groupSearchQuery.toLowerCase()))
                .map(g => (
                  <div
                    key={g.id}
                    onClick={() => {
                      setSelectedGroupId(g.id);
                      setSelectedGroupName(g.name || '');
                      setShowGroupSelector(false);
                    }}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                      selectedGroupId === g.id
                        ? 'border-[#007AFF] bg-blue-50/50 text-[#007AFF]'
                        : 'border-slate-100 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-lg bg-[#007AFF]/10 font-bold flex items-center justify-center shrink-0">
                      {(g.name || 'G').charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate">{g.name}</p>
                      <p className="text-xs text-slate-400 truncate">{g.description || 'Community Group'}</p>
                    </div>
                    {selectedGroupId === g.id && (
                      <span className="material-symbols-rounded text-[#007AFF] font-bold">check_circle</span>
                    )}
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
}
