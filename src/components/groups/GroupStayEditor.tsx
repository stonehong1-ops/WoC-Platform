"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Script from "next/script";
import "@/styles/groupstayeditor.css";
import { stayService } from "@/lib/firebase/stayService";
import { storageService } from "@/lib/firebase/storageService";
import { Stay, StayType } from "@/types/stay";
import { useAuth } from "@/components/providers/AuthProvider";
import { toast } from "sonner";

interface GroupStayEditorProps {
  group?: any;
}

export default function GroupStayEditor({ group }: GroupStayEditorProps) {
  const { user } = useAuth();

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
      <div className="light font-body-md text-on-background antialiased bg-[#F3F4F6] min-h-screen">
        <main className="p-6 md:p-12">
          <div className="max-w-[896px] mx-auto flex items-center justify-center py-32">
            <div className="flex flex-col items-center gap-4">
              <div className="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
              <span className="font-body-md text-on-surface-variant">Loading stay data...</span>
            </div>
          </div>
        </main>
      </div>
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

      <div className="light font-body-md text-on-background antialiased bg-[#F3F4F6] min-h-screen">
        <main className="p-6 md:p-12">
          <div className="max-w-[896px] mx-auto space-y-10 pb-48 md:pb-32">
            <header className="flex justify-between items-end mb-12">
              <div>
                <h1 className="font-headline-lg text-headline-lg text-on-surface">Stay Editor</h1>
                <p className="font-body-md text-on-surface-variant mt-1">Manage details for {title || "your stay"}</p>
              </div>
              {/* Save Status Message */}
              {saveMessage && (
                <div className={`px-4 py-2 rounded-lg font-label-sm ${saveMessage.type === 'success' ? 'bg-primary/10 text-primary' : 'bg-error/10 text-error'}`}>
                  {saveMessage.text}
                </div>
              )}
            </header>
            {/* 1. BASIC INFO */}
            <section className="bg-white rounded-[12px] shadow-sm p-6 space-y-6">
              <div className="flex items-center gap-2 text-primary">
                <span className="material-symbols-outlined" data-icon="info">info</span>
                <h2 className="font-title-md text-title-md">BASIC INFO</h2>
              </div>
              <div className="grid grid-cols-1 gap-6">
                <div className="space-y-2">
                  <label className="font-label-sm text-on-surface-variant">Stay Name (English)</label>
                  <input className="w-full px-4 py-3 bg-surface-container-low border-transparent rounded-lg focus:border-primary focus:ring-1 focus:ring-primary font-body-md transition-all" type="text" value={title} onChange={(e) => setTitle(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="font-label-sm text-on-surface-variant">Native Title</label>
                  <input className="w-full px-4 py-3 bg-surface-container-low border-transparent rounded-lg focus:border-primary focus:ring-1 focus:ring-primary font-body-md transition-all" type="text" value={nativeTitle} onChange={(e) => setNativeTitle(e.target.value)} placeholder="Enter native title" />
                </div>
                <div className="space-y-2">
                  <label className="font-label-sm text-on-surface-variant">Short Headline</label>
                  <input className="w-full px-4 py-3 bg-surface-container-low border-transparent rounded-lg focus:border-primary focus:ring-1 focus:ring-primary font-body-md transition-all" placeholder="e.g. Modern minimalist studio in the heart of Mapo" type="text" value={headline} onChange={(e) => setHeadline(e.target.value)} />
                </div>
              </div>
            </section>

            {/* 3. MEDIA */}
            <section className="bg-white rounded-[12px] shadow-sm p-6 space-y-6">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 text-primary">
                  <span className="material-symbols-outlined" data-icon="photo_library">photo_library</span>
                  <h2 className="font-title-md text-title-md">MEDIA</h2>
                </div>
                <span className="font-label-sm text-on-surface-variant">{displayImageUrls.length} / 20 uploaded</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {displayImageUrls.map((imgUrl, index) => {
                  const progress = uploadProgress[index];
                  const isOptimizing = optimizingSlots[index];
                  const isUploadingImg = progress !== undefined;

                  return (
                    <div key={index} className="aspect-square relative rounded-lg overflow-hidden group border border-outline-variant/10">
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
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <button onClick={() => handleImageDelete(index)} className="p-1 bg-white rounded-full text-error"><span className="material-symbols-outlined" data-icon="delete">delete</span></button>
                        </div>
                      )}
                    </div>
                  );
                })}
                {displayImageUrls.length < 20 && (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="aspect-square relative rounded-lg border-2 border-dashed border-primary/40 bg-primary/5 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-primary/10 transition-colors group"
                  >
                    <span className="material-symbols-outlined text-primary group-hover:scale-110 transition-transform" data-icon="add_a_photo">add_a_photo</span>
                    <span className="font-label-sm text-primary font-bold">Add Photos</span>
                  </div>
                )}
              </div>
            </section>
            {/* 4. RATES */}
            <section className="bg-white rounded-[12px] shadow-sm p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-primary">
                  <span className="material-symbols-outlined" data-icon="payments">payments</span>
                  <h2 className="font-title-md text-title-md">RATES</h2>
                </div>
                <div className="flex items-center gap-2">
                  <label className="font-label-sm text-on-surface-variant">Currency</label>
                  <select className="bg-surface-container-low border-transparent rounded-lg font-label-sm text-on-surface py-1.5 pl-3 pr-8 focus:ring-primary focus:border-primary" value={currency} onChange={(e) => setCurrency(e.target.value)}>
                    <option value="KRW">KRW (₩)</option>
                    <option value="USD">USD ($)</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="font-label-sm text-on-surface-variant">Weekday Base Rate</label>
                  <div className="relative">
                    <input className="w-full pl-4 pr-4 py-3 bg-surface-container-low border-transparent rounded-lg focus:border-primary focus:ring-1 focus:ring-primary font-body-md" type="text" value={baseRate} onChange={(e) => setBaseRate(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="font-label-sm text-on-surface-variant">Weekend Surcharge</label>
                  <div className="relative">
                    <input className="w-full pl-4 pr-4 py-3 bg-surface-container-low border-transparent rounded-lg focus:border-primary focus:ring-1 focus:ring-primary font-body-md" type="text" value={weekendSurcharge} onChange={(e) => setWeekendSurcharge(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="font-label-sm text-on-surface-variant">Extra Person Fee</label>
                  <div className="relative">
                    <input className="w-full pl-4 pr-4 py-3 bg-surface-container-low border-transparent rounded-lg focus:border-primary focus:ring-1 focus:ring-primary font-body-md" type="text" value={extraPersonFee} onChange={(e) => setExtraPersonFee(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="font-label-sm text-on-surface-variant">Cleaning Fee</label>
                  <div className="relative">
                    <input className="w-full pl-4 pr-4 py-3 bg-surface-container-low border-transparent rounded-lg focus:border-primary focus:ring-1 focus:ring-primary font-body-md" type="text" value={cleaningFee} onChange={(e) => setCleaningFee(e.target.value)} />
                  </div>
                </div>
              </div>
            </section>
            {/* 5. GUIDES */}
            <section className="bg-white rounded-[12px] shadow-sm p-6 space-y-6">
              <div className="flex items-center gap-2 text-primary">
                <span className="material-symbols-outlined" data-icon="menu_book">menu_book</span>
                <h2 className="font-title-md text-title-md">GUIDES</h2>
              </div>
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="font-label-sm text-on-surface-variant">Room Features</label>
                  <textarea className="w-full px-4 py-3 bg-surface-container-low border-transparent rounded-lg focus:border-primary focus:ring-1 focus:ring-primary font-body-md" rows={3} value={roomFeatures} onChange={(e) => setRoomFeatures(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="font-label-sm text-on-surface-variant">Getting Here</label>
                  <textarea className="w-full px-4 py-3 bg-surface-container-low border-transparent rounded-lg focus:border-primary focus:ring-1 focus:ring-primary font-body-md" rows={3} value={gettingHere} onChange={(e) => setGettingHere(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="font-label-sm text-on-surface-variant">Facility Guide</label>
                  <textarea className="w-full px-4 py-3 bg-surface-container-low border-transparent rounded-lg focus:border-primary focus:ring-1 focus:ring-primary font-body-md" rows={3} value={facilityGuide} onChange={(e) => setFacilityGuide(e.target.value)} />
                </div>
              </div>
            </section>
            {/* 6. HOST SETTINGS */}
            <section className="bg-white rounded-[12px] shadow-sm p-6 space-y-6">
              <div className="flex items-center gap-2 text-primary">
                <span className="material-symbols-outlined" data-icon="person">person</span>
                <h2 className="font-title-md text-title-md uppercase">Host Settings</h2>
              </div>
              <div className="space-y-2">
                <label className="font-label-sm text-on-surface-variant">Primary Host</label>
                {isEditingHost ? (
                  <div className="p-4 bg-surface-container-low rounded-xl space-y-4">
                    <div className="space-y-2">
                      <label className="font-label-sm text-on-surface-variant">Host Name</label>
                      <input className="w-full px-4 py-2 bg-white border border-outline-variant/30 rounded-lg focus:border-primary focus:ring-1 focus:ring-primary font-body-md" type="text" value={hostName} onChange={(e) => setHostName(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <label className="font-label-sm text-on-surface-variant">Host Photo URL</label>
                      <input className="w-full px-4 py-2 bg-white border border-outline-variant/30 rounded-lg focus:border-primary focus:ring-1 focus:ring-primary font-body-md" type="text" value={hostPhoto} onChange={(e) => setHostPhoto(e.target.value)} placeholder="https://..." />
                    </div>
                    <div className="flex justify-end pt-2">
                      <button onClick={() => setIsEditingHost(false)} className="px-6 py-2 bg-primary text-white rounded-lg font-label-sm hover:bg-primary/90 transition-colors">Done</button>
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
                        <p className="font-body-md text-on-surface">{hostName}</p>
                        <p className="text-[12px] text-on-surface-variant font-medium">Default Host</p>
                      </div>
                    </div>
                    <button onClick={() => setIsEditingHost(true)} className="px-4 py-2 bg-white border border-outline-variant/50 rounded-lg font-label-sm text-primary hover:bg-surface-container-low transition-colors flex items-center gap-2">
                      <span className="material-symbols-outlined text-[18px]">person_search</span>
                      Change
                    </button>
                  </div>
                )}
                <p className="text-[11px] text-on-surface-variant px-1 mt-2">Search and select from people in your organization to assign a different primary host.</p>
              </div>
            </section>
            {/* ACTION BAR */}
            <div className="sticky bottom-20 md:bottom-0 left-0 right-0 p-6 bg-[#F3F4F6]/90 backdrop-blur-xl border-t border-outline-variant/30 flex justify-center z-40 mt-12 -mx-6 md:-mx-12">
              <div className="w-full max-w-[896px] flex justify-end gap-4 px-6 md:px-12">
                <button onClick={handleDiscard} disabled={isSaving} className="px-8 py-3 rounded-xl bg-outline-variant/20 font-title-md text-body-md hover:bg-outline-variant/40 transition-all">Discard</button>
                <button onClick={handleSave} disabled={isSaving || isUploadingImages} className="px-12 py-3 rounded-xl bg-primary text-on-primary font-title-md text-body-md shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50">
                  {isSaving ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : isUploadingImages ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined" data-icon="save">save</span>
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
