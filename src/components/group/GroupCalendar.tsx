"use client";

import React, { useState, useEffect } from 'react';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth, 
  isSameDay, 
  addDays, 
  startOfDay,
  isToday
} from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import GroupFooter from './GroupFooter';
import { groupService } from '@/lib/firebase/groupService';
import { CalendarEvent, Group } from '@/types/group';

interface GroupCalendarProps {
  group: Group;
}

const GroupCalendar: React.FC<GroupCalendarProps> = ({ group }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  
  // Form State
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startTime: '19:00',
    endTime: '21:00',
    location: '',
    type: 'general' as CalendarEvent['type'],
    color: '#0057bd'
  });

  useEffect(() => {
    if (!group.id) return;
    const unsubscribe = groupService.subscribeCalendarEvents(group.id, (fetchedEvents) => {
      setEvents(fetchedEvents);
    });
    return () => unsubscribe();
  }, [group.id]);

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const onDateClick = (day: Date) => {
    setSelectedDate(day);
  };

  const handleOpenModal = (event?: CalendarEvent) => {
    if (event) {
      setEditingEvent(event);
      setFormData({
        title: event.title,
        description: event.description || '',
        startTime: event.startTime || '19:00',
        endTime: event.endTime || '21:00',
        location: event.location || '',
        type: event.type,
        color: event.color || '#0057bd'
      });
    } else {
      setEditingEvent(null);
      setFormData({
        title: '',
        description: '',
        startTime: '19:00',
        endTime: '21:00',
        location: '',
        type: 'general',
        color: '#0057bd'
      });
    }
    setIsModalOpen(true);
  };

  const handleSaveEvent = async () => {
    if (!formData.title) return;

    const eventPayload = {
      ...formData,
      startDate: startOfDay(selectedDate).getTime(),
      createdBy: 'user', // In real app, this would be current user ID
    };

    try {
      if (editingEvent) {
        await groupService.updateCalendarEvent(group.id, editingEvent.id, eventPayload);
      } else {
        await groupService.addCalendarEvent(group.id, eventPayload);
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error saving event:", error);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!window.confirm("일정을 삭제하시겠습니까?")) return;
    try {
      await groupService.deleteCalendarEvent(group.id, eventId);
    } catch (error) {
      console.error("Error deleting event:", error);
    }
  };

  const renderHeader = () => {
    return (
      <div className="flex justify-between items-center mb-6 md:mb-8 bg-white/40 backdrop-blur-md px-6 py-4 rounded-[32px] border border-white/50 shadow-sm">
        <h2 className="font-headline font-black text-2xl md:text-3xl tracking-tight text-[var(--on-surface)]">
          {format(currentMonth, 'MMMM yyyy')}
        </h2>
        <div className="flex gap-2">
          <button 
            onClick={prevMonth}
            className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white transition-all text-[var(--on-surface-variant)] shadow-sm hover:shadow-md active:scale-95"
          >
            <span className="material-symbols-outlined icon-sm">chevron_left</span>
          </button>
          <button 
            onClick={nextMonth}
            className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white transition-all text-[var(--on-surface-variant)] shadow-sm hover:shadow-md active:scale-95"
          >
            <span className="material-symbols-outlined icon-sm">chevron_right</span>
          </button>
        </div>
      </div>
    );
  };

  const renderDays = () => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return (
      <div className="grid grid-cols-7 mb-6">
        {days.map((day, i) => (
          <div key={i} className="text-center">
            <span className={`text-[10px] md:text-[11px] font-black uppercase tracking-[0.2em] font-label ${i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-[var(--outline-variant)]'}`}>
              {day}
            </span>
          </div>
        ))}
      </div>
    );
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const rows = [];
    let days = [];
    let day = startDate;

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const cloneDay = day;
        const dayEvents = events.filter(e => isSameDay(new Date(e.startDate), cloneDay));
        const isSelected = isSameDay(day, selectedDate);
        const isCurrentMonth = isSameMonth(day, monthStart);
        const isTodayDate = isToday(day);

        days.push(
          <div
            key={day.toString()}
            className={`relative aspect-square flex flex-col items-center justify-center rounded-2xl md:rounded-[24px] cursor-pointer transition-all duration-300
              ${!isCurrentMonth ? 'text-[var(--outline-variant)] opacity-40' : 'text-[var(--on-surface)]'}
              ${isSelected 
                ? 'bg-[var(--primary)] text-white shadow-xl shadow-[var(--primary)]/20 scale-[1.05] z-10' 
                : isTodayDate 
                  ? 'bg-white border-2 border-[var(--primary)]/30 text-[var(--primary)] font-black' 
                  : 'hover:bg-white hover:shadow-lg hover:scale-[1.02]'
              }
            `}
            onClick={() => onDateClick(cloneDay)}
          >
            <span className={`text-sm md:text-base font-bold ${isSelected ? 'text-white' : ''}`}>{format(day, "d")}</span>
            <div className="absolute bottom-2 md:bottom-3 flex gap-1 justify-center w-full">
              {dayEvents.slice(0, 3).map((event, idx) => (
                <div 
                  key={idx} 
                  className={`w-1 h-1 md:w-1.5 md:h-1.5 rounded-full`}
                  style={{ backgroundColor: isSelected ? 'white' : (event.color || 'var(--primary)') }}
                />
              ))}
              {dayEvents.length > 3 && (
                <div className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white' : 'bg-[var(--outline-variant)]'}`} />
              )}
            </div>
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div className="grid grid-cols-7 gap-1 md:gap-3" key={day.toString()}>
          {days}
        </div>
      );
      days = [];
    }
    return <div className="flex flex-col gap-1 md:gap-3">{rows}</div>;
  };

  const renderEvents = () => {
    const dayEvents = events.filter(e => isSameDay(new Date(e.startDate), selectedDate));

    return (
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-center bg-white/60 backdrop-blur-md p-6 rounded-[32px] border border-white/50 shadow-sm">
          <div>
            <h3 className="font-headline font-black text-xl md:text-2xl text-[var(--on-surface)]">{format(selectedDate, 'EEEE, MMM d')}</h3>
            <p className="text-[11px] font-bold text-[var(--on-surface-variant)] tracking-wide uppercase mt-1">
              {dayEvents.length} {dayEvents.length === 1 ? 'Event' : 'Events'} Scheduled
            </p>
          </div>
          <button 
            onClick={() => handleOpenModal()}
            className="w-12 h-12 bg-[var(--primary)] text-white rounded-2xl flex items-center justify-center shadow-lg shadow-[var(--primary)]/20 hover:scale-110 active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined">add</span>
          </button>
        </div>

        <div className="flex flex-col gap-4">
          {dayEvents.length > 0 ? (
            dayEvents.map((event) => (
              <motion.div 
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={event.id}
                className="group bg-white/80 backdrop-blur-md rounded-[24px] p-5 hover:shadow-xl transition-all border border-white/80"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: event.color || 'var(--primary)' }} />
                      <span className="text-[10px] font-black uppercase tracking-[0.15em] text-[var(--primary)]">
                        {event.startTime} - {event.endTime}
                      </span>
                    </div>
                    <h4 className="font-headline font-extrabold text-lg text-[var(--on-surface)] group-hover:text-[var(--primary)] transition-colors">{event.title}</h4>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => handleOpenModal(event)}
                      className="p-2 text-[var(--outline-variant)] hover:text-[var(--primary)] hover:bg-[var(--primary)]/10 rounded-xl transition-all"
                    >
                      <span className="material-symbols-outlined text-sm">edit</span>
                    </button>
                    <button 
                      onClick={() => handleDeleteEvent(event.id)}
                      className="p-2 text-[var(--outline-variant)] hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                    >
                      <span className="material-symbols-outlined text-sm">delete</span>
                    </button>
                  </div>
                </div>
                {event.description && <p className="text-[var(--on-surface-variant)] text-sm leading-relaxed mb-4">{event.description}</p>}
                <div className="flex flex-wrap gap-2">
                  {event.location && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--surface-container-low)] rounded-lg">
                      <span className="material-symbols-outlined text-sm text-[var(--primary)]">location_on</span>
                      <span className="text-[11px] font-bold text-[var(--on-surface-variant)]">{event.location}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--surface-container-low)] rounded-lg">
                    <span className="material-symbols-outlined text-sm text-[var(--primary)]">category</span>
                    <span className="text-[11px] font-bold text-[var(--on-surface-variant)] uppercase tracking-wider">{event.type}</span>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="bg-white/40 border-2 border-dashed border-[var(--outline-variant)]/30 rounded-[32px] p-12 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center mb-4 shadow-sm">
                <span className="material-symbols-outlined text-3xl text-[var(--outline-variant)]">event_busy</span>
              </div>
              <h4 className="font-headline font-bold text-lg text-[var(--on-surface)] mb-1">일정이 없습니다</h4>
              <p className="text-sm text-[var(--on-surface-variant)]">새로운 일정을 추가해보세요!</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 overflow-y-auto no-scrollbar pb-32 bg-[var(--surface-bright)]">
      <main className="pt-28 md:pt-36 px-4 md:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 md:gap-20">
          <section className="lg:col-span-7 flex flex-col gap-8">
            {renderHeader()}
            <div className="bg-white/60 backdrop-blur-xl p-8 md:p-12 rounded-[var(--radius-premium)] border border-white shadow-[var(--shadow-premium)]">
              {renderDays()}
              {renderCells()}
            </div>
          </section>

          <section className="lg:col-span-5">
            {renderEvents()}
          </section>
        </div>
      </main>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-[var(--on-surface)]/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-[var(--radius-premium)] shadow-2xl overflow-hidden"
            >
              <div className="bg-gradient-to-br from-[var(--primary)] to-[var(--primary-container)] px-8 py-10 text-white relative">
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="absolute top-6 right-6 p-2 hover:bg-white/20 rounded-full transition-colors"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
                <h2 className="font-headline font-black text-3xl mb-2">
                  {editingEvent ? '일정 수정' : '일정 만들기'}
                </h2>
                <p className="opacity-80 font-medium">{format(selectedDate, 'EEEE, MMMM do, yyyy')}</p>
              </div>

              <div className="p-8 flex flex-col gap-6 max-h-[60vh] overflow-y-auto no-scrollbar">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-black uppercase tracking-widest text-[var(--on-surface-variant)] ml-1">Event Title</label>
                  <input 
                    autoFocus
                    placeholder="?? ?뚯뀥 ?꾩뒪 ?뚰떚"
                    className="w-full px-6 py-4 bg-[var(--surface-container-low)] rounded-2xl border-none focus:ring-4 focus:ring-[var(--primary)]/10 transition-all font-bold text-[var(--on-surface)]"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-black uppercase tracking-widest text-[var(--on-surface-variant)] ml-1">Start Time</label>
                    <input 
                      type="time"
                      className="w-full px-6 py-4 bg-[var(--surface-container-low)] rounded-2xl border-none focus:ring-4 focus:ring-[var(--primary)]/10 transition-all font-bold text-[var(--on-surface)]"
                      value={formData.startTime}
                      onChange={(e) => setFormData({...formData, startTime: e.target.value})}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-black uppercase tracking-widest text-[var(--on-surface-variant)] ml-1">End Time</label>
                    <input 
                      type="time"
                      className="w-full px-6 py-4 bg-[var(--surface-container-low)] rounded-2xl border-none focus:ring-4 focus:ring-[var(--primary)]/10 transition-all font-bold text-[var(--on-surface)]"
                      value={formData.endTime}
                      onChange={(e) => setFormData({...formData, endTime: e.target.value})}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-black uppercase tracking-widest text-[var(--on-surface-variant)] ml-1">Location</label>
                  <input 
                    placeholder="?? 硫붿씤 ?"
                    className="w-full px-6 py-4 bg-[var(--surface-container-low)] rounded-2xl border-none focus:ring-4 focus:ring-[var(--primary)]/10 transition-all font-bold text-[var(--on-surface)]"
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-black uppercase tracking-widest text-[var(--on-surface-variant)] ml-1">Event Type</label>
                  <div className="flex flex-wrap gap-2">
                    {['general', 'class', 'social', 'milonga', 'practice'].map((type) => (
                      <button
                        key={type}
                        onClick={() => setFormData({...formData, type: type as any})}
                        className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                          formData.type === type 
                            ? 'bg-[var(--primary)] text-white shadow-lg shadow-[var(--primary)]/20 scale-105' 
                            : 'bg-[var(--surface-container-low)] text-[var(--on-surface-variant)] hover:bg-[var(--surface-container-high)]'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-black uppercase tracking-widest text-[var(--on-surface-variant)] ml-1">Description</label>
                  <textarea 
                    rows={3}
                    placeholder="?곸꽭 ?댁슜???낅젰?섏꽭??.."
                    className="w-full px-6 py-4 bg-[var(--surface-container-low)] rounded-2xl border-none focus:ring-4 focus:ring-[var(--primary)]/10 transition-all font-medium text-[var(--on-surface)] resize-none"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                  />
                </div>
              </div>

              <div className="p-8 bg-gray-50/50">
                <button 
                  onClick={handleSaveEvent}
                  disabled={!formData.title}
                  className="w-full py-5 bg-gradient-to-br from-[var(--primary)] to-[var(--primary-container)] text-white font-black uppercase tracking-widest rounded-3xl shadow-2xl shadow-[var(--primary)]/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100"
                >
                  {editingEvent ? '변경사항 저장' : '일정 추가하기'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <GroupFooter communityName={group.name} />
    </div>
  );
};

export default GroupCalendar;

