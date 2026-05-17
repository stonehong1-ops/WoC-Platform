import React from 'react';

// Slide 18: Section Divider - SECTION 4 — GROUP OPERATING SYSTEM
export const Slide18 = () => (
  <div className="relative z-10 flex flex-col items-center justify-center text-center w-full h-full bg-[#1c1b1b]">
    <p className="font-['Space_Grotesk'] text-[16px] font-bold tracking-[0.3em] text-white/30 uppercase mb-8 pt1-fu">SECTION 4</p>
    <h2 className="font-['Space_Grotesk'] text-[52px] md:text-[104px] font-bold text-white tracking-wider leading-tight pt1-si pt1-d2 pt1-gp">
      GROUP<br/>OPERATING SYSTEM
    </h2>
    <div className="w-[80px] h-[3px] bg-white/30 mt-10 pt1-lg pt1-d5" />
  </div>
);

// Slide 19: Group은 단순 커뮤니티가 아니다
export const Slide19 = () => (
  <div className="relative z-10 flex flex-col items-center justify-center text-center w-full h-full px-[40px]">
    <h2 className="text-[44px] md:text-[96px] font-bold text-[#1c1b1b] leading-[1.15] tracking-tight break-keep mb-12 pt1-fu">
      Group은<br/>단순 커뮤니티가 아니다
    </h2>
    <div className="bg-[#1c1b1b] rounded-2xl px-12 py-6 pt1-si pt1-d4">
      <p className="font-['Space_Grotesk'] text-[22px] md:text-[32px] font-bold tracking-widest text-white uppercase">
        Groups become operating systems.
      </p>
    </div>
  </div>
);

export const Slide20 = () => (
  <div className="relative z-10 flex flex-col w-full h-full bg-[#fcf8f8] text-[#111111]">
    <div className="pt-[100px] px-[100px]">
      <h2 className="text-[80px] font-[900] tracking-[-0.05em] leading-[1.1] pt1-fu">
        Every Group has<br/>a different Workflow.
      </h2>
      <p className="mt-8 text-[24px] font-medium text-black/40 pt1-fu pt1-d3">모든 Group은 서로 다른 시스템을 가진다</p>
    </div>

    <div className="flex-1 mt-20 border-t border-black/10 grid grid-cols-4 h-full">
      {[
        { name: 'Tango Studio', sub: 'Dance Community' },
        { name: 'Academy', sub: 'Education' },
        { name: 'Startup', sub: 'Product Team' },
        { name: 'Fan Community', sub: 'Interest Group' },
      ].map((g, idx) => (
        <div key={g.name} className={`p-12 flex flex-col justify-between ${idx !== 3 ? 'border-r border-black/10' : ''} group hover:bg-black/[0.03] transition-colors duration-300 pt1-fu`} style={{ animationDelay: `${400 + idx * 120}ms` }}>
          <div className="flex flex-col gap-6">
            <span className="text-[14px] font-bold tracking-[0.2em] text-black/30 uppercase">TYPE 0{idx + 1}</span>
            <h3 className="text-[32px] font-bold tracking-tight leading-tight">{g.name}</h3>
            <p className="text-[16px] text-black/40">{g.sub}</p>
          </div>
          <div className="w-8 h-[1px] bg-black/20 group-hover:w-16 transition-all duration-500" />
        </div>
      ))}
    </div>
  </div>
);

// Slide 21: One Platform, Infinite Community Systems (CATEGORY GRID)
export const Slide21 = () => (
  <div className="relative z-10 flex flex-col items-center justify-center text-center w-full h-full px-[40px] py-6">
    <h2 className="text-[36px] md:text-[64px] font-bold text-[#1c1b1b] leading-[1.15] tracking-tight break-keep mb-3 pt1-fu">
      One Platform<br/>Infinite Community Systems
    </h2>
    <p className="font-['Space_Grotesk'] text-[15px] md:text-[20px] font-bold tracking-widest text-[#444748]/50 uppercase mb-8 pt1-fu pt1-d2">50+ Functions · Build your own community system.</p>
    <div className="flex flex-col gap-3 w-full max-w-[1100px]">
      {[
        { cat: 'ADMIN', items: 'Brand Setting · Class Setting · Shop Setting', color: 'bg-[#1c1b1b] text-white' },
        { cat: 'CORE', items: 'Dashboard · Calendar · Feed · Live · Chat Rooms', color: 'bg-[#2a2929] text-white' },
        { cat: 'EDUCATION', items: 'Class Manager · Tuition Manager · Homework Tracker', color: 'bg-[#f0eded] text-[#1c1b1b]' },
        { cat: 'EVENTS', items: 'Ticket Booking · Workshop Registration · Venue Booking', color: 'bg-[#f0eded] text-[#1c1b1b]' },
        { cat: 'COMMERCE', items: 'Group Shop · Rental System · Membership Billing', color: 'bg-[#f0eded] text-[#1c1b1b]' },
        { cat: 'OPERATIONS', items: 'Task Manager · Internal Wiki · Recruitment', color: 'bg-[#f0eded] text-[#1c1b1b]' },
        { cat: 'AI', items: 'AI Assistant · Auto Translation · AI Insights', color: 'bg-[#f0eded] text-[#1c1b1b]' },
      ].map((r, i) => (
        <div key={r.cat} className={`${r.color} rounded-xl px-7 py-4 flex items-center gap-5 border border-[#d4d4d4]/10 hover:scale-[1.01] transition-transform duration-300 pt1-sr`} style={{ animationDelay: `${300 + i * 80}ms` }}>
          <span className="font-['Space_Grotesk'] text-[14px] md:text-[18px] font-bold tracking-widest uppercase w-[120px] md:w-[160px] text-left flex-shrink-0">{r.cat}</span>
          <span className="text-[14px] md:text-[18px] font-medium opacity-70">{r.items}</span>
        </div>
      ))}
    </div>
    
    <div className="mt-10 pt1-si pt1-d10">
      <span className="bg-[#1c1b1b] text-white/90 border-2 border-white/20 rounded-full px-8 py-3 text-[16px] md:text-[20px] font-bold tracking-tight shadow-[0_10px_25px_rgba(0,0,0,0.2)]">
        SalesForce.com 과 같은 서비스 라인업 확장
      </span>
    </div>
  </div>
);

// Slide 22: 하나의 Group은 하나의 살아있는 세계가 된다 (5 EXAMPLE CARDS)
export const Slide22 = () => (
  <div className="relative z-10 flex flex-col items-center justify-center text-center w-full h-full px-[40px]">
    <h2 className="text-[36px] md:text-[72px] font-bold text-[#1c1b1b] leading-[1.15] tracking-tight break-keep mb-5 pt1-fu">
      하나의 Group은<br/>하나의 살아있는 세계가 된다
    </h2>
    <p className="font-['Space_Grotesk'] text-[18px] md:text-[24px] font-bold tracking-widest text-[#444748]/50 uppercase mb-12 pt1-fu pt1-d2">A group becomes a living world.</p>
    <div className="flex flex-wrap gap-4 justify-center mb-12">
      {['Tango Studio', 'Yoga Brand', 'Daechi Academy', 'Fan Community', 'Startup Team'].map((g, i) => (
        <span key={g} className="bg-[#f0eded] text-[#1c1b1b] rounded-2xl px-8 py-5 text-[18px] md:text-[22px] font-bold border border-[#d4d4d4]/30 hover:bg-[#1c1b1b] hover:text-white transition-colors duration-300 pt1-si" style={{ animationDelay: `${400 + i * 100}ms` }}>{g}</span>
      ))}
    </div>
    <div className="bg-[#1c1b1b] rounded-2xl px-10 py-5 pt1-fu pt1-d9">
      <p className="text-[18px] md:text-[24px] text-white font-semibold break-keep">WoC는 커뮤니티를 위한 운영체제를 만든다.</p>
    </div>
  </div>
);
