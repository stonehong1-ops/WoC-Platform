import React from "react";
import { Social } from "@/types/social";
import { useLanguage } from "@/contexts/LanguageContext";
import { detectSeoulDistrict, getVenueDisplay, formatInstructorNames, formatCommunityName } from "@/app/social/constants/seoulRegions";
import { getDjDisplay, getEventMessage } from "@/lib/utils/socialUtils";
import { SocialCardImage } from "@/components/social/SocialHeroCard";

interface TodaySocialSectionProps {
  loadingSocials: boolean;
  milongas: Social[];
  milongasSorted: (Social & { districtLabel: string })[];
  selectedDate: Date;
  venuesMap: Record<string, any>;
  openSocialModal: (id: string) => void;
  practicas: Social[];
  practicasSorted: (Social & { districtLabel: string })[];
  currentFilter: "all" | "social" | "class" | "practice" | "event";
}

export function SectionHeader({ icon, label, count }: {
  icon: string; label: string; count: number;
}) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="material-symbols-outlined !text-[24px] text-slate-500">{icon}</span>
      <span className="text-[19px] font-black text-[#1e293b] tracking-tight">{label}</span>
      {count > 0 && (
        <span className="text-[15px] font-bold text-slate-400">{count}</span>
      )}
    </div>
  );
}

function getRecurrenceDisplay(recurrence: string | undefined, t: (key: string) => string): string {
  if (!recurrence || recurrence === "every") return "";
  const parts = recurrence.split(",").map((p) => p.trim()).filter(Boolean);
  if (parts.length === 0) return "";

  if (parts.length === 1 && parts[0] === "last") {
    return t("social.recurrence.last_only");
  }

  const mappedParts = parts.map((part) => {
    if (part === "1st") return t("social.recurrence.1st");
    if (part === "2nd") return t("social.recurrence.2nd");
    if (part === "3rd") return t("social.recurrence.3rd");
    if (part === "4th") return t("social.recurrence.4th");
    if (part === "5th") return t("social.recurrence.5th");
    if (part === "last") return t("social.recurrence.last");
    return part;
  });

  return mappedParts.join(",") + t("social.recurrence.suffix");
}

function SocialCard({ social, date, venuesMap, onPress }: {
  social: Social; date: Date; venuesMap: Record<string, any>; onPress: () => void;
}) {
  const { t, language } = useLanguage();
  const djName = getDjDisplay(social, date, language);
  const hasDj = djName && djName.toUpperCase() !== "TBD" && djName.toUpperCase() !== "TBA" && djName.trim() !== "";
  const djFormatted = hasDj ? formatInstructorNames(djName, language) : "";
  const eventMessage = getEventMessage(social, date);
  const hasMessage = eventMessage && eventMessage.trim() !== "";

  const getOrgDisplay = () => {
    const ids = social.organizerIds;
    const enNames = social.organizerNames;
    const krNames = social.organizerNativeNames;

    if (ids && ids.length > 0 && enNames && enNames.length > 0) {
      return ids.map((_, i) => {
        const en = enNames[i] || "";
        const kr = krNames?.[i] || "";
        const picked = language === "KR" ? (kr || en) : (en || kr);
        return picked ? formatCommunityName(picked, language) : "";
      }).filter(Boolean).join(", ");
    }
    const orgRaw = language === "KR"
      ? (social.organizerNameNative || social.organizerName || "")
      : (social.organizerName || social.organizerNameNative || "");
    return orgRaw ? formatCommunityName(orgRaw, language) : "";
  };
  const orgFormatted = getOrgDisplay();

  const hasBoth = !!orgFormatted && !!djFormatted;
  const venue = formatCommunityName(getVenueDisplay(social, language, venuesMap), language);
  const shortVenue = venue.length > 8 ? venue.slice(0, 8) + "…" : venue;
  const recurrenceText = social.type === "regular" ? getRecurrenceDisplay(social.recurrence, t) : "";

  const hasPoster = social.posterLayoutId && social.posterLayoutId !== "none";
  const displayImageUrl = hasPoster ? social.imageUrl : (social.posterExportUrl || social.imageUrl);

  return (
    <button onClick={onPress} className="block w-full rounded-xl overflow-hidden relative shadow-sm text-left" style={{ aspectRatio: "3/4" }}>
      <div className="absolute inset-0 bg-[#12121e]">
        <SocialCardImage imageUrl={displayImageUrl} title={social.title} />
        {hasMessage && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center p-2 z-10">
            <span className="bg-rose-500 text-white text-[11px] font-black px-2.5 py-1 rounded-lg shadow-lg text-center max-w-full truncate">
              {eventMessage}
            </span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent pointer-events-none" />
      </div>
      <div className="absolute top-2 left-2 flex flex-col gap-1 items-start">
        <span className="bg-black/60 backdrop-blur-sm text-white text-[9px] font-black px-1.5 py-0.5 rounded-full leading-none">
          {social.startTime || "—"}
        </span>
        {social.type === "popup" && (
          <span className="bg-rose-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded-lg leading-none uppercase tracking-wide shadow-md">
            POPUP
          </span>
        )}
        {social.type === "regular" && recurrenceText && (
          <span className="bg-indigo-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded-lg leading-none uppercase tracking-wide shadow-md">
            {recurrenceText}
          </span>
        )}
      </div>
      {shortVenue && (
        <span className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-white text-[8px] font-black px-1.5 py-0.5 rounded-full leading-none shadow-sm max-w-[90px] truncate flex items-center gap-0.5">
          <span className="material-symbols-outlined !text-[8px]">location_on</span>{shortVenue}
        </span>
      )}
      <div className="absolute bottom-0 left-0 right-0 p-2 space-y-0.5">
        <p className="text-white font-black text-[13px] leading-tight line-clamp-2">
          {language === "KR" ? (social.titleNative || social.title) : (social.title || social.titleNative)}
        </p>
        {hasBoth ? (
          <>
            <p className="text-[10px] font-semibold truncate text-white/70">
              org {orgFormatted}
            </p>
            <p className="text-[10px] font-semibold truncate text-white/70">
              dj {djFormatted}
            </p>
          </>
        ) : (
          (orgFormatted || djFormatted) && (
            <p className="text-[10px] font-semibold truncate text-white/70">
              {orgFormatted ? `org ${orgFormatted}` : `dj ${djFormatted}`}
            </p>
          )
        )}
      </div>
    </button>
  );
}

export default function TodaySocialSection({
  loadingSocials,
  milongas,
  milongasSorted,
  selectedDate,
  venuesMap,
  openSocialModal,
  practicas,
  practicasSorted,
  currentFilter
}: TodaySocialSectionProps) {
  const { t, language } = useLanguage();

  const milongaCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    milongasSorted.forEach(s => {
      counts[s.districtLabel] = (counts[s.districtLabel] || 0) + 1;
    });
    return counts;
  }, [milongasSorted]);

  const practicaCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    practicasSorted.forEach(s => {
      counts[s.districtLabel] = (counts[s.districtLabel] || 0) + 1;
    });
    return counts;
  }, [practicasSorted]);

  const showMilonga = currentFilter === "all" || currentFilter === "social";
  const showPractica = currentFilter === "all" || currentFilter === "practice";

  return (
    <div className="space-y-7">
      {/* 밀롱가 섹션 */}
      {showMilonga && (
        <section>
          <SectionHeader icon="local_fire_department" label={t("today.milonga")} count={milongas.length} />

          {loadingSocials ? (
            <div className="grid grid-cols-3 gap-x-2 gap-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex flex-col gap-1">
                  <div className="h-4 w-12 bg-slate-100 rounded animate-pulse" />
                  <div className="rounded-xl bg-slate-200 animate-pulse w-full" style={{ aspectRatio: "3/4" }} />
                </div>
              ))}
            </div>
          ) : milongasSorted.length > 0 ? (
            <div className="grid grid-cols-3 gap-x-2 gap-y-4">
              {milongasSorted.map((s, index) => {
                const showHeader = index === 0 || milongasSorted[index - 1].districtLabel !== s.districtLabel;
                const count = milongaCounts[s.districtLabel] || 0;
                const displayLabel = count > 1 ? `${s.districtLabel}(${count})` : s.districtLabel;
                return (
                  <div key={s.id} className="flex flex-col gap-1">
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
                    <SocialCard social={s} date={selectedDate} venuesMap={venuesMap} onPress={() => openSocialModal(s.id)} />
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 bg-white rounded-2xl border border-dashed border-slate-200">
              <span className="material-symbols-outlined !text-[32px] text-slate-300 mb-2">music_off</span>
              <p className="text-[13px] font-semibold text-slate-400">{t("today.no_social")}</p>
            </div>
          )}
        </section>
      )}

      {/* 쁘락띠까 섹션 */}
      {showPractica && (
        <section>
          <SectionHeader icon="directions_run" label={t("today.practica")} count={practicas.length} />
          {loadingSocials ? (
            currentFilter === "practice" ? (
              <div className="grid grid-cols-3 gap-x-2 gap-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex flex-col gap-1">
                    <div className="h-4 w-12 bg-slate-100 rounded animate-pulse" />
                    <div className="rounded-xl bg-slate-200 animate-pulse w-full" style={{ aspectRatio: "3/4" }} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex gap-2 flex-wrap min-h-[32px]">
                {[1, 2, 3].map(i => <div key={i} className="h-8 w-24 rounded-full bg-slate-200 animate-pulse" />)}
              </div>
            )
          ) : practicasSorted.length > 0 ? (
            currentFilter === "practice" ? (
              /* 쁘락띠까 단독 필터: 지역 구분선 대신 카드 위 지역명 노출식 3열 Grid */
              <div className="animate-in fade-in duration-300">
                <div className="grid grid-cols-3 gap-x-2 gap-y-4">
                  {practicasSorted.map((s, index) => {
                    const showHeader = index === 0 || practicasSorted[index - 1].districtLabel !== s.districtLabel;
                    const count = practicaCounts[s.districtLabel] || 0;
                    const displayLabel = count > 1 ? `${s.districtLabel}(${count})` : s.districtLabel;
                    return (
                      <div key={s.id} className="flex flex-col gap-1">
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
                        <SocialCard social={s} date={selectedDate} venuesMap={venuesMap} onPress={() => openSocialModal(s.id)} />
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* 모두(all) 필터: 정렬된 순서대로 가로 칩 리스트 */
              <div className="flex gap-2 flex-wrap">
                {practicasSorted.map(s => {
                  const venueName = formatCommunityName(getVenueDisplay(s, language, venuesMap), language);
                  return (
                    <button
                      key={s.id}
                      onClick={() => openSocialModal(s.id)}
                      className="inline-flex flex-col items-start gap-0.5 bg-white border border-[#e0e4e5] rounded-2xl px-3.5 py-2 text-[13px] font-bold text-[#2d3435] shadow-sm active:scale-95 transition-transform"
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-orange-400 flex-shrink-0" />
                        <span>{s.titleNative || s.title}</span>
                      </div>
                      <div className="pl-3.5 text-[11px] font-semibold text-[#8e9a9c] whitespace-nowrap">
                        {s.startTime && `${s.startTime}`}
                        {venueName && ` • ${venueName}`}
                      </div>
                    </button>
                  );
                })}
              </div>
            )
          ) : (
            currentFilter === "practice" ? (
              <div className="flex flex-col items-center justify-center py-8 bg-white rounded-2xl border border-dashed border-slate-200">
                <span className="material-symbols-outlined !text-[32px] text-slate-300 mb-2">directions_run</span>
                <p className="text-[13px] font-semibold text-slate-400">
                  {language === "KR" ? "등록된 쁘락띠까가 없습니다." : "No practice sessions registered."}
                </p>
              </div>
            ) : (
              <div className="min-h-[32px] flex items-center">
                <p className="text-[13px] font-semibold text-slate-300">—</p>
              </div>
            )
          )}
        </section>
      )}
    </div>
  );
}
