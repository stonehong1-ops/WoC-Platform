"use client";
import React, { useState } from "react";
const TEAMS = [{ id: "t1", name: "Operations", members: 5 }, { id: "t2", name: "Education", members: 8 }, { id: "t3", name: "Events", members: 4 }];
const MOCK_FEED = [
  { id: "1", author: "Emily C.", action: "uploaded", target: "Q2 Budget Report.xlsx", time: "2h ago" },
  { id: "2", author: "Jason P.", action: "completed task", target: "Venue Setup Checklist", time: "4h ago" },
  { id: "3", author: "Sofia M.", action: "added note", target: "Workshop prep reminders for June", time: "6h ago" },
  { id: "4", author: "Daniel K.", action: "shared", target: "Equipment Inventory.pdf", time: "1d ago" },
];
const MOCK_FILES = [
  { name: "Q2 Budget Report.xlsx", size: "245 KB", updated: "May 8", by: "Emily C." },
  { name: "Event Photos — Apr.zip", size: "12 MB", updated: "May 5", by: "Mia J." },
  { name: "Team Guidelines.docx", size: "58 KB", updated: "May 3", by: "Jason P." },
];
export default function TeamWorkspace() {
  const [selectedTeam, setSelectedTeam] = useState("t1");
  const [tab, setTab] = useState<"feed" | "files" | "notes">("feed");
  return (
    <div className="px-4 py-6 space-y-5 max-w-2xl mx-auto">
      <div><h2 className="text-[20px] font-bold text-on-surface">Team Workspace</h2><p className="text-[13px] text-on-surface-variant mt-0.5">Collaborative team spaces</p></div>
      <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">{TEAMS.map(t => <button key={t.id} onClick={() => setSelectedTeam(t.id)} className={`px-4 py-2 rounded-xl text-[12px] font-semibold whitespace-nowrap ${selectedTeam === t.id ? "bg-primary text-on-primary" : "bg-surface-container text-on-surface-variant border border-outline/10"}`}>{t.name}<span className="ml-1.5 opacity-60">({t.members})</span></button>)}</div>
      <div className="flex gap-2">{(["feed", "files", "notes"] as const).map(t => <button key={t} onClick={() => setTab(t)} className={`px-3.5 py-1.5 rounded-full text-[12px] font-semibold capitalize ${tab === t ? "bg-primary text-on-primary" : "bg-surface-container text-on-surface-variant"}`}>{t}</button>)}</div>
      {tab === "feed" && <div className="space-y-2">{MOCK_FEED.map(f => (
        <div key={f.id} className="flex items-center gap-3 bg-surface-container rounded-xl p-3 border border-outline/5">
          <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center text-[10px] font-bold text-primary">{f.author.split(" ").map(n=>n[0]).join("")}</div>
          <div className="flex-1 min-w-0"><p className="text-[13px] text-on-surface"><span className="font-semibold">{f.author}</span> {f.action} <span className="font-semibold">{f.target}</span></p><p className="text-[10px] text-on-surface-variant">{f.time}</p></div>
        </div>
      ))}</div>}
      {tab === "files" && <div className="space-y-2">{MOCK_FILES.map((f, i) => (
        <div key={i} className="flex items-center gap-3 bg-surface-container rounded-xl p-3 border border-outline/5">
          <span className="material-symbols-outlined text-[22px] text-primary">description</span>
          <div className="flex-1 min-w-0"><p className="text-[13px] font-semibold text-on-surface truncate">{f.name}</p><p className="text-[10px] text-on-surface-variant">{f.size} · {f.updated} · {f.by}</p></div>
          <span className="material-symbols-outlined text-[18px] text-on-surface-variant">download</span>
        </div>
      ))}</div>}
      {tab === "notes" && <div className="bg-surface-container rounded-2xl p-5 border border-outline/5 min-h-[200px]"><p className="text-[13px] text-on-surface-variant/50 italic">Quick notes and shared team memos appear here...</p></div>}
    </div>
  );
}
