import React from "react";
import { Event } from "@/types/event";
import { useLanguage } from "@/contexts/LanguageContext";

interface TodayHeroSectionProps {
  loadingEvents: boolean;
  todayActiveEvents: Event[];
  openEventModal: (id: string) => void;
  getEventDateRange: (ev: Event) => string;
  getEventDday: (ev: Event) => string;
  currentFilter?: "all" | "social" | "class" | "practice" | "event";
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
  todayActiveEvents,
  openEventModal,
  getEventDateRange,
  getEventDday,
  currentFilter
}: TodayHeroSectionProps) {
  const { language } = useLanguage();

  if (loadingEvents) {
    return <div className="h-[150px] rounded-2xl bg-slate-200 animate-pulse" />;
  }

  const hasEvents = todayActiveEvents && todayActiveEvents.length > 0;

  if (!hasEvents) {
    if (currentFilter === "event") {
      return (
        <section className="animate-in fade-in duration-300">
          <div className="flex items-center gap-2 mb-3">
            <span className="material-symbols-outlined !text-[20px] text-indigo-500">event</span>
            <span className="text-[15px] font-black text-[#1e293b] tracking-tight">
              {language === "KR" ? "진행 중인 이벤트" : "Ongoing Events"}
            </span>
            <span className="text-[13px] font-bold text-slate-400">0</span>
          </div>
          <div className="flex flex-col items-center justify-center py-8 bg-white rounded-2xl border border-dashed border-slate-200">
            <span className="material-symbols-outlined !text-[32px] text-slate-300 mb-2">event_busy</span>
            <p className="text-[13px] font-semibold text-slate-400">
              {language === "KR" ? "진행 중인 이벤트가 없습니다." : "No ongoing events."}
            </p>
          </div>
        </section>
      );
    }
    return null;
  }

  return (
    <div className="w-full space-y-3 animate-in fade-in duration-300">
      {/* 타이틀 */}
      <div className="flex items-center gap-2 mb-1">
        <span className="material-symbols-outlined !text-[20px] text-indigo-500">event</span>
        <span className="text-[15px] font-black text-[#1e293b] tracking-tight">
          {language === "KR" ? "진행 중인 이벤트" : "Ongoing Events"}
        </span>
        <span className="text-[13px] font-bold text-slate-400">{todayActiveEvents.length}</span>
      </div>

      {todayActiveEvents.map((ev, index) => {
        const dday = getEventDday(ev);
        return (
          <button
            key={ev.id}
            onClick={() => openEventModal(ev.id)}
            className="block w-[calc(100%+32px)] -mx-4 relative shadow-sm text-left active:scale-[0.99] transition-all cursor-pointer bg-slate-900"
          >
            {/* 이미지 */}
            <div className="relative w-full flex items-center justify-center">
              {ev.imageUrl ? (
                <img 
                  src={ev.imageUrl} 
                  alt={ev.title} 
                  className="w-full h-auto object-contain" 
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-[200px] bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                  <span className="material-symbols-outlined text-white/50 !text-[32px]">event</span>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />
            </div>

            {/* 상단 D-day */}
            {dday && (
              <span className="absolute top-3 left-3 bg-rose-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-md leading-none shadow-md">
                {dday}
              </span>
            )}

            {/* 하단 정보 */}
            <div className="absolute bottom-0 left-0 right-0 p-3.5 space-y-0.5 z-10">
              <h4 className="text-white font-black text-[13.5px] leading-tight line-clamp-2">
                {ev.title}
              </h4>
              <p className="text-[10.5px] font-semibold text-white/80">
                {getEventDateRange(ev)}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
