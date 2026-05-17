"use client";
import React, { useState } from "react";
const MOCK_POSITIONS = [
  { id: "1", title: "Dance Instructor (Contemporary)", dept: "Education", applicants: 12, status: "open" as const, posted: "May 1" },
  { id: "2", title: "Community Manager", dept: "Operations", applicants: 8, status: "open" as const, posted: "May 3" },
  { id: "3", title: "Event Coordinator", dept: "Events", applicants: 15, status: "closed" as const, posted: "Apr 15" },
  { id: "4", title: "Social Media Intern", dept: "Marketing", applicants: 22, status: "open" as const, posted: "May 5" },
];
const MOCK_APPLICANTS = [
  { id: "a1", name: "Alex Kim", position: "Dance Instructor", stage: "Interview" as const, applied: "May 2", rating: 4 },
  { id: "a2", name: "Jordan Lee", position: "Community Manager", stage: "Screening" as const, applied: "May 4", rating: 3 },
  { id: "a3", name: "Taylor Park", position: "Social Media Intern", stage: "Applied" as const, applied: "May 6", rating: 0 },
  { id: "a4", name: "Morgan Chen", position: "Dance Instructor", stage: "Final Review" as const, applied: "May 1", rating: 5 },
];
const STAGE_MAP: Record<string, { bg: string; text: string }> = {
  Applied: { bg: "bg-outline/10", text: "text-on-surface-variant" }, Screening: { bg: "bg-amber-500/10", text: "text-amber-600" },
  Interview: { bg: "bg-primary/10", text: "text-primary" }, "Final Review": { bg: "bg-emerald-500/10", text: "text-emerald-600" },
};
export default function Recruitment() {
  const [tab, setTab] = useState<"positions" | "applicants">("positions");
  return (
    <div className="px-4 py-6 space-y-5 max-w-2xl mx-auto">
      <div className="flex items-center justify-between"><div><h2 className="text-[20px] font-bold text-on-surface">Recruitment</h2><p className="text-[13px] text-on-surface-variant mt-0.5">Open positions & applicant review</p></div>
        <button className="flex items-center gap-1.5 px-4 py-2 bg-primary text-on-primary rounded-full text-[13px] font-semibold shadow-md"><span className="material-symbols-outlined text-[18px]">add</span>Post</button></div>
      <div className="flex gap-2">
        <button onClick={() => setTab("positions")} className={`px-4 py-1.5 rounded-full text-[12px] font-semibold ${tab === "positions" ? "bg-primary text-on-primary" : "bg-surface-container text-on-surface-variant"}`}>Positions</button>
        <button onClick={() => setTab("applicants")} className={`px-4 py-1.5 rounded-full text-[12px] font-semibold ${tab === "applicants" ? "bg-primary text-on-primary" : "bg-surface-container text-on-surface-variant"}`}>Applicants</button>
      </div>
      {tab === "positions" && <div className="space-y-2">{MOCK_POSITIONS.map(p => (
        <div key={p.id} className="bg-surface-container rounded-xl p-4 border border-outline/5">
          <div className="flex items-center justify-between mb-1"><h3 className="text-[14px] font-bold text-on-surface">{p.title}</h3><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${p.status === "open" ? "bg-primary/10 text-primary" : "bg-outline/10 text-on-surface-variant"}`}>{p.status}</span></div>
          <div className="flex items-center gap-3 text-[11px] text-on-surface-variant"><span>{p.dept}</span><span>·</span><span>Posted {p.posted}</span><span>·</span><span className="font-semibold text-primary">{p.applicants} applicants</span></div>
        </div>
      ))}</div>}
      {tab === "applicants" && <div className="space-y-2">{MOCK_APPLICANTS.map(a => { const sg = STAGE_MAP[a.stage]; return (
        <div key={a.id} className="flex items-center gap-3 bg-surface-container rounded-xl p-4 border border-outline/5">
          <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center text-[12px] font-bold text-primary">{a.name.split(" ").map(n=>n[0]).join("")}</div>
          <div className="flex-1"><div className="flex items-center gap-2"><p className="text-[14px] font-semibold text-on-surface">{a.name}</p><span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${sg.bg} ${sg.text}`}>{a.stage}</span></div><p className="text-[11px] text-on-surface-variant">{a.position} · Applied {a.applied}</p></div>
          {a.rating > 0 && <div className="flex gap-0.5">{Array.from({length: 5}).map((_, i) => <span key={i} className={`text-[12px] ${i < a.rating ? "text-amber-500" : "text-outline/20"}`}>★</span>)}</div>}
        </div>
      ); })}</div>}
    </div>
  );
}
