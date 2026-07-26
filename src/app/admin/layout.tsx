"use client";

import React, { useEffect } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { useRouter, usePathname } from 'next/navigation';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { profile, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const isRenderPage = pathname === '/admin/covers/render';

  useEffect(() => {
    if (isRenderPage) return;
    if (!loading) {
      if (!profile || !profile.isAdmin) {
        router.replace('/');
      }
    }
  }, [profile, loading, router, isRenderPage]);

  if (!isRenderPage && (loading || !profile?.isAdmin)) {
    return <div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>;
  }

  if (isRenderPage) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-[100dvh] w-full flex flex-col bg-[#f8fafc] text-slate-800 relative selection:bg-blue-500/10">
      {/* 👑 어드민 전용 디바이스 상단 가드 헤더 (Notch / Status Bar 100% 차단) */}
      <header 
        className="sticky top-0 left-0 right-0 z-[500] bg-slate-900 text-white px-4 flex items-center justify-between shadow-md shrink-0 border-b border-slate-800"
        style={{ 
          paddingTop: 'max(0.75rem, env(safe-area-inset-top, 24px))',
          paddingBottom: '0.75rem' 
        }}
      >
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-blue-400 text-[20px]">admin_panel_settings</span>
          <span className="text-xs font-black tracking-wider uppercase text-slate-200">WoC Admin Console</span>
        </div>
        <button
          onClick={() => router.push('/profile')}
          className="text-[11px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1 rounded-lg transition-colors flex items-center gap-1 active:scale-95"
        >
          <span className="material-symbols-outlined text-[14px]">arrow_back</span>
          <span>Exit</span>
        </button>
      </header>

      {/* 📦 어드민 본문 세이프 에어리어 가둠 캔버스 */}
      <div 
        className="flex-1 w-full flex flex-col relative"
        style={{ 
          paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom, 24px))' 
        }}
      >
        {children}
      </div>
    </div>
  );
}
