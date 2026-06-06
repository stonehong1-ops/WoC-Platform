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
      className="fixed inset-0 z-[110] bg-white flex items-center justify-center font-['Plus_Jakarta_Sans']"
    >
      <main className="max-w-md w-full h-[100dvh] bg-white flex flex-col overflow-hidden relative text-left">
        {/* Header */}
        <div className="flex-shrink-0 bg-white border-b border-slate-100 px-4 h-14 flex items-center justify-between z-50">
          <button type="button" onClick={onClose} className="w-10 h-10 flex items-center justify-center -ml-2 active:scale-95 transition-transform text-slate-700">
            <span className="material-symbols-rounded text-2xl">arrow_back</span>
          </button>
          <h1 className="text-[14px] font-black uppercase tracking-widest text-slate-800">
            {isEditMode ? t("discount.edit_bundle") || "Edit Bundle" : t("discount.add_bundle") || "Discount Editor"}
          </h1>
          <div className="w-10" />
        </div>

        <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="flex-1 flex flex-col overflow-hidden">
          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto px-4 mt-4 space-y-6 pb-6 text-left no-scrollbar">
            {/* Title */}
            <div>
              <label className="block text-xs font-bold text-[#596061] mb-1.5 uppercase tracking-wider">
                {t("discount.class_title") || "Bundle Title"} <span className="text-red-400">*</span>
              </label>
              <input
                required
                id="discount-title"
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                className="w-full bg-[#f8f9fa] border border-[#e0e4e5] rounded-xl px-4 py-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                placeholder={t("discount.title_placeholder") || "e.g. Contemporary Dance 2-Class Bundle"}
                type="text"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold text-[#596061] mb-1.5 uppercase tracking-wider">
                {t("discount.description") || "Description"}
              </label>
              <textarea
                id="discount-desc"
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                className="w-full min-h-[120px] bg-[#f8f9fa] border border-[#e0e4e5] rounded-xl px-4 py-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all resize-none leading-relaxed"
                placeholder={t("discount.desc_placeholder") || "Provide details about this bundle discount..."}
                rows={4}
              />
            </div>

            {/* Cover Image Upload */}
            <div>
              <label className="block text-xs font-bold text-[#596061] mb-1.5 uppercase tracking-wider">
                {t("discount.image_url") || "Cover Image"}
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
                className="w-full h-40 border border-[#e0e4e5] rounded-xl flex flex-col items-center justify-center text-center bg-[#f8f9fa] active:scale-95 transition-transform cursor-pointer relative overflow-hidden"
              >
                {imagePreviewUrl ? (
                  <>
                    <img src={imagePreviewUrl} alt="Thumbnail preview" className="w-full h-full object-cover absolute inset-0" />
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); removeImage(); }}
                      className="absolute top-2 right-2 w-6 h-6 bg-black/60 rounded-full text-white flex items-center justify-center active:scale-95 z-10 animate-fade-in"
                    >
                      <span className="material-symbols-rounded text-[16px]">close</span>
                    </button>
                    {uploadProgress !== null && (
                      <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white z-20">
                        <span className="material-symbols-rounded animate-spin text-2xl mb-1">progress_activity</span>
                        <span className="text-xs font-bold">{uploadProgress}%</span>
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[9px] font-bold text-center py-1 uppercase tracking-wider z-10">
                      {t("class.change_photo") || "Change Photo"}
                    </div>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-rounded text-2xl text-slate-400 mb-1">add_photo_alternate</span>
                    <p className="text-xs font-bold text-[#596061] mb-0.5">{t("class.upload_photo") || "Upload Photo"}</p>
                    <p className="text-[10px] text-slate-400">{t("class.photo_desc") || "Support JPG, PNG, GIF"}</p>
                  </>
                )}
              </div>
            </div>

            {/* Pricing & Discount Details */}
            <div className="bg-[#f8f9fa] rounded-xl p-4 border border-[#e0e4e5] space-y-4">
              <h3 className="text-xs font-bold text-[#596061] uppercase tracking-wider">{t("discount.pricing") || "Pricing"}</h3>
              
              <div className="space-y-4">
                {/* Currency */}
                <div>
                  <label className="block text-[10px] font-bold text-[#596061] mb-1 uppercase tracking-wider">{t("discount.currency") || "Currency"}</label>
                  <div className="relative">
                    <select
                      value={formData.currency}
                      onChange={e => setFormData({ ...formData, currency: e.target.value as any })}
                      className="w-full bg-white border border-[#e0e4e5] rounded-lg px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all appearance-none pr-8"
                    >
                      <option value="KRW">KRW - South Korean Won</option>
                      <option value="USD">USD - US Dollar</option>
                      <option value="EUR">EUR - Euro</option>
                      <option value="JPY">JPY - Japanese Yen</option>
                    </select>
                    <span className="material-symbols-rounded absolute right-3 top-1/2 -translate-y-1/2 text-[#acb3b4] pointer-events-none">expand_more</span>
                  </div>
                </div>

                {/* Amount */}
                <div>
                  <label className="block text-[10px] font-bold text-[#596061] mb-1 uppercase tracking-wider">{t("discount.amount") || "Amount"}</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">
                      {formData.currency === "KRW" ? "₩" : formData.currency === "USD" ? "$" : formData.currency === "EUR" ? "€" : formData.currency === "JPY" ? "¥" : "₩"}
                    </span>
                    <input
                      value={formData.amount ? formData.amount.toLocaleString() : ""}
                      onChange={e => {
                        const val = e.target.value.replace(/[^0-9]/g, "");
                        setFormData({ ...formData, amount: Number(val) });
                      }}
                      className="w-full bg-white border border-[#e0e4e5] rounded-lg pl-8 pr-4 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-right font-bold"
                      placeholder="0"
                      type="text"
                    />
                  </div>
                </div>

                {/* Discount Description */}
                <div>
                  <label className="block text-[10px] font-bold text-[#596061] mb-1 uppercase tracking-wider">{t("discount.discount_description") || "Discount Description"}</label>
                  <input
                    id="discount-details"
                    value={formData.discountDescription}
                    onChange={e => setFormData({ ...formData, discountDescription: e.target.value })}
                    className="w-full bg-white border border-[#e0e4e5] rounded-lg px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                    placeholder={t("discount.discount_placeholder") || "e.g. Save 20% by booking together!"}
                    type="text"
                  />
                </div>
              </div>
            </div>

            {/* Select Classes */}
            <div className="bg-[#f8f9fa] rounded-xl p-4 border border-[#e0e4e5] space-y-4">
              <div>
                <h3 className="text-xs font-bold text-[#596061] uppercase tracking-wider">{t("discount.select_classes") || "Select Classes"}</h3>
                <p className="text-[10px] font-medium text-slate-400 mt-0.5 leading-normal">{t("discount.select_classes_desc") || "Choose existing classes from this month to include in the bundle."}</p>
              </div>

              <div className="space-y-2">
                {classes.length === 0 ? (
                  <p className="text-xs text-center py-4 text-slate-400 font-bold">{t("discount.no_classes") || "No classes available."}</p>
                ) : (
                  classes.map((cls) => {
                    const isSelected = formData.includedClassIds.includes(cls.id);
                    return (
                      <label key={cls.id} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-[#e0e4e5] cursor-pointer hover:border-primary transition-all active:scale-[0.99]">
                        <div className="relative flex items-center justify-center w-5 h-5 shrink-0">
                          <input
                            type="checkbox"
                            className="peer appearance-none w-5 h-5 border border-slate-300 rounded bg-transparent checked:bg-primary checked:border-primary transition-all duration-200 cursor-pointer"
                            checked={isSelected}
                            onChange={() => handleToggleClass(cls.id)}
                          />
                          <span className="material-symbols-rounded absolute text-white opacity-0 peer-checked:opacity-100 pointer-events-none text-xs font-bold transition-opacity duration-200">check</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-slate-800 truncate">{cls.title}</p>
                          <p className="text-[10px] font-semibold text-slate-400 mt-0.5">
                            {cls.schedule && cls.schedule.length > 0 ? (
                              (() => {
                                const baseDate = cls.schedule[0].date;
                                const day = getDayOfWeek(baseDate || '');
                                const daySuffix = language === "KR"
                                  ? `(${DAY_LABELS[day]?.ko || ""})`
                                  : ` (${DAY_LABELS[day]?.en || ""})`;
                                return `${baseDate || ''}${daySuffix} • ${cls.schedule[0].timeSlot}`;
                              })()
                            ) : (
                              t("discount.no_schedule") || "No schedule"
                            )}
                          </p>
                        </div>
                      </label>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Submit Save Floating Bar */}
          <div className="flex-shrink-0 w-full p-4 border-t border-slate-100 bg-white pb-[calc(1rem+env(safe-area-inset-bottom))] z-50">
            <button type="submit" disabled={loading}
              className="w-full bg-primary text-white font-bold py-3.5 rounded-xl shadow-lg shadow-primary/20 active:scale-[0.98] transition-transform disabled:opacity-50 flex items-center justify-center gap-2">
              {loading && <span className="material-symbols-rounded animate-spin text-sm">progress_activity</span>}
              {t("common.save") || "SAVE"}
            </button>
          </div>
        </form>
      </main>
    </motion.div>
  );
};

export default GroupClassDiscountEditor;
