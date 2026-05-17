"use client";
import React, { useState } from "react";
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const STAFF = [
  { name: "Emily C.", shifts: [{ day: 0, start: 9, end: 17 }, { day: 2, start: 9, end: 17 }, { day: 4, start: 9, end: 17 }] },
  { name: "Jason P.", shifts: [{ day: 1, start: 10, end: 18 }, { day: 3, start: 10, end: 18 }, { day: 5, start: 12, end: 20 }] },
  { name: "Sofia M.", shifts: [{ day: 0, start: 14, end: 22 }, { day: 1, start: 14, end: 22 }, { day: 4, start: 14, end: 22 }] },
  { name: "Daniel K.", shifts: [{ day: 2, start: 8, end: 16 }, { day: 3, start: 8, end: 16 }, { day: 5, start: 8, end: 16 }, { day: 6, start: 10, end: 18 }] },
];
const COLORS = ["bg-primary/20 border-primary/40", "bg-secondary/20 border-secondary/40", "bg-amber-500/20 border-amber-500/40", "bg-emerald-500/20 border-emerald-500/40"];
export default function StaffScheduling() {
  const [week] = useState("May 12–18, 2026");
  return (
    <div className="px-4 py-6 space-y-5 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div><h2 className="text-[20px] font-bold text-on-surface">Staff Scheduling</h2><p className="text-[13px] text-on-surface-variant mt-0.5">Weekly shifts & availability</p></div>
        <span className="text-[12px] font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full">{week}</span>
      </div>
      <div className="overflow-x-auto hide-scrollbar">
        <div className="min-w-[700px]">
          {/* Header */}
          <div className="grid grid-cols-8 gap-1 mb-2">
            <div className="text-[11px] font-semibold text-on-surface-variant px-2">Staff</div>
            {DAYS.map(d => <div key={d} className="text-[11px] font-semibold text-on-surface-variant text-center">{d}</div>)}
          </div>
          {/* Rows */}
          {STAFF.map((s, si) => (
            <div key={si} className="grid grid-cols-8 gap-1 mb-1">
              <div className="flex items-center gap-1.5 px-2">
                <div className="w-6 h-6 rounded-full bg-primary/15 flex items-center justify-center text-[8px] font-bold text-primary">{s.name.split(" ").map(n=>n[0]).join("")}</div>
                <span className="text-[11px] font-semibold text-on-surface">{s.name}</span>
              </div>
              {DAYS.map((_, di) => {
                const shift = s.shifts.find(sh => sh.day === di);
                return (
                  <div key={di} className="h-10 rounded-lg bg-surface-container border border-outline/5 flex items-center justify-center">
                    {shift && <div className={`w-full h-full rounded-lg border flex items-center justify-center text-[9px] font-bold text-on-surface ${COLORS[si % COLORS.length]}`}>{shift.start}:00–{shift.end}:00</div>}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-primary/10 rounded-xl p-3 text-center"><p className="text-[20px] font-bold text-primary">{STAFF.length}</p><p className="text-[9px] text-on-surface-variant font-semibold">Active Staff</p></div>
        <div className="bg-surface-container rounded-xl p-3 text-center border border-outline/5"><p className="text-[20px] font-bold text-on-surface">{STAFF.reduce((s, st) => s + st.shifts.length, 0)}</p><p className="text-[9px] text-on-surface-variant font-semibold">Total Shifts</p></div>
        <div className="bg-emerald-500/10 rounded-xl p-3 text-center"><p className="text-[20px] font-bold text-emerald-600">0</p><p className="text-[9px] text-on-surface-variant font-semibold">Conflicts</p></div>
      </div>
    </div>
  );
}
