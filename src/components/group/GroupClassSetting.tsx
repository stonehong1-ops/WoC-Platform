"use client";

import React, { useState, useEffect } from "react";
import { Group, GroupClass, ClassScheduleEntry } from "@/types/group";
import { groupService } from "@/lib/firebase/groupService";
import { useAuth } from "@/components/providers/AuthProvider";

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
    <div className="max-w-4xl mx-auto px-4 py-6 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div>
            <h2 className="text-2xl font-headline font-black text-[#242c51]">Class Management</h2>
            <p className="text-sm text-slate-500 font-medium">Create and manage your group's schedule</p>
          </div>
        </div>
        {!isAdding && (
          <button 
            onClick={() => {
              resetForm();
              setIsAdding(true);
            }}
            className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-full font-bold shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-xl">add</span>
            <span>New Class</span>
          </button>
        )}
      </div>

      {isAdding ? (
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-xl border border-white/20">
          <h3 className="text-xl font-bold text-[#242c51] mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">edit_note</span>
            {editingClass ? "Edit Class" : "Create New Class"}
          </h3>
          
          <form onSubmit={handleSave} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-wider text-slate-400 ml-1">Class Title</label>
                <input 
                  required
                  type="text"
                  placeholder="e.g. Beginners Intensive"
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-100 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-wider text-slate-400 ml-1">Level</label>
                <select 
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-100 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  value={formData.level}
                  onChange={e => setFormData({...formData, level: e.target.value as any})}
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                  <option value="Masterclass">Masterclass</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-wider text-slate-400 ml-1">Description</label>
              <textarea 
                rows={3}
                placeholder="Tell students what to expect..."
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-100 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none"
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-wider text-slate-400 ml-1">Status</label>
                <select 
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-100 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  value={formData.status}
                  onChange={e => setFormData({...formData, status: e.target.value as any})}
                >
                  <option value="Open">Registration Open</option>
                  <option value="Closed">Registration Closed</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-wider text-slate-400 ml-1">Currency</label>
                <input 
                  type="text"
                  placeholder="KRW"
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-100 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-center font-bold"
                  value={formData.currency}
                  onChange={e => setFormData({...formData, currency: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-wider text-slate-400 ml-1">Price</label>
                <input 
                  type="number"
                  placeholder="0"
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-100 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-bold"
                  value={formData.amount}
                  onChange={e => setFormData({...formData, amount: Number(e.target.value)})}
                />
              </div>
            </div>

            {/* Instructor Section */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="text-xs font-black uppercase tracking-wider text-slate-400 ml-1">Instructors</label>
                <button 
                  type="button"
                  onClick={() => setFormData({...formData, instructors: [...(formData.instructors || []), { name: "", role: "" }]})}
                  className="text-[10px] font-black text-primary hover:underline"
                >
                  + ADD INSTRUCTOR
                </button>
              </div>
              <div className="space-y-3">
                {formData.instructors?.map((instructor, idx) => (
                  <div key={idx} className="flex gap-3 items-center">
                    <input 
                      placeholder="Instructor Name"
                      className="flex-1 px-4 py-2 rounded-lg bg-slate-50 border border-slate-100 text-sm"
                      value={instructor.name}
                      onChange={e => {
                        const newInstructors = [...(formData.instructors || [])];
                        newInstructors[idx].name = e.target.value;
                        setFormData({...formData, instructors: newInstructors});
                      }}
                    />
                    <input 
                      placeholder="Role (e.g. Main)"
                      className="w-32 px-4 py-2 rounded-lg bg-slate-50 border border-slate-100 text-sm"
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
                        className="p-2 text-red-400 hover:text-red-600 transition-colors"
                      >
                        <span className="material-symbols-outlined text-sm">remove_circle</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Schedule Section */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="text-xs font-black uppercase tracking-wider text-slate-400 ml-1">Schedule</label>
                <button 
                  type="button"
                  onClick={() => setFormData({...formData, schedule: [...(formData.schedule || []), { week: (formData.schedule?.length || 0) + 1, date: "", timeSlot: "", content: "" }]})}
                  className="text-[10px] font-black text-primary hover:underline"
                >
                  + ADD SLOT
                </button>
              </div>
              <div className="space-y-3">
                {formData.schedule?.map((slot, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-slate-400 uppercase">Week {slot.week}</span>
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
                          <span className="material-symbols-outlined text-sm">delete</span>
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <input 
                        type="date"
                        className="px-4 py-2 rounded-lg bg-white border border-slate-200 text-sm"
                        value={slot.date}
                        onChange={e => {
                          const newSchedule = [...(formData.schedule || [])];
                          newSchedule[idx].date = e.target.value;
                          setFormData({...formData, schedule: newSchedule});
                        }}
                      />
                      <input 
                        placeholder="Time (e.g. 19:00 - 20:30)"
                        className="px-4 py-2 rounded-lg bg-white border border-slate-200 text-sm"
                        value={slot.timeSlot}
                        onChange={e => {
                          const newSchedule = [...(formData.schedule || [])];
                          newSchedule[idx].timeSlot = e.target.value;
                          setFormData({...formData, schedule: newSchedule});
                        }}
                      />
                    </div>
                    <input 
                      placeholder="Session Content (e.g. Basic Steps)"
                      className="w-full px-4 py-2 rounded-lg bg-white border border-slate-200 text-sm"
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

            <div className="flex gap-4 pt-6">
              <button 
                type="button"
                onClick={() => {
                  setIsAdding(false);
                  setEditingClass(null);
                }}
                className="flex-1 py-4 rounded-2xl font-bold text-slate-500 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit"
                disabled={loading}
                className="flex-[2] py-4 rounded-2xl bg-primary text-white font-black shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                ) : (
                  <>
                    <span className="material-symbols-outlined">save</span>
                    SAVE CLASS
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {classes.length > 0 ? (
            classes.map((cls) => (
              <div 
                key={cls.id} 
                className="group relative bg-white/60 backdrop-blur-md rounded-2xl p-5 border border-white/40 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col md:flex-row gap-6 items-start md:items-center"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                      cls.status === 'Open' ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400'
                    }`}>
                      {cls.status}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-500 text-[10px] font-black uppercase tracking-wider">
                      {cls.level}
                    </span>
                  </div>
                  <h4 className="text-lg font-bold text-[#242c51] mb-1">{cls.title}</h4>
                  <p className="text-sm text-slate-500 line-clamp-1">{cls.description}</p>
                  
                  <div className="flex flex-wrap gap-4 mt-4">
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px] text-slate-400">group</span>
                      <span className="text-xs font-medium text-slate-600">
                        {cls.instructors?.map(i => i.name).join(' & ')}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px] text-slate-400">calendar_month</span>
                      <span className="text-xs font-medium text-slate-600">
                        {cls.schedule?.length} Sessions
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px] text-slate-400">payments</span>
                      <span className="text-xs font-bold text-primary">
                        {cls.currency} {cls.amount?.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 w-full md:w-auto pt-4 md:pt-0 border-t md:border-t-0 border-slate-100">
                  <button 
                    onClick={() => handleEdit(cls)}
                    className="flex-1 md:flex-none p-3 rounded-xl bg-slate-50 text-slate-600 hover:bg-primary/10 hover:text-primary transition-colors flex items-center justify-center gap-2 text-sm font-bold"
                  >
                    <span className="material-symbols-outlined text-[20px]">edit</span>
                    <span className="md:hidden">Edit</span>
                  </button>
                  <button 
                    onClick={() => handleDelete(cls.id)}
                    className="flex-1 md:flex-none p-3 rounded-xl bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors flex items-center justify-center gap-2 text-sm font-bold"
                  >
                    <span className="material-symbols-outlined text-[20px]">delete</span>
                    <span className="md:hidden">Delete</span>
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="py-20 flex flex-col items-center justify-center text-center bg-white/40 backdrop-blur-sm rounded-3xl border-2 border-dashed border-slate-200/50">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-4xl text-slate-300">school</span>
              </div>
              <h4 className="text-lg font-bold text-[#242c51]">No Classes Yet</h4>
              <p className="text-slate-500 text-sm mt-1 max-w-xs">Start building your community's educational curriculum by adding your first class.</p>
              <button 
                onClick={() => setIsAdding(true)}
                className="mt-6 px-8 py-3 bg-white text-[#242c51] rounded-xl font-bold shadow-sm border border-slate-200 hover:bg-slate-50 transition-all"
              >
                + Add First Class
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
