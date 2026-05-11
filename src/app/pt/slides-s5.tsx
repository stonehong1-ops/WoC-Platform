import React from 'react';

// Slide 23: Section Divider - SECTION 5 — BUSINESS PENETRATION
export const Slide23 = () => (
  <div className="relative z-10 flex flex-col items-center justify-center text-center w-full h-full bg-[#1c1b1b]">
    <p className="font-['Space_Grotesk'] text-[16px] font-bold tracking-[0.3em] text-white/30 uppercase mb-8">SECTION 5</p>
    <h2 className="font-['Space_Grotesk'] text-[56px] md:text-[112px] font-bold text-white tracking-wider leading-tight">
      BUSINESS<br/>PENETRATION
    </h2>
    <div className="w-[80px] h-[3px] bg-white/30 mt-10" />
  </div>
);

// Slide 24: Business Penetration (2 PHASE BOXES)
export const Slide24 = () => (
  <div className="relative z-10 flex flex-col items-center justify-center text-center w-full h-full px-[40px]">
    <h2 className="text-[44px] md:text-[88px] font-bold text-[#1c1b1b] leading-[1.15] tracking-tight break-keep mb-5">
      Business Penetration
    </h2>
    <p className="font-['Space_Grotesk'] text-[18px] md:text-[24px] font-bold tracking-widest text-[#444748]/50 uppercase mb-14">Start from existing communities.</p>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-[1000px] mb-12">
      <div className="bg-[#1c1b1b] rounded-2xl p-8 md:p-10 text-left">
        <p className="font-['Space_Grotesk'] text-[18px] font-bold tracking-widest text-white/40 uppercase mb-5">PHASE 1</p>
        <div className="flex flex-wrap gap-3">
          {['Tango', 'Dance', 'Yoga', 'Running'].map((t) => (
            <span key={t} className="border border-white/30 text-white rounded-full px-6 py-2.5 text-[16px] font-medium">{t}</span>
          ))}
        </div>
      </div>
      <div className="bg-[#f0eded] rounded-2xl p-8 md:p-10 text-left border border-[#d4d4d4]/30">
        <p className="font-['Space_Grotesk'] text-[18px] font-bold tracking-widest text-[#444748]/50 uppercase mb-5">PHASE 2</p>
        <div className="flex flex-wrap gap-3">
          {['Academy', 'Fan Community', 'Startup'].map((t) => (
            <span key={t} className="border border-[#1c1b1b]/30 text-[#1c1b1b] rounded-full px-6 py-2.5 text-[16px] font-medium">{t}</span>
          ))}
        </div>
      </div>
    </div>
    <p className="text-[20px] md:text-[28px] text-[#444748] font-semibold break-keep">WoC는 모든 시장을 동시에 공략하지 않는다.</p>
  </div>
);

// Slide 25: Tango Community Example (2 COLUMN CARDS)
export const Slide25 = () => (
  <div className="relative z-10 flex flex-col items-center justify-center text-center w-full h-full px-[40px]">
    <h2 className="text-[40px] md:text-[76px] font-bold text-[#1c1b1b] leading-[1.15] tracking-tight break-keep mb-5">
      Tango Community Example
    </h2>
    <p className="font-['Space_Grotesk'] text-[18px] md:text-[24px] font-bold tracking-widest text-[#444748]/50 uppercase mb-12">Community penetration structure.</p>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-[1000px]">
      <div className="bg-[#f0eded] rounded-2xl p-8 md:p-10 text-left border border-[#d4d4d4]/30">
        <p className="font-['Space_Grotesk'] text-[20px] font-bold tracking-widest text-[#1c1b1b] uppercase mb-5">🎓 강사 (Instructor)</p>
        <p className="text-[17px] md:text-[20px] text-[#444748] mb-4">클래스 등록 / 결제 승인 / 워크샵 운영</p>
        <div className="mt-4 bg-[#1c1b1b] rounded-full px-6 py-3 inline-block">
          <p className="text-[16px] text-white font-bold">1명당 약 50명 연결</p>
        </div>
      </div>
      <div className="bg-[#f0eded] rounded-2xl p-8 md:p-10 text-left border border-[#d4d4d4]/30">
        <p className="font-['Space_Grotesk'] text-[20px] font-bold tracking-widest text-[#1c1b1b] uppercase mb-5">🎪 오거나이저 (Organizer)</p>
        <p className="text-[17px] md:text-[20px] text-[#444748] mb-4">소셜 등록 / 티켓 / 이벤트 운영 / 테이블 예약</p>
        <div className="mt-4 bg-[#1c1b1b] rounded-full px-6 py-3 inline-block">
          <p className="text-[16px] text-white font-bold">1명당 약 100명 연결</p>
        </div>
      </div>
    </div>
  </div>
);

// Slide 26: 강사와 오거나이저는 새로운 onboarding node가 된다 (FLOW)
export const Slide26 = () => (
  <div className="relative z-10 flex flex-col items-center justify-center text-center w-full h-full px-[40px]">
    <h2 className="text-[36px] md:text-[68px] font-bold text-[#1c1b1b] leading-[1.15] tracking-tight break-keep mb-14">
      강사와 오거나이저는<br/>새로운 onboarding node가 된다
    </h2>
    <div className="flex flex-col md:flex-row items-center gap-5 md:gap-8 mb-12">
      <div className="bg-[#1c1b1b] text-white rounded-2xl px-10 py-5">
        <p className="font-['Space_Grotesk'] text-[20px] font-bold tracking-wider uppercase">Instructor</p>
      </div>
      <span className="text-[#c4c7c8] text-[32px] font-bold rotate-90 md:rotate-0">→</span>
      <div className="bg-[#f0eded] rounded-2xl px-10 py-5 border border-[#d4d4d4]/30">
        <p className="text-[20px] font-bold text-[#1c1b1b]">Students</p>
      </div>
      <span className="text-[#c4c7c8] text-[32px] font-bold mx-4 hidden md:block">|</span>
      <div className="bg-[#1c1b1b] text-white rounded-2xl px-10 py-5">
        <p className="font-['Space_Grotesk'] text-[20px] font-bold tracking-wider uppercase">Organizer</p>
      </div>
      <span className="text-[#c4c7c8] text-[32px] font-bold rotate-90 md:rotate-0">→</span>
      <div className="bg-[#f0eded] rounded-2xl px-10 py-5 border border-[#d4d4d4]/30">
        <p className="text-[20px] font-bold text-[#1c1b1b]">Participants</p>
      </div>
    </div>
    <div className="bg-[#f0eded] rounded-2xl px-10 py-5 border border-[#d4d4d4]/30">
      <p className="text-[18px] md:text-[24px] text-[#1c1b1b] font-semibold break-keep">Group 자체가 onboarding node 역할을 한다.</p>
    </div>
  </div>
);

// Slide 27: 2,000명 규모는 2개월 내 penetration 가능성 예상
export const Slide27 = () => (
  <div className="relative z-10 flex flex-col items-center justify-center text-center w-full h-full px-[40px]">
    <div className="flex items-baseline gap-4 mb-8">
      <span className="text-[72px] md:text-[140px] font-bold text-[#1c1b1b] leading-none">2,000</span>
      <span className="text-[32px] md:text-[48px] font-bold text-[#444748]">명 규모</span>
    </div>
    <h2 className="text-[36px] md:text-[64px] font-bold text-[#1c1b1b] leading-[1.2] tracking-tight break-keep mb-10">
      2개월 내 penetration 가능성 예상
    </h2>
    <p className="text-[20px] md:text-[28px] text-[#444748] font-medium break-keep">광고보다 community penetration 중심.</p>
  </div>
);

// Slide 28: 별도의 마케팅 없이 자연스럽게 회원이 확대된다 (FLOW)
export const Slide28 = () => (
  <div className="relative z-10 flex flex-col items-center justify-center text-center w-full h-full px-[40px]">
    <h2 className="text-[36px] md:text-[72px] font-bold text-[#1c1b1b] leading-[1.15] tracking-tight break-keep mb-6">
      별도의 마케팅 없이<br/>자연스럽게 회원이 확대된다
    </h2>
    <p className="font-['Space_Grotesk'] text-[18px] md:text-[24px] font-bold tracking-widest text-[#444748]/50 uppercase mb-12">Community penetration.</p>
    <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6 mb-12">
      <div className="bg-[#1c1b1b] text-white rounded-xl px-8 py-4"><p className="text-[18px] font-bold">강사</p></div>
      <span className="text-[#c4c7c8] text-[28px] rotate-90 md:rotate-0">→</span>
      <div className="bg-[#f0eded] rounded-xl px-8 py-4 border border-[#d4d4d4]/30"><p className="text-[18px] font-bold text-[#1c1b1b]">학생</p></div>
      <span className="text-[#c4c7c8] text-[28px] rotate-90 md:rotate-0">→</span>
      <div className="bg-[#1c1b1b] text-white rounded-xl px-8 py-4"><p className="text-[18px] font-bold">오거나이저</p></div>
      <span className="text-[#c4c7c8] text-[28px] rotate-90 md:rotate-0">→</span>
      <div className="bg-[#f0eded] rounded-xl px-8 py-4 border border-[#d4d4d4]/30"><p className="text-[18px] font-bold text-[#1c1b1b]">참가자</p></div>
    </div>
    <div className="bg-[#1c1b1b] rounded-2xl px-10 py-5">
      <p className="text-[16px] md:text-[22px] text-white font-semibold break-keep">
        WoC는 User Acquisition보다 Community Penetration에 가깝다.
      </p>
    </div>
  </div>
);

// Slide 29: 사람들은 하나의 활동에만 머물지 않는다 (CHAIN)
export const Slide29 = () => (
  <div className="relative z-10 flex flex-col items-center justify-center text-center w-full h-full px-[40px]">
    <h2 className="text-[36px] md:text-[72px] font-bold text-[#1c1b1b] leading-[1.15] tracking-tight break-keep mb-6">
      사람들은 하나의 활동에만<br/>머물지 않는다
    </h2>
    <p className="font-['Space_Grotesk'] text-[18px] md:text-[24px] font-bold tracking-widest text-[#444748]/50 uppercase mb-12">Communities naturally overlap.</p>
    <div className="flex flex-wrap items-center gap-4 justify-center mb-12">
      {['Tango', 'Yoga', 'Running', 'Coffee', 'Travel'].map((t, i) => (
        <React.Fragment key={t}>
          <span className="bg-[#1c1b1b] text-white rounded-full px-8 py-4 font-['Space_Grotesk'] text-[18px] md:text-[22px] font-bold tracking-wider">{t}</span>
          {i < 4 && <span className="text-[#c4c7c8] text-[28px] font-bold">→</span>}
        </React.Fragment>
      ))}
    </div>
    <p className="text-[20px] md:text-[28px] text-[#444748] font-semibold break-keep">
      WoC는 활동 중심 network structure를 만든다.
    </p>
  </div>
);

// Slide 30: WoC는 Community Penetration에 가깝다
export const Slide30 = () => (
  <div className="relative z-10 flex flex-col items-center justify-center text-center w-full h-full px-[40px]">
    <h2 className="text-[36px] md:text-[72px] font-bold text-[#1c1b1b] leading-[1.15] tracking-tight break-keep mb-10">
      WoC는 User Acquisition보다<br/>Community Penetration에 가깝다
    </h2>
    <div className="bg-[#1c1b1b] rounded-2xl px-12 py-6">
      <p className="font-['Space_Grotesk'] text-[20px] md:text-[30px] font-bold tracking-widest text-white uppercase">
        WoC는 group 기반으로 확장된다.
      </p>
    </div>
  </div>
);
