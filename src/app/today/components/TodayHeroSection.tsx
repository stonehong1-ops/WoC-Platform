import React, { useState, useEffect } from "react";
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
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // 이벤트 데이터 변경 시 인덱스 바운더리 체크
  useEffect(() => {
    if (currentIndex >= todayActiveEvents.length) {
      setCurrentIndex(0);
    }
  }, [todayActiveEvents, currentIndex]);

  // 배너 자동 롤링 타이머 (4초)
  useEffect(() => {
    if (todayActiveEvents.length <= 1) return;
    const interval = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % todayActiveEvents.length);
        setIsTransitioning(false);
      }, 300); // fade out transition duration
    }, 4000);
    return () => clearInterval(interval);
  }, [todayActiveEvents.length]);

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

  const activeIndex = currentIndex < todayActiveEvents.length ? currentIndex : 0;
  const ev = todayActiveEvents[activeIndex];
  const dday = getEventDday(ev);

  if (currentFilter === "event") {
    return (
      <div className="w-full space-y-4 animate-in fade-in duration-300">
        {/* 타이틀 */}
        <div className="flex items-center gap-2 mb-1">
          <span className="material-symbols-outlined !text-[20px] text-indigo-500">event</span>
          <span className="text-[15px] font-black text-[#1e293b] tracking-tight">
            {language === "KR" ? "진행 중인 이벤트" : "Ongoing Events"}
          </span>
          <span className="text-[13px] font-bold text-slate-400">{todayActiveEvents.length}</span>
        </div>

        <div className="space-y-4">
          {todayActiveEvents.map(item => {
            const itemDday = getEventDday(item);
            return (
              <button
                key={item.id}
                onClick={() => openEventModal(item.id)}
                className="block w-full relative shadow-md text-left active:scale-[0.99] transition-all cursor-pointer bg-slate-900 overflow-hidden h-[160px] xs:h-[180px] rounded-2xl"
              >
                <div className="relative w-full h-full flex items-center justify-center">
                  {item.imageUrl ? (
                    <img 
                      src={item.imageUrl} 
                      alt={language === "KR" && item.titleNative ? item.titleNative : item.title} 
                      className="w-full h-full object-cover" 
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                      <span className="material-symbols-outlined text-white/50 !text-[32px]">event</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent pointer-events-none" />
                </div>

                {itemDday && (
                  <span className="absolute top-3 left-3 bg-rose-600 text-white text-[10px] font-black px-2 py-0.5 rounded-lg leading-none shadow-md">
                    {itemDday}
                  </span>
                )}

                <div className="absolute bottom-0 left-0 right-0 p-4 pr-16 space-y-1 z-10">
                  <h4 className="text-white font-black text-[16px] leading-tight line-clamp-1">
                    {language === "KR" && item.titleNative ? item.titleNative : item.title}
                  </h4>
                  <p className="text-[12px] font-semibold text-white/80 line-clamp-1">
                    {getEventDateRange(item)}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
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

      <button
        onClick={() => openEventModal(ev.id)}
        className="block w-full relative shadow-sm text-left active:scale-[0.99] transition-all cursor-pointer bg-slate-900 overflow-hidden h-[90px] xs:h-[105px] md:h-[120px] rounded-2xl"
      >
        <div className={`relative w-full h-full transition-opacity duration-300 ${isTransitioning ? "opacity-0" : "opacity-100"}`}>
          {/* 이미지 */}
          <div className="relative w-full h-full flex items-center justify-center">
            {ev.imageUrl ? (
              <img 
                src={ev.imageUrl} 
                alt={language === "KR" && ev.titleNative ? ev.titleNative : ev.title} 
                className="w-full h-full object-cover" 
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <span className="material-symbols-outlined text-white/50 !text-[32px]">event</span>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent pointer-events-none" />
          </div>

          {/* 상단 D-day */}
          {dday && (
            <span className="absolute top-2.5 left-2.5 bg-rose-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-md leading-none shadow-md">
              {dday}
            </span>
          )}

          {/* 하단 정보 */}
          <div className="absolute bottom-0 left-0 right-0 p-3 pr-20 space-y-0.5 z-10">
            <h4 className="text-white font-black text-[13px] leading-tight line-clamp-1">
              {language === "KR" && ev.titleNative ? ev.titleNative : ev.title}
            </h4>
            <p className="text-[10px] font-semibold text-white/80 line-clamp-1">
              {getEventDateRange(ev)}
            </p>
          </div>
        </div>

        {/* 인디케이터 도트 */}
        {todayActiveEvents.length > 1 && (
          <div className="absolute bottom-3 right-3 flex items-center gap-1.5 z-20">
            {todayActiveEvents.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === activeIndex ? "w-3 bg-indigo-500" : "w-1.5 bg-white/40"
                }`}
              />
            ))}
          </div>
        )}
      </button>
    </div>
  );
}
