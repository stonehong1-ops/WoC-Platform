"use client";

import React, { useState } from "react";

const TIERS = [
  { id: "basic", name: "Basic", price: 10, color: "bg-outline/10 text-on-surface-variant" },
  { id: "premium", name: "Premium", price: 25, color: "bg-primary/10 text-primary" },
  { id: "staff", name: "Staff", price: 0, color: "bg-emerald-500/10 text-emerald-600" },
  { id: "vip", name: "VIP", price: 50, color: "bg-amber-500/10 text-amber-600" },
];

const MOCK_MEMBERS = [
  { id: "1", name: "Emily Chen", tier: "Premium", nextBilling: "Jun 1", status: "active" as const, method: "Visa •••4242", amount: 25 },
  { id: "2", name: "Jason Park", tier: "Basic", nextBilling: "Jun 1", status: "active" as const, method: "Mastercard •••8888", amount: 10 },
  { id: "3", name: "Sofia Martinez", tier: "VIP", nextBilling: "Jun 1", status: "active" as const, method: "Visa •••1234", amount: 50 },
  { id: "4", name: "Daniel Kim", tier: "Premium", nextBilling: "Jun 1", status: "past-due" as const, method: "Visa •••5678", amount: 25 },
  { id: "5", name: "Mia Johnson", tier: "Staff", nextBilling: "-", status: "active" as const, method: "N/A", amount: 0 },
  { id: "6", name: "Alex Lee", tier: "Basic", nextBilling: "Jun 1", status: "cancelled" as const, method: "PayPal", amount: 10 },
];

const STATUS_MAP: Record<string, { bg: string; text: string; label: string }> = {
  active: { bg: "bg-primary/10", text: "text-primary", label: "Active" },
  "past-due": { bg: "bg-error/10", text: "text-error", label: "Past Due" },
  cancelled: { bg: "bg-outline/10", text: "text-on-surface-variant", label: "Cancelled" },
};

const TIER_COLORS: Record<string, string> = {
  Basic: "bg-outline/10 text-on-surface-variant",
  Premium: "bg-primary/10 text-primary",
  Staff: "bg-emerald-500/10 text-emerald-600",
  VIP: "bg-amber-500/10 text-amber-600",
};

export default function MembershipBilling() {
  const [filter, setFilter] = useState("all");
  const filtered = filter === "all" ? MOCK_MEMBERS : MOCK_MEMBERS.filter(m => m.status === filter);

  const activeCount = MOCK_MEMBERS.filter(m => m.status === "active").length;
  const monthlyRevenue = MOCK_MEMBERS.filter(m => m.status === "active").reduce((s, m) => s + m.amount, 0);
  const pastDueCount = MOCK_MEMBERS.filter(m => m.status === "past-due").length;

  return (
    <div className="px-4 py-6 space-y-5 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[20px] font-bold text-on-surface">Membership Billing</h2>
          <p className="text-[13px] text-on-surface-variant mt-0.5">Recurring payments & subscription management</p>
        </div>
      </div>

      {/* Revenue Card */}
      <div className="bg-gradient-to-r from-primary to-secondary rounded-2xl p-5 text-on-primary">
        <p className="text-[12px] opacity-80">Monthly Recurring Revenue</p>
        <p className="text-[32px] font-bold">${monthlyRevenue}</p>
        <div className="flex gap-6 mt-2">
          <div><p className="text-[18px] font-bold">{activeCount}</p><p className="text-[10px] opacity-70">Active</p></div>
          <div><p className="text-[18px] font-bold text-error/80">{pastDueCount}</p><p className="text-[10px] opacity-70">Past Due</p></div>
        </div>
      </div>

      {/* Tier Overview */}
      <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
        {TIERS.map(t => {
          const count = MOCK_MEMBERS.filter(m => m.tier === t.name && m.status === "active").length;
          return (
            <div key={t.id} className="bg-surface-container rounded-xl px-3 py-2 text-center shrink-0 min-w-[75px] border border-outline/5">
              <p className="text-[16px] font-bold text-on-surface">{count}</p>
              <p className="text-[9px] text-on-surface-variant font-semibold">{t.name}</p>
              <p className="text-[9px] text-on-surface-variant/50">{t.price === 0 ? "Free" : `$${t.price}/mo`}</p>
            </div>
          );
        })}
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {[["all", "All"], ["active", "Active"], ["past-due", "Past Due"], ["cancelled", "Cancelled"]].map(([k, v]) => (
          <button key={k} onClick={() => setFilter(k)} className={`px-3 py-1.5 rounded-full text-[11px] font-semibold ${filter === k ? "bg-primary text-on-primary" : "bg-surface-container text-on-surface-variant"}`}>{v}</button>
        ))}
      </div>

      {/* Member List */}
      <div className="space-y-2">
        {filtered.map(m => {
          const st = STATUS_MAP[m.status];
          const tc = TIER_COLORS[m.tier] || TIER_COLORS.Basic;
          return (
            <div key={m.id} className="bg-surface-container rounded-xl p-4 border border-outline/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center text-[12px] font-bold text-primary shrink-0">{m.name.split(" ").map(n => n[0]).join("")}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-[14px] font-semibold text-on-surface">{m.name}</p>
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${tc}`}>{m.tier}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-on-surface-variant mt-0.5">
                    <span>{m.method}</span>
                    {m.nextBilling !== "-" && <span>Next: {m.nextBilling}</span>}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[16px] font-bold text-on-surface">{m.amount === 0 ? "Free" : `$${m.amount}`}</p>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${st.bg} ${st.text}`}>{st.label}</span>
                </div>
              </div>
              {m.status === "past-due" && (
                <button className="w-full mt-3 py-2 rounded-xl bg-error/10 text-error font-semibold text-[12px]">Retry Payment</button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
