import React from 'react';

interface UserNameProps {
  nickname: string;
  nativeNickname?: string | null;
  className?: string; // For the English name / container
  nativeClassName?: string; // For the Native name
}

export default function UserName({ nickname, nativeNickname, className = 'font-bold text-on-surface', nativeClassName = 'text-[0.8em] font-medium text-on-surface-variant ml-1.5' }: UserNameProps) {
  return (
    <div className={`truncate ${className}`}>
      {nickname || 'Unknown'}
      {nativeNickname && nativeNickname !== nickname && (
        <span className={nativeClassName}>
          {nativeNickname}
        </span>
      )}
    </div>
  );
}
