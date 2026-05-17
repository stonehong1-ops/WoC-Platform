import React from 'react';

// Slide 0: Section Divider - SECTION 1 — INTRO
export const Slide0 = () => (
  <div className="relative z-10 flex flex-col items-center justify-center text-center w-full h-full bg-[#fcf8f8]">
    <p className="font-['Space_Grotesk'] text-[18px] font-medium tracking-[0.4em] text-[#111111]/40 uppercase mb-12 pt1-fu">SECTION 1</p>
    <h2 className="font-['Space_Grotesk'] text-[120px] md:text-[180px] font-bold text-[#111111] tracking-[-0.05em] leading-none pt1-si pt1-d2">
      INTRO
    </h2>
    <div className="w-[120px] h-[1px] bg-[#111111]/20 mt-16 pt1-lg pt1-d5" />
  </div>
);

// Slide 1: WoC (impact with shimmer)
export const Slide1 = () => (
  <div className="relative z-10 flex flex-col items-center justify-center text-center w-full h-full bg-[#fcf8f8] overflow-hidden">
    {/* Subtle radial glow behind text */}
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <div className="w-[500px] h-[500px] rounded-full bg-[#111111]/[0.03] blur-[100px] pt1-si" />
    </div>
    <h2 className="text-[160px] md:text-[280px] font-extrabold text-[#111111] leading-[1] tracking-[-0.08em] pt1-si relative">
      WoC
    </h2>
  </div>
);

// Slide 2: WORLD OF COMMUNITY (impact)
export const Slide2 = () => (
  <div className="relative z-10 flex flex-col items-center justify-center text-center w-full h-full px-[40px] bg-[#fcf8f8]">
    <h2 className="text-[80px] md:text-[140px] font-extrabold text-[#111111] leading-[0.95] tracking-[-0.06em] break-keep pt1-fu">
      WORLD OF<br/>COMMUNITY
    </h2>
  </div>
);

// Slide 3: The Operating System For Human Communities. (impact)
export const Slide3 = () => (
  <div className="relative z-10 flex flex-col items-center justify-center text-center w-full h-full px-[40px] bg-[#fcf8f8]">
    <p className="font-['Space_Grotesk'] text-[16px] font-bold tracking-[0.3em] text-[#111111]/30 uppercase mb-12 pt1-fu">VISION</p>
    <h2 className="text-[56px] md:text-[96px] font-bold text-[#111111] leading-[1.1] tracking-[-0.04em] break-keep pt1-fu pt1-d2">
      The Operating System<br/>
      <span className="text-[#111111]/40">For Human Communities.</span>
    </h2>
  </div>
);

// Slide 4: Life Goes On_ (impact with full background photo)
export const Slide4 = () => (
  <div className="relative z-10 flex flex-col items-center justify-center text-center w-full h-full overflow-hidden bg-black">
    <style>{`
      .animate-slow-drift {
        animation: pt1-bgDrift 40s ease-out forwards;
      }
    `}</style>
    <div className="absolute inset-0 w-full h-full">
      <img src="/slide4_bg_cinematic.jpg" alt="Life Goes On" className="w-full h-full object-cover animate-slow-drift opacity-100" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/40" />
    </div>
    <div className="relative z-20 flex flex-col items-center">
      <p className="font-['Space_Grotesk'] text-[14px] font-medium tracking-[0.6em] text-white/40 uppercase mb-8 pt1-fu">
        World of Community
      </p>
      <h2 className="text-[52px] md:text-[88px] font-extralight text-white tracking-tight leading-none pt1-fu pt1-d3 pt1-gp">
        Life Goes On.
      </h2>
    </div>
  </div>
);

// Slide 5: Life on WoC (Archetype Panels - Museum Style)
const archetypes = [
  { 
    title: 'STAGE', 
    subtitle: 'Move together.', 
    sections: [
      { label: 'Social Dance', items: 'Tango, Salsa, Bachata, Swing' },
      { label: 'Stage Dance', items: 'Flamenco, Street, Ballet' },
      { label: 'Body Flow', items: 'Yoga, Pilates, Contemporary' },
    ]
  },
  { 
    title: 'ROAD', 
    subtitle: 'Go outside.', 
    sections: [
      { label: 'Two-Wheels', items: 'Bike, Motorbike, E-Scooter' },
      { label: 'Urban Sports', items: 'Running, Skateboarding, Inline' },
      { label: 'Nature Path', items: 'Camping, Trekking, Climbing' },
    ]
  },
  { 
    title: 'TABLE', 
    subtitle: 'Stay longer.', 
    sections: [
      { label: 'Culinary', items: 'Cooking, Baking, Dessert' },
      { label: 'Beverage', items: 'Coffee, Wine, Whisky, Tea' },
      { label: 'Handcraft', items: 'Pottery, Woodworking, Knitting' },
    ]
  },
  { 
    title: 'MUSE', 
    subtitle: 'Feel something.', 
    sections: [
      { label: 'The Artists', items: 'BTS, K-Pop, Global Pop' },
      { label: 'Screen & Page', items: 'Cinema, Anime, Literature' },
      { label: 'Collectors', items: 'Vinyl, Figures, Art Pieces' },
    ]
  },
  { 
    title: 'MIND', 
    subtitle: 'Build minds.', 
    sections: [
      { label: 'Language', items: 'English, Spanish, Japanese' },
      { label: 'Writing', items: 'Journaling, Essay, Copywriting' },
      { label: 'Home Styling', items: 'Interior, Plant Care' },
    ]
  },
];

export const Slide5 = () => (
  <div className="relative z-10 w-full h-full bg-[#fcf8f8] text-[#111111] flex flex-col overflow-hidden">
    {/* Headline */}
    <div className="pt-[80px] px-[100px]">
      <h2 className="text-[100px] font-[900] tracking-[-0.06em] leading-[0.85] pt1-fu">
        Life on<br/>WoC.
      </h2>
      <div className="mt-10 flex items-center gap-6 pt1-fu pt1-d3">
        <div className="w-16 h-[2px] bg-black pt1-lg pt1-d5" />
        <p className="text-[24px] font-medium tracking-tight text-black/40">
          Archetypes of Human Activity
        </p>
      </div>
    </div>

    {/* Archetype Panels */}
    <div className="flex-1 mt-16 border-t border-black/10 grid grid-cols-5 h-full">
      {archetypes.map((item, idx) => (
        <div key={idx} className={`relative pt-12 px-10 pb-32 flex flex-col justify-start group hover:bg-black transition-colors duration-500 ${idx !== 4 ? 'border-r border-black/10' : ''} pt1-fu`} style={{ animationDelay: `${400 + idx * 100}ms` }}>
          <div className="flex flex-col gap-6">
            <span className="text-[14px] font-bold tracking-[0.2em] text-black/30 group-hover:text-white/40 transition-colors uppercase">
              0{idx + 1}
            </span>
            <div className="mt-2">
              <h3 className="text-[48px] font-bold tracking-[-0.04em] leading-none text-[#111111] group-hover:text-white transition-colors">
                {item.title}
              </h3>
              <p className="mt-4 text-[16px] font-medium text-black/40 group-hover:text-white/60 transition-colors">
                {item.subtitle}
              </p>
            </div>
          </div>
          
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-700 mt-16 flex flex-col gap-8">
            {item.sections.map((section, sidx) => (
              <div key={sidx} className="flex flex-col gap-2">
                <span className="text-[11px] font-bold tracking-[0.1em] text-white/30 uppercase">{section.label}</span>
                <p className="text-[14px] leading-[1.5] text-white/70 break-keep">
                  {section.items}
                </p>
              </div>
            ))}
          </div>

          {/* Bottom Line Marker */}
          <div className="absolute bottom-0 left-0 w-full h-2 bg-transparent group-hover:bg-white/20 transition-colors" />
        </div>
      ))}
    </div>
  </div>
);
