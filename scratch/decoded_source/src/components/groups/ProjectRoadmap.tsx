"use client";
import React from "react";
const MILESTONES = [
  { id: "1", title: "Platform MVP Launch", version: "v1.0", start: "Jan 2026", end: "Mar 2026", progress: 100, status: "completed" as const, deps: [] },
  { id: "2", title: "Community Features", version: "v2.0", start: "Mar 2026", end: "May 2026", progress: 85, status: "active" as const, deps: ["1"] },
  { id: "3", title: "Commerce Integration", version: "v3.0", start: "May 2026", end: "Jul 2026", progress: 30, status: "active" as const, deps: ["2"] },
  { id: "4", title: "Education Suite", version: "v4.0", start: "Jul 2026", end: "Sep 2026", progress: 0, status: "planned" as const, deps: ["2"] },
  { id: "5", title: "Analytics & Insights", version: "v5.0", start: "Sep 2026", end: "Nov 2026", progress: 0, status: "planned" as const, deps: ["3", "4"] },
];
const STATUS_MAP: Record<string, { bg: string; text: string; barBg: string }> = {
  completed: { bg: "bg-primary/10", text: "text-primary", barBg: "bg-primary" },
  active: { bg: "bg-emerald-500/10", text: "text-emerald-600", barBg: "bg-emerald-500" },
  planned: { bg: "bg-outline/10", text: "text-on-surface-variant", barBg: "bg-outline/30" },
};
export default function ProjectRoadmap() {
  return (
    <div className="px-4 py-6 space-y-5 max-w-2xl mx-auto">
      <div><h2 className="text-[20px] font-bold text-on-surface">Project Roadmap</h2><p className="text-[13px] text-on-surface-variant mt-0.5">Long-term milestones & planning</p></div>
      <div className="relative">
        <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-outline/10" />
        <div className="space-y-4">
          {MILESTONES.map((m, i) => { const st = STATUS_MAP[m.status]; return (
            <div key={m.id} className="relative pl-12">
              <div className={`absolute left-3.5 top-4 w-3 h-3 rounded-full border-2 ${m.status === "completed" ? "bg-primary border-primary" : m.status === "active" ? "bg-emerald-500 border-emerald-500" : "bg-surface border-outline/30"}`} />
              <div className="bg-surface-container rounded-2xl p-4 border border-outline/5">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2"><h3 className="text-[15px] font-bold text-on-surface">{m.title}</h3><span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-surface text-on-surface-variant border border-outline/10">{m.version}</span></div>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${st.bg} ${st.text}`}>{m.status}</span>
                </div>
                <p className="text-[11px] text-on-surface-variant">{m.start} — {m.end}</p>
                {m.progress > 0 && <div className="mt-3"><div className="flex justify-between text-[10px] mb-1"><span className="text-on-surface-variant">Progress</span><span className="font-bold text-on-surface">{m.progress}%</span></div><div className="w-full h-2 rounded-full bg-outline/10 overflow-hidden"><div className={`h-full rounded-full ${st.barBg}`} style={{ width: `${m.progress}%` }} /></div></div>}
                {m.deps.length > 0 && <div className="flex items-center gap-1 mt-2 text-[9px] text-on-surface-variant"><span className="material-symbols-outlined text-[12px]">link</span>Depends on: {m.deps.map(d => MILESTONES.find(ms => ms.id === d)?.version).join(", ")}</div>}
              </div>
            </div>
          ); })}
        </div>
      </div>
    </div>
  );
}
