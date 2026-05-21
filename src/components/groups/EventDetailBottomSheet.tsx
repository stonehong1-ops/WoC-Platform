"use client";
// 선택한 날짜의 일정 상세 및 목록 조회를 담당하는 컴포넌트.

import React from 'react';
import { CalendarEvent } from '@/types/group';

interface EventDetailBottomSheetProps {
  selectedDate: Date;
  selectedDayEvents: CalendarEvent[];
  getTypeDotClass: (type: string) => string;
  getTypeBadgeClass: (type: string) => string;
  getTypeLabel: (type: string) => string;
  formatTime: (time: string) => string;
  handleOpenForm: (event: CalendarEvent) => void;
  handleDeleteEvent: (eventId: string) => void;
  t: (key: string) => string;
  formatDate: (date: Date, type: string) => string;
}

export const EventDetailBottomSheet: React.FC<EventDetailBottomSheetProps> = ({
  selectedDate,
  selectedDayEvents,
  getTypeDotClass,
  getTypeBadgeClass,
  getTypeLabel,
  formatTime,
  handleOpenForm,
  handleDeleteEvent,
  t,
  formatDate,
}) => {
  return (
    <>
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
    </>
  );
};

export default EventDetailBottomSheet;
