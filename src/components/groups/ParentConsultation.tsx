"use client";

import React, { useState } from "react";

const MOCK_CONSULTATIONS = [
  { id: "1", parent: "Mrs. Chen", student: "Emily Chen", date: "May 12", time: "3:00 PM", status: "confirmed" as const, notes: "Discuss mid-term results and improvement plan." },
  { id: "2", parent: "Mr. Park", student: "Jason Park", date: "May 14", time: "4:30 PM", status: "pending" as const, notes: "Review attendance and participation concerns." },
  { id: "3", parent: "Mrs. Martinez", student: "Sofia Martinez", date: "May 8", time: "2:00 PM", status: "completed" as const, notes: "Discussed additional tutoring and makeup classes. Parent agrees to weekend sessions." },
  { id: "4", parent: "Mr. Kim", student: "Daniel Kim", date: "May 18", time: "5:00 PM", status: "pending" as const, notes: "" },
];

const STATUS_MAP: Record<string, { bg: string; text: string; label: string }> = {
  confirmed: { bg: "bg-primary/10", text: "text-primary", label: "Confirmed" },
  pending: { bg: "bg-amber-500/10", text: "text-amber-600", label: "Pending" },
  completed: { bg: "bg-outline/10", text: "text-on-surface-variant", label: "Completed" },
};

export default function ParentConsultation() {
  const [selected, setSelected] = useState<string | null>(null);
  const consultation = MOCK_CONSULTATIONS.find(c => c.id === selected);

  if (consultation) {
    const s = STATUS_MAP[consultation.status];
    return (
      <div className="px-4 py-6 space-y-5 max-w-2xl mx-auto">
        <button onClick={() => setSelected(null)} className="flex items-center gap-1 text-[13px] text-primary font-semibold">
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>Back
        </button>
        <div className="bg-surface-container rounded-2xl p-6 border border-outline/5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-[18px] font-bold text-on-surface">Consultation Detail</h2>
            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${s.bg} ${s.text}`}>{s.label}</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><p className="text-[10px] text-on-surface-variant font-semibold">Parent</p><p className="text-[14px] font-semibold text-on-surface">{consultation.parent}</p></div>
            <div><p className="text-[10px] text-on-surface-variant font-semibold">Student</p><p className="text-[14px] font-semibold text-on-surface">{consultation.student}</p></div>
            <div><p className="text-[10px] text-on-surface-variant font-semibold">Date</p><p className="text-[14px] font-semibold text-on-surface">{consultation.date}</p></div>
            <div><p className="text-[10px] text-on-surface-variant font-semibold">Time</p><p className="text-[14px] font-semibold text-on-surface">{consultation.time}</p></div>
          </div>
          {consultation.notes && (
            <div className="bg-primary/5 rounded-xl p-4">
              <p className="text-[10px] text-on-surface-variant font-semibold mb-1">Notes</p>
              <p className="text-[13px] text-on-surface leading-relaxed">{consultation.notes}</p>
            </div>
          )}
          <textarea className="w-full bg-surface border border-outline/15 rounded-xl px-4 py-3 text-[14px] h-24 resize-none" placeholder="Add follow-up notes..." />
          <button className="w-full bg-primary text-on-primary rounded-xl py-3 font-semibold text-[14px]">Save Notes</button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 space-y-5 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[20px] font-bold text-on-surface">Parent Consultation</h2>
          <p className="text-[13px] text-on-surface-variant mt-0.5">Booking, records & follow-up tracking</p>
        </div>
        <button className="flex items-center gap-1.5 px-4 py-2 bg-primary text-on-primary rounded-full text-[13px] font-semibold shadow-md">
          <span className="material-symbols-outlined text-[18px]">calendar_add_on</span>
          Book
        </button>
      </div>

      <div className="space-y-3">
        {MOCK_CONSULTATIONS.map(c => {
          const s = STATUS_MAP[c.status];
          return (
            <div key={c.id} onClick={() => setSelected(c.id)} className="bg-surface-container rounded-2xl p-4 border border-outline/5 cursor-pointer hover:shadow-md transition-all">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[20px] text-primary">forum</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-[14px] font-semibold text-on-surface">{c.parent}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${s.bg} ${s.text}`}>{s.label}</span>
                  </div>
                  <p className="text-[12px] text-on-surface-variant mt-0.5">Re: {c.student} · {c.date} {c.time}</p>
                  {c.notes && <p className="text-[11px] text-on-surface-variant/50 mt-1 truncate">{c.notes}</p>}
                </div>
                <span className="material-symbols-outlined text-[18px] text-on-surface-variant/30">chevron_right</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
