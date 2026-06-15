'use client';

import React, { useState, useRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

// ── Slide 1: Hero Section (GNB + 504호 내부 비디오 배경) ──────────────────
export const HeroSlide = ({ onNext }: { onNext: () => void }) => {
  const { t } = useLanguage();

  return (
    <div className="relative w-full min-h-[90vh] flex flex-col items-center justify-center bg-slate-900 text-white px-6 py-12 md:px-20 overflow-hidden font-manrope">
      {/* Background Video with Poster fallback */}
      <div 
        className="absolute inset-0 pointer-events-none w-full h-full overflow-hidden z-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/images/yedamche/외관 (2).jpg')" }}
      >
        <video
          src="/images/yedamche/B%EC%98%81%EC%83%81%20-%20%EC%8B%A4%EB%82%B4%ED%81%B0%ED%8F%89%ED%98%95.mp4"
          poster="/images/yedamche/외관 (2).jpg"
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover opacity-45"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/60 to-slate-950" />
      </div>

      <div className="relative z-10 max-w-[800px] w-full flex flex-col items-center text-center">
        <span className="text-[12px] font-extrabold tracking-[0.3em] text-blue-400 uppercase mb-6 bg-blue-900/40 border border-blue-800/50 px-3 py-1 rounded-full">
          JEONGNEUNG YEDAMCHE
        </span>

        <h1 className="text-[32px] md:text-[52px] font-black text-white leading-tight tracking-tight break-keep mb-6">
          {t('yedamche.hero.title')}
        </h1>

        <p className="text-[15px] md:text-[18px] font-bold text-slate-100/90 leading-relaxed max-w-[600px] break-keep mb-10 drop-shadow-sm">
          {t('yedamche.hero.subtitle')}
        </p>

        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
          <button
            onClick={onNext}
            className="h-12 min-h-[44px] px-8 bg-blue-600 text-white rounded-xl font-bold shadow-md hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center gap-2 border border-blue-500/50"
          >
            {t('yedamche.cta.view_detail')}
            <span className="material-symbols-outlined text-[18px]">arrow_downward</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Slide 2: 솔직 FAQ (FAQ Accordion) ──────────────────
export const ContextSlide = () => {
  const { t } = useLanguage();
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const faqs = [
    {
      q: t('yedamche.faq.q1'),
      a: t('yedamche.faq.a1'),
    },
    {
      q: t('yedamche.faq.q2'),
      a: t('yedamche.faq.a2'),
    },
    {
      q: t('yedamche.faq.q3'),
      a: t('yedamche.faq.a3'),
    },
  ];

  return (
    <div className="w-full h-full flex flex-col justify-center bg-white text-slate-800 px-6 py-8 md:px-16 font-manrope">
      <div className="max-w-[800px] mx-auto w-full">
        <div className="text-center mb-8">
          <span className="text-[11px] font-extrabold tracking-widest text-blue-600 uppercase bg-blue-50 px-2.5 py-0.5 rounded">
            {t('yedamche.faq.title')}
          </span>
          <h2 className="text-[26px] md:text-[38px] font-black text-slate-900 tracking-tight mt-3">
            {t('yedamche.faq.subtitle')}
          </h2>
        </div>

        <div className="flex flex-col gap-4">
          {faqs.map((faq, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div
                key={idx}
                className="border border-slate-100 rounded-2xl bg-slate-50 overflow-hidden transition-all duration-300 shadow-sm"
              >
                <button
                  onClick={() => setOpenIdx(isOpen ? null : idx)}
                  className="w-full px-6 py-4.5 flex items-center justify-between text-left font-black text-slate-900 text-[15px] md:text-[16px] hover:bg-slate-100/80 transition-colors focus:outline-none"
                >
                  <span className="break-keep">{faq.q}</span>
                  <span className="material-symbols-outlined transition-transform duration-300 transform shrink-0 ml-2" style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0)' }}>
                    expand_more
                  </span>
                </button>
                <div
                  className="transition-all duration-300 ease-in-out overflow-hidden"
                  style={{ maxHeight: isOpen ? '280px' : '0' }}
                >
                  <p className="px-6 pb-5 pt-1.5 text-[13.5px] md:text-[14px] font-medium text-slate-600 leading-relaxed break-keep border-t border-slate-200/50">
                    {faq.a}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ── Slide 3: Fact-Check Cards (서류 핀치줌 뷰어 모달) ──────────────────
export const FactCheckSlide = () => {
  const { t } = useLanguage();
  const [modalType, setModalType] = useState<'daejang' | 'deunggi' | null>(null);
  const [scale, setScale] = useState(1);

  const handleOpenModal = (type: 'daejang' | 'deunggi') => {
    setScale(1);
    setModalType(type);
  };

  const cards = [
    {
      icon: 'description',
      title: t('yedamche.fact.card1.title'),
      desc: t('yedamche.fact.card1.desc'),
      btn: t('yedamche.fact.card1.btn'),
      action: () => handleOpenModal('daejang'),
    },
    {
      icon: 'gavel',
      title: t('yedamche.fact.card2.title'),
      desc: t('yedamche.fact.card2.desc'),
      btn: t('yedamche.fact.card2.btn'),
      action: () => handleOpenModal('deunggi'),
    },
    {
      icon: 'verified',
      title: t('yedamche.fact.card3.title'),
      desc: t('yedamche.fact.card3.desc'),
    },
    {
      icon: 'local_parking',
      title: t('yedamche.fact.card4.title'),
      desc: t('yedamche.fact.card4.desc'),
    },
    {
      icon: 'forest',
      title: t('yedamche.fact.card5.title'),
      desc: t('yedamche.fact.card5.desc'),
    },
  ];

  return (
    <div className="w-full h-full flex flex-col justify-center bg-white text-slate-800 px-6 py-6 md:px-12 font-manrope relative">
      <div className="max-w-[1000px] mx-auto w-full flex flex-col">
        <div className="text-center mb-6">
          <span className="text-[11px] font-extrabold tracking-widest text-blue-600 uppercase bg-blue-50 px-2.5 py-0.5 rounded">
            FACT CHECK
          </span>
          <h2 className="text-[26px] md:text-[38px] font-black text-slate-900 tracking-tight mt-2">
            {t('yedamche.fact.title')}
          </h2>
          <p className="text-[13px] md:text-[15px] font-medium text-slate-500 mt-1">
            {t('yedamche.fact.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 py-2 px-1">
          {cards.map((card, idx) => (
            <div
              key={idx}
              className="bg-slate-50 border border-slate-100 rounded-2xl p-5 flex flex-col items-center text-center shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 mb-3.5 shrink-0">
                <span className="material-symbols-outlined text-[22px]">{card.icon}</span>
              </div>
              <h3 className="text-[15px] font-black text-slate-900 tracking-tight mb-2 shrink-0">
                {card.title}
              </h3>
              <p className="text-[12px] font-semibold text-slate-500 leading-relaxed break-keep mb-4 flex-1">
                {card.desc}
              </p>
              {card.btn && (
                <button
                  onClick={card.action}
                  className="w-full h-9 min-h-[36px] bg-white border border-slate-200 text-blue-600 rounded-lg text-[11px] font-extrabold hover:border-blue-300 hover:bg-blue-50 active:scale-95 transition-all shrink-0 flex items-center justify-center gap-1 shadow-sm"
                >
                  <span className="material-symbols-outlined text-[14px]">file_open</span>
                  {card.btn}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* PDF Mock Modal (Pinch-to-zoom 시뮬레이터 지원) */}
      {modalType && (
        <div className="fixed inset-0 z-[1000] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-[600px] h-[80vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <header className="px-6 h-14 border-b border-slate-100 flex items-center justify-between shrink-0">
              <h4 className="text-[15px] font-black text-slate-800">
                {modalType === 'daejang' ? t('yedamche.fact.card1.btn') : t('yedamche.fact.card2.btn')}
              </h4>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setScale(prev => Math.min(prev + 0.25, 2.5))}
                  className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200 active:scale-90"
                  title="확대"
                >
                  <span className="material-symbols-outlined text-[18px]">zoom_in</span>
                </button>
                <button
                  onClick={() => setScale(prev => Math.max(prev - 0.25, 0.75))}
                  className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200 active:scale-90"
                  title="축소"
                >
                  <span className="material-symbols-outlined text-[18px]">zoom_out</span>
                </button>
                <a
                  href={modalType === 'daejang' ? '/assets/yedamche/mock_daejang.pdf' : '/assets/yedamche/mock_deunggi.pdf'}
                  download
                  className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200"
                  title="다운로드"
                >
                  <span className="material-symbols-outlined text-[18px]">download</span>
                </a>
                <button
                  onClick={() => setModalType(null)}
                  className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>
            </header>

            {/* Modal Body: Embedded mock PDF doc with CSS scaling */}
            <div className="flex-1 bg-slate-100 p-6 overflow-auto flex items-center justify-center">
              <div
                className="w-[85%] bg-white border border-slate-200 shadow-lg rounded-xl p-8 aspect-[1/1.4] flex flex-col justify-between transition-transform duration-200 origin-center shrink-0"
                style={{ transform: `scale(${scale})` }}
              >
                <div>
                  <div className="border-b-[3px] border-slate-800 pb-3 flex justify-between items-end">
                    <h5 className="text-[18px] font-black text-slate-900">
                      {modalType === 'daejang' ? '건 축 물 대 장' : '등 기 사 항 증 명 서'}
                    </h5>
                    <span className="text-[9px] text-slate-400 font-bold">WOC Verification</span>
                  </div>

                  <table className="w-full text-[11px] mt-6 border-collapse">
                    <tbody>
                      <tr className="border-b border-slate-100">
                        <td className="py-2.5 font-bold text-slate-400 w-24">고유번호</td>
                        <td className="py-2.5 text-slate-800 font-bold">2026-0615-1100-20236</td>
                      </tr>
                      <tr className="border-b border-slate-100">
                        <td className="py-2.5 font-bold text-slate-400">소재지번</td>
                        <td className="py-2.5 text-slate-800 font-bold">서울특별시 성북구 정릉동 202-36 예담채</td>
                      </tr>
                      <tr className="border-b border-slate-100">
                        <td className="py-2.5 font-bold text-slate-400">
                          {modalType === 'daejang' ? '구조/내진' : '권리자 및 기타'}
                        </td>
                        <td className="py-2.5 text-slate-800 font-bold leading-normal">
                          {modalType === 'daejang' 
                            ? '철근콘크리트구조 / 내진설계 1등급 적용 / 위반건축물 사항 없음 (적합)' 
                            : '소유권자: 신탁자 외 근저당권 및 지상권 설정 등 주요 융자 채무 없음 (청정)'}
                        </td>
                      </tr>
                      <tr className="border-b border-slate-100">
                        <td className="py-2.5 font-bold text-slate-400">하자대응이력</td>
                        <td className="py-2.5 text-slate-800 font-bold">지난 4년간 관리주체 누수 및 중대하자 신고 이력 없음</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="text-center text-[10px] text-slate-400 leading-normal border-t border-slate-100 pt-4 font-bold">
                  본 문서는 예담채 랜딩페이지 검토를 위한 검증 요약용 목업 서류입니다.<br/>
                  실제 등기부등본 원본은 하단 상담 예약을 통해 방문 시 투명하게 열람 제공됩니다.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Slide 4: Simple Map (점진적 정보 노출형 지도) ──────────────────
export const LocationSlide = () => {
  const { t } = useLanguage();
  const [showRealMap, setShowRealMap] = useState(false);
  const [lightbox, setLightbox] = useState<{ type: 'image' | 'video'; url: string } | null>(null);
  const [isMuted, setIsMuted] = useState(true);

  const infasList = [
    {
      id: 'station',
      label: '🚇 ' + t('yedamche.map.tab.station.title'),
      desc: t('yedamche.map.tab.station.desc'),
      videoUrl: '/images/yedamche/1.mp4',
      imageUrl: '/images/yedamche/map_station.jpg',
      badge: t('yedamche.map.marker2.badge'),
      target: '정릉역 2번 출구 도보 7분 45초 (502m)'
    },
    {
      id: 'school',
      label: '🏫 ' + t('yedamche.map.tab.school.title'),
      desc: t('yedamche.map.tab.school.desc'),
      videoUrl: '/images/yedamche/2.mp4',
      imageUrl: '/images/yedamche/map_school.jpg',
      badge: t('yedamche.map.marker3.badge'),
      target: '숭덕초/북악중 안심 학세권 도보 4분 30초 (290m)'
    },
    {
      id: 'traffic',
      label: '🚗 ' + t('yedamche.map.tab.traffic.title'),
      desc: t('yedamche.map.tab.traffic.desc'),
      videoUrl: '/images/yedamche/3.mp4',
      imageUrl: '/images/yedamche/map_traffic.jpg',
      badge: t('yedamche.map.marker4.badge'),
      target: '내부순환로 정릉IC 차량 진입 쾌속 동선'
    },
    {
      id: 'trail',
      label: '🌲 ' + t('yedamche.map.tab.trail.title'),
      desc: t('yedamche.map.tab.trail.desc'),
      videoUrl: '/images/yedamche/4.mp4',
      imageUrl: '/images/yedamche/map_trail.jpg',
      badge: t('yedamche.map.marker5.badge'),
      target: '북한산 자락 웰빙 둘레길 산책 경로 연결'
    }
  ];

  return (
    <div className="w-full h-full flex flex-col justify-center bg-white text-slate-800 px-6 py-12 md:px-12 font-manrope relative">
      <div className="max-w-[800px] mx-auto w-full flex flex-col gap-10">
        
        {/* Header Title */}
        <div className="text-center">
          <span className="text-[11px] font-extrabold tracking-widest text-blue-600 uppercase bg-blue-50 px-2.5 py-0.5 rounded">
            LOCATION & MAP
          </span>
          <h2 className="text-[26px] md:text-[36px] font-black text-slate-900 tracking-tight mt-2">
            {t('yedamche.map.title')}
          </h2>
          <p className="text-[13px] md:text-[15px] font-extrabold text-slate-700 mt-2">
            {t('yedamche.map.subtitle')}
          </p>
        </div>

        {/* Core Destination Center Card (예담채 핵심 선언) */}
        <div className="bg-gradient-to-br from-blue-900 to-slate-900 text-white rounded-3xl p-6 md:p-8 shadow-xl flex flex-col md:flex-row gap-6 items-center">
          <div className="flex-1 flex flex-col gap-3">
            <span className="text-[10px] font-extrabold tracking-[0.2em] text-blue-400 uppercase">
              THE CENTER OF LIFE
            </span>
            <h3 className="text-[20px] md:text-[24px] font-black tracking-tight leading-tight break-keep">
              {t('yedamche.map.center.title')}
            </h3>
            <p className="text-[12.5px] md:text-[13.5px] text-slate-100 font-bold leading-relaxed break-keep">
              {t('yedamche.map.center.desc')}
            </p>
          </div>
          <button
            onClick={() => setShowRealMap(true)}
            className="h-11 px-6 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl text-[13.5px] font-black shadow-md transition-all flex items-center justify-center gap-2 shrink-0 border border-blue-500/50"
          >
            <span className="material-symbols-outlined text-[18px]">map</span>
            {t('yedamche.map.btn_view_real')}
          </button>
        </div>

        {/* 4대 호재 입체 스크롤 브리핑 카드 리스트 */}
        <div className="flex flex-col gap-14 mt-4">
          {infasList.map((infra) => (
            <div 
              key={infra.id}
              className="bg-slate-50 border border-slate-100 rounded-3xl p-6 md:p-8 flex flex-col gap-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden"
            >
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b border-slate-200/50 pb-4">
                <div className="flex flex-col gap-1">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold text-blue-600 bg-blue-50 w-fit">
                    {infra.badge}
                  </span>
                  <h4 className="text-[18px] md:text-[21px] font-black text-slate-900 tracking-tight mt-1">
                    {infra.label}
                  </h4>
                </div>
                <span className="text-[12.5px] font-black text-slate-500 bg-slate-200/50 px-3 py-1 rounded-lg">
                  {infra.target}
                </span>
              </div>

              <p className="text-[13.5px] md:text-[14.5px] font-semibold text-slate-600 leading-relaxed break-keep">
                {infra.desc}
              </p>

              {/* 이미지 & 동영상 2단 입체 그리드 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 3D 약도 이미지 카드 */}
                <div 
                  onClick={() => setLightbox({ type: 'image', url: infra.imageUrl })}
                  className="group relative aspect-[4/3] rounded-2xl overflow-hidden border border-slate-100 shadow-sm cursor-zoom-in bg-white"
                >
                  <img
                    src={infra.imageUrl}
                    alt={infra.label}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="material-symbols-outlined text-white text-[28px]">zoom_in</span>
                  </div>
                  <div className="absolute bottom-2.5 right-2.5 bg-black/60 backdrop-blur-sm text-white px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1">
                    <span className="material-symbols-outlined text-[12px]">zoom_in</span> 약도 확대
                  </div>
                </div>

                {/* 귀갓길 타임랩스 숏폼 비디오 카드 */}
                <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-slate-100 shadow-sm bg-black group">
                  <video
                    src={infra.videoUrl}
                    autoPlay
                    loop
                    muted={isMuted}
                    playsInline
                    className="w-full h-full object-cover cursor-pointer"
                    onClick={() => setLightbox({ type: 'video', url: infra.videoUrl })}
                  />
                  {/* Sound Toggle Overlay Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsMuted(!isMuted);
                    }}
                    className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-black/60 backdrop-blur-sm hover:bg-black/80 text-white flex items-center justify-center active:scale-90 transition-transform"
                    title={isMuted ? '음소거 해제' : '음소거'}
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {isMuted ? 'volume_off' : 'volume_up'}
                    </span>
                  </button>
                  <div 
                    onClick={() => setLightbox({ type: 'video', url: infra.videoUrl })}
                    className="absolute bottom-2.5 left-2.5 bg-black/60 backdrop-blur-sm text-white px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[12px]">fullscreen</span> 숏폼 전체화면
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 실제 구글맵 임베드 모달 */}
      {showRealMap && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-[800px] h-[75vh] rounded-3xl overflow-hidden flex flex-col shadow-2xl">
            <div className="flex justify-between items-center px-6 py-4.5 border-b border-slate-100">
              <h3 className="font-black text-slate-900 text-[16px] md:text-[18px]">{t('yedamche.map.btn_view_real')}</h3>
              <button
                onClick={() => setShowRealMap(false)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
            <div className="flex-1 w-full bg-slate-100 relative">
              <iframe
                title="정릉 예담채 지도"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3160.7812975971485!2d127.01029531189498!3d37.61362702221295!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x357cbc67a57a16f3%3A0xe197c36662bc02e6!2z7J247J6s64-ZIDIwMi0zNg!5e0!3m2!1sko!2skr!4v1718388900000!5m2!1sko!2skr"
                className="w-full h-full border-0"
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </div>
      )}

      {/* 풀스크린 멀티미디어 라이트박스 뷰어 */}
      {lightbox && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex items-center justify-center p-4 cursor-zoom-out animate-in fade-in duration-200"
          onClick={() => setLightbox(null)}
        >
          {/* Close button top right */}
          <button
            onClick={() => setLightbox(null)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
          >
            <span className="material-symbols-outlined text-[24px]">close</span>
          </button>

          <div 
            className="max-w-full max-h-full flex items-center justify-center p-2"
            onClick={(e) => e.stopPropagation()}
          >
            {lightbox.type === 'image' ? (
              <img
                src={lightbox.url}
                alt="약도 상세보기"
                className="max-w-[95vw] max-h-[85vh] object-contain rounded-2xl border border-white/10 shadow-2xl animate-in scale-in-95 duration-200"
              />
            ) : (
              <div className="relative max-w-[95vw] max-h-[85vh] aspect-[9/16] md:max-h-[80vh] rounded-2xl overflow-hidden bg-black shadow-2xl flex items-center justify-center border border-white/10 animate-in scale-in-95 duration-200">
                <video
                  src={lightbox.url}
                  autoPlay
                  controls
                  loop
                  playsInline
                  className="w-full h-full object-contain"
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ── Slide 5: Future Value (미래 가치 3-Card 섹션 + 상승 화살표 애니메이션 + 듀얼 탭 모달) ──
export const FutureValueSlide = ({ onCTA }: { onCTA: () => void }) => {
  const { t } = useLanguage();
  const [showDualModal, setShowDualModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'traffic' | 'redev'>('traffic');

  const cards = [
    {
      title: t('yedamche.vision.card.title.1'),
      desc: t('yedamche.vision.card.desc.1'),
      badge: '교통 혁신',
      icon: 'trending_flat',
    },
    {
      title: t('yedamche.vision.card.title.2'),
      desc: t('yedamche.vision.card.desc.2'),
      badge: '주거 환경',
      icon: 'real_estate_agent',
    },
    {
      title: t('yedamche.vision.card.title.3'),
      desc: t('yedamche.vision.card.desc.3'),
      badge: '친환경',
      icon: 'nature_people',
    },
  ];

  return (
    <div className="w-full h-full flex flex-col justify-center bg-slate-50 text-slate-800 px-6 py-10 md:px-16 font-manrope">
      {/* CSS Keyframe Animation for grow-up effect */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes growUp {
          0% { transform: translateY(6px); opacity: 0.6; }
          50% { transform: translateY(-4px); opacity: 1; }
          100% { transform: translateY(6px); opacity: 0.6; }
        }
        .animate-grow-up {
          animation: growUp 2.5s infinite ease-in-out;
        }
      `}} />

      <div className="max-w-[950px] mx-auto w-full">
        <div className="text-center mb-8">
          {/* Moving growth blue arrow */}
          <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center mx-auto mb-4 animate-grow-up shadow-md">
            <span className="material-symbols-outlined text-[24px]">north</span>
          </div>
          <span className="text-[11px] font-extrabold tracking-widest text-blue-600 uppercase bg-blue-100 px-2.5 py-0.5 rounded">
            FUTURE VALUE
          </span>
          <h2 className="text-[26px] md:text-[38px] font-black text-slate-900 tracking-tight mt-3">
            {t('yedamche.vision.section.title')}
          </h2>
          <p className="text-[13.5px] md:text-[15.5px] font-medium text-slate-500 mt-2 max-w-[620px] mx-auto break-keep leading-relaxed">
            {t('yedamche.vision.section.subtitle')}
          </p>
        </div>

        {/* 3-Card Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
          {cards.map((card, idx) => (
            <div
              key={idx}
              className="bg-white border border-slate-100 rounded-2xl p-6 flex flex-col gap-4 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-extrabold bg-blue-50 text-blue-600 px-2 py-0.5 rounded">
                  {card.badge}
                </span>
                <span className="material-symbols-outlined text-slate-300 text-[20px]">{card.icon}</span>
              </div>
              <div>
                <h3 className="text-[16px] font-black text-slate-950 mb-1.5">{card.title}</h3>
                <p className="text-[13px] font-semibold text-slate-500 leading-normal break-keep">{card.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA Area */}
        <div className="flex flex-col items-center gap-4">
          <button
            onClick={() => setShowDualModal(true)}
            className="h-11 min-h-[44px] px-8 bg-blue-600 text-white rounded-xl font-bold shadow-md hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center gap-2 border border-blue-500/50 text-[13.5px]"
          >
            <span className="material-symbols-outlined">zoom_in</span>
            {t('yedamche.vision.btn_cta')}
          </button>
          <button
            onClick={onCTA}
            className="text-[12px] font-extrabold text-blue-600 hover:underline active:scale-95"
          >
            주거비 비교 시뮬레이션으로 이동
          </button>
        </div>
      </div>

      {/* 듀얼 탭(Dual Tab) 미래가치 상세 분석 모달 */}
      {showDualModal && (
        <div className="fixed inset-0 z-[1000] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-[550px] h-[78vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <header className="px-6 h-14 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
              <h4 className="text-[15px] font-black text-slate-800">예담채 미래 가치 상세 분석</h4>
              <button
                onClick={() => setShowDualModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </header>

            {/* Dual Switch Tabs */}
            <div className="px-4 py-2 bg-slate-50 shrink-0 border-b border-slate-100 flex gap-2">
              <button
                onClick={() => setActiveTab('traffic')}
                className={`flex-1 py-2.5 rounded-xl text-[12px] font-extrabold border transition-all ${
                  activeTab === 'traffic' 
                    ? 'bg-blue-600 border-blue-600 text-white shadow-sm' 
                    : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900'
                }`}
              >
                {t('yedamche.vision.tab.traffic')}
              </button>
              <button
                onClick={() => setActiveTab('redev')}
                className={`flex-1 py-2.5 rounded-xl text-[12px] font-extrabold border transition-all ${
                  activeTab === 'redev' 
                    ? 'bg-blue-600 border-blue-600 text-white shadow-sm' 
                    : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900'
                }`}
              >
                {t('yedamche.vision.tab.redev')}
              </button>
            </div>

            {/* Tab content display */}
            <div className="flex-1 w-full overflow-y-auto bg-slate-50 flex flex-col">
              {/* Map/Graphic Visualizer */}
              <div className="w-full h-[220px] shrink-0 border-b border-slate-100 relative">
                {activeTab === 'traffic' ? (
                  <iframe
                    title="강북횡단선정릉역"
                    className="w-full h-full border-0"
                    src="https://maps.google.com/maps?q=정릉역&t=&z=16&ie=UTF8&iwloc=&output=embed"
                    allowFullScreen
                  />
                ) : (
                  <iframe
                    title="정릉동개발현장"
                    className="w-full h-full border-0"
                    src="https://maps.google.com/maps?q=성북구%20정릉동%20202&t=&z=15&ie=UTF8&iwloc=&output=embed"
                    allowFullScreen
                  />
                )}
              </div>

              {/* Text Area */}
              <div className="p-6 bg-white flex-1 flex flex-col justify-between">
                <div>
                  <h5 className="text-[16px] font-black text-slate-900 mb-3 break-keep">
                    {activeTab === 'traffic' 
                      ? t('yedamche.vision.tab.traffic.title') 
                      : t('yedamche.vision.tab.redev.title')}
                  </h5>
                  <p className="text-[13px] font-semibold text-slate-500 leading-relaxed break-keep">
                    {activeTab === 'traffic' 
                      ? t('yedamche.vision.tab.traffic.desc') 
                      : t('yedamche.vision.tab.redev.desc')}
                  </p>
                </div>
              </div>
            </div>

            {/* Footer action */}
            <footer className="p-4 bg-white border-t border-slate-100 shrink-0 flex gap-2">
              <button
                onClick={() => {
                  setShowDualModal(false);
                  onCTA();
                }}
                className="w-full h-11 min-h-[44px] bg-blue-600 text-white rounded-xl text-[13px] font-bold hover:bg-blue-700 flex items-center justify-center gap-1.5 shadow-sm"
              >
                교통 및 개발 호재 기반 자가진단하기
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Slide 6: Value Slide (2단 Range Slider 주거비 시뮬레이터) ──
export const ValueSlide = () => {
  const { t } = useLanguage();
  const [loanRatio, setLoanRatio] = useState<number>(50); // 대출 비율 (10% ~ 90%)
  const [deposit, setDeposit] = useState<number>(10000); // 기존 보증금 (5000만원 ~ 20000만원, 단위 만원)

  const homePrice = 24000; // 분양가 2억 4천만원 고정 (단위 만원)
  const loanAmount = (homePrice * loanRatio) / 100;
  
  // 필요 실투자금 = 분양가 - 대출금 - 기존 보증금
  const requiredInvest = Math.max(homePrice - loanAmount - deposit, 0);

  // 월 예상 이자 비용 = 대출금 * 4% (연이율) / 12개월
  const monthlyInterest = Math.round((loanAmount * 0.04) / 12);

  // 주변 월세 비교 시뮬레이션용 (고정값 90만원)
  const marketRent = 90;

  return (
    <div className="w-full h-full flex flex-col justify-center bg-white text-slate-800 px-6 py-6 md:px-12 font-manrope">
      <div className="max-w-[850px] mx-auto w-full">
        <div className="text-center mb-6">
          <span className="text-[11px] font-extrabold tracking-widest text-blue-600 uppercase bg-blue-50 px-2.5 py-0.5 rounded">
            VALUE SIMULATION
          </span>
          <h2 className="text-[26px] md:text-[36px] font-black text-slate-900 tracking-tight mt-2">
            {t('yedamche.value.title')}
          </h2>
          <p className="text-[13px] md:text-[15px] font-medium text-slate-500 mt-1">
            {t('yedamche.value.subtitle')}
          </p>
        </div>

        {/* 2-Range Sliders Panel */}
        <div className="bg-slate-50 border border-slate-100 rounded-3xl p-5 mb-6 flex flex-col gap-5 shadow-sm">
          {/* Slider 1: 대출 비율 (LTV) */}
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center text-[12.5px] font-extrabold text-slate-700">
              <span>{t('yedamche.value.slider.loan')}</span>
              <span className="text-blue-600 font-black">{loanRatio}% ({Math.round(loanAmount / 10000)}억 {Math.round((loanAmount % 10000) / 100)}백)</span>
            </div>
            <input
              type="range"
              min="10"
              max="90"
              step="5"
              value={loanRatio}
              onChange={(e) => setLoanRatio(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex justify-between text-[9px] text-slate-400 font-bold px-1">
              <span>10%</span>
              <span>50%</span>
              <span>90%</span>
            </div>
          </div>

          {/* Slider 2: 기존 보증금 */}
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center text-[12.5px] font-extrabold text-slate-700">
              <span>{t('yedamche.value.slider.deposit')}</span>
              <span className="text-blue-600 font-black">{deposit / 10000}억 {deposit % 10000 > 0 ? `${(deposit % 10000) / 100}백` : ''}원</span>
            </div>
            <input
              type="range"
              min="5000"
              max="20000"
              step="1000"
              value={deposit}
              onChange={(e) => setDeposit(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex justify-between text-[9px] text-slate-400 font-bold px-1">
              <span>5천만</span>
              <span>1.2억</span>
              <span>2억</span>
            </div>
          </div>
        </div>

        {/* Graph comparison */}
        <div className="bg-slate-50 border border-slate-100 rounded-3xl p-6 flex flex-col gap-6 shadow-sm">
          {/* 1. 필요 실투자금액 수치 */}
          <div className="flex justify-between items-center bg-white border border-slate-100 p-4 rounded-2xl shadow-sm">
            <span className="text-[13px] font-black text-slate-800">{t('yedamche.value.calc.invest')}</span>
            <span className="text-[17px] font-black text-blue-600">
              {requiredInvest === 0 ? '0원' : `${Math.floor(requiredInvest / 10000)}억 ${requiredInvest % 10000 > 0 ? `${requiredInvest % 10000}만원` : ''}`}
            </span>
          </div>

          <div className="flex flex-col gap-4">
            {/* Yours graph: 월 예상 이자 비용 */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between text-[12.5px] font-bold text-slate-800">
                <span>{t('yedamche.value.calc.interest')}</span>
                <span className="text-blue-600 font-black">{monthlyInterest}만원/월</span>
              </div>
              <div className="w-full h-3.5 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min((monthlyInterest / 120) * 100, 100)}%` }}
                />
              </div>
            </div>

            {/* Lease graph: 주변 월세 비용 */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between text-[12.5px] font-bold text-slate-800">
                <span>{t('yedamche.value.graph.lease')}</span>
                <span className="text-slate-500 font-black">{marketRent}만원/월</span>
              </div>
              <div className="w-full h-3.5 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-slate-400 rounded-full transition-all duration-300"
                  style={{ width: `${(marketRent / 120) * 100}%` }}
                />
              </div>
            </div>
          </div>

          <div className="border-t border-slate-200/60 pt-4 text-[13px] md:text-[14px] font-bold text-slate-600 leading-relaxed break-keep text-center">
            {t('yedamche.value.message')}
          </div>
        </div>
      </div>
    </div>
  );
};

export const GallerySlide = () => {
  const { t } = useLanguage();
  const [activeCategory, setActiveCategory] = useState<'kitchen' | 'living' | 'bedroom' | 'utility' | 'exterior'>('kitchen');
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);

  const galleryData = {
    exterior: [
      { url: '/images/yedamche/외관 (2).jpg', caption: t('yedamche.gallery.desc.exterior1') },
      { url: '/images/yedamche/외관 (3).jpg', caption: t('yedamche.gallery.desc.exterior2') },
      { url: '/images/yedamche/외관 (4).jpg', caption: t('yedamche.gallery.desc.exterior3') },
      { url: '/images/yedamche/1층.jpg', caption: t('yedamche.gallery.desc.exterior4') },
      { url: '/images/yedamche/1층 로비.jpg', caption: t('yedamche.gallery.desc.exterior5') },
    ],
    living: [
      { url: '/images/yedamche/거실.jpg', caption: t('yedamche.gallery.desc.living1') },
      { url: '/images/yedamche/거실 (2).jpg', caption: t('yedamche.gallery.desc.living2') },
      { url: '/images/yedamche/거실 (3).jpg', caption: t('yedamche.gallery.desc.living3') },
      { url: '/images/yedamche/조명.jpg', caption: t('yedamche.gallery.desc.lighting1') },
      { url: '/images/yedamche/조명 (2).jpg', caption: t('yedamche.gallery.desc.lighting2') },
    ],
    kitchen: [
      { url: '/images/yedamche/주방.jpg', caption: t('yedamche.gallery.desc.kitchen1') },
      { url: '/images/yedamche/주방 (2).jpg', caption: t('yedamche.gallery.desc.kitchen2') },
      { url: '/images/yedamche/주방-아일랜드.jpg', caption: t('yedamche.gallery.desc.kitchen3') },
      { url: '/images/yedamche/주방-아일랜드 (2).jpg', caption: t('yedamche.gallery.desc.kitchen4') },
      { url: '/images/yedamche/주방정면.jpg', caption: t('yedamche.gallery.desc.kitchen5') },
      { url: '/images/yedamche/주방 (7).jpg', caption: t('yedamche.gallery.desc.kitchen6') },
      { url: '/images/yedamche/주방 (9).jpg', caption: t('yedamche.gallery.desc.kitchen7') },
    ],
    bedroom: [
      { url: '/images/yedamche/침실.jpg', caption: t('yedamche.gallery.desc.bedroom1') },
      { url: '/images/yedamche/침실 - 워크인 수납공간 드레스룸.jpg', caption: t('yedamche.gallery.desc.bedroom2') },
    ],
    utility: [
      { url: '/images/yedamche/창문.jpg', caption: t('yedamche.gallery.desc.window') },
      { url: '/images/yedamche/중문 - 3연동 슬라이딩 중문.jpg', caption: t('yedamche.gallery.desc.door') },
      { url: '/images/yedamche/화장실.jpg', caption: t('yedamche.gallery.desc.bath1') },
      { url: '/images/yedamche/화장실 (4).jpg', caption: t('yedamche.gallery.desc.bath2') },
    ],
  };

  const currentPhotos = galleryData[activeCategory];

  const handleCategoryChange = (cat: 'kitchen' | 'living' | 'bedroom' | 'utility' | 'exterior') => {
    setActiveCategory(cat);
    setActivePhotoIdx(0);
  };

  return (
    <div className="w-full h-full flex flex-col justify-center bg-white text-slate-800 px-6 py-6 md:px-12 font-manrope">
      <div className="max-w-[800px] mx-auto w-full flex flex-col gap-4">
        <div className="flex justify-between items-end">
          <div>
            <span className="text-[11px] font-extrabold tracking-widest text-blue-600 uppercase bg-blue-50 px-2.5 py-0.5 rounded">
              GALLERY
            </span>
            <h3 className="text-[18px] md:text-[22px] font-black text-slate-900 tracking-tight mt-1.5">
              {t('yedamche.gallery.title')}
            </h3>
          </div>
          {/* Dots indicator */}
          <div className="flex gap-1 pb-1">
            {currentPhotos.map((_, i) => (
              <button
                key={i}
                onClick={() => setActivePhotoIdx(i)}
                className={`w-1.5 h-1.5 rounded-full transition-all ${
                  activePhotoIdx === i ? 'bg-blue-600 w-3' : 'bg-slate-200'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Category tabs */}
        <div className="flex flex-wrap gap-1 py-1">
          {(['kitchen', 'living', 'bedroom', 'utility', 'exterior'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => handleCategoryChange(cat)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold border transition-all ${
                activeCategory === cat 
                  ? 'bg-blue-50 border-blue-200 text-blue-600' 
                  : 'bg-white border-slate-100 text-slate-500 hover:text-slate-800'
              }`}
            >
              {t(`yedamche.gallery.tab.${cat}`)}
            </button>
          ))}
        </div>

        {/* 3:4 세로 비율 이미지 뷰어 (공간의 깊이감을 풍부하게 연출) */}
        <div className="relative aspect-[3/4] max-h-[65vh] w-full max-w-[480px] rounded-2xl overflow-hidden bg-slate-50 border border-slate-100 shadow-md flex items-center justify-center mx-auto">
          {currentPhotos.map((photo, idx) => (
            <img
              key={photo.url}
              src={photo.url}
              alt=""
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-150 ${
                activePhotoIdx === idx ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
              }`}
            />
          ))}
          {/* Nav buttons inside */}
          {currentPhotos.length > 1 && (
            <>
              <button
                onClick={() => setActivePhotoIdx(prev => (prev - 1 + currentPhotos.length) % currentPhotos.length)}
                className="absolute left-3 w-8 h-8 rounded-full bg-white/70 backdrop-blur-sm text-slate-700 flex items-center justify-center shadow-sm active:scale-90 transition-transform z-20"
              >
                <span className="material-symbols-outlined text-[18px]">chevron_left</span>
              </button>
              <button
                onClick={() => setActivePhotoIdx(prev => (prev + 1) % currentPhotos.length)}
                className="absolute right-3 w-8 h-8 rounded-full bg-white/70 backdrop-blur-sm text-slate-700 flex items-center justify-center shadow-sm active:scale-90 transition-transform z-20"
              >
                <span className="material-symbols-outlined text-[18px]">chevron_right</span>
              </button>
            </>
          )}
        </div>
        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100/50 text-[12.5px] font-bold text-slate-600 text-center leading-normal min-h-[56px] flex items-center justify-center break-keep">
          {currentPhotos[activePhotoIdx].caption}
        </div>
      </div>

      {/* Preload all gallery images in background to avoid any switch lag */}
      <div className="hidden" aria-hidden="true">
        {Object.values(galleryData).flat().map((photo) => (
          <img key={photo.url} src={photo.url} alt="" />
        ))}
      </div>
    </div>
  );
};

// ── Slide 8: Shorts Slide (숏폼 랜선투어) ──
export const ShortsSlide = () => {
  const { t } = useLanguage();
  const [activeVideoIdx, setActiveVideoIdx] = useState(0);

  const videos = [
    { url: '/images/yedamche/B%EC%98%81%EC%83%81%20-%20%EC%8B%A4%EB%82%B4%ED%81%B0%ED%8F%89%ED%98%95.mp4', title: t('yedamche.tour.tab.threeroom') },
    { url: '/images/yedamche/B%EC%98%81%EC%83%81%20-%20%EC%8B%A4%EB%82%B4%EC%9E%91%EC%9D%80%ED%98%95%ED%8F%89.mp4', title: t('yedamche.tour.tab.tworoom') },
    { url: '/images/yedamche/B%EC%98%81%EC%83%81%20-%20%EC%8B%A4%EB%82%B4%EC%9E%91%EC%9D%80%ED%98%95%ED%8F%89.mp4', title: t('yedamche.tour.tab.oneroom') }
  ];

  return (
    <div className="w-full h-full flex flex-col justify-center bg-white text-slate-800 px-6 py-6 md:px-12 font-manrope">
      <div className="max-w-[480px] mx-auto w-full flex flex-col gap-4">
        <div>
          <span className="text-[11px] font-extrabold tracking-widest text-blue-600 uppercase bg-blue-50 px-2.5 py-0.5 rounded">
            SHORTS
          </span>
          <h3 className="text-[18px] md:text-[22px] font-black text-slate-900 tracking-tight mt-2">
            정릉 예담채 숏폼 랜선투어
          </h3>
        </div>

        {/* 숏폼 비디오 전환 탭 */}
        <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
          {videos.map((vid, idx) => (
            <button
              key={idx}
              onClick={() => setActiveVideoIdx(idx)}
              className={`flex-1 py-2 rounded-lg text-[12px] font-extrabold transition-all ${
                activeVideoIdx === idx ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {vid.title}
            </button>
          ))}
        </div>

        {/* 9:16 세로형 플레이어 */}
        <div className="aspect-[9/16] max-h-[60vh] w-full rounded-2xl overflow-hidden bg-black border border-slate-100 shadow-lg flex items-center justify-center mx-auto relative">
          <video
            key={activeVideoIdx}
            src={videos[activeVideoIdx].url}
            controls
            playsInline
            className="w-full h-full object-cover"
          />
        </div>
      </div>
    </div>
  );
};

// ── Slide 9: Status Slide (세대 분양 현황 표) ──
export const StatusSlide = () => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'immediate' | 'lease'>('immediate');

  const immediateUnits = [
    { room: '101', area: '6평 / 6평', type: '방1.5/화1', price: '1.4억', target: '다목적 스페이스 (근생)' },
    { room: '204', area: '9평 / 12평', type: '방2/화1', price: '2.4억', target: '1-2인 가구 실거주' },
    { room: '302', area: '9평 / 12평', type: '방2/화1', price: '2.7억', target: '1-2인 가구 실거주' },
    { room: '303', area: '9평 / 12평', type: '방2/화1', price: '2.5억', target: '1-2인 가구 실거주' },
  ];

  const leaseUnits = [
    { room: '201, 202, 203, 205', area: '9평 / 12평', type: '방2/화1', status: '안전 임차 중' },
    { room: '304, 305, 503', area: '9평 / 12평', type: '방2/화1', status: '안전 임차 중' },
    { room: '404', area: '12.5평 / 18평', type: '방3/화2/테라스', status: '안전 임차 중' },
    { room: '504', area: '13평 / 18평', type: '방3/화2', status: '안전 임차 중' },
  ];

  return (
    <div className="w-full h-full flex flex-col justify-center bg-white text-slate-800 px-6 py-6 md:px-12 font-manrope">
      <div className="max-w-[800px] mx-auto w-full flex flex-col gap-4">
        <div>
          <span className="text-[11px] font-extrabold tracking-widest text-blue-600 uppercase bg-blue-50 px-2.5 py-0.5 rounded">
            CURRENT STATUS
          </span>
          <h3 className="text-[18px] md:text-[22px] font-black text-slate-900 tracking-tight mt-2">
            {t('yedamche.status.title')}
          </h3>
        </div>

        {/* Filtering Tab */}
        <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
          <button
            onClick={() => setActiveTab('immediate')}
            className={`flex-1 py-2 rounded-lg text-[12px] font-extrabold transition-all ${
              activeTab === 'immediate' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            즉시 입주 가능
          </button>
          <button
            onClick={() => setActiveTab('lease')}
            className={`flex-1 py-2 rounded-lg text-[12px] font-extrabold transition-all ${
              activeTab === 'lease' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            전세 승계 조건
          </button>
        </div>

        {/* Table display */}
        <div className="bg-slate-50 border border-slate-100 rounded-2xl overflow-hidden p-4.5 min-h-[180px]">
          {activeTab === 'immediate' ? (
            <table className="w-full text-[12.5px] text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-extrabold">
                  <th className="pb-2 w-12">{t('yedamche.status.table.unit')}</th>
                  <th className="pb-2">{t('yedamche.status.table.area')}</th>
                  <th className="pb-2">{t('yedamche.status.table.structure')}</th>
                  <th className="pb-2 w-14 text-right">{t('yedamche.status.table.price')}</th>
                </tr>
              </thead>
              <tbody>
                {immediateUnits.map((row) => (
                  <tr key={row.room} className="border-b border-slate-100/50 last:border-0 text-slate-700 font-bold">
                    <td className="py-2.5 text-slate-900 font-black">{row.room}</td>
                    <td className="py-2.5">{row.area}</td>
                    <td className="py-2.5">{row.type}</td>
                    <td className="py-2.5 text-blue-600 font-black text-right">{row.price}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-[12.5px] text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-extrabold">
                  <th className="pb-2 w-24">{t('yedamche.status.table.unit')}</th>
                  <th className="pb-2">{t('yedamche.status.table.area')}</th>
                  <th className="pb-2">{t('yedamche.status.table.structure')}</th>
                  <th className="pb-2 text-right">{t('yedamche.status.table.status')}</th>
                </tr>
              </thead>
              <tbody>
                {leaseUnits.map((row) => (
                  <tr key={row.room} className="border-b border-slate-100/50 last:border-0 text-slate-700 font-bold">
                    <td className="py-2.5 text-slate-900 font-black break-keep whitespace-normal">{row.room}</td>
                    <td className="py-2.5">{row.area}</td>
                    <td className="py-2.5">{row.type}</td>
                    <td className="py-2.5 text-slate-500 text-right">{row.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div className="bg-slate-50 border border-slate-100 p-3.5 rounded-xl text-[11.5px] font-bold text-slate-500 flex justify-between items-center">
          <span>{t('yedamche.status.sold')}</span>
          <span className="text-slate-800 font-black bg-slate-200 px-2 py-0.5 rounded-md">{t('yedamche.status.sold_desc')}</span>
        </div>
      </div>
    </div>
  );
};

// ── Slide 10: Booking Slide (방문 예약 폼) ──
export const BookingSlide = () => {
  const { t } = useLanguage();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [visitDate, setVisitDate] = useState('');
  const [inquiryType, setInquiryType] = useState<'normal' | 'broker'>('normal');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone || !visitDate) {
      alert('필수 입력 필드를 모두 작성해 주세요.');
      return;
    }
    setIsSubmitting(true);

    try {
      // Import Firebase dynamically to prevent server side initialization issues
      const { db } = await import('@/lib/firebase/clientApp');
      const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');

      await addDoc(collection(db, 'bookings'), {
        name,
        phone,
        visitDate,
        inquiryType,
        propertyName: '정릉 예담채',
        createdAt: serverTimestamp(),
        status: 'pending',
      });

      setSuccess(true);
      setName('');
      setPhone('');
      setVisitDate('');
    } catch (err) {
      console.error('예약 제출 에러:', err);
      alert('방문 예약 신청 중 예기치 못한 에러가 발생했습니다. 다시 시도해 주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleShare = async () => {
    const shareUrl = typeof window !== 'undefined' ? window.location.href : 'https://www.woc.today/yedamche';
    const shareText = '정릉 예담채 안심 팩트 확인: 융자 없음 / 위반건축물 없음 / 하자 이력 없음';

    if (navigator.share) {
      try {
        await navigator.share({
          title: '정릉 예담채',
          text: shareText,
          url: shareUrl,
        });
      } catch (err) {
        console.error('공유 API 실패:', err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
        alert(t('yedamche.share.success'));
      } catch (err) {
        console.error('클립보드 복사 실패:', err);
      }
    }
  };

  return (
    <div className="w-full h-full flex flex-col justify-center bg-white text-slate-800 px-6 py-6 md:px-12 font-manrope">
      <div className="max-w-[500px] mx-auto w-full bg-slate-50 border border-slate-100 rounded-3xl p-6 md:p-8 flex flex-col justify-between animate-in fade-in duration-200">
        <div>
          <h3 className="text-[18px] md:text-[22px] font-black text-slate-900 tracking-tight mb-1">
            {t('yedamche.form.title')}
          </h3>
          <p className="text-[12px] font-semibold text-slate-500 mb-5">
            {t('yedamche.form.subtitle')}
          </p>

          {success ? (
            <div className="bg-blue-50 border border-blue-100 p-6 rounded-2xl text-center flex flex-col items-center justify-center my-6">
              <span className="material-symbols-outlined text-[36px] text-blue-600 mb-3 animate-bounce">check_circle</span>
              <h4 className="text-[15px] font-black text-slate-900 mb-1">방문 예약 접수 완료</h4>
              <p className="text-[12px] font-bold text-slate-500 leading-normal break-keep">
                신청해주셔서 감사합니다. 소유주 확인 후 즉시 안내 전화를 발송하겠습니다.
              </p>
              <button
                onClick={() => setSuccess(false)}
                className="mt-4 px-4 py-2 bg-white border border-slate-200 text-blue-600 rounded-xl text-[11px] font-extrabold hover:bg-slate-100"
              >
                새로 예약하기
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-black text-slate-500">{t('yedamche.form.name')} *</label>
                  <input
                    type="text"
                    required
                    placeholder="홍길동"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="h-10 px-3 border border-slate-200 rounded-xl text-[13px] font-bold bg-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-black text-slate-500">{t('yedamche.form.phone')} *</label>
                  <input
                    type="tel"
                    required
                    placeholder="010-1234-5678"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="h-10 px-3 border border-slate-200 rounded-xl text-[13px] font-bold bg-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-black text-slate-500">{t('yedamche.form.date')} *</label>
                <input
                  type="date"
                  required
                  value={visitDate}
                  onChange={(e) => setVisitDate(e.target.value)}
                  className="h-10 px-3 border border-slate-200 rounded-xl text-[13px] font-bold bg-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-black text-slate-500">{t('yedamche.form.type')}</label>
                <div className="flex gap-4 items-center">
                  <label className="flex items-center gap-2 text-[12.5px] font-bold text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="inquiryType"
                      checked={inquiryType === 'normal'}
                      onChange={() => setInquiryType('normal')}
                      className="w-4 h-4 text-blue-600"
                    />
                    {t('yedamche.form.type.normal')}
                  </label>
                  <label className="flex items-center gap-2 text-[12.5px] font-bold text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="inquiryType"
                      checked={inquiryType === 'broker'}
                      onChange={() => setInquiryType('broker')}
                      className="w-4 h-4 text-blue-600"
                    />
                    {t('yedamche.form.type.broker')}
                  </label>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-11 min-h-[44px] bg-blue-600 text-white rounded-xl text-[14px] font-bold hover:bg-blue-700 active:scale-[0.98] transition-all flex items-center justify-center shadow-md mt-2 disabled:opacity-50"
              >
                {isSubmitting ? '신청 처리 중...' : t('yedamche.form.btn_submit')}
              </button>
            </form>
          )}
        </div>

        <button
          onClick={handleShare}
          className="w-full h-11 min-h-[44px] border border-slate-200 bg-white text-slate-700 rounded-xl text-[13px] font-bold hover:bg-slate-100 flex items-center justify-center gap-2 mt-4"
        >
          <span className="material-symbols-outlined text-[18px]">share</span>
          {t('yedamche.share.btn')}
        </button>
      </div>
    </div>
  );
};
