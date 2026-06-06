import React from "react";
import Image from "next/image";
import { Event } from "@/types/event";

interface TodayHeroSectionProps {
  loadingEvents: boolean;
  heroEvents: Event[];
  currentBannerIndex: number;
  setCurrentBannerIndex: React.Dispatch<React.SetStateAction<number>>;
  setHeroEvent: (ev: Event | null) => void;
  openEventModal: (id: string) => void;
  getEventDateRange: (ev: Event) => string;
  getEventDday: (ev: Event) => string;
}

export function getEventTheme(title: string, index: number): string {
  const normalized = title.toLowerCase();
  if (normalized.includes("festival") || normalized.includes("페스티벌")) {
    return "from-[#FF2D55] to-[#FF9500] text-white";
  }
  if (normalized.includes("championship") || normalized.includes("대회") || normalized.includes("선수권")) {
    return "from-[#FF9500] to-[#FFCC00] text-white";
  }
  if (normalized.includes("marathon") || normalized.includes("마라톤")) {
    return "from-[#5856D6] to-[#007AFF] text-white";
  }
  const themes = [
    "from-indigo-600 to-purple-600 text-white",
    "from-rose-500 to-pink-600 text-white",
    "from-emerald-500 to-teal-600 text-white"
  ];
  return themes[index % themes.length];
}

export default function TodayHeroSection({
  loadingEvents,
  heroEvents,
  currentBannerIndex,
  setCurrentBannerIndex,
  setHeroEvent,
  openEventModal,
  getEventDateRange,
  getEventDday
}: TodayHeroSectionProps) {
  if (loadingEvents) {
    return <div className="h-[76px] rounded-2xl bg-slate-200 animate-pulse" />;
  }

  if (heroEvents.length === 0) return null;

  const ev = heroEvents[currentBannerIndex];
  if (!ev) return null;

  return (
    <div className="w-full space-y-2">
      <button
        onClick={() => {
          setHeroEvent(ev);
          openEventModal(ev.id);
        }}
        className={`w-full flex items-center justify-between gap-3 bg-gradient-to-r ${getEventTheme(ev.title, currentBannerIndex)} rounded-2xl px-4 py-3 active:scale-[0.99] transition-all duration-500 text-left relative overflow-hidden`}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0 z-10">
          <div className="w-[52px] h-[52px] rounded-xl overflow-hidden relative bg-white/10 flex-shrink-0">
            {ev.imageUrl ? (
              <Image src={ev.imageUrl} alt={ev.title} fill className="object-cover" sizes="52px" />
            ) : (
              <div className="absolute inset-0 bg-white/10 flex items-center justify-center">
                <span className="material-symbols-outlined !text-[20px] text-white/50">event</span>
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-black text-[13px] text-white leading-tight line-clamp-2">
              {ev.title}
            </p>
            <p className="text-[11px] font-semibold text-white/80 mt-1 truncate">
              {getEventDateRange(ev)}
            </p>
          </div>
        </div>
        {getEventDday(ev) && (
          <div className="flex-shrink-0 ml-1 z-10">
            <span className="bg-white/20 text-white text-[9px] font-black px-1.5 py-0.5 rounded-md leading-none whitespace-nowrap">
              {getEventDday(ev)}
            </span>
          </div>
        )}
      </button>

      {heroEvents.length > 1 && (
        <div className="flex justify-center items-center gap-1.5 py-1">
          {heroEvents.map((_, dotIdx) => (
            <button
              key={dotIdx}
              onClick={() => setCurrentBannerIndex(dotIdx)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                currentBannerIndex === dotIdx ? "w-4 bg-slate-500" : "w-1.5 bg-slate-300"
              }`}
              aria-label={`Go to slide ${dotIdx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
