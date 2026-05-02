"use client";

import React, { useState } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { useRouter } from 'next/navigation';
import MyInfoBottomSheet from '@/components/profile/MyInfoBottomSheet';

export default function MyInfoPage() {
  const { user, profile, loading, signOut } = useAuth();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const router = useRouter();

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
      <main className="max-w-3xl mx-auto px-6 py-6 md:py-8">
        {/* Profile Hero Section (Ultra-compact) */}
        <div className="flex items-center gap-5 mb-8">
          <div className="relative group shrink-0">
            <div className="w-16 h-16 md:w-20 md:h-20 overflow-hidden rounded-full border-2 border-surface-container-lowest shadow-md bg-surface-container">
              <img 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                src={profile?.photoURL || user?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.nickname || 'User')}&background=1A73E8&color=fff`}
                alt="Profile photo"
              />
            </div>
            <div 
              onClick={() => setIsEditModalOpen(true)}
              className="absolute -bottom-0.5 -right-0.5 bg-primary text-white p-1.5 rounded-full shadow-lg cursor-pointer hover:scale-110 transition-transform flex items-center justify-center z-10 border-2 border-surface"
            >
              <span className="material-symbols-outlined !text-[14px]">edit</span>
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-baseline gap-2 mb-0.5">
              <h1 className="text-xl md:text-2xl font-bold tracking-tight text-on-surface font-headline truncate">
                {profile?.nickname || user?.displayName || 'Adventurer'}
              </h1>
              <div className="flex flex-wrap gap-1">
                {profile?.isInstructor && (
                  <span className="px-2 py-0.5 rounded bg-primary-container text-on-primary-container text-[9px] font-bold uppercase tracking-tighter">Instructor</span>
                )}
                {profile?.isSeller && (
                  <span className="px-2 py-0.5 rounded bg-secondary-container text-on-secondary-container text-[9px] font-bold uppercase tracking-tighter">Seller</span>
                )}
                {profile?.isServiceProvider && (
                  <span className="px-2 py-0.5 rounded bg-tertiary-container text-on-tertiary-container text-[9px] font-bold uppercase tracking-tighter">Pro</span>
                )}
              </div>
            </div>
            <p className="text-on-surface-variant font-medium text-sm line-clamp-1">
              {profile?.bio || 'Senior Group Member'}
            </p>
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

        {/* Action Buttons Section */}
        <div className="mt-12 pt-8 flex justify-center pb-8">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 px-6 py-3 rounded-full text-error font-bold hover:bg-error/10 transition-colors border border-error/20"
          >
            <span className="material-symbols-outlined">logout</span>
            Log Out
          </button>
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
