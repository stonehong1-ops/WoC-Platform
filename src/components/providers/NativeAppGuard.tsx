'use client';

import React, { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/clientApp';
import { useLanguage } from '@/contexts/LanguageContext';

export default function NativeAppGuard({ children }: { children: React.ReactNode }) {
  const { t } = useLanguage();
  const [needsUpdate, setNeedsUpdate] = useState(false);
  const [storeLink, setStoreLink] = useState('');

  useEffect(() => {
    const checkUpdate = async () => {
      let isNative = false;
      let currentBuild = 0;
      let platform = 'web';

      try {
        const { Capacitor } = await import('@capacitor/core');
        if (Capacitor.isNativePlatform()) {
          isNative = true;
          platform = Capacitor.getPlatform();
          const { App } = await import('@capacitor/app');
          const info = await App.getInfo();
          currentBuild = parseInt(info.build, 10) || 0;
        }
      } catch (err) {
        // Not a native platform or Capacitor not available
        return;
      }

      if (!isNative) {
        return; // 통과
      }

      try {
        const configDoc = await getDoc(doc(db, 'configs', 'app_version'));
        if (configDoc.exists()) {
          const data = configDoc.data();
          let minBuild = 0;
          let link = '';

          if (platform === 'android' && data.android) {
            minBuild = data.android.minBuild || 0;
            link = 'https://play.google.com/store/apps/details?id=com.woc.today';
          } else if (platform === 'ios' && data.ios) {
            minBuild = data.ios.minBuild || 0;
            link = 'https://apps.apple.com/app/tango-world/id6789032896';
          }

          if (currentBuild > 0 && minBuild > 0 && currentBuild < minBuild) {
            setStoreLink(link);
            setNeedsUpdate(true);
          }
        }
      } catch (err) {
        // Fail-open
        console.error('Failed to check app version:', err);
      }
    };

    checkUpdate();
  }, []);

  if (needsUpdate) {
    return (
      <div className="fixed inset-0 bg-[#FAF8FF] flex items-center justify-center p-6 text-center z-[100000] font-['Plus_Jakarta_Sans'] notranslate">
        <style dangerouslySetInnerHTML={{ __html: `.material-symbols-rounded { font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24; }` }} />
        <main className="max-w-md w-full flex flex-col items-center justify-center">
          <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mb-6">
            <span className="material-symbols-rounded text-primary text-[40px]">system_update</span>
          </div>
          <h1 className="text-[20px] font-black text-slate-800 tracking-tight mb-3">
            {t('forceUpdate.title') || '앱 업데이트 안내'}
          </h1>
          <p className="text-[13px] font-bold text-slate-500 leading-relaxed mb-8 max-w-[280px] whitespace-pre-line">
            {t('forceUpdate.description') || '원활한 서비스 이용을 위해 최신 버전으로 업데이트가 필요합니다.'}
          </p>
          
          {storeLink && (
            <a
              href={storeLink}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-[#007AFF] hover:bg-[#007AFF]/95 text-white font-black py-4 rounded-2xl shadow-lg shadow-[#007AFF]/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-sm"
            >
              {t('forceUpdate.button') || '업데이트하기'}
              <span className="material-symbols-rounded text-[18px]">arrow_forward</span>
            </a>
          )}
        </main>
      </div>
    );
  }

  return <>{children}</>;
}
