'use client';
import { Suspense } from 'react';
import AiLessonHome from '@/components/lesson/AiLessonHome';

export default function AiLessonPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-3 border-[#007AFF] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <AiLessonHome />
    </Suspense>
  );
}
