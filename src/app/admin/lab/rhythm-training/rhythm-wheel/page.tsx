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
  const [activeMode, setActiveMode] = useState<TrainingMode>("Walking");
  const [selectedPattern, setSelectedPattern] = useState<RhythmPattern>(RHYTHM_PATTERNS[0]);

  // 실시간 재생 피드백 상태
  const [activeSubIndex, setActiveSubIndex] = useState(-1);
  const [pulseTrigger, setPulseTrigger] = useState(false);
  const [isAccentTick, setIsAccentTick] = useState(false);

  // RhythmScheduler 인스턴스를 보관할 레퍼런스
  const schedulerRef = useRef<RhythmScheduler | null>(null);

  // 1. 컴포넌트 마운트 시 스케줄러 인스턴스 초기 생성
  useEffect(() => {
    schedulerRef.current = new RhythmScheduler(selectedPattern, {
      bpm,
      volume,
      useAccent,
      isLoop,
      isRandom,
    });

    // 7. 언마운트 시 오디오 및 모든 스케줄러 자원 해제
    return () => {
      if (schedulerRef.current) {
        schedulerRef.current.destroy();
        schedulerRef.current = null;
      }
    };
  }, []); // 마운트 시 딱 한번 초기화

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
    // 패턴이 바뀌면 시각적 하이라이트 인덱스 리셋
    setActiveSubIndex(-1);
  }, [selectedPattern]);

  // 3. 루프 끝 타이밍 시 Random 모드가 켜져있으면 무작위 패턴 자동 변경
  const handleLoopCompleted = () => {
    if (!isRandom) return;

    // 현재 선택된 패턴을 제외하고 무작위 선택
    const filteredPatterns = RHYTHM_PATTERNS.filter((p) => p.id !== selectedPattern.id);
    const randomIndex = Math.floor(Math.random() * filteredPatterns.length);
    const nextPattern = filteredPatterns[randomIndex];
    
    if (nextPattern) {
      setSelectedPattern(nextPattern);
    }
  };

  // 4. 오디오 스케줄링 시점에 트리거되는 틱 콜백 (UI 하이라이트 동기화)
  const handleTick = (subIndex: number, time: number, isAccent: boolean) => {
    setActiveSubIndex(subIndex);
    setIsAccentTick(isAccent);
    
    // 중앙 원 맥박(Pulse) 발동 트리거 전환
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
      // 3. Play 버튼 클릭 시점에만 AudioContext 가동/재개
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
    <main className="min-h-screen bg-[#0d0f1a] text-white flex flex-col items-center py-6 px-4 md:px-8">
      {/* 상단 헤더 영역 */}
      <div className="w-full max-w-md md:max-w-xl text-center space-y-1 mb-4">
        <div className="flex items-center justify-center gap-2 text-indigo-400 font-black tracking-widest text-[11px] uppercase">
          <span className="material-symbols-outlined text-[14px]">science</span>
          <span>AI Lab - Rhythm Training</span>
        </div>
        <h1 className="text-[26px] font-black tracking-tight bg-gradient-to-r from-indigo-200 via-white to-indigo-100 bg-clip-text text-transparent">
          Rhythm Wheel
        </h1>
        <p className="text-[12px] text-gray-400 font-semibold leading-relaxed">
          탱고 풋워크의 정확한 디딤과 피봇 회전 타이밍을 훈련하기 위한 12가지 리듬 패턴 메트로놈입니다.
        </p>
      </div>

      {/* 메인 콘텐츠 영역 (모바일 세로 최적화 - 휠과 컨트롤을 상하 배치) */}
      <div className="w-full max-w-md md:max-w-xl space-y-6 flex flex-col items-center">
        {/* 원형 리듬 휠 */}
        <RhythmWheel
          patterns={RHYTHM_PATTERNS}
          selectedPattern={selectedPattern}
          onSelectPattern={handleSelectPattern}
          isPlaying={isPlaying}
          activeSubIndex={activeSubIndex}
          pulseTrigger={pulseTrigger}
          isAccentTick={isAccentTick}
        />

        {/* 패턴 상세 정보 판넬 */}
        <PatternInfo pattern={selectedPattern} activeMode={activeMode} />

        {/* 하단 컨트롤러 패널 */}
        <RhythmControls
          isPlaying={isPlaying}
          onTogglePlay={handleTogglePlay}
          bpm={bpm}
          onChangeBpm={setBpm}
          volume={volume}
          onChangeVolume={setVolume}
          useAccent={useAccent}
          onToggleAccent={() => setUseAccent(!useAccent)}
          isLoop={isLoop}
          onToggleLoop={() => setIsLoop(!isLoop)}
          isRandom={isRandom}
          onToggleRandom={() => setIsRandom(!isRandom)}
          activeMode={activeMode}
          onChangeMode={setActiveMode}
        />
      </div>
    </main>
  );
}
