'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { useLanguage } from '@/contexts/LanguageContext';
import { db } from '@/lib/firebase/clientApp';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { toast } from 'sonner';

interface Report {
  id: string;
  targetId: string;
  targetType: 'profile' | 'post' | 'comment' | 'chat' | 'event';
  targetOwnerUid?: string;
  targetSnapshot?: string;
  targetTitle?: string;
  reason: string;
  reportedBy: string;
  reportedByNickname?: string;
  status: 'pending' | 'actioned' | 'dismissed';
  createdAt: any;
}

const ADMIN_UIDS = ['7iaZAmaYY9dNNEShmJmROI8XrtH2'];

export default function AdminReportsPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const { t, language } = useLanguage();
  const router = useRouter();

  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'actioned' | 'dismissed'>('all');
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Keep track of revealed media IDs (stored in local memory per session)
  const [revealedMediaIds, setRevealedMediaIds] = useState<Set<string>>(new Set());

  // Authorization Check
  const isAuthorized = useMemo(() => {
    if (authLoading) return null;
    if (!user) return false;
    return ADMIN_UIDS.includes(user.uid) || 
           profile?.systemRole === 'admin' || 
           profile?.isAdmin === true || 
           user.email === 'stonehong1@gmail.com';
  }, [user, profile, authLoading]);

  useEffect(() => {
    if (isAuthorized === false) {
      toast.error('Admin access required');
      router.push('/');
    }
  }, [isAuthorized, router]);

  // Subscribe to reports
  useEffect(() => {
    if (isAuthorized !== true) return;

    const q = query(collection(db, 'reports'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }) as Report);
      setReports(list);
      setLoading(false);
    }, (err) => {
      console.error('Failed to load reports:', err);
      setLoading(false);
    });

    return () => unsub();
  }, [isAuthorized]);

  const handleAction = async (report: Report, action: 'suspend' | 'dismiss') => {
    if (!user || processingId) return;

    const confirmMsg = action === 'suspend'
      ? `������ ��� �����(${report.targetOwnerUid})�� �����Ͻðڽ��ϱ�?\n�� ��ġ�� Firebase Auth ������ ��Ȱ��ȭ�ϰ� �������� ��ū�� ���� �����ŵ�ϴ�.`
      : `�� �Ű� �׸�(${report.id})�� �ݷ� ó���Ͻðڽ��ϱ�?`;

    if (!window.confirm(confirmMsg)) return;

    setProcessingId(report.id);
    try {
      const idToken = await user.getIdToken();
      const res = await fetch('/api/admin/moderation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({
          targetUid: report.targetOwnerUid,
          action,
          reason: report.reason,
          reportId: report.id
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Operation failed');

      toast.success(action === 'suspend' ? '����� ���� ��ġ�� �Ϸ�Ǿ����ϴ�.' : '�Ű��� �ݷ� ó���Ǿ����ϴ�.');
    } catch (err: any) {
      console.error(err);
      toast.error(`������ �߻��߽��ϴ�: ${err.message}`);
    } finally {
      setProcessingId(null);
    }
  };

  const handleRevealMedia = async (report: Report) => {
    if (!user) return;
    
    // Add Reveal audit log to Firestore
    try {
      await addDoc(collection(db, 'mediaRevealLogs'), {
        adminUid: user.uid,
        reportId: report.id,
        targetOwnerUid: report.targetOwnerUid || 'unknown',
        revealedAt: serverTimestamp()
      });

      setRevealedMediaIds(prev => {
        const next = new Set(prev);
        next.add(report.id);
        return next;
      });
      toast.success('�̵�� ���� �αװ� �����Ǿ����ϴ�.');
    } catch (err: any) {
      console.error(err);
      toast.error('���� �α� ��� ����: ' + err.message);
    }
  };

  const filteredReports = useMemo(() => {
    if (filter === 'all') return reports;
    return reports.filter(r => r.status === filter);
  }, [reports, filter]);

  if (authLoading || loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <span className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        <p className="text-sm font-semibold text-gray-500">Checking authorization...</p>
      </div>
    );
  }

  if (isAuthorized !== true) return null;

  return (
    <main className="max-w-[720px] mx-auto min-h-screen bg-slate-50 pb-20 shadow-2xl relative">
      {/* Header */}
      <header className="sticky top-0 bg-white border-b border-gray-100 z-50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-slate-100 transition-colors">
            <span className="material-symbols-outlined text-gray-700">arrow_back</span>
          </button>
          <h1 className="text-lg font-black text-gray-900 uppercase tracking-tight">Report & Moderation</h1>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-700 rounded-full text-xs font-bold">
          <span className="material-symbols-outlined !text-[14px]">shield</span> Admin Panel
        </div>
      </header>

      {/* Tabs */}
      <div className="px-6 py-4 flex gap-2 border-b border-gray-100 bg-white">
        {(['all', 'pending', 'actioned', 'dismissed'] as const).map(t => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-wider transition-all ${
              filter === t ? 'bg-slate-900 text-white' : 'bg-slate-100 text-gray-600 hover:bg-slate-200'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {filteredReports.length === 0 ? (
          <div className="text-center py-20 bg-white border border-gray-200/50 rounded-3xl">
            <span className="material-symbols-outlined text-5xl text-gray-300 mb-3">check_circle</span>
            <p className="text-sm font-bold text-gray-400">�Ű� ������ �������� �ʽ��ϴ�.</p>
          </div>
        ) : (
          filteredReports.map(report => {
            const isChildSafety = report.reason.startsWith('CSAE') || report.reason.includes('�Ƶ�') || report.reason.includes('Child');
            const isMedia = report.targetSnapshot?.includes('http');
            const isBlurred = isChildSafety && isMedia && !revealedMediaIds.has(report.id);

            return (
              <div key={report.id} className="bg-white border border-gray-200/50 rounded-3xl p-6 shadow-sm space-y-4">
                {/* Card Header */}
                <div className="flex justify-between items-start">
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1 bg-slate-100 text-slate-800 rounded-full text-[10px] font-black uppercase tracking-wider">
                      {report.targetType}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      report.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                      report.status === 'actioned' ? 'bg-emerald-100 text-emerald-800' :
                      'bg-gray-150 text-gray-500'
                    }`}>
                      {report.status}
                    </span>
                  </div>
                  <span className="text-[10px] text-gray-400 font-bold">
                    {report.createdAt ? new Date(report.createdAt.seconds * 1000).toLocaleString() : ''}
                  </span>
                </div>

                {/* Reason */}
                <div className={`p-4 rounded-2xl border ${isChildSafety ? 'bg-red-50 border-red-100 text-red-900' : 'bg-amber-50/50 border-amber-100 text-amber-900'}`}>
                  <p className="text-[11px] font-black uppercase tracking-wider mb-1">
                    {isChildSafety ? '?? CHILD SAFETY WARNING' : '?? REPORTED REASON'}
                  </p>
                  <p className="text-sm font-bold">{report.reason}</p>
                </div>

                {/* Snapshot Content / Media */}
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Reported Content</p>
                  
                  {isBlurred ? (
                    <div className="relative rounded-2xl overflow-hidden aspect-video border border-red-200 flex flex-col items-center justify-center p-6 bg-red-50/20">
                      {/* Blurred mock placeholder */}
                      <div className="absolute inset-0 bg-red-950/20 backdrop-blur-xl" />
                      <div className="relative z-10 text-center space-y-3">
                        <span className="material-symbols-outlined text-4xl text-red-600">report_problem</span>
                        <h4 className="text-xs font-black text-gray-900 uppercase">CSAE / Child Safety Media Blurred</h4>
                        <p className="text-[10px] text-gray-600 font-bold max-w-xs leading-relaxed">
                          �Ƶ� ���� ���� ������ �ǽɵǴ� �̹����Դϴ�. ���� �� ���� �αװ� ��ϵ˴ϴ�.
                        </p>
                        <button
                          onClick={() => handleRevealMedia(report)}
                          className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-full text-[11px] font-black uppercase tracking-wider transition-all active:scale-95 shadow-sm"
                        >
                          Reveal / �����ϱ�
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-semibold text-gray-700 whitespace-pre-wrap break-all leading-relaxed">
                      {report.targetSnapshot || '[No snapshot available]'}
                    </div>
                  )}
                </div>

                {/* Sender / Target */}
                <div className="grid grid-cols-2 gap-4 text-xs border-t border-gray-100 pt-4 font-bold text-gray-600">
                  <div>
                    <span className="text-[10px] text-gray-400 block uppercase tracking-widest mb-0.5">Reporter</span>
                    {report.reportedByNickname || 'Anonymous'} ({report.reportedBy})
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 block uppercase tracking-widest mb-0.5">Reported User</span>
                    {report.targetOwnerUid || 'unknown'}
                  </div>
                </div>

                {/* Card Footer Actions */}
                {report.status === 'pending' && (
                  <div className="flex gap-2 justify-end pt-2">
                    <button
                      disabled={!!processingId}
                      onClick={() => handleAction(report, 'dismiss')}
                      className="px-4 py-2 border border-gray-200 hover:bg-slate-50 rounded-xl text-xs font-bold text-gray-700 active:scale-95 transition-all"
                    >
                      Dismiss / �ݷ�
                    </button>
                    <button
                      disabled={!!processingId}
                      onClick={() => handleAction(report, 'suspend')}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black active:scale-95 transition-all shadow-sm flex items-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-sm">block</span>
                      Suspend / ���� ����
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </main>
  );
}
