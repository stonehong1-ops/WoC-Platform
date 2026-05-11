"use client";

import React, { useState } from "react";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const HOURS = ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00"];

const MOCK_CLASSES = [
  { id: "1", title: "Beginner A", instructor: "Sarah Kim", room: "Studio A", day: 5, startHour: 14, duration: 2, color: "bg-primary/20 border-primary/30 text-primary" },
  { id: "2", title: "Intermediate B", instructor: "James Lee", room: "Studio B", day: 5, startHour: 18, duration: 2, color: "bg-tertiary-container/30 border-tertiary/30 text-on-tertiary-container" },
  { id: "3", title: "Advanced C", instructor: "Sarah Kim", room: "Studio A", day: 2, startHour: 19, duration: 2, color: "bg-secondary-container/30 border-secondary/30 text-on-secondary-container" },
  { id: "4", title: "Practice Session", instructor: "David Park", room: "Studio B", day: 3, startHour: 20, duration: 1, color: "bg-amber-100 border-amber-300 text-amber-800" },
  { id: "5", title: "Private Lesson", instructor: "James Lee", room: "Studio A", day: 4, startHour: 16, duration: 1, color: "bg-pink-100 border-pink-300 text-pink-800" },
];

export default function ClassManagerC() {
  const [selectedInstructor, setSelectedInstructor] = useState("All");
  const instructors = ["All", ...Array.from(new Set(MOCK_CLASSES.map(c => c.instructor)))];

  const filtered = selectedInstructor === "All" ? MOCK_CLASSES : MOCK_CLASSES.filter(c => c.instructor === selectedInstructor);

  return (
    <div className="px-4 py-6 space-y-5 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[20px] font-bold text-on-surface">Class Manager C</h2>
          <p className="text-[13px] text-on-surface-variant mt-0.5">Multi-class scheduling & room management</p>
        </div>
        <button className="flex items-center gap-1.5 px-4 py-2 bg-primary text-on-primary rounded-full text-[13px] font-semibold shadow-md">
          <span className="material-symbols-outlined text-[18px]">add</span>
          New Class
        </button>
      </div>

      {/* Instructor Filter */}
      <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
        {instructors.map(i => (
          <button key={i} onClick={() => setSelectedInstructor(i)} className={`px-3.5 py-1.5 rounded-full text-[12px] font-semibold whitespace-nowrap transition-all ${selectedInstructor === i ? "bg-primary text-on-primary" : "bg-surface-container text-on-surface-variant"}`}>{i}</button>
        ))}
      </div>

      {/* Weekly Schedule Grid */}
      <div className="bg-surface-container rounded-2xl p-4 border border-outline/5 overflow-x-auto">
        <div className="min-w-[600px]">
          {/* Day Headers */}
          <div className="grid grid-cols-8 gap-1 mb-2">
            <div className="text-[10px] text-on-surface-variant/50 font-semibold p-1"></div>
            {DAYS.map(d => (
              <div key={d} className="text-[11px] text-on-surface font-bold text-center p-1">{d}</div>
            ))}
          </div>

          {/* Time Rows */}
          {HOURS.map((hour, hi) => (
            <div key={hour} className="grid grid-cols-8 gap-1" style={{ minHeight: "36px" }}>
              <div className="text-[9px] text-on-surface-variant/40 font-semibold p-1 text-right">{hour}</div>
              {DAYS.map((_, di) => {
                const cls = filtered.find(c => c.day === di && c.startHour === hi + 9);
                if (cls) {
                  return (
                    <div key={di} className={`rounded-lg border p-1.5 cursor-pointer hover:shadow-sm transition-all ${cls.color}`} style={{ gridRow: `span ${cls.duration}` }}>
                      <p className="text-[10px] font-bold leading-tight">{cls.title}</p>
                      <p className="text-[8px] opacity-70">{cls.instructor}</p>
                      <p className="text-[8px] opacity-50">{cls.room}</p>
                    </div>
                  );
                }
                // Check if covered by a spanning class
                const covered = filtered.find(c => c.day === di && hi + 9 > c.startHour && hi + 9 < c.startHour + c.duration);
                if (covered) return <div key={di} />;
                return <div key={di} className="border border-outline/5 rounded-lg" />;
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Class List */}
      <div className="space-y-2">
        {filtered.map(c => (
          <div key={c.id} className="flex items-center gap-3 bg-surface-container rounded-xl p-3 border border-outline/5">
            <div className={`w-2 h-10 rounded-full ${c.color.split(" ")[0]}`} />
            <div className="flex-1">
              <p className="text-[14px] font-semibold text-on-surface">{c.title}</p>
              <p className="text-[11px] text-on-surface-variant">{DAYS[c.day]} {HOURS[c.startHour - 9]}–{HOURS[c.startHour - 9 + c.duration] || "22:00"} · {c.room} · {c.instructor}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
