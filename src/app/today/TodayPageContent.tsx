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
import { collection, getDocs, query, limit } from "firebase/firestore";
import { Social } from "@/types/social";
import { Event } from "@/types/event";
import { GroupClass, Group } from "@/types/group";
import { detectSeoulDistrict, getVenueDisplay, formatInstructorNames, formatCommunityName, getWeekOrdinal, isLastWeekOfMonth } from "@/app/social/constants/seoulRegions";
import { getDjDisplay, getEventMessage } from "@/lib/utils/socialUtils";
import SocialViewer from "@/components/social/SocialViewer";
import ClassDetail from "@/components/class/ClassDetail";
import EventViewer from "@/components/events/EventViewer";

// 분리된 하위 컴포넌트 임포트
import TodayHeroSection from "./components/TodayHeroSection";
import TodaySocialSection from "./components/TodaySocialSection";
import TodayClassSection from "./components/TodayClassSection";

// ── helpers ───────────────────────────────────────────────────────────────────

function getWeekDates(baseDate: Date, weekOffset: number = 0): Date[] {
  const start = new Date(baseDate);
  start.setDate(baseDate.getDate() + weekOffset * 7);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
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

function isSystemOwner(ownerId?: string): boolean {
  if (!ownerId) return false;
  const SYSTEM_OWNERS = ["system", "system1", "admin_seeding", "adminstone", "7iaZAmaYY9dNNEShmJmROI8XrtH2"];
  return SYSTEM_OWNERS.includes(ownerId);
}

function isVenueMatched(sVenueId?: string, selectedGroup?: Group | null): boolean {
  if (!selectedGroup) return false;
  const gVenueId = selectedGroup.venueId;
  const gId = selectedGroup.id;
  const gSlug = selectedGroup.slug;
  const gName = selectedGroup.name;

  if (!sVenueId) return false;

  if (gVenueId && sVenueId === gVenueId) return true;

  if (sVenueId.startsWith("v_manual_")) {
    const rawAlias = sVenueId.replace("v_manual_", "").toLowerCase().trim();
    
    if (gId && gId.toLowerCase().includes(rawAlias)) return true;
    if (gSlug && gSlug.toLowerCase().includes(rawAlias)) return true;
    if (gName && gName.toLowerCase().includes(rawAlias)) return true;

    const MANUAL_VENUE_MAP: Record<string, string[]> = {
      "solotango": ["soltang-studio", "ocho"],
      "lavida": ["mi-vida-tango-studio"],
      "pasion": ["tango-pasion"],
      "troilo": ["club-troilo"],
      "bonita": ["bonita-seoul"],
      "arbol": ["ocho"],
    };

    if (MANUAL_VENUE_MAP[rawAlias]) {
      const matchedGroupIds = MANUAL_VENUE_MAP[rawAlias];
      if (matchedGroupIds.includes(gId)) return true;
    }
  }

  return false;
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

function formatDjFilterName(djName: string, locale: string): string {
  if (djName === "All") return "";
  const translated = formatInstructorNames(djName, "KR");
  if (translated && translated.toLowerCase() !== djName.toLowerCase()) {
    const englishName = djName.charAt(0).toUpperCase() + djName.slice(1).toLowerCase();
    return `${englishName} ${translated}`;
  }
  return djName;
}

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
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);

  // 배너 자동 롤링 타이머 (4초)
  useEffect(() => {
    if (heroEvents.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentBannerIndex((prev) => (prev + 1) % heroEvents.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [heroEvents]);

  // 그룹 연동 상태
  const [allGroups, setAllGroups] = useState<Group[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>("All");
  const [showGroupFilter, setShowGroupFilter] = useState(false);
  const [groupEvents, setGroupEvents] = useState<any[]>([]);
  const { isOpen: showMonthCalendar, openModal: openMonthCalendar, closeModal: closeMonthCalendar } = useModalNavigation("viewMonth");
  const [selectedMonthTab, setSelectedMonthTab] = useState<number>(0);
  const [allSocials, setAllSocials] = useState<Social[]>([]);

  // DJ 필터 연동 상태
  const [selectedDjName, setSelectedDjName] = useState<string>("All");
  const [showDjFilter, setShowDjFilter] = useState(false);
  const [djSortType, setDjSortType] = useState<"count" | "name">("count");
  const [groupSortType, setGroupSortType] = useState<"count" | "name">("count");

  const router = useRouter();

  // 3대 모달 히스토리 훅 정의
  const { value: viewSocialId, openModal: openSocialModal, closeModal: closeSocialModal, searchParams: socialParams } = useModalNavigation("viewSocial");
  const { value: viewClassId, openModal: openClassModal, closeModal: closeClassModal } = useModalNavigation("viewClass");
  const { value: viewEventId, openModal: openEventModal, closeModal: closeEventModal } = useModalNavigation("viewEvent");

  // 현재 선택된 그룹 객체
  const selectedGroup = useMemo(() => {
    return allGroups.find(g => g.id === selectedGroupId) || null;
  }, [allGroups, selectedGroupId]);

  const handleWeekNav = (direction: number) => {
    const nextOffset = weekOffset + direction;
    setWeekOffset(nextOffset);
    const nextDates = getWeekDates(today, nextOffset);
    setSelectedDate(nextDates[0]);
  };

  // 상세 보기 시 타겟 날짜 동적 연동 (정규 소셜의 요일별 DJ 매칭 지원)
  const socialTargetDate = useMemo(() => {
    const dateParam = socialParams.get("date");
    if (dateParam) {
      const parsed = normalizeDateStr(dateParam);
      if (parsed) return parsed;
    }
    return selectedDate;
  }, [socialParams, selectedDate]);

  // 실시간 URL 싱크 데이터 바인딩 (소셜 & 이벤트)
  const selectedSocial = useMemo(() => {
    if (!viewSocialId) return null;
    return allSocials.find(s => s.id === viewSocialId) || null;
  }, [viewSocialId, allSocials]);

  // 통합 이벤트 클릭 처리 핸들러 (소셜/클래스 상세 페이지 연동)
  const handleEventClick = (ev: any) => {
    if (!ev || !ev.itemId) return;
    if (ev.type === "class") {
      openClassModal(ev.itemId);
    } else if (["social", "milonga", "practice"].includes(ev.type)) {
      openSocialModal(ev.itemId, ev.dateStr ? { date: ev.dateStr } : undefined);
    }
  };

  const showEventViewer = useMemo(() => {
    return !!viewEventId && heroEvent?.id === viewEventId;
  }, [viewEventId, heroEvent]);

  // Groups 데이터 로드
  useEffect(() => {
    groupService.getGroups().then(data => {
      setAllGroups(data);
    }).catch(console.error);
  }, []);

  // 선택된 그룹의 캘린더 이벤트 구독
  useEffect(() => {
    if (selectedGroupId === "All") {
      setGroupEvents([]);
      return;
    }
    const unsub = groupService.subscribeCalendarEvents(selectedGroupId, (events) => {
      setGroupEvents(events);
    });
    return () => unsub();
  }, [selectedGroupId]);

  // 지정 지역(location.city) 내에 클래스/소셜이 개설된 활성 그룹 자동 리스팅
  const activeGroupsInLocation = useMemo(() => {
    if (!location) return [];

    const cityLower = (location.city || "All").toLowerCase().trim();
    const isSeoul = cityLower.includes("seoul") || cityLower.includes("서울") || cityLower.includes("soul");

    const now = new Date();
    const curYear = now.getFullYear();
    const curMonth = now.getMonth();

    const seoulStudios = allGroups.filter(g => {
      const v = g.venueId ? venuesMap[g.venueId] : null;
      if (!v) return false;

      const vCity = (v.city || "").toLowerCase().trim();
      const vAddr = (v.address || "").toLowerCase().trim();
      const isVenueInSeoul = vCity.includes("seoul") || vCity.includes("서울") || vCity.includes("soul") ||
                             vAddr.includes("seoul") || vAddr.includes("서울") || vAddr.includes("soul");
      
      if (isSeoul) {
        return isVenueInSeoul;
      } else {
        const matchesCity = vCity.includes(cityLower) || cityLower.includes(vCity) ||
                            vAddr.includes(cityLower) || cityLower.includes(vAddr);
        return matchesCity;
      }
    });

    return seoulStudios.filter(grp => {
      const hasClassThisMonth = allClasses.some(({ cls }) => {
        if (cls.groupId !== grp.id || cls.status !== "Open") return false;
        return cls.schedule?.some((s: any) => {
          const dStr = parseDateStr(s.date);
          const clsDate = normalizeDateStr(dStr);
          if (!clsDate) return false;
          return clsDate.getFullYear() === curYear && clsDate.getMonth() === curMonth;
        });
      });
      if (hasClassThisMonth) return true;

      const hasSocialThisMonth = allSocials.some(s => {
        const isMatchedSocial = isVenueMatched(s.venueId, grp) || 
                                (s.organizerId === grp.id) ||
                                (grp.ownerId && !isSystemOwner(grp.ownerId) && s.organizerId === grp.ownerId);
        
        if (!isMatchedSocial) return false;

        if (s.type === "regular") return true;

        if (s.type === "popup" && s.date) {
          const sDate = toJsDate(s.date);
          return sDate.getFullYear() === curYear && sDate.getMonth() === curMonth;
        }

        return false;
      });

      return hasSocialThisMonth;
    });
  }, [allGroups, allClasses, location, venuesMap, allSocials]);

  // 이번 주 전체 소셜 일정 목록
  const thisWeekAllSocialEvents = useMemo(() => {
    const events: { s: Social; d: Date }[] = [];
    const cityLower = (location?.city || "All").toLowerCase().trim();
    const isSeoul = cityLower.includes("seoul") || cityLower.includes("서울") || cityLower.includes("soul");
    
    const locationFiltered = allSocials.filter(s => {
      if (!location || location.city === "ALL") return true;
      if (!s.city) return true;
      const sc = s.city.toLowerCase().trim();
      if (isSeoul) return ["seoul", "서울", "soul"].some(a => sc.includes(a) || a.includes(sc));
      return sc.includes(cityLower) || cityLower.includes(sc);
    });

    locationFiltered.forEach(s => {
      if (s.type === "regular" && s.dayOfWeek !== undefined) {
        weekDates.forEach(d => {
          if (d.getDay() === Number(s.dayOfWeek)) {
            const ordinal = getWeekOrdinal(d);
            const isLast = isLastWeekOfMonth(d);
            const rec = (s.recurrence || "every").trim().toLowerCase();
            const recParts = rec.split(",").map(x => x.trim());

            const matchRecurrence = recParts.some(part => {
              if (part === "every" || part === "") return true;
              if (part === "1st" && ordinal === 1) return true;
              if (part === "2nd" && ordinal === 2) return true;
              if (part === "3rd" && ordinal === 3) return true;
              if (part === "4th" && ordinal === 4) return true;
              if (part === "last" && isLast) return true;
              return false;
            });

            if (matchRecurrence) {
              events.push({ s, d });
            }
          }
        });
      } else if (s.type === "popup" && s.date) {
        const sDate = toJsDate(s.date);
        const isInWeek = weekDates.some(d => d.toDateString() === sDate.toDateString());
        if (isInWeek) {
          events.push({ s, d: sDate });
        }
      }
    });
    return events;
  }, [allSocials, weekDates, location]);

  // 이번 주 전체 클래스 일정 목록
  const thisWeekAllClassEvents = useMemo(() => {
    const result: { cls: GroupClass; date: Date }[] = [];
    allClasses.forEach(({ cls }) => {
      if (cls.status !== "Open") return;
      cls.schedule?.forEach((s: any) => {
        const dStr = parseDateStr(s.date);
        const clsDate = normalizeDateStr(dStr);
        if (clsDate) {
          const isInWeek = weekDates.some(d => d.toDateString() === clsDate.toDateString());
          if (isInWeek) {
            result.push({ cls, date: clsDate });
          }
        }
      });
    });
    return result;
  }, [allClasses, weekDates]);

  // 이번 주 각 DJ별 횟수 계산
  const djWeeklyCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    thisWeekAllSocialEvents.forEach(({ s, d }) => {
      const djNameStr = getDjDisplay(s, d, language);
      if (djNameStr) {
        const names = djNameStr.split(/[,/&+\s]+/).map(n => n.trim()).filter(Boolean);
        names.forEach(name => {
          if (name !== "TBD" && name !== "TBA") {
            counts[name] = (counts[name] || 0) + 1;
          }
        });
      }
    });
    return counts;
  }, [thisWeekAllSocialEvents]);

  // 이번 주 각 그룹별 횟수 계산 (소셜 + 클래스)
  const groupWeeklyCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    allGroups.forEach(g => {
      counts[g.id] = 0;
    });

    thisWeekAllSocialEvents.forEach(({ s }) => {
      allGroups.forEach(grp => {
        const isMatched = isVenueMatched(s.venueId, grp) || 
                          (s.organizerId === grp.id) ||
                          (grp.ownerId && !isSystemOwner(grp.ownerId) && s.organizerId === grp.ownerId);
        if (isMatched) {
          counts[grp.id] = (counts[grp.id] || 0) + 1;
        }
      });
    });

    thisWeekAllClassEvents.forEach(({ cls }) => {
      if (cls.groupId) {
        counts[cls.groupId] = (counts[cls.groupId] || 0) + 1;
      }
    });

    return counts;
  }, [thisWeekAllSocialEvents, thisWeekAllClassEvents, allGroups]);

  const sortedActiveGroups = useMemo(() => {
    const groupsList = [...activeGroupsInLocation];
    return groupsList.sort((a, b) => {
      if (groupSortType === "count") {
        const countA = groupWeeklyCounts[a.id] || 0;
        const countB = groupWeeklyCounts[b.id] || 0;
        if (countB !== countA) return countB - countA;
      }
      
      const nameA = language === "KR" ? (a.nativeName || a.name) : a.name;
      const nameB = language === "KR" ? (b.nativeName || b.name) : b.name;
      return nameA.localeCompare(nameB, language === "KR" ? "ko" : "en");
    });
  }, [activeGroupsInLocation, groupSortType, groupWeeklyCounts, language]);

  // 이번 주 일정에서 활동하는 DJ 이름 목록 추출 및 정렬 적용
  const activeDjs = useMemo(() => {
    const djsList = Object.keys(djWeeklyCounts);

    return djsList.sort((a, b) => {
      if (djSortType === "count") {
        const countA = djWeeklyCounts[a] || 0;
        const countB = djWeeklyCounts[b] || 0;
        if (countB !== countA) return countB - countA;
      }
      
      const nameA = formatDjFilterName(a, language);
      const nameB = formatDjFilterName(b, language);
      return nameA.localeCompare(nameB, language === "KR" ? "ko" : "en");
    });
  }, [djWeeklyCounts, djSortType, language]);

  const groupMatchedSocials = useMemo(() => {
    if (selectedGroupId === "All") return allSocials;
    if (!selectedGroup) return [];
    return allSocials.filter(s => 
      isVenueMatched(s.venueId, selectedGroup) || 
      (s.organizerId === selectedGroup.id) ||
      (selectedGroup.ownerId && !isSystemOwner(selectedGroup.ownerId) && s.organizerId === selectedGroup.ownerId)
    );
  }, [allSocials, selectedGroupId, selectedGroup]);

  const djAndGroupMatchedSocials = useMemo(() => {
    if (selectedDjName === "All") return groupMatchedSocials;
    return groupMatchedSocials.filter(s => {
      const hasDjInDjs = s.djs?.some((dj: any) => {
        if (!dj.djName) return false;
        const parts = dj.djName.split(/[,/&+\s]+/).map((n: string) => n.trim().toLowerCase());
        return parts.includes(selectedDjName.toLowerCase());
      });
      const hasDjInDjName = s.djName && s.djName.split(/[,/&+\s]+/).map(n => n.trim().toLowerCase()).includes(selectedDjName.toLowerCase());
      return hasDjInDjs || hasDjInDjName;
    });
  }, [groupMatchedSocials, selectedDjName]);

  // Venues (한 번만 fetch)
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
    const q = query(collection(db, "events"), limit(50));
    getDocs(q).then(snap => {
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
        setHeroEvent(top5[0]);
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

  // Load all socials for filtering active groups
  useEffect(() => {
    const q = query(collection(db, "socials"), limit(200));
    getDocs(q).then(snap => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }) as Social);
      setAllSocials(list);
    }).catch(console.error);
  }, []);

  // 클래스 필터링
  const filteredClasses = useMemo(() => {
    const targetStr = selectedDate.toDateString();
    const result: ClassEntry[] = [];
    const cityLower = (location?.city || "All").toLowerCase().trim();
    const isAll = cityLower === "all";
    const activeGroupIds = new Set(activeGroupsInLocation.map(g => g.id));

    allClasses.forEach(({ cls }) => {
      if (cls.status !== "Open") return;
      if (selectedGroupId !== "All" && cls.groupId !== selectedGroupId) return;
      if (!isAll) {
        if (!activeGroupIds.has(cls.groupId || "")) return;
      }
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
    result.sort((a, b) => (a.timeSlot || "").localeCompare(b.timeSlot || ""));
    return result;
  }, [allClasses, selectedDate, location, activeGroupsInLocation, selectedGroupId]);

  const selectedClass = useMemo(() => {
    if (!viewClassId) return null;
    const item = allClasses.find(c => c.cls.id === viewClassId);
    return item ? item.cls : null;
  }, [viewClassId, allClasses]);

  const selectedDateYmd = useMemo(() => {
    return `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, "0")}-${String(selectedDate.getDate()).padStart(2, "0")}`;
  }, [selectedDate]);

  const parseDateToYmd = (dateVal: any): string => {
    if (!dateVal) return "";
    const d = toJsDate(dateVal);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };

  // 1. 소셜 목록 필터링
  const milongas = useMemo(() => {
    const cityLower = (location?.city || "All").toLowerCase().trim();
    const isSeoul = cityLower.includes("seoul") || cityLower.includes("서울") || cityLower.includes("soul");
    const isAll = cityLower === "all";

    const locFiltered = socials.filter(s => {
      if (isAll) return true;
      if (!s.city) return true;
      const sc = s.city.toLowerCase().trim();
      if (isSeoul) return ["seoul", "서울", "soul"].some(a => sc.includes(a) || a.includes(sc));
      return sc.includes(cityLower) || cityLower.includes(sc);
    });

    return locFiltered.filter(s => s.subCategory !== "practica");
  }, [socials, location]);

  const practicas = useMemo(() => {
    const cityLower = (location?.city || "All").toLowerCase().trim();
    const isSeoul = cityLower.includes("seoul") || cityLower.includes("서울") || cityLower.includes("soul");
    const isAll = cityLower === "all";

    const locFiltered = socials.filter(s => {
      if (isAll) return true;
      if (!s.city) return true;
      const sc = s.city.toLowerCase().trim();
      if (isSeoul) return ["seoul", "서울", "soul"].some(a => sc.includes(a) || a.includes(sc));
      return sc.includes(cityLower) || cityLower.includes(sc);
    });

    return locFiltered.filter(s => s.subCategory === "practica");
  }, [socials, location]);

  // 서울 구별 그룹화
  const milongasByDistrict = useMemo(() => {
    const groups: Record<string, Social[]> = {};
    const cityLower = (location?.city || "All").toLowerCase().trim();
    const isSeoul = cityLower.includes("seoul") || cityLower.includes("서울") || cityLower.includes("soul");

    const isDaySocial = (s: Social) => {
      const hour = parseInt((s.startTime || "19:00").split(":")[0]);
      return !isNaN(hour) && hour < 18;
    };

    milongas.forEach(s => {
      // 1. 서울이 아닌 활성 지역일 때는 구 필터링 생략하고 단일 지역명으로 리스트업
      if (!isSeoul) {
        const regionName = s.city || location.city || "Other";
        if (!groups[regionName]) groups[regionName] = [];
        groups[regionName].push(s);
        return;
      }

      // 2. 서울 지역일 때는 지정된 4대 핵심 권역(홍대인근 낮밀/홍대인근/강남 낮밀/강남) 분배 적용
      const rawDistrict = detectSeoulDistrict(s, language, venuesMap);
      const isDay = isDaySocial(s);
      
      let finalGroup = "";
      const isHongdaeArea = rawDistrict.includes("한강위") || rawDistrict.includes("Hongdae");
      
      if (isHongdaeArea) {
        finalGroup = isDay 
          ? (language === "KR" ? "홍대인근 낮밀" : "Hongdae (Day)")
          : (language === "KR" ? "홍대인근" : "Hongdae");
      } else {
        // 기본 강남권역 분류
        finalGroup = isDay
          ? (language === "KR" ? "강남 낮밀" : "Gangnam (Day)")
          : (language === "KR" ? "강남" : "Gangnam");
      }
      
      if (!groups[finalGroup]) {
        groups[finalGroup] = [];
      }
      groups[finalGroup].push(s);
    });

    // 각 그룹 내부 목록은 시작 시간 오름차순 정렬
    Object.keys(groups).forEach(key => {
      groups[key].sort((a, b) => {
        const timeA = a.startTime || "99:99";
        const timeB = b.startTime || "99:99";
        return timeA.localeCompare(timeB);
      });
    });

    const entries = Object.entries(groups);
    
    if (!isSeoul) {
      return entries.sort((a, b) => a[0].localeCompare(b[0], language === "KR" ? "ko" : "en"));
    }

    const groupOrder = language === "KR"
      ? ["홍대인근 낮밀", "홍대인근", "강남 낮밀", "강남"]
      : ["Hongdae (Day)", "Hongdae", "Gangnam (Day)", "Gangnam"];

    return entries.sort((a, b) => {
      const idxA = groupOrder.indexOf(a[0]);
      const idxB = groupOrder.indexOf(b[0]);
      const valA = idxA === -1 ? 999 : idxA;
      const valB = idxB === -1 ? 999 : idxB;
      if (valA !== valB) return valA - valB;
      return a[0].localeCompare(b[0], language === "KR" ? "ko" : "en");
    });
  }, [milongas, venuesMap, location, language]);

  const getOrgDisplayForSocial = (social: Social) => {
    const ids = social.organizerIds;
    const enNames = social.organizerNames;
    const krNames = social.organizerNativeNames;

    if (ids && ids.length > 0 && enNames && enNames.length > 0) {
      return ids.map((_, i) => {
        const en = enNames[i] || "";
        const kr = krNames?.[i] || "";
        const picked = language === "KR" ? (kr || en) : (en || kr);
        return picked ? formatCommunityName(picked, language) : "";
      }).filter(Boolean).join(", ");
    }
    const orgRaw = language === "KR"
      ? (social.organizerNameNative || social.organizerName || "")
      : (social.organizerName || social.organizerNameNative || "");
    return orgRaw ? formatCommunityName(orgRaw, language) : "";
  };

  // 2. 선택된 날짜의 소셜들
  const socialEvents = useMemo(() => {
    const events: any[] = [];
    const eventType = "social";
    const cityLower = (location?.city || "All").toLowerCase().trim();
    const isSeoul = cityLower.includes("seoul") || cityLower.includes("서울") || cityLower.includes("soul");

    const locationFiltered = djAndGroupMatchedSocials.filter(s => {
      if (!location || location.city === "ALL") return true;
      if (!s.city) return true;
      const sc = s.city.toLowerCase().trim();
      if (isSeoul) return ["seoul", "서울", "soul"].some(a => sc.includes(a) || a.includes(sc));
      return sc.includes(cityLower) || cityLower.includes(sc);
    });

    locationFiltered.forEach(s => {
      if (s.type === "regular" && s.dayOfWeek !== undefined) {
        weekDates.forEach(d => {
          if (d.getDay() === Number(s.dayOfWeek)) {
            const currentDj = getDjDisplay(s, d, language) || "";
            if (selectedDjName !== "All") {
              const currentDjParts = currentDj.split(/[,/&+\s]+/).map(n => n.trim().toLowerCase());
              if (!currentDjParts.includes(selectedDjName.toLowerCase())) {
                return;
              }
            }

            const eventType = s.subCategory === "practica" ? "practice" : (s.subCategory || "social");
            const isRealDj = currentDj && currentDj.toUpperCase() !== "TBD" && currentDj.toUpperCase() !== "TBA" && currentDj.trim() !== "";
            events.push({
              id: `social-week-${s.id}-${d.toDateString()}`,
              itemId: s.id,
              title: language === "KR" ? (s.titleNative || s.title) : (s.title || s.titleNative),
              subtitle: language === "KR" ? (s.titleNative && s.title && s.titleNative !== s.title ? s.title : "") : (s.title && s.titleNative && s.title !== s.titleNative ? s.titleNative : ""),
              description: s.description || "",
              startDate: d.getTime(),
              dateStr: parseDateToYmd(d),
              startTime: s.startTime || "",
              endTime: s.endTime || "",
              type: eventType,
              createdBy: "system",
              createdAt: Date.now(),
              org: getOrgDisplayForSocial(s),
              dj: isRealDj ? formatInstructorNames(currentDj, language) : "",
              location: formatCommunityName(getVenueDisplay(s, language, venuesMap), language),
              message: getEventMessage(s, d) || "",
            });
          }
        });
      } else if (s.type === "popup" && s.date) {
        const sDate = toJsDate(s.date);
        const isInWeek = weekDates.some(d => d.toDateString() === sDate.toDateString());
        if (isInWeek) {
          const currentDj = getDjDisplay(s, sDate, language) || "";
          if (selectedDjName !== "All") {
            const currentDjParts = currentDj.split(/[,/&+\s]+/).map(n => n.trim().toLowerCase());
            if (!currentDjParts.includes(selectedDjName.toLowerCase())) {
              return;
            }
          }

          const eventType = s.subCategory === "practica" ? "practice" : (s.subCategory || "social");
          const isRealDj = currentDj && currentDj.toUpperCase() !== "TBD" && currentDj.toUpperCase() !== "TBA" && currentDj.trim() !== "";
          events.push({
            id: `social-week-${s.id}`,
            itemId: s.id,
            title: language === "KR" ? (s.titleNative || s.title) : (s.title || s.titleNative),
            subtitle: language === "KR" ? (s.titleNative && s.title && s.titleNative !== s.title ? s.title : "") : (s.title && s.titleNative && s.title !== s.titleNative ? s.titleNative : ""),
            description: s.description || "",
            startDate: sDate.getTime(),
            dateStr: parseDateToYmd(sDate),
            startTime: s.startTime || "",
            endTime: s.endTime || "",
            type: eventType,
            createdBy: "system",
            createdAt: Date.now(),
            org: getOrgDisplayForSocial(s),
            dj: isRealDj ? formatInstructorNames(currentDj, language) : "",
            location: formatCommunityName(getVenueDisplay(s, language, venuesMap), language),
            message: getEventMessage(s, sDate) || "",
          });
        }
      }
    });
    return events;
  }, [djAndGroupMatchedSocials, weekDates, location, selectedDjName, venuesMap, language]);

  // 3. 선택된 날짜의 클래스들
  const classEvents = useMemo(() => {
    const events: any[] = [];
    const eventType = "class";
    allClasses.forEach(({ cls }) => {
      if (cls.status !== "Open") return;
      if (selectedGroupId !== "All" && cls.groupId !== selectedGroupId) return;

      cls.schedule?.forEach((s: any) => {
        const dStr = parseDateStr(s.date);
        const clsDate = normalizeDateStr(dStr);
        if (clsDate) {
          const isInWeek = weekDates.some(d => d.toDateString() === clsDate.toDateString());
          if (isInWeek) {
            const getInstructorsLabel = (instructors: any[]) => {
              if (!instructors || instructors.length === 0) return "";
              const formattedNames = instructors.map(i => formatInstructorNames(i.name || "", language));
              return formattedNames.join(", ");
            };

            events.push({
              id: `class-week-${cls.id}-${clsDate.toDateString()}`,
              itemId: cls.id,
              title: formatCommunityName(cls.title, language),
              description: cls.description || "",
              startDate: clsDate.getTime(),
              dateStr: parseDateToYmd(clsDate),
              startTime: s.timeSlot || cls.startTime || "",
              endTime: cls.endTime || "",
              type: eventType,
              createdBy: cls.groupId || "system",
              createdAt: Date.now(),
              instructor: getInstructorsLabel(cls.instructors || []),
              level: cls.level || "",
              weekPlans: cls.schedule ? cls.schedule.map((sch: any) => sch.content || "") : [],
            });
          }
        }
      });
    });
    return events;
  }, [allClasses, weekDates, selectedGroupId, language]);

  // 월간용 전체 클래스 일정 목록 수집
  const monthlyClassEvents = useMemo(() => {
    const events: any[] = [];
    const eventType = "class";
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();

    allClasses.forEach(({ cls }) => {
      if (cls.status !== "Open") return;
      if (selectedGroupId !== "All" && cls.groupId !== selectedGroupId) return;

      cls.schedule?.forEach((s: any) => {
        const dStr = parseDateStr(s.date);
        const clsDate = normalizeDateStr(dStr);
        if (clsDate) {
          if (clsDate.getFullYear() === year && clsDate.getMonth() === month) {
            const getInstructorsLabel = (instructors: any[]) => {
              if (!instructors || instructors.length === 0) return "";
              const formattedNames = instructors.map(i => formatInstructorNames(i.name || "", language));
              return formattedNames.join(", ");
            };

            events.push({
              id: `class-month-${cls.id}-${clsDate.toDateString()}`,
              itemId: cls.id,
              title: formatCommunityName(cls.title, language),
              description: cls.description || "",
              startDate: clsDate.getTime(),
              dateStr: parseDateToYmd(clsDate),
              startTime: s.timeSlot || cls.startTime || "",
              endTime: cls.endTime || "",
              type: eventType,
              createdBy: cls.groupId || "system",
              createdAt: Date.now(),
              instructor: getInstructorsLabel(cls.instructors || []),
              level: cls.level || "",
              imageUrl: cls.imageUrl || "",
              weekPlans: cls.schedule ? cls.schedule.map((sch: any) => sch.content || "") : [],
            });
          }
        }
      });
    });
    return events;
  }, [allClasses, selectedGroupId, language]);

  // 4. 월간 달력 소셜 이벤트 목록
  const monthlySocialEvents = useMemo(() => {
    const events: any[] = [];
    const eventType = "social";
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();

    const startOfMonth = new Date(year, month, 1);
    const endOfMonth = new Date(year, month + 31); // 넉넉히 31일치

    const daysInMonth: Date[] = [];
    for (let d = new Date(startOfMonth); d <= endOfMonth; d.setDate(d.getDate() + 1)) {
      if (d.getMonth() === month) {
        daysInMonth.push(new Date(d));
      }
    }

    const cityLower = (location?.city || "All").toLowerCase().trim();
    const isSeoul = cityLower.includes("seoul") || cityLower.includes("서울") || cityLower.includes("soul");

    const locationFiltered = djAndGroupMatchedSocials.filter(s => {
      if (!location || location.city === "ALL") return true;
      if (!s.city) return true;
      const sc = s.city.toLowerCase().trim();
      if (isSeoul) return ["seoul", "서울", "soul"].some(a => sc.includes(a) || a.includes(sc));
      return sc.includes(cityLower) || cityLower.includes(sc);
    });

    locationFiltered.forEach(s => {
      if (s.type === "regular" && s.dayOfWeek !== undefined) {
        daysInMonth.forEach(d => {
          if (d.getDay() === Number(s.dayOfWeek)) {
            const ordinal = getWeekOrdinal(d);
            const isLast = isLastWeekOfMonth(d);
            const rec = (s.recurrence || "every").trim().toLowerCase();
            const recParts = rec.split(",").map(x => x.trim());

            const matchRecurrence = recParts.some(part => {
              if (part === "every" || part === "") return true;
              if (part === "1st" && ordinal === 1) return true;
              if (part === "2nd" && ordinal === 2) return true;
              if (part === "3rd" && ordinal === 3) return true;
              if (part === "4th" && ordinal === 4) return true;
              if (part === "last" && isLast) return true;
              return false;
            });

            if (!matchRecurrence) return;

            const currentDj = getDjDisplay(s, d, language) || "";
            if (selectedDjName !== "All") {
              const currentDjParts = currentDj.split(/[,/&+\s]+/).map(n => n.trim().toLowerCase());
              if (!currentDjParts.includes(selectedDjName.toLowerCase())) {
                return;
              }
            }

            const eventType = s.subCategory === "practica" ? "practice" : (s.subCategory || "social");
            const isRealDj = currentDj && currentDj.toUpperCase() !== "TBD" && currentDj.toUpperCase() !== "TBA" && currentDj.trim() !== "";
            const hasPoster = s.posterLayoutId && s.posterLayoutId !== "none";
            const displayImageUrl = hasPoster ? s.imageUrl : (s.posterExportUrl || s.imageUrl || "");
            events.push({
              id: `social-month-${s.id}-${d.toDateString()}`,
              itemId: s.id,
              title: language === "KR" ? (s.titleNative || s.title) : (s.title || s.titleNative),
              subtitle: language === "KR" ? (s.titleNative && s.title && s.titleNative !== s.title ? s.title : "") : (s.title && s.titleNative && s.title !== s.titleNative ? s.titleNative : ""),
              description: s.description || "",
              startDate: d.getTime(),
              dateStr: parseDateToYmd(d),
              startTime: s.startTime || "",
              endTime: s.endTime || "",
              type: eventType,
              createdBy: "system",
              createdAt: Date.now(),
              org: getOrgDisplayForSocial(s),
              dj: isRealDj ? formatInstructorNames(currentDj, language) : "",
              location: formatCommunityName(getVenueDisplay(s, language, venuesMap), language),
              message: getEventMessage(s, d) || "",
              imageUrl: displayImageUrl,
            });
          }
        });
      } else if (s.type === "popup" && s.date) {
        const sDate = toJsDate(s.date);
        if (sDate.getFullYear() === year && sDate.getMonth() === month) {
          const currentDj = getDjDisplay(s, sDate, language) || "";
          if (selectedDjName !== "All") {
            const currentDjParts = currentDj.split(/[,/&+\s]+/).map(n => n.trim().toLowerCase());
            if (!currentDjParts.includes(selectedDjName.toLowerCase())) {
              return;
            }
          }

          const eventType = s.subCategory === "practica" ? "practice" : (s.subCategory || "social");
          const isRealDj = currentDj && currentDj.toUpperCase() !== "TBD" && currentDj.toUpperCase() !== "TBA" && currentDj.trim() !== "";
          const hasPoster = s.posterLayoutId && s.posterLayoutId !== "none";
          const displayImageUrl = hasPoster ? s.imageUrl : (s.posterExportUrl || s.imageUrl || "");
          events.push({
            id: `social-month-${s.id}`,
            itemId: s.id,
            title: language === "KR" ? (s.titleNative || s.title) : (s.title || s.titleNative),
            subtitle: language === "KR" ? (s.titleNative && s.title && s.titleNative !== s.title ? s.title : "") : (s.title && s.titleNative && s.title !== s.titleNative ? s.titleNative : ""),
            description: s.description || "",
            startDate: sDate.getTime(),
            dateStr: parseDateToYmd(sDate),
            startTime: s.startTime || "",
            endTime: s.endTime || "",
            type: eventType,
            createdBy: "system",
            createdAt: Date.now(),
            org: getOrgDisplayForSocial(s),
            dj: isRealDj ? formatInstructorNames(currentDj, language) : "",
            location: formatCommunityName(getVenueDisplay(s, language, venuesMap), language),
            message: getEventMessage(s, sDate) || "",
            imageUrl: displayImageUrl,
          });
        }
      }
    });
    return events;
  }, [djAndGroupMatchedSocials, selectedDjName, selectedGroupId, venuesMap, language, location]);

  // 전체 일정 합산
  const allCombinedEvents = useMemo(() => {
    const mappedGroupEvents = selectedDjName === "All" ? groupEvents.map(e => ({
      ...e,
      itemId: e.id,
      startDate: toJsDate(e.startDate).getTime(),
      dateStr: parseDateToYmd(e.startDate),
    })) : [];
    
    const mappedClassEvents = selectedDjName === "All" ? classEvents : [];

    return [...mappedGroupEvents, ...mappedClassEvents, ...socialEvents];
  }, [groupEvents, classEvents, socialEvents, selectedDjName]);

  const groupTodayEvents = useMemo(() => {
    return allCombinedEvents.filter(ev => ev.dateStr === selectedDateYmd);
  }, [allCombinedEvents, selectedDateYmd]);

  const groupOtherWeekEventsByDate = useMemo(() => {
    const getDayNum = (d: Date) => {
      const day = d.getDay();
      return day === 0 ? 7 : day;
    };

    const selectedDayNum = getDayNum(selectedDate);

    const dates = weekDates.filter(d => {
      const dDayNum = getDayNum(d);
      return dDayNum > selectedDayNum && dDayNum <= 7;
    });

    const result: { date: Date; ymd: string; events: any[] }[] = [];
    dates.forEach(d => {
      const ymd = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      const evs = allCombinedEvents.filter(ev => ev.dateStr === ymd);
      if (evs.length > 0) {
        evs.sort((a, b) => (a.startTime || "00:00").localeCompare(b.startTime || "00:00"));
        result.push({ date: d, ymd, events: evs });
      }
    });
    
    result.sort((a, b) => a.date.getTime() - b.date.getTime());
    return result;
  }, [allCombinedEvents, weekDates, selectedDate]);

  const monthlyEventsByWeek = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();

    const weeks = [
      { id: 0, labelKo: "1주차 (1-7일)", labelEn: "Week 1 (1-7)", start: 1, end: 7 },
      { id: 1, labelKo: "2주차 (8-14일)", labelEn: "Week 2 (8-14)", start: 8, end: 14 },
      { id: 2, labelKo: "3주차 (15-21일)", labelEn: "Week 3 (15-21)", start: 15, end: 21 },
      { id: 3, labelKo: "4주차 (22-28일)", labelEn: "Week 4 (22-28)", start: 22, end: 28 },
      { id: 4, labelKo: "5주차 (29일~)", labelEn: "Week 5 (29~)", start: 29, end: 31 }
    ];

    const mappedGroupEvents = groupEvents.map(e => ({
      ...e,
      startDate: toJsDate(e.startDate).getTime(),
      dateStr: parseDateToYmd(e.startDate),
      imageUrl: e.imageUrl || e.coverImage || "",
    }));

    const allMonthEvents = [...mappedGroupEvents, ...monthlyClassEvents, ...monthlySocialEvents];

    return weeks.map(w => {
      const evs = allMonthEvents.filter(ev => {
        if (!ev.dateStr) return false;
        const parts = ev.dateStr.split("-");
        if (parts.length < 3) return false;
        const evYear = parseInt(parts[0]);
        const evMonth = parseInt(parts[1]) - 1;
        const evDate = parseInt(parts[2]);

        if (evYear !== year || evMonth !== month) return false;
        return evDate >= w.start && evDate <= w.end;
      });
      evs.sort((a, b) => {
        const dA = toJsDate(a.startDate).getTime();
        const dB = toJsDate(b.startDate).getTime();
        if (dA !== dB) return dA - dB;
        return (a.startTime || "00:00").localeCompare(b.startTime || "00:00");
      });
      return { ...w, events: evs };
    });
  }, [groupEvents, monthlyClassEvents, monthlySocialEvents]);

  // 주차 탭 상태 (0: 1주차 ~ 4: 5주차)
  const [selectedWeekTab, setSelectedWeekTab] = useState<number>(() => {
    return Math.max(0, Math.min(4, getWeekOfMonth(selectedDate) - 1));
  });

  // selectedDate 또는 selectedGroupId가 바뀔 때 해당 일자가 속한 주차로 탭을 동기화해 줍니다.
  useEffect(() => {
    const currentWeekIdx = getWeekOfMonth(selectedDate) - 1;
    setSelectedWeekTab(Math.max(0, Math.min(4, currentWeekIdx)));
  }, [selectedDate, selectedGroupId]);

  // 선택된 주차 탭의 일정을 날짜별로 그룹화하는 로직
  const weekEventsByDate = useMemo(() => {
    const weekData = monthlyEventsByWeek[selectedWeekTab];
    if (!weekData || !weekData.events) return [];

    const grouped: Record<string, { date: Date; ymd: string; events: any[] }> = {};
    weekData.events.forEach(ev => {
      if (!ev.dateStr) return;
      const dateStr = ev.dateStr;
      if (!grouped[dateStr]) {
        const parts = dateStr.split("-");
        const date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        grouped[dateStr] = { date, ymd: dateStr, events: [] };
      }
      grouped[dateStr].events.push(ev);
    });

    const list = Object.values(grouped);
    list.sort((a, b) => a.date.getTime() - b.date.getTime());
    return list;
  }, [monthlyEventsByWeek, selectedWeekTab]);

  const selectedGroupDisplay = useMemo(() => {
    if (selectedGroupId === "All") return t("today.all_groups");
    const g = allGroups.find(x => x.id === selectedGroupId);
    if (!g) return t("today.all_groups");
    return language === "KR" ? (g.nativeName || g.name) : g.name;
  }, [selectedGroupId, allGroups, language, t]);

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
      </div>

      {/* ── 그룹 필터 바 ── */}
      <div className="relative z-30 px-4 py-2.5 flex items-center justify-between bg-white border-b border-slate-100/80">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#007AFF] animate-pulse" />
          <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">
            {location.city || "ALL"}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          {/* 그룹 필터 트리거 */}
          <button
            onClick={() => {
              if (selectedGroupId !== "All") {
                setSelectedGroupId("All");
                setShowGroupFilter(false);
              } else {
                setShowGroupFilter(!showGroupFilter);
              }
              setShowDjFilter(false);
            }}
            className={`flex items-center gap-0.5 bg-white border rounded-full px-3 py-1.5 text-[10px] font-black shadow-sm transition-all active:scale-95 ${
              selectedGroupId !== "All"
                ? "text-indigo-600 border-indigo-200 bg-indigo-50/10"
                : "text-slate-600 border-slate-200 hover:bg-slate-50"
            }`}
          >
            <span>{selectedGroupDisplay}</span>
            <span className={`material-symbols-outlined !text-[14px] transition-transform duration-200 ${showGroupFilter ? "rotate-180" : ""}`}>
              expand_more
            </span>
          </button>

          {/* DJ 필터 트리거 */}
          <button
            onClick={() => {
              if (selectedDjName !== "All") {
                setSelectedDjName("All");
                setShowDjFilter(false);
              } else {
                setShowDjFilter(!showDjFilter);
              }
              setShowGroupFilter(false);
            }}
            className={`flex items-center gap-0.5 bg-white border rounded-full px-3 py-1.5 text-[10px] font-black shadow-sm transition-all active:scale-95 ${
              selectedDjName !== "All"
                ? "text-purple-600 border-purple-200 bg-purple-50/10"
                : "text-slate-600 border-slate-200 hover:bg-slate-50"
            }`}
          >
            <span>{selectedDjName === "All" ? t("today.all_djs") : formatDjFilterName(selectedDjName, language)}</span>
            <span className={`material-symbols-outlined !text-[14px] transition-transform duration-200 ${showDjFilter ? "rotate-180" : ""}`}>
              expand_more
            </span>
          </button>
        </div>

        {/* 그룹 드롭다운 팝오버 셀렉터 */}
        {showGroupFilter && (
          <div className="absolute top-full left-0 right-0 z-40 bg-white shadow-2xl border-t border-slate-100 p-4 max-h-[300px] overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-black text-slate-800 uppercase tracking-tight">{t("today.group_filter")}</span>
                <div className="flex items-center gap-0.5 bg-slate-100 p-0.5 rounded-lg text-[9px] font-black">
                  <button
                    onClick={() => setGroupSortType("count")}
                    className={`px-1.5 py-0.5 rounded transition-all ${
                      groupSortType === "count" ? "bg-white text-slate-800 shadow-sm" : "text-slate-400 hover:text-slate-600"
                    }`}
                  >
                    {t("today.sort_by_count")}
                  </button>
                  <button
                    onClick={() => setGroupSortType("name")}
                    className={`px-1.5 py-0.5 rounded transition-all ${
                      groupSortType === "name" ? "bg-white text-slate-800 shadow-sm" : "text-slate-400 hover:text-slate-600"
                    }`}
                  >
                    {t("today.sort_by_name")}
                  </button>
                </div>
              </div>
              <button 
                onClick={() => setShowGroupFilter(false)} 
                className="w-7 h-7 flex items-center justify-center rounded-full bg-slate-50 text-slate-400 hover:text-slate-600 active:scale-90 transition-all"
              >
                <span className="material-symbols-outlined !text-[16px]">close</span>
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  setSelectedGroupId("All");
                  setSelectedDjName("All");
                  setShowGroupFilter(false);
                }}
                className={`px-3 py-2.5 rounded-xl text-[11px] font-black text-left transition-all border ${
                  selectedGroupId === "All"
                    ? "bg-[#1e293b] text-white border-[#1e293b] shadow-md shadow-slate-100"
                    : "bg-slate-50/50 text-slate-600 border-transparent hover:bg-slate-100/80"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="truncate">{t("today.all_groups")}</span>
                  {selectedGroupId === "All" && (
                    <span className="material-symbols-outlined !text-[12px]">check_circle</span>
                  )}
                </div>
              </button>

              {sortedActiveGroups.map(grp => {
                const isSelected = selectedGroupId === grp.id;
                const displayName = language === "KR" ? (grp.nativeName || grp.name) : grp.name;
                const count = groupWeeklyCounts[grp.id] || 0;
                return (
                  <button
                    key={grp.id}
                    onClick={() => {
                      setSelectedGroupId(grp.id);
                      setSelectedDjName("All");
                      setShowGroupFilter(false);
                    }}
                    className={`px-3 py-2.5 rounded-xl text-[11px] font-black text-left transition-all border ${
                      isSelected
                        ? "bg-[#1e293b] text-white border-[#1e293b] shadow-md shadow-slate-100"
                        : "bg-slate-50/50 text-slate-600 border-transparent hover:bg-slate-100/80"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="truncate pr-1">{displayName} ({count})</span>
                      {isSelected && (
                        <span className="material-symbols-outlined !text-[12px]">check_circle</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* DJ 드롭다운 팝오버 셀렉터 */}
        {showDjFilter && (
          <div className="absolute top-full left-0 right-0 z-40 bg-white shadow-2xl border-t border-slate-100 p-4 max-h-[300px] overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-black text-slate-800 uppercase tracking-tight">{t("today.dj_filter")}</span>
                <div className="flex items-center gap-0.5 bg-slate-100 p-0.5 rounded-lg text-[9px] font-black">
                  <button
                    onClick={() => setDjSortType("count")}
                    className={`px-1.5 py-0.5 rounded transition-all ${
                      djSortType === "count" ? "bg-white text-slate-800 shadow-sm" : "text-slate-400 hover:text-slate-600"
                    }`}
                  >
                    {t("today.sort_by_count")}
                  </button>
                  <button
                    onClick={() => setDjSortType("name")}
                    className={`px-1.5 py-0.5 rounded transition-all ${
                      djSortType === "name" ? "bg-white text-slate-800 shadow-sm" : "text-slate-400 hover:text-slate-600"
                    }`}
                  >
                    {t("today.sort_by_name")}
                  </button>
                </div>
              </div>
              <button 
                onClick={() => setShowDjFilter(false)} 
                className="w-7 h-7 flex items-center justify-center rounded-full bg-slate-50 text-slate-400 hover:text-slate-600 active:scale-90 transition-all"
              >
                <span className="material-symbols-outlined !text-[16px]">close</span>
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  setSelectedDjName("All");
                  setSelectedGroupId("All");
                  setShowDjFilter(false);
                }}
                className={`px-3 py-2.5 rounded-xl text-[11px] font-black text-left transition-all border ${
                  selectedDjName === "All"
                    ? "bg-[#1e293b] text-white border-[#1e293b] shadow-md shadow-slate-100"
                    : "bg-slate-50/50 text-slate-600 border-transparent hover:bg-slate-100/80"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="truncate">{t("today.all_djs")}</span>
                  {selectedDjName === "All" && (
                    <span className="material-symbols-outlined !text-[12px]">check_circle</span>
                  )}
                </div>
              </button>

              {activeDjs.map(dj => {
                const isSelected = selectedDjName === dj;
                const count = djWeeklyCounts[dj] || 0;
                return (
                  <button
                    key={dj}
                    onClick={() => {
                      setSelectedDjName(dj);
                      setSelectedGroupId("All");
                      setShowDjFilter(false);
                    }}
                    className={`px-3 py-2.5 rounded-xl text-[11px] font-black text-left transition-all border ${
                      isSelected
                        ? "bg-[#1e293b] text-white border-[#1e293b] shadow-md shadow-slate-100"
                        : "bg-slate-50/50 text-slate-600 border-transparent hover:bg-slate-100/80"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="truncate pr-1">{formatDjFilterName(dj, language)} ({count})</span>
                      {isSelected && (
                        <span className="material-symbols-outlined !text-[12px]">check_circle</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── Content ── */}
      <div className="px-4 pt-5 pb-6">

        {selectedGroupId === "All" && selectedDjName === "All" ? (
          /* 기존 지역 기반 당일 소셜/클래스 목록 (하위 분리 컴포넌트 탑재) */
          <div className="space-y-7 animate-in fade-in duration-300">
            {/* 소셜 및 쁘락띠까 목록 */}
            <TodaySocialSection
              loadingSocials={loadingSocials}
              milongas={milongas}
              milongasByDistrict={milongasByDistrict}
              selectedDate={selectedDate}
              venuesMap={venuesMap}
              openSocialModal={openSocialModal}
              practicas={practicas}
            />

            {/* 클래스 목록 */}
            <TodayClassSection
              loadingClasses={loadingClasses}
              filteredClasses={filteredClasses}
              openClassModal={openClassModal}
            />

            {/* 이벤트 배너 슬라이더 */}
            <TodayHeroSection
              loadingEvents={loadingEvents}
              heroEvents={heroEvents}
              currentBannerIndex={currentBannerIndex}
              setCurrentBannerIndex={setCurrentBannerIndex}
              setHeroEvent={setHeroEvent}
              openEventModal={openEventModal}
              getEventDateRange={getEventDateRange}
              getEventDday={getEventDday}
            />
          </div>
        ) : (
          /* 그룹 모드 (오늘 상세 카드 + 이번 주 요일별 세로 목록) */
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* 오늘 일정 섹션 */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="material-symbols-outlined !text-[20px] text-rose-500">local_fire_department</span>
                <span className="text-[14px] font-black text-[#1e293b] tracking-tight">
                  {language === "KR" ? "오늘의 일정" : "Today's Schedule"}
                </span>
                {groupTodayEvents.length > 0 && (
                  <span className="text-[12px] font-bold text-slate-400">{groupTodayEvents.length}</span>
                )}
              </div>

              {groupTodayEvents.length > 0 ? (
                <div className="space-y-4">
                  {groupTodayEvents.map((ev, idx) => {
                    const catColors: Record<string, { bg: string; text: string; labelKo: string; labelEn: string }> = {
                      milonga: { bg: "bg-rose-50 text-rose-600 border border-rose-100", text: "text-rose-700", labelKo: "소셜", labelEn: "Social" },
                      social: { bg: "bg-rose-50 text-rose-600 border border-rose-100", text: "text-rose-700", labelKo: "소셜", labelEn: "Social" },
                      class: { bg: "bg-blue-50 text-blue-600 border border-blue-100", text: "text-blue-700", labelKo: "클래스", labelEn: "Class" },
                      practice: { bg: "bg-amber-50 text-amber-600 border border-amber-100", text: "text-amber-700", labelKo: "쁘락띠까", labelEn: "Practica" },
                      general: { bg: "bg-slate-50 text-slate-600 border border-slate-100", text: "text-slate-700", labelKo: "일반", labelEn: "General" },
                      rental: { bg: "bg-purple-50 text-purple-600 border border-purple-100", text: "text-purple-700", labelKo: "대관", labelEn: "Rental" },
                    };
                    const cat = catColors[ev.type] || catColors.general;
                    const categoryLabel = language === "KR" ? cat.labelKo : cat.labelEn;

                    const isClickable = ["class", "social", "milonga", "practice"].includes(ev.type);

                    const hasMessage = ev.message && ev.message.trim() !== "";
                    return (
                      <div 
                        key={`${ev.id}-${idx}`}
                        onClick={isClickable ? () => handleEventClick(ev) : undefined}
                        className={`bg-white rounded-2xl p-5 shadow-sm border-l-4 border-rose-500 relative overflow-hidden hover:shadow-md transition-shadow ${isClickable ? "cursor-pointer" : ""}`}
                        role={isClickable ? "button" : undefined}
                        tabIndex={isClickable ? 0 : undefined}
                      >
                        {hasMessage && (
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center p-2 z-10">
                            <span className="bg-rose-500 text-white text-[12px] font-black px-3 py-1.5 rounded-xl shadow-lg text-center max-w-[90%] truncate">
                              {ev.message}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center justify-between">
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded-md leading-none ${cat.bg}`}>
                            {categoryLabel}
                          </span>
                          {ev.startTime && (
                            <span className="text-[10px] font-black text-slate-400">
                              {ev.startTime} {ev.endTime ? `~ ${ev.endTime}` : ""}
                            </span>
                          )}
                        </div>

                        <div className="mt-2.5">
                          <h3 className="text-[15px] font-black text-slate-800 leading-tight">
                            {ev.title}
                          </h3>
                          {ev.subtitle && (
                            <span className="text-[11px] font-medium text-slate-400 block mt-0.5 truncate">
                              {ev.subtitle}
                            </span>
                          )}
                        </div>

                        {/* 메타 정보 */}
                        <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-[11px] font-semibold text-slate-500 border-t border-slate-50 pt-2.5">
                          {ev.location && (
                            <div className="flex items-center gap-1 min-w-0">
                              <span className="material-symbols-outlined !text-[13px] text-slate-400 flex-shrink-0">location_on</span>
                              <span className="truncate">{ev.location}</span>
                            </div>
                          )}
                          {["social", "milonga", "practice"].includes(ev.type) && ev.org && (
                            <div className="flex items-center gap-1 min-w-0">
                              <span className="material-symbols-outlined !text-[13px] text-slate-400 flex-shrink-0">person</span>
                              <span className="truncate">org {ev.org}</span>
                            </div>
                          )}
                          {["social", "milonga", "practice"].includes(ev.type) && ev.dj && (
                            <div className="flex items-center gap-1 min-w-0">
                              <span className="material-symbols-outlined !text-[13px] text-slate-400 flex-shrink-0">headphones</span>
                              <span className="truncate">dj {formatDjFilterName(ev.dj, language)}</span>
                            </div>
                          )}
                          {ev.type === "class" && ev.instructor && (
                            <div className="flex items-center gap-1 min-w-0">
                              <span className="material-symbols-outlined !text-[13px] text-slate-400 flex-shrink-0">school</span>
                              <span className="truncate">{formatInstructorNames(ev.instructor, language)}</span>
                            </div>
                          )}
                          {ev.type === "class" && ev.level && (
                            <div className="flex items-center gap-1 min-w-0">
                              <span className="material-symbols-outlined !text-[13px] text-slate-400 flex-shrink-0">bar_chart</span>
                              <span className="truncate">{ev.level}</span>
                            </div>
                          )}
                        </div>

                        {/* 해당 주차의 랜드마크 요약 표시 */}
                        {(() => {
                          const currentWeek = getWeekOfMonth(selectedDate);
                          const plan = ev.weekPlans?.[currentWeek - 1];
                          if (!plan) return null;
                          return (
                            <div className="mt-4 pt-3.5 border-t border-slate-100/80">
                              <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-2">
                                {language === "KR" ? `${currentWeek}주차 수업 내용` : `Week ${currentWeek} Plan`}
                              </p>
                              <div className="flex gap-2 items-start">
                                <span className="flex-shrink-0 w-4 h-4 rounded-full bg-indigo-50 flex items-center justify-center text-[9px] font-black text-indigo-600 mt-0.5">
                                  {currentWeek}
                                </span>
                                <p className="text-[11px] font-bold text-slate-700 leading-snug">
                                  {plan}
                                </p>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 bg-white rounded-2xl border border-dashed border-slate-200">
                  <span className="material-symbols-outlined !text-[32px] text-slate-300 mb-2">event_busy</span>
                  <p className="text-[12px] font-semibold text-slate-400">{t("today.no_schedule")}</p>
                </div>
              )}
            </div>

            {/* 주차별 다른 일정 탭 섹션 */}
            <div className="pt-2">
              <div className="flex items-center gap-2 mb-3">
                <span className="material-symbols-outlined !text-[20px] text-indigo-500">date_range</span>
                <span className="text-[14px] font-black text-[#1e293b] tracking-tight">
                  {language === "KR" ? "주차별 일정 보기" : "Schedule by Week"}
                </span>
              </div>

              {/* 주차 탭바 */}
              <div className="flex items-center gap-1.5 bg-slate-100/60 p-1 rounded-xl mb-4">
                {[1, 2, 3, 4, 5].map((wk) => {
                  const isActive = selectedWeekTab === wk - 1;
                  return (
                    <button
                      key={wk}
                      onClick={() => setSelectedWeekTab(wk - 1)}
                      className={`flex-1 py-2 rounded-lg text-[11px] font-black transition-all ${
                        isActive
                          ? "bg-white text-indigo-600 shadow-sm"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      {language === "KR" ? `${wk}주차` : `Wk ${wk}`}
                    </button>
                  );
                })}
              </div>

              {weekEventsByDate.length > 0 ? (
                <div className="space-y-4">
                  {weekEventsByDate.map(({ date, ymd, events }) => {
                    const formattedDate = language === "KR"
                      ? `${date.getMonth() + 1}월 ${date.getDate()}일 (${getDayLabel(language, date)})`
                      : date.toLocaleDateString("en-US", { month: "short", day: "numeric", weekday: "short" });

                    const dayOfWeek = date.getDay();
                    const headerStyle = dayOfWeek === 0 
                      ? { bg: "bg-rose-50/40 border-b border-rose-100/50", text: "text-rose-600/90", badge: "bg-rose-100/50 text-rose-600" }
                      : dayOfWeek === 6 
                      ? { bg: "bg-blue-50/30 border-b border-blue-100/40", text: "text-blue-600/90", badge: "bg-blue-100/50 text-blue-600" }
                      : { bg: "bg-slate-50/80 border-b border-slate-100", text: "text-slate-700", badge: "bg-slate-200/60 text-slate-600" };

                    return (
                      <div key={ymd} className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
                        {/* 요일 헤더 */}
                        <div className={`px-4 py-2.5 flex items-center justify-between ${headerStyle.bg}`}>
                          <span className={`text-[12px] font-black tracking-tight ${headerStyle.text}`}>{formattedDate}</span>
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${headerStyle.badge}`}>{events.length}</span>
                        </div>

                        {/* 요일 내 이벤트 리스트 */}
                        <div className="divide-y divide-slate-100/60">
                          {events.map((ev: any, idx: number) => {
                            const isClickable = ["class", "social", "milonga", "practice"].includes(ev.type);
                            const hasMessage = ev.message && ev.message.trim() !== "";

                            const typeColors: Record<string, { bg: string; text: string; labelKo: string; labelEn: string }> = {
                              milonga: { bg: "bg-rose-50 text-rose-600", text: "text-rose-600", labelKo: "소셜", labelEn: "Social" },
                              social: { bg: "bg-rose-50 text-rose-600", text: "text-rose-600", labelKo: "소셜", labelEn: "Social" },
                              class: { bg: "bg-blue-50 text-blue-600", text: "text-blue-600", labelKo: "클래스", labelEn: "Class" },
                              practice: { bg: "bg-amber-50 text-amber-600", text: "text-amber-600", labelKo: "쁘락띠까", labelEn: "Practica" },
                              general: { bg: "bg-slate-50 text-slate-600", text: "text-slate-600", labelKo: "일반", labelEn: "General" },
                              rental: { bg: "bg-purple-50 text-purple-600", text: "text-purple-600", labelKo: "대관", labelEn: "Rental" },
                            };
                            const typeMeta = typeColors[ev.type] || typeColors.general;
                            const typeLabel = language === "KR" ? typeMeta.labelKo : typeMeta.labelEn;

                            return (
                              <div 
                                key={`${ev.id}-${idx}`}
                                onClick={isClickable ? () => handleEventClick(ev) : undefined}
                                className={`p-4 flex gap-3.5 items-start transition-all ${isClickable ? "cursor-pointer hover:bg-slate-50/40 active:bg-slate-50/80" : ""}`}
                                role={isClickable ? "button" : undefined}
                                tabIndex={isClickable ? 0 : undefined}
                              >
                                {/* 썸네일 이미지 */}
                                <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0 relative border border-slate-100/60 shadow-sm">
                                  {ev.imageUrl ? (
                                    <img 
                                      src={ev.imageUrl} 
                                      alt={ev.title} 
                                      className="w-full h-full object-cover"
                                      loading="lazy"
                                    />
                                  ) : (
                                    <div className={`w-full h-full bg-gradient-to-br ${
                                      ev.type === 'class' ? 'from-blue-400 to-indigo-500' :
                                      ev.type === 'practice' ? 'from-amber-400 to-orange-500' :
                                      'from-rose-400 to-pink-500'
                                    } flex items-center justify-center`}>
                                      <span className="material-symbols-outlined text-white !text-[16px]">
                                        {ev.type === 'class' ? 'school' :
                                         ev.type === 'practice' ? 'directions_run' :
                                         ev.type === 'milonga' ? 'local_fire_department' : 'event'}
                                      </span>
                                    </div>
                                  )}
                                </div>

                                {/* 텍스트 영역 */}
                                <div className="min-w-0 flex-1 space-y-1">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className={`text-[8px] font-black px-1.5 py-0.5 rounded ${typeMeta.bg}`}>
                                      {typeLabel}
                                    </span>
                                    {ev.startTime && (
                                      <span className="text-[10px] font-bold text-slate-400">
                                        {ev.startTime} {ev.endTime ? `~ ${ev.endTime}` : ""}
                                      </span>
                                    )}
                                  </div>

                                  <div className="space-y-0.5">
                                    <h4 className="text-[12.5px] font-black text-slate-800 leading-tight">
                                      {ev.title}
                                    </h4>
                                    {ev.subtitle && (
                                      <span className="text-[10px] font-medium text-slate-400 block truncate">
                                        {ev.subtitle}
                                      </span>
                                    )}
                                  </div>

                                  {/* 메타 배지 */}
                                  <div className="flex flex-wrap gap-x-2.5 gap-y-0.5 text-[9.5px] font-semibold text-slate-400 leading-tight">
                                    {hasMessage && (
                                      <span className="text-rose-500 bg-rose-50 font-bold px-1 rounded">
                                        {ev.message}
                                      </span>
                                    )}
                                    {ev.location && (
                                      <div className="flex items-center gap-0.5">
                                        <span className="material-symbols-outlined !text-[10px]">location_on</span>
                                        <span className="truncate max-w-[120px]">{ev.location}</span>
                                      </div>
                                    )}
                                    {ev.dj && (
                                      <div className="flex items-center gap-0.5">
                                        <span className="material-symbols-outlined !text-[10px]">headphones</span>
                                        <span className="truncate max-w-[90px]">{formatDjFilterName(ev.dj, language)}</span>
                                      </div>
                                    )}
                                    {ev.instructor && (
                                      <div className="flex items-center gap-0.5">
                                        <span className="material-symbols-outlined !text-[10px]">school</span>
                                        <span className="truncate max-w-[90px]">{formatInstructorNames(ev.instructor, language)}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 bg-white rounded-2xl border border-dashed border-slate-200">
                  <span className="material-symbols-outlined !text-[32px] text-slate-300 mb-2">event_busy</span>
                  <p className="text-[12px] font-semibold text-slate-400">
                    {language === "KR" ? "일정이 없습니다." : "No events scheduled."}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 소셜 상세 뷰어 */}
      {selectedSocial && (
        <SocialViewer
          social={selectedSocial}
          targetDate={socialTargetDate}
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

      {/* 월간일정 보기 풀스크린 모달 */}
      {showMonthCalendar && selectedGroup && (
        <div className="fixed inset-0 z-50 bg-[#f8fafc] flex flex-col animate-in fade-in duration-300">
          {/* 헤더 */}
          <div className="bg-white px-4 py-3.5 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">
                {t("today.monthly_schedule_title")}
              </span>
              <h2 className="text-[15px] font-black text-slate-800 leading-tight">
                {language === "KR" ? (selectedGroup.nativeName || selectedGroup.name) : selectedGroup.name}
              </h2>
            </div>
            <button
              onClick={closeMonthCalendar}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-50 text-slate-400 hover:text-slate-600 active:scale-90 transition-all"
            >
              <span className="material-symbols-outlined !text-[20px]">close</span>
            </button>
          </div>

          {/* 주차 선택 탭바 */}
          <div className="bg-white px-4 py-2.5 border-b border-slate-100 flex gap-1.5 overflow-x-auto no-scrollbar flex-shrink-0">
            {monthlyEventsByWeek.map(w => {
              const isSelected = selectedMonthTab === w.id;
              const tabLabel = language === "KR" ? w.labelKo : w.labelEn;
              return (
                <button
                  key={w.id}
                  onClick={() => setSelectedMonthTab(w.id)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-full text-[10px] font-black tracking-tight transition-all whitespace-nowrap border ${
                    isSelected
                      ? "bg-[#1e293b] text-white border-[#1e293b] shadow-sm"
                      : "bg-slate-50 text-slate-500 border-slate-100 hover:bg-slate-100"
                  }`}
                >
                  {tabLabel} ({w.events.length})
                </button>
              );
            })}
          </div>

          {/* 컨텐츠 영역 */}
          <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4">
            {monthlyEventsByWeek[selectedMonthTab]?.events.length > 0 ? (
              <div className="space-y-4">
                {monthlyEventsByWeek[selectedMonthTab].events.map((ev, idx) => {
                  const evDate = toJsDate(ev.startDate);
                  const formattedDay = language === "KR"
                    ? `${evDate.getMonth() + 1}월 ${evDate.getDate()}일 (${getDayLabel(language, evDate)})`
                    : evDate.toLocaleDateString("en-US", { month: "short", day: "numeric", weekday: "short" });

                  const bgGradients = [
                    "from-rose-500 to-orange-500",
                    "from-indigo-500 to-purple-500",
                    "from-blue-500 to-teal-500",
                    "from-amber-500 to-orange-500"
                  ];
                  const grad = bgGradients[idx % bgGradients.length];

                  const isClickable = ["class", "social", "milonga", "practice"].includes(ev.type);

                  return (
                    <div
                      key={`${ev.id}-${idx}`}
                      onClick={isClickable ? () => handleEventClick(ev) : undefined}
                      className={`w-full rounded-2xl overflow-hidden shadow-md relative text-left bg-gradient-to-br ${grad} p-5 text-white animate-in fade-in slide-in-from-bottom-2 duration-300 ${isClickable ? "cursor-pointer hover:shadow-lg transition-all" : ""}`}
                      role={isClickable ? "button" : undefined}
                      tabIndex={isClickable ? 0 : undefined}
                    >
                      <div className="flex items-center justify-between">
                        <span className="bg-white/20 backdrop-blur-sm text-[9px] font-black px-2 py-0.5 rounded-full leading-none">
                          {formattedDay}
                        </span>
                        {ev.startTime && (
                          <span className="text-[10px] font-black text-white/80">
                            {ev.startTime}
                          </span>
                        )}
                      </div>

                      <h3 className="text-base font-black text-white mt-3.5 leading-tight">
                        {ev.title}
                      </h3>

                      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 text-[10px] font-semibold text-white/80 border-t border-white/10 pt-3">
                        {ev.location && (
                          <div className="flex items-center gap-1">
                            <span className="material-symbols-outlined !text-[13px]">location_on</span>
                            <span>{ev.location}</span>
                          </div>
                        )}
                        {ev.dj && (
                          <div className="flex items-center gap-1">
                            <span className="material-symbols-outlined !text-[13px]">headphones</span>
                            <span>{formatDjFilterName(ev.dj, language)}</span>
                          </div>
                        )}
                        {ev.instructor && (
                          <div className="flex items-center gap-1">
                            <span className="material-symbols-outlined !text-[13px]">school</span>
                            <span>{formatInstructorNames(ev.instructor, language)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-center">
                <span className="material-symbols-outlined !text-[48px] text-slate-200 mb-2">event_busy</span>
                <p className="text-[12px] font-black text-slate-400 uppercase tracking-widest">{t("today.no_schedule")}</p>
              </div>
            )}
          </div>
          
          {/* 푸터 닫기 */}
          <div className="bg-white p-4 border-t border-slate-100/80 flex-shrink-0">
            <button
              onClick={closeMonthCalendar}
              className="w-full bg-[#1e293b] hover:bg-slate-800 text-white rounded-xl py-3 text-[12px] font-bold active:scale-95 transition-all"
            >
              {t("today.close")}
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

// 이벤트 제목 키워드 기반 다크 그라데이션 매핑 함수
function getEventTheme(title: string, index: number) {
  const lowerTitle = title.toLowerCase();
  if (lowerTitle.includes("championship") || lowerTitle.includes("championships") || lowerTitle.includes("대회") || lowerTitle.includes("선수권")) {
    return "from-[#0f172a] via-[#1e3a8a] to-[#0284c7]";
  }
  if (lowerTitle.includes("festival") || lowerTitle.includes("페스티벌") || lowerTitle.includes("축제") || lowerTitle.includes("party") || lowerTitle.includes("파티")) {
    return "from-[#4c0519] via-[#881337] to-[#e11d48]";
  }
  if (lowerTitle.includes("marathon") || lowerTitle.includes("마라톤") || lowerTitle.includes("milonga") || lowerTitle.includes("밀롱가")) {
    return "from-[#3b0764] via-[#5b21b6] to-[#a855f7]";
  }
  const defaultGradients = [
    "from-[#0f172a] via-[#1e293b] to-[#475569]",
    "from-[#064e3b] via-[#047857] to-[#10b981]",
    "from-[#1c1917] via-[#44403c] to-[#78716c]"
  ];
  return defaultGradients[index % defaultGradients.length];
}

// 날짜 기준 월 주차 계산 함수
function getWeekOfMonth(date: Date): number {
  const day = date.getDate();
  if (day >= 1 && day <= 7) return 1;
  if (day >= 8 && day <= 14) return 2;
  if (day >= 15 && day <= 21) return 3;
  if (day >= 22 && day <= 28) return 4;
  return 5;
}

// 소셜 양방향 다국어 타이틀 표기 함수 (KR: 월나다 Wol Nada / EN: Wol Nada 월나다)
function getSocialTitleDisplay(s: any, language: string) {
  const native = (s.titleNative || "").trim();
  const eng = (s.title || "").trim();
  if (native && eng && native !== eng) {
    return language === "KR" ? `${native} ${eng}` : `${eng} ${native}`;
  }
  return native || eng;
}
