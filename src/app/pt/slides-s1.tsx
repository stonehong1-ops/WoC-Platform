import React from 'react';

// Slide 1: 인트로 커버 (Intro Cover)
export const Slide1 = () => (
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

// Slide 2: 비전 (취미를 위한 플랫폼)
export const Slide2 = () => (
  <div className="relative z-10 flex flex-col items-center justify-center text-center w-full h-full px-10 bg-[#fcf8f8] overflow-hidden">
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <div className="w-[600px] h-[600px] rounded-full bg-[#111111]/[0.02] blur-[120px] pt1-si" />
    </div>
    <div className="relative z-10 max-w-[1200px] w-full flex flex-col items-center">
      <p className="font-['Space_Grotesk'] text-[15px] font-bold tracking-[0.4em] text-[#111111]/30 uppercase mb-12 pt1-fu">비전</p>
      <h2 className="text-[44px] md:text-[72px] font-black text-[#111111] leading-[1.2] tracking-tighter break-keep pt1-fu pt1-d2">
        취미를 위한<br/>
        <span className="text-[#111111]/60 font-bold">플랫폼</span>
      </h2>
      <p className="mt-8 text-[18px] md:text-[24px] font-black tracking-tight text-[#111111]/55 pt1-fu pt1-d4">
        요가, 러닝, 자전거, 살사, 위스키, 뮤지컬
        <span className="block mt-2 font-['Space_Grotesk'] text-[12px] font-semibold tracking-[0.2em] text-[#111111]/25 uppercase">
          Yoga, Running, Cycling, Salsa, Whiskey, Musical
        </span>
      </p>
      <div className="w-[100px] h-[1px] bg-[#111111]/15 my-12 pt1-lg pt1-d5" />
      <div className="flex flex-col items-center gap-4 text-[16px] md:text-[21px] font-medium text-[#111111]/60 tracking-tight leading-relaxed break-keep">
        <p className="pt1-fu pt1-d6">사람들은 좋아하는 활동에 많은 <span className="text-[#111111] font-bold">시간과 돈을 사용합니다.</span></p>
        <p className="pt1-fu pt1-d8">WoC는 그 <span className="text-[#111111] font-bold">개인활동과 커뮤니티활동 원활하게 운영하는 시스템</span>입니다.</p>
      </div>
    </div>
  </div>
);

// Slide 3: 비즈니스 포지셔닝 (분절 vs 연결)
export const Slide3 = () => {
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
    <div className="relative z-10 flex flex-col items-center justify-center w-full h-full px-[60px] md:px-[100px] bg-[#fcf8f8] overflow-hidden">
      <div className="max-w-[1300px] w-full mb-10 text-center">
        <span className="font-['Space_Grotesk'] text-[13px] font-bold tracking-[0.3em] text-[#111111]/30 uppercase block mb-3 pt1-fu">비즈니스 포지셔닝</span>
        <h2 className="text-[34px] md:text-[50px] font-black text-[#111111] leading-[1.2] tracking-tighter break-keep pt1-fu pt1-d2">
          기존 커뮤니티는 분리되어 있습니다<br/>
          <span className="text-[#111111]/50 font-bold">WoC는 연결되어 있습니다</span>
        </h2>
      </div>

      <div className="grid grid-cols-12 gap-10 w-full max-w-[1250px] items-center">
        <div className="col-span-5 flex flex-col gap-8 border-r border-[#111111]/10 pr-10 pt1-sl pt1-d3">
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

        <div className="col-span-7 flex flex-col items-center justify-center pl-10 relative pt1-sr pt1-d4">
          <span className="text-[11px] font-bold tracking-widest text-[#111111]/45 uppercase mb-2 block self-start">
            WoC Solution / Global Network Infrastructure
          </span>
          <div className="w-[500px] h-[500px] relative flex items-center justify-center bg-white/10 rounded-full border border-[#111111]/5 shadow-[inset_0_0_30px_rgba(0,0,0,0.01)]">
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

            <div className="w-[230px] h-[230px] rounded-full border-[2.5px] border-[#111111] bg-white flex flex-col items-center justify-center p-6 shadow-[0_15px_45px_rgba(0,0,0,0.06)] z-10 text-center relative group hover:scale-[1.02] transition-transform duration-300">
              <h4 className="text-[34px] font-black tracking-tighter text-[#111111] mb-2 leading-none">
                WoC
              </h4>
              <div className="w-12 h-[2px] bg-[#111111] mb-3" />
              <p className="text-[11.5px] font-bold leading-[1.5] text-[#111111]/70 tracking-tight break-keep max-w-[170px]">
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

      <div className="mt-12 pt-6 border-t border-[#111111]/10 flex flex-col md:flex-row justify-between items-center gap-4 w-full max-w-[1250px]">
        <div className="flex gap-8 text-[12px] font-bold text-[#111111]/35 leading-tight">
          <p>* 기존 서비스는 도구를 제공합니다.</p>
          <p>* WoC는 운영과 연결을 제공합니다.</p>
        </div>
        <div className="text-right">
          <h3 className="text-[28px] md:text-[34px] font-black text-[#111111] tracking-tighter leading-none">
            지역 커뮤니티를 글로벌 네트워크로
          </h3>
        </div>
      </div>
    </div>
  );
};

// Slide 4: 타겟 시장 검증 (Tango Market Validation)
export const Slide4 = () => {
  const Milongas = ['수업', '밀롱가', '워크샵', '공연', '축제'];
  const metrics = [
    { num: '108', unit: '억 원', period: '연간', label: '전체 시장 거래 규모', eng: 'TANGO MARKET SIZE', sub: '수업 · 밀롱가 · 워크샵 · 공연 · 축제' },
    { num: '32', unit: '억 원', period: '연간', label: 'WoC 처리 거래액', eng: 'PLATFORM GMV', sub: 'WoC를 통해 실제 결제되는 금액' },
    { num: '2.2', unit: '억 원', period: '연간', label: 'WoC 플랫폼 매출', eng: 'WOC REVENUE', sub: '결제 · 정산 · 솔루션 수수료 기반' },
  ];

  return (
    <div className="relative z-10 flex flex-col w-full h-full bg-[#fcf8f8] text-[#111111] px-[80px] py-[50px] justify-center">
      <div className="max-w-[1300px] w-full mx-auto">
        <div className="flex flex-col lg:flex-row justify-between items-start mb-14 gap-8">
          <div>
            <span className="font-['Space_Grotesk'] text-[13px] font-bold tracking-[0.3em] text-[#111111]/30 uppercase block mb-4 pt1-fu">MONEY FLOWS HERE</span>
            <h2 className="text-[44px] md:text-[68px] font-black tracking-tighter leading-none mb-6 pt1-cu pt1-d2">
              <span className="font-['Space_Grotesk']">2,000</span>명이 만드는<br/>
              <span className="text-[#111111]/60">연간 <span className="font-['Space_Grotesk']">108</span>억 규모의 활동 경제</span>
            </h2>
            <div className="text-[17px] md:text-[20px] font-medium text-[#111111]/55 tracking-tight break-keep pt1-fu pt1-d3 flex flex-col gap-2.5 leading-relaxed">
              <p>
                통계청 기준 국민 1인당 월 평균 약 <span className="font-['Space_Grotesk']">45</span>만원은<br/>
                <span className="text-[#111111] font-black">취미 · 여가 · 문화 · 활동에 사용됩니다.</span>
              </p>
              <p className="mt-1">
                사람들은 의무적으로 소비하는 곳보다<br/>
                <span className="text-[#111111] font-black">스스로 선택한 활동에 시간과 돈을 사용합니다.</span>
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2.5 max-w-[450px] pt-2 pt1-fi pt1-d5">
            {Milongas.map((t, idx) => (
              <span key={t} className="px-4 py-2 border border-[#111111]/15 rounded-full text-[13px] font-semibold bg-[#111111]/[0.02]" style={{ animationDelay: `${600 + idx * 80}ms` }}>
                {t}
              </span>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-3 border-t border-b border-[#111111]/10 py-12 gap-12">
          {metrics.map((s, i) => (
            <div key={s.label} className="flex flex-col pt1-cu" style={{ animationDelay: `${500 + i * 120}ms` }}>
              <div className="flex items-baseline gap-1 mb-3">
                <span className="text-[11px] font-bold text-[#111111]/30 tracking-wider uppercase">{s.period}</span>
                <span className="font-['Space_Grotesk'] text-[40px] md:text-[48px] font-black tracking-tight leading-none">{s.num}</span>
                <span className="text-[20px] md:text-[24px] font-bold text-[#111111]/60">{s.unit}</span>
              </div>
              <p className="text-[15px] font-black text-[#111111] mb-1.5 leading-tight flex items-baseline gap-1.5 flex-wrap">
                {s.label}
                <span className="font-['Space_Grotesk'] text-[10px] font-bold tracking-wider text-[#111111]/30 uppercase shrink-0">{s.eng}</span>
              </p>
              <p className="text-[12px] font-medium text-[#111111]/45 tracking-tight break-keep">{s.sub}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 text-[11px] font-bold text-[#111111]/30 tracking-tight pt1-fu pt1-d8 flex flex-col gap-2">
          <p>* WoC는 단순히 거래를 연결하는 광고 플랫폼을 넘어 결제 및 정산 인프라를 직접 제공하며, 플랫폼 결제 대금 수수료를 실질적인 매출로 인식합니다.</p>
          <div className="mt-1.5 pt-3 border-t border-[#111111]/5 flex flex-col gap-1 text-[10px] text-[#111111]/25 uppercase font-black tracking-wider leading-tight">
            <div className="flex gap-4">
              <span>[Red Money] <span className="font-medium text-[#111111]/35 lowercase ml-1">월세 · 통신비 · 보험 · 세금</span></span>
              <span>|</span>
              <span>[Activity Money] <span className="font-medium text-[#111111]/35 lowercase ml-1">수업 · 공연 · 축제 · 여행 · 취미 · 커뮤니티</span></span>
            </div>
            <p className="font-['Space_Grotesk'] text-[10.5px] text-[#111111]/40 font-black tracking-[0.2em] mt-0.5">Money Flows Here.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Slide 5: 마지막 플랫폼 (The Last Platform)
export const Slide5 = () => (
  <div className="relative z-10 flex flex-col w-full h-full bg-[#fcf8f8] text-[#111111] px-[100px] justify-center overflow-hidden">
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <div className="w-[600px] h-[600px] rounded-full bg-[#111111]/[0.015] blur-[120px] pt1-si" />
    </div>

    <div className="max-w-[1250px] w-full mx-auto relative z-10">
      <span className="font-['Space_Grotesk'] text-[13px] font-bold tracking-[0.4em] text-[#111111]/30 uppercase block mb-10 pt1-fu">
        THE LAST FRONTIER
      </span>

      <div className="grid grid-cols-2 gap-16 items-start border-b border-[#111111]/10 pb-12">
        <div className="flex flex-col pt1-sl pt1-d2">
          <span className="text-[11px] font-bold tracking-widest text-[#111111]/45 uppercase mb-4 block">
            01 / 선점된 고정 경제 (MANDATORY PLATFORMS)
          </span>
          <h3 className="text-[32px] font-black text-[#111111]/50 tracking-tight leading-tight mb-6 break-keep">
            나머지 돈은 움직일 수 없고<br/>
            이미 기존 거대 플랫폼이 장악했습니다
          </h3>
          
          <div className="flex flex-col gap-3.5 mt-2">
            {[
              { cat: '월세 · 관리비', items: '부동산 납부금 및 주거 고정비' },
              { cat: '세금 · 연금', items: '국가 납세 및 사회보험 의무 지출' },
              { cat: '통신 · 생활', items: '이동통신요금 · 쿠팡 · 배달의민족 결제액' }
            ].map((item) => (
              <div key={item.cat} className="flex items-baseline gap-4 text-[14.5px]">
                <span className="w-24 shrink-0 font-bold text-[#111111]/30 border-r border-[#111111]/10 pr-3 text-right">
                  {item.cat}
                </span>
                <span className="font-medium text-[#111111]/55 tracking-tight">
                  {item.items}
                </span>
              </div>
            ))}
          </div>
          
          <p className="text-[12.5px] font-medium text-[#111111]/35 tracking-tight leading-relaxed mt-8 break-keep">
            * 이 고정 경제 영역의 돈은 소비자가 자율적으로 통제하기 어려우며, 이미 확정된 플랫폼 비즈니스들이 완벽히 선점하고 분할해 가고 있습니다.
          </p>
        </div>

        <div className="flex flex-col pt1-sr pt1-d3 pl-10 border-l border-[#111111]/10">
          <span className="text-[11px] font-bold tracking-widest text-emerald-600 uppercase mb-4 block">
            02 / 자율적 선택의 경제 (PASSION OPERATING SYSTEM)
          </span>
          <h3 className="text-[32px] font-black text-[#111111] tracking-tight leading-tight mb-6 break-keep">
            스스로 선택한 열정의 돈은<br/>
            <span className="text-emerald-600">아직 지배적인 플랫폼이 없습니다</span>
          </h3>

          <div className="flex flex-col gap-3.5 mt-2">
            {[
              { cat: '교육 · 강습', items: '요가 · 필라테스 · 댄스 · 어학 클래스 수강료' },
              { cat: '모임 · 문화', items: '밀롱가 · 동호회 회비 · 정기 소셜 파티 티켓' },
              { cat: '행사 · 여정', items: '워크샵 참가비 · 국내외 축제 · 취미 중심 여행 패키지' }
            ].map((item) => (
              <div key={item.cat} className="flex items-baseline gap-4 text-[14.5px]">
                <span className="w-24 shrink-0 font-bold text-emerald-600/50 border-r border-emerald-600/20 pr-3 text-right">
                  {item.cat}
                </span>
                <span className="font-bold text-[#111111] tracking-tight">
                  {item.items}
                </span>
              </div>
            ))}
          </div>

          <p className="text-[12.5px] font-semibold text-emerald-600/70 tracking-tight leading-relaxed mt-8 break-keep">
            * 통계청 기준 자발적으로 사용하는 문화/취미 소비를 통합 예약, 결제, 정산할 수 있는 플랫폼은 아직 시장에 존재하지 않습니다.
          </p>
        </div>
      </div>

      <div className="mt-12 flex flex-col md:flex-row justify-between items-center gap-6 pt1-fu pt1-d6">
        <div className="max-w-[700px] text-left">
          <p className="text-[15px] font-medium text-[#111111]/55 leading-relaxed break-keep">
            사람들이 자발적으로 움직이고 지출하는 취미와 사교의 실물 결제망을 직접 연결합니다.<br/>
            이것이 우리가 WoC를 만드는 이유이자, 이 플랫폼이 가지는 가장 강력한 시장 독점 기회입니다.
          </p>
        </div>
        
        <div className="text-right shrink-0">
          <p className="font-['Space_Grotesk'] text-[11px] font-bold tracking-[0.3em] text-emerald-600 uppercase mb-2">
            CONCLUSION KEYWORD
          </p>
          <h2 className="text-[38px] md:text-[48px] font-black text-[#111111] tracking-tighter leading-none pt1-gp">
            이것이 <span className="text-emerald-600">마지막 플랫폼</span>이다.
          </h2>
        </div>
      </div>
    </div>
  </div>
);

// Slide 6: 왜 지배적 플랫폼이 없을까? (Operational Complexity)
export const Slide6 = () => {
  const legacyTools = ['네이버카페', '밴드', '카카오톡', '위버스', '클래스101', '온오프믹스', '예약툴', '멤버십툴'];
  const communities = ['요가', '러닝', '자전거', '살사', '위스키', '뮤지컬'];
  const commonNeeds = ['회원', '행사', '클래스', '예약', '결제', '운영'];

  return (
    <div className="relative z-10 flex flex-col w-full h-full bg-[#fcf8f8] text-[#111111] px-[80px] py-[40px] justify-center overflow-hidden">
      <div className="max-w-[1300px] w-full mx-auto relative z-10">
        <span className="font-['Space_Grotesk'] text-[13px] font-bold tracking-[0.3em] text-[#111111]/30 uppercase block mb-3 pt1-fu">
          MARKET STRUCTURE
        </span>

        <div className="mb-8 text-left">
          <h2 className="text-[44px] md:text-[50px] font-black text-[#111111] leading-tight tracking-tighter pt1-fu pt1-d2">
            왜 아직 지배적 플랫폼이 없을까?
          </h2>
        </div>

        <div className="grid grid-cols-12 gap-12 border-t border-b border-[#111111]/10 py-8 items-stretch">
          <div className="col-span-5 flex flex-col pr-10 border-r border-[#111111]/10 pt1-sl pt1-d3">
            <span className="text-[11px] font-bold tracking-widest text-[#111111]/45 uppercase mb-6 block">
              01 / 기존 서비스들의 한계
            </span>
            
            <div className="flex flex-wrap gap-2.5 max-w-[400px] mb-8">
              {legacyTools.map((tool, idx) => (
                <span 
                  key={tool} 
                  className="px-3.5 py-1.5 border border-[#111111]/10 bg-[#111111]/[0.01] rounded-sm text-[13.5px] font-semibold text-[#111111]/50 tracking-tight"
                  style={{ transform: `translateY(${(idx % 3) * 3}px)` }}
                >
                  {tool}
                </span>
              ))}
            </div>

            <div className="mt-auto">
              <p className="text-[18px] font-black text-[#111111] tracking-tight leading-none mb-2">
                사람은 하나인데
              </p>
              <p className="text-[14px] font-medium text-[#111111]/45">
                도구는 모두 분리되어 작동합니다.
              </p>
            </div>
          </div>

          <div className="col-span-2 flex flex-col items-center justify-center text-center px-4 pt1-fi pt1-d4">
            <div className="w-[1px] h-10 bg-[#111111]/15 mb-4" />
            <p className="text-[15px] font-black text-[#111111] leading-snug tracking-tighter break-keep">
              문제는 기능이 아닙니다.<br/>
              <span className="text-[#111111]/60 font-bold">운영 구조</span>입니다.
            </p>
            <div className="w-[1px] h-10 bg-[#111111]/15 mt-4" />
          </div>

          <div className="col-span-5 flex flex-col pl-10 pt1-sr pt1-d3">
            <span className="text-[11px] font-bold tracking-widest text-[#111111]/45 uppercase mb-6 block">
              02 / 커뮤니티 운영의 다양성
            </span>

            <div className="flex flex-col gap-4 mb-8">
              <div className="flex flex-wrap gap-2">
                {communities.map((item) => (
                  <span key={item} className="px-2.5 py-0.5 border border-[#111111]/15 rounded-full text-[12.5px] font-bold text-[#111111]/70">
                    {item}
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-1.5 text-[13.5px] text-[#111111]/50 font-medium tracking-tight">
                <span className="font-bold text-[#111111]/75">필수 요구:</span>
                {commonNeeds.join(' · ')}
              </div>
            </div>

            <div className="mt-auto">
              <p className="text-[18px] font-black text-[#111111] tracking-tight leading-none mb-2">
                같은 커뮤니티가 없습니다.
              </p>
              <p className="text-[14px] font-medium text-[#111111]/45">
                같은 운영 방식도 존재하지 않습니다.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-2 flex flex-col md:flex-row justify-between items-center gap-6 pt1-fu pt1-d5">
          <div className="text-left max-w-[650px]">
            <p className="text-[14px] font-medium text-[#111111]/50 leading-relaxed break-keep">
              각 취미 커뮤니티마다 정산 방식, 예약 룰, 강사 정산 구조가 극단적으로 다르기 때문에 지금까지 누구도 하나의 플랫폼으로 이를 통합해내지 못했습니다.
            </p>
          </div>
          
          <div className="text-right shrink-0">
            <p className="font-['Space_Grotesk'] text-[10px] font-bold tracking-[0.3em] text-[#111111]/35 uppercase mb-1">
              MARKET CONCLUSION
            </p>
            <h3 className="text-[28px] md:text-[34px] font-black text-[#111111] tracking-tighter leading-none pt1-gp">
              그래서 지금까지는 <span className="text-[#111111]/60 font-bold">전용 서비스</span>만 존재했습니다.
            </h3>
          </div>
        </div>
      </div>
    </div>
  );
};

// Slide 7: 글로벌 생태계 카테고리 (Ecosystem)
export const Slide7 = () => {
  const categories = [
    { title: '무대', eng: 'STAGE', items: ['탱고', '살사', '바차타', '플라멩코', '발레'] },
    { title: '야외', eng: 'ROAD', items: ['러닝', '자전거', '캠핑', '트레킹', '클라이밍'] },
    { title: '창작', eng: 'TABLE', items: ['커피', '요리', '베이킹', '도예', '목공'] },
    { title: '예술', eng: 'MUSE', items: ['K-Pop', '영화', '애니메이션', '문학', '바이닐'] },
    { title: '일상', eng: 'MIND', items: ['영어', '일본어', '글쓰기', '인테리어', '식물'] },
  ];

  return (
    <div className="relative z-10 flex flex-col w-full h-full bg-[#fcf8f8] text-[#111111] px-[80px] justify-center overflow-hidden">
      <div className="max-w-[1300px] w-full mx-auto">
        <div className="mb-10">
          <span className="text-[13px] font-bold tracking-[0.3em] text-[#111111]/30 uppercase block mb-3 pt1-fu">생태계 확장성</span>
          <h2 className="text-[44px] md:text-[60px] font-black tracking-tight leading-none pt1-fu pt1-d2">
            하나의 플랫폼, 수많은 커뮤니티
          </h2>
          <div className="mt-4 flex flex-col gap-1 text-[15px] md:text-[18px] font-medium text-[#111111]/55 tracking-tight break-keep pt1-fu pt1-d3">
            <p>탱고 커뮤니티의 회원은 이미 요가, 러닝, 커피, 여행 등 다양한 활동에도 참여하고 있습니다.</p>
            <p>WoC는 하나의 커뮤니티에서 시작하여 전체 활동 생태계로 무한히 확장합니다.</p>
          </div>
        </div>

        <div className="grid grid-cols-5 gap-6 pt1-si pt1-d4">
          {categories.map((cat, idx) => (
            <div key={cat.title} className="flex flex-col border border-[#111111]/10 bg-white/30 p-5 pt1-fi" style={{ animationDelay: `${400 + idx * 80}ms` }}>
              <span className="text-[17px] font-black tracking-tight text-[#111111] border-b border-[#111111]/10 pb-2 mb-4 block leading-tight">
                {cat.title}
                <span className="font-['Space_Grotesk'] text-[10px] font-bold tracking-wider text-[#111111]/30 uppercase block mt-0.5">{cat.eng}</span>
              </span>
              <ul className="flex flex-col gap-2.5">
                {cat.items.map((item) => (
                  <li key={item} className="text-[13.5px] font-bold text-[#111111]/50 tracking-tight flex items-center gap-2">
                    <span className="w-1 h-1 bg-[#111111]/25 rounded-full shrink-0"></span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 pt-6 border-t border-[#111111]/10 pt1-si pt1-d6">
          <span className="text-[11.5px] font-black tracking-tight text-[#111111]/60 block mb-5">
            생태계 확장 파이프라인
            <span className="font-['Space_Grotesk'] text-[9.5px] font-bold tracking-widest text-[#111111]/30 uppercase ml-2">ECOSYSTEM PIPELINE</span>
          </span>
          <div className="flex items-center justify-between max-w-[850px] text-[14px] md:text-[15px] font-black text-[#111111]">
            <div className="flex items-center justify-center px-4 py-2 border border-[#111111]/20 bg-white/50 text-[#111111]/70">WoC 코어</div>
            <span className="text-[#111111]/30 font-light">➔</span>
            <div className="flex items-center justify-center px-4 py-2 border border-[#111111]/20 bg-white/50 text-[#111111]/70">5대 핵심 테마 (무대 · 야외 · 창작 · 예술 · 일상)</div>
            <span className="text-[#111111]/30 font-light">➔</span>
            <div className="flex items-center justify-center px-4 py-2 border border-[#111111]/20 bg-white/50 text-[#111111]/70">수백 개의 활동</div>
            <span className="text-[#111111]/30 font-light">➔</span>
            <div className="flex items-center justify-center px-4.5 py-2 border border-[#111111] bg-[#111111] text-[#fcf8f8]">수천 개의 커뮤니티</div>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-1.5 text-[11.5px] font-bold text-[#111111]/35 tracking-tight pt1-fu pt1-d8">
          <p>* WoC는 하나의 취미 플랫폼이 아닌, 수많은 오프라인 사교 활동과 커뮤니티를 담아내고 상호 연결하는 운영 플랫폼입니다.</p>
        </div>
      </div>
    </div>
  );
};

// Slide 8: 오프라인 확장 메커니즘 (확장 가능성 증명)
export const Slide8 = () => {
  const roadmapData = [
    { ko: '탱고', eng: 'Tango', size: '2,000명', leader: '강사 · DJ · 오거나이저', structure: '수업 · 밀롱가 · 축제' },
    { ko: '살사', eng: 'Salsa', size: '30,000명', leader: '강사 · 동호회 운영진', structure: '수업 · 파티 · 공연' },
    { ko: '바차타', eng: 'Bachata', size: '10,000명', leader: '강사 · 팀 리더', structure: '수업 · 행사 · 워크샵' },
    { ko: '요가 · 필라테스', eng: 'Yoga & Pilates', size: '300,000+명', leader: '원장 · 강사', structure: '수업 · 예약 · 회원권' },
  ];

  return (
    <div className="relative z-10 flex flex-col w-full h-full bg-[#fcf8f8] text-[#111111] px-[80px] py-[50px] justify-center">
      <div className="max-w-[1300px] w-full mx-auto">
        <div className="mb-8">
          <span className="text-[13px] font-bold tracking-[0.3em] text-[#111111]/30 uppercase block mb-3 pt1-fu">확장 가능성 증명</span>
          <h2 className="text-[44px] md:text-[60px] font-black tracking-tight leading-none pt1-fu pt1-d2">
            검증된 커뮤니티 확장 모델
          </h2>
          <p className="mt-3 text-[15px] text-[#111111]/45 font-medium pt1-fu pt1-d3">
            WoC는 특정 취미에 종속되지 않습니다. 동일한 운영 구조를 바탕으로 다른 오프라인 시장에 고속 복제됩니다.
          </p>
        </div>

        <div className="w-full overflow-hidden border-t border-[#111111]/15 pt1-si pt1-d4">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#111111]/10">
                <th className="py-5 font-bold text-[12px] tracking-wider text-[#111111]/40 uppercase w-[20%]">커뮤니티</th>
                <th className="py-5 font-bold text-[12px] tracking-wider text-[#111111]/40 uppercase text-center w-[20%]">커뮤니티 규모</th>
                <th className="py-5 font-bold text-[12px] tracking-wider text-[#111111]/40 uppercase w-[30%]">핵심 운영자</th>
                <th className="py-5 font-bold text-[12px] tracking-wider text-[#111111]/40 uppercase w-[30%]">주요 거래 구조</th>
              </tr>
            </thead>
            <tbody>
              {roadmapData.map((row) => (
                <tr key={row.ko} className="border-b border-[#111111]/5 hover:bg-[#111111]/[0.01] transition-colors duration-200">
                  <td className="py-5 font-bold text-[16px] md:text-[18px] text-[#111111] leading-tight">
                    {row.ko}
                    <span className="font-['Space_Grotesk'] text-[11px] font-bold tracking-wider text-[#111111]/30 uppercase block mt-0.5">{row.eng}</span>
                  </td>
                  <td className="py-5 font-bold text-[15px] text-center font-['Space_Grotesk'] text-[#111111]/70">{row.size}</td>
                  <td className="py-5 font-medium text-[15px] text-[#111111]/60">{row.leader}</td>
                  <td className="py-5 font-semibold text-[15px] text-[#111111]">{row.structure}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-10 pt-6 border-t border-[#111111]/10 pt1-si pt1-d6">
          <span className="text-[11.5px] font-black tracking-tight text-[#111111]/60 block mb-5">
            WoC 확장 메커니즘
            <span className="font-['Space_Grotesk'] text-[9.5px] font-bold tracking-widest text-[#111111]/30 uppercase ml-2">WoC EXPANSION FORMULA</span>
          </span>
          <div className="flex items-center justify-between max-w-[850px] text-[15px] md:text-[16px] font-black text-[#111111]">
            <div className="flex items-center justify-center px-4 py-2 border border-[#111111]/20 bg-white/50 text-[#111111]/70">운영자</div>
            <span className="text-[#111111]/30 font-light">➔</span>
            <div className="flex items-center justify-center px-4 py-2 border border-[#111111]/20 bg-white/50 text-[#111111]/70">회원</div>
            <span className="text-[#111111]/30 font-light">➔</span>
            <div className="flex items-center justify-center px-4 py-2 border border-[#111111]/20 bg-white/50 text-[#111111]/70">활동</div>
            <span className="text-[#111111]/30 font-light">➔</span>
            <div className="flex items-center justify-center px-4 py-2 border border-[#111111]/20 bg-white/50 text-[#111111]/70">결제</div>
            <span className="text-[#111111]/30 font-light">➔</span>
            <div className="flex items-center justify-center px-4 py-2 border border-[#111111]/20 bg-white/50 text-[#111111]/70">정산</div>
            <span className="text-[#111111]/30 font-light">➔</span>
            <div className="flex items-center justify-center px-4.5 py-2 border border-[#111111] bg-[#111111] text-[#fcf8f8]">WoC</div>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-1.5 text-[11.5px] font-bold text-[#111111]/35 tracking-tight pt1-fu pt1-d8">
          <p>* 모든 오프라인 커뮤니티가 동일한 운영 구조(Formula)를 공유하고 있어 원스톱 확장이 즉시 가능합니다.</p>
          <p>* WoC는 단순 탱고 전용 플랫폼이 아닌, 검증된 단일 운영 모델을 다각적 취미 시장에 이식하는 통합 커뮤니티 OS입니다.</p>
        </div>
      </div>
    </div>
  );
};

// Slide 9: 수직적 온보딩 및 수평적 확장 전략 (Vertical & Horizontal Onboarding)
export const Slide9 = () => (
  <div className="relative z-10 flex flex-col w-full h-full bg-[#fcf8f8] text-[#111111] px-[80px] py-[40px] justify-center overflow-hidden">
    <div className="max-w-[1300px] w-full mx-auto">
      <div className="mb-6">
        <span className="text-[13px] font-bold tracking-[0.3em] text-[#111111]/30 uppercase block mb-3 pt1-fu">온보딩 및 성장 전략</span>
        <h2 className="text-[44px] md:text-[54px] font-black tracking-tight leading-none pt1-fu pt1-d2">
          수직적 온보딩과 수평적 확장
        </h2>
        <p className="mt-3 text-[15px] text-[#111111]/45 font-medium pt1-fu pt1-d3">
          광고비 없이 허브를 통해 사용자를 수직적으로 확보(Vertical)하고, 검증된 사용자 경험을 바탕으로 이종 활동 커뮤니티로 장벽 없이 수평적 이주(Horizontal)를 유도합니다.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-10 border-t border-b border-[#111111]/10 py-8">
        <div className="flex flex-col pt1-sl pt1-d4 border-r border-[#111111]/10 pr-10">
          <div className="flex items-baseline gap-4 mb-4">
            <span className="text-[14px] font-bold tracking-widest text-[#111111]/30">01</span>
            <h3 className="text-[26px] font-black tracking-tight text-[#111111]">수직적 온보딩 (Vertical Onboarding)</h3>
          </div>
          <p className="text-[14.5px] leading-[1.6] text-[#111111]/60 mb-6 break-keep">
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

        <div className="flex flex-col pt1-sr pt1-d4 pl-10">
          <div className="flex items-baseline gap-4 mb-4">
            <span className="text-[14px] font-bold tracking-widest text-emerald-600/70">02</span>
            <h3 className="text-[26px] font-black tracking-tight text-[#111111]">수평적 이주 (Horizontal Migration)</h3>
          </div>
          <p className="text-[14.5px] leading-[1.6] text-[#111111]/60 mb-6 break-keep">
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

// Slide 10: 모듈형 커뮤니티 시스템 (Modular Architecture)
export const Slide10 = () => {
  const categories = [
    { cat: 'ADMIN', items: 'Brand Setting · Class Setting · Shop Setting', color: 'bg-[#111111] text-white' },
    { cat: 'CORE', items: 'Dashboard · Calendar · Feed · Live · Chat Rooms', color: 'bg-[#222222] text-white' },
    { cat: 'EDU & EVENT', items: 'Tuition Manager · Homework · Ticket Booking · Venues', color: 'bg-[#111111]/5 text-black' },
    { cat: 'COMMERCE', items: 'Group Shop · Rental System · Membership Billing', color: 'bg-[#111111]/5 text-black' },
    { cat: 'AI COOPER', items: 'Auto Translation · AI Assistant · AI Insights', color: 'bg-[#111111]/5 text-black' },
  ];

  const presets = ['Tango Studio', 'Yoga Brand', 'Daechi Academy', 'Fan Community', 'Startup Team'];

  return (
    <div className="relative z-10 flex flex-col w-full h-full bg-[#fcf8f8] text-[#111111] px-[80px] py-[40px] justify-center overflow-hidden">
      <div className="max-w-[1300px] w-full mx-auto">
        <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <span className="text-[13px] font-bold tracking-[0.3em] text-[#111111]/30 uppercase block mb-3 pt1-fu">모듈형 아키텍처</span>
            <h2 className="text-[44px] md:text-[50px] font-black tracking-tight leading-none pt1-fu pt1-d2">
              One Platform, Infinite Systems
            </h2>
            <p className="mt-2 text-[15px] text-[#111111]/45 font-medium pt1-fu pt1-d3">
              50개 이상의 세부 기능을 조립하여 각 그룹의 고유한 운영체제를 구축합니다.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 pt1-fi pt1-d4">
            {presets.map((preset) => (
              <span key={preset} className="px-3 py-1 bg-white border border-[#111111]/15 rounded-full text-[11px] font-bold text-[#111111]/60">
                {preset}
              </span>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-12 gap-8 items-center border-t border-b border-[#111111]/10 py-6">
          <div className="col-span-7 flex flex-col gap-3 pt1-sl pt1-d4">
            {categories.map((r) => (
              <div key={r.cat} className={`${r.color} rounded-lg px-5 py-3 flex items-center gap-4 border border-[#d4d4d4]/10 transition-transform duration-300 hover:scale-[1.01]`}>
                <span className="font-['Space_Grotesk'] text-[12px] md:text-[14px] font-black tracking-widest uppercase w-[120px] text-left shrink-0">{r.cat}</span>
                <span className="text-[12px] md:text-[14.5px] font-semibold opacity-75">{r.items}</span>
              </div>
            ))}
          </div>

          <div className="col-span-5 flex flex-col justify-center pl-6 border-l border-[#111111]/10 pt1-sr pt1-d5">
            <h3 className="text-[24px] font-black leading-tight tracking-tight mb-4 break-keep">
              하나의 커뮤니티는 하나의 독립된 경제 생태계가 됩니다
            </h3>
            <p className="text-[14px] leading-[1.6] text-black/50 break-keep mb-6">
              각 그룹의 성격(댄스 스튜디오, 요가, 학원 등)에 맞추어 결제 모듈, 예약 캘린더, 커뮤니티 피드 등을 유기적으로 선택 적용할 수 있는 세계 최초의 모듈형 SaaS 서비스입니다.
            </p>
            <div className="bg-[#111111] text-white p-4 text-center rounded-lg">
              <p className="text-[15px] font-black tracking-tight">Salesforce와 같은 서비스 확장망 구축</p>
            </div>
          </div>
        </div>

        <div className="mt-6 text-[11px] font-bold text-[#111111]/30 tracking-tight text-center pt1-fu pt1-d8">
          * 사용자는 개별 솔루션(예약 따로, 결제 따로)을 찾아 헤맬 필요가 없이 WoC 내에서 자신만의 시스템을 완성합니다.
        </div>
      </div>
    </div>
  );
};

// Slide 11: 전략적 가치 (Strategic Value)
export const Slide11 = () => (
  <div className="relative z-10 flex flex-col w-full h-full bg-[#fcf8f8] text-[#111111] px-[80px] justify-center">
    <div className="max-w-[1300px] w-full mx-auto">
      <div className="mb-12">
        <span className="text-[13px] font-bold tracking-[0.3em] text-[#111111]/30 uppercase block mb-3 pt1-fu">전략적 가치</span>
        <h2 className="text-[44px] md:text-[60px] font-black tracking-tight leading-none pt1-fu pt1-d2">
          비즈니스 시너지와 활용 방안
        </h2>
        <p className="mt-3 text-[15px] text-[#111111]/45 font-medium pt1-fu pt1-d3">
          성장 정체에 직면한 전통 산업군 및 플랫폼들과의 유기적 융합 시나리오.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-8">
        <div className="flex flex-col border-l border-[#111111]/15 pl-8 py-4 pt1-fu" style={{ animationDelay: '400ms' }}>
          <span className="text-[12.5px] font-bold tracking-tight text-[#111111]/45 mb-4 block leading-none">
            시나리오 01 / 전통 산업의 전환
            <span className="font-['Space_Grotesk'] text-[9.5px] font-bold tracking-wider text-[#111111]/25 uppercase ml-1.5">TRADITIONAL PIVOT</span>
          </span>
          <h3 className="text-[22px] font-black tracking-tight mb-4 leading-tight break-keep text-[#111111]">
            성장 정체 산업의 신규 매출 확장
          </h3>
          <p className="text-[14px] leading-[1.6] text-[#111111]/50 tracking-tight break-keep mb-6">
            기존 산업은 제품 판매 중심의 성장에 머물렀으나, WoC를 통해 커뮤니티 기반 반복 매출 모델을 결합하여 새로운 사업 돌파구를 만듭니다.
          </p>
          <div className="mt-auto border-t border-[#111111]/5 pt-4 text-[12px] flex flex-col gap-3">
            <div>
              <span className="text-[#111111]/30 font-bold block text-[10px] uppercase mb-1">대상 산업군</span>
              <p className="font-bold text-[#111111]/70 leading-tight">제지 · 섬유 · 패션 · 생활용품 · 교육 · 레저</p>
              <p className="text-[9.5px] text-[#111111]/35 mt-0.5">(참고: 한솔제지, 무림, LF, F&F, 깨끗한나라, 대교 등)</p>
            </div>
            <div className="grid grid-cols-2 gap-2 border-t border-[#111111]/5 pt-3 text-[11px] leading-tight">
              <div>
                <span className="text-red-500/60 font-bold block text-[9px] uppercase mb-0.5">기존 구조</span>
                <p className="text-[#111111]/50">제품 판매 · 일회성 거래</p>
              </div>
              <div>
                <span className="text-emerald-600/70 font-bold block text-[9px] uppercase mb-0.5">WoC 전환</span>
                <p className="text-[#111111] font-bold">커뮤니티 기반 반복 매출</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col border-l border-[#111111]/15 pl-8 py-4 pt1-fu" style={{ animationDelay: '550ms' }}>
          <span className="text-[12.5px] font-bold tracking-tight text-[#111111]/45 mb-4 block leading-none">
            시나리오 02 / 빅테크의 인프라 선점
            <span className="font-['Space_Grotesk'] text-[9.5px] font-bold tracking-wider text-[#111111]/25 uppercase ml-1.5">TECH INFRASTRUCTURE</span>
          </span>
          <h3 className="text-[22px] font-black tracking-tight mb-4 leading-tight break-keep text-[#111111]">
            빅테크 플랫폼 확장
          </h3>
          <p className="text-[14px] leading-[1.6] text-[#111111]/50 tracking-tight break-keep mb-6">
            기존 카카오, 네이버 등 online 메신저와 단순 피드 소통 위주의 서비스 한계를 넘어, 오프라인 실물 사교 인프라 예약/결제 영역을 직접 장악합니다.
          </p>
          <div className="mt-auto border-t border-[#111111]/5 pt-4 text-[12px] flex flex-col gap-3">
            <div>
              <span className="text-[#111111]/30 font-bold block text-[10px] uppercase mb-1">인프라 레이어 선점</span>
              <p className="font-bold text-[#111111]/70 leading-tight">온라인 커뮤니티의 오프라인화</p>
            </div>
            <div className="grid grid-cols-2 gap-2 border-t border-[#111111]/5 pt-3 text-[11px] leading-tight">
              <div>
                <span className="text-[#111111]/30 font-bold block text-[9px] uppercase mb-0.5">기존 구조</span>
                <p className="text-[#111111]/50">메신저 · 온라인 피드 광고</p>
              </div>
              <div>
                <span className="text-emerald-600/70 font-bold block text-[9px] uppercase mb-0.5">WoC 전환</span>
                <p className="text-[#111111] font-bold">오프라인 활동 예약 결제망</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col border-l border-[#111111]/15 pl-8 py-4 pt1-fu" style={{ animationDelay: '700ms' }}>
          <span className="text-[12.5px] font-bold tracking-tight text-[#111111]/45 mb-4 block leading-none">
            시나리오 03 / 로컬 경제의 비즈니스화
            <span className="font-['Space_Grotesk'] text-[9.5px] font-bold tracking-wider text-[#111111]/25 uppercase ml-1.5">LOCAL MONETIZATION</span>
          </span>
          <h3 className="text-[22px] font-black tracking-tight mb-4 leading-tight break-keep text-[#111111]">
            당근 및 로컬 플랫폼
          </h3>
          <p className="text-[14px] leading-[1.6] text-[#111111]/50 tracking-tight break-keep mb-6">
            지역 기반 중고거래와 단순 게시판 소모임을 넘어, 실제 오프라인 사교 활동과 클래스 결제/정산 생태계로 진화하는 로컬 비즈니스 최종 모델을 완성합니다.
          </p>
          <div className="mt-auto border-t border-[#111111]/5 pt-4 text-[12px] flex flex-col gap-3">
            <div>
              <span className="text-[#111111]/30 font-bold block text-[10px] uppercase mb-1">로컬 경제 시스템</span>
              <p className="font-bold text-[#111111]/70 leading-tight">지역 강습 및 정기 사교 모임 수용</p>
            </div>
            <div className="grid grid-cols-2 gap-2 border-t border-[#111111]/5 pt-3 text-[11px] leading-tight">
              <div>
                <span className="text-[#111111]/30 font-bold block text-[9px] uppercase mb-0.5">기존 구조</span>
                <p className="text-[#111111]/50">중고거래 · 로컬 커뮤니티 피드</p>
              </div>
              <div>
                <span className="text-emerald-600/70 font-bold block text-[9px] uppercase mb-0.5">WoC 전환</span>
                <p className="text-[#111111] font-bold">오프라인 활동 결제 정산망</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// Slide 12: 투자 회수 가능성 (Revenue & BEP)
export const Slide12 = () => (
  <div className="relative z-10 flex flex-col w-full h-full bg-[#fcf8f8] text-[#111111] px-[100px] justify-center overflow-hidden">
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <div className="text-[25vw] font-black text-[#111111]/[0.015] leading-none select-none whitespace-nowrap">
        REVENUE
      </div>
    </div>
    
    <div className="max-w-[1200px] w-full relative z-10 flex flex-col justify-center">
      <span className="text-[13px] font-bold tracking-[0.4em] text-[#111111]/30 uppercase block mb-10 pt1-fu">투자 회수 가능성</span>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
        <div className="flex flex-col pt1-sl pt1-d2">
          <h2 className="text-[44px] md:text-[54px] font-black tracking-tight leading-[1.1] mb-6 pt1-gp">
            첫 매출까지 1개월 이내
          </h2>
          <p className="text-[15px] text-[#111111]/55 leading-[1.6] mb-8 break-keep">
            탱고 시장에는 이미 수업 · 밀롱가 · 워크샵 · 공연 · 축제 거래가 활발히 실존하고 있습니다. WoC는 새로운 거래 수요를 개척하는 것이 아니라, <span className="text-[#111111] font-bold">기존에 돌아가던 실물 거래를 플랫폼으로 즉시 연결</span>합니다. 따라서 서비스 론칭 직후 1개월 이내에 첫 매출 창출을 보장합니다.
          </p>
          <div className="flex items-center gap-4 bg-[#111111]/[0.02] border border-[#111111]/10 p-5 rounded-sm max-w-[380px]">
            <span className="text-[11px] font-bold tracking-wider text-[#111111]/45 uppercase block">첫 매출</span>
            <div className="w-[1px] h-[30px] bg-[#111111]/10 mx-2" />
            <span className="text-[20px] font-black text-[#111111] tracking-tight">1개월 이내 실현</span>
          </div>
        </div>

        <div className="flex flex-col border-t lg:border-t-0 lg:border-l border-[#111111]/10 pt-8 lg:pt-0 lg:pl-16 pt1-sr pt1-d4">
          <h2 className="text-[44px] md:text-[54px] font-black tracking-tight leading-[1.1] mb-6 pt1-gp">
            극도로 낮은 손익분기점 (BEP)
          </h2>
          <p className="text-[15px] text-[#111111]/55 leading-[1.6] mb-8 break-keep">
            기획부터 DB 설계, 디자인, 전체 개발 및 운영 전 과정을 1인이 직접 풀스택으로 수행합니다. 대규모 고정비나 개발 인건비, 불필요한 마케팅 대행 조직을 차단하여 <span className="text-[#111111] font-bold">초기 커뮤니티 확보 단계에서 손익분기점(BEP)을 즉시 돌파</span>합니다.
          </p>
          <div className="flex items-center gap-4 bg-[#111111]/[0.02] border border-[#111111]/10 p-5 rounded-sm max-w-[380px]">
            <span className="text-[11px] font-bold tracking-wider text-[#111111]/45 uppercase block">손익분기점</span>
            <div className="w-[1px] h-[30px] bg-[#111111]/10 mx-2" />
            <span className="text-[20px] font-black text-emerald-600 tracking-tight">초기 확보 단계 즉시 달성</span>
          </div>
        </div>
      </div>

      <div className="mt-12 p-6 border border-[#111111]/10 bg-[#111111]/[0.01] text-center pt1-fu pt1-d6">
        <p className="text-[15px] md:text-[17px] font-bold tracking-tight text-[#111111]/80 leading-relaxed break-keep">
          &ldquo;중요한 것은 사용자가 아니라 거래입니다.&rdquo;
        </p>
        <p className="mt-2 text-[13px] text-[#111111]/50 leading-relaxed break-keep max-w-[900px] mx-auto">
          WoC는 사용자를 대거 모은 뒤 비즈니스 모델을 고민하는 플랫폼이 아닙니다. 이미 수억 대의 실물 거래가 활발히 작동하는 사교 커뮤니티의 예약 결제 인프라를 타겟하여 즉시 실질 수익을 창출하는 비즈니스 OS입니다.
        </p>
      </div>

      <div className="w-full h-[1px] bg-[#111111]/10 my-10" />

      <div className="flex flex-col md:flex-row justify-between items-center gap-4 pt1-fu pt1-d9">
        <p className="text-[12px] font-medium tracking-tight text-[#111111]/30">
          World of Community 2026. Confidential.
        </p>
        <div className="flex flex-col items-end gap-1.5 text-right">
          <p className="text-[15px] font-black text-[#111111] tracking-tight">
            취미를 위한 플랫폼, WoC
          </p>
          <p className="font-['Space_Grotesk'] text-[12px] font-bold tracking-[0.2em] text-[#111111]/40 uppercase">
            The Operating System for Human Communities
          </p>
        </div>
      </div>
    </div>
  </div>
);

// Slide 13: 클로징 (WORLD OF COMMUNITY_ Life Goes On.)
export const Slide13 = () => (
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
