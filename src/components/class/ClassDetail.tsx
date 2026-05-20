'use client';

import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { groupService } from '@/lib/firebase/groupService';
import { Group, GroupClass, ClassDiscount, MonthlyPass } from '@/types/group';
import { useAuth } from '@/components/providers/AuthProvider';
import { classRegistrationService } from '@/lib/firebase/classRegistrationService';
import { doc, getDoc, query, collection, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/clientApp';
import { toast } from 'sonner';
import BottomSheet from '@/components/common/BottomSheet';
import Portal from '@/components/common/Portal';
import { AnimatePresence, motion } from 'framer-motion';
import { useModalNavigation } from '@/hooks/useModalNavigation';
import { useNavigation } from '@/components/providers/NavigationProvider';
import { useLanguage } from '@/contexts/LanguageContext';
import { chatService } from '@/lib/firebase/chatService';
import { notificationUtils } from '@/lib/utils/notificationUtils';
import { Timestamp } from 'firebase/firestore';
import GroupClassAddEditor from '@/components/groups/GroupClassAddEditor';
import GroupClassDiscountEditor from '@/components/groups/GroupClassDiscountEditor';
import GroupClassMonthlyPassEditor from '@/components/groups/GroupClassMonthlyPassEditor';

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

interface ClassDetailProps {
  groupId: string;
  onClose?: () => void;
  isModal?: boolean;
  isEmbedded?: boolean;
}

export default function ClassDetail({ groupId, onClose, isModal = false, isEmbedded = false }: ClassDetailProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isHeaderVisible, setGlobalNavHidden, setSubHeader } = useNavigation();
  const { t } = useLanguage();
  const { user, profile } = useAuth();
  
  // Tab State
  const [activeTab, setActiveTab] = useState<'TODAY' | 'MONTH' | 'SPECIAL'>('TODAY');
  const [todayDistrict, setTodayDistrict] = useState<'ALL' | '강북' | '강남'>('ALL');
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [sortOption, setSortOption] = useState<'class' | 'name'>('class');
  
  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedClasses, setSelectedClasses] = useState<Set<string>>(new Set());
  
  const { value: flow, openModal: openFlow, closeModal: closeFlow } = useModalNavigation('flow');
  const { value: classIdInUrl, openModal: openClassDetail, closeModal: closeClassDetail } = useModalNavigation('modal');
  
  const [selectedClassDetail, setSelectedClassDetail] = useState<any | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'paid' | 'pay_later'>('paid');
  const [showSuccess, setShowSuccess] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'Leader' | 'Follower' | null>(null);
  const [ownerInfo, setOwnerInfo] = useState<{name: string | null, localName: string | null, avatar: string | null, phone: string | null} | null>(null);
  
  // Purchase Flow States
  type PurchaseStep = 'summary' | 'payment' | 'complete';
  const [purchaseStep, setPurchaseStep] = useState<PurchaseStep>('summary');
  const [orderNumber, setOrderNumber] = useState('');
  const [orderId, setOrderId] = useState<string>('');
  const [countdown, setCountdown] = useState(3600); // 60 min
  const [buyerPhone, setBuyerPhone] = useState('');
  const [applicantMemo, setApplicantMemo] = useState('');
  const [isCopied, setIsCopied] = useState('');
  
  const [editingItem, setEditingItem] = useState<{type: 'class' | 'discount' | 'monthlyPass', data: any} | null>(null);
  const [showActionMenu, setShowActionMenu] = useState(false);

  const isAdminUser = useMemo(() => {
    if (!user || !profile) return false;
    if (profile.isAdmin || (profile as any).systemRole === 'admin') return true;
    if (group?.ownerId === user.uid) return true;
    
    if (selectedClassDetail?.itemType === 'class' && selectedClassDetail.instructors) {
      return selectedClassDetail.instructors.some((inst: any) => inst.userId === user.uid || inst.uid === user.uid || inst.name === user.displayName);
    }
    return false;
  }, [user, profile, group, selectedClassDetail]);
  
  const [currentDate, setCurrentDate] = useState<Date>(() => {
    const d = new Date();
    if (d.getDate() >= 15) d.setMonth(d.getMonth() + 1);
    return d;
  });

  const scrollRef = useRef<HTMLDivElement>(null);
  const captureRef = useRef<HTMLDivElement>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const handler = () => setIsScrolled(el.scrollTop > 60);
    el.addEventListener('scroll', handler, { passive: true });
    return () => el.removeEventListener('scroll', handler);
  }, [selectedClassDetail]);

  useEffect(() => {
    if (profile?.phoneNumber) {
      setBuyerPhone(profile.phoneNumber || '');
    }
  }, [profile]);

  // Countdown timer for payment step
  useEffect(() => {
    if (purchaseStep !== 'payment') return;
    const t = setInterval(() => setCountdown(p => Math.max(0, p - 1)), 1000);
    return () => clearInterval(t);
  }, [purchaseStep]);

  const mm = String(Math.floor(countdown / 60)).padStart(2, '0');
  const ss = String(countdown % 60).padStart(2, '0');

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setIsCopied(label);
      setTimeout(() => setIsCopied(''), 1500);
    });
  };

  const genOrderNumber = () => {
    const d = new Date();
    const date = `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`;
    const rawName = (profile as any)?.englishName || profile?.nickname || user?.displayName || 'user';
    const englishName = rawName.toLowerCase().replace(/[^a-z0-9]/g, '');
    const rand = String(Math.floor(Math.random() * 90) + 10);
    return `CLASS-${date}-${englishName}-${rand}`;
  };


  useEffect(() => {
    if (!groupId) return;
    
    const fetchGroupData = async () => {
      try {
        const groupData = await groupService.getGroup(groupId);
        setGroup(groupData);
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
  }, [groupId]);

  const currentMonthStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
  
  const isMonthClosed = useMemo(() => {
    if (!group?.classPaymentSettings?.openMonths) return true;
    return !group.classPaymentSettings.openMonths.includes(currentMonthStr);
  }, [group, currentMonthStr]);

  const monthlyPasses = useMemo(() => {
    return (group?.monthlyPasses || []).filter(p => p.targetMonth === currentMonthStr);
  }, [group?.monthlyPasses, currentMonthStr]);

  const discounts = useMemo(() => {
    return (group?.discounts || []).filter(d => d.targetMonth === currentMonthStr);
  }, [group?.discounts, currentMonthStr]);

  const allItems = useMemo(() => [
    ...monthlyPasses.map(p => ({ ...p, itemType: 'monthlyPass' as const })),
    ...discounts.map(d => ({ ...d, itemType: 'discount' as const })),
    ...(group?.classes || []).map(c => ({ ...c, itemType: 'class' as const }))
  ], [monthlyPasses, discounts, group?.classes]);

  const isMonthlyPassSelected = useMemo(() => {
    return Array.from(selectedClasses).some(id => 
      monthlyPasses.some(p => p.id === id)
    );
  }, [selectedClasses, monthlyPasses]);

  const handleAddToBasket = (id: string, type?: string) => {
    if (type === 'monthlyPass') {
      setSelectedClasses(new Set([id]));
    } else {
      if (isMonthlyPassSelected) {
        toast.info("Monthly pass is already selected. Remove it to select individual classes.");
        return;
      }
      const newSet = new Set(selectedClasses);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      setSelectedClasses(newSet);
    }
  };

  const handleRemoveFromBasket = (id: string) => {
    const newSet = new Set(selectedClasses);
    newSet.delete(id);
    setSelectedClasses(newSet);
  };

  const handleCardClick = (item: any) => {
    setSelectedClassDetail(item);
    openClassDetail(item.id);
  };

  const handleClose = () => {
    if (onClose) onClose();
    else router.back();
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    setTimeout(() => setIsDownloading(false), 2000);
  };

  // Tab Navigation Integration
  useEffect(() => {
    setSubHeader(
      <div className="flex w-full bg-white border-b border-[#f2f4f4] px-4">
        {([
          { id: 'TODAY', label: 'TODAY' },
          { id: 'MONTH', label: 'MONTH' },
          { id: 'SPECIAL', label: 'SPECIAL' }
        ] as const).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-4 text-sm font-black transition-all relative ${
              activeTab === tab.id ? 'text-primary' : 'text-[#acb3b4]'
            }`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <motion.div 
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-[3px] bg-primary rounded-t-full"
              />
            )}
          </button>
        ))}
      </div>
    );
    return () => setSubHeader(null);
  }, [activeTab, setSubHeader]);

  // Pre-compute items safely
  // Pre-compute month display
  const monthNamesShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthDisplay = `${monthNamesShort[currentDate.getMonth()]}(${String(currentDate.getMonth() + 1).padStart(2, '0')}), ${currentDate.getFullYear()}`;

  const todayClasses = useMemo(() => {
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    
    return (group?.classes || []).filter(cls => {
      const isToday = cls.schedule?.some(s => s.date === todayStr);
      if (!isToday) return false;
      if (todayDistrict !== 'ALL') {
        const loc = cls.location || '';
        return loc.includes(todayDistrict);
      }
      return true;
    });
  }, [group?.classes, todayDistrict]);

  const monthClasses = useMemo(() => {
    return (group?.classes || []).filter(cls => 
      (!cls.targetMonth || cls.targetMonth === currentMonthStr) && 
      cls.classType !== 'special'
    );
  }, [group?.classes, currentMonthStr]);

  const specialClasses = useMemo(() => {
    return (group?.classes || []).filter(cls => cls.classType === 'special');
  }, [group?.classes]);

  // Sync selectedClassDetail with URL
  useEffect(() => {
    if (classIdInUrl) {
      const item = allItems.find(i => i.id === classIdInUrl);
      if (item) {
        setSelectedClassDetail(item);
      } else {
        setSelectedClassDetail(null);
      }
    } else {
      setSelectedClassDetail(null);
      setShowActionMenu(false);
    }
  }, [classIdInUrl, group, currentDate, allItems]);

  const handleDelete = async () => {
    if (!selectedClassDetail || !group) return;
    
    if (window.confirm("Are you sure you want to delete this item? This action cannot be undone.")) {
      try {
        if (selectedClassDetail.itemType === 'class') {
          await groupService.deleteClass(group.id, selectedClassDetail.id);
        } else if (selectedClassDetail.itemType === 'discount') {
          await groupService.deleteDiscount(group.id, selectedClassDetail.id);
        } else if (selectedClassDetail.itemType === 'monthlyPass') {
          await groupService.deleteMonthlyPass(group.id, selectedClassDetail.id);
        }
        toast.success("Successfully deleted.");
        setShowActionMenu(false);
        closeClassDetail();
      } catch (error) {
        toast.error("Failed to delete.");
        console.error(error);
      }
    }
  };

  const handleJoinClass = (cls: GroupClass) => {
    setSelectedClassDetail({ ...cls, itemType: 'class' });
    setPurchaseStep('summary');
    openFlow('apply');
    setSelectedClasses(new Set([cls.id]));
  };

  const handleMonthCardClick = (item: any) => {
    // Navigate to Group Detail page as requested
    router.push(`/groups/${groupId}`);
  };

  const renderTodayTab = () => (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex items-center gap-2 px-1">
        {['ALL', '강북', '강남'].map((district) => (
          <button
            key={district}
            onClick={() => setTodayDistrict(district as 'ALL' | '강북' | '강남')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all border ${
              todayDistrict === district 
                ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' 
                : 'bg-white text-[#596061] border-[#f2f4f4]'
            }`}
          >
            {district}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {todayClasses.length > 0 ? (
          todayClasses.map((cls) => (
            <div 
              key={cls.id} 
              onClick={() => handleCardClick(cls)}
              className="bg-white rounded-[24px] overflow-hidden border border-[#f2f4f4] shadow-sm hover:shadow-md transition-all group cursor-pointer"
            >
              <div className="relative aspect-[16/9] overflow-hidden">
                <img 
                  src={cls.imageUrl || group?.coverImage || ''} 
                  alt={cls.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-4 left-4 flex gap-2">
                  <div className="bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black text-primary shadow-sm uppercase tracking-wider">
                    {cls.level || 'Open Level'}
                  </div>
                </div>
              </div>
              <div className="p-5">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-[1.125rem] font-black text-[#2d3435] leading-tight">{cls.title}</h3>
                  <p className="text-[1.125rem] font-black text-primary">{cls.amount.toLocaleString()} <span className="text-xs">{cls.currency}</span></p>
                </div>
                
                <div className="flex flex-col gap-2 mb-4">
                  <div className="flex items-center gap-2 text-[#596061]">
                    <span className="material-symbols-outlined text-sm">schedule</span>
                    <span className="text-xs font-bold">{cls.startTime} - {cls.endTime}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[#596061]">
                    <span className="material-symbols-outlined text-sm">location_on</span>
                    <span className="text-xs font-medium truncate">{cls.location || group?.address || ''}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-[#f2f4f4]">
                  <div className="flex -space-x-2">
                    {cls.instructors?.slice(0, 3).map((inst, i) => (
                      <div key={i} className="w-8 h-8 rounded-full border-2 border-white overflow-hidden bg-slate-100 shadow-sm">
                        <img src={inst.avatar} alt={inst.name} className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                  <button 
                    disabled={isMonthClosed}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleJoinClass(cls);
                    }}
                    className={`px-6 py-2.5 rounded-full text-sm font-black shadow-lg transition-all ${isMonthClosed ? 'bg-[#f2f4f4] text-[#acb3b4]' : 'bg-primary text-white shadow-primary/20 active:scale-95'}`}
                  >
                    JOIN NOW
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="py-20 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-[#f8f9fa] rounded-full flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-[#acb3b4] text-3xl">event_busy</span>
            </div>
            <p className="text-[#acb3b4] font-bold">No classes scheduled for today.</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderMonthTab = () => (
    <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-10">
      {monthlyPasses.length > 0 && (
        <section>
          <h3 className="text-[10px] font-black text-[#596061] mb-4 uppercase tracking-[0.2em] px-1">{t('class.monthlyPasses', 'MONTHLY PASSES')}</h3>
          <div className="grid grid-cols-1 gap-4">
            {monthlyPasses.map((pass) => (
              <div 
                key={pass.id} 
                className="bg-white border border-[#f2f4f4] rounded-[24px] p-6 shadow-sm hover:shadow-md transition-all group relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-1.5 h-full bg-primary" />
                <div className="flex justify-between items-start mb-3">
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] font-black text-primary tracking-[0.2em] uppercase">FULL ACCESS</span>
                    <h4 className="text-[1.25rem] font-black text-[#2d3435]">{pass.title}</h4>
                  </div>
                  {selectedClasses.has(pass.id) ? (
                    <button disabled={isMonthClosed} onClick={() => handleRemoveFromBasket(pass.id)} className={`transition-transform active:scale-90 ${isMonthClosed ? 'text-[#acb3b4]' : 'text-primary'}`}>
                      <span className="material-symbols-outlined text-[44px]">toggle_on</span>
                    </button>
                  ) : (
                    <button disabled={isMonthClosed} onClick={() => handleAddToBasket(pass.id, 'monthlyPass')} className={`transition-transform active:scale-90 ${isMonthClosed ? 'text-[#e0e4e5] opacity-50' : 'text-[#acb3b4]'}`}>
                      <span className="material-symbols-outlined text-[44px]">toggle_off</span>
                    </button>
                  )}
                </div>
                <p className="text-[13px] text-[#596061] leading-relaxed mb-4 line-clamp-2">
                  {pass.description || 'Enjoy unlimited access to regular classes this month.'}
                </p>
                <div className="flex justify-between items-center pt-4 border-t border-[#f2f4f4]">
                  <p className="text-[1.125rem] font-black text-primary">
                    {pass.amount.toLocaleString()} <span className="text-xs font-bold uppercase">{pass.currency}</span>
                  </p>
                  <button onClick={() => handleMonthCardClick({ ...pass, itemType: 'monthlyPass' })} className="text-[11px] font-black text-primary hover:scale-105 active:scale-95 transition-all flex items-center gap-1 bg-primary/5 px-3 py-1.5 rounded-full">
                    DETAILS <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {discounts.length > 0 && (
        <section>
          <h3 className="text-[10px] font-black text-[#596061] mb-4 uppercase tracking-[0.2em] px-1">{t('class.bundlePackages', 'BUNDLE PACKAGES')}</h3>
          <div className="grid grid-cols-1 gap-4">
            {discounts.map((disc) => (
              <div 
                key={disc.id} 
                className="bg-[#fff8f0] border border-[#d97706]/10 rounded-[24px] p-5 shadow-sm transition-all"
              >
                <div className="flex justify-between items-start mb-2">
                  <h4 className="text-base font-black text-[#d97706]">{disc.title}</h4>
                  {selectedClasses.has(disc.id) ? (
                    <button disabled={isMonthClosed} onClick={() => handleRemoveFromBasket(disc.id)} className={`transition-transform active:scale-90 ${isMonthClosed ? 'text-[#acb3b4]' : 'text-[#d97706]'}`}>
                      <span className="material-symbols-outlined text-[40px]">toggle_on</span>
                    </button>
                  ) : (
                    <button 
                      disabled={isMonthlyPassSelected || isMonthClosed}
                      onClick={() => handleAddToBasket(disc.id)} 
                      className={`transition-transform active:scale-90 ${(isMonthlyPassSelected || isMonthClosed) ? 'text-[#e0e4e5] opacity-50' : 'text-[#acb3b4]'}`}
                    >
                      <span className="material-symbols-outlined text-[40px]">toggle_off</span>
                    </button>
                  )}
                </div>
                <div className="flex justify-between items-center mt-3 pt-3 border-t border-[#d97706]/10">
                  <p className="text-base font-black text-[#d97706]">{disc.amount.toLocaleString()} {disc.currency}</p>
                  <button onClick={() => handleMonthCardClick({ ...disc, itemType: 'discount' })} className="text-[10px] font-black text-[#d97706]/60 hover:text-[#d97706] flex items-center gap-1">
                    DETAILS <span className="material-symbols-outlined text-xs">arrow_forward</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <h3 className="text-[10px] font-black text-[#596061] mb-4 uppercase tracking-[0.2em] px-1">{t('class.monthlyCourses', 'MONTHLY COURSES')}</h3>
        <div className="space-y-4">
          {monthClasses.length > 0 ? (
            monthClasses.map((cls) => (
              <div 
                key={cls.id} 
                className="flex gap-4 bg-white p-4 rounded-[24px] border border-[#f2f4f4] hover:shadow-md transition-all group relative overflow-hidden"
              >
                <div onClick={() => handleMonthCardClick({ ...cls, itemType: 'class' })} className="w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0 cursor-pointer">
                  <img src={cls.imageUrl || group?.coverImage || ''} alt={cls.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                </div>
                <div className="flex-1 flex flex-col justify-between min-w-0">
                  <div onClick={() => handleMonthCardClick({ ...cls, itemType: 'class' })} className="cursor-pointer group-hover:opacity-80 transition-opacity">
                    <h4 className="text-[15px] font-black text-[#2d3435] truncate mb-0.5">{cls.title}</h4>
                    <p className="text-[9px] font-black text-primary tracking-widest uppercase">{cls.level || 'All Levels'}</p>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-[15px] font-black text-[#2d3435]">{cls.amount.toLocaleString()} <span className="text-[10px]">{cls.currency}</span></p>
                    <div className="flex items-center gap-3">
                      <button onClick={() => handleMonthCardClick({ ...cls, itemType: 'class' })} className="text-[10px] font-black text-[#acb3b4] hover:text-primary transition-colors">INFO</button>
                      {selectedClasses.has(cls.id) ? (
                        <button disabled={isMonthClosed} onClick={() => handleRemoveFromBasket(cls.id)} className={`transition-transform active:scale-90 ${isMonthClosed ? 'text-[#acb3b4]' : 'text-primary'}`}>
                          <span className="material-symbols-outlined text-[40px]">toggle_on</span>
                        </button>
                      ) : (
                        <button 
                          disabled={isMonthlyPassSelected || isMonthClosed}
                          onClick={() => handleAddToBasket(cls.id)} 
                          className={`transition-transform active:scale-90 ${(isMonthlyPassSelected || isMonthClosed) ? 'text-[#e0e4e5] opacity-50' : 'text-[#acb3b4]'}`}
                        >
                          <span className="material-symbols-outlined text-[40px]">toggle_off</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="py-10 text-center bg-[#f8f9fa] rounded-[24px]">
              <p className="text-[#acb3b4] text-xs font-bold">No regular courses found for this month.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );

  const renderSpecialTab = () => (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {specialClasses.length > 0 ? (
        specialClasses.map((cls) => (
          <div 
            key={cls.id} 
            onClick={() => handleCardClick(cls)}
            className="relative rounded-[32px] overflow-hidden bg-[#2d3435] text-white shadow-2xl cursor-pointer group"
          >
            <div className="absolute inset-0">
              <img src={cls.imageUrl || group?.coverImage || ''} alt={cls.title} className="w-full h-full object-cover opacity-60" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#2d3435] via-[#2d3435]/40 to-transparent" />
            </div>
            <div className="relative p-8 pt-24">
              <div className="inline-flex items-center gap-2 bg-primary px-4 py-1.5 rounded-full mb-4 shadow-lg shadow-primary/30">
                <span className="material-symbols-outlined text-sm">stars</span>
                <span className="text-[10px] font-black tracking-widest uppercase">{t('class.specialEvent', 'SPECIAL EVENT')}</span>
              </div>
              <h3 className="text-2xl font-black mb-4 leading-tight">{cls.title}</h3>
              <div className="flex items-end justify-between">
                <div className="flex flex-col gap-1">
                  <p className="text-white/60 text-[10px] font-black tracking-widest uppercase">REGISTRATION FEE</p>
                  <p className="text-2xl font-black">{cls.amount.toLocaleString()} <span className="text-sm">{cls.currency}</span></p>
                </div>
                <button 
                  disabled={isMonthClosed}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleJoinClass(cls);
                  }}
                  className={`px-8 py-3.5 rounded-full text-sm font-black shadow-xl transition-all ${isMonthClosed ? 'bg-[#f2f4f4] text-[#acb3b4] shadow-none' : 'bg-white text-[#2d3435] active:scale-95'}`}
                >
                  RESERVE
                </button>
              </div>
            </div>
          </div>
        ))
      ) : (
        <div className="py-20 flex flex-col items-center justify-center text-center bg-[#f8f9fa] rounded-[32px] border border-dashed border-[#acb3b4]/30">
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm">
            <span className="material-symbols-outlined text-[#acb3b4] text-4xl">campaign</span>
          </div>
          <h4 className="text-[#2d3435] font-black mb-2">No Special Events Yet</h4>
          <p className="text-[#acb3b4] text-xs font-medium max-w-[200px]">Stay tuned for upcoming masterclasses!</p>
        </div>
      )}
    </div>
  );

  const bank = group?.classPaymentSettings?.bankDetails || group?.bankDetails;

  if (showSuccess) {
    return (
      <div className={isModal ? "fixed inset-0 bg-background text-on-background z-[200] flex flex-col justify-center items-center" : "w-full py-20 flex flex-col justify-center items-center"}>
        <main className="w-full max-w-[56rem] mx-auto px-[1.5rem] py-[2.5rem] flex flex-col items-center text-center">
          <div className="mb-8 relative flex justify-center items-center w-32 h-32 rounded-full bg-primary-container/20 shadow-xl">
            <div className="absolute inset-0 bg-primary-container/10 rounded-full animate-pulse blur-xl"></div>
            <span className="material-symbols-outlined text-primary text-6xl" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
          </div>
          <h1 className="font-['Plus_Jakarta_Sans'] text-[1.5rem] font-extrabold leading-[2rem] tracking-[-0.025em] text-primary mb-4">
            Application Successful!
          </h1>
          <p className="font-['Inter'] text-[0.875rem] font-medium leading-[1.25rem] text-on-surface-variant max-w-sm mb-12">
            You can check your class application status in <br/><span className="font-bold text-primary">My Info &gt; History</span>
          </p>
          <button 
            onClick={() => {
              if (isModal) handleClose();
              else router.push('/home');
            }} 
            className="w-full max-w-[320px] bg-primary text-on-primary py-4 px-6 rounded-xl shadow-md hover:shadow-xl hover:scale-[1.02] transition-all duration-200 flex items-center justify-center gap-2"
          >
            <span className="font-['Plus_Jakarta_Sans'] text-[1.125rem] font-bold leading-[1.5rem]">Back to Home</span>
            <span className="material-symbols-outlined">arrow_forward</span>
          </button>
        </main>
      </div>
    );
  }

  const contentLayout = (
    <div className={isModal ? "fixed inset-0 z-[9999] bg-white flex flex-col animate-in slide-in-from-bottom duration-300" : isEmbedded ? "flex flex-col bg-transparent w-full" : "flex flex-col bg-white w-full h-full"}>
      <style dangerouslySetInnerHTML={{ __html: `
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
      
      {!isEmbedded && (
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#f2f4f4] flex-shrink-0 bg-white z-10">
          {isModal ? (
            <button onClick={handleClose} className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-[#f2f4f4] transition-colors">
              <span className="material-symbols-outlined text-xl text-[#596061]">arrow_back</span>
            </button>
          ) : (
            <div className="w-10 h-10" />
          )}
          <div className="flex flex-col items-center">
            <h2 className="text-base font-black text-[#2d3435]">{t('class.registration_title', 'Class Registration')}</h2>
          </div>
          <div className="flex items-center gap-2">
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
      )}

      <div className={isEmbedded ? "" : "flex-1 overflow-y-auto no-scrollbar"}>
        <div ref={captureRef} className={`${isEmbedded ? 'px-0 py-2' : 'bg-white px-5 py-6'}`}>
          <div className="bg-gradient-to-r from-[#0057bd] to-[#3b82f6] rounded-[28px] p-6 mb-8 text-center shadow-lg shadow-blue-500/20">
            <p className="text-[10px] font-black text-blue-100 uppercase tracking-[0.3em] mb-2">Salsa & Bachata Community</p>
            <h1 className="text-2xl font-black text-white mb-4">{group?.name || ''}</h1>
            <div className="flex items-center justify-center gap-8 bg-white/10 rounded-2xl py-2 px-4 backdrop-blur-sm">
              <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))} className="text-white hover:bg-white/20 rounded-full w-8 h-8 flex items-center justify-center transition-colors">
                <span className="material-symbols-outlined text-sm">arrow_back_ios_new</span>
              </button>
              <p className="text-sm font-black text-white tracking-widest min-w-[120px] text-center uppercase">{monthDisplay}</p>
              <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))} className="text-white hover:bg-white/20 rounded-full w-8 h-8 flex items-center justify-center transition-colors">
                <span className="material-symbols-outlined text-sm">arrow_forward_ios</span>
              </button>
            </div>
          </div>

          {isMonthClosed && (
            <div className="bg-[#f8f9fa] border border-[#e0e4e5] rounded-[24px] p-4 mb-6 text-center shadow-sm">
              <span className="material-symbols-outlined text-[#acb3b4] text-2xl mb-2">event_busy</span>
              <p className="text-[#596061] font-bold text-sm">
                {t('class.registrationClosed', "Registration for this month's classes has ended")}
              </p>
            </div>
          )}

          <div className="min-h-[400px]">
            {activeTab === 'TODAY' && renderTodayTab()}
            {activeTab === 'MONTH' && renderMonthTab()}
            {activeTab === 'SPECIAL' && renderSpecialTab()}
              {/* Bank & Contact Info (Sticky bottom of tab content) */}
          <div className="mt-12 space-y-6">
            {bank && (
              <div className="border border-[#e0e4e5] rounded-[24px] overflow-hidden bg-[#f8f9fa]">
                <div className="px-5 py-3 border-b border-[#e0e4e5] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm text-[#0057bd]">account_balance</span>
                    <p className="text-[10px] font-black text-[#0057bd] uppercase tracking-[0.15em]">Payment Account</p>
                  </div>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(bank.accountNumber);
                      toast.success("Account number copied");
                    }}
                    className="text-[#0057bd] p-1.5 bg-white border border-[#0057bd]/20 rounded-lg shadow-sm"
                  >
                    <span className="material-symbols-outlined text-[16px]">content_copy</span>
                  </button>
                </div>
                <div className="p-5 space-y-3">
                  <div className="flex justify-between items-center"><span className="text-[11px] text-[#acb3b4] uppercase font-bold">Bank</span><span className="text-sm font-black text-[#2d3435]">{bank.bankName}</span></div>
                  <div className="flex justify-between items-center"><span className="text-[11px] text-[#acb3b4] uppercase font-bold">Account</span><span className="text-sm font-black text-[#2d3435] font-mono tracking-wide">{bank.accountNumber}</span></div>
                  <div className="flex justify-between items-center"><span className="text-[11px] text-[#acb3b4] uppercase font-bold">Holder</span><span className="text-sm font-black text-[#2d3435]">{bank.accountHolder}</span></div>
                </div>
              </div>
            )}

            <div className="border border-[#e0e4e5] rounded-[24px] overflow-hidden bg-white p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-[#f0f4ff] flex items-center justify-center flex-shrink-0 overflow-hidden shadow-inner">
                {group?.representative?.avatar || ownerInfo?.avatar ? (
                  <img src={group?.representative?.avatar || ownerInfo?.avatar || undefined} alt="admin" className="w-full h-full object-cover" />
                ) : (
                  <span className="material-symbols-outlined text-lg text-[#0057bd]">person</span>
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm font-black text-[#2d3435]">{group?.representative?.name || ownerInfo?.name || 'Stone Hong'}</p>
                <p className="text-[11px] text-[#acb3b4] font-medium mt-0.5">
                  Admin <span className="text-[#0057bd] font-bold ml-1">{group?.representative?.phone || ownerInfo?.phone || '010-7209-2468'}</span>
                </p>
              </div>
            </div>

            <div className="pt-4 pb-10 text-center">
              <p className="text-[9px] text-[#acb3b4] font-bold tracking-widest uppercase">© {new Date().getFullYear()} {group?.name || ''} · woc.today</p>
            </div>
          </div>
          </div>
        </div>
      </div>

      {/* FAB Basket */}
      <AnimatePresence>
        {selectedClasses.size > 0 && !isMonthClosed && (
          <motion.div 
            initial={false}
            animate={{ 
              y: isHeaderVisible ? 0 : 120, 
              opacity: isHeaderVisible ? 1 : 0 
            }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            className="fixed bottom-24 right-6 z-[60]"
          >
            <button
              onClick={() => openFlow('apply')}
              className="w-14 h-14 bg-primary text-white rounded-full shadow-xl shadow-primary/30 flex items-center justify-center hover:scale-105 active:scale-95 transition-all relative"
            >
              <span className="material-symbols-outlined text-[28px]">shopping_bag</span>
              <div className="absolute -top-1 -right-1 bg-error text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black border-2 border-white">
                {selectedClasses.size}
              </div>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Item Details Popup Modal */}
      <AnimatePresence>
        {selectedClassDetail && (
          <motion.div 
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[250] bg-white flex flex-col"
          >
            {/* ... Sub-detail content same as original ... */}
            <div className={`fixed top-0 left-0 right-0 z-[260] flex items-center justify-between px-4 py-3 transition-all duration-300 ${isScrolled ? 'bg-white/95 backdrop-blur-md shadow-sm' : 'bg-gradient-to-b from-black/30 to-transparent'}`}>
              <button onClick={() => closeClassDetail()} className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isScrolled ? 'bg-slate-100 text-[#2d3435]' : 'bg-black/20 backdrop-blur-sm text-white'}`}>
                <span className="material-symbols-outlined text-xl">arrow_back</span>
              </button>

              <div className={`text-sm font-bold truncate max-w-[180px] transition-opacity ${isScrolled ? 'opacity-100 text-[#2d3435]' : 'opacity-0'}`}>{selectedClassDetail.title}</div>
              
              <div className="relative">
                {isAdminUser ? (
                  <button 
                    onClick={() => setShowActionMenu(!showActionMenu)}
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isScrolled ? 'bg-slate-100 text-[#2d3435]' : 'bg-black/20 backdrop-blur-sm text-white'}`}
                  >
                    <span className="material-symbols-outlined text-xl">more_vert</span>
                  </button>
                ) : (
                  <div className="w-10 h-10"></div>
                )}
                
                {showActionMenu && isAdminUser && (
                  <>
                    <div className="fixed inset-0 z-[261]" onClick={() => setShowActionMenu(false)} />
                    <div className="absolute right-0 top-12 mt-1 w-40 bg-white rounded-xl shadow-xl border border-[#f2f4f4] py-2 z-[262] animate-in fade-in slide-in-from-top-2">
                      <button 
                        onClick={() => {
                          setShowActionMenu(false);
                          setEditingItem({ type: selectedClassDetail.itemType, data: selectedClassDetail });
                        }}
                        className="w-full text-left px-4 py-3 text-sm font-bold text-[#2d3435] hover:bg-[#f8f9fa] flex items-center gap-2"
                      >
                        <span className="material-symbols-outlined text-[18px]">edit</span>
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDelete()}
                        className="w-full text-left px-4 py-3 text-sm font-bold text-error hover:bg-error/5 flex items-center gap-2"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto no-scrollbar pb-[80px]">
              <div className="relative aspect-square overflow-hidden bg-[#f2f4f4] flex items-center justify-center">
                <img 
                  src={selectedClassDetail.imageUrl || selectedClassDetail.image || selectedClassDetail.photoURL || selectedClassDetail.avatar || group?.coverImage || ''}
                  alt={selectedClassDetail.title}
                  className="w-full h-full object-cover absolute inset-0"
                  onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement!.innerHTML = '<span class="material-symbols-outlined text-[#acb3b4] text-6xl">school</span>'; }}
                />
              </div>
              <div className="px-4 py-6 border-b border-[#f2f4f4]">
                <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1.5">{selectedClassDetail.itemType === 'monthlyPass' ? 'Monthly Pass' : selectedClassDetail.itemType === 'discount' ? 'Bundle' : 'Class'}</p>
                <h1 className="text-xl font-black text-[#2d3435] leading-tight mb-2">{selectedClassDetail.title}</h1>
                <p className="text-sm text-[#596061] leading-relaxed whitespace-pre-line">{selectedClassDetail.description || 'No description available.'}</p>
              </div>
              {/* ... more detail content ... */}
            </div>

            <div className="fixed bottom-0 left-0 right-0 z-[260] bg-white border-t border-slate-100 px-4 py-2.5 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-lg font-black text-[#2d3435] font-headline leading-tight">
                  {selectedClassDetail.amount?.toLocaleString()} {selectedClassDetail.currency || "KRW"}
                </p>
              </div>
              {selectedClassDetail.classType === 'special' ? (
                <button 
                  onClick={() => {
                    handleClose();
                    setTimeout(() => handleJoinClass(selectedClassDetail), 100);
                  }}
                  className="flex-shrink-0 bg-white text-[#2d3435] px-8 py-3 rounded-xl font-black text-sm tracking-wide shadow-lg shadow-black/10 border border-slate-200 active:scale-95 transition-transform flex items-center justify-center gap-1"
                >
                  RESERVE
                </button>
              ) : (
                <button 
                  onClick={() => handleAddToBasket(selectedClassDetail.id)}
                  className="flex-shrink-0 bg-primary text-white px-7 py-3 rounded-xl font-black text-sm tracking-wide shadow-lg shadow-primary/20 active:scale-95 transition-transform flex items-center gap-1"
                >
                  Add
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Editor Overlays */}
      <AnimatePresence>
        {editingItem && group && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300]"
          >
            {editingItem.type === 'class' && (
              <GroupClassAddEditor
                group={group}
                initialData={editingItem.data}
                onClose={() => setEditingItem(null)}
                onSave={() => setEditingItem(null)}
              />
            )}
            {editingItem.type === 'discount' && (
              <GroupClassDiscountEditor
                group={group}
                initialData={editingItem.data}
                onClose={() => setEditingItem(null)}
                onSave={() => setEditingItem(null)}
              />
            )}
            {editingItem.type === 'monthlyPass' && (
              <GroupClassMonthlyPassEditor
                group={group}
                initialData={editingItem.data}
                onClose={() => setEditingItem(null)}
                onSave={() => setEditingItem(null)}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>


      {/* Apply/Payment Modal */}
      <AnimatePresence>
        {flow === 'apply' && (
          <Portal>
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-0 z-[10000] bg-[#f8f9fa] text-[#2d3435] font-sans antialiased flex flex-col"
            >
              {/* TopAppBar */}
              <header className="fixed top-0 w-full z-[10001] flex items-center justify-between px-4 h-16 bg-white shadow-sm border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <button onClick={() => closeFlow()} className="p-2 rounded-full active:scale-95 duration-150 hover:bg-slate-50">
                    <span className="material-symbols-outlined text-slate-500">close</span>
                  </button>
                  <h1 className="font-title-md text-title-md text-[#2d3435] font-black">Class Registration</h1>
                </div>
                <div className="w-10 h-10"></div>
              </header>

              {/* Scrollable Content */}
              <main className="flex-1 overflow-y-auto pt-20 pb-32 px-5 max-w-[56rem] mx-auto w-full space-y-6">
                <section className="flex flex-col gap-2">
                   <h3 className="text-[10px] font-black text-[#596061] uppercase tracking-widest">{t('class.your_role', 'Your Role')} <span className="text-error">*</span></h3>
                   <div className="flex gap-2 mt-1">
                       <button className={`flex-1 py-3 rounded-xl border text-sm font-bold transition-all ${selectedRole === 'Leader' ? 'bg-primary text-white border-primary' : 'bg-white text-[#acb3b4] border-[#f2f4f4]'}`} onClick={() => setSelectedRole('Leader')}>{t('class.leader', 'Leader')}</button>
                       <button className={`flex-1 py-3 rounded-xl border text-sm font-bold transition-all ${selectedRole === 'Follower' ? 'bg-[#7c3aed] text-white border-[#7c3aed]' : 'bg-white text-[#acb3b4] border-[#f2f4f4]'}`} onClick={() => setSelectedRole('Follower')}>{t('class.follower', 'Follower')}</button>
                   </div>
                </section>

                {purchaseStep === 'summary' && (
                  <div className="space-y-6 animate-in fade-in duration-300">
                    <section className="flex flex-col gap-2">
                      <h3 className="text-[10px] font-black text-[#596061] uppercase tracking-widest">{t('class.selected_items', 'Selected Items')}</h3>
                      <div className="space-y-3">
                        {Array.from(selectedClasses).map(id => {
                          const item = allItems.find(i => i.id === id);
                          if (!item) return null;
                          return (
                            <div key={id} className="flex items-center justify-between p-3 bg-[#f8f9fa] rounded-2xl border border-[#f2f4f4]">
                              <div className="flex flex-col">
                                <p className="text-sm font-black text-[#2d3435]">{item.title}</p>
                                <p className="text-[10px] text-primary font-black uppercase tracking-wider">{item.itemType}</p>
                              </div>
                              <p className="text-sm font-black text-[#2d3435]">{item.amount.toLocaleString()} {item.currency}</p>
                            </div>
                          );
                        })}
                        <div className="flex justify-between items-center px-2 pt-2">
                          <p className="text-xs font-bold text-[#596061]">{t('class.total_amount', 'Total Amount')}</p>
                          <p className="text-lg font-black text-primary">
                            {Array.from(selectedClasses).reduce((sum, id) => sum + (allItems.find(i => i.id === id)?.amount || 0), 0).toLocaleString()} {group?.classes?.[0]?.currency || 'KRW'}
                          </p>
                        </div>
                      </div>
                    </section>

                    <section className="flex flex-col gap-2">
                      <h3 className="text-[10px] font-black text-[#596061] uppercase tracking-widest">{t('class.contact_number', 'Contact Number')} <span className="text-error">*</span></h3>
                      <input
                        type="tel"
                        value={buyerPhone}
                        onChange={(e) => setBuyerPhone(e.target.value)}
                        placeholder="010-0000-0000"
                        className="w-full bg-[#f8f9fa] border border-[#f2f4f4] rounded-xl px-4 py-3.5 text-sm text-[#2d3435] font-bold focus:outline-none focus:border-primary transition-all"
                      />
                      <p className="text-[10px] text-[#acb3b4] font-medium leading-relaxed">{t('class.admin_contact_notice', 'Admin will contact you at this number for confirmation.')}</p>
                    </section>

                    <section className="flex flex-col gap-2">
                      <h3 className="text-[10px] font-black text-[#596061] uppercase tracking-widest">{t('class.applicant_memo', 'Class Registration Memo (Optional)')}</h3>
                      <textarea
                        value={applicantMemo}
                        onChange={(e) => setApplicantMemo(e.target.value)}
                        placeholder={t('class.memo_placeholder', 'Leave a message (max 100 characters)')}
                        maxLength={100}
                        rows={3}
                        className="w-full bg-[#f8f9fa] border border-[#f2f4f4] rounded-xl px-4 py-3 text-sm text-[#2d3435] resize-none focus:outline-none focus:border-primary transition-all"
                      />
                    </section>

                    <button 
                      onClick={async () => {
                        if (!user || !selectedRole) {
                          toast.error("Please select your role (Leader/Follower)");
                          return;
                        }
                        if (!buyerPhone.trim()) {
                          toast.error("Please enter your contact number");
                          return;
                        }
                        
                        setIsApplying(true);
                        try {
                          const num = genOrderNumber();
                          setOrderNumber(num);
                          
                          const totalAmount = Array.from(selectedClasses).reduce((sum, id) => sum + (allItems.find(i => i.id === id)?.amount || 0), 0);
                          const classTitles = Array.from(selectedClasses).map(id => allItems.find(i => i.id === id)?.title).filter(Boolean).join(', ');

                          const regPromises = Array.from(selectedClasses).map(classId => {
                            const item = allItems.find(c => c.id === classId);
                            if (!item) return Promise.resolve();
                            
                            return classRegistrationService.addRegistration({
                              classId: item.id,
                              groupId,
                              userId: user.uid,
                              applicantName: user.displayName || profile?.nickname || 'Anonymous',
                              classTitle: item.title,
                              status: 'PAYMENT_PENDING',
                              paymentStatus: 'pending',
                              contactNumber: buyerPhone,
                              role: selectedRole,
                              orderNumber: num,
                              amount: item.amount,
                              currency: item.currency || 'KRW',
                              applicantMemo: applicantMemo.trim() || undefined
                            });
                          });

                          const results = await Promise.all(regPromises);
                          const firstReg = results.find(r => r && r.id);
                          if (firstReg) setOrderId(firstReg.id);

                          // Chat Notification
                          try {
                            const adminId = group?.ownerId || 'adminstone';
                            await notificationUtils.sendClassReservationNotification({
                              user,
                              adminId,
                              orderNumber: num,
                              classTitles,
                              totalAmount,
                              selectedRole,
                              buyerPhone,
                              applicantMemo: applicantMemo.trim() || undefined,
                              t
                            });
                          } catch (e) { console.error("Chat notify failed:", e); }

                          setPurchaseStep('payment');
                        } catch (error) {
                          console.error("Application failed:", error);
                          toast.error("Failed to process reservation.");
                        } finally {
                          setIsApplying(false);
                        }
                      }}
                      disabled={isApplying}
                      className="w-full bg-primary text-white py-4 rounded-[20px] font-black text-sm tracking-wide shadow-xl shadow-primary/20 active:scale-[0.98] transition-all disabled:opacity-50"
                    >
                      {isApplying ? "Processing..." : t('class.complete_application', 'Complete Application')}
                    </button>
                  </div>
                )}

                {purchaseStep === 'payment' && (
                  <div className="space-y-6 animate-in slide-in-from-right duration-300">
                    <div className="text-center py-2">
                      <div className="inline-flex items-center gap-2 bg-[#fff7ed] border border-[#fed7aa] rounded-2xl px-5 py-3">
                        <span className="material-symbols-outlined text-lg text-orange-500">timer</span>
                        <span className="text-2xl font-black text-orange-600 font-mono tracking-wider">{mm}:{ss}</span>
                      </div>
                      <p className="text-[11px] text-[#596061] font-bold mt-3">Please transfer within 1 hour to secure your spot.</p>
                    </div>

                    <div className="bg-[#f8f9fa] rounded-2xl p-4 border border-[#e0e4e5]">
                      <p className="text-[10px] font-black text-[#acb3b4] uppercase tracking-widest mb-1">Reservation No.</p>
                      <div className="flex items-center justify-between">
                        <p className="text-base font-black text-[#2d3435] font-mono">{orderNumber}</p>
                        <button onClick={() => copyToClipboard(orderNumber, 'order')}
                          className={`text-[10px] font-black px-3 py-1.5 rounded-full transition-all ${isCopied === 'order' ? 'bg-emerald-100 text-emerald-700' : 'bg-[#e8eaec] text-[#596061]'}`}>
                          {isCopied === 'order' ? '✓ COPIED' : 'COPY'}
                        </button>
                      </div>
                    </div>

                    <div className="border border-[#e0e4e5] rounded-[24px] overflow-hidden bg-white shadow-sm">
                      <div className="bg-[#f8f9fa] px-4 py-3 border-b border-[#e0e4e5] flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm text-primary">account_balance</span>
                        <p className="text-[10px] font-black text-primary uppercase tracking-widest">Bank Details</p>
                      </div>
                      <div className="p-5 space-y-4">
                        <div className="flex justify-between items-center">
                          <p className="text-[10px] text-[#acb3b4] font-black uppercase">Bank</p>
                          <p className="text-sm font-black text-[#2d3435]">{bank?.bankName}</p>
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="flex flex-col">
                            <p className="text-[10px] text-[#acb3b4] font-black uppercase">Account</p>
                            <p className="text-sm font-black text-[#2d3435] font-mono">{bank?.accountNumber}</p>
                          </div>
                          <button onClick={() => copyToClipboard(bank?.accountNumber || '', 'acc')}
                            className={`text-[10px] font-black px-3 py-1.5 rounded-full transition-all ${isCopied === 'acc' ? 'bg-emerald-100 text-emerald-700' : 'bg-primary text-white'}`}>
                            {isCopied === 'acc' ? '✓ COPIED' : 'COPY'}
                          </button>
                        </div>
                        <div className="flex justify-between items-center">
                          <p className="text-[10px] text-[#acb3b4] font-black uppercase">Holder</p>
                          <p className="text-sm font-black text-[#2d3435]">{bank?.accountHolder}</p>
                        </div>
                        <div className="bg-[#f0f4ff] rounded-xl p-4 flex items-center justify-between">
                          <div className="flex flex-col">
                            <p className="text-[10px] text-primary font-black uppercase">Total Amount</p>
                            <p className="text-xl font-black text-primary">
                              {Array.from(selectedClasses).reduce((sum, id) => sum + (allItems.find(i => i.id === id)?.amount || 0), 0).toLocaleString()} KRW
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <button 
                      onClick={async () => {
                        setIsApplying(true);
                        try {
                          // Update all registrations for this order to PAYMENT_REPORTED
                          const q = query(
                            collection(db, 'class_registrations'),
                            where('orderNumber', '==', orderNumber),
                            where('userId', '==', user?.uid)
                          );
                          const snap = await getDocs(q);
                          const updatePromises = snap.docs.map(d => 
                            classRegistrationService.updateRegistration(d.id, { 
                              status: 'PAYMENT_REPORTED',
                              paymentStatus: 'reported'
                            })
                          );
                          await Promise.all(updatePromises);

                          // Chat Notification
                          try {
                            const adminId = group?.ownerId || 'adminstone';
                            await notificationUtils.sendClassPaymentReportedNotification({
                              user,
                              adminId,
                              orderNumber,
                              depositorName: user?.displayName || undefined,
                              t
                            });
                          } catch (e) { console.error("Chat report failed:", e); }

                          setPurchaseStep('complete');
                        } catch (e) {
                          toast.error("Failed to report payment.");
                        } finally {
                          setIsApplying(false);
                        }
                      }}
                      className="w-full bg-[#2d3435] text-white py-4 rounded-[20px] font-black text-sm tracking-wide shadow-xl active:scale-[0.98] transition-all"
                    >
                      I've Transferred the Payment
                    </button>
                  </div>
                )}

                {purchaseStep === 'complete' && (
                  <div className="flex flex-col items-center justify-center py-10 animate-in fade-in duration-500">
                    <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mb-6">
                      <span className="material-symbols-outlined text-4xl text-emerald-600" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                    </div>
                    <h3 className="text-xl font-black text-[#2d3435] mb-2">Reservation Placed!</h3>
                    <p className="text-sm text-[#596061] text-center leading-relaxed mb-8 px-4">
                      Your reservation has been received. Admin will confirm your payment shortly. Check status in My Info.
                    </p>
                    <button 
                      onClick={() => {
                        closeFlow();
                        setSelectedClasses(new Set()); // Clear basket after completion
                        router.push('/history');
                      }}
                      className="w-full bg-primary text-white py-4 rounded-[20px] font-black text-sm tracking-wide shadow-xl shadow-primary/20 transition-all"
                    >
                      View My History
                    </button>
                  </div>
                )}

              </main>
            </motion.div>
          </Portal>
        )}
      </AnimatePresence>
    </div>
  );

  if (isModal) {
    return <Portal>{contentLayout}</Portal>;
  }

  return contentLayout;
}
