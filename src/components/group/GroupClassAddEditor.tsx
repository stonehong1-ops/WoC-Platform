"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";

import { Group, GroupClass, ClassScheduleEntry } from "@/types/group";
import { groupService } from "@/lib/firebase/groupService";
import { storageService } from "@/lib/firebase/storageService";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import { userService } from "@/lib/firebase/userService";
import { PlatformUser } from "@/types/user";
import { venueService } from "@/lib/firebase/venueService";
import { Venue } from "@/types/venue";
interface GroupClassAddEditorProps {
  group: Group;
  onClose: () => void;
  onSave?: () => void;
  initialData?: GroupClass;
  targetMonth?: string;
}

const GroupClassAddEditor: React.FC<GroupClassAddEditorProps> = ({ group, onClose, onSave, initialData, targetMonth }) => {
  const [isSaving, setIsSaving] = useState(false);
  
  const [imageUploading, setImageUploading] = useState(false);
  const [videoUploading, setVideoUploading] = useState(false);
  const [imageProgress, setImageProgress] = useState(0);
  const [videoProgress, setVideoProgress] = useState(0);
  const [weeksToAdd, setWeeksToAdd] = useState(1);
  
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  // Venue State
  const [allVenues, setAllVenues] = useState<Venue[]>([]);
  const [venueName, setVenueName] = useState(initialData?.location || "");
  const [venueResults, setVenueResults] = useState<Venue[]>([]);
  const [showVenueResults, setShowVenueResults] = useState(false);

  // DJ / Instructor State
  const [allUsers, setAllUsers] = useState<PlatformUser[]>([]);
  const [instructorSearchName, setInstructorSearchName] = useState("");
  const [instructorResults, setInstructorResults] = useState<PlatformUser[]>([]);
  const [showInstructorResults, setShowInstructorResults] = useState(false);

  useEffect(() => {
    venueService.getVenues().then(setAllVenues).catch(console.error);
    userService.getAllUsers().then(setAllUsers).catch(console.error);
  }, []);

  const handleVenueSearch = (val: string) => {
    setVenueName(val);
    if (val.length >= 1) {
      const lower = val.toLowerCase();
      const filtered = allVenues.filter(v =>
        v.name?.toLowerCase().includes(lower) ||
        v.nameKo?.includes(val)
      );
      setVenueResults(filtered.slice(0, 6));
      setShowVenueResults(filtered.length > 0);
    } else {
      setShowVenueResults(false);
      setVenueResults([]);
    }
  };

  const handleSelectVenue = (v: Venue) => {
    setVenueName(v.name);
    setShowVenueResults(false);
    setFormData(prev => ({ ...prev, location: v.name }));
  };

  const handleInstructorSearch = (val: string) => {
    setInstructorSearchName(val);
    if (val.length >= 1) {
      const lower = val.toLowerCase();
      const filtered = allUsers.filter(u =>
        u.nickname?.toLowerCase().includes(lower) ||
        u.nativeNickname?.includes(val) ||
        u.id.toLowerCase().includes(lower)
      );
      setInstructorResults(filtered.slice(0, 6));
      setShowInstructorResults(filtered.length > 0);
    } else {
      setShowInstructorResults(false);
      setInstructorResults([]);
    }
  };

  const handleSelectInstructor = (u: PlatformUser) => {
    setFormData(prev => ({
      ...prev,
      instructors: [
        ...prev.instructors,
        { name: u.nickname || u.id, role: prev.instructors.length === 0 ? 'Lead Instructor' : 'Instructor', userId: u.id, avatar: u.photoURL || '' }
      ]
    }));
    setInstructorSearchName("");
    setShowInstructorResults(false);
  };

  const [formData, setFormData] = useState<GroupClass>({
    id: uuidv4(),
    title: "",
    description: "",
    level: "Beginner",
    currency: "KRW",
    amount: 0,
    instructors: [],
    schedule: [
      { week: 1, date: new Date().toISOString().split('T')[0], timeSlot: "19:00 - 21:00", content: "" }
    ],
    status: "Open",
    targetMonth: targetMonth || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`,
    imageUrl: "",
    videoUrl: "",
    instructorProfile: "",
    classType: "Partner Class",
    leaderCount: 0,
    followerCount: 0,
    maxCapacity: 0,
    startTime: "10:00",
    endTime: "11:30",
    notice: "",
    location: "Studio A",
    locationMemo: ""
  } as GroupClass & { locationMemo?: string });

  const [capacityEnabled, setCapacityEnabled] = useState(false);

  const isEditMode = !!initialData;

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        imageUrl: initialData.imageUrl || (initialData as any).image || ""
      });
      setCapacityEnabled((initialData.leaderCount && initialData.leaderCount > 0) || (initialData.followerCount && initialData.followerCount > 0) ? true : false);
    }
  }, [initialData]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageUploading(true);
    setImageProgress(0);
    try {
      const path = `groups/${group.id}/classes/images/${uuidv4()}_${file.name}`;
      const url = await storageService.uploadFile(file, path, (progress) => {
        setImageProgress(Math.round(progress));
      });
      setFormData(prev => ({ ...prev, imageUrl: url }));
    } catch (error: any) {
      console.error("Image upload failed:", error);
      toast.error("Failed to upload the image.");
      alert(`Upload failed: ${error.message || 'Unknown error'}`);
    } finally {
      setImageUploading(false);
      if (imageInputRef.current) imageInputRef.current.value = "";
    }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setVideoUploading(true);
    setVideoProgress(0);
    try {
      const path = `groups/${group.id}/classes/videos/${uuidv4()}_${file.name}`;
      const url = await storageService.uploadFile(file, path, (progress) => {
        setVideoProgress(Math.round(progress));
      });
      setFormData(prev => ({ ...prev, videoUrl: url }));
    } catch (error: any) {
      console.error("Video upload failed:", error);
      toast.error("Failed to upload the video.");
      alert(`Upload failed: ${error.message || 'Unknown error'}`);
    } finally {
      setVideoUploading(false);
      if (videoInputRef.current) videoInputRef.current.value = "";
    }
  };

  const handleSave = async () => {
    if (!formData.title.trim()) {
      toast.error("Please enter a class title.");
      return;
    }
    if (formData.amount < 0) {
      toast.error("Please check the class fee.");
      return;
    }
    if (formData.instructors.some(inst => !inst.name.trim())) {
      toast.error("Please enter all instructor names.");
      return;
    }

    setIsSaving(true);
    try {
      const currentClasses = group.classes || [];
      let updatedClasses: GroupClass[];
      const finalData = { ...formData };
      if (!capacityEnabled) {
        finalData.leaderCount = 0;
        finalData.followerCount = 0;
      }
      
      if (isEditMode) {
        await groupService.updateClass(group.id, formData.id, finalData);
      } else {
        await groupService.addClass(group.id, finalData);
      }
      
      toast.success(isEditMode ? "Class updated successfully." : "Class added successfully.");
      if (onSave) onSave();
      onClose();
    } catch (error) {
      console.error("Failed to save class:", error);
      toast.error("Failed to save the class.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddWeeks = () => {
    setFormData(prev => {
      const updatedSchedule = [...prev.schedule];
      for (let i = 0; i < weeksToAdd; i++) {
        const nextWeekNum = updatedSchedule.length + 1;
        const lastDate = updatedSchedule.length > 0 
          ? new Date(updatedSchedule[updatedSchedule.length - 1].date)
          : new Date();
        
        const nextDate = new Date(lastDate);
        if (updatedSchedule.length > 0) {
          nextDate.setDate(lastDate.getDate() + 7);
        }

        updatedSchedule.push({
          week: nextWeekNum,
          date: nextDate.toISOString().split('T')[0],
          timeSlot: updatedSchedule.length > 0 ? updatedSchedule[0].timeSlot : "19:00 - 21:00",
          content: ""
        });
      }
      return { ...prev, schedule: updatedSchedule };
    });
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
    setFormData(prev => {
      const updated = [...prev.schedule];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, schedule: updated };
    });
  };

  const removeInstructor = (index: number) => {
    setFormData(prev => ({
      ...prev,
      instructors: prev.instructors.filter((_, i) => i !== index)
    }));
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[99999] text-on-surface bg-surface h-[100dvh] w-screen overflow-hidden flex flex-col font-['Inter'] animate-in fade-in slide-in-from-bottom-4 duration-500">
      <style dangerouslySetInnerHTML={{ __html: `
        .headline {
            font-family: 'Plus Jakarta Sans', sans-serif;
        }
        .active-scale:active { transform: scale(0.98); }
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
        .toggle-checkbox:checked {
            right: 0;
            border-color: #0057bd;
        }
        .toggle-checkbox:checked + .toggle-label {
            background-color: #0057bd;
        }
      `}} />
      <header className="sticky top-0 z-50 bg-[#F3F4F6] py-4 flex items-center border-b border-outline/20 px-4">
        <div className="max-w-md mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={onClose} className="material-symbols-outlined text-on-surface-variant p-2 hover:bg-surface-variant rounded-full transition-colors active-scale">close</button>
            <h1 className="text-xl font-extrabold tracking-tight text-on-surface headline">{isEditMode ? "Edit Class" : "Add Class"}</h1>
          </div>
          <button onClick={handleSave} disabled={isSaving} className="bg-primary text-white font-bold text-sm px-5 py-2 rounded-lg shadow-sm shadow-primary/20 hover:bg-primary/90 transition-all active-scale disabled:opacity-50">
            {isSaving ? "Saving..." : "Save"}
          </button>
        </div>
      </header>
      
      <main className="flex-1 overflow-y-auto no-scrollbar">
        <div className="max-w-md mx-auto px-6 py-8 space-y-6">
          {/* Title and Description Section */}
          <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline/20 shadow-sm space-y-5">
            <div>
              <label className="block text-[10px] font-bold text-on-surface-variant mb-2 uppercase tracking-widest opacity-70">Class Title</label>
              <input 
                value={formData.title}
                onChange={e => setFormData({...formData, title: e.target.value})}
                className="w-full bg-surface-variant/30 border border-outline/30 rounded-lg px-4 py-3 text-on-surface focus:ring-2 focus:ring-primary/20 focus:border-primary placeholder:text-on-surface-variant/40 outline-none transition-all" 
                placeholder="e.g. Advanced Contemporary Dance" 
                type="text"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-on-surface-variant mb-2 uppercase tracking-widest opacity-70">Description</label>
              <textarea 
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
                className="w-full bg-surface-variant/30 border border-outline/30 rounded-lg px-4 py-3 text-on-surface focus:ring-2 focus:ring-primary/20 focus:border-primary placeholder:text-on-surface-variant/40 outline-none resize-none text-sm transition-all" 
                placeholder="Provide class syllabus and student expectations..." 
                rows={4}
              ></textarea>
              <div className="mt-2 flex justify-end">
                <span className="text-[10px] text-on-surface-variant font-bold opacity-60">{formData.description?.length || 0} / 2000 characters</span>
              </div>
            </div>
          </div>
          
          {/* Classification Section */}
          <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline/20 shadow-sm space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-on-surface-variant mb-2 uppercase tracking-widest opacity-70">Level</label>
              <div className="relative">
                <select 
                  value={formData.level}
                  onChange={e => setFormData({...formData, level: e.target.value as any})}
                  className="w-full bg-surface-variant/30 border border-outline/30 rounded-lg px-4 py-3 text-on-surface focus:ring-2 focus:ring-primary/20 focus:border-primary appearance-none outline-none transition-all"
                >
                  <option value="Basic">Basic</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                  <option value="Very-Advanced">Very-Advanced</option>
                  <option value="Masterclass">Masterclass</option>
                </select>
                <span className="material-symbols-outlined absolute right-3 top-3 pointer-events-none text-on-surface-variant">expand_more</span>
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-on-surface-variant mb-2 uppercase tracking-widest opacity-70">Class Type (Partner)</label>
              <div className="relative">
                <select 
                  value={formData.classType}
                  onChange={e => setFormData({...formData, classType: e.target.value})}
                  className="w-full bg-surface-variant/30 border border-outline/30 rounded-lg px-4 py-3 text-on-surface focus:ring-2 focus:ring-primary/20 focus:border-primary appearance-none outline-none transition-all"
                >
                  <option value="Change Class">Change Class</option>
                  <option value="Partner Class">Partner Class</option>
                  <option value="Partner Class with Change">Partner Class with Change</option>
                  <option value="Training">Training</option>
                </select>
                <span className="material-symbols-outlined absolute right-3 top-3 pointer-events-none text-on-surface-variant">expand_more</span>
              </div>
            </div>
          </div>

          {/* Venue Section */}
          <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline/20 shadow-sm space-y-4">
            <h2 className="text-sm font-extrabold headline text-on-surface uppercase tracking-widest mb-4">Venue</h2>
            <div className="relative z-40">
              <label className="block text-[10px] font-bold text-on-surface-variant mb-2 uppercase tracking-widest opacity-70">Venue Selection</label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/40">location_on</span>
                <input
                  value={venueName}
                  onChange={(e) => handleVenueSearch(e.target.value)}
                  onFocus={() => venueName.length >= 1 && setShowVenueResults(venueResults.length > 0)}
                  onBlur={() => setTimeout(() => setShowVenueResults(false), 200)}
                  className="w-full pl-12 pr-4 py-3 bg-surface-variant/30 border border-outline/30 rounded-lg text-on-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm"
                  placeholder="Search venues... (영문 또는 한글)"
                  type="text"
                />
              </div>
              {showVenueResults && (
                <div className="absolute top-full left-0 w-full mt-1 bg-white border border-slate-100 rounded-xl shadow-lg z-50 max-h-60 overflow-y-auto animate-in fade-in duration-200">
                  {venueResults.map(v => (
                    <button
                      key={v.id}
                      onClick={() => handleSelectVenue(v)}
                      className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center justify-between group transition-colors border-b border-slate-50 last:border-b-0"
                    >
                      <div className="flex items-baseline gap-2">
                        <p className="font-bold text-[#2D3435] group-hover:text-primary transition-colors">{v.name}</p>
                        {v.nameKo && <span className="text-[11px] text-gray-400 font-medium">{v.nameKo}</span>}
                      </div>
                      <span className="text-[10px] text-gray-300 font-bold">{v.city}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label className="block text-[10px] font-bold text-on-surface-variant mb-2 uppercase tracking-widest opacity-70">Location Memo</label>
              <input 
                value={(formData as any).locationMemo || ''}
                onChange={e => setFormData({...formData, locationMemo: e.target.value} as any)}
                className="w-full bg-surface-variant/30 border border-outline/30 rounded-lg px-4 py-3 text-on-surface focus:ring-2 focus:ring-primary/20 focus:border-primary placeholder:text-on-surface-variant/40 outline-none transition-all text-sm" 
                placeholder="Enter address or specific location details" 
                type="text"
              />
            </div>
          </div>

          {/* Pricing Section */}
          <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline/20 shadow-sm">
            <h2 className="text-sm font-extrabold headline text-on-surface uppercase tracking-widest mb-4">Pricing</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-on-surface-variant mb-2 uppercase tracking-widest opacity-70">Currency</label>
                <div className="relative">
                  <select 
                    value={formData.currency}
                    onChange={e => setFormData({...formData, currency: e.target.value})}
                    className="w-full bg-surface-variant/30 border border-outline/30 rounded-lg px-4 py-3 text-on-surface focus:ring-2 focus:ring-primary/20 focus:border-primary appearance-none outline-none transition-all text-sm"
                  >
                    <option value="KRW">KRW - South Korean Won</option>
                    <option value="USD">USD - US Dollar</option>
                    <option value="EUR">EUR - Euro</option>
                    <option value="JPY">JPY - Japanese Yen</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-3 top-3 pointer-events-none text-on-surface-variant">expand_more</span>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-on-surface-variant mb-2 uppercase tracking-widest opacity-70">Amount</label>
                <div className="relative">
                  <span className="absolute left-4 top-3.5 text-on-surface-variant font-bold text-sm">
                    {formData.currency === 'KRW' ? '₩' : formData.currency === 'USD' ? '$' : formData.currency === 'EUR' ? '€' : formData.currency === 'JPY' ? '¥' : '₩'}
                  </span>
                  <input 
                    value={formData.amount ? formData.amount.toLocaleString() : ''}
                    onChange={e => {
                      const val = e.target.value.replace(/[^0-9]/g, '');
                      setFormData({...formData, amount: Number(val)});
                    }}
                    className="w-full bg-surface-variant/30 border border-outline/30 rounded-lg pl-8 pr-4 py-3 text-on-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm" 
                    placeholder="0" 
                    type="text"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Capacity Section */}
          <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline/20 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-sm font-extrabold headline text-on-surface uppercase tracking-widest">Capacity</h2>
              <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                <input 
                  checked={capacityEnabled}
                  onChange={e => setCapacityEnabled(e.target.checked)}
                  className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer border-outline/30 right-5 z-10 top-0 transition-transform duration-300 ease-in-out" 
                  id="toggle-capacity" 
                  name="toggle" 
                  type="checkbox"
                />
                <label className="toggle-label block overflow-hidden h-5 rounded-full bg-outline/30 cursor-pointer transition-colors duration-300 ease-in-out" htmlFor="toggle-capacity"></label>
              </div>
            </div>
            <div className={`grid grid-cols-2 gap-4 ${!capacityEnabled ? 'opacity-50 pointer-events-none' : ''}`}>
              <div>
                <label className="block text-[10px] font-bold text-on-surface-variant mb-2 uppercase tracking-widest opacity-70">Male</label>
                <div className="relative">
                  <input 
                    value={formData.leaderCount || ''}
                    onChange={e => setFormData({...formData, leaderCount: Number(e.target.value)})}
                    className="w-full bg-surface-variant/30 border border-outline/30 rounded-lg px-4 py-3 text-on-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm" 
                    disabled={!capacityEnabled} 
                    placeholder="0" 
                    type="number"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-on-surface-variant mb-2 uppercase tracking-widest opacity-70">Female</label>
                <div className="relative">
                  <input 
                    value={formData.followerCount || ''}
                    onChange={e => setFormData({...formData, followerCount: Number(e.target.value)})}
                    className="w-full bg-surface-variant/30 border border-outline/30 rounded-lg px-4 py-3 text-on-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm" 
                    disabled={!capacityEnabled} 
                    placeholder="0" 
                    type="number"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Instructors Section */}
          <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline/20 shadow-sm">
            <div className="mb-5">
              <h2 className="text-sm font-extrabold headline text-on-surface uppercase tracking-widest mb-4">Instructors</h2>
              <div className="relative z-30">
                <label className="block text-[10px] font-bold text-on-surface-variant mb-2 uppercase tracking-widest opacity-70">Add Instructor</label>
                <div className="relative group">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/40">person_add</span>
                  <input
                    value={instructorSearchName}
                    onChange={(e) => handleInstructorSearch(e.target.value)}
                    onFocus={() => instructorSearchName.length >= 1 && setShowInstructorResults(instructorResults.length > 0)}
                    onBlur={() => setTimeout(() => setShowInstructorResults(false), 200)}
                    className="w-full pl-12 pr-4 py-3 bg-surface-variant/30 border border-outline/30 rounded-lg text-on-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm"
                    placeholder="Search instructors..."
                    type="text"
                  />
                </div>
                {showInstructorResults && (
                  <div className="absolute top-full left-0 w-full mt-1 bg-white border border-slate-100 rounded-xl shadow-lg z-50 max-h-60 overflow-y-auto animate-in fade-in duration-200">
                    {instructorResults.map(u => (
                      <div
                        key={u.id}
                        onClick={() => handleSelectInstructor(u)}
                        className="flex items-center gap-3 p-3 hover:bg-slate-50 cursor-pointer transition-colors border-b border-slate-50 last:border-b-0"
                      >
                        <img src={u.photoURL || "https://www.woc.today/images/default-avatar.png"} alt="" className="w-8 h-8 rounded-full object-cover" />
                        <div>
                          <p className="font-bold text-sm text-[#242c51]">@{u.nickname || u.id}</p>
                          {u.nativeNickname && <p className="text-[10px] text-slate-500">{u.nativeNickname}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {formData.instructors.length > 0 && (
              <div className="space-y-3 relative">
                {formData.instructors.map((instructor, index) => (
                  <div key={index} className="flex items-center gap-4 p-4 bg-surface-variant/30 rounded-xl border border-outline/20 group relative">
                    <div className="w-10 h-10 shrink-0 rounded-full bg-surface-container-high flex items-center justify-center text-primary overflow-hidden border border-outline/10">
                      {instructor.avatar ? (
                        <img src={instructor.avatar} alt={instructor.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="material-symbols-outlined">person</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 relative">
                      <p className="text-sm font-bold text-on-surface">{instructor.name}</p>
                      <p className="text-[11px] font-bold text-on-surface-variant opacity-70 mt-0.5">{instructor.role}</p>
                    </div>
                    <button onClick={() => removeInstructor(index)} className="material-symbols-outlined text-on-surface-variant/40 hover:text-error transition-colors p-1">delete</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Schedule Section */}
          <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline/20 shadow-sm">
            <div className="mb-6">
              <h2 className="text-sm font-extrabold headline text-on-surface uppercase tracking-widest">Schedule</h2>
            </div>
            <div className="space-y-6">
              {formData.schedule.map((entry, index) => (
                <div key={index} className="p-5 bg-surface-variant/30 rounded-xl border border-outline/20 relative">
                  <div className="space-y-4">
                    <div className="flex justify-between items-end">
                      <div className="flex-1">
                        <label className="block text-[10px] font-bold text-on-surface-variant mb-1 uppercase opacity-70">Date (Week {entry.week})</label>
                        <input 
                          value={entry.date}
                          onChange={e => updateSchedule(index, 'date', e.target.value)}
                          className="w-full bg-surface-container-lowest border border-outline/30 rounded-lg px-4 py-2.5 text-sm text-on-surface focus:ring-2 focus:ring-primary/20 outline-none" 
                          type="date" 
                        />
                      </div>
                      {formData.schedule.length > 1 && (
                        <button onClick={() => removeWeek(index)} className="ml-3 mb-1 material-symbols-outlined text-on-surface-variant/40 hover:text-error transition-colors">delete</button>
                      )}
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-on-surface-variant mb-1 uppercase opacity-70">Time</label>
                      <div className="flex items-center gap-2">
                        <input 
                          value={entry.timeSlot ? entry.timeSlot.split(' - ')[0] : "19:00"}
                          onChange={e => {
                            const end = entry.timeSlot ? entry.timeSlot.split(' - ')[1] : "21:00";
                            updateSchedule(index, 'timeSlot', `${e.target.value} - ${end || '21:00'}`);
                          }}
                          className="flex-1 bg-surface-container-lowest border border-outline/30 rounded-lg px-4 py-2.5 text-sm text-on-surface focus:ring-2 focus:ring-primary/20 outline-none" 
                          type="time" 
                        />
                        <span className="text-on-surface-variant font-bold">-</span>
                        <input 
                          value={entry.timeSlot && entry.timeSlot.includes(' - ') ? entry.timeSlot.split(' - ')[1] : "21:00"}
                          onChange={e => {
                            const start = entry.timeSlot ? entry.timeSlot.split(' - ')[0] : "19:00";
                            updateSchedule(index, 'timeSlot', `${start || '19:00'} - ${e.target.value}`);
                          }}
                          className="flex-1 bg-surface-container-lowest border border-outline/30 rounded-lg px-4 py-2.5 text-sm text-on-surface focus:ring-2 focus:ring-primary/20 outline-none" 
                          type="time" 
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-on-surface-variant mb-1 uppercase opacity-70">Lesson Content</label>
                      <textarea 
                        value={entry.content}
                        onChange={e => updateSchedule(index, 'content', e.target.value)}
                        className="w-full bg-surface-container-lowest border border-outline/30 rounded-lg px-4 py-2.5 text-sm text-on-surface focus:ring-2 focus:ring-primary/20 outline-none resize-none" 
                        placeholder="e.g. Fundamental movements and warm-up routine..." 
                        rows={2}
                      ></textarea>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-6 flex items-center gap-4">
              <div className="relative w-24">
                <select 
                  value={weeksToAdd}
                  onChange={e => setWeeksToAdd(Number(e.target.value))}
                  className="w-full bg-surface-variant/30 border border-outline/30 rounded-lg pl-4 pr-8 py-2.5 text-sm text-on-surface focus:ring-2 focus:ring-primary/20 appearance-none outline-none transition-all font-bold"
                >
                  {[...Array(11)].map((_, i) => (
                    <option key={i+1} value={i+1}>{i+1}</option>
                  ))}
                </select>
                <span className="material-symbols-outlined absolute right-2 top-2.5 pointer-events-none text-on-surface-variant">expand_more</span>
              </div>
              <button onClick={handleAddWeeks} className="flex-1 sm:flex-none flex justify-center items-center gap-1.5 bg-primary text-white font-bold text-sm px-6 py-2.5 rounded-lg shadow-sm shadow-primary/20 hover:bg-primary/90 transition-all active-scale">
                <span className="material-symbols-outlined text-base">add</span>
                Add weeks
              </button>
            </div>
          </div>

          {/* Media Section */}
          <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline/20 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-sm font-extrabold headline text-on-surface uppercase tracking-widest">Media (Optional)</h2>
            </div>
            <div className="space-y-6">
              {/* Thumbnail Photo Section */}
              <div>
                <label className="block text-[10px] font-bold text-on-surface-variant mb-3 uppercase tracking-widest opacity-70">Thumbnail Photo (1)</label>
                <input type="file" ref={imageInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                <div 
                  onClick={() => !imageUploading && imageInputRef.current?.click()}
                  className="border-2 border-dashed border-outline/30 rounded-xl p-6 flex flex-col items-center justify-center text-center hover:bg-surface-variant/10 transition-colors cursor-pointer relative overflow-hidden h-40"
                >
                  {imageUploading ? (
                    <div className="flex flex-col items-center gap-2">
                      <span className="material-symbols-outlined animate-spin text-primary">progress_activity</span>
                      <span className="text-xs font-bold text-on-surface-variant">{imageProgress}%</span>
                    </div>
                  ) : formData.imageUrl ? (
                    <>
                      <img src={formData.imageUrl} alt="Thumbnail" className="w-full h-full object-cover absolute inset-0" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-white font-bold text-sm">Change Image</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-3xl text-on-surface-variant/50 mb-2">image</span>
                      <p className="text-sm font-bold text-on-surface mb-1">Upload Thumbnail</p>
                      <p className="text-[11px] text-on-surface-variant opacity-70">PNG, JPG up to 5MB</p>
                    </>
                  )}
                </div>
              </div>

              {/* Promo Video Section */}
              <div>
                <label className="block text-[10px] font-bold text-on-surface-variant mb-3 uppercase tracking-widest opacity-70">Promo Video (1)</label>
                <input type="file" ref={videoInputRef} className="hidden" accept="video/*" onChange={handleVideoUpload} />
                <div 
                  onClick={() => !videoUploading && videoInputRef.current?.click()}
                  className="border-2 border-dashed border-outline/30 rounded-xl p-6 flex flex-col items-center justify-center text-center hover:bg-surface-variant/10 transition-colors cursor-pointer relative overflow-hidden h-40"
                >
                  {videoUploading ? (
                    <div className="flex flex-col items-center gap-2">
                      <span className="material-symbols-outlined animate-spin text-primary">progress_activity</span>
                      <span className="text-xs font-bold text-on-surface-variant">{videoProgress}%</span>
                    </div>
                  ) : formData.videoUrl ? (
                    <>
                      <div className="absolute inset-0 bg-slate-900 flex items-center justify-center">
                        <span className="material-symbols-outlined text-white text-4xl">play_circle</span>
                      </div>
                      <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-white font-bold text-sm">Change Video</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-3xl text-on-surface-variant/50 mb-2">movie</span>
                      <p className="text-sm font-bold text-on-surface mb-1">Upload Video</p>
                      <p className="text-[11px] text-on-surface-variant opacity-70">MP4 up to 50MB</p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>,
    document.body
  );
};

export default GroupClassAddEditor;


