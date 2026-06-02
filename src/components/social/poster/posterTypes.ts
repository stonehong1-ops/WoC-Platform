import { Social } from "@/types/social";

export interface PosterData {
  title: string;
  titleNative?: string;
  dateStr: string;
  dayStr: string;
  timeStr: string;
  startTime: string;
  endTime: string;
  djName?: string;
  djNameNative?: string;
  djPhotoUrl?: string; // DJ 프로필 이미지 자동 매핑용
  orgName: string;
  orgNameNative?: string;
  orgPhone?: string;
  fee?: string;
  venueName: string;
  venueNameNative?: string;
  venueLocation?: string;
  imageUrl?: string;
}

export interface PosterLayoutDef {
  id: string;
  name: string;
}

const DAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

export function getUpcomingDateStr(dayOfWeek: number, endTimeStr?: string): string {
  const today = new Date();
  let diff = dayOfWeek - today.getDay();
  
  if (diff < 0) {
    diff += 7;
  } else if (diff === 0) {
    if (endTimeStr) {
      const [endHour, endMin] = endTimeStr.split(":").map(Number);
      const nowHour = today.getHours();
      const nowMin = today.getMinutes();
      if (!isNaN(endHour) && (nowHour > endHour || (nowHour === endHour && nowMin >= (endMin || 0)))) {
        diff = 7;
      }
    }
  }
  
  const targetDate = new Date(today);
  targetDate.setDate(today.getDate() + diff);
  
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${targetDate.getFullYear()}-${pad(targetDate.getMonth() + 1)}-${pad(targetDate.getDate())}`;
}

export function extractPosterData(social: Social, targetDateStr?: string): PosterData {
  const date = social.date?.toDate();
  let dateStr = "";
  let dayStr = "";

  if (social.type === "regular") {
    dayStr = DAYS[social.dayOfWeek || 0];
    dateStr = "Every";
  } else if (date) {
    dateStr = `${date.getMonth() + 1}.${date.getDate()}`;
    dayStr = DAYS[date.getDay()];
  }

  // Format target date for DJ mapping
  let resolvedTargetDate = targetDateStr;
  if (!resolvedTargetDate) {
    if (social.type === "popup" && social.date) {
      const d = typeof social.date.toDate === 'function' ? social.date.toDate() : new Date(social.date as any);
      const pad = (n: number) => n.toString().padStart(2, '0');
      resolvedTargetDate = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    } else if (social.type === "regular" && social.dayOfWeek !== undefined) {
      resolvedTargetDate = getUpcomingDateStr(social.dayOfWeek, social.endTime);
    }
  }

  // Format time: "PM 6-10" style
  const formatTimeShort = (t: string) => {
    if (!t) return "";
    const [h] = t.split(":");
    const hour = parseInt(h, 10);
    if (isNaN(hour)) return t;
    const suffix = hour >= 12 ? "PM" : "AM";
    const h12 = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${suffix} ${h12}`;
  };

  const startShort = formatTimeShort(social.startTime);
  const endHour = social.endTime?.split(":")[0] || "";
  const endH = parseInt(endHour, 10);
  const end12 = endH > 12 ? endH - 12 : endH === 0 ? 12 : endH;
  const timeStr = startShort && end12 ? `${startShort}-${end12}` : `${social.startTime} - ${social.endTime}`;

  // Clean up price: handle duplicate values like "13,000 13000"
  let fee = social.price;
  if (fee) {
    const parts = fee.trim().split(/\s+/);
    fee = parts[0]; // take first value
    if (fee && !fee.startsWith("₩") && !fee.toLowerCase().includes("free")) {
      fee = `₩${fee}`;
    }
  }

  // Dynamic DJ Mapping for target date
  let djName = social.djName || "";
  if (social.type === "regular" && resolvedTargetDate) {
    if (social.djs && Array.isArray(social.djs) && social.djs.length > 0) {
      const matched = social.djs.find(dj => dj && dj.date === resolvedTargetDate);
      if (matched && matched.djName) {
        djName = matched.djName;
      } else {
        djName = "미정";
      }
    }
  }

  return {
    title: social.title,
    titleNative: social.titleNative,
    dateStr,
    dayStr,
    timeStr,
    startTime: social.startTime,
    endTime: social.endTime,
    djName,
    djNameNative: social.djNameNative,
    djPhotoUrl: (social as any).djPhotoUrl, // social의 djPhotoUrl 매핑
    orgName: social.organizerName,
    orgNameNative: social.organizerNameNative,
    orgPhone: social.organizerPhone,
    fee,
    venueName: social.venueName,
    venueNameNative: social.venueNameNative,
    venueLocation: [social.district, social.city].filter(Boolean).join(", "),
    imageUrl: social.imageUrl,
  };
}
