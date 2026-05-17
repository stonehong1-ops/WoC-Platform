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
  LIKE: { emoji: '❤️', label: 'Like', color: 'text-red-500' },
  LOVE: { emoji: '👍', label: 'Love', color: 'text-blue-500' },
  FIRE: { emoji: '🔥', label: 'Fire', color: 'text-orange-500' },
  HAHA: { emoji: '😂', label: 'Haha', color: 'text-yellow-500' },
  WOW: { emoji: '😮', label: 'Wow', color: 'text-purple-500' },
  SAD: { emoji: '😢', label: 'Sad', color: 'text-gray-500' },
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
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Reactions" height="60vh">
      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar border-b border-outline-variant/10 mb-2">
        <button 
          onClick={() => setActiveTab('ALL')}
          className={`
            px-4 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap
            ${activeTab === 'ALL' ? 'bg-primary text-on-primary shadow-lg shadow-primary/20' : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'}
          `}
        >
          All {reactions.length}
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
            No reactions yet.
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
                Follow
              </button>
            </div>
          ))
        )}
      </div>
    </BottomSheet>
  );
}
