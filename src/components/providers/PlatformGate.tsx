'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';

export default function PlatformGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { t } = useLanguage();
  const [shouldBlock, setShouldBlock] = useState(false);

  useEffect(() => {
    // 차단 제외 경로
    const excludePaths = ['/app', '/app/select', '/pt', '/pt1', '/pt3', '/privacy', '/child-safety', '/account-deletion', '/fys'];
    if (pathname && excludePaths.some((path) => pathname.startsWith(path))) {
      return;
    }

    const checkPlatform = async () => {
      let isNative = false;
      try {
        const { Capacitor } = await import('@capacitor/core');
        if (Capacitor.isNativePlatform()) {
          isNative = true;
        }
      } catch (e) {
        // 웹 환경
      }

      if (isNative) {
        setShouldBlock(false);
        return;
      }

      // 브라우저 환경에서 기기 감지
      const ua = navigator.userAgent || navigator.vendor || (window as any).opera || '';
      const isIOS = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
      const isIPadOS = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
      const isAndroid = /android/i.test(ua);
      
      const isMobileWeb = isIOS || isIPadOS || isAndroid;

      if (isMobileWeb) {
        setShouldBlock(true);
      }
    };

    checkPlatform();
  }, [pathname]);

  if (!shouldBlock) {
    return <>{children}</>;
  }

  return (
    <div className="fixed inset-0 bg-[#FAF8FF] flex items-center justify-center p-6 text-center z-[100000] font-['Plus_Jakarta_Sans'] notranslate">
      <style dangerouslySetInnerHTML={{ __html: `.material-symbols-rounded { font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24; }` }} />
      <main className="max-w-md w-full flex flex-col items-center justify-center">
        <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mb-6">
          <span className="material-symbols-rounded text-primary text-[40px]">smartphone</span>
        </div>
        <h1 className="text-[20px] font-black text-slate-800 tracking-tight mb-3">
          {t('platformGate.title') || '앱에서 열기'}
        </h1>
        <p className="text-[13px] font-bold text-slate-500 leading-relaxed mb-8 max-w-[280px] whitespace-pre-line">
          {t('platformGate.description') || '모바일 웹 브라우저는 지원하지 않습니다.\n공식 앱을 설치해주세요.'}
        </p>
        
        <div className="flex flex-col gap-4 w-full">
          <a
            href="https://play.google.com/store/apps/details?id=com.woc.today"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full bg-[#007AFF] hover:bg-[#007AFF]/95 text-white font-black py-4 rounded-2xl shadow-lg shadow-[#007AFF]/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-sm"
          >
            Google Play
            <span className="material-symbols-rounded text-[18px]">arrow_forward</span>
          </a>
          <a
            href="https://apps.apple.com/app/tango-world/id6789032896"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black py-4 rounded-2xl shadow-lg shadow-slate-900/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-sm"
          >
            App Store
            <span className="material-symbols-rounded text-[18px]">arrow_forward</span>
          </a>
        </div>
      </main>
    </div>
  );
}
