'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { eventService } from '@/lib/firebase/eventService';
import { Event } from '@/types/event';
import { format, isSameDay, isAfter, startOfDay } from 'date-fns';
import { ko } from 'date-fns/locale';
import CreateEvent from '@/components/events/CreateEvent';
import { motion, AnimatePresence } from 'framer-motion';

export default function EventsPage() {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // Real-time Subscription
  useEffect(() => {
    const unsub = eventService.subscribeEvents((data) => {
      // Safely set events: firestore already orders by startDate, 
      // but we filter out any malformed data just in case
      const validEvents = data.filter(e => e.startDate && typeof e.startDate.toDate === 'function');
      setEvents(validEvents);
    });
    return () => unsub();
  }, []);

  // Today's events
  const todayEvents = useMemo(() => events.filter(e => {
    try {
      const start = e.startDate.toDate();
      return isSameDay(start, new Date());
    } catch (e) {
      return false;
    }
  }), [events]);

  // Upcoming events (after today)
  const upcomingEvents = useMemo(() => events.filter(e => {
    try {
      const start = e.startDate.toDate();
      return isAfter(start, startOfDay(new Date())) && !isSameDay(start, new Date());
    } catch (e) {
      return false;
    }
  }), [events]);

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

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .material-symbols-outlined {
          font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .calendar-grid { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); width: 100%; }
        .event-bar {
          height: 20px; font-size: 8px; font-weight: 700; display: flex; align-items: center;
          padding: 0 6px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; z-index: 10;
        }
        .segmented-control input:checked + label { background-color: white; color: #1A73E8; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
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
              <div className="flex-none w-full max-w-md p-10 bg-white border border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center text-center">
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
                      <span className={`text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full transition-colors`} style={{ color: colors.text, backgroundColor: `${colors.bg}` }}>
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

        {/* Section: Upcoming Highlights */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-headline text-2xl font-extrabold tracking-tight text-[#2d3435]">Upcoming Events</h2>
            <div className="h-[1px] flex-grow ml-6 bg-gray-200" />
          </div>

          {upcomingEvents.length === 0 ? (
            <div className="p-12 text-center text-gray-400 font-bold uppercase tracking-widest border border-dashed border-gray-200 rounded-2xl">
              Stay tuned for more events...
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcomingEvents.map((event, idx) => {
                const colors = getCategoryColor(event.category);
                return (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    key={event.id} 
                    className="p-6 bg-white border border-[#ebeeef] rounded-2xl hover:border-[#1A73E8]/30 hover:shadow-lg transition-all cursor-pointer group"
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
                      <div className="flex -space-x-2">
                        {/* Avatar placeholder for admin added events */}
                        <div className="w-6 h-6 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center">
                          <span className="material-symbols-outlined text-[12px] text-gray-400">person</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
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

