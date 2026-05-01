'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Portal from '@/components/common/Portal';

interface MediaData {
  url: string;
  type: 'image' | 'video';
}

interface MediaViewerPopupProps {
  isOpen: boolean;
  onClose: () => void;
  media: MediaData[];
  initialIndex?: number;
}

export default function MediaViewerPopup({ isOpen, onClose, media, initialIndex = 0 }: MediaViewerPopupProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [slideDir, setSlideDir] = useState<'left' | 'right' | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  // 뒤로가기 인터셉트용 - 우리가 pushState 했는지 추적
  const didPushState = useRef(false);

  // 팝업 열릴 때 더미 히스토리 추가, 닫힐 때 초기화
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
      setSlideDir(null);
      document.body.style.overflow = 'hidden';

      // 더미 히스토리 상태 push → 뒤로가기가 이 상태를 pop하게 됨
      history.pushState({ mediaViewer: true }, '');
      didPushState.current = true;
    } else {
      document.body.style.overflow = '';
      didPushState.current = false;
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, initialIndex]);

  // popstate 이벤트 = 디바이스/브라우저 뒤로가기
  useEffect(() => {
    const handlePopState = () => {
      if (isOpen && didPushState.current) {
        // 브라우저가 이미 더미 상태를 pop했으므로 그냥 닫기만 하면 됨
        didPushState.current = false;
        onClose();
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isOpen, onClose]);

  // UI로 닫을 때 (X버튼, 배경 클릭 등) → 우리가 push한 더미 상태를 직접 제거
  const handleClose = useCallback(() => {
    if (didPushState.current) {
      didPushState.current = false;
      history.back(); // popstate 발생 → handlePopState에서 onClose() 호출
    } else {
      onClose();
    }
  }, [onClose]);

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
        className="fixed inset-0 z-[20000] bg-black/95 backdrop-blur-sm flex flex-col"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* 상단 헤더 */}
        <header className="absolute top-0 w-full z-10 flex items-center justify-between p-4 bg-gradient-to-b from-black/60 to-transparent pointer-events-none">
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
              <video
                src={currentMedia.url}
                className="max-w-full max-h-[85vh] object-contain rounded-lg"
                controls
                autoPlay
                playsInline
              />
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
          <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-1.5 pointer-events-none">
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
