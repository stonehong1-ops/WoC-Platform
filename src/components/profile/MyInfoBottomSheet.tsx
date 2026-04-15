'use client';

import React, { useState, useEffect } from 'react';
import { doc, updateDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/clientApp';
import { useAuth } from '@/components/providers/AuthProvider';

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
}

interface MyInfoBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile | null;
}

export default function MyInfoBottomSheet({ isOpen, onClose, profile }: MyInfoBottomSheetProps) {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [details, setDetails] = useState({
    nickname: '',
    nativeNickname: '',
    bio: '',
    gender: 'Other',
    phoneNumber: '',
    countryCode: '+82 (KR)',
    isInstructor: false,
    isSeller: false,
    isServiceProvider: false,
    photoURL: ''
  });

  useEffect(() => {
    if (profile) {
      setDetails({
        nickname: profile.nickname || '',
        nativeNickname: profile.nativeNickname || '',
        bio: profile.bio || '',
        gender: profile.gender || 'Other',
        phoneNumber: profile.phoneNumber || '',
        countryCode: profile.countryCode || '+82 (KR)',
        isInstructor: profile.isInstructor || false,
        isSeller: profile.isSeller || false,
        isServiceProvider: profile.isServiceProvider || false,
        photoURL: profile.photoURL || ''
      });
    }
  }, [profile, isOpen]);

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
    if (window.confirm('Are you sure you want to deactivate? This is irreversible.')) {
      try {
        await deleteDoc(doc(db, 'users', profile.uid));
        window.location.href = '/';
      } catch (err) {
        console.error('Deactivation error:', err);
      }
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[100] bg-on-surface/20 backdrop-blur-sm flex items-end animate-in fade-in duration-300"
      onClick={onClose}
    >
      <div 
        className="bg-surface w-full max-w-2xl mx-auto rounded-t-3xl p-8 shadow-2xl animate-in slide-in-from-bottom duration-500 overflow-y-auto max-h-[90vh] hide-scrollbar"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-12 h-1 bg-surface-container-highest rounded-full mx-auto mb-8 cursor-pointer" onClick={onClose}></div>
        
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-extrabold text-on-surface">Edit Information</h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-surface-container rounded-full transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="space-y-6">
          {/* Main Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Nickname */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-outline">Full Name</label>
              <input 
                className="w-full bg-surface-container-low border-none rounded-lg focus:ring-2 focus:ring-primary py-2.5 px-4" 
                type="text" 
                value={details.nickname}
                onChange={(e) => setDetails(prev => ({ ...prev, nickname: e.target.value }))}
              />
            </div>

            {/* Gender */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-outline">Gender</label>
              <select 
                className="w-full bg-surface-container-low border-none rounded-lg focus:ring-2 focus:ring-primary py-2.5 px-4"
                value={details.gender}
                onChange={(e) => setDetails(prev => ({ ...prev, gender: e.target.value }))}
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </div>

            {/* Cell Phone */}
            <div className="col-span-1 md:col-span-2 space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-outline">Cell Phone</label>
              <div className="flex gap-2">
                <select 
                  className="block w-24 text-xs border-none bg-surface-container-low rounded-lg focus:ring-2 focus:ring-primary py-2.5 px-3"
                  value={details.countryCode}
                  onChange={(e) => setDetails(prev => ({ ...prev, countryCode: e.target.value }))}
                >
                  <option value="+82 (KR)">KR (+82)</option>
                  <option value="+1 (US)">US (+1)</option>
                  <option value="+44 (UK)">UK (+44)</option>
                </select>
                <input 
                  className="block w-full text-sm border-none bg-surface-container-low rounded-lg focus:ring-2 focus:ring-primary py-2.5 px-4 font-medium"
                  placeholder="(000) 0000-0000"
                  type="tel"
                  value={details.phoneNumber}
                  onChange={(e) => setDetails(prev => ({ ...prev, phoneNumber: e.target.value }))}
                />
              </div>
            </div>

            {/* Bio */}
            <div className="col-span-1 md:col-span-2 space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-outline">Professional Title & Bio</label>
              <textarea 
                className="w-full bg-surface-container-low border-none rounded-lg focus:ring-2 focus:ring-primary py-2.5 px-4 resize-none" 
                rows={3}
                value={details.bio}
                onChange={(e) => setDetails(prev => ({ ...prev, bio: e.target.value }))}
              />
            </div>
          </div>

          {/* Role Access Toggles */}
          <div className="space-y-4">
            <label className="text-xs font-bold uppercase tracking-widest text-outline">Access Roles</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { id: 'isInstructor', label: 'Instructor', icon: 'school' },
                { id: 'isSeller', label: 'Seller', icon: 'storefront' },
                { id: 'isServiceProvider', label: 'Provider', icon: 'hand_gesture' }
              ].map((role) => {
                const active = (details as any)[role.id];
                return (
                  <div 
                    key={role.id}
                    onClick={() => setDetails(prev => ({ ...prev, [role.id]: !active }))}
                    className={`p-3 rounded-lg border-2 cursor-pointer transition-all flex items-center gap-3 ${
                      active 
                        ? 'border-primary bg-primary-container/20' 
                        : 'border-surface-container hover:border-primary/30'
                    }`}
                  >
                    <span className={`material-symbols-outlined ${active ? 'text-primary' : 'text-outline-variant'}`}>{role.icon}</span>
                    <span className={`text-xs font-bold ${active ? 'text-on-surface' : 'text-outline'}`}>{role.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-4 pt-4">
            <button 
              onClick={handleSave}
              disabled={saving}
              className="w-full py-4 bg-on-surface text-surface rounded-xl font-bold hover:bg-on-surface-variant transition-colors shadow-lg active:scale-[0.98] disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            
            <button 
              onClick={onDeactivate}
              className="w-full py-3 text-error text-xs font-bold uppercase tracking-widest hover:bg-error/5 rounded-lg transition-colors"
            >
              Deactivate Account
            </button>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
