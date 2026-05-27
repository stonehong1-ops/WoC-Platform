"use client";

// 그룹 Footer의 섹션2(방문자/온라인) + 섹션3(8개 이벤트 티커) 실시간 데이터를 구독하는 훅
import { useState, useEffect, useMemo } from 'react';
import { Member, GroupClass } from '@/types/group';
import { Social } from '@/types/social';
import { ChatRoom } from '@/types/chat';
import { Post } from '@/types/feed';
import { GalleryPost } from '@/lib/firebase/galleryService';
import { PlatformUser } from '@/types/user';
import { groupService } from '@/lib/firebase/groupService';
import { socialService } from '@/lib/firebase/socialService';
import { feedService } from '@/lib/firebase/feedService';
import { galleryService } from '@/lib/firebase/galleryService';
import { userService } from '@/lib/firebase/userService';

export interface FooterEvent {
  id: number;
  type: 'class' | 'milonga' | 'people_new' | 'people_recent' | 'chat' | 'feed' | 'live' | 'class_update';
  title: string;
  highlight?: string;
  text?: string;
}

export interface RecentVisitorInfo {
  id: string;
  photoURL: string;
  name: string;
}

// Firestore timestamp → millis
function toMillis(val: any): number {
  if (!val) return 0;
  if (typeof val === 'number') return val;
  if (typeof val.toMillis === 'function') return val.toMillis();
  if (typeof val.toDate === 'function') return val.toDate().getTime();
  if (val.seconds) return val.seconds * 1000;
  if (val instanceof Date) return val.getTime();
  return 0;
}

// today → this week → this month fallback
function periodInfo(items: any[], getTime: (i: any) => number) {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const weekStart = todayStart - now.getDay() * 86400000;
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

  const today = items.filter(i => getTime(i) >= todayStart);
  if (today.length > 0) return { count: today.length, period: 'today', list: today };
  const week = items.filter(i => getTime(i) >= weekStart);
  if (week.length > 0) return { count: week.length, period: 'this week', list: week };
  const month = items.filter(i => getTime(i) >= monthStart);
  return { count: month.length, period: 'this month', list: month };
}

// 이름 목록 (최대 3명, 이름만)
function nameList(items: { name?: string; nickname?: string; senderName?: string; authorName?: string }[], max = 3): string {
  const names = items.slice(0, max).map(i => {
    const n = i.name || i.nickname || i.senderName || i.authorName || '';
    return n.split(' ')[0] || n.substring(0, 6);
  }).filter(Boolean);
  if (items.length > max) names.push('...');
  return names.join(', ');
}

// Social 시간 레이블 (tonight / tomorrow / on Sun / Live Now!)
function socialTimeLabel(social: Social): string {
  const now = new Date();
  const todayDow = now.getDay();
  const sDow = social.dayOfWeek ?? -1;

  if (social.startTime && social.endTime && sDow === todayDow) {
    const [sh, sm] = social.startTime.split(':').map(Number);
    const [eh, em] = social.endTime.split(':').map(Number);
    const nowMin = now.getHours() * 60 + now.getMinutes();
    if (nowMin >= sh * 60 + (sm || 0) && nowMin <= eh * 60 + (em || 0)) return 'Live Now!';
  }
  if (sDow === todayDow) return 'tonight';
  if (sDow === (todayDow + 1) % 7) return 'tomorrow';
  return `on ${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][sDow] || 'TBD'}`;
}

// 가장 가까운 다음 일정이 있는 Social 찾기
function findNextSocial(socials: Social[]): Social | null {
  const now = new Date();
  const todayDow = now.getDay();
  let best: Social | null = null;
  let bestDist = 8;

  for (const s of socials) {
    if (s.dayOfWeek === undefined) continue;
    let dist = (s.dayOfWeek - todayDow + 7) % 7;
    if (dist === 0) {
      // 오늘인데 이미 끝난 이벤트는 7일 뒤로
      if (s.endTime) {
        const [eh, em] = s.endTime.split(':').map(Number);
        if (now.getHours() * 60 + now.getMinutes() > eh * 60 + (em || 0)) dist = 7;
      }
    }
    if (dist < bestDist) { bestDist = dist; best = s; }
  }
  return best;
}

export function useGroupFooterEvents(
  groupId: string,
  members: Member[],
  venueId?: string,
  userId?: string
) {
  // [개선] Warm Cache(프리패칭된 캐시)가 이미 전역에 존재한다면, 로딩 스켈레튼을 건너뛰고 0ms 즉시 렌더링하도록 초기 상태를 true로 설정
  const hasCache = useMemo(() => {
    if (!groupId) return false;
    const cachedG = groupService.getCachedGroup(groupId);
    const cachedM = groupService.getCachedMembers(groupId);
    return !!cachedG && !!cachedM;
  }, [groupId]);

  const [classes, setClasses] = useState<GroupClass[]>([]);
  const [socials, setSocials] = useState<Social[]>([]);
  const [chatRoom, setChatRoom] = useState<ChatRoom | null>(null);
  const [recentMsgs, setRecentMsgs] = useState<any[]>([]);
  const [feeds, setFeeds] = useState<Post[]>([]);
  const [gallery, setGallery] = useState<GalleryPost[]>([]);
  const [recentVisitors, setRecentVisitors] = useState<RecentVisitorInfo[]>([]);
  const [onlineCount, setOnlineCount] = useState(0);
  const [newestProfile, setNewestProfile] = useState<PlatformUser | null>(null);

  // Firestore 최초 데이터 로드 트래킹을 위한 플래그들
  const [classesLoaded, setClassesLoaded] = useState(hasCache);
  const [socialsLoaded, setSocialsLoaded] = useState(hasCache);
  const [chatLoaded, setChatLoaded] = useState(hasCache);
  const [feedsLoaded, setFeedsLoaded] = useState(hasCache);
  const [galleryLoaded, setGalleryLoaded] = useState(hasCache);
  const [visitorsLoaded, setVisitorsLoaded] = useState(hasCache);

  // 300ms 강제 로딩 제한 절대 타임아웃 쉴드 (최초 로드 체감 초고속화)
  const [timeoutExpired, setTimeoutExpired] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setTimeoutExpired(true);
      // 타임아웃 만료 시 모든 Loaded 플래그를 강제 해제하여 스켈레톤 무한 유지 원천 차단
      setClassesLoaded(true);
      setSocialsLoaded(true);
      setChatLoaded(true);
      setFeedsLoaded(true);
      setGalleryLoaded(true);
      setVisitorsLoaded(true);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  // 1. Subscribe to classes
  useEffect(() => {
    if (!groupId) return;
    const unsubscribe = groupService.subscribeClasses(groupId, (data) => {
      setClasses(data);
      setClassesLoaded(true);
    });
    return () => unsubscribe();
  }, [groupId]);

  // 2. Subscribe to socials by venue
  useEffect(() => {
    if (!venueId) {
      setSocialsLoaded(true);
      return;
    }
    const unsubscribe = socialService.subscribeSocialsByVenue(venueId, (data) => {
      setSocials(data);
      setSocialsLoaded(true);
    });
    return () => unsubscribe();
  }, [venueId]);

  // 3. Subscribe to group chat room
  useEffect(() => {
    if (!groupId) return;
    let unsub: (() => void) | undefined;
    Promise.all([
      import('firebase/firestore'),
      import('@/lib/firebase/clientApp')
    ]).then(([fs, { db }]) => {
      const q = fs.query(fs.collection(db, 'chat_rooms'), fs.where('linkedGroupId', '==', groupId));
      unsub = fs.onSnapshot(q, (snap) => {
        if (!snap.empty) setChatRoom({ id: snap.docs[0].id, ...snap.docs[0].data() } as ChatRoom);
        setChatLoaded(true);
      }, (err) => {
        console.warn("ChatRoom subscription blocked or failed:", err);
        setChatLoaded(true);
      });
    }).catch((err) => {
      console.warn("Dynamic import failed for chatRoom:", err);
      setChatLoaded(true);
    });
    return () => unsub?.();
  }, [groupId]);

  // 4. Subscribe to recent chat messages (sender names)
  useEffect(() => {
    if (!chatRoom?.id) return;
    let unsub: (() => void) | undefined;
    Promise.all([
      import('firebase/firestore'),
      import('@/lib/firebase/clientApp')
    ]).then(([fs, { db }]) => {
      const q = fs.query(
        fs.collection(db, 'chat_messages'),
        fs.where('roomId', '==', chatRoom.id),
        fs.orderBy('timestamp', 'desc'),
        fs.limit(20)
      );
      unsub = fs.onSnapshot(q, (snap) => {
        setRecentMsgs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      }, (err) => {
        console.warn("ChatMessages subscription failed but skipped:", err);
      });
    }).catch((err) => {
      console.warn("Dynamic import failed for chatMessages:", err);
    });
    return () => unsub?.();
  }, [chatRoom?.id]);

  // 5. Subscribe to feeds
  useEffect(() => {
    if (!groupId) return;
    const unsubscribe = feedService.subscribePosts(groupId, (data) => {
      setFeeds(data);
      setFeedsLoaded(true);
    });
    return () => unsubscribe();
  }, [groupId]);

  // 6. Subscribe to gallery/live
  useEffect(() => {
    if (!groupId) return;
    const unsubscribe = galleryService.subscribeFeed((data) => {
      setGallery(data);
      setGalleryLoaded(true);
    }, { entityType: 'group', entityId: groupId });
    return () => unsubscribe();
  }, [groupId]);

  // 7. Fetch member profiles → Section 2 (recent visitors + online count)
  const membersKey = members.map(m => `${m.id}_${m.status || ''}`).join(',');

  useEffect(() => {
    if (!members.length) {
      setVisitorsLoaded(true);
      return;
    }
    const active = members.filter(m => m.status === 'active');
    
    // 1안 적용: 데이터베이스 개별 조회를 전면 제거하고 메모리 내의 가입자 데이터를 즉시 가공하여 0ms 노출
    const sorted = [...active]
      .filter(m => m.avatar || m.photoURL)
      .sort((a, b) => toMillis(b.joinedAt) - toMillis(a.joinedAt));
    setRecentVisitors(sorted.slice(0, 3).map(m => ({
      id: m.id,
      photoURL: m.avatar || m.photoURL || '',
      name: m.name || m.id.substring(0, 6)
    })));

    setOnlineCount(0);
    setVisitorsLoaded(true);
  }, [membersKey]);

  // 8. Fetch newest member profile (for Event 4 - people_recent)
  // 1안 적용: 데이터베이스 추가 조회를 제거하고 메모리 내의 가입 멤버 정보를 즉시 매핑
  useEffect(() => {
    const active = members.filter(m => m.status === 'active');
    if (!active.length) return;
    const newest = [...active].sort((a, b) => toMillis(b.joinedAt) - toMillis(a.joinedAt))[0];
    if (!newest) return;

    setNewestProfile({
      id: newest.id,
      nickname: newest.name,
      role: newest.role,
      photoURL: newest.avatar || newest.photoURL || ''
    } as any);
  }, [membersKey]);

  // Combine all data into events
  const events = useMemo<FooterEvent[]>(() => {
    const result: FooterEvent[] = [];
    const activeMembers = members.filter(m => m.status === 'active');

    // E1. Class 일정 — 가장 가까운 Open 클래스
    const openClasses = classes.filter(c => c.status === 'Open');
    if (openClasses.length > 0) {
      const c = openClasses[0]; // 이미 createdAt desc로 정렬됨
      const instructorNames = (c.instructors || []).map(i => i.name).join(', ');
      result.push({
        id: 1, type: 'class',
        title: c.title || 'Upcoming Class',
        highlight: c.startTime || '',
        text: instructorNames || undefined
      });
    }

    // E2. 밀롱가 일정 — 가장 가까운 regular social
    const regulars = socials.filter(s => String(s.type).toLowerCase() === 'regular');
    const nextSocial = findNextSocial(regulars);
    if (nextSocial) {
      const timeLabel = socialTimeLabel(nextSocial);
      const djName = nextSocial.djName || nextSocial.organizerName || '';
      const cleanDjName = djName.replace(/^DJ\s*/i, '');
      result.push({
        id: 2, type: 'milonga',
        title: `${nextSocial.title} ${timeLabel}`,
        highlight: nextSocial.startTime || '',
        text: cleanDjName ? `* ${cleanDjName}` : undefined
      });
    }

    // E3. 피플1 — 신규 멤버 수
    const { count: newCount, period: newPeriod, list: newList } = periodInfo(
      activeMembers, m => toMillis(m.joinedAt)
    );
    if (newCount > 0) {
      result.push({
        id: 3, type: 'people_new',
        title: `${newCount} new member${newCount > 1 ? 's' : ''} ${newPeriod}`,
        text: nameList(newList)
      });
    }

    // E4. 피플2 — 최근 1명
    const newest = [...activeMembers].sort((a, b) => toMillis(b.joinedAt) - toMillis(a.joinedAt))[0];
    if (newest) {
      const joinMs = toMillis(newest.joinedAt);
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      const weekStart = todayStart - now.getDay() * 86400000;
      let joinPeriod = 'this month';
      if (joinMs >= todayStart) joinPeriod = 'today';
      else if (joinMs >= weekStart) joinPeriod = 'this week';

      // leader/follower: profile.role → gender fallback
      let danceRole = 'follower';
      if (newestProfile) {
        const r = newestProfile.role?.toLowerCase();
        if (r === 'leader' || r === 'follower') {
          danceRole = r;
        } else if (newestProfile.gender === 'male') {
          danceRole = 'leader';
        }
      }

      const nName = newest.name || '';
      const nNative = newestProfile?.nativeNickname || '';
      const displayName = nNative ? `${nName} ${nNative}` : nName;
      result.push({
        id: 4, type: 'people_recent',
        title: `${displayName} joined ${joinPeriod}`,
        text: danceRole
      });
    }

    // E5. 챗 알림
    const unread = userId && chatRoom?.unreadCounts ? (chatRoom.unreadCounts[userId] || 0) : 0;
    if (unread > 0) {
      // Unread chat
      const uniqueSenders = [...Array.from(new Map(recentMsgs.filter(m => m.senderId !== userId).map(m => [m.senderId, m])).values())];
      result.push({
        id: 5, type: 'chat',
        title: `${unread} unread chat${unread > 1 ? 's' : ''}`,
        text: nameList(uniqueSenders.map(s => ({ name: s.senderName })))
      });
    } else {
      // Fallback: new chats today/this week/this month
      const { count: chatCount, period: chatPeriod, list: chatList } = periodInfo(
        recentMsgs, m => toMillis(m.timestamp)
      );
      if (chatCount > 0) {
        const uniqueS = [...Array.from(new Map(chatList.map(m => [m.senderId, m])).values())];
        result.push({
          id: 5, type: 'chat',
          title: `${chatCount} new chat${chatCount > 1 ? 's' : ''} ${chatPeriod}`,
          text: nameList(uniqueS.map(s => ({ name: s.senderName })))
        });
      }
    }

    // E6. 피드 — new feeds
    const { count: feedCount, period: feedPeriod, list: feedList } = periodInfo(
      feeds, f => toMillis((f as any).createdAt)
    );
    if (feedCount > 0) {
      const uniqueAuthors = [...Array.from(new Map(feedList.map((f: any) => [f.authorId || f.author?.id, f])).values())];
      result.push({
        id: 6, type: 'feed',
        title: `${feedCount} new feed${feedCount > 1 ? 's' : ''} ${feedPeriod}`,
        text: nameList(uniqueAuthors.map((f: any) => ({ name: f.authorName || f.author?.name })))
      });
    }

    // E7. 라이브 — new photo/videos
    const { count: liveCount, period: livePeriod, list: liveList } = periodInfo(
      gallery, g => toMillis(g.createdAt)
    );
    if (liveCount > 0) {
      const uniqueAuthors = [...Array.from(new Map(liveList.map(g => [g.authorId, g])).values())];
      result.push({
        id: 7, type: 'live',
        title: `${liveCount} new photo/video${liveCount > 1 ? 's' : ''} ${livePeriod}`,
        text: nameList(uniqueAuthors.map(g => ({ name: g.authorName })))
      });
    }

    // E8. 클래스 업데이트
    if (openClasses.length > 0) {
      const now = new Date();
      const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
      const monthLabel = `${months[now.getMonth()]} ${now.getFullYear()}`;
      result.push({
        id: 8, type: 'class_update',
        title: `${openClasses.length} new class${openClasses.length > 1 ? 'es' : ''} updated`,
        text: `Join the ${monthLabel}`
      });
    }

    return result;
  }, [classes, socials, members, chatRoom, recentMsgs, feeds, gallery, newestProfile, userId]);

  // 모든 비동기 Firestore 정보의 초기 로드 상태를 결합하여 isInitialLoading 상태를 제공합니다.
  const isInitialLoading = useMemo(() => {
    // 300ms 타임아웃 만료 시 로딩 스켈레튼 강제 폭파 (최초 로드 체감 쾌속화)
    if (timeoutExpired) return false;

    const needClasses = !!groupId;
    const needSocials = !!venueId;
    const needFeeds = !!groupId;
    const needGallery = !!groupId;

    if (needClasses && !classesLoaded) return true;
    if (needSocials && !socialsLoaded) return true;
    if (needFeeds && !feedsLoaded) return true;
    if (needGallery && !galleryLoaded) return true;

    return false;
  }, [
    groupId,
    venueId,
    classesLoaded,
    socialsLoaded,
    feedsLoaded,
    galleryLoaded,
    timeoutExpired,
  ]);

  return { events, recentVisitors, onlineCount, isInitialLoading };
}
