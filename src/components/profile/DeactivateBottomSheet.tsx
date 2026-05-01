'use client';

import React from 'react';

interface DeactivateBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function DeactivateBottomSheet({ isOpen, onClose, onConfirm }: DeactivateBottomSheetProps) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[200] flex items-end justify-center bottom-sheet-overlay animate-in fade-in duration-300"
      onClick={onClose}
    >
      {/* Bottom Sheet Content */}
      <div 
        className="bg-surface w-full max-w-md rounded-t-[2.5rem] shadow-2xl relative overflow-hidden pb-10 animate-in slide-in-from-bottom duration-500"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="w-full flex justify-center py-4 cursor-pointer" onClick={onClose}>
          <div className="w-12 h-1.5 bg-surface-container-highest rounded-full"></div>
        </div>

        {/* Content Container */}
        <div className="px-8 flex flex-col items-center text-center">
          {/* Icon/Illustration */}
          <div className="mb-6 flex items-center justify-center w-16 h-16 rounded-full bg-error-container/20 text-error">
            <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
          </div>

          {/* Headline */}
          <h2 className="font-headline text-2xl font-extrabold tracking-tight text-on-surface mb-3">Deactivate Account</h2>

          {/* Warning Description */}
          <div className="bg-surface-container-low p-5 rounded-2xl mb-8">
            <p className="text-on-surface-variant text-sm leading-relaxed">
              Deactivating your account will hide your profile and information from other users. Some information may still be visible to others, such as messages you sent. 
              <span className="font-semibold text-on-surface ml-1">This action is reversible by logging back in within 30 days.</span>
            </p>
          </div>

          {/* Informational Bullets */}
          <div className="w-full space-y-4 mb-10">
            <div className="flex items-start gap-4 text-left">
              <span className="material-symbols-outlined text-on-surface-variant mt-0.5 text-lg">no_accounts</span>
              <div>
                <p className="text-sm font-semibold text-on-surface">Profile hidden</p>
                <p className="text-xs text-on-surface-variant">Your photos and details won't be seen.</p>
              </div>
            </div>
            <div className="flex items-start gap-4 text-left">
              <span className="material-symbols-outlined text-on-surface-variant mt-0.5 text-lg">timer</span>
              <div>
                <p className="text-sm font-semibold text-on-surface">30-day grace period</p>
                <p className="text-xs text-on-surface-variant">Data is permanently deleted after 30 days.</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="w-full space-y-3">
            <button 
              onClick={onConfirm}
              className="w-full py-4 bg-primary text-on-primary font-headline font-bold text-sm rounded-full shadow-lg shadow-primary/20 hover:bg-on-primary-fixed-variant active:scale-95 transition-all"
            >
              Deactivate Now
            </button>
            <button 
              onClick={onClose}
              className="w-full py-4 bg-transparent text-on-surface-variant font-body font-medium text-sm rounded-full hover:bg-surface-container transition-colors"
            >
              Keep my account
            </button>
          </div>
        </div>

        {/* Background Aesthetic Element */}
        <div className="absolute top-0 right-0 -z-10 opacity-10 pointer-events-none">
          <img alt="" className="w-40 h-40 object-cover rounded-full blur-3xl" src="https://lh3.googleusercontent.com/aida-public/AB6AXuA1F8dkubYTNrHTNtIvqJqNZcBVM5go5g-Y7lB07apur83ktVhSS910bHvDQnQ7U__TpFaEKiTY7brnvEwFSEaaiTt9gV9rhV4up5TZ16G03_spirm24EKzYyk7Dpdc1w5JcDTajQmbR_VOEOJZ8Bt9kjJVEXEb-C2kMzAPg62DPnTGpvSw1QvZwN5uEbw5Q3Z8RpDvZd7LC8mr0UqOr6Xa3jSG2eHEdECxDZ9yjzCi7KYYyjEHNehm7B9c2Xh37YmNvNS4FeZ2_19S"/>
        </div>
      </div>

      <style jsx global>{`
        .bottom-sheet-overlay {
          background-color: rgba(0, 0, 0, 0.4);
          backdrop-filter: blur(4px);
        }
      `}</style>
    </div>
  );
}
