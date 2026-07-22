"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Capacitor } from "@capacitor/core";
import { useAuth } from "@/components/providers/AuthProvider";
import { useLanguage } from "@/contexts/LanguageContext";
import { socialService } from "@/lib/firebase/socialService";
import { Social } from "@/types/social";
import { toast } from "sonner";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/clientApp";

export default function ActivityRegisterPage() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const { t, language } = useLanguage();
  const [currentStep, setCurrentStep] = useState(1);

  // Step 2: DJ 일정 등록 상태
  const [socials, setSocials] = useState<Social[]>([]);
  const [selectedSocialId, setSelectedSocialId] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [customSocialTitle, setCustomSocialTitle] = useState("");
  const [customTime, setCustomTime] = useState("");
  const [customLocation, setCustomLocation] = useState("");

  const djId = user?.uid || "";
  const djName = profile?.nickname || user?.displayName || "";

  // 소셜 목록 구독
  useEffect(() => {
    if (currentStep !== 2) return;
    const unsub = socialService.subscribeAllSocials((data) => {
      setSocials(data);
    });
    return () => unsub();
  }, [currentStep]);

  const selectedSocial = socials.find((s) => s.id === selectedSocialId);

  const generateUpcomingDates = (social: Social) => {
    if (social.type !== "regular" || social.dayOfWeek === undefined) return [];
    const dates = [];
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    const diff = (social.dayOfWeek - d.getDay() + 7) % 7;
    let next = new Date(d);
    next.setDate(d.getDate() + diff);
    for (let i = 0; i < 8; i++) {
      const year = next.getFullYear();
      const month = String(next.getMonth() + 1).padStart(2, "0");
      const day = String(next.getDate()).padStart(2, "0");
      dates.push(`${year}-${month}-${day}`);
      next.setDate(next.getDate() + 7);
    }
    return dates;
  };

  const suggestedDates = selectedSocial
    ? generateUpcomingDates(selectedSocial)
    : [];
  const dateLocale = language === "KR" ? "ko-KR" : "en-US";

  useEffect(() => {
    if (selectedSocialId === "none") {
      setSelectedDate("");
      return;
    }
    if (!selectedSocial) {
      setSelectedDate("");
      return;
    }
    if (selectedSocial.type === "popup" && selectedSocial.date) {
      const pDate =
        typeof selectedSocial.date.toDate === "function"
          ? selectedSocial.date.toDate()
          : new Date((selectedSocial.date as any).seconds * 1000);
      const year = pDate.getFullYear();
      const month = String(pDate.getMonth() + 1).padStart(2, "0");
      const day = String(pDate.getDate()).padStart(2, "0");
      setSelectedDate(`${year}-${month}-${day}`);
    } else {
      const upcoming = generateUpcomingDates(selectedSocial);
      if (upcoming.length > 0) setSelectedDate(upcoming[0]);
      else setSelectedDate("");
    }
  }, [selectedSocialId]);

  const handleSelectSocial = (socialId: string) => {
    setSelectedSocialId(socialId);
    setIsDropdownOpen(false);
    setSearchKeyword("");
    if (socialId === "none") setSelectedDate("");
  };

  const filteredSocials = socials.filter((s) => {
    if (s.subCategory === "practica") return false;
    if (!searchKeyword) return true;
    const query = searchKeyword.toLowerCase();
    const title = (s.title || "").toLowerCase();
    const native = (s.titleNative || "").toLowerCase();
    return title.includes(query) || native.includes(query);
  });

  const handleSubmit = async () => {
    if (!selectedSocialId) {
      toast.error(t("myinfo.select_social_placeholder"));
      return;
    }

    if (selectedSocialId === "none") {
      if (!customSocialTitle.trim()) {
        toast.error(
          language === "KR"
            ? "소셜 이름을 입력해 주세요."
            : "Please enter social name."
        );
        return;
      }
      if (!selectedDate) {
        toast.error(t("social.alert_select_date_dj") || "Please select a date");
        return;
      }
      setIsSubmitting(true);
      try {
        const userDocRef = doc(db, "users", djId);
        const userSnap = await getDoc(userDocRef);
        let customSchedules: any[] = [];
        if (userSnap.exists()) {
          customSchedules = userSnap.data().customSchedules || [];
        }
        const randomId =
          typeof crypto !== "undefined" && crypto.randomUUID
            ? crypto.randomUUID()
            : Math.random().toString(36).substring(2, 11) + "_" + Date.now();
        const newSchedule = {
          id: randomId,
          socialTitle: customSocialTitle,
          date: selectedDate,
          time: customTime,
          location: customLocation,
          type: "custom_dj_schedule",
        };
        await updateDoc(userDocRef, {
          customSchedules: [...customSchedules, newSchedule],
        });
        toast.success(t("myinfo.add_success"));
        router.back();
      } catch (error) {
        console.error("Failed to add custom DJ schedule:", error);
        toast.error(t("social.alert_failed_add_dj"));
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    if (!selectedDate) {
      toast.error(t("social.alert_select_date_dj") || "Please select a date");
      return;
    }
    setIsSubmitting(true);
    try {
      await socialService.addDjToSocial(
        selectedSocialId,
        djId,
        djName,
        selectedDate
      );
      toast.success(t("myinfo.add_success"));
      router.back();
    } catch (error) {
      console.error("Failed to add DJ schedule:", error);
      toast.error(t("social.alert_failed_add_dj"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseAttempt = () => {
    if (selectedSocialId || customSocialTitle) {
      if (confirm(t('common.confirm_discard', '작성 중인 내용이 사라집니다. 나가시겠습니까?'))) {
        router.back();
      }
    } else {
      router.back();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-white overflow-y-auto animate-in fade-in duration-300"
      style={{
        zIndex: 100000,
        paddingTop: Capacitor.isNativePlatform()
          ? "calc(56px + env(safe-area-inset-top))"
          : "56px",
      }}
    >
      <style
        dangerouslySetInnerHTML={{
          __html: `.material-symbols-rounded { font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24; }`,
        }}
      />

      {/* Header */}
      <header
        className="fixed top-0 left-0 w-full flex-shrink-0 bg-white border-b border-slate-100 px-4 flex items-center justify-between z-50"
        style={{
          zIndex: 100010,
          paddingTop: Capacitor.isNativePlatform()
            ? "env(safe-area-inset-top)"
            : "0px",
          height: Capacitor.isNativePlatform()
            ? "calc(56px + env(safe-area-inset-top))"
            : "56px",
        }}
      >
        <button
          type="button"
          onClick={handleCloseAttempt}
          className="w-10 h-10 flex items-center justify-center -ml-2 active:scale-95 transition-transform text-slate-700"
        >
          <span className="material-symbols-rounded text-2xl">arrow_back</span>
        </button>
        <h1 className="text-[16px] font-bold text-slate-800">
          {language === "KR" ? "활동 등록" : "Register Activity"}
        </h1>
        <div className="w-10" />
      </header>

      {/* Step Indicator Bar */}
      <div className="max-w-2xl mx-auto px-4 mt-3">
        <div className="flex items-center justify-between border border-slate-100 bg-slate-50/80 backdrop-blur rounded-2xl px-4 py-3 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-slate-700">
              {language === "KR"
                ? `${currentStep} / 2 단계`
                : `Step ${currentStep} of 2`}
            </span>
            <span className="text-xs font-bold text-[#007AFF] bg-[#007AFF]/10 px-2.5 py-0.5 rounded-full">
              {currentStep === 1 &&
                (language === "KR"
                  ? "활동 유형 선택"
                  : "Select Activity Type")}
              {currentStep === 2 &&
                (language === "KR"
                  ? "DJ 일정 등록"
                  : "Register DJ Schedule")}
            </span>
          </div>
          <div className="w-20 h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#007AFF] transition-all duration-300"
              style={{ width: `${(currentStep / 2) * 100}%` }}
            />
          </div>
        </div>
      </div>

      <main className="pt-4 pb-36 max-w-2xl mx-auto px-4 space-y-5">
        {/* Step 1: 활동 유형 선택 */}
        {currentStep === 1 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="border border-[#e0e4e5] rounded-2xl bg-white p-5 space-y-4 shadow-sm">
              <label className="block text-[15px] font-black text-slate-800 mb-1">
                {language === "KR"
                  ? "등록할 활동을 선택해 주세요"
                  : "Select Activity to Register"}
              </label>
              <p className="text-xs text-slate-500 mb-3">
                {language === "KR"
                  ? "추후 다양한 개인 활동 등록이 가능합니다."
                  : "More activity types will be available soon."}
              </p>

              {/* DJ 일정 추가 카드 */}
              <div
                onClick={() => setCurrentStep(2)}
                className="flex items-center gap-4 p-4 rounded-2xl border-2 border-[#007AFF] bg-[#007AFF]/5 cursor-pointer hover:bg-[#007AFF]/10 transition-all active:scale-[0.98]"
              >
                <div className="w-12 h-12 rounded-xl bg-[#007AFF] text-white flex items-center justify-center shrink-0 shadow-md">
                  <span className="material-symbols-rounded text-2xl">
                    headphones
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-extrabold text-slate-900">
                    {language === "KR"
                      ? "DJ 일정 추가"
                      : "Add DJ Schedule"}
                  </h3>
                  <p className="text-xs font-medium text-slate-500 mt-0.5">
                    {language === "KR"
                      ? "밀롱가/소셜에 나의 DJ 일정을 등록합니다."
                      : "Register your DJ schedule to a milonga/social."}
                  </p>
                </div>
                <span className="material-symbols-rounded text-[#007AFF] text-2xl">
                  arrow_forward
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: DJ 일정 등록 */}
        {currentStep === 2 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* 소셜 검색/선택 */}
            <div className="border border-[#e0e4e5] rounded-2xl bg-white p-5 space-y-5 shadow-sm">
              <div className="relative">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {t("myinfo.social_label")}
                </label>

                {selectedSocialId ? (
                  <div className="flex items-center justify-between w-full px-4 py-3 border border-[#007AFF]/30 rounded-xl bg-[#007AFF]/5 text-sm font-bold text-[#007AFF] animate-in fade-in duration-200">
                    <div className="flex items-center gap-2 truncate">
                      <span className="material-symbols-rounded text-base">
                        {selectedSocialId === "none" ? "draw" : "link"}
                      </span>
                      <span className="truncate">
                        {selectedSocialId === "none"
                          ? t("myinfo.no_related_social")
                          : selectedSocial?.titleNative ||
                            selectedSocial?.title}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedSocialId("");
                        setSelectedDate("");
                      }}
                      className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-[#007AFF]/10 transition-colors"
                    >
                      <span className="material-symbols-rounded text-sm">
                        close
                      </span>
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <div className="flex items-center gap-2 w-full px-4 py-3 border border-[#e0e4e5] rounded-xl focus-within:bg-white focus-within:ring-2 focus-within:ring-[#007AFF]/20 bg-white shadow-sm transition-all">
                      <span className="material-symbols-rounded text-base text-[#acb3b4]">
                        search
                      </span>
                      <input
                        type="text"
                        placeholder={t("myinfo.search_social_placeholder")}
                        value={searchKeyword}
                        onChange={(e) => {
                          setSearchKeyword(e.target.value);
                          setIsDropdownOpen(true);
                        }}
                        onFocus={() => setIsDropdownOpen(true)}
                      className="w-full text-sm font-bold text-[#2d3435] focus:outline-none placeholder:text-[#acb3b4] placeholder:font-normal"
                      />
                      {searchKeyword && (
                        <button
                          type="button"
                          onClick={() => setSearchKeyword("")}
                          className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-[#acb3b4]"
                        >
                          <span className="material-symbols-rounded text-xs">
                            close
                          </span>
                        </button>
                      )}
                    </div>

                    {isDropdownOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-[290]"
                          onClick={() => setIsDropdownOpen(false)}
                        />
                        <div className="absolute top-[calc(100%+4px)] left-0 right-0 z-[300] bg-white border border-[#e0e4e5] rounded-xl shadow-xl max-h-60 overflow-y-auto py-1.5 animate-in fade-in slide-in-from-top-1 duration-150">
                          <div
                            onClick={() => handleSelectSocial("none")}
                            className="flex items-center gap-2 px-4 py-3 text-xs font-bold text-purple-700 hover:bg-purple-50 cursor-pointer border-b border-gray-100 transition-colors"
                          >
                            <span className="material-symbols-rounded text-sm">
                              draw
                            </span>
                            <span>{t("myinfo.no_related_social")}</span>
                          </div>

                          {filteredSocials.length === 0 ? (
                            <div className="px-4 py-3 text-xs text-[#acb3b4] font-bold text-center">
                              {language === "KR"
                                ? "검색 결과가 없습니다."
                                : "No socials found."}
                            </div>
                          ) : (
                            filteredSocials.map((s) => (
                              <div
                                key={s.id}
                                onClick={() => handleSelectSocial(s.id)}
                                className="flex items-center gap-2 px-4 py-3 text-sm font-bold text-[#2d3435] hover:bg-[#007AFF]/5 cursor-pointer transition-colors"
                              >
                                <span className="material-symbols-rounded text-sm text-[#acb3b4]">
                                  link
                                </span>
                                <div className="truncate flex-1">
                                  <p className="truncate">
                                    {s.titleNative || s.title}
                                  </p>
                                  {s.venueName && (
                                    <p className="text-[10px] text-[#acb3b4] truncate font-medium mt-0.5">
                                      📍 {s.venueNameNative || s.venueName}
                                    </p>
                                  )}
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* 수동 입력 필드 (관련 소셜 없음) */}
              {selectedSocialId === "none" && (
                <div className="space-y-4 p-4 rounded-2xl bg-purple-50/30 border border-purple-100/50 animate-in slide-in-from-top-2 duration-200">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      {t("myinfo.custom_social_title")} *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder={
                        language === "KR"
                          ? "예: 솔땅 특별 정모"
                          : "e.g. Special Milonga"
                      }
                      value={customSocialTitle}
                      onChange={(e) => setCustomSocialTitle(e.target.value)}
                      className="w-full px-4 py-3 border border-[#e0e4e5] focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/20 rounded-xl text-sm font-bold text-[#2d3435] bg-white outline-none shadow-sm placeholder:text-[#acb3b4] placeholder:font-normal"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        {t("myinfo.custom_social_time")}
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 20:00 - 02:00"
                        value={customTime}
                        onChange={(e) => setCustomTime(e.target.value)}
                        className="w-full px-4 py-3 border border-[#e0e4e5] focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/20 rounded-xl text-sm font-bold text-[#2d3435] bg-white outline-none shadow-sm placeholder:text-[#acb3b4] placeholder:font-normal"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        {t("myinfo.custom_location")}
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Studio A"
                        value={customLocation}
                        onChange={(e) => setCustomLocation(e.target.value)}
                        className="w-full px-4 py-3 border border-[#e0e4e5] focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/20 rounded-xl text-sm font-bold text-[#2d3435] bg-white outline-none shadow-sm placeholder:text-[#acb3b4] placeholder:font-normal"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* 날짜 선택 */}
              {(selectedSocial || selectedSocialId === "none") && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {t("myinfo.date_label")}
                  </label>
                  {selectedSocialId === "none" ? (
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="w-full px-4 py-3 border border-[#e0e4e5] focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/20 rounded-xl text-sm font-bold text-[#2d3435] bg-white outline-none shadow-sm placeholder:text-[#acb3b4] placeholder:font-normal"
                    />
                  ) : selectedSocial?.type === "regular" ? (
                    <select
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="w-full px-4 py-3 border border-[#e0e4e5] rounded-xl text-sm font-bold text-[#2d3435] focus:outline-none focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/20 bg-white placeholder:text-[#acb3b4] placeholder:font-normal"
                    >
                      {suggestedDates.map((dateStr) => (
                        <option key={dateStr} value={dateStr}>
                          {new Date(dateStr).toLocaleDateString(dateLocale, {
                            month: "short",
                            day: "numeric",
                            weekday: "short",
                          })}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="date"
                      value={selectedDate}
                      disabled
                      className="w-full px-4 py-3 border border-[#e0e4e5] rounded-xl text-sm font-bold text-[#acb3b4] bg-[#f8f9fa] outline-none"
                    />
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Fixed Bottom Bar */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-100 px-4 shadow-lg flex gap-3 items-center justify-between"
        style={{
          zIndex: 100010,
          paddingTop: "16px",
          paddingBottom: Capacitor.isNativePlatform()
            ? "calc(16px + env(safe-area-inset-bottom))"
            : "16px",
          height: Capacitor.isNativePlatform()
            ? "calc(76px + env(safe-area-inset-bottom))"
            : "76px",
        }}
      >
        {currentStep > 1 && (
          <button
            type="button"
            onClick={() => setCurrentStep((prev) => prev - 1)}
            className="flex-grow py-3.5 rounded-full border border-slate-200 text-slate-700 text-sm font-bold active:scale-95 transition-transform"
          >
            {language === "KR" ? "이전 단계" : "Previous"}
          </button>
        )}
        <button
          type="button"
          onClick={() => {
            if (currentStep < 2) {
              setCurrentStep((prev) => prev + 1);
            } else {
              handleSubmit();
            }
          }}
          disabled={
            isSubmitting ||
            (currentStep === 2 &&
              !selectedSocialId)
          }
          className="flex-grow py-3.5 rounded-full bg-[#007AFF] text-white text-sm font-bold active:scale-95 transition-transform disabled:opacity-50"
        >
          {currentStep < 2
            ? language === "KR"
              ? "다음 단계"
              : "Next Step"
            : isSubmitting
            ? t("common.saving")
            : t("myinfo.dj_schedule_add")}
        </button>
      </div>
    </div>
  );
}
