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
import { GroupClassRegistrations } from "./GroupClassRegistrations";
import { GroupClassStats } from "./GroupClassStats";

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

        {/* Tabs Navigation */}
        <div className="flex bg-white rounded-[12px] p-1 shadow-sm border border-gray-100 mb-6 gap-1">
          <button
            onClick={() => setActiveTab('register')}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${
              activeTab === 'register' ? 'bg-[#0057bd] text-white' : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            Register
          </button>
          <button
            onClick={() => setActiveTab('application')}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${
              activeTab === 'application' ? 'bg-[#0057bd] text-white' : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            Application
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${
              activeTab === 'stats' ? 'bg-[#0057bd] text-white' : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            Stats
          </button>
        </div>

        {activeTab === 'register' && (
          <>
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
                    <span className="text-sm font-semibold text-gray-800">
                      {cls.instructors?.[0]?.name || 'TBD'}
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
                    <button onClick={() => handleEdit('add-class', cls)} className="w-full px-4 py-2 text-left text-sm font-bold hover:bg-gray-50">Edit</button>
                    <button onClick={() => handleDelete('class', cls.id)} className="w-full px-4 py-2 text-left text-sm font-bold text-red-500 hover:bg-red-50">Delete</button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </section>
        </>
        )}

        {activeTab === 'application' && (
          <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <GroupClassRegistrations 
              group={group} 
              validClassIds={[
                ...filteredClasses.map(c => c.id),
                ...filteredPasses.map((p: any) => p.id),
                ...filteredDiscounts.map((d: any) => d.id)
              ]}
              allClasses={allClasses}
              allPasses={allMonthlyPasses}
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
                ...filteredPasses.map((p: any) => p.id),
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
      </>
    </div>
  );
};

export default GroupClassEditor;

