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

    // router.back() 사용 시 딥링크나 새로고침 후 모달 닫기 시 이전 사이트(예: 페이스북)로 이탈하는 문제 발생.
    // 이를 방지하기 위해 해당 파라미터만 제거한 원래의 URL로 replace 합니다.
    const params = new URLSearchParams(searchParams.toString());
    params.delete(key);
    const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    
    router.replace(newUrl, { scroll: false });
  }, [router, isOpen, searchParams, pathname, key]);

  return {
    isOpen,
    value,
    openModal,
    closeModal,
    searchParams // 추가적인 파라미터 제어를 위해 반환
  };
}
