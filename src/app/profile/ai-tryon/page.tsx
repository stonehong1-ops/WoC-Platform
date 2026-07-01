'use client';

import React, { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import AiTryOnStudio from '@/components/tryon/AiTryOnStudio';
import AiLessonHome from '@/components/lesson/AiLessonHome';
import AiPartnerMatch from '@/components/partner/AiPartnerMatch';
import RhythmWheelPage from '@/app/admin/lab/rhythm-training/rhythm-wheel/page';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigation } from '@/components/providers/NavigationProvider';

const AI_TABS = [
  { key: 'tryon', label: 'nav.ai_tryon', icon: 'checkroom' },
  { key: 'lesson', label: 'nav.ai_lesson', icon: 'school' },
  { key: 'rhythm', label: 'nav.rhythm_training', icon: 'music_note' },
  { key: 'match', label: 'nav.partner_match', icon: 'favorite' },
] as const;

function AiLabContent() {
  const searchParams = useSearchParams();
  const productId = searchParams.get('productId');
  const initialTab = searchParams.get('tab') || 'tryon';
  const [activeTab, setActiveTab] = useState(initialTab);
  const { t } = useLanguage();
  const { setSubHeader } = useNavigation();

  // 탭 서브헤더 등록
  React.useEffect(() => {
    setSubHeader(
      <div className="flex items-center gap-2 px-4 py-2 overflow-x-auto no-scrollbar">
        {AI_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-shrink-0 px-4 py-1.5 rounded-xl text-[12px] font-bold tracking-tight transition-all whitespace-nowrap border flex items-center gap-1.5 ${
              activeTab === tab.key
                ? 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-100'
                : 'bg-slate-50/50 text-slate-500 border-slate-100 hover:bg-slate-100/80'
            }`}
          >
            {t(tab.label)}
          </button>
        ))}
      </div>,
      52
    );
    return () => setSubHeader(null);
  }, [activeTab, t, setSubHeader]);

  return (
    <>
      {activeTab === 'tryon' && <AiTryOnStudio initialProductId={productId} />}
      {activeTab === 'lesson' && <AiLessonHome />}
      {activeTab === 'rhythm' && <RhythmWheelPage />}
      {activeTab === 'match' && (
        <div className="container mx-auto px-4 py-6 max-w-lg pb-24">
          <AiPartnerMatch />
        </div>
      )}
    </>
  );
}

export default function AiTryOnPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <svg className="animate-spin h-8 w-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="text-xs font-bold text-outline">Loading...</span>
        </div>
      </div>
    }>
      <AiLabContent />
    </Suspense>
  );
}
