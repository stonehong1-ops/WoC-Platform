'use client';

import React from 'react';

interface SectionCardProps {
  icon?: string;
  title: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * SectionCard — 아이콘 헤더가 있는 카드 박스
 * ProductDetail의 "Fit & Options" 박스 패턴
 */
export default function SectionCard({ icon, title, children, className = '' }: SectionCardProps) {
  return (
    <div className={`border border-[#e0e4e5] rounded-2xl overflow-hidden ${className}`}>
      <div className="bg-[#f8f9fa] px-4 py-2.5 border-b border-[#e0e4e5] flex items-center gap-2">
        {icon && <span className="material-symbols-outlined text-sm text-primary">{icon}</span>}
        <p className="text-[10px] font-black text-primary uppercase tracking-widest">{title}</p>
      </div>
      <div className="px-4 py-4">
        {children}
      </div>
    </div>
  );
}
