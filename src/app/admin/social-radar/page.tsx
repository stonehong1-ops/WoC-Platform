"use client";

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { SocialRadarCandidate } from './types';
import { socialRadarService } from './lib/socialRadarService';
import SocialRadarManualInput from './components/SocialRadarManualInput';
import SocialRadarFilters, { RadarFilterType, RadarSortType } from './components/SocialRadarFilters';
import SocialRadarCandidateCard from './components/SocialRadarCandidateCard';

export default function AdminSocialRadarPage() {
  const [candidates, setCandidates] = useState<SocialRadarCandidate[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [filter, setFilter] = useState<RadarFilterType>('all');
  const [sort, setSort] = useState<RadarSortType>('latest');

  // Manual fetch handler to avoid automatic read costs
  const handleFetchData = async () => {
    setLoading(true);
    try {
      const list = await socialRadarService.getCandidates();
      setCandidates(list);
      toast.success('데이터 조회를 완료하였습니다.');
    } catch (err: any) {
      console.error(err);
      toast.error('후보 정보를 로드하는 데 실패하였습니다.');
    } finally {
      setLoading(false);
      setHasLoaded(true);
    }
  };

  const handleCandidateAdded = (newCandidate: SocialRadarCandidate) => {
    setCandidates(prev => [newCandidate, ...prev]);
  };

  const handleStatusChanged = async (
    candidateId: string,
    nextStatus: SocialRadarCandidate['handoffStatus']
  ) => {
    try {
      await socialRadarService.updateStatus(candidateId, nextStatus);
      setCandidates(prev =>
        prev.map(c => (c.id === candidateId ? { ...c, handoffStatus: nextStatus } : c))
      );
      
      const statusLabels: Record<typeof nextStatus, string> = {
        candidate: '검토 중 상태로 복원하였습니다.',
        sent_to_antigravity: '안티에게 작업이 토스되었습니다.',
        applied: '반영 완료 처리를 완료했습니다.',
        ignored: '후보를 무시 처리하였습니다.',
        hold: '후보를 보류 상태로 보냈습니다.'
      };
      
      toast.success(statusLabels[nextStatus]);
    } catch (err: any) {
      console.error(err);
      toast.error('상태 업데이트에 실패하였습니다.');
    }
  };

  // Filter & Sort Logic
  const filteredCandidates = candidates.filter(c => {
    switch (filter) {
      case 'changes':
        return c.handoffStatus === 'candidate' && Object.values(c.detectedChanges || {}).some(Boolean);
      case 'new_candidate':
        return c.handoffStatus === 'candidate' && c.match.status === 'new_candidate';
      case 'hold':
        return c.handoffStatus === 'hold';
      case 'ignored':
        return c.handoffStatus === 'ignored';
      case 'sent':
        return c.handoffStatus === 'sent_to_antigravity' || c.handoffStatus === 'applied';
      case 'all':
      default:
        return true;
    }
  });

  const sortedCandidates = [...filteredCandidates].sort((a, b) => {
    if (sort === 'confidence') {
      return (b.confidence || 0) - (a.confidence || 0);
    } else {
      // latest
      const timeA = a.createdAt instanceof Date ? a.createdAt.getTime() : (a.createdAt as any)?.seconds * 1000 || 0;
      const timeB = b.createdAt instanceof Date ? b.createdAt.getTime() : (b.createdAt as any)?.seconds * 1000 || 0;
      return timeB - timeA;
    }
  });

  // Calculate counts for filters
  const counts: Record<RadarFilterType, number> = {
    all: candidates.length,
    changes: candidates.filter(c => c.handoffStatus === 'candidate' && Object.values(c.detectedChanges || {}).some(Boolean)).length,
    new_candidate: candidates.filter(c => c.handoffStatus === 'candidate' && c.match.status === 'new_candidate').length,
    hold: candidates.filter(c => c.handoffStatus === 'hold').length,
    ignored: candidates.filter(c => c.handoffStatus === 'ignored').length,
    sent: candidates.filter(c => c.handoffStatus === 'sent_to_antigravity' || c.handoffStatus === 'applied').length,
  };

  return (
    <main className="max-w-[896px] mx-auto px-4 pt-4 pb-24 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between pb-2 border-b border-outline-variant/30">
        <div>
          <h1 className="text-2xl font-black text-on-surface tracking-tight flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[28px]">radar</span>
            Social Radar (Manual & Handoff)
          </h1>
          <p className="text-xs text-outline mt-1">
            공개 노출된 탱고 소셜 후보를 AI 분석하여 작업 카드로 Antigravity에 토스하는 파이프라인입니다.
          </p>
        </div>
        {hasLoaded && (
          <button
            onClick={handleFetchData}
            disabled={loading}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-primary text-on-primary rounded-xl text-xs font-bold transition-all hover:brightness-105 active:scale-95 disabled:opacity-50 shadow-sm"
          >
            <span className="material-symbols-outlined text-[16px] animate-none">refresh</span>
            새로고침
          </button>
        )}
      </div>

      {/* Manual Input Form */}
      <SocialRadarManualInput onCandidateAdded={handleCandidateAdded} />

      {/* Filters and Sorters */}
      <SocialRadarFilters
        activeFilter={filter}
        onChangeFilter={setFilter}
        activeSort={sort}
        onChangeSort={setSort}
        counts={counts}
      />

      {/* Candidates List */}
      {!hasLoaded && !loading ? (
        <div className="py-20 text-center border border-dashed border-outline-variant/40 rounded-2xl bg-surface-container-lowest space-y-4">
          <span className="material-symbols-outlined text-[48px] text-outline/30">search</span>
          <div>
            <p className="text-sm font-black text-on-surface">데이터가 로드되지 않았습니다</p>
            <p className="text-xs text-outline mt-1">서버 및 Firestore 조회를 명시적으로 수행하려면 아래 버튼을 클릭하세요.</p>
          </div>
          <button
            onClick={handleFetchData}
            className="bg-primary text-on-primary px-6 py-3 rounded-xl font-bold hover:brightness-105 active:scale-98 transition-all shadow-md inline-flex items-center gap-2 text-xs"
          >
            <span className="material-symbols-outlined text-[18px]">search</span>
            소셜 레이더 데이터 조회하기
          </button>
        </div>
      ) : loading ? (
        <div className="py-20 text-center space-y-3">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-outline font-bold">소셜 레이더 데이터를 가져오고 있습니다...</p>
        </div>
      ) : sortedCandidates.length === 0 ? (
        <div className="py-20 text-center border border-dashed border-outline-variant/40 rounded-2xl bg-surface-container-lowest">
          <span className="material-symbols-outlined text-[48px] text-outline/40 mb-2">radar</span>
          <p className="text-sm font-black text-outline">표시할 소셜 후보가 없습니다.</p>
          <p className="text-xs text-outline/80 mt-1">수동 분석 폼을 통해 새로운 글을 등록해 보세요!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedCandidates.map(c => (
            <SocialRadarCandidateCard
              key={c.id}
              candidate={c}
              onStatusChanged={handleStatusChanged}
            />
          ))}
        </div>
      )}
    </main>
  );
}
