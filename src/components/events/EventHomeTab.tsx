"use client";

import React, { useState, useEffect } from "react";
import { Event, EventArtist, EventVenueItem, EventPackage } from "@/types/event";
import { userService } from "@/lib/firebase/userService";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/clientApp";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";

interface Props {
  event: Event;
  onChatWithHost: () => void;
  canEdit?: boolean;
}

const getNormalizedDate = (val: any): Date => {
  if (!val) return new Date();
  if (typeof val.toDate === "function") return val.toDate();
  if (val instanceof Date) return val;
  try { return new Date(val); } catch { return new Date(); }
};

const ADMIN_UIDS = ['adminstone', '7iaZAmaYY9dNNEShmJmROI8XrtH2'];
const isStoneHongName = (name?: string | null): boolean => {
  if (!name) return false;
  const normalized = name.trim().toLowerCase().replace(/\s+/g, '');
  return ['stone', 'stonehong', '스톤', '스톤홍'].includes(normalized);
};

export default function EventHomeTab({ event, onChatWithHost, canEdit }: Props) {
  const { t, formatDate } = useLanguage();
  const [venue, setVenue] = useState<any>(null);
  const [hostProfile, setHostProfile] = useState<any>(null);
  const [galleryIdx, setGalleryIdx] = useState<number | null>(null);
  const [selectedArtist, setSelectedArtist] = useState<EventArtist | null>(null);
  const [activeScheduleDay, setActiveScheduleDay] = useState(0);
  const [selectedPackage, setSelectedPackage] = useState<EventPackage | null>(null);
  const [timetablePopupUrl, setTimetablePopupUrl] = useState<string | null>(null);

  useEffect(() => {
    if (event.venueId) {
      getDoc(doc(db, "venues", event.venueId)).then(snap => {
        if (snap.exists()) setVenue({ id: snap.id, ...snap.data() });
      }).catch(console.error);
    }
  }, [event.venueId]);

  useEffect(() => {
    if (event.hostId) {
      const isVirtualAdmin = ADMIN_UIDS.includes(event.hostId) && 
        ((event.hostName && !isStoneHongName(event.hostName)) || 
         (event.hostNameNative && !isStoneHongName(event.hostNameNative)));

      if (isVirtualAdmin) {
        setHostProfile(null);
        return;
      }

      userService.getUserById(event.hostId).then(setHostProfile).catch(console.error);
    }
  }, [event.hostId, event.hostName, event.hostNameNative]);

  const startDate = getNormalizedDate(event.startDate);
  const endDate = event.endDate ? getNormalizedDate(event.endDate) : startDate;
  const isMultiDay = startDate.getTime() !== endDate.getTime();
  const dateStr = isMultiDay
    ? `${formatDate(startDate, "shortMonthDay")} – ${formatDate(endDate, "dateOnly")}`
    : `${formatDate(startDate, "dateOnly")} (${formatDate(startDate, "shortWeekday")})`;

  const hostPhone = hostProfile?.phone || event.organizerPhone;
  const hostPhoto = hostProfile?.photoURL || event.hostPhoto;

  const handleCallHost = () => {
    if (hostProfile?.allowPhoneCalls === false) {
      toast.error(t('myinfo.phone_private_toast'));
      return;
    }
    window.location.href = `tel:${hostPhone}`;
  };

  // Map URLs
  const lat = venue?.coordinates?.latitude ?? venue?.coordinates?._lat;
  const lng = venue?.coordinates?.longitude ?? venue?.coordinates?._long;
  const addr = venue?.addressEn || venue?.address || "";
  const googleUrl = lat && lng ? `https://www.google.com/maps?q=${lat},${lng}` : addr ? `https://www.google.com/maps/search/${encodeURIComponent(addr)}` : null;
  const naverUrl = lat && lng ? `https://map.naver.com/v5/?c=${lng},${lat},15,0,0,0,dh` : addr ? `https://map.naver.com/v5/search/${encodeURIComponent(addr)}` : null;
  const kakaoUrl = lat && lng ? `https://map.kakao.com/link/map/${encodeURIComponent(event.venueName || "Venue")},${lat},${lng}` : addr ? `https://map.kakao.com/link/search/${encodeURIComponent(addr)}` : null;

  // Pricing summary
  const pricing = event.pricing;
  const currency = pricing?.currency || "KRW";
  const formatPrice = (n: number) => `${n.toLocaleString()} ${currency}`;

  // Count programs
  const classCount = event.programs?.filter(p => p.type === "class").length || 0;
  const milongaCount = event.programs?.filter(p => p.type === "milonga").length || 0;

  return (
    <>
    <div className="pb-8">
      {/* Event Overview */}
      <div className="mx-4 mt-4 border border-[#e0e4e5] rounded-2xl overflow-hidden">
        <div className="bg-[#f8f9fa] px-4 py-2.5 border-b border-[#e0e4e5] flex items-center gap-2">
          <span className="material-symbols-rounded text-sm text-primary">event</span>
          <p className="text-[10px] font-black text-primary uppercase tracking-widest">{t('event.overview')}</p>
        </div>
        <div className="px-4 py-4 space-y-3">
          <div className="flex items-start gap-3">
            <span className="material-symbols-rounded text-lg text-[#acb3b4]">calendar_today</span>
            <div><p className="text-xs font-bold text-[#2d3435]">{t('event.date')}</p><p className="text-xs text-[#596061]">{dateStr}</p></div>
          </div>
          <div className="flex items-start gap-3">
            <span className="material-symbols-rounded text-lg text-[#acb3b4]">location_on</span>
            <div><p className="text-xs font-bold text-[#2d3435]">{t('event.location')}</p><p className="text-xs text-[#596061]">{event.location}</p></div>
          </div>
          {(classCount > 0 || milongaCount > 0) && (
            <div className="flex items-start gap-3">
              <span className="material-symbols-rounded text-lg text-[#acb3b4]">school</span>
              <div>
                <p className="text-xs font-bold text-[#2d3435]">{t('event.program')}</p>
                <p className="text-xs text-[#596061]">
                  {classCount > 0 && `${classCount} ${t('event.classes')}`}
                  {classCount > 0 && milongaCount > 0 && " · "}
                  {milongaCount > 0 && `${milongaCount} ${t('event.milongas')}`}
                </p>
              </div>
            </div>
          )}
          {event.dressCode && (
            <div className="flex items-start gap-3">
              <span className="material-symbols-rounded text-lg text-[#acb3b4]">checkroom</span>
              <div><p className="text-xs font-bold text-[#2d3435]">{t('event.dress_code')}</p><p className="text-xs text-[#596061]">{event.dressCode}</p></div>
            </div>
          )}
        </div>
      </div>

      {/* Pricing Summary */}
      {pricing && (
        <div className="mx-4 mt-4 border border-[#e0e4e5] rounded-2xl overflow-hidden">
          <div className="bg-[#f8f9fa] px-4 py-2.5 border-b border-[#e0e4e5] flex items-center gap-2">
            <span className="material-symbols-rounded text-sm text-primary">payments</span>
            <p className="text-[10px] font-black text-primary uppercase tracking-widest">{t('event.pricing')}</p>
          </div>
          <div className="px-4 py-4 space-y-2">
            {pricing.fullPassPrice && (
              <div className="flex items-center justify-between py-2 border-b border-[#f2f4f4]">
                <div>
                  <p className="text-xs font-bold text-[#2d3435]">{t('event.full_pass')}</p>
                  {pricing.fullPassPrice.label && <p className="text-[10px] text-[#acb3b4]">{pricing.fullPassPrice.label}</p>}
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-primary">{formatPrice(pricing.fullPassPrice.advance)}</p>
                  {pricing.fullPassPrice.door && <p className="text-[10px] text-[#acb3b4] line-through">{formatPrice(pricing.fullPassPrice.door)}</p>}
                </div>
              </div>
            )}
            {pricing.classPrice && (
              <div className="flex items-center justify-between py-2 border-b border-[#f2f4f4]">
                <p className="text-xs font-bold text-[#2d3435]">{t('event.class')}</p>
                <div className="text-right">
                  <p className="text-xs font-bold text-[#2d3435]">{formatPrice(pricing.classPrice.advance)}</p>
                  {pricing.classPrice.door && <p className="text-[10px] text-[#acb3b4]">{t('event.door')}: {formatPrice(pricing.classPrice.door)}</p>}
                </div>
              </div>
            )}
            {pricing.milongaPrice && (
              <div className="flex items-center justify-between py-2 border-b border-[#f2f4f4]">
                <p className="text-xs font-bold text-[#2d3435]">{t('event.milonga')}</p>
                <div className="text-right">
                  <p className="text-xs font-bold text-[#2d3435]">{formatPrice(pricing.milongaPrice.advance)}</p>
                  {pricing.milongaPrice.door && <p className="text-[10px] text-[#acb3b4]">{t('event.door')}: {formatPrice(pricing.milongaPrice.door)}</p>}
                </div>
              </div>
            )}
            {pricing.privateLessonPrice && (
              <div className="flex items-center justify-between py-2">
                <p className="text-xs font-bold text-[#2d3435]">{t('event.private_lesson')}</p>
                <p className="text-xs font-bold text-[#2d3435]">{formatPrice(pricing.privateLessonPrice)}</p>
              </div>
            )}
            {pricing.multiClassDiscount && pricing.multiClassDiscount.length > 0 && (
              <div className="mt-2 bg-amber-50 rounded-xl px-3 py-2">
                {pricing.multiClassDiscount.map((d, i) => (
                  <p key={i} className="text-[10px] font-bold text-amber-700">
                    📌 {d.minClasses}+ {t('event.classes_count')} → {d.discountPercent}% {t('event.discount_off')}
                  </p>
                ))}
              </div>
            )}
            {pricing.earlyBirdDeadline && (
              <div className="mt-1 bg-blue-50 rounded-xl px-3 py-2">
                <p className="text-[10px] font-bold text-blue-700">
                  🐥 {t('event.early_bird')} {pricing.earlyBirdDeadline}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══ GALLERY ═══ */}
      {event.galleryImages && event.galleryImages.length > 0 && (
        <div className="mx-4 mt-4 border border-[#e0e4e5] rounded-2xl overflow-hidden">
          <div className="bg-[#f8f9fa] px-4 py-2.5 border-b border-[#e0e4e5] flex items-center gap-2">
            <span className="material-symbols-rounded text-sm text-primary">photo_library</span>
            <p className="text-[10px] font-black text-primary uppercase tracking-widest">Gallery</p>
            <span className="ml-auto text-[10px] font-bold text-[#acb3b4]">{event.galleryImages.length} photos</span>
          </div>
          <div className="p-3 bg-[#111] grid grid-cols-3 gap-1.5 max-h-[320px] overflow-y-auto">
            {event.galleryImages.map((img, i) => (
              <div key={i} onClick={() => setGalleryIdx(i)}
                className="aspect-square rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity">
                <img src={img} alt={`Gallery ${i+1}`} className="w-full h-full object-cover" loading="lazy" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══ ARTISTS ═══ */}
      {event.artists && event.artists.length > 0 && (() => {
        const knownRoles = ['maestro', 'dj', 'performer'];
        const maestros = event.artists.filter(a => a.role === 'maestro');
        const djs = event.artists.filter(a => a.role === 'dj');
        const performers = event.artists.filter(a => a.role === 'performer');
        const others = event.artists.filter(a => !knownRoles.includes(a.role));
        const renderGroup = (title: string, list: typeof maestros) => list.length > 0 && (
          <div className="mt-3 first:mt-0">
            <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest mb-2 px-1">{title}</p>
            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
              {list.map((a, i) => (
                <div key={a.id || a.name || i} onClick={() => setSelectedArtist(a)}
                  className="flex-shrink-0 w-[140px] bg-[#1a1a1a] rounded-xl overflow-hidden cursor-pointer hover:ring-1 hover:ring-purple-500/50 transition-all">
                  <div className="aspect-[3/4] bg-[#222] overflow-hidden">
                    {a.photoUrl ? <img src={a.photoUrl} alt={a.name} className="w-full h-full object-cover" /> :
                      <div className="w-full h-full flex items-center justify-center"><span className="material-symbols-rounded text-3xl text-[#444]">person</span></div>}
                  </div>
                  <div className="p-2.5">
                    <p className="text-xs font-bold text-white truncate">{a.name}</p>
                    <p className="text-[10px] font-bold text-purple-400 capitalize">{a.role === 'maestro' ? 'The Maestro' : a.role === 'dj' ? 'DJ' : a.role === 'performer' ? 'Performer' : a.role}</p>
                    {a.country && <p className="text-[9px] text-[#888] mt-0.5">{a.country}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
        return (
          <div className="mx-4 mt-4 border border-[#e0e4e5] rounded-2xl overflow-hidden">
            <div className="bg-[#f8f9fa] px-4 py-2.5 border-b border-[#e0e4e5] flex items-center gap-2">
              <span className="material-symbols-rounded text-sm text-primary">mic_external_on</span>
              <p className="text-[10px] font-black text-primary uppercase tracking-widest">Artists</p>
            </div>
            <div className="p-3 bg-[#111]">
              {renderGroup('The Maestro', maestros)}
               {renderGroup('DJ', djs)}
               {renderGroup('Performer', performers)}
               {renderGroup('Featured', others)}
            </div>
          </div>
        );
      })()}

      {/* ═══ EVENT VENUES ═══ */}
      {event.eventVenues && event.eventVenues.length > 0 && (
        <div className="mx-4 mt-4 border border-[#e0e4e5] rounded-2xl overflow-hidden">
          <div className="bg-[#f8f9fa] px-4 py-2.5 border-b border-[#e0e4e5] flex items-center gap-2">
            <span className="material-symbols-rounded text-sm text-primary">festival</span>
            <p className="text-[10px] font-black text-primary uppercase tracking-widest">Event Venues</p>
          </div>
          <div className="p-3 bg-[#111] flex gap-3 overflow-x-auto no-scrollbar">
            {event.eventVenues.map(v => {
              const mapUrl = v.latitude && v.longitude
                ? `https://www.google.com/maps?q=${v.latitude},${v.longitude}`
                : v.address ? `https://www.google.com/maps/search/${encodeURIComponent(v.address)}` : null;
              return (
                <div key={v.id} className="flex-shrink-0 w-[260px] bg-[#1a1a1a] rounded-xl overflow-hidden">
                  <div className="aspect-[16/10] bg-[#222] overflow-hidden">
                    {v.photoUrl ? <img src={v.photoUrl} alt={v.name} className="w-full h-full object-cover" /> :
                      <div className="w-full h-full flex items-center justify-center"><span className="material-symbols-rounded text-3xl text-[#444]">location_on</span></div>}
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-bold text-white">{v.name}</p>
                    {v.address && <p className="text-[10px] text-[#999] mt-1 line-clamp-2">{v.address}</p>}
                    {mapUrl && (
                      <a href={mapUrl} target="_blank" rel="noopener noreferrer"
                        className="mt-2 flex items-center justify-center gap-1.5 w-full py-2 rounded-lg border border-[#333] text-[11px] font-bold text-[#ccc] hover:bg-[#222] transition-colors">
                        <span className="material-symbols-rounded text-sm">location_on</span>View Location on Map
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ═══ PACKAGES ═══ */}
      {event.packages && event.packages.length > 0 && (
        <div className="mx-4 mt-4 border border-[#e0e4e5] rounded-2xl overflow-hidden">
          <div className="bg-[#f8f9fa] px-4 py-2.5 border-b border-[#e0e4e5] flex items-center gap-2">
            <span className="material-symbols-rounded text-sm text-primary">confirmation_number</span>
            <p className="text-[10px] font-black text-primary uppercase tracking-widest">Packages</p>
          </div>
          <div className="p-3 bg-[#111] flex gap-3 overflow-x-auto no-scrollbar">
            {event.packages.map((pkg, idx) => {
              const avail = pkg.totalTickets ? pkg.totalTickets - (pkg.soldTickets || 0) : null;
              return (
                <div key={pkg.id || pkg.name || idx} onClick={() => setSelectedPackage(pkg)}
                  className="flex-shrink-0 w-[260px] bg-[#1a1a1a] border border-[#333] rounded-xl overflow-hidden flex flex-col cursor-pointer hover:border-purple-500/50 transition-all">
                  {pkg.photoUrl && (
                    <div className="aspect-[16/9] bg-[#222] overflow-hidden">
                      <img src={pkg.photoUrl} alt={pkg.name} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="p-4 flex-1 flex flex-col">
                    <div className="flex items-start justify-between mb-2">
                      <p className="text-sm font-bold text-white flex-1 pr-2">{pkg.name}</p>
                      {pkg.type && <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border border-purple-500/40 text-purple-400">{pkg.type}</span>}
                    </div>
                  {avail !== null && <p className="text-[10px] font-bold text-green-400 mb-2">{avail} ticket available</p>}
                  <div className="flex-1 space-y-1 mb-3 max-h-[120px] overflow-y-auto">
                     {pkg.includedItems ? pkg.includedItems.map((item, i) => (
                       <p key={i} className="text-[10px] text-[#999] flex items-start gap-1.5">
                         <span className="text-[#555] mt-px">•</span><span className="flex-1">{item}</span>
                       </p>
                     )) : pkg.description && (
                       <p className="text-[10px] text-[#999]">{pkg.description}</p>
                     )}
                  </div>
                  {pkg.includedWorkshopCount && <p className="text-[10px] font-bold text-purple-400 mb-2">Includes {pkg.includedWorkshopCount} workshops</p>}
                  <div className="flex items-end justify-between mt-auto pt-2 border-t border-[#333]">
                    <div>
                      <p className="text-base font-black text-white">{(pkg.price || 0).toLocaleString()}</p>
                      {pkg.priceUsd && <p className="text-[10px] text-[#888]">${pkg.priceUsd.toFixed(2)}</p>}
                    </div>
                    <span className="px-3 py-1.5 bg-purple-600 text-white text-[10px] font-bold rounded-full">Choose</span>
                  </div>
                </div>
              </div>
            );
            })}
          </div>
        </div>
      )}

      {/* ═══ SCHEDULE ═══ */}
      {event.scheduleDays && event.scheduleDays.length > 0 && (
        <div className="mx-4 mt-4 border border-[#e0e4e5] rounded-2xl overflow-hidden">
          <div className="bg-[#f8f9fa] px-4 py-2.5 border-b border-[#e0e4e5] flex items-center gap-2">
            <span className="material-symbols-rounded text-sm text-primary">calendar_month</span>
            <p className="text-[10px] font-black text-primary uppercase tracking-widest">Schedule</p>
          </div>
          <div className="bg-[#111]">
            <div className="flex gap-1 p-2 border-b border-[#222]">
              {event.scheduleDays?.map((day, i) => (
                <button key={i} onClick={() => setActiveScheduleDay(i)}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${activeScheduleDay === i ? 'bg-purple-600 text-white' : 'text-[#888] hover:bg-[#222]'}`}>
                  {day.dayLabel || day.label}
                </button>
              ))}
            </div>
            <div className="p-3">
              {event.scheduleDays[activeScheduleDay]?.timetableImageUrl ? (
                <div className="relative group cursor-zoom-in" onClick={() => event.scheduleDays?.[activeScheduleDay]?.timetableImageUrl && setTimetablePopupUrl(event.scheduleDays[activeScheduleDay].timetableImageUrl)}>
                  <img src={event.scheduleDays?.[activeScheduleDay]?.timetableImageUrl} alt={event.scheduleDays?.[activeScheduleDay]?.dayLabel}
                    className="w-full rounded-lg" />
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-lg">
                    <span className="material-symbols-rounded text-white">zoom_in</span>
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center text-[#666] text-xs">No timetable image</div>
              )}
              {event.scheduleDays[activeScheduleDay]?.date && (
                <p className="text-[10px] text-[#888] text-center mt-2">{event.scheduleDays[activeScheduleDay].date}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Venue / Location */}
      <div className="mx-4 mt-4 border border-[#e0e4e5] rounded-2xl overflow-hidden">
        <div className="bg-[#f8f9fa] px-4 py-2.5 border-b border-[#e0e4e5] flex items-center gap-2">
          <span className="material-symbols-rounded text-sm text-primary">location_on</span>
          <p className="text-[10px] font-black text-primary uppercase tracking-widest">{t('event.venue')}</p>
        </div>
        <div className="px-4 py-4">
          <p className="text-sm font-bold text-[#2d3435]">{event.venueName || event.location}</p>
          {event.venueNameNative && <p className="text-[10px] font-bold text-[#acb3b4] mt-0.5">{event.venueNameNative}</p>}
          <div className="mt-2">
            {venue?.addressEn && <p className="text-xs text-[#596061]">{venue.addressEn}</p>}
            {venue?.address && <p className="text-[10px] text-[#acb3b4] mt-0.5">{venue.address}</p>}
          </div>
          {(googleUrl || naverUrl || kakaoUrl) && (
            <div className="flex items-center gap-2 mt-3">
              {googleUrl && (
                <a href={googleUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#f2f4f4] text-[10px] font-bold text-[#596061] hover:bg-[#e8eaec] transition-colors">
                  <span className="material-symbols-rounded text-sm">map</span>Google
                </a>
              )}
              {naverUrl && (
                <a href={naverUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#2DB400]/10 text-[10px] font-bold text-[#2DB400] hover:bg-[#2DB400]/20 transition-colors">
                  <span className="text-xs font-black">N</span>Naver
                </a>
              )}
              {kakaoUrl && (
                <a href={kakaoUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#FEE500]/30 text-[10px] font-bold text-[#3C1E1E] hover:bg-[#FEE500]/50 transition-colors">
                  <span className="text-xs font-black">K</span>Kakao
                </a>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Host / Organizer */}
      <div className="mx-4 mt-4 border border-[#e0e4e5] rounded-2xl overflow-hidden">
        <div className="bg-[#f8f9fa] px-4 py-2.5 border-b border-[#e0e4e5] flex items-center gap-2">
          <span className="material-symbols-rounded text-sm text-primary">person</span>
          <p className="text-[10px] font-black text-primary uppercase tracking-widest">{t('event.organizer')}</p>
        </div>
        <div className="px-4 py-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                {hostPhoto ? <img src={hostPhoto} className="w-full h-full object-cover" alt="" /> :
                  <span className="material-symbols-rounded text-lg text-primary">person</span>}
              </div>
              <div>
                <p className="text-sm font-bold text-[#2d3435]">{event.hostNameNative || event.hostName}</p>
                <p className="text-[10px] text-[#acb3b4] font-bold uppercase">{t('event.organizer')}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {hostPhone && (
                <button onClick={handleCallHost} className="w-9 h-9 rounded-full bg-[#f2f4f4] flex items-center justify-center">
                  <span className="material-symbols-rounded text-lg text-[#596061]">call</span>
                </button>
              )}
              <button onClick={onChatWithHost} className="w-9 h-9 rounded-full bg-[#f2f4f4] flex items-center justify-center">
                <span className="material-symbols-rounded text-lg text-[#596061]">chat</span>
              </button>
            </div>
          </div>
          {event.staffNames && event.staffNames.length > 0 && (
            <div className="border-t border-[#f2f4f4] pt-3 space-y-2">
              {event.staffNames.map((name, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                    <span className="material-symbols-rounded text-sm text-[#acb3b4]">person</span>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#2d3435]">{name}</p>
                    <p className="text-[10px] text-[#acb3b4]">{t('event.staff')}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* External Links */}
      {(event.websiteUrl || event.registrationUrl || event.bankInfo) && (
        <div className="mx-4 mt-4 border border-[#e0e4e5] rounded-2xl overflow-hidden">
          <div className="bg-[#f8f9fa] px-4 py-2.5 border-b border-[#e0e4e5] flex items-center gap-2">
            <span className="material-symbols-rounded text-sm text-primary">link</span>
            <p className="text-[10px] font-black text-primary uppercase tracking-widest">{t('event.links_info')}</p>
          </div>
          <div className="px-4 py-4 space-y-3">
            {event.websiteUrl && (
              <a href={event.websiteUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs font-bold text-primary hover:underline">
                <span className="material-symbols-rounded text-sm">language</span>{t('event.website')}
              </a>
            )}
            {event.registrationUrl && (
              <a href={event.registrationUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs font-bold text-primary hover:underline">
                <span className="material-symbols-rounded text-sm">open_in_new</span>{t('event.external_reg')}
              </a>
            )}
            {event.bankInfo && (
              <div className="bg-[#f8f9fa] rounded-xl px-3 py-2">
                <p className="text-[10px] font-bold text-[#acb3b4] uppercase mb-1">{t('event.bank_info')}</p>
                <p className="text-xs text-[#596061] whitespace-pre-wrap">{event.bankInfo}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>

      {/* ═══ POPUP: Gallery Fullscreen ═══ */}
      {galleryIdx !== null && event.galleryImages && (
        <div className="fixed inset-0 z-[300] bg-black flex flex-col animate-in fade-in duration-200">
          <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4">
            <span className="text-white text-xs font-bold">{galleryIdx + 1} / {event.galleryImages.length}</span>
            <button onClick={() => setGalleryIdx(null)} className="w-10 h-10 rounded-full bg-black/40 text-white flex items-center justify-center">
              <span className="material-symbols-rounded text-2xl">close</span>
            </button>
          </div>
          <div className="flex-1 flex items-center justify-center px-4">
            <img src={event.galleryImages[galleryIdx]} alt="" className="max-w-full max-h-[80vh] object-contain" />
          </div>
          <div className="flex items-center justify-center gap-4 pb-8">
            <button onClick={() => setGalleryIdx(Math.max(0, galleryIdx - 1))} disabled={galleryIdx === 0}
              className="w-12 h-12 rounded-full bg-white/10 text-white flex items-center justify-center disabled:opacity-30">
              <span className="material-symbols-rounded">chevron_left</span>
            </button>
            <button onClick={() => setGalleryIdx(Math.min(event.galleryImages!.length - 1, galleryIdx + 1))} disabled={galleryIdx === event.galleryImages.length - 1}
              className="w-12 h-12 rounded-full bg-white/10 text-white flex items-center justify-center disabled:opacity-30">
              <span className="material-symbols-rounded">chevron_right</span>
            </button>
          </div>
        </div>
      )}

      {/* ═══ POPUP: Artist Detail ═══ */}
      {selectedArtist && (
        <div className="fixed inset-0 z-[300] bg-black/70 flex items-end justify-center animate-in fade-in duration-200" onClick={() => setSelectedArtist(null)}>
          <div className="w-full max-w-md bg-[#1a1a1a] rounded-t-3xl overflow-hidden animate-in slide-in-from-bottom duration-300 max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-1 bg-[#444] rounded-full mx-auto mt-3" />
            <div className="flex items-start gap-4 p-5">
              <div className="w-24 h-32 rounded-xl overflow-hidden bg-[#222] flex-shrink-0">
                {selectedArtist.photoUrl ? <img src={selectedArtist.photoUrl} alt="" className="w-full h-full object-cover" /> :
                  <div className="w-full h-full flex items-center justify-center"><span className="material-symbols-rounded text-4xl text-[#444]">person</span></div>}
              </div>
              <div className="flex-1 pt-1">
                <p className="text-lg font-bold text-white">{selectedArtist.name}</p>
                <p className="text-xs font-bold text-purple-400 capitalize">{selectedArtist.role === 'maestro' ? 'The Maestro' : selectedArtist.role === 'dj' ? 'DJ' : selectedArtist.role === 'performer' ? 'Performer' : selectedArtist.role}</p>
                {selectedArtist.country && <p className="text-[11px] text-[#888] mt-1">{selectedArtist.country}</p>}
                {selectedArtist.bio && <p className="text-xs text-[#aaa] mt-3 leading-relaxed">{selectedArtist.bio}</p>}
              </div>
            </div>
            <button onClick={() => setSelectedArtist(null)} className="w-full py-4 text-sm font-bold text-[#888] border-t border-[#333]">Close</button>
          </div>
        </div>
      )}

      {/* ═══ POPUP: Package Detail ═══ */}
      {selectedPackage && (
        <div className="fixed inset-0 z-[300] bg-black/70 flex items-end justify-center animate-in fade-in duration-200" onClick={() => setSelectedPackage(null)}>
          <div className="w-full max-w-md bg-[#1a1a1a] rounded-t-3xl overflow-hidden animate-in slide-in-from-bottom duration-300 max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-1 bg-[#444] rounded-full mx-auto mt-3" />
            <div className="p-5">
              <div className="flex items-start justify-between mb-3">
                <p className="text-lg font-bold text-white flex-1">{selectedPackage.name}</p>
                {selectedPackage.type && <span className="text-[10px] font-bold uppercase px-2.5 py-1 rounded-full border border-purple-500/40 text-purple-400">{selectedPackage.type}</span>}
              </div>
              {selectedPackage.description && <p className="text-xs text-[#aaa] mb-4">{selectedPackage.description}</p>}
              <div className="space-y-1.5 mb-4">
                 {selectedPackage.includedItems ? selectedPackage.includedItems.map((item, i) => (
                   <p key={i} className="text-[11px] text-[#ccc] flex items-start gap-2"><span className="text-purple-400 mt-px">•</span>{item}</p>
                 )) : selectedPackage.description && (
                   <p className="text-[11px] text-[#ccc]">{selectedPackage.description}</p>
                 )}
              </div>
              <div className="flex items-end justify-between pt-4 border-t border-[#333]">
                <div>
                  <p className="text-2xl font-black text-white">{(selectedPackage.price || 0).toLocaleString()}</p>
                  {selectedPackage.priceUsd && <p className="text-xs text-[#888]">${selectedPackage.priceUsd.toFixed(2)}</p>}
                </div>
                <button className="px-6 py-2.5 bg-purple-600 text-white text-sm font-bold rounded-full hover:bg-purple-700 transition-colors">Choose</button>
              </div>
            </div>
            <button onClick={() => setSelectedPackage(null)} className="w-full py-4 text-sm font-bold text-[#888] border-t border-[#333]">Close</button>
          </div>
        </div>
      )}

      {/* ═══ POPUP: Timetable Fullscreen ═══ */}
      {timetablePopupUrl && (
        <div className="fixed inset-0 z-[400] bg-black/95 flex flex-col animate-in fade-in duration-200">
          <div className="flex justify-end p-4">
            <button onClick={() => setTimetablePopupUrl(null)} className="w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center">
              <span className="material-symbols-rounded text-2xl">close</span>
            </button>
          </div>
          <div className="flex-1 overflow-auto flex items-start justify-center p-4">
            <img src={timetablePopupUrl} alt="Timetable" className="max-w-none w-full h-auto" />
          </div>
        </div>
      )}
    </>
  );
}
