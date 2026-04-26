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
import { AnimatePresence, motion } from 'framer-motion';
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
  const [expandedEvent, setExpandedEvent] = useState<CalendarEvent | null>(null);
  
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
    setExpandedEvent(null);
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
      createdBy: 'user',
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

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'class': 'Class',
      'milonga': 'Milonga',
      'social': 'Social',
      'practice': 'Practice',
      'general': 'Event',
    };
    return labels[type] || 'Event';
  };

  const getTypeBadgeClass = (type: string) => {
    if (type === 'class' || type === 'social' || type === 'practice') {
      return 'bg-[#f199f7]/30 text-[#5e106a]';
    }
    return 'bg-[#6e9fff]/30 text-[#002150]';
  };

  // Build calendar grid
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const calStartDate = startOfWeek(monthStart);
  const calEndDate = endOfWeek(monthEnd);

  const calendarDays: Date[] = [];
  let day = calStartDate;
  while (day <= calEndDate) {
    calendarDays.push(day);
    day = addDays(day, 1);
  }

  const selectedDayEvents = events.filter(e => isSameDay(new Date(e.startDate), selectedDate));

  return (
    <div className="pb-8">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Calendar Section */}
        <section className="flex-1 w-full bg-white rounded-xl shadow-sm p-6 relative z-10 border border-[#a3abd7]/10">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-headline font-extrabold text-2xl tracking-tight text-[#242c51]">{format(currentMonth, 'MMMM yyyy')}</h2>
            <div className="flex gap-2">
              <button onClick={prevMonth} className="p-2 rounded-full hover:bg-[#F1F5F9] transition-colors text-[#515981]">
                <span className="material-symbols-outlined">chevron_left</span>
              </button>
              <button onClick={nextMonth} className="p-2 rounded-full hover:bg-[#F1F5F9] transition-colors text-[#515981]">
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-2 mb-2 text-center">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <span key={d} className="text-[11px] font-bold uppercase tracking-wider text-[#515981] font-label">{d}</span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-2">
            {calendarDays.map((calDay, idx) => {
              const isCurrentMonth = isSameMonth(calDay, monthStart);
              const isSelected = isSameDay(calDay, selectedDate);
              const isTodayDate = isToday(calDay);
              const dayEvents = events.filter(e => isSameDay(new Date(e.startDate), calDay));

              if (!isCurrentMonth) {
                return (
                  <div key={idx} className="aspect-square flex items-center justify-center text-[#515981]/40 text-sm font-medium">
                    {format(calDay, 'd')}
                  </div>
                );
              }

              if (isSelected) {
                return (
                  <div
                    key={idx}
                    onClick={() => onDateClick(calDay)}
                    className="aspect-square flex flex-col items-center justify-center bg-[#0057bd] text-[#f0f2ff] rounded-lg shadow-md shadow-[#0057bd]/20 scale-[0.99] cursor-pointer text-sm font-bold relative"
                  >
                    {format(calDay, 'd')}
                    {dayEvents.length > 0 && (
                      <div className="w-1.5 h-1.5 bg-white rounded-full absolute bottom-2"></div>
                    )}
                  </div>
                );
              }

              return (
                <div
                  key={idx}
                  onClick={() => onDateClick(calDay)}
                  className={`aspect-square flex flex-col items-center justify-center rounded-lg hover:bg-[#F1F5F9] transition-colors cursor-pointer text-sm font-medium text-[#242c51] relative ${isTodayDate ? 'ring-2 ring-[#0057bd]/30' : ''}`}
                >
                  {format(calDay, 'd')}
                  {dayEvents.length > 0 && (
                    <div className="flex gap-1 absolute bottom-2">
                      {dayEvents.slice(0, 2).map((ev, i) => (
                        <div key={i} className="w-1 h-1 rounded-full" style={{ backgroundColor: ev.type === 'class' || ev.type === 'social' || ev.type === 'practice' ? '#893c92' : '#0057bd' }}></div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Selected Date Events */}
        <section className="w-full md:w-[400px] flex flex-col gap-4">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-[#a3abd7]/10">
            <h3 className="font-headline font-bold text-xl text-[#242c51] mb-2">{format(selectedDate, 'EEEE, MMM d')}</h3>
            <p className="text-[13px] font-medium text-[#515981] mb-6">{selectedDayEvents.length} event{selectedDayEvents.length !== 1 ? 's' : ''} scheduled</p>
            <div className="space-y-4">
              {selectedDayEvents.length > 0 ? (
                selectedDayEvents.map((event) => (
                  <div
                    key={event.id}
                    onClick={() => setExpandedEvent(expandedEvent?.id === event.id ? null : event)}
                    className="group relative bg-[#F1F5F9] rounded-lg p-4 hover:bg-[#dde1ff] transition-colors cursor-pointer border border-[#a3abd7]/5"
                  >
                    <div className={`absolute top-4 right-4 text-[10px] font-bold uppercase tracking-wider ${getTypeBadgeClass(event.type)} px-2 py-1 rounded-full font-label`}>
                      {getTypeLabel(event.type)}
                    </div>
                    <p className="text-sm font-semibold text-[#0057bd] mb-1">{event.startTime} - {event.endTime}</p>
                    <h4 className="font-headline font-bold text-lg text-[#242c51] mb-1">{event.title}</h4>
                    {event.location && (
                      <p className="text-[13px] font-medium text-[#515981] flex items-center gap-1">
                        <span className="material-symbols-outlined text-[16px]">location_on</span>
                        {event.location}
                      </p>
                    )}
                    {/* Edit/Delete on hover */}
                    <div className="absolute bottom-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleOpenModal(event); }}
                        className="p-1 text-[#515981] hover:text-[#0057bd] rounded transition-colors"
                      >
                        <span className="material-symbols-outlined text-[16px]">edit</span>
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteEvent(event.id); }}
                        className="p-1 text-[#515981] hover:text-red-500 rounded transition-colors"
                      >
                        <span className="material-symbols-outlined text-[16px]">delete</span>
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <span className="material-symbols-outlined text-4xl text-[#a3abd7]/40 mb-2 block">event_busy</span>
                  <p className="text-sm text-[#515981]">No events scheduled</p>
                </div>
              )}
            </div>
          </div>

          {/* Expanded Event Detail Card */}
          {expandedEvent && (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-[#a3abd7]/10">
              <div className="h-32 w-full bg-[#e4e7ff] relative">
                <div className="absolute inset-0 bg-gradient-to-t from-white via-white/50 to-transparent"></div>
              </div>
              <div className="p-6 pt-2 relative z-10">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="font-headline font-bold text-xl text-[#242c51]">{expandedEvent.title}</h4>
                    <p className="text-sm font-medium text-[#0057bd]">{format(selectedDate, 'MMM d')}, {expandedEvent.startTime} - {expandedEvent.endTime}</p>
                  </div>
                  <button onClick={() => setExpandedEvent(null)} className="text-[#515981] hover:text-[#242c51] transition-colors p-1">
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>
                <div className="space-y-3 mb-6">
                  {expandedEvent.location && (
                    <div className="flex items-start gap-3">
                      <span className="material-symbols-outlined text-[#515981]">location_on</span>
                      <div>
                        <p className="text-sm font-medium text-[#242c51]">{expandedEvent.location}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-[#515981]">category</span>
                    <div>
                      <p className="text-sm font-medium text-[#242c51]">{getTypeLabel(expandedEvent.type)}</p>
                    </div>
                  </div>
                  {expandedEvent.description && (
                    <div className="flex items-start gap-3">
                      <span className="material-symbols-outlined text-[#515981]">description</span>
                      <div>
                        <p className="text-sm text-[#515981]">{expandedEvent.description}</p>
                      </div>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => handleOpenModal(expandedEvent)}
                  className="w-full bg-[#0057bd] text-[#f0f2ff] font-bold text-sm uppercase tracking-wider py-3 rounded-lg shadow-md shadow-[#0057bd]/20 scale-100 active:scale-[0.98] transition-transform font-label"
                >
                  Edit Event
                </button>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* Floating Action Button */}
      <button
        onClick={() => handleOpenModal()}
        className="fixed bottom-24 right-6 md:bottom-8 md:right-8 w-14 h-14 bg-[#0057bd] text-[#f0f2ff] rounded-xl shadow-md shadow-[#0057bd]/30 flex items-center justify-center hover:bg-[#004ca6] transition-colors scale-100 active:scale-95 z-40"
      >
        <span className="material-symbols-outlined text-2xl">add</span>
      </button>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-[#242c51]/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="bg-gradient-to-br from-[#0057bd] to-[#6e9fff] px-8 py-10 text-white relative">
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="absolute top-6 right-6 p-2 hover:bg-white/20 rounded-full transition-colors"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
                <h2 className="font-headline font-extrabold text-3xl mb-2">
                  {editingEvent ? '일정 수정' : '일정 만들기'}
                </h2>
                <p className="opacity-80 font-medium">{format(selectedDate, 'EEEE, MMMM do, yyyy')}</p>
              </div>

              <div className="p-8 flex flex-col gap-6 max-h-[60vh] overflow-y-auto">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-[#515981] ml-1">Event Title</label>
                  <input 
                    autoFocus
                    placeholder="이벤트 제목을 입력하세요"
                    className="w-full px-6 py-4 bg-[#F1F5F9] rounded-xl border-none focus:ring-4 focus:ring-[#0057bd]/10 transition-all font-bold text-[#242c51]"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-[#515981] ml-1">Start Time</label>
                    <input 
                      type="time"
                      className="w-full px-6 py-4 bg-[#F1F5F9] rounded-xl border-none focus:ring-4 focus:ring-[#0057bd]/10 transition-all font-bold text-[#242c51]"
                      value={formData.startTime}
                      onChange={(e) => setFormData({...formData, startTime: e.target.value})}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-[#515981] ml-1">End Time</label>
                    <input 
                      type="time"
                      className="w-full px-6 py-4 bg-[#F1F5F9] rounded-xl border-none focus:ring-4 focus:ring-[#0057bd]/10 transition-all font-bold text-[#242c51]"
                      value={formData.endTime}
                      onChange={(e) => setFormData({...formData, endTime: e.target.value})}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-[#515981] ml-1">Location</label>
                  <input 
                    placeholder="장소를 입력하세요"
                    className="w-full px-6 py-4 bg-[#F1F5F9] rounded-xl border-none focus:ring-4 focus:ring-[#0057bd]/10 transition-all font-bold text-[#242c51]"
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-[#515981] ml-1">Event Type</label>
                  <div className="flex flex-wrap gap-2">
                    {['general', 'class', 'social', 'milonga', 'practice'].map((type) => (
                      <button
                        key={type}
                        onClick={() => setFormData({...formData, type: type as CalendarEvent['type']})}
                        className={`px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
                          formData.type === type 
                            ? 'bg-[#0057bd] text-white shadow-lg shadow-[#0057bd]/20 scale-105' 
                            : 'bg-[#F1F5F9] text-[#515981] hover:bg-[#dde1ff]'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-[#515981] ml-1">Description</label>
                  <textarea 
                    rows={3}
                    placeholder="상세 내용을 입력하세요..."
                    className="w-full px-6 py-4 bg-[#F1F5F9] rounded-xl border-none focus:ring-4 focus:ring-[#0057bd]/10 transition-all font-medium text-[#242c51] resize-none"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                  />
                </div>
              </div>

              <div className="p-8 bg-gray-50/50">
                <button 
                  onClick={handleSaveEvent}
                  disabled={!formData.title}
                  className="w-full py-4 bg-gradient-to-br from-[#0057bd] to-[#6e9fff] text-white font-bold uppercase tracking-widest rounded-xl shadow-2xl shadow-[#0057bd]/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100"
                >
                  {editingEvent ? '변경사항 저장' : '일정 추가하기'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GroupCalendar;
