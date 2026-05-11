"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import PresentationHeader from '@/components/presentation/PresentationHeader';
import PresentationFooter from '@/components/presentation/PresentationFooter';
import { useNavigation } from '@/components/providers/NavigationProvider';

import { Slide0, Slide1, Slide2, Slide3, Slide4, Slide5 } from './slides-s1';
import { Slide6, Slide7, Slide8, Slide9, Slide10, Slide11, Slide12 } from './slides-s2';
import { Slide13, Slide14, Slide15, Slide16, Slide17 } from './slides-s3';
import { Slide18, Slide19, Slide20, Slide21, Slide22 } from './slides-s4';
import { Slide23, Slide24, Slide25, Slide26, Slide27, Slide28, Slide29, Slide30 } from './slides-s5';
import { Slide31, Slide32, Slide33, Slide34, Slide35, Slide36 } from './slides-s6';

const SLIDES = [
  Slide0, Slide1, Slide2, Slide3, Slide4, Slide5,
  Slide6, Slide7, Slide8, Slide9, Slide10, Slide11, Slide12,
  Slide13, Slide14, Slide15, Slide16, Slide17,
  Slide18, Slide19, Slide20, Slide21, Slide22,
  Slide23, Slide24, Slide25, Slide26, Slide27, Slide28, Slide29, Slide30,
  Slide31, Slide32, Slide33, Slide34, Slide35, Slide36,
];

const SLIDE_URLS: Record<number, string> = {
  7: '/groups/freestyletango?tab=calendar', // Slide 7: Calendar / 돈은 여기로 흐른다
  14: '/groups/freestyletango?tab=class', // Slide 14: Booking / 커뮤니티 거대 경제
  21: '/groups/freestyletango?tab=settings', // Slide 21: Function Builder / One Platform
};

const PresentationPage = () => {
  const { setGlobalNavHidden, setIsHeaderVisible } = useNavigation();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showStartScreen, setShowStartScreen] = useState(true);
  const [isFocusMode, setIsFocusMode] = useState(false);
  
  // Iframe states
  const [iframeUrl, setIframeUrl] = useState('/groups/freestyletango');
  const [fadeIframe, setFadeIframe] = useState(false);

  const totalSlides = SLIDES.length;

  const isScrollingRef = useRef(false);
  const touchStartYRef = useRef(0);
  const touchStartXRef = useRef(0);

  const nextSlide = useCallback(() => setCurrentSlide((prev) => (prev + 1) % totalSlides), [totalSlides]);
  const prevSlide = useCallback(() => setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides), [totalSlides]);
  const jumpToSlide = (index: number) => setCurrentSlide(index);

  // Sync iframe URL when slide changes (semi-sync)
  useEffect(() => {
    const newUrl = SLIDE_URLS[currentSlide];
    if (newUrl && newUrl !== iframeUrl) {
      setFadeIframe(true);
      setTimeout(() => {
        setIframeUrl(newUrl);
        setFadeIframe(false);
      }, 300);
    }
  }, [currentSlide, iframeUrl]);

  useEffect(() => {
    setGlobalNavHidden(true);
    setIsHeaderVisible(false);

    if (!showStartScreen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (showStartScreen) return;
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'ArrowDown') nextSlide();
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') prevSlide();
      if (e.key === 'd' || e.key === 'D') setIsFocusMode(prev => !prev);
    };

    const handleWheel = (e: WheelEvent) => {
      if (showStartScreen) return;
      if (isScrollingRef.current) return;

      // Don't trigger slide change if scrolling inside the iframe area
      // The iframe handles its own scroll, but just in case.
      isScrollingRef.current = true;
      if (e.deltaY > 50) {
        nextSlide();
      } else if (e.deltaY < -50) {
        prevSlide();
      }
      setTimeout(() => { isScrollingRef.current = false; }, 800);
    };

    const handleTouchStart = (e: TouchEvent) => {
      touchStartYRef.current = e.touches[0].clientY;
      touchStartXRef.current = e.touches[0].clientX;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (showStartScreen) return;
      if (isScrollingRef.current) return;
      
      const touchEndY = e.changedTouches[0].clientY;
      const touchEndX = e.changedTouches[0].clientX;
      const diffY = touchStartYRef.current - touchEndY;
      const diffX = touchStartXRef.current - touchEndX;

      if (Math.abs(diffY) > 50 || Math.abs(diffX) > 50) {
        isScrollingRef.current = true;
        if (Math.abs(diffX) > Math.abs(diffY)) {
          if (diffX > 0) nextSlide();
          else prevSlide();
        } else {
          if (diffY > 0) nextSlide();
          else prevSlide();
        }
        setTimeout(() => { isScrollingRef.current = false; }, 800);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('wheel', handleWheel, { passive: true }); 
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    
    return () => {
      setGlobalNavHidden(false);
      setIsHeaderVisible(true);
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [setGlobalNavHidden, setIsHeaderVisible, nextSlide, prevSlide, showStartScreen]);

  const handleStartPresentation = () => {
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
      elem.requestFullscreen().catch(err => {
        console.log(`Error attempting to enable full-screen mode: ${err.message}`);
      });
    }
    setShowStartScreen(false);
  };

  const CurrentSlideComponent = SLIDES[currentSlide];

  return (
    <div className="min-h-screen bg-[#050505] text-white font-['Manrope'] selection:bg-[#c6c6c7] overflow-hidden relative flex w-full">
      <link href="https://fonts.googleapis.com/css2?family=Geist:wght@100..900&family=Space+Grotesk:wght@300..700&family=Manrope:wght@200..800&display=swap" rel="stylesheet"/>
      
      {showStartScreen ? (
        <div className="absolute inset-0 z-[100] flex flex-col items-center justify-center bg-[#050505]">
          <div className="mb-12 flex flex-col items-center">
            <h1 className="text-4xl font-bold tracking-tighter text-white mb-4">WoC Presentation</h1>
            <p className="text-white/60">Live Ecosystem Demo</p>
          </div>
          <button 
            onClick={handleStartPresentation}
            className="px-8 py-4 bg-white text-black rounded-full text-lg font-bold hover:bg-gray-200 transition-all transform hover:scale-105 shadow-xl flex items-center gap-3"
          >
            <span className="material-symbols-outlined">fullscreen</span>
            Start Presentation
          </button>
        </div>
      ) : null}

      {/* Presentation Left Side */}
      <div className={`w-full lg:flex-1 h-screen relative flex flex-col bg-[#fcf8f8] text-[#1c1b1b] overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] z-10 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${isFocusMode ? 'rounded-none' : 'lg:rounded-r-[40px]'}`}>
        <PresentationHeader />

        <main className="relative flex-1 w-full flex items-center justify-center overflow-hidden">
          <div className="w-full h-full flex items-center justify-center transition-opacity duration-500">
            {CurrentSlideComponent ? <CurrentSlideComponent /> : null}
          </div>
        </main>

        <PresentationFooter 
          currentSlide={currentSlide} 
          totalSlides={totalSlides}
          onJump={jumpToSlide}
        />
      </div>

      {/* Live App Right Side */}
      <div 
        className={`hidden lg:flex shrink-0 h-screen bg-[#050505] flex-col items-center justify-center relative z-0 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${isFocusMode ? 'w-[40px] xl:w-[60px] cursor-pointer hover:bg-[#111]' : 'w-[420px] xl:w-[480px] 2xl:w-[560px]'}`} 
        onClick={() => isFocusMode && setIsFocusMode(false)}
      >
        {isFocusMode ? (
          // Collapsed State
          <div className="h-full w-full flex flex-col items-center justify-center py-10 opacity-50 hover:opacity-100 transition-opacity">
            <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse shadow-[0_0_5px_rgba(239,68,68,1)] mb-8"></div>
            <div className="text-[10px] text-white/50 tracking-[0.3em] font-bold uppercase -rotate-90 whitespace-nowrap origin-center">
              Live Demo
            </div>
          </div>
        ) : (
          // Expanded State
          <>
            {/* Collapse Toggle Button */}
            <button 
              onClick={(e) => { e.stopPropagation(); setIsFocusMode(true); }}
              className="absolute top-8 right-8 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 transition-colors z-50 backdrop-blur-md"
              title="Focus Mode"
            >
              <span className="material-symbols-outlined text-xl">fullscreen</span>
            </button>

            {/* LIVE DEMO Badge */}
            <div className="absolute top-10 flex items-center justify-center pointer-events-none">
               <div className="px-3 py-1.5 bg-red-500/10 text-red-500 text-[10px] font-bold rounded-full uppercase tracking-widest flex items-center gap-2 border border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.2)]">
                  <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse shadow-[0_0_5px_rgba(239,68,68,1)]"></span>
                  LIVE DEMO
               </div>
            </div>

            {/* iPhone Pro Max Frame (430x932) */}
            <div className="relative w-[430px] h-[932px] rounded-[55px] border-[14px] border-[#1a1a1a] shadow-[0_0_60px_rgba(0,0,0,0.8)] overflow-hidden bg-black scale-[0.7] xl:scale-[0.8] 2xl:scale-[0.9] origin-center transition-transform duration-500 hover:scale-[0.72] xl:hover:scale-[0.82] 2xl:hover:scale-[0.92]">
                {/* Half Notch attached to top */}
                <div className="absolute top-0 inset-x-0 flex justify-center z-50 pointer-events-none">
                  <div className="w-[100px] h-[14px] bg-black rounded-b-[14px] flex justify-center items-end pb-1 shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
                     <div className="w-2.5 h-2.5 bg-[#1a1a1a] rounded-full relative ml-2">
                       <div className="absolute inset-[1px] bg-blue-500/20 rounded-full"></div>
                     </div>
                  </div>
                </div>

                {/* Inner iframe container to hide browser scrollbars cleanly */}
                <div className="w-full h-full overflow-hidden bg-background">
                   <iframe 
                       src={iframeUrl} 
                       className={`w-full h-full border-0 bg-background transition-opacity duration-500 ${fadeIframe ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}
                       style={{ pointerEvents: 'auto' }}
                       title="WoC Live Demo"
                   />
                </div>
            </div>

            <div className="absolute bottom-10 px-6 text-center pointer-events-none">
               <p className="text-white/30 text-[11px] font-medium tracking-wider">
                 Fully functional live ecosystem.<br/>Changes are not mocked.
               </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PresentationPage;
