'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

/**
 * InAppBrowserGuard
 * - Android KakaoTalk: auto-redirect to Chrome via intent:// scheme
 * - iOS KakaoTalk: show a simple prompt with "Open in Safari" / "Continue anyway"
 * - All other browsers: render nothing
 */
export default function InAppBrowserGuard() {
  const { t } = useLanguage();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') return;

    const ua = navigator.userAgent || '';

    // Detect in-app browsers: KakaoTalk, Instagram, Facebook, Line
    const isInApp = /KAKAOTALK|Instagram|FBAN|FBAV|Line/i.test(ua);
    if (!isInApp) return;

    // Don't show again in same session
    if (sessionStorage.getItem('woc_inapp_dismissed')) return;

    const isIOS = /iPad|iPhone|iPod/.test(ua);
    const currentUrl = window.location.href;

    if (!isIOS) {
      // Android: Auto-redirect to Chrome via intent scheme
      const stripped = currentUrl.replace(/https?:\/\//i, '');
      window.location.href = `intent://${stripped}#Intent;scheme=https;package=com.android.chrome;end`;
      return;
    }

    // iOS: Show guide
    setShowIOSGuide(true);
    setTimeout(() => setIsVisible(true), 50);
  }, []);

  const handleOpenBrowser = async () => {
    const url = window.location.href;
    const ua = navigator.userAgent || '';
    const isIOS = /iPad|iPhone|iPod/.test(ua);

    if (!isIOS) {
      // Android: Use intent scheme to escape in-app browser when explicitly clicked
      const stripped = url.replace(/https?:\/\//i, '');
      window.location.href = `intent://${stripped}#Intent;scheme=https;package=com.android.chrome;end`;
      return;
    }

    // iOS: Copy to clipboard and hint user
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      window.prompt(t('guard.prompt_copy', 'Copy this URL and open in Safari:'), url);
    }
    
    // Attempt Safari open via universal link trick
    setTimeout(() => {
      window.location.href = url;
    }, 300);
  };

  const handleContinue = () => {
    setIsVisible(false);
    setTimeout(() => {
      sessionStorage.setItem('woc_inapp_dismissed', '1');
      setShowIOSGuide(false);
    }, 300);
  };

  if (!showIOSGuide) return null;

  return (
    <div
      className={`fixed inset-0 z-[10000] flex flex-col justify-center items-center p-6 transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
      style={{ pointerEvents: isVisible ? 'auto' : 'none' }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" />

      {/* Card */}
      <div
        className={`relative w-full max-w-sm bg-surface/90 backdrop-blur-xl border border-outline-variant/50 rounded-[1.5rem] shadow-[0_20px_40px_-15px_rgba(17,24,39,0.15)] p-6 flex flex-col items-center text-center transform transition-transform duration-300 ${isVisible ? 'scale-100' : 'scale-95'}`}
      >
        {/* Icon */}
        <div className="w-14 h-14 mb-4 flex items-center justify-center rounded-full bg-primary-container text-on-primary-container">
          <span
            className="material-symbols-outlined text-3xl"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            open_in_browser
          </span>
        </div>

        {/* Title */}
        <h2 className="font-['Plus_Jakarta_Sans'] text-xl font-semibold text-on-surface mb-1">
          {t('guard.title', 'Open in Browser')}
        </h2>
        <p className="font-['Inter'] text-sm leading-relaxed text-secondary mb-6">
          {t('guard.desc_en', 'For the best experience, open this page in your default browser.')}
          <br />
          <span className="text-xs text-on-surface-variant">
            {t('guard.desc_kr', '외부 브라우저에서 열면 더 안정적으로 이용할 수 있습니다.')}
          </span>
        </p>

        {/* Actions */}
        <div className="w-full space-y-3">
          {/* Primary: Open in Safari */}
          <button
            onClick={handleOpenBrowser}
            className="w-full bg-primary text-on-primary font-['Inter'] text-sm font-semibold py-3 px-6 rounded-lg hover:bg-surface-tint transition-colors shadow-sm flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-lg">ios_share</span>
            <span>{copied ? t('guard.url_copied', 'URL Copied! Paste in Browser') : t('guard.open_btn', 'Open in Browser')}</span>
          </button>

          {/* Secondary: Continue in-app */}
          <button
            onClick={handleContinue}
            className="w-full text-secondary font-['Inter'] text-sm font-semibold py-2 px-4 hover:text-on-surface transition-colors"
          >
            {t('guard.continue_btn', 'Continue anyway')}
          </button>
        </div>
      </div>
    </div>
  );
}
