import { Social } from '@/types/social';

/**
 * WoC 실데이터 recurrence 규격: "every" | "1st" | "2nd" | "3rd" | "4th" | "last"
 * 쉼표로 다중 지정 가능 (예: "2nd,4th"). Purple 조사 문서의 weekly/monthly_first 같은
 * enum이 아니라 이 값 기준으로 판정한다 (src/lib/firebase/socialService.ts의
 * getTodayActiveSocials 내부 로직과 동일 기준으로 통일).
 */

function getWeekOrdinal(d: Date): number {
  return Math.ceil(d.getDate() / 7);
}

function isLastWeekOfMonth(d: Date): boolean {
  const currentMonth = d.getMonth();
  const nextWeekDate = new Date(d);
  nextWeekDate.setDate(d.getDate() + 7);
  return nextWeekDate.getMonth() !== currentMonth;
}

function toJsDate(value: any): Date | null {
  if (!value) return null;
  if (typeof value.toDate === 'function') return value.toDate();
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * 특정 날짜에 해당 Social이 실제로 열리는지 판정하는 단일 canonical 함수.
 * regular: dayOfWeek + recurrence(주차) 매칭. popup: date 단일 매칭.
 * 목록 필터, 국가/도시 count, weekly view 등 모든 곳에서 이 함수 하나만 사용한다.
 */
export function isSocialOccurringOnDate(social: Social, date: Date): boolean {
  if (social.type === 'popup') {
    const sDate = toJsDate(social.date);
    if (!sDate) return false;
    return sDate.toDateString() === date.toDateString();
  }

  // regular
  if (social.dayOfWeek === undefined || social.dayOfWeek === null) return false;
  if (Number(social.dayOfWeek) !== date.getDay()) return false;

  const rec = (social.recurrence || 'every').trim().toLowerCase();
  if (!rec) return true;
  const recParts = rec.split(',').map(x => x.trim());

  const ordinal = getWeekOrdinal(date);
  const isLast = isLastWeekOfMonth(date);

  return recParts.some(part => {
    if (part === 'every' || part === '') return true;
    if (part === '1st' && ordinal === 1) return true;
    if (part === '2nd' && ordinal === 2) return true;
    if (part === '3rd' && ordinal === 3) return true;
    if (part === '4th' && ordinal === 4) return true;
    if (part === 'last' && isLast) return true;
    return false;
  });
}

/** 주어진 Social 목록 중 특정 날짜에 실제로 열리는 것만 반환 */
export function filterSocialsOccurringOnDate(socials: Social[], date: Date): Social[] {
  return socials.filter(s => isSocialOccurringOnDate(s, date));
}
