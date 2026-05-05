'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useCallback } from 'react';

/**
 * URL Search Params 기반의 모달/상세페이지 내비게이션을 관리하는 훅.
 * - 열기: router.push (히스토리 스택 추가)
 * - 닫기: router.back 또는 router.replace (히스토리 정리)
 */
export function useModalNavigation(key: string) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const value = searchParams.get(key);
  const isOpen = !!value;

  const openModal = useCallback((id: string, extraParams?: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set(key, id);
    if (extraParams) {
      Object.entries(extraParams).forEach(([k, v]) => params.set(k, v));
    }
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }, [router, searchParams, pathname, key]);

  const closeModal = useCallback(() => {
    if (!isOpen) return;

    // 현재 윈도우 히스토리 상태를 확인하여 안전하게 뒤로가기 시도
    // 만약 이전 히스토리가 없거나 앱 외부라면 replace를 통해 파라미터만 제거
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      const params = new URLSearchParams(searchParams.toString());
      params.delete(key);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }
  }, [router, searchParams, pathname, key, isOpen]);

  return {
    isOpen,
    value,
    openModal,
    closeModal,
    searchParams // 추가적인 파라미터 제어를 위해 반환
  };
}
