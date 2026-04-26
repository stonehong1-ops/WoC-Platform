import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Group, GroupClass, ClassDiscount, MonthlyPass } from "@/types/group";
import { groupService } from "@/lib/firebase/groupService";
import { db } from "@/lib/firebase/clientApp";
import { doc, writeBatch, deleteField, Timestamp } from "firebase/firestore";

import { toast } from "sonner";
import GroupClassAddEditor from "./GroupClassAddEditor";
import GroupClassDiscountEditor from "./GroupClassDiscountEditor";
import GroupClassMonthlyPassEditor from "./GroupClassMonthlyPassEditor";
import { classRegistrationService } from "@/lib/firebase/classRegistrationService";
import { useRouter } from "next/navigation";

interface GroupClassEditorProps {
  group: Group;
  onSave?: () => void;
}

type EditorType = 'add-class' | 'discount' | 'monthly-pass' | 'payment';

interface EditingState {
  type: EditorType;
  data: any;
}

const GroupClassEditor: React.FC<GroupClassEditorProps> = ({ group, onSave }) => {
  const router = useRouter();
  const [editingState, setEditingState] = useState<EditingState | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Payment Settings State
  const [paymentSettings, setPaymentSettings] = useState({
    paymentMethods: {
      bankTransfer: group.classPaymentSettings?.paymentMethods?.bankTransfer ?? true,
      creditCard: group.classPaymentSettings?.paymentMethods?.creditCard ?? false,
      overseas: group.classPaymentSettings?.paymentMethods?.overseas ?? false,
    },
    bankDetails: {
      bankName: group.classPaymentSettings?.bankDetails?.bankName ?? "",
      accountHolder: group.classPaymentSettings?.bankDetails?.accountHolder ?? "",
      accountNumber: group.classPaymentSettings?.bankDetails?.accountNumber ?? "",
      wiseId: (group.classPaymentSettings?.bankDetails as any)?.wiseId ?? "",
    }
  });
  const [isEditingPayment, setIsEditingPayment] = useState(false);
  const [savingPayment, setSavingPayment] = useState(false);

  const handleSavePaymentSettings = async () => {
    setSavingPayment(true);
    try {
      await groupService.updateGroupMetadata(group.id, {
        classPaymentSettings: paymentSettings
      });
      setIsEditingPayment(false);
      toast.success("Payment settings updated successfully.");
      if (onSave) onSave();
    } catch (error) {
      console.error("Failed to update payment settings:", error);
      toast.error("Failed to update payment settings.");
    } finally {
      setSavingPayment(false);
    }
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
  const monthDisplay = currentDate.toLocaleString('en-US', { month: 'short', year: 'numeric' });

  // Real-time data from subcollections
  const [subClasses, setSubClasses] = useState<GroupClass[]>([]);
  const [subPasses, setSubPasses] = useState<MonthlyPass[]>([]);
  const [subDiscounts, setSubDiscounts] = useState<ClassDiscount[]>([]);

  useEffect(() => {
    // Auto-migration logic for legacy embedded arrays
    const legacyClasses = (group as any)._legacyClasses || [];
    const legacyPasses = (group as any)._legacyMonthlyPasses || [];
    const legacyDiscounts = (group as any)._legacyDiscounts || [];

    if (legacyClasses.length > 0 || legacyPasses.length > 0 || legacyDiscounts.length > 0) {
      const migrateData = async () => {
        try {
          const batch = writeBatch(db);
          for (const cls of legacyClasses) {
            batch.set(doc(db, 'groups', group.id, 'classes', cls.id), { ...cls, createdAt: Timestamp.now() });
          }
          for (const pass of legacyPasses) {
            batch.set(doc(db, 'groups', group.id, 'monthlyPasses', pass.id), { ...pass, createdAt: Timestamp.now() });
          }
          for (const discount of legacyDiscounts) {
            batch.set(doc(db, 'groups', group.id, 'discounts', discount.id), { ...discount, createdAt: Timestamp.now() });
          }
          batch.update(doc(db, 'groups', group.id), {
            classes: deleteField(),
            monthlyPasses: deleteField(),
            discounts: deleteField()
          });
          await batch.commit();
          toast.success("Successfully migrated data to new collections!");
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
    const unsubPasses = groupService.subscribeMonthlyPasses(group.id, setSubPasses);
    const unsubDiscounts = groupService.subscribeDiscounts(group.id, setSubDiscounts);
    return () => {
      unsubClasses();
      unsubPasses();
      unsubDiscounts();
    };
  }, [group.id]);

  // Combine legacy props (if not migrated yet) and real-time subcollections
  // De-duplicate by ID just in case
  const allClasses = [...subClasses, ...(group.classes || []).filter(c => !subClasses.find(sc => sc.id === c.id))];
  const allMonthlyPasses = [...subPasses, ...(group.monthlyPasses || []).filter(p => !subPasses.find(sp => sp.id === p.id))];
  const allDiscounts = [...subDiscounts, ...(group.discounts || []).filter(d => !subDiscounts.find(sd => sd.id === d.id))];

  const filteredClasses = allClasses.filter(cls => !cls.targetMonth || cls.targetMonth === currentMonthStr);
  const filteredPasses = allMonthlyPasses.filter((pass: MonthlyPass) => !pass.targetMonth || pass.targetMonth === currentMonthStr);
  const filteredDiscounts = allDiscounts.filter((discount: ClassDiscount) => !discount.targetMonth || discount.targetMonth === currentMonthStr);

  const handleDelete = async (type: 'class' | 'discount' | 'pass', id: string) => {
    setActiveMenuId(null);
    if (window.confirm("Are you sure you want to delete this item? This action cannot be undone.")) {
      executeDelete(type, id);
    }
  };

  const executeDelete = async (type: 'class' | 'discount' | 'pass', id: string) => {
    setLoading(true);
    const promise = (async () => {
      if (type === "class") {
        await groupService.deleteClass(group.id, id);
      } else if (type === "discount") {
        await groupService.deleteDiscount(group.id, id);
      } else if (type === "pass") {
        await groupService.deleteMonthlyPass(group.id, id);
      }
      setActiveMenuId(null);
      if (onSave) {
        onSave();
      } else {
        router.refresh();
      }
    })();

    toast.promise(promise, {
      loading: 'Deleting...',
      success: 'Deleted successfully.',
      error: 'Failed to delete.',
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
    <div className="antialiased text-gray-900 bg-[#F3F4F6] min-h-screen font-['Plus_Jakarta_Sans'] pb-20">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Class Basic Info 1-line Summary */}
        <section className="mb-6">
          <div className="bg-white rounded-[12px] p-4 flex items-center justify-between shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[#0057bd]">info</span>
              <div>
                <h3 className="font-bold text-gray-900 text-sm">Class Basic Info</h3>
                <p className="text-xs text-gray-500 truncate max-w-[200px] sm:max-w-sm">
                  {paymentSettings.paymentMethods.bankTransfer
                    ? `Payment: ${paymentSettings.bankDetails.bankName || 'No bank'} | ${paymentSettings.bankDetails.accountNumber || 'No account'}`
                    : 'Payment: No method set'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setEditingState({ type: 'payment', data: paymentSettings })}
              className="px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg text-sm font-bold transition-colors shrink-0"
            >
              Edit
            </button>
          </div>
        </section>

        {/* Month Navigation & Visibility */}
        <section className="mb-6 bg-white rounded-[16px] shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50/50">
            <button onClick={handlePrevMonth} className="p-2 hover:bg-white rounded-full transition-colors shadow-sm bg-white border border-gray-100 active:scale-95">
              <span className="material-symbols-outlined text-gray-600">chevron_left</span>
            </button>
            <h2 className="text-xl font-bold text-gray-900">{monthDisplay}</h2>
            <button onClick={handleNextMonth} className="p-2 hover:bg-white rounded-full transition-colors shadow-sm bg-white border border-gray-100 active:scale-95">
              <span className="material-symbols-outlined text-gray-600">chevron_right</span>
            </button>
          </div>
          <div className="p-5 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-gray-900">Monthly Visibility</h3>
              <p className="text-sm text-gray-500">Show this month's classes to members</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input defaultChecked className="sr-only peer" type="checkbox" value="" />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0057bd]"></div>
              <span className="ml-3 text-sm font-medium text-gray-900">ON</span>
            </label>
          </div>
        </section>

        {/* Action Buttons */}
        <section className="mb-8 flex justify-between gap-3">
          <button
            onClick={() => setEditingState({ type: 'add-class', data: null })}
            className="flex-1 flex flex-col items-center justify-center gap-1 px-2 py-3 bg-[#0057bd] text-white rounded-[12px] shadow-sm hover:bg-blue-700 transition-colors active:scale-95"
          >
            <span className="material-symbols-outlined text-xl">school</span>
            <span className="text-xs font-bold leading-tight text-center">Class</span>
          </button>
          <button
            onClick={() => setEditingState({ type: 'discount', data: null })}
            className="flex-1 flex flex-col items-center justify-center gap-1 px-2 py-3 bg-white text-gray-700 rounded-[12px] border border-gray-100 shadow-sm hover:bg-gray-50 transition-colors active:scale-95"
          >
            <span className="material-symbols-outlined text-xl">sell</span>
            <span className="text-xs font-bold leading-tight text-center">Bundle<br />discount</span>
          </button>
          <button
            onClick={() => setEditingState({ type: 'monthly-pass', data: null })}
            className="flex-1 flex flex-col items-center justify-center gap-1 px-2 py-3 bg-white text-gray-700 rounded-[12px] border border-gray-100 shadow-sm hover:bg-gray-50 transition-colors active:scale-95"
          >
            <span className="material-symbols-outlined text-xl">confirmation_number</span>
            <span className="text-xs font-bold leading-tight text-center">Monthly<br />Pass</span>
          </button>
        </section>

        {/* List Section */}
        <section className="flex flex-col gap-4">
          {filteredClasses.length === 0 && filteredDiscounts.length === 0 && filteredPasses.length === 0 && (
            <div className="bg-transparent border-2 border-dashed border-gray-300 rounded-[12px] p-10 text-center flex flex-col items-center justify-center">
              <span className="material-symbols-outlined text-gray-400 text-4xl mb-2">inbox</span>
              <p className="text-gray-500 font-bold">No items registered</p>
            </div>
          )}

          {/* Monthly Passes */}
          {filteredPasses.map((pass: MonthlyPass) => (
            <div key={pass.id} className="bg-white rounded-[12px] shadow-sm hover:shadow-md transition-shadow border border-gray-100 p-5 flex items-start gap-4">
              <div className="flex-grow">
                <div className="flex justify-between items-start mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-fuchsia-600 bg-fuchsia-50 px-2 py-0.5 rounded">
                      Pass
                    </span>
                    <span className="text-xs font-bold text-gray-400">#P-{pass.id.slice(0, 4)}</span>
                  </div>
                </div>
                <h4 className="text-lg font-bold text-gray-900 leading-tight mb-2">{pass.title}</h4>
                <div className="flex flex-col gap-1 text-sm text-gray-600 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-600">
                      Unlimited access for 30 days
                    </span>
                  </div>
                  {pass.includedClassIds && pass.includedClassIds.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {pass.includedClassIds.map((classId: string) => {
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
                    <span className="text-xs text-gray-500">Monthly Price</span>
                  </div>
                  <span className="text-sm font-bold text-gray-900">{pass.currency === 'KRW' ? '₩' : pass.currency} {pass.amount.toLocaleString()}</span>
                </div>
              </div>
              <div className="relative action-menu-container">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveMenuId(activeMenuId === pass.id ? null : pass.id);
                  }}
                  className="p-1 hover:bg-gray-100 rounded-full transition-colors text-gray-400"
                >
                  <span className="material-symbols-outlined">more_vert</span>
                </button>
                {activeMenuId === pass.id && (
                  <div className="absolute right-0 mt-1 w-32 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-20">
                    <button onClick={() => handleEdit('monthly-pass', pass)} className="w-full px-4 py-2 text-left text-sm font-bold hover:bg-gray-50">Edit</button>
                    <button onClick={() => handleDelete('pass', pass.id)} className="w-full px-4 py-2 text-left text-sm font-bold text-red-500 hover:bg-red-50">Delete</button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Discounts */}
          {filteredDiscounts.map((discount: ClassDiscount) => (
            <div key={discount.id} className="bg-white rounded-[12px] shadow-sm hover:shadow-md transition-shadow border border-gray-100 p-5 flex items-start gap-4">
              <div className="flex-grow">
                <div className="flex justify-between items-start mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 bg-rose-50 px-2 py-0.5 rounded">
                      Bundle
                    </span>
                    <span className="text-xs font-bold text-gray-400">#D-{discount.id.slice(0, 4)}</span>
                  </div>
                </div>
                <h4 className="text-lg font-bold text-gray-900 leading-tight mb-2">{discount.title}</h4>
                <div className="flex flex-col gap-1 text-sm text-gray-600 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-600">
                      Includes {discount.includedClassIds?.length || 0} classes
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
                    <span className="text-xs text-gray-500">Discounted Price</span>
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
                    <button onClick={() => handleEdit('discount', discount)} className="w-full px-4 py-2 text-left text-sm font-bold hover:bg-gray-50">Edit</button>
                    <button onClick={() => handleDelete('discount', discount.id)} className="w-full px-4 py-2 text-left text-sm font-bold text-red-500 hover:bg-red-50">Delete</button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Classes */}
          {filteredClasses.map((cls) => (
            <div key={cls.id} className="bg-white rounded-[12px] shadow-sm hover:shadow-md transition-shadow border border-gray-100 p-5 flex items-start gap-4">
              <div className="flex-grow">
                <div className="flex justify-between items-start mb-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${getLevelColor(cls.level)}`}>
                      {cls.level || 'All Levels'}
                    </span>
                    <span className="text-xs font-bold text-gray-400">#C-{cls.id.slice(0, 4)}</span>
                  </div>
                </div>
                <h4 className="text-lg font-bold text-gray-900 leading-tight mb-2">{cls.title}</h4>
                <div className="flex flex-col gap-1 text-sm text-gray-600 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-[#0057bd]">
                      {cls.schedule?.length ? `${cls.schedule[0].date} plus ${cls.schedule.length - 1} sessions` : 'No sessions'}
                    </span>
                    <span className="ml-2 text-gray-600">{cls.schedule?.[0]?.timeSlot || ''}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">Instructor:</span>
                    <span className="text-sm font-semibold text-gray-800">{cls.instructors?.[0]?.name || 'TBD'}</span>
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
                    <button onClick={() => handleEdit('add-class', cls)} className="w-full px-4 py-2 text-left text-sm font-bold hover:bg-gray-50">Edit</button>
                    <button onClick={() => handleDelete('class', cls.id)} className="w-full px-4 py-2 text-left text-sm font-bold text-red-500 hover:bg-red-50">Delete</button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </section>
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
            initialData={editingState.data}
            onClose={() => setEditingState(null)}
            onSave={() => {
              if (onSave) onSave();
              else router.refresh();
            }}
            targetMonth={currentMonthStr}
          />
        )}
        {editingState?.type === "monthly-pass" && (
          <GroupClassMonthlyPassEditor
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
        {editingState?.type === "payment" && typeof document !== 'undefined' && createPortal(
          <div className="fixed inset-0 z-[99999] bg-[#f7f9fb] text-[#191c1e] font-['Plus_Jakarta_Sans'] h-[100dvh] w-screen overflow-hidden flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
            <style dangerouslySetInnerHTML={{
              __html: `
              .glass-panel {
                  background: rgba(255, 255, 255, 0.7);
                  backdrop-filter: blur(16px);
                  -webkit-backdrop-filter: blur(16px);
                  border: 1px solid rgba(255, 255, 255, 0.3);
                  border-top: 1px solid rgba(255, 255, 255, 0.8);
                  border-left: 1px solid rgba(255, 255, 255, 0.8);
                  box-shadow: 0 4px 30px rgba(0, 163, 255, 0.05);
              }
              .input-glass {
                  background: rgba(255, 255, 255, 0.5);
                  border: 1px solid rgba(0, 98, 157, 0.1);
                  transition: all 0.3s ease;
              }
              .input-glass:focus {
                  background: rgba(255, 255, 255, 0.9);
                  border-color: #00A3FF;
                  box-shadow: 0 0 0 4px rgba(0, 163, 255, 0.1);
                  outline: none;
              }
              .toggle-checkbox:checked {
                  right: 0;
                  border-color: #00a3ff;
              }
              .toggle-checkbox:checked + .toggle-label {
                  background-color: #00a3ff;
              }
            `}} />

            {/* Ambient Background */}
            <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
              <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[#cfe5ff] opacity-30 blur-[100px]"></div>
              <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-[#d6e3ff] opacity-40 blur-[120px]"></div>
            </div>

            <header className="fixed top-0 left-0 w-full z-50 flex items-center justify-between px-6 h-16 bg-white/70 dark:bg-slate-900/70 backdrop-blur-lg border-b border-white/20 dark:border-slate-800 shadow-[0_4px_30px_rgba(0,163,255,0.1)]">
              <button onClick={() => setEditingState(null)} className="w-10 h-10 flex items-center justify-center rounded-full text-slate-500 hover:bg-sky-50/50 active:scale-95 duration-200 transition-colors">
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0" }}>close</span>
              </button>
              <h1 className="font-['Plus_Jakarta_Sans'] text-sm font-semibold tracking-tight text-slate-900 dark:text-white">Payment Management</h1>
              <button onClick={async () => { await handleSavePaymentSettings(); setEditingState(null); }} disabled={savingPayment} className="text-[15px] leading-[1] font-semibold text-sky-500 dark:text-sky-400 hover:text-sky-600 active:scale-95 duration-200 transition-colors px-4 py-2 rounded-lg">
                {savingPayment ? 'Saving...' : 'Save'}
              </button>
            </header>

            <main className="flex-1 overflow-y-auto z-10 pt-20 pb-10 px-4 md:px-[24px] lg:px-[48px] max-w-3xl mx-auto w-full relative">
              <div className="flex flex-col gap-[24px]">

                {/* Bank Transfer Section */}
                <section className="glass-panel rounded-xl p-6 relative overflow-hidden">
                  <div className="flex items-center gap-3 mb-6 border-b border-[#bec7d4]/30 pb-4">
                    <div className="w-10 h-10 rounded-full bg-[#cfe5ff]/30 flex items-center justify-center text-[#00a3ff]">
                      <span className="material-symbols-outlined">account_balance</span>
                    </div>
                    <div>
                      <h2 className="text-[24px] leading-[1.3] font-semibold text-[#191c1e]">Bank Transfer</h2>
                      <p className="text-[14px] leading-[1.5] font-normal text-[#3f4852]">Domestic wire instructions.</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                      <label className="text-[12px] leading-[1] font-bold tracking-[0.05em] uppercase text-[#3f4852] ml-1">Bank Name</label>
                      <input
                        value={paymentSettings.bankDetails.bankName}
                        onChange={(e) => setPaymentSettings(prev => ({ ...prev, bankDetails: { ...prev.bankDetails, bankName: e.target.value } }))}
                        className="input-glass w-full rounded-lg h-[48px] px-4 text-[16px] leading-[1.5] font-normal text-[#191c1e] bg-transparent"
                        placeholder="e.g. Chase Bank"
                        type="text"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[12px] leading-[1] font-bold tracking-[0.05em] uppercase text-[#3f4852] ml-1">Account Holder Name</label>
                      <input
                        value={paymentSettings.bankDetails.accountHolder}
                        onChange={(e) => setPaymentSettings(prev => ({ ...prev, bankDetails: { ...prev.bankDetails, accountHolder: e.target.value } }))}
                        className="input-glass w-full rounded-lg h-[48px] px-4 text-[16px] leading-[1.5] font-normal text-[#191c1e] bg-transparent"
                        placeholder="John Doe"
                        type="text"
                      />
                    </div>
                    <div className="flex flex-col gap-1 md:col-span-2">
                      <label className="text-[12px] leading-[1] font-bold tracking-[0.05em] uppercase text-[#3f4852] ml-1">Account Number</label>
                      <input
                        value={paymentSettings.bankDetails.accountNumber}
                        onChange={(e) => setPaymentSettings(prev => ({ ...prev, bankDetails: { ...prev.bankDetails, accountNumber: e.target.value } }))}
                        className="input-glass w-full rounded-lg h-[48px] px-4 text-[16px] leading-[1.5] font-normal text-[#191c1e] bg-transparent"
                        placeholder="0000 0000 0000"
                        type="text"
                      />
                    </div>
                  </div>
                </section>

                {/* Card Payment Section */}
                <section className="glass-panel rounded-xl p-6 relative overflow-hidden">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b border-[#bec7d4]/30 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#cfe5ff]/30 flex items-center justify-center text-[#00a3ff]">
                        <span className="material-symbols-outlined">credit_card</span>
                      </div>
                      <div>
                        <h2 className="text-[24px] leading-[1.3] font-semibold text-[#191c1e]">Card Payment</h2>
                        <p className="text-[14px] leading-[1.5] font-normal text-[#3f4852]">Accept credit &amp; debit cards.</p>
                      </div>
                    </div>
                    <div className="relative inline-block w-12 mr-2 align-middle select-none transition duration-200 ease-in">
                      <input
                        checked={paymentSettings.paymentMethods.creditCard}
                        onChange={(e) => setPaymentSettings(prev => ({ ...prev, paymentMethods: { ...prev.paymentMethods, creditCard: e.target.checked } }))}
                        className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer border-[#bec7d4] z-10 top-0 left-0 transition-transform duration-300 ease-in-out"
                        id="card-toggle"
                        name="toggle"
                        type="checkbox"
                      />
                      <label className="toggle-label block overflow-hidden h-6 rounded-full bg-[#bec7d4] cursor-pointer transition-colors duration-300 ease-in-out" htmlFor="card-toggle"></label>
                    </div>
                  </div>
                  <div className="bg-[#f2f4f6] rounded-lg p-4 border border-[#bec7d4]/20 flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#00a3ff] text-[20px]">info</span>
                      <span className="text-[14px] leading-[1.5] font-normal text-[#191c1e]">Currently processed via Stripe gateway.</span>
                    </div>
                    <div className="flex gap-2 mt-2">
                      <span className="px-3 py-1 bg-white rounded-md border border-[#bec7d4]/30 text-[12px] leading-[1] font-bold tracking-[0.05em] uppercase text-[#3f4852] flex items-center justify-center shadow-sm">VISA</span>
                      <span className="px-3 py-1 bg-white rounded-md border border-[#bec7d4]/30 text-[12px] leading-[1] font-bold tracking-[0.05em] uppercase text-[#3f4852] flex items-center justify-center shadow-sm">MASTERCARD</span>
                      <span className="px-3 py-1 bg-white rounded-md border border-[#bec7d4]/30 text-[12px] leading-[1] font-bold tracking-[0.05em] uppercase text-[#3f4852] flex items-center justify-center shadow-sm">AMEX</span>
                    </div>
                  </div>
                </section>

                {/* International Payment Section */}
                <section className="glass-panel rounded-xl p-6 relative overflow-hidden">
                  <div className="flex items-center gap-3 mb-6 border-b border-[#bec7d4]/30 pb-4">
                    <div className="w-10 h-10 rounded-full bg-[#cfe5ff]/30 flex items-center justify-center text-[#00a3ff]">
                      <span className="material-symbols-outlined">public</span>
                    </div>
                    <div>
                      <h2 className="text-[24px] leading-[1.3] font-semibold text-[#191c1e]">International Payment</h2>
                      <p className="text-[14px] leading-[1.5] font-normal text-[#3f4852]">Powered by Wise.</p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-4">
                    <div className="bg-[#d6e3ff]/30 rounded-lg p-4 border border-[#98cbff]/30 flex items-start gap-3">
                      <span className="material-symbols-outlined text-[#00a3ff] mt-0.5 text-[20px]">lightbulb</span>
                      <p className="text-[14px] leading-[1.5] font-normal text-[#3f4852] leading-relaxed">
                        For international students, we recommend using Wise for lower fees and better exchange rates. Provide your Wise ID below to receive funds directly.
                      </p>
                    </div>
                    <div className="flex flex-col gap-1 mt-2">
                      <label className="text-[12px] leading-[1] font-bold tracking-[0.05em] uppercase text-[#3f4852] ml-1">Wise ID / Email Address</label>
                      <div className="relative">
                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#6f7883]">alternate_email</span>
                        <input
                          value={paymentSettings.bankDetails.wiseId}
                          onChange={(e) => {
                            const val = e.target.value;
                            setPaymentSettings(prev => ({
                              ...prev,
                              bankDetails: { ...prev.bankDetails, wiseId: val },
                              paymentMethods: { ...prev.paymentMethods, overseas: val.trim() !== "" }
                            }));
                          }}
                          className="input-glass w-full rounded-lg h-[48px] pl-12 pr-4 text-[16px] leading-[1.5] font-normal text-[#191c1e] bg-transparent"
                          placeholder="student@example.com"
                          type="text"
                        />
                      </div>
                    </div>
                  </div>
                </section>

              </div>
            </main>
          </div>,
          document.body
        )}
      </>
    </div>
  );
};

export default GroupClassEditor;

