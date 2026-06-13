'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useCallback, useState, useEffect } from 'react';

/**
 * URL Search Params 기반의 모달/상세페이지 내비게이션을 관리하는 훅.
 * - 열기: router.push (히스토리 스택 추가)
 * - 닫기: router.replace (히스토리 정리)
 */
export function useModalNavigation(key: string) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const getParamValue = useCallback(() => {
    if (typeof window === 'undefined') {
      return searchParams.get(key);
    }
    const params = new URLSearchParams(window.location.search);
    return params.get(key);
  }, [searchParams, key]);

  const [value, setValue] = useState<string | null>(null);

  useEffect(() => {
    setValue(getParamValue());

    const handlePopState = () => {
      setValue(getParamValue());
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [getParamValue, searchParams]);

  const isOpen = !!value;

  const openModal = useCallback((id: string, extraParams?: Record<string, string>) => {
    const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : searchParams.toString());
    params.set(key, id);
    if (extraParams) {
      Object.entries(extraParams).forEach(([k, v]) => params.set(k, v));
    }
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
    setValue(id);
  }, [router, searchParams, pathname, key]);

  const closeModal = useCallback(() => {
    if (!isOpen) return;

    const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : searchParams.toString());
    params.delete(key);
    const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    
    router.replace(newUrl, { scroll: false });
    setValue(null);
  }, [router, isOpen, searchParams, pathname, key]);

  return {
    isOpen,
    value,
    openModal,
    closeModal,
    searchParams
  };
}
