"use client";
import React, { useState } from "react";
const TYPES = ["Equipment", "Furniture", "Electronics", "Studio Devices"];
const MOCK_ASSETS = [
  { id: "1", name: "JBL PA System", type: "Electronics", status: "in-use" as const, assignee: "Studio A", acquired: "Jan 2025", value: 2500, nextMaint: "Jun 2026" },
  { id: "2", name: "Dance Mirror Wall", type: "Furniture", status: "in-use" as const, assignee: "Studio B", acquired: "Mar 2024", value: 1800, nextMaint: "Dec 2026" },
  { id: "3", name: "Projector", type: "Electronics", status: "maintenance" as const, assignee: "Storage", acquired: "Jun 2023", value: 800, nextMaint: "May 2026" },
  { id: "4", name: "Folding Tables (x10)", type: "Furniture", status: "in-use" as const, assignee: "Event Hall", acquired: "Aug 2024", value: 600, nextMaint: null },
  { id: "5", name: "Wireless Mic Set", type: "Electronics", status: "available" as const, assignee: null, acquired: "Nov 2025", value: 450, nextMaint: null },
  { id: "6", name: "Yoga Mats (x20)", type: "Equipment", status: "in-use" as const, assignee: "Studio C", acquired: "Feb 2026", value: 200, nextMaint: null },
];
const STATUS_MAP: Record<string, { bg: string; text: string; label: string }> = {
  "in-use": { bg: "bg-primary/10", text: "text-primary", label: "In Use" },
  available: { bg: "bg-emerald-500/10", text: "text-emerald-600", label: "Available" },
  maintenance: { bg: "bg-amber-500/10", text: "text-amber-600", label: "Maintenance" },
  retired: { bg: "bg-outline/10", text: "text-on-surface-variant", label: "Retired" },
};
export default function AssetManagement() {
  const [filter, setFilter] = useState("all");
  const filtered = filter === "all" ? MOCK_ASSETS : MOCK_ASSETS.filter(a => a.type === filter);
  const totalValue = MOCK_ASSETS.reduce((s, a) => s + a.value, 0);
  return (
    <div className="px-4 py-6 space-y-5 max-w-2xl mx-auto">
      <div className="flex items-center justify-between"><div><h2 className="text-[20px] font-bold text-on-surface">Asset Management</h2><p className="text-[13px] text-on-surface-variant mt-0.5">Equipment & asset tracking</p></div>
        <button className="flex items-center gap-1.5 px-4 py-2 bg-primary text-on-primary rounded-full text-[13px] font-semibold shadow-md"><span className="material-symbols-outlined text-[18px]">add</span>Register</button></div>
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-surface-container rounded-xl p-3 text-center border border-outline/5"><p className="text-[20px] font-bold text-on-surface">{MOCK_ASSETS.length}</p><p className="text-[9px] text-on-surface-variant font-semibold">Total Assets</p></div>
        <div className="bg-primary/10 rounded-xl p-3 text-center"><p className="text-[20px] font-bold text-primary">${(totalValue / 1000).toFixed(1)}k</p><p className="text-[9px] text-on-surface-variant font-semibold">Total Value</p></div>
        <div className="bg-amber-500/10 rounded-xl p-3 text-center"><p className="text-[20px] font-bold text-amber-600">{MOCK_ASSETS.filter(a => a.status === "maintenance").length}</p><p className="text-[9px] text-on-surface-variant font-semibold">Maintenance</p></div>
      </div>
      <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
        <button onClick={() => setFilter("all")} className={`px-3 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap ${filter === "all" ? "bg-primary text-on-primary" : "bg-surface-container text-on-surface-variant"}`}>All</button>
        {TYPES.map(t => <button key={t} onClick={() => setFilter(t)} className={`px-3 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap ${filter === t ? "bg-primary text-on-primary" : "bg-surface-container text-on-surface-variant"}`}>{t}</button>)}
      </div>
      <div className="space-y-2">{filtered.map(a => { const st = STATUS_MAP[a.status]; return (
        <div key={a.id} className="bg-surface-container rounded-xl p-4 border border-outline/5">
          <div className="flex items-center justify-between mb-1"><p className="text-[14px] font-semibold text-on-surface">{a.name}</p><span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${st.bg} ${st.text}`}>{st.label}</span></div>
          <div className="flex items-center gap-3 text-[11px] text-on-surface-variant"><span>{a.type}</span><span>·</span><span>${a.value.toLocaleString()}</span>{a.assignee && <><span>·</span><span>{a.assignee}</span></>}</div>
          {a.nextMaint && <div className="flex items-center gap-1 mt-2 text-amber-600 text-[10px]"><span className="material-symbols-outlined text-[14px]">build</span><span className="font-semibold">Next maintenance: {a.nextMaint}</span></div>}
        </div>
      ); })}</div>
    </div>
  );
}
