"use client";

import React, { useState, useEffect } from "react";

import { Group, MonthlyPass } from "@/types/group";
import { groupService } from "@/lib/firebase/groupService";
import { v4 as uuidv4 } from "uuid";

interface GroupClassMonthlyPassEditorProps {
  group: Group;
  initialData?: MonthlyPass | null;
  onClose: () => void;
  onSave?: () => void;
  targetMonth?: string;
}

const GroupClassMonthlyPassEditor: React.FC<GroupClassMonthlyPassEditorProps> = ({ 
  group, 
  initialData, 
  onClose, 
  onSave,
  targetMonth
}) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<MonthlyPass>({
    id: initialData?.id || uuidv4(),
    title: initialData?.title || "",
    description: initialData?.description || "",
    currency: initialData?.currency || "KRW",
    amount: initialData?.amount || 0,
    includedClassIds: initialData?.includedClassIds || [],
    targetMonth: initialData?.targetMonth || targetMonth || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`
  });

  const isEditMode = !!initialData;
  const currentMonth = formData.targetMonth;
  const classes = (group.classes || []).filter(cls => !cls.targetMonth || cls.targetMonth === currentMonth);

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  const handleToggleClass = (classId: string) => {
    setFormData(prev => {
      const currentIds = prev.includedClassIds || [];
      if (currentIds.includes(classId)) {
        return { ...prev, includedClassIds: currentIds.filter(id => id !== classId) };
      } else {
        return { ...prev, includedClassIds: [...currentIds, classId] };
      }
    });
  };

  const handleSave = async () => {
    if (!formData.title) {
      alert("Please enter a title for the monthly pass.");
      return;
    }
    if (formData.includedClassIds.length === 0) {
      alert("Please select at least one class.");
      return;
    }

    setLoading(true);
    try {
      if (initialData) {
        await groupService.updateMonthlyPass(group.id, formData.id, formData);
      } else {
        await groupService.addMonthlyPass(group.id, formData);
      }

      if (onSave) onSave();
      onClose();
    } catch (error) {
      console.error("Failed to save monthly pass:", error);
      alert("Failed to save the monthly pass.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 z-[200] bg-[#F3F4F6] overflow-y-auto text-on-surface animate-in fade-in slide-in-from-bottom-4 duration-300"
      >
        {/* Top App Bar */}
        <header className="sticky top-0 z-50 bg-[#F3F4F6] px-6 py-4 flex items-center border-b border-outline/20">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-4">
              {/* Leading Icon */}
              <button 
                onClick={onClose}
                aria-label="Close" 
                className="material-symbols-outlined text-on-surface-variant p-2 hover:bg-surface-variant rounded-full transition-colors active-scale"
              >
                close
              </button>
              {/* Headline */}
              <h1 className="text-xl font-extrabold tracking-tight text-on-surface headline">
                {isEditMode ? "Edit Monthly Pass" : "Monthly Pass Editor"}
              </h1>
            </div>
            {/* Trailing Action */}
            <button 
              onClick={handleSave}
              disabled={loading}
              className="bg-primary text-white font-bold text-sm px-6 py-2 rounded-lg shadow-sm shadow-primary/20 hover:bg-primary/90 transition-all active-scale disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                "Save"
              )}
            </button>
          </div>
        </header>

        {/* Main Content Canvas */}
        <main className="max-w-md mx-auto px-6 py-8 space-y-6 pb-20">
          {/* Basic Info Card */}
          <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline/20 shadow-sm space-y-5">
            {/* Class Title */}
            <div>
              <label className="block text-[10px] font-bold text-on-surface-variant mb-2 uppercase tracking-widest opacity-70" htmlFor="discount-title">Class Title</label>
              <input 
                className="w-full bg-surface-variant/30 border border-outline/30 rounded-lg px-4 py-3 text-on-surface focus:ring-2 focus:ring-primary/20 focus:border-primary placeholder:text-on-surface-variant/40 outline-none transition-all" 
                id="discount-title" 
                placeholder="Enter pass title" 
                type="text" 
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            {/* Description */}
            <div>
              <label className="block text-[10px] font-bold text-on-surface-variant mb-2 uppercase tracking-widest opacity-70" htmlFor="discount-desc">Description</label>
              <textarea 
                className="w-full bg-surface-variant/30 border border-outline/30 rounded-lg px-4 py-3 text-on-surface focus:ring-2 focus:ring-primary/20 focus:border-primary placeholder:text-on-surface-variant/40 outline-none resize-none text-sm transition-all" 
                id="discount-desc" 
                placeholder="Describe the pass..." 
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
          </div>

          {/* Pricing & Discount Details Card */}
          <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline/20 shadow-sm space-y-5">
            <h2 className="text-sm font-extrabold headline text-on-surface uppercase tracking-widest mb-4">Pricing</h2>
            <div className="space-y-4">
              {/* Currency */}
              <div>
                <label className="block text-[10px] font-bold text-on-surface-variant mb-2 uppercase tracking-widest opacity-70">Currency</label>
                <div className="relative">
                  <select 
                    className="w-full bg-surface-variant/30 border border-outline/30 rounded-lg px-4 py-3 text-on-surface focus:ring-2 focus:ring-primary/20 focus:border-primary appearance-none outline-none transition-all text-sm"
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  >
                    <option value="KRW">KRW - South Korean Won</option>
                    <option value="USD">USD - US Dollar</option>
                    <option value="EUR">EUR - Euro</option>
                    <option value="JPY">JPY - Japanese Yen</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-3 top-3 pointer-events-none text-on-surface-variant">expand_more</span>
                </div>
              </div>
              {/* Amount */}
              <div>
                <label className="block text-[10px] font-bold text-on-surface-variant mb-2 uppercase tracking-widest opacity-70">Amount</label>
                <div className="relative">
                  <span className="absolute left-4 top-3.5 text-on-surface-variant font-bold text-sm">
                    {formData.currency === 'KRW' ? '₩' : formData.currency === 'USD' ? '$' : formData.currency === 'EUR' ? '€' : formData.currency === 'JPY' ? '¥' : '₩'}
                  </span>
                  <input 
                    className="w-full bg-surface-variant/30 border border-outline/30 rounded-lg pl-8 pr-4 py-3 text-on-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm" 
                    placeholder="0" 
                    type="text" 
                    value={formData.amount ? formData.amount.toLocaleString() : ""}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, '');
                      setFormData({ ...formData, amount: Number(val) });
                    }}
                  />
                </div>
              </div>
            </div>
            
            {/* Discount Description */}
            <div className="mt-5">
              <label className="block text-[10px] font-bold text-on-surface-variant mb-2 uppercase tracking-widest opacity-70">Discount Rule</label>
              <textarea 
                className="w-full bg-surface-variant/20 border border-outline/30 rounded-lg px-4 py-3 text-on-surface/60 text-sm outline-none resize-none cursor-not-allowed" 
                disabled 
                id="discount-rule-display" 
                readOnly
                value="Allows attendance to all selected classes below"
              />
            </div>
          </div>

          {/* Select Classes Card */}
          <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline/20 shadow-sm">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-extrabold headline text-on-surface uppercase tracking-widest">Select Classes</h2>
                <p className="font-body text-xs text-on-surface-variant opacity-70 mt-1">Choose existing classes from this month to include in the pass.</p>
              </div>
            </div>
            
            {/* Class List */}
            <div className="space-y-3">
              {classes.length === 0 ? (
                <div className="p-8 text-center bg-surface-variant/20 rounded-xl border border-outline/20">
                  <span className="material-symbols-outlined text-outline/50 text-3xl mb-2">event_busy</span>
                  <p className="text-sm font-bold text-on-surface-variant">No classes available</p>
                </div>
              ) : (
                classes.map((cls) => {
                  const isSelected = formData.includedClassIds.includes(cls.id);
                  // Render instructors simply, similar to other editors, but matching the HTML layout
                  return (
                    <label 
                      key={cls.id}
                      className="flex items-center gap-4 p-4 bg-surface-variant/30 rounded-xl border border-outline/20 cursor-pointer group hover:bg-surface-variant/50 transition-colors"
                    >
                      <div className="relative flex items-center justify-center w-5 h-5">
                        <input 
                          checked={isSelected}
                          onChange={() => handleToggleClass(cls.id)}
                          className="peer appearance-none w-5 h-5 border border-outline/40 rounded bg-transparent checked:bg-primary checked:border-primary transition-all duration-200 cursor-pointer" 
                          type="checkbox"
                        />
                        <span className="material-symbols-outlined absolute text-white opacity-0 peer-checked:opacity-100 pointer-events-none text-xs font-bold transition-opacity duration-200">check</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-on-surface group-hover:text-primary transition-colors">{cls.title}</p>
                        <p className="text-[11px] font-bold text-on-surface-variant opacity-70 mt-0.5">
                          {cls.level} • {cls.instructors.map(i => i.name).join(", ")}
                        </p>
                      </div>
                    </label>
                  );
                })
              )}
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default GroupClassMonthlyPassEditor;
