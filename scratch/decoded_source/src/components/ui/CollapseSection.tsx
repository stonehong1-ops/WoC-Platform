'use client';

import React, { useState } from 'react';

interface CollapseSectionProps {
  icon?: string;
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
}

/**
 * CollapseSection — 접기/펼치기 섹션
 * Size Guide, Description 패턴
 */
export default function CollapseSection({ icon, title, children, defaultOpen = false, className = '' }: CollapseSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={className}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 text-xs font-bold text-primary w-full"
      >
        {icon && <span className="material-symbols-outlined text-sm">{icon}</span>}
        {title}
        <span className="material-symbols-outlined text-sm ml-auto">
          {isOpen ? 'expand_less' : 'expand_more'}
        </span>
      </button>
      {isOpen && (
        <div className="mt-2 p-3 bg-[#f2f4f4] rounded-xl text-xs text-[#596061] animate-in fade-in duration-200">
          {children}
        </div>
      )}
    </div>
  );
}
