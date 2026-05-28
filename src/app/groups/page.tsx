'use client';

import { Suspense } from 'react';
import GroupsPageContent from './GroupsPageContent';

export default function GroupsDiscoveryPage() {
  return (
    <Suspense fallback={
      <div className="bg-background min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <GroupsPageContent />
    </Suspense>
  );
}
