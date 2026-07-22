'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigation } from '@/components/providers/NavigationProvider';

interface FullScreenRegistrationProps {
  id: string; // Unique ID for event triggers
  title: string;
  submitLabel?: string;
  submittingLabel?: string;
  onSubmit: () => void;
  children: React.ReactNode;
  isOpen?: boolean;
  onClose?: () => void;
  isSubmitting?: boolean;
  isValid?: boolean; // Controls whether SAVE button is disabled
  hasDraftContent?: boolean;
}

export default function FullScreenRegistration({
  id,
  title,
  submitLabel,
  submittingLabel,
  onSubmit,
  children,
  isOpen: externalIsOpen,
  onClose: externalOnClose,
  isSubmitting = false,
  isValid = true,
  hasDraftContent = false
}: FullScreenRegistrationProps) {
  const { t } = useLanguage();
  const { setGlobalNavHidden } = useNavigation();
  const finalSubmitLabel = submitLabel || t('common.save') || 'SAVE';
  const finalSubmittingLabel = submittingLabel || t('common.uploading') || 'UPLOADING';

  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;

  // 헤더 뒤로가기 화살표 직접 클릭 핸들러 — history 조작 없이 onClose 직접 호출
  const handleClose = useCallback(() => {
    if (hasDraftContent) {
      if (confirm(t('common.confirm_discard', '작성 중인 내용이 있습니다. 정말 나가시겠습니까?'))) {
        if (externalOnClose) {
          externalOnClose();
        } else {
          setInternalIsOpen(false);
        }
      }
    } else {
      if (externalOnClose) {
        externalOnClose();
      } else {
        setInternalIsOpen(false);
      }
    }
  }, [hasDraftContent, t, externalOnClose]);

  useEffect(() => {
    setMounted(true);
    const handleOpen = (e: any) => {
      if (!e.detail || e.detail.id === id) {
        setInternalIsOpen(true);
      }
    };
    
    window.addEventListener(`woc:compose:${id}:open`, handleOpen);
    return () => window.removeEventListener(`woc:compose:${id}:open`, handleOpen);
  }, [id]);

  // Handle global nav visibility
  useEffect(() => {
    if (isOpen) {
      setGlobalNavHidden(true);
    } else {
      setGlobalNavHidden(false);
    }
    
    return () => {
      if (isOpen) setGlobalNavHidden(false);
    };
  }, [isOpen, setGlobalNavHidden]);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100000] bg-[#FAF8FF] text-slate-800 font-body antialiased flex flex-col animate-in fade-in duration-200 notranslate">
      {/* Header */}
      <header
        className="fixed top-0 left-0 w-full flex-shrink-0 bg-white border-b border-slate-100 px-4 flex items-center justify-between z-[100010]"
        style={{
          paddingTop: 'env(safe-area-inset-top, 0px)',
          height: 'calc(56px + env(safe-area-inset-top, 0px))'
        }}
      >
        <button type="button" onClick={handleClose} className="w-10 h-10 flex items-center justify-center -ml-2 active:scale-95 transition-transform text-slate-700">
          <span className="material-symbols-rounded text-2xl">arrow_back</span>
        </button>
        <h1 className="text-[16px] font-bold text-slate-800 truncate">
          {title}
        </h1>
        <div className="w-10" />
      </header>

      {/* Header Spacer */}
      <div
        className="w-full flex-shrink-0"
        style={{ height: 'calc(56px + env(safe-area-inset-top, 0px))' }}
      />

      {/* Content Area - Standardized spacing and width */}
      <main className="flex-1 overflow-y-auto py-6 pb-28 px-4 max-w-2xl mx-auto w-full no-scrollbar scroll-smooth">
        {children}
      </main>

      {/* Fixed Bottom Navigation Bar */}
      <footer
        className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-4 flex gap-3 items-center justify-between z-[100010] shadow-lg"
        style={{
          paddingTop: '16px',
          paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 0px))',
          height: 'calc(76px + env(safe-area-inset-bottom, 0px))'
        }}
      >
        <button
          type="button"
          onClick={onSubmit}
          disabled={isSubmitting || !isValid}
          className="flex-1 py-3.5 rounded-full bg-[#007AFF] text-white text-sm font-bold active:scale-95 transition-all disabled:opacity-50 shadow-sm"
        >
          {isSubmitting ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>{finalSubmittingLabel}</span>
            </div>
          ) : (
            <span>{finalSubmitLabel}</span>
          )}
        </button>
      </footer>
    </div>,
    document.body
  );
}

