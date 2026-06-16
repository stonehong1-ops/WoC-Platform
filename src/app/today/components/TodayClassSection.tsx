import React, { useState } from "react";
import { GroupClass } from "@/types/group";
import { useLanguage } from "@/contexts/LanguageContext";
import { SectionHeader } from "./TodaySocialSection";
import { formatInstructorNames, formatCommunityName } from "@/app/social/constants/seoulRegions";

interface ClassEntry {
  cls: GroupClass;
  timeSlot: string;
}

interface TodayClassSectionProps {
  loadingClasses: boolean;
  filteredClasses: ClassEntry[];
  openClassModal: (id: string) => void;
  classesSorted: (ClassEntry & { districtLabel: string })[];
  currentFilter: "all" | "social" | "class" | "practice" | "event";
  venuesMap: Record<string, any>;
}

function ClassCard({ cls, timeSlot, onPress }: { cls: GroupClass; timeSlot: string; onPress: () => void }) {
  const { language } = useLanguage();
  const [imageError, setImageError] = useState(false);
  const getInstructorsLabel = (instructors: any[]) => {
    if (!instructors || instructors.length === 0) return "";
    const formattedNames = instructors.map(i => formatInstructorNames(i.name || "", language));
    if (formattedNames.length === 1) return formattedNames[0];
    if (formattedNames.length === 2) return `${formattedNames[0]}, ${formattedNames[1]}`;
    return `${formattedNames[0]}, ${formattedNames[1]}, ...`;
  };

  const hasImage = cls.imageUrl && !imageError;

  return (
    <button onClick={onPress} className="block w-full text-left">
      <div className="relative rounded-xl overflow-hidden bg-[#1a1a2e] shadow-md" style={{ aspectRatio: "1/1" }}>
        {hasImage ? (
          <img 
            src={cls.imageUrl || ""} 
            alt={cls.title} 
            className="absolute inset-0 w-full h-full object-cover opacity-75" 
            loading="lazy"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 to-purple-900 flex items-center justify-center">
            <span className="material-symbols-outlined text-white/10 text-5xl">school</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
        {timeSlot && (
          <div className="absolute top-2 left-2">
            <span className="bg-[#007AFF]/80 backdrop-blur-sm text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">
              {timeSlot}
            </span>
          </div>
        )}
        <div className="absolute bottom-0 left-0 right-0 p-2">
          <p className="text-white font-black text-[11px] leading-tight line-clamp-2">{formatCommunityName(cls.title, language)}</p>
          {cls.instructors && cls.instructors.length > 0 && (
            <p className="text-white/60 text-[10px] font-semibold mt-0.5 truncate">
              {getInstructorsLabel(cls.instructors)}
            </p>
          )}
        </div>
      </div>
    </button>
  );
}

export default function TodayClassSection({
  loadingClasses,
  filteredClasses,
  openClassModal,
  classesSorted,
  currentFilter,
  venuesMap
}: TodayClassSectionProps) {
  const { t, language } = useLanguage();

  const classCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    classesSorted.forEach(c => {
      counts[c.districtLabel] = (counts[c.districtLabel] || 0) + 1;
    });
    return counts;
  }, [classesSorted]);

  return (
    <section>
      <SectionHeader icon="school" label={t("today.class")} count={filteredClasses.length} />
      {loadingClasses ? (
        <div className="grid grid-cols-3 gap-2">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="rounded-xl bg-slate-200 animate-pulse" style={{ aspectRatio: "1/1" }} />
          ))}
        </div>
      ) : filteredClasses.length > 0 ? (
        currentFilter === "class" ? (
          /* 클래스 단독 필터: 홍대/강남 구획 구분선 제거식 3열 Grid */
          <div className="space-y-5 animate-in fade-in duration-300">
            <div className="grid grid-cols-3 gap-x-2 gap-y-4">
              {classesSorted.map(({ cls, timeSlot, districtLabel }, index) => {
                const showHeader = index === 0 || classesSorted[index - 1].districtLabel !== districtLabel;
                const count = classCounts[districtLabel] || 0;
                const displayLabel = count > 1 ? `${districtLabel}(${count})` : districtLabel;
                return (
                  <div key={`${cls.id}-${index}`} className="flex flex-col gap-1">
                    <div className="h-4 flex items-center gap-0.5 text-slate-500">
                      {showHeader ? (
                        <>
                          <span className="material-symbols-outlined !text-[12px] text-blue-500">location_on</span>
                          <span className="text-[10px] font-black uppercase tracking-widest">{displayLabel}</span>
                        </>
                      ) : (
                        <span className="text-[10px] opacity-0 pointer-events-none">—</span>
                      )}
                    </div>
                    <ClassCard cls={cls} timeSlot={timeSlot} onPress={() => openClassModal(cls.id)} />
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* 모두(all) 필터: 정렬 완료된 상위 6개 카드 그리드 */
          <div className="grid grid-cols-3 gap-2">
            {classesSorted.slice(0, 6).map(({ cls, timeSlot }, idx) => (
              <ClassCard key={`${cls.id}-${idx}`} cls={cls} timeSlot={timeSlot} onPress={() => openClassModal(cls.id)} />
            ))}
          </div>
        )
      ) : (
        <div className="flex flex-col items-center justify-center py-8 bg-white rounded-2xl border border-dashed border-slate-200">
          <span className="material-symbols-outlined !text-[32px] text-slate-300 mb-2">school</span>
          <p className="text-[13px] font-semibold text-slate-400">
            {language === "KR" ? "등록된 클래스가 없습니다." : "No class sessions registered."}
          </p>
        </div>
      )}
    </section>
  );
}
