'use client';

import React, { useState, useEffect } from 'react';
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
  isValid = true
}: FullScreenRegistrationProps) {
  const { t } = useLanguage();
  const { setGlobalNavHidden } = useNavigation();
  const finalSubmitLabel = submitLabel || t('common.save') || 'SAVE';
  const finalSubmittingLabel = submittingLabel || t('common.uploading') || 'UPLOADING';

  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;
  const setIsOpen = (val: boolean) => {
    if (externalOnClose && !val) {
      externalOnClose();
    } else {
      setInternalIsOpen(val);
    }
  };

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
    <div className="fixed inset-0 z-[100] bg-surface-bright text-on-surface font-body-md antialiased flex flex-col animate-in fade-in duration-200">
      {/* Header */}
      <header className="flex-shrink-0 w-full z-50 flex items-center justify-between px-4 h-16 bg-white shadow-sm border-b border-slate-100">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsOpen(false)} 
            className="p-2 rounded-full active:scale-95 duration-150 hover:bg-slate-50"
          >
            <span className="material-symbols-outlined text-slate-500">close</span>
          </button>
          <h1 className="font-title-md text-title-md text-on-surface truncate">
            {title}
          </h1>
        </div>
        
        <button
          onClick={onSubmit}
          disabled={isSubmitting || !isValid}
          className="px-5 py-2 rounded-xl bg-primary-container text-white font-title-md text-body-md hover:opacity-90 active:scale-95 duration-150 transition-all disabled:opacity-40"
        >
          {isSubmitting ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>{finalSubmittingLabel}</span>
            </div>
          ) : (
            <span>{finalSubmitLabel}</span>
          )}
        </button>
      </header>

      {/* Content Area - Standardized spacing and width */}
      <main className="flex-1 overflow-y-auto py-6 pb-32 px-[1.5rem] max-w-[56rem] mx-auto w-full no-scrollbar scroll-smooth">
        {children}
      </main>
    </div>,
    document.body
  );
}

