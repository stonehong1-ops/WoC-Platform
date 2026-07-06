'use client';

import React, { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { socialService } from '@/lib/firebase/socialService';
import { db } from '@/lib/firebase/clientApp';
import { collectionGroup, getDocs, limit, query } from 'firebase/firestore';
import { getSafeStorageUrl } from '@/lib/utils/storageUtils';
import SectionHeader from '@/components/common/SectionHeader';
import { useLocation } from '@/components/providers/LocationProvider';
import { matchLocationGroup } from '@/app/social/constants/regionMapping';

interface SocialDisplay {
  title: string;
  dj: string;
  dateTime: string;
  location: string;
  imageUrl: string;
}

interface ClassDisplay {
  title: string;
  instructors: string;
  dateTime: string;
  location: string;
  imageUrl: string;
}

const GRAY_PLACEHOLDER = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100'><rect width='100' height='100' fill='%23E2E8F0'/></svg>";

export default function ActivitySpotlight() {
  const { t, language } = useLanguage();
  const { location } = useLocation();
  const [socialData, setSocialData] = useState<SocialDisplay | null>(null);
  const [classData, setClassData] = useState<ClassDisplay | null>(null);
  const [socialCount, setSocialCount] = useState(0);
  const [practicaCount, setPracticaCount] = useState(0);
  const [classCount, setClassCount] = useState(0);
  const [cityName, setCityName] = useState('');

  useEffect(() => {
    let active = true;

    async function loadData() {
      try {
        const today = new Date();
        const dayOfWeek = today.getDay();
        const todayStr = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');

        const krDays = ['일', '월', '화', '수', '목', '금', '토'];
        const enDays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
        const krDay = krDays[dayOfWeek];
        const enDay = enDays[dayOfWeek];

        // 도시 이름 다국어 키 매핑 (Seoul, KR 형태로 포맷팅)
        const cityKey = location.city === 'ALL' || location.city === 'GLOBAL' ? 'SEOUL' : location.city;
        const cityCode = cityKey === 'SEOUL' ? 'Seoul, KR' : 
                         cityKey === 'BUSAN' ? 'Busan, KR' : 
                         cityKey === 'GWANGJU' ? 'Gwangju, KR' : 
                         cityKey === 'DAEJEON' ? 'Daejeon, KR' : `${cityKey}, KR`;
        setCityName(cityCode);

        // 1. 소셜 실시간 데이터 바인딩 & 카운팅
        const socials = await socialService.getTodayActiveSocials(dayOfWeek, today);
        if (active && socials && socials.length > 0) {
          const localActiveSocials = socials.filter(s => {
            const resolvedCity = s.city || s.venueName || (s as any).location || '';
            return matchLocationGroup(location.city, resolvedCity);
          });

          const practicas = localActiveSocials.filter(s => s.subCategory === 'practica');
          const milongas = localActiveSocials.filter(s => s.subCategory !== 'practica');
          setSocialCount(milongas.length);
          setPracticaCount(practicas.length);

          if (localActiveSocials.length > 0) {
            // 정렬: Milonga 우선 > Regular(정규) 우선 > 이미지 보유 우선 가점제
            const getSocialScore = (s: any) => {
              let score = 0;
              if (s.subCategory !== 'practica') score += 100;
              if (s.type === 'regular') score += 50;
              if (s.imageUrl && s.imageUrl !== GRAY_PLACEHOLDER) score += 10;
              return score;
            };
            localActiveSocials.sort((a, b) => getSocialScore(b) - getSocialScore(a));
            const first = localActiveSocials[0];

            // 한글/로컬명 최우선 분기 매칭
            const title = language === 'KR' && first.titleNative ? first.titleNative : first.title;
            const dj = language === 'KR' && (first.djNameNative || (first as any).djNativeName)
              ? (first.djNameNative || (first as any).djNativeName)
              : (first.djName || first.organizerName || 'DJ Lucy');
            const locationStr = language === 'KR' && first.venueNameNative
              ? first.venueNameNative
              : (first.venueName || (first as any).location || '홍대 Tango Club');

            let eventDateStr = '6. 8(일)';
            if (first.date) {
              const d = typeof first.date.toDate === 'function' ? first.date.toDate() : new Date(first.date as any);
              eventDateStr = `${d.getMonth() + 1}. ${d.getDate()}(${['일', '월', '화', '수', '목', '금', '토'][d.getDay()]})`;
            }

            setSocialData({
              title: title || "Lucy's Milonga",
              dj: dj,
              dateTime: `${eventDateStr} · ${first.startTime || '19:30'} - ${first.endTime || '23:30'}`,
              location: locationStr,
              imageUrl: first.imageUrl || GRAY_PLACEHOLDER
            });
          } else {
            setSocialData(null);
          }
        } else {
          setSocialCount(0);
          setPracticaCount(0);
          setSocialData(null);
        }

        // 2. 클래스 실시간 데이터 바인딩 & 카운팅
        const allClassSnap = await getDocs(collectionGroup(db, 'classes'));
        if (active && !allClassSnap.empty) {
          const allClassesList = allClassSnap.docs.map(d => ({ id: d.id, ...d.data() }) as any);

          const localClasses = allClassesList.filter(c => {
            if (c.status !== 'Open') return false;

            const hasTodaySchedule = c.schedule?.some((entry: any) => {
              if (entry.date && entry.date === todayStr) return true;
              if (entry.timeSlot) {
                const slotUpper = entry.timeSlot.toUpperCase();
                if (slotUpper.includes(krDay) || slotUpper.includes(enDay)) return true;
              }
              return false;
            });
            if (!hasTodaySchedule) return false;

            const resolvedCity = (c as any).location || '';
            return matchLocationGroup(location.city, resolvedCity);
          });
          setClassCount(localClasses.length);

          if (localClasses.length > 0) {
            // 정렬: 이미지 보유 우선
            const getClassScore = (c: any) => {
              let score = 0;
              if (c.imageUrl && c.imageUrl !== GRAY_PLACEHOLDER) score += 10;
              return score;
            };
            localClasses.sort((a, b) => getClassScore(b) - getClassScore(a));
            const firstClass = localClasses[0];

            // 한글/로컬명 최우선 분기 매칭
            const title = language === 'KR' && (firstClass as any).titleNative ? (firstClass as any).titleNative : firstClass.title;
            const instNames = firstClass.instructors && Array.isArray(firstClass.instructors)
              ? firstClass.instructors.map((i: any) => {
                  if (language === 'KR') {
                    return i.nameNative || i.nativeName || i.name;
                  }
                  return i.name;
                }).join(' & ')
              : 'Dahee & Miguel';
            const locationStr = language === 'KR' && (firstClass as any).locationNative
              ? (firstClass as any).locationNative
              : (firstClass.location || '라 벤타나');

            let sched = '매주 화 · 20:00 - 21:30';
            if (firstClass.schedule && firstClass.schedule[0]) {
              const entry = firstClass.schedule[0];
              sched = entry.timeSlot || '매주 화 · 20:00 - 21:30';
            }

            setClassData({
              title: title || 'Intermediate Tango Class',
              instructors: instNames,
              dateTime: sched,
              location: locationStr,
              imageUrl: firstClass.imageUrl || GRAY_PLACEHOLDER
            });
          } else {
            setClassData(null);
          }
        } else {
          setClassCount(0);
          setClassData(null);
        }
      } catch (err) {
        console.error('ActivitySpotlight binding error:', err);
      }
    }

    loadData();
    return () => {
      active = false;
    };
  }, [location, language]);

  // fallback/hardcoded data from screenshot
  const displaySocial = socialData || {
    title: "Lucy's Milonga",
    dj: "DJ Lucy",
    dateTime: "6. 8(일) · 19:30 - 23:30",
    location: "홍대 Tango Club",
    imageUrl: GRAY_PLACEHOLDER
  };

  const displayClass = classData || {
    title: "Intermediate Tango Class",
    instructors: "Dahee & Miguel",
    dateTime: "매주 화 · 20:00 - 21:30",
    location: "라 벤타나",
    imageUrl: GRAY_PLACEHOLDER
  };

  return (
    <section className="space-y-4">
      {/* Section Header (단일 전체보기 제거) */}
      <SectionHeader 
        title="오늘의 하이라이트"
      />

      {/* 2-Column Bento Grid (Mobile: 1-Column stack for legibility) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Card 1: Today's Social */}
        <a
          href="/today"
          className="group relative flex items-start gap-4 p-5 bg-white rounded-2xl border border-outline/10 shadow-sm transition-all duration-300 hover:shadow-md hover:scale-[1.01] active:scale-95 text-left no-underline h-full"
        >
          {/* Left: Square Image with Rounded Corners */}
          <div className="w-24 h-24 rounded-xl overflow-hidden flex-shrink-0 border border-outline/10 shadow-inner">
            <img 
              alt={displaySocial.title} 
              className="w-full h-full object-cover" 
              src={getSafeStorageUrl(displaySocial.imageUrl)}
              onError={(e) => {
                e.currentTarget.src = GRAY_PLACEHOLDER;
              }}
            />
          </div>

          {/* Right: Info fields stacked vertically */}
          <div className="flex-1 min-w-0 flex flex-col justify-between h-full min-h-[96px]">
            <div>
              {/* Pink Badge with Local Metas */}
              <span className="text-[#FF2D55] text-[11px] font-black tracking-wider uppercase block mb-1">
                {t('home.spotlight.social_summary', { city: cityName || 'Seoul, KR', socialCount: socialCount, practicaCount: practicaCount })}
              </span>

              {/* Title & DJ */}
              <h3 className="text-slate-900 font-bold text-base leading-tight mb-0.5 line-clamp-1">
                {displaySocial.title}
              </h3>
              <p className="text-slate-500 text-xs mb-2">
                {displaySocial.dj}
              </p>
            </div>

            {/* Details (Date & Location) */}
            <div className="space-y-1 text-slate-600 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-slate-400 text-[14px]">calendar_today</span>
                <span className="line-clamp-1">{displaySocial.dateTime}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-slate-400 text-[14px]">location_on</span>
                <span className="line-clamp-1">{displaySocial.location}</span>
              </div>
            </div>
          </div>

          {/* Arrow Button */}
          <div className="self-end w-9 h-9 rounded-full border border-outline/10 flex items-center justify-center bg-slate-50 text-slate-700 transition-colors group-hover:bg-primary group-hover:text-white group-hover:border-primary flex-shrink-0 ml-2">
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </div>
        </a>

        {/* Card 2: Open Class */}
        <a
          href="/class"
          className="group relative flex items-start gap-4 p-5 bg-white rounded-2xl border border-outline/10 shadow-sm transition-all duration-300 hover:shadow-md hover:scale-[1.01] active:scale-95 text-left no-underline h-full"
        >
          {/* Left: Square Image with Rounded Corners */}
          <div className="w-24 h-24 rounded-xl overflow-hidden flex-shrink-0 border border-outline/10 shadow-inner">
            <img 
              alt={displayClass.title} 
              className="w-full h-full object-cover" 
              src={getSafeStorageUrl(displayClass.imageUrl)}
              onError={(e) => {
                e.currentTarget.src = GRAY_PLACEHOLDER;
              }}
            />
          </div>

          {/* Right: Info fields stacked vertically */}
          <div className="flex-1 min-w-0 flex flex-col justify-between h-full min-h-[96px]">
            <div>
              {/* Blue Badge with Local Metas */}
              <span className="text-[#0A84FF] text-[11px] font-black tracking-wider uppercase block mb-1">
                {t('home.spotlight.class_summary', { city: cityName || 'Seoul, KR', count: classCount })}
              </span>

              {/* Title & Instructors */}
              <h3 className="text-slate-900 font-bold text-base leading-tight mb-0.5 line-clamp-1">
                {displayClass.title}
              </h3>
              <p className="text-slate-500 text-xs mb-2">
                {displayClass.instructors}
              </p>
            </div>

            {/* Details (Date & Location) */}
            <div className="space-y-1 text-slate-600 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-slate-400 text-[14px]">calendar_today</span>
                <span className="line-clamp-1">{displayClass.dateTime}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-slate-400 text-[14px]">location_on</span>
                <span className="line-clamp-1">{displayClass.location}</span>
              </div>
            </div>
          </div>

          {/* Arrow Button */}
          <div className="self-end w-9 h-9 rounded-full border border-outline/10 flex items-center justify-center bg-slate-50 text-slate-700 transition-colors group-hover:bg-primary group-hover:text-white group-hover:border-primary flex-shrink-0 ml-2">
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </div>
        </a>
      </div>
    </section>
  );
}
