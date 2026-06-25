import React from 'react';

// Slide 1: Cover Slide (커버)
export const Slide1 = () => (
  <div className="slide slide-dark flex flex-col items-center justify-center text-center">
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <div className="w-[500px] h-[500px] rounded-full bg-blue-500/[0.03] blur-[100px]" />
    </div>
    <div className="relative z-10 max-w-[1200px] w-full flex flex-col items-center">
      <span className="font-['Space_Grotesk'] text-[14px] font-bold tracking-[0.4em] text-white/40 uppercase mb-8">
        ANGEL ROUND PROPOSAL
      </span>
      <h1 className="text-[90px] font-black text-[#fcf8f8] leading-none tracking-[-0.04em] select-none font-['Space_Grotesk']">
        World of Community
      </h1>
      <p className="text-[24px] font-extrabold tracking-tight text-white/80 mt-6">
        취미 활동을 위한 커뮤니티 운영 플랫폼
      </p>
      
      <div className="w-[80px] h-[1px] bg-white/20 my-10" />
      
      <p className="text-[16px] font-medium text-white/60 max-w-[600px] leading-relaxed">
        탐색, 신청, 결제, 정산, 참여, 기록을 하나로 연결합니다.
      </p>
      
      <div className="mt-10 flex flex-col items-center">
        <span className="text-[14px] font-bold tracking-widest text-blue-400 uppercase font-['Space_Grotesk'] mb-2">Life goes ON_</span>
        <p className="text-[14px] text-white/40 font-medium">사람들의 활동은 계속됩니다. 이제 운영체제가 필요합니다.</p>
      </div>
    </div>
    <p className="source text-white/30 font-['Space_Grotesk']">WOC 2026 · Angel Round Proposal · 2026</p>
  </div>
);

// Slide 2: Problem Statement (문제 인식)
export const Slide2 = () => {
  return (
    <div className="slide">
      <p className="chapter">문제 인식</p>
      <p className="page">2 / 19</p>
      <h1 className="title">사람들은 취미에 돈을 쓰지만, 운영은 아직도 수작업입니다</h1>
      <p className="subtitle">오프라인 커뮤니티 활동은 활발하지만, 예약·결제·정산·회원관리는 여러 도구로 흩어져 있습니다.</p>
      
      <div className="body-area">
        {/* 좌측 3단 카드 */}
        <div className="flex-[5] flex flex-col gap-4 justify-between h-full">
          <div className="card py-6 flex-1">
            <h3 className="text-[18px] font-extrabold leading-none text-blue-600">01 분산된 운영 도구</h3>
            <p className="text-[14px] leading-relaxed opacity-80 break-keep">밴드, 카페, 카카오톡, 구글시트, 인스타그램, 계좌이체가 각각 따로 사용됩니다.</p>
          </div>
          <div className="card py-6 flex-1">
            <h3 className="text-[18px] font-extrabold leading-none text-blue-600">02 반복되는 수작업</h3>
            <p className="text-[14px] leading-relaxed opacity-80 break-keep">운영자는 신청자 확인, 입금 확인, 명단 대조, 정산에 많은 시간을 소모합니다.</p>
          </div>
          <div className="card py-6 flex-1">
            <h3 className="text-[18px] font-extrabold leading-none text-blue-600">03 축적되지 않는 데이터</h3>
            <p className="text-[14px] leading-relaxed opacity-80 break-keep">참여 이력, 결제 이력, 활동 기록이 흩어져 운영 자산으로 남지 않습니다.</p>
          </div>
        </div>

        {/* 우측 분산 도구 구조도 */}
        <div className="flex-[7] chart-box justify-center items-center relative">
          <span className="text-[13px] font-bold text-gray-400 block self-start mb-2">분산된 경험</span>
          <div className="relative w-full h-[280px] flex items-center justify-center">
            {/* 연결선 SVG */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 500 280">
              <line x1="250" y1="140" x2="250" y2="50" stroke="#f43f5e" strokeWidth="2" strokeDasharray="4 4" />
              <line x1="250" y1="140" x2="110" y2="90" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="3 3" />
              <line x1="250" y1="140" x2="390" y2="90" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="3 3" />
              <line x1="250" y1="140" x2="120" y2="200" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="3 3" />
              <line x1="250" y1="140" x2="380" y2="200" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="3 3" />
            </svg>

            {/* 노드들 */}
            <div className="absolute top-[20px] px-4 py-2 border border-red-200 bg-red-50 text-red-600 text-[13px] font-bold rounded-lg shadow-sm">● 계좌이체</div>
            <div className="absolute top-[70px] left-[20px] px-4 py-2 border border-gray-200 bg-white text-gray-600 text-[13px] font-bold rounded-lg shadow-2xs">● 밴드 / 카페</div>
            <div className="absolute top-[70px] right-[20px] px-4 py-2 border border-gray-200 bg-white text-gray-600 text-[13px] font-bold rounded-lg shadow-2xs">● 구글시트</div>
            <div className="absolute bottom-[50px] left-[30px] px-4 py-2 border border-yellow-200 bg-yellow-50 text-yellow-600 text-[13px] font-bold rounded-lg shadow-sm">● 카카오톡</div>
            <div className="absolute bottom-[50px] right-[30px] px-4 py-2 border border-gray-200 bg-white text-gray-600 text-[13px] font-bold rounded-lg shadow-2xs">● 인스타그램</div>

            {/* 중앙 호스트 */}
            <div className="z-10 w-[90px] h-[90px] rounded-full bg-blue-900 border-4 border-white flex items-center justify-center text-white text-[15px] font-extrabold shadow-md">
              운영자
            </div>
          </div>
          <span className="text-[11px] text-gray-400 block mt-2 text-center w-full">※ 수작업 및 다중 도구 병행 사용 구조</span>
        </div>
      </div>
      <p className="source font-extrabold text-blue-600">사람은 연결되었지만, 활동은 아직 연결되지 않았습니다.</p>
    </div>
  );
};

// Slide 3: Market Opportunity (시장 기회)
export const Slide3 = () => {
  const opportunities = [
    { num: '01 이미 존재하는 소비', desc: '수업, 모임, 행사, 워크숍, 회비, 참가비 등 오프라인 활동 결제는 이미 일상적으로 발생하고 있습니다.' },
    { num: '02 반복되는 참여', desc: '취미와 배움은 일회성 소비가 아니라 반복 참여와 재결제로 이어지는 활동입니다.' },
    { num: '03 운영 시스템의 부재', desc: '하지만 이 시장의 운영은 여전히 공지, 신청, 입금 확인, 정산, 명단 관리가 분리되어 있습니다.' }
  ];

  const markets = [
    { title: 'Dance', desc: '소셜댄스 · 스테이지댄스' },
    { title: 'Wellness', desc: '요가 · 필라테스' },
    { title: 'Education', desc: '입시학원 · 어학원' },
    { title: 'Sports', desc: '러닝 · 사이클링' },
    { title: 'Hobby', desc: '커피 · 공예 · 사진' },
    { title: 'Society', desc: '팬덤 · 지역 커뮤니티' }
  ];

  return (
    <div className="slide">
      <p className="chapter">시장 기회</p>
      <p className="page">3 / 19</p>
      <h1 className="title">거대한 커뮤니티 경제는 이미 존재합니다</h1>
      <p className="subtitle">사람들은 배우고, 운동하고, 춤추고, 취미를 즐기기 위해 지속적으로 비용을 지출합니다.</p>
      
      <div className="body-area">
        {/* 좌측 3단 카드 */}
        <div className="flex-[5] flex flex-col gap-4 justify-between h-full">
          {opportunities.map((o) => (
            <div key={o.num} className="card py-6 flex-1 justify-center">
              <h3 className="text-[17px] font-extrabold leading-none text-blue-600">{o.num}</h3>
              <p className="text-[13.5px] leading-relaxed opacity-80 break-keep">{o.desc}</p>
            </div>
          ))}
        </div>

        {/* 우측 6대 카테고리 그리드 */}
        <div className="flex-[7] chart-box justify-between">
          <span className="text-[13px] font-bold text-gray-400 block mb-3">활동 시장</span>
          <div className="grid grid-cols-2 gap-3 w-full flex-1">
            {markets.map((m) => (
              <div key={m.title} className="border border-[#e5e7eb] rounded-xl bg-white p-4 flex flex-col justify-center shadow-3xs">
                <span className="text-[16px] font-black text-gray-800 font-['Space_Grotesk']">{m.title}</span>
                <span className="text-[12.5px] text-gray-400 font-semibold mt-1">{m.desc}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100 text-[11px] text-gray-400 font-bold">
            <span>활동 참여 → 반복 결제 → 운영 필요</span>
            <span>※ 오프라인 커뮤니티 경제의 지속성 흐름</span>
          </div>
        </div>
      </div>
      <p className="source font-extrabold text-blue-600">WoC는 새로운 시장을 만드는 것이 아니라, 이미 존재하는 활동과 결제 흐름을 연결합니다.</p>
    </div>
  );
};

// Slide 4: Platform Limit (기존 플랫폼의 한계)
export const Slide4 = () => {
  return (
    <div className="slide">
      <p className="chapter">기존 플랫폼의 한계</p>
      <p className="page">4 / 19</p>
      <h1 className="title">기존 플랫폼은 소통에는 강하지만, 운영에는 약합니다</h1>
      <p className="subtitle">공지와 대화는 가능하지만, 예약·결제·정산·회원관리·활동기록은 분산되어 있습니다.</p>
      
      <div className="body-area">
        {/* 좌측 분산 도구 표 */}
        <div className="flex-[5] flex flex-col justify-between py-2">
          <span className="text-[13px] font-bold text-gray-400 block mb-2">현재 사용 중인 분산 도구</span>
          <div className="grid grid-cols-2 gap-4 flex-1">
            <div className="border-b border-gray-100 pb-2">
              <span className="text-[14px] font-black text-gray-800 block">밴드 / 카페</span>
              <span className="text-[12px] text-gray-400 font-medium">공지, 게시글, 사진 공유</span>
            </div>
            <div className="border-b border-gray-100 pb-2">
              <span className="text-[14px] font-black text-gray-800 block">카카오톡</span>
              <span className="text-[12px] text-gray-400 font-medium">빠른 문의와 소통</span>
            </div>
            <div className="border-b border-gray-100 pb-2">
              <span className="text-[14px] font-black text-gray-800 block">인스타그램 / 페이스북</span>
              <span className="text-[12px] text-gray-400 font-medium">홍보와 콘텐츠 노출</span>
            </div>
            <div className="border-b border-gray-100 pb-2">
              <span className="text-[14px] font-black text-gray-800 block">온오프믹스 / 이벤터스</span>
              <span className="text-[12px] text-gray-400 font-medium">단발성 행사 신청</span>
            </div>
            <div className="pb-2 col-span-1">
              <span className="text-[14px] font-black text-gray-800 block">구글시트 / 엑셀</span>
              <span className="text-[12px] text-gray-400 font-medium">명단 및 입금 수기 관리</span>
            </div>
            <div className="pb-2 col-span-1">
              <span className="text-[14px] font-black text-red-500 block">계좌이체</span>
              <span className="text-[12px] text-red-400 font-medium">수동 결제 확인</span>
            </div>
          </div>
        </div>

        {/* 우측 원형 구조도 */}
        <div className="flex-[7] chart-box justify-center items-center relative">
          <span className="text-[13px] font-bold text-gray-400 block self-start mb-2">통합 운영 구조</span>
          
          <div className="relative w-full h-[280px] flex items-center justify-center">
            {/* SVG 연결선 */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 500 280">
              {[0, 40, 80, 120, 160, 200, 240, 280, 320].map((deg) => {
                const rad = (deg * Math.PI) / 180;
                const x2 = 250 + 105 * Math.cos(rad);
                const y2 = 140 + 90 * Math.sin(rad);
                return (
                  <line key={deg} x1="250" y1="140" x2={x2} y2={y2} stroke="#3b82f6" strokeWidth="1" strokeDasharray="2 2" />
                );
              })}
            </svg>

            {/* 중앙 WoC OS */}
            <div className="z-10 w-[95px] h-[95px] rounded-full bg-blue-900 border-4 border-white flex items-center justify-center text-white text-[14px] font-black shadow-md text-center">
              WoC OS
            </div>

            {/* 노드들 (absolute 배치) */}
            <div className="absolute top-[20px] px-2 py-1 border border-gray-100 bg-white text-[11px] font-bold rounded shadow-3xs">커뮤니티</div>
            <div className="absolute top-[50px] right-[60px] px-2 py-1 border border-gray-100 bg-white text-[11px] font-bold rounded shadow-3xs">소통</div>
            <div className="absolute top-[120px] right-[25px] px-2 py-1 border border-gray-100 bg-white text-[11px] font-bold rounded shadow-3xs">클래스</div>
            <div className="absolute bottom-[60px] right-[55px] px-2 py-1 border border-gray-100 bg-white text-[11px] font-bold rounded shadow-3xs">이벤트</div>
            <div className="absolute bottom-[20px] px-2 py-1 border border-gray-100 bg-white text-[11px] font-bold rounded shadow-3xs">결제</div>
            <div className="absolute bottom-[60px] left-[55px] px-2 py-1 border border-gray-100 bg-white text-[11px] font-bold rounded shadow-3xs">정산</div>
            <div className="absolute top-[120px] left-[25px] px-2 py-1 border border-gray-100 bg-white text-[11px] font-bold rounded shadow-3xs">멤버십</div>
            <div className="absolute top-[50px] left-[60px] px-2 py-1 border border-gray-100 bg-white text-[11px] font-bold rounded shadow-3xs">그룹관리</div>
            <div className="absolute top-[10px] left-[150px] px-2 py-1 border border-blue-200 bg-blue-50 text-blue-600 text-[10px] font-black rounded shadow-3xs">글로벌</div>
          </div>
          <span className="text-[11px] font-black text-blue-600 uppercase tracking-wider block mt-2 text-center w-full">EVERYTHING CONNECTED. 모든 활동이 하나의 시스템으로 연결됩니다.</span>
        </div>
      </div>
      <p className="source font-extrabold text-blue-600">현재 시장의 실제 대체재는 "카카오톡 공지 + 계좌이체 + 엑셀 장부"입니다.</p>
    </div>
  );
};

// Slide 5: Solution (해결 방안)
export const Slide5 = () => {
  const steps = [
    { label: '탐색', desc: '활동과 커뮤니티 발견' },
    { label: '신청', desc: '클래스·모임 간편 신청' },
    { label: '결제', desc: '앱 내 원스톱 결제' },
    { label: '정산', desc: '호스트별 정산 관리' },
    { label: '참여', desc: '오프라인 활동 참여' },
    { label: '기록', desc: '이력 및 데이터 축적' }
  ];

  return (
    <div className="slide">
      <p className="chapter">해결 방안</p>
      <p className="page">5 / 19</p>
      <h1 className="title">WoC는 커뮤니티 활동을 운영 가능한 시스템으로 연결합니다</h1>
      <p className="subtitle">탐색, 신청, 결제, 정산, 참여, 기록을 하나의 흐름으로 통합합니다.</p>
      
      <div className="body-area flex-col justify-between">
        {/* 가로 타임라인 다이어그램 */}
        <div className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-6 relative flex items-center justify-between">
          <div className="absolute top-1/2 left-6 right-6 h-[2px] bg-blue-200 -translate-y-1/2 pointer-events-none z-0" />
          {steps.map((s, idx) => (
            <div key={s.label} className="relative z-10 flex flex-col items-center bg-white border border-gray-100 rounded-xl p-3 shadow-3xs w-[160px] text-center">
              <span className="text-[12px] font-extrabold text-blue-600 block mb-1">0{idx + 1}</span>
              <span className="text-[15px] font-black text-gray-800 block">{s.label}</span>
              <span className="text-[11px] font-medium text-gray-400 mt-1 break-keep">{s.desc}</span>
            </div>
          ))}
          <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-blue-900 px-4 py-1 rounded-full text-white text-[10px] font-black tracking-wider uppercase border-2 border-white shadow-sm z-20">
            Community OS Core : 커뮤니티 운영의 공통 구조를 하나의 시스템으로 통합
          </div>
        </div>

        {/* 하단 2단 가치 제안 카드 */}
        <div className="grid grid-cols-2 gap-6 w-full mt-4">
          <div className="card py-6">
            <h3 className="text-[18px] font-extrabold text-blue-900 border-b border-gray-100 pb-2 mb-2">운영자 (Host) 가치</h3>
            <ul className="text-[14px] leading-relaxed text-gray-600 font-medium flex flex-col gap-1.5">
              <li>• 예약·결제·정산 등 소모적인 행정 업무 극대화 감소</li>
              <li>• 회원 등급 관리 및 정기 모임/반복 운영 시스템화</li>
            </ul>
          </div>
          <div className="card py-6">
            <h3 className="text-[18px] font-extrabold text-blue-900 border-b border-gray-100 pb-2 mb-2">회원 (Member) 가치</h3>
            <ul className="text-[14px] leading-relaxed text-gray-600 font-medium flex flex-col gap-1.5">
              <li>• 원클릭 필터링을 통한 활동 검색부터 즉시 결제 처리</li>
              <li>• 활동 참여 이력과 디지털 기록 자동 저장 및 자산화</li>
            </ul>
          </div>
        </div>
      </div>
      <p className="source font-extrabold text-blue-600">“WoC는 흩어진 도구를 대체하는 것이 아니라, 커뮤니티 활동 전체를 하나의 운영 흐름으로 연결합니다.”</p>
    </div>
  );
};

// Slide 6: Platform Structure (플랫폼 구조)
export const Slide6 = () => {
  const modules = [
    { title: 'Groups', desc: '커뮤니티 운영' },
    { title: 'Venues', desc: '공간 정보' },
    { title: 'Profile', desc: '활동 이력' },
    { title: 'Live', desc: '현장 기록' },
    { title: 'Members', desc: '회원 관리' },
    { title: 'Settlement', desc: '정산 관리' },
    { title: 'Payment', desc: '결제 흐름' },
    { title: 'Booking', desc: '신청·예약' }
  ];

  return (
    <div className="slide">
      <p className="chapter">플랫폼 구조</p>
      <p className="page">6 / 19</p>
      <h1 className="title">하나의 OS 구조로 여러 커뮤니티를 운영합니다</h1>
      <p className="subtitle">WoC는 예약, 결제, 정산, 회원, 콘텐츠, 공간 정보를 공통 모듈로 연결합니다.</p>
      
      <div className="body-area">
        {/* 좌측 의미 설명 */}
        <div className="flex-[4] card justify-center py-8">
          <span className="text-[12px] font-bold text-blue-500 uppercase tracking-widest block mb-2 font-['Space_Grotesk'] font-bold">Concept Definition</span>
          <h3 className="text-[20px] font-extrabold text-gray-800 leading-tight mb-4">모듈형 구조의 의미</h3>
          <p className="text-[14px] leading-relaxed text-gray-500 font-medium break-keep">
            각 시장마다 앱을 새로 만드는 것이 아니라, 공통 운영 모듈을 시장별 데이터와 화면에 맞게 재조합합니다.
          </p>
        </div>

        {/* 우측 공통 모듈 아키텍처 */}
        <div className="flex-[8] chart-box justify-center items-center relative">
          <span className="text-[13px] font-bold text-gray-400 block self-start mb-2">WOC COMMUNITY OS (공통 운영 구조)</span>
          
          <div className="relative w-full h-[220px] flex items-center justify-center">
            {/* SVG 연결선 */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 500 220">
              <line x1="250" y1="110" x2="110" y2="50" stroke="#cbd5e1" strokeWidth="1.5" />
              <line x1="250" y1="110" x2="390" y2="50" stroke="#cbd5e1" strokeWidth="1.5" />
              <line x1="250" y1="110" x2="110" y2="170" stroke="#cbd5e1" strokeWidth="1.5" />
              <line x1="250" y1="110" x2="390" y2="170" stroke="#cbd5e1" strokeWidth="1.5" />
              <line x1="250" y1="110" x2="250" y2="35" stroke="#cbd5e1" strokeWidth="1.5" />
              <line x1="250" y1="110" x2="250" y2="185" stroke="#cbd5e1" strokeWidth="1.5" />
              <line x1="250" y1="110" x2="80" y2="110" stroke="#cbd5e1" strokeWidth="1.5" />
              <line x1="250" y1="110" x2="420" y2="110" stroke="#cbd5e1" strokeWidth="1.5" />
            </svg>

            {/* 코어 허브 */}
            <div className="z-10 w-[140px] h-[70px] rounded-2xl bg-blue-900 border-4 border-white flex flex-col items-center justify-center text-white shadow-md">
              <span className="text-[11px] font-black tracking-widest">WOC COMMUNITY OS</span>
              <span className="text-[9px] font-bold opacity-75 mt-0.5">공통 운영 구조</span>
            </div>

            {/* 박스 노드들 */}
            <div className="absolute top-[10px] left-[50px] w-[110px] py-2 border border-blue-200 bg-blue-50 text-[12px] font-bold rounded-lg text-center shadow-3xs">
              <span className="block font-black text-gray-800">Booking</span>
              <span className="text-[9.5px] text-gray-400">신청·예약</span>
            </div>
            <div className="absolute top-[10px] left-[195px] w-[110px] py-2 border border-blue-200 bg-blue-50 text-[12px] font-bold rounded-lg text-center shadow-3xs">
              <span className="block font-black text-gray-800">Payment</span>
              <span className="text-[9.5px] text-gray-400">결제 흐름</span>
            </div>
            <div className="absolute top-[10px] right-[50px] w-[110px] py-2 border border-blue-200 bg-blue-50 text-[12px] font-bold rounded-lg text-center shadow-3xs">
              <span className="block font-black text-gray-800">Groups</span>
              <span className="text-[9.5px] text-gray-400">커뮤니티 운영</span>
            </div>
            <div className="absolute top-[75px] left-[10px] w-[110px] py-2 border border-blue-200 bg-blue-50 text-[12px] font-bold rounded-lg text-center shadow-3xs">
              <span className="block font-black text-gray-800">Settlement</span>
              <span className="text-[9.5px] text-gray-400">정산 관리</span>
            </div>
            <div className="absolute top-[75px] right-[10px] w-[110px] py-2 border border-blue-200 bg-blue-50 text-[12px] font-bold rounded-lg text-center shadow-3xs">
              <span className="block font-black text-gray-800">Venues</span>
              <span className="text-[9.5px] text-gray-400">공간 정보</span>
            </div>
            <div className="absolute bottom-[10px] left-[50px] w-[110px] py-2 border border-blue-200 bg-blue-50 text-[12px] font-bold rounded-lg text-center shadow-3xs">
              <span className="block font-black text-gray-800">Members</span>
              <span className="text-[9.5px] text-gray-400">회원 관리</span>
            </div>
            <div className="absolute bottom-[10px] left-[195px] w-[110px] py-2 border border-blue-200 bg-blue-50 text-[12px] font-bold rounded-lg text-center shadow-3xs">
              <span className="block font-black text-gray-800">Live</span>
              <span className="text-[9.5px] text-gray-400">현장 기록</span>
            </div>
            <div className="absolute bottom-[10px] right-[50px] w-[110px] py-2 border border-blue-200 bg-blue-50 text-[12px] font-bold rounded-lg text-center shadow-3xs">
              <span className="block font-black text-gray-800">Profile</span>
              <span className="text-[9.5px] text-gray-400">활동 이력</span>
            </div>
          </div>

          <div className="w-full flex items-center justify-center gap-2 mt-4 pt-3 border-t border-gray-100">
            <span className="text-[12px] font-black text-gray-800">시장 확장성 :</span>
            <div className="flex gap-1 text-[11px] font-bold">
              <span className="bg-blue-900 text-white px-2 py-0.5 rounded">Dance OS</span>
              <span className="text-gray-400">→</span>
              <span className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded">Wellness OS</span>
              <span className="text-gray-400">→</span>
              <span className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded">Academy/Learning OS</span>
              <span className="text-gray-400">→</span>
              <span className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded">Sports / Hobby / Society</span>
            </div>
          </div>
        </div>
      </div>
      <p className="source font-extrabold text-blue-600">“WoC의 핵심은 특정 취미 앱이 아니라, 다양한 커뮤니티 시장에 반복 적용 가능한 운영 모듈 구조입니다.”</p>
    </div>
  );
};

// Slide 7: Product Proof (제품 구현)
export const Slide7 = () => {
  const points = [
    { title: '01 PWA 기반 서비스', desc: '브라우저와 모바일 홈화면에서 바로 접근 가능한 웹앱 구조' },
    { title: '02 커뮤니티 운영 기능', desc: '클래스, 소셜, 이벤트, 그룹 운영 흐름 구현' },
    { title: '03 실제 운영 검증', desc: '초기 커뮤니티 운영 환경에서 기능과 흐름 검증 중' }
  ];

  return (
    <div className="slide">
      <p className="chapter">제품 구현</p>
      <p className="page">7 / 19</p>
      <h1 className="title">WoC는 이미 실제 서비스로 구현되어 있습니다</h1>
      <p className="subtitle">웹앱/PWA 기반으로 주요 기능이 구현되었고, 실제 커뮤니티 운영 환경에서 검증되고 있습니다.</p>
      
      <div className="body-area">
        {/* 좌측 3단 리스트 */}
        <div className="flex-[4] flex flex-col gap-4 justify-between h-full py-2">
          <span className="text-[13px] font-bold text-gray-400 block mb-1">구현된 핵심 구조</span>
          {points.map((p) => (
            <div key={p.title} className="card py-6 flex-1 justify-center">
              <h3 className="text-[17px] font-black text-blue-900 mb-1">{p.title}</h3>
              <p className="text-[13px] leading-relaxed text-gray-500 break-keep font-medium">{p.desc}</p>
            </div>
          ))}
        </div>

        {/* 우측 모바일 목업 리스트 플레이스홀더 */}
        <div className="flex-[8] chart-box justify-center items-center relative">
          <span className="text-[13px] font-bold text-gray-400 block self-start mb-2">실제 제품 화면 : 주요 커뮤니티 운영 기능 구현</span>
          
          <div className="grid grid-cols-7 gap-1.5 w-full flex-1 items-center bg-gray-50 border border-gray-100 rounded-xl p-3">
            {[...Array(7)].map((_, i) => (
              <div key={i} className="aspect-[9/19] bg-white border border-gray-100 rounded shadow-3xs flex flex-col justify-between p-1.5">
                <span className="text-[8px] text-gray-300 font-bold block">App Screen 0{i+1}</span>
                <div className="w-full h-2/3 bg-gray-50 rounded flex items-center justify-center text-[7px] text-gray-300 font-bold tracking-tighter uppercase">WoC Screen</div>
              </div>
            ))}
          </div>
          
          <span className="text-[12px] font-black text-gray-800 mt-2 block">탐색 · 신청 · 참여 · 기록 흐름을 하나의 제품 안에서 구현</span>
        </div>
      </div>
      <p className="source font-extrabold text-blue-600">“WoC는 아이디어 단계가 아니라, 실제 화면과 운영 구조를 갖춘 실행 가능한 제품입니다.”</p>
    </div>
  );
};

// Slide 8: Market Validation (시장 검증)
export const Slide8 = () => {
  const stats = [
    { title: '01 광고비 없이 확보', desc: '초기 유료 광고보다 커뮤니티 네트워크와 호스트 중심 확산으로 확보했습니다.' },
    { title: '02 핵심 타겟 시장에서 검증', desc: '운영 복잡도가 높은 오프라인 커뮤니티 활동 시장에서 실제 니즈를 확인하고 있습니다.' },
    { title: '03 실제 운영 환경에서 PoC', desc: '공지, 신청, 참여, 운영 흐름을 실제 커뮤니티 환경에서 검증 중입니다.' }
  ];

  return (
    <div className="slide">
      <p className="chapter">시장 검증</p>
      <p className="page">8 / 19</p>
      <h1 className="title">광고비 없이 370명 이상의 초기 회원을 확보했습니다</h1>
      <p className="subtitle">초기 커뮤니티 운영 환경에서 호스트 중심 온보딩 구조와 실제 사용 흐름을 검증하고 있습니다.</p>
      
      <div className="body-area">
        {/* 좌측 3단 리스트 */}
        <div className="flex-[5] flex flex-col gap-4 justify-between h-full py-1">
          <span className="text-[15px] font-black text-blue-900 block mb-1">8개 국가 · 13개 도시 · 370+명 (광고 없이 확보한 초기 가입자)</span>
          {stats.map((s) => (
            <div key={s.title} className="card py-6 flex-1 justify-center">
              <h3 className="text-[17px] font-extrabold text-gray-800 leading-none mb-1">{s.title}</h3>
              <p className="text-[13.5px] leading-relaxed text-gray-500 font-medium break-keep">{s.desc}</p>
            </div>
          ))}
        </div>

        {/* 우측 B2B2C 다이어그램 */}
        <div className="flex-[7] chart-box justify-center items-center relative">
          <span className="text-[13px] font-bold text-gray-400 block self-start mb-2">B2B2C 온보딩 구조</span>
          
          <div className="relative w-full h-[220px] flex items-center justify-between px-6 bg-gray-50 border border-gray-100 rounded-xl">
            <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 500 220">
              <path d="M 120 110 Q 230 40 340 110" fill="none" stroke="#3b82f6" strokeWidth="2" strokeDasharray="4 4" />
              <line x1="120" y1="110" x2="340" y2="110" stroke="#cbd5e1" strokeWidth="2" />
            </svg>

            {/* 호스트 */}
            <div className="relative z-10 w-[95px] h-[95px] rounded-full bg-blue-900 border-4 border-white flex flex-col items-center justify-center text-white shadow-md text-center">
              <span className="text-[14px] font-black">HOST</span>
              <span className="text-[10px] font-bold opacity-80 mt-0.5">호스트 · 운영자</span>
            </div>

            {/* 연결 라벨 */}
            <span className="absolute top-[40px] left-[180px] bg-white border border-blue-200 text-blue-600 text-[10px] font-extrabold px-2 py-0.5 rounded shadow-3xs uppercase tracking-wider">
              MEMBERS 커뮤니티 회원
            </span>

            {/* 리핏 */}
            <div className="relative z-10 w-[95px] h-[95px] rounded-full bg-white border-4 border-blue-200 flex flex-col items-center justify-center text-blue-900 shadow-md text-center">
              <span className="text-[14px] font-black">REPEAT</span>
              <span className="text-[10px] font-extrabold mt-0.5">반복 참여</span>
            </div>
          </div>
          <span className="text-[12px] font-black text-gray-800 mt-3 block text-center w-full">한 명의 운영자가 움직이면, 수십~수백 명의 회원 접점이 함께 형성됩니다.</span>
        </div>
      </div>
      <p className="source font-extrabold text-blue-600">탱고는 최종 시장이 아니라, Community OS를 검증하는 첫 실험실입니다.</p>
    </div>
  );
};

// Slide 9: Revenue Model (수익 모델)
export const Slide9 = () => {
  const points = [
    { title: '01 거래 기반 수익', desc: '클래스, 소셜, 워크숍, 이벤트 등 실제 활동 결제액을 기준으로 수익이 발생합니다.' },
    { title: '02 정산 기반 운영 가치', desc: '호스트는 결제 확인, 명단 관리, 매출 확인, 정산 업무를 하나의 흐름에서 처리합니다.' },
    { title: '03 확장형 수익 구조', desc: '이후 호스트 운영 솔루션 구독료, B2B SaaS, 프랜차이즈 라이선스로 확장할 수 있습니다.' }
  ];

  return (
    <div className="slide">
      <p className="chapter">수익 모델</p>
      <p className="page">9 / 19</p>
      <h1 className="title">WoC의 초기 수익은 결제와 정산에서 발생합니다</h1>
      <p className="subtitle">클래스, 모임, 워크숍, 이벤트 결제액을 기준으로 플랫폼 수수료를 부과합니다.</p>
      
      <div className="body-area">
        {/* 좌측 3단 리스트 */}
        <div className="flex-[5] flex flex-col gap-4 justify-between h-full py-1">
          <span className="text-[13px] font-bold text-gray-400 block mb-1">초기 핵심 수익 구조</span>
          {points.map((p) => (
            <div key={p.title} className="card py-6 flex-1 justify-center">
              <h3 className="text-[17px] font-extrabold text-gray-800 leading-none mb-1">{p.title}</h3>
              <p className="text-[13.5px] leading-relaxed text-gray-500 font-medium break-keep">{p.desc}</p>
            </div>
          ))}
        </div>

        {/* 우측 수수료 다이어그램 */}
        <div className="flex-[7] chart-box justify-center items-center relative">
          <span className="text-[13px] font-bold text-gray-400 block self-start mb-2">거래·정산 기반 플랫폼 수수료 모델</span>
          
          <div className="relative w-full h-[200px] flex items-center justify-between px-6 bg-gray-50 border border-gray-100 rounded-xl">
            <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 500 200">
              <line x1="120" y1="100" x2="380" y2="100" stroke="#cbd5e1" strokeWidth="2" />
            </svg>

            {/* 모임 결제액 */}
            <div className="relative z-10 w-[110px] h-[80px] border border-gray-200 bg-white rounded-xl p-2.5 flex flex-col justify-center items-center text-center shadow-3xs">
              <span className="text-[12px] font-black text-gray-800">Activity GMV</span>
              <span className="text-[9.5px] text-gray-400 mt-1">클래스 • 모임 • 워크숍</span>
            </div>

            {/* 수수료 원형 라벨 */}
            <div className="relative z-10 w-[95px] h-[95px] rounded-full bg-blue-900 border-4 border-white flex flex-col items-center justify-center text-white shadow-md text-center">
              <span className="text-[10px] font-bold tracking-widest text-blue-300">MONEY FLOWS HERE</span>
              <span className="text-[20px] font-black leading-none mt-0.5">0.5%</span>
              <span className="text-[9px] font-medium opacity-80 mt-1">플랫폼 수수료</span>
            </div>

            {/* 플랫폼 매출 */}
            <div className="relative z-10 w-[110px] h-[80px] border border-blue-200 bg-blue-50 rounded-xl p-2.5 flex flex-col justify-center items-center text-center shadow-3xs">
              <span className="text-[12px] font-black text-blue-900">WoC Revenue</span>
              <span className="text-[9.5px] text-blue-500 font-extrabold mt-1">결제·정산 반복 수익</span>
            </div>
          </div>
          <span className="text-[11px] text-gray-400 block mt-2 text-center w-full">※ 카드/PG 원가를 제외한 순수 플랫폼 수수료 기준</span>
          
          <div className="w-full flex items-center justify-center gap-2 mt-3 pt-2 border-t border-gray-100 text-[11px] text-gray-400 font-bold">
            <span>향후 확장 수익 :</span>
            <div className="flex gap-2">
              <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-500">솔루션 구독료</span>
              <span>|</span>
              <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-500">B2B SaaS / 라이선스</span>
              <span>|</span>
              <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-500">글로벌 정산 수수료</span>
            </div>
          </div>
        </div>
      </div>
      <p className="source font-extrabold text-blue-600">“WoC는 커뮤니티 활동에서 이미 발생하는 결제 흐름 위에 0.5% 플랫폼 수익을 쌓는 구조입니다.”</p>
    </div>
  );
};

// Slide 10: Unit Economics (단위 경제학)
export const Slide10 = () => {
  const inputs = [
    { num: '01 월 활동 결제액', bold: '135,000원', desc: '사용자 1인이 월간 커뮤니티 활동에 지출하는 결제액 기준입니다.' },
    { num: '02 플랫폼 순수 수수료율', bold: '0.5%', desc: '카드/PG 원가를 제외한 순수 플랫폼 수수료 기준입니다.' },
    { num: '03 반복 결제 구조', bold: '월 → 연', desc: '수업, 모임, 이벤트 참여가 반복되며 플랫폼 수익이 누적됩니다.' }
  ];

  return (
    <div className="slide">
      <p className="chapter">단위 경제학</p>
      <p className="page">10 / 19</p>
      <h1 className="title">커뮤니티 경제는 작은 반복 결제가 누적되는 구조입니다</h1>
      <p className="subtitle">사용자 1인 월 활동 결제액 135,000원 기준, 플랫폼 순수 수익은 월 675원입니다.</p>
      
      <div className="body-area">
        {/* 좌측 3단 전제 리스트 */}
        <div className="flex-[5] flex flex-col gap-4 justify-between h-full py-1">
          <span className="text-[13px] font-bold text-gray-400 block mb-1">단위 경제학 전제</span>
          {inputs.map((i) => (
            <div key={i.num} className="card py-6 flex-1 justify-center">
              <div className="flex justify-between items-baseline mb-1">
                <h3 className="text-[16px] font-black text-gray-800 leading-none">{i.num}</h3>
                <span className="text-[16px] font-black text-blue-600 font-['Space_Grotesk']">{i.bold}</span>
              </div>
              <p className="text-[13px] leading-relaxed text-gray-500 font-medium break-keep">{i.desc}</p>
            </div>
          ))}
        </div>

        {/* 우측 3단계 누적 그래프 */}
        <div className="flex-[7] chart-box justify-center items-center relative">
          <span className="text-[13px] font-bold text-gray-400 block self-start mb-2 font-['Space_Grotesk']">Unit Economics</span>
          
          <div className="w-full flex-1 flex flex-col gap-3 justify-center">
            <div className="flex justify-between items-center p-3 border border-gray-100 bg-white rounded-xl shadow-3xs">
              <span className="bg-blue-900 text-white text-[11px] font-black px-2 py-0.5 rounded">1단계</span>
              <span className="text-[13.5px] font-extrabold text-gray-700">135,000원  ×  수수료율 0.5%</span>
              <span className="text-[16px] font-black text-blue-600 font-['Space_Grotesk']">= 675원 / 월</span>
            </div>
            <div className="flex justify-between items-center p-3 border border-gray-100 bg-white rounded-xl shadow-3xs">
              <span className="bg-blue-900 text-white text-[11px] font-black px-2 py-0.5 rounded">2단계</span>
              <span className="text-[13.5px] font-extrabold text-gray-700">675원  ×  기간 12개월</span>
              <span className="text-[16px] font-black text-blue-600 font-['Space_Grotesk']">= 8,100원 / 연</span>
            </div>
            <div className="flex justify-between items-center p-3 border border-blue-200 bg-blue-50/50 rounded-xl shadow-3xs">
              <span className="bg-blue-900 text-white text-[11px] font-black px-2 py-0.5 rounded">3단계</span>
              <span className="text-[13.5px] font-extrabold text-gray-800">8,100원  ×  활성 회원 100명</span>
              <span className="text-[16px] font-black text-blue-900 font-['Space_Grotesk']">= 810,000원 / 연</span>
            </div>
            <span className="text-[10px] text-gray-400 block text-right font-medium">※ 호스트 1명이 보유한 활성 회원 100명 예시</span>
          </div>
          
          <div className="w-full flex justify-between items-center mt-3 pt-2 border-t border-gray-100 text-[11px] text-gray-400 font-bold">
            <span>Per Active User 기준</span>
            <span>※ 카드/PG 원가를 제외한 순수 플랫폼 수수료 기준</span>
          </div>
        </div>
      </div>
      <p className="source font-extrabold text-blue-600">작은 수수료율이라도 반복 결제 시장에서는 사용자 수가 쌓일수록 안정적인 플랫폼 수익으로 전환됩니다.</p>
    </div>
  );
};

// Slide 11: Initial Market (초기 시장)
export const Slide11 = () => {
  const reasons = [
    { num: '01 높은 반복 참여', desc: '수업, 소셜, 워크숍, 이벤트가 반복적으로 발생하여 결제와 참여 이력이 계속 축적됩니다.' },
    { num: '02 복잡한 운영 구조', desc: '강사, 오거나이저, 장소, DJ, 참가자, 회비, 정산이 얽혀 있어 운영 자동화 니즈가 큽니다.' },
    { num: '03 커뮤니티 기반 확산', desc: '한 명의 호스트가 움직이면, 함께 활동하는 회원 그룹이 자연스럽게 따라오는 구조입니다.' }
  ];

  return (
    <div className="slide">
      <p className="chapter">초기 시장</p>
      <p className="page">11 / 19</p>
      <h1 className="title">Dance OS에서 첫 BEP를 검증합니다</h1>
      <p className="subtitle">초기 시장은 커뮤니티 참여도가 높고 운영 구조가 복잡한 Dance 시장입니다.</p>
      
      <div className="body-area">
        {/* 좌측 3단 리스트 */}
        <div className="flex-[5] flex flex-col gap-4 justify-between h-full py-1">
          <span className="text-[13px] font-bold text-gray-400 block mb-1">Dance OS를 첫 시장으로 선택한 이유</span>
          {reasons.map((r) => (
            <div key={r.num} className="card py-6 flex-1 justify-center">
              <h3 className="text-[17px] font-extrabold text-gray-800 leading-none mb-1">{r.num}</h3>
              <p className="text-[13.5px] leading-relaxed text-gray-500 font-medium break-keep">{r.desc}</p>
            </div>
          ))}
        </div>

        {/* 우측 Dance OS 연결구조 */}
        <div className="flex-[7] chart-box justify-center items-center relative">
          <span className="text-[13px] font-bold text-gray-400 block self-start mb-2 font-['Space_Grotesk']">First Validation Market</span>
          
          <div className="relative w-full h-[220px] flex items-center justify-center">
            {/* 연결선 SVG */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 500 220">
              <line x1="250" y1="110" x2="140" y2="50" stroke="#cbd5e1" strokeWidth="1.5" />
              <line x1="250" y1="110" x2="360" y2="50" stroke="#cbd5e1" strokeWidth="1.5" />
              <line x1="250" y1="110" x2="140" y2="170" stroke="#cbd5e1" strokeWidth="1.5" />
              <line x1="250" y1="110" x2="360" y2="170" stroke="#cbd5e1" strokeWidth="1.5" />
              <line x1="250" y1="110" x2="100" y2="110" stroke="#cbd5e1" strokeWidth="1.5" />
              <line x1="250" y1="110" x2="400" y2="110" stroke="#3b82f6" strokeWidth="2" strokeDasharray="3 3" />
            </svg>

            {/* 코어 허브 */}
            <div className="z-10 w-[110px] h-[75px] rounded-xl bg-blue-900 border-4 border-white flex flex-col items-center justify-center text-white shadow-md">
              <span className="text-[14px] font-black">Dance OS</span>
              <span className="text-[9px] font-bold opacity-80 mt-0.5">수업 · 소셜 · 워크숍 · 이벤트</span>
            </div>

            {/* 노드들 */}
            <div className="absolute top-[20px] left-[80px] px-3 py-1.5 border border-gray-150 bg-white text-[12px] font-bold rounded-lg shadow-3xs">클래스 운영</div>
            <div className="absolute top-[20px] right-[80px] px-3 py-1.5 border border-gray-150 bg-white text-[12px] font-bold rounded-lg shadow-3xs">소셜 모임</div>
            <div className="absolute top-[90px] left-[20px] px-3 py-1.5 border border-gray-150 bg-white text-[12px] font-bold rounded-lg shadow-3xs">워크숍 신청</div>
            <div className="absolute top-[90px] right-[20px] px-3 py-1.5 border border-blue-200 bg-blue-50 text-blue-600 text-[12px] font-black rounded-lg shadow-3xs">결제 · 정산</div>
            <div className="absolute bottom-[20px] left-[80px] px-3 py-1.5 border border-gray-150 bg-white text-[12px] font-bold rounded-lg shadow-3xs">회원 관리</div>
            <div className="absolute bottom-[20px] right-[80px] px-3 py-1.5 border border-gray-150 bg-white text-[12px] font-bold rounded-lg shadow-3xs">이벤트 예약</div>
          </div>

          <div className="w-full flex justify-center gap-6 mt-4 pt-3 border-t border-gray-100 text-[12px] font-black text-gray-800">
            <span>1단계 목표 사용자 <span className="text-blue-600">5만 명</span></span>
            <span className="text-gray-300">|</span>
            <span>예상 연간 플랫폼 수익 <span className="text-blue-600">약 4억 원</span></span>
          </div>
        </div>
      </div>
      <p className="source font-extrabold text-blue-600">Dance는 수업, 소셜, 워크숍, 이벤트가 반복되는 가장 적극적인 취미 활동 영역으로, Community OS의 운영 구조를 먼저 검증하는 시장입니다.</p>
    </div>
  );
};

// Slide 12: Stage 2 Market (2단계 시장)
export const Slide12 = () => {
  const reasons = [
    { num: '01 유사한 운영 구조', desc: '강사, 공간, 회원, 예약, 수강료, 반복 참여가 결합된 구조로 Dance OS와 운영 방식이 유사합니다.' },
    { num: '02 반복 결제 시장', desc: '요가, 필라테스, 피트니스는 정기 수업과 재등록이 반복되는 결제 중심 시장입니다.' },
    { num: '03 인접 시장 확장성', desc: '커뮤니티 운영 모듈을 재사용하여 화면과 데이터만 시장에 맞게 조정할 수 있습니다.' }
  ];

  return (
    <div className="slide">
      <p className="chapter">2단계 시장</p>
      <p className="page">12 / 19</p>
      <h1 className="title">Wellness OS로 동일한 운영 구조를 확장합니다</h1>
      <p className="subtitle">요가, 필라테스, 피트니스는 강사·공간·회원·예약·결제 구조가 Dance OS와 유사합니다.</p>
      
      <div className="body-area">
        {/* 좌측 3단 리스트 */}
        <div className="flex-[5] flex flex-col gap-4 justify-between h-full py-1">
          <span className="text-[13px] font-bold text-gray-400 block mb-1">Wellness 확장 이유</span>
          {reasons.map((r) => (
            <div key={r.num} className="card py-6 flex-1 justify-center">
              <h3 className="text-[17px] font-extrabold text-gray-800 leading-none mb-1">{r.num}</h3>
              <p className="text-[13.5px] leading-relaxed text-gray-500 font-medium break-keep">{r.desc}</p>
            </div>
          ))}
        </div>

        {/* 우측 확장 구조도 */}
        <div className="flex-[7] chart-box justify-center items-center relative">
          <span className="text-[13px] font-bold text-gray-400 block self-start mb-2 font-['Space_Grotesk']">Adjacent Expansion Market</span>
          
          <div className="relative w-full h-[220px] flex items-center justify-between px-6 bg-gray-50 border border-gray-100 rounded-xl">
            <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 500 220">
              <line x1="110" y1="110" x2="190" y2="110" stroke="#cbd5e1" strokeWidth="2" />
              <line x1="310" y1="110" x2="390" y2="110" stroke="#cbd5e1" strokeWidth="2" />
            </svg>

            {/* Dance OS */}
            <div className="relative z-10 w-[95px] h-[80px] border border-gray-200 bg-white rounded-xl p-2.5 flex flex-col justify-center items-center text-center shadow-3xs">
              <span className="text-[13px] font-black text-gray-800">Dance OS</span>
              <span className="text-[10px] text-gray-400 font-bold mt-1">1차 검증 시장</span>
            </div>

            {/* 모듈들 */}
            <div className="relative z-10 w-[120px] h-[140px] border border-blue-200 bg-blue-50/50 rounded-xl p-3 flex flex-col justify-center gap-1.5 shadow-3xs">
              <span className="text-[10px] font-black text-blue-900 border-b border-blue-100 pb-1 block text-center mb-1">공통 운영 모듈</span>
              <div className="grid grid-cols-2 gap-1 text-[9px] font-extrabold text-gray-700 text-center">
                <span className="bg-white border border-gray-100 py-0.5 rounded">Booking</span>
                <span className="bg-white border border-gray-100 py-0.5 rounded">Schedule</span>
                <span className="bg-white border border-gray-100 py-0.5 rounded">Payment</span>
                <span className="bg-white border border-gray-100 py-0.5 rounded">Settlement</span>
                <span className="bg-white border border-gray-100 py-0.5 rounded">Members</span>
                <span className="bg-white border border-gray-100 py-0.5 rounded">Venue</span>
              </div>
            </div>

            {/* Wellness OS */}
            <div className="relative z-10 w-[100px] h-[90px] bg-blue-900 border-4 border-white rounded-xl p-2 flex flex-col justify-center items-center text-center shadow-md text-white">
              <span className="text-[13px] font-black">Wellness OS</span>
              <span className="text-[9px] font-bold opacity-85 mt-1">인접 확장 시장</span>
              <div className="flex flex-wrap gap-0.5 mt-2 justify-center text-[7px] font-black text-blue-300">
                <span className="border border-blue-700 px-1 rounded">Yoga</span>
                <span className="border border-blue-700 px-1 rounded">Pilates</span>
                <span className="border border-blue-700 px-1 rounded">Fitness</span>
                <span className="border border-blue-700 px-1 rounded">Gym</span>
              </div>
            </div>
          </div>

          <div className="w-full flex justify-center gap-6 mt-4 pt-3 border-t border-gray-100 text-[12px] font-black text-gray-800">
            <span>누적 사용자 목표 <span className="text-blue-600">30만 명</span></span>
            <span className="text-gray-300">|</span>
            <span>예상 연간 플랫폼 수익 <span className="text-blue-600">약 24억 원</span></span>
          </div>
        </div>
      </div>
      <p className="source font-extrabold text-blue-600">사용자는 다르지만, 운영 구조는 반복됩니다. Wellness는 검증된 Community OS를 가장 자연스럽게 확장할 수 있는 인접 시장입니다.</p>
    </div>
  );
};

// Slide 13: Stage 3 Market (3단계 시장)
export const Slide13 = () => {
  const reasons = [
    { num: '01 반복 결제 구조', desc: '수강료, 재등록, 특강, 보강 등 반복 결제와 일정 관리가 지속적으로 발생합니다.' },
    { num: '02 회원 관리 밀도', desc: '학생, 학부모, 강사, 운영자가 연결되어 출결, 공지, 상담, 기록 관리가 필요합니다.' },
    { num: '03 운영 데이터 축적', desc: '수강 이력, 결제 이력, 출결 기록, 커뮤니케이션 내역이 운영 자산으로 축적될 수 있습니다.' }
  ];

  return (
    <div className="slide">
      <p className="chapter">3단계 시장</p>
      <p className="page">13 / 19</p>
      <h1 className="title">교육 시장은 반복 결제와 회원 관리가 중요한 다음 시장입니다</h1>
      <p className="subtitle">입시학원, 어학원, 전문교육기관은 수강료, 출결, 재등록, 학부모 커뮤니케이션 관리가 필요한 시장입니다.</p>
      
      <div className="body-area">
        {/* 좌측 3단 리스트 */}
        <div className="flex-[5] flex flex-col gap-4 justify-between h-full py-1">
          <span className="text-[13px] font-bold text-gray-400 block mb-1">교육 시장 확장 이유</span>
          {reasons.map((r) => (
            <div key={r.num} className="card py-6 flex-1 justify-center">
              <h3 className="text-[17px] font-extrabold text-gray-800 leading-none mb-1">{r.num}</h3>
              <p className="text-[13.5px] leading-relaxed text-gray-500 font-medium break-keep">{r.desc}</p>
            </div>
          ))}
        </div>

        {/* 우측 아카데미 다이어그램 */}
        <div className="flex-[7] chart-box justify-center items-center relative">
          <span className="text-[13px] font-bold text-gray-400 block self-start mb-2 font-['Space_Grotesk']">Structured Learning Market</span>
          
          <div className="relative w-full h-[220px] flex items-center justify-center">
            {/* 연결선 SVG */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 500 220">
              <line x1="250" y1="110" x2="140" y2="50" stroke="#cbd5e1" strokeWidth="1.5" />
              <line x1="250" y1="110" x2="360" y2="50" stroke="#3b82f6" strokeWidth="2" strokeDasharray="3 3" />
              <line x1="250" y1="110" x2="140" y2="170" stroke="#cbd5e1" strokeWidth="1.5" />
              <line x1="250" y1="110" x2="360" y2="170" stroke="#cbd5e1" strokeWidth="1.5" />
              <line x1="250" y1="110" x2="100" y2="110" stroke="#cbd5e1" strokeWidth="1.5" />
              <line x1="250" y1="110" x2="400" y2="110" stroke="#cbd5e1" strokeWidth="1.5" />
            </svg>

            {/* 코어 허브 */}
            <div className="z-10 w-[130px] h-[75px] rounded-xl bg-blue-900 border-4 border-white flex flex-col items-center justify-center text-white shadow-md text-center">
              <span className="text-[13px] font-black leading-tight">Academy / Learning OS</span>
              <span className="text-[8px] font-bold opacity-80 mt-0.5">수강 · 결제 · 출결 · 재등록 · 커뮤니케이션</span>
            </div>

            {/* 노드들 */}
            <div className="absolute top-[20px] left-[80px] px-3 py-1.5 border border-gray-150 bg-white text-[12px] font-bold rounded-lg shadow-3xs">수강 관리</div>
            <div className="absolute top-[20px] right-[80px] px-3 py-1.5 border border-blue-200 bg-blue-50 text-blue-600 text-[12px] font-black rounded-lg shadow-3xs">결제 관리</div>
            <div className="absolute top-[90px] left-[20px] px-3 py-1.5 border border-gray-150 bg-white text-[12px] font-bold rounded-lg shadow-3xs">출결 관리</div>
            <div className="absolute top-[90px] right-[20px] px-3 py-1.5 border border-gray-150 bg-white text-[12px] font-bold rounded-lg shadow-3xs">재등록 관리</div>
            <div className="absolute bottom-[20px] left-[70px] px-3 py-1.5 border border-gray-150 bg-white text-[12px] font-bold rounded-lg shadow-3xs">학부모 커뮤니케이션</div>
            <div className="absolute bottom-[20px] right-[80px] px-3 py-1.5 border border-gray-150 bg-white text-[12px] font-bold rounded-lg shadow-3xs">학습 기록</div>
          </div>

          <div className="w-full flex justify-center gap-1.5 mt-4 pt-3 border-t border-gray-100 text-[10.5px] font-extrabold text-gray-400">
            <span className="text-gray-800 font-black">Premium Academy OS (전문 교육)</span>
            <span>→</span>
            <span>National Academy OS (일반 학원)</span>
            <span>→</span>
            <span>Learning OS (확장형 학습 커뮤니티)</span>
          </div>
        </div>
      </div>
      <p className="source font-extrabold text-blue-600">Academy / Learning은 수강, 출결, 재등록, 커뮤니케이션이 반복되는 고관여 시장으로, Community OS를 더 큰 운영 워크플로우에서 검증하는 단계입니다.</p>
    </div>
  );
};

// Slide 14: Expansion Roadmap (확장 로드맵)
export const Slide14 = () => {
  return (
    <div className="slide">
      <p className="chapter">확장 로드맵</p>
      <p className="page">14 / 19</p>
      <h1 className="title">WoC는 시장을 한 번에 공략하지 않고 단계별로 확장합니다</h1>
      <p className="subtitle">각 시장에서 BEP와 운영 구조를 확인한 뒤, 검증된 Community OS 모듈을 다음 시장으로 이식합니다.</p>
      
      <div className="body-area gap-4">
        {/* 좌측 원칙 가치 */}
        <div className="flex-[4] card justify-center py-8">
          <span className="text-[12px] font-bold text-blue-500 uppercase tracking-widest block mb-2 font-['Space_Grotesk'] font-bold">Concept Definition</span>
          <h3 className="text-[20px] font-extrabold text-gray-800 leading-tight mb-4">단계별 확장 원칙</h3>
          <p className="text-[14px] leading-relaxed text-gray-500 font-medium break-keep">
            초기 시장에서 운영 구조와 결제 흐름을 검증하고, 동일한 Community OS 모듈을 인접 시장에 반복 적용합니다.
          </p>
        </div>

        {/* 우측 3단계 로드맵 카드 그리드 */}
        <div className="flex-[8] chart-box justify-center items-center relative">
          <span className="text-[13px] font-bold text-gray-400 block self-start mb-2 font-['Space_Grotesk']">Scalable Market Roadmap</span>
          
          <div className="grid grid-cols-3 gap-3 w-full flex-1">
            <div className="border border-gray-150 rounded-xl bg-white p-3 flex flex-col justify-between shadow-3xs">
              <span className="text-[12px] font-black text-blue-900 border-b border-gray-100 pb-1.5 block text-center">구간 1: 검증 시장</span>
              <div className="flex flex-col gap-1.5 mt-2 flex-1 justify-center text-[10px] font-bold text-gray-700 text-center">
                <span className="bg-blue-900 text-white py-1 rounded">Dance OS</span>
                <span className="bg-gray-50 border border-gray-100 py-1 rounded">Wellness OS</span>
                <span className="bg-gray-50 border border-gray-100 py-1 rounded">Premium Academy OS</span>
              </div>
            </div>
            
            <div className="border border-gray-150 rounded-xl bg-white p-3 flex flex-col justify-between shadow-3xs">
              <span className="text-[12px] font-black text-blue-900 border-b border-gray-100 pb-1.5 block text-center">구간 2: 반복 확장</span>
              <div className="flex flex-col gap-1.5 mt-2 flex-1 justify-center text-[10px] font-bold text-gray-700 text-center">
                <span className="bg-gray-50 border border-gray-100 py-1 rounded">National Academy OS</span>
                <span className="bg-gray-50 border border-gray-100 py-1 rounded">Learning OS</span>
                <span className="bg-gray-50 border border-gray-100 py-1 rounded">Sports OS</span>
              </div>
            </div>

            <div className="border border-gray-150 rounded-xl bg-white p-3 flex flex-col justify-between shadow-3xs">
              <span className="text-[12px] font-black text-blue-900 border-b border-gray-100 pb-1.5 block text-center">구간 3: 장기 비전</span>
              <div className="flex flex-col gap-1.5 mt-2 flex-1 justify-center text-[10px] font-bold text-gray-700 text-center">
                <span className="bg-gray-50 border border-gray-100 py-1 rounded">Hobby OS</span>
                <span className="bg-gray-50 border border-gray-100 py-1 rounded">Society OS</span>
                <span className="bg-blue-50 border border-blue-200 text-blue-600 py-1 rounded font-black">Universal OS</span>
              </div>
            </div>
          </div>

          <div className="w-full flex justify-between items-center mt-3 pt-2 border-t border-gray-100 text-[11px] text-gray-400 font-bold">
            <span>검증된 운영 모듈 → 시장별 데이터 · 화면 재조합 → 다음 커뮤니티 시장으로 이식</span>
          </div>
        </div>
      </div>
      <p className="source font-extrabold text-blue-600">“WoC의 확장은 새로운 앱을 계속 만드는 방식이 아니라, 검증된 운영 모듈을 다음 시장에 반복 적용하는 방식입니다.”</p>
    </div>
  );
};

// Slide 15: Risk Management (리스크 관리)
export const Slide15 = () => {
  const principles = [
    { num: '01 한 번에 모든 시장을 공략하지 않음', desc: '초기 시장에서 운영 구조와 결제 흐름을 먼저 검증한 뒤 다음 시장으로 이동합니다.' },
    { num: '02 단계별로 멈출 수 있는 구조', desc: '각 시장이 독립적인 운영 단위가 되기 때문에, 다음 확장이 지연되어도 사업을 유지할 수 있습니다.' },
    { num: '03 검증된 모듈만 반복 적용', desc: '새로운 앱을 계속 만드는 것이 아니라, 검증된 Community OS 모듈을 시장별로 재조합합니다.' }
  ];

  return (
    <div className="slide">
      <p className="chapter">리스크 관리</p>
      <p className="page">15 / 19</p>
      <h1 className="title">성공 가능성은 키우고, 실패 리스크는 단계별로 통제합니다</h1>
      <p className="subtitle">WoC는 단번에 대형 플랫폼으로 성공해야만 하는 구조가 아니라, 시장별 BEP를 확인하며 확장하는 구조입니다.</p>
      
      <div className="body-area">
        {/* 좌측 3단 리스크 리스트 */}
        <div className="flex-[5] flex flex-col gap-4 justify-between h-full py-1">
          <span className="text-[13px] font-bold text-gray-400 block mb-1">리스크 관리 원칙</span>
          {principles.map((p) => (
            <div key={p.num} className="card py-6 flex-1 justify-center">
              <h3 className="text-[16px] font-black text-gray-800 leading-none mb-1">{p.num}</h3>
              <p className="text-[13px] leading-relaxed text-gray-500 font-medium break-keep">{p.desc}</p>
            </div>
          ))}
        </div>

        {/* 우측 계단형 그래프 다이어그램 */}
        <div className="flex-[7] chart-box justify-center items-center relative">
          <span className="text-[13px] font-bold text-gray-400 block self-start mb-2 font-['Space_Grotesk']">Staged BEP Strategy</span>
          
          <div className="relative w-full h-[220px] flex items-end justify-between px-6 bg-gray-50 border border-gray-100 rounded-xl pb-10">
            {/* 계단 다이어그램 */}
            <div className="flex items-end gap-3 w-full justify-center">
              <div className="w-[100px] h-[40px] bg-blue-900 border border-white text-white rounded-lg flex flex-col justify-center items-center text-center shadow-3xs p-1">
                <span className="text-[10px] font-black">Dance OS</span>
                <span className="text-[7.5px] bg-white/20 px-1 rounded mt-0.5">1차 BEP 확인</span>
              </div>
              <div className="w-[100px] h-[75px] bg-blue-800 border border-white text-white rounded-lg flex flex-col justify-center items-center text-center shadow-3xs p-1">
                <span className="text-[10px] font-black">Wellness OS</span>
                <span className="text-[7.5px] bg-white/20 px-1 rounded mt-0.5">2차 BEP 확인</span>
              </div>
              <div className="w-[110px] h-[110px] bg-blue-700 border border-white text-white rounded-lg flex flex-col justify-center items-center text-center shadow-3xs p-1">
                <span className="text-[10px] font-black">Academy OS</span>
                <span className="text-[7.5px] bg-white/20 px-1 rounded mt-0.5">3차 BEP 확인</span>
              </div>
              <div className="w-[110px] h-[140px] border border-dashed border-blue-400 bg-white text-blue-950 rounded-lg flex flex-col justify-center items-center text-center shadow-3xs p-1">
                <span className="text-[9.5px] font-extrabold">Sports/Hobby/Society</span>
                <span className="text-[7.5px] text-blue-500 font-bold mt-0.5">장기 확장 영역</span>
              </div>
            </div>
          </div>
          <span className="text-[11px] text-gray-400 font-bold block mt-2 text-center w-full">※ 다음 시장 진입이 지연되더라도, 이전 단계의 운영 단위가 독립 사업으로 유지될 수 있습니다.</span>
        </div>
      </div>
      <p className="source font-extrabold text-blue-600">각 단계에서 BEP+ 상태를 유지하며 다음 시장을 점검하기 때문에, 확장 리스크를 단계별로 통제할 수 있습니다.</p>
    </div>
  );
};

// Slide 16: Financial Projection (재무 전망)
export const Slide16 = () => {
  const assumptions = [
    { num: '01 낮은 수수료율', desc: '플랫폼 순수 수수료율은 보수적으로 0.5%만 적용합니다.' },
    { num: '02 단계별 시장 확장', desc: 'Dance OS에서 시작해 Wellness, Academy / Learning으로 순차 확장합니다.' },
    { num: '03 반복 결제 기반', desc: '수업, 모임, 이벤트, 재등록 등 반복 결제 흐름을 기반으로 수익이 누적됩니다.' }
  ];

  return (
    <div className="slide">
      <p className="chapter">재무 전망</p>
      <p className="page">16 / 19</p>
      <h1 className="title">보수적 수수료율 0.5% 기준 재무 전망</h1>
      <p className="subtitle">플랫폼 순수 수수료율 0.5%만 적용해도 단계별 사용자 확장에 따라 수익 구조가 형성됩니다.</p>
      
      <div className="body-area">
        {/* 좌측 3단 리스트 */}
        <div className="flex-[5] flex flex-col gap-4 justify-between h-full py-1">
          <span className="text-[13px] font-bold text-gray-400 block mb-1">재무 전망 전제</span>
          {assumptions.map((a) => (
            <div key={a.num} className="card py-6 flex-1 justify-center">
              <h3 className="text-[16px] font-black text-gray-800 leading-none mb-1">{a.num}</h3>
              <p className="text-[13px] leading-relaxed text-gray-500 font-medium break-keep">{a.desc}</p>
            </div>
          ))}
        </div>

        {/* 우측 3단 세로 막대 그래프 */}
        <div className="flex-[7] chart-box justify-center items-center relative">
          <span className="text-[13px] font-bold text-gray-400 block self-start mb-2 font-['Space_Grotesk']">Revenue Projection</span>
          
          <div className="relative w-full h-[220px] bg-gray-50 border border-gray-100 rounded-xl flex items-end justify-around pb-6 pt-8">
            {/* 막대기 1 */}
            <div className="flex flex-col items-center gap-2">
              <span className="text-[10px] text-gray-400 font-extrabold">1단계 · 2026 3Q</span>
              <span className="text-[12px] font-black text-gray-800">약 4억 원</span>
              <div className="w-[60px] h-[35px] bg-blue-900 border border-white rounded-t-lg shadow-3xs flex justify-center items-center text-white text-[9px] font-bold">5만 명</div>
              <span className="text-[9px] text-gray-400 font-bold whitespace-nowrap">Dance OS 검증</span>
            </div>

            {/* 막대기 2 */}
            <div className="flex flex-col items-center gap-2">
              <span className="text-[10px] text-gray-400 font-extrabold">2단계 · 2026 4Q</span>
              <span className="text-[12px] font-black text-gray-800">약 16억 원</span>
              <div className="w-[60px] h-[85px] bg-blue-800 border border-white rounded-t-lg shadow-3xs flex justify-center items-center text-white text-[9px] font-bold font-['Space_Grotesk']">20만 명</div>
              <span className="text-[9px] text-gray-400 font-bold whitespace-nowrap">Stage/Dance 확장</span>
            </div>

            {/* 막대기 3 */}
            <div className="flex flex-col items-center gap-2">
              <span className="text-[10px] text-gray-400 font-extrabold">3단계 · 2027 1H</span>
              <span className="text-[12px] font-black text-gray-800">약 24억 원</span>
              <div className="w-[60px] h-[120px] bg-blue-700 border border-white rounded-t-lg shadow-3xs flex justify-center items-center text-white text-[9px] font-bold font-['Space_Grotesk']">30만 명</div>
              <span className="text-[9px] text-gray-400 font-bold whitespace-nowrap">Wellness OS 확장</span>
            </div>
            
            {/* 총 합계 우측 고정 */}
            <div className="absolute top-2 right-4 flex flex-col items-end">
              <span className="text-[10.5px] font-black text-blue-900">누적 50만 명 생태계</span>
              <span className="text-[14px] font-black text-blue-600">합계 약 40억 원</span>
              <span className="text-[7.5px] text-gray-400 font-bold">4단계 · 2027 2H 이후</span>
            </div>
          </div>
          <span className="text-[11px] text-gray-400 font-bold block mt-2 text-center w-full">※ 카드/PG 원가를 제외한 순수 플랫폼 수수료 0.5% 기준 전망</span>
        </div>
      </div>
      <p className="source font-extrabold text-blue-600">WoC의 재무 전망은 높은 수수료율이 아니라, 낮은 0.5% 수수료와 단계별 사용자 확장에 기반합니다.</p>
    </div>
  );
};

// Slide 17: Investment Plan (투자 계획)
export const Slide17 = () => {
  const funds = [
    { title: '카드결제 및 정산 시스템 구축 (핵심)', cost: '2,000만 원', pct: 20 },
    { title: '시스템 운영 및 고도화', cost: '3,000만 원', pct: 30 },
    { title: '시장 확장 및 초기 마케팅', cost: '2,000만 원', pct: 20 },
    { title: '창업자 선투입 비용 회수', cost: '2,000만 원', pct: 20 },
    { title: '운영 예비비', cost: '1,000만 원', pct: 10 }
  ];

  return (
    <div className="slide">
      <p className="chapter">투자 계획</p>
      <p className="page">17 / 19</p>
      <h1 className="title">Angel Round 투자 계획</h1>
      <p className="subtitle">앱 출시 이후 2개월차에 1억 원 규모의 엔젤 투자를 유치하고, 카드결제 도입과 초기 거래 데이터 확보에 집중합니다.</p>
      
      <div className="body-area">
        {/* 좌측 투자 조건 요약 */}
        <div className="flex-[4] card justify-center py-6 gap-4">
          <span className="text-[11px] font-black text-blue-500 uppercase tracking-widest block font-['Space_Grotesk']">Investment Terms</span>
          
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center border-b border-gray-150 pb-2">
              <span className="text-[12.5px] font-bold text-gray-500">ANGEL ROUND</span>
              <span className="text-[18px] font-black text-gray-800">1억 원</span>
            </div>
            <div className="flex justify-between items-center border-b border-gray-150 pb-2">
              <span className="text-[12.5px] font-bold text-gray-500">POST-MONEY 기준</span>
              <span className="text-[16px] font-black text-gray-800">약 4억 원</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[12.5px] font-bold text-gray-500">제안 지분</span>
              <span className="text-[18px] font-black text-blue-600">25%</span>
            </div>
          </div>
          
          <p className="text-[12.5px] leading-relaxed text-gray-400 font-medium break-keep">
            초기 투자금은 제품 완성도, 결제·정산 인프라, 초기 거래 데이터 확보에 집중됩니다.
          </p>
        </div>

        {/* 우측 활용 계획 */}
        <div className="flex-[8] chart-box justify-center items-center relative">
          <span className="text-[13px] font-bold text-gray-400 block self-start mb-2 font-['Space_Grotesk']">Use of Funds</span>
          
          <div className="w-full flex-1 flex flex-col gap-3 justify-center">
            {/* 가로 비율 바 */}
            <div className="w-full h-8 bg-gray-100 rounded-lg overflow-hidden flex text-[10px] font-black text-white text-center">
              <div className="bg-blue-900 flex items-center justify-center" style={{ width: '20%' }}>20%</div>
              <div className="bg-blue-800 flex items-center justify-center" style={{ width: '30%' }}>30%</div>
              <div className="bg-blue-700 flex items-center justify-center" style={{ width: '20%' }}>20%</div>
              <div className="bg-blue-600 flex items-center justify-center" style={{ width: '20%' }}>20%</div>
              <div className="bg-blue-500 flex items-center justify-center" style={{ width: '10%' }}>10%</div>
            </div>

            {/* 활용 내용 목록 */}
            <div className="flex flex-col gap-1.5 w-full text-[12.5px] font-bold text-gray-700">
              {funds.map((f) => (
                <div key={f.title} className="flex justify-between items-center border-b border-gray-100 pb-1">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-800"></span>
                    {f.title}
                  </span>
                  <span>{f.cost} <span className="text-[10.5px] text-gray-400 font-medium">({f.pct}%)</span></span>
                </div>
              ))}
            </div>
            <span className="text-[11px] text-gray-400 block self-start font-medium">※ 사무실 임대, 정규직 인건비, 대규모 광고비에는 사용하지 않습니다.</span>
          </div>
        </div>
      </div>
      <p className="source font-extrabold text-blue-600">홍보비는 0원, 인건비는 1인 체제를 유지하며, 결제·정산 도입과 초기 거래 데이터 확보에 집중합니다.</p>
    </div>
  );
};

// Slide 18: Exit Vision (EXIT 및 장기 비전)
export const Slide18 = () => {
  const buyers = [
    { num: '01 커뮤니티•로컬 플랫폼 기업', desc: '지역, 취미, 모임 기반 사용자 네트워크를 확장하려는 플랫폼 기업' },
    { num: '02 교육•웰니스•프랜차이즈 기업', desc: '회원 관리, 예약, 결제, 정산 시스템이 필요한 오프라인 운영 기업' },
    { num: '03 결제•PG•핀테크 기업', desc: '반복 결제와 정산 데이터를 확보하려는 결제 인프라 기업' }
  ];

  return (
    <div className="slide">
      <p className="chapter">EXIT 및 장기 비전</p>
      <p className="page">18 / 19</p>
      <h1 className="title">운영 및 결제데이터 기반 전략적 M&A를 검토합니다</h1>
      <p className="subtitle">WoC는 장기적으로 전 세계 커뮤니티 활동이 구동되는 Universal Community OS를 목표로 합니다.</p>
      
      <div className="body-area">
        {/* 좌측 M&A 후보 */}
        <div className="flex-[5] flex flex-col gap-4 justify-between h-full py-1">
          <span className="text-[13px] font-bold text-gray-400 block mb-1">전략적 M&A 후보군</span>
          {buyers.map((b) => (
            <div key={b.num} className="card py-6 flex-1 justify-center font-medium">
              <h3 className="text-[16px] font-black text-gray-800 leading-none mb-1">{b.num}</h3>
              <p className="text-[13px] leading-relaxed text-gray-500 break-keep">{b.desc}</p>
            </div>
          ))}
        </div>

        {/* 우측 5대 데이터 노드 다이어그램 */}
        <div className="flex-[7] chart-box justify-center items-center relative">
          <span className="text-[13px] font-bold text-gray-400 block self-start mb-2 font-['Space_Grotesk']">Long-term Vision</span>
          
          <div className="relative w-full h-[220px] flex items-center justify-center">
            {/* 연결선 SVG */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 500 220">
              <line x1="250" y1="110" x2="250" y2="40" stroke="#cbd5e1" strokeWidth="1.5" />
              <line x1="250" y1="110" x2="110" y2="80" stroke="#cbd5e1" strokeWidth="1.5" />
              <line x1="250" y1="110" x2="390" y2="80" stroke="#cbd5e1" strokeWidth="1.5" />
              <line x1="250" y1="110" x2="140" y2="170" stroke="#cbd5e1" strokeWidth="1.5" />
              <line x1="250" y1="110" x2="360" y2="170" stroke="#cbd5e1" strokeWidth="1.5" />
            </svg>

            {/* 코어 허브 */}
            <div className="z-10 w-[140px] h-[70px] rounded-2xl bg-blue-900 border-4 border-white flex flex-col items-center justify-center text-white shadow-md text-center">
              <span className="text-[11px] font-black">UNIVERSAL COMMUNITY OS</span>
              <span className="text-[8px] font-bold opacity-85 mt-0.5">전 세계 커뮤니티 활동을 연결하는 운영체제</span>
            </div>

            {/* 노드들 */}
            <div className="absolute top-[10px] px-3 py-1 border border-gray-150 bg-white text-[11px] font-bold rounded-lg shadow-3xs">Market Modules (시장별 운영 모듈)</div>
            <div className="absolute top-[65px] left-[5px] px-3 py-1 border border-gray-150 bg-white text-[11px] font-bold rounded-lg shadow-3xs">Activity Data (활동 이력)</div>
            <div className="absolute top-[65px] right-[5px] px-3 py-1 border border-gray-150 bg-white text-[11px] font-bold rounded-lg shadow-3xs">Member Network (회원 관계)</div>
            <div className="absolute bottom-[10px] left-[45px] px-3 py-1 border border-gray-150 bg-white text-[11px] font-bold rounded-lg shadow-3xs">Payment Data (결제 흐름)</div>
            <div className="absolute bottom-[10px] right-[45px] px-3 py-1 border border-gray-150 bg-white text-[11px] font-bold rounded-lg shadow-3xs">Settlement Data (정산 구조)</div>
          </div>
          
          <span className="text-[11.5px] font-black text-blue-600 block mt-3 text-center w-full uppercase tracking-wider">
            THE LAST PLATFORM: 사람들이 좋아하는 활동을 더 쉽게 찾고, 더 편하게 참여하고, 더 오래 기록할 수 있게 하는 플랫폼
          </span>
        </div>
      </div>
      <p className="source font-extrabold text-blue-600">WoC의 장기 가치는 단순 회원 수가 아니라, 커뮤니티 활동의 결제·정산·운영 데이터가 축적되는 Community OS 구조에 있습니다.</p>
    </div>
  );
};

// Slide 19: Ending Slide (엔딩)
export const Slide19 = () => (
  <div className="slide slide-dark flex flex-col items-center justify-center text-center">
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <div className="w-[600px] h-[600px] rounded-full bg-blue-500/[0.03] blur-[120px]" />
    </div>
    <div className="relative z-10 max-w-[1200px] w-full flex flex-col items-center">
      <h2 className="text-[80px] font-black text-[#fcf8f8] leading-none tracking-tight break-keep">
        감사합니다
      </h2>
      <div className="w-[100px] h-[1px] bg-white/20 my-10" />
      <p className="font-['Space_Grotesk'] text-[24px] font-bold tracking-[0.25em] uppercase text-white/80">
        World of Community
      </p>
      <p className="text-[14px] text-white/50 font-medium mt-3">
        취미 활동을 위한 커뮤니티 운영 플랫폼
      </p>
    </div>
    <p className="source text-white/30 font-['Space_Grotesk']">Angel Round Proposal • 2026</p>
  </div>
);
