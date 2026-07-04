'use client';

import React from 'react';

export type EmptyStateProps = {
  title: string;
  description?: string;
  icon?: string | React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
};

export default function EmptyState({
  title,
  description,
  icon = 'search_off',
  actionLabel,
  onAction
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center w-full">
      <div className="w-14 h-14 bg-slate-50 rounded-full flex items-center justify-center mb-4 text-slate-400">
        {typeof icon === 'string' ? (
          <span className="material-symbols-outlined text-3xl">{icon}</span>
        ) : (
          icon
        )}
      </div>
      <h3 className="text-[14.5px] font-black text-slate-800 mb-1">{title}</h3>
      {description && (
        <p className="text-[11.5px] text-slate-400 font-medium max-w-[240px] leading-normal">{description}</p>
      )}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-5 px-5 py-2 bg-violet-600 hover:bg-violet-750 text-white rounded-xl text-[12.5px] font-bold shadow-md shadow-violet-100 transition-all active:scale-[0.97]"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
