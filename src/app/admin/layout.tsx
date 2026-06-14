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

  return <>{children}</>;
}
