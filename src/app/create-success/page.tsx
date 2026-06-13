'use client';

import React, { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';

function CreateSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLanguage();

  const type = searchParams.get('type') || '';
  const id = searchParams.get('id') || '';

  // 1. 카테고리별 복귀 경로 및 상세 이동 경로 정의
  const getPaths = () => {
    switch (type) {
      case 'social':
        return { view: id ? `/social?viewSocial=${id}` : '/social', list: '/social', labelKey: 'create_menu.social' };
      case 'event':
        return { view: id ? `/events?eventId=${id}` : '/events', list: '/events', labelKey: 'create_menu.event' };
      case 'resale':
        return { view: id ? `/resale?itemId=${id}` : '/resale', list: '/resale', labelKey: 'create_menu.resale' };
      case 'stay':
        return { view: id ? `/stay/${id}` : '/stay', list: '/stay', labelKey: 'nav.stay' };
      case 'shop':
        return { view: id ? `/shop?productId=${id}` : '/shop', list: '/shop', labelKey: 'nav.shop' };
      case 'lost':
        return { view: id ? `/lost/${id}` : '/lost', list: '/lost', labelKey: 'nav.lost_found' };
      case 'people':
        return { view: id ? `/people/${id}` : '/people', list: '/people', labelKey: 'nav.people' };
      case 'venue':
        return { view: id ? `/venues/${id}` : '/venues', list: '/venues', labelKey: 'nav.venues' };
      case 'group':
        return { view: id ? `/groups/${id}` : '/groups', list: '/groups', labelKey: 'nav.groups' };
      case 'live':
        return { view: '/live', list: '/live', labelKey: 'nav.live' };
      case 'coaching':
        return { view: id ? `/coaching/${id}` : '/coaching', list: '/coaching', labelKey: 'nav.coaching' };
      case 'rental':
        return { view: id ? `/rental/${id}` : '/rental', list: '/rental', labelKey: 'nav.rental' };
      default:
        return { view: '/', list: '/', labelKey: 'nav.home' };
    }
  };

  const paths = getPaths();

  const handleGoView = () => {
    router.push(paths.view);
  };

  const handleGoBack = () => {
    router.push(paths.list);
  };

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col items-center justify-center p-6 font-manrope animate-in fade-in duration-500">
      {/* CSS keyframes 폭죽/성공 애니메이션 임베드 */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes popIn {
          0% { transform: scale(0.8); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes sparkle {
          0%, 100% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.15); opacity: 1; filter: brightness(1.1); }
        }
        .animate-pop-in { animation: popIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
        .animate-sparkle { animation: sparkle 2s ease-in-out infinite; }
      `}} />

      <div className="w-full max-w-md bg-white rounded-[32px] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col items-center text-center animate-pop-in">
        
        {/* 성공 체크 아이콘 애니메이션 박스 */}
        <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-[#34C759] to-[#007AFF] flex items-center justify-center shadow-lg shadow-emerald-500/10 mb-6 animate-sparkle">
          <span className="material-symbols-outlined !text-[44px] text-white" style={{ fontVariationSettings: "'wght' 600" }}>
            check_circle
          </span>
        </div>

        {/* 타이틀 및 서브 타이틀 */}
        <h2 className="text-[24px] font-black text-slate-900 tracking-tight leading-none uppercase">
          {t('create_success.title', '등록 완료!')}
        </h2>
        <p className="text-[13px] text-slate-400 font-semibold tracking-tight mt-2.5">
          {t('create_success.message', '성공적으로 등록이 완료되었습니다.')}
        </p>

        {/* 카드 내에 상세 카테고리 태그 노출 */}
        <div className="mt-6 py-2 px-4 rounded-full bg-slate-50 border border-slate-100/80 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-gradient-to-r from-[#007AFF] to-[#5856D6]" />
          <span className="text-[11px] font-black text-slate-600 uppercase tracking-wider">
            {t(paths.labelKey)}
          </span>
        </div>

        {/* 액션 버튼 그룹 */}
        <div className="w-full flex flex-col gap-3 mt-8">
          {/* Option A: 등록한 상세 페이지로 가기 */}
          <button
            onClick={handleGoView}
            className="w-full h-14 rounded-full bg-primary hover:bg-primary/95 text-white font-black text-[14px] transition-all flex items-center justify-center uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.01] active:scale-[0.99]"
          >
            {t('create_success.button_view', '해당 등록 보기')}
          </button>

          {/* Option B: 원래 페이지로 복귀 */}
          <button
            onClick={handleGoBack}
            className="w-full h-14 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-700 font-black text-[14px] transition-all flex items-center justify-center uppercase tracking-widest border border-slate-200/60 hover:scale-[1.01] active:scale-[0.99]"
          >
            {t('create_success.button_back', '이전 페이지로 복귀')}
          </button>
        </div>

      </div>
    </div>
  );
}

export default function CreateSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50/50 flex items-center justify-center font-manrope">
        <div className="w-8 h-8 border-3 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    }>
      <CreateSuccessContent />
    </Suspense>
  );
}
