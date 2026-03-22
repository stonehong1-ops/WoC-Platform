'use client';

import React from 'react';
import { REGIONS } from '@/lib/constants/socialData';

export default function SocialRegisterForm() {
  return (
    <div className="space-y-6">
      {/* Event Title */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">이벤트 제목</label>
        <input 
          type="text" 
          placeholder="예: 밀롱가 엘 불린"
          className="w-full bg-glass border border-glass-border rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/50"
        />
      </div>

      {/* Region & Place Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">지역</label>
          <select className="w-full bg-glass border border-glass-border rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all appearance-none cursor-pointer">
            {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">장소</label>
          <input 
            type="text" 
            placeholder="예: 합정 턴"
            className="w-full bg-glass border border-glass-border rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/50"
          />
        </div>
      </div>

      {/* Date & Time */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">일시</label>
        <div className="flex gap-2">
          <input 
            type="date" 
            className="flex-1 bg-glass border border-glass-border rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
          />
          <input 
            type="time" 
            className="w-28 bg-glass border border-glass-border rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
          />
        </div>
      </div>

      {/* DJ & Organizer */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">DJ</label>
          <input 
            type="text" 
            placeholder="상세 내용"
            className="w-full bg-glass border border-glass-border rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/50"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">오거나이저</label>
          <input 
            type="text" 
            placeholder="이름"
            className="w-full bg-glass border border-glass-border rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/50"
          />
        </div>
      </div>

      {/* Additional Info / Description */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">추가 설명</label>
        <textarea 
          placeholder="이벤트에 대한 상세 설명을 입력하세요..."
          className="w-full bg-glass border border-glass-border rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/50 h-32 resize-none"
        />
      </div>

      {/* Helper Text */}
      <p className="text-[10px] text-muted-foreground text-center px-4">
        등록하신 정보는 관리자의 승인 확인 후 소셜 페이지에 노출됩니다.
      </p>
    </div>
  );
}
