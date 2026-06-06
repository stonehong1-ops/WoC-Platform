"use client";
// 클래스 등록 시 요일별/주차별 세부 일정을 추가하고 구성하는 폼 컴포넌트

import React, { useState } from "react";
import { ClassScheduleEntry } from "@/types/group";

interface ClassScheduleFormProps {
  schedule: ClassScheduleEntry[];
  t: (key: string) => string;
  isSpecial?: boolean;
  isEditMode?: boolean;
  onAddWeeks: (weeks: number) => void;
  onRemoveWeek: (index: number) => void;
  onUpdateSchedule: (index: number, field: keyof ClassScheduleEntry, value: any) => void;
  onGenerateFourWeeks: () => void;
}

export const ClassScheduleForm: React.FC<ClassScheduleFormProps> = ({
  schedule,
  t,
  isSpecial,
  isEditMode,
  onAddWeeks,
  onRemoveWeek,
  onUpdateSchedule,
  onGenerateFourWeeks,
}) => {
  const [weeksToAdd, setWeeksToAdd] = useState(1);

  return (
    <div className="space-y-4">
      <label className="text-[13px] font-black text-gray-400 uppercase tracking-widest ml-1">
        {t('class.schedule_label') || "Schedule"}
      </label>
      <div className="space-y-3">
        {schedule.map((entry, index) => {
          const dayLabel = entry.date ? (() => {
            const d = new Date(entry.date + 'T00:00:00');
            const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            return days[d.getDay()];
          })() : '';
          
          return (
            <div key={index} className="bg-gray-50 rounded-2xl p-4 space-y-3 relative border border-gray-100">
              {/* Week Header + Delete */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-primary/10 text-primary text-xs font-black flex items-center justify-center">
                    {index + 1}
                  </span>
                  <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    {isSpecial ? 'Date' : `Week ${index + 1}`}
                  </span>
                </div>
                {schedule.length > 1 && (
                  <button
                    type="button"
                    onClick={() => onRemoveWeek(index)}
                    className="w-7 h-7 rounded-full bg-red-50 text-red-400 hover:bg-red-100 hover:text-red-600 flex items-center justify-center transition-colors"
                  >
                    <span className="material-symbols-outlined text-[16px]">close</span>
                  </button>
                )}
              </div>
              {/* Date row with day of week */}
              <div className="flex items-center gap-2">
                <input
                  value={entry.date || ''}
                  onChange={e => onUpdateSchedule(index, 'date', e.target.value)}
                  className="flex-1 bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-semibold text-gray-800 focus:ring-2 focus:ring-primary/10"
                  type="date"
                />
                {dayLabel && (
                  <span className="px-2.5 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-black tracking-wide shrink-0">
                    {dayLabel}
                  </span>
                )}
              </div>
              {/* Time row */}
              <div className="flex items-center gap-2">
                <input
                  value={entry.timeSlot ? entry.timeSlot.split(' - ')[0] : "19:00"}
                  onChange={e => {
                    const end = entry.timeSlot ? entry.timeSlot.split(' - ')[1] : "21:00";
                    onUpdateSchedule(index, 'timeSlot', `${e.target.value} - ${end || '21:00'}`);
                  }}
                  className="flex-1 bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-semibold text-gray-800 focus:ring-2 focus:ring-primary/10"
                  type="time"
                />
                <span className="text-gray-400 font-bold text-xs">—</span>
                <input
                  value={entry.timeSlot && entry.timeSlot.includes(' - ') ? entry.timeSlot.split(' - ')[1] : "21:00"}
                  onChange={e => {
                    const start = entry.timeSlot ? entry.timeSlot.split(' - ')[0] : "19:00";
                    onUpdateSchedule(index, 'timeSlot', `${start || '19:00'} - ${e.target.value}`);
                  }}
                  className="flex-1 bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-semibold text-gray-800 focus:ring-2 focus:ring-primary/10"
                  type="time"
                />
              </div>
              {/* Content */}
              <textarea
                value={entry.content}
                onChange={e => onUpdateSchedule(index, 'content', e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-700 focus:ring-2 focus:ring-primary/10 resize-none"
                placeholder={t('class.lesson_content_placeholder') || "e.g. Fundamental movements and warm-up routine..."}
                rows={1}
              />
            </div>
          );
        })}
      </div>
      {/* Action buttons */}
      <div className="flex items-center gap-2 pt-1">
        <button
          type="button"
          onClick={() => onAddWeeks(weeksToAdd)}
          disabled={isSpecial}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
            isSpecial
              ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
              : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">add</span>
          Add Date
        </button>
        {!isSpecial && !isEditMode && schedule.length <= 1 && (
          <button
            type="button"
            onClick={onGenerateFourWeeks}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">date_range</span>
            Generate 4 Weeks
          </button>
        )}
      </div>
      {/* Notice */}
      {!isSpecial && !isEditMode && schedule.length <= 1 && (
        <div className="px-1 pt-1">
          <p className="text-[11px] text-[#0057bd] font-semibold">
            * {t('class.auto_four_weeks_notice') || "The schedule will be automatically duplicated for 4 consecutive weeks starting from the selected date."}
          </p>
        </div>
      )}
    </div>
  );
};
