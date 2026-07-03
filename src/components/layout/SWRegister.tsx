'use client';

import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';

export default function SWRegister() {
  useEffect(() => {
    // Android/iOS 네이티브 앱 내부에서는 과도한 에셋 캐싱으로 인한 화면 업데이트 지연을 방지하기 위해 서비스 워커 등록을 전면 건너뜁니다.
    if (Capacitor.isNativePlatform()) return;

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          registration.update();
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error);
        });
    }
  }, []);

  return null;
}
