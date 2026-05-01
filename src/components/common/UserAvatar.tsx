import React from 'react';

interface UserAvatarProps {
  photoURL?: string | null;
  alt?: string;
  className?: string;
  iconSize?: string; // Kept for compatibility, though not used in img
}

export default function UserAvatar({ photoURL, alt = 'User', className = 'w-10 h-10 rounded-full', iconSize = '24px' }: UserAvatarProps) {
  // Common container style for fallback and image
  const containerClass = `${className} relative flex items-center justify-center overflow-hidden bg-surface-container shrink-0`;

  const defaultPhoto = 'https://lh3.googleusercontent.com/a/default-user';
  const displayPhoto = photoURL ? photoURL : defaultPhoto;

  return (
    <div className={containerClass}>
      <img 
        src={displayPhoto} 
        alt={alt} 
        className="w-full h-full object-cover relative z-10" 
        onError={(e) => {
          if (e.currentTarget.src !== defaultPhoto) {
            e.currentTarget.src = defaultPhoto;
          }
        }} 
      />
    </div>
  );
}
