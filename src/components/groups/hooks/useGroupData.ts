"use client";
// 그룹 내 실시간 데이터 구독 및 비즈니스 로직을 처리하는 커스텀 훅.

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Group, Member, Post } from "@/types/group";
import { useAuth } from "@/components/providers/AuthProvider";
import { useLanguage } from "@/contexts/LanguageContext";
import { format, isToday, isYesterday, addDays, startOfDay, addMonths, subMonths, parseISO } from "date-fns";
import { groupService } from "@/lib/firebase/groupService";
import { userService } from "@/lib/firebase/userService";
import { PlatformUser } from "@/types/user";
import { notificationService } from "@/lib/firebase/notificationService";
import { Notification } from "@/types/notification";
import { galleryService, GalleryPost } from "@/lib/firebase/galleryService";
import { socialService } from "@/lib/firebase/socialService";
import { feedService } from "@/lib/firebase/feedService";

export interface UseGroupDataProps {
  initialGroup: Group;
}

export function useGroupData({ initialGroup }: UseGroupDataProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { formatDate, formatRelativeTime } = useLanguage();
  const { user, profile } = useAuth();

  const [currentGroup, setCurrentGroup] = useState<Group>(initialGroup);
  const [members, setMembers] = useState<Member[]>([]);
  const [memberStatus, setMemberStatus] = useState<'active' | 'pending' | 'rejected' | 'none'>('none');
  const [noticePost, setNoticePost] = useState<Post | null>(null);
  const [moments, setMoments] = useState<GalleryPost[]>([]);
  const [upcomingCalEvents, setUpcomingCalEvents] = useState<any[]>([]);
  const [upcomingSocialEvents, setUpcomingSocialEvents] = useState<any[]>([]);
  const [upcomingClassEvents, setUpcomingClassEvents] = useState<any[]>([]);
  const [adminTodos, setAdminTodos] = useState<Notification[]>([]);
  const [recentFeedPosts, setRecentFeedPosts] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<PlatformUser[]>([]);
  
  const [isJoining, setIsJoining] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);

  // 실시간 그룹 메타데이터 연동
  useEffect(() => {
    if (!initialGroup.id) return;
    const unsubscribe = groupService.subscribeGroup(initialGroup.id, (updatedGroup) => {
      if (updatedGroup) {
        setCurrentGroup(updatedGroup);
      }
    });
    return () => unsubscribe();
  }, [initialGroup.id]);

  // 실시간 멤버 상태 확인
  useEffect(() => {
    if (!user || !currentGroup.id) {
      setMemberStatus('none');
      return;
    }

    const unsubscribe = groupService.subscribeMembers(currentGroup.id, (fetchedMembers) => {
      setMembers(fetchedMembers);
      const myMemberInfo = fetchedMembers.find(m => m.id === user.uid);
      if (myMemberInfo) {
        setMemberStatus(myMemberInfo.status || 'active');
      } else {
        setMemberStatus('none');
      }
    });

    return () => unsubscribe();
  }, [user, currentGroup.id]);

  // 안정화 유틸리티
  const ensureTimestamp = (val: any): number => {
    if (!val) return 0;
    if (typeof val === 'number') return val;
    if (val.toDate && typeof val.toDate === 'function') return val.toDate().getTime();
    if (val.seconds !== undefined) return val.seconds * 1000;
    const d = new Date(val);
    return isNaN(d.getTime()) ? 0 : d.getTime();
  };

  const safeFormat = (date: any, formatStr: string): string => {
    if (!date) return "";
    try {
      const ts = ensureTimestamp(date);
      if (ts === 0) return "";
      return formatDate(new Date(ts), formatStr);
    } catch (e) {
      return "";
    }
  };

  const safeFormatRelative = (date: any): string => {
    if (!date) return "";
    try {
      const ts = ensureTimestamp(date);
      if (ts === 0) return "";
      return formatRelativeTime(new Date(ts));
    } catch (e) {
      return "";
    }
  };

  const isPostNew = (date: any): boolean => {
    if (!date) return false;
    try {
      const ts = ensureTimestamp(date);
      if (ts === 0) return false;
      const d = new Date(ts);
      return isToday(d) || isYesterday(d);
    } catch (e) {
      return false;
    }
  };

  // 대시보드 데이터 연동 - Feed, Notice, Gallery
  useEffect(() => {
    if (!currentGroup.id) return;
    
    const unsubscribeFeed = feedService.subscribePosts(currentGroup.id, (posts) => {
      const normalized = posts.map(p => ({
        ...p,
        createdAt: ensureTimestamp(p.createdAt)
      }));
      setRecentFeedPosts(normalized.slice(0, 3));
    });

    const unsubscribePosts = groupService.subscribePosts(currentGroup.id, (posts) => {
      const normalized = posts.map(p => ({ ...p, createdAt: ensureTimestamp(p.createdAt) }));
      const notice = normalized.find(p => p.category?.toLowerCase() === 'notice') || normalized[0] || null;
      setNoticePost(notice);
    });

    const unsubscribeGallery = galleryService.subscribeFeed((galleryPosts) => {
      const normalizedGallery = galleryPosts.map(p => ({
        ...p,
        createdAt: ensureTimestamp(p.createdAt)
      }));
      setMoments(normalizedGallery.slice(0, 5));
    }, { entityType: 'group', entityId: currentGroup.id });

    return () => {
      unsubscribeFeed();
      unsubscribePosts();
      unsubscribeGallery();
    };
  }, [currentGroup.id]);

  // 대시보드 Schedule - Calendar Events
  useEffect(() => {
    if (!currentGroup.id) return;
    const unsubscribe = groupService.subscribeCalendarEvents(currentGroup.id, (calEvents) => {
      setUpcomingCalEvents(calEvents.map(e => ({
        ...e,
        startDate: ensureTimestamp(e.startDate),
        endDate: e.endDate ? ensureTimestamp(e.endDate) : ensureTimestamp(e.startDate)
      })));
    });
    return () => unsubscribe();
  }, [currentGroup.id]);

  // 대시보드 Schedule - Class Events
  useEffect(() => {
    if (!currentGroup.id) return;
    const unsubscribe = groupService.subscribeClasses(currentGroup.id, (fetchedClasses) => {
      const allClasses = [...(currentGroup.classes || []), ...fetchedClasses];
      const uniqueClasses = Array.from(new Map(allClasses.map(c => [c.id, c])).values());
      const classEvts: any[] = uniqueClasses.flatMap(cls =>
        (cls.schedule || []).map((sch: any, idx: number) => {
          let st = cls.startTime || '';
          let et = cls.endTime || '';
          if (sch.timeSlot) {
            const parts = sch.timeSlot.split('-');
            st = parts[0]?.trim() || st;
            et = parts[1]?.trim() || et;
          }
          const parsedDate = sch.date ? parseISO(sch.date) : new Date();
          return {
            id: `class-${cls.id}-${idx}`,
            title: cls.title,
            startDate: parsedDate.getTime(),
            endDate: parsedDate.getTime(),
            startTime: st,
            endTime: et,
            type: 'class',
          };
        })
      );
      setUpcomingClassEvents(classEvts);
    });
    return () => unsubscribe();
  }, [currentGroup.id, currentGroup.classes]);

  // 대시보드 Schedule - Social Events
  useEffect(() => {
    if (!currentGroup.venueId) return;
    const unsubscribe = socialService.subscribeSocialsByVenue(currentGroup.venueId, (fetchedSocials) => {
      const now = new Date();
      const startOfWindow = subMonths(now, 2);
      const endOfWindow = addMonths(now, 6);
      const socialAsEvents: any[] = [];
      fetchedSocials.forEach((s: any) => {
        if (s.type === 'regular' && s.dayOfWeek !== undefined) {
          let d = startOfDay(new Date(startOfWindow));
          while (d.getDay() !== Number(s.dayOfWeek)) d = addDays(d, 1);
          while (d <= endOfWindow) {
            socialAsEvents.push({
              id: `social-${s.id}-${format(d, 'yyyy-MM-dd')}`,
              title: s.title,
              startDate: d.getTime(),
              endDate: d.getTime(),
              startTime: s.startTime || '',
              endTime: s.endTime || '',
              type: s.title.toLowerCase().includes('milonga') || s.title.toLowerCase().includes('밀롱가') ? 'milonga' : 'social',
            });
            d = addDays(d, 7);
          }
        } else if (s.type === 'popup' && s.date) {
          const sDate = typeof s.date.toDate === 'function' ? s.date.toDate() : new Date(s.date);
          socialAsEvents.push({
            id: `social-${s.id}`,
            title: s.title,
            startDate: sDate.getTime(),
            endDate: sDate.getTime(),
            startTime: s.startTime || '',
            endTime: s.endTime || '',
            type: s.title.toLowerCase().includes('milonga') || s.title.toLowerCase().includes('밀롱가') ? 'milonga' : 'social',
          });
        }
      });
      setUpcomingSocialEvents(socialAsEvents);
    });
    return () => unsubscribe();
  }, [currentGroup.venueId]);

  // 3개 소스 병합 → 오늘 이후 일정만 정렬
  const upcomingEvents = useMemo(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const todayMs = today.getTime();
    return [...upcomingCalEvents, ...upcomingSocialEvents, ...upcomingClassEvents]
      .filter(e => (e.endDate ?? e.startDate) >= todayMs)
      .sort((a, b) => a.startDate - b.startDate)
      .slice(0, 10);
  }, [upcomingCalEvents, upcomingSocialEvents, upcomingClassEvents]);

  // 어드민 Todos 구독
  const admins = useMemo(() => {
    const adminMembers = members.filter(m => m.role === 'admin' || m.role === 'owner' || m.id === currentGroup.ownerId);
    if (adminMembers.length > 0) return adminMembers;
    if (currentGroup.representative) {
      return [{ id: 'rep', name: currentGroup.representative.name, avatar: currentGroup.representative.avatar, role: 'admin' }];
    }
    return [{ id: 'admin', name: 'Admin', avatar: '', role: 'admin' }];
  }, [members, currentGroup.ownerId, currentGroup.representative]);

  const currentAdmin = admins[0];

  const isAdminUser = useMemo(() => {
    if (profile?.isAdmin || profile?.systemRole === "admin") return true;
    return admins.some(a => a.id === user?.uid) || currentGroup.ownerId === user?.uid;
  }, [admins, user, currentGroup.ownerId, profile]);

  const isFullMember = memberStatus === 'active';
  const isLocked = currentGroup.isPublished === false && !isAdminUser;

  useEffect(() => {
    if (!user || !isAdminUser) return;

    const unsub = notificationService.subscribeToAdminTodos(user.uid, currentGroup.id, (todos) => {
      setAdminTodos(todos);
    });

    return () => unsub();
  }, [user, isAdminUser, currentGroup.id]);

  // 클레임 소유권 대기 사용자 로드
  useEffect(() => {
    if (!currentGroup.ownerId || currentGroup.ownerId === 'system1') {
      userService.getAllUsers().then(setAllUsers).catch(console.error);
    }
  }, [currentGroup.ownerId]);

  const handleClaimAdmin = async (targetUserId: string, targetUserName: string) => {
    if (!user) {
      toast.error("Sign-in required.", { description: "Redirecting to join request.", duration: 3000 });
      setTimeout(() => router.push(`${pathname}?modal=join`, { scroll: false }), 1000);
      return;
    }

    setIsClaiming(true);
    try {
      const targetUser = allUsers.find(u => u.id === targetUserId);
      const memberData = {
        name: targetUserName || profile?.nickname || user.displayName || 'Owner',
        avatar: targetUser?.photoURL || profile?.photoURL || user.photoURL || '',
      };

      await groupService.claimGroupAdmin(currentGroup.id, targetUserId, memberData);
      toast.success("Ownership claimed!", { description: `${targetUserName} is now the owner.` });
      
      window.location.reload();
    } catch (error) {
      console.error("Error claiming admin:", error);
      toast.error("An error occurred while claiming ownership.");
    } finally {
      setIsClaiming(false);
    }
  };

  const handleColorChange = async (color: string) => {
    try {
      await groupService.updateGroupMetadata(currentGroup.id, {
        headerThemeColor: color
      });
      toast.success("Theme updated", { duration: 1000 });
    } catch (error) {
      console.error("Error updating theme color:", error);
      toast.error("Failed to update theme");
    }
  };

  const handleJoinAction = async () => {
    if (!user) {
      toast.error("Sign-in required.");
      return;
    }

    const strategy = currentGroup.membershipPolicy?.joinStrategy || 'open';

    if (strategy === 'invite') {
      router.push(`${pathname}?modal=join`, { scroll: false });
      return;
    }

    setIsJoining(true);
    try {
      const memberData = {
        name: profile?.nickname || 'Anonymous',
        avatar: profile?.photoURL || '',
        role: 'member',
        joinedAt: Date.now()
      };

      if (strategy === 'open') {
        await groupService.joinGroup(currentGroup.id, user.uid, memberData);
        router.push(`${pathname}?modal=join`, { scroll: false });
      } else if (strategy === 'approval') {
        await groupService.requestJoinGroup(currentGroup.id, user.uid, memberData);
        router.push(`${pathname}?modal=join`, { scroll: false });
      }
    } catch (error) {
      console.error("Error joining currentGroup:", error);
      toast.error("An error occurred while joining.");
    } finally {
      setIsJoining(false);
    }
  };

  return {
    currentGroup,
    members,
    memberStatus,
    noticePost,
    moments,
    upcomingEvents,
    adminTodos,
    recentFeedPosts,
    allUsers,
    isJoining,
    isClaiming,
    admins,
    currentAdmin,
    isAdminUser,
    isFullMember,
    isLocked,
    ensureTimestamp,
    safeFormat,
    safeFormatRelative,
    isPostNew,
    handleClaimAdmin,
    handleColorChange,
    handleJoinAction
  };
}
