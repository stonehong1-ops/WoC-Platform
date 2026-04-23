"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Group, GroupClass, ClassScheduleEntry } from "@/types/group";
import { groupService } from "@/lib/firebase/groupService";
import { v4 as uuidv4 } from "uuid";

interface GroupClassAddEditorProps {
  group: Group;
  onClose: () => void;
  onSave?: () => void;
  initialData?: GroupClass;
}

const GroupClassAddEditor: React.FC<GroupClassAddEditorProps> = ({ group, onClose, onSave, initialData }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<GroupClass>({
    id: uuidv4(),
    title: "",
    description: "",
    level: "Beginner",
    currency: "KRW",
    amount: 0,
    instructors: [
      { name: "", role: "Main" }
    ],
    schedule: [
      { week: 1, date: new Date().toISOString().split('T')[0], timeSlot: "19:00 - 20:30", content: "" }
    ],
    status: "Open"
  });

  const isEditMode = !!initialData;

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  const handleSave = async () => {
    if (!formData.title.trim()) {
      alert("클래스 제목을 입력해주세요.");
      return;
    }
    if (formData.amount < 0) {
      alert("수강료를 확인해주세요.");
      return;
    }
    if (formData.instructors.some(inst => !inst.name.trim())) {
      alert("강사 이름을 모두 입력해주세요.");
      return;
    }

    setLoading(true);
    try {
      const currentClasses = group.classes || [];
      let updatedClasses: GroupClass[];
      
      if (isEditMode) {
        updatedClasses = currentClasses.map(c => c.id === formData.id ? formData : c);
      } else {
        updatedClasses = [...currentClasses, formData];
      }
      
      await groupService.updateGroupMetadata(group.id, {
        classes: updatedClasses
      });
      
      if (onSave) onSave();
      onClose();
    } catch (error) {
      console.error("Failed to save class:", error);
      alert("클래스 저장에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const addWeek = () => {
    const nextWeekNum = formData.schedule.length + 1;
    const lastDate = formData.schedule.length > 0 
      ? new Date(formData.schedule[formData.schedule.length - 1].date)
      : new Date();
    
    const nextDate = new Date(lastDate);
    if (formData.schedule.length > 0) {
      nextDate.setDate(lastDate.getDate() + 7);
    }

    const newEntry: ClassScheduleEntry = {
      week: nextWeekNum,
      date: nextDate.toISOString().split('T')[0],
      timeSlot: formData.schedule.length > 0 ? formData.schedule[0].timeSlot : "19:00 - 20:30",
      content: ""
    };

    setFormData(prev => ({
      ...prev,
      schedule: [...prev.schedule, newEntry]
    }));
  };

  const removeWeek = (index: number) => {
    if (formData.schedule.length <= 1) return;
    const updated = formData.schedule.filter((_, i) => i !== index).map((entry, i) => ({
      ...entry,
      week: i + 1
    }));
    setFormData({ ...formData, schedule: updated });
  };

  const updateSchedule = (index: number, field: keyof ClassScheduleEntry, value: any) => {
    const updated = [...formData.schedule];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, schedule: updated });
  };

  const addInstructor = () => {
    setFormData(prev => ({
      ...prev,
      instructors: [...prev.instructors, { name: "", role: "Assistant" }]
    }));
  };

  const removeInstructor = (index: number) => {
    if (formData.instructors.length <= 1) return;
    setFormData(prev => ({
      ...prev,
      instructors: prev.instructors.filter((_, i) => i !== index)
    }));
  };

  const updateInstructor = (index: number, field: string, value: string) => {
    const updated = [...formData.instructors];
    updated[index] = { ...updated[index], [field as any]: value };
    setFormData({ ...formData, instructors: updated });
  };

  const getDayOfWeek = (dateString: string) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return "Unknown Day";
    return days[d.getDay()];
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
        <div className="px-10 py-8 bg-gradient-to-br from-[#0057bd] via-[#223ea2] to-[#5e106a] text-white shrink-0 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/5 rounded-full -ml-10 -mb-10 blur-2xl pointer-events-none" />
          
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 bg-white/15 backdrop-blur-2xl rounded-[1.25rem] flex items-center justify-center shadow-xl border border-white/20">
                <span className="material-symbols-outlined text-white text-3xl">school</span>
              </div>
              <div>
                <h2 className="text-2xl font-black font-headline tracking-tight uppercase">
                  {isEditMode ? "Edit Class" : "New Class"}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                  <p className="text-white/70 text-[10px] font-black tracking-widest uppercase">Community Education Program</p>
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
              <div className="w-1 h-4 bg-[#0057bd] rounded-full" />
              <h3 className="text-[10px] font-black text-[#515981] uppercase tracking-[0.2em]">Basic Information</h3>
            </div>
            <div className="space-y-8">
              <div className="relative group">
                <label className="absolute left-6 -top-2.5 px-3 bg-white text-[9px] font-black text-[#0057bd] uppercase tracking-widest z-10 border border-[#efefff] rounded-full">Class Title</label>
                <input 
                  className="w-full bg-white border-2 border-[#efefff] rounded-[1.75rem] px-8 py-6 text-[#242c51] font-black text-lg focus:border-[#0057bd] focus:ring-8 focus:ring-[#0057bd]/5 outline-none transition-all placeholder:text-[#a3abd7]/30 shadow-sm" 
                  placeholder="예: 월요 탱고 입문반" 
                  type="text" 
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
              <div className="relative group">
                <label className="absolute left-6 -top-2.5 px-3 bg-white text-[9px] font-black text-[#0057bd] uppercase tracking-widest z-10 border border-[#efefff] rounded-full">Class Story & Description</label>
                <textarea 
                  className="w-full bg-white border-2 border-[#efefff] rounded-[1.75rem] px-8 py-6 text-[#242c51] font-bold focus:border-[#0057bd] focus:ring-8 focus:ring-[#0057bd]/5 outline-none resize-none min-h-[140px] transition-all placeholder:text-[#a3abd7]/30 leading-relaxed shadow-sm" 
                  placeholder="학생들이 기대할 만한 클래스 소개를 작성해주세요..." 
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
            </div>
          </section>

          {/* Configuration */}
          <section className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="flex items-center gap-3 px-1">
                <div className="w-1 h-4 bg-[#0057bd] rounded-full" />
                <h3 className="text-[10px] font-black text-[#515981] uppercase tracking-[0.2em]">Complexity</h3>
              </div>
              <div className="relative group bg-white border-2 border-[#efefff] rounded-[1.5rem] p-2 flex items-center shadow-sm">
                <div className="w-12 h-12 bg-[#f8faff] rounded-xl flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[#0057bd]">layers</span>
                </div>
                <select 
                  className="flex-1 bg-transparent px-4 py-3 text-[#242c51] font-black text-sm outline-none cursor-pointer appearance-none"
                  value={formData.level}
                  onChange={(e) => setFormData({ ...formData, level: e.target.value as any })}
                >
                  <option>Beginner</option>
                  <option>Intermediate</option>
                  <option>Advanced</option>
                  <option>Masterclass</option>
                </select>
                <span className="material-symbols-outlined pr-4 text-[#a3abd7] pointer-events-none">expand_more</span>
              </div>
            </div>
            <div className="space-y-6">
              <div className="flex items-center gap-3 px-1">
                <div className="w-1 h-4 bg-[#0057bd] rounded-full" />
                <h3 className="text-[10px] font-black text-[#515981] uppercase tracking-[0.2em]">Investment</h3>
              </div>
              <div className="relative group bg-white border-2 border-[#efefff] rounded-[1.5rem] p-2 flex items-center shadow-sm focus-within:border-[#0057bd] focus-within:ring-8 focus-within:ring-[#0057bd]/5 transition-all">
                <div className="w-12 h-12 bg-[#0057bd]/10 rounded-xl flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[#0057bd]">payments</span>
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
            </div>
          </section>

          {/* Instructors */}
          <section className="space-y-6">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-3">
                <div className="w-1 h-4 bg-[#0057bd] rounded-full" />
                <h3 className="text-[10px] font-black text-[#515981] uppercase tracking-[0.2em]">Instructors</h3>
              </div>
              <button 
                onClick={addInstructor}
                className="bg-[#0057bd]/5 text-[#0057bd] px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-[#0057bd] hover:text-white transition-all active:scale-95"
              >
                <span className="material-symbols-outlined text-base">add</span>
                Add Member
              </button>
            </div>
            <div className="grid grid-cols-1 gap-4">
              <AnimatePresence mode="popLayout">
                {formData.instructors.map((inst, index) => (
                  <motion.div 
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="flex items-center gap-5 bg-white p-5 rounded-[2rem] border border-[#efefff] shadow-sm hover:shadow-md transition-all group/inst"
                  >
                    <div className="relative">
                      <img 
                        alt="Avatar" 
                        className="w-16 h-16 rounded-2xl object-cover bg-[#f8faff] border border-[#efefff] shadow-inner" 
                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${inst.name || 'default'}`}
                      />
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-lg shadow-md border border-[#efefff] flex items-center justify-center">
                        <span className="material-symbols-outlined text-[14px] text-[#0057bd] font-black">
                          {inst.role === 'Main' ? 'star' : 'person'}
                        </span>
                      </div>
                    </div>
                    <div className="flex-1 grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[8px] font-black text-[#a3abd7] mb-1.5 uppercase tracking-widest ml-1">Name</label>
                        <input 
                          className="w-full bg-[#f8faff] border border-[#efefff] rounded-xl px-4 py-2.5 text-sm font-black outline-none focus:border-[#0057bd] transition-all" 
                          placeholder="Instructor Name" 
                          value={inst.name}
                          onChange={(e) => updateInstructor(index, "name", e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-[8px] font-black text-[#a3abd7] mb-1.5 uppercase tracking-widest ml-1">Role</label>
                        <input 
                          className="w-full bg-[#f8faff] border border-[#efefff] rounded-xl px-4 py-2.5 text-sm font-bold text-[#515981] outline-none focus:border-[#0057bd] transition-all" 
                          placeholder="e.g. Lead Instructor" 
                          value={inst.role}
                          onChange={(e) => updateInstructor(index, "role", e.target.value)}
                        />
                      </div>
                    </div>
                    {formData.instructors.length > 1 && (
                      <button 
                        onClick={() => removeInstructor(index)}
                        className="w-10 h-10 flex items-center justify-center text-[#ff4b4b] opacity-0 group-hover/inst:opacity-100 hover:bg-[#ff4b4b]/5 rounded-xl transition-all"
                      >
                        <span className="material-symbols-outlined text-xl">delete</span>
                      </button>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </section>

          {/* Schedule */}
          <section className="space-y-6">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-3">
                <div className="w-1 h-4 bg-[#0057bd] rounded-full" />
                <h3 className="text-[10px] font-black text-[#515981] uppercase tracking-[0.2em]">Curriculum Schedule</h3>
              </div>
            </div>
            <div className="space-y-5">
              <AnimatePresence mode="popLayout">
                {formData.schedule.map((entry, index) => (
                  <motion.div 
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-[#f8faff]/50 p-7 rounded-[2.5rem] border border-[#efefff] shadow-sm space-y-6 relative group/card hover:bg-white hover:shadow-xl transition-all border-dashed hover:border-solid hover:border-[#0057bd]/20"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#0057bd] text-white rounded-xl flex items-center justify-center font-black text-xs shadow-lg shadow-[#0057bd]/20">
                          {entry.week}
                        </div>
                        <div>
                          <span className="text-[10px] font-black text-[#242c51] uppercase tracking-[0.2em]">Session #{entry.week}</span>
                          <div className="text-[10px] font-bold text-[#0057bd] tracking-widest uppercase mt-0.5 opacity-60">
                            {getDayOfWeek(entry.date)}
                          </div>
                        </div>
                      </div>
                      {formData.schedule.length > 1 && (
                        <button 
                          onClick={() => removeWeek(index)}
                          className="w-9 h-9 flex items-center justify-center text-[#a3abd7] hover:text-[#ff4b4b] hover:bg-[#ff4b4b]/5 rounded-xl transition-all"
                        >
                          <span className="material-symbols-outlined text-xl">close</span>
                        </button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <label className="block text-[8px] font-black text-[#a3abd7] mb-1.5 uppercase tracking-widest ml-1">Event Date</label>
                        <div className="relative">
                          <input 
                            className="w-full bg-white border border-[#efefff] rounded-2xl px-5 py-3.5 text-xs font-black outline-none focus:ring-4 focus:ring-[#0057bd]/5 focus:border-[#0057bd] transition-all" 
                            type="date" 
                            value={entry.date}
                            onChange={(e) => updateSchedule(index, "date", e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="block text-[8px] font-black text-[#a3abd7] mb-1.5 uppercase tracking-widest ml-1">Time Slot</label>
                        <input 
                          className="w-full bg-white border border-[#efefff] rounded-2xl px-5 py-3.5 text-xs font-black outline-none focus:ring-4 focus:ring-[#0057bd]/5 focus:border-[#0057bd] transition-all" 
                          placeholder="19:00 - 20:30" 
                          value={entry.timeSlot}
                          onChange={(e) => updateSchedule(index, "timeSlot", e.target.value)}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="block text-[8px] font-black text-[#a3abd7] mb-1.5 uppercase tracking-widest ml-1">Session Topic & Content</label>
                      <textarea 
                        className="w-full bg-white border border-[#efefff] rounded-2xl px-6 py-4 text-xs font-medium outline-none focus:ring-4 focus:ring-[#0057bd]/5 focus:border-[#0057bd] transition-all resize-none leading-relaxed" 
                        placeholder="이 세션에서 다룰 주요 주제나 활동을 입력하세요..." 
                        rows={2}
                        value={entry.content}
                        onChange={(e) => updateSchedule(index, "content", e.target.value)}
                      />
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              
              <button 
                onClick={addWeek}
                className="w-full py-6 rounded-[2rem] border-2 border-dashed border-[#0057bd]/10 text-[#0057bd] font-black text-[11px] uppercase tracking-[0.2em] hover:bg-[#0057bd]/5 hover:border-[#0057bd]/30 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
              >
                <span className="material-symbols-outlined font-black">add</span>
                Plan Next Session
              </button>
            </div>
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
            className="flex-[2] py-5 bg-gradient-to-r from-[#0057bd] to-[#223ea2] text-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest shadow-xl shadow-[#0057bd]/25 hover:opacity-95 hover:shadow-2xl hover:shadow-[#0057bd]/30 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-lg">check_circle</span>
                <span>{isEditMode ? "Save Changes" : "Deploy Class"}</span>
              </>
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default GroupClassAddEditor;
