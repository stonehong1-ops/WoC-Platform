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

export default function RhythmWheel({
  patterns,
  selectedPattern,
  onSelectPattern,
  isPlaying,
  activeSubIndex,
  pulseTrigger,
  isAccentTick,
}: RhythmWheelProps) {
  // 현재 선택된 패턴의 인덱스 파악
  const selectedIndex = useMemo(() => {
    return patterns.findIndex((p) => p.id === selectedPattern.id);
  }, [patterns, selectedPattern]);

  // 각 리듬 패턴의 원형 배치 좌표 계산 (12시 방향부터 시계방향 30도 간격)
  const patternCoordinates = useMemo(() => {
    const radius = 40; // 원형 휠 기준 반경 (%)
    return patterns.map((_, index) => {
      const angleDegrees = index * 30 - 90; // 12시 방향이 0도가 되도록 -90도 조정
      const angleRad = (angleDegrees * Math.PI) / 180;
      const x = 50 + radius * Math.cos(angleRad);
      const y = 50 + radius * Math.sin(angleRad);
      return { x, y, angleDegrees };
    });
  }, [patterns]);

  // 선택 구슬 마커의 현재 좌표
  const markerStyle = useMemo(() => {
    const coord = patternCoordinates[selectedIndex] || { x: 50, y: 50 };
    return {
      left: `${coord.x}%`,
      top: `${coord.y}%`,
      transform: "translate(-50%, -50%)",
      transition: "all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1.25)", // 구슬이 굴러가는 텐션 효과
    };
  }, [selectedIndex, patternCoordinates]);

  return (
    <div className="relative w-full flex items-center justify-center py-4">
      {/* 휠 메인 플레이트 (고급스러운 우드/슬레이트 톤 합성 질감 스타일) */}
      <div className="relative w-[290px] h-[290px] sm:w-[380px] sm:h-[380px] rounded-full bg-[#1b1e2c] border-[8px] border-[#252a3f] shadow-[inset_0_4px_12px_rgba(0,0,0,0.6),0_12px_36px_rgba(0,0,0,0.4)] flex items-center justify-center overflow-hidden">
        {/* 방사형 가이드 라인 렌더링 */}
        <div className="absolute inset-0 pointer-events-none opacity-10">
          {patternCoordinates.map((coord, idx) => (
            <div
              key={`line-${idx}`}
              className="absolute top-1/2 left-1/2 h-[1px] bg-white origin-left"
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
            key={Date.now()} // 매 트리거마다 강제 리마운트하여 CSS 애니메이션 재구동
            className={`absolute rounded-full border-2 pointer-events-none animate-ping duration-300 ${
              isAccentTick
                ? "w-[90px] h-[90px] border-orange-500 bg-orange-500/10"
                : "w-[75px] h-[75px] border-indigo-400 bg-indigo-400/5"
            }`}
            style={{
              animationDuration: "0.4s",
            }}
          />
        )}

        {/* 중앙 허브 버튼 (BPM 정박 기준점 ♩) */}
        <div className="relative z-10 w-[70px] h-[70px] sm:w-[90px] sm:h-[90px] rounded-full bg-[#2a304e] border-4 border-[#3e4775] flex flex-col items-center justify-center shadow-lg transition-transform duration-200 active:scale-95">
          <span className="material-symbols-outlined text-[32px] sm:text-[40px] text-indigo-400 select-none">
            music_note
          </span>
          <span className="text-[9px] font-bold text-indigo-300 uppercase tracking-widest leading-none mt-1">
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
              className={`absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center p-1 rounded-xl transition-all duration-300 ${
                isSelected
                  ? "scale-110 z-20"
                  : "hover:scale-105 opacity-60 hover:opacity-100 z-10"
              }`}
              style={{
                left: `${coord.x}%`,
                top: `${coord.y}%`,
              }}
            >
              {/* 리듬 텍스트 표기 */}
              <div
                className={`flex items-center justify-center rounded-lg px-2 py-1 font-black shadow-md border ${
                  isSelected
                    ? "bg-indigo-600 text-white border-indigo-400"
                    : "bg-[#25283b] text-indigo-300 border-[#2f334d]"
                } text-[12px] sm:text-[14px]`}
              >
                {pattern.displayLabel}
              </div>

              {/* 현재 재생 중인 서브비트 실시간 시각적 강조 */}
              {isPlaying && isSelected && (
                <div className="mt-1 flex gap-1 justify-center items-center">
                  {pattern.beats.map((_, bIdx) => (
                    <span
                      key={bIdx}
                      className={`w-1.5 h-1.5 rounded-full transition-all duration-150 ${
                        activeSubIndex === bIdx
                          ? "bg-orange-400 scale-125 shadow-[0_0_8px_rgba(251,146,60,0.8)]"
                          : "bg-white/20"
                      }`}
                    />
                  ))}
                </div>
              )}
            </button>
          );
        })}

        {/* 금빛 마커 구슬 (선택 마커) */}
        <div
          className="absolute z-30 w-5 h-5 rounded-full bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow-600 shadow-[0_4px_8px_rgba(0,0,0,0.5),inset_0_2px_4px_rgba(255,255,255,0.6)] border border-yellow-200 pointer-events-none"
          style={markerStyle}
        >
          {/* 구슬 광택 하이라이트 효과 */}
          <div className="absolute top-0.5 left-0.5 w-1.5 h-1.5 rounded-full bg-white/70" />
        </div>
      </div>
    </div>
  );
}
