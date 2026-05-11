"use client";

import React, { useState } from "react";

const PLANS = [
  {
    id: "free", name: "Free", price: 0, cycle: "Forever", popular: false, current: false,
    features: ["Basic community access", "Public feed view", "Event browsing", "Limited messaging"],
    color: "border-outline/10",
  },
  {
    id: "basic", name: "Basic", price: 9.99, cycle: "/month", popular: false, current: true,
    features: ["All Free features", "Full feed access", "Event registration", "Group chat", "File sharing"],
    color: "border-primary/30",
  },
  {
    id: "premium", name: "Premium", price: 24.99, cycle: "/month", popular: true, current: false,
    features: ["All Basic features", "Priority support", "Early event access", "Exclusive content", "Workshop discounts", "Monthly 1:1 session"],
    color: "border-primary",
  },
  {
    id: "vip", name: "VIP", price: 49.99, cycle: "/month", popular: false, current: false,
    features: ["All Premium features", "VIP lounge access", "Private workshops", "Merchandise discounts", "Annual retreat pass", "Direct instructor chat", "Custom badge"],
    color: "border-amber-500",
  },
];

const MOCK_SUBS = [
  { id: "1", name: "Emily Chen", plan: "Premium", since: "Jan 2026", status: "active" as const, nextBilling: "Jun 1" },
  { id: "2", name: "Jason Park", plan: "Basic", since: "Mar 2026", status: "active" as const, nextBilling: "Jun 1" },
  { id: "3", name: "Sofia Martinez", plan: "VIP", since: "Nov 2025", status: "active" as const, nextBilling: "Jun 1" },
  { id: "4", name: "Daniel Kim", plan: "Premium", since: "Feb 2026", status: "trial" as const, nextBilling: "May 20" },
];

export default function SubscriptionPlans() {
  const [tab, setTab] = useState<"plans" | "subscribers">("plans");

  return (
    <div className="px-4 py-6 space-y-5 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[20px] font-bold text-on-surface">Subscription Plans</h2>
          <p className="text-[13px] text-on-surface-variant mt-0.5">Manage tiers, features & subscribers</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button onClick={() => setTab("plans")} className={`px-4 py-1.5 rounded-full text-[12px] font-semibold ${tab === "plans" ? "bg-primary text-on-primary" : "bg-surface-container text-on-surface-variant"}`}>Plans</button>
        <button onClick={() => setTab("subscribers")} className={`px-4 py-1.5 rounded-full text-[12px] font-semibold ${tab === "subscribers" ? "bg-primary text-on-primary" : "bg-surface-container text-on-surface-variant"}`}>Subscribers</button>
      </div>

      {tab === "plans" && (
        <div className="space-y-3">
          {PLANS.map(p => (
            <div key={p.id} className={`bg-surface-container rounded-2xl p-5 border-2 ${p.color} relative`}>
              {p.popular && (
                <span className="absolute -top-2.5 left-4 px-3 py-0.5 bg-primary text-on-primary text-[10px] font-bold rounded-full">POPULAR</span>
              )}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-[18px] font-bold text-on-surface">{p.name}</h3>
                  <div className="flex items-end gap-1 mt-1">
                    <span className="text-[28px] font-bold text-on-surface">{p.price === 0 ? "Free" : `$${p.price}`}</span>
                    {p.price > 0 && <span className="text-[12px] text-on-surface-variant mb-1">{p.cycle}</span>}
                  </div>
                </div>
                {p.current && <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-[11px] font-bold">Current</span>}
              </div>
              <ul className="space-y-2 mb-4">
                {p.features.map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-[12px] text-on-surface-variant">
                    <span className="material-symbols-outlined text-[14px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                    {f}
                  </li>
                ))}
              </ul>
              {p.current ? (
                <button className="w-full py-2.5 rounded-xl bg-surface border border-outline/15 text-on-surface-variant font-semibold text-[13px]">Manage Plan</button>
              ) : (
                <button className="w-full py-2.5 rounded-xl bg-primary text-on-primary font-semibold text-[13px]">{p.price === 0 ? "Downgrade" : "Upgrade"}</button>
              )}
            </div>
          ))}
        </div>
      )}

      {tab === "subscribers" && (
        <div className="space-y-2">
          {MOCK_SUBS.map(s => (
            <div key={s.id} className="flex items-center gap-3 bg-surface-container rounded-xl p-4 border border-outline/5">
              <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center text-[12px] font-bold text-primary shrink-0">{s.name.split(" ").map(n => n[0]).join("")}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-[14px] font-semibold text-on-surface">{s.name}</p>
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${s.plan === "VIP" ? "bg-amber-500/10 text-amber-600" : s.plan === "Premium" ? "bg-primary/10 text-primary" : "bg-outline/10 text-on-surface-variant"}`}>{s.plan}</span>
                  {s.status === "trial" && <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/10 text-emerald-600">Trial</span>}
                </div>
                <p className="text-[11px] text-on-surface-variant">Since {s.since} · Next: {s.nextBilling}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
