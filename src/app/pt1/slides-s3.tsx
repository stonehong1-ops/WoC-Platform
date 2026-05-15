import React from 'react';

// Slide 13: Section Divider - SECTION 3 — COMMUNITY ECONOMY
export const Slide13 = () => (
  <div className="relative z-10 flex flex-col items-center justify-center text-center w-full h-full bg-[#1c1b1b]">
    <p className="font-['Space_Grotesk'] text-[16px] font-bold tracking-[0.3em] text-white/30 uppercase mb-8 pt1-fu">SECTION 3</p>
    <h2 className="font-['Space_Grotesk'] text-[56px] md:text-[112px] font-bold text-white tracking-wider leading-tight pt1-si pt1-d2 pt1-gp">
      COMMUNITY<br/>ECONOMY
    </h2>
    <div className="w-[80px] h-[3px] bg-white/30 mt-10 pt1-lg pt1-d5" />
  </div>
);

// Slide 14: 작은 커뮤니티 하나에도 거대한 경제가 존재한다 (EDITORIAL)
export const Slide14 = () => (
  <div className="relative z-10 flex flex-col w-full h-full bg-[#fcf8f8] text-[#111111] px-[100px] justify-center">
    <div className="max-w-[1400px] w-full">
      <div className="mb-20">
        <h2 className="text-[100px] font-[900] tracking-[-0.06em] leading-[0.9] mb-8 pt1-fu">
          The Hidden<br/>Economy.
        </h2>
        <div className="w-24 h-[2px] bg-black mt-8 pt1-lg pt1-d3" />
      </div>

      <div className="grid grid-cols-2 gap-20 items-end">
        <div>
          <h3 className="text-[48px] font-bold tracking-tight leading-[1.2] break-keep mb-12 pt1-fu pt1-d2">
            작은 커뮤니티 하나에도<br/>거대한 경제가 존재한다
          </h3>
          <div className="flex flex-wrap gap-x-8 gap-y-4">
            {['클래스', '워크샵', '공연', '여행', '장비.용품', '공간'].map((t, i) => (
              <span key={t} className="text-[18px] font-bold tracking-tight text-black/40 underline underline-offset-8 decoration-black/10 pt1-fu" style={{ animationDelay: `${500 + i * 80}ms` }}>{t}</span>
            ))}
          </div>
        </div>
        
        <div className="flex flex-col items-end text-right pt1-sr pt1-d4">
          <p className="text-[24px] font-medium text-black/60 mb-8 max-w-[500px] break-keep">
            단순한 취미 활동은 그 자체로 티켓팅, 예약, 렌탈, 멤버십이라는 거대한 비즈니스 인프라를 요구합니다.
          </p>
          <div className="flex gap-4">
            {['Booking', 'Tickets', 'Rentals', 'Membership'].map((t, i) => (
              <span key={t} className="px-5 py-2 bg-black text-white text-[14px] font-bold tracking-widest uppercase pt1-fu" style={{ animationDelay: `${700 + i * 100}ms` }}>{t}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
);

// Slide 15: 한국 탱고 인구 약 2,000명 (STRUCTURAL GRID)
export const Slide15 = () => (
  <div className="relative z-10 flex flex-col w-full h-full bg-[#fcf8f8] text-[#111111] px-[100px] justify-center">
    <div className="max-w-[1400px] w-full">
      <div className="flex justify-between items-start mb-24">
        <div>
          <span className="text-[14px] font-bold tracking-[0.3em] text-black/30 uppercase block mb-6 pt1-fu">CASE STUDY: KOREA TANGO</span>
          <h2 className="text-[80px] font-[900] tracking-[-0.05em] leading-none mb-6 pt1-cu pt1-d2">
            2,000 <span className="text-[40px] tracking-tight font-bold text-black/30">Activists.</span>
          </h2>
          <p className="text-[20px] font-medium text-black/50 tracking-tight pt1-fu pt1-d4">A small community already creates a large economy.</p>
        </div>
        <div className="text-right pt1-fi pt1-d5">
          <div className="grid grid-cols-3 gap-x-8 gap-y-2 max-w-[400px]">
            {['클래스', '밀롱가', '워크샵', '슈즈', '의상', '여행', '숙박', '식음료', '대관'].map((t) => (
              <span key={t} className="text-[14px] font-bold text-black/20 text-left">• {t}</span>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 border-t border-b border-black/10 py-16 gap-12">
        {[
          { val: '45만원', label: '1인 평균 월 소비', sub: 'Class, Social, Goods' },
          { val: '108억', label: '연간 Activity Economy', sub: 'Estimated Market Size' },
          { val: '32억', label: 'WoC Connected GMV', sub: 'Target Transaction' },
          { val: '2.2억', label: '예상 플랫폼 매출/yr', sub: 'SaaS + Fee Revenue' },
        ].map((s, i) => (
          <div key={s.label} className="flex flex-col pt1-cu" style={{ animationDelay: `${600 + i * 120}ms` }}>
            <p className="text-[48px] font-black tracking-tighter leading-none mb-4">{s.val}</p>
            <p className="text-[16px] font-bold text-black mb-2">{s.label}</p>
            <p className="text-[13px] font-medium text-black/30 tracking-tight uppercase">{s.sub}</p>
          </div>
        ))}
      </div>

      <div className="mt-16 pt1-fu pt1-d10">
        <p className="text-[28px] font-bold tracking-tight text-black/80 leading-tight break-keep">
          &quot;취미는 단순한 여가가 아닙니다. 그것은 견고하고 반복적인 삶의 경제 체계입니다.&quot;
        </p>
      </div>
    </div>
  </div>
);

// Slide 16: WoC는 이 흐름을 연결한다 (INFRASTRUCTURE LAYER)
export const Slide16 = () => (
  <div className="relative z-10 flex flex-col w-full h-full bg-[#fcf8f8] text-[#111111] px-[100px] justify-center text-center">
    <div className="max-w-[1200px] mx-auto w-full">
      <h2 className="text-[72px] md:text-[100px] font-black tracking-[-0.05em] leading-[1.1] mb-16 break-keep pt1-fu">
        Connecting the<br/><span className="text-black/20">Fragmented Flow.</span>
      </h2>
      
      <div className="relative mb-20">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-black/10 border-dashed" />
        </div>
        <div className="relative flex justify-between px-10">
          {['예약', '티켓', '클래스', '대관', '숙박', '멤버십', '상품'].map((t, i) => (
            <div key={t} className="flex flex-col items-center pt1-sd" style={{ animationDelay: `${400 + i * 100}ms` }}>
              <div className="w-4 h-4 rounded-full bg-black mb-4 pt1-dp" style={{ animationDelay: `${1200 + i * 200}ms` }} />
              <span className="text-[18px] font-bold tracking-tight">{t}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="inline-block px-12 py-6 border-2 border-black pt1-si pt1-d10">
        <p className="font-['Space_Grotesk'] text-[24px] md:text-[32px] font-black tracking-[0.1em] text-black uppercase">
          Activity Economy Infrastructure
        </p>
      </div>
    </div>
  </div>
);

// Slide 17: 취미는 소비가 아니라 삶의 경제다 (IMPACT)
export const Slide17 = () => (
  <div className="relative z-10 flex flex-col w-full h-full bg-[#111111] text-[#fcf8f8] px-[100px] justify-center overflow-hidden">
    <div className="absolute top-[-10%] right-[-10%] text-[400px] font-black text-white/[0.03] leading-none select-none pointer-events-none">
      LIFE
    </div>
    <div className="max-w-[1200px] w-full">
      <span className="text-[14px] font-bold tracking-[0.4em] text-white/30 uppercase block mb-12 pt1-fu">THE CORE PHILOSOPHY</span>
      <h2 className="text-[56px] md:text-[112px] font-black tracking-[-0.05em] leading-[1.05] break-keep pt1-fu pt1-d2 pt1-gp">
        취미는 소비가 아니라<br/>
        <span className="text-white">삶의 경제다</span>
      </h2>
    </div>
  </div>
);
