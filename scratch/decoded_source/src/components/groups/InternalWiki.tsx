"use client";
import React, { useState } from "react";

const WIKI_PAGES = [
  { id: "1", title: "Getting Started", icon: "rocket_launch", children: [
    { id: "1a", title: "Welcome Guide" }, { id: "1b", title: "Member Roles" }, { id: "1c", title: "Code of Conduct" }
  ]},
  { id: "2", title: "Operations", icon: "settings", children: [
    { id: "2a", title: "Event Planning SOP" }, { id: "2b", title: "Budget Guidelines" }
  ]},
  { id: "3", title: "Design System", icon: "palette", children: [
    { id: "3a", title: "Brand Guidelines" }, { id: "3b", title: "Color Palette" }
  ]},
  { id: "4", title: "Meeting Notes", icon: "edit_note", children: [
    { id: "4a", title: "2026-05 Board Meeting" }, { id: "4b", title: "2026-04 Strategy Review" }
  ]},
];

const SAMPLE_CONTENT = {
  title: "Welcome Guide",
  updated: "May 8, 2026",
  author: "Emily Chen",
  content: `Welcome to our community! This guide will help you get started.\n\n## Quick Start\n1. Complete your profile setup\n2. Join the #introductions channel\n3. Attend the next group event\n4. Connect with team leads\n\n## Key Contacts\n- **Community Lead**: Emily Chen\n- **Event Coordinator**: Jason Park\n- **Technical Lead**: Daniel Kim\n\n## Important Links\n- Member Directory\n- Event Calendar\n- Resource Library`,
};

export default function InternalWiki() {
  const [selectedPage, setSelectedPage] = useState("1a");
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["1"]));
  const toggle = (id: string) => setExpandedSections(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  return (
    <div className="px-4 py-6 space-y-4 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div><h2 className="text-[20px] font-bold text-on-surface">Internal Wiki</h2><p className="text-[13px] text-on-surface-variant mt-0.5">Knowledge base & documentation</p></div>
        <button className="flex items-center gap-1.5 px-4 py-2 bg-primary text-on-primary rounded-full text-[13px] font-semibold shadow-md"><span className="material-symbols-outlined text-[18px]">add</span>New Page</button>
      </div>
      {/* Search */}
      <div className="relative"><span className="material-symbols-outlined text-[18px] absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/40">search</span><input className="w-full bg-surface-container border border-outline/10 rounded-xl pl-10 pr-4 py-2.5 text-[13px]" placeholder="Search wiki..." /></div>
      {/* Sidebar + Content */}
      <div className="flex gap-4">
        {/* Sidebar */}
        <div className="w-[180px] shrink-0 space-y-1">
          {WIKI_PAGES.map(section => (
            <div key={section.id}>
              <button onClick={() => toggle(section.id)} className="flex items-center gap-2 w-full px-2 py-1.5 rounded-lg hover:bg-surface-container text-left">
                <span className="material-symbols-outlined text-[16px] text-on-surface-variant">{section.icon}</span>
                <span className="text-[12px] font-semibold text-on-surface flex-1">{section.title}</span>
                <span className="material-symbols-outlined text-[14px] text-on-surface-variant">{expandedSections.has(section.id) ? "expand_more" : "chevron_right"}</span>
              </button>
              {expandedSections.has(section.id) && section.children.map(child => (
                <button key={child.id} onClick={() => setSelectedPage(child.id)} className={`w-full text-left pl-8 py-1 rounded-lg text-[11px] ${selectedPage === child.id ? "bg-primary/10 text-primary font-bold" : "text-on-surface-variant hover:bg-surface-container"}`}>{child.title}</button>
              ))}
            </div>
          ))}
        </div>
        {/* Content */}
        <div className="flex-1 bg-surface-container rounded-2xl p-5 border border-outline/5 min-h-[300px]">
          <div className="flex items-center gap-2 text-[10px] text-on-surface-variant mb-1"><span>Getting Started</span><span>›</span><span className="text-primary font-semibold">{SAMPLE_CONTENT.title}</span></div>
          <h3 className="text-[18px] font-bold text-on-surface mb-1">{SAMPLE_CONTENT.title}</h3>
          <p className="text-[11px] text-on-surface-variant mb-4">Updated {SAMPLE_CONTENT.updated} by {SAMPLE_CONTENT.author}</p>
          <div className="text-[13px] text-on-surface leading-relaxed whitespace-pre-line">{SAMPLE_CONTENT.content}</div>
        </div>
      </div>
    </div>
  );
}
