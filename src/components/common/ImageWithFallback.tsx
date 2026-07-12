"use client";

import React, { useState, useEffect } from 'react';

interface ImageWithFallbackProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackType?: 'avatar' | 'cover' | 'gallery';
  nameForAvatar?: string;
  category?: string;
}

const optimizeUnsplashUrl = (url: string, width = 600, quality = 75): string => {
  if (!url || !url.includes('images.unsplash.com')) return url;
  try {
    const urlObj = new URL(url);
    urlObj.searchParams.set('w', String(width));
    urlObj.searchParams.set('q', String(quality));
    urlObj.searchParams.set('auto', 'format');
    urlObj.searchParams.set('fit', 'crop');
    return urlObj.toString();
  } catch (e) {
    return url;
  }
};

const ImageWithFallback: React.FC<ImageWithFallbackProps> = ({ 
  src, 
  fallbackType = 'gallery', 
  nameForAvatar = 'User',
  category = '',
  alt,
  className,
  ...props 
}) => {
  const [imgSrc, setImgSrc] = useState<string>(() => optimizeUnsplashUrl(src as string));
  const [hasError, setHasError] = useState(false);

  const fallbacks = {
    avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(nameForAvatar)}&background=0057bd&color=fff&bold=true`,
    cover: '',
    gallery: ''
  };

  useEffect(() => {
    setImgSrc(optimizeUnsplashUrl(src as string));
    setHasError(false);
  }, [src]);

  const handleError = () => {
    if (!hasError) {
      setHasError(true);
    }
  };

  // 이미지 에러가 났거나, 소스가 처음부터 빈 값인 경우 처리
  const isImageEmpty = !src || (typeof src === 'string' && src.trim() === '');
  const shouldShowFallback = hasError || isImageEmpty;

  if (shouldShowFallback) {
    if (fallbackType === 'avatar') {
      return (
        <img
          {...props}
          src={fallbacks.avatar}
          alt={alt}
          className={className}
        />
      );
    }

    // cover 또는 gallery의 경우 이미지 대신 아름다운 CSS 그라디언트 배경과 아이콘을 표출
    const getCategoryIcon = (cat: string) => {
      const c = cat.toLowerCase();
      if (c.includes('studio') || c.includes('class')) return 'school';
      if (c.includes('shop') || c.includes('commerce') || c.includes('resale')) return 'shopping_bag';
      if (c.includes('stay') || c.includes('hotel') || c.includes('room')) return 'hotel';
      if (c.includes('rental') || c.includes('space') || c.includes('equipment')) return 'storefront';
      if (c.includes('wellness') || c.includes('health')) return 'spa';
      if (c.includes('dining') || c.includes('restaurant')) return 'restaurant';
      if (c.includes('office') || c.includes('work')) return 'work';
      return 'groups';
    };

    const getCategoryGradient = (cat: string) => {
      const c = cat.toLowerCase();
      if (c.includes('studio') || c.includes('class')) return 'from-blue-500/80 to-indigo-600/85';
      if (c.includes('shop') || c.includes('commerce') || c.includes('resale')) return 'from-emerald-500/80 to-teal-600/85';
      if (c.includes('stay') || c.includes('hotel') || c.includes('room')) return 'from-rose-500/80 to-pink-600/85';
      if (c.includes('rental') || c.includes('space') || c.includes('equipment')) return 'from-purple-500/80 to-indigo-600/85';
      if (c.includes('wellness') || c.includes('health')) return 'from-teal-500/80 to-cyan-600/85';
      return 'from-slate-700/80 to-slate-900/85';
    };

    return (
      <div 
        className={`${className || ''} bg-gradient-to-br ${getCategoryGradient(category)} flex items-center justify-center text-white`}
        style={props.style}
      >
        <span className="material-symbols-outlined !text-[24px] opacity-75">
          {getCategoryIcon(category)}
        </span>
      </div>
    );
  }

  return (
    <img
      {...props}
      src={imgSrc}
      alt={alt}
      className={className}
      onError={handleError}
    />
  );
};

export default ImageWithFallback;
