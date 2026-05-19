// 그룹 App-in-App Shell의 Presence Bar (하단 고정 바) — antigravity.txt 1:1
'use client';

import React from 'react';
import { Member } from '@/types/group';
import { Users } from 'lucide-react';

interface GroupShellFooterProps {
  members: Member[];
  liveSessionCount: number;
  newPostCount: number;
}

export default function GroupShellFooter({ members, liveSessionCount, newPostCount }: GroupShellFooterProps) {
  const sortedWithAvatar = [...members]
    .filter(m => m.avatar || m.photoURL)
    .sort((a, b) => {
      const getSeconds = (joined: any) => {
        if (!joined) return 0;
        if (typeof joined.seconds === 'number') return joined.seconds;
        if (joined instanceof Date) return Math.floor(joined.getTime() / 1000);
        if (typeof joined === 'number') return Math.floor(joined / 1000);
        if (typeof joined.toDate === 'function') return Math.floor(joined.toDate().getTime() / 1000);
        return 0;
      };
      return getSeconds(b.joinedAt) - getSeconds(a.joinedAt);
    });

  const recentMembers = sortedWithAvatar.slice(0, 3);
  const remainingCount = Math.max(0, members.length - recentMembers.length);

  return (
    <div className="presence-bar" style={{ background: 'var(--palette-gradient)' }}>
      {/* Section 1: Members */}
      <div className="flex items-center gap-3 shrink-0">
        <Users className="w-7 h-7 text-white/90" strokeWidth={2} />
        <div className="flex flex-col items-start justify-center">
          <span className="text-[22px] font-bold text-white leading-none mb-0.5">{members.length}</span>
          <span className="text-[12px] font-medium text-white/70 leading-none">members</span>
        </div>
      </div>

      {/* Divider */}
      <div className="w-px h-8 bg-white/20 shrink-0" />

      {/* Section 2: Active Users (Avatars) */}
      <div className="flex items-center -space-x-2 shrink-0">
        {recentMembers.map((m, i) => {
          const avatarSrc = m.avatar || m.photoURL;
          return (
            <div key={m.id || i} className="w-11 h-11 rounded-full border-[1.5px] border-white bg-white overflow-hidden shrink-0 relative">
              {avatarSrc ? (
                <img
                  src={avatarSrc}
                  alt={m.name || ''}
                  className="w-full h-full object-cover"
                />
              ) : null}
            </div>
          );
        })}
        {remainingCount > 0 && (
          <div className="w-11 h-11 rounded-full border-[1.5px] border-white/60 bg-white/20 backdrop-blur-md flex items-center justify-center text-white text-[14px] font-bold shrink-0 relative">
            +{remainingCount}
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="w-px h-8 bg-white/20 shrink-0" />

      {/* Section 3: Ticker / Event */}
      <div className="flex items-center gap-4 flex-1 overflow-hidden pl-2">
        <div className="w-2.5 h-2.5 rounded-full bg-[#FF6B6B] shrink-0 shadow-[0_0_8px_rgba(255,107,107,0.6)]" />
        <div className="flex flex-col items-start overflow-hidden">
          <span className="text-[17px] font-bold text-white truncate w-full leading-tight mb-0.5">Lucy Milonga tonight</span>
          <div className="flex items-center gap-2 text-[13px] font-medium text-white/80 leading-none">
            <span>7:40 PM</span>
            <span className="text-[10px] opacity-60">•</span>
            <span>DJ : Alex</span>
          </div>
        </div>
      </div>
    </div>
  );
}
