'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useNavigation } from '@/components/providers/NavigationProvider';
import { useAuth } from '@/components/providers/AuthProvider';
import AppSettingsPopup from './AppSettingsPopup';
import UserBadge from '../common/UserBadge';

const LANGUAGES = [
  { code: 'en', name: 'English', native: 'English', active: true },
  { code: 'ko', name: 'Korean', native: '한국어', active: false },
  { code: 'es', name: 'Spanish', native: 'Español', active: false },
  { code: 'fr', name: 'French', native: 'Français', active: false },
  { code: 'de', name: 'German', native: 'Deutsch', active: false },
  { code: 'it', name: 'Italian', native: 'Italiano', active: false },
  { code: 'pt', name: 'Portuguese', native: 'Português', active: false },
  { code: 'zh', name: 'Chinese', native: '中文', active: false },
  { code: 'ja', name: 'Japanese', native: '日本語', active: false },
  { code: 'ru', name: 'Russian', native: 'Русский', active: false },
];

export default function NavigationDrawer() {
  const { isDrawerOpen, closeDrawer } = useNavigation();
  const { profile, user, signOut } = useAuth();
  const router = useRouter();
  
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const handleLogout = async () => {
    closeDrawer();
    router.push('/');
    await signOut();
  };

  const displayName = profile?.nickname || user?.displayName || 'User';
  const nativeNickname = profile?.nativeNickname;
  const photoURL = profile?.photoURL || user?.photoURL || null;
  
  const roles = [];
  if (profile?.isInstructor) roles.push('Instructor');
  if (profile?.isSeller) roles.push('Seller');
  if (profile?.isServiceProvider) roles.push('Service');
  if (!profile?.isRegistered) roles.push('Guest');
  else if (roles.length === 0) roles.push('Member');

  const pathname = usePathname();
  if (pathname === '/' || pathname === '/login') return null;

  return (
    <>
      <AppSettingsPopup isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />

      {/* Backdrop */}
      <div 
        className={`fixed inset-0 z-[9998] bg-black/40 backdrop-blur-sm transition-opacity duration-300 ease-out ${
          isDrawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={closeDrawer}
      />

      {/* Drawer */}
      <div 
        className={`fixed inset-y-0 left-0 z-[9999] w-[85%] max-w-[340px] flex flex-col bg-surface shadow-2xl transition-transform duration-300 ease-out ${
          isDrawerOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Profile Header */}
        <div className="px-6 pt-12 pb-6 flex items-start gap-4">
          <UserBadge
            uid={profile?.uid || user?.uid || ''}
            nickname={displayName}
            nativeNickname={nativeNickname}
            photoURL={photoURL}
            avatarSize="h-14 w-14 border-2 border-surface shadow-sm"
            nameClassName="text-on-surface font-extrabold text-xl tracking-tight leading-none mb-1 line-clamp-1 hover:text-primary transition-colors"
            nativeClassName="text-on-surface-variant text-[12px] font-medium leading-none mb-1.5 block mt-1"
            subText={
              <div className="flex flex-wrap gap-1 mt-1">
                {roles.map(role => (
                  <span key={role} className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider">
                    {role}
                  </span>
                ))}
              </div>
            }
            showEditIcon={true}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              closeDrawer();
              router.push('/my-info');
            }}
          />
        </div>

        {/* Landing Page Link Section */}
        <div className="px-6 pb-6 border-b border-on-surface/[0.05]">
          <Link 
            href="/" 
            onClick={closeDrawer}
            className="flex items-center justify-between w-full h-[52px] px-5 bg-gradient-to-r from-primary to-primary-container text-white rounded-2xl shadow-lg shadow-primary/20 active:scale-95 transition-all group"
          >
            <span className="font-bold text-[13px] tracking-tight">Go to landing page</span>
            <span className="material-symbols-outlined text-[18px] group-hover:translate-x-0.5 transition-transform">arrow_forward</span>
          </Link>
        </div>

        {/* Scrollable Navigation - Restored Structure */}
        <main className="flex-1 overflow-y-auto no-scrollbar px-3 py-6">
          
          {/* Section: TANGO WORLD */}
          <div className="mb-8">
            <h2 className="px-5 mb-2 text-[9px] font-black tracking-[0.25em] text-on-surface/30 uppercase">TANGO WORLD</h2>
            <div className="space-y-0.5">
              {[
                { icon: 'home', label: 'Home', href: '/home' },
                { icon: 'forum', label: 'Plaza', href: '/plaza' },
                { icon: 'explore', label: 'Map', href: '/venues' },
                { icon: 'storefront', label: 'Shop', href: '/shop' },
                { icon: 'bed', label: 'Stay', href: '/stay' },
              ].map((item) => (
                <Link 
                  key={item.label}
                  href={item.href}
                  onClick={closeDrawer}
                  className="flex items-center gap-4 px-5 py-3 text-on-surface/60 hover:bg-on-surface/[0.03] hover:text-on-surface rounded-2xl font-bold transition-all text-left"
                >
                  <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                  <span className="text-[15px] tracking-tight">{item.label}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Section: ACTIVITY */}
          <div className="mb-8">
            <h2 className="px-5 mb-2 text-[9px] font-black tracking-[0.25em] text-on-surface/30 uppercase">ACTIVITY</h2>
            <div className="space-y-0.5">
              {[
                { icon: 'nightlife', label: 'Social', href: '/social' },
                { icon: 'photo_library', label: 'Gallery', href: '/gallery' },
                { icon: 'event', label: 'Events', href: '/events' },
                { icon: 'school', label: 'Class', href: '/class' },
                { icon: 'groups', label: 'Group', href: '/groups' },
              ].map((item) => (
                <Link 
                  key={item.label}
                  href={item.href}
                  onClick={closeDrawer}
                  className="flex items-center gap-4 px-5 py-3 text-on-surface/60 hover:bg-on-surface/[0.03] hover:text-on-surface rounded-2xl font-bold transition-all text-left"
                >
                  <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                  <span className="text-[15px] tracking-tight">{item.label}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Section: TOWN */}
          <div className="mb-8">
            <h2 className="px-5 mb-2 text-[9px] font-black tracking-[0.25em] text-on-surface/30 uppercase">TOWN</h2>
            <div className="space-y-0.5">
              {[
                { icon: 'shopping_bag', label: 'Resale', href: '/resale' },
                { icon: 'handshake', label: 'Rental', href: '/rental' },
                { icon: 'find_in_page', label: 'Lost', href: '/lost-found' },
                { icon: 'videogame_asset', label: 'Arcade', href: '/arcade' },
              ].map((item) => (
                <Link 
                  key={item.label}
                  href={item.href}
                  onClick={closeDrawer}
                  className="flex items-center gap-4 px-5 py-3 text-on-surface/60 hover:bg-on-surface/[0.03] hover:text-on-surface rounded-2xl font-bold transition-all text-left"
                >
                  <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                  <span className="text-[15px] tracking-tight">{item.label}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Section: MY */}
          <div className="mb-8">
            <h2 className="px-5 mb-2 text-[9px] font-black tracking-[0.25em] text-on-surface/30 uppercase">MY</h2>
            <div className="space-y-0.5">
              {[
                { icon: 'manage_accounts', label: 'My Info', href: '/my-info' },
                { icon: 'account_balance_wallet', label: 'Wallet', href: '/wallet' },
                { icon: 'history', label: 'History', href: '/history' },
              ].map((item) => (
                <Link 
                  key={item.label}
                  href={item.href}
                  onClick={closeDrawer}
                  className="flex items-center gap-4 px-5 py-3 text-on-surface/60 hover:bg-on-surface/[0.03] hover:text-on-surface rounded-2xl font-bold transition-all text-left"
                >
                  <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                  <span className="text-[15px] tracking-tight">{item.label}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Section: ADMIN */}
          {profile?.isAdmin && (
            <div className="mb-8">
              <h2 className="px-5 mb-2 text-[9px] font-black tracking-[0.25em] text-error/80 uppercase">ADMIN</h2>
              <div className="space-y-0.5">
                {[
                  { icon: 'person_search', label: 'People', href: '/admin/people' },
                  { icon: 'location_city', label: 'Place', href: '/admin/place' },
                  { icon: 'checklist', label: 'Todo', href: '/admin/todo' },
                  { icon: 'more_horiz', label: 'Others', href: '/admin/others' },
                ].map((item) => (
                  <Link 
                    key={item.label}
                    href={item.href}
                    onClick={closeDrawer}
                    className="flex items-center gap-4 px-5 py-3 text-error/80 hover:bg-error/10 hover:text-error rounded-2xl font-bold transition-all text-left"
                  >
                    <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                    <span className="text-[15px] tracking-tight">{item.label}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Section: SUPPORT */}
          <div className="mb-6">
            <h2 className="px-5 mb-2 text-[9px] font-black tracking-[0.25em] text-on-surface/30 uppercase">SUPPORT</h2>
            <div className="space-y-0.5">
              {/* Language Selector */}
              <div className="overflow-hidden">
                <button 
                  onClick={() => setIsLangOpen(!isLangOpen)}
                  className="w-full flex items-center gap-4 px-5 py-3 text-on-surface/60 hover:bg-on-surface/[0.03] hover:text-on-surface rounded-2xl font-bold transition-all group text-left"
                >
                  <span className="material-symbols-outlined text-[20px]">language</span>
                  <span className="text-[15px] tracking-tight flex-1">Language Selector</span>
                  <span className={`material-symbols-outlined text-on-surface/20 transition-transform ${isLangOpen ? 'rotate-180' : ''}`}>expand_more</span>
                </button>
                
                <div className={`overflow-hidden transition-all duration-300 ${isLangOpen ? 'max-h-[500px] py-1' : 'max-h-0'}`}>
                  <div className="grid grid-cols-1 gap-0.5 ml-4 border-l border-on-surface/[0.05]">
                    {LANGUAGES.map((lang) => (
                      <button
                        key={lang.code}
                        disabled={!lang.active}
                        className={`flex items-center justify-between px-6 py-2 text-[12px] font-bold transition-all ${
                          lang.active 
                            ? 'text-primary hover:bg-primary/5' 
                            : 'text-on-surface/15 cursor-not-allowed grayscale'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          {lang.name}
                          <span className="text-[10px] font-medium opacity-50">· {lang.native}</span>
                        </span>
                        {lang.active && <span className="w-1.5 h-1.5 rounded-full bg-primary" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* App Setting */}
              <button 
                onClick={() => {
                  setIsSettingsOpen(true);
                  closeDrawer();
                }}
                className="w-full flex items-center gap-4 px-5 py-3 text-on-surface/60 hover:bg-on-surface/[0.03] hover:text-on-surface rounded-2xl font-bold transition-all group text-left"
              >
                <span className="material-symbols-outlined text-[20px]">settings_suggest</span>
                <span className="text-[15px] tracking-tight">App Setting</span>
              </button>
            </div>
          </div>
        </main>

        {/* Logout Footer */}
        <div className="p-6 mt-auto">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-4 px-6 py-4 bg-error/5 text-error hover:bg-error/10 rounded-[24px] transition-all active:scale-[0.98] font-bold text-left"
          >
            <span className="material-symbols-outlined text-[20px]">logout</span>
            <span className="text-[14px] tracking-tight">Logout</span>
          </button>
          <div className="mt-4 px-6">
            <p className="text-[8px] font-black tracking-[0.3em] text-on-surface/20 uppercase">World of Group © 2026</p>
          </div>
        </div>
      </div>
    </>
  );
}
