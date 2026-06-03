'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

export default function LandingPage() {
  const { language, t } = useLanguage();
  const [isCheckingPWA, setIsCheckingPWA] = useState(true);
  const [isAlreadyInstalled, setIsAlreadyInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isInApp, setIsInApp] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const beforeInstallPromiseRef = useRef<((prompt: any) => void) | null>(null);
  
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
      window.location.replace('/today');
      return;
    }

    // PWA 환경이 아닌 경우에만 checkingPWA를 풀어 일반 UI가 마운트되도록 차단막 해제
    setIsCheckingPWA(false);

    // 2. 디바이스 및 브라우저 환경 판독 (개발용 수동 테스트 ?device=ios 또는 ?test=ios 대응 지원)
    const ua = navigator.userAgent || '';
    const urlParams = new URLSearchParams(window.location.search);
    const isTestIos = urlParams.get('device') === 'ios' || urlParams.get('test') === 'ios';
    const iosCheck = isTestIos || /iPad|iPhone|iPod/.test(ua);
    const inAppCheck = !isTestIos && /KAKAOTALK|Instagram|FBAN|FBAV|Line/i.test(ua);
    
    setIsIOS(iosCheck);
    setIsInApp(inAppCheck);

    // PWA 설치를 미지원하는 안드로이드 브라우저(크롬, 삼성인터넷이 아닌 경우)는 메인으로 자동 패스
    const isAndroid = /Android/i.test(ua);
    const isChrome = /Chrome|CriOS/i.test(ua);
    const isSamsung = /SamsungBrowser/i.test(ua);
    if (isAndroid && !isChrome && !isSamsung && !inAppCheck) {
      window.location.replace('/today');
      return;
    }

    // 3. 이미 설치된 상태 확인
    const installed = localStorage.getItem('woc_pwa_installed') === 'true';
    setIsAlreadyInstalled(installed);

    // 4. 인앱 브라우저 강제 자동 탈출
    const currentUrl = window.location.href;
    if (inAppCheck) {
      if (iosCheck) {
        // iOS: 카카오톡만 자체 스킴으로 자동 탈출, Facebook/Instagram/Line은 InAppBrowserGuard에 위임
        if (/KAKAOTALK/i.test(ua)) {
          window.location.href = `kakaotalk://web/openExternalApp?url=${encodeURIComponent(currentUrl)}`;
          return;
        }
        // Facebook/Instagram/Line iOS 인앱: 강제 리다이렉트 없이 랜딩 페이지 정상 렌더링
      } else {
        const stripped = currentUrl.replace(/https?:\/\//i, '');
        window.location.href = `intent://${stripped}#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url=${encodeURIComponent(currentUrl)};end`;
        return;
      }
    }

    // 5. beforeinstallprompt 캡처
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (beforeInstallPromiseRef.current) {
        beforeInstallPromiseRef.current(e);
        beforeInstallPromiseRef.current = null;
      }
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
    if (isAlreadyInstalled) return;

    let activePrompt = deferredPrompt;

    // 만약 아직 캡처되지 않았다면 일반 환경일 때 최대 2초간 대기
    if (!activePrompt && !isIOS && !isInApp) {
      setIsInstalling(true);
      setInstallBtnText(t('pwa.preparing_install', '준비 중...'));

      activePrompt = await new Promise((resolve) => {
        const timer = setTimeout(() => {
          beforeInstallPromiseRef.current = null;
          resolve(null);
        }, 2000);

        beforeInstallPromiseRef.current = (prompt) => {
          clearTimeout(timer);
          resolve(prompt);
        };
      });

      setIsInstalling(false);
      setInstallBtnText('앱 설치');
    }

    if (activePrompt) {
      try {
        // 사용자 제스처 컨텍스트 유지 시간 내 실행을 위해 prompt() 즉시 구동
        activePrompt.prompt();
        const { outcome } = await activePrompt.userChoice;
        if (outcome === 'accepted') {
          setDeferredPrompt(null);
          setIsInstalling(true);
          setInstallBtnText(t('pwa.installing_progress', '설치 진행 중...'));
          setInstallProgress(70);
        }
      } catch (err) {
        console.error('PWA prompt fire failed', err);
      }
    } else {
      // 대기 타임아웃 이후에도 없거나 미지원 디바이스일 경우 가이드 출력
      if (isIOS) {
        alert(t('pwa.unsupported_ios_desc'));
      } else {
        alert(t('pwa.unsupported_android_desc'));
      }
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

  if (isCheckingPWA) {
    // 0ms 무렌더 가드: 판정이 끝날 때까지 웰컴 화면이 절대 눈에 노출되지 않도록 새하얀 백스크린 유지
    return <div className="bg-white min-h-screen w-full" />;
  }

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
              <button
                onClick={() => window.location.replace('/today')}
                className="mt-3 w-[85%] h-12 border border-gray-200 text-gray-600 font-bold rounded-full transition-all active:scale-[0.97] flex items-center justify-center gap-2 hover:bg-gray-50 text-sm shadow-sm"
              >
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                <span>{t('pwa.continue_web')}</span>
              </button>
              <p className="text-[11px] text-gray-400/80 font-medium mt-3.5 tracking-tight">
                {t('pwa.will_be_installed')}
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
                {t('pwa.ios_safari_guide')}
              </p>

              <button
                onClick={() => window.location.replace('/today')}
                className="mt-5 w-[85%] h-12 border border-gray-200 text-gray-600 font-bold rounded-full transition-all active:scale-[0.97] flex items-center justify-center gap-2 hover:bg-gray-50 text-sm shadow-sm"
              >
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                <span>{t('pwa.continue_web')}</span>
              </button>
            </div>
          )}

          {/* Scenario C: Already Installed State */}
          {isAlreadyInstalled && (
            <div className="w-full flex flex-col items-center text-center px-4 animate-in fade-in duration-300">
              <p className="text-[13px] font-bold text-green-600 mb-5 flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">check_circle</span>
                {t('pwa.congrats')}
              </p>
              <div className="w-24 h-24 rounded-[22px] overflow-hidden shadow-lg mb-5 ring-1 ring-gray-200/60">
                <img src="/icons/icon-192x192.png" alt="TANGO World" className="w-full h-full object-cover" />
              </div>
              <p className="text-[14px] font-semibold text-gray-700 leading-relaxed break-keep mb-6">
                {t('pwa.installed_desc')}
              </p>
              
              <button 
                onClick={handleResetInstall}
                className="w-[70%] h-12 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl text-sm transition-all active:scale-95 flex items-center justify-center gap-1.5 shadow-inner"
              >
                <span className="material-symbols-outlined text-[18px]">restart_alt</span>
                <span>{t('pwa.reinstall_btn')}</span>
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
              <span className="text-[11px] font-extrabold text-gray-900 tracking-tight">{t('pwa.tab_global_title')}</span>
              <span className="text-[8px] text-gray-400 font-bold mt-1.5 break-keep leading-tight">{t('pwa.tab_global_desc')}</span>
            </div>

            {/* Tab 2 */}
            <div className="flex flex-col items-center px-1">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-blue-600 mb-2">
                <span className="material-symbols-outlined text-2xl font-light">calendar_today</span>
              </div>
              <span className="text-[11px] font-extrabold text-gray-900 tracking-tight">{t('pwa.tab_events_title')}</span>
              <span className="text-[8px] text-gray-400 font-bold mt-1.5 break-keep leading-tight">{t('pwa.tab_events_desc')}</span>
            </div>

            {/* Tab 3 */}
            <div className="flex flex-col items-center px-1">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-blue-600 mb-2">
                <span className="material-symbols-outlined text-2xl font-light">group</span>
              </div>
              <span className="text-[11px] font-extrabold text-gray-900 tracking-tight">{t('pwa.tab_community_title')}</span>
              <span className="text-[8px] text-gray-400 font-bold mt-1.5 break-keep leading-tight">{t('pwa.tab_community_desc')}</span>
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
