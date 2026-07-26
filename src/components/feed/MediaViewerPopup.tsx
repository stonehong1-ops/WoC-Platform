'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import Portal from '@/components/common/Portal';
import { useBackButtonClose } from '@/hooks/useBackButtonClose';

interface MediaData {
  url: string;
  type: 'image' | 'video';
}

interface MediaViewerPopupProps {
  isOpen: boolean;
  onClose: () => void;
  media: MediaData[];
  initialIndex?: number;
  playbackRateControl?: boolean;
}

export default function MediaViewerPopup({
  isOpen,
  onClose,
  media,
  initialIndex = 0,
  playbackRateControl = false
}: MediaViewerPopupProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [slideDir, setSlideDir] = useState<'left' | 'right' | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [playbackRate, setPlaybackRate] = useState<number>(1.0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  // UI로 닫기
  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  // isOpen이 true가 되거나 initialIndex가 변경될 때 currentIndex 및 playbackRate(1.0) 즉시 동기화
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
      setPlaybackRate(1.0);
      setSlideDir(null);
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [isOpen, initialIndex]);

  // Android 하드웨어 뒤로가기 버튼 닫기 연동 (hasOpenModals() === true 보장 & 페이지 이동 차단)
  useBackButtonClose(isOpen, handleClose);

  const goTo = useCallback((nextIndex: number, dir: 'left' | 'right') => {
    if (isAnimating) return;
    setIsAnimating(true);
    setSlideDir(dir);
    setTimeout(() => {
      setCurrentIndex(nextIndex);
      setSlideDir(null);
      setIsAnimating(false);
    }, 250);
  }, [isAnimating]);

  const handlePrev = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    const nextIndex = currentIndex > 0 ? currentIndex - 1 : media.length - 1;
    goTo(nextIndex, 'right');
  }, [currentIndex, media.length, goTo]);

  const handleNext = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    const nextIndex = currentIndex < media.length - 1 ? currentIndex + 1 : 0;
    goTo(nextIndex, 'left');
  }, [currentIndex, media.length, goTo]);

  // 키보드 지원
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, handlePrev, handleNext, handleClose]);

  // 터치 스와이프
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    const deltaY = Math.abs(e.changedTouches[0].clientY - touchStartY.current);
    if (Math.abs(deltaX) < 50 || deltaY > Math.abs(deltaX)) {
      touchStartX.current = null;
      touchStartY.current = null;
      return;
    }
    if (media.length > 1) {
      if (deltaX < -50) handleNext();
      else if (deltaX > 50) handlePrev();
    }
    touchStartX.current = null;
    touchStartY.current = null;
  };

  if (!isOpen || !media || media.length === 0) return null;

  const currentMedia = media[currentIndex];

  const slideStyle: React.CSSProperties = {
    transition: slideDir ? 'transform 0.25s cubic-bezier(0.4,0,0.2,1), opacity 0.25s' : 'none',
    transform: slideDir === 'left' ? 'translateX(-60px)' : slideDir === 'right' ? 'translateX(60px)' : 'translateX(0)',
    opacity: slideDir ? 0 : 1,
  };

  return (
    <Portal>
      <div
        className="fixed inset-0 z-[999999] bg-black/95 backdrop-blur-sm flex flex-col"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* 상단 헤더 */}
        <header 
          className="absolute top-0 w-full z-10 flex items-center justify-between pb-4 px-4 bg-gradient-to-b from-black/60 to-transparent pointer-events-none"
          style={{ paddingTop: 'calc(16px + env(safe-area-inset-top, 0px))' }}
        >
          <div className="text-white font-bold text-sm tracking-widest bg-black/40 px-3 py-1 rounded-full backdrop-blur-md pointer-events-auto">
            {currentIndex + 1} / {media.length}
          </div>
          <button
            onClick={handleClose}
            className="w-10 h-10 flex items-center justify-center bg-black/40 hover:bg-black/60 backdrop-blur-md rounded-full text-white transition-colors pointer-events-auto"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </header>

        {/* 미디어 영역 */}
        <div
          className="flex-1 flex items-center justify-center relative w-full"
          onClick={handleClose}
        >
          <div
            key={currentIndex}
            style={slideStyle}
            className="max-w-full max-h-full flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {currentMedia.type === 'video' ? (
              <div className="relative flex flex-col items-center max-w-full max-h-[85vh]">
                <video
                  ref={videoRef}
                  src={currentMedia.url}
                  className="max-w-full max-h-[80vh] object-contain rounded-lg"
                  controls
                  autoPlay
                  playsInline
                  onPlay={() => {
                    if (videoRef.current) {
                      videoRef.current.playbackRate = playbackRate;
                    }
                  }}
                />
                {playbackRateControl && (
                  <div className="flex items-center gap-1.5 mt-3 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 z-20" onClick={(e) => e.stopPropagation()}>
                    <span className="text-[10px] font-bold text-white/70 mr-1 uppercase tracking-wider">Speed</span>
                    {[0.5, 0.75, 1.0].map((rate) => (
                      <button
                        key={rate}
                        onClick={() => {
                          setPlaybackRate(rate);
                          if (videoRef.current) {
                            videoRef.current.playbackRate = rate;
                          }
                        }}
                        className={`px-2.5 py-0.5 rounded-full text-xs font-bold transition-all ${
                          playbackRate === rate
                            ? 'bg-primary text-white shadow-sm'
                            : 'bg-white/10 text-white/80 hover:bg-white/20'
                        }`}
                      >
                        {rate}x
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <img
                src={currentMedia.url}
                alt={`media-${currentIndex}`}
                className="max-w-full max-h-[85vh] object-contain rounded-lg select-none"
                draggable={false}
              />
            )}
          </div>

          {/* 이전/다음 버튼 */}
          {media.length > 1 && (
            <>
              <button
                onClick={handlePrev}
                className="absolute left-3 sm:left-6 w-11 h-11 flex items-center justify-center bg-white/10 hover:bg-white/25 backdrop-blur-md rounded-full text-white transition-all active:scale-90 z-10"
              >
                <span className="material-symbols-outlined text-2xl">chevron_left</span>
              </button>
              <button
                onClick={handleNext}
                className="absolute right-3 sm:right-6 w-11 h-11 flex items-center justify-center bg-white/10 hover:bg-white/25 backdrop-blur-md rounded-full text-white transition-all active:scale-90 z-10"
              >
                <span className="material-symbols-outlined text-2xl">chevron_right</span>
              </button>
            </>
          )}
        </div>

        {/* 하단 도트 인디케이터 */}
        {media.length > 1 && (
          <div 
            className="absolute left-0 right-0 flex justify-center gap-1.5 pointer-events-none"
            style={{ bottom: 'calc(32px + env(safe-area-inset-bottom, 0px))' }}
          >
            {media.map((_, i) => (
              <div
                key={i}
                className={`rounded-full transition-all duration-300 ${
                  i === currentIndex
                    ? 'w-6 h-1.5 bg-white'
                    : 'w-1.5 h-1.5 bg-white/30'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </Portal>
  );
}
