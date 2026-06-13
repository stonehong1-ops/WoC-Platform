'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

interface UniversalComposeProps {
  id: string; // Unique ID for the event trigger (e.g., 'social')
  title: string;
  label?: string; // Small uppercase text above title
  submitLabel?: string;
  submittingLabel?: string; // Custom label when submitting (e.g., 'Broadcasting 50%')
  onSubmit: () => void;
  children: React.ReactNode;
  isOpen?: boolean; // Optional external control
  onClose?: () => void; // Optional external control
  isSubmitting?: boolean;
}

export default function UniversalCompose({ 
  id, 
  title, 
  label,
  submitLabel, 
  submittingLabel,
  onSubmit, 
  children,
  isOpen: externalIsOpen,
  onClose: externalOnClose,
  isSubmitting = false
}: UniversalComposeProps) {
  const { t } = useLanguage();
  const finalSubmitLabel = submitLabel || t('common.submit');
  const finalSubmittingLabel = submittingLabel || t('common.uploading');

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
    
    window.addEventListener('woc:compose:open', handleOpen);
    return () => window.removeEventListener('woc:compose:open', handleOpen);
  }, [id]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 overflow-hidden" style={{ zIndex: 100000 }}>
      <div 
        className="absolute inset-0" 
        onClick={() => setIsOpen(false)} 
      />
      
      <div className="relative bg-white w-full max-w-xl h-[95dvh] sm:h-auto sm:max-h-[90vh] rounded-t-[32px] sm:rounded-[32px] shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom duration-300">
        {/* Header - Standard */}
        <div className="flex-shrink-0 bg-white border-b border-slate-100 px-4 h-14 flex items-center justify-between z-50">
          <button 
            type="button"
            onClick={() => setIsOpen(false)} 
            className="w-10 h-10 flex items-center justify-center -ml-2 active:scale-95 transition-transform text-slate-700"
          >
            <span className="material-symbols-rounded text-2xl">close</span>
          </button>
          <h3 className="text-[16px] font-bold text-slate-800">
            {title}
          </h3>
          <button
            type="button"
            onClick={onSubmit}
            disabled={isSubmitting}
            className="px-5 py-2 rounded-full bg-[#007AFF] text-white text-[14px] font-bold disabled:opacity-50 active:scale-95 transition-all"
          >
            {isSubmitting ? finalSubmittingLabel : finalSubmitLabel}
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar scroll-smooth pb-8">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}
