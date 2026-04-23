"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Group, MonthlyPass } from "@/types/group";
import { groupService } from "@/lib/firebase/groupService";
import { v4 as uuidv4 } from "uuid";

interface GroupClassMonthlyPassEditorProps {
  group: Group;
  initialData?: MonthlyPass | null;
  onClose: () => void;
  onSave?: () => void;
}

const GroupClassMonthlyPassEditor: React.FC<GroupClassMonthlyPassEditorProps> = ({ 
  group, 
  initialData, 
  onClose, 
  onSave 
}) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<MonthlyPass>({
    id: uuidv4(),
    title: "",
    description: "",
    currency: "KRW",
    amount: 0,
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

  const handleSelectAll = () => {
    const allIds = classes.map(c => c.id);
    setFormData(prev => ({
      ...prev,
      includedClassIds: prev.includedClassIds.length === allIds.length ? [] : allIds
    }));
  };

  const handleSave = async () => {
    if (!formData.title) {
      alert("패스 이름을 입력해주세요.");
      return;
    }
    if (formData.includedClassIds.length === 0) {
      alert("최소 하나 이상의 클래스를 선택해주세요.");
      return;
    }

    setLoading(true);
    try {
      let updatedPasses: MonthlyPass[];
      const currentPasses = group.monthlyPasses || [];

      if (isEditMode) {
        updatedPasses = currentPasses.map(p => p.id === formData.id ? formData : p);
      } else {
        updatedPasses = [...currentPasses, formData];
      }

      await groupService.updateGroupMetadata(group.id, {
        monthlyPasses: updatedPasses
      });

      if (onSave) onSave();
      onClose();
    } catch (error) {
      console.error("Failed to save monthly pass:", error);
      alert("월정액 패스 저장에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 bg-[#242c51]/60 backdrop-blur-sm"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 30 }}
        className="bg-white w-full max-w-2xl rounded-[3rem] shadow-[0_32px_64px_-16px_rgba(36,44,81,0.25)] overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="px-10 py-8 bg-gradient-to-br from-[#f199f7] via-[#d66edc] to-[#b84ec0] text-white shrink-0 relative overflow-hidden">
          {/* Background Decorative Elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-black/10 rounded-full -ml-10 -mb-10 blur-2xl" />
          
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-xl rounded-[1.5rem] flex items-center justify-center shadow-xl border border-white/30">
                <span className="material-symbols-outlined text-white text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>confirmation_number</span>
              </div>
              <div>
                <h2 className="text-2xl font-black font-headline tracking-tight uppercase leading-none">
                  {isEditMode ? "Edit Pass" : "New Pass"}
                </h2>
                <p className="text-white/80 text-[10px] font-black tracking-[0.2em] uppercase mt-2 opacity-80">Monthly Membership Pass</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="w-12 h-12 rounded-2xl bg-black/10 hover:bg-black/20 flex items-center justify-center transition-all active:scale-90"
            >
              <span className="material-symbols-outlined text-white">close</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-10 py-10 overflow-y-auto no-scrollbar space-y-12 flex-1 bg-[#f8faff]">
          {/* Basic Info */}
          <section className="space-y-8">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-[#f199f7]/10 rounded-xl flex items-center justify-center">
                <span className="material-symbols-outlined text-[#d66edc] text-xl">info</span>
              </div>
              <div>
                <h3 className="text-[11px] font-black text-[#242c51] uppercase tracking-[0.2em]">Essential Details</h3>
                <p className="text-[9px] font-bold text-[#a3abd7] uppercase tracking-widest mt-0.5">Identify your membership tier</p>
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="relative group">
                <label className="absolute left-6 -top-2.5 px-3 bg-white text-[9px] font-black text-[#d66edc] uppercase tracking-widest z-10 border border-[#efefff] rounded-full">Pass Identity</label>
                <input 
                  className="w-full bg-white border-2 border-[#efefff] rounded-[1.75rem] px-8 py-6 text-[#242c51] font-black text-lg focus:border-[#f199f7] focus:ring-8 focus:ring-[#f199f7]/5 outline-none transition-all placeholder:text-[#a3abd7]/30" 
                  placeholder="e.g., Diamond VIP Monthly Pass" 
                  type="text" 
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
              
              <div className="relative group">
                <label className="absolute left-6 -top-2.5 px-3 bg-white text-[9px] font-black text-[#d66edc] uppercase tracking-widest z-10 border border-[#efefff] rounded-full">Member Benefits</label>
                <textarea 
                  className="w-full bg-white border-2 border-[#efefff] rounded-[1.75rem] px-8 py-6 text-[#242c51] font-bold focus:border-[#f199f7] focus:ring-8 focus:ring-[#f199f7]/5 outline-none resize-none min-h-[120px] transition-all placeholder:text-[#a3abd7]/30 leading-relaxed" 
                  placeholder="Describe the exclusive benefits and access levels..." 
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
            </div>
          </section>

          {/* Pricing */}
          <section className="space-y-6">
            <div className="flex items-center gap-3 px-1">
              <div className="w-1 h-4 bg-[#d66edc] rounded-full" />
              <h3 className="text-[10px] font-black text-[#515981] uppercase tracking-[0.2em]">Pricing Strategy</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white border-2 border-[#efefff] rounded-[1.5rem] p-2 flex items-center shadow-sm">
                <div className="w-12 h-12 bg-[#f8faff] rounded-xl flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[#d66edc]">currency_exchange</span>
                </div>
                <select 
                  className="flex-1 bg-transparent px-4 py-3 text-[#242c51] font-black outline-none cursor-pointer"
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                >
                  <option value="KRW">KRW - Korean Won</option>
                  <option value="USD">USD - US Dollar</option>
                  <option value="EUR">EUR - Euro</option>
                </select>
              </div>
              
              <div className="bg-white border-2 border-[#efefff] rounded-[1.5rem] p-2 flex items-center shadow-sm group-focus-within:border-[#f199f7] transition-all">
                <div className="w-12 h-12 bg-[#f199f7]/10 rounded-xl flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[#d66edc]">payments</span>
                </div>
                <input 
                  className="flex-1 bg-transparent px-4 py-3 text-[#242c51] font-black outline-none placeholder:text-[#a3abd7]/30" 
                  placeholder="0" 
                  type="number" 
                  value={formData.amount || ""}
                  onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="bg-gradient-to-br from-[#f199f7]/10 to-transparent p-6 rounded-[2rem] border border-[#f199f7]/20 flex gap-4">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shrink-0 shadow-sm">
                <span className="material-symbols-outlined text-[#d66edc] text-xl">verified</span>
              </div>
              <div>
                <p className="text-[11px] font-black text-[#5e106a] uppercase tracking-widest mb-1">Pass Benefit Policy</p>
                <p className="text-xs font-bold text-[#5e106a]/70 leading-relaxed">
                  Monthly passes grant unlimited access to all selected classes for 30 days from the date of purchase. This is the best value for frequent attendees.
                </p>
              </div>
            </div>
          </section>

          {/* Included Classes */}
          <section className="space-y-6">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-3">
                <div className="w-1 h-4 bg-[#d66edc] rounded-full" />
                <h3 className="text-[10px] font-black text-[#515981] uppercase tracking-[0.2em]">Included Classes</h3>
              </div>
              <button 
                onClick={handleSelectAll}
                className="text-[10px] font-black text-[#d66edc] uppercase tracking-[0.2em] px-4 py-2 bg-white rounded-full border border-[#efefff] hover:bg-[#f199f7] hover:text-white hover:border-[#f199f7] transition-all"
              >
                {formData.includedClassIds.length === classes.length ? "Deselect All" : "Select All Classes"}
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {classes.length === 0 ? (
                <div className="bg-white rounded-[2rem] p-12 text-center border-2 border-dashed border-[#efefff]">
                  <div className="w-16 h-16 bg-[#f8faff] rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <span className="material-symbols-outlined text-[#a3abd7] text-3xl">event_busy</span>
                  </div>
                  <p className="text-[#a3abd7] text-sm font-black headline uppercase tracking-widest">No classes found</p>
                </div>
              ) : (
                classes.map((cls) => {
                  const isSelected = formData.includedClassIds.includes(cls.id);
                  return (
                    <button
                      key={cls.id}
                      onClick={() => handleToggleClass(cls.id)}
                      className={`group/card flex items-center gap-4 p-5 rounded-[1.5rem] border-2 transition-all relative overflow-hidden ${
                        isSelected
                          ? "bg-white border-[#f199f7] shadow-[0_8px_16px_-4px_rgba(214,110,220,0.15)]"
                          : "bg-white border-[#efefff] hover:border-[#f199f7]/30"
                      }`}
                    >
                      {/* Selection Indicator */}
                      <div className={`w-8 h-8 rounded-xl border-2 flex items-center justify-center transition-all shrink-0 ${
                        isSelected
                          ? "bg-[#d66edc] border-[#d66edc] scale-110"
                          : "bg-[#f8faff] border-[#efefff] group-hover/card:border-[#f199f7]/50"
                      }`}>
                        {isSelected && (
                          <span className="material-symbols-outlined text-white text-xl font-black">check</span>
                        )}
                      </div>

                      <div className="flex-1 text-left min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className={`text-sm font-black truncate tracking-tight ${
                            isSelected ? "text-[#5e106a]" : "text-[#242c51]"
                          }`}>
                            {cls.title}
                          </p>
                          <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest ${
                            isSelected ? "bg-[#f199f7]/20 text-[#d66edc]" : "bg-[#f8faff] text-[#a3abd7]"
                          }`}>
                            {cls.level}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                           <div className="flex -space-x-2">
                            {cls.instructors.map((inst, i) => (
                              <img 
                                key={i}
                                src={inst.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${inst.name}`} 
                                className="w-5 h-5 rounded-full border border-white shadow-sm"
                                alt={inst.name}
                              />
                            ))}
                          </div>
                          <span className="text-[10px] font-bold text-[#a3abd7]">
                            {cls.instructors.map(i => i.name).join(", ")}
                          </span>
                        </div>
                      </div>

                      {/* Accent for selected state */}
                      {isSelected && (
                        <div className="absolute top-0 right-0 w-16 h-16 bg-[#f199f7]/5 rounded-bl-full pointer-events-none" />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </section>
        </div>

        {/* Footer Actions */}
        <div className="px-10 py-8 bg-white border-t border-[#efefff] flex gap-4 shrink-0 shadow-[0_-8px_24px_rgba(0,0,0,0.02)]">
          <button 
            onClick={onClose}
            className="flex-1 py-5 bg-[#f8faff] text-[#515981] rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] hover:bg-[#efefff] transition-all active:scale-[0.98]"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            disabled={loading}
            className="flex-[2] py-5 bg-gradient-to-r from-[#f199f7] to-[#d66edc] text-white rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-[#f199f7]/30 hover:opacity-90 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <span>{isEditMode ? "Update Pass" : "Create Pass"}</span>
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default GroupClassMonthlyPassEditor;
