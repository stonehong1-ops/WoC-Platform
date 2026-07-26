'use client';

import { useEffect } from 'react';

export default function LandingPage() {
  useEffect(() => {
    let isNavigated = false;

    const navigateIfPending = (): boolean => {
      let pendingUrl: string | null = null;
      try {
        pendingUrl = sessionStorage.getItem('pendingNativeDeepLink');
      } catch (e) {
        pendingUrl = null;
      }

      if (
        typeof pendingUrl === 'string' &&
        pendingUrl.startsWith('/') &&
        !pendingUrl.startsWith('//')
      ) {
        try {
          sessionStorage.removeItem('pendingNativeDeepLink');
        } catch (e) {
          // Fail-safe
        }
        isNavigated = true;
        window.location.replace(pendingUrl);
        return true;
      }
      return false;
    };

    // 1) 즉시 확인
    if (navigateIfPending()) return;

    // 2) Native App Cold Start 브릿지 딜레이 대기 (최대 300ms 비동기 검사)
    const checkTimer = setTimeout(() => {
      if (!isNavigated && !navigateIfPending()) {
        window.location.replace('/home');
      }
    }, 300);

    return () => {
      clearTimeout(checkTimer);
    };
  }, []);

  return null;
}
