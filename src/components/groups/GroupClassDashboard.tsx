import React, { useState, useEffect, useMemo } from 'react';
import { Group, Member, GroupClass, ClassDiscount, ClassRegistration } from '@/types/group';
import { chatService } from '@/lib/firebase/chatService';
import { groupService } from '@/lib/firebase/groupService';
import { useAuth } from '@/components/providers/AuthProvider';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/clientApp';
import { useRouter, usePathname } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import ImageWithFallback from '@/components/common/ImageWithFallback';
import { useModalNavigation } from '@/hooks/useModalNavigation';
import { classRegistrationService } from '@/lib/firebase/classRegistrationService';
import UserBadge from '@/components/common/UserBadge';
import { toast } from 'sonner';

interface GroupClassDashboardProps {
  group: Group;
  members: Member[];
  onApplyClick: (monthStr: string) => void;
  openClassFlow?: (flow: string, options?: any) => void;
}

const CURRENCY_SYMBOL: Record<string, string> = { KRW: '₩', USD: '$', EUR: '€' };
const getCurrencySymbol = (c: string) => CURRENCY_SYMBOL[c] || c + ' ';

export default function GroupClassDashboard({ group, members, onApplyClick, openClassFlow: propOpenClassFlow }: GroupClassDashboardProps) {
  const { t, language } = useLanguage();
  const { user, profile } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { openModal: localOpenClassFlow } = useModalNavigation('classFlow');
  const openClassFlow = propOpenClassFlow || localOpenClassFlow;

  const [currentDate, setCurrentDate] = useState<Date>(() => {
    const now = new Date();
    const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    if (!group?.classPaymentSettings?.openMonths || group.classPaymentSettings.openMonths.length === 0) {
      return now;
    }
    const openMonths = [...group.classPaymentSettings.openMonths].sort();
    if (openMonths.includes(currentMonthStr)) {
      return now;
    }
    const futureMonths = openMonths.filter(m => m > currentMonthStr);
    if (futureMonths.length > 0) {
      const [y, m] = futureMonths[0].split('-').map(Number);
      return new Date(y, m - 1, 1);
    }
    const [y, m] = openMonths[openMonths.length - 1].split('-').map(Number);
    return new Date(y, m - 1, 1);
  });

  useEffect(() => {
    const now = new Date();
    const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    if (group?.classPaymentSettings?.openMonths && group.classPaymentSettings.openMonths.length > 0) {
      const openMonths = [...group.classPaymentSettings.openMonths].sort();
      const currStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
      if (!openMonths.includes(currStr)) {
        if (openMonths.includes(currentMonthStr)) {
          setCurrentDate(now);
        } else {
          const futureMonths = openMonths.filter(m => m > currentMonthStr);
          if (futureMonths.length > 0) {
            const [y, m] = futureMonths[0].split('-').map(Number);
            setCurrentDate(new Date(y, m - 1, 1));
          } else {
            const [y, m] = openMonths[openMonths.length - 1].split('-').map(Number);
            setCurrentDate(new Date(y, m - 1, 1));
          }
        }
      }
    }
  }, [group?.classPaymentSettings?.openMonths]);

  // Firestore 하위 컬렉션에서 실시간 데이터 구독
  const [allClasses, setAllClasses] = useState<GroupClass[]>([]);
  const [allDiscounts, setAllDiscounts] = useState<ClassDiscount[]>([]);
  const [registrations, setRegistrations] = useState<ClassRegistration[]>([]);
  const [dashboardImageErrors, setDashboardImageErrors] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const unsubClasses = groupService.subscribeClasses(group.id, setAllClasses);
    const unsubDiscounts = groupService.subscribeDiscounts(group.id, setAllDiscounts);
    const unsubRegistrations = classRegistrationService.subscribeToGroupRegistrations(group.id, setRegistrations);
    return () => {
      unsubClasses();
      unsubDiscounts();
      unsubRegistrations();
    };
  }, [group.id]);

  const [activeTab, setActiveTab] = useState<'dashboard' | 'list' | 'registrations' | 'class_status'>('dashboard');
  const [viewMode, setViewMode] = useState<'personal' | 'byClass'>('personal');
  const { openModal: openDashboardClassModal, closeModal: closeDashboardClassModal, value: dashboardClassId } = useModalNavigation('dashboardClassId');
  const selectedDashboardClass = dashboardClassId;
  const [activeWeekIndex, setActiveWeekIndex] = useState<number>(0);



  const currentMonthStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;

  const monthClasses = useMemo(() => allClasses.filter(c => {
    if (c.targetMonth) return c.targetMonth === currentMonthStr;
    if (c.schedule?.length) return c.schedule.some(s => s.date?.startsWith(currentMonthStr));
    return false;
  }), [allClasses, currentMonthStr]);

  const dashboardClassDetails = useMemo<Record<string, { title: string; subtitle: string }>>(() => ({
    salsa_intermediate: {
      title: 'Salsa Intermediate',
      subtitle: language === 'KR' ? '이지은 & 박준호 • 월요일' : 'Jieun Lee & Junho Park • Mon'
    },
    bachata_basics: {
      title: 'Bachata Basics',
      subtitle: language === 'KR' ? '김민수 • 화요일' : 'Minsu Kim • Tue'
    },
    kizomba_101: {
      title: 'Kizomba 101',
      subtitle: language === 'KR' ? 'Sarah J. • 수요일' : 'Sarah J. • Wed'
    },
    urban_choreography: {
      title: 'Urban Choreography',
      subtitle: language === 'KR' ? '정태양 • 목요일' : 'Taeyang Jung • Thu'
    },
    contemporary: {
      title: 'Contemporary',
      subtitle: language === 'KR' ? '유하나 • 금요일' : 'Hana Yoo • Fri'
    },
    hip_hop_foundations: {
      title: 'Hip Hop Foundations',
      subtitle: language === 'KR' ? 'Mike Brown • 월요일' : 'Mike Brown • Mon'
    },
    jazz_funk: {
      title: 'Jazz Funk',
      subtitle: language === 'KR' ? '최수지 • 토요일' : 'Suzy Choi • Sat'
    },
    ballet_fitness: {
      title: 'Ballet Fitness',
      subtitle: language === 'KR' ? '박소연 • 일요일' : 'Soyeon Park • Sun'
    }
  }), [language]);

  // 클래스별 실시간 리더/팔로워 및 매칭도 집계
  const classRealtimeStats = useMemo(() => {
    const statsMap: Record<string, { leaders: number; followers: number; percent: number; membersList: any[] }> = {};
    
    // 월별 클래스들 초기화
    monthClasses.forEach(cls => {
      statsMap[cls.id] = { leaders: 0, followers: 0, percent: 100, membersList: [] };
    });

    // 신청 데이터 순회
    registrations.forEach(r => {
      if (r.status === 'CANCELED') return;
      
      const targetClassIds = r.selectedClassIds && r.selectedClassIds.length > 0 
        ? r.selectedClassIds 
        : [r.classId];

      targetClassIds.forEach(cid => {
        if (statsMap[cid]) {
          const role = r.role || 'Leader';
          if (role === 'Leader') {
            statsMap[cid].leaders += 1;
          } else if (role === 'Follower') {
            statsMap[cid].followers += 1;
          } else if (role === 'Couple') {
            statsMap[cid].leaders += 1;
            statsMap[cid].followers += 1;
          }
          statsMap[cid].membersList.push(r);
        }
      });
    });

    // 성비 매칭도 계산
    Object.keys(statsMap).forEach(cid => {
      const { leaders, followers } = statsMap[cid];
      if (leaders === 0 && followers === 0) {
        statsMap[cid].percent = 0;
      } else {
        const min = Math.min(leaders, followers);
        const max = Math.max(leaders, followers);
        statsMap[cid].percent = Math.round((min / max) * 100);
      }
    });

    return statsMap;
  }, [monthClasses, registrations]);

  // 일정 기반의 회차 진행 인디케이터 동적 렌더링
  const renderScheduleStatusDots = (cls: GroupClass) => {
    const dots: React.ReactNode[] = [];
    const now = new Date();
    
    const scheduleCount = Math.max(cls.schedule?.length || 0, 4);
    const sortedSched = cls.schedule ? [...cls.schedule].sort((a, b) => a.date.localeCompare(b.date)) : [];

    for (let i = 0; i < scheduleCount; i++) {
      const sched = sortedSched[i];
      if (!sched || !sched.date) {
        dots.push(
          <div key={i} className="w-5 h-5 rounded-full border border-outline-variant flex items-center justify-center">
            <span className="material-symbols-outlined text-[12px] text-outline-variant">play_arrow</span>
          </div>
        );
        continue;
      }

      const cleanDateStr = sched.date.replace(/\./g, '-');
      const schedDate = new Date(cleanDateStr);
      const isPast = schedDate < now;
      
      const isCurrent = !isPast && (i === 0 || new Date(sortedSched[i-1]?.date.replace(/\./g, '-')) < now);

      if (isPast) {
        dots.push(
          <div key={i} className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
            <span className="material-symbols-outlined text-[12px] text-on-primary icon-fill">play_arrow</span>
          </div>
        );
      } else if (isCurrent) {
        dots.push(
          <div key={i} className="w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center animate-pulse">
            <span className="material-symbols-outlined text-[12px] text-white icon-fill">more_horiz</span>
          </div>
        );
      } else {
        dots.push(
          <div key={i} className="w-5 h-5 rounded-full border border-outline-variant flex items-center justify-center">
            <span className="material-symbols-outlined text-[12px] text-outline-variant">play_arrow</span>
          </div>
        );
      }
    }

    return <div className="flex items-center gap-1">{dots}</div>;
  };



  // Detail & Editing Modals State
  const [editingGroupedReg, setEditingGroupedReg] = useState<any | null>(null);

  // Edit fields
  const [editRole, setEditRole] = useState<'Leader' | 'Follower' | 'Couple'>('Leader');
  const [editDepositor, setEditDepositor] = useState('');
  const [editMemo, setEditMemo] = useState('');

  const isRegistrationOpen = useMemo(() => {
    if (!group?.classPaymentSettings?.openMonths) return true;
    return group.classPaymentSettings.openMonths.includes(currentMonthStr);
  }, [group?.classPaymentSettings?.openMonths, currentMonthStr]);

  const displayMonth = language === 'KR'
    ? `${currentDate.getFullYear()}년 ${currentDate.getMonth() + 1}월`
    : `${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][currentDate.getMonth()]} ${currentDate.getFullYear()}`;

  // 1. 진짜 대표자 UID 식별 (오직 group.ownerId 필드만을 절대적인 기준으로 삼음. system1은 공석 처리)
  const resolvedOwnerId = useMemo(() => {
    if (group?.ownerId && group.ownerId !== 'system1') {
      return group.ownerId;
    }
    return '';
  }, [group?.ownerId]);

  // 2. 대표자 프로필 정보 동적 세팅 (부모의 실시간 members 리스트 매핑. members에 없으면 group.representative 폴백)
  const ownerInfo = useMemo(() => {
    if (!resolvedOwnerId) {
      return null;
    }
    const ownerMember = members.find(m => m.id === resolvedOwnerId);
    return {
      id: resolvedOwnerId,
      nickname: ownerMember?.name || group.representative?.name || 'Owner',
      avatar: ownerMember?.avatar || group.representative?.avatar || ''
    };
  }, [resolvedOwnerId, members, group.representative]);

  const [showVideoInput, setShowVideoInput] = useState(false);
  const [videoInputLink, setVideoInputLink] = useState('');
  const [instructorCommentInput, setInstructorCommentInput] = useState('');
  const [isEditingComment, setIsEditingComment] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');

  const isInstructor = useMemo(() => {
    if (!user) return false;
    return resolvedOwnerId === user.uid || group?.representative?.name === profile?.nickname;
  }, [user, resolvedOwnerId, group?.representative, profile]);

  const handleToggleAttendance = async (reg: any, weekNum: number, currentVal: boolean) => {
    try {
      const attendanceMap = reg.attendance || {};
      const newAttendance = {
        ...attendanceMap,
        [weekNum]: !currentVal
      };
      await classRegistrationService.updateRegistration(reg.id, {
        attendance: newAttendance
      });
      toast.success(t('class-dashboard.toast.attendance_updated'));
    } catch (e) {
      console.error("Attendance update error:", e);
      toast.error(t('class-dashboard.toast.attendance_update_failed'));
    }
  };

  const handleRegisterFeedback = async () => {
    if (!user) {
      toast.error(t('class-dashboard.toast.login_required'));
      return;
    }
    if (!feedbackText.trim()) return;

    try {
      const currentClassObj = monthClasses.find(c => c.id === selectedDashboardClass);
      const prevFeedbacks = currentClassObj?.feedbacks || [];
      const newFeedback = {
        id: Math.random().toString(36).substring(2, 9),
        userId: user.uid,
        userName: (profile as any)?.nickname || user.displayName || 'User',
        userAvatar: (profile as any)?.avatar || user.photoURL || '',
        content: feedbackText,
        createdAt: Date.now()
      };

      await groupService.updateClass(group.id, selectedDashboardClass!, {
        feedbacks: [...prevFeedbacks, newFeedback]
      });
      setFeedbackText('');
      toast.success(t('class-dashboard.toast.feedback_posted'));
    } catch (e) {
      console.error("Feedback post error:", e);
      toast.error(t('class-dashboard.toast.feedback_post_failed'));
    }
  };



  const monthBundles = useMemo(() => allDiscounts.filter(d => {
    if (d.targetMonth) return d.targetMonth === currentMonthStr;
    if (d.includedClassIds?.length) {
      return d.includedClassIds.some(id => {
        const cls = allClasses.find(c => c.id === id);
        if (!cls) return false;
        if (cls.targetMonth) return cls.targetMonth === currentMonthStr;
        if (cls.schedule?.length) return cls.schedule.some(s => s.date?.startsWith(currentMonthStr));
        return false;
      });
    }
    return false;
  }), [allDiscounts, allClasses, currentMonthStr]);

  const validClassIds = useMemo(() => {
    const ids = new Set<string>();
    monthClasses.forEach(c => ids.add(c.id));
    monthBundles.forEach(b => ids.add(b.id));
    return ids;
  }, [monthClasses, monthBundles]);

  const filteredRegistrations = useMemo(() => {
    return registrations.filter(r => {
      if (validClassIds.has(r.classId)) return true;
      if (r.selectedClassIds && r.selectedClassIds.some(id => validClassIds.has(id))) return true;
      return false;
    });
  }, [registrations, validClassIds]);

  // 디바이스 하드웨어 뒤로가기 버튼 인터셉터 (PWA/웹뷰 최적화)
  useEffect(() => {
    if (!selectedDashboardClass) return;

    // 모달이 열렸을 때 Next.js 라우팅과 별개로 브라우저 히스토리 state를 하나 추가로 쌓는다.
    // 이를 통해 뒤로가기 클릭 시 페이지 이동 없이 popstate 이벤트만 트리거되도록 유도한다.
    window.history.pushState({ modalOpen: 'dashboardClass' }, '');

    const handlePopState = (event: PopStateEvent) => {
      // popstate 이벤트 발생 시(뒤로가기 클릭 시) 상세 모달을 닫음
      closeDashboardClassModal();
      setShowVideoInput(false);
      setIsEditingComment(false);
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      // 만약 사용자가 뒤로가기가 아니라 '닫기' 버튼이나 'X' 헤더 버튼을 직접 눌러서 모달을 닫았을 경우,
      // window.history.pushState로 쌓았던 더미 state가 히스토리 스택에 남아있으므로, 
      // 이를 정리하기 위해 back()을 실행해 스택의 균형을 맞춘다.
      if (window.history.state?.modalOpen === 'dashboardClass') {
        window.history.back();
      }
    };
  }, [selectedDashboardClass, closeDashboardClassModal]);

  const handlePrevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const handleChatWithOwner = async () => {
    if (!user) {
      toast.error(t('class-dashboard.toast.login_required_general'));
      return;
    }
    if (!ownerInfo?.id) {
      toast.error(t('group.about.no_owner_error', '현재 문의할 수 있는 대표자가 없습니다.'));
      return;
    }
    if (ownerInfo.id === user.uid) {
      toast.warning(t('group.about.owner_cant_chat_self', '본인이 대표자인 그룹 클래스입니다.'));
      return;
    }
    try {
      const roomId = await chatService.getOrCreatePrivateRoom([user.uid, ownerInfo.id], user.uid);
      router.push(`/chat?roomId=${roomId}`);
    } catch (error) {
      console.error("Chat error:", error);
      toast.error(t('class-dashboard.toast.chat_open_failed'));
    }
  };

  const handleRegisterClass = () => {
    if (onApplyClick) {
      onApplyClick(currentMonthStr);
    }
    openClassFlow('apply', { month: currentMonthStr });
  };

  const handleItemClick = (item: any) => {
    openClassFlow('apply', { modal: item.id, month: currentMonthStr });
  };

  const getDayOfWeek = (dateStr: string, targetMonth?: string): string => {
    if (!dateStr) return '';
    const cleanDate = dateStr.replace(/\./g, '-');
    const parts = cleanDate.split('-');
    
    let year = new Date().getFullYear();
    let month = 1;
    let day = 1;
    
    if (parts.length === 3) {
      year = parseInt(parts[0], 10);
      month = parseInt(parts[1], 10);
      day = parseInt(parts[2], 10);
    } else if (parts.length === 2) {
      if (targetMonth && targetMonth.includes('-')) {
        year = parseInt(targetMonth.split('-')[0], 10);
      }
      month = parseInt(parts[0], 10);
      day = parseInt(parts[1], 10);
    } else {
      const d = new Date(cleanDate);
      if (isNaN(d.getTime())) return '';
      return ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'][d.getDay()];
    }
    
    const d = new Date(year, month - 1, day);
    if (isNaN(d.getTime())) return '';
    return ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'][d.getDay()];
  };

  const getDayIndex = (day: string) => {
    const DAY_ORDER = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
    const idx = DAY_ORDER.indexOf(day.toUpperCase());
    return idx === -1 ? 99 : idx;
  };

  const getClassDay = (cls: any): string => {
    if (cls.schedule && cls.schedule.length > 0) {
      const sortedSched = [...cls.schedule].sort((a, b) => a.date.localeCompare(b.date));
      const day = getDayOfWeek(sortedSched[0]?.date, cls.targetMonth || currentMonthStr);
      return day || 'MON';
    }
    return 'MON';
  };

  const getStartTime = (cls: any): string => {
    if (cls.schedule && cls.schedule.length > 0) {
      const sortedSched = [...cls.schedule].sort((a, b) => a.date.localeCompare(b.date));
      const firstSlot = sortedSched[0]?.timeSlot;
      if (firstSlot) {
        const match = firstSlot.match(/^(\d{1,2}):(\d{2})/);
        if (match) {
          return `${match[1].padStart(2, '0')}:${match[2]}`;
        }
      }
    }
    if (cls.startTime) {
      const match = cls.startTime.match(/^(\d{1,2}):(\d{2})/);
      if (match) return `${match[1].padStart(2, '0')}:${match[2]}`;
      return cls.startTime;
    }
    return '';
  };

  const sortedMonthClasses = useMemo(() => {
    return [...monthClasses].sort((a, b) => {
      const dayA = getClassDay(a);
      const dayB = getClassDay(b);
      const idxA = getDayIndex(dayA);
      const idxB = getDayIndex(dayB);
      if (idxA !== idxB) {
        return idxA - idxB;
      }
      const timeA = getStartTime(a);
      const timeB = getStartTime(b);
      return timeA.localeCompare(timeB);
    });
  }, [monthClasses]);

  // 요일별 클래스 분류 (월~금 / 토~일)
  const weekdaysClasses = useMemo(() => {
    return sortedMonthClasses.filter(c => {
      const day = getClassDay(c);
      return ['MON', 'TUE', 'WED', 'THU', 'FRI'].includes(day);
    });
  }, [sortedMonthClasses]);

  const weekendClasses = useMemo(() => {
    return sortedMonthClasses.filter(c => {
      const day = getClassDay(c);
      return ['SAT', 'SUN'].includes(day);
    });
  }, [sortedMonthClasses]);

  // Build all items list for display
  const allItems = useMemo(() => {
    const items: any[] = [];
    monthBundles.forEach(d => items.push({ ...d, itemType: 'bundle' }));
    sortedMonthClasses.forEach(c => items.push({ ...c, itemType: 'class' }));
    return items;
  }, [monthBundles, sortedMonthClasses]);

  const getItemTypeLabel = (type: string) => {
    switch (type) {
      case 'bundle': return t('class-dashboard.bundle');
      case 'class': return t('class-dashboard.class');
      default: return '';
    }
  };

  const getItemTypeColor = (type: string) => {
    switch (type) {
      case 'bundle': return { text: 'text-[#d97706]', bg: 'bg-[#d97706]/10', border: 'border-[#d97706]/20' };
      case 'class': return { text: 'text-[#059669]', bg: 'bg-[#059669]/10', border: 'border-[#059669]/20' };
      default: return { text: 'text-slate-500', bg: 'bg-slate-100', border: 'border-slate-200' };
    }
  };

  const getItemTypeIcon = (type: string) => {
    switch (type) {
      case 'bundle': return 'category';
      case 'class': return 'school';
      default: return 'school';
    }
  };

  // Grouped Registrations for 'Personal' list
  const groupedRegistrations = useMemo(() => {
    const groups: Record<string, any> = {};

    filteredRegistrations.forEach(r => {
      if (r.status === 'CANCELED') return;

      const key = r.userId || `${r.applicantName}_${r.contactNumber || ''}`;
      if (!groups[key]) {
        groups[key] = {
          key,
          userId: r.userId,
          applicantName: r.applicantName,
          contactNumber: r.contactNumber,
          userAvatar: r.userAvatar,
          registrations: [],
          appliedAt: r.appliedAt,
          updatedAt: r.updatedAt
        };
      }
      groups[key].registrations.push(r);

      const rTime = r.updatedAt || r.appliedAt;
      const gTime = groups[key].updatedAt || groups[key].appliedAt;

      if (rTime && gTime) {
        const rDate = rTime.toDate ? rTime.toDate() : new Date(rTime);
        const gDate = gTime.toDate ? gTime.toDate() : new Date(gTime);
        if (rDate > gDate) {
          groups[key].updatedAt = rTime;
          groups[key].appliedAt = r.appliedAt;
        }
      } else if (rTime) {
        groups[key].updatedAt = rTime;
        groups[key].appliedAt = r.appliedAt;
      }
    });

    return Object.values(groups).sort((a: any, b: any) => {
      const timeA = a.updatedAt || a.appliedAt;
      const timeB = b.updatedAt || b.appliedAt;
      if (!timeA) return 1;
      if (!timeB) return -1;
      const dateA = timeA.toDate ? timeA.toDate() : new Date(timeA);
      const dateB = timeB.toDate ? timeB.toDate() : new Date(timeB);
      return dateB.getTime() - dateA.getTime();
    });
  }, [filteredRegistrations]);

  const { openModal: openRegModal, closeModal: closeRegModal, value: regId } = useModalNavigation('regId');
  const selectedGroupedReg = useMemo(() => {
    if (!regId) return null;
    return groupedRegistrations.find((g: any) => g.key === regId) || null;
  }, [regId, groupedRegistrations]);

  // Class Stats for 'By Class' view
  const classStats = useMemo(() => {
    return sortedMonthClasses.map(cls => {
      const clsRegs = filteredRegistrations.filter(r => {
        if (r.status === 'CANCELED') return false;
        if (r.classId === cls.id) return true;
        if (r.selectedClassIds && r.selectedClassIds.includes(cls.id)) return true;
        return false;
      });
      const leaders = clsRegs.filter(r => (r.role || 'Leader') === 'Leader');
      const followers = clsRegs.filter(r => r.role === 'Follower');
      const couples = clsRegs.filter(r => r.role === 'Couple');

      return {
        class: cls,
        leaderCount: leaders.length + couples.length,
        followerCount: followers.length + couples.length,
        registrations: clsRegs
      };
    });
  }, [sortedMonthClasses, filteredRegistrations]);

  // Payment statuses
  const myPayments = useMemo(() => {
    if (!user) return [];
    return filteredRegistrations.filter(r => r.userId === user.uid && r.status !== 'CANCELED');
  }, [filteredRegistrations, user]);

  const allActivePayments = useMemo(() => {
    return filteredRegistrations.filter(r => r.status !== 'CANCELED');
  }, [filteredRegistrations]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PAYMENT_PENDING':
        return {
          label: language === 'KR' ? '입금대기' : 'Pending',
          bg: 'bg-amber-50 border-amber-100 text-amber-600',
          icon: 'hourglass_empty'
        };
      case 'PAYMENT_REPORTED':
        return {
          label: language === 'KR' ? '송금확인요청' : 'Reported',
          bg: 'bg-blue-50 border-blue-100 text-blue-600',
          icon: 'info'
        };
      case 'PAYMENT_COMPLETED':
        return {
          label: language === 'KR' ? '입금최종확인' : 'Completed',
          bg: 'bg-emerald-50 border-emerald-100 text-emerald-600',
          icon: 'check_circle'
        };
      default:
        return {
          label: language === 'KR' ? '대기중' : 'Pending',
          bg: 'bg-slate-50 border-slate-100 text-slate-500',
          icon: 'hourglass_empty'
        };
    }
  };

  const getBundleClassCount = (reg: ClassRegistration): number => {
    if (reg.selectedClassIds && reg.selectedClassIds.length > 0) {
      return reg.selectedClassIds.length;
    }
    const discount = allDiscounts.find(d => d.id === reg.classId);
    if (discount && discount.includedClassIds) {
      return discount.includedClassIds.length;
    }
    return 0;
  };

  const getClassDayKorean = (reg: ClassRegistration): string => {
    let targetClassIds: string[] = [];
    if (reg.selectedClassIds && reg.selectedClassIds.length > 0) {
      targetClassIds = reg.selectedClassIds;
    } else if (reg.itemType === 'discount') {
      const discount = allDiscounts.find(d => d.id === reg.classId);
      if (discount && discount.includedClassIds) {
        targetClassIds = discount.includedClassIds;
      }
    } else {
      targetClassIds = [reg.classId];
    }

    if (targetClassIds.length === 0) return '';

    const daysSet = new Set<string>();
    const daysKr = ['일', '월', '화', '수', '목', '금', '토'];
    const daysEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayOrderKr = ['월', '화', '수', '목', '금', '토', '일'];
    const dayOrderEn = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    targetClassIds.forEach(id => {
      const cls = allClasses.find(c => c.id === id);
      if (cls && cls.schedule && cls.schedule.length > 0) {
        const sortedSched = [...cls.schedule].sort((a, b) => a.date.localeCompare(b.date));
        const firstDate = sortedSched[0]?.date;
        if (firstDate) {
          const dd = new Date(firstDate.replace(/\./g, '-'));
          if (!isNaN(dd.getTime())) {
            const dayStr = language === 'KR' ? daysKr[dd.getDay()] : daysEn[dd.getDay()];
            daysSet.add(dayStr);
          }
        }
      }
    });

    if (daysSet.size === 0) return '';

    const order = language === 'KR' ? dayOrderKr : dayOrderEn;
    const sortedDays = Array.from(daysSet).sort((a, b) => order.indexOf(a) - order.indexOf(b));
    return sortedDays.join(', ');
  };

  const getRegistrationTitle = (reg: ClassRegistration) => {
    const count = getBundleClassCount(reg);
    const day = getClassDayKorean(reg);
    const daySuffix = day ? ` (${day})` : '';
    
    if (count > 0) {
      return `${reg.classTitle} (${count}${language === 'KR' ? '개 수업' : ' classes'})`;
    }
    return `${reg.classTitle}${daySuffix}`;
  };

  const getIncludedClasses = (reg: ClassRegistration) => {
    if (reg.selectedClassIds && reg.selectedClassIds.length > 0) {
      return reg.selectedClassIds.map(id => allClasses.find(c => c.id === id)?.title).filter(Boolean) as string[];
    }
    const discount = allDiscounts.find(d => d.id === reg.classId);
    if (discount && discount.includedClassIds) {
      return discount.includedClassIds.map(id => allClasses.find(c => c.id === id)?.title).filter(Boolean) as string[];
    }
    return [];
  };

  const getSingleClassDay = (cls: any): string => {
    if (!cls || !cls.schedule || cls.schedule.length === 0) return '';
    const sortedSched = [...cls.schedule].sort((a, b) => a.date.localeCompare(b.date));
    const firstDate = sortedSched[0]?.date;
    if (!firstDate) return '';
    const dd = new Date(firstDate.replace(/\./g, '-'));
    if (isNaN(dd.getTime())) return '';
    
    const daysKr = ['일', '월', '화', '수', '목', '금', '토'];
    const daysEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return language === 'KR' ? daysKr[dd.getDay()] : daysEn[dd.getDay()];
  };

  const getIncludedClassObjects = (reg: ClassRegistration) => {
    let targetClassIds: string[] = [];
    if (reg.selectedClassIds && reg.selectedClassIds.length > 0) {
      targetClassIds = reg.selectedClassIds;
    } else {
      const discount = allDiscounts.find(d => d.id === reg.classId);
      if (discount && discount.includedClassIds) {
        targetClassIds = discount.includedClassIds;
      }
    }
    return targetClassIds.map(id => allClasses.find(c => c.id === id)).filter(Boolean) as any[];
  };

  const formatDateTime = (timeAny: any): string => {
    if (!timeAny) return '-';
    let d: Date;
    if (timeAny.toDate) {
      d = timeAny.toDate();
    } else {
      d = new Date(timeAny);
    }
    if (isNaN(d.getTime())) return '-';
    
    const daysKr = ['일', '월', '화', '수', '목', '금', '토'];
    const daysEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayName = language === 'KR' ? daysKr[d.getDay()] : daysEn[d.getDay()];

    const month = d.getMonth() + 1;
    const date = d.getDate();
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    
    return `${month}.${date}(${dayName}) ${hh}:${min}`;
  };

  const openEditModal = (groupedReg: any) => {
    setEditingGroupedReg(groupedReg);
    const firstReg = groupedReg.registrations[0];
    setEditRole(firstReg?.role || 'Leader');
    setEditDepositor(firstReg?.depositorName || groupedReg.applicantName || '');
    setEditMemo(firstReg?.applicantMemo || '');
  };

  const handleUpdate = async () => {
    if (!editingGroupedReg) return;
    try {
      const promises = editingGroupedReg.registrations.map((r: any) =>
        classRegistrationService.updateRegistration(r.id, {
          role: editRole,
          depositorName: editDepositor,
          applicantMemo: editMemo
        })
      );
      await Promise.all(promises);
      toast.success(t('class-dashboard.toast.registration_updated'));
      setEditingGroupedReg(null);
    } catch (error) {
      console.error("Error updating registrations:", error);
      toast.error(t('class-dashboard.toast.registration_update_failed'));
    }
  };

  return (
    <div className="flex flex-col w-full animate-in fade-in slide-in-from-bottom-4 duration-500 pb-6">

      {/* Month Navigation Header - Compact with Inquire/Apply actions */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-[#f2f4f4] bg-white/80 backdrop-blur-sm gap-2">
        {/* Left: Compact Date navigation */}
        <div className="flex items-center gap-1">
          <button onClick={handlePrevMonth} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#f2f4f4] transition-colors shrink-0">
            <span className="material-symbols-outlined text-lg text-[#596061]">chevron_left</span>
          </button>
          <div className="flex flex-col items-start shrink-0 min-w-[70px]">
            <span className="text-[14px] font-black text-[#2d3435] leading-normal">{displayMonth}</span>
          </div>
          <button onClick={handleNextMonth} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#f2f4f4] transition-colors shrink-0">
            <span className="material-symbols-outlined text-lg text-[#596061]">chevron_right</span>
          </button>
        </div>

        {/* Right: Inquire & Apply compact chip buttons */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={handleChatWithOwner}
            disabled={!isRegistrationOpen}
            className={`flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg font-black text-[11px] border transition-all ${
              isRegistrationOpen
                ? 'bg-slate-50 text-[#596061] border-slate-200 hover:bg-slate-100 active:scale-95'
                : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
            }`}
          >
            <span className="material-symbols-outlined text-[14px]">chat</span>
            <span>{language === 'KR' ? '문의' : 'Chat'}</span>
          </button>

          <button
            onClick={handleRegisterClass}
            disabled={!isRegistrationOpen}
            className={`flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg font-black text-[11px] transition-all relative overflow-hidden ${
              isRegistrationOpen
                ? 'bg-[#0057bd] text-white hover:bg-[#004bb4] active:scale-95 shadow-sm shadow-[#0057bd]/10'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <span className="material-symbols-outlined text-[14px]">how_to_reg</span>
            <span>{language === 'KR' ? '신청' : 'Apply'}</span>
          </button>
        </div>
      </div>

      {/* Sub Tabs Bar */}
      <div className="w-full px-4 py-4 flex items-center gap-2 overflow-x-auto no-scrollbar border-b border-[#f2f4f4] bg-white">
        {[
          { id: 'dashboard', label: t('class-dashboard.tab.dashboard', '현황') },
          { id: 'list', label: t('class-dashboard.tab.list') },
          { id: 'registrations', label: t('class-dashboard.tab.registrations') },
          { id: 'class_status', label: t('class-dashboard.tab.class_status') }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-[12px] font-black tracking-tight transition-all whitespace-nowrap border ${
              activeTab === tab.id
                ? 'bg-[#0057bd] text-white border-[#0057bd] shadow-sm shadow-[#0057bd]/10'
                : 'bg-slate-50 text-slate-500 border-slate-100 hover:bg-slate-100/80'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {!isRegistrationOpen && (
        <div className="bg-rose-50 border-b border-rose-100 text-rose-600 px-4 py-2.5 text-xs font-bold flex items-center gap-2 animate-in fade-in duration-300">
          <span className="material-symbols-outlined text-base">info</span>
          {language === 'KR' ? '지금은 수업신청이 불가합니다.' : 'Class registration is currently unavailable.'}
        </div>
      )}

      {/* RENDER ACTIVE TAB VIEW */}
      {activeTab === 'dashboard' && (
        <div className="flex-1 flex flex-col px-4 py-4 gap-4 overflow-y-auto pb-12 animate-in fade-in duration-300">
          {(() => {
            const dayOrder = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
            const dayLabelsKr: Record<string, string> = {
              MON: '월요일', TUE: '화요일', WED: '수요일', THU: '목요일', FRI: '금요일', SAT: '토요일', SUN: '일요일'
            };
            const dayLabelsEn: Record<string, string> = {
              MON: 'Monday', TUE: 'Tuesday', WED: 'Wednesday', THU: 'Thursday', FRI: 'Friday', SAT: 'Saturday', SUN: 'Sunday'
            };

            const grouped: Record<string, GroupClass[]> = {};
            sortedMonthClasses.forEach(cls => {
              const day = getClassDay(cls);
              if (!grouped[day]) grouped[day] = [];
              grouped[day].push(cls);
            });

            const activeDays = dayOrder.filter(day => grouped[day] && grouped[day].length > 0);

            if (activeDays.length === 0) {
              return (
                <div className="py-12 text-center bg-surface-container-lowest rounded-xl border border-outline-variant">
                  <p className="text-xs text-slate-400 italic py-4">
                    {language === 'KR' ? '이번 달에 개설된 수업이 없습니다.' : 'No classes this month.'}
                  </p>
                </div>
              );
            }

            return activeDays.map(dayKey => {
              const classesInDay = grouped[dayKey];
              const dayLabel = language === 'KR' ? dayLabelsKr[dayKey] : dayLabelsEn[dayKey];

              return (
                <section key={dayKey} className="bg-surface-container-lowest rounded-xl border border-outline-variant p-3 shadow-sm">
                  <h2 className="font-label-md text-label-md text-on-surface-variant mb-2 font-black">{dayLabel}</h2>
                  <div className="flex flex-col gap-1.5">
                    {classesInDay.map((cls) => {
                      const stats = classRealtimeStats[cls.id] || { leaders: 0, followers: 0, percent: 0, membersList: [] };
                      const teachers = cls.instructors?.map(ins => ins.name).join(' & ') || (language === 'KR' ? '미지정 강사' : 'TBD');
                      
                      const currentClassObj = monthClasses.find(c => c.id === cls.id);
                      const sortedSched = currentClassObj?.schedule ? [...currentClassObj.schedule].sort((a, b) => a.date.localeCompare(b.date)) : [];
                      const completedWeeksCount = sortedSched.filter(s => new Date(s.date.replace(/\./g, '-')) < new Date()).length;
                      
                      let attendancePercent = 100;
                      if (stats.membersList.length > 0 && completedWeeksCount > 0) {
                        const totalPossible = stats.membersList.length * completedWeeksCount;
                        let attendedCount = 0;
                        stats.membersList.forEach((reg: any) => {
                          const attendanceMap = reg.attendance || {};
                          for (let w = 1; w <= completedWeeksCount; w++) {
                            if (attendanceMap[w] !== undefined) {
                              if (attendanceMap[w]) attendedCount++;
                            } else {
                              if (reg.status === 'PAYMENT_COMPLETED') attendedCount++;
                            }
                          }
                        });
                        attendancePercent = Math.round((attendedCount / totalPossible) * 100);
                      } else {
                        attendancePercent = 0;
                      }

                      return (
                        <div
                          key={cls.id}
                          onClick={() => openDashboardClassModal(cls.id)}
                          className="flex items-center justify-between py-1.5 px-2 bg-surface hover:bg-surface-container-low rounded-lg border border-transparent hover:border-outline-variant transition-colors group cursor-pointer"
                        >
                          <div className="flex flex-col flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 justify-between pr-2">
                              <span className="font-body-sm text-body-sm text-on-surface font-black truncate flex-1">{cls.title}</span>
                              {completedWeeksCount > 0 && stats.membersList.length > 0 && (
                                <span className="text-[10px] font-black text-emerald-600 shrink-0">
                                  {language === 'KR' ? `출석률 ${attendancePercent}%` : `Attendance ${attendancePercent}%`}
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-on-surface-variant font-medium">{teachers}</span>
                            <div className="flex items-center gap-3 mt-0.5">
                              <div className="flex items-center gap-2 text-outline">
                                <span className="flex items-center gap-0.5 font-label-sm"><span className="material-symbols-outlined text-[14px] text-blue-600">person</span> {stats.leaders}</span>
                                <span className="flex items-center gap-0.5 font-label-sm"><span className="material-symbols-outlined text-[14px] text-rose-500">person</span> {stats.followers}</span>
                                <span className="flex items-center gap-0.5 font-label-sm ml-2"><span className="material-symbols-outlined text-[14px] text-on-surface-variant">percent</span> {stats.percent}%</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {renderScheduleStatusDots(cls)}
                            <span className="material-symbols-outlined text-outline-variant text-[18px]">chevron_right</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              );
            });
          })()}
        </div>
      )}

      {activeTab === 'list' && (
        <>
          {/* Item List */}
          <div className="px-4 py-4 space-y-3">
            {allItems.length > 0 ? (
              (() => {
                let prevClassDay = '';
                return allItems.map((item, idx) => {
                  const colors = getItemTypeColor(item.itemType);
                  const icon = getItemTypeIcon(item.itemType);
                  const imgSrc = item.imageUrl || item.image || item.photoURL || item.avatar || group.coverImage || group.logo || '';
                  const timeDisplay = item.schedule?.[0]?.timeSlot || (item.startTime ? `${item.startTime}${item.endTime ? ' - ' + item.endTime : ''}` : '');

                  const isClass = item.itemType === 'class';
                  const isBundle = item.itemType === 'bundle';
                  const currentClassDay = isClass ? getClassDay(item) : '';
                  const showDayDivider = isClass && currentClassDay !== prevClassDay;
                  if (isClass) {
                    prevClassDay = currentClassDay;
                  }

                  return (
                    <React.Fragment key={item.id || idx}>
                      {showDayDivider && (
                        <div className="pt-4 pb-2 flex items-center gap-3">
                          <div className="h-[1px] flex-1 bg-slate-100"></div>
                          <span className="text-[12px] font-black text-slate-400 tracking-wider uppercase">
                            {t(`days.${currentClassDay}`)}
                          </span>
                          <div className="h-[1px] flex-1 bg-slate-100"></div>
                        </div>
                      )}
                      <article
                        onClick={() => handleItemClick(item)}
                        className={`relative overflow-hidden rounded-xl p-4 flex gap-4 active:scale-[0.99] transition-all cursor-pointer hover:shadow-md ${
                          isBundle
                            ? 'bg-gradient-to-br from-[#fffbeb]/80 via-[#fffdf9] to-white border-2 border-amber-200/90 shadow-xs'
                            : 'bg-white border border-[#e0e4e5]/60 shadow-xs'
                        }`}
                      >
                        {/* 번들 전용 세로 데코레이션 바 */}
                        {isBundle && (
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500 rounded-l-xl"></div>
                        )}

                        {/* Thumbnail */}
                        <div className="w-20 h-20 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0 relative z-10">
                          {imgSrc ? (
                            <ImageWithFallback src={imgSrc} alt={item.title} className="w-full h-full object-cover" fallbackType="gallery" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-300">
                              <span className="material-symbols-outlined text-3xl">{icon}</span>
                            </div>
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 flex flex-col justify-between min-w-0 relative z-10">
                          <div>
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full inline-block mb-1 ${colors.text} ${colors.bg}`}>
                              {getItemTypeLabel(item.itemType)}
                            </span>
                            <h3 className="font-['Plus_Jakarta_Sans'] font-extrabold text-[15px] leading-tight text-[#2d3435] truncate">{item.title}</h3>
                            {item.description && (
                              <p className="text-xs font-medium text-[#596061] mt-0.5 line-clamp-1">{item.description}</p>
                            )}
                          </div>
                          <div className="flex items-end justify-between mt-2">
                            <span className="font-['Plus_Jakarta_Sans'] font-bold text-base text-[#0057bd]">
                              {getCurrencySymbol(item.currency || 'KRW')}{(item.amount || item.price || 0).toLocaleString()}
                            </span>
                            {(() => {
                              let startDisplay = '';
                              if (item.itemType === 'class' && item.schedule && item.schedule.length > 0) {
                                const sortedSched = [...item.schedule].sort((a: any, b: any) => a.date.localeCompare(b.date));
                                const firstDateStr = sortedSched[0]?.date;
                                if (firstDateStr) {
                                  const dd = new Date(firstDateStr.replace(/\./g, '-'));
                                  if (!isNaN(dd.getTime())) {
                                    const dayIdx = dd.getDay();
                                    const daysKr = ['일', '월', '화', '수', '목', '금', '토'];
                                    const daysEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                                    startDisplay = language === 'KR'
                                      ? `${dd.getMonth() + 1}.${dd.getDate()}(${daysKr[dayIdx]})`
                                      : `${dd.getMonth() + 1}/${dd.getDate()} (${daysEn[dayIdx]})`;
                                  }
                                }
                              }

                              return (
                                <div className="flex flex-col items-end gap-0.5">
                                  {startDisplay && (
                                    <span className="text-[10px] font-bold text-[#0057bd]">
                                      {t('class-dashboard.startDate').replace('{date}', startDisplay)}
                                    </span>
                                  )}
                                  {timeDisplay && (
                                    <span className="text-[11px] text-[#596061] font-medium">{timeDisplay}</span>
                                  )}
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                      </article>
                    </React.Fragment>
                  );
                });
              })()
            ) : (
              <div className="py-12 text-center">
                <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">school</span>
                <p className="text-slate-500 font-medium text-sm">{t('class-dashboard.noRegistrationsYet')}</p>
              </div>
            )}
          </div>
        </>
      )}

      {activeTab === 'registrations' && (
        <div className="px-4 py-3 space-y-6 animate-in fade-in duration-300">
          {(() => {
            const pendingGroups = groupedRegistrations.filter(g => g.registrations[0]?.status === 'PAYMENT_PENDING');
            const reportedGroups = groupedRegistrations.filter(g => g.registrations[0]?.status === 'PAYMENT_REPORTED');
            const completedGroups = groupedRegistrations.filter(g => g.registrations[0]?.status === 'PAYMENT_COMPLETED');

            const sections = [
              {
                title: language === 'KR' ? '⏳ 입금 대기' : '⏳ Pending Payment',
                count: pendingGroups.length,
                groups: pendingGroups,
                type: 'pending',
                emptyMsg: language === 'KR' ? '입금 대기 중인 신청 건이 없습니다.' : 'No pending payments.',
                dateLabel: language === 'KR' ? '신청일' : 'Applied',
                getDate: (g: any, rep: any) => rep.appliedAt
              },
              {
                title: language === 'KR' ? '✉️ 송금확인요청' : '✉️ Transferred (Pending Confirm)',
                count: reportedGroups.length,
                groups: reportedGroups,
                type: 'reported',
                emptyMsg: language === 'KR' ? '송금확인요청 건이 없습니다.' : 'No transfer confirm requests.',
                dateLabel: language === 'KR' ? '송금요청일' : 'Reported',
                getDate: (g: any, rep: any) => rep.depositDate || g.updatedAt || rep.updatedAt
              },
              {
                title: language === 'KR' ? '✅ 입금최종확인' : '✅ Payment Completed',
                count: completedGroups.length,
                groups: completedGroups,
                type: 'completed',
                emptyMsg: language === 'KR' ? '입금최종확인된 신청 건이 없습니다.' : 'No completed payments.',
                dateLabel: language === 'KR' ? '입금완료일' : 'Confirmed',
                getDate: (g: any, rep: any) => rep.confirmedAt || g.updatedAt || rep.updatedAt
              }
            ];

            return sections.map((sec) => (
              <section key={sec.type} className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-1.5 px-1">
                  <h4 className="font-extrabold text-[13px] text-slate-700 tracking-tight flex items-center gap-1.5">
                    {sec.title}
                  </h4>
                  <span className="text-[10px] font-black px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full">
                    {sec.count}{language === 'KR' ? '건' : ' cases'}
                  </span>
                </div>

                <div className="space-y-3">
                  {sec.groups.length > 0 ? (
                    sec.groups.map((g: any) => {
                      const representativeReg = g.registrations[0];
                      const totalCount = g.registrations.length;
                      const isMe = user && g.userId === user.uid;
                      const dateVal = sec.getDate(g, representativeReg);

                      return (
                        <article
                          key={g.key}
                          className={`bg-white rounded-2xl p-4 shadow-sm border transition-all hover:shadow-md ${
                            isMe ? 'border-blue-200 bg-blue-50/20' : 'border-[#e0e4e5]/60'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            {/* Left Side: Avatar + Name + Subtext */}
                            <div className="flex items-center gap-3">
                              {g.userId ? (
                                <UserBadge
                                  uid={g.userId}
                                  nickname={g.applicantName}
                                  avatarSize="w-10 h-10"
                                  nameClassName="font-extrabold text-[14px] text-[#2d3435]"
                                  nativeClassName="text-[10px] font-medium text-slate-400 ml-1.5"
                                />
                              ) : (
                                <div className="flex items-center gap-2">
                                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                                    <span className="material-symbols-outlined text-xl">person</span>
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="font-extrabold text-[14px] text-[#2d3435]">{g.applicantName}</span>
                                    <span className="text-[9px] font-bold text-slate-400 px-1 py-0.5 bg-slate-100 rounded-md inline-block w-fit mt-0.5">NON-MEMBER</span>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Right Side: Payment Status Badge + Edit Button */}
                            <div className="flex items-center gap-2">
                              {representativeReg?.status && (() => {
                                const badge = getStatusBadge(representativeReg.status);
                                return (
                                  <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${badge.bg}`}>
                                    {badge.label}
                                  </span>
                                );
                              })()}
                              {isMe && (
                                <button
                                  onClick={() => openEditModal(g)}
                                  className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 font-bold text-[11px] text-[#596061] shadow-xs active:scale-95 transition-all flex items-center gap-1"
                                >
                                  <span className="material-symbols-outlined text-[12px]">edit</span>
                                  {t('class-dashboard.modify')}
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Date Display Section (Required date inside badge) */}
                          {dateVal && (
                            <div className="mt-2.5 px-3 py-1.5 rounded-xl bg-slate-50/80 border border-slate-100/60 flex items-center justify-between">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{sec.dateLabel}</span>
                              <span className="text-[11px] font-black text-slate-600 font-['Plus_Jakarta_Sans']">{formatDateTime(dateVal)}</span>
                            </div>
                          )}

                          {/* Middle Side: Dynamic Item Link */}
                          <div className="mt-2 bg-slate-50/75 rounded-xl p-3 border border-slate-100">
                            <button
                              onClick={() => openRegModal(g.key)}
                              className="w-full text-left flex items-center justify-between group"
                            >
                              <span className="text-xs font-black text-[#0057bd] leading-snug break-all hover:underline flex-1 pr-2">
                                {getRegistrationTitle(representativeReg)}
                                {totalCount > 1 && (
                                  language === 'KR'
                                    ? ` 외 ${totalCount - 1}개`
                                    : ` and ${totalCount - 1} others`
                                )}
                              </span>
                              <span className="material-symbols-outlined text-[16px] text-slate-400 group-hover:translate-x-0.5 transition-transform">
                                chevron_right
                              </span>
                            </button>
                          </div>

                          {/* Bottom Side: Membership & Personal Memo */}
                          {(representativeReg?.adminMemo || representativeReg?.applicantMemo) && (
                            <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5">
                              {representativeReg.adminMemo && (
                                <div className="text-[11px] text-slate-500 font-medium leading-relaxed flex items-start gap-1">
                                  <span className="material-symbols-outlined text-[13px] mt-0.5 text-indigo-500 shrink-0">badge</span>
                                  <span>
                                    <strong className="text-indigo-600 font-bold">{language === 'KR' ? '멤버쉽' : 'Membership'}.</strong> {representativeReg.adminMemo}
                                  </span>
                                </div>
                              )}
                              {representativeReg.applicantMemo && (
                                <div className="text-[11px] text-slate-500 font-medium leading-relaxed flex items-start gap-1">
                                  <span className="material-symbols-outlined text-[13px] mt-0.5 text-emerald-500 shrink-0">comment</span>
                                  <span>
                                    <strong className="text-emerald-600 font-bold">{language === 'KR' ? '입금메모' : 'Deposit Memo'}.</strong> {representativeReg.applicantMemo}
                                  </span>
                                </div>
                              )}
                            </div>
                          )}
                        </article>
                      );
                    })
                  ) : (
                    <div className="py-6 text-center bg-white rounded-2xl border border-slate-100">
                      <p className="text-slate-400 font-semibold text-[11px]">{sec.emptyMsg}</p>
                    </div>
                  )}
                </div>
              </section>
            ));
          })()}
        </div>
      )}

      {activeTab === 'class_status' && (
        <div className="px-4 py-3 space-y-4 animate-in fade-in duration-300">
          {/* VIEW: Class Stats & Nickname Lists */}
          <div className="space-y-3">
            {classStats.length > 0 ? (
              classStats.map(({ class: cls, leaderCount, followerCount, registrations: clsRegs }) => {
                return (
                  <article
                    key={cls.id}
                    className="bg-white rounded-2xl p-4 shadow-sm border border-[#e0e4e5]/60 space-y-3"
                  >
                    {/* Top: Class Title */}
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="font-extrabold text-[14px] text-[#2d3435] leading-tight">{cls.title}</h4>
                      <span className="text-[12px] font-black text-[#0057bd] shrink-0 bg-blue-50 px-2 py-0.5 rounded-md">
                        {(() => {
                          const dayKey = getClassDay(cls);
                          const dayLabel = language === 'KR'
                            ? { 'MON': '월', 'TUE': '화', 'WED': '수', 'THU': '목', 'FRI': '금', 'SAT': '토', 'SUN': '일' }[dayKey] || dayKey
                            : { 'MON': 'Mon', 'TUE': 'Tue', 'WED': 'Wed', 'THU': 'Thu', 'FRI': 'Fri', 'SAT': 'Sat', 'SUN': 'Sun' }[dayKey] || dayKey;
                          return `(${dayLabel})`;
                        })()}
                      </span>
                    </div>

                    {/* Middle: Counts */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl px-3 py-2 flex items-center justify-between">
                        <span className="text-[10px] font-bold text-indigo-600 tracking-wider uppercase">{t('class-dashboard.leaders')}</span>
                        <span className="text-[14px] font-black text-indigo-700">{t('class-dashboard.leader_count').replace('{count}', String(leaderCount))}</span>
                      </div>
                      <div className="bg-pink-50/50 border border-pink-100 rounded-xl px-3 py-2 flex items-center justify-between">
                        <span className="text-[10px] font-bold text-pink-600 tracking-wider uppercase">{t('class-dashboard.followers')}</span>
                        <span className="text-[14px] font-black text-pink-700">{t('class-dashboard.follower_count').replace('{count}', String(followerCount))}</span>
                      </div>
                    </div>

                    {/* Bottom: Nicknames List */}
                    {clsRegs.length > 0 ? (
                      <div className="pt-2 border-t border-slate-100 space-y-3">
                        {/* Leaders list */}
                        {(() => {
                          const leaders = clsRegs.filter(r => (r.role || 'Leader') === 'Leader' || r.role === 'Couple');
                          return (
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest block">{t('class-dashboard.leaders')}</span>
                                <span className="text-[9px] font-black text-indigo-400 bg-indigo-50 px-1.5 py-0.2 rounded-sm">{leaders.length}</span>
                              </div>
                              {leaders.length > 0 ? (
                                <div className="flex flex-wrap gap-1.5">
                                  {leaders.map((reg) => (
                                    <div
                                      key={`leader-${reg.id}`}
                                      className="flex items-center gap-1 bg-[#f4f7fb] border border-[#e2eaf4] rounded-full pl-1 pr-2 py-0.5 max-w-[135px] shrink-0"
                                    >
                                      {reg.userId ? (
                                        <UserBadge
                                          uid={reg.userId}
                                          nickname={reg.applicantName}
                                          avatarSize="w-5 h-5"
                                          nameClassName="font-bold text-[10px] text-slate-600 truncate max-w-[60px]"
                                          nativeClassName="text-[8px] font-semibold text-slate-400 ml-1 truncate max-w-[40px]"
                                        />
                                      ) : (
                                        <div className="flex items-center gap-1 min-w-0">
                                          <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 shrink-0">
                                            <span className="material-symbols-outlined text-[10px]">person</span>
                                          </div>
                                          <span className="font-bold text-[10px] text-slate-600 truncate max-w-[60px]">{reg.applicantName}</span>
                                        </div>
                                      )}
                                      {reg.role === 'Couple' && (
                                        <span className="text-[8px] font-black text-[#b45309] bg-[#fef3c7] px-1 py-0.2 rounded-sm scale-90 shrink-0 select-none">
                                          C
                                        </span>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-[10px] font-medium text-slate-400 italic pl-1">
                                  {language === 'KR' ? '신청한 리더가 없습니다.' : 'No leaders registered.'}
                                </p>
                              )}
                            </div>
                          );
                        })()}

                        {/* Followers list */}
                        {(() => {
                          const followers = clsRegs.filter(r => r.role === 'Follower' || r.role === 'Couple');
                          return (
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[9px] font-black text-pink-500 uppercase tracking-widest block">{t('class-dashboard.followers')}</span>
                                <span className="text-[9px] font-black text-pink-400 bg-pink-50 px-1.5 py-0.2 rounded-sm">{followers.length}</span>
                              </div>
                              {followers.length > 0 ? (
                                <div className="flex flex-wrap gap-1.5">
                                  {followers.map((reg) => (
                                    <div
                                      key={`follower-${reg.id}`}
                                      className="flex items-center gap-1 bg-[#fff5f6] border border-[#ffe4e6] rounded-full pl-1 pr-2 py-0.5 max-w-[135px] shrink-0"
                                    >
                                      {reg.userId ? (
                                        <UserBadge
                                          uid={reg.userId}
                                          nickname={reg.applicantName}
                                          avatarSize="w-5 h-5"
                                          nameClassName="font-bold text-[10px] text-slate-600 truncate max-w-[60px]"
                                          nativeClassName="text-[8px] font-semibold text-slate-400 ml-1 truncate max-w-[40px]"
                                        />
                                      ) : (
                                        <div className="flex items-center gap-1 min-w-0">
                                          <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 shrink-0">
                                            <span className="material-symbols-outlined text-[10px]">person</span>
                                          </div>
                                          <span className="font-bold text-[10px] text-slate-600 truncate max-w-[60px]">{reg.applicantName}</span>
                                        </div>
                                      )}
                                      {reg.role === 'Couple' && (
                                        <span className="text-[8px] font-black text-[#b45309] bg-[#fef3c7] px-1 py-0.2 rounded-sm scale-90 shrink-0 select-none">
                                          C
                                        </span>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-[10px] font-medium text-slate-400 italic pl-1">
                                  {language === 'KR' ? '신청한 팔로워가 없습니다.' : 'No followers registered.'}
                                </p>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    ) : (
                      <p className="text-[11px] font-medium text-slate-400 italic pt-1">{language === 'KR' ? '신청자가 아직 없습니다.' : 'No members registered yet.'}</p>
                    )}
                  </article>
                );
              })
            ) : (
              <div className="py-12 text-center bg-white rounded-2xl border border-slate-100">
                <p className="text-slate-500 font-medium text-sm">{language === 'KR' ? '수업 정보가 존재하지 않습니다.' : 'No class data available.'}</p>
              </div>
            )}
          </div>
        </div>
      )}



      {/* DETAIL MODAL (모바일 친화적인 바텀시트 모달) */}
      {selectedGroupedReg && (
        <div className="fixed inset-0 z-[999] bg-black/60 backdrop-blur-xs animate-in fade-in duration-200 flex items-end justify-center">
          {/* Click outside to close */}
          <div className="absolute inset-0" onClick={() => closeRegModal()}></div>
          
          {/* Bottom Sheet Content */}
          <div className="w-full max-w-[768px] bg-white rounded-t-[32px] overflow-hidden shadow-2xl z-[1000] border-t border-slate-100 flex flex-col animate-in slide-in-from-bottom duration-300 max-h-[85vh]">
            {/* Handle bar */}
            <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto my-3 shrink-0 cursor-pointer" onClick={() => closeRegModal()}></div>
            
            {/* Header */}
            <div className="px-6 pb-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {selectedGroupedReg.userId ? (
                  <UserBadge
                    uid={selectedGroupedReg.userId}
                    nickname={selectedGroupedReg.applicantName}
                    avatarSize="w-10 h-10"
                    nameClassName="font-extrabold text-[16px] text-[#2d3435]"
                    nativeClassName="text-[11px] font-medium text-slate-400 ml-1.5"
                  />
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                      <span className="material-symbols-outlined text-xl">person</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-extrabold text-[16px] text-[#2d3435]">{selectedGroupedReg.applicantName}</span>
                      <span className="text-[9px] font-bold text-slate-400 px-1.5 py-0.5 bg-slate-100 rounded-md inline-block w-fit mt-0.5">NON-MEMBER</span>
                    </div>
                  </div>
                )}
              </div>
              <button
                onClick={() => closeRegModal()}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>
            
            {/* Scrollable list */}
            <div className="px-6 py-4 overflow-y-auto space-y-4 pb-12">
              {selectedGroupedReg.registrations.map((reg: any) => {
                const badge = getStatusBadge(reg.status);
                const includedClasses = getIncludedClasses(reg);
                return (
                  <div key={reg.id} className="bg-slate-50/70 rounded-2xl p-4 border border-slate-100 flex flex-col gap-2">
                    <div className="flex items-start justify-between gap-4">
                      <h4 className="font-black text-[14px] text-slate-900 leading-snug">
                        {getRegistrationTitle(reg)}
                        {reg.partnerName && reg.partnerName.trim() !== '' && t('class-dashboard.partner_suffix', { name: reg.partnerName })}
                      </h4>
                      <span className={`px-2.5 py-0.5 rounded-full border text-[9px] font-black shrink-0 ${badge.bg}`}>
                        {badge.label}
                      </span>
                    </div>
                    
                    {/* Included individual classes */}
                    {(() => {
                      const includedClassObjs = getIncludedClassObjects(reg);
                      if (includedClassObjs.length === 0) return null;
                      return (
                        <div className="mt-1 pl-3.5 border-l-2 border-slate-200/80 space-y-1.5 py-0.5">
                          {includedClassObjs.map((cls, idx) => {
                            const clsDay = getSingleClassDay(cls);
                            const dayPrefix = clsDay ? `(${clsDay}) ` : '';
                            const specificPartner = reg.participatingClassPartners?.[cls.id] || reg.partnerName;
                            const partnerSuffix = specificPartner && specificPartner.trim() !== '' 
                              ? ` (${specificPartner})` 
                              : '';
                            return (
                              <div key={idx} className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#0057bd] shrink-0"></span>
                                <span className="truncate">
                                  - {dayPrefix}{cls.title}{partnerSuffix}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                    
                    {/* 3-Step compact status workflow */}
                    <div className="mt-2.5 pt-3.5 border-t border-slate-200/50 space-y-2">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">{language === 'KR' ? '진행 상태' : 'Progress Status'}</span>
                      <div className="grid grid-cols-3 gap-1 relative mt-1">
                        {/* Line connector background */}
                        <div className="absolute top-[14px] left-[15%] right-[15%] h-[2px] bg-slate-200 z-0"></div>
                        
                        {/* Step 1: 신청완료 */}
                        <div className="flex flex-col items-center text-center z-10">
                          <div className="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center border-2 border-white shadow-xs">
                            <span className="material-symbols-outlined text-[13px]">done</span>
                          </div>
                          <span className="text-[10px] font-black text-slate-700 mt-1">{language === 'KR' ? '신청완료' : 'Applied'}</span>
                          <span className="text-[8px] text-slate-400 font-bold mt-0.5 leading-none">{formatDateTime(reg.appliedAt)}</span>
                        </div>

                        {/* Step 2: 송금완료 */}
                        {(() => {
                          const isDone = reg.status !== 'PAYMENT_PEND';
                          const isTransferred = reg.status !== 'PAYMENT_PENDING';
                          const stepDate = reg.depositDate || (isTransferred ? reg.updatedAt : null);
                          return (
                            <div className="flex flex-col items-center text-center z-10">
                              <div className={`w-7 h-7 rounded-full flex items-center justify-center border-2 border-white shadow-xs ${
                                isTransferred ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-400 border-slate-200'
                              }`}>
                                <span className="material-symbols-outlined text-[13px]">{isTransferred ? 'payments' : 'hourglass_empty'}</span>
                              </div>
                              <span className={`text-[10px] font-black mt-1 ${isTransferred ? 'text-slate-700' : 'text-slate-400'}`}>{language === 'KR' ? '송금완료' : 'Reported'}</span>
                              <span className="text-[8px] text-slate-400 font-bold mt-0.5 leading-none">{stepDate ? formatDateTime(stepDate) : '-'}</span>
                            </div>
                          );
                        })()}

                        {/* Step 3: 입금확인 */}
                        {(() => {
                          const isDone = reg.status === 'PAYMENT_COMPLETED';
                          const stepDate = reg.confirmedAt || (isDone ? reg.updatedAt : null);
                          return (
                            <div className="flex flex-col items-center text-center z-10">
                              <div className={`w-7 h-7 rounded-full flex items-center justify-center border-2 border-white shadow-xs ${
                                isDone ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400 border-slate-200'
                              }`}>
                                <span className="material-symbols-outlined text-[13px]">{isDone ? 'verified' : 'hourglass_empty'}</span>
                              </div>
                              <span className={`text-[10px] font-black mt-1 ${isDone ? 'text-slate-700' : 'text-slate-400'}`}>{language === 'KR' ? '입금확인' : 'Confirmed'}</span>
                              <span className="text-[8px] text-slate-400 font-bold mt-0.5 leading-none">{stepDate ? formatDateTime(stepDate) : '-'}</span>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 pt-2.5 mt-1 border-t border-slate-200/50">
                      <span>
                        {language === 'KR' ? '댄스 역할' : 'Dance Role'}: <strong className="text-slate-600">{(reg.role || 'Leader').toUpperCase()}</strong>
                      </span>
                      <span className="text-[#0057bd] font-black text-xs">
                        {getCurrencySymbol(reg.currency || 'KRW')}{(reg.amount || 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL (본인 정보 수정) */}
      {editingGroupedReg && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col border border-slate-100">
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('class-dashboard.modifyApplication')}</span>
                <span className="font-extrabold text-[15px] text-[#2d3435] mt-0.5">{editingGroupedReg.applicantName}</span>
              </div>
              <button
                onClick={() => setEditingGroupedReg(null)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-200 transition-colors text-slate-400 hover:text-slate-600"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>
            
            {/* Editor Fields */}
            <div className="p-5 space-y-4">
              {/* Field 1: Role */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider block">
                  {language === 'KR' ? '댄스 역할' : 'Dance Role'}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Leader', 'Follower', 'Couple'] as const).map((r) => {
                    const active = editRole === r;
                    return (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setEditRole(r)}
                        className={`py-2 px-3 rounded-xl border text-[11px] font-black transition-all ${
                          active
                            ? 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-100'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100/60'
                        }`}
                      >
                        {r === 'Leader'
                          ? t('class-dashboard.leaders')
                          : r === 'Follower'
                          ? t('class-dashboard.followers')
                          : 'Couple'}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Field 2: Depositor Name */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider block">
                  {language === 'KR' ? '입금자명' : 'Depositor Name'}
                </label>
                <input
                  type="text"
                  value={editDepositor}
                  onChange={(e) => setEditDepositor(e.target.value)}
                  className="w-full px-4 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600 font-bold text-slate-800"
                  placeholder={language === 'KR' ? '실제 입금자명을 입력하세요' : 'Enter depositor name'}
                />
              </div>

              {/* Field 3: Applicant Memo */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider block">
                  {language === 'KR' ? '입금메모' : 'Deposit Memo'}
                </label>
                <textarea
                  value={editMemo}
                  onChange={(e) => setEditMemo(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600 font-bold text-slate-800 resize-none"
                  placeholder={language === 'KR' ? '입금 관련 메모를 기재하세요' : 'Enter deposit memo'}
                />
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="px-5 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-2">
              <button
                onClick={() => setEditingGroupedReg(null)}
                className="px-4 py-2 bg-slate-200 text-slate-600 hover:bg-slate-300 rounded-xl font-bold text-xs active:scale-95 transition-all"
              >
                {language === 'KR' ? '취소' : 'Cancel'}
              </button>
              <button
                onClick={handleUpdate}
                className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-xl font-bold text-xs active:scale-95 transition-all shadow-md shadow-blue-100"
              >
                {language === 'KR' ? '저장' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DETAILED COCKPIT FULLSCREEN VIEW */}
      {selectedDashboardClass && (() => {
        const currentClassObj = monthClasses.find(c => c.id === selectedDashboardClass);
        const selectedDetails = dashboardClassDetails[selectedDashboardClass];
        return (
          <div className="fixed inset-0 z-[100] bg-background flex flex-col font-body-md antialiased overflow-y-auto pb-24 animate-in fade-in duration-300">
            {/* Top Navigation */}
            <header className="sticky top-0 z-40 bg-white border-b border-outline-variant flex items-center px-4 py-4 justify-between shrink-0">
              <button 
                onClick={() => {
                  closeDashboardClassModal();
                  setShowVideoInput(false);
                  setIsEditingComment(false);
                }}
                aria-label="Go back" 
                className="text-on-surface hover:bg-surface-variant p-2 rounded-full transition-colors active:scale-95 flex items-center justify-center"
              >
                <span className="material-symbols-outlined">arrow_back</span>
              </button>
              <div className="flex-1 px-4 text-center">
                <h1 className="font-sans font-black text-[16px] text-[#0057bd] truncate">{currentClassObj?.title || selectedDetails?.title}</h1>
              </div>
              <div className="w-10"></div>
            </header>

            {/* 강사 프로필 리스트 (헤더 바로 아래 배치) */}
            {currentClassObj?.instructors && currentClassObj.instructors.length > 0 && (
              <div className="px-4 py-3 bg-slate-50 border-b border-outline-variant flex items-center gap-3 overflow-x-auto no-scrollbar shrink-0">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider shrink-0">{language === 'KR' ? '강사진' : 'Instructors'}</span>
                <div className="flex items-center gap-2">
                  {currentClassObj.instructors.map((ins: any, idx: number) => (
                    <div key={idx} className="flex items-center gap-1.5 bg-white border border-slate-200/80 rounded-full pl-1 pr-2.5 py-0.5 shadow-2xs">
                      <div className="w-6 h-6 rounded-full bg-slate-100 overflow-hidden flex-shrink-0 flex items-center justify-center">
                        {(() => {
                          const imgKey = `instructor-${ins.userId || ins.uid || idx}`;
                          const hasError = dashboardImageErrors[imgKey];
                          const displaySrc = ins.avatar || ins.image;
                          if (hasError || !displaySrc) {
                            return (
                              <div className="w-full h-full flex items-center justify-center text-slate-400 bg-slate-100">
                                <span className="material-symbols-outlined text-xs">person</span>
                              </div>
                            );
                          }
                          return (
                            <img 
                              src={displaySrc} 
                              alt={ins.name} 
                              className="w-full h-full object-cover" 
                              onError={() => {
                                setDashboardImageErrors(prev => ({ ...prev, [imgKey]: true }));
                              }}
                            />
                          );
                        })()}
                      </div>
                      <span className="text-[11px] font-black text-slate-700 leading-none">{ins.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Restricted Access Notice */}
            <div className="bg-tertiary-fixed text-on-tertiary-fixed py-2 px-4 flex items-center justify-center gap-2 border-b border-outline-variant shrink-0">
              <span className="material-symbols-outlined text-[16px] icon-fill">lock</span>
              <span className="font-label-sm text-label-sm uppercase tracking-wider">{language === 'KR' ? '제한구역: 참가자 및 강사 전용' : 'RESTRICTED: PARTICIPANTS & INSTRUCTOR ONLY'}</span>
            </div>

            <main className="flex-1 flex flex-col gap-6">
              {/* Weekly Details Section */}
              <section className="flex flex-col gap-6 pt-4">
                {/* Progress Indicators / Tabs */}
                <div className="flex overflow-x-auto no-scrollbar gap-2 pb-2 px-4">
                  {(() => {
                    const scheduleCount = Math.max(currentClassObj?.schedule?.length || 0, 4);
                    const sortedSched = currentClassObj?.schedule ? [...currentClassObj.schedule].sort((a, b) => a.date.localeCompare(b.date)) : [];
                    
                    return Array.from({ length: scheduleCount }).map((_, i) => {
                      const sched = sortedSched[i];
                      const isActive = activeWeekIndex === i;
                      const isCompleted = sched ? new Date(sched.date.replace(/\./g, '-')) < new Date() : false;
                      
                      return (
                        <button
                          key={i}
                          onClick={() => setActiveWeekIndex(i)}
                          className={`flex-shrink-0 flex flex-col items-center gap-1 min-w-[72px] rounded-xl p-2 transition-all ${
                            isActive
                              ? 'bg-primary-container border-2 border-primary shadow-sm'
                              : 'bg-surface-container-lowest border border-outline-variant opacity-60'
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            isActive
                              ? 'bg-primary text-on-primary font-bold'
                              : isCompleted
                              ? 'bg-green-100 text-green-700'
                              : 'bg-slate-100 text-slate-500'
                          }`}>
                            {isCompleted && !isActive ? (
                              <span className="material-symbols-outlined text-[18px]">check</span>
                            ) : (
                              <span className="text-xs font-bold">{i + 1}</span>
                            )}
                          </div>
                          <span className={`text-[11px] ${isActive ? 'font-black text-on-primary-container' : 'text-on-surface-variant font-medium'}`}>Week {i + 1}</span>
                        </button>
                      );
                    });
                  })()}
                </div>

                {/* 1. PLANNED LESSON */}
                <div className="px-4">
                  <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-card-padding shadow-sm flex flex-col gap-3">
                    <h3 className="font-sans font-black text-[13px] text-[#0057bd] uppercase flex items-center gap-1 tracking-tight">
                      <span className="material-symbols-outlined text-[16px]">menu_book</span>
                      {language === 'KR' ? '수업목표' : 'LESSON GOAL'}
                    </h3>
                    <p className="font-body-md text-body-md text-on-surface bg-surface p-3 rounded-lg border border-surface-variant leading-relaxed">
                      {(() => {
                        const sortedSched = currentClassObj?.schedule ? [...currentClassObj.schedule].sort((a, b) => a.date.localeCompare(b.date)) : [];
                        return sortedSched[activeWeekIndex]?.content || currentClassObj?.description || (language === 'KR' ? '등록된 수업 진도 계획이 아직 없습니다.' : 'No planned lesson details available.');
                      })()}
                    </p>
                  </div>
                </div>
              </section>

              {/* Post-Class Records Section */}
              <section className="px-4">
                <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-card-padding shadow-sm flex flex-col gap-5">
                  {/* DEMO VIDEO */}
                  <div className="flex flex-col gap-2">
                    <h3 className="font-sans font-black text-[13px] text-[#0057bd] uppercase flex items-center gap-1 tracking-tight">
                      <span className="material-symbols-outlined text-[16px]">videocam</span>
                      {language === 'KR' ? '수업 영상 및 데모' : 'DEMO VIDEO'}
                    </h3>
                    {(() => {
                      const videoUrl = currentClassObj?.videoUrl;
                      
                      return (
                        <div className="flex flex-col gap-2">
                          <div 
                            onClick={() => {
                              if (videoUrl) {
                                window.open(videoUrl, '_blank');
                              } else {
                                setShowVideoInput(!showVideoInput);
                              }
                            }}
                            className="relative w-full aspect-video bg-surface-container rounded-lg border border-outline-variant flex items-center justify-center group cursor-pointer overflow-hidden shadow-sm"
                          >
                            <div className="absolute inset-0 bg-gradient-to-tr from-surface-variant to-surface-container-high opacity-50"></div>
                            {videoUrl ? (
                              <>
                                <div className="w-14 h-14 bg-primary text-on-primary rounded-full flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform duration-200 z-10">
                                  <span className="material-symbols-outlined text-3xl icon-fill">play_arrow</span>
                                </div>
                                <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/60 to-transparent z-10">
                                  <span className="font-label-sm text-label-sm text-white font-black">
                                    {language === 'KR' ? `수업 녹화 영상 - ${activeWeekIndex + 1}주차` : `Class Recording - Week ${activeWeekIndex + 1}`}
                                  </span>
                                </div>
                              </>
                            ) : (
                              <div className="flex flex-col items-center gap-2 p-4 text-center z-10 animate-in fade-in">
                                <span className="material-symbols-outlined text-3xl text-primary">add_link</span>
                                <span className="text-xs font-black text-primary underline">
                                  {language === 'KR' ? '영상이 없습니다. 클릭하여 영상 등록' : 'No video. Click to register video'}
                                </span>
                              </div>
                            )}
                          </div>

                          {showVideoInput && !videoUrl && (
                            <div className="flex gap-2 items-center mt-1 p-2 bg-white rounded-xl border border-slate-200/80 shadow-2xs animate-in slide-in-from-top-2 duration-200">
                              <input
                                type="url"
                                value={videoInputLink}
                                onChange={(e) => setVideoInputLink(e.target.value)}
                                placeholder="https://..."
                                className="flex-1 px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600 font-bold text-slate-800"
                              />
                              <button
                                onClick={async () => {
                                  if (!videoInputLink.trim()) {
                                    toast.warning(t('class-dashboard.toast.enter_video_link'));
                                    return;
                                  }
                                  try {
                                    await groupService.updateClass(group.id, selectedDashboardClass, { videoUrl: videoInputLink });
                                    toast.success(t('class-dashboard.toast.video_registered'));
                                    setShowVideoInput(false);
                                    setVideoInputLink('');
                                  } catch (e) {
                                    console.error(e);
                                    toast.error(t('class-dashboard.toast.video_register_failed'));
                                  }
                                }}
                                className="px-3 py-1.5 bg-[#0057bd] text-white rounded-lg font-black text-[11px] hover:bg-[#004bb4] active:scale-95"
                              >
                                {language === 'KR' ? '등록' : 'Register'}
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                  {/* INSTRUCTOR COMMENTS */}
                  <div className="flex flex-col gap-2 border-t border-outline-variant pt-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-sans font-black text-[13px] text-[#0057bd] uppercase flex items-center gap-1 tracking-tight">
                        <span className="material-symbols-outlined text-[16px]">comment</span>
                        {language === 'KR' ? '강사 코멘트' : 'INSTRUCTOR COMMENTS'}
                      </h3>
                      {isInstructor && (
                        <button
                          onClick={() => {
                            setInstructorCommentInput(currentClassObj?.instructorComment || '');
                            setIsEditingComment(!isEditingComment);
                          }}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-[10px] font-black border border-slate-200/60 transition-all flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-[12px]">{isEditingComment ? 'close' : 'edit'}</span>
                          {isEditingComment ? (language === 'KR' ? '닫기' : 'Close') : (language === 'KR' ? '코멘트 등록' : 'Add Comment')}
                        </button>
                      )}
                    </div>
                    
                    {isEditingComment && isInstructor ? (
                      <div className="flex flex-col gap-2 mt-1 animate-in slide-in-from-top-2 duration-200">
                        <textarea
                          value={instructorCommentInput}
                          onChange={(e) => setInstructorCommentInput(e.target.value)}
                          rows={3}
                          className="w-full px-4 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600 font-bold text-slate-800 resize-none"
                          placeholder={language === 'KR' ? '강사 코멘트를 기재하세요' : 'Enter instructor comment'}
                        />
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => setIsEditingComment(false)}
                            className="px-3 py-1.5 bg-slate-200 text-slate-600 rounded-lg font-black text-[11px]"
                          >
                            {language === 'KR' ? '취소' : 'Cancel'}
                          </button>
                          <button
                            onClick={async () => {
                              try {
                                await groupService.updateClass(group.id, selectedDashboardClass, { instructorComment: instructorCommentInput });
                                toast.success(t('class-dashboard.toast.instructor_comment_saved'));
                                setIsEditingComment(false);
                              } catch (e) {
                                console.error(e);
                                toast.error(t('class-dashboard.toast.instructor_comment_save_failed'));
                              }
                            }}
                            className="px-3 py-1.5 bg-[#0057bd] text-white rounded-lg font-black text-[11px]"
                          >
                            {language === 'KR' ? '등록' : 'Register'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="font-body-md text-body-md text-on-surface bg-surface p-4 rounded-lg border border-surface-variant shadow-inner">
                        <p className="leading-relaxed whitespace-pre-line">
                          {currentClassObj?.instructorComment || (language === 'KR' 
                            ? '참가자분들의 열정 덕분에 멋진 피드백이 쌓이고 있습니다. 다음 주차에는 한 단계 더 깊은 댄스 커넥션을 이어가겠습니다.' 
                            : 'Instructor feedback is being compiled. We will follow up with deeper connection techniques next week.')}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </section>

              {/* Student Management Section (Accordion) */}
              <section className="flex flex-col gap-4 px-4">
                <details open className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-sm group">
                  <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-surface-container-low transition-colors border-b border-outline-variant bg-slate-50/50">
                    <h2 className="font-sans font-black text-[15px] text-[#2d3435] tracking-tight">{language === 'KR' ? '질문 및 피드백 스레드' : 'Q&A & Feedback Thread'}</h2>
                    <div className="flex items-center gap-3">
                      <span className="bg-slate-100 text-slate-600 font-black text-[11px] px-3 py-1.5 rounded-full">
                        {currentClassObj?.feedbacks?.length || 0}{language === 'KR' ? '개 의견' : ' comments'}
                      </span>
                      <span className="material-symbols-outlined text-outline transition-transform duration-200 group-open:rotate-180">expand_more</span>
                    </div>
                  </summary>
                  <div className="p-4 bg-surface-bright flex flex-col gap-4">
                    <div className="space-y-3.5 max-h-[300px] overflow-y-auto pr-1">
                      {currentClassObj?.feedbacks && currentClassObj.feedbacks.length > 0 ? (
                        [...currentClassObj.feedbacks].sort((a: any, b: any) => a.createdAt - b.createdAt).map((fb: any) => {
                          const isFbOwner = fb.userId === resolvedOwnerId;
                          return (
                            <div key={fb.id} className="flex gap-2.5 items-start">
                              <div className="w-8 h-8 rounded-full bg-slate-100 overflow-hidden shrink-0 flex items-center justify-center">
                                {(() => {
                                  const imgKey = `feedback-${fb.id}`;
                                  const hasError = dashboardImageErrors[imgKey];
                                  if (hasError || !fb.userAvatar) {
                                    return (
                                      <div className="w-full h-full flex items-center justify-center text-slate-400 bg-slate-200">
                                        <span className="material-symbols-outlined text-sm">person</span>
                                      </div>
                                    );
                                  }
                                  return (
                                    <img 
                                      src={fb.userAvatar} 
                                      alt={fb.userName} 
                                      className="w-full h-full object-cover" 
                                      onError={() => {
                                        setDashboardImageErrors(prev => ({ ...prev, [imgKey]: true }));
                                      }}
                                    />
                                  );
                                })()}
                              </div>
                              <div className={`flex flex-col p-3 rounded-2xl border max-w-[85%] ${
                                isFbOwner 
                                  ? 'bg-[#e2dfff]/20 border-[#e2dfff]/30 text-indigo-900 font-bold' 
                                  : 'bg-white border-slate-100 shadow-2xs font-medium'
                              }`}>
                                <div className="flex items-center gap-1.5">
                                  <span className="font-black text-[11px]">{fb.userName}</span>
                                  {isFbOwner && (
                                    <span className="text-[8px] font-black text-indigo-600 bg-[#e2dfff] px-1 py-0.2 rounded-md uppercase scale-90 shrink-0">
                                      {language === 'KR' ? '강사' : 'Instructor'}
                                    </span>
                                  )}
                                </div>
                                <p className="text-[12px] text-slate-700 mt-1 leading-relaxed whitespace-pre-line">{fb.content}</p>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <p className="text-xs text-slate-400 italic py-4 text-center">
                          {language === 'KR' ? '첫 질문이나 피드백을 등록해 보세요!' : 'Leave the first question or feedback!'}
                        </p>
                      )}
                    </div>

                    <div className="mt-2 pt-3 border-t border-slate-100 flex gap-2 items-center">
                      <input
                        type="text"
                        value={feedbackText}
                        onChange={(e) => setFeedbackText(e.target.value)}
                        placeholder={language === 'KR' ? '질문이나 피드백을 입력하세요' : 'Enter question or feedback'}
                        className="flex-1 px-4 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600 font-bold text-slate-800"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleRegisterFeedback();
                          }
                        }}
                      />
                      <button
                        onClick={handleRegisterFeedback}
                        className="px-3.5 py-2 bg-[#0057bd] text-white rounded-xl font-black text-xs hover:bg-[#004bb4] active:scale-95 transition-all shrink-0"
                      >
                        {language === 'KR' ? '등록' : 'Post'}
                      </button>
                    </div>
                  </div>
                </details>
              </section>

              {/* Roster Section */}
              <section className="px-4 pb-6">
                <details open className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-sm group">
                  <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-surface-container-low transition-colors border-b border-outline-variant bg-slate-50/50">
                    <h2 className="font-sans font-black text-[15px] text-[#2d3435] tracking-tight">{language === 'KR' ? '참가자 명단' : 'Roster'}</h2>
                    <div className="flex items-center gap-3">
                      {(() => {
                        const stats = classRealtimeStats[selectedDashboardClass] || { leaders: 0, followers: 0 };
                        return (
                          <span className="bg-surface-variant text-on-surface-variant font-black text-[11px] px-3 py-1.5 rounded-full">
                            L: {stats.leaders} / F: {stats.followers} • Active
                          </span>
                        );
                      })()}
                      <span className="material-symbols-outlined text-outline transition-transform duration-200 group-open:rotate-180">expand_more</span>
                    </div>
                  </summary>
                  <div className="p-3 bg-surface border-y border-outline-variant flex flex-col gap-1">
                    <span className="font-label-sm text-label-sm text-on-surface-variant uppercase font-black">{language === 'KR' ? '수강생 정보 및 주차별 출결' : 'Student Info & Weekly Attendance'}</span>
                  </div>
                  <div className="flex flex-col divide-y divide-outline-variant bg-surface-bright">
                    {(() => {
                      const membersList = classRealtimeStats[selectedDashboardClass]?.membersList || [];
                      if (membersList.length === 0) {
                        return (
                          <p className="text-xs text-slate-400 italic py-6 text-center">
                            {language === 'KR' ? '수강 신청 완료된 수강생이 아직 없습니다.' : 'No students registered for this class yet.'}
                          </p>
                        );
                      }
                      
                      const leaders = membersList.filter(reg => (reg.role || 'Leader') === 'Leader' || reg.role === 'Couple');
                      const followers = membersList.filter(reg => reg.role === 'Follower' || reg.role === 'Couple');

                      const renderMemberRow = (reg: any, roleKey: string) => {
                        const isLeader = roleKey === 'Leader';
                        const badgeColor = isLeader ? 'text-primary bg-primary-fixed' : 'text-secondary bg-secondary-fixed';
                        
                        return (
                          <div key={reg.id} className="flex flex-col gap-3 p-3 hover:bg-surface-container-low transition-colors">
                            <div className="flex items-center gap-3">
                              {reg.userId ? (
                                <UserBadge
                                  uid={reg.userId}
                                  nickname={reg.applicantName}
                                  avatarSize="w-10 h-10"
                                  nameClassName="font-body-md text-body-md text-on-surface font-black leading-tight"
                                  nativeClassName="text-[10px] font-semibold text-slate-400 ml-1.5"
                                />
                              ) : (
                                <div className="flex items-center gap-2">
                                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                                    <span className="material-symbols-outlined text-xl">person</span>
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="font-body-md text-body-md text-on-surface font-black leading-tight">{reg.applicantName}</span>
                                    <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-1 py-0.5 rounded mt-0.5 inline-block w-fit">NON-MEMBER</span>
                                  </div>
                                </div>
                              )}
                              <span className={`font-label-sm text-label-sm px-1.5 py-0.5 rounded ${badgeColor} font-black scale-90`}>
                                {isLeader ? (language === 'KR' ? '리더' : 'Leader') : (language === 'KR' ? '팔로워' : 'Follower')}
                              </span>
                            </div>
                            <div className="grid grid-cols-4 gap-2 pt-1">
                              {[1, 2, 3, 4].map((w) => {
                                const sortedSched = currentClassObj?.schedule ? [...currentClassObj.schedule].sort((a, b) => a.date.localeCompare(b.date)) : [];
                                const sched = sortedSched[w - 1];
                                
                                const now = new Date();
                                let isFuture = true;
                                if (sched && sched.date) {
                                  isFuture = new Date(sched.date.replace(/\./g, '-')) > now;
                                }
                                
                                const attendanceMap = reg.attendance || {};
                                const isChecked = isFuture 
                                  ? false 
                                  : (attendanceMap[w] !== undefined ? attendanceMap[w] : true);
                                
                                return (
                                  <div key={w} className="flex flex-col items-center gap-1 bg-white py-1.5 rounded-xl border border-slate-100/60 shadow-3xs">
                                    <span className="font-label-sm text-label-sm text-on-surface-variant font-bold">W{w}</span>
                                    <button 
                                      disabled={isFuture}
                                      onClick={() => handleToggleAttendance(reg, w, isChecked)}
                                      className={`relative inline-flex items-center cursor-pointer transition-all ${isFuture ? 'opacity-40 cursor-not-allowed' : ''}`}
                                    >
                                      <div className={`w-8 h-4 rounded-full transition-all relative ${
                                        isChecked ? 'bg-emerald-500' : 'bg-slate-200'
                                      }`}>
                                        <div className={`absolute top-[2px] left-[2px] bg-white rounded-full h-3 w-3 transition-all transform ${
                                          isChecked ? 'translate-x-4' : 'translate-x-0'
                                        }`}></div>
                                      </div>
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      };

                      return (
                        <div className="flex flex-col divide-y divide-outline-variant">
                          {leaders.length > 0 && (
                            <div className="pb-4">
                              <div className="px-3 py-2 bg-slate-50/70 font-black text-[11px] text-indigo-600 flex items-center justify-between border-b border-outline-variant/60">
                                <span>{language === 'KR' ? '리더 명단' : 'Leader Roster'}</span>
                                <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full scale-95 font-bold">{leaders.length}</span>
                              </div>
                              <div className="divide-y divide-outline-variant/40 bg-white">
                                {leaders.map(reg => renderMemberRow(reg, 'Leader'))}
                              </div>
                            </div>
                          )}
                          
                          {followers.length > 0 && (
                            <div className="pb-4">
                              <div className="px-3 py-2 bg-slate-50/70 font-black text-[11px] text-rose-500 flex items-center justify-between border-b border-outline-variant/60">
                                <span>{language === 'KR' ? '팔로워 명단' : 'Follower Roster'}</span>
                                <span className="bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full scale-95 font-bold">{followers.length}</span>
                              </div>
                              <div className="divide-y divide-outline-variant/40 bg-white">
                                {followers.map(reg => renderMemberRow(reg, 'Follower'))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </details>
              </section>
            </main>
          </div>
        );
      })()}

    </div>
  );
}
