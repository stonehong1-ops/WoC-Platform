'use client';

import React, { useState, useRef, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useNavigation } from '@/components/providers/NavigationProvider';
import { useAuth } from '@/components/providers/AuthProvider';
import { useLanguage } from '@/contexts/LanguageContext';
import { peopleService } from '@/lib/firebase/peopleService';
import { Person, PersonRole, ActivityEntry, TourStop } from '@/types/people';
import { storageService } from '@/lib/firebase/storageService';

const ROLE_OPTIONS: PersonRole[] = ['Instructor', 'Organizer', 'Couple', 'Touring', 'Dancer'];

function RegisterPageContent() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');
  const { setGlobalNavHidden } = useNavigation();
  const { t } = useLanguage();

  useEffect(() => {
    setGlobalNavHidden(true);
    return () => setGlobalNavHidden(false);
  }, [setGlobalNavHidden]);

  const getRoleLabel = (role: PersonRole) => {
    switch (role) {
      case 'Instructor': return t('people.filter_instructor');
      case 'Organizer': return t('people.filter_organizer');
      case 'Couple': return t('people.filter_couples');
      case 'Touring': return t('people.filter_touring');
      case 'Dancer': return t('people.filter_dancer');
      default: return role;
    }
  };
  // Basic
  const [name, setName] = useState('');
  const [roles, setRoles] = useState<PersonRole[]>([]);
  const [title, setTitle] = useState('');
  const [bio, setBio] = useState('');
  const [baseCity, setBaseCity] = useState('');
  const [baseCountry, setBaseCountry] = useState('');
  const [currentCity, setCurrentCity] = useState('');
  const [currentCountry, setCurrentCountry] = useState('');
  const [isLiveNow, setIsLiveNow] = useState(false);
  const [liveStatus, setLiveStatus] = useState('');
  const [languages, setLanguages] = useState('');
  const [bookingNote, setBookingNote] = useState('');
  const [partnerName, setPartnerName] = useState('');
  const [style, setStyle] = useState('');
  const [partnerSince, setPartnerSince] = useState('');

  // Images
  const [heroFile, setHeroFile] = useState<File | null>(null);
  const [heroPreview, setHeroPreview] = useState('');
  const [profileFile, setProfileFile] = useState<File | null>(null);
  const [profilePreview, setProfilePreview] = useState('');

  // Tour stops (simplified)
  const [tourStops, setTourStops] = useState<TourStop[]>([{ city: '', country: '', month: '' }]);

  // Activity (simplified – 3 fixed)
  const [activities, setActivities] = useState<ActivityEntry[]>([
    { status: 'live', label: 'LIVE NOW', location: '', title: '', description: '', cta: '' },
    { status: 'upcoming', label: 'Upcoming', location: '', title: '', description: '', cta: '' },
    { status: 'past', label: 'Past', location: '', title: '', description: '' },
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const heroRef = useRef<HTMLInputElement>(null);
  const profileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!editId) return;
    const unsub = peopleService.subscribeOne(editId, (data) => {
      if (!data) return;
      setName(data.name);
      setRoles(data.roles);
      setTitle(data.title);
      setBio(data.bio);
      setBaseCity(data.baseCity);
      setBaseCountry(data.baseCountry);
      setCurrentCity(data.currentCity || '');
      setCurrentCountry(data.currentCountry || '');
      setIsLiveNow(data.isLiveNow || false);
      setLiveStatus(data.liveStatus || '');
      setLanguages(data.languages.join(', '));
      setBookingNote(data.bookingNote || '');
      setPartnerName(data.partnerName || '');
      setStyle(data.style || '');
      setPartnerSince(data.partnerSince || '');
      setHeroPreview(data.heroImageUrl);
      setProfilePreview(data.profilePhotoUrl);
      if (data.tourStops?.length) setTourStops(data.tourStops);
      if (data.activityFlow?.length) setActivities(data.activityFlow as ActivityEntry[]);
      unsub();
    });
  }, [editId]);

  const toggleRole = (r: PersonRole) => {
    setRoles(prev => prev.includes(r) ? prev.filter(x => x !== r) : [...prev, r]);
  };

  const updateTour = (i: number, field: keyof TourStop, val: string) => {
    setTourStops(prev => prev.map((t, idx) => idx === i ? { ...t, [field]: val } : t));
  };
  const addTourStop = () => setTourStops(prev => [...prev, { city: '', country: '', month: '' }]);
  const removeTourStop = (i: number) => setTourStops(prev => prev.filter((_, idx) => idx !== i));

  const updateActivity = (i: number, field: keyof ActivityEntry, val: string) => {
    setActivities(prev => prev.map((a, idx) => idx === i ? { ...a, [field]: val } : a));
  };

  const handleHeroChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setHeroFile(f);
    setHeroPreview(URL.createObjectURL(f));
  };

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setProfileFile(f);
    setProfilePreview(URL.createObjectURL(f));
  };

  const handleSubmit = async () => {
    if (!user) { alert(t('people.alert_login_req')); return; }
    if (!name.trim() || roles.length === 0) {
      alert(t('people.alert_name_role_req'));
      return;
    }

    setIsSubmitting(true);
    try {
      let heroUrl = heroPreview;
      let profileUrl = profilePreview;

      if (heroFile) {
        heroUrl = await storageService.uploadFile(heroFile, `people/${Date.now()}_hero`);
      }
      if (profileFile) {
        profileUrl = await storageService.uploadFile(profileFile, `people/${Date.now()}_profile`);
      }

      const payload: Omit<Person, 'id' | 'createdAt' | 'updatedAt'> = {
        name,
        roles,
        title,
        bio,
        baseCity,
        baseCountry,
        currentCity,
        currentCountry,
        isLiveNow,
        liveStatus,
        heroImageUrl: heroUrl,
        profilePhotoUrl: profileUrl,
        languages: languages.split(',').map(l => l.trim()).filter(Boolean),
        bookingNote,
        partnerName,
        style,
        partnerSince,
        achievements: [],
        activityFlow: activities.filter(a => a.title.trim()),
        tourStops: tourStops.filter(t => t.city.trim()),
        mediaItems: [],
        featuredVideoUrls: [],
        authorId: user.uid,
        authorName: user.displayName || 'Anonymous',
        authorPhoto: user.photoURL || undefined,
      };

      if (editId) {
        await peopleService.update(editId, payload);
        router.back();
      } else {
        const newId = await peopleService.add(payload);
        router.replace('/create-success?type=people&id=' + newId);
      }
    } catch (err) {
      console.error(err);
      alert(t('people.alert_error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="max-w-md mx-auto h-[100dvh] bg-white flex flex-col overflow-hidden relative">
      {/* Header */}
      <div className="flex-shrink-0 bg-white border-b border-slate-100 px-4 h-14 flex items-center justify-between z-50">
        <button type="button" onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center -ml-2 active:scale-95 transition-transform text-slate-700">
          <span className="material-symbols-rounded text-2xl">arrow_back</span>
        </button>
        <h1 className="text-[16px] font-bold text-slate-800">
          {editId ? t('people.edit_artist') : t('people.register_artist')}
        </h1>
        <button type="button" onClick={handleSubmit} disabled={isSubmitting}
          className="px-5 py-2 rounded-full bg-[#007AFF] text-white text-[14px] font-bold disabled:opacity-50 active:scale-95 transition-all">
          {isSubmitting ? t('people.form_submit_processing') : editId ? t('people.form_submit_update') : t('people.form_submit_register')}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 mt-4 space-y-6 pb-6 no-scrollbar">

        {/* Hero Image */}
        <div>
          <label className="block text-[14px] font-bold text-[#596061] mb-2">{t('people.form_hero')}</label>
          <div
            onClick={() => heroRef.current?.click()}
            className="w-full h-44 rounded-2xl overflow-hidden border-2 border-dashed border-[#acb3b4] bg-[#f8f9fa] flex items-center justify-center cursor-pointer relative"
          >
            {heroPreview
              ? <img src={heroPreview} alt="Hero" className="w-full h-full object-cover" />
              : <div className="flex flex-col items-center text-[#acb3b4]">
                  <span className="material-symbols-outlined text-4xl">add_photo_alternate</span>
                  <span className="text-xs mt-1">{t('people.form_hero_tap')}</span>
                </div>
            }
          </div>
          <input ref={heroRef} type="file" accept="image/*" className="hidden" onChange={handleHeroChange} />
        </div>

        {/* Profile Photo */}
        <div>
          <label className="block text-[14px] font-bold text-[#596061] mb-2">{t('people.form_profile')}</label>
          <div className="flex items-center gap-4">
            <div
              onClick={() => profileRef.current?.click()}
              className="w-20 h-20 rounded-full overflow-hidden border-2 border-dashed border-[#acb3b4] bg-[#f8f9fa] flex items-center justify-center cursor-pointer"
            >
              {profilePreview
                ? <img src={profilePreview} alt="Profile" className="w-full h-full object-cover" />
                : <span className="material-symbols-outlined text-2xl text-[#acb3b4]">person</span>
              }
            </div>
            <span className="text-sm text-[#596061]">{t('people.form_profile_tap')}</span>
          </div>
          <input ref={profileRef} type="file" accept="image/*" className="hidden" onChange={handleProfileChange} />
        </div>

        {/* Name */}
        <div>
          <label className="block text-[14px] font-bold text-[#596061] mb-1.5">{t('people.form_name')} <span className="text-red-400">*</span></label>
          <input required type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Sofia Alvarez"
            className="w-full bg-[#f8f9fa] border border-[#e0e4e5] rounded-xl px-4 py-3 text-[16px] focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" />
        </div>

        {/* Sub Title */}
        <div>
          <label className="block text-[14px] font-bold text-[#596061] mb-1.5">{t('people.form_title')}</label>
          <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g., Master Instructor • Global Performer"
            className="w-full bg-[#f8f9fa] border border-[#e0e4e5] rounded-xl px-4 py-3 text-[16px] focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" />
        </div>

        {/* Roles */}
        <div>
          <label className="block text-[14px] font-bold text-[#596061] mb-2">{t('people.form_roles')} <span className="text-red-400">*</span></label>
          <div className="flex flex-wrap gap-2">
            {ROLE_OPTIONS.map(r => (
              <button key={r} type="button" onClick={() => toggleRole(r)}
                className={`px-4 py-2 rounded-full text-sm font-semibold border transition-all ${roles.includes(r) ? 'bg-primary text-white border-primary' : 'bg-[#f8f9fa] text-[#596061] border-[#e0e4e5]'}`}>
                {getRoleLabel(r)}
              </button>
            ))}
          </div>
        </div>

        {/* Partner (if Couple) */}
        {roles.includes('Couple') && (
          <div className="space-y-3 p-4 bg-[#f8f9fa] rounded-2xl border border-[#e0e4e5]">
            <p className="text-[14px] font-bold text-[#596061]">{t('people.form_partner_info')}</p>
            <input type="text" value={partnerName} onChange={e => setPartnerName(e.target.value)} placeholder={t('people.form_partner_name')}
              className="w-full bg-white border border-[#e0e4e5] rounded-xl px-4 py-3 text-[16px] outline-none" />
            <div className="flex gap-3">
              <input type="text" value={style} onChange={e => setStyle(e.target.value)} placeholder={t('people.form_dance_style')}
                className="flex-1 bg-white border border-[#e0e4e5] rounded-xl px-4 py-3 text-[16px] outline-none" />
              <input type="text" value={partnerSince} onChange={e => setPartnerSince(e.target.value)} placeholder={t('people.form_since')}
                className="w-28 bg-white border border-[#e0e4e5] rounded-xl px-4 py-3 text-[16px] outline-none" />
            </div>
          </div>
        )}

        {/* Location */}
        <div>
          <label className="block text-[14px] font-bold text-[#596061] mb-1.5">{t('people.form_base_location')}</label>
          <div className="flex gap-3">
            <input type="text" value={baseCity} onChange={e => setBaseCity(e.target.value)} placeholder={t('people.form_city')}
              className="flex-1 bg-[#f8f9fa] border border-[#e0e4e5] rounded-xl px-4 py-3 text-[16px] outline-none" />
            <input type="text" value={baseCountry} onChange={e => setBaseCountry(e.target.value)} placeholder={t('people.form_country')}
              className="w-28 bg-[#f8f9fa] border border-[#e0e4e5] rounded-xl px-4 py-3 text-[16px] outline-none" />
          </div>
        </div>

        {/* Current Location */}
        <div>
          <label className="block text-[14px] font-bold text-[#596061] mb-1.5">{t('people.form_current_location')}</label>
          <div className="flex gap-3 mb-2">
            <input type="text" value={currentCity} onChange={e => setCurrentCity(e.target.value)} placeholder={t('people.form_city')}
              className="flex-1 bg-[#f8f9fa] border border-[#e0e4e5] rounded-xl px-4 py-3 text-[16px] outline-none" />
            <input type="text" value={currentCountry} onChange={e => setCurrentCountry(e.target.value)} placeholder={t('people.form_country')}
              className="w-28 bg-[#f8f9fa] border border-[#e0e4e5] rounded-xl px-4 py-3 text-[16px] outline-none" />
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setIsLiveNow(p => !p)}
              className={`w-11 h-6 rounded-full transition-all relative ${isLiveNow ? 'bg-primary' : 'bg-[#e0e4e5]'}`}>
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${isLiveNow ? 'left-6' : 'left-1'}`} />
            </button>
            <span className="text-sm text-[#596061]">{t('people.form_show_live')}</span>
          </div>
          {isLiveNow && (
            <input type="text" value={liveStatus} onChange={e => setLiveStatus(e.target.value)} placeholder={t('people.form_live_badge_placeholder')}
              className="mt-2 w-full bg-[#f8f9fa] border border-[#e0e4e5] rounded-xl px-4 py-3 text-[16px] outline-none" />
          )}
        </div>

        {/* Bio */}
        <div>
          <label className="block text-[14px] font-bold text-[#596061] mb-1.5">{t('people.form_bio')}</label>
          <textarea rows={4} value={bio} onChange={e => setBio(e.target.value)} placeholder={t('people.form_bio_placeholder')}
            className="w-full bg-[#f8f9fa] border border-[#e0e4e5] rounded-xl px-4 py-3 text-[16px] outline-none resize-none" />
        </div>

        {/* Languages */}
        <div>
          <label className="block text-[14px] font-bold text-[#596061] mb-1.5">{t('people.form_languages')}</label>
          <input type="text" value={languages} onChange={e => setLanguages(e.target.value)} placeholder={t('people.form_languages_placeholder')}
            className="w-full bg-[#f8f9fa] border border-[#e0e4e5] rounded-xl px-4 py-3 text-[16px] outline-none" />
        </div>

        {/* Booking Note */}
        <div>
          <label className="block text-[14px] font-bold text-[#596061] mb-1.5">{t('people.form_booking_note')}</label>
          <input type="text" value={bookingNote} onChange={e => setBookingNote(e.target.value)} placeholder={t('people.form_booking_placeholder')}
            className="w-full bg-[#f8f9fa] border border-[#e0e4e5] rounded-xl px-4 py-3 text-[16px] outline-none" />
        </div>

        {/* Tour Schedule */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-[14px] font-bold text-[#596061]">{t('people.form_tour_schedule')}</label>
            <button type="button" onClick={addTourStop} className="text-primary text-sm font-semibold">{t('people.form_add')}</button>
          </div>
          <div className="space-y-2">
            {tourStops.map((stop, i) => (
              <div key={i} className="flex gap-2 items-center">
                <input type="text" value={stop.city} onChange={e => updateTour(i, 'city', e.target.value)} placeholder={t('people.form_city')}
                  className="flex-1 bg-[#f8f9fa] border border-[#e0e4e5] rounded-xl px-3 py-2.5 text-[16px] outline-none" />
                <input type="text" value={stop.country} onChange={e => updateTour(i, 'country', e.target.value)} placeholder={t('people.form_country')}
                  className="w-24 bg-[#f8f9fa] border border-[#e0e4e5] rounded-xl px-3 py-2.5 text-[16px] outline-none" />
                <input type="text" value={stop.month} onChange={e => updateTour(i, 'month', e.target.value)} placeholder={t('people.form_month')}
                  className="w-20 bg-[#f8f9fa] border border-[#e0e4e5] rounded-xl px-3 py-2.5 text-[16px] outline-none" />
                {tourStops.length > 1 && (
                  <button type="button" onClick={() => removeTourStop(i)} className="text-red-400">
                    <span className="material-symbols-outlined text-xl">remove_circle</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Activity Flow */}
        <div>
          <label className="block text-[14px] font-bold text-[#596061] mb-3">{t('people.form_activity_flow')}</label>
          <div className="space-y-4">
            {activities.map((act, i) => (
              <div key={i} className="p-4 bg-[#f8f9fa] rounded-2xl border border-[#e0e4e5] space-y-2">
                <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${act.status === 'live' ? 'bg-primary/10 text-primary' : act.status === 'upcoming' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {t('people.form_status_' + act.status)}
                </span>
                <input type="text" value={act.location} onChange={e => updateActivity(i, 'location', e.target.value)} placeholder={t('people.form_activity_location')}
                  className="w-full bg-white border border-[#e0e4e5] rounded-xl px-3 py-2 text-[16px] outline-none" />
                <input type="text" value={act.title} onChange={e => updateActivity(i, 'title', e.target.value)} placeholder={t('people.form_activity_title')}
                  className="w-full bg-white border border-[#e0e4e5] rounded-xl px-3 py-2 text-[16px] outline-none" />
                <textarea rows={2} value={act.description} onChange={e => updateActivity(i, 'description', e.target.value)} placeholder={t('people.form_activity_desc')}
                  className="w-full bg-white border border-[#e0e4e5] rounded-xl px-3 py-2 text-[16px] outline-none resize-none" />
                {(act.status === 'upcoming') && (
                  <input type="text" value={act.cta || ''} onChange={e => updateActivity(i, 'cta', e.target.value)} placeholder={t('people.form_activity_cta')}
                    className="w-full bg-white border border-[#e0e4e5] rounded-xl px-3 py-2 text-[16px] outline-none" />
                )}
              </div>
            ))}
          </div>
        </div>

      </div>
    </main>
  );
}

export default function PeopleRegisterPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <RegisterPageContent />
    </Suspense>
  );
}
