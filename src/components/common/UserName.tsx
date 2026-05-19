import React from 'react';

interface UserNameProps {
  nickname: string;
  nativeNickname?: string | null;
  className?: string; // For the English name / container
  nativeClassName?: string; // For the Native name
}

export default function UserName({ nickname, nativeNickname, className = 'font-bold text-on-surface', nativeClassName = 'text-[0.8em] font-medium text-on-surface-variant ml-1.5' }: UserNameProps) {
  return (
    <div className="flex items-baseline min-w-0">
      <span className={`truncate ${className}`}>
        {nickname || 'Unknown'}
      </span>
      {nativeNickname && nativeNickname !== nickname && (
        <span className={`shrink-0 ${nativeClassName}`}>
          {nativeNickname}
        </span>
      )}
    </div>
  );
}

