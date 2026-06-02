"use client";

import React, { useMemo } from "react";
import { Social } from "@/types/social";
import { extractPosterData, getUpcomingDateStr } from "./posterTypes";
import { POSTER_LAYOUTS } from "./PosterLayouts";

interface Props {
  social: Social;
  className?: string;
  targetDate?: Date | string;
}

/**
 * Renders the saved poster layout overlay on top of the social image.
 * If no posterLayoutId is set or it's "none", renders nothing.
 * Mirrors the editor's Floating DJ Badge system for exact fidelity.
 */
export default function PosterOverlay({ social, className = "", targetDate }: Props) {
  const layoutId = social.posterLayoutId;

  const targetDateStr = useMemo(() => {
    if (!targetDate) return undefined;
    if (typeof targetDate === 'string') return targetDate;
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${targetDate.getFullYear()}-${pad(targetDate.getMonth() + 1)}-${pad(targetDate.getDate())}`;
  }, [targetDate]);

  // Resolve live DJ name matching the target date
  const liveDjName = useMemo(() => {
    const baseDjName = (social as any).djName || "";
    
    if (!social.djs || !Array.isArray(social.djs) || social.djs.length === 0) {
      // djs 배열 없거나 비어있음 → social.djName 그대로 사용
      return baseDjName;
    }
    // Determine which date to look up
    let lookup = targetDateStr;
    if (!lookup) {
      if (social.type === "regular" && social.dayOfWeek !== undefined) {
        lookup = getUpcomingDateStr(social.dayOfWeek, social.endTime);
      } else if (social.type === "popup" && social.date) {
        const d = typeof social.date.toDate === 'function' ? social.date.toDate() : new Date(social.date as any);
        const pad = (n: number) => n.toString().padStart(2, '0');
        lookup = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
      }
    }
    if (lookup) {
      const matched = social.djs.find(dj => dj && dj.date === lookup);
      if (matched && matched.djName) return matched.djName;
      // djs 배열은 있지만 해당 날짜 미등록 → 미정
      if (social.type === "regular") return "미정";
    }
    return baseDjName;
  }, [social, targetDateStr]);

  const liveDjPhotoUrl = useMemo(() => (social as any).djPhotoUrl || "", [social]);

  // Poster data — djName cleared so template doesn't double-render;
  // Floating Badge below handles the DJ display (same as editor)
  const posterData = useMemo(() => {
    const base = extractPosterData(social, 'editor');
    return { ...base, djName: "" };
  }, [social]);

  // DJ badge position/size settings saved by editor
  const djPosX: number = (social as any).posterDjPosX !== undefined ? (social as any).posterDjPosX : 50;
  const djPosY: number = (social as any).posterDjPosY !== undefined ? (social as any).posterDjPosY : 85;
  const djSize: number = (social as any).posterDjSize !== undefined ? (social as any).posterDjSize : 48;

  const badgeFontScale = useMemo(() => {
    if (djSize >= 72) return { sub: "text-[7px]", main: "text-[13px]" };
    if (djSize >= 56) return { sub: "text-[6.5px]", main: "text-xs" };
    if (djSize >= 44) return { sub: "text-[6px]", main: "text-[11px]" };
    return { sub: "text-[5.5px]", main: "text-[9px]" };
  }, [djSize]);

  if (!layoutId || layoutId === "none") return null;

  const layout = POSTER_LAYOUTS.find((l) => l.id === layoutId);
  if (!layout) return null;

  const Comp = layout.Component;

  return (
    <div className={`absolute inset-0 z-10 pointer-events-none ${className}`} style={{ pointerEvents: "none" }}>
      <div style={{ pointerEvents: "none" }} className="w-full h-full [&_*]:pointer-events-none">
        <Comp d={posterData} />
      </div>

      {/* Floating DJ Badge — mirrors editor exactly */}
      {liveDjName && (
        <div
          className="absolute flex flex-col items-center gap-1 bg-black/80 backdrop-blur-md rounded-2xl border border-white/25 shadow-2xl pointer-events-none z-30 select-none text-center"
          style={{
            left: `${djPosX}%`,
            top: `${djPosY}%`,
            transform: "translate(-50%, -50%)",
            padding: `${djSize >= 56 ? '8px 12px' : '6px 8px'}`
          }}
        >
          {liveDjPhotoUrl ? (
            <div
              className="rounded-full overflow-hidden border border-white/40 shrink-0 bg-zinc-900 shadow-inner"
              style={{ width: `${djSize}px`, height: `${djSize}px` }}
            >
              <img src={`/api/proxy/image?url=${encodeURIComponent(liveDjPhotoUrl)}`} className="w-full h-full object-cover" alt="" crossOrigin="anonymous" />
            </div>
          ) : (
            <div
              className="rounded-full bg-zinc-800 flex items-center justify-center border border-white/20 shrink-0"
              style={{ width: `${djSize}px`, height: `${djSize}px` }}
            >
              <span className="material-symbols-rounded text-white" style={{ fontSize: `${djSize * 0.45}px` }}>headphones</span>
            </div>
          )}
          <div className="flex flex-col items-center justify-center leading-none mt-1">
            <span className={`${badgeFontScale.sub} tracking-[0.2em] text-zinc-400 font-black uppercase mb-0.5`}>DJ</span>
            <span className={`${badgeFontScale.main} font-black text-white tracking-tight`}>{liveDjName}</span>
          </div>
        </div>
      )}
    </div>
  );
}
