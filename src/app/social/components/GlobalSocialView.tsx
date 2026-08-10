'use client';

import { useEffect, useMemo, useState } from 'react';
import { Social } from '@/types/social';
import { SocialCard } from '@/app/today/components/TodaySocialSection';
import {
  countGlobalSocialsByCountry,
  countGlobalSocialsByCity,
  filterGlobalSocials,
} from '../utils/globalSocialAdapter';

interface GlobalSocialViewProps {
  socials: Social[];
  venuesMap: Record<string, any>;
  selectedDate: Date;
  weekDates: Date[];
  onSelectDate: (d: Date) => void;
  country: string;
  city: string;
  onSelectCountry: (country: string) => void;
  onSelectCity: (city: string) => void;
  onOpenSocial: (id: string) => void;
  language: string;
}

function DropdownSelector({
  label,
  entries,
  selected,
  onSelect,
  emptyLabel,
}: {
  label: string;
  entries: { key: string; count: number }[];
  selected: string;
  onSelect: (key: string) => void;
  emptyLabel: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1 bg-white border rounded-full px-3 py-1.5 text-[12px] font-black shadow-sm transition-all active:scale-95 cursor-pointer ${
          selected ? 'text-[#1e293b] border-slate-300' : 'text-slate-400 border-slate-200'
        }`}
      >
        <span className="max-w-[120px] truncate">{selected || label}</span>
        <span className={`material-symbols-outlined !text-[14px] transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>
          expand_more
        </span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 z-50 mt-1.5 w-[240px] bg-white shadow-2xl border border-slate-100/80 rounded-2xl p-2 animate-in fade-in slide-in-from-top-2 duration-200 max-h-[320px] overflow-y-auto no-scrollbar">
            {entries.length === 0 ? (
              <div className="px-3 py-4 text-[12px] font-semibold text-slate-400 text-center">{emptyLabel}</div>
            ) : (
              entries.map(({ key, count }) => (
                <button
                  key={key}
                  onClick={() => {
                    onSelect(key);
                    setOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-[12.5px] font-bold text-left transition-all cursor-pointer ${
                    selected === key
                      ? 'bg-[#1e293b] text-white'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span className="truncate">{key}</span>
                  <span className={`text-[11px] font-black ${selected === key ? 'text-white/70' : 'text-slate-400'}`}>{count}</span>
                </button>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}

function getDayLabel(language: string, d: Date) {
  const names = language === 'KR' ? ['일', '월', '화', '수', '목', '금', '토'] : ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  return names[d.getDay()];
}

export default function GlobalSocialView({
  socials,
  venuesMap,
  selectedDate,
  weekDates,
  onSelectDate,
  country,
  city,
  onSelectCountry,
  onSelectCity,
  onOpenSocial,
  language,
}: GlobalSocialViewProps) {
  const countryEntries = useMemo(() => countGlobalSocialsByCountry(socials, selectedDate), [socials, selectedDate]);
  const cityEntries = useMemo(
    () => (country ? countGlobalSocialsByCity(socials, country, selectedDate) : []),
    [socials, country, selectedDate]
  );

  // 국가가 선택되지 않았거나, 선택된 도시가 현재 국가에 없는 경우 자동으로 최상위 항목으로 보정
  useEffect(() => {
    if (!country && countryEntries.length > 0) {
      onSelectCountry(countryEntries[0].key);
    }
  }, [country, countryEntries, onSelectCountry]);

  useEffect(() => {
    if (country && cityEntries.length > 0 && !cityEntries.some(e => e.key === city)) {
      onSelectCity(cityEntries[0].key);
    }
  }, [country, city, cityEntries, onSelectCity]);

  const todaysGlobalSocials = useMemo(() => {
    if (!country || !city) return [];
    return filterGlobalSocials(socials, country, city, selectedDate);
  }, [socials, country, city, selectedDate]);

  const emptyLabel = language === 'KR' ? '선택한 날짜에 열리는 Social이 없습니다' : 'No countries/cities';

  return (
    <div className="min-h-screen bg-[#f5f7fa]">
      {/* 국가/도시 selector */}
      <div className="px-4 py-2.5 flex items-center gap-2 bg-white border-b border-slate-100/80">
        <DropdownSelector
          label={language === 'KR' ? '국가' : 'Country'}
          entries={countryEntries}
          selected={country}
          onSelect={onSelectCountry}
          emptyLabel={emptyLabel}
        />
        <DropdownSelector
          label={language === 'KR' ? '도시' : 'City'}
          entries={cityEntries}
          selected={city}
          onSelect={onSelectCity}
          emptyLabel={emptyLabel}
        />
      </div>

      {/* 날짜 선택 바 (Local과 동일 스타일) */}
      <div className="px-3 py-2 bg-white border-b border-slate-100/80">
        <div className="flex items-center gap-0.5">
          {weekDates.map((d, idx) => {
            const isToday = d.toDateString() === new Date().toDateString();
            const isSelected = d.toDateString() === selectedDate.toDateString();
            return (
              <button
                key={idx}
                onClick={() => onSelectDate(d)}
                className={`flex-1 flex flex-col items-center justify-center py-1.5 rounded-xl transition-all duration-200 ${
                  isSelected ? 'bg-[#1e293b] shadow-md' : 'hover:bg-slate-100/80'
                }`}
              >
                <span className={`text-[10px] font-bold tracking-wide uppercase w-full text-center block ${
                  isSelected ? 'text-white/70' : 'text-slate-400'
                }`}>
                  {getDayLabel(language, d)}
                </span>
                <span className={`text-[17px] font-black leading-tight mt-0.5 w-full text-center block ${
                  isSelected ? 'text-white' : isToday ? 'text-[#007AFF]' : 'text-[#1e293b]'
                }`}>
                  {d.getDate()}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 오늘 열리는 Social 목록 */}
      <div className="px-4 py-4">
        <h3 className="text-[13px] font-black text-slate-500 uppercase tracking-wide mb-3">
          {language === 'KR' ? '오늘 열리는 Social' : "Today's Socials"} {todaysGlobalSocials.length > 0 && `(${todaysGlobalSocials.length})`}
        </h3>

        {todaysGlobalSocials.length > 0 ? (
          <div className="grid grid-cols-3 gap-x-2 gap-y-4">
            {todaysGlobalSocials.map(s => (
              <SocialCard
                key={s.id}
                social={s}
                date={selectedDate}
                venuesMap={venuesMap}
                onPress={() => onOpenSocial(s.id)}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 bg-white rounded-2xl border border-dashed border-slate-200">
            <span className="material-symbols-outlined !text-[32px] text-slate-300 mb-2">public_off</span>
            <p className="text-[13px] font-semibold text-slate-400">
              {language === 'KR' ? '선택한 날짜/도시에 열리는 Social이 없습니다.' : 'No socials on this date/city.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
