'use client';

import { SocialScope } from '../hooks/useSocialScope';

interface SocialScopeTabsProps {
  scope: SocialScope;
  onChange: (scope: SocialScope) => void;
  language: string;
}

const TABS: { value: SocialScope; label: string }[] = [
  { value: 'city', label: 'CITY' },
  { value: 'local', label: 'LOCAL' },
  { value: 'global', label: 'GLOBAL' },
];

export default function SocialScopeTabs({ scope, onChange }: SocialScopeTabsProps) {
  return (
    <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200/50 shrink-0">
      {TABS.map(tab => (
        <button
          key={tab.value}
          onClick={() => onChange(tab.value)}
          className={`px-2 py-1.5 rounded-md text-[10.5px] font-black tracking-tight transition-all active:scale-95 cursor-pointer whitespace-nowrap ${
            scope === tab.value
              ? 'bg-[#1e293b] text-white shadow-sm'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
