"use client";

import React, { useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

interface MapSelectorBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  locationName: string;
}

export type MapType = 'naver' | 'kakao' | 'google';

export const MapSelectorBottomSheet: React.FC<MapSelectorBottomSheetProps> = ({
  isOpen,
  onClose,
  locationName
}) => {
  const { t } = useLanguage();

  const getMapLink = (type: MapType, name: string) => {
    const encoded = encodeURIComponent(name);
    switch (type) {
      case 'naver':
        return `https://map.naver.com/v5/search/${encoded}`;
      case 'kakao':
        return `https://map.kakao.com/?q=${encoded}`;
      case 'google':
        return `https://www.google.com/maps/search/?api=1&query=${encoded}`;
      default:
        return `https://www.google.com/maps/search/?api=1&query=${encoded}`;
    }
  };

  const handleSelectMap = (type: MapType) => {
    localStorage.setItem('woc_preferred_map', type);
    const link = getMapLink(type, locationName);
    window.open(link, '_blank');
    onClose();
  };

  useEffect(() => {
    if (!isOpen || !locationName) return;

    // 로컬 스토리지에 캐싱된 선호 지도가 있다면 선택 시트를 띄우지 않고 논스톱 즉시 바로 열림 실행
    const cachedMap = localStorage.getItem('woc_preferred_map') as MapType | null;
    if (cachedMap) {
      const link = getMapLink(cachedMap, locationName);
      window.open(link, '_blank');
      onClose();
    }
  }, [isOpen, locationName, onClose]);

  useEffect(() => {
    if (!isOpen) return;

    const cachedMap = localStorage.getItem('woc_preferred_map');
    if (cachedMap) return;

    const stateKey = `map_selector_${Date.now()}`;
    window.history.pushState({ stateKey }, '');

    const handlePopState = () => {
      onClose();
    };
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      if (window.history.state?.stateKey === stateKey) {
        window.history.back();
      }
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // 로컬 스토리지에 캐싱된 값이 있는 경우에는 렌더링을 건너뜀 (이미 딜레이 없이 실행된 상태)
  const hasCache = typeof window !== 'undefined' && !!localStorage.getItem('woc_preferred_map');
  if (hasCache) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[250] flex items-end justify-center p-0 animate-in fade-in duration-200" onClick={onClose}>
      <div 
        className="bg-white rounded-t-[32px] w-full max-w-[600px] p-6 shadow-2xl border-t border-slate-100 flex flex-col items-center animate-in slide-in-from-bottom duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle Bar */}
        <div className="w-12 h-1.5 bg-slate-200 rounded-full mb-6"></div>

        {/* Title */}
        <div className="w-full text-center mb-6">
          <span className="material-symbols-outlined text-[36px] text-[#0057bd] mb-2 animate-bounce">
            location_on
          </span>
          <h3 className="text-[18px] font-black text-gray-900 leading-tight">
            {locationName}
          </h3>
          <p className="text-[13px] text-gray-400 font-medium mt-1 leading-relaxed">
            {t('map.select_guide') || '길찾기에 연결할 선호 지도를 하나 선택해 주세요.'}
          </p>
          <p className="text-[11px] text-red-500 font-bold mt-1.5 leading-relaxed bg-red-50 px-3 py-1 rounded-full inline-block">
            {t('map.cache_guide') || '선택하신 지도는 로컬에 저장되어 다음 터치 시 무조건 즉시 바로 열립니다.'}
          </p>
        </div>

        {/* Map App List */}
        <div className="w-full flex flex-col gap-3.5 mb-6">
          {/* Naver Map (Default in Korea) */}
          <button
            onClick={() => handleSelectMap('naver')}
            className="w-full flex items-center justify-between p-4.5 bg-emerald-50/50 hover:bg-emerald-50 active:scale-[0.99] border border-emerald-100/50 rounded-2xl transition-all"
          >
            <div className="flex items-center gap-4.5">
              <div className="w-11 h-11 bg-emerald-500 rounded-xl flex items-center justify-center font-extrabold text-white text-[16px] shadow-sm">
                N
              </div>
              <div className="text-left">
                <p className="text-[14px] font-black text-slate-800">
                  {t('map.naver') || '네이버 지도'}
                </p>
                <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">
                  {t('map.naver_desc') || '국내 최우선 디폴트'}
                </p>
              </div>
            </div>
            <span className="material-symbols-outlined text-emerald-500 text-[20px]">
              chevron_right
            </span>
          </button>

          {/* Kakao Map */}
          <button
            onClick={() => handleSelectMap('kakao')}
            className="w-full flex items-center justify-between p-4.5 bg-yellow-50/40 hover:bg-yellow-50 active:scale-[0.99] border border-yellow-100/40 rounded-2xl transition-all"
          >
            <div className="flex items-center gap-4.5">
              <div className="w-11 h-11 bg-yellow-400 rounded-xl flex items-center justify-center font-black text-slate-800 text-[15px] shadow-sm">
                K
              </div>
              <div className="text-left">
                <p className="text-[14px] font-black text-slate-800">
                  {t('map.kakao') || '카카오맵'}
                </p>
                <p className="text-[11px] text-yellow-600 font-semibold mt-0.5">
                  {t('map.kakao_desc') || '빠르고 쾌적한 이동 안내'}
                </p>
              </div>
            </div>
            <span className="material-symbols-outlined text-yellow-500 text-[20px]">
              chevron_right
            </span>
          </button>

          {/* Google Map */}
          <button
            onClick={() => handleSelectMap('google')}
            className="w-full flex items-center justify-between p-4.5 bg-blue-50/40 hover:bg-blue-50 active:scale-[0.99] border border-blue-100/40 rounded-2xl transition-all"
          >
            <div className="flex items-center gap-4.5">
              <div className="w-11 h-11 bg-blue-500 rounded-xl flex items-center justify-center font-black text-white text-[15px] shadow-sm">
                G
              </div>
              <div className="text-left">
                <p className="text-[14px] font-black text-slate-800">
                  {t('map.google') || '구글 지도'}
                </p>
                <p className="text-[11px] text-blue-600 font-semibold mt-0.5">
                  {t('map.google_desc') || '글로벌 여행 및 광범위 지원'}
                </p>
              </div>
            </div>
            <span className="material-symbols-outlined text-blue-500 text-[20px]">
              chevron_right
            </span>
          </button>
        </div>

        {/* Cancel Button */}
        <button
          onClick={onClose}
          className="w-full py-4 bg-slate-50 border border-slate-100 text-slate-500 font-bold rounded-2xl text-[13px] hover:bg-slate-100 transition-colors"
        >
          {t('common.close') || '닫기'}
        </button>
      </div>
    </div>
  );
};
