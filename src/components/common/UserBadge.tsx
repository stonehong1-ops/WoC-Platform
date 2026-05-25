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
  isCol?: boolean;
}

const userCache = new Map<string, Promise<any>>();

function fetchUserCached(uid: string) {
  if (!uid) return Promise.resolve(null);
  const cached = userCache.get(uid);
  if (cached) return cached;
  
  const promise = getDoc(doc(db, 'users', uid))
    .then(snap => {
      if (snap.exists()) {
        return snap.data();
      } else {
        // 프로필이 아직 생성되지 않은 경우 캐시에서 삭제하여 재시도 가능케 함
        userCache.delete(uid);
        return null;
      }
    })
    .catch(err => {
      // 순간적 네트워크 오류인 경우 캐시에서 삭제하여 재시도 가능케 함
      console.error(`Failed to fetch user profile for cache: ${uid}`, err);
      userCache.delete(uid);
      return null;
    });

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
  showEditIcon = false,
  isCol = false
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

  // 영문 닉네임 필드에 한글이 들어있는 비정상 데이터 또는 임시 데이터 상태를 실시간 자가 교정하는 방어 로직
  const hasKorean = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(userData.nickname || '');
  const resolvedNickname = hasKorean ? '' : (userData.nickname || 'Anonymous');
  const resolvedNativeNickname = hasKorean ? (userData.nickname || userData.nativeNickname) : userData.nativeNickname;

  return (
    <UserProfileClickable 
      uid={uid} 
      initialData={{ 
        nickname: resolvedNickname, 
        nativeNickname: resolvedNativeNickname, 
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
              nickname={resolvedNickname} 
              nativeNickname={resolvedNativeNickname} 
              className={nameClassName} 
              nativeClassName={nativeClassName} 
              isCol={isCol}
            />
            {subText}
          </div>
        ) : (
          <UserName 
            nickname={resolvedNickname} 
            nativeNickname={resolvedNativeNickname} 
            className={nameClassName} 
            nativeClassName={nativeClassName} 
            isCol={isCol}
          />
        )}
      </div>
    </UserProfileClickable>
  );
}
