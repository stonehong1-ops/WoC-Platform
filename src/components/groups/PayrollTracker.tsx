"use client";
import React, { useState } from "react";
const MOCK_PAYROLL = [
  { id: "1", name: "Emily Chen", role: "Lead", type: "salary" as const, amount: 4500, hours: null, status: "paid" as const, period: "May 2026" },
  { id: "2", name: "Jason Park", role: "Instructor", type: "hourly" as const, amount: 1800, hours: 60, status: "paid" as const, period: "May 2026" },
  { id: "3", name: "Sofia Martinez", role: "Instructor", type: "hourly" as const, amount: 1500, hours: 50, status: "pending" as const, period: "May 2026" },
  { id: "4", name: "Daniel Kim", role: "Support", type: "salary" as const, amount: 3200, hours: null, status: "pending" as const, period: "May 2026" },
  { id: "5", name: "Mia Johnson", role: "Part-time", type: "hourly" as const, amount: 720, hours: 24, status: "paid" as const, period: "May 2026" },
];
const STATUS_MAP: Record<string, { bg: string; text: string }> = { paid: { bg: "bg-primary/10", text: "text-primary" }, pending: { bg: "bg-amber-500/10", text: "text-amber-600" } };
export default function PayrollTracker() {
  const [filter, setFilter] = useState("all");
  const filtered = filter === "all" ? MOCK_PAYROLL : MOCK_PAYROLL.filter(p => p.status === filter);
  const totalPayroll = MOCK_PAYROLL.reduce((s, p) => s + p.amount, 0);
  const paidAmount = MOCK_PAYROLL.filter(p => p.status === "paid").reduce((s, p) => s + p.amount, 0);
  return (
    <div className="px-4 py-6 space-y-5 max-w-2xl mx-auto">
      <div><h2 className="text-[20px] font-bold text-on-surface">Payroll Tracker</h2><p className="text-[13px] text-on-surface-variant mt-0.5">Salary records & payment status</p></div>
      <div className="bg-gradient-to-r from-primary to-secondary rounded-2xl p-5 text-on-primary">
        <p className="text-[12px] opacity-80">May 2026 Payroll</p>
        <p className="text-[32px] font-bold">${totalPayroll.toLocaleString()}</p>
        <div className="flex gap-6 mt-2"><div><p className="text-[18px] font-bold">${paidAmount.toLocaleString()}</p><p className="text-[10px] opacity-70">Paid</p></div><div><p className="text-[18px] font-bold">${(totalPayroll - paidAmount).toLocaleString()}</p><p className="text-[10px] opacity-70">Pending</p></div></div>
      </div>
      <div className="flex gap-2">
        {[["all", "All"], ["paid", "Paid"], ["pending", "Pending"]].map(([k, v]) => (
          <button key={k} onClick={() => setFilter(k)} className={`px-3 py-1.5 rounded-full text-[11px] font-semibold ${filter === k ? "bg-primary text-on-primary" : "bg-surface-container text-on-surface-variant"}`}>{v}</button>
        ))}
      </div>
      <div className="space-y-2">{filtered.map(p => { const st = STATUS_MAP[p.status]; return (
        <div key={p.id} className="bg-surface-container rounded-xl p-4 border border-outline/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center text-[12px] font-bold text-primary">{p.name.split(" ").map(n=>n[0]).join("")}</div>
            <div className="flex-1"><div className="flex items-center gap-2"><p className="text-[14px] font-semibold text-on-surface">{p.name}</p><span className="text-[10px] text-on-surface-variant bg-surface px-1.5 py-0.5 rounded">{p.role}</span></div><p className="text-[11px] text-on-surface-variant">{p.type === "hourly" ? `${p.hours}h × $${(p.amount / (p.hours || 1)).toFixed(0)}/h` : "Monthly salary"}</p></div>
            <div className="text-right"><p className="text-[16px] font-bold text-on-surface">${p.amount.toLocaleString()}</p><span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${st.bg} ${st.text}`}>{p.status}</span></div>
          </div>
        </div>
      ); })}</div>
    </div>
  );
}
