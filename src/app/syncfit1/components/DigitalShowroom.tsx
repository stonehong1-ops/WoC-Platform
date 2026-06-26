'use client';

import React, { useState } from 'react';
import { Style } from '../types';
import { useSyncFitLanguage } from '../SyncFitLanguageContext';

interface DigitalShowroomProps {
  style: Style;
  userRole: string; // 'admin' | 'designer' | 'factory_staff' | 'vendor_staff'
  onConfirmProduction: () => void;
}

export default function DigitalShowroom({ style, userRole, onConfirmProduction }: DigitalShowroomProps) {
  const { tx } = useSyncFitLanguage();
  const [activeCompareTab, setActiveCompareTab] = useState<'color' | 'fabric' | 'version'>('color');

  // Sub states for comparing
  const [selectedColor, setSelectedColor] = useState<'black' | 'white' | 'gray'>('black');
  const [selectedFabric, setSelectedFabric] = useState<'A' | 'B'>('A');
  const [selectedVersion, setSelectedVersion] = useState<'V1' | 'V2'>('V1');

  // Sample Images mapping for visual wow factor
  const sampleImages = {
    color: {
      black: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&q=80&w=400",
      white: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&q=80&w=400",
      gray: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&q=80&w=400"
    },
    fabric: {
      A: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&q=80&w=400", // 헤비 코튼 질감
      B: "https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?auto=format&fit=crop&q=80&w=400"  // 나일론 바스락 질감
    },
    version: {
      V1: "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?auto=format&fit=crop&q=80&w=400", // 초기 실루엣
      V2: "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&q=80&w=400"  // 디테일 수정 실루엣
    }
  };

  const getActiveImage = () => {
    if (activeCompareTab === 'color') return sampleImages.color[selectedColor];
    if (activeCompareTab === 'fabric') return sampleImages.fabric[selectedFabric];
    return sampleImages.version[selectedVersion];
  };

  const isAuthorized = userRole === 'admin' || userRole === 'designer';

  return (
    <div className="flex flex-col gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200 shadow-inner">
      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
        <h4 className="text-[13px] font-black text-slate-800 flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[17px] text-blue-600">view_in_ar</span>
          {tx('syncfit.showroom.title')}
        </h4>

        {/* 탭 전환 */}
        <div className="flex gap-1 bg-slate-205 p-0.5 rounded-lg">
          {(['color', 'fabric', 'version'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveCompareTab(tab)}
              className={`px-2.5 py-1 rounded-md text-[10px] font-black transition-all ${
                activeCompareTab === tab
                  ? 'bg-white text-slate-800 shadow-xs'
                  : 'text-slate-500 hover:text-slate-750'
              }`}
            >
              {tx(`syncfit.showroom.${tab}`)}
            </button>
          ))}
        </div>
      </div>

      {/* 비교 시뮬레이터 인터랙티브 뷰어 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left: Image Render */}
        <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-slate-200 border border-slate-200 shadow-sm group">
          <img
            src={getActiveImage()}
            alt="Virtual Showroom Silhouette"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-md text-white text-[9px] font-black px-2 py-0.5 rounded-md tracking-wider">
            VIRTUAL RENDER
          </div>
        </div>

        {/* Right: Controls & Info */}
        <div className="flex flex-col justify-between gap-3">
          <div className="flex flex-col gap-3">
            {/* Control buttons based on active tab */}
            {activeCompareTab === 'color' && (
              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] font-bold text-slate-400">색상 선택</span>
                <div className="flex gap-2">
                  {(['black', 'white', 'gray'] as const).map((col) => (
                    <button
                      key={col}
                      onClick={() => setSelectedColor(col)}
                      className={`h-8 px-3 rounded-lg border text-[11px] font-black transition-all ${
                        selectedColor === col
                          ? 'border-blue-500 bg-blue-50 text-blue-600 font-bold'
                          : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-605'
                      }`}
                    >
                      {col.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {activeCompareTab === 'fabric' && (
              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] font-bold text-slate-400">원단 핏감 비교 (A vs B)</span>
                <div className="flex gap-2">
                  {(['A', 'B'] as const).map((fab) => (
                    <button
                      key={fab}
                      onClick={() => setSelectedFabric(fab)}
                      className={`h-8 px-4 rounded-lg border text-[11px] font-black transition-all ${
                        selectedFabric === fab
                          ? 'border-blue-500 bg-blue-50 text-blue-600'
                          : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600'
                      }`}
                    >
                      원단 {fab} 핏
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-slate-400 leading-relaxed font-medium">
                  {selectedFabric === 'A'
                    ? '원단 A: 뻣뻣하고 도톰한 중량감 있는 프렌치 테리 원사로 벌키한 오버핏이 잘 표현됩니다.'
                    : '원단 B: 바스락거리는 크링클 나일론 원단으로 가볍고 주름이 잘 가지 않으며 실용성이 돋보입니다.'}
                </p>
              </div>
            )}

            {activeCompareTab === 'version' && (
              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] font-bold text-slate-400">샘플 버전 비교</span>
                <div className="flex gap-2">
                  {(['V1', 'V2'] as const).map((ver) => (
                    <button
                      key={ver}
                      onClick={() => setSelectedVersion(ver)}
                      className={`h-8 px-4 rounded-lg border text-[11px] font-black transition-all ${
                        selectedVersion === ver
                          ? 'border-blue-500 bg-blue-50 text-blue-600'
                          : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600'
                      }`}
                    >
                      샘플 {ver}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-slate-400 leading-relaxed font-medium">
                  {selectedVersion === 'V1'
                    ? 'V1 샘플: 초기 디자인 드로잉에 입각한 1차 샘플로, 시보리 길이와 후드 각도 조절이 필요합니다.'
                    : 'V2 샘플: 2차 샘플로, 피드백을 반영해 소매 암홀 둘레를 넓히고 메탈 투웨이 지퍼 디테일을 보강했습니다.'}
                </p>
              </div>
            )}

            {/* 모델 코멘트 에어리어 */}
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-bold text-slate-400">착장 피드백 코멘트</span>
              <div className="bg-white p-2.5 rounded-lg border border-slate-200 text-[11px] text-slate-500 font-medium leading-relaxed">
                📢 "키 178cm 모델 착장 시 힙을 덮는 기장이며, 품에 비해 밑단 시보리가 타이트하지 않아 실루엣이 내추럴하게 떨어집니다."
              </div>
            </div>
          </div>

          {/* 최종 1차 생산 승인 버튼 (권한 분기) */}
          <div>
            <button
              onClick={onConfirmProduction}
              disabled={!isAuthorized}
              className={`w-full h-10 rounded-xl text-[12px] font-black flex items-center justify-center gap-1.5 transition-all ${
                isAuthorized
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md active:scale-95 cursor-pointer'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">verified</span>
              {tx('syncfit.common.confirm')}
            </button>
            {!isAuthorized && (
              <p className="text-[9px] text-red-500 text-center mt-1 font-bold">
                ⚠️ 승인 권한은 사장님(admin) 및 담당 디자이너(designer) 계정만 보유하고 있습니다.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
