'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

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
  const { t } = useLanguage();
  const [shouldShow, setShouldShow] = useState(false);
  const [platform, setPlatform] = useState<Platform>('android');
  const [isVisible, setIsVisible] = useState(false);
  const deferredPromptRef = useRef<Event | null>(null);

  // Check conditions and decide whether to show
  useEffect(() => {
    // PT 및 PT1 경로는 PWA 설치 유도 대상에서 제외
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      if (path === '/pt' || path === '/pt1' || path.startsWith('/pt/') || path.startsWith('/pt1/')) {
        return;
      }
    }

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
            className="font-['Plus_Jakarta_Sans'] text-[20px] leading-[1.3] tracking-[-0.01em] font-bold text-on-surface mb-[8px]"
            id="install-title"
          >
            {t('pwa.install_title', '앱으로 간편 설치 ✨')}
          </h2>
          <p className="font-['Inter'] text-[13px] leading-[1.6] text-secondary mb-[20px] px-2">
            {t('pwa.install_desc_android', '안정적인 실시간 알림을 위해 [앱스 화면] 또는 [앱 설치]를 선택해 주세요.')}
          </p>

          {/* Actions Area */}
          <div className="w-full space-y-[10px] flex flex-col items-center mt-1">
            {/* Primary CTA */}
            <button
              onClick={handleInstall}
              className="w-full bg-primary text-on-primary font-['Inter'] text-[13px] leading-[1] tracking-[0.02em] font-bold py-3.5 px-6 rounded-xl hover:bg-surface-tint focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-surface transition-colors shadow-md flex items-center justify-center gap-[6px]"
            >
              <span>{t('pwa.install_btn_android', '1클릭 앱 설치 진행')}</span>
              <span className="material-symbols-outlined text-[16px]">download</span>
            </button>

            {/* Secondary Action */}
            <button
              onClick={handleDismiss}
              className="text-slate-400 font-['Inter'] text-[12px] leading-[1] tracking-[0.02em] font-semibold py-2 px-4 hover:text-on-surface transition-colors focus:outline-none"
            >
              {t('pwa.install_dismiss', '나중에 하기')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================
}
