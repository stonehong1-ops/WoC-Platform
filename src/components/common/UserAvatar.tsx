import React from 'react';

interface UserAvatarProps {
  photoURL?: string | null;
  alt?: string;
  className?: string;
  iconSize?: string; // Kept for compatibility, though not used in img
}

export default function UserAvatar({ photoURL, alt = 'User', className = 'w-10 h-10 rounded-full', iconSize = '24px' }: UserAvatarProps) {
  const [imgError, setImgError] = React.useState(false);
  // Common container style for fallback and image
  const containerClass = `${className} relative flex items-center justify-center overflow-hidden bg-surface-container shrink-0`;

  const isDefaultGoogleUser = photoURL === 'https://lh3.googleusercontent.com/a/default-user';
  const shouldShowIcon = !photoURL || isDefaultGoogleUser || imgError;

  return (
    <div className={containerClass}>
      {shouldShowIcon ? (
        <span 
          className="material-symbols-outlined text-on-surface-variant/50 relative z-10" 
          style={{ fontSize: iconSize }}
        >
          person
        </span>
      ) : (
        <img 
          src={photoURL!} 
          alt={alt} 
          className="w-full h-full object-cover relative z-10" 
          onError={() => setImgError(true)} 
        />
      )}
    </div>
  );
}
