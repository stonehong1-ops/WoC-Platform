import React from 'react';

// Slide 13: Section Divider - SECTION 3 — COMMUNITY ECONOMY
export const Slide13 = () => (
  <div className="relative z-10 flex flex-col items-center justify-center text-center w-full h-full bg-[#1c1b1b]">
    <p className="font-['Space_Grotesk'] text-[16px] font-bold tracking-[0.3em] text-white/30 uppercase mb-8">SECTION 3</p>
    <h2 className="font-['Space_Grotesk'] text-[56px] md:text-[112px] font-bold text-white tracking-wider leading-tight">
      COMMUNITY<br/>ECONOMY
    </h2>
    <div className="w-[80px] h-[3px] bg-white/30 mt-10" />
  </div>
);

// Slide 14: 작은 커뮤니티 하나에도 거대한 경제가 존재한다 (FLOW BOXES)
export const Slide14 = () => (
  <div className="relative z-10 flex flex-col items-center justify-center text-center w-full h-full px-[40px]">
    <h2 className="text-[40px] md:text-[76px] font-bold text-[#1c1b1b] leading-[1.15] tracking-tight break-keep mb-6">
      작은 커뮤니티 하나에도<br/>거대한 경제가 존재한다
    </h2>
    <p className="font-['Space_Grotesk'] text-[18px] md:text-[24px] font-bold tracking-widest text-[#444748]/50 uppercase mb-12">Activity creates economy.</p>
    <div className="flex flex-wrap gap-4 justify-center mb-8">
      {['클래스', '워크샵', '공연', '여행', '커피', '공간'].map((t) => (
        <span key={t} className="bg-[#f0eded] text-[#1c1b1b] rounded-full px-7 py-3 text-[18px] font-semibold border border-[#d4d4d4]/30">{t}</span>
      ))}
    </div>
    <span className="text-[#c4c7c8] text-[32px] mb-6">↓</span>
    <div className="flex flex-wrap gap-4 justify-center mb-10">
      {['Booking', 'Tickets', 'Rentals', 'Membership'].map((t) => (
        <span key={t} className="bg-[#1c1b1b] text-white rounded-full px-7 py-3 font-['Space_Grotesk'] text-[16px] md:text-[20px] font-bold tracking-wider uppercase">{t}</span>
      ))}
    </div>
    <p className="text-[20px] md:text-[28px] text-[#444748] font-semibold break-keep">WoC는 인간 활동 경제의 흐름을 연결한다.</p>
  </div>
);

// Slide 15: 한국 탱고 인구 약 2,000명 (STAT CARDS + ECOSYSTEM)
export const Slide15 = () => (
  <div className="relative z-10 flex flex-col items-center justify-center text-center w-full h-full px-[40px]">
    <h2 className="text-[36px] md:text-[64px] font-bold text-[#1c1b1b] leading-[1.15] tracking-tight break-keep mb-3">
      한국 탱고 인구 약 <span className="text-[48px] md:text-[88px]">2,000</span>명
    </h2>
    <p className="font-['Space_Grotesk'] text-[15px] md:text-[20px] font-bold tracking-widest text-[#444748]/50 uppercase mb-8">A small community already creates a large economy.</p>
    <div className="flex flex-wrap gap-3 justify-center mb-10 max-w-[800px]">
      {['클래스', '밀롱가', '워크샵', '슈즈', '의상', '여행', '숙박', '식음료', '대관'].map((t) => (
        <span key={t} className="border border-[#c4c7c8]/50 text-[#444748] rounded-full px-5 py-2 text-[14px] md:text-[16px] font-medium">{t}</span>
      ))}
    </div>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-[1100px] mb-10">
      {[
        { val: '45만원', label: '1인 평균 월 소비' },
        { val: '108억', label: '연간 activity economy' },
        { val: '32억', label: 'WoC Connected GMV' },
        { val: '2.2억', label: '예상 플랫폼 매출/yr' },
      ].map((s) => (
        <div key={s.label} className="bg-[#f0eded] rounded-2xl p-5 md:p-7 border border-[#d4d4d4]/30">
          <p className="text-[36px] md:text-[48px] font-bold text-[#1c1b1b] leading-none mb-3">{s.val}</p>
          <p className="text-[13px] md:text-[15px] text-[#444748]/60 font-medium">{s.label}</p>
        </div>
      ))}
    </div>
    <p className="text-[20px] md:text-[28px] text-[#444748] font-semibold break-keep">
      작은 community 하나에도 이미 거대한 경제가 흐르고 있다.
    </p>
  </div>
);

// Slide 16: WoC는 이 흐름을 연결한다 (TAG FLOW)
export const Slide16 = () => (
  <div className="relative z-10 flex flex-col items-center justify-center text-center w-full h-full px-[40px]">
    <h2 className="text-[44px] md:text-[88px] font-bold text-[#1c1b1b] leading-[1.15] tracking-tight break-keep mb-14">
      WoC는 이 흐름을 연결한다
    </h2>
    <div className="flex flex-wrap items-center gap-4 justify-center mb-14">
      {['예약', '티켓', '클래스', '대관', '숙박', '멤버십', '상품'].map((t, i) => (
        <React.Fragment key={t}>
          <span className="bg-[#1c1b1b] text-white rounded-full px-7 py-3 text-[18px] font-semibold">{t}</span>
          {i < 6 && <span className="text-[#c4c7c8] text-[24px] font-bold">→</span>}
        </React.Fragment>
      ))}
    </div>
    <div className="bg-[#f0eded] rounded-2xl px-10 py-5 border border-[#d4d4d4]/30">
      <p className="font-['Space_Grotesk'] text-[18px] md:text-[24px] font-bold tracking-widest text-[#1c1b1b] uppercase">
        WoC는 activity economy infrastructure를 만든다.
      </p>
    </div>
  </div>
);

// Slide 17: 취미는 소비가 아니라 삶의 경제다 (impact)
export const Slide17 = () => (
  <div className="relative z-10 flex flex-col items-center justify-center text-center w-full h-full px-[40px]">
    <h2 className="text-[44px] md:text-[96px] font-bold text-[#1c1b1b] leading-[1.1] tracking-tight break-keep">
      취미는 소비가 아니라<br/><span className="text-[56px] md:text-[120px]">삶의 경제다</span>
    </h2>
  </div>
);
