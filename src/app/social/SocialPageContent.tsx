'use client';

import { useEffect, useState } from 'react';
import { useSocialData } from './hooks/useSocialData';
import EditSocialEvent from '@/components/social/EditSocialEvent';
import SocialViewer from '@/components/social/SocialViewer';
import SocialHeroCard, { DualText, getSocialDisplayTitle } from '@/components/social/SocialHeroCard';
import { 
  isKoreanHoliday, 
  detectSeoulDistrict, 
  getDensityMode, 
  getVenueDisplay,
  formatInstructorNames,
  formatCommunityName,
  getWeekOrdinal
} from './constants/seoulRegions';
import { Social } from '@/types/social';
import PosterOverlay from '@/components/social/poster/PosterOverlay';
import { isVideoUrl, getDjDisplay } from '@/lib/utils/socialUtils';

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
    localViewSocial,
    viewSocialDate,
    isViewOpenURL,
    isEditOpenURL,
    handleOpenCreate,
    handleCloseCreate,
    handleOpenView,
    handleCloseView,
    handleOpenEdit,
    handleCloseEdit
  } = useSocialData();
  const [activeWeek, setActiveWeek] = useState(() => {
    return getWeekOrdinal(new Date());
  });

  // activeWeek 변경 시 해당 주차의 첫 날짜 요소로 부드럽게 스크롤
  useEffect(() => {
    const el = document.getElementById(`week-${activeWeek}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [activeWeek]);

  // SubHeader Injection: 최상단 원라인 바 (One-Line Controller Bar) 이식
  useEffect(() => {
    const today = new Date();
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const maxWeeks = getWeekOrdinal(endOfMonth);
    const weeks = Array.from({ length: maxWeeks }, (_, i) => i + 1);

    const filterBar = (
      <div className="relative w-full bg-white flex items-center justify-between px-3.5 py-2 shadow-sm border-b border-slate-100 z-30 h-11">
        {/* 주차 네비게이션 (클래스 탭의 네비게이션 스타일 이식) */}
        <div className="flex items-center gap-3 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
          <button 
            onClick={() => setActiveWeek(prev => Math.max(1, prev - 1))} 
            disabled={activeWeek <= 1}
            className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-slate-200 active:scale-90 transition-all text-slate-500 disabled:opacity-30 disabled:pointer-events-none"
          >
            <span className="material-symbols-outlined text-[18px]">chevron_left</span>
          </button>
          <span className="text-[11px] font-black text-slate-700 uppercase tracking-widest min-w-[60px] text-center">
            {language === 'KR' ? `${activeWeek}주차` : `Week ${activeWeek}`}
          </span>
          <button 
            onClick={() => setActiveWeek(prev => Math.min(maxWeeks, prev + 1))} 
            disabled={activeWeek >= maxWeeks}
            className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-slate-200 active:scale-90 transition-all text-slate-500 disabled:opacity-30 disabled:pointer-events-none"
          >
            <span className="material-symbols-outlined text-[18px]">chevron_right</span>
          </button>
        </div>

        {/* 신규 소셜 등록 */}
        <div className="flex items-center gap-1.5 shrink-0 ml-2">
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
  }, [profile, setSubHeader, t, handleOpenCreate, language, activeWeek]);

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
          {cards.map((social) => {
            const hasPoster = social.posterLayoutId && social.posterLayoutId !== 'none';
            return (
              <div 
                key={social.id}
                onClick={() => handleOpenView(social, weekDays[activeDayOffset])}
                className="relative w-full h-56 rounded-3xl overflow-hidden border border-slate-200 active:scale-[0.99] transition-all cursor-pointer shadow-sm bg-white flex flex-col justify-end p-5 select-none text-left"
              >
                {social.imageUrl ? (
                  <div className="absolute inset-0 z-0">
                    {isVideoUrl(social.imageUrl) ? (
                      <video 
                        src={social.imageUrl} 
                        className="w-full h-full object-cover brightness-[0.95]" 
                        muted 
                        autoPlay 
                        loop 
                        playsInline 
                        preload="metadata"
                      />
                    ) : (
                      <img src={social.imageUrl} alt="" className="w-full h-full object-cover brightness-[0.95]" />
                    )}
                    {!hasPoster && <div className="absolute inset-0 bg-gradient-to-t from-white via-white/85 to-white/40" />}
                  </div>
                ) : (
                  <div className="absolute inset-0 z-0 bg-gradient-to-br from-blue-50/30 via-slate-50 to-white" />
                )}

                {hasPoster ? (
                  <PosterOverlay social={social} />
                ) : (
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
                        {formatCommunityName(social.titleNative || social.title, language)}
                      </h3>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 mt-3 text-[10px] font-bold text-slate-600">
                        <span className="inline-flex items-center gap-1 bg-slate-100 px-2.5 py-1 rounded-xl"><span className="material-symbols-outlined text-[13px] text-blue-500">location_on</span>{formatCommunityName(getVenueDisplay(social, language, venuesMap), language)}</span>
                        <span className="inline-flex items-center gap-1 bg-slate-100 px-2.5 py-1 rounded-xl"><span className="material-symbols-outlined text-[13px] text-slate-500">person</span>{formatCommunityName(social.organizerNameNative || social.organizerName || "", language)}</span>
                        {social.djName && <span className="inline-flex items-center gap-1 bg-slate-100 px-2.5 py-1 rounded-xl"><span className="material-symbols-outlined text-[13px] text-amber-500">headphones</span>DJ {formatInstructorNames(social.djName, language)}</span>}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      );
    }

    if (mode === 'wide') {
      return (
        <div className="space-y-3">
          {cards.map((social) => (
            <div 
              key={social.id}
              onClick={() => handleOpenView(social, weekDays[activeDayOffset])}
              className="flex items-center gap-4 p-4 bg-white border border-slate-150 rounded-2xl active:scale-[0.98] transition-all cursor-pointer select-none text-left shadow-sm hover:border-blue-300 h-[104px]"
            >
              <div className="shrink-0 w-16 h-16 rounded-xl overflow-hidden bg-slate-50 border border-slate-100 relative">
                {social.imageUrl ? (
                  isVideoUrl(social.imageUrl) ? (
                    <video 
                      src={social.imageUrl} 
                      className="w-full h-full object-cover" 
                      muted 
                      autoPlay 
                      loop 
                      playsInline 
                      preload="metadata"
                    />
                  ) : (
                    <img src={social.imageUrl} alt="" className="w-full h-full object-cover" />
                  )
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
                  {social.djName && <span className="text-[9.5px] font-bold text-slate-400 truncate">DJ {formatInstructorNames(social.djName, language)}</span>}
                </div>
                <h4 className="text-[14.5px] font-black text-slate-800 truncate leading-tight mt-1.5">
                  {formatCommunityName(social.titleNative || social.title, language)}
                </h4>
                <div className="flex items-center gap-2.5 mt-1.5 text-[10px] font-bold text-slate-500 truncate leading-none">
                  <span className="inline-flex items-center gap-0.5"><span className="material-symbols-outlined text-[11px] text-blue-500 shrink-0">location_on</span>{formatCommunityName(getVenueDisplay(social, language, venuesMap), language)}</span>
                  <span className="inline-flex items-center gap-0.5"><span className="material-symbols-outlined text-[11px] text-slate-400 shrink-0">person</span>{formatCommunityName(social.organizerNameNative || social.organizerName || "", language)}</span>
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
              onClick={() => handleOpenView(social, weekDays[activeDayOffset])}
              className="flex items-center gap-3 p-3 bg-white border border-slate-150 rounded-2xl active:scale-[0.98] transition-all cursor-pointer select-none text-left shadow-sm hover:border-blue-300 h-[78px]"
            >
              <div className="shrink-0 w-12 h-12 rounded-xl overflow-hidden bg-slate-50 border border-slate-100 relative">
                {social.imageUrl ? (
                  isVideoUrl(social.imageUrl) ? (
                    <video 
                      src={social.imageUrl} 
                      className="w-full h-full object-cover" 
                      muted 
                      autoPlay 
                      loop 
                      playsInline 
                      preload="metadata"
                    />
                  ) : (
                    <img src={social.imageUrl} alt="" className="w-full h-full object-cover" />
                  )
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
                  {social.djName && <span className="text-[9.5px] font-bold text-slate-400 truncate">DJ {formatInstructorNames(social.djName, language)}</span>}
                </div>
                <h4 className="text-[13.5px] font-black text-slate-800 truncate leading-tight mt-1">
                  {formatCommunityName(social.titleNative || social.title, language)}
                </h4>
                <div className="flex items-center gap-2 mt-1 text-[9.5px] font-bold text-slate-500 truncate leading-none">
                  <span className="inline-flex items-center gap-0.5"><span className="material-symbols-outlined text-[10px] text-blue-500 shrink-0">location_on</span>{formatCommunityName(getVenueDisplay(social, language, venuesMap), language)}</span>
                  <span className="inline-flex items-center gap-0.5"><span className="material-symbols-outlined text-[10px] text-slate-400 shrink-0">person</span>{formatCommunityName(social.organizerNameNative || social.organizerName || "", language)}</span>
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
          const venueText = getVenueDisplay(social, language, venuesMap);
          const organizerText = social.organizerNameNative || social.organizerName;
          
          return (
            <div 
              key={social.id}
              onClick={() => handleOpenView(social, weekDays[activeDayOffset])}
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
                {formatCommunityName(social.titleNative || social.title, language)}
              </div>
              
              <div className="text-[10.5px] font-bold text-slate-500 truncate leading-none mt-1.5 mb-0.5">
                <span>{formatCommunityName(venueText, language)}</span>
                {organizerText && (
                  <>
                    <span className="text-slate-355 font-normal mx-1">•</span>
                    <span className="text-slate-400 font-semibold">{formatCommunityName(organizerText, language)}</span>
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

        {/* WEEKLY VIEW (요일별 한눈에 보기 세로 타임라인) */}
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
                const weekNum = getWeekOrdinal(group.date);
                const isFirstDayOfWeek = idx === 0 || getWeekOrdinal(overviewTimeline[idx - 1].date) !== weekNum;
                return (
                  <div 
                    key={idx} 
                    id={isFirstDayOfWeek ? `week-${weekNum}` : undefined}
                    className="overflow-hidden rounded-xl border border-slate-100 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] bg-white scroll-mt-28"
                  >
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
                          onClick={() => handleOpenView(social, group.date)}
                          className="px-4 py-3 flex items-center gap-3 md:hover:bg-slate-50 transition-colors cursor-pointer active:bg-slate-100 group"
                        >
                          <div className="shrink-0 w-10 h-10 rounded-lg overflow-hidden bg-slate-100 border border-slate-100 relative">
                            {social.imageUrl ? (
                              isVideoUrl(social.imageUrl) ? (
                                <video 
                                  src={social.imageUrl} 
                                  className="w-full h-full object-cover" 
                                  muted 
                                  autoPlay 
                                  loop 
                                  playsInline 
                                  preload="metadata"
                                />
                              ) : (
                                <img src={social.imageUrl} alt={social.title} className="w-full h-full object-cover" />
                              )
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
                            <h4 className="text-[14px] font-bold text-slate-800 truncate leading-tight">
                              {formatCommunityName(social.titleNative || social.title, language)}
                            </h4>
                            <p className="text-[11px] font-medium text-slate-500 truncate mt-0.5">
                              <span className="inline-flex items-center gap-0.5"><span className="material-symbols-outlined text-[14px] leading-none">location_on</span>{formatCommunityName(getVenueDisplay(social, language, venuesMap), language)}</span>
                            </p>
                            <p className="text-[11px] font-medium text-slate-500 truncate mt-0.5">
                              <span className="inline-flex items-center gap-0.5"><span className="material-symbols-outlined text-[14px] leading-none">schedule</span>{social.startTime}-{social.endTime}</span>
                              {social.djName && <span className="ml-2 inline-flex items-center gap-0.5"><span className="material-symbols-outlined text-[14px] leading-none">headphones</span>DJ {formatInstructorNames(social.djName, language)}</span>}
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

      </div>

      {localViewSocial && (
        <SocialViewer
          social={localViewSocial}
          targetDate={viewSocialDate || undefined}
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
