import React, { useState, useEffect } from 'react';
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

  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, initialIndex]);

  if (!isOpen || !media || media.length === 0) return null;

  const currentMedia = media[currentIndex];

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : media.length - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev < media.length - 1 ? prev + 1 : 0));
  };

  return (
    <Portal>
      <div className="fixed inset-0 z-[20000] bg-black/95 backdrop-blur-sm flex flex-col animate-in fade-in duration-200">
        <header className="absolute top-0 w-full z-10 flex items-center justify-between p-4 bg-gradient-to-b from-black/50 to-transparent">
          <div className="text-white font-bold text-sm tracking-widest bg-black/40 px-3 py-1 rounded-full backdrop-blur-md">
            {currentIndex + 1} / {media.length}
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center bg-black/40 hover:bg-black/60 backdrop-blur-md rounded-full text-white transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </header>

        <div className="flex-1 flex items-center justify-center relative w-full h-full" onClick={onClose}>
          {currentMedia.type === 'video' ? (
            <video 
              src={currentMedia.url} 
              className="max-w-full max-h-full object-contain"
              controls
              autoPlay
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <img 
              src={currentMedia.url} 
              alt="Media content"
              className="max-w-full max-h-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          )}

          {media.length > 1 && (
            <>
              <button 
                onClick={handlePrev}
                className="absolute left-4 w-12 h-12 flex items-center justify-center bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white transition-colors"
              >
                <span className="material-symbols-outlined text-2xl">chevron_left</span>
              </button>
              <button 
                onClick={handleNext}
                className="absolute right-4 w-12 h-12 flex items-center justify-center bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white transition-colors"
              >
                <span className="material-symbols-outlined text-2xl">chevron_right</span>
              </button>
            </>
          )}
        </div>
      </div>
    </Portal>
  );
}
