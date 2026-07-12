'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { galleryService, GalleryPost } from '@/lib/firebase/galleryService';
import { getSafeStorageUrl } from '@/lib/utils/storageUtils';
import SectionHeader from '@/components/common/SectionHeader';

export default function LivePortalHome() {
  const { t } = useLanguage();
  const router = useRouter();
  
  const [posts, setPosts] = useState<GalleryPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 실시간 라이브 피드 데이터 구독
  useEffect(() => {
    const unsubscribe = galleryService.subscribeFeed((fetchedPosts) => {
      // 최신순 시간순 정렬
      const sorted = [...fetchedPosts].sort((a, b) => {
        const timeA = typeof a.createdAt === 'number' ? a.createdAt : (a.createdAt?.toMillis?.() || 0);
        const timeB = typeof b.createdAt === 'number' ? b.createdAt : (b.createdAt?.toMillis?.() || 0);
        return timeB - timeA;
      });
      setPosts(sorted);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleEnterLive = () => {
    // 입장 및 재생 클릭 시 기존 풀스크린 비디오 피드로 네비게이션
    router.push('/live?view=feed');
  };

  const getCollageCards = () => {
    const defaultCards = [
      {
        id: 'c1',
        type: 'milonga',
        title: '밀롱가 풍경',
        venue: 'La Viruta, Buenos Aires',
        uploadedAt: '최근 업로드 · 2026.06.09',
        tagLabel: 'Milonga',
        numberLabel: '01',
        img: 'https://images.unsplash.com/photo-1504609773096-104ff2c73ba4?q=80&w=400'
      },
      {
        id: 'c2',
        type: 'classDemo',
        title: '수업시연',
        venue: 'Tango Salon Seoul',
        uploadedAt: '최근 업로드 · 2026.06.08',
        tagLabel: 'Lesson',
        numberLabel: '02',
        img: 'https://images.unsplash.com/photo-1545128485-c400e7702796?q=80&w=400'
      },
      {
        id: 'c3',
        type: 'event',
        title: '이벤트',
        venue: 'Tango Festival Seoul 2026',
        uploadedAt: '최근 업로드 · 2026.06.07',
        tagLabel: 'Event',
        numberLabel: '03',
        img: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=400'
      }
    ];

    if (posts.length === 0) return defaultCards;

    const videoPosts = posts.filter(p => {
      if (p.mediaTypes?.[0] === 'video') return true;
      const url = p.media?.[0] || '';
      return url.toLowerCase().includes('.mp4') || url.toLowerCase().includes('.mov') || url.toLowerCase().includes('video');
    });

    const getFormatDate = (dateVal: any) => {
      if (!dateVal) return '2026.06.07';
      const d = typeof dateVal.toDate === 'function' ? dateVal.toDate() : new Date(dateVal);
      return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
    };

    const milongaPost = videoPosts.find(p => p.tags?.some(t => t.type === 'social')) || posts.find(p => p.tags?.some(t => t.type === 'social'));
    const classPost = videoPosts.find(p => p.tags?.some(t => t.type === 'class')) || posts.find(p => p.tags?.some(t => t.type === 'class'));
    const eventPost = videoPosts.find(p => p.tags?.some(t => t.type === 'event')) || posts.find(p => p.tags?.some(t => t.type === 'event'));

    if (milongaPost) {
      defaultCards[0].img = milongaPost.media?.[0] || defaultCards[0].img;
      defaultCards[0].title = milongaPost.caption ? (milongaPost.caption.slice(0, 12)) : defaultCards[0].title;
      defaultCards[0].venue = milongaPost.venueName || milongaPost.authorName || defaultCards[0].venue;
      defaultCards[0].uploadedAt = `최근 업로드 · ${getFormatDate(milongaPost.createdAt)}`;
      defaultCards[0].id = milongaPost.id;
    }
    if (classPost) {
      defaultCards[1].img = classPost.media?.[0] || defaultCards[1].img;
      defaultCards[1].title = classPost.caption ? (classPost.caption.slice(0, 12)) : defaultCards[1].title;
      defaultCards[1].venue = classPost.venueName || classPost.authorName || defaultCards[1].venue;
      defaultCards[1].uploadedAt = `최근 업로드 · ${getFormatDate(classPost.createdAt)}`;
      defaultCards[1].id = classPost.id;
    }
    if (eventPost) {
      defaultCards[2].img = eventPost.media?.[0] || defaultCards[2].img;
      defaultCards[2].title = eventPost.caption ? (eventPost.caption.slice(0, 12)) : defaultCards[2].title;
      defaultCards[2].venue = eventPost.venueName || eventPost.authorName || defaultCards[2].venue;
      defaultCards[2].uploadedAt = `최근 업로드 · ${getFormatDate(eventPost.createdAt)}`;
      defaultCards[2].id = eventPost.id;
    }

    return defaultCards;
  };

  const collageCards = getCollageCards();

  if (!mounted) {
    return <div className="bg-[#FAF9F6] min-h-screen pb-24 font-body" />;
  }

  return (
    <div className="bg-[#FAF9F6] min-h-screen pb-24 font-body relative overflow-x-hidden">
      
      {/* 백그라운드 수채화 페인팅 터치 그래픽 (Water Color Blur Decor) */}
      <div className="absolute top-[12%] left-[-25%] w-[90%] h-[320px] bg-red-200/30 rounded-full blur-[90px] pointer-events-none z-0 rotate-12" />
      <div className="absolute bottom-[20%] right-[-25%] w-[90%] h-[350px] bg-blue-200/40 rounded-full blur-[110px] pointer-events-none z-0 -rotate-12" />

      {/* 1) 상단 타이틀 영역 (Tango Moments) */}
      <div className="relative z-10 px-6 pt-10 pb-5 text-left select-none">
        <span className="text-[14px] font-black text-slate-800 tracking-wide font-headline uppercase opacity-90">
          지금, 탱고의 순간
        </span>
        <h1 className="text-[72px] font-black text-[#1A2E5A] leading-none tracking-tighter mt-1">
          LIVE
        </h1>
        <span className="text-[20px] font-bold text-blue-600 font-serif italic mt-0.5 block tracking-wide">
          Tango Moments
        </span>
        <p className="text-[12px] text-slate-500 font-bold leading-relaxed mt-4 max-w-[280px] font-body">
          세계 곳곳의 밀롱가와 수업, 이벤트<br />
          가장 최근의 탱고 순간을 만나보세요.
        </p>

        {/* 로고 배지 데코레이터 */}
        <div className="absolute top-10 right-6 w-16 h-16 rounded-full border border-slate-300 flex items-center justify-center text-center p-1 select-none pointer-events-none scale-90 opacity-60">
          <span className="text-[7.5px] font-black leading-tight text-slate-400 tracking-widest uppercase">
            TANGO<br />WORLD<br />WOC
          </span>
        </div>
      </div>

      {/* Tango Moments 섹션 헤더 공통 컴포넌트 이식 */}
      <div className="px-6 mt-2 relative z-10">
        <SectionHeader 
          title="Tango Moments"
          actionLabel="전체 보기"
          href="/live?view=feed"
        />
      </div>

      {/* 2) 메인 콜라주 포토카드 영역 */}
      <div className="relative w-full h-[620px] z-10 px-4 mt-2">
        
        {/* Card 01: 밀롱가 풍경 (우측 상단 배치) */}
        <div 
          onClick={handleEnterLive}
          className="absolute right-4 top-2 w-[55%] rotate-[3deg] bg-white border border-slate-200/70 p-2.5 pb-4 rounded-xs shadow-[0_12px_32px_-8px_rgba(0,0,0,0.12)] cursor-pointer group active:scale-[0.98] transition-all z-20"
        >
          <div className="relative aspect-[1.12/1] w-full bg-slate-50 overflow-hidden border border-slate-100">
            {collageCards[0].img.toLowerCase().includes('.mp4') || collageCards[0].img.toLowerCase().includes('.mov') ? (
              <video 
                src={`${getSafeStorageUrl(collageCards[0].img)}#t=0.001`} 
                preload="metadata"
                muted 
                playsInline 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  const img = document.createElement('img');
                  img.src = "https://images.unsplash.com/photo-1504609773096-104ff2c73ba4?q=80&w=400";
                  img.className = "w-full h-full object-cover";
                  e.currentTarget.parentElement?.appendChild(img);
                }}
              />
            ) : (
              <img 
                src={getSafeStorageUrl(collageCards[0].img)} 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                alt="" 
                onError={(e) => {
                  e.currentTarget.src = "https://images.unsplash.com/photo-1504609773096-104ff2c73ba4?q=80&w=400";
                }}
              />
            )}
          </div>
          <span className="absolute bottom-14 right-3 font-serif italic text-rose-500/25 text-[20px] font-bold select-none pointer-events-none">
            {collageCards[0].tagLabel}
          </span>
          <span className="absolute top-1 right-2.5 font-serif font-black text-rose-500/90 text-2xl select-none">
            {collageCards[0].numberLabel}
          </span>
          <div className="flex items-center gap-2 mt-3.5">
            <button className="w-7.5 h-7.5 rounded-full bg-[#1A2E5A] text-white flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 active:scale-95 transition-all">
              <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
            </button>
            <div className="text-left min-w-0 flex-1">
              <h3 className="text-[11px] font-black text-slate-800 leading-tight truncate">{collageCards[0].title}</h3>
              <p className="text-[9px] font-bold text-slate-400 mt-0.5 truncate">{collageCards[0].venue}</p>
              <p className="text-[8px] font-bold text-slate-355 mt-0.5">{collageCards[0].uploadedAt}</p>
            </div>
          </div>
        </div>

        {/* Card 02: 수업시연 (좌측 중앙 배치) */}
        <div 
          onClick={handleEnterLive}
          className="absolute left-4 top-[170px] w-[57%] -rotate-[4deg] bg-white border border-slate-200/70 p-2.5 pb-4 rounded-xs shadow-[0_15px_35px_-8px_rgba(0,0,0,0.1)] cursor-pointer group active:scale-[0.98] transition-all z-10"
        >
          <div className="relative aspect-[1.12/1] w-full bg-slate-50 overflow-hidden border border-slate-100">
            {collageCards[1].img.toLowerCase().includes('.mp4') || collageCards[1].img.toLowerCase().includes('.mov') ? (
              <video 
                src={`${getSafeStorageUrl(collageCards[1].img)}#t=0.001`} 
                preload="metadata"
                muted 
                playsInline 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  const img = document.createElement('img');
                  img.src = "https://images.unsplash.com/photo-1545128485-c400e7702796?q=80&w=400";
                  img.className = "w-full h-full object-cover";
                  e.currentTarget.parentElement?.appendChild(img);
                }}
              />
            ) : (
              <img 
                src={getSafeStorageUrl(collageCards[1].img)} 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                alt="" 
                onError={(e) => {
                  e.currentTarget.src = "https://images.unsplash.com/photo-1545128485-c400e7702796?q=80&w=400";
                }}
              />
            )}
          </div>
          <span className="absolute bottom-14 right-3 font-serif italic text-blue-500/25 text-[20px] font-bold select-none pointer-events-none">
            {collageCards[1].tagLabel}
          </span>
          <span className="absolute top-1 right-2.5 font-serif font-black text-[#1A2E5A] text-2xl select-none">
            {collageCards[1].numberLabel}
          </span>
          <div className="flex items-center gap-2 mt-3.5">
            <button className="w-7.5 h-7.5 rounded-full bg-[#1A2E5A] text-white flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 active:scale-95 transition-all">
              <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
            </button>
            <div className="text-left min-w-0 flex-1">
              <h3 className="text-[11px] font-black text-slate-800 leading-tight truncate">{collageCards[1].title}</h3>
              <p className="text-[9px] font-bold text-slate-400 mt-0.5 truncate">{collageCards[1].venue}</p>
              <p className="text-[8px] font-bold text-slate-355 mt-0.5">{collageCards[1].uploadedAt}</p>
            </div>
          </div>
        </div>

        {/* Card 03: 이벤트 (우측 하단 배치) */}
        <div 
          onClick={handleEnterLive}
          className="absolute right-4 top-[320px] w-[55%] rotate-[2deg] bg-white border border-slate-200/70 p-2.5 pb-4 rounded-xs shadow-[0_12px_32px_-8px_rgba(0,0,0,0.12)] cursor-pointer group active:scale-[0.98] transition-all z-20"
        >
          <div className="relative aspect-[1.12/1] w-full bg-slate-50 overflow-hidden border border-slate-100">
            {collageCards[2].img.toLowerCase().includes('.mp4') || collageCards[2].img.toLowerCase().includes('.mov') ? (
              <video 
                src={`${getSafeStorageUrl(collageCards[2].img)}#t=0.001`} 
                preload="metadata"
                muted 
                playsInline 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  const img = document.createElement('img');
                  img.src = "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=400";
                  img.className = "w-full h-full object-cover";
                  e.currentTarget.parentElement?.appendChild(img);
                }}
              />
            ) : (
              <img 
                src={getSafeStorageUrl(collageCards[2].img)} 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                alt="" 
                onError={(e) => {
                  e.currentTarget.src = "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=400";
                }}
              />
            )}
          </div>
          <span className="absolute bottom-14 right-3 font-serif italic text-indigo-500/25 text-[20px] font-bold select-none pointer-events-none">
            {collageCards[2].tagLabel}
          </span>
          <span className="absolute top-1 right-2.5 font-serif font-black text-slate-800 text-2xl select-none">
            {collageCards[2].numberLabel}
          </span>
          <div className="flex items-center gap-2 mt-3.5">
            <button className="w-7.5 h-7.5 rounded-full bg-[#1A2E5A] text-white flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 active:scale-95 transition-all">
              <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
            </button>
            <div className="text-left min-w-0 flex-1">
              <h3 className="text-[11px] font-black text-slate-800 leading-tight truncate">{collageCards[2].title}</h3>
              <p className="text-[9px] font-bold text-slate-400 mt-0.5 truncate">{collageCards[2].venue}</p>
              <p className="text-[8px] font-bold text-slate-355 mt-0.5">{collageCards[2].uploadedAt}</p>
            </div>
          </div>
        </div>

        {/* 3) 영문 필기체 데코레이션 배지 (Dance, Connect, Inspire) */}
        <div className="absolute left-6 top-[500px] z-10 flex flex-col font-serif italic text-slate-300 text-[20px] leading-tight select-none pointer-events-none text-left">
          <span>Dance,</span>
          <span>Connect,</span>
          <span>Inspire</span>
        </div>

      </div>

    </div>
  );
}
