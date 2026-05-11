"use client";

import React, { useState } from "react";

const MOCK_BILLING = [
  { id: "1", student: "Emily Chen", amount: 150, currency: "USD", status: "paid" as const, dueDate: "May 1", paidDate: "Apr 28" },
  { id: "2", student: "Jason Park", amount: 150, currency: "USD", status: "paid" as const, dueDate: "May 1", paidDate: "May 1" },
  { id: "3", student: "Sofia Martinez", amount: 150, currency: "USD", status: "overdue" as const, dueDate: "May 1", paidDate: null },
  { id: "4", student: "Daniel Kim", amount: 200, currency: "USD", status: "pending" as const, dueDate: "May 15", paidDate: null },
  { id: "5", student: "Mia Johnson", amount: 150, currency: "USD", status: "paid" as const, dueDate: "May 1", paidDate: "Apr 30" },
  { id: "6", student: "Alex Lee", amount: 200, currency: "USD", status: "pending" as const, dueDate: "May 15", paidDate: null },
];

const STATUS_MAP: Record<string, { bg: string; text: string; label: string }> = {
  paid: { bg: "bg-primary/10", text: "text-primary", label: "Paid" },
  pending: { bg: "bg-amber-500/10", text: "text-amber-600", label: "Pending" },
  overdue: { bg: "bg-error/10", text: "text-error", label: "Overdue" },
};

export default function TuitionManager() {
  const [filter, setFilter] = useState("all");
  const filtered = filter === "all" ? MOCK_BILLING : MOCK_BILLING.filter(b => b.status === filter);
  const totalRevenue = MOCK_BILLING.filter(b => b.status === "paid").reduce((s, b) => s + b.amount, 0);
  const outstanding = MOCK_BILLING.filter(b => b.status !== "paid").reduce((s, b) => s + b.amount, 0);

  return (
    <div className="px-4 py-6 space-y-5 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[20px] font-bold text-on-surface">Tuition Manager</h2>
          <p className="text-[13px] text-on-surface-variant mt-0.5">Billing, invoices & payment tracking</p>
        </div>
        <button className="flex items-center gap-1.5 px-4 py-2 bg-primary text-on-primary rounded-full text-[13px] font-semibold shadow-md">
          <span className="material-symbols-outlined text-[18px]">receipt_long</span>
          Invoice
        </button>
      </div>

      {/* Revenue Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-primary/10 rounded-xl p-4">
          <p className="text-[11px] text-on-surface-variant font-semibold mb-1">Collected</p>
          <p className="text-[24px] font-bold text-primary">${totalRevenue}</p>
        </div>
        <div className="bg-error/10 rounded-xl p-4">
          <p className="text-[11px] text-on-surface-variant font-semibold mb-1">Outstanding</p>
          <p className="text-[24px] font-bold text-error">${outstanding}</p>
        </div>
      </div>

      <div className="flex gap-2">
        {["all", "paid", "pending", "overdue"].map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`px-3.5 py-1.5 rounded-full text-[12px] font-semibold capitalize transition-all ${filter === f ? "bg-primary text-on-primary" : "bg-surface-container text-on-surface-variant"}`}>{f}</button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.map(b => {
          const s = STATUS_MAP[b.status];
          return (
            <div key={b.id} className="flex items-center gap-3 bg-surface-container rounded-xl p-4 border border-outline/5">
              <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center text-[12px] font-bold text-primary">{b.student.split(" ").map(n=>n[0]).join("")}</div>
              <div className="flex-1">
                <p className="text-[14px] font-semibold text-on-surface">{b.student}</p>
                <p className="text-[11px] text-on-surface-variant">Due: {b.dueDate}{b.paidDate ? ` · Paid: ${b.paidDate}` : ""}</p>
              </div>
              <div className="text-right">
                <p className="text-[16px] font-bold text-on-surface">${b.amount}</p>
                <span className={`text-[10px] font-bold ${s.text}`}>{s.label}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
