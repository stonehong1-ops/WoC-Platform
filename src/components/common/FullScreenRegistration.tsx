'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useLanguage } from '@/contexts/LanguageContext';

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

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] bg-white flex flex-col animate-in fade-in duration-200">
      {/* Header - X on the left, Title in the center, SAVE on the right */}
      <div className="px-6 py-4 flex items-center justify-between sticky top-0 z-20 bg-white/90 backdrop-blur-md font-manrope">
        <button 
          onClick={() => setIsOpen(false)} 
          className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-50 transition-all text-gray-900"
        >
          <span className="material-symbols-outlined text-[24px]">close</span>
        </button>
        
        <h3 className="text-[18px] font-black text-gray-900 uppercase tracking-tight truncate px-4">
          {title}
        </h3>
        
        <button
          onClick={onSubmit}
          disabled={isSubmitting || !isValid}
          className={`px-5 py-2.5 rounded-full font-black text-[12px] transition-all flex items-center justify-center uppercase tracking-widest ${
            isSubmitting || !isValid
              ? 'bg-gray-50 text-gray-400 border border-gray-200 pointer-events-none'
              : 'bg-gray-900 text-white border border-gray-900 hover:bg-black shadow-md active:scale-95'
          }`}
        >
          {isSubmitting ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              <span>{finalSubmittingLabel}</span>
            </div>
          ) : (
            <span>{finalSubmitLabel}</span>
          )}
        </button>
      </div>

      {/* Content Area - Wide space, no unnecessary nesting */}
      <div className="flex-1 overflow-y-auto no-scrollbar scroll-smooth pb-12 w-full max-w-4xl mx-auto px-6">
        {children}
      </div>
    </div>,
    document.body
  );
}
