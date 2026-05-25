'use client';

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';

export default function PageWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile, loading, setShowLogin } = useAuth();
  
  const isLive = pathname.startsWith('/live');
  const isVenues = pathname.startsWith('/venues');
  const isEvents = pathname.startsWith('/events');
  const isSocial = pathname.startsWith('/social');
  const isLanding = pathname === '/';
  const isLogin = pathname === '/login';
  const isApp = pathname === '/app';
  const isSpace = pathname.startsWith('/groups/');
  const isPlaza = pathname.startsWith('/plaza');
  const isExplore = pathname.startsWith('/explore');
  const isNation = pathname.startsWith('/class') || pathname.startsWith('/shop') || pathname.startsWith('/resale') || pathname.startsWith('/stay') || pathname.startsWith('/lost') || pathname.startsWith('/hub');
  
  const isPublic = isLanding || isLogin || isApp || isLive || isVenues || isEvents || isSocial || isPlaza || isExplore || isNation;

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Strict PWA Standalone Mode Check
    const isGatewayPath = pathname === '/' || pathname === '/login' || pathname === '/app';

    if (!loading && !isPublic && !isSpace && (!user || !profile?.isRegistered)) {
      setShowLogin(true);
    }
  }, [user, profile, loading, isPublic, isSpace, pathname, router, setShowLogin]);

  return (
    <>
      {children}
    </>
  );
}

