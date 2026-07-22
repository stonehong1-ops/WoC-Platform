'use client';

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { hasOpenModals } from '@/hooks/useBackButtonClose';

export default function PageWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile, loading, setShowLogin } = useAuth();
  
  const isHome = pathname.startsWith('/home');
  const isLive = pathname.startsWith('/live');
  const isVenues = pathname.startsWith('/venues');
  const isEvents = pathname.startsWith('/events');
  const isSocial = pathname.startsWith('/social');
  const isLanding = pathname === '/';
  const isLogin = pathname === '/login';
  const isApp = pathname === '/app';

  const isPlaza = pathname.startsWith('/plaza');
  const isExplore = pathname.startsWith('/explore');
  const isNation = pathname.startsWith('/class') || pathname.startsWith('/shop') || pathname.startsWith('/resale') || pathname.startsWith('/stay') || pathname.startsWith('/lost') || pathname.startsWith('/hub');
  
  const isPublic = isLanding || isLogin || isApp || isLive || isVenues || isEvents || isSocial || isPlaza || isExplore || isNation || isHome || pathname.startsWith('/yedamche') || pathname.startsWith('/pt') || pathname.startsWith('/fys') || pathname.startsWith('/support') || pathname.startsWith('/privacy') || pathname.startsWith('/child-safety') || pathname.startsWith('/account-deletion');

  // 플랫폼 클래스 주입 (iOS / Android / Web)
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    root.classList.remove('device-ios', 'device-android', 'device-web');
    const platform = Capacitor.getPlatform(); // 'ios', 'android', 'web'
    root.classList.add(`device-${platform}`);
  }, []);

  // Android 네이티브 하드웨어 백버튼 제어
  useEffect(() => {
    if (typeof window === 'undefined' || !Capacitor.isNativePlatform()) return;

    const backButtonHandler = App.addListener('backButton', ({ canGoBack }) => {
      // 모달이 열려있으면 canGoBack과 무관하게 history.back() 호출
      // (Android WebView에서 pushState가 canGoBack에 반영 안 되는 케이스 대응)
      if (hasOpenModals() || canGoBack) {
        window.history.back();
      } else {
        // 더 이상 뒤로갈 곳이 없으면 앱 최소화
        App.minimizeApp();
      }
    });

    return () => {
      backButtonHandler.then(h => h.remove());
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (!loading && !isPublic && (!user || !profile?.isRegistered)) {
      setShowLogin(true);
    }
  }, [user, profile, loading, isPublic, pathname, router, setShowLogin]);

  return (
    <>
      {children}
    </>
  );
}
