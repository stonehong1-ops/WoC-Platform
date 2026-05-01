'use client';

import React, { useEffect, useRef, useState } from 'react';

interface FullScreenModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  bottomBar?: React.ReactNode;
  className?: string;
}

/**
 * FullScreenModal — 풀스크린 오버레이 베이스
 * ProductDetail 전체 구조 패턴
 * - 스크롤 시 헤더 배경 전환 (투명 → 흰색)
 * - 바텀바 고정 영역
 */
export default function FullScreenModal({ isOpen, onClose, title, children, bottomBar, className = '' }: FullScreenModalProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const handler = () => setIsScrolled(el.scrollTop > 60);
    el.addEventListener('scroll', handler, { passive: true });
    return () => el.removeEventListener('scroll', handler);
  }, []);

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 z-[100] bg-white flex flex-col animate-in slide-in-from-bottom duration-300 ${className}`}>
      <style dangerouslySetInnerHTML={{ __html: `
        .fsm-scrollbar::-webkit-scrollbar { display: none; }
        .fsm-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />

      {/* Header */}
      <div className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 transition-all duration-300 ${
        isScrolled ? 'bg-white/95 backdrop-blur-md shadow-sm' : 'bg-gradient-to-b from-black/30 to-transparent'
      }`}>
        <button
          onClick={onClose}
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
            isScrolled ? 'bg-slate-100 text-[#2d3435]' : 'bg-black/20 backdrop-blur-sm text-white'
          }`}
        >
          <span className="material-symbols-outlined text-xl">arrow_back</span>
        </button>
        <div className={`text-sm font-bold truncate max-w-[180px] transition-opacity ${
          isScrolled ? 'opacity-100 text-[#2d3435]' : 'opacity-0'
        }`}>
          {title}
        </div>
        <div className="w-10" /> {/* spacer for center alignment */}
      </div>

      {/* Scrollable Content */}
      <div ref={scrollRef} className={`flex-1 overflow-y-auto fsm-scrollbar ${bottomBar ? 'pb-[80px]' : 'pb-6'}`}>
        {children}
      </div>

      {/* Fixed Bottom Bar */}
      {bottomBar && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-100 px-4 py-2.5 flex items-center gap-3 max-w-md mx-auto">
          {bottomBar}
        </div>
      )}
    </div>
  );
}
