"use client";
// 그룹 캘린더의 일정 추가 및 수정을 위한 폼 등록 컴포넌트.

import React from 'react';
import { CalendarEvent } from '@/types/group';

interface GroupCalendarFormProps {
  formData: {
    title: string;
    description: string;
    startDate: string;
    startTime: string;
    endDate: string;
    endTime: string;
    type: CalendarEvent['type'];
    weekPlans: string[];
    org: string;
    dj: string;
  };
  setFormData: React.Dispatch<React.SetStateAction<{
    title: string;
    description: string;
    startDate: string;
    startTime: string;
    endDate: string;
    endTime: string;
    type: CalendarEvent['type'];
    weekPlans: string[];
    org: string;
    dj: string;
  }>>;
  isSaving: boolean;
  handleFormClose: () => void;
  handleSaveEvent: () => void;
  getTypeLabel: (type: string) => string;
  t: (key: string) => string;
}

export const GroupCalendarForm: React.FC<GroupCalendarFormProps> = ({
  formData,
  setFormData,
  isSaving,
  handleFormClose,
  handleSaveEvent,
  getTypeLabel,
  t,
}) => {
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
          {formData.type === 'class' && (
            <div className="flex flex-col gap-4 border-t border-outline/10 pt-4">
              <span className="font-label-md text-label-md text-on-surface-variant">
                {t('calendar.weeklyOutline') || '주차별 수업개요'}
              </span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex flex-col gap-2">
                    <label className="font-label-sm text-label-sm text-on-surface-variant" htmlFor={`week-plan-${i}`}>
                      {t(`calendar.week${i + 1}`) || `${i + 1}주차`}
                    </label>
                    <input
                      className="w-full rounded border border-outline/20 bg-surface focus:border-primary focus:ring-1 focus:ring-primary font-body-md text-body-md text-on-surface py-3 px-3 min-w-0"
                      id={`week-plan-${i}`}
                      type="text"
                      placeholder={t('calendar.weekOutlinePlaceholder')?.replace('{week}', String(i + 1)) || `${i + 1}주차 수업개요를 입력하세요`}
                      value={formData.weekPlans?.[i] || ''}
                      onChange={(e) => {
                        const newPlans = [...(formData.weekPlans || ['', '', '', ''])];
                        newPlans[i] = e.target.value;
                        setFormData({ ...formData, weekPlans: newPlans });
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
          {(formData.type === 'social' || formData.type === 'milonga') && (
            <div className="flex flex-col gap-4 border-t border-outline/10 pt-4">
              <span className="font-label-md text-label-md text-on-surface-variant">
                {t('calendar.eventDetails') || '행사 상세 정보'}
              </span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="font-label-sm text-label-sm text-on-surface-variant" htmlFor="event-org">
                    Org
                  </label>
                  <input
                    className="w-full rounded border border-outline/20 bg-surface focus:border-primary focus:ring-1 focus:ring-primary font-body-md text-body-md text-on-surface py-3 px-3 min-w-0"
                    id="event-org"
                    type="text"
                    placeholder={t('calendar.orgPlaceholder') || '주최 오거나이저 입력...'}
                    value={formData.org || ''}
                    onChange={(e) => setFormData({ ...formData, org: e.target.value })}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="font-label-sm text-label-sm text-on-surface-variant" htmlFor="event-dj">
                    DJ
                  </label>
                  <input
                    className="w-full rounded border border-outline/20 bg-surface focus:border-primary focus:ring-1 focus:ring-primary font-body-md text-body-md text-on-surface py-3 px-3 min-w-0"
                    id="event-dj"
                    type="text"
                    placeholder={t('calendar.djPlaceholder') || '담당 DJ 입력...'}
                    value={formData.dj || ''}
                    onChange={(e) => setFormData({ ...formData, dj: e.target.value })}
                  />
                </div>
              </div>
            </div>
          )}
        </form>
      </main>
    </div>
  );
};

export default GroupCalendarForm;
