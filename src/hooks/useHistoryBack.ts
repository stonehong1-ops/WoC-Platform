'use client';
import { useEffect, useRef, useCallback } from 'react';

/**
 * 풀스크린 팝업/모달에서 디바이스 뒤로가기를 인터셉트해 팝업을 닫는 훅.
 * - isOpen=true 시 history.pushState로 더미 상태 추가
 * - popstate(뒤로가기) 발생 시 onClose() 호출
 * - UI 닫기(X버튼 등) 시 handleClose()를 사용하면 더미 상태도 자동 제거
 */
export function useHistoryBack(isOpen: boolean, onClose: () => void) {
  const didPushState = useRef(false);

  useEffect(() => {
    if (isOpen) {
      history.pushState({ popupOpen: true }, '');
      didPushState.current = true;
    } else {
      didPushState.current = false;
    }
    return () => {
      // cleanup: 팝업이 언마운트될 때 플래그 리셋
      didPushState.current = false;
    };
  }, [isOpen]);

  useEffect(() => {
    const handler = () => {
      if (didPushState.current) {
        didPushState.current = false;
        onClose();
      }
    };
    window.addEventListener('popstate', handler);
    return () => window.removeEventListener('popstate', handler);
  }, [onClose]);

  // X버튼 등 UI에서 닫을 때 사용 — pushState한 더미를 직접 back()으로 제거
  const handleClose = useCallback(() => {
    if (didPushState.current) {
      didPushState.current = false;
      history.back(); // → popstate 발생 → handler에서 onClose()
    } else {
      onClose();
    }
  }, [onClose]);

  return { handleClose };
}
