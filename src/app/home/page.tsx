'use client';

import { useState, useEffect } from 'react';
import Script from 'next/script';
import GaviCartoonPopup from '@/components/home/GaviCartoonPopup';
import EventViewer from '@/components/events/EventViewer';
import UserProfilePopup from '@/components/profile/UserProfilePopup';
import ActivitySpotlight from '@/components/home/ActivitySpotlight';
import { eventService } from '@/lib/firebase/eventService';
import { userService } from '@/lib/firebase/userService';
import { venueService } from '@/lib/firebase/venueService';
import { db } from '@/lib/firebase/clientApp';
import { doc, getDoc, collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { Event as EventType } from '@/types/event';
import { PlatformUser } from '@/types/user';
import { useLanguage } from '@/contexts/LanguageContext';
import societiesData from '../../../woc_societies_data.json';

export default function SocietyPage() {
  const { t, language, setLanguage } = useLanguage();

  const formatDate = (date: Date, formatType: string) => {
    try {
      if (formatType === 'dateOnly') {
        return date.toLocaleDateString(language === 'KR' ? 'ko-KR' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' });
      }
      return date.toLocaleDateString(language === 'KR' ? 'ko-KR' : 'en-US', { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  const formatRelativeTime = (date: Date) => {
    try {
      const rtf = new Intl.RelativeTimeFormat(language === 'KR' ? 'ko-KR' : 'en', { numeric: 'auto' });
      const daysDifference = Math.round((date.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      if (Math.abs(daysDifference) < 1) {
        const hoursDifference = Math.round((date.getTime() - new Date().getTime()) / (1000 * 60 * 60));
        if (Math.abs(hoursDifference) < 1) {
            const minutesDifference = Math.round((date.getTime() - new Date().getTime()) / (1000 * 60));
            return rtf.format(minutesDifference, 'minute');
        }
        return rtf.format(hoursDifference, 'hour');
      }
      return rtf.format(daysDifference, 'day');
    } catch {
      return '';
    }
  };

  const getEventDateString = (evt?: EventType | null) => {
    const target = evt || heroEvent;
    if (!target || !target.startDate) return "2025. 8. 29(금) ~ 9. 1(월)";
    const start = typeof target.startDate.toDate === 'function' ? target.startDate.toDate() : new Date(target.startDate as any);
    const startStr = `${start.getFullYear()}. ${start.getMonth() + 1}. ${start.getDate()}(${['일', '월', '화', '수', '목', '금', '토'][start.getDay()]})`;
    if (target.endDate) {
      const end = typeof target.endDate.toDate === 'function' ? target.endDate.toDate() : new Date(target.endDate as any);
      const endStr = start.getFullYear() === end.getFullYear()
        ? `${end.getMonth() + 1}. ${end.getDate()}(${['일', '월', '화', '수', '목', '금', '토'][end.getDay()]})`
        : `${end.getFullYear()}. ${end.getMonth() + 1}. ${end.getDate()}(${['일', '월', '화', '수', '목', '금', '토'][end.getDay()]})`;
      return `${startStr} ~ ${endStr}`;
    }
    return startStr;
  };

  const [isCartoonsOpen, setIsCartoonsOpen] = useState(false);
  const [twReady, setTwReady] = useState(false);
  const [heroEvent, setHeroEvent] = useState<EventType | null>(null);
  const [heroEvents, setHeroEvents] = useState<EventType[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<EventType | null>(null);
  const [activeDotIndex, setActiveDotIndex] = useState(0);
  const [isEventDetailOpen, setIsEventDetailOpen] = useState(false);
  const [featuredUsers, setFeaturedUsers] = useState<PlatformUser[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isSafeFloorOpen, setIsSafeFloorOpen] = useState(false);
  const [comingSoonCard, setComingSoonCard] = useState<{title: string; icon: string; desc: string} | null>(null);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);

  const [societyId, setSocietyId] = useState('tango');
  const [totalMembers, setTotalMembers] = useState<number>(2184);
  const [totalCities, setTotalCities] = useState<number>(27);
  const [weeklyNewMembers, setWeeklyNewMembers] = useState<number>(0);
  const [totalGroups, setTotalGroups] = useState<number>(63);
  const [totalCountries, setTotalCountries] = useState<number>(2);
  
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sId = params.get('society');
    if (sId) {
      setSocietyId(sId);
      // Persist society context for cross-page navigation
      sessionStorage.setItem('woc_society', sId);
    }
  }, []);

  const societyInfo = societiesData.find((s: any) => s.id === societyId) || societiesData[0];

  // Fetch up to 5 events for Hero Slider (society-aware)
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const q = query(
          collection(db, 'events'),
          orderBy('startDate', 'desc'),
          limit(30)
        );
        const snap = await getDocs(q);
        const allEvents = snap.docs.map(doc => {
          const data = doc.data();
          return { id: doc.id, ...data } as unknown as EventType;
        });
        const filtered = allEvents.filter(e => {
          if (societyId === 'tango') return !e.societyId || e.societyId === 'tango';
          return e.societyId === societyId;
        });
        const slice = filtered.slice(0, 5);
        setHeroEvents(slice);
        if (slice.length > 0) {
          setHeroEvent(slice[0]);
        }
      } catch (err) {
        console.error('Error fetching hero events:', err);
      }
    };
    fetchEvents();
  }, [societyId]);

  // Slider dot track
  useEffect(() => {
    const slider = document.getElementById('hero-slider');
    if (!slider) return;
    const handleScroll = () => {
      if (slider.offsetWidth > 0) {
        const index = Math.round(slider.scrollLeft / slider.offsetWidth);
        setActiveDotIndex(index);
      }
    };
    slider.addEventListener('scroll', handleScroll, { passive: true });
    return () => slider.removeEventListener('scroll', handleScroll);
  }, [heroEvents]);

  // Fetch featured users (instructors)
  useEffect(() => {
    userService.getInstructors().then((users) => {
      const instructors = users.sort((a, b) => a.nickname.localeCompare(b.nickname));
      setFeaturedUsers(instructors);
    }).catch(console.error);
  }, []);

  // Fetch statistics dynamically with single doc cache and fallback self-healing
  useEffect(() => {
    async function loadStats() {
      try {
        const statsDocRef = doc(db, 'settings', 'stats');
        const statsSnap = await getDoc(statsDocRef);
        
        const now = Date.now();
        if (statsSnap.exists()) {
          const statsData = statsSnap.data();
          const updatedAt = statsData.updatedAt || 0;
          
          // 24 hours cache validity
          if (now - updatedAt < 86400000) {
            setTotalGroups(statsData.totalGroups || 63);
            setTotalMembers(statsData.totalMembers || 2184);
            setWeeklyNewMembers(statsData.weeklyNewMembers || 0);
            setTotalCities(statsData.totalCities || 27);
            setTotalCountries(statsData.totalCountries || 2);
            return;
          }
        }
        
        // Background scan & update cache if expired or missing
        const [groupsSnap, users, venues] = await Promise.all([
          getDocs(collection(db, 'groups')),
          userService.getAllUsers(),
          venueService.getVenues()
        ]);
        
        const gCount = groupsSnap.size;
        const mCount = users.length + 50;
        
        const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
        let newCount = 0;
        users.forEach((u) => {
          let userTime = null;
          if (u.createdAt) {
            if (u.createdAt.seconds !== undefined) {
              userTime = u.createdAt.seconds * 1000;
            } else if (typeof u.createdAt === 'number') {
              userTime = u.createdAt;
            } else if (typeof u.createdAt.toDate === 'function') {
              userTime = u.createdAt.toDate().getTime();
            } else if (typeof u.createdAt === 'string') {
              userTime = new Date(u.createdAt).getTime();
            }
          }
          if (userTime && userTime >= sevenDaysAgo) {
            newCount++;
          }
        });
        
        const citiesSet = new Set<string>();
        const countriesSet = new Set<string>();
        const activeVenues = venues.filter(v => v.status === 'active');
        
        activeVenues.forEach((venue) => {
          if (venue.city) {
            const cityNorm = venue.city.trim().toUpperCase();
            const countryNorm = (venue.country || '').trim().toUpperCase();
            const isKorea = countryNorm === 'KOREA' || countryNorm === 'SOUTH KOREA' || countryNorm === 'SOUTH_KOREA';
            const isShanghai = cityNorm === 'SHANGHAI' || venue.city.includes('상하이');
            if (isKorea || isShanghai) {
              citiesSet.add(cityNorm);
            }
          }
          if (venue.country) {
            let countryNorm = venue.country.trim().toUpperCase();
            if (countryNorm === 'KOREA' || countryNorm === 'SOUTH_KOREA') {
              countryNorm = 'SOUTH KOREA';
            }
            countriesSet.add(countryNorm);
          }
        });
        
        // 가입 회원들의 국가코드 추가 합산
        users.forEach((u) => {
          if (u.countryCode) {
            let countryNorm = u.countryCode.trim().toUpperCase();
            if (countryNorm === 'KR' || countryNorm === 'KOREA' || countryNorm === 'SOUTH_KOREA') {
              countryNorm = 'SOUTH KOREA';
            } else if (countryNorm === 'SG' || countryNorm === 'SINGAPORE') {
              countryNorm = 'SINGAPORE';
            } else if (countryNorm === 'US' || countryNorm === 'USA' || countryNorm === 'UNITED STATES') {
              countryNorm = 'UNITED STATES';
            } else if (countryNorm === 'CN' || countryNorm === 'CHINA') {
              countryNorm = 'CHINA';
            } else if (countryNorm === 'AU' || countryNorm === 'AUSTRALIA') {
              countryNorm = 'AUSTRALIA';
            }
            countriesSet.add(countryNorm);
          }
        });
        
        const cCount = citiesSet.size || 27;
        const coCount = countriesSet.size || 3;
        
        setTotalGroups(gCount);
        setTotalMembers(mCount);
        setWeeklyNewMembers(newCount);
        setTotalCities(cCount);
        setTotalCountries(coCount);
        
        // Update stats cache
        const { setDoc } = await import('firebase/firestore');
        await setDoc(statsDocRef, {
          totalGroups: gCount,
          totalMembers: mCount,
          weeklyNewMembers: newCount,
          totalCities: cCount,
          totalCountries: coCount,
          updatedAt: now
        }, { merge: true });
        
      } catch (err) {
        console.error("Error loading stats dynamically:", err);
      }
    }
    loadStats();
  }, []);

  // Force Tailwind CDN re-process on client-side navigation
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).tailwind) {
      setTwReady(true);
      const evt = new window.Event('tailwind:refresh');
      document.dispatchEvent(evt);
      document.documentElement.classList.add('tw-refresh');
      requestAnimationFrame(() => document.documentElement.classList.remove('tw-refresh'));
    }
  }, []);

  return (
    <>
      {/* Tailwind CDN - loaded via Next.js Script for proper lifecycle management */}
      <Script
        src="https://cdn.tailwindcss.com?plugins=forms,container-queries"
        strategy="afterInteractive"
        onLoad={() => {
          if (typeof window !== 'undefined' && (window as any).tailwind) {
            (window as any).tailwind.config = {
              darkMode: 'class',
              theme: {
                extend: {
                  colors: {
                    'surface-container': '#f2ecf4',
                    'outline': '#7a7582',
                    'on-secondary-fixed-variant': '#4b4263',
                    'on-error-container': '#93000a',
                    'on-primary-fixed': '#22005d',
                    'background': '#fdf7ff',
                    'inverse-surface': '#322f35',
                    'surface-bright': '#fdf7ff',
                    'on-secondary-container': '#645a7d',
                    'primary-container': '#6750a4',
                    'on-surface-variant': '#494551',
                    'tertiary-container': '#c9a74d',
                    'secondary': '#63597c',
                    'error-container': '#ffdad6',
                    'on-secondary-fixed': '#1f1635',
                    'on-tertiary-container': '#503d00',
                    'outline-variant': '#cbc4d2',
                    'surface': '#fdf7ff',
                    'on-tertiary': '#ffffff',
                    'on-background': '#1d1b20',
                    'tertiary-fixed': '#ffdf93',
                    'inverse-on-surface': '#f5eff7',
                    'on-primary': '#ffffff',
                    'inverse-primary': '#cfbcff',
                    'surface-container-lowest': '#ffffff',
                    'surface-container-highest': '#e6e0e9',
                    'on-surface': '#1d1b20',
                    'tertiary-fixed-dim': '#e7c365',
                    'on-tertiary-fixed-variant': '#594400',
                    'secondary-container': '#e1d4fd',
                    'primary': '#004190',
                    'surface-tint': '#6750a4',
                    'error': '#ba1a1a',
                    'secondary-fixed': '#e9ddff',
                    'on-primary-container': '#e0d2ff',
                    'surface-container-low': '#f8f2fa',
                    'on-primary-fixed-variant': '#4f378a',
                    'secondary-fixed-dim': '#cdc0e9',
                    'surface-dim': '#ded8e0',
                    'primary-fixed': '#e9ddff',
                    'on-error': '#ffffff',
                    'on-secondary': '#ffffff',
                    'tertiary': '#765b00',
                    'on-tertiary-fixed': '#241a00',
                    'surface-variant': '#e6e0e9',
                    'primary-fixed-dim': '#cfbcff',
                    'surface-container-high': '#ece6ee',
                  },
                  borderRadius: { DEFAULT: '4px', lg: '8px', xl: '12px', full: '24px' },
                  spacing: {
                    page_margin: '24px', section_gap: '40px', element_gap: '16px',
                    component_padding_x: '16px', component_padding_y: '12px',
                  },
                  fontFamily: {
                    'body-lg': ['Inter'], 'label-md': ['Inter'],
                    'headline-md': ['Plus Jakarta Sans'], 'headline-lg': ['Plus Jakarta Sans'],
                    'display-lg': ['Plus Jakarta Sans'], 'body-md': ['Inter'],
                    'label-sm': ['Inter'], 'title-lg': ['Plus Jakarta Sans'],
                  },
                  fontSize: {
                    'body-lg': ['18px', { lineHeight: '1.6', fontWeight: '500' }],
                    'label-md': ['14px', { lineHeight: '1.2', fontWeight: '600' }],
                    'headline-md': ['24px', { lineHeight: '1.3', fontWeight: '800' }],
                    'headline-lg': ['32px', { lineHeight: '1.2', letterSpacing: '-0.01em', fontWeight: '800' }],
                    'display-lg': ['56px', { lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: '800' }],
                    'body-md': ['16px', { lineHeight: '1.6', fontWeight: '500' }],
                    'label-sm': ['12px', { lineHeight: '1.2', fontWeight: '500' }],
                    'title-lg': ['20px', { lineHeight: '1.4', fontWeight: '700' }],
                  },
                },
              },
            };
            setTwReady(true);
          }
        }}
      />
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@700;800&family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet"/>
      <style jsx global>{`
        .material-symbols-outlined {
          font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <div className={`bg-background text-on-background antialiased font-body-md w-full relative transition-opacity duration-500 ${twReady ? 'opacity-100' : 'opacity-0'}`}>
        {!twReady && (
          <div className="fixed inset-0 z-[9999] bg-[#fdf7ff] flex flex-col items-center justify-center">
            <div className="w-10 h-10 rounded-full border-4 border-[#004190]/10 border-t-[#004190] animate-spin"></div>
            <p className="mt-4 font-label-sm text-[12px] text-slate-500 uppercase tracking-widest animate-pulse">Tango Society</p>
          </div>
        )}

        {/* Hero (Global) — Event Slider */}
        <section className="relative w-full aspect-[2.35/1] min-h-[300px] md:max-h-[500px] overflow-hidden">
          <div 
            id="hero-slider"
            className="w-full h-full flex overflow-x-auto snap-x snap-mandatory scroll-smooth hide-scrollbar"
          >
            {heroEvents.length > 0 ? (
              heroEvents.map((evt, idx) => (
                <div key={evt.id} className="w-full h-full flex-shrink-0 snap-start relative flex items-end">
                  <div className="absolute inset-0 z-0">
                    <img 
                      alt={evt.title} 
                      className="w-full h-full object-cover" 
                      src={evt.imageUrl || "/slide4_bg_cinematic.jpg"}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent"></div>
                  </div>
                  <div className="relative z-10 max-w-7xl mx-auto px-page_margin pb-8 md:pb-10 w-full">
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 text-left text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.85)]">
                      <span className="bg-[#6750A4] text-white text-[10px] font-black tracking-widest px-2.5 py-0.5 rounded-full mb-3 inline-block uppercase drop-shadow-none">
                        EVENT
                      </span>
                      <h1 className="text-white font-headline text-xl md:text-3xl font-black tracking-tight mb-2.5 uppercase leading-tight line-clamp-1">
                        {language === 'KR' && evt.titleNative ? evt.titleNative : evt.title}
                      </h1>
                      
                      {/* Event Meta rows */}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs md:text-sm text-white/95 mb-4">
                        <div className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[16px] text-white/70">calendar_today</span>
                          <span>{getEventDateString(evt)}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[16px] text-white/70">location_on</span>
                          <span>{evt.venueName || evt.location || "서울"}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[16px] text-white/70">person</span>
                          <span>{language === 'KR' && evt.hostNameNative ? evt.hostNameNative : evt.hostName}</span>
                        </div>
                      </div>

                      <button
                        className="bg-[#6750A4] text-white font-bold py-2 px-5 rounded-full shadow-lg hover:bg-[#5a4393] transition-colors text-xs active:scale-95 drop-shadow-none"
                        onClick={() => {
                          setSelectedEvent(evt);
                          setIsEventDetailOpen(true);
                        }}
                      >
                        참여하기
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              // Default Fallback Slide
              <div className="w-full h-full flex-shrink-0 snap-start relative flex items-end">
                <div className="absolute inset-0 z-0">
                  <img 
                    alt="Seoul Tango Festival 2025" 
                    className="w-full h-full object-cover" 
                    src="/slide4_bg_cinematic.jpg"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent"></div>
                </div>
                <div className="relative z-10 max-w-7xl mx-auto px-page_margin pb-8 md:pb-10 w-full">
                  <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 text-left text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.85)]">
                    <span className="bg-[#6750A4] text-white text-[10px] font-black tracking-widest px-2.5 py-0.5 rounded-full mb-3 inline-block uppercase drop-shadow-none">
                      EVENT
                    </span>
                    <h1 className="text-white font-headline text-xl md:text-3xl font-black tracking-tight mb-2.5 uppercase leading-tight">
                      SEOUL TANGO FESTIVAL 2025
                    </h1>
                    
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs md:text-sm text-white/95 mb-4">
                      <div className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[16px] text-white/70">calendar_today</span>
                        <span>2025. 8. 29(금) ~ 9. 1(월)</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[16px] text-white/70">location_on</span>
                        <span>서울</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[16px] text-white/70">person</span>
                        <span>Seoul Tango Committee</span>
                      </div>
                    </div>

                    <button
                      className="bg-[#6750A4] text-white font-bold py-2 px-5 rounded-full shadow-lg hover:bg-[#5a4393] transition-colors text-xs active:scale-95 drop-shadow-none"
                      onClick={() => setComingSoonCard({ title: 'Seoul Tango Festival 2025', icon: 'celebration', desc: '서울 탱고 페스티벌 2025 세부 정보가 곧 공개됩니다.' })}
                    >
                      참여하기
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Slider Indicator Dots */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10">
            {Array.from({ length: Math.max(heroEvents.length, 1) }).map((_, i) => (
              <span 
                key={i} 
                className={`w-2 h-2 rounded-full transition-all duration-300 ${activeDotIndex === i ? 'bg-white w-2.5 h-2.5' : 'bg-white/40'}`}
              ></span>
            ))}
          </div>
        </section>

        <main className="max-w-7xl mx-auto px-page_margin py-section_gap space-y-section_gap">
          {/* 오늘의 하이라이트 */}
          <ActivitySpotlight />

          {/* Culture & Canvas */}
          <section>
            <div className="flex items-center justify-between mb-element_gap">
              <h2 className="font-headline-md text-headline-md font-bold text-[#1E293B]">{t('home.culture_canvas')}</h2>
              <a className="text-slate-500 font-label-md text-sm flex items-center gap-1 hover:text-primary transition-colors" href="/pics">
                {t('home.view_all')}
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </a>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Large Spotlight Card: 기존 포커스 바인딩 */}
              <div 
                className="col-span-2 row-span-2 relative h-[360px] md:h-[480px] rounded-2xl overflow-hidden group cursor-pointer border border-outline/5 shadow-sm"
                onClick={() => setIsSafeFloorOpen(true)}
              >
                <img 
                  alt={societyInfo.blog_title || "탱고, 우리 삶의 언어"} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                  src="/life_on_bg.jpg"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent flex flex-col justify-end p-6 text-left">
                  <span className="absolute top-4 left-4 z-10 bg-[#6750A4] text-white text-[10px] font-bold px-2 py-0.5 rounded tracking-widest">FOCUS</span>
                  <span className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-1">
                    {societyInfo.blog_core_keyword || "탱고칼럼"}
                  </span>
                  <h3 className="text-white font-bold text-2xl mb-2">
                    {societyInfo.blog_title || "탱고, 우리 삶의 언어"}
                  </h3>
                  <p className="text-white/80 text-sm leading-relaxed max-w-md">
                    {societyInfo.blog_description || "탱고는 단순한 춤이 아니라, 우리가 서로를 이해하는 방식이다."}
                  </p>
                </div>
              </div>

              {/* Card 1: 가비의 탱고툰 */}
              <div 
                className="relative h-[172px] md:h-[232px] rounded-2xl overflow-hidden group cursor-pointer border border-outline/5 shadow-sm"
                onClick={() => setIsCartoonsOpen(true)}
              >
                <img alt="가비의 탱고툰" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" src="/gavi.jpg"/>
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-4 text-left">
                  <h4 className="text-white font-bold text-base">가비의 탱고툰</h4>
                </div>
              </div>

              {/* Card 2: 탱고뮤직 365 */}
              <div 
                className="relative h-[172px] md:h-[232px] rounded-2xl overflow-hidden group cursor-pointer border border-outline/5 shadow-sm"
                onClick={() => setComingSoonCard({ title: '탱고뮤직 365', icon: 'music_note', desc: '탱고뮤직 365 세부 정보가 곧 공개됩니다.' })}
              >
                <img alt="탱고뮤직 365" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" src="/camus.jpg"/>
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-4 text-left">
                  <h4 className="text-white font-bold text-base">탱고뮤직 365</h4>
                </div>
              </div>

              {/* Card 3: 베토의 탱고여행 */}
              <div 
                className="relative h-[172px] md:h-[232px] rounded-2xl overflow-hidden group cursor-pointer border border-outline/5 shadow-sm"
                onClick={() => setComingSoonCard({ title: '베토의 탱고여행', icon: 'explore', desc: '베토의 탱고여행 세부 정보가 곧 공개됩니다.' })}
              >
                <img alt="베토의 탱고여행" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" src="/beto.jpg"/>
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-4 text-left">
                  <h4 className="text-white font-bold text-base">베토의 탱고여행</h4>
                </div>
              </div>

              {/* Card 4: 탱고의 역사 리뷰 */}
              <div 
                className="relative h-[172px] md:h-[232px] rounded-2xl overflow-hidden group cursor-pointer border border-outline/5 shadow-sm"
                onClick={() => setComingSoonCard({ title: '탱고의 역사 리뷰', icon: 'history_edu', desc: '탱고의 역사 리뷰 세부 정보가 곧 공개됩니다.' })}
              >
                <img alt="탱고의 역사 리뷰" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" src="/ddakji.jpg"/>
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-4 text-left">
                  <h4 className="text-white font-bold text-base">탱고의 역사 리뷰</h4>
                </div>
              </div>
            </div>
          </section>

          {/* People — Dynamic from Firestore */}
          <section>
            <div className="flex items-center justify-between mb-element_gap">
              <h2 className="font-headline-md text-headline-md font-bold text-[#1E293B]">알아야 할 사람들</h2>
              <a 
                className="text-slate-500 font-label-md text-sm flex items-center gap-1 hover:text-primary transition-colors" 
                href="/people"
              >
                {t('home.view_all')}
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </a>
            </div>
            
            <div className="flex gap-8 overflow-x-auto hide-scrollbar -mx-page_margin px-page_margin md:mx-0 md:px-0 py-2">
              {featuredUsers.length > 0 ? (
                featuredUsers.map((user) => (
                  <div 
                    key={user.id} 
                    onClick={() => setSelectedUserId(user.id)} 
                    className="flex-shrink-0 text-center w-28 md:w-32 group cursor-pointer"
                  >
                    <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden mb-3 ring-2 ring-transparent group-hover:ring-primary transition-all p-1 bg-slate-50 mx-auto">
                      <img 
                        alt={user.nickname} 
                        className="w-full h-full object-cover rounded-full" 
                        src={user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.nickname)}&background=6750a4&color=fff&size=128`}
                      />
                    </div>
                    <h4 className="font-bold text-slate-800 text-sm md:text-base mb-0.5">{user.nickname}</h4>
                    <p className="text-slate-400 text-xs">{user.isInstructor ? t('common.instructor') : t('common.member')}</p>
                  </div>
                ))
              ) : (
                [
                  { id: 'amy', nickname: 'Amy', photoURL: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200', isInstructor: true, flag: '🇺🇦' },
                  { id: 'aran', nickname: 'Aran', photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200', isInstructor: true },
                  { id: 'arbol', nickname: 'Arbol', photoURL: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?q=80&w=200', isInstructor: true },
                  { id: 'gabriel', nickname: 'Gabriel', photoURL: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200', isInstructor: true },
                  { id: 'luna', nickname: 'Luna', photoURL: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200', isInstructor: true },
                  { id: 'beto', nickname: 'Beto', photoURL: '/beto.jpg', isInstructor: false, customRole: '칼럼니스트' }
                ].map((user) => (
                  <div 
                    key={user.id} 
                    onClick={() => {
                      if (user.id === 'beto') {
                        setComingSoonCard({ title: 'Beto', icon: 'person', desc: 'Beto 칼럼니스트의 상세 정보가 곧 제공됩니다.' });
                      } else {
                        setComingSoonCard({ title: user.nickname, icon: 'person', desc: `${user.nickname} 강사의 상세 정보가 곧 제공됩니다.` });
                      }
                    }} 
                    className="flex-shrink-0 text-center w-28 md:w-32 group cursor-pointer"
                  >
                    <div className="relative w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden mb-3 ring-2 ring-transparent group-hover:ring-primary transition-all p-1 bg-slate-50 mx-auto">
                      <img 
                        alt={user.nickname} 
                        className="w-full h-full object-cover rounded-full" 
                        src={user.photoURL}
                      />
                      {(user as any).flag && (
                        <span className="absolute bottom-1 left-1 text-base bg-white/80 rounded-full px-1 shadow-sm select-none">{(user as any).flag}</span>
                      )}
                    </div>
                    <h4 className="font-bold text-slate-800 text-sm md:text-base mb-0.5">{user.nickname}</h4>
                    <p className="text-slate-400 text-xs">{(user as any).customRole || (user.isInstructor ? t('common.instructor') : t('common.member'))}</p>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* 순간을 느끼다 */}
          <section>
            <div className="flex items-center justify-between mb-element_gap">
              <h2 className="font-headline-md text-headline-md font-bold text-[#1E293B]">순간을 느끼다</h2>
              <a className="text-slate-500 font-label-md text-sm flex items-center gap-1 hover:text-primary transition-colors" href="/live">
                {t('home.view_all')}
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </a>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {/* Card 1: Holding hands */}
              <div 
                onClick={() => setComingSoonCard({ title: '순간을 느끼다', icon: 'photo_camera', desc: '사진/영상 상세 보기가 준비 중입니다.' })}
                className="aspect-square bg-slate-100 rounded-xl overflow-hidden group relative cursor-pointer"
              >
                <img alt="Visual Grid" className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-500" src="https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=400"/>
                <div className="absolute bottom-2 right-2 flex items-center justify-center text-white pointer-events-none">
                  <span className="material-symbols-outlined text-white/95 text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>play_circle</span>
                </div>
              </div>

              {/* Card 2: Arch silhouette */}
              <div 
                onClick={() => setComingSoonCard({ title: '순간을 느끼다', icon: 'photo_camera', desc: '사진/영상 상세 보기가 준비 중입니다.' })}
                className="aspect-square bg-slate-100 rounded-xl overflow-hidden group relative cursor-pointer"
              >
                <img alt="Visual Grid" className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-500" src="https://images.unsplash.com/photo-1464746133101-a2c3f88e0dd9?q=80&w=400"/>
                <div className="absolute bottom-2 right-2 flex items-center justify-center text-white pointer-events-none">
                  <span className="material-symbols-outlined text-white/95 text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>play_circle</span>
                </div>
              </div>

              {/* Card 3: Shoes */}
              <div 
                onClick={() => setComingSoonCard({ title: '순간을 느끼다', icon: 'photo_camera', desc: '사진/영상 상세 보기가 준비 중입니다.' })}
                className="aspect-square bg-slate-100 rounded-xl overflow-hidden group relative cursor-pointer"
              >
                <img alt="Visual Grid" className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-500" src="https://images.unsplash.com/photo-1549298916-b41d501d3772?q=80&w=400"/>
              </div>

              {/* Card 4: Theater Couple */}
              <div 
                onClick={() => setComingSoonCard({ title: '순간을 느끼다', icon: 'photo_camera', desc: '사진/영상 상세 보기가 준비 중입니다.' })}
                className="aspect-square bg-slate-100 rounded-xl overflow-hidden group relative cursor-pointer"
              >
                <img alt="Visual Grid" className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-500" src="https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?q=80&w=400"/>
                <div className="absolute bottom-2 right-2 flex items-center justify-center text-white pointer-events-none">
                  <span className="material-symbols-outlined text-white/95 text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>play_circle</span>
                </div>
              </div>
            </div>
          </section>
        </main>

        <footer className="bg-background border-t border-outline/15 py-section_gap">
          <div className="max-w-7xl mx-auto px-page_margin flex flex-col items-center gap-10">
            {/* 로고 */}
            <div className="font-headline-md text-headline-md font-extrabold text-on-background text-center">
              {t('home.global_tango_society')}
            </div>

            {/* 회원카운트 격자 카드 (소사이어티 페이지 스타일 연장선) */}
            <div className="w-full bg-surface-container-lowest rounded-2xl border border-outline/10 overflow-hidden shadow-sm">
              <div className="grid grid-cols-4 divide-x divide-outline/10 py-6">
                {/* 1. 그룹·모임 */}
                <div className="flex flex-col items-center justify-center text-center">
                  <div className="h-5 mb-1"></div>
                  <span className="text-[32px] font-extrabold text-[#1E293B] leading-none mb-2">70</span>
                  <span className="text-[12px] font-medium text-slate-500">그룹·모임</span>
                </div>
                
                {/* 2. 멤버 */}
                <div className="flex flex-col items-center justify-center text-center">
                  <div className="h-5 mb-1 flex items-center justify-center">
                    <span className="text-[11px] font-bold bg-[#EADDFF] text-[#6750A4] px-1.5 py-0.5 rounded-full select-none">
                      {weeklyNewMembers > 0 ? `+${weeklyNewMembers}` : '+13'}
                    </span>
                  </div>
                  <span className="text-[32px] font-extrabold text-[#1E293B] leading-none mb-2">
                    {totalMembers.toLocaleString()}
                  </span>
                  <span className="text-[12px] font-medium text-slate-500">멤버</span>
                </div>

                {/* 3. 도시 */}
                <div className="flex flex-col items-center justify-center text-center">
                  <div className="h-5 mb-1"></div>
                  <span className="text-[32px] font-extrabold text-[#1E293B] leading-none mb-2">11</span>
                  <span className="text-[12px] font-medium text-slate-500">도시</span>
                </div>

                {/* 4. 국가 */}
                <div className="flex flex-col items-center justify-center text-center">
                  <div className="h-5 mb-1"></div>
                  <span className="text-[32px] font-extrabold text-[#1E293B] leading-none mb-2">5</span>
                  <span className="text-[12px] font-medium text-slate-500">국가</span>
                </div>
              </div>
            </div>

            {/* 하단 푸터 링크 & 카피라이트 */}
            <div className="w-full flex flex-col md:flex-row justify-between items-center gap-6 pt-6 border-t border-outline/10">
              <nav className="flex flex-wrap justify-center gap-6">
                <button 
                  onClick={() => setIsAboutOpen(true)}
                  className="text-on-surface-variant hover:text-primary transition-colors font-label-md text-label-md bg-transparent border-none cursor-pointer"
                >
                  소개
                </button>
                <button 
                  onClick={() => setIsTermsOpen(true)}
                  className="text-on-surface-variant hover:text-primary transition-colors font-label-md text-label-md bg-transparent border-none cursor-pointer"
                >
                  이용약관
                </button>
                <button 
                  onClick={() => setIsPrivacyOpen(true)}
                  className="text-on-surface-variant hover:text-primary transition-colors font-label-md text-label-md bg-transparent border-none cursor-pointer"
                >
                  개인정보처리방침
                </button>
              </nav>
              <div className="text-on-surface-variant font-label-sm text-label-sm text-center md:text-right">
                {t('common.footer_rights')}
              </div>
            </div>
          </div>
        </footer>
      </div>

      {/* Gavi's Tango Cartoons Full Popup */}
      {isCartoonsOpen && (
        <GaviCartoonPopup onClose={() => setIsCartoonsOpen(false)} />
      )}

      {/* Event Detail Full-Screen Popup */}
      {isEventDetailOpen && (selectedEvent || heroEvent) && (
        <EventViewer event={selectedEvent || heroEvent!} onClose={() => setIsEventDetailOpen(false)} />
      )}


      {/* User Profile Popup */}
      <UserProfilePopup
        isOpen={!!selectedUserId}
        onClose={() => setSelectedUserId(null)}
        uid={selectedUserId || ''}
      />

      {/* Safe Floor Policy Full-Screen Popup */}
      {isSafeFloorOpen && (
        <div className="fixed inset-0 z-[10000] bg-white flex flex-col animate-in fade-in duration-500 overflow-y-auto">
          {/* High-Impact Hero Section */}
          <div className="relative w-full h-[50vh] flex-shrink-0">
            <img 
              src="https://images.unsplash.com/photo-1518609878373-06d740f60d8b?q=80&w=1200" 
              alt="Safe Floor" 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-black/30"></div>
            
            {/* Close Button */}
            <div className="absolute top-0 left-0 w-full p-6 flex justify-end">
              <button 
                onClick={() => setIsSafeFloorOpen(false)}
                className="w-12 h-12 flex items-center justify-center rounded-full bg-black/20 backdrop-blur-md text-white hover:bg-black/40 transition-all shadow-lg"
              >
                <span className="material-symbols-outlined text-[28px]">close</span>
              </button>
            </div>

            <div className="absolute bottom-0 left-0 w-full p-8 md:p-16">
              <div className="max-w-4xl mx-auto w-full">
                <span className="px-4 py-1.5 bg-red-600 text-white text-[12px] font-bold uppercase tracking-widest rounded-lg mb-6 inline-block shadow-xl animate-in slide-in-from-left duration-700">{t('home.policy.zero_tolerance')}</span>
                <h2 className="text-4xl md:text-7xl font-extrabold text-slate-900 font-headline leading-tight animate-in slide-in-from-bottom duration-700 delay-100">
                  {t('home.policy.headline')}
                </h2>
              </div>
            </div>
          </div>
          
          {/* Policy Content */}
          <div className="flex-1 bg-white pb-24">
            <div className="max-w-4xl mx-auto px-8 md:px-16 py-12 space-y-12">
              <div className="prose prose-slate prose-xl max-w-none">
                <p className="text-2xl md:text-3xl font-medium text-slate-800 leading-relaxed font-headline italic border-l-8 border-primary pl-8 py-4 bg-slate-50 rounded-r-3xl animate-in fade-in duration-1000 delay-300">
                  {t('home.policy.intro')}
                </p>
                
                <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                  <div className="relative group overflow-hidden rounded-[40px] shadow-2xl animate-in zoom-in duration-1000 delay-400">
                    <img 
                      src="https://images.unsplash.com/photo-1542332213-31f87348057f?q=80&w=800" 
                      alt="Tango dancers" 
                      className="w-full h-80 object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 ring-1 ring-inset ring-black/10 rounded-[40px]"></div>
                  </div>
                  <div className="flex flex-col justify-center animate-in slide-in-from-right duration-700 delay-500">
                    <h3 className="text-3xl font-black text-slate-900 mb-6 font-headline tracking-tight">{t('home.policy.section1.title')}</h3>
                    <p className="text-slate-600 text-lg leading-relaxed">
                      {t('home.policy.section1.desc')}
                    </p>
                  </div>
                </div>

                <div className="pt-16 border-t border-slate-100 space-y-12">
                  <h3 className="text-3xl md:text-4xl font-black text-slate-900 font-headline flex items-center gap-4 animate-in fade-in duration-700 delay-600">
                    <span className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20">
                      <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>verified_user</span>
                    </span>
                    {t('home.policy.promise.title')}
                  </h3>
                  
                  <div className="grid grid-cols-1 gap-6">
                    {[
                      { id: 1, title: t('home.policy.point1.title'), desc: t('home.policy.point1.desc'), color: 'red' },
                      { id: 2, title: t('home.policy.point2.title'), desc: t('home.policy.point2.desc'), color: 'blue' },
                      { id: 3, title: t('home.policy.point3.title'), desc: t('home.policy.point3.desc'), color: 'green' }
                    ].map((point, idx) => (
                      <div 
                        key={point.id} 
                        className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 animate-in fade-in slide-in-from-bottom duration-700"
                        style={{ animationDelay: `${700 + (idx * 100)}ms` }}
                      >
                        <div className="flex items-start gap-6">
                          <span className={`flex-shrink-0 w-14 h-14 rounded-2xl bg-${point.color}-50 text-${point.color}-600 flex items-center justify-center text-xl font-black border border-${point.color}-100 shadow-inner`}>
                            {point.id}
                          </span>
                          <div>
                            <h4 className="font-black text-slate-900 text-xl mb-3 font-headline">{point.title}</h4>
                            <p className="text-slate-600 text-lg leading-relaxed">{point.desc}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-20 p-12 md:p-20 bg-slate-900 text-white rounded-[60px] text-center relative overflow-hidden shadow-2xl animate-in zoom-in duration-1000 delay-1000">
                  <div className="absolute inset-0 opacity-40 bg-[url('https://images.unsplash.com/photo-1508807526345-15e9b5f4eaff?q=80&w=1200')] bg-cover bg-center"></div>
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/90 to-transparent"></div>
                  <div className="relative z-10 max-w-2xl mx-auto">
                    <h3 className="text-3xl md:text-5xl font-black font-headline mb-8 leading-tight">{t('home.policy.footer.title')}</h3>
                    <p className="text-white/80 text-xl leading-relaxed mb-10">
                      {t('home.policy.footer.desc')}
                    </p>
                    <button 
                      onClick={() => setIsSafeFloorOpen(false)}
                      className="px-12 py-5 bg-white text-slate-900 text-lg font-black rounded-2xl hover:bg-slate-100 hover:scale-105 active:scale-95 transition-all shadow-xl"
                    >
                      {t('home.policy.acknowledge')}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Coming Soon Fullscreen */}
      {comingSoonCard && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center animate-in fade-in duration-300">
          <button 
            onClick={() => setComingSoonCard(null)}
            className="absolute top-6 right-6 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all z-10"
          >
            <span className="material-symbols-outlined text-[24px]">close</span>
          </button>

          <div className="flex flex-col items-center text-center px-8 max-w-md animate-in zoom-in-95 duration-500">
            <div className="w-24 h-24 rounded-[28px] bg-white/10 backdrop-blur-xl flex items-center justify-center mb-8 ring-1 ring-white/10">
              <span className="material-symbols-outlined text-white/80 text-[48px]">{comingSoonCard.icon}</span>
            </div>
            <h2 className="text-3xl font-black text-white mb-3 font-headline tracking-tight">{comingSoonCard.title}</h2>
            <p className="text-white/60 text-base leading-relaxed mb-10">{comingSoonCard.desc}</p>
            
            <div className="flex items-center gap-3 mb-12">
              <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></div>
              <span className="text-amber-400 text-sm font-bold uppercase tracking-[0.2em]">{t('common.coming_soon')}</span>
            </div>

            <p className="text-white/40 text-sm leading-relaxed max-w-xs">
              {t('home.coming_soon_desc')}
            </p>

            <button 
              onClick={() => setComingSoonCard(null)}
              className="mt-10 px-10 py-4 bg-white/10 hover:bg-white/20 text-white font-bold rounded-2xl transition-all active:scale-95 ring-1 ring-white/10"
            >
              {t('common.got_it')}
            </button>
          </div>
        </div>
      )}

      {/* 소개 (About) Fullscreen Popup */}
      {isAboutOpen && (
        <div className="fixed inset-0 z-[10000] bg-white flex flex-col animate-in fade-in duration-500 overflow-y-auto">
          {/* Header */}
          <div className="flex-shrink-0 w-full p-6 border-b border-outline/10 flex justify-between items-center bg-slate-50">
            <h2 className="text-xl font-extrabold text-slate-900 font-headline">World of Community (WoC) 소개</h2>
            <button 
              onClick={() => setIsAboutOpen(false)}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-200/80 hover:bg-slate-200 text-slate-700 transition-all animate-none"
            >
              <span className="material-symbols-outlined text-[24px]">close</span>
            </button>
          </div>
          {/* Content */}
          <div className="flex-1 bg-white p-8 md:p-16 max-w-4xl mx-auto w-full">
            <div className="prose prose-slate max-w-none space-y-6 text-left">
              <h3 className="text-3xl font-black text-[#6750A4] mb-6">글로벌 탱고 및 커뮤니티 통합 플랫폼</h3>
              <p className="text-slate-700 text-lg leading-relaxed">
                World of Community (WoC)는 전 세계의 탱고 애호가, 댄서, 강사 및 스튜디오 운영자를 하나의 디지털 생태계로 연결하기 위해 설계된 프리미엄 글로벌 통합 서비스입니다.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 my-10">
                <div className="p-6 bg-slate-50 rounded-2xl border border-outline/5">
                  <h4 className="font-bold text-slate-900 text-lg mb-2">실시간 밀롱가 & 소셜 탐색</h4>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    오늘 서울에서 열리는 밀롱가 정보부터 해외 주요 도시의 소셜 이벤트 일정까지, 사용자의 로컬 타임존과 GPS에 기반하여 정밀한 실시간 데이터를 바인딩하여 제공합니다.
                  </p>
                </div>
                <div className="p-6 bg-slate-50 rounded-2xl border border-outline/5">
                  <h4 className="font-bold text-slate-900 text-lg mb-2">전문가 수준의 클래스 관리</h4>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    아카데미와 강사분들을 위한 스마트 일정 기획, 신청자 관리, 번들 할인 및 월간 패스 예약 시스템을 원스톱으로 지원합니다.
                  </p>
                </div>
              </div>
              <p className="text-slate-700 text-base leading-relaxed">
                우리는 단순히 정보를 나열하는 것을 넘어, 전 세계 지역 커뮤니티가 자생적으로 성장하고 서로 교류할 수 있는 문화를 개척합니다. WoC와 함께 매혹적인 탱고의 여정을 언제 어디서나 생생하게 누려보세요.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 이용약관 (Terms) Fullscreen Popup */}
      {isTermsOpen && (
        <div className="fixed inset-0 z-[10000] bg-white flex flex-col animate-in fade-in duration-500 overflow-y-auto">
          {/* Header */}
          <div className="flex-shrink-0 w-full p-6 border-b border-outline/10 flex justify-between items-center bg-slate-50">
            <h2 className="text-xl font-extrabold text-slate-900 font-headline">서비스 이용약관</h2>
            <button 
              onClick={() => setIsTermsOpen(false)}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-200/80 hover:bg-slate-200 text-slate-700 transition-all animate-none"
            >
              <span className="material-symbols-outlined text-[24px]">close</span>
            </button>
          </div>
          {/* Content */}
          <div className="flex-1 bg-white p-8 md:p-16 max-w-4xl mx-auto w-full">
            <div className="prose prose-slate max-w-none space-y-6 text-left text-sm text-slate-700 leading-relaxed">
              <h3 className="text-2xl font-bold text-slate-900 mb-4">제 1 조 (목적)</h3>
              <p>
                본 약관은 World of Community(이하 &quot;회사&quot;)가 운영하는 플랫폼 및 모바일 애플리케이션(이하 &quot;서비스&quot;)을 이용함에 있어, 회사와 회원 간의 권리, 의무 및 책임 사항을 규정함을 목적으로 합니다.
              </p>
              
              <h3 className="text-2xl font-bold text-slate-900 mb-4">제 2 조 (의무 및 책임)</h3>
              <p>
                1. 회원은 관계 법령, 본 약관의 규정, 이용안내 및 서비스 상에 공지한 주의사항을 준수하여야 하며, 기타 회사의 업무에 방해되는 행위를 하여서는 안 됩니다.<br />
                2. 회원은 커뮤니티의 건전성과 타인의 개인정보를 존중해야 하며, 비속어 사용, 허위 정보 유포 또는 허가되지 않은 광고 행위 시 이용이 제한될 수 있습니다.
              </p>

              <h3 className="text-2xl font-bold text-slate-900 mb-4">제 3 조 (결제 및 환불 규정)</h3>
              <p>
                스튜디오 대관, 클래스 수강 신청 등 유료 서비스의 결제는 회사가 제공하는 안전 결제 시스템을 이용해야 하며, 예약 변경 및 환불은 각 스튜디오 및 주최측이 명시한 환불 정책 및 현행 소비자보호법에 의거하여 처리됩니다.
              </p>

              <h3 className="text-2xl font-bold text-slate-900 mb-4">제 4 조 (면책조항)</h3>
              <p>
                회사는 천재지변, 분산 서비스 거부 공격(DDoS), 호스팅 장애 등 불가항력으로 인해 서비스를 제공할 수 없는 경우에는 책임을 지지 않으며, 회원이 서비스를 이용하여 기대하는 이익이나 개인적 소셜 네트워킹 결과에 대해 보증하지 않습니다.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 개인정보처리방침 (Privacy) Fullscreen Popup */}
      {isPrivacyOpen && (
        <div className="fixed inset-0 z-[10000] bg-white flex flex-col animate-in fade-in duration-500 overflow-y-auto">
          {/* Header */}
          <div className="flex-shrink-0 w-full p-6 border-b border-outline/10 flex justify-between items-center bg-slate-50">
            <h2 className="text-xl font-extrabold text-slate-900 font-headline">개인정보처리방침</h2>
            <button 
              onClick={() => setIsPrivacyOpen(false)}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-200/80 hover:bg-slate-200 text-slate-700 transition-all animate-none"
            >
              <span className="material-symbols-outlined text-[24px]">close</span>
            </button>
          </div>
          {/* Content */}
          <div className="flex-1 bg-white p-8 md:p-16 max-w-4xl mx-auto w-full">
            <div className="prose prose-slate max-w-none space-y-6 text-left text-sm text-slate-700 leading-relaxed">
              <h3 className="text-2xl font-bold text-slate-900 mb-4">1. 수집하는 개인정보 항목</h3>
              <p>
                회사는 회원가입, 원활한 고객 상담, 유료 서비스 제공 등을 위해 아래와 같은 개인정보를 수집하고 있습니다:
              </p>
              <ul className="list-disc pl-6 space-y-1 text-left">
                <li>필수항목: 이메일 주소, 비밀번호, 닉네임, 프로필 사진 URL</li>
                <li>선택항목: 연령대, 선호 지역, 주 활동 파트(리더/팔로워)</li>
                <li>소셜 로그인 시: 제공업체(Google, Apple 등)로부터 전달받는 고유 식별값 및 프로필 명 정보</li>
              </ul>

              <h3 className="text-2xl font-bold text-slate-900 mb-4">2. 개인정보의 수집 및 이용 목적</h3>
              <p>
                회사는 수집한 개인정보를 다음의 목적을 위해 활용합니다:
              </p>
              <ul className="list-disc pl-6 space-y-1 text-left">
                <li>서비스 제공에 따른 본인 인증, 예약 및 결제 대행</li>
                <li>글로벌 탱고 커뮤니티 파트너 추천 및 매칭 서비스 고도화</li>
                <li>이벤트 알림 수신 동의자에 대한 맞춤 피드 전송</li>
              </ul>

              <h3 className="text-2xl font-bold text-slate-900 mb-4">3. 개인정보의 보유 및 파기</h3>
              <p>
                회원의 개인정보는 서비스 탈퇴 시 지체 없이 파기되는 것을 원칙으로 합니다. 단, 전자상거래법 등 관계법령의 규정에 의하여 보존할 필요가 있는 경우 해당 법령이 정한 기간 동안 보관 후 안전하게 영구 삭제됩니다.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
