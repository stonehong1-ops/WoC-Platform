'use client';

import React, { useState, useEffect } from 'react';
import BottomSheet from '../common/BottomSheet';
import { Post, Reaction, ReactionType } from '@/types/feed';
import { feedService } from '@/lib/firebase/feedService';

interface ReactionListBottomSheetProps {
  post: Post;
  isOpen: boolean;
  onClose: () => void;
}

const REACTION_INFO: Record<ReactionType, { emoji: string; label: string; color: string }> = {
  LIKE: { emoji: '❤️', label: '좋아요', color: 'text-red-500' },
  LOVE: { emoji: '👍', label: '최고예요', color: 'text-blue-500' },
  FIRE: { emoji: '🔥', label: '불타올르네', color: 'text-orange-500' },
  HAHA: { emoji: '😂', label: '웃겨요', color: 'text-yellow-500' },
  WOW: { emoji: '😮', label: '놀라워요', color: 'text-purple-500' },
  SAD: { emoji: '😢', label: '슬퍼요', color: 'text-gray-500' },
};

export default function ReactionListBottomSheet({ post, isOpen, onClose }: ReactionListBottomSheetProps) {
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [activeTab, setActiveTab] = useState<ReactionType | 'ALL'>('ALL');

  useEffect(() => {
    if (isOpen && post.id) {
      const unsubscribe = feedService.subscribeReactions(post.id, (fetchedReactions) => {
        setReactions(fetchedReactions);
      });
      return () => unsubscribe();
    }
  }, [isOpen, post.id]);

  const filteredReactions = activeTab === 'ALL' 
    ? reactions 
    : reactions.filter(r => r.type === activeTab);

  const counts = reactions.reduce((acc, curr) => {
    acc[curr.type] = (acc[curr.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const typesPresent = Object.keys(counts) as ReactionType[];

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="반응" height="60vh">
      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar border-b border-outline-variant/10 mb-2">
        <button 
          onClick={() => setActiveTab('ALL')}
          className={`
            px-4 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap
            ${activeTab === 'ALL' ? 'bg-primary text-on-primary shadow-lg shadow-primary/20' : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'}
          `}
        >
          전체 {reactions.length}
        </button>
        {typesPresent.map(type => (
          <button 
            key={type}
            onClick={() => setActiveTab(type)}
            className={`
              px-4 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap flex items-center gap-1.5
              ${activeTab === type ? 'bg-primary text-on-primary shadow-lg shadow-primary/20' : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'}
            `}
          >
            <span>{REACTION_INFO[type].emoji}</span>
            <span>{counts[type]}</span>
          </button>
        ))}
      </div>

      {/* List */}
      <div className="py-2">
        {filteredReactions.length === 0 ? (
          <div className="py-20 text-center text-on-surface-variant/50 italic text-sm">
            반응이 없습니다.
          </div>
        ) : (
          filteredReactions.map((reaction) => (
            <div key={reaction.userId} className="flex items-center justify-between py-3 border-b border-outline-variant/5 last:border-0">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img 
                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(reaction.userName)}&background=random`} 
                    alt={reaction.userName}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <span className="absolute -bottom-1 -right-1 text-base">{REACTION_INFO[reaction.type].emoji}</span>
                </div>
                <div className="flex items-baseline gap-1.5 flex-wrap">
                  <span className="font-bold text-on-surface text-sm">{reaction.userName}</span>
                  {reaction.userNameNative && <span className="text-[11px] font-medium text-on-surface-variant leading-tight">{reaction.userNameNative}</span>}
                </div>
              </div>
              <button className="px-4 py-1.5 rounded-full border border-outline-variant/30 text-xs font-bold text-on-surface-variant hover:bg-surface-container-high transition-colors">
                팔로우
              </button>
            </div>
          ))
        )}
      </div>
    </BottomSheet>
  );
}
