"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { Event } from '@/types/event';
import { eventService } from '@/lib/firebase/eventService';
import { userService } from '@/lib/firebase/userService';
import { PlatformUser } from '@/types/user';
import { useAuth } from '@/components/providers/AuthProvider';
import { useSearchParams } from 'next/navigation';
import societiesData from '../../../woc_societies_data.json';
import { safeDate } from '@/lib/utils/safeDate';
import ActivitySpotlight from '@/components/home/ActivitySpotlight';
import UserProfileModal from '@/components/profile/UserProfileModal';
import GaviCartoonPopup from '@/components/home/GaviCartoonPopup';
import Music365Popup from '@/components/home/Music365Popup';
import TangoHistoryPopup from '@/components/home/TangoHistoryPopup';
import { collection, query, where, orderBy, limit, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/clientApp';
import { GalleryPost } from '@/lib/firebase/galleryService';
import { Social } from '@/types/social';
import { useLanguage } from '@/contexts/LanguageContext';

export default function HomePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div></div>}>
      <HomeContent />
    </Suspense>
  );
}

function HomeContent() {
  const { language, t } = useLanguage();
  const { user, profile } = useAuth();
  const searchParams = useSearchParams();
  const societyId = searchParams.get('society') || 'tango';
  const societyInfo = societiesData.find((s: any) => s.id === societyId) || societiesData[0];
  const [isSafeFloorOpen, setIsSafeFloorOpen] = useState(false);
  const [isRegionalReportsOpen, setIsRegionalReportsOpen] = useState(false);
  const [isRegistrationOpen, setIsRegistrationOpen] = useState(false);
  const [isCartoonsOpen, setIsCartoonsOpen] = useState(false);
  const [isMusic365Open, setIsMusic365Open] = useState(false);
  const [isTangoHistoryOpen, setIsTangoHistoryOpen] = useState(false);
  const [photogenicPost, setPhotogenicPost] = useState<GalleryPost | null>(null);
  const [videogenicPost, setVideogenicPost] = useState<GalleryPost | null>(null);
  const [djSchedule, setDjSchedule] = useState<{day: number; djName: string; venueName: string; socialId: string}[]>([]);
  const [peopleData, setPeopleData] = useState<{organizers: any[]; instructors: any[]; providers: any[]}>({organizers:[], instructors:[], providers:[]});
  const [peopleTab, setPeopleTab] = useState<'organizers'|'instructors'|'providers'>('organizers');
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [upcomingEvent, setUpcomingEvent] = useState<Event | null>(null);

  const [loadingEvent, setLoadingEvent] = useState(true);
  const [topMembers, setTopMembers] = useState<PlatformUser[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const events = await eventService.getUpcomingEvents(1);
        if (events.length > 0) {
          setUpcomingEvent(events[0]);
        }
      } catch (error) {
        console.error("Failed to fetch upcoming event:", error);
      } finally {
        setLoadingEvent(false);
      }
    };
    const fetchMembers = async () => {
      try {
        const members = await userService.getTopMembers(3);
        setTopMembers(members);
      } catch (error) {
        console.error("Failed to fetch top members:", error);
      } finally {
        setLoadingMembers(false);
      }
    };
    const fetchPhotogenic = async () => {
      try {
        const dayAgo = Timestamp.fromMillis(Date.now() - 24 * 60 * 60 * 1000);
        const q = query(collection(db, 'galleries'), where('createdAt', '>=', dayAgo), orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        const photos = snap.docs.map(d => ({ id: d.id, ...d.data() } as GalleryPost)).filter(p => !p.mediaTypes || p.mediaTypes[0] !== 'video');
        if (photos.length > 0) {
          photos.sort((a, b) => (b.likesCount || 0) - (a.likesCount || 0));
          setPhotogenicPost(photos[0]);
        }
      } catch (e) { console.error('[Photogenic]', e); }
    };
    const fetchVideogenic = async () => {
      try {
        const monthAgo = Timestamp.fromMillis(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const q = query(collection(db, 'galleries'), where('createdAt', '>=', monthAgo), orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        const videos = snap.docs.map(d => ({ id: d.id, ...d.data() } as GalleryPost)).filter(p => p.mediaTypes && p.mediaTypes.includes('video'));
        if (videos.length > 0) {
          videos.sort((a, b) => (b.likesCount || 0) - (a.likesCount || 0));
          setVideogenicPost(videos[0]);
        }
      } catch (e) { console.error('[Videogenic]', e); }
    };
    const fetchDjSchedule = async () => {
      try {
        const snap = await getDocs(collection(db, 'socials'));
        const allSocials = snap.docs.map(d => ({ id: d.id, ...d.data() } as Social));
        const schedule: {day: number; djName: string; venueName: string; socialId: string}[] = [];
        allSocials.forEach(s => {
          const djName = s.djName || (s.djs && s.djs.length > 0 ? s.djs[0].djName : '');
          if (!djName) return;
          if (s.type === 'regular' && s.dayOfWeek !== undefined) {
            schedule.push({ day: s.dayOfWeek, djName, venueName: s.venueName || '', socialId: s.id });
          }
        });
        schedule.sort((a, b) => a.day - b.day);
        setDjSchedule(schedule);
      } catch (e) { console.error('[DjSchedule]', e); }
    };
    const fetchPeople = async () => {
      try {
        const socialSnap = await getDocs(collection(db, 'socials'));
        const orgMap = new Map<string, any>();
        socialSnap.docs.forEach(d => {
          const s = d.data();
          if (s.organizerId && !orgMap.has(s.organizerId)) {
            orgMap.set(s.organizerId, { id: s.organizerId, name: s.organizerName || 'Organizer', role: 'Organizer' });
          }
        });
        const groupSnap = await getDocs(collection(db, 'groups'));
        const instrMap = new Map<string, any>();
        groupSnap.docs.forEach(d => {
          const g = d.data();
          if (g.classes) {
            (g.classes as any[]).forEach(cls => {
              if (cls.instructors) {
                (cls.instructors as any[]).forEach(inst => {
                  const key = inst.userId || inst.name;
                  if (key && !instrMap.has(key)) {
                    instrMap.set(key, { id: inst.userId || key, name: inst.name, avatar: inst.avatar, role: 'Instructor' });
                  }
                });
              }
            });
          }
        });
        const providerMap = new Map<string, any>();
        groupSnap.docs.forEach(d => {
          const g = d.data();
          if (g.activeServices && (g.activeServices.shop || g.activeServices.stay || g.activeServices.rental)) {
            if (g.ownerId && !providerMap.has(g.ownerId)) {
              providerMap.set(g.ownerId, { id: g.ownerId, name: g.name || 'Provider', role: 'Service Provider' });
            }
          }
        });
        setPeopleData({
          organizers: Array.from(orgMap.values()),
          instructors: Array.from(instrMap.values()),
          providers: Array.from(providerMap.values()),
        });
      } catch (e) { console.error('[People]', e); }
    };
    fetchEvent();
    fetchMembers();
    fetchPhotogenic();
    fetchVideogenic();
    fetchDjSchedule();
    fetchPeople();
  }, []);

  const handleLeaderboardClick = () => {
    setToastMessage("The society is not yet active enough to show the leaderboard.");
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const displayName = profile?.nickname || user?.displayName || t('home.welcome_guest');

  return (
    <>
      {selectedProfileId && (
        <UserProfileModal
          userId={selectedProfileId}
          onClose={() => setSelectedProfileId(null)}
        />
      )}
      <main className="py-6 px-4 max-w-7xl mx-auto space-y-10 pb-24">
        {/* Welcome Section - simplified */}
        <section className="px-2 flex flex-col gap-3">
          <h1 className="text-xl sm:text-2xl text-on-surface font-medium leading-tight">
            <span className="font-bold">{displayName},</span> {societyInfo.welcome_message.replace(/^Hi Stony,\s*/, '')}
          </h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-primary">
              <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
              <span className="font-title-md text-[0.9375rem]">{societyInfo.keyword_badges[0]}</span>
            </div>
            <div className="flex items-center gap-2 text-primary">
              <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>public</span>
              <span className="font-title-md text-[0.9375rem]">{societyInfo.keyword_badges[1]}</span>
            </div>
          </div>
        </section>

        <ActivitySpotlight />

        {/* Culture & Canvas Section — 4-card grid */}
        <section className="space-y-4">
          <header className="flex items-center justify-between px-2 md:px-0">
            <h2 className="text-xl md:text-2xl font-extrabold text-slate-900 font-headline">Culture &amp; Canvas</h2>
          </header>
          <div className="grid grid-cols-2 gap-4">
            {/* Gavi's Cartoons */}
            <div className="relative">
              <div className="absolute -top-8 left-6 z-20 flex flex-col items-center animate-bounce drop-shadow-sm">
                <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full tracking-wider">{t('home.hot')}</span>
                <div className="w-0 h-0 border-l-[4px] border-r-[4px] border-t-[5px] border-l-transparent border-r-transparent border-t-red-500"></div>
              </div>
              <div className="group relative overflow-hidden bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer active:scale-95 h-full" onClick={() => setIsCartoonsOpen(true)}>
                <div className="flex flex-col gap-2 relative z-10">
                  <div className="flex items-center justify-between">
                    <div className="p-3 rounded-xl bg-primary-container/10 text-primary-container">
                      <span className="material-symbols-outlined text-[24px]">palette</span>
                    </div>
                    <span className="material-symbols-outlined text-outline-variant group-hover:text-primary-container transition-colors">arrow_outward</span>
                  </div>
                  <div className="mt-2">
                    <h3 className="font-title-md text-title-md text-on-surface">{t('home.cartoon.title')}</h3>
                    <p className="text-[10px] text-slate-400 font-medium mt-0.5">{t('home.cartoon.author')}</p>
                  </div>
                </div>
                <span className="material-symbols-outlined absolute -bottom-4 -right-4 text-8xl opacity-[0.03] text-primary-container pointer-events-none">palette</span>
              </div>
            </div>

            {/* Music 365 */}
            <div className="group relative overflow-hidden bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer active:scale-95" onClick={() => setIsMusic365Open(true)}>
              <div className="flex flex-col gap-2 relative z-10">
                <div className="flex items-center justify-between">
                  <div className="p-3 rounded-xl bg-amber-100/50 text-amber-700">
                    <span className="material-symbols-outlined text-[24px]">music_note</span>
                  </div>
                  <span className="material-symbols-outlined text-outline-variant group-hover:text-amber-600 transition-colors">arrow_outward</span>
                </div>
                <div className="mt-2">
                  <h3 className="font-title-md text-title-md text-on-surface">{t('home.music_365')}</h3>
                  <p className="text-[10px] text-slate-400 font-medium mt-0.5">{t('home.music.author')}</p>
                </div>
              </div>
              <span className="material-symbols-outlined absolute -bottom-4 -right-4 text-8xl opacity-[0.03] text-amber-600 pointer-events-none">music_note</span>
            </div>

            {/* History of Tango */}
            <div className="group relative overflow-hidden bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer active:scale-95" onClick={() => setIsTangoHistoryOpen(true)}>
              <div className="flex flex-col gap-2 relative z-10">
                <div className="flex items-center justify-between">
                  <div className="p-3 rounded-xl bg-indigo-100/50 text-indigo-700">
                    <span className="material-symbols-outlined text-[24px]">history_edu</span>
                  </div>
                  <span className="material-symbols-outlined text-outline-variant group-hover:text-indigo-600 transition-colors">arrow_outward</span>
                </div>
                <div className="mt-2">
                  <h3 className="font-title-md text-title-md text-on-surface">{t('home.tango_history')}</h3>
                  <p className="text-[10px] text-slate-400 font-medium mt-0.5">{t('home.history.author')}</p>
                </div>
              </div>
              <span className="material-symbols-outlined absolute -bottom-4 -right-4 text-8xl opacity-[0.03] text-indigo-600 pointer-events-none">history_edu</span>
            </div>

            {/* Tango Novel */}
            <div className="group relative overflow-hidden bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer active:scale-95">
              <div className="flex flex-col gap-2 relative z-10">
                <div className="flex items-center justify-between">
                  <div className="p-3 rounded-xl bg-primary-container/10 text-primary-container">
                    <span className="material-symbols-outlined text-[24px]">book</span>
                  </div>
                  <span className="material-symbols-outlined text-outline-variant group-hover:text-primary-container transition-colors">arrow_outward</span>
                </div>
                <div className="mt-2">
                  <h3 className="font-title-md text-title-md text-on-surface">{t('home.tango_novel')}</h3>
                  <p className="text-[10px] text-slate-400 font-medium mt-0.5">{t('home.coming_soon')}</p>
                </div>
              </div>
              <span className="material-symbols-outlined absolute -bottom-4 -right-4 text-8xl opacity-[0.03] text-primary-container pointer-events-none">book</span>
            </div>
          </div>
        </section>

        {/* Featured Highlight & Sidebars */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div 
            className="lg:col-span-2 relative aspect-square sm:aspect-video rounded-[32px] md:rounded-[40px] overflow-hidden shadow-xl group cursor-pointer"
            onClick={() => setIsSafeFloorOpen(true)}
          >
            <img 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
              src="https://images.unsplash.com/photo-1518609878373-06d740f60d8b?q=80&w=1200" 
              alt="Safe Floor Policy" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
            <div className="absolute bottom-6 left-6 right-6 md:bottom-8 md:left-8 md:right-8">
              <span className="px-3 py-1 bg-red-600 text-white text-[10px] font-bold uppercase tracking-widest rounded-full mb-3 inline-block">{societyInfo.blog_core_keyword}</span>
              <h3 className="text-xl md:text-3xl font-black text-white mb-2 leading-tight font-headline">
                {societyInfo.blog_title}<br/>
                <span className="text-base md:text-xl font-normal text-white/90">{societyInfo.blog_subtitle}</span>
              </h3>
              <p className="text-white/80 max-w-lg font-body text-xs md:text-sm mt-2 md:mt-3 line-clamp-2 sm:line-clamp-none">
                {societyInfo.blog_description}
              </p>
              <button className="mt-4 md:mt-5 px-5 py-2 md:px-6 md:py-3 bg-white text-slate-900 font-bold rounded-xl shadow-lg hover:bg-slate-100 transition-colors text-sm md:text-base">
                {t('home.read_full_story')}
              </button>
            </div>
          </div>

          {/* Sidebar Area: Tastemakers -> Global Stats */}
          <div className="space-y-6">
            {/* Tastemakers (위로 이동) */}
            <h2 className="text-xl md:text-2xl font-extrabold text-slate-900 font-headline px-2">Tastemakers</h2>
            <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-5 md:p-6">
              <div className="space-y-5 md:space-y-6">
                {loadingMembers ? (
                  <div className="space-y-4 animate-pulse">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="flex items-center gap-4">
                        <div className="w-10 md:w-12 h-10 md:h-12 rounded-full bg-slate-200"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                          <div className="h-3 bg-slate-200 rounded w-1/3"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : topMembers.map((member, i) => {
                  const visitCounts = [124, 86, 42];
                  return (
                    <div 
                      key={member.id || i} 
                      className="flex items-center gap-3 md:gap-4 cursor-pointer hover:bg-slate-50 p-2 -mx-2 rounded-xl transition-colors"
                      onClick={() => setSelectedProfileId(member.id)}
                    >
                      <div className="relative">
                      <img 
                        className="w-10 md:w-12 h-10 md:h-12 rounded-full object-cover border-2 border-primary/20 bg-slate-100" 
                        src={member.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.nickname || (member as any).displayName || 'User')}&background=0f172a&color=fff&font-size=0.33&bold=true`} 
                        alt={member.nickname || (member as any).displayName || 'Member'} 
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(member.nickname || (member as any).displayName || 'User')}&background=0f172a&color=fff&font-size=0.33&bold=true`;
                        }}
                      />
                      {i === 0 && (
                        <span className="absolute -bottom-1 -right-1 bg-yellow-400 text-white p-0.5 rounded-full border-2 border-white material-symbols-outlined text-[10px]" style={{ fontVariationSettings: "'FILL' 1" }}>stars</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <h5 className="font-bold text-sm text-slate-900 line-clamp-1">{member.nickname || (member as any).displayName || 'Anonymous'}</h5>
                      <p className="text-[9px] md:text-[10px] text-gray-400 font-bold uppercase tracking-widest line-clamp-1">
                        {(member as any).realName && <span className="text-slate-500 mr-1">{(member as any).realName} •</span>}
                        {((member as any).country) && <span className="text-primary mr-1">{(member as any).country} •</span>}
                        {member.role === 'leader' ? 'HOST' : 'CONTRIBUTOR'} • {visitCounts[i] || 10} {t('common.members').toUpperCase()}
                      </p>
                    </div>
                    <div className={`text-sm md:text-base font-black ${i === 0 ? 'text-primary' : 'text-slate-300'}`}>#{i + 1}</div>
                  </div>
                );
              })}
            </div>
            <button 
              onClick={handleLeaderboardClick}
              className="w-full mt-6 md:mt-8 py-2.5 md:py-3 text-primary text-sm font-bold bg-primary/5 rounded-xl hover:bg-primary/10 transition-colors"
            >
              {t('home.leaderboard_btn')}
            </button>
          </div>

          {/* Global Stats (Tastemakers 아래로 이동) */}
          <div className="bg-surface-container rounded-[32px] p-5 md:p-6 flex flex-col border border-gray-100">
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <div className="flex flex-col gap-3 md:gap-4 w-full">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg md:text-xl font-extrabold flex items-center gap-2 text-slate-900 font-headline">
                    <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>public</span>
                    {t('home.global_stats')}
                  </h3>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500 font-medium">{t('home.active_members')}</span>
                  <span className="font-bold text-slate-900">4,281</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500 font-medium">{t('home.total_stays')}</span>
                  <span className="font-bold text-slate-900">156</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500 font-medium">{t('home.monthly_growth')}</span>
                  <span className="font-bold text-primary text-xs">{t('home.new_members', { count: 482 })}</span>
                </div>
              </div>
            </div>
            
            <button 
              onClick={() => setIsRegionalReportsOpen(true)}
              className="w-full mt-2 md:mt-6 py-2.5 md:py-3 bg-primary/5 text-primary font-bold hover:bg-primary/10 transition-colors rounded-xl text-sm md:text-base"
            >
              {t('home.hotspots_btn', { name: societyInfo.id.charAt(0).toUpperCase() + societyInfo.id.slice(1).replace('-', ' ') })}
            </button>
          </div>
        </div>
      </section>


      {/* Members & Housing Section */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
        {/* Society Stays */}
        <div className="lg:col-span-3 space-y-4 md:space-y-6 px-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xl md:text-2xl font-extrabold text-slate-900 font-headline">Latest Society Stays</h2>
            <a className="text-primary font-bold text-sm hover:underline" href="/stay">{t('home.explore_stay')}</a>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="relative group rounded-[24px] md:rounded-[32px] overflow-hidden aspect-[4/3] shadow-md">
              <img 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                src="https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=800"
                alt="Stay 1"
              />
              <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-primary shadow-sm border border-white/20">$1,200/mo</div>
              <div className="absolute bottom-0 left-0 right-0 p-4 md:p-5 bg-gradient-to-t from-black/80 to-transparent text-white">
                <h5 className="font-bold text-base md:text-lg font-headline">The Glass House</h5>
                <p className="text-[10px] md:text-xs text-white/80 font-medium">{t('home.stay.suites_kitchen')}</p>
              </div>
            </div>
            
            <div className="relative group rounded-[24px] md:rounded-[32px] overflow-hidden aspect-[4/3] shadow-md">
              <img 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                src="https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=800"
                alt="Stay 2"
              />
              <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-primary shadow-sm border border-white/20">$850/mo</div>
              <div className="absolute bottom-0 left-0 right-0 p-4 md:p-5 bg-gradient-to-t from-black/80 to-transparent text-white">
                <h5 className="font-bold text-base md:text-lg font-headline">Industrial Loft #42</h5>
                <p className="text-[10px] md:text-xs text-white/80 font-medium">{t('home.stay.studio_balcony')}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Photogenic Last Night ── */}
      {photogenicPost && (
        <section className="relative overflow-hidden rounded-[32px] shadow-xl group cursor-pointer" onClick={() => window.location.href = '/gallery'}>
          <div className="aspect-[16/9] sm:aspect-[21/9]">
            <img src={photogenicPost.media?.[0] || ''} alt="Photogenic Last Night" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          <div className="absolute bottom-6 left-6 right-6">
            <span className="px-3 py-1 bg-white/20 text-white text-[10px] font-bold uppercase tracking-widest rounded-full mb-2 inline-block backdrop-blur-md border border-white/20">{t('home.photogenic_title')}</span>
            <h3 className="text-xl md:text-2xl font-black text-white font-headline leading-tight">{photogenicPost.caption || t('home.photogenic_default_caption')}</h3>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-white/70 text-xs flex items-center gap-1"><span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>{photogenicPost.likesCount || 0}</span>
              <span className="text-white/50 text-xs">{photogenicPost.authorName || 'Anonymous'}</span>
            </div>
          </div>
        </section>
      )}

      {/* ── People ── */}
      {(peopleData.organizers.length > 0 || peopleData.instructors.length > 0 || peopleData.providers.length > 0) && (
        <section className="flex flex-col gap-4">
          <header className="flex items-center justify-between px-2">
            <h2 className="text-xl md:text-2xl font-extrabold text-slate-900 font-headline">People</h2>
          </header>
          {/* Tabs */}
          <div className="flex gap-2 px-2">
            {(['organizers','instructors','providers'] as const).map(tab => (
              <button key={tab} onClick={() => setPeopleTab(tab)} className={`px-4 py-2 rounded-full text-xs font-bold transition-colors ${peopleTab === tab ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                {tab === 'organizers' ? t('home.organizers') : tab === 'instructors' ? t('home.instructors') : t('home.providers')}
              </button>
            ))}
          </div>
          <div className="flex gap-3 overflow-x-auto px-2 pb-2 snap-x snap-mandatory custom-scrollbar">
            {(peopleData[peopleTab] || []).slice(0, 10).map((person: any, i: number) => (
              <div key={person.id || i} className="min-w-[120px] flex flex-col items-center gap-2 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm snap-start cursor-pointer hover:shadow-md transition-shadow" onClick={() => person.id && setSelectedProfileId(person.id)}>
                <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden">
                  {person.avatar ? <img src={person.avatar} alt={person.name} className="w-full h-full object-cover" /> : <span className="material-symbols-outlined text-slate-300 text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>person</span>}
                </div>
                <span className="text-xs font-bold text-slate-900 text-center line-clamp-1">{person.name}</span>
                <span className="text-[10px] text-slate-400 font-medium">{person.role}</span>
              </div>
            ))}
            {(peopleData[peopleTab] || []).length === 0 && (
              <div className="w-full py-8 text-center text-slate-400 text-sm font-medium">{t('home.no_people_found', { role: peopleTab })}</div>
            )}
          </div>
        </section>
      )}

      {/* ── DJ Schedule ── */}
      {djSchedule.length > 0 && (
        <section className="flex flex-col gap-4">
          <header className="px-2"><h2 className="text-xl md:text-2xl font-extrabold text-slate-900 font-headline">DJ Schedule</h2></header>
          <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm overflow-hidden">
            <div className="grid grid-cols-7 text-center border-b border-slate-100">
              {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((d, i) => (
                <div key={d} className={`py-3 text-[10px] font-bold uppercase tracking-wider ${i === new Date().getDay() ? 'text-primary bg-primary/5' : 'text-slate-400'}`}>{t(`common.days.${d.toLowerCase()}`)}</div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {[0,1,2,3,4,5,6].map(day => {
                const djs = djSchedule.filter(s => s.day === day);
                return (
                  <div key={day} className={`min-h-[80px] p-1.5 border-r border-slate-50 last:border-r-0 ${day === new Date().getDay() ? 'bg-primary/5' : ''}`}>
                    {djs.map((dj, j) => (
                      <div key={j} className="bg-slate-900 text-white rounded-lg p-2 mb-1 text-[10px] leading-tight">
                        <span className="font-bold block truncate">{dj.djName}</span>
                        <span className="text-white/50 truncate block">{dj.venueName}</span>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── Videogenic This Month ── */}
      {videogenicPost && (
        <section className="relative overflow-hidden rounded-[32px] shadow-xl group cursor-pointer" onClick={() => window.location.href = '/gallery'}>
          <div className="aspect-video bg-slate-900 flex items-center justify-center">
            {videogenicPost.media?.[0] ? (
              <video src={videogenicPost.media[0]} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" muted autoPlay loop playsInline />
            ) : (
              <span className="material-symbols-outlined text-6xl text-white/20">videocam</span>
            )}
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
          <div className="absolute bottom-6 left-6 right-6">
            <span className="px-3 py-1 bg-white/20 text-white text-[10px] font-bold uppercase tracking-widest rounded-full mb-2 inline-block backdrop-blur-md border border-white/20">{t('home.videogenic_title')}</span>
            <h3 className="text-xl md:text-2xl font-black text-white font-headline">{videogenicPost.caption || t('home.videogenic_default_caption')}</h3>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-white/70 text-xs flex items-center gap-1"><span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>{videogenicPost.likesCount || 0}</span>
              <span className="text-white/50 text-xs">{videogenicPost.authorName || 'Anonymous'}</span>
            </div>
          </div>
        </section>
      )}

      {/* ── Neighbors ── */}
      <section className="flex flex-col gap-4">
        <header className="px-2"><h2 className="text-xl md:text-2xl font-extrabold text-slate-900 font-headline">Neighbors</h2></header>
        <div className="flex gap-4 overflow-x-auto px-2 pb-2 snap-x custom-scrollbar">
          <div className="min-w-[260px] bg-gradient-to-br from-emerald-50 to-teal-50 rounded-[24px] border border-emerald-100 p-6 flex flex-col gap-3 snap-start">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                <span className="material-symbols-outlined text-emerald-600 text-2xl">self_improvement</span>
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">{t('home.neighbor.yoga.title')}</h3>
                <p className="text-[10px] text-slate-400 font-medium">{t('home.coming_soon')}</p>
              </div>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">{t('home.neighbors.yoga_desc')}</p>
            <button className="mt-auto px-4 py-2.5 bg-emerald-100 text-emerald-700 rounded-xl text-xs font-bold opacity-50 cursor-not-allowed" disabled>{t('home.visit_society')}</button>
          </div>
        </div>
      </section>

      {/* Society Marketplace & Games */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-8">
        <div className="bg-primary rounded-[32px] p-8 text-white flex items-center justify-between group overflow-hidden relative shadow-lg">
          <div className="relative z-10">
            <span className="text-white/80 text-[10px] font-bold uppercase tracking-[0.2em] mb-2 block">{t('home.marketplace.title')}</span>
            <h3 className="text-2xl font-extrabold mb-4 leading-tight font-headline">{t('home.marketplace.desc')}</h3>
            <a className="inline-flex items-center gap-2 bg-white text-primary px-5 py-2.5 rounded-xl font-bold text-sm hover:gap-3 transition-all shadow-md" href="/shop">
              {t('home.marketplace.button')} <span className="material-symbols-outlined text-sm font-bold">arrow_forward</span>
            </a>
          </div>
          <div className="absolute -right-12 -bottom-12 opacity-10 transform rotate-12 group-hover:scale-110 transition-transform">
            <span className="material-symbols-outlined text-[200px]" style={{ fontVariationSettings: "'FILL' 1" }}>shopping_bag</span>
          </div>
        </div>

        <div className="bg-slate-900 rounded-[32px] p-8 text-white flex items-center justify-between group overflow-hidden relative shadow-lg">
          <div className="relative z-10">
            <span className="text-white/60 text-[10px] font-bold uppercase tracking-[0.2em] mb-2 block">{t('home.collective.title')}</span>
            <h3 className="text-2xl font-extrabold mb-4 leading-tight font-headline">{t('home.collective.desc')}</h3>
            <a className="inline-flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:gap-3 transition-all shadow-md" href="/arcade">
              {t('home.collective.button')} <span className="material-symbols-outlined text-sm font-bold">sports_esports</span>
            </a>
          </div>
          <div className="absolute -right-12 -bottom-12 opacity-10 transform -rotate-12 group-hover:scale-110 transition-transform">
            <span className="material-symbols-outlined text-[200px]" style={{ fontVariationSettings: "'FILL' 1" }}>sports_esports</span>
          </div>
        </div>
      </section>

      {/* Full Story Popup */}
      {isSafeFloorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsSafeFloorOpen(false)} />
          <div className="relative w-full max-w-2xl max-h-[85vh] bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 bg-red-50 text-red-600 text-[10px] font-bold uppercase tracking-widest rounded-full">{t('home.policy.zero_tolerance')}</span>
              </div>
              <button 
                onClick={() => setIsSafeFloorOpen(false)}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>
            
            <div className="p-0 overflow-y-auto custom-scrollbar flex-1 bg-white">
              <div className="w-full h-64 sm:h-80 relative">
                <img 
                  src="https://images.unsplash.com/photo-1508807526345-15e9b5f4eaff?q=80&w=1200" 
                  alt="Tango Embrace" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent flex items-end p-8">
                  <h2 className="text-3xl md:text-4xl font-extrabold text-white font-headline leading-tight">
                    {t('home.policy.headline')}
                  </h2>
                </div>
              </div>
              
              <div className="p-8 space-y-8">
                <div className="prose prose-slate prose-lg max-w-none">
                  <p className="text-xl font-medium text-slate-800 leading-relaxed font-headline italic border-l-4 border-primary pl-6 py-2 bg-slate-50/50 rounded-r-xl">
                    {t('home.policy.intro')}
                  </p>
                  
                  <div className="my-10 grid grid-cols-1 sm:grid-cols-2 gap-8 items-center">
                    <img 
                      src="https://images.unsplash.com/photo-1535525153412-5a42439a610d?q=80&w=800" 
                      alt="Tango dancers" 
                      className="rounded-3xl shadow-xl w-full h-56 object-cover"
                    />
                    <div className="flex flex-col justify-center">
                      <h3 className="text-xl font-extrabold text-slate-900 mb-4 font-headline">{t('home.policy.section1.title')}</h3>
                      <p className="text-slate-600 text-[15px] leading-relaxed">
                        {t('home.policy.section1.desc')}
                      </p>
                    </div>
                  </div>

                  <h3 className="text-xl md:text-2xl font-extrabold text-slate-900 mt-8 mb-6 font-headline flex items-center gap-3">
                    <span className="material-symbols-outlined text-primary text-2xl md:text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>verified_user</span>
                    {t('home.policy.promise.title')}
                  </h3>
                  
                  <div className="space-y-3">
                    <div className="bg-white rounded-2xl md:rounded-3xl p-4 sm:p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                      <h4 className="font-extrabold text-slate-900 text-base md:text-lg mb-2 flex items-center gap-3">
                        <span className="w-8 h-8 rounded-xl md:rounded-2xl bg-red-50 text-red-600 flex items-center justify-center text-xs md:text-sm font-black">1</span>
                        {t('home.policy.point1.title')}
                      </h4>
                      <p className="text-slate-600 pl-11 text-sm md:text-[15px] leading-relaxed">{t('home.policy.point1.desc')}</p>
                    </div>
                    
                    <div className="bg-white rounded-2xl md:rounded-3xl p-4 sm:p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                      <h4 className="font-extrabold text-slate-900 text-base md:text-lg mb-2 flex items-center gap-3">
                        <span className="w-8 h-8 rounded-xl md:rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center text-xs md:text-sm font-black">2</span>
                        {t('home.policy.point2.title')}
                      </h4>
                      <p className="text-slate-600 pl-11 text-sm md:text-[15px] leading-relaxed">{t('home.policy.point2.desc')}</p>
                    </div>
                    
                    <div className="bg-white rounded-2xl md:rounded-3xl p-4 sm:p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                      <h4 className="font-extrabold text-slate-900 text-base md:text-lg mb-2 flex items-center gap-3">
                        <span className="w-8 h-8 rounded-xl md:rounded-2xl bg-green-50 text-green-600 flex items-center justify-center text-xs md:text-sm font-black">3</span>
                        {t('home.policy.point3.title')}
                      </h4>
                      <p className="text-slate-600 pl-11 text-sm md:text-[15px] leading-relaxed">{t('home.policy.point3.desc')}</p>
                    </div>
                  </div>

                  <div className="mt-12 p-8 md:p-12 bg-slate-900 text-white rounded-[40px] text-center relative overflow-hidden shadow-2xl">
                    <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1508807526345-15e9b5f4eaff?q=80&w=1200')] bg-cover bg-center"></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/80 to-transparent"></div>
                    <div className="relative z-10">
                      <h3 className="text-2xl md:text-3xl font-black font-headline mb-6 leading-tight text-white">{t('home.policy.footer.title')}</h3>
                      <p className="text-white/80 max-w-xl mx-auto text-[15px] leading-relaxed">
                        {t('home.policy.footer.desc')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button 
                onClick={() => setIsSafeFloorOpen(false)}
                className="px-6 py-2.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors"
              >
                {t('home.policy.acknowledge')}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Regional Reports Popup */}
      {isRegionalReportsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsRegionalReportsOpen(false)} />
          <div className="relative w-full max-w-lg max-h-[85vh] bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="relative h-48 sm:h-56">
              <img 
                src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1200" 
                alt="Global Network" 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />
              <div className="absolute top-4 right-4">
                <button 
                  onClick={() => setIsRegionalReportsOpen(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-black/20 text-white hover:bg-black/40 backdrop-blur-md transition-colors"
                >
                  <span className="material-symbols-outlined text-lg">close</span>
                </button>
              </div>
              <div className="absolute bottom-6 left-6 right-6">
                <span className="px-3 py-1 bg-white/20 text-white text-[10px] font-bold uppercase tracking-widest rounded-full mb-2 inline-block backdrop-blur-md border border-white/20">{t('home.stats.live_data')}</span>
                <h2 className="text-2xl font-extrabold text-white font-headline leading-tight">
                  {t('home.stats.title')}
                </h2>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1 bg-slate-50">
              <div className="space-y-3">
                {[
                  { region: 'Seoul, South Korea', count: '1,250', percent: '29%', trend: '+12%' },
                  { region: 'Buenos Aires, Argentina', count: '840', percent: '20%', trend: '+5%' },
                  { region: 'Shanghai, China', count: '620', percent: '14%', trend: '+8%' },
                  { region: 'Istanbul, Turkey', count: '430', percent: '10%', trend: '+15%' },
                  { region: 'Tokyo, Japan', count: '280', percent: '7%', trend: '+3%' },
                  { region: 'Other Regions', count: '861', percent: '20%', trend: '+10%' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                        {i + 1}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900">{item.region}</h4>
                        <div className="flex items-center gap-2 text-xs font-medium mt-0.5">
                          <span className="text-slate-500">{item.percent}</span>
                          <span className="text-green-600 flex items-center"><span className="material-symbols-outlined text-[10px] mr-0.5">trending_up</span>{item.trend}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-black text-lg text-slate-900">{item.count}</span>
                      <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">{t('common.members')}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Registration Popup */}
      {isRegistrationOpen && (
        <div className="fixed inset-0 z-50 flex flex-col p-4 sm:p-6 md:p-10">
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" onClick={() => setIsRegistrationOpen(false)} />
          <div className="relative w-full max-w-3xl mx-auto bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-300 h-full max-h-[800px]">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="text-2xl font-extrabold text-slate-900 font-headline">{t('home.event_registration.title')}</h2>
              <button 
                onClick={() => setIsRegistrationOpen(false)}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>
            
            <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar flex-1 space-y-8 bg-slate-50">
              {upcomingEvent && (
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                  <div className="flex items-start gap-4">
                    <img 
                      src={upcomingEvent.imageUrl || "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&q=80"} 
                      alt={upcomingEvent.title}
                      className="w-24 h-24 rounded-xl object-cover"
                    />
                    <div>
                      <span className="px-2 py-0.5 bg-blue-50 text-primary text-[10px] font-bold rounded-md uppercase tracking-wider mb-2 inline-block">
                        {upcomingEvent.category}
                      </span>
                      <h3 className="text-xl font-bold font-headline mb-1">{upcomingEvent.title}</h3>
                      <p className="text-slate-500 text-sm mb-2">{safeDate(upcomingEvent.startDate)?.toLocaleString() || ''}</p>
                      <p className="text-slate-600 text-sm line-clamp-2">{upcomingEvent.description}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-6">
                <h4 className="font-bold text-slate-900 text-lg">{t('home.attendee_info')}</h4>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">{t('home.full_name')}</label>
                    <input type="text" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors bg-slate-50" placeholder={t('home.placeholder_name')} disabled />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">{t('home.email')}</label>
                    <input type="email" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors bg-slate-50" placeholder={t('home.placeholder_email')} disabled />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">{t('home.special_req')}</label>
                    <textarea className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors bg-slate-50 min-h-[100px]" placeholder={t('home.placeholder_req')} disabled></textarea>
                  </div>
                </div>
                
                <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 flex gap-3 text-amber-800">
                  <span className="material-symbols-outlined text-amber-600">info</span>
                  <p className="text-sm font-medium">{t('home.reg_pending_msg')}</p>
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t border-slate-100 bg-white flex justify-end gap-3">
              <button 
                onClick={() => setIsRegistrationOpen(false)}
                className="px-6 py-3 text-slate-500 font-bold hover:text-slate-900 transition-colors"
              >
                {t('home.cancel')}
              </button>
              <button 
                className="px-8 py-3 bg-slate-200 text-slate-400 font-bold rounded-xl cursor-not-allowed"
                disabled
              >
                {t('home.confirm_reg')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Message */}
      {toastMessage && (
        <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="bg-slate-900 text-white px-6 py-3 rounded-full shadow-lg font-medium text-sm">
            {toastMessage}
          </div>
        </div>
      )}

      {isCartoonsOpen && (
        <GaviCartoonPopup onClose={() => setIsCartoonsOpen(false)} />
      )}
      {isMusic365Open && (
        <Music365Popup onClose={() => setIsMusic365Open(false)} />
      )}
      {isTangoHistoryOpen && (
        <TangoHistoryPopup onClose={() => setIsTangoHistoryOpen(false)} />
      )}


    </main>
    </>
  );
}
