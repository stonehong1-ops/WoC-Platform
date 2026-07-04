'use client';

import React, { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { socialService } from '@/lib/firebase/socialService';
import { db } from '@/lib/firebase/clientApp';
import { collectionGroup, getDocs, limit, query } from 'firebase/firestore';
import { getSafeStorageUrl } from '@/lib/utils/storageUtils';
import SectionHeader from '@/components/common/SectionHeader';

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
  const { t } = useLanguage();
  const [socialData, setSocialData] = useState<SocialDisplay | null>(null);
  const [classData, setClassData] = useState<ClassDisplay | null>(null);

  useEffect(() => {
    let active = true;

    async function loadData() {
      try {
        // 1. 소셜 실시간 데이터 바인딩
        const today = new Date();
        const dayOfWeek = today.getDay();
        const socials = await socialService.getTodayActiveSocials(dayOfWeek, today);
        if (active && socials && socials.length > 0) {
          const first = socials[0];
          const dj = first.djName || first.organizerName || 'DJ Lucy';
          
          let eventDateStr = '6. 8(일)';
          if (first.date) {
            const d = typeof first.date.toDate === 'function' ? first.date.toDate() : new Date(first.date as any);
            eventDateStr = `${d.getMonth() + 1}. ${d.getDate()}(${['일', '월', '화', '수', '목', '금', '토'][d.getDay()]})`;
          }
          
          setSocialData({
            title: first.title || "Lucy's Milonga",
            dj: dj,
            dateTime: `${eventDateStr} · ${first.startTime || '19:30'} - ${first.endTime || '23:30'}`,
            location: first.venueName || '홍대 Tango Club',
            imageUrl: first.imageUrl || GRAY_PLACEHOLDER
          });
        }

        // 2. 클래스 실시간 데이터 바인딩
        const classesQuery = query(collectionGroup(db, 'classes'), limit(1));
        const classesSnap = await getDocs(classesQuery);
        if (active && !classesSnap.empty) {
          const firstDoc = classesSnap.docs[0];
          const data = firstDoc.data();
          const instNames = data.instructors && Array.isArray(data.instructors)
            ? data.instructors.map((i: any) => i.name).join(' & ')
            : 'Dahee & Miguel';
          
          let sched = '매주 화 · 20:00 - 21:30';
          if (data.schedule && data.schedule[0]) {
            const entry = data.schedule[0];
            sched = entry.timeSlot || '매주 화 · 20:00 - 21:30';
          }
          setClassData({
            title: data.title || 'Intermediate Tango Class',
            instructors: instNames,
            dateTime: sched,
            location: data.location || '라 벤타나',
            imageUrl: data.imageUrl || GRAY_PLACEHOLDER
          });
        }
      } catch (err) {
        console.error('ActivitySpotlight binding error:', err);
      }
    }

    loadData();
    return () => {
      active = false;
    };
  }, []);

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
      {/* Section Header */}
      <SectionHeader 
        title="오늘의 하이라이트"
        actionLabel={t('home.view_all') || '전체 보기'}
        href="/social"
      />

      {/* 2-Column Bento Grid (Mobile: 1-Column stack for legibility) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Card 1: Today's Social */}
        <a
          href="/social"
          className="group relative flex flex-col justify-between p-5 bg-white rounded-2xl border border-outline/10 shadow-sm transition-all duration-300 hover:shadow-md hover:scale-[1.01] active:scale-95 text-left no-underline"
        >
          <div>
            {/* Pink Badge */}
            <span className="text-[#FF2D55] text-[11px] font-black tracking-wider uppercase block mb-3">
              SOCIAL
            </span>

            {/* Profile Row */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0 border border-outline/10 shadow-inner">
                <img 
                  alt={displaySocial.title} 
                  className="w-full h-full object-cover" 
                  src={getSafeStorageUrl(displaySocial.imageUrl)}
                  onError={(e) => {
                    e.currentTarget.src = GRAY_PLACEHOLDER;
                  }}
                />
              </div>
              <div>
                <h3 className="text-slate-900 font-bold text-base leading-tight mb-1 line-clamp-2">
                  {displaySocial.title}
                </h3>
                <p className="text-slate-500 text-xs">
                  {displaySocial.dj}
                </p>
              </div>
            </div>
          </div>

          {/* Details & Action */}
          <div className="mt-6 flex items-end justify-between">
            <div className="space-y-1.5 text-slate-600 text-xs pr-4">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-slate-400 text-[16px]">calendar_today</span>
                <span>{displaySocial.dateTime}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-slate-400 text-[16px]">location_on</span>
                <span>{displaySocial.location}</span>
              </div>
            </div>

            {/* Arrow Button */}
            <div className="w-9 h-9 rounded-full border border-outline/10 flex items-center justify-center bg-slate-50 text-slate-700 transition-colors group-hover:bg-primary group-hover:text-white group-hover:border-primary flex-shrink-0">
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </div>
          </div>
        </a>

        {/* Card 2: Open Class */}
        <a
          href="/class"
          className="group relative flex flex-col justify-between p-5 bg-white rounded-2xl border border-outline/10 shadow-sm transition-all duration-300 hover:shadow-md hover:scale-[1.01] active:scale-95 text-left no-underline"
        >
          <div>
            {/* Blue Badge */}
            <span className="text-[#0A84FF] text-[11px] font-black tracking-wider uppercase block mb-3">
              CLASS
            </span>

            {/* Profile Row */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0 border border-outline/10 shadow-inner">
                <img 
                  alt={displayClass.title} 
                  className="w-full h-full object-cover" 
                  src={getSafeStorageUrl(displayClass.imageUrl)}
                  onError={(e) => {
                    e.currentTarget.src = GRAY_PLACEHOLDER;
                  }}
                />
              </div>
              <div>
                <h3 className="text-slate-900 font-bold text-base leading-tight mb-1 line-clamp-2">
                  {displayClass.title}
                </h3>
                <p className="text-slate-500 text-xs">
                  {displayClass.instructors}
                </p>
              </div>
            </div>
          </div>

          {/* Details & Action */}
          <div className="mt-6 flex items-end justify-between">
            <div className="space-y-1.5 text-slate-600 text-xs pr-4">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-slate-400 text-[16px]">calendar_today</span>
                <span>{displayClass.dateTime}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-slate-400 text-[16px]">location_on</span>
                <span>{displayClass.location}</span>
              </div>
            </div>

            {/* Arrow Button */}
            <div className="w-9 h-9 rounded-full border border-outline/10 flex items-center justify-center bg-slate-50 text-slate-700 transition-colors group-hover:bg-primary group-hover:text-white group-hover:border-primary flex-shrink-0">
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </div>
          </div>
        </a>
      </div>
    </section>
  );
}
