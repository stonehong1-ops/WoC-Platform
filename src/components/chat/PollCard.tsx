'use client';

import React, { useState, useEffect } from 'react';
import { chatService } from '@/lib/firebase/chatService';
import { ChatMessage } from '@/types/chat';
import { useAuth } from '@/components/providers/AuthProvider';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import { userService } from '@/lib/firebase/userService';

interface PollCardProps {
  message: ChatMessage;
}

// 투표한 참여자들의 닉네임을 비동기로 실시간 파싱 및 동기화하는 컴포넌트 (아이콘과 텍스트 없이 닉네임만 단독 노출)
function VoterList({ uids }: { uids: string[] }) {
  const { t } = useLanguage();
  const [voters, setVoters] = useState<{ id: string; nickname: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uids || uids.length === 0) {
      setLoading(false);
      return;
    }
    let active = true;
    const fetchVoters = async () => {
      try {
        const promises = uids.map(async (uid) => {
          const u = await userService.getUserById(uid);
          return {
            id: uid,
            nickname: u?.nickname || t('chatroom.unknown', '알수없음')
          };
        });
        const results = await Promise.all(promises);
        if (active) {
          setVoters(results);
        }
      } catch (e) {
        console.error("Error fetching voters:", e);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };
    fetchVoters();
    return () => { active = false; };
  }, [uids, t]);

  if (loading) return <span className="text-[10px] text-zinc-400/80 animate-pulse block mt-1 px-1">...</span>;
  if (voters.length === 0) return null;

  return (
    <div className="flex items-center gap-1 mt-1.5 px-1 flex-wrap select-none text-left w-full animate-in fade-in duration-200">
      <span className="text-[10.5px] font-extrabold text-zinc-500/90 leading-normal">
        {voters.map(v => v.nickname).join(', ')}
      </span>
    </div>
  );
}

export default function PollCard({ message }: PollCardProps) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);

  const metadata = message.metadata || {};
  const options = metadata.options || [];
  const votes = metadata.votes || {};
  const isClosed = metadata.isClosed || false;
  const allowMultiple = metadata.allowMultiple || false;

  const isOwn = message.senderId === user?.uid;

  // 총 득표수 계산
  const totalVotesCount = Object.values(votes).reduce((acc: number, uids: any) => {
    return acc + (Array.isArray(uids) ? uids.length : 0);
  }, 0);

  const handleVote = async (optionIndex: number) => {
    if (!user) {
      toast.error(t('chat.login_required', '로그인이 필요합니다.'));
      return;
    }
    if (isClosed) {
      toast.error(t('poll.closed_toast', '이미 마감된 투표입니다.'));
      return;
    }

    setLoading(true);
    try {
      await chatService.togglePollVote(message.id, optionIndex, user.uid);
      toast.success(t('poll.vote_success_toast', '투표가 반영되었습니다.'));
    } catch (err) {
      console.error("Error voting:", err);
      toast.error(t('poll.vote_failed_toast', '투표 처리에 실패했습니다.'));
    } finally {
      setLoading(false);
    }
  };

  const handleClosePoll = async () => {
    if (isClosed) return;
    setLoading(true);
    try {
      await chatService.closePoll(message.id);
      toast.success(t('poll.closed_success_toast', '투표가 마감되었습니다.'));
    } catch (err) {
      console.error("Error closing poll:", err);
      toast.error(t('poll.close_failed_toast', '투표 마감에 실패했습니다.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[340px] bg-white/95 border border-zinc-100 rounded-3xl p-5 shadow-md relative overflow-hidden transition-all duration-300 hover:shadow-lg my-2 animate-in zoom-in-95 duration-200">
      {/* Accent Bar (Golden-Amber instead of Blue) */}
      <div className={`absolute top-0 left-0 right-0 h-1.5 ${isClosed ? 'bg-zinc-400' : 'bg-amber-500'}`} />

      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className={`material-symbols-outlined text-[20px] ${isClosed ? 'text-zinc-400' : 'text-amber-500'}`}>
            how_to_vote
          </span>
          <span className="text-[11px] font-black uppercase tracking-widest text-zinc-400">
            {isClosed ? t('poll.status_closed', '종료된 투표') : t('poll.status_ongoing', '실시간 톡방 투표')}
          </span>
        </div>
        {allowMultiple && (
          <span className="text-[10px] font-bold px-2 py-0.5 bg-zinc-100 rounded-full text-zinc-500">
            {t('poll.multiple_choice', '복수 선택')}
          </span>
        )}
      </div>

      {/* Poll Title */}
      <div className="mb-4">
        <h4 className="text-[15px] font-extrabold text-zinc-800 leading-snug text-left">
          {message.text}
        </h4>
      </div>

      {/* Poll Options List */}
      <div className="space-y-3 mb-5">
        {options.map((option: string, idx: number) => {
          const optionVotes = votes[String(idx)] || [];
          const voteCount = optionVotes.length;
          const percentage = totalVotesCount > 0 ? Math.round((voteCount / totalVotesCount) * 100) : 0;
          const hasVoted = user ? optionVotes.includes(user.uid) : false;

          return (
            <button
              key={idx}
              disabled={loading || isClosed}
              onClick={() => handleVote(idx)}
              className={`w-full text-left relative overflow-hidden rounded-2xl border p-3 transition-all duration-300 flex items-center justify-between gap-3 group ${
                hasVoted
                  ? 'border-[#e2cc00]/45 bg-[#FEE500]/6'
                  : 'border-zinc-100 hover:border-zinc-200 bg-zinc-50/50'
              }`}
            >
              {/* Animated Progress Bar Background */}
              <div
                style={{ width: `${percentage}%` }}
                className={`absolute left-0 top-0 bottom-0 transition-all duration-500 opacity-15 pointer-events-none ${
                  hasVoted ? 'bg-[#FEE500]' : 'bg-zinc-400'
                }`}
              />

              {/* Option Text, Checkbox & Voter List */}
              <div className="flex items-start gap-2.5 z-10 relative flex-1 min-w-0">
                <span className={`material-symbols-outlined text-[18px] transition-colors shrink-0 mt-0.5 ${
                  hasVoted ? 'text-amber-500' : 'text-zinc-300 group-hover:text-zinc-400'
                }`}>
                  {hasVoted ? 'check_box' : 'check_box_outline_blank'}
                </span>
                <div className="flex-1 min-w-0 flex flex-col items-start">
                  <span className="text-[13px] font-bold text-zinc-700 whitespace-normal break-all leading-normal text-left">
                    {option}
                  </span>
                  {/* 투표 참여 멤버 닉네임 실시간 비동기 노출 */}
                  <VoterList uids={optionVotes} />
                </div>
              </div>

              {/* Vote Count & Percent */}
              <div className="flex items-center gap-2 z-10 relative shrink-0 self-start mt-0.5">
                <span className="text-[11px] font-medium text-zinc-400">
                  {voteCount}{t('chat.people_unit', '명')}
                </span>
                <span className="text-[12px] font-extrabold text-zinc-600">
                  {percentage}%
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Action Area */}
      <div className="flex flex-col gap-2">
        {/* Creator Close Button */}
        {isOwn && !isClosed && (
          <button
            onClick={handleClosePoll}
            disabled={loading}
            className="w-full py-3 bg-zinc-800 text-white rounded-2xl text-[13px] font-black hover:bg-zinc-900 transition-all duration-300 flex items-center justify-center gap-1.5 shadow-sm"
          >
            <span className="material-symbols-outlined text-[16px]">lock</span>
            {t('poll.close_action', '투표 조기 마감하기')}
          </button>
        )}

        {/* Closed Banner */}
        {isClosed && (
          <div className="w-full py-3 bg-zinc-100 border border-zinc-200/50 rounded-2xl text-[12px] font-bold text-zinc-500 flex items-center justify-center gap-1.5 select-none">
            <span className="material-symbols-outlined text-[16px]">verified</span>
            {t('poll.closed_desc', '의견 수렴이 마감된 투표입니다.')}
          </div>
        )}
      </div>
    </div>
  );
}
