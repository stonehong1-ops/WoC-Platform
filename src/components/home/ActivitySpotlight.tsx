'use client';

import React, { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { socialService } from '@/lib/firebase/socialService';
import { db } from '@/lib/firebase/clientApp';
import { collection, getDocs, query, limit } from 'firebase/firestore';
import { useLocation } from '@/components/providers/LocationProvider';
import { matchLocationGroup } from '@/app/social/constants/regionMapping';

export default function ActivitySpotlight() {
  const { t, language } = useLanguage();
  const { location } = useLocation();
  const [socialCount, setSocialCount] = useState(0);
  const [practicaCount, setPracticaCount] = useState(0);
  const [classCount, setClassCount] = useState(0);
  const [eventCount, setEventCount] = useState(0);
  const [cityName, setCityName] = useState('');
  const [cityLabel, setCityLabel] = useState('');
  const [societyId, setSocietyId] = useState('tango');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const sId = params.get('society') || sessionStorage.getItem('woc_society') || 'tango';
      setSocietyId(sId);
    }
  }, []);

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

        // 도시 이름 다국어 키 매핑
        const cityKey = location.city === 'ALL' || location.city === 'GLOBAL' ? 'SEOUL' : location.city;
        const cityCode = cityKey === 'SEOUL' ? 'Seoul, KR' : 
                         cityKey === 'BUSAN' ? 'Busan, KR' : 
                         cityKey === 'GWANGJU' ? 'Gwangju, KR' : 
                         cityKey === 'DAEJEON' ? 'Daejeon, KR' : `${cityKey}, KR`;
        
        const label = cityKey === 'SEOUL' ? '서울' :
                      cityKey === 'BUSAN' ? '부산' :
                      cityKey === 'GWANGJU' ? '광주' :
                      cityKey === 'DAEJEON' ? '대전' : cityKey;
        
        if (active) {
          setCityName(cityCode);
          setCityLabel(label);
        }

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
        } else {
          setSocialCount(0);
          setPracticaCount(0);
        }

        // 2. 클래스 실시간 데이터 바인딩 & 카운팅
        const classSnap = await getDocs(query(collection(db, 'groups'), limit(100)));
        let localClassesCount = 0;
        if (active && !classSnap.empty) {
          // 각 그룹의 classes 서브컬렉션을 한꺼번에 로드하기 위해 collectionGroup API 사용
          const { collectionGroup } = await import('firebase/firestore');
          const allClassSnap = await getDocs(collectionGroup(db, 'classes'));
          if (!allClassSnap.empty) {
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
            localClassesCount = localClasses.length;
          }
        }
        if (active) {
          setClassCount(localClassesCount);
        }

        // 3. 이벤트 실시간 데이터 바인딩 & 카운팅
        const eventSnap = await getDocs(query(collection(db, 'events'), limit(50)));
        let localEventsCount = 0;
        if (active && !eventSnap.empty) {
          const allEvents = eventSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }) as any);
          const localEvents = allEvents.filter(e => {
            if (societyId === 'tango') {
              if (e.societyId && e.societyId !== 'tango') return false;
            } else {
              if (e.societyId !== societyId) return false;
            }

            const start = e.startDate ? (typeof e.startDate.toDate === 'function' ? e.startDate.toDate() : new Date(e.startDate)) : null;
            const end = e.endDate ? (typeof e.endDate.toDate === 'function' ? e.endDate.toDate() : new Date(e.endDate)) : null;
            
            if (!start) return false;
            
            const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
            const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
            
            if (end) {
              return start <= todayEnd && end >= todayStart;
            } else {
              return start.getFullYear() === today.getFullYear() &&
                     start.getMonth() === today.getMonth() &&
                     start.getDate() === today.getDate();
            }
          });
          localEventsCount = localEvents.length;
        }
        if (active) {
          setEventCount(localEventsCount);
        }
      } catch (err) {
        console.error('ActivitySpotlight binding error:', err);
      }
    }

    loadData();
    return () => {
      active = false;
    };
  }, [location, language, societyId]);

  return (
    <section className="space-y-4">
      {/* Title & Divider */}
      <div className="space-y-2">
        <h2 className="text-[#1E293B] text-base md:text-lg font-black tracking-tight leading-none">
          {t('home.today_scene_title', { 
            city: language === 'KR' 
              ? cityLabel 
              : (location.city === 'ALL' || location.city === 'GLOBAL' ? 'Seoul' : location.city) 
          })}
        </h2>
        <div className="h-[1px] bg-slate-100/80 w-full" />
      </div>

      {/* 4-Column Grid Buttons */}
      <div className="grid grid-cols-4 gap-2 md:gap-4">
        {/* 1. 소셜 */}
        <a
          href="/social"
          className="group flex flex-col items-center justify-center p-3 md:p-5 bg-rose-50/20 hover:bg-rose-50/40 border border-rose-100/60 hover:border-rose-200/80 rounded-2xl shadow-[0_2px_8px_rgba(244,63,94,0.02)] hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 text-center no-underline cursor-pointer"
        >
          <span className="text-rose-600 font-black text-2xl md:text-3xl tracking-tight leading-none group-hover:scale-105 transition-transform duration-300">
            {socialCount}
          </span>
          <span className="text-slate-500 font-bold text-[10px] md:text-xs mt-1.5 whitespace-nowrap">
            {t('home.today_scene.social')}
          </span>
        </a>

        {/* 2. 쁘락띠까 */}
        <a
          href="/social"
          className="group flex flex-col items-center justify-center p-3 md:p-5 bg-amber-50/20 hover:bg-amber-50/40 border border-amber-100/60 hover:border-amber-200/80 rounded-2xl shadow-[0_2px_8px_rgba(245,158,11,0.02)] hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 text-center no-underline cursor-pointer"
        >
          <span className="text-amber-600 font-black text-2xl md:text-3xl tracking-tight leading-none group-hover:scale-105 transition-transform duration-300">
            {practicaCount}
          </span>
          <span className="text-slate-500 font-bold text-[10px] md:text-xs mt-1.5 whitespace-nowrap">
            {t('home.today_scene.practice')}
          </span>
        </a>

        {/* 3. 클래스 */}
        <a
          href="/class"
          className="group flex flex-col items-center justify-center p-3 md:p-5 bg-blue-50/20 hover:bg-blue-50/40 border border-blue-100/60 hover:border-blue-200/80 rounded-2xl shadow-[0_2px_8px_rgba(59,130,246,0.02)] hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 text-center no-underline cursor-pointer"
        >
          <span className="text-blue-600 font-black text-2xl md:text-3xl tracking-tight leading-none group-hover:scale-105 transition-transform duration-300">
            {classCount}
          </span>
          <span className="text-slate-500 font-bold text-[10px] md:text-xs mt-1.5 whitespace-nowrap">
            {t('home.today_scene.class')}
          </span>
        </a>

        {/* 4. 이벤트 */}
        <a
          href="/events"
          className="group flex flex-col items-center justify-center p-3 md:p-5 bg-indigo-50/20 hover:bg-indigo-50/40 border border-indigo-100/60 hover:border-indigo-200/80 rounded-2xl shadow-[0_2px_8px_rgba(99,102,241,0.02)] hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 text-center no-underline cursor-pointer"
        >
          <span className="text-indigo-600 font-black text-2xl md:text-3xl tracking-tight leading-none group-hover:scale-105 transition-transform duration-300">
            {eventCount}
          </span>
          <span className="text-slate-500 font-bold text-[10px] md:text-xs mt-1.5 whitespace-nowrap">
            {t('home.today_scene.event')}
          </span>
        </a>
      </div>
    </section>
  );
}
