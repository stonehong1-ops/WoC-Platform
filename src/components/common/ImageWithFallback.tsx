"use client";

import React, { useState, useEffect } from 'react';

interface ImageWithFallbackProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackType?: 'avatar' | 'cover' | 'gallery';
  nameForAvatar?: string;
}

const ImageWithFallback: React.FC<ImageWithFallbackProps> = ({ 
  src, 
  fallbackType = 'gallery', 
  nameForAvatar = 'User',
  alt,
  className,
  ...props 
}) => {
  const [imgSrc, setImgSrc] = useState<string>(src as string);
  const [hasError, setHasError] = useState(false);

  const fallbacks = {
    avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(nameForAvatar)}&background=0057bd&color=fff&bold=true`,
    cover: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=2070&q=80",
    gallery: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='600' viewBox='0 0 800 600'%3E%3Crect width='800' height='600' fill='%23f1f3ff'/%3E%3Cpath d='M380 280h40v40h-40z' fill='%230057bd' opacity='0.1'/%3E%3C/svg%3E"
  };

  useEffect(() => {
    setImgSrc(src as string);
    setHasError(false);
  }, [src]);

  const handleError = () => {
    if (!hasError) {
      setHasError(true);
      setImgSrc(fallbacks[fallbackType]);
    }
  };

  return (
    <img
      {...props}
      src={imgSrc || fallbacks[fallbackType]}
      alt={alt}
      className={className}
      onError={handleError}
    />
  );
};

export default ImageWithFallback;
