'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { db } from '@/lib/firebase/clientApp';
import {
  collection, query, where, getDocs, orderBy, limit,
  Timestamp
} from 'firebase/firestore';
import { Event } from '@/types/event';
import { Social } from '@/types/social';
import { useLocation } from '@/components/providers/LocationProvider';
import EventDetail from '@/components/events/EventDetail';
import { AnimatePresence } from 'framer-motion';

/* ─── 날짜 포맷 헬퍼 ─────────────────────────────── */
function formatEventDate(ts: Timestamp | undefined): string {
  if (!ts) return '';
  const d = typeof ts.toDate === 'function' ? ts.toDate() : new Date((ts as any).seconds * 1000);
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    + ' • ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
}

/* ─── 스켈레톤 ────────────────────────────────────── */
function Skeleton({ className }: { className: string }) {
  return <div className={`animate-pulse bg-gray-200 rounded ${className}`} />;
}

export default function ActivitySpotlight() {
  const { location } = useLocation();
  const [todaySocials, setTodaySocials] = useState<Social[]>([]);
  const [openClassCount, setOpenClassCount] = useState<number | null>(null);
  const [upcomingEvent, setUpcomingEvent] = useState<Event | null | 'empty'>('empty');
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      if (selectedEvent) {
        setSelectedEvent(null);
      }
    };

    if (selectedEvent) {
      window.history.pushState({ modal: true }, '');
      window.addEventListener('popstate', handlePopState);
    }

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [selectedEvent]);

  const handleCloseEvent = () => {
    setSelectedEvent(null);
    if (window.history.state?.modal) {
      window.history.back();
    }
  };

  useEffect(() => {
    let cancelled = false;

    async function fetchAll() {
      const today = new Date();
      const dayOfWeek = today.getDay(); // 0=Sun, 6=Sat

      try {
        // ── 1. 오늘 소셜 (Regular: dayOfWeek 일치) ──
        const socialSnap = await getDocs(
          query(collection(db, 'socials'), where('type', '==', 'regular'))
        );
        const allRegular = socialSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Social[];
        const todayRegular = allRegular.filter(s => Number(s.dayOfWeek) === dayOfWeek);

        // Popup: 오늘 날짜와 date 필드 일치
        const popupSnap = await getDocs(
          query(collection(db, 'socials'), where('type', '==', 'popup'))
        );
        const allPopup = popupSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Social[];
        const todayPopup = allPopup.filter(s => {
          if (!s.date) return false;
          const sDate = typeof s.date.toDate === 'function' ? s.date.toDate() : new Date((s.date as any).seconds * 1000);
          return sDate.toDateString() === today.toDateString();
        });

        const combined = [...todayRegular, ...todayPopup];
        if (!cancelled) setTodaySocials(combined);

        // ── 2. Open Classes 카운트 (classes + bundles + monthlyPasses 합산) ──
        const groupsSnap = await getDocs(collection(db, 'groups'));
        const classCountResults = await Promise.all(
          groupsSnap.docs.map(async groupDoc => {
            const [classSnap, bundleSnap, passSnap] = await Promise.allSettled([
              getDocs(collection(db, 'groups', groupDoc.id, 'classes')),
              getDocs(collection(db, 'groups', groupDoc.id, 'bundles')),
              getDocs(collection(db, 'groups', groupDoc.id, 'monthlyPasses')),
            ]);
            return (classSnap.status === 'fulfilled' ? classSnap.value.size : 0)
                 + (bundleSnap.status === 'fulfilled' ? bundleSnap.value.size : 0)
                 + (passSnap.status === 'fulfilled' ? passSnap.value.size : 0);
          })
        );
        const openCount = classCountResults.reduce((sum, c) => sum + c, 0);
        if (!cancelled) setOpenClassCount(openCount);

        // ── 3. 가장 가까운 Upcoming Event ──
        const eventSnap = await getDocs(
          query(
            collection(db, 'events'),
            where('startDate', '>=', Timestamp.now()),
            orderBy('startDate', 'asc'),
            limit(1)
          )
        );
        const events = eventSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Event[];
        if (!cancelled) setUpcomingEvent(events[0] ?? null);

      } catch (err) {
        console.error('[ActivitySpotlight] fetch error:', err);
        if (!cancelled) setUpcomingEvent(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchAll();
    return () => { cancelled = true; };
  }, []);

  /* ── 파생 값 ── */
  const socialCity = location?.city || 'Seoul';
  const cityFilteredSocials = todaySocials.filter(s => s.city === socialCity);
  const firstSocial = cityFilteredSocials[0];
  const othersCount = cityFilteredSocials.length > 1 ? cityFilteredSocials.length - 1 : 0;
  const socialDesc = firstSocial ? (
    <>
      &apos;{firstSocial.title}
      {firstSocial.titleNative && <span style={{ fontSize: '0.85em', marginLeft: '0.25rem' }}>{firstSocial.titleNative}</span>}&apos;
      {othersCount > 0 ? ` and ${othersCount} other${othersCount > 1 ? 's' : ''}` : ''}
    </>
  ) : (
    'No socials today'
  );

  const eventData = upcomingEvent !== 'empty' ? upcomingEvent : null;

  return (
    <section className="space-y-4">
      {/* Section Header */}
      <div className="flex items-end justify-between px-2">
        <h2 className="text-xl md:text-2xl font-extrabold text-slate-900 font-headline">
          Activity Spotlight
        </h2>
      </div>

      {/* Action Links Bento Grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* Card 1: Today's Social */}
        <Link
          href="/social"
          className="group relative flex flex-col p-6 rounded-3xl shadow-lg transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] active:scale-95 overflow-hidden text-left no-underline"
          style={{ background: 'linear-gradient(135deg, #0057bd 0%, #0057bd 60%, #3d56ba 100%)', border: '1px solid rgba(0,87,189,0.2)' }}
        >
          {/* Decorative icon bg */}
          <span className="material-symbols-outlined absolute text-white pointer-events-none select-none"
            style={{ fontSize: '9rem', lineHeight: 1, opacity: 0.2, bottom: '-1.5rem', right: '-1.5rem', transform: 'rotate(12deg)' }}>
            celebration
          </span>

          {/* Icon */}
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl mb-8 self-start"
            style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.3)' }}>
            <span className="material-symbols-outlined text-white text-3xl">local_bar</span>
          </div>

          {/* Text */}
          <div className="mt-auto relative z-10">
            {loading ? (
              <>
                <Skeleton className="h-6 w-32 mb-2" />
                <Skeleton className="h-4 w-44" />
              </>
            ) : (
              <>
                <h3 className="text-white mb-2 leading-tight"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '1.25rem', lineHeight: '1.75rem', fontWeight: 800 }}>
                  Social today<br />in {socialCity}
                </h3>
                <p className="leading-relaxed" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.9375rem', lineHeight: '1.5rem', color: 'rgba(255,255,255,0.8)' }}>
                  {socialDesc}
                </p>
              </>
            )}
          </div>

          {/* Hover arrow */}
          <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
            <span className="material-symbols-outlined text-white">arrow_forward</span>
          </div>
        </Link>

        {/* Card 2: Open Classes */}
        <Link
          href="/class"
          className="group relative flex flex-col p-6 rounded-3xl shadow-sm transition-all duration-300 hover:shadow-xl hover:scale-[1.02] active:scale-95 overflow-hidden text-left no-underline"
          style={{ background: '#ffffff', border: '1px solid rgba(194,198,213,0.3)' }}
        >
          {/* Decorative icon bg */}
          <span className="material-symbols-outlined absolute pointer-events-none select-none"
            style={{ fontSize: '9rem', lineHeight: 1, opacity: 0.05, bottom: '-1.5rem', right: '-1.5rem', transform: 'rotate(-12deg)', color: '#0057bd' }}>
            auto_stories
          </span>

          {/* Icon */}
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl mb-8 self-start shadow-md"
            style={{ background: '#004190' }}>
            <span className="material-symbols-outlined text-white text-3xl">school</span>
          </div>

          {/* Text */}
          <div className="mt-auto relative z-10">
            {loading ? (
              <>
                <Skeleton className="h-6 w-28 mb-2" />
                <Skeleton className="h-4 w-40" />
              </>
            ) : (
              <>
                <h3 className="mb-2 leading-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '1.25rem', lineHeight: '1.75rem', fontWeight: 800, color: '#004190' }}>
                  Open Classes
                </h3>
                <p className="leading-relaxed" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.9375rem', lineHeight: '1.5rem', color: '#424753' }}>
                  {openClassCount !== null
                    ? `Explore ${openClassCount} open class${openClassCount !== 1 ? 'es' : ''} in Korea`
                    : 'Browse classes in Korea'}
                </p>
              </>
            )}
          </div>

          {/* Hover arrow */}
          <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
            <span className="material-symbols-outlined" style={{ color: '#004190' }}>north_east</span>
          </div>
        </Link>
      </div>

      {/* Immersive Event Card */}
      {loading ? (
        <Skeleton className="w-full h-56 rounded-3xl" />
      ) : eventData ? (
        <div
          onClick={() => setSelectedEvent(eventData)}
          className="relative w-full h-56 rounded-3xl overflow-hidden shadow-xl group block no-underline cursor-pointer"
        >
          <img
            alt={eventData.title}
            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
            src={eventData.imageUrl || 'https://lh3.googleusercontent.com/aida-public/AB6AXuAM-qcbRNMJdZLS9Ca7Gp1EjVkOyWQhtKBiYOVV8jYdBKKdmtYDvyKh8uAbGKuFuWSqYG_cwZyguPHzTslh1whMR66-pyycVhSWNYgJjvbFatGIX03BxE1lE-1iBMQjH7_2F8g6-LvoJIcnlB0MGrlKJYOVJZFWQyKma420t8TJpTbYWVZog86VoGm2oqMpqqloZzF_17DT9iJk6dbzfGibveQrX7XmbdfyWCQaGlMZuD8TON4K8v5PG8jgMr8kEfGxpq99xneK9p4'}
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0 flex flex-col justify-end p-8"
            style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.3) 50%, transparent 100%)' }}>
            <p className="text-white mb-1 tracking-tight"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '1.25rem', lineHeight: '1.75rem', fontWeight: 800, textShadow: '0 2px 10px rgba(0,0,0,0.9), 0 0 4px rgba(0,0,0,0.5)' }}>
              {eventData.title}
              {eventData.titleNative && (
                <span className="ml-2 font-normal" style={{ fontSize: '0.875rem', opacity: 0.85 }}>{eventData.titleNative}</span>
              )}
            </p>
            <div className="flex flex-col gap-1.5 mb-4">
              <p className="text-white/90 uppercase flex items-center gap-1.5"
                style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.875rem', lineHeight: '1.25rem', fontWeight: 600, letterSpacing: '0.05em' }}>
                <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'opsz' 20" }}>calendar_today</span>
                {formatEventDate(eventData.startDate)}
              </p>
              <p className="text-white/90 flex items-center gap-1.5"
                style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.875rem', lineHeight: '1.25rem', fontWeight: 600 }}>
                <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'opsz' 20" }}>location_on</span>
                {eventData.location}
              </p>
            </div>
            <div>
              <span className="inline-block px-6 py-2.5 bg-white font-bold text-sm rounded-xl shadow-md transition-all duration-300"
                style={{ color: '#004190' }}>
                Earlybird Register
              </span>
            </div>
          </div>
          {/* Canvas texture overlay */}
          <div className="absolute inset-0 pointer-events-none opacity-10 mix-blend-overlay"
            style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/canvas-orange.png')" }} />
        </div>
      ) : (
        /* 이벤트 없을 때 fallback */
        <div className="relative w-full h-32 rounded-3xl overflow-hidden border border-gray-100 flex items-center justify-center bg-gray-50">
          <p className="text-gray-400 text-sm">No upcoming events</p>
        </div>
      )}

      <AnimatePresence>
        {selectedEvent && (
          <EventDetail 
            event={selectedEvent} 
            onClose={handleCloseEvent}
            onDelete={(id) => {
              handleCloseEvent();
            }}
            onEdit={(evt) => {
              alert("Edit functionality coming soon!");
            }}
          />
        )}
      </AnimatePresence>
    </section>
  );
}
