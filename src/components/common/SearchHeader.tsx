'use client';

import React from 'react';

export type SearchHeaderProps = {
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
  showFilter?: boolean;
  onFilterClick?: () => void;
};

export default function SearchHeader({
  value,
  placeholder,
  onChange,
  showFilter = true,
  onFilterClick
}: SearchHeaderProps) {
  return (
    <div className="relative w-full flex items-center gap-3">
      <div className="flex-1 bg-slate-50 border border-slate-100 rounded-2xl flex items-center px-4 py-3 gap-2">
        <span className="material-symbols-outlined text-slate-400 text-[20px]">search</span>
        <input 
          type="text" 
          placeholder={placeholder} 
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="bg-transparent border-none text-slate-800 text-[13.5px] font-bold outline-none flex-1 placeholder:text-slate-350"
        />
      </div>
      {showFilter && (
        <button 
          onClick={onFilterClick}
          className="w-11 h-11 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center text-slate-650 hover:bg-slate-100 active:scale-95 transition-all"
        >
          <span className="material-symbols-outlined text-[20px]">tune</span>
        </button>
      )}
    </div>
  );
}
