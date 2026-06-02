"use client";
// 그룹 캘린더의 실시간 데이터 구독 및 일정 관리 상태를 처리하는 커스텀 훅.

import { useState, useEffect, useMemo } from 'react';
import { 
  addMonths, subMonths, startOfMonth, endOfMonth, 
  startOfWeek, endOfWeek, isSameMonth, isSameDay, addDays, 
  startOfDay, isToday, parseISO, format
} from 'date-fns';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { groupService } from '@/lib/firebase/groupService';
import { socialService } from '@/lib/firebase/socialService';
import { CalendarEvent, Group, GroupClass } from '@/types/group';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

export type ViewMode = 'day' | 'week' | 'month';

export const useGroupCalendar = (group: Group) => {
  const { t, formatDate } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const [viewMode, setViewMode] = useState<ViewMode>('day');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  const [groupCalendarEvents, setGroupCalendarEvents] = useState<CalendarEvent[]>(() => {
    if (typeof window !== 'undefined') {
      const cached = sessionStorage.getItem(`woc_cal_events_${group.id}`);
      if (cached) {
        try { return JSON.parse(cached); } catch(e) {}
      }
    }
    return [];
  });
  const [socialEvents, setSocialEvents] = useState<CalendarEvent[]>(() => {
    if (typeof window !== 'undefined') {
      const cached = sessionStorage.getItem(`woc_social_events_${group.id}`);
      if (cached) {
        try { return JSON.parse(cached); } catch(e) {}
      }
    }
    return [];
  });
  const [subClasses, setSubClasses] = useState<GroupClass[]>([]);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: formatDate(new Date(), 'iso'),
    startTime: '19:00',
    endDate: formatDate(new Date(), 'iso'),
    endTime: '21:00',
    type: 'general' as CalendarEvent['type'],
    // 신규 추가 필드 상태 셋업
    weekPlans: ['', '', '', ''] as string[],
    org: '',
    dj: '',
  });

  const handleFormClose = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('modal');
    params.delete('eventId');
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  useEffect(() => {
    if (!group.id) return;
    const unsubscribe = groupService.subscribeCalendarEvents(group.id, (fetchedEvents) => {
      setGroupCalendarEvents(fetchedEvents);
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(`woc_cal_events_${group.id}`, JSON.stringify(fetchedEvents));
      }
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
              createdAt: s.createdAt?.toMillis ? s.createdAt.toMillis() : Date.now(),
              // 소셜/밀롱가 org 및 dj 주입
              org: (s as any).org || (s as any).organizer || '',
              dj: (s as any).dj || '',
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
            createdAt: s.createdAt?.toMillis ? s.createdAt.toMillis() : Date.now(),
            // 소셜/밀롱가 org 및 dj 주입
            org: (s as any).org || (s as any).organizer || '',
            dj: (s as any).dj || '',
          });
        }
      });
      setSocialEvents(socialAsCalendarEvents);
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(`woc_social_events_${group.id}`, JSON.stringify(socialAsCalendarEvents));
      }
    });
    return () => unsubscribe();
  }, [group.venueId]);

  const classEvents: CalendarEvent[] = useMemo(() => {
    const allClasses = [...(group.classes || []), ...subClasses];
    const uniqueClasses = Array.from(new Map(allClasses.map(c => [c.id, c])).values());

    return uniqueClasses.flatMap(cls => {
      // 해당 클래스의 1~4주차 수업 개요를 동적으로 파싱
      const weekPlans = ['', '', '', ''];
      (cls.schedule || []).forEach(sch => {
        if (sch.week >= 1 && sch.week <= 4) {
          weekPlans[sch.week - 1] = sch.content || '';
        }
      });

      return (cls.schedule || []).map((sch, idx) => {
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
          createdAt: Date.now(),
          // 주차별 개요 배열 주입
          weekPlans: weekPlans,
        };
      });
    });
  }, [group.classes, subClasses, t]);

  const events = useMemo(() => {
    return [...groupCalendarEvents, ...socialEvents, ...classEvents];
  }, [groupCalendarEvents, socialEvents, classEvents]);

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
    const params = new URLSearchParams(searchParams.toString());
    params.set('modal', 'event-add');
    if (event) {
      params.set('eventId', event.id);
    } else {
      params.delete('eventId');
    }
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  useEffect(() => {
    const modal = searchParams.get('modal');
    const eventId = searchParams.get('eventId');

    if (modal === 'event-add') {
      if (eventId) {
        const foundEvent = events.find(e => e.id === eventId);
        if (foundEvent) {
          setEditingEvent(foundEvent);
          const eventDate = new Date(foundEvent.startDate);
          setFormData({
            title: foundEvent.title,
            description: foundEvent.description || '',
            startDate: formatDate(eventDate, 'iso'),
            startTime: foundEvent.startTime || '19:00',
            endDate: formatDate(eventDate, 'iso'),
            endTime: foundEvent.endTime || '21:00',
            type: foundEvent.type,
            // 에디팅 바인딩
            weekPlans: (foundEvent as any).weekPlans || ['', '', '', ''],
            org: (foundEvent as any).org || '',
            dj: (foundEvent as any).dj || '',
          });
        }
      } else {
        setEditingEvent(null);
        setFormData({
          title: '',
          description: '',
          startDate: formatDate(selectedDate, 'iso'),
          startTime: '19:00',
          endDate: formatDate(selectedDate, 'iso'),
          endTime: '21:00',
          type: 'general',
          // 신규 일정 초기화
          weekPlans: ['', '', '', ''],
          org: '',
          dj: '',
        });
      }
      setIsFormOpen(true);
    } else {
      setIsFormOpen(false);
    }
  }, [searchParams, selectedDate, events, formatDate]);

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
        // 페이로드 주입
        weekPlans: formData.weekPlans || ['', '', '', ''],
        org: formData.org || '',
        dj: formData.dj || '',
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

  const selectedDayEvents = useMemo(() => {
    const filtered = events.filter(e => isSameDay(new Date(e.startDate), selectedDate));
    return [...filtered].sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));
  }, [events, selectedDate]);

  // Build week days
  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));
  }, [currentWeekStart]);

  const weekEnd = useMemo(() => {
    return addDays(currentWeekStart, 6);
  }, [currentWeekStart]);

  const weekHeaderText = useMemo(() => {
    return isSameMonth(currentWeekStart, weekEnd)
      ? `${formatDate(currentWeekStart, 'shortMonthDay')} - ${formatDate(weekEnd, 'dayOnly')}`
      : `${formatDate(currentWeekStart, 'shortMonthDay')} - ${formatDate(weekEnd, 'shortMonthDay')}`;
  }, [currentWeekStart, weekEnd, formatDate]);

  // Build month-view weekly groupings
  const monthViewEvents = useMemo(() => {
    return events
      .filter(e => isSameMonth(new Date(e.startDate), currentMonth))
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  }, [events, currentMonth]);

  const weekGroups = useMemo(() => {
    const groups: Record<number, CalendarEvent[]> = {};
    monthViewEvents.forEach(e => {
      const wn = Math.ceil(new Date(e.startDate).getDate() / 7);
      if (!groups[wn]) groups[wn] = [];
      groups[wn].push(e);
    });
    return groups;
  }, [monthViewEvents]);

  const maxWeek = useMemo(() => {
    return Math.ceil(endOfMonth(currentMonth).getDate() / 7);
  }, [currentMonth]);

  // Build calendar grid days (week starts Monday)
  const calendarDays = useMemo(() => {
    const monthStartGrid = startOfMonth(currentMonth);
    const monthEndGrid = endOfMonth(monthStartGrid);
    const startDateGrid = startOfWeek(monthStartGrid, { weekStartsOn: 1 });
    const endDateGrid = endOfWeek(monthEndGrid, { weekStartsOn: 1 });

    const days = [];
    let dayGrid = startDateGrid;
    while (dayGrid <= endDateGrid) {
      days.push(dayGrid);
      dayGrid = addDays(dayGrid, 1);
    }
    return days;
  }, [currentMonth]);

  return {
    viewMode,
    setViewMode,
    currentMonth,
    setCurrentMonth,
    currentWeekStart,
    selectedDate,
    setSelectedDate,
    events,
    selectedDayEvents,
    weekDays,
    weekEnd,
    weekHeaderText,
    monthViewEvents,
    weekGroups,
    maxWeek,
    calendarDays,
    isFormOpen,
    isSaving,
    editingEvent,
    formData,
    setFormData,
    handleFormClose,
    handleSaveEvent,
    handleDeleteEvent,
    handleNext,
    handlePrev,
    handleOpenForm
  };
};
