'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '@/components/providers/AuthProvider';
import { stayService } from '@/lib/firebase/stayService';
import { groupService } from '@/lib/firebase/groupService';
import { plazaService } from '@/lib/firebase/plazaService';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigation } from '@/components/providers/NavigationProvider';
import { useLocation } from '@/components/providers/LocationProvider';
import { REGIONS } from '@/components/layout/LocationSelector';
import { CITY_COORDINATES } from '@/constants/locations';
import { Stay, StayType } from '@/types/stay';
import { Group } from '@/types/group';

interface CreateStayProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  stayToEdit?: Stay;
  initialGroupId?: string;
  initialGroupName?: string;
}

const CURRENCIES = ['KRW', 'USD', 'EUR', 'JPY', 'CNY'];
const MAX_PHOTOS = 20;
const TOTAL_STEPS = 2;

const STAY_TYPES: StayType[] = ['1-Room', '2-Room', '3-Room', 'Pension', 'Dormitory', 'Couchsurfing'];
const AMENITY_OPTIONS = ['wifi', 'desk', 'coffee', 'studio', 'gym', 'kitchen'];

export default function CreateStay({
  isOpen,
  onClose,
  onSuccess,
  stayToEdit,
  initialGroupId,
  initialGroupName
}: CreateStayProps) {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const { setGlobalNavHidden } = useNavigation();
  const { location: userLocation } = useLocation();

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);

  // Form states
  const [title, setTitle] = useState(stayToEdit ? stayToEdit.title : '');
  const [type, setType] = useState<StayType>(stayToEdit ? stayToEdit.type : '1-Room');
  const [region, setRegion] = useState(stayToEdit ? (stayToEdit.location?.city || 'SEOUL') : 'SEOUL');
  const [addressDetail, setAddressDetail] = useState(stayToEdit ? (stayToEdit.location?.address || '') : '');
  
  const [price, setPrice] = useState(stayToEdit ? (stayToEdit.pricing?.baseRate?.toString() || '') : '');
  const [currency, setCurrency] = useState(stayToEdit ? (stayToEdit.pricing?.currency || 'KRW') : 'KRW');
  const [description, setDescription] = useState(stayToEdit ? (stayToEdit.guides?.facilityGuide || '') : '');
  const [amenities, setAmenities] = useState<string[]>(stayToEdit ? (stayToEdit.amenities || []) : []);

  const [existingUrls, setExistingUrls] = useState<string[]>(stayToEdit ? (stayToEdit.images || []) : []);
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>(stayToEdit ? (stayToEdit.images || []) : []);

  // Group states
  const [selectedGroupId, setSelectedGroupId] = useState(stayToEdit?.groupId || initialGroupId || '');
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

  // Load user groups for Group selection (Default Fallback Group Guard)
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
    }).catch(err => console.error("Failed to load user groups for stay:", err));
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
    const hasContent = Boolean(title.trim() || previewUrls.length > 0 || price.trim() || description.trim());
    if (hasContent) {
      if (confirm(t('common.confirm_discard', '작성 중인 내용이 있습니다. 정말 나가시겠습니까?'))) {
        onClose?.();
      }
    } else {
      onClose?.();
    }
  }, [title, previewUrls.length, price, description, t, onClose]);

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

  const toggleAmenity = (amenity: string) => {
    setAmenities(prev =>
      prev.includes(amenity) ? prev.filter(a => a !== amenity) : [...prev, amenity]
    );
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9]/g, '');
    setPrice(val);
  };

  const isStep1Valid = title.trim().length > 0 && Boolean(selectedGroupId);
  const isStep2Valid = price.trim().length > 0 && parseInt(price, 10) > 0 && previewUrls.length > 0;

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

      const stayData: Partial<Stay> = {
        groupId: selectedGroupId,
        title,
        type,
        location: {
          address: addressDetail,
          city: region,
          district: '',
        },
        pricing: {
          currency,
          baseRate: parseInt(price, 10) || 0,
        },
        images: finalImages,
        checkInTime: stayToEdit?.checkInTime || '15:00',
        checkOutTime: stayToEdit?.checkOutTime || '11:00',
        maxGuests: stayToEdit?.maxGuests || 2,
        doorCode: stayToEdit?.doorCode || '9999',
        host: {
          userId: user.uid,
          name: user.displayName || 'Anonymous',
          photo: user.photoURL || '',
        },
        guides: {
          facilityGuide: description
        },
        amenities,
        isActive: stayToEdit ? stayToEdit.isActive : true,
      };

      if (stayToEdit?.id) {
        await stayService.updateStay(stayToEdit.id, stayData);
      } else {
        await stayService.registerStay({
          ...stayData as Omit<Stay, 'id' | 'createdAt' | 'updatedAt'>,
          isNewlyListed: true,
          payment: {
            methods: [
              { type: 'bank_domestic', enabled: false },
              { type: 'bank_international', enabled: false },
              { type: 'card', enabled: false },
            ],
            transferDeadlineHours: 2,
          }
        });
      }

      onSuccess?.();
      onClose();
    } catch (error) {
      console.error("Error saving stay:", error);
      alert(t('common.save_failed', '저장에 실패했습니다. 다시 시도해 주세요.'));
    } finally {
      setIsSubmitting(false);
      setUploadProgress(null);
    }
  };

  if (!isOpen || !mounted) return null;

  const modalTitle = stayToEdit
    ? (language === 'KR' ? '숙소 정보 수정' : 'Edit Stay')
    : (language === 'KR' ? '숙소 등록' : 'Register Stay');

  const stepCategoryTitle = step === 1
    ? (language === 'KR' ? '숙소 기본정보' : 'Stay Basic Info')
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
                    {t('stay.target_group', '연동 숙소 그룹')} <span className="text-red-500">*</span>
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
                    {selectedGroupName || (myOwnerGroups.length === 0 ? t('stay.no_owned_groups', '소유한 숙소 그룹이 없습니다.') : t('stay.select_group', '그룹을 선택하세요.'))}
                  </p>
                  <p className="text-xs text-slate-400 truncate">
                    {selectedGroupId ? `ID: ${selectedGroupId}` : 'Community Stay'}
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
                <span className="material-symbols-rounded text-sm text-[#007AFF]">house</span>
                <p className="text-[14px] font-bold text-primary">
                  {language === 'KR' ? '숙소 상세 정보' : 'Stay Details'}
                </p>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {language === 'KR' ? '숙소 이름' : 'Stay Title'} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={language === 'KR' ? '예: 탱고 스테이 합정 (Studio 1)' : 'e.g. Tango Stay Hapjeong'}
                  className="w-full bg-[#f8f9fa] border border-[#e0e4e5] rounded-xl px-3.5 py-2.5 text-sm font-bold focus:outline-none focus:border-[#007AFF] text-slate-800 placeholder:text-[#acb3b4] placeholder:font-normal"
                />
              </div>

              {/* Type */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {language === 'KR' ? '숙소 유형' : 'Stay Type'}
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as StayType)}
                  className="w-full bg-[#f8f9fa] border border-[#e0e4e5] rounded-xl px-3.5 py-2.5 text-sm font-bold focus:outline-none focus:border-[#007AFF] text-slate-800"
                >
                  {STAY_TYPES.map(st => (
                    <option key={st} value={st}>{t(`stay.type.${st}`) || st}</option>
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
                    className="w-full bg-[#f8f9fa] border border-[#e0e4e5] rounded-xl px-3.5 py-2.5 text-sm font-bold focus:outline-none focus:border-[#007AFF] text-slate-800"
                  >
                    {regions.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {language === 'KR' ? '상세 주소' : 'Detailed Address'}
                  </label>
                  <input
                    type="text"
                    value={addressDetail}
                    onChange={(e) => setAddressDetail(e.target.value)}
                    placeholder={language === 'KR' ? '예: 서울시 마포구 합정동 396-12' : 'e.g. Hapjeong-dong, Seoul'}
                    className="w-full bg-[#f8f9fa] border border-[#e0e4e5] rounded-xl px-3.5 py-2.5 text-sm font-bold focus:outline-none focus:border-[#007AFF] text-slate-800 placeholder:text-[#acb3b4] placeholder:font-normal"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Rates Card */}
            <div className="border border-[#e0e4e5] rounded-2xl bg-white shadow-sm p-4 space-y-4">
              <div className="flex items-center gap-2 border-b border-[#e0e4e5] pb-3 mb-2">
                <span className="material-symbols-rounded text-sm text-[#007AFF]">payments</span>
                <p className="text-[14px] font-bold text-primary">
                  {language === 'KR' ? '숙박 요금' : 'Rates'}
                </p>
              </div>

              {/* Price & Currency */}
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {language === 'KR' ? '1박당 기본 요금' : 'Base Rate (per night)'} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={price}
                    onChange={handlePriceChange}
                    placeholder="0"
                    className="w-full bg-[#f8f9fa] border border-[#e0e4e5] rounded-xl px-3.5 py-2.5 text-sm font-bold focus:outline-none focus:border-[#007AFF] text-slate-800 placeholder:text-[#acb3b4] placeholder:font-normal"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {language === 'KR' ? '통화' : 'Currency'}
                  </label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full bg-[#f8f9fa] border border-[#e0e4e5] rounded-xl px-3.5 py-2.5 text-sm font-bold focus:outline-none focus:border-[#007AFF] text-slate-800"
                  >
                    {CURRENCIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Photos Card */}
            <div className="border border-[#e0e4e5] rounded-2xl bg-white shadow-sm overflow-hidden">
              <div className="bg-[#f8f9fa] px-4 py-3 border-b border-[#e0e4e5] flex items-center gap-2">
                <span className="material-symbols-rounded text-sm text-[#007AFF]">photo_library</span>
                <p className="text-[14px] font-bold text-primary">
                  {language === 'KR' ? '숙소 사진' : 'Stay Photos'} ({previewUrls.length}/{MAX_PHOTOS}) <span className="text-red-500">*</span>
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

            {/* Amenities & Description */}
            <div className="border border-[#e0e4e5] rounded-2xl bg-white shadow-sm p-4 space-y-4">
              <div className="flex items-center gap-2 border-b border-[#e0e4e5] pb-3 mb-2">
                <span className="material-symbols-rounded text-sm text-[#007AFF]">king_bed</span>
                <p className="text-[14px] font-bold text-primary">
                  {language === 'KR' ? '편의시설 및 안내' : 'Amenities & Guide'}
                </p>
              </div>

              {/* Amenities */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {language === 'KR' ? '제공 편의시설' : 'Amenities'}
                </label>
                <div className="flex flex-wrap gap-2">
                  {AMENITY_OPTIONS.map(opt => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => toggleAmenity(opt)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border ${
                        amenities.includes(opt)
                          ? 'bg-[#007AFF] text-white border-[#007AFF] shadow-sm'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <span className="material-symbols-rounded text-[16px]">{opt}</span>
                      {t(`stay.amenity.${opt}`) || opt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {language === 'KR' ? '상세 숙소 소개' : 'Description'}
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={language === 'KR' ? '숙소의 특징, 주변 환경 및 이용 안내를 적어주세요.' : 'Describe stay features and guide...'}
                  className="w-full bg-[#f8f9fa] border border-[#e0e4e5] rounded-xl p-3 text-sm font-bold focus:outline-none focus:border-[#007AFF] text-slate-800 resize-none placeholder:text-[#acb3b4] placeholder:font-normal"
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
                {t('stay.select_target_group', '연동 숙소 그룹 선택')}
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
                className="w-full bg-slate-100 border-none rounded-xl px-3.5 py-2 text-sm font-bold focus:ring-2 focus:ring-[#007AFF]/20 placeholder:text-[#acb3b4] placeholder:font-normal"
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
          <div className="flex w-full gap-3">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="flex-grow py-3.5 rounded-full border border-slate-200 text-slate-700 text-sm font-bold active:scale-95 transition-transform"
            >
              {language === 'KR' ? '이전 단계' : 'Previous'}
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || !isStep2Valid}
              className="flex-grow py-3.5 rounded-full bg-[#007AFF] text-white text-sm font-bold active:scale-95 transition-all disabled:opacity-50 shadow-sm"
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>{uploadProgress !== null ? `${t('common.uploading', '업로드 중')} ${uploadProgress}%` : t('common.saving', '저장 중...')}</span>
                </div>
              ) : (
                <span>{stayToEdit ? (language === 'KR' ? '저장' : 'Save') : (language === 'KR' ? '등록' : 'Register')}</span>
              )}
            </button>
          </div>
        )}
      </footer>
    </div>,
    document.body
  );
}
