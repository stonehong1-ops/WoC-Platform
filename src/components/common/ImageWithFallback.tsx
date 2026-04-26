"use client";

import React, { useState, useEffect } from 'react';

interface ImageWithFallbackProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackType?: 'avatar' | 'cover' | 'gallery';
  nameForAvatar?: string;
  category?: string;
}

const ImageWithFallback: React.FC<ImageWithFallbackProps> = ({ 
  src, 
  fallbackType = 'gallery', 
  nameForAvatar = 'User',
  category = '',
  alt,
  className,
  ...props 
}) => {
  const [imgSrc, setImgSrc] = useState<string>(src as string);
  const [hasError, setHasError] = useState(false);

  const getCoverFallback = (cat: string) => {
    const c = cat.toLowerCase();
    if (c.includes('studio') || c.includes('class')) return "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?auto=format&fit=crop&w=2070&q=80"; // Dance/Yoga Studio
    if (c.includes('shop') || c.includes('commerce')) return "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=2070&q=80"; // Shop
    if (c.includes('stay') || c.includes('hotel')) return "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=2070&q=80"; // Stay/Room
    if (c.includes('rental') || c.includes('equipment')) return "https://images.unsplash.com/photo-1599839619722-39751411ea63?auto=format&fit=crop&w=2070&q=80"; // Rental space
    if (c.includes('wellness') || c.includes('health')) return "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=2070&q=80"; // Wellness
    if (c.includes('dining') || c.includes('restaurant')) return "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=2070&q=80"; // Dining
    if (c.includes('office') || c.includes('work')) return "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=2070&q=80"; // Office
    if (c.includes('online') || c.includes('digital')) return "https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=2070&q=80"; // Online
    return "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=2070&q=80"; // Generic Premium Community
  };

  const fallbacks = {
    avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(nameForAvatar)}&background=0057bd&color=fff&bold=true`,
    cover: getCoverFallback(category),
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
