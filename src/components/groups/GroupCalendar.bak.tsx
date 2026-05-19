"use client";

import React, { useState, useEffect } from 'react';
import { 
  addMonths, subMonths, startOfMonth, endOfMonth, 
  startOfWeek, endOfWeek, isSameMonth, isSameDay, addDays, 
  startOfDay, isToday, parseISO, format
} from 'date-fns';
import { groupService } from '@/lib/firebase/groupService';
import { eventService } from '@/lib/firebase/eventService';
import { socialService } from '@/lib/firebase/socialService';
import { CalendarEvent, Group, GroupClass } from '@/types/group';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';


interface GroupCalendarProps {
  group: Group;
}

type ViewMode = 'day' | 'week' | 'month';

const GroupCalendar: React.FC<GroupCalendarProps> = ({ group }) => {
  const { t, formatDate } = useLanguage();
  const [viewMode, setViewMode] = useState<ViewMode>('day');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  const [groupCalendarEvents, setGroupCalendarEvents] = useState<CalendarEvent[]>([]);
  const [socialEvents, setSocialEvents] = useState<CalendarEvent[]>([]);
  const [subClasses, setSubClasses] = useState<GroupClass[]>([]);

  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);

  const handleFormClose = () => setIsFormOpen(false); // Replaced useHistoryBack
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: formatDate(new Date(), 'iso'),
    startTime: '19:00',
    endDate: formatDate(new Date(), 'iso'),
    endTime: '21:00',
    type: 'general' as CalendarEvent['type'],
  });

  useEffect(() => {
    if (!group.id) return;
    const unsubscribe = groupService.subscribeCalendarEvents(group.id, (fetchedEvents) => {
      setGroupCalendarEvents(fetchedEvents);
    });
    return () => unsubscribe();
  }, [group.id]);

  useEffect(() => {
    if (!group.id) return;
    const unsubscribe = groupService.subscribeClasses(group.id, (fetchedClasses) => {
      setSubClasses(fetchedClasses);
    });
    return () => unsubscribe();
  }, [group.id]);

  useEffect(() => {
    if (!group.venueId) return;
    const unsubscribe = socialService.subscribeSocialsByVenue(group.venueId, (fetchedSocials) => {
      const socialAsCalendarEvents: CalendarEvent[] = [];
      
      const now = new Date();
      const startOfWindow = subMonths(now, 2);
      const endOfWindow = addMonths(now, 6);

      fetchedSocials.forEach(s => {
        if (s.type === 'regular' && s.dayOfWeek !== undefined) {
          let d = startOfDay(new Date(startOfWindow));
          while (d.getDay() !== Number(s.dayOfWeek)) {
            d = addDays(d, 1);
          }
          while (d <= endOfWindow) {
            socialAsCalendarEvents.push({
              id: `social-${s.id}-${format(d, 'yyyy-MM-dd')}`,
              title: s.title,
              description: s.description || '',
              startDate: d.getTime(),
              startTime: s.startTime || '',
              endTime: s.endTime || '',
              type: s.title.toLowerCase().includes('milonga') || s.title.toLowerCase().includes('밀롱가') ? 'milonga' : 'social',
              createdBy: 'system',
              createdAt: s.createdAt?.toMillis ? s.createdAt.toMillis() : Date.now()
            });
            d = addDays(d, 7);
          }
        } else if (s.type === 'popup' && s.date) {
          const sDate = typeof s.date.toDate === 'function' ? s.date.toDate() : new Date(s.date as any);
          socialAsCalendarEvents.push({
            id: `social-${s.id}`,
            title: s.title,
            description: s.description || '',
            startDate: sDate.getTime(),
            startTime: s.startTime || '',
            endTime: s.endTime || '',
            type: s.title.toLowerCase().includes('milonga') || s.title.toLowerCase().includes('밀롱가') ? 'milonga' : 'social',
            createdBy: 'system',
            createdAt: s.createdAt?.toMillis ? s.createdAt.toMillis() : Date.now()
          });
        }
      });
      setSocialEvents(socialAsCalendarEvents);
    });
    return () => unsubscribe();
  }, [group.venueId]);

  const classEvents: CalendarEvent[] = React.useMemo(() => {
    const allClasses = [...(group.classes || []), ...subClasses];
    const uniqueClasses = Array.from(new Map(allClasses.map(c => [c.id, c])).values());

    return uniqueClasses.flatMap(cls => 
      (cls.schedule || []).map((sch, idx) => {
        let st = cls.startTime || '';
        let et = cls.endTime || '';
        if (sch.timeSlot) {
          const parts = sch.timeSlot.split('-');
          if (parts.length === 2) {
            st = parts[0].trim();
            et = parts[1].trim();
          } else {
            st = sch.timeSlot.trim();
          }
        }
        
        // Use parseISO to correctly parse YYYY-MM-DD into local midnight, preventing timezone shift
        const parsedDate = sch.date ? parseISO(sch.date) : new Date();
        
        let desc = sch.content || cls.description || '';
        if (cls.instructors && cls.instructors.length > 0) {
          const instNames = cls.instructors.map(i => i.name).join(', ');
          desc = `${t('calendar.instructor') || 'Instructor'}: ${instNames}\n${desc}`;
        }
        if (cls.level) {
          desc = `${t('calendar.level') || 'Level'}: ${cls.level}\n${desc}`;
        }
        
        return {
          id: `class-${cls.id}-${idx}`,
          title: cls.title,
          description: desc.trim(),
          startDate: parsedDate.getTime(),
          startTime: st,
          endTime: et,
          type: 'class',
          createdBy: 'system',
          createdAt: Date.now()
        };
      })
    );
  }, [group.classes, subClasses]);

  const events = [...groupCalendarEvents, ...socialEvents, ...classEvents];

  // Month nav
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  // Week nav
  const nextWeek = () => setCurrentWeekStart(addDays(currentWeekStart, 7));
  const prevWeek = () => setCurrentWeekStart(addDays(currentWeekStart, -7));

  const handleNext = () => {
    if (viewMode === 'week') nextWeek();
    else nextMonth();
  };

  const handlePrev = () => {
    if (viewMode === 'week') prevWeek();
    else prevMonth();
  };

  const handleOpenForm = (event?: CalendarEvent) => {
    if (event) {
      setEditingEvent(event);
      const eventDate = new Date(event.startDate);
      setFormData({
        title: event.title, description: event.description || '',
        startDate: formatDate(eventDate, 'iso'), startTime: event.startTime || '19:00',
        endDate: formatDate(eventDate, 'iso'), endTime: event.endTime || '21:00',
        type: event.type,
      });
    } else {
      setEditingEvent(null);
      setFormData({
        title: '', description: '',
        startDate: formatDate(selectedDate, 'iso'), startTime: '19:00',
        endDate: formatDate(selectedDate, 'iso'), endTime: '21:00',
        type: 'general',
      });
    }
    setIsFormOpen(true);
  };

  const handleSaveEvent = async () => {
    if (!formData.title) return;
    setIsSaving(true);
    try {
      const startDateParsed = parseISO(formData.startDate);
      const endDateParsed = parseISO(formData.endDate);
      const eventPayload = {
        title: formData.title, 
        description: formData.description,
        startDate: startOfDay(startDateParsed).getTime(),
        endDate: startOfDay(endDateParsed).getTime(),
        startTime: formData.startTime, 
        endTime: formData.endTime,
        type: formData.type, 
        createdBy: 'user',
      };
      if (editingEvent) {
        await groupService.updateCalendarEvent(group.id, editingEvent.id, eventPayload);
        toast.success(t('calendar.scheduleUpdatedSuccessfully') || "Schedule updated successfully.");
      } else {
        await groupService.addCalendarEvent(group.id, eventPayload);
        toast.success(t('calendar.scheduleAddedSuccessfully') || "Schedule added successfully.");
      }
      handleFormClose();
    } catch (error: any) { 
      console.error("Error saving event:", error);
      if (error.code === 'permission-denied') {
        toast.error(t('calendar.permissionDenied') || "Permission denied. Check Firestore security rules.");
      } else {
        toast.error(t('calendar.failedToSaveSchedule') || "Failed to save schedule.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!window.confirm(t('calendar.confirmDeleteEvent') || "Are you sure you want to delete this event?")) return;
    try { 
      await groupService.deleteCalendarEvent(group.id, eventId);
      toast.success(t('calendar.scheduleDeletedSuccessfully') || "Schedule deleted successfully.");
    }
    catch (error) { 
      console.error("Error deleting event:", error);
      toast.error(t('calendar.failedToDeleteSchedule') || "Failed to delete schedule.");
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = { 'class': t('calendar.classLabel') || 'Class', 'milonga': t('calendar.milongaLabel') || 'Milonga', 'social': t('calendar.socialLabel') || 'Social', 'practice': t('calendar.practiceLabel') || 'Practice', 'general': t('calendar.generalLabel') || 'General', 'gen': t('calendar.generalLabel') || 'General', 'rental': t('calendar.rentalLabel') || 'Rental' };
    if (labels[type]) return labels[type];
    
    // dynamic fallback for unknown types
    const dynamicKey = `calendar.${type}Label`;
    const dynamicTranslation = t(dynamicKey);
    return dynamicTranslation !== dynamicKey ? dynamicTranslation : (t('calendar.eventLabel') || 'Event');
  };

  const getTypeBadgeClass = (type: string) => {
    switch(type) {
      case 'class': return 'bg-[#ba1a1a]/10 text-[#ba1a1a]';
      case 'social': return 'bg-[#004190]/10 text-[#004190]';
      case 'milonga': return 'bg-[#004190]/10 text-[#004190]';
      case 'practice': return 'bg-[#ba1a1a]/10 text-[#ba1a1a]';
      case 'rental': return 'bg-[#765b00]/10 text-[#765b00]';
      default: return 'bg-slate-200 text-slate-600';
    }
  };

  const getTypeDotClass = (type: string) => {
    switch(type) {
      case 'class': case 'practice': return 'bg-[#ba1a1a]';
      case 'social': case 'milonga': return 'bg-[#004190]';
      default: return 'bg-[#765b00]';
    }
  };

  const formatTime = (time: string) => {
    if (!time) return '';
    try {
      const d = new Date(`2000-01-01T${time}`);
      return formatDate(d, 'timeOnly');
    } catch {
      return time;
    }
  };

  const selectedDayEvents = events.filter(e => isSameDay(new Date(e.startDate), selectedDate));
  selectedDayEvents.sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));

  // Build week days
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));
  const weekEnd = addDays(currentWeekStart, 6);
  const weekHeaderText = isSameMonth(currentWeekStart, weekEnd)
    ? `${formatDate(currentWeekStart, 'shortMonthDay')} - ${formatDate(weekEnd, 'dayOnly')}`
    : `${formatDate(currentWeekStart, 'shortMonthDay')} - ${formatDate(weekEnd, 'shortMonthDay')}`;

  // Build month-view weekly groupings
  const monthViewEvents = events
    .filter(e => isSameMonth(new Date(e.startDate), currentMonth))
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  const weekGroups: Record<number, CalendarEvent[]> = {};
  monthViewEvents.forEach(e => {
    const wn = Math.ceil(new Date(e.startDate).getDate() / 7);
    if (!weekGroups[wn]) weekGroups[wn] = [];
    weekGroups[wn].push(e);
  });
  const maxWeek = Math.ceil(endOfMonth(currentMonth).getDate() / 7);

  // Build calendar grid days (week starts Monday)
  const monthStartGrid = startOfMonth(currentMonth);
  const monthEndGrid = endOfMonth(monthStartGrid);
  const startDateGrid = startOfWeek(monthStartGrid, { weekStartsOn: 1 });
  const endDateGrid = endOfWeek(monthEndGrid, { weekStartsOn: 1 });

  const calendarDays = [];
  let dayGrid = startDateGrid;
  while (dayGrid <= endDateGrid) {
    calendarDays.push(dayGrid);
    dayGrid = addDays(dayGrid, 1);
  }

  // ============================================================
  // FORM VIEW (Design 2: Schedule Register)
  // ============================================================
  if (isFormOpen) {
    return (
      <div className="fixed inset-0 z-[100] bg-surface text-on-surface flex flex-col">
        <header className="flex items-center gap-4 px-6 md:px-8 py-4 w-full h-16 bg-surface border-b border-outline/10 sticky top-0 z-50 transition-colors duration-200 ease-in-out">
          <button onClick={handleFormClose} className="flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high/50 w-10 h-10 rounded-full transition-colors">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h1 className="font-headline-md text-headline-md font-extrabold text-on-surface flex-grow">{t('calendar.scheduleRegister') || "Schedule Register"}</h1>
          <button onClick={handleSaveEvent} disabled={!formData.title || isSaving} className="bg-primary text-on-primary font-label-md text-label-md hover:opacity-90 px-6 py-2 rounded-full transition-all shadow-sm active:scale-95 disabled:opacity-50">
            {isSaving ? (t('calendar.saving') || "Saving...") : (t('calendar.save') || "Save")}
          </button>
        </header>
        <main className="flex-grow w-full px-6 md:px-8 flex flex-col gap-6 overflow-y-auto pt-4">
          <form className="flex flex-col gap-6 bg-surface-container-lowest p-6 rounded-xl border border-outline/10" onSubmit={(e) => e.preventDefault()}>
            <div className="flex flex-col gap-2">
              <label className="sr-only" htmlFor="title">{t('calendar.title') || "Title"}</label>
              <input autoFocus className="w-full border-none focus:ring-0 bg-transparent font-headline-lg text-headline-lg placeholder:text-outline-variant text-on-surface px-0 border-b border-outline/10 focus:border-b-primary rounded-none transition-colors py-4" id="title" placeholder={t('calendar.eventTitle') || "Event Title"} type="text" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} />
            </div>
            <div className="flex flex-col gap-4">
              <span className="font-label-md text-label-md text-on-surface-variant">{t('calendar.category') || "Category"}</span>
              <div className="flex flex-wrap gap-4">
                {['class', 'social', 'rental', 'general'].map((type) => (
                  <button key={type} type="button" onClick={() => setFormData({...formData, type: type as CalendarEvent['type']})}
                    className={`px-4 py-2 rounded-[24px] font-label-md text-label-md transition-colors ${formData.type === type ? 'bg-tertiary/10 text-on-tertiary-fixed border border-tertiary/20 hover:bg-tertiary/20' : 'bg-surface-container-high text-on-surface-variant border border-outline/10 hover:bg-surface-container-highest'}`}>
                    {getTypeLabel(type)}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="font-label-sm text-label-sm text-on-surface-variant" htmlFor="start-date">{t('calendar.startsLabel') || "Starts"}</label>
                  <div className="flex gap-2 w-full">
                    <input className="w-full flex-[3] rounded border border-outline/20 bg-surface focus:border-primary focus:ring-1 focus:ring-primary font-body-md text-body-md text-on-surface py-3 px-3 min-w-0" id="start-date" type="date" value={formData.startDate} onChange={(e) => setFormData({...formData, startDate: e.target.value})} />
                    <input className="w-full flex-[2] rounded border border-outline/20 bg-surface focus:border-primary focus:ring-1 focus:ring-primary font-body-md text-body-md text-on-surface py-3 px-2 min-w-0" id="start-time" type="time" value={formData.startTime} onChange={(e) => {
                      const newStartTime = e.target.value;
                      let newEndTime = formData.endTime;
                      if (newStartTime) {
                        const [h, m] = newStartTime.split(':').map(Number);
                        const endH = (h + 1) % 24;
                        newEndTime = `${endH.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
                      }
                      setFormData({...formData, startTime: newStartTime, endTime: newEndTime});
                    }} />
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="font-label-sm text-label-sm text-on-surface-variant" htmlFor="end-date">{t('calendar.endsLabel') || "Ends"}</label>
                  <div className="flex gap-2 w-full">
                    <input className="w-full flex-[3] rounded border border-outline/20 bg-surface focus:border-primary focus:ring-1 focus:ring-primary font-body-md text-body-md text-on-surface py-3 px-3 min-w-0" id="end-date" type="date" value={formData.endDate} onChange={(e) => setFormData({...formData, endDate: e.target.value})} />
                    <input className="w-full flex-[2] rounded border border-outline/20 bg-surface focus:border-primary focus:ring-1 focus:ring-primary font-body-md text-body-md text-on-surface py-3 px-2 min-w-0" id="end-time" type="time" value={formData.endTime} onChange={(e) => setFormData({...formData, endTime: e.target.value})} />
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <label className="font-label-sm text-label-sm text-on-surface-variant" htmlFor="description">{t('calendar.descriptionLabel') || "Description"}</label>
              <textarea className="w-full rounded border border-outline/20 bg-surface focus:border-primary focus:ring-1 focus:ring-primary font-body-md text-body-md text-on-surface py-3 px-4 resize-none" id="description" placeholder={t('calendar.addDetailsPlaceholder') || "Add details..."} rows={4} value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} />
            </div>
          </form>
        </main>
      </div>
    );
  }

  // ============================================================
  // UNIFIED VIEW RENDERING
  // ============================================================
  return (
    <div className="max-w-[600px] mx-auto w-full pb-20 bg-background min-h-screen">
      {/* 1. Header: Tabs + Add Button */}
      <div className="flex justify-between items-end px-4 pt-4 mb-6 border-b border-slate-200">
        {/* Sub-navigation Tabs */}
        <div className="flex gap-6">
          {(['day', 'week', 'month'] as ViewMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`pb-3 text-sm font-bold transition-all border-b-2 -mb-[1px] ${
                viewMode === mode
                  ? "text-[#0057bd] border-[#0057bd]"
                  : "text-slate-400 border-transparent hover:text-slate-600"
              }`}
            >
              {mode === 'day' ? (t('common.dayLabel') || 'Day') : mode === 'week' ? (t('common.weekLabel') || 'Week') : (t('common.monthLabel') || 'Month')}
            </button>
          ))}
        </div>

        {/* Add Event Button (Simplified Shop style) */}
        <button 
          onClick={() => handleOpenForm()} 
          className="bg-[#0057bd] text-white font-['Plus_Jakarta_Sans'] font-bold py-1.5 px-3 rounded-lg shadow-sm shadow-[#0057bd]/20 flex items-center justify-center gap-1.5 hover:bg-[#004ca6] transition-colors active:scale-[0.99] text-xs mb-2"
        >
          <span className="material-symbols-outlined text-[14px]">add</span>
          {t('calendar.addSchedule') || 'Add Schedule'}
        </button>
      </div>

      {/* 2. Unified Calendar Navigation – week/month only */}
      {viewMode !== 'day' && (
        <div className="flex justify-center items-center gap-6 mb-6 px-4">
          <button onClick={handlePrev} className="w-8 h-8 rounded-full hover:bg-slate-200/80 transition-colors text-slate-500 flex items-center justify-center active:scale-95">
            <span className="material-symbols-outlined text-[20px]">chevron_left</span>
          </button>
          <h2 className="text-lg font-bold text-[#242c51] min-w-[150px] text-center tracking-tight">
            {viewMode === 'week' ? weekHeaderText : formatDate(currentMonth, 'monthYear')}
          </h2>
          <button onClick={handleNext} className="w-8 h-8 rounded-full hover:bg-slate-200/80 transition-colors text-slate-500 flex items-center justify-center active:scale-95">
            <span className="material-symbols-outlined text-[20px]">chevron_right</span>
          </button>
        </div>
      )}

      {/* 3. View Content Rendering */}
      
      {viewMode === 'week' && (
        <div className="grid grid-cols-1 gap-y-3 px-4">
          {weekDays.map((wd, idx) => {
            const dayName = formatDate(wd, 'shortWeekday');
            const dayNum = formatDate(wd, 'dayOnly');
            const isTodayDate = isToday(wd);
            const dayEvents = events
              .filter(e => isSameDay(new Date(e.startDate), wd))
              .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));

            return (
              <div key={idx} className="flex flex-col gap-4">
                {/* Day Header */}
                <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                  <span className={`font-bold text-lg ${isTodayDate ? 'text-[#0057bd]' : 'text-[#242c51]'}`}>{dayNum}</span>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{dayName}</span>
                </div>

                {/* Events */}
                {dayEvents.length > 0 ? (
                  <div className="flex flex-col gap-3">
                    {dayEvents.map((event) => (
                      <div key={event.id}
                        onClick={() => { setSelectedDate(wd); setCurrentMonth(startOfMonth(wd)); setViewMode('day'); }}
                        className={`bg-white p-3 rounded-xl cursor-pointer ${isTodayDate ? 'border border-[#0057bd]/30 shadow-sm relative overflow-hidden' : 'border border-slate-100 shadow-sm hover:shadow-md transition-shadow'}`}>
                        {isTodayDate && <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#0057bd]"></div>}
                        <div className={`flex items-center gap-2 mb-1 ${isTodayDate ? 'pl-2' : ''}`}>
                          <span className={`w-2 h-2 rounded-full ${getTypeDotClass(event.type)}`}></span>
                          <span className="text-xs font-bold text-slate-500">{event.startTime ? formatTime(event.startTime) : ''}</span>
                        </div>
                        <p className={`text-sm font-bold text-[#242c51] ${isTodayDate ? 'pl-2' : ''}`}>{event.title}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex gap-3 justify-center items-center py-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    <span className="material-symbols-outlined text-[20px] text-slate-300">bedtime</span>
                    <span className="text-xs font-bold text-slate-400">{t('calendar.noEvents') || 'No Events'}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {viewMode === 'month' && (
        <div className="flex flex-col gap-6 px-4">
          {Array.from({ length: maxWeek }, (_, i) => i + 1).map(wn => {
            const wEvents = weekGroups[wn] || [];
            return (
              <section key={wn} className="flex flex-col gap-3">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200 pb-2">{t('common.weekLabel') || 'Week'} {wn}</h3>
                <div className="flex flex-col gap-3">
                  {wEvents.length > 0 ? wEvents.map(event => {
                    const ed = new Date(event.startDate);
                    return (
                      <div key={event.id} onClick={() => { setSelectedDate(ed); setCurrentMonth(startOfMonth(ed)); setViewMode('day'); }} className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm flex gap-4 items-center hover:shadow-md transition-shadow cursor-pointer">
                        <div className="flex flex-col items-center justify-center min-w-[50px] border-r border-slate-100 pr-4">
                          <span className="text-[10px] font-bold text-slate-400 uppercase">{formatDate(ed, 'shortMonth')}</span>
                          <span className="text-xl font-extrabold text-[#242c51]">{formatDate(ed, 'dayOnly')}</span>
                        </div>
                        <div className="flex-1 flex flex-col gap-1.5">
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${getTypeDotClass(event.type)}`}></span>
                            <span className="text-sm font-bold text-[#242c51]">{event.title}</span>
                          </div>
                          <div className="flex items-center gap-1 text-slate-500">
                            <span className="material-symbols-outlined text-[14px]">schedule</span>
                            <span className="text-xs font-medium">{event.startTime || ''}{event.endTime ? ` - ${event.endTime}` : ''}</span>
                          </div>
                        </div>
                      </div>
                    );
                  }) : (
                    <div className="flex gap-3 justify-center items-center py-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                      <span className="text-xs font-bold text-slate-400">{t('calendar.noEventsThisWeek') || 'No events this week'}</span>
                    </div>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {viewMode === 'day' && (
        <section className="px-4 flex flex-col gap-4">
          {/* Calendar Grid */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-3 pt-2 pb-2">
            {/* Month navigator inside calendar */}
            <div className="flex justify-center items-center gap-4 mb-1 py-1">
              <button onClick={handlePrev} className="w-7 h-7 rounded-full hover:bg-slate-100 transition-colors text-slate-500 flex items-center justify-center active:scale-95">
                <span className="material-symbols-outlined text-[18px]">chevron_left</span>
              </button>
              <h2 className="text-[13px] font-bold text-[#242c51] min-w-[110px] text-center tracking-tight">
                {formatDate(currentMonth, 'monthYear')}
              </h2>
              <button onClick={handleNext} className="w-7 h-7 rounded-full hover:bg-slate-100 transition-colors text-slate-500 flex items-center justify-center active:scale-95">
                <span className="material-symbols-outlined text-[18px]">chevron_right</span>
              </button>
            </div>
            {/* Days of week header: Mon–Sun */}
            <div className="grid grid-cols-7 mb-1">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d, i) => (
                <div key={d} className={`text-center text-[9px] font-bold py-0.5 uppercase ${i >= 5 ? 'text-red-400' : 'text-slate-400'}`}>{d}</div>
              ))}
            </div>
            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-y-1 gap-x-0.5">
              {calendarDays.map((d, i) => {
                const isCurrentMonth = isSameMonth(d, currentMonth);
                const isSelected = isSameDay(d, selectedDate);
                const isTodayDate = isToday(d);
                const dayEvents = events.filter(e => isSameDay(new Date(e.startDate), d));
                // col index 0=Mon…5=Sat,6=Sun
                const colIdx = i % 7;
                const isWeekend = colIdx === 5 || colIdx === 6;
                const textColor = !isCurrentMonth ? 'text-slate-300'
                  : isSelected ? 'text-white'
                  : isTodayDate ? 'text-[#0057bd]'
                  : isWeekend ? 'text-red-500'
                  : 'text-[#242c51]';

                return (
                  <div key={i} className="flex justify-center">
                    <div
                      onClick={() => {
                        setSelectedDate(d);
                        if (!isCurrentMonth) setCurrentMonth(startOfMonth(d));
                      }}
                      className={`w-9 h-9 flex flex-col items-center justify-center relative rounded-full cursor-pointer transition-colors ${isSelected ? 'bg-[#0057bd] shadow-md' : isTodayDate ? 'bg-slate-100' : 'hover:bg-slate-50'} ${textColor}`}
                    >
                      <span className={`text-[12px] ${isSelected || isTodayDate ? 'font-bold' : 'font-medium'}`}>{formatDate(d, 'dayOnly')}</span>
                      {dayEvents.length > 0 && (
                        <div className="flex gap-[2px] absolute bottom-0.5">
                          {dayEvents.slice(0, 3).map((e, ei) => (
                            <span key={ei} className={`w-[3px] h-[3px] rounded-full ${isSelected ? 'bg-white' : getTypeDotClass(e.type)}`}></span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected Date Header */}
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <h3 className="text-lg font-bold text-[#242c51]">
              {formatDate(selectedDate, 'shortMonthDay')} <span className="text-sm text-slate-400 font-medium ml-1">{formatDate(selectedDate, 'weekday')}</span>
            </h3>
          </div>

          {selectedDayEvents.length > 0 ? (
            <div className="relative border-l-2 border-slate-200 ml-4 pl-6 flex flex-col gap-8 py-2">
              {selectedDayEvents.map((event) => (
                <div key={event.id} className="relative group">
                  <div className={`absolute -left-[33px] top-1 w-4 h-4 rounded-full ${getTypeDotClass(event.type)} ring-4 ring-background`}></div>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-bold text-slate-500 min-w-[60px]">{event.startTime ? formatTime(event.startTime) : ''}</span>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wide uppercase ${getTypeBadgeClass(event.type)}`}>
                        {getTypeLabel(event.type)}
                      </span>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                      <h4 className="text-base font-bold text-[#242c51]">{event.title}</h4>
                      {event.description && (
                        <p className="text-sm font-medium text-slate-500 mt-2 whitespace-pre-wrap">
                          {event.description}
                        </p>
                      )}
                    </div>
                  </div>
                  {/* Edit/Delete Actions */}
                  {event.createdBy !== 'system' && (
                    <div className="flex gap-3 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleOpenForm(event)} className="text-xs font-bold text-[#0057bd] hover:underline">{t('calendar.edit') || 'Edit'}</button>
                      <button onClick={() => handleDeleteEvent(event.id)} className="text-xs font-bold text-red-500 hover:underline">{t('calendar.delete') || 'Delete'}</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-white rounded-xl border border-slate-100 shadow-sm mt-4">
              <span className="material-symbols-outlined text-5xl text-slate-300 mb-3 block">event_busy</span>
              <p className="text-sm font-bold text-slate-500">{t('calendar.noEventsScheduledForThisDay') || 'No events scheduled for this day'}</p>
            </div>
          )}
        </section>
      )}
    </div>
  );
};

export default GroupCalendar;
