'use client';

import React from 'react';

interface InfoRowProps {
  icon: string;
  iconBg?: string;         // e.g. 'bg-[#f0f4ff]'
  iconColor?: string;      // e.g. 'text-primary'
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  className?: string;
}

/**
 * InfoRow — 아이콘 원 + 제목 + 설명 한 줄
 * Production/Delivery/Exchange 정보 행 패턴
 */
export default function InfoRow({ icon, iconBg = 'bg-[#f0f4ff]', iconColor = 'text-primary', title, subtitle, right, className = '' }: InfoRowProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className={`w-8 h-8 rounded-full ${iconBg} flex items-center justify-center flex-shrink-0`}>
        <span className={`material-symbols-outlined text-sm ${iconColor}`}>{icon}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-[#2d3435]">{title}</p>
        {subtitle && <p className="text-[11px] text-[#596061] truncate">{subtitle}</p>}
      </div>
      {right && <div className="flex-shrink-0">{right}</div>}
    </div>
  );
}
