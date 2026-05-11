"use client";
import React, { useState } from "react";
const MOCK_REQUESTS = [
  { id: "1", title: "Sound System Purchase", type: "Purchase", requester: "Emily C.", amount: 1200, status: "pending" as const, date: "May 8", steps: [{ name: "Emily C.", done: true }, { name: "Jason P.", done: false }, { name: "Admin", done: false }] },
  { id: "2", title: "Workshop Budget — June", type: "Expense", requester: "Sofia M.", amount: 800, status: "pending" as const, date: "May 7", steps: [{ name: "Sofia M.", done: true }, { name: "Admin", done: false }] },
  { id: "3", title: "New Staff — Daniel K.", type: "Staff", requester: "Jason P.", amount: null, status: "approved" as const, date: "May 5", steps: [{ name: "Jason P.", done: true }, { name: "Admin", done: true }] },
  { id: "4", title: "Event Venue Booking", type: "Expense", requester: "Mia J.", amount: 3500, status: "rejected" as const, date: "May 3", steps: [{ name: "Mia J.", done: true }, { name: "Jason P.", done: true }, { name: "Admin", done: false }] },
];
const STATUS_MAP: Record<string, { bg: string; text: string }> = { pending: { bg: "bg-amber-500/10", text: "text-amber-600" }, approved: { bg: "bg-primary/10", text: "text-primary" }, rejected: { bg: "bg-error/10", text: "text-error" } };
export default function ApprovalWorkflow() {
  const [filter, setFilter] = useState("all");
  const filtered = filter === "all" ? MOCK_REQUESTS : MOCK_REQUESTS.filter(r => r.status === filter);
  const pending = MOCK_REQUESTS.filter(r => r.status === "pending").length;
  return (
    <div className="px-4 py-6 space-y-5 max-w-2xl mx-auto">
      <div><h2 className="text-[20px] font-bold text-on-surface">Approval Workflow</h2><p className="text-[13px] text-on-surface-variant mt-0.5">Review & approve organizational requests</p></div>
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-amber-500/10 rounded-xl p-3 text-center"><p className="text-[20px] font-bold text-amber-600">{pending}</p><p className="text-[9px] text-on-surface-variant font-semibold">Pending</p></div>
        <div className="bg-primary/10 rounded-xl p-3 text-center"><p className="text-[20px] font-bold text-primary">{MOCK_REQUESTS.filter(r => r.status === "approved").length}</p><p className="text-[9px] text-on-surface-variant font-semibold">Approved</p></div>
        <div className="bg-error/10 rounded-xl p-3 text-center"><p className="text-[20px] font-bold text-error">{MOCK_REQUESTS.filter(r => r.status === "rejected").length}</p><p className="text-[9px] text-on-surface-variant font-semibold">Rejected</p></div>
      </div>
      <div className="flex gap-2">{[["all", "All"], ["pending", "Pending"], ["approved", "Approved"], ["rejected", "Rejected"]].map(([k, v]) => <button key={k} onClick={() => setFilter(k)} className={`px-3 py-1.5 rounded-full text-[11px] font-semibold ${filter === k ? "bg-primary text-on-primary" : "bg-surface-container text-on-surface-variant"}`}>{v}</button>)}</div>
      <div className="space-y-2">{filtered.map(r => { const st = STATUS_MAP[r.status]; return (
        <div key={r.id} className="bg-surface-container rounded-xl p-4 border border-outline/5 space-y-3">
          <div className="flex items-center justify-between"><div><p className="text-[14px] font-bold text-on-surface">{r.title}</p><p className="text-[11px] text-on-surface-variant">{r.type} · {r.requester} · {r.date}</p></div><div className="text-right">{r.amount && <p className="text-[14px] font-bold text-on-surface">${r.amount.toLocaleString()}</p>}<span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${st.bg} ${st.text}`}>{r.status}</span></div></div>
          <div className="flex items-center gap-1">{r.steps.map((s, i) => (<React.Fragment key={i}><div className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold ${s.done ? "bg-primary/10 text-primary" : "bg-surface text-on-surface-variant border border-outline/10"}`}><span className="material-symbols-outlined text-[12px]">{s.done ? "check_circle" : "radio_button_unchecked"}</span>{s.name}</div>{i < r.steps.length - 1 && <span className="material-symbols-outlined text-[12px] text-on-surface-variant/30">arrow_forward</span>}</React.Fragment>))}</div>
          {r.status === "pending" && <div className="flex gap-2"><button className="flex-1 py-2 rounded-xl bg-primary text-on-primary text-[12px] font-bold">Approve</button><button className="flex-1 py-2 rounded-xl bg-surface text-error text-[12px] font-bold border border-error/20">Reject</button></div>}
        </div>
      ); })}</div>
    </div>
  );
}
