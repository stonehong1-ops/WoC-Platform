'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, profile, loading, setShowLogin } = useAuth();
  const pathname = usePathname();

  useEffect(() => {
    // If we are not on the landing page, and not loading, and not logged in
    // Show the login modal automatically
    const isPublic = pathname === '/' || 
                    pathname.startsWith('/gallery') || 
                    pathname.startsWith('/events') || 
                    pathname.startsWith('/social') || 
                    pathname.startsWith('/venues');

    if (!loading && !isPublic && (!user || !profile?.isRegistered)) {
      setShowLogin(true);
    }
  }, [user, profile, loading, pathname, setShowLogin]);

  return <>{children}</>;
}
