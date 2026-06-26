'use client';

import React, { useState, useRef, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { TryOnResult } from './AiTryOnStudio';

interface TryOnGalleryProps {
  results: TryOnResult[];
  onDownload: (result: TryOnResult) => void;
  onDelete: (result: TryOnResult) => void;
}

export default function TryOnGallery({ results, onDownload, onDelete }: TryOnGalleryProps) {
  const { t } = useLanguage();
  const [currentIndex, setCurrentIndex] = useState(0);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    touchEndX.current = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 50) {
      if (diff > 0 && currentIndex < results.length - 1) {
        setCurrentIndex(prev => prev + 1);
      } else if (diff < 0 && currentIndex > 0) {
        setCurrentIndex(prev => prev - 1);
      }
    }
  }, [currentIndex, results.length]);

  const handleDownload = useCallback(async (result: TryOnResult) => {
    try {
      const response = await fetch(result.generatedImageUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `tryon-${result.resultId}.${blob.type.includes('png') ? 'png' : 'jpg'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch {
      // fallback: open in new tab
      window.open(result.generatedImageUrl, '_blank');
    }
  }, []);

  if (results.length === 0) {
    return (
      <div className="p-5 rounded-2xl bg-surface-container-lowest border border-surface-container">
        <h3 className="text-xs font-black text-outline uppercase tracking-widest mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-[16px] text-primary">auto_awesome</span>
          {t('ai_tryon.results', 'Results')}
        </h3>
        <div className="flex flex-col items-center justify-center py-10">
          <span className="material-symbols-outlined text-4xl text-outline/30 mb-2">image</span>
          <p className="text-sm font-bold text-outline">{t('ai_tryon.no_results', 'No generated images')}</p>
          <p className="text-[10px] text-outline/60 mt-1">{t('ai_tryon.no_results_hint', 'Select a photo and product to start')}</p>
        </div>
      </div>
    );
  }

  const current = results[currentIndex];

  return (
    <div className="p-5 rounded-2xl bg-surface-container-lowest border border-surface-container">
      <h3 className="text-xs font-black text-outline uppercase tracking-widest mb-4 flex items-center gap-2">
        <span className="material-symbols-outlined text-[16px] text-primary">auto_awesome</span>
        {t('ai_tryon.results', 'Results')}
        <span className="text-primary ml-auto text-[10px] font-bold">{currentIndex + 1} / {results.length}</span>
      </h3>

      {/* Swipeable Image Area */}
      <div
        className="relative rounded-xl overflow-hidden bg-surface-container"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className="flex transition-transform duration-300 ease-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {results.map((result) => (
            <div key={result.resultId} className="w-full flex-shrink-0">
              <div className="relative aspect-[3/4]">
                <img
                  src={result.generatedImageUrl}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          ))}
        </div>

        {/* Left/Right Arrows (desktop) */}
        {currentIndex > 0 && (
          <button
            onClick={() => setCurrentIndex(prev => prev - 1)}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">chevron_left</span>
          </button>
        )}
        {currentIndex < results.length - 1 && (
          <button
            onClick={() => setCurrentIndex(prev => prev + 1)}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">chevron_right</span>
          </button>
        )}

        {/* Dots Indicator */}
        {results.length > 1 && (
          <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
            {results.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                className={`rounded-full transition-all ${i === currentIndex ? 'w-5 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/40'}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Meta + Actions */}
      <div className="mt-3">
        <p className="text-xs font-bold text-on-surface truncate">{current?.productTitle}</p>
        <div className="flex items-center justify-between mt-1 mb-3">
          <p className="text-[10px] text-on-surface-variant">
            {current?.createdAt ? new Date(current.createdAt).toLocaleDateString() : ''}
          </p>
          <span className="text-[9px] text-outline bg-surface-container px-2 py-0.5 rounded-full font-bold uppercase">
            {current?.model?.replace('gemini-', '').replace('-image', '')}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => current && handleDownload(current)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl text-[11px] font-bold transition-colors active:scale-[0.98]"
          >
            <span className="material-symbols-outlined text-[16px]">download</span>
            {t('ai_tryon.download', 'Download')}
          </button>
          <button
            onClick={() => current && onDelete(current)}
            className="w-10 h-10 flex items-center justify-center bg-error/10 hover:bg-error/20 rounded-xl transition-colors active:scale-90"
          >
            <span className="material-symbols-outlined text-[16px] text-error">delete</span>
          </button>
        </div>
      </div>
    </div>
  );
}
