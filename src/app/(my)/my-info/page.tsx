"use client";

import React, { useState } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { useRouter } from 'next/navigation';
import MyInfoBottomSheet from '@/components/profile/MyInfoBottomSheet';

export default function MyInfoPage() {
  const { user, profile, loading } = useAuth();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const router = useRouter();

  if (loading) return null;

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center">
        <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
        <p className="text-gray-500 mb-8">Please sign in to view your profile.</p>
        <button 
          onClick={() => router.push('/')}
          className="px-8 py-3 bg-primary text-white rounded-full font-bold"
        >
          Go to Home
        </button>
      </div>
    );
  }

  return (
    <div className="bg-surface text-on-surface min-h-screen">
      <main className="max-w-3xl mx-auto px-6 py-12 md:py-20">
        {/* Profile Hero Section (Asymmetric Layout) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-end mb-16">
          <div className="md:col-span-4 relative group">
            <div className="aspect-square w-full max-w-[240px] overflow-hidden rounded-squircle border-4 border-surface-container-lowest shadow-xl">
              <img 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                src={profile?.photoURL || user?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.nickname || 'User')}&background=1A73E8&color=fff`}
                alt="Profile photo"
              />
            </div>
            <div 
              onClick={() => setIsEditModalOpen(true)}
              className="absolute bottom-4 right-4 md:right-12 bg-primary text-white p-3 rounded-full shadow-2xl cursor-pointer hover:scale-110 transition-transform flex items-center justify-center z-10"
            >
              <span className="material-symbols-outlined !text-[20px]">photo_camera</span>
            </div>
          </div>
          <div className="md:col-span-8 pb-4">
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-on-surface mb-2 font-headline">
              {profile?.nickname || user?.displayName || 'Adventurer'}
            </h1>
            <p className="text-on-surface-variant font-medium text-lg">
              {profile?.bio || 'Senior Group Member'}
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <span className={`px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider ${profile?.isInstructor ? 'bg-primary-container text-on-primary-container' : 'bg-surface-container-highest text-on-surface-variant'}`}>
                Instructor
              </span>
              <span className={`px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider ${profile?.isSeller ? 'bg-primary-container text-on-primary-container' : 'bg-surface-container-highest text-on-surface-variant'}`}>
                Seller
              </span>
              <span className={`px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider ${profile?.isServiceProvider ? 'bg-primary-container text-on-primary-container' : 'bg-surface-container-highest text-on-surface-variant'}`}>
                Service Provider
              </span>
            </div>
          </div>
        </div>

        {/* Info Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Primary Identity Card */}
          <div className="p-8 rounded-xl bg-surface-container-lowest border border-surface-container shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-10 h-10 flex flex-shrink-0 items-center justify-center rounded-lg bg-primary-fixed text-on-primary-fixed">
                <span className="material-symbols-outlined text-[24px]">account_circle</span>
              </div>
              <div>
                <p className="text-xs font-bold text-outline uppercase tracking-widest">Login Method</p>
                <p className="text-on-surface font-medium">{profile?.authMethod || 'Google'}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-10 h-10 flex flex-shrink-0 items-center justify-center rounded-lg bg-primary-fixed text-on-primary-fixed">
                <span className="material-symbols-outlined text-[24px]">fingerprint</span>
              </div>
              <div>
                <p className="text-xs font-bold text-outline uppercase tracking-widest">Gender</p>
                <p className="text-on-surface font-medium">{profile?.gender || 'Other'}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-10 h-10 flex flex-shrink-0 items-center justify-center rounded-lg bg-primary-fixed text-on-primary-fixed">
                <span className="material-symbols-outlined text-[24px]">alternate_email</span>
              </div>
              <div>
                <p className="text-xs font-bold text-outline uppercase tracking-widest">Email Address</p>
                <p className="text-on-surface font-medium truncate max-w-[200px]">{user?.email}</p>
              </div>
            </div>
            <div className="flex gap-4 items-center">
              <div className="w-10 h-10 flex flex-shrink-0 items-center justify-center rounded-lg bg-primary-fixed text-on-primary-fixed">
                <span className="material-symbols-outlined text-[24px]">call</span>
              </div>
              <div className="flex-grow">
                <p className="text-xs font-bold text-outline uppercase tracking-widest">CELL PHONE</p>
                <div className="flex gap-2 items-center">
                  <span className="text-on-surface font-medium">{profile?.countryCode}</span>
                  <span className="text-on-surface font-medium">{profile?.phoneNumber || 'Not linked'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Account Summary Card */}
          <div className="p-8 rounded-xl bg-on-surface text-surface-container-lowest flex flex-col justify-between">
            <div>
              <p className="text-xs font-bold text-inverse-on-surface uppercase tracking-widest mb-1">Professional Status</p>
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-2xl font-bold text-surface-container-lowest font-headline">Verified</h2>
                <span className="material-symbols-outlined text-primary fill-1" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
              </div>
              <p className="text-xs text-inverse-on-surface italic">Your primary credentials have been verified by our security team.</p>
            </div>
            <div className="mt-8 pt-6 border-t border-surface-container-lowest/10">
              <p className="text-[10px] font-bold text-inverse-on-surface uppercase tracking-widest mb-3">Additional Verification</p>
              <button className="w-full py-2.5 px-4 bg-surface-container-lowest/10 hover:bg-surface-container-lowest/20 border border-surface-container-lowest/20 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-sm">verified_user</span>
                Apply for Advanced Badge
              </button>
            </div>
          </div>

          {/* Edit Trigger Card (Full Width) */}
          <div 
            onClick={() => setIsEditModalOpen(true)}
            className="md:col-span-2 group cursor-pointer p-1 overflow-hidden rounded-xl bg-gradient-to-r from-on-primary-fixed-variant to-primary shadow-lg active:scale-[0.98] transition-transform"
          >
            <div className="bg-surface-container-lowest rounded-[10px] p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 flex items-center justify-center rounded-full bg-primary-fixed text-on-primary-fixed group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined">edit_square</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-on-surface font-headline">Modify Profile</h3>
                  <p className="text-sm text-on-surface-variant">Customize your account appearance and personal information</p>
                </div>
              </div>
              <span className="material-symbols-outlined text-outline group-hover:translate-x-1 transition-transform">arrow_forward_ios</span>
            </div>
          </div>
        </div>

        {/* Role Description Section */}
        <div className="mt-16 border-t border-surface-container pt-12">
          <h2 className="text-xl font-bold text-on-surface mb-8 font-headline">Access Rights</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="space-y-3">
              <p className="text-xs font-bold text-on-primary-fixed-variant uppercase">Instructor</p>
              <p className="text-sm text-on-surface-variant leading-relaxed">Authorized to host live sessions and manage curriculum content.</p>
            </div>
            <div className="space-y-3">
              <p className="text-xs font-bold text-on-primary-fixed-variant uppercase">Seller</p>
              <p className="text-sm text-on-surface-variant leading-relaxed">Full access to the marketplace and inventory management tools.</p>
            </div>
            <div className="space-y-3">
              <p className="text-xs font-bold text-on-primary-fixed-variant uppercase">Service Provider</p>
              <p className="text-sm text-on-surface-variant leading-relaxed">Ability to list professional services and handle bookings.</p>
            </div>
          </div>
        </div>
      </main>

      {/* Edit Form Bottom Sheet */}
      <MyInfoBottomSheet 
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        profile={profile}
      />
    </div>
  );
}
