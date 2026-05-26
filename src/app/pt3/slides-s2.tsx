import React from 'react';

// Slide 6: Section Divider - SECTION 2 — WHY WoC
export const Slide6 = () => (
  <div className="relative z-10 flex flex-col items-center justify-center text-center w-full h-full bg-[#1c1b1b]">
    <p className="font-['Space_Grotesk'] text-[16px] font-bold tracking-[0.3em] text-white/30 uppercase mb-8 pt1-fu">SECTION 2</p>
    <h2 className="font-['Space_Grotesk'] text-[72px] md:text-[128px] font-bold text-white tracking-wider leading-none pt1-si pt1-d2 pt1-gp">
      WHY WoC
    </h2>
    <div className="w-[80px] h-[3px] bg-white/30 mt-10 pt1-lg pt1-d5" />
  </div>
);

// Slide 7: 돈은 여기로 흐른다 (Money Flows Here - Web Rendered)
export const Slide7 = () => (
  <div className="relative z-10 flex flex-col w-full h-full bg-[#f3eeee] text-[#111111] px-[80px] py-[50px] overflow-hidden">
    {/* Main: 2:1 Grid */}
    <div className="grid grid-cols-3 flex-1 gap-8 items-center">
      {/* LEFT 2/3: Title Area (Main Focus) */}
      <div className="col-span-2 flex flex-col justify-center">
        <h2 className="text-[110px] font-black tracking-[-0.04em] leading-[0.92] pt1-fu">
          Money<br/>Flows Here.
        </h2>
        <div className="w-10 h-[3px] bg-black mt-10 mb-6 pt1-lg pt1-d3" />
        <p className="text-[28px] text-black/50 leading-[1.6] break-keep pt1-fu pt1-d4">
          사람들의 돈은<br/><b className="text-black">여기로</b> 흐른다.
        </p>
        {/* Category Pills - moved here under subtitle */}
        <div className="flex gap-2.5 mt-10">
          {['Class', 'Performance', 'Gear', 'Fandom', 'Travel'].map((label, i) => (
            <div key={label} className="flex items-center gap-2 px-5 py-2 border border-black/15 rounded-full bg-white/50 pt1-fu" style={{ animationDelay: `${500 + i * 80}ms` }}>
              <span className="text-[13px] font-medium tracking-tight">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT 1/3: Chart + Legend */}
      <div className="col-span-1 flex flex-col items-center gap-8">
        {/* Donut Chart */}
        <div className="relative w-[260px] h-[260px] pt1-dr pt1-d4">
          <div className="w-full h-full rounded-full" style={{ background: 'conic-gradient(from -90deg, #4285F4 0deg 83.88deg, #F09090 83.88deg 119.88deg, #E53935 119.88deg 360deg)' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140px] h-[140px] rounded-full bg-[#f3eeee] flex flex-col items-center justify-center">
            <span className="text-[20px] font-bold tracking-tight leading-none">3,000,000</span>
            <span className="text-[10px] text-black/40 mt-1 tracking-wide">KRW / month</span>
          </div>
          {/* 23.3% */}
          <div className="absolute top-[10%] right-[2%] text-center pt1-fi pt1-d8">
            <p className="text-[14px] font-bold leading-none">23.3%</p>
            <p className="text-[9px] text-black/50 mt-0.5">700,000 KRW</p>
          </div>
          {/* 10.0% */}
          <div className="absolute bottom-[14%] right-[-4%] text-center pt1-fi pt1-d9">
            <p className="text-[14px] font-bold leading-none">10.0%</p>
            <p className="text-[9px] text-black/50 mt-0.5">300,000 KRW</p>
          </div>
          {/* 66.7% */}
          <div className="absolute top-[38%] left-[-12%] text-center pt1-fi pt1-d10">
            <p className="text-[14px] font-bold leading-none">66.7%</p>
            <p className="text-[9px] text-white/70 mt-0.5">2,000,000 KRW</p>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-col gap-5 w-full max-w-[220px]">
          {[
            { color: 'bg-[#4285F4]', title: 'Life Money', amount: '700,000 KRW (23.3%)', desc: '취미, 관심사, 커뮤니티' },
            { color: 'bg-[#F09090]', title: 'Optional Spend', amount: '300,000 KRW (10.0%)', desc: '저축, 투자, 여가 예비' },
            { color: 'bg-[#E53935]', title: 'Dead Spend', amount: '2,000,000 KRW (66.7%)', desc: '통신비, 주거비, 식비, 교통비, 보험료, 구독료 등' },
          ].map((item, i) => (
            <div key={item.title} className="flex gap-2.5 pt1-sr" style={{ animationDelay: `${700 + i * 150}ms` }}>
              <div className={`w-2.5 h-2.5 rounded-full ${item.color} mt-1 shrink-0`} />
              <div>
                <p className="text-[13px] font-bold leading-tight">{item.title}</p>
                <p className="text-[11px] text-black/45 mt-0.5">{item.amount}</p>
                <p className="text-[10px] text-black/30 mt-0.5">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>

    {/* Bottom: Quote (pulled up, no overflow) */}
    <div className="flex items-center justify-end gap-6 pt-4 pb-2 pt1-fu pt1-d8">
      <div className="relative pl-5 pr-3">
        <span className="absolute top-[-6px] left-0 text-[28px] text-black/15 font-serif leading-none">&ldquo;</span>
        <p className="text-[13px] leading-[1.7] break-keep text-black/60">
          취미가 &apos;라이프스타일 그 자체&apos;인 중산층 상층 매니아들에게는{' '}
          <span className="font-bold text-[#E53935]">20~30%가 매우 표준적</span>이고 합리적인 지출 범위라고 볼 수 있습니다.
        </p>
        <span className="absolute bottom-[-6px] right-0 text-[28px] text-black/15 font-serif leading-none">&rdquo;</span>
      </div>
      <div className="text-right shrink-0 border-l border-black/10 pl-4">
        <p className="text-[11px] font-bold text-black/45">통계청</p>
        <p className="text-[10px] text-black/30 mt-0.5 leading-[1.4]">최근 소비 트렌드 조사 (2025~2026)</p>
        <p className="text-[10px] text-black/30 mt-0.5 leading-[1.4]">전문 취미 가구의 소비 구조 (Self-Actualization Spending)</p>
      </div>
    </div>
  </div>
);

// Slide 8: 세금은 자동이다 / 통신비는 고정이다 / 대출이자는 의무다 (EDITORIAL PANELS)
export const Slide8 = () => (
  <div className="relative z-10 flex flex-col w-full h-full bg-[#fcf8f8] text-[#111111] px-[100px] justify-center">
    <div className="max-w-[1400px] w-full">
      <div className="mb-20">
        <h2 className="text-[100px] font-[900] tracking-[-0.06em] leading-[0.9] mb-8 pt1-fu">
          Mandatory<br/>Economy.
        </h2>
        <div className="w-24 h-[2px] bg-black mt-8 pt1-lg pt1-d3" />
      </div>

      <div className="grid grid-cols-3 gap-12">
        {[
          { ko: '세금은 자동이다', en: 'Taxes are automatic.' },
          { ko: '통신비는 고정이다', en: 'Telecom bills are fixed.' },
          { ko: '대출이자는 의무다', en: 'Loan interests are mandatory.' },
        ].map((item, idx) => (
          <div key={item.ko} className="flex flex-col border-l border-black/10 pl-8 py-4 pt1-fu" style={{ animationDelay: `${400 + idx * 150}ms` }}>
            <span className="text-[14px] font-bold tracking-[0.2em] text-black/20 uppercase mb-6">MANDATORY 0{idx + 1}</span>
            <p className="text-[32px] font-bold tracking-tight mb-4 leading-tight break-keep">{item.ko}</p>
            <p className="text-[16px] font-medium text-black/40 tracking-tight">{item.en}</p>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// Slide 9: 하지만 열정은 선택된다 (EDITORIAL IMPACT)
export const Slide9 = () => (
  <div className="relative z-10 flex flex-col w-full h-full bg-[#111111] text-[#fcf8f8] px-[100px] justify-center overflow-hidden">
    <div className="absolute top-[-10%] left-[-10%] text-[400px] font-black text-white/[0.03] leading-none select-none pointer-events-none">
      CHOICE
    </div>
    <div className="max-w-[1200px] w-full relative">
      <span className="text-[14px] font-bold tracking-[0.4em] text-white/30 uppercase block mb-12 pt1-fu">THE HUMAN WILL</span>
      <h2 className="text-[56px] md:text-[112px] font-black tracking-[-0.05em] leading-[1.05] break-keep mb-12 pt1-fu pt1-d2">
        하지만<br/>
        <span className="text-white relative inline-block">
          열정은 선택된다
          <span className="absolute bottom-[-8px] left-0 w-full h-[2px] bg-white/30 pt1-du pt1-d8" />
        </span>
      </h2>
      <p className="font-['Space_Grotesk'] text-[24px] font-bold tracking-widest text-white/40 uppercase pt1-fu pt1-d5">But passions are chosen.</p>
    </div>
  </div>
);

// Slide 10: 삶의 상당 부분을 취미와 커뮤니티에 사용한다 (STRUCTURAL METRICS)
export const Slide10 = () => (
  <div className="relative z-10 flex flex-col w-full h-full bg-[#fcf8f8] text-[#111111] px-[100px] justify-center">
    <div className="max-w-[1400px] w-full">
      <div className="flex justify-between items-end mb-24">
        <h2 className="text-[80px] font-[900] tracking-[-0.05em] leading-[1.1] break-keep pt1-fu">
          The Gravity of<br/>Community.
        </h2>
        <p className="text-[24px] font-medium text-black/40 mb-2 max-w-[500px] text-right break-keep pt1-fu pt1-d3">
          사람들은 삶의 상당 부분을<br/>취미와 커뮤니티에 사용합니다.
        </p>
      </div>

      <div className="grid grid-cols-3 border-t border-b border-black/10 py-16 gap-12">
        {[
          { label: 'Time', sub: 'Weekly Engagement', desc: '평균 15시간 이상의 활동적 참여' },
          { label: 'Emotion', sub: 'Social Connection', desc: '심리적 소속감과 정서적 교류' },
          { label: 'Spending', sub: 'Free Spending', desc: '자발적이고 반복적인 자금 투입' },
        ].map((s, i) => (
          <div key={s.label} className="flex flex-col pt1-cu" style={{ animationDelay: `${500 + i * 150}ms` }}>
            <p className="text-[48px] font-black tracking-tighter leading-none mb-4 uppercase">{s.label}</p>
            <p className="text-[16px] font-bold text-black mb-2">{s.sub}</p>
            <p className="text-[13px] font-medium text-black/30 tracking-tight break-keep">{s.desc}</p>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// Slide 11: 사람은 플랫폼에 머무는 게 아니라 Group에 소속된다 (STRUCTURAL DIAGRAM)
export const Slide11 = () => (
  <div className="relative z-10 flex flex-col w-full h-full bg-[#fcf8f8] text-[#111111] px-[100px] justify-center">
    <div className="max-w-[1400px] w-full mx-auto text-center">
      <h2 className="text-[64px] md:text-[88px] font-black tracking-[-0.05em] leading-[1.1] mb-16 break-keep pt1-fu">
        People Belong to<br/><span className="text-black/30">Communities, Not Platforms.</span>
      </h2>
      
      <div className="flex justify-center gap-6 mb-20">
        {['Tango Group', 'Yoga Circle', 'Running Crew', 'BTS Fandom', 'Daechi Academy'].map((g, i) => (
          <div key={g} className="px-8 py-4 border border-black/20 hover:bg-black hover:text-white transition-colors duration-300 pt1-fu" style={{ animationDelay: `${400 + i * 100}ms` }}>
            <span className="font-['Space_Grotesk'] text-[18px] font-bold tracking-tight">{g}</span>
          </div>
        ))}
      </div>

      <div className="max-w-[800px] mx-auto pt-12 border-t border-black/10 pt1-fu pt1-d8">
        <p className="text-[28px] font-bold tracking-tight text-black leading-tight break-keep">
          &quot;WoC는 사람(User)이 아닌 그룹(Group)을 중심으로 설계됩니다.&quot;
        </p>
      </div>
    </div>
  </div>
);

// Slide 12: Paradigm Shift - Content vs Human Activity
export const Slide12 = () => (
  <div className="relative z-10 flex flex-col items-center justify-center w-full h-full px-[60px] md:px-[120px] bg-[#fcf8f8]">
    {/* Main Headline */}
    <div className="mb-10 text-center pt1-fu">
      <h2 className="text-[28px] md:text-[44px] font-bold text-[#111111] leading-[1.2] tracking-tight break-keep">
        기존 플랫폼은 정보를 저장하고 소비한다<br/>
        <span className="text-black/10 text-[20px] md:text-[32px] font-medium mt-2 block">↓</span>
        <span className="mt-2 block">WoC는 사람들이 실제로 움직이게 만든다</span>
      </h2>
    </div>

    {/* Typographic Contrast Grid */}
    <div className="grid grid-cols-2 gap-12 w-full max-w-[1200px] items-start">
      {/* LEFT: Existing Platforms (Quiet/Static) */}
      <div className="flex flex-col items-end text-right border-r border-black/5 pr-16 py-4 pt1-sl pt1-d2">
        <p className="font-['Space_Grotesk'] text-[14px] font-bold tracking-[0.3em] text-black/20 uppercase mb-6">EXISTING PLATFORMS</p>
        <div className="flex flex-col gap-3 text-black/30 font-medium text-[18px] md:text-[24px] tracking-tight">
          <span>Posts</span>
          <span>Feeds</span>
          <span>Content</span>
          <span>Comments</span>
          <span>Followers</span>
          <span className="opacity-20 italic">Algorithms</span>
        </div>
      </div>

      {/* RIGHT: WoC (Expansive/Strong) */}
      <div className="flex flex-col items-start text-left pl-16 py-4 pt1-sr pt1-d3">
        <p className="font-['Space_Grotesk'] text-[14px] font-bold tracking-[0.3em] text-black/20 uppercase mb-6">WORLD OF COMMUNITY</p>
        <div className="flex flex-col gap-3 text-[#111111] font-black text-[30px] md:text-[42px] leading-none tracking-tighter">
          {['People', 'Groups', 'Places', 'Activities', 'Events', 'Communities'].map((item, i) => (
            <span key={item} className="hover:translate-x-2 transition-transform duration-300 pt1-sr" style={{ animationDelay: `${400 + i * 80}ms` }}>{item}</span>
          ))}
        </div>
      </div>
    </div>

    {/* Philosophical Footer Badge */}
    <div className="mt-12 pt1-si pt1-d10">
      <div className="inline-block border-2 border-[#111111] px-8 py-3">
        <p className="font-['Space_Grotesk'] text-[16px] md:text-[18px] font-bold tracking-widest text-[#111111] uppercase">
          Organizing Human Activity
        </p>
      </div>
    </div>
  </div>
);
