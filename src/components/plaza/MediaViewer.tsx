import React, { useEffect, useState } from 'react';

interface MediaItem {
  url: string;
  type: 'image' | 'video';
}

interface MediaViewerProps {
  items: MediaItem[];
  initialIndex: number;
  isOpen: boolean;
  onClose: () => void;
}

export default function MediaViewer({ items, initialIndex, isOpen, onClose }: MediaViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  // Reset index when opened
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, initialIndex]);

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : items.length - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev < items.length - 1 ? prev + 1 : 0));
  };

  if (!isOpen) return null;

  const currentItem = items[currentIndex];

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-0 animate-in fade-in duration-300 font-manrope">
      <div 
        className="absolute inset-0 bg-black/98 backdrop-blur-2xl transition-opacity animate-in fade-in duration-500" 
        onClick={onClose} 
      />
      
      {/* Top Header Actions */}
      <div className="absolute top-0 left-0 right-0 p-6 sm:p-10 flex items-center justify-between z-20 pointer-events-none">
        <div className="pointer-events-auto">
          <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/5">
             <span className="text-[10px] text-white font-black uppercase tracking-[0.2em]">
               {currentIndex + 1} / {items.length}
             </span>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="pointer-events-auto w-12 h-12 rounded-full bg-white/10 text-white flex items-center justify-center backdrop-blur-md hover:bg-white/20 transition-all active:scale-90"
        >
          <span className="material-symbols-outlined text-[24px]">close</span>
        </button>
      </div>

      {/* Navigation Controls (Only if multiple items) */}
      {items.length > 1 && (
        <>
          <button 
            onClick={handlePrev}
            className="absolute left-4 sm:left-10 z-10 w-14 h-14 rounded-full bg-white/5 text-white flex items-center justify-center backdrop-blur-sm hover:bg-white/10 transition-all"
          >
            <span className="material-symbols-outlined text-[32px]">chevron_left</span>
          </button>
          <button 
            onClick={handleNext}
            className="absolute right-4 sm:right-10 z-10 w-14 h-14 rounded-full bg-white/5 text-white flex items-center justify-center backdrop-blur-sm hover:bg-white/10 transition-all"
          >
            <span className="material-symbols-outlined text-[32px]">chevron_right</span>
          </button>
        </>
      )}

      {/* Media Content */}
      <div className="relative z-0 w-full h-full flex items-center justify-center p-4 sm:p-20 pointer-events-none">
        <div 
          key={currentIndex} 
          className="relative w-full h-full flex items-center justify-center pointer-events-auto max-w-6xl animate-in zoom-in-95 fade-in duration-500"
        >
          {currentItem.type === 'video' ? (
            <video 
              src={currentItem.url} 
              className="max-w-full max-h-full object-contain shadow-[0_0_100px_rgba(0,0,0,0.5)] rounded-2xl"
              autoPlay 
              controls 
              playsInline 
            />
          ) : (
            <img 
              src={currentItem.url} 
              alt={`view-${currentIndex}`} 
              className="max-w-full max-h-full object-contain shadow-[0_0_100px_rgba(0,0,0,0.5)] rounded-2xl"
            />
          )}

          {/* Social Meta (Bottom Info) */}
          <div className="absolute -bottom-12 sm:bottom-0 left-0 right-0 flex justify-center py-10 opacity-60">
            <div className="flex flex-col items-center gap-2">
              <span className="text-[9px] text-white/40 font-black uppercase tracking-[0.4em]">Cinematic Gallery View</span>
              <div className="flex gap-1.5">
                {items.map((_, i) => (
                  <div 
                    key={i} 
                    className={`h-1 transition-all duration-300 rounded-full ${i === currentIndex ? 'w-8 bg-white' : 'w-2 bg-white/20'}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
