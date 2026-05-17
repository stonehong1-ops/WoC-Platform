import React, { useState, useEffect, useMemo } from 'react';
import { Group } from '@/types/group';
import { classRegistrationService } from '@/lib/firebase/classRegistrationService';
import { chatService } from '@/lib/firebase/chatService';
import { useAuth } from '@/components/providers/AuthProvider';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/clientApp';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';

interface GroupClassDashboardProps {
  group: Group;
  onApplyClick: () => void;
}

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

  const [registrations, setRegistrations] = useState<any[]>([]);
  const [ownerInfo, setOwnerInfo] = useState<any>(null);

  const currentMonthStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
  const displayMonth = `${currentDate.toLocaleString('default', { month: 'long' })} ${currentDate.getFullYear()}`;

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

  useEffect(() => {
    if (!group?.id) return;
    const unsubscribe = classRegistrationService.subscribeToGroupRegistrations(group.id, (data) => {
      setRegistrations(data);
    });
    return () => unsubscribe();
  }, [group?.id]);

  const monthClasses = useMemo(() => group.classes?.filter(c => !c.targetMonth || c.targetMonth === currentMonthStr) || [], [group.classes, currentMonthStr]);
  const monthPasses = useMemo(() => group.monthlyPasses?.filter(p => !p.targetMonth || p.targetMonth === currentMonthStr) || [], [group.monthlyPasses, currentMonthStr]);
  const monthBundles = useMemo(() => group.discounts?.filter(d => !d.targetMonth || d.targetMonth === currentMonthStr) || [], [group.discounts, currentMonthStr]);

  const validIds = useMemo(() => new Set([
    ...monthClasses.map(c => c.id),
    ...monthPasses.map(p => p.id),
    ...monthBundles.map(d => d.id)
  ]), [monthClasses, monthPasses, monthBundles]);

  const currentMonthRegs = useMemo(() => registrations.filter(r => validIds.has(r.classId)), [registrations, validIds]);

  const { applicants, leaders, followers, stats } = useMemo(() => {
    const applicantMap = new Map();
    let passes = 0, bundles = 0, classes = 0;

    currentMonthRegs.forEach(reg => {
      if (monthPasses.some(p => p.id === reg.classId)) passes++;
      else if (monthBundles.some(d => d.id === reg.classId)) bundles++;
      else classes++;

      const key = reg.userId || `${reg.applicantName}-${reg.contactNumber}`;
      if (!applicantMap.has(key)) {
        applicantMap.set(key, {
          userId: reg.userId,
          name: reg.applicantName || 'Anonymous',
          avatar: reg.userAvatar,
          role: reg.role?.toLowerCase() || 'follower'
        });
      }
    });

    const apps = Array.from(applicantMap.values());
    return {
      applicants: apps,
      leaders: apps.filter(a => a.role === 'leader'),
      followers: apps.filter(a => a.role === 'follower'),
      stats: { passes, bundles, classes }
    };
  }, [currentMonthRegs, monthPasses, monthBundles]);

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

  const hasApplied = useMemo(() => {
    if (!user) return false;
    return currentMonthRegs.some(r => r.userId === user.uid);
  }, [currentMonthRegs, user]);

  return (
    <div className="flex flex-col gap-6 p-4 w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Month Navigation */}
      <div className="flex items-center justify-between bg-surface-container-lowest rounded-2xl p-4 shadow-sm border border-outline/10">
        <button onClick={handlePrevMonth} className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-variant text-on-surface hover:bg-outline/20 active:scale-95 transition-all">
          <span className="material-symbols-outlined text-[20px]">chevron_left</span>
        </button>
        <div className="flex flex-col items-center">
          <span className="text-[12px] font-black text-primary tracking-widest uppercase">SCHEDULE</span>
          <h2 className="text-[20px] font-black text-on-surface">{displayMonth}</h2>
        </div>
        <button onClick={handleNextMonth} className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-variant text-on-surface hover:bg-outline/20 active:scale-95 transition-all">
          <span className="material-symbols-outlined text-[20px]">chevron_right</span>
        </button>
      </div>

      {/* Class Statistics */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-gradient-to-br from-tertiary-container to-tertiary/20 p-4 rounded-2xl flex flex-col items-center justify-center shadow-sm">
          <span className="text-[10px] font-black text-on-tertiary-container uppercase tracking-widest mb-1">Pass</span>
          <span className="text-[24px] font-black text-tertiary">{stats.passes}</span>
        </div>
        <div className="bg-gradient-to-br from-secondary-container to-secondary/20 p-4 rounded-2xl flex flex-col items-center justify-center shadow-sm">
          <span className="text-[10px] font-black text-on-secondary-container uppercase tracking-widest mb-1">Bundle</span>
          <span className="text-[24px] font-black text-secondary">{stats.bundles}</span>
        </div>
        <div className="bg-gradient-to-br from-primary-container to-primary/20 p-4 rounded-2xl flex flex-col items-center justify-center shadow-sm">
          <span className="text-[10px] font-black text-on-primary-container uppercase tracking-widest mb-1">Class</span>
          <span className="text-[24px] font-black text-primary">{stats.classes}</span>
        </div>
      </div>

      {/* Applicant Overview */}
      <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm border border-outline/10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[16px] font-black text-on-surface">Registered Members</h3>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-[12px] font-bold text-on-surface-variant">
              <span className="w-2 h-2 rounded-full bg-primary"></span>
              {leaders.length} Leaders
            </div>
            <div className="flex items-center gap-1.5 text-[12px] font-bold text-on-surface-variant">
              <span className="w-2 h-2 rounded-full bg-secondary"></span>
              {followers.length} Followers
            </div>
          </div>
        </div>

        {applicants.length > 0 ? (
          <div className="flex items-center gap-3 group relative cursor-pointer" title={applicants.map(a => a.name).join(', ')}>
            <div className="relative">
              {applicants[0].avatar ? (
                <img src={applicants[0].avatar} alt={applicants[0].name} className={`w-14 h-14 rounded-full border-4 border-white object-cover shadow-sm ${applicants[0].role === 'leader' ? 'ring-2 ring-primary' : 'ring-2 ring-secondary'}`} />
              ) : (
                <div className={`w-14 h-14 rounded-full border-4 border-white shadow-sm flex items-center justify-center text-white font-bold text-lg ${applicants[0].role === 'leader' ? 'bg-primary ring-2 ring-primary' : 'bg-secondary ring-2 ring-secondary'}`}>
                  {applicants[0].name.substring(0,2).toUpperCase()}
                </div>
              )}
            </div>
            <div className="flex flex-col">
              <span className="text-[14px] font-bold text-on-surface">{applicants[0].name}</span>
              {applicants.length > 1 && (
                <span className="text-[12px] font-medium text-on-surface-variant">and {applicants.length - 1} others</span>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-6 text-outline">
            <span className="material-symbols-outlined text-[32px] mb-2">group_off</span>
            <span className="text-[13px] font-medium">No registrations yet.</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3 mt-2">
        <button 
          onClick={handleChatWithOwner}
          className="flex-1 bg-surface-variant text-on-surface rounded-2xl py-4 flex flex-col items-center justify-center gap-1 active:scale-95 transition-all shadow-sm"
        >
          <span className="material-symbols-outlined text-[24px]">chat</span>
          <span className="text-[13px] font-black tracking-wide">Consultation</span>
        </button>
        
        <button 
          onClick={onApplyClick}
          className="flex-[2] bg-primary text-white rounded-2xl py-4 flex flex-col items-center justify-center gap-1 active:scale-95 transition-all shadow-lg shadow-primary/30 relative overflow-hidden group"
        >
          <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out skew-x-12"></div>
          <span className="material-symbols-outlined text-[24px]">{hasApplied ? 'edit_document' : 'how_to_reg'}</span>
          <span className="text-[15px] font-black tracking-wide">{hasApplied ? 'Modify Application' : 'Register Class'}</span>
        </button>
      </div>

    </div>
  );
}
