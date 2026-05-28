'use client';

import { useEffect } from 'react';
import { useSocialData } from './hooks/useSocialData';
import EditSocialEvent from '@/components/social/EditSocialEvent';
import SocialViewer from '@/components/social/SocialViewer';
import SocialHeroCard, { DualText, getSocialDisplayTitle } from '@/components/social/SocialHeroCard';
import { 
  isKoreanHoliday, 
  detectSeoulDistrict, 
  getDensityMode, 
  getDjDisplay 
} from './constants/seoulRegions';
import { Social } from '@/types/social';

export default function SocialPageContent() {
  const {
    regulars,
    popups,
    dailySocials,
    activeDayOffset,
    setActiveDayOffset,
    selectedSocial,
    isCreateOpen,
    viewType,
    setViewType,
    venuesMap,
    likedSocialIds,
    carouselRef,
    location,
    toggleSelector,
    profile,
    setSubHeader,
    t,
    language,
    dateLocale,
    weekDays,
    favoriteTimeline,
    overviewTimeline,
    todaysSocials,
    cityDisplay,
    viewSocial,
    isViewOpenURL,
    isEditOpenURL,
    handleOpenCreate,
    handleCloseCreate,
    handleOpenView,
    handleCloseView,
    handleOpenEdit,
    handleCloseEdit
  } = useSocialData();

  // SubHeader Injection: 최상단 원라인 바 (One-Line Controller Bar) 이식
  useEffect(() => {
    const filterBar = (
      <div className="relative w-full bg-white flex items-center justify-between px-3.5 py-2 shadow-sm border-b border-slate-100 z-30 h-11">
        {/* 4대 뷰타입 아이콘 버튼 셀렉터 */}
        <div className="flex items-center gap-1">
          {[
            { id: 'slide', icon: 'view_carousel', label: t('social.tab_slide') },
            { id: 'list', icon: 'format_list_bulleted', label: t('social.tab_list') },
            { id: 'weekly', icon: 'calendar_view_week', label: t('social.tab_weekly') },
            { id: 'favorite', icon: 'favorite', label: t('social.tab_favorite') }
          ].map((tab) => {
            const isActive = viewType === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setViewType(tab.id as any)}
                className={`w-7.5 h-7.5 rounded-lg flex items-center justify-center transition-all ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                }`}
                title={tab.label}
              >
                <span className={`material-symbols-rounded text-[17px] ${isActive ? 'fill-1' : ''}`}>{tab.icon}</span>
              </button>
            );
          })}
        </div>

        {/* 신규 소셜 등록 원라인 통합 (중복 지역 선택 칩 제거) */}
        <div className="flex items-center gap-1.5">
          {(profile?.isAdmin || (profile as any)?.systemRole === 'admin' || profile?.isRegistered) && (
            <button
              onClick={() => handleOpenCreate()}
              className="flex items-center gap-0.5 px-2 py-0.5 bg-blue-600 border border-blue-600 text-white rounded-lg text-[10px] font-black active:scale-95 transition-all shadow-sm shadow-blue-500/10 hover:bg-blue-700 shrink-0"
            >
              <span className="material-symbols-rounded text-[11px]">add</span>
              <span>{t('social.register')}</span>
            </button>
          )}
        </div>
      </div>
    );
    const height = 44;
    setSubHeader(filterBar, height);
  }, [viewType, profile, cityDisplay, toggleSelector, setSubHeader, language, t, handleOpenCreate]);

  useEffect(() => {
    return () => setSubHeader(null);
  }, [setSubHeader]);

  // 콤팩트 카드 세로 목록 렌더링 헬퍼 (기존 풀스크린 목록 이식)
  const renderCardList = (cards: Social[], mode: 'emperor' | 'wide' | 'slim' | 'grid') => {
    const isDaySocial = (s: Social) => {
      const time = s.startTime || '19:00';
      const hour = parseInt(time.split(':')[0]);
      return hour < 18;
    };

    if (mode === 'emperor') {
      return (
        <div className="space-y-3">
          {cards.map((social) => (
            <div 
              key={social.id}
              onClick={() => handleOpenView(social)}
              className="relative w-full h-56 rounded-3xl overflow-hidden border border-slate-200 active:scale-[0.99] transition-all cursor-pointer shadow-sm bg-white flex flex-col justify-end p-5 select-none text-left"
            >
              {social.imageUrl ? (
                <div className="absolute inset-0 z-0">
                  <img src={social.imageUrl} alt="" className="w-full h-full object-cover brightness-[0.95]" />
                  <div className="absolute inset-0 bg-gradient-to-t from-white via-white/85 to-white/40" />
                </div>
              ) : (
                <div className="absolute inset-0 z-0 bg-gradient-to-br from-blue-50/30 via-slate-50 to-white" />
              )}
              
              <div className="relative z-10 flex flex-col h-full justify-between">
                <div className="flex justify-between items-center w-full">
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-blue-600 text-white rounded-xl text-[10px] font-black shadow-md shadow-blue-500/10">
                    <span className="material-symbols-rounded text-xs">schedule</span>
                    <span>{social.startTime} - {social.endTime}</span>
                    {isDaySocial(social) && (
                      <span className="ml-1 bg-white/20 px-1 rounded text-[8px] font-bold">
                        {t('social.badge_day')}
                      </span>
                    )}
                  </div>
                  {social.type === 'popup' && (
                    <span className="px-2.5 py-1 bg-rose-600 text-white rounded-xl text-[9px] font-black tracking-widest uppercase shadow-md shadow-rose-500/10">
                      {t('social.badge_popup')}
                    </span>
                  )}
                </div>

                <div className="mt-auto">
                  <h3 className="text-lg font-black text-slate-800 leading-tight">
                    {social.title}
                    {social.titleNative && <span className="block text-xs font-bold text-slate-400 mt-0.5">{social.titleNative}</span>}
                  </h3>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 mt-3 text-[10px] font-bold text-slate-600">
                    <span className="inline-flex items-center gap-1 bg-slate-100 px-2.5 py-1 rounded-xl"><span className="material-symbols-outlined text-[13px] text-blue-500">location_on</span>{social.venueNameNative || social.venueName}</span>
                    <span className="inline-flex items-center gap-1 bg-slate-100 px-2.5 py-1 rounded-xl"><span className="material-symbols-outlined text-[13px] text-slate-500">person</span>{social.organizerNameNative || social.organizerName}</span>
                    {social.djName && <span className="inline-flex items-center gap-1 bg-slate-100 px-2.5 py-1 rounded-xl"><span className="material-symbols-outlined text-[13px] text-amber-500">headphones</span>DJ {social.djName}</span>}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (mode === 'wide') {
      return (
        <div className="space-y-3">
          {cards.map((social) => (
            <div 
              key={social.id}
              onClick={() => handleOpenView(social)}
              className="flex items-center gap-4 p-4 bg-white border border-slate-150 rounded-2xl active:scale-[0.98] transition-all cursor-pointer select-none text-left shadow-sm hover:border-blue-300 h-[104px]"
            >
              <div className="shrink-0 w-16 h-16 rounded-xl overflow-hidden bg-slate-50 border border-slate-100 relative">
                {social.imageUrl ? (
                  <img src={social.imageUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-slate-50 text-slate-300">
                    <span className="material-symbols-outlined text-lg">music_note</span>
                  </div>
                )}
                {social.type === 'popup' && (
                  <span className="absolute top-1 left-1 px-1 bg-rose-600 text-white rounded text-[7px] font-black tracking-wider uppercase scale-90">
                    {t('social.badge_popup')}
                  </span>
                )}
              </div>

              <div className="flex-1 min-w-0 pr-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black bg-blue-50 text-blue-600 px-2 py-0.5 rounded-lg border border-blue-100 leading-none">{social.startTime} - {social.endTime}</span>
                  {isDaySocial(social) && (
                    <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md leading-none shrink-0 bg-amber-50 text-amber-600 border border-amber-100">
                      {t('social.badge_day')}
                    </span>
                  )}
                  {social.djName && <span className="text-[9.5px] font-bold text-slate-400 truncate">DJ {social.djName}</span>}
                </div>
                <h4 className="text-[14.5px] font-black text-slate-800 truncate leading-tight mt-1.5 flex items-baseline gap-1.5">
                  {social.title}
                  {social.titleNative && <span className="text-[10px] font-semibold text-slate-400 truncate">{social.titleNative}</span>}
                </h4>
                <div className="flex items-center gap-2.5 mt-1.5 text-[10px] font-bold text-slate-500 truncate leading-none">
                  <span className="inline-flex items-center gap-0.5"><span className="material-symbols-outlined text-[11px] text-blue-500 shrink-0">location_on</span>{social.venueNameNative || social.venueName}</span>
                  <span className="inline-flex items-center gap-0.5"><span className="material-symbols-outlined text-[11px] text-slate-400 shrink-0">person</span>{social.organizerNameNative || social.organizerName}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (mode === 'slim') {
      return (
        <div className="space-y-2">
          {cards.map((social) => (
            <div 
              key={social.id}
              onClick={() => handleOpenView(social)}
              className="flex items-center gap-3 p-3 bg-white border border-slate-150 rounded-2xl active:scale-[0.98] transition-all cursor-pointer select-none text-left shadow-sm hover:border-blue-300 h-[78px]"
            >
              <div className="shrink-0 w-12 h-12 rounded-xl overflow-hidden bg-slate-50 border border-slate-100 relative">
                {social.imageUrl ? (
                  <img src={social.imageUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-slate-50 text-slate-300">
                    <span className="material-symbols-outlined text-sm">music_note</span>
                  </div>
                )}
                {social.type === 'popup' && (
                  <span className="absolute top-0.5 left-0.5 px-0.5 bg-rose-600 text-white rounded text-[6px] font-black tracking-wider uppercase scale-75 origin-top-left">
                    {t('social.badge_popup')}
                  </span>
                )}
              </div>

              <div className="flex-1 min-w-0 pr-1">
                <div className="flex items-center gap-2">
                  <span className="text-[9.5px] font-black bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-lg border border-blue-100 leading-none">{social.startTime} - {social.endTime}</span>
                  {isDaySocial(social) && (
                    <span className="text-[8.5px] font-black px-1.5 py-0.5 rounded-md leading-none shrink-0 bg-amber-50 text-amber-600 border border-amber-100">
                      {t('social.badge_day')}
                    </span>
                  )}
                  {social.djName && <span className="text-[9.5px] font-bold text-slate-400 truncate">DJ {social.djName}</span>}
                </div>
                <h4 className="text-[13.5px] font-black text-slate-800 truncate leading-tight mt-1 flex items-baseline gap-1.5">
                  {social.title}
                  {social.titleNative && <span className="text-[9.5px] font-semibold text-slate-400 truncate">{social.titleNative}</span>}
                </h4>
                <div className="flex items-center gap-2 mt-1 text-[9.5px] font-bold text-slate-500 truncate leading-none">
                  <span className="inline-flex items-center gap-0.5"><span className="material-symbols-outlined text-[10px] text-blue-500 shrink-0">location_on</span>{social.venueNameNative || social.venueName}</span>
                  <span className="inline-flex items-center gap-0.5"><span className="material-symbols-outlined text-[10px] text-slate-400 shrink-0">person</span>{social.organizerNameNative || social.organizerName}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      );
    }

    return (
      <div className="grid grid-cols-2 gap-2">
        {cards.map((social) => {
          const displayTitle = getSocialDisplayTitle(social);
          const venueText = social.venueNameNative || social.venueName;
          const organizerText = social.organizerNameNative || social.organizerName;
          
          return (
            <div 
              key={social.id}
              onClick={() => handleOpenView(social)}
              className="flex flex-col justify-between p-3 bg-white border border-slate-150 rounded-2xl active:scale-[0.98] transition-all cursor-pointer select-none text-left shadow-sm hover:border-blue-300 h-[88px]"
            >
              <div className="flex items-center justify-between w-full">
                <div className="text-[11px] font-black text-blue-600 tracking-tight leading-none">
                  {social.startTime}
                </div>
                {social.type === 'popup' ? (
                  <span className="text-[7.5px] font-black px-1 py-0.5 bg-rose-600 text-white rounded leading-none shrink-0 scale-90 origin-right uppercase">
                    {t('social.badge_popup')}
                  </span>
                ) : (
                  isDaySocial(social) ? (
                    <span className="text-[8px] font-black px-1.5 py-0.5 rounded leading-none shrink-0 scale-90 origin-right bg-amber-50 text-amber-600 border border-amber-100">
                      {t('social.badge_day')}
                    </span>
                  ) : null
                )}
              </div>
              
              <div className="text-[13px] font-black text-slate-900 truncate leading-tight mt-1">
                {displayTitle.primary}
                {displayTitle.secondary && (
                  <span className="text-[10px] font-semibold text-slate-400 ml-1">
                    ({displayTitle.secondary})
                  </span>
                )}
              </div>
              
              <div className="text-[10.5px] font-bold text-slate-500 truncate leading-none mt-1.5 mb-0.5">
                <span>{venueText}</span>
                {organizerText && (
                  <>
                    <span className="text-slate-350 font-normal mx-1">•</span>
                    <span className="text-slate-400 font-semibold">{organizerText}</span>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <main className="w-full relative pb-32 bg-slate-50/30 overflow-x-hidden">
      <div className="px-4 space-y-6 pt-4">

        {/* 7일 날짜 선택 그리드 (가로 칩 바) - 슬라이드 뷰(slide) 또는 목록 뷰(list) 활성화 시에만 동적 자동 노출 */}
        {(viewType === 'slide' || viewType === 'list') && (
          <div className="w-full bg-white rounded-2xl p-2 shadow-sm border border-slate-100 animate-in fade-in slide-in-from-top-1 duration-300">
            <div className="grid grid-cols-7 gap-1">
              {weekDays.map((date, i) => {
                const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                const holiday = isKoreanHoliday(date);
                const isRed = isWeekend || !!holiday;
                const isSelected = activeDayOffset === i;
                return (
                  <button
                    key={i}
                    onClick={() => setActiveDayOffset(i)}
                    className={`flex flex-col items-center justify-center py-2 rounded-xl transition-all border ${isSelected
                      ? 'bg-slate-900 text-white border-slate-900 shadow-sm shadow-slate-200'
                      : 'bg-transparent border-transparent hover:bg-slate-50 text-slate-500'
                      }`}
                  >
                    <span className={`text-[10px] font-bold uppercase tracking-tighter mb-0.5 ${isSelected
                      ? (isRed ? 'text-red-300' : 'text-slate-100')
                      : (isRed ? 'text-red-500' : 'text-slate-400')
                      }`}>
                      {date.toLocaleDateString(dateLocale, { weekday: 'short' })}
                    </span>
                    <span className={`text-sm font-black tracking-tighter ${!isSelected && isRed ? 'text-red-600' : ''
                      }`}>
                      {date.getDate()}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 1. SLIDE VIEW (가로 스크롤 캐러셀) */}
        {viewType === 'slide' && (
          <section className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div
              ref={carouselRef}
              className="flex gap-4 overflow-x-auto no-scrollbar pt-2 -mx-4 px-4"
            >
              {todaysSocials.length === 0 ? (
                <div className="w-full h-40 flex flex-col items-center justify-center opacity-20 bg-white rounded-lg border border-dashed border-gray-200">
                  <span className="material-symbols-outlined text-4xl mb-2">event_busy</span>
                  <p className="text-xs font-black uppercase tracking-widest">{t('social.no_regular_today')}</p>
                </div>
              ) : (
                todaysSocials.map(social => (
                  <div
                     key={social.id}
                     onClick={() => handleOpenView(social)}
                     className="relative flex-shrink-0 w-60 h-80 rounded-lg overflow-hidden group shadow-sm transition-all md:hover:shadow-md cursor-pointer animate-in zoom-in-95 duration-300 text-left"
                  >
                    <SocialHeroCard social={social} date={weekDays[activeDayOffset]} />
                    {social.type === 'popup' && (
                      <span className="absolute top-3 left-3 z-20 px-2 py-0.5 bg-rose-600 text-white rounded-lg text-[9px] font-black tracking-widest uppercase shadow-md shadow-rose-500/10">
                        {t('social.badge_popup')}
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          </section>
        )}

        {/* 2. LIST VIEW (기존 풀스크린 목록이 모달 없이 아래 그대로 바로 노출) */}
        {viewType === 'list' && (
          <section className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-4">
            {todaysSocials.length === 0 ? (
              <div className="w-full flex flex-col items-center justify-center text-slate-400/40 p-8 bg-white rounded-3xl border border-slate-100/50 shadow-sm">
                <span className="material-symbols-outlined text-4xl mb-2 text-slate-300">event_busy</span>
                <p className="text-xs font-black uppercase tracking-widest text-slate-400">
                  {t('social.no_events')}
                </p>
              </div>
            ) : (
              (() => {
                const grouped: Record<string, Social[]> = {};
                const isSeoul = location.city === 'SEOUL';
                
                if (isSeoul) {
                  const preGrouped: Record<string, Social[]> = {};
                  todaysSocials.forEach(s => {
                    const dist = detectSeoulDistrict(s, language, venuesMap);
                    if (!preGrouped[dist]) preGrouped[dist] = [];
                    preGrouped[dist].push(s);
                  });

                  Object.keys(preGrouped).forEach(dist => {
                    const list = preGrouped[dist];
                    const hasDaySocial = list.some(s => {
                      const time = s.startTime || '19:00';
                      const hour = parseInt(time.split(':')[0]);
                      return !isNaN(hour) && hour < 18;
                    });

                    if (hasDaySocial) {
                      const dayList: Social[] = [];
                      const nightList: Social[] = [];

                      list.forEach(s => {
                        const time = s.startTime || '19:00';
                        const hour = parseInt(time.split(':')[0]);
                        if (!isNaN(hour) && hour < 18) {
                          dayList.push(s);
                        } else {
                          nightList.push(s);
                        }
                      });

                      if (dayList.length > 0) {
                        const key = `${dist} - ${t('social.timeline_day')}`;
                        grouped[key] = dayList;
                      }
                      if (nightList.length > 0) {
                        const key = `${dist} - ${t('social.timeline_night')}`;
                        grouped[key] = nightList;
                      }
                    } else {
                      grouped[dist] = list;
                    }
                  });
                } else {
                  const key = cityDisplay;
                  grouped[key] = todaysSocials;
                }

                // 각 그룹 내부의 소셜 리스트를 startTime 기준 빠른 시간순으로 정렬
                Object.keys(grouped).forEach(key => {
                  grouped[key].sort((a, b) => {
                    const timeA = a.startTime || '00:00';
                    const timeB = b.startTime || '00:00';
                    return timeA.localeCompare(timeB);
                  });
                });

                // 한강 위(강북) -> 한강 아래(강남) 순으로 정렬하며, 동일 구역 내에서는 낮 소셜이 먼저 오도록 정렬
                const sortedDists = Object.keys(grouped).sort((a, b) => {
                  const aIsGangbuk = a.includes('한강위') || a.includes('강북') || a.includes('홍대');
                  const bIsGangbuk = b.includes('한강위') || b.includes('강북') || b.includes('홍대');
                  if (aIsGangbuk && !bIsGangbuk) return -1;
                  if (!aIsGangbuk && bIsGangbuk) return 1;

                  const aIsDay = a.includes('낮') || a.includes('Day');
                  const bIsDay = b.includes('낮') || b.includes('Day');
                  if (aIsDay && !bIsDay) return -1;
                  if (!aIsDay && bIsDay) return 1;

                  return a.localeCompare(b);
                });

                return sortedDists.map((dist) => {
                  const list = grouped[dist];
                  const currentMode = getDensityMode(list.length);

                  return (
                    <div key={dist} className="space-y-3">
                      <div className="flex items-center gap-2 py-1 px-1">
                        <span className="material-symbols-rounded text-blue-600 text-xs">location_searching</span>
                        <span className="text-[11px] font-black text-slate-600 uppercase tracking-widest">
                          {dist} ({list.length})
                        </span>
                        <div className="flex-1 h-px bg-slate-200" />
                      </div>
                      {renderCardList(list, currentMode)}
                    </div>
                  );
                });
              })()
            )}
          </section>
        )}

        {/* 3. WEEKLY VIEW (요일별 한눈에 보기 세로 타임라인) */}
        {viewType === 'weekly' && (
          <section className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300 text-left pb-10">
            {overviewTimeline.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <span className="material-symbols-outlined text-4xl mb-2">event_busy</span>
                <p className="text-sm font-medium">{t('social.no_upcoming')}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {overviewTimeline.map((group, idx) => {
                  const isToday = group.date.toDateString() === new Date().toDateString();
                  const holiday = isKoreanHoliday(group.date);
                  const isWeekend = group.date.getDay() === 0 || group.date.getDay() === 6;
                  const isRed = isWeekend || !!holiday;
                  return (
                    <div key={idx} className="overflow-hidden rounded-xl border border-slate-100 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] bg-white">
                      {/* Day Header */}
                      <div className={`flex items-center gap-3 px-4 py-3 border-b border-slate-100 ${isToday ? 'bg-blue-600' : isRed ? 'bg-red-500' : 'bg-slate-800'}`}>
                        <div className="flex flex-col items-center justify-center w-10 h-10 rounded-lg bg-white/15 shrink-0">
                          <span className="text-[9px] font-black text-white/80 uppercase tracking-wider leading-none">
                            {group.date.toLocaleDateString(dateLocale, { weekday: 'short' })}
                          </span>
                          <span className="text-[20px] font-black text-white leading-none tracking-tighter">
                            {group.date.getDate()}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-[13px] font-black text-white tracking-tight">
                            {group.date.toLocaleDateString(dateLocale, { month: 'long', day: 'numeric' })}
                            {isToday && <span className="ml-2 bg-white text-blue-600 px-1.5 py-0.5 rounded text-[9px] leading-none font-black">{t('social.today')}</span>}
                            {holiday && <span className="ml-2 bg-white/20 text-white px-1.5 py-0.5 rounded text-[9px] leading-none">{holiday}</span>}
                          </h3>
                        </div>
                        <span className="text-[11px] font-bold text-white/60 tracking-wider shrink-0">{group.socials.length} {t('social.events_count')}</span>
                      </div>
                      
                      {/* Event Rows */}
                      <div className="bg-white divide-y divide-slate-50">
                        {group.socials.map(social => (
                          <div
                            key={social.id}
                            onClick={() => handleOpenView(social)}
                            className="px-4 py-3 flex items-center gap-3 md:hover:bg-slate-50 transition-colors cursor-pointer active:bg-slate-100 group"
                          >
                            <div className="shrink-0 w-10 h-10 rounded-lg overflow-hidden bg-slate-100 border border-slate-100 relative">
                              {social.imageUrl ? (
                                <img src={social.imageUrl} alt={social.title} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <span className="material-symbols-outlined text-[18px] text-slate-300">music_note</span>
                                </div>
                              )}
                              {social.type === 'popup' && (
                                <span className="absolute top-0.5 left-0.5 px-0.5 bg-rose-600 text-white rounded text-[5px] font-black tracking-wider uppercase scale-75 origin-top-left">
                                  {t('social.badge_popup')}
                                </span>
                              )}
                            </div>
                            <div className="flex-1 min-w-0 pr-2">
                              <h4 className="text-[14px] font-bold text-slate-800 truncate leading-tight flex items-baseline gap-1.5">
                                {social.title}
                                {social.titleNative && <span className="text-[10px] font-medium text-slate-400 truncate">{social.titleNative}</span>}
                              </h4>
                              <p className="text-[11px] font-medium text-slate-500 truncate mt-0.5">
                                <span className="inline-flex items-center gap-0.5"><span className="material-symbols-outlined text-[14px] leading-none">location_on</span>{social.venueNameNative || social.venueName}</span>
                              </p>
                              <p className="text-[11px] font-medium text-slate-500 truncate mt-0.5">
                                <span className="inline-flex items-center gap-0.5"><span className="material-symbols-outlined text-[14px] leading-none">schedule</span>{social.startTime}-{social.endTime}</span>
                                {social.djName && <span className="ml-2 inline-flex items-center gap-0.5"><span className="material-symbols-outlined text-[14px] leading-none">headphones</span>DJ {social.djName}</span>}
                              </p>
                            </div>
                            <div className="shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-white shadow-sm border border-slate-100 md:group-hover:border-blue-200 transition-all">
                              <span className="material-symbols-outlined text-[16px] text-slate-400 md:group-hover:text-blue-600">chevron_right</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* 4. FAVORITE VIEW (즐겨찾기 찜 목록 세로 타임라인) */}
        {viewType === 'favorite' && (
          <section className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300 text-left">
            {favoriteTimeline.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <span className="material-symbols-outlined text-4xl mb-2">favorite_border</span>
                <p className="text-sm font-medium">{t('social.no_liked')}</p>
              </div>
            ) : (
              favoriteTimeline.map((group, idx) => (
                <div key={idx} className="space-y-4">
                  <div className="flex items-center gap-4 py-2">
                    <h3 className="text-lg font-black text-slate-800 tracking-tight">
                      {group.date.toLocaleDateString(dateLocale, { weekday: 'short', month: 'long', day: 'numeric' })}
                    </h3>
                    <div className="flex-1 h-px bg-slate-200"></div>
                  </div>
                  {group.socials.map((social) => {
                    const displayTitle = getSocialDisplayTitle(social);
                    return (
                      <div
                        key={`${social.id}-${group.date.getTime()}`}
                        onClick={() => handleOpenView(social)}
                        className="relative flex items-center gap-4 p-4 bg-white rounded-lg border border-[#dde4e5] md:hover:border-primary/30 transition-all cursor-pointer group shadow-sm active:scale-[0.98] text-left"
                      >
                        <div className="flex flex-col items-center justify-center w-20 h-20 bg-[#F4FBFB] rounded-lg border-l-4 border-primary shrink-0 relative">
                          {(() => {
                            const d = group.date; return (<>
                              <span className="text-[9px] font-black text-primary uppercase tracking-widest leading-none mb-1">
                                {d.toLocaleDateString(dateLocale, { weekday: 'short' }).toUpperCase()}
                              </span>
                              <span className="text-2xl font-black text-on-surface tracking-tighter leading-none mb-1">
                                {d.getDate()}
                              </span>
                              <span className="text-[9px] font-bold text-on-surface-variant uppercase tracking-widest leading-none">
                                {d.toLocaleDateString(dateLocale, { month: 'short' }).toUpperCase()}
                              </span>
                            </>);
                          })()}
                        </div>
                        <div className="flex-1 space-y-0.5 text-left overflow-hidden pr-8">
                          <DualText
                            text={displayTitle.primary}
                            subText={displayTitle.secondary}
                            primaryClassName="text-lg font-bold text-on-surface font-headline leading-tight truncate"
                            secondaryClassName="text-[11px] text-on-surface-variant/60 font-normal truncate shrink-0 ml-1.5"
                            containerClassName="w-full"
                          />
                          <DualText
                            text={social.venueName}
                            subText={social.venueNameNative}
                            primaryClassName="text-sm text-primary font-semibold truncate"
                            secondaryClassName="text-[10px] text-primary/50 font-normal truncate ml-1.5"
                            containerClassName="w-full mt-0.5"
                          />
                          <p className="text-xs text-on-surface-variant font-medium truncate mt-1">
                            {social.startTime} - {social.endTime} {(() => {
                              const djName = getDjDisplay(social, group.date);
                              return djName && djName !== 'TBD' && djName !== 'TBA' ? `• DJ ${djName}` : '';
                            })()}
                          </p>
                        </div>
                        {social.type === 'popup' && (
                          <span className="absolute top-3 right-3 px-2 py-0.5 bg-rose-600 text-white rounded-lg text-[8px] font-black tracking-wider uppercase scale-90">
                            {t('social.badge_popup')}
                          </span>
                        )}
                        <span className="material-symbols-outlined text-[#dde4e5] group-hover:text-primary transition-all group-hover:translate-x-1 absolute right-4 top-1/2 -translate-y-1/2">chevron_right</span>
                      </div>
                    );
                  })}
                </div>
              ))
            )}
          </section>
        )}

      </div>

      {isViewOpenURL && viewSocial && (
        <SocialViewer
          social={viewSocial}
          onClose={handleCloseView}
        />
      )}

      {isEditOpenURL && selectedSocial && (
        <EditSocialEvent
          socialData={selectedSocial}
          onClose={handleCloseEdit}
        />
      )}

      {isCreateOpen && (
        <EditSocialEvent
          onClose={handleCloseCreate}
        />
      )}
    </main>
  );
}
