"use client";

import React, { useState } from "react";

const CATEGORIES = ["All", "Feedback", "Suggestions", "Concerns", "Support", "Reports"];

const MOCK_POSTS = [
  { id: "1", category: "Feedback", content: "The new workshop format is really great! I love the smaller group sizes and more hands-on approach. Keep it up!", likes: 14, comments: 3, createdAt: "2 hours ago", reported: false },
  { id: "2", category: "Concerns", content: "I've noticed the restroom facilities haven't been cleaned properly recently. Could the management team look into this?", likes: 22, comments: 7, createdAt: "5 hours ago", reported: false },
  { id: "3", category: "Suggestions", content: "Would it be possible to add a beginner-friendly session on weekday evenings? Many new members find it hard to catch up on Saturdays.", likes: 31, comments: 12, createdAt: "1 day ago", reported: false },
  { id: "4", category: "Support", content: "Thank you to whoever helped me find my lost wallet last Tuesday. The honesty and kindness of this community never ceases to amaze me.", likes: 45, comments: 5, createdAt: "2 days ago", reported: false },
  { id: "5", category: "Reports", content: "There was a broken light fixture in Studio A near the mirror wall. Could be a safety hazard.", likes: 8, comments: 2, createdAt: "3 days ago", reported: true },
];

export default function AnonymousBoard() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [showComposer, setShowComposer] = useState(false);
  const [newPost, setNewPost] = useState("");

  const filtered = MOCK_POSTS.filter((p) => selectedCategory === "All" || p.category === selectedCategory);

  return (
    <div className="px-4 py-6 space-y-5 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[20px] font-bold text-on-surface">Anonymous Board</h2>
          <p className="text-[13px] text-on-surface-variant mt-0.5">Share your thoughts freely and safely</p>
        </div>
        <button onClick={() => setShowComposer(!showComposer)} className="flex items-center gap-1.5 px-4 py-2 bg-primary text-on-primary rounded-full text-[13px] font-semibold shadow-md">
          <span className="material-symbols-outlined text-[18px]">edit</span>
          Post
        </button>
      </div>

      {/* Composer */}
      {showComposer && (
        <div className="bg-surface-container rounded-2xl p-5 border border-primary/20">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-full bg-on-surface/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px] text-on-surface-variant">visibility_off</span>
            </div>
            <span className="text-[13px] font-semibold text-on-surface-variant">Posting as Anonymous</span>
          </div>
          <textarea value={newPost} onChange={(e) => setNewPost(e.target.value)} placeholder="What's on your mind? Your identity is hidden from other members." rows={3} className="w-full p-3 bg-surface-container-high rounded-xl text-[14px] text-on-surface placeholder:text-on-surface-variant/40 outline-none resize-none mb-3" />
          <div className="flex items-center justify-between">
            <select className="px-3 py-1.5 bg-surface-container-high rounded-lg text-[12px] text-on-surface-variant outline-none">
              {CATEGORIES.filter(c => c !== "All").map(c => <option key={c}>{c}</option>)}
            </select>
            <button className="px-4 py-2 bg-primary text-on-primary rounded-full text-[13px] font-semibold">Submit</button>
          </div>
        </div>
      )}

      {/* Categories */}
      <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
        {CATEGORIES.map((cat) => (
          <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-3.5 py-1.5 rounded-full text-[12px] font-semibold whitespace-nowrap transition-all ${selectedCategory === cat ? "bg-primary text-on-primary" : "bg-surface-container text-on-surface-variant"}`}>{cat}</button>
        ))}
      </div>

      {/* Posts */}
      <div className="space-y-3">
        {filtered.map((post) => (
          <div key={post.id} className="bg-surface-container rounded-2xl p-5 border border-outline/5">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-on-surface/8 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[16px] text-on-surface-variant/60">person_off</span>
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-on-surface">Anonymous</p>
                  <p className="text-[11px] text-on-surface-variant/50">{post.createdAt}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-surface-container-high text-[10px] font-semibold text-on-surface-variant">{post.category}</span>
              </div>
            </div>

            {/* Content */}
            <p className="text-[14px] text-on-surface/90 leading-relaxed mb-4">{post.content}</p>

            {/* Actions */}
            <div className="flex items-center gap-4 text-[12px] text-on-surface-variant/60">
              <button className="flex items-center gap-1 hover:text-primary transition-colors">
                <span className="material-symbols-outlined text-[16px]">thumb_up</span>
                {post.likes}
              </button>
              <button className="flex items-center gap-1 hover:text-primary transition-colors">
                <span className="material-symbols-outlined text-[16px]">chat_bubble</span>
                {post.comments}
              </button>
              <div className="flex-1" />
              <button className="flex items-center gap-1 hover:text-error transition-colors">
                <span className="material-symbols-outlined text-[16px]">flag</span>
                Report
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
