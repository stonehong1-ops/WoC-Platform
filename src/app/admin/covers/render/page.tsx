'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { groupService } from '@/lib/firebase/groupService';
import { socialService } from '@/lib/firebase/socialService';
import { venueService } from '@/lib/firebase/venueService';
import ThemeMagazineA from '@/components/admin/covers/themes/ThemeMagazineA';
import ThemeMagazineB from '@/components/admin/covers/themes/ThemeMagazineB';
import ThemeMagazineC from '@/components/admin/covers/themes/ThemeMagazineC';
import ThemeMagazineD from '@/components/admin/covers/themes/ThemeMagazineD';
import { CoverEvent } from '@/components/admin/covers/CoverEditor';
import { formatInstructorNames, formatCommunityName } from "@/app/social/constants/seoulRegions";
import { getDjDisplay } from "@/lib/utils/socialUtils";

function RenderContent() {
  const searchParams = useSearchParams();
  
  const dateStr = searchParams.get('date');
  const theme = searchParams.get('theme') || 'A';
  const milongaId = searchParams.get('milongaId') || '';
  const classId = searchParams.get('classId') || '';
  const practicaId = searchParams.get('practicaId') || '';

  const [targetDate, setTargetDate] = useState<Date | null>(null);
  const [events, setEvents] = useState<CoverEvent[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [contentHeight, setContentHeight] = useState<number | 'auto'>('auto');

  // Date parsers from CoverEditor
  const parseDateStr = (date: any): string => {
    if (!date) return "";
    if (typeof date === "string") return date;
    if (date && typeof date.toDate === "function") {
      const d = date.toDate();
      return `${d.getFullYear().toString().slice(-2)}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    }
    return "";
  };

  const normalizeDateStr = (dStr: string): Date | null => {
    if (!dStr) return null;
    const normalized = dStr.replace(/[.\/]/g, "-").replace(/\s+/g, "");
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
  };

  useEffect(() => {
    if (dateStr) {
      const parsedDate = new Date(dateStr);
      // Adjust timezone offset to preserve local date
      const localDate = new Date(parsedDate.getTime() + parsedDate.getTimezoneOffset() * 60000);
      setTargetDate(localDate);
    } else {
      setTargetDate(new Date());
    }
  }, [dateStr]);

  useEffect(() => {
    if (!targetDate) return;

    const fetchEvents = async () => {
      try {
        const newEvents: CoverEvent[] = [];
        // 0. Fetch groups to map groupName for classes
        const allGroups = await groupService.getGroups();
        const groupMap = new Map(allGroups.map(g => [g.id, { name: g.nativeName || g.name || '', city: (g as any).city || g.address || '' }]));

        // 1. Fetch Socials, Practicas, and Venues
        const [socialsData, venuesData] = await Promise.all([
          socialService.getTodayActiveSocials(targetDate.getDay(), targetDate),
          venueService.getVenues()
        ]);
        const venuesMap = new Map(venuesData.map(v => [v.id, { name: v.nameKo || v.name || '', seoulArea: (v as any).seoulArea || '' }]));

        socialsData.forEach(data => {
           const orgStr = data.organizerNameNative || data.organizerNativeNames?.[0] || data.organizerName || '';
           newEvents.push({
             id: data.id,
             type: data.subCategory === 'practica' ? 'practice' : 'milonga',
             title: data.title || '',
             titleNative: data.titleNative || '',
             subtitle: formatCommunityName(orgStr, 'KR'),
             startTime: data.startTime || '',
             endTime: data.endTime || '',
             location: formatCommunityName(venuesMap.get(data.venueId || '')?.name || data.venueName || data.city || '', 'KR'),
             imageUrl: data.imageUrl || '',
             originalStartDate: targetDate,
             organizer: formatCommunityName(orgStr, 'KR'),
             dj: formatInstructorNames(getDjDisplay(data as any, targetDate, 'KR') || data.djName || data.djs?.[0]?.djName || '', 'KR'),
             city: data.city || '',
             seoulArea: venuesMap.get(data.venueId || '')?.seoulArea || ''
           });
        });

        // 2. Fetch Classes and filter by schedule
        try {
          const targetStr = targetDate.toDateString();
          const classesData = await groupService.getGlobalClassesAll();
          classesData.forEach(cls => {
            if (cls.status !== "Open") return;
            
            cls.schedule?.forEach((s: any) => {
              const dStr = parseDateStr(s.date);
              const clsDate = normalizeDateStr(dStr);
              if (clsDate && clsDate.toDateString() === targetStr) {
                const groupInfo = groupMap.get(cls.groupId || '') || { name: '', city: '' };
                newEvents.push({
                  id: `${cls.id}_${s.timeSlot || cls.startTime || ''}`,
                  type: 'class',
                  title: cls.name || cls.title || '',
                  titleNative: cls.nameNative || cls.titleNative || '',
                  subtitle: cls.instructor || '',
                  startTime: s.timeSlot || cls.startTime || '',
                  location: formatCommunityName(cls.venueName || '', 'KR'),
                  imageUrl: cls.imageUrl || cls.posterUrl || '',
                  originalStartDate: clsDate,
                  instructor: formatInstructorNames(cls.instructors?.slice(0, 2).map((i: any) => i.instructorNativeName || i.nameNative || i.name).join(', ') || cls.instructorNativeName || cls.instructor || '', 'KR'),
                  groupName: groupInfo.name || cls.groupName || '',
                  city: groupInfo.city || ''
                });
              }
            });
          });
        } catch (e) {
          console.error("Failed to fetch classes", e);
        }

        setEvents(newEvents);
        
        // Wait a bit to ensure images are loaded in the DOM
        setTimeout(() => setIsLoaded(true), 1500);

      } catch (error) {
        console.error("Failed to fetch events", error);
        setIsLoaded(true);
      }
    };

    fetchEvents();
  }, [targetDate]);

  // Measure content height for C/D themes after load
  useEffect(() => {
    if (!isLoaded) return;
    const timer = setTimeout(() => {
      const innerScaled = document.querySelector('.scale-\\[3\\]') as HTMLElement | null;
      if (innerScaled) {
        setContentHeight(innerScaled.offsetHeight * 3);
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [isLoaded, theme, events]);

  if (!targetDate || !isLoaded) {
    return <div className="w-[1080px] h-[1920px] bg-white flex items-center justify-center text-4xl">Loading...</div>;
  }

  const selectedMilonga = events.find(e => e.id === milongaId) || null;
  const selectedClass = events.find(e => e.id === classId) || null;
  const selectedPractica = events.find(e => e.id === practicaId) || null;
  
  const allMilongas = events.filter(e => e.type === 'milonga' || e.type === 'social');
  const allClasses = events.filter(e => e.type === 'class');
  const allPracticas = events.filter(e => e.type === 'practice');

  return (
    <div 
      id="capture-target"
      className="w-[1080px] relative bg-[#f5f5f7] overflow-hidden"
      style={{
        height: (theme === 'C' || theme === 'D')
          ? (contentHeight === 'auto' ? 'auto' : `${contentHeight}px`)
          : '1920px'
      }}
    >
      {theme === 'A' ? (
        <ThemeMagazineA 
          date={targetDate}
          milonga={selectedMilonga}
          tangoClass={selectedClass}
          practica={selectedPractica}
          allMilongas={allMilongas}
          allClasses={allClasses}
          allPracticas={allPracticas}
          region={{ ko: '서울', en: 'SEOUL' }}
        />
      ) : theme === 'B' ? (
        <ThemeMagazineB 
          date={targetDate}
          milonga={selectedMilonga}
          tangoClass={selectedClass}
          practica={selectedPractica}
          allMilongas={allMilongas}
          allClasses={allClasses}
          allPracticas={allPracticas}
          region={{ ko: '서울', en: 'SEOUL' }}
        />
      ) : theme === 'C' ? (
        <ThemeMagazineC 
          date={targetDate}
          allMilongas={allMilongas}
          allClasses={allClasses}
          allPracticas={allPracticas}
          region={{ ko: '서울', en: 'SEOUL' }}
        />
      ) : (
        <ThemeMagazineD 
          date={targetDate}
          allMilongas={allMilongas}
          allClasses={allClasses}
          allPracticas={allPracticas}
          region={{ ko: '서울', en: 'SEOUL' }}
        />
      )}
      <div id="render-complete" style={{ display: 'none' }}></div>
    </div>
  );
}

export default function RenderPage() {
  return (
    <Suspense fallback={<div className="w-[1080px] h-[1920px] bg-white"></div>}>
      <RenderContent />
    </Suspense>
  );
}
