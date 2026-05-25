'use client';

import React, { useState } from 'react';
import { chatService } from '@/lib/firebase/chatService';
import { ChatMessage } from '@/types/chat';
import { useAuth } from '@/components/providers/AuthProvider';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';

interface PollCardProps {
  message: ChatMessage;
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
    <div className="w-full max-w-[340px] bg-white/95 border border-zinc-100 rounded-3xl p-5 shadow-md relative overflow-hidden transition-all duration-300 hover:shadow-lg my-2 dark:bg-zinc-900/90 dark:border-zinc-800 animate-in zoom-in-95 duration-200">
      {/* Accent Bar */}
      <div className={`absolute top-0 left-0 right-0 h-1.5 ${isClosed ? 'bg-zinc-400' : 'bg-primary'}`} />

      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className={`material-symbols-outlined text-[20px] ${isClosed ? 'text-zinc-400' : 'text-primary'}`}>
            how_to_vote
          </span>
          <span className="text-[11px] font-black uppercase tracking-widest text-zinc-400">
            {isClosed ? t('poll.status_closed', '종료된 투표') : t('poll.status_ongoing', '실시간 톡방 투표')}
          </span>
        </div>
        {allowMultiple && (
          <span className="text-[10px] font-bold px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded-full text-zinc-500">
            {t('poll.multiple_choice', '복수 선택')}
          </span>
        )}
      </div>

      {/* Poll Title */}
      <div className="mb-4">
        <h4 className="text-[15px] font-extrabold text-zinc-800 dark:text-zinc-100 leading-snug">
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
                  ? 'border-primary/40 bg-primary/5 dark:border-primary/30 dark:bg-primary/10'
                  : 'border-zinc-100 hover:border-zinc-200 dark:border-zinc-800 dark:hover:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/30'
              }`}
            >
              {/* Animated Progress Bar Background */}
              <div
                style={{ width: `${percentage}%` }}
                className={`absolute left-0 top-0 bottom-0 transition-all duration-500 opacity-15 pointer-events-none ${
                  hasVoted ? 'bg-primary' : 'bg-zinc-400 dark:bg-zinc-500'
                }`}
              />

              {/* Option Text and Checkbox */}
              <div className="flex items-center gap-2.5 z-10 relative">
                <span className={`material-symbols-outlined text-[18px] transition-colors ${
                  hasVoted ? 'text-primary' : 'text-zinc-300 group-hover:text-zinc-400'
                }`}>
                  {hasVoted ? 'check_box' : 'check_box_outline_blank'}
                </span>
                <span className="text-[13px] font-bold text-zinc-700 dark:text-zinc-300 truncate">
                  {option}
                </span>
              </div>

              {/* Vote Count & Percent */}
              <div className="flex items-center gap-2 z-10 relative shrink-0">
                <span className="text-[11px] font-medium text-zinc-400">
                  {voteCount}{t('chat.people_unit', '명')}
                </span>
                <span className="text-[12px] font-extrabold text-zinc-600 dark:text-zinc-400">
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
            className="w-full py-3 bg-zinc-800 text-white dark:bg-zinc-700 dark:hover:bg-zinc-600 rounded-2xl text-[13px] font-black hover:bg-zinc-900 transition-all duration-300 flex items-center justify-center gap-1.5 shadow-sm"
          >
            <span className="material-symbols-outlined text-[16px]">lock</span>
            {t('poll.close_action', '투표 조기 마감하기')}
          </button>
        )}

        {/* Closed Banner */}
        {isClosed && (
          <div className="w-full py-3 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/50 dark:border-zinc-700/50 rounded-2xl text-[12px] font-bold text-zinc-500 dark:text-zinc-400 flex items-center justify-center gap-1.5 select-none">
            <span className="material-symbols-outlined text-[16px]">verified</span>
            {t('poll.closed_desc', '의견 수렴이 마감된 투표입니다.')}
          </div>
        )}
      </div>
    </div>
  );
}
