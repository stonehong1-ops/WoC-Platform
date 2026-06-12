import React from 'react';

// Slide 0: WoC (Intro Cover)
export const Slide0 = () => (
  <div className="relative z-10 flex flex-col items-center justify-center text-center w-full h-full px-10 bg-[#111111] text-[#fcf8f8] overflow-hidden">
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <div className="w-[500px] h-[500px] rounded-full bg-white/[0.01] blur-[100px] pt1-si" />
    </div>

    <div className="relative z-10 max-w-[1200px] w-full flex flex-col items-center">
      <span className="font-['Space_Grotesk'] text-[13px] font-bold tracking-[0.4em] text-white/30 uppercase mb-12 pt1-fu">
        PRESENTATION 2026
      </span>

      <h1 className="text-[100px] md:text-[180px] font-black text-[#fcf8f8] leading-none tracking-[-0.08em] pt1-si">
        WoC
      </h1>
      
      <p className="font-['Space_Grotesk'] text-[20px] md:text-[28px] font-medium tracking-tight text-white/60 mt-4 pt1-fu pt1-d2">
        World of Community
      </p>

      <div className="w-[100px] h-[1px] bg-white/15 my-12 pt1-lg pt1-d4" />

      <p className="text-[16px] md:text-[20px] font-black tracking-[0.3em] text-white/45 uppercase pt1-fu pt1-d5">
        커뮤니티 플랫폼
      </p>
    </div>
  </div>
);

// Slide App Structure: APP STRUCTURE
export const SlideAppStructure = () => {
  const categories = [
    {
      title: 'WORLD',
      desc: '소셜 및 콘텐츠 매거진',
      tabs: ['Society (매거진)', 'Plaza (공유 피드)', 'Venues (공간 지도)', 'People (인물 정보/일정)'],
      color: 'border-emerald-600/20 bg-emerald-600/[0.01]'
    },
    {
      title: 'MARKET',
      desc: '커머스 및 공유 경제',
      tabs: ['Shop (상점)', 'Resale (중고 거래)', 'Rental (공간 대여)', 'Stay (숙박/카우치서핑)'],
      color: 'border-[#111111]/10 bg-white/40'
    },
    {
      title: 'NOW',
      desc: '실시간 이벤트',
      tabs: ['Today (모든 행사)', 'Social (모임 예매)', 'Class (수업/등록)', 'Events (행사 정보/등록)'],
      color: 'border-emerald-600/20 bg-emerald-600/[0.01]'
    },
    {
      title: 'LOUNGE',
      desc: '아카이브 및 발견',
      tabs: ['Pics (스냅 사진첩)', 'Lost & Found (분실물)', 'Hub (오프라인 물류)', 'Jump (다른 취미 점프)'],
      color: 'border-[#111111]/10 bg-white/40'
    },
    {
      title: 'GROUPS',
      desc: '커뮤니티 허브',
      tabs: ['Groups (소사이어티 탐색)', 'Individual Group (그룹 내부 모듈)', 'Group Admin (그룹 설정)'],
      color: 'border-emerald-600/20 bg-emerald-600/[0.01]'
    }
  ];

  const groupModules = [
    { name: 'Feed & Board', desc: '자유게시판 및 타임라인 소통' },
    { name: 'Notice Board', desc: '운영진 필독 중요 공지사항' },
    { name: 'Album & Moments', desc: '그룹 행사 스냅 사진첩 공유' },
    { name: 'Classes & Academy', desc: '수업 커리큘럼 및 주차별 미디어라인' },
    { name: 'Calendar & Booking', desc: '그룹 일정 달력 및 수련회 예약' },
    { name: 'Team Workspace', desc: '스태프 업무 관리 및 칸반 보드' }
  ];

  return (
    <div className="relative z-10 flex flex-col w-full h-full bg-[#fcf8f8] text-[#111111] px-[80px] justify-center overflow-hidden">
      <div className="max-w-[1300px] w-full mx-auto relative z-10">
        <h2 className="font-['Space_Grotesk'] text-[44px] md:text-[56px] font-black tracking-[0.05em] text-[#111111]/90 uppercase block leading-none mb-4 pt1-fu">
          APP STRUCTURE
        </h2>
        <p className="text-[16px] md:text-[18px] font-bold text-[#111111]/45 leading-tight tracking-tight mb-8 pt1-fu pt1-d2">
          5대 핵심 카테고리와 22대 하위 탭 구조로 통합된 모듈러 운영체제
        </p>

        {/* 5대 카테고리 그리드 */}
        <div className="grid grid-cols-5 gap-4 pt1-si pt1-d3">
          {categories.map((cat, idx) => (
            <div key={idx} className={`border p-4.5 rounded-sm flex flex-col justify-between hover:scale-[1.02] transition-transform duration-200 ${cat.color}`}>
              <div>
                <span className="font-['Space_Grotesk'] text-[16px] font-black text-[#111111] block mb-1">{cat.title}</span>
                <span className="text-[10px] font-bold text-[#111111]/40 block mb-3">{cat.desc}</span>
                <div className="flex flex-col gap-1.5">
                  {cat.tabs.map((tab, tIdx) => (
                    <div key={tIdx} className="bg-white/60 border border-[#111111]/5 px-2 py-1 rounded-sm text-[11px] font-bold text-[#111111]/75">
                      {tab}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 개별 그룹 하위 구조 섹션 */}
        <div className="mt-5 border-t border-[#111111]/10 pt-5 pt1-fu pt1-d4">
          <span className="font-['Space_Grotesk'] text-[10.5px] font-black tracking-widest text-[#111111]/45 uppercase block mb-2.5">
            INDIVIDUAL GROUP INNER MODULES (개별 그룹 하위 구조)
          </span>
          <div className="grid grid-cols-6 gap-3">
            {groupModules.map((mod, idx) => (
              <div key={idx} className="border border-emerald-600/10 bg-emerald-600/[0.01] p-3 rounded-sm">
                <span className="text-[12.5px] font-black text-emerald-600 block mb-1 leading-tight">{mod.name}</span>
                <span className="text-[10px] font-bold text-[#111111]/45 block leading-tight">{mod.desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 하단 보조 제어 영역 */}
        <div className="grid grid-cols-3 gap-4 mt-5 pt1-fu pt1-d6">
          <div className="border border-[#111111]/10 bg-white/40 p-3.5 rounded-sm flex justify-between items-center">
            <div>
              <span className="font-['Space_Grotesk'] text-[11px] font-black text-[#111111]/40 block uppercase">Lounge / Personalization</span>
              <span className="text-[13.5px] font-black text-[#111111]">MY 개인 허브</span>
            </div>
            <span className="text-[11px] font-bold text-[#111111]/50 text-right leading-tight">일정 · 지갑 · 코칭(Coaching) · 설정</span>
          </div>
          <div className="border border-[#111111]/10 bg-white/40 p-3.5 rounded-sm flex justify-between items-center">
            <div>
              <span className="font-['Space_Grotesk'] text-[11px] font-black text-[#111111]/40 block uppercase">Global Actions</span>
              <span className="text-[13.5px] font-black text-[#111111]">전역 알림 & 챗 / 검색 / 위치(Jump)</span>
            </div>
            <span className="text-[11px] font-bold text-[#111111]/50 text-right leading-tight">실시간 푸시 · DM · 소사이어티 점프</span>
          </div>
          <div className="border border-[#111111]/10 bg-white/40 p-3.5 rounded-sm flex justify-between items-center">
            <div>
              <span className="font-['Space_Grotesk'] text-[11px] font-black text-emerald-600/60 block uppercase">Backoffice System</span>
              <span className="text-[13.5px] font-black text-emerald-600">최고 관리자 (Admin)</span>
            </div>
            <span className="text-[11px] font-bold text-emerald-600/75 text-right leading-tight">배너 · 권한 · 검수 제어</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Slide 1: THE STORY
export const Slide1 = () => {
  const steps = [
    {
      num: '01',
      eng: 'LIFE GOES ON_',
      kor: '삶은 계속된다',
      text: (
        <>
          일상은 퍽퍽하고<br/>
          현실은 까칠하다.<br/>
          <br/>
          하지만 사람들은<br/>
          계속 사랑하고<br/>
          계속 배우고<br/>
          계속 만나고<br/>
          계속 춤추고<br/>
          계속 여행한다.<br/>
          <br/>
          행복과 건강을 향한<br/>
          사람들의 활동은 멈추지 않는다.
        </>
      ),
      bg: 'border-[#111111]/10 bg-white/40'
    },
    {
      num: '02',
      eng: 'BROKEN EXPERIENCE',
      kor: '취미를 위해 너무나 많은 App들을 떠돌아야했다',
      text: (
        <>
          커뮤니티는 여기<br/>
          소통은 저기<br/>
          행사는 다른 곳<br/>
          결제는 또 다른 곳<br/>
          <br/>
          그런데도<br/>
          아직 누구도<br/>
          이 시장을 지배하지 못했다.
        </>
      ),
      bg: 'border-[#111111]/10 bg-white/40'
    },
    {
      num: '03',
      eng: 'MONEY FLOWS HERE',
      kor: '그곳에는 살아있는 돈이 있었다',
      text: (
        <>
          사람들은<br/>
          자신이 선택한 활동에<br/>
          기꺼이 돈을 지불한다.<br/>
          <br/>
          배움<br/>
          만남<br/>
          행사<br/>
          여행<br/>
          취미<br/>
          문화<br/>
          <br/>
          이곳에는<br/>
          실제 돈이 흐르고 있었다.
        </>
      ),
      bg: 'border-[#111111]/10 bg-white/40'
    },
    {
      num: '04',
      eng: 'THE FIRST SOCIETY',
      kor: '가장 어려운 곳에서 시작하기로 했다',
      text: (
        <>
          소셜댄스는<br/>
          개인의 취미 중에서도<br/>
          가장 큰 용기가 필요한 영역이다.<br/>
          <br/>
          낯선 사람을 만나고<br/>
          함께 배우고<br/>
          함께 활동해야 한다.<br/>
          <br/>
          만약 이곳에서 가능하다면<br/>
          어디서든 가능할 것이라고 생각했다.<br/>
          <br/>
          이 실험에서 나는 커뮤니티경제(Community Economy)라는 개념을 발견했다.
        </>
      ),
      bg: 'border-[#111111]/10 bg-white/40'
    },
    {
      num: '05',
      eng: 'THE LAST PLATFORM',
      kor: '마지막 플랫폼 비즈니스',
      text: (
        <>
          사람은 이미 연결되어 있었다.<br/>
          <br/>
          필요했던 것은<br/>
          또 하나의 커뮤니티가 아니었다.<br/>
          <br/>
          활동을 운영하는 시스템이었다.<br/>
          <br/>
          WoC는<br/>
          커뮤니티 플랫폼이 아니다.<br/>
          <br/>
          사람들의 활동을 운영하는<br/>
          Community Operating System이다.<br/>
          <br/>
          <span className="text-emerald-600 font-black">The Last Platform.</span><br/>
          이것은 마지막 플랫폼이자 플랫폼OS이고 플랫폼의 완성이다.
        </>
      ),
      bg: 'border-emerald-600/30 bg-emerald-600/[0.015]'
    }
  ];

  return (
    <div className="relative z-10 flex flex-col w-full h-full bg-[#fcf8f8] text-[#111111] px-[80px] py-[40px] justify-center overflow-hidden">
      <div className="max-w-[1300px] w-full mx-auto relative z-10">
        <h2 className="font-['Space_Grotesk'] text-[44px] md:text-[56px] font-black tracking-[0.05em] text-[#111111]/90 uppercase block leading-none mb-4 pt1-fu">
          THE STORY
        </h2>
        <p className="text-[16px] md:text-[18px] font-bold text-[#111111]/45 leading-tight tracking-tight mb-8 pt1-fu pt1-d2">
          어떻게 WoC는 시작되었는가
        </p>

        <div className="grid grid-cols-5 gap-4 pt1-si pt1-d4">
          {steps.map((step, idx) => (
            <div key={idx} className={`border p-5 rounded-sm flex flex-col justify-between hover:scale-[1.02] transition-transform duration-200 ${step.bg}`}>
              <div>
                <span className="font-['Space_Grotesk'] text-[24px] font-black text-emerald-600 block mb-2">{step.num}</span>
                <span className="font-['Space_Grotesk'] text-[18px] font-black text-[#111111]/85 block mb-1.5 leading-snug">{step.eng}</span>
                <span className="text-[13px] font-bold text-[#111111]/40 block mb-4 leading-none">{step.kor}</span>
                <p className="text-[11.5px] font-medium text-[#111111]/55 leading-relaxed break-keep">
                  {step.text}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Slide 2: MONEY FLOWS HERE
export const Slide2 = () => {
  const stats = [
    { num: '108', unit: '억 원', period: '연간', label: '전체 시장 거래 규모', eng: 'TANGO MARKET SIZE', sub: '수업 · 밀롱가 · 워크샵 · 공연 · 축제' },
    { num: '32', unit: '억 원', period: '연간', label: 'WoC 처리 거래액', eng: 'PLATFORM GMV', sub: 'WoC를 통해 실제 결제되는 금액' },
    { num: '2.2', unit: '억 원', period: '연간', label: 'WoC 플랫폼 매출', eng: 'WOC REVENUE', sub: '결제 · 정산 · 솔루션 수수료 기반' },
  ];

  return (
    <div className="relative z-10 flex flex-col w-full h-full bg-[#fcf8f8] text-[#111111] px-[80px] py-[40px] justify-center overflow-hidden">
      <div className="max-w-[1300px] w-full mx-auto relative z-10">
        <div className="mb-8">
          <h2 className="font-['Space_Grotesk'] text-[44px] md:text-[56px] font-black tracking-[0.05em] text-[#111111]/90 uppercase block leading-none mb-4 pt1-fu">
            MONEY FLOWS HERE
          </h2>
          <p className="text-[16px] md:text-[18px] font-bold text-[#111111]/45 leading-tight tracking-tight pt1-fu pt1-d2">
            탱고: 고작 2,000명이 만드는 연간 108억 규모의 커뮤니티 활동 경제 (Community Economy)
          </p>
        </div>

        <div className="grid grid-cols-12 gap-8 items-stretch border-t border-b border-[#111111]/10 py-8 pt1-si pt1-d3">
          {/* 좌측: 핵심 금액 지표 카드 (col-span-5) */}
          <div className="col-span-5 flex flex-col justify-center border-r border-[#111111]/10 pr-8 gap-4">
            <span className="text-[10px] font-bold tracking-widest text-[#111111]/40 uppercase block mb-1">
              CORE ECONOMY METRICS (핵심 경제 수치)
            </span>
            <div className="flex flex-col gap-3">
              {stats.map((s, idx) => (
                <div key={s.label} className="border border-[#111111]/10 bg-white/40 p-4 rounded-sm flex flex-col justify-center hover:scale-[1.01] transition-transform duration-200" style={{ animationDelay: `${400 + idx * 100}ms` }}>
                  <div className="flex justify-between items-baseline mb-1">
                    <span className="text-[13px] font-black text-[#111111]">{s.label}</span>
                    <span className="font-['Space_Grotesk'] text-[9px] font-bold text-[#111111]/30 tracking-wider uppercase">{s.eng}</span>
                  </div>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-[9px] font-bold text-[#111111]/40 uppercase tracking-widest mr-1">{s.period}</span>
                    <span className="font-['Space_Grotesk'] text-[24px] md:text-[28px] font-black text-[#111111] leading-none">{s.num}</span>
                    <span className="text-[13px] md:text-[15px] font-bold text-[#111111]/60 ml-0.5">{s.unit}</span>
                  </div>
                  <p className="text-[10.5px] font-medium text-[#111111]/45 mt-1.5 leading-normal break-keep">{s.sub}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 우측: 커뮤니티 거래 구조 비교표 (col-span-7) */}
          <div className="col-span-7 flex flex-col justify-center pl-8">
            <span className="text-[10px] font-bold tracking-widest text-emerald-600 uppercase mb-4 block">
              ECOSYSTEM SCALABILITY (생태계 확장 시뮬레이션)
            </span>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#111111]/10 text-[10px] font-bold text-[#111111]/40 uppercase tracking-wider">
                    <th className="pb-2.5">커뮤니티</th>
                    <th className="pb-2.5 text-right">커뮤니티 규모</th>
                    <th className="pb-2.5 text-center">핵심 운영자</th>
                    <th className="pb-2.5 text-right">주요 거래 구조</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#111111]/5">
                  {[
                    { ko: '탱고', eng: 'TANGO', size: '2,000명', leader: '강사 · DJ · 오거나이저', structure: '수업 · 밀롱가 · 축제' },
                    { ko: '살사', eng: 'SALSA', size: '30,000명', leader: '강사 · 동호회 운영진', structure: '수업 · 파티 · 공연' },
                    { ko: '바차타', eng: 'BACHATA', size: '10,000명', leader: '강사 · 팀 리더', structure: '수업 · 행사 · 워크숍' },
                    { ko: '요가 · 필라테스', eng: 'YOGA & PILATES', size: '300,000+명', leader: '원장 · 강사', structure: '수업 · 예약 · 회원권' },
                  ].map((row, idx) => (
                    <tr key={idx} className="text-[12px] hover:bg-white/20 transition-colors" style={{ animationDelay: `${500 + idx * 80}ms` }}>
                      <td className="py-2.5 font-black text-[#111111] leading-tight">
                        {row.ko}
                        <span className="font-['Space_Grotesk'] text-[8.5px] font-bold text-[#111111]/30 block tracking-wider uppercase mt-0.5">{row.eng}</span>
                      </td>
                      <td className="py-2.5 text-right font-black text-[#111111]/85 font-['Space_Grotesk']">{row.size}</td>
                      <td className="py-2.5 text-center font-bold text-[#111111]/50">{row.leader}</td>
                      <td className="py-2.5 text-right font-black text-emerald-600/80">{row.structure}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* 하단 주석 안내 */}
        <div className="mt-5 flex justify-between items-center text-[11px] font-bold text-[#111111]/35 tracking-tight pt1-fu pt1-d6">
          <p>* 국민 1인당 월 평균 약 45만원은 취미·여가·문화·활동에 사용됩니다 (통계청 기준).</p>
          <p>* WoC는 사교 활동 운영체계(OS)를 통해 이 거대한 경제의 결제 및 정산 인프라를 독점합니다.</p>
        </div>
      </div>
    </div>
  );
};

// Slide 3: THE LAST PLATFORM
export const Slide3 = () => {
  const platforms = [
    { name: '쿠팡', domain: '쇼핑' },
    { name: '배달의민족', domain: '배달' },
    { name: '야놀자', domain: '여행' },
    { name: '토스', domain: '금융' },
    { name: '잡코리아', domain: '구인구직' },
    { name: '당근마켓', domain: '지역 중고거래' }
  ];

  return (
    <div className="relative z-10 flex flex-col w-full h-full bg-[#fcf8f8] text-[#111111] px-[100px] justify-center overflow-hidden">
      <div className="max-w-[1200px] w-full relative z-10">
        <h2 className="font-['Space_Grotesk'] text-[44px] md:text-[56px] font-black tracking-[0.05em] text-[#111111]/90 uppercase block leading-none mb-4 pt1-fu">
          THE LAST PLATFORM
        </h2>
        <p className="text-[16px] md:text-[18px] font-bold text-[#111111]/45 leading-tight tracking-tight mb-12 pt1-fu pt1-d2 break-keep">
          커뮤니티 플랫폼은 1. 깊은 인사이트가 필요하고 2. 운영체제(OS) 형태 여야만 하기 때문에 아직 본격적인 시도가 없었습니다
        </p>

        <div className="grid grid-cols-12 gap-8 items-stretch pt1-si pt1-d4">
          {/* 좌측: 기존 선점 영역 */}
          <div className="col-span-7 grid grid-cols-3 gap-4 border-r border-[#111111]/10 pr-8">
            <div className="col-span-3 text-[11px] font-bold tracking-widest text-[#111111]/45 uppercase mb-2">
              이미 선점된 영역 (기존 거대 플랫폼)
            </div>
            {platforms.map((p) => (
              <div key={p.name} className="border border-[#111111]/10 bg-white/40 p-5 rounded-sm flex flex-col justify-center items-center text-center">
                <span className="text-[16px] font-black text-[#111111]/50 mb-1">{p.name}</span>
                <span className="text-[10px] font-bold text-[#111111]/30 uppercase tracking-widest">{p.domain}</span>
              </div>
            ))}
          </div>

          {/* 우측: 취미 활동 커뮤니티 경제 공간 */}
          <div className="col-span-5 flex flex-col justify-center pl-4">
            <span className="text-[11px] font-bold tracking-widest text-[#111111]/45 uppercase mb-4">
              미개척 영역 (취미·활동·커뮤니티를 위한 OS형 플랫폼)
            </span>
            <div className="border border-dashed border-emerald-600/30 bg-emerald-600/[0.01] p-6 rounded-sm flex flex-col justify-center items-center text-center relative group hover:bg-emerald-600/[0.03] transition-all">
              <span className="text-[18px] font-black text-[#111111]/40 mb-1">커뮤니티 경제 / Community Economy</span>
              <span className="text-xl font-bold text-emerald-600 my-1">➔</span>
              <span className="text-[24px] font-black text-emerald-600 tracking-tight leading-none">WoC OS</span>
              <div className="absolute top-2 right-2 flex items-center justify-center w-5 h-5 rounded-full bg-emerald-50 border border-emerald-100">
                <span className="text-[11px] font-black text-emerald-600">★</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const Slide4 = () => {
  const fragmentedCards = [
    { title: '커뮤니티', sub: '네이버카페 · 네이버밴드 · 페이스북 그룹' },
    { title: '소통', sub: '인스타그램 · 카카오톡 · 디스코드' },
    { title: '교육', sub: '클래스101 · 탈잉' },
    { title: '행사', sub: '온오프믹스 · 이벤터스' },
    { title: '결제', sub: '토스 · PG 시스템' },
  ];

  const osModules = [
    '커뮤니티', '소통', '클래스', '이벤트',
    '결제', '정산', '멤버십', '그룹관리', '글로벌'
  ];

  return (
    <div className="relative z-10 flex flex-col w-full h-full bg-[#fcf8f8] text-[#111111] px-[80px] py-[40px] justify-center overflow-hidden">
      <div className="max-w-[1300px] w-full mx-auto relative z-10">
        <h2 className="font-['Space_Grotesk'] text-[44px] md:text-[56px] font-black tracking-[0.05em] text-[#111111]/90 uppercase block leading-none mb-4 pt1-fu">
          ONE PLATFORM
        </h2>
        <p className="text-[16px] md:text-[18px] font-bold text-[#111111]/45 leading-tight tracking-tight mb-8 pt1-fu pt1-d2">
          사람은 연결되었지만, 활동은 연결되지 않았습니다
        </p>

        <div className="grid grid-cols-12 gap-8 items-stretch border-t border-b border-[#111111]/10 py-8 pt1-si pt1-d3">
          {/* 좌측: 분절된 활동 구조 */}
          <div className="col-span-5 flex flex-col justify-center border-r border-[#111111]/10 pr-8 gap-4">
            <div>
              <span className="text-[11px] font-bold tracking-widest text-red-500/70 uppercase mb-1 block">
                FRAGMENTED SERVICES
              </span>
              <span className="text-[13px] font-bold text-[#111111]/40 block mb-4">
                각각은 존재했지만 연결되어 있지 않았습니다
              </span>
            </div>
            
            <div className="flex flex-col gap-3">
              {fragmentedCards.map((card) => (
                <div 
                  key={card.title} 
                  className="border border-[#111111]/10 bg-white/40 px-4 py-2.5 rounded-sm flex justify-between items-center hover:scale-[1.01] transition-transform duration-200"
                >
                  <span className="text-[14px] font-black text-[#111111]">{card.title}</span>
                  <span className="text-[12px] font-semibold text-[#111111]/45">{card.sub}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 우측: WoC 통합 솔루션 */}
          <div className="col-span-7 flex flex-col justify-center pl-8 relative">
            <span className="text-[11px] font-bold tracking-widest text-emerald-600 uppercase mb-4 block">
              THE WOC OS SOLUTION
            </span>
            
            {/* 원형 통합 구조도 */}
            <div className="relative w-[300px] h-[300px] flex items-center justify-center bg-emerald-600/[0.01] border border-dashed border-emerald-600/15 rounded-full mx-auto">
              <div className="w-[130px] h-[130px] rounded-full border-2 border-emerald-600 bg-white flex flex-col items-center justify-center p-3 text-center shadow-md z-10">
                <span className="font-['Space_Grotesk'] text-[22px] font-black text-[#111111] leading-none mb-1">WoC OS</span>
                <span className="text-[9.5px] font-extrabold text-emerald-600 tracking-tight leading-none mt-1">커뮤니티 OS</span>
              </div>
              
              {/* 9대 모듈 배치 */}
              {osModules.map((mod, idx) => {
                const angle = -90 + (idx * 360) / 9;
                const radius = 110;
                const x = 150 + radius * Math.cos((angle * Math.PI) / 180);
                const y = 150 + radius * Math.sin((angle * Math.PI) / 180);
                return (
                  <div
                    key={mod}
                    style={{
                      left: `${x}px`,
                      top: `${y}px`,
                      transform: 'translate(-50%, -50%)',
                    }}
                    className="absolute px-3.5 py-1.5 border border-emerald-600/20 bg-white rounded-full text-[11px] font-black text-[#111111]/85 shadow-3xs whitespace-nowrap tracking-tight"
                  >
                    {mod}
                  </div>
                );
              })}
            </div>

            {/* 우측 핵심 카피 */}
            <div className="mt-6 text-center">
              <span className="font-['Space_Grotesk'] text-[11px] font-black tracking-widest text-emerald-600 uppercase block mb-1">
                Everything Connected.
              </span>
              <span className="text-[16px] font-black text-[#111111] tracking-tight">
                모든 활동이 하나의 시스템으로 연결됩니다.
              </span>
            </div>
          </div>
        </div>

        {/* 하단 결론 및 요약 문장 */}
        <div className="mt-8 border-t border-[#111111]/10 pt-5 grid grid-cols-2 gap-8 text-[12.5px] font-semibold text-[#111111]/60 leading-relaxed max-w-[1100px] mx-auto pt1-fu pt1-d6">
          <div className="text-right border-r border-[#111111]/10 pr-8">
            기존 서비스는 소통, 교육, 행사, 결제를 <span className="text-red-500/80 font-bold">각각 해결했습니다.</span>
          </div>
          <div className="text-left pl-8">
            WoC는 사람의 활동이 시작되고 끝나는 전 과정을 <span className="text-emerald-600 font-black">하나의 운영체계 안에서 연결합니다.</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Slide 6: LIFE GOES ON_
export const Slide6 = () => {
  const categories = [
    { title: '무대', eng: 'STAGE', items: ['탱고', '살사', '바차타', '플라멩코', '발레'] },
    { title: '야외', eng: 'ROAD', items: ['러닝', '자전거', '캠핑', '트레킹', '클라이밍'] },
    { title: '창작', eng: 'TABLE', items: ['커피', '요리', '베이킹', '도예', '목공'] },
    { title: '예술', eng: 'MUSE', items: ['K-Pop', '영화', '애니메이션', '문학', '바이닐'] },
    { title: '일상', eng: 'MIND', items: ['영어', '일본어', '글쓰기', '인테리어', '식물'] },
  ];

  return (
    <div 
      className="relative z-10 flex flex-col w-full h-full text-[#111111] px-[80px] justify-center overflow-hidden bg-cover bg-center"
      style={{ backgroundImage: "url('/lifegoeson_v3.jpg')" }}
    >
      {/* 배경 이미지의 가독성을 위한 은은한 흰색 마스크 레이어 */}
      <div className="absolute inset-0 bg-white/70 z-0" />

      <div className="max-w-[1300px] w-full mx-auto relative z-10">
        <h2 className="font-['Space_Grotesk'] text-[44px] md:text-[56px] font-black tracking-[0.05em] text-[#111111]/90 uppercase block leading-none mb-4 pt1-fu">
          LIFE GOES ON_
        </h2>
        <p className="text-[16px] md:text-[18px] font-bold text-[#111111]/45 leading-tight tracking-tight mb-8 pt1-fu pt1-d2">
          사람들은 하나의 취미만 하지 않습니다 (Ecosystem Network Effect)
        </p>

        <div className="grid grid-cols-5 gap-6 pt1-si pt1-d4">
          {categories.map((cat, idx) => (
            <div key={cat.title} className="flex flex-col border border-[#111111]/10 bg-white/80 p-5 pt1-fi shadow-2xs backdrop-blur-2xs" style={{ animationDelay: `${400 + idx * 80}ms` }}>
              <span className="text-[17px] font-black tracking-tight text-[#111111] border-b border-[#111111]/10 pb-2 mb-4 block leading-tight">
                {cat.title}
                <span className="font-['Space_Grotesk'] text-[10px] font-bold tracking-wider text-[#111111]/30 uppercase block mt-0.5">{cat.eng}</span>
              </span>
              <ul className="flex flex-col gap-2.5">
                {cat.items.map((item) => (
                  <li key={item} className="text-[13.5px] font-bold text-[#111111]/60 tracking-tight flex items-center gap-2">
                    <span className="w-1 h-1 bg-[#111111]/25 rounded-full shrink-0"></span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-8 pt-5 border-t border-[#111111]/10 pt1-si pt1-d6">
          <span className="text-[11.5px] font-black tracking-tight text-[#111111]/60 block mb-4">
            생태계 확장 파이프라인
            <span className="font-['Space_Grotesk'] text-[9.5px] font-bold tracking-widest text-[#111111]/30 uppercase ml-2">ECOSYSTEM PIPELINE</span>
          </span>
          <div className="flex items-center justify-between max-w-[850px] text-[14px] md:text-[15px] font-black text-[#111111]">
            <div className="flex items-center justify-center px-4 py-2 border border-[#111111]/20 bg-white/80 text-[#111111]/70">WoC 코어</div>
            <span className="text-[#111111]/30 font-light">➔</span>
            <div className="flex items-center justify-center px-4 py-2 border border-[#111111]/20 bg-white/80 text-[#111111]/70">5대 핵심 테마 (무대 · 야외 · 창작 · 예술 · 일상)</div>
            <span className="text-[#111111]/30 font-light">➔</span>
            <div className="flex items-center justify-center px-4 py-2 border border-[#111111]/20 bg-white/80 text-[#111111]/70">수백 개의 활동</div>
            <span className="text-[#111111]/30 font-light">➔</span>
            <div className="flex items-center justify-center px-4.5 py-2 border border-[#111111] bg-[#111111] text-[#fcf8f8]">수천 개의 커뮤니티</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Slide 7: FRAGMENTED WORLD
export const Slide7 = () => {
  const legacyItems = [
    { cat: '커뮤니티', list: '네이버카페 · 밴드 · 페이스북 그룹' },
    { cat: '교육', list: '학원 · 클래스 플랫폼' },
    { cat: '행사', list: '모임 플랫폼 · 행사 플랫폼' },
    { cat: '상점', list: '쇼핑몰 · 예약 시스템' },
    { cat: '운영', list: '엑셀 · 문자 · 카카오톡' },
  ];

  const problem2Cities = ['서울', '부산', '도쿄', '뉴욕', '파리', '부에노스아이레스'];

  const wocFeatures = [
    '커뮤니케이션', '클래스', '이벤트', '장소',
    '마켓', '멤버십', '회원관리', '그룹운영'
  ];

  const networkCities = [
    { name: '서울', x: 425, y: 250 },
    { name: '부산', x: 370, y: 370 },
    { name: '도쿄', x: 250, y: 425 },
    { name: '뉴욕', x: 130, y: 370 },
    { name: '런던', x: 75, y: 250 },
    { name: '파리', x: 130, y: 130 },
    { name: '부에노스아이레스', x: 250, y: 75 },
    { name: '싱가포르', x: 370, y: 130 },
  ];

  return (
    <div className="relative z-10 flex flex-col items-center justify-center w-full h-full px-[80px] bg-[#fcf8f8] overflow-hidden">
      <div className="max-w-[1300px] w-full mb-10 pt1-fu">
        <h2 className="font-['Space_Grotesk'] text-[44px] md:text-[56px] font-black tracking-[0.05em] text-[#111111]/90 uppercase block leading-none mb-4">
          BROKEN EXPERIENCE
        </h2>
        <p className="text-[16px] md:text-[18px] font-bold text-[#111111]/45 leading-tight tracking-tight pt1-fu pt1-d2">
          취미를 위해 너무나 많은 App들을 떠돌아야합니다
        </p>
      </div>

      <div className="grid grid-cols-12 gap-10 w-full max-w-[1300px] items-stretch">
        <div className="col-span-5 flex flex-col justify-center gap-8 border-r border-[#111111]/10 pr-10 pt1-sl pt1-d3">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold tracking-widest text-red-500/70 uppercase">Problem 01</span>
              <span className="w-1.5 h-1.5 rounded-full bg-red-500/40"></span>
            </div>
            <h3 className="text-[18px] md:text-[22px] font-black text-[#111111] tracking-tight leading-tight">
              파편화된 운영
            </h3>
            <div className="flex flex-col gap-2 mt-2">
              {legacyItems.map((item) => (
                <div key={item.cat} className="flex items-baseline gap-3 text-[13px] md:text-[14.5px]">
                  <span className="w-16 shrink-0 font-black text-[#111111]/70 border-r border-[#111111]/15 pr-2.5 text-right">
                    {item.cat}
                  </span>
                  <span className="font-semibold text-[#111111]/55 tracking-tight">
                    {item.list}
                  </span>
                </div>
              ))}
            </div>
            <p className="text-[12px] font-bold text-red-500/70 tracking-tight leading-tight mt-1">
              * 각 기능은 존재하지만 서로 유기적으로 연결되어 있지 않습니다.
            </p>
          </div>

          <div className="flex flex-col gap-3 pt-6 border-t border-[#111111]/5">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold tracking-widest text-red-500/70 uppercase">Problem 02</span>
              <span className="w-1.5 h-1.5 rounded-full bg-red-500/40"></span>
            </div>
            <h3 className="text-[18px] md:text-[22px] font-black text-[#111111] tracking-tight leading-tight">
              지역에 갇힌 커뮤니티
            </h3>
            <div className="flex flex-wrap gap-2 mt-1">
              {problem2Cities.map((city) => (
                <span key={city} className="px-2.5 py-1 border border-red-500/10 bg-red-500/[0.02] rounded-full text-[12.5px] font-semibold text-red-500/50">
                  {city}
                </span>
              ))}
            </div>
            <p className="text-[12.5px] font-medium text-[#111111]/60 leading-tight">
              각 지역 커뮤니티가 독립적으로 운영됩니다.
            </p>
            <p className="text-[12px] font-bold text-red-500/70 tracking-tight leading-tight mt-1">
              * 사람도 정보도 행사도 지역 단위로 단절되어 있습니다.
            </p>
          </div>
        </div>

        <div className="col-span-7 flex flex-col items-center justify-center pl-10 relative pt1-sr pt1-d4 z-0">
          <span className="text-[11px] font-bold tracking-widest text-[#111111]/45 uppercase mb-4 block self-start">
            WoC Solution / Global Network Infrastructure
          </span>
          <div className="w-[500px] h-[500px] relative flex items-center justify-center bg-white/10 rounded-full border border-[#111111]/5 shadow-[inset_0_0_30px_rgba(0,0,0,0.01)] scale-[0.8] 2xl:scale-95 origin-center">
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" viewBox="0 0 500 500">
              {networkCities.map((city) => (
                <line
                  key={city.name}
                  x1={250}
                  y1={250}
                  x2={city.x}
                  y2={city.y}
                  stroke="#111111"
                  strokeWidth="0.75"
                  strokeDasharray="4 4"
                  opacity="0.3"
                  className="animate-pulse"
                />
              ))}
            </svg>

            <div className="w-[210px] h-[210px] rounded-full border-[2.5px] border-[#111111] bg-white flex flex-col items-center justify-center p-5 shadow-[0_15px_45px_rgba(0,0,0,0.06)] z-10 text-center relative group hover:scale-[1.02] transition-transform duration-300">
              <h4 className="text-[30px] font-black tracking-tighter text-[#111111] mb-1 leading-none">
                WoC
              </h4>
              <div className="w-10 h-[1.5px] bg-[#111111] mb-2.5" />
              <p className="text-[10.5px] font-bold leading-[1.4] text-[#111111]/70 tracking-tight break-keep max-w-[160px]">
                {wocFeatures.join(' · ')}
              </p>
            </div>

            {networkCities.map((city, idx) => (
              <div
                key={city.name}
                style={{
                  left: `${city.x}px`,
                  top: `${city.y}px`,
                  transform: 'translate(-50%, -50%)',
                  animationDelay: `${600 + idx * 80}ms`
                }}
                className="absolute px-3 py-1.5 rounded-full border border-[#111111]/15 bg-white text-[12.5px] font-black text-[#111111] shadow-sm z-20 hover:border-[#111111] hover:shadow-md transition-all duration-200 cursor-default flex items-center gap-1.5 pt1-fi"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                {city.name}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Slide 8: THE FIRST SOCIETY
export const Slide8 = () => {
  const progressItems = [
    { step: '01', text: '현재 2,000명 중 300명 (약 15%) 회원 확보 완료' },
    { step: '02', text: '앱 출시(Android/iOS) 및 프로모션을 통해 3Q 내 100% 달성 가능' },
    { step: '03', text: '신용카드 및 해외 결제 시스템 도입 완료 (3Q ~ 4Q)' },
    { step: '04', text: '아시아 및 글로벌 참여자 확장 ➔ 완전체 탱고월드 App 완성 (4Q)' },
  ];

  return (
    <div className="relative z-10 flex flex-col w-full h-full bg-[#fcf8f8] text-[#111111] px-[100px] justify-center overflow-hidden">
      <div className="max-w-[1200px] w-full relative z-10">
        <h2 className="font-['Space_Grotesk'] text-[44px] md:text-[56px] font-black tracking-[0.05em] text-[#111111]/90 uppercase block leading-none mb-4 pt1-fu">
          THE FIRST SOCIETY
        </h2>
        <p className="text-[16px] md:text-[18px] font-bold text-[#111111]/45 leading-tight tracking-tight mb-12 pt1-fu pt1-d2">
          작은 커뮤니티에서 먼저 증명합니다
        </p>

        <div className="grid grid-cols-12 gap-10 items-stretch border-t border-b border-[#111111]/10 py-8">
          <div className="col-span-5 flex flex-col justify-center pt1-sl pt1-d3">
            <span className="font-['Space_Grotesk'] text-[18px] font-black text-emerald-600 mb-2">2026 3Q</span>
            <span className="text-[72px] font-black text-[#111111] leading-none tracking-tighter mb-4">Tango</span>
            <span className="text-[24px] font-bold text-[#111111]/60 tracking-tight">2,000 Members</span>
          </div>

          <div className="col-span-7 flex flex-col justify-center pl-10 border-l border-[#111111]/10 pt1-sr pt1-d4">
            <div className="mb-4">
              <span className="text-[11px] font-bold tracking-widest text-emerald-600 uppercase mb-1 block">
                CURRENT PROGRESS
              </span>
              <span className="text-[13px] font-bold text-[#111111]/40 block">
                실질적인 현재 진행 상황 및 마일스톤
              </span>
            </div>
            
            <div className="flex flex-col gap-3">
              {progressItems.map((item) => (
                <div key={item.step} className="flex items-center gap-4 bg-white border border-[#111111]/10 p-3.5 rounded-sm hover:scale-[1.01] transition-transform duration-200 shadow-3xs">
                  <span className="font-['Space_Grotesk'] text-[15px] font-black text-emerald-600 shrink-0">
                    {item.step}
                  </span>
                  <span className="text-[13.5px] font-black text-[#111111]/85 tracking-tight break-keep">
                    {item.text}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-between items-center pt1-fu pt1-d6">
          <p className="text-[12.5px] font-semibold text-[#111111]/45 tracking-tight">
            * 시장 확장 목적이 아닌, 운영체계(OS) 모델의 무결한 작동을 검증했습니다.
          </p>
          <span className="font-['Space_Grotesk'] text-[12px] font-black tracking-[0.2em] text-emerald-600 uppercase">
            Community OS Validation
          </span>
        </div>
      </div>
    </div>
  );
};

// Slide 9 (Slide P-1): COMMUNITY OS VALIDATION
export const Slide09 = () => {
  const osItems = [
    { name: 'Community', x: 250, y: 70 },
    { name: 'Class', x: 370, y: 120 },
    { name: 'Event', x: 420, y: 250 },
    { name: 'Payment', x: 370, y: 370 },
    { name: 'Settlement', x: 250, y: 420 },
    { name: 'Global Visitors', x: 130, y: 370 },
    { name: 'Global Reservation', x: 80, y: 250 },
    { name: 'Global Communication', x: 130, y: 120 },
  ];

  return (
    <div className="relative z-10 flex flex-col w-full h-full bg-[#fcf8f8] text-[#111111] px-[100px] justify-center overflow-hidden">
      <div className="max-w-[1200px] w-full relative z-10 flex flex-col justify-center">
        <div className="flex justify-between items-baseline mb-4">
          <div>
            <h2 className="font-['Space_Grotesk'] text-[44px] md:text-[56px] font-black tracking-[0.05em] text-[#111111]/90 uppercase block leading-none pt1-fu">
              COMMUNITY OS VALIDATION
            </h2>
            <p className="text-[16px] md:text-[18px] font-bold text-[#111111]/45 leading-tight tracking-tight mt-3 pt1-fu pt1-d2">
              작은 커뮤니티에서 운영체계를 검증합니다
            </p>
          </div>
          <span className="font-['Space_Grotesk'] text-[36px] font-black text-emerald-600 pt1-fu">2026</span>
        </div>

        <div className="grid grid-cols-12 gap-8 items-center border-t border-b border-[#111111]/10 py-8">
          <div className="col-span-7 flex justify-center items-center relative h-[360px] pt1-si pt1-d3">
            <div className="w-[300px] h-[300px] relative flex items-center justify-center bg-white/20 rounded-full border border-emerald-600/15">
              <div className="w-[140px] h-[140px] rounded-full border-2 border-emerald-600 bg-white flex flex-col items-center justify-center p-3 text-center shadow-md">
                <span className="text-[20px] font-black text-[#111111] leading-none mb-1">TANGO</span>
                <span className="text-[10px] font-bold text-[#111111]/40 uppercase tracking-wider">2K Members</span>
              </div>
              
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" viewBox="0 0 500 500">
                {osItems.map(item => (
                  <line key={item.name} x1={250} y1={250} x2={item.x} y2={item.y} stroke="#059669" strokeWidth="1" opacity="0.4" />
                ))}
              </svg>

              {osItems.map(item => (
                <div
                  key={item.name}
                  style={{ left: `${item.x}px`, top: `${item.y}px`, transform: 'translate(-50%, -50%)' }}
                  className="absolute px-3 py-1.5 rounded-md border border-[#111111]/10 bg-white text-[12px] font-black text-[#111111]/70 shadow-3xs"
                >
                  {item.name}
                </div>
              ))}
            </div>
          </div>

          <div className="col-span-5 flex flex-col justify-center pl-8 border-l border-[#111111]/10 pt1-sr pt1-d4">
            <span className="text-[10px] font-bold tracking-widest text-[#111111]/45 uppercase mb-4 block">INVESTOR INSIGHT</span>
            <p className="text-[18px] font-black text-[#111111] leading-snug mb-4 break-keep">
              우리는 탱고 플랫폼을 만드는 것이 아닙니다.<br/>
              사람들의 활동을 운영하는 Community OS를 검증하고 있습니다.
            </p>
            <div className="w-10 h-[1.5px] bg-[#111111]/25 mb-4" />
            <p className="text-[13.5px] text-[#111111]/50 leading-relaxed break-keep">
              검증 완료된 8가지 코어 인프라 모듈은 다른 카테고리의 어떤 오프라인 소사이어티에도 즉시 이식 가능하도록 정규화 설계되었습니다.
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-between items-center pt1-fu pt1-d6">
          <p className="text-[14px] font-black text-emerald-600 tracking-tight">
            탱고는 시장이 아니라 실험실입니다.
          </p>
          <span className="font-['Space_Grotesk'] text-[11px] font-bold tracking-widest text-[#111111]/30 uppercase">
            OPERATING SYSTEM EVOLUTION
          </span>
        </div>
      </div>
    </div>
  );
};
export { Slide09 as Slide9 };

// Slide 10 (Slide P-2): NETWORK EXPANSION
export const Slide10 = () => (
  <div className="relative z-10 flex flex-col w-full h-full bg-[#fcf8f8] text-[#111111] px-[100px] justify-center overflow-hidden">
    <div className="max-w-[1200px] w-full relative z-10 flex flex-col justify-center">
      <div className="flex justify-between items-baseline mb-4">
        <div>
          <h2 className="font-['Space_Grotesk'] text-[44px] md:text-[56px] font-black tracking-[0.05em] text-[#111111]/90 uppercase block leading-none pt1-fu">
            NETWORK EXPANSION
          </h2>
          <p className="text-[16px] md:text-[18px] font-bold text-[#111111]/45 leading-tight tracking-tight mt-3 pt1-fu pt1-d2">
            검증된 운영체계를 다른 커뮤니티에 복제합니다
          </p>
        </div>
        <span className="font-['Space_Grotesk'] text-[36px] font-black text-emerald-600 pt1-fu">2026 4Q</span>
      </div>

      <div className="grid grid-cols-12 gap-8 items-stretch border-t border-b border-[#111111]/10 py-10">
        {/* 좌측: 리더 네트워크 특징 */}
        <div className="col-span-4 flex flex-col justify-between pr-8 border-r border-[#111111]/10 pt1-sl pt1-d3">
          <div className="border border-[#111111]/10 bg-white/40 p-5 rounded-sm">
            <span className="text-[10px] font-black text-red-500 uppercase tracking-widest block mb-1">Users</span>
            <span className="text-[16px] font-black text-[#111111] block mb-2">Users are different</span>
            <p className="text-[12.5px] text-[#111111]/50 leading-relaxed">각 커뮤니티의 일반 사용자 성향과 취향은 각기 다릅니다.</p>
          </div>

          <div className="border border-emerald-600/20 bg-emerald-600/[0.01] p-5 rounded-sm">
            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest block mb-1">Leaders</span>
            <span className="text-[16px] font-black text-emerald-600 block mb-2">Leaders are connected</span>
            <p className="text-[12.5px] text-[#111111]/50 leading-relaxed">하지만 커뮤니티를 이끄는 리더 조직은 긴밀히 연결되어 교류합니다.</p>
          </div>
        </div>

        {/* 중앙: 복제 플로우 다이어그램 */}
        <div className="col-span-8 flex flex-col justify-center pl-8 pt1-sr pt1-d4">
          <span className="text-[10px] font-bold tracking-widest text-[#111111]/45 uppercase mb-6 block text-center">REPLICATION MECHANISM</span>
          
          <div className="grid grid-cols-4 gap-4 items-center mb-8 relative">
            <div className="relative z-10 border border-[#111111]/10 bg-white p-4 rounded-sm text-center shadow-3xs">
              <span className="text-[11px] text-[#111111]/40 block mb-1">Step 01</span>
              <span className="text-[14px] font-black text-[#111111]">Leader Network</span>
            </div>
            <div className="relative z-10 border border-emerald-600 bg-[#f0fdf4] p-4 rounded-sm text-center shadow-3xs">
              <span className="text-[11px] text-emerald-600/50 block mb-1">Step 02</span>
              <span className="text-[14px] font-black text-emerald-600">WoC OS</span>
            </div>
            <div className="relative z-10 border border-[#111111]/10 bg-white p-4 rounded-sm text-center shadow-3xs">
              <span className="text-[11px] text-[#111111]/40 block mb-1">Step 03</span>
              <span className="text-[14px] font-black text-[#111111]">Community Org</span>
            </div>
            <div className="relative z-10 border border-emerald-600/20 bg-white p-4 rounded-sm text-center shadow-3xs">
              <span className="text-[11px] text-[#111111]/40 block mb-1">Step 04</span>
              <span className="text-[14px] font-black text-emerald-600">Replication</span>
            </div>
            <div className="absolute top-1/2 left-0 right-0 h-[1.5px] bg-[#111111]/10 -translate-y-1/2 z-0" />
          </div>

          <div className="flex justify-center items-center gap-6 border border-emerald-600/10 bg-emerald-600/[0.01] p-4 rounded-sm">
            <div className="text-center px-4">
              <span className="text-[18px] font-black text-[#111111]">TANGO</span>
              <span className="text-[11px] text-[#111111]/40 block">기반 OS 검증</span>
            </div>
            <span className="text-emerald-600 font-black">➔</span>
            <div className="text-center px-4">
              <span className="text-[18px] font-black text-emerald-600">SALSA</span>
              <span className="text-[11px] text-emerald-600/50 block">리더망 이식 1단계</span>
            </div>
            <span className="text-emerald-600 font-black">➔</span>
            <div className="text-center px-4">
              <span className="text-[18px] font-black text-emerald-600">BACHATA</span>
              <span className="text-[11px] text-emerald-600/50 block">리더망 이식 2단계</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-between items-center pt1-fu pt1-d6">
        <div className="flex flex-col gap-1">
          <p className="text-[15px] font-black text-[#111111] tracking-tight font-['Space_Grotesk']">
            Users are different. Leaders are connected. <span className="text-emerald-600 font-extrabold">Operating Systems are reusable.</span>
          </p>
          <p className="text-[13px] font-bold text-[#111111]/50 leading-none">
            우리는 사용자를 확보하는 것이 아니라 리더를 확보합니다.
          </p>
        </div>
        <p className="text-[12.5px] text-[#111111]/45 leading-none italic">
          * 다른 소사이어티에서도 완벽한 재현 가능성을 검증합니다.
        </p>
      </div>
    </div>
  </div>
);

// Slide 11 (Slide P-3): MASS MARKET VALIDATION
export const Slide11 = () => (
  <div className="relative z-10 flex flex-col w-full h-full bg-[#fcf8f8] text-[#111111] px-[100px] justify-center overflow-hidden">
    <div className="max-w-[1200px] w-full relative z-10 flex flex-col justify-center">
      <div className="flex justify-between items-baseline mb-4">
        <div>
          <h2 className="font-['Space_Grotesk'] text-[44px] md:text-[56px] font-black tracking-[0.05em] text-[#111111]/90 uppercase block leading-none pt1-fu">
            MASS MARKET VALIDATION
          </h2>
          <p className="text-[16px] md:text-[18px] font-bold text-[#111111]/45 leading-tight tracking-tight mt-3 pt1-fu pt1-d2">
            더 큰 시장에서 새로운 워크플로를 검증합니다
          </p>
        </div>
        <span className="font-['Space_Grotesk'] text-[36px] font-black text-emerald-600 pt1-fu">2027 H1</span>
      </div>

      <div className="grid grid-cols-12 gap-8 items-stretch border-t border-b border-[#111111]/10 py-10">
        {/* 좌측: 기존 댄스 커뮤니티 워크플로 */}
        <div className="col-span-5 flex flex-col justify-center pr-8 border-r border-[#111111]/10 pt1-sl pt1-d3">
          <span className="text-[10px] font-bold tracking-widest text-[#111111]/45 uppercase mb-3 block">COMMUNITY WORKFLOW</span>
          <div className="bg-[#111111]/[0.01] border border-[#111111]/5 p-6 rounded-sm text-center">
            <div className="flex justify-center items-center gap-3 mb-2">
              <span className="text-[20px] font-black text-[#111111]">탱고</span>
              <span className="text-emerald-600 text-[18px] font-black">➔</span>
              <span className="text-[20px] font-black text-[#111111]">살사</span>
              <span className="text-emerald-600 text-[18px] font-black">➔</span>
              <span className="text-[20px] font-black text-[#111111]">바차타</span>
            </div>
            <p className="text-[12.5px] text-[#111111]/45 mt-3 leading-relaxed">
              기본적인 모임 생성, 소셜 결제, 파티 기획, 친목 교류 위주의 수평적인 모임 구조
            </p>
          </div>
        </div>

        {/* 중앙: 복제 및 진화 화살표 */}
        <div className="col-span-2 flex flex-col justify-center items-center pt1-fi pt1-d4 text-emerald-600 font-bold text-center">
          <span className="text-[11px] uppercase tracking-wider block mb-1">Scale Up</span>
          <span className="text-[28px] font-black leading-none mb-1">➔</span>
          <span className="text-[14px] font-black text-emerald-600 block mb-1.5 break-keep">웰니스의 유사도 90%</span>
          <span className="text-[10px] uppercase tracking-widest text-[#111111]/40 block">Complexity</span>
        </div>

        {/* 우측: 더 큰 매스마켓 (학원/교육 웰니스 시장) */}
        <div className="col-span-5 flex flex-col justify-center pl-8 pt1-sr pt1-d3">
          <span className="text-[10px] font-bold tracking-widest text-[#111111]/45 uppercase mb-3 block">ACADEMY WORKFLOW (YOGA / PILATES)</span>
          <div className="border border-emerald-600/20 bg-emerald-600/[0.01] p-6 rounded-sm text-center">
            <div className="flex justify-center items-center gap-3 mb-2">
              <span className="text-[20px] font-black text-[#111111]">요가</span>
              <span className="text-[#111111]/30 text-[18px] font-black">/</span>
              <span className="text-[20px] font-black text-[#111111]">필라테스</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-[12.5px] text-[#111111]/85 font-black text-center mb-4 mt-3">
              <span className="px-2 py-1 bg-white border border-[#111111]/10 rounded-sm">강사</span>
              <span className="px-2 py-1 bg-white border border-[#111111]/10 rounded-sm">학원</span>
              <span className="px-2 py-1 bg-white border border-[#111111]/10 rounded-sm">수강생</span>
              <span className="px-2 py-1 bg-white border border-[#111111]/10 rounded-sm">결제</span>
              <span className="px-2 py-1 bg-white border border-[#111111]/10 rounded-sm">회원관리</span>
              <span className="px-2 py-1 bg-white border border-[#111111]/10 rounded-sm">재등록</span>
            </div>
            <p className="text-[12.5px] text-[#111111]/50 leading-relaxed text-left">
              웰니스 전문 학원 및 프랜차이즈 관리 체계를 포괄하는 복잡도가 향상된 구조
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-between items-center pt1-fu pt1-d6">
        <p className="text-[14px] font-black text-emerald-600 tracking-tight">
          운영체계가 커뮤니티를 넘어 교육시장으로 확장됩니다.
        </p>
        <p className="text-[12.5px] text-[#111111]/45">
          * 이 단계에서 WoC는 단순 사교 모임 툴이 아닌 실질적인 인프라/SaaS 솔루션으로 진화합니다.
        </p>
      </div>
    </div>
  </div>
);

// Slide 12: THE NEXT 60 SOCIETIES
export const Slide12 = () => {
  const societies = [
    'Yoga', 'Running', 'Cycling', 'Salsa', 'Whisky', 'Musicals', 
    'Coffee', 'Camping', 'Language', 'Travel', 'Dance', 'Hiking'
  ];

  return (
    <div className="relative z-10 flex flex-col w-full h-full bg-[#fcf8f8] text-[#111111] px-[100px] justify-center overflow-hidden">
      <div className="max-w-[1200px] w-full relative z-10">
        <div className="flex justify-between items-baseline mb-4">
          <div>
            <h2 className="font-['Space_Grotesk'] text-[44px] md:text-[56px] font-black tracking-[0.05em] text-[#111111]/90 uppercase block leading-none pt1-fu">
              THE NEXT 60 SOCIETIES
            </h2>
            <p className="text-[16px] md:text-[18px] font-bold text-[#111111]/45 leading-tight tracking-tight mt-3 pt1-fu pt1-d2">
              검증된 운영체계는 계속 복제됩니다
            </p>
          </div>
          <div className="text-right pt1-fu">
            <span className="font-['Space_Grotesk'] text-[12px] font-black text-emerald-600 block mb-1">2027-2028</span>
            <span className="font-['Space_Grotesk'] text-[24px] font-black text-[#111111] leading-none uppercase tracking-widest">EDUCATION OS</span>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-8 items-center border-t border-b border-[#111111]/10 py-10">
          <div className="col-span-5 flex flex-col justify-center items-center text-center pt1-sl pt1-d3">
            <span className="text-[11px] font-black text-[#111111]/45 tracking-widest uppercase mb-2">CENTRAL OS CORE</span>
            <div className="w-[180px] h-[180px] rounded-full border-4 border-emerald-600 bg-white flex flex-col items-center justify-center p-4 shadow-md">
              <span className="text-[32px] font-black tracking-tight text-[#111111]">WoC</span>
              <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest">Ecosystem</span>
            </div>
          </div>

          <div className="col-span-7 flex flex-wrap gap-2.5 pl-10 border-l border-[#111111]/10 justify-start items-center pt1-sr pt1-d4">
            {societies.map((item, idx) => (
              <span 
                key={item} 
                className="px-4 py-2.5 border border-[#111111]/10 bg-white rounded-sm text-[14px] font-black text-[#111111]/60 tracking-tight hover:border-emerald-600 transition-colors"
                style={{ animationDelay: `${500 + idx * 60}ms` }}
              >
                {item}
              </span>
            ))}
            <span className="px-4 py-2.5 border border-dashed border-[#111111]/15 bg-white/20 rounded-sm text-[14px] font-black text-[#111111]/30 tracking-tight">외 60+ 소사이어티</span>
          </div>
        </div>

        <div className="mt-8 flex justify-between items-center pt1-fu pt1-d7">
          <p className="text-[15px] font-black text-emerald-600 leading-none">
            새로운 플랫폼을 만드는 것이 아니라 검증된 운영체계를 복제합니다.
          </p>
          <span className="font-['Space_Grotesk'] text-[11px] font-black tracking-wider text-[#111111]/30 uppercase">
            Universal Society OS Completed
          </span>
        </div>
      </div>
    </div>
  );
};

// Slide Promotion Benefit: PROMOTION BENEFIT
export const SlidePromotionBenefit = () => (
  <div className="relative z-10 flex flex-col w-full h-full bg-[#fcf8f8] text-[#111111] px-[80px] py-[40px] justify-center overflow-hidden">
    <div className="max-w-[1300px] w-full mx-auto">
      <div className="mb-6">
        <h2 className="font-['Space_Grotesk'] text-[44px] md:text-[56px] font-black tracking-[0.05em] text-[#111111]/90 uppercase block leading-none mb-4 pt1-fu">
          PROMOTION BENEFIT
        </h2>
        <p className="text-[16px] md:text-[18px] font-bold text-[#111111]/45 leading-tight tracking-tight pt1-fu pt1-d2 break-keep">
          광고비 없이 허브를 통해 사용자를 수직적으로 확보(Vertical)하고, 검증된 사용자 경험을 바탕으로 이종 활동 커뮤니티로 장벽 없이 수평적 이주(Horizontal)를 유도합니다.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-10 border-t border-b border-[#111111]/10 py-8">
        <div className="flex flex-col h-full pt1-sl pt1-d4 border-r border-[#111111]/10 pr-10">
          <div className="flex items-baseline gap-4 mb-4">
            <span className="text-[14px] font-bold tracking-widest text-[#111111]/30">01</span>
            <h3 className="text-[26px] font-black tracking-tight text-[#111111]">수직적 온보딩 (Vertical Onboarding)</h3>
          </div>
          <p className="text-[14.5px] leading-[1.6] text-[#111111]/60 mb-6 break-keep font-semibold">
            강사(Instructor) 및 소셜 댄스 동호회 운영진(Organizer) 등 핵심 운영 주체를 허브 노드로 우선 락인합니다. 클래스 개설, 실시간 예약, 정산 툴을 지원하여 이들에게 종속된 수많은 활동 회원을 자연스럽게 동시 온보딩합니다.
          </p>
          <div className="flex items-center gap-8 mt-auto">
            <div className="flex items-center gap-2">
              <div className="text-[32px] font-[900] tracking-tighter text-[#111111]">1:50</div>
              <div className="text-[10px] font-bold tracking-wider text-[#111111]/40 uppercase leading-none">
                Instructor<br/>Students
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-[32px] font-[900] tracking-tighter text-[#111111]">1:100</div>
              <div className="text-[10px] font-bold tracking-wider text-[#111111]/40 uppercase leading-none">
                Organizer<br/>Participants
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col h-full pt1-sr pt1-d4 pl-10">
          <div className="flex items-baseline gap-4 mb-4">
            <span className="text-[14px] font-bold tracking-widest text-emerald-600/70">02</span>
            <h3 className="text-[26px] font-black tracking-tight text-[#111111]">수평적 이주 (Horizontal Migration)</h3>
          </div>
          <p className="text-[14.5px] leading-[1.6] text-[#111111]/60 mb-6 break-keep font-semibold">
            살사 소사이어티(Salsa Society) 등 플랫폼 내 특정 커뮤니티에서 결제와 소셜 기능의 신뢰를 겪은 사용자들이 플랫폼 장벽 없이 요가 강습, 캠핑 소모임, 자전거 라이딩 등 이종 영역으로 스스로 이주하여 참여 범위를 수평 확장합니다.
          </p>
          <div className="flex items-center gap-6 mt-auto">
            <div className="px-3.5 py-1.5 bg-[#111111] text-white text-[12.5px] font-black tracking-wider uppercase rounded-sm">
              Salsa Society User
            </div>
            <span className="text-[#111111]/30 font-bold">➔</span>
            <div className="flex gap-2">
              <span className="px-2.5 py-1 border border-emerald-600/20 bg-emerald-600/[0.02] text-emerald-600 rounded-full text-[11px] font-bold">요가 (Yoga)</span>
              <span className="px-2.5 py-1 border border-emerald-600/20 bg-emerald-600/[0.02] text-emerald-600 rounded-full text-[11px] font-bold">캠핑 (Camping)</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 pt-2 flex flex-col md:flex-row items-center justify-between gap-4 text-[13px] font-bold pt1-si pt1-d8">
        <div className="flex items-center gap-3">
          <span className="px-2 py-0.5 bg-[#111111]/5 border border-[#111111]/15 text-[#111111]/60 text-[10px] uppercase tracking-wider rounded-sm">Vertical Flow</span>
          <span className="text-[#111111]/70">허브(강사/오거나이저) ➔ 일반 회원 수직 락인</span>
        </div>
        <div className="hidden md:block text-[#111111]/25">|</div>
        <div className="flex items-center gap-3">
          <span className="px-2 py-0.5 bg-emerald-600/10 border border-emerald-600/20 text-emerald-600 text-[10px] uppercase tracking-wider rounded-sm">Horizontal Flow</span>
          <span className="text-[#111111]/70">살사 소사이어티 ➔ 요가 · 캠핑 등 플랫폼 내 이종 커뮤니티 수평 전이</span>
        </div>
      </div>

      <div className="mt-6 text-[11px] font-bold text-[#111111]/30 tracking-tight text-center pt1-fu pt1-d10">
        * WoC는 개별 사용자를 획득하기 위한 마케팅 비용을 최소화하고, 수직 온보딩의 전파력과 수평 확장의 이주력을 극대화하여 평생 가치(LTV)를 극대화하는 성장을 달성합니다.
      </div>
    </div>
  </div>
);

// Slide 13: STRATEGIC VALUE
export const Slide13 = () => (
  <div className="relative z-10 flex flex-col w-full h-full bg-[#fcf8f8] text-[#111111] px-[80px] justify-center">
    <div className="max-w-[1300px] w-full mx-auto">
      <h2 className="font-['Space_Grotesk'] text-[44px] md:text-[56px] font-black tracking-[0.05em] text-[#111111]/90 uppercase block leading-none mb-4 pt1-fu">
        STRATEGIC VALUE
      </h2>
      <p className="text-[16px] md:text-[18px] font-bold text-[#111111]/45 leading-tight tracking-tight mb-12 pt1-fu pt1-d2">
        WoC는 누구에게 가치가 있는가 (인수 및 제휴의 실질적 가치)
      </p>

      <div className="grid grid-cols-3 gap-6 pt1-si pt1-d4">
        <div className="border border-[#111111]/10 bg-white/40 p-8 rounded-sm flex flex-col justify-between hover:bg-white transition-all shadow-2xs">
          <div>
            <span className="font-['Space_Grotesk'] text-[11px] font-bold tracking-widest text-[#111111]/30 uppercase block mb-4 border-b border-[#111111]/5 pb-2">Card 01 / 제조기업</span>
            <h3 className="text-[20px] font-black text-[#111111] leading-tight mb-4">신성장 동력 결합</h3>
            <p className="text-[13.5px] text-[#111111]/50 leading-relaxed break-keep mb-6">
              제품 제조·유통의 정체에서 벗어나 WoC의 오프라인 모임 및 커뮤니티 기반 반복 매출 인프라를 수혈하여 새로운 돌파구를 찾습니다.
            </p>
          </div>
          <div className="pt-4 border-t border-[#111111]/5">
            <span className="text-[11px] font-bold text-[#111111]/40 block mb-1">핵심 타겟 기업</span>
            <p className="text-[12.5px] font-bold text-[#111111]/70">신성통상 · BYC · 쌍방울 · 대한제지</p>
          </div>
        </div>

        <div className="border border-[#111111]/10 bg-white/40 p-8 rounded-sm flex flex-col justify-between hover:bg-white transition-all shadow-2xs">
          <div>
            <span className="font-['Space_Grotesk'] text-[11px] font-bold tracking-widest text-[#111111]/30 uppercase block mb-4 border-b border-[#111111]/5 pb-2">Card 02 / 거대 플랫폼</span>
            <h3 className="text-[20px] font-black text-[#111111] leading-tight mb-4">실물 사교 시장 장악</h3>
            <p className="text-[13.5px] text-[#111111]/50 leading-relaxed break-keep mb-6">
              단순 온라인 텍스트와 2D 피드의 연결 한계를 넘어, 강력한 오프라인 인프라와 즉시 결제 레이어를 손에 쥐고 확장합니다.
            </p>
          </div>
          <div className="pt-4 border-t border-[#111111]/5">
            <span className="text-[11px] font-bold text-[#111111]/40 block mb-1">핵심 타겟 기업</span>
            <p className="text-[12.5px] font-bold text-[#111111]/70">네이버 · 카카오 · 토스 · 당근</p>
          </div>
        </div>

        <div className="border border-[#111111]/10 bg-white/40 p-8 rounded-sm flex flex-col justify-between hover:bg-white transition-all shadow-2xs">
          <div>
            <span className="font-['Space_Grotesk'] text-[11px] font-bold tracking-widest text-[#111111]/30 uppercase block mb-4 border-b border-[#111111]/5 pb-2">Card 03 / 교육 및 로컬</span>
            <h3 className="text-[20px] font-black text-emerald-600 leading-tight mb-4">오프라인 관리 체계</h3>
            <p className="text-[13.5px] text-[#111111]/50 leading-relaxed break-keep mb-6">
              오프라인 거점형 교육 학원 및 로컬 상권의 강사·수강생·정산 프로세스를 WoC OS로 고도화하여 압도적인 점유율을 달성합니다.
            </p>
          </div>
          <div className="pt-4 border-t border-[#111111]/5">
            <span className="text-[11px] font-bold text-emerald-600/50 block mb-1">핵심 타겟 기업</span>
            <p className="text-[12.5px] font-bold text-emerald-600">메가스터디 · 대교 · 웅진 · 지역플랫폼</p>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// Slide 14: WHY NOW
export const Slide14 = () => (
  <div className="relative z-10 flex flex-col w-full h-full bg-[#fcf8f8] text-[#111111] px-[100px] justify-center overflow-hidden">
    <div className="max-w-[1200px] w-full relative z-10">
      <h2 className="font-['Space_Grotesk'] text-[44px] md:text-[56px] font-black tracking-[0.05em] text-[#111111]/90 uppercase block leading-none mb-4 pt1-fu">
        WHY NOW
      </h2>
      <p className="text-[16px] md:text-[18px] font-bold text-[#111111]/45 leading-tight tracking-tight mb-12 pt1-fu pt1-d2">
        첫 매출까지 1개월, 낮은 손익분기점
      </p>

      <div className="grid grid-cols-2 gap-12 items-stretch border-t border-b border-[#111111]/10 py-10">
        <div className="flex flex-col justify-center pr-10 border-r border-[#111111]/10 pt1-sl pt1-d3">
          <span className="text-[11px] font-bold tracking-widest text-[#111111]/45 uppercase mb-4 block">INVESTOR INSIGHT 01</span>
          <h3 className="text-[32px] font-black text-[#111111] mb-2 leading-none">첫 매출</h3>
          <span className="text-[20px] font-black text-emerald-600 leading-none">1개월 이내 발생</span>
          <p className="text-[13px] text-[#111111]/45 leading-relaxed break-keep mt-4">
            이미 형성되어 굴러가는 실물 시장의 결제망을 즉시 흡수 연결함으로써, 론칭 첫 달에 바로 매출을 증명합니다.
          </p>
        </div>

        <div className="flex flex-col justify-center pl-10 pt1-sr pt1-d4">
          <span className="text-[11px] font-bold tracking-widest text-[#111111]/45 uppercase mb-4 block">INVESTOR INSIGHT 02</span>
          <h3 className="text-[32px] font-black text-[#111111] mb-2 leading-none">기획·DB·디자인·개발·운영</h3>
          <span className="text-[20px] font-black text-[#111111]/70 leading-none">1인 전담 직접 수행</span>
          <p className="text-[13px] text-[#111111]/45 leading-relaxed break-keep mt-4">
            불필요한 고정비와 초기 인력 세팅 지연 리스크를 제로화하여 극단적으로 효율적인 손익분기점(BEP)을 넘어섭니다.
          </p>
        </div>
      </div>

      <div className="mt-8 text-center pt1-fu pt1-d6">
        <p className="text-[18px] font-black tracking-tight text-[#111111]/80 leading-none">
          중요한 것은 사용자가 아니라 거래입니다
        </p>
      </div>
    </div>
  </div>
);

// Slide 15: THE OPERATING SYSTEM FOR HUMAN COMMUNITIES (Closing OS)
export const Slide15 = () => (
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
      <h2 className="font-['Space_Grotesk'] text-[40px] md:text-[52px] font-black tracking-[0.05em] text-white/90 uppercase block leading-none mb-4 pt1-fu">
        THE OPERATING SYSTEM FOR HUMAN COMMUNITIES
      </h2>
      <p className="text-[16px] md:text-[18px] font-bold text-white/45 leading-tight tracking-tight mb-12 pt1-fu pt1-d2">
        사람들의 활동을 운영하는 플랫폼
      </p>
      <div className="inline-block border-t border-b border-white/20 py-8 px-12 pt1-si pt1-d5">
        <p className="text-[20px] md:text-[28px] font-bold tracking-[0.2em] uppercase text-white/70">
          World of Community
        </p>
      </div>
    </div>
  </div>
);

// Slide 16: ANGEL ROUND
export const Slide16 = () => (
  <div className="relative z-10 flex flex-col w-full h-full bg-[#fcf8f8] text-[#111111] px-[100px] justify-center overflow-hidden">
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <div className="text-[25vw] font-black text-[#111111]/[0.015] leading-none select-none whitespace-nowrap">
        ANGEL
      </div>
    </div>

    <div className="max-w-[1200px] w-full relative z-10 flex flex-col justify-center">
      <h2 className="font-['Space_Grotesk'] text-[44px] md:text-[56px] font-black tracking-[0.05em] text-[#111111]/90 uppercase block leading-none mb-3 pt1-fu">
        ANGEL ROUND
      </h2>
      <p className="text-[16px] md:text-[18px] font-bold text-[#111111]/45 leading-tight tracking-tight mb-5 pt1-fu pt1-d2">
        투자 유치 계획 (Angel Investment Round)
      </p>

      <div className="flex flex-col gap-4">
        {/* 1단: 상단 (핵심 숫자) */}
        <div className="grid grid-cols-3 gap-4 pt1-fu pt1-d3">
          <div className="border border-[#111111]/10 bg-[#111111]/[0.01] p-3.5 rounded-sm flex flex-col justify-center items-center text-center">
            <span className="text-[11px] font-bold tracking-wider text-[#111111]/45 uppercase mb-1.5">투자 규모</span>
            <span className="text-[32px] font-black text-[#111111] tracking-tight">1억원</span>
          </div>
          <div className="border border-[#111111]/10 bg-[#111111]/[0.01] p-3.5 rounded-sm flex flex-col justify-center items-center text-center">
            <span className="text-[11px] font-bold tracking-wider text-[#111111]/45 uppercase mb-1.5">지분 구조</span>
            <span className="text-[32px] font-black text-[#111111] tracking-tight">25% 지분 인수</span>
          </div>
          <div className="border border-[#111111]/10 bg-[#111111]/[0.01] p-3.5 rounded-sm flex flex-col justify-center items-center text-center">
            <span className="text-[11px] font-bold tracking-wider text-[#111111]/45 uppercase mb-1.5">기업 가치</span>
            <span className="text-[32px] font-black text-emerald-600 tracking-tight">4.0억원</span>
          </div>
        </div>

        {/* 2단: 중단 (사용 계획) */}
        <div className="grid grid-cols-2 gap-5 pt1-fu pt1-d4">
          <div className="border border-[#111111]/10 bg-white/40 p-4 rounded-sm flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-baseline mb-3 border-b border-[#111111]/10 pb-1.5">
                <h3 className="text-[15px] font-black text-[#111111]">창업자 선투입 비용 일부 정산</h3>
                <span className="text-[18px] font-black text-[#111111]/70">3,000만원 <span className="text-[12px] text-[#111111]/40 font-medium">(30%)</span></span>
              </div>
              <p className="text-[12.5px] text-[#111111]/50 leading-relaxed break-keep mt-1.5">
                개발 및 운영 과정에서 선투입한 비용 일부 회수
              </p>
            </div>
          </div>

          <div className="border border-[#111111]/10 bg-white/40 p-4 rounded-sm flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-baseline mb-3 border-b border-[#111111]/10 pb-1.5">
                <h3 className="text-[15px] font-black text-emerald-600">제품 고도화 및 운영 자금</h3>
                <span className="text-[18px] font-black text-emerald-600">7,000만원 <span className="text-[12px] text-[#111111]/40 font-medium">(70%)</span></span>
              </div>
              <ul className="grid grid-cols-2 gap-x-4 gap-y-1 text-[12.5px] text-[#111111]/60 font-semibold mt-1.5">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-[#111111]/30 rounded-full"></span>
                  플랫폼 인프라 운영
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-[#111111]/30 rounded-full"></span>
                  AI 서비스 활용
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-[#111111]/30 rounded-full"></span>
                  기능 고도화 및 유지보수
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-[#111111]/30 rounded-full"></span>
                  커뮤니티 확장 및 검증
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* 3단: 하단 (로드맵) */}
        <div className="border border-[#111111]/10 bg-[#111111]/[0.01] p-4 rounded-sm pt1-fu pt1-d5">
          <h3 className="text-[13px] font-black text-[#111111]/75 mb-3 uppercase tracking-wider flex items-center gap-2">
            투자 후 12개월 목표
          </h3>
          <div className="grid grid-cols-5 gap-3.5">
            {[
              'WoC 핵심 시스템 완성',
              '커뮤니티 운영 데이터 확보',
              '실제 거래 및 수익 모델 검증',
              '탱고 외 커뮤니티 확장 검증',
              'Seed 투자 유치 기반 확보'
            ].map((goal, idx) => (
              <div key={idx} className="bg-white/60 border border-[#111111]/5 p-3 rounded-sm flex flex-col justify-between items-start">
                <span className="text-[10px] font-['Space_Grotesk'] font-bold text-[#111111]/30 mb-1.5 block">0{idx + 1}</span>
                <p className="text-[12px] font-bold text-[#111111]/70 tracking-tight break-keep leading-snug">
                  ✓ {goal}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer Copy */}
      <div className="mt-6 border-t border-[#111111]/10 pt-4 text-center pt1-fu pt1-d6">
        <p className="text-[14px] font-black tracking-tight text-[#111111] leading-none mb-1.5">
          커뮤니티를 위한 운영 인프라를 구축합니다.
        </p>
        <p className="text-[10px] font-['Space_Grotesk'] font-bold tracking-[0.2em] text-[#111111]/30 uppercase">
          World of Community (WoC)
        </p>
      </div>
    </div>
  </div>
);
