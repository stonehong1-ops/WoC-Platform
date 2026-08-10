'use client';

import { useCallback, useMemo } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';

export type SocialScope = 'local' | 'global';

function pad(n: number): string {
  return n.toString().padStart(2, '0');
}

export function dateToYmd(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function ymdToDate(ymd: string | null): Date | null {
  if (!ymd) return null;
  const parts = ymd.split('-').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return null;
  const [y, m, d] = parts;
  const date = new Date(y, m - 1, d);
  return isNaN(date.getTime()) ? null : date;
}

/**
 * /social의 scope(local|global)/country/city/date를 URL Query Parameter를
 * canonical state로 관리하는 훅. 값 변경은 router.replace로 처리해
 * (히스토리 스택을 어지럽히지 않음) 상세페이지 진입(useModalNavigation의 push)만
 * 별도 back 스택 엔트리를 남기도록 한다 — 뒤로가기 시 자동으로 직전 scope/country/
 * city/date로 복귀된다.
 */
export function useSocialScope() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const scope: SocialScope = searchParams.get('scope') === 'global' ? 'global' : 'local';
  const country = searchParams.get('country') || '';
  const city = searchParams.get('city') || '';
  const dateParam = searchParams.get('date');

  const date = useMemo(() => ymdToDate(dateParam) || new Date(), [dateParam]);

  const updateParams = useCallback((updates: Record<string, string | null>) => {
    const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : searchParams.toString());
    Object.entries(updates).forEach(([k, v]) => {
      if (v === null || v === '') {
        params.delete(k);
      } else {
        params.set(k, v);
      }
    });
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [router, pathname, searchParams]);

  const setScope = useCallback((next: SocialScope) => {
    if (next === 'local') {
      // Local 복귀 시 Global 전용 파라미터는 정리
      updateParams({ scope: null, country: null, city: null });
    } else {
      updateParams({ scope: 'global' });
    }
  }, [updateParams]);

  const setCountry = useCallback((next: string) => {
    updateParams({ country: next || null, city: null });
  }, [updateParams]);

  const setCity = useCallback((next: string) => {
    updateParams({ city: next || null });
  }, [updateParams]);

  const setDate = useCallback((next: Date) => {
    updateParams({ date: dateToYmd(next) });
  }, [updateParams]);

  return { scope, country, city, date, setScope, setCountry, setCity, setDate };
}
