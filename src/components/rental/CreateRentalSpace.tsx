'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '@/components/providers/AuthProvider';
import { rentalService } from '@/lib/firebase/rentalService';
import { groupService } from '@/lib/firebase/groupService';
import { plazaService } from '@/lib/firebase/plazaService';
import { storageService } from '@/lib/firebase/storageService';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigation } from '@/components/providers/NavigationProvider';
import { useLocation } from '@/components/providers/LocationProvider';
import { REGIONS } from '@/components/layout/LocationSelector';
import { CITY_COORDINATES } from '@/constants/locations';
import { RentalSpace } from '@/types/rental';
import { Group } from '@/types/group';

interface CreateRentalSpaceProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  spaceToEdit?: RentalSpace;
  initialGroupId?: string;
  initialGroupName?: string;
}

const CURRENCIES = ['KRW', 'USD', 'EUR', 'JPY', 'CNY'];
const MAX_PHOTOS = 20;
const TOTAL_STEPS = 2;

const CATEGORIES = [
  'Dance Studio', 
  'Practice Room', 
  'Party Room', 
  'Gallery & Exhibition', 
  'Performance Hall', 
  'Other Space'
];

const SIZES = [
  'Small (1-10 p) / ~30㎡', 
  'Medium (10-25 p) / ~60㎡', 
  'Large (25-50 p) / ~100㎡', 
  'Extra Large (50+ p) / 100㎡+'
];

export default function CreateRentalSpace({
  isOpen,
  onClose,
  onSuccess,
  spaceToEdit,
  initialGroupId,
  initialGroupName
}: CreateRentalSpaceProps) {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const { setGlobalNavHidden } = useNavigation();
  const { location: userLocation } = useLocation();

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);

  // Form states
  const [title, setTitle] = useState(spaceToEdit ? spaceToEdit.title : '');
  const [studioName, setStudioName] = useState(spaceToEdit ? (spaceToEdit.studioName || '') : '');
  const [category, setCategory] = useState(spaceToEdit ? spaceToEdit.category : CATEGORIES[0]);
  const [region, setRegion] = useState(spaceToEdit ? (spaceToEdit.location || 'SEOUL') : 'SEOUL');
  const [address, setAddress] = useState(spaceToEdit ? spaceToEdit.address : '');
  
  const [pricePerHour, setPricePerHour] = useState(spaceToEdit ? spaceToEdit.pricePerHour.toString() : '');
  const [currency, setCurrency] = useState(spaceToEdit ? (spaceToEdit.currency || 'KRW') : 'KRW');
  const [minHours, setMinHours] = useState(spaceToEdit ? spaceToEdit.minHours.toString() : '1');
  const [capacity, setCapacity] = useState(spaceToEdit ? (spaceToEdit.capacity?.toString() || '') : '');
  const [size, setSize] = useState(spaceToEdit ? (spaceToEdit.size || SIZES[1]) : SIZES[1]);
  const [description, setDescription] = useState(spaceToEdit ? spaceToEdit.description : '');
  const [facilities, setFacilities] = useState<string[]>(spaceToEdit ? (spaceToEdit.facilities || []) : []);
  const [newFacility, setNewFacility] = useState('');
  const [rules, setRules] = useState(spaceToEdit ? (spaceToEdit.rules || '') : '');

  const [existingUrls, setExistingUrls] = useState<string[]>(spaceToEdit ? (spaceToEdit.images || []) : []);
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>(spaceToEdit ? (spaceToEdit.images || []) : []);

  // Group states
  const [selectedGroupId, setSelectedGroupId] = useState(spaceToEdit?.groupId || initialGroupId || '');
  const [selectedGroupName, setSelectedGroupName] = useState(initialGroupName || '');
  const [myOwnerGroups, setMyOwnerGroups] = useState<Group[]>([]);
  const [showGroupSelector, setShowGroupSelector] = useState(false);
  const [groupSearchQuery, setGroupSearchQuery] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentCountry = userLocation?.country || 'KOREA';
  const regions = React.useMemo(() => {
    for (const reg of REGIONS) {
      const match = reg.countries.find(c => c.name.toUpperCase() === currentCountry.toUpperCase());
      if (match) {
        return match.cities.map(ct => ct.name);
      }
    }
    return Object.keys(CITY_COORDINATES);
  }, [currentCountry]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Load user groups for Group selection
  useEffect(() => {
    if (!user) return;

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
    }).catch(err => console.error("Failed to load user groups for rental:", err));
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

  // Back Button Logic
  const handleStep1Back = useCallback(() => {
    const hasContent = Boolean(title.trim() || previewUrls.length > 0 || pricePerHour.trim() || description.trim());
    if (hasContent) {
      if (confirm(t('common.confirm_discard', '작성 중인 내용이 있습니다. 정말 나가시겠습니까?'))) {
        onClose?.();
      }
    } else {
      onClose?.();
    }
  }, [title, previewUrls.length, pricePerHour, description, t, onClose]);

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

    const availableSlots = MAX_PHOTOS - previewUrls.length;
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

  const isStep1Valid = title.trim().length > 0 && Boolean(selectedGroupId);
  const isStep2Valid = pricePerHour.trim().length > 0 && parseInt(pricePerHour, 10) > 0 && previewUrls.length > 0;

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
        for (let i = 0; i < mediaFiles.length; i++) {
          const file = mediaFiles[i];
          const url = await plazaService.uploadMedia(file, (p) => {
            const overall = Math.round(((i * 100) + p) / mediaFiles.length);
            setUploadProgress(overall);
          });
          uploadedUrls.push(url);
        }
      }

      const finalImages = [...existingUrls, ...uploadedUrls];

      const spaceData: Omit<RentalSpace, 'id' | 'createdAt' | 'updatedAt' | 'likesCount'> = {
        groupId: selectedGroupId,
        hostId: user.uid,
        title,
        studioName: studioName || undefined,
        category,
        location: region,
        address,
        pricePerHour: parseInt(pricePerHour, 10) || 0,
        currency,
        minHours: parseInt(minHours, 10) || 1,
        capacity: capacity ? parseInt(capacity, 10) : undefined,
        size,
        facilities,
        rules,
        description,
        images: finalImages,
        regularClasses: spaceToEdit?.regularClasses || []
      };

      if (spaceToEdit?.id) {
        await rentalService.updateSpace(spaceToEdit.id, spaceData);
      } else {
        await rentalService.addSpace(spaceData);
      }

      onSuccess?.();
      onClose();
    } catch (error) {
      console.error("Error saving rental space:", error);
      alert(t('common.save_failed', '저장에 실패했습니다. 다시 시도해 주세요.'));
    } finally {
      setIsSubmitting(false);
      setUploadProgress(null);
    }
  };

  if (!isOpen || !mounted) return null;

  const modalTitle = spaceToEdit
    ? (language === 'KR' ? '대관 공간 수정' : 'Edit Rental Space')
    : (language === 'KR' ? '대관 공간 등록' : 'Register Rental Space');

  const stepCategoryTitle = step === 1
    ? (language === 'KR' ? '공간 기본정보' : 'Space Basic Info')
    : (language === 'KR' ? '요금 및 미디어' : 'Rate & Photos');

  return createPortal(
    <div className="fixed inset-0 z-[100000] bg-[#FAF8FF] text-slate-800 font-body antialiased flex flex-col animate-in fade-in duration-200 notranslate">
      {/* Header */}
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

      {/* Step Indicator Bar */}
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

      {/* Form Content */}
      <main className="flex-1 w-full max-w-2xl mx-auto px-4 py-4 overflow-y-auto pb-28 space-y-6">
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Target Group Selector Card */}
            <div className="border border-[#e0e4e5] rounded-2xl bg-white shadow-sm p-4 space-y-2">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-rounded text-sm text-[#007AFF]">groups</span>
                  <p className="text-[13px] font-bold text-slate-700">
                    {t('rental.target_group', '연동 대관 그룹')} <span className="text-red-500">*</span>
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
                    {selectedGroupName || (myOwnerGroups.length === 0 ? t('rental.no_owned_groups', '소유한 대관 그룹이 없습니다.') : t('rental.select_group', '그룹을 선택하세요.'))}
                  </p>
                  <p className="text-xs text-slate-400 truncate">
                    {selectedGroupId ? `ID: ${selectedGroupId}` : 'Community Rental Space'}
                  </p>
                </div>
                {myOwnerGroups.length > 1 && (
                  <span className="material-symbols-rounded text-slate-400">unfold_more</span>
                )}
              </div>
            </div>

            {/* Basic Info Card */}
            <div className="border border-[#e0e4e5] rounded-2xl bg-white shadow-sm p-4 space-y-4">
              <div className="flex items-center gap-2 border-b border-[#e0e4e5] pb-3 mb-2">
                <span className="material-symbols-rounded text-sm text-[#007AFF]">meeting_room</span>
                <p className="text-[14px] font-bold text-[#007AFF]">
                  {language === 'KR' ? '공간 상세 정보' : 'Space Details'}
                </p>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {language === 'KR' ? '대관 공간 이름' : 'Space Name'} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={language === 'KR' ? '예: 강남 메인 홀 (Studio A)' : 'e.g. Gangnam Main Studio A'}
                  className="w-full bg-[#f8f9fa] border border-[#e0e4e5] rounded-xl px-3.5 py-2.5 text-sm font-medium focus:outline-none focus:border-[#007AFF] text-slate-800"
                />
              </div>

              {/* Studio Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {language === 'KR' ? '스튜디오 / 브랜드 명' : 'Studio / Brand Name'}
                </label>
                <input
                  type="text"
                  value={studioName}
                  onChange={(e) => setStudioName(e.target.value)}
                  placeholder={language === 'KR' ? '예: 루나 댄스 아카데미' : 'e.g. Luna Dance Studio'}
                  className="w-full bg-[#f8f9fa] border border-[#e0e4e5] rounded-xl px-3.5 py-2.5 text-sm font-medium focus:outline-none focus:border-[#007AFF] text-slate-800"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {language === 'KR' ? '공간 유형' : 'Category'}
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-[#f8f9fa] border border-[#e0e4e5] rounded-xl px-3.5 py-2.5 text-sm font-medium focus:outline-none focus:border-[#007AFF] text-slate-800"
                >
                  {CATEGORIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* Region & Address */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {language === 'KR' ? '대표 지역' : 'Region'}
                  </label>
                  <select
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    className="w-full bg-[#f8f9fa] border border-[#e0e4e5] rounded-xl px-3.5 py-2.5 text-sm font-medium focus:outline-none focus:border-[#007AFF] text-slate-800"
                  >
                    {regions.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {language === 'KR' ? '상세 주소 / 위치 안내' : 'Address'}
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder={language === 'KR' ? '예: 서울시 강남구 테헤란로 123 B1' : 'e.g. B1, Teheran-ro 123, Seoul'}
                    className="w-full bg-[#f8f9fa] border border-[#e0e4e5] rounded-xl px-3.5 py-2.5 text-sm font-medium focus:outline-none focus:border-[#007AFF] text-slate-800"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Rates & Specs Card */}
            <div className="border border-[#e0e4e5] rounded-2xl bg-white shadow-sm p-4 space-y-4">
              <div className="flex items-center gap-2 border-b border-[#e0e4e5] pb-3 mb-2">
                <span className="material-symbols-rounded text-sm text-[#007AFF]">payments</span>
                <p className="text-[14px] font-bold text-[#007AFF]">
                  {language === 'KR' ? '대관 요금 및 스펙' : 'Rental Rates & Specs'}
                </p>
              </div>

              {/* Price & Currency */}
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {language === 'KR' ? '시간당 대관료' : 'Hourly Rate'} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={pricePerHour}
                    onChange={handlePriceChange}
                    placeholder="0"
                    className="w-full bg-[#f8f9fa] border border-[#e0e4e5] rounded-xl px-3.5 py-2.5 text-sm font-medium focus:outline-none focus:border-[#007AFF] text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {language === 'KR' ? '통화' : 'Currency'}
                  </label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full bg-[#f8f9fa] border border-[#e0e4e5] rounded-xl px-3.5 py-2.5 text-sm font-medium focus:outline-none focus:border-[#007AFF] text-slate-800"
                  >
                    {CURRENCIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Min Hours & Capacity */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {language === 'KR' ? '최소 대관 시간' : 'Min Hours'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={minHours}
                    onChange={(e) => setMinHours(e.target.value)}
                    className="w-full bg-[#f8f9fa] border border-[#e0e4e5] rounded-xl px-3.5 py-2.5 text-sm font-medium focus:outline-none focus:border-[#007AFF] text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {language === 'KR' ? '권장 수용 인원' : 'Capacity'}
                  </label>
                  <input
                    type="number"
                    value={capacity}
                    onChange={(e) => setCapacity(e.target.value)}
                    placeholder="e.g. 20"
                    className="w-full bg-[#f8f9fa] border border-[#e0e4e5] rounded-xl px-3.5 py-2.5 text-sm font-medium focus:outline-none focus:border-[#007AFF] text-slate-800"
                  />
                </div>
              </div>

              {/* Size */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {language === 'KR' ? '공간 규모' : 'Space Size'}
                </label>
                <select
                  value={size}
                  onChange={(e) => setSize(e.target.value)}
                  className="w-full bg-[#f8f9fa] border border-[#e0e4e5] rounded-xl px-3.5 py-2.5 text-sm font-medium focus:outline-none focus:border-[#007AFF] text-slate-800"
                >
                  {SIZES.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Photos Card */}
            <div className="border border-[#e0e4e5] rounded-2xl bg-white shadow-sm overflow-hidden">
              <div className="bg-[#f8f9fa] px-4 py-3 border-b border-[#e0e4e5] flex items-center gap-2">
                <span className="material-symbols-rounded text-sm text-[#007AFF]">photo_library</span>
                <p className="text-[14px] font-bold text-[#007AFF]">
                  {language === 'KR' ? '공간 대표 사진' : 'Space Photos'} ({previewUrls.length}/{MAX_PHOTOS}) <span className="text-red-500">*</span>
                </p>
              </div>
              <div className="p-4">
                <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 items-center">
                  {previewUrls.length < MAX_PHOTOS && (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="shrink-0 w-24 h-24 rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center hover:border-[#007AFF]/40 hover:bg-[#007AFF]/5 transition-all"
                    >
                      <span className="material-symbols-rounded text-slate-400 mb-1">add_a_photo</span>
                      <span className="text-[10px] font-black text-slate-400 uppercase">ADD</span>
                    </button>
                  )}
                  {previewUrls.map((url, i) => (
                    <div key={i} className="shrink-0 relative w-24 h-24 rounded-2xl overflow-hidden group shadow-sm border border-slate-100">
                      <img src={url} className="w-full h-full object-cover" alt={`Preview ${i}`} />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button
                          type="button"
                          onClick={() => removePhoto(i)}
                          className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center backdrop-blur-md transition-all text-white"
                        >
                          <span className="material-symbols-rounded text-[18px]">delete</span>
                        </button>
                      </div>
                      {i === 0 && (
                        <div className="absolute top-2 left-2 bg-[#007AFF] px-2 py-0.5 rounded text-[8px] font-black text-white uppercase tracking-widest shadow-sm">
                          Main
                        </div>
                      )}
                    </div>
                  ))}
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" multiple onChange={handleFileChange} />
                </div>
              </div>
            </div>

            {/* Facilities & Rules */}
            <div className="border border-[#e0e4e5] rounded-2xl bg-white shadow-sm p-4 space-y-4">
              <div className="flex items-center gap-2 border-b border-[#e0e4e5] pb-3 mb-2">
                <span className="material-symbols-rounded text-sm text-[#007AFF]">grid_view</span>
                <p className="text-[14px] font-bold text-[#007AFF]">
                  {language === 'KR' ? '편의시설 및 사용 규칙' : 'Amenities & Policy'}
                </p>
              </div>

              {/* Facilities */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {language === 'KR' ? '제공 편의시설 태그' : 'Amenities Tags'}
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newFacility}
                    onChange={(e) => setNewFacility(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addFacility(); } }}
                    placeholder={language === 'KR' ? '예: 전면거울, 음향장비, 주차가능' : 'e.g. Mirrors, Sound System'}
                    className="flex-1 bg-[#f8f9fa] border border-[#e0e4e5] rounded-xl px-3.5 py-2 text-sm font-medium focus:outline-none focus:border-[#007AFF] text-slate-800"
                  />
                  <button
                    type="button"
                    onClick={addFacility}
                    className="px-4 py-2 bg-[#007AFF] text-white rounded-xl text-xs font-bold active:scale-95 transition-transform"
                  >
                    + Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {facilities.map(f => (
                    <span key={f} className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 rounded-lg text-xs font-bold text-slate-700">
                      #{f}
                      <button type="button" onClick={() => removeFacility(f)} className="text-slate-400 hover:text-slate-600">×</button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Rules & Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {language === 'KR' ? '이용 규칙 및 주의사항' : 'Space Rules'}
                </label>
                <textarea
                  rows={2}
                  value={rules}
                  onChange={(e) => setRules(e.target.value)}
                  placeholder={language === 'KR' ? '실내 음식물 반입 금지, 퇴실 시 퇴실 청소 필수 등' : 'No outside food, mandatory cleanup before exit...'}
                  className="w-full bg-[#f8f9fa] border border-[#e0e4e5] rounded-xl p-3 text-sm font-medium focus:outline-none focus:border-[#007AFF] text-slate-800 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {language === 'KR' ? '상세 공간 설명' : 'Detailed Description'}
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={language === 'KR' ? '공간의 분위기, 댄스/연습에 특화된 장점 등을 소개하세요.' : 'Describe the space vibe, features, and specs...'}
                  className="w-full bg-[#f8f9fa] border border-[#e0e4e5] rounded-xl p-3 text-sm font-medium focus:outline-none focus:border-[#007AFF] text-slate-800 resize-none"
                />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Group Selector Modal */}
      {showGroupSelector && (
        <div className="fixed inset-0 z-[100020] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-t-2xl sm:rounded-2xl max-h-[80vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-800">
                {t('rental.select_target_group', '연동 대관 그룹 선택')}
              </h2>
              <button
                type="button"
                onClick={() => setShowGroupSelector(false)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500"
              >
                <span className="material-symbols-rounded text-xl">close</span>
              </button>
            </div>
            <div className="p-3 border-b border-slate-100">
              <input
                type="text"
                value={groupSearchQuery}
                onChange={(e) => setGroupSearchQuery(e.target.value)}
                placeholder={t('common.search', '검색')}
                className="w-full bg-slate-100 border-none rounded-xl px-3.5 py-2 text-sm font-medium focus:ring-2 focus:ring-[#007AFF]/20"
              />
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
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
                    className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition-colors ${selectedGroupId === g.id ? 'border-[#007AFF] bg-[#007AFF]/5' : 'border-slate-100 hover:bg-slate-50'}`}
                  >
                    <div className="w-10 h-10 rounded-lg bg-[#007AFF]/10 text-[#007AFF] font-bold flex items-center justify-center shrink-0">
                      {(g.name || 'G').charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-800 truncate">{g.name}</p>
                      <p className="text-xs text-slate-400 truncate">{(g as any).location || 'General Group'}</p>
                    </div>
                    {selectedGroupId === g.id && (
                      <span className="material-symbols-rounded text-[#007AFF]">check_circle</span>
                    )}
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Fixed Bottom Navigation Bar */}
      <footer
        className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-4 flex gap-3 items-center justify-between z-[100010] shadow-lg"
        style={{
          paddingTop: '16px',
          paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 0px))',
          height: 'calc(76px + env(safe-area-inset-bottom, 0px))'
        }}
      >
        {step === 1 ? (
          <button
            type="button"
            onClick={() => setStep(2)}
            disabled={!isStep1Valid}
            className="flex-1 py-3.5 rounded-full bg-[#007AFF] text-white text-sm font-bold active:scale-95 transition-all disabled:opacity-50 shadow-sm"
          >
            {language === 'KR' ? '다음 단계 (2/2)' : 'Next Step (2/2)'}
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || !isStep2Valid}
            className="flex-1 py-3.5 rounded-full bg-[#007AFF] text-white text-sm font-bold active:scale-95 transition-all disabled:opacity-50 shadow-sm"
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>{uploadProgress !== null ? `${t('common.uploading', '업로드 중')} ${uploadProgress}%` : t('common.saving', '저장 중...')}</span>
              </div>
            ) : (
              <span>{spaceToEdit ? t('common.save', '저장하기') : t('common.register', '등록하기')}</span>
            )}
          </button>
        )}
      </footer>
    </div>,
    document.body
  );
}
