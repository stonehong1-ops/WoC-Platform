'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { useLanguage } from '@/contexts/LanguageContext';
import { db } from '@/lib/firebase/clientApp';
import { collection, query, orderBy, limit, onSnapshot, doc, deleteDoc, getDocs, writeBatch, getDoc } from 'firebase/firestore';
import { ErrorLogEntry } from '@/lib/utils/errorHandler';
import { toast } from 'sonner';

export default function ErrorLogsAdminPage() {
  const { user, profile, loading } = useAuth();
  const { t, language } = useLanguage();
  const router = useRouter();
  
  const [logs, setLogs] = useState<ErrorLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [userMap, setUserMap] = useState<Record<string, { nickname?: string; nativeNickname?: string }>>({});

  useEffect(() => {
    if (loading) return;
    
    // Admin check
    const isAdmin = profile?.isAdmin || profile?.systemRole === 'admin';
    if (!isAdmin) {
      toast.error('Access Denied: Admin only.');
      router.push('/profile');
      return;
    }

    const q = query(
      collection(db, 'error_logs'),
      orderBy('timestamp', 'desc'),
      limit(100)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedLogs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ErrorLogEntry[];
      
      setLogs(fetchedLogs);
      setIsLoading(false);
    }, (error) => {
      console.error('Failed to subscribe to error logs:', error);
      toast.error('Failed to load error logs.');
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user, profile, loading, router]);

  // Fetch nicknames for unique userIds in real-time logs
  useEffect(() => {
    if (logs.length === 0) return;
    const uids = Array.from(new Set(logs.map(log => log.userId).filter(Boolean))) as string[];
    const missingUids = uids.filter(uid => !userMap[uid]);
    if (missingUids.length === 0) return;

    const fetchUsers = async () => {
      const tempMap = { ...userMap };
      try {
        const promises = missingUids.map(async (uid) => {
          const userDoc = await getDoc(doc(db, 'users', uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            return { 
              uid, 
              nickname: data.nickname || '', 
              nativeNickname: data.nativeNickname || '' 
            };
          }
          return { uid, nickname: '', nativeNickname: '' };
        });
        
        const resolved = await Promise.all(promises);
        resolved.forEach(item => {
          tempMap[item.uid] = { 
            nickname: item.nickname, 
            nativeNickname: item.nativeNickname 
          };
        });
        setUserMap(tempMap);
      } catch (e) {
        console.error('Failed to fetch user profiles for error logs:', e);
      }
    };

    fetchUsers();
  }, [logs, userMap]);

  const handleDeleteLog = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this log?')) return;
    try {
      await deleteDoc(doc(db, 'error_logs', id));
      toast.success('Log deleted successfully.');
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete log.');
    }
  };

  const handleClearAllLogs = async () => {
    if (!confirm('🚨 WARNING: This will delete ALL logged errors. Proceed?')) return;
    try {
      const snapshot = await getDocs(collection(db, 'error_logs'));
      const batch = writeBatch(db);
      snapshot.docs.forEach((d) => {
        batch.delete(d.ref);
      });
      await batch.commit();
      toast.success('All logs cleared.');
    } catch (err) {
      console.error(err);
      toast.error('Failed to clear logs.');
    }
  };

  const formatTimestamp = (ts: any) => {
    if (!ts) return '-';
    const d = typeof ts.toDate === 'function' ? ts.toDate() : new Date(ts.seconds * 1000);
    return d.toLocaleString(language === 'KR' ? 'ko-KR' : 'en-US');
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-3 border-red-500/30 border-t-red-600 rounded-full animate-spin" />
          <span className="text-xs font-bold text-slate-400">LOADING ERROR LOGS...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans p-4 sm:p-6 pb-24">
      <header className="max-w-4xl mx-auto flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-black tracking-tight text-red-600 uppercase">System Error Logs</h1>
          <p className="text-xs text-slate-400 font-medium mt-1">Real-time production exception tracking</p>
        </div>
        {logs.length > 0 && (
          <button
            onClick={handleClearAllLogs}
            className="flex items-center gap-1.5 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-bold transition-all border border-red-200"
          >
            <span className="material-symbols-outlined text-[16px]">delete_sweep</span>
            Clear All
          </button>
        )}
      </header>

      <main className="max-w-4xl mx-auto space-y-3">
        {logs.length === 0 ? (
          <div className="py-20 text-center bg-white border border-slate-100 rounded-2xl shadow-sm">
            <span className="material-symbols-outlined text-4xl text-emerald-500 mb-2" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
            <p className="text-sm font-bold text-slate-700">All systems operational.</p>
            <p className="text-xs text-slate-400 mt-1">No errors logged in the last 100 events.</p>
          </div>
        ) : (
          logs.map((log) => {
            const isExpanded = expandedLogId === log.id;
            return (
              <div
                key={log.id}
                onClick={() => setExpandedLogId(isExpanded ? null : (log.id || null))}
                className={`bg-white rounded-xl border transition-all cursor-pointer overflow-hidden shadow-sm hover:shadow ${
                  isExpanded ? 'border-red-200 ring-2 ring-red-50' : 'border-slate-100'
                }`}
              >
                <div className="p-4 flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1 space-y-1.5">
                    {/* Log Meta Header */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-red-100 text-red-700 text-[9px] font-black uppercase tracking-wider shrink-0">
                        {log.context || 'General'}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono shrink-0">
                        {formatTimestamp(log.timestamp)}
                      </span>
                      {log.userId && (
                        <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-semibold truncate max-w-[200px]" title={`User ID: ${log.userId}`}>
                          User: {userMap[log.userId]?.nickname || userMap[log.userId]?.nativeNickname 
                            ? `${userMap[log.userId]?.nickname || ''}${userMap[log.userId]?.nativeNickname ? ` (${userMap[log.userId]?.nativeNickname})` : ''}`
                            : 'Loading...'}
                        </span>
                      )}
                    </div>
                    {/* Error Message */}
                    <h3 className="text-sm font-black text-slate-800 break-all leading-snug">
                      {log.message}
                    </h3>
                    {log.url && (
                      <p className="text-[10px] text-slate-400 font-mono truncate" title={log.url}>
                        URL: {log.url}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const errorMsg = `[Error Fix Request]\n` +
                          `- Context: ${log.context || 'General'}\n` +
                          `- Message: ${log.message || ''}\n` +
                          `- URL: ${log.url || ''}\n` +
                          `- User: ${userMap[log.userId || '']?.nickname || ''}${userMap[log.userId || '']?.nativeNickname ? ` (${userMap[log.userId || '']?.nativeNickname})` : ''} (ID: ${log.userId || 'Guest'})\n` +
                          `- Timestamp: ${formatTimestamp(log.timestamp)}`;
                        router.push(`/admin/antigravity?message=${encodeURIComponent(errorMsg)}`);
                      }}
                      className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-[10px] font-bold transition-all border border-blue-200"
                      title="Ask AI to fix this error"
                    >
                      <span className="material-symbols-outlined text-[12px] fill-1" style={{ fontVariationSettings: "'FILL' 1" }}>smart_toy</span>
                      AI 수정 요청
                    </button>
                    <button
                      onClick={(e) => handleDeleteLog(log.id || '', e)}
                      className="w-8 h-8 rounded-full hover:bg-red-50 text-slate-400 hover:text-red-600 flex items-center justify-center transition-colors"
                      title="Delete log"
                    >
                      <span className="material-symbols-outlined text-sm">delete</span>
                    </button>
                    <span className="material-symbols-outlined text-slate-400 text-[18px] transition-transform duration-300">
                      {isExpanded ? 'expand_less' : 'expand_more'}
                    </span>
                  </div>
                </div>

                {/* Expanded Stack Trace */}
                {isExpanded && (
                  <div className="border-t border-slate-100 bg-slate-50/50 p-4 space-y-3 font-mono text-[11px] leading-relaxed break-all">
                    {log.stack ? (
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Stack Trace</p>
                        <pre className="whitespace-pre-wrap overflow-x-auto text-red-600 max-h-[300px] bg-white p-3 rounded-lg border border-slate-200">
                          {log.stack}
                        </pre>
                      </div>
                    ) : (
                      <p className="text-slate-400 italic">No stack trace available.</p>
                    )}
                    {log.userAgent && (
                      <div className="space-y-0.5">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">User Agent</p>
                        <p className="text-slate-600">{log.userAgent}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </main>
      
      {/* Material Icons CDN */}
      <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet"/>
    </div>
  );
}
