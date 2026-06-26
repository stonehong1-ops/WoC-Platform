'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { collection, query, orderBy, onSnapshot, addDoc, doc, getDoc, updateDoc, deleteDoc, getDocs, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '@/lib/firebase/clientApp';
import { useAuth } from '@/components/providers/AuthProvider';
import { useLanguage } from '@/contexts/LanguageContext';
import ChatInput from './ChatInput';

interface Message {
  id: string;
  messageId: string;
  role: 'user' | 'assistant';
  content: string;
  mediaUrls?: string[];
  mediaTypes?: ('photo' | 'video')[];
  createdAt: any;
}

interface FinalReport {
  summary: string;
  strengths: string[];
  pointsToCheck: string[];
  recommendedDrills: string[];
  nextQuestions: string[];
  createdAt: any;
  updatedAt?: any;
}

interface ThreadData {
  threadId: string;
  title: string;
  type: string;
  status: string;
  finalReport?: FinalReport;
}

export default function AiLessonThread({ threadId, onClose }: { threadId: string; onClose: () => void }) {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const router = useRouter();
  const [thread, setThread] = useState<ThreadData | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [sending, setSending] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef<Message[]>([]);

  // Sync messages reference for unmount cleanup
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Unmount cleanup for empty threads
  useEffect(() => {
    return () => {
      if (!user?.uid || !threadId) return;
      const currentMsgs = messagesRef.current;
      const userMsgs = currentMsgs.filter(m => m.role === 'user');
      const aiResponseMsgs = currentMsgs.filter(m => m.role === 'assistant');
      if (userMsgs.length === 0 || aiResponseMsgs.length <= 1) {
        (async () => {
          try {
            const threadRef = doc(db, 'users', user.uid, 'aiLessonThreads', threadId);
            const msgSnap = await getDocs(collection(db, 'users', user.uid, 'aiLessonThreads', threadId, 'messages'));
            for (const msgDoc of msgSnap.docs) {
              await deleteDoc(msgDoc.ref);
            }
            await deleteDoc(threadRef);
          } catch (err) {
            console.error('Auto cleanup on unmount failed:', err);
          }
        })();
      }
    };
  }, [user?.uid, threadId]);

  // Subscribe to thread
  useEffect(() => {
    if (!user?.uid || !threadId) return;
    const threadRef = doc(db, 'users', user.uid, 'aiLessonThreads', threadId);
    const unsub = onSnapshot(threadRef, (snap) => {
      if (snap.exists()) {
        setThread({ ...snap.data(), threadId: snap.id } as ThreadData);
      }
    });
    return () => unsub();
  }, [user?.uid, threadId]);

  // Subscribe to messages
  useEffect(() => {
    if (!user?.uid || !threadId) return;
    const q = query(
      collection(db, 'users', user.uid, 'aiLessonThreads', threadId, 'messages'),
      orderBy('createdAt', 'asc')
    );
    const unsub = onSnapshot(q, (snap) => {
      const msgs = snap.docs.map(d => ({ ...d.data(), id: d.id } as Message));
      setMessages(msgs);
    });
    return () => unsub();
  }, [user?.uid, threadId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  // Send additional message
  const handleSend = useCallback(async (text: string, files: File[]) => {
    if (!user?.uid || !threadId) return;
    setSending(true);

    try {
      const mediaUrls: string[] = [];
      const mediaStoragePaths: string[] = [];
      const mediaTypes: ('photo' | 'video')[] = [];

      for (const file of files) {
        const isVideo = file.type.startsWith('video/');
        const fileId = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
        const ext = file.name.split('.').pop() || (isVideo ? 'mp4' : 'jpg');
        const folder = isVideo ? 'videos' : 'photos';
        const storagePath = `ai-lesson/${user.uid}/${threadId}/${folder}/${fileId}.${ext}`;
        const storageRef = ref(storage, storagePath);
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);
        mediaUrls.push(url);
        mediaStoragePaths.push(storagePath);
        mediaTypes.push(isVideo ? 'video' : 'photo');
      }

      // Save user message
      const userMsgData: any = {
        messageId: `msg-${Date.now()}`,
        role: 'user',
        content: text,
        createdAt: serverTimestamp(),
      };
      if (mediaUrls.length > 0) {
        userMsgData.mediaUrls = mediaUrls;
        userMsgData.mediaStoragePaths = mediaStoragePaths;
        userMsgData.mediaTypes = mediaTypes;
      }
      await addDoc(collection(db, 'users', user.uid, 'aiLessonThreads', threadId, 'messages'), userMsgData);

      // Update thread type if mixed
      const threadRef = doc(db, 'users', user.uid, 'aiLessonThreads', threadId);
      if (thread && files.length > 0 && thread.type === 'question') {
        await updateDoc(threadRef, { type: 'mixed', updatedAt: serverTimestamp() });
      } else if (thread && files.length === 0 && thread.type === 'analysis') {
        await updateDoc(threadRef, { type: 'mixed', updatedAt: serverTimestamp() });
      } else {
        await updateDoc(threadRef, { updatedAt: serverTimestamp() });
      }

      // Build conversation history for API
      const allMessages = [...messages, { role: 'user' as const, content: text, mediaUrls: mediaUrls.length > 0 ? mediaUrls : undefined }];
      const apiMessages = allMessages.map(m => ({
        role: m.role,
        content: m.content || '',
        mediaUrls: (m as any).mediaUrls,
      }));

      const res = await fetch('/api/ai-lesson/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages, language }),
      });

      const data = await res.json();
      if (data.success && data.response) {
        await addDoc(collection(db, 'users', user.uid, 'aiLessonThreads', threadId, 'messages'), {
          messageId: `msg-${Date.now()}`,
          role: 'assistant',
          content: data.response,
          createdAt: serverTimestamp(),
        });
        await updateDoc(threadRef, {
          previewText: data.response.substring(0, 100),
          updatedAt: serverTimestamp(),
        });
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      alert(t('lesson.send_error'));
    } finally {
      setSending(false);
    }
  }, [user?.uid, threadId, thread, messages, language, t]);

  // Generate final report
  const handleGenerateReport = useCallback(async () => {
    if (!user?.uid || !threadId || messages.length === 0) return;
    setGeneratingReport(true);

    try {
      const apiMessages = messages.map(m => ({
        role: m.role,
        content: m.content || '',
      }));

      const res = await fetch('/api/ai-lesson/final-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages, language }),
      });

      const data = await res.json();
      if (data.success && data.report) {
        const threadRef = doc(db, 'users', user.uid, 'aiLessonThreads', threadId);
        const now = new Date().toISOString();
        await updateDoc(threadRef, {
          finalReport: {
            ...data.report,
            createdAt: thread?.finalReport?.createdAt || now,
            updatedAt: now,
          },
          status: 'reported',
          updatedAt: serverTimestamp(),
        });
        setShowReport(true);
      }
    } catch (error) {
      console.error('Failed to generate report:', error);
      alert(t('lesson.report_error'));
    } finally {
      setGeneratingReport(false);
    }
  }, [user?.uid, threadId, messages, language, t, thread, onClose]);

  // Delete thread
  const handleDelete = useCallback(async () => {
    if (!user?.uid || !threadId) return;
    if (!confirm(t('lesson.delete_confirm'))) return;

    try {
      // Delete all messages
      const msgSnap = await getDocs(collection(db, 'users', user.uid, 'aiLessonThreads', threadId, 'messages'));
      for (const msgDoc of msgSnap.docs) {
        const msgData = msgDoc.data();
        // Delete Storage files
        if (msgData.mediaStoragePaths) {
          for (const path of msgData.mediaStoragePaths) {
            try { await deleteObject(ref(storage, path)); } catch { /* ignore */ }
          }
        }
        await deleteDoc(msgDoc.ref);
      }

      // Delete thread document
      await deleteDoc(doc(db, 'users', user.uid, 'aiLessonThreads', threadId));
      onClose(); // Close the screen upon deletion
    } catch (error) {
      console.error('Failed to delete thread:', error);
      alert(t('lesson.delete_error'));
    }
  }, [user?.uid, threadId, t, onClose]);

  const handleBack = useCallback(async () => {
    if (!user?.uid || !threadId) {
      onClose();
      return;
    }
    const userMsgs = messages.filter(m => m.role === 'user');
    const aiResponseMsgs = messages.filter(m => m.role === 'assistant');
    if (userMsgs.length === 0 || aiResponseMsgs.length <= 1) {
      try {
        const msgSnap = await getDocs(collection(db, 'users', user.uid, 'aiLessonThreads', threadId, 'messages'));
        for (const msgDoc of msgSnap.docs) {
          await deleteDoc(msgDoc.ref);
        }
        await deleteDoc(doc(db, 'users', user.uid, 'aiLessonThreads', threadId));
      } catch (e) {
        console.error('Failed to cleanup empty thread on back:', e);
      }
    }
    onClose();
  }, [user?.uid, threadId, messages, onClose]);

  const report = thread?.finalReport;

  return (
    <div className="fixed inset-0 z-[100] bg-white flex flex-col">
      {/* Header actions */}
      <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-slate-100">
        <button onClick={handleBack} className="flex items-center gap-1 text-[13px] text-slate-500 font-medium">
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          {t('lesson.back_to_list')}
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={handleGenerateReport}
            disabled={generatingReport || messages.length === 0}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#007AFF]/10 text-[#007AFF] text-[12px] font-bold disabled:opacity-40"
          >
            <span className="material-symbols-outlined text-[14px]">summarize</span>
            {report ? t('lesson.regenerate_report') : t('lesson.generate_report')}
          </button>
          <button
            onClick={handleDelete}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-50 text-red-500 text-[12px] font-bold"
          >
            <span className="material-symbols-outlined text-[14px]">delete</span>
            {t('lesson.delete_thread')}
          </button>
        </div>
      </div>

      {/* Final Report Card */}
      {report && showReport && (
        <div className="mx-4 mt-3 p-4 bg-gradient-to-br from-green-50 to-emerald-50/30 rounded-2xl border border-green-100/80">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-green-600">assignment</span>
              <span className="text-[13px] font-bold text-green-800">{t('lesson.final_report')}</span>
            </div>
            <button onClick={() => setShowReport(false)} className="text-slate-400">
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          </div>
          <p className="text-[13px] text-slate-700 mb-3 leading-relaxed">{report.summary}</p>
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
      )}

      {report && !showReport && (
        <button
          onClick={() => setShowReport(true)}
          className="mx-4 mt-2 px-3 py-2 rounded-xl bg-green-50 border border-green-100 flex items-center gap-2 text-[12px] text-green-700 font-medium"
        >
          <span className="material-symbols-outlined text-[16px]">assignment</span>
          {t('lesson.view_report')}
        </button>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        {generatingReport && (
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin w-5 h-5 border-2 border-[#007AFF] border-t-transparent rounded-full mr-2" />
            <span className="text-[13px] text-slate-500">{t('lesson.generating_report')}</span>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] ${msg.role === 'user' ? 'order-2' : ''}`}>
              {/* Media */}
              {msg.mediaUrls && msg.mediaUrls.length > 0 && (
                <div className="flex gap-1.5 mb-1.5 flex-wrap">
                  {msg.mediaUrls.map((url, i) => (
                    <div key={i} className="w-24 h-24 rounded-xl overflow-hidden border border-slate-200">
                      {msg.mediaTypes?.[i] === 'video' ? (
                        <video src={url} className="w-full h-full object-cover" controls />
                      ) : (
                        <img src={url} alt="" className="w-full h-full object-cover" />
                      )}
                    </div>
                  ))}
                </div>
              )}
              {/* Text bubble */}
              {msg.content && (
                <div className={`px-4 py-3 rounded-2xl text-[13px] leading-relaxed whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-[#007AFF] text-white rounded-br-md'
                    : 'bg-slate-100 text-slate-800 rounded-bl-md'
                }`}>
                  {msg.content}
                </div>
              )}
            </div>
          </div>
        ))}

        {sending && (
          <div className="flex justify-start">
            <div className="px-4 py-3 rounded-2xl bg-slate-100 rounded-bl-md">
              <div className="flex gap-1.5">
                <div className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="sticky bottom-0 z-10">
        <ChatInput
          onSend={handleSend}
          disabled={sending || !user}
          placeholder={t('lesson.chat_placeholder')}
        />
      </div>
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
    <div className="mb-3">
      <div className="flex items-center gap-1.5 mb-1.5">
        <span className={`material-symbols-outlined text-[14px] ${colorMap[color]}`}>{icon}</span>
        <span className={`text-[11px] font-bold uppercase tracking-wider ${colorMap[color]}`}>{title}</span>
      </div>
      <ul className="space-y-1 pl-5">
        {items.map((item, i) => (
          <li key={i} className="text-[12px] text-slate-600 leading-relaxed list-disc">{item}</li>
        ))}
      </ul>
    </div>
  );
}
