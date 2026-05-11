import React from 'react';

// Slide 31: Section Divider - SECTION 6 — POSSIBILITY & RISK
export const Slide31 = () => (
  <div className="relative z-10 flex flex-col items-center justify-center text-center w-full h-full bg-[#1c1b1b]">
    <p className="font-['Space_Grotesk'] text-[16px] font-bold tracking-[0.3em] text-white/30 uppercase mb-8">SECTION 6</p>
    <h2 className="font-['Space_Grotesk'] text-[56px] md:text-[112px] font-bold text-white tracking-wider leading-tight">
      POSSIBILITY<br/>&amp; RISK
    </h2>
    <div className="w-[80px] h-[3px] bg-white/30 mt-10" />
  </div>
);

// Slide 32: 작은 강한 커뮤니티의 시대 (TAG CARDS)
export const Slide32 = () => (
  <div className="relative z-10 flex flex-col items-center justify-center text-center w-full h-full px-[40px]">
    <h2 className="text-[40px] md:text-[84px] font-bold text-[#1c1b1b] leading-[1.15] tracking-tight break-keep mb-5">
      작은 강한 커뮤니티의 시대
    </h2>
    <p className="font-['Space_Grotesk'] text-[18px] md:text-[24px] font-bold tracking-widest text-[#444748]/50 uppercase mb-12">The era of small, strong communities.</p>
    <div className="flex flex-wrap gap-4 justify-center mb-12">
      {['Fandom', 'Class', 'Crew', 'Local Society'].map((t) => (
        <span key={t} className="bg-[#1c1b1b] text-white rounded-full px-8 py-4 font-['Space_Grotesk'] text-[18px] md:text-[22px] font-bold tracking-wider">{t}</span>
      ))}
    </div>
    <p className="text-[20px] md:text-[28px] text-[#444748] font-medium break-keep">
      사람들은 giant SNS보다 더 깊은 community를 찾기 시작했다.
    </p>
  </div>
);

// Slide 33: Why WoC Could Fail (4 RISK CARDS)
export const Slide33 = () => (
  <div className="relative z-10 flex flex-col items-center justify-center text-center w-full h-full px-[40px]">
    <h2 className="text-[44px] md:text-[88px] font-bold text-[#1c1b1b] leading-[1.15] tracking-tight break-keep mb-14">
      Why WoC Could Fail
    </h2>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-5 w-full max-w-[1100px] mb-12">
      {[
        { risk: 'Workflow Complexity', icon: '⚙️' },
        { risk: 'Onboarding Difficulty', icon: '🚪' },
        { risk: 'Slow Network Effects', icon: '🐢' },
        { risk: 'Product Sprawl', icon: '🌀' },
      ].map((r) => (
        <div key={r.risk} className="bg-[#f0eded] rounded-2xl p-7 md:p-9 border border-[#d4d4d4]/30">
          <span className="text-[40px] mb-4 block">{r.icon}</span>
          <p className="font-['Space_Grotesk'] text-[14px] md:text-[18px] font-bold tracking-wider text-[#1c1b1b] uppercase">{r.risk}</p>
        </div>
      ))}
    </div>
    <div className="bg-[#f0eded] rounded-2xl px-10 py-5 border border-[#d4d4d4]/30">
      <p className="text-[18px] md:text-[24px] text-[#1c1b1b] font-semibold break-keep">
        WoC는 앱 가입보다 운영 시스템 구축에 가깝다.
      </p>
    </div>
  </div>
);

// Slide 34: But if Groups become operating systems... (COMPARISON)
export const Slide34 = () => (
  <div className="relative z-10 flex flex-col items-center justify-center text-center w-full h-full px-[40px]">
    <h2 className="text-[32px] md:text-[64px] font-bold text-[#1c1b1b] leading-[1.15] tracking-tight break-keep mb-12">
      But if Groups become operating systems,<br/>the upside becomes enormous.
    </h2>
    <div className="flex flex-wrap gap-3 justify-center mb-10 max-w-[1000px]">
      {['네이버카페', '밴드', '디스코드', '클래스 플랫폼', '예약툴', 'ERP-lite', '팬덤 운영'].map((t) => (
        <span key={t} className="border border-[#c4c7c8]/60 text-[#444748] rounded-full px-6 py-2.5 text-[15px] md:text-[18px] font-medium">{t}</span>
      ))}
    </div>
    <span className="text-[#c4c7c8] text-[32px] mb-8">↓</span>
    <div className="bg-[#1c1b1b] rounded-2xl px-12 py-6">
      <p className="font-['Space_Grotesk'] text-[18px] md:text-[26px] font-bold tracking-widest text-white uppercase">
        Community Infrastructure Layer
      </p>
    </div>
  </div>
);

// Slide 35: 가능성 시나리오 (3 PROBABILITY CARDS)
export const Slide35 = () => (
  <div className="relative z-10 flex flex-col items-center justify-center text-center w-full h-full px-[40px]">
    <h2 className="text-[44px] md:text-[88px] font-bold text-[#1c1b1b] leading-[1.15] tracking-tight break-keep mb-14">
      가능성 시나리오
    </h2>
    <div className="flex flex-col gap-5 w-full max-w-[900px]">
      {[
        { label: '유니콘급 플랫폼', pct: '5~10%', w: 'w-[10%]' },
        { label: '전략적 인수', pct: '15~25%', w: 'w-[25%]' },
        { label: '전문 커뮤니티 인프라 기업', pct: '40~60%', w: 'w-[60%]' },
      ].map((s) => (
        <div key={s.label} className="bg-[#f0eded] rounded-2xl p-7 md:p-8 border border-[#d4d4d4]/30 text-left">
          <div className="flex justify-between items-center mb-4">
            <p className="text-[20px] md:text-[24px] font-bold text-[#1c1b1b] break-keep">{s.label}</p>
            <p className="font-['Space_Grotesk'] text-[28px] md:text-[36px] font-bold text-[#1c1b1b] tracking-wider">{s.pct}</p>
          </div>
          <div className="w-full h-[8px] bg-[#d4d4d4]/40 rounded-full overflow-hidden">
            <div className={`h-full bg-[#1c1b1b] rounded-full ${s.w}`} />
          </div>
        </div>
      ))}
    </div>
  </div>
);

// Slide 36: WORLD OF COMMUNITY_ Life Goes On. (closing impact)
export const Slide36 = () => (
  <div className="relative z-10 flex flex-col items-center justify-center text-center w-full h-full px-[40px]">
    <h2 className="text-[48px] md:text-[104px] font-bold text-[#1c1b1b] leading-[1.1] tracking-tight break-keep mb-6">
      WORLD OF COMMUNITY<span className="text-[#c4c7c8]">_</span>
    </h2>
    <p className="text-[32px] md:text-[64px] font-bold text-[#444748]/60 tracking-tight">
      Life Goes On.
    </p>
  </div>
);
