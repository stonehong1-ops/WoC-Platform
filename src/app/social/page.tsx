'use client';

import { Suspense } from 'react';
import TodayPageContent from '../today/TodayPageContent';

export default function SocialPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center bg-slate-50/50">Loading...</div>}>
      <TodayPageContent />
    </Suspense>
  );
}
