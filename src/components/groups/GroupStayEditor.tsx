"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Script from "next/script";
import "@/styles/groupstayeditor.css";
import { stayService } from "@/lib/firebase/stayService";
import { storageService } from "@/lib/firebase/storageService";
import { userService } from "@/lib/firebase/userService";
import { Stay, StayType } from "@/types/stay";
import { PlatformUser } from "@/types/user";
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

  // ── MEDIA & CAPTIONS INTEGRATION ──
  const [gallery, setGallery] = useState<{ url: string; descKo: string; descEn: string }[]>([]);
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

  // ── HOST (Platform Member Binding) ──
  const [hostUserId, setHostUserId] = useState("");
  const [hostName, setHostName] = useState("Me");
  const [hostPhoto, setHostPhoto] = useState("");
  const [isEditingHost, setIsEditingHost] = useState(false);
  const [allUsers, setAllUsers] = useState<PlatformUser[]>([]);
  const [hostResults, setHostResults] = useState<PlatformUser[]>([]);
  const [showHostResults, setShowHostResults] = useState(false);

  // ── AUTOMATION SETTINGS ──
  const [automationEnabled, setAutomationEnabled] = useState(true);
  const [appliedEnabled, setAppliedEnabled] = useState(true);
  const [appliedContent, setAppliedContent] = useState("");
  const [before3DaysEnabled, setBefore3DaysEnabled] = useState(true);
  const [before3DaysContent, setBefore3DaysContent] = useState("");
  const [checkInDayEnabled, setCheckInDayEnabled] = useState(true);
  const [checkInDayContent, setCheckInDayContent] = useState("");
  const [checkOutDayEnabled, setCheckOutDayEnabled] = useState(true);
  const [checkOutDayContent, setCheckOutDayContent] = useState("");

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

    // Media & Captions Adapter (1:1 Binding)
    const initialGallery = stay.gallery || (stay.images || []).map((url, i) => ({
      url,
      descKo: stay.descriptions?.ko?.[i] || "",
      descEn: stay.descriptions?.en?.[i] || ""
    }));
    setGallery(initialGallery);

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
    setHostUserId(stay.host?.userId || "");
    setHostName(stay.host?.name || "Me");
    setHostPhoto(stay.host?.photo || "");

    // Automation Settings
    const settings = (stay as any).automationSettings || {};
    const steps = settings.steps || {};
    setAutomationEnabled(settings.enabled !== false);
    setAppliedEnabled(steps.applied?.enabled !== false);
    setAppliedContent(steps.applied?.webContent || "");
    setBefore3DaysEnabled(steps.before3Days?.enabled !== false);
    setBefore3DaysContent(steps.before3Days?.webContent || "");
    setCheckInDayEnabled(steps.checkInDay?.enabled !== false);
    setCheckInDayContent(steps.checkInDay?.webContent || "");
    setCheckOutDayEnabled(steps.checkOutDay?.enabled !== false);
    setCheckOutDayContent(steps.checkOutDay?.webContent || "");
  }, []);

  // -- Fetch All Platform Users for Host Searching --
  useEffect(() => {
    userService.getAllUsers().then(setAllUsers).catch(console.error);
  }, []);

  // -- Real-time Firestore Subscription --
  useEffect(() => {
    if (!group?.id) {
      setIsLoading(false);
      return;
    }

    // 0ms Cache Restore Guard
    if (typeof window !== 'undefined') {
      const cached = sessionStorage.getItem(`woc_group_stay_editor_${group.id}`);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (parsed) {
            populateFromStay(parsed);
            setIsLoading(false);
          }
        } catch (e) {
          console.error("Error restoring group stay cache", e);
        }
      }
    }

    const unsubscribe = stayService.subscribeGroupStay(group.id, (stay) => {
      if (stay) {
        populateFromStay(stay);
        if (typeof window !== 'undefined') {
          sessionStorage.setItem(`woc_group_stay_editor_${group.id}`, JSON.stringify(stay));
        }
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
        images: gallery.map(item => item.url),
        gallery: gallery.map(item => ({
          url: item.url,
          descKo: item.descKo || "",
          descEn: item.descEn || ""
        })),
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
        descriptions: {
          ko: gallery.map(item => item.descKo || ""),
          en: gallery.map(item => item.descEn || "")
        },
        host: {
          ...(originalData?.host || {}),
          userId: hostUserId || originalData?.host?.userId || user?.uid || "",
          name: hostName,
          photo: hostPhoto,
        } as any,
        automationSettings: {
          enabled: automationEnabled,
          steps: {
            applied: {
              enabled: appliedEnabled,
              webContent: appliedContent,
            },
            before3Days: {
              enabled: before3DaysEnabled,
              webContent: before3DaysContent,
            },
            checkInDay: {
              enabled: checkInDayEnabled,
              webContent: checkInDayContent,
            },
            checkOutDay: {
              enabled: checkOutDayEnabled,
              webContent: checkOutDayContent,
            },
          },
        },
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

      // Sync cache on save
      if (typeof window !== 'undefined' && group?.id) {
        const currentStay: Stay = {
          ...originalData,
          id: existingStayId || "",
          groupId: group.id,
          title,
          nativeTitle,
          headline,
          location: {
            address,
            city: originalData?.location?.city || "Seoul",
            district: originalData?.location?.district || "",
            mapImageUrl: mapImageUrl || undefined,
          },
          images: gallery.map(item => item.url),
          gallery: gallery.map(item => ({
            url: item.url,
            descKo: item.descKo || "",
            descEn: item.descEn || ""
          })),
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
          descriptions: {
            ko: gallery.map(item => item.descKo || ""),
            en: gallery.map(item => item.descEn || "")
          },
          host: {
            ...(originalData?.host || {}),
            userId: hostUserId || originalData?.host?.userId || user?.uid || "",
            name: hostName,
            photo: hostPhoto,
          } as any,
          automationSettings: {
            enabled: automationEnabled,
            steps: {
              applied: {
                enabled: appliedEnabled,
                webContent: appliedContent,
              },
              before3Days: {
                enabled: before3DaysEnabled,
                webContent: before3DaysContent,
              },
              checkInDay: {
                enabled: checkInDayEnabled,
                webContent: checkInDayContent,
              },
              checkOutDay: {
                enabled: checkOutDayEnabled,
                webContent: checkOutDayContent,
              },
            },
          },
        } as Stay;
        sessionStorage.setItem(`woc_group_stay_editor_${group.id}`, JSON.stringify(currentStay));
      }

      setSaveMessage({ type: "success", text: t("group.stay.toast.save_success") });
      toast.success(t("group.stay.toast.save_success"));
    } catch (error) {
      console.error("Error saving stay:", error);
      setSaveMessage({ type: "error", text: t("group.stay.toast.save_fail") });
      toast.error(t("group.stay.toast.save_fail"));
    } finally {
      setIsSaving(false);
    }
  };

  const isUploadingImages = Object.keys(uploadProgress).length > 0 || Object.values(optimizingSlots).some(v => v);

  // -- Host Search Handlers (Social Organizer Inspired) --
  const handleHostSearch = (val: string) => {
    setHostName(val);
    if (val.length >= 1) {
      const lower = val.toLowerCase();
      const filtered = allUsers.filter(u =>
        (u.nickname && u.nickname.toLowerCase().includes(lower)) ||
        (u.nativeNickname && u.nativeNickname.includes(val))
      );
      setHostResults(filtered.slice(0, 6));
      setShowHostResults(filtered.length > 0);
    } else {
      setShowHostResults(false);
      setHostResults([]);
    }
  };

  const handleSelectHost = (u: PlatformUser) => {
    setHostName(u.nickname || t("group.stay.anonymous"));
    setHostPhoto(u.photoURL || "");
    setHostUserId(u.id);
    setShowHostResults(false);
  };

  // -- Discard Handler --
  const handleDiscard = () => {
    if (originalData) {
      populateFromStay(originalData);
      setSaveMessage({ type: "success", text: "Changes discarded." });
    }
  };

  // -- Caption Input Handler --
  const handleCaptionChange = (index: number, lang: 'ko' | 'en', value: string) => {
    setGallery(prev => {
      const next = [...prev];
      if (next[index]) {
        next[index] = {
          ...next[index],
          descKo: lang === 'ko' ? value : next[index].descKo,
          descEn: lang === 'en' ? value : next[index].descEn
        };
      }
      return next;
    });
  };

  // -- Image Upload Handler --
  const handleImageUpload = async (file: File, index: number) => {
    const blobUrl = URL.createObjectURL(file);
    
    // Optimistic UI Update (Add placeholder item with empty caption)
    setGallery(prev => {
      const next = [...prev];
      next[index] = { url: blobUrl, descKo: "", descEn: "" };
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

      setGallery(prev => {
        const next = [...prev];
        if (next[index]) {
          next[index] = { ...next[index], url };
        }
        return next;
      });
      
      URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(`Failed to upload ${file.name}`);
      // Remove preview on failure
      setGallery(prev => prev.filter((_, i) => i !== index));
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
    const totalNewImages = gallery.length + selectedFiles.length;
    if (totalNewImages > 20) {
      toast.error(t("group.stay.toast.max_photos"));
      return;
    }

    // Start individual uploads
    for (let i = 0; i < selectedFiles.length; i++) {
      const targetIdx = gallery.length + i;
      await handleImageUpload(selectedFiles[i], targetIdx);
    }

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // -- Image Delete Handler --
  const handleImageDelete = (index: number) => {
    const itemToRemove = gallery[index];
    if (itemToRemove && itemToRemove.url.startsWith('blob:')) {
      URL.revokeObjectURL(itemToRemove.url);
    }
    setGallery((prev) => prev.filter((_, i) => i !== index));
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
            <div className={`px-4 pb-6 ${isInline ? 'pt-1' : 'pt-4'}`}>
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

            {/* 3. MEDIA & CAPTIONS INTEGRATED */}
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
                      {t("group.stay.uploaded_count", { count: gallery.length })}
                    </span>
                  </div>
                </div>

                <div className="p-6 space-y-5">
                  {/* 1:1 Gallery Cards List */}
                  <div className="space-y-4">
                    {gallery.map((item, index) => {
                      const progress = uploadProgress[index];
                      const isOptimizing = optimizingSlots[index];
                      const isUploadingImg = progress !== undefined;

                      return (
                        <div key={index} className="flex flex-col md:flex-row gap-4 p-4 bg-surface-container-lowest border border-outline/5 rounded-2xl relative group transition-all hover:border-outline/10">
                          
                          {/* Left Side: Image Thumbnail */}
                          <div className="w-full md:w-[160px] aspect-[4/3] md:aspect-square relative rounded-xl overflow-hidden shrink-0 border border-outline/5 bg-surface-container-low">
                            <img alt={`Room Image ${index + 1}`} className="w-full h-full object-cover" src={item.url} />
                            
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

                            {/* Delete Button (Hover) */}
                            {!isUploadingImg && !isOptimizing && (
                              <button 
                                onClick={() => handleImageDelete(index)}
                                className="absolute top-2 right-2 w-8 h-8 rounded-full bg-error/90 hover:bg-error text-white flex items-center justify-center shadow-md active:scale-95 transition-all"
                              >
                                <span className="material-symbols-outlined text-[16px]">delete</span>
                              </button>
                            )}
                          </div>

                          {/* Right Side: Caption Inputs */}
                          <div className="flex-1 space-y-3 flex flex-col justify-center">
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-1.5 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                                <span className="material-symbols-outlined text-[14px]">translate</span>
                                {t("group.stay.caption_ko")}
                              </div>
                              <input
                                type="text"
                                className="w-full bg-surface-container-low border border-outline/10 focus:ring-2 focus:ring-primary/30 focus:border-primary rounded-xl px-4 py-2.5 text-on-surface text-[13px] font-medium placeholder:text-on-surface-variant/30"
                                value={item.descKo}
                                placeholder={t("group.stay.caption_ko_placeholder")}
                                onChange={(e) => handleCaptionChange(index, 'ko', e.target.value)}
                                style={{ fontFamily: "'Inter', sans-serif" }}
                              />
                            </div>
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-1.5 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                                <span className="material-symbols-outlined text-[14px]">translate</span>
                                {t("group.stay.caption_en")}
                              </div>
                              <input
                                type="text"
                                className="w-full bg-surface-container-low border border-outline/10 focus:ring-2 focus:ring-primary/30 focus:border-primary rounded-xl px-4 py-2.5 text-on-surface text-[13px] font-medium placeholder:text-on-surface-variant/30"
                                value={item.descEn}
                                placeholder={t("group.stay.caption_en_placeholder")}
                                onChange={(e) => handleCaptionChange(index, 'en', e.target.value)}
                                style={{ fontFamily: "'Inter', sans-serif" }}
                              />
                            </div>
                          </div>

                        </div>
                      );
                    })}

                    {/* Empty State */}
                    {gallery.length === 0 && (
                      <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full py-12 rounded-2xl border-2 border-dashed border-outline/15 bg-surface-container-low hover:border-primary/30 flex flex-col items-center justify-center gap-2 transition-all cursor-pointer group"
                      >
                        <span className="material-symbols-outlined text-on-surface-variant/30 text-[36px]" data-icon="add_a_photo">add_a_photo</span>
                        <span className="text-[13px] text-on-surface-variant/50 font-semibold" style={{ fontFamily: "'Inter', sans-serif" }}>{t("group.stay.add_photos_empty")}</span>
                        <span className="text-[11px] text-on-surface-variant/30 font-medium">{t("group.stay.max_20_images")}</span>
                      </div>
                    )}
                  </div>

                  {/* Add More Photos Button */}
                  {gallery.length > 0 && gallery.length < 20 && (
                    <div className="flex justify-end pt-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-6 py-2.5 bg-secondary text-on-secondary rounded-xl font-semibold hover:opacity-90 active:scale-95 transition-all text-[13px] flex items-center gap-2 shadow-sm"
                        style={{ fontFamily: "'Inter', sans-serif" }}
                      >
                        <span className="material-symbols-outlined text-[18px]">add_a_photo</span>
                        {t("group.stay.add_more_photos")}
                      </button>
                    </div>
                  )}
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
                      <div className="p-4 bg-surface-container-low rounded-xl space-y-4 relative">
                        <div className="space-y-2 relative z-30">
                          <label className="text-[12px] font-semibold text-on-surface-variant uppercase tracking-wider" style={{ fontFamily: "'Inter', sans-serif" }}>{t("group.stay.host_name")}</label>
                          <div className="relative flex items-center bg-white border border-outline/10 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary rounded-xl px-4 py-3 transition-all">
                            <span className="material-symbols-outlined text-on-surface-variant/40 mr-2">search</span>
                            <input 
                              className="flex-1 bg-transparent border-none p-0 focus:ring-0 text-[14px] font-medium text-on-surface placeholder:text-on-surface-variant/30 outline-none" 
                              type="text" 
                              value={hostName} 
                              onChange={(e) => handleHostSearch(e.target.value)} 
                              onFocus={() => hostName.length >= 1 && setShowHostResults(hostResults.length > 0)}
                              onBlur={() => setTimeout(() => setShowHostResults(false), 200)}
                              placeholder={t("group.stay.search_user_placeholder")}
                              style={{ fontFamily: "'Inter', sans-serif" }}
                            />
                          </div>

                          {showHostResults && (
                            <div className="absolute top-full left-0 w-full mt-1 bg-white border border-outline/10 rounded-xl shadow-lg z-50 overflow-hidden">
                              {hostResults.map(u => (
                                <button 
                                  key={u.id} 
                                  type="button"
                                  onClick={() => handleSelectHost(u)}
                                  className="w-full text-left px-4 py-3 hover:bg-surface-container-low flex items-center gap-3 group transition-colors border-b border-outline/5 last:border-0"
                                >
                                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary overflow-hidden shrink-0">
                                    {u.photoURL ? (
                                      <img src={u.photoURL} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                      <span className="material-symbols-outlined text-[16px]">person</span>
                                    )}
                                  </div>
                                  <div className="flex flex-col">
                                    <p className="font-semibold text-on-surface text-[13px] group-hover:text-primary leading-tight">{u.nickname}</p>
                                    {u.nativeNickname && <span className="text-[10px] text-on-surface-variant/60 font-medium leading-tight mt-0.5">{u.nativeNickname}</span>}
                                  </div>
                                </button>
                              ))}
                            </div>
                          )}
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
                            {t("group.stay.done")}
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

            {/* 7. GLOBAL AUTOMATION & WEB GUIDES */}
            <section className="px-4 mb-6">
              <div className="bg-white rounded-2xl shadow-[0px_10px_30px_rgba(0,0,0,0.03)] border border-white/20 overflow-hidden">
                <div className="px-6 pt-6 pb-4 border-b border-outline/5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-primary text-[20px]">mark_email_unread</span>
                    </div>
                    <div>
                      <h3 className="text-[16px] leading-[1.6] font-semibold text-on-surface" style={{ fontFamily: "'Inter', sans-serif" }}>{t("group.stay.automation_title", "Global Messaging & Web Guides")}</h3>
                      <p className="text-[12px] leading-[1.2] font-medium text-on-surface-variant" style={{ fontFamily: "'Inter', sans-serif" }}>{t("group.stay.automation_desc", "Configure automated SMS triggers and manage custom guest web guides.")}</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={automationEnabled} 
                      onChange={(e) => setAutomationEnabled(e.target.checked)} 
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>

                {automationEnabled && (
                  <div className="p-6 space-y-6 divide-y divide-outline/5">
                    {/* Step 1 */}
                    <div className="space-y-4 pt-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500">1</span>
                          <h4 className="text-[14px] font-bold text-on-surface" style={{ fontFamily: "'Inter', sans-serif" }}>{t("group.stay.step1_title", "Step 1: Reservation Confirmed (Immediate SMS)")}</h4>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={appliedEnabled} 
                            onChange={(e) => setAppliedEnabled(e.target.checked)} 
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                        </label>
                      </div>
                      {appliedEnabled && (
                        <div className="space-y-2 pl-7">
                          <label className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider" style={{ fontFamily: "'Inter', sans-serif" }}>{t("group.stay.web_content_label", "Guest Web Guide Content (Refund/Receipt Policy)")}</label>
                          <textarea 
                            className="w-full bg-surface-container-low border border-outline/10 focus:ring-2 focus:ring-primary/30 focus:border-primary rounded-xl px-4 py-3 text-on-surface text-[14px] leading-relaxed resize-none min-h-[80px]" 
                            rows={2}
                            value={appliedContent}
                            onChange={(e) => setAppliedContent(e.target.value)}
                            placeholder={t("group.stay.step1_placeholder", "Enter host notes regarding payments, deposits, or refund guidelines for this booking...")}
                            style={{ fontFamily: "'Inter', sans-serif" }}
                          />
                        </div>
                      )}
                    </div>

                    {/* Step 2 */}
                    <div className="space-y-4 pt-5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500">2</span>
                          <h4 className="text-[14px] font-bold text-on-surface" style={{ fontFamily: "'Inter', sans-serif" }}>{t("group.stay.step2_title", "Step 2: 3 Days Before Arrival (Directions Guide)")}</h4>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={before3DaysEnabled} 
                            onChange={(e) => setBefore3DaysEnabled(e.target.checked)} 
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                        </label>
                      </div>
                      {before3DaysEnabled && (
                        <div className="space-y-2 pl-7">
                          <label className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider" style={{ fontFamily: "'Inter', sans-serif" }}>{t("group.stay.web_content_label", "Guest Web Guide Content (Directions & Parking)")}</label>
                          <textarea 
                            className="w-full bg-surface-container-low border border-outline/10 focus:ring-2 focus:ring-primary/30 focus:border-primary rounded-xl px-4 py-3 text-on-surface text-[14px] leading-relaxed resize-none min-h-[80px]" 
                            rows={2}
                            value={before3DaysContent}
                            onChange={(e) => setBefore3DaysContent(e.target.value)}
                            placeholder={t("group.stay.step2_placeholder", "Enter precise directions, parking rules, check-in instructions, or neighborhood travel recommendations...")}
                            style={{ fontFamily: "'Inter', sans-serif" }}
                          />
                        </div>
                      )}
                    </div>

                    {/* Step 3 */}
                    <div className="space-y-4 pt-5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500">3</span>
                          <h4 className="text-[14px] font-bold text-on-surface" style={{ fontFamily: "'Inter', sans-serif" }}>{t("group.stay.step3_title", "Step 3: Check-in Day (Access Code & Wi-Fi)")}</h4>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={checkInDayEnabled} 
                            onChange={(e) => setCheckInDayEnabled(e.target.checked)} 
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                        </label>
                      </div>
                      {checkInDayEnabled && (
                        <div className="space-y-2 pl-7">
                          <label className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider" style={{ fontFamily: "'Inter', sans-serif" }}>{t("group.stay.web_content_label", "Guest Web Guide Content (Access Code & Wi-Fi)")}</label>
                          <textarea 
                            className="w-full bg-surface-container-low border border-outline/10 focus:ring-2 focus:ring-primary/30 focus:border-primary rounded-xl px-4 py-3 text-on-surface text-[14px] leading-relaxed resize-none min-h-[80px]" 
                            rows={2}
                            value={checkInDayContent}
                            onChange={(e) => setCheckInDayContent(e.target.value)}
                            placeholder={t("group.stay.step3_placeholder", "Enter door access code, Wi-Fi password, host contacts, and essential room usage notes...")}
                            style={{ fontFamily: "'Inter', sans-serif" }}
                          />
                        </div>
                      )}
                    </div>

                    {/* Step 4 */}
                    <div className="space-y-4 pt-5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500">4</span>
                          <h4 className="text-[14px] font-bold text-on-surface" style={{ fontFamily: "'Inter', sans-serif" }}>{t("group.stay.step4_title", "Step 4: Post Checkout (Thank You & Reviews)")}</h4>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={checkOutDayEnabled} 
                            onChange={(e) => setCheckOutDayEnabled(e.target.checked)} 
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                        </label>
                      </div>
                      {checkOutDayEnabled && (
                        <div className="space-y-2 pl-7">
                          <label className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider" style={{ fontFamily: "'Inter', sans-serif" }}>{t("group.stay.web_content_label", "Guest Web Guide Content (Checkout Guidelines)")}</label>
                          <textarea 
                            className="w-full bg-surface-container-low border border-outline/10 focus:ring-2 focus:ring-primary/30 focus:border-primary rounded-xl px-4 py-3 text-on-surface text-[14px] leading-relaxed resize-none min-h-[80px]" 
                            rows={2}
                            value={checkOutDayContent}
                            onChange={(e) => setCheckOutDayContent(e.target.value)}
                            placeholder={t("group.stay.step4_placeholder", "Enter clean-up rules, garbage disposal guidelines, check-out time checks, or a thank-you note...")}
                            style={{ fontFamily: "'Inter', sans-serif" }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}
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
