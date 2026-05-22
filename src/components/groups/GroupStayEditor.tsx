"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Script from "next/script";
import "@/styles/groupstayeditor.css";
import { stayService } from "@/lib/firebase/stayService";
import { storageService } from "@/lib/firebase/storageService";
import { Stay, StayType } from "@/types/stay";
import { useAuth } from "@/components/providers/AuthProvider";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";

interface GroupStayEditorProps {
  group?: any;
  onClose?: () => void;
  isInline?: boolean;
}

export default function GroupStayEditor({ group, onClose, isInline }: GroupStayEditorProps) {
  const { user } = useAuth();
  const { t } = useLanguage();

  // -- Loading / Saving State --
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [existingStayId, setExistingStayId] = useState<string | null>(null);

  // -- Original Data (for Discard) --
  const [originalData, setOriginalData] = useState<Stay | null>(null);

  // ── BASIC INFO ──
  const [title, setTitle] = useState("Tango Stay Hapjeong");
  const [nativeTitle, setNativeTitle] = useState("");
  const [headline, setHeadline] = useState("");

  // ── LOCATION ──
  const [address, setAddress] = useState("396-12 Hapjeong-dong, Mapo-gu, Seoul, South Korea");
  const [mapImageUrl, setMapImageUrl] = useState("https://lh3.googleusercontent.com/aida-public/AB6AXuCdAjkNACL3KXM11kkFkdmEkvvxjwOR4P6c3HpxJqtm7CvcSBsptBrWAzvgwVRZLaC5h1EoGypAI_Y0Vzg67ChKPVKs7TrI2tAI5uuGYMidaj7WnfECGQT8sjIqB1bqf9rhw91iS61-he3O_skihdUC53y2MHNoAN952CK6v0PBrZmpatOdKhmk2h5E4P8y7-wM81_a1lHXe7E_WP96jpjRz9H5762Asiau3cV30q4IxWGKlkAk8bQ90MOA3-cgCLo6BNmTtwW_T84");

  // ── MEDIA ──
  const [displayImageUrls, setDisplayImageUrls] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState<Record<number, number>>({});
  const [optimizingSlots, setOptimizingSlots] = useState<Record<number, boolean>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── RATES ──
  const [currency, setCurrency] = useState("KRW");
  const [baseRate, setBaseRate] = useState("120,000");
  const [weekendSurcharge, setWeekendSurcharge] = useState("45,000");
  const [extraPersonFee, setExtraPersonFee] = useState("20,000");
  const [cleaningFee, setCleaningFee] = useState("35,000");

  // ── GUIDES ──
  const [roomFeatures, setRoomFeatures] = useState("Urban city view through floor-to-ceiling windows. Minimalist interior design with custom-made furniture. High-speed Wi-Fi and dedicated workspace included.");
  const [gettingHere, setGettingHere] = useState("5-minute walk from Hapjeong Station (Line 2 & 6), Exit 7. Turn left at the first corner and walk straight for 200m.");
  const [facilityGuide, setFacilityGuide] = useState("Self check-in via smart lock (code sent on check-in day). Quiet hours from 10 PM. Shared rooftop garden available on 12F.");

  // ── HOST ──
  const [hostName, setHostName] = useState("Me");
  const [hostPhoto, setHostPhoto] = useState("");
  const [isEditingHost, setIsEditingHost] = useState(false);

  // -- Number Formatting Utilities --
  const formatNumber = (num: number | undefined): string => {
    if (num === undefined || num === null) return "";
    return num.toLocaleString();
  };

  const parseFormattedNumber = (str: string): number => {
    return parseInt(str.replace(/,/g, "")) || 0;
  };

  // -- Populate Data from Firestore --
  const populateFromStay = useCallback((stay: Stay) => {
    setExistingStayId(stay.id);
    setOriginalData(stay);

    // Basic Info
    setTitle(stay.title || "");
    setNativeTitle(stay.nativeTitle || "");
    setHeadline(stay.headline || "");

    // Location
    setAddress(stay.location?.address || "");
    setMapImageUrl(stay.location?.mapImageUrl || "");

    // Media
    setDisplayImageUrls(stay.images || []);

    // Rates
    setCurrency(stay.pricing?.currency || "KRW");
    setBaseRate(formatNumber(stay.pricing?.baseRate));
    setWeekendSurcharge(formatNumber(stay.pricing?.weekendSurcharge));
    setExtraPersonFee(formatNumber(stay.pricing?.extraPersonFee));
    setCleaningFee(formatNumber(stay.pricing?.cleaningFee));

    // Guides
    setRoomFeatures(stay.guides?.roomFeatures || "");
    setGettingHere(stay.guides?.gettingHere || "");
    setFacilityGuide(stay.guides?.facilityGuide || "");

    // Host
    setHostName(stay.host?.name || "Me");
    setHostPhoto(stay.host?.photo || "");
  }, []);

  // -- Real-time Firestore Subscription --
  useEffect(() => {
    if (!group?.id) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const unsubscribe = stayService.subscribeGroupStay(group.id, (stay) => {
      if (stay) {
        populateFromStay(stay);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [group?.id, populateFromStay]);

  // -- Auto-hide Status Message --
  useEffect(() => {
    if (saveMessage) {
      const timer = setTimeout(() => setSaveMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [saveMessage]);

  // -- Save Handler --
  const handleSave = async () => {
    if (isSaving) return;
    setIsSaving(true);
    setSaveMessage(null);

    try {
      const updates: Partial<Stay> = {
        title,
        nativeTitle,
        headline,
        location: {
          address,
          city: originalData?.location?.city || "Seoul",
          district: originalData?.location?.district || "",
          mapImageUrl: mapImageUrl || undefined,
        },
        images: displayImageUrls,
        pricing: {
          currency,
          baseRate: parseFormattedNumber(baseRate),
          weekendSurcharge: parseFormattedNumber(weekendSurcharge),
          extraPersonFee: parseFormattedNumber(extraPersonFee),
          cleaningFee: parseFormattedNumber(cleaningFee),
        },
        guides: {
          roomFeatures,
          gettingHere,
          facilityGuide,
        },
        host: {
          ...(originalData?.host || {}),
          userId: originalData?.host?.userId || user?.uid || "",
          name: hostName,
          photo: hostPhoto,
        } as any,
      };

      if (existingStayId) {
        // Update existing Stay
        await stayService.updateStay(existingStayId, updates);
      } else {
        // Register new Stay
        const newStayId = await stayService.registerStay({
          ...updates,
          groupId: group?.id || "",
          type: "1-Room" as StayType,
          checkInTime: "15:00",
          checkOutTime: "11:00",
          maxGuests: 2,
          doorCode: "9999",
          payment: {
            methods: [
              { type: "bank_domestic", enabled: false },
              { type: "bank_international", enabled: false },
              { type: "card", enabled: false },
            ],
            transferDeadlineHours: 2,
          },
          host: {
            userId: user?.uid || "",
            name: hostName || user?.displayName || "Host",
            photo: hostPhoto || user?.photoURL || "",
          },
          isActive: false,
          isNewlyListed: true,
        } as any);
        setExistingStayId(newStayId);
      }

      setSaveMessage({ type: "success", text: "Changes saved successfully!" });
      toast.success("Changes saved successfully!");
    } catch (error) {
      console.error("Error saving stay:", error);
      setSaveMessage({ type: "error", text: "Failed to save. Please try again." });
      toast.error("Failed to save. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const isUploadingImages = Object.keys(uploadProgress).length > 0 || Object.values(optimizingSlots).some(v => v);

  // -- Discard Handler --
  const handleDiscard = () => {
    if (originalData) {
      populateFromStay(originalData);
      setSaveMessage({ type: "success", text: "Changes discarded." });
    }
  };

  // -- Image Upload Handler --
  const handleImageUpload = async (file: File, index: number) => {
    const blobUrl = URL.createObjectURL(file);
    
    // Optimistic UI Update
    setDisplayImageUrls(prev => {
      const next = [...prev];
      next[index] = blobUrl;
      return next;
    });
    
    setOptimizingSlots(prev => ({ ...prev, [index]: true }));

    try {
      const path = `stays/${group?.id}/${Date.now()}_${index}`;
      const url = await storageService.uploadFile(file, path, (progress) => {
        setUploadProgress(prev => ({ ...prev, [index]: progress }));
        if (progress > 0) {
          setOptimizingSlots(prev => ({ ...prev, [index]: false }));
        }
      });

      setDisplayImageUrls(prev => {
        const next = [...prev];
        next[index] = url;
        return next;
      });
      
      URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(`Failed to upload ${file.name}`);
      // Remove preview on failure
      setDisplayImageUrls(prev => prev.filter((_, i) => i !== index));
      URL.revokeObjectURL(blobUrl);
    } finally {
      setUploadProgress(prev => {
        const next = { ...prev };
        delete next[index];
        return next;
      });
      setOptimizingSlots(prev => ({ ...prev, [index]: false }));
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const selectedFiles = Array.from(files);
    const totalNewImages = displayImageUrls.length + selectedFiles.length;
    if (totalNewImages > 20) {
      toast.error("You can upload up to 20 images.");
      return;
    }

    // Start individual uploads
    for (let i = 0; i < selectedFiles.length; i++) {
      const targetIdx = displayImageUrls.length + i;
      await handleImageUpload(selectedFiles[i], targetIdx);
    }

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // -- Image Delete Handler --
  const handleImageDelete = (index: number) => {
    const urlToRemove = displayImageUrls[index];
    if (urlToRemove.startsWith('blob:')) {
      URL.revokeObjectURL(urlToRemove);
    }
    setDisplayImageUrls((prev) => prev.filter((_, i) => i !== index));
  };

  // -- Loading State --
  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className={isInline
          ? "w-full light font-body-md text-on-background antialiased bg-[#F3F4F6] flex flex-col"
          : "fixed inset-0 z-[100] light font-body-md text-on-background antialiased bg-[#F3F4F6] flex flex-col overflow-y-auto no-scrollbar"
        }
      >
        {/* Top Bar */}
        {!isInline && (
          <header className="sticky top-0 z-50 bg-[#F3F4F6]/80 backdrop-blur-xl border-b border-gray-200">
            <div className="max-w-[896px] mx-auto px-6 md:px-12 py-4 flex items-center justify-between w-full">
              <div className="flex items-center gap-4">
                <button 
                  onClick={onClose}
                  className="w-10 h-10 rounded-full flex items-center justify-center text-primary hover:bg-primary/5 transition-all"
                >
                  <span className="material-symbols-outlined text-primary">arrow_back</span>
                </button>
                <h1 className="text-base font-bold text-on-surface">Stay Editor</h1>
              </div>
            </div>
          </header>
        )}

        <main className="flex-1">
          <div className="max-w-[896px] mx-auto flex items-center justify-center py-32">
            <div className="flex flex-col items-center gap-4">
              <div className="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
              <span className="font-body-md text-on-surface-variant">Loading stay data...</span>
            </div>
          </div>
        </main>
      </motion.div>
    );
  }

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />

      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        multiple
        onChange={handleFileChange}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className={isInline
          ? "w-full light font-body-md text-on-surface antialiased bg-background flex flex-col no-scrollbar"
          : "fixed inset-0 z-[100] light font-body-md text-on-surface antialiased bg-background flex flex-col overflow-y-auto no-scrollbar pb-20"
        }
      >
        {/* Top Bar */}
        {!isInline && (
          <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-outline/5">
            <div className="max-w-[896px] mx-auto px-4 py-4 flex items-center justify-between w-full">
              <div className="flex items-center gap-4">
                <button 
                  onClick={onClose}
                  className="w-10 h-10 rounded-full flex items-center justify-center text-primary hover:bg-primary/5 transition-all"
                >
                  <span className="material-symbols-outlined text-primary">arrow_back</span>
                </button>
                <h1 className="text-base font-bold text-on-surface" style={{ fontFamily: "'Inter', sans-serif" }}>{t("group.stay.title")}</h1>
              </div>
            </div>
          </header>
        )}

        <main className="flex-1">
          <div className={`max-w-[896px] mx-auto space-y-6 ${isInline ? 'pb-24' : 'pb-48 md:pb-32'}`}>
            
            {/* Section Header */}
            <div className="px-4 pt-4 pb-6">
              <div className="mb-2">
                <h2 className="text-[24px] leading-[1.3] font-semibold text-on-surface" style={{ fontFamily: "'Inter', sans-serif" }}>
                  {t("group.stay.title")}
                </h2>
                <p className="text-[14px] leading-[1.4] tracking-[0.01em] font-medium text-on-surface-variant mt-1" style={{ fontFamily: "'Inter', sans-serif" }}>
                  {t("group.stay.subtitle")}
                </p>
              </div>
            </div>

            {/* 1. BASIC INFO */}
            <section className="px-4 mb-6">
              <div className="bg-white rounded-2xl shadow-[0px_10px_30px_rgba(0,0,0,0.03)] border border-white/20 overflow-hidden">
                <div className="px-6 pt-6 pb-4 border-b border-outline/5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-primary text-[20px]">info</span>
                    </div>
                    <div>
                      <h3 className="text-[16px] leading-[1.6] font-semibold text-on-surface" style={{ fontFamily: "'Inter', sans-serif" }}>{t("group.stay.basic_info")}</h3>
                      <p className="text-[12px] leading-[1.2] font-medium text-on-surface-variant" style={{ fontFamily: "'Inter', sans-serif" }}>{t("group.stay.basic_info_desc")}</p>
                    </div>
                  </div>
                </div>

                <div className="p-6 space-y-5">
                  <div className="space-y-2">
                    <label className="text-[12px] leading-[1.2] font-semibold text-on-surface-variant uppercase tracking-wider" style={{ fontFamily: "'Inter', sans-serif" }}>{t("group.stay.stay_name_en")}</label>
                    <input 
                      className="w-full bg-surface-container-low border border-outline/10 focus:ring-2 focus:ring-primary/30 focus:border-primary rounded-xl px-4 py-3.5 text-on-surface text-[16px] font-medium placeholder:text-on-surface-variant/30" 
                      type="text" 
                      value={title} 
                      onChange={(e) => setTitle(e.target.value)} 
                      style={{ fontFamily: "'Inter', sans-serif" }}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[12px] leading-[1.2] font-semibold text-on-surface-variant uppercase tracking-wider" style={{ fontFamily: "'Inter', sans-serif" }}>{t("group.stay.native_title")}</label>
                    <input 
                      className="w-full bg-surface-container-low border border-outline/10 focus:ring-2 focus:ring-primary/30 focus:border-primary rounded-xl px-4 py-3.5 text-on-surface text-[16px] font-medium placeholder:text-on-surface-variant/30" 
                      type="text" 
                      value={nativeTitle} 
                      onChange={(e) => setNativeTitle(e.target.value)} 
                      placeholder={t('group.stay.native_title', 'Enter native title')} 
                      style={{ fontFamily: "'Inter', sans-serif" }}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[12px] leading-[1.2] font-semibold text-on-surface-variant uppercase tracking-wider" style={{ fontFamily: "'Inter', sans-serif" }}>{t("group.stay.short_headline")}</label>
                    <input 
                      className="w-full bg-surface-container-low border border-outline/10 focus:ring-2 focus:ring-primary/30 focus:border-primary rounded-xl px-4 py-3.5 text-on-surface text-[16px] font-medium placeholder:text-on-surface-variant/30" 
                      placeholder={t("group.stay.short_headline_placeholder")} 
                      type="text" 
                      value={headline} 
                      onChange={(e) => setHeadline(e.target.value)} 
                      style={{ fontFamily: "'Inter', sans-serif" }}
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* 3. MEDIA */}
            <section className="px-4 mb-6">
              <div className="bg-white rounded-2xl shadow-[0px_10px_30px_rgba(0,0,0,0.03)] border border-white/20 overflow-hidden">
                <div className="px-6 pt-6 pb-4 border-b border-outline/5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-secondary text-[20px]">photo_library</span>
                      </div>
                      <div>
                        <h3 className="text-[16px] leading-[1.6] font-semibold text-on-surface" style={{ fontFamily: "'Inter', sans-serif" }}>{t("group.stay.media")}</h3>
                        <p className="text-[12px] leading-[1.2] font-medium text-on-surface-variant" style={{ fontFamily: "'Inter', sans-serif" }}>{t("group.stay.media_desc")}</p>
                      </div>
                    </div>
                    <span className="text-[12px] font-semibold text-on-surface-variant bg-surface-container-low px-3 py-1.5 rounded-full" style={{ fontFamily: "'Inter', sans-serif" }}>
                      {t("group.stay.uploaded_count", { count: displayImageUrls.length })}
                    </span>
                  </div>
                </div>

                <div className="p-6 space-y-5">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {displayImageUrls.map((imgUrl, index) => {
                      const progress = uploadProgress[index];
                      const isOptimizing = optimizingSlots[index];
                      const isUploadingImg = progress !== undefined;

                      return (
                        <div key={index} className="aspect-square relative rounded-xl overflow-hidden group border border-outline/5">
                          <img alt="Interior" className="w-full h-full object-cover" src={imgUrl} />
                          
                          {/* Upload Progress Overlay */}
                          {(isUploadingImg || isOptimizing) && (
                            <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center p-2 text-center backdrop-blur-[1px]">
                              {isOptimizing ? (
                                <div className="flex flex-col items-center gap-2">
                                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                  <span className="text-[10px] text-white font-bold uppercase tracking-tighter">Optimizing...</span>
                                </div>
                              ) : (
                                <div className="relative w-12 h-12">
                                  <svg className="w-full h-full transform -rotate-90">
                                    <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-white/20" />
                                    <circle 
                                      cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="4" fill="transparent" 
                                      strokeDasharray={125.6} 
                                      strokeDashoffset={125.6 * (1 - (progress || 0) / 100)} 
                                      className="text-white transition-all duration-300" 
                                    />
                                  </svg>
                                  <span className="absolute inset-0 flex items-center justify-center text-[10px] text-white font-bold">
                                    {Math.round(progress || 0)}%
                                  </span>
                                </div>
                              )}
                            </div>
                          )}

                          {!isUploadingImg && !isOptimizing && (
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 rounded-xl">
                              <button onClick={() => handleImageDelete(index)} className="w-8 h-8 rounded-full bg-error text-white flex items-center justify-center"><span className="material-symbols-outlined text-[16px]">delete</span></button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {displayImageUrls.length < 20 && (
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="aspect-square relative rounded-xl border-2 border-dashed border-outline/15 bg-surface-container-low hover:border-primary/30 flex flex-col items-center justify-center gap-1 transition-all cursor-pointer group"
                      >
                        <span className="material-symbols-outlined text-on-surface-variant/30 text-[24px]" data-icon="add_a_photo">add_a_photo</span>
                        <span className="text-[10px] text-on-surface-variant/40 font-medium" style={{ fontFamily: "'Inter', sans-serif" }}>{t("group.stay.add_photos")}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* 4. RATES */}
            <section className="px-4 mb-6">
              <div className="bg-white rounded-2xl shadow-[0px_10px_30px_rgba(0,0,0,0.03)] border border-white/20 overflow-hidden">
                <div className="px-6 pt-6 pb-4 border-b border-outline/5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-tertiary/10 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-tertiary text-[20px]">payments</span>
                      </div>
                      <div>
                        <h3 className="text-[16px] leading-[1.6] font-semibold text-on-surface" style={{ fontFamily: "'Inter', sans-serif" }}>{t("group.stay.rates")}</h3>
                        <p className="text-[12px] leading-[1.2] font-medium text-on-surface-variant" style={{ fontFamily: "'Inter', sans-serif" }}>{t("group.stay.rates_desc")}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-[12px] font-semibold text-on-surface-variant uppercase tracking-wider" style={{ fontFamily: "'Inter', sans-serif" }}>{t("group.stay.currency")}</label>
                      <select 
                        className="bg-surface-container-low border border-outline/10 rounded-xl text-[14px] font-medium text-on-surface py-1.5 pl-3 pr-8 focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all" 
                        value={currency} 
                        onChange={(e) => setCurrency(e.target.value)}
                        style={{ fontFamily: "'Inter', sans-serif" }}
                      >
                        <option value="KRW">KRW (₩)</option>
                        <option value="USD">USD ($)</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="p-6 space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[12px] leading-[1.2] font-semibold text-on-surface-variant uppercase tracking-wider" style={{ fontFamily: "'Inter', sans-serif" }}>{t("group.stay.weekday_base_rate")}</label>
                      <input 
                        className="w-full bg-surface-container-low border border-outline/10 focus:ring-2 focus:ring-primary/30 focus:border-primary rounded-xl px-4 py-3.5 text-on-surface text-[16px] font-medium placeholder:text-on-surface-variant/30" 
                        type="text" 
                        value={baseRate} 
                        onChange={(e) => setBaseRate(e.target.value)} 
                        style={{ fontFamily: "'Inter', sans-serif" }}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[12px] leading-[1.2] font-semibold text-on-surface-variant uppercase tracking-wider" style={{ fontFamily: "'Inter', sans-serif" }}>{t("group.stay.weekend_surcharge")}</label>
                      <input 
                        className="w-full bg-surface-container-low border border-outline/10 focus:ring-2 focus:ring-primary/30 focus:border-primary rounded-xl px-4 py-3.5 text-on-surface text-[16px] font-medium placeholder:text-on-surface-variant/30" 
                        type="text" 
                        value={weekendSurcharge} 
                        onChange={(e) => setWeekendSurcharge(e.target.value)} 
                        style={{ fontFamily: "'Inter', sans-serif" }}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[12px] leading-[1.2] font-semibold text-on-surface-variant uppercase tracking-wider" style={{ fontFamily: "'Inter', sans-serif" }}>{t("group.stay.extra_person_fee")}</label>
                      <input 
                        className="w-full bg-surface-container-low border border-outline/10 focus:ring-2 focus:ring-primary/30 focus:border-primary rounded-xl px-4 py-3.5 text-on-surface text-[16px] font-medium placeholder:text-on-surface-variant/30" 
                        type="text" 
                        value={extraPersonFee} 
                        onChange={(e) => setExtraPersonFee(e.target.value)} 
                        style={{ fontFamily: "'Inter', sans-serif" }}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[12px] leading-[1.2] font-semibold text-on-surface-variant uppercase tracking-wider" style={{ fontFamily: "'Inter', sans-serif" }}>{t("group.stay.cleaning_fee")}</label>
                      <input 
                        className="w-full bg-surface-container-low border border-outline/10 focus:ring-2 focus:ring-primary/30 focus:border-primary rounded-xl px-4 py-3.5 text-on-surface text-[16px] font-medium placeholder:text-on-surface-variant/30" 
                        type="text" 
                        value={cleaningFee} 
                        onChange={(e) => setCleaningFee(e.target.value)} 
                        style={{ fontFamily: "'Inter', sans-serif" }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* 5. GUIDES */}
            <section className="px-4 mb-6">
              <div className="bg-white rounded-2xl shadow-[0px_10px_30px_rgba(0,0,0,0.03)] border border-white/20 overflow-hidden">
                <div className="px-6 pt-6 pb-4 border-b border-outline/5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-blue-500 text-[20px]">menu_book</span>
                    </div>
                    <div>
                      <h3 className="text-[16px] leading-[1.6] font-semibold text-on-surface" style={{ fontFamily: "'Inter', sans-serif" }}>{t("group.stay.guides")}</h3>
                      <p className="text-[12px] leading-[1.2] font-medium text-on-surface-variant" style={{ fontFamily: "'Inter', sans-serif" }}>{t("group.stay.guides_desc")}</p>
                    </div>
                  </div>
                </div>

                <div className="p-6 space-y-5">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[12px] leading-[1.2] font-semibold text-on-surface-variant uppercase tracking-wider" style={{ fontFamily: "'Inter', sans-serif" }}>{t("group.stay.room_features")}</label>
                      <textarea 
                        className="w-full bg-surface-container-low border border-outline/10 focus:ring-2 focus:ring-primary/30 focus:border-primary rounded-xl px-4 py-3.5 text-on-surface text-[14px] leading-relaxed font-normal placeholder:text-on-surface-variant/30 resize-none min-h-[100px]" 
                        rows={3} 
                        value={roomFeatures} 
                        onChange={(e) => setRoomFeatures(e.target.value)} 
                        style={{ fontFamily: "'Inter', sans-serif" }}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[12px] leading-[1.2] font-semibold text-on-surface-variant uppercase tracking-wider" style={{ fontFamily: "'Inter', sans-serif" }}>{t("group.stay.getting_here")}</label>
                      <textarea 
                        className="w-full bg-surface-container-low border border-outline/10 focus:ring-2 focus:ring-primary/30 focus:border-primary rounded-xl px-4 py-3.5 text-on-surface text-[14px] leading-relaxed font-normal placeholder:text-on-surface-variant/30 resize-none min-h-[100px]" 
                        rows={3} 
                        value={gettingHere} 
                        onChange={(e) => setGettingHere(e.target.value)} 
                        style={{ fontFamily: "'Inter', sans-serif" }}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[12px] leading-[1.2] font-semibold text-on-surface-variant uppercase tracking-wider" style={{ fontFamily: "'Inter', sans-serif" }}>{t("group.stay.facility_guide")}</label>
                      <textarea 
                        className="w-full bg-surface-container-low border border-outline/10 focus:ring-2 focus:ring-primary/30 focus:border-primary rounded-xl px-4 py-3.5 text-on-surface text-[14px] leading-relaxed font-normal placeholder:text-on-surface-variant/30 resize-none min-h-[100px]" 
                        rows={3} 
                        value={facilityGuide} 
                        onChange={(e) => setFacilityGuide(e.target.value)} 
                        style={{ fontFamily: "'Inter', sans-serif" }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* 6. HOST SETTINGS */}
            <section className="px-4 mb-6">
              <div className="bg-white rounded-2xl shadow-[0px_10px_30px_rgba(0,0,0,0.03)] border border-white/20 overflow-hidden">
                <div className="px-6 pt-6 pb-4 border-b border-outline/5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-error/10 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-error text-[20px]">person</span>
                    </div>
                    <div>
                      <h3 className="text-[16px] leading-[1.6] font-semibold text-on-surface" style={{ fontFamily: "'Inter', sans-serif" }}>{t("group.stay.host_settings")}</h3>
                      <p className="text-[12px] leading-[1.2] font-medium text-on-surface-variant" style={{ fontFamily: "'Inter', sans-serif" }}>{t("group.stay.host_settings_desc")}</p>
                    </div>
                  </div>
                </div>

                <div className="p-6 space-y-5">
                  <div className="space-y-2">
                    <label className="text-[12px] leading-[1.2] font-semibold text-on-surface-variant uppercase tracking-wider" style={{ fontFamily: "'Inter', sans-serif" }}>{t("group.stay.primary_host")}</label>
                    {isEditingHost ? (
                      <div className="p-4 bg-surface-container-low rounded-xl space-y-4">
                        <div className="space-y-2">
                          <label className="text-[12px] font-semibold text-on-surface-variant uppercase tracking-wider" style={{ fontFamily: "'Inter', sans-serif" }}>{t("group.stay.host_name")}</label>
                          <input 
                            className="w-full bg-white border border-outline/10 rounded-xl px-4 py-3 text-on-surface text-[14px] font-medium" 
                            type="text" 
                            value={hostName} 
                            onChange={(e) => setHostName(e.target.value)} 
                            style={{ fontFamily: "'Inter', sans-serif" }}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[12px] font-semibold text-on-surface-variant uppercase tracking-wider" style={{ fontFamily: "'Inter', sans-serif" }}>{t("group.stay.host_photo")}</label>
                          <input 
                            className="w-full bg-white border border-outline/10 rounded-xl px-4 py-3 text-on-surface text-[14px] font-medium" 
                            type="text" 
                            value={hostPhoto} 
                            onChange={(e) => setHostPhoto(e.target.value)} 
                            placeholder="https://..." 
                            style={{ fontFamily: "'Inter', sans-serif" }}
                          />
                        </div>
                        <div className="flex justify-end pt-2">
                          <button 
                            onClick={() => setIsEditingHost(false)} 
                            className="px-6 py-2.5 bg-primary text-on-primary rounded-xl font-semibold hover:opacity-90 active:scale-95 transition-all text-[14px]"
                            style={{ fontFamily: "'Inter', sans-serif" }}
                          >
                            Done
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between p-4 bg-surface-container-low rounded-xl">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary overflow-hidden">
                            {hostPhoto || originalData?.host?.photo ? (
                              <img src={hostPhoto || originalData?.host?.photo || ""} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <span className="material-symbols-outlined">account_circle</span>
                            )}
                          </div>
                          <div>
                            <p className="font-body-md text-on-surface font-semibold" style={{ fontFamily: "'Inter', sans-serif" }}>{hostName}</p>
                            <p className="text-[12px] text-on-surface-variant font-medium" style={{ fontFamily: "'Inter', sans-serif" }}>{t("group.stay.default_host")}</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => setIsEditingHost(true)} 
                          className="px-4 py-2 bg-white border border-outline/10 rounded-xl font-semibold text-primary hover:bg-surface-container-low transition-all text-[13px] flex items-center gap-2 shadow-sm"
                          style={{ fontFamily: "'Inter', sans-serif" }}
                        >
                          <span className="material-symbols-outlined text-[18px]">person_search</span>
                          {t("group.stay.change_host")}
                        </button>
                      </div>
                    )}
                    <p className="text-[11px] text-on-surface-variant/60 font-medium ml-1" style={{ fontFamily: "'Inter', sans-serif" }}>{t("group.stay.host_settings_hint")}</p>
                  </div>
                </div>
              </div>
            </section>

            {/* ACTION BAR */}
            <div className={`sticky ${isInline ? 'bottom-0' : 'bottom-20 md:bottom-0'} left-0 right-0 p-6 bg-background/80 backdrop-blur-xl border-t border-outline/5 flex justify-center z-40 mt-12 ${isInline ? '-mx-4' : '-mx-6 md:-mx-12'}`}>
              <div className={`w-full max-w-[896px] flex justify-end gap-4 ${isInline ? '' : 'px-6 md:px-12'}`}>
                <button 
                  onClick={handleDiscard} 
                  disabled={isSaving} 
                  className="px-8 py-3.5 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-semibold transition-all active:scale-95 text-[14px]"
                  style={{ fontFamily: "'Inter', sans-serif" }}
                >
                  {t("group.stay.discard")}
                </button>
                <button 
                  onClick={handleSave} 
                  disabled={isSaving || isUploadingImages} 
                  className="px-12 py-3.5 rounded-xl bg-primary text-on-primary font-semibold shadow-[0_10px_20px_rgba(0,88,188,0.15)] hover:opacity-90 active:scale-[0.98] transition-all flex items-center gap-2 disabled:opacity-50 text-[14px]"
                  style={{ fontFamily: "'Inter', sans-serif" }}
                >
                  {isSaving ? (
                    <>
                      <div className="w-5 h-5 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />
                      {t("group.stay.saving")}
                    </>
                  ) : isUploadingImages ? (
                    <>
                      <div className="w-5 h-5 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />
                      {t("group.stay.uploading")}
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[20px]">save</span>
                      {t("group.stay.save_changes")}
                    </>
                  )}
                </button>
              </div>
            </div>

          </div>
        </main>
      </motion.div>
    </>
  );
}
