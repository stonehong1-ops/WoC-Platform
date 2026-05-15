import React from 'react';

// Slide 23: Section Divider - SECTION 5 — BUSINESS PENETRATION
export const Slide23 = () => (
  <div className="relative z-10 flex flex-col items-center justify-center text-center w-full h-full bg-[#1c1b1b]">
    <p className="font-['Space_Grotesk'] text-[16px] font-bold tracking-[0.3em] text-white/30 uppercase mb-8 pt1-fu">SECTION 5</p>
    <h2 className="font-['Space_Grotesk'] text-[56px] md:text-[112px] font-bold text-white tracking-wider leading-tight pt1-si pt1-d2 pt1-gp">
      BUSINESS<br/>PENETRATION
    </h2>
    <div className="w-[80px] h-[3px] bg-white/30 mt-10 pt1-lg pt1-d5" />
  </div>
);

// Slide 24: Business Penetration (2 PHASE BOXES)
export const Slide24 = () => (
  <div className="relative z-10 flex flex-col items-center justify-center text-center w-full h-full px-[40px]">
    <h2 className="text-[44px] md:text-[88px] font-bold text-[#1c1b1b] leading-[1.15] tracking-tight break-keep mb-5 pt1-fu">
      Business Penetration
    </h2>
    <p className="font-['Space_Grotesk'] text-[18px] md:text-[24px] font-bold tracking-widest text-[#444748]/50 uppercase mb-14 pt1-fu pt1-d2">Start from existing communities.</p>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-[1000px] mb-12">
      <div className="bg-[#1c1b1b] rounded-2xl p-8 md:p-10 text-left pt1-sl pt1-d3">
        <p className="font-['Space_Grotesk'] text-[18px] font-bold tracking-widest text-white/40 uppercase mb-5">PHASE 1</p>
        <div className="flex flex-wrap gap-3">
          {['Tango', 'Dance', 'Yoga', 'Running'].map((t, i) => (
            <span key={t} className="border border-white/30 text-white rounded-full px-6 py-2.5 text-[16px] font-medium pt1-fi" style={{ animationDelay: `${500 + i * 100}ms` }}>{t}</span>
          ))}
        </div>
      </div>
      <div className="bg-[#f0eded] rounded-2xl p-8 md:p-10 text-left border border-[#d4d4d4]/30 pt1-sr pt1-d4">
        <p className="font-['Space_Grotesk'] text-[18px] font-bold tracking-widest text-[#444748]/50 uppercase mb-5">PHASE 2</p>
        <div className="flex flex-wrap gap-3">
          {['Academy', 'Fan Community', 'Startup'].map((t, i) => (
            <span key={t} className="border border-[#1c1b1b]/30 text-[#1c1b1b] rounded-full px-6 py-2.5 text-[16px] font-medium pt1-fi" style={{ animationDelay: `${700 + i * 100}ms` }}>{t}</span>
          ))}
        </div>
      </div>
    </div>
    <p className="text-[20px] md:text-[28px] text-[#444748] font-semibold break-keep pt1-fu pt1-d8">WoC는 모든 시장을 동시에 공략하지 않는다.</p>
  </div>
);

export const Slide25 = () => (
  <div className="relative z-10 flex flex-col w-full h-full bg-[#fcf8f8] text-[#111111] px-[100px] justify-center">
    <div className="max-w-[1200px]">
      <h2 className="text-[80px] font-[900] tracking-[-0.05em] leading-tight mb-20 pt1-fu">
        Tango Community<br/>Penetration.
      </h2>
      
      <div className="grid grid-cols-2 gap-[120px]">
        {/* Left: Instructor */}
        <div className="flex flex-col pt1-sl pt1-d3">
          <div className="flex items-baseline gap-4 mb-8">
            <span className="text-[14px] font-bold tracking-widest text-black/30">01</span>
            <h3 className="text-[44px] font-bold tracking-tight">Instructor</h3>
          </div>
          <p className="text-[20px] leading-[1.6] text-black/60 mb-12">
            클래스 등록 / 결제 승인 / 워크샵 운영<br/>
            전문 교육 중심의 워크플로우
          </p>
          <div className="flex items-center gap-6">
            <div className="text-[52px] font-[900] tracking-tighter pt1-cu pt1-d6">1:50</div>
            <div className="text-[14px] font-bold tracking-widest text-black/30 uppercase leading-tight">
              Average<br/>Connections
            </div>
          </div>
        </div>

        {/* Right: Organizer */}
        <div className="flex flex-col pt1-sr pt1-d4">
          <div className="flex items-baseline gap-4 mb-8">
            <span className="text-[14px] font-bold tracking-widest text-black/30">02</span>
            <h3 className="text-[44px] font-bold tracking-tight">Organizer</h3>
          </div>
          <p className="text-[20px] leading-[1.6] text-black/60 mb-12">
            소셜 등록 / 티켓 / 이벤트 운영 / 테이블 예약<br/>
            이벤트 및 공간 운영 중심의 워크플로우
          </p>
          <div className="flex items-center gap-6">
            <div className="text-[52px] font-[900] tracking-tighter pt1-cu pt1-d7">1:100</div>
            <div className="text-[14px] font-bold tracking-widest text-black/30 uppercase leading-tight">
              Average<br/>Connections
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// Slide 26: 강사와 오거나이저는 새로운 onboarding node가 된다 (FLOW)
export const Slide26 = () => (
  <div className="relative z-10 flex flex-col items-center justify-center text-center w-full h-full px-[40px]">
    <h2 className="text-[36px] md:text-[68px] font-bold text-[#1c1b1b] leading-[1.15] tracking-tight break-keep mb-14 pt1-fu">
      강사와 오거나이저는<br/>새로운 onboarding node가 된다
    </h2>
    <div className="flex flex-col md:flex-row items-center gap-5 md:gap-8 mb-12">
      <div className="bg-[#1c1b1b] text-white rounded-2xl px-10 py-5 pt1-sl pt1-d3">
        <p className="font-['Space_Grotesk'] text-[20px] font-bold tracking-wider uppercase">Instructor</p>
      </div>
      <span className="text-[#c4c7c8] text-[32px] font-bold rotate-90 md:rotate-0 pt1-fi pt1-d4">→</span>
      <div className="bg-[#f0eded] rounded-2xl px-10 py-5 border border-[#d4d4d4]/30 pt1-si pt1-d5">
        <p className="text-[20px] font-bold text-[#1c1b1b]">Students</p>
      </div>
      <span className="text-[#c4c7c8] text-[32px] font-bold mx-4 hidden md:block pt1-fi pt1-d5">|</span>
      <div className="bg-[#1c1b1b] text-white rounded-2xl px-10 py-5 pt1-sl pt1-d5">
        <p className="font-['Space_Grotesk'] text-[20px] font-bold tracking-wider uppercase">Organizer</p>
      </div>
      <span className="text-[#c4c7c8] text-[32px] font-bold rotate-90 md:rotate-0 pt1-fi pt1-d6">→</span>
      <div className="bg-[#f0eded] rounded-2xl px-10 py-5 border border-[#d4d4d4]/30 pt1-si pt1-d7">
        <p className="text-[20px] font-bold text-[#1c1b1b]">Participants</p>
      </div>
    </div>
    <div className="bg-[#f0eded] rounded-2xl px-10 py-5 border border-[#d4d4d4]/30 pt1-fu pt1-d8">
      <p className="text-[18px] md:text-[24px] text-[#1c1b1b] font-semibold break-keep">Group 자체가 onboarding node 역할을 한다.</p>
    </div>
  </div>
);

// Slide 27: 2,000명 규모는 2개월 내 penetration 가능성 예상
export const Slide27 = () => (
  <div className="relative z-10 flex flex-col items-center justify-center text-center w-full h-full px-[40px]">
    <div className="flex items-baseline gap-4 mb-8">
      <span className="text-[72px] md:text-[140px] font-bold text-[#1c1b1b] leading-none pt1-cu">2,000</span>
      <span className="text-[32px] md:text-[48px] font-bold text-[#444748] pt1-fu pt1-d3">명 규모</span>
    </div>
    <h2 className="text-[36px] md:text-[64px] font-bold text-[#1c1b1b] leading-[1.2] tracking-tight break-keep mb-10 pt1-fu pt1-d3">
      2개월 내 penetration 가능성 예상
    </h2>
    <p className="text-[20px] md:text-[28px] text-[#444748] font-medium break-keep pt1-fu pt1-d5">광고보다 community penetration 중심.</p>
  </div>
);

// Slide 28: 사람은 하나의 활동으로 살지 않는다 (ACTIVITY MIGRATION)
export const Slide28 = () => (
  <div className="relative z-10 flex flex-col items-center justify-center w-full h-full px-[40px] bg-white">
    {/* Main Headline */}
    <div className="mb-16 text-center">
      <h2 className="text-[40px] md:text-[80px] font-bold text-[#1c1b1b] leading-[1.1] tracking-tight break-keep pt1-fu">
        사람은 하나의 활동으로 살지 않는다
      </h2>
      <p className="mt-8 text-[20px] md:text-[32px] text-[#444748] font-medium opacity-60 pt1-fu pt1-d2">People naturally move between activities.</p>
    </div>

    {/* Activity Migration Flow */}
    <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8 mb-16 w-full max-w-[1200px]">
      {[
        { name: 'Tango', sub: 'Dance' },
        { name: 'Yoga', sub: 'Body Flow' },
        { name: 'Running Crew', sub: 'Urban Sports' },
        { name: 'Coffee Community', sub: 'Table' },
      ].map((act, idx) => (
        <React.Fragment key={act.name}>
          <div className="flex flex-col items-center group">
            <div className="bg-[#1c1b1b] text-white rounded-3xl px-10 py-6 md:px-12 md:py-8 shadow-xl group-hover:scale-105 transition-transform duration-300 pt1-si" style={{ animationDelay: `${400 + idx * 150}ms` }}>
              <p className="text-[24px] md:text-[36px] font-black tracking-tight">{act.name}</p>
              <p className="font-['Space_Grotesk'] text-[12px] md:text-[14px] font-bold tracking-[0.2em] text-white/40 uppercase mt-2">{act.sub}</p>
            </div>
          </div>
          {idx < 3 && (
            <div className="text-[#c4c7c8] text-[32px] md:text-[48px] font-light rotate-90 md:rotate-0 pt1-fi" style={{ animationDelay: `${550 + idx * 150}ms` }}>
              →
            </div>
          )}
        </React.Fragment>
      ))}
    </div>

    {/* Philosophy Statement */}
    <div className="text-center max-w-[900px] pt1-fu pt1-d10">
      <div className="inline-block bg-[#f0eded] border border-[#d4d4d4]/30 rounded-2xl px-12 py-6">
        <p className="text-[20px] md:text-[28px] text-[#1c1b1b] font-bold leading-relaxed break-keep">
          활동의 이동이 자연스럽게 새로운 커뮤니티를 만든다.<br/>
          <span className="text-[#444748] opacity-60 text-[18px] md:text-[24px] font-semibold mt-2 block">
            WoC는 회원을 광고로 모으지 않습니다.
          </span>
        </p>
      </div>
    </div>
  </div>
);

// Slide 29: 사람들은 하나의 활동에만 머물지 않는다 (CHAIN)
export const Slide29 = () => (
  <div className="relative z-10 flex flex-col items-center justify-center text-center w-full h-full px-[40px]">
    <h2 className="text-[36px] md:text-[72px] font-bold text-[#1c1b1b] leading-[1.15] tracking-tight break-keep mb-6 pt1-fu">
      사람들은 하나의 활동에만<br/>머물지 않는다
    </h2>
    <p className="font-['Space_Grotesk'] text-[18px] md:text-[24px] font-bold tracking-widest text-[#444748]/50 uppercase mb-12 pt1-fu pt1-d2">Communities naturally overlap.</p>
    <div className="flex flex-wrap items-center gap-4 justify-center mb-12">
      {['Tango', 'Yoga', 'Running', 'Coffee', 'Travel'].map((t, i) => (
        <React.Fragment key={t}>
          <span className="bg-[#1c1b1b] text-white rounded-full px-8 py-4 font-['Space_Grotesk'] text-[18px] md:text-[22px] font-bold tracking-wider pt1-si" style={{ animationDelay: `${400 + i * 120}ms` }}>{t}</span>
          {i < 4 && <span className="text-[#c4c7c8] text-[28px] font-bold pt1-fi" style={{ animationDelay: `${460 + i * 120}ms` }}>→</span>}
        </React.Fragment>
      ))}
    </div>
    <p className="text-[20px] md:text-[28px] text-[#444748] font-semibold break-keep pt1-fu pt1-d9">
      WoC는 활동 중심 network structure를 만든다.
    </p>
  </div>
);

// Slide 30: WoC는 Community Penetration에 가깝다
export const Slide30 = () => (
  <div className="relative z-10 flex flex-col items-center justify-center text-center w-full h-full px-[40px]">
    <h2 className="text-[36px] md:text-[72px] font-bold text-[#1c1b1b] leading-[1.15] tracking-tight break-keep mb-10 pt1-fu">
      WoC는 User Acquisition보다<br/>Community Penetration에 가깝다
    </h2>
    <div className="bg-[#1c1b1b] rounded-2xl px-12 py-6 pt1-si pt1-d5">
      <p className="font-['Space_Grotesk'] text-[20px] md:text-[30px] font-bold tracking-widest text-white uppercase">
        WoC는 group 기반으로 확장된다.
      </p>
    </div>
  </div>
);
