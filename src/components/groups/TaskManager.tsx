"use client";
import React, { useState } from "react";

const COLUMNS = ["Backlog", "Todo", "In Progress", "Review", "Done"] as const;
const PRIORITY_MAP: Record<string, { bg: string; text: string }> = {
  High: { bg: "bg-error/10", text: "text-error" },
  Medium: { bg: "bg-amber-500/10", text: "text-amber-600" },
  Low: { bg: "bg-outline/10", text: "text-on-surface-variant" },
};

const MOCK_TASKS: { id: string; title: string; assignee: string; due: string; priority: string; status: typeof COLUMNS[number] }[] = [
  { id: "1", title: "Design new landing page", assignee: "Emily C.", due: "May 15", priority: "High", status: "In Progress" },
  { id: "2", title: "Fix payment gateway bug", assignee: "Jason P.", due: "May 12", priority: "High", status: "Review" },
  { id: "3", title: "Write onboarding docs", assignee: "Sofia M.", due: "May 20", priority: "Medium", status: "Todo" },
  { id: "4", title: "Update member directory", assignee: "Daniel K.", due: "May 18", priority: "Low", status: "Backlog" },
  { id: "5", title: "Setup analytics dashboard", assignee: "Mia J.", due: "May 25", priority: "Medium", status: "Todo" },
  { id: "6", title: "Deploy v2.0 release", assignee: "Emily C.", due: "May 10", priority: "High", status: "Done" },
  { id: "7", title: "Review security policies", assignee: "Jason P.", due: "May 22", priority: "Medium", status: "Backlog" },
];

export default function TaskManager() {
  const [view, setView] = useState<"board" | "list">("board");
  return (
    <div className="px-4 py-6 space-y-5 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div><h2 className="text-[20px] font-bold text-on-surface">Task Manager</h2><p className="text-[13px] text-on-surface-variant mt-0.5">Organize & track team tasks</p></div>
        <div className="flex gap-2">
          <button onClick={() => setView("board")} className={`px-3 py-1.5 rounded-full text-[12px] font-semibold ${view === "board" ? "bg-primary text-on-primary" : "bg-surface-container text-on-surface-variant"}`}>Board</button>
          <button onClick={() => setView("list")} className={`px-3 py-1.5 rounded-full text-[12px] font-semibold ${view === "list" ? "bg-primary text-on-primary" : "bg-surface-container text-on-surface-variant"}`}>List</button>
        </div>
      </div>
      {view === "board" ? (
        <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-2">
          {COLUMNS.map(col => {
            const tasks = MOCK_TASKS.filter(t => t.status === col);
            return (
              <div key={col} className="min-w-[220px] flex-shrink-0">
                <div className="flex items-center gap-2 mb-3"><h3 className="text-[13px] font-bold text-on-surface">{col}</h3><span className="text-[11px] bg-surface-container rounded-full px-2 py-0.5 text-on-surface-variant font-semibold">{tasks.length}</span></div>
                <div className="space-y-2">
                  {tasks.map(t => { const pr = PRIORITY_MAP[t.priority]; return (
                    <div key={t.id} className="bg-surface-container rounded-xl p-3 border border-outline/5 space-y-2">
                      <p className="text-[13px] font-semibold text-on-surface leading-tight">{t.title}</p>
                      <div className="flex items-center gap-2"><span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${pr.bg} ${pr.text}`}>{t.priority}</span><span className="text-[10px] text-on-surface-variant">{t.due}</span></div>
                      <div className="flex items-center gap-1.5"><div className="w-5 h-5 rounded-full bg-primary/15 flex items-center justify-center text-[8px] font-bold text-primary">{t.assignee.split(" ").map(n=>n[0]).join("")}</div><span className="text-[10px] text-on-surface-variant">{t.assignee}</span></div>
                    </div>
                  ); })}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-2">{MOCK_TASKS.map(t => { const pr = PRIORITY_MAP[t.priority]; return (
          <div key={t.id} className="flex items-center gap-3 bg-surface-container rounded-xl p-3 border border-outline/5">
            <div className="w-6 h-6 rounded-full bg-primary/15 flex items-center justify-center text-[8px] font-bold text-primary">{t.assignee.split(" ").map(n=>n[0]).join("")}</div>
            <div className="flex-1 min-w-0"><p className="text-[13px] font-semibold text-on-surface truncate">{t.title}</p><p className="text-[10px] text-on-surface-variant">{t.assignee} · {t.due}</p></div>
            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${pr.bg} ${pr.text}`}>{t.priority}</span>
            <span className="px-2 py-0.5 rounded-full bg-surface text-[10px] font-semibold text-on-surface-variant border border-outline/10">{t.status}</span>
          </div>
        ); })}</div>
      )}
    </div>
  );
}
