'use client';
import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { useLocation } from '@/components/providers/LocationProvider';
import { eventService } from '@/lib/firebase/eventService';
import { venueService } from '@/lib/firebase/venueService';
import { userService } from '@/lib/firebase/userService';
import { storageService } from '@/lib/firebase/storageService';
import { Event, EventCategory, EventProgram, EventPricing, EventArtist, EventVenueItem, EventPackage, EventScheduleDay } from '@/types/event';
import { Venue } from '@/types/venue';
import { PlatformUser } from '@/types/user';
import { Timestamp } from 'firebase/firestore';
import ProgramEditor from './ProgramEditor';
import { syncMilongasToSocial, deleteLinkedSocials } from '@/lib/firebase/syncMilongaToSocial';
import { useLanguage } from '@/contexts/LanguageContext';

interface Props { onClose: () => void; onSuccess?: () => void; eventData?: Event; }

const toDateStr = (v: any) => {
  if (!v) return '';
  const d = typeof v?.toDate === 'function' ? v.toDate() : new Date(v);
  return isNaN(d.getTime()) ? '' : d.toISOString().split('T')[0];
};

/* ── Reusable form section wrapper ── */
const Section = ({ icon, label, children, z }: { icon: string; label: string; children: React.ReactNode; z?: number }) => (
  <div className="border border-[#e0e4e5] rounded-2xl bg-white" style={z ? { position: 'relative', zIndex: z } : undefined}>
    <div className="bg-[#f8f9fa] px-4 py-3 border-b border-[#e0e4e5] flex items-center gap-2 rounded-t-[15px]">
      <span className="material-symbols-rounded text-sm text-primary">{icon}</span>
      <p className="text-[10px] font-black text-primary uppercase tracking-widest">{label}</p>
    </div>
    <div className="p-4 space-y-4">{children}</div>
  </div>
);

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <label className="block text-[11px] font-bold text-[#acb3b4] uppercase tracking-wider mb-1.5">{label}</label>
    {children}
  </div>
);

const inputCls = "flex-1 bg-transparent border-none p-0 focus:ring-0 text-sm font-bold text-[#2d3435] placeholder:text-[#acb3b4] outline-none";
const boxCls = "flex items-center px-4 py-3 border border-[#e0e4e5] rounded-xl bg-[#f8f9fa] focus-within:bg-white focus-within:ring-2 focus-within:ring-primary/20 transition-all";

export default function EditEvent({ onClose, onSuccess, eventData }: Props) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { location, openSelectorWithCallback } = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Basic
  const [title, setTitle] = useState(eventData?.title || '');
  const [titleNative, setTitleNative] = useState(eventData?.titleNative || '');
  const [description, setDescription] = useState(eventData?.description || '');
  const [category, setCategory] = useState<EventCategory>(eventData?.category || 'WORKSHOP');

  // Date
  const [startDate, setStartDate] = useState(toDateStr(eventData?.startDate));
  const [endDate, setEndDate] = useState(toDateStr(eventData?.endDate));

  // Location
  const [formCountry, setFormCountry] = useState(eventData?.location?.split(',')[1]?.trim() || location.country);
  const [formCity, setFormCity] = useState(eventData?.location?.split(',')[0]?.trim() || location.city);
  const [venueId, setVenueId] = useState(eventData?.venueId || '');
  const [venueName, setVenueName] = useState(eventData?.venueName || '');
  const [allVenues, setAllVenues] = useState<Venue[]>([]);
  const [venueResults, setVenueResults] = useState<Venue[]>([]);
  const [showVenueResults, setShowVenueResults] = useState(false);

  // Host / Staff
  const [allUsers, setAllUsers] = useState<PlatformUser[]>([]);
  const [hostName, setHostName] = useState(eventData?.hostName || user?.displayName || '');
  const [staffList, setStaffList] = useState<{id:string;name:string}[]>(
    eventData?.staffIds?.map((id,i) => ({id, name: eventData?.staffNames?.[i]||''})) || []
  );
  const [staffSearch, setStaffSearch] = useState('');
  const [staffResults, setStaffResults] = useState<PlatformUser[]>([]);
  const [showStaffResults, setShowStaffResults] = useState(false);

  // Image
  const [images, setImages] = useState<string[]>(eventData?.imageUrl ? [eventData.imageUrl] : []);
  const [imageFile, setImageFile] = useState<File|null>(null);

  // Programs
  const [programs, setPrograms] = useState<EventProgram[]>(eventData?.programs || []);

  // Pricing
  const [currency, setCurrency] = useState(eventData?.pricing?.currency || 'KRW');
  const [classAdv, setClassAdv] = useState(eventData?.pricing?.classPrice?.advance || 0);
  const [classDoor, setClassDoor] = useState(eventData?.pricing?.classPrice?.door || 0);
  const [milongaAdv, setMilongaAdv] = useState(eventData?.pricing?.milongaPrice?.advance || 0);
  const [milongaDoor, setMilongaDoor] = useState(eventData?.pricing?.milongaPrice?.door || 0);
  const [fullPassAdv, setFullPassAdv] = useState(eventData?.pricing?.fullPassPrice?.advance || 0);
  const [fullPassDoor, setFullPassDoor] = useState(eventData?.pricing?.fullPassPrice?.door || 0);
  const [fullPassLabel, setFullPassLabel] = useState(eventData?.pricing?.fullPassPrice?.label || '');
  const [earlyBird, setEarlyBird] = useState(eventData?.pricing?.earlyBirdDeadline || '');

  // New Sections
  const [galleryImages, setGalleryImages] = useState<string[]>(eventData?.galleryImages || []);
  const [artists, setArtists] = useState<EventArtist[]>(eventData?.artists || []);
  const [eventVenues, setEventVenues] = useState<EventVenueItem[]>(eventData?.eventVenues || []);
  const [packages, setPackages] = useState<EventPackage[]>(eventData?.packages || []);
  const [scheduleDays, setScheduleDays] = useState<EventScheduleDay[]>(eventData?.scheduleDays || []);

  // Extra
  const [dressCode, setDressCode] = useState(eventData?.dressCode || '');
  const [websiteUrl, setWebsiteUrl] = useState(eventData?.websiteUrl || '');
  const [registrationUrl, setRegistrationUrl] = useState(eventData?.registrationUrl || '');
  const [bankInfo, setBankInfo] = useState(eventData?.bankInfo || '');

  const categories: EventCategory[] = ['CONFERENCE','WORKSHOP','NETWORKING','PARTY','SOCIAL'];

  useEffect(() => {
    venueService.getVenues().then(setAllVenues).catch(console.error);
    userService.getAllUsers().then(setAllUsers).catch(console.error);
  }, []);

  const handleVenueSearch = (val: string) => {
    setVenueName(val); setVenueId('');
    if (val.length >= 1) {
      const l = val.toLowerCase();
      const f = allVenues.filter(v => v.name?.toLowerCase().includes(l) || v.nameKo?.includes(val));
      setVenueResults(f.slice(0,6)); setShowVenueResults(f.length > 0);
    } else { setShowVenueResults(false); }
  };

  const handleSelectVenue = (v: Venue) => {
    setVenueName(v.name); setVenueId(v.id||''); setShowVenueResults(false);
    if (v.country) setFormCountry(v.country); if (v.city) setFormCity(v.city);
  };

  const handleSave = async () => {
    if (!user || !title || !startDate) return alert('Please fill Title and Start Date.');
    setIsSubmitting(true);
    try {
      let finalImageUrl = images[0] || '';
      if (imageFile) {
        finalImageUrl = await storageService.uploadFile(imageFile, `events/${Date.now()}_${imageFile.name}`);
      }
      const startObj = new Date(startDate); startObj.setHours(0,0,0,0);
      const endObj = endDate ? new Date(endDate) : new Date(startDate); endObj.setHours(0,0,0,0);

      const pricing: EventPricing = {
        currency,
        ...(classAdv ? { classPrice: { advance: classAdv, door: classDoor || undefined } } : {}),
        ...(milongaAdv ? { milongaPrice: { advance: milongaAdv, door: milongaDoor || undefined } } : {}),
        ...(fullPassAdv ? { fullPassPrice: { advance: fullPassAdv, door: fullPassDoor || undefined, label: fullPassLabel || undefined } } : {}),
        ...(earlyBird ? { earlyBirdDeadline: earlyBird } : {}),
      };

      const finalData: any = {
        title, titleNative, description, category,
        location: `${formCity}, ${formCountry}`,
        startDate: Timestamp.fromDate(startObj),
        endDate: Timestamp.fromDate(endObj),
        hostId: eventData?.hostId || user.uid,
        hostName: hostName || user.displayName || 'Anonymous',
        hostPhoto: eventData?.hostPhoto || user.photoURL || '',
        imageUrl: finalImageUrl,
        venueId, venueName,
        staffIds: staffList.map(s=>s.id),
        staffNames: staffList.map(s=>s.name),
        programs, pricing,
        galleryImages: galleryImages.filter(Boolean),
        artists: artists.filter(a => a.name),
        eventVenues: eventVenues.filter(v => v.name),
        packages: packages.filter(p => p.name),
        scheduleDays: scheduleDays.filter(d => d.dayLabel),
        dressCode, websiteUrl, registrationUrl, bankInfo,
      };

      let savedId = eventData?.id || '';
      if (eventData?.id) {
        await eventService.updateEvent(eventData.id, finalData);
      } else {
        savedId = await eventService.createEvent(finalData);
      }

      // Phase 5: milonga → Social popup 자동 동기화 (백그라운드)
      const hasMilonga = programs.some(p => p.type === 'milonga' && p.dates.length > 0);
      if (hasMilonga && savedId) {
        const eventForSync = { ...finalData, id: savedId } as any;
        syncMilongasToSocial(eventForSync)
          .then(r => console.log(`[Sync] Created:${r.created} Updated:${r.updated} Deleted:${r.deleted}`))
          .catch(e => console.error('[Sync] Failed:', e));
      }
      onSuccess?.(); onClose();
    } catch (e) { console.error(e); alert(t('event.save_failed')); }
    finally { setIsSubmitting(false); }
  };

  const handleDelete = async () => {
    if (!eventData?.id || !confirm(t('event.delete_confirm'))) return;
    try {
      // 연결된 Social popup도 삭제
      await deleteLinkedSocials(eventData.id);
      await eventService.deleteEvent(eventData.id);
      onSuccess?.(); onClose();
    } catch(e) { console.error(e); }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-white overflow-y-auto animate-in fade-in duration-300">
      <style dangerouslySetInnerHTML={{__html:`.material-symbols-rounded{font-variation-settings:'FILL' 1,'wght' 400,'GRAD' 0,'opsz' 24;}`}}/>
      {/* Header */}
      <header className="fixed top-0 left-0 w-full z-[210] flex justify-between items-center px-4 h-14 bg-white/95 backdrop-blur-md border-b border-[#f2f4f4]">
        <div className="flex items-center gap-2">
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors">
            <span className="material-symbols-rounded text-[#2d3435]">close</span>
          </button>
          <h1 className="text-lg font-black font-headline text-[#2d3435]">{eventData ? t('event.edit_title') : t('event.create_title_new')}</h1>
        </div>
        <div className="flex items-center gap-2">
          {eventData && (
            <button onClick={handleDelete} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-red-50 text-red-500"><span className="material-symbols-rounded">delete</span></button>
          )}
          <button onClick={handleSave} disabled={isSubmitting}
            className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-full hover:bg-primary/90 transition-colors disabled:opacity-50 font-bold text-sm shadow-sm">
            <span className="material-symbols-rounded text-[18px]">{isSubmitting?'sync':'done'}</span>{t('event.save_btn')}
          </button>
        </div>
      </header>

      <main className="pt-20 pb-4 max-w-2xl mx-auto px-4 space-y-5">
        {/* 1. Gallery */}
        <Section icon="image" label={t('event.poster_label')}>
          <div className="py-4 px-8 border border-[#e0e4e5] rounded-xl bg-[#f8f9fa] flex justify-center">
            <div onClick={()=>fileInputRef.current?.click()}
              className="relative aspect-[4/5] w-full max-w-[240px] rounded-lg overflow-hidden bg-white border border-[#e0e4e5] flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-all group shadow-sm">
              {images[0] ? (
                <><img className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src={images[0]} alt="poster"/><div className="absolute top-3 left-3 bg-primary text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded shadow-sm z-10">{t('event.primary_image')}</div></>
              ) : (
                <div className="flex flex-col items-center text-[#acb3b4] group-hover:text-primary transition-colors">
                  <span className="material-symbols-rounded text-4xl mb-2">add_photo_alternate</span>
                  <span className="text-xs font-bold">{t('event.upload_poster')}</span>
                </div>
              )}
            </div>
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={e=>{const f=e.target.files?.[0];if(f){setImages([URL.createObjectURL(f)]);setImageFile(f);}}}/>
        </Section>

        {/* 2. Basic Info */}
        <Section icon="info" label={t('event.basic_info')}>
          <Field label={t('event.title_en_label')}><div className={boxCls}><input value={title} onChange={e=>setTitle(e.target.value)} className={inputCls} placeholder="e.g. Seoul Tango Festival 2026"/></div></Field>
          <Field label={t('event.title_native_label')}><div className={boxCls}><input value={titleNative} onChange={e=>setTitleNative(e.target.value)} className={inputCls} placeholder={t('event.title_native_placeholder', 'e.g. Seoul Tango Festival 2026')}/></div></Field>
          <Field label={t('event.description_label')}><div className={boxCls}><textarea value={description} onChange={e=>setDescription(e.target.value)} className={`${inputCls} min-h-[80px] resize-none`} placeholder={t('event.description_placeholder_edit')}/></div></Field>
          <Field label={t('event.category_label')}>
            <div className="flex flex-wrap gap-2">
              {categories.map(c=>(
                <button key={c} onClick={()=>setCategory(c)} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${category===c?'bg-primary text-white border-primary shadow-sm':'bg-[#f8f9fa] text-[#acb3b4] border-[#e0e4e5] hover:border-primary/50'}`}>{t(`event.cat_${c.toLowerCase()}`)}</button>
              ))}
            </div>
          </Field>
        </Section>

        {/* 3. Date */}
        <Section icon="schedule" label={t('event.date_label')}>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t('event.start_date_label')}><div className={boxCls}><input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} className={inputCls}/></div></Field>
            <Field label={t('event.end_date_label')}><div className={boxCls}><input type="date" value={endDate} onChange={e=>setEndDate(e.target.value)} className={inputCls}/></div></Field>
          </div>
        </Section>

        {/* 4. Location */}
        <Section icon="location_on" label={t('event.venue_label')} z={40}>
          <div className="relative z-50">
            <Field label={t('event.venue_label')}>
              <div className={boxCls}>
                <span className="material-symbols-rounded text-[#acb3b4] mr-2">search</span>
                <input value={venueName} onChange={e=>handleVenueSearch(e.target.value)}
                  onFocus={()=>venueName.length>=1&&setShowVenueResults(venueResults.length>0)}
                  onBlur={()=>setTimeout(()=>setShowVenueResults(false),200)}
                  className={inputCls} placeholder={t('event.venue_search_placeholder')} />
              </div>
            </Field>
            {showVenueResults && (
              <div className="absolute top-full left-0 w-full mt-1 bg-white border border-[#e0e4e5] rounded-xl shadow-lg z-50 overflow-hidden">
                {venueResults.map(v=>(
                  <button key={v.id} onClick={()=>handleSelectVenue(v)} className="w-full text-left px-4 py-3 hover:bg-[#f8f9fa] flex items-center gap-3 group transition-colors border-b border-[#f2f4f4] last:border-0">
                    <span className="material-symbols-rounded text-[#acb3b4] text-[18px]">location_on</span>
                    <div className="flex flex-col flex-1 min-w-0">
                      <p className="font-bold text-[#2d3435] text-sm group-hover:text-primary leading-tight">{v.name}</p>
                      {v.nameKo && <span className="text-[10px] text-[#acb3b4] font-medium leading-tight">{v.nameKo}</span>}
                    </div>
                    <span className="text-[10px] text-[#acb3b4] font-bold bg-[#f2f4f4] px-2 py-0.5 rounded-full shrink-0">{v.city}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <Field label={t('event.region_label')}>
            <button onClick={()=>openSelectorWithCallback((c,ci)=>{setFormCountry(c);setFormCity(ci);})}
              className="w-full flex items-center justify-between px-4 py-3 border border-[#e0e4e5] rounded-xl bg-[#f8f9fa] hover:bg-[#f2f4f4] transition-colors">
              <div className="flex items-center gap-2">
                <span className="material-symbols-rounded text-primary">public</span>
                <div className="text-left"><p className="text-sm font-bold text-[#2d3435]">{formCountry||t('event.select_region')}</p><p className="text-[10px] font-medium text-[#acb3b4]">{formCity||t('event.select_region')}</p></div>
              </div>
              <span className="material-symbols-rounded text-[#acb3b4]">chevron_right</span>
            </button>
          </Field>
        </Section>

        {/* 5. Staff */}
        <Section icon="group" label={t('event.roles_staff_label')} z={30}>
          <Field label={t('event.host_name_label')}><div className={boxCls}><span className="material-symbols-rounded text-[#acb3b4] mr-2">person_filled</span><input value={hostName} onChange={e=>setHostName(e.target.value)} className={inputCls} placeholder={t('event.host_name_label')}/></div></Field>
          <div className="relative z-10">
            <Field label={t('event.staff_label')}>
              <div className={boxCls}>
                <span className="material-symbols-rounded text-[#acb3b4] mr-2">person_add</span>
                <input value={staffSearch} onChange={e=>{
                  setStaffSearch(e.target.value);
                  if(e.target.value.length>=1){const l=e.target.value.toLowerCase();const f=allUsers.filter(u=>!staffList.find(s=>s.id===u.id)&&(u.nickname?.toLowerCase().includes(l)||u.nativeNickname?.includes(e.target.value)));setStaffResults(f.slice(0,6));setShowStaffResults(f.length>0);}else setShowStaffResults(false);
                }} onBlur={()=>setTimeout(()=>setShowStaffResults(false),200)} className={inputCls} placeholder={t('event.staff_search_placeholder')}/>
              </div>
            </Field>
            {showStaffResults&&(
              <div className="absolute top-full left-0 w-full mt-1 bg-white border border-[#e0e4e5] rounded-xl shadow-lg z-50 overflow-hidden">
                {staffResults.map(u=>(
                  <button key={u.id} onClick={()=>{setStaffList([...staffList,{id:u.id,name:u.nickname||''}]);setStaffSearch('');setShowStaffResults(false);}}
                    className="w-full text-left px-4 py-3 hover:bg-[#f8f9fa] flex items-center gap-3 border-b border-[#f2f4f4] last:border-0 group">
                    <span className="material-symbols-rounded text-[#acb3b4] text-[18px]">person_add</span>
                    <div className="flex flex-col">
                      <p className="font-bold text-sm text-[#2d3435] group-hover:text-primary leading-tight">{u.nickname}</p>
                      {u.nativeNickname && <span className="text-[10px] text-[#acb3b4] font-medium leading-tight">{u.nativeNickname}</span>}
                    </div>
                  </button>
                ))}
              </div>
            )}
            {staffList.length>0&&(
              <div className="flex flex-wrap gap-2 mt-3 p-3 bg-[#f8f9fa] rounded-xl border border-[#e0e4e5]">
                {staffList.map(s=>(<div key={s.id} className="flex items-center gap-1.5 bg-white border border-[#e0e4e5] px-3 py-1.5 rounded-full shadow-sm"><span className="text-[11px] font-bold text-[#2d3435]">{s.name}</span><button onClick={()=>setStaffList(staffList.filter(x=>x.id!==s.id))} className="text-[#acb3b4] hover:text-red-500"><span className="material-symbols-rounded text-[14px]">cancel</span></button></div>))}
              </div>
            )}
          </div>
        </Section>

        {/* 6. Programs */}
        <ProgramEditor programs={programs} onChange={setPrograms} />

        {/* 6.5 Gallery Images */}
        <Section icon="photo_library" label="Gallery Images">
          <div className="grid grid-cols-4 gap-2">
            {galleryImages.map((url, i) => url && (
              <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-[#e0e4e5]">
                <img src={url} alt="" className="w-full h-full object-cover" />
                <button onClick={() => setGalleryImages(galleryImages.filter((_,j) => j!==i))} className="absolute top-1 right-1 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center">
                  <span className="material-symbols-rounded text-white text-xs">close</span>
                </button>
              </div>
            ))}
            <label className="aspect-square rounded-lg border-2 border-dashed border-[#d0d5d6] flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors">
              <span className="material-symbols-rounded text-2xl text-[#acb3b4]">add_photo_alternate</span>
              <span className="text-[9px] text-[#acb3b4] mt-1">Add Photos</span>
              <input type="file" accept="image/*" multiple className="hidden" onChange={async (e) => {
                const files = Array.from(e.target.files || []);
                for (const file of files) {
                  const url = await storageService.uploadFile(file, `events/gallery/${Date.now()}_${file.name}`);
                  setGalleryImages(prev => [...prev, url]);
                }
                e.target.value = '';
              }} />
            </label>
          </div>
        </Section>

        {/* 6.6 Artists */}
        <Section icon="mic_external_on" label="Artists">
          {artists.map((a, i) => (
            <div key={i} className="p-3 border border-[#e0e4e5] rounded-xl space-y-2 relative">
              <button onClick={() => setArtists(artists.filter((_,j) => j!==i))} className="absolute top-2 right-2 text-red-400 hover:text-red-600"><span className="material-symbols-rounded text-lg">delete</span></button>
              <div className="flex gap-3">
                <label className="w-20 h-24 rounded-lg overflow-hidden border border-[#e0e4e5] flex-shrink-0 cursor-pointer relative">
                  {a.photoUrl ? <img src={a.photoUrl} alt="" className="w-full h-full object-cover" /> :
                    <div className="w-full h-full flex flex-col items-center justify-center bg-[#f8f9fa]"><span className="material-symbols-rounded text-xl text-[#acb3b4]">add_a_photo</span><span className="text-[8px] text-[#acb3b4] mt-0.5">Photo</span></div>}
                  <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                    const file = e.target.files?.[0]; if (!file) return;
                    const url = await storageService.uploadFile(file, `events/artists/${Date.now()}_${file.name}`);
                    const c=[...artists]; c[i]={...c[i], photoUrl: url}; setArtists(c);
                  }} />
                </label>
                <div className="flex-1 space-y-2">
                  <div className={boxCls}><input value={a.name} onChange={e => { const c=[...artists]; c[i]={...c[i], name: e.target.value}; setArtists(c); }} className={inputCls} placeholder="Name" /></div>
                  <select value={a.role} onChange={e => { const c=[...artists]; c[i]={...c[i], role: e.target.value as any}; setArtists(c); }} className={`${boxCls} ${inputCls} appearance-none`}>
                    <option value="maestro">Maestro</option><option value="dj">DJ</option><option value="performer">Performer</option>
                  </select>
                  <div className="grid grid-cols-2 gap-2">
                    <div className={boxCls}><input value={a.country||''} onChange={e => { const c=[...artists]; c[i]={...c[i], country: e.target.value}; setArtists(c); }} className={inputCls} placeholder="Country" /></div>
                    <div className={boxCls}><input value={a.bio||''} onChange={e => { const c=[...artists]; c[i]={...c[i], bio: e.target.value}; setArtists(c); }} className={inputCls} placeholder="Bio" /></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
          <button onClick={() => setArtists([...artists, { id: `a${Date.now()}`, name: '', role: 'maestro' }])} className="flex items-center gap-1 text-primary text-xs font-bold hover:underline"><span className="material-symbols-rounded text-sm">add</span>Add Artist</button>
        </Section>

        {/* 6.7 Event Venues */}
        <Section icon="festival" label="Event Venues">
          {eventVenues.map((v, i) => (
            <div key={i} className="p-3 border border-[#e0e4e5] rounded-xl space-y-2 relative">
              <button onClick={() => setEventVenues(eventVenues.filter((_,j) => j!==i))} className="absolute top-2 right-2 text-red-400 hover:text-red-600"><span className="material-symbols-rounded text-lg">delete</span></button>
              <label className="block aspect-[16/9] rounded-lg overflow-hidden border border-[#e0e4e5] cursor-pointer">
                {v.photoUrl ? <img src={v.photoUrl} alt="" className="w-full h-full object-cover" /> :
                  <div className="w-full h-full flex flex-col items-center justify-center bg-[#f8f9fa]"><span className="material-symbols-rounded text-3xl text-[#acb3b4]">add_a_photo</span><span className="text-[10px] text-[#acb3b4] mt-1">Venue Photo</span></div>}
                <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                  const file = e.target.files?.[0]; if (!file) return;
                  const url = await storageService.uploadFile(file, `events/venues/${Date.now()}_${file.name}`);
                  const c=[...eventVenues]; c[i]={...c[i], photoUrl: url}; setEventVenues(c);
                }} />
              </label>
              <div className={boxCls}><input value={v.name} onChange={e => { const c=[...eventVenues]; c[i]={...c[i], name: e.target.value}; setEventVenues(c); }} className={inputCls} placeholder="Venue Name" /></div>
              <div className={boxCls}><input value={v.address||''} onChange={e => { const c=[...eventVenues]; c[i]={...c[i], address: e.target.value}; setEventVenues(c); }} className={inputCls} placeholder="Address" /></div>
            </div>
          ))}
          <button onClick={() => setEventVenues([...eventVenues, { id: `v${Date.now()}`, name: '' }])} className="flex items-center gap-1 text-primary text-xs font-bold hover:underline"><span className="material-symbols-rounded text-sm">add</span>Add Venue</button>
        </Section>

        {/* 6.8 Packages */}
        <Section icon="confirmation_number" label="Packages">
          {packages.map((pkg, i) => (
            <div key={i} className="p-3 border border-[#e0e4e5] rounded-xl space-y-2 relative">
              <button onClick={() => setPackages(packages.filter((_,j) => j!==i))} className="absolute top-2 right-2 text-red-400 hover:text-red-600"><span className="material-symbols-rounded text-lg">delete</span></button>
              <div className="flex gap-3">
                <label className="w-24 h-24 rounded-lg overflow-hidden border border-[#e0e4e5] flex-shrink-0 cursor-pointer relative">
                  {pkg.photoUrl ? <img src={pkg.photoUrl} alt="" className="w-full h-full object-cover" /> :
                    <div className="w-full h-full flex flex-col items-center justify-center bg-[#f8f9fa]"><span className="material-symbols-rounded text-2xl text-[#acb3b4]">add_a_photo</span><span className="text-[8px] text-[#acb3b4] mt-0.5">Package Photo</span></div>}
                  <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                    const file = e.target.files?.[0]; if (!file) return;
                    const url = await storageService.uploadFile(file, `events/packages/${Date.now()}_${file.name}`);
                    const c=[...packages]; c[i]={...c[i], photoUrl: url}; setPackages(c);
                  }} />
                </label>
                <div className="flex-1 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div className={boxCls}><input value={pkg.name} onChange={e => { const c=[...packages]; c[i]={...c[i], name: e.target.value}; setPackages(c); }} className={inputCls} placeholder="Package Name" /></div>
                    <select value={pkg.type||'single'} onChange={e => { const c=[...packages]; c[i]={...c[i], type: e.target.value as any}; setPackages(c); }} className={`${boxCls} ${inputCls} appearance-none`}>
                      <option value="single">Single</option><option value="couple">Couple</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className={boxCls}><input type="number" value={pkg.price||''} onChange={e => { const c=[...packages]; c[i]={...c[i], price: parseInt(e.target.value)||0}; setPackages(c); }} className={inputCls} placeholder="Price" /></div>
                    <div className={boxCls}><input type="number" value={pkg.priceUsd||''} onChange={e => { const c=[...packages]; c[i]={...c[i], priceUsd: parseFloat(e.target.value)||0}; setPackages(c); }} className={inputCls} placeholder="USD Price" /></div>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className={boxCls}><input type="number" value={pkg.totalTickets||''} onChange={e => { const c=[...packages]; c[i]={...c[i], totalTickets: parseInt(e.target.value)||0}; setPackages(c); }} className={inputCls} placeholder="Total Tickets" /></div>
                <div className={boxCls}><input type="number" value={pkg.includedWorkshopCount||''} onChange={e => { const c=[...packages]; c[i]={...c[i], includedWorkshopCount: parseInt(e.target.value)||0}; setPackages(c); }} className={inputCls} placeholder="Workshops #" /></div>
              </div>
              <Field label="Included Items (one per line)">
                <div className={boxCls}><textarea value={(pkg.includedItems||[]).join('\n')} onChange={e => { const c=[...packages]; c[i]={...c[i], includedItems: e.target.value.split('\n')}; setPackages(c); }} className={`${inputCls} min-h-[60px] resize-none`} placeholder={"Championship Final - June 20th\nICP Gala Dinner"} /></div>
              </Field>
            </div>
          ))}
          <button onClick={() => setPackages([...packages, { id: `p${Date.now()}`, name: '', price: 0, includedItems: [] }])} className="flex items-center gap-1 text-primary text-xs font-bold hover:underline"><span className="material-symbols-rounded text-sm">add</span>Add Package</button>
        </Section>

        {/* 6.9 Schedule Days */}
        <Section icon="calendar_month" label="Schedule Days">
          {scheduleDays.map((day, i) => (
            <div key={i} className="p-3 border border-[#e0e4e5] rounded-xl space-y-2 relative">
              <button onClick={() => setScheduleDays(scheduleDays.filter((_,j) => j!==i))} className="absolute top-1 right-1 text-red-400 hover:text-red-600"><span className="material-symbols-rounded text-lg">delete</span></button>
              <div className="flex gap-2">
                <div className={boxCls + ' w-24'}><input value={day.dayLabel} onChange={e => { const c=[...scheduleDays]; c[i]={...c[i], dayLabel: e.target.value}; setScheduleDays(c); }} className={inputCls} placeholder="Day 1" /></div>
                <div className={boxCls + ' flex-1'}><input type="date" value={day.date||''} onChange={e => { const c=[...scheduleDays]; c[i]={...c[i], date: e.target.value}; setScheduleDays(c); }} className={inputCls} /></div>
              </div>
              <label className="block aspect-[16/9] rounded-lg overflow-hidden border border-[#e0e4e5] cursor-pointer">
                {day.timetableImageUrl ? <img src={day.timetableImageUrl} alt="" className="w-full h-full object-cover" /> :
                  <div className="w-full h-full flex flex-col items-center justify-center bg-[#f8f9fa]"><span className="material-symbols-rounded text-3xl text-[#acb3b4]">add_a_photo</span><span className="text-[10px] text-[#acb3b4] mt-1">Timetable Image</span></div>}
                <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                  const file = e.target.files?.[0]; if (!file) return;
                  const url = await storageService.uploadFile(file, `events/schedule/${Date.now()}_${file.name}`);
                  const c=[...scheduleDays]; c[i]={...c[i], timetableImageUrl: url}; setScheduleDays(c);
                }} />
              </label>
            </div>
          ))}
          <button onClick={() => setScheduleDays([...scheduleDays, { dayLabel: `Day ${scheduleDays.length+1}` }])} className="flex items-center gap-1 text-primary text-xs font-bold hover:underline"><span className="material-symbols-rounded text-sm">add</span>Add Day</button>
        </Section>

        {/* 7. Pricing */}
        <Section icon="payments" label={t('event.pricing_label')}>
          <Field label={t('event.currency_label')}>
            <div className={boxCls}>
              <select value={currency} onChange={e=>setCurrency(e.target.value)} className={`${inputCls} appearance-none`}>
                <option value="KRW">KRW</option><option value="USD">USD</option><option value="EUR">EUR</option><option value="JPY">JPY</option>
              </select>
            </div>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t('event.class_advance_label')}><div className={boxCls}><input type="number" value={classAdv||''} onChange={e=>setClassAdv(parseInt(e.target.value)||0)} className={inputCls} placeholder="0"/></div></Field>
            <Field label={t('event.class_door_label')}><div className={boxCls}><input type="number" value={classDoor||''} onChange={e=>setClassDoor(parseInt(e.target.value)||0)} className={inputCls} placeholder="0"/></div></Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t('event.milonga_advance_label')}><div className={boxCls}><input type="number" value={milongaAdv||''} onChange={e=>setMilongaAdv(parseInt(e.target.value)||0)} className={inputCls} placeholder="0"/></div></Field>
            <Field label={t('event.milonga_door_label')}><div className={boxCls}><input type="number" value={milongaDoor||''} onChange={e=>setMilongaDoor(parseInt(e.target.value)||0)} className={inputCls} placeholder="0"/></div></Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t('event.full_pass_advance_label')}><div className={boxCls}><input type="number" value={fullPassAdv||''} onChange={e=>setFullPassAdv(parseInt(e.target.value)||0)} className={inputCls} placeholder="0"/></div></Field>
            <Field label={t('event.full_pass_door_label')}><div className={boxCls}><input type="number" value={fullPassDoor||''} onChange={e=>setFullPassDoor(parseInt(e.target.value)||0)} className={inputCls} placeholder="0"/></div></Field>
          </div>
          <Field label={t('event.full_pass_label_label')}><div className={boxCls}><input value={fullPassLabel} onChange={e=>setFullPassLabel(e.target.value)} className={inputCls} placeholder={t('event.full_pass_label_placeholder')}/></div></Field>
          <Field label={t('event.early_bird_deadline_label')}><div className={boxCls}><input type="date" value={earlyBird} onChange={e=>setEarlyBird(e.target.value)} className={inputCls}/></div></Field>
        </Section>

        {/* 8. Extra */}
        <Section icon="tune" label={t('event.additional_details_label')}>
          <Field label={t('event.dress_code_label')}><div className={boxCls}><input value={dressCode} onChange={e=>setDressCode(e.target.value)} className={inputCls} placeholder={t('event.dress_code_placeholder')}/></div></Field>
          <Field label={t('event.website_url_label')}><div className={boxCls}><input value={websiteUrl} onChange={e=>setWebsiteUrl(e.target.value)} className={inputCls} placeholder="https://..." type="url"/></div></Field>
          <Field label={t('event.registration_url_label')}><div className={boxCls}><input value={registrationUrl} onChange={e=>setRegistrationUrl(e.target.value)} className={inputCls} placeholder="e.g. tally.so link" type="url"/></div></Field>
          <Field label={t('event.bank_info_label')}><div className={boxCls}><input value={bankInfo} onChange={e=>setBankInfo(e.target.value)} className={inputCls} placeholder={t('event.bank_info_placeholder')}/></div></Field>
        </Section>
      </main>
    </div>
  );
}
