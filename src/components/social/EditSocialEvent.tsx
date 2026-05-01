'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { useLocation } from '@/components/providers/LocationProvider';
import { socialService } from '@/lib/firebase/socialService';
import { venueService } from '@/lib/firebase/venueService';
import { userService } from '@/lib/firebase/userService';
import { storageService } from '@/lib/firebase/storageService';
import { Social, SocialType } from '@/types/social';
import { Venue } from '@/types/venue';
import { PlatformUser } from '@/types/user';

interface EditSocialEventProps {
  onClose: () => void;
  onSuccess?: () => void;
  socialData?: Social;
}

export default function EditSocialEvent({ onClose, onSuccess, socialData }: EditSocialEventProps) {
  const { user } = useAuth();
  const { location, openSelectorWithCallback } = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [title, setTitle] = useState(socialData?.title || '');
  const [titleNative, setTitleNative] = useState(socialData?.titleNative || '');
  const [titleError, setTitleError] = useState('');
  const [type, setType] = useState<SocialType>(socialData?.type || 'regular');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState(socialData?.startTime || '19:00');
  const [endTime, setEndTime] = useState(socialData?.endTime || '23:00');
  const [dayOfWeek, setDayOfWeek] = useState<number>(socialData?.dayOfWeek ?? 5);
  const [recurrence, setRecurrence] = useState(socialData?.recurrence || 'every');

  // Location State (초기값: 헤더의 전역 location)
  const [formCountry, setFormCountry] = useState(socialData?.country || location.country);
  const [formCity, setFormCity] = useState(socialData?.city || location.city);

  // Venue State (클라이언트 필터링 방식)
  const [allVenues, setAllVenues] = useState<Venue[]>([]);
  const [venueName, setVenueName] = useState(socialData?.venueName || '');
  const [venueId, setVenueId] = useState(socialData?.venueId || '');
  const [venueResults, setVenueResults] = useState<Venue[]>([]);
  const [showVenueResults, setShowVenueResults] = useState(false);

  // DJ State (클라이언트 필터링)
  const [allUsers, setAllUsers] = useState<PlatformUser[]>([]);
  const [djName, setDjName] = useState(socialData?.djName || '');
  const [djResults, setDjResults] = useState<PlatformUser[]>([]);
  const [showDjResults, setShowDjResults] = useState(false);

  // Other Fields
  const [dressCode, setDressCode] = useState('');
  
  // Pricing
  const initialCurrency = socialData?.price?.split(' ')[0] || 'KRW';
  const initialPriceAmount = socialData?.price?.split(' ')[1] || '0';
  const [currency, setCurrency] = useState(initialCurrency);
  const [priceAmount, setPriceAmount] = useState(initialPriceAmount);

  // Gallery
  const [images, setImages] = useState<string[]>(socialData?.imageUrl ? [socialData.imageUrl] : []);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Social Events (Sub-programs)
  const [socialEvents, setSocialEvents] = useState<{ id: number; title: string }[]>(
    socialData?.socialEvents?.map((title, i) => ({ id: Date.now() + i, title })) || []
  );

  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const dayIndices = [1, 2, 3, 4, 5, 6, 0];

  // 마운트 시 전체 Venue & User 1회 로드
  useEffect(() => {
    venueService.getVenues().then(setAllVenues).catch(console.error);
    userService.getAllUsers().then(setAllUsers).catch(console.error);
  }, []);

  // 클라이언트 필터링 - 1글자부터 반응
  const handleVenueSearch = (val: string) => {
    setVenueName(val);
    setVenueId(''); // 검색 중에는 venueId 초기화
    if (val.length >= 1) {
      const lower = val.toLowerCase();
      const filtered = allVenues.filter(v =>
        v.name?.toLowerCase().includes(lower) ||
        v.nameKo?.includes(val)
      );
      setVenueResults(filtered.slice(0, 6));
      setShowVenueResults(filtered.length > 0);
    } else {
      setShowVenueResults(false);
      setVenueResults([]);
    }
  };

  const handleSelectVenue = (v: Venue) => {
    setVenueName(v.name);
    setVenueId(v.id || '');
    setShowVenueResults(false);
    // Venue 선택 시 해당 Venue의 country/city로 자동 업데이트
    if (v.country) setFormCountry(v.country);
    if (v.city) setFormCity(v.city);
  };

  const handleDjSearch = (val: string) => {
    setDjName(val);
    if (val.length >= 1) {
      const lower = val.toLowerCase();
      const filtered = allUsers.filter(u =>
        u.nickname?.toLowerCase().includes(lower) ||
        u.nativeNickname?.includes(val)
      );
      setDjResults(filtered.slice(0, 6));
      setShowDjResults(filtered.length > 0);
    } else {
      setShowDjResults(false);
      setDjResults([]);
    }
  };

  const handleSelectDj = (u: PlatformUser) => {
    setDjName(u.nickname);
    setShowDjResults(false);
  };

  const handleOpenLocationSelector = () => {
    openSelectorWithCallback((country, city) => {
      setFormCountry(country);
      setFormCity(city);
    });
  };

  const handleTitleChange = (val: string) => {
    const isEnglishOnly = /^[a-zA-Z0-9\s\-_'"()&.,!?]*$/.test(val);
    if (!isEnglishOnly && val !== '') {
      setTitleError('English only');
    } else {
      setTitleError('');
      setTitle(val);
    }
  };

  const handleAddSocialEvent = () => setSocialEvents([...socialEvents, { id: Date.now(), title: '' }]);
  const handleRemoveSocialEvent = (id: number) => setSocialEvents(socialEvents.filter(e => e.id !== id));
  const handleSocialEventTitleChange = (id: number, val: string) =>
    setSocialEvents(socialEvents.map(e => e.id === id ? { ...e, title: val } : e));

  const handleSave = async () => {
    if (!user || !title) return alert('Please enter an event title');
    setIsSubmitting(true);
    try {
      let finalImageUrl = images[0] || '';
      if (imageFile) {
        const path = `socials/${Date.now()}_${imageFile.name}`;
        finalImageUrl = await storageService.uploadFile(imageFile, path);
      }

      const finalData: any = {
        title: title || '',
        titleNative: titleNative || '',
        type: type || 'regular',
        organizerId: user.uid,
        organizerName: user.displayName || 'Anonymous',
        venueId: venueId || '',
        venueName: venueName || '',
        country: formCountry || '',
        city: formCity || '',
        imageUrl: finalImageUrl || '',
        startTime: startTime || '',
        endTime: endTime || '',
        djName: djName || '',
        price: `${currency} ${priceAmount}`,
        socialEvents: socialEvents.map(e => e.title).filter(t => t.trim() !== ''),
      };

      if (type === 'regular') {
        finalData.dayOfWeek = dayOfWeek;
        finalData.recurrence = recurrence;
      } else {
        finalData.dayOfWeek = null;
        finalData.recurrence = null;
      }

      if (socialData?.id) {
        await socialService.updateSocial(socialData.id, finalData);
      } else {
        await socialService.saveSocial(finalData);
      }
      onSuccess?.();
      onClose();
    } catch (e) {
      console.error(e);
      alert('An error occurred while saving');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!socialData?.id) return;
    if (!confirm('Are you sure you want to delete this event?')) return;
    try {
      await socialService.deleteSocial(socialData.id);
      onSuccess?.();
      onClose();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-[#f9f9f9] overflow-y-auto animate-in fade-in duration-300">
      <style dangerouslySetInnerHTML={{ __html: `.material-symbols-outlined { font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24; }` }} />

      {/* TopAppBar */}
      <header className="fixed top-0 left-0 w-full z-[210] flex justify-between items-center px-4 h-16 bg-white/85 backdrop-blur-md shadow-[0px_12px_32px_rgba(22,29,30,0.06)]">
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="hover:bg-[#EEF5F6] p-2 transition-colors active:opacity-70 rounded">
            <span className="material-symbols-outlined text-[#005BC0]">close</span>
          </button>
        </div>
        <h1 className="text-xl font-bold font-manrope text-[#2D3435]">{socialData ? 'Edit Social' : 'Create Social'}</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSave}
            disabled={isSubmitting}
            className="flex items-center gap-2 px-3 py-2 hover:bg-[#EEF5F6] transition-colors active:scale-95 rounded text-[#005BC0]"
          >
            <span className="material-symbols-outlined">{isSubmitting ? 'sync' : 'save'}</span>
            <span className="text-sm font-medium">Save</span>
          </button>
          {socialData && (
            <button onClick={handleDelete} className="p-2 hover:bg-[#EEF5F6] transition-colors active:opacity-70 rounded">
              <span className="material-symbols-outlined text-[#ba1a1a]">delete</span>
            </button>
          )}
        </div>
        <div className="absolute bottom-0 left-0 w-full bg-[#EEF5F6] h-[1px]"></div>
      </header>

      <main className="pt-24 pb-20 max-w-3xl mx-auto px-6">

        {/* 1. Event Title */}
        <section className="mb-12 text-left space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#2D3435]/60 mb-3 font-inter">
              Event Title <span className="text-[#005BC0] font-black">EN</span>
            </label>
            <input
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              className={`w-full bg-[#dde4e5] border-none focus:bg-white focus:ring-2 p-4 text-lg font-semibold rounded text-[#2D3435] placeholder:text-[#2D3435]/30 transition-all outline-none ${titleError ? 'ring-2 ring-[#ba1a1a]/40 bg-[#fff8f7]' : 'focus:ring-[#005BC0]/40'}`}
              placeholder="Enter social name in English..."
              type="text"
            />
            {titleError && <p className="text-[11px] text-[#ba1a1a] font-bold mt-1.5 ml-1">{titleError}</p>}
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#2D3435]/60 mb-3 font-inter">
              Event Title <span className="text-[#2D3435]/40 font-black">Native</span>
            </label>
            <input
              value={titleNative}
              onChange={(e) => setTitleNative(e.target.value)}
              className="w-full bg-[#dde4e5] border-none focus:bg-white focus:ring-2 focus:ring-[#005BC0]/40 p-4 text-lg font-semibold rounded text-[#2D3435] placeholder:text-[#2D3435]/30 transition-all outline-none"
              placeholder="Native title (e.g. 밀롱가 엘 불린)"
              type="text"
            />
          </div>
        </section>

        {/* 2. Gallery */}
        <section className="mb-12 text-left">
          <div className="flex justify-between items-end mb-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#2D3435]/60 mb-1 font-inter">Gallery</label>
              <p className="text-xs text-[#2D3435]/40 font-medium">Up to 20 photos. First image is the Primary Poster.</p>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-3">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="col-span-2 row-span-2 relative group aspect-square rounded overflow-hidden bg-white border-2 border-dashed border-[#005BC0]/20 flex flex-col items-center justify-center cursor-pointer hover:border-[#005BC0]/50 transition-all"
            >
              {images[0] ? (
                <>
                  <img className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" src={images[0]} alt="poster" />
                  <div className="absolute top-3 left-3 bg-[#005BC0] text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm z-10">PRIMARY POSTER</div>
                </>
              ) : (
                <div className="flex flex-col items-center text-[#2D3435]/20">
                  <span className="material-symbols-outlined text-4xl mb-1">add_a_photo</span>
                  <span className="text-[10px] font-bold">Add Cover</span>
                </div>
              )}
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white drop-shadow-md z-20">
                <span className="material-symbols-outlined text-3xl mb-1">add_a_photo</span>
                <span className="text-xs font-bold">{images[0] ? 'Replace Cover' : 'Add Cover'}</span>
              </div>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) {
                setImages([URL.createObjectURL(f)]);
                setImageFile(f);
              }
            }} />
            {[...Array(4)].map((_, i) => (
              <div key={i} className="aspect-square bg-[#EEF5F6] rounded flex items-center justify-center cursor-pointer border-2 border-transparent hover:border-[#005BC0]/30 transition-all">
                <span className="material-symbols-outlined text-[#2D3435]/20">add</span>
              </div>
            ))}
          </div>
        </section>

        {/* 3. Event Type */}
        <section className="mb-12 text-left">
          <label className="block text-xs font-bold uppercase tracking-wider text-[#2D3435]/60 mb-4 font-inter">Event Type</label>
          <div className="flex gap-2">
            <button
              onClick={() => setType('regular')}
              className={`flex-1 py-4 rounded font-bold text-sm flex items-center justify-center gap-2 transition-all ${type === 'regular' ? 'bg-[#004493] text-white shadow-md' : 'bg-[#e2e9ea] text-[#2D3435]/60 hover:bg-[#dde4e5]'}`}
            >
              <span className="material-symbols-outlined" style={{ fontVariationSettings: type === 'regular' ? "'FILL' 1" : "'FILL' 0" }}>calendar_today</span>
              Regular
            </button>
            <button
              onClick={() => setType('popup')}
              className={`flex-1 py-4 rounded font-bold text-sm flex items-center justify-center gap-2 transition-all ${type === 'popup' ? 'bg-[#004493] text-white shadow-md' : 'bg-[#e2e9ea] text-[#2D3435]/60 hover:bg-[#dde4e5]'}`}
            >
              <span className="material-symbols-outlined" style={{ fontVariationSettings: type === 'popup' ? "'FILL' 1" : "'FILL' 0" }}>bolt</span>
              Popup
            </button>
          </div>
        </section>

        {/* 4. Date & Time */}
        <section className="mb-12 p-6 bg-[#EEF5F6] rounded text-left">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#2D3435]/60 mb-3 font-inter">Start Date</label>
              <input
                value={startDate}
                onChange={(e) => {
                  const val = e.target.value;
                  setStartDate(val);
                  if (val) {
                    const d = new Date(val);
                    if (!isNaN(d.getTime())) {
                      setDayOfWeek(d.getDay());
                    }
                  }
                }}
                className="w-full bg-white border-none p-3 rounded font-semibold text-[#2D3435] focus:ring-2 focus:ring-[#005BC0]/40 outline-none"
                type="date"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#2D3435]/60 mb-3 font-inter">Time Interval</label>
              <div className="flex items-center gap-3">
                <input value={startTime} onChange={(e) => setStartTime(e.target.value)} className="flex-1 bg-white border-none p-3 rounded font-semibold text-[#2D3435] focus:ring-2 focus:ring-[#005BC0]/40 outline-none" type="time" />
                <span className="text-[#2D3435]/30">to</span>
                <input value={endTime} onChange={(e) => setEndTime(e.target.value)} className="flex-1 bg-white border-none p-3 rounded font-semibold text-[#2D3435] focus:ring-2 focus:ring-[#005BC0]/40 outline-none" type="time" />
              </div>
            </div>
            <div className={`col-span-full transition-opacity ${type === 'regular' ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#2D3435]/60 mb-3 font-inter">Recurring Day</label>
              <div className="flex justify-between gap-1 mb-6">
                {days.map((day, idx) => {
                  const isActive = dayOfWeek === dayIndices[idx];
                  return (
                    <button key={idx} onClick={() => setDayOfWeek(dayIndices[idx])}
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold transition-all ${isActive ? 'bg-[#004493] text-white shadow-lg' : 'bg-white text-[#2D3435]/40 hover:bg-[#005BC0]/10'}`}>
                      {day}
                    </button>
                  );
                })}
              </div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#2D3435]/60 mb-3 font-inter">Recurrence Frequency</label>
              <div className="flex flex-wrap gap-2">
                {[{ id: 'every', label: 'Every Week' }, { id: '1st', label: '1st' }, { id: '2nd', label: '2nd' }, { id: '3rd', label: '3rd' }, { id: '4th', label: '4th' }, { id: 'last', label: 'Last' }].map(r => (
                  <button key={r.id} onClick={() => setRecurrence(r.id)}
                    className={`px-4 py-2 rounded-full text-xs font-bold transition-all border ${recurrence === r.id ? 'bg-[#005BC0] text-white border-[#005BC0] shadow-sm' : 'bg-white text-[#2D3435]/60 border-gray-200 hover:border-[#005BC0]/30'}`}>
                    {r.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 5. Venue & DJ */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12 text-left">
          <div className="relative">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#2D3435]/60 mb-3 font-inter">Venue Selection</label>
            <div className="relative group">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#2D3435]/40">location_on</span>
              <input
                value={venueName}
                onChange={(e) => handleVenueSearch(e.target.value)}
                onFocus={() => venueName.length >= 1 && setShowVenueResults(venueResults.length > 0)}
                onBlur={() => setTimeout(() => setShowVenueResults(false), 200)}
                className="w-full pl-12 pr-4 py-4 bg-white border-none rounded shadow-sm focus:ring-2 focus:ring-[#005BC0]/40 font-medium outline-none"
                placeholder="Search venues..."
                type="text"
              />
            </div>
            {showVenueResults && (
              <div className="absolute top-full left-0 w-full bg-white border border-gray-100 rounded-b shadow-xl z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                {venueResults.map(v => (
                  <button
                    key={v.id}
                    onClick={() => handleSelectVenue(v)}
                    className="w-full text-left px-4 py-3 hover:bg-[#EEF5F6] flex items-center justify-between group transition-colors border-b border-gray-50 last:border-b-0"
                  >
                    <div className="flex items-baseline gap-2">
                      <p className="font-bold text-[#2D3435] group-hover:text-[#005BC0] transition-colors">{v.name}</p>
                      {v.nameKo && <span className="text-[11px] text-gray-400 font-medium">{v.nameKo}</span>}
                    </div>
                    <span className="text-[10px] text-gray-300 font-bold">{v.city}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="relative">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#2D3435]/60 mb-3 font-inter">DJ Selection</label>
            <div className="relative group">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#2D3435]/40">person</span>
              <input
                value={djName}
                onChange={(e) => handleDjSearch(e.target.value)}
                onFocus={() => djName.length >= 1 && setShowDjResults(djResults.length > 0)}
                onBlur={() => setTimeout(() => setShowDjResults(false), 200)}
                className="w-full pl-12 pr-4 py-4 bg-white border-none rounded shadow-sm focus:ring-2 focus:ring-[#005BC0]/40 font-medium outline-none"
                placeholder="Search artists..."
                type="text"
              />
            </div>
            {showDjResults && (
              <div className="absolute top-full left-0 w-full bg-white border border-gray-100 rounded-b shadow-xl z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                {djResults.map(u => (
                  <button
                    key={u.id}
                    onClick={() => handleSelectDj(u)}
                    className="w-full text-left px-4 py-3 hover:bg-[#EEF5F6] flex items-center justify-between group transition-colors border-b border-gray-50 last:border-b-0"
                  >
                    <div className="flex items-baseline gap-2">
                      <p className="font-bold text-[#2D3435] group-hover:text-[#005BC0] transition-colors">{u.nickname}</p>
                      {u.nativeNickname && <span className="text-[11px] text-gray-400 font-medium">{u.nativeNickname}</span>}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* 6. Location (City/Country) */}
        <section className="mb-12 text-left">
          <label className="block text-xs font-bold uppercase tracking-wider text-[#2D3435]/60 mb-3 font-inter">Location</label>
          <button 
            onClick={handleOpenLocationSelector}
            className="w-full flex items-center justify-between bg-white rounded shadow-sm px-4 py-4 hover:bg-[#EEF5F6] active:scale-[0.99] transition-all text-left"
          >
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[#005BC0]">public</span>
              <div>
                <p className="font-bold text-[#2D3435] text-sm">{formCountry}</p>
                <p className="text-xs text-[#2D3435]/50 font-medium">{formCity}</p>
              </div>
            </div>
            <span className="material-symbols-outlined text-[#2D3435]/40">chevron_right</span>
          </button>
          <p className="text-[10px] text-[#2D3435]/40 mt-2 ml-1">
            * Selecting a venue will auto-update the location
          </p>
        </section>

        {/* 7. Dress Code */}
        <section className="mb-12 text-left">
          <label className="block text-xs font-bold uppercase tracking-wider text-[#2D3435]/60 mb-3 font-inter">Dress Code</label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#2D3435]/40">checkroom</span>
            <input value={dressCode} onChange={(e) => setDressCode(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-white border-none rounded shadow-sm focus:ring-2 focus:ring-[#005BC0]/40 font-medium outline-none"
              placeholder="e.g. Cocktail Attire, All White..." type="text" />
          </div>
        </section>

        {/* 8. Pricing */}
        <section className="mb-12 text-left">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 block">Entry Pricing</label>
            <div className="flex items-center gap-2">
              <select 
                value={currency} 
                onChange={(e) => setCurrency(e.target.value)}
                className="bg-[#dde4e5] border-none rounded-2xl px-4 py-4 text-sm font-bold focus:ring-2 focus:ring-[#005BC0]/40 outline-none w-28 appearance-none"
              >
                <option value="KRW">KRW</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="JPY">JPY</option>
              </select>
              <input 
                value={priceAmount} 
                onChange={(e) => setPriceAmount(e.target.value)}
                placeholder="0"
                type="number"
                className="flex-1 bg-[#dde4e5] border-none rounded-2xl px-4 py-4 text-sm font-bold focus:ring-2 focus:ring-[#005BC0]/40 outline-none" 
              />
            </div>
          </div>
        </section>

        {/* 9. Social Events Schedule */}
        <section className="mb-20 text-left">
          <div className="flex items-center justify-between mb-6">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#2D3435]/60 font-inter">Social Events Schedule</label>
            <button onClick={handleAddSocialEvent} className="text-xs font-bold text-[#005BC0] flex items-center gap-1 hover:underline active:opacity-70">
              <span className="material-symbols-outlined text-sm">add_circle</span>
              ADD SOCIAL EVENT
            </button>
          </div>
          <div className="space-y-3">
            {socialEvents.map(event => (
              <div key={event.id} className="flex items-center gap-4 bg-white p-4 rounded shadow-sm group animate-in slide-in-from-right-4 duration-300">
                <div className="flex-1">
                  <input value={event.title} onChange={(e) => handleSocialEventTitleChange(event.id, e.target.value)}
                    className="w-full bg-transparent border-none p-0 focus:ring-0 font-bold text-[#2D3435] outline-none"
                    type="text" placeholder="Enter social event title..." />
                  <p className="text-[10px] text-[#2D3435]/40 font-bold uppercase mt-1">Social Event Name</p>
                </div>
                <button onClick={() => handleRemoveSocialEvent(event.id)} className="p-2 opacity-0 group-hover:opacity-100 text-[#ba1a1a] transition-opacity">
                  <span className="material-symbols-outlined">remove_circle</span>
                </button>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
