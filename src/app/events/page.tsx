'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { eventService } from '@/lib/firebase/eventService';
import { Event } from '@/types/event';
import { isSameDay, startOfDay, addDays, getDay, startOfWeek, endOfWeek, eachDayOfInterval, differenceInCalendarDays, endOfDay, startOfMonth, endOfMonth, format } from 'date-fns';
import EditEvent from '@/components/events/EditEvent';
import EventViewer from '@/components/events/EventViewer';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from '@/components/providers/LocationProvider';
import { useNavigation } from '@/components/providers/NavigationProvider';
import { useLanguage } from '@/contexts/LanguageContext';
import { useModalNavigation } from '@/hooks/useModalNavigation';

// Helper to safely convert Firestore timestamp or other date formats and strip time
const getNormalizedDate = (val: any): Date => {
  if (!val) return startOfDay(new Date());
  let date: Date;
  if (typeof val.toDate === 'function') date = val.toDate();
  else if (val instanceof Date) date = val;
  else {
    try { date = new Date(val); } catch (e) { date = new Date(); }
  }
  return startOfDay(date);
};

// Helper to convert country names into flag images
const getFlagImageUrl = (countryName: string) => {
  if (!countryName) return null;
  const codeMapping: Record<string, string> = {
    'korea': 'kr', 'south korea': 'kr', 'korea, republic of': 'kr', '대한민국': 'kr', '한국': 'kr',
    'japan': 'jp', '일본': 'jp',
    'china': 'cn', '중국': 'cn',
    'taiwan': 'tw', '대만': 'tw',
    'hong kong': 'hk', '홍콩': 'hk',
    'united states': 'us', 'usa': 'us', 'us': 'us', '미국': 'us',
    'argentina': 'ar', '아르헨티나': 'ar',
    'singapore': 'sg', '싱가포르': 'sg',
    'uk': 'gb', 'united kingdom': 'gb', 'england': 'gb', '영국': 'gb',
    'france': 'fr', '프랑스': 'fr',
    'germany': 'de', '독일': 'de',
    'italy': 'it', '이탈리아': 'it',
    'spain': 'es', '스페인': 'es',
    'australia': 'au', '호주': 'au',
    'canada': 'ca', '캐나다': 'ca',
    'brazil': 'br', '브라질': 'br',
    'mexico': 'mx', '멕시코': 'mx',
    'vietnam': 'vn', '베트남': 'vn',
    'thailand': 'th', '태국': 'th',
    'indonesia': 'id', '인도네시아': 'id',
    'malaysia': 'my', '말레이시아': 'my',
    'philippines': 'ph', '필리핀': 'ph',
  };
  const code = codeMapping[countryName.toLowerCase().trim()];
  if (!code) return null;
  return `https://flagcdn.com/16x12/${code}.png`;
};

export default function EventsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toggleDrawer, setSubHeader } = useNavigation();
  const { location } = useLocation();
  const { user, profile, setShowLogin } = useAuth();
  const { t, language, formatDate } = useLanguage();
  const [events, setEvents] = useState<Event[]>([]);
  const [likedEventIds, setLikedEventIds] = useState<string[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { isOpen: isCreateOpenURL, openModal: openCreateURL, closeModal: closeCreateURL } = useModalNavigation('create');

  // URL 쿼리와 로컬 등록 모달 상태의 무결점 실시간 정밀 동기화
  useEffect(() => {
    setShowCreateModal(isCreateOpenURL);
  }, [isCreateOpenURL]);

  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // New Header Filter States
  const [activeTab, setActiveTab] = useState<'calendar' | 'upcoming' | 'favorite'>('calendar');
  const [isWorldEvent, setIsWorldEvent] = useState(true);

  // Society context: URL param → sessionStorage fallback
  const [societyId, setSocietyId] = useState('tango');
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlSociety = params.get('society');
      const storedSociety = sessionStorage.getItem('woc_society');
      const sId = urlSociety || storedSociety;

      if (sId) setSocietyId(sId);
    }
  }, []);

  // Real-time Subscription (society-aware)
  useEffect(() => {

    const unsub = eventService.subscribeEventsBySociety(societyId, (data) => {
      const validEvents = data.filter(e => e.startDate);

      setEvents(validEvents);
    });
    return () => unsub();
  }, [societyId]);

  // Check URL search params for specific event ID
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const eventId = urlParams.get('eventId');
      if (eventId && events.length > 0 && !selectedEvent) {
        const target = events.find(e => e.id === eventId);
        if (target) {
          setSelectedEvent(target);
          // Clean up the URL
          window.history.replaceState({}, '', '/events');
        }
      }
    }
  }, [events, selectedEvent]);

  useEffect(() => {
    if (!user) {
      setLikedEventIds([]);
      return;
    }
    return eventService.subscribeMyLikes(user.uid, setLikedEventIds);
  }, [user]);

  const handleToggleLike = async (e: React.MouseEvent, eventId: string) => {
    e.stopPropagation();
    if (!user) {
      setShowLogin(true);
      return;
    }
    try {
      await eventService.toggleLike(user.uid, eventId);
    } catch (err) {
      console.error(err);
    }
  };

  // Listen to global compose event
  useEffect(() => {
    const handleComposeOpen = (e: CustomEvent) => {
      if (e.detail?.id === 'events') {
        openCreateURL('true');
      }
    };
    window.addEventListener('woc:compose:open', handleComposeOpen as EventListener);

    // sessionStorage 플래그 체크 (통합 등록 메뉴에서 진입 시)
    const pending = sessionStorage.getItem('woc_compose_pending');
    if (pending === 'events') {
      sessionStorage.removeItem('woc_compose_pending');
      openCreateURL('true');
    }

    // 네이티브 URL 즉각 체크 가드 (Next.js 라우터 갱신 누락 방어)
    const checkNativeQuery = () => {
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        if (params.get('create') === 'true') {
          setShowCreateModal(true);
        } else {
          setShowCreateModal(false);
        }
      }
    };

    checkNativeQuery();
    window.addEventListener('popstate', checkNativeQuery);

    return () => {
      window.removeEventListener('woc:compose:open', handleComposeOpen as EventListener);
      window.removeEventListener('popstate', checkNativeQuery);
    };
  }, [openCreateURL]);

  // Handle browser back button for detail viewer modal
  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      if (e.state && e.state.wocModal) {
        return; // 중첩 모달 닫힘
      }
      if (selectedEvent) {
        setSelectedEvent(null);
      }
    };

    if (selectedEvent) {
      const currentState = window.history.state || {};
      window.history.pushState({ ...currentState, wocModal: true }, '');
      window.addEventListener('popstate', handlePopState);
    }

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [selectedEvent]);

  const handleCloseEvent = () => {
    setSelectedEvent(null);
    if (window.history.state?.wocModal) {
      window.history.back();
    }
  };

  const handleCloseCreate = () => {
    closeCreateURL();
  };

  // Filter events by location
  const filteredLocationEvents = useMemo(() => {
    if (isWorldEvent) return events;
    if (!location) return events;
    
    // Build some common aliases for matching using regex to avoid substring false positives (e.g., 'kr' in 'Frankfurt')
    const aliases: Record<string, RegExp[]> = {
      'korea': [/\bkr\b/i, /\bkorea\b/i, /대한민국/, /한국/],
      'japan': [/\bjp\b/i, /\bjapan\b/i, /일본/],
      'china': [/\bcn\b/i, /\bchina\b/i, /중국/],
      'taiwan': [/\btw\b/i, /\btaiwan\b/i, /대만/],
    };
    
    return events.filter(e => {
      const eventLoc = e.location || '';
      const locCountry = location.country.toLowerCase();
      
      let countryMatch = eventLoc.toLowerCase().includes(locCountry);
      if (!countryMatch && aliases[locCountry]) {
        countryMatch = aliases[locCountry].some(regex => regex.test(eventLoc));
      }
      
      if (location.city === 'ALL') return countryMatch;
      const cityMatch = eventLoc.toLowerCase().includes(location.city.toLowerCase());
      return countryMatch && cityMatch;
    });
  }, [events, location, isWorldEvent]);

  const sortedEvents = useMemo(() => {
    return [...filteredLocationEvents].sort((a, b) => 
      getNormalizedDate(a.startDate).getTime() - getNormalizedDate(b.startDate).getTime()
    );
  }, [filteredLocationEvents]);

  // Calendar Logic (Current Month)
  const calendarRange = useMemo(() => {
    const startOfCurrentMonth = startOfMonth(currentDate);
    const startOfView = startOfWeek(startOfCurrentMonth, { weekStartsOn: 1 }); // Mon
    const days = [];
    
    // Create 35 days (5 weeks) or 42 days (6 weeks) to cover the month
    for (let i = 0; i < 42; i++) {
        days.push(addDays(startOfView, i));
    }
    
    return { days };
  }, [currentDate]);

  // Stack logic for calendar bars
  const eventSlots = useMemo(() => {
    const slotsMap: { [eventId: string]: number } = {};
    const occupiedUntil: { [slot: number]: Date } = {};

    [...filteredLocationEvents].sort((a, b) => 
      getNormalizedDate(a.startDate).getTime() - getNormalizedDate(b.startDate).getTime()
    ).forEach(event => {
      const start = getNormalizedDate(event.startDate);
      const end = getNormalizedDate(event.endDate || event.startDate);
      
      let slot = 0;
      while (occupiedUntil[slot] && occupiedUntil[slot] >= start) {
        slot++;
      }
      slotsMap[event.id] = slot;
      occupiedUntil[slot] = end;
    });

    return slotsMap;
  }, [filteredLocationEvents]);

  const formattedMonth = formatDate(currentDate, 'monthYear');

  // SubHeader Injection
  useEffect(() => {
    const filterBar = (
      <div className="relative w-full bg-white flex flex-col shadow-[0_20px_40px_-15px_rgba(0,0,0,0.15)] z-30">
        {/* Row 1: Scrollable Tabs */}
        <div className="w-full px-3 py-2 flex items-center gap-2 overflow-x-auto no-scrollbar">
          {[
            { id: 'calendar', label: t('event.tab_calendar') },
            { id: 'upcoming', label: t('event.tab_upcoming') },
            { id: 'favorite', label: t('event.tab_favorites') }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-shrink-0 px-2.5 py-1 rounded-xl text-[12px] font-bold tracking-tight transition-all whitespace-nowrap border ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-100'
                  : 'bg-slate-50/50 text-slate-500 border-slate-100 hover:bg-slate-100/80'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        
        {/* Row 2: Month Filter and/or World Event Toggle */}
        {(activeTab === 'calendar' || activeTab === 'upcoming') && (
          <div className={`w-full h-11 px-4 flex items-center ${activeTab === 'calendar' ? 'justify-between' : 'justify-end'}`}>
            {activeTab === 'calendar' && (
              <div className="flex items-center gap-2 bg-slate-50 rounded-lg px-1.5 py-0.5 border border-slate-100">
                <button 
                  onClick={() => setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))} 
                  className="w-6 h-6 flex items-center justify-center hover:bg-white rounded-md transition-all text-slate-400"
                >
                  <span className="material-symbols-outlined text-[16px]">chevron_left</span>
                </button>
                <span className="text-[13px] font-bold text-slate-900 uppercase tracking-tight w-[80px] text-center">
                  {formattedMonth}
                </span>
                <button 
                  onClick={() => setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))} 
                  className="w-6 h-6 flex items-center justify-center hover:bg-white rounded-md transition-all text-slate-400"
                >
                  <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                </button>
              </div>
            )}
            <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200/50">
              <button
                onClick={() => setIsWorldEvent(false)}
                className={`px-3 py-1 rounded-md text-[11px] font-bold uppercase tracking-widest transition-all duration-200 ${
                  !isWorldEvent
                    ? 'bg-white text-blue-600 shadow-sm border border-slate-200/80'
                    : 'text-slate-400 hover:text-slate-500'
                }`}
              >
                Local
              </button>
              <button
                onClick={() => setIsWorldEvent(true)}
                className={`px-3 py-1 rounded-md text-[11px] font-bold uppercase tracking-widest transition-all duration-200 ${
                  isWorldEvent
                    ? 'bg-white text-blue-600 shadow-sm border border-slate-200/80'
                    : 'text-slate-400 hover:text-slate-500'
                }`}
              >
                World
              </button>
            </div>
          </div>
        )}
      </div>
    );
    
    const height = (activeTab === 'calendar' || activeTab === 'upcoming') ? 88 : 44; // Tabs + Filter (44+44) vs Tabs (44)
    setSubHeader(filterBar, height);
    return () => setSubHeader(null);
  }, [activeTab, currentDate, formattedMonth, isWorldEvent, t, setSubHeader]);

  const STACK_COLORS = [
    { bg: '#0057bd', text: '#ffffff' },   // primary
    { bg: '#3d56ba', text: '#ffffff' },   // secondary
    { bg: '#6e9fff', text: '#002150' },   // primary-container
    { bg: '#8097ff', text: '#03288f' },   // secondary-container
    { bg: '#883b91', text: '#ffffff' },   // tertiary
  ];

  // Prepare monthly grouped upcoming events
  const upcomingEvents = useMemo(() => {
    const today = startOfDay(new Date());
    const validEvents = sortedEvents.filter(e => getNormalizedDate(e.endDate || e.startDate) >= today);
    
    const grouped: Record<string, Event[]> = {};
    validEvents.forEach(e => {
      const startDate = getNormalizedDate(e.startDate);
      const monthKey = formatDate(startDate, 'monthYear');
      if (!grouped[monthKey]) grouped[monthKey] = [];
      grouped[monthKey].push(e);
    });

    return Object.entries(grouped).map(([month, evts]) => ({
      month,
      events: evts
    }));
  }, [sortedEvents]);

  // Featured Banner Event (First upcoming)
  const featuredEvent = useMemo(() => {
    const today = startOfDay(new Date());
    return sortedEvents.find(e => getNormalizedDate(e.endDate || e.startDate) >= today);
  }, [sortedEvents]);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        
        .calendar-grid {
            display: grid;
            grid-template-columns: repeat(7, 1fr);
            border-left: 1px solid var(--color-outline-variant, #a3abd7);
            border-top: 1px solid var(--color-outline-variant, #a3abd7);
        }
        
        .calendar-cell {
            min-height: 100px;
            border-right: 1px solid var(--color-outline-variant, #a3abd7);
            border-bottom: 1px solid var(--color-outline-variant, #a3abd7);
            padding: 4px;
            position: relative;
            display: flex;
            flex-direction: column;
            gap: 2px;
        }

        .event-container {
            position: absolute;
            top: 24px;
            left: 0;
            right: 0;
            pointer-events: none;
            z-index: 10;
        }

        .event-bar {
            height: 24px;
            font-size: 12px;
            font-weight: 800;
            padding: 0 6px;
            display: flex;
            align-items: center;
            border-radius: 4px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            pointer-events: auto;
            position: absolute;
            cursor: pointer;
            box-shadow: 0 1px 2px rgba(0,0,0,0.1);
        }
      `}} />

      <div className="w-full relative bg-slate-50/30 min-h-screen">
        <main className="pb-32 overflow-x-hidden">
          
          {/* UPCOMING TAB: FEATURED BANNER */}
          {activeTab === 'upcoming' && featuredEvent && (
            <div
              onClick={() => setSelectedEvent(featuredEvent)}
              className="relative w-full h-64 rounded-none overflow-hidden shadow-sm group block cursor-pointer mb-6 animate-in fade-in slide-in-from-top-4 duration-500"
            >
              <img
                alt={featuredEvent.title}
                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                src={featuredEvent.imageUrl || 'https://lh3.googleusercontent.com/aida-public/AB6AXuAM-qcbRNMJdZLS9Ca7Gp1EjVkOyWQhtKBiYOVV8jYdBKKdmtYDvyKh8uAbGKuFuWSqYG_cwZyguPHzTslh1whMR66-pyycVhSWNYgJjvbFatGIX03BxE1lE-1iBMQjH7_2F8g6-LvoJIcnlB0MGrlKJYOVJZFWQyKma420t8TJpTbYWVZog86VoGm2oqMpqqloZzF_17DT9iJk6dbzfGibveQrX7XmbdfyWCQaGlMZuD8TON4K8v5PG8jgMr8kEfGxpq99xneK9p4'}
              />
              <div className="absolute inset-0 flex flex-col justify-end p-6"
                style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.3) 50%, transparent 100%)' }}>
                <p className="text-white mb-1 tracking-tight"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '1.25rem', lineHeight: '1.75rem', fontWeight: 800, textShadow: '0 2px 10px rgba(0,0,0,0.9), 0 0 4px rgba(0,0,0,0.5)' }}>
                  {language === 'KR' && featuredEvent.titleNative ? featuredEvent.titleNative : featuredEvent.title}
                  {featuredEvent.titleNative && language !== 'KR' && (
                    <span className="ml-2 font-normal" style={{ fontSize: '0.875rem', opacity: 0.85 }}>{featuredEvent.titleNative}</span>
                  )}
                </p>
                <div className="flex flex-col gap-1 mb-4">
                  <p className="text-white/90 uppercase flex items-center gap-1.5"
                    style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.75rem', lineHeight: '1.25rem', fontWeight: 600, letterSpacing: '0.05em' }}>
                    <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'opsz' 20" }}>calendar_today</span>
                    {language === 'KR'
                      ? `${getNormalizedDate(featuredEvent.startDate).getFullYear()}년 ${getNormalizedDate(featuredEvent.startDate).getMonth() + 1}월 ${getNormalizedDate(featuredEvent.startDate).getDate()}일`
                      : format(getNormalizedDate(featuredEvent.startDate), 'MMM dd, yyyy')}
                  </p>
                  <p className="text-white/90 flex items-center gap-1.5"
                    style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.75rem', lineHeight: '1.25rem', fontWeight: 600 }}>
                    <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'opsz' 20" }}>location_on</span>
                    {featuredEvent.location}
                  </p>
                </div>
                <div>
                  <span className="inline-block px-5 py-2 bg-white font-bold text-xs rounded-xl shadow-md transition-all duration-300"
                    style={{ color: '#004190' }}>
                    {t('event.view_details')}
                  </span>
                </div>
              </div>
              <div className="absolute inset-0 pointer-events-none opacity-10 mix-blend-overlay"
                style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/canvas-orange.png')" }} />
            </div>
          )}

          {/* TAB CONTENTS */}
          <div className="px-4 space-y-6 pt-4">

            {/* CALENDAR TAB */}
            {activeTab === 'calendar' && (
              <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-surface-container-lowest rounded-xl overflow-hidden shadow-sm border border-outline-variant">
                  <div className="grid grid-cols-7 bg-surface-container-low border-b border-outline-variant">
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                      <div key={day} className="py-2 text-center text-[12px] font-semibold text-on-surface-variant uppercase">{day}</div>
                    ))}
                  </div>
                  <div className="calendar-grid">
                    {calendarRange.days.map((date, i) => {
                      const isCurrentMonth = date.getMonth() === currentDate.getMonth();
                      const isToday = isSameDay(date, new Date());
                      const dayEvents = filteredLocationEvents.filter(e => {
                        const start = getNormalizedDate(e.startDate);
                        const end = getNormalizedDate(e.endDate || e.startDate);
                        return date >= start && date <= end;
                      });
                      const dayMaxSlot = dayEvents.reduce((max, e) => Math.max(max, eventSlots[e.id] ?? 0), -1);
                      const cellMinHeight = Math.max(100, 28 + (dayMaxSlot + 1) * 26 + 8);
                      return (
                        <div key={i} className={`calendar-cell ${!isCurrentMonth ? 'bg-gray-50/30' : ''}`} style={{ minHeight: `${cellMinHeight}px` }}>
                          <span className={`text-[10px] font-bold ${isToday ? 'text-[#0057bd] w-5 h-5 bg-[#d3e4fe] rounded-full flex items-center justify-center' : 'text-gray-400'}`}>
                            {date.getDate()}
                          </span>
                          <div className="event-container">
                            {dayEvents.map(event => {
                              const start = getNormalizedDate(event.startDate);
                              const end = getNormalizedDate(event.endDate || event.startDate);
                              const isStartOfBar = isSameDay(date, start) || getDay(date) === 1;
                              if (isStartOfBar) {
                                const dayOfWeek = (getDay(date) + 6) % 7;
                                const remainingInWeek = 7 - dayOfWeek;
                                const totalDuration = differenceInCalendarDays(end, date) + 1;
                                const span = Math.min(totalDuration, remainingInWeek);
                                const slotIdx = eventSlots[event.id] ?? 0;
                                const colorSet = STACK_COLORS[slotIdx % STACK_COLORS.length];
                                return (
                                  <div
                                    key={event.id}
                                    onClick={() => setSelectedEvent(event)}
                                    className="event-bar"
                                    style={{ backgroundColor: colorSet.bg, color: colorSet.text, width: `calc(${span * 100}% - 4px)`, top: `${slotIdx * 26}px`, left: '2px', zIndex: 10 }}
                                  >
                                    {event.location ? (() => { const flagUrl = getFlagImageUrl(event.location.split(',').pop()?.trim() || ''); return flagUrl ? <img src={flagUrl} alt="flag" className="inline-block mr-1 w-3.5 h-[10.5px] object-cover rounded-sm shadow-sm" /> : null; })() : null}
                                    <span className="truncate">{language === 'KR' && event.titleNative ? event.titleNative : event.title}</span>
                                  </div>
                                );
                              }
                              return null;
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>


              </section>
            )}

            {/* UPCOMING TAB */}
            {activeTab === 'upcoming' && (
              <section className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {upcomingEvents.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-on-surface-variant">
                    <span className="material-symbols-outlined text-4xl mb-2 opacity-30">event_busy</span>
                    <p className="text-sm font-medium">{t('event.no_upcoming')}</p>
                  </div>
                ) : (
                  upcomingEvents.map(({ month, events: monthEvents }) => (
                    <div key={month} className="space-y-3">
                      <div className="flex items-center gap-3 px-1 mb-2">
                        <div className="w-1 h-3 bg-blue-500 rounded-full" />
                        <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">
                          {month}
                        </span>
                        <div className="flex-1 h-[1px] bg-slate-100" />
                      </div>
                      
                      <div className="flex flex-col gap-3">
                        {monthEvents.map(event => {
                          const start = getNormalizedDate(event.startDate);
                          const end = event.endDate ? getNormalizedDate(event.endDate) : null;
                          const flagUrl = getFlagImageUrl(event.location?.split(',').pop()?.trim() || '');
                          const dateStr = end && !isSameDay(start, end)
                            ? `${formatDate(start, 'shortMonthDay')} – ${formatDate(end, 'shortMonthDay')}`
                            : language === 'KR'
                              ? formatDate(start, 'shortMonthDay')
                              : formatDate(start, 'MMM d, EEE');
                            
                          return (
                            <div
                              key={event.id}
                              onClick={() => setSelectedEvent(event)}
                              className="group relative flex gap-3 bg-white border border-slate-100 rounded-2xl p-3 shadow-sm cursor-pointer hover:border-blue-200 hover:shadow-md transition-all active:scale-[0.98]"
                            >
                              <div className="w-20 h-20 rounded-xl overflow-hidden flex-none bg-slate-50 border border-slate-50 relative">
                                {event.imageUrl
                                  ? <img src={event.imageUrl} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                  : <div className="w-full h-full flex items-center justify-center"><span className="material-symbols-outlined text-slate-300 text-2xl">event</span></div>
                                }
                              </div>
                              <div className="flex flex-col justify-center min-w-0 flex-1 py-0.5">
                                <span className="text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-100 w-fit px-1.5 py-0.5 rounded uppercase tracking-wider mb-1.5">{dateStr}</span>
                                <h3 className="font-bold text-slate-900 text-[14px] leading-snug truncate">{language === 'KR' && event.titleNative ? event.titleNative : event.title}</h3>
                                {event.titleNative && language !== 'KR' && <p className="text-[11px] text-slate-400 truncate mt-0.5">{event.titleNative}</p>}
                                <div className="flex items-center gap-2 mt-1.5 text-[11px] font-medium text-slate-500">
                                  {event.location && (
                                    <span className="flex items-center gap-1">
                                      {flagUrl && <img src={flagUrl} alt="flag" className="w-3 h-2 object-cover rounded-[1px] shadow-sm" />}
                                      <span className="truncate max-w-[80px]">{event.location.split(',')[0]}</span>
                                    </span>
                                  )}
                                  {event.location && event.hostName && <span className="text-slate-300">•</span>}
                                  {event.hostName && <span className="truncate max-w-[80px] text-slate-600 font-semibold">{event.hostName}</span>}
                                </div>
                              </div>
                              <button 
                                onClick={(e) => handleToggleLike(e, event.id)}
                                className={`absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center transition-colors active:scale-90 ${
                                  likedEventIds.includes(event.id) ? 'bg-red-50 text-red-500' : 'bg-slate-50 text-slate-300 hover:text-red-400'
                                }`}
                              >
                                <span className="material-symbols-rounded text-[16px]" style={{ fontVariationSettings: likedEventIds.includes(event.id) ? "'FILL' 1" : "'FILL' 0" }}>favorite</span>
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))
                )}
              </section>
            )}

            {/* FAVORITES TAB */}
            {activeTab === 'favorite' && (
              <section className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {(() => {
                  const likedEvents = sortedEvents.filter(e => likedEventIds.includes(e.id));
                  if (likedEvents.length === 0) {
                    return (
                      <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
                          <span className="material-symbols-outlined text-3xl text-red-300">favorite</span>
                        </div>
                        <h3 className="text-base font-bold text-slate-800 mb-1">{t('event.no_saved')}</h3>
                        <p className="text-xs text-slate-400 max-w-[200px] leading-relaxed">{t('event.no_saved_desc')}</p>
                      </div>
                    );
                  }
                  
                  return (
                    <div className="flex flex-col gap-3">
                      {likedEvents.map(event => {
                        const start = getNormalizedDate(event.startDate);
                        const end = event.endDate ? getNormalizedDate(event.endDate) : null;
                        const flagUrl = getFlagImageUrl(event.location?.split(',').pop()?.trim() || '');
                        const dateStr = end && !isSameDay(start, end)
                          ? `${formatDate(start, 'shortMonthDay')} – ${formatDate(end, 'shortMonthDay')}`
                          : language === 'KR'
                            ? formatDate(start, 'shortMonthDay')
                            : formatDate(start, 'MMM d, EEE');
                          
                        return (
                          <div
                            key={event.id}
                            onClick={() => setSelectedEvent(event)}
                            className="group relative flex gap-3 bg-white border border-slate-100 rounded-2xl p-3 shadow-sm cursor-pointer hover:border-blue-200 hover:shadow-md transition-all active:scale-[0.98]"
                          >
                            <div className="w-20 h-20 rounded-xl overflow-hidden flex-none bg-slate-50 border border-slate-50 relative">
                              {event.imageUrl
                                ? <img src={event.imageUrl} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                : <div className="w-full h-full flex items-center justify-center"><span className="material-symbols-outlined text-slate-300 text-2xl">event</span></div>
                              }
                            </div>
                            <div className="flex flex-col justify-center min-w-0 flex-1 py-0.5">
                              <span className="text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-100 w-fit px-1.5 py-0.5 rounded uppercase tracking-wider mb-1.5">{dateStr}</span>
                              <h3 className="font-bold text-slate-900 text-[14px] leading-snug truncate">{language === 'KR' && event.titleNative ? event.titleNative : event.title}</h3>
                              {event.titleNative && language !== 'KR' && <p className="text-[11px] text-slate-400 truncate mt-0.5">{event.titleNative}</p>}
                              <div className="flex items-center gap-2 mt-1.5 text-[11px] font-medium text-slate-500">
                                {event.location && (
                                  <span className="flex items-center gap-1">
                                    {flagUrl && <img src={flagUrl} alt="flag" className="w-3 h-2 object-cover rounded-[1px] shadow-sm" />}
                                    <span className="truncate max-w-[80px]">{event.location.split(',')[0]}</span>
                                  </span>
                                )}
                                {event.location && event.hostName && <span className="text-slate-300">•</span>}
                                {event.hostName && <span className="truncate max-w-[80px] text-slate-600 font-semibold">{event.hostName}</span>}
                              </div>
                            </div>
                            <button 
                              onClick={(e) => handleToggleLike(e, event.id)}
                              className="absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center transition-colors active:scale-90 bg-red-50 text-red-500"
                            >
                              <span className="material-symbols-rounded text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </section>
            )}
          </div>
        </main>

        <AnimatePresence>
          {showCreateModal && (
            <EditEvent
              onClose={handleCloseCreate}
              onSuccess={(id) => {
                router.push(`/create-success?type=event&id=${id || ''}`);
              }}
            />
          )}
          {selectedEvent && (
            <EventViewer 
              event={selectedEvent} 
              onClose={handleCloseEvent}
            />
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
