// 그룹 App-in-App Shell의 Presence Bar (하단 고정 바) — 실시간 데이터 바인딩
'use client';

import React, { useState, useEffect } from 'react';
import { Member, Group } from '@/types/group';
import { Users } from 'lucide-react';
import { useGroupFooterEvents } from '@/hooks/useGroupFooterEvents';
import { useAuth } from '@/components/providers/AuthProvider';
import { useLanguage } from '@/contexts/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';

interface GroupShellFooterProps {
  members: Member[];
  group: Group;
  onMembersClick?: () => void;
  onChatClick?: () => void;
  onDashboardClick?: () => void;
}

export default function GroupShellFooter({
  members,
  group,
  onMembersClick,
  onChatClick,
  onDashboardClick,
}: GroupShellFooterProps) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { events, recentVisitors, onlineCount, isInitialLoading } = useGroupFooterEvents(
    group.id,
    members,
    group.venueId,
    user?.uid
  );

  // 다국어 로케일 파서 헬퍼
  const getLocalizedEvent = (ev: any) => {
    const type = ev.type;
    const title = ev.title || '';
    const text = ev.text || '';

    if (type === 'class') {
      return {
        title: title === 'Upcoming Class' ? t('group.footer.upcoming_class') || '예정된 클래스 일정' : title,
        text: text
      };
    }
    if (type === 'milonga') {
      let localTitle = title;
      if (title.endsWith('tonight')) {
        localTitle = title.replace('tonight', t('group.footer.tonight') || '오늘 밤');
      } else if (title.endsWith('tomorrow')) {
        localTitle = title.replace('tomorrow', t('group.footer.tomorrow') || '내일');
      } else if (title.includes('on ')) {
        const dowMap: Record<string, string> = {
          'on Sun': t('days.SUN') || '일요일',
          'on Mon': t('days.MON') || '월요일',
          'on Tue': t('days.TUE') || '화요일',
          'on Wed': t('days.WED') || '수요일',
          'on Thu': t('days.THU') || '목요일',
          'on Fri': t('days.FRI') || '금요일',
          'on Sat': t('days.SAT') || '토요일'
        };
        Object.keys(dowMap).forEach(key => {
          if (title.includes(key)) {
            localTitle = title.replace(key, `${dowMap[key]}에`);
          }
        });
      }
      return { title: localTitle, text: text };
    }
    if (type === 'people_new') {
      const match = title.match(/^(\d+)\s+new\s+member(s?)\s+(.*)$/);
      if (match) {
        const count = match[1];
        const period = match[3];
        const localPeriod = period === 'today' ? t('group.footer.today') || '오늘' 
          : period === 'this week' ? t('group.footer.this_week') || '이번 주' 
          : t('group.footer.this_month') || '이번 달';
        return {
          title: t('group.footer.new_members_count', { count, period: localPeriod }) || `${localPeriod}에 ${count}명의 신규 멤버 가입`,
          text: text
        };
      }
    }
    if (type === 'people_recent') {
      const match = title.match(/^(.*)\s+joined\s+(.*)$/);
      if (match) {
        const name = match[1];
        const period = match[2];
        const localPeriod = period === 'today' ? t('group.footer.today') || '오늘' 
          : period === 'this week' ? t('group.footer.this_week') || '이번 주' 
          : t('group.footer.this_month') || '이번 달';
        return {
          title: t('group.footer.recent_joined', { name, period: localPeriod }) || `${name}님 ${localPeriod} 가입함`,
          text: text === 'follower' ? t('group.about.follower') || '팔로워' : text === 'leader' ? t('group.about.leader') || '리더' : text
        };
      }
    }
    if (type === 'chat') {
      const unreadMatch = title.match(/^(\d+)\s+unread\s+chat(s?)$/);
      if (unreadMatch) {
        const count = unreadMatch[1];
        return {
          title: t('group.footer.unread_chats', { count }) || `${count}개의 읽지 않은 대화`,
          text: text
        };
      }
      const newMatch = title.match(/^(\d+)\s+new\s+chat(s?)\s+(.*)$/);
      if (newMatch) {
        const count = newMatch[1];
        const period = newMatch[3];
        const localPeriod = period === 'today' ? t('group.footer.today') || '오늘' 
          : period === 'this week' ? t('group.footer.this_week') || '이번 주' 
          : t('group.footer.this_month') || '이번 달';
        return {
          title: t('group.footer.new_chats_count', { count, period: localPeriod }) || `${localPeriod}에 ${count}개의 새로운 대화`,
          text: text
        };
      }
    }
    if (type === 'feed') {
      const match = title.match(/^(\d+)\s+new\s+feed(s?)\s+(.*)$/);
      if (match) {
        const count = match[1];
        const period = match[3];
        const localPeriod = period === 'today' ? t('group.footer.today') || '오늘' 
          : period === 'this week' ? t('group.footer.this_week') || '이번 주' 
          : t('group.footer.this_month') || '이번 달';
        return {
          title: t('group.footer.new_feeds_count', { count, period: localPeriod }) || `${localPeriod}에 ${count}개의 신규 피드`,
          text: text
        };
      }
    }
    if (type === 'live') {
      const match = title.match(/^(\d+)\s+new\s+photo\/video(s?)\s+(.*)$/);
      if (match) {
        const count = match[1];
        const period = match[3];
        const localPeriod = period === 'today' ? t('group.footer.today') || '오늘' 
          : period === 'this week' ? t('group.footer.this_week') || '이번 주' 
          : t('group.footer.this_month') || '이번 달';
        return {
          title: t('group.footer.new_gallery_count', { count, period: localPeriod }) || `${localPeriod}에 ${count}개의 실시간 영상/사진`,
          text: text
        };
      }
    }
    if (type === 'class_update') {
      const match = title.match(/^(\d+)\s+new\s+class(es?)\s+updated$/);
      if (match) {
        const count = match[1];
        return {
          title: t('group.footer.new_classes_updated', { count }) || `${count}개의 새로운 클래스 등록됨`,
          text: text.includes('Join') ? t('group.footer.join_now') || '지금 참여해 보세요' : text
        };
      }
    }

    // Default Fallback
    if (title === 'Welcome to the group') {
      return {
        title: t('group.footer.welcome') || '그룹에 오신 것을 환영합니다',
        text: text
      };
    }

    return { title, text };
  };

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
      <style jsx>{`
        .skeleton-shimmer {
          background: linear-gradient(
            90deg,
            rgba(255, 255, 255, 0.13) 25%,
            rgba(255, 255, 255, 0.28) 37%,
            rgba(255, 255, 255, 0.13) 63%
          );
          background-size: 400% 100%;
          animation: shimmer-pulse 1.4s ease infinite;
        }
        @keyframes shimmer-pulse {
          0% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>

      <AnimatePresence mode="wait">
        {isInitialLoading ? (
          <motion.div
            key="footer-skeleton"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ width: '100%', display: 'flex', alignItems: 'center', height: '100%' }}
          >
            {/* Section 1: Members Skeleton */}
            <div className="presence-group" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0px', paddingRight: '4px', width: '50px', flexShrink: 0 }}>
              <div className="w-10 h-4 skeleton-shimmer rounded-md" />
              <div className="w-8 h-2 skeleton-shimmer rounded-md mt-1.5" />
            </div>

            {/* Divider */}
            <div style={{ width: '1px', height: '32px', background: 'rgba(255,255,255,0.2)', flexShrink: 0 }} />

            {/* Section 2: Active Users Skeleton */}
            <div className="presence-group" style={{ flexShrink: 0 }}>
              <div className="avatars" style={{ display: 'flex', alignItems: 'center' }}>
                {[1, 2, 3].map((i) => (
                  <div key={i} className="mini-avatar skeleton-shimmer" style={{ marginLeft: i > 1 ? '-16px' : '0', zIndex: 10 - i }} />
                ))}
              </div>
            </div>

            {/* Divider */}
            <div style={{ width: '1px', height: '32px', background: 'rgba(255,255,255,0.2)', flexShrink: 0 }} />

            {/* Section 3: Event Ticker Skeleton */}
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden', paddingLeft: '4px' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'rgba(255,255,255,0.4)', flexShrink: 0 }} />
              <div className="w-1/2 h-4 skeleton-shimmer rounded-md" />
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="footer-real-data"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            style={{ width: '100%', display: 'flex', alignItems: 'center', height: '100%' }}
          >
            {/* Section 1: Members */}
            <div
              className="presence-group cursor-pointer hover:opacity-80 transition-opacity"
              onClick={onMembersClick}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0px', paddingRight: '4px', flexShrink: 0 }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                <Users size={12} className="text-white/90" strokeWidth={2.5} />
                <span style={{ fontSize: '12px', fontWeight: '700', lineHeight: 1 }}>{members.length}</span>
              </div>
              <span style={{ fontSize: '9px', fontWeight: '500', color: 'rgba(255,255,255,0.7)', lineHeight: 1, marginTop: '2px' }}>members</span>
            </div>

            {/* Divider */}
            <div style={{ width: '1px', height: '32px', background: 'rgba(255,255,255,0.2)', flexShrink: 0 }} />

            {/* Section 2: Active Users (Avatars) */}
            <div 
              className="presence-group cursor-pointer hover:opacity-80 transition-opacity" 
              onClick={onChatClick} 
              style={{ 
                flexShrink: 0, 
                minWidth: '60px', 
                minHeight: '40px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                padding: '0 10px' 
              }}
            >
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
            <div
              className="cursor-pointer hover:opacity-90 transition-opacity"
              onClick={onDashboardClick}
              style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden', paddingLeft: '4px' }}
            >
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#FF6B6B', flexShrink: 0, boxShadow: '0 0 6px rgba(255,107,107,0.6)' }} />
              <div style={{ flex: 1, overflow: 'hidden', height: '34px', position: 'relative' }}>
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.5s ease-in-out',
                  transform: `translateY(-${currentEventIndex * 34}px)`
                }}>
                  {displayEvents.map((ev) => {
                    const localized = getLocalizedEvent(ev);
                    return (
                      <div key={ev.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center', height: '34px', flexShrink: 0, overflow: 'hidden' }}>
                        <span style={{ fontSize: '13px', fontWeight: '700', color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%', lineHeight: '1.1', marginBottom: '2px' }}>{localized.title}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: '500', lineHeight: '1' }}>
                          {ev.highlight && <span style={{ color: '#E5D686' }}>{ev.highlight}</span>}
                          {ev.highlight && localized.text && <span style={{ fontSize: '8px', color: 'rgba(255,255,255,0.5)' }}>•</span>}
                          {localized.text && <span style={{ color: 'rgba(255,255,255,0.7)' }}>{localized.text}</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
