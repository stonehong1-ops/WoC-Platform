'use client';

import React, { useState } from 'react';

export default function SubFooter() {
  const [activeTab, setActiveTab] = useState<string | null>(null);

  const content: Record<string, { title: string; body: string }> = {
    About: {
      title: 'About WoC',
      body: 'World of Community (WoC) is a global ecosystem built to celebrate shared human passions. We bridge the gap between digital interaction and real-world connection, empowering societies to grow, share, and thrive together.'
    },
    Archive: {
      title: 'Digital Archive',
      body: 'A comprehensive record of community milestones, cultural shifts, and editorial highlights. Our archive preserves the evolution of global societies for future generations to explore and learn from.'
    },
    Editorial: {
      title: 'Editorial Mission',
      body: 'Voice, Vision, and Values. Our editorial team curates authentic stories that reflect the pulse of the community. We prioritize depth, diversity, and the pursuit of creative excellence in every piece we publish.'
    },
    Legal: {
      title: 'Legal & Privacy',
      body: 'We prioritize the security and privacy of our members. Our legal framework is designed to ensure fair use, data protection, and a respectful environment across all WoC platforms and services.'
    }
  };

  return (
    <footer className="bg-surface-container-lowest border-t border-outline-variant/20 py-8 px-6 rounded-t-2xl relative">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pt-8 border-t border-outline-variant/20">
          <div className="space-y-1">
            <p className="text-[10px] font-bold tracking-widest uppercase text-on-surface">WORLD OF COMMUNITY_</p>
            <p className="text-[9px] font-medium tracking-widest uppercase text-on-surface-variant/60">Digital Editorial Archive © 2026</p>
          </div>
          <div className="flex gap-6 uppercase text-[9px] font-bold tracking-[0.15em] text-on-surface-variant">
            {Object.keys(content).map((tab) => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="hover:text-primary transition-colors cursor-pointer uppercase"
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Popup Overlay */}
      {activeTab && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm" 
            onClick={() => setActiveTab(null)}
          />
          <div className="relative bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-xl font-bold tracking-tight text-slate-900">{content[activeTab].title}</h3>
              <button 
                onClick={() => setActiveTab(null)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>
            <p className="text-slate-600 leading-relaxed text-sm">
              {content[activeTab].body}
            </p>
            <div className="mt-8 pt-6 border-t border-slate-100">
              <button 
                onClick={() => setActiveTab(null)}
                className="w-full py-3 bg-[#007AFF] text-white rounded-xl font-bold text-sm hover:bg-[#0066D6] transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </footer>
  );
}
