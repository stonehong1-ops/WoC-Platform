"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import PresentationHeader from '@/components/presentation/PresentationHeader';
import PresentationFooter from '@/components/presentation/PresentationFooter';
import { useNavigation } from '@/components/providers/NavigationProvider';

import { Slide0, Slide1, Slide2, Slide3, Slide4, Slide5, Slide6, Slide7, Slide8, Slide9, Slide10, Slide11, Slide12, Slide13, Slide14, Slide15, Slide16 } from './slides-s1';

const SLIDES = [
  Slide0, Slide1, Slide2, Slide3, Slide4, Slide5, Slide6, Slide7, Slide8, Slide9, Slide10, Slide11, Slide12, Slide13, Slide14, Slide15, Slide16
];

const SLIDE_URLS: Record<number, string> = {
  0: '/groups/freestyle-tango',                  // Slide 0: 인트로
  1: '/groups/freestyle-tango',                  // Slide 1: 더 스토리
  2: '/groups/freestyle-tango?tab=calendar',     // Slide 2: 머니 플로우
  3: '/groups/freestyle-tango?tab=calendar',     // Slide 3: 마지막 플랫폼
  4: '/groups/freestyle-tango',                  // Slide 4: 위너가 없는 이유
  5: '/groups/freestyle-tango',                  // Slide 5: 원 플랫폼
  6: '/groups/freestyle-tango?tab=class',        // Slide 6: 라이프 고즈 온
  7: '/groups/freestyle-tango',                  // Slide 7: 파편화
  8: '/groups/freestyle-tango?tab=class',        // Slide 8: 첫 소사이어티
  9: '/groups/freestyle-tango?tab=class',        // Slide 9: OS 검증
  10: '/groups/freestyle-tango?tab=class',       // Slide 10: 네트워크 확장
  11: '/groups/freestyle-tango?tab=class',       // Slide 11: 매스마켓 검증
  12: '/groups/freestyle-tango?tab=settings',    // Slide 12: 60개 소사이어티
  13: '/groups/freestyle-tango',                 // Slide 13: 전략적 가치
  14: '/groups/freestyle-tango',                 // Slide 14: 와이 나우
  15: '/groups/freestyle-tango',                 // Slide 15: 클로징 OS
  16: '/groups/freestyle-tango',                 // Slide 16: 엔젤 라운드
};

const GLOBAL_ANIMATIONS = `
  @keyframes pt1-slideEnter { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes pt1-fadeUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes pt1-fadeIn { from { opacity: 0; } to { opacity: 1; } }
  @keyframes pt1-scaleIn { from { opacity: 0; transform: scale(0.92); } to { opacity: 1; transform: scale(1); } }
  @keyframes pt1-lineGrow { from { transform: scaleX(0); } to { transform: scaleX(1); } }
  @keyframes pt1-slideRight { from { opacity: 0; transform: translateX(40px); } to { opacity: 1; transform: translateX(0); } }
  @keyframes pt1-slideLeft { from { opacity: 0; transform: translateX(-40px); } to { opacity: 1; transform: translateX(0); } }
  @keyframes pt1-slideDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes pt1-donutReveal { from { transform: rotate(-90deg) scale(0.8); opacity: 0; } to { transform: rotate(0deg) scale(1); opacity: 1; } }
  @keyframes pt1-counterUp { from { opacity: 0; transform: translateY(20px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
  @keyframes pt1-shimmer { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
  @keyframes pt1-pulse { 0%, 100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.02); opacity: 0.85; } }
  @keyframes pt1-glowPulse { 0%, 100% { text-shadow: 0 0 20px rgba(255,255,255,0.1); } 50% { text-shadow: 0 0 40px rgba(255,255,255,0.3); } }
  @keyframes pt1-startGlow { 0%, 100% { box-shadow: 0 0 40px rgba(255,255,255,0.05); } 50% { box-shadow: 0 0 80px rgba(255,255,255,0.15), 0 0 120px rgba(255,255,255,0.05); } }
  @keyframes pt1-dotPulse { 0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(0,0,0,0.3); } 50% { transform: scale(1.3); box-shadow: 0 0 0 8px rgba(0,0,0,0); } }
  @keyframes pt1-drawUnderline { from { transform: scaleX(0); } to { transform: scaleX(1); } }
  @keyframes pt1-bgDrift { 0% { transform: scale(1.02); } 100% { transform: scale(1.08) translate(-0.5%, -0.5%); } }

  .pt1-enter { animation: pt1-slideEnter 0.6s cubic-bezier(0.16,1,0.3,1) both; }
  .pt1-fu { animation: pt1-fadeUp 0.8s cubic-bezier(0.16,1,0.3,1) both; }
  .pt1-fi { animation: pt1-fadeIn 0.6s ease-out both; }
  .pt1-si { animation: pt1-scaleIn 0.7s cubic-bezier(0.16,1,0.3,1) both; }
  .pt1-lg { animation: pt1-lineGrow 1s cubic-bezier(0.16,1,0.3,1) both; transform-origin: left; }
  .pt1-sr { animation: pt1-slideRight 0.7s cubic-bezier(0.16,1,0.3,1) both; }
  .pt1-sl { animation: pt1-slideLeft 0.7s cubic-bezier(0.16,1,0.3,1) both; }
  .pt1-sd { animation: pt1-slideDown 0.6s cubic-bezier(0.16,1,0.3,1) both; }
  .pt1-dr { animation: pt1-donutReveal 1.2s cubic-bezier(0.16,1,0.3,1) both; }
  .pt1-cu { animation: pt1-counterUp 0.7s cubic-bezier(0.16,1,0.3,1) both; }
  .pt1-p { animation: pt1-pulse 3s ease-in-out infinite; }
  .pt1-gp { animation: pt1-glowPulse 3s ease-in-out infinite; }
  .pt1-dp { animation: pt1-dotPulse 2s ease-in-out infinite; }
  .pt1-du { animation: pt1-drawUnderline 0.8s cubic-bezier(0.16,1,0.3,1) both; transform-origin: left; }

  .pt1-d1 { animation-delay: 100ms; }
  .pt1-d2 { animation-delay: 200ms; }
  .pt1-d3 { animation-delay: 300ms; }
  .pt1-d4 { animation-delay: 400ms; }
  .pt1-d5 { animation-delay: 500ms; }
  .pt1-d6 { animation-delay: 600ms; }
  .pt1-d7 { animation-delay: 700ms; }
  .pt1-d8 { animation-delay: 800ms; }
  .pt1-d9 { animation-delay: 900ms; }
  .pt1-d10 { animation-delay: 1000ms; }
  .pt1-d12 { animation-delay: 1200ms; }
  .pt1-d15 { animation-delay: 1500ms; }

  .pt1-shimmer-text {
    background: linear-gradient(90deg, #ffffff 40%, rgba(255,255,255,0.5) 50%, #ffffff 60%);
    background-size: 200% auto;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    animation: pt1-shimmer 4s linear infinite;
  }

  @media screen {
    .print-only-container {
      position: absolute !important;
      left: -9999px !important;
      top: -9999px !important;
      opacity: 0 !important;
      pointer-events: none !important;
      width: 1500px !important;
      height: auto !important;
    }
    
    .print-slide {
      width: 1500px !important;
      height: 1060px !important;
      box-sizing: border-box !important;
      overflow: hidden !important;
      background: #fcf8f8 !important;
      display: flex !important;
      flex-direction: column !important;
      align-items: center !important;
      justify-content: center !important;
    }

    .print-slide > * {
      width: 1500px !important;
      height: 1060px !important;
      min-height: 1060px !important;
      max-height: 1060px !important;
      box-sizing: border-box !important;
      overflow: hidden !important;
    }
  }

  .print-only-container * {
    animation: none !important;
    opacity: 1 !important;
    transition: none !important;
  }

  @media print {
    .screen-only-view {
      display: none !important;
    }

    html, body, #__next {
      background: #fcf8f8 !important;
      color: #1c1b1b !important;
      width: 297mm !important;
      height: auto !important;
      margin: 0 !important;
      padding: 0 !important;
      overflow: visible !important;
      display: block !important;
    }

    * {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      box-sizing: border-box !important;
    }

    .print-only-container {
      display: block !important;
      position: relative !important;
      z-index: 99999 !important;
      background: #fcf8f8 !important;
      width: 297mm !important;
      height: auto !important;
      margin: 0 !important;
      padding: 0 !important;
    }

    .print-slide {
      width: 297mm !important;
      height: 210mm !important;
      page-break-after: always !important;
      break-after: page !important;
      display: flex !important;
      flex-direction: column !important;
      align-items: center !important;
      justify-content: center !important;
      box-sizing: border-box !important;
      overflow: hidden !important;
      background: #fcf8f8 !important;
      position: relative !important;
      margin: 0 !important;
      padding: 0 !important;
    }
    
    @page {
      size: landscape;
      margin: 0;
    }
  }
`;

const PresentationPage = () => {
  const { setGlobalNavHidden, setIsHeaderVisible } = useNavigation();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showStartScreen, setShowStartScreen] = useState(true);
  const [isFocusMode, setIsFocusMode] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);
  
  // Iframe states
  const [iframeUrl, setIframeUrl] = useState('/groups/freestyle-tango');
  const [fadeIframe, setFadeIframe] = useState(false);

  // 초고화질 원클릭 PDF 변환 저장 빌더
  const handleDownloadPDF = async () => {
    const { toast } = await import('sonner');
    const toastId = toast.loading("초고화질 피치덱 PDF 생성 중... (약 5~10초 소요)");

    try {
      const html2canvas = (await import('html2canvas-pro')).default;
      const { jsPDF } = await import('jspdf');

      const printContainer = document.querySelector('.print-only-container') as HTMLElement;
      if (!printContainer) {
        throw new Error("출력 슬라이드 영역을 찾을 수 없습니다.");
      }

      const slides = printContainer.querySelectorAll('.print-slide');
      if (slides.length === 0) {
        throw new Error("출력할 슬라이드 엘리먼트가 존재하지 않습니다.");
      }

      const origStyles = printContainer.style.cssText;
      printContainer.style.cssText = `
        position: fixed !important;
        left: 0 !important;
        top: 0 !important;
        z-index: -1 !important;
        opacity: 0 !important;
        pointer-events: none !important;
        width: 1500px !important;
        height: auto !important;
        overflow: visible !important;
      `;
      
      await new Promise(r => setTimeout(r, 300));
      printContainer.getBoundingClientRect();

      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      for (let i = 0; i < slides.length; i++) {
        const slide = slides[i] as HTMLElement;
        
        const canvas = await html2canvas(slide, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#fcf8f8',
          logging: false,
          width: 1500,
          height: 1060,
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        
        if (i > 0) {
          pdf.addPage([297, 210], 'landscape');
        }

        pdf.addImage(imgData, 'JPEG', 0, 0, 297, 210);
      }

      printContainer.style.cssText = origStyles;

      pdf.save("WoC_Ecosystem_PitchDeck.pdf");
      toast.success("초고화질 피치덱 PDF 다운로드가 완료되었습니다!", { id: toastId });
    } catch (error) {
      console.error("PDF 생성 에러:", error);
      const pc = document.querySelector('.print-only-container') as HTMLElement;
      if (pc) pc.style.cssText = '';
      toast.error("PDF 생성 중 예상치 못한 에러가 발생했습니다. 다시 시도해 주세요.", { id: toastId });
    }
  };

  // Check demo mode from query params
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      setIsDemoMode(params.get('demo') === '1');
    }
  }, []);

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
      if (e.key === 'l' || e.key === 'L') setIsDemoMode(prev => !prev);
    };

    const handleWheel = (e: WheelEvent) => {
      if (showStartScreen) return;
      if (isScrollingRef.current) return;

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
      elem.requestFullscreen().catch(() => {});
    }
    setShowStartScreen(false);
  };

  const CurrentSlideComponent = SLIDES[currentSlide];

  return (
    <div className="min-h-screen bg-[#050505] text-white font-['Manrope'] selection:bg-[#c6c6c7] overflow-hidden relative flex w-full">
      <link href="https://fonts.googleapis.com/css2?family=Geist:wght@100..900&family=Space+Grotesk:wght@300..700&family=Manrope:wght@200..800&display=swap" rel="stylesheet"/>
      <style>{GLOBAL_ANIMATIONS}</style>
      
      {showStartScreen ? (
        <div className="screen-only-view absolute inset-0 z-[100] flex flex-col items-center justify-center bg-[#050505]">
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-[600px] h-[600px] rounded-full bg-white/[0.02] blur-[120px]" style={{ animation: 'pt1-startGlow 4s ease-in-out infinite' }} />
          </div>
          <div className="mb-12 flex flex-col items-center relative pt1-fu">
            <h1 className="text-4xl font-bold tracking-tighter text-white mb-4">WoC Presentation</h1>
            <p className="text-white/60">Live Ecosystem Demo</p>
          </div>
          <button 
            onClick={handleStartPresentation}
            className="px-8 py-4 bg-white text-black rounded-full text-lg font-bold hover:bg-gray-200 transition-all transform hover:scale-105 shadow-xl flex items-center gap-3 pt1-fu pt1-d3"
            style={{ animation: 'pt1-fadeUp 0.8s cubic-bezier(0.16,1,0.3,1) 300ms both, pt1-startGlow 3s ease-in-out infinite 1s' }}
          >
            <span className="material-symbols-outlined">fullscreen</span>
            Start Presentation
          </button>
        </div>
      ) : null}

      {/* Presentation Left Side */}
      <div className={`screen-only-view w-full lg:flex-1 h-screen relative flex flex-col bg-[#fcf8f8] text-[#1c1b1b] overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] z-10 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${isFocusMode ? 'rounded-none' : 'lg:rounded-r-[40px]'}`}>
        <PresentationHeader />

        <main className="relative flex-1 w-full flex items-center justify-center overflow-hidden">
          <div key={currentSlide} className="w-full h-full flex items-center justify-center pt1-enter">
            {CurrentSlideComponent ? <CurrentSlideComponent /> : null}
          </div>
        </main>

        <PresentationFooter 
          currentSlide={currentSlide} 
          totalSlides={totalSlides}
          onJump={jumpToSlide}
          sectionIndexes={[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]}
          onPrint={handleDownloadPDF}
        />
      </div>

      {/* Live App Right Side */}
      <div 
        className={`screen-only-view hidden lg:flex shrink-0 h-screen bg-[#050505] flex-col items-center justify-center relative z-0 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${isFocusMode ? 'w-[40px] xl:w-[60px] cursor-pointer hover:bg-[#111]' : 'w-[420px] xl:w-[480px] 2xl:w-[560px]'}`} 
        onClick={() => isFocusMode && setIsFocusMode(false)}
      >
        {isFocusMode ? (
          <div className="h-full w-full flex flex-col items-center justify-center py-10 opacity-50 hover:opacity-100 transition-opacity">
            <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse shadow-[0_0_5px_rgba(239,68,68,1)] mb-8"></div>
            <div className="text-[10px] text-white/50 tracking-[0.3em] font-bold uppercase -rotate-90 whitespace-nowrap origin-center">
              Live Demo
            </div>
          </div>
        ) : (
          <>
            <button 
              onClick={(e) => { e.stopPropagation(); setIsFocusMode(true); }}
              className="absolute top-8 right-8 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 transition-colors z-50 backdrop-blur-md"
              title="Focus Mode"
            >
              <span className="material-symbols-outlined text-xl">fullscreen</span>
            </button>

            <div className="absolute top-10 flex items-center justify-center z-50">
               <button 
                  onClick={(e) => { e.stopPropagation(); setIsDemoMode(prev => !prev); }}
                  className={`px-3 py-1.5 text-[10px] font-bold rounded-full uppercase tracking-widest flex items-center gap-2 border transition-all duration-300 hover:scale-105 active:scale-95 shadow-[0_0_15px_rgba(0,0,0,0.3)] ${
                    isDemoMode 
                      ? 'bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20' 
                      : 'bg-white/10 text-white/70 border-white/20 hover:bg-white/20'
                  }`}
                  title="Click to Switch Demo/Preview Mode (Shortcut: L)"
               >
                  <span className={`w-1.5 h-1.5 rounded-full ${isDemoMode ? 'bg-red-500 animate-pulse shadow-[0_0_5px_rgba(239,68,68,1)]' : 'bg-white/40'}`}></span>
                  {isDemoMode ? 'LIVE DEMO (ACTIVE)' : 'PREVIEW MODE (IMAGE)'}
               </button>
            </div>

            <div className="relative w-[430px] h-[932px] rounded-[55px] border-[14px] border-[#1a1a1a] shadow-[0_0_60px_rgba(0,0,0,0.8)] overflow-hidden bg-black scale-[0.7] xl:scale-[0.8] 2xl:scale-[0.9] origin-center transition-transform duration-500 hover:scale-[0.72] xl:hover:scale-[0.82] 2xl:hover:scale-[0.92]">
                <div className="absolute top-0 inset-x-0 flex justify-center z-50 pointer-events-none">
                  <div className="w-[100px] h-[14px] bg-black rounded-b-[14px] flex justify-center items-end pb-1 shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
                     <div className="w-2.5 h-2.5 bg-[#1a1a1a] rounded-full relative ml-2">
                       <div className="absolute inset-[1px] bg-blue-500/20 rounded-full"></div>
                     </div>
                  </div>
                </div>

                <div className="w-full h-full overflow-hidden bg-background">
                   {isDemoMode ? (
                     <iframe 
                         src={iframeUrl} 
                         className={`w-full h-full border-0 bg-background transition-opacity duration-500 ${fadeIframe ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}
                         style={{ pointerEvents: 'auto' }}
                         title="WoC Live Demo"
                     />
                   ) : (
                     <div className="w-full h-full relative bg-black flex items-center justify-center overflow-hidden">
                       <img 
                         src="/images/pt/demo-mockup.png" 
                         alt="WoC Demo Mockup" 
                         className="w-full h-full object-cover" 
                       />
                       <div className="absolute inset-x-4 bottom-12 p-5 bg-black/60 backdrop-blur-md rounded-2xl border border-white/10 flex flex-col items-center text-center">
                         <span className="text-[10px] font-bold text-white/90 uppercase tracking-widest bg-white/10 px-2 py-0.5 rounded-full border border-white/10 mb-2">
                           Preview Mode
                         </span>
                         <h3 className="text-sm font-bold tracking-tight text-white mb-1 font-['Space_Grotesk']">
                           Presentation Preview Only
                         </h3>
                         <p className="text-[11px] text-white/50 leading-relaxed">
                           Live Demo is available during private presentation sessions.
                         </p>
                       </div>
                     </div>
                   )}
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

      {/* 인쇄 전용 숨김 슬라이드 묶음 (PDF 출력용) */}
      <div className="print-only-container">
        {SLIDES.map((SlideComponent, idx) => (
          <div key={idx} className="print-slide">
            <SlideComponent />
          </div>
        ))}
      </div>
    </div>
  );
};

export default PresentationPage;
