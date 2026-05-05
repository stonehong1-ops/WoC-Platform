'use client';
import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { useLocation } from '@/components/providers/LocationProvider';
import { eventService } from '@/lib/firebase/eventService';
import { venueService } from '@/lib/firebase/venueService';
import { userService } from '@/lib/firebase/userService';
import { storageService } from '@/lib/firebase/storageService';
import { Event, EventCategory, EventProgram, EventPricing } from '@/types/event';
import { Venue } from '@/types/venue';
import { PlatformUser } from '@/types/user';
import { Timestamp } from 'firebase/firestore';
import ProgramEditor from './ProgramEditor';
import { syncMilongasToSocial, deleteLinkedSocials } from '@/lib/firebase/syncMilongaToSocial';

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
    } catch (e) { console.error(e); alert('Save failed.'); }
    finally { setIsSubmitting(false); }
  };

  const handleDelete = async () => {
    if (!eventData?.id || !confirm('Delete this event?')) return;
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
          <h1 className="text-lg font-black font-headline text-[#2d3435]">{eventData ? 'Edit Event' : 'Create Event'}</h1>
        </div>
        <div className="flex items-center gap-2">
          {eventData && (
            <button onClick={handleDelete} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-red-50 text-red-500"><span className="material-symbols-rounded">delete</span></button>
          )}
          <button onClick={handleSave} disabled={isSubmitting}
            className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-full hover:bg-primary/90 transition-colors disabled:opacity-50 font-bold text-sm shadow-sm">
            <span className="material-symbols-rounded text-[18px]">{isSubmitting?'sync':'done'}</span>Save
          </button>
        </div>
      </header>

      <main className="pt-20 pb-4 max-w-2xl mx-auto px-4 space-y-5">
        {/* 1. Gallery */}
        <Section icon="image" label="Poster & Gallery">
          <div className="py-4 px-8 border border-[#e0e4e5] rounded-xl bg-[#f8f9fa] flex justify-center">
            <div onClick={()=>fileInputRef.current?.click()}
              className="relative aspect-[4/5] w-full max-w-[240px] rounded-lg overflow-hidden bg-white border border-[#e0e4e5] flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-all group shadow-sm">
              {images[0] ? (
                <><img className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src={images[0]} alt="poster"/><div className="absolute top-3 left-3 bg-primary text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded shadow-sm z-10">Primary</div></>
              ) : (
                <div className="flex flex-col items-center text-[#acb3b4] group-hover:text-primary transition-colors">
                  <span className="material-symbols-rounded text-4xl mb-2">add_photo_alternate</span>
                  <span className="text-xs font-bold">Upload Poster</span>
                </div>
              )}
            </div>
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={e=>{const f=e.target.files?.[0];if(f){setImages([URL.createObjectURL(f)]);setImageFile(f);}}}/>
        </Section>

        {/* 2. Basic Info */}
        <Section icon="info" label="Basic Info">
          <Field label="Event Title (EN)"><div className={boxCls}><input value={title} onChange={e=>setTitle(e.target.value)} className={inputCls} placeholder="e.g. Seoul Tango Festival 2026"/></div></Field>
          <Field label="Native Title"><div className={boxCls}><input value={titleNative} onChange={e=>setTitleNative(e.target.value)} className={inputCls} placeholder="e.g. 서울 탱고 페스티벌 2026"/></div></Field>
          <Field label="Description"><div className={boxCls}><textarea value={description} onChange={e=>setDescription(e.target.value)} className={`${inputCls} min-h-[80px] resize-none`} placeholder="Tell us about this event..."/></div></Field>
          <Field label="Category">
            <div className="flex flex-wrap gap-2">
              {categories.map(c=>(
                <button key={c} onClick={()=>setCategory(c)} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${category===c?'bg-primary text-white border-primary shadow-sm':'bg-[#f8f9fa] text-[#acb3b4] border-[#e0e4e5] hover:border-primary/50'}`}>{c}</button>
              ))}
            </div>
          </Field>
        </Section>

        {/* 3. Date */}
        <Section icon="schedule" label="Date">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Start Date"><div className={boxCls}><input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} className={inputCls}/></div></Field>
            <Field label="End Date"><div className={boxCls}><input type="date" value={endDate} onChange={e=>setEndDate(e.target.value)} className={inputCls}/></div></Field>
          </div>
        </Section>

        {/* 4. Location */}
        <Section icon="location_on" label="Location" z={40}>
          <div className="relative z-50">
            <Field label="Venue">
              <div className={boxCls}>
                <span className="material-symbols-rounded text-[#acb3b4] mr-2">search</span>
                <input value={venueName} onChange={e=>handleVenueSearch(e.target.value)}
                  onFocus={()=>venueName.length>=1&&setShowVenueResults(venueResults.length>0)}
                  onBlur={()=>setTimeout(()=>setShowVenueResults(false),200)}
                  className={inputCls} placeholder="Search venue..." />
              </div>
            </Field>
            {showVenueResults && (
              <div className="absolute top-full left-0 w-full mt-1 bg-white border border-[#e0e4e5] rounded-xl shadow-lg z-50 overflow-hidden">
                {venueResults.map(v=>(
                  <button key={v.id} onClick={()=>handleSelectVenue(v)} className="w-full text-left px-4 py-3 hover:bg-[#f8f9fa] flex items-baseline gap-2 border-b border-[#f2f4f4] last:border-0">
                    <p className="font-bold text-[#2d3435] text-sm">{v.name}</p>
                    <span className="text-[10px] text-[#acb3b4] font-bold bg-[#f2f4f4] px-2 py-0.5 rounded-full">{v.city}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <Field label="Region">
            <button onClick={()=>openSelectorWithCallback((c,ci)=>{setFormCountry(c);setFormCity(ci);})}
              className="w-full flex items-center justify-between px-4 py-3 border border-[#e0e4e5] rounded-xl bg-[#f8f9fa] hover:bg-[#f2f4f4] transition-colors">
              <div className="flex items-center gap-2">
                <span className="material-symbols-rounded text-primary">public</span>
                <div className="text-left"><p className="text-sm font-bold text-[#2d3435]">{formCountry||'Select'}</p><p className="text-[10px] font-medium text-[#acb3b4]">{formCity||'Select'}</p></div>
              </div>
              <span className="material-symbols-rounded text-[#acb3b4]">chevron_right</span>
            </button>
          </Field>
        </Section>

        {/* 5. Staff */}
        <Section icon="group" label="Roles & Staff" z={30}>
          <Field label="Host Name"><div className={boxCls}><span className="material-symbols-rounded text-[#acb3b4] mr-2">person_filled</span><input value={hostName} onChange={e=>setHostName(e.target.value)} className={inputCls} placeholder="Host name"/></div></Field>
          <div className="relative z-10">
            <Field label="Staff">
              <div className={boxCls}>
                <span className="material-symbols-rounded text-[#acb3b4] mr-2">person_add</span>
                <input value={staffSearch} onChange={e=>{
                  setStaffSearch(e.target.value);
                  if(e.target.value.length>=1){const l=e.target.value.toLowerCase();const f=allUsers.filter(u=>!staffList.find(s=>s.id===u.id)&&(u.nickname?.toLowerCase().includes(l)));setStaffResults(f.slice(0,6));setShowStaffResults(f.length>0);}else setShowStaffResults(false);
                }} onBlur={()=>setTimeout(()=>setShowStaffResults(false),200)} className={inputCls} placeholder="Search staff..."/>
              </div>
            </Field>
            {showStaffResults&&(
              <div className="absolute top-full left-0 w-full mt-1 bg-white border border-[#e0e4e5] rounded-xl shadow-lg z-50 overflow-hidden">
                {staffResults.map(u=>(<button key={u.id} onClick={()=>{setStaffList([...staffList,{id:u.id,name:u.nickname||''}]);setStaffSearch('');setShowStaffResults(false);}} className="w-full text-left px-4 py-3 hover:bg-[#f8f9fa] border-b border-[#f2f4f4] last:border-0"><p className="font-bold text-sm text-[#2d3435]">{u.nickname}</p></button>))}
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

        {/* 7. Pricing */}
        <Section icon="payments" label="Pricing">
          <Field label="Currency">
            <div className={boxCls}>
              <select value={currency} onChange={e=>setCurrency(e.target.value)} className={`${inputCls} appearance-none`}>
                <option value="KRW">KRW</option><option value="USD">USD</option><option value="EUR">EUR</option><option value="JPY">JPY</option>
              </select>
            </div>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Class Advance"><div className={boxCls}><input type="number" value={classAdv||''} onChange={e=>setClassAdv(parseInt(e.target.value)||0)} className={inputCls} placeholder="0"/></div></Field>
            <Field label="Class Door"><div className={boxCls}><input type="number" value={classDoor||''} onChange={e=>setClassDoor(parseInt(e.target.value)||0)} className={inputCls} placeholder="0"/></div></Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Milonga Advance"><div className={boxCls}><input type="number" value={milongaAdv||''} onChange={e=>setMilongaAdv(parseInt(e.target.value)||0)} className={inputCls} placeholder="0"/></div></Field>
            <Field label="Milonga Door"><div className={boxCls}><input type="number" value={milongaDoor||''} onChange={e=>setMilongaDoor(parseInt(e.target.value)||0)} className={inputCls} placeholder="0"/></div></Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Full Pass Advance"><div className={boxCls}><input type="number" value={fullPassAdv||''} onChange={e=>setFullPassAdv(parseInt(e.target.value)||0)} className={inputCls} placeholder="0"/></div></Field>
            <Field label="Full Pass Door"><div className={boxCls}><input type="number" value={fullPassDoor||''} onChange={e=>setFullPassDoor(parseInt(e.target.value)||0)} className={inputCls} placeholder="0"/></div></Field>
          </div>
          <Field label="Full Pass Label"><div className={boxCls}><input value={fullPassLabel} onChange={e=>setFullPassLabel(e.target.value)} className={inputCls} placeholder="e.g. All Classes + Milongas"/></div></Field>
          <Field label="Early Bird Deadline"><div className={boxCls}><input type="date" value={earlyBird} onChange={e=>setEarlyBird(e.target.value)} className={inputCls}/></div></Field>
        </Section>

        {/* 8. Extra */}
        <Section icon="tune" label="Additional Details">
          <Field label="Dress Code"><div className={boxCls}><input value={dressCode} onChange={e=>setDressCode(e.target.value)} className={inputCls} placeholder="e.g. Elegant"/></div></Field>
          <Field label="Website URL"><div className={boxCls}><input value={websiteUrl} onChange={e=>setWebsiteUrl(e.target.value)} className={inputCls} placeholder="https://..." type="url"/></div></Field>
          <Field label="Registration URL"><div className={boxCls}><input value={registrationUrl} onChange={e=>setRegistrationUrl(e.target.value)} className={inputCls} placeholder="e.g. tally.so link" type="url"/></div></Field>
          <Field label="Bank Info"><div className={boxCls}><input value={bankInfo} onChange={e=>setBankInfo(e.target.value)} className={inputCls} placeholder="Account info for transfer"/></div></Field>
        </Section>
      </main>
    </div>
  );
}
