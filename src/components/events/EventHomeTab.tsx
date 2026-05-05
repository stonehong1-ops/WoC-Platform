"use client";

import React, { useState, useEffect } from "react";
import { Event } from "@/types/event";
import { userService } from "@/lib/firebase/userService";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/clientApp";
import { format } from "date-fns";
import { useLanguage } from "@/contexts/LanguageContext";

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

export default function EventHomeTab({ event, onChatWithHost, canEdit }: Props) {
  const { t } = useLanguage();
  const [venue, setVenue] = useState<any>(null);
  const [hostProfile, setHostProfile] = useState<any>(null);

  useEffect(() => {
    if (event.venueId) {
      getDoc(doc(db, "venues", event.venueId)).then(snap => {
        if (snap.exists()) setVenue({ id: snap.id, ...snap.data() });
      }).catch(console.error);
    }
  }, [event.venueId]);

  useEffect(() => {
    if (event.hostId) {
      userService.getUserById(event.hostId).then(setHostProfile).catch(console.error);
    }
  }, [event.hostId]);

  const startDate = getNormalizedDate(event.startDate);
  const endDate = event.endDate ? getNormalizedDate(event.endDate) : startDate;
  const isMultiDay = startDate.getTime() !== endDate.getTime();
  const dateStr = isMultiDay
    ? `${format(startDate, "MMM d")} – ${format(endDate, "MMM d, yyyy")}`
    : format(startDate, "MMM d, yyyy (EEE)");

  const hostPhone = hostProfile?.phone || event.organizerPhone;
  const hostPhoto = hostProfile?.photoURL || event.hostPhoto;

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
                <a href={`tel:${hostPhone}`} className="w-9 h-9 rounded-full bg-[#f2f4f4] flex items-center justify-center">
                  <span className="material-symbols-rounded text-lg text-[#596061]">call</span>
                </a>
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
  );
}
