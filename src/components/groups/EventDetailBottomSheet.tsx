"use client";
// 선택한 날짜의 일정 상세 및 목록 조회를 담당하는 컴포넌트.

import React, { useState, useEffect } from 'react';
import { CalendarEvent } from '@/types/group';
import { MapSelectorBottomSheet, MapType } from '@/components/common/MapSelectorBottomSheet';

interface EventDetailBottomSheetProps {
  selectedDate: Date;
  selectedDayEvents: CalendarEvent[];
  getTypeDotClass: (type: string) => string;
  getTypeBadgeClass: (type: string) => string;
  getTypeLabel: (type: string) => string;
  formatTime: (time: string) => string;
  handleOpenForm: (event: CalendarEvent) => void;
  handleDeleteEvent: (eventId: string) => void;
  t: (key: string) => string;
  formatDate: (date: Date, type: string) => string;
}

export const EventDetailBottomSheet: React.FC<EventDetailBottomSheetProps> = ({
  selectedDate,
  selectedDayEvents,
  getTypeDotClass,
  getTypeBadgeClass,
  getTypeLabel,
  formatTime,
  handleOpenForm,
  handleDeleteEvent,
  t,
  formatDate,
}) => {
  const [selectedMapLocation, setSelectedMapLocation] = useState<string | null>(null);
  const [hasMapCache, setHasMapCache] = useState<boolean>(false);
  const [cachedMapBrand, setCachedMapBrand] = useState<string>('');

  // 선호 지도 캐싱 상태 모니터링
  const updateCacheState = () => {
    if (typeof window === 'undefined') return;
    const cached = localStorage.getItem('woc_preferred_map') as MapType | null;
    if (cached) {
      setHasMapCache(true);
      const brandNames: Record<string, string> = {
        naver: t('map.naver') || '네이버 지도',
        kakao: t('map.kakao') || '카카오맵',
        google: t('map.google') || '구글 지도'
      };
      setCachedMapBrand(brandNames[cached] || cached);
    } else {
      setHasMapCache(false);
      setCachedMapBrand('');
    }
  };

  useEffect(() => {
    updateCacheState();
  }, []);

  const handleResetMapPreference = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (typeof window === 'undefined') return;
    localStorage.removeItem('woc_preferred_map');
    updateCacheState();
  };

  const handleOpenMapSelector = (location: string) => {
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('woc_preferred_map') as MapType | null;
      if (cached) {
        const encoded = encodeURIComponent(location);
        const getMapLink = (type: MapType, name: string) => {
          switch (type) {
            case 'naver': return `https://map.naver.com/v5/search/${encoded}`;
            case 'kakao': return `https://map.kakao.com/?q=${encoded}`;
            case 'google': return `https://www.google.com/maps/search/?api=1&query=${encoded}`;
            default: return `https://www.google.com/maps/search/?api=1&query=${encoded}`;
          }
        };
        window.open(getMapLink(cached, location), '_blank');
        return;
      }
    }
    setSelectedMapLocation(location);
    // 캐시 변경에 반응할 수 있도록 즉시 상태 업데이트
    setTimeout(updateCacheState, 100);
  };

  return (
    <>
      {/* Selected Date Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
        <h3 className="text-lg font-bold text-[#242c51]">
          {formatDate(selectedDate, 'shortMonthDay')} <span className="text-sm text-slate-400 font-medium ml-1">{formatDate(selectedDate, 'weekday')}</span>
        </h3>
      </div>

      {selectedDayEvents.length > 0 ? (
        <div className="relative border-l-2 border-slate-200 ml-4 pl-6 flex flex-col gap-8 py-2">
          {selectedDayEvents.map((event) => (
            <div key={event.id} className="relative group">
              <div className={`absolute -left-[33px] top-1 w-4 h-4 rounded-full ${getTypeDotClass(event.type)} ring-4 ring-background`}></div>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-bold text-slate-500 min-w-[60px]">{event.startTime ? formatTime(event.startTime) : ''}</span>
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wide uppercase ${getTypeBadgeClass(event.type)}`}>
                    {getTypeLabel(event.type)}
                  </span>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                  <h4 className="text-base font-bold text-[#242c51]">{event.title}</h4>
                  {event.description && event.type !== 'social' && (
                    <p className="text-sm font-medium text-slate-500 mt-2 whitespace-pre-wrap">
                      {event.description}
                    </p>
                  )}

                  {/* 클래스 수업개요 (선택일 기준 오늘 주차것만 노출 / 없으면 흐리게 내용없음) */}
                  {event.type === 'class' && (() => {
                    const getWeekOfMonth = (date: Date) => {
                      const currentDate = date.getDate();
                      const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
                      const startDay = startOfMonth.getDay();
                      return Math.ceil((currentDate + startDay) / 7);
                    };
                    const weekNum = Math.min(getWeekOfMonth(selectedDate), 4);
                    const plan = event.weekPlans?.[weekNum - 1] || '';
                    const hasPlan = plan && plan !== '빈칸';
                    return (
                      <div className="mt-4 pt-3.5 border-t border-slate-100 flex flex-col gap-2">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">주차별 수업개요</p>
                        <div className="flex flex-col gap-2 mt-1 bg-slate-50/70 p-3.5 rounded-xl border border-slate-100/50">
                          <div className="text-[13px] font-semibold text-slate-600 flex items-baseline gap-2.5">
                            <span className="font-bold text-[#ba1a1a] shrink-0 min-w-[40px]">{weekNum}주차</span>
                            {hasPlan ? (
                              <span className="text-slate-700 break-all">{plan}</span>
                            ) : (
                              <span className="text-slate-400 font-normal italic break-all opacity-50">내용없음</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* 소셜/밀롱가 Org 및 DJ 노출 / 없으면 흐리게 내용없음 */}
                  {(event.type === 'social' || event.type === 'milonga') && (
                    <div className="mt-4 pt-3.5 border-t border-slate-100 flex flex-col gap-2">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">행사 상세 정보</p>
                      <div className="flex flex-col gap-2 mt-1 bg-slate-50/70 p-3.5 rounded-xl border border-slate-100/50">
                        <div className="text-[13px] font-semibold text-slate-600 flex items-baseline gap-2.5">
                          <span className="font-bold text-[#004190] shrink-0 min-w-[40px]">Org</span>
                          {event.org && event.org !== '빈칸' ? (
                            <span className="text-slate-700 break-all">{event.org}</span>
                          ) : (
                            <span className="text-slate-400 font-normal italic break-all opacity-50">내용없음</span>
                          )}
                        </div>
                        <div className="text-[13px] font-semibold text-slate-600 flex items-baseline gap-2.5">
                          <span className="font-bold text-[#004190] shrink-0 min-w-[40px]">DJ</span>
                          {event.dj && event.dj !== '빈칸' ? (
                            <span className="text-slate-700 break-all">{event.dj}</span>
                          ) : (
                            <span className="text-slate-400 font-normal italic break-all opacity-50">내용없음</span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Smart Location Navigation Sample */}
                  {event.location && (
                    <div className="mt-4 border-t border-slate-50 pt-3">
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => handleOpenMapSelector(event.location!)}
                          className="flex items-center justify-between w-full p-3 bg-[#0057bd]/5 hover:bg-[#0057bd]/10 active:scale-[0.99] border border-[#0057bd]/10 rounded-xl transition-all text-left"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="material-symbols-outlined text-[18px] text-[#0057bd] shrink-0">
                              location_on
                            </span>
                            <div className="min-w-0">
                              <p className="text-[12px] font-black text-[#242c51] truncate">
                                {event.location}
                              </p>
                              <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                                {hasMapCache 
                                  ? `${cachedMapBrand}${t('map.immediate_connection') || '(으)로 즉시 바로 연결됨'}`
                                  : t('map.select_connection') || '터치하여 길찾기 지도 연결'}
                              </p>
                            </div>
                          </div>
                          <span className="material-symbols-outlined text-[#0057bd] text-[16px] shrink-0">
                            navigation
                          </span>
                        </button>

                        {/* 스마트 선호도 초기화 칩 */}
                        {hasMapCache && (
                          <div className="flex items-center justify-between px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-100">
                            <span className="text-[10px] text-slate-400 font-semibold">
                              {cachedMapBrand}{t('map.setting_active') || '(으)로 자동 연결 중'}
                            </span>
                            <button
                              onClick={handleResetMapPreference}
                              className="text-[10px] font-black text-red-500 hover:text-red-600 transition-colors flex items-center gap-1 active:scale-95"
                            >
                              <span className="material-symbols-outlined text-[12px]">refresh</span>
                              {t('map.reset_setting') || '지도 변경하기'}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              {/* Edit/Delete Actions */}
              {event.createdBy !== 'system' && (
                <div className="flex gap-3 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleOpenForm(event)} className="text-xs font-bold text-[#0057bd] hover:underline">{t('calendar.edit') || 'Edit'}</button>
                  <button onClick={() => handleDeleteEvent(event.id)} className="text-xs font-bold text-red-500 hover:underline">{t('calendar.delete') || 'Delete'}</button>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-xl border border-slate-100 shadow-sm mt-4">
          <span className="material-symbols-outlined text-5xl text-slate-300 mb-3 block">event_busy</span>
          <p className="text-sm font-bold text-slate-500">{t('calendar.noEventsScheduledForThisDay') || 'No events scheduled for this day'}</p>
        </div>
      )}

      {/* Map selector bottomsheet integration */}
      {selectedMapLocation && (
        <MapSelectorBottomSheet
          isOpen={!!selectedMapLocation}
          onClose={() => {
            setSelectedMapLocation(null);
            updateCacheState();
          }}
          locationName={selectedMapLocation}
        />
      )}
    </>
  );
};

export default EventDetailBottomSheet;
