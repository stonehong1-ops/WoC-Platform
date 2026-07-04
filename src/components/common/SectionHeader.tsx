'use client';

import React from 'react';
import Link from 'next/link';

export type SectionHeaderProps = {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
  href?: string;
};

export default function SectionHeader({
  title,
  subtitle,
  actionLabel,
  onAction,
  href
}: SectionHeaderProps) {
  const renderAction = () => {
    if (!actionLabel) return null;
    
    const content = (
      <span className="text-[12px] font-bold text-violet-650 flex items-center gap-0.5 hover:opacity-85 transition-opacity">
        {actionLabel}
        <span className="material-symbols-outlined text-base">chevron_right</span>
      </span>
    );

    if (href) {
      return <Link href={href}>{content}</Link>;
    }

    return (
      <button onClick={onAction} className="focus:outline-none">
        {content}
      </button>
    );
  };

  return (
    <div className="flex items-center justify-between">
      <div className="text-left">
        <h2 className="text-[16px] font-black text-slate-850 tracking-tight leading-tight">{title}</h2>
        {subtitle && (
          <p className="text-[11px] font-medium text-slate-400 mt-1">{subtitle}</p>
        )}
      </div>
      {renderAction()}
    </div>
  );
}
