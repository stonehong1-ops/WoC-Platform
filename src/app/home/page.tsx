'use client';

import { useState, useEffect } from 'react';
import Script from 'next/script';
import GaviCartoonPopup from '@/components/home/GaviCartoonPopup';
import EventViewer from '@/components/events/EventViewer';
import UserProfilePopup from '@/components/profile/UserProfilePopup';
import { eventService } from '@/lib/firebase/eventService';
import { galleryService, GalleryPost } from '@/lib/firebase/galleryService';
import { plazaService, Post as PlazaPost } from '@/lib/firebase/plazaService';
import { userService } from '@/lib/firebase/userService';
import { db } from '@/lib/firebase/clientApp';
import { doc, getDoc } from 'firebase/firestore';
import { Event as EventType } from '@/types/event';
import { PlatformUser } from '@/types/user';
import { useLanguage } from '@/contexts/LanguageContext';
import societiesData from '../../../woc_societies_data.json';

export default function SocietyPage() {
  const { t, language, setLanguage } = useLanguage();

  const formatDate = (date: Date, formatType: string) => {
    try {
      if (formatType === 'dateOnly') {
        return date.toLocaleDateString(language === 'KR' ? 'ko-KR' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' });
      }
      return date.toLocaleDateString(language === 'KR' ? 'ko-KR' : 'en-US', { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  const formatRelativeTime = (date: Date) => {
    try {
      const rtf = new Intl.RelativeTimeFormat(language === 'KR' ? 'ko-KR' : 'en', { numeric: 'auto' });
      const daysDifference = Math.round((date.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      if (Math.abs(daysDifference) < 1) {
        const hoursDifference = Math.round((date.getTime() - new Date().getTime()) / (1000 * 60 * 60));
        if (Math.abs(hoursDifference) < 1) {
            const minutesDifference = Math.round((date.getTime() - new Date().getTime()) / (1000 * 60));
            return rtf.format(minutesDifference, 'minute');
        }
        return rtf.format(hoursDifference, 'hour');
      }
      return rtf.format(daysDifference, 'day');
    } catch {
      return '';
    }
  };

  const [isCartoonsOpen, setIsCartoonsOpen] = useState(false);
  const [twReady, setTwReady] = useState(false);
  const [heroEvent, setHeroEvent] = useState<EventType | null>(null);
  const [isEventDetailOpen, setIsEventDetailOpen] = useState(false);
  const [livePosts, setLivePosts] = useState<GalleryPost[]>([]);
  const [topPlazaPosts, setTopPlazaPosts] = useState<PlazaPost[]>([]);
  const [featuredUsers, setFeaturedUsers] = useState<PlatformUser[]>([]);
  const [isAcrossWorldOpen, setIsAcrossWorldOpen] = useState(false);
  const [isFeelMomentOpen, setIsFeelMomentOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [translatingIds, setTranslatingIds] = useState<Set<string>>(new Set());
  const [isSafeFloorOpen, setIsSafeFloorOpen] = useState(false);
  const [comingSoonCard, setComingSoonCard] = useState<{title: string; icon: string; desc: string} | null>(null);

  const [societyId, setSocietyId] = useState('tango');
  
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sId = params.get('society');
    if (sId) {
      setSocietyId(sId);
      // Persist society context for cross-page navigation
      sessionStorage.setItem('woc_society', sId);
    }
  }, []);

  const societyInfo = societiesData.find((s: any) => s.id === societyId) || societiesData[0];

  // Fetch nearest upcoming or ongoing event for Hero (society-aware)
  useEffect(() => {
    eventService.getHeroEvent(societyId).then((event) => {
      if (event) setHeroEvent(event);
    }).catch(console.error);
  }, [societyId]);

  // Fetch gallery posts for "Live in Seoul"
  useEffect(() => {
    const unsub = galleryService.subscribeFeed((posts) => {
      setLivePosts(posts.slice(0, 3));
    });
    return () => unsub();
  }, []);

  // Fetch admin-selected featured plaza posts for "Stories from Seoul"
  useEffect(() => {
    async function fetchFeaturedPosts() {
      try {
        const bannerDoc = await getDoc(doc(db, 'settings', 'banners'));
        if (bannerDoc.exists() && bannerDoc.data().featuredPlazaPostIds) {
          const ids = bannerDoc.data().featuredPlazaPostIds as string[];
          if (ids.length > 0) {
            const posts = await plazaService.getPostsByIds(ids);
            setTopPlazaPosts(posts);
            return;
          }
        }
        // Fallback: if no admin selection, use top liked posts
        const unsub = plazaService.subscribePosts((posts) => {
          const sorted = [...posts].sort((a, b) => (b.likes || 0) - (a.likes || 0));
          setTopPlazaPosts(sorted.slice(0, 2));
        });
        return () => unsub();
      } catch (error) {
        console.error('Error fetching featured posts:', error);
      }
    }
    fetchFeaturedPosts();
  }, []);

  // Fetch featured users (instructors)
  useEffect(() => {
    userService.getAllUsers().then((users) => {
      const instructors = users.filter(u => u.isInstructor).sort((a, b) => a.nickname.localeCompare(b.nickname));
      setFeaturedUsers(instructors);
    }).catch(console.error);
  }, []);

  // Force Tailwind CDN re-process on client-side navigation
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).tailwind) {
      setTwReady(true);
      const evt = new window.Event('tailwind:refresh');
      document.dispatchEvent(evt);
      document.documentElement.classList.add('tw-refresh');
      requestAnimationFrame(() => document.documentElement.classList.remove('tw-refresh'));
    }
  }, []);

  return (
    <>
      {/* Tailwind CDN - loaded via Next.js Script for proper lifecycle management */}
      <Script
        src="https://cdn.tailwindcss.com?plugins=forms,container-queries"
        strategy="afterInteractive"
        onLoad={() => {
          if (typeof window !== 'undefined' && (window as any).tailwind) {
            (window as any).tailwind.config = {
              darkMode: 'class',
              theme: {
                extend: {
                  colors: {
                    'surface-container': '#f2ecf4',
                    'outline': '#7a7582',
                    'on-secondary-fixed-variant': '#4b4263',
                    'on-error-container': '#93000a',
                    'on-primary-fixed': '#22005d',
                    'background': '#fdf7ff',
                    'inverse-surface': '#322f35',
                    'surface-bright': '#fdf7ff',
                    'on-secondary-container': '#645a7d',
                    'primary-container': '#6750a4',
                    'on-surface-variant': '#494551',
                    'tertiary-container': '#c9a74d',
                    'secondary': '#63597c',
                    'error-container': '#ffdad6',
                    'on-secondary-fixed': '#1f1635',
                    'on-tertiary-container': '#503d00',
                    'outline-variant': '#cbc4d2',
                    'surface': '#fdf7ff',
                    'on-tertiary': '#ffffff',
                    'on-background': '#1d1b20',
                    'tertiary-fixed': '#ffdf93',
                    'inverse-on-surface': '#f5eff7',
                    'on-primary': '#ffffff',
                    'inverse-primary': '#cfbcff',
                    'surface-container-lowest': '#ffffff',
                    'surface-container-highest': '#e6e0e9',
                    'on-surface': '#1d1b20',
                    'tertiary-fixed-dim': '#e7c365',
                    'on-tertiary-fixed-variant': '#594400',
                    'secondary-container': '#e1d4fd',
                    'primary': '#004190',
                    'surface-tint': '#6750a4',
                    'error': '#ba1a1a',
                    'secondary-fixed': '#e9ddff',
                    'on-primary-container': '#e0d2ff',
                    'surface-container-low': '#f8f2fa',
                    'on-primary-fixed-variant': '#4f378a',
                    'secondary-fixed-dim': '#cdc0e9',
                    'surface-dim': '#ded8e0',
                    'primary-fixed': '#e9ddff',
                    'on-error': '#ffffff',
                    'on-secondary': '#ffffff',
                    'tertiary': '#765b00',
                    'on-tertiary-fixed': '#241a00',
                    'surface-variant': '#e6e0e9',
                    'primary-fixed-dim': '#cfbcff',
                    'surface-container-high': '#ece6ee',
                  },
                  borderRadius: { DEFAULT: '4px', lg: '8px', xl: '12px', full: '24px' },
                  spacing: {
                    page_margin: '24px', section_gap: '40px', element_gap: '16px',
                    component_padding_x: '16px', component_padding_y: '12px',
                  },
                  fontFamily: {
                    'body-lg': ['Inter'], 'label-md': ['Inter'],
                    'headline-md': ['Plus Jakarta Sans'], 'headline-lg': ['Plus Jakarta Sans'],
                    'display-lg': ['Plus Jakarta Sans'], 'body-md': ['Inter'],
                    'label-sm': ['Inter'], 'title-lg': ['Plus Jakarta Sans'],
                  },
                  fontSize: {
                    'body-lg': ['18px', { lineHeight: '1.6', fontWeight: '500' }],
                    'label-md': ['14px', { lineHeight: '1.2', fontWeight: '600' }],
                    'headline-md': ['24px', { lineHeight: '1.3', fontWeight: '800' }],
                    'headline-lg': ['32px', { lineHeight: '1.2', letterSpacing: '-0.01em', fontWeight: '800' }],
                    'display-lg': ['56px', { lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: '800' }],
                    'body-md': ['16px', { lineHeight: '1.6', fontWeight: '500' }],
                    'label-sm': ['12px', { lineHeight: '1.2', fontWeight: '500' }],
                    'title-lg': ['20px', { lineHeight: '1.4', fontWeight: '700' }],
                  },
                },
              },
            };
            setTwReady(true);
          }
        }}
      />
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@700;800&family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet"/>
      <style jsx global>{`
        .material-symbols-outlined {
          font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <div className="bg-background text-on-background antialiased font-body-md w-full relative">
        {/* Hero (Global) — Nearest Upcoming Event */}
        {heroEvent && (
          <section className="relative w-full aspect-[3/4] md:max-h-[700px] md:w-auto md:mx-auto overflow-hidden flex items-end">
            <div className="absolute inset-0 z-0">
              {heroEvent.imageUrl && (
                <img alt={heroEvent.title} className="w-full h-full object-cover animate-in fade-in duration-500" src={heroEvent.imageUrl}/>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
            </div>
            <div className="relative z-10 max-w-7xl mx-auto px-page_margin pb-section_gap w-full">
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <span className="bg-primary text-white px-3 py-1 rounded-lg font-label-md text-label-md mb-element_gap inline-block">
                  {heroEvent.startDate
                    ? formatDate(typeof heroEvent.startDate.toDate === 'function' ? heroEvent.startDate.toDate() : new Date(heroEvent.startDate as any), 'dateOnly')
                    : t('home.hero_upcoming')}
                </span>
                <h1 className="font-body-lg text-body-lg md:font-title-lg md:text-title-lg text-white mb-4">{heroEvent.title}</h1>
                <p className="font-label-md text-label-md text-white/90 max-w-2xl mb-8 line-clamp-3">{heroEvent.description}</p>
                <button
                  className="bg-primary text-white font-label-md text-label-md py-4 px-10 rounded shadow-lg hover:opacity-90 transition-opacity"
                  onClick={() => setIsEventDetailOpen(true)}
                >{t('home.hero_explore')}</button>
              </div>
            </div>
          </section>
        )}

        <main className="max-w-7xl mx-auto px-page_margin py-section_gap space-y-section_gap">
          {/* Live Near You (Local) — Gallery Posts */}
          <section>
            <div className="flex items-center justify-between mb-element_gap">
              <h2 className="font-title-lg text-title-lg font-bold">{t('home.live_in_seoul')}</h2>
              <a className="text-primary font-label-md text-label-md flex items-center gap-1" href="/live">{t('home.view_all')} <span className="material-symbols-outlined">arrow_forward</span></a>
            </div>
            <div className="flex gap-element_gap overflow-x-auto hide-scrollbar pb-4 -mx-page_margin px-page_margin md:mx-0 md:px-0">
              {livePosts.length > 0 ? livePosts.map((post) => (
                <div key={post.id} className="min-w-[280px] md:min-w-[320px] bg-surface-container-lowest rounded-xl border border-outline/10 overflow-hidden group cursor-pointer" onClick={() => window.location.href = '/live'}>
                  <div className="relative h-48">
                    {post.media?.[0] && (post.mediaTypes?.[0] === 'video' ? (
                      <video className="w-full h-full object-cover" src={post.media[0]} muted />
                    ) : (
                      <img alt={post.caption} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" src={post.media[0]}/>
                    ))}
                    <span className="absolute top-3 left-3 bg-error text-white font-label-sm text-label-sm px-2 py-0.5 rounded-lg flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span> LIVE
                    </span>
                  </div>
                  <div className="p-4">
                    <p className="text-outline font-label-sm text-label-sm uppercase tracking-wider mb-1">{post.venueName || 'Gallery'} &bull; {post.eventName || 'Seoul'}</p>
                    <h3 className="font-title-lg text-title-lg mb-2 line-clamp-1">{post.caption || 'Untitled'}</h3>
                    <div className="flex items-center text-on-surface-variant font-label-md text-label-md gap-2">
                      <span className="material-symbols-outlined text-[18px]">person</span>
                      {post.authorName}
                    </div>
                    <div className="mt-2 text-on-surface-variant font-label-sm text-label-sm flex items-center gap-3">
                      <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[16px]">favorite</span> {post.likesCount}</span>
                      <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[16px]">chat_bubble</span> {post.commentsCount}</span>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="min-w-[280px] md:min-w-[320px] bg-surface-container-lowest rounded-xl border border-outline/10 overflow-hidden p-6 text-center">
                  <span className="material-symbols-outlined text-[40px] text-outline/40 mb-2">photo_camera</span>
                  <p className="font-body-md text-on-surface-variant">{t('home.no_live_posts')}</p>
                  <a href="/live" className="text-primary font-label-md text-label-md mt-2 inline-block">{t('home.go_to_live')}</a>
                </div>
              )}
            </div>
          </section>

          {/* Local Stories — Top Plaza Posts */}
          <section>
            <h2 className="font-title-lg text-title-lg font-bold mb-element_gap">{t('home.stories_from_seoul')}</h2>
            <div className="space-y-6">
              {topPlazaPosts.map((post) => (
                <div key={post.id} className="flex flex-col p-6 bg-surface-container-low rounded-xl border border-transparent hover:border-outline/5 transition-colors cursor-pointer" onClick={() => window.location.href = '/plaza'}>
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-[12px] overflow-hidden flex-shrink-0">
                        <img alt={post.userName} className="w-full h-full object-cover" src={post.userPhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(post.userName)}&background=6750a4&color=fff`}/>
                      </div>
                      <div className="flex flex-col">
                        <h4 className="font-title-lg text-title-lg font-bold text-on-surface">{post.userName}</h4>
                        <p className="text-outline font-label-sm text-label-sm mt-0.5">
                          {post.createdAt ? (() => { try { const d = typeof post.createdAt.toDate === 'function' ? post.createdAt.toDate() : new Date(post.createdAt as any); const diff = Math.floor((Date.now() - d.getTime()) / 3600000); return diff < 24 ? formatRelativeTime(d) : formatDate(d, 'shortMonthDay'); } catch { return ''; } })() : ''}
                          {(post as any).venueName ? ` • ${(post as any).venueName}` : ''}
                        </p>
                      </div>
                    </div>
                    <button 
                      className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-primary/10 transition-colors" 
                      title={translations[post.id] ? 'Show Original' : 'Translate'}
                      onClick={async (e) => { 
                        e.stopPropagation(); 
                        if (translations[post.id]) {
                          const newTrans = { ...translations };
                          delete newTrans[post.id];
                          setTranslations(newTrans);
                          return;
                        }
                        setTranslatingIds(prev => new Set(prev).add(post.id));
                        try {
                          const targetLang = language === 'KR' ? 'en' : 'ko';
                          const res = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(post.content)}`);
                          const data = await res.json();
                          const translatedText = data[0].map((item: any) => item[0]).join('');
                          setTranslations(prev => ({ ...prev, [post.id]: translatedText }));
                        } catch (err) {
                          console.error('Translation failed', err);
                        } finally {
                          setTranslatingIds(prev => {
                            const next = new Set(prev);
                            next.delete(post.id);
                            return next;
                          });
                        }
                      }}
                    >
                      <span className={`material-symbols-outlined text-[20px] ${translations[post.id] ? 'text-primary' : 'text-outline'} ${translatingIds.has(post.id) ? 'animate-spin' : ''}`}
                        style={{ fontVariationSettings: translations[post.id] ? "'FILL' 1" : "'FILL' 0" }}
                      >language</span>
                    </button>
                  </div>
                  
                  {/* Content */}
                  <p className="font-body-md text-on-surface leading-[1.6] mb-5">
                    {translations[post.id] || post.content}
                  </p>
                  {translations[post.id] && (
                    <p className="text-outline font-label-sm text-label-sm mb-3 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">g_translate</span>
                      Translated
                    </p>
                  )}
                  {translatingIds.has(post.id) && (
                    <p className="text-outline font-label-sm text-label-sm mb-3 animate-pulse">Translating...</p>
                  )}
                  
                  {post.images && post.images.length > 0 && (
                    <div className="mb-5 flex gap-2 overflow-hidden rounded-lg">
                      {post.images.slice(0, 2).map((img, i) => (
                        <img key={i} alt="" className="h-32 w-auto rounded-lg object-cover" src={img}/>
                      ))}
                    </div>
                  )}

                  {/* Footer Stats */}
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1.5 text-on-surface-variant font-body-md text-body-md">
                      <span className="material-symbols-outlined text-[22px]">favorite</span> {post.likes || 0}
                    </span>
                    <span className="flex items-center gap-1.5 text-on-surface-variant font-body-md text-body-md">
                      <span className="material-symbols-outlined text-[22px]">chat_bubble</span> {post.commentsCount || 0}
                    </span>
                  </div>
                  
                  {/* Location */}
                  {post.location && (
                    <div className="mt-5 text-outline font-body-md text-body-md">
                      {post.location}
                    </div>
                  )}
                </div>
              ))}
              {topPlazaPosts.length === 0 && (
                <div className="p-6 bg-surface-container-low rounded-xl border border-outline/5 text-center">
                  <p className="font-body-md text-on-surface-variant">{t('home.no_stories_yet')}<a href="/plaza" className="text-primary">{t('home.visit_plaza')}</a></p>
                </div>
              )}
            </div>
          </section>

          {/* Global Pulse — Across the World */}
          <section>
            <div className="flex items-center justify-between mb-element_gap">
              <h2 className="font-title-lg text-title-lg font-bold">{t('home.across_world')}</h2>
              <span className="text-outline font-label-md text-label-md">{t('home.global_updates')}</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="relative h-40 rounded-xl overflow-hidden group cursor-pointer" onClick={() => setIsAcrossWorldOpen(true)}>
                <img alt="Buenos Aires" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAL8_eb7RxUztaKg1iYMdo3q77YGWy1m_oxA_Zk-jiXi0SDDCGmJoDIEYxhkmvzYc_swmcnJfdzEqLezzs-D_coZquzaP0_w7g2m3ODHelgVYhg8AqreHqxY7S_tmk4ulK-CPHzTCxKcALUmB8M9Tu_UE0Z7uiJHgD2EZk97puJQqwgPSUjNgXl6-ImWyck5U93i6oKSflXi-IoHfnmHP3C-ps29F2auOqAhRJu8zFT5cOpMLgOlTOtJI2y_2rOSRkCTP8tVShbgpk"/>
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                  <h3 className="text-white font-title-lg text-title-lg">Buenos Aires is on Fire &#128293;</h3>
                </div>
              </div>
              <div className="relative h-40 rounded-xl overflow-hidden group cursor-pointer" onClick={() => setIsAcrossWorldOpen(true)}>
                <img alt="Tokyo" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" src="https://lh3.googleusercontent.com/aida-public/AB6AXuB_PuFu-FYsRTEwlJKgLRpRwV8GW2zO0eJqhgoDIKKO_3dXh31X4aR7QJrpe2s_AOZwE8S4i-YGt91e4knOnOmSEcivrakJvkA986KXr_37iOamX63DpBgilh6w8ADmUk1IRPyGa7ei8MZrUv5UemwC1Uxxw4C5l_0INF_rybkexbQ8AztTk7D4f-jt6WjeEFHKWBOS5gmbtx3M2YJDyFUR1L5tUZzsSWCECrrBrA62X_eVk-LWdWqzae2ftlhQ3YI1u4CjG8_abaY"/>
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                  <h3 className="text-white font-title-lg text-title-lg">Tokyo Nights Are Back</h3>
                </div>
              </div>
              <div className="relative h-40 rounded-xl overflow-hidden group cursor-pointer" onClick={() => setIsAcrossWorldOpen(true)}>
                <img alt="Istanbul" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBRbweg__P16c0WfFJhSwQnoj6s40dtN969tweSopFo4TjRB-Sw0sAWMVZwaKbyMUV53wZRs8btOwhi-8bk4qUFvNf61TaSb9gKJtddM0fvnliJB7Yx_tC2MjMY084JTLR48rd182OygrCHxB7E-352dPNyfgHwGEyAHUhnmhht029RyS3OZ5BnK_j8WaxvZ0JSluscI9AXH7K-h87LWj4doObby7hMPMzJziHOGbOqtSYN7gjjnnJu6x3Nr3VIqEdDGW7VBkQjrQ0"/>
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                  <h3 className="text-white font-title-lg text-title-lg">Istanbul is Calling Dancers</h3>
                </div>
              </div>
              <div className="relative h-40 rounded-xl overflow-hidden group cursor-pointer" onClick={() => setIsAcrossWorldOpen(true)}>
                <img alt="Da nang" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDI3ju5PMbshaDAj-9YPR5sWPxCFHHU2dC6T8h66vosdvpchUDZt6MW4HiwvKrtY2hLdJcsqO36eJNUM_-B3O-E93n8sdNCjgr_Y6Mgrrld3KBGrdR8Zu56DzL2sSWk8jHiQtPZp63pjfVZQ6g0qqPbneE8jYozeMJBORc6PvVsdX4XK3E2t3MVolMub-3sld6McTWNFWshK-hRL_0KAO6P3igYBiv3k44PVyfM8ChLiqtVJUVAtPz4Ci7xHrk15s4r_2Ac3IcNL-8"/>
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                  <h3 className="text-white font-title-lg text-title-lg">Da Nang&apos;s Scene is Rising</h3>
                </div>
              </div>
            </div>
          </section>

          {/* Explore Your City */}
          <section>
            <h2 className="font-title-lg text-title-lg font-bold mb-element_gap">{t('home.explore_seoul')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <a href="/venues" className="group bg-surface-container-lowest border border-outline/10 p-6 rounded-xl flex items-center gap-6 hover:bg-primary/5 transition-colors cursor-pointer no-underline text-inherit">
                <div className="bg-primary-container/10 p-4 rounded-full text-primary">
                  <span className="material-symbols-outlined text-[32px]">apartment</span>
                </div>
                <div>
                  <h3 className="font-title-lg text-title-lg mb-1">{t('home.find_venues')}</h3>
                  <p className="font-body-md text-on-surface-variant">{t('home.find_venues_desc')}</p>
                </div>
              </a>
              <a href="/stay" className="group bg-surface-container-lowest border border-outline/10 p-6 rounded-xl flex items-center gap-6 hover:bg-primary/5 transition-colors cursor-pointer no-underline text-inherit">
                <div className="bg-primary-container/10 p-4 rounded-full text-primary">
                  <span className="material-symbols-outlined text-[32px]">hotel</span>
                </div>
                <div>
                  <h3 className="font-title-lg text-title-lg mb-1">{t('home.stay_nearby')}</h3>
                  <p className="font-body-md text-on-surface-variant">{t('home.stay_nearby_desc')}</p>
                </div>
              </a>
              <a href="/class" className="group bg-surface-container-lowest border border-outline/10 p-6 rounded-xl flex items-center gap-6 hover:bg-primary/5 transition-colors cursor-pointer no-underline text-inherit">
                <div className="bg-primary-container/10 p-4 rounded-full text-primary">
                  <span className="material-symbols-outlined text-[32px]">school</span>
                </div>
                <div>
                  <h3 className="font-title-lg text-title-lg mb-1">{t('home.join_class')}</h3>
                  <p className="font-body-md text-on-surface-variant">{t('home.join_class_desc')}</p>
                </div>
              </a>
              <a href="/rental" className="group bg-surface-container-lowest border border-outline/10 p-6 rounded-xl flex items-center gap-6 hover:bg-primary/5 transition-colors cursor-pointer no-underline text-inherit">
                <div className="bg-primary-container/10 p-4 rounded-full text-primary">
                  <span className="material-symbols-outlined text-[32px]">camera_roll</span>
                </div>
                <div>
                  <h3 className="font-title-lg text-title-lg mb-1">{t('home.rent_studio')}</h3>
                  <p className="font-body-md text-on-surface-variant">{t('home.rent_studio_desc')}</p>
                </div>
              </a>
            </div>
          </section>

          {/* Culture & Canvas */}
          <section>
            <h2 className="font-headline-md text-headline-md font-bold mb-element_gap">{t('home.culture_canvas')}</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
              {/* Card 1: Gavi’s Tango Cartoons */}
              <div className="relative h-[450px] rounded-xl overflow-hidden group cursor-pointer border border-outline/5 shadow-sm" onClick={() => setIsCartoonsOpen(true)}>
                <span className="absolute top-4 left-4 z-10 bg-black/40 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded tracking-widest">ART</span>
                <img alt="Gavi’s Tango Cartoons" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" src="/gavi.jpg"/>
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-6">
                  <span className="material-symbols-outlined text-white mb-2">draw</span>
                  <h3 className="text-white font-title-lg text-title-lg mb-1">{t('home.gavi_cartoons')}</h3>
                  <p className="text-white/80 font-body-md text-sm mb-3">{t('home.gavi_cartoons_desc')}</p>
                  <span className="text-[#0A84FF] text-[11px] font-bold tracking-wider">NEW EPISODE</span>
                </div>
              </div>
              
              {/* Card 2: Tango Music 365 */}
              <div className="relative h-[450px] rounded-xl overflow-hidden group cursor-pointer border border-outline/5 shadow-sm" onClick={() => setComingSoonCard({ title: t('home.tango_music'), icon: 'music_note', desc: t('home.tango_music_desc') })}>
                <span className="absolute top-4 left-4 z-10 bg-white/20 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded tracking-widest">MUSIC</span>
                <img alt="Tango Music 365" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" src="/camus.jpg"/>
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-6">
                  <span className="material-symbols-outlined text-white mb-2">music_note</span>
                  <h3 className="text-white font-title-lg text-title-lg mb-1">{t('home.tango_music')}</h3>
                  <p className="text-white/80 font-body-md text-sm mb-3">{t('home.tango_music_desc')}</p>
                  <span className="text-[#F5A623] text-[11px] font-bold tracking-wider">ONGOING</span>
                </div>
              </div>

              {/* Card 3: The History of Tango */}
              <div className="relative h-[450px] rounded-xl overflow-hidden group cursor-pointer border border-outline/5 shadow-sm" onClick={() => setComingSoonCard({ title: t('home.tango_history'), icon: 'history_edu', desc: t('home.tango_history_desc') })}>
                <span className="absolute top-4 left-4 z-10 bg-white/20 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded tracking-widest">HISTORY</span>
                <img alt="The History of Tango" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" src="/ddakji.jpg"/>
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-6">
                  <span className="material-symbols-outlined text-white mb-2">history_edu</span>
                  <h3 className="text-white font-title-lg text-title-lg mb-1">{t('home.tango_history')}</h3>
                  <p className="text-white/80 font-body-md text-sm mb-3">{t('home.tango_history_desc')}</p>
                  <span className="text-outline-variant text-[11px] font-bold tracking-wider">SERIES</span>
                </div>
              </div>

              {/* Card 4: Tango Novel */}
              <div className="relative h-[450px] rounded-xl overflow-hidden group cursor-pointer border border-outline/5 shadow-sm" onClick={() => setComingSoonCard({ title: t('home.tango_novel'), icon: 'auto_stories', desc: t('home.tango_novel_desc') })}>
                <span className="absolute top-4 left-4 z-10 bg-white/20 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded tracking-widest">STORY</span>
                <img alt="Tango Novel" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" src="/aaa.jpg"/>
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-6">
                  <span className="material-symbols-outlined text-white mb-2">auto_stories</span>
                  <h3 className="text-white font-title-lg text-title-lg mb-1">{t('home.tango_novel')}</h3>
                  <p className="text-white/80 font-body-md text-sm mb-3">{t('home.tango_novel_desc')}</p>
                  <span className="text-outline-variant/60 text-[11px] font-bold tracking-wider">{t('common.coming_soon')}</span>
                </div>
              </div>

              {/* Card 5: Tango Travel by Beto */}
              <div className="relative h-[450px] rounded-xl overflow-hidden group cursor-pointer border border-outline/5 shadow-sm" onClick={() => setComingSoonCard({ title: t('home.tango_travel'), icon: 'explore', desc: t('home.tango_travel_desc') })}>
                <span className="absolute top-4 left-4 z-10 bg-white/20 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded tracking-widest">TRAVEL</span>
                <img alt="Tango Travel" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" src="/beto.jpg"/>
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-6">
                  <span className="material-symbols-outlined text-white mb-2">explore</span>
                  <h3 className="text-white font-title-lg text-title-lg mb-1">{t('home.tango_travel')}</h3>
                  <p className="text-white/80 font-body-md text-sm mb-3">{t('home.tango_travel_desc')}</p>
                  <span className="text-[#0A84FF] text-[11px] font-bold tracking-wider">{t('common.new')}</span>
                </div>
              </div>

              {/* Card 6: FOCUS (Safe Floor) */}
              <div className="relative h-[450px] rounded-xl overflow-hidden group cursor-pointer border border-outline/5 shadow-sm" onClick={() => setIsSafeFloorOpen(true)}>
                <span className="absolute top-4 left-4 z-10 bg-red-500/80 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded tracking-widest">{t('common.focus')}</span>
                <img alt="Safe Floor" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" src="https://images.unsplash.com/photo-1518609878373-06d740f60d8b?q=80&w=800"/>
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-6">
                  <span className="material-symbols-outlined text-white mb-2">verified_user</span>
                  <h3 className="text-white font-title-lg text-title-lg mb-1">{societyInfo.blog_title}</h3>
                  <p className="text-white/80 font-body-md text-sm mb-3">{societyInfo.blog_description?.substring(0, 100)}...</p>
                  <span className="text-red-400 text-[11px] font-bold tracking-wider">{societyInfo.blog_core_keyword || t('common.important')}</span>
                </div>
              </div>
            </div>
          </section>

          {/* People — Dynamic from Firestore */}
          <section>
            <div className="flex items-center justify-between mb-element_gap">
              <h2 className="font-headline-md text-headline-md font-bold">{t('home.people_to_know')}</h2>
              <a className="text-primary font-label-md text-label-md" href="/people">{t('home.view_all')}</a>
            </div>
            <div className="flex gap-8 overflow-x-auto hide-scrollbar -mx-page_margin px-page_margin md:mx-0 md:px-0">
              {featuredUsers.map((user) => (
                <div key={user.id} onClick={() => setSelectedUserId(user.id)} className="flex-shrink-0 text-center w-32 group cursor-pointer no-underline text-inherit">
                  <div className="w-32 h-32 rounded-full overflow-hidden mb-3 ring-2 ring-transparent group-hover:ring-primary transition-all p-1">
                    <img alt={user.nickname} className="w-full h-full object-cover rounded-full" src={user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.nickname)}&background=6750a4&color=fff&size=128`}/>
                  </div>
                  <h4 className="font-title-lg text-title-lg text-body-md">{user.nickname}</h4>
                  <p className="text-outline font-label-sm text-label-sm">{user.isInstructor ? t('common.instructor') : t('common.member')}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Visual: Feel the Moment */}
          <section className="cursor-pointer" onClick={() => setIsFeelMomentOpen(true)}>
            <h2 className="font-headline-md text-headline-md font-bold mb-element_gap text-center">{t('home.feel_moment')}</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <div className="aspect-square bg-surface-variant overflow-hidden group relative">
                <img alt="Visual Grid" className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBhv85_bi1_roZXlBAsRh1L14F4hdUb8UpZ-BvqkZNtkLxQE3G_kEN4o9p57jU7pnLlk2qgAE0x-nVZEwLRCEsVch4Wj_jhfokfYd0aMTIbfdYT-4RLNf5fgjWW7eopiB5lIRQ3-d1RUEUYIUykxxmGJAK9htO4h7Mp4A6G9XhCB2DuxkzX8f3YUgf_biRCpDgU2NAiSmP3GVTCeLc7oiK0tqDgLCV0s3-7Ti1bhDrlOcMC6FaGauUK6MWOZ7ZEy4mGnyg2VRy6EXk"/>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none"><span className="material-symbols-outlined text-white/80 text-4xl">play_circle</span></div>
              </div>
              <div className="aspect-square bg-surface-variant overflow-hidden group">
                <img alt="Visual Grid" className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBcNE3yA37F_q_6jBOxJT7QFDk_ROnYVnIPgzCFzNSx3TNs3xVNqSvM8v2X0wGRjHJKotJI841xEuyqyDeQKuVm4LY1_DyFpX9LqRQiTNfhwwnx3w_FWnF6esGCjp1waZyZpvYtL0QxY2V8PJFa2fWQ89RkTaqgMif5jQ-f82rMqy4uJhXYL5KPJ61qLOnuCaTEL46sXxYBs02sWZl3PSsI2rusuj83UbWB7Vvunp4thZ-bOQnYJ6TEiBIv6cPGO27Xc2AhKdFX8R4"/>
              </div>
              <div className="aspect-square bg-surface-variant overflow-hidden group">
                <img alt="Visual Grid" className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDqJA4SuFwvyrf80X6-HIXKc53jUbP7A7UZRZdXTFakrKiZiJNyTgc1quNvNqQn0ZhjyXpj54uotHnj8GxIppVP1treg8PdSR5W9nGDQszDJVPICSxkC8cQen-hgJ2yeahyur8V2Ii_OyYcxW988czIJkwfXF6DL8qD2uZCxGSNKP54Q72xNRix625XCcz-s5b_WVKVHfrupAI_Qnw1byLIRm6QCrYPJcK0ub6YFtSi5LLvgl4ah-qxdCsnEhTI-4BVh17mlL8-SvE"/>
              </div>
              <div className="aspect-square bg-surface-variant overflow-hidden group">
                <img alt="Visual Grid" className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBu27sywOcBpK7ExBjlt2VFm2rDBOQoFUE07A6nryePDvFc87t2vQOqFAN0-GNjwY4X4wLox9ehj8rCgCjvql3cHxMrciKSdXYjpcUwUGWqsf5F2qB8Fj0fszFMj94ifHyco-SqNcYmxEdcloTdQq_cUpXSIu7EFYk9QzLul8QsZwL3jpDqeWZae7N5q2thamfydyQaKQrOn5srI0539LlF4mJ6NBmCCiie_AuH_Y57-goRmQzubPuyIiF7u2ch4ceAEPYSA18yCvc"/>
              </div>
            </div>
          </section>
        </main>

        {/* Footer — 번역 미대상 영역 */}
        <footer className="bg-background border-t border-outline/15 py-section_gap">
          <div className="max-w-7xl mx-auto px-page_margin flex flex-col md:flex-row justify-between items-center gap-element_gap">
            <div className="font-headline-md text-headline-md font-extrabold text-on-background">{t('home.global_tango_society')}</div>
            <nav className="flex flex-wrap justify-center gap-6">
              <a className="text-on-surface-variant hover:text-primary transition-colors font-label-md text-label-md" href="#">{t('common.about')}</a>
              <a className="text-on-surface-variant hover:text-primary transition-colors font-label-md text-label-md" href="#">{t('common.terms')}</a>
              <a className="text-on-surface-variant hover:text-primary transition-colors font-label-md text-label-md" href="#">{t('common.privacy')}</a>
            </nav>
            <div className="text-on-surface-variant font-label-sm text-label-sm">{t('common.footer_rights')}</div>
          </div>
        </footer>
      </div>

      {/* Gavi's Tango Cartoons Full Popup */}
      {isCartoonsOpen && (
        <GaviCartoonPopup onClose={() => setIsCartoonsOpen(false)} />
      )}

      {/* Event Detail Full-Screen Popup */}
      {isEventDetailOpen && heroEvent && (
        <EventViewer event={heroEvent} onClose={() => setIsEventDetailOpen(false)} />
      )}

      {/* Across the World Full-Screen Popup */}
      {isAcrossWorldOpen && (
        <div className="fixed inset-0 z-[9999] bg-black/95 flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <h2 className="text-white font-headline-md text-headline-md">{t('home.across_world')}</h2>
            <button onClick={() => setIsAcrossWorldOpen(false)} className="text-white/70 hover:text-white">
              <span className="material-symbols-outlined text-[28px]">close</span>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-3xl mx-auto text-center">
              <span className="material-symbols-outlined text-[64px] text-white/30 mb-4">live_tv</span>
              <h3 className="text-white font-title-lg text-title-lg mb-3">{t('home.live_streams_title')}</h3>
              <p className="text-white/70 font-body-md text-body-md mb-6">{t('home.live_streams_desc')}</p>
              <p className="text-white/50 font-label-md text-label-md">{t('home.live_streams_soon')}</p>
            </div>
          </div>
        </div>
      )}

      {/* Feel the Moment Full-Screen Popup */}
      {isFeelMomentOpen && (
        <div className="fixed inset-0 z-[9999] bg-black/95 flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <h2 className="text-white font-headline-md text-headline-md">{t('home.feel_moment')}</h2>
            <button onClick={() => setIsFeelMomentOpen(false)} className="text-white/70 hover:text-white">
              <span className="material-symbols-outlined text-[28px]">close</span>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-3xl mx-auto text-center">
              <span className="material-symbols-outlined text-[64px] text-white/30 mb-4">photo_camera</span>
              <h3 className="text-white font-title-lg text-title-lg mb-3">{t('home.photo_video_awards')}</h3>
              <p className="text-white/70 font-body-md text-body-md mb-6">{t('home.photo_video_desc')}</p>
              <p className="text-white/50 font-label-md text-label-md">{t('home.nominations_open')}</p>
            </div>
          </div>
        </div>
      )}

      {/* User Profile Popup */}
      <UserProfilePopup
        isOpen={!!selectedUserId}
        onClose={() => setSelectedUserId(null)}
        uid={selectedUserId || ''}
      />

      {/* Safe Floor Policy Full-Screen Popup */}
      {isSafeFloorOpen && (
        <div className="fixed inset-0 z-[10000] bg-white flex flex-col animate-in fade-in duration-500 overflow-y-auto">
          {/* High-Impact Hero Section */}
          <div className="relative w-full h-[50vh] flex-shrink-0">
            <img 
              src="https://images.unsplash.com/photo-1518609878373-06d740f60d8b?q=80&w=1200" 
              alt="Safe Floor" 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-black/30"></div>
            
            {/* Close Button */}
            <div className="absolute top-0 left-0 w-full p-6 flex justify-end">
              <button 
                onClick={() => setIsSafeFloorOpen(false)}
                className="w-12 h-12 flex items-center justify-center rounded-full bg-black/20 backdrop-blur-md text-white hover:bg-black/40 transition-all shadow-lg"
              >
                <span className="material-symbols-outlined text-[28px]">close</span>
              </button>
            </div>

            <div className="absolute bottom-0 left-0 w-full p-8 md:p-16">
              <div className="max-w-4xl mx-auto w-full">
                <span className="px-4 py-1.5 bg-red-600 text-white text-[12px] font-bold uppercase tracking-widest rounded-lg mb-6 inline-block shadow-xl animate-in slide-in-from-left duration-700">{t('home.policy.zero_tolerance')}</span>
                <h2 className="text-4xl md:text-7xl font-extrabold text-slate-900 font-headline leading-tight animate-in slide-in-from-bottom duration-700 delay-100">
                  {t('home.policy.headline')}
                </h2>
              </div>
            </div>
          </div>
          
          {/* Policy Content */}
          <div className="flex-1 bg-white pb-24">
            <div className="max-w-4xl mx-auto px-8 md:px-16 py-12 space-y-12">
              <div className="prose prose-slate prose-xl max-w-none">
                <p className="text-2xl md:text-3xl font-medium text-slate-800 leading-relaxed font-headline italic border-l-8 border-primary pl-8 py-4 bg-slate-50 rounded-r-3xl animate-in fade-in duration-1000 delay-300">
                  {t('home.policy.intro')}
                </p>
                
                <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                  <div className="relative group overflow-hidden rounded-[40px] shadow-2xl animate-in zoom-in duration-1000 delay-400">
                    <img 
                      src="https://images.unsplash.com/photo-1542332213-31f87348057f?q=80&w=800" 
                      alt="Tango dancers" 
                      className="w-full h-80 object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 ring-1 ring-inset ring-black/10 rounded-[40px]"></div>
                  </div>
                  <div className="flex flex-col justify-center animate-in slide-in-from-right duration-700 delay-500">
                    <h3 className="text-3xl font-black text-slate-900 mb-6 font-headline tracking-tight">{t('home.policy.section1.title')}</h3>
                    <p className="text-slate-600 text-lg leading-relaxed">
                      {t('home.policy.section1.desc')}
                    </p>
                  </div>
                </div>

                <div className="pt-16 border-t border-slate-100 space-y-12">
                  <h3 className="text-3xl md:text-4xl font-black text-slate-900 font-headline flex items-center gap-4 animate-in fade-in duration-700 delay-600">
                    <span className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20">
                      <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>verified_user</span>
                    </span>
                    {t('home.policy.promise.title')}
                  </h3>
                  
                  <div className="grid grid-cols-1 gap-6">
                    {[
                      { id: 1, title: t('home.policy.point1.title'), desc: t('home.policy.point1.desc'), color: 'red' },
                      { id: 2, title: t('home.policy.point2.title'), desc: t('home.policy.point2.desc'), color: 'blue' },
                      { id: 3, title: t('home.policy.point3.title'), desc: t('home.policy.point3.desc'), color: 'green' }
                    ].map((point, idx) => (
                      <div 
                        key={point.id} 
                        className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 animate-in fade-in slide-in-from-bottom duration-700"
                        style={{ animationDelay: `${700 + (idx * 100)}ms` }}
                      >
                        <div className="flex items-start gap-6">
                          <span className={`flex-shrink-0 w-14 h-14 rounded-2xl bg-${point.color}-50 text-${point.color}-600 flex items-center justify-center text-xl font-black border border-${point.color}-100 shadow-inner`}>
                            {point.id}
                          </span>
                          <div>
                            <h4 className="font-black text-slate-900 text-xl mb-3 font-headline">{point.title}</h4>
                            <p className="text-slate-600 text-lg leading-relaxed">{point.desc}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-20 p-12 md:p-20 bg-slate-900 text-white rounded-[60px] text-center relative overflow-hidden shadow-2xl animate-in zoom-in duration-1000 delay-1000">
                  <div className="absolute inset-0 opacity-40 bg-[url('https://images.unsplash.com/photo-1508807526345-15e9b5f4eaff?q=80&w=1200')] bg-cover bg-center"></div>
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/90 to-transparent"></div>
                  <div className="relative z-10 max-w-2xl mx-auto">
                    <h3 className="text-3xl md:text-5xl font-black font-headline mb-8 leading-tight">{t('home.policy.footer.title')}</h3>
                    <p className="text-white/80 text-xl leading-relaxed mb-10">
                      {t('home.policy.footer.desc')}
                    </p>
                    <button 
                      onClick={() => setIsSafeFloorOpen(false)}
                      className="px-12 py-5 bg-white text-slate-900 text-lg font-black rounded-2xl hover:bg-slate-100 hover:scale-105 active:scale-95 transition-all shadow-xl"
                    >
                      {t('home.policy.acknowledge')}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Coming Soon Fullscreen */}
      {comingSoonCard && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center animate-in fade-in duration-300">
          <button 
            onClick={() => setComingSoonCard(null)}
            className="absolute top-6 right-6 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all z-10"
          >
            <span className="material-symbols-outlined text-[24px]">close</span>
          </button>

          <div className="flex flex-col items-center text-center px-8 max-w-md animate-in zoom-in-95 duration-500">
            <div className="w-24 h-24 rounded-[28px] bg-white/10 backdrop-blur-xl flex items-center justify-center mb-8 ring-1 ring-white/10">
              <span className="material-symbols-outlined text-white/80 text-[48px]">{comingSoonCard.icon}</span>
            </div>
            <h2 className="text-3xl font-black text-white mb-3 font-headline tracking-tight">{comingSoonCard.title}</h2>
            <p className="text-white/60 text-base leading-relaxed mb-10">{comingSoonCard.desc}</p>
            
            <div className="flex items-center gap-3 mb-12">
              <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></div>
              <span className="text-amber-400 text-sm font-bold uppercase tracking-[0.2em]">{t('common.coming_soon')}</span>
            </div>

            <p className="text-white/40 text-sm leading-relaxed max-w-xs">
              {t('home.coming_soon_desc')}
            </p>

            <button 
              onClick={() => setComingSoonCard(null)}
              className="mt-10 px-10 py-4 bg-white/10 hover:bg-white/20 text-white font-bold rounded-2xl transition-all active:scale-95 ring-1 ring-white/10"
            >
              {t('common.got_it')}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
