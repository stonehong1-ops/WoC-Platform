'use client';

import { SocialScope } from '../hooks/useSocialScope';

interface SocialScopeTabsProps {
  scope: SocialScope;
  onChange: (scope: SocialScope) => void;
  language: string;
}

export default function SocialScopeTabs({ scope, onChange, language }: SocialScopeTabsProps) {
  return (
    <div className="flex items-center gap-1.5 px-4 pt-2.5 pb-1 bg-white">
      <button
        onClick={() => onChange('local')}
        className={`px-3.5 py-1.5 rounded-full text-[12px] font-black tracking-wide transition-all active:scale-95 cursor-pointer ${
          scope === 'local'
            ? 'bg-[#1e293b] text-white shadow-sm'
            : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
        }`}
      >
        LOCAL
      </button>
      <button
        onClick={() => onChange('global')}
        className={`px-3.5 py-1.5 rounded-full text-[12px] font-black tracking-wide transition-all active:scale-95 cursor-pointer ${
          scope === 'global'
            ? 'bg-[#1e293b] text-white shadow-sm'
            : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
        }`}
      >
        GLOBAL
      </button>
    </div>
  );
}
