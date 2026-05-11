"use client";

import React, { useState } from "react";

const MOCK_QUESTIONS = [
  { id: 1, type: "short" as const, question: "What is your name?", required: true },
  { id: 2, type: "choice" as const, question: "How satisfied are you with the community events?", required: true, options: ["Very Satisfied", "Satisfied", "Neutral", "Dissatisfied", "Very Dissatisfied"] },
  { id: 3, type: "rating" as const, question: "Rate the quality of recent workshops", required: true },
  { id: 4, type: "long" as const, question: "Any suggestions for improvement?", required: false },
  { id: 5, type: "image" as const, question: "Which logo design do you prefer?", required: true, options: ["Design A", "Design B", "Design C"] },
];

export default function GroupSurvey() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<number, any>>({});
  const [view, setView] = useState<"list" | "take" | "done">("list");

  const progress = ((step + 1) / MOCK_QUESTIONS.length) * 100;
  const q = MOCK_QUESTIONS[step];

  if (view === "done") {
    return (
      <div className="px-4 py-20 text-center max-w-2xl mx-auto">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <span className="material-symbols-outlined text-[40px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
        </div>
        <h2 className="text-[22px] font-bold text-on-surface mb-2">Thank You!</h2>
        <p className="text-[14px] text-on-surface-variant">Your response has been recorded.</p>
        <button onClick={() => { setView("list"); setStep(0); setAnswers({}); }} className="mt-6 px-6 py-2.5 bg-primary text-on-primary rounded-full text-[14px] font-semibold">Back to Surveys</button>
      </div>
    );
  }

  if (view === "take") {
    return (
      <div className="px-4 py-6 max-w-2xl mx-auto">
        {/* Progress */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[12px] text-on-surface-variant font-semibold">Question {step + 1} of {MOCK_QUESTIONS.length}</span>
            <span className="text-[12px] text-primary font-bold">{Math.round(progress)}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-outline/10">
            <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {/* Question */}
        <div className="bg-surface-container rounded-2xl p-6 border border-outline/5 min-h-[300px] flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            {q.required && <span className="text-error text-[14px]">*</span>}
            <h3 className="text-[18px] font-bold text-on-surface">{q.question}</h3>
          </div>

          <div className="flex-1">
            {q.type === "short" && (
              <input type="text" placeholder="Your answer..." value={answers[q.id] || ""} onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })} className="w-full p-3 bg-surface-container-high rounded-xl text-[14px] text-on-surface outline-none focus:ring-2 focus:ring-primary/30" />
            )}
            {q.type === "long" && (
              <textarea placeholder="Write your answer..." value={answers[q.id] || ""} onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })} rows={4} className="w-full p-3 bg-surface-container-high rounded-xl text-[14px] text-on-surface outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
            )}
            {q.type === "choice" && q.options && (
              <div className="space-y-2">
                {q.options.map((opt, i) => (
                  <button key={i} onClick={() => setAnswers({ ...answers, [q.id]: opt })} className={`w-full p-3 rounded-xl text-left text-[14px] transition-all ${answers[q.id] === opt ? "bg-primary/10 border-2 border-primary/30 font-semibold text-primary" : "bg-surface-container-high border-2 border-transparent text-on-surface"}`}>{opt}</button>
                ))}
              </div>
            )}
            {q.type === "rating" && (
              <div className="flex gap-2 justify-center pt-4">
                {[1, 2, 3, 4, 5].map((r) => (
                  <button key={r} onClick={() => setAnswers({ ...answers, [q.id]: r })} className={`w-14 h-14 rounded-xl text-[24px] transition-all ${(answers[q.id] || 0) >= r ? "bg-amber-400 text-white shadow-md scale-110" : "bg-surface-container-high text-on-surface-variant/40"}`}>★</button>
                ))}
              </div>
            )}
            {q.type === "image" && q.options && (
              <div className="grid grid-cols-3 gap-3">
                {q.options.map((opt, i) => (
                  <button key={i} onClick={() => setAnswers({ ...answers, [q.id]: opt })} className={`aspect-square rounded-xl flex flex-col items-center justify-center transition-all ${answers[q.id] === opt ? "bg-primary/10 border-2 border-primary ring-2 ring-primary/20" : "bg-surface-container-high border-2 border-transparent"}`}>
                    <span className="material-symbols-outlined text-[32px] text-on-surface-variant/40 mb-1">image</span>
                    <span className="text-[11px] font-semibold text-on-surface-variant">{opt}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-outline/10">
            <button onClick={() => step > 0 ? setStep(step - 1) : setView("list")} className="px-4 py-2 text-[13px] font-semibold text-on-surface-variant">
              {step > 0 ? "Previous" : "Cancel"}
            </button>
            <button onClick={() => step < MOCK_QUESTIONS.length - 1 ? setStep(step + 1) : setView("done")} className="px-6 py-2.5 bg-primary text-on-primary rounded-full text-[13px] font-semibold shadow-md">
              {step < MOCK_QUESTIONS.length - 1 ? "Next" : "Submit"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Survey List View
  return (
    <div className="px-4 py-6 space-y-5 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[20px] font-bold text-on-surface">Surveys</h2>
          <p className="text-[13px] text-on-surface-variant mt-0.5">Share your feedback and opinions</p>
        </div>
        <button className="flex items-center gap-1.5 px-4 py-2 bg-primary text-on-primary rounded-full text-[13px] font-semibold shadow-md">
          <span className="material-symbols-outlined text-[18px]">add</span>
          Create Survey
        </button>
      </div>

      <div className="space-y-3">
        {/* Active Survey */}
        <div className="bg-surface-container rounded-2xl p-5 border border-primary/20 cursor-pointer hover:shadow-md transition-all" onClick={() => setView("take")}>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold">ACTIVE</span>
            <span className="text-[11px] text-on-surface-variant/60">Ends May 20</span>
          </div>
          <h3 className="text-[16px] font-bold text-on-surface mb-1">May Satisfaction Survey</h3>
          <p className="text-[13px] text-on-surface-variant/70 mb-3">Help us improve by sharing your experience this month.</p>
          <div className="flex items-center justify-between">
            <span className="text-[12px] text-on-surface-variant/50">{MOCK_QUESTIONS.length} questions · ~3 min</span>
            <div className="flex items-center gap-1.5 text-[12px] text-on-surface-variant/50">
              <span>23/48 responded</span>
              <div className="w-12 h-1.5 rounded-full bg-outline/10"><div className="w-[48%] h-full rounded-full bg-primary/60" /></div>
            </div>
          </div>
        </div>

        {/* Closed Survey */}
        <div className="bg-surface-container rounded-2xl p-5 border border-outline/5 opacity-60">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-0.5 rounded-full bg-outline/20 text-on-surface-variant text-[10px] font-bold">CLOSED</span>
          </div>
          <h3 className="text-[16px] font-bold text-on-surface mb-1">April Event Feedback</h3>
          <p className="text-[13px] text-on-surface-variant/70 mb-3">Thank you for your participation!</p>
          <div className="flex items-center justify-between">
            <span className="text-[12px] text-on-surface-variant/50">8 questions · 41 responses</span>
            <span className="text-[12px] text-primary font-semibold">View Results →</span>
          </div>
        </div>
      </div>
    </div>
  );
}
