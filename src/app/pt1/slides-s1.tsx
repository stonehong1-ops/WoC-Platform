import React from 'react';

// Slide 0: WoC (Intro Cover)
export const Slide0 = () => (
  <div className="relative z-10 flex flex-col w-full h-full bg-[#111111] text-[#fcf8f8] px-[100px] justify-center overflow-hidden">
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <div className="w-[600px] h-[600px] rounded-full bg-white/[0.01] blur-[120px] pt1-si" />
    </div>
    <div className="max-w-[1200px] w-full relative z-10 text-center">
      <h2 className="font-['Space_Grotesk'] text-[72px] md:text-[96px] font-black tracking-[0.1em] text-white/95 uppercase block leading-none mb-6 pt1-fu">
        WoC
      </h2>
      <p className="font-['Space_Grotesk'] text-[18px] md:text-[22px] font-bold tracking-[0.3em] text-white/45 uppercase mb-8 pt1-fu pt1-d2">
        WORLD OF COMMUNITY
      </p>
      <div className="inline-block w-12 h-[2px] bg-emerald-500 mb-8 pt1-lg pt1-d3" />
      <p className="text-[18px] md:text-[20px] font-bold text-white/70 leading-tight tracking-tight pt1-fu pt1-d4">
        사람들의 활동을 운영하는 플랫폼
      </p>
    </div>
  </div>
);

// Slide 1: THE STORY (Table of Contents / Story Flow)
export const Slide1 = () => {
  const steps = [
    { eng: 'MONEY FLOWS HERE', label: '사람들이 실제로 돈을 쓰는 시장' },
    { eng: 'THE LAST PLATFORM', label: '아직 지배적 플랫폼이 없는 영역' },
    { eng: 'WHY NO WINNER YET', label: '문제는 기능이 아니라 운영체계의 부재' },
    { eng: 'ONE PLATFORM', label: '수많은 커뮤니티를 하나의 OS로 통합' },
    { eng: 'LIFE GOES ON_', label: '사용자의 취미는 고정되지 않고 이동함' },
    { eng: 'FRAGMENTED WORLD', label: '파편화되고 로컬화된 기존 서비스 극복' },
    { eng: 'THE FIRST SOCIETY', label: '작은 탱고 커뮤니티에서 비즈니스 작동 증명' },
    { eng: 'PENETRATION STRATEGY', label: '작은 커뮤니티에서 범용 운영체계로의 진화' },
    { eng: 'THE NEXT 60 SOCIETIES', label: '검증된 운영체계의 범용 복사' },
    { eng: 'STRATEGIC VALUE', label: '정체 산업 및 빅테크 플랫폼과의 시너지' },
    { eng: 'WHY NOW', label: '빠른 BEP 돌파와 즉각적인 거래 중심 성장' }
  ];

  return (
    <div className="relative z-10 flex flex-col w-full h-full bg-[#fcf8f8] text-[#111111] px-[100px] justify-center overflow-hidden">
      <div className="max-w-[1200px] w-full relative z-10">
        <h2 className="font-['Space_Grotesk'] text-[44px] md:text-[56px] font-black tracking-[0.05em] text-[#111111]/90 uppercase block leading-none mb-4 pt1-fu">
          THE STORY
        </h2>
        <p className="text-[16px] md:text-[18px] font-bold text-[#111111]/45 leading-tight tracking-tight mb-8 pt1-fu pt1-d2">
          왜 우리는 WoC를 만드는가
        </p>

        <div className="flex flex-col gap-2 max-w-[800px] pt1-si pt1-d3">
          {steps.map((step, idx) => (
            <div key={idx} className="flex items-center gap-6 group hover:translate-x-2 transition-transform duration-200">
              <span className="font-['Space_Grotesk'] text-[12px] font-black text-emerald-600 w-8">
                0{idx + 1}
              </span>
              <div className="flex-1 flex justify-between items-center border-b border-[#111111]/5 pb-2">
                <span className="font-['Space_Grotesk'] text-[15px] font-black tracking-wider text-[#111111]/85">
                  {step.eng}
                </span>
                <span className="text-[13px] font-bold text-[#111111]/40">
                  {step.label}
                </span>
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
    { value: '108억', eng: '10.8 BILLION', label: '전체 소셜시장 거래 규모' },
    { value: '32억', eng: '3.2 BILLION', label: 'WoC 타겟 결제 거래액' },
    { value: '2.2억', eng: '220 MILLION', label: '수수료 기반 플랫폼 매출' }
  ];

  return (
    <div className="relative z-10 flex flex-col w-full h-full bg-[#fcf8f8] text-[#111111] px-[100px] justify-center overflow-hidden">
      <div className="max-w-[1200px] w-full relative z-10">
        <h2 className="font-['Space_Grotesk'] text-[44px] md:text-[56px] font-black tracking-[0.05em] text-[#111111]/90 uppercase block leading-none mb-4 pt1-fu">
          MONEY FLOWS HERE
        </h2>
        <p className="text-[16px] md:text-[18px] font-bold text-[#111111]/45 leading-tight tracking-tight mb-12 pt1-fu pt1-d2">
          Money Flows Here ➔ 실제 돈이 흐르는 시장 (통계청 기준 1인 월 평균 약 <span className="font-['Space_Grotesk'] font-bold text-[#111111]">45</span>만원 취미·문화·활동 소비)
        </p>

        <div className="grid grid-cols-3 gap-8 border-t border-b border-[#111111]/10 py-12 pt1-si pt1-d4">
          {stats.map((item, idx) => (
            <div key={idx} className="flex flex-col items-start p-2">
              <span className="font-['Space_Grotesk'] text-[10px] font-bold tracking-wider text-[#111111]/30 uppercase mb-2">
                {item.eng}
              </span>
              <span className="text-[52px] md:text-[64px] font-black text-[#111111] tracking-tighter leading-none mb-3">
                {item.value}
              </span>
              <p className="text-[13.5px] font-bold text-[#111111]/60">
                {item.label}
              </p>
            </div>
          ))}
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
        <p className="text-[16px] md:text-[18px] font-bold text-[#111111]/45 leading-tight tracking-tight mb-12 pt1-fu pt1-d2">
          아직 지배적 플랫폼이 없습니다
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
              미개척 영역 (취미·활동·커뮤니티 경제)
            </span>
            <div className="border border-dashed border-emerald-600/30 bg-emerald-600/[0.01] p-6 rounded-sm flex flex-col justify-center items-center text-center relative group hover:bg-emerald-600/[0.03] transition-all">
              <span className="text-[18px] font-black text-[#111111]/40 mb-1">No Winner Yet</span>
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

// Slide 4: WHY NO WINNER YET
export const Slide4 = () => {
  const tools = [
    { title: '위버스', target: '팬덤 전용', limit: '아티스트-팬 일방향 소통 한계' },
    { title: '클래스101', target: '교육 전용', limit: '동영상 시청 중심, 교류 없음' },
    { title: '온오프믹스', target: '행사 전용', limit: '일회성 단순 예약에 그침' },
    { title: '커뮤니티 플랫폼', target: '소통 전용', limit: '게시판 중심, 정산/결제 불가' }
  ];

  return (
    <div className="relative z-10 flex flex-col w-full h-full bg-[#fcf8f8] text-[#111111] px-[100px] justify-center overflow-hidden">
      <div className="max-w-[1200px] w-full relative z-10">
        <h2 className="font-['Space_Grotesk'] text-[44px] md:text-[56px] font-black tracking-[0.05em] text-[#111111]/90 uppercase block leading-none mb-4 pt1-fu">
          WHY NO WINNER YET
        </h2>
        <p className="text-[16px] md:text-[18px] font-bold text-[#111111]/45 leading-tight tracking-tight mb-12 pt1-fu pt1-d2">
          문제는 기능이 아니라 운영입니다
        </p>

        <div className="grid grid-cols-12 gap-8 items-stretch border-t border-b border-[#111111]/10 py-10 pt1-si pt1-d3">
          {/* 좌측: 기존 대표 툴들 */}
          <div className="col-span-7 grid grid-cols-2 gap-4 border-r border-[#111111]/10 pr-8">
            {tools.map((t) => (
              <div key={t.title} className="border border-[#111111]/10 bg-white/40 p-5 rounded-sm flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-baseline mb-2">
                    <span className="text-[18px] font-black text-[#111111]">{t.title}</span>
                    <span className="text-[10px] font-black text-[#111111]/40 uppercase tracking-widest">{t.target}</span>
                  </div>
                  <p className="text-[12.5px] text-[#111111]/50 leading-relaxed break-keep">{t.limit}</p>
                </div>
              </div>
            ))}
          </div>

          {/* 우측: WoC 중앙 허브 */}
          <div className="col-span-5 flex flex-col justify-center items-center text-center pl-6">
            <span className="text-[11px] font-bold tracking-widest text-emerald-600 uppercase mb-4 block">THE WOC OS SOLUTION</span>
            <div className="border-2 border-emerald-600 bg-emerald-600/[0.02] p-8 rounded-sm w-full">
              <span className="text-[28px] font-black text-[#111111] leading-none block mb-3">WoC OS</span>
              <p className="text-[16px] font-black text-emerald-600 leading-snug tracking-tight break-keep">
                기능은 많지만<br/>운영체계는 없었습니다
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Slide 5: ONE PLATFORM
export const Slide5 = () => {
  const ringItems = [
    { name: '커뮤니티', x: 250, y: 70 },
    { name: '클래스', x: 377, y: 123 },
    { name: '행사', x: 430, y: 250 },
    { name: '결제', x: 377, y: 377 },
    { name: '정산', x: 250, y: 430 },
    { name: '장소', x: 123, y: 377 },
    { name: '멤버십', x: 70, y: 250 },
    { name: '회원관리', x: 123, y: 123 },
  ];

  return (
    <div className="relative z-10 flex flex-col w-full h-full bg-[#fcf8f8] text-[#111111] px-[80px] justify-center overflow-hidden">
      <div className="max-w-[1300px] w-full mx-auto relative z-10">
        <h2 className="font-['Space_Grotesk'] text-[44px] md:text-[56px] font-black tracking-[0.05em] text-[#111111]/90 uppercase block leading-none mb-4 pt1-fu">
          ONE PLATFORM
        </h2>
        <p className="text-[16px] md:text-[18px] font-bold text-[#111111]/45 leading-tight tracking-tight mb-4 pt1-fu pt1-d2">
          수많은 커뮤니티를 하나의 운영체계로
        </p>

        <div className="flex justify-center items-center pt1-si pt1-d4 relative h-[450px]">
          <div className="w-[360px] h-[360px] relative flex items-center justify-center bg-white/20 rounded-full border border-[#111111]/10">
            <div className="w-[180px] h-[180px] rounded-full border-4 border-emerald-600 bg-white flex flex-col items-center justify-center p-4 shadow-[0_15px_45px_rgba(0,0,0,0.06)] z-10 text-center">
              <h4 className="text-[26px] font-black tracking-tighter text-[#111111] leading-none mb-1">
                WoC OS
              </h4>
              <p className="text-[9.5px] font-black text-emerald-600 tracking-widest uppercase">Operating System</p>
            </div>
            
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" viewBox="0 0 500 500">
              <circle cx={250} cy={250} r={180} fill="none" stroke="#111111" strokeWidth="0.75" strokeDasharray="6 6" opacity="0.2" />
              {ringItems.map(item => (
                <line key={item.name} x1={250} y1={250} x2={item.x} y2={item.y} stroke="#059669" strokeWidth="1" opacity="0.3" />
              ))}
            </svg>

            {ringItems.map((item) => (
              <div
                key={item.name}
                style={{
                  left: `${item.x}px`,
                  top: `${item.y}px`,
                  transform: 'translate(-50%, -50%)',
                }}
                className="absolute px-4 py-2 rounded-xl border border-emerald-600/10 bg-emerald-500/[0.02] text-[13.5px] font-black text-[#111111]/70 shadow-2xs z-20 hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transition-all duration-300 cursor-default"
              >
                {item.name}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Slide 6: LIFE GOES ON_
export const Slide6 = () => {
  const categories = [
    { num: '01', title: 'Stage', items: '살사 · 탱고 · 스윙' },
    { num: '02', title: 'Road', items: '러닝 · 자전거 · 캠핑' },
    { num: '03', title: 'Table', items: '위스키 · 요리 · 커피' },
    { num: '04', title: 'Muse', items: '영화 · 음악 · 미술' },
    { num: '05', title: 'Mind', items: '어학 · 글쓰기 · 식물' }
  ];

  return (
    <div className="relative z-10 flex flex-col w-full h-full bg-[#fcf8f8] text-[#111111] px-[80px] justify-center overflow-hidden">
      <div className="max-w-[1300px] w-full mx-auto relative z-10">
        <h2 className="font-['Space_Grotesk'] text-[44px] md:text-[56px] font-black tracking-[0.05em] text-[#111111]/90 uppercase block leading-none mb-4 pt1-fu">
          LIFE GOES ON_
        </h2>
        <p className="text-[16px] md:text-[18px] font-bold text-[#111111]/45 leading-tight tracking-tight mb-12 pt1-fu pt1-d2">
          사람들은 하나의 취미만 하지 않습니다 (Ecosystem Network Effect)
        </p>

        <div className="grid grid-cols-12 gap-8 items-stretch pt1-si pt1-d4">
          {/* 좌측: 카테고리 정보 요약 */}
          <div className="col-span-4 flex flex-col gap-2 border-r border-[#111111]/10 pr-6">
            <span className="text-[10px] font-bold tracking-widest text-[#111111]/45 uppercase block mb-2">WoC Life Themes</span>
            <div className="flex flex-col gap-2">
              {categories.map((cat, idx) => (
                <div key={idx} className="border border-[#111111]/10 bg-white/40 px-4 py-2.5 rounded-sm flex justify-between items-center">
                  <span className="text-[13px] font-black text-[#111111]/80">{cat.title}</span>
                  <span className="text-[11px] font-bold text-[#111111]/40">{cat.items}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 우측: 거대하고 강력한 네트워크 효과 흐름 */}
          <div className="col-span-8 flex flex-col justify-center bg-emerald-600/[0.02] border border-emerald-600/10 p-8 rounded-sm text-center">
            <span className="text-[11px] font-black text-emerald-600 uppercase tracking-[0.2em] mb-8 block font-['Space_Grotesk']">Network Effect Dynamics</span>
            <div className="flex justify-around items-center max-w-[700px] mx-auto w-full relative">
              <div className="flex flex-col items-center">
                <span className="font-['Space_Grotesk'] text-[24px] font-black text-[#111111]/90">People move.</span>
                <span className="text-[11px] font-bold text-[#111111]/40 mt-1">사용자는 취미를 이동함</span>
              </div>
              <span className="text-[20px] font-black text-emerald-600 animate-pulse">➔</span>
              <div className="flex flex-col items-center">
                <span className="font-['Space_Grotesk'] text-[24px] font-black text-[#111111]/90">Communities move.</span>
                <span className="text-[11px] font-bold text-[#111111]/40 mt-1">커뮤니티가 연쇄 이동함</span>
              </div>
              <span className="text-[20px] font-black text-emerald-600 animate-pulse">➔</span>
              <div className="flex flex-col items-center">
                <span className="font-['Space_Grotesk'] text-[24px] font-black text-[#111111]/90">Money moves.</span>
                <span className="text-[11px] font-bold text-[#111111]/40 mt-1">소비액과 결제망이 확장됨</span>
              </div>
              <span className="text-[20px] font-black text-emerald-600 animate-pulse">➔</span>
              <div className="flex flex-col items-center">
                <span className="font-['Space_Grotesk'] text-[28px] font-black text-emerald-600">WoC grows.</span>
                <span className="text-[11px] font-black text-emerald-600/60 mt-1">플랫폼의 폭발적 성장</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Slide 7: FRAGMENTED WORLD
export const Slide7 = () => {
  const legacyItems = ['커뮤니티', '교육', '행사', '예약', '상점', '운영'];
  const cities = ['서울', '부산', '도쿄', '홍콩', '싱가포르', '부에노스아이레스'];

  return (
    <div className="relative z-10 flex flex-col w-full h-full bg-[#fcf8f8] text-[#111111] px-[80px] justify-center overflow-hidden">
      <div className="max-w-[1300px] w-full mx-auto relative z-10">
        <h2 className="font-['Space_Grotesk'] text-[44px] md:text-[56px] font-black tracking-[0.05em] text-[#111111]/90 uppercase block leading-none mb-4 pt1-fu">
          FRAGMENTED WORLD
        </h2>
        <p className="text-[16px] md:text-[18px] font-bold text-[#111111]/45 leading-tight tracking-tight mb-12 pt1-fu pt1-d2">
          기존 서비스는 분리되어 있습니다
        </p>

        <div className="grid grid-cols-12 gap-10 items-stretch">
          {/* 좌측: Problem 01 & 02 */}
          <div className="col-span-5 flex flex-col gap-6 border-r border-[#111111]/10 pr-10 pt1-sl pt1-d3">
            <div className="border border-red-500/10 bg-red-500/[0.01] p-5 rounded-sm">
              <span className="text-[10px] font-bold tracking-widest text-red-500/70 uppercase block mb-1">Problem 01 / 파편화</span>
              <p className="text-[13px] text-[#111111]/50 mb-3 font-medium">각기 다른 도구로 흩어진 운영</p>
              <div className="flex flex-wrap gap-1.5">
                {legacyItems.map(item => (
                  <span key={item} className="px-2 py-0.5 bg-red-500/[0.03] border border-red-500/15 rounded-sm text-[12px] font-bold text-red-500/60">{item}</span>
                ))}
              </div>
            </div>

            <div className="border border-red-500/10 bg-red-500/[0.01] p-5 rounded-sm">
              <span className="text-[10px] font-bold tracking-widest text-red-500/70 uppercase block mb-1">Problem 02 / 로컬화</span>
              <p className="text-[13px] text-[#111111]/50 mb-3 font-medium">지역에 갇혀 교류 없는 생태계</p>
              <div className="flex flex-wrap gap-1.5">
                {cities.map(city => (
                  <span key={city} className="px-2 py-0.5 bg-red-500/[0.03] border border-red-500/15 rounded-sm text-[12px] font-bold text-red-500/60">{city}</span>
                ))}
              </div>
            </div>
          </div>

          {/* 우측: WoC 중앙 허브 */}
          <div className="col-span-7 flex flex-col items-center justify-center pl-10 pt1-sr pt1-d4 relative">
            <div className="w-[360px] h-[360px] relative flex items-center justify-center bg-white/10 rounded-full border border-[#111111]/5">
              <div className="w-[180px] h-[180px] rounded-full border-2 border-[#111111] bg-white flex flex-col items-center justify-center p-4 shadow-[0_15px_40px_rgba(0,0,0,0.05)] z-10 text-center">
                <h4 className="text-[28px] font-black tracking-tighter text-[#111111] leading-none mb-1">
                  WoC
                </h4>
                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-2">통합 & 글로벌</p>
                <div className="w-8 h-[1.5px] bg-[#111111] mb-2" />
                <p className="text-[11px] font-bold leading-tight text-[#111111]/60 tracking-tight">
                  파편화에서 통합으로<br/>지역에서 글로벌로
                </p>
              </div>

              {cities.map((city, idx) => {
                const angles = [0, 60, 120, 180, 240, 300];
                const rad = (angles[idx] * Math.PI) / 180;
                const x = 180 + Math.cos(rad) * 130;
                const y = 180 + Math.sin(rad) * 130;
                return (
                  <div
                    key={city}
                    style={{ left: `${x}px`, top: `${y}px`, transform: 'translate(-50%, -50%)' }}
                    className="absolute px-2.5 py-1 rounded-full border border-[#111111]/15 bg-white text-[11px] font-black text-[#111111] shadow-xs z-20"
                  >
                    {city}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Slide 8: THE FIRST SOCIETY
export const Slide8 = () => {
  const validations = ['Community', 'Class', 'Event', 'Payment', 'Settlement', 'Global Visitors'];

  return (
    <div className="relative z-10 flex flex-col w-full h-full bg-[#fcf8f8] text-[#111111] px-[100px] justify-center overflow-hidden">
      <div className="max-w-[1200px] w-full relative z-10">
        <h2 className="font-['Space_Grotesk'] text-[44px] md:text-[56px] font-black tracking-[0.05em] text-[#111111]/90 uppercase block leading-none mb-4 pt1-fu">
          THE FIRST SOCIETY
        </h2>
        <p className="text-[16px] md:text-[18px] font-bold text-[#111111]/45 leading-tight tracking-tight mb-12 pt1-fu pt1-d2">
          작은 커뮤니티에서 먼저 증명합니다
        </p>

        <div className="grid grid-cols-12 gap-10 items-stretch border-t border-b border-[#111111]/10 py-12">
          <div className="col-span-5 flex flex-col justify-center pt1-sl pt1-d3">
            <span className="font-['Space_Grotesk'] text-[18px] font-black text-emerald-600 mb-2">2026</span>
            <span className="text-[72px] font-black text-[#111111] leading-none tracking-tighter mb-4">Tango</span>
            <span className="text-[24px] font-bold text-[#111111]/60 tracking-tight">2,000 Members</span>
          </div>

          <div className="col-span-7 flex flex-col justify-center pl-10 border-l border-[#111111]/10 pt1-sr pt1-d4">
            <span className="text-[10px] font-bold tracking-widest text-[#111111]/45 uppercase mb-6 block">CORE VALIDATION LIST</span>
            <div className="grid grid-cols-2 gap-4">
              {validations.map(val => (
                <div key={val} className="flex items-center gap-3 bg-[#111111]/[0.01] border border-[#111111]/5 px-5 py-3.5 rounded-sm">
                  <span className="text-emerald-600 font-bold text-[14px]">✓</span>
                  <span className="text-[15px] font-black text-[#111111]/70">{val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-between items-center pt1-fu pt1-d6">
          <p className="text-[12.5px] font-semibold text-[#111111]/45 tracking-tight">
            * 시장 확사 목적이 아닌, 운영체계(OS) 모델의 무결한 작동을 검증했습니다.
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
        <span className="font-['Space_Grotesk'] text-[36px] font-black text-emerald-600 pt1-fu">2027 H1</span>
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
            <div className="border border-[#111111]/10 bg-white p-4 rounded-sm text-center shadow-3xs z-10">
              <span className="text-[11px] text-[#111111]/40 block mb-1">Step 01</span>
              <span className="text-[14px] font-black text-[#111111]">Leader Network</span>
            </div>
            <div className="border border-emerald-600 bg-emerald-500/[0.03] p-4 rounded-sm text-center shadow-3xs z-10">
              <span className="text-[11px] text-emerald-600/50 block mb-1">Step 02</span>
              <span className="text-[14px] font-black text-emerald-600">WoC OS</span>
            </div>
            <div className="border border-[#111111]/10 bg-white p-4 rounded-sm text-center shadow-3xs z-10">
              <span className="text-[11px] text-[#111111]/40 block mb-1">Step 03</span>
              <span className="text-[14px] font-black text-[#111111]">Community Org</span>
            </div>
            <div className="border border-emerald-600/20 bg-white p-4 rounded-sm text-center shadow-3xs z-10">
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
        <span className="font-['Space_Grotesk'] text-[36px] font-black text-emerald-600 pt1-fu">2027 H2</span>
      </div>

      <div className="grid grid-cols-12 gap-8 items-stretch border-t border-b border-[#111111]/10 py-10">
        {/* 좌측: 기존 댄스 커뮤니티 워크플로 */}
        <div className="col-span-5 flex flex-col justify-center pr-8 border-r border-[#111111]/10 pt1-sl pt1-d3">
          <span className="text-[10px] font-bold tracking-widest text-[#111111]/45 uppercase mb-3 block">COMMUNITY WORKFLOW</span>
          <div className="bg-[#111111]/[0.01] border border-[#111111]/5 p-6 rounded-sm text-center">
            <div className="flex justify-center items-center gap-3 mb-2">
              <span className="font-black text-[#111111]">탱고</span>
              <span className="text-[#111111]/30">➔</span>
              <span className="font-black text-[#111111]">살사</span>
              <span className="text-[#111111]/30">➔</span>
              <span className="font-black text-[#111111]">바차타</span>
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
          <span className="text-[10px] uppercase tracking-widest text-[#111111]/40 block">Complexity</span>
        </div>

        {/* 우측: 더 큰 매스마켓 (학원/교육 웰니스 시장) */}
        <div className="col-span-5 flex flex-col justify-center pl-8 pt1-sr pt1-d3">
          <span className="text-[10px] font-bold tracking-widest text-[#111111]/45 uppercase mb-3 block">ACADEMY WORKFLOW (YOGA / PILATES)</span>
          <div className="border border-emerald-600/20 bg-emerald-600/[0.01] p-6 rounded-sm">
            <div className="grid grid-cols-3 gap-2 text-[12.5px] text-[#111111]/85 font-black text-center mb-4">
              <span className="px-2 py-1 bg-white border border-[#111111]/10 rounded-sm">강사</span>
              <span className="px-2 py-1 bg-white border border-[#111111]/10 rounded-sm">학원</span>
              <span className="px-2 py-1 bg-white border border-[#111111]/10 rounded-sm">수강생</span>
              <span className="px-2 py-1 bg-white border border-[#111111]/10 rounded-sm">결제</span>
              <span className="px-2 py-1 bg-white border border-[#111111]/10 rounded-sm">회원관리</span>
              <span className="px-2 py-1 bg-white border border-[#111111]/10 rounded-sm">재등록</span>
            </div>
            <p className="text-[12.5px] text-[#111111]/50 leading-relaxed">
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
            <span className="font-['Space_Grotesk'] text-[12px] font-black text-emerald-600 block mb-1">2028</span>
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
      <h2 className="font-['Space_Grotesk'] text-[44px] md:text-[56px] font-black tracking-[0.05em] text-[#111111]/90 uppercase block leading-none mb-4 pt1-fu">
        ANGEL ROUND
      </h2>
      <p className="text-[16px] md:text-[18px] font-bold text-[#111111]/45 leading-tight tracking-tight mb-10 pt1-fu pt1-d2">
        투자 유치 계획 (Angel Investment Round)
      </p>

      <div className="flex flex-col gap-8">
        {/* 1단: 상단 (핵심 숫자) */}
        <div className="grid grid-cols-3 gap-6 pt1-fu pt1-d3">
          <div className="border border-[#111111]/10 bg-[#111111]/[0.01] p-6 rounded-sm flex flex-col justify-center items-center text-center">
            <span className="text-[11px] font-bold tracking-wider text-[#111111]/45 uppercase mb-2">투자 규모</span>
            <span className="text-[36px] font-black text-[#111111] tracking-tight">7,000만원</span>
          </div>
          <div className="border border-[#111111]/10 bg-[#111111]/[0.01] p-6 rounded-sm flex flex-col justify-center items-center text-center">
            <span className="text-[11px] font-bold tracking-wider text-[#111111]/45 uppercase mb-2">지분 구조</span>
            <span className="text-[36px] font-black text-[#111111] tracking-tight">20% 지분 인수</span>
          </div>
          <div className="border border-[#111111]/10 bg-[#111111]/[0.01] p-6 rounded-sm flex flex-col justify-center items-center text-center">
            <span className="text-[11px] font-bold tracking-wider text-[#111111]/45 uppercase mb-2">기업 가치</span>
            <span className="text-[36px] font-black text-emerald-600 tracking-tight">3.5억원</span>
          </div>
        </div>

        {/* 2단: 중단 (사용 계획) */}
        <div className="grid grid-cols-2 gap-8 pt1-fu pt1-d4">
          <div className="border border-[#111111]/10 bg-white/40 p-6 rounded-sm flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-baseline mb-4 border-b border-[#111111]/10 pb-2">
                <h3 className="text-[16px] font-black text-[#111111]">창업자 선투입 비용 일부 정산</h3>
                <span className="text-[20px] font-black text-[#111111]/70">2,000만원 <span className="text-[13px] text-[#111111]/40 font-medium">(29%)</span></span>
              </div>
              <p className="text-[13.5px] text-[#111111]/50 leading-relaxed break-keep mt-2">
                개발 및 운영 과정에서 선투입한 비용 일부 회수
              </p>
            </div>
          </div>

          <div className="border border-[#111111]/10 bg-white/40 p-6 rounded-sm flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-baseline mb-4 border-b border-[#111111]/10 pb-2">
                <h3 className="text-[16px] font-black text-emerald-600">제품 고도화 및 운영 자금</h3>
                <span className="text-[20px] font-black text-emerald-600">5,000만원 <span className="text-[13px] text-[#111111]/40 font-medium">(71%)</span></span>
              </div>
              <ul className="grid grid-cols-2 gap-x-4 gap-y-2 text-[13.5px] text-[#111111]/60 font-semibold mt-2">
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
        <div className="border border-[#111111]/10 bg-[#111111]/[0.01] p-6 rounded-sm pt1-fu pt1-d5">
          <h3 className="text-[14px] font-black text-[#111111]/75 mb-4 uppercase tracking-wider flex items-center gap-2">
            투자 후 12개월 목표
          </h3>
          <div className="grid grid-cols-5 gap-4">
            {[
              'WoC 핵심 시스템 완성',
              '커뮤니티 운영 데이터 확보',
              '실제 거래 및 수익 모델 검증',
              '탱고 외 커뮤니티 확장 검증',
              'Seed 투자 유치 기반 확보'
            ].map((goal, idx) => (
              <div key={idx} className="bg-white/60 border border-[#111111]/5 p-4 rounded-sm flex flex-col justify-between items-start">
                <span className="text-[10px] font-['Space_Grotesk'] font-bold text-[#111111]/30 mb-2 block">0{idx + 1}</span>
                <p className="text-[13px] font-bold text-[#111111]/70 tracking-tight break-keep leading-snug">
                  ✓ {goal}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer Copy */}
      <div className="mt-10 border-t border-[#111111]/10 pt-6 text-center pt1-fu pt1-d6">
        <p className="text-[17px] font-black tracking-tight text-[#111111] leading-none mb-2">
          커뮤니티를 위한 운영 인프라를 구축합니다.
        </p>
        <p className="text-[11px] font-['Space_Grotesk'] font-bold tracking-[0.2em] text-[#111111]/30 uppercase">
          World of Community (WoC)
        </p>
      </div>
    </div>
  </div>
);
