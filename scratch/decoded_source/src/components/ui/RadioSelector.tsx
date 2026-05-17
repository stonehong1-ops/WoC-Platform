'use client';

import React from 'react';

interface RadioOption {
  value: string;
  label: string;
  icon?: string;
}

interface RadioSelectorProps {
  options: RadioOption[];
  selected: string;
  onChange: (value: string) => void;
  className?: string;
}

/**
 * RadioSelector — 라디오 버튼 그룹 (카드 스타일)
 * Store Pickup / Delivery 선택 패턴
 */
export default function RadioSelector({ options, selected, onChange, className = '' }: RadioSelectorProps) {
  return (
    <div className={`flex gap-2 ${className}`}>
      {options.map(opt => {
        const isActive = selected === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border text-xs font-bold transition-all active:scale-[0.98] ${
              isActive
                ? 'bg-primary/5 border-primary text-primary'
                : 'bg-white border-[#e0e4e5] text-[#596061]'
            }`}
          >
            <span
              className="material-symbols-outlined text-base"
              style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
            >
              radio_button_checked
            </span>
            {opt.icon && <span className="material-symbols-outlined text-base">{opt.icon}</span>}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
