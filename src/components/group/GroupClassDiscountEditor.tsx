"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Group, ClassDiscount } from "@/types/group";
import { groupService } from "@/lib/firebase/groupService";
import { v4 as uuidv4 } from "uuid";

interface GroupClassDiscountEditorProps {
  group: Group;
  onClose: () => void;
  onSave?: () => void;
  initialData?: ClassDiscount | null;
}

const GroupClassDiscountEditor: React.FC<GroupClassDiscountEditorProps> = ({ group, onClose, onSave, initialData }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<ClassDiscount>({
    id: uuidv4(),
    title: "",
    description: "",
    currency: "KRW",
    amount: 0,
    discountDescription: "",
    includedClassIds: []
  });

  const isEditMode = !!initialData;
  const classes = group.classes || [];

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
      alert("할인 혜택 이름을 입력해주세요.");
      return;
    }
    if (formData.includedClassIds.length === 0) {
      alert("최소 하나 이상의 클래스를 선택해주세요.");
      return;
    }
    if (formData.amount <= 0) {
      alert("할인 금액을 입력해주세요.");
      return;
    }

    setLoading(true);
    try {
      let updatedDiscounts: ClassDiscount[];
      const currentDiscounts = group.discounts || [];

      if (isEditMode) {
        updatedDiscounts = currentDiscounts.map(d => d.id === formData.id ? formData : d);
      } else {
        updatedDiscounts = [...currentDiscounts, formData];
      }

      await groupService.updateGroupMetadata(group.id, {
        discounts: updatedDiscounts
      });

      if (onSave) onSave();
      onClose();
    } catch (error) {
      console.error("Failed to save discount:", error);
      alert("할인 혜택 저장에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 bg-[#242c51]/60 backdrop-blur-xl"
    >
      <motion.div
        initial={{ scale: 0.9, y: 40, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.9, y: 40, opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="bg-white w-full max-w-xl rounded-[3rem] shadow-[0_32px_64px_-16px_rgba(36,44,81,0.25)] overflow-hidden flex flex-col max-h-[92vh] border border-white/20"
      >
        {/* Header */}
        <div className="px-10 py-8 bg-gradient-to-br from-[#223ea2] via-[#0057bd] to-[#00a3bd] text-white shrink-0 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl pointer-events-none" />
          
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 bg-white/15 backdrop-blur-2xl rounded-[1.25rem] flex items-center justify-center shadow-xl border border-white/20">
                <span className="material-symbols-outlined text-white text-3xl">percent</span>
              </div>
              <div>
                <h2 className="text-2xl font-black font-headline tracking-tight uppercase">
                  {isEditMode ? "Edit Discount" : "New Discount"}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse" />
                  <p className="text-white/70 text-[10px] font-black tracking-widest uppercase">Bundle Promotion Program</p>
                </div>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="w-11 h-11 rounded-2xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all active:scale-90 border border-white/10"
            >
              <span className="material-symbols-outlined text-white">close</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-10 overflow-y-auto no-scrollbar space-y-10 flex-1">
          {/* Basic Info */}
          <section className="space-y-8">
            <div className="flex items-center gap-3 px-1">
              <div className="w-1 h-4 bg-[#223ea2] rounded-full" />
              <h3 className="text-[10px] font-black text-[#515981] uppercase tracking-[0.2em]">Promotion Details</h3>
            </div>
            <div className="space-y-8">
              <div className="relative group">
                <label className="absolute left-6 -top-2.5 px-3 bg-white text-[9px] font-black text-[#223ea2] uppercase tracking-widest z-10 border border-[#efefff] rounded-full">Bundle Title</label>
                <input 
                  className="w-full bg-white border-2 border-[#efefff] rounded-[1.75rem] px-8 py-6 text-[#242c51] font-black text-lg focus:border-[#223ea2] focus:ring-8 focus:ring-[#223ea2]/5 outline-none transition-all placeholder:text-[#a3abd7]/30 shadow-sm" 
                  placeholder="예: 얼리버드 전과목 패키지" 
                  type="text" 
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
              <div className="relative group">
                <label className="absolute left-6 -top-2.5 px-3 bg-white text-[9px] font-black text-[#223ea2] uppercase tracking-widest z-10 border border-[#efefff] rounded-full">Promotion Description</label>
                <textarea 
                  className="w-full bg-white border-2 border-[#efefff] rounded-[1.75rem] px-8 py-6 text-[#242c51] font-bold focus:border-[#223ea2] focus:ring-8 focus:ring-[#223ea2]/5 outline-none resize-none min-h-[100px] transition-all placeholder:text-[#a3abd7]/30 leading-relaxed shadow-sm" 
                  placeholder="할인 혜택의 조건이나 장점을 설명해주세요..." 
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
            </div>
          </section>

          {/* Pricing Logic */}
          <section className="space-y-6">
            <div className="flex items-center gap-3 px-1">
              <div className="w-1 h-4 bg-[#223ea2] rounded-full" />
              <h3 className="text-[10px] font-black text-[#515981] uppercase tracking-[0.2em]">Benefit Strategy</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="bg-white border-2 border-[#efefff] rounded-[1.5rem] p-2 flex items-center shadow-sm focus-within:border-[#223ea2] focus-within:ring-8 focus-within:ring-[#223ea2]/5 transition-all">
                <div className="w-12 h-12 bg-[#223ea2]/10 rounded-xl flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[#223ea2]">payments</span>
                </div>
                <div className="flex-1 flex items-center">
                  <span className="pl-4 text-[#a3abd7] font-black text-sm">{formData.currency}</span>
                  <input 
                    className="flex-1 bg-transparent px-3 py-3 text-[#242c51] font-black text-lg outline-none transition-all" 
                    placeholder="0" 
                    type="number" 
                    value={formData.amount || ""}
                    onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                  />
                </div>
              </div>
              
              <div className="relative group">
                <label className="absolute left-6 -top-2.5 px-3 bg-white text-[9px] font-black text-[#223ea2] uppercase tracking-widest z-10 border border-[#efefff] rounded-full">Marketing Hook</label>
                <input 
                  className="w-full bg-white border-2 border-[#efefff] rounded-[1.5rem] px-6 py-5 text-[#242c51] font-black text-[15px] focus:border-[#223ea2] focus:ring-8 focus:ring-[#223ea2]/5 outline-none transition-all shadow-sm" 
                  placeholder="예: 25,000원 세이브!" 
                  type="text" 
                  value={formData.discountDescription}
                  onChange={(e) => setFormData({ ...formData, discountDescription: e.target.value })}
                />
              </div>
            </div>
          </section>

          {/* Included Classes */}
          <section className="space-y-6">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-3">
                <div className="w-1 h-4 bg-[#223ea2] rounded-full" />
                <h3 className="text-[10px] font-black text-[#515981] uppercase tracking-[0.2em]">Target Classes</h3>
              </div>
              <button 
                onClick={() => {
                  const allIds = classes.map(c => c.id);
                  setFormData(prev => ({ 
                    ...prev, 
                    includedClassIds: prev.includedClassIds.length === allIds.length ? [] : allIds 
                  }));
                }}
                className="bg-[#223ea2]/5 text-[#223ea2] px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#223ea2] hover:text-white transition-all active:scale-95"
              >
                {formData.includedClassIds.length === classes.length ? "Deselect All" : "Select All"}
              </button>
            </div>
            
            <div className="grid grid-cols-1 gap-3">
              {classes.length === 0 ? (
                <div className="bg-[#f8faff] rounded-[2rem] p-12 text-center border-2 border-dashed border-[#efefff]">
                  <span className="material-symbols-outlined text-[#a3abd7] text-4xl mb-3">inventory_2</span>
                  <p className="text-[#a3abd7] text-sm font-bold headline">선택 가능한 클래스가 없습니다.</p>
                  <p className="text-[#a3abd7]/60 text-xs mt-1">먼저 클래스를 등록해주세요.</p>
                </div>
              ) : (
                classes.map((cls) => {
                  const isSelected = formData.includedClassIds.includes(cls.id);
                  return (
                    <motion.button
                      key={cls.id}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => handleToggleClass(cls.id)}
                      className={`flex items-center gap-5 p-5 rounded-[2rem] border-2 transition-all text-left relative overflow-hidden ${
                        isSelected
                          ? 'bg-[#223ea2]/5 border-[#223ea2] shadow-md'
                          : 'bg-white border-[#efefff] hover:border-[#223ea2]/30 shadow-sm'
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute top-0 right-0 w-16 h-16 bg-[#223ea2]/5 rounded-bl-full flex items-center justify-center pl-4 pb-4">
                          <span className="material-symbols-outlined text-[#223ea2] font-black">check</span>
                        </div>
                      )}
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                        isSelected ? 'bg-[#223ea2] text-white shadow-lg shadow-[#223ea2]/20' : 'bg-[#f8faff] text-[#a3abd7]'
                      }`}>
                        <span className="material-symbols-outlined text-2xl">school</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-[15px] font-black truncate leading-tight ${
                          isSelected ? 'text-[#223ea2]' : 'text-[#242c51]'
                        }`}>
                          {cls.title}
                        </p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-[10px] font-black text-[#a3abd7] uppercase tracking-widest">{cls.level}</span>
                          <div className="w-1 h-1 bg-[#a3abd7]/30 rounded-full" />
                          <span className="text-[10px] font-bold text-[#515981]">{cls.currency} {cls.amount.toLocaleString()}</span>
                        </div>
                      </div>
                    </motion.button>
                  );
                })
              )}
            </div>
            
            <AnimatePresence>
              {formData.includedClassIds.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="bg-green-50 p-5 rounded-[1.5rem] border border-green-100 flex items-center gap-4"
                >
                  <div className="w-10 h-10 bg-green-500 text-white rounded-xl flex items-center justify-center">
                    <span className="material-symbols-outlined font-black">task_alt</span>
                  </div>
                  <div>
                    <p className="text-[11px] font-black text-green-800 uppercase tracking-widest">Bundle Configuration</p>
                    <p className="text-[13px] font-bold text-green-700/80 mt-0.5">{formData.includedClassIds.length}개의 클래스가 패키지에 포함되었습니다.</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </section>
        </div>

        {/* Footer Actions */}
        <div className="p-8 bg-[#f8faff] border-t border-[#efefff] flex gap-4 shrink-0">
          <button 
            onClick={onClose}
            className="flex-1 py-5 bg-white border border-[#efefff] text-[#515981] rounded-[1.5rem] font-black text-xs uppercase tracking-widest hover:bg-gray-50 transition-all active:scale-[0.98] shadow-sm"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            disabled={loading}
            className="flex-[2] py-5 bg-gradient-to-r from-[#223ea2] to-[#0057bd] text-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest shadow-xl shadow-[#223ea2]/25 hover:opacity-95 hover:shadow-2xl hover:shadow-[#223ea2]/30 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-lg">verified</span>
                <span>{isEditMode ? "Save Changes" : "Create Discount"}</span>
              </>
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default GroupClassDiscountEditor;
