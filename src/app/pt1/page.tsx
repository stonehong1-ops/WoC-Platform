"use client";

import React, { useState, useEffect } from 'react';
import PresentationHeader from '@/components/presentation/PresentationHeader';
import PresentationFooter from '@/components/presentation/PresentationFooter';
import { useNavigation } from '@/components/providers/NavigationProvider';


// Slide 0: Section: SECTION 1 — INTRO
const Slide0 = () => (
  <div className="relative z-10 flex flex-col items-center justify-center text-center w-full h-full bg-[#1c1b1b]">
    <h2 className="font-['Space_Grotesk'] text-[48px] md:text-[80px] font-bold text-white tracking-widest px-10 leading-tight break-keep">
      SECTION 1 — INTRO
    </h2>
  </div>
);

// Slide 1: WoC
const Slide1 = () => (
  <div className="relative z-10 flex flex-col items-center justify-center text-center w-full max-w-[1400px] px-[80px] h-full">
    <h2 className="text-[80px] md:text-[140px] font-bold text-[#1c1b1b] leading-[1.1] tracking-tight break-keep">
      WoC
    </h2>
  </div>
);

// Slide 2: WORLD OF COMMUNITY
const Slide2 = () => (
  <div className="relative z-10 flex flex-col items-center justify-center text-center w-full max-w-[1400px] px-[80px] h-full">
    <h2 className="text-[80px] md:text-[140px] font-bold text-[#1c1b1b] leading-[1.1] tracking-tight break-keep">
      WORLD OF COMMUNITY
    </h2>
  </div>
);

// Slide 3: The Operating System For Human Communities.
const Slide3 = () => (
  <div className="relative z-10 flex flex-col items-center justify-center text-center w-full max-w-[1400px] px-[80px] h-full">
    <h2 className="text-[80px] md:text-[140px] font-bold text-[#1c1b1b] leading-[1.1] tracking-tight break-keep">
      The Operating System For Human Communities.
    </h2>
  </div>
);

// Slide 4: Life Goes On_
const Slide4 = () => (
  <div className="relative z-10 flex flex-col items-center justify-center text-center w-full max-w-[1400px] px-[80px] h-full">
    <h2 className="text-[80px] md:text-[140px] font-bold text-[#1c1b1b] leading-[1.1] tracking-tight break-keep">
      Life Goes On_
    </h2>
  </div>
);

// Slide 5: Life on STAGE / ROAD / TABLE / MUSE / MIND / DESK
const Slide5 = () => (
  <div className="relative z-10 flex flex-col items-center justify-center text-center w-full max-w-[1400px] px-[80px] h-full">
    <h2 className="text-[48px] md:text-[72px] font-bold text-[#1c1b1b] leading-[1.2] tracking-tight break-keep mb-16">
      Life on STAGE / ROAD / TABLE / MUSE / MIND / DESK
    </h2>
    <div className="flex flex-col gap-4 items-center justify-center w-full max-w-[1000px]">
      <p className="font-['Space_Grotesk'] text-[24px] md:text-[32px] text-[#444748] font-bold tracking-widest leading-relaxed uppercase break-keep">STAGE: Tango, Salsa, Ballet, Flamenco</p>
      <p className="font-['Space_Grotesk'] text-[24px] md:text-[32px] text-[#444748] font-bold tracking-widest leading-relaxed uppercase break-keep">ROAD: Bike, Running, Trekking</p>
      <p className="font-['Space_Grotesk'] text-[24px] md:text-[32px] text-[#444748] font-bold tracking-widest leading-relaxed uppercase break-keep">TABLE: Cooking, Coffee, Pottery</p>
      <p className="font-['Space_Grotesk'] text-[24px] md:text-[32px] text-[#444748] font-bold tracking-widest leading-relaxed uppercase break-keep">MUSE: BTS, Cinema, Anime</p>
      <p className="font-['Space_Grotesk'] text-[24px] md:text-[32px] text-[#444748] font-bold tracking-widest leading-relaxed uppercase break-keep">MIND: Writing, Journaling, Interior</p>
      <p className="font-['Space_Grotesk'] text-[24px] md:text-[32px] text-[#444748] font-bold tracking-widest leading-relaxed uppercase break-keep">DESK: Daechi Academy, English School, Study Group</p>
    </div>
  </div>
);

// Slide 6: Section: SECTION 2 — WHY WoC
const Slide6 = () => (
  <div className="relative z-10 flex flex-col items-center justify-center text-center w-full h-full bg-[#1c1b1b]">
    <h2 className="font-['Space_Grotesk'] text-[48px] md:text-[80px] font-bold text-white tracking-widest px-10 leading-tight break-keep">
      SECTION 2 — WHY WoC
    </h2>
  </div>
);

// Slide 7: 돈은 여기로 흐른다
const Slide7 = () => (
  <div className="relative z-10 flex flex-col items-center justify-center text-center w-full max-w-[1400px] px-[80px] h-full">
    <h2 className="text-[48px] md:text-[72px] font-bold text-[#1c1b1b] leading-[1.2] tracking-tight break-keep mb-16">
      돈은 여기로 흐른다
    </h2>
    <div className="flex flex-col gap-4 items-center justify-center w-full max-w-[1000px]">
      <p className="text-[20px] md:text-[28px] text-[#444748] font-medium leading-relaxed break-keep">클래스 / 공연 / 커피 / 팬덤 / 여행</p>
      <div className="h-4"></div>
      <p className="text-[20px] md:text-[28px] text-[#444748] font-medium leading-relaxed break-keep">사람들은 스스로 선택한 활동에</p>
      <p className="text-[20px] md:text-[28px] text-[#444748] font-medium leading-relaxed break-keep">돈과 시간을 사용한다.</p>
    </div>
  </div>
);

// Slide 8: 세금은 자동이다 통신비는 고정이다 대출이자는 의무다
const Slide8 = () => (
  <div className="relative z-10 flex flex-col items-center justify-center text-center w-full max-w-[1400px] px-[80px] h-full">
    <h2 className="text-[48px] md:text-[72px] font-bold text-[#1c1b1b] leading-[1.2] tracking-tight break-keep mb-16">
      세금은 자동이다<br/>통신비는 고정이다<br/>대출이자는 의무다
    </h2>
    <div className="flex flex-col gap-4 items-center justify-center w-full max-w-[1000px]">
      <p className="font-['Space_Grotesk'] text-[24px] md:text-[32px] text-[#444748] font-bold tracking-widest leading-relaxed uppercase break-keep">Taxes are automatic.</p>
      <p className="font-['Space_Grotesk'] text-[24px] md:text-[32px] text-[#444748] font-bold tracking-widest leading-relaxed uppercase break-keep">Telecom bills are fixed.</p>
      <p className="font-['Space_Grotesk'] text-[24px] md:text-[32px] text-[#444748] font-bold tracking-widest leading-relaxed uppercase break-keep">Loan interests are mandatory.</p>
    </div>
  </div>
);

// Slide 9: 하지만 열정은 선택된다
const Slide9 = () => (
  <div className="relative z-10 flex flex-col items-center justify-center text-center w-full max-w-[1400px] px-[80px] h-full">
    <h2 className="text-[48px] md:text-[72px] font-bold text-[#1c1b1b] leading-[1.2] tracking-tight break-keep mb-16">
      하지만 열정은 선택된다
    </h2>
    <div className="flex flex-col gap-4 items-center justify-center w-full max-w-[1000px]">
      <p className="font-['Space_Grotesk'] text-[24px] md:text-[32px] text-[#444748] font-bold tracking-widest leading-relaxed uppercase break-keep">But passions are chosen.</p>
    </div>
  </div>
);

// Slide 10: 사람들은 삶의 상당 부분을 취미와 커뮤니티에 사용한다
const Slide10 = () => (
  <div className="relative z-10 flex flex-col items-center justify-center text-center w-full max-w-[1400px] px-[80px] h-full">
    <h2 className="text-[48px] md:text-[72px] font-bold text-[#1c1b1b] leading-[1.2] tracking-tight break-keep mb-16">
      사람들은 삶의 상당 부분을<br/>취미와 커뮤니티에 사용한다
    </h2>
    <div className="flex flex-col gap-4 items-center justify-center w-full max-w-[1000px]">
      <p className="font-['Space_Grotesk'] text-[24px] md:text-[32px] text-[#444748] font-bold tracking-widest leading-relaxed uppercase break-keep">Time · Emotion · Free Spending</p>
    </div>
  </div>
);

// Slide 11: 사람은 플랫폼에 머무는 게 아니라 Group에 소속된다
const Slide11 = () => (
  <div className="relative z-10 flex flex-col items-center justify-center text-center w-full max-w-[1400px] px-[80px] h-full">
    <h2 className="text-[48px] md:text-[72px] font-bold text-[#1c1b1b] leading-[1.2] tracking-tight break-keep mb-16">
      사람은 플랫폼에 머무는 게 아니라<br/>Group에 소속된다
    </h2>
    <div className="flex flex-col gap-4 items-center justify-center w-full max-w-[1000px]">
      <p className="font-['Space_Grotesk'] text-[24px] md:text-[32px] text-[#444748] font-bold tracking-widest leading-relaxed uppercase break-keep">People belong to communities.</p>
      <div className="h-4"></div>
      <p className="font-['Space_Grotesk'] text-[24px] md:text-[32px] text-[#444748] font-bold tracking-widest leading-relaxed uppercase break-keep">Tango Group / Yoga Circle / Running Crew / BTS Fandom / Daechi Academy</p>
      <div className="h-4"></div>
      <p className="font-['Space_Grotesk'] text-[24px] md:text-[32px] text-[#444748] font-bold tracking-widest leading-relaxed uppercase break-keep">WoC는 사람보다 Group을 중심으로 설계된다.</p>
    </div>
  </div>
);

// Slide 12: 기존 플랫폼은 콘텐츠를 연결한다 WoC는 인간 커뮤니티를 연결한다
const Slide12 = () => (
  <div className="relative z-10 flex flex-col items-center justify-center text-center w-full max-w-[1400px] px-[80px] h-full">
    <h2 className="text-[48px] md:text-[72px] font-bold text-[#1c1b1b] leading-[1.2] tracking-tight break-keep mb-16">
      기존 플랫폼은 콘텐츠를 연결한다<br/>WoC는 인간 커뮤니티를 연결한다
    </h2>
    <div className="flex flex-col gap-4 items-center justify-center w-full max-w-[1000px]">
      <p className="font-['Space_Grotesk'] text-[24px] md:text-[32px] text-[#444748] font-bold tracking-widest leading-relaxed uppercase break-keep">Content Feed vs Community / Activity / Group</p>
    </div>
  </div>
);

// Slide 13: Section: SECTION 3 — COMMUNITY ECONOMY
const Slide13 = () => (
  <div className="relative z-10 flex flex-col items-center justify-center text-center w-full h-full bg-[#1c1b1b]">
    <h2 className="font-['Space_Grotesk'] text-[48px] md:text-[80px] font-bold text-white tracking-widest px-10 leading-tight break-keep">
      SECTION 3 — COMMUNITY ECONOMY
    </h2>
  </div>
);

// Slide 14: 작은 커뮤니티 하나에도 거대한 경제가 존재한다
const Slide14 = () => (
  <div className="relative z-10 flex flex-col items-center justify-center text-center w-full max-w-[1400px] px-[80px] h-full">
    <h2 className="text-[48px] md:text-[72px] font-bold text-[#1c1b1b] leading-[1.2] tracking-tight break-keep mb-16">
      작은 커뮤니티 하나에도<br/>거대한 경제가 존재한다
    </h2>
    <div className="flex flex-col gap-4 items-center justify-center w-full max-w-[1000px]">
      <p className="font-['Space_Grotesk'] text-[24px] md:text-[32px] text-[#444748] font-bold tracking-widest leading-relaxed uppercase break-keep">Activity creates economy.</p>
      <div className="h-4"></div>
      <p className="text-[20px] md:text-[28px] text-[#444748] font-medium leading-relaxed break-keep">클래스 / 워크샵 / 공연 / 여행 / 커피 / 공간</p>
      <p className="font-['Space_Grotesk'] text-[24px] md:text-[32px] text-[#444748] font-bold tracking-widest leading-relaxed uppercase break-keep">Booking / Tickets / Rentals / Membership</p>
      <div className="h-4"></div>
      <p className="font-['Space_Grotesk'] text-[24px] md:text-[32px] text-[#444748] font-bold tracking-widest leading-relaxed uppercase break-keep">WoC는 인간 활동 경제의 흐름을 연결한다.</p>
    </div>
  </div>
);

// Slide 15: 한국 탱고 인구 약 2,000명
const Slide15 = () => (
  <div className="relative z-10 flex flex-col items-center justify-center text-center w-full max-w-[1400px] px-[80px] h-full">
    <h2 className="text-[48px] md:text-[72px] font-bold text-[#1c1b1b] leading-[1.2] tracking-tight break-keep mb-16">
      한국 탱고 인구 약 2,000명
    </h2>
    <div className="flex flex-col gap-4 items-center justify-center w-full max-w-[1000px]">
      <p className="font-['Space_Grotesk'] text-[24px] md:text-[32px] text-[#444748] font-bold tracking-widest leading-relaxed uppercase break-keep">A small community already creates a large economy.</p>
      <div className="h-4"></div>
      <p className="font-['Space_Grotesk'] text-[24px] md:text-[32px] text-[#444748] font-bold tracking-widest leading-relaxed uppercase break-keep">Tango Community Ecosystem</p>
      <p className="text-[20px] md:text-[28px] text-[#444748] font-medium leading-relaxed break-keep">클래스 / 밀롱가 / 워크샵 / 슈즈 / 의상 / 여행 / 숙박 / 식음료 / 대관</p>
      <div className="h-4"></div>
      <p className="text-[20px] md:text-[28px] text-[#444748] font-medium leading-relaxed break-keep">1인 평균 월 소비: 약 45만 원</p>
      <p className="text-[20px] md:text-[28px] text-[#444748] font-medium leading-relaxed break-keep">연간 activity economy: 약 108억 원</p>
      <p className="font-['Space_Grotesk'] text-[24px] md:text-[32px] text-[#444748] font-bold tracking-widest leading-relaxed uppercase break-keep">WoC Connected GMV: 약 32억 원</p>
      <p className="text-[20px] md:text-[28px] text-[#444748] font-medium leading-relaxed break-keep">예상 플랫폼 매출: 약 2.2억 원 / year</p>
      <div className="h-4"></div>
      <p className="text-[20px] md:text-[28px] text-[#444748] font-medium leading-relaxed break-keep">작은 community 하나에도</p>
      <p className="text-[20px] md:text-[28px] text-[#444748] font-medium leading-relaxed break-keep">이미 거대한 경제가 흐르고 있다.</p>
    </div>
  </div>
);

// Slide 16: WoC는 이 흐름을 연결한다
const Slide16 = () => (
  <div className="relative z-10 flex flex-col items-center justify-center text-center w-full max-w-[1400px] px-[80px] h-full">
    <h2 className="text-[48px] md:text-[72px] font-bold text-[#1c1b1b] leading-[1.2] tracking-tight break-keep mb-16">
      WoC는 이 흐름을 연결한다
    </h2>
    <div className="flex flex-col gap-4 items-center justify-center w-full max-w-[1000px]">
      <p className="text-[20px] md:text-[28px] text-[#444748] font-medium leading-relaxed break-keep">예약 / 티켓 / 클래스 / 대관 / 숙박 / 멤버십 / 상품</p>
      <div className="h-4"></div>
      <p className="font-['Space_Grotesk'] text-[24px] md:text-[32px] text-[#444748] font-bold tracking-widest leading-relaxed uppercase break-keep">WoC는 activity economy infrastructure를 만든다.</p>
    </div>
  </div>
);

// Slide 17: 취미는 소비가 아니라 삶의 경제다
const Slide17 = () => (
  <div className="relative z-10 flex flex-col items-center justify-center text-center w-full max-w-[1400px] px-[80px] h-full">
    <h2 className="text-[80px] md:text-[140px] font-bold text-[#1c1b1b] leading-[1.1] tracking-tight break-keep">
      취미는 소비가 아니라 삶의 경제다
    </h2>
  </div>
);

// Slide 18: Section: SECTION 4 — GROUP OPERATING SYSTEM
const Slide18 = () => (
  <div className="relative z-10 flex flex-col items-center justify-center text-center w-full h-full bg-[#1c1b1b]">
    <h2 className="font-['Space_Grotesk'] text-[48px] md:text-[80px] font-bold text-white tracking-widest px-10 leading-tight break-keep">
      SECTION 4 — GROUP OPERATING SYSTEM
    </h2>
  </div>
);

// Slide 19: Group은 단순 커뮤니티가 아니다
const Slide19 = () => (
  <div className="relative z-10 flex flex-col items-center justify-center text-center w-full max-w-[1400px] px-[80px] h-full">
    <h2 className="text-[48px] md:text-[72px] font-bold text-[#1c1b1b] leading-[1.2] tracking-tight break-keep mb-16">
      Group은 단순 커뮤니티가 아니다
    </h2>
    <div className="flex flex-col gap-4 items-center justify-center w-full max-w-[1000px]">
      <p className="font-['Space_Grotesk'] text-[24px] md:text-[32px] text-[#444748] font-bold tracking-widest leading-relaxed uppercase break-keep">Groups become operating systems.</p>
    </div>
  </div>
);

// Slide 20: 모든 Group은 서로 다른 workflow를 가진다
const Slide20 = () => (
  <div className="relative z-10 flex flex-col items-center justify-center text-center w-full max-w-[1400px] px-[80px] h-full">
    <h2 className="text-[48px] md:text-[72px] font-bold text-[#1c1b1b] leading-[1.2] tracking-tight break-keep mb-16">
      모든 Group은 서로 다른 workflow를 가진다
    </h2>
    <div className="flex flex-col gap-4 items-center justify-center w-full max-w-[1000px]">
      <p className="font-['Space_Grotesk'] text-[24px] md:text-[32px] text-[#444748] font-bold tracking-widest leading-relaxed uppercase break-keep">Tango Studio / Academy / Startup / Fan Community</p>
    </div>
  </div>
);

// Slide 21: One Platform Infinite Community Systems
const Slide21 = () => (
  <div className="relative z-10 flex flex-col items-center justify-center text-center w-full max-w-[1400px] px-[80px] h-full">
    <h2 className="text-[48px] md:text-[72px] font-bold text-[#1c1b1b] leading-[1.2] tracking-tight break-keep mb-16">
      One Platform<br/>Infinite Community Systems
    </h2>
    <div className="flex flex-col gap-4 items-center justify-center w-full max-w-[1000px]">
      <p className="text-[20px] md:text-[28px] text-[#444748] font-medium leading-relaxed break-keep">50+ Functions</p>
      <p className="font-['Space_Grotesk'] text-[24px] md:text-[32px] text-[#444748] font-bold tracking-widest leading-relaxed uppercase break-keep">Build your own community system.</p>
      <div className="h-4"></div>
      <p className="font-['Space_Grotesk'] text-[24px] md:text-[32px] text-[#444748] font-bold tracking-widest leading-relaxed uppercase break-keep">ADMIN: Brand Setting, Class Setting, Shop Setting</p>
      <p className="font-['Space_Grotesk'] text-[24px] md:text-[32px] text-[#444748] font-bold tracking-widest leading-relaxed uppercase break-keep">CORE: Dashboard, Calendar, Feed, Live, Chat Rooms</p>
      <p className="font-['Space_Grotesk'] text-[24px] md:text-[32px] text-[#444748] font-bold tracking-widest leading-relaxed uppercase break-keep">EDUCATION: Class Manager, Tuition Manager, Homework Tracker</p>
      <p className="font-['Space_Grotesk'] text-[24px] md:text-[32px] text-[#444748] font-bold tracking-widest leading-relaxed uppercase break-keep">EVENTS: Ticket Booking, Workshop Registration, Venue Booking</p>
      <p className="font-['Space_Grotesk'] text-[24px] md:text-[32px] text-[#444748] font-bold tracking-widest leading-relaxed uppercase break-keep">COMMERCE: Group Shop, Rental System, Membership Billing</p>
      <p className="font-['Space_Grotesk'] text-[24px] md:text-[32px] text-[#444748] font-bold tracking-widest leading-relaxed uppercase break-keep">OPERATIONS: Task Manager, Internal Wiki, Recruitment</p>
      <p className="font-['Space_Grotesk'] text-[24px] md:text-[32px] text-[#444748] font-bold tracking-widest leading-relaxed uppercase break-keep">AI & INTELLIGENCE: AI Assistant, Auto Translation, AI Insights</p>
    </div>
  </div>
);

// Slide 22: 하나의 Group은 하나의 살아있는 세계가 된다
const Slide22 = () => (
  <div className="relative z-10 flex flex-col items-center justify-center text-center w-full max-w-[1400px] px-[80px] h-full">
    <h2 className="text-[48px] md:text-[72px] font-bold text-[#1c1b1b] leading-[1.2] tracking-tight break-keep mb-16">
      하나의 Group은 하나의 살아있는 세계가 된다
    </h2>
    <div className="flex flex-col gap-4 items-center justify-center w-full max-w-[1000px]">
      <p className="font-['Space_Grotesk'] text-[24px] md:text-[32px] text-[#444748] font-bold tracking-widest leading-relaxed uppercase break-keep">A group becomes a living world.</p>
      <div className="h-4"></div>
      <p className="font-['Space_Grotesk'] text-[24px] md:text-[32px] text-[#444748] font-bold tracking-widest leading-relaxed uppercase break-keep">Tango Studio / Yoga Brand / Daechi Academy / Fan Community / Startup Team</p>
      <div className="h-4"></div>
      <p className="font-['Space_Grotesk'] text-[24px] md:text-[32px] text-[#444748] font-bold tracking-widest leading-relaxed uppercase break-keep">WoC는 커뮤니티를 위한 운영체제를 만든다.</p>
    </div>
  </div>
);

// Slide 23: Section: SECTION 5 — BUSINESS PENETRATION
const Slide23 = () => (
  <div className="relative z-10 flex flex-col items-center justify-center text-center w-full h-full bg-[#1c1b1b]">
    <h2 className="font-['Space_Grotesk'] text-[48px] md:text-[80px] font-bold text-white tracking-widest px-10 leading-tight break-keep">
      SECTION 5 — BUSINESS PENETRATION
    </h2>
  </div>
);

// Slide 24: Business Penetration
const Slide24 = () => (
  <div className="relative z-10 flex flex-col items-center justify-center text-center w-full max-w-[1400px] px-[80px] h-full">
    <h2 className="text-[48px] md:text-[72px] font-bold text-[#1c1b1b] leading-[1.2] tracking-tight break-keep mb-16">
      Business Penetration
    </h2>
    <div className="flex flex-col gap-4 items-center justify-center w-full max-w-[1000px]">
      <p className="font-['Space_Grotesk'] text-[24px] md:text-[32px] text-[#444748] font-bold tracking-widest leading-relaxed uppercase break-keep">Start from existing communities.</p>
      <div className="h-4"></div>
      <p className="text-[20px] md:text-[28px] text-[#444748] font-medium leading-relaxed break-keep">1차: Tango / Dance / Yoga / Running</p>
      <p className="text-[20px] md:text-[28px] text-[#444748] font-medium leading-relaxed break-keep">2차: Academy / Fan Community / Startup</p>
      <div className="h-4"></div>
      <p className="font-['Space_Grotesk'] text-[24px] md:text-[32px] text-[#444748] font-bold tracking-widest leading-relaxed uppercase break-keep">WoC는 모든 시장을 동시에 공략하지 않는다.</p>
    </div>
  </div>
);

// Slide 25: Tango Community Example
const Slide25 = () => (
  <div className="relative z-10 flex flex-col items-center justify-center text-center w-full max-w-[1400px] px-[80px] h-full">
    <h2 className="text-[48px] md:text-[72px] font-bold text-[#1c1b1b] leading-[1.2] tracking-tight break-keep mb-16">
      Tango Community Example
    </h2>
    <div className="flex flex-col gap-4 items-center justify-center w-full max-w-[1000px]">
      <p className="font-['Space_Grotesk'] text-[24px] md:text-[32px] text-[#444748] font-bold tracking-widest leading-relaxed uppercase break-keep">Community penetration structure.</p>
      <div className="h-4"></div>
      <p className="text-[20px] md:text-[28px] text-[#444748] font-medium leading-relaxed break-keep">강사: 클래스 등록 / 결제 승인 / 워크샵 운영</p>
      <p className="text-[20px] md:text-[28px] text-[#444748] font-medium leading-relaxed break-keep">(강사 1명당 약 50명 연결 가능)</p>
      <div className="h-4"></div>
      <p className="text-[20px] md:text-[28px] text-[#444748] font-medium leading-relaxed break-keep">오거나이저: 소셜 등록 / 티켓 / 이벤트 운영 / 테이블 예약</p>
      <p className="text-[20px] md:text-[28px] text-[#444748] font-medium leading-relaxed break-keep">(오거나이저 1명당 약 100명 연결 가능)</p>
    </div>
  </div>
);

// Slide 26: 강사와 오거나이저는 새로운 onboarding node가 된다
const Slide26 = () => (
  <div className="relative z-10 flex flex-col items-center justify-center text-center w-full max-w-[1400px] px-[80px] h-full">
    <h2 className="text-[48px] md:text-[72px] font-bold text-[#1c1b1b] leading-[1.2] tracking-tight break-keep mb-16">
      강사와 오거나이저는 새로운 onboarding node가 된다
    </h2>
    <div className="flex flex-col gap-4 items-center justify-center w-full max-w-[1000px]">
      <p className="font-['Space_Grotesk'] text-[24px] md:text-[32px] text-[#444748] font-bold tracking-widest leading-relaxed uppercase break-keep">Instructor → Students</p>
      <p className="font-['Space_Grotesk'] text-[24px] md:text-[32px] text-[#444748] font-bold tracking-widest leading-relaxed uppercase break-keep">Organizer → Participants</p>
      <div className="h-4"></div>
      <p className="font-['Space_Grotesk'] text-[24px] md:text-[32px] text-[#444748] font-bold tracking-widest leading-relaxed uppercase break-keep">Group 자체가 onboarding node 역할을 한다.</p>
    </div>
  </div>
);

// Slide 27: 2,000명 규모는 2개월 내 penetration 가능성 예상
const Slide27 = () => (
  <div className="relative z-10 flex flex-col items-center justify-center text-center w-full max-w-[1400px] px-[80px] h-full">
    <h2 className="text-[48px] md:text-[72px] font-bold text-[#1c1b1b] leading-[1.2] tracking-tight break-keep mb-16">
      2,000명 규모는 2개월 내 penetration 가능성 예상
    </h2>
    <div className="flex flex-col gap-4 items-center justify-center w-full max-w-[1000px]">
      <p className="text-[20px] md:text-[28px] text-[#444748] font-medium leading-relaxed break-keep">광고보다 community penetration 중심.</p>
    </div>
  </div>
);

// Slide 28: 별도의 마케팅 없이 자연스럽게 회원이 확대된다
const Slide28 = () => (
  <div className="relative z-10 flex flex-col items-center justify-center text-center w-full max-w-[1400px] px-[80px] h-full">
    <h2 className="text-[48px] md:text-[72px] font-bold text-[#1c1b1b] leading-[1.2] tracking-tight break-keep mb-16">
      별도의 마케팅 없이 자연스럽게 회원이 확대된다
    </h2>
    <div className="flex flex-col gap-4 items-center justify-center w-full max-w-[1000px]">
      <p className="font-['Space_Grotesk'] text-[24px] md:text-[32px] text-[#444748] font-bold tracking-widest leading-relaxed uppercase break-keep">Community penetration.</p>
      <div className="h-4"></div>
      <p className="text-[20px] md:text-[28px] text-[#444748] font-medium leading-relaxed break-keep">강사가 학생을 연결하고, 오거나이저가 참가자를 연결한다.</p>
      <div className="h-4"></div>
      <p className="font-['Space_Grotesk'] text-[24px] md:text-[32px] text-[#444748] font-bold tracking-widest leading-relaxed uppercase break-keep">WoC는 User Acquisition보다 Community Penetration에 가깝다.</p>
    </div>
  </div>
);

// Slide 29: 사람들은 하나의 활동에만 머물지 않는다
const Slide29 = () => (
  <div className="relative z-10 flex flex-col items-center justify-center text-center w-full max-w-[1400px] px-[80px] h-full">
    <h2 className="text-[48px] md:text-[72px] font-bold text-[#1c1b1b] leading-[1.2] tracking-tight break-keep mb-16">
      사람들은 하나의 활동에만 머물지 않는다
    </h2>
    <div className="flex flex-col gap-4 items-center justify-center w-full max-w-[1000px]">
      <p className="font-['Space_Grotesk'] text-[24px] md:text-[32px] text-[#444748] font-bold tracking-widest leading-relaxed uppercase break-keep">Communities naturally overlap.</p>
      <div className="h-4"></div>
      <p className="font-['Space_Grotesk'] text-[24px] md:text-[32px] text-[#444748] font-bold tracking-widest leading-relaxed uppercase break-keep">Tango → Yoga → Running → Coffee → Travel</p>
      <div className="h-4"></div>
      <p className="font-['Space_Grotesk'] text-[24px] md:text-[32px] text-[#444748] font-bold tracking-widest leading-relaxed uppercase break-keep">WoC는 활동 중심 network structure를 만든다.</p>
    </div>
  </div>
);

// Slide 30: WoC는 User Acquisition보다 Community Penetration에 가깝다
const Slide30 = () => (
  <div className="relative z-10 flex flex-col items-center justify-center text-center w-full max-w-[1400px] px-[80px] h-full">
    <h2 className="text-[48px] md:text-[72px] font-bold text-[#1c1b1b] leading-[1.2] tracking-tight break-keep mb-16">
      WoC는 User Acquisition보다<br/>Community Penetration에 가깝다
    </h2>
    <div className="flex flex-col gap-4 items-center justify-center w-full max-w-[1000px]">
      <p className="font-['Space_Grotesk'] text-[24px] md:text-[32px] text-[#444748] font-bold tracking-widest leading-relaxed uppercase break-keep">WoC는 group 기반으로 확장된다.</p>
    </div>
  </div>
);

// Slide 31: Section: SECTION 6 — POSSIBILITY & RISK
const Slide31 = () => (
  <div className="relative z-10 flex flex-col items-center justify-center text-center w-full h-full bg-[#1c1b1b]">
    <h2 className="font-['Space_Grotesk'] text-[48px] md:text-[80px] font-bold text-white tracking-widest px-10 leading-tight break-keep">
      SECTION 6 — POSSIBILITY & RISK
    </h2>
  </div>
);

// Slide 32: 작은 강한 커뮤니티의 시대
const Slide32 = () => (
  <div className="relative z-10 flex flex-col items-center justify-center text-center w-full max-w-[1400px] px-[80px] h-full">
    <h2 className="text-[48px] md:text-[72px] font-bold text-[#1c1b1b] leading-[1.2] tracking-tight break-keep mb-16">
      작은 강한 커뮤니티의 시대
    </h2>
    <div className="flex flex-col gap-4 items-center justify-center w-full max-w-[1000px]">
      <p className="font-['Space_Grotesk'] text-[24px] md:text-[32px] text-[#444748] font-bold tracking-widest leading-relaxed uppercase break-keep">The era of small, strong communities.</p>
      <div className="h-4"></div>
      <p className="font-['Space_Grotesk'] text-[24px] md:text-[32px] text-[#444748] font-bold tracking-widest leading-relaxed uppercase break-keep">Fandom / Class / Crew / Local Society</p>
      <div className="h-4"></div>
      <p className="text-[20px] md:text-[28px] text-[#444748] font-medium leading-relaxed break-keep">사람들은 giant SNS보다 더 깊은 community를 찾기 시작했다.</p>
    </div>
  </div>
);

// Slide 33: Why WoC Could Fail
const Slide33 = () => (
  <div className="relative z-10 flex flex-col items-center justify-center text-center w-full max-w-[1400px] px-[80px] h-full">
    <h2 className="text-[48px] md:text-[72px] font-bold text-[#1c1b1b] leading-[1.2] tracking-tight break-keep mb-16">
      Why WoC Could Fail
    </h2>
    <div className="flex flex-col gap-4 items-center justify-center w-full max-w-[1000px]">
      <p className="font-['Space_Grotesk'] text-[24px] md:text-[32px] text-[#444748] font-bold tracking-widest leading-relaxed uppercase break-keep">Workflow Complexity</p>
      <p className="font-['Space_Grotesk'] text-[24px] md:text-[32px] text-[#444748] font-bold tracking-widest leading-relaxed uppercase break-keep">Onboarding Difficulty</p>
      <p className="font-['Space_Grotesk'] text-[24px] md:text-[32px] text-[#444748] font-bold tracking-widest leading-relaxed uppercase break-keep">Slow Network Effects</p>
      <p className="font-['Space_Grotesk'] text-[24px] md:text-[32px] text-[#444748] font-bold tracking-widest leading-relaxed uppercase break-keep">Product Sprawl</p>
      <div className="h-4"></div>
      <p className="font-['Space_Grotesk'] text-[24px] md:text-[32px] text-[#444748] font-bold tracking-widest leading-relaxed uppercase break-keep">WoC는 앱 가입보다 운영 시스템 구축에 가깝다.</p>
    </div>
  </div>
);

// Slide 34: But if Groups become operating systems, the upside becomes enormous.
const Slide34 = () => (
  <div className="relative z-10 flex flex-col items-center justify-center text-center w-full max-w-[1400px] px-[80px] h-full">
    <h2 className="text-[48px] md:text-[72px] font-bold text-[#1c1b1b] leading-[1.2] tracking-tight break-keep mb-16">
      But if Groups become operating systems,<br/>the upside becomes enormous.
    </h2>
    <div className="flex flex-col gap-4 items-center justify-center w-full max-w-[1000px]">
      <p className="text-[20px] md:text-[28px] text-[#444748] font-medium leading-relaxed break-keep">네이버카페 / 밴드 / 디스코드 / 클래스 플랫폼 / 예약툴 / ERP-lite / 팬덤 운영</p>
      <p className="text-[20px] md:text-[28px] text-[#444748] font-medium leading-relaxed break-keep">사이의 영역 연결.</p>
      <div className="h-4"></div>
      <p className="font-['Space_Grotesk'] text-[24px] md:text-[32px] text-[#444748] font-bold tracking-widest leading-relaxed uppercase break-keep">WoC는 Community Infrastructure Layer를 목표로 한다.</p>
    </div>
  </div>
);

// Slide 35: 가능성 시나리오
const Slide35 = () => (
  <div className="relative z-10 flex flex-col items-center justify-center text-center w-full max-w-[1400px] px-[80px] h-full">
    <h2 className="text-[48px] md:text-[72px] font-bold text-[#1c1b1b] leading-[1.2] tracking-tight break-keep mb-16">
      가능성 시나리오
    </h2>
    <div className="flex flex-col gap-4 items-center justify-center w-full max-w-[1000px]">
      <p className="text-[20px] md:text-[28px] text-[#444748] font-medium leading-relaxed break-keep">유니콘급 플랫폼: 5~10%</p>
      <p className="text-[20px] md:text-[28px] text-[#444748] font-medium leading-relaxed break-keep">전략적 인수: 15~25%</p>
      <p className="text-[20px] md:text-[28px] text-[#444748] font-medium leading-relaxed break-keep">전문 커뮤니티 인프라 기업: 40~60%</p>
    </div>
  </div>
);

// Slide 36: WORLD OF COMMUNITY_ Life Goes On.
const Slide36 = () => (
  <div className="relative z-10 flex flex-col items-center justify-center text-center w-full max-w-[1400px] px-[80px] h-full">
    <h2 className="text-[80px] md:text-[140px] font-bold text-[#1c1b1b] leading-[1.1] tracking-tight break-keep">
      WORLD OF COMMUNITY_<br/>Life Goes On.
    </h2>
  </div>
);


const PresentationPage = () => {
  const { setGlobalNavHidden, setIsHeaderVisible } = useNavigation();
  const [currentSlide, setCurrentSlide] = useState(0);
  const totalSlides = 37;

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % totalSlides);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
  const jumpToSlide = (index: number) => setCurrentSlide(index);

  useEffect(() => {
    setGlobalNavHidden(true);
    setIsHeaderVisible(false);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') nextSlide();
      if (e.key === 'ArrowLeft') prevSlide();
    };
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      setGlobalNavHidden(false);
      setIsHeaderVisible(true);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [setGlobalNavHidden, setIsHeaderVisible]);

  const renderSlide = () => {
    switch (currentSlide) {
      case 0: return <Slide0 />;
      case 1: return <Slide1 />;
      case 2: return <Slide2 />;
      case 3: return <Slide3 />;
      case 4: return <Slide4 />;
      case 5: return <Slide5 />;
      case 6: return <Slide6 />;
      case 7: return <Slide7 />;
      case 8: return <Slide8 />;
      case 9: return <Slide9 />;
      case 10: return <Slide10 />;
      case 11: return <Slide11 />;
      case 12: return <Slide12 />;
      case 13: return <Slide13 />;
      case 14: return <Slide14 />;
      case 15: return <Slide15 />;
      case 16: return <Slide16 />;
      case 17: return <Slide17 />;
      case 18: return <Slide18 />;
      case 19: return <Slide19 />;
      case 20: return <Slide20 />;
      case 21: return <Slide21 />;
      case 22: return <Slide22 />;
      case 23: return <Slide23 />;
      case 24: return <Slide24 />;
      case 25: return <Slide25 />;
      case 26: return <Slide26 />;
      case 27: return <Slide27 />;
      case 28: return <Slide28 />;
      case 29: return <Slide29 />;
      case 30: return <Slide30 />;
      case 31: return <Slide31 />;
      case 32: return <Slide32 />;
      case 33: return <Slide33 />;
      case 34: return <Slide34 />;
      case 35: return <Slide35 />;
      case 36: return <Slide36 />;

      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#fcf8f8] text-[#1c1b1b] font-['Manrope'] selection:bg-[#c6c6c7] overflow-hidden relative">
      <link href="https://fonts.googleapis.com/css2?family=Geist:wght@100..900&family=Space+Grotesk:wght@300..700&family=Manrope:wght@200..800&display=swap" rel="stylesheet"/>
      
      <PresentationHeader />

      <main className="relative h-screen w-full flex items-center justify-center overflow-hidden">
        <div className="w-full h-full flex items-center justify-center transition-opacity duration-500">
          {renderSlide()}
        </div>
      </main>

      <PresentationFooter 
        currentSlide={currentSlide} 
        totalSlides={totalSlides}
      />
    </div>
  );
};

export default PresentationPage;
