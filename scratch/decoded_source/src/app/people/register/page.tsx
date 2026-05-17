'use client';

import React, { useState, useRef, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { peopleService } from '@/lib/firebase/peopleService';
import { Person, PersonRole, ActivityEntry, TourStop } from '@/types/people';
import { storageService } from '@/lib/firebase/storageService';
import { useNavigation } from '@/components/providers/NavigationProvider';

const ROLE_OPTIONS: PersonRole[] = ['Instructor', 'Organizer', 'Couple', 'Touring', 'Dancer'];

function RegisterPageContent() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');
  const { setGlobalNavHidden } = useNavigation();

  useEffect(() => {
    setGlobalNavHidden(true);
    return () => setGlobalNavHidden(false);
  }, [setGlobalNavHidden]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { alert('Login required.'); return; }
    if (!name.trim() || roles.length === 0) {
      alert('Name and at least one role are required.');
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
        alert('Updated successfully.');
      } else {
        await peopleService.add(payload);
        alert('Registered successfully.');
      }
      router.back();
    } catch (err) {
      console.error(err);
      alert('An error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="max-w-md mx-auto min-h-screen pb-24 bg-white relative pt-16">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-slate-100 px-4 py-3 flex items-center justify-between max-w-md mx-auto">
        <button onClick={() => router.back()} className="w-10 h-10 -ml-2 rounded-full flex items-center justify-center text-[#2d3435] active:bg-slate-100">
          <span className="material-symbols-outlined text-xl">arrow_back</span>
        </button>
        <h1 className="text-base font-bold text-[#2d3435]">{editId ? 'Edit Profile' : 'Register Artist'}</h1>
        <div className="w-10" />
      </div>

      <form onSubmit={handleSubmit} className="px-5 mt-4 space-y-6">

        {/* Hero Image */}
        <div>
          <label className="block text-xs font-bold text-[#596061] mb-2 uppercase tracking-wider">Hero Photo</label>
          <div
            onClick={() => heroRef.current?.click()}
            className="w-full h-44 rounded-2xl overflow-hidden border-2 border-dashed border-[#acb3b4] bg-[#f8f9fa] flex items-center justify-center cursor-pointer relative"
          >
            {heroPreview
              ? <img src={heroPreview} alt="Hero" className="w-full h-full object-cover" />
              : <div className="flex flex-col items-center text-[#acb3b4]">
                  <span className="material-symbols-outlined text-4xl">add_photo_alternate</span>
                  <span className="text-xs mt-1">Tap to upload hero image</span>
                </div>
            }
          </div>
          <input ref={heroRef} type="file" accept="image/*" className="hidden" onChange={handleHeroChange} />
        </div>

        {/* Profile Photo */}
        <div>
          <label className="block text-xs font-bold text-[#596061] mb-2 uppercase tracking-wider">Profile Photo</label>
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
            <span className="text-sm text-[#596061]">Tap circle to upload</span>
          </div>
          <input ref={profileRef} type="file" accept="image/*" className="hidden" onChange={handleProfileChange} />
        </div>

        {/* Name */}
        <div>
          <label className="block text-xs font-bold text-[#596061] mb-1.5 uppercase tracking-wider">Full Name <span className="text-red-400">*</span></label>
          <input required type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Sofia Alvarez"
            className="w-full bg-[#f8f9fa] border border-[#e0e4e5] rounded-xl px-4 py-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" />
        </div>

        {/* Sub Title */}
        <div>
          <label className="block text-xs font-bold text-[#596061] mb-1.5 uppercase tracking-wider">Title / Specialty</label>
          <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g., Master Instructor • Global Performer"
            className="w-full bg-[#f8f9fa] border border-[#e0e4e5] rounded-xl px-4 py-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" />
        </div>

        {/* Roles */}
        <div>
          <label className="block text-xs font-bold text-[#596061] mb-2 uppercase tracking-wider">Roles <span className="text-red-400">*</span></label>
          <div className="flex flex-wrap gap-2">
            {ROLE_OPTIONS.map(r => (
              <button key={r} type="button" onClick={() => toggleRole(r)}
                className={`px-4 py-2 rounded-full text-sm font-semibold border transition-all ${roles.includes(r) ? 'bg-primary text-white border-primary' : 'bg-[#f8f9fa] text-[#596061] border-[#e0e4e5]'}`}>
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Partner (if Couple) */}
        {roles.includes('Couple') && (
          <div className="space-y-3 p-4 bg-[#f8f9fa] rounded-2xl border border-[#e0e4e5]">
            <p className="text-xs font-bold text-[#596061] uppercase tracking-wider">Partner Info</p>
            <input type="text" value={partnerName} onChange={e => setPartnerName(e.target.value)} placeholder="Partner's name"
              className="w-full bg-white border border-[#e0e4e5] rounded-xl px-4 py-3 text-sm outline-none" />
            <div className="flex gap-3">
              <input type="text" value={style} onChange={e => setStyle(e.target.value)} placeholder="Dance style (e.g., Tango de Pista)"
                className="flex-1 bg-white border border-[#e0e4e5] rounded-xl px-4 py-3 text-sm outline-none" />
              <input type="text" value={partnerSince} onChange={e => setPartnerSince(e.target.value)} placeholder="Since (e.g., 2011)"
                className="w-28 bg-white border border-[#e0e4e5] rounded-xl px-4 py-3 text-sm outline-none" />
            </div>
          </div>
        )}

        {/* Location */}
        <div>
          <label className="block text-xs font-bold text-[#596061] mb-1.5 uppercase tracking-wider">Base Location</label>
          <div className="flex gap-3">
            <input type="text" value={baseCity} onChange={e => setBaseCity(e.target.value)} placeholder="City"
              className="flex-1 bg-[#f8f9fa] border border-[#e0e4e5] rounded-xl px-4 py-3 text-sm outline-none" />
            <input type="text" value={baseCountry} onChange={e => setBaseCountry(e.target.value)} placeholder="Country"
              className="w-28 bg-[#f8f9fa] border border-[#e0e4e5] rounded-xl px-4 py-3 text-sm outline-none" />
          </div>
        </div>

        {/* Current Location */}
        <div>
          <label className="block text-xs font-bold text-[#596061] mb-1.5 uppercase tracking-wider">Currently In (optional)</label>
          <div className="flex gap-3 mb-2">
            <input type="text" value={currentCity} onChange={e => setCurrentCity(e.target.value)} placeholder="City"
              className="flex-1 bg-[#f8f9fa] border border-[#e0e4e5] rounded-xl px-4 py-3 text-sm outline-none" />
            <input type="text" value={currentCountry} onChange={e => setCurrentCountry(e.target.value)} placeholder="Country"
              className="w-28 bg-[#f8f9fa] border border-[#e0e4e5] rounded-xl px-4 py-3 text-sm outline-none" />
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setIsLiveNow(p => !p)}
              className={`w-11 h-6 rounded-full transition-all relative ${isLiveNow ? 'bg-primary' : 'bg-[#e0e4e5]'}`}>
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${isLiveNow ? 'left-6' : 'left-1'}`} />
            </button>
            <span className="text-sm text-[#596061]">Show live status badge</span>
          </div>
          {isLiveNow && (
            <input type="text" value={liveStatus} onChange={e => setLiveStatus(e.target.value)} placeholder="e.g., IN SEOUL THIS WEEK"
              className="mt-2 w-full bg-[#f8f9fa] border border-[#e0e4e5] rounded-xl px-4 py-3 text-sm outline-none" />
          )}
        </div>

        {/* Bio */}
        <div>
          <label className="block text-xs font-bold text-[#596061] mb-1.5 uppercase tracking-wider">Bio</label>
          <textarea rows={4} value={bio} onChange={e => setBio(e.target.value)} placeholder="Artist's story and background..."
            className="w-full bg-[#f8f9fa] border border-[#e0e4e5] rounded-xl px-4 py-3 text-sm outline-none resize-none" />
        </div>

        {/* Languages */}
        <div>
          <label className="block text-xs font-bold text-[#596061] mb-1.5 uppercase tracking-wider">Languages (comma separated)</label>
          <input type="text" value={languages} onChange={e => setLanguages(e.target.value)} placeholder="English, Spanish, Italian"
            className="w-full bg-[#f8f9fa] border border-[#e0e4e5] rounded-xl px-4 py-3 text-sm outline-none" />
        </div>

        {/* Booking Note */}
        <div>
          <label className="block text-xs font-bold text-[#596061] mb-1.5 uppercase tracking-wider">Booking Availability Note</label>
          <input type="text" value={bookingNote} onChange={e => setBookingNote(e.target.value)} placeholder="Open for: Festival Invitations, Workshops..."
            className="w-full bg-[#f8f9fa] border border-[#e0e4e5] rounded-xl px-4 py-3 text-sm outline-none" />
        </div>

        {/* Tour Stops */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-xs font-bold text-[#596061] uppercase tracking-wider">Tour Schedule</label>
            <button type="button" onClick={addTourStop} className="text-primary text-sm font-semibold">+ Add</button>
          </div>
          <div className="space-y-2">
            {tourStops.map((stop, i) => (
              <div key={i} className="flex gap-2 items-center">
                <input type="text" value={stop.city} onChange={e => updateTour(i, 'city', e.target.value)} placeholder="City"
                  className="flex-1 bg-[#f8f9fa] border border-[#e0e4e5] rounded-xl px-3 py-2.5 text-sm outline-none" />
                <input type="text" value={stop.country} onChange={e => updateTour(i, 'country', e.target.value)} placeholder="Country"
                  className="w-24 bg-[#f8f9fa] border border-[#e0e4e5] rounded-xl px-3 py-2.5 text-sm outline-none" />
                <input type="text" value={stop.month} onChange={e => updateTour(i, 'month', e.target.value)} placeholder="Month"
                  className="w-20 bg-[#f8f9fa] border border-[#e0e4e5] rounded-xl px-3 py-2.5 text-sm outline-none" />
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
          <label className="block text-xs font-bold text-[#596061] mb-3 uppercase tracking-wider">Activity Flow</label>
          <div className="space-y-4">
            {activities.map((act, i) => (
              <div key={i} className="p-4 bg-[#f8f9fa] rounded-2xl border border-[#e0e4e5] space-y-2">
                <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${act.status === 'live' ? 'bg-primary/10 text-primary' : act.status === 'upcoming' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {act.label}
                </span>
                <input type="text" value={act.location} onChange={e => updateActivity(i, 'location', e.target.value)} placeholder="Location"
                  className="w-full bg-white border border-[#e0e4e5] rounded-xl px-3 py-2 text-sm outline-none" />
                <input type="text" value={act.title} onChange={e => updateActivity(i, 'title', e.target.value)} placeholder="Event title"
                  className="w-full bg-white border border-[#e0e4e5] rounded-xl px-3 py-2 text-sm outline-none" />
                <textarea rows={2} value={act.description} onChange={e => updateActivity(i, 'description', e.target.value)} placeholder="Description..."
                  className="w-full bg-white border border-[#e0e4e5] rounded-xl px-3 py-2 text-sm outline-none resize-none" />
                {(act.status === 'upcoming') && (
                  <input type="text" value={act.cta || ''} onChange={e => updateActivity(i, 'cta', e.target.value)} placeholder="CTA button text (optional)"
                    className="w-full bg-white border border-[#e0e4e5] rounded-xl px-3 py-2 text-sm outline-none" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Submit */}
        <div className="pt-4 pb-10">
          <button type="submit" disabled={isSubmitting}
            className="w-full bg-primary text-white font-bold py-3.5 rounded-xl shadow-lg shadow-primary/20 active:scale-[0.98] transition-transform disabled:opacity-50">
            {isSubmitting ? 'Processing...' : editId ? 'Update Profile' : 'Register Artist'}
          </button>
        </div>
      </form>
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
