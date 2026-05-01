'use client';

import React, { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/clientApp';
import UserAvatar from '../common/UserAvatar';
import UserName from '../common/UserName';

interface UserProfilePopupProps {
  isOpen: boolean;
  onClose: () => void;
  uid: string;
  initialData?: {
    nickname?: string;
    nativeNickname?: string;
    photoURL?: string | null;
  };
}

interface FullProfile {
  nickname: string;
  nativeNickname?: string;
  photoURL?: string | null;
  bio?: string;
  isInstructor?: boolean;
  isSeller?: boolean;
  isServiceProvider?: boolean;
  gender?: string;
  joinedGroups?: string[];
}

export default function UserProfilePopup({ isOpen, onClose, uid, initialData }: UserProfilePopupProps) {
  const [profile, setProfile] = useState<FullProfile | null>(initialData as FullProfile || null);
  const [loading, setLoading] = useState(!initialData);

  useEffect(() => {
    if (!isOpen || !uid) return;

    const fetchProfile = async () => {
      try {
        setLoading(true);
        const docRef = doc(db, 'users', uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProfile(docSnap.data() as FullProfile);
        }
      } catch (err) {
        console.error("Failed to fetch user profile:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [isOpen, uid]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[9999] bg-black/40 backdrop-blur-sm flex flex-col justify-end animate-in fade-in duration-300"
      onClick={onClose}
    >
      <div 
        className="bg-surface w-full relative flex flex-col overflow-hidden bottom-sheet-container animate-in slide-in-from-bottom duration-500 max-h-[85vh]"
        style={{ borderRadius: '24px 24px 0 0' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Grab Handle */}
        <div className="w-full flex justify-center py-3 shrink-0 cursor-pointer" onClick={onClose}>
          <div className="w-12 h-1.5 bg-on-surface/20 rounded-full"></div>
        </div>

        <div className="flex-1 overflow-y-auto hide-scrollbar px-6 pb-10">
          {loading && !profile ? (
            <div className="flex justify-center items-center py-12">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : profile ? (
            <div className="flex flex-col items-center pt-4">
              <UserAvatar 
                photoURL={profile.photoURL} 
                className="w-32 h-32 rounded-squircle shadow-sm mb-5 border-4 border-surface"
                iconSize="64px"
              />
              <div className="text-center mb-6">
                <UserName 
                  nickname={profile.nickname} 
                  nativeNickname={profile.nativeNickname} 
                  className="text-2xl"
                  nativeClassName="text-base mt-1 text-on-surface-variant"
                />
              </div>

              {profile.bio && (
                <div className="w-full bg-surface-container-low rounded-2xl p-5 mb-6 text-center">
                  <p className="text-on-surface text-sm leading-relaxed">{profile.bio}</p>
                </div>
              )}

              <div className="w-full space-y-3">
                {(profile.isInstructor || profile.isSeller || profile.isServiceProvider) && (
                  <div className="bg-surface-container-low rounded-2xl p-5">
                    <h3 className="text-xs font-black tracking-widest uppercase text-on-surface-variant mb-4">Roles</h3>
                    <div className="flex flex-wrap gap-2">
                      {profile.isInstructor && <span className="bg-primary/10 text-primary px-3 py-1 rounded-lg text-xs font-bold uppercase">Instructor</span>}
                      {profile.isSeller && <span className="bg-primary/10 text-primary px-3 py-1 rounded-lg text-xs font-bold uppercase">Seller</span>}
                      {profile.isServiceProvider && <span className="bg-primary/10 text-primary px-3 py-1 rounded-lg text-xs font-bold uppercase">Service Provider</span>}
                    </div>
                  </div>
                )}
                
                {profile.gender && profile.gender !== 'Other' && (
                  <div className="bg-surface-container-low rounded-2xl p-5 flex justify-between items-center">
                    <span className="text-xs font-black tracking-widest uppercase text-on-surface-variant">Gender</span>
                    <span className="text-sm font-bold text-on-surface">{profile.gender}</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-on-surface-variant">
              User not found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
