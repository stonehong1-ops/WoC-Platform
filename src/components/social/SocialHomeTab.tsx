"use client";
import React, { useState, useEffect } from "react";
import { Social, SocialSubEvent, SocialDj } from "@/types/social";
import { socialService } from "@/lib/firebase/socialService";
import { userService } from "@/lib/firebase/userService";
import { PlatformUser } from "@/types/user";
import { v4 as uuidv4 } from "uuid";
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

import NamecardModal, { NamecardUser } from "@/components/profile/NamecardModal";
import UserBadge from "@/components/common/UserBadge";

const ADMIN_UIDS = ['adminstone', '7iaZAmaYY9dNNEShmJmROI8XrtH2'];
const isStoneHongName = (name?: string | null): boolean => {
  if (!name) return false;
  const normalized = name.trim().toLowerCase().replace(/\s+/g, '');
  return ['stone', 'stonehong', '스톤', '스톤홍'].includes(normalized);
};

export default function SocialHomeTab({ social, onChatWithOrganizer, canEdit, onShowImages, isUnclaimed, isClaiming, onClaim }: Props) {
  const [venue, setVenue] = useState<any>(null);
  const [orgProfile, setOrgProfile] = useState<any>(null);
  const [selectedNamecardUser, setSelectedNamecardUser] = useState<NamecardUser | null>(null);
  const { t, language } = useLanguage();

  // DJ 통합 라인업 상태 관리 변수들
  const [isAdding, setIsAdding] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [djNameInput, setDjNameInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [allUsers, setAllUsers] = useState<PlatformUser[]>([]);
  const [djResults, setDjResults] = useState<PlatformUser[]>([]);
  const [showDjResults, setShowDjResults] = useState(false);
  const [selectedDjId, setSelectedDjId] = useState<string>("");
  const [showPastDjs, setShowPastDjs] = useState(false);

  // 어드민용 검색 리스트 fetch
  useEffect(() => {
    if (canEdit) {
      userService.getAllUsers().then(setAllUsers).catch(console.error);
    }
  }, [canEdit]);


  // Auto-fetch venue details
  useEffect(() => {
    if (social.venueId) {
      socialService.getVenueDetails(social.venueId).then(setVenue);
    }
  }, [social.venueId]);

  // Auto-fetch org profile (for phone, photo, etc.)
  useEffect(() => {
    if (social.organizerId) {
      const isVirtualAdmin = ADMIN_UIDS.includes(social.organizerId) && 
        ((social.organizerName && !isStoneHongName(social.organizerName)) || 
         (social.organizerNameNative && !isStoneHongName(social.organizerNameNative)));

      if (isVirtualAdmin) {
        setOrgProfile(null);
        return;
      }

      userService.getUserById(social.organizerId).then(setOrgProfile).catch(console.error);
    }
  }, [social.organizerId, social.organizerName, social.organizerNameNative]);

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

  // DJ 자동완성 검색
  const handleDjSearch = (val: string) => {
    setDjNameInput(val);
    setSelectedDjId("");
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
    setDjNameInput(u.nickname || "");
    setSelectedDjId(u.id);
    setShowDjResults(false);
  };

  const handleAddDj = async () => {
    if (!selectedDate) {
      alert(t('social.alert_select_date_dj') || "Please select a date");
      return;
    }

    const finalDjName = djNameInput.trim() || "TBD";
    setIsSubmitting(true);
    try {
      const newDj: any = {
        id: uuidv4(),
        date: selectedDate,
        djName: finalDjName,
      };
      if (selectedDjId) {
        newDj.djId = selectedDjId;
      }

      const currentDjs = social.djs || [];
      const updatedDjs = [...currentDjs, newDj].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      await socialService.updateSocial(social.id, {
        djs: updatedDjs,
        djName: updatedDjs.find(d => new Date(d.date) >= new Date())?.djName || updatedDjs[updatedDjs.length - 1]?.djName || social.djName || ""
      });

      setIsAdding(false);
      setSelectedDate("");
      setDjNameInput("");
      setSelectedDjId("");
      toast.success(t('social.add_dj_success') || "DJ added successfully!");
    } catch (err) {
      console.error(err);
      alert(t('social.alert_failed_add_dj') || "Failed to add DJ");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteDj = async (id: string) => {
    if (!confirm(t('social.alert_remove_dj_confirm') || "Are you sure you want to remove this DJ?")) return;
    try {
      const currentDjs = social.djs || [];
      const updatedDjs = currentDjs.filter(d => d.id !== id);
      await socialService.updateSocial(social.id, {
        djs: updatedDjs,
        djName: updatedDjs.find(d => new Date(d.date) >= new Date())?.djName || updatedDjs[updatedDjs.length - 1]?.djName || ""
      });
      toast.success(t('social.delete_dj_success') || "DJ removed successfully!");
    } catch (err) {
      console.error(err);
      alert(t('social.alert_failed_remove_dj') || "Failed to remove DJ");
    }
  };

  // 날짜 및 라인업 정렬 파생 데이터
  const sortedDjs = [...(social.djs || [])].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const today = new Date();
  today.setHours(0,0,0,0);
  
  const upcomingDjs = sortedDjs.filter(d => new Date(d.date) >= today);
  const pastDjs = sortedDjs.filter(d => new Date(d.date) < today);

  const dateLocale = language === 'KR' ? 'ko-KR' : 'en-US';

  // 8주간 다가올 예정일 날짜 배열 생성
  const generateUpcomingDates = () => {
    if (social.type !== "regular" || social.dayOfWeek === undefined) return [];
    const dates = [];
    const d = new Date();
    d.setHours(0,0,0,0);
    const diff = (social.dayOfWeek - d.getDay() + 7) % 7;
    let next = new Date(d);
    next.setDate(d.getDate() + diff);
    
    for (let i = 0; i < 8; i++) {
      const year = next.getFullYear();
      const month = String(next.getMonth() + 1).padStart(2, '0');
      const day = String(next.getDate()).padStart(2, '0');
      dates.push(`${year}-${month}-${day}`);
      next.setDate(next.getDate() + 7);
    }
    return dates;
  };
  
  const suggestedDates = generateUpcomingDates();
  
  // 날짜 추가 폼 열릴 시 자동 첫 제안일 선택
  useEffect(() => {
    if (isAdding && !selectedDate && suggestedDates.length > 0) {
      setSelectedDate(suggestedDates[0]);
    }
  }, [isAdding, selectedDate]);

  const moments = social.moments || [];

  return (
    <div className="pb-8">
      {/* Next Event */}
      <div className="mx-4 mt-4 border border-[#e0e4e5] rounded-2xl overflow-hidden bg-white">
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
          <div className="flex items-start gap-3">
            <span className="material-symbols-rounded text-lg text-[#acb3b4]">payments</span>
            <div><p className="text-xs font-bold text-[#2d3435]">{t('social.entry_fee')}</p><p className="text-xs text-[#596061]">{social.price?.replace(/\d+/, m => parseInt(m).toLocaleString()) || t('social.tba')}</p></div>
          </div>
        </div>
      </div>

      {/* DJ & Lineup Schedule Integrated Card */}
      <div className="mx-4 mt-4 border border-[#e0e4e5] rounded-2xl overflow-hidden bg-white shadow-sm">
        <div className="bg-[#f8f9fa] px-4 py-2.5 border-b border-[#e0e4e5] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-rounded text-sm text-primary">headphones</span>
            <p className="text-[10px] font-black text-primary uppercase tracking-widest">{t('social.dj_lineup')}</p>
          </div>
          {canEdit && (
            <button 
              onClick={() => setIsAdding(!isAdding)}
              className="flex items-center gap-0.5 px-2.5 py-1 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-lg text-[10px] font-black active:scale-95 transition-transform"
            >
              <span className="material-symbols-rounded text-[11px]">{isAdding ? 'expand_less' : 'add'}</span>
              <span>{isAdding ? t('common.close') || '닫기' : t('social.add_dj_lineup')}</span>
            </button>
          )}
        </div>
        
        <div className="px-4 py-4 space-y-4">
          {/* 1. 현재 DJ 강조 섹션 */}
          <div className="flex items-center gap-4 p-3 bg-slate-50 border border-slate-100 rounded-xl">
            <div className="w-11 h-11 rounded-full bg-primary/5 flex items-center justify-center shrink-0 border border-primary/10 shadow-inner">
              <span className="material-symbols-rounded text-lg text-primary">headphones</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{t('social.dj')}</p>
              <h4 className="text-[14.5px] font-black text-slate-800 mt-0.5 truncate">
                {getDjDisplay(social).replace('TBD', t('social.tbd'))}
              </h4>
            </div>
          </div>

          {/* 어드민용 일정 추가 인라인 폼 (isAdding === true 일 때 펼쳐짐) */}
          {canEdit && isAdding && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3.5 animate-in slide-in-from-top-2 duration-200">
              <div>
                <label className="block text-[10px] font-bold text-[#acb3b4] uppercase tracking-wider mb-1.5">{t('social.date')}</label>
                {social.type === "regular" && social.dayOfWeek !== undefined ? (
                  <select
                    value={selectedDate}
                    onChange={e => setSelectedDate(e.target.value)}
                    className="w-full px-3 py-2 border border-[#e0e4e5] rounded-lg text-xs font-bold text-[#2d3435] focus:outline-none focus:border-primary/50 bg-white"
                  >
                    <option value="" disabled>{t('social.select_date') || "Select Date"}</option>
                    {suggestedDates.map(dateStr => (
                      <option key={dateStr} value={dateStr}>
                        {new Date(dateStr).toLocaleDateString(dateLocale, { month: 'short', day: 'numeric', weekday: 'short' })}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input 
                    type="date" 
                    value={selectedDate}
                    onChange={e => setSelectedDate(e.target.value)}
                    className="w-full px-3 py-2 border border-[#e0e4e5] rounded-lg text-xs font-bold text-[#2d3435] focus:outline-none focus:border-primary/50"
                  />
                )}
              </div>
              <div className="relative">
                <label className="block text-[10px] font-bold text-[#acb3b4] uppercase tracking-wider mb-1.5">{t('social.dj_label')}</label>
                <div className="flex items-center px-3 py-2 border border-[#e0e4e5] rounded-lg focus-within:border-primary/50 bg-white transition-colors">
                  <span className="material-symbols-rounded text-[#acb3b4] mr-1.5 text-xs">headphones</span>
                  <input 
                    type="text" 
                    value={djNameInput}
                    onChange={e => handleDjSearch(e.target.value)}
                    onFocus={() => djNameInput.length >= 1 && setShowDjResults(djResults.length > 0)}
                    onBlur={() => setTimeout(() => setShowDjResults(false), 200)}
                    placeholder={t('social.search_dj_placeholder_sheet')}
                    className="flex-1 bg-transparent border-none p-0 focus:ring-0 text-xs font-bold text-[#2d3435] placeholder:text-[#acb3b4] outline-none"
                  />
                </div>
                {showDjResults && (
                  <div className="absolute top-full left-0 w-full mt-1 bg-white border border-[#e0e4e5] rounded-xl shadow-lg z-50 overflow-hidden">
                    {djResults.map(u => (
                      <button key={u.id} onClick={() => handleSelectDj(u)}
                        className="w-full text-left px-4 py-2.5 hover:bg-[#f8f9fa] flex items-baseline gap-2 group transition-colors border-b border-[#f2f4f4] last:border-0">
                        <p className="font-bold text-[#2d3435] text-xs group-hover:text-primary">{u.nickname}</p>
                        {u.nativeNickname && <span className="text-[9px] text-[#acb3b4]">({u.nativeNickname})</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button 
                onClick={handleAddDj}
                disabled={isSubmitting}
                className="w-full py-2.5 bg-primary text-white rounded-lg text-xs font-black tracking-wide active:scale-95 transition-transform disabled:opacity-50"
              >
                {isSubmitting ? t('social.adding') : t('social.add_dj_lineup')}
              </button>
            </div>
          )}

          {/* 2. 다가오는 라인업 목록 */}
          <div className="space-y-2">
            <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('social.upcoming_lineup')}</h5>
            {upcomingDjs.length === 0 ? (
              <div className="py-6 flex flex-col items-center justify-center border border-dashed border-[#e0e4e5] rounded-xl">
                <span className="material-symbols-rounded text-2xl text-[#c4cacc] mb-1">headphones</span>
                <p className="text-[10px] font-bold text-[#acb3b4]">{t('social.no_upcoming_djs')}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {upcomingDjs.map((dj) => (
                  <div key={dj.id} className="flex items-center justify-between p-3 border border-slate-100 rounded-xl bg-white shadow-sm">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {dj.djId ? (
                        <UserBadge
                          uid={dj.djId}
                          nickname={dj.djName}
                          avatarSize="w-9 h-9"
                          nameClassName="font-bold text-xs text-[#2d3435] truncate"
                          nativeClassName="text-[9px] font-semibold text-slate-400 ml-1.5 truncate max-w-[80px]"
                          subText={
                            <p className="text-[9.5px] font-bold text-primary mt-0.5">
                              {new Date(dj.date).toLocaleDateString(dateLocale, { weekday: 'short', month: 'short', day: 'numeric' })}
                            </p>
                          }
                        />
                      ) : (
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-[#f8f9fa] flex items-center justify-center shrink-0 border border-slate-100">
                            <span className="material-symbols-rounded text-sm text-[#596061]">headphones</span>
                          </div>
                          <div>
                            <p className="text-xs font-bold text-[#2d3435]">{dj.djName}</p>
                            <p className="text-[9.5px] font-bold text-primary mt-0.5">
                              {new Date(dj.date).toLocaleDateString(dateLocale, { weekday: 'short', month: 'short', day: 'numeric' })}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                    {canEdit && (
                      <button onClick={() => handleDeleteDj(dj.id)} className="w-8 h-8 flex items-center justify-center text-[#acb3b4] hover:text-red-500 hover:bg-red-50 rounded-full transition-colors shrink-0">
                        <span className="material-symbols-rounded text-sm">delete</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 3. 지난 라인업 목록 (아코디언 형태) */}
          {pastDjs.length > 0 && (
            <div className="pt-2 border-t border-slate-100">
              <button 
                onClick={() => setShowPastDjs(!showPastDjs)}
                className="flex items-center justify-between w-full py-1 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <span className="text-[10px] font-black uppercase tracking-widest">{t('social.past_djs')} ({pastDjs.length})</span>
                <span className="material-symbols-rounded text-sm">
                  {showPastDjs ? "expand_less" : "expand_more"}
                </span>
              </button>
              
              {showPastDjs && (
                <div className="space-y-2 mt-2 opacity-70 animate-in slide-in-from-top-1 duration-200">
                  {pastDjs.map((dj) => (
                    <div key={dj.id} className="flex items-center justify-between p-2.5 border border-slate-100 rounded-xl bg-slate-50/50">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        {dj.djId ? (
                          <UserBadge
                            uid={dj.djId}
                            nickname={dj.djName}
                            avatarSize="w-8 h-8"
                            nameClassName="font-bold text-[11px] text-[#596061] truncate"
                            nativeClassName="text-[8px] font-semibold text-slate-400 ml-1 truncate max-w-[60px]"
                            subText={
                              <p className="text-[9px] font-medium text-[#acb3b4]">
                                {new Date(dj.date).toLocaleDateString(dateLocale, { month: 'short', day: 'numeric', year: 'numeric' })}
                              </p>
                            }
                          />
                        ) : (
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#e8eaec] flex items-center justify-center shrink-0">
                              <span className="material-symbols-rounded text-xs text-[#acb3b4]">headphones</span>
                            </div>
                            <div>
                              <p className="text-[11px] font-bold text-[#596061]">{dj.djName}</p>
                              <p className="text-[9px] font-medium text-[#acb3b4]">
                                {new Date(dj.date).toLocaleDateString(dateLocale, { month: 'short', day: 'numeric', year: 'numeric' })}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                      {canEdit && (
                        <button onClick={() => handleDeleteDj(dj.id)} className="w-7 h-7 flex items-center justify-center text-[#c4cacc] hover:text-red-500 transition-colors shrink-0">
                          <span className="material-symbols-rounded text-xs">delete</span>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>


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
                const isVirtualAdmin = ADMIN_UIDS.includes(social.organizerId || '') && 
                  ((social.organizerName && !isStoneHongName(social.organizerName)) || 
                   (social.organizerNameNative && !isStoneHongName(social.organizerNameNative)));
                
                if (isVirtualAdmin) return;

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
