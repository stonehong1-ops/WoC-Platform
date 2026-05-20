// 그룹 App-in-App Shell의 Presence Bar (하단 고정 바) — 실시간 데이터 바인딩
'use client';

import React, { useState, useEffect } from 'react';
import { Member, Group } from '@/types/group';
import { Users } from 'lucide-react';
import { useGroupFooterEvents } from '@/hooks/useGroupFooterEvents';
import { useAuth } from '@/components/providers/AuthProvider';

interface GroupShellFooterProps {
  members: Member[];
  group: Group;
}

export default function GroupShellFooter({ members, group }: GroupShellFooterProps) {
  const { user } = useAuth();
  const { events, recentVisitors, onlineCount } = useGroupFooterEvents(
    group.id,
    members,
    group.venueId,
    user?.uid
  );

  const [currentEventIndex, setCurrentEventIndex] = useState(0);
  const displayEvents = events.length > 0 ? events : [{ id: 0, type: 'class' as const, title: 'Welcome to the group', text: '' }];

  useEffect(() => {
    if (displayEvents.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentEventIndex((prev) => (prev + 1) % displayEvents.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [displayEvents.length]);

  // Reset index when events change
  useEffect(() => {
    setCurrentEventIndex(0);
  }, [events.length]);

  // Section 2: 실시간 방문자 or fallback to members sorted by joinedAt
  const avatarData = recentVisitors.length > 0
    ? recentVisitors
    : [...members]
        .filter(m => m.avatar || m.photoURL)
        .sort((a, b) => {
          const getS = (j: any) => {
            if (!j) return 0;
            if (typeof j.seconds === 'number') return j.seconds;
            if (typeof j === 'number') return Math.floor(j / 1000);
            if (typeof j.toDate === 'function') return Math.floor(j.toDate().getTime() / 1000);
            return 0;
          };
          return getS(b.joinedAt) - getS(a.joinedAt);
        })
        .slice(0, 3)
        .map(m => ({ id: m.id, photoURL: m.avatar || m.photoURL || '', name: m.name || '' }));

  return (
    <div className="presence-bar" style={{ background: 'var(--palette-gradient)' }}>
      {/* Section 1: Members */}
      <div className="presence-group" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0px', paddingRight: '4px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
          <Users size={12} className="text-white/90" strokeWidth={2.5} />
          <span style={{ fontSize: '12px', fontWeight: '700', lineHeight: 1 }}>{members.length}</span>
        </div>
        <span style={{ fontSize: '9px', fontWeight: '500', color: 'rgba(255,255,255,0.7)', lineHeight: 1, marginTop: '2px' }}>members</span>
      </div>

      {/* Divider */}
      <div style={{ width: '1px', height: '32px', background: 'rgba(255,255,255,0.2)', flexShrink: 0 }} />

      {/* Section 2: Active Users (Avatars) */}
      <div className="presence-group">
        <div className="avatars" style={{ display: 'flex', alignItems: 'center' }}>
          {avatarData.map((m, i) => (
            <div key={m.id || i} className="mini-avatar" style={{ marginLeft: i > 0 ? '-16px' : '0', zIndex: 10 - i }}>
              {m.photoURL ? (
                <img
                  src={m.photoURL}
                  alt={m.name || ''}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : null}
            </div>
          ))}
          {onlineCount > 0 && (
            <div
              style={{
                fontSize: '11px',
                fontWeight: '700',
                color: '#ffffff',
                marginLeft: avatarData.length > 0 ? '2px' : '0',
                zIndex: 10 - avatarData.length
              }}
            >
              +{onlineCount}
            </div>
          )}
        </div>
      </div>

      {/* Divider */}
      <div style={{ width: '1px', height: '32px', background: 'rgba(255,255,255,0.2)', flexShrink: 0 }} />

      {/* Section 3: Ticker / Event */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden', paddingLeft: '4px' }}>
        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#FF6B6B', flexShrink: 0, boxShadow: '0 0 6px rgba(255,107,107,0.6)' }} />
        <div style={{ flex: 1, overflow: 'hidden', height: '34px', position: 'relative' }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            transition: 'transform 0.5s ease-in-out',
            transform: `translateY(-${currentEventIndex * 34}px)`
          }}>
            {displayEvents.map((ev) => (
              <div key={ev.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center', height: '34px', flexShrink: 0, overflow: 'hidden' }}>
                <span style={{ fontSize: '13px', fontWeight: '700', color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%', lineHeight: '1.1', marginBottom: '2px' }}>{ev.title}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: '500', lineHeight: '1' }}>
                  {ev.highlight && <span style={{ color: '#E5D686' }}>{ev.highlight}</span>}
                  {ev.highlight && ev.text && <span style={{ fontSize: '8px', color: 'rgba(255,255,255,0.5)' }}>•</span>}
                  {ev.text && <span style={{ color: 'rgba(255,255,255,0.7)' }}>{ev.text}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
