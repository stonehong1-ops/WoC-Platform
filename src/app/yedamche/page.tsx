'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useNavigation } from '@/components/providers/NavigationProvider';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  HeroSlide,
  ContextSlide,
  FactCheckSlide,
  LocationSlide,
  FutureValueSlide,
  ValueSlide,
  GallerySlide,
  ShortsSlide,
  StatusSlide,
  BookingSlide,
} from './slides';

export default function YedamchePage() {
  const { setGlobalNavHidden, setIsHeaderVisible } = useNavigation();
  const { t } = useLanguage();

  const menuItems = [
    { id: 'gallery', labelKey: 'yedamche.menu.gallery' },
    { id: 'shorts', labelKey: 'yedamche.menu.shorts' },
    { id: 'status', labelKey: 'yedamche.menu.status' },
    { id: 'map', labelKey: 'yedamche.menu.map' },
    { id: 'vision', labelKey: 'yedamche.menu.vision' },
    { id: 'faq', labelKey: 'yedamche.menu.faq' },
    { id: 'fact', labelKey: 'yedamche.menu.fact' },
    { id: 'value', labelKey: 'yedamche.menu.value' },
    { id: 'booking', labelKey: 'yedamche.menu.booking' },
  ];

  // Scroll header hide/show state
  const [headerVisible, setHeaderVisible] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const lastScrollY = useRef(0);

  // 1. 강제 글로벌 내비게이션 격리 처리 (마운트 시 전역 GNB/LNB 제거, 이탈 시 원복)
  useEffect(() => {
    setGlobalNavHidden(true);
    setIsHeaderVisible(false);

    return () => {
      setGlobalNavHidden(false);
      setIsHeaderVisible(true);
    };
  }, [setGlobalNavHidden, setIsHeaderVisible]);

  // 2. 헤더 스크롤 반응형 숨김 제어 (Scroll Down -> Hide, Scroll Up -> Show)
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY.current && currentScrollY > 80) {
        setHeaderVisible(false);
        setIsMenuOpen(false); // 스크롤 시 메뉴 닫기
      } else {
        setHeaderVisible(true);
      }
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 3. 부드러운 스크롤 이동 앵커 기능
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // 4. 모바일 및 데스크톱 공유 기능
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
        console.error('클립보사 복사 실패:', err);
      }
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-800 font-manrope selection:bg-blue-100 selection:text-blue-900 pb-[80px]">
      <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300..700&family=Manrope:wght@200..800&display=swap" rel="stylesheet" />

      {/* ── GNB Header with Hamburger Menu ── */}
      <header
        className={`fixed top-0 left-0 right-0 h-14 bg-white/95 backdrop-blur-md border-b border-slate-100 z-50 flex items-center justify-between px-5 transition-transform duration-300 ${
          headerVisible ? 'translate-y-0' : '-translate-y-full'
        }`}
      >
        <div className="flex items-center gap-2">
          <span className="text-[16px] font-black text-slate-900 tracking-tight">{t('yedamche.title')}</span>
        </div>

        {/* Hamburger Toggle Button */}
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="w-10 h-10 flex items-center justify-center text-slate-700 hover:text-blue-600 active:scale-95 transition-all focus:outline-none"
          aria-label={t('common.menu') || 'Menu'}
        >
          <span className="material-symbols-outlined text-[24px]">
            {isMenuOpen ? 'close' : 'menu'}
          </span>
        </button>

        {/* Hamburger Menu Dropdown (Premium Overlay) */}
        {isMenuOpen && (
          <div className="absolute top-14 left-0 right-0 bg-white/98 backdrop-blur-lg border-b border-slate-200 shadow-xl z-40 animate-in slide-in-from-top duration-300 flex flex-col p-5 gap-3.5 max-h-[75vh] overflow-y-auto">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  scrollToSection(item.id);
                  setIsMenuOpen(false);
                }}
                className="w-full text-left py-3 px-4 hover:bg-slate-50 text-[14px] font-black text-slate-700 hover:text-blue-600 rounded-xl transition-all flex items-center justify-between bg-slate-50/40"
              >
                <span>{t(item.labelKey)}</span>
                <span className="material-symbols-outlined text-[16px] text-slate-400">chevron_right</span>
              </button>
            ))}
          </div>
        )}
      </header>

      {/* ── Main Content Sections (One-page scroll style) ── */}
      <main className="pt-14">
        {/* Section: Hero */}
        <section id="hero" className="min-h-[90vh] flex items-center justify-center border-b border-slate-100/50">
          <HeroSlide onNext={() => scrollToSection('gallery')} />
        </section>

        {/* 1. 공간 갤러리 */}
        <section id="gallery" className="py-16 border-b border-slate-100/50">
          <GallerySlide />
        </section>

        {/* 2. 숏폼 랜선투어 */}
        <section id="shorts" className="py-16 border-b border-slate-100/50">
          <ShortsSlide />
        </section>

        {/* 3. 세대 분양 현황 */}
        <section id="status" className="py-16 border-b border-slate-100/50">
          <StatusSlide />
        </section>

        {/* 4. 생활권 Map */}
        <section id="map" className="py-16 border-b border-slate-100/50">
          <LocationSlide />
        </section>

        {/* 5. 내일의 미래가치 */}
        <section id="vision" className="py-16 border-b border-slate-100/50">
          <FutureValueSlide onCTA={() => scrollToSection('value')} />
        </section>

        {/* 6. 솔직 FAQ */}
        <section id="faq" className="py-16 border-b border-slate-100/50">
          <ContextSlide />
        </section>

        {/* 7. 안전한 팩트 체크 */}
        <section id="fact" className="py-16 border-b border-slate-100/50">
          <FactCheckSlide />
        </section>

        {/* 8. 시뮬레이션 */}
        <section id="value" className="py-16 border-b border-slate-100/50">
          <ValueSlide />
        </section>

        {/* 9. 방문 및 상담 문의 */}
        <section id="booking" className="py-16">
          <BookingSlide />
        </section>
      </main>

      {/* ── Floating Bar (Bottom Fixed) ── */}
      <div className="fixed bottom-4 left-4 right-4 z-40 bg-white/95 backdrop-blur-md border border-slate-200/80 shadow-lg rounded-2xl p-2.5 flex items-center gap-2 max-w-[500px] mx-auto animate-in slide-in-from-bottom-5 duration-300">
        <button
          onClick={() => scrollToSection('booking')}
          className="flex-1 h-11 min-h-[44px] bg-blue-600 text-white rounded-xl text-[13px] font-bold shadow-md hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center gap-1.5"
        >
          <span className="material-symbols-outlined text-[18px]">call</span>
          {t('yedamche.form.title')}
        </button>

        <a
          href="https://map.kakao.com/link/to/정릉 예담채,37.613627,127.012484"
          target="_blank"
          rel="noopener noreferrer"
          className="h-11 min-h-[44px] px-4 bg-slate-100 text-slate-700 rounded-xl text-[13px] font-bold hover:bg-slate-200 active:scale-95 transition-all flex items-center justify-center gap-1.5"
        >
          <span className="material-symbols-outlined text-[18px]">directions_car</span>
          {t('yedamche.map.btn_navi').split(' ').shift()}
        </a>

        <button
          onClick={handleShare}
          className="h-11 min-h-[44px] px-4 bg-slate-100 text-slate-700 rounded-xl text-[13px] font-bold hover:bg-slate-200 active:scale-95 transition-all flex items-center justify-center gap-1.5"
        >
          <span className="material-symbols-outlined text-[18px]">share</span>
          {t('yedamche.share.btn_short')}
        </button>
      </div>
    </div>
  );
}
