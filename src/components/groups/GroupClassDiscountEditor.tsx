// 번들 할인을 등록하고 수정하기 위한 코어 에디터 컴포넌트
"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { Group, ClassDiscount } from "@/types/group";
import { groupService } from "@/lib/firebase/groupService";
import { storageService } from "@/lib/firebase/storageService";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";

const getDayOfWeek = (dateStr: string): string => {
  if (!dateStr) return '';
  const cleanDate = dateStr.replace(/\./g, '-');
  const d = new Date(cleanDate);
  if (isNaN(d.getTime())) return '';
  return ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'][d.getDay()];
};

const getDayIndex = (day: string) => {
  const DAY_ORDER = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
  const idx = DAY_ORDER.indexOf(day.toUpperCase());
  return idx === -1 ? 99 : idx;
};

const getClassDay = (cls: any): string => {
  if (cls.schedule && cls.schedule.length > 0) {
    const sortedSched = [...cls.schedule].sort((a, b) => a.date.localeCompare(b.date));
    const day = getDayOfWeek(sortedSched[0]?.date);
    return day || 'MON';
  }
  return 'MON';
};

const DAY_LABELS: Record<string, { en: string; ko: string }> = {
  MON: { en: 'Mon', ko: '월' },
  TUE: { en: 'Tue', ko: '화' },
  WED: { en: 'Wed', ko: '수' },
  THU: { en: 'Thu', ko: '목' },
  FRI: { en: 'Fri', ko: '금' },
  SAT: { en: 'Sat', ko: '토' },
  SUN: { en: 'Sun', ko: '일' },
};

interface GroupClassDiscountEditorProps {
  group: Group;
  allClasses?: import('@/types/group').GroupClass[];
  onClose: () => void;
  onSave?: () => void;
  initialData?: ClassDiscount | null;
  targetMonth?: string;
}

const GroupClassDiscountEditor: React.FC<GroupClassDiscountEditorProps> = ({
  group,
  allClasses: allClassesProp,
  onClose,
  onSave,
  initialData,
  targetMonth,
}) => {
  const [loading, setLoading] = useState(false);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string>("");
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  const imageInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<ClassDiscount>({
    id: initialData?.id || uuidv4(),
    title: initialData?.title || "",
    description: initialData?.description || "",
    currency: initialData?.currency || "KRW",
    amount: initialData?.amount || 0,
    discountDescription: initialData?.discountDescription || "",
    includedClassIds: initialData?.includedClassIds || [],
    targetMonth: initialData?.targetMonth || targetMonth || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`,
    imageUrl: initialData?.imageUrl || group.coverImage || group.logo || ""
  });

  const { t, language } = useLanguage();
  const isEditMode = !!initialData;
  const currentMonth = formData.targetMonth;
  const classSource = allClassesProp || group.classes || [];
  
  const classes = useMemo(() => {
    const filtered = classSource.filter(cls => !cls.targetMonth || cls.targetMonth === currentMonth);
    return [...filtered].sort((a, b) => {
      const dayA = getClassDay(a);
      const dayB = getClassDay(b);
      const idxA = getDayIndex(dayA);
      const idxB = getDayIndex(dayB);
      if (idxA !== idxB) {
        return idxA - idxB;
      }
      const timeA = a.schedule?.[0]?.timeSlot?.split('-')?.[0]?.trim() || '';
      const timeB = b.schedule?.[0]?.timeSlot?.split('-')?.[0]?.trim() || '';
      return timeA.localeCompare(timeB);
    });
  }, [classSource, currentMonth]);

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
      setImagePreviewUrl(initialData.imageUrl || group.coverImage || group.logo || "");
    } else {
      setImagePreviewUrl(group.coverImage || group.logo || "");
    }
  }, [initialData, group]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedImageFile(file);
    const url = URL.createObjectURL(file);
    setImagePreviewUrl(url);
    if (imageInputRef.current) imageInputRef.current.value = "";
  };

  const removeImage = () => {
    setSelectedImageFile(null);
    setImagePreviewUrl("");
  };

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
      toast.error(t('discount.enter_title') || "Please enter a bundle title.");
      return;
    }
    if (formData.includedClassIds.length < 2) {
      toast.error(t('discount.select_classes_alert') || "Please select at least 2 classes.");
      return;
    }
    if (formData.amount < 0) {
      toast.error(t('discount.enter_amount') || "Please enter a discount amount.");
      return;
    }

    setLoading(true);
    try {
      let finalImageUrl = imagePreviewUrl;

      if (selectedImageFile) {
        setUploadProgress(0);
        const folder = "images";
        const path = `groups/${group.id}/discounts/${folder}/${uuidv4()}_${selectedImageFile.name}`;
        
        const url = await storageService.uploadFile(selectedImageFile, path, progress => {
          setUploadProgress(progress);
        });
        finalImageUrl = url;
        setUploadProgress(null);
      }

      if (!finalImageUrl) {
        finalImageUrl = group.coverImage || group.logo || "";
      }

      const updatedFormData: ClassDiscount = {
        ...formData,
        imageUrl: finalImageUrl,
      };

      if (initialData) {
        await groupService.updateDiscount(group.id, formData.id, updatedFormData);
      } else {
        await groupService.addDiscount(group.id, updatedFormData);
      }
      
      toast.success(t('pics.admin.save_success') || "Successfully saved.");
      if (onSave) onSave();
      onClose();
    } catch (error) {
      console.error("Failed to save discount:", error);
      toast.error(t('discount.save_failed') || "Failed to save the bundle.");
    } finally {
      setLoading(false);
    }
  };

  if (typeof window === "undefined") return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: "100%" }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: "100%" }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="fixed inset-0 z-[1000] bg-white flex flex-col items-center justify-center font-['Inter',sans-serif] overflow-hidden"
    >
      <main className="w-full max-w-[896px] h-[100dvh] flex flex-col bg-[#f8f9fa] relative text-left pt-[env(safe-area-inset-top,0px)] pb-[env(safe-area-inset-bottom,0px)]">
        {/* Header */}
        <div className="flex-shrink-0 bg-white border-b border-[#e0e4e5] px-4 h-14 flex items-center justify-between z-50 sticky top-0 shadow-sm">
          <button type="button" onClick={onClose} className="w-10 h-10 flex items-center justify-center -ml-2 active:scale-95 transition-transform text-slate-700">
            <span className="material-symbols-rounded text-2xl">arrow_back</span>
          </button>
          <h1 className="text-base font-bold text-slate-800">
            {isEditMode ? "번들 수정" : "번들 등록"}
          </h1>
          <div className="w-10" />
        </div>

        <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="flex-1 flex flex-col overflow-hidden">
          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto px-4 py-6 space-y-5 text-left no-scrollbar">
            
            {/* 기본 정보 섹션 카드 */}
            <div className="bg-white border border-[#e0e4e5] rounded-2xl p-4 shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-[#007AFF] uppercase tracking-wider flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px]">info</span>
                <span>번들 기본 정보</span>
              </h3>

              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  번들 제목 <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  id="discount-title"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-[#f8f9fa] border border-[#e0e4e5] rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#007AFF]/20 outline-none transition-all placeholder:font-normal placeholder:text-[#acb3b4]"
                  placeholder="예: 현대무용 2개 클래스 묶음 패키지"
                  type="text"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  번들 안내 및 설명
                </label>
                <textarea
                  id="discount-desc"
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full min-h-[100px] bg-[#f8f9fa] border border-[#e0e4e5] rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#007AFF]/20 outline-none transition-all resize-none leading-relaxed placeholder:font-normal placeholder:text-[#acb3b4]"
                  placeholder="패키지 구성 및 수강 혜택에 대해 작성해주세요..."
                  rows={3}
                />
              </div>

              {/* Cover Image Upload */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  대표 커버 이미지
                </label>
                <input
                  type="file"
                  ref={imageInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageSelect}
                />
                <div
                  onClick={() => imageInputRef.current?.click()}
                  className="w-full h-36 border border-[#e0e4e5] rounded-xl flex flex-col items-center justify-center text-center bg-[#f8f9fa] active:scale-95 transition-transform cursor-pointer relative overflow-hidden"
                >
                  {imagePreviewUrl ? (
                    <>
                      <img src={imagePreviewUrl} alt="Thumbnail preview" className="w-full h-full object-cover absolute inset-0" />
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); removeImage(); }}
                        className="absolute top-2 right-2 w-7 h-7 bg-black/60 rounded-full text-white flex items-center justify-center active:scale-95 z-10"
                      >
                        <span className="material-symbols-rounded text-[18px]">close</span>
                      </button>
                      {uploadProgress !== null && (
                        <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white z-20">
                          <span className="material-symbols-rounded animate-spin text-2xl mb-1">progress_activity</span>
                          <span className="text-xs font-bold">{uploadProgress}%</span>
                        </div>
                      )}
                      <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] font-bold text-center py-1.5 uppercase tracking-wider z-10">
                        사진 변경하기
                      </div>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-rounded text-3xl text-slate-400 mb-1">add_photo_alternate</span>
                      <p className="text-xs font-bold text-slate-700 mb-0.5">이미지 업로드</p>
                      <p className="text-[11px] text-slate-400">JPG, PNG, GIF 파일 지원</p>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* 가격 설정 섹션 카드 */}
            <div className="bg-white border border-[#e0e4e5] rounded-2xl p-4 shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-[#007AFF] uppercase tracking-wider flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px]">sell</span>
                <span>패키지 요금 설정</span>
              </h3>
              
              <div className="grid grid-cols-2 gap-3">
                {/* Currency */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">통화 단위</label>
                  <div className="relative">
                    <select
                      value={formData.currency}
                      onChange={e => setFormData({ ...formData, currency: e.target.value as any })}
                      className="w-full bg-[#f8f9fa] border border-[#e0e4e5] rounded-xl px-3 py-2.5 text-sm font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#007AFF]/20 outline-none transition-all cursor-pointer"
                      style={{ WebkitAppearance: 'none', appearance: 'none' }}
                    >
                      <option value="KRW">KRW (₩)</option>
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="JPY">JPY (¥)</option>
                    </select>
                  </div>
                </div>

                {/* Amount */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">할인 패키지 가격 <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <input
                      value={formData.amount ? formData.amount.toLocaleString() : ""}
                      onChange={e => {
                        const val = e.target.value.replace(/[^0-9]/g, "");
                        setFormData({ ...formData, amount: Number(val) });
                      }}
                      className="w-full bg-[#f8f9fa] border border-[#e0e4e5] rounded-xl px-4 py-2.5 text-sm font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#007AFF]/20 outline-none transition-all text-right"
                      placeholder="0"
                      type="text"
                    />
                  </div>
                </div>
              </div>

              {/* Discount Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">할인 혜택 문구</label>
                <input
                  id="discount-details"
                  value={formData.discountDescription}
                  onChange={e => setFormData({ ...formData, discountDescription: e.target.value })}
                  className="w-full bg-[#f8f9fa] border border-[#e0e4e5] rounded-xl px-4 py-2.5 text-sm font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#007AFF]/20 outline-none transition-all placeholder:font-normal placeholder:text-[#acb3b4]"
                  placeholder="예: 2개 클래스 동시 수강 시 20% 특별 할인!"
                  type="text"
                />
              </div>
            </div>

            {/* 포함할 클래스 선택 섹션 카드 */}
            <div className="bg-white border border-[#e0e4e5] rounded-2xl p-4 shadow-sm space-y-3">
              <div>
                <h3 className="text-xs font-bold text-[#007AFF] uppercase tracking-wider flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px]">checklist</span>
                  <span>번들에 포함할 정규 클래스 선택</span>
                </h3>
                <p className="text-xs font-medium text-slate-500 mt-1">번들 패키지로 묶어서 함께 제공할 수업들을 2개 이상 선택해 주세요.</p>
              </div>

              <div className="space-y-2.5 pt-1">
                {classes.length === 0 ? (
                  <p className="text-xs text-center py-6 text-slate-400 font-bold">이번 달 등록된 정규 클래스가 없습니다.</p>
                ) : (
                  classes.map((cls) => {
                    const isSelected = formData.includedClassIds.includes(cls.id);
                    const day = getClassDay(cls);
                    const dayNameKr = DAY_LABELS[day]?.ko ? `${DAY_LABELS[day].ko}요일` : day;
                    const timeSlot = cls.schedule?.[0]?.timeSlot || "시간 미정";

                    return (
                      <label key={cls.id} className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all cursor-pointer select-none ${
                        isSelected ? 'bg-[#007AFF]/5 border-[#007AFF]' : 'bg-[#f8f9fa] border-[#e0e4e5] hover:border-slate-300'
                      }`}>
                        <div className="relative flex items-center justify-center w-5 h-5 shrink-0 mt-0.5">
                          <input
                            type="checkbox"
                            className="peer appearance-none w-5 h-5 border border-slate-300 rounded bg-white checked:bg-[#007AFF] checked:border-[#007AFF] transition-all duration-200 cursor-pointer"
                            checked={isSelected}
                            onChange={() => handleToggleClass(cls.id)}
                          />
                          <span className="material-symbols-rounded absolute text-white opacity-0 peer-checked:opacity-100 pointer-events-none text-xs font-bold transition-opacity duration-200">check</span>
                        </div>
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-bold text-[#007AFF] bg-white border border-[#007AFF]/20 px-2 py-0.5 rounded-full shadow-2xs">
                              🗓️ {dayNameKr} ({day})
                            </span>
                            <span className="text-[11px] font-semibold text-slate-600">
                              ⏰ {timeSlot}
                            </span>
                          </div>
                          <p className="text-sm font-bold text-slate-800">{cls.title}</p>
                        </div>
                      </label>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Submit Save Floating Bar (Safe Area 침범 예방) */}
          <div className="flex-shrink-0 w-full p-4 border-t border-[#e0e4e5] bg-white z-50 shadow-lg">
            <button type="submit" disabled={loading}
              className="w-full bg-[#007AFF] hover:bg-[#0066CC] text-white text-sm font-bold py-3.5 rounded-xl shadow-md active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2">
              {loading && <span className="material-symbols-rounded animate-spin text-sm">progress_activity</span>}
              <span>{isEditMode ? "번들 패키지 수정 저장" : "번들 패키지 신규 저장"}</span>
            </button>
          </div>
        </form>
      </main>
    </motion.div>
  );
};

export default GroupClassDiscountEditor;
