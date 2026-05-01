'use client';

import React, { useState, useEffect, useRef } from 'react';
import { doc, updateDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase/clientApp';
import { useAuth } from '@/components/providers/AuthProvider';
import DeactivateBottomSheet from './DeactivateBottomSheet';

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
  isInstructor?: boolean;
  isSeller?: boolean;
  isServiceProvider?: boolean;
  authMethod?: string;
}

interface MyInfoBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile | null;
}

export default function MyInfoBottomSheet({ isOpen, onClose, profile }: MyInfoBottomSheetProps) {
  const { user, signOut } = useAuth();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isDeactivateOpen, setIsDeactivateOpen] = useState(false);
  const [details, setDetails] = useState({
    nickname: '',
    nativeNickname: '',
    bio: '',
    gender: 'Other',
    phoneNumber: '',
    countryCode: '+1 (US)',
    isInstructor: false,
    isSeller: false,
    isServiceProvider: false,
    photoURL: ''
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (profile) {
      setDetails({
        nickname: profile.nickname || '',
        nativeNickname: profile.nativeNickname || '',
        bio: profile.bio || '',
        gender: profile.gender || 'Other',
        phoneNumber: profile.phoneNumber || '',
        countryCode: profile.countryCode || '+1 (US)',
        isInstructor: profile.isInstructor || false,
        isSeller: profile.isSeller || false,
        isServiceProvider: profile.isServiceProvider || false,
        photoURL: profile.photoURL || ''
      });
    }
  }, [profile, isOpen]);

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && profile) {
      setUploading(true);
      try {
        const fileRef = ref(storage, `profiles/${profile.uid}/${Date.now()}_${file.name}`);
        const snapshot = await uploadBytes(fileRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);
        setDetails(prev => ({ ...prev, photoURL: downloadURL }));
      } catch (err) {
        console.error('Photo upload error:', err);
        alert('Failed to upload photo.');
      } finally {
        setUploading(false);
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
        phoneNumber: details.phoneNumber,
        countryCode: details.countryCode,
        isInstructor: details.isInstructor,
        isSeller: details.isSeller,
        isServiceProvider: details.isServiceProvider,
        photoURL: details.photoURL,
        updatedAt: serverTimestamp()
      });
      onClose();
    } catch (error) {
      console.error('Update profile error:', error);
      alert('Failed to update profile.');
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
                  {uploading ? (
                    <div className="w-full h-full flex items-center justify-center bg-black/10 relative z-20">
                      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  ) : details.photoURL && details.photoURL !== 'https://lh3.googleusercontent.com/a/default-user' && (
                    <img 
                      src={details.photoURL} 
                      alt="Profile" 
                      className="w-full h-full object-cover relative z-10"
                      onError={(e) => e.currentTarget.style.display = 'none'}
                    />
                  )}
                </div>
                <div className="absolute inset-0 bg-black/20 rounded-squircle opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="material-symbols-outlined text-white text-3xl">photo_camera</span>
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
                  {uploading ? 'Uploading...' : 'Update Photo'}
                </button>
                <button 
                  onClick={() => setDetails(prev => ({ ...prev, photoURL: '' }))}
                  type="button"
                  className="px-4 py-2 bg-surface-container-high text-on-surface-variant font-medium text-sm rounded hover:bg-surface-dim transition-all"
                >
                  Remove
                </button>
              </div>
            </section>

            {/* Section 2: Personal Details */}
            <section className="space-y-6">
              <h2 className="font-headline text-lg font-bold text-on-surface">Personal Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5 col-span-2 md:col-span-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-outline">Full Name (English)</label>
                  <input 
                    className="w-full bg-surface border border-outline-variant rounded px-4 py-2.5 text-on-surface focus:ring-1 focus:ring-primary focus:border-primary transition-all outline-none" 
                    type="text" 
                    value={details.nickname}
                    onChange={(e) => setDetails(prev => ({ ...prev, nickname: e.target.value.replace(/[^a-zA-Z0-9_.\-\s]/g, '') }))}
                  />
                </div>
                <div className="space-y-1.5 col-span-2 md:col-span-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-outline">Native Name (Optional)</label>
                  <input 
                    className="w-full bg-surface border border-outline-variant rounded px-4 py-2.5 text-on-surface focus:ring-1 focus:ring-primary focus:border-primary transition-all outline-none" 
                    placeholder="e.g. ア레크산더" 
                    type="text"
                    value={details.nativeNickname}
                    onChange={(e) => setDetails(prev => ({ ...prev, nativeNickname: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5 col-span-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-outline">Professional Title & Bio</label>
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
              <h2 className="font-headline text-lg font-bold text-on-surface">Contact Info</h2>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-outline">Email Address</label>
                  <div className="relative flex items-center">
                    <input 
                      className="w-full bg-surface-container-low border border-outline-variant rounded px-4 py-2.5 text-on-surface-variant cursor-not-allowed pr-32" 
                      readOnly 
                      type="email" 
                      value={profile.email || ''}
                    />
                    <div className="absolute right-3 flex items-center gap-1.5 bg-blue-50 text-primary px-2 py-1 rounded text-[10px] font-bold border border-blue-100 uppercase tracking-tighter">
                      <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                      Verified
                    </div>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-outline">Cell Phone</label>
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
                </div>
              </div>
            </section>

            {/* Section 4: Gender */}
            <section className="space-y-6">
              <h2 className="font-headline text-lg font-bold text-on-surface">Gender</h2>
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
                    {g}
                  </button>
                ))}
              </div>
            </section>

            {/* Section 5: Roles */}
            <section className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="font-headline text-lg font-bold text-on-surface">Roles</h2>
                <span className="text-xs text-outline font-medium">Multi-select enabled</span>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {[
                  { id: 'isInstructor', label: 'Instructor', sub: 'Create and manage content', icon: 'school' },
                  { id: 'isSeller', label: 'Seller', sub: 'List and sell products', icon: 'store' },
                  { id: 'isServiceProvider', label: 'Service Provider', sub: 'Offer professional services', icon: 'hand_gesture' }
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
                  <h3 className="font-headline font-bold text-error">Deactivate Account</h3>
                  <p className="text-[11px] text-error/80 leading-relaxed max-w-sm">
                    Deactivating your account will temporarily disable your profile and remove your name and photo from most things you've shared.
                  </p>
                </div>
                <button 
                  onClick={() => setIsDeactivateOpen(true)}
                  type="button"
                  className="px-6 py-2.5 bg-error text-on-error font-bold text-sm rounded-lg shadow-sm hover:brightness-110 active:scale-95 transition-all shrink-0 w-full sm:w-auto"
                >
                  Deactivate
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
            {saving ? 'Saving changes...' : 'Save changes'}
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
