"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Event, EventRegistration, EventProgram } from "@/types/event";
import { eventService } from "@/lib/firebase/eventService";
import { useAuth } from "@/components/providers/AuthProvider";
import { useLanguage } from "@/contexts/LanguageContext";

interface Props {
  event: Event;
}

const ADMIN_UIDS = ["7iaZAmaYY9dNNEShmJmROI8XrtH2"];

export default function EventRegisterTab({ event }: Props) {
  const { t } = useLanguage();
  const { user, setShowLogin } = useAuth();
  const [registrations, setRegistrations] = useState<EventRegistration[]>([]);
  const [showRegSheet, setShowRegSheet] = useState(false);

  const canManage = user && (
    user.uid === event.hostId ||
    event.staffIds?.includes(user.uid) ||
    ADMIN_UIDS.includes(user.uid) ||
    user.email === "stonehong1@gmail.com"
  );

  useEffect(() => {
    const unsub = eventService.subscribeRegistrations(event.id, setRegistrations);
    return () => unsub();
  }, [event.id]);

  const confirmedCount = registrations.filter(r => r.status === "confirmed").length;
  const pendingCount = registrations.filter(r => r.status === "pending").length;
  const myReg = user ? registrations.find(r => r.userId === user.uid && r.status !== "cancelled") : null;

  const handleRegister = () => {
    if (!user) { setShowLogin(true); return; }
    setShowRegSheet(true);
  };

  const handleStatusChange = async (regId: string, status: "confirmed" | "cancelled") => {
    if (!confirm(`${t('event.confirm_status_change')} ${status}?`)) return;
    try {
      await eventService.updateRegistrationStatus(event.id, regId, status);
    } catch (err) { console.error(err); alert(t('common.failed_update')); }
  };

  return (
    <div className="pb-8">
      {/* Summary Bar */}
      <div className="mx-4 mt-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-xs font-bold text-[#2d3435]">{confirmedCount} {t('event.status_confirmed')}</span>
          </div>
          {pendingCount > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span className="text-xs font-bold text-amber-600">{pendingCount} {t('event.status_pending')}</span>
            </div>
          )}
        </div>
        {!myReg && (
          <button onClick={handleRegister}
            className="flex items-center gap-1 px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold shadow-sm active:scale-95 transition-transform">
            <span className="material-symbols-rounded text-sm">add</span>
            {t('event.register')}
          </button>
        )}
        {myReg && (
          <span className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase ${
            myReg.status === "confirmed" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
          }`}>{myReg.status === "confirmed" ? `✓ ${t('event.status_confirmed')}` : `⏳ ${t('event.status_pending')}`}</span>
        )}
      </div>

      {/* Registrations List */}
      <div className="px-4 mt-4 space-y-2">
        {registrations.filter(r => r.status !== "cancelled").length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-[#acb3b4]">
            <span className="material-symbols-rounded text-4xl mb-2">group_add</span>
            <p className="text-sm font-bold">{t('event.no_registrations_yet')}</p>
            <p className="text-[10px] mt-1">{t('event.be_the_first')}</p>
          </div>
        ) : (
          registrations.filter(r => r.status !== "cancelled").map((reg) => (
            <div key={reg.id} className="flex items-center gap-3 p-3 bg-white border border-[#e0e4e5] rounded-xl">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                {reg.userPhotoURL ? <img src={reg.userPhotoURL} className="w-full h-full object-cover" alt="" /> :
                  <span className="material-symbols-rounded text-lg text-primary">person</span>}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-[#2d3435] truncate">{reg.userName}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md uppercase ${
                    reg.passType === "full_pass" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
                  }`}>{reg.passType === "full_pass" ? t('event.full_pass') : `${reg.selectedProgramIds.length} ${t('event.classes_count')}`}</span>
                  <span className={`w-1.5 h-1.5 rounded-full ${reg.status === "confirmed" ? "bg-emerald-500" : "bg-amber-400"}`} />
                  <span className={`text-[9px] font-bold ${reg.status === "confirmed" ? "text-emerald-600" : "text-amber-600"}`}>
                    {reg.status === "confirmed" ? t('event.status_confirmed') : t('event.status_pending')}
                  </span>
                </div>
              </div>
              {canManage && reg.status === "pending" && (
                <div className="flex items-center gap-1">
                  <button onClick={() => handleStatusChange(reg.id!, "confirmed")}
                    className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center hover:bg-emerald-100 transition-colors">
                    <span className="material-symbols-rounded text-sm text-emerald-600">check</span>
                  </button>
                  <button onClick={() => handleStatusChange(reg.id!, "cancelled")}
                    className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center hover:bg-red-100 transition-colors">
                    <span className="material-symbols-rounded text-sm text-red-500">close</span>
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Registration Bottom Sheet */}
      {showRegSheet && (
        <RegisterBottomSheet
          event={event}
          onClose={() => setShowRegSheet(false)}
          onSubmit={async (data) => {
            try {
              await eventService.addRegistration(event.id, data);
              setShowRegSheet(false);
            } catch (err) { console.error(err); alert(t('event.registration_failed')); }
          }}
        />
      )}
    </div>
  );
}

// ========================================
// Registration Bottom Sheet
// ========================================
interface SheetProps {
  event: Event;
  onClose: () => void;
  onSubmit: (data: Omit<EventRegistration, "id" | "registeredAt">) => void;
}

function RegisterBottomSheet({ event, onClose, onSubmit }: SheetProps) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [passType, setPassType] = useState<"full_pass" | "individual">(
    event.pricing?.fullPassPrice ? "full_pass" : "individual"
  );
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [note, setNote] = useState("");

  const programs = event.programs || [];
  const pricing = event.pricing;
  const currency = pricing?.currency || "KRW";

  const toggleProgram = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  // Calculate total
  const calcTotal = useMemo(() => {
    if (passType === "full_pass" && pricing?.fullPassPrice) {
      return { total: pricing.fullPassPrice.advance, discount: 0, label: t('event.full_pass') };
    }

    let classCount = 0;
    let milongaCount = 0;
    let subtotal = 0;

    selectedIds.forEach(id => {
      const p = programs.find(pr => pr.id === id);
      if (!p) return;
      if (p.type === "milonga" && pricing?.milongaPrice) {
        milongaCount++;
        subtotal += pricing.milongaPrice.advance;
      } else if (p.price) {
        classCount++;
        subtotal += p.price;
      } else if (pricing?.classPrice) {
        classCount++;
        subtotal += pricing.classPrice.advance;
      }
    });

    // Multi-class discount
    let discount = 0;
    if (pricing?.multiClassDiscount) {
      const applicable = pricing.multiClassDiscount
        .filter(d => classCount >= d.minClasses)
        .sort((a, b) => b.minClasses - a.minClasses);
      if (applicable.length > 0) {
        discount = Math.round(subtotal * applicable[0].discountPercent / 100);
      }
    }

    return { total: subtotal - discount, discount, label: `${classCount} ${t('event.classes_count')}${milongaCount > 0 ? ` + ${milongaCount} ${t('event.milonga_count')}` : ""}` };
  }, [passType, selectedIds, programs, pricing]);

  const handleSubmit = () => {
    if (!user) return;
    if (passType === "individual" && selectedIds.length === 0) return alert(t('event.select_at_least_one'));
    onSubmit({
      userId: user.uid,
      userName: user.displayName || "User",
      userPhotoURL: user.photoURL || undefined,
      passType,
      selectedProgramIds: passType === "full_pass" ? programs.map(p => p.id) : selectedIds,
      totalAmount: calcTotal.total,
      discountApplied: calcTotal.discount > 0 ? `${calcTotal.discount.toLocaleString()} ${currency} ${t('event.discount_applied')}` : undefined,
      status: "pending",
      note: note || undefined,
    });
  };

  return (
    <>
      <div className="fixed inset-0 z-[150] bg-black/40 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose} />
      <div className="fixed bottom-0 left-0 right-0 z-[160] bg-white rounded-t-3xl shadow-xl max-h-[80vh] overflow-y-auto animate-in slide-in-from-bottom duration-300">
        <div className="sticky top-0 bg-white z-10 px-4 pt-4 pb-2 border-b border-[#f2f4f4] flex items-center justify-between">
          <h3 className="text-base font-black text-[#2d3435]">{t('event.register')}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-[#f2f4f4] flex items-center justify-center">
            <span className="material-symbols-rounded text-lg text-[#596061]">close</span>
          </button>
        </div>

        <div className="px-4 py-4 space-y-4">
          {/* Pass Type */}
          {pricing?.fullPassPrice && (
            <div className="space-y-2">
              <p className="text-[10px] font-black text-[#acb3b4] uppercase tracking-widest">{t('event.choose_pass')}</p>
              <button onClick={() => setPassType("full_pass")}
                className={`w-full flex items-center justify-between p-3 rounded-xl border-2 transition-all ${
                  passType === "full_pass" ? "border-primary bg-primary/5" : "border-[#e0e4e5] bg-white"
                }`}>
                <div className="flex items-center gap-3">
                  <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${passType === "full_pass" ? "border-primary" : "border-[#acb3b4]"}`}>
                    {passType === "full_pass" && <span className="w-3 h-3 rounded-full bg-primary" />}
                  </span>
                  <div className="text-left">
                    <p className="text-sm font-bold text-[#2d3435]">{t('event.full_pass')}</p>
                    {pricing.fullPassPrice.label && <p className="text-[10px] text-[#acb3b4]">{pricing.fullPassPrice.label}</p>}
                  </div>
                </div>
                <span className="text-sm font-black text-primary">{pricing.fullPassPrice.advance.toLocaleString()} {currency}</span>
              </button>
              <button onClick={() => setPassType("individual")}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                  passType === "individual" ? "border-primary bg-primary/5" : "border-[#e0e4e5] bg-white"
                }`}>
                <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${passType === "individual" ? "border-primary" : "border-[#acb3b4]"}`}>
                  {passType === "individual" && <span className="w-3 h-3 rounded-full bg-primary" />}
                </span>
                <p className="text-sm font-bold text-[#2d3435]">{t('event.individual_select')}</p>
              </button>
            </div>
          )}

          {/* Individual Selection */}
          {passType === "individual" && (
            <div className="space-y-2">
              <p className="text-[10px] font-black text-[#acb3b4] uppercase tracking-widest">{t('event.select_programs')}</p>
              {programs.map(p => {
                const isSelected = selectedIds.includes(p.id);
                const isMilonga = p.type === "milonga";
                const price = isMilonga ? pricing?.milongaPrice?.advance : (p.price || pricing?.classPrice?.advance);
                return (
                  <button key={p.id} onClick={() => toggleProgram(p.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
                      isSelected ? "border-primary bg-primary/5" : "border-[#e0e4e5] bg-white"
                    }`}>
                    <div className="flex items-center gap-3">
                      <span className={`w-5 h-5 rounded-md border-2 flex items-center justify-center ${
                        isSelected ? "border-primary bg-primary" : "border-[#acb3b4]"
                      }`}>
                        {isSelected && <span className="material-symbols-rounded text-sm text-white">check</span>}
                      </span>
                      <div className="text-left">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md ${
                            isMilonga ? "bg-amber-500 text-white" : "bg-primary/10 text-primary"
                          }`}>{p.id}</span>
                          <p className="text-xs font-bold text-[#2d3435]">{p.title}</p>
                        </div>
                        <p className="text-[10px] text-[#acb3b4] mt-0.5">{p.startTime}–{p.endTime}</p>
                      </div>
                    </div>
                    {price && <span className="text-xs font-bold text-[#596061]">{price.toLocaleString()}</span>}
                  </button>
                );
              })}
            </div>
          )}

          {/* Note */}
          <div>
            <p className="text-[10px] font-black text-[#acb3b4] uppercase tracking-widest mb-1">{t('event.note_optional')}</p>
            <textarea value={note} onChange={e => setNote(e.target.value)}
              className="w-full border border-[#e0e4e5] rounded-xl px-3 py-2 text-xs text-[#2d3435] resize-none h-16 focus:border-primary focus:outline-none"
              placeholder={t('event.note_placeholder')} />
          </div>

          {/* Total */}
          <div className="bg-[#f8f9fa] rounded-xl p-4 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#596061]">{calcTotal.label}</span>
              {calcTotal.discount > 0 && (
                <span className="text-[10px] font-bold text-emerald-600">-{calcTotal.discount.toLocaleString()} {currency} discount</span>
              )}
            </div>
            <div className="flex items-center justify-between pt-1.5 border-t border-[#e0e4e5]">
              <span className="text-sm font-bold text-[#2d3435]">{t('chatroom.total')}</span>
              <span className="text-lg font-black text-primary">{calcTotal.total.toLocaleString()} {currency}</span>
            </div>
          </div>

          {/* Submit */}
          <button onClick={handleSubmit}
            className="w-full py-3.5 rounded-2xl bg-primary text-white text-sm font-bold shadow-lg active:scale-[0.98] transition-transform">
            {t('event.register_now')}
          </button>

          <div className="pb-4" />
        </div>
      </div>
    </>
  );
}
