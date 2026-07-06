'use client';

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

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
  
  const isPublic = isLanding || isLogin || isApp || isLive || isVenues || isEvents || isSocial || isPlaza || isExplore || isNation || isHome || pathname.startsWith('/yedamche') || pathname.startsWith('/pt') || pathname.startsWith('/fys');

  // Android 네이티브 하드웨어 백버튼 제어
  useEffect(() => {
    if (typeof window === 'undefined' || !Capacitor.isNativePlatform()) return;

    const backButtonHandler = App.addListener('backButton', ({ canGoBack }) => {
      // 1. 현재 떠 있는 팝업, 모달, 바텀시트 등의 닫기 버튼이 존재하는지 감지
      const closeButtons = document.querySelectorAll<HTMLButtonElement>(
        'button[aria-label="close"], button[class*="close"], button.close-btn, .modal-close-btn'
      );
      if (closeButtons.length > 0) {
        // 비회원이 비공개 페이지(/live 등)에 들어왔으나 로그인 팝업을 닫았거나 취소한 경우 
        // 엉뚱한 /social이 아닌 로그인 첫페이지인 /home으로 리디렉션하여 정렬
        router.replace('/home');
        // 최상위에 배치된 닫기 버튼을 가상 클릭하여 닫음
        const lastBtn = closeButtons[closeButtons.length - 1];
        lastBtn.click();
        return;
      }

      // 2. 닫을 모달이 없으면 브라우저 히스토리 백 수행
      if (canGoBack) {
        window.history.back();
      } else {
        // 더 이상 뒤로갈 곳이 없으면 안전하게 앱 백그라운드 최소화 처리
        App.minimizeApp();
      }
    });

    return () => {
      backButtonHandler.then(h => h.remove());
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Strict PWA Standalone Mode Check
    const isGatewayPath = pathname === '/' || pathname === '/login' || pathname === '/app';

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

