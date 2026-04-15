'use client';

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';

export default function PageWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile, loading } = useAuth();
  
  const isLanding = pathname === '/';
  const isLogin = pathname === '/login';
  const isPublic = isLanding || isLogin;

  useEffect(() => {
    if (!loading) {
      if (!user && !isPublic) {
        // 로그인 안됨 -> 로그인 페이지로
        router.push('/login');
      } else if (user && !profile?.isRegistered && !isLogin) {
        // 로그인됨 but 가입정보 없음 -> 상세정보 입력 페이지로
        router.push('/login');
      }
    }
  }, [user, profile, loading, isPublic, isLogin, router]);

  // 로딩 중일 때 표시할 프리미엄 로딩 화면
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f0f2f5]">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-[#1A73E8]/10 border-t-[#1A73E8] rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-2 h-2 bg-[#1A73E8] rounded-full animate-ping"></div>
          </div>
        </div>
        <p className="mt-6 text-[10px] font-black text-[#1A73E8] uppercase tracking-[0.3em] animate-pulse">
          Synchronizing Experience
        </p>
      </div>
    );
  }

  // 로그인되지 않은 상태에서 비공개 페이지 접근 시 로딩 상태 유지 (useEffect에서 리다이렉트 처리됨)
  if (!user && !isPublic) {
    return (
      <div className="min-h-screen bg-[#f0f2f5]"></div>
    );
  }

  return (
    <main className={isLanding ? "" : "pt-16 pb-[60px]"}>
      {children}
    </main>
  );
}
