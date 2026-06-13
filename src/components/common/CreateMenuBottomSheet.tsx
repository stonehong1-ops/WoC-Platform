'use client';

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { useLanguage } from '@/contexts/LanguageContext';
import BottomSheet from './BottomSheet';

interface CreateMenuItem {
  id: string;
  icon: string;
  labelKey: string;
  descriptionKey: string;
  route: string;
  gradient: string;
  directRoute?: boolean;
  isAdminOnly?: boolean;
}

const MENU_ITEMS: CreateMenuItem[] = [
  { id: 'live', icon: 'live_tv', labelKey: 'create_menu.live', descriptionKey: 'create_menu.live_desc', route: '/live/create?source=live', gradient: 'linear-gradient(135deg, #34C759, #007AFF)', directRoute: true },
  { id: 'feed', icon: 'forum', labelKey: 'create_menu.feed', descriptionKey: 'create_menu.feed_desc', route: '/plaza?createFlow=true', gradient: 'linear-gradient(135deg, #007AFF, #5856D6)' },
  { id: 'social', icon: 'celebration', labelKey: 'create_menu.social', descriptionKey: 'create_menu.social_desc', route: '/social?createSocial=true', gradient: 'linear-gradient(135deg, #FF2D55, #FF9500)' },
  { id: 'resale', icon: 'cached', labelKey: 'create_menu.resale', descriptionKey: 'create_menu.resale_desc', route: '/resale?create=true', gradient: 'linear-gradient(135deg, #FF9500, #FFCC00)' },
  { id: 'lost', icon: 'search_off', labelKey: 'create_menu.lost', descriptionKey: 'create_menu.lost_desc', route: '/lost/register', gradient: 'linear-gradient(135deg, #FF3B30, #FF9500)', directRoute: true },
  { id: 'event', icon: 'event', labelKey: 'create_menu.event', descriptionKey: 'create_menu.event_desc', route: '/events?create=true', gradient: 'linear-gradient(135deg, #5856D6, #AF52DE)' },
  { id: 'venue', icon: 'location_on', labelKey: 'create_menu.venue', descriptionKey: 'create_menu.venue_desc', route: '/venues?editId=new', gradient: 'linear-gradient(135deg, #8E8E93, #AEAEB2)' },
  { id: 'group', icon: 'group_add', labelKey: 'create_menu.group', descriptionKey: 'create_menu.group_desc', route: '/groups?action=create', gradient: 'linear-gradient(135deg, #8E8E93, #AEAEB2)' },
  { id: 'dj', icon: 'headphones', labelKey: 'create_menu.dj', descriptionKey: 'create_menu.dj_desc', route: '/profile?tab=schedule', gradient: 'linear-gradient(135deg, #AF52DE, #FF2D55)', directRoute: true },
];

interface CreateMenuBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateMenuBottomSheet({ isOpen, onClose }: CreateMenuBottomSheetProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const { t } = useLanguage();

  const getMatchedItemId = (path: string): string | null => {
    if (path.startsWith('/social')) return 'social';
    if (path.startsWith('/resale')) return 'resale';
    if (path.startsWith('/venues')) return 'venue';
    if (path.startsWith('/events')) return 'event';
    if (path.startsWith('/groups')) return 'group';
    if (path.startsWith('/plaza')) return 'feed';
    if (path.startsWith('/live')) return 'live';
    if (path.startsWith('/lost')) return 'lost';
    if (path.startsWith('/stay')) return 'stay';
    if (path.startsWith('/shop')) return 'shop';
    return null;
  };

  const currentMatchedId = getMatchedItemId(pathname);

  const handleSelect = (item: CreateMenuItem) => {
    if (!user) return;
    onClose();
    // router.replace()를 사용하여 BottomSheet가 push한 스테일 history 엔트리를
    // 목적지 URL로 덮어씀. 같은 페이지든 다른 페이지든 동일하게 동작.
    router.replace(item.route);
  };

  const iconStyle = { fontFamily: "'Material Symbols Outlined'" };

  // 1. 현재 페이지 연관 등록 모드 (상단 대표 카드 100% 너비 + 하단 2열 그리드)
  const renderMatchedLayout = (matchedId: string) => {
    const matchedItem = MENU_ITEMS.find((item) => item.id === matchedId);
    if (!matchedItem) return null;

    const rightCandidates = MENU_ITEMS.filter(
      (item) => item.id !== matchedId && !['event', 'venue', 'group', 'dj'].includes(item.id)
    ).slice(0, 4);

    const isMatchedDisabled = !user;

    return (
      <div className="flex flex-col gap-4 py-4 px-2 font-manrope">
        {/* 상단 100% 가로 확장 대표 카드 */}
        <button
          onClick={() => !isMatchedDisabled && handleSelect(matchedItem)}
          disabled={isMatchedDisabled}
          className={`
            w-full relative flex items-center gap-5 p-5 rounded-2xl text-left transition-all duration-300 overflow-hidden shadow-md group
            ${isMatchedDisabled
              ? 'opacity-40 bg-slate-100 cursor-not-allowed'
              : 'text-white hover:scale-[1.01] active:scale-[0.99] hover:shadow-xl'
            }
          `}
          style={!isMatchedDisabled ? { background: matchedItem.gradient } : undefined}
        >
          <div className="absolute inset-0 bg-black/5 group-hover:bg-black/0 transition-colors" />
          
          {/* 아이콘 영역 */}
          <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined !text-[32px] text-white" style={iconStyle}>
              {matchedItem.icon}
            </span>
          </div>

          {/* 텍스트 영역 */}
          <div className="z-10 flex-1">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/70 block mb-0.5">
              {t('nav.create', 'CREATE')}
            </span>
            <h4 className="text-[18px] font-black leading-tight uppercase tracking-tight">
              {t(matchedItem.labelKey)}
            </h4>
          </div>

          {isMatchedDisabled ? (
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm flex-shrink-0">
              <span className="material-symbols-outlined !text-[16px] text-white" style={iconStyle}>lock</span>
            </div>
          ) : (
            <span className="material-symbols-outlined !text-[20px] text-white/70 group-hover:translate-x-1 transition-transform ml-auto" style={iconStyle}>
              arrow_forward
            </span>
          )}
        </button>

        {/* 중단 연관 등록 2열 그리드 */}
        <div className="grid grid-cols-2 gap-2">
          {rightCandidates.map((item) => {
            const isDisabled = !user;
            return (
              <button
                key={item.id}
                onClick={() => !isDisabled && handleSelect(item)}
                disabled={isDisabled}
                className={`
                  relative flex items-center gap-3 p-3 rounded-xl border border-slate-100 transition-all text-left
                  ${isDisabled
                    ? 'opacity-30 bg-slate-50 cursor-not-allowed'
                    : 'bg-slate-50/70 hover:bg-[#007AFF]/5 active:scale-[0.98] hover:border-[#007AFF]/20'
                  }
                `}
              >
                <div
                  className={`
                    w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
                    ${isDisabled ? 'bg-slate-200' : 'text-white shadow-sm'}
                  `}
                  style={!isDisabled ? { background: item.gradient } : undefined}
                >
                  <span className="material-symbols-outlined !text-[16px]" style={iconStyle}>
                    {item.icon}
                  </span>
                </div>
                <span className="text-[11px] font-black text-slate-800 leading-none uppercase tracking-tight">
                  {t(item.labelKey)}
                </span>
                {isDisabled && (
                  <span className="material-symbols-outlined !text-[10px] text-slate-300 ml-auto" style={iconStyle}>lock</span>
                )}
              </button>
            );
          })}
        </div>

        {/* 구분선 + ORG.강사.DJ 섹션 */}
        <div className="flex items-center gap-2 my-0.5">
          <div className="h-px bg-slate-100 flex-1" />
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{t('create_menu.org_section', 'ORG.강사.DJ')}</span>
          <div className="h-px bg-slate-100 flex-1" />
        </div>

        {/* ORG.강사.DJ 등록 */}
        <div className="grid grid-cols-2 gap-2">
          {MENU_ITEMS.filter((item) => ['event', 'venue', 'group', 'dj'].includes(item.id)).map((item) => {
            const isDisabled = !user;
            return (
              <button
                key={item.id}
                onClick={() => !isDisabled && handleSelect(item)}
                disabled={isDisabled}
                className={`
                  flex items-center gap-3 py-3 px-4 rounded-xl transition-all text-left border border-slate-100
                  ${isDisabled
                    ? 'opacity-30 bg-slate-50 cursor-not-allowed'
                    : 'bg-white hover:bg-slate-50 active:scale-[0.98]'
                  }
                `}
              >
                <div
                  className={`
                    w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0
                    ${isDisabled ? 'bg-slate-200' : 'text-white'}
                  `}
                  style={!isDisabled ? { background: item.gradient } : undefined}
                >
                  <span className="material-symbols-outlined !text-[16px]" style={iconStyle}>
                    {item.icon}
                  </span>
                </div>
                <span className="text-[11px] font-black text-slate-800 leading-tight">
                  {t(item.labelKey)}
                </span>
                {isDisabled && (
                  <span className="material-symbols-outlined !text-[12px] text-slate-300 ml-auto" style={iconStyle}>lock</span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  // 2. 기본 레이아웃 (상단 3카드 + 일반 사용자 + ORG.강사.DJ)
  const renderDefaultLayout = () => {
    const topItems = MENU_ITEMS.filter((item) => ['live', 'feed', 'social'].includes(item.id));
    const userItems = MENU_ITEMS.filter((item) => ['resale', 'lost'].includes(item.id));
    const orgItems = MENU_ITEMS.filter((item) => ['event', 'venue', 'group', 'dj'].includes(item.id));

    return (
      <div className="flex flex-col gap-4 py-4 px-2 font-manrope">
        {/* 상단 대형 3카드: 라이브 영상 / 피드 작성 / 밀롱가.쁘락 */}
        <div className="grid grid-cols-3 gap-2.5">
          {topItems.map((item) => {
            const isDisabled = !user;
            return (
              <button
                key={item.id}
                onClick={() => !isDisabled && handleSelect(item)}
                disabled={isDisabled}
                className={`
                  relative flex flex-col items-start justify-end p-4 rounded-2xl h-28 text-left transition-all duration-300 shadow-[0_2px_12px_rgba(0,0,0,0.05)]
                  ${isDisabled
                    ? 'opacity-35 bg-slate-100 cursor-not-allowed'
                    : 'text-white hover:scale-[1.02] active:scale-95 hover:shadow-lg'
                  }
                `}
                style={!isDisabled ? { background: item.gradient } : undefined}
              >
                <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-md flex items-center justify-center mb-auto">
                  <span className="material-symbols-outlined !text-[20px] text-white" style={iconStyle}>
                    {item.icon}
                  </span>
                </div>
                <h5 className="text-[12px] font-black tracking-tight uppercase leading-none">
                  {t(item.labelKey)}
                </h5>
                {isDisabled && (
                  <div className="absolute top-3 right-3">
                    <span className="material-symbols-outlined !text-[12px] text-white/50" style={iconStyle}>lock</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* 일반 사용자: 중고상품 / 분실물 */}
        <div className="grid grid-cols-2 gap-2">
          {userItems.map((item) => {
            const isDisabled = !user;
            return (
              <button
                key={item.id}
                onClick={() => !isDisabled && handleSelect(item)}
                disabled={isDisabled}
                className={`
                  relative flex items-center gap-3 p-3 rounded-xl border border-slate-50 transition-all text-left
                  ${isDisabled
                    ? 'opacity-30 bg-slate-50 cursor-not-allowed'
                    : 'bg-white hover:bg-slate-50 active:scale-[0.98] shadow-sm'
                  }
                `}
              >
                <div
                  className={`
                    w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
                    ${isDisabled ? 'bg-slate-200' : 'text-white'}
                  `}
                  style={!isDisabled ? { background: item.gradient } : undefined}
                >
                  <span className="material-symbols-outlined !text-[18px]" style={iconStyle}>
                    {item.icon}
                  </span>
                </div>
                <span className="text-[11px] font-black text-slate-800 leading-tight">
                  {t(item.labelKey)}
                </span>
                {isDisabled && (
                  <span className="material-symbols-outlined !text-[12px] text-slate-300 ml-auto" style={iconStyle}>lock</span>
                )}
              </button>
            );
          })}
        </div>

        {/* 구분선 + ORG.강사.DJ 섹션 */}
        <div className="flex items-center gap-2 my-0.5">
          <div className="h-px bg-slate-100 flex-1" />
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{t('create_menu.org_section', 'ORG.강사.DJ')}</span>
          <div className="h-px bg-slate-100 flex-1" />
        </div>

        {/* ORG.강사.DJ 등록 4개: 이벤트 / 장소(맵) / 그룹(모임) / DJ일정 */}
        <div className="grid grid-cols-2 gap-2">
          {orgItems.map((item) => {
            const isDisabled = !user;
            return (
              <button
                key={item.id}
                onClick={() => !isDisabled && handleSelect(item)}
                disabled={isDisabled}
                className={`
                  flex items-center gap-3 py-3 px-4 rounded-xl transition-all text-left border border-slate-100
                  ${isDisabled
                    ? 'opacity-30 bg-slate-50 cursor-not-allowed'
                    : 'bg-white hover:bg-slate-50 active:scale-[0.98]'
                  }
                `}
              >
                <div
                  className={`
                    w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0
                    ${isDisabled ? 'bg-slate-200' : 'text-white'}
                  `}
                  style={!isDisabled ? { background: item.gradient } : undefined}
                >
                  <span className="material-symbols-outlined !text-[16px]" style={iconStyle}>
                    {item.icon}
                  </span>
                </div>
                <span className="text-[11px] font-black text-slate-800 leading-tight">
                  {t(item.labelKey)}
                </span>
                {isDisabled && (
                  <span className="material-symbols-outlined !text-[12px] text-slate-300 ml-auto" style={iconStyle}>lock</span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title={t('create_menu.title', '새로 등록하기')} height="auto">
      {currentMatchedId ? renderMatchedLayout(currentMatchedId) : renderDefaultLayout()}
    </BottomSheet>
  );
}
