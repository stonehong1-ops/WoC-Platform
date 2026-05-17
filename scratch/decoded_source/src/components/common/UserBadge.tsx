'use client';

import React, { useEffect, useState } from 'react';
import UserAvatar from './UserAvatar';
import UserProfileClickable from './UserProfileClickable';
import UserName from './UserName';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/clientApp';

interface UserBadgeProps {
  uid: string;
  nickname?: string;
  nativeNickname?: string;
  photoURL?: string | null;
  avatarSize?: string;
  className?: string;
  nameClassName?: string;
  nativeClassName?: string;
  subText?: React.ReactNode;
  onClick?: (e: React.MouseEvent) => void;
  showEditIcon?: boolean;
}

const userCache = new Map<string, Promise<any>>();

function fetchUserCached(uid: string) {
  if (!uid) return Promise.resolve(null);
  const cached = userCache.get(uid);
  if (cached) return cached;
  const promise = getDoc(doc(db, 'users', uid)).then(snap => snap.exists() ? snap.data() : null);
  userCache.set(uid, promise);
  return promise;
}

export default function UserBadge({ 
  uid, 
  nickname: initialNickname, 
  nativeNickname: initialNativeNickname, 
  photoURL: initialPhotoURL, 
  avatarSize = 'w-10 h-10', 
  className = '',
  nameClassName = 'font-medium text-sm text-on-surface',
  nativeClassName = 'text-[0.8em] font-normal text-on-surface-variant ml-1.5',
  subText,
  onClick,
  showEditIcon = false
}: UserBadgeProps) {
  const [userData, setUserData] = useState({
    nickname: initialNickname,
    nativeNickname: initialNativeNickname,
    photoURL: initialPhotoURL,
  });

  useEffect(() => {
    if (uid) {
      let isMounted = true;
      fetchUserCached(uid).then(data => {
        if (isMounted && data) {
          setUserData(prev => ({
            nickname: data.nickname || data.displayName || prev.nickname,
            nativeNickname: data.nativeNickname || prev.nativeNickname,
            photoURL: data.photoURL || prev.photoURL,
          }));
        }
      });
      return () => { isMounted = false; };
    }
  }, [uid]);

  const displayName = userData.nickname || 'Anonymous';

  return (
    <UserProfileClickable 
      uid={uid} 
      initialData={{ 
        nickname: userData.nickname, 
        nativeNickname: userData.nativeNickname, 
        photoURL: userData.photoURL 
      }}
      className={`inline-block ${className}`}
      onClickOverride={onClick}
    >
      <div className="flex items-center gap-x-2">
        <div className="relative inline-block">
          <UserAvatar photoURL={userData.photoURL} className={`${avatarSize} rounded-full`} />
          {showEditIcon && (
            <div className="absolute bottom-0 right-0 w-6 h-6 bg-primary rounded-full flex items-center justify-center border-2 border-surface shadow-sm z-20" style={{ transform: 'translate(10%, 10%)' }}>
              <span className="material-symbols-outlined text-white text-[14px]">edit</span>
            </div>
          )}
        </div>
        {subText ? (
          <div className="flex flex-col">
            <UserName 
              nickname={displayName} 
              nativeNickname={userData.nativeNickname} 
              className={nameClassName} 
              nativeClassName={nativeClassName} 
            />
            {subText}
          </div>
        ) : (
          <UserName 
            nickname={displayName} 
            nativeNickname={userData.nativeNickname} 
            className={nameClassName} 
            nativeClassName={nativeClassName} 
          />
        )}
      </div>
    </UserProfileClickable>
  );
}
