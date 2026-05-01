'use client';

import React, { useState } from 'react';
import UserProfilePopup from '../profile/UserProfilePopup';

interface UserProfileClickableProps {
  uid: string;
  initialData?: {
    nickname?: string;
    nativeNickname?: string;
    photoURL?: string | null;
  };
  children: React.ReactNode;
  className?: string;
  onClickOverride?: (e: React.MouseEvent) => void;
}

export default function UserProfileClickable({ uid, initialData, children, className = '', onClickOverride }: UserProfileClickableProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div 
        className={`cursor-pointer inline-block ${className}`}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (onClickOverride) {
            onClickOverride(e);
          } else {
            setIsOpen(true);
          }
        }}
      >
        {children}
      </div>
      <UserProfilePopup 
        isOpen={isOpen} 
        onClose={() => setIsOpen(false)} 
        uid={uid} 
        initialData={initialData} 
      />
    </>
  );
}
