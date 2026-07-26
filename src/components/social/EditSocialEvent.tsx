'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { useLocation } from '@/components/providers/LocationProvider';
import { socialService } from '@/lib/firebase/socialService';
import { venueService } from '@/lib/firebase/venueService';
import { userService } from '@/lib/firebase/userService';
import { storageService } from '@/lib/firebase/storageService';
import { Social, SocialType } from '@/types/social';
import { Venue } from '@/types/venue';
import { PlatformUser } from '@/types/user';
import { useLanguage } from '@/contexts/LanguageContext';
import { isVideoUrl } from '@/lib/utils/socialUtils';
import { Capacitor } from '@capacitor/core';
import { StandardImageUploader } from '@/components/common/StandardImageUploader';
import { StandardVideoUploader } from '@/components/common/StandardVideoUploader';

interface EditSocialEventProps {
  onClose: () => void;
  onSuccess?: (id?: string) => void;
  socialData?: Social;
}

export default function EditSocialEvent({ onClose, onSuccess, socialData }: EditSocialEventProps) {
  const { t, language } = useLanguage();
  const router = useRouter();
  const { user } = useAuth();
  const { location, openSelectorWithCallback } = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  // Form State
  const [title, setTitle] = useState(socialData?.title || '');
  const [titleNative, setTitleNative] = useState(socialData?.titleNative || '');
  const [description, setDescription] = useState((socialData as any)?.description || '');
  const [titleError, setTitleError] = useState('');
  const [type, setType] = useState<SocialType>(socialData?.type || 'regular');
  const [subCategory, setSubCategory] = useState<'milonga' | 'practica'>(
    (socialData as any)?.subCategory || 'milonga'
  );
  
  // Date & Time
  const [startDate, setStartDate] = useState(
    socialData?.date 
      ? (typeof (socialData.date as any).toDate === 'function' ? (socialData.date as any).toDate().toISOString().split('T')[0] : new Date(socialData.date as any).toISOString().split('T')[0])
      : new Date().toISOString().split('T')[0]
  );
  const [startTime, setStartTime] = useState(socialData?.startTime || '19:00');
  const [endTime, setEndTime] = useState(socialData?.endTime || '23:00');
  const [dayOfWeek, setDayOfWeek] = useState<number>(socialData?.dayOfWeek ?? new Date().getDay());
  const [recurrence, setRecurrence] = useState(socialData?.recurrence || 'every');

  const handleRecurrenceToggle = (id: string) => {
    if (id === 'every') {
      setRecurrence('every');
      return;
    }
    const currentParts = recurrence.split(',').map(x => x.trim()).filter(x => x !== 'every' && x !== '');
    let newParts: string[] = [];
    if (currentParts.includes(id)) {
      newParts = currentParts.filter(x => x !== id);
    } else {
      newParts = [...currentParts, id];
    }
    if (newParts.length === 0) {
      setRecurrence('every');
    } else {
      const order = ['1st', '2nd', '3rd', '4th', '5th', 'last'];
      newParts.sort((a, b) => order.indexOf(a) - order.indexOf(b));
      setRecurrence(newParts.join(','));
    }
  };


  const getAvailableRecurrences = () => {
    const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
    const dayNamesEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const curDay = dayOfWeek !== undefined ? dayNames[dayOfWeek] : '';
    const curDayEn = dayOfWeek !== undefined ? dayNamesEn[dayOfWeek] : '';

    if (language === 'KR') {
      return [
        { id: 'every', label: curDay ? `매주(${curDay})` : t('social.every_week') },
        { id: '1st', label: curDay ? `1주(${curDay})` : '1주' },
        { id: '2nd', label: curDay ? `2주(${curDay})` : '2주' },
        { id: '3rd', label: curDay ? `3주(${curDay})` : '3주' },
        { id: '4th', label: curDay ? `4주(${curDay})` : '4주' },
        { id: '5th', label: curDay ? `5주(${curDay})` : '5주' },
      ];
    }

    return [
      { id: 'every', label: curDayEn ? `Every (${curDayEn})` : t('social.every_week') },
      { id: '1st', label: curDayEn ? `1st Wk (${curDayEn})` : '1st Week' },
      { id: '2nd', label: curDayEn ? `2nd Wk (${curDayEn})` : '2nd Week' },
      { id: '3rd', label: curDayEn ? `3rd Wk (${curDayEn})` : '3rd Week' },
      { id: '4th', label: curDayEn ? `4th Wk (${curDayEn})` : '4th Week' },
      { id: '5th', label: curDayEn ? `5th Wk (${curDayEn})` : '5th Week' },
    ];
  };

  // Location State
  const [formCountry, setFormCountry] = useState(socialData?.country || location.country);
  const [formCity, setFormCity] = useState(socialData?.city || location.city);

  // Venue State
  const [allVenues, setAllVenues] = useState<Venue[]>([]);
  const [venueName, setVenueName] = useState(socialData?.venueName || '');
  const [venueId, setVenueId] = useState(socialData?.venueId || '');
  const [venueResults, setVenueResults] = useState<Venue[]>([]);
  const [showVenueResults, setShowVenueResults] = useState(false);

  // Users Data
  const [allUsers, setAllUsers] = useState<PlatformUser[]>([]);

  // Organizer State (복수 선택)
  const getInitialOrganizers = () => {
    if (socialData?.organizerIds && socialData.organizerIds.length > 0) {
      return socialData.organizerIds.map((id, i) => ({
        id,
        name: socialData.organizerNames?.[i] || '',
        nativeName: socialData.organizerNativeNames?.[i] || '',
      }));
    }
    if (socialData?.organizerId) {
      return [{ id: socialData.organizerId, name: socialData.organizerName || '', nativeName: socialData.organizerNameNative || '' }];
    }
    return [];
  };
  const [organizerList, setOrganizerList] = useState<{ id: string; name: string; nativeName: string }[]>(getInitialOrganizers());
  const [organizerSearch, setOrganizerSearch] = useState('');
  const [organizerResults, setOrganizerResults] = useState<PlatformUser[]>([]);
  const [showOrganizerResults, setShowOrganizerResults] = useState(false);

  // DJ State
  const getInitialDjName = () => {
    if (!socialData) return '';
    if (socialData.type === 'regular' && socialData.djs && Array.isArray(socialData.djs) && socialData.djs.length > 0) {
      const today = new Date();
      const targetDay = Number(socialData.dayOfWeek ?? today.getDay());
      const d = new Date();
      const diff = (targetDay - d.getDay() + 7) % 7;
      d.setDate(d.getDate() + diff);
      const pad = (n: number) => n.toString().padStart(2, '0');
      const targetDateStr = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
      
      const matched = socialData.djs.find(dj => dj && dj.date === targetDateStr);
      if (matched && matched.djName) {
        return matched.djName;
      }
    }
    return socialData.djName || '';
  };

  const [djName, setDjName] = useState(getInitialDjName());
  const [djResults, setDjResults] = useState<PlatformUser[]>([]);
  const [showDjResults, setShowDjResults] = useState(false);

  // Staff State
  const [staffList, setStaffList] = useState<{ id: string; name: string }[]>(
    socialData?.staffIds?.map((id, i) => ({ id, name: socialData?.staffNames?.[i] || '' })) || []
  );
  const [staffSearch, setStaffSearch] = useState('');
  const [staffResults, setStaffResults] = useState<PlatformUser[]>([]);
  const [showStaffResults, setShowStaffResults] = useState(false);

  // Table Capacity & Dress Code
  const [tableCapacity, setTableCapacity] = useState(socialData?.tableCapacity ?? 15);
  const [dressCode, setDressCode] = useState((socialData as any)?.dressCode || '');
  
  // Pricing
  const initialCurrency = socialData?.price?.split(' ')[0] || 'KRW';
  const initialPriceAmount = socialData?.price?.split(' ')[1] || '0';
  const [currency, setCurrency] = useState(initialCurrency);
  const [priceAmount, setPriceAmount] = useState(initialPriceAmount);

  // Gallery & Media
  const [images, setImages] = useState<string[]>(socialData?.imageUrl ? [socialData.imageUrl] : []);
  const [mediaTab, setMediaTab] = useState<'image' | 'video'>(socialData?.imageUrl && isVideoUrl(socialData.imageUrl) ? 'video' : 'image');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Moments Gallery
  const [moments, setMoments] = useState<string[]>(socialData?.moments || []);
  const [momentFiles, setMomentFiles] = useState<(File | null)[]>(new Array(socialData?.moments?.length || 0).fill(null));
  const momentInputRef = useRef<HTMLInputElement>(null);

  // Social Events (Sub-programs)
  const [socialEvents, setSocialEvents] = useState<{ id: number; title: string; description: string; maxParticipants: number; isUnlimited?: boolean }[]>(
    socialData?.socialEvents?.map((ev: any, i: number) => {
      const isUnlimited = ev.maxParticipants === 0 || ev.maxParticipants === undefined;
      if (typeof ev === 'string') return { id: Date.now() + i, title: ev, description: '', maxParticipants: 0, isUnlimited: true };
      return { id: Date.now() + i, title: ev.title || '', description: ev.description || '', maxParticipants: ev.maxParticipants || 1, isUnlimited };
    }) || []
  );

  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const dayIndices = [1, 2, 3, 4, 5, 6, 0];

  useEffect(() => {
    venueService.getVenues().then(setAllVenues).catch(console.error);
    userService.getAllUsers().then(setAllUsers).catch(console.error);
  }, []);

  // allUsers 로드 후 anonymous 주최자 보정 (manual_ prefix는 비회원이므로 제외)
  useEffect(() => {
    if (allUsers.length === 0 || organizerList.length === 0) return;
    const updated = organizerList.map(o => {
      if (o.id.startsWith('manual_')) return o; // 비회원 주최자 건너뛰기
      const matched = allUsers.find(u => u.id === o.id);
      if (matched && (!o.name || o.name === t('social.anonymous'))) {
        return { ...o, name: matched.nickname || o.name, nativeName: matched.nativeNickname || o.nativeName };
      }
      return o;
    });
    const changed = updated.some((u, i) => u.name !== organizerList[i].name || u.nativeName !== organizerList[i].nativeName);
    if (changed) setOrganizerList(updated);
  }, [allUsers]);



  const handleStartTimeChange = (val: string) => {
    setStartTime(val);
    if (val) {
      const [h, m] = val.split(':');
      const endH = (parseInt(h, 10) + 4) % 24;
      setEndTime(`${endH.toString().padStart(2, '0')}:${m}`);
    }
  };

  const handleVenueSearch = (val: string) => {
    setVenueName(val);
    setVenueId('');
    if (val.length >= 1) {
      const lower = val.toLowerCase();
      const filtered = allVenues.filter(v =>
        v.name?.toLowerCase().includes(lower) ||
        v.nameKo?.includes(val)
      );
      setVenueResults(filtered.slice(0, 6));
      setShowVenueResults(filtered.length > 0);
    } else {
      setShowVenueResults(false);
      setVenueResults([]);
    }
  };

  const handleSelectVenue = (v: Venue) => {
    setVenueName(v.name);
    setVenueId(v.id || '');
    setShowVenueResults(false);
    if (v.country) setFormCountry(v.country);
    if (v.city) setFormCity(v.city);
  };

  const handleOrganizerSearch = (val: string) => {
    setOrganizerSearch(val);
    if (val.length >= 1) {
      const lower = val.toLowerCase();
      const filtered = allUsers.filter(u =>
        !organizerList.find(o => o.id === u.id) &&
        ((u.nickname && u.nickname.toLowerCase().includes(lower)) ||
        (u.nativeNickname && u.nativeNickname.includes(val)))
      );
      setOrganizerResults(filtered.slice(0, 6));
      setShowOrganizerResults(filtered.length > 0);
    } else {
      setShowOrganizerResults(false);
      setOrganizerResults([]);
    }
  };

  const handleSelectOrganizer = (u: PlatformUser) => {
    setOrganizerList([...organizerList, { id: u.id, name: u.nickname || t('social.anonymous'), nativeName: u.nativeNickname || '' }]);
    setOrganizerSearch('');
    setShowOrganizerResults(false);
  };

  // 비회원 주최자 직접 추가 (텍스트 입력)
  const handleAddFreeTextOrganizer = () => {
    const text = organizerSearch.trim();
    if (!text) return;
    if (organizerList.find(o => o.name === text)) return; // 중복 방지
    setOrganizerList([...organizerList, { id: `manual_${Date.now()}`, name: text, nativeName: '' }]);
    setOrganizerSearch('');
    setShowOrganizerResults(false);
  };

  const handleDjSearch = (val: string) => {
    setDjName(val);
    if (val.length >= 1) {
      const lower = val.toLowerCase();
      const filtered = allUsers.filter(u =>
        (u.nickname && u.nickname.toLowerCase().includes(lower)) ||
        (u.nativeNickname && u.nativeNickname.includes(val))
      );
      setDjResults(filtered.slice(0, 6));
      setShowDjResults(filtered.length > 0);
    } else {
      setShowDjResults(false);
      setDjResults([]);
    }
  };

  const handleSelectDj = (u: PlatformUser) => {
    setDjName(u.nickname || '');
    setShowDjResults(false);
  };

  const handleTitleChange = (val: string) => {
    const isEnglishOnly = /^[a-zA-Z0-9\s\-_'"()&.,!?]*$/.test(val);
    if (!isEnglishOnly && val !== '') {
      setTitleError(t('social.alert_english_only'));
    } else {
      setTitleError('');
      setTitle(val);
    }
  };

  const handleSave = async () => {
    if (!user || !title) return;
    setIsSubmitting(true);
    try {
      let finalImageUrl = images[0] || '';
      if (imageFile) {
        const path = `socials/${Date.now()}_${imageFile.name}`;
        finalImageUrl = await storageService.uploadFile(imageFile, path);
      }

      // Handle Moments Upload
      const finalMoments: string[] = [];
      for (let i = 0; i < moments.length; i++) {
        if (momentFiles[i]) {
          const path = `socials/moments/${Date.now()}_${i}_${momentFiles[i]!.name}`;
          const url = await storageService.uploadFile(momentFiles[i]!, path);
          finalMoments.push(url);
        } else if (moments[i].startsWith('http')) {
          finalMoments.push(moments[i]);
        }
      }

      const finalData: any = {
        title: title || '',
        titleNative: titleNative || '',
        description: description || '',
        type: type || 'regular',
        organizerId: organizerList[0]?.id || '',
        organizerName: organizerList[0]?.name || '',
        organizerNameNative: organizerList[0]?.nativeName || '',
        organizerIds: organizerList.map(o => o.id),
        organizerNames: organizerList.map(o => o.name),
        organizerNativeNames: organizerList.map(o => o.nativeName),
        venueId: venueId || '',
        venueName: venueName || '',
        country: formCountry || '',
        city: formCity || '',
        imageUrl: finalImageUrl || '',
        moments: finalMoments,
        startTime: startTime || '',
        endTime: endTime || '',
        djName: subCategory === 'practica' ? '' : djName || '',
        dressCode: subCategory === 'practica' ? '' : dressCode || '',
        subCategory: subCategory,
        price: `${currency} ${priceAmount}`,
        socialEvents: socialEvents.filter(e => e.title.trim() !== '').map(e => ({ id: String(e.id), title: e.title, description: e.description, maxParticipants: e.isUnlimited ? 0 : (e.maxParticipants || 1) })),
        staffIds: staffList.map(s => s.id),
        staffNames: staffList.map(s => s.name),
        tableCapacity: tableCapacity || 0,
      };

      // 기존 djs 배열 보존 (배치 에이전트가 등록한 DJ 라인업 유실 방지)
      if (socialData?.djs && Array.isArray(socialData.djs)) {
        finalData.djs = socialData.djs;
      }

      if (type === 'regular') {
        finalData.dayOfWeek = dayOfWeek;
        finalData.recurrence = recurrence;
        if (startDate) {
          finalData.date = new Date(startDate);
        }
      } else {
        finalData.dayOfWeek = null;
        finalData.recurrence = null;
        if (startDate) {
          finalData.date = new Date(startDate);
        }
      }

      let newId: string | undefined;
      if (socialData?.id) {
        await socialService.updateSocial(socialData.id, finalData);
        newId = socialData.id;
        onSuccess?.(newId);
        onClose();
      } else {
        newId = await socialService.saveSocial(finalData);
        onSuccess?.(newId);
        router.replace('/create-success?type=social&id=' + newId);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!socialData?.id) return;
    if (!confirm(t('social.alert_delete_confirm'))) return;
    try {
      await socialService.deleteSocial(socialData.id);
      onSuccess?.();
      onClose();
    } catch (e) {
      console.error(e);
    }
  };

  const handleCloseAttempt = () => {
    const hasChanges = title.trim() !== '' || description.trim() !== '' || priceAmount !== '';
    if (hasChanges) {
      if (confirm(t('social.alert_discard_changes'))) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-white overflow-y-auto animate-in fade-in duration-300" style={{ zIndex: 100000, paddingTop: Capacitor.isNativePlatform() ? 'calc(56px + env(safe-area-inset-top))' : '56px' }}>
      <style dangerouslySetInnerHTML={{ __html: `.material-symbols-rounded { font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24; }` }} />

      {/* Header */}
      <header 
        className="fixed top-0 left-0 w-full flex-shrink-0 bg-white border-b border-slate-100 px-4 flex items-center justify-between z-50" 
        style={{ 
          zIndex: 100010,
          paddingTop: Capacitor.isNativePlatform() ? 'env(safe-area-inset-top)' : '0px',
          height: Capacitor.isNativePlatform() ? 'calc(56px + env(safe-area-inset-top))' : '56px'
        }}
      >
        <button type="button" onClick={handleCloseAttempt} className="w-10 h-10 flex items-center justify-center -ml-2 active:scale-95 transition-transform text-slate-700">
          <span className="material-symbols-rounded text-2xl">arrow_back</span>
        </button>
        <h1 className="text-[16px] font-bold text-slate-800">{socialData ? (t('social.edit_social') || '소셜 수정') : (t('social.create_social') || '새 소셜')}</h1>
        <div className="flex items-center gap-2">
          {socialData && (
            <button onClick={handleDelete} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-red-50 text-red-500 transition-colors">
              <span className="material-symbols-rounded">delete</span>
            </button>
          )}
        </div>
      </header>

      {/* Step Indicator Bar */}
      <div className="max-w-2xl mx-auto px-4 mt-3">
        <div className="flex items-center justify-between border border-slate-100 bg-slate-50/80 backdrop-blur rounded-2xl px-4 py-3 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-slate-700">
              {language === 'KR' ? `${currentStep} / 4 단계` : `Step ${currentStep} of 4`}
            </span>
            <span className="text-xs font-bold text-[#007AFF] bg-[#007AFF]/10 px-2.5 py-0.5 rounded-full">
              {currentStep === 1 && (language === 'KR' ? '유형 및 분류 선택' : 'Category & Type')}
              {currentStep === 2 && (language === 'KR' ? '포스터 & 기본 정보' : 'Poster & Info')}
              {currentStep === 3 && (language === 'KR' ? '일정, 장소 & 입장료' : 'Schedule, Venue & Pricing')}
              {currentStep === 4 && (language === 'KR' ? '주최, 스태프 & 세션 설정' : 'Host, Staff & Sub-events')}
            </span>
          </div>
          <div className="w-20 h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div className="h-full bg-[#007AFF] transition-all duration-300" style={{ width: `${(currentStep / 4) * 100}%` }} />
          </div>
        </div>
      </div>

      <main className="pt-4 pb-36 max-w-2xl mx-auto px-4 space-y-5">
        
        {currentStep === 1 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* 기본 분류 선택 */}
            <div className="border border-[#e0e4e5] rounded-2xl bg-white p-5 space-y-4">
              <label className="block text-[15px] font-black text-slate-700 mb-2">
                {t('social.select_sub_category', '기본 분류를 선택해주세요')}
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setSubCategory('milonga')}
                  className={`flex flex-col items-center justify-center py-8 px-4 rounded-2xl border-2 transition-all active:scale-95 ${
                    subCategory === 'milonga'
                      ? 'border-[#007AFF] bg-[#007AFF]/5 text-[#007AFF] shadow-sm'
                      : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                  }`}
                >
                  <span className="material-symbols-rounded text-4xl mb-3">music_note</span>
                  <span className="text-[16px] font-black">{t('social.milonga')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSubCategory('practica')}
                  className={`flex flex-col items-center justify-center py-8 px-4 rounded-2xl border-2 transition-all active:scale-95 ${
                    subCategory === 'practica'
                      ? 'border-[#007AFF] bg-[#007AFF]/5 text-[#007AFF] shadow-sm'
                      : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                  }`}
                >
                  <span className="material-symbols-rounded text-4xl mb-3">self_improvement</span>
                  <span className="text-[16px] font-black">{t('social.practica')}</span>
                </button>
              </div>
            </div>

            {/* 이벤트 유형 선택 */}
            <div className="border border-[#e0e4e5] rounded-2xl bg-white p-5 space-y-4">
              <label className="block text-[15px] font-black text-slate-700 mb-2">
                {t('social.select_event_type', '이벤트 유형을 선택해주세요')}
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setType('regular')}
                  className={`flex flex-col items-center justify-center py-8 px-4 rounded-2xl border-2 transition-all active:scale-95 ${
                    type === 'regular'
                      ? 'border-[#007AFF] bg-[#007AFF]/5 text-[#007AFF] shadow-sm'
                      : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                  }`}
                >
                  <span className="material-symbols-rounded text-4xl mb-3">event_repeat</span>
                  <span className="text-[16px] font-black">{t('social.type_regular')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setType('popup')}
                  className={`flex flex-col items-center justify-center py-8 px-4 rounded-2xl border-2 transition-all active:scale-95 ${
                    type === 'popup'
                      ? 'border-[#007AFF] bg-[#007AFF]/5 text-[#007AFF] shadow-sm'
                      : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                  }`}
                >
                  <span className="material-symbols-rounded text-4xl mb-3">bolt</span>
                  <span className="text-[16px] font-black">{t('social.type_popup')}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-5 animate-in fade-in duration-200">
            {/* 2. Gallery & Media Section (Poster or 15s Video) */}
            <div className="border border-[#e0e4e5] rounded-2xl bg-white">
              <div className="bg-[#f8f9fa] px-4 py-3 border-b border-[#e0e4e5] flex items-center justify-between rounded-t-[15px]">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-rounded text-sm text-primary">perm_media</span>
                  <p className="text-[14px] font-bold text-primary">{t('social.poster_gallery') || '메인 미디어 (포스터 / 동영상)'}</p>
                </div>
                {/* 포스터 / 비디오 세그먼트 탭 스위치 */}
                <div className="flex items-center gap-1 bg-slate-200/80 p-0.5 rounded-xl text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setMediaTab('image')}
                    className={`px-3 py-1 rounded-lg transition-all ${mediaTab === 'image' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    📷 {t('social.upload_poster') || '포스터'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setMediaTab('video')}
                    className={`px-3 py-1 rounded-lg transition-all ${mediaTab === 'video' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    🎬 {t('social.promo_video') || '15초 동영상'}
                  </button>
                </div>
              </div>

              <div className="p-4 space-y-4">
                <div className="max-w-[240px] mx-auto space-y-4">
                  {mediaTab === 'image' ? (
                    <StandardImageUploader
                      mode="single"
                      aspectRatio="4/5"
                      storageFolderPath="socials"
                      value={images.find(u => !isVideoUrl(u)) || ''}
                      onChange={(url) => {
                        if (typeof url === 'string') {
                          setImages([url]);
                        }
                      }}
                      label={t('social.upload_poster') || '메인 포스터 이미지'}
                      placeholder={t('social.upload_poster') || '메인 포스터 업로드'}
                    />
                  ) : (
                    <StandardVideoUploader
                      maxDurationSeconds={15}
                      maxSizeMB={50}
                      aspectRatio="4/5"
                      storageFolderPath="socials/videos"
                      value={images.find(u => isVideoUrl(u)) || ''}
                      onChange={(videoUrl) => {
                        if (videoUrl) {
                          setImages([videoUrl]);
                        }
                      }}
                      label={t('social.promo_video', '15초 홍보 숏폼 비디오')}
                      placeholder={t('social.upload_video_15s', '15초 이하 동영상 업로드')}
                    />
                  )}
                </div>
                <p className="text-center text-xs font-bold text-[#acb3b4]">
                  {mediaTab === 'image' 
                    ? (t('social.optimal_ratio_desc') || '4:5 비율 포스터 권장') 
                    : '15초 이하 숏폼 동영상 선택 시 모바일 무한 반복 자동재생 적용'}
                </p>
              </div>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*,video/*" className="hidden" onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) {
                if (f.type.startsWith('video/')) {
                  const video = document.createElement('video');
                  video.preload = 'metadata';
                  video.onloadedmetadata = () => {
                     window.URL.revokeObjectURL(video.src);
                    if (video.duration > 15) {
                      alert(t('social.alert_video_too_long'));
                      e.target.value = '';
                      return;
                    }
                    setImages([URL.createObjectURL(f)]);
                    setImageFile(f);
                  };
                  video.src = URL.createObjectURL(f);
                } else {
                  setImages([URL.createObjectURL(f)]);
                  setImageFile(f);
                }
              }
            }} />
            {/* 2. Basic Info Section */}
            <div className="border border-[#e0e4e5] rounded-2xl bg-white">
              <div className="bg-[#f8f9fa] px-4 py-3 border-b border-[#e0e4e5] flex items-center gap-2 rounded-t-[15px]">
                <span className="material-symbols-rounded text-sm text-primary">info</span>
                <p className="text-[14px] font-bold text-primary">{t('social.basic_info')}</p>
              </div>
              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">{t('social.event_title_en')}</label>
                  <div className={`flex items-center px-4 py-3 border rounded-xl bg-[#f8f9fa] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#007AFF]/20 transition-all ${titleError ? 'border-red-300 ring-2 ring-red-100' : 'border-[#e0e4e5]'}`}>
                    <input value={title} onChange={(e) => handleTitleChange(e.target.value)}
                      className="flex-1 bg-transparent border-none p-0 focus:ring-0 text-sm font-bold text-[#2d3435] placeholder:text-[#acb3b4] placeholder:font-normal outline-none"
                      placeholder="e.g. Milonga El Bulin" type="text" />
                  </div>
                  {titleError && <p className="text-xs font-bold text-red-500 mt-1 ml-1">{titleError}</p>}
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">{t('social.title_native')}</label>
                  <div className="flex items-center px-4 py-3 border border-[#e0e4e5] rounded-xl bg-[#f8f9fa] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#007AFF]/20 transition-all">
                    <input value={titleNative} onChange={(e) => setTitleNative(e.target.value)}
                      className="flex-1 bg-transparent border-none p-0 focus:ring-0 text-sm font-bold text-[#2d3435] placeholder:text-[#acb3b4] placeholder:font-normal outline-none"
                      placeholder={t('social.title_native_placeholder', 'e.g. Milonga El Bulin')} type="text" />
                  </div>
                </div>
     
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">{t('social.description_optional')}</label>
                  <div className="flex px-4 py-3 border border-[#e0e4e5] rounded-xl bg-[#f8f9fa] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#007AFF]/20 transition-all">
                    <textarea value={description} onChange={(e) => setDescription(e.target.value)}
                      className="flex-1 bg-transparent border-none p-0 focus:ring-0 text-sm font-bold text-[#2d3435] placeholder:text-[#acb3b4] placeholder:font-normal outline-none min-h-[80px] resize-none"
                      placeholder={t('social.description_placeholder')} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-5 animate-in fade-in duration-200">
            {/* 3. Date & Time Section */}
        <div className="border border-[#e0e4e5] rounded-2xl bg-white">
          <div className="bg-[#f8f9fa] px-4 py-3 border-b border-[#e0e4e5] flex items-center gap-2 rounded-t-[15px]">
            <span className="material-symbols-rounded text-sm text-primary">schedule</span>
            <p className="text-[14px] font-bold text-primary">{t('social.date_time')}</p>
          </div>
          <div className="p-4 space-y-5">
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">{type === 'regular' ? t('social.start_date') : t('social.date')}</label>
                <div className="flex items-center px-4 py-3 border border-[#e0e4e5] rounded-xl bg-[#f8f9fa] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#007AFF]/20 transition-all">
                  <input value={startDate} onChange={(e) => {
                    const val = e.target.value;
                    setStartDate(val);
                    if (val) {
                      const d = new Date(val);
                      if (!isNaN(d.getTime())) {
                        setDayOfWeek(d.getDay());
                      }
                    }
                  }}
                  className="flex-1 bg-transparent border-none p-0 focus:ring-0 text-sm font-bold text-[#2d3435] outline-none" type="date" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">{t('social.time_interval')}</label>
                <div className="flex items-center justify-between px-3 py-3 border border-[#e0e4e5] rounded-xl bg-[#f8f9fa] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#007AFF]/20 transition-all">
                  <input value={startTime} onChange={(e) => handleStartTimeChange(e.target.value)} 
                    className="w-full bg-transparent border-none p-0 focus:ring-0 text-sm font-bold text-[#2d3435] text-center outline-none" type="time" />
                  <span className="text-[#acb3b4] font-medium text-xs px-4">-</span>
                  <input value={endTime} onChange={(e) => setEndTime(e.target.value)} 
                    className="w-full bg-transparent border-none p-0 focus:ring-0 text-sm font-bold text-[#2d3435] text-center outline-none" type="time" />
                </div>
              </div>
            </div>
 
            <div className={`transition-opacity ${type === 'regular' ? 'opacity-100' : 'hidden'}`}>
              <label className="block text-xs font-bold text-slate-700 mb-2">{t('social.frequency')}</label>
              <div className="flex flex-wrap gap-2">
                {getAvailableRecurrences().map(r => {
                  const isActive = r.id === 'every' 
                    ? (recurrence === 'every' || recurrence === '')
                    : recurrence.split(',').map(x => x.trim()).includes(r.id);
                  return (
                    <button key={r.id} onClick={() => handleRecurrenceToggle(r.id)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${isActive ? 'bg-primary text-white border-primary shadow-sm' : 'bg-[#f8f9fa] text-[#acb3b4] border-[#e0e4e5] hover:border-primary/50'}`}>
                      {r.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* 4. Location Section */}
        <div className="relative z-40 border border-[#e0e4e5] rounded-2xl bg-white">
          <div className="bg-[#f8f9fa] px-4 py-3 border-b border-[#e0e4e5] flex items-center gap-2 rounded-t-[15px]">
            <span className="material-symbols-rounded text-sm text-primary">location_on</span>
            <p className="text-[14px] font-bold text-primary">{t('social.location')}</p>
          </div>
          <div className="p-4 space-y-4">
            <div className="relative z-50">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">{t('social.venue_label')}</label>
              <div className="relative flex items-center px-4 py-3 border border-[#e0e4e5] rounded-xl bg-[#f8f9fa] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#007AFF]/20 transition-all">
                <span className="material-symbols-rounded text-[#acb3b4] mr-2">search</span>
                <input value={venueName} onChange={(e) => handleVenueSearch(e.target.value)}
                  onFocus={() => venueName.length >= 1 && setShowVenueResults(venueResults.length > 0)}
                  onBlur={() => setTimeout(() => setShowVenueResults(false), 200)}
                  className="flex-1 bg-transparent border-none p-0 focus:ring-0 text-sm font-bold text-[#2d3435] placeholder:text-[#acb3b4] placeholder:font-normal outline-none"
                  placeholder={t('social.search_venue_placeholder')} type="text" />
              </div>
              {showVenueResults && (
                <div className="absolute top-full left-0 w-full mt-1 bg-white border border-[#e0e4e5] rounded-xl shadow-lg z-50 overflow-hidden">
                  {venueResults.map(v => (
                    <button key={v.id} onClick={() => handleSelectVenue(v)}
                      className="w-full text-left px-4 py-3 hover:bg-[#f8f9fa] flex items-center justify-between group transition-colors border-b border-[#f2f4f4] last:border-0">
                      <div className="flex items-baseline gap-2">
                        <p className="font-bold text-[#2d3435] text-sm group-hover:text-primary">{v.name}</p>
                        {v.nameKo && <span className="text-xs text-[#acb3b4] font-medium">{v.nameKo}</span>}
                      </div>
                      <span className="text-xs text-[#acb3b4] font-bold bg-[#f2f4f4] px-2 py-0.5 rounded-full">{v.city}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
 
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">{t('social.region_autofill')}</label>
              <button onClick={() => openSelectorWithCallback((country, city) => { setFormCountry(country); setFormCity(city); })}
                className="w-full flex items-center justify-between px-4 py-3 border border-[#e0e4e5] rounded-xl bg-[#f8f9fa] hover:bg-[#f2f4f4] transition-colors">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-rounded text-primary">public</span>
                  <div className="text-left">
                    <p className="text-sm font-bold text-[#2d3435]">{formCountry || t('social.select_country')}</p>
                    <p className="text-xs font-medium text-[#acb3b4]">{formCity || t('social.select_city')}</p>
                  </div>
                </div>
                <span className="material-symbols-rounded text-[#acb3b4]">chevron_right</span>
              </button>
            </div>
          </div>
        </div>

        {/* 6. Ticketing & Details */}
        <div className="relative z-20 border border-[#e0e4e5] rounded-2xl bg-white mt-5">
          <div className="bg-[#f8f9fa] px-4 py-3 border-b border-[#e0e4e5] flex items-center gap-2 rounded-t-[15px]">
            <span className="material-symbols-rounded text-sm text-primary">local_activity</span>
            <p className="text-[14px] font-bold text-primary">{t('social.ticketing_details')}</p>
          </div>
          <div className="p-4 space-y-4">
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">{t('social.entry_price')}</label>
                <div className="flex items-center gap-2">
                  <div className="px-3 py-3 border border-[#e0e4e5] rounded-xl bg-[#f8f9fa] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#007AFF]/20 transition-all w-24">
                    <select value={currency} onChange={(e) => setCurrency(e.target.value)}
                      className="w-full bg-transparent border-none p-0 text-sm font-bold text-[#2d3435] focus:ring-0 outline-none appearance-none cursor-pointer"
                      style={{ WebkitAppearance: 'none', appearance: 'none' }}>
                      <option value="KRW">KRW</option>
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="JPY">JPY</option>
                    </select>
                  </div>
                  <div className="flex-1 flex items-center px-4 py-3 border border-[#e0e4e5] rounded-xl bg-[#f8f9fa] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#007AFF]/20 transition-all">
                    <input value={priceAmount} onChange={(e) => setPriceAmount(e.target.value)}
                      className="w-full bg-transparent border-none p-0 focus:ring-0 text-sm font-bold text-[#2d3435] placeholder:text-[#acb3b4] placeholder:font-normal outline-none" type="number" placeholder="0" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      )}

        {currentStep === 4 && (
          <div className="space-y-5 animate-in fade-in duration-200">
            {/* 5. Roles & Staff */}
        <div className="relative z-30 border border-[#e0e4e5] rounded-2xl bg-white">
          <div className="bg-[#f8f9fa] px-4 py-3 border-b border-[#e0e4e5] flex items-center gap-2 rounded-t-[15px]">
            <span className="material-symbols-rounded text-sm text-primary">group</span>
            <p className="text-[14px] font-bold text-primary">{t('social.roles_staff')}</p>
          </div>
          <div className="p-4 space-y-4">
            {/* Organizer */}
            <div className="relative z-30">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">{t('social.organizer_label')}</label>
              {organizerList.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3 p-3 bg-[#f8f9fa] rounded-xl border border-[#e0e4e5]">
                  {organizerList.map(o => (
                    <div key={o.id} className="flex items-center gap-1.5 bg-white border border-[#e0e4e5] px-3 py-1.5 rounded-full shadow-sm">
                      <span className="material-symbols-rounded text-[14px] text-primary">person</span>
                      <span className="text-xs font-bold text-[#2d3435]">{o.name}</span>
                      <button type="button" onClick={() => setOrganizerList(organizerList.filter(x => x.id !== o.id))} className="text-[#acb3b4] hover:text-red-500 transition-colors ml-1 flex items-center justify-center">
                        <span className="material-symbols-rounded text-[14px]">cancel</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="relative flex items-center px-4 py-3 border border-[#e0e4e5] rounded-xl bg-[#f8f9fa] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#007AFF]/20 transition-all">
                <span className="material-symbols-rounded text-[#acb3b4] mr-2">person_filled</span>
                <input value={organizerSearch} onChange={(e) => handleOrganizerSearch(e.target.value)}
                  onBlur={() => setTimeout(() => setShowOrganizerResults(false), 200)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddFreeTextOrganizer(); } }}
                  className="flex-1 bg-transparent border-none p-0 focus:ring-0 text-sm font-bold text-[#2d3435] placeholder:text-[#acb3b4] placeholder:font-normal outline-none"
                  placeholder={t('social.search_user_placeholder')} type="text" />
                {organizerSearch.trim() && (
                  <button type="button" onClick={handleAddFreeTextOrganizer}
                    className="ml-2 px-2 py-1 bg-primary/10 text-primary rounded-lg text-xs font-black hover:bg-primary/20 transition-colors shrink-0">
                    <span className="material-symbols-rounded text-[14px]">add</span>
                  </button>
                )}
              </div>
              {showOrganizerResults && (
                <div className="absolute top-full left-0 w-full mt-1 bg-white border border-[#e0e4e5] rounded-xl shadow-lg z-50 overflow-hidden">
                  {organizerResults.map(u => (
                    <button key={u.id} onClick={() => handleSelectOrganizer(u)}
                      className="w-full text-left px-4 py-3 hover:bg-[#f8f9fa] flex items-center gap-3 group transition-colors border-b border-[#f2f4f4] last:border-0 border-none">
                      <span className="material-symbols-rounded text-[#acb3b4] text-[18px]">person</span>
                      <div className="flex flex-col">
                        <p className="font-bold text-[#2d3435] text-sm group-hover:text-primary leading-tight">{u.nickname}</p>
                        {u.nativeNickname && <span className="text-xs text-[#acb3b4] font-medium leading-tight">{u.nativeNickname}</span>}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Staff */}
            <div className="relative z-10">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">{t('social.staff_registration')}</label>
              {staffList.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3 p-3 bg-[#f8f9fa] rounded-xl border border-[#e0e4e5]">
                  {staffList.map(s => (
                    <div key={s.id} className="flex items-center gap-1.5 bg-white border border-[#e0e4e5] px-3 py-1.5 rounded-full shadow-sm">
                      <span className="material-symbols-rounded text-[14px] text-primary">person</span>
                      <span className="text-xs font-bold text-[#2d3435]">{s.name}</span>
                      <button type="button" onClick={() => setStaffList(staffList.filter(x => x.id !== s.id))} className="text-[#acb3b4] hover:text-red-500 transition-colors ml-1 flex items-center justify-center">
                        <span className="material-symbols-rounded text-[14px]">cancel</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="relative flex items-center px-4 py-3 border border-[#e0e4e5] rounded-xl bg-[#f8f9fa] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#007AFF]/20 transition-all">
                <span className="material-symbols-rounded text-[#acb3b4] mr-2">person_add</span>
                <input value={staffSearch} onChange={(e) => {
                    setStaffSearch(e.target.value);
                    if (e.target.value.length >= 1) {
                      const lower = e.target.value.toLowerCase();
                      const filtered = allUsers.filter(u =>
                        !staffList.find(s => s.id === u.id) &&
                        ((u.nickname && u.nickname.toLowerCase().includes(lower)) ||
                         (u.nativeNickname && u.nativeNickname.includes(e.target.value)))
                      );
                      setStaffResults(filtered.slice(0, 6));
                      setShowStaffResults(filtered.length > 0);
                    } else setShowStaffResults(false);
                  }}
                  onBlur={() => setTimeout(() => setShowStaffResults(false), 200)}
                  className="flex-1 bg-transparent border-none p-0 focus:ring-0 text-sm font-bold text-[#2d3435] placeholder:text-[#acb3b4] placeholder:font-normal outline-none"
                  placeholder={t('social.search_staff_placeholder')} type="text" />
              </div>
              {showStaffResults && (
                <div className="absolute top-full left-0 w-full mt-1 bg-white border border-[#e0e4e5] rounded-xl shadow-lg z-50 overflow-hidden">
                  {staffResults.map(u => (
                    <button key={u.id} onClick={() => { setStaffList([...staffList, { id: u.id, name: u.nickname || '' }]); setStaffSearch(''); setShowStaffResults(false); }}
                      className="w-full text-left px-4 py-3 hover:bg-[#f8f9fa] flex items-center gap-3 border-b border-[#f2f4f4] last:border-0 group border-none">
                      <span className="material-symbols-rounded text-[#acb3b4] text-[18px]">person_add</span>
                      <div className="flex flex-col">
                        <p className="font-bold text-[#2d3435] text-sm group-hover:text-primary leading-tight">{u.nickname}</p>
                        {u.nativeNickname && <span className="text-xs text-[#acb3b4] font-medium leading-tight">{u.nativeNickname}</span>}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 7. Sub-Events Schedule */}
        <div className="relative z-10 border border-[#e0e4e5] rounded-2xl bg-white mt-5">
          <div className="bg-[#f8f9fa] px-4 py-3 border-b border-[#e0e4e5] flex items-center justify-between rounded-t-[15px]">
            <div className="flex items-center gap-2">
              <span className="material-symbols-rounded text-sm text-primary">celebration</span>
              <p className="text-[14px] font-bold text-primary">{t('social.events_schedule')}</p>
            </div>
            <button onClick={() => setSocialEvents([...socialEvents, { id: Date.now(), title: '', description: '', maxParticipants: 1, isUnlimited: true }])}
              className="text-xs font-bold text-primary flex items-center gap-1 bg-primary/10 px-2.5 py-1 rounded-full hover:bg-primary/20 transition-colors">
              <span className="material-symbols-rounded text-[14px]">add</span> {t('social.add_event')}
            </button>
          </div>
          <div className="p-4 space-y-3">
            {socialEvents.length === 0 && (
              <div className="text-center py-6 text-[#acb3b4]">
                <span className="material-symbols-rounded text-3xl mb-1 opacity-50">event_note</span>
                <p className="text-xs font-bold">{t('social.no_sub_events')}</p>
              </div>
            )}
            {socialEvents.map(event => (
              <div key={event.id} className="p-3 border border-[#e0e4e5] rounded-xl bg-[#f8f9fa] relative group">
                <button onClick={() => setSocialEvents(socialEvents.filter(e => e.id !== event.id))} 
                  className="absolute -top-2 -right-2 w-6 h-6 bg-white border border-[#e0e4e5] rounded-full flex items-center justify-center text-[#acb3b4] hover:text-red-500 hover:border-red-200 transition-colors shadow-sm opacity-0 group-hover:opacity-100">
                  <span className="material-symbols-rounded text-[14px]">close</span>
                </button>
                <div className="space-y-2">
                  <input value={event.title} onChange={(e) => setSocialEvents(socialEvents.map(ev => ev.id === event.id ? { ...ev, title: e.target.value } : ev))}
                    className="w-full bg-transparent border-b border-[#e0e4e5] pb-1 focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/20 focus:ring-0 text-sm font-bold text-[#2d3435] placeholder:text-[#acb3b4] placeholder:font-normal outline-none transition-colors"
                    type="text" placeholder={t('social.sub_event_title_placeholder')} />
                  <input value={event.description} onChange={(e) => setSocialEvents(socialEvents.map(ev => ev.id === event.id ? { ...ev, description: e.target.value } : ev))}
                    className="w-full bg-transparent border-none p-0 focus:ring-0 text-xs text-[#596061] placeholder:text-[#acb3b4] placeholder:font-normal outline-none"
                    type="text" placeholder={t('social.sub_event_desc_placeholder')} />
                  <div className="flex items-center justify-between pt-3 border-t border-[#e0e4e5] border-dashed">
                    <label className="text-xs text-[#acb3b4] font-bold uppercase flex items-center gap-2">
                      <input 
                        type="checkbox" 
                        checked={(event as any).isUnlimited}
                        onChange={(e) => setSocialEvents(socialEvents.map(ev => ev.id === event.id ? { ...ev, isUnlimited: e.target.checked, maxParticipants: e.target.checked ? 0 : 1 } : ev))}
                        className="rounded border-[#e0e4e5] text-primary focus:ring-[#007AFF]/20"
                      />
                      {t('social.unlimited_participants')}
                    </label>
                    {!(event as any).isUnlimited && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-[#acb3b4] font-bold uppercase">Max:</span>
                        <input 
                          value={event.maxParticipants || ''} 
                          onChange={(e) => {
                            const val = e.target.value;
                            const parsed = parseInt(val);
                            setSocialEvents(socialEvents.map(ev => 
                              ev.id === event.id ? { ...ev, maxParticipants: isNaN(parsed) ? 0 : parsed } : ev
                            ));
                          }}
                          className="w-16 bg-white border border-[#e0e4e5] p-1.5 rounded-md text-xs font-bold text-[#2d3435] text-center outline-none focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/20"
                          type="number" min="1" placeholder="1" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      )}

      </main>

      <div 
        className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-100 px-4 shadow-lg flex gap-3 items-center justify-between"
        style={{
          zIndex: 100010,
          paddingTop: '16px',
          paddingBottom: Capacitor.isNativePlatform() ? 'calc(16px + env(safe-area-inset-bottom))' : '16px',
          height: Capacitor.isNativePlatform() ? 'calc(76px + env(safe-area-inset-bottom))' : '76px'
        }}
      >
        {currentStep > 1 && (
          <button 
            type="button" 
            onClick={() => setCurrentStep(prev => prev - 1)} 
            className="flex-grow py-3.5 rounded-full border border-slate-200 text-slate-700 text-sm font-bold active:scale-95 transition-transform"
          >
            {language === 'KR' ? '이전 단계' : 'Previous'}
          </button>
        )}
        <button 
          type="button" 
          onClick={() => {
            if (currentStep < 4) {
              setCurrentStep(prev => prev + 1);
            } else {
              handleSave();
            }
          }} 
          disabled={isSubmitting || (currentStep === 2 && !title.trim())}
          className="flex-grow py-3.5 rounded-full bg-[#007AFF] text-white text-sm font-bold active:scale-95 transition-transform disabled:opacity-50"
        >
          {currentStep < 4 ? (language === 'KR' ? '다음 단계' : 'Next Step') : (isSubmitting ? t('common.saving') : t('common.save'))}
        </button>
      </div>
    </div>
  );
}
