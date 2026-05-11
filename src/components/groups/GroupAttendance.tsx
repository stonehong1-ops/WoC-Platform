"use client";

import React, { useState } from "react";

const MOCK_HISTORY = [
  { date: "May 10, 2026", event: "Saturday Workshop", checkedIn: true, time: "14:02" },
  { date: "May 8, 2026", event: "Weekly Meetup", checkedIn: true, time: "18:15" },
  { date: "May 3, 2026", event: "Saturday Workshop", checkedIn: false, time: "-" },
  { date: "May 1, 2026", event: "Weekly Meetup", checkedIn: true, time: "18:30" },
  { date: "Apr 26, 2026", event: "Saturday Workshop", checkedIn: true, time: "14:00" },
];

const MOCK_MEMBERS = [
  { name: "Min-Ji Lee", attendance: 95, streak: 12, total: 20 },
  { name: "James Choi", attendance: 88, streak: 5, total: 18 },
  { name: "Yuna Park", attendance: 75, streak: 3, total: 15 },
  { name: "David Kim", attendance: 60, streak: 0, total: 12 },
];

export default function GroupAttendance() {
  const [tab, setTab] = useState<"checkin" | "history" | "stats">("checkin");

  return (
    <div className="px-4 py-6 space-y-5 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[20px] font-bold text-on-surface">Attendance</h2>
          <p className="text-[13px] text-on-surface-variant mt-0.5">Track participation and check-ins</p>
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-2">
        {(["checkin", "history", "stats"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-1.5 rounded-full text-[12px] font-semibold capitalize transition-all ${tab === t ? "bg-primary text-on-primary" : "bg-surface-container text-on-surface-variant"}`}>
            {t === "checkin" ? "Check-In" : t === "history" ? "History" : "Stats"}
          </button>
        ))}
      </div>

      {tab === "checkin" && (
        <div className="space-y-6">
          {/* QR Check-In */}
          <div className="bg-surface-container rounded-2xl p-6 border border-outline/5 text-center">
            <div className="w-48 h-48 mx-auto bg-surface-container-high rounded-2xl flex items-center justify-center mb-4 border-2 border-dashed border-outline/20">
              <div className="text-center">
                <span className="material-symbols-outlined text-[48px] text-primary/40">qr_code_2</span>
                <p className="text-[12px] text-on-surface-variant/50 mt-2">Scan to Check In</p>
              </div>
            </div>
            <h3 className="text-[16px] font-bold text-on-surface mb-1">Saturday Workshop</h3>
            <p className="text-[13px] text-on-surface-variant mb-4">May 10, 2026 · 2:00 PM</p>
            <button className="w-full py-3 bg-primary text-on-primary rounded-xl font-semibold text-[14px] shadow-md flex items-center justify-center gap-2">
              <span className="material-symbols-outlined text-[20px]">check_circle</span>
              Check In Now
            </button>
            <button className="w-full py-2.5 mt-2 bg-surface-container-high text-on-surface-variant rounded-xl font-semibold text-[13px] flex items-center justify-center gap-2">
              <span className="material-symbols-outlined text-[18px]">qr_code_scanner</span>
              Scan QR Code
            </button>
          </div>

          {/* Today's Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-primary/10 rounded-xl p-3 text-center">
              <p className="text-[22px] font-bold text-primary">24</p>
              <p className="text-[10px] text-on-surface-variant">Checked In</p>
            </div>
            <div className="bg-tertiary-container/20 rounded-xl p-3 text-center">
              <p className="text-[22px] font-bold text-on-surface">48</p>
              <p className="text-[10px] text-on-surface-variant">Expected</p>
            </div>
            <div className="bg-surface-container rounded-xl p-3 text-center">
              <p className="text-[22px] font-bold text-primary">50%</p>
              <p className="text-[10px] text-on-surface-variant">Rate</p>
            </div>
          </div>
        </div>
      )}

      {tab === "history" && (
        <div className="space-y-2">
          {MOCK_HISTORY.map((h, i) => (
            <div key={i} className="flex items-center justify-between bg-surface-container rounded-xl p-4 border border-outline/5">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${h.checkedIn ? "bg-primary/10" : "bg-error/10"}`}>
                  <span className={`material-symbols-outlined text-[20px] ${h.checkedIn ? "text-primary" : "text-error"}`} style={{ fontVariationSettings: "'FILL' 1" }}>{h.checkedIn ? "check_circle" : "cancel"}</span>
                </div>
                <div>
                  <p className="text-[14px] font-semibold text-on-surface">{h.event}</p>
                  <p className="text-[12px] text-on-surface-variant">{h.date}</p>
                </div>
              </div>
              <span className={`text-[13px] font-semibold ${h.checkedIn ? "text-primary" : "text-on-surface-variant/40"}`}>{h.checkedIn ? h.time : "Missed"}</span>
            </div>
          ))}
        </div>
      )}

      {tab === "stats" && (
        <div className="space-y-3">
          {MOCK_MEMBERS.map((m, i) => (
            <div key={i} className="bg-surface-container rounded-xl p-4 border border-outline/5">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center text-[12px] font-bold text-primary">{m.name.split(" ").map(n => n[0]).join("")}</div>
                  <div>
                    <p className="text-[14px] font-semibold text-on-surface">{m.name}</p>
                    <p className="text-[11px] text-on-surface-variant">{m.total} sessions · {m.streak > 0 ? `🔥 ${m.streak} streak` : "No streak"}</p>
                  </div>
                </div>
                <span className={`text-[16px] font-bold ${m.attendance >= 80 ? "text-primary" : m.attendance >= 60 ? "text-amber-600" : "text-error"}`}>{m.attendance}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-outline/10 overflow-hidden">
                <div className={`h-full rounded-full transition-all ${m.attendance >= 80 ? "bg-primary" : m.attendance >= 60 ? "bg-amber-500" : "bg-error"}`} style={{ width: `${m.attendance}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
