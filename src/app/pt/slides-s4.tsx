import React from 'react';

// Slide 18: Section Divider - SECTION 4 — GROUP OPERATING SYSTEM
export const Slide18 = () => (
  <div className="relative z-10 flex flex-col items-center justify-center text-center w-full h-full bg-[#1c1b1b]">
    <p className="font-['Space_Grotesk'] text-[16px] font-bold tracking-[0.3em] text-white/30 uppercase mb-8">SECTION 4</p>
    <h2 className="font-['Space_Grotesk'] text-[52px] md:text-[104px] font-bold text-white tracking-wider leading-tight">
      GROUP<br/>OPERATING SYSTEM
    </h2>
    <div className="w-[80px] h-[3px] bg-white/30 mt-10" />
  </div>
);

// Slide 19: Group은 단순 커뮤니티가 아니다
export const Slide19 = () => (
  <div className="relative z-10 flex flex-col items-center justify-center text-center w-full h-full px-[40px]">
    <h2 className="text-[44px] md:text-[96px] font-bold text-[#1c1b1b] leading-[1.15] tracking-tight break-keep mb-12">
      Group은<br/>단순 커뮤니티가 아니다
    </h2>
    <div className="bg-[#1c1b1b] rounded-2xl px-12 py-6">
      <p className="font-['Space_Grotesk'] text-[22px] md:text-[32px] font-bold tracking-widest text-white uppercase">
        Groups become operating systems.
      </p>
    </div>
  </div>
);

// Slide 20: 모든 Group은 서로 다른 workflow를 가진다 (4 TYPE CARDS)
export const Slide20 = () => (
  <div className="relative z-10 flex flex-col items-center justify-center text-center w-full h-full px-[40px]">
    <h2 className="text-[36px] md:text-[72px] font-bold text-[#1c1b1b] leading-[1.15] tracking-tight break-keep mb-14">
      모든 Group은<br/>서로 다른 workflow를 가진다
    </h2>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-5 w-full max-w-[1100px]">
      {[
        { name: 'Tango Studio', emoji: '💃' },
        { name: 'Academy', emoji: '🎓' },
        { name: 'Startup', emoji: '🚀' },
        { name: 'Fan Community', emoji: '🎤' },
      ].map((g) => (
        <div key={g.name} className="bg-[#f0eded] rounded-2xl p-7 md:p-9 border border-[#d4d4d4]/30">
          <span className="text-[44px] mb-4 block">{g.emoji}</span>
          <p className="font-['Space_Grotesk'] text-[16px] md:text-[20px] font-bold tracking-wider text-[#1c1b1b] uppercase">{g.name}</p>
        </div>
      ))}
    </div>
  </div>
);

// Slide 21: One Platform, Infinite Community Systems (CATEGORY GRID)
export const Slide21 = () => (
  <div className="relative z-10 flex flex-col items-center justify-center text-center w-full h-full px-[40px] py-6">
    <h2 className="text-[36px] md:text-[64px] font-bold text-[#1c1b1b] leading-[1.15] tracking-tight break-keep mb-3">
      One Platform<br/>Infinite Community Systems
    </h2>
    <p className="font-['Space_Grotesk'] text-[15px] md:text-[20px] font-bold tracking-widest text-[#444748]/50 uppercase mb-8">50+ Functions · Build your own community system.</p>
    <div className="flex flex-col gap-3 w-full max-w-[1100px]">
      {[
        { cat: 'ADMIN', items: 'Brand Setting · Class Setting · Shop Setting', color: 'bg-[#1c1b1b] text-white' },
        { cat: 'CORE', items: 'Dashboard · Calendar · Feed · Live · Chat Rooms', color: 'bg-[#2a2929] text-white' },
        { cat: 'EDUCATION', items: 'Class Manager · Tuition Manager · Homework Tracker', color: 'bg-[#f0eded] text-[#1c1b1b]' },
        { cat: 'EVENTS', items: 'Ticket Booking · Workshop Registration · Venue Booking', color: 'bg-[#f0eded] text-[#1c1b1b]' },
        { cat: 'COMMERCE', items: 'Group Shop · Rental System · Membership Billing', color: 'bg-[#f0eded] text-[#1c1b1b]' },
        { cat: 'OPERATIONS', items: 'Task Manager · Internal Wiki · Recruitment', color: 'bg-[#f0eded] text-[#1c1b1b]' },
        { cat: 'AI', items: 'AI Assistant · Auto Translation · AI Insights', color: 'bg-[#f0eded] text-[#1c1b1b]' },
      ].map((r) => (
        <div key={r.cat} className={`${r.color} rounded-xl px-7 py-4 flex items-center gap-5 border border-[#d4d4d4]/10`}>
          <span className="font-['Space_Grotesk'] text-[14px] md:text-[18px] font-bold tracking-widest uppercase w-[120px] md:w-[160px] text-left flex-shrink-0">{r.cat}</span>
          <span className="text-[14px] md:text-[18px] font-medium opacity-70">{r.items}</span>
        </div>
      ))}
    </div>
  </div>
);

// Slide 22: 하나의 Group은 하나의 살아있는 세계가 된다 (5 EXAMPLE CARDS)
export const Slide22 = () => (
  <div className="relative z-10 flex flex-col items-center justify-center text-center w-full h-full px-[40px]">
    <h2 className="text-[36px] md:text-[72px] font-bold text-[#1c1b1b] leading-[1.15] tracking-tight break-keep mb-5">
      하나의 Group은<br/>하나의 살아있는 세계가 된다
    </h2>
    <p className="font-['Space_Grotesk'] text-[18px] md:text-[24px] font-bold tracking-widest text-[#444748]/50 uppercase mb-12">A group becomes a living world.</p>
    <div className="flex flex-wrap gap-4 justify-center mb-12">
      {['Tango Studio', 'Yoga Brand', 'Daechi Academy', 'Fan Community', 'Startup Team'].map((g) => (
        <span key={g} className="bg-[#f0eded] text-[#1c1b1b] rounded-2xl px-8 py-5 text-[18px] md:text-[22px] font-bold border border-[#d4d4d4]/30">{g}</span>
      ))}
    </div>
    <div className="bg-[#1c1b1b] rounded-2xl px-10 py-5">
      <p className="text-[18px] md:text-[24px] text-white font-semibold break-keep">WoC는 커뮤니티를 위한 운영체제를 만든다.</p>
    </div>
  </div>
);
