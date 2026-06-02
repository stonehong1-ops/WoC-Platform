"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Social, SocialReservation, SocialWeeklyState, SocialSubEvent } from "@/types/social";
import { socialService } from "@/lib/firebase/socialService";
import { useAuth } from "@/components/providers/AuthProvider";
import { useLanguage } from "@/contexts/LanguageContext";

interface Props {
  social: Social;
}

const ADMIN_UIDS = ["7iaZAmaYY9dNNEShmJmROI8XrtH2"];

function getEventDateForWeek(social: Social, weekOffset: number): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (social.type === "regular" && social.dayOfWeek !== undefined) {
    const diff = (social.dayOfWeek - today.getDay() + 7) % 7;
    const thisWeek = new Date(today);
    thisWeek.setDate(today.getDate() + diff);
    thisWeek.setDate(thisWeek.getDate() + weekOffset * 7);
    return thisWeek;
  }
  if (social.date) {
    const d = typeof social.date.toDate === "function" ? social.date.toDate() : new Date(social.date as any);
    d.setHours(0, 0, 0, 0);
    return d;
  }
  return today;
}

function formatDateKey(d: Date): string {
  return d.toISOString().split("T")[0];
}

function getUserBookingName(user: any, profile: any): string {
  if (!user) return "User";
  if (profile) {
    const nickname = (profile.nickname || "").trim();
    const nativeNickname = (profile.nativeNickname || "").trim();
    if (nickname && nativeNickname) {
      if (nickname.toLowerCase() === nativeNickname.toLowerCase()) {
        return nickname;
      }
      return `${nickname} ${nativeNickname}`;
    }
    if (nickname) return nickname;
    if (nativeNickname) return nativeNickname;
  }
  if (user.displayName) return user.displayName;
  return "User";
}

export default function SocialReservationTab({ social }: Props) {
  const { user, profile } = useAuth();
  const { t, language } = useLanguage();
  const [weekOffset, setWeekOffset] = useState(0);
  const [reservations, setReservations] = useState<SocialReservation[]>([]);
  const [weeklyState, setWeeklyState] = useState<SocialWeeklyState | null>(null);
  const [showBookSheet, setShowBookSheet] = useState(false);
  const [showDetailSheet, setShowDetailSheet] = useState<SocialReservation | null>(null);
  const [peopleCount, setPeopleCount] = useState(1);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const eventDate = useMemo(() => getEventDateForWeek(social, weekOffset), [social, weekOffset]);
  const dateKey = formatDateKey(eventDate);
  const isOrgOrStaff = user && (
    user.uid === social.organizerId ||
    social.staffIds?.includes(user.uid) ||
    ADMIN_UIDS.includes(user.uid)
  );
  const isClosed = weeklyState?.isClosed || false;

  const totalBooked = reservations
    .filter(r => r.status !== "rejected")
    .reduce((sum, r) => sum + r.peopleCount, 0);

  // Parse sub events with live participant counts
  const subEvents: (SocialSubEvent & { liveCount: number; isFull: boolean })[] = useMemo(() => {
    const events: SocialSubEvent[] = Array.isArray(social.socialEvents)
      ? social.socialEvents.map((e: any) => typeof e === "string" ? { id: e, title: e, maxParticipants: 0 } : e)
      : [];
    return events.map(ev => {
      const count = reservations
        .filter(r => r.selectedEventId === ev.id && r.status !== "rejected")
        .reduce((sum, r) => sum + r.peopleCount, 0);
      return { ...ev, liveCount: count, isFull: ev.maxParticipants > 0 && count >= ev.maxParticipants };
    });
  }, [social.socialEvents, reservations]);

  useEffect(() => {
    const unsub = socialService.subscribeWeekReservations(social.id, dateKey, setReservations);
    return () => unsub();
  }, [social.id, dateKey]);

  useEffect(() => {
    const unsub = socialService.subscribeWeeklyState(social.id, dateKey, setWeeklyState);
    return () => unsub();
  }, [social.id, dateKey]);

  const handleBook = async () => {
    if (!user) return alert(t('social.login_first'));
    setIsSubmitting(true);
    try {
      await socialService.addReservation(social.id, {
        userId: user.uid,
        userName: getUserBookingName(user, profile),
        ...(user.photoURL ? { userPhotoURL: user.photoURL } : {}),
        peopleCount,
        ...(selectedEventId ? { selectedEventId } : {}),
        weekStartDate: dateKey,
        status: "pending",
      });
      setShowBookSheet(false);
      setPeopleCount(1);
      setSelectedEventId("");
    } catch (err: any) {
      console.error("Booking error details:", {
        socialId: social.id,
        userId: user?.uid,
        error: err,
        message: err?.message
      });
      alert(t('social.booking_failed', { error: err?.message || t('social.unknown_error') }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseTable = async () => {
    if (!user) return;
    const next = !isClosed;
    if (next && !confirm(t('social.confirm_close_table'))) return;
    await socialService.setWeekClosed(social.id, dateKey, next, user.uid);
  };

  const handleStatusChange = async (resId: string, status: "approved" | "rejected") => {
    await socialService.updateReservationStatus(social.id, resId, status);
    setShowDetailSheet(null);
  };

  const dateLabel = eventDate.toLocaleDateString(language === 'KR' ? 'ko-KR' : 'en-US', { weekday: "short", month: "short", day: "numeric" });

  return (
    <div className="pb-8 relative">
      {/* Week Navigator */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#f8f9fa] border-b border-[#e0e4e5]">
        <button onClick={() => setWeekOffset(w => w - 1)}
          className="w-9 h-9 rounded-full bg-white border border-[#e0e4e5] flex items-center justify-center active:scale-90">
          <span className="material-symbols-rounded text-lg text-[#596061]">chevron_left</span>
        </button>
        <div className="text-center">
          <p className="text-sm font-black text-[#2d3435]">{dateLabel}</p>
          {weekOffset === 0 && <p className="text-[10px] text-primary font-bold">{t('social.this_week')}</p>}
          {weekOffset === 1 && <p className="text-[10px] text-[#acb3b4] font-bold">{t('social.next_week')}</p>}
          {weekOffset === -1 && <p className="text-[10px] text-[#acb3b4] font-bold">{t('social.last_week')}</p>}
        </div>
        <button onClick={() => weekOffset < 2 ? setWeekOffset(w => w + 1) : null}
          disabled={weekOffset >= 2}
          className="w-9 h-9 rounded-full bg-white border border-[#e0e4e5] flex items-center justify-center active:scale-90 disabled:opacity-30">
          <span className="material-symbols-rounded text-lg text-[#596061]">chevron_right</span>
        </button>
      </div>

      {/* Status */}
      <div className="px-4 py-3 flex items-center justify-between border-b border-[#f2f4f4]">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${isClosed ? "bg-red-500" : "bg-green-500 animate-pulse"}`} />
          <span className={`text-xs font-bold ${isClosed ? "text-red-600" : "text-green-600"}`}>
            {isClosed ? t('social.table_closed') : t('social.accepting_reservations')}
          </span>
        </div>
        <div className="text-[10px] font-bold text-[#acb3b4]">
          {t('social.booked_status', { 
            count: totalBooked, 
            capacity: social.tableCapacity ? `/ ${social.tableCapacity} ${t('social.seats')}` : "" 
          })}
        </div>
      </div>

      {/* Event Status (for Org/Staff) */}
      {isOrgOrStaff && subEvents.length > 0 && (
        <div className="mx-4 mt-3 border border-[#e0e4e5] rounded-xl overflow-hidden">
          <div className="bg-[#f8f9fa] px-3 py-2 border-b border-[#e0e4e5]">
            <p className="text-[10px] font-black text-primary uppercase tracking-widest">{t('social.event_capacity')}</p>
          </div>
          {subEvents.map(ev => (
            <div key={ev.id} className="px-3 py-2.5 flex items-center justify-between border-b border-[#f2f4f4] last:border-b-0">
              <div>
                <p className="text-xs font-bold text-[#2d3435]">{ev.title}</p>
                <p className="text-[10px] text-[#acb3b4]">{t('social.joined_count', { count: ev.liveCount, max: ev.maxParticipants || "∞" })}</p>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${ev.isFull ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"}`}>
                {ev.isFull ? t('social.full') : t('social.open')}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Reservation List */}
      <div className="px-4 mt-3 space-y-2">
        {reservations.length === 0 && (
          <div className="py-12 text-center">
            <span className="material-symbols-rounded text-4xl text-[#e0e4e5] block mb-2">event_seat</span>
            <p className="text-xs text-[#acb3b4] font-bold">{t('social.no_reservations')}</p>
          </div>
        )}
        {reservations.map(r => (
          <div key={r.id}
            onClick={() => isOrgOrStaff ? setShowDetailSheet(r) : null}
            className={`border rounded-xl p-3 transition-all ${isOrgOrStaff ? "cursor-pointer active:scale-[0.98]" : ""} ${
              r.status === "approved" ? "border-green-200 bg-green-50/30" :
              r.status === "rejected" ? "border-red-200 bg-red-50/30 opacity-50" :
              "border-[#e0e4e5] bg-white"
            }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden">
                  {r.userPhotoURL ? <img src={r.userPhotoURL} className="w-full h-full object-cover" alt="" /> :
                    <span className="material-symbols-rounded text-sm text-[#acb3b4]">person</span>}
                </div>
                <div>
                  <p className="text-xs font-bold text-[#2d3435]">{r.userName}</p>
                  <p className="text-[10px] text-[#acb3b4]">+{r.peopleCount} {r.peopleCount > 1 ? t('social.people') : t('social.person')}</p>
                </div>
              </div>
              <div>
                {r.status === "pending" && <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">{t('social.pending')}</span>}
                {r.status === "approved" && <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">✓ {t('social.approved')}</span>}
                {r.status === "rejected" && <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">{t('social.rejected')}</span>}
              </div>
            </div>
            {r.selectedEventId && (
              <p className="text-[10px] text-primary font-bold mt-1.5 ml-10">
                {t('social.event_label')}: {subEvents.find(e => e.id === r.selectedEventId)?.title || r.selectedEventId}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Book Table Button */}
      {!isClosed && user && (
        <div className="px-4 mt-4">
          <button onClick={() => setShowBookSheet(true)}
            className="w-full py-3.5 bg-primary text-white rounded-xl font-black text-sm tracking-wide shadow-lg shadow-primary/20 active:scale-95 transition-transform">
            {t('social.book_table')}
          </button>
        </div>
      )}

      {/* Org Controls */}
      {isOrgOrStaff && (
        <div className="px-4 mt-4">
          <button onClick={handleCloseTable}
            className={`w-full py-3 rounded-xl font-bold text-sm border transition-all active:scale-95 ${
              isClosed ? "border-green-500 text-green-600 bg-green-50" : "border-red-300 text-red-600 bg-red-50"
            }`}>
            {isClosed ? t('social.reopen_table') : t('social.close_table')}
          </button>
        </div>
      )}

      {/* ===== BOTTOM SHEET: Book Table ===== */}
      {showBookSheet && (
        <>
          <div className="fixed inset-0 bg-black/40 z-[150] animate-in fade-in duration-200" onClick={() => setShowBookSheet(false)} />
          <div className="fixed bottom-0 left-0 right-0 z-[151] bg-white rounded-t-3xl shadow-2xl animate-in slide-in-from-bottom duration-300 max-h-[80vh] overflow-y-auto">
            <div className="w-12 h-1.5 bg-[#e0e4e5] rounded-full mx-auto mt-3 mb-2" />
            <div className="px-5 pb-8">
              <h3 className="text-lg font-black text-[#2d3435] mb-1">{t('social.book_table')}</h3>
              <p className="text-xs text-[#acb3b4] mb-5">{dateLabel} · {social.startTime} - {social.endTime}</p>

              {/* Guest */}
              <div className="mb-5">
                <label className="text-[10px] font-bold text-[#596061] uppercase tracking-wider block mb-2">{t('social.guest')}</label>
                <p className="text-sm font-bold text-[#2d3435]">{getUserBookingName(user, profile)}</p>
              </div>

              {/* Party Size */}
              <div className="mb-5">
                <label className="text-[10px] font-bold text-[#596061] uppercase tracking-wider block mb-2">{t('social.party_size')}</label>
                <div className="flex items-center gap-3">
                  <button onClick={() => setPeopleCount(Math.max(1, peopleCount - 1))}
                    className="w-10 h-10 rounded-full bg-[#f2f4f4] flex items-center justify-center text-[#596061] active:scale-90">
                    <span className="material-symbols-rounded">remove</span>
                  </button>
                  <span className="text-xl font-black text-[#2d3435] w-8 text-center">{peopleCount}</span>
                  <button onClick={() => setPeopleCount(Math.min(10, peopleCount + 1))}
                    className="w-10 h-10 rounded-full bg-[#f2f4f4] flex items-center justify-center text-[#596061] active:scale-90">
                    <span className="material-symbols-rounded">add</span>
                  </button>
                </div>
              </div>

              {/* Event Selection */}
              {subEvents.length > 0 && (
                <div className="mb-6">
                  <label className="text-[10px] font-bold text-[#596061] uppercase tracking-wider block mb-2">{t('social.join_event_optional')}</label>
                  <div className="space-y-2">
                    <button onClick={() => setSelectedEventId("")}
                      className={`w-full text-left px-4 py-3 rounded-xl border text-xs font-bold transition-all ${
                        !selectedEventId ? "border-primary bg-primary/5 text-primary" : "border-[#e0e4e5] text-[#596061]"
                      }`}>
                      {t('social.no_event')}
                    </button>
                    {subEvents.map(ev => (
                      <button key={ev.id} onClick={() => !ev.isFull && setSelectedEventId(ev.id)}
                        disabled={ev.isFull}
                        className={`w-full text-left px-4 py-3 rounded-xl border text-xs font-bold transition-all ${
                          selectedEventId === ev.id ? "border-primary bg-primary/5 text-primary" :
                          ev.isFull ? "border-[#e0e4e5] text-[#acb3b4] opacity-50" :
                          "border-[#e0e4e5] text-[#596061]"
                        }`}>
                        <div className="flex justify-between items-center">
                          <span>{ev.title}</span>
                          <span className="text-[10px]">
                            {ev.isFull ? t('social.full') : ev.maxParticipants > 0 ? `${ev.liveCount}/${ev.maxParticipants}` : t('social.open')}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <button onClick={handleBook} disabled={isSubmitting}
                className="w-full py-4 bg-primary text-white rounded-xl font-black text-sm shadow-lg shadow-primary/20 active:scale-95 transition-transform disabled:opacity-50">
                {isSubmitting ? t('social.booking_loading') : t('social.confirm_reservation')}
              </button>
            </div>
          </div>
        </>
      )}

      {/* ===== BOTTOM SHEET: Reservation Detail (Org/Staff) ===== */}
      {showDetailSheet && isOrgOrStaff && (
        <>
          <div className="fixed inset-0 bg-black/40 z-[150] animate-in fade-in duration-200" onClick={() => setShowDetailSheet(null)} />
          <div className="fixed bottom-0 left-0 right-0 z-[151] bg-white rounded-t-3xl shadow-2xl animate-in slide-in-from-bottom duration-300">
            <div className="w-12 h-1.5 bg-[#e0e4e5] rounded-full mx-auto mt-3 mb-2" />
            <div className="px-5 pb-8">
              <h3 className="text-lg font-black text-[#2d3435] mb-4">{t('social.reservation_detail')}</h3>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden">
                  {showDetailSheet.userPhotoURL ? <img src={showDetailSheet.userPhotoURL} className="w-full h-full object-cover" alt="" /> :
                    <span className="material-symbols-rounded text-xl text-[#acb3b4]">person</span>}
                </div>
                <div>
                  <p className="text-base font-bold text-[#2d3435]">{showDetailSheet.userName}</p>
                  <p className="text-xs text-[#acb3b4]">{showDetailSheet.peopleCount} {showDetailSheet.peopleCount > 1 ? t('social.people') : t('social.person')}</p>
                </div>
              </div>

              {showDetailSheet.selectedEventId && (
                <div className="bg-[#f8f9fa] rounded-xl px-4 py-3 mb-4">
                  <p className="text-[10px] font-bold text-[#acb3b4] uppercase mb-1">{t('social.event_label')}</p>
                  <p className="text-sm font-bold text-primary">
                    {subEvents.find(e => e.id === showDetailSheet.selectedEventId)?.title || showDetailSheet.selectedEventId}
                  </p>
                </div>
              )}

              <div className="bg-[#f8f9fa] rounded-xl px-4 py-3 mb-6">
                <p className="text-[10px] font-bold text-[#acb3b4] uppercase mb-1">{t('social.status')}</p>
                <p className={`text-sm font-bold ${
                  showDetailSheet.status === "approved" ? "text-green-600" :
                  showDetailSheet.status === "rejected" ? "text-red-600" : "text-amber-600"
                }`}>
                  {showDetailSheet.status === "approved" ? `✓ ${t('social.approved')}` : showDetailSheet.status === "rejected" ? t('social.rejected') : `⏳ ${t('social.pending')}`}
                </p>
              </div>

              {showDetailSheet.status === "pending" && (
                <div className="flex gap-3">
                  <button onClick={() => handleStatusChange(showDetailSheet.id!, "approved")}
                    className="flex-1 py-3.5 bg-green-500 text-white rounded-xl font-black text-sm active:scale-95 transition-transform">
                    {t('social.approve')}
                  </button>
                  <button onClick={() => handleStatusChange(showDetailSheet.id!, "rejected")}
                    className="flex-1 py-3.5 bg-red-500 text-white rounded-xl font-black text-sm active:scale-95 transition-transform">
                    {t('social.reject')}
                  </button>
                </div>
              )}
              {showDetailSheet.status !== "pending" && (
                <button onClick={() => setShowDetailSheet(null)}
                  className="w-full py-3.5 bg-[#f2f4f4] text-[#2d3435] rounded-xl font-bold text-sm active:scale-95 transition-transform">
                  {t('social.close')}
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
