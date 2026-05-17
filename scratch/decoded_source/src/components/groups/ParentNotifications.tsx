"use client";

import React, { useState } from "react";

const MOCK_NOTIFICATIONS = [
  { id: "1", title: "Attendance Alert: Sofia Martinez absent", priority: "high" as const, type: "attendance", sent: "May 10, 2:35 PM", delivered: 1, read: 1, total: 1 },
  { id: "2", title: "May Tuition Payment Reminder", priority: "high" as const, type: "payment", sent: "May 8, 9:00 AM", delivered: 6, read: 4, total: 6 },
  { id: "3", title: "Schedule Change: Saturday class moved to 3PM", priority: "medium" as const, type: "schedule", sent: "May 7, 11:00 AM", delivered: 18, read: 15, total: 18 },
  { id: "4", title: "Mid-Term Evaluation Results Available", priority: "medium" as const, type: "announcement", sent: "May 5, 4:00 PM", delivered: 18, read: 12, total: 18 },
  { id: "5", title: "Holiday Notice: No class on May 15", priority: "low" as const, type: "announcement", sent: "May 3, 10:00 AM", delivered: 18, read: 18, total: 18 },
];

const PRIORITY_MAP: Record<string, { bg: string; text: string; icon: string }> = {
  high: { bg: "bg-error/10", text: "text-error", icon: "priority_high" },
  medium: { bg: "bg-amber-500/10", text: "text-amber-600", icon: "remove" },
  low: { bg: "bg-outline/10", text: "text-on-surface-variant", icon: "arrow_downward" },
};

const TYPE_ICON: Record<string, string> = {
  attendance: "person_off",
  payment: "payments",
  schedule: "event",
  announcement: "campaign",
};

export default function ParentNotifications() {
  const [composing, setComposing] = useState(false);

  if (composing) {
    return (
      <div className="px-4 py-6 space-y-5 max-w-2xl mx-auto">
        <button onClick={() => setComposing(false)} className="flex items-center gap-1 text-[13px] text-primary font-semibold">
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>Back
        </button>
        <h2 className="text-[20px] font-bold text-on-surface">New Notification</h2>
        <div className="space-y-4">
          <div><label className="text-[12px] font-semibold text-on-surface-variant block mb-1">Title</label><input className="w-full bg-surface-container border border-outline/15 rounded-xl px-4 py-3 text-[14px]" placeholder="Enter notification title..." /></div>
          <div><label className="text-[12px] font-semibold text-on-surface-variant block mb-1">Message</label><textarea className="w-full bg-surface-container border border-outline/15 rounded-xl px-4 py-3 text-[14px] h-28 resize-none" placeholder="Enter message..." /></div>
          <div><label className="text-[12px] font-semibold text-on-surface-variant block mb-1">Priority</label>
            <div className="flex gap-2">
              {["low", "medium", "high"].map(p => <button key={p} className="px-4 py-2 rounded-full bg-surface-container text-[12px] font-semibold capitalize">{p}</button>)}
            </div>
          </div>
          <button className="w-full bg-primary text-on-primary rounded-xl py-3 font-semibold text-[14px]">Send Notification</button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 space-y-5 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[20px] font-bold text-on-surface">Parent Notifications</h2>
          <p className="text-[13px] text-on-surface-variant mt-0.5">Push alerts & announcement delivery</p>
        </div>
        <button onClick={() => setComposing(true)} className="flex items-center gap-1.5 px-4 py-2 bg-primary text-on-primary rounded-full text-[13px] font-semibold shadow-md">
          <span className="material-symbols-outlined text-[18px]">send</span>
          Compose
        </button>
      </div>

      <div className="space-y-3">
        {MOCK_NOTIFICATIONS.map(n => {
          const p = PRIORITY_MAP[n.priority];
          const readPct = Math.round((n.read / n.total) * 100);
          return (
            <div key={n.id} className="bg-surface-container rounded-2xl p-4 border border-outline/5">
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-xl ${p.bg} flex items-center justify-center shrink-0`}>
                  <span className={`material-symbols-outlined text-[20px] ${p.text}`}>{TYPE_ICON[n.type]}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-[14px] font-semibold text-on-surface">{n.title}</h3>
                  <p className="text-[11px] text-on-surface-variant/60 mt-0.5">{n.sent}</p>
                </div>
                <div className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${p.bg} ${p.text}`}>{n.priority.toUpperCase()}</div>
              </div>
              <div className="flex items-center gap-3 mt-3">
                <div className="flex-1 h-1.5 rounded-full bg-outline/10 overflow-hidden">
                  <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${readPct}%` }} />
                </div>
                <span className="text-[11px] text-on-surface-variant font-semibold">{n.read}/{n.total} read</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
