"use client";
// 소스 월의 클래스 프로그램을 타겟 월로 요일 기반 복제하는 풀스크린 에디터

import React, { useState, useMemo, useEffect, useCallback } from "react";
import { Group, GroupClass, ClassScheduleEntry } from "@/types/group";
import { groupService } from "@/lib/firebase/groupService";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";

interface GroupClassCloneEditorProps {
  group: Group;
  allClasses: GroupClass[];
  targetMonth: string;
  onClose: () => void;
  onComplete: () => void;
}

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

const GroupClassCloneEditor: React.FC<GroupClassCloneEditorProps> = ({
  group, allClasses, targetMonth, onClose, onComplete
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
    if (!selected.length) { toast.error("No classes selected."); return; }

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
      toast.error("Failed to clone classes.");
    } finally {
      setIsCloning(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed inset-0 z-[100] antialiased text-gray-900 bg-[#F3F4F6] flex flex-col overflow-y-auto no-scrollbar font-['Plus_Jakarta_Sans'] pb-28"
    >
      <header className="sticky top-0 z-50 bg-[#F3F4F6]/80 backdrop-blur-xl border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <button onClick={onClose} className="w-10 h-10 rounded-full flex items-center justify-center text-[#0057bd] hover:bg-[#0057bd]/5 transition-all">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h1 className="text-base font-bold text-gray-900">Clone Classes</h1>
        </div>
      </header>

      <main className="max-w-7xl w-full mx-auto px-4 py-6 flex-1">
        {/* Source Month Navigation */}
        <section className="mb-4 bg-white rounded-[16px] shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-4 py-2 bg-gray-50/50">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">Clone from</p>
          </div>
          <div className="flex items-center justify-between px-4 py-3">
            <button onClick={() => setSourceMonthOffset(p => p - 1)} className="p-2 hover:bg-gray-50 rounded-full transition-colors active:scale-95">
              <span className="material-symbols-outlined text-gray-600">chevron_left</span>
            </button>
            <h2 className="text-lg font-bold text-gray-900">{sourceDisplay}</h2>
            <button onClick={() => setSourceMonthOffset(p => p + 1)} className="p-2 hover:bg-gray-50 rounded-full transition-colors active:scale-95">
              <span className="material-symbols-outlined text-gray-600">chevron_right</span>
            </button>
          </div>
        </section>

        <div className="mb-6 flex items-center justify-center gap-2">
          <span className="material-symbols-outlined text-[#0057bd] text-lg">arrow_downward</span>
          <span className="text-xs font-bold text-[#0057bd] bg-blue-50 px-3 py-1 rounded-full">Clone to {targetDisplay}</span>
        </div>

        {isSameMonth && (
          <div className="mb-4 flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            <span className="material-symbols-outlined text-amber-500 text-lg">warning</span>
            <p className="text-xs font-bold text-amber-700">Source and target are the same month. Classes will be duplicated.</p>
          </div>
        )}

        {sourceClasses.length === 0 && (
          <div className="bg-white border-2 border-dashed border-gray-200 rounded-[16px] p-10 text-center">
            <span className="material-symbols-outlined text-gray-300 text-4xl mb-2">inbox</span>
            <p className="text-gray-400 font-bold text-sm">No classes found in {sourceDisplay}.</p>
            <p className="text-gray-300 text-xs mt-1">Try navigating to another month.</p>
          </div>
        )}

        {/* Grouped Class List */}
        {groupedByDay.map(({ day, indices }) => (
          <div key={day} className="mb-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-full bg-gray-900 flex items-center justify-center">
                <span className="text-[10px] font-black text-white">{DAY_NAMES[day]}</span>
              </div>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            <div className="space-y-3">
              {indices.map(idx => {
                const c = candidates[idx];
                if (!c) return null;
                const cls = c.sourceClass;
                const dayLabel = c.startDate ? DAY_NAMES[new Date(c.startDate + 'T00:00:00').getDay()] : '';
                const timeParts = (c.timeSlot || '19:00 - 21:00').split(' - ');
                return (
                  <div key={cls.id} className={`bg-white rounded-[14px] shadow-sm border transition-all ${c.selected ? 'border-[#0057bd]/30 ring-1 ring-[#0057bd]/10' : 'border-gray-100 opacity-50'}`}>
                    <div className="flex items-start gap-3 p-4 pb-2">
                      <button onClick={() => toggleCandidate(idx)} className="mt-0.5 shrink-0">
                        <span className={`material-symbols-outlined text-xl ${c.selected ? 'text-[#0057bd]' : 'text-gray-300'}`}>
                          {c.selected ? 'check_circle' : 'radio_button_unchecked'}
                        </span>
                      </button>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-bold text-gray-900 leading-tight">{cls.title}</h3>
                        {cls.instructors?.length > 0 && (
                          <p className="text-[11px] text-gray-400 font-medium mt-0.5">
                            {cls.instructors.map(i => i.name).join(' · ')}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] font-bold text-gray-400 bg-gray-50 px-2 py-0.5 rounded">{cls.level}</span>
                          <span className="text-[10px] font-bold text-gray-400">{cls.currency} {cls.amount?.toLocaleString()}</span>
                          <span className="text-[10px] font-bold text-gray-300">· {c.weekCount} weeks</span>
                        </div>
                      </div>
                    </div>

                    {/* 시작일 + 시간 2줄 표시 */}
                    {c.selected && (
                      <div className="px-4 pb-4 pt-1 space-y-2">
                        <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2.5">
                          <span className="material-symbols-outlined text-gray-400 text-base">event</span>
                          <input
                            type="date"
                            value={c.startDate}
                            onChange={e => updateStartDate(idx, e.target.value)}
                            className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-bold text-gray-700 focus:ring-1 focus:ring-[#0057bd]/30"
                          />
                          <span className="text-xs font-bold text-gray-400">{dayLabel}</span>
                        </div>
                        <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2.5">
                          <span className="material-symbols-outlined text-gray-400 text-base">schedule</span>
                          <input
                            type="time"
                            value={timeParts[0] || '19:00'}
                            onChange={e => updateTimeSlot(idx, 'start', e.target.value)}
                            className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-bold text-gray-700 focus:ring-1 focus:ring-[#0057bd]/30"
                          />
                          <span className="text-gray-400 text-xs font-bold">—</span>
                          <input
                            type="time"
                            value={timeParts[1] || '21:00'}
                            onChange={e => updateTimeSlot(idx, 'end', e.target.value)}
                            className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-bold text-gray-700 focus:ring-1 focus:ring-[#0057bd]/30"
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
      </main>

      {sourceClasses.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-t border-gray-200 px-4 py-4 safe-area-bottom">
          <div className="max-w-7xl mx-auto">
            <button
              onClick={handleClone}
              disabled={isCloning || selectedCount === 0}
              className="w-full py-3.5 bg-[#0057bd] text-white font-bold text-sm rounded-2xl hover:bg-blue-700 transition-all active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center gap-2"
            >
              {isCloning ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Cloning...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-lg">content_copy</span>
                  Clone {selectedCount} {selectedCount === 1 ? 'Class' : 'Classes'}
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default GroupClassCloneEditor;
