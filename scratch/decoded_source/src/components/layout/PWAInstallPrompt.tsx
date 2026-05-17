'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';

// --- Storage Keys ---
const STORAGE_KEYS = {
  VISIT_COUNT: 'woc_visit_count',
  FIRST_VISIT: 'woc_first_visit',
  DISMISSED_AT: 'woc_install_dismissed',
} as const;

// --- Trigger thresholds ---
const VISIT_THRESHOLD = 3;
const DAYS_THRESHOLD = 3;
const DISMISS_COOLDOWN_DAYS = 7;

type Platform = 'android' | 'ios';

function detectPlatform(): Platform {
  if (typeof navigator === 'undefined') return 'android';
  const ua = navigator.userAgent || navigator.vendor || '';
  if (/iPad|iPhone|iPod/.test(ua)) return 'ios';
  return 'android';
}

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function daysBetween(date1: number, date2: number): number {
  return Math.floor(Math.abs(date2 - date1) / (1000 * 60 * 60 * 24));
}

export default function PWAInstallPrompt() {
  const [shouldShow, setShouldShow] = useState(false);
  const [platform, setPlatform] = useState<Platform>('android');
  const [isVisible, setIsVisible] = useState(false);
  const deferredPromptRef = useRef<Event | null>(null);

  // Check conditions and decide whether to show
  useEffect(() => {
    // Don't show if already installed as PWA
    if (isStandalone()) return;

    // Only show once per browser session to avoid blocking UI repeatedly
    if (sessionStorage.getItem('woc_pwa_shown_this_session')) return;

    const now = Date.now();

    // Check dismiss cooldown
    const dismissedAt = localStorage.getItem(STORAGE_KEYS.DISMISSED_AT);
    if (dismissedAt) {
      const dismissedTime = parseInt(dismissedAt, 10);
      if (daysBetween(dismissedTime, now) < DISMISS_COOLDOWN_DAYS) return;
    }

    // Track first visit
    let firstVisit = localStorage.getItem(STORAGE_KEYS.FIRST_VISIT);
    if (!firstVisit) {
      localStorage.setItem(STORAGE_KEYS.FIRST_VISIT, String(now));
      firstVisit = String(now);
    }

    // Track visit count
    const currentCount = parseInt(localStorage.getItem(STORAGE_KEYS.VISIT_COUNT) || '0', 10);
    const newCount = currentCount + 1;
    localStorage.setItem(STORAGE_KEYS.VISIT_COUNT, String(newCount));

    // Check trigger conditions: 3 visits OR 3 days
    const daysSinceFirst = daysBetween(parseInt(firstVisit, 10), now);
    if (newCount >= VISIT_THRESHOLD || daysSinceFirst >= DAYS_THRESHOLD) {
      setPlatform(detectPlatform());
      setShouldShow(true);
      sessionStorage.setItem('woc_pwa_shown_this_session', '1');
    }
  }, []);

  // Capture beforeinstallprompt for Android
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      deferredPromptRef.current = e;
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  // Animate in
  useEffect(() => {
    if (shouldShow) {
      const timer = setTimeout(() => setIsVisible(true), 100);
      return () => clearTimeout(timer);
    }
  }, [shouldShow]);

  const handleDismiss = useCallback(() => {
    setIsVisible(false);
    setTimeout(() => {
      localStorage.setItem(STORAGE_KEYS.DISMISSED_AT, String(Date.now()));
      setShouldShow(false);
    }, 400);
  }, []);

  const handleInstall = useCallback(async () => {
    if (platform === 'android' && deferredPromptRef.current) {
      const promptEvent = deferredPromptRef.current as unknown as {
        prompt: () => Promise<void>;
        userChoice: Promise<{ outcome: string }>;
      };
      await promptEvent.prompt();
      const choiceResult = await promptEvent.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setShouldShow(false);
      }
      deferredPromptRef.current = null;
    }
    // iOS: the guide is already showing; tapping this is just a visual cue
  }, [platform]);

  if (!shouldShow) return null;

  // ============================================================
  // ANDROID PROMPT — 0-pixel match from aiantigravity.txt design 1
  // ============================================================
  if (platform === 'android') {
    return (
      <div
        className={`fixed inset-0 z-[9999] flex flex-col justify-end p-[24px] pb-8 sm:pb-[24px] items-center transition-opacity duration-400 ${isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        style={{ pointerEvents: isVisible ? 'auto' : 'none' }}
      >
        {/* Backdrop overlay */}
        <div
          className="absolute inset-0 bg-background/30 backdrop-blur-[2px]"
          onClick={handleDismiss}
        />

        {/* Floating Glassmorphism Card (Thumb Zone) */}
        <div
          aria-labelledby="install-title"
          aria-modal="true"
          role="dialog"
          className={`relative w-full max-w-sm bg-surface/80 backdrop-blur-xl border border-outline-variant/50 rounded-[1.5rem] shadow-[0_20px_40px_-15px_rgba(17,24,39,0.15)] p-[24px] flex flex-col items-center text-center transform transition-transform duration-400 ${isVisible ? 'translate-y-0' : 'translate-y-full'}`}
        >
          {/* Icon/Illustration Area */}
          <div className="w-16 h-16 mb-[12px] flex items-center justify-center rounded-full bg-primary-container text-on-primary-container shadow-inner">
            <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>add_to_home_screen</span>
          </div>

          {/* Content Area */}
          <h2
            className="font-['Plus_Jakarta_Sans'] text-[24px] leading-[1.3] tracking-[-0.01em] font-semibold text-on-surface mb-[4px]"
            id="install-title"
          >
            You&apos;re in ✨
          </h2>
          <p className="font-['Inter'] text-[16px] leading-[1.5] text-secondary mb-[24px]">
            Use it like an app for faster access.
          </p>

          {/* Actions Area */}
          <div className="w-full space-y-[12px] flex flex-col items-center mt-2">
            {/* Primary CTA */}
            <button
              onClick={handleInstall}
              className="w-full bg-primary text-on-primary font-['Inter'] text-[14px] leading-[1] tracking-[0.02em] font-semibold py-3 px-6 rounded-lg hover:bg-surface-tint focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-surface transition-colors shadow-sm flex items-center justify-center gap-[4px]"
            >
              <span>Continue in App</span>
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>

            {/* Secondary Action */}
            <button
              onClick={handleDismiss}
              className="text-secondary font-['Inter'] text-[14px] leading-[1] tracking-[0.02em] font-semibold py-2 px-4 hover:text-on-surface transition-colors focus:outline-none"
            >
              Maybe later
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================
  // iOS PROMPT — 0-pixel match from aiantigravity.txt design 2
  // ============================================================
  return (
    <div
      className={`fixed inset-0 z-[9999] transition-opacity duration-400 ${isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      style={{ pointerEvents: isVisible ? 'auto' : 'none' }}
    >
      {/* Glassmorphism Overlay */}
      <div
        className="absolute inset-0 z-40 flex flex-col justify-end items-center pb-8 px-[24px] md:px-0"
        style={{ background: 'rgba(255, 255, 255, 0.7)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
      >
        {/* PWA Installation Guide Modal */}
        <div
          className={`w-full max-w-md bg-surface-container-lowest rounded-xl border border-surface-variant shadow-[0_30px_60px_rgba(17,24,39,0.08)] overflow-hidden transform transition-all duration-400 relative ${isVisible ? 'translate-y-0' : 'translate-y-full'}`}
        >
          {/* Close Button (Subtle) */}
          <button
            aria-label="Close guide"
            onClick={handleDismiss}
            className="absolute top-[12px] right-[12px] text-secondary hover:text-on-surface transition-colors p-[4px] rounded-full hover:bg-surface-container-low"
          >
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0" }}>close</span>
          </button>

          <div className="p-[24px] flex flex-col items-center text-center">
            {/* Icon/Illustration Area */}
            <div className="w-16 h-16 bg-primary-container text-on-primary-container rounded-full flex items-center justify-center mb-[24px]">
              <span className="material-symbols-outlined text-[36px]" style={{ fontVariationSettings: "'FILL' 1" }}>add_to_home_screen</span>
            </div>

            {/* Headline & Body */}
            <h2 className="font-['Plus_Jakarta_Sans'] text-[24px] leading-[1.3] tracking-[-0.01em] font-semibold text-on-surface mb-[4px]">Install App</h2>
            <p className="font-['Inter'] text-[16px] leading-[1.5] text-on-surface-variant mb-[48px] max-w-[280px]">
              Add to Home Screen for the best experience. Access faster, offline, and full-screen.
            </p>

            {/* Instruction Steps */}
            <div className="w-full bg-surface-container-low rounded-lg p-[12px] flex flex-col gap-[12px] border border-surface-variant">
              <div className="flex items-center justify-between">
                <span className="font-['Inter'] text-[14px] leading-[1.5] text-on-surface-variant">1. Tap the Share icon below</span>
                <div className="w-8 h-8 rounded-full bg-surface-container-lowest border border-outline-variant flex items-center justify-center shadow-sm">
                  <span className="material-symbols-outlined text-primary text-[18px]">ios_share</span>
                </div>
              </div>
              <hr className="border-t border-surface-variant w-full" />
              <div className="flex items-center justify-between">
                <span className="font-['Inter'] text-[14px] leading-[1.5] text-on-surface-variant">2. Select Add to Home Screen</span>
                <div className="w-8 h-8 rounded-full bg-surface-container-lowest border border-outline-variant flex items-center justify-center shadow-sm">
                  <span className="material-symbols-outlined text-primary text-[18px]">add_box</span>
                </div>
              </div>
            </div>
          </div>

          {/* Pointer indicating bottom action (iOS specific design hint) */}
          <div className="w-full h-8 flex justify-center items-end pb-[4px] bg-surface-container-lowest rounded-b-xl hidden md:flex">
            <span className="material-symbols-outlined text-secondary animate-bounce">arrow_downward</span>
          </div>
        </div>

        {/* iOS Bottom Safe Area Pointer (Mobile Only) */}
        <div className="mt-4 flex flex-col items-center text-primary md:hidden animate-bounce">
          <span className="material-symbols-outlined">arrow_downward</span>
        </div>
      </div>
    </div>
  );
}
