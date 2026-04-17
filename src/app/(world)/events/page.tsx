'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { eventService } from '@/lib/firebase/eventService';
import { Event } from '@/types/event';
import { format, isSameDay, isAfter, startOfDay } from 'date-fns';
import { ko } from 'date-fns/locale';
import CreateEvent from '@/components/events/CreateEvent';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from '@/components/providers/LocationProvider';

export default function EventsPage() {
  const { user } = useAuth();
  const { location } = useLocation();
  const [events, setEvents] = useState<Event[]>([]);
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // Real-time Subscription
  useEffect(() => {
    const unsub = eventService.subscribeEvents((data) => {
      // Safely set events: firestore already orders by startDate
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
      
      if (location.city === 'ALL') {
        return countryMatch;
      }
      
      const cityMatch = eventLoc.includes(location.city.toLowerCase());
      return countryMatch && cityMatch;
    });
  }, [events, location]);

  // Today's events
  const todayEvents = useMemo(() => filteredLocationEvents.filter(e => {
    try {
      const start = typeof e.startDate.toDate === 'function' 
        ? e.startDate.toDate() 
        : new Date(e.startDate as any);
      return isSameDay(start, new Date());
    } catch (err) {
      return false;
    }
  }), [filteredLocationEvents]);

  // Upcoming events (after today)
  const upcomingEvents = useMemo(() => filteredLocationEvents.filter(e => {
    try {
      const start = typeof e.startDate.toDate === 'function' 
        ? e.startDate.toDate() 
        : new Date(e.startDate as any);
      return isAfter(start, startOfDay(new Date())) && !isSameDay(start, new Date());
    } catch (err) {
      return false;
    }
  }), [filteredLocationEvents]);

  const getCategoryColor = (cat: string) => {
    switch(cat) {
      case 'CONFERENCE': return { text: '#1A73E8', bg: '#d8e2ff' };
      case 'WORKSHOP': return { text: '#9f403d', bg: '#fe8983' };
      case 'PARTY': return { text: '#7b1fa2', bg: '#f3e5f5' };
      case 'SOCIAL': return { text: '#388e3c', bg: '#e8f5e9' };
      case 'NETWORKING': return { text: '#5b5f64', bg: '#dfe3e8' };
      default: return { text: '#2d3435', bg: '#f2f4f4' };
    }
  };

  // Calendar Helper Logic
  const calendarDays = useMemo(() => {
    const today = new Date();
    const start = startOfDay(today);
    // Show 35 days (5 weeks) from current week
    const firstDayOfWeek = today.getDay(); // 0=Sun, 1=Mon...
    const paddingDays = (firstDayOfWeek + 6) % 7; // Mon=0
    
    const days = [];
    // Just showing a fixed range for now to represent the "upcoming" view
    for (let i = 0; i < 35; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - paddingDays + i);
      days.push(date);
    }
    return days;
  }, []);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .material-symbols-outlined {
          font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .calendar-grid { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); width: 100%; border-top: 1px solid #ebeeef; border-left: 1px solid #ebeeef; }
        .calendar-day { min-height: 120px; padding: 8px; border-right: 1px solid #ebeeef; border-bottom: 1px solid #ebeeef; background: white; transition: background 0.2s; }
        .calendar-day:hover { background: #fcfcfc; }
        .event-bar {
          height: 22px; font-size: 10px; font-weight: 700; display: flex; align-items: center;
          padding: 0 8px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; 
          margin-bottom: 2px; border-radius: 4px; box-shadow: 0 1px 2px rgba(0,0,0,0.05);
        }
      `}} />

      <main className="max-w-7xl mx-auto px-4 pt-6 pb-24 bg-[#f9f9f9] min-h-screen relative">
        {/* Section: Event Today */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-headline text-2xl font-extrabold tracking-tight text-[#2d3435]">Event Today</h2>
            <div className="h-[1px] flex-grow mx-6 bg-gray-200" />
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{format(new Date(), 'MMMM d, yyyy')}</span>
          </div>
          
          <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar -mx-4 px-4">
            {todayEvents.length === 0 ? (
              <div className="flex-none w-full max-w-md p-10 bg-white border border-[#ebeeef] rounded-2xl flex flex-col items-center justify-center text-center">
                <span className="material-symbols-outlined text-gray-200 text-5xl mb-3">event_busy</span>
                <p className="text-[12px] font-black text-gray-300 uppercase tracking-widest">No Events Scheduled for Today</p>
              </div>
            ) : (
              todayEvents.map(event => {
                const colors = getCategoryColor(event.category);
                return (
                  <div key={event.id} className="flex-none w-80 p-6 bg-white border border-[#ebeeef] rounded-2xl shadow-sm hover:shadow-xl transition-all cursor-pointer group relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: colors.text }} />
                    <div className="flex justify-between items-start mb-4">
                      <span className={`text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full`} style={{ color: colors.text, backgroundColor: `${colors.bg}` }}>
                        {event.category}
                      </span>
                      <span className="material-symbols-outlined text-[#596061] text-lg opacity-40 group-hover:opacity-100 transition-opacity">more_horiz</span>
                    </div>
                    <h3 className="font-headline font-bold text-xl leading-tight mb-4 line-clamp-2 text-[#2d3435]">{event.title}</h3>
                    <div className="flex flex-col gap-3 text-[#596061] text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{event.locationEmoji || '📍'}</span>
                        <span className="truncate font-medium">{event.location}</span>
                      </div>
                      <div className="flex items-center gap-2 font-bold text-[#1A73E8]">
                        <span className="material-symbols-outlined text-base">schedule</span>
                        <span>Starts at {format(event.startDate.toDate(), 'HH:mm')}</span>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </section>

        {/* Section: Upcoming Grid / Calendar */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-headline text-2xl font-extrabold tracking-tight text-[#2d3435]">Upcoming Events</h2>
            
            <div className="flex items-center gap-6">
              {/* View Toggle */}
              <div className="flex bg-[#ecedee] p-1 rounded-xl shadow-inner">
                <button 
                  onClick={() => setViewMode('calendar')}
                  className={`px-4 py-2 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all flex items-center gap-2 ${viewMode === 'calendar' ? 'bg-white text-[#1A73E8] shadow-sm' : 'text-[#596061] hover:text-[#2d3435]'}`}
                >
                  <span className="material-symbols-outlined text-base">calendar_view_month</span>
                  Calendar
                </button>
                <button 
                  onClick={() => setViewMode('list')}
                  className={`px-4 py-2 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all flex items-center gap-2 ${viewMode === 'list' ? 'bg-white text-[#1A73E8] shadow-sm' : 'text-[#596061] hover:text-[#2d3435]'}`}
                >
                  <span className="material-symbols-outlined text-base">list</span>
                  List
                </button>
              </div>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {viewMode === 'calendar' ? (
              <motion.div 
                key="calendar"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="bg-white rounded-3xl overflow-hidden border border-[#ebeeef] shadow-sm"
              >
                {/* Week Header */}
                <div className="grid grid-cols-7 text-center bg-[#fdfdfd] border-b border-[#ebeeef]">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                    <div key={day} className="py-4 border-r border-[#ebeeef] last:border-r-0">
                      <span className="text-[10px] font-black text-[#596061] uppercase tracking-[0.2em]">{day}</span>
                    </div>
                  ))}
                </div>

                {/* Calendar Grid */}
                <div className="calendar-grid">
                  {calendarDays.map((date, i) => {
                    const isToday = isSameDay(date, new Date());
                    const dayEvents = filteredLocationEvents.filter(e => {
                      const getAsDate = (val: any) => typeof val?.toDate === 'function' ? val.toDate() : new Date(val);
                      const start = getAsDate(e.startDate);
                      const end = getAsDate(e.endDate || e.startDate);
                      return (isSameDay(date, start) || (date >= start && date <= end));
                    });

                    return (
                      <div key={i} className={`calendar-day ${!isSameDay(date, new Date()) && date.getMonth() !== new Date().getMonth() ? 'opacity-40' : ''}`}>
                        <div className="flex justify-between items-start mb-2">
                          <span className={`text-[11px] font-black ${isToday ? 'bg-[#1A73E8] text-white w-6 h-6 flex items-center justify-center rounded-full translate-x-1 -translate-y-1' : 'text-[#757c7d]'}`}>
                            {format(date, 'd')}
                          </span>
                        </div>
                        <div className="flex flex-col gap-1 overflow-y-auto max-h-[80px] no-scrollbar">
                          {dayEvents.map(event => {
                            const colors = getCategoryColor(event.category);
                            return (
                              <div 
                                key={event.id}
                                className="event-bar group relative cursor-pointer"
                                style={{ backgroundColor: colors.bg, color: colors.text }}
                              >
                                <span className="truncate">{event.locationEmoji} {event.title}</span>
                                {/* Mini Tooltip on Hover */}
                                <div className="absolute bottom-full left-0 mb-2 invisible group-hover:visible bg-[#2d3435] text-white p-2 rounded-lg text-[10px] z-50 w-48 shadow-xl">
                                  <p className="font-bold mb-1">{event.title}</p>
                                  <p className="opacity-70">{event.location}</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="list"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                {upcomingEvents.length === 0 ? (
                  <div className="p-20 text-center bg-white border border-[#ebeeef] rounded-3xl">
                    <span className="material-symbols-outlined text-gray-200 text-6xl mb-4">event_repeat</span>
                    <p className="text-[14px] font-black text-gray-400 uppercase tracking-widest">No Events Found</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {upcomingEvents.map((event, idx) => {
                      const colors = getCategoryColor(event.category);
                      return (
                        <motion.div 
                          key={event.id}
                          className="p-6 bg-white border border-[#ebeeef] rounded-2xl hover:border-[#1A73E8]/30 hover:shadow-xl transition-all cursor-pointer group"
                        >
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex flex-col">
                              <span className="text-[10px] font-black text-[#1A73E8] uppercase tracking-tighter mb-1">
                                {format(event.startDate.toDate(), 'MMM d')}
                              </span>
                              <span className="text-lg font-bold text-[#2d3435]">
                                {format(event.startDate.toDate(), 'yyyy')}
                              </span>
                            </div>
                            <span className={`text-[9px] font-black tracking-widest uppercase px-3 py-1 rounded-full`} style={{ color: colors.text, backgroundColor: `${colors.bg}` }}>
                              {event.category}
                            </span>
                          </div>
                          
                          <h3 className="font-headline font-bold text-lg mb-3 leading-tight group-hover:text-[#1A73E8] transition-colors line-clamp-1">
                            {event.title}
                          </h3>
                          
                          <p className="text-xs text-gray-500 line-clamp-2 mb-4 leading-relaxed italic">
                            {event.description}
                          </p>

                          <div className="pt-4 border-t border-gray-50 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-base">{event.locationEmoji || '📍'}</span>
                              <span className="text-[11px] font-bold text-[#596061] uppercase tracking-wide truncate max-w-[120px]">
                                {event.location}
                              </span>
                            </div>
                            <div className="w-6 h-6 rounded-full bg-gray-50 flex items-center justify-center">
                              <span className="material-symbols-outlined text-[12px] text-gray-400">person</span>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* Global FAB (Plaza Style) */}
        <button 
          onClick={() => setShowCreateModal(true)}
          className="fixed bottom-6 right-6 w-16 h-16 bg-[#2d3435] text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-50 group overflow-hidden"
        >
          <div className="absolute inset-0 bg-[#1A73E8] translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
          <span className="material-symbols-outlined text-[32px] font-bold relative z-10">add</span>
        </button>

        {/* Create Event Modal */}
        <AnimatePresence>
          {showCreateModal && (
            <CreateEvent 
              onClose={() => setShowCreateModal(false)} 
              onSuccess={() => {}}
            />
          )}
        </AnimatePresence>
      </main>
    </>
  );
}

