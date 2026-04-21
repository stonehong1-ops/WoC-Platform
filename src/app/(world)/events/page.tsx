'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { eventService } from '@/lib/firebase/eventService';
import { Event } from '@/types/event';
import { format, isSameDay, startOfDay, addDays, getDay, startOfWeek, endOfWeek, eachDayOfInterval, differenceInCalendarDays, endOfDay, isWithinInterval, startOfMonth, endOfMonth } from 'date-fns';
import CreateEvent from '@/components/events/CreateEvent';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from '@/components/providers/LocationProvider';

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

export default function EventsPage() {
  const { location } = useLocation();
  const [events, setEvents] = useState<Event[]>([]);
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());

  // Real-time Subscription
  useEffect(() => {
    const unsub = eventService.subscribeEvents((data) => {
      const validEvents = data.filter(e => e.startDate);
      setEvents(validEvents);
    });
    return () => unsub();
  }, []);

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

  // Upcoming Events Highlights (Next 5 events starting from today)
  const upcomingHighlightEvents = useMemo(() => {
    const today = startOfDay(new Date());
    return sortedEvents
      .filter(e => {
        const end = getNormalizedDate(e.endDate || e.startDate);
        return end >= today;
      })
      .slice(0, 5);
  }, [sortedEvents]);

  // Calendar Logic (5 weeks)
  const calendarRange = useMemo(() => {
    const startOfCurrentMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const startOfView = startOfWeek(startOfCurrentMonth, { weekStartsOn: 1 }); 
    const endOfView = addDays(startOfView, 34); // 5 weeks total
    
    const weeks = [];
    for (let i = 0; i < 5; i++) {
        const weekStart = startOfDay(addDays(startOfView, i * 7));
        const weekEnd = endOfDay(addDays(weekStart, 6));
        weeks.push({
            start: weekStart,
            end: weekEnd,
            days: eachDayOfInterval({ start: weekStart, end: weekEnd })
        });
    }
    return { weeks, start: startOfView, end: endOfView };
  }, [currentDate]);

  // GLOBAL Stacking Logic: Prevent vertical jumping across weeks
  const eventSlots = useMemo(() => {
    const slotsMap: { [eventId: string]: number } = {};
    const occupiedUntil: { [slot: number]: Date } = {};

    // Use all events for stacking calculation to match calendar rendering
    [...events].sort((a, b) => 
      getNormalizedDate(a.startDate).getTime() - getNormalizedDate(b.startDate).getTime()
    ).forEach(event => {
      const start = getNormalizedDate(event.startDate);
      const end = getNormalizedDate(event.endDate || event.startDate);
      
      let slot = 0;
      // If a slot is occupied until or after the current event starts, move to next slot
      while (occupiedUntil[slot] && occupiedUntil[slot] >= start) {
        slot++;
      }
      slotsMap[event.id] = slot;
      occupiedUntil[slot] = end;
    });

    return slotsMap;
  }, [events]);

  const STACK_COLORS = [
    { bg: 'rgba(0, 68, 147, 0.08)', border: 'rgba(0, 68, 147, 0.15)', text: '#004493', dot: '#004493' },
    { bg: 'rgba(124, 46, 0, 0.08)', border: 'rgba(124, 46, 0, 0.15)', text: '#7c2e00', dot: '#7c2e00' },
    { bg: 'rgba(123, 31, 162, 0.08)', border: 'rgba(123, 31, 162, 0.15)', text: '#7b1fa2', dot: '#7b1fa2' },
    { bg: 'rgba(56, 142, 60, 0.08)', border: 'rgba(56, 142, 60, 0.15)', text: '#388e3c', dot: '#388e3c' },
    { bg: 'rgba(194, 24, 91, 0.08)', border: 'rgba(194, 24, 91, 0.15)', text: '#c2185b', dot: '#c2185b' }
  ];

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700;800&family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />
      <style dangerouslySetInnerHTML={{ __html: `
        .font-headline { font-family: 'Manrope', sans-serif; }
        .font-body { font-family: 'Inter', sans-serif; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        
        .calendar-grid-container {
            display: grid;
            grid-template-columns: repeat(7, 1fr);
            background-color: #ffffff;
            border-radius: 20px;
            overflow: hidden;
            box-shadow: 0px 12px 32px rgba(22,29,30,0.02);
            border: 1px solid #dde4e5;
        }
        .day-cell {
            height: 120px; /* Fixed height for consistency */
            padding: 12px;
            border-right: 1px solid rgba(222, 228, 229, 0.4);
            border-bottom: 1px solid rgba(222, 228, 229, 0.4);
            position: relative;
        }
        .day-cell.weekend { background-color: rgba(238, 245, 246, 0.3); }
        .day-cell:nth-child(7n) { border-right: none; }
        
        .event-bar-span {
            position: absolute;
            height: 24px; /* Slightly reduced height */
            z-index: 10;
            padding: 0 4px;
            pointer-events: auto;
        }
        .event-bar-inner {
            height: 100%;
            border-radius: 4px;
            padding: 0 6px;
            display: flex;
            align-items: center;
            gap: 4px;
            font-size: 10px;
            font-weight: 700;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            box-shadow: 0 1px 2px rgba(0,0,0,0.02);
            font-family: 'Inter', sans-serif;
        }
        .event-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
      `}} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col gap-16 font-body text-[#161d1e] bg-[#f4fbfb] min-h-screen">
        
        {/* "Upcoming Events" Highlights Section */}
        <section className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h2 className="font-headline text-2xl font-black text-[#161d1e] tracking-tight">Upcoming</h2>
            <div className="h-[1px] flex-grow mx-8 bg-[#dde4e5] opacity-50" />
            <span className="text-[10px] font-black text-[#424753] uppercase tracking-[0.2em]">
              {location ? `${location.country}, ${location.city}` : 'Global, All'}
            </span>
          </div>
          
          <div className="flex overflow-x-auto gap-5 pb-6 no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
            {upcomingHighlightEvents.length === 0 ? (
               <div className="w-full h-40 bg-white/50 border border-dashed border-[#dde4e5] rounded-[24px] flex items-center justify-center">
                  <p className="text-[12px] font-black text-[#dde4e5] uppercase tracking-widest">No Upcoming Events</p>
               </div>
            ) : (
                upcomingHighlightEvents.map((event) => {
                  const start = getNormalizedDate(event.startDate);
                  const end = getNormalizedDate(event.endDate || event.startDate);
                  
                  let organizer = event.hostName || 'Organizer';
                  let cleanDescription = event.description || '';
                  if (cleanDescription.startsWith('[주최:')) {
                     const match = cleanDescription.match(/\[주최:\s*([^\]]+)\]\s*(.*)/);
                     if (match) { organizer = match[1]; cleanDescription = match[2]; }
                  }

                  const dateRange = isSameDay(start, end)
                    ? format(start, 'MMM d')
                    : `${format(start, 'MMM d')} - ${format(end, 'MMM d')}`;

                  return (
                    <div key={event.id} className="min-w-[280px] sm:min-w-[260px] flex-none bg-white p-5 rounded-[20px] flex flex-col gap-4 shadow-[0px_12px_32px_rgba(22,29,30,0.03)] border border-[#dde4e5]/30 hover:shadow-xl transition-all cursor-pointer group relative overflow-hidden text-left">
                      <div className="absolute top-0 right-0 w-20 h-20 bg-primary/5 rounded-bl-full -mr-8 -mt-8 group-hover:scale-150 transition-transform duration-700" />
                      
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2 text-primary overflow-hidden">
                          <span className="material-symbols-outlined text-[16px] flex-shrink-0">location_on</span>
                          <span className="font-headline text-[9px] font-extrabold uppercase tracking-widest truncate">{event.location?.split(',')[0]}</span>
                        </div>
                        <span className="font-headline text-[9px] font-black text-[#424753] bg-[#eef5f6] px-2.5 py-1 rounded-full uppercase tracking-tighter flex-shrink-0"> {format(start, 'EEE, d MMM')} </span>
                      </div>

                      <div className="flex flex-col gap-2">
                        <h3 className="font-headline text-[17px] font-extrabold text-[#161d1e] truncate group-hover:text-primary transition-colors leading-tight">{event.title}</h3>
                        <div className="flex flex-col gap-1.5">
                           <div className="flex items-center gap-1.5 text-primary/80">
                             <span className="material-symbols-outlined text-[14px]">person</span>
                             <p className="text-[10px] font-bold uppercase tracking-tighter truncate">{organizer}</p>
                           </div>
                           <p className="text-[12px] text-[#424753] opacity-70 font-medium line-clamp-1 leading-relaxed">{cleanDescription || 'Group Gathering'}</p>
                        </div>
                      </div>

                      <div className="mt-auto pt-4 border-t border-[#dde4e5]/30">
                        <p className="text-[10px] font-black text-primary uppercase tracking-widest"> {dateRange} </p>
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        </section>

        {/* Schedule Section */}
        <section className="flex flex-col gap-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <h2 className="font-headline text-2xl font-black text-[#161d1e] tracking-tight">All Events</h2>
            <div className="flex items-center bg-white p-1.5 pl-5 rounded-full shadow-[0px_8px_24px_rgba(22,29,30,0.04)] border border-[#dde4e5]/50">
              <div className="flex items-center gap-4 border-r border-[#dde4e5] pr-6 mr-6">
                <button onClick={() => setCurrentDate(prev => addDays(prev, -30))} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#eef5f6] text-[#424753] transition-colors"><span className="material-symbols-outlined text-[20px]">chevron_left</span></button>
                <span className="font-headline text-xs font-black text-[#161d1e] min-w-[100px] text-center uppercase tracking-[0.2em]">{format(currentDate, 'MMM, yyyy')}</span>
                <button onClick={() => setCurrentDate(prev => addDays(prev, 30))} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#eef5f6] text-[#424753] transition-colors"><span className="material-symbols-outlined text-[20px]">chevron_right</span></button>
              </div>
              <div className="flex bg-[#eef5f6] rounded-full p-1">
                <button onClick={() => setViewMode('calendar')} title="Calendar View" className={`flex items-center justify-center w-10 h-10 rounded-full transition-all ${viewMode === 'calendar' ? 'bg-primary text-white shadow-lg' : 'text-[#424753] hover:text-[#161d1e]'}`}><span className="material-symbols-outlined text-[22px]">calendar_view_month</span></button>
                <button onClick={() => setViewMode('list')} title="List View" className={`flex items-center justify-center w-10 h-10 rounded-full transition-all ${viewMode === 'list' ? 'bg-primary text-white shadow-lg' : 'text-[#424753] hover:text-[#161d1e]'}`}><span className="material-symbols-outlined text-[22px]">format_list_bulleted</span></button>
              </div>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {viewMode === 'calendar' ? (
              <motion.div key="calendar-grid" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="calendar-grid-container relative">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                  <div key={day} className="py-3 text-center border-b border-[#dde4e5] bg-[#f9fdfd]"><span className="font-headline text-[10px] font-black text-[#7c8485] uppercase tracking-[0.2em]">{day}</span></div>
                ))}
                {calendarRange.weeks.flatMap(w => w.days).map((date, i) => {
                    const dayEvents = events.filter(e => {
                        const start = getNormalizedDate(e.startDate);
                        const end = getNormalizedDate(e.endDate || e.startDate);
                        return date >= start && date <= end;
                    });
                    const hasEvents = dayEvents.length > 0;
                    const hasMultiple = dayEvents.length > 1;
                    const isToday = isSameDay(date, new Date());
                    const isFirstDay = date.getDate() === 1;

                    return (
                        <div key={i} className={`day-cell ${[0, 6].includes(getDay(date)) ? 'weekend' : ''} ${date.getMonth() !== currentDate.getMonth() ? 'opacity-20' : ''}`}>
                            <div className="absolute top-3 left-3 flex flex-col items-center">
                                <span className={`font-headline text-[11px] font-black w-6 h-6 flex items-center justify-center rounded-full transition-all
                                    ${isToday ? 'text-white bg-primary shadow-lg scale-110' : 'text-[#7c8485]'}`}>
                                    {date.getDate()}
                                </span>
                                {isFirstDay && (
                                  <span className="text-[8px] font-black text-[#7c8485] uppercase tracking-tighter mt-0.5">
                                    {format(date, 'MMM')}
                                  </span>
                                )}
                            </div>
                        </div>
                    );
                })}
                
                {/* Spanning Bar Layer */}
                <div className="absolute inset-0 top-[41px] pointer-events-none grid grid-cols-7" style={{ gridTemplateRows: 'repeat(5, 120px)' }}>
                   {calendarRange.weeks.map((week, weekIdx) => {
                      const weekEvents = events.filter(e => {
                        const start = getNormalizedDate(e.startDate);
                        const end = getNormalizedDate(e.endDate || e.startDate);
                        return start <= week.end && end >= week.start;
                      });

                      return weekEvents.map((event) => {
                        const start = getNormalizedDate(event.startDate);
                        const end = getNormalizedDate(event.endDate || event.startDate);
                        
                        // Clip to week
                        const renderStart = start < week.start ? week.start : start;
                        const renderEnd = end > week.end ? week.end : end;
                        
                        const colStart = (getDay(renderStart) + 6) % 7 + 1;
                        const daySpan = differenceInCalendarDays(startOfDay(renderEnd), startOfDay(renderStart)) + 1;
                        const colEnd = colStart + daySpan;

                         const slotIdx = eventSlots[event.id] ?? 0;
                         const colorSet = STACK_COLORS[slotIdx % STACK_COLORS.length];
                         
                         // Vertical position: Base top offset (below day number) + (slot * barHeight)
                         const barHeight = 28;
                         const baseTop = 38;

                         return (
                           <div key={`${event.id}-${weekIdx}`} className="event-bar-span" style={{
                               gridRow: weekIdx + 1,
                               gridColumnStart: colStart,
                               gridColumnEnd: Math.min(colEnd, 8),
                               marginTop: `${baseTop + (slotIdx * barHeight)}px`
                             }}>
                            <div className="event-bar-inner group" style={{ backgroundColor: colorSet.bg, borderColor: colorSet.border, color: colorSet.text }}>
                              <span className="event-dot" style={{ backgroundColor: colorSet.dot }} />
                              <span className="truncate">{event.locationEmoji} {event.title}</span>
                              <div className="absolute -top-16 left-1/2 -translate-x-1/2 bg-[#161d1e] text-white p-3 rounded-xl text-[10px] opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-50 w-56 shadow-2xl border border-white/10">
                                <div className="font-black border-b border-white/10 pb-2 mb-2 uppercase tracking-widest text-primary-fixed">{event.category}</div>
                                <div className="font-bold mb-1">{event.title}</div>
                                <div className="text-[9px] opacity-60 mb-2">{format(start, 'EEE, d MMM')} {isSameDay(start, end) ? '' : `- ${format(end, 'EEE, d MMM')}`}</div>
                                <div className="flex items-center gap-2 opacity-60"><span className="material-symbols-outlined text-[14px]">location_on</span><span>{event.location}</span></div>
                              </div>
                            </div>
                          </div>
                        );
                      });
                   })}
                </div>
              </motion.div>
            ) : (
              <motion.div key="list-view" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.02 }} className="max-w-3xl mx-auto w-full flex flex-col gap-6">
                {events.filter(e => {
                  const s = getNormalizedDate(e.startDate);
                  const end = getNormalizedDate(e.endDate || e.startDate);
                  const viewStart = startOfMonth(currentDate);
                  const viewEnd = endOfMonth(currentDate);
                  return s <= viewEnd && end >= viewStart;
                }).map(event => {
                  const start = getNormalizedDate(event.startDate);
                  const end = getNormalizedDate(event.endDate || event.startDate);
                  const dateRange = isSameDay(start, end)
                    ? format(start, 'EEE, d MMM yyyy')
                    : `${format(start, 'EEE, d MMM')} - ${format(end, 'EEE, d MMM yyyy')}`;
                  
                  return (
                    <div key={event.id} className="group flex gap-6 p-6 sm:p-8 rounded-[24px] bg-white border border-[#dde4e5]/30 hover:shadow-2xl transition-all duration-500 hover:bg-[#F4FBFB] items-start">
                      <div className="flex flex-col items-center justify-center w-20 h-24 sm:w-24 sm:h-28 bg-[#eef5f6] rounded-[20px] shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] group-hover:bg-primary transition-all duration-500 flex-shrink-0">
                        <span className="text-[10px] font-black text-[#7c8485] group-hover:text-white/70 uppercase tracking-widest mb-1">{format(start, 'MMM')}</span>
                        <span className="text-3xl sm:text-4xl font-black text-[#161d1e] group-hover:text-white transition-colors tracking-tighter">{format(start, 'd')}</span>
                      </div>

                      <div className="flex-1 flex flex-col justify-center gap-2 py-1">
                        <h3 className="text-xl sm:text-2xl font-black text-primary group-hover:text-primary transition-colors leading-tight">{event.title}</h3>
                        <div className="flex flex-col gap-1.5 mt-1">
                          <div className="flex items-center gap-2 text-[#424753] font-bold">
                            <span className="material-symbols-outlined text-[18px] text-primary">location_on</span>
                            <span className="text-[13px] sm:text-[14px]">{event.location}</span>
                          </div>
                          <div className="flex items-center gap-2 text-[#7c8485] font-black">
                            <span className="material-symbols-outlined text-[18px]">calendar_today</span>
                            <span className="text-[11px] sm:text-[12px] uppercase tracking-tighter">{dateRange}</span>
                          </div>
                        </div>
                        <div className="mt-4 flex flex-wrap gap-2">
                          <span className="px-3 py-1 rounded-full bg-[#f0f4f5] text-[9px] font-black text-[#424753] uppercase tracking-widest">{event.category}</span>
                        </div>
                      </div>
                      <div className="hidden sm:flex self-center">
                        <button className="px-6 py-3 rounded-xl bg-[#161d1e] text-white font-headline text-[10px] font-black uppercase tracking-[0.2em] hover:bg-primary transition-all shadow-lg">Details</button>
                      </div>
                    </div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        <button onClick={() => setShowCreateModal(true)} className="fixed bottom-8 right-8 w-20 h-20 bg-[#161d1e] text-white rounded-full shadow-[0px_24px_48px_rgba(22,29,30,0.3)] flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-50 group overflow-hidden">
          <div className="absolute inset-0 bg-primary translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
          <span className="material-symbols-outlined text-[36px] relative z-10">add</span>
        </button>
        <AnimatePresence>{showCreateModal && (<CreateEvent onClose={() => setShowCreateModal(false)} onSuccess={() => {}} />)}</AnimatePresence>
      </main>
    </>
  );
}
