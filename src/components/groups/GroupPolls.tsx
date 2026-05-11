"use client";

import React, { useState } from "react";

const MOCK_POLLS = [
  {
    id: "1",
    question: "What time works best for the weekly meetup?",
    type: "single" as const,
    deadline: "2026-05-18",
    totalVotes: 47,
    isAnonymous: false,
    isClosed: false,
    options: [
      { id: "a", text: "Saturday 2PM", votes: 18, percentage: 38 },
      { id: "b", text: "Saturday 6PM", votes: 22, percentage: 47 },
      { id: "c", text: "Sunday 10AM", votes: 5, percentage: 11 },
      { id: "d", text: "Sunday 3PM", votes: 2, percentage: 4 },
    ],
    author: { name: "Sarah Kim", avatar: "" },
    createdAt: "2 hours ago",
    voters: ["JH", "MK", "YS", "DK", "SH"],
  },
  {
    id: "2",
    question: "Which topics should we cover in the next workshop?",
    type: "multiple" as const,
    deadline: "2026-05-20",
    totalVotes: 31,
    isAnonymous: true,
    isClosed: false,
    options: [
      { id: "a", text: "Leadership Skills", votes: 19, percentage: 61 },
      { id: "b", text: "Financial Planning", votes: 14, percentage: 45 },
      { id: "c", text: "Team Communication", votes: 24, percentage: 77 },
      { id: "d", text: "Project Management", votes: 8, percentage: 26 },
    ],
    author: { name: "Admin", avatar: "" },
    createdAt: "1 day ago",
    voters: [],
  },
  {
    id: "3",
    question: "Should we change the group meeting location?",
    type: "single" as const,
    deadline: "2026-05-10",
    totalVotes: 62,
    isAnonymous: false,
    isClosed: true,
    options: [
      { id: "a", text: "Yes, move to the new venue", votes: 41, percentage: 66 },
      { id: "b", text: "No, keep current location", votes: 21, percentage: 34 },
    ],
    author: { name: "David Park", avatar: "" },
    createdAt: "5 days ago",
    voters: ["JH", "MK", "YS"],
  },
];

export default function GroupPolls() {
  const [selectedVotes, setSelectedVotes] = useState<Record<string, Set<string>>>({});
  const [filter, setFilter] = useState<"active" | "closed" | "all">("all");

  const handleVote = (pollId: string, optionId: string, type: string) => {
    setSelectedVotes((prev) => {
      const current = new Set(prev[pollId] || []);
      if (type === "single") {
        return { ...prev, [pollId]: new Set([optionId]) };
      }
      if (current.has(optionId)) current.delete(optionId);
      else current.add(optionId);
      return { ...prev, [pollId]: current };
    });
  };

  const filtered = MOCK_POLLS.filter((p) => {
    if (filter === "active") return !p.isClosed;
    if (filter === "closed") return p.isClosed;
    return true;
  });

  return (
    <div className="px-4 py-6 space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[20px] font-bold text-on-surface">Polls</h2>
          <p className="text-[13px] text-on-surface-variant mt-0.5">Collect opinions and make decisions together</p>
        </div>
        <button className="flex items-center gap-1.5 px-4 py-2 bg-primary text-on-primary rounded-full text-[13px] font-semibold shadow-md hover:shadow-lg transition-all">
          <span className="material-symbols-outlined text-[18px]">add</span>
          Create Poll
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {(["all", "active", "closed"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-[12px] font-semibold capitalize transition-all ${
              filter === f
                ? "bg-primary text-on-primary shadow-sm"
                : "bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Poll Cards */}
      <div className="space-y-4">
        {filtered.map((poll) => {
          const myVotes = selectedVotes[poll.id] || new Set();
          return (
            <div
              key={poll.id}
              className={`bg-surface-container rounded-2xl p-5 border transition-all ${
                poll.isClosed ? "border-outline/10 opacity-75" : "border-outline/5 shadow-sm"
              }`}
            >
              {/* Poll Header */}
              <div className="flex items-start justify-between mb-1">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary text-[16px]">how_to_vote</span>
                  </div>
                  <div>
                    <p className="text-[12px] text-on-surface-variant">{poll.author.name} · {poll.createdAt}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {poll.isAnonymous && (
                    <span className="px-2 py-0.5 rounded-full bg-tertiary-container/30 text-on-tertiary-container text-[10px] font-bold">ANONYMOUS</span>
                  )}
                  {poll.isClosed ? (
                    <span className="px-2 py-0.5 rounded-full bg-outline/20 text-on-surface-variant text-[10px] font-bold">CLOSED</span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold">{poll.type === "multiple" ? "MULTI" : "SINGLE"}</span>
                  )}
                </div>
              </div>

              {/* Question */}
              <h3 className="text-[16px] font-semibold text-on-surface mb-4 ml-10">{poll.question}</h3>

              {/* Options */}
              <div className="space-y-2.5 mb-4">
                {poll.options.map((opt) => {
                  const isVoted = myVotes.has(opt.id);
                  return (
                    <button
                      key={opt.id}
                      onClick={() => !poll.isClosed && handleVote(poll.id, opt.id, poll.type)}
                      disabled={poll.isClosed}
                      className={`w-full relative overflow-hidden rounded-xl p-3 text-left transition-all ${
                        isVoted
                          ? "bg-primary/10 border-2 border-primary/30"
                          : "bg-surface-container-high/50 border-2 border-transparent hover:border-outline/20"
                      }`}
                    >
                      {/* Animated bar */}
                      <div
                        className={`absolute inset-y-0 left-0 rounded-xl transition-all duration-700 ease-out ${
                          isVoted ? "bg-primary/15" : "bg-outline/5"
                        }`}
                        style={{ width: `${opt.percentage}%` }}
                      />
                      <div className="relative flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                            isVoted ? "border-primary bg-primary" : "border-outline/30"
                          }`}>
                            {isVoted && <span className="material-symbols-outlined text-white text-[14px]">check</span>}
                          </div>
                          <span className={`text-[14px] ${isVoted ? "font-semibold text-primary" : "text-on-surface"}`}>{opt.text}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[13px] font-bold text-on-surface-variant">{opt.percentage}%</span>
                          <span className="text-[11px] text-on-surface-variant/60">{opt.votes}</span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between text-[12px] text-on-surface-variant/70">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">group</span>
                    {poll.totalVotes} votes
                  </span>
                  {!poll.isClosed && (
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">schedule</span>
                      Ends {poll.deadline}
                    </span>
                  )}
                </div>
                {/* Voter avatars */}
                {poll.voters.length > 0 && (
                  <div className="flex -space-x-1.5">
                    {poll.voters.slice(0, 4).map((v, i) => (
                      <div key={i} className="w-6 h-6 rounded-full bg-primary/20 border-2 border-surface-container flex items-center justify-center text-[8px] font-bold text-primary">{v}</div>
                    ))}
                    {poll.voters.length > 4 && (
                      <div className="w-6 h-6 rounded-full bg-outline/10 border-2 border-surface-container flex items-center justify-center text-[8px] font-bold text-on-surface-variant">+{poll.voters.length - 4}</div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
