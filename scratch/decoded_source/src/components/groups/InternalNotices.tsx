"use client";
import React from "react";
const MOCK_NOTICES = [
  { id: "1", title: "Studio Hours Update — May 2026", body: "Starting May 15, Studio A and B hours will extend to 10 PM on weekdays.", priority: "high" as const, date: "May 8", author: "Admin", readCount: 38, totalMembers: 45, attachments: 1 },
  { id: "2", title: "New Member Orientation", body: "All new members are required to attend the orientation session on May 20.", priority: "normal" as const, date: "May 7", author: "Emily C.", readCount: 45, totalMembers: 45, attachments: 0 },
  { id: "3", title: "Equipment Maintenance — Projector", body: "The main hall projector will be under maintenance from May 12–14.", priority: "normal" as const, date: "May 6", author: "Daniel K.", readCount: 30, totalMembers: 45, attachments: 0 },
  { id: "4", title: "Summer Workshop Registration Open", body: "Registration for the summer workshop series is now open. Limited spots available.", priority: "high" as const, date: "May 5", author: "Sofia M.", readCount: 42, totalMembers: 45, attachments: 2 },
];
export default function InternalNotices() {
  return (
    <div className="px-4 py-6 space-y-5 max-w-2xl mx-auto">
      <div className="flex items-center justify-between"><div><h2 className="text-[20px] font-bold text-on-surface">Internal Notices</h2><p className="text-[13px] text-on-surface-variant mt-0.5">Organization announcements</p></div>
        <button className="flex items-center gap-1.5 px-4 py-2 bg-primary text-on-primary rounded-full text-[13px] font-semibold shadow-md"><span className="material-symbols-outlined text-[18px]">edit</span>New</button></div>
      <div className="space-y-3">{MOCK_NOTICES.map(n => (
        <div key={n.id} className={`bg-surface-container rounded-2xl p-4 border ${n.priority === "high" ? "border-primary/20" : "border-outline/5"}`}>
          <div className="flex items-start gap-3">
            {n.priority === "high" && <span className="material-symbols-outlined text-[20px] text-primary mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>priority_high</span>}
            <div className="flex-1">
              <h3 className="text-[15px] font-bold text-on-surface">{n.title}</h3>
              <p className="text-[12px] text-on-surface-variant mt-1 leading-relaxed">{n.body}</p>
              <div className="flex items-center gap-3 mt-3 text-[10px] text-on-surface-variant">
                <span>{n.author}</span><span>·</span><span>{n.date}</span><span>·</span>
                <span className="text-primary font-semibold">{n.readCount}/{n.totalMembers} read</span>
                {n.attachments > 0 && <><span>·</span><span className="flex items-center gap-0.5"><span className="material-symbols-outlined text-[12px]">attach_file</span>{n.attachments}</span></>}
              </div>
              <div className="w-full h-1.5 rounded-full bg-outline/10 mt-2 overflow-hidden"><div className="h-full rounded-full bg-primary" style={{ width: `${(n.readCount / n.totalMembers) * 100}%` }} /></div>
            </div>
          </div>
        </div>
      ))}</div>
    </div>
  );
}
