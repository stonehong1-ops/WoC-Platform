"use client";

import React, { useState, useEffect } from "react";
import { Social, SocialSubEvent } from "@/types/social";
import { socialService } from "@/lib/firebase/socialService";
import { userService } from "@/lib/firebase/userService";
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from "sonner";

interface Props {
  social: Social;
  onChatWithOrganizer: () => void;
  canEdit?: boolean;
  onShowImages?: (images: string[], index: number) => void;
  isUnclaimed?: boolean;
  isClaiming?: boolean;
  onClaim?: () => void;
}

import { getNextEventDateObj, getDjDisplay } from "@/lib/utils/socialUtils";

function getNextEventDate(social: Social, language: string): string {
  const dateLocale = language === 'KR' ? 'ko-KR' : 'en-US';
  const next = getNextEventDateObj(social);
  if (next) {
    return next.toLocaleDateString(dateLocale, { weekday: "short", month: "long", day: "numeric" });
  }
  return "TBA";
}

import SocialDjLineupSheet from "./SocialDjLineupSheet";
import NamecardModal, { NamecardUser } from "@/components/profile/NamecardModal";
import UserBadge from "@/components/common/UserBadge";

export default function SocialHomeTab({ social, onChatWithOrganizer, canEdit, onShowImages, isUnclaimed, isClaiming, onClaim }: Props) {
  const [venue, setVenue] = useState<any>(null);
  const [orgProfile, setOrgProfile] = useState<any>(null);
  const [showDjLineup, setShowDjLineup] = useState(false);
  const [selectedNamecardUser, setSelectedNamecardUser] = useState<NamecardUser | null>(null);
  const { t, language } = useLanguage();

  // Auto-fetch venue details
  useEffect(() => {
    if (social.venueId) {
      socialService.getVenueDetails(social.venueId).then(setVenue);
    }
  }, [social.venueId]);

  // Auto-fetch org profile (for phone, photo, etc.)
  useEffect(() => {
    if (social.organizerId) {
      userService.getUserById(social.organizerId).then(setOrgProfile).catch(console.error);
    }
  }, [social.organizerId]);

  const subEvents: SocialSubEvent[] = Array.isArray(social.socialEvents)
    ? social.socialEvents.map((e: any) => typeof e === "string" ? { id: e, title: e, maxParticipants: 0 } : e)
    : [];

  const orgPhone = orgProfile?.phone || orgProfile?.phoneNumber || social.organizerPhone;
  const orgPhoto = orgProfile?.photoURL;

  const handleCallOrganizer = () => {
    if (orgProfile?.allowPhoneCalls === false) {
      toast.error(t('myinfo.phone_private_toast'));
      return;
    }
    window.location.href = `tel:${orgPhone}`;
  };

  // Map URLs
  const lat = venue?.coordinates?.latitude ?? venue?.coordinates?._lat;
  const lng = venue?.coordinates?.longitude ?? venue?.coordinates?._long;
  const addr = venue?.addressEn || venue?.address || "";
  const googleUrl = lat && lng ? `https://www.google.com/maps?q=${lat},${lng}` : addr ? `https://www.google.com/maps/search/${encodeURIComponent(addr)}` : null;
  const naverUrl = lat && lng ? `https://map.naver.com/v5/?c=${lng},${lat},15,0,0,0,dh` : addr ? `https://map.naver.com/v5/search/${encodeURIComponent(addr)}` : null;
  const kakaoUrl = lat && lng ? `https://map.kakao.com/link/map/${encodeURIComponent(social.venueName || "Venue")},${lat},${lng}` : addr ? `https://map.kakao.com/link/search/${encodeURIComponent(addr)}` : null;

  const moments = social.moments || [];

  return (
    <div className="pb-8">
      {/* Next Event */}
      <div className="mx-4 mt-4 border border-[#e0e4e5] rounded-2xl overflow-hidden">
        <div className="bg-[#f8f9fa] px-4 py-2.5 border-b border-[#e0e4e5] flex items-center gap-2">
          <span className="material-symbols-rounded text-sm text-primary">event</span>
          <p className="text-[10px] font-black text-primary uppercase tracking-widest">{t('social.next_event')}</p>
        </div>
        <div className="px-4 py-4 space-y-3">
          <div className="flex items-start gap-3">
            <span className="material-symbols-rounded text-lg text-[#acb3b4]">calendar_today</span>
            <div><p className="text-xs font-bold text-[#2d3435]">{t('social.date')}</p><p className="text-xs text-[#596061]">{getNextEventDate(social, language).replace('TBA', t('social.tba'))}</p></div>
          </div>
          <div className="flex items-start gap-3">
            <span className="material-symbols-rounded text-lg text-[#acb3b4]">schedule</span>
            <div><p className="text-xs font-bold text-[#2d3435]">{t('social.time')}</p><p className="text-xs text-[#596061]">{social.startTime} - {social.endTime}</p></div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-start gap-3">
              <span className="material-symbols-rounded text-lg text-[#acb3b4]">headphones</span>
              <div><p className="text-xs font-bold text-[#2d3435]">{t('social.dj')}</p><p className="text-xs text-[#596061]">{getDjDisplay(social).replace('TBD', t('social.tbd'))}</p></div>
            </div>
            <button onClick={() => setShowDjLineup(true)} className="flex items-center gap-1 px-3 py-1.5 bg-white border border-[#e0e4e5] rounded-full active:scale-95 transition-transform hover:bg-[#f8f9fa] shadow-sm">
              <span className="material-symbols-rounded text-sm text-primary">view_list</span>
              <span className="text-[10px] font-bold text-[#2d3435]">{t('social.lineup')}</span>
            </button>
          </div>
          <div className="flex items-start gap-3">
            <span className="material-symbols-rounded text-lg text-[#acb3b4]">payments</span>
            <div><p className="text-xs font-bold text-[#2d3435]">{t('social.entry_fee')}</p><p className="text-xs text-[#596061]">{social.price?.replace(/\d+/, m => parseInt(m).toLocaleString()) || t('social.tba')}</p></div>
          </div>
        </div>
      </div>

      {showDjLineup && (
        <SocialDjLineupSheet 
          social={social}
          canEdit={canEdit || false}
          onClose={() => setShowDjLineup(false)}
        />
      )}

      {/* Venue / Location with Multi-Map Buttons */}
      <div className="mx-4 mt-4 border border-[#e0e4e5] rounded-2xl overflow-hidden">
        <div className="bg-[#f8f9fa] px-4 py-2.5 border-b border-[#e0e4e5] flex items-center gap-2">
          <span className="material-symbols-rounded text-sm text-primary">location_on</span>
          <p className="text-[10px] font-black text-primary uppercase tracking-widest">{t('social.venue')}</p>
        </div>
        <div className="px-4 py-4">
          <p className="text-sm font-bold text-[#2d3435]">{social.venueName || t('social.venue')}</p>
          {social.venueNameNative && <p className="text-[10px] font-bold text-[#acb3b4] mt-0.5">{social.venueNameNative}</p>}
          
          <div className="mt-2">
            {venue?.addressEn && <p className="text-xs text-[#596061]">{venue.addressEn}</p>}
            {venue?.address && <p className="text-[10px] text-[#acb3b4] mt-0.5">{venue.address}</p>}
            {venue?.detailAddress && <p className="text-[10px] text-[#acb3b4] mt-0.5">{venue.detailAddress}</p>}
          </div>

          {(googleUrl || naverUrl || kakaoUrl) && (
            <div className="flex items-center gap-2 mt-3">
              {googleUrl && (
                <a href={googleUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#f2f4f4] text-[10px] font-bold text-[#596061] hover:bg-[#e8eaec] transition-colors">
                  <span className="material-symbols-rounded text-sm">map</span>{t('social.google')}
                </a>
              )}
              {naverUrl && (
                <a href={naverUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#2DB400]/10 text-[10px] font-bold text-[#2DB400] hover:bg-[#2DB400]/20 transition-colors">
                  <span className="text-xs font-black">N</span>{t('social.naver')}
                </a>
              )}
              {kakaoUrl && (
                <a href={kakaoUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#FEE500]/30 text-[10px] font-bold text-[#3C1E1E] hover:bg-[#FEE500]/50 transition-colors">
                  <span className="text-xs font-black">K</span>{t('social.kakao')}
                </a>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Organizer & Staff */}
      <div className="mx-4 mt-4 border border-[#e0e4e5] rounded-2xl overflow-hidden">
        <div className="bg-[#f8f9fa] px-4 py-2.5 border-b border-[#e0e4e5] flex items-center gap-2">
          <span className="material-symbols-rounded text-sm text-primary">person</span>
          <p className="text-[10px] font-black text-primary uppercase tracking-widest">{t('social.organizer_staff')}</p>
        </div>
        <div className="px-4 py-4 space-y-3">
          <div className="flex items-center justify-between">
            <UserBadge
              uid={social.organizerId || 'unknown'}
              nickname={social.organizerName}
              nativeNickname={social.organizerNameNative}
              photoURL={orgPhoto}
              avatarSize="w-10 h-10"
              nameClassName="font-bold text-sm text-[#2d3435] group-active:text-primary transition-colors cursor-pointer"
              nativeClassName="text-[11px] font-semibold text-slate-400 ml-1.5 cursor-pointer"
              subText={<p className="text-[10px] text-[#acb3b4] font-bold uppercase cursor-pointer">{t('social.organizer')}</p>}
              onClick={() => {
                setSelectedNamecardUser({
                  uid: social.organizerId || 'unknown',
                  name: social.organizerName || 'Organizer',
                  nativeName: social.organizerNameNative || undefined,
                  photoURL: orgPhoto || undefined,
                  phone: orgPhone || undefined,
                  phoneNumber: orgProfile?.phoneNumber || undefined,
                  email: orgProfile?.email || undefined,
                  roles: ['Organizer'],
                  bio: orgProfile?.bio || undefined,
                  allowPhoneCalls: orgProfile?.allowPhoneCalls !== false
                });
              }}
            />
            <div className="flex items-center gap-2">
              {orgPhone && (
                <button onClick={handleCallOrganizer} className="w-9 h-9 rounded-full bg-[#f2f4f4] flex items-center justify-center">
                  <span className="material-symbols-rounded text-lg text-[#596061]">call</span>
                </button>
              )}
              <button onClick={onChatWithOrganizer} className="w-9 h-9 rounded-full bg-[#f2f4f4] flex items-center justify-center">
                <span className="material-symbols-rounded text-lg text-[#596061]">chat</span>
              </button>
            </div>
          </div>
          {social.staffNames && social.staffNames.length > 0 && (
            <div className="border-t border-[#f2f4f4] pt-3 space-y-2">
              {social.staffNames.map((name, i) => {
                const staffId = social.staffIds?.[i];
                return (
                  <div key={i} className="flex items-center justify-between">
                    <UserBadge
                      uid={staffId || `staff-${i}`}
                      nickname={name}
                      avatarSize="w-8 h-8"
                      nameClassName="font-bold text-xs text-[#2d3435] group-active:text-primary transition-colors cursor-pointer"
                      nativeClassName="text-[10px] font-semibold text-slate-400 ml-1 truncate max-w-[80px] cursor-pointer"
                      subText={<p className="text-[10px] text-[#acb3b4] cursor-pointer">{t('social.staff')}</p>}
                      onClick={() => {
                        setSelectedNamecardUser({
                          uid: staffId || `staff-${i}`,
                          name: name,
                          roles: ['Staff'],
                        });
                      }}
                    />
                  </div>
                );
              })}
            </div>
          )}
          {isUnclaimed && onClaim && (
            <div className="border-t border-[#f2f4f4] pt-4 mt-2">
              <button
                onClick={onClaim}
                disabled={isClaiming}
                className="w-full py-2.5 bg-primary/10 text-primary rounded-xl text-xs font-black tracking-wide active:scale-95 transition-transform disabled:opacity-50 border border-primary/20 flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-rounded text-sm">verified_user</span>
                {isClaiming ? t('social.its_me_loading') : t('social.its_me')}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Moments Gallery */}
      {moments.length > 0 && (
        <div className="mx-4 mt-4 border border-[#e0e4e5] rounded-2xl overflow-hidden mb-4">
          <div className="bg-[#f8f9fa] px-4 py-2.5 border-b border-[#e0e4e5] flex items-center gap-2">
            <span className="material-symbols-rounded text-sm text-primary">photo_library</span>
            <p className="text-[10px] font-black text-primary uppercase tracking-widest">{t('social.moments')}</p>
          </div>
          <div className="px-4 py-4">
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide snap-x">
              {moments.map((img, i) => (
                <div 
                  key={i} 
                  onClick={() => onShowImages?.(moments, i)}
                  className="flex-shrink-0 w-32 aspect-[3/4] rounded-xl overflow-hidden border border-[#e0e4e5] bg-slate-50 snap-start active:scale-95 transition-transform"
                >
                  <img src={img} alt={`${t('social.moment')} ${i + 1}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {selectedNamecardUser && (
        <NamecardModal
          user={selectedNamecardUser}
          isOpen={!!selectedNamecardUser}
          onClose={() => setSelectedNamecardUser(null)}
          onChat={(uid) => {
             if (uid === social.organizerId) {
                onChatWithOrganizer();
             } else {
                alert(t('social.chat_unavailable'));
             }
             setSelectedNamecardUser(null);
          }}
          onCall={(phone) => {
             window.location.href = `tel:${phone}`;
          }}
        />
      )}
    </div>
  );
}
