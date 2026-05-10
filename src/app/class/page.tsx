'use client';

import React, { Suspense } from 'react';
import ClassDetail from '@/components/class/ClassDetail';

export default function ClassPage() {
  return (
    <Suspense fallback={
      <div className="w-full py-20 flex justify-center items-center">
        <span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
      </div>
    }>
      <ClassDetail groupId="freestyle-tango" isModal={false} />
    </Suspense>
  );
}
