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

  // 로딩 중이거나 공개 페이지가 아닌데 유저가 없으면 일단 빈 화면 (또는 로딩 스켈레톤)
  if (loading || (!user && !isPublic)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <main className={isLanding ? "" : "pt-16 pb-[60px]"}>
      {children}
    </main>
  );
}
