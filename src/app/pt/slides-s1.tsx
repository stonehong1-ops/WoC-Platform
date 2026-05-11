import React from 'react';

// Slide 0: Section Divider - SECTION 1 — INTRO
export const Slide0 = () => (
  <div className="relative z-10 flex flex-col items-center justify-center text-center w-full h-full bg-[#1c1b1b]">
    <p className="font-['Space_Grotesk'] text-[16px] font-bold tracking-[0.3em] text-white/30 uppercase mb-8">SECTION 1</p>
    <h2 className="font-['Space_Grotesk'] text-[72px] md:text-[128px] font-bold text-white tracking-wider leading-none">
      INTRO
    </h2>
    <div className="w-[80px] h-[3px] bg-white/30 mt-10" />
  </div>
);

// Slide 1: WoC (impact)
export const Slide1 = () => (
  <div className="relative z-10 flex flex-col items-center justify-center text-center w-full h-full">
    <h2 className="text-[140px] md:text-[240px] font-bold text-[#1c1b1b] leading-[1] tracking-tight">
      WoC
    </h2>
  </div>
);

// Slide 2: WORLD OF COMMUNITY (impact)
export const Slide2 = () => (
  <div className="relative z-10 flex flex-col items-center justify-center text-center w-full h-full px-[40px]">
    <h2 className="text-[64px] md:text-[128px] font-bold text-[#1c1b1b] leading-[1.05] tracking-tight break-keep">
      WORLD OF<br/>COMMUNITY
    </h2>
  </div>
);

// Slide 3: The Operating System For Human Communities. (impact)
export const Slide3 = () => (
  <div className="relative z-10 flex flex-col items-center justify-center text-center w-full h-full px-[40px]">
    <p className="font-['Space_Grotesk'] text-[16px] font-bold tracking-[0.3em] text-[#444748]/50 uppercase mb-8">VISION</p>
    <h2 className="text-[48px] md:text-[88px] font-bold text-[#1c1b1b] leading-[1.1] tracking-tight break-keep">
      The Operating System<br/>For Human Communities.
    </h2>
  </div>
);

// Slide 4: Life Goes On_ (impact with full background photo)
export const Slide4 = () => (
  <div className="relative z-10 flex flex-col items-center justify-center text-center w-full h-full overflow-hidden bg-black">
    <style>{`
      @keyframes slow-drift {
        0% { transform: scale(1.05) translate(0, 0); }
        100% { transform: scale(1.1) translate(-1%, -1%); }
      }
      .animate-slow-drift {
        animation: slow-drift 30s ease-out forwards;
      }
    `}</style>
    <div className="absolute inset-0 w-full h-full">
      <img src="/lifegoeson.png" alt="Life Goes On" className="w-full h-full object-cover animate-slow-drift opacity-80" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/20 to-[#050505]/60" />
      <div className="absolute inset-0 bg-black/40" />
    </div>
    <div className="relative z-20 flex flex-col items-center">
      <p className="font-['Space_Grotesk'] text-[11px] md:text-[13px] font-medium tracking-[0.5em] text-white/60 uppercase mb-5">
        World of Community
      </p>
      <h2 className="text-[40px] md:text-[64px] font-light text-white/95 leading-[1.1] tracking-wide drop-shadow-xl" style={{ textShadow: '0 4px 20px rgba(0,0,0,0.8)' }}>
        Life Goes On.
      </h2>
    </div>
  </div>
);

// Slide 5: Life on STAGE / ROAD / TABLE / MUSE / MIND / DESK (CARD GRID)
const categories = [
  { key: 'STAGE', items: 'Tango, Salsa, Ballet, Flamenco', icon: '🎭' },
  { key: 'ROAD', items: 'Bike, Running, Trekking', icon: '🚴' },
  { key: 'TABLE', items: 'Cooking, Coffee, Pottery', icon: '☕' },
  { key: 'MUSE', items: 'BTS, Cinema, Anime', icon: '🎬' },
  { key: 'MIND', items: 'Writing, Journaling, Interior', icon: '✍️' },
  { key: 'DESK', items: 'Academy, English School, Study Group', icon: '📚' },
];

export const Slide5 = () => (
  <div className="relative z-10 flex flex-col items-center justify-center text-center w-full h-full px-[40px]">
    <h2 className="text-[48px] md:text-[80px] font-bold text-[#1c1b1b] leading-[1.2] tracking-tight break-keep mb-14">
      Life on
    </h2>
    <div className="grid grid-cols-2 md:grid-cols-3 gap-5 md:gap-6 w-full max-w-[1200px]">
      {categories.map((c) => (
        <div key={c.key} className="bg-[#f0eded] rounded-2xl p-7 md:p-9 text-left border border-[#d4d4d4]/30 hover:border-[#1c1b1b]/20 transition-colors">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-[36px]">{c.icon}</span>
            <p className="font-['Space_Grotesk'] text-[22px] md:text-[28px] font-bold tracking-widest text-[#1c1b1b] uppercase">{c.key}</p>
          </div>
          <p className="text-[16px] md:text-[18px] text-[#444748]/70 font-medium leading-relaxed">{c.items}</p>
        </div>
      ))}
    </div>
  </div>
);
