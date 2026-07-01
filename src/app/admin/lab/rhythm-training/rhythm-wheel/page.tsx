"use client";

import React, { useState, useEffect, useRef } from "react";
import { RhythmPattern, TrainingMode } from "./types";
import { RHYTHM_PATTERNS } from "./lib/rhythmPatterns";
import { RhythmScheduler } from "./lib/rhythmScheduler";
import RhythmWheel from "./components/RhythmWheel";
import RhythmControls from "./components/RhythmControls";
import PatternInfo from "./components/PatternInfo";

export default function RhythmWheelPage() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [bpm, setBpm] = useState(96);
  const [volume, setVolume] = useState(0.8);
  const [useAccent, setUseAccent] = useState(true);
  const [isLoop, setIsLoop] = useState(true);
  const [isRandom, setIsRandom] = useState(false);
  const [isSequence, setIsSequence] = useState(false);
  const [activeMode, setActiveMode] = useState<TrainingMode>("Walking");
  const [selectedPattern, setSelectedPattern] = useState<RhythmPattern>(RHYTHM_PATTERNS[0]);

  // 실시간 재생 피드백 상태
  const [activeSubIndex, setActiveSubIndex] = useState(-1);
  const [pulseTrigger, setPulseTrigger] = useState(false);
  const [isAccentTick, setIsAccentTick] = useState(false);

  // RhythmScheduler 인스턴스를 보관할 레퍼런스
  const schedulerRef = useRef<RhythmScheduler | null>(null);
  
  // 마디 카운트 추적 레퍼런스
  const loopCountRef = useRef(0);

  // 1. 컴포넌트 마운트 시 스케줄러 인스턴스 초기 생성
  useEffect(() => {
    schedulerRef.current = new RhythmScheduler(selectedPattern, {
      bpm,
      volume,
      useAccent,
      isLoop,
      isRandom,
    });

    return () => {
      if (schedulerRef.current) {
        schedulerRef.current.destroy();
        schedulerRef.current = null;
      }
    };
  }, []);

  // 2. 설정 값이 실시간으로 변경될 때 스케줄러 상태 갱신 전파
  useEffect(() => {
    if (schedulerRef.current) {
      schedulerRef.current.setBpm(bpm);
    }
  }, [bpm]);

  useEffect(() => {
    if (schedulerRef.current) {
      schedulerRef.current.setVolume(volume);
    }
  }, [volume]);

  useEffect(() => {
    if (schedulerRef.current) {
      schedulerRef.current.setAccent(useAccent);
    }
  }, [useAccent]);

  useEffect(() => {
    if (schedulerRef.current) {
      schedulerRef.current.setLoop(isLoop);
    }
  }, [isLoop]);

  useEffect(() => {
    if (schedulerRef.current) {
      schedulerRef.current.setRandom(isRandom);
    }
  }, [isRandom]);

  useEffect(() => {
    if (schedulerRef.current) {
      schedulerRef.current.setPattern(selectedPattern);
    }
    setActiveSubIndex(-1);
  }, [selectedPattern]);

  // 패턴 수동 클릭이나 재생 가동 상태 전환 시 카운트 리셋
  useEffect(() => {
    loopCountRef.current = 0;
  }, [selectedPattern, isPlaying]);

  // 3. 루프 끝 타이밍 시 옵션에 따른 전환 처리
  const handleLoopCompleted = () => {
    if (isRandom) {
      const filteredPatterns = RHYTHM_PATTERNS.filter((p) => p.id !== selectedPattern.id);
      const randomIndex = Math.floor(Math.random() * filteredPatterns.length);
      const nextPattern = filteredPatterns[randomIndex];
      if (nextPattern) {
        setSelectedPattern(nextPattern);
      }
    } else if (isSequence) {
      loopCountRef.current += 1;
      // 2마디(2 Measure) 완료 후 순차 전환
      if (loopCountRef.current >= 2) {
        loopCountRef.current = 0;
        const currentIndex = RHYTHM_PATTERNS.findIndex((p) => p.id === selectedPattern.id);
        const nextIndex = (currentIndex + 1) % RHYTHM_PATTERNS.length;
        const nextPattern = RHYTHM_PATTERNS[nextIndex];
        if (nextPattern) {
          setSelectedPattern(nextPattern);
        }
      }
    }
  };

  // 4. 오디오 스케줄링 시점에 트리거되는 틱 콜백
  const handleTick = (subIndex: number, time: number, isAccent: boolean) => {
    setActiveSubIndex(subIndex);
    setIsAccentTick(isAccent);
    
    setPulseTrigger(false);
    setTimeout(() => {
      setPulseTrigger(true);
    }, 10);
  };

  // 5. 재생 / 일시정지 토글 제어
  const handleTogglePlay = async () => {
    if (!schedulerRef.current) return;

    if (isPlaying) {
      schedulerRef.current.stop();
      setIsPlaying(false);
      setActiveSubIndex(-1);
      setPulseTrigger(false);
    } else {
      try {
        await schedulerRef.current.start(handleTick, handleLoopCompleted);
        setIsPlaying(true);
      } catch (err) {
        console.error("Failed to start audio scheduler", err);
      }
    }
  };

  // 6. 휠에서 리듬 직접 클릭 시 갱신
  const handleSelectPattern = (pattern: RhythmPattern) => {
    setSelectedPattern(pattern);
  };

  return (
    <main className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col items-center py-6 px-4 md:px-8">
      {/* 상단 헤더 영역 */}
      <div className="w-full max-w-md md:max-w-xl text-center space-y-1 mb-4">
        <div className="flex items-center justify-center gap-2 text-indigo-600 font-black tracking-widest text-[10px] uppercase">
          <span className="material-symbols-outlined text-[13px] font-bold">science</span>
          <span>AI Lab - Rhythm Training</span>
        </div>
        <h1 className="text-[24px] font-black tracking-tight bg-gradient-to-r from-slate-800 to-indigo-900 bg-clip-text text-transparent">
          Rhythm Wheel
        </h1>
        <p className="text-[12px] text-slate-500 font-semibold leading-relaxed">
          탱고 풋워크의 정확한 디딤과 피봇 회전 타이밍을 훈련하기 위한 12가지 리듬 패턴 메트로놈입니다.
        </p>
      </div>

      {/* 메인 콘텐츠 영역 */}
      <div className="w-full max-w-md md:max-w-xl space-y-5 flex flex-col items-center">
        {/* [1] 휠 & 재생(Start/Pause) 버튼 가로 정렬 */}
        <div className="w-full flex items-center justify-center gap-4 bg-white p-3 rounded-[32px] border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
          {/* 휠 (왼쪽) */}
          <div className="flex-1 flex justify-center max-w-[280px] xs:max-w-[320px]">
            <RhythmWheel
              patterns={RHYTHM_PATTERNS}
              selectedPattern={selectedPattern}
              onSelectPattern={handleSelectPattern}
              isPlaying={isPlaying}
              activeSubIndex={activeSubIndex}
              pulseTrigger={pulseTrigger}
              isAccentTick={isAccentTick}
            />
          </div>
          
          {/* Play/Pause (휠의 오른쪽) */}
          <div className="w-[85px] xs:w-[100px] h-[190px] xs:h-[220px] sm:h-[260px] md:h-[280px] flex">
            <button
              onClick={handleTogglePlay}
              className={`w-full h-full flex flex-col items-center justify-center gap-3 rounded-2xl font-black text-[14px] xs:text-[15px] transition-all shadow-md active:scale-[0.98] ${
                isPlaying
                  ? "bg-rose-600 text-white hover:bg-rose-500 shadow-rose-200"
                  : "bg-indigo-600 text-white hover:bg-indigo-500 shadow-indigo-200"
              }`}
            >
              <span className="material-symbols-outlined text-[36px] xs:text-[44px]">
                {isPlaying ? "pause_circle" : "play_circle"}
              </span>
              <div className="tracking-widest text-center leading-tight">
                {isPlaying ? "PAUSE" : "START"}
                <br />
                <span className="text-[10px] opacity-75 font-bold">DRILL</span>
              </div>
            </button>
          </div>
        </div>

        {/* [2] BPM (박자 속도) 조절부 (휠 바로 아래로 배치) */}
        <div className="w-full bg-white p-5 rounded-3xl border border-slate-200 shadow-[0_2px_8px_rgba(0,0,0,0.04)] space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-[13px] font-black text-slate-500">BPM (박자 속도)</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setBpm(Math.max(60, bpm - 1))}
                disabled={bpm <= 60}
                className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center font-bold text-slate-600 disabled:opacity-30"
              >
                -
              </button>
              <input
                type="number"
                value={bpm}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  if (!isNaN(val)) setBpm(val);
                }}
                min={60}
                max={180}
                className="w-14 text-center bg-slate-50 border border-slate-200 rounded-lg py-1 text-[15px] font-black text-slate-800 focus:outline-none focus:border-indigo-500"
              />
              <button
                onClick={() => setBpm(Math.min(180, bpm + 1))}
                disabled={bpm >= 180}
                className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center font-bold text-slate-600 disabled:opacity-30"
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
            onChange={(e) => setBpm(parseInt(e.target.value, 10))}
            className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
          />
          <div className="flex justify-between text-[10px] font-black text-slate-400">
            <span>60 BPM</span>
            <span>Lento (느림)</span>
            <span>120 BPM</span>
            <span>Milonga (빠름)</span>
            <span>180 BPM</span>
          </div>
        </div>

        {/* [3] 패턴 상세 정보 판넬 */}
        <PatternInfo pattern={selectedPattern} activeMode={activeMode} />

        {/* [4] 하단 컨트롤러 패널 (옵션 토글, 볼륨, 풋워크) */}
        <RhythmControls
          volume={volume}
          onChangeVolume={setVolume}
          useAccent={useAccent}
          onToggleAccent={() => setUseAccent(!useAccent)}
          isLoop={isLoop}
          onToggleLoop={() => setIsLoop(!isLoop)}
          isRandom={isRandom}
          onToggleRandom={() => {
            setIsRandom(!isRandom);
            if (!isRandom) setIsSequence(false);
          }}
          isSequence={isSequence}
          onToggleSequence={() => {
            setIsSequence(!isSequence);
            if (!isSequence) setIsRandom(false);
          }}
          activeMode={activeMode}
          onChangeMode={setActiveMode}
        />
      </div>
    </main>
  );
}
