"use client";

import React, { useState } from "react";

const MOCK_STUDENTS = [
  { id: "1", name: "Emily Chen", attendance: 95, assignments: 100, participation: 88, grade: "A", trend: "up" },
  { id: "2", name: "Jason Park", attendance: 88, assignments: 85, participation: 72, grade: "B+", trend: "stable" },
  { id: "3", name: "Sofia Martinez", attendance: 72, assignments: 60, participation: 55, grade: "C+", trend: "down" },
  { id: "4", name: "Daniel Kim", attendance: 82, assignments: 90, participation: 80, grade: "B", trend: "up" },
  { id: "5", name: "Mia Johnson", attendance: 91, assignments: 95, participation: 92, grade: "A", trend: "up" },
];

export default function StudentReports() {
  const [selected, setSelected] = useState<string | null>(null);
  const student = MOCK_STUDENTS.find(s => s.id === selected);

  if (student) {
    const metrics = [
      { label: "Attendance", value: student.attendance, color: "bg-primary" },
      { label: "Assignments", value: student.assignments, color: "bg-tertiary" },
      { label: "Participation", value: student.participation, color: "bg-secondary" },
    ];
    return (
      <div className="px-4 py-6 space-y-5 max-w-2xl mx-auto">
        <button onClick={() => setSelected(null)} className="flex items-center gap-1 text-[13px] text-primary font-semibold">
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>Back to List
        </button>
        <div className="bg-surface-container rounded-2xl p-6 border border-outline/5 text-center">
          <div className="w-16 h-16 rounded-full bg-primary/15 flex items-center justify-center text-[22px] font-bold text-primary mx-auto mb-3">{student.name.split(" ").map(n=>n[0]).join("")}</div>
          <h2 className="text-[20px] font-bold text-on-surface">{student.name}</h2>
          <p className="text-[14px] text-on-surface-variant mt-1">Current Grade: <span className="font-bold text-primary text-[18px]">{student.grade}</span></p>
        </div>
        {/* Metrics */}
        <div className="space-y-3">
          {metrics.map(m => (
            <div key={m.label} className="bg-surface-container rounded-xl p-4 border border-outline/5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[14px] font-semibold text-on-surface">{m.label}</span>
                <span className="text-[18px] font-bold text-on-surface">{m.value}%</span>
              </div>
              <div className="w-full h-3 rounded-full bg-outline/10 overflow-hidden">
                <div className={`h-full rounded-full ${m.color} transition-all`} style={{ width: `${m.value}%` }} />
              </div>
            </div>
          ))}
        </div>
        {/* Notes */}
        <div className="bg-surface-container rounded-2xl p-5 border border-outline/5">
          <h3 className="text-[14px] font-bold text-on-surface mb-2 flex items-center gap-2"><span className="material-symbols-outlined text-[18px]">edit_note</span>Instructor Notes</h3>
          <p className="text-[13px] text-on-surface-variant leading-relaxed">Showing great improvement in recent weeks. Attendance is consistent. Recommend additional practice sessions to strengthen fundamentals.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 space-y-5 max-w-2xl mx-auto">
      <div>
        <h2 className="text-[20px] font-bold text-on-surface">Student Reports</h2>
        <p className="text-[13px] text-on-surface-variant mt-0.5">Track progress and generate analytics</p>
      </div>
      <div className="space-y-2">
        {MOCK_STUDENTS.map(s => (
          <div key={s.id} onClick={() => setSelected(s.id)} className="flex items-center gap-3 bg-surface-container rounded-xl p-4 border border-outline/5 cursor-pointer hover:shadow-md transition-all">
            <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center text-[13px] font-bold text-primary">{s.name.split(" ").map(n=>n[0]).join("")}</div>
            <div className="flex-1">
              <p className="text-[14px] font-semibold text-on-surface">{s.name}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[11px] text-on-surface-variant">Att: {s.attendance}%</span>
                <span className="text-[11px] text-on-surface-variant">·</span>
                <span className="text-[11px] text-on-surface-variant">Hw: {s.assignments}%</span>
              </div>
            </div>
            <div className="text-right flex items-center gap-2">
              <span className="text-[18px] font-bold text-primary">{s.grade}</span>
              <span className={`material-symbols-outlined text-[16px] ${s.trend === "up" ? "text-primary" : s.trend === "down" ? "text-error" : "text-on-surface-variant/40"}`}>{s.trend === "up" ? "trending_up" : s.trend === "down" ? "trending_down" : "trending_flat"}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
