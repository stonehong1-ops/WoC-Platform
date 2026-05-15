"use client";

import React, { useMemo } from "react";
import { Social } from "@/types/social";
import { extractPosterData } from "./posterTypes";
import { POSTER_LAYOUTS } from "./PosterLayouts";

interface Props {
  social: Social;
  className?: string; // extra classes for the overlay container
}

/**
 * Renders the saved poster layout overlay on top of the social image.
 * If no posterLayoutId is set or it's "none", renders nothing.
 */
export default function PosterOverlay({ social, className = "" }: Props) {
  const layoutId = social.posterLayoutId;
  const posterData = useMemo(() => extractPosterData(social), [social]);

  if (!layoutId || layoutId === "none") return null;

  const layout = POSTER_LAYOUTS.find((l) => l.id === layoutId);
  if (!layout) return null;

  const Comp = layout.Component;

  return (
    <div className={`absolute inset-0 z-10 pointer-events-none ${className}`} style={{ pointerEvents: "none" }}>
      <div style={{ pointerEvents: "none" }} className="w-full h-full [&_*]:pointer-events-none">
        <Comp d={posterData} />
      </div>
    </div>
  );
}
