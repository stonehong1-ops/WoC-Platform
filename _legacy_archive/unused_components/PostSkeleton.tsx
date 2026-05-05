import React from 'react';

export default function PostSkeleton() {
  return (
    <div className="bg-surface rounded-[32px] overflow-hidden shadow-sm animate-pulse">
      {/* Header Skeleton */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-100 shrink-0" />
          <div className="space-y-2">
            <div className="w-24 h-3 bg-gray-100 rounded-full" />
            <div className="w-16 h-2 bg-gray-50 rounded-full" />
          </div>
        </div>
      </div>

      {/* Media Skeleton */}
      <div className="aspect-[4/3] bg-gray-50" />

      {/* Content Skeleton */}
      <div className="p-6 space-y-3">
        <div className="w-full h-3 bg-gray-100 rounded-full" />
        <div className="w-4/5 h-3 bg-gray-100 rounded-full" />
        
        {/* Interaction Bar Skeleton */}
        <div className="flex items-center gap-6 mt-6 pt-6 border-t border-gray-50">
          <div className="w-12 h-4 bg-gray-50 rounded-full" />
          <div className="w-12 h-4 bg-gray-50 rounded-full" />
        </div>
      </div>
    </div>
  );
}
