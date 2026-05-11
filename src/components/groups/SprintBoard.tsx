"use client";
import React, { useState } from "react";
const COLUMNS = ["Todo", "In Progress", "Review", "Done"] as const;
const MOCK_STORIES = [
  { id: "1", title: "Implement member search", points: 5, assignee: "Emily C.", status: "Done" as const },
  { id: "2", title: "Fix notification badge count", points: 2, assignee: "Jason P.", status: "Review" as const },
  { id: "3", title: "Add event RSVP flow", points: 8, assignee: "Sofia M.", status: "In Progress" as const },
  { id: "4", title: "Design donation page", points: 3, assignee: "Daniel K.", status: "In Progress" as const },
  { id: "5", title: "Setup CI/CD pipeline", points: 5, assignee: "Mia J.", status: "Todo" as const },
  { id: "6", title: "Write API documentation", points: 3, assignee: "Emily C.", status: "Todo" as const },
  { id: "7", title: "Payment gateway integration", points: 13, assignee: "Jason P.", status: "Todo" as const },
];
const SPRINT_INFO = { name: "Sprint #12", start: "May 5", end: "May 18", goal: "Complete commerce module MVP" };
const totalPoints = MOCK_STORIES.reduce((s, st) => s + st.points, 0);
const donePoints = MOCK_STORIES.filter(s => s.status === "Done").reduce((s, st) => s + st.points, 0);
export default function SprintBoard() {
  const [view] = useState<"board">("board");
  return (
    <div className="px-4 py-6 space-y-5 max-w-4xl mx-auto">
      <div><h2 className="text-[20px] font-bold text-on-surface">Sprint Board</h2><p className="text-[13px] text-on-surface-variant mt-0.5">{SPRINT_INFO.name} · {SPRINT_INFO.start} — {SPRINT_INFO.end}</p></div>
      <div className="bg-surface-container rounded-2xl p-4 border border-outline/5">
        <p className="text-[12px] text-on-surface-variant font-semibold">Sprint Goal</p><p className="text-[14px] font-bold text-on-surface mt-0.5">{SPRINT_INFO.goal}</p>
        <div className="flex items-center gap-4 mt-3"><div><p className="text-[20px] font-bold text-primary">{donePoints}/{totalPoints}</p><p className="text-[9px] text-on-surface-variant">Story Points</p></div><div className="flex-1"><div className="w-full h-2.5 rounded-full bg-outline/10 overflow-hidden"><div className="h-full rounded-full bg-primary" style={{ width: `${(donePoints / totalPoints) * 100}%` }} /></div></div><span className="text-[12px] font-bold text-on-surface">{Math.round((donePoints / totalPoints) * 100)}%</span></div>
      </div>
      {view === "board" && <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-2">{COLUMNS.map(col => {
        const stories = MOCK_STORIES.filter(s => s.status === col);
        return (
          <div key={col} className="min-w-[200px] flex-shrink-0">
            <div className="flex items-center gap-2 mb-3"><h3 className="text-[13px] font-bold text-on-surface">{col}</h3><span className="text-[11px] bg-surface-container rounded-full px-2 py-0.5 text-on-surface-variant font-semibold">{stories.reduce((s, st) => s + st.points, 0)}pt</span></div>
            <div className="space-y-2">{stories.map(s => (
              <div key={s.id} className="bg-surface-container rounded-xl p-3 border border-outline/5 space-y-2">
                <p className="text-[12px] font-semibold text-on-surface leading-tight">{s.title}</p>
                <div className="flex items-center justify-between"><div className="flex items-center gap-1.5"><div className="w-5 h-5 rounded-full bg-primary/15 flex items-center justify-center text-[8px] font-bold text-primary">{s.assignee.split(" ").map(n=>n[0]).join("")}</div><span className="text-[10px] text-on-surface-variant">{s.assignee}</span></div><span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary text-[9px] font-bold">{s.points}pt</span></div>
              </div>
            ))}</div>
          </div>
        );
      })}</div>}
    </div>
  );
}
