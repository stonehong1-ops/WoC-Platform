import React, { useState, useEffect, useMemo } from 'react';
import { Group } from '@/types/group';
import { chatService } from '@/lib/firebase/chatService';
import { useAuth } from '@/components/providers/AuthProvider';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/clientApp';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import ImageWithFallback from '@/components/common/ImageWithFallback';

interface GroupClassDashboardProps {
  group: Group;
  onApplyClick: () => void;
}

const CURRENCY_SYMBOL: Record<string, string> = { KRW: '₩', USD: '$', EUR: '€' };
const getCurrencySymbol = (c: string) => CURRENCY_SYMBOL[c] || c + ' ';

export default function GroupClassDashboard({ group, onApplyClick }: GroupClassDashboardProps) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const router = useRouter();

  const [currentDate, setCurrentDate] = useState<Date>(() => {
    let latestDate = new Date();
    if (group.classes && group.classes.length > 0) {
      const sortedClasses = [...group.classes].sort((a, b) => {
        const dateA = a.schedule?.[0]?.date || '0000-00-00';
        const dateB = b.schedule?.[0]?.date || '0000-00-00';
        return dateB.localeCompare(dateA);
      });
      const latestClassDate = sortedClasses[0]?.schedule?.[0]?.date;
      if (latestClassDate) {
        const d = new Date(latestClassDate.replace(/\./g, '-'));
        if (!isNaN(d.getTime()) && d > latestDate) {
          latestDate = d;
        }
      }
    }
    return latestDate;
  });

  const [ownerInfo, setOwnerInfo] = useState<any>(null);

  const currentMonthStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
  const monthNamesShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const displayMonth = `${monthNamesShort[currentDate.getMonth()]} ${currentDate.getFullYear()}`;

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

  const monthClasses = useMemo(() => group.classes?.filter(c => !c.targetMonth || c.targetMonth === currentMonthStr) || [], [group.classes, currentMonthStr]);
  const monthPasses = useMemo(() => group.monthlyPasses?.filter(p => !p.targetMonth || p.targetMonth === currentMonthStr) || [], [group.monthlyPasses, currentMonthStr]);
  const monthBundles = useMemo(() => group.discounts?.filter(d => !d.targetMonth || d.targetMonth === currentMonthStr) || [], [group.discounts, currentMonthStr]);

  const handlePrevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const handleChatWithOwner = async () => {
    if (!user || !ownerInfo?.id) return;
    try {
      const roomId = await chatService.getOrCreatePrivateRoom([user.uid, ownerInfo.id], user.uid);
      router.push(`/chat/${roomId}`);
    } catch (error) {
      console.error("Chat error:", error);
    }
  };

  const handleRegisterClass = () => {
    router.push(`/class/${group.id}`);
  };

  // Build all items list for display
  const allItems = useMemo(() => {
    const items: any[] = [];
    monthPasses.forEach(p => items.push({ ...p, itemType: 'pass' }));
    monthBundles.forEach(d => items.push({ ...d, itemType: 'bundle' }));
    monthClasses.forEach(c => items.push({ ...c, itemType: 'class' }));
    return items;
  }, [monthPasses, monthBundles, monthClasses]);

  const getItemTypeLabel = (type: string) => {
    switch (type) {
      case 'pass': return t('class-dashboard.pass', 'Pass');
      case 'bundle': return t('class-dashboard.bundle', 'Bundle');
      case 'class': return t('class-dashboard.class', 'Class');
      default: return '';
    }
  };

  const getItemTypeColor = (type: string) => {
    switch (type) {
      case 'pass': return { text: 'text-[#0057bd]', bg: 'bg-[#0057bd]/10', border: 'border-[#0057bd]/20' };
      case 'bundle': return { text: 'text-[#d97706]', bg: 'bg-[#d97706]/10', border: 'border-[#d97706]/20' };
      case 'class': return { text: 'text-[#059669]', bg: 'bg-[#059669]/10', border: 'border-[#059669]/20' };
      default: return { text: 'text-slate-500', bg: 'bg-slate-100', border: 'border-slate-200' };
    }
  };

  const getItemTypeIcon = (type: string) => {
    switch (type) {
      case 'pass': return 'local_activity';
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
          <span className="text-[10px] font-black text-primary tracking-widest uppercase">{t('class-dashboard.schedule', 'SCHEDULE')}</span>
          <h2 className="text-[18px] font-black text-[#2d3435]">{displayMonth}</h2>
        </div>
        <button onClick={handleNextMonth} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-[#f2f4f4] transition-colors">
          <span className="material-symbols-outlined text-xl text-[#596061]">chevron_right</span>
        </button>
      </div>

      {/* Stats Summary - product count based */}
      <div className="grid grid-cols-3 gap-2 px-4 py-3">
        <div className="bg-[#f0f4ff] border border-[#0057bd]/15 rounded-xl p-3 flex flex-col items-center justify-center">
          <span className="text-[10px] font-black text-[#0057bd] uppercase tracking-widest">{t('class-dashboard.pass', 'Pass')}</span>
          <span className="text-[22px] font-black text-[#0057bd]">{monthPasses.length}</span>
        </div>
        <div className="bg-[#fff8f0] border border-[#d97706]/15 rounded-xl p-3 flex flex-col items-center justify-center">
          <span className="text-[10px] font-black text-[#d97706] uppercase tracking-widest">{t('class-dashboard.bundle', 'Bundle')}</span>
          <span className="text-[22px] font-black text-[#d97706]">{monthBundles.length}</span>
        </div>
        <div className="bg-[#f0fdf4] border border-[#059669]/15 rounded-xl p-3 flex flex-col items-center justify-center">
          <span className="text-[10px] font-black text-[#059669] uppercase tracking-widest">{t('class-dashboard.class', 'Class')}</span>
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
                onClick={handleRegisterClass}
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
            <p className="text-slate-500 font-medium text-sm">{t('class-dashboard.noClassesThisMonth', 'No classes this month.')}</p>
          </div>
        )}
      </div>

      {/* Bottom Action Bar - Shop/Resale style */}
      <div className="sticky bottom-0 bg-white/95 backdrop-blur-sm border-t border-[#f2f4f4] px-4 py-3 flex gap-3">
        <button
          onClick={handleChatWithOwner}
          className="flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl bg-[#F1F5F9] text-[#596061] font-bold text-sm active:scale-95 transition-all border border-slate-200"
        >
          <span className="material-symbols-outlined text-[20px]">chat</span>
          {t('class-dashboard.consultation', 'Inquiry')}
        </button>

        <button
          onClick={handleRegisterClass}
          className="flex-1 bg-[#0057bd] text-white rounded-xl py-3.5 flex items-center justify-center gap-2 active:scale-95 transition-all shadow-md shadow-[#0057bd]/20 font-bold text-[15px] relative overflow-hidden group"
        >
          <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out skew-x-12"></div>
          <span className="material-symbols-outlined text-[20px]">how_to_reg</span>
          {t('class-dashboard.registerClass', 'Register Class')}
        </button>
      </div>

    </div>
  );
}
