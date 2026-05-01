'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { eventService } from '@/lib/firebase/eventService';
import { Event } from '@/types/event';
import { format, isSameDay, startOfDay, addDays, getDay, startOfWeek, endOfWeek, eachDayOfInterval, differenceInCalendarDays, endOfDay, startOfMonth, endOfMonth } from 'date-fns';
import CreateEvent from '@/components/events/CreateEvent';
import EventDetail from '@/components/events/EventDetail';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from '@/components/providers/LocationProvider';
import { useNavigation } from '@/components/providers/NavigationProvider';

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
  const { toggleDrawer } = useNavigation();
  const { location } = useLocation();
  const { profile } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');

  // Real-time Subscription
  useEffect(() => {
    const unsub = eventService.subscribeEvents((data) => {
      const validEvents = data.filter(e => e.startDate);
      setEvents(validEvents);
    });
    return () => unsub();
  }, []);

  // Handle browser back button for modals
  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      if (selectedEvent) {
        setSelectedEvent(null);
      } else if (showCreateModal) {
        setShowCreateModal(false);
      }
    };

    if (selectedEvent || showCreateModal) {
      window.history.pushState({ modal: true }, '');
      window.addEventListener('popstate', handlePopState);
    }

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [selectedEvent, showCreateModal]);

  const handleCloseEvent = () => {
    setSelectedEvent(null);
    if (window.history.state?.modal) {
      window.history.back();
    }
  };

  const handleCloseCreate = () => {
    setShowCreateModal(false);
    if (window.history.state?.modal) {
      window.history.back();
    }
  };

  // Filter events by location
  const filteredLocationEvents = useMemo(() => {
    if (!location) return events;
    return events.filter(e => {
      const eventLoc = e.location?.toLowerCase() || '';
      const countryMatch = eventLoc.includes(location.country.toLowerCase());
      if (location.city === 'ALL') return countryMatch;
      const cityMatch = eventLoc.includes(location.city.toLowerCase());
      return countryMatch && cityMatch;
    });
  }, [events, location]);

  const sortedEvents = useMemo(() => {
    return [...filteredLocationEvents].sort((a, b) => 
      getNormalizedDate(a.startDate).getTime() - getNormalizedDate(b.startDate).getTime()
    );
  }, [filteredLocationEvents]);

  // Hot 5 Section (Current/Upcoming)
  const hot5Events = useMemo(() => {
    const today = startOfDay(new Date());
    return sortedEvents
      .filter(e => getNormalizedDate(e.endDate || e.startDate) >= today)
      .slice(0, 5);
  }, [sortedEvents]);

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

    [...events].sort((a, b) => 
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
  }, [events]);

  const STACK_COLORS = [
    { bg: '#0057bd', text: '#ffffff' },   // primary
    { bg: '#3d56ba', text: '#ffffff' },   // secondary
    { bg: '#6e9fff', text: '#002150' },   // primary-container
    { bg: '#8097ff', text: '#03288f' },   // secondary-container
    { bg: '#883b91', text: '#ffffff' },   // tertiary
  ];

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

      <div className="w-full relative">
        <main className="pt-4 pb-24">
          {/* Top 5 Section */}
          <section className="mb-8 px-4">
            <div className="flex items-end justify-between mb-4">
              <div>
                <h2 className="text-2xl font-extrabold font-headline tracking-tight text-on-background">Top 5</h2>
                <p className="text-on-surface-variant text-sm font-medium">Meet more popular events</p>
              </div>
              <span className="text-primary font-bold text-sm flex items-center gap-1 cursor-pointer">View all <span className="material-symbols-outlined text-sm">arrow_forward</span></span>
            </div>
            <div className="flex gap-4 overflow-x-auto no-scrollbar snap-x snap-mandatory">
              {hot5Events.length === 0 ? (
                <div className="w-full h-40 bg-white rounded-xl flex items-center justify-center border border-dashed border-gray-300">
                  <p className="text-gray-400">No events currently featured</p>
                </div>
              ) : (
                hot5Events.map((event, idx) => (
                  <div key={event.id} onClick={() => setSelectedEvent(event)} className="flex-shrink-0 w-[85%] snap-center rounded-xl overflow-hidden relative aspect-[4/3] shadow-sm cursor-pointer hover:opacity-95 transition-opacity">
                    <img 
                      alt={event.title} 
                      className="w-full h-full object-cover" 
                      src={event.imageUrl || "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&q=80&w=1000"} 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-4">
                      <span className="bg-[#0057bd] text-white w-fit px-2 py-0.5 rounded text-[10px] font-bold mb-2 tracking-wider uppercase">
                        {idx === 0 ? 'FEATURED' : idx < 3 ? 'POPULAR' : 'LIMITED'}
                      </span>
                      <h3 className="font-bold text-white text-lg leading-tight">{event.title}</h3>
                      {event.titleNative && (
                        <p className="text-white/90 text-[13px] font-medium leading-tight mt-0.5">{event.titleNative}</p>
                      )}
                      <p className="text-white/80 text-sm flex items-center gap-1.5 mt-1.5">
                        {(() => {
                          const flagUrl = getFlagImageUrl(event.location?.split(',').pop()?.trim() || '');
                          return flagUrl ? <img src={flagUrl} alt="flag" className="inline-block w-4 h-3 object-cover rounded-sm shadow-sm" /> : null;
                        })()}
                        {event.location?.split(',')[0]} • {format(getNormalizedDate(event.startDate), 'MMM dd')}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Upcoming (Calendar) Section */}
          <section className="px-4">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-2xl font-extrabold font-headline tracking-tight text-on-background">Upcoming</h2>
              </div>
            </div>

            {/* 헤더: < Apr 2026 >  |  📅 ☰ */}
            <div className="flex items-center justify-between mb-4">
              {/* 월 네비게이터 */}
              <div className="flex items-center gap-1 bg-surface-container-lowest px-1 py-1 rounded-xl border border-outline-variant shadow-sm">
                <button onClick={() => setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))} className="p-1 hover:bg-surface-container rounded-lg flex items-center justify-center transition-colors">
                  <span className="material-symbols-outlined text-on-surface-variant text-lg">chevron_left</span>
                </button>
                <span className="font-bold text-on-surface text-sm px-2 cursor-pointer select-none" onClick={() => setCurrentDate(new Date())}>
                  {format(currentDate, 'MMM, yyyy')}
                </span>
                <button onClick={() => setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))} className="p-1 hover:bg-surface-container rounded-lg flex items-center justify-center transition-colors">
                  <span className="material-symbols-outlined text-on-surface-variant text-lg">chevron_right</span>
                </button>
              </div>

              {/* 뷰 토글 */}
              <div className="flex items-center gap-1 bg-surface-container-lowest border border-outline-variant rounded-xl p-1 shadow-sm">
                <button
                  onClick={() => setViewMode('calendar')}
                  className={`p-1.5 rounded-lg transition-all ${ viewMode === 'calendar' ? 'bg-primary text-white shadow-sm' : 'text-on-surface-variant hover:bg-surface-container' }`}
                >
                  <span className="material-symbols-outlined text-[18px] leading-none" style={{ fontVariationSettings: "'FILL' 1" }}>calendar_month</span>
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded-lg transition-all ${ viewMode === 'list' ? 'bg-primary text-white shadow-sm' : 'text-on-surface-variant hover:bg-surface-container' }`}
                >
                  <span className="material-symbols-outlined text-[18px] leading-none" style={{ fontVariationSettings: "'FILL' 1" }}>view_list</span>
                </button>
              </div>
            </div>
            
            {/* 달력 뷰 */}
            {viewMode === 'calendar' && (
            <div className="bg-surface-container-lowest rounded-xl overflow-hidden shadow-sm border border-outline-variant">
              {/* Calendar Header Days */}
              <div className="grid grid-cols-7 bg-surface-container-low border-b border-outline-variant">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                  <div key={day} className="py-2 text-center text-[12px] font-semibold text-on-surface-variant uppercase">{day}</div>
                ))}
              </div>
              <div className="calendar-grid">
                {calendarRange.days.map((date, i) => {
                  const isCurrentMonth = date.getMonth() === currentDate.getMonth();
                  const isToday = isSameDay(date, new Date());
                  const dayEvents = events.filter(e => {
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
                                <span className="truncate">{event.title}</span>
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
            )}

            {/* 리스트 뷰 - 해당 월 이벤트만 */}
            {viewMode === 'list' && (() => {
              const monthStart = startOfMonth(currentDate);
              const monthEnd = endOfMonth(currentDate);
              const monthEvents = sortedEvents.filter(e => {
                const start = getNormalizedDate(e.startDate);
                const end = getNormalizedDate(e.endDate || e.startDate);
                return start <= monthEnd && end >= monthStart;
              });
              return monthEvents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-on-surface-variant">
                  <span className="material-symbols-outlined text-4xl mb-2 opacity-30">event_busy</span>
                  <p className="text-sm font-medium">No events this month</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {monthEvents.map(event => {
                    const start = getNormalizedDate(event.startDate);
                    const end = event.endDate ? getNormalizedDate(event.endDate) : null;
                    const flagUrl = getFlagImageUrl(event.location?.split(',').pop()?.trim() || '');
                    const dateStr = end && !isSameDay(start, end)
                      ? `${format(start, 'MMM d')} – ${format(end, 'MMM d')}`
                      : format(start, 'MMM d, EEE');
                    return (
                      <div
                        key={event.id}
                        onClick={() => setSelectedEvent(event)}
                        className="flex gap-3 bg-surface-container-lowest border border-outline-variant rounded-xl p-3 shadow-sm cursor-pointer hover:border-primary/40 active:scale-[0.98] transition-all"
                      >
                        {/* 썸네일 */}
                        <div className="w-16 h-16 rounded-lg overflow-hidden flex-none bg-surface-container">
                          {event.imageUrl
                            ? <img src={event.imageUrl} alt={event.title} className="w-full h-full object-cover" />
                            : <div className="w-full h-full flex items-center justify-center"><span className="material-symbols-outlined text-on-surface-variant text-2xl">event</span></div>
                          }
                        </div>
                        {/* 정보 */}
                        <div className="flex flex-col justify-center min-w-0">
                          <span className="text-[10px] font-bold text-primary bg-primary/10 w-fit px-1.5 py-0.5 rounded mb-1 uppercase">{dateStr}</span>
                          <h3 className="font-bold text-on-background text-sm leading-snug truncate">{event.title}</h3>
                          {event.titleNative && <p className="text-[11px] text-on-surface-variant truncate">{event.titleNative}</p>}
                          {event.location && (
                            <p className="text-[11px] text-on-surface-variant flex items-center gap-1 mt-0.5">
                              {flagUrl && <img src={flagUrl} alt="flag" className="w-3.5 h-[10.5px] object-cover rounded-sm" />}
                              {event.location.split(',')[0]}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </section>
        </main>


        {/* Floating Add Button */}
        <button 
          onClick={() => setShowCreateModal(true)}
          className="fixed bottom-28 right-6 w-14 h-14 bg-[#0057bd] text-white rounded-full shadow-lg flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-50"
        >
          <span className="material-symbols-outlined text-3xl">add</span>
        </button>

        <AnimatePresence>
          {showCreateModal && (
            <CreateEvent onClose={handleCloseCreate} onSuccess={() => {}} />
          )}
          {selectedEvent && (
            <EventDetail 
              event={selectedEvent} 
              onClose={handleCloseEvent}
              onDelete={(id) => {
                setEvents(prev => prev.filter(e => e.id !== id));
                handleCloseEvent();
              }}
              onEdit={(evt) => {
                alert("Edit functionality coming soon!");
              }}
            />
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
