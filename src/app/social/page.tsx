'use client';

import { Suspense } from 'react';
import SocialPageContent from './SocialPageContent';

export default function SocialPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center bg-slate-50/50">Loading...</div>}>
      <SocialPageContent />
    </Suspense>
  );
}
