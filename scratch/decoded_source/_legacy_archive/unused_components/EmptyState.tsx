'use client';

import React from 'react';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({ 
  title, 
  description, 
  icon = 'dashboard_customize', 
  actionLabel, 
  onAction 
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center animate-in fade-in slide-in-from-bottom-4 duration-1000">
      <div className="w-20 h-20 rounded-full bg-[#f8f9fa] flex items-center justify-center mb-6 ring-1 ring-gray-50 shadow-inner">
        <span className="material-symbols-outlined text-gray-300 text-3xl">{icon}</span>
      </div>
      
      <h3 className="text-2xl font-black text-gray-900 tracking-tighter uppercase mb-2">
        {title}
      </h3>
      <p className="max-w-[260px] text-xs font-medium text-gray-400 leading-relaxed uppercase tracking-wider mb-8">
        {description}
      </p>

      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="px-8 py-4 bg-[#0061ff] text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-[#0061ff]/20 hover:scale-105 active:scale-95 transition-all"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
