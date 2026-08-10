'use client';

import { useEffect, useMemo, useState } from 'react';
import { Social } from '@/types/social';
import { SocialCard } from '@/app/today/components/TodaySocialSection';
import { SocialScope } from '../hooks/useSocialScope';
import { useAllGlobalSocials } from '../hooks/useAllGlobalSocials';
import {
  countGlobalSocialsByCountry,
  countGlobalSocialsByCity,
  filterGlobalSocials,
  groupGlobalSocialsByCity,
} from '../utils/globalSocialAdapter';
import SocialScopeTabs from './SocialScopeTabs';
import ViewCycleButton, { TodayViewMode } from './ViewCycleButton';

interface GlobalSocialViewProps {
  scope: SocialScope;
  onScopeChange: (scope: SocialScope) => void;
  viewMode: TodayViewMode;
  onViewModeChange: (mode: TodayViewMode) => void;
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

const ALL_CITY = 'ALL';

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
  const selectedLabel = selected === ALL_CITY ? 'ALL' : selected;

  return (
    <div className="relative min-w-0">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-0.5 bg-white border rounded-full px-2 py-1.5 text-[11px] font-black shadow-sm transition-all active:scale-95 cursor-pointer max-w-[76px] min-w-0 overflow-hidden ${
          selected ? 'text-[#1e293b] border-slate-300' : 'text-slate-400 border-slate-200'
        }`}
      >
        <span className="truncate min-w-0">{selectedLabel || label}</span>
        <span className={`material-symbols-outlined !text-[13px] shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>
          expand_more
        </span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 z-50 mt-1.5 w-[220px] bg-white shadow-2xl border border-slate-100/80 rounded-2xl p-2 animate-in fade-in slide-in-from-top-2 duration-200 max-h-[320px] overflow-y-auto no-scrollbar">
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
                  <span className="truncate">{key === ALL_CITY ? 'ALL' : key}</span>
                  <span className={`text-[11px] font-black shrink-0 ml-2 ${selected === key ? 'text-white/70' : 'text-slate-400'}`}>{count}</span>
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
  scope,
  onScopeChange,
  viewMode,
  onViewModeChange,
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
  const allGlobalSocials = useAllGlobalSocials();

  const countryEntries = useMemo(
    () => countGlobalSocialsByCountry(allGlobalSocials, socials, selectedDate),
    [allGlobalSocials, socials, selectedDate]
  );
  const cityEntries = useMemo(() => {
    if (!country) return [];
    const cities = countGlobalSocialsByCity(allGlobalSocials, socials, country, selectedDate);
    const totalForCountry = cities.reduce((sum, c) => sum + c.count, 0);
    return [{ key: ALL_CITY, count: totalForCountry }, ...cities];
  }, [allGlobalSocials, socials, country, selectedDate]);

  // 국가가 선택되지 않은 경우에만 최상위 항목으로 자동 보정 (도시는 항상 ALL 기본값 — 자동 선택하지 않음)
  useEffect(() => {
    if (!country && countryEntries.length > 0) {
      onSelectCountry(countryEntries[0].key);
    }
  }, [country, countryEntries, onSelectCountry]);

  const effectiveCity = city || ALL_CITY;

  const matchedSocials = useMemo(() => {
    if (!country) return [];
    return filterGlobalSocials(socials, country, effectiveCity === ALL_CITY ? '' : effectiveCity, selectedDate);
  }, [socials, country, effectiveCity, selectedDate]);

  const groupedByCity = useMemo(() => {
    if (effectiveCity !== ALL_CITY) return null;
    return groupGlobalSocialsByCity(matchedSocials);
  }, [matchedSocials, effectiveCity]);

  const emptyLabel = language === 'KR' ? '등록된 항목이 없습니다' : 'No entries';

  return (
    <div className="min-h-screen bg-[#f5f7fa]">
      {/* 라인1: Scope 탭 + 국가/도시 + 보기 전환 (모바일 한 줄) */}
      <div className="relative z-30 px-2 py-2.5 flex items-center justify-between gap-1 bg-white border-b border-slate-100/80 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-1 min-w-0">
          <SocialScopeTabs scope={scope} onChange={onScopeChange} language={language} />
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
            selected={effectiveCity}
            onSelect={onSelectCity}
            emptyLabel={emptyLabel}
          />
        </div>
        <ViewCycleButton mode={viewMode} onChange={onViewModeChange} />
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
        {groupedByCity ? (
          groupedByCity.length > 0 ? (
            <div className="space-y-6">
              {groupedByCity.map(group => (
                <div key={group.city}>
                  <h3 className="text-[13px] font-black text-slate-500 uppercase tracking-wide mb-3">
                    {group.city} ({group.socials.length})
                  </h3>
                  <div className="grid grid-cols-3 gap-x-2 gap-y-4">
                    {group.socials.map(s => (
                      <SocialCard
                        key={s.id}
                        social={s}
                        date={selectedDate}
                        venuesMap={venuesMap}
                        onPress={() => onOpenSocial(s.id)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 bg-white rounded-2xl border border-dashed border-slate-200">
              <span className="material-symbols-outlined !text-[32px] text-slate-300 mb-2">public_off</span>
              <p className="text-[13px] font-semibold text-slate-400">
                {language === 'KR' ? '선택한 날짜/국가에 열리는 Social이 없습니다.' : 'No socials on this date/country.'}
              </p>
            </div>
          )
        ) : (
          <>
            <h3 className="text-[13px] font-black text-slate-500 uppercase tracking-wide mb-3">
              {language === 'KR' ? '오늘 열리는 Social' : "Today's Socials"} {matchedSocials.length > 0 && `(${matchedSocials.length})`}
            </h3>
            {matchedSocials.length > 0 ? (
              <div className="grid grid-cols-3 gap-x-2 gap-y-4">
                {matchedSocials.map(s => (
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
          </>
        )}
      </div>
    </div>
  );
}
