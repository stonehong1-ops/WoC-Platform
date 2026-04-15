'use client';

import React from 'react';
import Link from 'next/link';
import { useNavigation } from '@/components/providers/NavigationProvider';
import { useAuth } from '@/components/providers/AuthProvider';

export default function NavigationDrawer() {
  const { isDrawerOpen, closeDrawer } = useNavigation();
  const { profile, user, signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    closeDrawer();
  };

  const displayName = profile?.nickname || user?.displayName || 'User';
  const roleLabel = profile?.isInstructor ? 'Instructor' : 
                   profile?.isSeller ? 'Seller' : 
                   profile?.isServiceProvider ? 'Service' : 'Member';
  const photoURL = profile?.photoURL || user?.photoURL || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop';

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 z-[9998] bg-black/60 backdrop-blur-sm transition-opacity duration-300 ease-in-out ${
          isDrawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={closeDrawer}
      />

      {/* Drawer */}
      <div 
        className={`fixed inset-y-0 left-0 z-[9999] w-[80%] max-w-[380px] flex flex-col bg-white dark:bg-slate-950 shadow-2xl transition-transform duration-300 ease-in-out ${
          isDrawerOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <header className="flex flex-col px-6 pt-10 pb-6 bg-slate-50/80 dark:bg-slate-900/50 backdrop-blur-xl shrink-0">
          <div className="flex items-center justify-between mb-6">
            <Link 
              href="/my-info" 
              onClick={closeDrawer}
              className="flex items-center gap-3 active:opacity-70 transition-opacity"
            >
              <div className="relative">
                <img 
                  alt="User Profile" 
                  className="w-12 h-12 rounded-xl object-cover shadow-blue-900/10 shadow-lg" 
                  src={photoURL}
                />
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
              </div>
              <div>
                <h1 className="text-xl font-extrabold text-blue-900 dark:text-blue-100 tracking-tight">{displayName}</h1>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{profile?.isRegistered ? roleLabel : 'Guest'}</p>
              </div>
            </Link>
            <button 
              onClick={closeDrawer}
              className="bg-blue-50 dark:bg-blue-900/30 p-2 rounded-xl text-blue-700 dark:text-blue-400 active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
          </div>
          <Link 
            href="/home" 
            onClick={closeDrawer}
            className="inline-flex items-center justify-between w-full p-4 bg-gradient-to-r from-blue-700 to-blue-500 rounded-xl shadow-lg shadow-blue-900/20 active:scale-95 transition-all"
          >
            <span className="text-white font-bold text-sm">Go to society hub</span>
            <span className="material-symbols-outlined text-white text-lg">arrow_forward</span>
          </Link>
        </header>

        {/* Navigation Content */}
        <main className="flex-grow flex flex-col px-4 py-4 overflow-y-auto w-full no-scrollbar">
          {/* Section: SOCIETY */}
          <div className="mb-8">
            <h2 className="px-4 mb-3 text-[10px] uppercase tracking-[0.2em] font-bold text-slate-400">SOCIETY</h2>
            <div className="space-y-1">
              {[
                { icon: 'home', label: 'Home', href: '/home' },
                { icon: 'layers', label: 'Plaza', href: '/plaza' },
                { icon: 'location_on', label: 'Venues', href: '/venues' },
                { icon: 'group', label: 'Groups', href: '/groups' },
              ].map((item) => (
                <Link 
                  key={item.label}
                  href={item.href}
                  onClick={closeDrawer}
                  className="flex items-center gap-4 px-4 py-3 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl font-bold transition-all text-left"
                >
                  <span className="material-symbols-outlined text-xl">{item.icon}</span>
                  <span className="text-base">{item.label}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Section: ACTIVITY */}
          <div className="mb-8">
            <h2 className="px-4 mb-3 text-[10px] uppercase tracking-[0.2em] font-bold text-slate-400">ACTIVITY</h2>
            <div className="space-y-1">
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
                  className="flex items-center gap-4 px-4 py-3 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl font-bold transition-all text-left"
                >
                  <span className="material-symbols-outlined text-xl">{item.icon}</span>
                  <span className="text-base">{item.label}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Section: TOWN */}
          <div className="mb-8">
            <h2 className="px-4 mb-3 text-[10px] uppercase tracking-[0.2em] font-bold text-slate-400">TOWN</h2>
            <div className="space-y-1">
              {[
                { icon: 'shopping_bag', label: 'Resale', href: '/resale' },
                { icon: 'find_in_page', label: 'Lost & Found', href: '/lost' },
                { icon: 'videogame_asset', label: 'Arcade', href: '/arcade' },
              ].map((item) => (
                <Link 
                  key={item.label}
                  href={item.href}
                  onClick={closeDrawer}
                  className="flex items-center gap-4 px-4 py-3 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl font-bold transition-all text-left"
                >
                  <span className="material-symbols-outlined text-xl">{item.icon}</span>
                  <span className="text-base">{item.label}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Section: SUPPORT */}
          <div className="mb-10">
            <h2 className="px-4 mb-3 text-[10px] uppercase tracking-[0.2em] font-bold text-slate-400">SUPPORT</h2>
            <div className="space-y-1">
              <button className="w-full flex items-center gap-4 px-4 py-3 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl font-bold transition-all group text-left">
                <span className="material-symbols-outlined text-xl">language</span>
                <span className="text-base">Language Selector</span>
                <span className="ml-auto material-symbols-outlined text-slate-400">expand_more</span>
              </button>
              <Link 
                href="/admin/people" 
                onClick={closeDrawer}
                className="w-full flex items-center gap-4 px-4 py-3 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl font-bold transition-all"
              >
                <span className="material-symbols-outlined text-xl">settings_applications</span>
                <span className="text-base">App Setting</span>
              </Link>
            </div>
          </div>

          {/* Logout */}
          <div className="mt-auto pt-6 border-t border-slate-100 dark:border-slate-800 mb-8">
            <button 
              onClick={handleLogout}
              className="w-full flex items-center gap-4 px-6 py-4 text-red-600 hover:bg-red-50 rounded-2xl transition-all active:scale-[0.98] font-bold text-left"
            >
              <span className="material-symbols-outlined text-xl">logout</span>
              <span className="text-lg">Logout</span>
            </button>
          </div>
        </main>
      </div>
    </>
  );
}

