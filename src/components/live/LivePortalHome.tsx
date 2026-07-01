'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';

export default function LivePortalHome() {
  const { t } = useLanguage();
  const router = useRouter();

  const handleEnterLive = () => {
    // 입장 및 재생 클릭 시 기존 풀스크린 비디오 피드로 네비게이션
    router.push('/live?view=feed');
  };

  return (
    <div className="bg-slate-50 min-h-screen pb-24 font-manrope">
      {/* 1) 상단 타이틀 영역 */}
      <div className="px-5 pt-8 pb-4 text-left">
        <div className="flex items-center gap-1">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight font-headline">
            LIVE
          </h1>
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse mt-2"></span>
        </div>
        <p className="text-slate-500 text-sm mt-1 font-medium">
          지금 이 순간, 당신 주변의 탱고
        </p>
      </div>

      {/* 메인 스크롤 콘텐츠 */}
      <div className="px-page_margin space-y-6">
        
        {/* 2) 내 주변 라이브 */}
        <section className="bg-gradient-to-br from-[#6A4CF6] to-[#987EFF] rounded-[24px] p-5 shadow-lg shadow-purple-100 relative overflow-hidden">
          {/* 위치 기반 느낌의 레이더/노드 은은한 그래픽 배경 */}
          <div className="absolute inset-0 opacity-15 pointer-events-none">
            <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <circle cx="50%" cy="40%" r="50" stroke="white" strokeWidth="1" fill="none" />
              <circle cx="50%" cy="40%" r="100" stroke="white" strokeWidth="1" fill="none" />
              <circle cx="50%" cy="40%" r="150" stroke="white" strokeWidth="1" strokeDasharray="4 4" fill="none" />
              <line x1="10%" y1="10%" x2="90%" y2="90%" stroke="white" strokeWidth="0.5" />
              <line x1="90%" y1="10%" x2="10%" y2="90%" stroke="white" strokeWidth="0.5" />
              {/* 노드 포인트들 */}
              <circle cx="30%" cy="25%" r="4" fill="white" />
              <circle cx="75%" cy="30%" r="5" fill="white" />
              <circle cx="40%" cy="75%" r="3" fill="white" />
              <circle cx="65%" cy="65%" r="4" fill="white" />
            </svg>
          </div>

          <div className="relative z-10">
            {/* 헤더 */}
            <div className="flex items-center justify-between mb-4">
              <div className="text-left">
                <h2 className="text-white font-black text-lg tracking-tight">내 주변 라이브</h2>
                <p className="text-white/80 text-xs mt-0.5 font-medium">지금 8개의 라이브 진행 중</p>
              </div>
              <button 
                onClick={() => router.push('/venues')}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/10 text-white text-xs font-bold transition-all active:scale-95"
              >
                <span className="material-symbols-outlined text-[14px]">location_on</span>
                위치 변경
              </button>
            </div>

            {/* 실제 사용 가능한 리스트 3개 프리뷰 */}
            <div className="bg-white rounded-2xl p-2 shadow-inner space-y-0.5">
              {/* 리스트 1 */}
              <div className="flex items-center justify-between p-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="relative w-11 h-11 rounded-full overflow-hidden flex-shrink-0 border border-slate-100">
                    <img 
                      src="https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=150" 
                      alt="제네바 탱고 클럽"
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute bottom-0 right-0 bg-red-500 text-white text-[8px] font-black px-1 rounded-sm tracking-tighter uppercase scale-90">
                      LIVE
                    </span>
                  </div>
                  <div className="text-left">
                    <h4 className="text-slate-900 font-bold text-sm leading-tight mb-0.5">제네바 탱고 클럽</h4>
                    <p className="text-slate-500 text-[11px] font-medium">밀롱가 · 58명 시청 중</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-slate-400 text-xs font-medium">0.6km</span>
                  <button 
                    onClick={handleEnterLive}
                    className="px-4 py-1.5 rounded-full border border-purple-200 text-[#6A4CF6] text-xs font-black hover:bg-slate-50 transition-colors active:scale-95"
                  >
                    입장
                  </button>
                </div>
              </div>

              {/* 리스트 2 */}
              <div className="flex items-center justify-between p-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="relative w-11 h-11 rounded-full overflow-hidden flex-shrink-0 border border-slate-100">
                    <img 
                      src="https://images.unsplash.com/photo-1545128485-c400e7702796?q=80&w=150" 
                      alt="엘 빠쏘 스튜디오"
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute bottom-0 right-0 bg-red-500 text-white text-[8px] font-black px-1 rounded-sm tracking-tighter uppercase scale-90">
                      LIVE
                    </span>
                  </div>
                  <div className="text-left">
                    <h4 className="text-slate-900 font-bold text-sm leading-tight mb-0.5">엘 빠쏘 스튜디오</h4>
                    <p className="text-slate-500 text-[11px] font-medium">클래스 · 32명 시청 중</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-slate-400 text-xs font-medium">1.3km</span>
                  <button 
                    onClick={handleEnterLive}
                    className="px-4 py-1.5 rounded-full border border-purple-200 text-[#6A4CF6] text-xs font-black hover:bg-slate-50 transition-colors active:scale-95"
                  >
                    입장
                  </button>
                </div>
              </div>

              {/* 리스트 3 */}
              <div className="flex items-center justify-between p-3">
                <div className="flex items-center gap-3">
                  <div className="relative w-11 h-11 rounded-full overflow-hidden flex-shrink-0 border border-slate-100">
                    <img 
                      src="https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?q=80&w=150" 
                      alt="강남 밀롱가"
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute bottom-0 right-0 bg-red-500 text-white text-[8px] font-black px-1 rounded-sm tracking-tighter uppercase scale-90">
                      LIVE
                    </span>
                  </div>
                  <div className="text-left">
                    <h4 className="text-slate-900 font-bold text-sm leading-tight mb-0.5">강남 밀롱가</h4>
                    <p className="text-slate-500 text-[11px] font-medium">밀롱가 · 24명 시청 중</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-slate-400 text-xs font-medium">2.1km</span>
                  <button 
                    onClick={handleEnterLive}
                    className="px-4 py-1.5 rounded-full border border-purple-200 text-[#6A4CF6] text-xs font-black hover:bg-slate-50 transition-colors active:scale-95"
                  >
                    입장
                  </button>
                </div>
              </div>
            </div>

            {/* 카드 하단 중앙 버튼 */}
            <button 
              onClick={handleEnterLive}
              className="w-full text-center text-white/95 hover:text-white text-xs font-bold mt-4 flex items-center justify-center gap-1 active:scale-95"
            >
              모두 보기 
              <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
            </button>
          </div>
        </section>

        {/* 3) 지금 라이브 추천 */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-800 text-base">지금 라이브 추천</h3>
            <button 
              onClick={handleEnterLive}
              className="text-slate-400 font-bold text-xs flex items-center gap-0.5 hover:text-primary transition-colors"
            >
              전체 보기
              <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            </button>
          </div>

          <div className="space-y-3">
            {/* 대표 추천 1개: 큰 가로 카드 */}
            <div 
              onClick={handleEnterLive}
              className="relative aspect-[2.1/1] rounded-2xl overflow-hidden group cursor-pointer shadow-sm border border-slate-100"
            >
              <img 
                src="https://images.unsplash.com/photo-1504609773096-104ff2c73ba4?q=80&w=600" 
                alt="Freestyle Tango is Live" 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-103"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent"></div>
              
              {/* 좌측 상단 배지 */}
              <div className="absolute top-3 left-3 bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded-md flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                LIVE 142명 시청 중
              </div>
              {/* 우측 상단 배지 */}
              <div className="absolute top-3 right-3 bg-[#6750A4] text-white text-[10px] font-black px-2 py-0.5 rounded-md">
                추천
              </div>

              {/* 하단 메타 정보 */}
              <div className="absolute bottom-3 left-3 right-3 text-left flex items-end justify-between">
                <div className="text-white drop-shadow-sm pr-4">
                  <h4 className="font-black text-base md:text-lg mb-0.5 leading-tight">Freestyle Tango is Live</h4>
                  <p className="text-white/80 text-[11px] font-semibold">밀롱가 · DJ TANGO · 22:30 시작</p>
                </div>
                {/* 재생 버튼 */}
                <div className="w-9 h-9 rounded-full bg-white/25 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shrink-0 group-hover:bg-white group-hover:text-primary transition-all duration-300">
                  <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
                </div>
              </div>
            </div>

            {/* 보조 추천 2개 (2열 카드) */}
            <div className="grid grid-cols-2 gap-3">
              {/* 보조 1 */}
              <div 
                onClick={handleEnterLive}
                className="relative aspect-[1.3/1] rounded-2xl overflow-hidden group cursor-pointer shadow-sm border border-slate-100"
              >
                <img 
                  src="https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=300" 
                  alt="Ocho Milonga" 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-103"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent"></div>
                
                {/* 배지 */}
                <div className="absolute top-2.5 left-2.5 bg-blue-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                  <span className="w-1 h-1 rounded-full bg-white animate-pulse"></span>
                  LIVE 78명
                </div>

                <div className="absolute bottom-2.5 left-2.5 right-2.5 text-left flex items-end justify-between">
                  <div className="text-white drop-shadow-sm pr-2">
                    <h5 className="font-bold text-xs mb-0.5 truncate max-w-[90px]">Ocho Milonga</h5>
                    <p className="text-white/80 text-[9px] font-medium">밀롱가 · 21:30 시작</p>
                  </div>
                  <div className="w-6 h-6 rounded-full bg-white/25 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shrink-0 group-hover:bg-white group-hover:text-primary transition-all">
                    <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
                  </div>
                </div>
              </div>

              {/* 보조 2 */}
              <div 
                onClick={handleEnterLive}
                className="relative aspect-[1.3/1] rounded-2xl overflow-hidden group cursor-pointer shadow-sm border border-slate-100"
              >
                <img 
                  src="https://images.unsplash.com/photo-1464746133101-a2c3f88e0dd9?q=80&w=300" 
                  alt="ROCHE TANGO" 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-103"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent"></div>
                
                {/* 배지 */}
                <div className="absolute top-2.5 left-2.5 bg-purple-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                  <span className="w-1 h-1 rounded-full bg-white animate-pulse"></span>
                  LIVE 45명
                </div>

                <div className="absolute bottom-2.5 left-2.5 right-2.5 text-left flex items-end justify-between">
                  <div className="text-white drop-shadow-sm pr-2">
                    <h5 className="font-bold text-xs mb-0.5 truncate max-w-[90px]">ROCHE TANGO</h5>
                    <p className="text-white/80 text-[9px] font-medium">이벤트 · 19:30 시작</p>
                  </div>
                  <div className="w-6 h-6 rounded-full bg-white/25 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shrink-0 group-hover:bg-white group-hover:text-primary transition-all">
                    <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 4) 순간을 느끼다 (최근 영상) */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-800 text-base">순간을 느끼다 (최근 영상)</h3>
            <button 
              onClick={handleEnterLive}
              className="text-slate-400 font-bold text-xs flex items-center gap-0.5 hover:text-primary transition-colors"
            >
              전체 보기
              <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            </button>
          </div>

          {/* 가로 스크롤 리스트 */}
          <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-page_margin px-page_margin">
            {[
              { time: '0:15', img: 'https://images.unsplash.com/photo-1545128485-c400e7702796?q=80&w=250' },
              { time: '0:20', img: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=250' },
              { time: '0:18', img: 'https://images.unsplash.com/photo-1464746133101-a2c3f88e0dd9?q=80&w=250' },
              { time: '0:13', img: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=250' },
              { time: '0:22', img: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?q=80&w=250' },
              { time: '0:17', img: 'https://images.unsplash.com/photo-1504609773096-104ff2c73ba4?q=80&w=250' }
            ].map((video, idx) => (
              <div 
                key={idx}
                onClick={handleEnterLive}
                className="relative w-24 aspect-[0.7/1] rounded-xl overflow-hidden group cursor-pointer shadow-sm border border-slate-100 flex-shrink-0"
              >
                <img src={video.img} alt={`최근영상 ${idx}`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                  <div className="w-6 h-6 rounded-full bg-white/35 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white group-hover:bg-white group-hover:text-primary transition-all">
                    <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
                  </div>
                </div>
                <span className="absolute bottom-1.5 right-1.5 bg-black/60 text-white text-[8px] font-bold px-1 py-0.5 rounded">
                  {video.time}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* 5) LIVE 알림 설정 배너 */}
        <section className="bg-[#FFF2F4] rounded-3xl p-5 relative overflow-hidden flex items-center justify-between border border-pink-100 shadow-sm">
          <div className="text-left z-10 max-w-[65%]">
            <h4 className="font-black text-[#FF2D55] text-sm mb-1">LIVE 알림 설정</h4>
            <p className="text-slate-600 text-[11px] leading-relaxed mb-3 font-medium">
              좋아하는 장소의 라이브, 놓치지 말고 받아보세요!
            </p>
            <button 
              onClick={() => router.push('/notification')}
              className="bg-[#FF2D55] text-white font-bold py-1.5 px-4 rounded-xl text-[10px] shadow-sm hover:bg-[#e02045] transition-colors active:scale-95"
            >
              설정하기
            </button>
          </div>
          {/* 우측 핑크색/라벤더 종 비주얼 */}
          <div className="absolute right-4 bottom-2 w-28 h-28 pointer-events-none z-0">
            <div className="relative w-full h-full flex items-center justify-center">
              {/* 귀여운 CSS/SVG 핑크 종 */}
              <svg viewBox="0 0 100 100" className="w-20 h-20 text-[#FF9EAE] animate-bounce duration-1000">
                <path fill="#FFB7C5" d="M50 15c-15 0-20 10-20 25v15l-8 8v4h56v-4l-8-8V40c0-15-5-25-20-25z" />
                <circle cx="50" cy="72" r="8" fill="#FF5E7E" />
                <path fill="#FFA4B4" d="M42 67h16c0 4-3.5 7-8 7s-8-3-8-7z" />
              </svg>
              {/* 데코 요소 */}
              <span className="absolute top-2 right-6 w-2 h-2 rounded-full bg-pink-400 animate-ping"></span>
              <span className="absolute bottom-6 left-4 w-1.5 h-1.5 rounded-full bg-pink-300"></span>
            </div>
          </div>
        </section>
        
      </div>
    </div>
  );
}
