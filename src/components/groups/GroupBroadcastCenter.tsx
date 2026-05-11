"use client";

import React from "react";

const PRIORITY_STYLES = {
  info: { bg: "bg-primary/10", border: "border-primary/20", icon: "info", iconColor: "text-primary", badge: "bg-primary/10 text-primary" },
  important: { bg: "bg-amber-500/10", border: "border-amber-500/20", icon: "warning", iconColor: "text-amber-600", badge: "bg-amber-500/10 text-amber-600" },
  critical: { bg: "bg-error/10", border: "border-error/20", icon: "error", iconColor: "text-error", badge: "bg-error/10 text-error" },
};

const MOCK_BROADCASTS = [
  { id: "1", title: "Holiday Schedule Update", message: "The center will be closed May 15-16 for maintenance.", priority: "important" as const, author: "Admin Team", pinned: true, createdAt: "30 min ago", readCount: 34, totalMembers: 48 },
  { id: "2", title: "Welcome New Members!", message: "12 new members joined this week. Say hello in the Feed!", priority: "info" as const, author: "Sarah Kim", pinned: false, createdAt: "2 hours ago", readCount: 28, totalMembers: 48 },
  { id: "3", title: "⚠️ Emergency: Water Leak in Studio B", message: "Studio B closed. Classes moved to Studio A.", priority: "critical" as const, author: "Facility Manager", pinned: true, createdAt: "5 hours ago", readCount: 45, totalMembers: 48 },
  { id: "4", title: "Monthly Report Available", message: "April report: 156 events, 89% participation, 23 new members.", priority: "info" as const, author: "Admin Team", pinned: false, createdAt: "1 day ago", readCount: 19, totalMembers: 48 },
];

export default function GroupBroadcastCenter() {
  return (
    <div className="px-4 py-6 space-y-5 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[20px] font-bold text-on-surface">Broadcast Center</h2>
          <p className="text-[13px] text-on-surface-variant mt-0.5">Important announcements and alerts</p>
        </div>
        <button className="flex items-center gap-1.5 px-4 py-2 bg-primary text-on-primary rounded-full text-[13px] font-semibold shadow-md">
          <span className="material-symbols-outlined text-[18px]">podcasts</span>
          New Broadcast
        </button>
      </div>
      <div className="space-y-3">
        {MOCK_BROADCASTS.map((b) => {
          const s = PRIORITY_STYLES[b.priority];
          return (
            <div key={b.id} className={`rounded-2xl p-5 border-2 ${s.bg} ${s.border}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className={`material-symbols-outlined text-[20px] ${s.iconColor}`} style={{ fontVariationSettings: "'FILL' 1" }}>{s.icon}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${s.badge}`}>{b.priority}</span>
                  {b.pinned && <span className="flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-on-surface/5 text-on-surface-variant text-[10px] font-bold"><span className="material-symbols-outlined text-[10px]" style={{ fontVariationSettings: "'FILL' 1" }}>push_pin</span>PINNED</span>}
                </div>
                <span className="text-[11px] text-on-surface-variant/60">{b.createdAt}</span>
              </div>
              <h3 className="text-[16px] font-bold text-on-surface mb-2">{b.title}</h3>
              <p className="text-[14px] text-on-surface-variant/80 leading-relaxed mb-4">{b.message}</p>
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-on-surface-variant/60">{b.author}</span>
                <div className="flex items-center gap-1.5 text-[12px] text-on-surface-variant/60">
                  <span>{b.readCount}/{b.totalMembers} read</span>
                  <div className="w-16 h-1.5 rounded-full bg-outline/10 overflow-hidden">
                    <div className="h-full rounded-full bg-primary/60" style={{ width: `${(b.readCount / b.totalMembers) * 100}%` }} />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
