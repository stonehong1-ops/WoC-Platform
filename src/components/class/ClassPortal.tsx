'use client';
import { reportError } from '@/lib/utils/errorHandler';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { groupService } from '@/lib/firebase/groupService';
import { venueService } from '@/lib/firebase/venueService';
import { Group, GroupClass, ClassDiscount, ClassScheduleEntry } from '@/types/group';
import { Venue } from '@/types/venue';
import { useNavigation } from '@/components/providers/NavigationProvider';
import { useLanguage } from '@/contexts/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';
import ClassDetail from '@/components/class/ClassDetail';
import { useAuth } from '@/components/providers/AuthProvider';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/clientApp';
import { useBookingEngine } from '@/hooks/useBookingEngine';
import UnifiedCheckoutModal from '@/components/common/UnifiedCheckoutModal';
import Portal from '@/components/common/Portal';
import GroupClassAddEditor from '@/components/groups/GroupClassAddEditor';
import { safeDate } from '@/lib/utils/safeDate';
import BottomSheet from '@/components/common/BottomSheet';
import { bookingService } from '@/lib/firebase/bookingService';
import { BaseBooking } from '@/types/booking';
import { chatService } from '@/lib/firebase/chatService';
import dynamic from 'next/dynamic';

const ChatRoomComponent = dynamic(() => import('../chat/ChatRoom'));
import UserBadge from '@/components/common/UserBadge';
import { formatInstructorNames } from "@/app/social/constants/seoulRegions";


export default function ClassPortal() {
  const router = useRouter();
  const { setSubHeader } = useNavigation();
  const { t, language } = useLanguage();
  
  const [activeTab, setActiveTab] = useState<'TODAY' | 'WEEK' | 'MONTH' | 'SPECIAL'>('TODAY');
  
  // Restore cached class portal data to achieve 0ms initial render
  const cachedPortal = React.useMemo(() => {
    if (typeof window !== 'undefined') {
      const cached = sessionStorage.getItem('woc_class_portal_data');
      if (cached) {
        try {
          return JSON.parse(cached);
    } catch (e) {
      reportError(e, 'classPortal.parseCachedData');
      console.error('Failed to parse cached class portal data:', e);
    }
      }
    }
    return null;
  }, []);

  const [loading, setLoading] = useState(cachedPortal ? false : true);
  const [groups, setGroups] = useState<Group[]>(cachedPortal?.groups || []);
  const [venues, setVenues] = useState<Venue[]>(cachedPortal?.venues || []);
  const [allClasses, setAllClasses] = useState<GroupClass[]>(cachedPortal?.allClasses || []);
  const [specialClasses, setSpecialClasses] = useState<GroupClass[]>(cachedPortal?.specialClasses || []);
  const [allDiscountsGlobal, setAllDiscountsGlobal] = useState<ClassDiscount[]>(cachedPortal?.allDiscountsGlobal || []);
  
  const { user, profile } = useAuth();
  
  const [weekOffset, setWeekOffset] = useState(0);
  const [monthOffset, setMonthOffset] = useState(0);

  const [showOrganizerFilter, setShowOrganizerFilter] = useState(false);
  const [showClubFilter, setShowClubFilter] = useState(false);
  const [selectedOrganizer, setSelectedOrganizer] = useState('All');
  const [selectedGroupId, setSelectedGroupId] = useState('All');
  
  const [capacityModalOpen, setCapacityModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<GroupClass | null>(null);
  const [tempLeader, setTempLeader] = useState<number | undefined>(undefined);
  const [tempFollower, setTempFollower] = useState<number | undefined>(undefined);
  const [tempIsDailyBookingOpen, setTempIsDailyBookingOpen] = useState(false);
  const [tempInstructorComment, setTempInstructorComment] = useState('');
  const [tempDailyClassPrice, setTempDailyClassPrice] = useState<number>(0);
  
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [checkoutClass, setCheckoutClass] = useState<(GroupClass & { group?: Group; isSpecial?: boolean }) | null>(null);
  const [checkoutRole, setCheckoutRole] = useState<'leader' | 'follower'>('leader');
  const [checkoutPartnerName, setCheckoutPartnerName] = useState('');

  const [isAddingSpecialClass, setIsAddingSpecialClass] = useState(false);
  const [selectedGroupForAdd, setSelectedGroupForAdd] = useState<Group | null>(null);
  const [showGroupSelector, setShowGroupSelector] = useState(false);

  const { createBooking, reportPayment, isLoading: isBooking } = useBookingEngine();
  
  const [selectedDetailClass, setSelectedDetailClass] = useState<GroupClass | null>(null);
  const [chatOverlayRoomId, setChatOverlayRoomId] = useState<string | null>(null);
  const [portalImageErrors, setPortalImageErrors] = useState<Record<string, boolean>>({});

  const [userBookings, setUserBookings] = useState<BaseBooking[]>(() => {
    if (typeof window !== 'undefined' && user) {
      const cached = sessionStorage.getItem(`woc_user_bookings_${user.uid}`);
      if (cached) {
        try {
          return JSON.parse(cached);
        } catch (e) {
          reportError(e, 'classPortal.parseCachedData');
          console.error(e);
        }
      }
    }
    return [];
  });
  const [checkoutInitialStep, setCheckoutInitialStep] = useState<'summary' | 'payment' | 'complete' | undefined>(undefined);
  const [checkoutInitialBookingId, setCheckoutInitialBookingId] = useState<string | undefined>(undefined);
  const [checkoutInitialOrderNumber, setCheckoutInitialOrderNumber] = useState<string | undefined>(undefined);
  const [checkoutInitialCreatedAt, setCheckoutInitialCreatedAt] = useState<any>(undefined);

  useEffect(() => {
    if (!user) {
      setUserBookings([]);
      return;
    }

    // 0ms Cache Load immediately when user is verified
    if (typeof window !== 'undefined') {
      const cached = sessionStorage.getItem(`woc_user_bookings_${user.uid}`);
      if (cached) {
        try {
          setUserBookings(JSON.parse(cached));
    } catch (e) {
      reportError(e, 'classPortal.parseCachedBookings');
      console.error('Failed to parse cached bookings:', e);
    }
      }
    }

    const unsub = bookingService.subscribeToUserBookings(user.uid, (bookings) => {
      setUserBookings(bookings);
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(`woc_user_bookings_${user.uid}`, JSON.stringify(bookings));
      }
    });
    return () => unsub();
  }, [user]);

  useEffect(() => {
    const fetchData = async () => {
      const hasCache = typeof window !== 'undefined' && sessionStorage.getItem('woc_class_portal_data');
      if (!hasCache) {
        setLoading(true);
      }
      try {
        const [groupsData, allData, specialData, venuesData, discountsData] = await Promise.all([
          groupService.getGroups(),
          groupService.getGlobalClassesAll(),
          groupService.getGlobalSpecialClasses(),
          venueService.getVenues(),
          groupService.getGlobalDiscountsAll()
        ]);
        
        setGroups(groupsData);
        setAllClasses(allData);
        setSpecialClasses(specialData);
        setVenues(venuesData || []);
        setAllDiscountsGlobal(discountsData);
        setLoading(false);

        if (typeof window !== 'undefined') {
          sessionStorage.setItem('woc_class_portal_data', JSON.stringify({
            groups: groupsData,
            allClasses: allData,
            specialClasses: specialData,
            venues: venuesData || [],
            allDiscountsGlobal: discountsData
          }));
        }
      } catch (error) {
        console.error("Failed to fetch class portal data:", error);
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const organizers = useMemo(() => {
    const instSet = new Set<string>();
    allClasses.forEach(cls => {
      if (cls.instructors && Array.isArray(cls.instructors)) {
        cls.instructors.forEach((inst) => {
          if (inst.name) instSet.add(inst.name);
        });
      }
    });
    return Array.from(instSet).sort();
  }, [allClasses]);

  // 각 그룹별 전체 클래스 개수(allClasses 기준)
  const groupCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    allClasses.forEach(cls => {
      if (cls.groupId) {
        counts[cls.groupId] = (counts[cls.groupId] || 0) + 1;
      }
    });
    return counts;
  }, [allClasses]);

  // 카운트가 있는 그룹들만 필터 목록에 노출하고, 카운트 순으로 정렬
  const filteredFilterGroups = useMemo(() => {
    const activeGroups = groups.filter(g => (groupCounts[g.id] || 0) > 0);
    return [...activeGroups].sort((a, b) => {
      const countA = groupCounts[a.id] || 0;
      const countB = groupCounts[b.id] || 0;
      if (countB !== countA) return countB - countA;
      
      const nameA = language === 'KR' ? (a.nativeName || a.name) : a.name;
      const nameB = language === 'KR' ? (b.nativeName || b.name) : b.name;
      return nameA.localeCompare(nameB, language === 'KR' ? 'ko' : 'en');
    });
  }, [groups, groupCounts, language]);

  const weekTimeline = useMemo(() => {
    if (activeTab !== 'WEEK') return [];
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const targetWeekStart = new Date(today);
    const currentDay = targetWeekStart.getDay();
    const diffToMonday = targetWeekStart.getDate() - currentDay + (currentDay === 0 ? -6 : 1);
    targetWeekStart.setDate(diffToMonday + weekOffset * 7);

    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(targetWeekStart);
      d.setDate(targetWeekStart.getDate() + i);
      if (d.getTime() >= today.getTime()) {
        days.push(d);
      } else if (weekOffset < 0) {
        days.push(d);
      }
    }

    const grouped: Record<string, { date: Date, classes: (GroupClass & { group?: Group; scheduleEntry?: ClassScheduleEntry })[] }> = {};
    days.forEach(d => {
      const dateStr = d.toDateString();
      grouped[dateStr] = { date: d, classes: [] };
    });

    allClasses.forEach(cls => {
      const group = groups.find(g => g.id === cls.groupId);
      
      if (selectedGroupId !== 'All' && cls.groupId !== selectedGroupId) return;
      if (selectedOrganizer !== 'All') {
        const hasInstructor = cls.instructors?.some((i) => i.name === selectedOrganizer);
        if (!hasInstructor) return;
      }

      cls.schedule?.forEach((s) => {
        if (!s.date) return;
        const dObj = safeDate(s.date);
        if (!dObj) return;
        const dStr = `${dObj.getFullYear()}-${String(dObj.getMonth() + 1).padStart(2, '0')}-${String(dObj.getDate()).padStart(2, '0')}`;

        if (dStr) {
          const normalized = dStr.replace(/[\.\/]/g, '-').replace(/\s+/g, '');
          const parts = normalized.split('-');
          let y, m, d;
          if (parts.length >= 3) {
            y = parts[0].length === 2 ? `20${parts[0]}` : parts[0];
            m = parts[1].padStart(2, '0');
            d = parts[2].padStart(2, '0');
          } else if (parts.length === 2) {
            y = new Date().getFullYear().toString();
            m = parts[0].padStart(2, '0');
            d = parts[1].padStart(2, '0');
          }
          if (y && m && d) {
            const clsDate = new Date(`${y}-${m}-${d}T00:00:00`);
            const clsDateStr = clsDate.toDateString();

            if (grouped[clsDateStr]) {
              if (!grouped[clsDateStr].classes.some(c => c.id === cls.id)) {
                grouped[clsDateStr].classes.push({ ...cls, group, scheduleEntry: s });
              }
            }
          }
        }
      });
    });

    const result = Object.values(grouped).sort((a, b) => a.date.getTime() - b.date.getTime());
    result.forEach(group => {
      group.classes.sort((a, b) => {
        const timeA = (a.scheduleEntry?.timeSlot?.split(/[-~]/)[0] || a.startTime || '00:00').trim();
        const timeB = (b.scheduleEntry?.timeSlot?.split(/[-~]/)[0] || b.startTime || '00:00').trim();
        return timeA.localeCompare(timeB);
      });
    });
    return result;
  }, [activeTab, allClasses, groups, weekOffset, selectedOrganizer, selectedGroupId]);

  // Sub Header Tab Navigation
  useEffect(() => {
    const filterBar = (
      <div className="relative w-full bg-white flex flex-col shadow-[0_20px_40px_-15px_rgba(0,0,0,0.15)] z-30">
        <div className="w-full px-3 py-2 flex items-center gap-2 overflow-x-auto no-scrollbar">
          {[
            { id: 'TODAY', label: t('class.tab_today') },
            { id: 'WEEK', label: t('class.tab_week') },
            { id: 'MONTH', label: t('class.tab_month') },
            { id: 'SPECIAL', label: t('class.tab_special') }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'TODAY' | 'WEEK' | 'MONTH' | 'SPECIAL')}
              className={`flex-shrink-0 px-2.5 py-1 rounded-xl text-[12px] font-bold tracking-tight transition-all whitespace-nowrap border ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-100'
                  : 'bg-slate-50/50 text-slate-500 border-slate-100 hover:bg-slate-100/80'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {(activeTab === 'WEEK' || activeTab === 'TODAY') && (
          <>
            <div className="w-full h-11 px-4 flex items-center justify-end gap-4">
              <button
                onClick={() => { setShowOrganizerFilter(!showOrganizerFilter); if (!showOrganizerFilter) setShowClubFilter(false); }}
                className={`flex items-center gap-0.5 text-[12px] font-bold transition-all ${selectedOrganizer !== 'All' ? 'text-blue-600' : 'text-slate-600 hover:text-slate-800'}`}
              >
                {selectedOrganizer === 'All' ? t('class.filter_instructor') : selectedOrganizer}
                <span className={`material-symbols-outlined text-[16px] transition-transform ${showOrganizerFilter ? 'rotate-180' : ''}`}>expand_more</span>
              </button>
              <button
                onClick={() => { setShowClubFilter(!showClubFilter); if (!showClubFilter) setShowOrganizerFilter(false); }}
                className={`flex items-center gap-0.5 text-[12px] font-bold transition-all ${selectedGroupId !== 'All' ? 'text-blue-600' : 'text-slate-600 hover:text-slate-800'}`}
              >
                {selectedGroupId === 'All' ? t('class.filter_club') : (
                  (() => {
                    const grp = groups.find(g => g.id === selectedGroupId);
                    return grp ? (language === 'KR' ? (grp.nativeName || grp.name) : grp.name) : '';
                  })()
                )}
                <span className={`material-symbols-outlined text-[16px] transition-transform ${showClubFilter ? 'rotate-180' : ''}`}>expand_more</span>
              </button>
            </div>
            {showOrganizerFilter && (
              <div className="absolute top-full left-0 right-0 z-40 bg-white shadow-2xl border-t border-slate-100 p-4 max-h-[280px] overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex items-center justify-between mb-4 px-1">
                  <span className="text-[14px] font-black text-slate-800 uppercase tracking-tight">{t('class.filter_by_instructor')}</span>
                  <button onClick={() => setShowOrganizerFilter(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-50 text-slate-400 hover:text-slate-600 active:scale-90 transition-all">
                    <span className="material-symbols-outlined text-[18px]">close</span>
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {['All', ...organizers].map(org => (
                    <button key={org} onClick={() => { setSelectedOrganizer(org); setShowOrganizerFilter(false); }}
                      className={`px-4 py-3 rounded-2xl text-[12px] font-bold text-left transition-all border ${selectedOrganizer === org ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-100' : 'bg-slate-50/50 text-slate-600 border-transparent hover:bg-slate-100/80'}`}>
                      <div className="flex items-center justify-between"><span className="truncate pr-2">{org}</span>{selectedOrganizer === org && <span className="material-symbols-outlined text-[14px]">check_circle</span>}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
            {showClubFilter && (
              <div className="absolute top-full left-0 right-0 z-40 bg-white shadow-2xl border-t border-slate-100 p-4 max-h-[280px] overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex items-center justify-between mb-4 px-1">
                  <span className="text-[14px] font-black text-slate-800 uppercase tracking-tight">{t('class.filter_by_club')}</span>
                  <button onClick={() => setShowClubFilter(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-50 text-slate-400 hover:text-slate-600 active:scale-90 transition-all">
                    <span className="material-symbols-outlined text-[18px]">close</span>
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button key="All" onClick={() => { setSelectedGroupId('All'); setShowClubFilter(false); }}
                    className={`px-4 py-3 rounded-2xl text-[12px] font-bold text-left transition-all border ${selectedGroupId === 'All' ? 'bg-[#1e293b] text-white border-[#1e293b] shadow-md shadow-slate-100' : 'bg-slate-50/50 text-slate-600 border-transparent hover:bg-slate-100/80'}`}>
                    <div className="flex items-center justify-between">
                      <span className="truncate">{t('today.all_groups') || 'All Groups'}</span>
                      {selectedGroupId === 'All' && <span className="material-symbols-outlined text-[14px]">check_circle</span>}
                    </div>
                  </button>
                  {filteredFilterGroups.map(grp => {
                    const count = groupCounts[grp.id] || 0;
                    const isSelected = selectedGroupId === grp.id;
                    const displayName = language === 'KR' ? (grp.nativeName || grp.name) : grp.name;
                    return (
                      <button key={grp.id} onClick={() => { setSelectedGroupId(grp.id); setShowClubFilter(false); }}
                        className={`px-4 py-3 rounded-2xl text-[12px] font-bold text-left transition-all border ${isSelected ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-100' : 'bg-slate-50/50 text-slate-600 border-transparent hover:bg-slate-100/80'}`}>
                        <div className="flex items-center justify-between">
                          <span className="truncate pr-2">{displayName} ({count})</span>
                          {isSelected && <span className="material-symbols-outlined text-[14px]">check_circle</span>}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    );
    const height = (activeTab === 'WEEK' || activeTab === 'TODAY') ? 88 : 44;
    setSubHeader(filterBar, height);
    return () => setSubHeader(null);
  }, [activeTab, selectedOrganizer, selectedGroupId, showOrganizerFilter, showClubFilter, organizers, filteredFilterGroups, groupCounts, language, setSubHeader]);

  const handleClassClick = (cls: GroupClass) => {
    setSelectedDetailClass(cls);
  };

  const handleGroupClick = (group: Group) => {
    router.push(`/class/${group.id}`);
  };

  const todayBlocks = useMemo(() => {
    if (activeTab !== 'TODAY') return [];
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toDateString();

    const classes: (GroupClass & { group?: Group; scheduleEntry?: ClassScheduleEntry })[] = [];
    allClasses.forEach(cls => {
      const group = groups.find(g => g.id === cls.groupId);
      if (selectedGroupId !== 'All' && cls.groupId !== selectedGroupId) return;
      if (selectedOrganizer !== 'All') {
        const hasInstructor = cls.instructors?.some((i) => i.name === selectedOrganizer);
        if (!hasInstructor) return;
      }

      cls.schedule?.forEach((s) => {
        if (!s.date) return;
        const dObj = safeDate(s.date);
        if (!dObj) return;
        const dStr = `${dObj.getFullYear()}-${String(dObj.getMonth() + 1).padStart(2, '0')}-${String(dObj.getDate()).padStart(2, '0')}`;

        if (dStr) {
          const normalized = dStr.replace(/[\.\/]/g, '-').replace(/\s+/g, '');
          const parts = normalized.split('-');
          let y, m, d;
          if (parts.length >= 3) {
            y = parts[0].length === 2 ? `20${parts[0]}` : parts[0];
            m = parts[1].padStart(2, '0');
            d = parts[2].padStart(2, '0');
          } else if (parts.length === 2) {
            y = new Date().getFullYear().toString();
            m = parts[0].padStart(2, '0');
            d = parts[1].padStart(2, '0');
          }
          if (y && m && d) {
            const clsDate = new Date(`${y}-${m}-${d}T00:00:00`);
            
            if (clsDate.toDateString() === todayStr) {
              if (!classes.some(c => c.id === cls.id)) {
                classes.push({ ...cls, group, scheduleEntry: s });
              }
            }
          }
        }
      });
    });

    classes.sort((a, b) => {
      const timeA = (a.scheduleEntry?.timeSlot?.split(/[-~]/)[0] || a.startTime || '00:00').trim();
      const timeB = (b.scheduleEntry?.timeSlot?.split(/[-~]/)[0] || b.startTime || '00:00').trim();
      return timeA.localeCompare(timeB);
    });

    const blocks = [
      { label: t('class.time_morning'), time: '06:00 - 11:59', icon: 'routine', classes: [] as (GroupClass & { group?: Group; scheduleEntry?: ClassScheduleEntry })[] },
      { label: t('class.time_afternoon'), time: '12:00 - 17:59', icon: 'light_mode', classes: [] as (GroupClass & { group?: Group; scheduleEntry?: ClassScheduleEntry })[] },
      { label: t('class.time_evening'), time: '18:00 - 20:59', icon: 'wb_twilight', classes: [] as (GroupClass & { group?: Group; scheduleEntry?: ClassScheduleEntry })[] },
      { label: t('class.time_night'), time: '21:00 -', icon: 'clear_night', classes: [] as (GroupClass & { group?: Group; scheduleEntry?: ClassScheduleEntry })[] }
    ];

    classes.forEach(cls => {
      const startTimeStr = (cls.scheduleEntry?.timeSlot?.split(/[-~]/)[0] || cls.startTime || '00:00').trim();
      const hr = parseInt(startTimeStr.split(':')[0] || '0', 10);
      if (hr >= 6 && hr < 12) blocks[0].classes.push(cls);
      else if (hr >= 12 && hr < 18) blocks[1].classes.push(cls);
      else if (hr >= 18 && hr < 21) blocks[2].classes.push(cls);
      else blocks[3].classes.push(cls);
    });

    return blocks.filter(b => b.classes.length > 0);
  }, [activeTab, allClasses, groups, selectedOrganizer, selectedGroupId]);

  const handleSaveCapacity = async () => {
    if (!editingClass || !editingClass.groupId) return;
    try {
      const classRef = doc(db, 'groups', editingClass.groupId, 'classes', editingClass.id);
      await updateDoc(classRef, {
        isDailyBookingOpen: tempIsDailyBookingOpen,
        instructorComment: tempInstructorComment || null,
        dailyClassPrice: tempDailyClassPrice || null
      });
      // update local state
      setAllClasses(prev => prev.map(c => c.id === editingClass.id ? { 
        ...c, 
        isDailyBookingOpen: tempIsDailyBookingOpen,
        instructorComment: tempInstructorComment,
        dailyClassPrice: tempDailyClassPrice || undefined
      } : c));
      setCapacityModalOpen(false);
    } catch (err) {
      console.error(err);
      alert('Failed to update capacity');
    }
  };

  const handleAddSpecialClick = () => {
    if (!user) return;
    const isAdminOrOwner = profile?.systemRole === 'admin' || profile?.isAdmin || groups.some(g => g.ownerId === user.uid);
    if (!isAdminOrOwner) {
      alert("You don't have permission to add special events.");
      return;
    }
    // No group selection needed for special classes
    setIsAddingSpecialClass(true);
  };

  const handleCheckoutClick = (cls: GroupClass & { group?: Group }, isSpecial: boolean = false) => {
    let group = cls.group;
    if (!group && cls.groupId) {
      group = groups.find(g => g.id === cls.groupId);
    }
    setCheckoutClass({ ...cls, group, isSpecial });
    setCheckoutRole('leader'); // Default role
    setCheckoutModalOpen(true);
  };

  const getActiveBooking = (itemId: string) => {
    if (!user || !userBookings) return null;
    return userBookings.find(b => 
      b.itemId === itemId && 
      ['SUBMITTED', 'BANK_TRANSFERRED', 'SELLER_CONFIRMED'].includes(b.status)
    );
  };

  const handleExistingCheckoutClick = (cls: GroupClass & { group?: Group }, booking: BaseBooking, isSpecial: boolean = false) => {
    let group = cls.group;
    if (!group && cls.groupId) {
      group = groups.find(g => g.id === cls.groupId);
    }
    setCheckoutClass({ ...cls, group, isSpecial });
    setCheckoutRole((booking.payload?.role as 'leader' | 'follower') || 'leader');
    setCheckoutInitialStep('payment');
    setCheckoutInitialBookingId(booking.id);
    setCheckoutInitialOrderNumber((booking as BaseBooking & { orderNumber?: string }).orderNumber || booking.id);
    setCheckoutInitialCreatedAt(booking.createdAt);
    setCheckoutModalOpen(true);
  };

  const handleChatWithHost = async (hostId: string) => {
    if (!hostId) return;
    if (!user) {
      alert(language === 'KR' ? '로그인이 필요합니다.' : 'Login is required.');
      return;
    }
    if (user.uid === hostId) {
      alert(language === 'KR' ? '본인과는 채팅할 수 없습니다.' : 'You cannot chat with yourself.');
      return;
    }
    try {
      const roomId = await chatService.getOrCreatePrivateRoom([user.uid, hostId], user.uid, 'business');
      setChatOverlayRoomId(roomId);
    } catch (err) {
      console.error('Failed to get or create chat room:', err);
      alert(language === 'KR' ? '채팅방을 열 수 없습니다.' : 'Failed to open chat room.');
    }
  };

  const renderBookingStatusArea = (cls: GroupClass & { group?: Group }, isPast: boolean, isSpecial: boolean = false) => {
    const booking = getActiveBooking(cls.id);
    
    if (booking) {
      if (booking.status === 'SUBMITTED') {
        return (
          <div className={`${isSpecial ? 'flex items-end justify-between w-full' : 'px-4 py-3 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between'}`}>
            <div className="flex flex-col">
              <span className={`text-[10px] font-bold uppercase tracking-widest leading-none mb-1 ${isSpecial ? 'text-white/60' : 'text-slate-400'}`}>
                {isSpecial ? t('class.registration_fee') : t('class.daily_pass')}
              </span>
              <span className={`text-[14px] font-black leading-none ${isSpecial ? 'text-amber-400 text-lg' : 'text-amber-600'}`}>
                {language === 'KR' ? '입금대기중...' : 'Pending Deposit...'}
              </span>
            </div>
            <button 
              onClick={(e) => { e.stopPropagation(); handleExistingCheckoutClick(cls, booking, isSpecial); }}
              className={`flex items-center gap-1 text-[13px] font-black px-5 py-2.5 rounded-full shadow-md active:scale-95 transition-all bg-[#0057bd] text-white`}
            >
              {language === 'KR' ? '입금완료' : 'Payment Completed'}
            </button>
          </div>
        );
      }
      
      if (booking.status === 'BANK_TRANSFERRED') {
        const hostId = cls.group?.ownerId || '';
        return (
          <div className={`${isSpecial ? 'flex items-end justify-between w-full' : 'px-4 py-3 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between'}`}>
            <div className="flex flex-col">
              <span className={`text-[10px] font-bold uppercase tracking-widest leading-none mb-1 ${isSpecial ? 'text-white/60' : 'text-slate-400'}`}>
                {isSpecial ? t('class.registration_fee') : t('class.daily_pass')}
              </span>
              <span className={`text-[14px] font-black leading-none ${isSpecial ? 'text-blue-400 text-lg' : 'text-blue-600'}`}>
                {language === 'KR' ? '승인대기중...' : 'Pending Approval...'}
              </span>
            </div>
            <button 
              onClick={(e) => { e.stopPropagation(); handleChatWithHost(hostId); }}
              className={`flex items-center gap-1 text-[13px] font-black px-5 py-2.5 rounded-full shadow-md active:scale-95 transition-all bg-emerald-600 text-white`}
            >
              {language === 'KR' ? '관리자와 채팅' : 'Chat with Host'}
            </button>
          </div>
        );
      }
      
      if (booking.status === 'SELLER_CONFIRMED') {
        return (
          <div className={`${isSpecial ? 'flex items-end justify-between w-full' : 'px-4 py-3 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between'}`}>
            <div className="flex flex-col">
              <span className={`text-[10px] font-bold uppercase tracking-widest leading-none mb-1 ${isSpecial ? 'text-white/60' : 'text-slate-400'}`}>
                {isSpecial ? t('class.registration_fee') : t('class.daily_pass')}
              </span>
              <span className={`text-[14px] font-black leading-none ${isSpecial ? 'text-emerald-400 text-lg' : 'text-emerald-600'}`}>
                {language === 'KR' ? '신청완료' : 'Completed'}
              </span>
            </div>
          </div>
        );
      }
    }
    
    if (isSpecial) {
      return (
        <div className="flex items-end justify-between">
          <div className="flex flex-col gap-1">
            <p className="text-white/60 text-[10px] font-black tracking-widest uppercase">{t('class.registration_fee')}</p>
            <p className="text-2xl font-black">{cls.amount?.toLocaleString()} <span className="text-sm">{cls.currency || 'KRW'}</span></p>
          </div>
          <button 
            onClick={(e) => { e.stopPropagation(); handleCheckoutClick({ ...cls, group: cls.group }, true); }}
            className="bg-white text-[#2d3435] px-8 py-3.5 rounded-full text-sm font-black shadow-xl active:scale-95 transition-all"
          >
            {t('class.reserve')}
          </button>
        </div>
      );
    } else {
      return (
        <div className="px-4 py-3 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">{t('class.daily_pass')}</span>
            <span className="text-[14px] font-black text-slate-800 leading-none">
              ₩{(cls.dailyClassPrice || Math.floor((cls.price || 0) / 3) + 5000).toLocaleString()}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={(e) => { e.stopPropagation(); handleCheckoutClick(cls, false); }}
              className={`flex items-center gap-1 text-[13px] font-black px-5 py-2 rounded-full shadow-sm transition-all ${isPast ? 'bg-slate-200 text-slate-500' : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md active:scale-95'}`}
              disabled={isPast}
            >
              {isPast ? t('class.closed') : t('class.book_now')}
            </button>
          </div>
        </div>
      );
    }
  };

  const handleCheckoutSubmit = async () => {
    if (!checkoutClass) return;
    try {
      const price = checkoutClass.isSpecial 
        ? (checkoutClass.amount || checkoutClass.price || 0) 
        : (checkoutClass.dailyClassPrice || Math.floor((checkoutClass.price || 0) / 3) + 5000);
      const orderId = await createBooking({
        domain: checkoutClass.isSpecial ? 'class_special' : 'class_daily',
        itemName: checkoutClass.title + (checkoutClass.isSpecial ? ' (Special)' : ' (Daily)'),
        itemImageUrl: checkoutClass.imageUrl || checkoutClass.group?.coverImage || '',
        itemId: checkoutClass.id,
        hostId: checkoutClass.group?.ownerId || '',
        totalAmount: price,
        currency: 'KRW',
        payload: {
          role: checkoutRole,
          classDate: new Date().toISOString(),
          partnerName: checkoutPartnerName.trim() !== '' ? checkoutPartnerName : undefined
        }
      });
      return orderId;
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Booking failed';
      alert(errMsg);
      throw err;
    }
  };

  const renderTodayTab = () => (
    <section className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 text-left pb-10">
      <div className="flex items-center justify-between px-1 mb-2">
        <h2 className="text-[18px] font-black tracking-tight text-slate-800">TODAY'S CLASSES</h2>
      </div>

      {todayBlocks.length === 0 ? (
         <div className="flex flex-col items-center justify-center py-20 text-slate-400 bg-slate-50 rounded-2xl border border-slate-100 border-dashed">
           <span className="material-symbols-outlined text-4xl mb-2 opacity-50">event_busy</span>
           <p className="text-sm font-bold">No classes scheduled for today.</p>
         </div>
      ) : (
        <div className="space-y-6">
          {todayBlocks.map((block, idx) => (
            <div key={idx} className="space-y-3">
              <div className="flex items-center gap-2 px-1">
                <span className="material-symbols-outlined text-[18px] text-blue-500">{block.icon}</span>
                <h3 className="text-[13px] font-black text-slate-700 tracking-wider uppercase">{block.label} <span className="text-slate-400 ml-1 font-medium text-[11px] tracking-normal">{block.time}</span></h3>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {block.classes.map(cls => {
                  const startTimeStr = (cls.scheduleEntry?.timeSlot?.split(/[-~]/)[0] || cls.startTime || '00:00').trim();
                  const endTimeStr = (cls.scheduleEntry?.timeSlot?.split(/[-~]/)[1] || cls.endTime || '00:00').trim();
                  
                  const hr = parseInt(startTimeStr.split(':')[0] || '0', 10);
                  const min = parseInt(startTimeStr.split(':')[1] || '0', 10);
                  const now = new Date();
                  const classTime = new Date();
                  classTime.setHours(hr, min, 0, 0);
                  
                  // Past or starting soon
                  const isPast = now.getTime() > classTime.getTime();
                  const isStartingSoon = !isPast && (classTime.getTime() - now.getTime() < 2 * 60 * 60 * 1000); // within 2 hours
                  const isInstructor = user && (profile?.systemRole === 'admin' || profile?.isAdmin || cls.instructors?.some((i) => i.userId === user.uid || i.name === user.displayName) || cls.group?.ownerId === user.uid);
                  
                  return (
                    <div 
                      key={cls.id} 
                      className={`relative overflow-hidden rounded-[20px] bg-white border ${isPast ? 'border-slate-100 opacity-60 grayscale-[50%]' : 'border-slate-100 shadow-sm'} transition-all`}
                    >
                      <div className="p-4 flex flex-col gap-3 cursor-pointer" onClick={() => handleClassClick(cls)}>
                        <div className="flex gap-3">
                          <div className="shrink-0 w-16 h-16 rounded-xl overflow-hidden bg-slate-100 border border-slate-100">
                            {(() => {
                              const imgKey = `today-${cls.id}`;
                              const hasError = portalImageErrors[imgKey];
                              const displaySrc = cls.imageUrl || cls.group?.coverImage || cls.group?.logo;
                              if (hasError || !displaySrc) {
                                return (
                                  <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-300">
                                    <span className="material-symbols-outlined text-[24px]">school</span>
                                  </div>
                                );
                              }
                              return (
                                <img 
                                  src={displaySrc} 
                                  alt={cls.title} 
                                  className="w-full h-full object-cover" 
                                  onError={() => {
                                    setPortalImageErrors(prev => ({ ...prev, [imgKey]: true }));
                                  }}
                                />
                              );
                            })()}
                          </div>
                          <div className="flex-1 min-w-0">
                            {isStartingSoon && (
                              <div className="inline-flex items-center gap-1 bg-red-50 text-red-600 px-1.5 py-0.5 rounded uppercase text-[9px] font-black tracking-widest mb-1 border border-red-100">
                                <span className="material-symbols-outlined text-[10px]">timer</span> Starting Soon
                              </div>
                            )}
                            <div className="flex items-start justify-between gap-2">
                              <h4 className="text-[16px] font-black text-slate-800 leading-tight mb-1 flex-1 truncate">{cls.title}</h4>

                            </div>
                            <p className="text-[12px] font-medium text-slate-500 truncate mb-0.5">
                              {startTimeStr}-{endTimeStr} · {cls.location || cls.group?.name}
                            </p>
                            {cls.instructors && cls.instructors.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 mt-1">
                                {cls.instructors.map((inst: any, idx: number) => (
                                  <UserBadge
                                    key={inst.id || inst.uid || inst.userId || idx}
                                    uid={inst.id || inst.uid || inst.userId || ''}
                                    nickname={formatInstructorNames(inst.name || '', language)}
                                    photoURL={inst.avatar || inst.photoURL || inst.image || inst.imageUrl}
                                    avatarSize="w-5 h-5"
                                    nameClassName="font-bold text-[10px] text-slate-600 truncate max-w-[60px]"
                                    nativeClassName="text-[8px] font-semibold text-slate-400 ml-1 truncate max-w-[40px]"
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        {cls.isDailyBookingOpen && cls.instructorComment && (
                          <div className="mt-2 p-2.5 bg-amber-50/80 rounded-xl border border-amber-100 flex items-start gap-2">
                            <span className="material-symbols-outlined text-[14px] text-amber-500 mt-0.5 shrink-0">chat_bubble</span>
                            <p className="text-[12px] font-bold text-amber-800 leading-tight flex-1">
                              {cls.instructorComment}
                            </p>
                          </div>
                        )}
                      </div>

                      {cls.isDailyBookingOpen && renderBookingStatusArea(cls, isPast, false)}

                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );

  const renderWeekTab = () => (
    <section className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 text-left pb-10">
      <div className="flex items-center justify-between px-1 mb-2">
        <div className="flex items-center gap-2">
          {(selectedOrganizer !== 'All' || selectedGroupId !== 'All') && (
            <>
              <span className="material-symbols-outlined text-[14px] text-blue-600">filter_alt</span>
              <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">
                {selectedOrganizer !== 'All' ? selectedOrganizer : ''}
                {selectedOrganizer !== 'All' && selectedGroupId !== 'All' ? ' · ' : ''}
                {selectedGroupId !== 'All' ? (
                  (() => {
                    const grp = groups.find(g => g.id === selectedGroupId);
                    return grp ? (language === 'KR' ? (grp.nativeName || grp.name) : grp.name) : '';
                  })()
                ) : ''}
              </span>
            </>
          )}
        </div>
        
        <div className="flex items-center gap-3 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100 ml-auto">
          <button onClick={() => setWeekOffset(prev => prev - 1)} className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-slate-200 active:scale-90 transition-all text-slate-500">
            <span className="material-symbols-outlined text-[18px]">chevron_left</span>
          </button>
          <span className="text-[11px] font-black text-slate-700 uppercase tracking-widest min-w-[60px] text-center">
            {weekOffset === 0 ? t('class.this_week') : weekOffset === 1 ? t('class.next_week') : weekOffset === -1 ? t('class.last_week') : `${weekOffset > 0 ? '+' : ''}${weekOffset} ${t('class.weeks')}`}
          </span>
          <button onClick={() => setWeekOffset(prev => prev + 1)} className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-slate-200 active:scale-90 transition-all text-slate-500">
            <span className="material-symbols-outlined text-[18px]">chevron_right</span>
          </button>
        </div>
      </div>

      {weekTimeline.length === 0 || weekTimeline.every(g => g.classes.length === 0) ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <span className="material-symbols-outlined text-4xl mb-2">event_busy</span>
          <p className="text-sm font-medium">No classes scheduled.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {weekTimeline.map((group, idx) => {
            if (group.classes.length === 0) return null;
            const isToday = group.date.toDateString() === new Date().toDateString();
            const isWeekend = group.date.getDay() === 0 || group.date.getDay() === 6;
            const isRed = isWeekend;
            return (
              <div key={idx} className="overflow-hidden rounded-xl border border-slate-100 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)]">
                <div className={`flex items-center gap-3 px-4 py-3 border-b border-slate-100 ${isToday ? 'bg-blue-600' : isRed ? 'bg-red-500' : 'bg-slate-800'}`}>
                  <div className="flex flex-col items-center justify-center w-10 h-10 rounded-lg bg-white/15 shrink-0">
                    <span className="text-[9px] font-black text-white/80 uppercase tracking-wider leading-none">
                      {group.date.toLocaleDateString('en-US', { weekday: 'short' })}
                    </span>
                    <span className="text-[20px] font-black text-white leading-none tracking-tighter">
                      {group.date.getDate()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[13px] font-black text-white tracking-tight">
                      {group.date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
                      {isToday && <span className="ml-2 bg-white text-blue-600 px-1.5 py-0.5 rounded text-[9px] leading-none font-black">TODAY</span>}
                    </h3>
                  </div>
                  <span className="text-[11px] font-bold text-white/60 tracking-wider shrink-0">{group.classes.length} CLASSES</span>
                </div>
                <div className="bg-slate-50 p-4 space-y-4 rounded-b-xl">
                  {group.classes.map((cls, cIdx) => {
                    const startTimeStr = (cls.scheduleEntry?.timeSlot?.split(/[-~]/)[0] || cls.startTime || '00:00').trim();
                    const endTimeStr = (cls.scheduleEntry?.timeSlot?.split(/[-~]/)[1] || cls.endTime || '00:00').trim();
                    
                    const hr = parseInt(startTimeStr.split(':')[0] || '0', 10);
                    const min = parseInt(startTimeStr.split(':')[1] || '0', 10);
                    const now = new Date();
                    const classTime = new Date(group.date);
                    classTime.setHours(hr, min, 0, 0);
                    
                    const isToday = now.toDateString() === group.date.toDateString();
                    
                    // Past or starting soon
                    const isPast = now.getTime() > classTime.getTime();
                    const isStartingSoon = !isPast && (classTime.getTime() - now.getTime() < 2 * 60 * 60 * 1000) && isToday;
                    
                    const isInstructor = user && (profile?.systemRole === 'admin' || profile?.isAdmin || cls.instructors?.some((i) => i.userId === user.uid || i.name === user.displayName) || cls.group?.ownerId === user.uid);
                    
                    return (
                    <div 
                      key={`${cls.id}-${cIdx}`} 
                      className={`relative overflow-hidden rounded-[20px] bg-white border ${isPast ? 'border-slate-100 opacity-60 grayscale-[50%]' : 'border-slate-100 shadow-sm'} transition-all`}
                    >
                      <div className="p-4 flex flex-col gap-3 cursor-pointer" onClick={() => handleClassClick(cls)}>
                        <div className="flex gap-3">
                          <div className="shrink-0 w-16 h-16 rounded-xl overflow-hidden bg-slate-100 border border-slate-100">
                            {(() => {
                              const imgKey = `week-${cls.id}`;
                              const hasError = portalImageErrors[imgKey];
                              const displaySrc = cls.imageUrl || cls.group?.coverImage || cls.group?.logo;
                              if (hasError || !displaySrc) {
                                return (
                                  <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-300">
                                    <span className="material-symbols-outlined text-[24px]">school</span>
                                  </div>
                                );
                              }
                              return (
                                <img 
                                  src={displaySrc} 
                                  alt={cls.title} 
                                  className="w-full h-full object-cover" 
                                  onError={() => {
                                    setPortalImageErrors(prev => ({ ...prev, [imgKey]: true }));
                                  }}
                                />
                              );
                            })()}
                          </div>
                          <div className="flex-1 min-w-0">
                            {isStartingSoon && (
                              <div className="inline-flex items-center gap-1 bg-red-50 text-red-600 px-1.5 py-0.5 rounded uppercase text-[9px] font-black tracking-widest mb-1 border border-red-100">
                                <span className="material-symbols-outlined text-[10px]">timer</span> Starting Soon
                              </div>
                            )}
                            <div className="flex items-start justify-between gap-2">
                              <h4 className="text-[16px] font-black text-slate-800 leading-tight mb-1 flex items-baseline gap-1.5 flex-1 truncate">
                                {cls.title}
                                {cls.level && <span className="text-[10px] font-medium text-slate-400 truncate uppercase">{cls.level}</span>}
                              </h4>

                            </div>
                            <p className="text-[12px] font-medium text-slate-500 truncate mb-0.5">
                              {startTimeStr}-{endTimeStr} · {cls.location || cls.group?.name}
                            </p>
                            {cls.instructors && cls.instructors.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 mt-1">
                                {cls.instructors.map((inst: any, idx: number) => (
                                  <UserBadge
                                    key={inst.id || inst.uid || inst.userId || idx}
                                    uid={inst.id || inst.uid || inst.userId || ''}
                                    nickname={formatInstructorNames(inst.name || '', language)}
                                    photoURL={inst.avatar || inst.photoURL || inst.image || inst.imageUrl}
                                    avatarSize="w-5 h-5"
                                    nameClassName="font-bold text-[10px] text-slate-600 truncate max-w-[60px]"
                                    nativeClassName="text-[8px] font-semibold text-slate-400 ml-1 truncate max-w-[40px]"
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        {cls.isDailyBookingOpen && cls.instructorComment && (
                          <div className="mt-2 p-2.5 bg-amber-50/80 rounded-xl border border-amber-100 flex items-start gap-2">
                            <span className="material-symbols-outlined text-[14px] text-amber-500 mt-0.5 shrink-0">chat_bubble</span>
                            <p className="text-[12px] font-bold text-amber-800 leading-tight flex-1">
                              {cls.instructorComment}
                            </p>
                          </div>
                        )}
                      </div>

                      {cls.isDailyBookingOpen && renderBookingStatusArea(cls, isPast, false)}

                    </div>
                  )})}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );

  const filteredGroups = useMemo(() => {
    return groups
      .filter(group => {
        // Find associated venue to check region
        const venue = venues.find(v => v.id === group.venueId);
        const isSeoul = venue?.region?.toLowerCase() === 'seoul';
        const isStudio = group.tags?.some(tag => tag.toLowerCase() === 'studio');
        return isSeoul && isStudio;
      })
      .sort((a, b) => (b.classes?.length || 0) - (a.classes?.length || 0));
  }, [groups, venues]);

  const renderMonthTab = () => {
    const targetDate = new Date();
    if (targetDate.getDate() >= 16) {
      targetDate.setMonth(targetDate.getMonth() + 1);
    }
    targetDate.setMonth(targetDate.getMonth() + monthOffset);
    const targetYear = targetDate.getFullYear();
    const targetMonthNum = targetDate.getMonth();
    const targetMonthStr = `${targetYear}-${String(targetMonthNum + 1).padStart(2, '0')}`;
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const monthLabel = language === 'KR'
      ? `${targetYear}년 ${targetMonthNum + 1}월`
      : `${monthNames[targetMonthNum]} ${targetYear}`;

    const getGroupClassCount = (groupId: string) => {
      return allClasses.filter(cls => {
        if (cls.groupId !== groupId) return false;
        if (cls.targetMonth) return cls.targetMonth === targetMonthStr;
        if (cls.schedule && Array.isArray(cls.schedule)) {
          return cls.schedule.some((s) => {
            if (!s.date || typeof s.date !== 'string') return false;
            const normalized = s.date.replace(/[\.\/ ]/g, '-');
            return normalized.startsWith(targetMonthStr);
          });
        }
        return false;
      }).length;
    };

    const getGroupDiscountCount = (groupId: string) => allDiscountsGlobal.filter((d: ClassDiscount) => {
      if (d.groupId !== groupId) return false;
      if (d.targetMonth) return d.targetMonth === targetMonthStr;
      return true;
    }).length;

    return (
    <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-10">
      <div className="flex items-center justify-between px-1 mb-2">
        <h3 className="text-[10px] font-black text-[#596061] uppercase tracking-[0.2em]">{t('class.studios_in_seoul')}</h3>
        <div className="flex items-center gap-3 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
          <button onClick={() => setMonthOffset(prev => prev - 1)} className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-slate-200 active:scale-90 transition-all text-slate-500">
            <span className="material-symbols-outlined text-[18px]">chevron_left</span>
          </button>
          <span className="text-[11px] font-black text-slate-700 tracking-widest min-w-[100px] text-center">
            {monthLabel}
          </span>
          <button onClick={() => setMonthOffset(prev => prev + 1)} className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-slate-200 active:scale-90 transition-all text-slate-500">
            <span className="material-symbols-outlined text-[18px]">chevron_right</span>
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4">
        {[...filteredGroups].sort((a, b) => getGroupClassCount(b.id) - getGroupClassCount(a.id)).map((group) => (
          <div 
            key={group.id} 
            onClick={() => router.push(`/class/${group.id}?month=${targetMonthStr}`)}
            className="bg-white border border-[#f2f4f4] rounded-[24px] p-4 flex items-center gap-4 shadow-sm hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="w-16 h-16 rounded-2xl overflow-hidden flex-shrink-0 bg-slate-100 flex items-center justify-center">
              {(() => {
                const imgKey = `month-group-${group.id}`;
                const hasError = portalImageErrors[imgKey];
                const displaySrc = group.logo || group.coverImage;
                if (hasError || !displaySrc) {
                  return (
                    <span className="material-symbols-outlined text-slate-300 text-[24px]">storefront</span>
                  );
                }
                return (
                  <img 
                    src={displaySrc} 
                    alt={group.name} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                    onError={() => {
                      setPortalImageErrors(prev => ({ ...prev, [imgKey]: true }));
                    }}
                  />
                );
              })()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-1.5 mb-1">
                <h4 className="text-[1rem] font-black text-[#2d3435] truncate">
                  {group.name}
                  {group.nativeName && (
                    <span className="text-[11px] font-medium text-[#acb3b4] ml-1">{group.nativeName}</span>
                  )}
                </h4>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <div className="flex items-center bg-slate-50 border border-slate-100 rounded-lg px-2 py-0.5">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter mr-1.5">CLASSES</span>
                  <span className="text-[11px] font-black text-slate-700">{getGroupClassCount(group.id)}</span>
                </div>
                <div className="flex items-center bg-blue-50 border border-blue-100 rounded-lg px-2 py-0.5">
                  <span className="text-[9px] font-black text-blue-400 uppercase tracking-tighter mr-1.5">BUNDLE</span>
                  <span className="text-[11px] font-black text-blue-700">{getGroupDiscountCount(group.id)}</span>
                </div>

              </div>
              {group.updatedAt && (() => {
                const updated = safeDate(group.updatedAt) || new Date();
                const diffMs = Date.now() - updated.getTime();
                const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                const label = diffDays === 0 ? t('class.updated_today') : diffDays === 1 ? t('class.updated_yesterday') : t('class.updated_days_ago').replace('{days}', String(diffDays));
                return <p className="text-[9px] font-medium text-slate-400 mt-1">{label}</p>;
              })()}
            </div>
            <span className="material-symbols-outlined text-[#acb3b4] group-hover:text-primary transition-colors">chevron_right</span>
          </div>
        ))}
      </div>
      {filteredGroups.length === 0 && (
        <div className="py-20 text-center">
          <p className="text-[#acb3b4] font-bold">{t('class.no_studios_found')}</p>
        </div>
      )}
    </div>
  );
  };

  const renderSpecialTab = () => {
    const isAdminOrOwner = user && (profile?.systemRole === 'admin' || profile?.isAdmin || groups.some(g => g.ownerId === user.uid));
    
    return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {isAdminOrOwner && (
        <div className="px-5 py-3 flex items-center justify-between bg-white rounded-xl border border-slate-100 shadow-sm">
          <p className="text-[12px] font-bold text-slate-400 uppercase tracking-tight">
            {t('class.have_special_events')}
          </p>
          <button 
            onClick={handleAddSpecialClick}
            className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700 transition-colors py-2"
          >
            <span className="text-[13px] font-bold">{t('class.register_event')}</span>
            <span className="material-symbols-outlined text-[18px]">add_circle</span>
          </button>
        </div>
      )}

      {specialClasses.length > 0 ? (
        specialClasses.map((cls: GroupClass) => {
          const group = groups.find(g => g.id === cls.groupId);
          return (
            <div 
              key={cls.id} 
              onClick={() => handleClassClick(cls)}
              className="relative rounded-[32px] overflow-hidden bg-[#2d3435] text-white shadow-2xl cursor-pointer group"
            >
              <div className="absolute inset-0 bg-slate-800 flex items-center justify-center">
                {(() => {
                  const imgKey = `special-${cls.id}`;
                  const hasError = portalImageErrors[imgKey];
                  const displaySrc = cls.imageUrl || group?.coverImage;
                  if (hasError || !displaySrc) {
                    return (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-800 text-slate-500">
                        <span className="material-symbols-outlined text-6xl opacity-30">stars</span>
                        <div className="absolute inset-0 bg-gradient-to-t from-[#2d3435] via-[#2d3435]/40 to-transparent" />
                      </div>
                    );
                  }
                  return (
                    <>
                      <img 
                        src={displaySrc} 
                        alt={cls.title} 
                        className="w-full h-full object-cover opacity-60" 
                        onError={() => {
                          setPortalImageErrors(prev => ({ ...prev, [imgKey]: true }));
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#2d3435] via-[#2d3435]/40 to-transparent" />
                    </>
                  );
                })()}
              </div>
              <div className="relative p-8 pt-24">
                <div className="inline-flex items-center gap-2 bg-primary px-4 py-1.5 rounded-full mb-4 shadow-lg shadow-primary/30">
                  <span className="material-symbols-outlined text-sm">stars</span>
                  <span className="text-[10px] font-black tracking-widest uppercase">{t('class.special_event_label')}</span>
                </div>
                <h3 className="text-2xl font-black mb-4 leading-tight">{cls.title}</h3>
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-6 h-6 rounded-full overflow-hidden border border-white/20">
                    <img src={group?.logo || group?.coverImage || ''} alt="" className="w-full h-full object-cover" />
                  </div>
                  <span className="text-xs font-bold text-white/80">{group?.name}</span>
                </div>
                {renderBookingStatusArea({ ...cls, group }, false, true)}
              </div>
            </div>
          );
        })
      ) : (
        <div className="py-20 flex flex-col items-center justify-center text-center bg-[#f8f9fa] rounded-[32px] border border-dashed border-[#acb3b4]/30">
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm">
            <span className="material-symbols-outlined text-[#acb3b4] text-4xl">campaign</span>
          </div>
          <h4 className="text-[#2d3435] font-black mb-2">{t('class.no_special_events')}</h4>
          <p className="text-[#acb3b4] text-xs font-medium max-w-[200px]">{t('class.stay_tuned_special')}</p>
        </div>
      )}
    </div>
  )};

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-white w-full h-full overflow-y-auto no-scrollbar">
      <style dangerouslySetInnerHTML={{ __html: `
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />

      <div className="flex-1 px-5 py-6">


        <div className="min-h-[400px]">
          {activeTab === 'TODAY' && renderTodayTab()}
          {activeTab === 'WEEK' && renderWeekTab()}
          {activeTab === 'MONTH' && renderMonthTab()}
          {activeTab === 'SPECIAL' && renderSpecialTab()}
        </div>

        <div className="mt-12 pt-4 pb-[calc(env(safe-area-inset-bottom)+80px)] text-center">
          <p className="text-[9px] text-[#acb3b4] font-bold tracking-widest uppercase">© {new Date().getFullYear()} World of Community · woc.today</p>
        </div>
      </div>
      
      {/* Capacity Setter Modal */}
      {/* Capacity Setter Modal */}
      <BottomSheet
        isOpen={capacityModalOpen}
        onClose={() => setCapacityModalOpen(false)}
        title={t('class.set_capacity')}
        footer={
          <div className="p-5 border-t border-slate-100 bg-white">
            <div className="flex justify-between items-center mb-4">
              <span className="text-[14px] text-slate-500 font-medium">Daily Class Price</span>
              <span className="text-xl font-black text-slate-900">
                ₩{tempDailyClassPrice?.toLocaleString() || '0'}
              </span>
            </div>
            <button 
              onClick={handleSaveCapacity} 
              className="w-full py-4 text-[16px] font-black text-white bg-black rounded-xl active:scale-95 transition-all"
            >
              {t('class.save_changes')}
            </button>
          </div>
        }
      >
        {editingClass && (
          <div className="space-y-6 py-2">
            <p className="text-[13px] font-medium text-slate-500 mb-2 line-clamp-2">{editingClass.title}</p>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-[14px] font-black text-slate-800 uppercase">{t('class.daily_booking')}</span>
                <button 
                  onClick={() => setTempIsDailyBookingOpen(!tempIsDailyBookingOpen)} 
                  className={`w-12 h-6 rounded-full p-1 flex items-center transition-all duration-300 ${tempIsDailyBookingOpen ? 'bg-blue-500 justify-end' : 'bg-slate-300 justify-start'}`}
                >
                  <div className="w-4 h-4 rounded-full bg-white shadow-sm"></div>
                </button>
              </div>

              {tempIsDailyBookingOpen && (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300 mt-4">
                  <div className="flex flex-col gap-2 p-4 rounded-2xl bg-amber-50 border border-amber-100">
                    <div className="flex items-center justify-between">
                      <span className="text-[14px] font-black text-amber-800 uppercase">{t('class.instructor_comment')}</span>
                      <span className="text-[11px] font-bold text-amber-600">{tempInstructorComment.length}/30</span>
                    </div>
                    <input
                      type="text"
                      maxLength={30}
                      value={tempInstructorComment}
                      onChange={(e) => setTempInstructorComment(e.target.value)}
                      placeholder={t('class.comment_placeholder')}
                      className="w-full bg-white border border-amber-200 rounded-xl px-4 py-3 text-[13px] font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                    />
                  </div>

                  <div className="flex flex-col gap-2 p-4 rounded-2xl bg-emerald-50 border border-emerald-100">
                    <div className="flex items-center justify-between">
                      <span className="text-[14px] font-black text-emerald-800 uppercase">{t('class.daily_class_price')}</span>
                    </div>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-black">₩</span>
                      <input
                        type="number"
                        value={tempDailyClassPrice || ''}
                        onChange={(e) => setTempDailyClassPrice(parseInt(e.target.value) || 0)}
                        className="w-full bg-white border border-emerald-200 rounded-xl pl-8 pr-4 py-3 text-[13px] font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </BottomSheet>


      {/* Checkout Modal */}
      {checkoutClass && (
        <UnifiedCheckoutModal
          isOpen={checkoutModalOpen}
          onClose={() => {
            setCheckoutModalOpen(false);
            setCheckoutInitialStep(undefined);
            setCheckoutInitialBookingId(undefined);
            setCheckoutInitialOrderNumber(undefined);
            setCheckoutInitialCreatedAt(undefined);
            setCheckoutPartnerName('');
          }}
          title={checkoutClass.isSpecial ? t('class.booking_special_title') : t('class.booking_daily_title')}
          subtitle={`${checkoutClass.title} · ${new Date().toLocaleDateString(language === 'KR' ? 'ko-KR' : 'en-US', { weekday: 'long', month: 'short', day: 'numeric' })}`}
          totalAmount={checkoutClass.isSpecial 
            ? (checkoutClass.amount || checkoutClass.price || 0) 
            : (checkoutClass.dailyClassPrice || Math.floor((checkoutClass.price || 0) / 3) + 5000)
          }
          onCheckout={handleCheckoutSubmit}
          isProcessing={isBooking}
          buttonText={t('class.submit_request')}
          bankDetails={{
            bankName: (checkoutClass.group?.classPaymentSettings?.bankDetails || checkoutClass.group?.bankDetails)?.bankName || 'Kookmin Bank',
            accountHolder: (checkoutClass.group?.classPaymentSettings?.bankDetails || checkoutClass.group?.bankDetails)?.accountHolder || checkoutClass.group?.name || 'World of Community',
            accountNumber: (checkoutClass.group?.classPaymentSettings?.bankDetails || checkoutClass.group?.bankDetails)?.accountNumber || '123456-00-123456'
          }}
          onReportPayment={reportPayment}
          initialStep={checkoutInitialStep}
          initialBookingId={checkoutInitialBookingId}
          initialOrderNumber={checkoutInitialOrderNumber}
          initialCreatedAt={checkoutInitialCreatedAt}
        >
          <div className="space-y-6 py-2">
            <div className="flex gap-3 p-3 bg-neutral-50 rounded-2xl border border-neutral-200">
              <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-neutral-200">
                {(() => {
                  const imgKey = `checkout-${checkoutClass.id}`;
                  const hasError = portalImageErrors[imgKey];
                  const displaySrc = checkoutClass.imageUrl || checkoutClass.group?.coverImage || checkoutClass.group?.logo;
                  if (hasError || !displaySrc) {
                    return (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="material-symbols-outlined text-[24px] text-neutral-400">school</span>
                      </div>
                    );
                  }
                  return (
                    <img 
                      src={displaySrc} 
                      alt={checkoutClass.title} 
                      className="w-full h-full object-cover" 
                      onError={() => {
                        setPortalImageErrors(prev => ({ ...prev, [imgKey]: true }));
                      }}
                    />
                  );
                })()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold text-neutral-500 uppercase">{checkoutClass.group?.name || 'World of Community'}</p>
                <p className="text-sm font-bold text-neutral-900 truncate">{checkoutClass.title}</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  <span className="text-[10px] bg-neutral-200 text-neutral-600 px-2 py-0.5 rounded-full font-bold">
                    {((checkoutClass as any).scheduleEntry?.timeSlot?.split(/[-~]/)[0] || checkoutClass.startTime || '00:00').trim()}-{((checkoutClass as any).scheduleEntry?.timeSlot?.split(/[-~]/)[1] || checkoutClass.endTime || '00:00').trim()}
                  </span>
                  <span className="text-[10px] bg-neutral-200 text-neutral-600 px-2 py-0.5 rounded-full font-bold">
                    {checkoutClass.location || checkoutClass.group?.name}
                  </span>
                  {checkoutClass.instructors && checkoutClass.instructors.length > 0 && (
                    <span className="text-[10px] bg-neutral-200 text-neutral-600 px-2 py-0.5 rounded-full font-bold">
                      {checkoutClass.instructors.map((i)=>i.name).join(', ')}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-bold text-neutral-900 mb-3">{t('class.select_role')}</h4>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setCheckoutRole('leader')}
                  className={`flex flex-col items-center justify-center py-4 rounded-xl border-2 transition-all ${checkoutRole === 'leader' ? 'border-blue-500 bg-blue-50' : 'border-neutral-200 hover:border-neutral-300'}`}
                >
                  <span className={`text-sm font-black uppercase ${checkoutRole === 'leader' ? 'text-blue-700' : 'text-neutral-700'}`}>Leader</span>
                </button>
                <button
                  onClick={() => setCheckoutRole('follower')}
                  className={`flex flex-col items-center justify-center py-4 rounded-xl border-2 transition-all ${checkoutRole === 'follower' ? 'border-purple-500 bg-purple-50' : 'border-neutral-200 hover:border-neutral-300'}`}
                >
                  <span className={`text-sm font-black uppercase ${checkoutRole === 'follower' ? 'text-purple-700' : 'text-neutral-700'}`}>Follower</span>
                </button>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-bold text-neutral-900 mb-3">{t('class.partner_name')}</h4>
              <input
                type="text"
                value={checkoutPartnerName}
                onChange={(e) => setCheckoutPartnerName(e.target.value)}
                placeholder={t('class.partner_name_placeholder') || "파트너 이름을 입력하세요"}
                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            
            <div className="bg-neutral-50 rounded-xl p-4 border border-neutral-100">
              <h4 className="text-[13px] font-black text-neutral-900 mb-2 flex items-center gap-1.5"><span className="material-symbols-outlined text-[16px] text-blue-500">info</span> {t('class.booking_notice_title')}</h4>
              <p className="text-xs font-medium text-neutral-600 leading-relaxed">
                {t('class.booking_notice_desc')}
              </p>
            </div>
          </div>
        </UnifiedCheckoutModal>
      )}

      {/* Add Special Class Editor Modal */}
      {isAddingSpecialClass && (
        <Portal>
          <div className="fixed inset-0 z-[1000] bg-white overflow-y-auto">
            <GroupClassAddEditor 
              group={null}
              isSpecial={true}
              onClose={() => setIsAddingSpecialClass(false)}
              onSave={async () => {
                setIsAddingSpecialClass(false);
                setLoading(true);
                try {
                  const [allData, specialData] = await Promise.all([
                    groupService.getGlobalClassesAll(),
                    groupService.getGlobalSpecialClasses()
                  ]);
                  setAllClasses(allData);
                  setSpecialClasses(specialData);
                } finally {
                  setLoading(false);
                }
              }}
            />
          </div>
        </Portal>
      )}

      {/* Group Selector Modal */}
      {showGroupSelector && (
        <Portal>
          <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-sm bg-white rounded-[32px] p-6 shadow-2xl">
              <h3 className="text-[18px] font-black text-slate-800 mb-4">Select Studio</h3>
              <div className="flex flex-col gap-2 max-h-[60vh] overflow-y-auto">
                {groups.filter(g => g.ownerId === user?.uid || profile?.systemRole === 'admin' || profile?.isAdmin).map(g => (
                  <button 
                    key={g.id}
                    onClick={() => {
                      setSelectedGroupForAdd(g);
                      setShowGroupSelector(false);
                      setIsAddingSpecialClass(true);
                    }}
                    className="flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all text-left"
                  >
                    <div className="w-10 h-10 rounded-xl bg-slate-100 overflow-hidden shrink-0">
                      {(g.logo || g.coverImage) && <img src={g.logo || g.coverImage || ''} alt="" className="w-full h-full object-cover" />}
                    </div>
                    <span className="font-bold text-slate-700 text-[14px]">{g.name}</span>
                  </button>
                ))}
              </div>
              <button 
                onClick={() => setShowGroupSelector(false)}
                className="mt-4 w-full py-3 bg-slate-100 text-slate-500 font-bold text-[14px] rounded-2xl hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </Portal>
      )}
      {/* Class Detail Overlay - state 기반, 페이지 이동 없이 열고 닫힘 */}
      <ClassDetail
        groupId={selectedDetailClass?.groupId || ''}
        isOpen={!!selectedDetailClass}
        itemId={selectedDetailClass?.id}
        itemDetail={selectedDetailClass}
        onClose={() => setSelectedDetailClass(null)}
        onManage={(cls) => {
          setSelectedDetailClass(null);
          setEditingClass(cls);
          setTempIsDailyBookingOpen(!!cls.isDailyBookingOpen);
          setTempInstructorComment(cls.instructorComment || '');
          setTempDailyClassPrice(cls.dailyClassPrice || Math.floor((cls.price || 0) / 3) + 5000);
          setCapacityModalOpen(true);
        }}
      />

      {/* Chat Overlay - 관리자와 채팅을 현재 페이지 위에 오버레이로 표시 */}
      {chatOverlayRoomId && (
        <div className="fixed inset-0 z-[9999] bg-background flex flex-col">
          <ChatRoomComponent
            roomId={chatOverlayRoomId}
            onBack={() => setChatOverlayRoomId(null)}
          />
        </div>
      )}
    </div>
  );
}
