import React, { useState, useEffect } from 'react';

interface PresentationFooterProps {
  currentSlide: number;
  totalSlides: number;
  onJump?: (index: number) => void;
}

const sectionIndexes = [0, 6, 13, 18, 23, 31];

const PresentationFooter: React.FC<PresentationFooterProps> = ({ currentSlide, totalSlides, onJump }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    // Initial check
    handleFullscreenChange();
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.log(`Error attempting to enable full-screen mode: ${err.message}`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  return (
    <nav className="fixed bottom-0 left-0 w-full z-50 flex items-center justify-between px-[60px] lg:px-[80px] py-[32px] pointer-events-none">
      {/* Left: Minimal Section Dots */}
      <div className="flex-1 flex items-center pointer-events-auto">
        <div className="flex items-center gap-2 backdrop-blur-sm bg-white/30 px-4 py-2 rounded-full border border-black/5">
          {sectionIndexes.map((sectionIndex, i) => {
            const isActive = currentSlide >= sectionIndex && (sectionIndexes[i + 1] ? currentSlide < sectionIndexes[i + 1] : true);
            return (
              <button
                key={sectionIndex}
                onClick={() => onJump && onJump(sectionIndex)}
                className={`h-2 transition-all duration-300 rounded-full ${
                  isActive ? 'w-6 bg-[#1c1b1b]' : 'w-2 bg-[#1c1b1b]/30 hover:bg-[#1c1b1b]/60 hover:w-4'
                }`}
                aria-label={`Jump to section ${i + 1}`}
              />
            );
          })}
        </div>
      </div>
      
      {/* Center: Slide Indicator and Fullscreen Toggle */}
      <div className="flex items-center gap-3 font-['Space_Grotesk'] text-[14px] font-bold text-[#1c1b1b]/50 tracking-widest backdrop-blur-sm bg-white/30 px-6 py-2 rounded-full border border-black/5 pointer-events-auto">
        <button 
          onClick={toggleFullscreen} 
          className="hover:text-[#1c1b1b] transition-colors flex items-center justify-center" 
          title="Toggle Presentation Mode"
        >
          <span className="material-symbols-outlined text-[18px]">
            {isFullscreen ? 'fullscreen_exit' : 'fullscreen'}
          </span>
        </button>
        <span className="w-1 h-1 rounded-full bg-[#1c1b1b]/30"></span>
        <span>
          Slide {currentSlide}
        </span>
      </div>
      
      <div className="flex-1"></div>
    </nav>
  );
};

export default PresentationFooter;
