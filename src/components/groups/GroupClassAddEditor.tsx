// 클래스 정보를 신규 등록하고 수정하기 위한 코어 에디터 컴포넌트
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
import { safeDate } from "@/lib/utils/safeDate";
import { ClassInstructorForm } from "./ClassInstructorForm";
import { ClassScheduleForm } from "./ClassScheduleForm";
import { motion } from "framer-motion";

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
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [selectedVideoFile, setSelectedVideoFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string>("");
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string>("");

  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

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
      setImagePreviewUrl(initialData.imageUrl || (initialData as any).image || "");
      setVideoPreviewUrl(initialData.videoUrl || "");
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
          updatedSchedule.length > 0 ? (safeDate(updatedSchedule[updatedSchedule.length - 1].date) || new Date()) : new Date();

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
      const baseDate = safeDate(base.date) || new Date();
      const generated = Array.from({ length: 3 }).map((_, i) => {
        const nextDate = new Date(baseDate);
        nextDate.setDate(baseDate.getDate() + (i + 1) * 7);
        return { ...base, week: i + 2, date: nextDate.toISOString().split("T")[0] };
      });
      setFormData(prev => ({ ...prev, schedule: [{ ...prev.schedule[0], week: 1 }, ...generated] }));
    } else {
      toast.error(t('toast.class.set_first_date'));
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedImageFile(file);
    const url = URL.createObjectURL(file);
    setImagePreviewUrl(url);
    if (imageInputRef.current) imageInputRef.current.value = "";
  };

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedVideoFile(file);
    const url = URL.createObjectURL(file);
    setVideoPreviewUrl(url);
    if (videoInputRef.current) videoInputRef.current.value = "";
  };

  const removeImage = () => {
    setSelectedImageFile(null);
    setImagePreviewUrl("");
  };

  const removeVideo = () => {
    setSelectedVideoFile(null);
    setVideoPreviewUrl("");
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

      // Sequential file upload
      const filesToUpload: { file: File; type: "image" | "video" }[] = [];
      if (selectedImageFile) filesToUpload.push({ file: selectedImageFile, type: "image" });
      if (selectedVideoFile) filesToUpload.push({ file: selectedVideoFile, type: "video" });

      let finalImageUrl = imagePreviewUrl;
      let finalVideoUrl = videoPreviewUrl;

      if (filesToUpload.length > 0) {
        setUploadProgress(0);
        for (let i = 0; i < filesToUpload.length; i++) {
          const item = filesToUpload[i];
          const groupId = group?.id || "special";
          const folder = item.type === "image" ? "images" : "videos";
          const path = `groups/${groupId}/classes/${folder}/${uuidv4()}_${item.file.name}`;
          
          const url = await storageService.uploadFile(item.file, path, progress => {
            const overall = Math.round(((i * 100) + progress) / filesToUpload.length);
            setUploadProgress(overall);
          });

          if (item.type === "image") {
            finalImageUrl = url;
          } else {
            finalVideoUrl = url;
          }
        }
        setUploadProgress(null);
      }

      let finalSchedule = formData.schedule;
      if (!isSpecial && !isEditMode && formData.schedule.length === 1) {
        const baseSchedule = formData.schedule[0];
        const baseDate = safeDate(baseSchedule.date) || new Date();
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

      const finalData = { 
        ...formData, 
        imageUrl: finalImageUrl,
        image: finalImageUrl,
        photoURL: finalImageUrl,
        videoUrl: finalVideoUrl,
        schedule: finalSchedule 
      };

      if (!capacityEnabled) {
        finalData.leaderCount = 0;
        finalData.followerCount = 0;
      }

      const cleanUndefined = (obj: any): any => {
        if (Array.isArray(obj)) return obj.map(cleanUndefined);
        if (obj !== null && typeof obj === "object" && (obj.constructor === Object || !obj.constructor)) {
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
      setUploadProgress(null);
    }
  };

  if (typeof window === "undefined") return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: "100%" }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: "100%" }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="fixed inset-0 z-[10000] bg-white flex items-center justify-center font-['Plus_Jakarta_Sans']"
    >
      <main className="max-w-md w-full h-[100dvh] bg-white flex flex-col overflow-hidden relative text-left">
        {/* Header */}
        <div className="flex-shrink-0 bg-white border-b border-slate-100 px-4 h-14 flex items-center justify-between z-50">
          <button type="button" onClick={onClose} className="w-10 h-10 flex items-center justify-center -ml-2 active:scale-95 transition-transform text-slate-700">
            <span className="material-symbols-rounded text-2xl">arrow_back</span>
          </button>
          <h1 className="text-[14px] font-black uppercase tracking-widest text-slate-800">
            {isEditMode ? t("class.edit_class") : t("class.add_class")}
          </h1>
          <div className="w-10" />
        </div>

        <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="flex-1 flex flex-col overflow-hidden">
          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto px-4 mt-4 space-y-6 pb-6 text-left no-scrollbar">
            {/* Special Class Banner */}
            {isSpecial && (
              <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                <span className="material-symbols-rounded text-amber-500 text-[18px] shrink-0 mt-0.5">info</span>
                <p className="text-[12px] font-bold text-amber-700 leading-normal">
                  {t("class.special_daily_notice")}
                </p>
              </div>
            )}

            {/* Title */}
            <div>
              <label className="block text-xs font-bold text-[#596061] mb-1.5 uppercase tracking-wider">
                {t("class.title_label")} <span className="text-red-400">*</span>
              </label>
              <input
                required
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                className="w-full bg-[#f8f9fa] border border-[#e0e4e5] rounded-xl px-4 py-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                placeholder={t("class.title_placeholder") || "e.g. Advanced Contemporary Dance"}
                type="text"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold text-[#596061] mb-1.5 uppercase tracking-wider">
                {t("class.desc_label")}
              </label>
              <textarea
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                className="w-full min-h-[120px] bg-[#f8f9fa] border border-[#e0e4e5] rounded-xl px-4 py-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all resize-none leading-relaxed"
                placeholder={t("class.desc_placeholder") || "Provide class syllabus and student expectations..."}
                rows={4}
              />
              <div className="flex justify-end mt-1.5 mr-1">
                <span className="text-[10px] font-bold text-gray-300">{formData.description?.length || 0} / 2000</span>
              </div>
            </div>

            {/* Level */}
            <div>
              <label className="block text-xs font-bold text-[#596061] mb-1.5 uppercase tracking-wider">
                {t("class.level_label")}
              </label>
              <div className="relative">
                <select
                  value={formData.level}
                  onChange={e => setFormData({ ...formData, level: e.target.value as any })}
                  className="w-full bg-[#f8f9fa] border border-[#e0e4e5] rounded-xl px-4 py-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all appearance-none pr-10"
                >
                  <option value="Basic">{t("class.level_basic") || "Basic"}</option>
                  <option value="Intermediate">{t("class.level_intermediate") || "Intermediate"}</option>
                  <option value="Advanced">{t("class.level_advanced") || "Advanced"}</option>
                  <option value="Very-Advanced">{t("class.level_very_advanced") || "Very-Advanced"}</option>
                  <option value="Masterclass">{t("class.level_masterclass") || "Masterclass"}</option>
                </select>
                <span className="material-symbols-rounded absolute right-3 top-1/2 -translate-y-1/2 text-[#acb3b4] pointer-events-none">expand_more</span>
              </div>
            </div>

            {/* Class Type - only for non-special */}
            {!isSpecial && (
              <div>
                <label className="block text-xs font-bold text-[#596061] mb-1.5 uppercase tracking-wider">
                  {t("class.type_label")}
                </label>
                <div className="relative">
                  <select
                    value={formData.classType}
                    onChange={e => setFormData({ ...formData, classType: e.target.value })}
                    className="w-full bg-[#f8f9fa] border border-[#e0e4e5] rounded-xl px-4 py-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all appearance-none pr-10"
                  >
                    <option value="Change Class">{t("class.type_change_class") || "Change Class"}</option>
                    <option value="Partner Class">{t("class.type_partner_class") || "Partner Class"}</option>
                    <option value="Partner Class with Change">{t("class.type_partner_class_with_change") || "Partner Class with Change"}</option>
                    <option value="Training">{t("class.type_training") || "Training"}</option>
                    <option value="special">{t("class.type_special_event") || "Special Event"}</option>
                  </select>
                  <span className="material-symbols-rounded absolute right-3 top-1/2 -translate-y-1/2 text-[#acb3b4] pointer-events-none">expand_more</span>
                </div>
              </div>
            )}

            {/* Venue */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#596061] mb-1.5 uppercase tracking-wider">
                  {t("class.venue_label") || "Venue"}
                </label>
                <div className="relative z-40">
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                      location_on
                    </span>
                    <input
                      value={venueName}
                      onChange={e => handleVenueSearch(e.target.value)}
                      onFocus={() => venueName.length >= 1 && setShowVenueResults(venueResults.length > 0)}
                      onBlur={() => setTimeout(() => setShowVenueResults(false), 200)}
                      className="w-full bg-[#f8f9fa] border border-[#e0e4e5] rounded-xl pl-12 pr-4 py-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                      placeholder={t("class.venue_placeholder") || "Search venues..."}
                    />
                  </div>
                  {showVenueResults && (
                    <div className="absolute top-full left-0 w-full mt-2 bg-white border border-slate-100 rounded-xl shadow-lg z-50 max-h-60 overflow-y-auto animate-in fade-in duration-200">
                      {venueResults.map(v => (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() => handleSelectVenue(v)}
                          className="w-full text-left px-4 py-2.5 hover:bg-slate-50 flex items-center gap-3 transition-colors border-b border-slate-50 last:border-b-0"
                        >
                          <span className="material-symbols-outlined text-[16px] text-slate-400 shrink-0">location_on</span>
                          <div className="flex flex-col">
                            <p className="font-bold text-xs text-gray-800 leading-tight">{v.name}</p>
                            {v.nameKo && <span className="text-[9px] text-slate-400 font-medium leading-tight">{v.nameKo}</span>}
                          </div>
                          <span className="text-[9px] text-gray-300 font-bold ml-auto shrink-0">{v.city}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <input
                value={(formData as any).locationMemo || ""}
                onChange={e => setFormData({ ...formData, locationMemo: e.target.value } as any)}
                className="w-full bg-[#f8f9fa] border border-[#e0e4e5] rounded-xl px-4 py-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                placeholder={t("class.venue_memo_placeholder") || "Enter address or specific location details"}
                type="text"
              />
            </div>

            {/* Price & Currency */}
            <div>
              <label className="block text-xs font-bold text-[#596061] mb-1.5 uppercase tracking-wider">
                {t("class.price_label")} <span className="text-red-400">*</span>
              </label>
              <div className="flex w-full items-center gap-3">
                <div className="relative w-[100px] shrink-0">
                  <select
                    value={formData.currency}
                    onChange={e => setFormData({ ...formData, currency: e.target.value })}
                    className="w-full bg-[#f8f9fa] border border-[#e0e4e5] rounded-xl px-4 py-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all appearance-none pr-8"
                  >
                    <option value="KRW">{t("class.currency_krw") || "KRW"}</option>
                    <option value="USD">{t("class.currency_usd") || "USD"}</option>
                    <option value="EUR">{t("class.currency_eur") || "EUR"}</option>
                    <option value="JPY">{t("class.currency_jpy") || "JPY"}</option>
                  </select>
                  <span className="material-symbols-rounded absolute right-3 top-1/2 -translate-y-1/2 text-[#acb3b4] pointer-events-none">expand_more</span>
                </div>
                <input
                  value={formData.amount ? formData.amount.toLocaleString() : ""}
                  onChange={e => {
                    const val = e.target.value.replace(/[^0-9]/g, "");
                    setFormData({ ...formData, amount: Number(val) });
                  }}
                  className="flex-1 min-w-0 bg-[#f8f9fa] border border-[#e0e4e5] rounded-xl px-4 py-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-right font-bold"
                  placeholder="0"
                  type="text"
                />
              </div>
            </div>

            {/* Capacity */}
            <div className="bg-[#f8f9fa] rounded-xl p-4 border border-[#e0e4e5] space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-[#596061] uppercase tracking-wider">{t("class.capacity_label")}</h3>
                <button
                  type="button"
                  onClick={() => setCapacityEnabled(!capacityEnabled)}
                  className={`w-12 h-6 rounded-full relative shadow-inner transition-colors duration-300 ${
                    capacityEnabled ? 'bg-primary' : 'bg-slate-300'
                  }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 shadow-sm transition-transform duration-300 flex items-center justify-center ${
                    capacityEnabled ? 'translate-x-[22px]' : 'translate-x-[2px]'
                  }`}>
                    {capacityEnabled && <span className="material-symbols-rounded text-[10px] text-primary font-bold">check</span>}
                  </div>
                </button>
              </div>
              {capacityEnabled && (
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="block text-[10px] font-bold text-[#596061] mb-1 uppercase tracking-wider">{t("class.capacity_male") || "Male"}</label>
                    <input
                      value={formData.leaderCount || ""}
                      onChange={e => setFormData({ ...formData, leaderCount: Number(e.target.value) })}
                      className="w-full bg-white border border-[#e0e4e5] rounded-lg px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                      placeholder="0"
                      type="number"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-[10px] font-bold text-[#596061] mb-1 uppercase tracking-wider">{t("class.capacity_female") || "Female"}</label>
                    <input
                      value={formData.followerCount || ""}
                      onChange={e => setFormData({ ...formData, followerCount: Number(e.target.value) })}
                      className="w-full bg-white border border-[#e0e4e5] rounded-lg px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                      placeholder="0"
                      type="number"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Instructors */}
            <ClassInstructorForm
              instructors={formData.instructors as any}
              allUsers={allUsers}
              t={t}
              onAddInstructor={handleAddInstructor}
              onRemoveInstructor={handleRemoveInstructor}
            />

            {/* Schedule */}
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

            {/* Media Uploads */}
            <div className="space-y-4 pt-2">
              <label className="block text-xs font-bold text-[#596061] uppercase tracking-wider">
                {t("class.media_label")}
              </label>

              {/* Main Photo Thumbnail */}
              <div>
                <label className="block text-[10px] font-bold text-[#596061] mb-1.5 uppercase tracking-wider">
                  {t("class.main_photo")}
                </label>
                <input type="file" ref={imageInputRef} className="hidden" accept="image/*" onChange={handleImageSelect} />
                <div
                  onClick={() => imageInputRef.current?.click()}
                  className="w-full h-40 border border-[#e0e4e5] rounded-xl flex flex-col items-center justify-center text-center bg-[#f8f9fa] active:scale-95 transition-transform cursor-pointer relative overflow-hidden"
                >
                  {imagePreviewUrl ? (
                    <>
                      <img src={imagePreviewUrl} alt="Thumbnail preview" className="w-full h-full object-cover absolute inset-0" />
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); removeImage(); }}
                        className="absolute top-2 right-2 w-6 h-6 bg-black/60 rounded-full text-white flex items-center justify-center active:scale-95"
                      >
                        <span className="material-symbols-rounded text-[16px]">close</span>
                      </button>
                      <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[9px] font-bold text-center py-1 uppercase tracking-wider">
                        {t("class.change_photo")}
                      </div>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-rounded text-2xl text-slate-400 mb-1">add_photo_alternate</span>
                      <p className="text-xs font-bold text-[#596061] mb-0.5">{t("class.upload_photo")}</p>
                      <p className="text-[10px] text-slate-400">{t("class.photo_desc")}</p>
                    </>
                  )}
                </div>
              </div>

              {/* Promo Video */}
              <div>
                <label className="block text-[10px] font-bold text-[#596061] mb-1.5 uppercase tracking-wider">
                  {t("class.promo_video")}
                </label>
                <input type="file" ref={videoInputRef} className="hidden" accept="video/*" onChange={handleVideoSelect} />
                <div
                  onClick={() => videoInputRef.current?.click()}
                  className="w-full h-40 border border-[#e0e4e5] rounded-xl flex flex-col items-center justify-center text-center bg-[#f8f9fa] active:scale-95 transition-transform cursor-pointer relative overflow-hidden"
                >
                  {videoPreviewUrl ? (
                    <>
                      <div className="absolute inset-0 bg-slate-900 flex items-center justify-center">
                        <span className="material-symbols-outlined text-white text-4xl">play_circle</span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); removeVideo(); }}
                        className="absolute top-2 right-2 w-6 h-6 bg-black/60 rounded-full text-white flex items-center justify-center active:scale-95"
                      >
                        <span className="material-symbols-rounded text-[16px]">close</span>
                      </button>
                      <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[9px] font-bold text-center py-1 uppercase tracking-wider">
                        {t("class.change_video")}
                      </div>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-rounded text-2xl text-slate-400 mb-1">video_call</span>
                      <p className="text-xs font-bold text-[#596061] mb-0.5">{t("class.upload_video")}</p>
                      <p className="text-[10px] text-slate-400">{t("class.video_desc")}</p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Submit Save Floating Bar */}
          <div className="flex-shrink-0 w-full p-4 border-t border-slate-100 bg-white pb-[calc(1rem+env(safe-area-inset-bottom))] z-50">
            <button type="submit" disabled={isSaving}
              className="w-full bg-primary text-white font-bold py-3.5 rounded-xl shadow-lg shadow-primary/20 active:scale-[0.98] transition-transform disabled:opacity-50 flex items-center justify-center">
              {isSaving ? (
                uploadProgress !== null ? (
                  `${uploadProgress}%`
                ) : (
                  t("common.saving") || "Saving..."
                )
              ) : (
                t("common.save") || "SAVE"
              )}
            </button>
          </div>
        </form>
      </main>
    </motion.div>
  );
};

export default GroupClassAddEditor;
