'use client';

import React from 'react';

interface AppSettingsPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

const INSTRUCTIONS = [
  {
    icon: 'browser_updated',
    title: 'Chrome / Android',
    browser: 'Google Chrome',
    steps: [
      'Tap the three dots (⋮) in the top right corner.',
      'Select "Install App" or "Add to Home screen".',
      'Confirm the installation when prompted.'
    ]
  },
  {
    icon: 'language_korean_latin',
    title: 'Samsung Internet',
    browser: 'Samsung Internet',
    steps: [
      'Tap the menu (≡) in the bottom right corner.',
      'Tap on the "Add page to" icon.',
      'Select "Home screen" from the menu.'
    ]
  },
  {
    icon: 'apple',
    title: 'Safari (iOS / iPhone)',
    browser: 'Safari',
    steps: [
      'Tap the Share button (the square with an arrow pointing up) at the bottom.',
      'Scroll down and tap "Add to Home Screen".',
      'Tap "Add" in the top right corner to confirm.'
    ]
  }
];

export default function AppSettingsPopup({ isOpen, onClose }: AppSettingsPopupProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] bg-white flex flex-col animate-in slide-in-from-bottom duration-500">
      {/* Header */}
      <header className="px-6 py-8 flex items-center justify-between border-b border-outline-variant/10">
        <div>
          <span className="font-label text-[10px] font-black text-primary tracking-[0.25em] uppercase mb-1 block">Settings</span>
          <h2 className="font-display text-2xl font-black tracking-tight text-on-surface uppercase">App Setting</h2>
        </div>
        <button 
          onClick={onClose}
          className="w-12 h-12 flex items-center justify-center rounded-full bg-on-surface/[0.04] hover:bg-on-surface/[0.08] transition-all"
        >
          <span className="material-symbols-outlined text-2xl text-on-surface">close</span>
        </button>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto no-scrollbar px-6 py-10">
        <div className="max-w-md mx-auto space-y-12">
          
          {/* PWA Introduction */}
          <section>
            <h3 className="text-[11px] font-black tracking-[0.2em] text-on-surface/40 uppercase mb-4 px-2">Installation Guide</h3>
            <p className="text-sm font-medium text-on-surface/60 leading-relaxed px-2">
              Add WoC platform to your home screen for a premium, app-like experience. This enables push notifications and lightning-fast access.
            </p>
          </section>

          {/* Instructions List */}
          <div className="space-y-6">
            {INSTRUCTIONS.map((item) => (
              <div key={item.browser} className="p-6 rounded-[32px] bg-on-surface/[0.02] border border-outline-variant/10 shadow-sm">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 flex items-center justify-center rounded-2xl bg-primary/5 text-primary">
                    <span className="material-symbols-outlined text-[24px]">{item.icon}</span>
                  </div>
                  <div>
                    <h4 className="text-[15px] font-extrabold text-on-surface tracking-tight leading-none mb-1.5">{item.title}</h4>
                    <span className="text-[10px] font-bold text-on-surface/40 uppercase tracking-widest">{item.browser}</span>
                  </div>
                </div>
                
                <ul className="space-y-4">
                  {item.steps.map((step, idx) => (
                    <li key={idx} className="flex gap-4">
                      <span className="text-[11px] font-black text-primary/40 mt-0.5">{idx + 1}.</span>
                      <p className="text-[13px] font-semibold text-on-surface/70 leading-snug">{step}</p>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Footer Note */}
          <div className="pt-8 pb-12 text-center">
            <p className="text-[10px] font-bold text-on-surface/30 tracking-widest uppercase">
              All settings are provided in English.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
