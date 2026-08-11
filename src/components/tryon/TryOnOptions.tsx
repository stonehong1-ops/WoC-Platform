'use client';

import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

interface TryOnOptionsProps {
  options: {
    locationPreset: string;
    moodPreset: string;
    frameType: string;
    posePreset: string;
  };
  onOptionChange: (key: string, value: string) => void;
  isGenerating: boolean;
  canGenerate: boolean;
  onGenerate: () => void;
}

export default function TryOnOptions({
  options,
  onOptionChange,
  isGenerating,
  canGenerate,
  onGenerate,
}: TryOnOptionsProps) {
  const { t, language } = useLanguage();

  const selectClass = 'w-full bg-surface-container text-on-surface text-xs font-bold py-2.5 px-3 rounded-xl border border-surface-container-high outline-none focus:border-primary cursor-pointer';
  const labelClass = 'text-[10px] font-black text-outline uppercase tracking-wider';

  return (
    <div className="p-5 rounded-2xl bg-surface-container-lowest border border-surface-container">
      <h3 className="text-xs font-black text-outline uppercase tracking-widest mb-5 flex items-center gap-2">
        <span className="material-symbols-outlined text-[16px] text-primary">tune</span>
        {t('ai_tryon.options', 'Options')}
      </h3>

      <div className="space-y-5">
        {/* Location / Background */}
        <div className="space-y-2">
          <label className={labelClass}>
            {t('ai_tryon.location', 'Location / Background')}
          </label>
          <select
            value={options.locationPreset}
            onChange={(e) => onOptionChange('locationPreset', e.target.value)}
            className={selectClass}
          >
            <option value="studio">{language === 'KR' ? '스튜디오 (미니멀 배경)' : 'Studio (Minimal)'}</option>
            <option value="showroom">{language === 'KR' ? '실내 쇼룸' : 'Indoor Showroom'}</option>
            <option value="cafe">{language === 'KR' ? '카페 테라스' : 'Cafe Terrace'}</option>
            <option value="city_street">{language === 'KR' ? '도심 거리' : 'City Street'}</option>
            <option value="park">{language === 'KR' ? '공원 / 자연' : 'Park / Nature'}</option>
            <option value="restaurant">{language === 'KR' ? '레스토랑' : 'Restaurant'}</option>
            <option value="hotel_lobby">{language === 'KR' ? '호텔 로비' : 'Hotel Lobby'}</option>
            <option value="resort">{language === 'KR' ? '리조트 / 해변' : 'Resort / Beach'}</option>
            <option value="home">{language === 'KR' ? '홈 라이프스타일' : 'Home Lifestyle'}</option>
          </select>
        </div>

        {/* Mood */}
        <div className="space-y-2">
          <label className={labelClass}>
            {t('ai_tryon.mood', 'Style Mood')}
          </label>
          <select
            value={options.moodPreset}
            onChange={(e) => onOptionChange('moodPreset', e.target.value)}
            className={selectClass}
          >
            <option value="minimal">{language === 'KR' ? '미니멀' : 'Minimal'}</option>
            <option value="luxury">{language === 'KR' ? '럭셔리' : 'Luxury'}</option>
            <option value="daily">{language === 'KR' ? '데일리 캐주얼' : 'Daily Casual'}</option>
            <option value="emotional">{language === 'KR' ? '필름 감성' : 'Film Emotional'}</option>
            <option value="premium">{language === 'KR' ? '프리미엄 룩북' : 'Premium Lookbook'}</option>
            <option value="street">{language === 'KR' ? '스트리트' : 'Street'}</option>
            <option value="feminine">{language === 'KR' ? '페미닌' : 'Feminine'}</option>
            <option value="casual">{language === 'KR' ? '캐주얼 스포티' : 'Casual Sporty'}</option>
            <option value="elegant">{language === 'KR' ? '우아한 클래식' : 'Elegant Classic'}</option>
          </select>
        </div>

        {/* Frame */}
        <div className="space-y-2">
          <label className={labelClass}>
            {t('ai_tryon.frame', 'Angle')}
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { key: 'full_body', labelKr: '전신', labelEn: 'Full' },
              { key: 'three_quarter', labelKr: '7부신', labelEn: '3/4' },
              { key: 'upper_body', labelKr: '상반신', labelEn: 'Upper' },
            ].map(({ key, labelKr, labelEn }) => (
              <button
                key={key}
                type="button"
                onClick={() => onOptionChange('frameType', key)}
                className={`py-2 rounded-xl text-[11px] font-bold border transition-all ${
                  options.frameType === key
                    ? 'bg-primary border-primary text-white shadow-sm'
                    : 'bg-surface-container border-surface-container-high text-on-surface-variant hover:border-primary/30'
                }`}
              >
                {language === 'KR' ? labelKr : labelEn}
              </button>
            ))}
          </div>
        </div>

        {/* Pose */}
        <div className="space-y-2">
          <label className={labelClass}>
            {t('ai_tryon.pose', 'Pose')}
          </label>
          <select
            value={options.posePreset}
            onChange={(e) => onOptionChange('posePreset', e.target.value)}
            className={selectClass}
          >
            <option value="front_standing">{language === 'KR' ? '정면 스탠딩' : 'Front Standing'}</option>
            <option value="slight_side">{language === 'KR' ? '살짝 측면' : 'Slight Side'}</option>
            <option value="walking">{language === 'KR' ? '걷기' : 'Walking'}</option>
            <option value="natural">{language === 'KR' ? '자연스러운' : 'Natural'}</option>
            <option value="sitting">{language === 'KR' ? '앉은 포즈' : 'Sitting'}</option>
          </select>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="mt-5 p-3 bg-amber-50 border border-amber-200/50 rounded-xl flex items-start gap-2">
        <span className="material-symbols-outlined text-[13px] text-amber-600 shrink-0 mt-0.5">info</span>
        <p className="text-[9px] text-amber-800 font-bold leading-normal">
          {t('ai_tryon.disclaimer', 'AI reference image. May differ from actual appearance.')}
        </p>
      </div>

      {/* Generate Button */}
      <button
        type="button"
        disabled={!canGenerate}
        onClick={onGenerate}
        className="w-full mt-4 bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-500 text-white disabled:bg-surface-container disabled:from-surface-container disabled:to-surface-container disabled:text-outline py-3.5 rounded-xl text-[12px] font-black shadow-lg shadow-primary/10 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:pointer-events-none disabled:shadow-none"
      >
        {isGenerating ? (
          <>
            <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span>{t('ai_tryon.generating', 'Generating...')}</span>
          </>
        ) : (
          <>
            <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
            <span>{t('ai_tryon.generate', 'Generate Try-On')}</span>
          </>
        )}
      </button>
    </div>
  );
}
