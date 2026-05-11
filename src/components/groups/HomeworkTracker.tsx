"use client";

import React, { useState } from "react";

const MOCK_ASSIGNMENTS = [
  { id: "1", title: "Practice Log — Week 5", dueDate: "May 16", status: "submitted" as const, submittedCount: 14, totalCount: 18, feedback: true },
  { id: "2", title: "Video Recording: Routine Practice", dueDate: "May 18", status: "pending" as const, submittedCount: 6, totalCount: 18, feedback: false },
  { id: "3", title: "Written Reflection — Mid-Term", dueDate: "May 14", status: "overdue" as const, submittedCount: 16, totalCount: 18, feedback: true },
  { id: "4", title: "Group Project Proposal", dueDate: "May 22", status: "pending" as const, submittedCount: 3, totalCount: 18, feedback: false },
  { id: "5", title: "Final Presentation Outline", dueDate: "May 28", status: "upcoming" as const, submittedCount: 0, totalCount: 18, feedback: false },
];

const STATUS_MAP: Record<string, { bg: string; text: string; label: string; icon: string }> = {
  submitted: { bg: "bg-primary/10", text: "text-primary", label: "Submitted", icon: "check_circle" },
  pending: { bg: "bg-amber-500/10", text: "text-amber-600", label: "In Progress", icon: "schedule" },
  overdue: { bg: "bg-error/10", text: "text-error", label: "Overdue", icon: "warning" },
  upcoming: { bg: "bg-outline/10", text: "text-on-surface-variant", label: "Upcoming", icon: "event" },
};

export default function HomeworkTracker() {
  const [view, setView] = useState<"all" | "pending" | "overdue">("all");
  const filtered = view === "all" ? MOCK_ASSIGNMENTS : MOCK_ASSIGNMENTS.filter(a => a.status === view);

  return (
    <div className="px-4 py-6 space-y-5 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[20px] font-bold text-on-surface">Homework Tracker</h2>
          <p className="text-[13px] text-on-surface-variant mt-0.5">Track submissions and provide feedback</p>
        </div>
        <button className="flex items-center gap-1.5 px-4 py-2 bg-primary text-on-primary rounded-full text-[13px] font-semibold shadow-md">
          <span className="material-symbols-outlined text-[18px]">add_task</span>
          Assign
        </button>
      </div>

      <div className="flex gap-2">
        {(["all", "pending", "overdue"] as const).map(f => (
          <button key={f} onClick={() => setView(f)} className={`px-4 py-1.5 rounded-full text-[12px] font-semibold capitalize transition-all ${view === f ? "bg-primary text-on-primary" : "bg-surface-container text-on-surface-variant"}`}>{f}</button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map(a => {
          const s = STATUS_MAP[a.status];
          const pct = Math.round((a.submittedCount / a.totalCount) * 100);
          return (
            <div key={a.id} className="bg-surface-container rounded-2xl p-4 border border-outline/5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className={`material-symbols-outlined text-[20px] ${s.text}`} style={{ fontVariationSettings: "'FILL' 1" }}>{s.icon}</span>
                  <div>
                    <h3 className="text-[15px] font-semibold text-on-surface">{a.title}</h3>
                    <p className="text-[11px] text-on-surface-variant/60">Due: {a.dueDate}</p>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${s.bg} ${s.text}`}>{s.label}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-2 rounded-full bg-outline/10 overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${a.status === "overdue" ? "bg-error" : "bg-primary"}`} style={{ width: `${pct}%` }} />
                </div>
                <span className="text-[12px] font-bold text-on-surface-variant">{a.submittedCount}/{a.totalCount}</span>
                {a.feedback && <span className="material-symbols-outlined text-[16px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>rate_review</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
