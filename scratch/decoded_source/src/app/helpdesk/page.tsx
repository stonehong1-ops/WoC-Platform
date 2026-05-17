'use client';

import HelpDeskView from '@/components/feed/HelpDeskView';
import { Suspense } from 'react';

export default function HelpDeskPage() {
  return (
    <Suspense fallback={<div className="fixed inset-0 bg-white" />}>
      <HelpDeskView />
    </Suspense>
  );
}
