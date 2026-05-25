import React from 'react';

interface UserNameProps {
  nickname: string;
  nativeNickname?: string | null;
  className?: string; // For the English name / container
  nativeClassName?: string; // For the Native name
  isCol?: boolean;
}

export default function UserName({ 
  nickname, 
  nativeNickname, 
  className = 'font-bold text-on-surface', 
  nativeClassName = 'text-[0.8em] font-medium text-on-surface-variant ml-1.5',
  isCol = false
}: UserNameProps) {
  const hasNickname = nickname && nickname.trim() !== '' && nickname !== 'Anonymous';
  return (
    <div className={`min-w-0 ${isCol ? 'flex flex-col items-start' : 'flex items-baseline'}`}>
      {hasNickname && (
        <span className={`truncate ${className}`}>
          {nickname}
        </span>
      )}
      {nativeNickname && nativeNickname !== nickname && (
        <span className={`shrink-0 ${nativeClassName} ${(!hasNickname || isCol) ? '!ml-0 mt-0.5' : ''}`}>
          {nativeNickname}
        </span>
      )}
      {!hasNickname && !nativeNickname && (
        <span className={`truncate ${className}`}>
          Unknown
        </span>
      )}
    </div>
  );
}

