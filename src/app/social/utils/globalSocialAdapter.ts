import { Social } from '@/types/social';
import { isSocialOccurringOnDate } from './occurrence';

/**
 * GLOBAL 모드 전용 데이터 어댑터.
 * LOCAL 모드는 regionMapping.ts(matchLocationGroup 등, 한국 광역권 그룹핑)를 그대로 쓰고,
 * GLOBAL은 이 파일의 country/city 정확 매칭만 사용한다 (한국 지역 fuzzy 매칭 로직과 분리).
 *
 * 데이터 규격(기존 임포트된 161건 기준): country/city는 대문자 영문 문자열
 * (예: "JAPAN"/"TOKYO", "GERMANY"/"BERLIN"). 국가 코드(ISO)가 아니라 이 표기를
 * canonical 값으로 사용한다.
 */

export const KOREA_COUNTRY_NAMES = ['KOREA', 'KR', 'SOUTH KOREA'];

export function getSocialCountry(social: Social): string {
  return (social.country || '').trim().toUpperCase();
}

export function getSocialCity(social: Social): string {
  return (social.city || '').trim().toUpperCase();
}

/** LOCAL(한국) 데이터를 제외한, 실제 해외 Social만 추려낸다 */
export function isGlobalSocial(social: Social): boolean {
  const country = getSocialCountry(social);
  if (!country) return false;
  return !KOREA_COUNTRY_NAMES.includes(country);
}

export interface CountEntry {
  key: string;
  count: number;
}

/** 선택된 날짜에 실제로 열리는 해외 Social들의 국가별 count (0건 국가는 결과에 없음) */
export function countGlobalSocialsByCountry(socials: Social[], date: Date): CountEntry[] {
  const counts: Record<string, number> = {};
  socials.forEach(s => {
    if (!isGlobalSocial(s)) return;
    if (!isSocialOccurringOnDate(s, date)) return;
    const country = getSocialCountry(s);
    counts[country] = (counts[country] || 0) + 1;
  });
  return Object.entries(counts)
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count || a.key.localeCompare(b.key));
}

/** 특정 국가 내, 선택된 날짜에 실제로 열리는 Social들의 도시별 count */
export function countGlobalSocialsByCity(socials: Social[], country: string, date: Date): CountEntry[] {
  const countryUpper = country.trim().toUpperCase();
  const counts: Record<string, number> = {};
  socials.forEach(s => {
    if (getSocialCountry(s) !== countryUpper) return;
    if (!isSocialOccurringOnDate(s, date)) return;
    const city = getSocialCity(s);
    if (!city) return;
    counts[city] = (counts[city] || 0) + 1;
  });
  return Object.entries(counts)
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count || a.key.localeCompare(b.key));
}

/** 특정 국가+도시에서, 선택된 날짜에 실제로 열리는 Social 목록 */
export function filterGlobalSocials(socials: Social[], country: string, city: string, date: Date): Social[] {
  const countryUpper = country.trim().toUpperCase();
  const cityUpper = city.trim().toUpperCase();
  return socials.filter(s => {
    if (getSocialCountry(s) !== countryUpper) return false;
    if (cityUpper && getSocialCity(s) !== cityUpper) return false;
    return isSocialOccurringOnDate(s, date);
  });
}
