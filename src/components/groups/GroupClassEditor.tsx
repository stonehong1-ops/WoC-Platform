// 클래스 스케줄 및 번들 할인 목록을 관리하고 에디터를 매핑하는 메인 대시보드 컴포넌트
import React, { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Group, GroupClass, ClassDiscount } from "@/types/group";
import { groupService } from "@/lib/firebase/groupService";
import { db } from "@/lib/firebase/clientApp";
import { wocClassService } from '@/lib/firebase/wocClassService';
import { WocClass } from '@/types/class';
import { motion, AnimatePresence } from "framer-motion";
import { doc, writeBatch, deleteField, Timestamp } from "firebase/firestore";

import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";
import { useBackButtonClose } from "@/hooks/useBackButtonClose";
import GroupClassAddEditor from "./GroupClassAddEditor";
import GroupClassDiscountEditor from "./GroupClassDiscountEditor";
import GroupClassCloneEditor from "./GroupClassCloneEditor";
import GroupClassScheduleImageModal from "./GroupClassScheduleImageModal";

interface GroupClassEditorProps {
  group: Group;
  onSave?: () => void;
  onClose?: () => void;
  isInline?: boolean;
}
const DAY_ORDER = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'] as const;

const INSTRUCTOR_NAME_MAP: { [key: string]: string } = {
  'Aran': '아란',
  'Stone Hong': '스톤 홍',
  'Ariskim': '아리스킴',
  'Muse': '뮤즈',
  'Vicky': '비키',
  'Epitone': '에피톤',
  'EUN JU CHOI': '최은주',
  'Ellin': '엘린',
  'Basil': '바질',
  'May': '메이',
  'Dandoon_Hyeyoung': '단둔 혜영',
  'Yun': '윤'
};

const ROLE_MAP: { [key: string]: string } = {
  'Lead Instructor': '대표 강사',
  'Instructor': '강사',
  'TBD': '미정'
};

const getKoreanName = (engName: string): string => {
  return INSTRUCTOR_NAME_MAP[engName] || engName;
};

const getKoreanRole = (engRole: string): string => {
  return ROLE_MAP[engRole] || engRole;
};

const DAY_NAMES_KR: { [key: string]: string } = {
  'MON': '월요일',
  'TUE': '화요일',
  'WED': '수요일',
  'THU': '목요일',
  'FRI': '금요일',
  'SAT': '토요일',
  'SUN': '일요일'
};

function getDayOfWeek(dateStr: string): string {
  if (!dateStr) return '';
  const cleanDate = dateStr.replace(/\./g, '-');
  const d = new Date(cleanDate);
  if (isNaN(d.getTime())) return '';
  return ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'][d.getDay()];
}

const getClassDay = (cls: any): string => {
  if (cls.schedule && cls.schedule.length > 0) {
    const day = getDayOfWeek(cls.schedule[0].date);
    return day || 'MON';
  }
  return 'MON';
};

const getDayIndex = (day: string) => {
  const idx = DAY_ORDER.indexOf(day as any);
  return idx === -1 ? 99 : idx;
};

type EditorType = 'add-class' | 'discount' | 'clone';

interface EditingState {
  type: EditorType;
  data: any;
}

const GroupClassEditor: React.FC<GroupClassEditorProps> = ({ group, onSave, onClose, isInline }) => {
  const { t, language, formatDate } = useLanguage();
  const router = useRouter();
  const [editingState, setEditingState] = useState<EditingState | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [isFullScreenTextOpen, setIsFullScreenTextOpen] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  const closeEditing = useCallback(() => setEditingState(null), []);
  const closeFullScreenText = useCallback(() => setIsFullScreenTextOpen(false), []);
  const closeImageModal = useCallback(() => setIsImageModalOpen(false), []);

  useBackButtonClose(!!editingState, closeEditing);
  useBackButtonClose(isFullScreenTextOpen, closeFullScreenText);
  useBackButtonClose(isImageModalOpen, closeImageModal);

  const generateScheduleText = () => {
    let text = "";

    // 1. 번들
    if (filteredDiscounts.length > 0) {
      text += `🎁 [${formatDate(currentDate, 'monthYear')} 번들 및 패키지 목록]\n`;
      text += `────────────────────\n\n`;
      filteredDiscounts.forEach(d => {
        text += `📌 ${d.title}\n`;
        text += `   • 가격: ${d.amount === 0 ? (t('group.class.free') || '무료') : `${d.amount.toLocaleString()} KRW`}\n`;
        if (d.description) {
          const cleanDesc = d.description.replace(/\*\*/g, '').replace(/##/g, '').replace(/\*/g, '').replace(/#/g, '').trim();
          text += `   • 설명: ${cleanDesc}\n`;
        }
        text += "\n";
      });
      text += "\n";
    }

    // 2. 요일별 수업
    const classesByDay: { [key: string]: typeof sortedClasses } = {
      MON: [], TUE: [], WED: [], THU: [], FRI: [], SAT: [], SUN: []
    };

    sortedClasses.forEach(cls => {
      const day = getClassDay(cls);
      if (classesByDay[day]) {
        classesByDay[day].push(cls);
      } else {
        classesByDay['MON'].push(cls);
      }
    });

    DAY_ORDER.forEach(day => {
      const dayClasses = classesByDay[day];
      if (dayClasses.length > 0) {
        text += `────────────────────\n`;
        text += `📅 ${DAY_NAMES_KR[day]} 수업\n`;
        text += `────────────────────\n\n`;

        dayClasses.forEach(c => {
          const instructorsStr = c.instructors
            ? c.instructors.map(i => getKoreanName(i.name)).join(", ")
            : (t('group.class.tbd') || '미정');
          
          text += `📖 ${c.title}\n`;
          text += `👤 강사: ${instructorsStr}\n`;
          
          if (c.schedule && c.schedule.length > 0) {
            const days = c.schedule.map(s => {
              if (!s.date) return "";
              const cleanDate = s.date.replace(/\./g, '-');
              const parts = cleanDate.split('-');
              return parts.length === 3 ? parseInt(parts[2], 10) : "";
            }).filter(x => x !== "");
            const daysStr = days.join(", ");
            const first = c.schedule[0];
            const timeSlot = first.timeSlot || "";
            const scheduleSummary = `${daysStr}일 (${timeSlot})`;
            text += `🗓️ 일정: ${scheduleSummary}\n`;
            
            c.schedule.forEach((s, idx) => {
              const weekIndex = s.week || (idx + 1);
              const weekLabel = `${weekIndex}주차`;
              let contentRaw = s.content ? s.content.replace(/\n/g, " ") : "";
              let cleaned = contentRaw
                .replace(/\*\*/g, '')
                .replace(/##/g, '')
                .replace(/\*/g, '')
                .replace(/#/g, '')
                .trim();
              
              const duplicatePattern = new RegExp(`^(##\\s*)?(${weekIndex}주차|${weekIndex}주|테마0?${weekIndex})\\.?\\s*[*"\\s]*`, 'i');
              cleaned = cleaned.replace(duplicatePattern, '');
              cleaned = cleaned.replace(/^["'\s-\.]*/, '').replace(/["'\s]*$/, '').trim();
              
              const finalContent = cleaned || "내용 없음";
              text += `   • ${weekLabel}: ${finalContent}\n`;
            });
          } else {
            text += `🗓️ 일정: 등록된 일정이 없습니다.\n`;
          }
          text += `\n`;
        });
      }
    });

    return text.trim() + "\n";
  };

  const handleCopyAll = () => {
    const text = generateScheduleText();
    navigator.clipboard.writeText(text).then(() => {
      toast.success(t('group.class.copied') || "클립보드에 복사되었습니다.");
    }).catch(err => {
      console.error(err);
      toast.error(t('common.error') || "오류가 발생했습니다.");
    });
  };

  const handleDownloadText = () => {
    const text = generateScheduleText();
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${group.name.replace(/\s+/g, "_")}_${monthDisplay.replace(/\s+/g, "_")}_Schedule.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("수업 일정 텍스트 파일이 저장되었습니다.");
  };

  const [currentDate, setCurrentDate] = useState(() => {
    const d = new Date();
    if (d.getDate() >= 15) {
      d.setMonth(d.getMonth() + 1);
    }
    return d;
  });

  const handlePrevMonth = () => {
    setCurrentDate(prev => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() - 1);
      return d;
    });
  };

  const handleNextMonth = () => {
    setCurrentDate(prev => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() + 1);
      return d;
    });
  };

  const currentMonthStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
  const monthDisplay = formatDate(currentDate, 'monthYear');

  // Real-time data from subcollections
  const [subClasses, setSubClasses] = useState<GroupClass[]>([]);
  const [subDiscounts, setSubDiscounts] = useState<ClassDiscount[]>([]);
  // WocClass 연동 클래스 목록
  const [linkedWocClasses, setLinkedWocClasses] = useState<WocClass[]>([]);

  useEffect(() => {
    // Auto-migration logic for legacy embedded arrays
    const legacyClasses = (group as any)._legacyClasses || [];
    const legacyDiscounts = (group as any)._legacyDiscounts || [];

    if (legacyClasses.length > 0 || legacyDiscounts.length > 0) {
      const migrateData = async () => {
        try {
          const batch = writeBatch(db);
          for (const cls of legacyClasses) {
            batch.set(doc(db, 'groups', group.id, 'classes', cls.id), { ...cls, createdAt: Timestamp.now() });
          }
          for (const discount of legacyDiscounts) {
            batch.set(doc(db, 'groups', group.id, 'discounts', discount.id), { ...discount, createdAt: Timestamp.now() });
          }
          batch.update(doc(db, 'groups', group.id), {
            classes: deleteField(),
            discounts: deleteField()
          });
          await batch.commit();
          toast.success(t('group.class.migrated_success') || "Successfully migrated data to new collections!");
          router.refresh();
        } catch (err) {
          console.error("Migration error:", err);
        }
      };
      migrateData();
    }
  }, [group]);

  useEffect(() => {
    const unsubClasses = groupService.subscribeClasses(group.id, setSubClasses);
    const unsubDiscounts = groupService.subscribeDiscounts(group.id, setSubDiscounts);
    // WocClass 연동 클래스 조회
    wocClassService.getClassesByConnectedGroup(group.id).then(setLinkedWocClasses).catch(console.error);
    return () => {
      unsubClasses();
      unsubDiscounts();
    };
  }, [group.id]);

  // Combine legacy props (if not migrated yet) and real-time subcollections
  // De-duplicate by ID just in case
  const allClasses = [...subClasses, ...(group.classes || []).filter(c => !subClasses.find(sc => sc.id === c.id))];
  const allDiscounts = [...subDiscounts, ...(group.discounts || []).filter(d => !subDiscounts.find(sd => sd.id === d.id))];

  const filteredClasses = allClasses.filter(cls => !cls.targetMonth || cls.targetMonth === currentMonthStr);
  const sortedClasses = [...filteredClasses].sort((a, b) => {
    const dayA = getClassDay(a);
    const dayB = getClassDay(b);
    const idxA = getDayIndex(dayA);
    const idxB = getDayIndex(dayB);
    if (idxA !== idxB) return idxA - idxB;
    const timeA = a.startTime || '00:00';
    const timeB = b.startTime || '00:00';
    return timeA.localeCompare(timeB);
  });
  const filteredDiscounts = allDiscounts.filter((discount: ClassDiscount) => !discount.targetMonth || discount.targetMonth === currentMonthStr);

  const handleDelete = async (type: 'class' | 'discount', id: string) => {
    setActiveMenuId(null);
    if (window.confirm(t('group.class.delete_confirm') || "Are you sure you want to delete this item? This action cannot be undone.")) {
      executeDelete(type, id);
    }
  };

  const isRegistrationOpen = group.classPaymentSettings?.openMonths?.includes(currentMonthStr) || false;

  const handleToggleRegistrationStatus = async (setOpen: boolean) => {
    try {
      setLoading(true);
      const currentOpenMonths = group.classPaymentSettings?.openMonths || [];
      
      let newOpenMonths;
      if (setOpen) {
        newOpenMonths = currentOpenMonths.includes(currentMonthStr) ? currentOpenMonths : [...currentOpenMonths, currentMonthStr];
      } else {
        newOpenMonths = currentOpenMonths.filter((m: string) => m !== currentMonthStr);
      }

      await groupService.updateGroupMetadata(group.id, {
        classPaymentSettings: {
          ...(group.classPaymentSettings || { paymentMethods: { bankTransfer: false, creditCard: false, overseas: false } }),
          openMonths: newOpenMonths
        }
      });
      toast.success(t('group.class.registration_status_updated') || "Registration status updated.");
    } catch (err) {
      console.error(err);
      toast.error(t('common.error') || "An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const executeDelete = async (type: 'class' | 'discount', id: string) => {
    setLoading(true);
    const promise = (async () => {
      if (type === "class") {
        await groupService.deleteClass(group.id, id);
      } else if (type === "discount") {
        await groupService.deleteDiscount(group.id, id);
      }
      setActiveMenuId(null);
      if (onSave) {
        onSave();
      } else {
        router.refresh();
      }
    })();

    toast.promise(promise, {
      loading: t('group.class.deleting') || 'Deleting...',
      success: t('group.class.delete_success') || 'Deleted successfully.',
      error: t('group.class.delete_failed') || 'Failed to delete.',
    });

    try {
      await promise;
    } catch (error) {
      console.error(`Failed to delete ${type}:`, error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (type: EditorType, data: any) => {
    setActiveMenuId(null);
    setEditingState({ type, data });
  };

  // Detect outside clicks to handle closing the menu
  useEffect(() => {
    const handleClickOutside = (e: Event) => {
      if (!(e.target as Element).closest('.action-menu-container')) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener("click", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  const getLevelColor = (level: string) => {
    switch (level?.toLowerCase()) {
      case 'beginner': return 'text-emerald-600 bg-emerald-50';
      case 'intermediate': return 'text-orange-600 bg-orange-50';
      case 'advanced': return 'text-blue-600 bg-blue-50';
      default: return 'text-purple-600 bg-purple-50';
    }
  };

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className={isInline 
          ? "w-full light font-body-md text-on-surface antialiased bg-background flex flex-col no-scrollbar" 
          : "fixed inset-0 z-[100] light font-body-md text-on-surface antialiased bg-background flex flex-col overflow-y-auto no-scrollbar pb-20"
        }
      >
        {/* Top Bar */}
        {!isInline && (
          <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-outline/5">
            <div className="max-w-[896px] mx-auto px-4 py-4 flex items-center justify-between w-full">
              <div className="flex items-center gap-4">
                {onClose && (
                  <button 
                    onClick={onClose}
                    className="w-10 h-10 rounded-full flex items-center justify-center text-primary hover:bg-primary/5 transition-all"
                  >
                    <span className="material-symbols-outlined text-primary">arrow_back</span>
                  </button>
                )}
                <h1 className="text-base font-bold text-on-surface" style={{ fontFamily: "'Inter', sans-serif" }}>
                  {t('group.class.management') || "Class Management"}
                </h1>
              </div>
            </div>
          </header>
        )}

        <main className="flex-1">
          <div className={`max-w-[896px] mx-auto space-y-6 pt-4 ${isInline ? 'pb-24' : 'pb-48 md:pb-32'}`}>
            
            {/* 월 선택 & 수강 마감 체크 심플 헤더 */}
            <section className="px-4 mb-4">
              <div className="bg-white rounded-2xl border border-[#e0e4e5] p-4 shadow-sm flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button onClick={handlePrevMonth} className="w-8 h-8 rounded-lg border border-[#e0e4e5] bg-[#f8f9fa] hover:bg-white flex items-center justify-center text-slate-700 active:scale-95 transition-all">
                    <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                  </button>
                  <h2 className="text-base font-bold text-slate-800 px-1">{monthDisplay}</h2>
                  <button onClick={handleNextMonth} className="w-8 h-8 rounded-lg border border-[#e0e4e5] bg-[#f8f9fa] hover:bg-white flex items-center justify-center text-slate-700 active:scale-95 transition-all">
                    <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                  </button>
                </div>

                {/* 수강 마감 체크 스위치 */}
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <span className="text-xs font-bold text-slate-700">수강 마감</span>
                  <input
                    type="checkbox"
                    checked={!isRegistrationOpen}
                    onChange={(e) => handleToggleRegistrationStatus(!e.target.checked)}
                    disabled={loading}
                    className="w-4 h-4 text-[#007AFF] rounded border-[#e0e4e5] focus:ring-0 cursor-pointer"
                  />
                </label>
              </div>
            </section>

            {/* 3개 심플 액션 버튼: 수업등록, 번들등록, 지난달참조 */}
            <section className="px-4 mb-5">
              <div className="grid grid-cols-3 gap-2.5">
                <button
                  onClick={() => setEditingState({ type: 'add-class', data: null })}
                  className="py-3 px-3 bg-[#007AFF] hover:bg-[#0066CC] text-white rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold transition-all shadow-sm active:scale-95"
                >
                  <span className="material-symbols-outlined text-[16px]">add_circle</span>
                  <span>수업 등록</span>
                </button>
                <button
                  onClick={() => setEditingState({ type: 'discount', data: null })}
                  className="py-3 px-3 bg-white text-slate-700 border border-[#e0e4e5] hover:bg-slate-50 rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold transition-all shadow-sm active:scale-95"
                >
                  <span className="material-symbols-outlined text-rose-500 text-[16px]">sell</span>
                  <span>번들 등록</span>
                </button>
                <button
                  onClick={() => handleEdit('clone', null)}
                  className="py-3 px-3 bg-white text-slate-700 border border-[#e0e4e5] hover:bg-slate-50 rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold transition-all shadow-sm active:scale-95"
                >
                  <span className="material-symbols-outlined text-primary text-[16px]">difference</span>
                  <span>지난달 참조</span>
                </button>
              </div>
            </section>

            {/* 메인 수업 리스트 (요일별 / 시간순) */}
            <section className="px-4 mb-6 flex flex-col gap-4">
              {/* 번들 패키지 할인 (있는 경우) */}
              {filteredDiscounts.length > 0 && (
                <div className="space-y-3 mb-2">
                  <div className="flex items-center gap-2 px-1">
                    <span className="material-symbols-outlined text-rose-500 text-sm">card_membership</span>
                    <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      {t('group.class.bundle_discount') || '번들 할인 패키지'} ({filteredDiscounts.length})
                    </h3>
                  </div>
                  {filteredDiscounts.map((discount: ClassDiscount) => (
                    <div key={discount.id} className="bg-white rounded-2xl shadow-sm border border-[#e0e4e5] p-4 flex items-start justify-between gap-3 hover:border-rose-300 transition-all">
                      <div className="flex-grow space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-100">
                            {t('group.class.bundle_badge') || '패키지'}
                          </span>
                          <h4 className="text-sm font-bold text-slate-800">{discount.title}</h4>
                        </div>
                        {discount.includedClassIds && discount.includedClassIds.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-0.5">
                            {discount.includedClassIds.map((classId: string) => {
                              const cls = allClasses.find(c => c.id === classId);
                              return cls ? (
                                <span key={classId} className="text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-semibold">
                                  {cls.title}
                                </span>
                              ) : null;
                            })}
                          </div>
                        )}
                        <div className="text-xs font-bold text-[#007AFF] pt-1">
                          {discount.amount === 0 ? (t('group.class.free') || '무료') : `${discount.currency === 'KRW' ? '₩' : discount.currency} ${discount.amount.toLocaleString()}`}
                        </div>
                      </div>
                      <div className="relative action-menu-container">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenuId(activeMenuId === discount.id ? null : discount.id);
                          }}
                          className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
                        >
                          <span className="material-symbols-outlined text-[18px]">more_vert</span>
                        </button>
                        {activeMenuId === discount.id && (
                          <div className="absolute right-0 mt-1 w-28 bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden z-20 py-1">
                            <button onClick={() => handleEdit('discount', discount)} className="w-full px-4 py-2 text-left text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors">{t('common.edit') || "수정"}</button>
                            <button onClick={() => handleDelete('discount', discount.id)} className="w-full px-4 py-2 text-left text-xs font-bold text-red-600 hover:bg-red-50 transition-colors">{t('common.delete') || "삭제"}</button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* 정규 클래스 요일별 / 시간순 그룹화 렌더링 */}
              {(() => {
                const classesByDay: { [key: string]: typeof sortedClasses } = {
                  MON: [], TUE: [], WED: [], THU: [], FRI: [], SAT: [], SUN: []
                };

                sortedClasses.forEach(cls => {
                  const day = getClassDay(cls);
                  if (classesByDay[day]) {
                    classesByDay[day].push(cls);
                  } else {
                    classesByDay['MON'].push(cls);
                  }
                });

                // 요일 내부에서 시간순 정렬
                DAY_ORDER.forEach(day => {
                  classesByDay[day].sort((a, b) => {
                    const timeA = a.schedule?.[0]?.timeSlot?.split(" - ")[0] || "00:00";
                    const timeB = b.schedule?.[0]?.timeSlot?.split(" - ")[0] || "00:00";
                    return timeA.localeCompare(timeB);
                  });
                });

                const hasAnyClasses = DAY_ORDER.some(day => classesByDay[day].length > 0);

                if (!hasAnyClasses && filteredDiscounts.length === 0) {
                  return (
                    <div className="bg-white border border-dashed border-slate-200 rounded-2xl p-10 text-center flex flex-col items-center justify-center">
                      <span className="material-symbols-outlined text-slate-300 text-4xl mb-2">event_busy</span>
                      <p className="text-slate-500 font-bold text-sm">{t('group.class.no_items') || "등록된 클래스가 없습니다."}</p>
                    </div>
                  );
                }

                return DAY_ORDER.map(day => {
                  const dayClasses = classesByDay[day];
                  if (dayClasses.length === 0) return null;

                  return (
                    <div key={day} className="space-y-3 mb-2">
                      <div className="flex items-center gap-2 px-1 pt-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#007AFF]" />
                        <h3 className="text-xs font-bold text-slate-800 tracking-wide">
                          {DAY_NAMES_KR[day]} ({day}) 클래스 ({dayClasses.length})
                        </h3>
                      </div>

                      <div className="space-y-2.5">
                        {dayClasses.map(cls => {
                          const firstSchedule = cls.schedule?.[0];
                          const startTime = firstSchedule?.timeSlot?.split(" - ")[0] || "";
                          const endTime = firstSchedule?.timeSlot?.split(" - ")[1] || "";
                          const timeDisplay = startTime && endTime ? `${startTime} ~ ${endTime}` : (firstSchedule?.timeSlot || "시간 미정");
                          
                          // 등록된 모든 강사 전원 명시 (콤마 구분)
                          const allInstructorsStr = cls.instructors && cls.instructors.length > 0
                            ? cls.instructors.map(i => getKoreanName(i.name)).join(", ")
                            : (t('group.class.tbd') || '강사 미정');

                          return (
                            <div key={cls.id} className="bg-white rounded-2xl border border-[#e0e4e5] p-4 shadow-sm hover:border-[#007AFF]/40 transition-all space-y-3">
                              <div className="flex items-start justify-between gap-3">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <span className="text-[11px] font-bold text-[#007AFF] bg-[#007AFF]/10 px-2.5 py-0.5 rounded-full">
                                      ⏰ {timeDisplay}
                                    </span>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getLevelColor(cls.level)}`}>
                                      {cls.level || 'All Levels'}
                                    </span>
                                  </div>
                                  <h4 className="text-base font-bold text-slate-800 pt-0.5">{cls.title}</h4>
                                </div>

                                <div className="relative action-menu-container shrink-0">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActiveMenuId(activeMenuId === cls.id ? null : cls.id);
                                    }}
                                    className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
                                  >
                                    <span className="material-symbols-outlined text-[18px]">more_vert</span>
                                  </button>
                                  {activeMenuId === cls.id && (
                                    <div className="absolute right-0 mt-1 w-28 bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden z-20 py-1">
                                      <button onClick={() => handleEdit('add-class', cls)} className="w-full px-4 py-2 text-left text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors">{t('common.edit') || "수정"}</button>
                                      <button onClick={() => handleDelete('class', cls.id)} className="w-full px-4 py-2 text-left text-xs font-bold text-red-600 hover:bg-red-50 transition-colors">{t('common.delete') || "삭제"}</button>
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                                <div className="flex items-center gap-1.5 text-slate-600 font-medium">
                                  <span className="material-symbols-outlined text-[15px] text-slate-400">person</span>
                                  <span>강사: <strong className="text-slate-800">{allInstructorsStr}</strong></span>
                                </div>
                                <div className="text-sm font-bold text-slate-900">
                                  {cls.amount === 0 ? (t('group.class.free') || '무료') : `${cls.currency === 'KRW' ? '₩' : cls.currency} ${cls.amount.toLocaleString()}`}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                });
              })()}

              {(filteredClasses.length > 0 || filteredDiscounts.length > 0) && (
                <div className="grid grid-cols-2 gap-2.5 mt-2">
                  <button
                    onClick={() => setIsImageModalOpen(true)}
                    className="py-3 px-4 bg-white text-[#007AFF] border border-[#007AFF]/30 hover:bg-[#007AFF]/5 rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold transition-all shadow-sm active:scale-95"
                  >
                    <span className="material-symbols-outlined text-[18px]">image</span>
                    <span>이미지로 보기 & 저장</span>
                  </button>
                  <button
                    onClick={() => setIsFullScreenTextOpen(true)}
                    className="py-3 px-4 bg-white text-slate-700 hover:bg-slate-50 border border-[#e0e4e5] rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold transition-all shadow-sm active:scale-95"
                  >
                    <span className="material-symbols-outlined text-slate-500 text-[18px]">assignment</span>
                    <span>텍스트 복사</span>
                  </button>
                </div>
              )}
            </section>
          </div>
        </main>

      {/* Editors Overlay */}
      <>
        {editingState?.type === "add-class" && (
          <GroupClassAddEditor
            group={group}
            initialData={editingState.data}
            onClose={() => setEditingState(null)}
            onSave={() => {
              setEditingState(null);
            }}
            targetMonth={currentMonthStr}
          />
        )}
        {editingState?.type === "discount" && (
          <GroupClassDiscountEditor
            group={group}
            allClasses={allClasses}
            initialData={editingState.data}
            onClose={() => setEditingState(null)}
            onSave={() => {
              setEditingState(null);
            }}
            targetMonth={currentMonthStr}
          />
        )}
        {editingState?.type === "clone" && (
          <GroupClassCloneEditor
            group={group}
            allClasses={allClasses}
            targetMonth={currentMonthStr}
            onClose={() => setEditingState(null)}
            onComplete={() => {
              setEditingState(null);
            }}
          />
        )}
      </>

      {/* Image Schedule Modal */}
      <AnimatePresence>
        {isImageModalOpen && (
          <GroupClassScheduleImageModal
            group={group}
            monthDisplay={monthDisplay}
            sortedClasses={sortedClasses}
            filteredDiscounts={filteredDiscounts}
            onClose={() => setIsImageModalOpen(false)}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {isFullScreenTextOpen && (
          <motion.div
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[1000] bg-white flex flex-col items-center justify-center font-['Inter',sans-serif] overflow-hidden"
          >
            <main className="w-full max-w-[896px] h-[100dvh] flex flex-col bg-[#f8f9fa] relative text-left pt-[env(safe-area-inset-top,0px)] pb-[env(safe-area-inset-bottom,0px)]">
              {/* Header */}
              <div className="flex-shrink-0 bg-white border-b border-[#e0e4e5] px-4 h-14 flex items-center justify-between z-50 sticky top-0 shadow-sm">
                <button 
                  onClick={() => setIsFullScreenTextOpen(false)}
                  className="w-10 h-10 flex items-center justify-center -ml-2 active:scale-95 transition-transform text-slate-700"
                >
                  <span className="material-symbols-rounded text-2xl">arrow_back</span>
                </button>
                <h1 className="text-base font-bold text-slate-800">
                  {monthDisplay} 수업 일정 텍스트
                </h1>
                <button
                  onClick={handleCopyAll}
                  className="px-4 py-1.5 bg-[#007AFF] hover:bg-[#0066CC] text-white rounded-xl flex items-center gap-1.5 text-xs font-bold transition-all shadow-sm active:scale-95"
                >
                  <span className="material-symbols-outlined text-[16px]">content_copy</span>
                  <span>복사</span>
                </button>
              </div>

              {/* Main Area */}
              <div className="flex-1 overflow-y-auto p-4 flex flex-col no-scrollbar">
                <textarea
                  readOnly
                  value={generateScheduleText()}
                  onClick={(e) => (e.target as HTMLTextAreaElement).select()}
                  className="w-full flex-1 min-h-[400px] p-5 bg-white border border-[#e0e4e5] rounded-2xl text-sm font-medium leading-relaxed text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#007AFF]/20 resize-none select-text shadow-sm"
                  style={{ fontFamily: "'Inter', sans-serif" }}
                />
              </div>
            </main>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  </>
  );
};

export default GroupClassEditor;
