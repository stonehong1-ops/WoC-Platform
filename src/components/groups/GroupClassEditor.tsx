// 클래스 스케줄 및 번들 할인 목록을 관리하고 에디터를 매핑하는 메인 대시보드 컴포넌트
import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Group, GroupClass, ClassDiscount } from "@/types/group";
import { groupService } from "@/lib/firebase/groupService";
import { db } from "@/lib/firebase/clientApp";
import { motion, AnimatePresence } from "framer-motion";
import { doc, writeBatch, deleteField, Timestamp } from "firebase/firestore";

import { toast } from "sonner";
import GroupClassAddEditor from "./GroupClassAddEditor";
import GroupClassDiscountEditor from "./GroupClassDiscountEditor";
import GroupClassCloneEditor from "./GroupClassCloneEditor";
import { classRegistrationService } from "@/lib/firebase/classRegistrationService";
import { useRouter } from "next/navigation";
import { GroupClassRegistrations } from "./GroupClassRegistrations";
import { GroupClassStats } from "./GroupClassStats";
import { useLanguage } from "@/contexts/LanguageContext";

interface GroupClassEditorProps {
  group: Group;
  onSave?: () => void;
  onClose?: () => void;
  isInline?: boolean;
}
const DAY_ORDER = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'] as const;

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
  const [activeTab, setActiveTab] = useState<'register' | 'application' | 'stats'>('register');

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
          <div className={`max-w-[896px] mx-auto space-y-6 ${isInline ? 'pb-24' : 'pb-48 md:pb-32'}`}>
            
            {/* Section Header */}
            <div className="px-4 pt-4 pb-6">
              <div className="mb-2">
                <h2 className="text-[24px] leading-[1.3] font-semibold text-on-surface" style={{ fontFamily: "'Inter', sans-serif" }}>
                  {t("group.class.management") || "Class Management"}
                </h2>
                <p className="text-[14px] leading-[1.4] tracking-[0.01em] font-medium text-on-surface-variant mt-1" style={{ fontFamily: "'Inter', sans-serif" }}>
                  {t("group.class.subtitle") || "Manage schedules, classes, and registration options."}
                </p>
              </div>
            </div>

            {/* Month Navigation & Visibility */}
            <section className="px-4 mb-6">
              <div className="bg-white rounded-2xl shadow-[0px_10px_30px_rgba(0,0,0,0.03)] border border-white/20 overflow-hidden">
                <div className="px-6 pt-6 pb-4 border-b border-outline/5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-primary text-[20px]">calendar_month</span>
                    </div>
                    <div>
                      <h3 className="text-[16px] leading-[1.6] font-semibold text-on-surface" style={{ fontFamily: "'Inter', sans-serif" }}>
                        {t('group.class.registration_status') || "Registration Status"}
                      </h3>
                      <p className="text-[12px] leading-[1.2] font-medium text-on-surface-variant" style={{ fontFamily: "'Inter', sans-serif" }}>
                        {t('group.class.close_registration_desc') || "Close registration for this month's classes"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  {/* Navigation Row */}
                  <div className="flex items-center justify-between bg-surface-container-low border border-outline/5 p-2 rounded-xl">
                    <button onClick={handlePrevMonth} className="p-2 hover:bg-white rounded-lg transition-all shadow-sm bg-white border border-outline/5 active:scale-95 text-on-surface flex items-center justify-center">
                      <span className="material-symbols-outlined text-[20px]">chevron_left</span>
                    </button>
                    <h2 className="text-[18px] font-bold text-on-surface" style={{ fontFamily: "'Inter', sans-serif" }}>{monthDisplay}</h2>
                    <button onClick={handleNextMonth} className="p-2 hover:bg-white rounded-lg transition-all shadow-sm bg-white border border-outline/5 active:scale-95 text-on-surface flex items-center justify-center">
                      <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                    </button>
                  </div>

                  {/* Status Toggle Row */}
                  <div className="flex bg-surface-container-low border border-outline/5 p-1 rounded-xl shadow-inner w-full">
                    <button
                      onClick={() => handleToggleRegistrationStatus(false)}
                      disabled={loading}
                      className={`flex-1 py-2.5 text-[13px] font-bold rounded-lg transition-all ${
                        !isRegistrationOpen
                          ? 'bg-surface-container-highest text-on-surface shadow-sm'
                          : 'text-on-surface-variant/60 hover:text-on-surface hover:bg-surface-container-high'
                      }`}
                      style={{ fontFamily: "'Inter', sans-serif" }}
                    >
                      {t('group.class.status_closed')}
                    </button>
                    <button
                      onClick={() => handleToggleRegistrationStatus(true)}
                      disabled={loading}
                      className={`flex-1 py-2.5 text-[13px] font-bold rounded-lg transition-all ${
                        isRegistrationOpen
                          ? 'bg-primary text-on-primary shadow-sm'
                          : 'text-on-surface-variant/60 hover:text-on-surface hover:bg-surface-container-high'
                      }`}
                      style={{ fontFamily: "'Inter', sans-serif" }}
                    >
                      {t('group.class.status_open')}
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* Tabs Navigation */}
            <section className="px-4 mb-6">
              <div className="flex bg-surface-container-low border border-outline/5 p-1 rounded-xl shadow-inner gap-1">
                <button
                  onClick={() => setActiveTab('register')}
                  className={`flex-1 py-2.5 text-[14px] font-bold rounded-lg transition-colors ${
                    activeTab === 'register' ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant/60 hover:text-on-surface hover:bg-surface-container-high'
                  }`}
                  style={{ fontFamily: "'Inter', sans-serif" }}
                >
                  {t('group.class.register') || "Register"}
                </button>
                <button
                  onClick={() => setActiveTab('application')}
                  className={`flex-1 py-2.5 text-[14px] font-bold rounded-lg transition-colors ${
                    activeTab === 'application' ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant/60 hover:text-on-surface hover:bg-surface-container-high'
                  }`}
                  style={{ fontFamily: "'Inter', sans-serif" }}
                >
                  {t('group.class.application') || "Application"}
                </button>
                <button
                  onClick={() => setActiveTab('stats')}
                  className={`flex-1 py-2.5 text-[14px] font-bold rounded-lg transition-colors ${
                    activeTab === 'stats' ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant/60 hover:text-on-surface hover:bg-surface-container-high'
                  }`}
                  style={{ fontFamily: "'Inter', sans-serif" }}
                >
                  {t('group.class.stats') || "Stats"}
                </button>
              </div>
            </section>

            {activeTab === 'register' && (
              <>
                {/* Action Buttons */}
                <section className="px-4 mb-6">
                  <div className="flex justify-between gap-3">
                    <button
                      onClick={() => setEditingState({ type: 'add-class', data: null })}
                      className="flex-1 flex flex-col items-center justify-center gap-1.5 p-4 bg-white text-on-surface rounded-2xl border border-white/20 shadow-[0px_10px_30px_rgba(0,0,0,0.02)] hover:bg-surface-container-low transition-all active:scale-[0.98] relative group"
                    >
                      <div className="absolute top-3 right-3 w-5 h-5 bg-primary text-on-primary rounded-full flex items-center justify-center text-[10px] font-bold shadow-sm">{filteredClasses.length}</div>
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-105 transition-transform">
                        <span className="material-symbols-outlined text-[20px]">school</span>
                      </div>
                      <span className="text-[12px] font-bold leading-tight text-center" style={{ fontFamily: "'Inter', sans-serif" }}>{t('group.class.class') || "Class"}</span>
                    </button>
                    <button
                      onClick={() => setEditingState({ type: 'discount', data: null })}
                      className="flex-1 flex flex-col items-center justify-center gap-1.5 p-4 bg-white text-on-surface rounded-2xl border border-white/20 shadow-[0px_10px_30px_rgba(0,0,0,0.02)] hover:bg-surface-container-low transition-all active:scale-[0.98] relative group"
                    >
                      <div className="absolute top-3 right-3 w-5 h-5 bg-primary text-on-primary rounded-full flex items-center justify-center text-[10px] font-bold shadow-sm">{filteredDiscounts.length}</div>
                      <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary group-hover:scale-105 transition-transform">
                        <span className="material-symbols-outlined text-[20px]">sell</span>
                      </div>
                      <span className="text-[12px] font-bold leading-tight text-center" style={{ fontFamily: "'Inter', sans-serif" }} dangerouslySetInnerHTML={{ __html: t('group.class.bundle_discount') || "Bundle<br />discount" }} />
                    </button>
                    <button
                      onClick={() => setEditingState({ type: 'clone', data: null })}
                      className="flex-1 flex flex-col items-center justify-center gap-1.5 p-4 bg-white text-on-surface rounded-2xl border border-white/20 shadow-[0px_10px_30px_rgba(0,0,0,0.02)] hover:bg-surface-container-low transition-all active:scale-[0.98] group"
                    >
                      <div className="w-10 h-10 rounded-xl bg-tertiary/10 flex items-center justify-center text-tertiary group-hover:scale-105 transition-transform">
                        <span className="material-symbols-outlined text-[20px]">content_copy</span>
                      </div>
                      <span className="text-[12px] font-bold leading-tight text-center" style={{ fontFamily: "'Inter', sans-serif" }}>{t('group.class.clone')}</span>
                    </button>
                  </div>
                </section>

                {/* List Section */}
                <section className="px-4 mb-6 flex flex-col gap-4">
                  {filteredClasses.length === 0 && filteredDiscounts.length === 0 && (
                    <div className="bg-transparent border-2 border-dashed border-outline/15 rounded-2xl p-10 text-center flex flex-col items-center justify-center">
                      <span className="material-symbols-outlined text-on-surface-variant/30 text-4xl mb-2">inbox</span>
                      <p className="text-on-surface-variant font-bold">{t('group.class.no_items') || "No items registered"}</p>
                    </div>
                  )}

                  {/* Discounts */}
                  {filteredDiscounts.map((discount: ClassDiscount) => (
                    <div key={discount.id} className="bg-white rounded-2xl shadow-[0px_10px_30px_rgba(0,0,0,0.03)] border border-white/20 p-6 flex items-start gap-4 hover:shadow-[0px_15px_40px_rgba(0,0,0,0.05)] transition-all">
                      <div className="flex-grow">
                        <div className="flex justify-between items-start mb-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 bg-rose-50 px-2 py-0.5 rounded-lg">
                              {t('group.class.bundle_badge') || "Bundle"}
                            </span>
                            <span className="text-xs font-bold text-on-surface-variant/40">#D-{discount.id.slice(0, 4)}</span>
                          </div>
                        </div>
                        <h4 className="text-lg font-bold text-on-surface leading-tight mb-2" style={{ fontFamily: "'Inter', sans-serif" }}>{discount.title}</h4>
                        <div className="flex flex-col gap-1 text-sm text-on-surface-variant mb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-on-surface-variant" style={{ fontFamily: "'Inter', sans-serif" }}>
                              {t('group.class.includes_classes')?.replace('{count}', String(discount.includedClassIds?.length || 0)) || `Includes ${discount.includedClassIds?.length || 0} classes`}
                            </span>
                          </div>
                          {discount.includedClassIds && discount.includedClassIds.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {discount.includedClassIds.map((classId: string) => {
                                const cls = allClasses.find(c => c.id === classId);
                                return cls ? (
                                  <span key={classId} className="text-[10px] bg-surface-container-low text-on-surface-variant px-2.5 py-1 rounded-full border border-outline/5 font-semibold">
                                    {cls.title}
                                  </span>
                                ) : null;
                              })}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-outline/5">
                          <div className="flex items-center gap-2">
                            <span className="text-[12px] font-medium text-on-surface-variant" style={{ fontFamily: "'Inter', sans-serif" }}>{t('group.class.discounted_price') || "Discounted Price"}</span>
                          </div>
                          <span className="text-base font-bold text-primary" style={{ fontFamily: "'Inter', sans-serif" }}>{discount.amount === 0 ? t('group.class.free', 'Free') : `${discount.currency === 'KRW' ? '₩' : discount.currency} ${discount.amount.toLocaleString()}`}</span>
                        </div>
                      </div>
                      <div className="relative action-menu-container">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenuId(activeMenuId === discount.id ? null : discount.id);
                          }}
                          className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-surface-container-low transition-all text-on-surface-variant/70"
                        >
                          <span className="material-symbols-outlined text-[20px]">more_vert</span>
                        </button>
                        {activeMenuId === discount.id && (
                          <div className="absolute right-0 mt-1 w-32 bg-white rounded-xl shadow-[0px_10px_30px_rgba(0,0,0,0.08)] border border-outline/5 overflow-hidden z-20">
                            <button onClick={() => handleEdit('discount', discount)} className="w-full px-4 py-2.5 text-left text-sm font-bold text-on-surface hover:bg-surface-container-low transition-colors" style={{ fontFamily: "'Inter', sans-serif" }}>{t('common.edit') || "Edit"}</button>
                            <button onClick={() => handleDelete('discount', discount.id)} className="w-full px-4 py-2.5 text-left text-sm font-bold text-error hover:bg-error/5 transition-colors" style={{ fontFamily: "'Inter', sans-serif" }}>{t('common.delete') || "Delete"}</button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Classes */}
                  {sortedClasses.map((cls, idx) => {
                    const day = getClassDay(cls);
                    const prevCls = idx > 0 ? sortedClasses[idx - 1] : null;
                    const prevDay = prevCls ? getClassDay(prevCls) : null;
                    const isNewDay = idx > 0 && day !== prevDay;

                    return (
                      <React.Fragment key={cls.id}>
                        {isNewDay && (
                          <div className="border-t border-outline/10 my-4" />
                        )}
                        <div className="bg-white rounded-2xl shadow-[0px_10px_30px_rgba(0,0,0,0.03)] border border-white/20 p-6 flex items-start gap-4 hover:shadow-[0px_15px_40px_rgba(0,0,0,0.05)] transition-all">
                          <div className="flex-grow">
                            <div className="flex justify-between items-start mb-1">
                              <div className="flex items-center gap-2">
                                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-lg ${getLevelColor(cls.level)}`}>
                                  {cls.level || t('group.class.all_levels') || 'All Levels'}
                                </span>
                                <span className="text-xs font-bold text-on-surface-variant/40">#C-{cls.id.slice(0, 4)}</span>
                              </div>
                            </div>
                            <h4 className="text-lg font-bold text-on-surface leading-tight mb-2" style={{ fontFamily: "'Inter', sans-serif" }}>{cls.title}</h4>
                            <div className="flex flex-col gap-1 text-sm text-on-surface-variant mb-3">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-primary" style={{ fontFamily: "'Inter', sans-serif" }}>
                                  {cls.schedule?.length ? (t('group.class.plus_sessions')?.replace('{date}', cls.schedule[0].date || '').replace('{count}', String(cls.schedule.length - 1)) || `${cls.schedule[0].date || ''} plus ${cls.schedule.length - 1} sessions`) : (t('group.class.no_sessions') || 'No sessions')}
                                </span>
                                <span className="ml-2 text-on-surface-variant font-medium" style={{ fontFamily: "'Inter', sans-serif" }}>{cls.schedule?.[0]?.timeSlot || ''}</span>
                              </div>
                            </div>
                            <div className="flex items-center justify-between pt-2 border-t border-outline/5">
                              <div className="flex items-center gap-2">
                                <span className="text-[12px] font-medium text-on-surface-variant" style={{ fontFamily: "'Inter', sans-serif" }}>{t('group.class.instructor') || "Instructor:"}</span>
                                <span className="text-sm font-semibold text-on-surface" style={{ fontFamily: "'Inter', sans-serif" }}>
                                  {cls.instructors?.[0]?.name || t('group.class.tbd') || 'TBD'}
                                  {cls.instructors && cls.instructors.length > 1 && ` +${cls.instructors.length - 1}`}
                                </span>
                              </div>
                              <span className="text-base font-bold text-on-surface" style={{ fontFamily: "'Inter', sans-serif" }}>{cls.amount === 0 ? t('group.class.free', 'Free') : `${cls.currency === 'KRW' ? '₩' : cls.currency} ${cls.amount.toLocaleString()}`}</span>
                            </div>
                          </div>
                          <div className="relative action-menu-container">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveMenuId(activeMenuId === cls.id ? null : cls.id);
                              }}
                              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-surface-container-low transition-all text-on-surface-variant/70"
                            >
                              <span className="material-symbols-outlined text-[20px]">more_vert</span>
                            </button>
                            {activeMenuId === cls.id && (
                              <div className="absolute right-0 mt-1 w-32 bg-white rounded-xl shadow-[0px_10px_30px_rgba(0,0,0,0.08)] border border-outline/5 overflow-hidden z-20">
                                <button onClick={() => handleEdit('add-class', cls)} className="w-full px-4 py-2.5 text-left text-sm font-bold text-on-surface hover:bg-surface-container-low transition-colors" style={{ fontFamily: "'Inter', sans-serif" }}>{t('common.edit') || "Edit"}</button>
                                <button onClick={() => handleDelete('class', cls.id)} className="w-full px-4 py-2.5 text-left text-sm font-bold text-error hover:bg-error/5 transition-colors" style={{ fontFamily: "'Inter', sans-serif" }}>{t('common.delete') || "Delete"}</button>
                              </div>
                            )}
                          </div>
                        </div>
                      </React.Fragment>
                    );
                  })}
                </section>
              </>
            )}

            {activeTab === 'application' && (
              <section className="px-4 mb-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <GroupClassRegistrations 
                  group={group} 
                  validClassIds={[
                    ...filteredClasses.map(c => c.id),
                    ...filteredDiscounts.map((d: any) => d.id)
                  ]}
                  allClasses={allClasses}
                  allDiscounts={allDiscounts}
                />
              </section>
            )}

            {activeTab === 'stats' && (
              <section className="px-4 mb-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <GroupClassStats 
                  group={group} 
                  validClassIds={[
                    ...filteredClasses.map(c => c.id),
                    ...filteredDiscounts.map((d: any) => d.id)
                  ]}
                  filteredClasses={filteredClasses}
                />
              </section>
            )}

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
              if (onSave) onSave();
              else router.refresh();
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
              if (onSave) onSave();
              else router.refresh();
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
              if (onSave) onSave();
              else router.refresh();
            }}
          />
        )}
      </>
    </motion.div>
  </>
  );
};

export default GroupClassEditor;
