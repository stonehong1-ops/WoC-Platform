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

    const params = new URLSearchParams(searchParams.toString());
    params.delete(key);
    const newQuery = params.toString();
    router.replace(`${pathname}${newQuery ? `?${newQuery}` : ''}`, { scroll: false });

    // Next.js App Router의 쿼리 파라미터 변경 미감지 버그 대응을 위해 popstate 이벤트를 강제 트리거합니다.
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new PopStateEvent('popstate'));
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
