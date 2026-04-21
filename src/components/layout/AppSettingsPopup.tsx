'use client';

import React, { useState } from 'react';

interface AppSettingsPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

const INSTRUCTIONS = [
  {
    id: 'chrome',
    icon: 'browser_updated',
    title: 'Chrome / Android',
    browser: 'Google Chrome',
    image: 'chrome_guide.png',
    steps: [
      'Tap the three dots (⋮) in the top right corner.',
      'Select "Install App" or "Add to Home screen".',
      'Confirm the installation when prompted.'
    ]
  },
  {
    id: 'samsung',
    icon: 'language_korean_latin',
    title: 'Samsung Internet',
    browser: 'Samsung Internet',
    image: 'samsung_guide.png',
    steps: [
      'Tap the menu (≡) in the bottom right corner.',
      'Tap on the "Add page to" icon.',
      'Select "Home screen" from the menu.'
    ]
  },
  {
    id: 'safari',
    icon: 'apple',
    title: 'Safari (iPhone / iPad)',
    browser: 'Safari (iOS)',
    image: 'safari_guide.png',
    steps: [
      'Tap the "Share" button (the square with an arrow) at the bottom.',
      'Scroll down and select "Add to Home Screen".',
      'Tap "Add" in the top right corner.'
    ]
  }
];

export default function AppSettingsPopup({ isOpen, onClose }: AppSettingsPopupProps) {
  const [activeTab, setActiveTab] = useState('chrome');

  if (!isOpen) return null;

  const currentTab = INSTRUCTIONS.find(i => i.id === activeTab) || INSTRUCTIONS[0];

  return (
    <div className="fixed inset-0 z-[10000] bg-white flex flex-col animate-in slide-in-from-bottom duration-500 overflow-hidden">
      {/* Header */}
      <header className="px-6 pt-10 pb-0 flex flex-col border-b border-outline-variant/10 shrink-0">
        <div className="flex items-center justify-between mb-8">
          <div>
            <span className="font-label text-[10px] font-black text-primary tracking-[0.25em] uppercase mb-1 block">Settings</span>
            <h2 className="font-display text-2xl font-black tracking-tight text-on-surface uppercase">App Setting</h2>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-on-surface/[0.04] text-on-surface/40 hover:bg-on-surface/[0.08]"
          >
            <span className="material-symbols-outlined text-2xl">close</span>
          </button>
        </div>

        {/* Browser Tabs */}
        <div className="flex gap-8 overflow-x-auto no-scrollbar">
          {INSTRUCTIONS.map((tab) => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`shrink-0 pb-4 text-[10px] font-black tracking-[0.2em] uppercase transition-all relative ${
                activeTab === tab.id ? 'text-primary scale-105' : 'text-on-surface/30 hover:text-on-surface/50'
              }`}
            >
              {tab.id.toUpperCase()}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full"></div>
              )}
            </button>
          ))}
        </div>
      </header>

      {/* Content Area */}
      <main className="flex-1 overflow-y-auto no-scrollbar px-6 py-10">
        <div className="max-w-md mx-auto">
          
          {/* Instruction Card */}
          <div className="animate-in fade-in duration-300">
            {/* Guide Image */}
            <div className="mb-10 rounded-[40px] overflow-hidden bg-on-surface/[0.03] p-1 border border-outline-variant/10 shadow-lg">
              <img 
                src={`/${currentTab.image}`} 
                alt={currentTab.browser}
                className="w-full h-auto object-cover rounded-[39px]"
              />
            </div>

            {/* Title & Info */}
            <div className="px-2 mb-10">
              <h3 className="text-xl font-black tracking-tight text-on-surface mb-3 uppercase">{currentTab.title}</h3>
              <p className="text-sm font-medium text-on-surface/50 leading-relaxed">
                Follow these simple steps in {currentTab.browser} to install WoC on your home screen.
              </p>
            </div>

            {/* Steps List */}
            <div className="space-y-4 px-2">
              {currentTab.steps.map((step, idx) => (
                <div key={idx} className="flex gap-5 p-5 rounded-3xl bg-on-surface/[0.03] border border-outline-variant/10 group active:scale-[0.98] transition-all">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-[12px] font-black text-primary">{idx + 1}</span>
                  </div>
                  <p className="text-sm font-bold text-on-surface/70 leading-snug">{step}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Footer Note */}
          <div className="mt-16 mb-12 text-center opacity-40">
            <p className="text-[9px] font-black tracking-[0.3em] uppercase">World of Group · Home Screen Setup</p>
          </div>
        </div>
      </main>
    </div>
  );
}
