"use client";
// 그룹 캘린더의 일간 뷰 모드용 상단 달력 그리드 컴포넌트.

import React from 'react';
import { isSameMonth, isSameDay, isToday, startOfMonth } from 'date-fns';
import { CalendarEvent } from '@/types/group';

interface GroupCalendarGridProps {
  currentMonth: Date;
  selectedDate: Date;
  events: CalendarEvent[];
  calendarDays: Date[];
  handlePrev: () => void;
  handleNext: () => void;
  setSelectedDate: (date: Date) => void;
  setCurrentMonth: (date: Date) => void;
  getTypeDotClass: (type: string) => string;
  formatDate: (date: Date, type: string) => string;
}

export const GroupCalendarGrid: React.FC<GroupCalendarGridProps> = ({
  currentMonth,
  selectedDate,
  events,
  calendarDays,
  handlePrev,
  handleNext,
  setSelectedDate,
  setCurrentMonth,
  getTypeDotClass,
  formatDate,
}) => {
  return (
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
                <span className={`text-[12px] ${isSelected || isTodayDate ? 'font-bold' : 'font-medium'}`}>{formatDate(d, 'calendarDay')}</span>
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
  );
};

export default GroupCalendarGrid;
