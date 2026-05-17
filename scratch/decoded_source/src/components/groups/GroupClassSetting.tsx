"use client";

import React, { useState, useEffect } from "react";
import { Group, GroupClass, ClassScheduleEntry } from "@/types/group";
import { groupService } from "@/lib/firebase/groupService";
import { useAuth } from "@/components/providers/AuthProvider";

interface Instructor {
  name: string;
  avatar?: string;
  role: string;
}


interface GroupClassSettingProps {
  group: Group;
  onBack: () => void;
}

export default function GroupClassSetting({ group, onBack }: GroupClassSettingProps) {
  const { profile } = useAuth();
  const [classes, setClasses] = useState<GroupClass[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingClass, setEditingClass] = useState<GroupClass | null>(null);
  const [loading, setLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState<Partial<GroupClass>>({
    title: "",
    description: "",
    level: "Beginner",
    status: "Open",
    currency: "KRW",
    amount: 0,
    instructors: [{ name: "", role: "Main Instructor" }],
    schedule: [{ week: 1, date: "", timeSlot: "", content: "" }]
  });

  useEffect(() => {
    if (!group.id) return;
    const unsubscribe = groupService.subscribeClasses(group.id, setClasses);
    return () => unsubscribe();
  }, [group.id]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!group.id) return;
    setLoading(true);

    try {
      if (editingClass) {
        await groupService.updateClass(group.id, editingClass.id, formData);
      } else {
        await groupService.addClass(group.id, formData);
      }
      setIsAdding(false);
      setEditingClass(null);
      resetForm();
    } catch (error) {
      console.error("Error saving class:", error);
      alert("Failed to save class. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (classId: string) => {
    if (!confirm("Are you sure you want to delete this class?")) return;
    if (!group.id) return;

    try {
      await groupService.deleteClass(group.id, classId);
    } catch (error) {
      console.error("Error deleting class:", error);
    }
  };

  const handleToggleStatus = async (cls: GroupClass) => {
    if (!group.id) return;
    const newStatus = cls.status === "Open" ? "Closed" : "Open";
    try {
      await groupService.updateClass(group.id, cls.id, { status: newStatus });
    } catch (error) {
      console.error("Error toggling status:", error);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      level: "Beginner",
      status: "Open",
      currency: "KRW",
      amount: 0,
      instructors: [{ name: "", role: "Main Instructor" }],
      schedule: [{ week: 1, date: "", timeSlot: "", content: "" }]
    });
  };

  const handleEdit = (cls: GroupClass) => {
    setEditingClass(cls);
    setFormData(cls);
    setIsAdding(true);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0f172a] p-4 md:p-8 font-['Inter']">
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div className="flex items-center gap-4">
            <button 
              onClick={onBack}
              className="w-12 h-12 rounded-2xl bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all shadow-sm"
            >
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <div>
              <h1 className="text-3xl font-['Plus_Jakarta_Sans'] font-extrabold text-[#1a1c2e] dark:text-white tracking-tight">Class Management</h1>
              <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">Configure and organize your curriculum</p>
            </div>
          </div>
          
          {!isAdding && (
            <button 
              onClick={() => { resetForm(); setIsAdding(true); }}
              className="h-14 px-8 bg-[#4f46e5] text-white rounded-2xl font-bold shadow-xl shadow-[#4f46e5]/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
            >
              <span className="material-symbols-outlined font-bold">add</span>
              <span>Create New Class</span>
            </button>
          )}
        </div>

        {isAdding ? (
          /* Form Section - Shop Settings Style */
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white dark:bg-[#1e293b] rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-2xl shadow-slate-200/50 dark:shadow-none overflow-hidden">
              <div className="p-8 md:p-12">
                <div className="flex items-center gap-4 mb-10">
                  <div className="w-12 h-12 rounded-2xl bg-[#4f46e5]/10 flex items-center justify-center text-[#4f46e5]">
                    <span className="material-symbols-outlined text-2xl font-bold">{editingClass ? "edit_note" : "add_circle"}</span>
                  </div>
                  <h2 className="text-2xl font-['Plus_Jakarta_Sans'] font-bold text-[#1a1c2e] dark:text-white">
                    {editingClass ? "Update Class Details" : "New Class Registration"}
                  </h2>
                </div>

                <form onSubmit={handleSave} className="space-y-10">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Class Title */}
                    <div className="space-y-3">
                      <label className="text-sm font-bold text-[#515981] dark:text-slate-400 ml-1 uppercase tracking-widest">Class Title</label>
                      <input 
                        required
                        type="text"
                        placeholder="e.g. Tango Beginners Intensive"
                        className="w-full h-14 px-6 rounded-2xl bg-slate-50 dark:bg-[#0f172a] border border-slate-100 dark:border-slate-800 focus:bg-white dark:focus:bg-[#0f172a] focus:ring-4 focus:ring-[#4f46e5]/10 focus:border-[#4f46e5] outline-none transition-all font-medium text-[#1a1c2e] dark:text-white"
                        value={formData.title}
                        onChange={e => setFormData({...formData, title: e.target.value})}
                      />
                    </div>

                    {/* Level Selection */}
                    <div className="space-y-3">
                      <label className="text-sm font-bold text-[#515981] dark:text-slate-400 ml-1 uppercase tracking-widest">Experience Level</label>
                      <div className="relative">
                        <select 
                          className="w-full h-14 px-6 rounded-2xl bg-slate-50 dark:bg-[#0f172a] border border-slate-100 dark:border-slate-800 focus:bg-white focus:ring-4 focus:ring-[#4f46e5]/10 focus:border-[#4f46e5] outline-none transition-all font-bold text-[#1a1c2e] dark:text-white appearance-none"
                          value={formData.level}
                          onChange={e => setFormData({...formData, level: e.target.value as any})}
                        >
                          <option value="Beginner">Beginner</option>
                          <option value="Intermediate">Intermediate</option>
                          <option value="Advanced">Advanced</option>
                          <option value="Masterclass">Masterclass</option>
                        </select>
                        <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">expand_more</span>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="space-y-3">
                    <label className="text-sm font-bold text-[#515981] dark:text-slate-400 ml-1 uppercase tracking-widest">About this class</label>
                    <textarea 
                      rows={4}
                      placeholder="Describe the curriculum and what students will learn..."
                      className="w-full p-6 rounded-3xl bg-slate-50 dark:bg-[#0f172a] border border-slate-100 dark:border-slate-800 focus:bg-white focus:ring-4 focus:ring-[#4f46e5]/10 focus:border-[#4f46e5] outline-none transition-all font-medium text-[#1a1c2e] dark:text-white resize-none"
                      value={formData.description}
                      onChange={e => setFormData({...formData, description: e.target.value})}
                    />
                  </div>

                  {/* Pricing and Status */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="space-y-3">
                      <label className="text-sm font-bold text-[#515981] dark:text-slate-400 ml-1 uppercase tracking-widest">Registration Status</label>
                      <div className="relative">
                        <select 
                          className="w-full h-14 px-6 rounded-2xl bg-slate-50 dark:bg-[#0f172a] border border-slate-100 dark:border-slate-800 focus:bg-white focus:ring-4 focus:ring-[#4f46e5]/10 focus:border-[#4f46e5] outline-none transition-all font-bold text-[#1a1c2e] dark:text-white appearance-none"
                          value={formData.status}
                          onChange={e => setFormData({...formData, status: e.target.value as any})}
                        >
                          <option value="Open">Registration Open</option>
                          <option value="Closed">Registration Closed</option>
                        </select>
                        <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">expand_more</span>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <label className="text-sm font-bold text-[#515981] dark:text-slate-400 ml-1 uppercase tracking-widest">Currency</label>
                      <input 
                        type="text"
                        placeholder="KRW"
                        className="w-full h-14 px-6 rounded-2xl bg-slate-50 dark:bg-[#0f172a] border border-slate-100 dark:border-slate-800 focus:bg-white focus:ring-4 focus:ring-[#4f46e5]/10 focus:border-[#4f46e5] outline-none transition-all font-black text-center text-[#1a1c2e] dark:text-white"
                        value={formData.currency}
                        onChange={e => setFormData({...formData, currency: e.target.value})}
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-sm font-bold text-[#515981] dark:text-slate-400 ml-1 uppercase tracking-widest">Price</label>
                      <input 
                        type="number"
                        placeholder="0"
                        className="w-full h-14 px-6 rounded-2xl bg-slate-50 dark:bg-[#0f172a] border border-slate-100 dark:border-slate-800 focus:bg-white focus:ring-4 focus:ring-[#4f46e5]/10 focus:border-[#4f46e5] outline-none transition-all font-black text-[#1a1c2e] dark:text-white"
                        value={formData.amount}
                        onChange={e => setFormData({...formData, amount: Number(e.target.value)})}
                      />
                    </div>
                  </div>

                  {/* Dynamic Sections (Instructors & Schedule) */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 pt-6 border-t border-slate-100 dark:border-slate-800">
                    {/* Instructors */}
                    <div className="space-y-6">
                      <div className="flex justify-between items-center">
                        <label className="text-sm font-bold text-[#515981] dark:text-slate-400 ml-1 uppercase tracking-widest">Instructors</label>
                        <button 
                          type="button"
                          onClick={() => setFormData({...formData, instructors: [...(formData.instructors || []), { name: "", role: "" }]})}
                          className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-[#1a1c2e] dark:text-white rounded-xl text-xs font-black hover:bg-[#4f46e5] hover:text-white transition-all"
                        >
                          + ADD NEW
                        </button>
                      </div>
                      <div className="space-y-4">
                        {formData.instructors?.map((instructor, idx) => (
                          <div key={idx} className="flex gap-4 items-center animate-in fade-in slide-in-from-left-2">
                            <input 
                              placeholder="Name"
                              className="flex-1 h-12 px-5 rounded-xl bg-slate-50 dark:bg-[#0f172a] border border-slate-100 dark:border-slate-800 text-sm font-bold"
                              value={instructor.name}
                              onChange={e => {
                                const newInstructors = [...(formData.instructors || [])];
                                newInstructors[idx].name = e.target.value;
                                setFormData({...formData, instructors: newInstructors});
                              }}
                            />
                            <input 
                              placeholder="Role"
                              className="w-32 h-12 px-5 rounded-xl bg-slate-50 dark:bg-[#0f172a] border border-slate-100 dark:border-slate-800 text-sm font-medium"
                              value={instructor.role}
                              onChange={e => {
                                const newInstructors = [...(formData.instructors || [])];
                                newInstructors[idx].role = e.target.value;
                                setFormData({...formData, instructors: newInstructors});
                              }}
                            />
                            {idx > 0 && (
                              <button 
                                type="button"
                                onClick={() => {
                                  const newInstructors = [...(formData.instructors || [])];
                                  newInstructors.splice(idx, 1);
                                  setFormData({...formData, instructors: newInstructors});
                                }}
                                className="w-10 h-10 flex items-center justify-center text-red-400 hover:text-red-600 transition-colors"
                              >
                                <span className="material-symbols-outlined text-xl">remove_circle</span>
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Schedule */}
                    <div className="space-y-6">
                      <div className="flex justify-between items-center">
                        <label className="text-sm font-bold text-[#515981] dark:text-slate-400 ml-1 uppercase tracking-widest">Schedule Slots</label>
                        <button 
                          type="button"
                          onClick={() => setFormData({...formData, schedule: [...(formData.schedule || []), { week: (formData.schedule?.length || 0) + 1, date: "", timeSlot: "", content: "" }]})}
                          className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-[#1a1c2e] dark:text-white rounded-xl text-xs font-black hover:bg-[#4f46e5] hover:text-white transition-all"
                        >
                          + ADD SLOT
                        </button>
                      </div>
                      <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                        {formData.schedule?.map((slot, idx) => (
                          <div key={idx} className="p-6 rounded-3xl bg-slate-50 dark:bg-[#0f172a] border border-slate-100 dark:border-slate-800 space-y-4 animate-in fade-in slide-in-from-right-2">
                            <div className="flex justify-between items-center">
                              <span className="px-3 py-1 bg-white dark:bg-slate-800 rounded-lg text-[10px] font-black text-[#4f46e5] uppercase tracking-tighter shadow-sm">Week {slot.week}</span>
                              {idx > 0 && (
                                <button 
                                  type="button"
                                  onClick={() => {
                                    const newSchedule = [...(formData.schedule || [])];
                                    newSchedule.splice(idx, 1);
                                    setFormData({...formData, schedule: newSchedule});
                                  }}
                                  className="text-red-400 hover:text-red-600 transition-colors"
                                >
                                  <span className="material-symbols-outlined text-xl">delete</span>
                                </button>
                              )}
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <input 
                                type="date"
                                className="h-10 px-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                                value={slot.date}
                                onChange={e => {
                                  const newSchedule = [...(formData.schedule || [])];
                                  newSchedule[idx].date = e.target.value;
                                  setFormData({...formData, schedule: newSchedule});
                                }}
                              />
                              <input 
                                placeholder="Time (19:00 - 20:30)"
                                className="h-10 px-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium"
                                value={slot.timeSlot}
                                onChange={e => {
                                  const newSchedule = [...(formData.schedule || [])];
                                  newSchedule[idx].timeSlot = e.target.value;
                                  setFormData({...formData, schedule: newSchedule});
                                }}
                              />
                            </div>
                            <input 
                              placeholder="Session Content (e.g. Fundamental Steps)"
                              className="w-full h-10 px-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                              value={slot.content}
                              onChange={e => {
                                const newSchedule = [...(formData.schedule || [])];
                                newSchedule[idx].content = e.target.value;
                                setFormData({...formData, schedule: newSchedule});
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-6 pt-10 border-t border-slate-100 dark:border-slate-800">
                    <button 
                      type="button"
                      onClick={() => { setIsAdding(false); setEditingClass(null); }}
                      className="flex-1 h-16 rounded-2xl font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                    >
                      Discard Changes
                    </button>
                    <button 
                      type="submit"
                      disabled={loading}
                      className="flex-[2] h-16 rounded-2xl bg-[#1a1c2e] dark:bg-white text-white dark:text-[#1a1c2e] font-black shadow-2xl shadow-slate-200 dark:shadow-none hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                    >
                      {loading ? (
                        <div className="w-6 h-6 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
                      ) : (
                        <>
                          <span className="material-symbols-outlined font-bold">verified</span>
                          <span>{editingClass ? "UPDATE CURRICULUM" : "CONFIRM & PUBLISH"}</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        ) : (
          /* List View - Shop Settings Style */
          <div className="grid grid-cols-1 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {classes.length > 0 ? (
              classes.map((cls) => (
                <div 
                  key={cls.id} 
                  className="group bg-white dark:bg-[#1e293b] rounded-[2rem] p-6 border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/40 dark:shadow-none hover:shadow-2xl hover:border-[#4f46e5]/30 transition-all duration-500 flex flex-col md:flex-row gap-8 items-center"
                >
                  {/* Class Icon/Visual */}
                  <div className="w-24 h-24 md:w-32 md:h-32 rounded-3xl bg-slate-50 dark:bg-[#0f172a] flex items-center justify-center text-[#4f46e5]/40 group-hover:text-[#4f46e5] group-hover:scale-105 transition-all duration-500 shrink-0 border border-slate-100 dark:border-slate-800 shadow-inner">
                    <span className="material-symbols-outlined text-4xl md:text-5xl font-light">
                      {cls.level === 'Beginner' ? 'school' : cls.level === 'Masterclass' ? 'workspace_premium' : 'menu_book'}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="flex-1 text-center md:text-left">
                    <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-3">
                      <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                        cls.status === 'Open' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-rose-50 text-rose-500 dark:bg-rose-500/10 dark:text-rose-400'
                      }`}>
                        {cls.status === 'Open' ? 'Active' : 'Stopped'}
                      </span>
                      <span className="px-4 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest">
                        {cls.level}
                      </span>
                    </div>
                    <h3 className="text-xl md:text-2xl font-['Plus_Jakarta_Sans'] font-extrabold text-[#1a1c2e] dark:text-white group-hover:text-[#4f46e5] transition-colors">
                      {cls.title}
                    </h3>
                    <p className="text-slate-500 dark:text-slate-400 mt-2 line-clamp-1 max-w-xl font-medium">
                      {cls.description}
                    </p>
                    
                    <div className="flex flex-wrap justify-center md:justify-start gap-6 mt-6">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                          <span className="material-symbols-outlined text-lg">person</span>
                        </div>
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                          {cls.instructors?.[0]?.name} {cls.instructors && cls.instructors.length > 1 && `+${cls.instructors.length - 1}`}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                          <span className="material-symbols-outlined text-lg">event_available</span>
                        </div>
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                          {cls.schedule?.length} Sessions
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-[#4f46e5]/10 flex items-center justify-center text-[#4f46e5]">
                          <span className="material-symbols-outlined text-lg font-bold">payments</span>
                        </div>
                        <span className="text-base font-black text-[#4f46e5]">
                          {cls.currency} {cls.amount?.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Actions */}
                  <div className="flex flex-col gap-4 w-full md:w-auto min-w-[140px]">
                    <div className="flex items-center justify-between md:justify-end gap-3 px-4 py-2 bg-slate-50 dark:bg-[#0f172a] rounded-2xl border border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] font-black text-[#515981] dark:text-slate-400 uppercase tracking-widest">Status</span>
                      <button 
                        onClick={() => handleToggleStatus(cls)}
                        className={`w-12 h-6 rounded-full transition-all duration-300 relative p-1 ${
                          cls.status === 'Open' ? 'bg-[#4f46e5]' : 'bg-slate-300 dark:bg-slate-700'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-300 ${
                          cls.status === 'Open' ? 'translate-x-6' : 'translate-x-0'
                        }`}></div>
                      </button>
                    </div>
                    
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleEdit(cls)}
                        className="flex-1 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-[#1a1c2e] dark:text-white hover:bg-[#4f46e5] hover:text-white transition-all flex items-center justify-center shadow-sm"
                      >
                        <span className="material-symbols-outlined text-xl">edit</span>
                      </button>
                      <button 
                        onClick={() => handleDelete(cls.id)}
                        className="flex-1 h-12 rounded-2xl bg-rose-50 dark:bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center shadow-sm"
                      >
                        <span className="material-symbols-outlined text-xl">delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-24 flex flex-col items-center justify-center text-center bg-white dark:bg-[#1e293b] rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-slate-800 shadow-inner">
                <div className="w-24 h-24 bg-slate-50 dark:bg-[#0f172a] rounded-[2rem] flex items-center justify-center mb-6 shadow-xl shadow-slate-100 dark:shadow-none">
                  <span className="material-symbols-outlined text-5xl text-slate-300 dark:text-slate-700">inventory_2</span>
                </div>
                <h4 className="text-2xl font-['Plus_Jakarta_Sans'] font-extrabold text-[#1a1c2e] dark:text-white">Empty Curriculum</h4>
                <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-sm font-medium">Your class list is currently empty. Start by adding your very first curriculum to your community.</p>
                <button 
                  onClick={() => { resetForm(); setIsAdding(true); }}
                  className="mt-10 h-14 px-10 bg-[#4f46e5] text-white rounded-2xl font-bold shadow-xl shadow-[#4f46e5]/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
                >
                  <span className="material-symbols-outlined font-bold">add</span>
                  <span>ADD FIRST CLASS</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #334155;
        }
      `}</style>
    </div>
  );
}
