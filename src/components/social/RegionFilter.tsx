'use client';

import React, { useState, useEffect } from 'react';
import { REGIONS } from '@/lib/constants/socialData';
import { cn } from '@/lib/utils';
import { MapPin } from 'lucide-react';

interface RegionFilterProps {
  onRegionChange: (region: string) => void;
  currentRegion: string;
}

export default function RegionFilter({ onRegionChange, currentRegion }: RegionFilterProps) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-2 px-1">
      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 rounded-full text-primary shrink-0 border border-primary/20">
        <MapPin size={14} />
        <span className="text-xs font-bold">지역</span>
      </div>
      {REGIONS.map((region) => (
        <button
          key={region}
          onClick={() => onRegionChange(region)}
          className={cn(
            "px-4 py-1.5 rounded-full text-xs font-medium transition-all shrink-0 whitespace-nowrap border",
            currentRegion === region
              ? "bg-primary text-white border-primary shadow-lg shadow-primary/20"
              : "bg-glass border-glass-border text-muted-foreground hover:border-primary/50"
          )}
        >
          {region}
        </button>
      ))}
    </div>
  );
}
