'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { groupService } from '@/lib/firebase/groupService';
import { Group, GroupClass, ClassDiscount } from '@/types/group';
import { useAuth } from '@/components/providers/AuthProvider';

import { useLanguage } from '@/contexts/LanguageContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/clientApp';
import { toast } from 'sonner';

import { useBookingEngine } from '@/hooks/useBookingEngine';
import UnifiedCheckoutModal from '@/components/common/UnifiedCheckoutModal';
import ClassDetail from '@/components/class/ClassDetail';

const DAY_ORDER = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'] as const;
const DAY_LABELS: Record<string, string> = {
  MON: 'Monday', TUE: 'Tuesday', WED: 'Wednesday', THU: 'Thursday',
  FRI: 'Friday', SAT: 'Saturday', SUN: 'Sunday',
};
const DAY_COLORS: Record<string, string> = {
  MON: '#0057bd', TUE: '#7c3aed', WED: '#059669', THU: '#d97706',
  FRI: '#dc2626', SAT: '#0891b2', SUN: '#be185d',
};

function getDayOfWeek(dateStr: string): string {
  if (!dateStr) return '';
  const cleanDate = dateStr.replace(/\./g, '-');
  const d = new Date(cleanDate);
  if (isNaN(d.getTime())) return '';
  return ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'][d.getDay()];
}

function formatScheduleDates(schedule: { week: number; date: string }[]): string {
  if (!schedule || schedule.length === 0) return '';
  const days = schedule.map(s => {
    if (!s.date) return '';
    const cleanDate = s.date.replace(/\./g, '-');
    const d = new Date(cleanDate);
    return isNaN(d.getTime()) ? '' : String(d.getDate());
  }).filter(Boolean);
  return days.join(', ');
}

interface ClubClassSelectionPageProps {
  propGroupId?: string;
  propModalId?: string;
  isOverlay?: boolean;
  onClose?: () => void;
}

export default function ClubClassSelectionPage({
  propGroupId,
  propModalId,
  isOverlay = false,
  onClose
}: ClubClassSelectionPageProps = {}) {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const rawGroupId = (propGroupId || params?.groupId || params?.id) as string;
  const groupId = rawGroupId;
  const modalClassId = propModalId || searchParams.get('modal');
  const fromSource = searchParams.get('from');
  
  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedClasses, setSelectedClasses] = useState<Set<string>>(new Set());
  const [selectedClassDetail, setSelectedClassDetail] = useState<any | null>(null);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [passSelectedClassIds, setPassSelectedClassIds] = useState<Set<string>>(new Set());
  const [classPartners, setClassPartners] = useState<Record<string, string>>({});
  const { user, profile } = useAuth();
  const { language, t } = useLanguage();
  const [selectedRole, setSelectedRole] = useState<'leader' | 'follower' | null>(null);
  const [ownerInfo, setOwnerInfo] = useState<{name: string | null, localName: string | null, avatar: string | null, phone: string | null} | null>(null);

  // Firestore 하위 컬렉션 구독
  const [subClasses, setSubClasses] = useState<GroupClass[]>([]);
  const [subDiscounts, setSubDiscounts] = useState<ClassDiscount[]>([]);
  
  const monthParam = searchParams.get('month');
  const [currentDate, setCurrentDate] = useState<Date>(() => {
    if (monthParam) {
      const [y, m] = monthParam.split('-').map(Number);
      if (y && m) return new Date(y, m - 1, 1);
    }
    return new Date();
  });
  const [sortOption, setSortOption] = useState<'class' | 'name'>('class');
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const captureRef = useRef<HTMLDivElement>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [checkoutRole, setCheckoutRole] = useState<'leader' | 'follower'>('leader');
  const { createBooking, reportPayment, isLoading: isBooking } = useBookingEngine();

  // URL의 monthParam 변화를 실시간 감지하여 currentDate 상태 동기화
  useEffect(() => {
    if (monthParam) {
      const [y, m] = monthParam.split('-').map(Number);
      if (y && m) {
        setCurrentDate(new Date(y, m - 1, 1));
      }
    }
  }, [monthParam]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const handler = () => setIsScrolled(el.scrollTop > 60);
    el.addEventListener('scroll', handler, { passive: true });
    return () => el.removeEventListener('scroll', handler);
  }, [selectedClassDetail]);

  useEffect(() => {
    if (isApplyModalOpen && !selectedRole) {
      if (profile?.role) {
        setSelectedRole(profile.role as 'leader' | 'follower');
      } else if (profile?.gender) {
        const g = profile.gender.toLowerCase();
        if (g === 'male' || g === 'm') setSelectedRole('leader');
        else setSelectedRole('follower');
      } else {
        setSelectedRole('follower');
      }
    }
  }, [isApplyModalOpen, profile, selectedRole]);

  useEffect(() => {
    if (!groupId) return;
    
    const fetchGroupData = async () => {
      try {
        const groupData = await groupService.getGroup(groupId);
        setGroup(groupData);

        // 쿼리 매개변수 month가 없을 때만 오픈 월 기준으로 currentDate 설정
        if (!searchParams.get('month') && groupData?.classPaymentSettings?.openMonths && groupData.classPaymentSettings.openMonths.length > 0) {
          const now = new Date();
          const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
          const openMonths = [...groupData.classPaymentSettings.openMonths].sort();
          
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

        if (groupData?.ownerId) {
          const userDoc = await getDoc(doc(db, 'users', groupData.ownerId));
          if (userDoc.exists()) {
            const uData = userDoc.data();
            setOwnerInfo({
              name: uData.nickname || uData.name || null,
              localName: uData.localName || null,
              avatar: uData.photoURL || uData.avatar || null,
              phone: uData.phone || null
            });
          }
        }
      } catch (error) {
        console.error("Failed to fetch group data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchGroupData();
  }, [groupId, searchParams]);

  useEffect(() => {
    if (!groupId) return;
    const unsubC = groupService.subscribeClasses(groupId, setSubClasses);
    const unsubD = groupService.subscribeDiscounts(groupId, setSubDiscounts);
    return () => { unsubC(); unsubD(); };
  }, [groupId]);

  useEffect(() => {
    if (modalClassId && (subClasses.length > 0 || subDiscounts.length > 0)) {
      const all = [
        ...subDiscounts.map(d => ({ ...d, itemType: 'discount' as const })),
        ...subClasses.map(c => ({ ...c, itemType: 'class' as const }))
      ];
      const targetItem = all.find(item => item.id === modalClassId);
      if (targetItem) {
        setSelectedClassDetail(targetItem);
      }
    }
  }, [modalClassId, subClasses, subDiscounts]);

  // 상세보기 모달 닫기: propModalId로 열린 경우 전체 오버레이를 닫아 원래 화면으로 복귀.
  const closeDetailModal = useCallback(() => {
    setSelectedClassDetail(null);
    if (propModalId && onClose) {
      onClose();
    }
  }, [propModalId, onClose]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex justify-center items-center">
        <span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="min-h-screen bg-background flex flex-col justify-center items-center space-y-4">
        <span className="material-symbols-outlined text-4xl text-outline">error</span>
        <h2 className="font-['Plus_Jakarta_Sans'] text-[1.125rem] font-bold leading-[1.5rem] text-on-surface">Club not found</h2>
        <button onClick={() => isOverlay && onClose ? onClose() : router.back()} className="text-primary hover:underline">Go back</button>
      </div>
    );
  }

  const currentMonthStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
  const isRegistrationOpen = group.classPaymentSettings?.openMonths
    ? group.classPaymentSettings.openMonths.includes(currentMonthStr)
    : true;
  
  const monthNamesShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthDisplay = language === 'KR'
    ? `${currentDate.getMonth() + 1}월, ${currentDate.getFullYear()}`
    : `${monthNamesShort[currentDate.getMonth()]}(${String(currentDate.getMonth() + 1).padStart(2, '0')}), ${currentDate.getFullYear()}`;

  // 하위 컬렉션 데이터 사용 (레거시 임베디드 배열 폴백)
  const allGroupClasses = subClasses.length > 0 ? subClasses : (group.classes || []);
  const allGroupClassesOriginal = allGroupClasses;
  const classes = allGroupClasses.filter(cls => !cls.targetMonth || cls.targetMonth === currentMonthStr);
  const allDiscountsOriginal = subDiscounts.length > 0 ? subDiscounts : (group.discounts || []);
  const discounts = allDiscountsOriginal.filter(d => !d.targetMonth || d.targetMonth === currentMonthStr);

  const allPackagesOriginal = [
    ...allDiscountsOriginal.map(d => ({ ...d, itemType: 'discount' as const, amount: d.amount, currency: d.currency }))
  ];

  const allItemsOriginal = [...allPackagesOriginal, ...allGroupClassesOriginal.map(c => ({ ...c, itemType: 'class' as const }))];

  const packages = [
    ...discounts.map(d => ({ ...d, itemType: 'discount' as const, amount: d.amount, currency: d.currency }))
  ];

  const allItems = [...packages, ...classes.map(c => ({ ...c, itemType: 'class' as const }))];

  const handleCardClick = (item: any) => {
    setSelectedClassDetail(item);
    if (item.itemType === 'discount') {
      const passClasses = item.includedClassIds && item.includedClassIds.length > 0 
        ? allGroupClassesOriginal.filter(c => item.includedClassIds.includes(c.id))
        : allGroupClassesOriginal;
      setPassSelectedClassIds(new Set(passClasses.map(c => c.id)));
    }
  };

  const isDiscountSelected = selectedClasses.size > 0 && Array.from(selectedClasses).some(id => 
    subDiscounts.some(d => d.id === id)
  );

  const handleAddToBasket = (classId: string, itemType?: string) => {
    setSelectedClasses(prev => {
      let newSet = new Set(prev);
      if (itemType === 'discount') {
        newSet.clear();
      }
      newSet.add(classId);
      return newSet;
    });
    closeDetailModal(); // Close modal after adding
  };

  const handleCheckoutClick = () => {
    if (!selectedClassDetail) return;
    setCheckoutRole('leader'); // Default role
    setCheckoutModalOpen(true);
  };

  const handleDirectReserve = (cls: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedClassDetail({ ...cls, itemType: 'class' });
    setCheckoutRole('leader');
    setCheckoutModalOpen(true);
  };

  const handleCheckoutSubmit = async () => {
    if (!selectedClassDetail) return;
    try {
      const price = selectedClassDetail.amount || 0;
      const orderId = await createBooking({
        domain: 'class_daily',
        itemName: selectedClassDetail.title,
        itemImageUrl: selectedClassDetail.imageUrl || selectedClassDetail.image || selectedClassDetail.photoURL || selectedClassDetail.avatar || group?.coverImage || group?.logo || '',
        itemId: selectedClassDetail.id,
        hostId: group?.ownerId || '',
        totalAmount: price,
        currency: selectedClassDetail.currency || 'KRW',
        payload: {
          role: checkoutRole,
          classDate: selectedClassDetail.schedule?.[0]?.date || new Date().toISOString()
        }
      });
      return orderId;
    } catch (err: any) {
      alert(err.message || 'Booking failed');
      throw err;
    }
  };

  const handleRemoveFromBasket = (classId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedClasses(prev => {
      const newSet = new Set(prev);
      newSet.delete(classId);
      return newSet;
    });
  };

  const handleDownload = async () => {
    if (!captureRef.current || isDownloading) return;
    setIsDownloading(true);
    try {
      const { default: html2canvas } = await import('html2canvas-pro');
      const canvas = await html2canvas(captureRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        onclone: (document) => {
          const images = document.querySelectorAll('img');
          images.forEach((img) => {
            if (img.src && img.src.startsWith('http')) {
              const currentUrl = new URL(window.location.href);
              // Only proxy if it's not already same-origin
              if (!img.src.startsWith(currentUrl.origin)) {
                img.src = `${currentUrl.origin}/api/proxy/image?url=${encodeURIComponent(img.src)}`;
              }
            }
          });
        }
      });
      const link = document.createElement('a');
      const formattedMonthStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
      link.download = `${formattedMonthStr}-Class.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Download failed:', err);
      alert('Failed to download image. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  // Sort and group classes
  const sortedClasses = [...classes];
  if (sortOption === 'name') {
    sortedClasses.sort((a, b) => a.title.localeCompare(b.title));
  } // 'class' option implies original order from settings

  const classesByDay = new Map<string, GroupClass[]>();
  DAY_ORDER.forEach(day => classesByDay.set(day, []));

  sortedClasses.forEach(cls => {
    if (cls.schedule && cls.schedule.length > 0) {
      const days = new Set<string>();
      cls.schedule.forEach(s => {
        const day = getDayOfWeek(s.date);
        if (day) days.add(day);
      });
      days.forEach(day => {
        if (classesByDay.has(day)) classesByDay.get(day)!.push(cls);
      });
    }
  });

  const bank = group.classPaymentSettings?.bankDetails || group.bankDetails;



  return (
    <div className="fixed inset-0 z-[200] bg-white flex flex-col animate-in slide-in-from-bottom duration-300">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#f2f4f4] flex-shrink-0 bg-white z-10">
        <button onClick={() => isOverlay && onClose ? onClose() : router.back()} className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-[#f2f4f4] transition-colors">
          <span className="material-symbols-outlined text-xl text-[#596061]">arrow_back</span>
        </button>
        <div className="flex flex-col items-center">
          <h2 className="text-base font-black text-[#2d3435]">Class Schedule</h2>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Download Icon */}
          <button
            onClick={handleDownload}
            disabled={isDownloading}
            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-[#f0f4ff] transition-colors disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-xl text-[#0057bd]">
              {isDownloading ? 'progress_activity' : 'download'}
            </span>
          </button>
        </div>
      </div>

      {/* Scrollable Content (Poster style) */}
      <div className="flex-1 overflow-y-auto">
        <div ref={captureRef} className="bg-white px-5 py-6">
          {!isRegistrationOpen && (
            <div className="bg-rose-50 border border-rose-200 text-rose-600 rounded-xl px-4 py-3 text-xs font-bold mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-sm text-rose-500">warning</span>
              {language === 'KR' ? '지금은 수업신청이 불가합니다.' : 'Registrations are currently closed for this month.'}
            </div>
          )}
          
          {/* Title Banner */}
          <div className="bg-gradient-to-r from-[#0057bd] to-[#3b82f6] rounded-2xl p-5 mb-6 text-center shadow-lg shadow-blue-500/20">
            <p className="text-[10px] font-bold text-blue-200 uppercase tracking-[0.2em] mb-1">CLASS INFORMATION</p>
            <h1 className="text-xl font-black text-white mb-3">{group.name}</h1>
            <div className="flex items-center justify-center gap-8">
              <p className="text-base font-black text-white tracking-widest min-w-[120px] text-center">{monthDisplay}</p>
            </div>
          </div>

          {/* Bundle Info */}
          {discounts && discounts.length > 0 && (
            <div className="mb-6 bg-[#fff8f0] border border-[#d97706]/20 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-[#d97706] text-lg">category</span>
                <h3 className="text-sm font-black text-[#d97706]">Bundle Packages</h3>
              </div>
              <div className="space-y-3">
                {discounts.map(disc => (
                  <div key={disc.id} onClick={() => handleCardClick({ ...disc, itemType: 'discount' })} className="bg-white rounded-xl p-3 shadow-sm border border-[#d97706]/10 cursor-pointer hover:shadow-md transition-all">
                    <div className="flex justify-between items-start mb-1">
                      <p className="text-sm font-bold text-[#2d3435]">{disc.title}</p>
                    </div>
                    {disc.description && (
                      <p className="text-xs text-[#596061] leading-relaxed whitespace-pre-wrap mb-2">{disc.description}</p>
                    )}
                    <div className="flex justify-between items-center mt-2 pt-2 border-t border-[#d97706]/10">
                      <p className="text-sm font-black text-[#d97706]">
                        {disc.currency === 'KRW' ? `₩${disc.amount.toLocaleString()}` : `${disc.amount.toLocaleString()} ${disc.currency}`}
                      </p>
                      {selectedClasses.has(disc.id) ? (
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleRemoveFromBasket(disc.id); }}
                          disabled={!isRegistrationOpen}
                          className={`flex items-center justify-center transition-colors ${!isRegistrationOpen ? 'text-[#e0e4e5] cursor-not-allowed opacity-50' : 'text-[#0057bd]'}`}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '44px' }}>toggle_on</span>
                        </button>
                      ) : (
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleAddToBasket(disc.id, 'discount'); }}
                          disabled={isDiscountSelected || !isRegistrationOpen}
                          className={`flex items-center justify-center transition-colors ${isDiscountSelected || !isRegistrationOpen ? 'text-[#e0e4e5] cursor-not-allowed opacity-50' : 'text-[#acb3b4]'}`}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '44px' }}>toggle_off</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Classes Sort & List */}
          <div className="flex items-center justify-between mb-4 mt-8">
            <h3 className="text-sm font-black text-[#2d3435]">Class Schedule</h3>
            <div className="relative" />
          </div>

          <div className="space-y-4">
            {sortOption === 'class' ? (
              // Original Day-by-Day View
              DAY_ORDER.map(day => {
                const dayClasses = classesByDay.get(day) || [];
                if (dayClasses.length === 0) return null;

                const color = DAY_COLORS[day];

                return (
                  <div key={day} className="border border-[#e0e4e5] rounded-2xl overflow-hidden">
                    <div className="px-4 py-2.5 flex items-center gap-2" style={{ backgroundColor: `${color}10` }}>
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                      <p className="text-xs font-black uppercase tracking-[0.15em]" style={{ color }}>{DAY_LABELS[day]}</p>
                      <span className="text-[10px] font-bold text-[#acb3b4] ml-auto">{dayClasses.length} class{dayClasses.length > 1 ? 'es' : ''}</span>
                    </div>

                    <div className="divide-y divide-[#f2f4f4]">
                      {dayClasses.map(cls => {
                        const schedDates = formatScheduleDates(cls.schedule);
                        const instructors = cls.instructors || [];
                        const startDate = cls.schedule?.[0]?.date;
                        let startDisplay = '';
                        if (startDate) {
                          const cleanDate = startDate.replace(/\./g, '-');
                          const dd = new Date(cleanDate);
                          if (!isNaN(dd.getTime())) {
                            const daysKr = ['일', '월', '화', '수', '목', '금', '토'];
                            const daysEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                            const dayIdx = dd.getDay();
                            if (language === 'KR') {
                              startDisplay = `${dd.getMonth() + 1}.${dd.getDate()}(${daysKr[dayIdx]})`;
                            } else {
                              startDisplay = `${dd.getMonth() + 1}/${dd.getDate()} (${daysEn[dayIdx]})`;
                            }
                          }
                        }
                        const timeDisplay = cls.schedule?.[0]?.timeSlot || (cls.startTime ? `${cls.startTime}${cls.endTime ? ' - ' + cls.endTime : ''}` : '');

                        return (
                          <div key={cls.id} onClick={() => handleCardClick({ ...cls, itemType: 'class' })} className="p-3 flex gap-3 cursor-pointer hover:bg-[#f8f9fa] transition-colors group bg-white">
                            <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-[#e0e4e5]">
                              {cls.imageUrl || (cls as any).image || (cls as any).photoURL || (cls as any).avatar ? (
                                <img src={cls.imageUrl || (cls as any).image || (cls as any).photoURL || (cls as any).avatar} alt={cls.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement!.classList.add('flex', 'items-center', 'justify-center'); e.currentTarget.parentElement!.innerHTML = '<span class="material-symbols-outlined text-[#acb3b4] text-lg">school</span>'; }} />
                              ) : group.coverImage ? (
                                <img src={group.coverImage} alt={cls.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement!.classList.add('flex', 'items-center', 'justify-center'); e.currentTarget.parentElement!.innerHTML = '<span class="material-symbols-outlined text-[#acb3b4] text-lg">school</span>'; }} />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <span className="material-symbols-outlined text-[#acb3b4] text-lg">school</span>
                                </div>
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-[#2d3435] truncate">{cls.title}</p>
                              <p className="text-[13px] font-black text-[#2d3435] mt-0.5">
                                {cls.currency === 'KRW' ? `₩${cls.amount.toLocaleString()}` : `${cls.amount.toLocaleString()} ${cls.currency}`}
                              </p>
                              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1">
                                {startDisplay && (
                                  <span className="text-[11px] font-bold" style={{ color }}>Start: {startDisplay}</span>
                                )}
                                {timeDisplay && (
                                  <span className="text-[11px] text-[#596061]">{timeDisplay}</span>
                                )}
                              </div>
                              {schedDates && (
                                <p className="text-[10px] text-[#acb3b4] mt-0.5">
                                  Schedule: <span className="font-bold text-[#596061]">{schedDates}</span>
                                </p>
                              )}
                            </div>

                            <div className="flex flex-col items-end flex-shrink-0 ml-1 justify-between py-1">
                              {instructors.length > 0 && (
                                <div className="flex flex-row gap-2 items-center justify-end mb-2">
                                  {instructors.slice(0, 2).map((instructor, idx) => (
                                    <div key={idx} className="flex flex-col items-center w-8">
                                      <div className="w-7 h-7 rounded-full overflow-hidden bg-[#e0e4e5] border border-[#f2f4f4]">
                                        {(instructor as any).avatar || (instructor as any).photoURL || (instructor as any).image || (instructor as any).imageUrl ? (
                                          <img src={(instructor as any).avatar || (instructor as any).photoURL || (instructor as any).image || (instructor as any).imageUrl} alt={instructor.name} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement!.classList.add('flex', 'items-center', 'justify-center', 'text-[9px]', 'font-bold', 'text-[#596061]', 'bg-[#f8f9fa]'); e.currentTarget.parentElement!.innerHTML = instructor.name.substring(0, 2).toUpperCase(); }} />
                                        ) : (
                                          <div className="w-full h-full flex items-center justify-center text-[9px] font-bold text-[#596061] bg-[#f8f9fa]">
                                            {instructor.name.substring(0, 2).toUpperCase()}
                                          </div>
                                        )}
                                      </div>
                                      <p className="text-[8px] font-bold text-[#596061] mt-0.5 text-center truncate w-full">{instructor.name}</p>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {cls.classType === 'special' ? (
                                <button
                                  onClick={(e) => handleDirectReserve(cls, e)}
                                  disabled={!isRegistrationOpen}
                                  className={`flex items-center justify-center font-black text-[10px] tracking-wider uppercase border px-3 py-1.5 rounded-full transition-colors ${
                                    !isRegistrationOpen 
                                      ? 'text-[#acb3b4] border-[#e0e4e5] cursor-not-allowed opacity-50' 
                                      : 'text-[#0057bd] border-[#0057bd] hover:bg-[#0057bd]/5'
                                  }`}
                                >
                                  RESERVE
                                </button>
                              ) : selectedClasses.has(cls.id) ? (
                                <button 
                                  onClick={(e) => { e.stopPropagation(); handleRemoveFromBasket(cls.id); }}
                                  disabled={!isRegistrationOpen}
                                  className={`flex items-center justify-center transition-colors ${!isRegistrationOpen ? 'text-[#e0e4e5] cursor-not-allowed opacity-50' : 'text-[#0057bd]'}`}
                                >
                                  <span className="material-symbols-outlined" style={{ fontSize: '44px' }}>toggle_on</span>
                                </button>
                              ) : (
                                <button 
                                  onClick={(e) => { e.stopPropagation(); handleAddToBasket(cls.id); }}
                                  disabled={isDiscountSelected || !isRegistrationOpen}
                                  className={`flex items-center justify-center transition-colors ${isDiscountSelected || !isRegistrationOpen ? 'text-[#e0e4e5] cursor-not-allowed opacity-50' : 'text-[#acb3b4]'}`}
                                >
                                  <span className="material-symbols-outlined" style={{ fontSize: '44px' }}>toggle_off</span>
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            ) : (
              // Flat List View
              <div className="border border-[#e0e4e5] rounded-2xl overflow-hidden divide-y divide-[#f2f4f4]">
                {sortedClasses.map(cls => {
                  const schedDates = formatScheduleDates(cls.schedule);
                  const instructors = cls.instructors || [];
                  const startDate = cls.schedule?.[0]?.date;
                  let startDisplay = '';
                  if (startDate) {
                    const cleanDate = startDate.replace(/\./g, '-');
                    const dd = new Date(cleanDate);
                    if (!isNaN(dd.getTime())) {
                      const daysKr = ['일', '월', '화', '수', '목', '금', '토'];
                      const daysEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                      const dayIdx = dd.getDay();
                      if (language === 'KR') {
                        startDisplay = `${dd.getMonth() + 1}.${dd.getDate()}(${daysKr[dayIdx]})`;
                      } else {
                        startDisplay = `${dd.getMonth() + 1}/${dd.getDate()} (${daysEn[dayIdx]})`;
                      }
                    }
                  }
                  const timeDisplay = cls.schedule?.[0]?.timeSlot || (cls.startTime ? `${cls.startTime}${cls.endTime ? ' - ' + cls.endTime : ''}` : '');

                  return (
                    <div key={cls.id} onClick={() => handleCardClick({ ...cls, itemType: 'class' })} className="p-3 flex gap-3 cursor-pointer hover:bg-[#f8f9fa] transition-colors group bg-white">
                      <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-[#e0e4e5]">
                        {cls.imageUrl || (cls as any).image || (cls as any).photoURL || (cls as any).avatar ? (
                          <img src={cls.imageUrl || (cls as any).image || (cls as any).photoURL || (cls as any).avatar} alt={cls.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement!.classList.add('flex', 'items-center', 'justify-center'); e.currentTarget.parentElement!.innerHTML = '<span class="material-symbols-outlined text-[#acb3b4] text-lg">school</span>'; }} />
                        ) : group.coverImage ? (
                          <img src={group.coverImage} alt={cls.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement!.classList.add('flex', 'items-center', 'justify-center'); e.currentTarget.parentElement!.innerHTML = '<span class="material-symbols-outlined text-[#acb3b4] text-lg">school</span>'; }} />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="material-symbols-outlined text-[#acb3b4] text-lg">school</span>
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-[#2d3435] truncate">{cls.title}</p>
                        <p className="text-[13px] font-black text-[#2d3435] mt-0.5">
                          {cls.currency === 'KRW' ? `₩${cls.amount.toLocaleString()}` : `${cls.amount.toLocaleString()} ${cls.currency}`}
                        </p>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1">
                          {startDisplay && (
                            <span className="text-[11px] font-bold text-[#0057bd]">Start: {startDisplay}</span>
                          )}
                          {timeDisplay && (
                            <span className="text-[11px] text-[#596061]">{timeDisplay}</span>
                          )}
                        </div>
                        {schedDates && (
                          <p className="text-[10px] text-[#acb3b4] mt-0.5">
                            Schedule: <span className="font-bold text-[#596061]">{schedDates}</span>
                          </p>
                        )}
                      </div>

                      <div className="flex flex-col items-end flex-shrink-0 ml-1 justify-between py-1">
                        {instructors.length > 0 && (
                          <div className="flex flex-row gap-2 items-center justify-end mb-2">
                            {instructors.slice(0, 2).map((instructor, idx) => (
                              <div key={idx} className="flex flex-col items-center w-8">
                                <div className="w-7 h-7 rounded-full overflow-hidden bg-[#e0e4e5] border border-[#f2f4f4]">
                                  {(instructor as any).avatar || (instructor as any).photoURL || (instructor as any).image || (instructor as any).imageUrl ? (
                                    <img src={(instructor as any).avatar || (instructor as any).photoURL || (instructor as any).image || (instructor as any).imageUrl} alt={instructor.name} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement!.classList.add('flex', 'items-center', 'justify-center', 'text-[9px]', 'font-bold', 'text-[#596061]', 'bg-[#f8f9fa]'); e.currentTarget.parentElement!.innerHTML = instructor.name.substring(0, 2).toUpperCase(); }} />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-[9px] font-bold text-[#596061] bg-[#f8f9fa]">
                                      {instructor.name.substring(0, 2).toUpperCase()}
                                    </div>
                                  )}
                                </div>
                                <p className="text-[8px] font-bold text-[#596061] mt-0.5 text-center truncate w-full">{instructor.name}</p>
                              </div>
                            ))}
                          </div>
                        )}

                        {cls.classType === 'special' ? (
                          <button
                            onClick={(e) => handleDirectReserve(cls, e)}
                            disabled={!isRegistrationOpen}
                            className={`flex items-center justify-center font-black text-[10px] tracking-wider uppercase border px-3 py-1.5 rounded-full transition-colors ${
                              !isRegistrationOpen 
                                ? 'text-[#acb3b4] border-[#e0e4e5] cursor-not-allowed opacity-50' 
                                : 'text-[#0057bd] border-[#0057bd] hover:bg-[#0057bd]/5'
                            }`}
                          >
                            RESERVE
                          </button>
                        ) : selectedClasses.has(cls.id) ? (
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleRemoveFromBasket(cls.id); }}
                            disabled={!isRegistrationOpen}
                            className={`flex items-center justify-center transition-colors ${!isRegistrationOpen ? 'text-[#e0e4e5] cursor-not-allowed opacity-50' : 'text-[#0057bd]'}`}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: '44px' }}>toggle_on</span>
                          </button>
                        ) : (
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleAddToBasket(cls.id); }}
                            disabled={isDiscountSelected || !isRegistrationOpen}
                            className={`flex items-center justify-center transition-colors ${isDiscountSelected || !isRegistrationOpen ? 'text-[#e0e4e5] cursor-not-allowed opacity-50' : 'text-[#acb3b4]'}`}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: '44px' }}>toggle_off</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Bank Account Section */}
          {bank && (
            <div className="mt-6 border border-[#e0e4e5] rounded-2xl overflow-hidden">
              <div className="bg-[#f8f9fa] px-4 py-2.5 border-b border-[#e0e4e5] flex items-center gap-2">
                <span className="material-symbols-outlined text-sm text-[#0057bd]">account_balance</span>
                <p className="text-[10px] font-black text-[#0057bd] uppercase tracking-[0.15em] flex-1">Class Payment Account</p>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(bank.accountNumber);
                    toast.success("Account number copied");
                  }}
                  className="text-[#0057bd] hover:text-[#0057bd]/80 transition-colors flex items-center justify-center bg-white border border-[#0057bd]/20 rounded-md p-1 shadow-sm"
                  title="Copy account number"
                >
                  <span className="material-symbols-outlined text-[14px]">content_copy</span>
                </button>
              </div>
              <div className="p-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] text-[#acb3b4] uppercase font-bold">Bank</span>
                  <span className="text-sm font-bold text-[#2d3435]">{bank.bankName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[11px] text-[#acb3b4] uppercase font-bold">Account</span>
                  <span className="text-sm font-black text-[#2d3435] font-mono tracking-wide">{bank.accountNumber}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[11px] text-[#acb3b4] uppercase font-bold">Holder</span>
                  <span className="text-sm font-bold text-[#2d3435]">{bank.accountHolder}</span>
                </div>
              </div>
            </div>
          )}

          {/* Contact Section */}
          <div className="mt-4 border border-[#e0e4e5] rounded-2xl overflow-hidden">
            <div className="bg-[#f8f9fa] px-4 py-2.5 border-b border-[#e0e4e5] flex items-center gap-2">
              <span className="material-symbols-outlined text-sm text-[#596061]">support_agent</span>
              <p className="text-[10px] font-black text-[#596061] uppercase tracking-[0.15em]">Contact</p>
            </div>
            <div className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#f0f4ff] flex items-center justify-center flex-shrink-0 overflow-hidden">
                {group.representative?.avatar || (group.representative as any)?.photoURL || ownerInfo?.avatar ? (
                  <img src={group.representative?.avatar || (group.representative as any)?.photoURL || ownerInfo?.avatar || undefined} alt="admin" className="w-full h-full object-cover" />
                ) : (
                  <span className="material-symbols-outlined text-sm text-[#0057bd]">person</span>
                )}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-bold text-[#2d3435]">{group.representative?.name || ownerInfo?.name || 'Stone Hong'}</p>
                  {(group.representative?.localName || ownerInfo?.localName) && (
                    <span className="text-[10px] text-[#596061] font-medium mt-0.5">{group.representative?.localName || ownerInfo?.localName}</span>
                  )}
                </div>
                <p className="text-[11px] text-[#acb3b4] font-medium mt-0.5">
                  <span className="text-[#0057bd] font-bold">
                    {(() => {
                      let p = group.representative?.phone || ownerInfo?.phone;
                      if (!p || p === '010-9031-1557') p = '010-7209-2468';
                      // Format to 010-XXXX-XXXX if it is 01072092468
                      if (p === '01072092468') p = '010-7209-2468';
                      return p;
                    })()}
                  </span> (Admin)
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 text-center" />
        </div>
      </div>

      {/* FAB Basket */}
      {selectedClasses.size > 0 && (
        <div className="fixed bottom-32 right-6 z-[220]">
          <button
            onClick={() => setIsApplyModalOpen(true)}
            className="w-14 h-14 bg-primary text-white rounded-full shadow-xl shadow-primary/30 flex items-center justify-center hover:scale-105 active:scale-95 transition-all relative"
          >
            <span className="material-symbols-outlined text-[28px]">shopping_bag</span>
            <div className="absolute -top-1 -right-1 bg-error text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black border-2 border-white">
              {selectedClasses.size}
            </div>
          </button>
        </div>
      )}

      {/* Item Details Popup Modal */}
       {/* Class Registration - UnifiedCheckoutModal (SHOP과 동일한 워크플로) */}
      <UnifiedCheckoutModal
        isOpen={isApplyModalOpen}
        onClose={() => {
          setIsApplyModalOpen(false);
          setSelectedClasses(new Set());
          setPassSelectedClassIds(new Set());
          setClassPartners({});
        }}
        title={isDiscountSelected ? "Bundle Package Registration" : "Class Registration"}
        subtitle={isDiscountSelected ? undefined : `${group?.name || 'Club'} · ${monthDisplay}`}
        isSubmitDisabled={isDiscountSelected && passSelectedClassIds.size === 0}
        totalAmount={Array.from(selectedClasses).reduce((sum, id) => {
          const item = allItemsOriginal.find(c => c.id === id);
          return sum + (item?.amount || 0);
        }, 0)}
        currency={selectedClasses.size > 0 ? allItemsOriginal.find(c => c.id === Array.from(selectedClasses)[0])?.currency || 'KRW' : 'KRW'}
        onCheckout={async () => {
          if (!user) {
            toast.error('You need to login first.');
            throw new Error('Not logged in');
          }
          if (!selectedRole) {
            toast.error('Please select a role (Leader/Follower).');
            throw new Error('No role selected');
          }
          if (isDiscountSelected && passSelectedClassIds.size === 0) {
            toast.error('Please select at least one class to attend.');
            throw new Error('No participating classes selected');
          }
          const selectedItems = Array.from(selectedClasses).map(id => {
            const item = allItemsOriginal.find(c => c.id === id);
            return item ? { id: item.id, title: item.title, amount: item.amount || 0, itemType: item.itemType } : null;
          }).filter(Boolean);
          const totalAmount = selectedItems.reduce((sum, item) => sum + (item?.amount || 0), 0);
          const classTitles = selectedItems.map(item => item?.title).join(', ');
          const orderId = await createBooking({
            domain: isDiscountSelected ? 'class_discount' : 'class_4w',
            itemName: classTitles,
            itemImageUrl: group?.coverImage || group?.logo || '',
            itemId: selectedItems[0]?.id || '',
            hostId: group?.ownerId || '',
            totalAmount,
            currency: selectedItems[0]?.id ? (allItemsOriginal.find(c => c.id === selectedItems[0]?.id)?.currency || 'KRW') : 'KRW',
            payload: {
              role: selectedRole,
              groupId,
              groupName: group?.name,
              selectedItems,
              ...(isDiscountSelected ? { 
                participatingClassIds: Array.from(passSelectedClassIds),
                participatingClassPartners: Object.fromEntries(
                  Object.entries(classPartners).filter(([id, val]) => passSelectedClassIds.has(id) && val.trim() !== '')
                )
              } : {})
            }
          });
          return orderId;
        }}
        isProcessing={isBooking}
        buttonText="Submit Request"
        bankDetails={{
          bankName: (group as any)?.classPaymentSettings?.bankDetails?.bankName || (group as any)?.bankDetails?.bankName || (group as any)?.bankName || 'Kookmin Bank',
          accountHolder: (group as any)?.classPaymentSettings?.bankDetails?.accountHolder || (group as any)?.bankDetails?.accountHolder || (group as any)?.accountHolder || group?.name || 'World of Community',
          accountNumber: (group as any)?.classPaymentSettings?.bankDetails?.accountNumber || (group as any)?.bankDetails?.accountNumber || (group as any)?.accountNumber || '123456-00-123456'
        }}
        onReportPayment={reportPayment}
      >
        <div className="space-y-6 py-2">
          {/* Role Selection */}
          <div>
            <h4 className="text-sm font-bold text-neutral-900 dark:text-white mb-3">Select Role <span className="text-error">*</span></h4>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setSelectedRole('leader')}
                className={`flex flex-col items-center justify-center py-4 rounded-xl border-2 transition-all ${selectedRole === 'leader' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300'}`}
              >
                <span className={`text-sm font-black uppercase ${selectedRole === 'leader' ? 'text-blue-700 dark:text-blue-400' : 'text-neutral-700 dark:text-neutral-300'}`}>Leader</span>
              </button>
              <button
                onClick={() => setSelectedRole('follower')}
                className={`flex flex-col items-center justify-center py-4 rounded-xl border-2 transition-all ${selectedRole === 'follower' ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300'}`}
              >
                <span className={`text-sm font-black uppercase ${selectedRole === 'follower' ? 'text-purple-700 dark:text-purple-400' : 'text-neutral-700 dark:text-neutral-300'}`}>Follower</span>
              </button>
            </div>
          </div>

          {isDiscountSelected ? (
            <>
              {/* Bundle Info */}
              <div className="bg-neutral-50 dark:bg-neutral-800 rounded-2xl p-4 border border-neutral-200 dark:border-neutral-700">
                <h4 className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-3">Applied Bundle</h4>
                {Array.from(selectedClasses).map(classId => {
                  const item = allItemsOriginal.find(c => c.id === classId);
                  if (!item) return null;
                  return (
                    <div key={classId} className="flex justify-between items-center">
                      <span className="text-sm font-bold text-neutral-900 dark:text-white truncate mr-2">{item.title}</span>
                      <span className="text-sm font-black text-neutral-900 dark:text-white whitespace-nowrap">
                        {item.currency === 'KRW' || !item.currency ? `₩${item.amount ? item.amount.toLocaleString() : '0'}` : `${item.amount ? item.amount.toLocaleString() : '0'} ${item.currency}`}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Participating Classes Checkbox */}
              <div className="bg-neutral-50 dark:bg-neutral-800 rounded-2xl p-4 border border-neutral-200 dark:border-neutral-700">
                <h4 className="text-sm font-bold text-neutral-900 dark:text-white mb-3">Select Classes to Attend <span className="text-error">*</span></h4>
                <div className="space-y-2">
                  {(() => {
                    const passId = Array.from(selectedClasses)[0];
                    const pass = allItemsOriginal.find(c => c.id === passId);
                    const passClassIds = (pass as any)?.includedClassIds || [];
                    const passClasses = passClassIds.length > 0
                      ? allGroupClassesOriginal.filter(c => passClassIds.includes(c.id))
                      : allGroupClassesOriginal;

                    // 요일 추출 헬퍼
                    const getClassDay = (cls: any): string => {
                      if (cls.schedule && cls.schedule.length > 0) {
                        const day = getDayOfWeek(cls.schedule[0].date);
                        return day || 'MON';
                      }
                      return 'MON';
                    };

                    const getDayIndex = (day: string) => {
                      const idx = DAY_ORDER.indexOf(day as any);
                      return idx === -1 ? 99 : idx;
                    };

                    const DAY_LABELS: Record<string, { en: string; ko: string }> = {
                      MON: { en: 'Mon', ko: '월' },
                      TUE: { en: 'Tue', ko: '화' },
                      WED: { en: 'Wed', ko: '수' },
                      THU: { en: 'Thu', ko: '목' },
                      FRI: { en: 'Fri', ko: '금' },
                      SAT: { en: 'Sat', ko: '토' },
                      SUN: { en: 'Sun', ko: '일' },
                    };

                    // 요일 정렬 적용 (월-일 순서)
                    const sortedPassClasses = [...passClasses].sort((a, b) => {
                      const dayA = getClassDay(a);
                      const dayB = getClassDay(b);
                      const idxA = getDayIndex(dayA);
                      const idxB = getDayIndex(dayB);
                      if (idxA !== idxB) return idxA - idxB;
                      const timeA = a.startTime || '00:00';
                      const timeB = b.startTime || '00:00';
                      return timeA.localeCompare(timeB);
                    });

                    return sortedPassClasses.map((cls: any, idx: number) => {
                      const day = getClassDay(cls);
                      const prevCls = idx > 0 ? sortedPassClasses[idx - 1] : null;
                      const prevDay = prevCls ? getClassDay(prevCls) : null;
                      const isNewDay = idx > 0 && day !== prevDay;
                      const dayLabel = DAY_LABELS[day]?.en || 'Mon';
                      
                      let datesStr = '';
                      if (cls.schedule && cls.schedule.length > 0) {
                        const formattedDates = cls.schedule.map((s: any) => {
                          if (!s.date) return '';
                          const parts = s.date.split('.');
                          if (parts.length >= 3) {
                            return `${parseInt(parts[1])}/${parseInt(parts[2])}`;
                          }
                          return s.date;
                        }).filter(Boolean);
                        datesStr = formattedDates.join(', ');
                      }
                      const timeStr = `${cls.startTime || '00:00'} - ${cls.endTime || '00:00'}`;
                      const isChecked = passSelectedClassIds.has(cls.id);

                      return (
                        <React.Fragment key={cls.id}>
                          {isNewDay && (
                            <div className="border-t border-neutral-200 dark:border-neutral-700 my-4" />
                          )}
                          <div className="flex flex-col p-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 transition-colors">
                            <label className="flex items-center gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {
                                  setPassSelectedClassIds(prev => {
                                    const newSet = new Set(prev);
                                    if (newSet.has(cls.id)) newSet.delete(cls.id);
                                    else newSet.add(cls.id);
                                    return newSet;
                                  });
                                }}
                                className="w-5 h-5 rounded border-neutral-300 text-blue-600 focus:ring-blue-500 accent-blue-600"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[10px] bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded font-bold whitespace-nowrap">
                                    {dayLabel}
                                  </span>
                                  <p className="text-sm font-bold text-neutral-900 dark:text-white truncate">{cls.title}</p>
                                </div>
                                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1">
                                  {datesStr ? `${datesStr} | ` : ''}{timeStr}
                                </p>
                                {cls.instructors?.length > 0 && (
                                  <p className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-0.5 truncate">
                                    {cls.instructors.map((i: any) => i.name).join(', ')}
                                  </p>
                                )}
                              </div>
                            </label>

                            {/* 파트너명 인풋 필드 */}
                            {isChecked && (
                              <div className="mt-3 pl-8 animate-in slide-in-from-top-1 duration-200">
                                <input
                                  type="text"
                                  value={classPartners[cls.id] || ''}
                                  onChange={(e) => {
                                    setClassPartners(prev => ({
                                      ...prev,
                                      [cls.id]: e.target.value
                                    }));
                                  }}
                                  placeholder="Partner Name (Optional)"
                                  className="w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg px-3 py-1.5 text-xs text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                />
                              </div>
                            )}
                          </div>
                        </React.Fragment>
                      );
                    });
                  })()}
                </div>
                <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-2 text-right">
                  Selected: {passSelectedClassIds.size} / {(() => {
                    const passId = Array.from(selectedClasses)[0];
                    const pass = allItems.find(c => c.id === passId);
                    const passClassIds = (pass as any)?.includedClassIds || [];
                    return passClassIds.length > 0
                      ? allGroupClasses.filter(c => passClassIds.includes(c.id)).length
                      : allGroupClasses.length;
                  })()}
                </p>
              </div>
            </>
          ) : (
            /* Applied Items - 일반 클래스/번들 */
            <div className="bg-neutral-50 dark:bg-neutral-800 rounded-2xl p-4 border border-neutral-200 dark:border-neutral-700">
              <h4 className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-3">Applied Classes</h4>
              {Array.from(selectedClasses).map(classId => {
                const item = allItems.find(c => c.id === classId);
                if (!item) return null;
                return (
                  <div key={classId} className="flex justify-between items-center mb-3 last:mb-0">
                    <span className="text-sm font-bold text-neutral-900 dark:text-white truncate mr-2">{item.title}</span>
                    <span className="text-sm font-black text-neutral-900 dark:text-white whitespace-nowrap">
                      {item.currency === 'KRW' || !item.currency ? `₩${item.amount ? item.amount.toLocaleString() : '0'}` : `${item.amount ? item.amount.toLocaleString() : '0'} ${item.currency}`}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Notice */}
          <div className="bg-neutral-50 dark:bg-neutral-800 rounded-xl p-4 border border-neutral-100 dark:border-neutral-700">
            <h4 className="text-[13px] font-black text-neutral-900 dark:text-white mb-2 flex items-center gap-1.5"><span className="material-symbols-outlined text-[16px] text-blue-500">info</span> {t('class.booking_notice_title')}</h4>
            <p className="text-xs font-medium text-neutral-600 dark:text-neutral-400 leading-relaxed">
              {t('class.booking_notice_desc')}
            </p>
          </div>
        </div>
      </UnifiedCheckoutModal>

      {/* Checkout Modal */}
      {selectedClassDetail && (
        <UnifiedCheckoutModal
          isOpen={checkoutModalOpen}
          onClose={() => setCheckoutModalOpen(false)}
          title="Special Class Reservation"
          subtitle={`${selectedClassDetail.title} · ${selectedClassDetail.schedule?.[0]?.date ? new Date(selectedClassDetail.schedule[0].date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }) : 'Date TBD'}`}
          totalAmount={selectedClassDetail.amount || 0}
          onCheckout={handleCheckoutSubmit}
          isProcessing={isBooking}
          buttonText="Submit Request"
          bankDetails={{
            bankName: (group as any)?.bankName || 'Kookmin Bank',
            accountHolder: (group as any)?.accountHolder || group?.name || 'World of Community',
            accountNumber: (group as any)?.accountNumber || '123456-00-123456'
          }}
          onReportPayment={reportPayment}
        >
          <div className="space-y-6 py-2">
            <div className="flex gap-3 p-3 bg-neutral-50 dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700">
              <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-neutral-200 dark:bg-neutral-700">
                {(selectedClassDetail.imageUrl || selectedClassDetail.image || selectedClassDetail.photoURL || selectedClassDetail.avatar || group?.coverImage || group?.logo) ? (
                  <img src={selectedClassDetail.imageUrl || selectedClassDetail.image || selectedClassDetail.photoURL || selectedClassDetail.avatar || group?.coverImage || group?.logo} alt={selectedClassDetail.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="material-symbols-outlined text-[24px] text-neutral-400">school</span>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold text-neutral-500 uppercase">{group?.name || 'World of Community'}</p>
                <p className="text-sm font-bold text-neutral-900 dark:text-white truncate">{selectedClassDetail.title}</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  <span className="text-[10px] bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300 px-2 py-0.5 rounded-full font-bold">
                    {selectedClassDetail.schedule?.[0]?.timeSlot || `${selectedClassDetail.startTime} - ${selectedClassDetail.endTime}`}
                  </span>
                  <span className="text-[10px] bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300 px-2 py-0.5 rounded-full font-bold">
                    {selectedClassDetail.location || group?.name}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-bold text-neutral-900 dark:text-white mb-3">Select Role</h4>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setCheckoutRole('leader')}
                  className={`flex flex-col items-center justify-center py-4 rounded-xl border-2 transition-all ${checkoutRole === 'leader' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300'}`}
                >
                  <span className={`text-sm font-black uppercase ${checkoutRole === 'leader' ? 'text-blue-700 dark:text-blue-400' : 'text-neutral-700 dark:text-neutral-300'}`}>Leader</span>
                </button>
                <button
                  onClick={() => setCheckoutRole('follower')}
                  className={`flex flex-col items-center justify-center py-4 rounded-xl border-2 transition-all ${checkoutRole === 'follower' ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300'}`}
                >
                  <span className={`text-sm font-black uppercase ${checkoutRole === 'follower' ? 'text-purple-700 dark:text-purple-400' : 'text-neutral-700 dark:text-neutral-300'}`}>Follower</span>
                </button>
              </div>
            </div>
            
            <div className="bg-neutral-50 dark:bg-neutral-800 rounded-xl p-4 border border-neutral-100 dark:border-neutral-700">
              <h4 className="text-[13px] font-black text-neutral-900 dark:text-white mb-2 flex items-center gap-1.5"><span className="material-symbols-outlined text-[16px] text-blue-500">info</span> Notice</h4>
              <p className="text-xs font-medium text-neutral-600 dark:text-neutral-400 leading-relaxed">
                After submitting this request, your booking will be in "Waiting Confirmation" status. You will receive an instruction for the payment. Your spot is finalized once the host confirms the payment.
              </p>
            </div>
          </div>
        </UnifiedCheckoutModal>
      )}
    </div>
  );
}
