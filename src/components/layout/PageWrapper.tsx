'use client';

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';

export default function PageWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile, loading, setShowLogin } = useAuth();
  
  const isGallery = pathname.startsWith('/gallery');
  const isVenues = pathname.startsWith('/venues');
  const isEvents = pathname.startsWith('/events');
  const isSocial = pathname.startsWith('/social');
  const isLanding = pathname === '/';
  const isLogin = pathname === '/login';
  
  const isPublic = isLanding || isLogin || isGallery || isVenues || isEvents || isSocial;

  useEffect(() => {
    if (!loading && !isPublic && (!user || !profile?.isRegistered)) {
      setShowLogin(true);
    }
  }, [user, profile, loading, isPublic, setShowLogin]);

  return (
    <main className={(isLanding || isVenues) ? "" : "pt-16 pb-[60px]"}>
      {children}
    </main>
  );
}
