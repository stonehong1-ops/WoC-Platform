'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import AiTryOnStudio from '@/components/tryon/AiTryOnStudio';

function AiTryOnContent() {
  const searchParams = useSearchParams();
  const productId = searchParams.get('productId');

  return <AiTryOnStudio initialProductId={productId} />;
}

export default function AiTryOnPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <svg className="animate-spin h-8 w-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="text-xs font-bold text-outline">Loading...</span>
        </div>
      </div>
    }>
      <AiTryOnContent />
    </Suspense>
  );
}
