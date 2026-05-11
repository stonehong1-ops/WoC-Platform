"use client";

import React, { useState } from "react";

const MOCK_CHECKINS = [
  { id: "1", name: "Emily Chen", ticket: "VIP Experience", time: "2:15 PM", status: "valid" as const },
  { id: "2", name: "Jason Park", ticket: "General Admission", time: "2:22 PM", status: "valid" as const },
  { id: "3", name: "Sofia Martinez", ticket: "General Admission", time: "2:30 PM", status: "duplicate" as const },
  { id: "4", name: "Daniel Kim", ticket: "Early Bird", time: "2:35 PM", status: "valid" as const },
  { id: "5", name: "Mia Johnson", ticket: "Member Only", time: "2:41 PM", status: "valid" as const },
];

const STATUS_MAP: Record<string, { bg: string; text: string; label: string; icon: string }> = {
  valid: { bg: "bg-primary/10", text: "text-primary", label: "Checked In", icon: "check_circle" },
  invalid: { bg: "bg-error/10", text: "text-error", label: "Invalid", icon: "cancel" },
  duplicate: { bg: "bg-amber-500/10", text: "text-amber-600", label: "Duplicate", icon: "warning" },
};

export default function QRCheckIn() {
  const [mode, setMode] = useState<"scan" | "history">("scan");
  const [scanning, setScanning] = useState(false);
  const [lastScan, setLastScan] = useState<{ name: string; status: string } | null>(null);

  return (
    <div className="px-4 py-6 space-y-5 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[20px] font-bold text-on-surface">QR Check-In</h2>
          <p className="text-[13px] text-on-surface-variant mt-0.5">Scan tickets & manage entry</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setMode("scan")} className={`px-3 py-1.5 rounded-full text-[12px] font-semibold ${mode === "scan" ? "bg-primary text-on-primary" : "bg-surface-container text-on-surface-variant"}`}>Scanner</button>
          <button onClick={() => setMode("history")} className={`px-3 py-1.5 rounded-full text-[12px] font-semibold ${mode === "history" ? "bg-primary text-on-primary" : "bg-surface-container text-on-surface-variant"}`}>History</button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-primary/10 rounded-xl p-3 text-center"><p className="text-[22px] font-bold text-primary">{MOCK_CHECKINS.filter(c => c.status === "valid").length}</p><p className="text-[9px] text-on-surface-variant font-semibold">Checked In</p></div>
        <div className="bg-amber-500/10 rounded-xl p-3 text-center"><p className="text-[22px] font-bold text-amber-600">1</p><p className="text-[9px] text-on-surface-variant font-semibold">Duplicate</p></div>
        <div className="bg-surface-container rounded-xl p-3 text-center"><p className="text-[22px] font-bold text-on-surface">200</p><p className="text-[9px] text-on-surface-variant font-semibold">Total Tickets</p></div>
      </div>

      {mode === "scan" && (
        <div className="space-y-4">
          {/* Scanner Area */}
          <div className="bg-surface-container rounded-2xl border border-outline/5 overflow-hidden">
            <div className="aspect-square max-h-[300px] bg-black/90 flex items-center justify-center relative">
              <div className="w-48 h-48 border-2 border-primary/50 rounded-2xl relative">
                <div className="absolute -top-1 -left-1 w-6 h-6 border-t-3 border-l-3 border-primary rounded-tl-lg" />
                <div className="absolute -top-1 -right-1 w-6 h-6 border-t-3 border-r-3 border-primary rounded-tr-lg" />
                <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-3 border-l-3 border-primary rounded-bl-lg" />
                <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-3 border-r-3 border-primary rounded-br-lg" />
                {scanning && <div className="absolute inset-x-0 top-0 h-0.5 bg-primary animate-pulse" />}
              </div>
              <p className="absolute bottom-4 text-white/50 text-[12px]">Point camera at QR code</p>
            </div>
          </div>

          <button
            onClick={() => {
              setScanning(true);
              setTimeout(() => {
                setScanning(false);
                setLastScan({ name: "Emily Chen", status: "valid" });
              }, 1500);
            }}
            className="w-full py-3 rounded-xl bg-primary text-on-primary font-semibold text-[14px] flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-[20px]">qr_code_scanner</span>
            {scanning ? "Scanning..." : "Tap to Scan"}
          </button>

          {lastScan && (
            <div className={`rounded-xl p-4 flex items-center gap-3 ${lastScan.status === "valid" ? "bg-primary/10" : "bg-error/10"}`}>
              <span className={`material-symbols-outlined text-[28px] ${lastScan.status === "valid" ? "text-primary" : "text-error"}`} style={{ fontVariationSettings: "'FILL' 1" }}>{lastScan.status === "valid" ? "check_circle" : "cancel"}</span>
              <div>
                <p className={`text-[14px] font-bold ${lastScan.status === "valid" ? "text-primary" : "text-error"}`}>{lastScan.status === "valid" ? "Valid Ticket" : "Invalid"}</p>
                <p className="text-[12px] text-on-surface-variant">{lastScan.name}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {mode === "history" && (
        <div className="space-y-2">
          {MOCK_CHECKINS.map(c => {
            const s = STATUS_MAP[c.status];
            return (
              <div key={c.id} className="flex items-center gap-3 bg-surface-container rounded-xl p-3 border border-outline/5">
                <span className={`material-symbols-outlined text-[20px] ${s.text}`} style={{ fontVariationSettings: "'FILL' 1" }}>{s.icon}</span>
                <div className="flex-1">
                  <p className="text-[14px] font-semibold text-on-surface">{c.name}</p>
                  <p className="text-[11px] text-on-surface-variant">{c.ticket} · {c.time}</p>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${s.bg} ${s.text}`}>{s.label}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
