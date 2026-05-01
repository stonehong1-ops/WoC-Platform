'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { groupService } from '@/lib/firebase/groupService';
import { Group, GroupClass } from '@/types/group';
import { useAuth } from '@/components/providers/AuthProvider';
import { classRegistrationService } from '@/lib/firebase/classRegistrationService';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { toast } from 'sonner';

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

export default function ClubClassSelectionPage() {
  const router = useRouter();
  const params = useParams();
  const groupId = params.groupId as string;
  
  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedClasses, setSelectedClasses] = useState<Set<string>>(new Set());
  const [selectedClassDetail, setSelectedClassDetail] = useState<any | null>(null);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'paid' | 'pay_later'>('paid');
  const [showSuccess, setShowSuccess] = useState(false);
  const [passSelectedClassIds, setPassSelectedClassIds] = useState<Set<string>>(new Set());
  const { user, profile } = useAuth();
  const [isApplying, setIsApplying] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'leader' | 'follower' | null>(null);
  const [ownerInfo, setOwnerInfo] = useState<{name: string | null, localName: string | null, avatar: string | null, phone: string | null} | null>(null);
  
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
        <button onClick={() => router.back()} className="text-primary hover:underline">Go back</button>
      </div>
    );
  }

  const d = new Date();
  if (d.getDate() >= 15) {
    d.setMonth(d.getMonth() + 1);
  }
  const currentMonthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const monthDisplay = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;

  const allGroupClasses = group.classes || [];
  const classes = allGroupClasses.filter(cls => !cls.targetMonth || cls.targetMonth === currentMonthStr);
  const monthlyPasses = (group.monthlyPasses || []).filter(p => !p.targetMonth || p.targetMonth === currentMonthStr);
  const discounts = (group.discounts || []).filter(d => !d.targetMonth || d.targetMonth === currentMonthStr);

  const packages = [
    ...monthlyPasses.map(p => ({ ...p, itemType: 'monthlyPass' as const, amount: p.amount, currency: p.currency })),
    ...discounts.map(d => ({ ...d, itemType: 'discount' as const, amount: d.amount, currency: d.currency }))
  ];

  const allItems = [...packages, ...classes.map(c => ({ ...c, itemType: 'class' as const }))];

  const handleCardClick = (item: any) => {
    setSelectedClassDetail(item);
    if (item.itemType === 'monthlyPass' || item.itemType === 'discount') {
      const passClasses = item.includedClassIds && item.includedClassIds.length > 0 
        ? classes.filter(c => item.includedClassIds.includes(c.id))
        : classes;
      setPassSelectedClassIds(new Set(passClasses.map(c => c.id)));
    }
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
    setSelectedClassDetail(null); // Close modal after adding
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

  // Group classes by day of week
  const classesByDay = new Map<string, GroupClass[]>();
  DAY_ORDER.forEach(day => classesByDay.set(day, []));

  classes.forEach(cls => {
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
      <div className="fixed inset-0 bg-background text-on-background z-[200] flex flex-col justify-center items-center">
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
            onClick={() => router.push('/home')} 
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
    <div className="fixed inset-0 z-[200] bg-white flex flex-col animate-in slide-in-from-bottom duration-300">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#f2f4f4] flex-shrink-0 bg-white z-10">
        <button onClick={() => router.back()} className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-[#f2f4f4] transition-colors">
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
          
          {/* Title Banner */}
          <div className="bg-gradient-to-r from-[#0057bd] to-[#3b82f6] rounded-2xl p-5 mb-6 text-center">
            <p className="text-[10px] font-bold text-blue-200 uppercase tracking-[0.2em] mb-1">CLASS INFORMATION</p>
            <h1 className="text-xl font-black text-white mb-1">{group.name}</h1>
            <p className="text-sm font-bold text-blue-100">{monthDisplay}</p>
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

          {/* Day-by-Day Schedule */}
          <div className="space-y-4">
            {DAY_ORDER.map(day => {
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
                        <div key={cls.id} onClick={() => handleCardClick({ ...cls, itemType: 'class' })} className="p-3 flex gap-3 cursor-pointer hover:bg-[#f8f9fa] transition-colors group">
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
                            <p className="text-[13px] font-black text-[#2d3435] mt-0.5">{cls.amount.toLocaleString()} {cls.currency}</p>
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

                            {selectedClasses.has(cls.id) ? (
                              <button 
                                onClick={(e) => { e.stopPropagation(); handleRemoveFromBasket(cls.id); }}
                                className="text-[#0057bd] flex items-center justify-center transition-colors"
                              >
                                <span className="material-symbols-outlined" style={{ fontSize: '44px' }}>toggle_on</span>
                              </button>
                            ) : (
                              <button 
                                onClick={(e) => { e.stopPropagation(); handleAddToBasket(cls.id); }}
                                disabled={isMonthlyPassSelected}
                                className={`flex items-center justify-center transition-colors ${isMonthlyPassSelected ? 'text-[#e0e4e5] cursor-not-allowed' : 'text-[#acb3b4]'}`}
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
            })}
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

          <div className="mt-6 text-center">
            <p className="text-[9px] text-[#acb3b4]">© {new Date().getFullYear()} {group.name} · woc.today</p>
          </div>
        </div>
      </div>

      {/* FAB Basket */}
      {selectedClasses.size > 0 && (
        <div className="fixed bottom-6 right-6 z-[220]">
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
      {selectedClassDetail && (
        <div className="fixed inset-0 z-[250] bg-white flex flex-col animate-in slide-in-from-bottom duration-300">
          <style dangerouslySetInnerHTML={{ __html: `
            .detail-scrollbar::-webkit-scrollbar { display: none; }
            .detail-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
          `}} />

          {/* Header */}
          <div className={`fixed top-0 left-0 right-0 z-[260] flex items-center justify-between px-4 py-3 transition-all duration-300 ${isScrolled ? 'bg-white/95 backdrop-blur-md shadow-sm' : 'bg-gradient-to-b from-black/30 to-transparent'}`}>
            <button onClick={() => setSelectedClassDetail(null)} className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isScrolled ? 'bg-slate-100 text-[#2d3435]' : 'bg-black/20 backdrop-blur-sm text-white'}`}>
              <span className="material-symbols-outlined text-xl">arrow_back</span>
            </button>
            <div className={`text-sm font-bold truncate max-w-[180px] transition-opacity ${isScrolled ? 'opacity-100 text-[#2d3435]' : 'opacity-0'}`}>{selectedClassDetail.title}</div>
            <div className="w-10 h-10"></div>
          </div>

          {/* Scrollable Content */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto detail-scrollbar pb-[80px]">
            <div className="relative aspect-square overflow-hidden bg-[#f2f4f4] flex items-center justify-center">
              {selectedClassDetail.imageUrl || selectedClassDetail.image || selectedClassDetail.photoURL || selectedClassDetail.avatar || group.coverImage ? (
                <img 
                  src={selectedClassDetail.imageUrl || selectedClassDetail.image || selectedClassDetail.photoURL || selectedClassDetail.avatar || group.coverImage}
                  onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement!.innerHTML = '<span class="material-symbols-outlined text-[#acb3b4] text-6xl">school</span>'; }}
                  alt={selectedClassDetail.title}
                  className="w-full h-full object-cover absolute inset-0"
                />
              ) : (
                <span className="material-symbols-outlined text-[#acb3b4] text-6xl z-10">school</span>
              )}
              {selectedClassDetail.itemType === 'discount' && (
                <span className="absolute top-16 left-4 z-20 bg-[#d97706] text-white text-xs font-black px-3 py-1 rounded-full">Bundle Deal</span>
              )}
            </div>

            <div className="px-4 py-6 border-b border-[#f2f4f4]">
              <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1.5">{selectedClassDetail.itemType === 'monthlyPass' ? 'Monthly Pass' : selectedClassDetail.itemType === 'discount' ? 'Bundle' : selectedClassDetail.classType || 'Class'}</p>
              <h1 className="text-xl font-black text-[#2d3435] leading-tight mb-2">{selectedClassDetail.title}</h1>
              
              <div className="mt-4">
                <p className="text-[10px] font-black text-[#596061] uppercase tracking-widest mb-2">Description</p>
                <p className="text-sm text-[#596061] leading-relaxed whitespace-pre-line">
                  {selectedClassDetail.description || selectedClassDetail.discountDescription || 'No description available.'}
                </p>
              </div>
            </div>

            <div className="px-4 py-4 space-y-4">
              {selectedClassDetail.location && (
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-[#acb3b4] mt-0.5">location_on</span>
                  <div>
                    <p className="text-[10px] font-black text-[#596061] uppercase tracking-widest">Venue</p>
                    <p className="text-sm font-bold text-[#2d3435]">{selectedClassDetail.location}</p>
                  </div>
                </div>
              )}

              {selectedClassDetail.schedule && selectedClassDetail.schedule.length > 0 && (
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-[#acb3b4] mt-0.5">calendar_month</span>
                  <div>
                    <p className="text-[10px] font-black text-[#596061] uppercase tracking-widest">Schedule</p>
                    {selectedClassDetail.schedule.map((sched: any, idx: number) => {
                      const dateObj = new Date(sched.date);
                      const month = dateObj.toLocaleString('en-US', { month: 'short' });
                      const day = dateObj.getDate();
                      return (
                        <div key={idx} className="mt-1">
                          <p className="text-sm font-bold text-[#2d3435]">{isNaN(day) ? 'TBD' : `${month} ${day}`} <span className="font-normal text-[#596061] ml-1">{sched.timeSlot || `${selectedClassDetail.startTime} - ${selectedClassDetail.endTime}`}</span></p>
                          {sched.content && <p className="text-xs text-[#acb3b4]">{sched.content}</p>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {(selectedClassDetail.maxCapacity || selectedClassDetail.leaderCount || selectedClassDetail.followerCount) && (
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-[#acb3b4] mt-0.5">group</span>
                  <div>
                    <p className="text-[10px] font-black text-[#596061] uppercase tracking-widest">Capacity</p>
                    <div className="flex gap-4 mt-1">
                      {selectedClassDetail.leaderCount !== undefined && (
                        <div><p className="text-sm font-bold text-primary">{selectedClassDetail.leaderCount}</p><p className="text-[10px] text-[#acb3b4]">Male</p></div>
                      )}
                      {selectedClassDetail.followerCount !== undefined && (
                        <div><p className="text-sm font-bold text-tertiary">{selectedClassDetail.followerCount}</p><p className="text-[10px] text-[#acb3b4]">Female</p></div>
                      )}
                      {selectedClassDetail.leaderCount === undefined && selectedClassDetail.followerCount === undefined && (
                        <div><p className="text-sm font-bold text-[#2d3435]">{selectedClassDetail.maxCapacity}</p><p className="text-[10px] text-[#acb3b4]">Total</p></div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {(selectedClassDetail.itemType === 'monthlyPass' || selectedClassDetail.itemType === 'discount') && (
              <div className="mx-4 my-4 border border-[#e0e4e5] rounded-2xl overflow-hidden">
                <div className="bg-[#f8f9fa] px-4 py-2.5 border-b border-[#e0e4e5] flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm text-primary">school</span>
                  <p className="text-[10px] font-black text-primary uppercase tracking-widest">Included Classes</p>
                </div>
                <div className="p-4 space-y-3">
                  {(() => {
                    const passClasses = selectedClassDetail.includedClassIds && selectedClassDetail.includedClassIds.length > 0 
                      ? classes.filter(c => selectedClassDetail.includedClassIds.includes(c.id))
                      : classes;
                    return passClasses.map((cls: any) => {
                      const isChecked = passSelectedClassIds.has(cls.id);
                      return (
                        <label key={cls.id} className="flex items-center gap-3 cursor-pointer group">
                          <input 
                            type="checkbox" 
                            className="sr-only" 
                            checked={isChecked}
                            onChange={() => {
                              setPassSelectedClassIds(prev => {
                                const newSet = new Set(prev);
                                if (newSet.has(cls.id)) newSet.delete(cls.id);
                                else newSet.add(cls.id);
                                return newSet;
                              });
                            }}
                          />
                          <div className={`flex-shrink-0 flex items-center justify-center w-5 h-5 rounded border transition-colors ${isChecked ? 'border-primary bg-primary text-white' : 'border-[#c2c6d5] bg-transparent'}`}>
                            {isChecked && <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>check</span>}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-[#2d3435] truncate">{cls.title}</p>
                            <p className="text-xs text-[#596061]">{cls.schedule?.length || 0} Sessions</p>
                          </div>
                        </label>
                      );
                    });
                  })()}
                </div>
              </div>
            )}

            {(() => {
              const uniqueInstructors = new Map();
              if (selectedClassDetail.instructors) {
                selectedClassDetail.instructors.forEach((inst: any) => uniqueInstructors.set(inst.name, inst));
              } else if (selectedClassDetail.includedClassIds) {
                selectedClassDetail.includedClassIds.forEach((id: string) => {
                  const cls = classes.find(c => c.id === id);
                  if (cls && cls.instructors) {
                    cls.instructors.forEach((inst: any) => uniqueInstructors.set(inst.name, inst));
                  }
                });
              }
              const instructorList = Array.from(uniqueInstructors.values());
              if (instructorList.length === 0) return null;

              return (
                <div className="px-4 py-6 border-t border-[#f2f4f4]">
                  <p className="text-[10px] font-black text-[#596061] uppercase tracking-widest mb-4">Instructors</p>
                  <div className="flex gap-4 overflow-x-auto detail-scrollbar pb-2">
                    {instructorList.map((inst, idx) => (
                      <div key={idx} className="flex flex-col items-center flex-shrink-0 w-20">
                        {(inst as any).avatar || (inst as any).photoURL || (inst as any).image || (inst as any).imageUrl ? (
                          <img src={(inst as any).avatar || (inst as any).photoURL || (inst as any).image || (inst as any).imageUrl} alt={inst.name} className="w-14 h-14 rounded-full object-cover mb-2 border border-[#e0e4e5]" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement!.innerHTML = `<div class="w-14 h-14 rounded-full bg-[#f2f4f4] text-[#596061] flex items-center justify-center text-xl font-bold mb-2 border border-[#e0e4e5]">${inst.name.substring(0, 2).toUpperCase()}</div><span class="text-xs font-bold text-[#2d3435] text-center line-clamp-1">${inst.name}</span>`; }} />
                        ) : (
                          <div className="w-14 h-14 rounded-full bg-[#f2f4f4] text-[#596061] flex items-center justify-center text-xl font-bold mb-2 border border-[#e0e4e5]">
                            {inst.name.substring(0, 2).toUpperCase()}
                          </div>
                        )}
                        <span className="text-xs font-bold text-[#2d3435] text-center line-clamp-1">{inst.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

          </div>

          {/* Fixed Bottom Bar */}
          <div className="fixed bottom-0 left-0 right-0 z-[260] bg-white border-t border-slate-100 px-4 py-2.5 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-lg font-black text-[#2d3435] font-headline leading-tight">
                {selectedClassDetail.amount ? selectedClassDetail.amount.toLocaleString() : "0"} {selectedClassDetail.currency || "KRW"}
              </p>
              {selectedClassDetail.itemType === 'discount' && (() => {
                const originalPrice = (selectedClassDetail.includedClassIds || []).reduce((sum: number, id: string) => {
                  const cls = classes.find(c => c.id === id);
                  return sum + (cls?.amount || 0);
                }, 0);
                if (originalPrice > selectedClassDetail.amount) {
                  return (
                    <p className="text-[10px] text-[#acb3b4] truncate line-through">
                      List {originalPrice.toLocaleString()} {selectedClassDetail.currency || 'KRW'}
                    </p>
                  );
                }
                return null;
              })()}
            </div>
            {selectedClasses.has(selectedClassDetail.id) ? (
              <button 
                onClick={(e) => handleRemoveFromBasket(selectedClassDetail.id, e)}
                className="flex-shrink-0 bg-[#f2f4f4] text-[#e63946] px-7 py-3 rounded-xl font-black text-sm tracking-wide active:scale-95 transition-transform flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[18px]">remove_shopping_cart</span>
                Remove
              </button>
            ) : (
              <button 
                onClick={() => handleAddToBasket(selectedClassDetail.id)}
                className="flex-shrink-0 bg-primary text-white px-7 py-3 rounded-xl font-black text-sm tracking-wide shadow-lg shadow-primary/20 active:scale-95 transition-transform flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[18px]">shopping_basket</span>
                Add
              </button>
            )}
          </div>
        </div>
      )}

      {/* Apply/Payment Modal */}
      {isApplyModalOpen && (() => {
        const subtotal = Array.from(selectedClasses).reduce((sum, id) => {
          const item = allItems.find(c => c.id === id);
          return sum + (item?.amount || 0);
        }, 0);
        
        const currency = selectedClasses.size > 0 
          ? allItems.find(c => c.id === Array.from(selectedClasses)[0])?.currency || "KRW"
          : "KRW";

        return (
          <>
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[300] animate-in fade-in duration-200"></div>
            <div className="fixed inset-0 z-[310] flex items-center justify-center p-4">
              <div className="bg-white rounded-[24px] shadow-2xl overflow-hidden flex flex-col w-full max-w-[400px] max-h-[90vh] animate-in slide-in-from-bottom-4 zoom-in-95 duration-200">
                <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-white flex-shrink-0">
                  <h2 className="font-['Plus_Jakarta_Sans'] text-[1.25rem] font-black text-[#2d3435]">Payment Info</h2>
                  <button onClick={() => setIsApplyModalOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-gray-500">
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>
                
                <div className="px-6 py-6 overflow-y-auto flex flex-col gap-[2.5rem]">
                  <section className="flex flex-col gap-4">
                    <h3 className="font-['Plus_Jakarta_Sans'] text-sm font-black text-[#2d3435] uppercase tracking-wider">Your Role <span className="text-error">*</span></h3>
                    <div className="grid grid-cols-2 gap-3">
                      <label className="cursor-pointer relative">
                        <input type="radio" name="user_role" className="peer sr-only" checked={selectedRole === 'leader'} onChange={() => setSelectedRole('leader')} />
                        <div className="bg-white border-2 border-gray-200 rounded-xl p-4 text-center peer-checked:border-[#0057bd] peer-checked:bg-[#0057bd]/5 transition-all h-full flex items-center justify-center">
                          <span className="text-sm font-bold text-gray-600 peer-checked:text-[#0057bd]">Leader</span>
                        </div>
                      </label>
                      <label className="cursor-pointer relative">
                        <input type="radio" name="user_role" className="peer sr-only" checked={selectedRole === 'follower'} onChange={() => setSelectedRole('follower')} />
                        <div className="bg-white border-2 border-gray-200 rounded-xl p-4 text-center peer-checked:border-[#0057bd] peer-checked:bg-[#0057bd]/5 transition-all h-full flex items-center justify-center">
                          <span className="text-sm font-bold text-gray-600 peer-checked:text-[#0057bd]">Follower</span>
                        </div>
                      </label>
                    </div>
                  </section>

                  <section className="flex flex-col gap-4">
                    <h3 className="font-['Plus_Jakarta_Sans'] text-sm font-black text-[#2d3435] uppercase tracking-wider">Applied Items</h3>
                    <div className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
                      <ul className="divide-y divide-gray-200">
                        {Array.from(selectedClasses).map(classId => {
                          const item = allItems.find(c => c.id === classId);
                          if (!item) return null;
                          return (
                            <li key={classId} className="p-4 flex justify-between items-center bg-white">
                              <span className="text-sm font-bold text-gray-700 line-clamp-1 mr-4">{item.title}</span>
                              <span className="text-sm font-black text-[#2d3435] flex-shrink-0">
                                {item.amount ? item.amount.toLocaleString() : "0"} {item.currency || "KRW"}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                      <div className="p-4 bg-[#0057bd]/5 border-t border-[#0057bd]/10 flex justify-between items-center">
                        <span className="text-sm font-black text-[#0057bd]">Total Amount</span>
                        <span className="text-xl font-black text-[#0057bd]">
                          {subtotal.toLocaleString()} {currency}
                        </span>
                      </div>
                    </div>
                  </section>
                  
                  <section className="flex flex-col gap-3">
                    <h3 className="font-['Plus_Jakarta_Sans'] text-sm font-black text-[#2d3435] uppercase tracking-wider">Payment Method</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <label className="cursor-pointer relative">
                        <input type="radio" name="payment_status" className="peer sr-only" checked={paymentStatus === 'paid'} onChange={() => setPaymentStatus('paid')} />
                        <div className="bg-white border-2 border-gray-200 rounded-xl p-4 text-center peer-checked:border-[#0057bd] peer-checked:bg-[#0057bd]/5 transition-all h-full flex items-center justify-center">
                          <span className="text-sm font-bold text-gray-600 peer-checked:text-[#0057bd]">Already Paid</span>
                        </div>
                      </label>
                      <label className="cursor-pointer relative">
                        <input type="radio" name="payment_status" className="peer sr-only" checked={paymentStatus === 'pay_later'} onChange={() => setPaymentStatus('pay_later')} />
                        <div className="bg-white border-2 border-gray-200 rounded-xl p-4 text-center peer-checked:border-[#0057bd] peer-checked:bg-[#0057bd]/5 transition-all h-full flex items-center justify-center">
                          <span className="text-sm font-bold text-gray-600 peer-checked:text-[#0057bd]">Pay Later</span>
                        </div>
                      </label>
                    </div>
                  </section>
                </div>
                
                <div className="p-6 bg-white border-t border-gray-100 flex-shrink-0">
                  <button 
                    onClick={async () => {
                      if (!user) {
                        toast.error("You need to login first.");
                        return;
                      }
                      if (!selectedRole) {
                        toast.error("Please select a role (Leader/Follower).");
                        return;
                      }
                      setIsApplying(true);
                      try {
                        for (const classId of Array.from(selectedClasses)) {
                          const item = allItems.find(c => c.id === classId);
                          if (!item) continue;
                          
                          const regData: any = {
                            classId: item.id,
                            groupId: groupId,
                            userId: user.uid,
                            classTitle: item.title,
                            applicantName: profile?.nickname || 'Unknown',
                            status: paymentStatus === 'paid' ? 'PAYMENT_REPORTED' : 'PAYMENT_PENDING',
                            amount: item.amount || 0,
                            currency: item.currency || 'KRW',
                            role: selectedRole === 'leader' ? 'Leader' : 'Follower'
                          };

                          await classRegistrationService.addRegistration(regData);
                        }
                        setIsApplyModalOpen(false);
                        setShowSuccess(true);
                        setSelectedClasses(new Set());
                      } catch (error: any) {
                        console.error("Error applying:", error);
                        alert(`[Error] Failed to apply.\n\nReason: ${error?.message || 'Unknown'}`);
                      } finally {
                        setIsApplying(false);
                      }
                    }}
                    disabled={isApplying}
                    className="w-full bg-[#0057bd] text-white py-4 rounded-xl font-black text-sm tracking-wide shadow-lg shadow-[#0057bd]/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2"
                  >
                    {isApplying ? (
                      <><span className="material-symbols-outlined animate-spin">progress_activity</span> Processing...</>
                    ) : (
                      'Complete Application'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </>
        );
      })()}
    </div>
  );
}
