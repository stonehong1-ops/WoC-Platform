'use client';

import React from 'react';

interface ChipOption {
  value: string;
  label?: string;
  extra?: string;  // e.g. "+₩5,000"
}

interface ChipSelectorProps {
  options: ChipOption[];
  selected: string | string[];
  onChange: (value: string) => void;
  multi?: boolean;
  className?: string;
}

/**
 * ChipSelector — 칩형 선택 버튼 (단일/다중 선택)
 * Size 칩, 커스텀옵션 칩 패턴
 */
export default function ChipSelector({ options, selected, onChange, multi = false, className = '' }: ChipSelectorProps) {
  const isSelected = (val: string) => {
    if (multi && Array.isArray(selected)) return selected.includes(val);
    return selected === val;
  };

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {options.map(opt => {
        const active = isSelected(opt.value);
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`min-w-[48px] px-3 py-2.5 rounded-xl text-xs font-bold border transition-all active:scale-95 ${
              active
                ? 'bg-primary text-white border-primary shadow-sm'
                : 'bg-white text-[#2d3435] border-[#e0e4e5] hover:border-[#acb3b4]'
            }`}
          >
            {opt.label || opt.value}
            {opt.extra && (
              <span className={`ml-1 text-[10px] ${active ? 'text-white/80' : 'text-[#acb3b4]'}`}>{opt.extra}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
