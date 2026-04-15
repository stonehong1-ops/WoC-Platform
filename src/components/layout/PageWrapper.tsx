'use client';

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';

export default function PageWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile, loading, setShowLogin } = useAuth();
  
  const isLanding = pathname === '/';
  const isLogin = pathname === '/login';
  const isPublic = isLanding || isLogin;

  useEffect(() => {
    if (!loading) {
      if (!user && !isPublic) {
        // 비공개 페이지인데 로그인 안됨 -> 로그인 유도
        setShowLogin(true);
      } else if (user && !profile?.isRegistered && !isPublic) {
        // 비공개 페이지인데 가입 안됨 -> 가입 유도
        setShowLogin(true);
      }
    }
  }, [user, profile, loading, isPublic, setShowLogin]);

  // 로딩 중에도 자식 요소들을 즉시 렌더링하여 흰 화면(지연)을 제거합니다.
  // 리다이렉트 로직은 위의 useEffect에서 loading이 끝난 후 처리됩니다.

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
