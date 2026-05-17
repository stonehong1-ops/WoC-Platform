"use client";

import React, { useState } from "react";

const ROLES = ["Organizer", "Check-In Staff", "Security", "Technical", "Support"];

const MOCK_STAFF = [
  { id: "1", name: "David Park", role: "Organizer", shift: "Full Day", status: "active" as const, avatar: "" },
  { id: "2", name: "Sarah Kim", role: "Check-In Staff", shift: "2:00–6:00 PM", status: "active" as const, avatar: "" },
  { id: "3", name: "Ryan Wang", role: "Technical", shift: "1:00–10:00 PM", status: "active" as const, avatar: "" },
  { id: "4", name: "Lisa Chen", role: "Security", shift: "6:00–10:00 PM", status: "standby" as const, avatar: "" },
  { id: "5", name: "Tom Lee", role: "Support", shift: "2:00–8:00 PM", status: "active" as const, avatar: "" },
  { id: "6", name: "Amy Park", role: "Check-In Staff", shift: "6:00–10:00 PM", status: "absent" as const, avatar: "" },
];

const STATUS_MAP: Record<string, { bg: string; text: string; label: string }> = {
  active: { bg: "bg-primary/10", text: "text-primary", label: "On Duty" },
  standby: { bg: "bg-amber-500/10", text: "text-amber-600", label: "Standby" },
  absent: { bg: "bg-error/10", text: "text-error", label: "Absent" },
};

const ROLE_COLORS: Record<string, string> = {
  Organizer: "bg-primary/15 text-primary",
  "Check-In Staff": "bg-emerald-500/10 text-emerald-600",
  Security: "bg-error/10 text-error",
  Technical: "bg-amber-500/10 text-amber-600",
  Support: "bg-secondary-container/30 text-on-secondary-container",
};

export default function EventStaffManager() {
  const [filter, setFilter] = useState("All");
  const filtered = filter === "All" ? MOCK_STAFF : MOCK_STAFF.filter(s => s.role === filter);

  return (
    <div className="px-4 py-6 space-y-5 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[20px] font-bold text-on-surface">Event Staff Manager</h2>
          <p className="text-[13px] text-on-surface-variant mt-0.5">Roles, shifts & attendance tracking</p>
        </div>
        <button className="flex items-center gap-1.5 px-4 py-2 bg-primary text-on-primary rounded-full text-[13px] font-semibold shadow-md">
          <span className="material-symbols-outlined text-[18px]">person_add</span>
          Add Staff
        </button>
      </div>

      {/* Role Stats */}
      <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
        {ROLES.map(r => {
          const count = MOCK_STAFF.filter(s => s.role === r).length;
          return (
            <div key={r} className="bg-surface-container rounded-xl px-3 py-2 text-center shrink-0 min-w-[80px] border border-outline/5">
              <p className="text-[16px] font-bold text-on-surface">{count}</p>
              <p className="text-[9px] text-on-surface-variant font-semibold">{r}</p>
            </div>
          );
        })}
      </div>

      {/* Filter */}
      <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
        <button onClick={() => setFilter("All")} className={`px-3 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap ${filter === "All" ? "bg-primary text-on-primary" : "bg-surface-container text-on-surface-variant"}`}>All</button>
        {ROLES.map(r => (
          <button key={r} onClick={() => setFilter(r)} className={`px-3 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap ${filter === r ? "bg-primary text-on-primary" : "bg-surface-container text-on-surface-variant"}`}>{r}</button>
        ))}
      </div>

      {/* Staff List */}
      <div className="space-y-2">
        {filtered.map(s => {
          const st = STATUS_MAP[s.status];
          const rc = ROLE_COLORS[s.role] || ROLE_COLORS.Support;
          return (
            <div key={s.id} className="flex items-center gap-3 bg-surface-container rounded-xl p-4 border border-outline/5">
              <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center text-[12px] font-bold text-primary">{s.name.split(" ").map(n=>n[0]).join("")}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-[14px] font-semibold text-on-surface">{s.name}</p>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${rc}`}>{s.role}</span>
                </div>
                <p className="text-[11px] text-on-surface-variant mt-0.5"><span className="material-symbols-outlined text-[12px] align-middle mr-0.5">schedule</span>{s.shift}</p>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${st.bg} ${st.text}`}>{st.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
