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

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 overflow-hidden">
      <div 
        className="absolute inset-0" 
        onClick={() => setIsOpen(false)} 
      />
      
      <div className="relative bg-white w-full max-w-xl h-[95vh] sm:h-auto sm:max-h-[90vh] rounded-t-[32px] sm:rounded-[32px] shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom duration-300">
        {/* Header - Premium Style */}
        <div className="px-8 py-6 border-b border-gray-50 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-10 font-manrope">
          <div className="flex flex-col">
            {label && (
              <span className="text-[10px] font-black text-primary tracking-[0.25em] uppercase mb-1">
                {label}
              </span>
            )}
            <h3 className="text-[20px] font-black text-gray-900 uppercase tracking-tighter">
              {title}
            </h3>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsOpen(false)} 
              className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-50 hover:bg-gray-100 transition-all text-gray-400"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar scroll-smooth pb-32">
          {children}
        </div>

        {/* Action Button Area - Premium Style */}
        <div className="p-6 border-t border-gray-50 bg-white sticky bottom-0 z-10">
          <button
            onClick={onSubmit}
            disabled={isSubmitting}
            className={`w-full h-14 rounded-full font-black text-[15px] transition-all flex items-center justify-center gap-2 uppercase tracking-widest shadow-xl ${
              isSubmitting
                ? 'bg-gray-100 text-gray-300'
                : 'bg-primary text-white shadow-primary/30 hover:scale-[1.02] active:scale-[0.98]'
            }`}
          >
            {isSubmitting ? (
              <>
                <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                <span>{finalSubmittingLabel}</span>
              </>
            ) : (
              <span>{finalSubmitLabel}</span>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
