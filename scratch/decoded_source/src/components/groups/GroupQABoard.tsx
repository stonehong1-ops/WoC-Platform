"use client";

import React, { useState } from "react";

const CATEGORIES = ["All", "General", "Operations", "Technical", "Events", "Marketplace"];

const MOCK_QUESTIONS = [
  { id: "1", title: "How do I change the group meeting schedule?", body: "I need to adjust the weekly meeting from Saturday to Sunday...", category: "Operations", answers: 3, solved: true, helpful: 12, author: "Min-Ji Lee", createdAt: "2 hours ago", lastActivity: "30 min ago", views: 45 },
  { id: "2", title: "Best practices for welcoming new members?", body: "We've been getting a lot of new members and want to make their onboarding smooth...", category: "General", answers: 5, solved: true, helpful: 28, author: "James Choi", createdAt: "1 day ago", lastActivity: "3 hours ago", views: 89 },
  { id: "3", title: "How to set up automatic event reminders?", body: "Is there a way to send automatic reminders before each event?", category: "Technical", answers: 1, solved: false, helpful: 4, author: "Yuna Park", createdAt: "3 days ago", lastActivity: "1 day ago", views: 23 },
  { id: "4", title: "Where can I find the venue booking form?", body: "I heard we have a new venue booking system but can't find the link...", category: "Events", answers: 2, solved: true, helpful: 7, author: "David Kim", createdAt: "5 days ago", lastActivity: "4 days ago", views: 56 },
  { id: "5", title: "Rules for listing items in the marketplace?", body: "Are there specific guidelines for posting items for sale?", category: "Marketplace", answers: 0, solved: false, helpful: 2, author: "Sarah Hong", createdAt: "1 week ago", lastActivity: "6 days ago", views: 34 },
];

export default function GroupQABoard() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = MOCK_QUESTIONS.filter((q) => {
    if (selectedCategory !== "All" && q.category !== selectedCategory) return false;
    if (searchQuery && !q.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="px-4 py-6 space-y-5 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[20px] font-bold text-on-surface">Q&A Board</h2>
          <p className="text-[13px] text-on-surface-variant mt-0.5">Ask questions and share knowledge</p>
        </div>
        <button className="flex items-center gap-1.5 px-4 py-2 bg-primary text-on-primary rounded-full text-[13px] font-semibold shadow-md">
          <span className="material-symbols-outlined text-[18px]">add</span>
          Ask Question
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50 text-[20px]">search</span>
        <input
          type="text"
          placeholder="Search questions..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-surface-container-high rounded-xl text-[14px] text-on-surface placeholder:text-on-surface-variant/40 outline-none focus:ring-2 focus:ring-primary/30 transition-all"
        />
      </div>

      {/* Categories */}
      <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3.5 py-1.5 rounded-full text-[12px] font-semibold whitespace-nowrap transition-all ${
              selectedCategory === cat
                ? "bg-primary text-on-primary shadow-sm"
                : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Question List */}
      <div className="space-y-3">
        {filtered.map((q) => (
          <div key={q.id} className="bg-surface-container rounded-2xl p-4 border border-outline/5 hover:shadow-md transition-all cursor-pointer group">
            <div className="flex gap-3">
              {/* Vote & Answer Count */}
              <div className="flex flex-col items-center gap-1.5 shrink-0 pt-0.5">
                <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center ${
                  q.solved ? "bg-primary/10" : q.answers > 0 ? "bg-tertiary-container/20" : "bg-surface-container-high"
                }`}>
                  <span className={`text-[16px] font-bold ${q.solved ? "text-primary" : "text-on-surface-variant"}`}>{q.answers}</span>
                  <span className="text-[8px] text-on-surface-variant/60 uppercase font-bold">ans</span>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start gap-2 mb-1">
                  <h3 className="text-[15px] font-semibold text-on-surface leading-snug group-hover:text-primary transition-colors flex-1">{q.title}</h3>
                  {q.solved && (
                    <span className="shrink-0 flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold">
                      <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                      SOLVED
                    </span>
                  )}
                </div>
                <p className="text-[13px] text-on-surface-variant/70 line-clamp-1 mb-2">{q.body}</p>
                <div className="flex items-center gap-3 text-[11px] text-on-surface-variant/50">
                  <span className="px-2 py-0.5 rounded bg-surface-container-high text-[10px] font-semibold">{q.category}</span>
                  <span>{q.author}</span>
                  <span>·</span>
                  <span>{q.createdAt}</span>
                  <span className="flex items-center gap-0.5">
                    <span className="material-symbols-outlined text-[12px]">visibility</span>
                    {q.views}
                  </span>
                  <span className="flex items-center gap-0.5">
                    <span className="material-symbols-outlined text-[12px]">thumb_up</span>
                    {q.helpful}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
