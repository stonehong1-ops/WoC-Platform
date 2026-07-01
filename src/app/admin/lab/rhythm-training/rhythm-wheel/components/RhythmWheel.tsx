import React, { useMemo } from "react";
import { RhythmPattern } from "../types";

interface RhythmWheelProps {
  patterns: RhythmPattern[];
  selectedPattern: RhythmPattern;
  onSelectPattern: (pattern: RhythmPattern) => void;
  isPlaying: boolean;
  activeSubIndex: number;
  pulseTrigger: boolean;
  isAccentTick: boolean;
}

// 12가지 리듬 패턴에 상응하는 정교한 악보 음표/쉼표 SVG 아이콘 컴포넌트
function RhythmNoteIcon({ patternId, isSelected }: { patternId: string; isSelected: boolean }) {
  const strokeColor = isSelected ? "#FFFFFF" : "#334155";
  const fillColor = isSelected ? "#FFFFFF" : "#334155";

  switch (patternId) {
    case "1": // 사분음표 (♩)
      return (
        <svg width="34" height="22" viewBox="0 0 44 28" fill="none">
          <ellipse cx="16" cy="20" rx="4.5" ry="3" transform="rotate(-15 16 20)" fill={fillColor} />
          <line x1="20" y1="20" x2="20" y2="4" stroke={strokeColor} strokeWidth="1.5" />
        </svg>
      );
    case "1-and": // 팔분음표 2개 꼬리 묶음
      return (
        <svg width="34" height="22" viewBox="0 0 44 28" fill="none">
          <ellipse cx="14" cy="20" rx="4.5" ry="3" transform="rotate(-15 14 20)" fill={fillColor} />
          <ellipse cx="30" cy="18" rx="4.5" ry="3" transform="rotate(-15 30 18)" fill={fillColor} />
          <line x1="18" y1="20" x2="18" y2="4" stroke={strokeColor} strokeWidth="1.5" />
          <line x1="34" y1="18" x2="34" y2="2.5" stroke={strokeColor} strokeWidth="1.5" />
          <line x1="18" y1="4.5" x2="34.5" y2="3" stroke={strokeColor} strokeWidth="2.5" />
        </svg>
      );
    case "1-and-a": // 8분음표 + 16분음표 2개 꼬리 묶음
      return (
        <svg width="34" height="22" viewBox="0 0 44 28" fill="none">
          <ellipse cx="10" cy="21" rx="3.5" ry="2.2" transform="rotate(-15 10 21)" fill={fillColor} />
          <ellipse cx="22" cy="20" rx="3.5" ry="2.2" transform="rotate(-15 22 20)" fill={fillColor} />
          <ellipse cx="34" cy="19" rx="3.5" ry="2.2" transform="rotate(-15 34 19)" fill={fillColor} />
          <line x1="13" y1="21" x2="13" y2="4" stroke={strokeColor} strokeWidth="1.5" />
          <line x1="25" y1="20" x2="25" y2="3.5" stroke={strokeColor} strokeWidth="1.5" />
          <line x1="37" y1="19" x2="37" y2="3" stroke={strokeColor} strokeWidth="1.5" />
          {/* 상단 1차 연결 보선 */}
          <line x1="13" y1="4.5" x2="37.5" y2="3.5" stroke={strokeColor} strokeWidth="2.2" />
          {/* 16분 2차 보선 (2~3번째 음표 사이) */}
          <line x1="25" y1="7.5" x2="37.5" y2="7.0" stroke={strokeColor} strokeWidth="1.8" />
        </svg>
      );
    case "1e-and": // 16분음표 2개 + 8분음표 1개 꼬리 묶음
      return (
        <svg width="34" height="22" viewBox="0 0 44 28" fill="none">
          <ellipse cx="10" cy="21" rx="3.5" ry="2.2" transform="rotate(-15 10 21)" fill={fillColor} />
          <ellipse cx="22" cy="20" rx="3.5" ry="2.2" transform="rotate(-15 22 20)" fill={fillColor} />
          <ellipse cx="34" cy="19" rx="3.5" ry="2.2" transform="rotate(-15 34 19)" fill={fillColor} />
          <line x1="13" y1="21" x2="13" y2="4" stroke={strokeColor} strokeWidth="1.5" />
          <line x1="25" y1="20" x2="25" y2="3.5" stroke={strokeColor} strokeWidth="1.5" />
          <line x1="37" y1="19" x2="37" y2="3" stroke={strokeColor} strokeWidth="1.5" />
          {/* 상단 1차 연결 보선 */}
          <line x1="13" y1="4.5" x2="37.5" y2="3.5" stroke={strokeColor} strokeWidth="2.2" />
          {/* 16분 2차 보선 (1~2번째 음표 사이) */}
          <line x1="13" y1="7.5" x2="25.5" y2="7.0" stroke={strokeColor} strokeWidth="1.8" />
        </svg>
      );
    case "1e-and-a": // 16분음표 4개 이중 보선 묶음
      return (
        <svg width="34" height="22" viewBox="0 0 44 28" fill="none">
          <ellipse cx="8" cy="21" rx="3" ry="1.8" transform="rotate(-15 8 21)" fill={fillColor} />
          <ellipse cx="17" cy="20.5" rx="3" ry="1.8" transform="rotate(-15 17 20.5)" fill={fillColor} />
          <ellipse cx="26" cy="20" rx="3" ry="1.8" transform="rotate(-15 26 20)" fill={fillColor} />
          <ellipse cx="35" cy="19.5" rx="3" ry="1.8" transform="rotate(-15 35 19.5)" fill={fillColor} />
          <line x1="11" y1="21" x2="11" y2="4" stroke={strokeColor} strokeWidth="1.2" />
          <line x1="20" y1="20.5" x2="20" y2="3.5" stroke={strokeColor} strokeWidth="1.2" />
          <line x1="29" y1="20" x2="29" y2="3.2" stroke={strokeColor} strokeWidth="1.2" />
          <line x1="38" y1="19.5" x2="38" y2="3.0" stroke={strokeColor} strokeWidth="1.2" />
          {/* 상단 이중 보선 */}
          <line x1="11" y1="4.2" x2="38.5" y2="3.2" stroke={strokeColor} strokeWidth="2.2" />
          <line x1="11" y1="7.5" x2="38.5" y2="6.5" stroke={strokeColor} strokeWidth="2.2" />
        </svg>
      );
    case "and-a": // 8분쉼표 + 16분음표 2개
      return (
        <svg width="34" height="22" viewBox="0 0 44 28" fill="none">
          {/* 8분 쉼표 기호 */}
          <circle cx="8" cy="10" r="1.5" fill={fillColor} />
          <path d="M8 10.5 C10 12, 11 15, 8 18" stroke={strokeColor} strokeWidth="1.5" fill="none" />
          <line x1="9" y1="10" x2="6" y2="16" stroke={strokeColor} strokeWidth="1.5" />
          {/* 뒤쪽 16분음표 2개 */}
          <ellipse cx="22" cy="21" rx="3.5" ry="2.2" transform="rotate(-15 22 21)" fill={fillColor} />
          <ellipse cx="34" cy="20" rx="3.5" ry="2.2" transform="rotate(-15 34 20)" fill={fillColor} />
          <line x1="25" y1="21" x2="25" y2="4" stroke={strokeColor} strokeWidth="1.5" />
          <line x1="37" y1="20" x2="37" y2="3.5" stroke={strokeColor} strokeWidth="1.5" />
          {/* 1차, 2차 꼬리 묶음 */}
          <line x1="25" y1="4.5" x2="37.5" y2="4.0" stroke={strokeColor} strokeWidth="2.2" />
          <line x1="25" y1="7.5" x2="37.5" y2="7.0" stroke={strokeColor} strokeWidth="1.8" />
        </svg>
      );
    case "e-and": // 16분쉼표 + 16분음표 + 8분음표
      return (
        <svg width="34" height="22" viewBox="0 0 44 28" fill="none">
          {/* 16분 쉼표 (머리 두개 돌기) */}
          <circle cx="6" cy="8" r="1.2" fill={fillColor} />
          <circle cx="4" cy="13" r="1.2" fill={fillColor} />
          <path d="M6 8.5 C8 10, 9 12, 7 15 M4 13.5 C6 15, 7 17, 5 19" stroke={strokeColor} strokeWidth="1.2" fill="none" />
          <line x1="6.5" y1="8" x2="3" y2="18" stroke={strokeColor} strokeWidth="1.2" />
          {/* 16분음표 + 8분음표 */}
          <ellipse cx="20" cy="21" rx="3.5" ry="2.2" transform="rotate(-15 20 21)" fill={fillColor} />
          <ellipse cx="32" cy="20" rx="3.5" ry="2.2" transform="rotate(-15 32 20)" fill={fillColor} />
          <line x1="23" y1="21" x2="23" y2="4" stroke={strokeColor} strokeWidth="1.5" />
          <line x1="35" y1="20" x2="35" y2="3.5" stroke={strokeColor} strokeWidth="1.5" />
          <line x1="23" y1="4.5" x2="35.5" y2="4.0" stroke={strokeColor} strokeWidth="2.2" />
          <line x1="23" y1="7.5" x2="29" y2="7.3" stroke={strokeColor} strokeWidth="1.8" />
        </svg>
      );
    case "e-and-a": // 16분쉼표 + 16분음표 3개
      return (
        <svg width="34" height="22" viewBox="0 0 44 28" fill="none">
          {/* 16분 쉼표 */}
          <circle cx="5" cy="8" r="1.2" fill={fillColor} />
          <circle cx="3" cy="13" r="1.2" fill={fillColor} />
          <path d="M5 8.5 C7 10, 8 12, 6 15 M3 13.5 C5 15, 6 17, 4 19" stroke={strokeColor} strokeWidth="1.2" fill="none" />
          <line x1="5.5" y1="8" x2="2" y2="18" stroke={strokeColor} strokeWidth="1.2" />
          {/* 16분음표 3개 */}
          <ellipse cx="18" cy="21" rx="3.2" ry="2" transform="rotate(-15 18 21)" fill={fillColor} />
          <ellipse cx="28" cy="20" rx="3.2" ry="2" transform="rotate(-15 28 20)" fill={fillColor} />
          <ellipse cx="38" cy="19" rx="3.2" ry="2" transform="rotate(-15 38 19)" fill={fillColor} />
          <line x1="21" y1="21" x2="21" y2="4" stroke={strokeColor} strokeWidth="1.3" />
          <line x1="31" y1="20" x2="31" y2="3.5" stroke={strokeColor} strokeWidth="1.3" />
          <line x1="41" y1="19" x2="41" y2="3.0" stroke={strokeColor} strokeWidth="1.3" />
          <line x1="21" y1="4.2" x2="41.5" y2="3.2" stroke={strokeColor} strokeWidth="2.2" />
          <line x1="21" y1="7.5" x2="41.5" y2="6.5" stroke={strokeColor} strokeWidth="1.8" />
        </svg>
      );
    case "1-a": // 부점음표: 점8분음표 + 16분음표 (1 . a)
      return (
        <svg width="34" height="22" viewBox="0 0 44 28" fill="none">
          <ellipse cx="12" cy="20" rx="4.5" ry="3" transform="rotate(-15 12 20)" fill={fillColor} />
          {/* 점(Dot) */}
          <circle cx="19.5" cy="20" r="1.5" fill={fillColor} />
          <ellipse cx="32" cy="18" rx="4" ry="2.5" transform="rotate(-15 32 18)" fill={fillColor} />
          <line x1="16" y1="20" x2="16" y2="4" stroke={strokeColor} strokeWidth="1.5" />
          <line x1="36" y1="18" x2="36" y2="2.5" stroke={strokeColor} strokeWidth="1.5" />
          {/* 상단 메인보선 */}
          <line x1="16" y1="4.5" x2="36.5" y2="3.0" stroke={strokeColor} strokeWidth="2.2" />
          {/* 16분음표 세부보선 (오른쪽에만 짧게 걸침) */}
          <line x1="31" y1="6.8" x2="36.5" y2="6.0" stroke={strokeColor} strokeWidth="1.8" />
        </svg>
      );
    case "1-e": // 16분음표 + 점8분쉼표
      return (
        <svg width="34" height="22" viewBox="0 0 44 28" fill="none">
          {/* 16분음표 2개 슬롯에서 첫번째만 연주(1e 정렬에 가깝지만 e에 쉼표) */}
          <ellipse cx="10" cy="21" rx="3.5" ry="2.2" transform="rotate(-15 10 21)" fill={fillColor} />
          <line x1="13" y1="21" x2="13" y2="4" stroke={strokeColor} strokeWidth="1.5" />
          <line x1="13" y1="4.5" x2="25" y2="4.0" stroke={strokeColor} strokeWidth="2.2" />
          <line x1="13" y1="7.5" x2="25" y2="7.0" stroke={strokeColor} strokeWidth="1.8" />
          {/* 점 8분 쉼표 */}
          <circle cx="28" cy="12" r="1.5" fill={fillColor} />
          <path d="M28 12.5 C30 14, 31 17, 28 20" stroke={strokeColor} strokeWidth="1.5" fill="none" />
          <line x1="29" y1="12" x2="26" y2="18" stroke={strokeColor} strokeWidth="1.5" />
          <circle cx="33" cy="18" r="1.2" fill={fillColor} />
        </svg>
      );
    case "1e-a": // 16분음표 2개 + 16분쉼표 + 16분음표
      return (
        <svg width="34" height="22" viewBox="0 0 44 28" fill="none">
          <ellipse cx="8" cy="21" rx="3" ry="1.8" transform="rotate(-15 8 21)" fill={fillColor} />
          <ellipse cx="17" cy="20.5" rx="3" ry="1.8" transform="rotate(-15 17 20.5)" fill={fillColor} />
          <line x1="11" y1="21" x2="11" y2="4" stroke={strokeColor} strokeWidth="1.2" />
          <line x1="20" y1="20.5" x2="20" y2="3.5" stroke={strokeColor} strokeWidth="1.2" />
          {/* 중간 16분 쉼표 */}
          <circle cx="27" cy="10" r="0.8" fill={fillColor} />
          <circle cx="25.5" cy="14" r="0.8" fill={fillColor} />
          <path d="M27 10.5 C28.5 11.5, 29 13, 27.5 15" stroke={strokeColor} strokeWidth="1.0" fill="none" />
          {/* 마지막 16분음표 */}
          <ellipse cx="35" cy="19.5" rx="3" ry="1.8" transform="rotate(-15 35 19.5)" fill={fillColor} />
          <line x1="38" y1="19.5" x2="38" y2="3.0" stroke={strokeColor} strokeWidth="1.2" />
          <line x1="11" y1="4.2" x2="38.5" y2="3.2" stroke={strokeColor} strokeWidth="2.2" />
          <line x1="11" y1="7.5" x2="20.5" y2="7.0" stroke={strokeColor} strokeWidth="1.8" />
          <line x1="33" y1="7.0" x2="38.5" y2="6.8" stroke={strokeColor} strokeWidth="1.8" />
        </svg>
      );
    case "1-t-t": // 셋잇단음표 (Triplet)
      return (
        <svg width="34" height="22" viewBox="0 0 44 28" fill="none">
          <ellipse cx="10" cy="21" rx="3.5" ry="2.2" transform="rotate(-15 10 21)" fill={fillColor} />
          <ellipse cx="22" cy="20" rx="3.5" ry="2.2" transform="rotate(-15 22 20)" fill={fillColor} />
          <ellipse cx="34" cy="19" rx="3.5" ry="2.2" transform="rotate(-15 34 19)" fill={fillColor} />
          <line x1="13" y1="21" x2="13" y2="5" stroke={strokeColor} strokeWidth="1.5" />
          <line x1="25" y1="20" x2="25" y2="4.5" stroke={strokeColor} strokeWidth="1.5" />
          <line x1="37" y1="19" x2="37" y2="4.0" stroke={strokeColor} strokeWidth="1.5" />
          {/* 3연음 1중 보선 */}
          <line x1="13" y1="5.5" x2="37.5" y2="4.5" stroke={strokeColor} strokeWidth="2.2" />
          {/* 위에 숫자 3 표기 */}
          <text x="22" y="14" fontSize="8" fontWeight="black" fill={fillColor} textAnchor="middle">3</text>
        </svg>
      );
    default:
      return null;
  }
}

export default function RhythmWheel({
  patterns,
  selectedPattern,
  onSelectPattern,
  isPlaying,
  activeSubIndex,
  pulseTrigger,
  isAccentTick,
}: RhythmWheelProps) {
  const selectedIndex = useMemo(() => {
    return patterns.findIndex((p) => p.id === selectedPattern.id);
  }, [patterns, selectedPattern]);

  const patternCoordinates = useMemo(() => {
    const radius = 39; // 원형 휠 기준 반경 (%)
    return patterns.map((_, index) => {
      const angleDegrees = index * 30 - 90;
      const angleRad = (angleDegrees * Math.PI) / 180;
      const x = 50 + radius * Math.cos(angleRad);
      const y = 50 + radius * Math.sin(angleRad);
      return { x, y, angleDegrees };
    });
  }, [patterns]);

  const markerStyle = useMemo(() => {
    const coord = patternCoordinates[selectedIndex] || { x: 50, y: 50 };
    return {
      left: `${coord.x}%`,
      top: `${coord.y}%`,
      transform: "translate(-50%, -50%)",
      transition: "all 0.45s cubic-bezier(0.25, 0.8, 0.25, 1.25)",
    };
  }, [selectedIndex, patternCoordinates]);

  return (
    <div className="relative w-full flex items-center justify-center py-2">
      {/* 라이트 모드용 휠 플레이트 (나무 톤/베이지 그라데이션 질감) */}
      <div className="relative w-[230px] h-[230px] xs:w-[260px] xs:h-[260px] sm:w-[330px] sm:h-[330px] md:w-[360px] md:h-[360px] rounded-full bg-gradient-to-br from-[#f8f5ee] via-[#efeae0] to-[#e4dccf] border-[8px] sm:border-[10px] border-[#d8cdb8] shadow-[inset_0_3px_8px_rgba(0,0,0,0.12),0_12px_28px_rgba(216,205,184,0.5),0_4px_10px_rgba(0,0,0,0.06)] flex items-center justify-center overflow-hidden">
        {/* 방사형 가이드 라인 (베이지 톤에 맞춘 갈색선) */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.15]">
          {patternCoordinates.map((coord, idx) => (
            <div
              key={`line-${idx}`}
              className="absolute top-1/2 left-1/2 h-[1px] bg-[#8a7a5f] origin-left"
              style={{
                width: "40%",
                transform: `translate(0, -50%) rotate(${coord.angleDegrees}deg)`,
              }}
            />
          ))}
        </div>

        {/* 틱 재생 시 퍼지는 중앙 동심원 Pulse 애니메이션 링 */}
        {pulseTrigger && (
          <div
            key={Date.now()}
            className={`absolute rounded-full border-2 pointer-events-none animate-ping duration-300 ${
              isAccentTick
                ? "w-[95px] h-[95px] border-orange-500 bg-orange-500/10"
                : "w-[80px] h-[80px] border-indigo-500 bg-indigo-500/5"
            }`}
            style={{
              animationDuration: "0.4s",
            }}
          />
        )}

        {/* 라이트 모드 중앙 허브 버튼 (악보 ♩) */}
        <div className="relative z-10 w-[55px] h-[55px] xs:w-[65px] xs:h-[65px] sm:w-[85px] sm:h-[85px] rounded-full bg-white border-[4px] sm:border-[6px] border-[#e4dccf] flex flex-col items-center justify-center shadow-[0_4px_12px_rgba(0,0,0,0.08),inset_0_2px_4px_white] transition-transform duration-200 active:scale-95">
          <span className="material-symbols-outlined text-[20px] xs:text-[24px] sm:text-[32px] text-indigo-600 select-none">
            music_note
          </span>
          <span className="text-[7px] sm:text-[8px] font-black text-indigo-500 uppercase tracking-widest leading-none mt-0.5 sm:mt-1">
            Tempo
          </span>
        </div>

        {/* 12개의 방사형 리듬 패턴 카드 배치 */}
        {patterns.map((pattern, idx) => {
          const coord = patternCoordinates[idx];
          const isSelected = selectedPattern.id === pattern.id;

          return (
            <button
              key={pattern.id}
              onClick={() => onSelectPattern(pattern)}
              className={`absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center p-0.5 rounded-xl transition-all duration-300 ${
                isSelected
                  ? "scale-105 z-20"
                  : "hover:scale-102 opacity-75 hover:opacity-100 z-10"
              }`}
              style={{
                left: `${coord.x}%`,
                top: `${coord.y}%`,
              }}
            >
              {/* 리듬 텍스트 & SVG 악보 비트 표시 카드 */}
              <div
                className={`flex flex-col items-center justify-center rounded-xl px-1.5 py-1 sm:px-2 sm:py-1.5 shadow-sm border transition-colors ${
                  isSelected
                    ? "bg-indigo-600 text-white border-indigo-500 shadow-indigo-200"
                    : "bg-white text-slate-700 border-slate-200/80 hover:border-slate-300"
                }`}
              >
                {/* SVG 악보 */}
                <div className="mb-0.5">
                  <RhythmNoteIcon patternId={pattern.id} isSelected={isSelected} />
                </div>
                {/* 텍스트 라벨 */}
                <span className="text-[9px] sm:text-[10px] font-black tracking-tight mt-0.5">
                  {pattern.displayLabel}
                </span>
              </div>

              {/* 현재 재생 중인 서브비트 실시간 하이라이트 */}
              {isPlaying && isSelected && (
                <div className="mt-1 flex gap-1 justify-center items-center">
                  {pattern.beats.map((_, bIdx) => (
                    <span
                      key={bIdx}
                      className={`w-1.5 h-1.5 rounded-full transition-all duration-150 ${
                        activeSubIndex === bIdx
                          ? "bg-orange-500 scale-125 shadow-[0_0_6px_rgba(249,115,22,0.8)]"
                          : "bg-slate-300"
                      }`}
                    />
                  ))}
                </div>
              )}
            </button>
          );
        })}

        {/* 금빛 구슬 마커 */}
        <div
          className="absolute z-30 w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow-600 shadow-[0_3px_6px_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.6)] border border-yellow-200 pointer-events-none"
          style={markerStyle}
        >
          <div className="absolute top-0.5 left-0.5 w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-white/70" />
        </div>
      </div>
    </div>
  );
}
