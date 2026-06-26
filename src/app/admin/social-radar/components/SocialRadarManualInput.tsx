import React, { useState } from 'react';
import { toast } from 'sonner';
import { socialRadarService } from '../lib/socialRadarService';
import { SocialRadarCandidate } from '../types';

interface SocialRadarManualInputProps {
  onCandidateAdded: (candidate: SocialRadarCandidate) => void;
}

export default function SocialRadarManualInput({ onCandidateAdded }: SocialRadarManualInputProps) {
  const [text, setText] = useState('');
  const [url, setUrl] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) {
      toast.error('분석할 탱고 공지 텍스트를 입력해 주세요.');
      return;
    }

    setAnalyzing(true);
    try {
      const candidate = await socialRadarService.analyzeText({ text, url });
      toast.success('AI 정보 추출 및 후보 분석이 완료되었습니다!');
      setText('');
      setUrl('');
      setExpanded(false);
      onCandidateAdded(candidate);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || '분석 중 오류가 발생하였습니다.');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-outline-variant/30 overflow-hidden transition-all">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-6 py-4 flex items-center justify-between font-bold text-on-surface bg-surface-container-lowest hover:bg-surface-container-low/20 transition-colors text-left"
      >
        <span className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-[20px]">psychology</span>
          수동 정보 수집 및 AI 분석 (Manual Text Parsing)
        </span>
        <span className="material-symbols-outlined text-outline text-[20px] transition-transform duration-200" style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
          expand_more
        </span>
      </button>

      {expanded && (
        <form onSubmit={handleAnalyze} className="p-6 border-t border-outline-variant/20 space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-outline font-bold uppercase tracking-wider">공지/게시글 본문 텍스트 (필수)</label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="여기에 페이스북, 인스타그램, 카카오톡 공지 등 수집한 탱고 소셜 본문 글을 붙여넣으세요. AI가 날짜, DJ, 장소, 시간대를 자동 추출합니다."
              className="w-full min-h-[160px] border border-outline-variant/50 rounded-xl p-3 bg-surface-container-lowest text-sm text-on-surface focus:ring-2 focus:ring-primary focus:outline-none transition-colors"
              disabled={analyzing}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-outline font-bold uppercase tracking-wider">출처 URL (선택)</label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://facebook.com/..."
              className="w-full border border-outline-variant/50 rounded-xl p-3 bg-surface-container-lowest text-sm text-on-surface focus:ring-2 focus:ring-primary focus:outline-none transition-colors"
              disabled={analyzing}
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={analyzing}
              className="bg-primary text-on-primary px-6 py-3 rounded-xl font-bold hover:brightness-105 active:scale-98 disabled:opacity-50 transition-all shadow-md flex items-center gap-2"
            >
              {analyzing ? (
                <>
                  <div className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin"></div>
                  분석 중...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">analytics</span>
                  AI 소셜 분석 실행
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
