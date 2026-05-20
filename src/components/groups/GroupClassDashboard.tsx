import React, { useState, useEffect, useMemo } from 'react';
import { Group, GroupClass, ClassDiscount } from '@/types/group';
import { chatService } from '@/lib/firebase/chatService';
import { groupService } from '@/lib/firebase/groupService';
import { useAuth } from '@/components/providers/AuthProvider';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/clientApp';
import { useRouter, usePathname } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import ImageWithFallback from '@/components/common/ImageWithFallback';
import { useModalNavigation } from '@/hooks/useModalNavigation';

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

  useEffect(() => {
    const unsubClasses = groupService.subscribeClasses(group.id, setAllClasses);
    const unsubDiscounts = groupService.subscribeDiscounts(group.id, setAllDiscounts);
    return () => {
      unsubClasses();
      unsubDiscounts();
    };
  }, [group.id]);

  const [ownerInfo, setOwnerInfo] = useState<any>(null);

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

  // Build all items list for display
  const allItems = useMemo(() => {
    const items: any[] = [];
    monthBundles.forEach(d => items.push({ ...d, itemType: 'bundle' }));
    monthClasses.forEach(c => items.push({ ...c, itemType: 'class' }));
    return items;
  }, [monthBundles, monthClasses]);

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

  return (
    <div className="flex flex-col w-full animate-in fade-in slide-in-from-bottom-4 duration-500">

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

      {!isRegistrationOpen && (
        <div className="bg-rose-50 border-b border-rose-100 text-rose-600 px-4 py-2.5 text-xs font-bold flex items-center gap-2 animate-in fade-in duration-300">
          <span className="material-symbols-outlined text-base">info</span>
          {language === 'KR' ? '지금은 수업신청이 불가합니다.' : 'Class registration is currently unavailable.'}
        </div>
      )}

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

      {/* Item List - Shop style cards */}
      <div className="px-4 pb-4 space-y-3">
        {allItems.length > 0 ? (
          allItems.map((item, idx) => {
            const colors = getItemTypeColor(item.itemType);
            const icon = getItemTypeIcon(item.itemType);
            const imgSrc = item.imageUrl || item.image || item.photoURL || item.avatar || group.coverImage || group.logo || '';
            const timeDisplay = item.schedule?.[0]?.timeSlot || (item.startTime ? `${item.startTime}${item.endTime ? ' - ' + item.endTime : ''}` : '');

            return (
              <article
                key={item.id || idx}
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
                    {timeDisplay && (
                      <span className="text-[11px] text-[#596061] font-medium">{timeDisplay}</span>
                    )}
                  </div>
                </div>
              </article>
            );
          })
        ) : (
          <div className="py-12 text-center">
            <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">school</span>
            <p className="text-slate-500 font-medium text-sm">{t('class-dashboard.noRegistrationsYet')}</p>
          </div>
        )}
      </div>

      {/* Bottom Action Bar - Shop/Resale style */}
      <div className="sticky bottom-[60px] md:bottom-[112px] z-[200] bg-white/95 backdrop-blur-sm border-t border-[#f2f4f4] px-4 py-3 flex gap-3">
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

    </div>
  );
}
