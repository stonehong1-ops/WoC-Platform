"use client";

import React, { useState } from "react";

const MOCK_STUDENTS = [
  { id: "1", name: "Emily Chen", avatar: "", status: "present" as const, enrolled: "Jan 15, 2026", rate: 95, contact: "emily@mail.com", streak: 8 },
  { id: "2", name: "Jason Park", avatar: "", status: "present" as const, enrolled: "Feb 3, 2026", rate: 88, contact: "jason@mail.com", streak: 5 },
  { id: "3", name: "Sofia Martinez", avatar: "", status: "absent" as const, enrolled: "Mar 10, 2026", rate: 72, contact: "sofia@mail.com", streak: 0 },
  { id: "4", name: "Daniel Kim", avatar: "", status: "late" as const, enrolled: "Jan 20, 2026", rate: 82, contact: "daniel@mail.com", streak: 2 },
  { id: "5", name: "Mia Johnson", avatar: "", status: "present" as const, enrolled: "Apr 1, 2026", rate: 91, contact: "mia@mail.com", streak: 12 },
  { id: "6", name: "Alex Lee", avatar: "", status: "excused" as const, enrolled: "Feb 14, 2026", rate: 78, contact: "alex@mail.com", streak: 0 },
];

const STATUS_STYLE: Record<string, { bg: string; text: string; label: string }> = {
  present: { bg: "bg-primary/10", text: "text-primary", label: "Present" },
  absent: { bg: "bg-error/10", text: "text-error", label: "Absent" },
  late: { bg: "bg-amber-500/10", text: "text-amber-600", label: "Late" },
  excused: { bg: "bg-outline/10", text: "text-on-surface-variant", label: "Excused" },
};

export default function ClassManagerA() {
  const [tab, setTab] = useState<"roster" | "today" | "history">("today");
  const todayPresent = MOCK_STUDENTS.filter(s => s.status === "present").length;
  const todayTotal = MOCK_STUDENTS.length;

  return (
    <div className="px-4 py-6 space-y-5 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[20px] font-bold text-on-surface">Class Manager A</h2>
          <p className="text-[13px] text-on-surface-variant mt-0.5">Student roster & attendance tracking</p>
        </div>
        <button className="flex items-center gap-1.5 px-4 py-2 bg-primary text-on-primary rounded-full text-[13px] font-semibold shadow-md">
          <span className="material-symbols-outlined text-[18px]">person_add</span>
          Add Student
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2">
        <div className="bg-primary/10 rounded-xl p-3 text-center"><p className="text-[20px] font-bold text-primary">{todayPresent}</p><p className="text-[9px] text-on-surface-variant font-semibold">Present</p></div>
        <div className="bg-error/10 rounded-xl p-3 text-center"><p className="text-[20px] font-bold text-error">1</p><p className="text-[9px] text-on-surface-variant font-semibold">Absent</p></div>
        <div className="bg-amber-500/10 rounded-xl p-3 text-center"><p className="text-[20px] font-bold text-amber-600">1</p><p className="text-[9px] text-on-surface-variant font-semibold">Late</p></div>
        <div className="bg-surface-container rounded-xl p-3 text-center"><p className="text-[20px] font-bold text-on-surface">{todayTotal}</p><p className="text-[9px] text-on-surface-variant font-semibold">Total</p></div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {(["today", "roster", "history"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-1.5 rounded-full text-[12px] font-semibold capitalize transition-all ${tab === t ? "bg-primary text-on-primary" : "bg-surface-container text-on-surface-variant"}`}>
            {t === "today" ? "Today" : t === "roster" ? "Roster" : "History"}
          </button>
        ))}
      </div>

      {/* Student List */}
      <div className="space-y-2">
        {MOCK_STUDENTS.map(s => {
          const st = STATUS_STYLE[s.status];
          return (
            <div key={s.id} className="flex items-center gap-3 bg-surface-container rounded-xl p-4 border border-outline/5">
              <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center text-[13px] font-bold text-primary shrink-0">{s.name.split(" ").map(n=>n[0]).join("")}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-[14px] font-semibold text-on-surface">{s.name}</p>
                  {s.streak > 0 && <span className="text-[10px]">🔥{s.streak}</span>}
                </div>
                <p className="text-[11px] text-on-surface-variant">Since {s.enrolled} · {s.rate}% attendance</p>
              </div>
              {tab === "today" ? (
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${st.bg} ${st.text}`}>{st.label}</span>
              ) : (
                <div className="text-right">
                  <p className={`text-[16px] font-bold ${s.rate >= 85 ? "text-primary" : s.rate >= 70 ? "text-amber-600" : "text-error"}`}>{s.rate}%</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
