import React, { useState } from 'react';
import { toast } from 'sonner';
import { SocialRadarCandidate } from '../types';
import { socialRadarService } from '../lib/socialRadarService';

interface SocialRadarCandidateCardProps {
  candidate: SocialRadarCandidate;
  onStatusChanged: (candidateId: string, nextStatus: SocialRadarCandidate['handoffStatus']) => void;
}

export default function SocialRadarCandidateCard({
  candidate,
  onStatusChanged
}: SocialRadarCandidateCardProps) {
  const [tossing, setTossing] = useState(false);
  const { id, sourceType, sourceUrl, extracted, match, detectedChanges, confidence, handoffStatus } = candidate;

  // Handoff Status display colors
  const statusColors: Record<SocialRadarCandidate['handoffStatus'], { bg: string; text: string; label: string }> = {
    candidate: { bg: 'bg-blue-50', text: 'text-blue-700', label: '검토 중' },
    sent_to_antigravity: { bg: 'bg-green-50', text: 'text-green-700', label: '토스 완료' },
    applied: { bg: 'bg-purple-50', text: 'text-purple-700', label: '반영 완료' },
    ignored: { bg: 'bg-gray-50', text: 'text-gray-600', label: '무시됨' },
    hold: { bg: 'bg-yellow-50', text: 'text-yellow-700', label: '보류 중' }
  };

  const currentStatus = statusColors[handoffStatus];

  // Match Status colors
  const matchColors: Record<SocialRadarCandidate['match']['status'], { bg: string; text: string; label: string }> = {
    matched: { bg: 'bg-emerald-50 border-emerald-200/50', text: 'text-emerald-700', label: '기존 소셜 일치' },
    possible_match: { bg: 'bg-amber-50 border-amber-200/50', text: 'text-amber-700', label: '기존 매칭 의심' },
    new_candidate: { bg: 'bg-sky-50 border-sky-200/50', text: 'text-sky-700', label: '신규 등록 후보' },
    unknown: { bg: 'bg-gray-50 border-gray-200/50', text: 'text-gray-600', label: '분석 불가' }
  };

  const currentMatch = matchColors[match.status];

  // Handoff to Antigravity
  const handleToss = async () => {
    setTossing(true);
    try {
      const res = await socialRadarService.handoffToAntigravity(id);
      if (res.success) {
        onStatusChanged(id, 'sent_to_antigravity');
        if (res.warning) {
          toast.warning(`토스 완료 (경고: ${res.warning})`, { duration: 6000 });
        } else {
          toast.success('Antigravity 작업 목록으로 토스 완료하였습니다!');
        }
      } else {
        toast.error(res.error || '토스 처리 중 오류가 발생하였습니다.');
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || '토스 처리 중 오류가 발생하였습니다.');
    } finally {
      setTossing(false);
    }
  };

  // Copy Markdown to Clipboard
  const handleCopy = async () => {
    const todayStr = new Date().toISOString().split('T')[0];
    const md = `# Social Register Task

## Candidate
- Title: ${extracted.titleNative || extracted.title || 'N/A'}
- Region: ${extracted.region || 'N/A'}
- Venue: ${extracted.venue || 'N/A'}
- Date: ${extracted.date || 'N/A'}
- Day: ${extracted.dayOfWeek || 'N/A'}
- Time: ${extracted.startTime || 'N/A'} ~ ${extracted.endTime || 'N/A'}
- DJ: ${extracted.dj || 'N/A'}
- Organizer: ${extracted.organizer || 'N/A'}
- Source URL: ${sourceUrl || 'N/A'}
- Source Type: ${sourceType}

## Existing Social Match
- Match Status: ${match.status}
- Existing Social ID: ${match.socialId || 'N/A'}
- Existing Social Title: ${match.socialTitle || 'N/A'}
- Match Confidence: ${match.confidence || 0}%
- Match Reason: ${match.reason || 'N/A'}

## Detected Changes
- Poster: ${detectedChanges.poster ? 'Yes' : 'No'}
- DJ: ${detectedChanges.dj ? 'Yes' : 'No'}
- Description: ${detectedChanges.description ? 'Yes' : 'No'}
- Time: ${detectedChanges.time ? 'Yes' : 'No'}
- Venue: ${detectedChanges.venue ? 'Yes' : 'No'}
- New Social: ${detectedChanges.newSocial ? 'Yes' : 'No'}

## Source Summary
원문 요약:
${extracted.description || 'N/A'}
`;

    try {
      await navigator.clipboard.writeText(md);
      toast.success('작업카드 마크다운을 클립보드에 복사하였습니다!');
    } catch (err) {
      console.error(err);
      toast.error('클립보드 복사에 실패하였습니다.');
    }
  };

  return (
    <div className={`bg-white rounded-2xl border transition-all p-6 space-y-5 ${
      handoffStatus === 'sent_to_antigravity' 
        ? 'border-green-300 bg-green-50/5' 
        : 'border-outline-variant/30 hover:shadow-md'
    }`}>
      {/* Header Info */}
      <div className="flex items-start justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {/* Source Type Badge */}
          <span className="bg-surface-container-low text-outline text-[10px] font-black uppercase px-2.5 py-1 rounded-lg border border-outline-variant/20 tracking-wider">
            {sourceType}
          </span>
          {/* Match Status Badge */}
          <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg border ${currentMatch.bg} ${currentMatch.text}`}>
            {currentMatch.label} ({match.confidence}%)
          </span>
          {/* Handoff Status Badge */}
          <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg ${currentStatus.bg} ${currentStatus.text}`}>
            {currentStatus.label}
          </span>
        </div>
        
        {/* Confidence score indicator */}
        <div className="flex items-center gap-1.5 text-xs text-outline font-bold">
          <span className="material-symbols-outlined text-[16px] text-primary">visibility</span>
          추정 신뢰도 {confidence}%
        </div>
      </div>

      {/* Main Title / Extracted Meta */}
      <div className="space-y-1">
        <h3 className="text-lg font-black text-on-surface leading-tight tracking-tight">
          {extracted.titleNative || extracted.title || '제목 없음'}
        </h3>
        <p className="text-xs text-outline">
          {extracted.region} • {extracted.venue}
        </p>
      </div>

      {/* Changes Detected Alert Box */}
      {Object.values(detectedChanges).some(Boolean) && (
        <div className="p-3 bg-red-50/40 border border-red-100/50 rounded-xl space-y-1.5">
          <div className="text-xs font-black text-red-700 flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px]">warning</span>
            감지된 변경 및 특이사항
          </div>
          <div className="flex flex-wrap gap-1.5">
            {detectedChanges.newSocial && <span className="bg-red-50 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded-md border border-red-200/30">신규 소셜 등록 건</span>}
            {detectedChanges.dj && <span className="bg-red-50 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded-md border border-red-200/30">DJ 변동 가능성</span>}
            {detectedChanges.time && <span className="bg-red-50 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded-md border border-red-200/30">시간 변동 가능성</span>}
            {detectedChanges.venue && <span className="bg-red-50 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded-md border border-red-200/30">장소 변동 가능성</span>}
            {detectedChanges.poster && <span className="bg-red-50 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded-md border border-red-200/30">새 포스터 감지</span>}
            {detectedChanges.description && <span className="bg-red-50 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded-md border border-red-200/30">안내/설명문 변동</span>}
          </div>
        </div>
      )}

      {/* Extracted Details Grid */}
      <div className="grid grid-cols-2 gap-3 text-xs bg-surface-container-lowest/50 p-4 rounded-xl border border-outline-variant/10">
        <div>
          <span className="text-outline block font-bold mb-0.5">날짜 / 요일</span>
          <span className="text-on-surface font-bold">
            {extracted.date || '미지정'} ({extracted.dayOfWeek !== undefined ? ['일', '월', '화', '수', '목', '금', '토'][Number(extracted.dayOfWeek)] || 'N/A' : 'N/A'}요일)
          </span>
        </div>
        <div>
          <span className="text-outline block font-bold mb-0.5">진행 시간</span>
          <span className="text-on-surface font-bold">
            {extracted.startTime && extracted.endTime ? `${extracted.startTime} ~ ${extracted.endTime}` : '미지정'}
          </span>
        </div>
        <div>
          <span className="text-outline block font-bold mb-0.5">DJ</span>
          <span className={`font-bold ${detectedChanges.dj ? 'text-red-600 underline decoration-wavy' : 'text-on-surface'}`}>
            {extracted.dj || '미정'}
          </span>
        </div>
        <div>
          <span className="text-outline block font-bold mb-0.5">오거나이저 (ORG)</span>
          <span className="text-on-surface font-bold">
            {extracted.organizer || '미정'}
          </span>
        </div>
      </div>

      {/* Reason / Match logic description */}
      {match.reason && (
        <p className="text-[11px] text-outline leading-relaxed bg-surface-container-low/20 p-3 rounded-lg border border-outline-variant/10">
          <span className="font-black text-on-surface block mb-0.5">매칭 근거</span>
          {match.reason}
        </p>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-outline-variant/20">
        <div className="flex gap-2">
          {sourceUrl && (
            <a
              href={sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 px-3.5 py-2.5 rounded-xl border border-outline-variant/40 hover:bg-surface-container-low/40 text-xs font-bold text-outline transition-all"
            >
              <span className="material-symbols-outlined text-[16px]">open_in_new</span>
              원본 열기
            </a>
          )}
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-3.5 py-2.5 rounded-xl border border-outline-variant/40 hover:bg-surface-container-low/40 text-xs font-bold text-outline transition-all"
          >
            <span className="material-symbols-outlined text-[16px]">content_copy</span>
            작업카드 복사
          </button>
        </div>

        <div className="flex gap-2">
          {/* Option buttons */}
          {handoffStatus === 'candidate' && (
            <>
              <button
                onClick={() => onStatusChanged(id, 'hold')}
                className="px-3.5 py-2.5 rounded-xl border border-outline-variant/40 hover:bg-yellow-50 hover:text-yellow-700 text-xs font-bold text-outline transition-all"
              >
                보류
              </button>
              <button
                onClick={() => onStatusChanged(id, 'ignored')}
                className="px-3.5 py-2.5 rounded-xl border border-outline-variant/40 hover:bg-red-50 hover:text-red-700 text-xs font-bold text-outline transition-all"
              >
                무시
              </button>
            </>
          )}

          {handoffStatus === 'hold' && (
            <button
              onClick={() => onStatusChanged(id, 'candidate')}
              className="px-3.5 py-2.5 rounded-xl border border-outline-variant/40 hover:bg-surface-container-low/40 text-xs font-bold text-outline transition-all"
            >
              검토 해제
            </button>
          )}

          {handoffStatus === 'ignored' && (
            <button
              onClick={() => onStatusChanged(id, 'candidate')}
              className="px-3.5 py-2.5 rounded-xl border border-outline-variant/40 hover:bg-surface-container-low/40 text-xs font-bold text-outline transition-all"
            >
              검토 복원
            </button>
          )}

          {/* Main Action Toss Button */}
          {handoffStatus !== 'sent_to_antigravity' && handoffStatus !== 'applied' && (
            <button
              onClick={handleToss}
              disabled={tossing}
              className="bg-primary text-on-primary px-5 py-2.5 rounded-xl font-bold hover:brightness-105 active:scale-98 disabled:opacity-50 transition-all shadow-md flex items-center gap-1.5 text-xs"
            >
              {tossing ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-on-primary border-t-transparent rounded-full animate-spin"></div>
                  토스 중...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[16px]">send</span>
                  안티에게 토스
                </>
              )}
            </button>
          )}

          {handoffStatus === 'sent_to_antigravity' && (
            <button
              onClick={() => onStatusChanged(id, 'applied')}
              className="bg-green-700 text-white px-5 py-2.5 rounded-xl font-bold hover:brightness-105 active:scale-98 transition-all shadow-md flex items-center gap-1.5 text-xs"
            >
              <span className="material-symbols-outlined text-[16px]">check</span>
              반영 완료 확인
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
