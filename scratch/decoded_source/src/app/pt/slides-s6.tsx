import React from 'react';

// Slide 31: Section Divider - SECTION 6 — POSSIBILITY & RISK
export const Slide31 = () => (
  <div className="relative z-10 flex flex-col items-center justify-center text-center w-full h-full bg-[#1c1b1b]">
    <p className="font-['Space_Grotesk'] text-[16px] font-bold tracking-[0.3em] text-white/30 uppercase mb-8 pt1-fu">SECTION 6</p>
    <h2 className="font-['Space_Grotesk'] text-[56px] md:text-[112px] font-bold text-white tracking-wider leading-tight pt1-si pt1-d2 pt1-gp">
      POSSIBILITY<br/>&amp; RISK
    </h2>
    <div className="w-[80px] h-[3px] bg-white/30 mt-10 pt1-lg pt1-d5" />
  </div>
);

// Slide 32: 작은 강한 커뮤니티의 시대 (EDITORIAL)
export const Slide32 = () => (
  <div className="relative z-10 flex flex-col w-full h-full bg-[#fcf8f8] text-[#111111] px-[100px] justify-center">
    <div className="max-w-[1400px] w-full">
      <div className="flex flex-col mb-24">
        <span className="text-[14px] font-bold tracking-[0.3em] text-black/30 uppercase block mb-8 pt1-fu">THE TREND</span>
        <h2 className="text-[80px] md:text-[112px] font-black tracking-[-0.06em] leading-[0.9] mb-12 pt1-fu pt1-d2">
          Small, Strong<br/>Communities.
        </h2>
        <p className="text-[28px] font-bold text-black/60 tracking-tight break-keep max-w-[800px] pt1-fu pt1-d4">
          사람들은 이제 거대한 SNS 피드보다,<br/>
          자신의 취향과 가치가 일치하는 &lsquo;작고 강한 커뮤니티&rsquo;를 원합니다.
        </p>
      </div>

      <div className="flex gap-8">
        {['Fandom', 'Class', 'Crew', 'Local Society'].map((t, i) => (
          <div key={t} className="flex-1 border-l border-black/10 pl-8 py-4 hover:border-black/40 transition-colors duration-300 pt1-fu" style={{ animationDelay: `${600 + i * 120}ms` }}>
            <span className="text-[14px] font-bold text-black/30 uppercase block mb-4">Archetype</span>
            <span className="text-[24px] font-bold tracking-tight">{t}</span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export const Slide33 = () => (
  <div className="relative z-10 flex flex-col w-full h-full bg-[#fcf8f8] text-[#111111] px-[100px] justify-center">
    <div className="max-w-[1400px] w-full">
      <div className="mb-24">
        <h2 className="text-[100px] font-[900] tracking-[-0.06em] leading-[0.9] pt1-fu">
          Why WoC<br/>Could Fail.
        </h2>
        <div className="w-24 h-[2px] bg-black mt-12 pt1-lg pt1-d3" />
      </div>

      <div className="grid grid-cols-4 gap-12">
        {[
          { risk: 'Workflow Complexity', desc: '운영 시스템의 복잡도가 사용자 진입 장벽을 높일 위험' },
          { risk: 'Onboarding Difficulty', desc: '단순 가입이 아닌 시스템 구축 방식의 어려운 온보딩' },
          { risk: 'Slow Network Effects', desc: '그룹 기반 성장의 특성상 개인 유입보다 느린 확장 속도' },
          { risk: 'Feature Overload', desc: '광범위한 기능 지원으로 인한 핵심 가치 희석 및 운영 부담' },
        ].map((r, idx) => (
          <div key={r.risk} className="flex flex-col pt1-fu" style={{ animationDelay: `${400 + idx * 150}ms` }}>
            <span className="text-[14px] font-bold tracking-widest text-[#E53935]/40 mb-6">CRITICAL RISK 0{idx + 1}</span>
            <h3 className="text-[28px] font-bold tracking-tight mb-4 leading-tight">{r.risk}</h3>
            <p className="text-[16px] leading-[1.6] text-black/50 break-keep">{r.desc}</p>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// Slide 34: But if Groups become operating systems... (STACK)
export const Slide34 = () => (
  <div className="relative z-10 flex flex-col w-full h-full bg-[#fcf8f8] text-[#111111] px-[100px] justify-center">
    <div className="max-w-[1400px] w-full">
      <div className="flex flex-col mb-20 text-center items-center">
        <h2 className="text-[56px] md:text-[72px] font-black tracking-tight leading-[1.1] break-keep max-w-[1100px] pt1-fu">
          그룹이 운영체제가 되는 순간
        </h2>
      </div>

      <div className="flex flex-col gap-1 w-full max-w-[1000px] mx-auto">
        <div className="bg-black text-white p-8 text-center pt1-sd pt1-d3">
          <span className="text-[14px] font-bold tracking-[0.4em] uppercase opacity-50 mb-2 block">Level 04</span>
          <span className="text-[24px] font-bold tracking-widest uppercase">Community Infrastructure Layer</span>
        </div>
        <div className="grid grid-cols-3 gap-1">
          {[
            { top: 'Booking', bottom: 'ERP-lite' },
            { top: 'Ticket', bottom: 'Fandom OS' },
            { top: 'Commerce', bottom: 'Local Network' },
          ].map((item, i) => (
            <div key={item.top} className="bg-black/5 p-6 text-center pt1-fu" style={{ animationDelay: `${500 + i * 120}ms` }}>
              <span className="text-[12px] font-bold text-black/30 mb-2 block uppercase">{item.top}</span>
              <span className="text-[16px] font-bold">{item.bottom}</span>
            </div>
          ))}
        </div>
        <div className="bg-black/10 p-6 text-center flex justify-center gap-12 pt1-fu pt1-d8">
          {['네이버카페', '밴드', '디스코드', '클래스 플랫폼'].map(t => (
            <span key={t} className="text-[14px] font-medium text-black/40">{t}</span>
          ))}
        </div>
      </div>
    </div>
  </div>
);

// Slide 35: 가능성 시나리오 (MUSEUM LABEL)
export const Slide35 = () => (
  <div className="relative z-10 flex flex-col w-full h-full bg-[#fcf8f8] text-[#111111] px-[100px] justify-center">
    <div className="max-w-[1400px] w-full">
      <div className="mb-20">
        <h2 className="text-[80px] font-black tracking-[-0.05em] pt1-fu">Scenarios.</h2>
        <div className="w-24 h-[2px] bg-black mt-8 pt1-lg pt1-d3" />
      </div>

      <div className="grid grid-cols-3 gap-16">
        {[
          { label: 'Unicorn Platform', pct: '5-10%', desc: '글로벌 커뮤니티 활동을 독점하는 차세대 OS로의 도약' },
          { label: 'Strategic M&A', pct: '15-25%', desc: '빅테크 기업의 커뮤니티 데이터 및 비즈니스 레이어 인수' },
          { label: 'Infrastructure Leader', pct: '40-60%', desc: '전문 커뮤니티를 위한 가장 강력한 B2B SaaS 인프라 기업' },
        ].map((s, idx) => (
          <div key={s.label} className="flex flex-col pt1-fu" style={{ animationDelay: `${400 + idx * 200}ms` }}>
            <span className="text-[14px] font-bold tracking-widest text-black/20 mb-8 uppercase">PROBABILITY 0{idx + 1}</span>
            <div className="flex items-baseline gap-4 mb-6">
              <h3 className="text-[32px] font-black tracking-tight leading-none pt1-cu" style={{ animationDelay: `${600 + idx * 200}ms` }}>{s.pct}</h3>
            </div>
            <p className="text-[24px] font-bold mb-6 tracking-tight leading-tight break-keep">{s.label}</p>
            <p className="text-[16px] leading-[1.6] text-black/50 break-keep">{s.desc}</p>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// Slide 36: WORLD OF COMMUNITY_ Life Goes On. (IMPACT CLOSING)
export const Slide36 = () => (
  <div className="relative z-10 flex flex-col w-full h-full bg-[#111111] text-[#fcf8f8] px-[100px] justify-center text-center overflow-hidden">
    <style>{`
      @keyframes pt1-closingZoom {
        from { transform: scale(1); opacity: 0.02; }
        to { transform: scale(1.15); opacity: 0.04; }
      }
    `}</style>
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="text-[30vw] font-black text-white/[0.02] leading-none select-none pointer-events-none whitespace-nowrap" style={{ animation: 'pt1-closingZoom 20s ease-out forwards' }}>
        W.O.C
      </div>
    </div>
    <div className="relative">
      <h2 className="text-[64px] md:text-[120px] font-black tracking-[-0.06em] leading-none mb-12 pt1-fu pt1-shimmer-text">
        WORLD OF COMMUNITY<span className="text-white/20">_</span>
      </h2>
      <div className="inline-block border-t border-b border-white/20 py-8 px-12 pt1-si pt1-d5">
        <p className="text-[24px] md:text-[40px] font-bold tracking-[0.2em] uppercase pt1-gp">
          Life Goes On.
        </p>
      </div>
    </div>
  </div>
);
