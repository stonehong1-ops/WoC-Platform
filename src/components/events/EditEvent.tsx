'use client';
import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { useLocation } from '@/components/providers/LocationProvider';
import { eventService } from '@/lib/firebase/eventService';
import { venueService } from '@/lib/firebase/venueService';
import { userService } from '@/lib/firebase/userService';
import { storageService } from '@/lib/firebase/storageService';
import { Event, EventCategory, EventProgram, EventPricing, EventArtist, EventVenueItem, EventPackage, EventScheduleDay } from '@/types/event';
import { Venue } from '@/types/venue';
import { PlatformUser } from '@/types/user';
import { Timestamp } from 'firebase/firestore';
import ProgramEditor from './ProgramEditor';
import { syncMilongasToSocial, deleteLinkedSocials } from '@/lib/firebase/syncMilongaToSocial';
import { useLanguage } from '@/contexts/LanguageContext';
import { useBackButtonClose } from '@/hooks/useBackButtonClose';
import { Capacitor } from '@capacitor/core';

interface Props { onClose: () => void; onSuccess?: (id?: string) => void; eventData?: Event; }

const toDateStr = (v: any) => {
  if (!v) return '';
  const d = typeof v?.toDate === 'function' ? v.toDate() : new Date(v);
  return isNaN(d.getTime()) ? '' : d.toISOString().split('T')[0];
};

/* ── Reusable form section wrapper ── */
const Section = ({ icon, label, children, z }: { icon: string; label: string; children: React.ReactNode; z?: number }) => (
  <div className="border border-[#e0e4e5] rounded-2xl bg-white" style={z ? { position: 'relative', zIndex: z } : undefined}>
    <div className="bg-[#f8f9fa] px-4 py-3 border-b border-[#e0e4e5] flex items-center gap-2 rounded-t-[15px]">
      <span className="material-symbols-rounded text-sm text-primary">{icon}</span>
      <p className="text-[14px] font-bold text-primary">{label}</p>
    </div>
    <div className="p-4 space-y-4">{children}</div>
  </div>
);

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <label className="block text-xs font-bold text-slate-700 mb-1.5">{label}</label>
    {children}
  </div>
);

const inputCls = "flex-1 bg-transparent border-none p-0 focus:ring-0 text-sm font-bold text-[#2d3435] placeholder:text-[#acb3b4] placeholder:font-normal outline-none";
const boxCls = "flex items-center px-4 py-3 border border-[#e0e4e5] rounded-xl bg-[#f8f9fa] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#007AFF]/20 transition-all";

export default function EditEvent({ onClose, onSuccess, eventData }: Props) {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const { location, openSelectorWithCallback } = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  useBackButtonClose(true, onClose);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Basic
  const [title, setTitle] = useState(eventData?.title || '');
  const [titleNative, setTitleNative] = useState(eventData?.titleNative || '');
  const [description, setDescription] = useState(eventData?.description || '');
  const [category, setCategory] = useState<EventCategory>(eventData?.category || 'WORKSHOP');

  // Date
  const todayStr = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(toDateStr(eventData?.startDate) || todayStr);
  const [endDate, setEndDate] = useState(toDateStr(eventData?.endDate) || todayStr);

  // Location
  const [formCountry, setFormCountry] = useState(eventData?.location?.split(',')[1]?.trim() || location.country);
  const [formCity, setFormCity] = useState(eventData?.location?.split(',')[0]?.trim() || location.city);
  const [venueId, setVenueId] = useState(eventData?.venueId || '');
  const [venueName, setVenueName] = useState(eventData?.venueName || '');
  const [allVenues, setAllVenues] = useState<Venue[]>([]);
  const [venueResults, setVenueResults] = useState<Venue[]>([]);
  const [showVenueResults, setShowVenueResults] = useState(false);

  // Host / Organizer
  const [allUsers, setAllUsers] = useState<PlatformUser[]>([]);
  const [organizerList, setOrganizerList] = useState<{ id: string; name: string; nativeName?: string }[]>(() => {
    if (eventData?.organizerNames && eventData.organizerNames.length > 0) {
      return eventData.organizerNames.map((n: string, i: number) => ({ id: `org_${i}_${Date.now()}`, name: n }));
    }
    if (eventData?.hostName) {
      return [{ id: eventData.hostId || 'manual_host', name: eventData.hostName }];
    }
    return user?.displayName ? [{ id: user.uid, name: user.displayName }] : [];
  });
  const [organizerSearch, setOrganizerSearch] = useState('');
  const [organizerResults, setOrganizerResults] = useState<PlatformUser[]>([]);
  const [showOrganizerResults, setShowOrganizerResults] = useState(false);

  // Staff
  const [staffList, setStaffList] = useState<{ id: string; name: string }[]>(
    eventData?.staffIds?.map((id, i) => ({ id, name: eventData?.staffNames?.[i] || '' })) || []
  );
  const [staffSearch, setStaffSearch] = useState('');
  const [staffResults, setStaffResults] = useState<PlatformUser[]>([]);
  const [showStaffResults, setShowStaffResults] = useState(false);

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
    setOrganizerList([...organizerList, { id: u.id, name: u.nickname || t('social.anonymous') || 'Anonymous', nativeName: u.nativeNickname || '' }]);
    setOrganizerSearch('');
    setShowOrganizerResults(false);
  };

  const handleAddFreeTextOrganizer = () => {
    const text = organizerSearch.trim();
    if (!text) return;
    if (organizerList.find(o => o.name === text)) return;
    setOrganizerList([...organizerList, { id: `manual_${Date.now()}`, name: text, nativeName: '' }]);
    setOrganizerSearch('');
    setShowOrganizerResults(false);
  };

  const handleStaffSearch = (val: string) => {
    setStaffSearch(val);
    if (val.length >= 1) {
      const lower = val.toLowerCase();
      const filtered = allUsers.filter(u =>
        !staffList.find(s => s.id === u.id) &&
        ((u.nickname && u.nickname.toLowerCase().includes(lower)) ||
        (u.nativeNickname && u.nativeNickname.includes(val)))
      );
      setStaffResults(filtered.slice(0, 6));
      setShowStaffResults(filtered.length > 0);
    } else {
      setShowStaffResults(false);
      setStaffResults([]);
    }
  };

  const handleSelectStaff = (u: PlatformUser) => {
    setStaffList([...staffList, { id: u.id, name: u.nickname || u.nativeNickname || u.id }]);
    setStaffSearch('');
    setShowStaffResults(false);
  };

  const handleAddFreeTextStaff = () => {
    const text = staffSearch.trim();
    if (!text) return;
    if (staffList.find(s => s.name === text)) return;
    setStaffList([...staffList, { id: `manual_staff_${Date.now()}`, name: text }]);
    setStaffSearch('');
    setShowStaffResults(false);
  };

  // Image
  const [images, setImages] = useState<string[]>(eventData?.imageUrl ? [eventData.imageUrl] : []);
  const [imageFile, setImageFile] = useState<File|null>(null);

  // Programs
  const [programs, setPrograms] = useState<EventProgram[]>(eventData?.programs || []);

  // Pricing
  const [currency, setCurrency] = useState(eventData?.pricing?.currency || 'KRW');
  const [classAdv, setClassAdv] = useState(eventData?.pricing?.classPrice?.advance || 0);
  const [classDoor, setClassDoor] = useState(eventData?.pricing?.classPrice?.door || 0);
  const [milongaAdv, setMilongaAdv] = useState(eventData?.pricing?.milongaPrice?.advance || 0);
  const [milongaDoor, setMilongaDoor] = useState(eventData?.pricing?.milongaPrice?.door || 0);
  const [fullPassAdv, setFullPassAdv] = useState(eventData?.pricing?.fullPassPrice?.advance || 0);
  const [fullPassDoor, setFullPassDoor] = useState(eventData?.pricing?.fullPassPrice?.door || 0);
  const [fullPassLabel, setFullPassLabel] = useState(eventData?.pricing?.fullPassPrice?.label || '');
  const [earlyBird, setEarlyBird] = useState(eventData?.pricing?.earlyBirdDeadline || '');

  // New Sections
  const [galleryImages, setGalleryImages] = useState<string[]>(eventData?.galleryImages || []);
  const [artists, setArtists] = useState<EventArtist[]>(eventData?.artists || []);
  const [eventVenues, setEventVenues] = useState<EventVenueItem[]>(eventData?.eventVenues || []);
  const [packages, setPackages] = useState<EventPackage[]>(eventData?.packages || []);
  const [scheduleDays, setScheduleDays] = useState<EventScheduleDay[]>(eventData?.scheduleDays || []);

  // Extra
  const [dressCode, setDressCode] = useState(eventData?.dressCode || '');
  const [websiteUrl, setWebsiteUrl] = useState(eventData?.websiteUrl || '');
  const [registrationUrl, setRegistrationUrl] = useState(eventData?.registrationUrl || '');
  const [bankInfo, setBankInfo] = useState(eventData?.bankInfo || '');

  const categories: EventCategory[] = ['CONFERENCE','WORKSHOP','NETWORKING','PARTY','SOCIAL'];

  useEffect(() => {
    venueService.getVenues().then(setAllVenues).catch(console.error);
    userService.getAllUsers().then(setAllUsers).catch(console.error);
  }, []);

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

  const handleSave = async () => {
    if (!user || !title || !startDate) return alert('Please fill Title and Start Date.');
    setIsSubmitting(true);
    try {
      let finalImageUrl = images[0] || '';
      if (imageFile) {
        finalImageUrl = await storageService.uploadFile(imageFile, `events/${Date.now()}_${imageFile.name}`);
      }
      const startObj = new Date(startDate); startObj.setHours(0,0,0,0);
      const endObj = endDate ? new Date(endDate) : new Date(startDate); endObj.setHours(0,0,0,0);

      const rawPricing: EventPricing = {
        currency,
        ...(classAdv ? { classPrice: { advance: classAdv, ...(classDoor ? { door: classDoor } : {}) } } : {}),
        ...(milongaAdv ? { milongaPrice: { advance: milongaAdv, ...(milongaDoor ? { door: milongaDoor } : {}) } } : {}),
        ...(fullPassAdv ? { fullPassPrice: { advance: fullPassAdv, ...(fullPassDoor ? { door: fullPassDoor } : {}), ...(fullPassLabel ? { label: fullPassLabel } : {}) } } : {}),
        ...(earlyBird ? { earlyBirdDeadline: earlyBird } : {}),
      };

      const primaryHost = organizerList[0];
      const primaryHostName = primaryHost?.name || user.displayName || 'Anonymous';
      const primaryHostId = primaryHost && !primaryHost.id.startsWith('manual_') ? primaryHost.id : (eventData?.hostId || user.uid);
      const organizerNames = organizerList.map(o => o.name);

      const rawFinalData: any = {
        ...(eventData || {}),
        title: title || '', titleNative: titleNative || '', description: description || '', category: category || 'WORKSHOP',
        location: `${formCity}, ${formCountry}`,
        hostId: primaryHostId,
        hostName: primaryHostName,
        organizerName: primaryHostName,
        organizerNames: organizerNames,
        hostPhoto: eventData?.hostPhoto || user.photoURL || '',
        imageUrl: finalImageUrl || '',
        venueId: venueId || '', venueName: venueName || '',
        staffIds: staffList.map(s => s.id),
        staffNames: staffList.map(s => s.name),
        programs: programs || [], pricing: rawPricing || {},
        galleryImages: galleryImages.filter(Boolean),
        artists: artists.filter(a => a.name),
        eventVenues: eventVenues.filter(v => v.name),
        packages: packages.filter(p => p.name),
        scheduleDays: scheduleDays.filter(d => d.dayLabel),
        dressCode, websiteUrl, registrationUrl, bankInfo,
      };

      const finalData = JSON.parse(JSON.stringify(rawFinalData));
      finalData.startDate = Timestamp.fromDate(startObj);
      finalData.endDate = Timestamp.fromDate(endObj);
      finalData.updatedAt = Timestamp.now();

      let savedId = eventData?.id || '';
      if (eventData?.id) {
        await eventService.updateEvent(eventData.id, finalData);
      } else {
        savedId = await eventService.createEvent(finalData);
      }

      // Phase 5: milonga → Social popup 자동 동기화 (백그라운드)
      const hasMilonga = programs.some(p => p.type === 'milonga' && p.dates.length > 0);
      if (hasMilonga && savedId) {
        const eventForSync = { ...finalData, id: savedId } as any;
        syncMilongasToSocial(eventForSync)
          .then(() => {})
          .catch(e => console.error('[Sync] Failed:', e));
      }
      onSuccess?.(savedId); onClose();
    } catch (e) { console.error(e); alert(t('event.save_failed')); }
    finally { setIsSubmitting(false); }
  };

  const handleDelete = async () => {
    if (!eventData?.id || !confirm(t('event.delete_confirm'))) return;
    try {
      // 연결된 Social popup도 삭제
      await deleteLinkedSocials(eventData.id);
      await eventService.deleteEvent(eventData.id);
      onSuccess?.(); onClose();
    } catch(e) { console.error(e); }
  };

  // 3단계 마법사 관리
  const [step, setStep] = useState(1);
  const TOTAL_STEPS = 3;

  const handleHeaderBack = () => {
    if (step > 1) {
      setStep(prev => prev - 1);
    } else {
      const isDirty = title || description || venueName || startDate;
      if (isDirty) {
        if (confirm(t('common.confirm_discard') || "작성 중인 내용이 있습니다. 정말 나가시겠습니까?")) {
          onClose();
        }
      } else {
        onClose();
      }
    }
  };

  const stepTitles: Record<number, string> = {
    1: language === 'KR' ? '이벤트 구분 & 기본 설정' : 'Event Info & Host',
    2: language === 'KR' ? '포스터 & 세부분야/패키지' : 'Media & Programs',
    3: language === 'KR' ? '일정표, 요금 & 세부안내' : 'Schedule & Pricing',
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-5 animate-in fade-in duration-200">
            {/* 1. 카테고리 구분 (유형 선 선택 룰 적용) */}
            <div className="border border-[#e0e4e5] rounded-2xl bg-white">
              <div className="bg-[#f8f9fa] px-4 py-3 border-b border-[#e0e4e5] flex items-center gap-2 rounded-t-[15px]">
                <span className="material-symbols-rounded text-sm text-primary">label</span>
                <p className="text-[14px] font-bold text-primary">이벤트 구분</p>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-2 gap-2">
                  {categories.map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      className={`py-3 px-3 rounded-xl border font-bold text-xs transition-all active:scale-95 flex items-center justify-center gap-1.5 ${
                        category === cat
                          ? 'border-[#007AFF] bg-[#007AFF]/10 text-[#007AFF]'
                          : 'border-[#e0e4e5] bg-[#f8f9fa] text-slate-600'
                      }`}
                    >
                      <span className="material-symbols-rounded text-sm">label</span>
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 2. 이벤트 기본 정보 */}
            <div className="border border-[#e0e4e5] rounded-2xl bg-white">
              <div className="bg-[#f8f9fa] px-4 py-3 border-b border-[#e0e4e5] flex items-center gap-2 rounded-t-[15px]">
                <span className="material-symbols-rounded text-sm text-primary">info</span>
                <p className="text-[14px] font-bold text-primary">이벤트 기본 정보</p>
              </div>
              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    이벤트 영문 제목 <span className="text-red-500">*</span>
                  </label>
                  <div className={boxCls}>
                    <input
                      required
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                      className={inputCls}
                      placeholder="e.g. Seoul Tango Festival 2026"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    이벤트 국문 제목 (한글 타이틀)
                  </label>
                  <div className={boxCls}>
                    <input
                      value={titleNative}
                      onChange={e => setTitleNative(e.target.value)}
                      className={inputCls}
                      placeholder="예: 서울 탱고 페스티벌 2026"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    이벤트 상세 설명 및 소개
                  </label>
                  <div className={boxCls}>
                    <textarea
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      rows={4}
                      className={`${inputCls} min-h-[100px] resize-none`}
                      placeholder="행사의 상세 안내, 하이라이트, 수강 혜택 등을 입력하세요."
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      시작일 <span className="text-red-500">*</span>
                    </label>
                    <div className={boxCls}>
                      <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className={inputCls} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">종료일</label>
                    <div className={boxCls}>
                      <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className={inputCls} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. 장소 정보 */}
            <div className="border border-[#e0e4e5] rounded-2xl bg-white">
              <div className="bg-[#f8f9fa] px-4 py-3 border-b border-[#e0e4e5] flex items-center gap-2 rounded-t-[15px]">
                <span className="material-symbols-rounded text-sm text-primary">location_on</span>
                <p className="text-[14px] font-bold text-primary">개최 장소</p>
              </div>
              <div className="p-4 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">국가</label>
                    <div className={boxCls}><input value={formCountry} onChange={e => setFormCountry(e.target.value)} className={inputCls} placeholder="Korea" /></div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">도시</label>
                    <div className={boxCls}><input value={formCity} onChange={e => setFormCity(e.target.value)} className={inputCls} placeholder="Seoul" /></div>
                  </div>
                </div>

                <div className="relative z-30">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">베뉴 검색 및 선택</label>
                  <div className={boxCls}>
                    <span className="material-symbols-rounded text-[#acb3b4] mr-2">search</span>
                    <input value={venueName} onChange={e => handleVenueSearch(e.target.value)} className={inputCls} placeholder="장소명 검색..." />
                  </div>
                  {showVenueResults && (
                    <div className="absolute top-full left-0 w-full mt-1 bg-white border border-[#e0e4e5] rounded-xl shadow-lg z-50 max-h-48 overflow-y-auto">
                      {venueResults.map(v => (
                        <button key={v.id} type="button" onClick={() => handleSelectVenue(v)} className="w-full text-left px-4 py-3 hover:bg-[#f8f9fa] flex items-center justify-between border-b border-[#f2f4f4] last:border-0 group transition-colors">
                          <div className="flex items-baseline gap-2">
                            <span className="font-bold text-[#2d3435] text-sm group-hover:text-primary">{v.name}</span>
                            {v.nameKo && <span className="text-xs text-[#acb3b4] font-medium">{v.nameKo}</span>}
                          </div>
                          <span className="text-xs text-[#acb3b4] font-bold bg-[#f2f4f4] px-2 py-0.5 rounded-full shrink-0">{v.city}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 3. 호스트 & 스태프 지정 (소셜 표준 다중 칩 + 비회원 직입력) */}
            <div className="border border-[#e0e4e5] rounded-2xl bg-white">
              <div className="bg-[#f8f9fa] px-4 py-3 border-b border-[#e0e4e5] flex items-center gap-2 rounded-t-[15px]">
                <span className="material-symbols-rounded text-sm text-primary">group</span>
                <p className="text-[14px] font-bold text-primary">{t('social.roles_staff') || '주최자 및 아티스트 스태프'}</p>
              </div>
              <div className="p-4 space-y-4">
                {/* 오거나이저 (주최자) */}
                <div className="relative z-30">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">{t('social.organizer_label') || '주최자 (오거나이저)'}</label>
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
                    <input
                      value={organizerSearch}
                      onChange={(e) => handleOrganizerSearch(e.target.value)}
                      onBlur={() => setTimeout(() => setShowOrganizerResults(false), 200)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddFreeTextOrganizer(); } }}
                      className="flex-1 bg-transparent border-none p-0 focus:ring-0 text-sm font-bold text-[#2d3435] placeholder:text-[#acb3b4] placeholder:font-normal outline-none"
                      placeholder={t('social.search_user_placeholder') || '회원 검색 또는 외부 이름 입력 후 엔터...'}
                      type="text"
                    />
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
                        <button key={u.id} type="button" onClick={() => handleSelectOrganizer(u)}
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

                {/* 아티스트 / 스태프 */}
                <div className="relative z-20">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">{t('social.staff_registration') || '아티스트 / 스태프 지정'}</label>
                  {staffList.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3 p-3 bg-[#f8f9fa] rounded-xl border border-[#e0e4e5]">
                      {staffList.map(st => (
                        <div key={st.id} className="flex items-center gap-1.5 bg-white border border-[#e0e4e5] px-3 py-1.5 rounded-full shadow-sm">
                          <span className="material-symbols-rounded text-[14px] text-primary">person</span>
                          <span className="text-xs font-bold text-[#2d3435]">{st.name}</span>
                          <button type="button" onClick={() => setStaffList(staffList.filter(x => x.id !== st.id))} className="text-[#acb3b4] hover:text-red-500 transition-colors ml-1 flex items-center justify-center">
                            <span className="material-symbols-rounded text-[14px]">cancel</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="relative flex items-center px-4 py-3 border border-[#e0e4e5] rounded-xl bg-[#f8f9fa] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#007AFF]/20 transition-all">
                    <span className="material-symbols-rounded text-[#acb3b4] mr-2">search</span>
                    <input
                      value={staffSearch}
                      onChange={(e) => handleStaffSearch(e.target.value)}
                      onBlur={() => setTimeout(() => setShowStaffResults(false), 200)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddFreeTextStaff(); } }}
                      className="flex-1 bg-transparent border-none p-0 focus:ring-0 text-sm font-bold text-[#2d3435] placeholder:text-[#acb3b4] placeholder:font-normal outline-none"
                      placeholder="이름/닉네임 검색 또는 직접 입력 후 엔터..."
                      type="text"
                    />
                    {staffSearch.trim() && (
                      <button type="button" onClick={handleAddFreeTextStaff}
                        className="ml-2 px-2 py-1 bg-primary/10 text-primary rounded-lg text-xs font-black hover:bg-primary/20 transition-colors shrink-0">
                        <span className="material-symbols-rounded text-[14px]">add</span>
                      </button>
                    )}
                  </div>
                  {showStaffResults && (
                    <div className="absolute top-full left-0 w-full mt-1 bg-white border border-[#e0e4e5] rounded-xl shadow-lg z-50 overflow-hidden">
                      {staffResults.map(u => (
                        <button key={u.id} type="button" onClick={() => handleSelectStaff(u)}
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
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-5 animate-in fade-in duration-200">
            {/* 메인 포스터 & 갤러리 */}
            <div className="border border-[#e0e4e5] rounded-2xl bg-white">
              <div className="bg-[#f8f9fa] px-4 py-3 border-b border-[#e0e4e5] flex items-center gap-2 rounded-t-[15px]">
                <span className="material-symbols-rounded text-sm text-primary">image</span>
                <p className="text-[14px] font-bold text-primary">포스터 사진 및 갤러리</p>
              </div>
              <div className="p-4 space-y-4">
                <div className="py-4 px-8 border border-[#e0e4e5] rounded-xl bg-[#f8f9fa] flex justify-center">
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="relative aspect-[4/5] w-full max-w-[240px] rounded-lg overflow-hidden bg-white border border-[#e0e4e5] flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-all group shadow-sm"
                  >
                    {images[0] || imageFile ? (
                      <>
                        <img
                          src={imageFile ? URL.createObjectURL(imageFile) : images[0]}
                          alt="Poster"
                          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute top-3 left-3 bg-primary text-white text-xs font-black uppercase tracking-widest px-2.5 py-1 rounded shadow-sm z-10">
                          {t('social.primary') || 'PRIMARY'}
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setImageFile(null); setImages([]);
                          }}
                          className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center text-xs z-20"
                        >
                          ✕
                        </button>
                      </>
                    ) : (
                      <div className="flex flex-col items-center text-[#acb3b4] group-hover:text-primary transition-colors">
                        <span className="material-symbols-rounded text-4xl mb-2">add_photo_alternate</span>
                        <span className="text-xs font-bold text-center px-4">포스터 업로드<br/><span className="text-xs font-medium mt-1">4:5 비율 권장</span></span>
                      </div>
                    )}
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={e => {
                    const f = e.target.files?.[0]; if (f) setImageFile(f);
                  }} />
                </div>
              </div>
            </div>

            {/* 하위 프로그램 세션 (ProgramEditor) */}
            <div className="border border-[#e0e4e5] rounded-2xl bg-white">
              <div className="bg-[#f8f9fa] px-4 py-3 border-b border-[#e0e4e5] flex items-center gap-2 rounded-t-[15px]">
                <span className="material-symbols-rounded text-sm text-primary">celebration</span>
                <p className="text-[14px] font-bold text-primary">하위 프로그램 세션 (워크숍/밀롱가)</p>
              </div>
              <div className="p-4 space-y-4">
                <ProgramEditor programs={programs} onChange={setPrograms} />
              </div>
            </div>

            {/* 요금 패키지 구성 (Packages) */}
            <div className="border border-[#e0e4e5] rounded-2xl bg-white">
              <div className="bg-[#f8f9fa] px-4 py-3 border-b border-[#e0e4e5] flex items-center gap-2 rounded-t-[15px]">
                <span className="material-symbols-rounded text-sm text-primary">local_activity</span>
                <p className="text-[14px] font-bold text-primary">요금제 및 패키지 설정</p>
              </div>
              <div className="p-4 space-y-4">
                {packages.map((pkg, i) => (
                  <div key={pkg.id || i} className="p-3 border border-[#e0e4e5] rounded-xl space-y-2 relative bg-[#f8f9fa]">
                    <button type="button" onClick={() => setPackages(packages.filter((_, j) => j !== i))} className="absolute top-2 right-2 text-red-400 hover:text-red-600">
                      <span className="material-symbols-rounded text-lg">delete</span>
                    </button>
                    <div className="grid grid-cols-2 gap-2">
                      <div className={boxCls}>
                        <input value={pkg.name} onChange={e => { const c=[...packages]; c[i]={...c[i], name: e.target.value}; setPackages(c); }} className={inputCls} placeholder="패키지명 (Full Pass 등)" />
                      </div>
                      <div className={boxCls}>
                        <input type="number" value={pkg.price || ''} onChange={e => { const c=[...packages]; c[i]={...c[i], price: parseInt(e.target.value)||0}; setPackages(c); }} className={inputCls} placeholder="가격" />
                      </div>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setPackages([...packages, { id: `p${Date.now()}`, name: '', price: 0, includedItems: [] }])}
                  className="flex items-center gap-1 text-primary text-xs font-bold hover:underline"
                >
                  <span className="material-symbols-rounded text-sm">add</span> 패키지 추가하기
                </button>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-5 animate-in fade-in duration-200">
            {/* 일자별 타임테이블 이미지 */}
            <div className="border border-[#e0e4e5] rounded-2xl bg-white">
              <div className="bg-[#f8f9fa] px-4 py-3 border-b border-[#e0e4e5] flex items-center gap-2 rounded-t-[15px]">
                <span className="material-symbols-rounded text-sm text-primary">calendar_month</span>
                <p className="text-[14px] font-bold text-primary">일자별 타임테이블</p>
              </div>
              <div className="p-4 space-y-4">
                {scheduleDays.map((day, i) => (
                  <div key={i} className="p-3 border border-[#e0e4e5] rounded-xl space-y-2 relative bg-[#f8f9fa]">
                    <button type="button" onClick={() => setScheduleDays(scheduleDays.filter((_, j) => j !== i))} className="absolute top-2 right-2 text-red-400 hover:text-red-600">
                      <span className="material-symbols-rounded text-lg">delete</span>
                    </button>
                    <div className="flex gap-2">
                      <div className={boxCls + ' w-28'}><input value={day.dayLabel} onChange={e => { const c=[...scheduleDays]; c[i]={...c[i], dayLabel: e.target.value}; setScheduleDays(c); }} className={inputCls} placeholder="Day 1" /></div>
                      <div className={boxCls + ' flex-1'}><input type="date" value={day.date||''} onChange={e => { const c=[...scheduleDays]; c[i]={...c[i], date: e.target.value}; setScheduleDays(c); }} className={inputCls} /></div>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setScheduleDays([...scheduleDays, { dayLabel: `Day ${scheduleDays.length + 1}` }])}
                  className="flex items-center gap-1 text-primary text-xs font-bold hover:underline"
                >
                  <span className="material-symbols-rounded text-sm">add</span> 일차 추가하기
                </button>
              </div>
            </div>

            {/* 수강료 및 통화 */}
            <div className="border border-[#e0e4e5] rounded-2xl bg-white">
              <div className="bg-[#f8f9fa] px-4 py-3 border-b border-[#e0e4e5] flex items-center gap-2 rounded-t-[15px]">
                <span className="material-symbols-rounded text-sm text-primary">payments</span>
                <p className="text-[14px] font-bold text-primary">수강료 및 얼리버드</p>
              </div>
              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">결제 통화</label>
                  <div className={boxCls}>
                    <select value={currency} onChange={e => setCurrency(e.target.value)} className={`${inputCls} appearance-none`}>
                      <option value="KRW">KRW (₩)</option>
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="JPY">JPY (¥)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">클래스 사전예약가</label>
                    <div className={boxCls}><input type="number" value={classAdv||''} onChange={e=>setClassAdv(parseInt(e.target.value)||0)} className={inputCls} placeholder="0"/></div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">클래스 현장구매가</label>
                    <div className={boxCls}><input type="number" value={classDoor||''} onChange={e=>setClassDoor(parseInt(e.target.value)||0)} className={inputCls} placeholder="0"/></div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">밀롱가 사전예약가</label>
                    <div className={boxCls}><input type="number" value={milongaAdv||''} onChange={e=>setMilongaAdv(parseInt(e.target.value)||0)} className={inputCls} placeholder="0"/></div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">밀롱가 현장구매가</label>
                    <div className={boxCls}><input type="number" value={milongaDoor||''} onChange={e=>setMilongaDoor(parseInt(e.target.value)||0)} className={inputCls} placeholder="0"/></div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">얼리버드 마감일</label>
                  <div className={boxCls}><input type="date" value={earlyBird} onChange={e=>setEarlyBird(e.target.value)} className={inputCls}/></div>
                </div>
              </div>
            </div>

            {/* 추가 정보 (Extra) */}
            <div className="border border-[#e0e4e5] rounded-2xl bg-white">
              <div className="bg-[#f8f9fa] px-4 py-3 border-b border-[#e0e4e5] flex items-center gap-2 rounded-t-[15px]">
                <span className="material-symbols-rounded text-sm text-primary">tune</span>
                <p className="text-[14px] font-bold text-primary">추가 세부 안내</p>
              </div>
              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">드레스코드</label>
                  <div className={boxCls}><input value={dressCode} onChange={e=>setDressCode(e.target.value)} className={inputCls} placeholder="e.g. Elegance / Red & Black"/></div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">공식 웹사이트 URL</label>
                  <div className={boxCls}><input value={websiteUrl} onChange={e=>setWebsiteUrl(e.target.value)} className={inputCls} placeholder="https://..." type="url"/></div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">입금 계좌 정보</label>
                  <div className={boxCls}><input value={bankInfo} onChange={e=>setBankInfo(e.target.value)} className={inputCls} placeholder="은행명 / 계좌번호 / 예금주"/></div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div
      className="fixed inset-0 bg-white overflow-y-auto animate-in fade-in duration-300"
      style={{ zIndex: 100000, paddingTop: 'calc(56px + env(safe-area-inset-top, 0px))' }}
    >
      <style dangerouslySetInnerHTML={{ __html: `.material-symbols-rounded { font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24; }` }} />

      {/* 소셜 100% 동일 Header (X버튼 삭제, 뒤로가기로 조작) */}
      <header
        className="fixed top-0 left-0 w-full flex-shrink-0 bg-white border-b border-slate-100 px-4 flex items-center justify-between z-50"
        style={{
          zIndex: 100010,
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
        <h1 className="text-[16px] font-bold text-slate-800">
          {eventData ? (t('event.edit_event') || '이벤트 수정') : (t('event.create_event') || '새 이벤트')}
        </h1>
        <div className="flex items-center gap-2">
          {eventData && (
            <button
              type="button"
              onClick={handleDelete}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-red-50 text-red-500 transition-colors"
            >
              <span className="material-symbols-rounded">delete</span>
            </button>
          )}
        </div>
      </header>

      {/* 소셜 100% 동일 Step Indicator Bar */}
      <div className="max-w-2xl mx-auto px-4 mt-3">
        <div className="flex items-center justify-between border border-slate-100 bg-slate-50/80 backdrop-blur rounded-2xl px-4 py-3 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-slate-700">
              {language === 'KR' ? `${step} / ${TOTAL_STEPS} 단계` : `Step ${step} of ${TOTAL_STEPS}`}
            </span>
            <span className="text-xs font-bold text-[#007AFF] bg-[#007AFF]/10 px-2.5 py-0.5 rounded-full">
              {stepTitles[step]}
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

      <main className="pt-4 pb-36 max-w-2xl mx-auto px-4">
        {renderStep()}
      </main>

      {/* 소셜 100% 동일 하단 네비게이션 버튼 바 */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-100 px-4 shadow-lg flex gap-3 items-center justify-between"
        style={{
          zIndex: 100010,
          paddingTop: '16px',
          paddingBottom: Capacitor.isNativePlatform() ? 'calc(16px + env(safe-area-inset-bottom))' : '16px',
          height: Capacitor.isNativePlatform() ? 'calc(76px + env(safe-area-inset-bottom))' : '76px'
        }}
      >
        {step > 1 && (
          <button
            type="button"
            onClick={handleHeaderBack}
            className="flex-grow py-3.5 rounded-full border border-slate-200 text-slate-700 text-sm font-bold active:scale-95 transition-transform"
          >
            {language === 'KR' ? '이전 단계' : 'Previous'}
          </button>
        )}
        <button
          type="button"
          onClick={() => {
            if (step < TOTAL_STEPS) {
              setStep(prev => prev + 1);
            } else {
              handleSave();
            }
          }}
          disabled={isSubmitting || (step === 1 && (!title.trim() || !startDate))}
          className="flex-grow py-3.5 rounded-full bg-[#007AFF] text-white text-sm font-bold active:scale-95 transition-transform disabled:opacity-50"
        >
          {step < TOTAL_STEPS
            ? (language === 'KR' ? '다음 단계' : 'Next Step')
            : (isSubmitting ? (t('common.saving') || "저장 중...") : (t('common.save') || "저장"))}
        </button>
      </div>
    </div>
  );
}
