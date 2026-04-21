'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useNavigation } from '@/components/providers/NavigationProvider';
import { useAuth } from '@/components/providers/AuthProvider';
import AppSettingsPopup from './AppSettingsPopup';

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
  const photoURL = profile?.photoURL || user?.photoURL || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop';
  
  // Collect Roles
  const roles = [];
  if (profile?.isInstructor) roles.push('Instructor');
  if (profile?.isSeller) roles.push('Seller');
  if (profile?.isServiceProvider) roles.push('Service');
  if (!profile?.isRegistered) roles.push('Guest');
  else if (roles.length === 0) roles.push('Member');

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
        {/* User Info Section - Horizontal Layout */}
        <div className="px-6 pt-14 pb-8 border-b border-on-surface/[0.05]">
          <Link 
            href="/my-info" 
            onClick={closeDrawer}
            className="flex items-center gap-5 active:opacity-70 transition-opacity"
          >
            {/* Photo on the Left */}
            <div className="relative shrink-0">
              <img 
                alt={displayName} 
                className="w-16 h-16 rounded-[22px] object-cover ring-2 ring-on-surface/[0.05] shadow-sm" 
                src={photoURL}
              />
              <span className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-surface rounded-full shadow-sm"></span>
            </div>
            
            {/* Name and Bio on the Right */}
            <div className="min-w-0">
              <h1 className="text-[18px] font-black tracking-tight text-on-surface leading-tight uppercase truncate mb-0.5">{displayName}</h1>
              {profile?.bio && (
                <p className="text-[13px] font-medium text-on-surface/50 leading-tight line-clamp-2 mb-2">
                  {profile.bio}
                </p>
              )}
              {/* ROLES */}
              <div className="flex flex-wrap gap-1.5">
                {roles.map(role => (
                  <span key={role} className="px-1.5 py-0.5 rounded bg-primary/5 text-primary text-[8px] font-black tracking-widest uppercase">
                    {role}
                  </span>
                ))}
              </div>
            </div>
          </Link>

          <Link 
            href="/" 
            onClick={closeDrawer}
            className="flex items-center justify-between w-full h-[52px] px-5 mt-8 bg-gradient-to-r from-primary to-primary-container text-white rounded-2xl shadow-lg shadow-primary/20 active:scale-95 transition-all group"
          >
            <span className="font-bold text-[13px] tracking-tight">Go to landing page</span>
            <span className="material-symbols-outlined text-[18px] group-hover:translate-x-0.5 transition-transform">arrow_forward</span>
          </Link>
        </div>

        {/* Scrollable Navigation - Restored Structure */}
        <main className="flex-1 overflow-y-auto no-scrollbar px-3 py-6">
          
          {/* Section: SOCIETY */}
          <div className="mb-8">
            <h2 className="px-5 mb-2 text-[9px] font-black tracking-[0.25em] text-on-surface/30 uppercase">SOCIETY</h2>
            <div className="space-y-0.5">
              {[
                { icon: 'home', label: 'Home', href: '/home' },
                { icon: 'forum', label: 'Plaza', href: '/plaza' },
                { icon: 'explore', label: 'Venues', href: '/venues' },
                { icon: 'groups', label: 'Groups', href: '/groups' },
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
                { icon: 'school', label: 'Class', href: '/class' },
                { icon: 'event', label: 'Events', href: '/events' },
                { icon: 'storefront', label: 'Shop', href: '/shop' },
                { icon: 'bed', label: 'Stay', href: '/stay' },
                { icon: 'medical_services', label: 'Service', href: '/service' },
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
                { icon: 'find_in_page', label: 'Lost & Found', href: '/lost' },
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
