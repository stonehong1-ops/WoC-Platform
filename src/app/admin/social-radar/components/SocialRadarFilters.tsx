import React from 'react';
import { SocialRadarCandidate } from '../types';

export type RadarFilterType = 'all' | 'changes' | 'new_candidate' | 'hold' | 'ignored' | 'sent';
export type RadarSortType = 'latest' | 'confidence';

interface SocialRadarFiltersProps {
  activeFilter: RadarFilterType;
  onChangeFilter: (filter: RadarFilterType) => void;
  activeSort: RadarSortType;
  onChangeSort: (sort: RadarSortType) => void;
  counts: Record<RadarFilterType, number>;
}

export default function SocialRadarFilters({
  activeFilter,
  onChangeFilter,
  activeSort,
  onChangeSort,
  counts
}: SocialRadarFiltersProps) {
  const FILTERS: { id: RadarFilterType; label: string; icon: string }[] = [
    { id: 'all', label: '전체', icon: 'list' },
    { id: 'changes', label: '변경 감지', icon: 'difference' },
    { id: 'new_candidate', label: '신규 후보', icon: 'fiber_new' },
    { id: 'hold', label: '보류', icon: 'pause_circle' },
    { id: 'ignored', label: '무시', icon: 'cancel' },
    { id: 'sent', label: '토스 완료', icon: 'check_circle' },
  ];

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/20 shadow-sm">
      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map(f => {
          const isActive = activeFilter === f.id;
          const count = counts[f.id] || 0;
          return (
            <button
              key={f.id}
              onClick={() => onChangeFilter(f.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
                isActive
                  ? 'bg-primary text-on-primary border-primary shadow-sm'
                  : 'bg-white text-outline border-outline-variant/40 hover:text-on-surface hover:bg-surface-container-low/40'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">{f.icon}</span>
              {f.label}
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${isActive ? 'bg-on-primary/25 text-on-primary' : 'bg-surface-container text-outline font-black'}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Sort Options */}
      <div className="flex items-center gap-2 self-end sm:self-auto">
        <span className="text-[11px] font-bold text-outline uppercase tracking-wider">정렬</span>
        <div className="flex bg-surface-container-low p-1 rounded-xl border border-outline-variant/20">
          <button
            onClick={() => onChangeSort('latest')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeSort === 'latest'
                ? 'bg-white text-on-surface shadow-sm'
                : 'text-outline hover:text-on-surface'
            }`}
          >
            최신순
          </button>
          <button
            onClick={() => onChangeSort('confidence')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeSort === 'confidence'
                ? 'bg-white text-on-surface shadow-sm'
                : 'text-outline hover:text-on-surface'
            }`}
          >
            신뢰도순
          </button>
        </div>
      </div>
    </div>
  );
}
