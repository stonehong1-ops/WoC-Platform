"use client";

import React from "react";

const MOCK_WAITLIST = [
  { id: "1", event: "Hip Hop Choreography Intensive", position: 1, joined: "May 10", estimated: "Very likely", status: "next" as const, expiresIn: "24h" },
  { id: "2", event: "Summer Dance Festival — VIP", position: 3, joined: "May 8", estimated: "Moderate", status: "waiting" as const, expiresIn: null },
  { id: "3", event: "Kids Dance Camp", position: 7, joined: "May 9", estimated: "Unlikely", status: "waiting" as const, expiresIn: null },
];

const MOCK_PROMOTED = [
  { id: "p1", event: "Contemporary Workshop", promoted: "May 5", action: "Accepted" as const },
  { id: "p2", event: "Ballet Masterclass", promoted: "Apr 28", action: "Expired" as const },
];

export default function WaitlistSystem() {
  return (
    <div className="px-4 py-6 space-y-5 max-w-2xl mx-auto">
      <div>
        <h2 className="text-[20px] font-bold text-on-surface">Waitlist System</h2>
        <p className="text-[13px] text-on-surface-variant mt-0.5">Queue management & auto-promotion</p>
      </div>

      {/* Active Waitlists */}
      <h3 className="text-[12px] font-semibold text-on-surface-variant uppercase tracking-wider">Active Waitlists</h3>
      <div className="space-y-3">
        {MOCK_WAITLIST.map(w => (
          <div key={w.id} className={`bg-surface-container rounded-2xl p-5 border ${w.status === "next" ? "border-primary/30" : "border-outline/5"}`}>
            {w.status === "next" && (
              <div className="flex items-center gap-1.5 mb-2">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span className="text-[11px] font-bold text-primary">You&apos;re Next!</span>
              </div>
            )}
            <h3 className="text-[15px] font-bold text-on-surface">{w.event}</h3>
            <div className="flex items-center gap-4 mt-2 text-[11px] text-on-surface-variant/60">
              <span>Joined: {w.joined}</span>
            </div>

            <div className="flex items-center justify-between mt-3 bg-surface rounded-xl p-3 border border-outline/5">
              <div className="text-center flex-1">
                <p className="text-[22px] font-bold text-primary">#{w.position}</p>
                <p className="text-[9px] text-on-surface-variant font-semibold">Position</p>
              </div>
              <div className="w-px h-8 bg-outline/10" />
              <div className="text-center flex-1">
                <p className={`text-[14px] font-bold ${w.estimated === "Very likely" ? "text-primary" : w.estimated === "Moderate" ? "text-amber-600" : "text-on-surface-variant"}`}>{w.estimated}</p>
                <p className="text-[9px] text-on-surface-variant font-semibold">Chance</p>
              </div>
              {w.expiresIn && (
                <>
                  <div className="w-px h-8 bg-outline/10" />
                  <div className="text-center flex-1">
                    <p className="text-[14px] font-bold text-error">{w.expiresIn}</p>
                    <p className="text-[9px] text-on-surface-variant font-semibold">Expires</p>
                  </div>
                </>
              )}
            </div>

            {w.status === "next" && (
              <div className="flex gap-2 mt-3">
                <button className="flex-1 py-2.5 rounded-xl bg-primary text-on-primary font-semibold text-[13px]">Accept Spot</button>
                <button className="flex-1 py-2.5 rounded-xl bg-surface border border-outline/15 text-on-surface-variant font-semibold text-[13px]">Decline</button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Past Promotions */}
      <h3 className="text-[12px] font-semibold text-on-surface-variant uppercase tracking-wider pt-2">Past Promotions</h3>
      <div className="space-y-2">
        {MOCK_PROMOTED.map(p => (
          <div key={p.id} className="flex items-center gap-3 bg-surface-container rounded-xl p-3 border border-outline/5">
            <span className={`material-symbols-outlined text-[20px] ${p.action === "Accepted" ? "text-primary" : "text-on-surface-variant/40"}`} style={{ fontVariationSettings: "'FILL' 1" }}>{p.action === "Accepted" ? "check_circle" : "timer_off"}</span>
            <div className="flex-1">
              <p className="text-[14px] font-semibold text-on-surface">{p.event}</p>
              <p className="text-[11px] text-on-surface-variant">Promoted: {p.promoted}</p>
            </div>
            <span className={`text-[11px] font-bold ${p.action === "Accepted" ? "text-primary" : "text-on-surface-variant/40"}`}>{p.action}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
