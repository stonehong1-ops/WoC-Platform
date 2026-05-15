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

export function extractPosterData(social: Social): PosterData {
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

  return {
    title: social.title,
    titleNative: social.titleNative,
    dateStr,
    dayStr,
    timeStr,
    startTime: social.startTime,
    endTime: social.endTime,
    djName: social.djName,
    djNameNative: social.djNameNative,
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
