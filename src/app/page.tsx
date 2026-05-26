'use client';

import React, { useState, useEffect } from 'react';

export default function LandingPage() {
  const [isAlreadyInstalled, setIsAlreadyInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isInApp, setIsInApp] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  
  // UI 상태 관리
  const [isInstalling, setIsInstalling] = useState(false);
  const [installProgress, setInstallProgress] = useState(0);
  const [installBtnText, setInstallBtnText] = useState('앱 설치');

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 1. PWA Standalone Mode 확인 시 프리패스
    const isStandalone = 
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;

    if (isStandalone) {
      localStorage.setItem('woc_pwa_installed', 'true');
      window.location.replace('/live');
      return;
    }

    // 2. 디바이스 및 브라우저 환경 판독 (개발용 수동 테스트 ?device=ios 또는 ?test=ios 대응 지원)
    const ua = navigator.userAgent || '';
    const urlParams = new URLSearchParams(window.location.search);
    const isTestIos = urlParams.get('device') === 'ios' || urlParams.get('test') === 'ios';
    const iosCheck = isTestIos || /iPad|iPhone|iPod/.test(ua);
    const inAppCheck = !isTestIos && /KAKAOTALK|Instagram|FBAN|FBAV|Line/i.test(ua);
    
    setIsIOS(iosCheck);
    setIsInApp(inAppCheck);

    // 3. 이미 설치된 상태 확인
    const installed = localStorage.getItem('woc_pwa_installed') === 'true';
    setIsAlreadyInstalled(installed);

    // 4. 인앱 브라우저 강제 자동 탈출
    const currentUrl = window.location.href;
    if (inAppCheck) {
      if (iosCheck) {
        window.location.href = `kakaotalk://web/openExternalApp?url=${encodeURIComponent(currentUrl)}`;
      } else {
        const stripped = currentUrl.replace(/https?:\/\//i, '');
        window.location.href = `intent://${stripped}#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url=${encodeURIComponent(currentUrl)};end`;
      }
      return;
    }

    // 5. beforeinstallprompt 캡처
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    // 6. appinstalled 감지
    const handleAppInstalled = () => {
      localStorage.setItem('woc_pwa_installed', 'true');
      setIsAlreadyInstalled(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Native Install Trigger
  const handleInstallClick = async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          setDeferredPrompt(null);
          setIsInstalling(true);
          setInstallBtnText('설치 진행 중...');
          setInstallProgress(70);
        }
      } catch (err) {
        console.error('PWA prompt fire failed', err);
      }
    } else {
      // Native prompt 로딩 폴링
      setIsInstalling(true);
      setInstallBtnText('설치 준비 중...');
      
      let checkCount = 0;
      const checkInterval = setInterval(async () => {
        checkCount++;
        if (deferredPrompt) {
          clearInterval(checkInterval);
          setIsInstalling(false);
          setInstallBtnText('앱 설치');
          
          try {
            await deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
              setDeferredPrompt(null);
              setIsInstalling(true);
              setInstallBtnText('설치 진행 중...');
              setInstallProgress(70);
            }
          } catch (err) {
            console.error('PWA prompt fire failed inside poll', err);
          }
        } else if (checkCount >= 12) {
          clearInterval(checkInterval);
          setInstallBtnText('잠시 후 다시 설치해 주세요');
          setIsInstalling(false);
          setTimeout(() => {
            setInstallBtnText('앱 설치');
          }, 2000);
        }
      }, 150);
    }
  };

  // PWA 설치 캐시를 완전 파괴하고 최초의 설치형 페이지로 온전히 롤백 회귀시키는 리셋 기능
  const handleResetInstall = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('woc_pwa_installed');
      setIsAlreadyInstalled(false);
      setIsInstalling(false);
      setInstallBtnText('앱 설치');
      setInstallProgress(0);
    }
  };

  return (
    <div className="bg-white text-gray-900 min-h-screen flex flex-col items-center justify-between overflow-x-hidden relative selection:bg-blue-100 font-sans">
      
      {/* Background SVG Network Map Accent */}
      <div className="absolute inset-0 z-0 opacity-[0.04] pointer-events-none flex items-center justify-center">
        <svg width="400" height="400" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="0.3" className="text-blue-600">
          <circle cx="50" cy="50" r="40" strokeDasharray="1 2"/>
          <circle cx="50" cy="50" r="25" strokeDasharray="2 1"/>
          <path d="M10 50 Q 50 20 90 50 Q 50 80 10 50 Z" />
          <path d="M50 10 Q 20 50 50 90 Q 80 50 50 10 Z" />
        </svg>
      </div>

      {/* Main Container */}
      <main className="w-full max-w-md flex-grow flex flex-col items-center justify-between px-6 pt-16 pb-6 z-10 relative">
        
        {/* Top Brand Logo Area */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative w-[130px] h-[34px] flex items-center justify-center">
            {/* Orange & Blue Gradient Arc */}
            <div className="absolute top-0 w-[100px] h-[18px] border-t-[3.5px] border-transparent rounded-[50%/50%_50%_0_0] bg-origin-border bg-clip-content" 
                 style={{backgroundImage: 'linear-gradient(#fff, #fff), linear-gradient(to right, #f97316, #2563eb)', backgroundOrigin: 'border-box', backgroundClip: 'content-box, border-box'}}>
            </div>
            <span className="font-['Outfit'] font-extrabold text-[24px] tracking-tight text-gray-900 mt-3 relative z-10 leading-none">TANGO</span>
          </div>
          <span className="text-[9px] font-black text-gray-400 tracking-[0.3em] uppercase mt-1">World</span>
        </div>

        {/* Main Copy Area */}
        <div className="text-center mb-10">
          <h1 className="text-[26px] font-extrabold text-gray-900 tracking-tight leading-tight">
            하나의 <span className="text-blue-600">세계,</span><br />
            탱고의 모든 순간
          </h1>
          <div className="w-12 h-0.5 bg-gradient-to-r from-orange-400 to-blue-500 mx-auto mt-4 rounded-full opacity-60"></div>
        </div>

        {/* Central Action Area */}
        <div className="w-full flex flex-col items-center mb-12">
          
          {/* Scenario A: Uninstalled State (Android etc) */}
          {!isAlreadyInstalled && !isIOS && (
            <div className="w-full flex flex-col items-center relative">
              <button 
                onClick={handleInstallClick}
                disabled={isInstalling}
                className="w-[85%] h-14 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-full transition-all active:scale-[0.97] flex items-center justify-center gap-2 relative overflow-hidden shadow-[0_10px_25px_-5px_rgba(37,99,235,0.4)]"
              >
                {/* Real-Time Progress Bar */}
                <div 
                  className="absolute left-0 top-0 bottom-0 bg-blue-700/80 transition-all duration-300 z-0"
                  style={{width: `${installProgress}%`}}
                ></div>
                
                <div className="relative z-10 flex items-center justify-center gap-2">
                  <span className={`material-symbols-outlined text-[20px] font-bold ${isInstalling ? 'animate-spin' : ''}`}>
                    {isInstalling ? 'sync' : 'download'}
                  </span>
                  <span className="text-[16px] tracking-tight">{installBtnText}</span>
                </div>
              </button>
              <p className="text-[11px] text-gray-400/80 font-medium mt-3.5 tracking-tight">
                웹앱으로 설치됩니다_
              </p>
            </div>
          )}

          {/* Scenario B: iOS In-Page Guide (Always visible on iOS) */}
          {!isAlreadyInstalled && isIOS && (
            <div className="w-full flex flex-col items-center text-left animate-in fade-in duration-300 px-1">
              
              {/* Unified single image without double borders/frames or crop */}
              <div className="w-full select-none pointer-events-none">
                <img 
                  src="/images/iphoneinstall.png" 
                  alt="How to add to Home Screen on iOS" 
                  className="w-full h-auto object-contain"
                />
              </div>
              
              <p className="mt-5 text-[11px] text-gray-500 font-bold text-center w-full tracking-tight break-keep">
                사파리 브라우저의 안내를 따라 홈 화면에 추가하시면 즉시 설치가 완료됩니다.
              </p>
            </div>
          )}

          {/* Scenario C: Already Installed State */}
          {isAlreadyInstalled && (
            <div className="w-full flex flex-col items-center text-center px-4 animate-in fade-in duration-300">
              <div className="w-14 h-14 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mb-4 shadow-inner">
                <span className="material-symbols-outlined text-3xl font-bold">check_circle</span>
              </div>
              <h3 className="text-[18px] font-extrabold text-gray-900 mb-2 break-keep">
                축하합니다!
              </h3>
              <p className="text-[13px] font-semibold text-gray-500 leading-relaxed break-keep mb-5">
                '탱고월드' 앱을 검색해서 앱을 실행해 주시기 바랍니다.<br />
                앱을 홈 화면에 추가하시면 더욱 편리합니다.
              </p>
              
              <button 
                onClick={handleResetInstall}
                className="w-[70%] h-12 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl text-sm transition-all active:scale-95 flex items-center justify-center gap-1.5 shadow-inner"
              >
                <span className="material-symbols-outlined text-[18px]">restart_alt</span>
                <span>재설치 하기</span>
              </button>
            </div>
          )}

        </div>

        {/* Bottom Feature Cards Area */}
        <div className="w-full border-t border-gray-100/70 pt-8 mb-10">
          <div className="grid grid-cols-3 gap-1 text-center divide-x divide-gray-100">
            
            {/* Tab 1 */}
            <div className="flex flex-col items-center px-1">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-blue-600 mb-2">
                <span className="material-symbols-outlined text-2xl font-light">language</span>
              </div>
              <span className="text-[11px] font-extrabold text-gray-900 tracking-tight">Global Connect</span>
              <span className="text-[8px] text-gray-400 font-bold mt-1.5 break-keep leading-tight">전 세계 탱고인과 연결</span>
            </div>

            {/* Tab 2 */}
            <div className="flex flex-col items-center px-1">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-blue-600 mb-2">
                <span className="material-symbols-outlined text-2xl font-light">calendar_today</span>
              </div>
              <span className="text-[11px] font-extrabold text-gray-900 tracking-tight">Events & News</span>
              <span className="text-[8px] text-gray-400 font-bold mt-1.5 break-keep leading-tight">행사, 소식, 정보를 한곳에</span>
            </div>

            {/* Tab 3 */}
            <div className="flex flex-col items-center px-1">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-blue-600 mb-2">
                <span className="material-symbols-outlined text-2xl font-light">group</span>
              </div>
              <span className="text-[11px] font-extrabold text-gray-900 tracking-tight">Community</span>
              <span className="text-[8px] text-gray-400 font-bold mt-1.5 break-keep leading-tight">소통하고 함께 성장하는 커뮤니티</span>
            </div>

          </div>
        </div>

        {/* Copyright Footer Area */}
        <footer className="w-full text-center py-2">
          <span className="text-[10px] font-bold text-gray-300 tracking-wider uppercase">
            © TANGO World &nbsp; woc 2026
          </span>
        </footer>

      </main>

    </div>
  );
}
