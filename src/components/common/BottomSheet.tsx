'use client';

import React, { ReactNode, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Portal from './Portal';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
  height?: string;
}

export default function BottomSheet({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  footer,
  height = "80vh" 
}: BottomSheetProps) {
  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <Portal>
          <div className="fixed inset-0 z-[1000] flex items-end justify-center sm:items-center">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            {/* Sheet Container */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className={`
                relative w-full max-w-2xl bg-surface-container-lowest 
                rounded-t-[32px] sm:rounded-3xl shadow-2xl 
                flex flex-col overflow-hidden z-10
                max-h-[90vh] sm:max-h-[85vh]
              `}
              style={{ height: "auto", minHeight: "40vh" }}
            >
              {/* Drag Handle & Header */}
              <div className="pt-3 pb-2 px-4 flex flex-col items-center shrink-0 border-b border-outline-variant/5">
                <div className="w-10 h-1 bg-outline-variant/30 rounded-full mb-4 sm:hidden" />
                <div className="w-full flex justify-between items-center mb-1">
                  <h3 className="text-lg font-headline font-bold text-on-surface">
                    {title}
                  </h3>
                  <button 
                    onClick={onClose}
                    className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container-high transition-colors"
                  >
                    <span className="material-symbols-outlined text-on-surface-variant">close</span>
                  </button>
                </div>
              </div>

              {/* Scrollable Content Area */}
              <div 
                className="flex-1 overflow-y-auto px-4 py-2"
                style={{ maxHeight: height }}
              >
                {children}
              </div>

              {/* Fixed Footer (e.g. Input field) */}
              {footer && (
                <div className="shrink-0 bg-surface-container-lowest border-t border-outline-variant/10">
                  {footer}
                </div>
              )}
            </motion.div>
          </div>
        </Portal>
      )}
    </AnimatePresence>
  );
}
