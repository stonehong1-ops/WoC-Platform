'use client';

import React, { useEffect, useRef, useState } from 'react';
import { aiHandoffService } from '@/lib/firebase/aiHandoffService';
import { AIHandoffMessage } from '@/types/aiHandoff';

const AGENT_STYLE: Record<string, string> = {
  GPT: 'bg-emerald-100 text-emerald-800',
  CLAUDE_MAIN: 'bg-orange-100 text-orange-800',
  CLAUDE_SUB: 'bg-sky-100 text-sky-800',
  STONE: 'bg-slate-800 text-white',
};

const STATUS_STYLE: Record<string, string> = {
  READY: 'bg-slate-100 text-slate-600',
  IN_PROGRESS: 'bg-amber-100 text-amber-800',
  DONE: 'bg-emerald-100 text-emerald-800',
  BLOCKED: 'bg-rose-100 text-rose-800',
  BLOCKED_CONFLICT: 'bg-rose-200 text-rose-900',
  FAILED: 'bg-rose-100 text-rose-800',
};

function formatTime(ts: any): string {
  const date = ts?.toDate?.();
  if (!date) return '';
  return date.toLocaleString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function AiHandoffPage() {
  const [messages, setMessages] = useState<AIHandoffMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsub = aiHandoffService.subscribeTimeline((list) => {
      setMessages(list);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' });
  }, [messages.length]);

  return (
    <main className="max-w-[720px] mx-auto min-h-screen bg-slate-50 pb-20">
      <header className="sticky top-0 bg-white border-b border-gray-100 z-10 px-6 py-4">
        <h1 className="text-lg font-black text-gray-900 uppercase tracking-tight">AI Handoff</h1>
        <p className="text-[11px] font-semibold text-gray-400 mt-0.5">GPT ↔ Claude MAIN / SUB 내부 작업 타임라인 (읽기 전용)</p>
      </header>

      <div className="p-6 space-y-3">
        {loading && (
          <div className="text-center py-20 text-xs font-bold text-gray-400">불러오는 중...</div>
        )}

        {!loading && messages.length === 0 && (
          <div className="text-center py-20 bg-white border border-gray-200/50 rounded-3xl">
            <span className="material-symbols-outlined text-5xl text-gray-300 mb-3">forum</span>
            <p className="text-sm font-bold text-gray-400">아직 handoff 메시지가 없습니다.</p>
          </div>
        )}

        {messages.map((m) => (
          <div key={m.id} className="bg-white border border-gray-200/50 rounded-2xl p-4 shadow-sm space-y-2">
            <div className="flex items-center justify-between flex-wrap gap-1.5">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${AGENT_STYLE[m.from] || 'bg-gray-100 text-gray-700'}`}>
                  {m.from}
                </span>
                {m.to && (
                  <>
                    <span className="text-[10px] text-gray-300">→</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${AGENT_STYLE[m.to] || 'bg-gray-100 text-gray-700'}`}>
                      {m.to}
                    </span>
                  </>
                )}
                {m.assignee && !m.to && (
                  <>
                    <span className="text-[10px] text-gray-300">→</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${AGENT_STYLE[m.assignee] || 'bg-gray-100 text-gray-700'}`}>
                      {m.assignee}
                    </span>
                  </>
                )}
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500">
                  {m.type === 'AI_TASK' ? 'TASK' : 'REPORT'}
                </span>
              </div>
              <span className="text-[10px] text-gray-400 font-bold shrink-0">{formatTime(m.createdAt)}</span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-mono text-gray-400">{m.taskId}</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${STATUS_STYLE[m.status] || 'bg-gray-100 text-gray-600'}`}>
                {m.status}
              </span>
            </div>

            {m.title && <p className="text-sm font-black text-gray-900">{m.title}</p>}
            {(m.content || m.summary) && (
              <p className="text-xs font-semibold text-gray-600 whitespace-pre-wrap leading-relaxed">
                {m.content || m.summary}
              </p>
            )}
            {m.changedFiles && m.changedFiles.length > 0 && (
              <p className="text-[10px] font-mono text-gray-400">files: {m.changedFiles.join(', ')}</p>
            )}
            {m.problems && (
              <p className="text-[11px] font-bold text-rose-600">⚠ {m.problems}</p>
            )}
            {m.nextDecisionNeeded && (
              <p className="text-[11px] font-bold text-amber-700">? {m.nextDecisionNeeded}</p>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </main>
  );
}
