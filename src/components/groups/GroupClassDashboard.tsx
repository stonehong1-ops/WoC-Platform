import React, { useState, useEffect, useMemo } from 'react';
import { Group, GroupClass, ClassDiscount, ClassRegistration } from '@/types/group';
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
  onApplyClick: (monthStr: string) => void;
}

const CURRENCY_SYMBOL: Record<string, string> = { KRW: '₩', USD: '$', EUR: '€' };
const getCurrencySymbol = (c: string) => CURRENCY_SYMBOL[c] || c + ' ';

export default function GroupClassDashboard({ group, onApplyClick }: GroupClassDashboardProps) {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { openModal: openClassFlow } = useModalNavigation('classFlow');

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

  const [ownerInfo, setOwnerInfo] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'list' | 'registrations' | 'payments'>('list');
  const [viewMode, setViewMode] = useState<'personal' | 'byClass'>('personal');

  // Detail & Editing Modals State
  const [selectedGroupedReg, setSelectedGroupedReg] = useState<any | null>(null);
  const [editingGroupedReg, setEditingGroupedReg] = useState<any | null>(null);

  // Edit fields
  const [editRole, setEditRole] = useState<'Leader' | 'Follower' | 'Couple'>('Leader');
  const [editDepositor, setEditDepositor] = useState('');
  const [editMemo, setEditMemo] = useState('');

  const currentMonthStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
  const isRegistrationOpen = useMemo(() => {
    if (!group?.classPaymentSettings?.openMonths) return true;
    return group.classPaymentSettings.openMonths.includes(currentMonthStr);
  }, [group?.classPaymentSettings?.openMonths, currentMonthStr]);

  const displayMonth = language === 'KR'
    ? `${currentDate.getFullYear()}년 ${currentDate.getMonth() + 1}월`
    : `${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][currentDate.getMonth()]} ${currentDate.getFullYear()}`;

  useEffect(() => {
    if (group?.ownerId) {
      const fetchOwner = async () => {
        const userDoc = await getDoc(doc(db, 'users', group.ownerId as string));
        if (userDoc.exists()) {
          setOwnerInfo({ id: group.ownerId, ...userDoc.data() });
        }
      };
      fetchOwner();
    }
  }, [group?.ownerId]);

  const monthClasses = useMemo(() => allClasses.filter(c => {
    if (c.targetMonth) return c.targetMonth === currentMonthStr;
    if (c.schedule?.length) return c.schedule.some(s => s.date?.startsWith(currentMonthStr));
    return false;
  }), [allClasses, currentMonthStr]);

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

  const handlePrevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const handleChatWithOwner = async () => {
    if (!user || !ownerInfo?.id) return;
    try {
      const roomId = await chatService.getOrCreatePrivateRoom([user.uid, ownerInfo.id], user.uid);
      router.push(`/chat?roomId=${roomId}`);
    } catch (error) {
      console.error("Chat error:", error);
    }
  };

  const handleRegisterClass = () => {
    onApplyClick(currentMonthStr);
  };

  const handleItemClick = (item: any) => {
    openClassFlow('apply', { modal: item.id, month: currentMonthStr });
  };

  const getDayOfWeek = (dateStr: string): string => {
    if (!dateStr) return '';
    const cleanDate = dateStr.replace(/\./g, '-');
    const d = new Date(cleanDate);
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
      const day = getDayOfWeek(sortedSched[0]?.date);
      return day || 'MON';
    }
    return 'MON';
  };

  const getStartTime = (cls: any): string => {
    if (cls.startTime) {
      const match = cls.startTime.match(/^(\d{1,2}):(\d{2})/);
      if (match) return `${match[1].padStart(2, '0')}:${match[2]}`;
      return cls.startTime;
    }
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

  // Class Stats for 'By Class' view
  const classStats = useMemo(() => {
    return sortedMonthClasses.map(cls => {
      const clsRegs = filteredRegistrations.filter(r => r.classId === cls.id && r.status !== 'CANCELED');
      const leaders = clsRegs.filter(r => r.role === 'Leader');
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
          label: language === 'KR' ? '송금완료' : 'Reported',
          bg: 'bg-blue-50 border-blue-100 text-blue-600',
          icon: 'info'
        };
      case 'PAYMENT_COMPLETED':
        return {
          label: language === 'KR' ? '입금완료' : 'Completed',
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
      return `${reg.classTitle}${daySuffix} (${count}${language === 'KR' ? '개 수업' : ' classes'})`;
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

  const formatDateTime = (timeAny: any): string => {
    if (!timeAny) return '-';
    let d: Date;
    if (timeAny.toDate) {
      d = timeAny.toDate();
    } else {
      d = new Date(timeAny);
    }
    if (isNaN(d.getTime())) return '-';
    
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    
    return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
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
      toast.success(language === 'KR' ? '신청 정보가 정상적으로 수정되었습니다.' : 'Registration details updated successfully.');
      setEditingGroupedReg(null);
    } catch (error) {
      console.error("Error updating registrations:", error);
      toast.error(language === 'KR' ? '정보 수정에 실패했습니다.' : 'Failed to update details.');
    }
  };

  return (
    <div className="flex flex-col w-full animate-in fade-in slide-in-from-bottom-4 duration-500 pb-[120px]">

      {/* Month Navigation Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#f2f4f4] bg-white/80 backdrop-blur-sm">
        <button onClick={handlePrevMonth} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-[#f2f4f4] transition-colors">
          <span className="material-symbols-outlined text-xl text-[#596061]">chevron_left</span>
        </button>
        <div className="flex flex-col items-center">
          <span className="text-[10px] font-black text-primary tracking-widest uppercase">{t('class-dashboard.schedule')}</span>
          <h2 className="text-[18px] font-black text-[#2d3435]">{displayMonth}</h2>
        </div>
        <button onClick={handleNextMonth} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-[#f2f4f4] transition-colors">
          <span className="material-symbols-outlined text-xl text-[#596061]">chevron_right</span>
        </button>
      </div>

      {/* Sub Tabs Bar */}
      <div className="w-full px-4 py-2 flex items-center gap-2 overflow-x-auto no-scrollbar border-b border-[#f2f4f4] bg-white">
        {[
          { id: 'list', label: t('class-dashboard.tab.list') },
          { id: 'registrations', label: t('class-dashboard.tab.registrations') },
          { id: 'payments', label: t('class-dashboard.tab.payments') }
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
      {activeTab === 'list' && (
        <>
          {/* Stats Summary - product count based */}
          <div className="grid grid-cols-2 gap-2 px-4 py-3">
            <div className="bg-[#fff8f0] border border-[#d97706]/15 rounded-xl p-3 flex flex-col items-center justify-center">
              <span className="text-[10px] font-black text-[#d97706] uppercase tracking-widest">{t('class-dashboard.bundle')}</span>
              <span className="text-[22px] font-black text-[#d97706]">{monthBundles.length}</span>
            </div>
            <div className="bg-[#f0fdf4] border border-[#059669]/15 rounded-xl p-3 flex flex-col items-center justify-center">
              <span className="text-[10px] font-black text-[#059669] uppercase tracking-widest">{t('class-dashboard.class')}</span>
              <span className="text-[22px] font-black text-[#059669]">{monthClasses.length}</span>
            </div>
          </div>

          {/* Item List */}
          <div className="px-4 pb-4 space-y-3">
            {allItems.length > 0 ? (
              (() => {
                let prevClassDay = '';
                return allItems.map((item, idx) => {
                  const colors = getItemTypeColor(item.itemType);
                  const icon = getItemTypeIcon(item.itemType);
                  const imgSrc = item.imageUrl || item.image || item.photoURL || item.avatar || group.coverImage || group.logo || '';
                  const timeDisplay = item.schedule?.[0]?.timeSlot || (item.startTime ? `${item.startTime}${item.endTime ? ' - ' + item.endTime : ''}` : '');

                  const isClass = item.itemType === 'class';
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
                        className="bg-white rounded-xl p-4 shadow-sm border border-[#e0e4e5]/60 flex gap-4 active:scale-[0.99] transition-transform cursor-pointer hover:shadow-md"
                      >
                        {/* Thumbnail */}
                        <div className="w-20 h-20 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0">
                          {imgSrc ? (
                            <ImageWithFallback src={imgSrc} alt={item.title} className="w-full h-full object-cover" fallbackType="gallery" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-300">
                              <span className="material-symbols-outlined text-3xl">{icon}</span>
                            </div>
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 flex flex-col justify-between min-w-0">
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
        <div className="px-4 py-3 space-y-4 animate-in fade-in duration-300">
          {/* Sub View Toggle Button */}
          <div className="flex items-center justify-end">
            <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200/50">
              <button
                onClick={() => setViewMode('personal')}
                className={`px-3 py-1 rounded-md text-[11px] font-black uppercase tracking-wider transition-all duration-200 ${
                  viewMode === 'personal'
                    ? 'bg-white text-[#0057bd] shadow-sm border border-slate-200/80'
                    : 'text-slate-400 hover:text-slate-500'
                }`}
              >
                {t('class-dashboard.view.personal')}
              </button>
              <button
                onClick={() => setViewMode('byClass')}
                className={`px-3 py-1 rounded-md text-[11px] font-black uppercase tracking-wider transition-all duration-200 ${
                  viewMode === 'byClass'
                    ? 'bg-white text-[#0057bd] shadow-sm border border-slate-200/80'
                    : 'text-slate-400 hover:text-slate-500'
                }`}
              >
                {t('class-dashboard.view.class')}
              </button>
            </div>
          </div>

          {/* VIEW: Personal Grouped Cards */}
          {viewMode === 'personal' && (
            <div className="space-y-3">
              {groupedRegistrations.length > 0 ? (
                groupedRegistrations.map((g: any) => {
                  const representativeReg = g.registrations[0];
                  const hasMultiple = g.registrations.length > 1;
                  const firstTitle = representativeReg?.classTitle || '';
                  const totalCount = g.registrations.length;
                  const isMe = user && g.userId === user.uid;

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

                      {/* Middle Side: Dynamic Item Link */}
                      <div className="mt-3 bg-slate-50/75 rounded-xl p-3 border border-slate-100">
                        <button
                          onClick={() => setSelectedGroupedReg(g)}
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
                <div className="py-12 text-center bg-white rounded-2xl border border-slate-100">
                  <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">people</span>
                  <p className="text-slate-500 font-medium text-sm">{t('class-dashboard.noRegistrationsYet')}</p>
                </div>
              )}
            </div>
          )}

          {/* VIEW: Class Stats & Nickname Lists */}
          {viewMode === 'byClass' && (
            <div className="space-y-3">
              {classStats.length > 0 ? (
                classStats.map(({ class: cls, leaderCount, followerCount, registrations: clsRegs }) => {
                  return (
                    <article
                      key={cls.id}
                      className="bg-white rounded-2xl p-4 shadow-sm border border-[#e0e4e5]/60 space-y-3"
                    >
                      {/* Top: Class Title */}
                      <h4 className="font-extrabold text-[14px] text-[#2d3435] leading-tight">{cls.title}</h4>

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
                        <div className="pt-2 border-t border-slate-100">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">{t('class-dashboard.registeredMembers')}</span>
                          <div className="flex flex-wrap gap-1.5">
                            {clsRegs.map((reg) => {
                              return (
                                <div
                                  key={reg.id}
                                  className="flex items-center gap-1 bg-slate-50 border border-slate-150 rounded-full pl-1 pr-2.5 py-0.5 max-w-[130px] shrink-0"
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
                                </div>
                              );
                            })}
                          </div>
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
          )}
        </div>
      )}

      {activeTab === 'payments' && (
        <div className="px-4 py-3 space-y-4 animate-in fade-in duration-300">
          
          {/* SECTION 1: Personal Payments Highlights */}
          {user && myPayments.length > 0 && (
            <section className="bg-blue-50/20 border-2 border-[#0057bd] rounded-2xl p-4 space-y-3 relative overflow-hidden shadow-xs">
              <div className="absolute top-0 right-0 w-16 h-16 bg-[#0057bd]/5 rounded-bl-full flex items-center justify-center pointer-events-none">
                <span className="material-symbols-outlined text-[#0057bd] text-xl opacity-40">wallet</span>
              </div>
              <h4 className="font-extrabold text-[13px] text-[#0057bd] uppercase tracking-wider flex items-center gap-1">
                <span className="material-symbols-outlined text-base">account_balance_wallet</span>
                {language === 'KR' ? '내 입금 및 신청 상태' : 'My Payment Status'}
              </h4>
              <div className="space-y-2">
                {myPayments.map((reg) => {
                  const badge = getStatusBadge(reg.status);
                  return (
                    <div key={reg.id} className="bg-white/80 rounded-xl p-3 border border-blue-100/50 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-extrabold text-[12px] text-[#2d3435] truncate">{reg.classTitle}</p>
                        <p className="text-[10px] text-slate-400 font-bold mt-0.5">
                          {getCurrencySymbol(reg.currency || 'KRW')}{(reg.amount || 0).toLocaleString()}
                        </p>
                      </div>
                      <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full border text-[10px] font-black shrink-0 ${badge.bg}`}>
                        <span className="material-symbols-outlined text-[12px]">{badge.icon}</span>
                        {badge.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* SECTION 2: General Payments List */}
          <section className="space-y-3">
            <h4 className="font-extrabold text-[11px] text-slate-400 uppercase tracking-widest px-1">
              {language === 'KR' ? '전체 입금 현황 리스트' : 'All Payments Directory'}
            </h4>
            <div className="space-y-2.5">
              {allActivePayments.length > 0 ? (
                allActivePayments.map((reg) => {
                  const badge = getStatusBadge(reg.status);
                  const isMe = user && reg.userId === user.uid;

                  return (
                    <article
                      key={reg.id}
                      className={`bg-white rounded-xl p-3.5 shadow-xs border flex items-center justify-between gap-3 ${
                        isMe ? 'border-blue-200 bg-blue-50/10' : 'border-[#e0e4e5]/60'
                      }`}
                    >
                      <div className="min-w-0 space-y-1">
                        {/* Title */}
                        <h5 className="font-bold text-[13px] text-[#2d3435] truncate">{reg.classTitle}</h5>
                        
                        {/* Subline: Nickname + Amount */}
                        <div className="flex items-center gap-2">
                          {reg.userId ? (
                            <UserBadge
                              uid={reg.userId}
                              nickname={reg.applicantName}
                              avatarSize="w-4 h-4"
                              nameClassName="font-semibold text-[10px] text-slate-500 max-w-[65px] truncate"
                              nativeClassName="text-[8px] text-slate-400 max-w-[45px] truncate ml-0.5"
                            />
                          ) : (
                            <span className="font-semibold text-[10px] text-slate-500 truncate max-w-[110px]">
                              {reg.applicantName}
                            </span>
                          )}
                          <span className="text-[10px] font-bold text-slate-400 pr-1">
                            {getCurrencySymbol(reg.currency || 'KRW')}{(reg.amount || 0).toLocaleString()}
                          </span>
                        </div>
                      </div>

                      {/* Status */}
                      <span className={`flex items-center gap-0.5 px-2 py-0.5 rounded-full border text-[9px] font-black shrink-0 ${badge.bg}`}>
                        <span className="material-symbols-outlined text-[10px]">{badge.icon}</span>
                        {badge.label}
                      </span>
                    </article>
                  );
                })
              ) : (
                <div className="py-12 text-center bg-white rounded-2xl border border-slate-100">
                  <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">payments</span>
                  <p className="text-slate-500 font-medium text-sm">{t('class-dashboard.noRegistrationsYet')}</p>
                </div>
              )}
            </div>
          </section>
        </div>
      )}

      {/* STICKY BOTTOM ACTION BAR */}
      <div className="fixed bottom-[60px] md:bottom-[112px] left-0 right-0 z-[150] bg-white/95 backdrop-blur-sm border-t border-[#f2f4f4] px-4 py-3 flex gap-3 max-w-[768px] mx-auto">
        <button
          onClick={handleChatWithOwner}
          disabled={!isRegistrationOpen}
          className={`flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl font-bold text-sm transition-all border ${
            isRegistrationOpen
              ? 'bg-[#F1F5F9] text-[#596061] border-slate-200 active:scale-95'
              : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">chat</span>
          {t('class-dashboard.consultation')}
        </button>

        <button
          onClick={handleRegisterClass}
          disabled={!isRegistrationOpen}
          className={`flex-1 rounded-xl py-3.5 flex items-center justify-center gap-2 transition-all font-bold text-[15px] relative overflow-hidden group ${
            isRegistrationOpen
              ? 'bg-[#0057bd] text-white active:scale-95 shadow-md shadow-[#0057bd]/20'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
          }`}
        >
          {isRegistrationOpen && (
            <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out skew-x-12"></div>
          )}
          <span className="material-symbols-outlined text-[20px]">how_to_reg</span>
          {t('class-dashboard.registerClass')}
        </button>
      </div>

      {/* DETAIL MODAL (모바일 친화적인 바텀시트 모달) */}
      {selectedGroupedReg && (
        <div className="fixed inset-0 z-[999] bg-black/60 backdrop-blur-xs animate-in fade-in duration-200 flex items-end justify-center">
          {/* Click outside to close */}
          <div className="absolute inset-0" onClick={() => setSelectedGroupedReg(null)}></div>
          
          {/* Bottom Sheet Content */}
          <div className="w-full max-w-[768px] bg-white rounded-t-[32px] overflow-hidden shadow-2xl z-[1000] border-t border-slate-100 flex flex-col animate-in slide-in-from-bottom duration-300 max-h-[85vh]">
            {/* Handle bar */}
            <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto my-3 shrink-0 cursor-pointer" onClick={() => setSelectedGroupedReg(null)}></div>
            
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
                onClick={() => setSelectedGroupedReg(null)}
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
                    {includedClasses.length > 0 && (
                      <div className="mt-1 pl-3.5 border-l-2 border-slate-200/80 space-y-1.5 py-0.5">
                        {includedClasses.map((title, idx) => (
                          <div key={idx} className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#0057bd] shrink-0"></span>
                            <span className="truncate">{title}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* 3-Step compact status workflow */}
                    <div className="mt-2.5 pt-3.5 border-t border-slate-200/50 space-y-2">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">{language === 'KR' ? '진행 상태 워크플로우' : 'Progress Workflow'}</span>
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
                        {language === 'KR' ? '댄스 역할' : 'Dance Role'}: <strong className="text-slate-600">{reg.role || 'Leader'}</strong>
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

    </div>
  );
}
