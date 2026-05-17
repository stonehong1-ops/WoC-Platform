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

    // router.back() 대신 replace()로 현재 파라미터만 제거.
    // 임베드 컴포넌트(GroupHome 등)에서 router.back()을 쓰면
    // 히스토리 스택을 거슬러 올라가 엉뚱한 페이지로 이동하는 버그가 있어,
    // 항상 replace로 해당 key만 URL에서 지워 모달을 닫는다.
    const params = new URLSearchParams(searchParams.toString());
    params.delete(key);
    const newQuery = params.toString();
    router.replace(`${pathname}${newQuery ? `?${newQuery}` : ''}`, { scroll: false });
  }, [router, searchParams, pathname, key, isOpen]);

  return {
    isOpen,
    value,
    openModal,
    closeModal,
    searchParams // 추가적인 파라미터 제어를 위해 반환
  };
}
