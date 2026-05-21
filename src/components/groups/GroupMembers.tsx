"use client";

import { useLanguage } from '@/contexts/LanguageContext';
import React, { useState, useEffect } from 'react';
import { Member } from '@/types/group';
import { UserProfile } from '@/types/user';
import UserBadge from '@/components/common/UserBadge';
import { useAuth } from '@/components/providers/AuthProvider';

interface MemberWithProfile extends Member {
  profile?: UserProfile | null;
  nickname?: string;
}

interface GroupMembersProps {
  members: Member[];
  memberCount: number;
  onMemberClick?: (member: Member) => void;
  onClose: () => void;
}

export default function GroupMembers({ members, memberCount, onMemberClick, onClose }: GroupMembersProps) {
  const { t, formatDate, formatRelativeTime } = useLanguage();
  const [activeSubTab, setActiveSubTab] = useState('Member');
  const [membersWithProfiles, setMembersWithProfiles] = useState<MemberWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const { user, profile } = useAuth();

  const isViewerAdmin = React.useMemo(() => {
    if (!user) return false;
    if (profile?.isAdmin || profile?.systemRole === 'admin') return true;
    const me = members.find(m => m.id === user.uid);
    return me?.role === 'owner' || me?.role === 'admin';
  }, [user, profile, members]);
  
  // Pagination & Sorting State
  const [pageSize, setPageSize] = useState(20);
  const [sortBy, setSortBy] = useState<'joinedAt' | 'lastVisitedAt'>('joinedAt');

  // Fetch all members with profiles
  useEffect(() => {
    let isMounted = true;
    const fetchProfiles = async () => {
      setLoading(true);
      const withProfiles = await Promise.all(members.map(async (member) => {
        try {
          const { userService } = await import('@/lib/firebase/userService');
          const userProfile = await userService.getUserById(member.id);
          return {
            ...member,
            profile: userProfile
          };
        } catch (error) {
          console.error(`Failed to fetch profile for user ${member.id}:`, error);
          return { ...member, profile: null };
        }
      }));
      if (isMounted) {
        setMembersWithProfiles(withProfiles);
        setLoading(false);
      }
    };
    fetchProfiles();
    return () => { isMounted = false; };
  }, [members]);

  const getMillis = (date: any): number => {
    if (!date) return 0;
    if (typeof date === 'number') return date;
    if (typeof date.toMillis === 'function') return date.toMillis();
    if (typeof date.toDate === 'function') return date.toDate().getTime();
    if (date instanceof Date) return date.getTime();
    if (typeof date.seconds === 'number') {
      return date.seconds * 1000 + Math.floor((date.nanoseconds || 0) / 1000000);
    }
    const d = new Date(date);
    return isNaN(d.getTime()) ? 0 : d.getTime();
  };

  const filteredMembers = membersWithProfiles.filter(member => {
    const profile = member.profile;
    const nickname = profile?.nickname || member.name || member.nickname || '';
    const email = profile?.email || '';
    
    const nameMatch = nickname.toLowerCase().includes(searchQuery.toLowerCase()) || 
                      email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      member.id.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!nameMatch) return false;

    // Determine roles for filtering
    const isAdmin = member.role === 'owner' || profile?.systemRole === 'admin' || profile?.isAdmin;
    const isInstructor = member.role === 'instructor' || profile?.isInstructor;
    const isStaff = member.role === 'staff' || member.role === 'moderator' || profile?.isStaff || profile?.systemRole === 'staff' || 
                    profile?.isDj || profile?.isStayHost || profile?.isServiceProvider;
    
    if (activeSubTab === 'Owner') return isAdmin && member.status === 'active';
    if (activeSubTab === 'Staff') return isStaff && !isAdmin && !isInstructor && member.status === 'active';
    if (activeSubTab === 'Instructor') return isInstructor && !isAdmin && member.status === 'active';
    // Member 탭 = Owner/Staff 포함 전체 active 멤버 표시
    if (activeSubTab === 'Member') return member.status === 'active';
    
    return member.status === 'active';
  }).sort((a, b) => {
    if (sortBy === 'joinedAt') {
      return getMillis(b.joinedAt) - getMillis(a.joinedAt);
    } else if (sortBy === 'lastVisitedAt') {
      const dateA = getMillis(a.profile?.lastVisitedAt);
      const dateB = getMillis(b.profile?.lastVisitedAt);
      return dateB - dateA;
    }
    return 0;
  });

  const currentItems = filteredMembers.slice(0, pageSize);

  const loadMore = () => {
    setPageSize(prev => prev + 20);
  };

  const getLastVisitText = (member: MemberWithProfile) => {
    const lastVisitMillis = getMillis(member.profile?.lastVisitedAt);
    if (!lastVisitMillis) return '-';
    try {
      return formatRelativeTime(lastVisitMillis);
    } catch {
      return '-';
    }
  };

  const renderMemberCard = (member: MemberWithProfile) => {
    const isEnglish = (str: string) => /^[a-zA-Z0-9\s._-]+$/.test(str);
    let primaryNickname = member.profile?.nickname || member.name || member.nickname || 'Unknown';
    let secondaryNickname = member.profile?.nativeNickname || '';
    if (primaryNickname && !isEnglish(primaryNickname)) {
      if (!secondaryNickname) secondaryNickname = primaryNickname;
      primaryNickname = member.id.substring(0, 8); 
    }

    const user = {
      id: member.id,
      nickname: primaryNickname,
      nativeNickname: secondaryNickname,
      photoURL: member.profile?.photoURL || member.photoURL || member.avatar,
      danceRole: member.profile?.role,
      groupRole: member.role,
      gender: member.profile?.gender,
      isAdmin: member.profile?.isAdmin || member.profile?.systemRole === 'admin' || member.role === 'owner',
      isStaff: member.profile?.isStaff || member.profile?.systemRole === 'staff',
      isInstructor: member.profile?.isInstructor,
    };

    let effectiveRole = user.danceRole?.toLowerCase();
    if (!effectiveRole && user.gender) {
      if (user.gender === 'male') effectiveRole = 'leader';
      if (user.gender === 'female' || user.gender === 'others') effectiveRole = 'follower';
    }

    const isLeader = effectiveRole === 'leader';
    const isFollower = effectiveRole === 'follower';

    return (
      <div 
        key={member.id} 
        onClick={() => onMemberClick?.(member)}
        className={`bg-white p-4 rounded-xl shadow-[0_4px_20px_-4px_rgba(36,44,81,0.08)] border border-white hover:shadow-md transition-shadow ${onMemberClick ? 'cursor-pointer active:scale-[0.98]' : ''}`}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex flex-col gap-2">
            <UserBadge
              uid={user.id}
              nickname={user.nickname}
              nativeNickname={user.nativeNickname}
              photoURL={user.photoURL}
              avatarSize="w-14 h-14"
              nameClassName="font-bold text-[#242c51] leading-tight"
              nativeClassName="text-[11px] text-[#515981] font-medium ml-1.5"
            />
            <div className="flex items-center gap-1.5 flex-wrap">
              {user.isAdmin && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-red-100 text-red-700">
                  {t('group.members.role.owner')}
                </span>
              )}
              {user.isStaff && !user.isAdmin && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-100 text-blue-700">
                  {t('group.members.role.staff')}
                </span>
              )}
              {user.isInstructor && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-purple-100 text-purple-700">
                  {t('group.members.role.instructor')}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[#e4e7ff]">
          {isViewerAdmin && (
            <>
              <div>
                <p className="text-[10px] uppercase font-bold text-[#6c759e] tracking-wider mb-0.5">{t('group.members.joinDate')}</p>
                <p className="text-sm font-medium">{member.joinedAt ? formatDate(getMillis(member.joinedAt), 'dateOnly') : '-'}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-[#6c759e] tracking-wider mb-0.5">{t('group.members.lastVisit')}</p>
                <p className="text-sm font-medium">{getLastVisitText(member)}</p>
              </div>
            </>
          )}
          <div className="col-span-2">
            <p className="text-[10px] uppercase font-bold text-[#6c759e] tracking-wider mb-1">{t('group.members.danceRole')}</p>
            <div className="flex items-center gap-2">
              <span className={`text-xl font-extrabold ${isLeader ? 'text-[#0057bd]' : isFollower ? 'text-[#893c92]' : 'text-[#515981]'}`}>
                {effectiveRole ? effectiveRole.charAt(0).toUpperCase() + effectiveRole.slice(1) : t('group.members.notSet')}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-[600px] mx-auto w-full space-y-4 pb-24 px-4 pt-3 bg-background min-h-screen">
      {/* Sub-navigation Tabs */}
      <div className="w-full overflow-x-auto scrollbar-hide pb-2 -mb-2">
        <nav className="flex items-center gap-1 bg-[#e4e7ff] p-1 rounded-xl w-max shadow-sm">
          {['Owner', 'Staff', 'Instructor', 'Member'].map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveSubTab(tab);
                setPageSize(20);
              }}
              className={`px-6 py-2.5 text-sm font-semibold transition-colors rounded-lg ${activeSubTab === tab
                  ? "bg-white text-[#0057bd] shadow-sm"
                  : "text-[#515981] hover:text-[#242c51]"
                }`}
            >
              {t(`group.members.role.${tab.toLowerCase()}`)}
            </button>
          ))}
        </nav>
      </div>

      {/* Header and Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative w-full md:w-72">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#a3abd7]">search</span>
          <input
            type="text"
            placeholder={t('group.members.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-10 py-2.5 rounded-xl bg-white border border-[#e4e7ff] text-[#242c51] placeholder-[#a3abd7] focus:outline-none focus:border-[#0057bd] focus:shadow-[0_0_0_4px_rgba(0,87,189,0.1)] transition-all font-medium text-sm"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full hover:bg-[#e4e7ff] transition-colors text-[#6c759e]"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {/* Sorting options removed for non-admins. Admins use GroupMemberManager. */}
        </div>
      </div>

      {/* Member Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {loading ? (
          <div className="col-span-full py-20 text-center text-[#515981] font-medium">
            <div className="mx-auto w-10 h-10 border-4 border-[#0057bd]/10 border-t-[#0057bd] rounded-full animate-spin mb-4"></div>
            {t('group.loading_members')}
          </div>
        ) : currentItems.length === 0 ? (
          <div className="col-span-full py-20 text-center text-[#515981] font-medium bg-white rounded-xl">
            <span className="material-symbols-outlined text-6xl mb-4 block opacity-50">group_off</span>
            {t('common.no_results')}
          </div>
        ) : (
          <>
            {currentItems.map(member => renderMemberCard(member))}
          </>
        )}
      </div>

      {/* Load More */}
      {!loading && filteredMembers.length > pageSize && (
        <div className="mt-12 flex justify-center">
          <button 
            onClick={loadMore}
            className="flex items-center gap-2 px-8 py-3 bg-[#0057bd] text-[#f0f2ff] font-bold rounded-xl shadow-lg shadow-[#0057bd]/20 hover:translate-y-[-2px] active:scale-95 transition-all"
          >
            {t('group.members.loadMore')}
            <span className="material-symbols-outlined">expand_more</span>
          </button>
        </div>
      )}

      {!loading && filteredMembers.length <= pageSize && filteredMembers.length > 0 && (
        <div className="flex items-center justify-center py-8">
          <div className="flex items-center gap-3 text-[#a3abd7]">
            <span className="material-symbols-outlined text-sm">check_circle</span>
            <span className="text-[10px] font-bold uppercase tracking-widest">{t('group.members.endOfList')}</span>
          </div>
        </div>
      )}
    </div>
  );
}
