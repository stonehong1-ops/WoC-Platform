import React from "react";
import { RhythmPattern, TrainingMode } from "../types";

interface PatternInfoProps {
  pattern: RhythmPattern;
  activeMode: TrainingMode;
}

export default function PatternInfo({ pattern, activeMode }: PatternInfoProps) {
  const getDifficultyBadge = (difficulty?: string) => {
    switch (difficulty) {
      case "basic":
        return (
          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-black px-2.5 py-0.5 rounded-full">
            기초 (Basic)
          </span>
        );
      case "intermediate":
        return (
          <span className="bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-black px-2.5 py-0.5 rounded-full">
            중급 (Intermediate)
          </span>
        );
      case "advanced":
        return (
          <span className="bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-black px-2.5 py-0.5 rounded-full">
            상급 (Advanced)
          </span>
        );
      default:
        return null;
    }
  };

  // 선택된 훈련 모드별 풋워크 조언 결합
  const getCombinedDrillAdvice = (mode: TrainingMode) => {
    switch (mode) {
      case "Walking":
        return "상체의 견고함을 유지한 상태에서 휠의 틱 음절 시점에 앞꿈치 볼(ball)이 바닥을 정확히 짓누르도록 체중 이동 타이밍을 조절하세요.";
      case "Side Step":
        return "옆걸음 시 디딤발을 뻗어 안착하는 타이밍에 틱 음을 정확히 매칭하고, 모으는 발의 텐션 속도를 조절하는 연습을 합니다.";
      case "Ocho":
        return "틱 사운드가 울리기 전 피봇 회전을 미리 완료해 두고, 소리가 나는 시점에 다리를 부드럽게 밀어 디뎌줍니다.";
      case "Giro":
        return "앞-옆-뒤-옆으로 이어지는 지로의 보폭 순서에 맞추어 변칙적인 리듬 틱을 디딤발로 정교하게 소화해 봅니다.";
      case "Sacada":
        return "파트너의 디딤 공간을 차고 들어가는 순간의 가속도를 틱 리듬에 맞추어 디디는 연습을 반복합니다.";
      case "Adorno":
        return "체중이 실리지 않는 발로 원을 그리거나 발목을 콕 짚어주는 장식 동작(Adorno)을 비프음의 세분비트(subdivision)에 맞춰 수행해 보세요.";
      default:
        return "선택된 리듬 패턴에 구애받지 않고 탱고의 다양한 풋워크 및 속도 조절 훈련을 자유롭게 연습합니다.";
    }
  };

  return (
    <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.04)] space-y-4 w-full">
      {/* 패턴 헤더 영역 */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">
            Selected Pattern
          </span>
          <h2 className="text-[18px] font-black text-slate-800 leading-none">
            패턴 {pattern.displayLabel}
          </h2>
        </div>
        <div>{getDifficultyBadge(pattern.difficulty)}</div>
      </div>

      {/* 패턴 세부 정보 */}
      <div className="space-y-3">
        <div>
          <h4 className="text-[11px] font-black text-slate-400 mb-1">패턴 해설</h4>
          <p className="text-[13px] text-slate-600 leading-relaxed">
            {pattern.description || "이 리듬은 풋워크 정교함을 훈련하기 위한 비프 템플릿입니다."}
          </p>
        </div>

        <div>
          <h4 className="text-[11px] font-black text-slate-400 mb-1">풋워크 팁</h4>
          <p className="text-[13px] text-indigo-600 leading-relaxed font-bold">
            {pattern.footworkHint || "정박과 어박의 교차 훈련을 적극 권장합니다."}
          </p>
        </div>

        {/* 훈련 모드 연계 가이드 */}
        <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/40">
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="material-symbols-outlined text-[16px] text-indigo-600 font-bold">
              sports_gymnastics
            </span>
            <span className="text-[11px] font-black text-indigo-600">
              {activeMode} 모드 훈련 가이드
            </span>
          </div>
          <p className="text-[12px] text-slate-500 leading-relaxed">
            {getCombinedDrillAdvice(activeMode)}
          </p>
        </div>
      </div>
    </div>
  );
}
