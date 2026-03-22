'use client';

import dynamic from 'next/dynamic';
import React from 'react';

// Thin Loader: 실제 무거운 컴포넌트는 클라이언트 사이드에서 동적 로딩
const SocialPageClient = dynamic(() => import('./SocialPageClient'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="animate-pulse text-accent font-medium">Social 로딩 중...</div>
    </div>
  ),
});

export default function SocialPage() {
  return <SocialPageClient />;
}
