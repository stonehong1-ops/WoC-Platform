'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ReactionType } from '@/types/feed';

interface ReactionSelectorProps {
  onSelect: (type: ReactionType) => void;
  onClose: () => void;
}

const REACTION_OPTIONS: { type: ReactionType; emoji: string; label: string }[] = [
  { type: 'LIKE', emoji: '❤️', label: '좋아요' },
  { type: 'LOVE', emoji: '👍', label: '최고예요' },
  { type: 'FIRE', emoji: '🔥', label: '불타오르네' },
  { type: 'HAHA', emoji: '😂', label: '웃겨요' },
  { type: 'WOW', emoji: '😮', label: '놀라워요' },
  { type: 'SAD', emoji: '😢', label: '슬퍼요' },
];

export default function ReactionSelector({ onSelect, onClose }: ReactionSelectorProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.9 }}
      className="absolute bottom-full left-0 mb-2 z-[60]"
    >
      <div className="bg-surface-container-highest/90 backdrop-blur-xl border border-outline-variant/20 rounded-full px-2 py-1.5 shadow-2xl flex items-center gap-1">
        {REACTION_OPTIONS.map((option, index) => (
          <motion.button
            key={option.type}
            whileHover={{ scale: 1.3, y: -5 }}
            whileTap={{ scale: 0.9 }}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ 
              opacity: 1, 
              scale: 1,
              transition: { delay: index * 0.05 }
            }}
            onClick={(e) => {
              e.stopPropagation();
              onSelect(option.type);
            }}
            className="w-10 h-10 flex items-center justify-center text-2xl hover:bg-surface-container-high rounded-full transition-colors relative group"
            title={option.label}
          >
            <span>{option.emoji}</span>
            <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-on-surface text-surface text-[10px] px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none font-bold">
              {option.label}
            </span>
          </motion.button>
        ))}
      </div>
      
      {/* Triangle pointer */}
      <div className="absolute left-6 top-full -translate-y-px w-4 h-2 overflow-hidden">
        <div className="w-2 h-2 bg-surface-container-highest/90 border-r border-b border-outline-variant/20 rotate-45 mx-auto" />
      </div>
    </motion.div>
  );
}
