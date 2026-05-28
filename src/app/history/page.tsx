"use client";

import React, { Suspense } from 'react';
import { HistoryPageContent } from './HistoryPageContent';

export default function HistoryPage() {
  return (
    <Suspense fallback={
      <div className="bg-background min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <HistoryPageContent />
    </Suspense>
  );
}
