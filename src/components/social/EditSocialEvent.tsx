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
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigation } from "@/components/providers/NavigationProvider";

interface EditSocialEventProps {
  onClose: () => void;
  onSuccess?: () => void;
  socialData?: Social;
}

export default function EditSocialEvent({ onClose, onSuccess, socialData }: EditSocialEventProps) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { setGlobalNavHidden } = useNavigation();
  const { location, openSelectorWithCallback } = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Hide global navigation on mount, restore on unmount
  useEffect(() => {
    setGlobalNavHidden(true);
    return () => setGlobalNavHidden(false);
  }, [setGlobalNavHidden]);

  // Form State
  const [title, setTitle] = useState(socialData?.title || '');
  const [titleNative, setTitleNative] = useState(socialData?.titleNative || '');
  const [description, setDescription] = useState((socialData as any)?.description || '');
  const [titleError, setTitleError] = useState('');
  const [type, setType] = useState<SocialType>(socialData?.type || 'regular');
  
  // Date & Time
  const [startDate, setStartDate] = useState(
    socialData?.date 
      ? (typeof (socialData.date as any).toDate === 'function' ? (socialData.date as any).toDate().toISOString().split('T')[0] : new Date(socialData.date as any).toISOString().split('T')[0])
      : new Date().toISOString().split('T')[0]
  );
  const [startTime, setStartTime] = useState(socialData?.startTime || '19:00');
  const [endTime, setEndTime] = useState(socialData?.endTime || '23:00');
  const [dayOfWeek, setDayOfWeek] = useState<number>(socialData?.dayOfWeek ?? new Date().getDay());
  const [recurrence, setRecurrence] = useState(socialData?.recurrence || 'every');

  const getAvailableRecurrences = (dateStr: string) => {
    const d = dateStr ? new Date(dateStr) : new Date();
    if (isNaN(d.getTime())) return [{ id: 'every', label: t('social.every_week') }];
    
    const dateNum = d.getDate();
    const nth = Math.ceil(dateNum / 7);
    const nthStr = nth === 1 ? '1st' : nth === 2 ? '2nd' : nth === 3 ? '3rd' : nth === 4 ? '4th' : '5th';
    
    const options = [
      { id: 'every', label: t('social.every_week') },
      { id: nthStr, label: t('social.nth_week', { nth: nthStr }) }
    ];
    
    const nextWeek = new Date(d);
    nextWeek.setDate(d.getDate() + 7);
    if (nextWeek.getMonth() !== d.getMonth() && nthStr !== '5th') {
      options.push({ id: 'last', label: t('social.last_week') });
    }
    
    return options;
  };

  // Location State
  const [formCountry, setFormCountry] = useState(socialData?.country || location.country);
  const [formCity, setFormCity] = useState(socialData?.city || location.city);

  // Venue State
  const [allVenues, setAllVenues] = useState<Venue[]>([]);
  const [venueName, setVenueName] = useState(socialData?.venueName || '');
  const [venueId, setVenueId] = useState(socialData?.venueId || '');
  const [venueResults, setVenueResults] = useState<Venue[]>([]);
  const [showVenueResults, setShowVenueResults] = useState(false);

  // Users Data
  const [allUsers, setAllUsers] = useState<PlatformUser[]>([]);

  // Organizer State
  const [organizerId, setOrganizerId] = useState(socialData?.organizerId || user?.uid || '');
  const [organizerName, setOrganizerName] = useState(socialData?.organizerName || user?.displayName || t('social.anonymous'));
  const [organizerResults, setOrganizerResults] = useState<PlatformUser[]>([]);
  const [showOrganizerResults, setShowOrganizerResults] = useState(false);

  // DJ State
  const getInitialDjName = () => {
    if (!socialData) return '';
    if (socialData.type === 'regular' && socialData.djs && Array.isArray(socialData.djs) && socialData.djs.length > 0) {
      const today = new Date();
      const targetDay = Number(socialData.dayOfWeek ?? today.getDay());
      const d = new Date();
      const diff = (targetDay - d.getDay() + 7) % 7;
      d.setDate(d.getDate() + diff);
      const pad = (n: number) => n.toString().padStart(2, '0');
      const targetDateStr = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
      
      const matched = socialData.djs.find(dj => dj && dj.date === targetDateStr);
      if (matched && matched.djName) {
        return matched.djName;
      }
    }
    return socialData.djName || '';
  };

  const [djName, setDjName] = useState(getInitialDjName());
  const [djResults, setDjResults] = useState<PlatformUser[]>([]);
  const [showDjResults, setShowDjResults] = useState(false);

  // Staff State
  const [staffList, setStaffList] = useState<{ id: string; name: string }[]>(
    socialData?.staffIds?.map((id, i) => ({ id, name: socialData?.staffNames?.[i] || '' })) || []
  );
  const [staffSearch, setStaffSearch] = useState('');
  const [staffResults, setStaffResults] = useState<PlatformUser[]>([]);
  const [showStaffResults, setShowStaffResults] = useState(false);

  // Table Capacity & Dress Code
  const [tableCapacity, setTableCapacity] = useState(socialData?.tableCapacity ?? 15);
  const [dressCode, setDressCode] = useState((socialData as any)?.dressCode || '');
  
  // Pricing
  const initialCurrency = socialData?.price?.split(' ')[0] || 'KRW';
  const initialPriceAmount = socialData?.price?.split(' ')[1] || '0';
  const [currency, setCurrency] = useState(initialCurrency);
  const [priceAmount, setPriceAmount] = useState(initialPriceAmount);

  // Gallery
  const [images, setImages] = useState<string[]>(socialData?.imageUrl ? [socialData.imageUrl] : []);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Moments Gallery
  const [moments, setMoments] = useState<string[]>(socialData?.moments || []);
  const [momentFiles, setMomentFiles] = useState<(File | null)[]>(new Array(socialData?.moments?.length || 0).fill(null));
  const momentInputRef = useRef<HTMLInputElement>(null);

  // Social Events (Sub-programs)
  const [socialEvents, setSocialEvents] = useState<{ id: number; title: string; description: string; maxParticipants: number; isUnlimited?: boolean }[]>(
    socialData?.socialEvents?.map((ev: any, i: number) => {
      const isUnlimited = ev.maxParticipants === 0 || ev.maxParticipants === undefined;
      if (typeof ev === 'string') return { id: Date.now() + i, title: ev, description: '', maxParticipants: 0, isUnlimited: true };
      return { id: Date.now() + i, title: ev.title || '', description: ev.description || '', maxParticipants: ev.maxParticipants || 1, isUnlimited };
    }) || []
  );

  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const dayIndices = [1, 2, 3, 4, 5, 6, 0];

  useEffect(() => {
    venueService.getVenues().then(setAllVenues).catch(console.error);
    userService.getAllUsers().then(setAllUsers).catch(console.error);
  }, []);

  useEffect(() => {
    if (type === 'regular' && startDate) {
      const options = getAvailableRecurrences(startDate);
      if (!options.find(o => o.id === recurrence)) {
        setRecurrence('every');
      }
    }
  }, [startDate, type]);

  const handleStartTimeChange = (val: string) => {
    setStartTime(val);
    if (val) {
      const [h, m] = val.split(':');
      const endH = (parseInt(h, 10) + 4) % 24;
      setEndTime(`${endH.toString().padStart(2, '0')}:${m}`);
    }
  };

  const handleVenueSearch = (val: string) => {
    setVenueName(val);
    setVenueId('');
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
    if (v.country) setFormCountry(v.country);
    if (v.city) setFormCity(v.city);
  };

  const handleOrganizerSearch = (val: string) => {
    setOrganizerName(val);
    if (val.length >= 1) {
      const lower = val.toLowerCase();
      const filtered = allUsers.filter(u =>
        (u.nickname && u.nickname.toLowerCase().includes(lower)) ||
        (u.nativeNickname && u.nativeNickname.includes(val))
      );
      setOrganizerResults(filtered.slice(0, 6));
      setShowOrganizerResults(filtered.length > 0);
    } else {
      setShowOrganizerResults(false);
      setOrganizerResults([]);
    }
  };

  const handleSelectOrganizer = (u: PlatformUser) => {
    setOrganizerName(u.nickname || t('social.anonymous'));
    setOrganizerId(u.id);
    setShowOrganizerResults(false);
  };

  const handleDjSearch = (val: string) => {
    setDjName(val);
    if (val.length >= 1) {
      const lower = val.toLowerCase();
      const filtered = allUsers.filter(u =>
        (u.nickname && u.nickname.toLowerCase().includes(lower)) ||
        (u.nativeNickname && u.nativeNickname.includes(val))
      );
      setDjResults(filtered.slice(0, 6));
      setShowDjResults(filtered.length > 0);
    } else {
      setShowDjResults(false);
      setDjResults([]);
    }
  };

  const handleSelectDj = (u: PlatformUser) => {
    setDjName(u.nickname || '');
    setShowDjResults(false);
  };

  const handleTitleChange = (val: string) => {
    const isEnglishOnly = /^[a-zA-Z0-9\s\-_'"()&.,!?]*$/.test(val);
    if (!isEnglishOnly && val !== '') {
      setTitleError(t('social.alert_english_only'));
    } else {
      setTitleError('');
      setTitle(val);
    }
  };

  const handleSave = async () => {
    if (!user || !title) return alert(t('social.alert_title_required'));
    setIsSubmitting(true);
    try {
      let finalImageUrl = images[0] || '';
      if (imageFile) {
        const path = `socials/${Date.now()}_${imageFile.name}`;
        finalImageUrl = await storageService.uploadFile(imageFile, path);
      }

      // Handle Moments Upload
      const finalMoments: string[] = [];
      for (let i = 0; i < moments.length; i++) {
        if (momentFiles[i]) {
          const path = `socials/moments/${Date.now()}_${i}_${momentFiles[i]!.name}`;
          const url = await storageService.uploadFile(momentFiles[i]!, path);
          finalMoments.push(url);
        } else if (moments[i].startsWith('http')) {
          finalMoments.push(moments[i]);
        }
      }

      const finalData: any = {
        title: title || '',
        titleNative: titleNative || '',
        description: description || '',
        type: type || 'regular',
        organizerId: organizerId,
        organizerName: organizerName,
        organizerNameNative: '', // Can be populated if needed
        venueId: venueId || '',
        venueName: venueName || '',
        country: formCountry || '',
        city: formCity || '',
        imageUrl: finalImageUrl || '',
        moments: finalMoments,
        startTime: startTime || '',
        endTime: endTime || '',
        djName: djName || '',
        dressCode: dressCode || '',
        price: `${currency} ${priceAmount}`,
        socialEvents: socialEvents.filter(e => e.title.trim() !== '').map(e => ({ id: String(e.id), title: e.title, description: e.description, maxParticipants: e.isUnlimited ? 0 : e.maxParticipants })),
        staffIds: staffList.map(s => s.id),
        staffNames: staffList.map(s => s.name),
        tableCapacity: tableCapacity || 0,
      };

      if (type === 'regular') {
        finalData.dayOfWeek = dayOfWeek;
        finalData.recurrence = recurrence;
      } else {
        finalData.dayOfWeek = null;
        finalData.recurrence = null;
        if (startDate) {
          finalData.date = new Date(startDate);
        }
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
      alert(t('social.alert_save_error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!socialData?.id) return;
    if (!confirm(t('social.alert_delete_confirm'))) return;
    try {
      await socialService.deleteSocial(socialData.id);
      onSuccess?.();
      onClose();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-white overflow-y-auto animate-in fade-in duration-300">
      <style dangerouslySetInnerHTML={{ __html: `.material-symbols-rounded { font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24; }` }} />

      {/* Header */}
      <header className="fixed top-0 left-0 w-full z-[210] flex justify-between items-center px-4 h-14 bg-white/95 backdrop-blur-md border-b border-[#f2f4f4]">
        <div className="flex items-center gap-2">
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors">
            <span className="material-symbols-rounded text-[#2d3435]">close</span>
          </button>
          <h1 className="text-lg font-black font-headline text-[#2d3435]">{socialData ? t('social.edit_social') : t('social.create_social')}</h1>
        </div>
        <div className="flex items-center gap-2">
          {socialData && (
            <button onClick={handleDelete} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-red-50 text-red-500 transition-colors">
              <span className="material-symbols-rounded">delete</span>
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={isSubmitting}
            className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-full hover:bg-primary/90 transition-colors disabled:opacity-50 font-bold text-sm shadow-sm"
          >
            <span className="material-symbols-rounded text-[18px]">{isSubmitting ? 'sync' : 'done'}</span>
            {t('social.save')}
          </button>
        </div>
      </header>

      <main className="pt-20 pb-4 max-w-2xl mx-auto px-4 space-y-5">
        
        {/* 1. Gallery Section */}
        <div className="border border-[#e0e4e5] rounded-2xl bg-white">
          <div className="bg-[#f8f9fa] px-4 py-3 border-b border-[#e0e4e5] flex items-center justify-between rounded-t-[15px]">
            <div className="flex items-center gap-2">
              <span className="material-symbols-rounded text-sm text-primary">image</span>
              <p className="text-[10px] font-black text-primary uppercase tracking-widest">{t('social.poster_gallery')}</p>
            </div>
          </div>
          <div className="p-4">
            <div className="py-4 px-8 border border-[#e0e4e5] rounded-xl bg-[#f8f9fa] mb-3 flex justify-center">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="relative aspect-[4/5] w-full max-w-[240px] rounded-lg overflow-hidden bg-white border border-[#e0e4e5] flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-all group shadow-sm"
              >
                {images[0] ? (
                  <>
                    <img className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src={images[0]} alt="poster" />
                    <div className="absolute top-3 left-3 bg-primary text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded shadow-sm z-10">{t('social.primary')}</div>
                  </>
                ) : (
                  <div className="flex flex-col items-center text-[#acb3b4] group-hover:text-primary transition-colors">
                    <span className="material-symbols-rounded text-4xl mb-2">add_photo_alternate</span>
                    <span className="text-xs font-bold text-center px-4">{t('social.upload_poster')}<br/><span className="text-[10px] font-medium mt-1">{t('social.ratio_recommended')}</span></span>
                  </div>
                )}
              </div>
            </div>
            <p className="text-center text-[11px] font-bold text-[#acb3b4]">{t('social.optimal_ratio_desc')}</p>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) {
                setImages([URL.createObjectURL(f)]);
                setImageFile(f);
              }
            }} />
          </div>
        </div>

        {/* 1.5 Moments Section */}
        <div className="border border-[#e0e4e5] rounded-2xl bg-white">
          <div className="bg-[#f8f9fa] px-4 py-3 border-b border-[#e0e4e5] flex items-center justify-between rounded-t-[15px]">
            <div className="flex items-center gap-2">
              <span className="material-symbols-rounded text-sm text-primary">photo_library</span>
              <p className="text-[10px] font-black text-primary uppercase tracking-widest">{t('social.moments')}</p>
            </div>
            <p className="text-[10px] font-bold text-[#acb3b4]">{moments.length} / 20</p>
          </div>
          <div className="p-4">
            <div className="flex flex-wrap gap-3">
              {moments.map((src, i) => (
                <div key={i} className="relative w-20 h-24 rounded-lg overflow-hidden border border-[#e0e4e5] group">
                  <img src={src} className="w-full h-full object-cover" alt="" />
                  <button 
                    onClick={() => {
                      setMoments(moments.filter((_, idx) => idx !== i));
                      setMomentFiles(momentFiles.filter((_, idx) => idx !== i));
                    }}
                    className="absolute top-1 right-1 w-5 h-5 bg-black/50 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <span className="material-symbols-rounded text-[12px]">close</span>
                  </button>
                </div>
              ))}
              {moments.length < 20 && (
                <button 
                  onClick={() => momentInputRef.current?.click()}
                  className="w-20 h-24 rounded-lg border-2 border-dashed border-[#e0e4e5] flex flex-col items-center justify-center text-[#acb3b4] hover:text-primary hover:border-primary/50 transition-all"
                >
                  <span className="material-symbols-rounded text-2xl">add_a_photo</span>
                  <span className="text-[10px] font-bold mt-1">{t('social.add_moment')}</span>
                </button>
              )}
            </div>
            <input 
              ref={momentInputRef} 
              type="file" 
              accept="image/*" 
              multiple 
              className="hidden" 
              onChange={(e) => {
                const files = Array.from(e.target.files || []);
                const remaining = 20 - moments.length;
                const newFiles = files.slice(0, remaining);
                
                const newUrls = newFiles.map(f => URL.createObjectURL(f));
                setMoments([...moments, ...newUrls]);
                setMomentFiles([...momentFiles, ...newFiles]);
              }} 
            />
          </div>
        </div>

        {/* 2. Basic Info Section */}
        <div className="border border-[#e0e4e5] rounded-2xl bg-white">
          <div className="bg-[#f8f9fa] px-4 py-3 border-b border-[#e0e4e5] flex items-center gap-2 rounded-t-[15px]">
            <span className="material-symbols-rounded text-sm text-primary">info</span>
            <p className="text-[10px] font-black text-primary uppercase tracking-widest">{t('social.basic_info')}</p>
          </div>
          <div className="p-4 space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-[#acb3b4] uppercase tracking-wider mb-1.5">{t('social.event_title_en')}</label>
              <div className={`flex items-center px-4 py-3 border rounded-xl bg-[#f8f9fa] focus-within:bg-white focus-within:ring-2 focus-within:ring-primary/20 transition-all ${titleError ? 'border-red-300 ring-2 ring-red-100' : 'border-[#e0e4e5]'}`}>
                <input value={title} onChange={(e) => handleTitleChange(e.target.value)}
                  className="flex-1 bg-transparent border-none p-0 focus:ring-0 text-base font-bold text-[#2d3435] placeholder:text-[#acb3b4] outline-none"
                  placeholder="e.g. Milonga El Bulin" type="text" />
              </div>
              {titleError && <p className="text-[10px] font-bold text-red-500 mt-1 ml-1">{titleError}</p>}
            </div>
            
            <div>
              <label className="block text-[11px] font-bold text-[#acb3b4] uppercase tracking-wider mb-1.5">{t('social.title_native')}</label>
              <div className="flex items-center px-4 py-3 border border-[#e0e4e5] rounded-xl bg-[#f8f9fa] focus-within:bg-white focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                <input value={titleNative} onChange={(e) => setTitleNative(e.target.value)}
                  className="flex-1 bg-transparent border-none p-0 focus:ring-0 text-base font-bold text-[#2d3435] placeholder:text-[#acb3b4] outline-none"
                  placeholder={t('social.title_native_placeholder', 'e.g. Milonga El Bulin')} type="text" />
              </div>
            </div>
 
            <div>
              <label className="block text-[11px] font-bold text-[#acb3b4] uppercase tracking-wider mb-1.5">{t('social.description_optional')}</label>
              <div className="flex px-4 py-3 border border-[#e0e4e5] rounded-xl bg-[#f8f9fa] focus-within:bg-white focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                <textarea value={description} onChange={(e) => setDescription(e.target.value)}
                  className="flex-1 bg-transparent border-none p-0 focus:ring-0 text-sm font-medium text-[#2d3435] placeholder:text-[#acb3b4] outline-none min-h-[80px] resize-none"
                  placeholder={t('social.description_placeholder')} />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#acb3b4] uppercase tracking-wider mb-2">{t('social.event_type')}</label>
              <div className="flex gap-2 p-1 bg-[#f8f9fa] border border-[#e0e4e5] rounded-xl">
                <button onClick={() => setType('regular')}
                  className={`flex-1 py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-1.5 transition-all ${type === 'regular' ? 'bg-white text-primary shadow-sm border border-[#e0e4e5]' : 'text-[#acb3b4] hover:text-[#596061]'}`}>
                  <span className="material-symbols-rounded text-[18px]">event_repeat</span>{t('social.type_regular')}
                </button>
                <button onClick={() => setType('popup')}
                  className={`flex-1 py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-1.5 transition-all ${type === 'popup' ? 'bg-white text-primary shadow-sm border border-[#e0e4e5]' : 'text-[#acb3b4] hover:text-[#596061]'}`}>
                  <span className="material-symbols-rounded text-[18px]">bolt</span>{t('social.type_popup')}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Date & Time Section */}
        <div className="border border-[#e0e4e5] rounded-2xl bg-white">
          <div className="bg-[#f8f9fa] px-4 py-3 border-b border-[#e0e4e5] flex items-center gap-2 rounded-t-[15px]">
            <span className="material-symbols-rounded text-sm text-primary">schedule</span>
            <p className="text-[10px] font-black text-primary uppercase tracking-widest">{t('social.date_time')}</p>
          </div>
          <div className="p-4 space-y-5">
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-[11px] font-bold text-[#acb3b4] uppercase tracking-wider mb-1.5">{type === 'regular' ? t('social.start_date') : t('social.date')}</label>
                <div className="flex items-center px-4 py-3 border border-[#e0e4e5] rounded-xl bg-[#f8f9fa] focus-within:bg-white focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                  <input value={startDate} onChange={(e) => {
                    const val = e.target.value;
                    setStartDate(val);
                    if (val) {
                      const d = new Date(val);
                      if (!isNaN(d.getTime())) {
                        setDayOfWeek(d.getDay());
                      }
                    }
                  }}
                  className="flex-1 bg-transparent border-none p-0 focus:ring-0 text-sm font-bold text-[#2d3435] outline-none" type="date" />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#acb3b4] uppercase tracking-wider mb-1.5">{t('social.time_interval')}</label>
                <div className="flex items-center justify-between px-3 py-3 border border-[#e0e4e5] rounded-xl bg-[#f8f9fa] focus-within:bg-white focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                  <input value={startTime} onChange={(e) => handleStartTimeChange(e.target.value)} 
                    className="w-full bg-transparent border-none p-0 focus:ring-0 text-sm font-bold text-[#2d3435] text-center outline-none" type="time" />
                  <span className="text-[#acb3b4] font-medium text-xs px-4">-</span>
                  <input value={endTime} onChange={(e) => setEndTime(e.target.value)} 
                    className="w-full bg-transparent border-none p-0 focus:ring-0 text-sm font-bold text-[#2d3435] text-center outline-none" type="time" />
                </div>
              </div>
            </div>
 
            <div className={`transition-opacity ${type === 'regular' ? 'opacity-100' : 'hidden'}`}>
              <label className="block text-[11px] font-bold text-[#acb3b4] uppercase tracking-wider mb-2">{t('social.frequency')}</label>
              <div className="flex flex-wrap gap-2">
                {getAvailableRecurrences(startDate).map(r => (
                  <button key={r.id} onClick={() => setRecurrence(r.id)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${recurrence === r.id ? 'bg-primary text-white border-primary shadow-sm' : 'bg-[#f8f9fa] text-[#acb3b4] border-[#e0e4e5] hover:border-primary/50'}`}>
                    {r.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 4. Location Section */}
        <div className="relative z-40 border border-[#e0e4e5] rounded-2xl bg-white">
          <div className="bg-[#f8f9fa] px-4 py-3 border-b border-[#e0e4e5] flex items-center gap-2 rounded-t-[15px]">
            <span className="material-symbols-rounded text-sm text-primary">location_on</span>
            <p className="text-[10px] font-black text-primary uppercase tracking-widest">{t('social.location')}</p>
          </div>
          <div className="p-4 space-y-4">
            <div className="relative z-50">
              <label className="block text-[11px] font-bold text-[#acb3b4] uppercase tracking-wider mb-1.5">{t('social.venue_label')}</label>
              <div className="relative flex items-center px-4 py-3 border border-[#e0e4e5] rounded-xl bg-[#f8f9fa] focus-within:bg-white focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                <span className="material-symbols-rounded text-[#acb3b4] mr-2">search</span>
                <input value={venueName} onChange={(e) => handleVenueSearch(e.target.value)}
                  onFocus={() => venueName.length >= 1 && setShowVenueResults(venueResults.length > 0)}
                  onBlur={() => setTimeout(() => setShowVenueResults(false), 200)}
                  className="flex-1 bg-transparent border-none p-0 focus:ring-0 text-sm font-bold text-[#2d3435] placeholder:text-[#acb3b4] outline-none"
                  placeholder={t('social.search_venue_placeholder')} type="text" />
              </div>
              {showVenueResults && (
                <div className="absolute top-full left-0 w-full mt-1 bg-white border border-[#e0e4e5] rounded-xl shadow-lg z-50 overflow-hidden">
                  {venueResults.map(v => (
                    <button key={v.id} onClick={() => handleSelectVenue(v)}
                      className="w-full text-left px-4 py-3 hover:bg-[#f8f9fa] flex items-center justify-between group transition-colors border-b border-[#f2f4f4] last:border-0">
                      <div className="flex items-baseline gap-2">
                        <p className="font-bold text-[#2d3435] text-sm group-hover:text-primary">{v.name}</p>
                        {v.nameKo && <span className="text-[10px] text-[#acb3b4] font-medium">{v.nameKo}</span>}
                      </div>
                      <span className="text-[10px] text-[#acb3b4] font-bold bg-[#f2f4f4] px-2 py-0.5 rounded-full">{v.city}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
 
            <div>
              <label className="block text-[11px] font-bold text-[#acb3b4] uppercase tracking-wider mb-1.5">{t('social.region_autofill')}</label>
              <button onClick={() => openSelectorWithCallback((country, city) => { setFormCountry(country); setFormCity(city); })}
                className="w-full flex items-center justify-between px-4 py-3 border border-[#e0e4e5] rounded-xl bg-[#f8f9fa] hover:bg-[#f2f4f4] transition-colors">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-rounded text-primary">public</span>
                  <div className="text-left">
                    <p className="text-sm font-bold text-[#2d3435]">{formCountry || t('social.select_country')}</p>
                    <p className="text-[10px] font-medium text-[#acb3b4]">{formCity || t('social.select_city')}</p>
                  </div>
                </div>
                <span className="material-symbols-rounded text-[#acb3b4]">chevron_right</span>
              </button>
            </div>
          </div>
        </div>

        {/* 5. Roles & Staff */}
        <div className="relative z-30 border border-[#e0e4e5] rounded-2xl bg-white">
          <div className="bg-[#f8f9fa] px-4 py-3 border-b border-[#e0e4e5] flex items-center gap-2 rounded-t-[15px]">
            <span className="material-symbols-rounded text-sm text-primary">group</span>
            <p className="text-[10px] font-black text-primary uppercase tracking-widest">{t('social.roles_staff')}</p>
          </div>
          <div className="p-4 space-y-4">
            {/* Organizer */}
            <div className="relative z-30">
              <label className="block text-[11px] font-bold text-[#acb3b4] uppercase tracking-wider mb-1.5">{t('social.organizer_label')}</label>
              <div className="relative flex items-center px-4 py-3 border border-[#e0e4e5] rounded-xl bg-[#f8f9fa] focus-within:bg-white focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                <span className="material-symbols-rounded text-[#acb3b4] mr-2">person_filled</span>
                <input value={organizerName} onChange={(e) => handleOrganizerSearch(e.target.value)}
                  onFocus={() => organizerName.length >= 1 && setShowOrganizerResults(organizerResults.length > 0)}
                  onBlur={() => setTimeout(() => setShowOrganizerResults(false), 200)}
                  className="flex-1 bg-transparent border-none p-0 focus:ring-0 text-sm font-bold text-[#2d3435] placeholder:text-[#acb3b4] outline-none"
                  placeholder={t('social.search_user_placeholder')} type="text" />
              </div>
              {showOrganizerResults && (
                <div className="absolute top-full left-0 w-full mt-1 bg-white border border-[#e0e4e5] rounded-xl shadow-lg z-50 overflow-hidden">
                  {organizerResults.map(u => (
                    <button key={u.id} onClick={() => handleSelectOrganizer(u)}
                      className="w-full text-left px-4 py-3 hover:bg-[#f8f9fa] flex items-center gap-3 group transition-colors border-b border-[#f2f4f4] last:border-0">
                      <span className="material-symbols-rounded text-[#acb3b4] text-[18px]">person</span>
                      <div className="flex flex-col">
                        <p className="font-bold text-[#2d3435] text-sm group-hover:text-primary leading-tight">{u.nickname}</p>
                        {u.nativeNickname && <span className="text-[10px] text-[#acb3b4] font-medium leading-tight">{u.nativeNickname}</span>}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* DJ */}
            <div className="relative z-20">
              <label className="block text-[11px] font-bold text-[#acb3b4] uppercase tracking-wider mb-1.5">{t('social.dj_label')}</label>
              <div className="relative flex items-center px-4 py-3 border border-[#e0e4e5] rounded-xl bg-[#f8f9fa] focus-within:bg-white focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                <span className="material-symbols-rounded text-[#acb3b4] mr-2">headphones</span>
                <input value={djName} onChange={(e) => handleDjSearch(e.target.value)}
                  onFocus={() => djName.length >= 1 && setShowDjResults(djResults.length > 0)}
                  onBlur={() => setTimeout(() => setShowDjResults(false), 200)}
                  className="flex-1 bg-transparent border-none p-0 focus:ring-0 text-sm font-bold text-[#2d3435] placeholder:text-[#acb3b4] outline-none"
                  placeholder={t('social.search_dj_placeholder')} type="text" />
              </div>
              {showDjResults && (
                <div className="absolute top-full left-0 w-full mt-1 bg-white border border-[#e0e4e5] rounded-xl shadow-lg z-50 overflow-hidden">
                  {djResults.map(u => (
                    <button key={u.id} onClick={() => handleSelectDj(u)}
                      className="w-full text-left px-4 py-3 hover:bg-[#f8f9fa] flex items-center gap-3 group transition-colors border-b border-[#f2f4f4] last:border-0">
                      <span className="material-symbols-rounded text-[#acb3b4] text-[18px]">headphones</span>
                      <div className="flex flex-col">
                        <p className="font-bold text-[#2d3435] text-sm group-hover:text-primary leading-tight">{u.nickname}</p>
                        {u.nativeNickname && <span className="text-[10px] text-[#acb3b4] font-medium leading-tight">{u.nativeNickname}</span>}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Staff */}
            <div className="relative z-10">
              <label className="block text-[11px] font-bold text-[#acb3b4] uppercase tracking-wider mb-1.5">{t('social.staff_registration')}</label>
              <div className="relative flex items-center px-4 py-3 border border-[#e0e4e5] rounded-xl bg-[#f8f9fa] focus-within:bg-white focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                <span className="material-symbols-rounded text-[#acb3b4] mr-2">person_add</span>
                <input value={staffSearch} onChange={(e) => {
                    setStaffSearch(e.target.value);
                    if (e.target.value.length >= 1) {
                      const lower = e.target.value.toLowerCase();
                      const filtered = allUsers.filter(u =>
                        !staffList.find(s => s.id === u.id) &&
                        ((u.nickname && u.nickname.toLowerCase().includes(lower)) ||
                         (u.nativeNickname && u.nativeNickname.includes(e.target.value)))
                      );
                      setStaffResults(filtered.slice(0, 6));
                      setShowStaffResults(filtered.length > 0);
                    } else setShowStaffResults(false);
                  }}
                  onBlur={() => setTimeout(() => setShowStaffResults(false), 200)}
                  className="flex-1 bg-transparent border-none p-0 focus:ring-0 text-sm font-bold text-[#2d3435] placeholder:text-[#acb3b4] outline-none"
                  placeholder={t('social.search_staff_placeholder')} type="text" />
              </div>
              {showStaffResults && (
                <div className="absolute top-full left-0 w-full mt-1 bg-white border border-[#e0e4e5] rounded-xl shadow-lg z-50 overflow-hidden">
                  {staffResults.map(u => (
                    <button key={u.id} onClick={() => { setStaffList([...staffList, { id: u.id, name: u.nickname || '' }]); setStaffSearch(''); setShowStaffResults(false); }}
                      className="w-full text-left px-4 py-3 hover:bg-[#f8f9fa] flex items-center gap-3 border-b border-[#f2f4f4] last:border-0 group">
                      <span className="material-symbols-rounded text-[#acb3b4] text-[18px]">person_add</span>
                      <div className="flex flex-col">
                        <p className="font-bold text-[#2d3435] text-sm group-hover:text-primary leading-tight">{u.nickname}</p>
                        {u.nativeNickname && <span className="text-[10px] text-[#acb3b4] font-medium leading-tight">{u.nativeNickname}</span>}
                      </div>
                    </button>
                  ))}
                </div>
              )}
              
              {staffList.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3 p-3 bg-[#f8f9fa] rounded-xl border border-[#e0e4e5]">
                  {staffList.map(s => (
                    <div key={s.id} className="flex items-center gap-1.5 bg-white border border-[#e0e4e5] px-3 py-1.5 rounded-full shadow-sm">
                      <span className="material-symbols-rounded text-[14px] text-primary">person</span>
                      <span className="text-[11px] font-bold text-[#2d3435]">{s.name}</span>
                      <button onClick={() => setStaffList(staffList.filter(x => x.id !== s.id))} className="text-[#acb3b4] hover:text-red-500 transition-colors ml-1 flex items-center justify-center">
                        <span className="material-symbols-rounded text-[14px]">cancel</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 6. Ticketing & Details */}
        <div className="relative z-20 border border-[#e0e4e5] rounded-2xl bg-white">
          <div className="bg-[#f8f9fa] px-4 py-3 border-b border-[#e0e4e5] flex items-center gap-2 rounded-t-[15px]">
            <span className="material-symbols-rounded text-sm text-primary">local_activity</span>
            <p className="text-[10px] font-black text-primary uppercase tracking-widest">{t('social.ticketing_details')}</p>
          </div>
          <div className="p-4 space-y-4">
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-[11px] font-bold text-[#acb3b4] uppercase tracking-wider mb-1.5">{t('social.entry_price')}</label>
                <div className="flex items-center gap-2">
                  <div className="px-3 py-3 border border-[#e0e4e5] rounded-xl bg-[#f8f9fa] focus-within:bg-white focus-within:ring-2 focus-within:ring-primary/20 transition-all w-24">
                    <select value={currency} onChange={(e) => setCurrency(e.target.value)}
                      className="w-full bg-transparent border-none p-0 text-sm font-bold text-[#2d3435] focus:ring-0 outline-none appearance-none">
                      <option value="KRW">KRW</option>
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="JPY">JPY</option>
                    </select>
                  </div>
                  <div className="flex-1 flex items-center px-4 py-3 border border-[#e0e4e5] rounded-xl bg-[#f8f9fa] focus-within:bg-white focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                    <input value={priceAmount} onChange={(e) => setPriceAmount(e.target.value)}
                      className="w-full bg-transparent border-none p-0 focus:ring-0 text-sm font-bold text-[#2d3435] placeholder:text-[#acb3b4] outline-none" type="number" placeholder="0" />
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-[11px] font-bold text-[#acb3b4] uppercase tracking-wider mb-1.5">{t('social.table_capacity')}</label>
                <div className="flex items-center px-4 py-3 border border-[#e0e4e5] rounded-xl bg-[#f8f9fa] focus-within:bg-white focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                  <span className="material-symbols-rounded text-[#acb3b4] mr-2">deck</span>
                  <input value={tableCapacity || ''} onChange={(e) => setTableCapacity(parseInt(e.target.value) || 0)}
                    className="flex-1 bg-transparent border-none p-0 focus:ring-0 text-sm font-bold text-[#2d3435] placeholder:text-[#acb3b4] outline-none" type="number" placeholder="e.g. 15" min="0" />
                </div>
              </div>
            </div>
 
            <div>
              <label className="block text-[11px] font-bold text-[#acb3b4] uppercase tracking-wider mb-1.5">{t('social.dress_code')}</label>
              <div className="flex items-center px-4 py-3 border border-[#e0e4e5] rounded-xl bg-[#f8f9fa] focus-within:bg-white focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                <span className="material-symbols-rounded text-[#acb3b4] mr-2">checkroom</span>
                <input value={dressCode} onChange={(e) => setDressCode(e.target.value)}
                  className="flex-1 bg-transparent border-none p-0 focus:ring-0 text-sm font-bold text-[#2d3435] placeholder:text-[#acb3b4] outline-none" placeholder={t('social.dress_code_placeholder')} type="text" />
              </div>
            </div>
          </div>
        </div>

        {/* 7. Sub-Events Schedule */}
        <div className="relative z-10 border border-[#e0e4e5] rounded-2xl bg-white">
          <div className="bg-[#f8f9fa] px-4 py-3 border-b border-[#e0e4e5] flex items-center justify-between rounded-t-[15px]">
            <div className="flex items-center gap-2">
              <span className="material-symbols-rounded text-sm text-primary">celebration</span>
              <p className="text-[10px] font-black text-primary uppercase tracking-widest">{t('social.events_schedule')}</p>
            </div>
            <button onClick={() => setSocialEvents([...socialEvents, { id: Date.now(), title: '', description: '', maxParticipants: 1, isUnlimited: true }])}
              className="text-[10px] font-bold text-primary flex items-center gap-1 bg-primary/10 px-2.5 py-1 rounded-full hover:bg-primary/20 transition-colors">
              <span className="material-symbols-rounded text-[14px]">add</span> {t('social.add_event')}
            </button>
          </div>
          <div className="p-4 space-y-3">
            {socialEvents.length === 0 && (
              <div className="text-center py-6 text-[#acb3b4]">
                <span className="material-symbols-rounded text-3xl mb-1 opacity-50">event_note</span>
                <p className="text-xs font-bold">{t('social.no_sub_events')}</p>
              </div>
            )}
            {socialEvents.map(event => (
              <div key={event.id} className="p-3 border border-[#e0e4e5] rounded-xl bg-[#f8f9fa] relative group">
                <button onClick={() => setSocialEvents(socialEvents.filter(e => e.id !== event.id))} 
                  className="absolute -top-2 -right-2 w-6 h-6 bg-white border border-[#e0e4e5] rounded-full flex items-center justify-center text-[#acb3b4] hover:text-red-500 hover:border-red-200 transition-colors shadow-sm opacity-0 group-hover:opacity-100">
                  <span className="material-symbols-rounded text-[14px]">close</span>
                </button>
                <div className="space-y-2">
                  <input value={event.title} onChange={(e) => setSocialEvents(socialEvents.map(ev => ev.id === event.id ? { ...ev, title: e.target.value } : ev))}
                    className="w-full bg-transparent border-b border-[#e0e4e5] pb-1 focus:border-primary focus:ring-0 text-sm font-bold text-[#2d3435] placeholder:text-[#acb3b4] outline-none transition-colors"
                    type="text" placeholder={t('social.sub_event_title_placeholder')} />
                  <input value={event.description} onChange={(e) => setSocialEvents(socialEvents.map(ev => ev.id === event.id ? { ...ev, description: e.target.value } : ev))}
                    className="w-full bg-transparent border-none p-0 focus:ring-0 text-xs text-[#596061] placeholder:text-[#acb3b4] outline-none"
                    type="text" placeholder={t('social.sub_event_desc_placeholder')} />
                  <div className="flex items-center justify-between pt-3 border-t border-[#e0e4e5] border-dashed">
                    <label className="text-[10px] text-[#acb3b4] font-bold uppercase flex items-center gap-2">
                      <input 
                        type="checkbox" 
                        checked={(event as any).isUnlimited}
                        onChange={(e) => setSocialEvents(socialEvents.map(ev => ev.id === event.id ? { ...ev, isUnlimited: e.target.checked, maxParticipants: e.target.checked ? 0 : 1 } : ev))}
                        className="rounded border-[#e0e4e5] text-primary focus:ring-primary/20"
                      />
                      {t('social.unlimited_participants')}
                    </label>
                    {!(event as any).isUnlimited && (
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-[#acb3b4] font-bold uppercase">Max:</span>
                        <input value={event.maxParticipants || ''} onChange={(e) => setSocialEvents(socialEvents.map(ev => ev.id === event.id ? { ...ev, maxParticipants: Math.max(1, parseInt(e.target.value) || 1) } : ev))}
                          className="w-16 bg-white border border-[#e0e4e5] p-1.5 rounded-md text-[11px] font-bold text-[#2d3435] text-center outline-none focus:border-primary"
                          type="number" min="1" placeholder="1" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </main>
    </div>
  );
}
