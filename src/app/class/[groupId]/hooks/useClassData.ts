import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/clientApp';
import { groupService } from '@/lib/firebase/groupService';
import { Group, GroupClass, ClassDiscount } from '@/types/group';
import { useAuth } from '@/components/providers/AuthProvider';
import { useLanguage } from '@/contexts/LanguageContext';
import { useBookingEngine } from '@/hooks/useBookingEngine';
import { toast } from 'sonner';
import { 
  DAY_ORDER, 
  getDayOfWeek 
} from '../constants/classConstants';

export function useClassData(propGroupId?: string, propModalId?: string, onClose?: () => void) {
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

  // Firestore sub-collections state
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
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const captureRef = useRef<HTMLDivElement>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [checkoutRole, setCheckoutRole] = useState<'leader' | 'follower'>('leader');
  const { createBooking, reportPayment, isLoading: isBooking } = useBookingEngine();

  // Watch URL monthParam changes to sync currentDate
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

  const closeDetailModal = useCallback(() => {
    setSelectedClassDetail(null);
    if (propModalId && onClose) {
      onClose();
    }
  }, [propModalId, onClose]);

  const currentMonthStr = useMemo(() => {
    return `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
  }, [currentDate]);

  const isRegistrationOpen = useMemo(() => {
    if (!group) return true;
    return group.classPaymentSettings?.openMonths
      ? group.classPaymentSettings.openMonths.includes(currentMonthStr)
      : true;
  }, [group, currentMonthStr]);
  
  const monthDisplay = useMemo(() => {
    const monthNamesShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return language === 'KR'
      ? `${currentDate.getMonth() + 1}월, ${currentDate.getFullYear()}`
      : `${monthNamesShort[currentDate.getMonth()]}(${String(currentDate.getMonth() + 1).padStart(2, '0')}), ${currentDate.getFullYear()}`;
  }, [currentDate, language]);

  const allGroupClasses = useMemo(() => {
    if (!group) return [];
    return subClasses.length > 0 ? subClasses : (group.classes || []);
  }, [group, subClasses]);

  const classes = useMemo(() => {
    return allGroupClasses.filter(cls => !cls.targetMonth || cls.targetMonth === currentMonthStr);
  }, [allGroupClasses, currentMonthStr]);

  const allDiscountsOriginal = useMemo(() => {
    if (!group) return [];
    return subDiscounts.length > 0 ? subDiscounts : (group.discounts || []);
  }, [group, subDiscounts]);

  const discounts = useMemo(() => {
    return allDiscountsOriginal.filter(d => !d.targetMonth || d.targetMonth === currentMonthStr);
  }, [allDiscountsOriginal, currentMonthStr]);

  const allPackagesOriginal = useMemo(() => {
    return [
      ...allDiscountsOriginal.map(d => ({ ...d, itemType: 'discount' as const, amount: d.amount, currency: d.currency }))
    ];
  }, [allDiscountsOriginal]);

  const allItemsOriginal = useMemo(() => {
    return [...allPackagesOriginal, ...allGroupClasses.map(c => ({ ...c, itemType: 'class' as const }))];
  }, [allPackagesOriginal, allGroupClasses]);

  const packages = useMemo(() => {
    return [
      ...discounts.map(d => ({ ...d, itemType: 'discount' as const, amount: d.amount, currency: d.currency }))
    ];
  }, [discounts]);

  const allItems = useMemo(() => {
    return [...packages, ...classes.map(c => ({ ...c, itemType: 'class' as const }))];
  }, [packages, classes]);

  const isDiscountSelected = useMemo(() => {
    return selectedClasses.size > 0 && Array.from(selectedClasses).some(id => 
      subDiscounts.some(d => d.id === id)
    );
  }, [selectedClasses, subDiscounts]);

  const handleCardClick = (item: any) => {
    setSelectedClassDetail(item);
    if (item.itemType === 'discount') {
      const passClasses = item.includedClassIds && item.includedClassIds.length > 0 
        ? allGroupClasses.filter(c => item.includedClassIds.includes(c.id))
        : allGroupClasses;
      setPassSelectedClassIds(new Set(passClasses.map(c => c.id)));
    }
  };

  const handleAddToBasket = (classId: string, itemType?: string) => {
    setSelectedClasses(prev => {
      let newSet = new Set(prev);
      if (itemType === 'discount') {
        newSet.clear();
      }
      newSet.add(classId);
      return newSet;
    });
    closeDetailModal();
  };

  const handleRemoveFromBasket = (classId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedClasses(prev => {
      const newSet = new Set(prev);
      newSet.delete(classId);
      return newSet;
    });
  };

  const handleCheckoutClick = () => {
    if (!selectedClassDetail) return;
    setCheckoutRole('leader');
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

  const sortedClasses = useMemo(() => {
    const list = [...classes];
    if (sortOption === 'name') {
      list.sort((a, b) => a.title.localeCompare(b.title));
    }
    return list;
  }, [classes, sortOption]);

  const classesByDay = useMemo(() => {
    const map = new Map<string, GroupClass[]>();
    DAY_ORDER.forEach(day => map.set(day, []));

    sortedClasses.forEach(cls => {
      if (cls.schedule && cls.schedule.length > 0) {
        const days = new Set<string>();
        cls.schedule.forEach(s => {
          const day = getDayOfWeek(s.date);
          if (day) days.add(day);
        });
        days.forEach(day => {
          if (map.has(day)) map.get(day)!.push(cls);
        });
      }
    });
    return map;
  }, [sortedClasses]);

  const bank = useMemo(() => {
    if (!group) return null;
    return group.classPaymentSettings?.bankDetails || group.bankDetails;
  }, [group]);

  return {
    router,
    groupId,
    group,
    loading,
    selectedClasses,
    setSelectedClasses,
    selectedClassDetail,
    setSelectedClassDetail,
    isApplyModalOpen,
    setIsApplyModalOpen,
    passSelectedClassIds,
    setPassSelectedClassIds,
    classPartners,
    setClassPartners,
    user,
    profile,
    language,
    t,
    selectedRole,
    setSelectedRole,
    ownerInfo,
    subClasses,
    subDiscounts,
    currentDate,
    setCurrentDate,
    sortOption,
    setSortOption,
    showSortDropdown,
    setShowSortDropdown,
    imageErrors,
    setImageErrors,
    scrollRef,
    captureRef,
    isScrolled,
    isDownloading,
    checkoutModalOpen,
    setCheckoutModalOpen,
    checkoutRole,
    setCheckoutRole,
    isBooking,
    closeDetailModal,
    currentMonthStr,
    isRegistrationOpen,
    monthDisplay,
    allGroupClasses,
    classes,
    discounts,
    allItemsOriginal,
    allItems,
    isDiscountSelected,
    sortedClasses,
    classesByDay,
    bank,
    handleCardClick,
    handleAddToBasket,
    handleRemoveFromBasket,
    handleCheckoutClick,
    handleDirectReserve,
    handleCheckoutSubmit,
    handleDownload,
    reportPayment
  };
}
