import { Timestamp } from 'firebase/firestore';

/**
 * safeDate
 * Firestore Timestamp, JS Date, ISO string, number, null, undefined
 * 어떤 타입이 들어와도 안전하게 Date 객체로 변환합니다.
 * 변환 불가능한 경우 null을 반환합니다 (절대 에러를 던지지 않음).
 */
export function safeDate(value: unknown): Date | null {
  if (!value) return null;

  try {
    // Firestore Timestamp
    if (value instanceof Timestamp) {
      return value.toDate();
    }

    // Firestore-like object with toDate method (e.g., from onSnapshot cache)
    if (typeof value === 'object' && typeof (value as any).toDate === 'function') {
      const result = (value as any).toDate();
      if (result instanceof Date && !isNaN(result.getTime())) return result;
      return null;
    }

    // JS Date
    if (value instanceof Date) {
      return isNaN(value.getTime()) ? null : value;
    }

    // Unix timestamp in milliseconds (number)
    if (typeof value === 'number') {
      const d = new Date(value);
      return isNaN(d.getTime()) ? null : d;
    }

    // ISO string
    if (typeof value === 'string') {
      const d = new Date(value);
      return isNaN(d.getTime()) ? null : d;
    }

    // Firestore Timestamp-like plain object { seconds, nanoseconds }
    if (
      typeof value === 'object' &&
      typeof (value as any).seconds === 'number'
    ) {
      const d = new Date((value as any).seconds * 1000);
      return isNaN(d.getTime()) ? null : d;
    }
  } catch {
    // 어떤 에러든 조용히 null 반환
  }

  return null;
}

/**
 * safeDateString
 * safeDate 결과를 바로 포맷 문자열로 반환합니다.
 * 변환 불가 시 fallback 문자열을 반환합니다.
 */
export function safeDateString(
  value: unknown,
  formatter: (date: Date) => string,
  fallback = '-'
): string {
  const date = safeDate(value);
  if (!date) return fallback;
  try {
    return formatter(date);
  } catch {
    return fallback;
  }
}

/**
 * safeArray
 * value가 배열이 아닌 경우(undefined, null, 잘못된 타입 등)
 * 빈 배열을 반환합니다. .map() on undefined 크래시를 방지합니다.
 */
export function safeArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  return [];
}

/**
 * safeString
 * undefined/null/비배열 값을 안전하게 문자열로 변환합니다.
 * 변환 불가 시 fallback을 반환합니다.
 */
export function safeString(value: unknown, fallback = ''): string {
  if (typeof value === 'string') return value;
  if (value === null || value === undefined) return fallback;
  try {
    return String(value);
  } catch {
    return fallback;
  }
}

/**
 * safeNumber
 * undefined/null/비숫자 값을 안전하게 숫자로 변환합니다.
 * 변환 불가 시 fallback(기본 0)을 반환합니다.
 */
export function safeNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && !isNaN(value)) return value;
  if (typeof value === 'string') {
    const n = Number(value);
    if (!isNaN(n)) return n;
  }
  return fallback;
}
