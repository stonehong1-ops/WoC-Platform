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

export function getDjDisplay(social: Social, targetDate?: Date): string {
  if (social.djs && social.djs.length > 0) {
    const nextEventDate = targetDate || getNextEventDateObj(social);
    
    if (nextEventDate) {
      const year = nextEventDate.getFullYear();
      const month = String(nextEventDate.getMonth() + 1).padStart(2, '0');
      const day = String(nextEventDate.getDate()).padStart(2, '0');
      const nextEventDateStr = `${year}-${month}-${day}`;

      const matchedDj = social.djs.find(d => d.date === nextEventDateStr);
      if (matchedDj) {
        return matchedDj.djName;
      } else {
        if (social.type === "regular") return "TBD";
      }
    } else {
      const sorted = [...social.djs].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      const today = new Date();
      today.setHours(0,0,0,0);
      const nextDj = sorted.find(d => new Date(d.date) >= today);
      if (nextDj) return nextDj.djName;
    }
  }
  return social.djName ? social.djName : "TBD";
}
