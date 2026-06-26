'use client';

import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

interface ThreadCardProps {
  thread: {
    threadId: string;
    title: string;
    type: 'analysis' | 'question' | 'mixed';
    status: 'active' | 'reported';
    previewText: string;
    mediaThumbUrl?: string;
    updatedAt: any;
  };
  onClick: () => void;
  onReportClick?: () => void;
  // Cache bust
}

export default function ThreadCard({ thread, onClick, onReportClick }: ThreadCardProps) {
  const { t } = useLanguage();

  const typeIcon = thread.type === 'analysis' ? 'image_search' : thread.type === 'question' ? 'chat' : 'forum';
  const typeLabel = thread.type === 'analysis' ? t('lesson.type_analysis') : thread.type === 'question' ? t('lesson.type_question') : t('lesson.type_mixed');
  const timeAgo = thread.updatedAt?.toDate ? formatTimeAgo(thread.updatedAt.toDate()) : '';

  return (
    <div
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3.5 bg-white hover:bg-slate-50/80 active:bg-slate-100 transition-all border-b border-slate-50 text-left cursor-pointer"
    >
      {/* Thumbnail or icon */}
      {thread.mediaThumbUrl ? (
        <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 border border-slate-100">
          <img src={thread.mediaThumbUrl} alt="" className="w-full h-full object-cover" />
        </div>
      ) : (
        <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center flex-shrink-0 border border-slate-100">
          <span className="material-symbols-outlined text-[22px] text-slate-400">{typeIcon}</span>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="text-[13px] font-bold text-slate-800 truncate">{thread.title}</span>
          {thread.status === 'reported' && (
            <span className="flex-shrink-0 px-1.5 py-0.5 rounded bg-green-50 text-green-600 text-[9px] font-bold">{t('lesson.reported')}</span>
          )}
        </div>
        <p className="text-[12px] text-slate-500 truncate leading-relaxed">{thread.previewText}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[10px] text-slate-400 font-medium">{typeLabel}</span>
          <span className="text-[10px] text-slate-300">·</span>
          <span className="text-[10px] text-slate-400">{timeAgo}</span>
        </div>
      </div>

      {/* Action buttons (Report icon button if reported) */}
      {thread.status === 'reported' && onReportClick && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onReportClick();
          }}
          className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center text-green-600 hover:bg-green-100 active:scale-95 transition-all flex-shrink-0"
        >
          <span className="material-symbols-outlined text-[18px]">assignment</span>
        </button>
      )}

      <span className="material-symbols-outlined text-[16px] text-slate-300 flex-shrink-0">chevron_right</span>
    </div>
  );
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diff < 60) return 'now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d`;
  return date.toLocaleDateString();
}
