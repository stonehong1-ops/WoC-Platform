// 소스 월의 클래스 프로그램을 타겟 월로 요일 기반 복제하는 모바일 코어 에디터 컴포넌트
"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import { Group, GroupClass, ClassScheduleEntry } from "@/types/group";
import { groupService } from "@/lib/firebase/groupService";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** 소스 날짜의 "N번째 X요일" 패턴을 타겟 월에 매핑 */
function mapDateToTargetMonth(sourceDate: string, targetYear: number, targetMonthIdx: number): string {
  const src = new Date(sourceDate + 'T00:00:00');
  const dayOfWeek = src.getDay();
  const nthOccurrence = Math.ceil(src.getDate() / 7);

  const firstOfTarget = new Date(targetYear, targetMonthIdx, 1);
  const firstOccurrence = 1 + ((dayOfWeek - firstOfTarget.getDay() + 7) % 7);
  let targetDate = firstOccurrence + (nthOccurrence - 1) * 7;

  const lastDay = new Date(targetYear, targetMonthIdx + 1, 0).getDate();
  if (targetDate > lastDay) targetDate -= 7;

  return `${targetYear}-${String(targetMonthIdx + 1).padStart(2, '0')}-${String(targetDate).padStart(2, '0')}`;
}

/** 시작일 + 주차 수로 전체 schedule 생성 */
function buildSchedule(startDate: string, timeSlot: string, weekCount: number, sourceSchedule: ClassScheduleEntry[]): ClassScheduleEntry[] {
  const result: ClassScheduleEntry[] = [];
  const base = new Date(startDate + 'T00:00:00');
  for (let i = 0; i < weekCount; i++) {
    const d = new Date(base);
    d.setDate(base.getDate() + i * 7);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    result.push({
      week: i + 1,
      date: dateStr,
      timeSlot,
      content: sourceSchedule[i]?.content || ''
    });
  }
  return result;
}

interface CloneCandidate {
  sourceClass: GroupClass;
  selected: boolean;
  startDate: string;
  timeSlot: string;
  weekCount: number;
}

interface GroupClassCloneEditorProps {
  group: Group;
  allClasses: GroupClass[];
  targetMonth: string;
  onClose: () => void;
  onComplete: () => void;
}

const GroupClassCloneEditor: React.FC<GroupClassCloneEditorProps> = ({
  group,
  allClasses,
  targetMonth,
  onClose,
  onComplete,
}) => {
  const { t } = useLanguage();
  const [isCloning, setIsCloning] = useState(false);
  const [sourceMonthOffset, setSourceMonthOffset] = useState(-1);
  const [candidates, setCandidates] = useState<CloneCandidate[]>([]);

  const sourceMonthStr = useMemo(() => {
    const [y, m] = targetMonth.split('-').map(Number);
    const d = new Date(y, m - 1 + sourceMonthOffset, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }, [targetMonth, sourceMonthOffset]);

  const sourceDisplay = useMemo(() => {
    const [y, m] = sourceMonthStr.split('-').map(Number);
    return `${MONTH_NAMES[m - 1]} ${y}`;
  }, [sourceMonthStr]);

  const targetDisplay = useMemo(() => {
    const [y, m] = targetMonth.split('-').map(Number);
    return `${MONTH_NAMES[m - 1]} ${y}`;
  }, [targetMonth]);

  const sourceClasses = useMemo(() => {
    return allClasses.filter(c => c.targetMonth === sourceMonthStr);
  }, [allClasses, sourceMonthStr]);

  useEffect(() => {
    const [ty, tm] = targetMonth.split('-').map(Number);
    setCandidates(sourceClasses.map(cls => {
      const firstDate = cls.schedule[0]?.date || '';
      const mappedStart = firstDate ? mapDateToTargetMonth(firstDate, ty, tm - 1) : '';
      const firstTimeSlot = cls.schedule[0]?.timeSlot || '19:00 - 21:00';
      return {
        sourceClass: cls,
        selected: true,
        startDate: mappedStart,
        timeSlot: firstTimeSlot,
        weekCount: cls.schedule.length || 1
      };
    }));
  }, [sourceClasses, targetMonth]);

  const toggleCandidate = useCallback((idx: number) => {
    setCandidates(prev => prev.map((c, i) => i === idx ? { ...c, selected: !c.selected } : c));
  }, []);

  const updateStartDate = useCallback((idx: number, val: string) => {
    setCandidates(prev => prev.map((c, i) => i === idx ? { ...c, startDate: val } : c));
  }, []);

  const updateTimeSlot = useCallback((idx: number, pos: 'start' | 'end', val: string) => {
    setCandidates(prev => prev.map((c, i) => {
      if (i !== idx) return c;
      const parts = (c.timeSlot || '19:00 - 21:00').split(' - ');
      if (pos === 'start') parts[0] = val; else parts[1] = val;
      return { ...c, timeSlot: parts.join(' - ') };
    }));
  }, []);

  const groupedByDay = useMemo(() => {
    const map: Record<number, number[]> = {};
    candidates.forEach((c, idx) => {
      const firstDate = c.sourceClass.schedule[0]?.date;
      if (!firstDate) return;
      const day = new Date(firstDate + 'T00:00:00').getDay();
      if (!map[day]) map[day] = [];
      map[day].push(idx);
    });
    return Object.keys(map).map(Number)
      .sort((a, b) => ((a || 7) - (b || 7)))
      .map(day => ({ day, indices: map[day] }));
  }, [candidates]);

  const selectedCount = candidates.filter(c => c.selected).length;
  const isSameMonth = sourceMonthStr === targetMonth;

  const handleClone = async () => {
    const selected = candidates.filter(c => c.selected);
    if (!selected.length) {
      toast.error(t('toast.class.no_classes_selected'));
      return;
    }

    setIsCloning(true);
    try {
      for (const candidate of selected) {
        const { sourceClass, startDate, timeSlot, weekCount } = candidate;
        const schedule = buildSchedule(startDate, timeSlot, weekCount, sourceClass.schedule);
        const clone: Partial<GroupClass> = { ...sourceClass };
        clone.id = uuidv4();
        clone.targetMonth = targetMonth;
        clone.schedule = schedule;
        clone.status = 'Open';
        delete (clone as any).createdAt;
        delete (clone as any).updatedAt;
        delete (clone as any).todayLeaderRemaining;
        delete (clone as any).todayFollowerRemaining;
        delete (clone as any).isTodayBookingClosed;
        await groupService.addClass(group.id, clone);
      }
      toast.success(`${selected.length} classes cloned to ${targetDisplay}.`);
      onComplete();
      onClose();
    } catch (err) {
      console.error("Clone failed:", err);
      toast.error(t('toast.class.clone_failed'));
    } finally {
      setIsCloning(false);
    }
  };

  if (typeof window === "undefined") return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: "100%" }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: "100%" }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="fixed inset-0 z-[110] bg-white flex items-center justify-center font-['Plus_Jakarta_Sans']"
    >
      <main className="max-w-md w-full h-[100dvh] bg-white flex flex-col overflow-hidden relative text-left">
        {/* Header */}
        <div className="flex-shrink-0 bg-white border-b border-slate-100 px-4 h-14 flex items-center justify-between z-50">
          <button type="button" onClick={onClose} className="w-10 h-10 flex items-center justify-center -ml-2 active:scale-95 transition-transform text-slate-700">
            <span className="material-symbols-rounded text-2xl">arrow_back</span>
          </button>
          <h1 className="text-[14px] font-black uppercase tracking-widest text-slate-800">
            {t("group.class.clone_title") || "CLONE CLASSES"}
          </h1>
          <div className="w-10" />
        </div>

        <form onSubmit={(e) => { e.preventDefault(); handleClone(); }} className="flex-1 flex flex-col overflow-hidden">
          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto px-4 mt-4 space-y-6 pb-6 text-left no-scrollbar">
            
            {/* Navigation & Target warning */}
            <div className="space-y-4">
              {/* Month Navigation */}
              <div className="bg-[#f8f9fa] border border-[#e0e4e5] rounded-xl p-4 flex flex-col items-center justify-center">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">{t("group.class.clone_from") || "CLONE FROM"}</p>
                <div className="flex items-center justify-between w-full">
                  <button type="button" onClick={() => setSourceMonthOffset(p => p - 1)} className="p-2 hover:bg-white rounded-full transition-all border border-transparent hover:border-slate-100 shadow-none hover:shadow-sm active:scale-95">
                    <span className="material-symbols-rounded text-slate-600">chevron_left</span>
                  </button>
                  <h2 className="text-base font-bold text-slate-800">{sourceDisplay}</h2>
                  <button type="button" onClick={() => setSourceMonthOffset(p => p + 1)} className="p-2 hover:bg-white rounded-full transition-all border border-transparent hover:border-slate-100 shadow-none hover:shadow-sm active:scale-95">
                    <span className="material-symbols-rounded text-slate-600">chevron_right</span>
                  </button>
                </div>
              </div>

              {/* Arrow Info & Target */}
              <div className="flex items-center justify-center gap-2">
                <span className="material-symbols-rounded text-primary text-base">arrow_downward</span>
                <span className="text-[10px] font-bold text-primary bg-primary/5 border border-primary/10 px-3 py-1 rounded-full">
                  {t("group.class.clone_to")?.replace("{target}", targetDisplay) || `Clone to ${targetDisplay}`}
                </span>
              </div>

              {/* Same Month Warning */}
              {isSameMonth && (
                <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                  <span className="material-symbols-rounded text-amber-500 text-[18px] shrink-0 mt-0.5">warning</span>
                  <p className="text-[12px] font-bold text-amber-700 leading-normal">
                    Source and target are the same month. Classes will be duplicated.
                  </p>
                </div>
              )}

              {/* No items fallback */}
              {sourceClasses.length === 0 && (
                <div className="bg-[#f8f9fa] border border-dashed border-[#e0e4e5] rounded-xl p-8 text-center flex flex-col items-center justify-center">
                  <span className="material-symbols-rounded text-slate-300 text-3xl mb-2">inbox</span>
                  <p className="text-slate-400 font-bold text-xs">No classes found in {sourceDisplay}.</p>
                  <p className="text-slate-300 text-[10px] mt-1 font-medium">Try navigating to another month.</p>
                </div>
              )}
            </div>

            {/* Candidates List */}
            {groupedByDay.map(({ day, indices }) => (
              <div key={day} className="space-y-3">
                {/* Day Header */}
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center shrink-0">
                    <span className="text-[9px] font-black text-white uppercase">{DAY_NAMES[day].slice(0, 3)}</span>
                  </div>
                  <div className="flex-1 h-px bg-slate-100" />
                </div>

                <div className="space-y-3">
                  {indices.map(idx => {
                    const c = candidates[idx];
                    if (!c) return null;
                    const cls = c.sourceClass;
                    const dayLabel = c.startDate ? DAY_NAMES[new Date(c.startDate + 'T00:00:00').getDay()] : '';
                    const timeParts = (c.timeSlot || '19:00 - 21:00').split(' - ');
                    
                    return (
                      <div
                        key={cls.id}
                        className={`bg-white rounded-xl border transition-all duration-200 overflow-hidden ${
                          c.selected 
                            ? 'border-primary shadow-sm shadow-primary/5' 
                            : 'border-[#e0e4e5] opacity-50'
                        }`}
                      >
                        {/* Top Select Header */}
                        <div className="flex items-start gap-3 p-4 pb-2">
                          <button
                            type="button"
                            onClick={() => toggleCandidate(idx)}
                            className="mt-0.5 shrink-0 active:scale-95 transition-transform"
                          >
                            <span className={`material-symbols-rounded text-xl ${c.selected ? 'text-primary' : 'text-slate-300'}`}>
                              {c.selected ? 'check_circle' : 'radio_button_unchecked'}
                            </span>
                          </button>
                          
                          <div className="flex-1 min-w-0 text-left">
                            <h3 className="text-sm font-bold text-slate-800 leading-tight">{cls.title}</h3>
                            {cls.instructors?.length > 0 && (
                              <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                                {cls.instructors.map(i => i.name).join(' · ')}
                              </p>
                            )}
                            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                              <span className="text-[9px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded uppercase">{cls.level}</span>
                              <span className="text-[9px] font-bold text-slate-500">{cls.currency} {cls.amount?.toLocaleString()}</span>
                              <span className="text-[9px] font-semibold text-slate-300">· {c.weekCount} weeks</span>
                            </div>
                          </div>
                        </div>

                        {/* Setup Fields (Only if selected) */}
                        {c.selected && (
                          <div className="px-4 pb-4 pt-1.5 space-y-2 border-t border-slate-50 mt-2 bg-[#f8f9fa]">
                            {/* Date Field */}
                            <div className="flex items-center gap-2">
                              <span className="material-symbols-rounded text-slate-400 text-[16px] shrink-0">event</span>
                              <input
                                type="date"
                                value={c.startDate}
                                onChange={e => updateStartDate(idx, e.target.value)}
                                className="flex-1 bg-white border border-[#e0e4e5] rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-700 focus:border-primary outline-none transition-all"
                              />
                              <span className="text-xs font-bold text-slate-400 shrink-0 w-8 text-right">{dayLabel}</span>
                            </div>
                            {/* Time Field */}
                            <div className="flex items-center gap-2">
                              <span className="material-symbols-rounded text-slate-400 text-[16px] shrink-0">schedule</span>
                              <input
                                type="time"
                                value={timeParts[0] || '19:00'}
                                onChange={e => updateTimeSlot(idx, 'start', e.target.value)}
                                className="flex-1 bg-white border border-[#e0e4e5] rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-700 focus:border-primary outline-none transition-all"
                              />
                              <span className="text-slate-300 text-xs font-bold shrink-0">—</span>
                              <input
                                type="time"
                                value={timeParts[1] || '21:00'}
                                onChange={e => updateTimeSlot(idx, 'end', e.target.value)}
                                className="flex-1 bg-white border border-[#e0e4e5] rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-700 focus:border-primary outline-none transition-all"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Submit Save Floating Bar */}
          {sourceClasses.length > 0 && (
            <div className="flex-shrink-0 w-full p-4 border-t border-slate-100 bg-white pb-[calc(1rem+env(safe-area-inset-bottom))] z-50">
              <button
                type="submit"
                disabled={isCloning || selectedCount === 0}
                className="w-full bg-primary text-white font-bold py-3.5 rounded-xl shadow-lg shadow-primary/20 active:scale-[0.98] transition-transform disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isCloning ? (
                  <>
                    <span className="material-symbols-rounded animate-spin text-sm">progress_activity</span>
                    {t("common.saving") || "Cloning..."}
                  </>
                ) : (
                  <>
                    <span className="material-symbols-rounded text-lg">content_copy</span>
                    {t("group.class.clone_count_classes")?.replace("{count}", String(selectedCount)) || `Clone ${selectedCount} Classes`}
                  </>
                )}
              </button>
            </div>
          )}
        </form>
      </main>
    </motion.div>
  );
};

export default GroupClassCloneEditor;
