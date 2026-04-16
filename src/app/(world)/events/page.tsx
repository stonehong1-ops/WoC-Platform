'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { eventService } from '@/lib/firebase/eventService';
import { Event } from '@/types/event';
import { format, isSameDay } from 'date-fns';
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
      setEvents(data);
    });
    return () => unsub();
  }, []);

  // Today's events
  const todayEvents = events.filter(e => {
    const start = e.startDate.toDate();
    return isSameDay(start, new Date());
  });

  const getCategoryColor = (cat: string) => {
    switch(cat) {
      case 'CONFERENCE': return { text: '#1A73E8', bg: '#d8e2ff' };
      case 'WORKSHOP': return { text: '#9f403d', bg: '#fe8983' };
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
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-headline text-lg font-extrabold tracking-tight text-[#2d3435]">Event Today</h2>
            <button className="text-[#1A73E8] font-bold text-sm flex items-center gap-1 group">
              See all 
              <span className="material-symbols-outlined text-sm font-bold transition-transform group-hover:translate-x-1">arrow_forward</span>
            </button>
          </div>
          
          <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar -mx-4 px-4">
            {todayEvents.length === 0 ? (
              <div className="flex-none w-72 p-8 bg-white border border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center text-center">
                <span className="material-symbols-outlined text-gray-200 text-4xl mb-3">event_busy</span>
                <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">No Events Today</p>
              </div>
            ) : (
              todayEvents.map(event => {
                const colors = getCategoryColor(event.category);
                return (
                  <div key={event.id} className="flex-none w-72 p-5 bg-white border border-[#ebeeef] rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer group">
                    <div className="flex justify-between items-start mb-3">
                      <span className={`text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 rounded transition-colors`} style={{ color: colors.text, backgroundColor: `${colors.bg}4D` }}>
                        {event.category}
                      </span>
                      <span className="material-symbols-outlined text-[#596061] text-base opacity-0 group-hover:opacity-100 transition-opacity">more_horiz</span>
                    </div>
                    <h3 className="font-headline font-bold text-lg leading-tight mb-3 line-clamp-2">{event.title}</h3>
                    <div className="flex flex-col gap-2 text-[#596061] text-sm">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-base">location_on</span>
                        <span className="truncate">{event.location}</span>
                      </div>
                      <div className="flex items-center gap-2 font-bold text-[#2d3435]">
                        <span className="material-symbols-outlined text-base">calendar_today</span>
                        <span>{format(event.startDate.toDate(), 'MMM d, yyyy')}</span>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </section>

        {/* Section: Monthly Calendar (Mocked View for UI Preservation) */}
        <section className="bg-white border border-[#ebeeef] rounded-lg shadow-sm overflow-hidden mb-12">
          <div className="flex items-center justify-between p-3 border-b border-[#ebeeef]">
            <div className="flex items-center gap-2">
              <button className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"><span className="material-symbols-outlined text-xl text-[#596061]">chevron_left</span></button>
              <div className="flex items-center gap-1">
                <h1 className="font-headline text-sm font-extrabold text-[#2d3435]">April,</h1>
                <span className="font-headline text-sm font-medium text-[#596061]">2026</span>
              </div>
              <button className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"><span className="material-symbols-outlined text-xl text-[#596061]">chevron_right</span></button>
            </div>
            <div className="flex items-center bg-[#f2f4f4] p-1 rounded-lg segmented-control">
              <input checked className="hidden" id="view-month" name="view" type="radio" readOnly /><label className="px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded cursor-pointer transition-all" htmlFor="view-month">M</label>
              <label className="px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded cursor-pointer transition-all" htmlFor="view-week">W</label>
              <label className="px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded cursor-pointer transition-all" htmlFor="view-day">D</label>
            </div>
          </div>

          <div className="calendar-grid bg-white border-b border-[#ebeeef] text-center">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
              <div key={day} className="py-2.5 border-r border-[#ebeeef] last:border-r-0"><span className="text-[10px] font-bold text-[#596061] uppercase tracking-widest">{day}</span></div>
            ))}
          </div>

          <div className="calendar-grid auto-rows-min relative h-[450px]">
             {/* Simplified grid for visual preservation */}
             {Array.from({ length: 35 }).map((_, i) => (
              <div key={i} className="min-h-[100px] p-2 border-b border-r border-[#ebeeef] last:border-r-0 flex flex-col items-end">
                <span className="text-xs font-bold text-[#757c7d]">{((i + 30) % 31) + 1}</span>
                {/* Real Data Logic would place bars here. For UI preservation, we keep the grid structure. */}
              </div>
             ))}
          </div>
        </section>

        {/* Global FAB (Plaza Style) */}
        <button 
          onClick={() => setShowCreateModal(true)}
          className="fixed bottom-6 right-6 w-16 h-16 bg-primary text-white rounded-full shadow-2xl shadow-primary/40 flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-50 group overflow-hidden"
        >
          <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
          <span className="material-symbols-outlined text-[32px] font-bold relative z-10 animate-in zoom-in duration-300">add</span>
        </button>

        {/* Create Event Modal */}
        <AnimatePresence>
          {showCreateModal && (
            <CreateEvent 
              onClose={() => setShowCreateModal(false)} 
              onSuccess={() => {
                // Success feedback can be added here
              }}
            />
          )}
        </AnimatePresence>
      </main>
    </>
  );
}
