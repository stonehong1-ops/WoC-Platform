import React from 'react';

// Slide 6: Section Divider - SECTION 2 — WHY WoC
export const Slide6 = () => (
  <div className="relative z-10 flex flex-col items-center justify-center text-center w-full h-full bg-[#1c1b1b]">
    <p className="font-['Space_Grotesk'] text-[16px] font-bold tracking-[0.3em] text-white/30 uppercase mb-8">SECTION 2</p>
    <h2 className="font-['Space_Grotesk'] text-[72px] md:text-[128px] font-bold text-white tracking-wider leading-none">
      WHY WoC
    </h2>
    <div className="w-[80px] h-[3px] bg-white/30 mt-10" />
  </div>
);

// Slide 7: 돈은 여기로 흐른다 (PILL TAGS)
export const Slide7 = () => (
  <div className="relative z-10 flex flex-col items-center justify-center text-center w-full h-full px-[40px]">
    <h2 className="text-[48px] md:text-[96px] font-bold text-[#1c1b1b] leading-[1.2] tracking-tight break-keep mb-14">
      돈은 여기로 흐른다
    </h2>
    <div className="flex flex-wrap gap-4 justify-center mb-14">
      {['클래스', '공연', '커피', '팬덤', '여행'].map((t) => (
        <span key={t} className="bg-[#1c1b1b] text-white rounded-full px-8 py-3.5 font-['Space_Grotesk'] text-[18px] md:text-[22px] font-bold tracking-wider">{t}</span>
      ))}
    </div>
    <p className="text-[22px] md:text-[32px] text-[#444748] font-medium leading-relaxed break-keep">
      사람들은 스스로 선택한 활동에<br/>돈과 시간을 사용한다.
    </p>
  </div>
);

// Slide 8: 세금은 자동이다 / 통신비는 고정이다 / 대출이자는 의무다 (3 STAT BOXES)
export const Slide8 = () => (
  <div className="relative z-10 flex flex-col items-center justify-center text-center w-full h-full px-[40px]">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-[1100px]">
      {[
        { ko: '세금은 자동이다', en: 'Taxes are automatic.' },
        { ko: '통신비는 고정이다', en: 'Telecom bills are fixed.' },
        { ko: '대출이자는 의무다', en: 'Loan interests are mandatory.' },
      ].map((item) => (
        <div key={item.ko} className="bg-[#f0eded] rounded-2xl p-8 md:p-10 border border-[#d4d4d4]/30">
          <p className="text-[28px] md:text-[36px] font-bold text-[#1c1b1b] break-keep mb-4">{item.ko}</p>
          <p className="font-['Space_Grotesk'] text-[14px] md:text-[18px] font-bold tracking-widest text-[#444748]/50 uppercase">{item.en}</p>
        </div>
      ))}
    </div>
  </div>
);

// Slide 9: 하지만 열정은 선택된다 (impact)
export const Slide9 = () => (
  <div className="relative z-10 flex flex-col items-center justify-center text-center w-full h-full px-[40px]">
    <h2 className="text-[52px] md:text-[104px] font-bold text-[#1c1b1b] leading-[1.15] tracking-tight break-keep mb-10">
      하지만<br/>열정은 선택된다
    </h2>
    <div className="bg-[#1c1b1b] rounded-full px-10 py-4">
      <p className="font-['Space_Grotesk'] text-[20px] md:text-[28px] font-bold tracking-widest text-white uppercase">But passions are chosen.</p>
    </div>
  </div>
);

// Slide 10: 삶의 상당 부분을 취미와 커뮤니티에 사용한다 (3 STAT PILLS)
export const Slide10 = () => (
  <div className="relative z-10 flex flex-col items-center justify-center text-center w-full h-full px-[40px]">
    <h2 className="text-[40px] md:text-[80px] font-bold text-[#1c1b1b] leading-[1.15] tracking-tight break-keep mb-16">
      사람들은 삶의 상당 부분을<br/>취미와 커뮤니티에 사용한다
    </h2>
    <div className="flex gap-8 md:gap-14">
      {['Time', 'Emotion', 'Free Spending'].map((s) => (
        <div key={s} className="flex flex-col items-center">
          <div className="w-[120px] h-[120px] md:w-[160px] md:h-[160px] rounded-full bg-[#1c1b1b] flex items-center justify-center mb-4">
            <span className="text-white font-['Space_Grotesk'] text-[14px] md:text-[18px] font-bold tracking-widest uppercase">{s}</span>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// Slide 11: 사람은 플랫폼에 머무는 게 아니라 Group에 소속된다 (TAG LIST)
export const Slide11 = () => (
  <div className="relative z-10 flex flex-col items-center justify-center text-center w-full h-full px-[40px]">
    <h2 className="text-[40px] md:text-[76px] font-bold text-[#1c1b1b] leading-[1.15] tracking-tight break-keep mb-6">
      사람은 플랫폼에 머무는 게 아니라<br/>Group에 소속된다
    </h2>
    <p className="font-['Space_Grotesk'] text-[18px] md:text-[26px] font-bold tracking-widest text-[#444748]/50 uppercase mb-12">People belong to communities.</p>
    <div className="flex flex-wrap gap-4 justify-center mb-12">
      {['Tango Group', 'Yoga Circle', 'Running Crew', 'BTS Fandom', 'Daechi Academy'].map((g) => (
        <span key={g} className="border-2 border-[#1c1b1b] text-[#1c1b1b] rounded-full px-7 py-3 font-['Space_Grotesk'] text-[16px] md:text-[20px] font-bold tracking-wider">{g}</span>
      ))}
    </div>
    <div className="bg-[#f0eded] rounded-2xl px-10 py-5 border border-[#d4d4d4]/30">
      <p className="text-[20px] md:text-[28px] text-[#1c1b1b] font-semibold break-keep">WoC는 사람보다 Group을 중심으로 설계된다.</p>
    </div>
  </div>
);

// Slide 12: 기존 플랫폼 vs WoC (SPLIT COMPARISON)
export const Slide12 = () => (
  <div className="relative z-10 flex flex-col items-center justify-center text-center w-full h-full px-[40px]">
    <h2 className="text-[36px] md:text-[72px] font-bold text-[#1c1b1b] leading-[1.15] tracking-tight break-keep mb-14">
      기존 플랫폼은 콘텐츠를 연결한다<br/>WoC는 인간 커뮤니티를 연결한다
    </h2>
    <div className="grid grid-cols-2 gap-8 w-full max-w-[1000px]">
      <div className="bg-[#e8e5e5] rounded-2xl p-8 md:p-12 border border-[#d4d4d4]/30 opacity-50">
        <p className="font-['Space_Grotesk'] text-[16px] font-bold tracking-widest text-[#444748]/50 uppercase mb-6">EXISTING</p>
        <p className="text-[32px] md:text-[44px] font-bold text-[#444748] break-keep">Content Feed</p>
      </div>
      <div className="bg-[#1c1b1b] rounded-2xl p-8 md:p-12">
        <p className="font-['Space_Grotesk'] text-[16px] font-bold tracking-widest text-white/40 uppercase mb-6">WoC</p>
        <p className="text-[32px] md:text-[44px] font-bold text-white break-keep">Community<br/>Activity<br/>Group</p>
      </div>
    </div>
  </div>
);
