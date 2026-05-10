"use client";

import React, { useState, useEffect } from 'react';
import { 
  format, addMonths, subMonths, startOfMonth, endOfMonth, 
  startOfWeek, endOfWeek, isSameMonth, isSameDay, addDays, 
  startOfDay, isToday, parseISO
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
  const { t } = useLanguage();
  const [viewMode, setViewMode] = useState<ViewMode>('day');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date()));
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  const [groupCalendarEvents, setGroupCalendarEvents] = useState<CalendarEvent[]>([]);
  const [socialEvents, setSocialEvents] = useState<CalendarEvent[]>([]);
  const [subClasses, setSubClasses] = useState<GroupClass[]>([]);

  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: format(new Date(), 'yyyy-MM-dd'),
    startTime: '19:00',
    endDate: format(new Date(), 'yyyy-MM-dd'),
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

  const onDateClick = (day: Date) => { setSelectedDate(day); };

  const handleOpenForm = (event?: CalendarEvent) => {
    if (event) {
      setEditingEvent(event);
      const eventDate = new Date(event.startDate);
      setFormData({
        title: event.title, description: event.description || '',
        startDate: format(eventDate, 'yyyy-MM-dd'), startTime: event.startTime || '19:00',
        endDate: format(eventDate, 'yyyy-MM-dd'), endTime: event.endTime || '21:00',
        type: event.type,
      });
    } else {
      setEditingEvent(null);
      setFormData({
        title: '', description: '',
        startDate: format(selectedDate, 'yyyy-MM-dd'), startTime: '19:00',
        endDate: format(selectedDate, 'yyyy-MM-dd'), endTime: '21:00',
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
      setIsFormOpen(false);
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
      case 'class': return 'bg-tertiary-container text-on-tertiary-container';
      case 'social': return 'bg-secondary-container text-on-secondary-container';
      case 'milonga': return 'bg-primary-container text-on-primary-container';
      case 'practice': return 'bg-surface-tint text-on-primary';
      case 'rental': return 'bg-tertiary-fixed text-on-tertiary-fixed';
      default: return 'bg-surface-variant text-on-surface-variant';
    }
  };

  const getTypeDotClass = (type: string) => {
    switch(type) {
      case 'class': return 'bg-tertiary';
      case 'social': return 'bg-secondary';
      case 'milonga': return 'bg-primary';
      case 'practice': return 'bg-primary-container';
      case 'rental': return 'bg-tertiary-fixed-dim';
      default: return 'bg-outline';
    }
  };

  // event-red=#ba1a1a (Class), event-blue=#004190 (Social/Milonga), event-yellow=#765b00 (General/etc)
  const getWeekDotClass = (type: string) => {
    switch(type) {
      case 'class': case 'practice': return 'bg-[#ba1a1a]';
      case 'social': case 'milonga': return 'bg-[#004190]';
      default: return 'bg-[#765b00]';
    }
  };

  // Month view dot: bg-error(class), bg-primary-container(social/milonga), bg-tertiary-container(practice/general)
  const getMonthDotClass = (type: string) => {
    switch(type) {
      case 'class': return 'bg-error';
      case 'social': case 'milonga': return 'bg-primary-container';
      default: return 'bg-tertiary-container';
    }
  };

  const formatTime12h = (time: string) => {
    const [h, m] = time.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 || 12;
    return `${hour12}:${m.toString().padStart(2, '0')} ${ampm}`;
  };

  // Build day-view calendar grid
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const calStartDate = startOfWeek(monthStart);
  const calEndDate = endOfWeek(monthEnd);
  const calendarDays: Date[] = [];
  let day = calStartDate;
  while (day <= calEndDate) { calendarDays.push(day); day = addDays(day, 1); }

  const selectedDayEvents = events.filter(e => isSameDay(new Date(e.startDate), selectedDate));
  selectedDayEvents.sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));

  // Build week days
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));
  const weekEnd = addDays(currentWeekStart, 6);
  const weekHeaderText = isSameMonth(currentWeekStart, weekEnd)
    ? `${format(currentWeekStart, 'MMM d')} - ${format(weekEnd, 'd')}`
    : `${format(currentWeekStart, 'MMM d')} - ${format(weekEnd, 'MMM d')}`;

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

  // ============================================================
  // FORM VIEW (Design 2: Schedule Register)
  // ============================================================
  if (isFormOpen) {
    return (
      <div className="fixed inset-0 z-[100] bg-surface text-on-surface flex flex-col">
        <header className="flex items-center gap-4 px-6 md:px-8 py-4 w-full h-16 bg-surface border-b border-outline/10 sticky top-0 z-50 transition-colors duration-200 ease-in-out">
          <button onClick={() => setIsFormOpen(false)} className="flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high/50 w-10 h-10 rounded-full transition-colors">
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
                  <div className="flex gap-2">
                    <input className="flex-grow rounded border border-outline/20 bg-surface focus:border-primary focus:ring-1 focus:ring-primary font-body-md text-body-md text-on-surface py-3 px-4" id="start-date" type="date" value={formData.startDate} onChange={(e) => setFormData({...formData, startDate: e.target.value})} />
                    <input className="w-1/3 rounded border border-outline/20 bg-surface focus:border-primary focus:ring-1 focus:ring-primary font-body-md text-body-md text-on-surface py-3 px-4" id="start-time" type="time" value={formData.startTime} onChange={(e) => setFormData({...formData, startTime: e.target.value})} />
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="font-label-sm text-label-sm text-on-surface-variant" htmlFor="end-date">{t('calendar.endsLabel') || "Ends"}</label>
                  <div className="flex gap-2">
                    <input className="flex-grow rounded border border-outline/20 bg-surface focus:border-primary focus:ring-1 focus:ring-primary font-body-md text-body-md text-on-surface py-3 px-4" id="end-date" type="date" value={formData.endDate} onChange={(e) => setFormData({...formData, endDate: e.target.value})} />
                    <input className="w-1/3 rounded border border-outline/20 bg-surface focus:border-primary focus:ring-1 focus:ring-primary font-body-md text-body-md text-on-surface py-3 px-4" id="end-time" type="time" value={formData.endTime} onChange={(e) => setFormData({...formData, endTime: e.target.value})} />
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
  // WEEK VIEW (Design from aiantigravity.txt)
  // ============================================================
  if (viewMode === 'week') {
    return (
      <div className="max-w-7xl mx-auto w-full pb-20">
        {/* View Toggle Filter */}
        <section className="mb-2 flex justify-center mt-2">
          <div className="flex bg-surface-container-high/30 rounded-full p-1 items-center gap-1 inline-flex">
            <button onClick={() => setViewMode('day')} className="px-4 py-1.5 rounded-full text-on-surface-variant bg-transparent hover:bg-surface-container-high/50 font-label-md text-label-md transition-all">{t('common.dayLabel') || 'Day'}</button>
            <button className="px-4 py-1.5 rounded-full bg-primary text-on-primary font-label-md text-label-md shadow-sm transition-all">{t('common.weekLabel') || 'Week'}</button>
            <button onClick={() => setViewMode('month')} className="px-4 py-1.5 rounded-full text-on-surface-variant bg-transparent hover:bg-surface-container-high/50 font-label-md text-label-md transition-all">{t('common.monthLabel') || 'Month'}</button>
          </div>
        </section>

        {/* Current Week Header */}
        <header className="mb-3 px-3 flex items-center justify-between">
          <h1 className="font-title-md text-title-md font-bold text-on-surface">{weekHeaderText}</h1>
          <div className="flex gap-2">
            <button onClick={prevWeek} className="w-8 h-8 flex items-center justify-center rounded-full bg-transparent hover:bg-surface-container-highest/10 transition-colors">
              <span className="material-symbols-outlined text-on-surface text-[20px]">chevron_left</span>
            </button>
            <button onClick={nextWeek} className="w-8 h-8 flex items-center justify-center rounded-full bg-transparent hover:bg-surface-container-highest/10 transition-colors">
              <span className="material-symbols-outlined text-on-surface text-[20px]">chevron_right</span>
            </button>
          </div>
        </header>

        {/* Week Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-7 gap-y-3 px-3">
          {weekDays.map((wd, idx) => {
            const dayName = format(wd, 'EEE');
            const dayNum = format(wd, 'd');
            const isTodayDate = isToday(wd);
            const dayEvents = events
              .filter(e => isSameDay(new Date(e.startDate), wd))
              .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));

            return (
              <div key={idx} className="flex flex-col gap-4">
                {/* Day Header */}
                <div className="flex flex-col items-center md:items-start border-b border-outline/10 pb-2">
                  <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">{dayName}</span>
                  <span className={`font-title-lg text-title-lg ${isTodayDate ? 'text-primary' : 'text-on-surface'}`}>{dayNum}</span>
                </div>

                {/* Events */}
                {dayEvents.length > 0 ? (
                  <div className="flex flex-col gap-3">
                    {dayEvents.map((event) => (
                      <div key={event.id}
                        onClick={() => { setSelectedDate(wd); setViewMode('month'); }}
                        className={`bg-surface-container-lowest p-3 rounded-lg cursor-pointer ${isTodayDate ? 'border border-primary/30 shadow-sm relative overflow-hidden' : 'border border-outline/10 hover:shadow-sm transition-shadow'}`}>
                        {isTodayDate && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary"></div>}
                        <div className={`flex items-center gap-2 mb-1 ${isTodayDate ? 'pl-2' : ''}`}>
                          <span className={`w-2 h-2 rounded-full ${getWeekDotClass(event.type)}`}></span>
                          <span className="font-label-sm text-label-sm text-on-surface-variant">{event.startTime ? formatTime12h(event.startTime) : ''}</span>
                        </div>
                        <p className={`font-label-md text-label-md text-on-surface ${isTodayDate ? 'pl-2' : ''}`}>{event.title}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col gap-3 justify-center items-center h-full text-on-surface-variant/50 pt-4">
                    <span className="material-symbols-outlined text-[32px]">bedtime</span>
                    <span className="font-label-sm text-label-sm">{t('calendar.noEvents') || 'No Events'}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-6 flex justify-center gap-6 border-t border-outline/10 pt-4">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#ba1a1a]"></span>
            <span className="font-label-sm text-label-sm text-on-surface-variant">{t('calendar.classLabel') || 'Class'}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#004190]"></span>
            <span className="font-label-sm text-label-sm text-on-surface-variant">{t('calendar.socialLabel') || 'Social'}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#765b00]"></span>
            <span className="font-label-sm text-label-sm text-on-surface-variant">{t('calendar.generalLabel') || 'General'}</span>
          </div>
        </div>

        {/* FAB */}
        <div 
          className="fixed left-0 right-0 flex justify-center z-50 px-page-margin pointer-events-none"
          style={{ 
            bottom: 'calc(64px + max(env(safe-area-inset-bottom), 12px) + 3mm)',
            transform: 'translateY(var(--woc-bottom-nav-y, 0px))',
            transition: 'transform 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)'
          }}
        >
          <button onClick={() => handleOpenForm()} className="w-full max-w-[250px] h-[48px] bg-[#4f378a] text-white rounded-lg shadow-md flex items-center justify-center gap-2 hover:bg-[#4f378a]/90 transition-colors pointer-events-auto">
            <span className="material-symbols-outlined text-[20px]">add</span>
            <span className="font-label-md text-label-md">{t('calendar.addSchedule') || 'Add Schedule'}</span>
          </button>
        </div>
      </div>
    );
  }

  // ============================================================
  // MONTH VIEW (Weekly Groupings from aiantigravity.txt)
  // ============================================================
  if (viewMode === 'month') {
    return (
      <div className="max-w-7xl mx-auto pb-20">
        {/* View Toggle Pills */}
        <div className="mb-2 flex justify-center mt-2">
          <div className="flex bg-surface-container-high/30 rounded-full p-1 items-center gap-1 inline-flex">
            <button onClick={() => setViewMode('day')} className="px-4 py-1.5 rounded-full text-on-surface-variant bg-transparent hover:bg-surface-container-high/50 font-label-md text-label-md transition-all">{t('common.dayLabel') || 'Day'}</button>
            <button onClick={() => setViewMode('week')} className="px-4 py-1.5 rounded-full text-on-surface-variant bg-transparent hover:bg-surface-container-high/50 font-label-md text-label-md transition-all">{t('common.weekLabel') || 'Week'}</button>
            <button className="px-4 py-1.5 rounded-full bg-primary text-on-primary font-label-md text-label-md shadow-sm transition-all">{t('common.monthLabel') || 'Month'}</button>
          </div>
        </div>
        {/* Month Navigation Header */}
        <div className="flex justify-between items-center mb-2 px-3">
          <button onClick={prevMonth} className="p-1 rounded-full hover:bg-surface-container-highest transition-colors text-on-surface-variant">
            <span className="material-symbols-outlined">chevron_left</span>
          </button>
          <h2 className="font-title-md text-title-md font-bold text-on-surface">{format(currentMonth, 'MMMM yyyy')}</h2>
          <button onClick={nextMonth} className="p-1 rounded-full hover:bg-surface-container-highest transition-colors text-on-surface-variant">
            <span className="material-symbols-outlined">chevron_right</span>
          </button>
        </div>
        {/* Weekly Groupings Container */}
        <div className="flex flex-col gap-6">
          {Array.from({ length: maxWeek }, (_, i) => i + 1).map(wn => {
            const wEvents = weekGroups[wn] || [];
            return (
              <section key={wn} className="flex flex-col gap-4">
                <h3 className="font-title-lg text-title-lg text-primary border-b border-outline-variant/[0.15] pb-2">{t('common.weekLabel') || 'Week'} {wn}</h3>
                <div className="flex flex-col gap-element-gap">
                  {wEvents.length > 0 ? wEvents.map(event => {
                    const ed = new Date(event.startDate);
                    return (
                      <div key={event.id} onClick={() => { setSelectedDate(ed); setViewMode('day'); }} className="bg-surface-container-lowest rounded-xl p-4 border border-outline/[0.15] flex gap-4 items-center hover:shadow-[0_4px_8px_rgba(0,0,0,0.05)] transition-shadow cursor-pointer">
                        <div className="flex flex-col items-center justify-center min-w-[60px] border-r border-outline-variant/[0.15] pr-4">
                          <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">{format(ed, 'MMM')}</span>
                          <span className="font-headline-md text-headline-md text-on-background">{format(ed, 'd')}</span>
                        </div>
                        <div className="flex-1 flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${getMonthDotClass(event.type)}`}></span>
                            <span className="font-body-md text-body-md text-on-background font-semibold">{event.title}</span>
                          </div>
                          <div className="flex items-center gap-1 text-on-surface-variant">
                            <span className="material-symbols-outlined text-[16px]">schedule</span>
                            <span className="font-label-md text-label-md">{event.startTime || ''}{event.endTime ? ` - ${event.endTime}` : ''}</span>
                          </div>
                        </div>
                      </div>
                    );
                  }) : (
                    <p className="font-label-md text-label-md text-on-surface-variant/50 py-2">{t('calendar.noEventsThisWeek') || 'No events this week'}</p>
                  )}
                </div>
              </section>
            );
          })}
        </div>
        {/* FAB */}
        <div 
          className="fixed left-0 right-0 flex justify-center z-50 px-page-margin pointer-events-none"
          style={{ 
            bottom: 'calc(64px + max(env(safe-area-inset-bottom), 12px) + 3mm)',
            transform: 'translateY(var(--woc-bottom-nav-y, 0px))',
            transition: 'transform 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)'
          }}
        >
          <button onClick={() => handleOpenForm()} className="w-full max-w-[250px] h-[48px] bg-[#4f378a] text-white rounded-lg shadow-md flex items-center justify-center gap-2 hover:bg-[#4f378a]/90 transition-colors pointer-events-auto">
            <span className="material-symbols-outlined text-[20px]">add</span>
            <span className="font-label-md text-label-md">{t('calendar.addSchedule') || 'Add Schedule'}</span>
          </button>
        </div>
      </div>
    );
  }

  // ============================================================
  // DAY VIEW (Calendar Grid + Daily Timeline) - from aiantigravity.txt
  // ============================================================
  // Build the week containing selectedDate for the single-week calendar
  const selectedWeekStart = startOfWeek(selectedDate);
  const selectedWeekDays = Array.from({ length: 7 }, (_, i) => addDays(selectedWeekStart, i));

  return (
    <div className="w-full pb-20">
      {/* Header / Filter Area */}
      <header className="flex justify-center mb-2 mt-2">
        {/* View Toggles */}
        <div className="flex bg-surface-container-high/30 rounded-full p-1 items-center gap-1 inline-flex">
          <button className="px-4 py-1.5 rounded-full bg-primary text-on-primary font-label-md text-label-md shadow-sm transition-all">{t('common.dayLabel') || 'Day'}</button>
          <button onClick={() => setViewMode('week')} className="px-4 py-1.5 rounded-full text-on-surface-variant bg-transparent hover:bg-surface-container-high/50 font-label-md text-label-md transition-all">{t('common.weekLabel') || 'Week'}</button>
          <button onClick={() => setViewMode('month')} className="px-4 py-1.5 rounded-full text-on-surface-variant bg-transparent hover:bg-surface-container-high/50 font-label-md text-label-md transition-all">{t('common.monthLabel') || 'Month'}</button>
        </div>
      </header>
      {/* Minimalist Calendar Widget */}
      <section className="bg-surface-container-lowest py-2 border-b border-outline/10 mb-3">
        <div className="flex justify-between items-center mb-1 px-4">
          <h2 className="font-title-sm text-title-sm font-bold text-on-surface">{format(currentMonth, 'MMMM yyyy')}</h2>
          <div className="flex gap-1">
            <button onClick={prevMonth} className="p-1 hover:bg-surface-container-high rounded-full transition-colors">
              <span className="material-symbols-outlined text-on-surface-variant text-[18px]">chevron_left</span>
            </button>
            <button onClick={nextMonth} className="p-1 hover:bg-surface-container-high rounded-full transition-colors">
              <span className="material-symbols-outlined text-on-surface-variant text-[18px]">chevron_right</span>
            </button>
          </div>
        </div>
        {/* Days Header */}
        <div className="grid grid-cols-7 mb-0.5 text-center">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
            <div key={i} className="font-label-sm text-[10px] text-on-surface-variant">{d}</div>
          ))}
        </div>
        {/* Calendar Grid - Month */}
        <div className="grid grid-cols-7 gap-y-0 text-center px-2">
          {calendarDays.map((calDay, idx) => {
            const isCurrentMonth = isSameMonth(calDay, currentMonth);
            const isSelected = isSameDay(calDay, selectedDate);
            const dayEvents = events.filter(e => isSameDay(new Date(e.startDate), calDay));
            return (
              <div key={idx} onClick={() => onDateClick(calDay)}
                className={`flex flex-col items-center justify-start gap-0.5 cursor-pointer transition-transform active:scale-95 py-1 ${!isCurrentMonth ? 'opacity-30' : ''}`}>
                <span className={`${isSelected ? 'font-label-md font-bold' : 'font-body-sm text-[13px]'} w-6 h-6 flex items-center justify-center rounded-full transition-colors ${
                  isSelected ? 'bg-primary text-on-primary shadow-sm' : 'hover:bg-surface-container-high text-on-surface'
                }`}>
                  {format(calDay, 'd')}
                </span>
                <div className="flex gap-0.5 h-1">
                  {dayEvents.length > 0 && dayEvents.slice(0, 3).map((ev, i) => (
                    <div key={i} className={`w-1 h-1 rounded-full ${getTypeDotClass(ev.type)}`}></div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>
      {/* Daily Timeline */}
      <section className="px-4">
        <h3 className="font-title-sm text-title-sm font-bold text-on-surface mb-3 flex items-center justify-between">
          <span>{isToday(selectedDate) ? `${t('calendar.todayComma') || 'Today, '}${format(selectedDate, 'MMM d')}` : format(selectedDate, 'EEEE, MMM d')}</span>
          <span className="text-primary text-[12px] font-normal">{selectedDayEvents.length} {t('calendar.events') || 'Events'}</span>
        </h3>
        {selectedDayEvents.length > 0 ? (
          <div className="relative border-l border-outline-variant/30 ml-4 pl-8 flex flex-col gap-8">
            {selectedDayEvents.map((event) => (
              <div key={event.id} className="relative group">
                <div className={`absolute -left-[41px] top-1 w-4 h-4 rounded-full ${getTypeDotClass(event.type)} ring-4 ring-surface`}></div>
                <div className="flex flex-col md:flex-row md:items-baseline gap-2 md:gap-4 mb-2">
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-label-md text-label-md text-on-surface-variant w-20">{event.startTime ? formatTime12h(event.startTime) : ''}</span>
                    <span className={`px-2 py-0.5 rounded-full font-label-sm text-label-sm ${getTypeBadgeClass(event.type)}`}>
                      {getTypeLabel(event.type)}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <h4 className="font-title-lg text-title-lg text-on-surface">{event.title}</h4>
                    {event.description && (
                      <p className="font-body-md text-body-md text-on-surface-variant mt-1 whitespace-pre-wrap">
                        {event.description}
                      </p>
                    )}
                  </div>
                </div>
                {/* Edit/Delete Actions */}
                {event.createdBy !== 'system' && (
                  <div className="flex gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity md:justify-end">
                    <button onClick={() => handleOpenForm(event)} className="text-sm font-medium text-primary hover:underline">{t('calendar.edit') || 'Edit'}</button>
                    <button onClick={() => handleDeleteEvent(event.id)} className="text-sm font-medium text-error hover:underline">{t('calendar.delete') || 'Delete'}</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-surface-container-lowest rounded-xl ring-1 ring-outline/10">
            <span className="material-symbols-outlined text-4xl text-outline-variant mb-2 block">event_busy</span>
            <p className="text-sm text-on-surface-variant">{t('calendar.noEventsScheduledForThisDay') || 'No events scheduled for this day'}</p>
          </div>
        )}
      </section>
      {/* Add Schedule Button - Fixed Bottom */}
      <div 
        className="fixed left-0 right-0 flex justify-center z-50 px-page-margin pointer-events-none"
        style={{ 
          bottom: 'calc(64px + max(env(safe-area-inset-bottom), 12px) + 3mm)',
          transform: 'translateY(var(--woc-bottom-nav-y, 0px))',
          transition: 'transform 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)'
        }}
      >
        <button onClick={() => handleOpenForm()} className="w-full max-w-[250px] h-[48px] bg-[#4f378a] text-white rounded-lg shadow-md flex items-center justify-center gap-2 hover:bg-[#4f378a]/90 transition-colors pointer-events-auto">
          <span className="material-symbols-outlined text-[20px]">add</span>
          <span className="font-label-md text-label-md">{t('calendar.addSchedule') || 'Add Schedule'}</span>
        </button>
      </div>
    </div>
  );
};

export default GroupCalendar;
