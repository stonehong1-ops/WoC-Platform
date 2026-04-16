'use client';

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';

export default function PageWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile, loading, setShowLogin } = useAuth();
  
  const isVenues = pathname.startsWith('/venues');
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

  return (
    <main className={(isLanding || isVenues) ? "" : "pt-16 pb-[60px]"}>
      {children}
    </main>
  );
}
