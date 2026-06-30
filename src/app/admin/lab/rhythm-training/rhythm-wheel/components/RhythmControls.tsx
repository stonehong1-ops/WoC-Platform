import React from "react";
import { TrainingMode } from "../types";

interface RhythmControlsProps {
  isPlaying: boolean;
  onTogglePlay: () => void;
  bpm: number;
  onChangeBpm: (bpm: number) => void;
  volume: number;
  onChangeVolume: (vol: number) => void;
  useAccent: boolean;
  onToggleAccent: () => void;
  isLoop: boolean;
  onToggleLoop: () => void;
  isRandom: boolean;
  onToggleRandom: () => void;
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
  isPlaying,
  onTogglePlay,
  bpm,
  onChangeBpm,
  volume,
  onChangeVolume,
  useAccent,
  onToggleAccent,
  isLoop,
  onToggleLoop,
  isRandom,
  onToggleRandom,
  activeMode,
  onChangeMode
}: RhythmControlsProps) {

  const handleBpmSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChangeBpm(parseInt(e.target.value, 10));
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChangeVolume(parseFloat(e.target.value));
  };

  return (
    <div className="w-full space-y-6">
      {/* 재생 및 메인 제어부 */}
      <div className="flex items-center justify-between gap-4">
        {/* Play/Pause 버튼 */}
        <button
          onClick={onTogglePlay}
          className={`flex-1 flex items-center justify-center gap-2.5 py-4 rounded-2xl font-black text-[16px] transition-all shadow-md active:scale-[0.98] ${
            isPlaying
              ? "bg-rose-600 text-white hover:bg-rose-500 shadow-rose-950/20"
              : "bg-indigo-600 text-white hover:bg-indigo-500 shadow-indigo-950/20"
          }`}
        >
          <span className="material-symbols-outlined text-[24px]">
            {isPlaying ? "pause_circle" : "play_circle"}
          </span>
          {isPlaying ? "PAUSE" : "START DRILL"}
        </button>
      </div>

      {/* BPM 조절부 */}
      <div className="bg-[#1f2235] p-5 rounded-2xl border border-[#2f3452] space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-[14px] font-bold text-gray-400">BPM (박자 속도)</span>
          <div className="flex items-center gap-2">
            {/* 마이너스 미세 조정 */}
            <button
              onClick={() => onChangeBpm(Math.max(60, bpm - 1))}
              disabled={bpm <= 60}
              className="w-8 h-8 rounded-lg bg-[#2a304e] border border-[#3e456e] flex items-center justify-center font-bold text-indigo-300 disabled:opacity-30"
            >
              -
            </button>
            <input
              type="number"
              value={bpm}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                if (!isNaN(val)) onChangeBpm(val);
              }}
              min={60}
              max={180}
              className="w-14 text-center bg-[#151724] border border-[#2d324d] rounded-lg py-1 text-[16px] font-black text-white focus:outline-none focus:border-indigo-500"
            />
            {/* 플러스 미세 조정 */}
            <button
              onClick={() => onChangeBpm(Math.min(180, bpm + 1))}
              disabled={bpm >= 180}
              className="w-8 h-8 rounded-lg bg-[#2a304e] border border-[#3e456e] flex items-center justify-center font-bold text-indigo-300 disabled:opacity-30"
            >
              +
            </button>
          </div>
        </div>
        <input
          type="range"
          min="60"
          max="180"
          value={bpm}
          onChange={handleBpmSliderChange}
          className="w-full h-1.5 bg-[#151724] rounded-lg appearance-none cursor-pointer accent-indigo-500"
        />
        <div className="flex justify-between text-[11px] font-bold text-gray-500">
          <span>60 BPM</span>
          <span>Lento (느림)</span>
          <span>120 BPM</span>
          <span>Milonga (빠름)</span>
          <span>180 BPM</span>
        </div>
      </div>

      {/* 볼륨 및 옵션 토글 제어부 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 볼륨 컨트롤 */}
        <div className="bg-[#1f2235] px-5 py-4 rounded-2xl border border-[#2f3452] flex items-center gap-4">
          <span className="material-symbols-outlined text-[20px] text-gray-400">
            {volume === 0 ? "volume_off" : volume < 0.5 ? "volume_down" : "volume_up"}
          </span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={volume}
            onChange={handleVolumeChange}
            className="flex-1 h-1 bg-[#151724] rounded-lg appearance-none cursor-pointer accent-indigo-500"
          />
          <span className="text-[12px] font-bold text-gray-300 w-8 text-right">
            {Math.round(volume * 100)}%
          </span>
        </div>

        {/* 재생 속성 토글 스위치 그룹 */}
        <div className="flex justify-between gap-2">
          {/* Accent 강세 토글 */}
          <button
            onClick={onToggleAccent}
            className={`flex-1 flex flex-col items-center justify-center py-2.5 rounded-2xl border transition-all ${
              useAccent
                ? "bg-indigo-600/20 border-indigo-500/50 text-indigo-200"
                : "bg-[#1f2235] border-[#2f3452] text-gray-500 hover:text-gray-300"
            }`}
          >
            <span className="material-symbols-outlined text-[20px] mb-1">volume_accent</span>
            <span className="text-[11px] font-bold">Accent</span>
          </button>

          {/* Loop 반복 토글 */}
          <button
            onClick={onToggleLoop}
            className={`flex-1 flex flex-col items-center justify-center py-2.5 rounded-2xl border transition-all ${
              isLoop
                ? "bg-indigo-600/20 border-indigo-500/50 text-indigo-200"
                : "bg-[#1f2235] border-[#2f3452] text-gray-500 hover:text-gray-300"
            }`}
          >
            <span className="material-symbols-outlined text-[20px] mb-1">sync</span>
            <span className="text-[11px] font-bold">Loop</span>
          </button>

          {/* Random 무작위 토글 */}
          <button
            onClick={onToggleRandom}
            className={`flex-1 flex flex-col items-center justify-center py-2.5 rounded-2xl border transition-all ${
              isRandom
                ? "bg-indigo-600/20 border-indigo-500/50 text-indigo-200"
                : "bg-[#1f2235] border-[#2f3452] text-gray-500 hover:text-gray-300"
            }`}
          >
            <span className="material-symbols-outlined text-[20px] mb-1">shuffle</span>
            <span className="text-[11px] font-bold">Random</span>
          </button>
        </div>
      </div>

      {/* 훈련 모드 설정 (Footwork Drill Modes) */}
      <div className="space-y-2.5">
        <h3 className="text-[13px] font-bold text-gray-400">풋워크 훈련 동작 지정</h3>
        <div className="flex flex-wrap gap-2">
          {TRAINING_MODES.map((mode) => {
            const isSelected = activeMode === mode;
            return (
              <button
                key={mode}
                onClick={() => onChangeMode(mode)}
                className={`px-4 py-2 rounded-xl text-[12px] font-black transition-all ${
                  isSelected
                    ? "bg-[#3f476f] text-white shadow-sm"
                    : "bg-[#1f2235] text-gray-400 hover:text-gray-200 border border-transparent hover:border-[#2f3452]"
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
