'use client';

import React, { ReactNode, useEffect, useState } from 'react';
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
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    if (!isOpen || typeof window === 'undefined' || !window.visualViewport) return;

    const handleResize = () => {
      const vv = window.visualViewport;
      if (!vv) return;
      const kHeight = window.innerHeight - vv.height;
      setKeyboardHeight(kHeight > 60 ? kHeight : 0);
    };

    window.visualViewport.addEventListener('resize', handleResize);
    window.visualViewport.addEventListener('scroll', handleResize);
    handleResize();

    return () => {
      window.visualViewport?.removeEventListener('resize', handleResize);
      window.visualViewport?.removeEventListener('scroll', handleResize);
    };
  }, [isOpen]);

  // Lock body scroll and manage history stack for Android/Device back button
  useEffect(() => {
    if (!isOpen) return;

    // a. Scroll Lock
    document.body.style.overflow = 'hidden';

    // b. History virtual stack creation
    const stateKey = `bottom_sheet_${Date.now()}`;
    window.history.pushState({ stateKey }, '');

    // c. Popstate handler for Device back button
    const handlePopState = (e: PopStateEvent) => {
      onClose();
    };

    // Delay listener registration to avoid catching stale popstate events
    // fired asynchronously by a previous BottomSheet's cleanup history.back()
    const guardTimer = setTimeout(() => {
      window.addEventListener('popstate', handlePopState);
    }, 50);

    return () => {
      clearTimeout(guardTimer);
      document.body.style.overflow = 'unset';
      window.removeEventListener('popstate', handlePopState);

      // d. Clean up the history stack if closed manually (X button, Backdrop click, Swipe down)
      if (window.history.state?.stateKey === stateKey) {
        window.history.back();
      }
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <Portal>
          <div className="fixed inset-0 flex items-end justify-center sm:items-center animate-in fade-in duration-200" style={{ zIndex: 99999 }}>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              style={{ zIndex: -1 }}
            />

            {/* Sheet Container */}
            <motion.div
              drag={keyboardHeight > 0 ? false : "y"}
              dragConstraints={{ top: 0 }}
              dragElastic={{ top: 0.05, bottom: 0.85 }}
              onDragEnd={(event, info) => {
                // If dragged down past 120px or swiped fast enough, trigger close
                if (info.offset.y > 120 || info.velocity.y > 350) {
                  onClose();
                }
              }}
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 350 }}
              className={`
                relative w-full max-w-2xl bg-surface-container-lowest 
                rounded-t-[32px] sm:rounded-3xl shadow-2xl 
                flex flex-col overflow-hidden z-10
                touch-pan-y
              `}
              style={{ 
                height: "auto", 
                minHeight: "40vh",
                paddingBottom: keyboardHeight,
                maxHeight: keyboardHeight > 0 ? `calc(100vh - ${keyboardHeight}px - 16px)` : '90vh'
              }}
            >
              {/* Drag Handle & Header */}
              <div className="pt-3 pb-2 px-4 flex flex-col items-center shrink-0 border-b border-outline-variant/5 cursor-grab active:cursor-grabbing">
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
                className="flex-1 overflow-y-auto px-4 py-2 min-h-0"
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
