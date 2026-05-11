"use client";

import React from "react";

const LEVELS = [
  { id: "1", name: "Beginner", icon: "🌱", color: "bg-emerald-100 border-emerald-300 text-emerald-800", requirements: "Complete introductory course", students: 12, certified: 10 },
  { id: "2", name: "Elementary", icon: "🌿", color: "bg-teal-100 border-teal-300 text-teal-800", requirements: "Pass Level 1 evaluation + 50 hours", students: 8, certified: 6 },
  { id: "3", name: "Intermediate", icon: "🌳", color: "bg-blue-100 border-blue-300 text-blue-800", requirements: "Pass Level 2 evaluation + 100 hours", students: 5, certified: 3 },
  { id: "4", name: "Advanced", icon: "⭐", color: "bg-purple-100 border-purple-300 text-purple-800", requirements: "Pass Level 3 evaluation + 200 hours", students: 3, certified: 2 },
  { id: "5", name: "Master", icon: "👑", color: "bg-amber-100 border-amber-300 text-amber-800", requirements: "Instructor recommendation + 500 hours", students: 1, certified: 1 },
];

const MOCK_STUDENTS = [
  { name: "Emily Chen", level: "Intermediate", hours: 124, nextEval: "May 20", progress: 62 },
  { name: "Jason Park", level: "Elementary", hours: 67, nextEval: "May 25", progress: 34 },
  { name: "Mia Johnson", level: "Advanced", hours: 231, nextEval: "Jun 1", progress: 77 },
  { name: "Daniel Kim", level: "Beginner", hours: 28, nextEval: "May 18", progress: 56 },
];

export default function GradeSystem() {
  return (
    <div className="px-4 py-6 space-y-5 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[20px] font-bold text-on-surface">Grade System</h2>
          <p className="text-[13px] text-on-surface-variant mt-0.5">Levels, evaluations & certifications</p>
        </div>
        <button className="flex items-center gap-1.5 px-4 py-2 bg-primary text-on-primary rounded-full text-[13px] font-semibold shadow-md">
          <span className="material-symbols-outlined text-[18px]">settings</span>
          Configure
        </button>
      </div>

      {/* Level Ladder */}
      <div className="space-y-2">
        {LEVELS.map((l, i) => (
          <div key={l.id} className={`rounded-xl p-4 border ${l.color} flex items-center gap-3`}>
            <span className="text-[28px]">{l.icon}</span>
            <div className="flex-1">
              <p className="text-[15px] font-bold">{l.name}</p>
              <p className="text-[11px] opacity-70">{l.requirements}</p>
            </div>
            <div className="text-right">
              <p className="text-[14px] font-bold">{l.students}</p>
              <p className="text-[9px] opacity-60">{l.certified} certified</p>
            </div>
          </div>
        ))}
      </div>

      {/* Student Progress */}
      <h3 className="text-[14px] font-bold text-on-surface pt-2">Student Progress</h3>
      <div className="space-y-2">
        {MOCK_STUDENTS.map((s, i) => (
          <div key={i} className="bg-surface-container rounded-xl p-4 border border-outline/5">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center text-[12px] font-bold text-primary">{s.name.split(" ").map(n=>n[0]).join("")}</div>
                <div>
                  <p className="text-[14px] font-semibold text-on-surface">{s.name}</p>
                  <p className="text-[11px] text-on-surface-variant">{s.level} · {s.hours}h · Next eval: {s.nextEval}</p>
                </div>
              </div>
              <span className="text-[14px] font-bold text-primary">{s.progress}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-outline/10 overflow-hidden">
              <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${s.progress}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
