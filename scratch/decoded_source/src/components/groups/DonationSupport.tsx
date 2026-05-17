"use client";

import React, { useState } from "react";

const PRESETS = [10, 25, 50, 100];

const MOCK_SUPPORTERS = [
  { id: "1", name: "Emily C.", amount: 100, date: "May 8", message: "Keep up the amazing work! 🎉", anonymous: false },
  { id: "2", name: "Anonymous", amount: 50, date: "May 7", message: "", anonymous: true },
  { id: "3", name: "Jason P.", amount: 25, date: "May 6", message: "Love this community!", anonymous: false },
  { id: "4", name: "Sofia M.", amount: 10, date: "May 5", message: "Happy to support 💛", anonymous: false },
  { id: "5", name: "Anonymous", amount: 200, date: "May 3", message: "For the new studio equipment", anonymous: true },
];

export default function DonationSupport() {
  const [mode, setMode] = useState<"one-time" | "monthly">("one-time");
  const [amount, setAmount] = useState<number | null>(25);
  const [customAmount, setCustomAmount] = useState("");
  const [message, setMessage] = useState("");
  const [anonymous, setAnonymous] = useState(false);

  const goalAmount = 5000;
  const raisedAmount = 3420;
  const supporterCount = 48;
  const progress = (raisedAmount / goalAmount) * 100;
  const displayAmount = amount || (customAmount ? parseInt(customAmount) : 0);

  return (
    <div className="px-4 py-6 space-y-5 max-w-2xl mx-auto">
      <div>
        <h2 className="text-[20px] font-bold text-on-surface">Donation Support</h2>
        <p className="text-[13px] text-on-surface-variant mt-0.5">Support our community with a contribution</p>
      </div>

      {/* Goal Progress */}
      <div className="bg-gradient-to-r from-primary to-secondary rounded-2xl p-5 text-on-primary">
        <p className="text-[12px] opacity-80">Campaign Goal</p>
        <div className="flex items-end gap-1 mt-1">
          <p className="text-[32px] font-bold">${raisedAmount.toLocaleString()}</p>
          <p className="text-[14px] opacity-60 mb-1">/ ${goalAmount.toLocaleString()}</p>
        </div>
        <div className="w-full h-2 rounded-full bg-on-primary/20 mt-3 overflow-hidden">
          <div className="h-full rounded-full bg-on-primary transition-all" style={{ width: `${progress}%` }} />
        </div>
        <div className="flex justify-between mt-2 text-[11px] opacity-70">
          <span>{supporterCount} supporters</span>
          <span>{Math.round(progress)}% funded</span>
        </div>
      </div>

      {/* Donation Form */}
      <div className="bg-surface-container rounded-2xl p-5 border border-outline/5 space-y-4">
        {/* Mode Toggle */}
        <div className="flex gap-2">
          <button onClick={() => setMode("one-time")} className={`flex-1 py-2 rounded-xl text-[13px] font-semibold ${mode === "one-time" ? "bg-primary text-on-primary" : "bg-surface text-on-surface-variant border border-outline/10"}`}>One-Time</button>
          <button onClick={() => setMode("monthly")} className={`flex-1 py-2 rounded-xl text-[13px] font-semibold ${mode === "monthly" ? "bg-primary text-on-primary" : "bg-surface text-on-surface-variant border border-outline/10"}`}>Monthly</button>
        </div>

        {/* Amount Selector */}
        <div>
          <p className="text-[12px] font-semibold text-on-surface-variant mb-2">Select Amount</p>
          <div className="grid grid-cols-4 gap-2">
            {PRESETS.map(p => (
              <button key={p} onClick={() => { setAmount(p); setCustomAmount(""); }} className={`py-3 rounded-xl text-[14px] font-bold ${amount === p ? "bg-primary text-on-primary" : "bg-surface text-on-surface border border-outline/10"}`}>${p}</button>
            ))}
          </div>
          <div className="relative mt-2">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[14px] font-bold text-on-surface-variant">$</span>
            <input
              value={customAmount}
              onChange={e => { setCustomAmount(e.target.value); setAmount(null); }}
              className="w-full bg-surface border border-outline/10 rounded-xl pl-8 pr-4 py-2.5 text-[14px]"
              placeholder="Custom amount"
              type="number"
            />
          </div>
        </div>

        {/* Message */}
        <div>
          <p className="text-[12px] font-semibold text-on-surface-variant mb-2">Support Message (optional)</p>
          <textarea value={message} onChange={e => setMessage(e.target.value)} className="w-full bg-surface border border-outline/10 rounded-xl px-4 py-2.5 text-[13px] resize-none h-20" placeholder="Leave a message of support..." />
        </div>

        {/* Anonymous Toggle */}
        <label className="flex items-center gap-3 cursor-pointer">
          <div onClick={() => setAnonymous(!anonymous)} className={`w-10 h-6 rounded-full transition-all flex items-center ${anonymous ? "bg-primary justify-end" : "bg-outline/20 justify-start"}`}>
            <div className="w-5 h-5 rounded-full bg-white shadow mx-0.5" />
          </div>
          <span className="text-[13px] text-on-surface">Donate anonymously</span>
        </label>

        {/* Submit */}
        <button className="w-full py-3 rounded-xl bg-primary text-on-primary font-bold text-[14px]">
          {displayAmount > 0 ? `Donate $${displayAmount}${mode === "monthly" ? "/mo" : ""}` : "Select an amount"}
        </button>
      </div>

      {/* Recent Supporters */}
      <h3 className="text-[12px] font-semibold text-on-surface-variant uppercase tracking-wider">Recent Supporters</h3>
      <div className="space-y-2">
        {MOCK_SUPPORTERS.map(s => (
          <div key={s.id} className="flex items-center gap-3 bg-surface-container rounded-xl p-3 border border-outline/5">
            <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center text-[11px] font-bold text-primary shrink-0">{s.anonymous ? "?" : s.name.split(" ").map(n => n[0]).join("")}</div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-on-surface">{s.name}</p>
              {s.message && <p className="text-[11px] text-on-surface-variant/60 truncate">{s.message}</p>}
            </div>
            <div className="text-right shrink-0">
              <p className="text-[14px] font-bold text-primary">${s.amount}</p>
              <p className="text-[10px] text-on-surface-variant">{s.date}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
