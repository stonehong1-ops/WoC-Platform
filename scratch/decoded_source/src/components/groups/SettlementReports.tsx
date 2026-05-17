"use client";

import React, { useState } from "react";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May"];
const REVENUE_DATA = [2840, 3120, 4200, 3850, 4680];

const MOCK_SETTLEMENTS = [
  { id: "1", period: "May 2026", revenue: 4680, refunds: 120, fees: 280, payout: 4280, status: "paid" as const, paidDate: "Jun 5" },
  { id: "2", period: "Apr 2026", revenue: 3850, refunds: 75, fees: 231, payout: 3544, status: "paid" as const, paidDate: "May 5" },
  { id: "3", period: "Mar 2026", revenue: 4200, refunds: 200, fees: 252, payout: 3748, status: "paid" as const, paidDate: "Apr 5" },
  { id: "4", period: "Feb 2026", revenue: 3120, refunds: 0, fees: 187, payout: 2933, status: "paid" as const, paidDate: "Mar 5" },
  { id: "5", period: "Jan 2026", revenue: 2840, refunds: 50, fees: 170, payout: 2620, status: "paid" as const, paidDate: "Feb 5" },
];

const BREAKDOWN = [
  { category: "Shop Sales", amount: 1850, pct: 39 },
  { category: "Ticket Sales", amount: 1200, pct: 26 },
  { category: "Memberships", amount: 980, pct: 21 },
  { category: "Workshops", amount: 450, pct: 10 },
  { category: "Donations", amount: 200, pct: 4 },
];

const CATEGORY_COLORS = ["bg-primary", "bg-secondary", "bg-amber-500", "bg-emerald-500", "bg-error"];

export default function SettlementReports() {
  const [tab, setTab] = useState<"overview" | "settlements" | "breakdown">("overview");

  const maxRevenue = Math.max(...REVENUE_DATA);
  const totalRevenue = MOCK_SETTLEMENTS.reduce((s, r) => s + r.revenue, 0);
  const totalRefunds = MOCK_SETTLEMENTS.reduce((s, r) => s + r.refunds, 0);
  const totalPayout = MOCK_SETTLEMENTS.reduce((s, r) => s + r.payout, 0);

  return (
    <div className="px-4 py-6 space-y-5 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[20px] font-bold text-on-surface">Settlement Reports</h2>
          <p className="text-[13px] text-on-surface-variant mt-0.5">Revenue analytics & payout history</p>
        </div>
        <button className="flex items-center gap-1.5 px-4 py-2 bg-surface-container text-on-surface-variant rounded-full text-[13px] font-semibold border border-outline/10">
          <span className="material-symbols-outlined text-[18px]">download</span>Export
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-primary/10 rounded-xl p-3 text-center"><p className="text-[18px] font-bold text-primary">${(totalRevenue / 1000).toFixed(1)}k</p><p className="text-[9px] text-on-surface-variant font-semibold">Revenue</p></div>
        <div className="bg-error/10 rounded-xl p-3 text-center"><p className="text-[18px] font-bold text-error">${totalRefunds}</p><p className="text-[9px] text-on-surface-variant font-semibold">Refunds</p></div>
        <div className="bg-emerald-500/10 rounded-xl p-3 text-center"><p className="text-[18px] font-bold text-emerald-600">${(totalPayout / 1000).toFixed(1)}k</p><p className="text-[9px] text-on-surface-variant font-semibold">Payouts</p></div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {(["overview", "settlements", "breakdown"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-3.5 py-1.5 rounded-full text-[12px] font-semibold capitalize ${tab === t ? "bg-primary text-on-primary" : "bg-surface-container text-on-surface-variant"}`}>{t}</button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="bg-surface-container rounded-2xl p-5 border border-outline/5">
          <p className="text-[13px] font-semibold text-on-surface mb-4">Revenue Trend (5 Months)</p>
          <div className="flex items-end gap-3 h-[140px]">
            {REVENUE_DATA.map((val, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <p className="text-[9px] font-bold text-on-surface-variant">${(val / 1000).toFixed(1)}k</p>
                <div className="w-full rounded-t-lg bg-primary/20 relative overflow-hidden" style={{ height: `${(val / maxRevenue) * 100}%` }}>
                  <div className="absolute inset-0 bg-primary rounded-t-lg" style={{ opacity: 0.3 + (i / REVENUE_DATA.length) * 0.7 }} />
                </div>
                <p className="text-[10px] text-on-surface-variant">{MONTHS[i]}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "settlements" && (
        <div className="space-y-2">
          {MOCK_SETTLEMENTS.map(s => (
            <div key={s.id} className="bg-surface-container rounded-xl p-4 border border-outline/5">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-[15px] font-bold text-on-surface">{s.period}</h3>
                <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold">{s.status === "paid" ? `Paid ${s.paidDate}` : "Pending"}</span>
              </div>
              <div className="grid grid-cols-4 gap-2 bg-surface rounded-lg p-2">
                <div className="text-center"><p className="text-[14px] font-bold text-on-surface">${s.revenue.toLocaleString()}</p><p className="text-[8px] text-on-surface-variant font-semibold">Revenue</p></div>
                <div className="text-center"><p className="text-[14px] font-bold text-error">-${s.refunds}</p><p className="text-[8px] text-on-surface-variant font-semibold">Refunds</p></div>
                <div className="text-center"><p className="text-[14px] font-bold text-on-surface-variant">-${s.fees}</p><p className="text-[8px] text-on-surface-variant font-semibold">Fees</p></div>
                <div className="text-center"><p className="text-[14px] font-bold text-primary">${s.payout.toLocaleString()}</p><p className="text-[8px] text-on-surface-variant font-semibold">Payout</p></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "breakdown" && (
        <div className="bg-surface-container rounded-2xl p-5 border border-outline/5 space-y-4">
          <p className="text-[13px] font-semibold text-on-surface">Revenue by Category (May 2026)</p>
          {/* Stacked bar */}
          <div className="flex h-4 rounded-full overflow-hidden">
            {BREAKDOWN.map((b, i) => (
              <div key={i} className={`${CATEGORY_COLORS[i]} h-full`} style={{ width: `${b.pct}%` }} />
            ))}
          </div>
          {/* Legend */}
          <div className="space-y-2">
            {BREAKDOWN.map((b, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded ${CATEGORY_COLORS[i]}`} />
                  <span className="text-[13px] text-on-surface">{b.category}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[13px] font-bold text-on-surface">${b.amount.toLocaleString()}</span>
                  <span className="text-[11px] text-on-surface-variant w-8 text-right">{b.pct}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
