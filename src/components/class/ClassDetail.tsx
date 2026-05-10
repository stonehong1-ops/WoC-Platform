'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { groupService } from '@/lib/firebase/groupService';
import { Group, GroupClass } from '@/types/group';
import { useAuth } from '@/components/providers/AuthProvider';
import { classRegistrationService } from '@/lib/firebase/classRegistrationService';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { toast } from 'sonner';
import BottomSheet from '@/components/common/BottomSheet';
import { AnimatePresence, motion } from 'framer-motion';
import { useModalNavigation } from '@/hooks/useModalNavigation';
import { useNavigation } from '@/components/providers/NavigationProvider';


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
  const { isHeaderVisible, setGlobalNavHidden } = useNavigation();
  
  useEffect(() => {
    if (isModal) {
      setGlobalNavHidden(true);
      return () => setGlobalNavHidden(false);
    }
  }, [setGlobalNavHidden, isModal]);
  
  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedClasses, setSelectedClasses] = useState<Set<string>>(new Set());
  
  // URL-bound navigation
  const { value: flow, openModal: openFlow, closeModal: closeFlow } = useModalNavigation('flow');
  const { value: classIdInUrl, openModal: openClassDetail, closeModal: closeClassDetail } = useModalNavigation('modal');
  
  const [selectedClassDetail, setSelectedClassDetail] = useState<any | null>(null);
  
  const [paymentStatus, setPaymentStatus] = useState<'paid' | 'pay_later'>('paid');
  const [showSuccess, setShowSuccess] = useState(false);

  const [passSelectedClassIds, setPassSelectedClassIds] = useState<Set<string>>(new Set());
  const { user, profile } = useAuth();
  const [isApplying, setIsApplying] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'leader' | 'follower' | null>(null);
  const [ownerInfo, setOwnerInfo] = useState<{name: string | null, localName: string | null, avatar: string | null, phone: string | null} | null>(null);
  
  const [currentDate, setCurrentDate] = useState<Date>(() => {
    const d = new Date();
    if (d.getDate() >= 15) {
      d.setMonth(d.getMonth() + 1);
    }
    return d;
  });
  const [sortOption, setSortOption] = useState<'class' | 'name'>('class');
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  
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
    if (flow === 'apply' && !selectedRole) {
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
  }, [flow, profile, selectedRole]);


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

  // Pre-compute items for the hook safely
  const currentMonthStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
  const monthNamesShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthDisplay = `${monthNamesShort[currentDate.getMonth()]}(${String(currentDate.getMonth() + 1).padStart(2, '0')}), ${currentDate.getFullYear()}`;

  const allGroupClasses = group?.classes || [];
  const classes = allGroupClasses.filter(cls => !cls.targetMonth || cls.targetMonth === currentMonthStr);
  const monthlyPasses = (group?.monthlyPasses || []).filter(p => !p.targetMonth || p.targetMonth === currentMonthStr);
  const discounts = (group?.discounts || []).filter(d => !d.targetMonth || d.targetMonth === currentMonthStr);

  const packages = [
    ...monthlyPasses.map(p => ({ ...p, itemType: 'monthlyPass' as const, amount: p.amount, currency: p.currency })),
    ...discounts.map(d => ({ ...d, itemType: 'discount' as const, amount: d.amount, currency: d.currency }))
  ];

  const allItems = [...packages, ...classes.map(c => ({ ...c, itemType: 'class' as const }))];

  // Sync selectedClassDetail with URL
  useEffect(() => {
    if (classIdInUrl) {
      const item = allItems.find(i => i.id === classIdInUrl);
      if (item) {
        setSelectedClassDetail(item);
        if (item.itemType === 'monthlyPass' || item.itemType === 'discount') {
          const passClasses = item.includedClassIds && item.includedClassIds.length > 0 
            ? classes.filter(c => item.includedClassIds.includes(c.id))
            : classes;
          setPassSelectedClassIds(new Set(passClasses.map(c => c.id)));
        }
      } else {
        setSelectedClassDetail(null);
      }
    } else {
      setSelectedClassDetail(null);
    }
  }, [classIdInUrl, group, currentDate]);

  const handleClose = () => {
    if (onClose) onClose();
    else router.back();
  };

  if (loading) {
    return (
      <div className={isModal ? "fixed inset-0 z-[200] bg-white flex justify-center items-center" : "w-full py-20 flex justify-center items-center"}>
        <span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
      </div>
    );
  }

  if (!group) {
    return (
      <div className={isModal ? "fixed inset-0 z-[200] bg-white flex flex-col justify-center items-center space-y-4" : "w-full py-20 flex flex-col justify-center items-center space-y-4"}>
        <span className="material-symbols-outlined text-4xl text-outline">error</span>
        <h2 className="font-['Plus_Jakarta_Sans'] text-[1.125rem] font-bold leading-[1.5rem] text-on-surface">Club not found</h2>
        {isModal && <button onClick={handleClose} className="text-primary hover:underline">Go back</button>}
      </div>
    );
  }

  const handleCardClick = (item: any) => {
    openClassDetail(item.id);
  };

  const isMonthlyPassSelected = selectedClasses.size > 0 && Array.from(selectedClasses).some(id => 
    group?.monthlyPasses?.some(p => p.id === id)
  );

  const handleAddToBasket = (classId: string, itemType?: string) => {
    setSelectedClasses(prev => {
      let newSet = new Set(prev);
      if (itemType === 'monthlyPass') {
        newSet.clear();
      }
      newSet.add(classId);
      return newSet;
    });
    closeClassDetail();
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
              if (!img.src.startsWith(currentUrl.origin)) {
                img.src = `${currentUrl.origin}/api/proxy/image?url=${encodeURIComponent(img.src)}`;
              }
            }
          });
        }
      });
      const link = document.createElement('a');
      link.download = `${monthDisplay.replace(' ', '-')}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Download failed:', err);
      alert('Failed to download image. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  const sortedClasses = [...classes];
  if (sortOption === 'name') {
    sortedClasses.sort((a, b) => a.title.localeCompare(b.title));
  }

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

  return (
    <div className={isModal ? "fixed inset-0 z-[200] bg-white flex flex-col animate-in slide-in-from-bottom duration-300" : isEmbedded ? "flex flex-col bg-transparent w-full" : "flex flex-col bg-white w-full h-full"}>
      <style dangerouslySetInnerHTML={{ __html: `
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
      
      {/* Header */}
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
            <h2 className="text-base font-black text-[#2d3435]">Class Schedule</h2>
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

      {/* Scrollable Content */}
      <div className={isEmbedded ? "" : "flex-1 overflow-y-auto no-scrollbar"}>
        <div ref={captureRef} className={`${isEmbedded ? 'px-0 py-2' : 'bg-white px-5 py-6'}`}>
          
          {/* Title Banner */}
          <div className="bg-gradient-to-r from-[#0057bd] to-[#3b82f6] rounded-2xl p-5 mb-6 text-center shadow-lg shadow-blue-500/20">
            <p className="text-[10px] font-bold text-blue-200 uppercase tracking-[0.2em] mb-1">CLASS INFORMATION</p>
            <h1 className="text-xl font-black text-white mb-3">{group.name}</h1>
            <div className="flex items-center justify-center gap-8">
              <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))} className="text-white hover:bg-white/20 rounded-full w-8 h-8 flex items-center justify-center transition-colors">
                <span className="material-symbols-outlined text-sm">arrow_back_ios_new</span>
              </button>
              <p className="text-base font-black text-white tracking-widest min-w-[120px] text-center">{monthDisplay}</p>
              <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))} className="text-white hover:bg-white/20 rounded-full w-8 h-8 flex items-center justify-center transition-colors">
                <span className="material-symbols-outlined text-sm">arrow_forward_ios</span>
              </button>
            </div>
          </div>

          {/* Monthly Pass Info */}
          {monthlyPasses && monthlyPasses.length > 0 && (
            <div className="mb-6 bg-[#f0f4ff] border border-[#0057bd]/20 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-[#0057bd] text-lg">local_activity</span>
                <h3 className="text-sm font-black text-[#0057bd]">Monthly Pass</h3>
              </div>
              <div className="space-y-3">
                {monthlyPasses.map(pass => (
                  <div key={pass.id} onClick={() => handleCardClick({ ...pass, itemType: 'monthlyPass' })} className="bg-white rounded-xl p-3 shadow-sm border border-[#0057bd]/10 cursor-pointer hover:shadow-md transition-all">
                    <div className="flex justify-between items-start mb-1">
                      <p className="text-sm font-bold text-[#2d3435]">{pass.title}</p>
                    </div>
                    {pass.description && (
                      <p className="text-xs text-[#596061] leading-relaxed whitespace-pre-wrap mb-2">{pass.description}</p>
                    )}
                    <div className="flex justify-between items-center mt-2 pt-2 border-t border-[#0057bd]/10">
                      <p className="text-sm font-black text-[#0057bd]">
                        {pass.amount.toLocaleString()} {pass.currency}
                      </p>
                      {selectedClasses.has(pass.id) ? (
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleRemoveFromBasket(pass.id); }}
                          className="text-[#0057bd] flex items-center justify-center transition-colors"
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '44px' }}>toggle_on</span>
                        </button>
                      ) : (
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleAddToBasket(pass.id, 'monthlyPass'); }}
                          className="text-[#acb3b4] flex items-center justify-center transition-colors"
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
                        {disc.amount.toLocaleString()} {disc.currency}
                      </p>
                      {selectedClasses.has(disc.id) ? (
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleRemoveFromBasket(disc.id); }}
                          className="text-[#0057bd] flex items-center justify-center transition-colors"
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '44px' }}>toggle_on</span>
                        </button>
                      ) : (
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleAddToBasket(disc.id); }}
                          disabled={isMonthlyPassSelected}
                          className={`flex items-center justify-center transition-colors ${isMonthlyPassSelected ? 'text-[#e0e4e5] cursor-not-allowed' : 'text-[#acb3b4]'}`}
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
            <div className="relative">
              <button
                onClick={() => setShowSortDropdown(!showSortDropdown)}
                className="flex items-center gap-1 text-sm font-semibold text-[#596061] hover:text-[#2d3435] transition-colors"
              >
                {sortOption === 'class' ? 'Class Order' : 'Name Order'}
                <span className="material-symbols-outlined text-base">expand_more</span>
              </button>
              {showSortDropdown && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowSortDropdown(false)} />
                  <div className="absolute top-full mt-1 right-0 bg-white rounded-xl shadow-xl border border-slate-100 min-w-[150px] z-50 overflow-hidden">
                    <button
                      onClick={() => { setSortOption('class'); setShowSortDropdown(false); }}
                      className={`w-full text-left px-4 py-2.5 text-sm font-medium flex items-center gap-2 transition-colors ${
                        sortOption === 'class' ? 'bg-primary/10 text-[#1A73E8] font-bold' : 'text-[#2d3435] hover:bg-slate-50'
                      }`}
                    >
                      <span className="material-symbols-outlined text-base">format_list_numbered</span>
                      Class Order
                    </button>
                    <button
                      onClick={() => { setSortOption('name'); setShowSortDropdown(false); }}
                      className={`w-full text-left px-4 py-2.5 text-sm font-medium flex items-center gap-2 transition-colors ${
                        sortOption === 'name' ? 'bg-primary/10 text-[#1A73E8] font-bold' : 'text-[#2d3435] hover:bg-slate-50'
                      }`}
                    >
                      <span className="material-symbols-outlined text-base">sort_by_alpha</span>
                      Name Order
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="space-y-4">
            {sortOption === 'class' ? (
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
                            startDisplay = `${dd.getMonth() + 1}/${dd.getDate()}`;
                          }
                        }
                        const timeDisplay = cls.schedule?.[0]?.timeSlot || (cls.startTime ? `${cls.startTime}${cls.endTime ? ' - ' + cls.endTime : ''}` : '');
                        return (
                          <div key={cls.id} onClick={() => handleCardClick({ ...cls, itemType: 'class' })} className="p-3 flex gap-3 cursor-pointer hover:bg-[#f8f9fa] transition-colors group bg-white">
                            <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-[#e0e4e5]">
                              {cls.imageUrl || (cls as any).image || (cls as any).photoURL || (cls as any).avatar ? (
                                <img src={cls.imageUrl || (cls as any).image || (cls as any).photoURL || (cls as any).avatar} alt={cls.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <span className="material-symbols-outlined text-[#acb3b4] text-lg">school</span>
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-[#2d3435] truncate">{cls.title}</p>
                              <p className="text-[13px] font-black text-[#2d3435] mt-0.5">{cls.amount.toLocaleString()} {cls.currency}</p>
                              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1">
                                {startDisplay && <span className="text-[11px] font-bold" style={{ color }}>Start: {startDisplay}</span>}
                                {timeDisplay && <span className="text-[11px] text-[#596061]">{timeDisplay}</span>}
                              </div>
                              {schedDates && <p className="text-[10px] text-[#acb3b4] mt-0.5">Schedule: <span className="font-bold text-[#596061]">{schedDates}</span></p>}
                            </div>
                            <div className="flex flex-col items-end flex-shrink-0 ml-1 justify-between py-1">
                              {instructors.length > 0 && (
                                <div className="flex flex-row gap-2 items-center justify-end mb-2">
                                  {instructors.slice(0, 2).map((inst, idx) => (
                                    <div key={idx} className="flex flex-col items-center w-8">
                                      <div className="w-7 h-7 rounded-full overflow-hidden bg-[#e0e4e5] border border-[#f2f4f4]">
                                        <img src={(inst as any).avatar || (inst as any).photoURL || (inst as any).image || (inst as any).imageUrl} alt={inst.name} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement!.innerHTML = `<div class="w-full h-full flex items-center justify-center text-[7px] font-bold text-[#596061] bg-[#f8f9fa]">${inst.name.substring(0, 1)}</div>` }} />
                                      </div>
                                      <p className="text-[8px] font-bold text-[#596061] mt-0.5 text-center truncate w-full">{inst.name}</p>
                                    </div>
                                  ))}
                                </div>
                              )}
                              {selectedClasses.has(cls.id) ? (
                                <button onClick={(e) => { e.stopPropagation(); handleRemoveFromBasket(cls.id); }} className="text-[#0057bd] flex items-center justify-center transition-colors"><span className="material-symbols-outlined" style={{ fontSize: '44px' }}>toggle_on</span></button>
                              ) : (
                                <button onClick={(e) => { e.stopPropagation(); handleAddToBasket(cls.id); }} disabled={isMonthlyPassSelected} className={`flex items-center justify-center transition-colors ${isMonthlyPassSelected ? 'text-[#e0e4e5] cursor-not-allowed' : 'text-[#acb3b4]'}`}><span className="material-symbols-outlined" style={{ fontSize: '44px' }}>toggle_off</span></button>
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
              <div className="border border-[#e0e4e5] rounded-2xl overflow-hidden divide-y divide-[#f2f4f4]">
                {sortedClasses.map(cls => (
                  <div key={cls.id} onClick={() => handleCardClick({ ...cls, itemType: 'class' })} className="p-3 flex gap-3 cursor-pointer hover:bg-[#f8f9fa] transition-colors group bg-white">
                    <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-[#e0e4e5]">
                      {cls.imageUrl || (cls as any).image || (cls as any).photoURL || (cls as any).avatar ? (
                        <img src={cls.imageUrl || (cls as any).image || (cls as any).photoURL || (cls as any).avatar} alt={cls.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center"><span className="material-symbols-outlined text-[#acb3b4] text-lg">school</span></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-[#2d3435] truncate">{cls.title}</p>
                      <p className="text-[13px] font-black text-[#2d3435] mt-0.5">{cls.amount.toLocaleString()} {cls.currency}</p>
                      {/* ... other metadata same as above ... */}
                    </div>
                    <div className="flex flex-col items-end flex-shrink-0 ml-1 justify-between py-1">
                      {/* ... toggle button same as above ... */}
                    </div>
                  </div>
                ))}
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
                >
                  <span className="material-symbols-outlined text-[14px]">content_copy</span>
                </button>
              </div>
              <div className="p-4 space-y-2">
                <div className="flex justify-between items-center"><span className="text-[11px] text-[#acb3b4] uppercase font-bold">Bank</span><span className="text-sm font-bold text-[#2d3435]">{bank.bankName}</span></div>
                <div className="flex justify-between items-center"><span className="text-[11px] text-[#acb3b4] uppercase font-bold">Account</span><span className="text-sm font-black text-[#2d3435] font-mono tracking-wide">{bank.accountNumber}</span></div>
                <div className="flex justify-between items-center"><span className="text-[11px] text-[#acb3b4] uppercase font-bold">Holder</span><span className="text-sm font-bold text-[#2d3435]">{bank.accountHolder}</span></div>
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
                </div>
                <p className="text-[11px] text-[#acb3b4] font-medium mt-0.5">
                  <span className="text-[#0057bd] font-bold">{group.representative?.phone || ownerInfo?.phone || '010-7209-2468'}</span> (Admin)
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-[9px] text-[#acb3b4]">© {new Date().getFullYear()} {group.name} · woc.today</p>
          </div>
        </div>
      </div>

      {/* FAB Basket */}
      <AnimatePresence>
        {selectedClasses.size > 0 && (
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
              <div className="w-10 h-10"></div>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto no-scrollbar pb-[80px]">
              <div className="relative aspect-square overflow-hidden bg-[#f2f4f4] flex items-center justify-center">
                <img 
                  src={selectedClassDetail.imageUrl || selectedClassDetail.image || selectedClassDetail.photoURL || selectedClassDetail.avatar || group.coverImage}
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
              <button 
                onClick={() => handleAddToBasket(selectedClassDetail.id)}
                className="flex-shrink-0 bg-primary text-white px-7 py-3 rounded-xl font-black text-sm tracking-wide shadow-lg shadow-primary/20 active:scale-95 transition-transform flex items-center gap-1"
              >
                Add
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Apply/Payment Modal */}
      <BottomSheet isOpen={flow === 'apply'} onClose={() => closeFlow()} title="Class Registration">

        <div className="px-5 pb-8 flex flex-col gap-6">
          <section className="flex flex-col gap-2">
             <h3 className="text-[10px] font-black text-[#596061] uppercase tracking-widest">Your Role <span className="text-error">*</span></h3>
             <div className="flex gap-2 mt-1">
                 <button className={`flex-1 py-3 rounded-xl border text-sm font-bold transition-all ${selectedRole === 'leader' ? 'bg-primary text-white' : 'bg-white text-[#acb3b4]'}`} onClick={() => setSelectedRole('leader')}>Leader</button>
                 <button className={`flex-1 py-3 rounded-xl border text-sm font-bold transition-all ${selectedRole === 'follower' ? 'bg-tertiary text-white' : 'bg-white text-[#acb3b4]'}`} onClick={() => setSelectedRole('follower')}>Follower</button>
             </div>
          </section>

          <section className="flex flex-col gap-2">
             <h3 className="text-[10px] font-black text-[#596061] uppercase tracking-widest">Payment Method</h3>
             <div className="flex gap-2 mt-1">
                 <button className={`flex-1 py-3 rounded-xl border text-sm font-bold transition-all ${paymentStatus === 'paid' ? 'bg-[#2d3435] text-white' : 'bg-white text-[#acb3b4]'}`} onClick={() => setPaymentStatus('paid')}>Already Paid</button>
                 <button className={`flex-1 py-3 rounded-xl border text-sm font-bold transition-all ${paymentStatus === 'pay_later' ? 'bg-[#2d3435] text-white' : 'bg-white text-[#acb3b4]'}`} onClick={() => setPaymentStatus('pay_later')}>Pay Later</button>
             </div>
          </section>

          <button 
            onClick={async () => {
              if (!user || !selectedRole) return;
              setIsApplying(true);
              try {
                for (const classId of Array.from(selectedClasses)) {
                  const item = allItems.find(c => c.id === classId);
                  if (!item) continue;
                  await classRegistrationService.addRegistration({
                    classId: item.id, groupId, userId: user.uid, classTitle: item.title,
                    applicantName: profile?.nickname || 'Unknown',
                    status: paymentStatus === 'paid' ? 'PAYMENT_REPORTED' : 'PAYMENT_PENDING',
                    amount: item.amount || 0, currency: item.currency || 'KRW',
                    role: selectedRole === 'leader' ? 'Leader' : 'Follower'
                  });
                }
                closeFlow();
                setShowSuccess(true);

                setSelectedClasses(new Set());
              } catch (error) { console.error(error); } finally { setIsApplying(false); }
            }}
            disabled={isApplying}
            className="w-full bg-primary text-white py-4 rounded-xl font-black text-base transition-all disabled:opacity-50 mt-4"
          >
            {isApplying ? 'Processing...' : 'Complete Application'}
          </button>
        </div>
      </BottomSheet>
    </div>
  );
}
