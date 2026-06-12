"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import CoverEditor from '@/components/admin/covers/CoverEditor';

export default function AdminCoversPage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  const isSystemOwner = (ownerId?: string) => {
    if (!ownerId) return false;
    const SYSTEM_OWNERS = ["system", "system1", "admin_seeding", "adminstone", "7iaZAmaYY9dNNEShmJmROI8XrtH2"];
    return SYSTEM_OWNERS.includes(ownerId);
  };

  if (loading) return null;

  if (!user || (!profile?.isAdmin && profile?.systemRole !== 'admin' && !isSystemOwner(user.uid))) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center px-4 bg-surface text-on-surface">
        <h1 className="text-2xl font-bold mb-4">접근 권한이 없습니다</h1>
        <p className="text-gray-500 mb-8">관리자 계정으로 로그인해주세요.</p>
        <button 
          onClick={() => router.push('/')}
          className="px-8 py-3 bg-primary text-white rounded-full font-bold"
        >
          홈으로 가기
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => router.push('/profile?tab=admin')}
              className="p-2 -ml-2 rounded-full hover:bg-slate-100 transition-colors"
            >
              <span className="material-symbols-outlined text-slate-600">arrow_back</span>
            </button>
            <h1 className="text-lg font-bold text-slate-800">홍보 표지 제작</h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <CoverEditor />
      </main>
    </div>
  );
}
