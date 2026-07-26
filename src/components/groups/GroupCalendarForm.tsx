"use client";
// 그룹 캘린더의 일정 추가 및 수정을 위한 폼 등록 컴포넌트.

import React, { useState, useEffect, useRef } from 'react';
import { useLocalBackClose } from '@/hooks/useLocalBackClose';
import { createPortal } from 'react-dom';
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
  const [mounted, setMounted] = useState(false);
  const mainRef = useRef<HTMLDivElement>(null);

  const handleCloseWithDirtyCheck = () => {
    const isDirty = !!(formData.title?.trim() || formData.description?.trim());
    if (isDirty) {
      if (confirm(t('common.confirm_discard') || "작성 중인 내용이 있습니다. 정말 나가시겠습니까?")) {
        handleFormClose();
      }
    } else {
      handleFormClose();
    }
  };

  useLocalBackClose(true, handleCloseWithDirtyCheck);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const target = e.target;
    setTimeout(() => {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 200);
  };

  if (!mounted) return null;

  const content = (
    <div className="fixed inset-0 z-[9990] bg-[#f8f9fa] text-slate-800 flex flex-col w-full h-full">
      <header
        className="flex items-center justify-between px-4 bg-white border-b border-[#e0e4e5] sticky top-0 z-50 shrink-0"
        style={{
          paddingTop: 'env(safe-area-inset-top, 0px)',
          height: 'calc(56px + env(safe-area-inset-top, 0px))'
        }}
      >
        <button onClick={handleCloseWithDirtyCheck} className="w-10 h-10 flex items-center justify-center -ml-2 text-slate-700 hover:bg-slate-50 rounded-full active:scale-95 transition-transform shrink-0">
          <span className="material-symbols-rounded text-2xl">arrow_back</span>
        </button>
        <h1 className="text-[16px] font-bold text-slate-800 text-center flex-1 truncate px-2">{formData.title ? (t('calendar.editSchedule') || "그룹 일정 수정") : (t('calendar.newSchedule') || "새 그룹 일정")}</h1>
        <div className="w-9 h-9 shrink-0" />
      </header>

      <main ref={mainRef} className="flex-grow w-full px-4 py-4 flex flex-col gap-6 overflow-y-auto pb-40">
        <form className="flex flex-col gap-6 bg-white p-5 rounded-2xl border border-[#e0e4e5] shadow-sm" onSubmit={(e) => e.preventDefault()}>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-700" htmlFor="title">{t('calendar.title') || "일정 제목"}</label>
            <input
              autoFocus
              onFocus={handleInputFocus}
              className="w-full border border-[#e0e4e5] bg-white text-sm font-bold text-slate-800 px-3.5 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#007AFF]/20 focus:border-[#007AFF] transition-all placeholder:text-[#acb3b4] placeholder:font-normal"
              id="title"
              placeholder={t('calendar.eventTitle') || "일정 제목을 입력하세요"}
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
            />
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-xs font-bold text-slate-700">{t('calendar.category') || "카테고리"}</span>
            <div className="flex flex-wrap gap-2">
              {['class', 'social', 'rental', 'general'].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setFormData({...formData, type: type as CalendarEvent['type']})}
                  className={`px-3.5 py-2 rounded-full text-xs font-bold transition-all ${
                    formData.type === type
                      ? 'bg-[#007AFF] text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {getTypeLabel(type)}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700" htmlFor="start-date">{t('calendar.startsLabel') || "시작 일시"}</label>
              <div className="flex gap-2 w-full">
                <input className="w-full flex-[3] rounded-xl border border-[#e0e4e5] bg-white text-sm font-bold text-slate-800 py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-[#007AFF]/20 focus:border-[#007AFF]" id="start-date" type="date" value={formData.startDate} onChange={(e) => setFormData({...formData, startDate: e.target.value})} />
                <input className="w-full flex-[2] rounded-xl border border-[#e0e4e5] bg-white text-sm font-bold text-slate-800 py-2.5 px-2 focus:outline-none focus:ring-2 focus:ring-[#007AFF]/20 focus:border-[#007AFF]" id="start-time" type="time" value={formData.startTime} onChange={(e) => {
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

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700" htmlFor="end-date">{t('calendar.endsLabel') || "종료 일시"}</label>
              <div className="flex gap-2 w-full">
                <input className="w-full flex-[3] rounded-xl border border-[#e0e4e5] bg-white text-sm font-bold text-slate-800 py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-[#007AFF]/20 focus:border-[#007AFF]" id="end-date" type="date" value={formData.endDate} onChange={(e) => setFormData({...formData, endDate: e.target.value})} />
                <input className="w-full flex-[2] rounded-xl border border-[#e0e4e5] bg-white text-sm font-bold text-slate-800 py-2.5 px-2 focus:outline-none focus:ring-2 focus:ring-[#007AFF]/20 focus:border-[#007AFF]" id="end-time" type="time" value={formData.endTime} onChange={(e) => setFormData({...formData, endTime: e.target.value})} />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-700" htmlFor="description">{t('calendar.descriptionLabel') || "상세 설명"}</label>
            <textarea onFocus={handleInputFocus} className="w-full rounded-xl border border-[#e0e4e5] bg-white text-sm font-bold text-slate-800 py-3 px-3.5 resize-none focus:outline-none focus:ring-2 focus:ring-[#007AFF]/20 focus:border-[#007AFF] placeholder:text-[#acb3b4] placeholder:font-normal" id="description" placeholder={t('calendar.addDetailsPlaceholder') || "상세 정보를 입력하세요..."} rows={4} value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} />
          </div>
          {formData.type === 'class' && (
            <div className="flex flex-col gap-4 border-t border-outline/10 pt-4">
              <span className="font-label-md text-label-md text-on-surface-variant font-bold">
                {t('calendar.weeklyOutline') || '주차별 수업개요'}
              </span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex flex-col gap-2">
                    <label className="font-label-sm text-label-sm text-on-surface-variant font-bold" htmlFor={`week-plan-${i}`}>
                      {t(`calendar.week${i + 1}`) || `${i + 1}주차`}
                    </label>
                    <input
                      className="w-full rounded border border-outline/20 bg-surface focus:border-primary focus:ring-1 focus:ring-primary font-body-md text-body-md text-on-surface py-3 px-3 min-w-0 font-bold"
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
              <span className="font-label-md text-label-md text-on-surface-variant font-bold">
                {t('calendar.eventDetails') || '행사 상세 정보'}
              </span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="font-label-sm text-label-sm text-on-surface-variant font-bold" htmlFor="event-org">
                    Org
                  </label>
                  <input
                    className="w-full rounded border border-outline/20 bg-surface focus:border-primary focus:ring-1 focus:ring-primary font-body-md text-body-md text-on-surface py-3 px-3 min-w-0 font-bold"
                    id="event-org"
                    type="text"
                    placeholder={t('calendar.orgPlaceholder') || '주최 오거나이저 입력...'}
                    value={formData.org || ''}
                    onChange={(e) => setFormData({ ...formData, org: e.target.value })}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="font-label-sm text-label-sm text-on-surface-variant font-bold" htmlFor="event-dj">
                    DJ
                  </label>
                  <input
                    className="w-full rounded border border-outline/20 bg-surface focus:border-primary focus:ring-1 focus:ring-primary font-body-md text-body-md text-on-surface py-3 px-3 min-w-0 font-bold"
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

      {/* 모바일 하단 고정 저장 바 (Safe Area 적용) */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-[#e0e4e5] p-4 flex items-center gap-3 shadow-lg"
        style={{ paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 0px))' }}
      >
        <button
          type="button"
          onClick={handleCloseWithDirtyCheck}
          className="flex-1 py-3.5 border border-[#e0e4e5] text-slate-700 font-bold text-sm rounded-full hover:bg-slate-50 active:scale-95 transition-all"
        >
          {t('common.cancel') || '취소'}
        </button>
        <button
          type="button"
          onClick={handleSaveEvent}
          disabled={!formData.title || isSaving}
          className="flex-1 py-3.5 bg-[#007AFF] text-white font-bold text-sm rounded-full hover:bg-blue-600 active:scale-95 transition-all disabled:opacity-50 shadow-md shadow-blue-500/20"
        >
          {isSaving ? (t('calendar.saving') || "저장 중...") : (t('calendar.save') || "저장하기")}
        </button>
      </div>
    </div>
  );

  return createPortal(content, document.body);
};

export default GroupCalendarForm;
