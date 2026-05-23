'use client';

import React, { useState, useEffect, useRef } from 'react';
import { doc, updateDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { toast } from 'sonner';
import { db } from '@/lib/firebase/clientApp';
import { storageService } from '@/lib/firebase/storageService';
import { useAuth } from '@/components/providers/AuthProvider';
import { useLanguage } from '@/contexts/LanguageContext';
import DeactivateBottomSheet from './DeactivateBottomSheet';
import { formatLocalPhoneNumber } from '@/utils/phone';

interface UserProfile {
  uid: string;
  email: string | null;
  nickname: string;
  nativeNickname?: string;
  bio?: string;
  countryCode: string;
  photoURL: string | null;
  phoneNumber?: string;
  gender?: string;
  isRegistered: boolean;
  isAdmin?: boolean;
  isInstructor?: boolean;
  isOrganizer?: boolean;
  isDj?: boolean;
  isServiceProvider?: boolean;
  authMethod?: string;
  allowPhoneCalls?: boolean;
  allowChatNotifications?: boolean;
  role?: 'leader' | 'follower';
  career?: string;
  partnerStatus?: string;
}

interface MyInfoBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile | null;
}

export default function MyInfoBottomSheet({ isOpen, onClose, profile }: MyInfoBottomSheetProps) {
  const { user, signOut } = useAuth();
  const { t } = useLanguage();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDeactivateOpen, setIsDeactivateOpen] = useState(false);
  const [details, setDetails] = useState({
    nickname: '',
    nativeNickname: '',
    bio: '',
    gender: 'Other',
    phoneNumber: '',
    countryCode: '+1 (US)',
    isAdmin: false,
    isInstructor: false,
     isOrganizer: false,
    isDj: false,
    isServiceProvider: false,
    photoURL: '',
    allowPhoneCalls: true,
    allowChatNotifications: true,
    role: 'follower' as 'leader' | 'follower',
    career: '',
    partnerStatus: 'none'
  });

  const [careerYear, setCareerYear] = useState('');
  const [careerMonth, setCareerMonth] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (profile) {
      setDetails({
        nickname: profile.nickname || '',
        nativeNickname: profile.nativeNickname || '',
        bio: profile.bio || '',
        gender: profile.gender || 'Other',
        phoneNumber: formatLocalPhoneNumber(profile.phoneNumber, profile.countryCode || '+1 (US)'),
        countryCode: profile.countryCode || '+1 (US)',
        isAdmin: profile.isAdmin || false,
        isInstructor: profile.isInstructor || false,
        isOrganizer: profile.isOrganizer || false,
        isDj: profile.isDj || false,
        isServiceProvider: profile.isServiceProvider || false,
        photoURL: profile.photoURL || '',
        allowPhoneCalls: profile.allowPhoneCalls !== false,
        allowChatNotifications: profile.allowChatNotifications !== false,
        role: profile.role || 'follower',
        career: profile.career || '',
        partnerStatus: profile.partnerStatus || 'none'
      });

      // 경력 YYYY-MM 파싱
      let cYear = '';
      let cMonth = '';
      if (profile.career && /^\d{4}-\d{2}$/.test(profile.career)) {
        const [y, m] = profile.career.split('-');
        cYear = y;
        cMonth = m;
      }
      setCareerYear(cYear);
      setCareerMonth(cMonth);
    }
  }, [profile, isOpen]);

  const handleCareerYearChange = (year: string) => {
    setCareerYear(year);
    if (year && careerMonth) {
      setDetails(prev => ({ ...prev, career: `${year}-${careerMonth}` }));
    } else {
      setDetails(prev => ({ ...prev, career: '' }));
    }
  };

  const handleCareerMonthChange = (month: string) => {
    setCareerMonth(month);
    if (careerYear && month) {
      setDetails(prev => ({ ...prev, career: `${careerYear}-${month}` }));
    } else {
      setDetails(prev => ({ ...prev, career: '' }));
    }
  };

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && profile) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error(t('myinfo.photo_size_error'));
        return;
      }

      // Create a temporary blob URL for immediate preview
      const blobUrl = URL.createObjectURL(file);
      setDetails(prev => ({ ...prev, photoURL: blobUrl }));
      
      setUploading(true);
      setIsOptimizing(true);
      setUploadProgress(0);
      
      try {
        const path = `profiles/${profile.uid}/${Date.now()}_profile`;
        const downloadURL = await storageService.uploadFile(file, path, (progress) => {
          if (progress > 0) setIsOptimizing(false);
          setUploadProgress(Math.round(progress));
        });
        
        // Revoke the blob URL to free up memory
        URL.revokeObjectURL(blobUrl);
        
        setDetails(prev => ({ ...prev, photoURL: downloadURL }));
        toast.success(t('myinfo.photo_upload_complete'));
      } catch (err) {
        console.error('Photo handling error:', err);
        // Fallback to original photo on error
        setDetails(prev => ({ ...prev, photoURL: profile.photoURL || '' }));
        toast.error(t('myinfo.photo_upload_fail'));
      } finally {
        setUploading(false);
        setIsOptimizing(false);
        setUploadProgress(0);
      }
    }
  };

  if (!isOpen || !profile) return null;

  const handleSave = async () => {
    setSaving(true);
    try {
      const userDocRef = doc(db, 'users', profile.uid);
      await updateDoc(userDocRef, {
        nickname: details.nickname,
        nativeNickname: details.nativeNickname,
        bio: details.bio,
        gender: details.gender,
        role: details.role,
        phoneNumber: details.phoneNumber,
        countryCode: details.countryCode,
        isAdmin: details.isAdmin,
        isInstructor: details.isInstructor,
        isOrganizer: details.isOrganizer,
        isDj: details.isDj,
        isServiceProvider: details.isServiceProvider,
        photoURL: details.photoURL,
        allowPhoneCalls: details.allowPhoneCalls,
        allowChatNotifications: details.allowChatNotifications,
        career: details.career,
        partnerStatus: details.partnerStatus,
        updatedAt: serverTimestamp()
      });
      onClose();
      toast.success(t('myinfo.save_success'));
    } catch (error) {
      console.error('Update profile error:', error);
      toast.error(t('myinfo.save_error'));
    } finally {
      setSaving(false);
    }
  };

  const onDeactivate = async () => {
    try {
      await deleteDoc(doc(db, 'users', profile.uid));
      await signOut();
      window.location.href = '/';
    } catch (err) {
      console.error('Deactivation error:', err);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex flex-col justify-end animate-in fade-in duration-300"
      onClick={onClose}
    >
      <div 
        className="bg-surface w-full relative flex flex-col overflow-hidden bottom-sheet-container animate-in slide-in-from-bottom duration-500"
        style={{ height: 'calc(100% - 48px)', borderRadius: '24px 24px 0 0' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Grab Handle */}
        <div className="w-full flex justify-center py-3 shrink-0 cursor-pointer" onClick={onClose}>
          <div className="w-12 h-1.5 bg-gray-300 rounded-full"></div>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto hide-scrollbar">
          <main className="pt-2 pb-12 max-w-2xl mx-auto px-6 space-y-12">
            
            {/* Section 1: Profile Photo */}
            <section className="flex flex-col items-center gap-6">
              <div className="relative group cursor-pointer" onClick={handlePhotoClick}>
                <div className="w-32 h-32 rounded-squircle overflow-hidden border-4 border-surface shadow-sm bg-surface-container relative flex items-center justify-center">
                  <span className="material-symbols-outlined text-on-surface-variant absolute" style={{ fontSize: '64px', fontVariationSettings: "'FILL' 1" }}>person</span>
                  
                  {/* Photo Display */}
                  {details.photoURL && details.photoURL !== 'https://lh3.googleusercontent.com/a/default-user' && (
                    <img 
                      src={details.photoURL} 
                      alt="Profile" 
                      className="w-full h-full object-cover relative z-10"
                      onError={(e) => e.currentTarget.style.display = 'none'}
                    />
                  )}

                  {/* Upload Overlay */}
                  {uploading && (
                    <div className="absolute inset-0 bg-black/60 z-30 backdrop-blur-md flex flex-col items-center justify-center animate-in fade-in duration-300">
                      <div className="relative w-16 h-16">
                        <svg className="w-full h-full -rotate-90">
                          <circle
                            cx="32"
                            cy="32"
                            r="28"
                            stroke="currentColor"
                            strokeWidth="3"
                            fill="transparent"
                            className="text-white/10"
                          />
                          <circle
                            cx="32"
                            cy="32"
                            r="28"
                            stroke="currentColor"
                            strokeWidth="3"
                            fill="transparent"
                            strokeDasharray={2 * Math.PI * 28}
                            strokeDashoffset={2 * Math.PI * 28 * (1 - uploadProgress / 100)}
                            className="text-primary transition-all duration-300 ease-out"
                            strokeLinecap="round"
                          />
                        </svg>
                        <span className="absolute inset-0 flex items-center justify-center text-[11px] font-black text-white">
                          {isOptimizing ? '...' : `${uploadProgress}%`}
                        </span>
                      </div>
                      <p className="text-[9px] text-white/50 font-black mt-3 uppercase tracking-widest">
                        {isOptimizing ? t('myinfo.optimizing') : t('myinfo.uploading')}
                      </p>
                    </div>
                  )}
                </div>
                <div className="absolute inset-0 bg-black/20 rounded-squircle opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="material-symbols-outlined text-white text-3xl">edit</span>
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*" 
                  onChange={handlePhotoChange}
                />
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={handlePhotoClick}
                  type="button"
                  disabled={uploading}
                  className="px-4 py-2 bg-primary text-on-primary font-medium text-sm rounded shadow-sm hover:brightness-110 transition-all disabled:opacity-50"
                >
                  {uploading ? (isOptimizing ? t('myinfo.optimizing') : t('myinfo.uploading')) : t('myinfo.photo_change')}
                </button>
                <button 
                  onClick={() => setDetails(prev => ({ ...prev, photoURL: '' }))}
                  type="button"
                  className="px-4 py-2 bg-surface-container-high text-on-surface-variant font-medium text-sm rounded hover:bg-surface-dim transition-all"
                >
                  {t('myinfo.photo_delete')}
                </button>
              </div>
            </section>

            {/* Section 2: Personal Details */}
            <section className="space-y-6">
              <h2 className="font-headline text-lg font-bold text-on-surface">{t('myinfo.personal_details')}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5 col-span-2 md:col-span-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-outline">{t('myinfo.full_name_en')}</label>
                  <input 
                    className="w-full bg-surface border border-outline-variant rounded px-4 py-2.5 text-on-surface focus:ring-1 focus:ring-primary focus:border-primary transition-all outline-none" 
                    type="text" 
                    value={details.nickname}
                    onChange={(e) => setDetails(prev => ({ ...prev, nickname: e.target.value.replace(/[^a-zA-Z0-9_.\-\s]/g, '') }))}
                  />
                </div>
                <div className="space-y-1.5 col-span-2 md:col-span-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-outline">{t('myinfo.native_name')}</label>
                  <input 
                    className="w-full bg-surface border border-outline-variant rounded px-4 py-2.5 text-on-surface focus:ring-1 focus:ring-primary focus:border-primary transition-all outline-none" 
                    placeholder={t('myinfo.native_name_placeholder')}
                    type="text"
                    value={details.nativeNickname}
                    onChange={(e) => setDetails(prev => ({ ...prev, nativeNickname: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5 col-span-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-outline">{t('myinfo.bio')}</label>
                  <textarea 
                    className="w-full bg-surface border border-outline-variant rounded px-4 py-2.5 text-on-surface focus:ring-1 focus:ring-primary focus:border-primary transition-all outline-none resize-none" 
                    rows={3}
                    value={details.bio}
                    onChange={(e) => setDetails(prev => ({ ...prev, bio: e.target.value }))}
                  />
                </div>
              </div>
            </section>

            {/* Section 3: Contact Info */}
            <section className="space-y-6">
              <h2 className="font-headline text-lg font-bold text-on-surface">{t('myinfo.contact_info')}</h2>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-outline">{t('myinfo.email')}</label>
                  <div className="relative flex items-center">
                    <input 
                      className="w-full bg-surface-container-low border border-outline-variant rounded px-4 py-2.5 text-on-surface-variant cursor-not-allowed pr-32" 
                      readOnly 
                      type="email" 
                      value={profile.email || ''}
                    />
                    <div className="absolute right-3 flex items-center gap-1.5 bg-blue-50 text-primary px-2 py-1 rounded text-[10px] font-bold border border-blue-100 uppercase tracking-tighter">
                      <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                      {t('myinfo.verified')}
                    </div>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-outline">{t('myinfo.cell_phone')}</label>
                  <div className="flex gap-2 w-full">
                    <div className="relative w-28 shrink-0">
                      <select 
                        className="w-full bg-surface border border-outline-variant rounded px-3 py-2.5 text-sm text-on-surface focus:ring-1 focus:ring-primary focus:border-primary appearance-none outline-none"
                        value={details.countryCode}
                        onChange={(e) => setDetails(prev => ({ ...prev, countryCode: e.target.value }))}
                      >
                        <option value="+1 (US)">+1 (US)</option>
                        <option value="+82 (KR)">+82 (KR)</option>
                        <option value="+44 (UK)">+44 (UK)</option>
                        <option value="+49 (DE)">+49 (DE)</option>
                      </select>
                      <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-outline text-lg">expand_more</span>
                    </div>
                    <input 
                      className="flex-1 min-w-0 bg-surface border border-outline-variant rounded px-4 py-2.5 text-on-surface focus:ring-1 focus:ring-primary focus:border-primary transition-all outline-none" 
                      type="tel" 
                      placeholder="01012345678"
                      value={details.phoneNumber}
                      onChange={(e) => setDetails(prev => ({ ...prev, phoneNumber: e.target.value }))}
                    />
                  </div>
                  <div className="flex flex-col mt-3 p-4 bg-surface-container-lowest border border-outline-variant/30 rounded-lg space-y-5">
                    {/* Item 1: 전화번호 공개 여부 */}
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[13px] font-bold text-on-surface">{t('myinfo.allow_calls')}</span>
                        <div className="flex items-center gap-5">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input 
                              type="radio" 
                              name="allowPhoneCalls"
                              checked={details.allowPhoneCalls === true}
                              onChange={() => setDetails(prev => ({ ...prev, allowPhoneCalls: true }))}
                              className="w-4 h-4 border-outline-variant text-primary focus:ring-primary accent-primary cursor-pointer"
                            />
                            <span className="text-xs font-bold text-on-surface-variant">{t('myinfo.allow_calls_on')}</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input 
                              type="radio" 
                              name="allowPhoneCalls"
                              checked={details.allowPhoneCalls === false}
                              onChange={() => setDetails(prev => ({ ...prev, allowPhoneCalls: false }))}
                              className="w-4 h-4 border-outline-variant text-primary focus:ring-primary accent-primary cursor-pointer"
                            />
                            <span className="text-xs font-bold text-on-surface-variant">{t('myinfo.allow_calls_off')}</span>
                          </label>
                        </div>
                      </div>
                      <p className="text-[11px] text-outline font-medium leading-relaxed mt-2.5 bg-surface-container-low p-2.5 rounded">
                        {t('myinfo.allow_calls_desc')}
                      </p>
                    </div>

                    {/* Divider */}
                    <div className="border-t border-outline-variant/20"></div>

                    {/* Item 2: 채팅 알림 허용 여부 */}
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[13px] font-bold text-on-surface">{t('myinfo.allow_chat_notifications')}</span>
                        <div className="flex items-center gap-5">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input 
                              type="radio" 
                              name="allowChatNotifications"
                              checked={details.allowChatNotifications === true}
                              onChange={() => setDetails(prev => ({ ...prev, allowChatNotifications: true }))}
                              className="w-4 h-4 border-outline-variant text-primary focus:ring-primary accent-primary cursor-pointer"
                            />
                            <span className="text-xs font-bold text-on-surface-variant">{t('myinfo.allow_calls_on')}</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input 
                              type="radio" 
                              name="allowChatNotifications"
                              checked={details.allowChatNotifications === false}
                              onChange={() => setDetails(prev => ({ ...prev, allowChatNotifications: false }))}
                              className="w-4 h-4 border-outline-variant text-primary focus:ring-primary accent-primary cursor-pointer"
                            />
                            <span className="text-xs font-bold text-on-surface-variant">{t('myinfo.allow_calls_off')}</span>
                          </label>
                        </div>
                      </div>
                      <p className="text-[11px] text-outline font-medium leading-relaxed mt-2.5 bg-surface-container-low p-2.5 rounded">
                        {t('myinfo.allow_chat_notifications_desc')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 4: Gender */}
            <section className="space-y-6">
              <h2 className="font-headline text-lg font-bold text-on-surface">{t('myinfo.gender')}</h2>
              <div className="flex bg-surface-container rounded p-1 max-w-md">
                {['Male', 'Female', 'Other'].map((g) => (
                  <button 
                    key={g}
                    onClick={() => setDetails(prev => ({ ...prev, gender: g }))}
                    type="button"
                    className={`flex-1 py-2 text-sm font-semibold rounded transition-all ${
                      details.gender === g 
                        ? 'bg-surface text-primary shadow-sm' 
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    {t(`myinfo.gender_${g.toLowerCase()}`)}
                  </button>
                ))}
              </div>
            </section>

            {/* Section 4.5: Dance Role */}
            <section className="space-y-6">
              <h2 className="font-headline text-lg font-bold text-on-surface">{t('myinfo.dance_role')}</h2>
              <div className="flex bg-surface-container rounded p-1 max-w-md">
                {['leader', 'follower'].map((r) => (
                  <button 
                    key={r}
                    onClick={() => setDetails(prev => ({ ...prev, role: r as 'leader' | 'follower' }))}
                    type="button"
                    className={`flex-1 py-2 text-sm font-semibold rounded transition-all ${
                      details.role === r 
                        ? 'bg-surface text-primary shadow-sm' 
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    {r === 'leader' ? 'Leader' : 'Follower'}
                  </button>
                ))}
              </div>
            </section>

            {/* Section 4.7: Career & Partner Status */}
            <section className="space-y-6">
              <h2 className="font-headline text-lg font-bold text-on-surface">Dance Profile Info</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Career Selector */}
                <div className="space-y-1.5 col-span-2 md:col-span-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-outline">{t('myinfo.career_start_date')}</label>
                  <div className="flex gap-2">
                    {/* Year Select */}
                    <div className="relative flex-1">
                      <select 
                        className="w-full bg-surface border border-outline-variant rounded px-3 py-2.5 text-sm text-on-surface focus:ring-1 focus:ring-primary focus:border-primary appearance-none outline-none"
                        value={careerYear}
                        onChange={(e) => handleCareerYearChange(e.target.value)}
                      >
                        <option value="">{t('myinfo.career_year')}</option>
                        {Array.from({ length: new Date().getFullYear() - 1970 + 1 }, (_, i) => {
                          const year = new Date().getFullYear() - i;
                          return <option key={year} value={year}>{year}{t('myinfo.career_year')}</option>;
                        })}
                      </select>
                      <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-outline text-lg">expand_more</span>
                    </div>

                    {/* Month Select */}
                    <div className="relative flex-1">
                      <select 
                        className="w-full bg-surface border border-outline-variant rounded px-3 py-2.5 text-sm text-on-surface focus:ring-1 focus:ring-primary focus:border-primary appearance-none outline-none"
                        value={careerMonth}
                        onChange={(e) => handleCareerMonthChange(e.target.value)}
                      >
                        <option value="">{t('myinfo.career_month')}</option>
                        {Array.from({ length: 12 }, (_, i) => {
                          const monthStr = String(i + 1).padStart(2, '0');
                          return <option key={monthStr} value={monthStr}>{i + 1}{t('myinfo.career_month')}</option>;
                        })}
                      </select>
                      <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-outline text-lg">expand_more</span>
                    </div>
                  </div>
                </div>

                {/* Partnership Status (Segmented Button) */}
                <div className="space-y-1.5 col-span-2 md:col-span-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-outline">{t('myinfo.partnership')}</label>
                  <div className="flex bg-surface-container rounded p-1">
                    {[
                      { id: 'none', label: t('myinfo.partnership_none') },
                      { id: 'has', label: t('myinfo.partnership_has') },
                      { id: 'searching', label: t('myinfo.partnership_searching') }
                    ].map((opt) => (
                      <button 
                        key={opt.id}
                        onClick={() => setDetails(prev => ({ ...prev, partnerStatus: opt.id }))}
                        type="button"
                        className={`flex-1 py-2 text-sm font-semibold rounded transition-all ${
                          details.partnerStatus === opt.id 
                            ? 'bg-surface text-primary shadow-sm' 
                            : 'text-on-surface-variant hover:text-on-surface'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* Section 5: Roles */}
            <section className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="font-headline text-lg font-bold text-on-surface">{t('myinfo.roles')}</h2>
                <span className="text-xs text-outline font-medium">{t('myinfo.roles_multi_select')}</span>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {[
                  { id: 'isInstructor', label: t('myinfo.role_instructor_label'), sub: t('myinfo.role_instructor_sub'), icon: 'school' },
                  { id: 'isOrganizer', label: t('myinfo.role_organizer_label'), sub: t('myinfo.role_organizer_sub'), icon: 'event' },
                  { id: 'isDj', label: t('myinfo.role_dj_label'), sub: t('myinfo.role_dj_sub'), icon: 'album' },
                  { id: 'isServiceProvider', label: t('myinfo.role_pro_label'), sub: t('myinfo.role_pro_sub'), icon: 'hand_gesture' }
                ].map((role) => {
                  const active = (details as any)[role.id];
                  return (
                    <div 
                      key={role.id}
                      onClick={() => setDetails(prev => ({ ...prev, [role.id]: !active }))}
                      className={`group relative flex items-center p-4 border rounded cursor-pointer hover:shadow-md transition-all ${
                        active 
                          ? 'border-primary bg-primary-container' 
                          : 'border-outline-variant bg-surface hover:border-primary'
                      }`}
                    >
                      <div className={`w-10 h-10 flex items-center justify-center rounded shrink-0 transition-colors ${
                        active ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface group-hover:bg-primary-container group-hover:text-primary'
                      }`}>
                        <span className="material-symbols-outlined">{role.icon}</span>
                      </div>
                      <div className="ml-4">
                        <p className={`font-headline font-bold ${active ? 'text-on-primary-container' : 'text-on-surface'}`}>{role.label}</p>
                        <p className={`text-xs ${active ? 'text-on-primary-fixed-variant' : 'text-on-surface-variant'}`}>{role.sub}</p>
                      </div>
                      <div className="ml-auto">
                        {active ? (
                          <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                        ) : (
                          <div className="w-6 h-6 border-2 border-outline-variant rounded-full group-hover:border-primary transition-colors"></div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Deactivation Section */}
            <section className="pt-8 border-t border-surface-container-high">
              <div className="bg-error/5 rounded-xl p-6 flex flex-col sm:flex-row items-start justify-between gap-6 border border-error/10">
                <div className="space-y-2">
                  <h3 className="font-headline font-bold text-error">{t('myinfo.deactivate_account')}</h3>
                  <p className="text-[11px] text-error/80 leading-relaxed max-w-sm">
                    {t('myinfo.deactivate_desc')}
                  </p>
                </div>
                <button 
                  onClick={() => setIsDeactivateOpen(true)}
                  type="button"
                  className="px-6 py-2.5 bg-error text-on-error font-bold text-sm rounded-lg shadow-sm hover:brightness-110 active:scale-95 transition-all shrink-0 w-full sm:w-auto"
                >
                  {t('myinfo.deactivate_btn')}
                </button>
              </div>
            </section>
          </main>
        </div>

        {/* Docked Action Button */}
        <div className="p-6 bg-surface border-t border-outline-variant/30 shrink-0">
          <button 
            onClick={handleSave}
            disabled={saving || uploading}
            type="button"
            className="w-full bg-primary text-on-primary py-4 rounded font-headline font-bold text-base shadow-lg active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {saving ? t('myinfo.saving') : t('myinfo.save_changes')}
          </button>
        </div>
      </div>

      {/* Deactivate Bottom Sheet */}
      <DeactivateBottomSheet 
        isOpen={isDeactivateOpen}
        onClose={() => setIsDeactivateOpen(false)}
        onConfirm={onDeactivate}
      />
    </div>
  );
}
