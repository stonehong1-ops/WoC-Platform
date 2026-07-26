'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, profile, loading, setShowLogin } = useAuth();
  const pathname = usePathname();

  useEffect(() => {
    // 🔍 [진단 로그] 세션 유지 상태 모니터링
    console.info("🔍 [AuthGuard Check] state change:", {
      pathname,
      loading,
      hasUser: !!user,
      hasProfile: !!profile,
      isRegistered: profile?.isRegistered,
      uid: user?.uid
    });

    const isPublic = pathname === '/' || 
                    pathname === '/login' ||
                    pathname === '/app' ||
                    pathname.startsWith('/syncfit') ||
                    pathname.startsWith('/pt') ||
                    pathname.startsWith('/yedamche') ||
                    pathname.startsWith('/live') || 
                    pathname.startsWith('/events') || 
                    pathname.startsWith('/social') || 
                    pathname.startsWith('/venues') ||
                    pathname.startsWith('/plaza') ||
                    pathname.startsWith('/explore') ||
                    pathname.startsWith('/class') ||
                    pathname.startsWith('/shop') ||
                    pathname.startsWith('/resale') ||
                    pathname.startsWith('/groups') ||
                    pathname.startsWith('/stay') ||
                    pathname.startsWith('/lost') ||
                    pathname.startsWith('/hub') ||
                    pathname.startsWith('/support') ||
                    pathname.startsWith('/privacy') ||
                    pathname.startsWith('/child-safety') ||
                    pathname.startsWith('/account-deletion') ||
                    pathname.startsWith('/fys');

    // 1. 전체 Auth 및 프로필 로딩이 완료될 때까지 로그인 팝업 트리거를 원천 보류
    if (loading) {
      console.info("🔍 [AuthGuard Check] AuthProvider is loading. Bypassing check.");
      return;
    }

    // 2. 사용자가 로그인한 상태인데 profile 정보가 일시적으로 수립 중이거나 null일 때 발생할 수 있는 레이스 방지
    if (user && !profile) {
      console.info("🔍 [AuthGuard Check] User exists but Profile is not resolved yet. Bypassing check.");
      return;
    }

    // 3. 비공개 경로 접근 시 비로그인 또는 비가입 사용자 검증
    if (!isPublic && (!user || !profile?.isRegistered)) {
      console.warn("🔍 [AuthGuard Check] Protected path access denied. Show Login Modal.", {
        isPublic,
        pathname,
        hasUser: !!user,
        isRegistered: profile?.isRegistered
      });
      setShowLogin(true);
    }
  }, [user, profile, loading, pathname, setShowLogin]);

  return <>{children}</>;
}
