"use client";

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '@/components/providers/AuthProvider';
import { useRouter } from 'next/navigation';
import MyInfoBottomSheet from '@/components/profile/MyInfoBottomSheet';
import { useLanguage } from '@/contexts/LanguageContext';
import { calculateCareerDuration } from '@/utils/date';
import { formatLocalPhoneNumber } from '@/utils/phone';

const ADMIN_ITEMS = [
  { icon: 'view_carousel', label: 'BANNERS', href: '/admin/banners' },
  { icon: 'wallpaper', label: 'PICs', href: '/admin/pics' },
  { icon: 'person_search', label: 'People', href: '/admin/people' },
  { icon: 'location_city', label: 'Place', href: '/admin/place' },
  { icon: 'terminal', label: 'Mobile Agent', href: '/admin/antigravity' },
  { icon: 'more_horiz', label: 'Others', href: '/admin/others' },
];

export default function MyInfoPage() {
  const { user, profile, loading, signOut } = useAuth();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [adminPopupHref, setAdminPopupHref] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  const router = useRouter();
  const { t, language, toggleLanguage } = useLanguage();

  const handleLogout = async () => {
    try {
      await signOut();
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (loading) return null;

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4 text-center">
        <h1 className="text-2xl font-bold mb-4">{t('my.access_denied')}</h1>
        <p className="text-gray-500 mb-8">{t('my.sign_in_required')}</p>
        <button 
          onClick={() => router.push('/')}
          className="px-8 py-3 bg-primary text-white rounded-full font-bold"
        >
          {t('my.go_home')}
        </button>
      </div>
    );
  }

  return (
    <div className="bg-surface text-on-surface min-h-screen">
      <main className="max-w-3xl mx-auto px-4 py-6 md:py-8">
        {/* Profile Hero Section (Ultra-compact & Premium Card-like look) */}
        <div className="relative overflow-hidden p-6 rounded-2xl bg-gradient-to-br from-surface-container-lowest to-surface-container/30 border border-surface-container shadow-sm mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative group shrink-0">
              <div className="w-16 h-16 md:w-20 md:h-20 overflow-hidden rounded-full border-2 border-surface-container-lowest shadow-md bg-surface-container">
                <img 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                  src={profile?.photoURL || user?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.nickname || 'User')}&background=1A73E8&color=fff`}
                  alt={t('my.profile_photo')}
                />
              </div>
              <div 
                onClick={() => setIsEditModalOpen(true)}
                className="absolute -bottom-0.5 -right-0.5 bg-primary text-white p-1.5 rounded-full shadow-lg cursor-pointer hover:scale-110 transition-transform flex items-center justify-center z-10 border-2 border-surface"
              >
                <span className="material-symbols-outlined !text-[12px]">edit</span>
              </div>
            </div>
            
            <div className="min-w-0">
              <div className="flex flex-wrap items-baseline gap-2 mb-0.5">
                <h1 className="text-xl md:text-2xl font-bold tracking-tight text-on-surface font-headline truncate">
                  {profile?.nickname || user?.displayName || t('my.default_nickname')}
                </h1>
                <div className="flex flex-wrap gap-1">
                  {profile?.isInstructor && (
                    <span className="px-2 py-0.5 rounded bg-primary-container text-on-primary-container text-[9px] font-bold uppercase tracking-tighter">{t('my.role_instructor')}</span>
                  )}
                  {profile?.isDj && (
                    <span className="px-2 py-0.5 rounded bg-secondary-container text-on-secondary-container text-[9px] font-bold uppercase tracking-tighter">DJ</span>
                  )}
                  {profile?.isServiceProvider && (
                    <span className="px-2 py-0.5 rounded bg-tertiary-container text-on-tertiary-container text-[9px] font-bold uppercase tracking-tighter">{t('my.role_pro')}</span>
                  )}
                </div>
              </div>
              <p className="text-on-surface-variant font-medium text-xs md:text-sm line-clamp-1">
                {profile?.bio || t('my.default_bio')}
              </p>
            </div>
          </div>

          {/* New Compact Edit Button In Hero Section */}
          <button 
            onClick={() => setIsEditModalOpen(true)}
            className="flex items-center justify-center gap-1.5 self-start sm:self-center px-4 py-2 bg-primary/10 hover:bg-primary/15 active:scale-95 text-primary text-xs font-black uppercase tracking-wider rounded-xl transition-all border border-primary/20 shrink-0"
          >
            <span className="material-symbols-outlined text-[16px]">edit_square</span>
            <span>{t('my.modify_profile', 'Edit Profile')}</span>
          </button>
        </div>

        {/* Info Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Primary Identity Card */}
          <div className="p-8 rounded-2xl bg-surface-container-lowest border border-surface-container shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-10 h-10 flex flex-shrink-0 items-center justify-center rounded-lg bg-primary-fixed text-on-primary-fixed">
                <span className="material-symbols-outlined text-[24px]">account_circle</span>
              </div>
              <div>
                <p className="text-xs font-bold text-outline uppercase tracking-widest">{t('my.login_method')}</p>
                <p className="text-on-surface font-medium">
                  {profile?.authMethod 
                    ? t(`my.auth_${profile.authMethod.toLowerCase()}`) 
                    : t('my.auth_google')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-10 h-10 flex flex-shrink-0 items-center justify-center rounded-lg bg-primary-fixed text-on-primary-fixed">
                <span className="material-symbols-outlined text-[24px]">fingerprint</span>
              </div>
              <div>
                <p className="text-xs font-bold text-outline uppercase tracking-widest">{t('my.gender')}</p>
                <p className="text-on-surface font-medium">
                  {profile?.gender 
                    ? t(`my.gender_${profile.gender.toLowerCase()}`) 
                    : t('my.gender_other')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-10 h-10 flex flex-shrink-0 items-center justify-center rounded-lg bg-primary-fixed text-on-primary-fixed">
                <span className="material-symbols-outlined text-[24px]">alternate_email</span>
              </div>
              <div>
                <p className="text-xs font-bold text-outline uppercase tracking-widest">{t('my.email_address')}</p>
                <p className="text-on-surface font-medium truncate max-w-[200px]">{user?.email}</p>
              </div>
            </div>
            <div className="flex gap-4 items-center mb-6">
              <div className="w-10 h-10 flex flex-shrink-0 items-center justify-center rounded-lg bg-primary-fixed text-on-primary-fixed">
                <span className="material-symbols-outlined text-[24px]">call</span>
              </div>
              <div className="flex-grow">
                <p className="text-xs font-bold text-outline uppercase tracking-widest">{t('my.cell_phone')}</p>
                <div className="flex gap-2 items-center">
                  <span className="text-on-surface font-medium">{profile?.countryCode}</span>
                  <span className="text-on-surface font-medium">
                    {profile?.phoneNumber 
                      ? formatLocalPhoneNumber(profile.phoneNumber, profile.countryCode || '+1 (US)') 
                      : t('my.not_linked')}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex gap-4 items-center mb-6">
              <div className="w-10 h-10 flex flex-shrink-0 items-center justify-center rounded-lg bg-primary-fixed text-on-primary-fixed">
                <span className="material-symbols-outlined text-[24px]">timeline</span>
              </div>
              <div className="flex-grow">
                <p className="text-xs font-bold text-outline uppercase tracking-widest">{t('myinfo.career')}</p>
                <p className="text-on-surface font-medium">
                  {profile?.career 
                    ? calculateCareerDuration(profile.career, t) 
                    : t('my.not_linked')}
                </p>
              </div>
            </div>
            <div className="flex gap-4 items-center mb-6">
              <div className="w-10 h-10 flex flex-shrink-0 items-center justify-center rounded-lg bg-primary-fixed text-on-primary-fixed">
                <span className="material-symbols-outlined text-[24px]">handshake</span>
              </div>
              <div className="flex-grow">
                <p className="text-xs font-bold text-outline uppercase tracking-widest">{t('myinfo.partnership')}</p>
                <p className="text-on-surface font-medium">
                  {profile?.partnerStatus === 'has' 
                    ? t('myinfo.partnership_has') 
                    : profile?.partnerStatus === 'searching' 
                      ? t('myinfo.partnership_searching') 
                      : t('myinfo.partnership_none')}
                </p>
              </div>
            </div>
            <div className="flex gap-4 items-center">
              <div className="w-10 h-10 flex flex-shrink-0 items-center justify-center rounded-lg bg-primary-fixed text-on-primary-fixed">
                <span className="material-symbols-outlined text-[24px]">visibility</span>
              </div>
              <div className="flex-grow">
                <p className="text-xs font-bold text-outline uppercase tracking-widest">{t('myinfo.allow_calls')}</p>
                <p className="text-on-surface font-medium">
                  {profile?.allowPhoneCalls !== false 
                    ? t('myinfo.allow_calls_on') 
                    : t('myinfo.allow_calls_off')}
                </p>
              </div>
            </div>
          </div>

          {/* Account Summary Card - Refined to Premium Dark Glassmorphism */}
          <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 text-white shadow-xl flex flex-col justify-between relative overflow-hidden group">
            {/* Subtle glow effect */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/15 transition-all duration-500" />
            <div>
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">{t('my.pro_status')}</p>
              <div className="flex items-center gap-2 mb-3.5">
                <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">{t('my.verified')}</h2>
                <span className="material-symbols-outlined text-primary fill-1" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
              </div>
              <p className="text-xs text-slate-400 font-medium leading-relaxed">{t('my.verified_desc')}</p>
            </div>
            <div className="mt-8 pt-6 border-t border-slate-800/80">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3.5">{t('my.additional_verification')}</p>
              <button className="w-full py-3 px-4 bg-white/5 hover:bg-white/10 active:scale-98 border border-white/10 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-sm">verified_user</span>
                {t('my.apply_badge')}
              </button>
            </div>
          </div>

          {/* Preferences & Support Bento Card (Unified Settings Hub) */}
          <div className="p-8 rounded-2xl bg-surface-container-lowest border border-surface-container shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-[20px] text-primary">settings</span>
                <h3 className="text-xs font-black text-outline uppercase tracking-widest">{language === 'KR' ? '설정 및 고객지원' : 'PREFERENCES & SUPPORT'}</h3>
              </div>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                {language === 'KR' 
                  ? '다국어 환경을 제어하고 AI 고객지원 서비스를 실시간으로 이용할 수 있습니다.' 
                  : 'Manage language preferences and get immediate AI assistant support.'}
              </p>
            </div>

            {/* Hub Row Items */}
            <div className="space-y-4">
              {/* Row 1: AI Helpdesk Route */}
              <div 
                onClick={() => router.push('/helpdesk')}
                className="flex items-center justify-between p-3.5 bg-surface-container/50 hover:bg-surface-container hover:border-primary/20 border border-transparent rounded-xl cursor-pointer active:scale-98 transition-all duration-200 group/item"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 flex items-center justify-center rounded-lg bg-primary/10 text-primary group-hover/item:scale-105 transition-transform shrink-0">
                    <span className="material-symbols-outlined text-[20px]">support_agent</span>
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-on-surface tracking-tight">{t('header.help_desk', 'HELP DESK')}</h4>
                    <p className="text-[10px] text-on-surface-variant font-medium mt-0.5">{language === 'KR' ? 'AI 상담원과 1:1 채팅 문의' : '1:1 chat support with AI agent'}</p>
                  </div>
                </div>
                <span className="material-symbols-outlined text-[16px] text-outline group-hover/item:translate-x-0.5 transition-transform">arrow_forward_ios</span>
              </div>

              {/* Row 2: One-touch Language Toggle */}
              <div className="flex items-center justify-between p-3.5 bg-surface-container/50 border border-transparent rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 flex items-center justify-center rounded-lg bg-secondary/10 text-secondary shrink-0">
                    <span className="material-symbols-outlined text-[20px]">translate</span>
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-on-surface tracking-tight">{language === 'KR' ? '앱 언어 설정' : 'Application Language'}</h4>
                    <p className="text-[10px] text-on-surface-variant font-medium mt-0.5">{language === 'KR' ? '한글 / 영어 원터치 전환' : 'One-touch language switch'}</p>
                  </div>
                </div>
                
                {/* Premium Sliding Toggle Pill */}
                <div 
                  onClick={toggleLanguage}
                  className="flex items-center p-0.5 bg-surface-container rounded-full border border-outline/10 w-24 shrink-0 shadow-inner relative h-7 cursor-pointer hover:border-outline/20 transition-colors"
                >
                  {/* Active Underlay */}
                  <div 
                    className={`absolute top-0.5 bottom-0.5 rounded-full bg-primary text-white shadow-sm transition-all duration-300 ${
                      language === 'KR' ? 'left-0.5 w-[45px]' : 'left-[46.5px] w-[45px]'
                    }`} 
                  />
                  <div className={`relative z-10 w-1/2 text-center text-[9px] font-black tracking-tight leading-6 transition-colors ${language === 'KR' ? 'text-white' : 'text-on-surface-variant'}`}>
                    KR
                  </div>
                  <div className={`relative z-10 w-1/2 text-center text-[9px] font-black tracking-tight leading-6 transition-colors ${language === 'EN' ? 'text-white' : 'text-on-surface-variant'}`}>
                    EN
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Role Description Section */}
        <div className="mt-16 border-t border-surface-container pt-12">
          <h2 className="text-xl font-bold text-on-surface mb-8 font-headline">{t('my.access_rights')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-3">
              <p className="text-xs font-bold text-on-primary-fixed-variant uppercase">{t('my.role_instructor')}</p>
              <p className="text-sm text-on-surface-variant leading-relaxed">{t('my.instructor_desc')}</p>
            </div>
            <div className="space-y-3">
              <p className="text-xs font-bold text-on-primary-fixed-variant uppercase">{t('my.role_organizer')}</p>
              <p className="text-sm text-on-surface-variant leading-relaxed">{t('my.organizer_desc')}</p>
            </div>
            <div className="space-y-3">
              <p className="text-xs font-bold text-on-primary-fixed-variant uppercase">{t('my.role_dj')}</p>
              <p className="text-sm text-on-surface-variant leading-relaxed">{t('my.dj_desc')}</p>
            </div>
            <div className="space-y-3">
              <p className="text-xs font-bold text-on-primary-fixed-variant uppercase">{t('my.role_pro')}</p>
              <p className="text-sm text-on-surface-variant leading-relaxed">{t('my.pro_desc')}</p>
            </div>
          </div>
        </div>

        {/* Action Buttons Section */}
        <div className="mt-12 pt-8 flex justify-center pb-4">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 px-6 py-3 rounded-full text-error font-bold hover:bg-error/10 transition-colors border border-error/20"
          >
            <span className="material-symbols-outlined">logout</span>
            {t('my.logout')}
          </button>
        </div>

        {/* Admin Section (Slimmer, flatter, elegant panel) */}
        {profile?.isAdmin && (
          <div className="mt-4 mb-8 border-t border-dashed border-surface-container pt-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined !text-[16px] text-error/60">admin_panel_settings</span>
              <span className="text-[10px] font-black tracking-[0.25em] uppercase text-error/60">Admin Controls</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {ADMIN_ITEMS.map((item) => (
                <button
                  key={item.href}
                  onClick={() => setAdminPopupHref(item.href)}
                  className="flex items-center gap-3 p-3.5 rounded-xl bg-surface-container-lowest border border-surface-container hover:border-error/20 hover:shadow-sm transition-all active:scale-98 text-left"
                >
                  <div className="w-8 h-8 rounded-lg bg-error/5 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined !text-[16px] text-error/70">{item.icon}</span>
                  </div>
                  <div className="min-w-0">
                    <span className="text-[11px] font-black text-on-surface uppercase tracking-tight block truncate">{item.label}</span>
                    <span className="text-[9px] text-on-surface-variant font-medium block uppercase tracking-tighter mt-0.5">{language === 'KR' ? '도구 관리' : 'Manage Tools'}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Admin Full Popup ??Fullscreen */}
      {mounted && adminPopupHref && createPortal(
        <div className="fixed inset-0 z-[99999] bg-white flex flex-col animate-in fade-in duration-200">
          {/* Popup Header */}
          <div className="flex items-center justify-between px-5 h-14 bg-white border-b border-slate-100 shrink-0">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined !text-[18px] text-error/60">admin_panel_settings</span>
              <span className="text-sm font-bold text-on-surface uppercase tracking-wide">
                {ADMIN_ITEMS.find(a => a.href === adminPopupHref)?.label || 'Admin'}
              </span>
            </div>
            <button 
              onClick={() => setAdminPopupHref(null)}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
            >
              <span className="material-symbols-outlined !text-[18px] text-on-surface">close</span>
            </button>
          </div>
          {/* Popup Content ??iframe to admin page */}
          <iframe 
            src={adminPopupHref}
            className="w-full flex-1 border-0"
            title="Admin Panel"
          />
        </div>,
        document.body
      )}

      {/* Edit Form Bottom Sheet */}
      <MyInfoBottomSheet 
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        profile={profile}
      />
    </div>
  );
}
