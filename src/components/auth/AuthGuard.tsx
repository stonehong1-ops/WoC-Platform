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
    // Sync public routes with PageWrapper to prevent conflicting auth checks
    const isPublic = pathname === '/' || 
                    pathname === '/login' ||
                    pathname === '/app' ||
                    pathname.startsWith('/live') || 
                    pathname.startsWith('/events') || 
                    pathname.startsWith('/social') || 
                    pathname.startsWith('/venues') ||
                    pathname.startsWith('/plaza') ||
                    pathname.startsWith('/explore') ||
                    pathname.startsWith('/class') ||
                    pathname.startsWith('/shop') ||
                    pathname.startsWith('/resale') ||
                    pathname.startsWith('/stay') ||
                    pathname.startsWith('/lost') ||
                    pathname.startsWith('/hub');
    const isSpace = pathname.startsWith('/groups/');

    if (!loading && !isPublic && !isSpace && (!user || !profile?.isRegistered)) {
      setShowLogin(true);
    }
  }, [user, profile, loading, pathname, setShowLogin]);

  return <>{children}</>;
}
