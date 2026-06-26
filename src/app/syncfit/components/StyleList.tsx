'use client';

import React, { useState } from 'react';
import { Style, StyleStatus, STYLE_STATUS } from '../types';
import { mockVendors, mockFactories } from '../mockData';
import { useSyncFitLanguage } from '../SyncFitLanguageContext';

interface StyleListProps {
  styles: Style[];
  activeStyleId: string;
  onSelectStyle: (id: string) => void;
  unreadCounts: Record<string, number>;
  onAddStyleClick: () => void;
}

export default function StyleList({ 
  styles, 
  activeStyleId, 
  onSelectStyle,
  unreadCounts = {},
  onAddStyleClick
}: StyleListProps) {
  const { tx } = useSyncFitLanguage();
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedVendor, setSelectedVendor] = useState<string>('all');
  const [selectedFactory, setSelectedFactory] = useState<string>('all');

  // Filter Styles
  const filteredStyles = styles.filter(style => {
    const matchStatus = selectedStatus === 'all' || style.status === selectedStatus;
    const matchVendor = selectedVendor === 'all' || style.vendorId === selectedVendor;
    const matchFactory = selectedFactory === 'all' || style.factoryId === selectedFactory;
    return matchStatus && matchVendor && matchFactory;
  });

  const statusList = Object.entries(STYLE_STATUS);

  // 퀵 내비게이터 핸들러 (이전 / 다음 순환 탐색)
  const handlePrev = () => {
    if (filteredStyles.length === 0) return;
    const currentIndex = filteredStyles.findIndex(s => s.id === activeStyleId);
    if (currentIndex === -1) {
      onSelectStyle(filteredStyles[0].id);
    } else {
      const prevIndex = (currentIndex - 1 + filteredStyles.length) % filteredStyles.length;
      onSelectStyle(filteredStyles[prevIndex].id);
    }
  };

  const handleNext = () => {
    if (filteredStyles.length === 0) return;
    const currentIndex = filteredStyles.findIndex(s => s.id === activeStyleId);
    if (currentIndex === -1) {
      onSelectStyle(filteredStyles[0].id);
    } else {
      const nextIndex = (currentIndex + 1) % filteredStyles.length;
      onSelectStyle(filteredStyles[nextIndex].id);
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-white border-r border-slate-200">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-slate-100 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-[15px] font-black text-slate-900 tracking-tight">{tx('syncfit.title')}</h2>
          <button
            onClick={onAddStyleClick}
            className="h-8 px-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-black tracking-tight transition-all shadow-md hover:shadow-lg active:scale-95 flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-[13px] font-black">add</span>
            상품등록
          </button>
        </div>

        {/* Filter Accordions/Dropdowns */}
        <div className="flex flex-col gap-2.5">
          {/* Status Filter */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{tx('syncfit.filter.status')}</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full h-9 px-3 rounded-lg border border-slate-200 text-[13px] bg-slate-50/50 hover:bg-slate-50 focus:outline-none focus:border-blue-500 transition-colors cursor-pointer"
            >
              <option value="all">{tx('syncfit.filter.all')}</option>
              {statusList.map(([key, value]) => (
                <option key={value} value={value}>
                  {tx(`syncfit.status.${value}`)}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {/* Vendor Filter */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{tx('syncfit.filter.vendor')}</label>
              <select
                value={selectedVendor}
                onChange={(e) => setSelectedVendor(e.target.value)}
                className="w-full h-9 px-2 rounded-lg border border-slate-200 text-[12px] bg-slate-50/50 hover:bg-slate-50 focus:outline-none focus:border-blue-500 transition-colors cursor-pointer"
              >
                <option value="all">{tx('syncfit.filter.all')}</option>
                {mockVendors.map((vendor) => (
                  <option key={vendor.id} value={vendor.id}>
                    {vendor.name.split(' ').pop()}
                  </option>
                ))}
              </select>
            </div>

            {/* Factory Filter */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{tx('syncfit.filter.factory')}</label>
              <select
                value={selectedFactory}
                onChange={(e) => setSelectedFactory(e.target.value)}
                className="w-full h-9 px-2 rounded-lg border border-slate-200 text-[12px] bg-slate-50/50 hover:bg-slate-50 focus:outline-none focus:border-blue-500 transition-colors cursor-pointer"
              >
                <option value="all">{tx('syncfit.filter.all')}</option>
                {mockFactories.map((factory) => (
                  <option key={factory.id} value={factory.id}>
                    {factory.name.split(' ').pop()}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* 퀵 탐색 내비게이터 바 */}
      <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[11px] font-black text-slate-500 flex-shrink-0">
        <span>스타일 순차 탐색</span>
        <div className="flex gap-2">
          <button
            onClick={handlePrev}
            className="h-6 px-2 rounded bg-white border border-slate-200 hover:bg-slate-50 active:scale-95 transition-all flex items-center justify-center gap-0.5"
          >
            <span className="material-symbols-outlined text-[12px] font-black">chevron_left</span>
            이전
          </button>
          <button
            onClick={handleNext}
            className="h-6 px-2 rounded bg-white border border-slate-200 hover:bg-slate-50 active:scale-95 transition-all flex items-center justify-center gap-0.5"
          >
            다음
            <span className="material-symbols-outlined text-[12px] font-black">chevron_right</span>
          </button>
        </div>
      </div>

      {/* Style List Body */}
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
        {filteredStyles.length === 0 ? (
          <div className="py-8 text-center text-[13px] text-slate-400 font-medium">
            조건에 맞는 스타일이 없습니다.
          </div>
        ) : (
          filteredStyles.map((style) => {
            const isActive = style.id === activeStyleId;
            return (
              <button
                key={style.id}
                onClick={() => onSelectStyle(style.id)}
                className={`w-full p-3.5 rounded-xl border text-left transition-all ${
                  isActive
                    ? 'border-blue-500 bg-blue-50/20 shadow-sm'
                    : 'border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50/50'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-[14px] font-black text-slate-900 tracking-tight truncate">
                      {style.id}
                    </span>
                    {unreadCounts[style.id] > 0 && (
                      <span className="flex items-center justify-center min-w-[18px] h-[18px] px-1.5 rounded-full bg-red-500 text-white text-[9px] font-black shadow-sm flex-shrink-0">
                        {unreadCounts[style.id]}
                      </span>
                    )}
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide ${
                      style.status === STYLE_STATUS.COMPLETED
                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                        : style.status === STYLE_STATUS.PROD_ACTIVE || style.status === STYLE_STATUS.PROD_CONFIRM
                        ? 'bg-amber-50 text-amber-600 border border-amber-100'
                        : 'bg-blue-50 text-blue-600 border border-blue-100'
                    }`}
                  >
                    {tx(`syncfit.status.${style.status}`)}
                  </span>
                </div>
                <h3 className="text-[13px] font-bold text-slate-700 truncate mb-2">
                  {style.name}
                </h3>
                <div className="flex flex-col gap-0.5 text-[11px] text-slate-400 font-medium">
                  <div>
                    {tx('syncfit.filter.vendor')}: {mockVendors.find(v => v.id === style.vendorId)?.name.split(' ').pop() || style.vendorId}
                  </div>
                  <div>
                    {tx('syncfit.filter.factory')}: {mockFactories.find(f => f.id === style.factoryId)?.name.split(' ').pop() || style.factoryId}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
