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
    { bg: '#E91E63', text: '#ffffff' },
    { bg: '#FCE4EC', text: '#C2185B' },
    { bg: '#F8BBD0', text: '#880E4F' },
    { bg: '#F06292', text: '#ffffff' },
    { bg: '#D81B60', text: '#ffffff' }
  ];

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet"/>
      <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght@100..700,0..1&display=swap" rel="stylesheet"/>
      
      <style dangerouslySetInnerHTML={{ __html: `
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        
        .calendar-grid {
            display: grid;
            grid-template-columns: repeat(7, 1fr);
            border-left: 1px solid #E5E7EB;
            border-top: 1px solid #E5E7EB;
        }
        
        .calendar-cell {
            min-height: 100px;
            border-right: 1px solid #E5E7EB;
            border-bottom: 1px solid #E5E7EB;
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

      <div className="bg-[#F3F4F6] font-sans text-[#191b22] min-h-screen">
        <main className="pt-24 pb-24">
          {/* Hot 5 Section */}
          <section className="mb-8 px-4">
            <div className="flex justify-between items-end mb-4">
              <h2 className="font-bold text-2xl text-gray-900">Hot 5</h2>
              <span className="text-[12px] font-semibold text-[#0057bd] uppercase tracking-widest cursor-pointer">View All</span>
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
                      <h3 className="font-bold text-white text-lg">{event.title}</h3>
                      <p className="text-white/80 text-sm flex items-center gap-1.5 mt-1">
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
              <h2 className="font-bold text-2xl text-gray-900">Upcoming</h2>
              <div className="flex items-center gap-1 bg-white px-1 py-1 rounded-xl border border-gray-200 shadow-sm">
                <button onClick={() => setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))} className="p-1 hover:bg-gray-100 rounded-lg flex items-center justify-center transition-colors">
                  <span className="material-symbols-outlined text-gray-600 text-lg">chevron_left</span>
                </button>
                <span className="font-bold text-gray-800 text-sm px-2 cursor-pointer select-none" onClick={() => setCurrentDate(new Date())}>
                  {format(currentDate, 'MMM yyyy')}
                </span>
                <button onClick={() => setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))} className="p-1 hover:bg-gray-100 rounded-lg flex items-center justify-center transition-colors">
                  <span className="material-symbols-outlined text-gray-600 text-lg">chevron_right</span>
                </button>
              </div>
            </div>
            
            <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200">
              {/* Calendar Header Days */}
              <div className="grid grid-cols-7 bg-gray-50/50 border-b border-gray-200">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                  <div key={day} className="py-2 text-center text-[12px] font-semibold text-gray-500 uppercase">{day}</div>
                ))}
              </div>
              
              {/* Calendar Grid */}
              <div className="calendar-grid">
                {calendarRange.days.map((date, i) => {
                  const isCurrentMonth = date.getMonth() === currentDate.getMonth();
                  const isToday = isSameDay(date, new Date());
                  
                  // Filter events occurring on this specific day
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
                          
                          // Only render the bar if it's the start of the event or start of the week
                          const isStartOfBar = isSameDay(date, start) || getDay(date) === 1;
                          
                          if (isStartOfBar) {
                            // Calculate how many days this event spans within the current week (up to 7 - dayOfWeek)
                            const dayOfWeek = (getDay(date) + 6) % 7; // 0-6 (Mon-Sun)
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
                                style={{ 
                                  backgroundColor: colorSet.bg, 
                                  color: colorSet.text,
                                  width: `calc(${span * 100}% - 4px)`,
                                  top: `${slotIdx * 26}px`,
                                  left: '2px',
                                  zIndex: 10
                                }}
                              >
                                {event.location ? (
                                  (() => {
                                    const flagUrl = getFlagImageUrl(event.location.split(',').pop()?.trim() || '');
                                    return flagUrl ? <img src={flagUrl} alt="flag" className="inline-block mr-1 w-3.5 h-[10.5px] object-cover rounded-sm shadow-sm" /> : null;
                                  })()
                                ) : null}
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
          </section>
        </main>

        {/* Bottom Navigation */}
        <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-2 h-20 bg-white border-t border-gray-200 shadow-lg">
          <button className="flex flex-col items-center justify-center text-gray-500 px-4 py-1 active:opacity-70 transition-all duration-200">
            <span className="material-symbols-outlined mb-1">dashboard</span>
            <span className="font-semibold text-[10px]">Dashboard</span>
          </button>
          <button className="flex flex-col items-center justify-center bg-[#f2f3fc] text-[#0057bd] rounded-xl px-4 py-1 active:opacity-70 transition-all duration-200">
            <span className="material-symbols-outlined mb-1">calendar_today</span>
            <span className="font-semibold text-[10px]">Events</span>
          </button>
          <button className="flex flex-col items-center justify-center text-gray-500 px-4 py-1 active:opacity-70 transition-all duration-200">
            <span className="material-symbols-outlined mb-1">insights</span>
            <span className="font-semibold text-[10px]">Analytics</span>
          </button>
          <button className="flex flex-col items-center justify-center text-gray-500 px-4 py-1 active:opacity-70 transition-all duration-200">
            <span className="material-symbols-outlined mb-1">terminal</span>
            <span className="font-semibold text-[10px]">Logs</span>
          </button>
          <button className="flex flex-col items-center justify-center text-gray-500 px-4 py-1 active:opacity-70 transition-all duration-200">
            <span className="material-symbols-outlined mb-1">settings</span>
            <span className="font-semibold text-[10px]">Settings</span>
          </button>
        </nav>

        {/* Floating Add Button (Optional but useful) */}
        <button 
          onClick={() => setShowCreateModal(true)}
          className="fixed bottom-24 right-6 w-14 h-14 bg-[#0057bd] text-white rounded-full shadow-lg flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-50"
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
