"use client";

import React from 'react';
import { isToday, isSameDay } from 'date-fns';
import { useLanguage } from '@/contexts/LanguageContext';
import { Group, CalendarEvent } from '@/types/group';
import { useGroupCalendar, ViewMode } from './hooks/useGroupCalendar';
import { GroupCalendarGrid } from './GroupCalendarGrid';
import { EventDetailBottomSheet } from './EventDetailBottomSheet';
import { GroupCalendarForm } from './GroupCalendarForm';

interface GroupCalendarProps {
  group: Group;
}

const GroupCalendar: React.FC<GroupCalendarProps> = ({ group }) => {
  const { t, formatDate } = useLanguage();
  const {
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
  } = useGroupCalendar(group);

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = { 
      'class': t('calendar.classLabel') || 'Class', 
      'social': t('calendar.socialLabel') || 'Social', 
      'milonga': t('calendar.milongaLabel') || 'Milonga', 
      'practice': t('calendar.practiceLabel') || 'Practice', 
      'general': t('calendar.generalLabel') || 'General', 
      'gen': t('calendar.generalLabel') || 'General', 
      'rental': t('calendar.rentalLabel') || 'Rental' 
    };
    if (labels[type]) return labels[type];
    
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

  // ============================================================
  // FORM VIEW (Design 2: Schedule Register)
  // ============================================================
  if (isFormOpen) {
    return (
      <GroupCalendarForm
        formData={formData}
        setFormData={setFormData}
        isSaving={isSaving}
        handleFormClose={handleFormClose}
        handleSaveEvent={handleSaveEvent}
        getTypeLabel={getTypeLabel}
        t={t}
      />
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
            const dayNum = formatDate(wd, 'calendarDay');
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
                        onClick={() => { setSelectedDate(wd); setCurrentMonth(new Date(wd.getFullYear(), wd.getMonth(), 1)); setViewMode('day'); }}
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
                      <div key={event.id} onClick={() => { setSelectedDate(ed); setCurrentMonth(new Date(ed.getFullYear(), ed.getMonth(), 1)); setViewMode('day'); }} className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm flex gap-4 items-center hover:shadow-md transition-shadow cursor-pointer">
                        <div className="flex flex-col items-center justify-center min-w-[50px] border-r border-slate-100 pr-4">
                          <span className="text-[10px] font-bold text-slate-400 uppercase">{formatDate(ed, 'shortMonth')}</span>
                          <span className="text-xl font-extrabold text-[#242c51]">{formatDate(ed, 'calendarDay')}</span>
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
          <GroupCalendarGrid
            currentMonth={currentMonth}
            selectedDate={selectedDate}
            events={events}
            calendarDays={calendarDays}
            handlePrev={handlePrev}
            handleNext={handleNext}
            setSelectedDate={setSelectedDate}
            setCurrentMonth={setCurrentMonth}
            getTypeDotClass={getTypeDotClass}
            formatDate={formatDate}
          />

          <EventDetailBottomSheet
            selectedDate={selectedDate}
            selectedDayEvents={selectedDayEvents}
            getTypeDotClass={getTypeDotClass}
            getTypeBadgeClass={getTypeBadgeClass}
            getTypeLabel={getTypeLabel}
            formatTime={formatTime}
            handleOpenForm={handleOpenForm}
            handleDeleteEvent={handleDeleteEvent}
            t={t}
            formatDate={formatDate}
          />
        </section>
      )}
    </div>
  );
};

export default GroupCalendar;
