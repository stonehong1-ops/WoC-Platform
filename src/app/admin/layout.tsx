"use client";

import React, { useEffect } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { useRouter } from 'next/navigation';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!profile || !profile.isAdmin) {
        router.replace('/');
      }
    }
  }, [profile, loading, router]);

  if (loading || !profile?.isAdmin) {
    return <div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>;
  }

  return <>{children}</>;
}
