// WocClass 및 GroupClass 통합 등록을 위한 3단계 스텝 마법사 에디터 (소셜 모달 디자인/UX 100% 완벽 동기화)
"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";

import { WocClass } from "@/types/class";
import { Group, GroupClass, ClassScheduleEntry } from "@/types/group";
import { wocClassService } from "@/lib/firebase/wocClassService";
import { groupService } from "@/lib/firebase/groupService";
import { storageService } from "@/lib/firebase/storageService";
import { userService } from "@/lib/firebase/userService";
import { venueService } from "@/lib/firebase/venueService";
import { getManageableGroups } from "@/lib/utils/groupPermissions";
import { PublicProfile } from "@/types/user";
import { Venue } from "@/types/venue";
import { Capacitor } from "@capacitor/core";
import { safeDate } from "@/lib/utils/safeDate";
import { ClassInstructorForm } from "@/components/groups/ClassInstructorForm";
import { ClassScheduleForm } from "@/components/groups/ClassScheduleForm";

interface ClassAddEditorProps {
  onClose: () => void;
  onSave?: () => void;
  initialType?: "regular" | "special";
  group?: Group | null;
  initialData?: GroupClass | WocClass | any;
  targetMonth?: string;
  isSpecial?: boolean;
}

const TOTAL_STEPS = 3;

const ClassAddEditor: React.FC<ClassAddEditorProps> = ({
  onClose,
  onSave,
  initialType,
  group: inheritedGroup,
  initialData,
  targetMonth,
  isSpecial: inheritedIsSpecial,
}) => {
  const { t, language } = useLanguage();
  const { user, profile } = useAuth();

  const [step, setStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  const [isSpecial, setIsSpecial] = useState<boolean>(
    inheritedIsSpecial || initialType === "special" || initialData?.type === "special" || initialData?.classType === "special" || false
  );
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(inheritedGroup || null);
  const [groupSearch, setGroupSearch] = useState("");
  const [groupResults, setGroupResults] = useState<Group[]>([]);
  const [showGroupResults, setShowGroupResults] = useState(false);
  const [manageableGroups, setManageableGroups] = useState<Group[]>([]);

  const [classType, setClassType] = useState<string>(
    initialData?.classType || "Change Class"
  );

  const [instructors, setInstructors] = useState<
    { name: string; role: string; userId: string; avatar?: string }[]
  >(initialData?.instructors || []);
  const [allUsers, setAllUsers] = useState<PublicProfile[]>([]);

  const [venueName, setVenueName] = useState(initialData?.location || "");
  const [locationMemo, setLocationMemo] = useState(initialData?.locationMemo || "");
  const [allVenues, setAllVenues] = useState<Venue[]>([]);
  const [venueResults, setVenueResults] = useState<Venue[]>([]);
  const [showVenueResults, setShowVenueResults] = useState(false);

  const [title, setTitle] = useState(initialData?.title || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [level, setLevel] = useState<"Basic" | "Beginner" | "Intermediate" | "Advanced" | "Masterclass">(
    initialData?.level || "Beginner"
  );
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [selectedVideoFile, setSelectedVideoFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState(
    initialData?.imageUrl || initialData?.image || ""
  );
  const [videoPreviewUrl, setVideoPreviewUrl] = useState(initialData?.videoUrl || "");
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const [capacityEnabled, setCapacityEnabled] = useState(
    (initialData?.leaderCount && initialData.leaderCount > 0) ||
    (initialData?.followerCount && initialData.followerCount > 0)
      ? true
      : false
  );
  const [leaderCount, setLeaderCount] = useState<number>(initialData?.leaderCount || 0);
  const [followerCount, setFollowerCount] = useState<number>(initialData?.followerCount || 0);

  const [scheduleEntries, setScheduleEntries] = useState<ClassScheduleEntry[]>(
    initialData?.schedule && Array.isArray(initialData.schedule) && initialData.schedule.length > 0
      ? initialData.schedule
      : [
          {
            week: 1,
            date: new Date().toISOString().split("T")[0],
            timeSlot: "19:00 - 21:00",
            content: "",
          },
        ]
  );

  const [currency, setCurrency] = useState<"KRW" | "USD">(
    initialData?.pricing?.currency || initialData?.currency || "KRW"
  );
  const [priceAmount, setPriceAmount] = useState<number>(
    initialData?.pricing?.dropIn || initialData?.amount || initialData?.price || 0
  );

  useEffect(() => {
    venueService.getVenues().then(setAllVenues).catch(console.error);
    userService.getAllPublicProfiles().then(setAllUsers).catch(console.error);
    groupService
      .getGroups()
      .then((groups: Group[]) => {
        if (user && profile) {
          const mGroups = getManageableGroups(groups, user.uid, profile);
          setManageableGroups(mGroups);
          if (!inheritedGroup && mGroups.length > 0 && !selectedGroup) {
            setSelectedGroup(mGroups[0]);
          }
        }
      })
      .catch(console.error);
  }, [user, profile, inheritedGroup]);

  const handleGroupSearch = (val: string) => {
    setGroupSearch(val);
    if (val.trim().length >= 1) {
      const lower = val.toLowerCase().trim();
      const filtered = manageableGroups.filter(
        g => g.name.toLowerCase().includes(lower)
      );
      setGroupResults(filtered);
      setShowGroupResults(true);
    } else {
      setShowGroupResults(false);
      setGroupResults([]);
    }
  };

  const handleVenueSearch = (val: string) => {
    setVenueName(val);
    if (val.trim().length >= 1) {
      const lower = val.toLowerCase().trim();
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

  const handleAddInstructor = (u: PublicProfile) => {
    setInstructors(prev => [
      ...prev,
      {
        name: u.nickname || u.nativeNickname || u.id,
        role: "Instructor",
        userId: u.id,
        avatar: u.photoURL || "",
      },
    ]);
  };

  const handleRemoveInstructor = (index: number) => {
    setInstructors(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddWeeks = (weeks: number) => {
    setScheduleEntries(prev => {
      const updated = [...prev];
      for (let i = 0; i < weeks; i++) {
        const nextWeekNum = updated.length + 1;
        const lastDate =
          updated.length > 0
            ? safeDate(updated[updated.length - 1].date) || new Date()
            : new Date();
        const nextDate = new Date(lastDate);
        if (updated.length > 0) {
          nextDate.setDate(lastDate.getDate() + 7);
        }
        updated.push({
          week: nextWeekNum,
          date: nextDate.toISOString().split("T")[0],
          timeSlot: updated.length > 0 ? updated[0].timeSlot : "19:00 - 21:00",
          content: "",
        });
      }
      return updated;
    });
  };

  const handleRemoveWeek = (index: number) => {
    if (scheduleEntries.length <= 1) return;
    setScheduleEntries(prev =>
      prev
        .filter((_, i) => i !== index)
        .map((entry, i) => ({ ...entry, week: i + 1 }))
    );
  };

  const handleUpdateSchedule = (
    index: number,
    field: keyof ClassScheduleEntry,
    value: any
  ) => {
    setScheduleEntries(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleGenerateFourWeeks = () => {
    if (scheduleEntries.length === 1 && scheduleEntries[0].date) {
      const base = scheduleEntries[0];
      const baseDate = safeDate(base.date) || new Date();
      const generated = Array.from({ length: 3 }).map((_, i) => {
        const nextDate = new Date(baseDate);
        nextDate.setDate(baseDate.getDate() + (i + 1) * 7);
        return {
          ...base,
          week: i + 2,
          date: nextDate.toISOString().split("T")[0],
        };
      });
      setScheduleEntries([{ ...base, week: 1 }, ...generated]);
    } else {
      toast.error(t("toast.class.set_first_date") || "첫 일자를 입력해 주세요.");
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedImageFile(file);
    setImagePreviewUrl(URL.createObjectURL(file));
  };

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedVideoFile(file);
    setVideoPreviewUrl(URL.createObjectURL(file));
  };

  const validateStep = (s: number): boolean => {
    if (s === 1) return true;
    if (s === 2) {
      if (!title.trim()) {
        toast.error(t("wocClass.title_required") || "클래스 제목을 입력해주세요.");
        return false;
      }
      return true;
    }
    if (s === 3) {
      if (scheduleEntries.length === 0) {
        toast.error(t("wocClass.add_at_least_one_session") || "최소 1개 이상의 일정을 추가해주세요.");
        return false;
      }
      return true;
    }
    return true;
  };

  const goNext = () => {
    if (validateStep(step) && step < TOTAL_STEPS) {
      setStep(step + 1);
    }
  };

  const goPrev = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleCloseAttempt = () => {
    const hasChanges = title.trim() !== '' || description.trim() !== '' || priceAmount > 0;
    if (hasChanges) {
      if (confirm(t('social.alert_discard_changes') || "수정사항을 파기하시겠습니까?")) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  const handleHeaderBack = () => {
    if (step > 1) {
      goPrev();
    } else {
      handleCloseAttempt();
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error(t("class.enter_title") || "제목을 입력하세요.");
      return;
    }

    setIsSaving(true);
    try {
      let finalImageUrl = imagePreviewUrl;
      let finalVideoUrl = videoPreviewUrl;

      if (selectedImageFile) {
        const path = `classes/images/${uuidv4()}_${selectedImageFile.name}`;
        finalImageUrl = await storageService.uploadFile(selectedImageFile, path, setUploadProgress);
      }
      if (selectedVideoFile) {
        const path = `classes/videos/${uuidv4()}_${selectedVideoFile.name}`;
        finalVideoUrl = await storageService.uploadFile(selectedVideoFile, path, setUploadProgress);
      }

      const groupId = selectedGroup?.id || inheritedGroup?.id || "special";
      const classId = initialData?.id || uuidv4();

      const firstEntry = scheduleEntries[0];
      const lastEntry = scheduleEntries[scheduleEntries.length - 1];

      let computedDayOfWeek = 0;
      if (firstEntry?.date) {
        const cleanDateStr = firstEntry.date.replace(/\./g, '-');
        const parsedD = new Date(cleanDateStr);
        if (!isNaN(parsedD.getTime())) {
          computedDayOfWeek = parsedD.getDay();
        }
      }

      const singleSchedule = {
        recurrenceType: isSpecial ? "special" : "regular",
        startDate: firstEntry?.date || "",
        endDate: lastEntry?.date || "",
        dayOfWeek: computedDayOfWeek,
        startTime: firstEntry?.timeSlot?.split(" - ")[0] || "19:00",
        endTime: firstEntry?.timeSlot?.split(" - ")[1] || "21:00",
      };

      const sessionsArray = scheduleEntries.map((e, idx) => ({
        id: `s${idx + 1}`,
        date: e.date || "",
        startTime: e.timeSlot?.split(" - ")[0] || "",
        endTime: e.timeSlot?.split(" - ")[1] || "",
        content: e.content || "",
      }));

      const rawPayload: any = {
        id: classId,
        title: title || "",
        description: description || "",
        level: level || "Beginner",
        currency: currency || "KRW",
        amount: Number(priceAmount) || 0,
        price: Number(priceAmount) || 0,
        dailyClassPrice: Number(priceAmount) || 0,
        instructors: instructors || [],
        schedule: scheduleEntries || [],
        singleSchedule: singleSchedule || {},
        sessions: sessionsArray || [],
        status: initialData?.status || "Open",
        targetMonth: targetMonth || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`,
        imageUrl: finalImageUrl || "",
        videoUrl: finalVideoUrl || "",
        classType: isSpecial ? "special" : (classType || "Change Class"),
        leaderCount: capacityEnabled ? (Number(leaderCount) || 0) : 0,
        followerCount: capacityEnabled ? (Number(followerCount) || 0) : 0,
        maxCapacity: capacityEnabled ? ((Number(leaderCount) || 0) + (Number(followerCount) || 0)) : 0,
        location: venueName || selectedGroup?.name || "Studio",
        locationMemo: locationMemo || "",
        createdBy: user?.uid || "",
        connectedGroupIds: initialData?.connectedGroupIds || [],
        organizerType: initialData?.organizerType || "person",
        organizerId: initialData?.organizerId || user?.uid || "",
      };

      // Firestore undefined / NaN 에러 방지를 위해 JSON 직렬화 및 검증
      const payload: GroupClass = JSON.parse(JSON.stringify(rawPayload));

      if (groupId !== "special") {
        if (initialData) {
          await groupService.updateClass(groupId, classId, payload);
        } else {
          await groupService.addClass(groupId, payload);
        }
      } else {
        if (initialData) {
          await wocClassService.updateClass(classId, payload as any);
        } else {
          await wocClassService.createClass(payload as any);
        }
      }

      toast.success(t("class.added_success") || "클래스가 성공적으로 저장되었습니다.");
      if (onSave) onSave();
      onClose();
    } catch (err: any) {
      console.error("Save class detailed error:", err);
      toast.error(err?.message ? `저장 실패: ${err.message}` : (t("class.save_failed") || "저장에 실패했습니다."));
    } finally {
      setIsSaving(false);
      setUploadProgress(null);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div className="border border-[#e0e4e5] rounded-2xl bg-white">
              <div className="bg-[#f8f9fa] px-4 py-3 border-b border-[#e0e4e5] flex items-center gap-2 rounded-t-[15px]">
                <span className="material-symbols-rounded text-sm text-primary">school</span>
                <p className="text-[14px] font-bold text-primary">수업 구분</p>
              </div>
              <div className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setIsSpecial(false)}
                    className={`flex flex-col items-center justify-center py-6 px-4 rounded-2xl border-2 transition-all active:scale-95 ${
                      !isSpecial
                        ? "border-[#007AFF] bg-[#007AFF]/5 text-[#007AFF] shadow-sm font-black"
                        : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 font-bold"
                    }`}
                  >
                    <span className="material-symbols-rounded text-3xl mb-2">school</span>
                    <span className="text-[15px]">정규 클래스</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsSpecial(true)}
                    className={`flex flex-col items-center justify-center py-6 px-4 rounded-2xl border-2 transition-all active:scale-95 ${
                      isSpecial
                        ? "border-[#007AFF] bg-[#007AFF]/5 text-[#007AFF] shadow-sm font-black"
                        : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 font-bold"
                    }`}
                  >
                    <span className="material-symbols-rounded text-3xl mb-2">stars</span>
                    <span className="text-[15px]">특강 / 워크숍</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="border border-[#e0e4e5] rounded-2xl bg-white">
              <div className="bg-[#f8f9fa] px-4 py-3 border-b border-[#e0e4e5] flex items-center gap-2 rounded-t-[15px]">
                <span className="material-symbols-rounded text-sm text-primary">groups</span>
                <p className="text-[14px] font-bold text-primary">소속 그룹</p>
              </div>
              <div className="p-4 space-y-3">
                {inheritedGroup ? (
                  <div className="p-4 bg-[#f8f9fa] border border-[#e0e4e5] rounded-xl space-y-1">
                    <p className="text-sm font-bold text-[#2d3435]">{inheritedGroup.name}</p>
                    <p className="text-xs text-[#acb3b4]">그룹 관리를 통해 자동 상속되었습니다.</p>
                  </div>
                ) : (
                  <div className="relative">
                    <div className="relative flex items-center px-4 py-3 border border-[#e0e4e5] rounded-xl bg-[#f8f9fa] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#007AFF]/20 transition-all">
                      <span className="material-symbols-rounded text-[#acb3b4] mr-2">groups</span>
                      <input
                        value={selectedGroup ? selectedGroup.name : groupSearch}
                        onChange={e => {
                          setSelectedGroup(null);
                          handleGroupSearch(e.target.value);
                        }}
                        onFocus={() => setShowGroupResults(groupResults.length > 0)}
                        onBlur={() => setTimeout(() => setShowGroupResults(false), 200)}
                        className="flex-1 bg-transparent border-none p-0 focus:ring-0 text-sm font-bold text-[#2d3435] placeholder:text-[#acb3b4] placeholder:font-normal outline-none"
                        placeholder="소속 그룹 검색..."
                      />
                    </div>
                    {showGroupResults && (
                      <div className="absolute top-full left-0 w-full mt-1 bg-white border border-[#e0e4e5] rounded-xl shadow-lg z-50 max-h-48 overflow-y-auto">
                        {groupResults.map(g => (
                          <button
                            key={g.id}
                            type="button"
                            onClick={() => {
                              setSelectedGroup(g);
                              setShowGroupResults(false);
                            }}
                            className="w-full text-left px-4 py-3 hover:bg-[#f8f9fa] font-bold text-[#2d3435] text-sm border-b border-[#f2f4f4] last:border-0"
                          >
                            {g.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {!isSpecial && (
              <div className="border border-[#e0e4e5] rounded-2xl bg-white">
                <div className="bg-[#f8f9fa] px-4 py-3 border-b border-[#e0e4e5] flex items-center gap-2 rounded-t-[15px]">
                  <span className="material-symbols-rounded text-sm text-primary">category</span>
                  <p className="text-[14px] font-bold text-primary">수업 세부 유형</p>
                </div>
                <div className="p-4 space-y-3">
                  <div className="relative flex items-center px-4 py-3 border border-[#e0e4e5] rounded-xl bg-[#f8f9fa]">
                    <select
                      value={classType}
                      onChange={e => setClassType(e.target.value)}
                      className="w-full bg-transparent border-none p-0 text-sm font-bold text-[#2d3435] focus:ring-0 outline-none appearance-none cursor-pointer"
                      style={{ WebkitAppearance: 'none', appearance: 'none' }}
                    >
                      <option value="Partner Class">파트너 클래스</option>
                      <option value="Change Class">체인지 수업</option>
                      <option value="Partner Class with Change">파트너 클래스 + 체인지</option>
                      <option value="Training">트레이닝 / 강습</option>
                    </select>
                    <span className="material-symbols-rounded text-[#acb3b4] pointer-events-none">expand_more</span>
                  </div>
                </div>
              </div>
            )}

            <div className="border border-[#e0e4e5] rounded-2xl bg-white">
              <div className="bg-[#f8f9fa] px-4 py-3 border-b border-[#e0e4e5] flex items-center gap-2 rounded-t-[15px]">
                <span className="material-symbols-rounded text-sm text-primary">group</span>
                <p className="text-[14px] font-bold text-primary">강사 설정</p>
              </div>
              <div className="p-4 space-y-3">
                <ClassInstructorForm
                  instructors={instructors}
                  allUsers={allUsers}
                  t={t}
                  onAddInstructor={handleAddInstructor}
                  onRemoveInstructor={handleRemoveInstructor}
                />
              </div>
            </div>

            {!inheritedGroup && (
              <div className="border border-[#e0e4e5] rounded-2xl bg-white">
                <div className="bg-[#f8f9fa] px-4 py-3 border-b border-[#e0e4e5] flex items-center gap-2 rounded-t-[15px]">
                  <span className="material-symbols-rounded text-sm text-primary">location_on</span>
                  <p className="text-[14px] font-bold text-primary">장소 정보</p>
                </div>
                <div className="p-4 space-y-3">
                  <div className="relative z-30">
                    <div className="relative flex items-center px-4 py-3 border border-[#e0e4e5] rounded-xl bg-[#f8f9fa] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#007AFF]/20 transition-all">
                      <span className="material-symbols-rounded text-[#acb3b4] mr-2">location_on</span>
                      <input
                        value={venueName}
                        onChange={e => handleVenueSearch(e.target.value)}
                        className="flex-1 bg-transparent border-none p-0 focus:ring-0 text-sm font-bold text-[#2d3435] placeholder:text-[#acb3b4] placeholder:font-normal outline-none"
                        placeholder="장소명 검색..."
                      />
                    </div>
                    {showVenueResults && (
                      <div className="absolute top-full left-0 w-full mt-1 bg-white border border-[#e0e4e5] rounded-xl shadow-lg z-50 max-h-48 overflow-y-auto">
                        {venueResults.map(v => (
                          <button
                            key={v.id}
                            type="button"
                            onClick={() => {
                              setVenueName(v.name);
                              setShowVenueResults(false);
                            }}
                            className="w-full text-left px-4 py-3 hover:bg-[#f8f9fa] flex items-center justify-between border-b border-[#f2f4f4] last:border-0 group transition-colors"
                          >
                            <div className="flex items-baseline gap-2">
                              <span className="font-bold text-[#2d3435] text-sm group-hover:text-primary">{v.name}</span>
                              {v.nameKo && <span className="text-xs text-[#acb3b4] font-medium">{v.nameKo}</span>}
                            </div>
                            <span className="text-xs text-[#acb3b4] font-bold bg-[#f2f4f4] px-2 py-0.5 rounded-full shrink-0">{v.city}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center px-4 py-3 border border-[#e0e4e5] rounded-xl bg-[#f8f9fa]">
                    <input
                      value={locationMemo}
                      onChange={e => setLocationMemo(e.target.value)}
                      className="flex-1 bg-transparent border-none p-0 focus:ring-0 text-sm font-bold text-[#2d3435] placeholder:text-[#acb3b4] placeholder:font-normal outline-none"
                      placeholder="상세주소 및 위치 안내..."
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case 2:
        return (
          <div className="space-y-5 animate-in fade-in duration-200">
            {/* 기본 정보 카드 */}
            <div className="border border-[#e0e4e5] rounded-2xl bg-white">
              <div className="bg-[#f8f9fa] px-4 py-3 border-b border-[#e0e4e5] flex items-center gap-2 rounded-t-[15px]">
                <span className="material-symbols-rounded text-sm text-primary">info</span>
                <p className="text-[14px] font-bold text-primary">기본 정보</p>
              </div>
              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    클래스 제목 <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center px-4 py-3 border border-[#e0e4e5] rounded-xl bg-[#f8f9fa] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#007AFF]/20 transition-all">
                    <input
                      required
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                      className="flex-1 bg-transparent border-none p-0 focus:ring-0 text-sm font-bold text-[#2d3435] placeholder:text-[#acb3b4] placeholder:font-normal outline-none"
                      placeholder="예: 초중급 탱고 체인지 클래스"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    상세 커리큘럼 및 수강 안내
                  </label>
                  <div className="flex px-4 py-3 border border-[#e0e4e5] rounded-xl bg-[#f8f9fa] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#007AFF]/20 transition-all">
                    <textarea
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      rows={4}
                      className="flex-1 bg-transparent border-none p-0 focus:ring-0 text-sm font-bold text-[#2d3435] placeholder:text-[#acb3b4] placeholder:font-normal outline-none resize-none min-h-[100px]"
                      placeholder="수업 목표, 커리큘럼, 준비물 등을 자유롭게 작성하세요."
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    난이도 레벨
                  </label>
                  <div className="relative flex items-center px-4 py-3 border border-[#e0e4e5] rounded-xl bg-[#f8f9fa]">
                    <select
                      value={level}
                      onChange={e => setLevel(e.target.value as any)}
                      className="w-full bg-transparent border-none p-0 text-sm font-bold text-[#2d3435] focus:ring-0 outline-none appearance-none cursor-pointer"
                      style={{ WebkitAppearance: 'none', appearance: 'none' }}
                    >
                      <option value="Basic">기초 (Basic)</option>
                      <option value="Beginner">초급 (Beginner)</option>
                      <option value="Intermediate">중급 (Intermediate)</option>
                      <option value="Advanced">고급 (Advanced)</option>
                      <option value="Masterclass">마스터 (Masterclass)</option>
                    </select>
                    <span className="material-symbols-rounded text-[#acb3b4] pointer-events-none">expand_more</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 포스터 및 미디어 갤러리 카드 (소셜 100% 동일) */}
            <div className="border border-[#e0e4e5] rounded-2xl bg-white">
              <div className="bg-[#f8f9fa] px-4 py-3 border-b border-[#e0e4e5] flex items-center gap-2 rounded-t-[15px]">
                <span className="material-symbols-rounded text-sm text-primary">image</span>
                <p className="text-[14px] font-bold text-primary">포스터 및 미디어</p>
              </div>
              <div className="p-4 space-y-4">
                <div className="py-4 px-8 border border-[#e0e4e5] rounded-xl bg-[#f8f9fa] flex justify-center">
                  <div
                    onClick={() => imageInputRef.current?.click()}
                    className="relative aspect-[4/5] w-full max-w-[240px] rounded-lg overflow-hidden bg-white border border-[#e0e4e5] flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-all group shadow-sm"
                  >
                    {imagePreviewUrl ? (
                      <>
                        <img src={imagePreviewUrl} alt="Poster" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        <div className="absolute top-3 left-3 bg-primary text-white text-xs font-black uppercase tracking-widest px-2.5 py-1 rounded shadow-sm z-10">
                          {t('social.primary') || 'PRIMARY'}
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedImageFile(null);
                            setImagePreviewUrl("");
                          }}
                          className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center text-xs z-20"
                        >
                          ✕
                        </button>
                      </>
                    ) : (
                      <div className="flex flex-col items-center text-[#acb3b4] group-hover:text-primary transition-colors">
                        <span className="material-symbols-rounded text-4xl mb-2">add_photo_alternate</span>
                        <span className="text-xs font-bold text-center px-4">포스터 업로드<br/><span className="text-xs font-medium mt-1">4:5 비율 권장</span></span>
                      </div>
                    )}
                  </div>
                  <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
                </div>

                <div>
                  <button
                    type="button"
                    onClick={() => videoInputRef.current?.click()}
                    className="w-full py-3 px-4 border border-[#e0e4e5] bg-[#f8f9fa] hover:bg-[#f2f4f4] rounded-xl text-xs font-bold text-[#2d3435] flex items-center justify-center gap-2 transition-colors"
                  >
                    <span className="material-symbols-rounded text-primary text-[18px]">videocam</span>
                    {selectedVideoFile ? selectedVideoFile.name : "홍보 동영상 파일 선택"}
                  </button>
                  <input ref={videoInputRef} type="file" accept="video/*" className="hidden" onChange={handleVideoSelect} />
                </div>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div className="border border-[#e0e4e5] rounded-2xl bg-white p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-rounded text-primary text-sm">groups</span>
                  <p className="text-[14px] font-bold text-primary">수업 정원 제한</p>
                </div>
                <button
                  type="button"
                  onClick={() => setCapacityEnabled(!capacityEnabled)}
                  className={`w-11 h-6 rounded-full relative transition-colors ${
                    capacityEnabled ? "bg-[#007AFF]" : "bg-slate-300"
                  }`}
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${
                      capacityEnabled ? "translate-x-5" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>

              {capacityEnabled && (
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-xs font-bold text-[#acb3b4] mb-1">리더 정원</label>
                    <div className="flex items-center px-4 py-2.5 border border-[#e0e4e5] rounded-xl bg-[#f8f9fa]">
                      <input
                        type="number"
                        value={leaderCount}
                        onChange={e => setLeaderCount(Number(e.target.value))}
                        className="w-full bg-transparent border-none p-0 text-sm font-bold text-[#2d3435] text-center outline-none"
                        placeholder="0"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#acb3b4] mb-1">팔로워 정원</label>
                    <div className="flex items-center px-4 py-2.5 border border-[#e0e4e5] rounded-xl bg-[#f8f9fa]">
                      <input
                        type="number"
                        value={followerCount}
                        onChange={e => setFollowerCount(Number(e.target.value))}
                        className="w-full bg-transparent border-none p-0 text-sm font-bold text-[#2d3435] text-center outline-none"
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="border border-[#e0e4e5] rounded-2xl bg-white p-5 space-y-4">
              <ClassScheduleForm
                schedule={scheduleEntries}
                t={t}
                isSpecial={isSpecial}
                onAddWeeks={handleAddWeeks}
                onRemoveWeek={handleRemoveWeek}
                onUpdateSchedule={handleUpdateSchedule}
                onGenerateFourWeeks={handleGenerateFourWeeks}
              />
            </div>

            <div className="border border-[#e0e4e5] rounded-2xl bg-white p-5 space-y-4">
              <div className="flex items-center gap-2 border-b border-[#e0e4e5] pb-3">
                <span className="material-symbols-rounded text-primary text-sm">local_activity</span>
                <p className="text-[14px] font-bold text-primary">수업료</p>
              </div>

              <div className="flex items-center gap-2">
                <div className="px-3 py-3 border border-[#e0e4e5] rounded-xl bg-[#f8f9fa] w-28">
                  <select
                    value={currency}
                    onChange={e => setCurrency(e.target.value as any)}
                    className="w-full bg-transparent border-none p-0 text-sm font-bold text-[#2d3435] outline-none appearance-none"
                  >
                    <option value="KRW">KRW</option>
                    <option value="USD">USD</option>
                  </select>
                </div>
                <div className="flex-1 flex items-center px-4 py-3 border border-[#e0e4e5] rounded-xl bg-[#f8f9fa]">
                  <input
                    type="number"
                    value={priceAmount || ""}
                    onChange={e => setPriceAmount(Number(e.target.value))}
                    className="w-full bg-transparent border-none p-0 text-sm font-bold text-[#2d3435] text-right outline-none"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: "100%" }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: "100%" }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="fixed inset-0 z-[1000] bg-white flex flex-col overflow-y-auto no-scrollbar font-['Inter',sans-serif]"
      style={{ paddingTop: 'calc(56px + env(safe-area-inset-top, 0px))' }}
    >
      <style dangerouslySetInnerHTML={{ __html: `.material-symbols-rounded { font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24; }` }} />

      {/* 소셜 100% 동일 Header (X버튼 전면 삭제, 좌측 뒤로가기로 조작) */}
      <header
        className="fixed top-0 left-0 w-full flex-shrink-0 bg-white border-b border-slate-100 px-4 flex items-center justify-between z-50"
        style={{
          zIndex: 100010,
          paddingTop: 'env(safe-area-inset-top, 0px)',
          height: 'calc(56px + env(safe-area-inset-top, 0px))'
        }}
      >
        <button
          type="button"
          onClick={handleHeaderBack}
          className="w-10 h-10 flex items-center justify-center -ml-2 active:scale-95 transition-transform text-slate-700"
        >
          <span className="material-symbols-rounded text-2xl">arrow_back</span>
        </button>
        <h1 className="text-[16px] font-bold text-slate-800">
          {initialData ? (t('class.edit_class') || '클래스 수정') : (t('class.add_class') || '새 클래스')}
        </h1>
        <div className="w-10" />
      </header>

      {/* 소셜 100% 동일 Step Indicator Bar */}
      <div className="max-w-2xl mx-auto px-4 mt-3">
        <div className="flex items-center justify-between border border-slate-100 bg-slate-50/80 backdrop-blur rounded-2xl px-4 py-3 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-slate-700">
              {language === 'KR' ? `${step} / ${TOTAL_STEPS} 단계` : `Step ${step} of ${TOTAL_STEPS}`}
            </span>
            <span className="text-xs font-bold text-[#007AFF] bg-[#007AFF]/10 px-2.5 py-0.5 rounded-full">
              {step === 1 && (language === 'KR' ? '수업 구분 & 소속 설정' : 'Classification & Group')}
              {step === 2 && (language === 'KR' ? '클래스 내용 & 미디어' : 'Curriculum & Media')}
              {step === 3 && (language === 'KR' ? '정원, 일정 & 수강료' : 'Schedule & Pricing')}
            </span>
          </div>
          <div className="w-20 h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#007AFF] transition-all duration-300"
              style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
            />
          </div>
        </div>
      </div>

      <main className="pt-4 pb-36 max-w-2xl mx-auto px-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -15 }}
            transition={{ duration: 0.15 }}
          >
            {renderStep()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* 소셜 100% 동일 하단 네비게이션 버튼 바 */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-100 px-4 shadow-lg flex gap-3 items-center justify-between"
        style={{
          zIndex: 100010,
          paddingTop: '16px',
          paddingBottom: Capacitor.isNativePlatform() ? 'calc(16px + env(safe-area-inset-bottom))' : '16px',
          height: Capacitor.isNativePlatform() ? 'calc(76px + env(safe-area-inset-bottom))' : '76px'
        }}
      >
        {step > 1 && (
          <button
            type="button"
            onClick={goPrev}
            className="flex-grow py-3.5 rounded-full border border-slate-200 text-slate-700 text-sm font-bold active:scale-95 transition-transform"
          >
            {language === 'KR' ? '이전 단계' : 'Previous'}
          </button>
        )}
        <button
          type="button"
          onClick={() => {
            if (step < TOTAL_STEPS) {
              goNext();
            } else {
              handleSave();
            }
          }}
          disabled={isSaving || (step === 2 && !title.trim())}
          className="flex-grow py-3.5 rounded-full bg-[#007AFF] text-white text-sm font-bold active:scale-95 transition-transform disabled:opacity-50"
        >
          {step < TOTAL_STEPS
            ? (language === 'KR' ? '다음 단계' : 'Next Step')
            : (isSaving ? (uploadProgress !== null ? `${uploadProgress}%` : (t('common.saving') || "저장 중...")) : (t('common.save') || "저장"))}
        </button>
      </div>
    </motion.div>
  );
};

export default ClassAddEditor;
