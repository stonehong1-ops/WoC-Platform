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

type EditorType = 'add-class' | 'discount' | 'monthly-pass' | 'payment' | 'clone';

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
    const handleClickOutside = (e: MouseEvent) => {
      if (!(e.target as Element).closest('.action-menu-container')) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className={isInline 
        ? "w-full antialiased flex flex-col font-['Plus_Jakarta_Sans']" 
        : "fixed inset-0 z-[100] antialiased text-gray-900 bg-[#F3F4F6] flex flex-col overflow-y-auto no-scrollbar font-['Plus_Jakarta_Sans'] pb-20"
      }
    >
      {/* Top Bar */}
      {!isInline && (
        <header className="sticky top-0 z-50 bg-[#F3F4F6]/80 backdrop-blur-xl border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between w-full">
            <div className="flex items-center gap-4">
              <button 
                onClick={onClose}
                className="w-10 h-10 rounded-full flex items-center justify-center text-[#0057bd] hover:bg-[#0057bd]/5 transition-all"
              >
                <span className="material-symbols-outlined text-[#0057bd]">arrow_back</span>
              </button>
              <h1 className="text-base font-bold text-gray-900">{t('group.class.management') || "Class Management"}</h1>
            </div>
          </div>
        </header>
      )}

      <main className={`max-w-7xl w-full mx-auto px-4 ${isInline ? 'py-4' : 'py-8'} flex-1`}>
        {/* Month Navigation & Visibility */}
        <section className="mb-6 bg-white rounded-[16px] shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-gray-50/50">
            <button onClick={handlePrevMonth} className="p-2 hover:bg-white rounded-full transition-colors shadow-sm bg-white border border-gray-100 active:scale-95">
              <span className="material-symbols-outlined text-gray-600">chevron_left</span>
            </button>
            <h2 className="text-xl font-bold text-gray-900">{monthDisplay}</h2>
            <button onClick={handleNextMonth} className="p-2 hover:bg-white rounded-full transition-colors shadow-sm bg-white border border-gray-100 active:scale-95">
              <span className="material-symbols-outlined text-gray-600">chevron_right</span>
            </button>
          </div>
          <div className="px-4 py-3 flex items-center justify-center">
            <div className="flex bg-gray-100 rounded-lg p-0.5">
              <button
                onClick={() => handleToggleRegistrationStatus(false)}
                disabled={loading}
                className={`px-5 py-1.5 text-xs font-bold rounded-md transition-all ${
                  !isRegistrationOpen
                    ? 'bg-gray-500 text-white shadow-sm'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                Closed
              </button>
              <button
                onClick={() => handleToggleRegistrationStatus(true)}
                disabled={loading}
                className={`px-5 py-1.5 text-xs font-bold rounded-md transition-all ${
                  isRegistrationOpen
                    ? 'bg-[#0057bd] text-white shadow-sm'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                Open
              </button>
            </div>
          </div>
        </section>

        {/* Tabs Navigation */}
        <div className="flex bg-white rounded-[12px] p-1 shadow-sm border border-gray-100 mb-6 gap-1">
          <button
            onClick={() => setActiveTab('register')}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${
              activeTab === 'register' ? 'bg-[#0057bd] text-white' : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            {t('group.class.register') || "Register"}
          </button>
          <button
            onClick={() => setActiveTab('application')}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${
              activeTab === 'application' ? 'bg-[#0057bd] text-white' : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            {t('group.class.application') || "Application"}
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${
              activeTab === 'stats' ? 'bg-[#0057bd] text-white' : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            {t('group.class.stats') || "Stats"}
          </button>
        </div>

        {activeTab === 'register' && (
          <>
            {/* Action Buttons */}
        <section className="mb-8 flex justify-between gap-3">
          <button
            onClick={() => setEditingState({ type: 'add-class', data: null })}
            className="flex-1 flex flex-col items-center justify-center gap-1 px-2 py-3 bg-white text-gray-700 rounded-[12px] border border-gray-100 shadow-sm hover:bg-gray-50 transition-colors active:scale-95 relative"
          >
            <div className="absolute top-2 right-2 w-5 h-5 bg-gray-100 rounded-full flex items-center justify-center text-[10px] font-bold text-gray-500">{filteredClasses.length}</div>
            <span className="material-symbols-outlined text-xl">school</span>
            <span className="text-xs font-bold leading-tight text-center">{t('group.class.class') || "Class"}</span>
          </button>
          <button
            onClick={() => setEditingState({ type: 'discount', data: null })}
            className="flex-1 flex flex-col items-center justify-center gap-1 px-2 py-3 bg-white text-gray-700 rounded-[12px] border border-gray-100 shadow-sm hover:bg-gray-50 transition-colors active:scale-95 relative"
          >
            <div className="absolute top-2 right-2 w-5 h-5 bg-gray-100 rounded-full flex items-center justify-center text-[10px] font-bold text-gray-500">{filteredDiscounts.length}</div>
            <span className="material-symbols-outlined text-xl">sell</span>
            <span className="text-xs font-bold leading-tight text-center" dangerouslySetInnerHTML={{ __html: t('group.class.bundle_discount') || "Bundle<br />discount" }} />
          </button>
          <button
            onClick={() => setEditingState({ type: 'clone', data: null })}
            className="flex-1 flex flex-col items-center justify-center gap-1 px-2 py-3 bg-gray-900 text-white rounded-[12px] shadow-sm hover:bg-gray-800 transition-colors active:scale-95"
          >
            <span className="material-symbols-outlined text-xl">content_copy</span>
            <span className="text-xs font-bold leading-tight text-center">{language === 'KR' ? '복제하기' : 'Clone'}</span>
          </button>
        </section>

        {/* List Section */}
        <section className="flex flex-col gap-4">
          {filteredClasses.length === 0 && filteredDiscounts.length === 0 && (
            <div className="bg-transparent border-2 border-dashed border-gray-300 rounded-[12px] p-10 text-center flex flex-col items-center justify-center">
              <span className="material-symbols-outlined text-gray-400 text-4xl mb-2">inbox</span>
              <p className="text-gray-500 font-bold">{t('group.class.no_items') || "No items registered"}</p>
            </div>
          )}

          {/* Discounts */}
          {filteredDiscounts.map((discount: ClassDiscount) => (
            <div key={discount.id} className="bg-white rounded-[12px] shadow-sm hover:shadow-md transition-shadow border border-gray-100 p-5 flex items-start gap-4">
              <div className="flex-grow">
                <div className="flex justify-between items-start mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 bg-rose-50 px-2 py-0.5 rounded">
                      {t('group.class.bundle_badge') || "Bundle"}
                    </span>
                    <span className="text-xs font-bold text-gray-400">#D-{discount.id.slice(0, 4)}</span>
                  </div>
                </div>
                <h4 className="text-lg font-bold text-gray-900 leading-tight mb-2">{discount.title}</h4>
                <div className="flex flex-col gap-1 text-sm text-gray-600 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-600">
                      {t('group.class.includes_classes')?.replace('{count}', String(discount.includedClassIds?.length || 0)) || `Includes ${discount.includedClassIds?.length || 0} classes`}
                    </span>
                  </div>
                  {discount.includedClassIds && discount.includedClassIds.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {discount.includedClassIds.map((classId: string) => {
                        const cls = allClasses.find(c => c.id === classId);
                        return cls ? (
                          <span key={classId} className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full border border-gray-200">
                            {cls.title}
                          </span>
                        ) : null;
                      })}
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">{t('group.class.discounted_price') || "Discounted Price"}</span>
                  </div>
                  <span className="text-sm font-bold text-[#0057bd]">{discount.currency === 'KRW' ? '₩' : discount.currency} {discount.amount.toLocaleString()}</span>
                </div>
              </div>
              <div className="relative action-menu-container">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveMenuId(activeMenuId === discount.id ? null : discount.id);
                  }}
                  className="p-1 hover:bg-gray-100 rounded-full transition-colors text-gray-400"
                >
                  <span className="material-symbols-outlined">more_vert</span>
                </button>
                {activeMenuId === discount.id && (
                  <div className="absolute right-0 mt-1 w-32 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-20">
                    <button onClick={() => handleEdit('discount', discount)} className="w-full px-4 py-2 text-left text-sm font-bold hover:bg-gray-50">{t('common.edit') || "Edit"}</button>
                    <button onClick={() => handleDelete('discount', discount.id)} className="w-full px-4 py-2 text-left text-sm font-bold text-red-500 hover:bg-red-50">{t('common.delete') || "Delete"}</button>
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
                  <div className="border-t border-gray-200 dark:border-gray-800 my-4" />
                )}
                <div className="bg-white rounded-[12px] shadow-sm hover:shadow-md transition-shadow border border-gray-100 p-5 flex items-start gap-4">
                  <div className="flex-grow">
                    <div className="flex justify-between items-start mb-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${getLevelColor(cls.level)}`}>
                          {cls.level || t('group.class.all_levels') || 'All Levels'}
                        </span>
                        <span className="text-xs font-bold text-gray-400">#C-{cls.id.slice(0, 4)}</span>
                      </div>
                    </div>
                    <h4 className="text-lg font-bold text-gray-900 leading-tight mb-2">{cls.title}</h4>
                    <div className="flex flex-col gap-1 text-sm text-gray-600 mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-[#0057bd]">
                          {cls.schedule?.length ? (t('group.class.plus_sessions')?.replace('{date}', cls.schedule[0].date).replace('{count}', String(cls.schedule.length - 1)) || `${cls.schedule[0].date} plus ${cls.schedule.length - 1} sessions`) : (t('group.class.no_sessions') || 'No sessions')}
                        </span>
                        <span className="ml-2 text-gray-600">{cls.schedule?.[0]?.timeSlot || ''}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">{t('group.class.instructor') || "Instructor:"}</span>
                        <span className="text-sm font-semibold text-gray-800">
                          {cls.instructors?.[0]?.name || t('group.class.tbd') || 'TBD'}
                          {cls.instructors && cls.instructors.length > 1 && ` +${cls.instructors.length - 1}`}
                        </span>
                      </div>
                      <span className="text-sm font-bold text-gray-900">{cls.currency === 'KRW' ? '₩' : cls.currency} {cls.amount.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="relative action-menu-container">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveMenuId(activeMenuId === cls.id ? null : cls.id);
                      }}
                      className="p-1 hover:bg-gray-100 rounded-full transition-colors text-gray-400"
                    >
                      <span className="material-symbols-outlined">more_vert</span>
                    </button>
                    {activeMenuId === cls.id && (
                      <div className="absolute right-0 mt-1 w-32 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-20">
                        <button onClick={() => handleEdit('add-class', cls)} className="w-full px-4 py-2 text-left text-sm font-bold hover:bg-gray-50">{t('common.edit') || "Edit"}</button>
                        <button onClick={() => handleDelete('class', cls.id)} className="w-full px-4 py-2 text-left text-sm font-bold text-red-500 hover:bg-red-50">{t('common.delete') || "Delete"}</button>
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
          <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
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
          <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
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
  );
};

export default GroupClassEditor;

