import { Social } from '@/types/social';
import { isSocialOccurringOnDate } from './occurrence';

/**
 * GLOBAL 모드 전용 데이터 어댑터.
 * LOCAL 모드는 regionMapping.ts(matchLocationGroup 등, 한국 광역권 그룹핑)를 그대로 쓰고,
 * GLOBAL은 이 파일의 country/city 정확 매칭만 사용한다 (한국 지역 fuzzy 매칭 로직과 분리).
 *
 * 데이터 규격(기존 임포트된 소셜 기준): country/city는 대문자 영문 문자열
 * (예: "JAPAN"/"TOKYO", "GERMANY"/"BERLIN"). 국가 코드(ISO)가 아니라 이 표기를
 * canonical 값으로 사용한다.
 *
 * 국가/도시 "목록"(존재 여부)과 "오늘 occurrence count"는 서로 다른 데이터 소스에서 온다.
 * - 목록: allGlobalSocials (날짜 무관, 전체 해외 Social 1회성 로드) 기준으로 derive
 * - count: todaysSocials (선택 날짜에 실제 열리는 today-scoped Social) 기준으로 계산
 * 0건인 국가/도시도 목록에는 항상 노출하고, count만 0으로 표기한다.
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

/** allGlobalSocials 전체에서 존재하는 국가 목록 (날짜 무관) */
export function getAllGlobalCountries(allGlobalSocials: Social[]): string[] {
  const set = new Set<string>();
  allGlobalSocials.forEach(s => {
    if (isGlobalSocial(s)) set.add(getSocialCountry(s));
  });
  return Array.from(set).sort();
}

/** allGlobalSocials 전체에서 특정 국가에 존재하는 도시 목록 (날짜 무관) */
export function getAllGlobalCities(allGlobalSocials: Social[], country: string): string[] {
  const countryUpper = country.trim().toUpperCase();
  const set = new Set<string>();
  allGlobalSocials.forEach(s => {
    if (getSocialCountry(s) !== countryUpper) return;
    const city = getSocialCity(s);
    if (city) set.add(city);
  });
  return Array.from(set).sort();
}

/** 국가 목록(0건 포함) + 선택된 날짜의 실제 occurrence count */
export function countGlobalSocialsByCountry(allGlobalSocials: Social[], todaysSocials: Social[], date: Date): CountEntry[] {
  const countries = getAllGlobalCountries(allGlobalSocials);
  const counts: Record<string, number> = {};
  todaysSocials.forEach(s => {
    if (!isGlobalSocial(s)) return;
    if (!isSocialOccurringOnDate(s, date)) return;
    const country = getSocialCountry(s);
    counts[country] = (counts[country] || 0) + 1;
  });
  return countries
    .map(key => ({ key, count: counts[key] || 0 }))
    .sort((a, b) => b.count - a.count || a.key.localeCompare(b.key));
}

/** 특정 국가의 도시 목록(0건 포함) + 선택된 날짜의 실제 occurrence count */
export function countGlobalSocialsByCity(allGlobalSocials: Social[], todaysSocials: Social[], country: string, date: Date): CountEntry[] {
  const countryUpper = country.trim().toUpperCase();
  const cities = getAllGlobalCities(allGlobalSocials, countryUpper);
  const counts: Record<string, number> = {};
  todaysSocials.forEach(s => {
    if (getSocialCountry(s) !== countryUpper) return;
    if (!isSocialOccurringOnDate(s, date)) return;
    const city = getSocialCity(s);
    if (!city) return;
    counts[city] = (counts[city] || 0) + 1;
  });
  return cities
    .map(key => ({ key, count: counts[key] || 0 }))
    .sort((a, b) => b.count - a.count || a.key.localeCompare(b.key));
}

/** 특정 국가(+선택적 도시)에서, 선택된 날짜에 실제로 열리는 Social 목록. city가 비어있으면(ALL) 국가 전체 */
export function filterGlobalSocials(socials: Social[], country: string, city: string, date: Date): Social[] {
  const countryUpper = country.trim().toUpperCase();
  const cityUpper = city.trim().toUpperCase();
  return socials.filter(s => {
    if (getSocialCountry(s) !== countryUpper) return false;
    if (cityUpper && cityUpper !== 'ALL' && getSocialCity(s) !== cityUpper) return false;
    return isSocialOccurringOnDate(s, date);
  });
}

/** city=ALL 렌더링용: 도시별로 그룹핑 (도시명 오름차순, 그룹 내부는 시작시간순) */
export function groupGlobalSocialsByCity(socials: Social[]): { city: string; socials: Social[] }[] {
  const groups: Record<string, Social[]> = {};
  socials.forEach(s => {
    const city = getSocialCity(s) || '—';
    if (!groups[city]) groups[city] = [];
    groups[city].push(s);
  });
  return Object.entries(groups)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([city, list]) => ({
      city,
      socials: [...list].sort((a, b) => (a.startTime || '').localeCompare(b.startTime || '')),
    }));
}
