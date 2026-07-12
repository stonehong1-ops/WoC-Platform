'use client';

import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';

export default function NotFound() {
  const router = useRouter();
  const { t } = useLanguage();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-surface px-6 text-center">
      <span className="material-symbols-outlined text-6xl text-outline mb-4">explore_off</span>
      <h1 className="text-2xl font-bold text-on-surface mb-2">
        {t('error.not_found_title', '페이지를 찾을 수 없습니다')}
      </h1>
      <p className="text-sm text-on-surface-variant mb-8">
        {t('error.not_found_desc', '요청하신 페이지가 존재하지 않거나 이동되었습니다.')}
      </p>
      <button
        onClick={() => router.replace('/home')}
        className="px-6 py-3 bg-primary text-on-primary rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all active:scale-[0.98]"
      >
        {t('error.go_home', '홈으로 이동')}
      </button>
    </div>
  );
}
