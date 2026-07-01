import React from "react";
import { TrainingMode } from "../types";

interface RhythmControlsProps {
  volume: number;
  onChangeVolume: (vol: number) => void;
  useAccent: boolean;
  onToggleAccent: () => void;
  isLoop: boolean;
  onToggleLoop: () => void;
  isRandom: boolean;
  onToggleRandom: () => void;
  isSequence: boolean;
  onToggleSequence: () => void;
  activeMode: TrainingMode;
  onChangeMode: (mode: TrainingMode) => void;
}

const TRAINING_MODES: TrainingMode[] = [
  "Walking",
  "Side Step",
  "Ocho",
  "Giro",
  "Sacada",
  "Adorno",
  "Free Drill"
];

export default function RhythmControls({
  volume,
  onChangeVolume,
  useAccent,
  onToggleAccent,
  isLoop,
  onToggleLoop,
  isRandom,
  onToggleRandom,
  isSequence,
  onToggleSequence,
  activeMode,
  onChangeMode
}: RhythmControlsProps) {

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChangeVolume(parseFloat(e.target.value));
  };

  return (
    <div className="w-full space-y-6">
      {/* 볼륨 및 옵션 토글 제어부 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 볼륨 컨트롤 */}
        <div className="bg-white px-5 py-4 rounded-3xl border border-slate-200 shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex items-center gap-4">
          <span className="material-symbols-outlined text-[20px] text-slate-500">
            {volume === 0 ? "volume_off" : volume < 0.5 ? "volume_down" : "volume_up"}
          </span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={volume}
            onChange={handleVolumeChange}
            className="flex-1 h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
          />
          <span className="text-[12px] font-bold text-slate-600 w-8 text-right">
            {Math.round(volume * 100)}%
          </span>
        </div>

        {/* 재생 속성 토글 스위치 그룹 */}
        <div className="grid grid-cols-4 gap-2">
          {/* Accent 강세 토글 */}
          <button
            onClick={onToggleAccent}
            className={`flex flex-col items-center justify-center py-2.5 rounded-2xl border transition-all ${
              useAccent
                ? "bg-indigo-50 border-indigo-200 text-indigo-700 font-bold"
                : "bg-slate-50 border-slate-200/80 text-slate-400 hover:text-slate-600"
            }`}
          >
            {/* volume_accent 아이콘 대신 깨지지 않는 커스텀 스피커 파동 SVG 렌더링 */}
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="mb-1">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor"></polygon>
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
            </svg>
            <span className="text-[10px] font-black">Accent</span>
          </button>

          {/* Loop 반복 토글 */}
          <button
            onClick={onToggleLoop}
            className={`flex flex-col items-center justify-center py-2.5 rounded-2xl border transition-all ${
              isLoop
                ? "bg-indigo-50 border-indigo-200 text-indigo-700 font-bold"
                : "bg-slate-50 border-slate-200/80 text-slate-400 hover:text-slate-600"
            }`}
          >
            <span className="material-symbols-outlined text-[20px] mb-1 font-bold">sync</span>
            <span className="text-[10px] font-black">Loop</span>
          </button>

          {/* Sequence 순차 진행 토글 */}
          <button
            onClick={onToggleSequence}
            className={`flex flex-col items-center justify-center py-2.5 rounded-2xl border transition-all ${
              isSequence
                ? "bg-indigo-50 border-indigo-200 text-indigo-700 font-bold"
                : "bg-slate-50 border-slate-200/80 text-slate-400 hover:text-slate-600"
            }`}
          >
            <span className="material-symbols-outlined text-[20px] mb-1 font-bold">arrow_forward</span>
            <span className="text-[10px] font-black">Sequence</span>
          </button>

          {/* Random 무작위 토글 */}
          <button
            onClick={onToggleRandom}
            className={`flex flex-col items-center justify-center py-2.5 rounded-2xl border transition-all ${
              isRandom
                ? "bg-indigo-50 border-indigo-200 text-indigo-700 font-bold"
                : "bg-slate-50 border-slate-200/80 text-slate-400 hover:text-slate-600"
            }`}
          >
            <span className="material-symbols-outlined text-[20px] mb-1 font-bold">shuffle</span>
            <span className="text-[10px] font-black">Random</span>
          </button>
        </div>
      </div>

      {/* 훈련 모드 설정 (Footwork Drill Modes) */}
      <div className="space-y-2.5">
        <h3 className="text-[13px] font-black text-slate-500">풋워크 훈련 동작 지정</h3>
        <div className="flex flex-wrap gap-2">
          {TRAINING_MODES.map((mode) => {
            const isSelected = activeMode === mode;
            return (
              <button
                key={mode}
                onClick={() => onChangeMode(mode)}
                className={`px-4 py-2.5 rounded-xl text-[12px] font-black transition-all ${
                  isSelected
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-100"
                    : "bg-white text-slate-600 hover:text-slate-800 border border-slate-200 shadow-sm"
                }`}
              >
                {mode}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
