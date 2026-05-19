"use client";

import React, { useState, useEffect, useRef } from "react";

import { Group, GroupClass, ClassScheduleEntry } from "@/types/group";
import { groupService } from "@/lib/firebase/groupService";
import { storageService } from "@/lib/firebase/storageService";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import { userService } from "@/lib/firebase/userService";
import { PlatformUser } from "@/types/user";
import { venueService } from "@/lib/firebase/venueService";
import { Venue } from "@/types/venue";
import { useLanguage } from "@/contexts/LanguageContext";
import FullScreenRegistration from "@/components/common/FullScreenRegistration";

interface GroupClassAddEditorProps {
  group: Group | null;
  onClose: () => void;
  onSave?: () => void;
  initialData?: GroupClass;
  targetMonth?: string;
  isSpecial?: boolean;
}

const GroupClassAddEditor: React.FC<GroupClassAddEditorProps> = ({ group, onClose, onSave, initialData, targetMonth, isSpecial }) => {
  const { t } = useLanguage();
  const [isSaving, setIsSaving] = useState(false);
  
  const [imageUploading, setImageUploading] = useState(false);
  const [videoUploading, setVideoUploading] = useState(false);
  const [imageProgress, setImageProgress] = useState(0);
  const [videoProgress, setVideoProgress] = useState(0);
  const [weeksToAdd, setWeeksToAdd] = useState(1);
  
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const [isOptimizingImage, setIsOptimizingImage] = useState(false);
  const [isOptimizingVideo, setIsOptimizingVideo] = useState(false);

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
    classType: isSpecial ? "special" : "Partner Class",
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

    const originalUrl = formData.imageUrl;
    const blobUrl = URL.createObjectURL(file);
    
    // 즉시 프리뷰 적용 (낙관적 UI)
    setFormData(prev => ({ ...prev, imageUrl: blobUrl }));
    setImageUploading(true);
    setImageProgress(0);
    setIsOptimizingImage(true);

    try {
      const groupId = group?.id || 'special';
      const path = `groups/${groupId}/classes/images/${uuidv4()}_${file.name}`;
      const url = await storageService.uploadFile(file, path, (progress) => {
        setIsOptimizingImage(false);
        setImageProgress(Math.round(progress));
      });
      
      setFormData(prev => ({ ...prev, imageUrl: url }));
      // 성공 시 블롭 해제
      URL.revokeObjectURL(blobUrl);
    } catch (error: any) {
      console.error("Image upload failed:", error);
      toast.error(t('class.upload_image_failed') || "Failed to upload image.");
      // 실패 시 롤백
      setFormData(prev => ({ ...prev, imageUrl: originalUrl }));
      URL.revokeObjectURL(blobUrl);
    } finally {
      setImageUploading(false);
      setIsOptimizingImage(false);
      if (imageInputRef.current) imageInputRef.current.value = "";
    }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const originalUrl = formData.videoUrl;
    const blobUrl = URL.createObjectURL(file);

    // 즉시 프리뷰 적용 (낙관적 UI)
    setFormData(prev => ({ ...prev, videoUrl: blobUrl }));
    setVideoUploading(true);
    setVideoProgress(0);
    setIsOptimizingVideo(true);

    try {
      const groupId = group?.id || 'special';
      const path = `groups/${groupId}/classes/videos/${uuidv4()}_${file.name}`;
      const url = await storageService.uploadFile(file, path, (progress) => {
        setIsOptimizingVideo(false);
        setVideoProgress(Math.round(progress));
      });
      
      setFormData(prev => ({ ...prev, videoUrl: url }));
      URL.revokeObjectURL(blobUrl);
    } catch (error: any) {
      console.error("Video upload failed:", error);
      toast.error(t('class.upload_video_failed') || "Failed to upload video.");
      // 실패 시 롤백
      setFormData(prev => ({ ...prev, videoUrl: originalUrl }));
      URL.revokeObjectURL(blobUrl);
    } finally {
      setVideoUploading(false);
      setIsOptimizingVideo(false);
      if (videoInputRef.current) videoInputRef.current.value = "";
    }
  };

  const handleSave = async () => {
    if (!formData.title.trim()) {
      toast.error(t('class.enter_title'));
      return;
    }
    if (formData.amount < 0) {
      toast.error(t('class.check_cost'));
      return;
    }
    if (formData.instructors.some(inst => !inst.name.trim())) {
      toast.error(t('class.enter_instructors'));
      return;
    }

    setIsSaving(true);
    try {
      const currentClasses = group?.classes || [];
      let updatedClasses: GroupClass[];
      const finalData = { ...formData };
      if (!capacityEnabled) {
        finalData.leaderCount = 0;
        finalData.followerCount = 0;
      }
      
      const groupId = group?.id || 'special';
      if (isEditMode) {
        await groupService.updateClass(groupId, formData.id, finalData);
      } else {
        await groupService.addClass(groupId, finalData);
      }
      
      toast.success(isEditMode ? t('class.edited_success') : t('class.added_success'));
      if (onSave) onSave();
      onClose();
    } catch (error) {
      console.error("Failed to save class:", error);
      toast.error(t('class.save_failed'));
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

  return (
    <FullScreenRegistration
      id="class-add"
      title={isEditMode ? t('class.edit_class') : t('class.add_class')}
      submitLabel={t('common.save') || 'SAVE'}
      submittingLabel={t('common.saving') || 'Saving...'}
      onSubmit={handleSave}
      isSubmitting={isSaving}
      isValid={!!formData.title.trim()}
      onClose={onClose}
      isOpen={true}
    >
      <style dangerouslySetInnerHTML={{ __html: `
        .toggle-checkbox:checked { right: 0; border-color: #0057bd; }
        .toggle-checkbox:checked + .toggle-label { background-color: #0057bd; }
        input[type="number"]::-webkit-inner-spin-button,
        input[type="number"]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
      `}} />
      <div className="space-y-10 pt-4">
        {/* Special Class Disclaimer Banner */}
        {isSpecial && (
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4">
            <span className="material-symbols-outlined text-amber-500 text-[20px] mt-0.5 shrink-0">info</span>
            <p className="text-[13px] font-bold text-amber-700 leading-relaxed">
              Special classes can only be registered on a daily basis. For regular classes, please register through your group.
            </p>
          </div>
        )}

        {/* Title */}
        <div className="space-y-2">
          <label className="text-[13px] font-black text-gray-400 uppercase tracking-widest ml-1">
            {t('class.title_label')} <span className="text-primary">*</span>
          </label>
          <input
            value={formData.title}
            onChange={e => setFormData({...formData, title: e.target.value})}
            className="w-full text-[24px] font-black tracking-tighter border-none focus:ring-0 placeholder:text-gray-200 p-0 bg-transparent"
            placeholder={t('class.title_placeholder') || "e.g. Advanced Contemporary Dance"}
            type="text"
          />
        </div>

        {/* Description */}
        <div className="space-y-3">
          <label className="text-[13px] font-black text-gray-400 uppercase tracking-widest ml-1">{t('class.desc_label')}</label>
          <textarea
            value={formData.description}
            onChange={e => setFormData({...formData, description: e.target.value})}
            className="w-full min-h-[120px] bg-gray-50 border-none rounded-[28px] px-6 py-5 text-sm font-medium focus:ring-2 focus:ring-primary/10 resize-none leading-relaxed"
            placeholder={t('class.desc_placeholder') || "Provide class syllabus and student expectations..."}
            rows={4}
          ></textarea>
          <div className="flex justify-end mr-2">
            <span className="text-[11px] font-bold text-gray-300">{formData.description?.length || 0} / 2000</span>
          </div>
        </div>

        {/* Level */}
        <div className="space-y-3">
          <label className="text-[13px] font-black text-gray-400 uppercase tracking-widest ml-1">{t('class.level_label')}</label>
          <select
            value={formData.level}
            onChange={e => setFormData({...formData, level: e.target.value as any})}
            className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-sm font-black focus:ring-2 focus:ring-primary/10"
          >
            <option value="Basic">{t('class.level_basic') || "Basic"}</option>
            <option value="Intermediate">{t('class.level_intermediate') || "Intermediate"}</option>
            <option value="Advanced">{t('class.level_advanced') || "Advanced"}</option>
            <option value="Very-Advanced">{t('class.level_very_advanced') || "Very-Advanced"}</option>
            <option value="Masterclass">{t('class.level_masterclass') || "Masterclass"}</option>
          </select>
        </div>

        {/* Class Type - only for non-special */}
        {!isSpecial && (
          <div className="space-y-3">
            <label className="text-[13px] font-black text-gray-400 uppercase tracking-widest ml-1">{t('class.type_label')}</label>
            <select
              value={formData.classType}
              onChange={e => setFormData({...formData, classType: e.target.value})}
              className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-sm font-black focus:ring-2 focus:ring-primary/10"
            >
              <option value="Change Class">{t('class.type_change_class') || "Change Class"}</option>
              <option value="Partner Class">{t('class.type_partner_class') || "Partner Class"}</option>
              <option value="Partner Class with Change">{t('class.type_partner_class_with_change') || "Partner Class with Change"}</option>
              <option value="Training">{t('class.type_training') || "Training"}</option>
              <option value="special">{t('class.type_special_event') || "Special Event"}</option>
            </select>
          </div>
        )}

        {/* Venue */}
        <div className="space-y-3">
          <label className="text-[13px] font-black text-gray-400 uppercase tracking-widest ml-1">{t('class.venue_label') || "Venue"}</label>
          <div className="relative z-40">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-gray-300">location_on</span>
              <input
                value={venueName}
                onChange={(e) => handleVenueSearch(e.target.value)}
                onFocus={() => venueName.length >= 1 && setShowVenueResults(venueResults.length > 0)}
                onBlur={() => setTimeout(() => setShowVenueResults(false), 200)}
                className="w-full bg-gray-50 border-none rounded-2xl pl-14 pr-5 py-4 text-sm font-bold focus:ring-2 focus:ring-primary/10"
                placeholder={t('class.venue_placeholder') || "Search venues..."}
              />
            </div>
            {showVenueResults && (
              <div className="absolute top-full left-0 w-full mt-2 bg-white border border-slate-100 rounded-2xl shadow-lg z-50 max-h-60 overflow-y-auto animate-in fade-in duration-200">
                {venueResults.map(v => (
                  <button
                    key={v.id}
                    onClick={() => handleSelectVenue(v)}
                    className="w-full text-left px-5 py-3 hover:bg-slate-50 flex items-center gap-3 transition-colors border-b border-slate-50 last:border-b-0"
                  >
                    <span className="material-symbols-outlined text-[18px] text-slate-400 shrink-0">location_on</span>
                    <div className="flex flex-col">
                      <p className="font-bold text-sm text-gray-800 leading-tight">{v.name}</p>
                      {v.nameKo && <span className="text-[10px] text-slate-400 font-medium leading-tight">{v.nameKo}</span>}
                    </div>
                    <span className="text-[10px] text-gray-300 font-bold ml-auto shrink-0">{v.city}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <input
            value={(formData as any).locationMemo || ''}
            onChange={e => setFormData({...formData, locationMemo: e.target.value} as any)}
            className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-primary/10"
            placeholder={t('class.venue_memo_placeholder') || "Enter address or specific location details"}
            type="text"
          />
        </div>

        {/* Price & Currency */}
        <div className="space-y-4">
          <label className="text-[13px] font-black text-gray-400 uppercase tracking-widest ml-1">
            {t('class.price_label')} <span className="text-primary">*</span>
          </label>
          <div className="flex w-full items-center gap-3">
            <select
              value={formData.currency}
              onChange={e => setFormData({...formData, currency: e.target.value})}
              className="bg-gray-50 border-none rounded-2xl px-4 py-4 text-sm font-black focus:ring-2 focus:ring-primary/10 w-[100px] shrink-0"
            >
              <option value="KRW">{t('class.currency_krw') || "KRW"}</option>
              <option value="USD">{t('class.currency_usd') || "USD"}</option>
              <option value="EUR">{t('class.currency_eur') || "EUR"}</option>
              <option value="JPY">{t('class.currency_jpy') || "JPY"}</option>
            </select>
            <input
              value={formData.amount ? formData.amount.toLocaleString() : ''}
              onChange={e => {
                const val = e.target.value.replace(/[^0-9]/g, '');
                setFormData({...formData, amount: Number(val)});
              }}
              className="flex-1 min-w-0 bg-gray-50 border-none rounded-2xl px-5 py-4 text-lg font-black focus:ring-2 focus:ring-primary/10 text-right"
              placeholder="0"
              type="text"
            />
          </div>
        </div>

        {/* Capacity */}
        <div className="space-y-4">
          <div className="flex items-center justify-between ml-1">
            <label className="text-[13px] font-black text-gray-400 uppercase tracking-widest">{t('class.capacity_label')}</label>
            <div className="relative inline-block w-10 align-middle select-none">
              <input
                checked={capacityEnabled}
                onChange={e => setCapacityEnabled(e.target.checked)}
                className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer border-gray-300 right-5 z-10 top-0 transition-transform duration-300 ease-in-out"
                id="toggle-capacity"
                name="toggle"
                type="checkbox"
              />
              <label className="toggle-label block overflow-hidden h-5 rounded-full bg-gray-300 cursor-pointer transition-colors duration-300 ease-in-out" htmlFor="toggle-capacity"></label>
            </div>
          </div>
          <div className={`flex gap-3 ${!capacityEnabled ? 'opacity-40 pointer-events-none' : ''}`}>
            <div className="flex-1 space-y-2">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">{t('class.capacity_male') || "Male"}</label>
              <input
                value={formData.leaderCount || ''}
                onChange={e => setFormData({...formData, leaderCount: Number(e.target.value)})}
                className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-sm font-black focus:ring-2 focus:ring-primary/10"
                disabled={!capacityEnabled}
                placeholder="0"
                type="number"
              />
            </div>
            <div className="flex-1 space-y-2">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">{t('class.capacity_female') || "Female"}</label>
              <input
                value={formData.followerCount || ''}
                onChange={e => setFormData({...formData, followerCount: Number(e.target.value)})}
                className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-sm font-black focus:ring-2 focus:ring-primary/10"
                disabled={!capacityEnabled}
                placeholder="0"
                type="number"
              />
            </div>
          </div>
        </div>

        {/* Instructors */}
        <div className="space-y-3">
          <label className="text-[13px] font-black text-gray-400 uppercase tracking-widest ml-1">{t('class.instructors_label')}</label>
          <div className="relative z-30">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-gray-300">person_add</span>
              <input
                value={instructorSearchName}
                onChange={(e) => handleInstructorSearch(e.target.value)}
                onFocus={() => instructorSearchName.length >= 1 && setShowInstructorResults(instructorResults.length > 0)}
                onBlur={() => setTimeout(() => setShowInstructorResults(false), 200)}
                className="w-full bg-gray-50 border-none rounded-2xl pl-14 pr-5 py-4 text-sm font-bold focus:ring-2 focus:ring-primary/10"
                placeholder={t('class.instructor_search_placeholder') || "Search instructors..."}
                type="text"
              />
            </div>
            {showInstructorResults && (
              <div className="absolute top-full left-0 w-full mt-2 bg-white border border-slate-100 rounded-2xl shadow-lg z-50 max-h-60 overflow-y-auto animate-in fade-in duration-200">
                {instructorResults.map(u => (
                  <div
                    key={u.id}
                    onClick={() => handleSelectInstructor(u)}
                    className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 cursor-pointer transition-colors border-b border-slate-50 last:border-b-0"
                  >
                    <img src={u.photoURL || "https://www.woc.today/images/default-avatar.png"} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
                    <div className="flex flex-col">
                      <p className="font-bold text-sm text-gray-800 leading-tight">{u.nickname || u.id}</p>
                      {u.nativeNickname && <span className="text-[10px] text-slate-400 font-medium leading-tight">{u.nativeNickname}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          {formData.instructors.length > 0 && (
            <div className="space-y-2 mt-3">
              {formData.instructors.map((instructor, index) => (
                <div key={index} className="flex items-center gap-3 px-5 py-3 bg-gray-50 rounded-2xl">
                  <div className="w-10 h-10 shrink-0 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                    {instructor.avatar ? (
                      <img src={instructor.avatar} alt={instructor.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="material-symbols-outlined text-gray-400">person</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-800">{instructor.name}</p>
                    <p className="text-[11px] font-bold text-gray-400">{instructor.role}</p>
                  </div>
                  <button onClick={() => removeInstructor(index)} className="material-symbols-outlined text-gray-300 hover:text-red-400 transition-colors p-1">delete</button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Schedule */}
        <div className="space-y-4">
          <label className="text-[13px] font-black text-gray-400 uppercase tracking-widest ml-1">{t('class.schedule_label')}</label>
          <div className="space-y-4">
            {formData.schedule.map((entry, index) => (
              <div key={index} className="bg-gray-50 rounded-2xl p-5 space-y-4">
                <div className="flex justify-between items-end">
                  <div className="flex-1">
                    <label className="block text-[11px] font-bold text-gray-400 mb-2 uppercase tracking-widest">{t('class.date_week_label')?.replace('{week}', String(entry.week)) || `Date (Week ${entry.week})`}</label>
                    <input
                      value={entry.date}
                      onChange={e => updateSchedule(index, 'date', e.target.value)}
                      className="w-full bg-white border-none rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-primary/10"
                      type="date"
                    />
                  </div>
                  {!isSpecial && formData.schedule.length > 1 && (
                    <button onClick={() => removeWeek(index)} className="ml-3 mb-1 material-symbols-outlined text-gray-300 hover:text-red-400 transition-colors">delete</button>
                  )}
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-400 mb-2 uppercase tracking-widest">{t('class.time_label') || "Time"}</label>
                  <div className="flex items-center gap-2">
                    <input
                      value={entry.timeSlot ? entry.timeSlot.split(' - ')[0] : "19:00"}
                      onChange={e => {
                        const end = entry.timeSlot ? entry.timeSlot.split(' - ')[1] : "21:00";
                        updateSchedule(index, 'timeSlot', `${e.target.value} - ${end || '21:00'}`);
                      }}
                      className="flex-1 bg-white border-none rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-primary/10"
                      type="time"
                    />
                    <span className="text-gray-300 font-bold">-</span>
                    <input
                      value={entry.timeSlot && entry.timeSlot.includes(' - ') ? entry.timeSlot.split(' - ')[1] : "21:00"}
                      onChange={e => {
                        const start = entry.timeSlot ? entry.timeSlot.split(' - ')[0] : "19:00";
                        updateSchedule(index, 'timeSlot', `${start || '19:00'} - ${e.target.value}`);
                      }}
                      className="flex-1 bg-white border-none rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-primary/10"
                      type="time"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-400 mb-2 uppercase tracking-widest">{t('class.lesson_content_label') || "Lesson Content"}</label>
                  <textarea
                    value={entry.content}
                    onChange={e => updateSchedule(index, 'content', e.target.value)}
                    className="w-full bg-white border-none rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-primary/10 resize-none"
                    placeholder={t('class.lesson_content_placeholder') || "e.g. Fundamental movements and warm-up routine..."}
                    rows={2}
                  ></textarea>
                </div>
              </div>
            ))}
          </div>
          {!isSpecial && (
            <div className="flex items-center gap-3">
              <select
                value={weeksToAdd}
                onChange={e => setWeeksToAdd(Number(e.target.value))}
                className="bg-gray-50 border-none rounded-2xl px-4 py-3 text-sm font-black focus:ring-2 focus:ring-primary/10 w-[80px] shrink-0"
              >
                {[...Array(11)].map((_, i) => (
                  <option key={i+1} value={i+1}>{i+1}</option>
                ))}
              </select>
              <button onClick={handleAddWeeks} className="flex-1 flex justify-center items-center gap-1.5 bg-gray-900 text-white font-bold text-sm px-6 py-3 rounded-2xl hover:bg-gray-800 transition-all active:scale-[0.98]">
                <span className="material-symbols-outlined text-base">add</span>
                {t('class.add_weeks') || "Add weeks"}
              </button>
            </div>
          )}
        </div>

        {/* Media */}
        <div className="space-y-6 pb-8">
          <label className="text-[13px] font-black text-gray-400 uppercase tracking-widest ml-1">{t('class.media_label')}</label>
          {/* Thumbnail Photo */}
          <div className="space-y-3">
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">{t('class.main_photo')}</label>
            <input type="file" ref={imageInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
            <div
              onClick={() => !imageUploading && imageInputRef.current?.click()}
              className="border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center text-center hover:border-primary/40 hover:bg-primary/5 transition-all cursor-pointer relative overflow-hidden h-40"
            >
              {imageUploading ? (
                <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex flex-col items-center justify-center p-4">
                  {isOptimizingImage ? (
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span className="text-xs font-bold text-white tracking-tight">{t('class.optimizing')}</span>
                    </div>
                  ) : (
                    <div className="relative w-16 h-16">
                      <svg className="w-full h-full -rotate-90">
                        <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-white/20" />
                        <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="transparent" strokeDasharray={175.9} strokeDashoffset={175.9 - (175.9 * imageProgress) / 100} className="text-white transition-all duration-300 ease-out" />
                      </svg>
                      <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">{imageProgress}%</span>
                    </div>
                  )}
                </div>
              ) : formData.imageUrl ? (
                <>
                  <img src={formData.imageUrl} alt="Thumbnail" className="w-full h-full object-cover absolute inset-0" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-white font-bold text-sm">{t('class.change_photo')}</span>
                  </div>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-3xl text-gray-300 mb-2">image</span>
                  <p className="text-sm font-bold text-gray-800 mb-1">{t('class.upload_photo')}</p>
                  <p className="text-[11px] text-gray-400">{t('class.photo_desc')}</p>
                </>
              )}
            </div>
          </div>
          {/* Promo Video */}
          <div className="space-y-3">
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">{t('class.promo_video')}</label>
            <input type="file" ref={videoInputRef} className="hidden" accept="video/*" onChange={handleVideoUpload} />
            <div
              onClick={() => !videoUploading && videoInputRef.current?.click()}
              className="border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center text-center hover:border-primary/40 hover:bg-primary/5 transition-all cursor-pointer relative overflow-hidden h-40"
            >
              {videoUploading ? (
                <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex flex-col items-center justify-center p-4">
                  {isOptimizingVideo ? (
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span className="text-xs font-bold text-white tracking-tight">{t('class.optimizing')}</span>
                    </div>
                  ) : (
                    <div className="relative w-16 h-16">
                      <svg className="w-full h-full -rotate-90">
                        <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-white/20" />
                        <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="transparent" strokeDasharray={175.9} strokeDashoffset={175.9 - (175.9 * videoProgress) / 100} className="text-white transition-all duration-300 ease-out" />
                      </svg>
                      <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">{videoProgress}%</span>
                    </div>
                  )}
                </div>
              ) : formData.videoUrl ? (
                <>
                  <div className="absolute inset-0 bg-slate-900 flex items-center justify-center">
                    <span className="material-symbols-outlined text-white text-4xl">play_circle</span>
                  </div>
                  <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-white font-bold text-sm">{t('class.change_video')}</span>
                  </div>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-3xl text-gray-300 mb-2">movie</span>
                  <p className="text-sm font-bold text-gray-800 mb-1">{t('class.upload_video')}</p>
                  <p className="text-[11px] text-gray-400">{t('class.video_desc')}</p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </FullScreenRegistration>
  );


};

export default GroupClassAddEditor;
