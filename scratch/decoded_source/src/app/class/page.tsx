import React, { Suspense } from 'react';
import ClassPortal from '@/components/class/ClassPortal';

export const metadata = {
  title: 'World Class Portal | WoC',
  description: 'Explore community classes, workshops, and special events across all WoC groups.',
};

export default function ClassPage() {
  return (
    <Suspense fallback={
      <div className="w-full py-20 flex justify-center items-center">
        <span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
      </div>
    }>
      <ClassPortal />
    </Suspense>
  );
}
