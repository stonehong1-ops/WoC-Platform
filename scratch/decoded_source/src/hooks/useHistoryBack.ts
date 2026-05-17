'use client';
import { useEffect, useRef, useCallback } from 'react';

type PopupEntry = {
  id: string;
  onClose: () => void;
  didPushState: { current: boolean };
};

class PopupManager {
  stack: PopupEntry[] = [];
  ignoreNextPopstate = false;
  
  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('popstate', this.handlePopState);
    }
  }

  handlePopState = (e: PopStateEvent) => {
    if (this.ignoreNextPopstate) {
      this.ignoreNextPopstate = false;
      return;
    }
    for (let i = this.stack.length - 1; i >= 0; i--) {
      const popup = this.stack[i];
      if (popup.didPushState.current) {
        popup.didPushState.current = false;
        popup.onClose();
        break; // Only close the topmost active popup
      }
    }
  }

  push(entry: PopupEntry) {
    this.stack.push(entry);
  }

  remove(id: string) {
    this.stack = this.stack.filter(p => p.id !== id);
  }
}

const manager = new PopupManager();
if (typeof window !== 'undefined') {
  (window as any).__popupManager = manager;
}

/**
 * 풀스크린 팝업/모달에서 디바이스 뒤로가기를 인터셉트해 팝업을 닫는 훅.
 * 중첩된 팝업이 있을 경우 전역 스택을 통해 최상위 팝업 하나만 이벤트를 처리하도록 합니다.
 */
export function useHistoryBack(isOpen: boolean, onClose: () => void) {
  const popupId = useRef(Math.random().toString(36).substring(2, 9));
  const didPushState = useRef(false);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      history.pushState({ popupOpen: true, id: popupId.current }, '');
      didPushState.current = true;
      manager.push({
        id: popupId.current,
        onClose: () => onCloseRef.current(),
        didPushState
      });
    } else {
      if (didPushState.current) {
        didPushState.current = false;
      }
      manager.remove(popupId.current);
    }
    
    return () => {
      didPushState.current = false;
      manager.remove(popupId.current);
    };
  }, [isOpen]);

  const handleClose = useCallback(() => {
    if (didPushState.current) {
      didPushState.current = false;
      manager.ignoreNextPopstate = true;
      history.back(); // 더미 상태 제거
      setTimeout(() => onCloseRef.current(), 0);
    } else {
      onCloseRef.current();
    }
  }, []);

  return { handleClose };
}
