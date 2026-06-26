'use client';

import React, { useEffect } from 'react';
import { useNavigation } from '@/components/providers/NavigationProvider';
import { SyncFitLanguageProvider } from './SyncFitLanguageContext';

export default function SyncFitLayout({ children }: { children: React.ReactNode }) {
  const { setGlobalNavHidden, setIsHeaderVisible } = useNavigation();

  useEffect(() => {
    // WoC 글로벌 레이아웃 강제 격리
    setGlobalNavHidden(true);
    setIsHeaderVisible(false);

    return () => {
      // 페이지 이탈 시 원상복구
      setGlobalNavHidden(false);
      setIsHeaderVisible(true);
    };
  }, [setGlobalNavHidden, setIsHeaderVisible]);

  return (
    <SyncFitLanguageProvider>
      <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans antialiased">
        {children}
      </div>
    </SyncFitLanguageProvider>
  );
}
