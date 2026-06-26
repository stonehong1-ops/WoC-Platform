'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/clientApp';
import { useAuth } from '@/components/providers/AuthProvider';
import { useLanguage } from '@/contexts/LanguageContext';
import ThreadCard from './HistoryCard';
import AiLessonThread from './AiLessonThread';

interface Thread {
  threadId: string;
  title: string;
  type: 'analysis' | 'question' | 'mixed';
  status: 'active' | 'reported';
  previewText: string;
  mediaThumbUrl?: string;
  finalReport?: any;
  createdAt: any;
  updatedAt: any;
}

export default function AiLessonHome() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [reportThread, setReportThread] = useState<Thread | null>(null);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);

  // Subscribe to threads
  useEffect(() => {
    if (!user?.uid) return;
    const q = query(
      collection(db, 'users', user.uid, 'aiLessonThreads'),
      orderBy('updatedAt', 'desc')
    );
    const unsub = onSnapshot(q, (snap) => {
      const items = snap.docs.map(d => ({ ...d.data(), threadId: d.id } as Thread));
      setThreads(items);
    });
    return () => unsub();
  }, [user?.uid]);

  const handleNewInquiry = async () => {
    if (!user?.uid) return;
    try {
      const docRef = await addDoc(collection(db, 'users', user.uid, 'aiLessonThreads'), {
        title: `${t('lesson.type_question')} (${new Date().toLocaleDateString()})`,
        type: 'question',
        status: 'active',
        previewText: '...',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Add welcome message from AI
      await addDoc(collection(db, 'users', user.uid, 'aiLessonThreads', docRef.id, 'messages'), {
        messageId: `msg-${Date.now()}`,
        role: 'assistant',
        content: t('lesson.welcome_message') || '안녕하세요! 탱고 AI 레슨 강사입니다. 어떤 동작이나 연습 방법에 대해 이야기해 볼까요?',
        createdAt: serverTimestamp(),
      });

      setActiveThreadId(docRef.id);
    } catch (error) {
      console.error('Failed to create thread:', error);
      alert(t('lesson.create_error') || 'Error occurred.');
    }
  };

  const report = reportThread?.finalReport;

  return (
    <div className="flex flex-col h-full min-h-[calc(100dvh-200px)]">
      {/* Sticky Header */}
      <div className="flex items-center justify-between px-4 py-4 bg-white/80 backdrop-blur-md sticky top-0 z-10 border-b border-slate-100/80">
        <h1 className="text-[16px] font-extrabold text-slate-800 tracking-tight flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#007AFF] animate-pulse" />
          {t('lesson.title')}
        </h1>
        <button
          onClick={handleNewInquiry}
          className="px-4 py-1.5 rounded-xl bg-[#007AFF] text-white text-[12px] font-bold shadow-md shadow-[#007AFF]/10 active:scale-95 transition-all hover:bg-[#0025D2]"
        >
          {t('lesson.new_inquiry')}
        </button>
      </div>

      {/* Thread list */}
      <div className="flex-1 overflow-y-auto">
        {/* Thread list */}
        {threads.length > 0 && (
          <div className="py-4">
            <div className="px-4 pb-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{t('lesson.coaching_list')}</span>
            </div>
            {threads.map((thread) => (
              <ThreadCard
                key={thread.threadId}
                thread={thread}
                onClick={() => setActiveThreadId(thread.threadId)}
                onReportClick={thread.finalReport ? () => setReportThread(thread) : undefined}
              />
            ))}
          </div>
        )}

        {threads.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 px-6">
            <span className="material-symbols-outlined text-[48px] text-slate-200 mb-3">forum</span>
            <p className="text-[13px] text-slate-400 text-center">{t('lesson.empty_state')}</p>
          </div>
        )}
      </div>

      {/* Fullscreen Report Overlay */}
      {reportThread && report && (
        <div className="fixed inset-0 z-50 bg-white flex flex-col">
          {/* Report Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-green-600">assignment</span>
              <span className="text-[14px] font-bold text-slate-800">{t('lesson.final_report')}</span>
            </div>
            <button onClick={() => setReportThread(null)} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100">
              <span className="material-symbols-outlined text-[20px] text-slate-500">close</span>
            </button>
          </div>
          {/* Report title */}
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-100">
            <p className="text-[13px] font-bold text-slate-700">{reportThread.title}</p>
          </div>
          {/* Report content */}
          <div className="flex-1 overflow-y-auto px-4 py-4">
            <p className="text-[13px] text-slate-700 mb-4 leading-relaxed">{report.summary}</p>
            {report.strengths?.length > 0 && (
              <ReportSection icon="thumb_up" title={t('lesson.strengths')} items={report.strengths} color="green" />
            )}
            {report.pointsToCheck?.length > 0 && (
              <ReportSection icon="visibility" title={t('lesson.points_to_check')} items={report.pointsToCheck} color="amber" />
            )}
            {report.recommendedDrills?.length > 0 && (
              <ReportSection icon="fitness_center" title={t('lesson.recommended_drills')} items={report.recommendedDrills} color="blue" />
            )}
            {report.nextQuestions?.length > 0 && (
              <ReportSection icon="help" title={t('lesson.next_questions')} items={report.nextQuestions} color="purple" />
            )}
          </div>
        </div>
      )}

      {/* Fullscreen Chat/Thread Overlay */}
      {activeThreadId && (
        <AiLessonThread
          threadId={activeThreadId}
          onClose={() => setActiveThreadId(null)}
        />
      )}
    </div>
  );
}

function ReportSection({ icon, title, items, color }: { icon: string; title: string; items: string[]; color: string }) {
  const colorMap: Record<string, string> = {
    green: 'text-green-600',
    amber: 'text-amber-600',
    blue: 'text-blue-600',
    purple: 'text-purple-600',
  };
  return (
    <div className="mb-4">
      <div className="flex items-center gap-1.5 mb-1.5">
        <span className={`material-symbols-outlined text-[14px] ${colorMap[color]}`}>{icon}</span>
        <span className={`text-[11px] font-bold uppercase tracking-wider ${colorMap[color]}`}>{title}</span>
      </div>
      <ul className="space-y-1 pl-5">
        {items.map((item: string, i: number) => (
          <li key={i} className="text-[12px] text-slate-600 leading-relaxed list-disc">{item}</li>
        ))}
      </ul>
    </div>
  );
}
