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
      <div className="presence-group">
        <div className="presence-dot" />
        <div>{members.length} online</div>
      </div>

      {/* Section 2: Active Users (Avatars) */}
      <div className="presence-group avatars">
        {recentMembers.map((m, i) => {
          const avatarSrc = m.avatar || m.photoURL;
          return (
            <div key={m.id || i} className="mini-avatar">
              {avatarSrc ? (
                <img
                  src={avatarSrc}
                  alt={m.name || ''}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : null}
            </div>
          );
        })}
        {remainingCount > 0 && (
          <div 
            className="mini-avatar" 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              background: 'rgba(255,255,255,0.2)', 
              backdropFilter: 'blur(8px)',
              fontSize: '11px',
              fontWeight: '700',
              border: '2px solid rgba(255,255,255,0.4)',
              color: '#ffffff'
            }}
          >
            +{remainingCount}
          </div>
        )}
      </div>

      {/* Section 3: Live & New (Ticker Placeholder) */}
      <div className="presence-group">
        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
          radio_button_checked
        </span>
        0 Live
      </div>

      <div className="presence-group">
        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
          chat_bubble_outline
        </span>
        0 new
      </div>
    </div>
  );
}
