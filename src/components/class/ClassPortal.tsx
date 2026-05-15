'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { groupService } from '@/lib/firebase/groupService';
import { venueService } from '@/lib/firebase/venueService';
import { Group, GroupClass } from '@/types/group';
import { Venue } from '@/types/venue';
import { useNavigation } from '@/components/providers/NavigationProvider';
import { useLanguage } from '@/contexts/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useModalNavigation } from '@/hooks/useModalNavigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/clientApp';
import { useBookingEngine } from '@/hooks/useBookingEngine';
import UnifiedCheckoutModal from '@/components/common/UnifiedCheckoutModal';
import Portal from '@/components/common/Portal';

export default function ClassPortal() {
  const router = useRouter();
  const { setSubHeader } = useNavigation();
  const { t } = useLanguage();
  
  const [activeTab, setActiveTab] = useState<'TODAY' | 'WEEK' | 'MONTH' | 'SPECIAL'>('TODAY');
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState<Group[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [allClasses, setAllClasses] = useState<any[]>([]);
  const [specialClasses, setSpecialClasses] = useState<any[]>([]);
  
  const { user } = useAuth();
  
  const [weekOffset, setWeekOffset] = useState(0);

  const [showOrganizerFilter, setShowOrganizerFilter] = useState(false);
  const [showClubFilter, setShowClubFilter] = useState(false);
  const [selectedOrganizer, setSelectedOrganizer] = useState('All');
  const [selectedClub, setSelectedClub] = useState('All');
  
  const [capacityModalOpen, setCapacityModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<any>(null);
  const [tempLeader, setTempLeader] = useState<number | undefined>(undefined);
  const [tempFollower, setTempFollower] = useState<number | undefined>(undefined);
  const [tempIsDailyBookingOpen, setTempIsDailyBookingOpen] = useState(false);
  const [tempInstructorComment, setTempInstructorComment] = useState('');
  const [tempDailyClassPrice, setTempDailyClassPrice] = useState<number>(0);
  
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [checkoutClass, setCheckoutClass] = useState<any>(null);
  const [checkoutRole, setCheckoutRole] = useState<'leader' | 'follower'>('leader');

  const { createBooking, reportPayment, isLoading: isBooking } = useBookingEngine();
  
  const { openModal: openClassDetail } = useModalNavigation('modal');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [groupsData, allData, specialData, venuesData] = await Promise.all([
          groupService.getGroups(),
          groupService.getGlobalClassesAll(),
          groupService.getGlobalSpecialClasses(),
          venueService.getVenues()
        ]);
        
        setGroups(groupsData);
        setAllClasses(allData);
        setSpecialClasses(specialData);
        setVenues(venuesData || []);
      } catch (error) {
        console.error("Failed to fetch class portal data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const organizers = useMemo(() => {
    const instSet = new Set<string>();
    allClasses.forEach(cls => {
      if (cls.instructors && Array.isArray(cls.instructors)) {
        cls.instructors.forEach((inst: any) => {
          if (inst.name) instSet.add(inst.name);
        });
      }
    });
    return Array.from(instSet).sort();
  }, [allClasses]);

  const clubs = useMemo(() => {
    const clubSet = new Set<string>();
    groups.forEach(g => {
      if (g.name) clubSet.add(g.name);
    });
    return Array.from(clubSet).sort();
  }, [groups]);

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

    const grouped: Record<string, { date: Date, classes: any[] }> = {};
    days.forEach(d => {
      const dateStr = d.toDateString();
      grouped[dateStr] = { date: d, classes: [] };
    });

    allClasses.forEach(cls => {
      const group = groups.find(g => g.id === cls.groupId);
      
      if (selectedClub !== 'All' && group?.name !== selectedClub) return;
      if (selectedOrganizer !== 'All') {
        const hasInstructor = cls.instructors?.some((i: any) => i.name === selectedOrganizer);
        if (!hasInstructor) return;
      }

      cls.schedule?.forEach((s: any) => {
        if (!s.date) return;
        let dStr = '';
        if (typeof s.date === 'string') dStr = s.date.trim();
        else if (s.date && typeof s.date.toDate === 'function') {
          const dObj = s.date.toDate();
          dStr = `${dObj.getFullYear()}-${String(dObj.getMonth() + 1).padStart(2, '0')}-${String(dObj.getDate()).padStart(2, '0')}`;
        }

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
  }, [activeTab, allClasses, groups, weekOffset, selectedOrganizer, selectedClub]);

  // Sub Header Tab Navigation
  useEffect(() => {
    const filterBar = (
      <div className="relative w-full bg-white flex flex-col shadow-[0_20px_40px_-15px_rgba(0,0,0,0.15)] z-30">
        <div className="w-full px-3 py-2 flex items-center gap-2 overflow-x-auto no-scrollbar">
          {[
            { id: 'TODAY', label: 'TODAY' },
            { id: 'WEEK', label: 'WEEK' },
            { id: 'MONTH', label: 'MONTH' },
            { id: 'SPECIAL', label: 'SPECIAL' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
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
            <div className="w-full h-11 px-4 flex items-center justify-end gap-4 border-t border-slate-50">
              <button
                onClick={() => { setShowOrganizerFilter(!showOrganizerFilter); if (!showOrganizerFilter) setShowClubFilter(false); }}
                className={`flex items-center gap-0.5 text-[12px] font-bold transition-all ${selectedOrganizer !== 'All' ? 'text-blue-600' : 'text-slate-600 hover:text-slate-800'}`}
              >
                {selectedOrganizer === 'All' ? 'Instructor' : selectedOrganizer}
                <span className={`material-symbols-outlined text-[16px] transition-transform ${showOrganizerFilter ? 'rotate-180' : ''}`}>expand_more</span>
              </button>
              <button
                onClick={() => { setShowClubFilter(!showClubFilter); if (!showClubFilter) setShowOrganizerFilter(false); }}
                className={`flex items-center gap-0.5 text-[12px] font-bold transition-all ${selectedClub !== 'All' ? 'text-blue-600' : 'text-slate-600 hover:text-slate-800'}`}
              >
                {selectedClub === 'All' ? 'Club' : selectedClub}
                <span className={`material-symbols-outlined text-[16px] transition-transform ${showClubFilter ? 'rotate-180' : ''}`}>expand_more</span>
              </button>
            </div>
            {showOrganizerFilter && (
              <div className="absolute top-full left-0 right-0 z-40 bg-white shadow-2xl border-t border-slate-100 p-4 max-h-[280px] overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex items-center justify-between mb-4 px-1">
                  <span className="text-[14px] font-black text-slate-800 uppercase tracking-tight">Filter by Instructor</span>
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
                  <span className="text-[14px] font-black text-slate-800 uppercase tracking-tight">Filter by Club</span>
                  <button onClick={() => setShowClubFilter(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-50 text-slate-400 hover:text-slate-600 active:scale-90 transition-all">
                    <span className="material-symbols-outlined text-[18px]">close</span>
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {['All', ...clubs].map(ven => (
                    <button key={ven} onClick={() => { setSelectedClub(ven); setShowClubFilter(false); }}
                      className={`px-4 py-3 rounded-2xl text-[12px] font-bold text-left transition-all border ${selectedClub === ven ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-100' : 'bg-slate-50/50 text-slate-600 border-transparent hover:bg-slate-100/80'}`}>
                      <div className="flex items-center justify-between"><span className="truncate pr-2">{ven}</span>{selectedClub === ven && <span className="material-symbols-outlined text-[14px]">check_circle</span>}</div>
                    </button>
                  ))}
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
  }, [activeTab, selectedOrganizer, selectedClub, showOrganizerFilter, showClubFilter, organizers, clubs, setSubHeader]);

  const handleClassClick = (cls: any) => {
    // Navigate to group-specific class page with class ID in query for detail
    router.push(`/class/${cls.groupId}?modal=${cls.id}`);
  };

  const handleGroupClick = (group: Group) => {
    router.push(`/class/${group.id}`);
  };

  const todayBlocks = useMemo(() => {
    if (activeTab !== 'TODAY') return [];
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toDateString();

    const classes: any[] = [];
    allClasses.forEach(cls => {
      const group = groups.find(g => g.id === cls.groupId);
      if (selectedClub !== 'All' && group?.name !== selectedClub) return;
      if (selectedOrganizer !== 'All') {
        const hasInstructor = cls.instructors?.some((i: any) => i.name === selectedOrganizer);
        if (!hasInstructor) return;
      }

      cls.schedule?.forEach((s: any) => {
        if (!s.date) return;
        let dStr = '';
        if (typeof s.date === 'string') dStr = s.date.trim();
        else if (s.date && typeof s.date.toDate === 'function') {
          const dObj = s.date.toDate();
          dStr = `${dObj.getFullYear()}-${String(dObj.getMonth() + 1).padStart(2, '0')}-${String(dObj.getDate()).padStart(2, '0')}`;
        }

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
      { label: 'Morning', time: '06:00 - 11:59', icon: 'routine', classes: [] as any[] },
      { label: 'Afternoon', time: '12:00 - 17:59', icon: 'light_mode', classes: [] as any[] },
      { label: 'Evening', time: '18:00 - 20:59', icon: 'wb_twilight', classes: [] as any[] },
      { label: 'Night', time: '21:00 -', icon: 'clear_night', classes: [] as any[] }
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
  }, [activeTab, allClasses, groups, selectedOrganizer, selectedClub]);

  const handleSaveCapacity = async () => {
    if (!editingClass) return;
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
        dailyClassPrice: tempDailyClassPrice || null
      } : c));
      setCapacityModalOpen(false);
    } catch (err) {
      console.error(err);
      alert('Failed to update capacity');
    }
  };

  const handleCheckoutClick = (cls: any) => {
    setCheckoutClass(cls);
    setCheckoutRole('leader'); // Default role
    setCheckoutModalOpen(true);
  };

  const handleCheckoutSubmit = async () => {
    if (!checkoutClass) return;
    try {
      const price = checkoutClass.amount || checkoutClass.dailyClassPrice || Math.floor((checkoutClass.price || 0) / 4) + 5000;
      const orderId = await createBooking({
        domain: checkoutClass.amount ? 'class_special' : 'class_daily',
        itemName: checkoutClass.title + (checkoutClass.amount ? ' (Special)' : ' (Daily)'),
        itemImageUrl: checkoutClass.imageUrl || checkoutClass.group?.coverImage || '',
        itemId: checkoutClass.id,
        hostId: checkoutClass.group?.ownerId || '',
        totalAmount: price,
        currency: 'KRW',
        payload: {
          role: checkoutRole,
          classDate: new Date().toISOString()
        }
      });
      return orderId;
    } catch (err: any) {
      alert(err.message || 'Booking failed');
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
                  const isInstructor = user && ((user as any).role === 'admin' || cls.instructors?.some((i: any) => i.userId === user.uid || i.name === user.displayName) || cls.group?.ownerId === user.uid);
                  
                  return (
                    <div 
                      key={cls.id} 
                      className={`relative overflow-hidden rounded-[20px] bg-white border ${isPast ? 'border-slate-100 opacity-60 grayscale-[50%]' : 'border-slate-100 shadow-sm'} transition-all`}
                    >
                      <div className="p-4 flex flex-col gap-3 cursor-pointer" onClick={() => handleClassClick(cls)}>
                        <div className="flex gap-3">
                          <div className="shrink-0 w-16 h-16 rounded-xl overflow-hidden bg-slate-100 border border-slate-100">
                            {cls.imageUrl || cls.group?.coverImage || cls.group?.logo ? (
                              <img src={cls.imageUrl || cls.group?.coverImage || cls.group?.logo} alt={cls.title} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <span className="material-symbols-outlined text-[24px] text-slate-300">school</span>
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            {isStartingSoon && (
                              <div className="inline-flex items-center gap-1 bg-red-50 text-red-600 px-1.5 py-0.5 rounded uppercase text-[9px] font-black tracking-widest mb-1 border border-red-100">
                                <span className="material-symbols-outlined text-[10px]">timer</span> Starting Soon
                              </div>
                            )}
                            <div className="flex items-start justify-between gap-2">
                              <h4 className="text-[16px] font-black text-slate-800 leading-tight mb-1 flex-1 truncate">{cls.title}</h4>
                              {isInstructor && (
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingClass(cls);
                                    setTempIsDailyBookingOpen(!!cls.isDailyBookingOpen);
                                    setTempInstructorComment(cls.instructorComment || '');
                                    setTempDailyClassPrice(cls.dailyClassPrice || Math.floor((cls.price || 0) / 4) + 5000);
                                    setCapacityModalOpen(true);
                                  }}
                                  className="shrink-0 flex items-center justify-center w-7 h-7 rounded-full bg-slate-50 text-slate-400 hover:text-slate-600 hover:bg-slate-100 border border-slate-100 transition-colors"
                                >
                                  <span className="material-symbols-outlined text-[15px]">settings</span>
                                </button>
                              )}
                            </div>
                            <p className="text-[12px] font-medium text-slate-500 truncate mb-0.5">
                              {startTimeStr}-{endTimeStr} · {cls.location || cls.group?.name}
                            </p>
                            <p className="text-[12px] font-medium text-slate-500 truncate">
                              {cls.instructors?.map((i:any)=>i.name).join(', ')}
                            </p>
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

                      {cls.isDailyBookingOpen && (
                        <div className="px-4 py-3 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between">
                          <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Daily Pass</span>
                            <span className="text-[14px] font-black text-slate-800 leading-none">
                              ₩{(cls.dailyClassPrice || Math.floor((cls.price || 0) / 4) + 5000).toLocaleString()}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleCheckoutClick(cls); }}
                              className={`flex items-center gap-1 text-[13px] font-black px-5 py-2 rounded-full shadow-sm transition-all ${isPast ? 'bg-slate-200 text-slate-500' : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md active:scale-95'}`}
                              disabled={isPast}
                            >
                              {isPast ? 'Closed' : 'Book Now'}
                            </button>
                          </div>
                        </div>
                      )}

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
          {(selectedOrganizer !== 'All' || selectedClub !== 'All') && (
            <>
              <span className="material-symbols-outlined text-[14px] text-blue-600">filter_alt</span>
              <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">
                {selectedOrganizer !== 'All' ? selectedOrganizer : ''}{selectedOrganizer !== 'All' && selectedClub !== 'All' ? ' · ' : ''}{selectedClub !== 'All' ? selectedClub : ''}
              </span>
            </>
          )}
        </div>
        
        <div className="flex items-center gap-3 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100 ml-auto">
          <button onClick={() => setWeekOffset(prev => prev - 1)} className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-slate-200 active:scale-90 transition-all text-slate-500">
            <span className="material-symbols-outlined text-[18px]">chevron_left</span>
          </button>
          <span className="text-[11px] font-black text-slate-700 uppercase tracking-widest min-w-[60px] text-center">
            {weekOffset === 0 ? 'THIS WEEK' : weekOffset === 1 ? 'NEXT WEEK' : weekOffset === -1 ? 'LAST WEEK' : `${weekOffset > 0 ? '+' : ''}${weekOffset} WEEKS`}
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
                    
                    const isInstructor = user && ((user as any).role === 'admin' || cls.instructors?.some((i: any) => i.userId === user.uid || i.name === user.displayName) || cls.group?.ownerId === user.uid);
                    
                    return (
                    <div 
                      key={`${cls.id}-${cIdx}`} 
                      className={`relative overflow-hidden rounded-[20px] bg-white border ${isPast ? 'border-slate-100 opacity-60 grayscale-[50%]' : 'border-slate-100 shadow-sm'} transition-all`}
                    >
                      <div className="p-4 flex flex-col gap-3 cursor-pointer" onClick={() => handleClassClick(cls)}>
                        <div className="flex gap-3">
                          <div className="shrink-0 w-16 h-16 rounded-xl overflow-hidden bg-slate-100 border border-slate-100">
                            {cls.imageUrl || cls.group?.coverImage || cls.group?.logo ? (
                              <img src={cls.imageUrl || cls.group?.coverImage || cls.group?.logo} alt={cls.title} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <span className="material-symbols-outlined text-[24px] text-slate-300">school</span>
                              </div>
                            )}
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
                              {isInstructor && (
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingClass(cls);
                                    setTempIsDailyBookingOpen(!!cls.isDailyBookingOpen);
                                    setTempInstructorComment(cls.instructorComment || '');
                                    setTempDailyClassPrice(cls.dailyClassPrice || Math.floor((cls.price || 0) / 4) + 5000);
                                    setCapacityModalOpen(true);
                                  }}
                                  className="shrink-0 flex items-center justify-center w-7 h-7 rounded-full bg-slate-50 text-slate-400 hover:text-slate-600 hover:bg-slate-100 border border-slate-100 transition-colors"
                                >
                                  <span className="material-symbols-outlined text-[15px]">settings</span>
                                </button>
                              )}
                            </div>
                            <p className="text-[12px] font-medium text-slate-500 truncate mb-0.5">
                              {startTimeStr}-{endTimeStr} · {cls.location || cls.group?.name}
                            </p>
                            <p className="text-[12px] font-medium text-slate-500 truncate">
                              {cls.instructors?.map((i:any)=>i.name).join(', ')}
                            </p>
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

                      {cls.isDailyBookingOpen && (
                        <div className="px-4 py-3 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between">
                          <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Daily Pass</span>
                            <span className="text-[14px] font-black text-slate-800 leading-none">
                              ₩{(cls.dailyClassPrice || Math.floor((cls.price || 0) / 4) + 5000).toLocaleString()}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleCheckoutClick(cls); }}
                              className={`flex items-center gap-1 text-[13px] font-black px-5 py-2 rounded-full shadow-sm transition-all ${isPast ? 'bg-slate-200 text-slate-500' : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md active:scale-95'}`}
                              disabled={isPast}
                            >
                              {isPast ? 'Closed' : 'Book Now'}
                            </button>
                          </div>
                        </div>
                      )}

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

  const renderMonthTab = () => (
    <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-10">
      <h3 className="text-[10px] font-black text-[#596061] mb-2 uppercase tracking-[0.2em] px-1">STUDIOS IN SEOUL</h3>
      <div className="grid grid-cols-1 gap-4">
        {filteredGroups.map((group) => (
          <div 
            key={group.id} 
            onClick={() => handleGroupClick(group)}
            className="bg-white border border-[#f2f4f4] rounded-[24px] p-4 flex items-center gap-4 shadow-sm hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="w-16 h-16 rounded-2xl overflow-hidden flex-shrink-0 bg-slate-100">
              <img 
                src={group.logo || group.coverImage || ''} 
                alt={group.name} 
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-1.5 mb-1">
                <h4 className="text-[1rem] font-black text-[#2d3435] truncate">
                  {group.name}
                  {group.name.includes('Andante') && (
                    <span className="text-[11px] font-medium text-[#acb3b4] ml-1">안단테</span>
                  )}
                </h4>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <div className="flex items-center bg-slate-50 border border-slate-100 rounded-lg px-2 py-0.5">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter mr-1.5">CLASSES</span>
                  <span className="text-[11px] font-black text-slate-700">{group.classes?.length || 0}</span>
                </div>
                <div className="flex items-center bg-blue-50 border border-blue-100 rounded-lg px-2 py-0.5">
                  <span className="text-[9px] font-black text-blue-400 uppercase tracking-tighter mr-1.5">BUNDLE</span>
                  <span className="text-[11px] font-black text-blue-700">{group.discounts?.length || 0}</span>
                </div>
                <div className="flex items-center bg-purple-50 border border-purple-100 rounded-lg px-2 py-0.5">
                  <span className="text-[9px] font-black text-purple-400 uppercase tracking-tighter mr-1.5">PASS</span>
                  <span className="text-[11px] font-black text-purple-700">{group.monthlyPasses?.length || 0}</span>
                </div>
              </div>
            </div>
            <span className="material-symbols-outlined text-[#acb3b4] group-hover:text-primary transition-colors">chevron_right</span>
          </div>
        ))}
      </div>
      {filteredGroups.length === 0 && (
        <div className="py-20 text-center">
          <p className="text-[#acb3b4] font-bold">No studios found in Seoul, Korea.</p>
        </div>
      )}
    </div>
  );

  const renderSpecialTab = () => (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {specialClasses.length > 0 ? (
        specialClasses.map((cls) => {
          const group = groups.find(g => g.id === cls.groupId);
          return (
            <div 
              key={cls.id} 
              onClick={() => handleClassClick(cls)}
              className="relative rounded-[32px] overflow-hidden bg-[#2d3435] text-white shadow-2xl cursor-pointer group"
            >
              <div className="absolute inset-0">
                <img src={cls.imageUrl || group?.coverImage || ''} alt={cls.title} className="w-full h-full object-cover opacity-60" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#2d3435] via-[#2d3435]/40 to-transparent" />
              </div>
              <div className="relative p-8 pt-24">
                <div className="inline-flex items-center gap-2 bg-primary px-4 py-1.5 rounded-full mb-4 shadow-lg shadow-primary/30">
                  <span className="material-symbols-outlined text-sm">stars</span>
                  <span className="text-[10px] font-black tracking-widest uppercase">SPECIAL EVENT</span>
                </div>
                <h3 className="text-2xl font-black mb-4 leading-tight">{cls.title}</h3>
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-6 h-6 rounded-full overflow-hidden border border-white/20">
                    <img src={group?.logo || group?.coverImage || ''} alt="" className="w-full h-full object-cover" />
                  </div>
                  <span className="text-xs font-bold text-white/80">{group?.name}</span>
                </div>
                <div className="flex items-end justify-between">
                  <div className="flex flex-col gap-1">
                    <p className="text-white/60 text-[10px] font-black tracking-widest uppercase">REGISTRATION FEE</p>
                    <p className="text-2xl font-black">{cls.amount?.toLocaleString()} <span className="text-sm">{cls.currency || 'KRW'}</span></p>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleCheckoutClick({ ...cls, group }); }}
                    className="bg-white text-[#2d3435] px-8 py-3.5 rounded-full text-sm font-black shadow-xl active:scale-95 transition-all"
                  >
                    RESERVE
                  </button>
                </div>
              </div>
            </div>
          );
        })
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
      {capacityModalOpen && editingClass && (
        <Portal>
          <div className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
            <div className="w-full max-w-md bg-white rounded-t-[32px] sm:rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] p-6">
              <div className="flex justify-between items-center mb-6 shrink-0">
                <h3 className="text-[18px] font-black text-slate-800">Set Today's Capacity</h3>
                <button onClick={() => setCapacityModalOpen(false)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>
              
              <p className="text-[13px] font-medium text-slate-500 mb-6 shrink-0 line-clamp-2">{editingClass.title}</p>
              
              <div className="space-y-4 mb-4 overflow-y-auto no-scrollbar flex-1 -mx-2 px-2 pb-2">
                <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-[14px] font-black text-slate-800 uppercase">Daily Booking</span>
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
                        <span className="text-[14px] font-black text-amber-800 uppercase">Instructor Comment</span>
                        <span className="text-[11px] font-bold text-amber-600">{tempInstructorComment.length}/30</span>
                      </div>
                      <input
                        type="text"
                        maxLength={30}
                        value={tempInstructorComment}
                        onChange={(e) => setTempInstructorComment(e.target.value)}
                        placeholder="e.g. Please bring comfortable shoes!"
                        className="w-full bg-white border border-amber-200 rounded-xl px-4 py-3 text-[13px] font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                      />
                    </div>

                    <div className="flex flex-col gap-2 p-4 rounded-2xl bg-emerald-50 border border-emerald-100">
                      <div className="flex items-center justify-between">
                        <span className="text-[14px] font-black text-emerald-800 uppercase">Daily Class Price</span>
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
              
              <div className="flex gap-3 shrink-0 pt-4 border-t border-slate-100 mt-auto">
                <button onClick={() => { setTempIsDailyBookingOpen(false); setTempInstructorComment(''); }} className="flex-1 py-4 text-[14px] font-bold text-slate-500 bg-slate-100 rounded-2xl hover:bg-slate-200 transition-all">Clear</button>
                <button onClick={handleSaveCapacity} className="flex-[2] py-4 text-[14px] font-black text-white bg-blue-600 rounded-2xl shadow-xl shadow-blue-600/20 active:scale-95 transition-all">Save Changes</button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* Checkout Modal */}
      {checkoutClass && (
        <UnifiedCheckoutModal
          isOpen={checkoutModalOpen}
          onClose={() => setCheckoutModalOpen(false)}
          title={checkoutClass.amount ? "Special Class Booking" : "Daily Class Booking"}
          subtitle={`${checkoutClass.title} · ${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}`}
          totalAmount={checkoutClass.amount || checkoutClass.dailyClassPrice || Math.floor((checkoutClass.price || 0) / 4) + 5000}
          onCheckout={handleCheckoutSubmit}
          isProcessing={isBooking}
          buttonText="Submit Request"
          bankDetails={{
            bankName: checkoutClass.group?.bankName || 'Kookmin Bank',
            accountHolder: checkoutClass.group?.accountHolder || checkoutClass.group?.name || 'World of Community',
            accountNumber: checkoutClass.group?.accountNumber || '123456-00-123456'
          }}
          onReportPayment={reportPayment}
        >
          <div className="space-y-6 py-2">
            <div className="flex gap-3 p-3 bg-neutral-50 dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700">
              <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-neutral-200 dark:bg-neutral-700">
                {(checkoutClass.imageUrl || checkoutClass.group?.coverImage || checkoutClass.group?.logo) ? (
                  <img src={checkoutClass.imageUrl || checkoutClass.group?.coverImage || checkoutClass.group?.logo} alt={checkoutClass.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="material-symbols-outlined text-[24px] text-neutral-400">school</span>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold text-neutral-500 uppercase">{checkoutClass.group?.name || 'World of Community'}</p>
                <p className="text-sm font-bold text-neutral-900 dark:text-white truncate">{checkoutClass.title}</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  <span className="text-[10px] bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300 px-2 py-0.5 rounded-full font-bold">
                    {(checkoutClass.scheduleEntry?.timeSlot?.split(/[-~]/)[0] || checkoutClass.startTime || '00:00').trim()}-{(checkoutClass.scheduleEntry?.timeSlot?.split(/[-~]/)[1] || checkoutClass.endTime || '00:00').trim()}
                  </span>
                  <span className="text-[10px] bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300 px-2 py-0.5 rounded-full font-bold">
                    {checkoutClass.location || checkoutClass.group?.name}
                  </span>
                  {checkoutClass.instructors?.length > 0 && (
                    <span className="text-[10px] bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300 px-2 py-0.5 rounded-full font-bold">
                      {checkoutClass.instructors.map((i:any)=>i.name).join(', ')}
                    </span>
                  )}
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
