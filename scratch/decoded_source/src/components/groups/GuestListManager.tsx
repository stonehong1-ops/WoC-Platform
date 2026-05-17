"use client";

import React, { useState } from "react";

const MOCK_GUESTS = [
  { id: "1", name: "John Williams", email: "john@example.com", type: "VIP" as const, invitation: "accepted" as const, checkedIn: true, notes: "CEO of PartnerCorp" },
  { id: "2", name: "Emma Davis", email: "emma@example.com", type: "VIP" as const, invitation: "accepted" as const, checkedIn: true, notes: "Special dietary: vegetarian" },
  { id: "3", name: "Michael Brown", email: "michael@example.com", type: "Regular" as const, invitation: "sent" as const, checkedIn: false, notes: "" },
  { id: "4", name: "Jennifer Wilson", email: "jennifer@example.com", type: "Regular" as const, invitation: "accepted" as const, checkedIn: false, notes: "Bringing +1" },
  { id: "5", name: "Robert Taylor", email: "robert@example.com", type: "VIP" as const, invitation: "declined" as const, checkedIn: false, notes: "Schedule conflict" },
  { id: "6", name: "Amanda Clark", email: "amanda@example.com", type: "Regular" as const, invitation: "sent" as const, checkedIn: false, notes: "" },
];

const INV_MAP: Record<string, { bg: string; text: string; label: string }> = {
  accepted: { bg: "bg-primary/10", text: "text-primary", label: "Accepted" },
  sent: { bg: "bg-amber-500/10", text: "text-amber-600", label: "Pending" },
  declined: { bg: "bg-error/10", text: "text-error", label: "Declined" },
};

export default function GuestListManager() {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const filtered = MOCK_GUESTS
    .filter(g => filter === "all" || (filter === "vip" && g.type === "VIP") || (filter === "checkedin" && g.checkedIn) || g.invitation === filter)
    .filter(g => !search || g.name.toLowerCase().includes(search.toLowerCase()));

  const vipCount = MOCK_GUESTS.filter(g => g.type === "VIP").length;
  const acceptedCount = MOCK_GUESTS.filter(g => g.invitation === "accepted").length;
  const checkedInCount = MOCK_GUESTS.filter(g => g.checkedIn).length;

  return (
    <div className="px-4 py-6 space-y-5 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[20px] font-bold text-on-surface">Guest List Manager</h2>
          <p className="text-[13px] text-on-surface-variant mt-0.5">Invitations, VIP tagging & entry tracking</p>
        </div>
        <button className="flex items-center gap-1.5 px-4 py-2 bg-primary text-on-primary rounded-full text-[13px] font-semibold shadow-md">
          <span className="material-symbols-outlined text-[18px]">person_add</span>
          Add Guest
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2">
        <div className="bg-surface-container rounded-xl p-3 text-center border border-outline/5"><p className="text-[20px] font-bold text-on-surface">{MOCK_GUESTS.length}</p><p className="text-[9px] text-on-surface-variant font-semibold">Total</p></div>
        <div className="bg-amber-500/10 rounded-xl p-3 text-center"><p className="text-[20px] font-bold text-amber-600">{vipCount}</p><p className="text-[9px] text-on-surface-variant font-semibold">VIP</p></div>
        <div className="bg-primary/10 rounded-xl p-3 text-center"><p className="text-[20px] font-bold text-primary">{acceptedCount}</p><p className="text-[9px] text-on-surface-variant font-semibold">Confirmed</p></div>
        <div className="bg-emerald-500/10 rounded-xl p-3 text-center"><p className="text-[20px] font-bold text-emerald-600">{checkedInCount}</p><p className="text-[9px] text-on-surface-variant font-semibold">Arrived</p></div>
      </div>

      {/* Search */}
      <div className="relative">
        <span className="material-symbols-outlined text-[18px] absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/40">search</span>
        <input value={search} onChange={e => setSearch(e.target.value)} className="w-full bg-surface-container border border-outline/10 rounded-xl pl-10 pr-4 py-2.5 text-[13px]" placeholder="Search guests..." />
      </div>

      {/* Filter */}
      <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
        {[["all", "All"], ["vip", "VIP"], ["accepted", "Accepted"], ["sent", "Pending"], ["declined", "Declined"], ["checkedin", "Arrived"]].map(([k, v]) => (
          <button key={k} onClick={() => setFilter(k)} className={`px-3 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap ${filter === k ? "bg-primary text-on-primary" : "bg-surface-container text-on-surface-variant"}`}>{v}</button>
        ))}
      </div>

      {/* Guest List */}
      <div className="space-y-2">
        {filtered.map(g => {
          const inv = INV_MAP[g.invitation];
          return (
            <div key={g.id} className="bg-surface-container rounded-xl p-4 border border-outline/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center text-[12px] font-bold text-primary shrink-0">{g.name.split(" ").map(n=>n[0]).join("")}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-[14px] font-semibold text-on-surface">{g.name}</p>
                    {g.type === "VIP" && <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 text-[9px] font-bold">VIP</span>}
                    {g.checkedIn && <span className="material-symbols-outlined text-[14px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>}
                  </div>
                  <p className="text-[11px] text-on-surface-variant">{g.email}</p>
                  {g.notes && <p className="text-[10px] text-on-surface-variant/50 mt-0.5 italic">{g.notes}</p>}
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${inv.bg} ${inv.text}`}>{inv.label}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
