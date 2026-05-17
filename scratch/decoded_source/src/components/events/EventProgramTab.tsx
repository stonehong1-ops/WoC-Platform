"use client";

import React, { useState, useMemo } from "react";
import { Event, EventProgram } from "@/types/event";
import { parseISO } from "date-fns";
import { useLanguage } from "@/contexts/LanguageContext";

interface Props {
  event: Event;
}

export default function EventProgramTab({ event }: Props) {
  const { t } = useLanguage();
  const programs = event.programs || [];
  const viewMode = event.programViewMode || "by_date";

  if (programs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-[#acb3b4]">
        <span className="material-symbols-rounded text-4xl mb-2">event_note</span>
        <p className="text-sm font-bold">{t('event.no_programs_yet')}</p>
        <p className="text-[10px] mt-1">{t('event.organizer_add_soon')}</p>
      </div>
    );
  }

  if (viewMode === "by_category") {
    return <ByCategoryView programs={programs} currency={event.pricing?.currency || "KRW"} />;
  }

  return <ByDateView programs={programs} currency={event.pricing?.currency || "KRW"} />;
}

// ========================================
// View Mode A: By Date (단기 이벤트)
// ========================================
function ByDateView({ programs, currency }: { programs: EventProgram[]; currency: string }) {
  const { t, formatDate } = useLanguage();
  // 모든 unique 날짜 추출
  const allDates = useMemo(() => {
    const dateSet = new Set<string>();
    programs.forEach(p => p.dates.forEach(d => dateSet.add(d)));
    return Array.from(dateSet).sort();
  }, [programs]);

  const [selectedDate, setSelectedDate] = useState<string>(allDates[0] || "");

  const dayPrograms = useMemo(() => {
    return programs
      .filter(p => p.dates.includes(selectedDate))
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [programs, selectedDate]);

  return (
    <div className="pb-8">
      {/* Day Tabs */}
      <div className="flex gap-2 px-4 pt-4 pb-3 overflow-x-auto no-scrollbar">
        {allDates.map((d) => {
          const dt = parseISO(d);
          const isActive = d === selectedDate;
          return (
            <button key={d} onClick={() => setSelectedDate(d)}
              className={`flex-shrink-0 flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl border transition-all ${
                isActive
                  ? "bg-primary text-white border-primary shadow-md"
                  : "bg-white text-[#596061] border-[#e0e4e5] hover:bg-[#f2f4f4]"
              }`}>
              <span className="text-[9px] font-black uppercase tracking-wider">{formatDate(dt, "shortWeekday")}</span>
              <span className="text-lg font-black">{formatDate(dt, "dayOnly")}</span>
              <span className="text-[8px] font-bold uppercase">{formatDate(dt, "shortMonth")}</span>
            </button>
          );
        })}
      </div>

      {/* Programs for the selected day */}
      <div className="px-4 space-y-3">
        {dayPrograms.length === 0 ? (
          <div className="text-center py-8 text-[#acb3b4]">
            <p className="text-xs font-bold">{t('event.no_events_day')}</p>
          </div>
        ) : (
          dayPrograms.map(p => <ProgramCard key={p.id} program={p} currency={currency} />)
        )}
      </div>
    </div>
  );
}

// ========================================
// View Mode B: By Category (장기 시리즈)
// ========================================
function ByCategoryView({ programs, currency }: { programs: EventProgram[]; currency: string }) {
  const { t } = useLanguage();
  const categories = useMemo(() => {
    const catMap: Record<string, EventProgram[]> = {};
    programs.forEach(p => {
      const cat = p.category || "General";
      if (!catMap[cat]) catMap[cat] = [];
      catMap[cat].push(p);
    });
    return Object.entries(catMap);
  }, [programs]);

  const [selectedCat, setSelectedCat] = useState<string>(categories[0]?.[0] || "");

  const catPrograms = categories.find(([c]) => c === selectedCat)?.[1] || [];
  const catMeta = catPrograms[0]; // Use first program for category-level meta

  return (
    <div className="pb-8">
      {/* Category Tabs */}
      <div className="flex gap-2 px-4 pt-4 pb-3 overflow-x-auto no-scrollbar">
        {categories.map(([cat, progs]) => {
          const isActive = cat === selectedCat;
          return (
            <button key={cat} onClick={() => setSelectedCat(cat)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl border transition-all text-xs font-bold ${
                isActive
                  ? "bg-primary text-white border-primary shadow-md"
                  : "bg-white text-[#596061] border-[#e0e4e5] hover:bg-[#f2f4f4]"
              }`}>
              {cat}
              <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-black ${
                isActive ? "bg-white/20 text-white" : "bg-[#f2f4f4] text-[#acb3b4]"
              }`}>{progs.length}</span>
            </button>
          );
        })}
      </div>

      {/* Category Info */}
      {catMeta && (
        <div className="mx-4 mb-3 flex items-center gap-2 flex-wrap">
          {catMeta.maxParticipants > 0 && (
            <span className="text-[10px] font-bold text-[#596061] bg-[#f2f4f4] px-2 py-1 rounded-full">
              👥 {catMeta.maxParticipants} {catMeta.capacityUnit === "couple" ? t('event.couples') : t('event.people')}
            </span>
          )}
          {catMeta.format && (
            <span className="text-[10px] font-bold text-[#596061] bg-[#f2f4f4] px-2 py-1 rounded-full">
              {catMeta.format === "partner_change" ? `🔄 ${t('event.partner_change')}` : catMeta.format === "solo" ? `🧑 ${t('event.solo')}` : `👫 ${t('event.fixed_partner')}`}
            </span>
          )}
          {catMeta.duration && (
            <span className="text-[10px] font-bold text-[#596061] bg-[#f2f4f4] px-2 py-1 rounded-full">
              ⏱ {catMeta.duration} min
            </span>
          )}
        </div>
      )}

      {/* Programs in the category */}
      <div className="px-4 space-y-3">
        {catPrograms.map(p => <ProgramCard key={p.id} program={p} currency={currency} showDates />)}
      </div>
    </div>
  );
}

// ========================================
// Shared Program Card
// ========================================
function ProgramCard({ program: p, currency, showDates }: { program: EventProgram; currency: string; showDates?: boolean }) {
  const { t, formatDate } = useLanguage();
  const isMilonga = p.type === "milonga";

  return (
    <div className={`border rounded-2xl overflow-hidden transition-all ${
      isMilonga ? "border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50" : "border-[#e0e4e5] bg-white"
    }`}>
      <div className="px-4 py-3">
        {/* Top Row: ID + Time */}
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
              isMilonga ? "bg-amber-500 text-white" : "bg-primary/10 text-primary"
            }`}>{p.id}</span>
            {p.isRecommended && (
              <span className="text-[9px] font-bold text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded-md">⭐ {t('event.recommended')}</span>
            )}
          </div>
          <span className="text-[11px] font-bold text-[#acb3b4]">{p.startTime} – {p.endTime}</span>
        </div>

        {/* Title */}
        <h3 className={`text-sm font-black ${isMilonga ? "text-amber-900" : "text-[#2d3435]"}`}>{p.title}</h3>
        {p.titleNative && <p className="text-[10px] font-bold text-[#acb3b4] mt-0.5">{p.titleNative}</p>}

        {/* Description */}
        {p.description && <p className="text-[11px] text-[#596061] mt-1.5 leading-relaxed">{p.description}</p>}

        {/* Instructor / DJ */}
        {p.instructor && (
          <div className="flex items-center gap-1.5 mt-2">
            <span className="material-symbols-rounded text-sm text-[#acb3b4]">person</span>
            <span className="text-[10px] font-bold text-[#596061]">{p.instructor}</span>
          </div>
        )}
        {p.djName && (
          <div className="flex items-center gap-1.5 mt-2">
            <span className="material-symbols-rounded text-sm text-amber-500">headphones</span>
            <span className="text-[10px] font-bold text-amber-700">DJ: {p.djName}</span>
          </div>
        )}
        {p.performanceTime && (
          <div className="flex items-center gap-1.5 mt-1">
            <span className="material-symbols-rounded text-sm text-amber-500">star</span>
            <span className="text-[10px] font-bold text-amber-700">{p.performanceTime}</span>
          </div>
        )}

        {/* Dates (for category view) */}
        {showDates && p.dates.length > 0 && (
          <div className="mt-2 flex items-center gap-1 flex-wrap">
            <span className="material-symbols-rounded text-sm text-[#acb3b4]">event</span>
            <span className="text-[10px] text-[#acb3b4]">
              {p.dates.map(d => formatDate(parseISO(d), "shortMonthDay")).join(", ")}
            </span>
          </div>
        )}

        {/* Price + Level */}
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          {p.price && (
            <span className="text-[10px] font-black text-primary bg-primary/10 px-2 py-1 rounded-full">
              {p.price.toLocaleString()} {currency} {p.priceUnit === "per_session" ? `/${t('event.class')}` : ""}
            </span>
          )}
          {p.level && (
            <span className="text-[10px] font-bold text-[#596061] bg-[#f2f4f4] px-2 py-1 rounded-full">
              {p.level === "adv" ? t('event.level_advanced') : p.level === "intermediate" ? t('event.level_intermediate') : t('event.level_all')}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
