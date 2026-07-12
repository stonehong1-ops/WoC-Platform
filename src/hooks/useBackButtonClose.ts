'use client';

import { useEffect } from 'react';

/**
 * 모달/풀스크린이 열릴 때 히스토리 항목을 추가하고,
 * 디바이스 뒤로가기(popstate) 시 모달을 닫는 훅.
 * 
 * @param isOpen - 모달/풀스크린의 열림 상태
 * @param onClose - 닫기 콜백
 */
export function useBackButtonClose(isOpen: boolean, onClose: () => void) {
  useEffect(() => {
    if (!isOpen) return;

    // 모달이 열릴 때 히스토리 항목 추가
    const stateKey = `modal-${Date.now()}`;
    window.history.pushState({ modal: stateKey }, '');

    const handlePopState = () => {
      // 뒤로가기 시 모달 닫기
      onClose();
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      // 컴포넌트 언마운트 시(닫기 버튼 등으로 닫힌 경우) 추가했던 히스토리 제거
      if (window.history.state?.modal === stateKey) {
        window.history.back();
      }
    };
  }, [isOpen, onClose]);
}
