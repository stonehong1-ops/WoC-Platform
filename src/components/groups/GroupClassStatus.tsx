'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Group, GroupClass, ClassDiscount } from '@/types/group';
import { groupService } from '@/lib/firebase/groupService';
import { classRegistrationService } from '@/lib/firebase/classRegistrationService';
import { useAuth } from '@/components/providers/AuthProvider';
import { db } from '@/lib/firebase/clientApp';
import { collection, query, where, onSnapshot, doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import ImageWithFallback from '@/components/common/ImageWithFallback';
import { useLanguage } from '@/contexts/LanguageContext';

interface GroupClassStatusProps {
  groupId: string;
  isAdmin?: boolean;
  group: Group;
  onClose?: () => void;
}

const DAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const CURRENCY_SYMBOL: Record<string, string> = { KRW: '₩', USD: '$', EUR: '€', ARS: '$', CLP: '$' };
const getCurr = (c: string) => CURRENCY_SYMBOL[c] || c + ' ';

export default function GroupClassStatus({ groupId, isAdmin = false, group: initialGroup, onClose }: GroupClassStatusProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [group, setGroup] = useState<Group>(initialGroup);
  const [notice, setNotice] = useState('');
  const [isEditingNotice, setIsEditingNotice] = useState(false);
  const [bookings, setBookings] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<Record<string, any>>({});
  const [showParticipants, setShowParticipants] = useState(false);
  const [loading, setLoading] = useState(true);

  // Real-time data from subcollections
  const [subClasses, setSubClasses] = useState<GroupClass[]>([]);
  const [subDiscounts, setSubDiscounts] = useState<ClassDiscount[]>([]);

  const [baseDate, setBaseDate] = useState(() => {
    const d = new Date();
    if (d.getDate() >= 20) d.setMonth(d.getMonth() + 1);
    return d;
  });

  const currentMonthStr = `${baseDate.getFullYear()}-${String(baseDate.getMonth() + 1).padStart(2, '0')}`;
  const monthDisplay = `${baseDate.getFullYear()}.${String(baseDate.getMonth() + 1).padStart(2, '0')}`;

  const handlePrevMonth = () => setBaseDate(prev => { const d = new Date(prev); d.setMonth(d.getMonth() - 1); return d; });
  const handleNextMonth = () => setBaseDate(prev => { const d = new Date(prev); d.setMonth(d.getMonth() + 1); return d; });

  // Subscribe group
  useEffect(() => {
    return groupService.subscribeGroup(groupId, (g) => { if (g) setGroup(g); });
  }, [groupId]);

  // Subscribe notice
  useEffect(() => {
    const ref = doc(db, 'groups', groupId, 'classNotices', currentMonthStr);
    const unsub = onSnapshot(ref, (snap) => setNotice(snap.exists() ? snap.data().content || '' : ''));
    return () => unsub();
  }, [groupId, currentMonthStr]);

  // Subscribe subcollections
  useEffect(() => {
    const unsubClasses = groupService.subscribeClasses(groupId, setSubClasses);
    const unsubDiscounts = groupService.subscribeDiscounts(groupId, setSubDiscounts);
    return () => {
      unsubClasses();
      unsubDiscounts();
    };
  }, [groupId]);

  // Subscribe registrations
  useEffect(() => {
    setLoading(true);
    return classRegistrationService.subscribeToGroupRegistrations(groupId, (data) => {
      setBookings(data);
      setLoading(false);
    });
  }, [groupId]);

  // Data
  const allClasses = useMemo(() => [...subClasses, ...(group.classes || []).filter(c => !subClasses.find(sc => sc.id === c.id))], [subClasses, group.classes]);
  const allDiscounts = useMemo(() => [...subDiscounts, ...(group.discounts || []).filter(d => !subDiscounts.find(sd => sd.id === d.id))], [subDiscounts, group.discounts]);

  const filteredClasses = useMemo(() => {
    return allClasses.filter(c => {
      if (c.targetMonth) return c.targetMonth === currentMonthStr;
      if (c.schedule?.length) return c.schedule.some(s => s.date?.startsWith(currentMonthStr));
      return false; // If no targetMonth and no schedule, hide it to prevent cross-month pollution
    });
  }, [allClasses, currentMonthStr]);

  const bundles = useMemo(() => {
    return allDiscounts.filter(d => {
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
    });
  }, [allDiscounts, allClasses, currentMonthStr]);

  // Stats
  const stats = useMemo(() => {
    const validClassIds = [
      ...filteredClasses.map(c => c.id),
      ...bundles.map(b => b.id)
    ];
    
    const monthlyRegs = bookings.filter(r => validClassIds.includes(r.classId));
    
    let leaders = 0, followers = 0;
    const list: any[] = [];
    const uniqueUsers = new Map();

    monthlyRegs.forEach(reg => {
      const key = reg.userId || `${reg.applicantName}-${reg.contactNumber}`;
      if (!uniqueUsers.has(key)) {
         uniqueUsers.set(key, {
           uid: reg.userId,
           name: reg.applicantName || 'Unknown',
           role: reg.role || 'Leader',
           avatar: reg.userAvatar || null,
           items: []
         });
      }
      uniqueUsers.get(key).items.push(reg);
    });

    uniqueUsers.forEach(user => {
       if (user.role === 'Follower') followers++; else leaders++;
       list.push(user);
    });

    return { total: uniqueUsers.size, leaders, followers, list };
  }, [bookings, filteredClasses, bundles]);





  const handleSaveNotice = async () => {
    try {
      await setDoc(doc(db, 'groups', groupId, 'classNotices', currentMonthStr), { content: notice, updatedAt: Timestamp.now(), updatedBy: user?.uid });
      setIsEditingNotice(false);
      toast.success(t('toast.class.notice_updated'));
    } catch { toast.error(t('toast.class.notice_update_failed')); }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
      className="w-full flex flex-col font-['Inter'] antialiased text-[#242c51] pb-20">

      {/* Header & Navigation */}
      <header className="flex items-center justify-between mb-2 px-1">
        <h1 className="font-['Plus_Jakarta_Sans'] font-extrabold text-2xl text-[#242c51] tracking-tight">{t('group.class.title')}</h1>
        <div className="flex items-center gap-1 bg-white rounded-full p-1 shadow-sm border border-slate-200">
          <button onClick={handlePrevMonth} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100 transition-colors text-slate-500">
            <span className="material-symbols-outlined text-[20px]">chevron_left</span>
          </button>
          <span className="text-[13px] font-bold text-[#242c51] w-16 text-center tracking-wide">{monthDisplay}</span>
          <button onClick={handleNextMonth} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100 transition-colors text-slate-500">
            <span className="material-symbols-outlined text-[20px]">chevron_right</span>
          </button>
        </div>
      </header>

      <main className="w-full space-y-5 flex-1">

        {/* ── NOTICE ── */}
        <section className="bg-white border border-[#a3abd7]/10 rounded-xl p-5 shadow-sm relative overflow-hidden">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-slate-50 flex items-center justify-center shrink-0 mt-0.5">
              <span className="material-symbols-outlined text-slate-400 text-[20px]">campaign</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{t('group.class.notice')} · {monthDisplay}</p>
                {isAdmin && !isEditingNotice && (
                  <button onClick={() => setIsEditingNotice(true)} className="text-[10px] font-bold text-slate-400 hover:text-slate-600 transition-colors uppercase tracking-wider">{t('group.class.edit')}</button>
                )}
              </div>
              {isAdmin && isEditingNotice ? (
                <div className="space-y-3">
                  <textarea value={notice} onChange={(e) => setNotice(e.target.value.slice(0, 200))}
                    className="w-full bg-white border border-slate-200 rounded-lg p-3 text-sm font-medium focus:outline-none focus:border-[#0057bd]/30 resize-none h-24 text-[#242c51] placeholder:text-slate-300"
                    placeholder={t('group.class.enterNotice')} />
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setIsEditingNotice(false)} className="px-4 py-1.5 text-xs font-bold text-slate-400">{t('group.class.cancel')}</button>
                    <button onClick={handleSaveNotice} className="px-5 py-1.5 bg-[#0057bd] text-white text-xs font-bold rounded-lg">{t('group.class.save')}</button>
                  </div>
                </div>
              ) : (
                <p className={`text-sm font-medium leading-relaxed ${notice ? 'text-[#242c51]' : 'text-slate-400 italic'}`}>
                  {notice || t('group.class.noNotice')}
                </p>
              )}
            </div>
          </div>
        </section>

        {/* ── PARTICIPANTS BUTTON ── */}
        <button onClick={() => setShowParticipants(true)}
          className="w-full bg-white rounded-xl p-4 shadow-sm border border-[#a3abd7]/10 flex items-center gap-4 active:scale-[0.99] transition-transform">
          <div className="w-11 h-11 rounded-lg bg-[#0057bd]/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-[#0057bd] text-[22px]">groups</span>
          </div>
          <div className="flex-1 text-left">
            <p className="font-['Plus_Jakarta_Sans'] font-extrabold text-base text-[#242c51]">{t('group.class.participants')}</p>
            <p className="text-xs font-medium text-slate-400 mt-0.5">
              {t('group.class.leader')} <span className="font-bold text-[#0057bd]">{stats.leaders}</span>
              <span className="mx-2 text-slate-200">|</span>
              {t('group.class.follower')} <span className="font-bold text-[#e84393]">{stats.followers}</span>
              <span className="mx-2 text-slate-200">|</span>
              {t('group.class.total')} <span className="font-bold text-slate-600">{stats.total}</span>
            </p>
          </div>
          <span className="material-symbols-outlined text-slate-300 text-[20px]">chevron_right</span>
        </button>

        {/* ── REGISTER FOR CLASS BUTTON ── */}
        <button onClick={() => router.push(`/class/${groupId}?month=${currentMonthStr}`)}
          className="w-full bg-gradient-to-r from-[#0057bd] to-[#3a7bd5] rounded-xl p-4 shadow-lg shadow-[#0057bd]/20 border border-transparent flex items-center justify-center gap-3 active:scale-[0.99] transition-all hover:shadow-[#0057bd]/30">
          <span className="material-symbols-outlined text-white text-[24px]">edit_calendar</span>
          <span className="font-['Plus_Jakarta_Sans'] font-extrabold text-lg text-white tracking-wide">{t('group.class.register')}</span>
        </button>
      </main>

      {/* ── PARTICIPANTS FULLSCREEN ── */}
      <AnimatePresence>
        {showParticipants && (
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}
            className="fixed inset-0 z-[200] bg-[#F1F5F9] flex flex-col overflow-y-auto no-scrollbar">
            <header className="sticky top-0 z-50 bg-slate-50/95 backdrop-blur-sm border-b border-slate-200">
              <div className="max-w-3xl mx-auto flex items-center px-4 h-14">
                <button onClick={() => setShowParticipants(false)} className="w-10 h-10 rounded-full flex items-center justify-center text-[#0057bd] hover:bg-[#0057bd]/5 transition-all mr-2">
                  <span className="material-symbols-outlined text-[#0057bd]">arrow_back</span>
                </button>
                <h1 className="font-['Plus_Jakarta_Sans'] font-extrabold text-lg text-[#242c51]">{t('group.class.participants')}</h1>
                <div className="ml-auto">
                  <span className="text-xs font-bold text-slate-400">{stats.total} {t('group.class.total')}</span>
                </div>
              </div>
            </header>
            <div className="max-w-3xl w-full mx-auto px-4 py-6 space-y-4">
              {/* Summary */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white rounded-xl p-4 shadow-sm border border-[#a3abd7]/10 text-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{t('group.class.leader')}</p>
                  <p className="font-['Plus_Jakarta_Sans'] font-extrabold text-3xl text-[#0057bd]">{stats.leaders}</p>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm border border-[#a3abd7]/10 text-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{t('group.class.follower')}</p>
                  <p className="font-['Plus_Jakarta_Sans'] font-extrabold text-3xl text-[#e84393]">{stats.followers}</p>
                </div>
              </div>
              {/* List */}
              <section className="space-y-2">
                {stats.list.length > 0 ? stats.list.map((person, idx) => (
                  <div key={person.uid || idx} className="bg-white rounded-xl px-4 py-4 shadow-sm border border-[#a3abd7]/10 flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-slate-300 w-6 text-center">{idx + 1}</span>
                      <div className={`w-10 h-10 rounded-full overflow-hidden border-2 shrink-0 ${person.role === 'Follower' ? 'border-[#e84393]' : 'border-[#0057bd]'}`}>
                        {person.avatar ? (
                          <img src={person.avatar} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                            <span className="material-symbols-outlined text-[18px] text-slate-300">person</span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col">
                        <p className="font-['Plus_Jakarta_Sans'] font-bold text-sm text-[#242c51] truncate">{person.name}</p>
                        <p className="text-[10px] font-bold text-slate-400 truncate mt-0.5">{person.items[0]?.contactNumber || t('group.class.noContact')}</p>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${person.role === 'Follower' ? 'text-[#e84393] bg-[#e84393]/10' : 'text-[#0057bd] bg-[#0057bd]/10'}`}>
                        {person.role}
                      </span>
                    </div>
                    {/* Item Details */}
                    <div className="ml-10 pl-2 border-l-2 border-slate-100 space-y-2">
                      {person.items.map((item: any) => (
                        <div key={item.id} className="bg-slate-50 rounded-lg p-2 flex flex-col gap-1">
                           <div className="flex items-center justify-between">
                             <span className="text-xs font-bold text-[#242c51]">{item.classTitle}</span>
                             <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                               item.status === 'PAYMENT_COMPLETED' ? 'bg-emerald-100 text-emerald-700' :
                               item.status === 'PAYMENT_REPORTED' ? 'bg-[#0057bd]/10 text-[#0057bd]' :
                               'bg-slate-200 text-slate-500'
                             }`}>
                               {item.status === 'PAYMENT_COMPLETED' ? t('group.class.paid') : item.status === 'PAYMENT_REPORTED' ? t('group.class.reported') : t('group.class.pending')}
                             </span>
                           </div>
                           <div className="flex justify-between items-center text-[10px] text-slate-400 font-medium">
                             <span>{item.appliedAt?.toDate ? new Date(item.appliedAt.toDate()).toLocaleDateString() : ''}</span>
                             {item.paymentAmount ? <span>₩{item.paymentAmount.toLocaleString()}</span> : <span />}
                           </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )) : (
                  <div className="py-12 text-center">
                    <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">groups</span>
                    <p className="text-slate-500 font-medium text-sm">{t('group.class.noParticipants')}</p>
                  </div>
                )}
              </section>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}
