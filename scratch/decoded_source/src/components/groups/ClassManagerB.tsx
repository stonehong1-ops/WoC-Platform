"use client";

import React, { useState } from "react";

const MOCK_MATERIALS = [
  { id: "1", title: "Week 1 — Introduction to Fundamentals", category: "Lesson", date: "May 5", files: 3, assigned: true, downloads: 24 },
  { id: "2", title: "Practice Sheet: Basic Patterns", category: "Assignment", date: "May 6", files: 1, assigned: true, downloads: 18 },
  { id: "3", title: "Week 2 — Intermediate Techniques", category: "Lesson", date: "May 12", files: 5, assigned: false, downloads: 31 },
  { id: "4", title: "Reference Video Collection", category: "Resource", date: "May 8", files: 4, assigned: false, downloads: 42 },
  { id: "5", title: "Mid-Term Review Questions", category: "Assignment", date: "May 14", files: 2, assigned: true, downloads: 15 },
];

const CAT_STYLE: Record<string, { bg: string; text: string; icon: string }> = {
  Lesson: { bg: "bg-primary/10", text: "text-primary", icon: "menu_book" },
  Assignment: { bg: "bg-tertiary-container/20", text: "text-on-tertiary-container", icon: "assignment" },
  Resource: { bg: "bg-secondary-container/20", text: "text-on-secondary-container", icon: "folder_open" },
};

export default function ClassManagerB() {
  const [filter, setFilter] = useState("All");

  const filtered = filter === "All" ? MOCK_MATERIALS : MOCK_MATERIALS.filter(m => m.category === filter);

  return (
    <div className="px-4 py-6 space-y-5 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[20px] font-bold text-on-surface">Class Manager B</h2>
          <p className="text-[13px] text-on-surface-variant mt-0.5">Lesson archive & assignment management</p>
        </div>
        <button className="flex items-center gap-1.5 px-4 py-2 bg-primary text-on-primary rounded-full text-[13px] font-semibold shadow-md">
          <span className="material-symbols-outlined text-[18px]">upload_file</span>
          Upload
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {["All", "Lesson", "Assignment", "Resource"].map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`px-3.5 py-1.5 rounded-full text-[12px] font-semibold transition-all ${filter === f ? "bg-primary text-on-primary" : "bg-surface-container text-on-surface-variant"}`}>{f}</button>
        ))}
      </div>

      {/* Material Cards */}
      <div className="space-y-3">
        {filtered.map(m => {
          const cs = CAT_STYLE[m.category] || CAT_STYLE.Resource;
          return (
            <div key={m.id} className="bg-surface-container rounded-2xl p-4 border border-outline/5 hover:shadow-md transition-all cursor-pointer">
              <div className="flex items-start gap-3">
                <div className={`w-11 h-11 rounded-xl ${cs.bg} flex items-center justify-center shrink-0`}>
                  <span className={`material-symbols-outlined text-[22px] ${cs.text}`}>{cs.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-[15px] font-semibold text-on-surface mb-1">{m.title}</h3>
                  <div className="flex items-center gap-3 text-[11px] text-on-surface-variant/60">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${cs.bg} ${cs.text}`}>{m.category}</span>
                    <span>{m.date}</span>
                    <span className="flex items-center gap-0.5"><span className="material-symbols-outlined text-[12px]">attach_file</span>{m.files} files</span>
                    <span className="flex items-center gap-0.5"><span className="material-symbols-outlined text-[12px]">download</span>{m.downloads}</span>
                  </div>
                </div>
                {m.assigned && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 text-[10px] font-bold shrink-0">ASSIGNED</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
