"use client";
import React, { useState } from "react";
const TAGS = ["VIP", "Instructor", "Student", "Partner", "Lead"];
const TAG_COLORS: Record<string, string> = { VIP: "bg-amber-500/10 text-amber-600", Instructor: "bg-primary/10 text-primary", Student: "bg-emerald-500/10 text-emerald-600", Partner: "bg-secondary/10 text-secondary", Lead: "bg-error/10 text-error" };
const MOCK_CONTACTS = [
  { id: "1", name: "Emily Chen", email: "emily@woc.today", tags: ["VIP", "Instructor"], lastActivity: "2 days ago", notes: "Key partner for summer program", followUp: "May 15" },
  { id: "2", name: "Jason Park", email: "jason@woc.today", tags: ["Lead"], lastActivity: "1 week ago", notes: "Interested in premium membership", followUp: "May 12" },
  { id: "3", name: "Sofia Martinez", email: "sofia@email.com", tags: ["Student"], lastActivity: "3 days ago", notes: "", followUp: null },
  { id: "4", name: "Daniel Kim", email: "daniel@partner.co", tags: ["Partner"], lastActivity: "Today", notes: "Equipment vendor — annual contract", followUp: "Jun 1" },
  { id: "5", name: "Mia Johnson", email: "mia@email.com", tags: ["Student", "VIP"], lastActivity: "5 days ago", notes: "Upgrade candidate", followUp: "May 20" },
];
export default function CRMLite() {
  const [search, setSearch] = useState("");
  const [tagFilter, setTagFilter] = useState("all");
  const filtered = MOCK_CONTACTS.filter(c => {
    if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (tagFilter !== "all" && !c.tags.includes(tagFilter)) return false;
    return true;
  });
  return (
    <div className="px-4 py-6 space-y-5 max-w-2xl mx-auto">
      <div><h2 className="text-[20px] font-bold text-on-surface">CRM Lite</h2><p className="text-[13px] text-on-surface-variant mt-0.5">Member & relationship management</p></div>
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-surface-container rounded-xl p-3 text-center border border-outline/5"><p className="text-[20px] font-bold text-on-surface">{MOCK_CONTACTS.length}</p><p className="text-[9px] text-on-surface-variant font-semibold">Contacts</p></div>
        <div className="bg-amber-500/10 rounded-xl p-3 text-center"><p className="text-[20px] font-bold text-amber-600">{MOCK_CONTACTS.filter(c => c.followUp).length}</p><p className="text-[9px] text-on-surface-variant font-semibold">Follow-Ups</p></div>
        <div className="bg-primary/10 rounded-xl p-3 text-center"><p className="text-[20px] font-bold text-primary">{MOCK_CONTACTS.filter(c => c.tags.includes("VIP")).length}</p><p className="text-[9px] text-on-surface-variant font-semibold">VIP</p></div>
      </div>
      <div className="relative"><span className="material-symbols-outlined text-[18px] absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/40">search</span><input value={search} onChange={e => setSearch(e.target.value)} className="w-full bg-surface-container border border-outline/10 rounded-xl pl-10 pr-4 py-2.5 text-[13px]" placeholder="Search contacts..." /></div>
      <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1"><button onClick={() => setTagFilter("all")} className={`px-3 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap ${tagFilter === "all" ? "bg-primary text-on-primary" : "bg-surface-container text-on-surface-variant"}`}>All</button>{TAGS.map(t => <button key={t} onClick={() => setTagFilter(t)} className={`px-3 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap ${tagFilter === t ? "bg-primary text-on-primary" : "bg-surface-container text-on-surface-variant"}`}>{t}</button>)}</div>
      <div className="space-y-2">{filtered.map(c => (
        <div key={c.id} className="bg-surface-container rounded-xl p-4 border border-outline/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center text-[12px] font-bold text-primary">{c.name.split(" ").map(n=>n[0]).join("")}</div>
            <div className="flex-1 min-w-0"><div className="flex items-center gap-2 flex-wrap"><p className="text-[14px] font-semibold text-on-surface">{c.name}</p>{c.tags.map(t => <span key={t} className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${TAG_COLORS[t]}`}>{t}</span>)}</div><p className="text-[11px] text-on-surface-variant">{c.email} · {c.lastActivity}</p></div>
          </div>
          {c.notes && <p className="text-[11px] text-on-surface-variant/70 mt-2 pl-[52px]">{c.notes}</p>}
          {c.followUp && <div className="flex items-center gap-1 mt-1 pl-[52px]"><span className="material-symbols-outlined text-[12px] text-amber-600">schedule</span><span className="text-[10px] font-semibold text-amber-600">Follow-up: {c.followUp}</span></div>}
        </div>
      ))}</div>
    </div>
  );
}
