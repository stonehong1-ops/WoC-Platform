"use client";

import React, { useState } from "react";

const MOCK_EXAMS = [
  { id: "1", title: "Mid-Term Evaluation", date: "May 20", time: "10:00 AM", location: "Studio A", students: 18, status: "upcoming" as const, resultsPublished: false },
  { id: "2", title: "Beginner Level Test", date: "May 22", time: "2:00 PM", location: "Studio B", students: 12, status: "upcoming" as const, resultsPublished: false },
  { id: "3", title: "Monthly Skills Assessment", date: "May 5", time: "11:00 AM", location: "Studio A", students: 15, status: "completed" as const, resultsPublished: true },
  { id: "4", title: "Practice Performance Check", date: "Apr 28", time: "3:00 PM", location: "Studio A", students: 18, status: "completed" as const, resultsPublished: true },
];

const STATUS_MAP: Record<string, { bg: string; text: string; label: string; icon: string }> = {
  upcoming: { bg: "bg-primary/10", text: "text-primary", label: "Upcoming", icon: "event" },
  completed: { bg: "bg-outline/10", text: "text-on-surface-variant", label: "Completed", icon: "check_circle" },
};

export default function ExamScheduler() {
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");
  const filtered = tab === "upcoming"
    ? MOCK_EXAMS.filter(e => e.status === "upcoming")
    : MOCK_EXAMS.filter(e => e.status === "completed");

  return (
    <div className="px-4 py-6 space-y-5 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[20px] font-bold text-on-surface">Exam Scheduler</h2>
          <p className="text-[13px] text-on-surface-variant mt-0.5">Schedule exams & publish results</p>
        </div>
        <button className="flex items-center gap-1.5 px-4 py-2 bg-primary text-on-primary rounded-full text-[13px] font-semibold shadow-md">
          <span className="material-symbols-outlined text-[18px]">edit_calendar</span>
          Schedule
        </button>
      </div>

      <div className="flex gap-2">
        <button onClick={() => setTab("upcoming")} className={`px-4 py-1.5 rounded-full text-[12px] font-semibold transition-all ${tab === "upcoming" ? "bg-primary text-on-primary" : "bg-surface-container text-on-surface-variant"}`}>Upcoming</button>
        <button onClick={() => setTab("past")} className={`px-4 py-1.5 rounded-full text-[12px] font-semibold transition-all ${tab === "past" ? "bg-primary text-on-primary" : "bg-surface-container text-on-surface-variant"}`}>Past Exams</button>
      </div>

      <div className="space-y-3">
        {filtered.map(e => {
          const s = STATUS_MAP[e.status];
          return (
            <div key={e.id} className="bg-surface-container rounded-2xl p-5 border border-outline/5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-xl ${s.bg} flex items-center justify-center`}>
                    <span className={`material-symbols-outlined text-[22px] ${s.text}`}>{s.icon}</span>
                  </div>
                  <div>
                    <h3 className="text-[15px] font-semibold text-on-surface">{e.title}</h3>
                    <p className="text-[12px] text-on-surface-variant mt-0.5">{e.date} · {e.time}</p>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${s.bg} ${s.text}`}>{s.label}</span>
              </div>
              <div className="flex items-center gap-4 text-[11px] text-on-surface-variant/60">
                <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">location_on</span>{e.location}</span>
                <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">group</span>{e.students} students</span>
                {e.resultsPublished && (
                  <span className="flex items-center gap-1 text-primary font-semibold"><span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>Results Published</span>
                )}
              </div>
              {e.status === "upcoming" && (
                <div className="flex gap-2 mt-3">
                  <button className="flex-1 py-2 rounded-xl bg-primary/10 text-primary text-[12px] font-semibold">Send Reminder</button>
                  <button className="flex-1 py-2 rounded-xl bg-surface border border-outline/15 text-on-surface-variant text-[12px] font-semibold">Edit</button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
