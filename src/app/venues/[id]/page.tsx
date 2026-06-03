'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/clientApp';
import { Venue } from '@/types/venue';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigation } from '@/components/providers/NavigationProvider';

export default function VenueDetailPage() {
  const { t } = useLanguage();
  const params = useParams();
  const router = useRouter();
  const { setGlobalNavHidden } = useNavigation();
  const [venue, setVenue] = useState<Venue | null>(null);
  const [loading, setLoading] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Hide global nav on mount (ProductDetail standard)
  useEffect(() => {
    setGlobalNavHidden(true);
    return () => setGlobalNavHidden(false);
  }, [setGlobalNavHidden]);

  // Scroll listener for header transition (ProductDetail standard)
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const handler = () => setIsScrolled(el.scrollTop > 60);
    el.addEventListener('scroll', handler, { passive: true });
    return () => el.removeEventListener('scroll', handler);
  }, []);

  useEffect(() => {
    const venueId = params.id as string;
    if (!venueId) return;

    const fetchVenue = async () => {
      try {
        const docRef = doc(db, 'venues', venueId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const v = { id: docSnap.id, ...docSnap.data() } as Venue;
          setVenue(v);
        } else {
          router.push('/venues');
        }
      } catch (error) {
        console.error('Error fetching venue:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchVenue();
  }, [params.id, router]);

  const handleClose = () => router.back();

  if (loading) {
    return (
      <div className="fixed inset-0 z-[100] bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }



  if (!venue) return null;

  const getKakaoMapUrl = () => venue.coordinates ? `https://map.kakao.com/link/map/${venue.nameKo || venue.name},${venue.coordinates.latitude},${venue.coordinates.longitude}` : '#';
  const getNaverMapUrl = () => venue.coordinates ? `https://map.naver.com/v5/search/${venue.nameKo || venue.name}?c=${venue.coordinates.longitude},${venue.coordinates.latitude},15,0,0,0,dh` : '#';
  const getGoogleMapUrl = () => venue.coordinates ? `https://www.google.com/maps/search/?api=1&query=${venue.coordinates.latitude},${venue.coordinates.longitude}` : '#';

  return (
    <div className="fixed inset-0 z-[100] bg-white flex flex-col animate-in slide-in-from-bottom duration-300">
      <style dangerouslySetInnerHTML={{ __html: `
        .detail-scrollbar::-webkit-scrollbar { display: none; }
        .detail-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />

      {/* ━━━ Header (ProductDetail standard) ━━━ */}
      <div className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 transition-all duration-300 ${isScrolled ? 'bg-white/95 backdrop-blur-md shadow-sm' : 'bg-gradient-to-b from-black/30 to-transparent'}`}>
        <button onClick={handleClose} className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isScrolled ? 'bg-slate-100 text-[#2d3435]' : 'bg-black/20 backdrop-blur-sm text-white'}`}>
          <span className="material-symbols-rounded text-xl">arrow_back</span>
        </button>
        <div className={`text-base font-bold truncate max-w-[180px] transition-opacity ${isScrolled ? 'opacity-100 text-[#2d3435]' : 'opacity-0'}`}>{venue.nameKo || venue.name}</div>
        <div className="flex items-center gap-2">
          <button onClick={() => {
            if (navigator.share) {
              navigator.share({ title: venue.name, url: window.location.href }).catch(console.error);
            }
          }} className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isScrolled ? 'bg-slate-100 text-[#2d3435]' : 'bg-black/20 backdrop-blur-sm text-white'}`}>
            <span className="material-symbols-rounded text-xl">share</span>
          </button>
        </div>
      </div>

      {/* ━━━ Scrollable Content ━━━ */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto detail-scrollbar pb-6">

        {/* 1) Hero Image */}
        <div className="relative aspect-[4/3] overflow-hidden bg-[#f2f4f4]">
          <div className="absolute inset-0 flex flex-col items-center justify-center text-[#c4cacc]">
            <span className="material-symbols-rounded text-5xl mb-1">location_on</span>
            <span className="text-[10px] font-bold tracking-wider uppercase">{t('venues.no_image', 'No Image')}</span>
          </div>
          {venue.imageUrl && (
            <img src={venue.imageUrl} alt={venue.name} className="relative w-full h-full object-cover z-[1]" />
          )}
          {/* Category badge */}
          <span className="absolute top-16 left-4 z-20 bg-primary text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
            {venue.category}
          </span>
        </div>

        {/* 2) Title & Info (ProductDetail style) */}
        <div className="px-4 pt-5 pb-4 border-b border-[#f2f4f4]">
          <p className="text-[10px] font-black text-[#acb3b4] uppercase tracking-widest leading-none mb-1.5">{venue.region || venue.city}</p>
          <h1 className="text-xl font-black text-[#2d3435] leading-tight font-headline">{venue.name}</h1>
          {venue.nameKo && (
            <p className="text-sm font-medium text-[#596061] mt-1">{venue.nameKo}</p>
          )}
        </div>

        {/* 3) Address & Location Details */}
        <div className="px-4 py-4 border-b border-[#f2f4f4]">
          <p className="text-[10px] font-black text-[#596061] uppercase tracking-widest mb-3">{t('venues.location_info', 'Location')}</p>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-[#f0f4ff] flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-rounded text-primary text-sm">location_on</span>
              </div>
              <div>
                <p className="text-xs font-bold text-[#2d3435]">{t('venues.address_label', 'Address')}</p>
                <p className="text-[11px] text-[#596061]">{venue.address}</p>
              </div>
            </div>

            {venue.contact && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#edf7ed] flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-rounded text-green-600 text-sm">call</span>
                </div>
                <div>
                  <p className="text-xs font-bold text-[#2d3435]">{t('venues.contact_label', 'Contact')}</p>
                  <a href={`tel:${venue.contact}`} className="text-[11px] font-medium text-primary">{venue.contact}</a>
                </div>
              </div>
            )}
          </div>

          {/* Region Tags */}
          <div className="flex items-center gap-2 mt-4 flex-wrap">
            {venue.city && (
              <span className="text-[10px] font-bold px-2.5 py-1 bg-[#f2f4f4] rounded-full text-[#596061]">{venue.city}</span>
            )}
            {venue.region && (
              <span className="text-[10px] font-bold px-2.5 py-1 bg-[#f2f4f4] rounded-full text-[#596061]">{venue.region}</span>
            )}
            {venue.district && (
              <span className="text-[10px] font-bold px-2.5 py-1 bg-[#f2f4f4] rounded-full text-[#596061]">{venue.district}</span>
            )}
            {venue.seoulArea && (
              <span className="text-[10px] font-bold px-2.5 py-1 bg-[#f0f4ff] rounded-full text-primary">{venue.seoulArea}</span>
            )}
          </div>
        </div>

        {/* 4) Map Navigation Buttons */}
        <div className="px-4 py-4">
          <p className="text-[10px] font-black text-[#596061] uppercase tracking-widest mb-3">{t('venues.navigate_to', 'Navigate')}</p>
          <div className="flex items-center gap-2">
            <a href={getKakaoMapUrl()} target="_blank" rel="noreferrer" className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-[#FEE500] text-black rounded-2xl transition-all active:scale-[0.98] hover:brightness-95">
              <span className="text-[12px] font-black">{t('venues.kakao_map')}</span>
            </a>
            <a href={getNaverMapUrl()} target="_blank" rel="noreferrer" className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-[#03C75A] text-white rounded-2xl transition-all active:scale-[0.98] hover:brightness-95">
              <span className="text-[12px] font-black">{t('venues.naver_map')}</span>
            </a>
            <a href={getGoogleMapUrl()} target="_blank" rel="noreferrer" className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-white border border-[#e0e4e5] text-[#4285F4] rounded-2xl transition-all active:scale-[0.98] hover:bg-[#f8f9fa]">
              <span className="text-[12px] font-black">{t('venues.google_map')}</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
