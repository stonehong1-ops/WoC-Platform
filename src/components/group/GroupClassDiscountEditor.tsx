"use client";

import React, { useState, useEffect } from "react";

import { Group, ClassDiscount } from "@/types/group";
import { groupService } from "@/lib/firebase/groupService";
import { v4 as uuidv4 } from "uuid";

interface GroupClassDiscountEditorProps {
  group: Group;
  onClose: () => void;
  onSave?: () => void;
  initialData?: ClassDiscount | null;
  targetMonth?: string;
}

const GroupClassDiscountEditor: React.FC<GroupClassDiscountEditorProps> = ({ group, onClose, onSave, initialData, targetMonth }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<ClassDiscount>({
    id: initialData?.id || uuidv4(),
    title: initialData?.title || "",
    description: initialData?.description || "",
    currency: initialData?.currency || "KRW",
    amount: initialData?.amount || 0,
    discountDescription: initialData?.discountDescription || "",
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
    if (!formData.title.trim()) {
      alert("Please enter a bundle title.");
      return;
    }
    if (formData.includedClassIds.length < 2) {
      alert("Please select at least 2 classes.");
      return;
    }
    if (formData.amount < 0) {
      alert("Please enter a discount amount.");
      return;
    }

    setLoading(true);
    try {
      if (initialData) {
        await groupService.updateDiscount(group.id, formData.id, formData);
      } else {
        await groupService.addDiscount(group.id, formData);
      }
      
      if (onSave) onSave();
      onClose();
    } catch (error) {
      console.error("Failed to save discount:", error);
      alert("Failed to save the bundle.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[200] text-[#242c51] bg-[#F3F4F6] min-h-screen overflow-y-auto font-['Inter'] animate-in slide-in-from-bottom-[100%] duration-300"
    >
      <style>{`
        input[type="number"]::-webkit-inner-spin-button,
        input[type="number"]::-webkit-outer-spin-button {
            -webkit-appearance: none;
            margin: 0;
        }
        ::-webkit-scrollbar {
            width: 6px;
        }
        ::-webkit-scrollbar-track {
            background: transparent;
        }
        ::-webkit-scrollbar-thumb {
            background: #CBD5E1;
            border-radius: 10px;
        }
      `}</style>
      
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#F3F4F6] px-6 py-4 flex items-center border-b border-[#6c759e]/20">
        <div className="max-w-md mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={onClose} className="material-symbols-outlined text-[#515981] p-2 hover:bg-[#d6dbff] rounded-full transition-colors active:scale-[0.98]">close</button>
            <h1 className="text-xl font-extrabold tracking-tight text-[#242c51] font-['Plus_Jakarta_Sans']">{isEditMode ? "Edit Bundle" : "Discount Editor"}</h1>
          </div>
          <button 
            onClick={handleSave}
            disabled={loading}
            className="bg-[#0057bd] text-white font-bold text-sm px-6 py-2 rounded-lg shadow-sm shadow-[#0057bd]/20 hover:bg-[#0057bd]/90 transition-all active:scale-[0.98] flex items-center gap-2"
          >
            {loading && <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>}
            Save
          </button>
        </div>
      </header>

      <main className="max-w-md mx-auto px-6 py-8 space-y-6">
        {/* Basic Info Card */}
        <div className="bg-[#ffffff] p-6 rounded-xl border border-[#6c759e]/20 shadow-sm space-y-5">
          <div>
            <label className="block text-[10px] font-bold text-[#515981] mb-2 uppercase tracking-widest opacity-70" htmlFor="discount-title">Class Title</label>
            <input 
              id="discount-title"
              className="w-full bg-[#d6dbff]/30 border border-[#6c759e]/30 rounded-lg px-4 py-3 text-[#242c51] focus:ring-2 focus:ring-[#0057bd]/20 focus:border-[#0057bd] placeholder:text-[#515981]/40 outline-none transition-all" 
              placeholder="Enter discount title" 
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-[#515981] mb-2 uppercase tracking-widest opacity-70" htmlFor="discount-desc">Description</label>
            <textarea 
              id="discount-desc"
              className="w-full bg-[#d6dbff]/30 border border-[#6c759e]/30 rounded-lg px-4 py-3 text-[#242c51] focus:ring-2 focus:ring-[#0057bd]/20 focus:border-[#0057bd] placeholder:text-[#515981]/40 outline-none resize-none text-sm transition-all" 
              placeholder="Describe the discount..." 
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            ></textarea>
          </div>
        </div>

        {/* Pricing & Discount Details Card */}
        <div className="bg-[#ffffff] p-6 rounded-xl border border-[#6c759e]/20 shadow-sm space-y-5">
          <h2 className="text-sm font-extrabold font-['Plus_Jakarta_Sans'] text-[#242c51] uppercase tracking-widest mb-4">Pricing</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-[#515981] mb-2 uppercase tracking-widest opacity-70">Currency</label>
              <div className="relative">
                <select 
                  className="w-full bg-[#d6dbff]/30 border border-[#6c759e]/30 rounded-lg px-4 py-3 text-[#242c51] focus:ring-2 focus:ring-[#0057bd]/20 focus:border-[#0057bd] appearance-none outline-none transition-all text-sm"
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value as any })}
                >
                  <option value="KRW">KRW - South Korean Won</option>
                  <option value="USD">USD - US Dollar</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="JPY">JPY - Japanese Yen</option>
                </select>
                <span className="material-symbols-outlined absolute right-3 top-3 pointer-events-none text-[#515981]">expand_more</span>
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-[#515981] mb-2 uppercase tracking-widest opacity-70">Amount</label>
              <div className="relative">
                <span className="absolute left-4 top-3.5 text-[#515981] font-bold text-sm">
                  {formData.currency === 'KRW' ? '₩' : formData.currency === 'USD' ? '$' : formData.currency === 'EUR' ? '€' : formData.currency === 'JPY' ? '¥' : '₩'}
                </span>
                <input 
                  className="w-full bg-[#d6dbff]/30 border border-[#6c759e]/30 rounded-lg pl-8 pr-4 py-3 text-[#242c51] focus:ring-2 focus:ring-[#0057bd]/20 focus:border-[#0057bd] outline-none transition-all text-sm" 
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
          <div className="mt-5">
            <label className="block text-[10px] font-bold text-[#515981] mb-2 uppercase tracking-widest opacity-70" htmlFor="discount-details">Discount Description</label>
            <input 
              id="discount-details"
              className="w-full bg-[#d6dbff]/30 border border-[#6c759e]/30 rounded-lg px-4 py-3 text-[#242c51] focus:ring-2 focus:ring-[#0057bd]/20 focus:border-[#0057bd] placeholder:text-[#515981]/40 outline-none transition-all text-sm" 
              placeholder="e.g., '20% discount for bundle classes'" 
              type="text"
              value={formData.discountDescription}
              onChange={(e) => setFormData({ ...formData, discountDescription: e.target.value })}
            />
          </div>
        </div>

        {/* Select Classes Card */}
        <div className="bg-[#ffffff] p-6 rounded-xl border border-[#6c759e]/20 shadow-sm">
          <div className="mb-6">
            <h2 className="text-sm font-extrabold font-['Plus_Jakarta_Sans'] text-[#242c51] uppercase tracking-widest">Select Classes</h2>
            <p className="font-['Inter'] text-xs text-[#515981] opacity-70 mt-1">Choose existing classes from this month to include in the bundle.</p>
          </div>
          <div className="space-y-3">
            {classes.length === 0 ? (
              <p className="text-sm text-center py-4 text-[#515981]/60 font-bold">No classes available.</p>
            ) : (
              classes.map((cls) => {
                const isSelected = formData.includedClassIds.includes(cls.id);
                return (
                  <label key={cls.id} className="flex items-center gap-4 p-4 bg-[#d6dbff]/30 rounded-xl border border-[#6c759e]/20 cursor-pointer group">
                    <div className="relative flex items-center justify-center w-5 h-5 shrink-0">
                      <input 
                        type="checkbox"
                        className="peer appearance-none w-5 h-5 border border-[#6c759e]/40 rounded bg-transparent checked:bg-[#0057bd] checked:border-[#0057bd] transition-all duration-200 cursor-pointer"
                        checked={isSelected}
                        onChange={() => handleToggleClass(cls.id)}
                      />
                      <span className="material-symbols-outlined absolute text-white opacity-0 peer-checked:opacity-100 pointer-events-none text-xs font-bold transition-opacity duration-200">check</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-[#242c51] group-hover:text-[#0057bd] transition-colors truncate">{cls.title}</p>
                      <p className="text-[11px] font-bold text-[#515981] opacity-70 truncate mt-0.5">
                        {cls.schedule && cls.schedule.length > 0 
                          ? `${cls.schedule[0].date} • ${cls.schedule[0].timeSlot}` 
                          : "No schedule"}
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
  );
};

export default GroupClassDiscountEditor;

