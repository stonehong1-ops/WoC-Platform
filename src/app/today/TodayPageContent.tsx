"use client";

import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useModalNavigation } from "@/hooks/useModalNavigation";
import { useLanguage } from "@/contexts/LanguageContext";
import { useLocation } from "@/components/providers/LocationProvider";
import { socialService } from "@/lib/firebase/socialService";
import { eventService } from "@/lib/firebase/eventService";
import { groupService } from "@/lib/firebase/groupService";
import { db } from "@/lib/firebase/clientApp";
import { collection, getDocs } from "firebase/firestore";
import { Social } from "@/types/social";
import { Event } from "@/types/event";
import { GroupClass } from "@/types/group";
import { detectSeoulDistrict, getDjDisplay, getVenueDisplay } from "@/app/social/constants/seoulRegions";
import SocialViewer from "@/components/social/SocialViewer";
import ClassDetail from "@/components/class/ClassDetail";
import EventViewer from "@/components/events/EventViewer";

// ── helpers ───────────────────────────────────────────────────────────────────

function getWeekDates(baseDate: Date, weekOffset: number = 0): Date[] {
  const day = baseDate.getDay();
  const monday = new Date(baseDate);
  monday.setDate(baseDate.getDate() - ((day + 6) % 7) + weekOffset * 7);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function getDayLabel(locale: string, d: Date): string {
  const ko = ["월", "화", "수", "목", "금", "토", "일"];
  const en = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const idx = (d.getDay() + 6) % 7;
  return locale === "KR" ? ko[idx] : en[idx];
}

function toJsDate(ts: any): Date {
  if (!ts) return new Date(0);
  if (typeof ts.toDate === "function") return ts.toDate();
  if (ts.seconds) return new Date(ts.seconds * 1000);
  return new Date(ts);
}

function parseDateStr(date: any): string {
  if (!date) return "";
  if (typeof date === "string") return date.trim();
  if (typeof date.toDate === "function") {
    const d = date.toDate();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }
  if (date.seconds) {
    const d = new Date(date.seconds * 1000);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }
  return "";
}

function normalizeDateStr(dStr: string): Date | null {
  if (!dStr) return null;
  const normalized = dStr.replace(/[.\\/]/g, "-").replace(/\s+/g, "");
  const parts = normalized.split("-");
  let y: string, m: string, d: string;
  if (parts.length >= 3) {
    y = parts[0].length === 2 ? `20${parts[0]}` : parts[0];
    m = parts[1].padStart(2, "0");
    d = parts[2].padStart(2, "0");
  } else if (parts.length === 2) {
    y = new Date().getFullYear().toString();
    m = parts[0].padStart(2, "0");
    d = parts[1].padStart(2, "0");
  } else {
    return null;
  }
  return new Date(`${y}-${m}-${d}T00:00:00`);
}

const isDaySocial = (s: Social) => {
  const hour = parseInt((s.startTime || "19:00").split(":")[0]);
  return !isNaN(hour) && hour < 18;
};

// ── Section Header ────────────────────────────────────────────────────────────

function SectionHeader({ icon, label, count }: {
  icon: string; label: string; count: number;
}) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="material-symbols-outlined !text-[20px] text-slate-500">{icon}</span>
      <span className="text-[15px] font-black text-[#1e293b] tracking-tight">{label}</span>
      {count > 0 && (
        <span className="text-[13px] font-bold text-slate-400">{count}</span>
      )}
    </div>
  );
}

// ── Social Card (3열용) ───────────────────────────────────────────────────────

function SocialCard({ social, date, venuesMap, onPress }: {
  social: Social; date: Date; venuesMap: Record<string, any>; onPress: () => void;
}) {
  const { language } = useLanguage();
  const djName = getDjDisplay(social, date);
  const isOrg = !djName || djName === "TBD" || djName === "TBA";
  const djDisplay = isOrg
    ? (social.organizerNameNative || social.organizerName || "")
    : `DJ ${djName}`;

  // venuesMap 기반 실시간 한글 장소명 추출 시도
  const venue = getVenueDisplay(social, language, venuesMap);

  // 8글자로 대폭 늘려서 장소 공간 확보
  const shortVenue = venue.length > 8 ? venue.slice(0, 8) + "…" : venue;
  const isDay = isDaySocial(social);

  return (
    <button onClick={onPress} className="block w-full rounded-xl overflow-hidden relative shadow-sm text-left" style={{ aspectRatio: "3/4" }}>
      <div className="absolute inset-0 bg-[#12121e]">
        {social.imageUrl && (
          <Image src={social.imageUrl} alt={social.title} fill className="object-cover opacity-70" sizes="33vw" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
      </div>
      {/* 배지 세로 적층 (좌상단) */}
      <div className="absolute top-2 left-2 flex flex-col gap-1 items-start">
        <span className="bg-black/60 backdrop-blur-sm text-white text-[9px] font-black px-1.5 py-0.5 rounded-full leading-none">
          {social.startTime || "—"}
        </span>
        {isDay && (
          <span className="bg-amber-400 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full leading-none">낮밀</span>
        )}
        {social.type === "popup" && (
          <span className="bg-rose-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded-lg leading-none uppercase tracking-wide shadow-md">
            POPUP
          </span>
        )}
      </div>
      {/* 우상단 장소 칩 - max-w-[85px]로 넉넉하게 확장 */}
      {shortVenue && (
        <span className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-white text-[8px] font-black px-1.5 py-0.5 rounded-full leading-none shadow-sm max-w-[85px] truncate">
          {shortVenue}
        </span>
      )}
      {/* 하단 정보 */}
      <div className="absolute bottom-0 left-0 right-0 p-2 space-y-0.5">
        <p className="text-white font-black text-[12px] leading-tight line-clamp-2">
          {social.titleNative || social.title}
        </p>
        {djDisplay && (
          <p className={`text-[10px] font-semibold truncate ${isOrg ? "text-amber-300" : "text-white/70"}`}>
            {isOrg ? "org " : ""}{djDisplay}
          </p>
        )}
      </div>
    </button>
  );
}

// ── Class Card (3열용) ────────────────────────────────────────────────────────

function ClassCard({ cls, timeSlot, onPress }: { cls: GroupClass; timeSlot: string; onPress: () => void }) {
  const [imageError, setImageError] = useState(false);
  const getInstructorsLabel = (instructors: any[]) => {
    if (!instructors || instructors.length === 0) return '';
    if (instructors.length === 1) return instructors[0].name || '';
    if (instructors.length === 2) return `${instructors[0].name}, ${instructors[1].name}`;
    return `${instructors[0].name}, ${instructors[1].name}, ...`;
  };

  const hasImage = cls.imageUrl && !imageError;

  return (
    <button onClick={onPress} className="block w-full text-left">
      <div className="relative rounded-xl overflow-hidden bg-[#1a1a2e] shadow-md" style={{ aspectRatio: "1/1" }}>
        {hasImage ? (
          <Image 
            src={cls.imageUrl || ""} 
            alt={cls.title} 
            fill 
            className="object-cover opacity-75" 
            sizes="33vw" 
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 to-purple-900 flex items-center justify-center">
            <span className="material-symbols-outlined text-white/10 text-5xl">school</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
        {timeSlot && (
          <div className="absolute top-2 left-2">
            <span className="bg-[#007AFF]/80 backdrop-blur-sm text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">
              {timeSlot}
            </span>
          </div>
        )}
        <div className="absolute bottom-0 left-0 right-0 p-2">
          <p className="text-white font-black text-[11px] leading-tight line-clamp-2">{cls.title}</p>
          {cls.instructors && cls.instructors.length > 0 && (
            <p className="text-white/60 text-[10px] font-semibold mt-0.5 truncate">
              {getInstructorsLabel(cls.instructors)}
            </p>
          )}
        </div>
      </div>
    </button>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

interface ClassEntry {
  cls: GroupClass;
  timeSlot: string;
}

export default function TodayPageContent() {
  const { t, language } = useLanguage();
  const { location } = useLocation();

  const today = new Date();
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const weekDates = getWeekDates(today, weekOffset);

  const [socials, setSocials] = useState<Social[]>([]);
  const [venuesMap, setVenuesMap] = useState<Record<string, any>>({});
  const [heroEvents, setHeroEvents] = useState<Event[]>([]);
  const [heroEvent, setHeroEvent] = useState<Event | null>(null);
  const [allClasses, setAllClasses] = useState<{ cls: GroupClass }[]>([]);
  const [loadingSocials, setLoadingSocials] = useState(true);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [loadingClasses, setLoadingClasses] = useState(true);

  const router = useRouter();

  // 3대 모달 히스토리 훅 정의
  const { value: viewSocialId, openModal: openSocialModal, closeModal: closeSocialModal } = useModalNavigation("viewSocial");
  const { value: viewClassId, openModal: openClassModal, closeModal: closeClassModal } = useModalNavigation("viewClass");
  const { value: viewEventId, openModal: openEventModal, closeModal: closeEventModal } = useModalNavigation("viewEvent");

  // 실시간 URL 싱크 데이터 바인딩 (소셜 & 이벤트)
  const selectedSocial = useMemo(() => {
    if (!viewSocialId) return null;
    return socials.find(s => s.id === viewSocialId) || null;
  }, [viewSocialId, socials]);

  const showEventViewer = useMemo(() => {
    return !!viewEventId && heroEvent?.id === viewEventId;
  }, [viewEventId, heroEvent]);

  // 주 이동
  const handleWeekNav = (dir: 1 | -1) => {
    setWeekOffset(prev => prev + dir);
    setSelectedDate(prev => {
      const d = new Date(prev);
      d.setDate(d.getDate() + dir * 7);
      return d;
    });
  };

  // Venues (한 번만 fetch — seoulArea 기반 구분에 사용)
  useEffect(() => {
    getDocs(collection(db, "venues")).then(snap => {
      const map: Record<string, any> = {};
      snap.docs.forEach(d => { map[d.id] = { id: d.id, ...d.data() }; });
      setVenuesMap(map);
    }).catch(() => {});
  }, []);

  // Socials
  useEffect(() => {
    setLoadingSocials(true);
    socialService.getTodayActiveSocials(selectedDate.getDay(), selectedDate).then((data) => {
      setSocials(data);
      setLoadingSocials(false);
    });
  }, [selectedDate]);

  // 날짜 범위 다국어 로케일 포맷팅 헬퍼
  const getEventDateRange = (ev: Event) => {
    if (!ev.startDate) return "";
    const start = toJsDate(ev.startDate);
    const end = ev.endDate ? toJsDate(ev.endDate) : null;

    const fmt = (d: Date) => {
      if (language === "KR") {
        const months = ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"];
        const days = ["일", "월", "화", "수", "목", "금", "토"];
        return `${months[d.getMonth()]} ${d.getDate()}일 (${days[d.getDay()]})`;
      } else {
        return d.toLocaleDateString("en-US", { month: "short", day: "numeric", weekday: "short" });
      }
    };

    return end ? `${fmt(start)} – ${fmt(end)}` : fmt(start);
  };

  // D-Day 계산 헬퍼
  const getEventDday = (ev: Event) => {
    if (!ev.endDate && !ev.startDate) return "";
    const end = toJsDate(ev.endDate || ev.startDate);
    const diff = Math.ceil((end.getTime() - Date.now()) / 86400000);
    if (diff < 0) return "";
    if (diff === 0) return "D-Day";
    return `D-${diff}`;
  };

  // Hero Events (최근 5개 탱고 이벤트 로드)
  useEffect(() => {
    setLoadingEvents(true);
    const now = new Date();
    getDocs(collection(db, "events")).then(snap => {
      const allEv = snap.docs.map(d => ({ id: d.id, ...d.data() }) as Event);
      const matchesSociety = (e: Event) => !e.societyId || e.societyId === 'tango';
      const isActive = (e: Event) => {
        const start = toJsDate(e.startDate).getTime();
        const end = toJsDate(e.endDate || e.startDate).getTime();
        const t = now.getTime();
        return end >= t || start >= t;
      };

      const filtered = allEv.filter(e => matchesSociety(e) && isActive(e));
      filtered.sort((a, b) => toJsDate(a.startDate).getTime() - toJsDate(b.startDate).getTime());
      
      const top5 = filtered.slice(0, 5);
      setHeroEvents(top5);
      if (top5.length > 0) {
        setHeroEvent(top5[0]); // 모달 상세 뷰어 및 기존 단일 호환성 유지
      } else {
        setHeroEvent(null);
      }
      setLoadingEvents(false);
    }).catch(() => {
      setLoadingEvents(false);
    });
  }, []);

  // Classes
  useEffect(() => {
    setLoadingClasses(true);
    groupService.getGlobalClassesAll()
      .then((data) => {
        setAllClasses(data.map(cls => ({ cls })));
        setLoadingClasses(false);
      })
      .catch(() => setLoadingClasses(false));
  }, []);

  // 클래스 필터링
  const filteredClasses = useMemo(() => {
    const targetStr = selectedDate.toDateString();
    const result: ClassEntry[] = [];
    allClasses.forEach(({ cls }) => {
      if (cls.status !== "Open") return;
      cls.schedule?.forEach((s: any) => {
        const dStr = parseDateStr(s.date);
        const clsDate = normalizeDateStr(dStr);
        if (clsDate && clsDate.toDateString() === targetStr) {
          const actualTimeSlot = s.timeSlot || cls.startTime || "";
          const exists = result.some(r => r.cls.id === cls.id && r.timeSlot === actualTimeSlot);
          if (!exists) {
            result.push({ 
              cls, 
              timeSlot: actualTimeSlot 
            });
          }
        }
      });
    });
    result.sort((a, b) => a.timeSlot.localeCompare(b.timeSlot));
    return result;
  }, [allClasses, selectedDate]);

  // 실시간 URL 싱크 데이터 바인딩 (클래스)
  const selectedClass = useMemo(() => {
    if (!viewClassId) return null;
    return filteredClasses.find(c => c.cls.id === viewClassId)?.cls || null;
  }, [viewClassId, filteredClasses]);

  // location.city 기준 필터링
  const locationFilteredSocials = useMemo(() => {
    if (!location || location.city === "ALL") return socials;
    const lc = location.city.toLowerCase().trim();
    const seoulAlias = ["seoul", "서울", "soul"];
    const isSeoul = seoulAlias.some(a => lc.includes(a) || a.includes(lc));
    return socials.filter(s => {
      if (!s.city) return true;
      const sc = s.city.toLowerCase().trim();
      if (isSeoul) return seoulAlias.some(a => sc.includes(a) || a.includes(sc));
      return sc.includes(lc) || lc.includes(sc);
    });
  }, [socials, location]);

  const milongas = locationFilteredSocials.filter((s) => s.subCategory !== "practica");
  const practicas = locationFilteredSocials.filter((s) => s.subCategory === "practica");

  // ── 소셜 페이지와 동일한 홍대/강남 + 낮밀 그룹핑 로직 ──
  const milongasByDistrict = useMemo(() => {
    const isSeoul = location.city === "SEOUL";
    const grouped: Record<string, Social[]> = {};

    if (isSeoul) {
      // 1단계: detectSeoulDistrict로 구역별 분류
      const preGrouped: Record<string, Social[]> = {};
      milongas.forEach(s => {
        const dist = detectSeoulDistrict(s, language, venuesMap);
        if (!preGrouped[dist]) preGrouped[dist] = [];
        preGrouped[dist].push(s);
      });

      // 2단계: 낮밀/저녁밀 분리
      Object.keys(preGrouped).forEach(dist => {
        const list = preGrouped[dist];
        const hasDaySocial = list.some(s => isDaySocial(s));

        if (hasDaySocial) {
          const dayList = list.filter(s => isDaySocial(s));
          const nightList = list.filter(s => !isDaySocial(s));
          if (dayList.length > 0) grouped[`${dist} - ${t("social.timeline_day")}`] = dayList;
          if (nightList.length > 0) grouped[`${dist} - ${t("social.timeline_night")}`] = nightList;
        } else {
          grouped[dist] = list;
        }
      });
    } else {
      // 서울 외 지역: 단일 그룹
      if (milongas.length > 0) grouped[location.city || ""] = milongas;
    }

    // 각 그룹 startTime 오름차순 정렬
    Object.keys(grouped).forEach(key => {
      grouped[key].sort((a, b) => (a.startTime || "00:00").localeCompare(b.startTime || "00:00"));
    });

    // 강북(홍대) → 강남, 낮 → 저녁 순 정렬
    const sorted = Object.entries(grouped).sort(([a], [b]) => {
      const aGangbuk = a.includes("한강위") || a.includes("홍대") || a.includes("Hongdae");
      const bGangbuk = b.includes("한강위") || b.includes("홍대") || b.includes("Hongdae");
      if (aGangbuk && !bGangbuk) return -1;
      if (!aGangbuk && bGangbuk) return 1;
      const aDay = a.includes("낮") || a.includes("Day");
      const bDay = b.includes("낮") || b.includes("Day");
      if (aDay && !bDay) return -1;
      if (!aDay && bDay) return 1;
      return a.localeCompare(b);
    });

    return sorted;
  }, [milongas, language, venuesMap, location, t]);

  // 이벤트 D-day
  const eventDday = (() => {
    if (!heroEvent?.endDate && !heroEvent?.startDate) return "";
    const end = toJsDate(heroEvent.endDate || heroEvent.startDate);
    const diff = Math.ceil((end.getTime() - Date.now()) / 86400000);
    if (diff < 0) return "";
    if (diff === 0) return "D-Day";
    return `D-${diff}`;
  })();

  const eventStart = heroEvent?.startDate ? toJsDate(heroEvent.startDate) : null;
  const eventEnd = heroEvent?.endDate ? toJsDate(heroEvent.endDate) : null;
  const fmt = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric", weekday: "short" });
  const eventDateRange = eventStart ? (eventEnd ? `${fmt(eventStart)} – ${fmt(eventEnd)}` : fmt(eventStart)) : "";

  const weekRangeLabel = (() => {
    if (weekDates.length === 0) return "";
    const first = weekDates[0];
    const last = weekDates[6];
    return `${first.getMonth() + 1}/${first.getDate()} – ${last.getMonth() + 1}/${last.getDate()}`;
  })();

  return (
    <div className="min-h-screen bg-[#f5f7fa]">

      {/* ── 요일 탭바 (이전/다음 주 네비) ── */}
      <div className="bg-white border-b border-slate-100/80 px-1 py-2">
        <div className="flex items-center gap-0.5">
          <button
            onClick={() => handleWeekNav(-1)}
            className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 active:scale-90 transition-all"
          >
            <span className="material-symbols-outlined !text-[20px]">chevron_left</span>
          </button>

          {weekDates.map((d, idx) => {
            const isToday = d.toDateString() === today.toDateString();
            const isSelected = d.toDateString() === selectedDate.toDateString();
            const isSat = (d.getDay() + 6) % 7 === 5;
            const isSun = (d.getDay() + 6) % 7 === 6;
            return (
              <button
                key={idx}
                onClick={() => setSelectedDate(d)}
                className={`flex-1 flex flex-col items-center py-1.5 rounded-xl transition-all duration-200 ${
                  isSelected ? "bg-[#1e293b] shadow-md" : "hover:bg-slate-100/80"
                }`}
              >
                <span className={`text-[10px] font-bold tracking-wide uppercase ${
                  isSelected ? "text-white/70" : isSat ? "text-blue-500" : isSun ? "text-red-500" : "text-slate-400"
                }`}>
                  {getDayLabel(language, d)}
                </span>
                <span className={`text-[17px] font-black leading-tight mt-0.5 ${
                  isSelected ? "text-white" : isToday ? "text-[#007AFF]" : isSat ? "text-blue-500" : isSun ? "text-red-500" : "text-[#1e293b]"
                }`}>
                  {d.getDate()}
                </span>
                {isToday && !isSelected && <span className="w-1 h-1 rounded-full bg-[#007AFF] mt-0.5" />}
              </button>
            );
          })}

          <button
            onClick={() => handleWeekNav(1)}
            className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 active:scale-90 transition-all"
          >
            <span className="material-symbols-outlined !text-[20px]">chevron_right</span>
          </button>
        </div>
        <p className="text-center text-[10px] font-semibold text-slate-300 mt-1 tracking-wider">
          {weekRangeLabel}
        </p>
      </div>

      {/* ── Content ── */}
      <div className="px-4 pt-5 pb-6 space-y-7">

        {/* 소셜(밀롱가) — 홍대/강남 + 낮밀 구분 */}
        <section>
          <SectionHeader icon="local_fire_department" label={t("today.milonga")} count={milongas.length} />

          {loadingSocials ? (
            <div className="space-y-4">
              {[0, 1].map(g => (
                <div key={g}>
                  <div className="h-4 w-28 bg-slate-200 rounded animate-pulse mb-2" />
                  <div className="grid grid-cols-3 gap-2">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="rounded-xl bg-slate-200 animate-pulse" style={{ aspectRatio: "3/4" }} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : milongasByDistrict.length > 0 ? (
            <div className="space-y-5">
              {milongasByDistrict.map(([district, items]) => (
                <div key={district}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="material-symbols-outlined !text-[13px] text-blue-500">location_searching</span>
                    <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">{district}</span>
                    <div className="flex-1 h-px bg-slate-200" />
                    <span className="text-[11px] font-bold text-slate-300">{items.length}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {items.map(s => (
                      <SocialCard key={s.id} social={s} date={selectedDate} venuesMap={venuesMap} onPress={() => openSocialModal(s.id)} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 bg-white rounded-2xl border border-dashed border-slate-200">
              <span className="material-symbols-outlined !text-[32px] text-slate-300 mb-2">music_off</span>
              <p className="text-[13px] font-semibold text-slate-400">{t("today.no_social")}</p>
            </div>
          )}
        </section>

        {/* 쁘락띠까 */}
        <section>
          <SectionHeader icon="directions_run" label={t("today.practica")} count={practicas.length} />
          {loadingSocials ? (
            <div className="flex gap-2 flex-wrap min-h-[32px]">
              {[1, 2, 3].map(i => <div key={i} className="h-8 w-24 rounded-full bg-slate-200 animate-pulse" />)}
            </div>
          ) : practicas.length > 0 ? (
            <div className="flex gap-2 flex-wrap">
              {practicas.map(s => (
                <button
                  key={s.id}
                  onClick={() => openSocialModal(s.id)}
                  className="inline-flex items-center gap-1.5 bg-white border border-[#e0e4e5] rounded-full px-3 py-1.5 text-[13px] font-bold text-[#2d3435] whitespace-nowrap shadow-sm active:scale-95 transition-transform"
                >
                  <span className="w-2 h-2 rounded-full bg-orange-400 flex-shrink-0" />
                  {s.titleNative || s.title}
                </button>
              ))}
            </div>
          ) : (
            <div className="min-h-[32px] flex items-center">
              <p className="text-[13px] font-semibold text-slate-300">—</p>
            </div>
          )}
        </section>

        {/* 클래스 — 3열 */}
        <section>
          <SectionHeader icon="school" label={t("today.class")} count={filteredClasses.length} />
          {loadingClasses ? (
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="rounded-xl bg-slate-200 animate-pulse" style={{ aspectRatio: "1/1" }} />
              ))}
            </div>
          ) : filteredClasses.length > 0 ? (
            <div className="grid grid-cols-3 gap-2">
              {filteredClasses.slice(0, 6).map(({ cls, timeSlot }, idx) => (
                <ClassCard key={`${cls.id}-${idx}`} cls={cls} timeSlot={timeSlot} onPress={() => openClassModal(cls.id)} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 bg-white rounded-2xl border border-dashed border-slate-200">
              <span className="material-symbols-outlined !text-[32px] text-slate-300 mb-2">school</span>
              <p className="text-[13px] font-semibold text-slate-400">{t("today.no_class")}</p>
            </div>
          )}
        </section>

        {/* 이벤트 배너 슬라이더 (최근 5개) */}
        {loadingEvents ? (
          <div className="h-[76px] rounded-2xl bg-slate-200 animate-pulse" />
        ) : heroEvents.length > 0 ? (
          <div className="w-full">
            <div className="flex gap-3 overflow-x-auto scrollbar-none snap-x snap-mandatory pb-2">
              {heroEvents.map((ev, idx) => (
                <button
                  key={`${ev.id}-${idx}`}
                  onClick={() => {
                    setHeroEvent(ev);
                    openEventModal(ev.id);
                  }}
                  className="flex-shrink-0 w-[88%] md:w-[60%] snap-start flex items-center justify-between gap-3 bg-[#eaeef4] rounded-2xl px-4 py-3 active:scale-[0.99] transition-transform text-left relative"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {/* 이미지 좌측 배치 */}
                    <div className="w-[52px] h-[52px] rounded-xl overflow-hidden relative bg-slate-300/40 flex-shrink-0">
                      {ev.imageUrl ? (
                        <Image src={ev.imageUrl} alt={ev.title} fill className="object-cover" sizes="52px" />
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-700 to-indigo-800 flex items-center justify-center">
                          <span className="material-symbols-outlined !text-[20px] text-white/50">event</span>
                        </div>
                      )}
                    </div>
                    {/* 텍스트 우측 배치 */}
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-[13px] text-[#1e293b] leading-tight line-clamp-2">
                        {ev.title}
                      </p>
                      <p className="text-[11px] font-semibold text-slate-500 mt-1 truncate">
                        {getEventDateRange(ev)}
                      </p>
                    </div>
                  </div>
                  {/* D-day 배지만 노출 (i 아이콘 완전 제거) */}
                  {getEventDday(ev) && (
                    <div className="flex-shrink-0 ml-1">
                      <span className="bg-slate-300/80 text-slate-700 text-[9px] font-black px-1.5 py-0.5 rounded-md leading-none whitespace-nowrap">
                        {getEventDday(ev)}
                      </span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      {/* 소셜 상세 뷰어 */}
      {selectedSocial && (
        <SocialViewer
          social={selectedSocial}
          targetDate={selectedDate}
          onClose={closeSocialModal}
        />
      )}

      {/* 클래스 상세 뷰어 */}
      {selectedClass && (
        <ClassDetail
          groupId={selectedClass.groupId || ""}
          isOpen={!!selectedClass}
          itemDetail={selectedClass}
          onClose={closeClassModal}
          onManage={(cls) => {
            router.push(`/class/${cls.groupId}?viewClass=${cls.id}&editClass=${cls.id}`);
          }}
        />
      )}

      {/* 이벤트 상세 뷰어 */}
      {showEventViewer && heroEvent && (
        <EventViewer
          event={heroEvent}
          onClose={closeEventModal}
        />
      )}
    </div>
  );
}
