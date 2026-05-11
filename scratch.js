const fs = require('fs');

const slidesData = [
  { type: 'section', title: 'SECTION 1 — INTRO' },
  { type: 'slide', title: 'WoC', text: [] },
  { type: 'slide', title: 'WORLD OF COMMUNITY', text: [] },
  { type: 'slide', title: 'The Operating System For Human Communities.', text: [] },
  { type: 'slide', title: 'Life Goes On_', text: [] },
  { type: 'slide', title: 'Life on STAGE / ROAD / TABLE / MUSE / MIND / DESK', text: [
      'STAGE: Tango, Salsa, Ballet, Flamenco',
      'ROAD: Bike, Running, Trekking',
      'TABLE: Cooking, Coffee, Pottery',
      'MUSE: BTS, Cinema, Anime',
      'MIND: Writing, Journaling, Interior',
      'DESK: Daechi Academy, English School, Study Group'
  ] },

  { type: 'section', title: 'SECTION 2 — WHY WoC' },
  { type: 'slide', title: '돈은 여기로 흐른다', text: [
      '클래스 / 공연 / 커피 / 팬덤 / 여행',
      '',
      '사람들은 스스로 선택한 활동에',
      '돈과 시간을 사용한다.'
  ] },
  { type: 'slide', title: '세금은 자동이다\n통신비는 고정이다\n대출이자는 의무다', text: [
      'Taxes are automatic.',
      'Telecom bills are fixed.',
      'Loan interests are mandatory.'
  ] },
  { type: 'slide', title: '하지만 열정은 선택된다', text: [
      'But passions are chosen.'
  ] },
  { type: 'slide', title: '사람들은 삶의 상당 부분을\n취미와 커뮤니티에 사용한다', text: [
      'Time · Emotion · Free Spending'
  ] },
  { type: 'slide', title: '사람은 플랫폼에 머무는 게 아니라\nGroup에 소속된다', text: [
      'People belong to communities.',
      '',
      'Tango Group / Yoga Circle / Running Crew / BTS Fandom / Daechi Academy',
      '',
      'WoC는 사람보다 Group을 중심으로 설계된다.'
  ] },
  { type: 'slide', title: '기존 플랫폼은 콘텐츠를 연결한다\nWoC는 인간 커뮤니티를 연결한다', text: [
      'Content Feed vs Community / Activity / Group'
  ] },

  { type: 'section', title: 'SECTION 3 — COMMUNITY ECONOMY' },
  { type: 'slide', title: '작은 커뮤니티 하나에도\n거대한 경제가 존재한다', text: [
      'Activity creates economy.',
      '',
      '클래스 / 워크샵 / 공연 / 여행 / 커피 / 공간',
      'Booking / Tickets / Rentals / Membership',
      '',
      'WoC는 인간 활동 경제의 흐름을 연결한다.'
  ] },
  { type: 'slide', title: '한국 탱고 인구 약 2,000명', text: [
      'A small community already creates a large economy.',
      '',
      'Tango Community Ecosystem',
      '클래스 / 밀롱가 / 워크샵 / 슈즈 / 의상 / 여행 / 숙박 / 식음료 / 대관',
      '',
      '1인 평균 월 소비: 약 45만 원',
      '연간 activity economy: 약 108억 원',
      'WoC Connected GMV: 약 32억 원',
      '예상 플랫폼 매출: 약 2.2억 원 / year',
      '',
      '작은 community 하나에도',
      '이미 거대한 경제가 흐르고 있다.'
  ] },
  { type: 'slide', title: 'WoC는 이 흐름을 연결한다', text: [
      '예약 / 티켓 / 클래스 / 대관 / 숙박 / 멤버십 / 상품',
      '',
      'WoC는 activity economy infrastructure를 만든다.'
  ] },
  { type: 'slide', title: '취미는 소비가 아니라 삶의 경제다', text: [] },

  { type: 'section', title: 'SECTION 4 — GROUP OPERATING SYSTEM' },
  { type: 'slide', title: 'Group은 단순 커뮤니티가 아니다', text: [
      'Groups become operating systems.'
  ] },
  { type: 'slide', title: '모든 Group은 서로 다른 workflow를 가진다', text: [
      'Tango Studio / Academy / Startup / Fan Community'
  ] },
  { type: 'slide', title: 'One Platform\nInfinite Community Systems', text: [
      '50+ Functions',
      'Build your own community system.',
      '',
      'ADMIN: Brand Setting, Class Setting, Shop Setting',
      'CORE: Dashboard, Calendar, Feed, Live, Chat Rooms',
      'EDUCATION: Class Manager, Tuition Manager, Homework Tracker',
      'EVENTS: Ticket Booking, Workshop Registration, Venue Booking',
      'COMMERCE: Group Shop, Rental System, Membership Billing',
      'OPERATIONS: Task Manager, Internal Wiki, Recruitment',
      'AI & INTELLIGENCE: AI Assistant, Auto Translation, AI Insights'
  ] },
  { type: 'slide', title: '하나의 Group은 하나의 살아있는 세계가 된다', text: [
      'A group becomes a living world.',
      '',
      'Tango Studio / Yoga Brand / Daechi Academy / Fan Community / Startup Team',
      '',
      'WoC는 커뮤니티를 위한 운영체제를 만든다.'
  ] },

  { type: 'section', title: 'SECTION 5 — BUSINESS PENETRATION' },
  { type: 'slide', title: 'Business Penetration', text: [
      'Start from existing communities.',
      '',
      '1차: Tango / Dance / Yoga / Running',
      '2차: Academy / Fan Community / Startup',
      '',
      'WoC는 모든 시장을 동시에 공략하지 않는다.'
  ] },
  { type: 'slide', title: 'Tango Community Example', text: [
      'Community penetration structure.',
      '',
      '강사: 클래스 등록 / 결제 승인 / 워크샵 운영',
      '(강사 1명당 약 50명 연결 가능)',
      '',
      '오거나이저: 소셜 등록 / 티켓 / 이벤트 운영 / 테이블 예약',
      '(오거나이저 1명당 약 100명 연결 가능)'
  ] },
  { type: 'slide', title: '강사와 오거나이저는 새로운 onboarding node가 된다', text: [
      'Instructor → Students',
      'Organizer → Participants',
      '',
      'Group 자체가 onboarding node 역할을 한다.'
  ] },
  { type: 'slide', title: '2,000명 규모는 2개월 내 penetration 가능성 예상', text: [
      '광고보다 community penetration 중심.'
  ] },
  { type: 'slide', title: '별도의 마케팅 없이 자연스럽게 회원이 확대된다', text: [
      'Community penetration.',
      '',
      '강사가 학생을 연결하고, 오거나이저가 참가자를 연결한다.',
      '',
      'WoC는 User Acquisition보다 Community Penetration에 가깝다.'
  ] },
  { type: 'slide', title: '사람들은 하나의 활동에만 머물지 않는다', text: [
      'Communities naturally overlap.',
      '',
      'Tango → Yoga → Running → Coffee → Travel',
      '',
      'WoC는 활동 중심 network structure를 만든다.'
  ] },
  { type: 'slide', title: 'WoC는 User Acquisition보다\nCommunity Penetration에 가깝다', text: [
      'WoC는 group 기반으로 확장된다.'
  ] },

  { type: 'section', title: 'SECTION 6 — POSSIBILITY & RISK' },
  { type: 'slide', title: '작은 강한 커뮤니티의 시대', text: [
      'The era of small, strong communities.',
      '',
      'Fandom / Class / Crew / Local Society',
      '',
      '사람들은 giant SNS보다 더 깊은 community를 찾기 시작했다.'
  ] },
  { type: 'slide', title: 'Why WoC Could Fail', text: [
      'Workflow Complexity',
      'Onboarding Difficulty',
      'Slow Network Effects',
      'Product Sprawl',
      '',
      'WoC는 앱 가입보다 운영 시스템 구축에 가깝다.'
  ] },
  { type: 'slide', title: 'But if Groups become operating systems,\nthe upside becomes enormous.', text: [
      '네이버카페 / 밴드 / 디스코드 / 클래스 플랫폼 / 예약툴 / ERP-lite / 팬덤 운영',
      '사이의 영역 연결.',
      '',
      'WoC는 Community Infrastructure Layer를 목표로 한다.'
  ] },
  { type: 'slide', title: '가능성 시나리오', text: [
      '유니콘급 플랫폼: 5~10%',
      '전략적 인수: 15~25%',
      '전문 커뮤니티 인프라 기업: 40~60%'
  ] },
  { type: 'slide', title: 'WORLD OF COMMUNITY_\nLife Goes On.', text: [] }
];

let componentsStr = '';
let switchCases = '';

slidesData.forEach((s, idx) => {
  if (s.type === 'section') {
    componentsStr += "\n// Slide " + idx + ": Section: " + s.title + "\n";
    componentsStr += "const Slide" + idx + " = () => (\n";
    componentsStr += "  <div className=\"relative z-10 flex flex-col items-center justify-center text-center w-full h-full bg-[#1c1b1b]\">\n";
    componentsStr += "    <h2 className=\"font-['Space_Grotesk'] text-[48px] md:text-[80px] font-bold text-white tracking-widest px-10 leading-tight break-keep\">\n";
    componentsStr += "      " + s.title + "\n";
    componentsStr += "    </h2>\n";
    componentsStr += "  </div>\n";
    componentsStr += ");\n";
  } else {
    // Formatting title with newlines
    const titleHtml = s.title.split('\n').map(t => t.trim()).join('<br/>');
    
    // Formatting content
    const contentHtml = s.text.map(l => {
      if (!l) return "<div className=\"h-4\"></div>"; // empty line for spacing
      if (l.match(/^[a-zA-Z]/)) { // if starts with English
        return "<p className=\"font-['Space_Grotesk'] text-[24px] md:text-[32px] text-[#444748] font-bold tracking-widest leading-relaxed uppercase break-keep\">" + l + "</p>";
      }
      return "<p className=\"text-[20px] md:text-[28px] text-[#444748] font-medium leading-relaxed break-keep\">" + l + "</p>";
    }).join('\n      ');

    componentsStr += "\n// Slide " + idx + ": " + s.title.replace(/\n/g, ' ') + "\n";
    componentsStr += "const Slide" + idx + " = () => (\n";
    componentsStr += "  <div className=\"relative z-10 flex flex-col items-center justify-center text-center w-full max-w-[1400px] px-[80px] h-full\">\n";
    
    // If there is text, title goes top-center, text goes below.
    // If there is no text, title is perfectly centered and larger.
    if (s.text.length > 0) {
      componentsStr += "    <h2 className=\"text-[48px] md:text-[72px] font-bold text-[#1c1b1b] leading-[1.2] tracking-tight break-keep mb-16\">\n";
      componentsStr += "      " + titleHtml + "\n";
      componentsStr += "    </h2>\n";
      componentsStr += "    <div className=\"flex flex-col gap-4 items-center justify-center w-full max-w-[1000px]\">\n";
      componentsStr += "      " + contentHtml + "\n";
      componentsStr += "    </div>\n";
    } else {
      componentsStr += "    <h2 className=\"text-[80px] md:text-[140px] font-bold text-[#1c1b1b] leading-[1.1] tracking-tight break-keep\">\n";
      componentsStr += "      " + titleHtml + "\n";
      componentsStr += "    </h2>\n";
    }
    
    componentsStr += "  </div>\n";
    componentsStr += ");\n";
  }

  switchCases += "      case " + idx + ": return <Slide" + idx + " />;\n";
});

const code = `"use client";

import React, { useState, useEffect } from 'react';
import PresentationHeader from '@/components/presentation/PresentationHeader';
import PresentationFooter from '@/components/presentation/PresentationFooter';
import { useNavigation } from '@/components/providers/NavigationProvider';

` + componentsStr + `

const PresentationPage = () => {
  const { setGlobalNavHidden, setIsHeaderVisible } = useNavigation();
  const [currentSlide, setCurrentSlide] = useState(0);
  const totalSlides = ${slidesData.length};

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
` + switchCases + `
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
        onPrev={prevSlide} 
        onNext={nextSlide} 
        onJump={jumpToSlide}
        totalSlides={totalSlides}
      />
    </div>
  );
};

export default PresentationPage;
`;

fs.writeFileSync('C:/Users/stone/WoC/src/app/pt/page.tsx', code, 'utf-8');
console.log('Done generating pt page.');
