'use client';

import React, { useState, useRef, useEffect, Suspense, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useNavigation } from '@/components/providers/NavigationProvider';
import { useAuth } from '@/components/providers/AuthProvider';
import { useLanguage } from '@/contexts/LanguageContext';
import { peopleService } from '@/lib/firebase/peopleService';
import { Person, PersonRole, ActivityEntry, TourStop } from '@/types/people';
import { storageService } from '@/lib/firebase/storageService';

const TOTAL_STEPS = 4;
const ROLE_OPTIONS: PersonRole[] = ['Instructor', 'DJ', 'Organizer', 'Seller', 'Couple', 'Touring', 'Dancer'];

function RegisterPageContent() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');
  const { setGlobalNavHidden } = useNavigation();
  const { t, language } = useLanguage();

  const [step, setStep] = useState(1);

  // Basic Info (Step 1)
  const [name, setName] = useState('');
  const [roles, setRoles] = useState<PersonRole[]>([]);
  const [title, setTitle] = useState('');
  const [heroFile, setHeroFile] = useState<File | null>(null);
  const [heroPreview, setHeroPreview] = useState('');
  const [profileFile, setProfileFile] = useState<File | null>(null);
  const [profilePreview, setProfilePreview] = useState('');

  // Location & Partner (Step 2)
  const [baseCity, setBaseCity] = useState('');
  const [baseCountry, setBaseCountry] = useState('');
  const [currentCity, setCurrentCity] = useState('');
  const [currentCountry, setCurrentCountry] = useState('');
  const [isLiveNow, setIsLiveNow] = useState(false);
  const [liveStatus, setLiveStatus] = useState('');
  const [partnerName, setPartnerName] = useState('');
  const [style, setStyle] = useState('');
  const [partnerSince, setPartnerSince] = useState('');

  // Bio & Communication (Step 3)
  const [bio, setBio] = useState('');
  const [languages, setLanguages] = useState('');
  const [bookingNote, setBookingNote] = useState('');

  // Schedule & Activity Flow (Step 4 - Dynamic Updates)
  const [tourStops, setTourStops] = useState<TourStop[]>([{ city: '', country: '', month: '' }]);
  const [activities, setActivities] = useState<ActivityEntry[]>([
    { status: 'live', label: 'LIVE NOW', location: '', title: '', description: '', cta: '' },
    { status: 'upcoming', label: 'Upcoming', location: '', title: '', description: '', cta: '' },
    { status: 'past', label: 'Past', location: '', title: '', description: '' },
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const heroRef = useRef<HTMLInputElement>(null);
  const profileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setGlobalNavHidden(true);
    return () => setGlobalNavHidden(false);
  }, [setGlobalNavHidden]);

  useEffect(() => {
    if (!editId) return;
    const unsub = peopleService.subscribeOne(editId, (data) => {
      if (!data) return;
      setName(data.name || '');
      setRoles(data.roles || []);
      setTitle(data.title || '');
      setBio(data.bio || '');
      setBaseCity(data.baseCity || '');
      setBaseCountry(data.baseCountry || '');
      setCurrentCity(data.currentCity || '');
      setCurrentCountry(data.currentCountry || '');
      setIsLiveNow(data.isLiveNow || false);
      setLiveStatus(data.liveStatus || '');
      setLanguages((data.languages || []).join(', '));
      setBookingNote(data.bookingNote || '');
      setPartnerName(data.partnerName || '');
      setStyle(data.style || '');
      setPartnerSince(data.partnerSince || '');
      setHeroPreview(data.heroImageUrl || '');
      setProfilePreview(data.profilePhotoUrl || '');
      if (data.tourStops?.length) setTourStops(data.tourStops);
      if (data.activityFlow?.length) setActivities(data.activityFlow as ActivityEntry[]);
      unsub();
    });
  }, [editId]);

  const getRoleLabel = (role: PersonRole) => {
    switch (role) {
      case 'Instructor': return t('people.filter_instructor', '강사');
      case 'DJ': return t('people.filter_dj', 'DJ');
      case 'Organizer': return t('people.filter_organizer', '오거나이저');
      case 'Seller': return t('people.filter_seller', '판매자');
      case 'Couple': return t('people.filter_couples', '커플');
      case 'Touring': return t('people.filter_touring', '투어링');
      case 'Dancer': return t('people.filter_dancer', '댄서');
      default: return role;
    }
  };

  const toggleRole = (r: PersonRole) => {
    setRoles(prev => prev.includes(r) ? prev.filter(x => x !== r) : [...prev, r]);
  };

  const updateTour = (i: number, field: keyof TourStop, val: string) => {
    setTourStops(prev => prev.map((t, idx) => idx === i ? { ...t, [field]: val } : t));
  };
  const addTourStop = () => setTourStops(prev => [...prev, { city: '', country: '', month: '' }]);
  const removeTourStop = (i: number) => setTourStops(prev => prev.filter((_, idx) => idx !== i));

  const updateActivity = (i: number, field: keyof ActivityEntry, val: string) => {
    setActivities(prev => prev.map((a, idx) => idx === i ? { ...a, [field]: val } : a));
  };

  const handleHeroChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setHeroFile(f);
    setHeroPreview(URL.createObjectURL(f));
  };

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setProfileFile(f);
    setProfilePreview(URL.createObjectURL(f));
  };

  const handleHeaderBack = useCallback(() => {
    if (step > 1) {
      setStep(prev => prev - 1);
    } else {
      const hasDraft = Boolean(name.trim() || roles.length > 0 || heroPreview || profilePreview);
      if (hasDraft) {
        if (confirm(t('common.confirm_discard', '작성 중인 내용이 있습니다. 정말 나가시겠습니까?'))) {
          router.back();
        }
      } else {
        router.back();
      }
    }
  }, [step, name, roles.length, heroPreview, profilePreview, t, router]);

  const isStep1Valid = name.trim().length > 0 && roles.length > 0;
  const isStep2Valid = true; // Base city/country optional
  const isStep3Valid = true;
  const isStep4Valid = true;

  const handleSubmit = async () => {
    if (!user) {
      alert(t('people.alert_login_req', '로그인이 필요합니다.'));
      return;
    }
    if (!name.trim() || roles.length === 0) {
      alert(t('people.alert_name_role_req', '성함과 역할 분야를 필수 입력해 주세요.'));
      return;
    }

    setIsSubmitting(true);
    try {
      let heroUrl = heroPreview;
      let profileUrl = profilePreview;

      if (heroFile) {
        heroUrl = await storageService.uploadFile(heroFile, `people/${Date.now()}_hero`);
      }
      if (profileFile) {
        profileUrl = await storageService.uploadFile(profileFile, `people/${Date.now()}_profile`);
      }

      const payload: Omit<Person, 'id' | 'createdAt' | 'updatedAt'> = {
        userId: user.uid,
        name,
        roles,
        title,
        bio,
        baseCity,
        baseCountry,
        currentCity,
        currentCountry,
        isLiveNow,
        liveStatus,
        heroImageUrl: heroUrl,
        profilePhotoUrl: profileUrl,
        languages: languages.split(',').map(l => l.trim()).filter(Boolean),
        bookingNote,
        partnerName,
        style,
        partnerSince,
        achievements: [],
        activityFlow: activities.filter(a => a.title.trim()),
        tourStops: tourStops.filter(t => t.city.trim()),
        mediaItems: [],
        featuredVideoUrls: [],
        authorId: user.uid,
        authorName: user.displayName || 'Anonymous',
        authorPhoto: user.photoURL || undefined,
      };

      if (editId) {
        await peopleService.update(editId, payload);
        router.back();
      } else {
        const newId = await peopleService.add(payload);
        router.replace('/create-success?type=people&id=' + newId);
      }
    } catch (err) {
      console.error(err);
      alert(t('people.alert_error', '저장 중 오류가 발생했습니다.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const headerTitle = editId
    ? (language === 'KR' ? '주요 인물정보 수정' : 'Edit Key People')
    : (language === 'KR' ? '주요 인물등록' : 'Register Key People');

  const stepCategoryTitle = 
    step === 1 ? (language === 'KR' ? '기본 인적 정보' : 'Basic Info') :
    step === 2 ? (language === 'KR' ? '활동 거점 및 소재지' : 'Base & Location') :
    step === 3 ? (language === 'KR' ? '바이오 및 섭외 안내' : 'Bio & Contact') :
    (language === 'KR' ? '투어 및 활동 일정' : 'Tour & Timeline');

  return (
    <main className="max-w-md mx-auto min-h-screen bg-[#FAF8FF] text-slate-800 font-body antialiased flex flex-col relative notranslate">
      {/* Header */}
      <header 
        className="fixed top-0 left-0 right-0 max-w-md mx-auto w-full flex-shrink-0 bg-white border-b border-slate-100 px-4 flex items-center justify-between z-[100010]"
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
          {headerTitle}
        </h1>
        <div className="w-10" />
      </header>

      {/* Header Spacer */}
      <div 
        className="w-full flex-shrink-0"
        style={{ height: 'calc(56px + env(safe-area-inset-top, 0px))' }} 
      />

      {/* Step Indicator Bar */}
      <div className="w-full px-4 mt-3 flex-shrink-0">
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
      <div className="flex-1 w-full px-4 py-4 overflow-y-auto pb-28 space-y-6">
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Photos Card */}
            <div className="border border-[#e0e4e5] rounded-2xl bg-white shadow-sm p-4 space-y-4">
              <div className="flex items-center gap-2 border-b border-[#e0e4e5] pb-3 mb-1">
                <span className="material-symbols-rounded text-sm text-[#007AFF]">portrait</span>
                <p className="text-[14px] font-bold text-[#007AFF]">
                  {language === 'KR' ? '프로필 및 히어로 이미지' : 'Profile & Hero Media'}
                </p>
              </div>

              {/* Profile Photo */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  {t('people.form_profile', '프로필 사진')}
                </label>
                <div className="flex items-center gap-4">
                  <div
                    onClick={() => profileRef.current?.click()}
                    className="w-20 h-20 rounded-full overflow-hidden border-2 border-dashed border-slate-200 bg-slate-50 flex items-center justify-center cursor-pointer hover:border-[#007AFF]/40 transition-colors"
                  >
                    {profilePreview
                      ? <img src={profilePreview} alt="Profile" className="w-full h-full object-cover" />
                      : <span className="material-symbols-rounded text-3xl text-slate-300">person</span>
                    }
                  </div>
                  <button
                    type="button"
                    onClick={() => profileRef.current?.click()}
                    className="text-xs font-bold text-[#007AFF] bg-[#007AFF]/10 px-3.5 py-2 rounded-xl"
                  >
                    {t('people.form_profile_tap', '사진 등록/변경')}
                  </button>
                </div>
                <input ref={profileRef} type="file" accept="image/*" className="hidden" onChange={handleProfileChange} />
              </div>

              {/* Hero Image */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  {t('people.form_hero', '메인 배너/히어로 사진')}
                </label>
                <div
                  onClick={() => heroRef.current?.click()}
                  className="w-full h-40 rounded-2xl overflow-hidden border-2 border-dashed border-slate-200 bg-slate-50 flex items-center justify-center cursor-pointer hover:border-[#007AFF]/40 transition-colors relative"
                >
                  {heroPreview
                    ? <img src={heroPreview} alt="Hero" className="w-full h-full object-cover" />
                    : <div className="flex flex-col items-center text-slate-300">
                        <span className="material-symbols-rounded text-3xl">add_photo_alternate</span>
                        <span className="text-xs font-bold text-slate-400 mt-1">{t('people.form_hero_tap', '터치하여 대표 이미지 등록')}</span>
                      </div>
                  }
                </div>
                <input ref={heroRef} type="file" accept="image/*" className="hidden" onChange={handleHeroChange} />
              </div>
            </div>

            {/* Name & Title Card */}
            <div className="border border-[#e0e4e5] rounded-2xl bg-white shadow-sm p-4 space-y-4">
              <div className="flex items-center gap-2 border-b border-[#e0e4e5] pb-3 mb-1">
                <span className="material-symbols-rounded text-sm text-[#007AFF]">badge</span>
                <p className="text-[14px] font-bold text-[#007AFF]">
                  {language === 'KR' ? '인물 명칭 및 타이틀' : 'Identity & Title'}
                </p>
              </div>

              {/* Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {t('people.form_name', '성함 (아티스트/활동명)')} <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g., Sofia Alvarez"
                  className="w-full bg-[#f8f9fa] border border-[#e0e4e5] rounded-xl px-3.5 py-2.5 text-sm font-bold focus:outline-none focus:border-[#007AFF] text-slate-800"
                />
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {t('people.form_title', '한 줄 소개 / 직함')}
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g., Master Instructor • Global Performer"
                  className="w-full bg-[#f8f9fa] border border-[#e0e4e5] rounded-xl px-3.5 py-2.5 text-sm font-bold focus:outline-none focus:border-[#007AFF] text-slate-800"
                />
              </div>

              {/* Roles */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  {t('people.form_roles', '활동 분야 (다중 선택)')} <span className="text-red-500">*</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {ROLE_OPTIONS.map(r => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => toggleRole(r)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all border ${
                        roles.includes(r)
                          ? 'bg-[#007AFF] text-white border-[#007AFF] shadow-sm'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {getRoleLabel(r)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Base Location Card */}
            <div className="border border-[#e0e4e5] rounded-2xl bg-white shadow-sm p-4 space-y-4">
              <div className="flex items-center gap-2 border-b border-[#e0e4e5] pb-3 mb-1">
                <span className="material-symbols-rounded text-sm text-[#007AFF]">location_on</span>
                <p className="text-[14px] font-bold text-[#007AFF]">
                  {t('people.form_base_location', '주 활동 거점')}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">{t('people.form_city', '도시')}</label>
                  <input
                    type="text"
                    value={baseCity}
                    onChange={e => setBaseCity(e.target.value)}
                    placeholder="e.g. Buenos Aires"
                    className="w-full bg-[#f8f9fa] border border-[#e0e4e5] rounded-xl px-3.5 py-2.5 text-sm font-bold focus:outline-none focus:border-[#007AFF] text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">{t('people.form_country', '국가')}</label>
                  <input
                    type="text"
                    value={baseCountry}
                    onChange={e => setBaseCountry(e.target.value)}
                    placeholder="e.g. Argentina"
                    className="w-full bg-[#f8f9fa] border border-[#e0e4e5] rounded-xl px-3.5 py-2.5 text-sm font-bold focus:outline-none focus:border-[#007AFF] text-slate-800"
                  />
                </div>
              </div>
            </div>

            {/* Current Location & Live Status */}
            <div className="border border-[#e0e4e5] rounded-2xl bg-white shadow-sm p-4 space-y-4">
              <div className="flex items-center gap-2 border-b border-[#e0e4e5] pb-3 mb-1">
                <span className="material-symbols-rounded text-sm text-[#007AFF]">my_location</span>
                <p className="text-[14px] font-bold text-[#007AFF]">
                  {t('people.form_current_location', '현재 체류 위치')}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">{t('people.form_city', '현재 도시')}</label>
                  <input
                    type="text"
                    value={currentCity}
                    onChange={e => setCurrentCity(e.target.value)}
                    placeholder="e.g. Seoul"
                    className="w-full bg-[#f8f9fa] border border-[#e0e4e5] rounded-xl px-3.5 py-2.5 text-sm font-bold focus:outline-none focus:border-[#007AFF] text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">{t('people.form_country', '현재 국가')}</label>
                  <input
                    type="text"
                    value={currentCountry}
                    onChange={e => setCurrentCountry(e.target.value)}
                    placeholder="e.g. Korea"
                    className="w-full bg-[#f8f9fa] border border-[#e0e4e5] rounded-xl px-3.5 py-2.5 text-sm font-bold focus:outline-none focus:border-[#007AFF] text-slate-800"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-xs font-bold text-slate-700">{t('people.form_show_live', '실시간 상주 뱃지 표시')}</span>
                <button
                  type="button"
                  onClick={() => setIsLiveNow(p => !p)}
                  className={`w-11 h-6 rounded-full transition-all relative ${isLiveNow ? 'bg-[#007AFF]' : 'bg-slate-200'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${isLiveNow ? 'left-6' : 'left-1'}`} />
                </button>
              </div>

              {isLiveNow && (
                <input
                  type="text"
                  value={liveStatus}
                  onChange={e => setLiveStatus(e.target.value)}
                  placeholder={t('people.form_live_badge_placeholder', '상주 관련 안내 메시지 (예: 7월 25일까지 서울 체류)')}
                  className="w-full bg-[#f8f9fa] border border-[#e0e4e5] rounded-xl px-3.5 py-2.5 text-sm font-bold focus:outline-none focus:border-[#007AFF] text-slate-800"
                />
              )}
            </div>

            {/* Partner Info (if Couple) */}
            {roles.includes('Couple') && (
              <div className="border border-[#e0e4e5] rounded-2xl bg-white shadow-sm p-4 space-y-3">
                <p className="text-[14px] font-bold text-[#007AFF]">
                  {t('people.form_partner_info', '파트너 정보')}
                </p>
                <input
                  type="text"
                  value={partnerName}
                  onChange={e => setPartnerName(e.target.value)}
                  placeholder={t('people.form_partner_name', '파트너 성함')}
                  className="w-full bg-[#f8f9fa] border border-[#e0e4e5] rounded-xl px-3.5 py-2.5 text-sm font-bold outline-none focus:border-[#007AFF]"
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={style}
                    onChange={e => setStyle(e.target.value)}
                    placeholder={t('people.form_dance_style', '댄스 스타일')}
                    className="w-full bg-[#f8f9fa] border border-[#e0e4e5] rounded-xl px-3.5 py-2.5 text-sm font-bold outline-none focus:border-[#007AFF]"
                  />
                  <input
                    type="text"
                    value={partnerSince}
                    onChange={e => setPartnerSince(e.target.value)}
                    placeholder={t('people.form_since', '활동 시기 (예: Since 2018)')}
                    className="w-full bg-[#f8f9fa] border border-[#e0e4e5] rounded-xl px-3.5 py-2.5 text-sm font-bold outline-none focus:border-[#007AFF]"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Bio Card */}
            <div className="border border-[#e0e4e5] rounded-2xl bg-white shadow-sm p-4 space-y-4">
              <div className="flex items-center gap-2 border-b border-[#e0e4e5] pb-3 mb-1">
                <span className="material-symbols-rounded text-sm text-[#007AFF]">article</span>
                <p className="text-[14px] font-bold text-[#007AFF]">
                  {t('people.form_bio', '상세 자기소개 (Bio)')}
                </p>
              </div>
              <textarea
                rows={5}
                value={bio}
                onChange={e => setBio(e.target.value)}
                placeholder={t('people.form_bio_placeholder', '주요 이력, 춤 사상, 주최/참여 행사 등 인물 상세 소개를 작성해 주세요.')}
                className="w-full bg-[#f8f9fa] border border-[#e0e4e5] rounded-xl p-3 text-sm font-bold focus:outline-none focus:border-[#007AFF] text-slate-800 resize-none"
              />
            </div>

            {/* Languages & Booking Note Card */}
            <div className="border border-[#e0e4e5] rounded-2xl bg-white shadow-sm p-4 space-y-4">
              <div className="flex items-center gap-2 border-b border-[#e0e4e5] pb-3 mb-1">
                <span className="material-symbols-rounded text-sm text-[#007AFF]">contact_support</span>
                <p className="text-[14px] font-bold text-[#007AFF]">
                  {language === 'KR' ? '언어 및 섭외 정보' : 'Languages & Booking'}
                </p>
              </div>

              {/* Languages */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">{t('people.form_languages', '구사 가능 언어')}</label>
                <input
                  type="text"
                  value={languages}
                  onChange={e => setLanguages(e.target.value)}
                  placeholder={t('people.form_languages_placeholder', '예: Spanish, English, Korean')}
                  className="w-full bg-[#f8f9fa] border border-[#e0e4e5] rounded-xl px-3.5 py-2.5 text-sm font-bold focus:outline-none focus:border-[#007AFF] text-slate-800"
                />
              </div>

              {/* Booking Note */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">{t('people.form_booking_note', '섭외 및 워크숍 관련 안내')}</label>
                <input
                  type="text"
                  value={bookingNote}
                  onChange={e => setBookingNote(e.target.value)}
                  placeholder={t('people.form_booking_placeholder', '예: 2026 하반기 워크숍/DJ 섭외 문의 접수 중')}
                  className="w-full bg-[#f8f9fa] border border-[#e0e4e5] rounded-xl px-3.5 py-2.5 text-sm font-bold focus:outline-none focus:border-[#007AFF] text-slate-800"
                />
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Tour Schedule Card */}
            <div className="border border-[#e0e4e5] rounded-2xl bg-white shadow-sm p-4 space-y-4">
              <div className="flex items-center justify-between border-b border-[#e0e4e5] pb-3 mb-1">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-rounded text-sm text-[#007AFF]">flight_takeoff</span>
                  <p className="text-[14px] font-bold text-[#007AFF]">
                    {t('people.form_tour_schedule', '투어 일정 (Tour Schedule)')}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addTourStop}
                  className="text-xs font-bold text-[#007AFF] bg-[#007AFF]/10 px-3 py-1 rounded-lg"
                >
                  + {t('people.form_add', '추가')}
                </button>
              </div>

              <div className="space-y-2">
                {tourStops.map((stop, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <input
                      type="text"
                      value={stop.city}
                      onChange={e => updateTour(i, 'city', e.target.value)}
                      placeholder={t('people.form_city', '도시')}
                      className="flex-1 bg-[#f8f9fa] border border-[#e0e4e5] rounded-xl px-3 py-2 text-xs font-medium outline-none focus:border-[#007AFF]"
                    />
                    <input
                      type="text"
                      value={stop.country}
                      onChange={e => updateTour(i, 'country', e.target.value)}
                      placeholder={t('people.form_country', '국가')}
                      className="w-24 bg-[#f8f9fa] border border-[#e0e4e5] rounded-xl px-3 py-2 text-xs font-medium outline-none focus:border-[#007AFF]"
                    />
                    <input
                      type="text"
                      value={stop.month}
                      onChange={e => updateTour(i, 'month', e.target.value)}
                      placeholder={t('people.form_month', '월 (예: Jul)')}
                      className="w-20 bg-[#f8f9fa] border border-[#e0e4e5] rounded-xl px-3 py-2 text-xs font-medium outline-none focus:border-[#007AFF]"
                    />
                    {tourStops.length > 1 && (
                      <button type="button" onClick={() => removeTourStop(i)} className="text-red-400">
                        <span className="material-symbols-rounded text-xl">remove_circle</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Activity Flow Card */}
            <div className="border border-[#e0e4e5] rounded-2xl bg-white shadow-sm p-4 space-y-4">
              <div className="flex items-center gap-2 border-b border-[#e0e4e5] pb-3 mb-1">
                <span className="material-symbols-rounded text-sm text-[#007AFF]">timeline</span>
                <p className="text-[14px] font-bold text-[#007AFF]">
                  {t('people.form_activity_flow', '주요 활동 타임라인')}
                </p>
              </div>

              <div className="space-y-4">
                {activities.map((act, i) => (
                  <div key={i} className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                    <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${act.status === 'live' ? 'bg-[#007AFF]/10 text-[#007AFF]' : act.status === 'upcoming' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
                      {t('people.form_status_' + act.status, act.status.toUpperCase())}
                    </span>
                    <input
                      type="text"
                      value={act.location}
                      onChange={e => updateActivity(i, 'location', e.target.value)}
                      placeholder={t('people.form_activity_location', '위치/장소')}
                      className="w-full bg-white border border-[#e0e4e5] rounded-xl px-3 py-2 text-xs font-medium outline-none focus:border-[#007AFF]"
                    />
                    <input
                      type="text"
                      value={act.title}
                      onChange={e => updateActivity(i, 'title', e.target.value)}
                      placeholder={t('people.form_activity_title', '활동/행사 제목')}
                      className="w-full bg-white border border-[#e0e4e5] rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-[#007AFF]"
                    />
                    <textarea
                      rows={2}
                      value={act.description}
                      onChange={e => updateActivity(i, 'description', e.target.value)}
                      placeholder={t('people.form_activity_desc', '활동 세부 설명')}
                      className="w-full bg-white border border-[#e0e4e5] rounded-xl px-3 py-2 text-xs font-medium outline-none resize-none focus:border-[#007AFF]"
                    />
                    {(act.status === 'upcoming') && (
                      <input
                        type="text"
                        value={act.cta || ''}
                        onChange={e => updateActivity(i, 'cta', e.target.value)}
                        placeholder={t('people.form_activity_cta', '신청/안내 링크 또는 문구')}
                        className="w-full bg-white border border-[#e0e4e5] rounded-xl px-3 py-2 text-xs font-medium outline-none focus:border-[#007AFF]"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Fixed Bottom Action Bar */}
      <footer 
        className="fixed bottom-0 left-0 right-0 max-w-md mx-auto w-full bg-white border-t border-slate-100 px-4 flex items-center justify-between z-[100010] shadow-lg"
        style={{
          paddingTop: '16px',
          paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 0px))',
          height: 'calc(76px + env(safe-area-inset-bottom, 0px))'
        }}
      >
        <div className="flex w-full gap-3">
          {step > 1 && (
            <button
              type="button"
              onClick={() => setStep(prev => prev - 1)}
              className="flex-grow py-3.5 rounded-full border border-slate-200 text-slate-700 text-sm font-bold active:scale-95 transition-transform"
            >
              {language === 'KR' ? '이전 단계' : 'Previous'}
            </button>
          )}
          {step < TOTAL_STEPS ? (
            <button
              type="button"
              onClick={() => setStep(prev => prev + 1)}
              disabled={step === 1 ? !isStep1Valid : false}
              className="flex-grow py-3.5 rounded-full bg-[#007AFF] text-white text-sm font-bold active:scale-95 transition-all disabled:opacity-50 shadow-sm"
            >
              {language === 'KR' ? `다음 단계 (${step + 1}/${TOTAL_STEPS})` : `Next Step (${step + 1}/${TOTAL_STEPS})`}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-grow py-3.5 rounded-full bg-[#007AFF] text-white text-sm font-bold active:scale-95 transition-all disabled:opacity-50 shadow-sm"
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>{editId ? t('people.form_submit_processing', '저장 중...') : t('people.form_submit_processing', '등록 중...')}</span>
                </div>
              ) : (
                <span>{editId ? t('people.form_submit_update', '수정 완료') : t('people.form_submit_register', '주요 인물등록 완결')}</span>
              )}
            </button>
          )}
        </div>
      </footer>
    </main>
  );
}

export default function PeopleRegisterPage() {
  return (
    <Suspense fallback={
      <div className="max-w-md mx-auto min-h-screen bg-[#FAF8FF] flex items-center justify-center">
        <span className="material-symbols-rounded animate-spin text-slate-300 text-4xl">progress_activity</span>
      </div>
    }>
      <RegisterPageContent />
    </Suspense>
  );
}
