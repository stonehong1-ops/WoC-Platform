"use client";
import React, { useState } from "react";
const CATEGORIES = ["Rent", "Equipment", "Marketing", "Payroll", "Utilities"];
const CAT_COLORS = ["bg-primary", "bg-secondary", "bg-amber-500", "bg-emerald-500", "bg-error"];
const MOCK_EXPENSES = [
  { id: "1", title: "Studio Rent — May", category: "Rent", amount: 2500, date: "May 1", status: "approved" as const, receipt: true },
  { id: "2", title: "New Sound System", category: "Equipment", amount: 1200, date: "May 3", status: "approved" as const, receipt: true },
  { id: "3", title: "Instagram Ad Campaign", category: "Marketing", amount: 350, date: "May 5", status: "pending" as const, receipt: true },
  { id: "4", title: "May Payroll", category: "Payroll", amount: 11720, date: "May 10", status: "approved" as const, receipt: false },
  { id: "5", title: "Electricity Bill", category: "Utilities", amount: 180, date: "May 8", status: "approved" as const, receipt: true },
  { id: "6", title: "Promotional Flyers", category: "Marketing", amount: 75, date: "May 9", status: "pending" as const, receipt: false },
];
const STATUS_MAP: Record<string, { bg: string; text: string }> = { approved: { bg: "bg-primary/10", text: "text-primary" }, pending: { bg: "bg-amber-500/10", text: "text-amber-600" }, rejected: { bg: "bg-error/10", text: "text-error" } };
export default function ExpenseTracker() {
  const [filter, setFilter] = useState("all");
  const filtered = filter === "all" ? MOCK_EXPENSES : MOCK_EXPENSES.filter(e => e.category === filter);
  const total = MOCK_EXPENSES.reduce((s, e) => s + e.amount, 0);
  const catTotals = CATEGORIES.map(c => ({ cat: c, total: MOCK_EXPENSES.filter(e => e.category === c).reduce((s, e) => s + e.amount, 0) }));
  return (
    <div className="px-4 py-6 space-y-5 max-w-2xl mx-auto">
      <div className="flex items-center justify-between"><div><h2 className="text-[20px] font-bold text-on-surface">Expense Tracker</h2><p className="text-[13px] text-on-surface-variant mt-0.5">Operational costs & spending</p></div>
        <button className="flex items-center gap-1.5 px-4 py-2 bg-primary text-on-primary rounded-full text-[13px] font-semibold shadow-md"><span className="material-symbols-outlined text-[18px]">add</span>Log</button>
      </div>
      <div className="bg-surface-container rounded-2xl p-5 border border-outline/5">
        <p className="text-[12px] text-on-surface-variant font-semibold">May 2026 Total</p><p className="text-[28px] font-bold text-on-surface">${total.toLocaleString()}</p>
        <div className="flex h-3 rounded-full overflow-hidden mt-3">{catTotals.map((c, i) => c.total > 0 && <div key={i} className={`${CAT_COLORS[i]} h-full`} style={{ width: `${(c.total / total) * 100}%` }} />)}</div>
        <div className="flex flex-wrap gap-3 mt-3">{catTotals.map((c, i) => <div key={i} className="flex items-center gap-1.5"><div className={`w-2.5 h-2.5 rounded ${CAT_COLORS[i]}`} /><span className="text-[10px] text-on-surface-variant">{c.cat}: ${c.total.toLocaleString()}</span></div>)}</div>
      </div>
      <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
        <button onClick={() => setFilter("all")} className={`px-3 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap ${filter === "all" ? "bg-primary text-on-primary" : "bg-surface-container text-on-surface-variant"}`}>All</button>
        {CATEGORIES.map(c => <button key={c} onClick={() => setFilter(c)} className={`px-3 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap ${filter === c ? "bg-primary text-on-primary" : "bg-surface-container text-on-surface-variant"}`}>{c}</button>)}
      </div>
      <div className="space-y-2">{filtered.map(e => { const st = STATUS_MAP[e.status]; return (
        <div key={e.id} className="flex items-center gap-3 bg-surface-container rounded-xl p-3 border border-outline/5">
          <div className={`w-9 h-9 rounded-lg ${CAT_COLORS[CATEGORIES.indexOf(e.category)]} opacity-20 flex items-center justify-center`}><span className={`material-symbols-outlined text-[18px] ${CAT_COLORS[CATEGORIES.indexOf(e.category)].replace("bg-", "text-").replace("/", " ")}`}>{e.receipt ? "receipt_long" : "description"}</span></div>
          <div className="flex-1 min-w-0"><p className="text-[13px] font-semibold text-on-surface truncate">{e.title}</p><p className="text-[10px] text-on-surface-variant">{e.date} · {e.category}</p></div>
          <div className="text-right shrink-0"><p className="text-[14px] font-bold text-on-surface">${e.amount.toLocaleString()}</p><span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${st.bg} ${st.text}`}>{e.status}</span></div>
        </div>
      ); })}</div>
    </div>
  );
}
