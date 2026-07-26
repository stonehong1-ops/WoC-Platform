// 클래스 요일별/시간순 스케줄을 포스터 카드 이미지로 렌더링하고 이미지 다운로드 저장을 지원하는 모달
"use client";

import React, { useRef, useState } from "react";
import { motion } from "framer-motion";
import { Group, GroupClass, ClassDiscount } from "@/types/group";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";
import html2canvas from "html2canvas-pro";

interface GroupClassScheduleImageModalProps {
  group: Group;
  monthDisplay: string;
  sortedClasses: GroupClass[];
  filteredDiscounts: ClassDiscount[];
  onClose: () => void;
}

const DAY_ORDER = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'] as const;
const DAY_NAMES_KR: { [key: string]: string } = {
  'MON': '월요일', 'TUE': '화요일', 'WED': '수요일',
  'THU': '목요일', 'FRI': '금요일', 'SAT': '토요일', 'SUN': '일요일'
};

const INSTRUCTOR_NAME_MAP: { [key: string]: string } = {
  'Aran': '아란', 'Stone Hong': '스톤 홍', 'Ariskim': '아리스킴',
  'Muse': '뮤즈', 'Vicky': '비키', 'Epitone': '에피톤',
  'EUN JU CHOI': '최은주', 'Ellin': '엘린', 'Basil': '바질',
  'May': '메이', 'Dandoon_Hyeyoung': '단둔 혜영', 'Yun': '윤'
};

const getKoreanName = (engName: string): string => {
  return INSTRUCTOR_NAME_MAP[engName] || engName;
};

function getDayOfWeek(dateStr: string): string {
  if (!dateStr) return '';
  const cleanDate = dateStr.replace(/\./g, '-');
  const d = new Date(cleanDate);
  if (isNaN(d.getTime())) return '';
  return ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'][d.getDay()];
}

const getClassDay = (cls: any): string => {
  if (cls.schedule && cls.schedule.length > 0) {
    const day = getDayOfWeek(cls.schedule[0].date);
    return day || 'MON';
  }
  return 'MON';
};

const GroupClassScheduleImageModal: React.FC<GroupClassScheduleImageModalProps> = ({
  group,
  monthDisplay,
  sortedClasses,
  filteredDiscounts,
  onClose,
}) => {
  const { t } = useLanguage();
  const cardRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadImage = async () => {
    if (!cardRef.current) return;
    setIsDownloading(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
      });

      const fileName = `${group.name.replace(/\s+/g, "_")}_${monthDisplay.replace(/\s+/g, "_")}_Schedule.png`;
      const dataUrl = canvas.toDataURL("image/png");

      const link = document.createElement("a");
      link.download = fileName;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("스케줄 이미지가 저장되었습니다.");
    } catch (err) {
      console.error("Failed to generate schedule image:", err);
      toast.error("이미지 저장 중 오류가 발생했습니다.");
    } finally {
      setIsDownloading(false);
    }
  };

  // 요일별 클래스 그룹화
  const classesByDay: { [key: string]: typeof sortedClasses } = {
    MON: [], TUE: [], WED: [], THU: [], FRI: [], SAT: [], SUN: []
  };

  sortedClasses.forEach(cls => {
    const day = getClassDay(cls);
    if (classesByDay[day]) {
      classesByDay[day].push(cls);
    } else {
      classesByDay['MON'].push(cls);
    }
  });

  DAY_ORDER.forEach(day => {
    classesByDay[day].sort((a, b) => {
      const timeA = a.schedule?.[0]?.timeSlot?.split(" - ")[0] || "00:00";
      const timeB = b.schedule?.[0]?.timeSlot?.split(" - ")[0] || "00:00";
      return timeA.localeCompare(timeB);
    });
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: "100%" }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: "100%" }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="fixed inset-0 z-[1000] bg-black/80 flex flex-col items-center justify-center font-['Inter',sans-serif] overflow-hidden"
    >
      <div className="w-full max-w-[896px] h-[100dvh] flex flex-col bg-[#f8f9fa] relative pt-[env(safe-area-inset-top,0px)] pb-[env(safe-area-inset-bottom,0px)]">
        {/* Top Header */}
        <div className="bg-white border-b border-[#e0e4e5] px-4 h-14 flex items-center justify-between shrink-0 shadow-sm">
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-slate-100 text-slate-700 active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          </button>
          <h2 className="text-base font-bold text-slate-800">
            {monthDisplay} 수업 스케줄
          </h2>
          <button
            onClick={handleDownloadImage}
            disabled={isDownloading}
            className="px-3.5 py-1.5 bg-[#007AFF] hover:bg-[#0066CC] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 active:scale-95 transition-all shadow-sm disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[16px]">download</span>
            <span>{isDownloading ? "저장 중..." : "이미지 저장"}</span>
          </button>
        </div>

        {/* Scrollable Preview Area */}
        <div className="flex-1 overflow-y-auto p-4 flex justify-center no-scrollbar">
          {/* Target Capture Area (외곽 중첩 보더 정리 -> 단일 세련 카드) */}
          <div
            ref={cardRef}
            className="w-full max-w-[600px] bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-5 text-left"
          >
            {/* Poster Brand Header */}
            <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#007AFF] bg-[#007AFF]/10 px-2.5 py-0.5 rounded-full">
                  CLASS SCHEDULE
                </span>
                <h1 className="text-xl font-black text-slate-900 mt-1">{group.name}</h1>
                <p className="text-xs font-bold text-slate-500 mt-0.5">{monthDisplay} 수업 스케줄</p>
              </div>
              {group.logo && (
                <img src={group.logo} alt="Logo" className="w-12 h-12 rounded-xl object-cover border border-slate-100" />
              )}
            </div>

            {/* 번들 할인 패키지 목록 (있는 경우) */}
            {filteredDiscounts.length > 0 && (
              <div className="space-y-2 bg-[#f8f9fa] border border-[#e0e4e5] rounded-xl p-3.5">
                <div className="flex items-center gap-1.5 text-rose-600 font-bold text-xs">
                  <span className="material-symbols-outlined text-[16px]">sell</span>
                  <span>번들 패키지 혜택</span>
                </div>
                <div className="space-y-2 pt-1">
                  {filteredDiscounts.map(d => (
                    <div key={d.id} className="bg-white rounded-lg p-2.5 border border-slate-200 flex items-center justify-between text-xs">
                      <div>
                        <strong className="text-slate-800 font-bold">{d.title}</strong>
                        {d.discountDescription && <p className="text-[11px] text-slate-500">{d.discountDescription}</p>}
                      </div>
                      <span className="font-bold text-[#007AFF]">
                        {d.amount === 0 ? "무료" : `₩${d.amount.toLocaleString()}`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 요일별 클래스 포스터 렌더링 */}
            <div className="space-y-4">
              {DAY_ORDER.map(day => {
                const dayClasses = classesByDay[day];
                if (!dayClasses || dayClasses.length === 0) return null;

                return (
                  <div key={day} className="space-y-2">
                    <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
                      <span className="w-2 h-2 rounded-full bg-[#007AFF]" />
                      <h3 className="text-xs font-bold text-slate-900">
                        {DAY_NAMES_KR[day]} ({day})
                      </h3>
                    </div>

                    <div className="space-y-2">
                      {dayClasses.map(cls => {
                        const firstSchedule = cls.schedule?.[0];
                        const startTime = firstSchedule?.timeSlot?.split(" - ")[0] || "";
                        const endTime = firstSchedule?.timeSlot?.split(" - ")[1] || "";
                        const timeDisplay = startTime && endTime ? `${startTime} ~ ${endTime}` : (firstSchedule?.timeSlot || "시간 미정");
                        const allInstructorsStr = cls.instructors && cls.instructors.length > 0
                          ? cls.instructors.map(i => getKoreanName(i.name)).join(", ")
                          : '강사 미정';

                        return (
                          <div key={cls.id} className="bg-[#f8f9fa] border border-[#e0e4e5] rounded-xl p-3 flex items-start justify-between gap-3 text-xs">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-[11px] font-bold text-[#007AFF] bg-white border border-[#007AFF]/20 px-2 py-0.5 rounded-full">
                                  ⏰ {timeDisplay}
                                </span>
                                {cls.level && (
                                  <span className="text-[10px] font-bold text-slate-600 bg-slate-200/60 px-2 py-0.5 rounded-full">
                                    {cls.level}
                                  </span>
                                )}
                              </div>
                              <h4 className="text-sm font-bold text-slate-800">{cls.title}</h4>
                              <p className="text-[11px] text-slate-600">강사: <strong>{allInstructorsStr}</strong></p>
                            </div>
                            <div className="text-sm font-bold text-slate-900 shrink-0 pt-1">
                              {cls.amount === 0 ? "무료" : `₩${cls.amount.toLocaleString()}`}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default GroupClassScheduleImageModal;
