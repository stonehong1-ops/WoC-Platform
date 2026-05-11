"use client";

import React, { useState } from "react";

const DAYS = [
  {
    date: "Jun 20 (Fri)", activities: [
      { time: "14:00", title: "Arrival & Check-In", icon: "luggage", type: "logistics" },
      { time: "16:00", title: "Welcome Ceremony", icon: "celebration", type: "activity" },
      { time: "18:00", title: "Dinner", icon: "restaurant", type: "meal" },
      { time: "20:00", title: "Campfire Social", icon: "local_fire_department", type: "activity" },
    ]
  },
  {
    date: "Jun 21 (Sat)", activities: [
      { time: "07:00", title: "Morning Yoga", icon: "self_improvement", type: "activity" },
      { time: "08:30", title: "Breakfast", icon: "restaurant", type: "meal" },
      { time: "10:00", title: "Workshop: Group Choreography", icon: "groups", type: "activity" },
      { time: "13:00", title: "Lunch", icon: "restaurant", type: "meal" },
      { time: "14:30", title: "Free Time / Excursion", icon: "hiking", type: "free" },
      { time: "18:00", title: "Showcase Rehearsal", icon: "theater_comedy", type: "activity" },
      { time: "20:00", title: "BBQ Party", icon: "outdoor_grill", type: "meal" },
    ]
  },
  {
    date: "Jun 22 (Sun)", activities: [
      { time: "08:00", title: "Breakfast", icon: "restaurant", type: "meal" },
      { time: "10:00", title: "Final Showcase", icon: "star", type: "activity" },
      { time: "12:00", title: "Closing & Check-Out", icon: "waving_hand", type: "logistics" },
    ]
  },
];

const ROOMS = [
  { room: "Room 201", guests: ["Emily C.", "Sofia M."], capacity: 2 },
  { room: "Room 202", guests: ["Mia J.", "Alex L."], capacity: 2 },
  { room: "Room 301", guests: ["Jason P.", "Daniel K.", "Ryan W."], capacity: 4 },
  { room: "Room 302", guests: ["Sarah K."], capacity: 4 },
];

const TYPE_STYLE: Record<string, { bg: string; text: string }> = {
  activity: { bg: "bg-primary/10", text: "text-primary" },
  meal: { bg: "bg-amber-500/10", text: "text-amber-600" },
  logistics: { bg: "bg-outline/10", text: "text-on-surface-variant" },
  free: { bg: "bg-emerald-500/10", text: "text-emerald-600" },
};

export default function RetreatPlanner() {
  const [tab, setTab] = useState<"schedule" | "rooms" | "participants">("schedule");
  const [activeDay, setActiveDay] = useState(0);

  return (
    <div className="px-4 py-6 space-y-5 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[20px] font-bold text-on-surface">Retreat Planner</h2>
          <p className="text-[13px] text-on-surface-variant mt-0.5">Multi-day program coordination</p>
        </div>
        <button className="flex items-center gap-1.5 px-4 py-2 bg-primary text-on-primary rounded-full text-[13px] font-semibold shadow-md">
          <span className="material-symbols-outlined text-[18px]">edit</span>
          Edit
        </button>
      </div>

      {/* Overview Card */}
      <div className="bg-gradient-to-r from-primary to-secondary rounded-2xl p-5 text-on-primary">
        <h3 className="text-[18px] font-bold">Summer Dance Retreat 2026</h3>
        <p className="text-[12px] opacity-80 mt-1">Jun 20–22 · Mountain Resort · 24 participants</p>
        <div className="flex gap-4 mt-3">
          <div className="text-center"><p className="text-[20px] font-bold">3</p><p className="text-[9px] opacity-70">Days</p></div>
          <div className="text-center"><p className="text-[20px] font-bold">14</p><p className="text-[9px] opacity-70">Activities</p></div>
          <div className="text-center"><p className="text-[20px] font-bold">4</p><p className="text-[9px] opacity-70">Rooms</p></div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {(["schedule", "rooms", "participants"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-3.5 py-1.5 rounded-full text-[12px] font-semibold capitalize transition-all ${tab === t ? "bg-primary text-on-primary" : "bg-surface-container text-on-surface-variant"}`}>{t}</button>
        ))}
      </div>

      {tab === "schedule" && (
        <>
          <div className="flex gap-2">
            {DAYS.map((d, i) => (
              <button key={i} onClick={() => setActiveDay(i)} className={`flex-1 py-2 rounded-xl text-[11px] font-semibold transition-all ${activeDay === i ? "bg-primary text-on-primary" : "bg-surface-container text-on-surface-variant"}`}>Day {i + 1}</button>
            ))}
          </div>
          <p className="text-[13px] font-semibold text-on-surface">{DAYS[activeDay].date}</p>
          <div className="space-y-2">
            {DAYS[activeDay].activities.map((a, i) => {
              const ts = TYPE_STYLE[a.type];
              return (
                <div key={i} className="flex items-center gap-3 bg-surface-container rounded-xl p-3 border border-outline/5">
                  <div className={`w-10 h-10 rounded-xl ${ts.bg} flex items-center justify-center shrink-0`}>
                    <span className={`material-symbols-outlined text-[20px] ${ts.text}`}>{a.icon}</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-[14px] font-semibold text-on-surface">{a.title}</p>
                    <p className="text-[11px] text-on-surface-variant">{a.time}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {tab === "rooms" && (
        <div className="space-y-3">
          {ROOMS.map((r, i) => (
            <div key={i} className="bg-surface-container rounded-2xl p-4 border border-outline/5">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-[15px] font-bold text-on-surface flex items-center gap-2"><span className="material-symbols-outlined text-[18px] text-primary">bed</span>{r.room}</h3>
                <span className="text-[11px] text-on-surface-variant">{r.guests.length}/{r.capacity}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {r.guests.map((g, gi) => (
                  <span key={gi} className="px-2.5 py-1 rounded-full bg-primary/10 text-primary text-[11px] font-semibold">{g}</span>
                ))}
                {Array.from({ length: r.capacity - r.guests.length }).map((_, ei) => (
                  <span key={`e${ei}`} className="px-2.5 py-1 rounded-full bg-outline/10 text-on-surface-variant/40 text-[11px] font-semibold border border-dashed border-outline/20">Empty</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "participants" && (
        <div className="bg-surface-container rounded-2xl p-4 border border-outline/5">
          <p className="text-[14px] font-semibold text-on-surface mb-3">24 Participants</p>
          <div className="grid grid-cols-2 gap-2">
            {["Emily Chen", "Jason Park", "Sofia Martinez", "Daniel Kim", "Mia Johnson", "Alex Lee", "Sarah Kim", "Ryan Wang"].map((n, i) => (
              <div key={i} className="flex items-center gap-2 p-2 rounded-lg hover:bg-surface transition-all">
                <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center text-[10px] font-bold text-primary">{n.split(" ").map(x=>x[0]).join("")}</div>
                <span className="text-[13px] font-medium text-on-surface">{n}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
