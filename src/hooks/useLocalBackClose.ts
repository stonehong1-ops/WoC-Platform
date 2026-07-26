'use client';

import { useEffect, useRef } from 'react';

interface LocalModalEntry {
  id: string;
  close: () => void;
}

const localModalStack: LocalModalEntry[] = [];

export function closeTopModal(): boolean {
  const top = localModalStack.pop();
  if (top) {
    top.close();
    return true;
  }
  return false;
}

export function useLocalBackClose(isOpen: boolean, onClose: () => void) {
  const idRef = useRef<string>('');
  if (!idRef.current) {
    idRef.current = Math.random().toString(36).slice(2, 9);
  }

  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;

    const entry: LocalModalEntry = {
      id: idRef.current,
      close: () => onCloseRef.current(),
    };

    localModalStack.push(entry);

    return () => {
      const idx = localModalStack.findIndex(m => m.id === idRef.current);
      if (idx !== -1) {
        localModalStack.splice(idx, 1);
      }
    };
  }, [isOpen]);
}
