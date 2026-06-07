import { Social } from '@/types/social';

export function getNextEventDateObj(social: Social): Date | null {
  if (social.type === "popup" && social.date) {
    return typeof social.date.toDate === "function" ? social.date.toDate() : new Date(social.date as any);
  }
  if (social.type === "regular" && social.dayOfWeek !== undefined) {
    const today = new Date();
    today.setHours(0,0,0,0);
    const diff = (social.dayOfWeek - today.getDay() + 7) % 7;
    const next = new Date(today);
    next.setDate(today.getDate() + diff);
    return next;
  }
  return null;
}

export function getDjDisplay(social: Social, targetDate?: Date, locale: string = "KR"): string {
  if (social.djs && social.djs.length > 0) {
    const nextEventDate = targetDate || getNextEventDateObj(social);
    
    if (nextEventDate) {
      const year = nextEventDate.getFullYear();
      const month = String(nextEventDate.getMonth() + 1).padStart(2, '0');
      const day = String(nextEventDate.getDate()).padStart(2, '0');
      const nextEventDateStr = `${year}-${month}-${day}`;

      const matchedDj = social.djs.find(d => d.date === nextEventDateStr);
      if (matchedDj) {
        if (locale === "KR") {
          return matchedDj.djNativeName || matchedDj.djName;
        }
        return matchedDj.djName;
      }
    } else {
      const sorted = [...social.djs].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      const today = new Date();
      today.setHours(0,0,0,0);
      const nextDj = sorted.find(d => new Date(d.date) >= today);
      if (nextDj) {
        if (locale === "KR") {
          return nextDj.djNativeName || nextDj.djName;
        }
        return nextDj.djName;
      }
    }
  }
  return "TBD";
}

export function isVideoUrl(url?: string, fileType?: string): boolean {
  if (!url) return false;
  if (url.startsWith('blob:')) {
    return fileType?.startsWith('video/') || false;
  }
  const decoded = decodeURIComponent(url.split('?')[0]).toLowerCase();
  return decoded.endsWith('.mp4') || decoded.endsWith('.mov') || decoded.endsWith('.webm') || decoded.endsWith('.m3u8') || decoded.endsWith('.avi');
}

export function getEventMessage(social: Social, targetDate?: Date): string | null {
  if (social.type === "regular" && social.djs && social.djs.length > 0) {
    const nextEventDate = targetDate || getNextEventDateObj(social);
    if (nextEventDate) {
      const year = nextEventDate.getFullYear();
      const month = String(nextEventDate.getMonth() + 1).padStart(2, '0');
      const day = String(nextEventDate.getDate()).padStart(2, '0');
      const nextEventDateStr = `${year}-${month}-${day}`;

      const matchedDj = social.djs.find(d => d.date === nextEventDateStr);
      if (matchedDj && matchedDj.message) {
        return matchedDj.message.trim().slice(0, 10);
      }
    }
  }
  return null;
}
