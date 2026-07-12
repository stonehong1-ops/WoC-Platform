'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { peopleService } from '@/lib/firebase/peopleService';
import { Person } from '@/types/people';
import { PlatformUser } from '@/types/user';
import { useNavigation } from '@/components/providers/NavigationProvider';
import { useAuth } from '@/components/providers/AuthProvider';
import { useLanguage } from '@/contexts/LanguageContext';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/clientApp';

const ADMIN_UIDS = ['7iaZAmaYY9dNNEShmJmROI8XrtH2'];

export default function PeopleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isPreview = searchParams.get('preview') === '1';
  const { user } = useAuth();
  const { setGlobalNavHidden } = useNavigation();
  const { t } = useLanguage();
  const [person, setPerson] = useState<Person | null>(null);
  const [previewUser, setPreviewUser] = useState<PlatformUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showTodo, setShowTodo] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Fullscreen: hide global nav
  useEffect(() => {
    setGlobalNavHidden(true);
    return () => setGlobalNavHidden(false);
  }, [setGlobalNavHidden]);

  // Close menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Handle scroll for header transition
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 80);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 데이터 로딩: preview 모드면 users 조회, 아니면 people 조회
  useEffect(() => {
    if (!id) return;
    if (isPreview) {
      // users 컬렉션에서 기본정보 조회
      const unsub = onSnapshot(doc(db, 'users', id), (snap) => {
        if (snap.exists()) {
          setPreviewUser({ id: snap.id, ...snap.data() } as PlatformUser);
        }
        setLoading(false);
      });
      return () => unsub();
    } else {
      const unsub = peopleService.subscribeOne(id, (data) => {
        setPerson(data);
        setLoading(false);
      });
      return () => unsub();
    }
  }, [id, isPreview]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-3 text-on-surface-variant">
          <span className="material-symbols-outlined text-4xl animate-spin">progress_activity</span>
          <p className="text-sm">{t('people.alert_loading')}</p>
        </div>
      </div>
    );
  }

  // Preview 모드: users 기본정보 간략 프로필
  if (isPreview && previewUser) {
    const roleLabels: string[] = [];
    if (previewUser.isInstructor) roleLabels.push(t('people.filter_instructor'));
    if (previewUser.isDj) roleLabels.push(t('people.filter_dj', 'DJ'));
    if (previewUser.isOrganizer) roleLabels.push(t('people.filter_organizer'));
    if (previewUser.isSeller) roleLabels.push(t('people.filter_seller', '판매자'));

    return (
      <main className="pt-0 pb-20 max-w-[480px] mx-auto bg-surface min-h-screen shadow-2xl relative">
        {/* Header */}
        <header className="fixed top-0 w-full z-50 bg-white shadow-md py-2 max-w-[480px]">
          <div className="relative flex justify-between items-center px-6">
            <button onClick={() => router.back()}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors">
              <span className="material-symbols-outlined text-on-surface">arrow_back</span>
            </button>
            <h1 className="text-base font-black text-on-surface truncate max-w-[200px]">
              {previewUser.nickname || previewUser.nativeNickname || '멤버'}
            </h1>
            <div className="w-10" />
          </div>
        </header>

        {/* Profile Card */}
        <div className="pt-20 px-6">
          <div className="flex flex-col items-center text-center pt-8">
            <div className="w-28 h-28 rounded-full overflow-hidden bg-slate-100 border-4 border-white shadow-xl mb-4">
              {previewUser.photoURL ? (
                <img src={previewUser.photoURL} className="w-full h-full object-cover" alt="" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-violet-100 text-violet-600 text-4xl font-black">
                  {(previewUser.nickname || '?')[0]}
                </div>
              )}
            </div>
            <h2 className="text-2xl font-black text-on-surface">{previewUser.nickname || previewUser.nativeNickname || '멤버'}</h2>
            {previewUser.nativeNickname && previewUser.nickname !== previewUser.nativeNickname && (
              <p className="text-sm text-slate-500 font-bold mt-1">{previewUser.nativeNickname}</p>
            )}

            {/* 역할 뱃지 */}
            {roleLabels.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4 justify-center">
                {roleLabels.map(label => (
                  <span key={label} className="px-3 py-1 bg-violet-50 text-violet-650 text-xs font-black rounded-full">{label}</span>
                ))}
              </div>
            )}

            {/* 기본 정보 */}
            <div className="mt-8 w-full space-y-4">
              {previewUser.career && (
                <div className="bg-slate-50 rounded-2xl p-4 text-left">
                  <p className="text-xs font-bold text-slate-400 mb-1">{t('people.preview_career', '경력')}</p>
                  <p className="text-sm font-bold text-on-surface">{previewUser.career}</p>
                </div>
              )}
              {previewUser.partnerStatus && (
                <div className="bg-slate-50 rounded-2xl p-4 text-left">
                  <p className="text-xs font-bold text-slate-400 mb-1">{t('people.preview_partner', '파트너')}</p>
                  <p className="text-sm font-bold text-on-surface">{previewUser.partnerStatus}</p>
                </div>
              )}
              {(previewUser.socialLinks?.instagram || previewUser.socialLinks?.facebook) && (
                <div className="bg-slate-50 rounded-2xl p-4 text-left">
                  <p className="text-xs font-bold text-slate-400 mb-1">{t('people.preview_social', 'SNS')}</p>
                  <div className="flex gap-3 mt-1">
                    {previewUser.socialLinks?.instagram && (
                      <a href={`https://instagram.com/${previewUser.socialLinks.instagram}`} target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-violet-600 hover:underline">Instagram</a>
                    )}
                    {previewUser.socialLinks?.facebook && (
                      <a href={previewUser.socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-blue-600 hover:underline">Facebook</a>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* 상세 프로필 미등록 안내 */}
            <div className="mt-8 p-4 bg-amber-50 rounded-2xl w-full text-center">
              <span className="material-symbols-outlined text-amber-500 text-2xl">info</span>
              <p className="text-xs font-bold text-amber-700 mt-1">{t('people.preview_no_detail', '상세 프로필이 아직 등록되지 않았습니다.')}</p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (!person) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-on-surface-variant">{t('people.alert_not_found')}</p>
        <Link href="/people" className="text-primary text-sm font-semibold">{t('people.alert_back_people')}</Link>
      </div>
    );
  }

  return (
    <main className="pt-0 pb-20 max-w-[480px] mx-auto bg-surface min-h-screen shadow-2xl relative">
      <style dangerouslySetInnerHTML={{ __html: `
        .material-symbols-outlined {
          font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
          vertical-align: middle;
        }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .cinematic-overlay {
          background: linear-gradient(to top, rgba(25,28,29,1) 0%, rgba(25,28,29,0.4) 40%, rgba(25,28,29,0) 100%);
        }
      `}} />

      {/* Floating Header */}
      <header className={`fixed top-0 w-full z-50 transition-all duration-300 max-w-[480px] ${
        scrolled ? 'bg-white shadow-md py-2' : 'bg-transparent py-4'
      }`}>
        {!scrolled && <div className="absolute inset-0 bg-gradient-to-b from-black/60 to-transparent h-24" />}
        <div className="relative flex justify-between items-center px-6">
          <button onClick={() => router.back()}
            className={`w-10 h-10 flex items-center justify-center rounded-full transition-all ${
              scrolled ? 'text-[#2d3435] hover:bg-slate-100' : 'bg-white/10 backdrop-blur-md text-white active:scale-90'
            }`}>
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          
          <div className={`flex flex-col items-center transition-all duration-300 ${
            scrolled ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'
          }`}>
            <span className="text-[15px] font-bold text-[#2d3435] tracking-tight">{person.name}</span>
            <span className="text-[10px] text-[#596061] font-medium">{person.title || person.roles[0]}</span>
          </div>

          <div className="relative" ref={menuRef}>
            <button onClick={() => setShowMenu(!showMenu)} 
              className={`w-10 h-10 flex items-center justify-center rounded-full transition-all ${
                scrolled ? 'text-[#2d3435] hover:bg-slate-100' : 'bg-white/10 backdrop-blur-md text-white active:scale-90'
              }`}>
              <span className="material-symbols-outlined">more_vert</span>
            </button>
            {showMenu && (
              <div className="absolute right-0 top-12 bg-white rounded-xl shadow-2xl border border-outline/10 overflow-hidden min-w-[160px] z-[100] animate-in fade-in slide-in-from-top-2 duration-200">
                {user && (user.uid === person.authorId || ADMIN_UIDS.includes(user.uid) || user.email === 'stonehong1@gmail.com') && (
                  <>
                    <button onClick={() => { setShowMenu(false); router.push(`/people/register?edit=${person.id}`); }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-on-surface hover:bg-surface-container transition-colors">
                      <span className="material-symbols-outlined text-lg">edit</span> {t('people.menu_edit')}
                    </button>
                    <button onClick={async () => { setShowMenu(false); if (!confirm(t('people.confirm_delete_profile'))) return; try { await peopleService.delete(person.id); router.push('/people'); } catch(e) { console.error(e); alert(t('people.alert_delete_failed')); } }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-500 hover:bg-red-50 transition-colors">
                      <span className="material-symbols-outlined text-lg">delete</span> {t('people.menu_delete')}
                    </button>
                  </>
                )}
                <button onClick={() => { setShowMenu(false); navigator.share ? navigator.share({ title: person.name, url: window.location.href }).catch(console.error) : alert(t('people.alert_share_err')); }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-on-surface hover:bg-surface-container transition-colors border-t border-outline/5">
                  <span className="material-symbols-outlined text-lg">share</span> {t('people.detail_share')}
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Cinematic Hero */}
      <section className="relative w-full h-[600px] overflow-hidden">
        {person.heroImageUrl && (
          <img alt={person.name} className="w-full h-full object-cover scale-105" src={person.heroImageUrl} />
        )}
        <div className="absolute inset-0 cinematic-overlay" />

        {/* Partner Badge */}
        {person.partnerName && (
          <div className="absolute top-24 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/40 backdrop-blur-md rounded-full pl-1 pr-3 py-1 border border-white/10">
            {person.partnerPhotoUrl && (
              <img alt={person.partnerName} className="w-6 h-6 rounded-full object-cover" src={person.partnerPhotoUrl} />
            )}
            <span className="text-white text-[10px] font-medium tracking-wide">{t('people.detail_with_partner', { partner: person.partnerName })}</span>
          </div>
        )}

        {/* Live Status */}
        {person.isLiveNow && person.liveStatus && (
          <div className="absolute top-36 left-6">
            <div className="inline-flex items-center gap-2 bg-primary/20 backdrop-blur-xl border border-primary/30 px-3 py-1.5 rounded-full">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-300 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-300" />
              </span>
              <span className="text-blue-200 font-medium text-[10px] uppercase tracking-wider">{person.liveStatus}</span>
            </div>
          </div>
        )}

        {/* Hero Bottom */}
        <div className="absolute bottom-0 left-0 w-full p-6 flex flex-col items-start gap-3">
          <div className="flex items-end gap-6 mb-2">
            {person.profilePhotoUrl && (
              <div className="p-1 bg-white/20 backdrop-blur-md rounded-full ring-2 ring-white/30 shrink-0">
                <img alt={person.name} className="w-20 h-20 rounded-full object-cover" src={person.profilePhotoUrl} />
              </div>
            )}
            <div className="pb-2 w-full">
              <h1 className="text-[32px] font-bold text-white leading-tight">{person.name}</h1>
              {person.title && (
                <p className="text-blue-200 uppercase tracking-[0.1em] text-[10px] mt-1">{person.title}</p>
              )}
              <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-[11px] text-white/80">
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">home_pin</span>
                  {t('people.based_in_city', { city: person.baseCity })}
                </span>
                {person.currentCity && (
                  <span className="flex items-center gap-1 text-blue-300">
                    <span className="material-symbols-outlined text-[14px]">flight_land</span>
                    {t('people.currently_in', { city: person.currentCity })}
                  </span>
                )}
              </div>
              {person.languages?.length > 0 && (
                <div className="mt-1 text-[11px] text-white/60">
                  {t('people.detail_languages', { langs: person.languages.join(' · ') })}
                </div>
              )}
            </div>
          </div>

          {/* Booking */}
          {person.bookingNote && (
            <div className="w-full bg-black/30 backdrop-blur-md border border-white/10 rounded-xl p-3 mb-2">
              <div className="flex items-center gap-2 mb-1">
                <span className="material-symbols-outlined text-blue-300 text-[16px]">calendar_month</span>
                <span className="text-white text-[11px] font-bold uppercase tracking-wider">{t('people.detail_booking_title')}</span>
              </div>
              <p className="text-white/80 text-[12px] leading-snug">{person.bookingNote}</p>
            </div>
          )}

          {/* CTAs */}
          <div className="grid grid-cols-2 gap-3 w-full">
            <button className="bg-primary text-white py-3.5 rounded-xl text-[13px] font-semibold flex items-center justify-center gap-1 active:scale-95 transition-all shadow-lg">
              <span className="material-symbols-outlined text-[18px]">auto_stories</span> {t('people.detail_explore_journey')}
            </button>
            <button className="bg-white/10 backdrop-blur-md text-white border border-white/20 py-3.5 rounded-xl text-[13px] font-semibold flex items-center justify-center gap-1 active:scale-95 transition-all">
              <span className="material-symbols-outlined text-[18px]">event_available</span> {t('people.detail_connect')}
            </button>
          </div>
        </div>
      </section>

      {/* Bio */}
      {person.bio && (
        <section className="px-6 pt-10">
          <h2 className="text-[24px] font-bold text-on-surface mb-4">{t('people.detail_journey')}</h2>
          <div className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/10">
            <p className="text-[16px] text-on-surface-variant leading-relaxed opacity-90">{person.bio}</p>
          </div>
        </section>
      )}

      {/* Activity Flow */}
      {person.activityFlow?.length > 0 && (
        <section className="px-6 pt-10">
          <div className="flex justify-between items-end mb-6">
            <h2 className="text-[24px] font-bold text-on-surface">{t('people.detail_activity')}</h2>
            <span className="text-primary text-[12px] font-semibold">{t('people.detail_global_cycle')}</span>
          </div>
          <div className="relative space-y-8 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-gradient-to-b before:from-primary before:via-outline-variant before:to-transparent">
            {person.activityFlow.map((act, i) => (
              <div key={i} className="relative flex gap-6">
                <div className={`z-10 w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                  act.status === 'live'
                    ? 'bg-primary ring-4 ring-primary/10'
                    : act.status === 'upcoming'
                    ? 'bg-surface-container-highest border-2 border-primary'
                    : 'bg-surface-container-highest border-2 border-outline'
                }`}>
                  {act.status === 'live'
                    ? <span className="material-symbols-outlined text-[14px] text-white" style={{ fontVariationSettings: "'FILL' 1" }}>location_on</span>
                    : <div className={`w-1.5 h-1.5 rounded-full ${act.status === 'upcoming' ? 'bg-primary' : 'bg-outline'}`} />
                  }
                </div>
                <div className="flex-1 -mt-1">
                  <div className="flex justify-between items-start">
                    <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${
                      act.status === 'live' ? 'bg-primary/10 text-primary' : 'text-on-surface-variant'
                    }`}>{act.label}</span>
                    {act.location && (
                      <span className="text-[11px] text-on-surface-variant px-2 py-0.5 bg-surface-container rounded">{act.location}</span>
                    )}
                  </div>
                  <h3 className="text-[18px] font-semibold text-on-surface mt-1">{act.title}</h3>
                  <p className="text-[14px] text-on-surface-variant mt-1">{act.description}</p>
                  {act.cta && (
                    <button className="mt-3 text-primary text-[13px] font-semibold flex items-center gap-1 py-1 border-b border-primary/30 hover:border-primary transition-all">
                      {act.cta} <span className="material-symbols-outlined text-sm">arrow_forward</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Tour Tags */}
      {person.tourStops?.length > 0 && (
        <section className="px-6 pt-10">
          <h2 className="text-[24px] font-bold text-on-surface mb-4">{t('people.detail_tour')}</h2>
          <div className="flex flex-wrap gap-2">
            {person.tourStops.map((stop, i) => (
              <div key={i} className="bg-surface-container px-4 py-2 rounded-xl border border-outline-variant/20 flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px] text-primary">flight</span>
                <span className="text-[13px] font-semibold text-on-surface">{stop.city}</span>
                <span className="text-[11px] text-on-surface-variant">{stop.month}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Global Impact */}
      {person.globalImpact && (
        <section className="px-6 pt-10">
          <h2 className="text-[24px] font-bold text-on-surface mb-4">{t('people.detail_impact')}</h2>
          <div className="grid grid-cols-2 gap-3">
            {person.globalImpact.award && (
              <div className="bg-primary/5 p-6 rounded-2xl border border-primary/10 flex flex-col justify-between aspect-square">
                <span className="material-symbols-outlined text-primary text-[40px]" style={{ fontVariationSettings: "'wght' 200" }}>workspace_premium</span>
                <div>
                  <p className="text-primary text-[20px] font-bold">{person.globalImpact.award}</p>
                  <p className="text-[10px] text-on-surface-variant uppercase tracking-widest mt-1">{person.globalImpact.awardSub}</p>
                </div>
              </div>
            )}
            {person.globalImpact.org && (
              <div className="bg-secondary/5 p-6 rounded-2xl border border-outline-variant/20 flex flex-col justify-between aspect-square">
                <span className="material-symbols-outlined text-secondary text-[40px]" style={{ fontVariationSettings: "'wght' 200" }}>public</span>
                <div>
                  <p className="text-[20px] font-bold text-on-surface">{person.globalImpact.org}</p>
                  <p className="text-[10px] text-on-surface-variant uppercase tracking-widest mt-1">{person.globalImpact.orgSub}</p>
                </div>
              </div>
            )}
            {person.globalImpact.classCount && (
              <div className="col-span-2 bg-surface-container p-6 rounded-2xl border border-outline-variant/10 flex items-center gap-6">
                <div className="bg-surface w-14 h-14 rounded-full flex items-center justify-center shadow-sm shrink-0">
                  <span className="material-symbols-outlined text-primary">analytics</span>
                </div>
                <div className="flex-1">
                  <p className="text-[16px] font-semibold text-on-surface">{person.globalImpact.classCount}</p>
                  {person.globalImpact.classReach && <p className="text-[14px] text-on-surface-variant">{person.globalImpact.classReach}</p>}
                  {person.globalImpact.appearances && <p className="text-[12px] text-primary mt-2 font-semibold">{person.globalImpact.appearances}</p>}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Media */}
      {person.mediaItems?.length > 0 && (
        <section className="pt-10">
          <div className="px-6 mb-4 flex justify-between items-end">
            <h2 className="text-[24px] font-bold text-on-surface">{t('people.detail_media')}</h2>
            <a className="text-[13px] font-semibold text-primary hover:underline" href="#">{t('people.detail_all_media')}</a>
          </div>
          <div className="flex overflow-x-auto hide-scrollbar gap-6 px-6 pb-2">
            {person.mediaItems.map((media, i) => (
              <div key={i} className="min-w-[300px] group cursor-pointer">
                <div className="relative aspect-video rounded-2xl overflow-hidden mb-2 border border-outline-variant/20 shadow-sm">
                  <img alt={media.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" src={media.thumbnailUrl} />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30">
                      <span className="material-symbols-outlined text-white text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
                    </div>
                  </div>
                </div>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-[13px] font-semibold text-on-surface">{media.title}</h3>
                    <p className="text-[13px] text-on-surface-variant">{media.subtitle}</p>
                  </div>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                    media.type === 'VOD' ? 'text-primary bg-primary/10' :
                    media.type === 'COURSE' ? 'text-secondary bg-secondary/10' : 'text-outline bg-surface-container'
                  }`}>{media.type}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Featured Content */}
      {person.featuredVideoUrls?.length > 0 && (
        <section className="px-6 pt-10">
          <h2 className="text-[24px] font-bold text-on-surface mb-4">{t('people.detail_featured')}</h2>
          <div className="grid grid-cols-2 gap-3">
            {person.featuredVideoUrls.map((url, i) => (
              <div key={i} className="relative aspect-video rounded-xl overflow-hidden cursor-pointer group">
                <img alt={`Featured ${i + 1}`} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" src={url} />
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                  <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center text-white">
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="mt-10 px-6 py-10 bg-surface-container-highest/30 border-t border-outline-variant/20">
        <div className="flex flex-col items-center text-center gap-4">
          <span className="text-primary font-bold text-[20px] tracking-tight">{t('people.detail_woc')}</span>
          <p className="text-[14px] text-on-surface-variant px-8 opacity-80">{t('people.detail_slogan')}</p>
          <p className="text-[10px] text-outline mt-2">{t('people.detail_portal')}</p>
        </div>
      </footer>

      {/* Request FAB */}
      <button 
        onClick={() => setShowTodo(true)}
        className="fixed bottom-6 right-6 h-14 px-6 bg-primary text-white rounded-full shadow-2xl flex items-center justify-center gap-2 active:scale-90 transition-transform z-[60]">
        <span className="material-symbols-outlined">send</span>
        <span className="text-[13px] font-semibold">{t('people.detail_request_fab')}</span>
      </button>

      {/* Todo Modal */}
      {showTodo && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-6">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowTodo(false)} />
          <div className="relative w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="pt-10 pb-8 px-6 text-center">
              <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl animate-bounce">🏗️</span>
              </div>
              <h3 className="text-xl font-bold text-[#2d3435] mb-2">{t('people.detail_coming_soon')}</h3>
              <p className="text-sm text-[#596061] leading-relaxed mb-8">
                {t('people.detail_coming_soon_desc')}
              </p>
              <button 
                onClick={() => setShowTodo(false)}
                className="w-full py-4 bg-[#f8f9fa] text-[#2d3435] font-bold rounded-2xl hover:bg-slate-100 transition-colors">
                {t('people.detail_coming_soon_btn')}
              </button>
            </div>
            <div className="bg-[#f8f9fa] py-3 px-6 flex justify-between items-center border-t border-slate-100">
              <span className="text-[10px] font-bold text-primary uppercase tracking-widest">{t('people.detail_coming_soon_status')}</span>
              <span className="text-[10px] text-slate-400 font-mono">REF: WOC_PEOPLE_REQ</span>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
