'use client';

import React from 'react';

export type HorizontalScrollerProps = {
  children: React.ReactNode;
  className?: string;
};

export default function HorizontalScroller({
  children,
  className = ''
}: HorizontalScrollerProps) {
  return (
    <div className={`flex overflow-x-auto gap-4 no-scrollbar pb-2 -mx-5 px-5 ${className}`}>
      {children}
    </div>
  );
}
