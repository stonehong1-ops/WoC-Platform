'use client';

import { useEffect, useRef } from 'react';

/**
 * 모달/풀스크린 뒤로가기 닫기 훅 — 글로벌 LIFO 스택 기반.
 *
 * 여러 useBackButtonClose 인스턴스가 동시에 활성화되어도
 * 가장 최근에 열린 모달 1개만 뒤로가기(popstate)에 반응합니다.
 *
 * @param isOpen - 모달/풀스크린의 열림 상태
 * @param onClose - 닫기 콜백
 */

// ── 글로벌 모달 닫기 스택 (LIFO) ──
interface ModalEntry {
  id: string;
  close: () => void;
  markPopStateClosed: () => void;
}

const modalStack: ModalEntry[] = [];
let listenerAttached = false;
let skipNextPop = false; // cleanup의 history.back()에 의한 연쇄 popstate 차단용

function attachGlobalPopStateListener() {
  if (listenerAttached || typeof window === 'undefined') return;
  listenerAttached = true;

  window.addEventListener('popstate', () => {
    // cleanup에서 history.back() 호출로 인한 popstate는 무시
    if (skipNextPop) {
      skipNextPop = false;
      return;
    }

    // 스택 최상단(= 가장 최근에 열린 모달)만 닫기
    const top = modalStack.pop();
    if (top) {
      top.markPopStateClosed();
      top.close();
    }
  });
}

/** 현재 열린 모달이 있는지 반환 — Capacitor backButton 리스너에서 사용 */
export function hasOpenModals(): boolean {
  return modalStack.length > 0;
}

export function useBackButtonClose(isOpen: boolean, onClose: () => void) {
  const onCloseRef = useRef(onClose);
  const entryIdRef = useRef<string | null>(null);
  const isPopClosedRef = useRef(false);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen || typeof window === 'undefined') return;

    isPopClosedRef.current = false;
    attachGlobalPopStateListener();

    // 고유 ID 생성 후 히스토리 항목 추가
    const id = `modal-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    entryIdRef.current = id;
    window.history.pushState({ modal: id }, '');

    // 스택에 등록
    modalStack.push({
      id,
      close: () => onCloseRef.current(),
      markPopStateClosed: () => { isPopClosedRef.current = true; }
    });

    return () => {
      // 스택에서 이 엔트리 제거
      const idx = modalStack.findIndex(e => e.id === id);
      if (idx !== -1) {
        modalStack.splice(idx, 1);
      }

      // popstate로 닫힌 것이 아니면서(UI X버튼 클릭 등)
      // pushState로 추가한 히스토리 항목이 여전히 남은 경우만 정리
      if (!isPopClosedRef.current && window.history.state?.modal === id) {
        skipNextPop = true;
        window.history.back();
      }

      entryIdRef.current = null;
    };
  }, [isOpen]);
}
