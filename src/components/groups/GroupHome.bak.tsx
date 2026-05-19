"use client";
// 그룹 홈 메인 컴포넌트 - 대시보드, 피드, 멤버, 설정 등 통합 관리

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

import { toast } from "sonner";

import { Group, Member, Post } from "@/types/group";
import { useAuth } from "@/components/providers/AuthProvider";
import { format, isToday, isYesterday, addDays, startOfDay, addMonths, subMonths, parseISO } from "date-fns";
import { groupService } from "@/lib/firebase/groupService";
import { userService } from "@/lib/firebase/userService";
import { PlatformUser } from "@/types/user";
import { notificationService } from "@/lib/firebase/notificationService";
import { Notification } from "@/types/notification";
import { galleryService, GalleryPost } from "@/lib/firebase/galleryService";
import { socialService } from "@/lib/firebase/socialService";
import { feedService } from "@/lib/firebase/feedService";
import ImageWithFallback from "@/components/common/ImageWithFallback";
import GroupJoinModal from "./GroupJoinModal";
import { useLanguage } from "@/contexts/LanguageContext";
import { useNavigation } from "@/components/providers/NavigationProvider";

import GroupAppShell from "./shell/GroupAppShell";
import { FUNCTION_TAB_MAP } from '@/constants/groupTabs';
import { useSearchParams, usePathname } from "next/navigation";

type TabType = 'home' | 'calendar' | 'feed' | 'board' | 'about' | 'class' | 'class-setting' | 'members' | 'settings' | 'shop' | 'stay' | 'rental' | 'coupon' | 'live' | 'brand' | 'polls' | 'qa' | 'broadcast' | 'attendance' | 'rules' | 'surveys' | 'anonymous' | 'classA' | 'classB' | 'classC' | 'homework' | 'studentReports' | 'tuition' | 'gradeSystem' | 'parentNotify' | 'parentConsult' | 'examScheduler' | 'ticketBooking' | 'workshopReg' | 'qrCheckin' | 'waitlist' | 'retreat' | 'eventStaff' | 'guestList' | 'productInventory' | 'membershipBilling' | 'donationSupport' | 'subscriptionPlans' | 'settlementReports' | 'mediaGallery' | 'videoLibrary' | 'editorialPage' | 'newsletter' | 'podcastFeed' | 'pressKit' | 'linkHub' | 'socialSync' | 'brandAssets' | 'customLandingPage' | 'taskManager' | 'internalWiki' | 'aiAssistant' | 'roles';

const GroupCalendar = dynamic(() => import("./GroupCalendar"));
const GroupBoard = dynamic(() => import("./GroupBoard"));

const GroupAbout = dynamic(() => import("./GroupAbout"));
const GroupClassEditor = dynamic(() => import("./GroupClassEditor"));
const GroupMemberManager = dynamic(() => import("./GroupMemberManager"));
const GroupMembers = dynamic(() => import("./GroupMembers"));
const MemberProfileOverlay = dynamic(() => import("./MemberProfileOverlay"));
const GroupFunctionBuilder = dynamic(() => import("./GroupFunctionBuilder"));

const UniversalFeed = dynamic(() => import("../feed/UniversalFeed"));
const ChatRoomComponent = dynamic(() => import("../chat/ChatRoom"));
const GroupShopEditor = dynamic(() => import("./GroupShopEditor"));
const GroupStayEditor = dynamic(() => import("./GroupStayEditor"));
const GroupRentalEditor = dynamic(() => import("./GroupRentalEditor"));


const GroupHomeConfig = dynamic(() => import("./GroupHomeConfig"));

const LiveFeed = dynamic(() => import("@/components/live/LiveFeed"));

const GroupClassDashboard = dynamic(() => import("./GroupClassDashboard"));

// Community module mockups
const GroupPolls = dynamic(() => import("./GroupPolls"));
const GroupQABoard = dynamic(() => import("./GroupQABoard"));
const GroupBroadcastCenter = dynamic(() => import("./GroupBroadcastCenter"));
const GroupAttendance = dynamic(() => import("./GroupAttendance"));
const GroupRules = dynamic(() => import("./GroupRules"));
const GroupSurvey = dynamic(() => import("./GroupSurvey"));
const AnonymousBoard = dynamic(() => import("./AnonymousBoard"));

// Education module mockups
const ClassManagerA = dynamic(() => import("./ClassManagerA"));
const ClassManagerB = dynamic(() => import("./ClassManagerB"));
const ClassManagerC = dynamic(() => import("./ClassManagerC"));
const HomeworkTracker = dynamic(() => import("./HomeworkTracker"));
const StudentReports = dynamic(() => import("./StudentReports"));
const TuitionManager = dynamic(() => import("./TuitionManager"));
const GradeSystem = dynamic(() => import("./GradeSystem"));
const ParentNotifications = dynamic(() => import("./ParentNotifications"));
const ParentConsultation = dynamic(() => import("./ParentConsultation"));
const ExamScheduler = dynamic(() => import("./ExamScheduler"));

// Events module mockups
const TicketBooking = dynamic(() => import("./TicketBooking"));
const WorkshopRegistration = dynamic(() => import("./WorkshopRegistration"));
const QRCheckIn = dynamic(() => import("./QRCheckIn"));
const WaitlistSystem = dynamic(() => import("./WaitlistSystem"));
const RetreatPlanner = dynamic(() => import("./RetreatPlanner"));
const EventStaffManager = dynamic(() => import("./EventStaffManager"));
const GuestListManager = dynamic(() => import("./GuestListManager"));

// Operations module mockups
const TaskManager = dynamic(() => import("./TaskManager"));
const InternalWiki = dynamic(() => import("./InternalWiki"));

// AI & Intelligence module mockups
const AIAssistant = dynamic(() => import("./AIAssistant"));

// Commerce module mockups
const ProductInventory = dynamic(() => import("./ProductInventory"));
const MembershipBilling = dynamic(() => import("./MembershipBilling"));
const DonationSupport = dynamic(() => import("./DonationSupport"));
const SubscriptionPlans = dynamic(() => import("./SubscriptionPlans"));
const SettlementReports = dynamic(() => import("./SettlementReports"));

// Brand & Media module mockups
const MediaGallery = dynamic(() => import("./MediaGallery"));
const VideoLibrary = dynamic(() => import("./VideoLibrary"));
const EditorialPage = dynamic(() => import("./EditorialPage"));
const Newsletter = dynamic(() => import("./Newsletter"));
const PodcastFeed = dynamic(() => import("./PodcastFeed"));
const PressKit = dynamic(() => import("./PressKit"));
const LinkHub = dynamic(() => import("./LinkHub"));
const SocialSync = dynamic(() => import("./SocialSync"));
const BrandAssets = dynamic(() => import("./BrandAssets"));
const CustomLandingPage = dynamic(() => import("./CustomLandingPage"));

const PALETTE_COLORS = [
  "#0057bd", // WoC Blue
  "#1a1c23", // Dark
  "#2d3436", // Slate
  "#636e72", // Steel
  "#b2bec3", // Silver
  "#d63031", // Ruby
  "#e17055", // Coral
  "#fdcb6e", // Amber
  "#00b894", // Emerald
  "#00cec9", // Turquoise
  "#0984e3", // Azure
  "#6c5ce7", // Iris
  "#a29bfe", // Lavender
  "#e84393", // Fuchsia
  "#fd79a8", // Rose
];

export default function GroupHome({ group: initialGroup, isModal, onClose }: { group: Group, isModal?: boolean, onClose?: () => void }) {
  const router = useRouter();
  const { t, formatDate, formatRelativeTime } = useLanguage();
  const { user, profile } = useAuth();
  const { setGlobalNavHidden } = useNavigation();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [isJoining, setIsJoining] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>(() => (searchParams.get('tab') as TabType) || 'home');
  const [visitedTabs, setVisitedTabs] = useState<Set<TabType>>(new Set<TabType>(['home']));
  const [memberStatus, setMemberStatus] = useState<'active' | 'pending' | 'rejected' | 'none'>('none');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [currentGroup, setCurrentGroup] = useState<Group>(initialGroup);
  const [selectedMoment, setSelectedMoment] = useState<GalleryPost | null>(null);


  // [Step 2] 모달 제어를 Query String으로 전환
  const showGroupChat = searchParams.get('modal') === 'chat';
  const showJoinModal = searchParams.get('modal') === 'join';
  const isMomentViewerOpen = searchParams.get('modal') === 'moment';
  const isExitModalOpen = searchParams.get('modal') === 'exit';

  const handleGroupChatClose = () => {
    router.back();
  };
  const handleJoinModalClose = () => {
    router.back();
  };
  const handleMomentViewerClose = () => {
    setSelectedMoment(null);
    router.back();
  };

  // [Step 4] 안전한 Exit UX (Hybrid Trap + Exit Modal)
  const exitAttempted = useRef(false);
  const trapReady = useRef(false);

  // Trap 초기 셋업: active=true를 push하여 뒤로가기 1회분 방어벽 생성
  useEffect(() => {
    if (!searchParams.has('active') && !searchParams.has('modal')) {
      router.push(pathname + '?active=true', { scroll: false });
    }
  }, []);

  // Trap 준비 완료 감지 및 상태 리셋
  useEffect(() => {
    if (searchParams.has('active')) {
      trapReady.current = true;
      exitAttempted.current = false;
    }
  }, [searchParams]);

  // 이탈 감지: active도 modal도 없을 때 작동
  useEffect(() => {
    if (!trapReady.current) return;
    if (searchParams.has('active') || searchParams.has('modal')) return;

    if (!exitAttempted.current) {
      // 뒤로가기 1번째 → Exit 확인 모달을 히스토리에 태움
      exitAttempted.current = true;
      router.push(pathname + '?modal=exit', { scroll: false });
    } else {
      // 뒤로가기 2번째 → 실제 탈출
      if (onClose) {
        onClose();
      } else {
        router.replace('/groups');
      }
    }
  }, [searchParams]);

  // Stay: 트랩 복구 + 모달 닫기
  const handleStay = () => {
    exitAttempted.current = false;
    router.replace(pathname + '?active=true', { scroll: false });
  };

  // Leave: 그룹홈(/groups)으로 안전 이동
  const handleLeave = () => {
    // Next.js 라우터 상태에서 ?modal=exit, ?active=true를 지우기 위해 경로를 클리어
    if (onClose) {
      router.replace(pathname, { scroll: false });
      setTimeout(() => {
        onClose();
      }, 50);
    } else {
      router.replace('/groups', { scroll: false });
    }
  };


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

  useEffect(() => {
    setGlobalNavHidden(true);
    return () => setGlobalNavHidden(false);
  }, [setGlobalNavHidden]);



  // [Prefetch] Home 렌더 후 500ms 뒤에 그룹 활성 탭을 모두 프리마운트하여 탭 전환 깜빡임 제거
  useEffect(() => {
    const timer = setTimeout(() => {
      setVisitedTabs(prev => {
        const newSet = new Set(prev);
        // 기본 탭
        newSet.add('about' as TabType);
        // 그룹이 활성화한 기능 탭
        const selectedFns = initialGroup.selectedFunctions || [];
        selectedFns.forEach((fnId: string) => {
          const mapping = FUNCTION_TAB_MAP[fnId];
          if (mapping) newSet.add(mapping.id as TabType);
        });
        // 관리자 탭
        if (isAdminUser) {
          newSet.add('settings' as TabType);
          newSet.add('brand' as TabType);
          newSet.add('roles' as TabType);
        }
        return newSet;
      });
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  // ─── 디바이스 뒤로가기 중앙 모달 적용 완료 ───

  const handleExit = () => {
    // [Fix #5] 나갈 때 컨펌 제거 (Leave Group 누르면 바로 나가기)
    if (onClose) {
      onClose();
    } else if (isModal) {
      router.back();
    } else {
      router.push('/groups');
    }
  };

  // 데이터 바인딩용 상태
  const [members, setMembers] = useState<Member[]>([]);
  const [noticePost, setNoticePost] = useState<Post | null>(null);
  const [moments, setMoments] = useState<GalleryPost[]>([]);
  const [upcomingCalEvents, setUpcomingCalEvents] = useState<any[]>([]);
  const [upcomingSocialEvents, setUpcomingSocialEvents] = useState<any[]>([]);
  const [upcomingClassEvents, setUpcomingClassEvents] = useState<any[]>([]);
  const [adminTodos, setAdminTodos] = useState<Notification[]>([]);
  const [recentFeedPosts, setRecentFeedPosts] = useState<any[]>([]);



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

  // [Removed redundant gallery subscription - now handled in the main feed useEffect]

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

  // 대시보드 데이터 연동 - Feed
  useEffect(() => {
    if (!currentGroup.id) return;
    // Feed: feeds 컬렉션에서 group scope 게시물 구독 (UniversalFeed와 동일한 소스)
    const unsubscribeFeed = feedService.subscribePosts(currentGroup.id, (posts) => {
      const normalized = posts.map(p => ({
        ...p,
        createdAt: ensureTimestamp(p.createdAt)
      }));
      setRecentFeedPosts(normalized.slice(0, 3));
    });

    // Notice: group posts 컬렉션에서 공지 구독
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

  // 대시보드 Schedule - GroupCalendar와 동일한 3개 소스 구독
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
  const upcomingEvents = React.useMemo(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const todayMs = today.getTime();
    return [...upcomingCalEvents, ...upcomingSocialEvents, ...upcomingClassEvents]
      .filter(e => (e.endDate ?? e.startDate) >= todayMs)
      .sort((a, b) => a.startDate - b.startDate)
      .slice(0, 10);
  }, [upcomingCalEvents, upcomingSocialEvents, upcomingClassEvents]);



  const isFullMember = memberStatus === 'active';

  const [isClaiming, setIsClaiming] = useState(false);
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [allUsers, setAllUsers] = useState<PlatformUser[]>([]);
  const [claimOwnerName, setClaimOwnerName] = useState(profile?.nickname || user?.displayName || '');
  const [claimOwnerId, setClaimOwnerId] = useState(user?.uid || '');
  const [claimResults, setClaimResults] = useState<PlatformUser[]>([]);
  const [showClaimResults, setShowClaimResults] = useState(false);

  useEffect(() => {
    if (!currentGroup.ownerId || currentGroup.ownerId === 'system1') {
      userService.getAllUsers().then(setAllUsers).catch(console.error);
      setShowClaimModal(true);
    }
  }, [currentGroup.ownerId]);

  useEffect(() => {
    if (showClaimModal) {
      setClaimOwnerName(profile?.nickname || user?.displayName || '');
      setClaimOwnerId(user?.uid || '');
    }
  }, [showClaimModal, profile, user]);

  const admins = React.useMemo(() => {
    const adminMembers = members.filter(m => m.role === 'admin' || m.role === 'owner' || m.id === currentGroup.ownerId);
    if (adminMembers.length > 0) return adminMembers;
    if (currentGroup.representative) {
      return [{ id: 'rep', name: currentGroup.representative.name, avatar: currentGroup.representative.avatar, role: 'admin' }];
    }
    return [{ id: 'admin', name: 'Admin', avatar: '', role: 'admin' }];
  }, [members, currentGroup.ownerId, currentGroup.representative]);

  const currentAdmin = admins[0];

  const isAdminUser = React.useMemo(() => {
    if (profile?.isAdmin || profile?.systemRole === "admin") return true;
    return admins.some(a => a.id === user?.uid) || currentGroup.ownerId === user?.uid;
  }, [admins, user, currentGroup.ownerId, profile]);

  const isLocked = currentGroup.isPublished === false && !isAdminUser;

  useEffect(() => {
    if (!user || !isAdminUser) return;

    const unsub = notificationService.subscribeToAdminTodos(user.uid, currentGroup.id, (todos) => {
      setAdminTodos(todos);
    });

    return () => unsub();
  }, [user, isAdminUser, currentGroup.id]);

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
      setShowClaimModal(false);

      // Auto reload to refresh server component / permissions
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
        router.push(`${pathname}?modal=join`, { scroll: false }); // "환영합니다" 팝업
      } else if (strategy === 'approval') {
        await groupService.requestJoinGroup(currentGroup.id, user.uid, memberData);
        router.push(`${pathname}?modal=join`, { scroll: false }); // "신청 완료" 팝업
      }
    } catch (error) {
      console.error("Error joining currentGroup:", error);
      toast.error("An error occurred while joining.");
    } finally {
      setIsJoining(false);
    }
  };

  const handleTabClick = (tab: TabType) => {
    if (tab === 'settings' || tab === 'brand') {
      if (!isAdminUser) {
        toast(t('group.admin_only') || 'Admin only feature', { icon: '🔒' });
        return;
      }
    }

    if (tab === 'home' || tab === 'about' || tab === 'brand' || tab === 'settings') {
      setActiveTab(tab);
      setVisitedTabs(prev => { const newSet = new Set(prev); newSet.add(tab); return newSet; });
      const params = new URLSearchParams(searchParams.toString());
      if (tab === 'home') {
        params.delete('tab');
      } else {
        params.set('tab', tab);
      }
      const qs = params.toString();
      window.history.replaceState(null, '', pathname + (qs ? '?' + qs : ''));
      return;
    }

    // 그 외 메뉴는 정회원 또는 관리자만 가능
    if (!isFullMember && !isAdminUser) {
      toast(t('group.members_only') || 'Members only feature', { icon: '🔒' });
      return;
    }

    setActiveTab(tab);
    setVisitedTabs(prev => { const newSet = new Set(prev); newSet.add(tab); return newSet; });
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tab);
    const qs = params.toString();
    window.history.replaceState(null, '', pathname + (qs ? '?' + qs : ''));
  };

  return (
    <div className="bg-background text-on-background min-h-screen font-body relative pb-24 antialiased">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;700;800&family=Inter:wght@400;500;600;700&display=swap');
        
        .font-headline { font-family: 'Plus Jakarta Sans', sans-serif; }
        .font-body { font-family: 'Inter', sans-serif; }
        


        @keyframes bounce-subtle {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-4px); }
        }
        .animate-bounce-subtle {
            animation: bounce-subtle 2s ease-in-out infinite;
        }

        .hide-scrollbar::-webkit-scrollbar {
            display: none;
        }
        .hide-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
        }

        .moments-placeholder {
            background: linear-gradient(135deg, #e4e7ff 0%, #d6dbff 100%);
            display: flex;
            align-items: center;
            justify-content: center;
        }
      `}</style>





      {/* ===== NEW APP SHELL ===== */}
      <GroupAppShell
        group={currentGroup}
        activeTab={activeTab}
        onTabClick={handleTabClick}
        onExit={handleExit}
        isAdmin={isAdminUser}
        isFullMember={isFullMember}
        members={members}
        liveSessionCount={0}
        newPostCount={0}
        paletteColors={PALETTE_COLORS}
        currentColor={currentGroup.headerThemeColor || '#1a1c23'}
        onColorChange={handleColorChange}
      >
        <></>
      </GroupAppShell>



      {/* Main Content — Shell 활성 시 fixed 헤더 높이만큼 padding-top */}
      <main className="pt-[120px] md:pt-[176px] pb-12">
        {isLocked ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center mt-10">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-3xl text-slate-400">lock</span>
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">{t('group.unsetup.title') || 'This group has not been set up yet'}</h2>
            <p className="text-slate-500 mb-6 max-w-sm">
              {t('group.unsetup.desc') || 'If you are the admin of this community, please claim your rights and activate the group.'}
            </p>
            {(!currentGroup.ownerId || currentGroup.ownerId === 'system1') && (
              <button
                onClick={() => setShowClaimModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-xl transition-colors shadow-sm"
              >
                {t('group.unsetup.claim') || "It's mine."}
              </button>
            )}
          </div>
        ) : (
          <>


            <div className={`max-w-7xl mx-auto ${activeTab === 'feed' || activeTab === 'home' || activeTab === 'live' || activeTab === 'calendar' || activeTab === 'board' || activeTab === 'members' || activeTab === 'about' || activeTab === 'settings' || activeTab === 'brand' || activeTab === 'class-setting' ? 'px-0 md:px-0 mt-0 space-y-0 pb-0' : 'px-4 md:px-8 space-y-10 mt-6 pb-12'}`}>
              {visitedTabs.has('home') && (<div style={{ display: activeTab === 'home' ? 'block' : 'none' }}>

                <div className="flex flex-col gap-6 p-4">
                  {/* Admin Todo Section */}
                  {isAdminUser && adminTodos.length > 0 && (
                    <section>
                      <div className="bg-orange-50 rounded-xl p-4 border border-orange-200 relative overflow-hidden">
                        <h3 className="font-headline font-bold text-orange-800 mb-3 flex items-center gap-2 text-base">
                          <span className="material-symbols-outlined text-orange-600">notification_important</span> {t('home.actionRequired')}
                        </h3>
                        <div className="flex flex-col gap-2">
                          {adminTodos.map(todo => (
                            <div key={todo.id} className="bg-white rounded-lg p-3 border border-orange-100 flex items-center justify-between gap-3">
                              <div className="min-w-0">
                                <h4 className="font-bold text-on-surface text-sm truncate">{todo.title}</h4>
                                <p className="text-xs text-on-surface-variant mt-0.5 truncate">{todo.message}</p>
                              </div>
                              <button
                                onClick={() => { notificationService.markTodosAsCompletedByReference(todo.referenceId || todo.id); toast.success("Task completed"); }}
                                className="bg-orange-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg shrink-0"
                              >{t('home.done')}</button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </section>
                  )}

                  {/* Notice Board Section */}
                  <section>
                    <div className={`rounded-xl p-4 flex flex-col gap-4 relative ${isFullMember ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}`} style={{ backgroundColor: currentGroup.headerThemeColor ? `${currentGroup.headerThemeColor}18` : '#f3f3f6' }} onClick={() => handleTabClick('board')}>
                      {noticePost && isPostNew(noticePost.createdAt) && (
                        <div className="absolute -top-2 -right-1 bg-[#ff4444] text-white text-[11px] font-black px-2.5 py-1 rounded-lg shadow-[0_4px_12px_rgba(255,68,68,0.4)] z-10 animate-bounce-subtle">
                          NEW
                        </div>
                      )}
                      <div className="flex justify-between items-center">
                        <h4 className="font-body text-[12px] font-medium uppercase tracking-widest text-on-surface-variant">{t('home.notice')}</h4>
                        {!isFullMember && <span className="material-symbols-outlined text-[16px] text-outline">lock</span>}
                      </div>
                      <ul className="flex flex-col gap-3">
                        {noticePost ? (
                          <li className="flex flex-col gap-1 border-b border-outline/10 pb-3 last:border-0 last:pb-0">
                            <span className="font-body text-[16px] font-medium text-on-surface font-bold line-clamp-2">
                              {noticePost.title || noticePost.content?.substring(0, 50) || t('home.notice')}
                            </span>
                            <div className="flex justify-between items-center">
                              <span className="font-body text-[12px] font-medium text-primary">{noticePost.author?.name || 'Admin'}</span>
                              <span className="font-body text-[12px] font-medium text-outline">{safeFormatRelative(noticePost.createdAt)}</span>
                            </div>
                          </li>
                        ) : (
                          <li className="flex flex-col gap-1 border-b border-outline/10 pb-3 last:border-0 last:pb-0">
                            <span className="font-body text-[16px] font-medium text-on-surface font-bold">{t('home.welcomeCommunity')}</span>
                            <div className="flex justify-between items-center">
                              <span className="font-body text-[12px] font-medium text-primary">Admin</span>
                              <span className="font-body text-[12px] font-medium text-outline">{safeFormat(Date.now(), 'MMM d')}</span>
                            </div>
                          </li>
                        )}
                      </ul>
                    </div>
                  </section>

                  {/* GROUP CHAT Button */}
                  <section>
                    <div
                      className={`bg-white border border-outline/15 rounded-2xl p-4 flex items-center justify-between gap-4 ${isFullMember ? 'cursor-pointer active:scale-[0.98] transition-transform' : 'cursor-not-allowed opacity-60'}`}
                      onClick={() => { if (isFullMember) router.push(pathname + '?modal=chat', { scroll: false }); }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                          <span className="material-symbols-outlined text-[24px] text-slate-500" style={{ fontVariationSettings: "'FILL' 1" }}>chat</span>
                        </div>
                        <div>
                          <h3 className="font-headline text-[16px] font-bold text-on-surface">{t('home.groupChat')}</h3>
                          <p className="font-body text-[13px] text-on-surface-variant">{t('home.unreadMessages', { count: 0 })}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {!isFullMember && <span className="material-symbols-outlined text-[20px] text-outline">lock</span>}
                        <span className="material-symbols-outlined text-[24px] text-on-surface-variant">chevron_right</span>
                      </div>
                    </div>
                  </section>

                  {/* FEED Section */}
                  <section className="flex flex-col gap-[6px]">
                    <div className="flex items-center justify-between mb-2">
                      <h2 className="font-headline text-[18px] leading-[1.4] font-bold text-on-background">{t('home.feed')}</h2>
                      <span className="font-body text-[12px] font-medium text-primary cursor-pointer flex items-center" onClick={() => handleTabClick('feed')}>{t('home.viewAll')} <span className="material-symbols-outlined text-[14px]">chevron_right</span></span>
                    </div>
                    <div className="flex flex-col gap-3">
                      {recentFeedPosts.length > 0 ? (
                        recentFeedPosts.slice(0, 1).map((post, idx) => (
                          <div key={post.id || idx} className={`bg-surface-container-lowest border border-outline/15 rounded-xl p-4 flex justify-between items-center ${isFullMember ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}`} onClick={() => handleTabClick('feed')}>
                            <div className="flex gap-3 items-start flex-1 min-w-0">
                              {post.author?.avatar ? (
                                <img src={post.author.avatar} alt={post.author.name} className="w-10 h-10 rounded-full object-cover shrink-0 border border-outline/20" />
                              ) : (
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 font-bold ${idx === 0 ? 'bg-secondary-container text-on-secondary-container' : 'bg-tertiary-container text-on-tertiary-container'}`}>
                                  {(post.author?.name || 'U').substring(0, 2).toUpperCase()}
                                </div>
                              )}
                              <div className="min-w-0 flex-1">
                                <div className="flex items-baseline gap-2 mb-1">
                                  <span className="font-body text-[14px] font-semibold leading-[1.2] text-on-surface truncate">{post.author?.name || 'Anonymous'}</span>
                                  <span className="font-body text-[12px] font-medium leading-[1.2] text-outline shrink-0">{safeFormatRelative(post.createdAt)}</span>
                                </div>
                                <p className="font-body text-[16px] font-medium text-on-surface-variant italic truncate">
                                  {isPostNew(post.createdAt) && <span className="inline-block bg-primary text-white text-[10px] font-bold px-1.5 py-0.5 rounded-[4px] mr-1.5 align-middle -translate-y-[1px]">{t('home.new')}</span>}
                                  &quot;{post.content || post.title || '...'}&quot;
                                </p>
                              </div>
                            </div>
                            {!isFullMember && <span className="material-symbols-outlined text-[20px] text-outline shrink-0 ml-2">lock</span>}
                          </div>
                        ))
                      ) : (
                        <div className="bg-surface-container-lowest border border-outline/15 rounded-xl p-4 text-center">
                          <p className="font-body text-[16px] font-medium text-on-surface-variant">{t('home.noPosts')}</p>
                        </div>
                      )}
                    </div>
                  </section>

                  {/* SCHEDULE Section */}
                  <section className="flex flex-col gap-[6px]">
                    <div className="flex items-center justify-between mb-2">
                      <h2 className="font-headline text-[18px] leading-[1.4] font-bold text-on-background">{t('home.schedule')}</h2>
                      <div className="flex items-center gap-3">
                        {isFullMember ? (
                          <span className="font-body text-[12px] font-medium text-primary cursor-pointer flex items-center" onClick={() => handleTabClick('calendar')}>{t('home.viewAll')} <span className="material-symbols-outlined text-[14px]">chevron_right</span></span>
                        ) : (
                          <span className="font-body text-[12px] font-medium text-outline flex items-center cursor-not-allowed opacity-60"><span className="material-symbols-outlined text-[14px] mr-1">lock</span></span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-4">
                      {(() => {
                        const firstEvent = upcomingEvents[0];
                        const eventsToDisplay = firstEvent
                          ? upcomingEvents.filter(e => {
                            const d1 = new Date(e.startDate);
                            const d2 = new Date(firstEvent.startDate);
                            return d1.getFullYear() === d2.getFullYear() &&
                              d1.getMonth() === d2.getMonth() &&
                              d1.getDate() === d2.getDate();
                          })
                          : [];

                        if (eventsToDisplay.length === 0) {
                          return (
                            <div className="bg-surface-container-lowest border border-outline/15 rounded-xl p-6 text-center">
                              <span className="material-symbols-outlined text-outline/30 text-4xl mb-2">calendar_today</span>
                              <p className="font-body text-[15px] font-medium text-on-surface-variant">{t('home.noEvents')}</p>
                            </div>
                          );
                        }

                        return (
                          <div className="flex flex-col gap-8">
                            {eventsToDisplay.map((event, idx) => {
                              const isNow = event.startDate <= Date.now() && event.endDate >= Date.now();
                              const eventDate = safeFormat(event.startDate, 'MMM d (EEE)');
                              const prevEventDate = idx > 0 ? safeFormat(eventsToDisplay[idx - 1].startDate, 'MMM d (EEE)') : null;
                              const showDateHeader = eventDate !== prevEventDate;

                              const dotColorClass =
                                event.type === 'class' || event.type === 'Class' || event.type === 'practice' ? 'bg-[#ba1a1a]' :
                                  event.type === 'social' || event.type === 'Social' || event.type === 'milonga' ? 'bg-[#004190]' :
                                    'bg-[#765b00]';
                              const badgeColorClass =
                                event.type === 'class' || event.type === 'Class' || event.type === 'practice' ? 'bg-[#ba1a1a]/10 text-[#ba1a1a]' :
                                  event.type === 'social' || event.type === 'Social' || event.type === 'milonga' ? 'bg-[#004190]/10 text-[#004190]' :
                                    'bg-slate-200 text-slate-600';
                              const displayTime = event.startTime || safeFormat(event.startDate, 'HH:mm');

                              return (
                                <React.Fragment key={event.id}>
                                  {showDateHeader && (
                                    <div className="flex items-center gap-3 mb-1">
                                      <span className="text-[20px] font-black text-on-surface tracking-tight">
                                        {eventDate}
                                      </span>
                                      <div className="h-px flex-1 bg-outline/10"></div>
                                    </div>
                                  )}
                                  <div
                                    className={`flex items-start gap-4 relative ${isFullMember ? 'cursor-pointer active:scale-[0.98] transition-transform' : 'cursor-not-allowed opacity-80'}`}
                                    onClick={() => handleTabClick('calendar')}
                                  >
                                    <div className="flex flex-col items-center shrink-0 w-[52px] pt-1">
                                      <span className="text-[14px] font-bold text-on-surface-variant">{displayTime}</span>
                                      <div className={`w-1.5 h-1.5 rounded-full mt-2 ${dotColorClass} ${isNow ? 'animate-pulse ring-4 ring-red-500/20' : ''}`}></div>
                                    </div>

                                    <div className={`flex-1 bg-white p-4 rounded-2xl border shadow-sm transition-all hover:shadow-md ${isNow ? 'border-[#ba1a1a]/30 bg-[#ba1a1a]/5' : 'border-slate-100'}`}>
                                      <div className="flex justify-between items-start mb-2">
                                        <h4 className="text-[16px] font-bold text-[#242c51] leading-tight">{event.title}</h4>
                                        {isNow && (
                                          <span className="font-body text-[9px] font-black text-white bg-[#ba1a1a] px-2 py-0.5 rounded-full tracking-wider animate-pulse shrink-0">LIVE NOW</span>
                                        )}
                                      </div>
                                      <div className="flex flex-wrap gap-2">
                                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-black tracking-wide uppercase ${badgeColorClass}`}>
                                          {event.type?.toUpperCase() || 'EVENT'}
                                        </span>
                                        {(event.startTime || event.endTime) && (
                                          <div className="flex items-center gap-1 text-[11px] font-bold text-slate-400">
                                            <span className="material-symbols-outlined text-[13px]">schedule</span>
                                            {displayTime}{event.endTime ? ` – ${event.endTime}` : ''}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </React.Fragment>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </div>
                  </section>

                  {/* MOMENTS Section */}
                  <section className="flex flex-col gap-[6px]">
                    <div className="flex items-center justify-between mb-2">
                      <h2 className="font-headline text-[18px] leading-[1.4] font-bold text-on-background">{t('group.moments')}</h2>
                      <span className="font-body text-[12px] font-medium text-primary cursor-pointer flex items-center" onClick={() => handleTabClick('live')}>{t('group.moments.view_all')} <span className="material-symbols-outlined text-[14px]">chevron_right</span></span>
                    </div>
                    {moments.length > 0 ? (
                      <div className="grid grid-cols-2 gap-2" onClick={() => handleTabClick('live')}>
                        {moments.slice(0, 4).map((moment, idx) => (
                          <div
                            key={moment.id || idx}
                            className="relative aspect-square rounded-xl overflow-hidden bg-surface-container cursor-pointer active:scale-[0.97] transition-transform"
                          >
                            <ImageWithFallback src={moment.media?.[0] || ''} alt={moment.caption || "Moment"} className="absolute inset-0 w-full h-full object-cover" fallbackType="gallery" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                            <div className="absolute bottom-2 left-2 right-2">
                              <p className="font-body text-[12px] font-semibold text-white leading-tight drop-shadow-md line-clamp-1">{moment.caption || ''}</p>
                            </div>
                            {idx === 0 && (
                              <div className="absolute top-2 right-2 bg-black/40 backdrop-blur-md px-2 py-1 rounded-full flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-error animate-pulse"></span>
                                <span className="font-body text-[9px] font-bold text-white tracking-widest uppercase">{t('group.moments.live')}</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="relative w-full aspect-[21/9] rounded-2xl overflow-hidden shrink-0 bg-surface-container flex items-center justify-center border border-outline/10">
                        <div className="flex flex-col items-center gap-2 opacity-50">
                          <span className="material-symbols-outlined text-4xl">photo_camera</span>
                          <span className="font-body text-sm font-medium">{t('group.moments.no_moments')}</span>
                        </div>
                      </div>
                    )}
                  </section>

                </div>

              </div>)}

              {visitedTabs.has('about') && (<div style={{ display: activeTab === 'about' ? 'block' : 'none' }} className="px-4 py-4">

                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  {/* Hero Section — about 페이지 최상단 */}
                  <section className="relative w-full aspect-[16/9] bg-surface-container-high overflow-hidden rounded-2xl mb-4">
                    <ImageWithFallback
                      alt={currentGroup.name}
                      className="absolute inset-0 object-cover w-full h-full"
                      src={currentGroup.coverImage}
                      fallbackType="cover"
                      category={currentGroup.tags?.[0] || ''}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
                    <div className="absolute bottom-0 left-0 w-full px-6 py-6 flex flex-col gap-2">
                      <div className="font-body text-[18px] text-white font-bold tracking-tight drop-shadow-md flex items-center gap-3">
                        <span>{t('groups.member_count_label') || 'Members'} <span className="text-primary-fixed font-black">{currentGroup.memberCount || members.length || 0}</span></span>
                        <span className="w-1 h-1 rounded-full bg-white/30"></span>
                        <span className="text-white/80 text-[14px]">
                          {t('groups.new_members_label') || 'New this week'} <span className="text-white font-black">{members.filter(m => { const joined = (m as any).joinedAt; return joined && (Date.now() - (typeof joined === 'number' ? joined : new Date(joined).getTime())) < 7 * 24 * 60 * 60 * 1000; }).length}</span>
                        </span>
                      </div>
                      {(memberStatus === 'none' || memberStatus === 'rejected') && (
                        <button onClick={handleJoinAction} disabled={isJoining} className="bg-primary text-on-primary font-bold py-3 px-10 rounded-full shadow-xl hover:opacity-90 transition-all w-fit uppercase tracking-widest text-sm disabled:opacity-50 mt-2">
                          {isJoining ? 'Processing...' : 'Join Now'}
                        </button>
                      )}
                      {memberStatus === 'pending' && (
                        <button className="bg-amber-500 text-white font-bold py-3 px-10 rounded-full shadow-xl transition-all w-fit uppercase tracking-widest text-sm flex items-center gap-2 mt-2" onClick={() => router.push(pathname + '?modal=join', { scroll: false })}>
                          <span className="material-symbols-outlined text-sm">schedule</span>
                          Pending Approval
                        </button>
                      )}
                    </div>
                  </section>
                  <GroupAbout group={currentGroup} members={members} />
                </div>

              </div>)}

              {visitedTabs.has('members') && isFullMember && (<div style={{ display: activeTab === 'members' ? 'block' : 'none' }}>

                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 z-[100]">
                  <GroupMembers
                    members={members}
                    memberCount={currentGroup.memberCount}
                    onMemberClick={(member) => setSelectedMember(member)}
                    onClose={() => handleTabClick('home')}
                  />
                </div>

              </div>)}

              {visitedTabs.has('roles') && isFullMember && (<div style={{ display: activeTab === 'roles' ? 'block' : 'none' }}>

                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 w-full">
                  <GroupMemberManager group={currentGroup} />
                </div>

              </div>)}

              <AnimatePresence>
                {selectedMember && (
                  <MemberProfileOverlay
                    member={selectedMember}
                    onClose={() => setSelectedMember(null)}
                  />
                )}
              </AnimatePresence>

              {visitedTabs.has('live') && (<div style={{ display: activeTab === 'live' ? 'block' : 'none' }}>

                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 w-full h-[calc(100vh-104px)]">
                  <LiveFeed entityType="group" entityId={currentGroup.id} />
                </div>

              </div>)}

              {visitedTabs.has('calendar') && isFullMember && (<div style={{ display: activeTab === 'calendar' ? 'block' : 'none' }}>

                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <GroupCalendar group={currentGroup} />
                </div>

              </div>)}

              {visitedTabs.has('feed') && isFullMember && (<div style={{ display: activeTab === 'feed' ? 'block' : 'none' }}>

                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <UniversalFeed
                    context={{ scope: 'group', scopeId: currentGroup.id }}
                    currentUser={{
                      uid: user?.uid,
                      displayName: profile?.nickname || user?.displayName || 'Anonymous',
                      photoURL: profile?.photoURL || user?.photoURL || ''
                    }}
                  />
                </div>

              </div>)}

              {visitedTabs.has('class') && isFullMember && (<div style={{ display: activeTab === 'class' ? 'block' : 'none' }}>

                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 w-full">
                  <GroupClassDashboard
                    group={currentGroup}
                    onApplyClick={() => { }}
                  />
                </div>

              </div>)}

              {visitedTabs.has('class-setting') && isAdminUser && (<div style={{ display: activeTab === 'class-setting' ? 'block' : 'none' }}>

                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 w-full">
                  <GroupClassEditor group={currentGroup} isInline={true} />
                </div>

              </div>)}

              {visitedTabs.has('board') && isFullMember && (<div style={{ display: activeTab === 'board' ? 'block' : 'none' }}>

                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <GroupBoard group={currentGroup} isAdmin={isAdminUser} />
                </div>

              </div>)}

              {visitedTabs.has('stay') && isFullMember && (<div style={{ display: activeTab === 'stay' ? 'block' : 'none' }}>

                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 w-full">
                  <GroupStayEditor group={currentGroup} />
                </div>

              </div>)}

              {visitedTabs.has('shop') && isFullMember && (<div style={{ display: activeTab === 'shop' ? 'block' : 'none' }}>

                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 w-full">
                  <GroupShopEditor group={currentGroup} />
                </div>

              </div>)}

              {visitedTabs.has('rental') && isFullMember && (<div style={{ display: activeTab === 'rental' ? 'block' : 'none' }}>

                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 w-full">
                  <GroupRentalEditor group={currentGroup} />
                </div>

              </div>)}

              {visitedTabs.has('polls') && isFullMember && (<div style={{ display: activeTab === 'polls' ? 'block' : 'none' }}>

                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <GroupPolls />
                </div>

              </div>)}

              {visitedTabs.has('qa') && isFullMember && (<div style={{ display: activeTab === 'qa' ? 'block' : 'none' }}>

                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <GroupQABoard />
                </div>

              </div>)}

              {visitedTabs.has('broadcast') && isFullMember && (<div style={{ display: activeTab === 'broadcast' ? 'block' : 'none' }}>

                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <GroupBroadcastCenter members={members} />
                </div>

              </div>)}

              {visitedTabs.has('attendance') && isFullMember && (<div style={{ display: activeTab === 'attendance' ? 'block' : 'none' }}>

                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <GroupAttendance />
                </div>

              </div>)}

              {visitedTabs.has('rules') && (<div style={{ display: activeTab === 'rules' ? 'block' : 'none' }}>

                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <GroupRules />
                </div>

              </div>)}

              {visitedTabs.has('surveys') && isFullMember && (<div style={{ display: activeTab === 'surveys' ? 'block' : 'none' }}>

                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <GroupSurvey />
                </div>

              </div>)}

              {visitedTabs.has('anonymous') && isFullMember && (<div style={{ display: activeTab === 'anonymous' ? 'block' : 'none' }}>

                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <AnonymousBoard />
                </div>

              </div>)}

              {/* Education Modules */}
              {visitedTabs.has('classA') && isFullMember && (<div style={{ display: activeTab === 'classA' ? 'block' : 'none' }}>

                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <ClassManagerA />
                </div>

              </div>)}

              {visitedTabs.has('classB') && isFullMember && (<div style={{ display: activeTab === 'classB' ? 'block' : 'none' }}>

                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <ClassManagerB />
                </div>

              </div>)}

              {visitedTabs.has('classC') && isFullMember && (<div style={{ display: activeTab === 'classC' ? 'block' : 'none' }}>

                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <ClassManagerC />
                </div>

              </div>)}

              {visitedTabs.has('homework') && isFullMember && (<div style={{ display: activeTab === 'homework' ? 'block' : 'none' }}>

                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <HomeworkTracker />
                </div>

              </div>)}

              {visitedTabs.has('studentReports') && isFullMember && (<div style={{ display: activeTab === 'studentReports' ? 'block' : 'none' }}>

                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <StudentReports />
                </div>

              </div>)}

              {visitedTabs.has('tuition') && isFullMember && (<div style={{ display: activeTab === 'tuition' ? 'block' : 'none' }}>

                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <TuitionManager />
                </div>

              </div>)}

              {visitedTabs.has('gradeSystem') && isFullMember && (<div style={{ display: activeTab === 'gradeSystem' ? 'block' : 'none' }}>

                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <GradeSystem />
                </div>

              </div>)}

              {visitedTabs.has('parentNotify') && isFullMember && (<div style={{ display: activeTab === 'parentNotify' ? 'block' : 'none' }}>

                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <ParentNotifications />
                </div>

              </div>)}

              {visitedTabs.has('parentConsult') && isFullMember && (<div style={{ display: activeTab === 'parentConsult' ? 'block' : 'none' }}>

                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <ParentConsultation />
                </div>

              </div>)}

              {visitedTabs.has('examScheduler') && isFullMember && (<div style={{ display: activeTab === 'examScheduler' ? 'block' : 'none' }}>

                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <ExamScheduler />
                </div>

              </div>)}

              {/* Events Modules */}
              {visitedTabs.has('ticketBooking') && isFullMember && (<div style={{ display: activeTab === 'ticketBooking' ? 'block' : 'none' }}>

                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <TicketBooking />
                </div>

              </div>)}

              {visitedTabs.has('workshopReg') && isFullMember && (<div style={{ display: activeTab === 'workshopReg' ? 'block' : 'none' }}>

                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <WorkshopRegistration members={members} />
                </div>

              </div>)}

              {visitedTabs.has('qrCheckin') && isFullMember && (<div style={{ display: activeTab === 'qrCheckin' ? 'block' : 'none' }}>

                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <QRCheckIn />
                </div>

              </div>)}

              {visitedTabs.has('waitlist') && isFullMember && (<div style={{ display: activeTab === 'waitlist' ? 'block' : 'none' }}>

                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <WaitlistSystem />
                </div>

              </div>)}

              {visitedTabs.has('retreat') && isFullMember && (<div style={{ display: activeTab === 'retreat' ? 'block' : 'none' }}>

                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <RetreatPlanner members={members} />
                </div>

              </div>)}

              {visitedTabs.has('eventStaff') && isFullMember && (<div style={{ display: activeTab === 'eventStaff' ? 'block' : 'none' }}>

                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <EventStaffManager />
                </div>

              </div>)}

              {visitedTabs.has('guestList') && isFullMember && (<div style={{ display: activeTab === 'guestList' ? 'block' : 'none' }}>

                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <GuestListManager />
                </div>

              </div>)}

              {/* Commerce Modules */}
              {visitedTabs.has('productInventory') && isFullMember && (<div style={{ display: activeTab === 'productInventory' ? 'block' : 'none' }}>

                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <ProductInventory />
                </div>

              </div>)}

              {visitedTabs.has('membershipBilling') && isFullMember && (<div style={{ display: activeTab === 'membershipBilling' ? 'block' : 'none' }}>

                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <MembershipBilling />
                </div>

              </div>)}

              {visitedTabs.has('donationSupport') && isFullMember && (<div style={{ display: activeTab === 'donationSupport' ? 'block' : 'none' }}>

                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <DonationSupport />
                </div>

              </div>)}

              {visitedTabs.has('subscriptionPlans') && isFullMember && (<div style={{ display: activeTab === 'subscriptionPlans' ? 'block' : 'none' }}>

                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <SubscriptionPlans />
                </div>

              </div>)}

              {visitedTabs.has('settlementReports') && isFullMember && (<div style={{ display: activeTab === 'settlementReports' ? 'block' : 'none' }}>

                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <SettlementReports />
                </div>

              </div>)}

              {/* Brand & Media Modules */}
              {visitedTabs.has('mediaGallery') && isFullMember && (<div style={{ display: activeTab === 'mediaGallery' ? 'block' : 'none' }}>

                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <MediaGallery />
                </div>

              </div>)}

              {visitedTabs.has('videoLibrary') && isFullMember && (<div style={{ display: activeTab === 'videoLibrary' ? 'block' : 'none' }}>

                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <VideoLibrary />
                </div>

              </div>)}

              {visitedTabs.has('editorialPage') && isFullMember && (<div style={{ display: activeTab === 'editorialPage' ? 'block' : 'none' }}>

                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <EditorialPage members={members} />
                </div>

              </div>)}

              {visitedTabs.has('newsletter') && isFullMember && (<div style={{ display: activeTab === 'newsletter' ? 'block' : 'none' }}>

                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <Newsletter />
                </div>

              </div>)}

              {visitedTabs.has('podcastFeed') && isFullMember && (<div style={{ display: activeTab === 'podcastFeed' ? 'block' : 'none' }}>

                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <PodcastFeed />
                </div>

              </div>)}

              {visitedTabs.has('pressKit') && isFullMember && (<div style={{ display: activeTab === 'pressKit' ? 'block' : 'none' }}>

                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <PressKit />
                </div>

              </div>)}

              {visitedTabs.has('linkHub') && isFullMember && (<div style={{ display: activeTab === 'linkHub' ? 'block' : 'none' }}>

                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <LinkHub />
                </div>

              </div>)}

              {visitedTabs.has('socialSync') && isFullMember && (<div style={{ display: activeTab === 'socialSync' ? 'block' : 'none' }}>

                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <SocialSync />
                </div>

              </div>)}

              {visitedTabs.has('brandAssets') && isFullMember && (<div style={{ display: activeTab === 'brandAssets' ? 'block' : 'none' }}>

                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <BrandAssets />
                </div>

              </div>)}

              {visitedTabs.has('customLandingPage') && isFullMember && (<div style={{ display: activeTab === 'customLandingPage' ? 'block' : 'none' }}>

                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <CustomLandingPage />
                </div>

              </div>)}

              {/* Operations Modules */}
              {visitedTabs.has('taskManager') && isFullMember && (<div style={{ display: activeTab === 'taskManager' ? 'block' : 'none' }}>

                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <TaskManager />
                </div>

              </div>)}

              {visitedTabs.has('internalWiki') && isFullMember && (<div style={{ display: activeTab === 'internalWiki' ? 'block' : 'none' }}>

                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <InternalWiki />
                </div>

              </div>)}

              {/* AI Modules */}
              {visitedTabs.has('aiAssistant') && isFullMember && (<div style={{ display: activeTab === 'aiAssistant' ? 'block' : 'none' }}>

                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <AIAssistant />
                </div>

              </div>)}

              {/* Group Settings */}
              {visitedTabs.has('settings') && isAdminUser && (
                <div style={{ display: activeTab === 'settings' ? 'block' : 'none' }}>
                  <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <GroupFunctionBuilder
                      group={currentGroup}
                      onClose={() => {
                        setActiveTab('home');
                        const params = new URLSearchParams(searchParams.toString());
                        params.delete('tab');
                        const qs = params.toString();
                        window.history.replaceState(null, '', pathname + (qs ? '?' + qs : ''));
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Brand Settings */}
              {visitedTabs.has('brand') && isAdminUser && (
                <div style={{ display: activeTab === 'brand' ? 'block' : 'none' }}>
                  <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <GroupHomeConfig
                      group={currentGroup}
                      onClose={() => {
                        setActiveTab('home');
                        const params = new URLSearchParams(searchParams.toString());
                        params.delete('tab');
                        const qs = params.toString();
                        window.history.replaceState(null, '', pathname + (qs ? '?' + qs : ''));
                      }}
                      onSave={() => { }}
                    />
                  </div>
                </div>
              )}

            </div>
          </>
        )}
      </main>



      {/* Join Modal */}
      <GroupJoinModal
        isOpen={showJoinModal}
        onClose={handleJoinModalClose}
        groupName={currentGroup.name}
        adminName={currentGroup.representative?.name || 'Admin'}
        adminId={currentAdmin?.id || currentGroup.ownerId}
        strategy={currentGroup.membershipPolicy?.joinStrategy}
        onConfirm={() => {
          handleJoinModalClose();
          handleTabClick('home');
        }}
      />

      {/* Fullscreen Group Chat Overlay */}
      {showGroupChat && (
        <div className="fixed inset-0 z-[9999] bg-background flex flex-col">
          <ChatRoomComponent
            roomId={`group_${currentGroup.id}`}
            onBack={handleGroupChatClose}
          />
        </div>
      )}

      {/* Fullscreen Moment Viewer Overlay */}
      <AnimatePresence>
        {selectedMoment && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[10000] bg-black/95 flex flex-col items-center justify-center backdrop-blur-md"
          >
            {/* Header */}
            <div className="absolute top-0 left-0 right-0 p-6 flex items-center justify-between z-10 bg-gradient-to-b from-black/60 to-transparent">
              <div className="flex items-center gap-3">
                {selectedMoment.authorPhoto ? (
                  <img src={selectedMoment.authorPhoto} alt={selectedMoment.authorName} className="w-10 h-10 rounded-full border-2 border-white/20 object-cover shadow-lg" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm border-2 border-white/20 shadow-lg">
                    {(selectedMoment.authorName || 'U').substring(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="flex flex-col">
                  <span className="font-body text-[15px] font-bold text-white shadow-sm">{selectedMoment.authorName || 'User'}</span>
                  <span className="font-body text-[11px] font-medium text-white/60">{safeFormatRelative(selectedMoment.createdAt)}</span>
                </div>
              </div>
              <button
                onClick={handleMomentViewerClose}
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white backdrop-blur-md border border-white/10 active:scale-90 transition-transform"
              >
                <span className="material-symbols-outlined text-[24px]">close</span>
              </button>
            </div>

            {/* Media Content */}
            <div className="relative w-full h-full flex items-center justify-center p-4" onClick={handleMomentViewerClose}>
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="max-w-full max-h-full rounded-2xl overflow-hidden shadow-2xl shadow-black/50"
                onClick={(e) => e.stopPropagation()}
              >
                <ImageWithFallback
                  src={selectedMoment.media?.[0] || ''}
                  alt={selectedMoment.caption || "Fullscreen"}
                  className="max-w-full max-h-[80vh] object-contain"
                  fallbackType="gallery"
                />
              </motion.div>
            </div>

            {/* Caption & Info Bar */}
            {selectedMoment.caption && (
              <div className="absolute bottom-0 left-0 right-0 p-10 pb-16 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex flex-col items-center gap-4">
                <p className="font-body text-[16px] md:text-[18px] font-medium text-white text-center max-w-2xl mx-auto leading-relaxed drop-shadow-lg">
                  {selectedMoment.caption}
                </p>
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-1.5 text-white/80">
                    <span className="material-symbols-outlined text-[20px]">favorite</span>
                    <span className="text-[14px] font-bold">{(selectedMoment as any).likesCount || 0}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-white/80">
                    <span className="material-symbols-outlined text-[20px]">chat_bubble</span>
                    <span className="text-[14px] font-bold">{(selectedMoment as any).commentsCount || 0}</span>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Claim Ownership Modal */}
      {showClaimModal && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-auto overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
            {/* Modal Header */}
            <div className="px-6 pt-6 pb-4 border-b border-[#f2f4f4]">
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-lg font-black text-[#2d3435]">{"It's mine."}</h2>
                <button
                  onClick={() => setShowClaimModal(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors"
                >
                  <span className="material-symbols-rounded text-[#acb3b4] text-[20px]">close</span>
                </button>
              </div>
              <p className="text-xs text-[#acb3b4] font-medium">This club belongs to me. Claim ownership of this group.</p>
            </div>

            {/* Group Info */}
            <div className="px-6 py-4 bg-[#f8f9fa] flex items-center gap-3 border-b border-[#f2f4f4]">
              {currentGroup.coverImage ? (
                <img src={currentGroup.coverImage} className="w-10 h-10 rounded-xl object-cover" alt="" />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <span className="material-symbols-rounded text-primary text-[20px]">group</span>
                </div>
              )}
              <div>
                <p className="font-bold text-[#2d3435] text-sm">{currentGroup.name}</p>
                <p className="text-[11px] text-[#acb3b4] font-medium">No owner assigned</p>
              </div>
            </div>

            {/* Owner Search Input */}
            <div className="px-6 pt-5 pb-2">
              <label className="block text-[11px] font-bold text-[#acb3b4] uppercase tracking-wider mb-2">Owner</label>
              <div className="relative">
                <div className="relative flex items-center px-4 py-3 border border-[#e0e4e5] rounded-xl bg-[#f8f9fa] focus-within:bg-white focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                  <span className="material-symbols-rounded text-[#acb3b4] mr-2 text-[20px]">person_filled</span>
                  <input
                    value={claimOwnerName}
                    onChange={(e) => {
                      const val = e.target.value;
                      setClaimOwnerName(val);
                      setClaimOwnerId('');
                      if (val.length >= 1) {
                        const lower = val.toLowerCase();
                        const filtered = allUsers.filter(u =>
                          (u.nickname && u.nickname.toLowerCase().includes(lower)) ||
                          (u.nativeNickname && u.nativeNickname.includes(val))
                        );
                        setClaimResults(filtered.slice(0, 6));
                        setShowClaimResults(filtered.length > 0);
                      } else {
                        setShowClaimResults(false);
                        setClaimResults([]);
                      }
                    }}
                    onFocus={() => claimOwnerName.length >= 1 && setShowClaimResults(claimResults.length > 0)}
                    onBlur={() => setTimeout(() => setShowClaimResults(false), 200)}
                    className="flex-1 bg-transparent border-none p-0 focus:ring-0 text-sm font-bold text-[#2d3435] placeholder:text-[#acb3b4] outline-none"
                    placeholder="Search by nickname..."
                    type="text"
                  />
                  {claimOwnerId && (
                    <span className="material-symbols-rounded text-emerald-500 text-[18px]">check_circle</span>
                  )}
                </div>
                {showClaimResults && (
                  <div className="absolute top-full left-0 w-full mt-1 bg-white border border-[#e0e4e5] rounded-xl shadow-lg z-50 overflow-hidden">
                    {claimResults.map(u => (
                      <button
                        key={u.id}
                        onClick={() => {
                          setClaimOwnerName(u.nickname || u.nativeNickname || '');
                          setClaimOwnerId(u.id);
                          setShowClaimResults(false);
                        }}
                        className="w-full text-left px-4 py-3 hover:bg-[#f8f9fa] flex items-center gap-3 group transition-colors border-b border-[#f2f4f4] last:border-0"
                      >
                        <span className="material-symbols-rounded text-[#acb3b4] text-[18px]">person</span>
                        <div className="flex flex-col">
                          <p className="font-bold text-[#2d3435] text-sm group-hover:text-primary leading-tight">{u.nickname}</p>
                          {u.nativeNickname && <span className="text-[10px] text-[#acb3b4] font-medium leading-tight">{u.nativeNickname}</span>}
                        </div>
                        {u.id === user?.uid && (
                          <span className="ml-auto text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">Me</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {claimOwnerId && (
                <p className="text-[11px] text-emerald-600 font-bold mt-1.5 flex items-center gap-1">
                  <span className="material-symbols-rounded text-[14px]">check_circle</span>
                  Selected as owner
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="px-6 pb-6 pt-4 flex gap-2">
              <button
                onClick={() => setShowClaimModal(false)}
                className="flex-1 py-3 rounded-xl border border-[#e0e4e5] text-sm font-bold text-[#596061] hover:bg-[#f8f9fa] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!claimOwnerId) {
                    toast.error('Please select a user first.');
                    return;
                  }
                  handleClaimAdmin(claimOwnerId, claimOwnerName);
                }}
                disabled={isClaiming || !claimOwnerId}
                className="flex-1 py-3 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-colors disabled:opacity-50 shadow-sm"
              >
                {isClaiming ? 'Saving...' : "Claim Ownership"}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Exit Confirm Modal */}
      {isExitModalOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-auto overflow-hidden"
          >
            <div className="p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-rounded text-red-500 text-[24px]">logout</span>
              </div>
              <h2 className="text-lg font-black text-[#2d3435] mb-2">Leave Group</h2>
              <p className="text-sm text-[#596061] font-medium">Are you sure you want to leave this group?</p>
            </div>
            <div className="px-6 pb-6 pt-2 flex gap-3">
              <button
                onClick={handleStay}
                className="flex-1 py-3.5 rounded-xl border border-[#e0e4e5] text-sm font-bold text-[#596061] hover:bg-[#f8f9fa] transition-colors"
              >
                Stay
              </button>
              <button
                onClick={handleLeave}
                className="flex-1 py-3.5 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 transition-colors shadow-sm"
              >
                Leave
              </button>
            </div>
          </motion.div>
        </div>
      )}

    </div>
  );
}
