'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { groupService } from '@/lib/firebase/groupService';
import { socialService } from '@/lib/firebase/socialService';
import ThemeMagazineA from '@/components/admin/covers/themes/ThemeMagazineA';
import ThemeMagazineB from '@/components/admin/covers/themes/ThemeMagazineB';
import { CoverEvent } from '@/components/admin/covers/CoverEditor';

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

  // Date parsers
  const parseDateStr = (date: any): string => {
    if (typeof date === 'string') return date;
    if (date && typeof date === 'object' && date.seconds) {
      return new Date(date.seconds * 1000).toISOString().split('T')[0];
    }
    return '';
  };

  const normalizeDateStr = (dateStr: string): string => {
    return dateStr.replace(/\//g, '-');
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

        // 1. Fetch Socials
        try {
          const socials = await socialService.getTodayActiveSocials(targetDate.getDay(), targetDate);
          socials.forEach(s => {
            const data = s as any;
            newEvents.push({
              id: s.id,
              type: data.type === 'practice' ? 'practice' : 'milonga',
              title: data.title || '',
              titleNative: data.titleNative || '',
              subtitle: data.organizerName || '',
              startTime: data.startTime || '',
              location: data.venueName || data.city || '',
              instructor: '',
              imageUrl: data.imageUrl || '',
              originalStartDate: targetDate
            });
          });
        } catch (e) {
          console.error("Failed to fetch socials", e);
        }

        // 2. Fetch Classes
        try {
          const groups = await groupService.getGroups();
          const classGroups = groups.filter((g: any) => g.type === 'class');
          const targetDateStr = targetDate.toISOString().split('T')[0];

          classGroups.forEach((cls: any) => {
            const schedules = Array.isArray(cls.schedule) ? cls.schedule : [];
            schedules.forEach((s: any) => {
              const sDate = s.date ? normalizeDateStr(parseDateStr(s.date)) : null;
              if (sDate === targetDateStr) {
                newEvents.push({
                  id: `${cls.id}_${s.id || Math.random()}`,
                  type: 'class',
                  title: cls.name || cls.title || '',
                  titleNative: cls.nameNative || cls.titleNative || '',
                  subtitle: cls.instructor || '',
                  startTime: s.timeSlot || cls.startTime || '',
                  location: cls.venueName || '',
                  instructor: cls.instructor || '',
                  imageUrl: cls.imageUrl || cls.posterUrl || '',
                  originalStartDate: targetDate
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
    <div className="w-[1080px] h-[1920px] relative bg-white overflow-hidden">
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
      ) : (
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
