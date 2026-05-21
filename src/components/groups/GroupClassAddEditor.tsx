"use client";
// 클래스 정보를 신규 등록하고 수정하기 위한 코어 에디터 컴포넌트

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
import { ClassInstructorForm } from "./ClassInstructorForm";
import { ClassScheduleForm } from "./ClassScheduleForm";

interface GroupClassAddEditorProps {
  group: Group | null;
  onClose: () => void;
  onSave?: () => void;
  initialData?: GroupClass;
  targetMonth?: string;
  isSpecial?: boolean;
}

const GroupClassAddEditor: React.FC<GroupClassAddEditorProps> = ({
  group,
  onClose,
  onSave,
  initialData,
  targetMonth,
  isSpecial,
}) => {
  const { t } = useLanguage();
  const [isSaving, setIsSaving] = useState(false);

  const [imageUploading, setImageUploading] = useState(false);
  const [videoUploading, setVideoUploading] = useState(false);
  const [imageProgress, setImageProgress] = useState(0);
  const [videoProgress, setVideoProgress] = useState(0);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const [isOptimizingImage, setIsOptimizingImage] = useState(false);
  const [isOptimizingVideo, setIsOptimizingVideo] = useState(false);

  // Venue State
  const [allVenues, setAllVenues] = useState<Venue[]>([]);
  const [venueName, setVenueName] = useState(initialData?.location || "");
  const [venueResults, setVenueResults] = useState<Venue[]>([]);
  const [showVenueResults, setShowVenueResults] = useState(false);

  // Users for search
  const [allUsers, setAllUsers] = useState<PlatformUser[]>([]);

  const [formData, setFormData] = useState<GroupClass>({
    id: uuidv4(),
    title: "",
    description: "",
    level: "Beginner",
    currency: "KRW",
    amount: 0,
    instructors: [],
    schedule: [
      { week: 1, date: new Date().toISOString().split("T")[0], timeSlot: "19:00 - 21:00", content: "" },
    ],
    status: "Open",
    targetMonth: targetMonth || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`,
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
    locationMemo: "",
  } as GroupClass & { locationMemo?: string });

  const [capacityEnabled, setCapacityEnabled] = useState(false);
  const isEditMode = !!initialData;

  useEffect(() => {
    venueService.getVenues().then(setAllVenues).catch(console.error);
    userService.getAllUsers().then(setAllUsers).catch(console.error);
  }, []);

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        imageUrl: initialData.imageUrl || (initialData as any).image || "",
      });
      setCapacityEnabled(
        (initialData.leaderCount && initialData.leaderCount > 0) ||
          (initialData.followerCount && initialData.followerCount > 0)
          ? true
          : false
      );
    }
  }, [initialData]);

  const handleVenueSearch = (val: string) => {
    setVenueName(val);
    if (val.length >= 1) {
      const lower = val.toLowerCase();
      const filtered = allVenues.filter(
        v => v.name?.toLowerCase().includes(lower) || v.nameKo?.includes(val)
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

  const handleAddInstructor = (u: PlatformUser) => {
    setFormData(prev => ({
      ...prev,
      instructors: [
        ...prev.instructors,
        {
          name: u.nickname || u.id,
          role: prev.instructors.length === 0 ? "Lead Instructor" : "Instructor",
          userId: u.id,
          avatar: u.photoURL || "",
        },
      ],
    }));
  };

  const handleRemoveInstructor = (index: number) => {
    setFormData(prev => ({
      ...prev,
      instructors: prev.instructors.filter((_, i) => i !== index),
    }));
  };

  const handleAddWeeks = (weeks: number) => {
    setFormData(prev => {
      const updatedSchedule = [...prev.schedule];
      for (let i = 0; i < weeks; i++) {
        const nextWeekNum = updatedSchedule.length + 1;
        const lastDate =
          updatedSchedule.length > 0 ? new Date(updatedSchedule[updatedSchedule.length - 1].date) : new Date();

        const nextDate = new Date(lastDate);
        if (updatedSchedule.length > 0) {
          nextDate.setDate(lastDate.getDate() + 7);
        }

        updatedSchedule.push({
          week: nextWeekNum,
          date: nextDate.toISOString().split("T")[0],
          timeSlot: updatedSchedule.length > 0 ? updatedSchedule[0].timeSlot : "19:00 - 21:00",
          content: "",
        });
      }
      return { ...prev, schedule: updatedSchedule };
    });
  };

  const handleRemoveWeek = (index: number) => {
    if (formData.schedule.length <= 1) return;
    const updated = formData.schedule
      .filter((_, i) => i !== index)
      .map((entry, i) => ({
        ...entry,
        week: i + 1,
      }));
    setFormData({ ...formData, schedule: updated });
  };

  const handleUpdateSchedule = (index: number, field: keyof ClassScheduleEntry, value: any) => {
    setFormData(prev => {
      const updated = [...prev.schedule];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, schedule: updated };
    });
  };

  const handleGenerateFourWeeks = () => {
    if (formData.schedule.length === 1 && formData.schedule[0].date) {
      const base = formData.schedule[0];
      const baseDate = new Date(base.date);
      const generated = Array.from({ length: 3 }).map((_, i) => {
        const nextDate = new Date(baseDate);
        nextDate.setDate(baseDate.getDate() + (i + 1) * 7);
        return { ...base, week: i + 2, date: nextDate.toISOString().split("T")[0] };
      });
      setFormData(prev => ({ ...prev, schedule: [{ ...prev.schedule[0], week: 1 }, ...generated] }));
    } else {
      toast.error("Please set the first date before generating.");
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const originalUrl = formData.imageUrl;
    const blobUrl = URL.createObjectURL(file);

    setFormData(prev => ({ ...prev, imageUrl: blobUrl }));
    setImageUploading(true);
    setImageProgress(0);
    setIsOptimizingImage(true);

    try {
      const groupId = group?.id || "special";
      const path = `groups/${groupId}/classes/images/${uuidv4()}_${file.name}`;
      const url = await storageService.uploadFile(file, path, progress => {
        setIsOptimizingImage(false);
        setImageProgress(Math.round(progress));
      });

      setFormData(prev => ({ ...prev, imageUrl: url }));
      URL.revokeObjectURL(blobUrl);
    } catch (error: any) {
      console.error("Image upload failed:", error);
      toast.error(t("class.upload_image_failed") || "Failed to upload image.");
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

    setFormData(prev => ({ ...prev, videoUrl: blobUrl }));
    setVideoUploading(true);
    setVideoProgress(0);
    setIsOptimizingVideo(true);

    try {
      const groupId = group?.id || "special";
      const path = `groups/${groupId}/classes/videos/${uuidv4()}_${file.name}`;
      const url = await storageService.uploadFile(file, path, progress => {
        setIsOptimizingVideo(false);
        setVideoProgress(Math.round(progress));
      });

      setFormData(prev => ({ ...prev, videoUrl: url }));
      URL.revokeObjectURL(blobUrl);
    } catch (error: any) {
      console.error("Video upload failed:", error);
      toast.error(t("class.upload_video_failed") || "Failed to upload video.");
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
      toast.error(t("class.enter_title"));
      return;
    }
    if (formData.amount < 0) {
      toast.error(t("class.check_cost"));
      return;
    }
    if (formData.instructors.some(inst => !inst.name.trim())) {
      toast.error(t("class.enter_instructors"));
      return;
    }

    setIsSaving(true);
    try {
      if (!formData.schedule || formData.schedule.length === 0) {
        toast.error(t("class.schedule_empty") || "Schedule is empty. Please add a schedule.");
        setIsSaving(false);
        return;
      }

      let finalSchedule = formData.schedule;
      if (!isSpecial && !isEditMode && formData.schedule.length === 1) {
        const baseSchedule = formData.schedule[0];
        const baseDate = new Date(baseSchedule.date);
        finalSchedule = Array.from({ length: 4 }).map((_, i) => {
          const nextDate = new Date(baseDate);
          nextDate.setDate(baseDate.getDate() + i * 7);
          return {
            ...baseSchedule,
            week: i + 1,
            date: nextDate.toISOString().split("T")[0],
          };
        });
      }

      const finalData = { ...formData, schedule: finalSchedule };
      if (!capacityEnabled) {
        finalData.leaderCount = 0;
        finalData.followerCount = 0;
      }

      const cleanUndefined = (obj: any): any => {
        if (Array.isArray(obj)) return obj.map(cleanUndefined);
        if (obj !== null && typeof obj === "object") {
          return Object.fromEntries(
            Object.entries(obj)
              .filter(([_, v]) => v !== undefined)
              .map(([k, v]) => [k, cleanUndefined(v)])
          );
        }
        return obj;
      };

      const sanitizedData = cleanUndefined(finalData);

      const groupId = group?.id || "special";
      if (isEditMode) {
        await groupService.updateClass(groupId, formData.id, sanitizedData);
      } else {
        await groupService.addClass(groupId, sanitizedData);
      }

      toast.success(isEditMode ? t("class.edited_success") : t("class.added_success"));
      if (onSave) onSave();
      onClose();
    } catch (error: any) {
      console.error("Failed to save class:", error);
      toast.error(t("class.save_failed") + (error?.message ? ` (${error.message})` : ""));
    } finally {
      setIsSaving(false);
    }
  };

  if (typeof document === "undefined") return null;

  return (
    <FullScreenRegistration
      id="class-add"
      title={isEditMode ? t("class.edit_class") : t("class.add_class")}
      submitLabel={t("common.save") || "SAVE"}
      submittingLabel={t("common.saving") || "Saving..."}
      onSubmit={handleSave}
      isSubmitting={isSaving}
      isValid={!!formData.title.trim()}
      onClose={onClose}
      isOpen={true}
    >
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .toggle-checkbox:checked { right: 0; border-color: #0057bd; }
        .toggle-checkbox:checked + .toggle-label { background-color: #0057bd; }
        input[type="number"]::-webkit-inner-spin-button,
        input[type="number"]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
      `,
        }}
      />
      <div className="space-y-10 pt-4">
        {/* Special Class Disclaimer Banner */}
        {isSpecial && (
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4">
            <span className="material-symbols-outlined text-amber-500 text-[20px] mt-0.5 shrink-0">info</span>
            <p className="text-[13px] font-semibold text-amber-700 leading-relaxed">
              {t("class.special_daily_notice")}
            </p>
          </div>
        )}

        {/* Title */}
        <div className="space-y-2">
          <label className="text-[13px] font-black text-gray-400 uppercase tracking-widest ml-1">
            {t("class.title_label")} <span className="text-primary">*</span>
          </label>
          <input
            value={formData.title}
            onChange={e => setFormData({ ...formData, title: e.target.value })}
            className="w-full text-[24px] font-black tracking-tighter border-none focus:ring-0 placeholder:text-gray-200 p-0 bg-transparent"
            placeholder={t("class.title_placeholder") || "e.g. Advanced Contemporary Dance"}
            type="text"
          />
        </div>

        {/* Description */}
        <div className="space-y-3">
          <label className="text-[13px] font-black text-gray-400 uppercase tracking-widest ml-1">
            {t("class.desc_label")}
          </label>
          <textarea
            value={formData.description}
            onChange={e => setFormData({ ...formData, description: e.target.value })}
            className="w-full min-h-[120px] bg-gray-50 border-none rounded-[28px] px-6 py-5 text-sm font-medium focus:ring-2 focus:ring-primary/10 resize-none leading-relaxed"
            placeholder={t("class.desc_placeholder") || "Provide class syllabus and student expectations..."}
            rows={4}
          />
          <div className="flex justify-end mr-2">
            <span className="text-[11px] font-bold text-gray-300">{formData.description?.length || 0} / 2000</span>
          </div>
        </div>

        {/* Level */}
        <div className="space-y-3">
          <label className="text-[13px] font-black text-gray-400 uppercase tracking-widest ml-1">
            {t("class.level_label")}
          </label>
          <select
            value={formData.level}
            onChange={e => setFormData({ ...formData, level: e.target.value as any })}
            className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-sm font-black focus:ring-2 focus:ring-primary/10"
          >
            <option value="Basic">{t("class.level_basic") || "Basic"}</option>
            <option value="Intermediate">{t("class.level_intermediate") || "Intermediate"}</option>
            <option value="Advanced">{t("class.level_advanced") || "Advanced"}</option>
            <option value="Very-Advanced">{t("class.level_very_advanced") || "Very-Advanced"}</option>
            <option value="Masterclass">{t("class.level_masterclass") || "Masterclass"}</option>
          </select>
        </div>

        {/* Class Type - only for non-special */}
        {!isSpecial && (
          <div className="space-y-3">
            <label className="text-[13px] font-black text-gray-400 uppercase tracking-widest ml-1">
              {t("class.type_label")}
            </label>
            <select
              value={formData.classType}
              onChange={e => setFormData({ ...formData, classType: e.target.value })}
              className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-sm font-black focus:ring-2 focus:ring-primary/10"
            >
              <option value="Change Class">{t("class.type_change_class") || "Change Class"}</option>
              <option value="Partner Class">{t("class.type_partner_class") || "Partner Class"}</option>
              <option value="Partner Class with Change">{t("class.type_partner_class_with_change") || "Partner Class with Change"}</option>
              <option value="Training">{t("class.type_training") || "Training"}</option>
              <option value="special">{t("class.type_special_event") || "Special Event"}</option>
            </select>
          </div>
        )}

        {/* Venue */}
        <div className="space-y-3">
          <label className="text-[13px] font-black text-gray-400 uppercase tracking-widest ml-1">
            {t("class.venue_label") || "Venue"}
          </label>
          <div className="relative z-40">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-gray-300">
                location_on
              </span>
              <input
                value={venueName}
                onChange={e => handleVenueSearch(e.target.value)}
                onFocus={() => venueName.length >= 1 && setShowVenueResults(venueResults.length > 0)}
                onBlur={() => setTimeout(() => setShowVenueResults(false), 200)}
                className="w-full bg-gray-50 border-none rounded-2xl pl-14 pr-5 py-4 text-sm font-bold focus:ring-2 focus:ring-primary/10"
                placeholder={t("class.venue_placeholder") || "Search venues..."}
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
            value={(formData as any).locationMemo || ""}
            onChange={e => setFormData({ ...formData, locationMemo: e.target.value } as any)}
            className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-primary/10"
            placeholder={t("class.venue_memo_placeholder") || "Enter address or specific location details"}
            type="text"
          />
        </div>

        {/* Price & Currency */}
        <div className="space-y-4">
          <label className="text-[13px] font-black text-gray-400 uppercase tracking-widest ml-1">
            {t("class.price_label")} <span className="text-primary">*</span>
          </label>
          <div className="flex w-full items-center gap-3">
            <select
              value={formData.currency}
              onChange={e => setFormData({ ...formData, currency: e.target.value })}
              className="bg-gray-50 border-none rounded-2xl px-4 py-4 text-sm font-black focus:ring-2 focus:ring-primary/10 w-[100px] shrink-0"
            >
              <option value="KRW">{t("class.currency_krw") || "KRW"}</option>
              <option value="USD">{t("class.currency_usd") || "USD"}</option>
              <option value="EUR">{t("class.currency_eur") || "EUR"}</option>
              <option value="JPY">{t("class.currency_jpy") || "JPY"}</option>
            </select>
            <input
              value={formData.amount ? formData.amount.toLocaleString() : ""}
              onChange={e => {
                const val = e.target.value.replace(/[^0-9]/g, "");
                setFormData({ ...formData, amount: Number(val) });
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
            <label className="text-[13px] font-black text-gray-400 uppercase tracking-widest">
              {t("class.capacity_label")}
            </label>
            <div className="relative inline-block w-10 align-middle select-none">
              <input
                checked={capacityEnabled}
                onChange={e => setCapacityEnabled(e.target.checked)}
                className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer border-gray-300 right-5 z-10 top-0 transition-transform duration-300 ease-in-out"
                id="toggle-capacity"
                name="toggle"
                type="checkbox"
              />
              <label
                className="toggle-label block overflow-hidden h-5 rounded-full bg-gray-300 cursor-pointer transition-colors duration-300 ease-in-out"
                htmlFor="toggle-capacity"
              />
            </div>
          </div>
          <div className={`flex gap-3 ${!capacityEnabled ? "opacity-40 pointer-events-none" : ""}`}>
            <div className="flex-1 space-y-2">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">
                {t("class.capacity_male") || "Male"}
              </label>
              <input
                value={formData.leaderCount || ""}
                onChange={e => setFormData({ ...formData, leaderCount: Number(e.target.value) })}
                className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-sm font-black focus:ring-2 focus:ring-primary/10"
                disabled={!capacityEnabled}
                placeholder="0"
                type="number"
              />
            </div>
            <div className="flex-1 space-y-2">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">
                {t("class.capacity_female") || "Female"}
              </label>
              <input
                value={formData.followerCount || ""}
                onChange={e => setFormData({ ...formData, followerCount: Number(e.target.value) })}
                className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-sm font-black focus:ring-2 focus:ring-primary/10"
                disabled={!capacityEnabled}
                placeholder="0"
                type="number"
              />
            </div>
          </div>
        </div>

        {/* Instructors - Decomposed Component */}
        <ClassInstructorForm
          instructors={formData.instructors as any}
          allUsers={allUsers}
          t={t}
          onAddInstructor={handleAddInstructor}
          onRemoveInstructor={handleRemoveInstructor}
        />

        {/* Schedule - Decomposed Component */}
        <ClassScheduleForm
          schedule={formData.schedule}
          t={t}
          isSpecial={isSpecial}
          isEditMode={isEditMode}
          onAddWeeks={handleAddWeeks}
          onRemoveWeek={handleRemoveWeek}
          onUpdateSchedule={handleUpdateSchedule}
          onGenerateFourWeeks={handleGenerateFourWeeks}
        />

        {/* Media */}
        <div className="space-y-6 pb-8">
          <label className="text-[13px] font-black text-gray-400 uppercase tracking-widest ml-1">
            {t("class.media_label")}
          </label>
          {/* Thumbnail Photo */}
          <div className="space-y-3">
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">
              {t("class.main_photo")}
            </label>
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
                      <span className="text-xs font-bold text-white tracking-tight">{t("class.optimizing")}</span>
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
                    <span className="text-white font-bold text-sm">{t("class.change_photo")}</span>
                  </div>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-3xl text-gray-300 mb-2">image</span>
                  <p className="text-sm font-bold text-gray-800 mb-1">{t("class.upload_photo")}</p>
                  <p className="text-[11px] text-gray-400">{t("class.photo_desc")}</p>
                </>
              )}
            </div>
          </div>
          {/* Promo Video */}
          <div className="space-y-3">
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">
              {t("class.promo_video")}
            </label>
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
                      <span className="text-xs font-bold text-white tracking-tight">{t("class.optimizing")}</span>
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
                    <span className="text-white font-bold text-sm">{t("class.change_video")}</span>
                  </div>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-3xl text-gray-300 mb-2">movie</span>
                  <p className="text-sm font-bold text-gray-800 mb-1">{t("class.upload_video")}</p>
                  <p className="text-[11px] text-gray-400">{t("class.video_desc")}</p>
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
