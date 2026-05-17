"use client";

import React, { useState, useMemo } from "react";
import { Member } from "@/types/group";

const LEVEL_STYLE: Record<string, { bg: string; text: string }> = {
  Beginner: { bg: "bg-emerald-500/10", text: "text-emerald-600" },
  Intermediate: { bg: "bg-primary/10", text: "text-primary" },
  Advanced: { bg: "bg-error/10", text: "text-error" },
  "All Levels": { bg: "bg-secondary-container/30", text: "text-on-secondary-container" },
};

export default function WorkshopRegistration({ members = [] }: { members?: Member[] }) {
  const [registered, setRegistered] = useState<Set<string>>(new Set());

  // Extract instructors from members, prioritizing roles
  const instructors = useMemo(() => {
    return members.filter(m => ['instructor', 'owner', 'staff'].includes(m.role || ''));
  }, [members]);

  const getInstructorName = (index: number, fallback: string) => {
    return instructors.length > 0 ? instructors[index % instructors.length]?.name : fallback;
  };

  const MOCK_WORKSHOPS = [
    { id: "1", title: "Contemporary Dance Fundamentals", instructor: getInstructorName(0, "Instructor"), level: "Beginner", date: "Jun 8", time: "2:00 PM", duration: "3h", slots: 20, registered: 16, status: "open" as const, description: "Explore foundational movements and body awareness through contemporary dance." },
    { id: "2", title: "Hip Hop Choreography Intensive", instructor: getInstructorName(1, "Instructor"), level: "Intermediate", date: "Jun 15", time: "10:00 AM", duration: "4h", slots: 15, registered: 15, status: "full" as const, description: "Learn a complete routine from a professional choreographer." },
    { id: "3", title: "Freestyle Battle Workshop", instructor: getInstructorName(2, "Instructor"), level: "Advanced", date: "Jun 22", time: "1:00 PM", duration: "2h", slots: 12, registered: 8, status: "open" as const, description: "Develop your freestyle skills and battle techniques." },
    { id: "4", title: "Kids Dance Camp", instructor: getInstructorName(3, "Instructor"), level: "All Levels", date: "Jun 29", time: "9:00 AM", duration: "5h", slots: 25, registered: 20, status: "open" as const, description: "Fun-filled dance camp for children ages 6-12." },
  ];

  return (
    <div className="px-4 py-6 space-y-5 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[20px] font-bold text-on-surface">Workshop Registration</h2>
          <p className="text-[13px] text-on-surface-variant mt-0.5">Enroll in upcoming workshops & programs</p>
        </div>
      </div>

      <div className="space-y-3">
        {MOCK_WORKSHOPS.map(w => {
          const ls = LEVEL_STYLE[w.level] || LEVEL_STYLE["All Levels"];
          const isFull = w.status === "full";
          const isRegistered = registered.has(w.id);
          const slotsLeft = w.slots - w.registered;
          return (
            <div key={w.id} className="bg-surface-container rounded-2xl p-5 border border-outline/5">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-[16px] font-bold text-on-surface">{w.title}</h3>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${ls.bg} ${ls.text}`}>{w.level}</span>
                    <span className="text-[11px] text-on-surface-variant">{w.instructor}</span>
                  </div>
                </div>
                {isFull && !isRegistered && <span className="px-2.5 py-1 rounded-full bg-error/10 text-error text-[10px] font-bold shrink-0">FULL</span>}
                {isRegistered && <span className="px-2.5 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold shrink-0">ENROLLED</span>}
              </div>

              <p className="text-[12px] text-on-surface-variant/70 mb-3 leading-relaxed">{w.description}</p>

              <div className="flex items-center gap-4 text-[11px] text-on-surface-variant/60 mb-3">
                <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">calendar_today</span>{w.date}</span>
                <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">schedule</span>{w.time} · {w.duration}</span>
                <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">group</span>{w.registered}/{w.slots}</span>
              </div>

              <div className="w-full h-1.5 rounded-full bg-outline/10 overflow-hidden mb-3">
                <div className={`h-full rounded-full transition-all ${slotsLeft <= 3 ? "bg-error" : "bg-primary"}`} style={{ width: `${(w.registered / w.slots) * 100}%` }} />
              </div>

              {!isFull && !isRegistered ? (
                <button onClick={() => setRegistered(prev => { const n = new Set(prev); n.add(w.id); return n; })} className="w-full py-2.5 rounded-xl bg-primary text-on-primary font-semibold text-[13px]">
                  Register Now · {slotsLeft} spots left
                </button>
              ) : isFull && !isRegistered ? (
                <button className="w-full py-2.5 rounded-xl bg-surface border border-outline/15 text-on-surface-variant font-semibold text-[13px]">
                  Join Waitlist
                </button>
              ) : (
                <button onClick={() => setRegistered(prev => { const n = new Set(prev); n.delete(w.id); return n; })} className="w-full py-2.5 rounded-xl bg-error/10 text-error font-semibold text-[13px]">
                  Cancel Registration
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
