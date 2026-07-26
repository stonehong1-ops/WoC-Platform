'use client';

import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

export default function AppSelectContent() {
  const { t } = useLanguage();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#FAF8FF] font-['Plus_Jakarta_Sans'] p-6">
      <div className="mb-8 flex items-center justify-center w-24 h-24 bg-white rounded-3xl shadow-sm">
        <span className="material-symbols-rounded text-6xl text-[#007AFF]">phone_iphone</span>
      </div>
      
      <h1 className="text-2xl font-bold text-gray-900 mb-3 text-center">
        {t('appSelect.title') || 'Download TangoWorld'}
      </h1>
      
      <p className="text-base text-gray-600 mb-10 text-center max-w-xs">
        {t('appSelect.description') || 'Choose your app store'}
      </p>

      <div className="flex flex-col w-full max-w-sm gap-4">
        <a 
          href="https://play.google.com/store/apps/details?id=com.woc.today"
          className="flex items-center justify-center w-full bg-[#007AFF] text-white py-4 px-6 rounded-2xl shadow-md hover:bg-[#0066cc] transition-colors"
        >
          <span className="material-symbols-rounded mr-3 text-2xl">android</span>
          <span className="font-semibold text-lg">{t('appSelect.android') || 'Google Play'}</span>
        </a>

        <a 
          href="https://apps.apple.com/app/tango-world/id6789032896"
          className="flex items-center justify-center w-full bg-white text-gray-900 border border-gray-200 py-4 px-6 rounded-2xl shadow-sm hover:bg-gray-50 transition-colors"
        >
          <span className="material-symbols-rounded mr-3 text-2xl">phone_iphone</span>
          <span className="font-semibold text-lg">{t('appSelect.ios') || 'App Store'}</span>
        </a>
      </div>
    </div>
  );
}
