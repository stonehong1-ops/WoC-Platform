import React, { useState } from "react";
import Image from "next/image";
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
          <Image 
            src={cls.imageUrl || ""} 
            alt={cls.title} 
            fill 
            className="object-cover opacity-75" 
            sizes="33vw" 
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
  openClassModal
}: TodayClassSectionProps) {
  const { t } = useLanguage();

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
        <div className="grid grid-cols-3 gap-2">
          {filteredClasses.slice(0, 6).map(({ cls, timeSlot }, idx) => (
            <ClassCard key={`${cls.id}-${idx}`} cls={cls} timeSlot={timeSlot} onPress={() => openClassModal(cls.id)} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-8 bg-white rounded-2xl border border-dashed border-slate-200">
          <span className="material-symbols-outlined !text-[32px] text-slate-300 mb-2">school</span>
          <p className="text-[13px] font-semibold text-slate-400">{t("today.no_class")}</p>
        </div>
      )}
    </section>
  );
}
