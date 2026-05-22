"use client";

import React from "react";

interface StepIndicatorProps {
  currentStep: 1 | 2 | 3;
  groupName?: string;
  onBack?: () => void;
}

const STEPS = [
  { num: 1, label: "Select" },
  { num: 2, label: "Review" },
  { num: 3, label: "Organize" },
];

export default function StepIndicator({ currentStep, groupName, onBack }: StepIndicatorProps) {
  return (
    <header className="relative bg-transparent border-b border-surface-variant/20" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 md:px-16 h-14">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="font-semibold text-on-surface text-[15px] leading-tight">{groupName || "Group Configuration"}</h1>
            <p className="text-[11px] text-on-surface-variant leading-tight">Step {currentStep} of 3</p>
          </div>
        </div>
      </div>

      {/* Step indicator bar */}
      <div className="flex items-center justify-center gap-0 px-5 md:px-16 pb-3 pt-1">
        {STEPS.map((step, i) => {
          const isActive = step.num === currentStep;
          const isDone = step.num < currentStep;

          return (
            <React.Fragment key={step.num}>
              {/* Step circle */}
              <div className="flex items-center gap-2">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-bold transition-all ${
                    isActive
                      ? "bg-primary text-on-primary shadow-md"
                      : isDone
                        ? "bg-primary/20 text-primary"
                        : "bg-surface-container-high text-on-surface-variant"
                  }`}
                >
                  {isDone ? (
                    <span className="material-symbols-outlined text-[16px]">check</span>
                  ) : (
                    step.num
                  )}
                </div>
                <span
                  className={`text-[12px] font-semibold hidden sm:inline ${
                    isActive ? "text-primary" : isDone ? "text-primary/60" : "text-on-surface-variant/60"
                  }`}
                >
                  {step.label}
                </span>
              </div>

              {/* Connector line */}
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-[2px] mx-3 rounded-full transition-colors ${isDone ? "bg-primary/40" : "bg-surface-variant/50"}`}></div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </header>
  );
}
