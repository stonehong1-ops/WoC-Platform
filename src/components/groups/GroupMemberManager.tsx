'use client';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';


import React, { useState, useEffect, useRef } from 'react';
import { Group, Member } from '@/types/group';
import { groupService } from '@/lib/firebase/groupService';
import { useAuth } from '@/components/providers/AuthProvider';
import { UserProfile } from '@/types/user';
import { db } from '@/lib/firebase/clientApp';
import { doc, updateDoc, setDoc, deleteDoc, collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import UserBadge from '@/components/common/UserBadge';
import GroupInvitationModal from './GroupInvitationModal';

interface MemberWithProfile extends Member {
  profile?: UserProfile | null;
  nickname?: string;
}

const GroupMemberManager = ({ group }: { group: Group }) => {
  const { t, formatDate, formatRelativeTime } = useLanguage();

  const { profile: currentUserProfile } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState('Member');
  const [members, setMembers] = useState<MemberWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Pagination & Sorting State
  const [pageSize, setPageSize] = useState(20);
  const [sortBy, setSortBy] = useState<'joinedAt' | 'lastVisitedAt' | 'engagement'>('joinedAt');

  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Handle click outside to close menu
  useEffect(() => {
    const handleClickOutside = (event: Event) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  // Fetch all members with profiles
  useEffect(() => {
    if (!group?.id) return;
    
    setLoading(true);
    const membersRef = collection(db, 'groups', group.id, 'members');
    const q = query(membersRef, orderBy('joinedAt', 'desc'));

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const memberList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Member[];

      const membersWithProfiles = await Promise.all(memberList.map(async (member) => {
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

      setMembers(membersWithProfiles);
      setLoading(false);
    }, (error) => {
      console.error('Failed to subscribe to members:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [group?.id]);

  const updateUserInfo = async (userId: string, data: Partial<UserProfile>) => {
    try {
      const userRef = doc(db, 'users', userId);
      await setDoc(userRef, data, { merge: true });
      
      if (data.role || data.nickname || data.photoURL || data.systemRole) {
        const memberRef = doc(db, 'groups', group.id, 'members', userId);
        const memberUpdate: any = {};
        if (data.role) memberUpdate.role = data.role;
        if (data.nickname) memberUpdate.nickname = data.nickname;
        if (data.photoURL) memberUpdate.photoURL = data.photoURL;
        
        try {
          await setDoc(memberRef, memberUpdate, { merge: true });
        } catch (e) {
          console.warn("Member subcollection update failed:", e);
        }
      }

      setMembers(prev => prev.map(m => {
        if (m.id === userId) {
          return {
            ...m,
            role: data.role || m.role,
            name: data.nickname || m.name,
            profile: m.profile ? { ...m.profile, ...data } : { id: userId, nickname: m.name, ...data } as UserProfile
          };
        }
        return m;
      }));
    } catch (error) {
      console.error("Error updating user:", error);
      alert("An error occurred while updating.");
    }
  };

  const updateGroupMemberRole = async (userId: string, newRole: string) => {
    try {
      const memberRef = doc(db, 'groups', group.id, 'members', userId);
      await updateDoc(memberRef, { role: newRole });
      
      setMembers(prev => prev.map(m => {
        if (m.id === userId) {
          return {
            ...m,
            role: newRole
          };
        }
        return m;
      }));
      setOpenMenuId(null);
      toast.success("역할이 성공적으로 변경되었습니다.");
    } catch (error) {
      console.error("Error updating member role:", error);
      alert("역할 변경 중 오류가 발생했습니다.");
    }
  };

  const deleteMember = async (userId: string) => {
    if (!window.confirm("Are you sure you want to remove this member from the group? They will also be removed from the group chat.")) {
      return;
    }

    try {
      await groupService.kickMember(group.id, userId);
      setMembers(prev => prev.filter(m => m.id !== userId));
      setOpenMenuId(null);
      alert("Member has been removed from the group and chat.");
    } catch (error) {
      console.error("Error kicking member:", error);
      alert("An error occurred while removing the member.");
    }
  };

  const updateStaffPermission = async (userId: string, permKey: string, value: boolean) => {
    try {
      const memberRef = doc(db, 'groups', group.id, 'members', userId);
      await updateDoc(memberRef, { [`permissions.${permKey}`]: value });
      setMembers(prev => prev.map(m => {
        if (m.id === userId) {
          return {
            ...m,
            permissions: { ...(m as any).permissions, [permKey]: value }
          };
        }
        return m;
      }));
    } catch (error) {
      console.error('Error updating staff permission:', error);
    }
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    e.currentTarget.style.display = 'none';
  };

  const getMillis = (date: any) => {
    if (!date) return 0;
    if (typeof date === 'number') return date;
    if (typeof date.toMillis === 'function') return date.toMillis();
    if (typeof date.toDate === 'function') return date.toDate().getTime();
    return 0;
  };

  const filteredMembers = members.filter(member => {
    const profile = member.profile;
    const nickname = profile?.nickname || member.name || member.nickname || '';
    const email = profile?.email || '';
    
    const nameMatch = nickname.toLowerCase().includes(searchQuery.toLowerCase()) || 
                      email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      member.id.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!nameMatch) return false;

    const isAdmin = member.role === 'owner' || member.id === group.ownerId;
    const isInstructor = member.role === 'instructor';
    const isStaff = member.role === 'staff' || member.role === 'moderator';
    
    if (activeSubTab === 'Owner') return isAdmin && member.status === 'active';
    if (activeSubTab === 'Instructor') return isInstructor && !isAdmin && member.status === 'active';
    if (activeSubTab === 'Staff') return isStaff && !isAdmin && !isInstructor && member.status === 'active';
    // Member 탭 = Owner/Staff 포함 전체 active 멤버 표시
    if (activeSubTab === 'Member') return member.status === 'active';
    if (activeSubTab === 'Stats') return member.status === 'active';
    
    return member.status === 'active';
  }).sort((a, b) => {
    if (sortBy === 'joinedAt') {
      return getMillis(b.joinedAt) - getMillis(a.joinedAt);
    } else if (sortBy === 'lastVisitedAt') {
      const dateA = getMillis(a.profile?.updatedAt || a.profile?.createdAt);
      const dateB = getMillis(b.profile?.updatedAt || b.profile?.createdAt);
      return dateB - dateA;
    }
    return 0;
  });

  const currentItems = filteredMembers.slice(0, pageSize);

  const loadMore = () => {
    setPageSize(prev => prev + 20);
  };



  const getLastVisitText = (member: MemberWithProfile) => {
    const lastVisitMillis = getMillis(member.profile?.updatedAt || member.profile?.createdAt);
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
      isAdmin: member.role === 'owner' || member.id === group.ownerId,
      isStaff: member.role === 'staff' || member.role === 'moderator',
      isInstructor: member.role === 'instructor',
      isDj: member.profile?.isDj,
      isStayHost: member.profile?.isStayHost,
      isServiceProvider: member.profile?.isServiceProvider,
    };

    let effectiveRole = user.danceRole?.toLowerCase();
    if (!effectiveRole && user.gender) {
      if (user.gender === 'male') effectiveRole = 'leader';
      if (user.gender === 'female' || user.gender === 'others') effectiveRole = 'follower';
    }

    const isLeader = effectiveRole === 'leader';
    const isFollower = effectiveRole === 'follower';

    return (
      <div key={member.id} className="bg-white p-6 rounded-xl shadow-[0_4px_20px_-4px_rgba(36,44,81,0.08)] border border-white hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between mb-4">
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
                  Owner
                </span>
              )}
              {user.isStaff && !user.isAdmin && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-100 text-blue-700">
                  Staff
                </span>
              )}
              {user.isInstructor && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-purple-100 text-purple-700">
                  Instructor
                </span>
              )}
            </div>
          </div>
          {/* Action Menu */}
          <div className="relative">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setOpenMenuId(openMenuId === member.id ? null : member.id);
              }}
              className="text-[#6c759e] hover:text-[#0057bd] transition-colors"
            >
              <span className="material-symbols-outlined">more_vert</span>
            </button>
            
            {openMenuId === member.id && (
              <div 
                ref={menuRef}
                className="absolute right-0 top-8 w-56 bg-white rounded-xl shadow-2xl border border-[#e4e7ff] z-[100] max-h-[400px] flex flex-col"
              >
                <div className="flex-1 overflow-y-auto py-2">
                {/* Section: Group Role */}
                <div className="px-4 py-2 border-b border-[#e4e7ff]">
                  <p className="text-[10px] font-bold text-[#6c759e] tracking-widest uppercase mb-2">Group Role</p>
                  <button 
                    onClick={() => updateGroupMemberRole(member.id, 'owner')}
                    className={`w-full flex items-center justify-between py-2 text-[13px] font-medium transition-colors ${member.role === 'owner' ? 'text-[#b31b25] font-bold' : 'text-[#242c51] hover:text-[#b31b25]'}`}
                  >
                    Owner
                    {member.role === 'owner' && <span className="material-symbols-outlined text-[#b31b25] text-lg">verified</span>}
                  </button>
                  <button 
                    onClick={() => updateGroupMemberRole(member.id, 'staff')}
                    className={`w-full flex items-center justify-between py-2 text-[13px] font-medium transition-colors ${member.role === 'staff' ? 'text-[#0057bd] font-bold' : 'text-[#242c51] hover:text-[#0057bd]'}`}
                  >
                    Staff
                    {member.role === 'staff' && <span className="material-symbols-outlined text-[#0057bd] text-lg">verified</span>}
                  </button>
                  <button 
                    onClick={() => updateGroupMemberRole(member.id, 'instructor')}
                    className={`w-full flex items-center justify-between py-2 text-[13px] font-medium transition-colors ${member.role === 'instructor' ? 'text-[#0057bd] font-bold' : 'text-[#242c51] hover:text-[#0057bd]'}`}
                  >
                    Instructor (강사)
                    {member.role === 'instructor' && <span className="material-symbols-outlined text-[#0057bd] text-lg">verified</span>}
                  </button>
                  <button 
                    onClick={() => updateGroupMemberRole(member.id, 'member')}
                    className={`w-full flex items-center justify-between py-2 text-[13px] font-medium transition-colors ${member.role === 'member' || !member.role ? 'text-[#0057bd] font-bold' : 'text-[#242c51] hover:text-[#0057bd]'}`}
                  >
                    Member
                    {(member.role === 'member' || !member.role) && <span className="material-symbols-outlined text-[#0057bd] text-lg">verified</span>}
                  </button>
                </div>

                </div>
                {/* Section: Delete - sticky bottom */}
                <div className="px-4 py-2 bg-red-50/30 border-t border-[#e4e7ff] sticky bottom-0 rounded-b-xl">
                  <button 
                    onClick={() => deleteMember(member.id)}
                    className="w-full flex items-center justify-between py-2 text-[13px] font-bold text-[#b31b25] hover:text-[#9f0519] transition-colors"
                  >
                    Remove from Group
                    <span className="material-symbols-outlined text-lg">person_remove</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[#e4e7ff]">
          <div>
            <p className="text-[10px] uppercase font-bold text-[#6c759e] tracking-wider mb-0.5">Join Date</p>
            <p className="text-sm font-medium">{member.joinedAt ? formatDate(getMillis(member.joinedAt), 'dateOnly') : '-'}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-[#6c759e] tracking-wider mb-0.5">Last Visit</p>
            <p className="text-sm font-medium">{getLastVisitText(member)}</p>
          </div>
          <div className="col-span-2">
            <p className="text-[10px] uppercase font-bold text-[#6c759e] tracking-wider mb-1">Dance Role</p>
            <div className="flex items-center gap-2">
              <span className={`text-xl font-extrabold ${isLeader ? 'text-[#0057bd]' : isFollower ? 'text-[#893c92]' : 'text-[#515981]'}`}>
                {effectiveRole ? effectiveRole.charAt(0).toUpperCase() + effectiveRole.slice(1) : 'Not Set'}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderStaffCard = (member: MemberWithProfile) => {
    const isEnglish = (str: string) => /^[a-zA-Z0-9\s._-]+$/.test(str);
    let primaryNickname = member.profile?.nickname || member.name || member.nickname || 'Unknown';
    let secondaryNickname = member.profile?.nativeNickname || '';
    if (primaryNickname && !isEnglish(primaryNickname)) {
      if (!secondaryNickname) secondaryNickname = primaryNickname;
      primaryNickname = member.id.substring(0, 8);
    }
    const photoURL = member.profile?.photoURL || member.photoURL || member.avatar;
    const email = member.profile?.email || '';
    const perms = (member as any).permissions || {};

    const permissionItems = [
      { key: 'boardAccess', label: 'Board Access' },
      { key: 'scheduleManagement', label: 'Schedule Management' },
      { key: 'approvalAuthority', label: 'Approval Authority' },
    ];

    return (
      <div key={member.id} className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 flex flex-col gap-6 hover:shadow-md transition-shadow">
        <div className="flex items-center gap-4">
          <UserBadge
            uid={member.id}
            nickname={primaryNickname}
            nativeNickname={secondaryNickname}
            photoURL={photoURL}
            avatarSize="w-14 h-14"
            nameClassName="font-bold text-slate-900"
            nativeClassName="text-xs font-medium text-slate-500 ml-1.5"
            subText={email ? <p className="text-sm text-slate-500">{email}</p> : undefined}
          />
        </div>
        <div className="space-y-4 pt-4 border-t border-slate-50">
          {permissionItems.map((perm) => (
            <div key={perm.key} className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700">{perm.label}</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={!!perms[perm.key]}
                  onChange={(e) => updateStaffPermission(member.id, perm.key, e.target.checked)}
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer transition-colors peer-checked:bg-[#0057bd] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
              </label>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderStats = () => {
    const adminCount = members.filter(m => m.role === 'owner' || m.id === group.ownerId || m.profile?.systemRole === 'admin' || m.profile?.isAdmin).length;
    const staffCount = members.filter(m => (m.profile?.isStaff || m.profile?.systemRole === 'staff' || m.profile?.isInstructor || m.profile?.isDj || m.profile?.isStayHost || m.profile?.isServiceProvider) && !(m.role === 'owner' || m.id === group.ownerId || m.profile?.systemRole === 'admin' || m.profile?.isAdmin)).length;
    const memberOnlyCount = members.length - adminCount - staffCount;

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in duration-500">
        {[
          { label: 'Total Members', value: members.length.toLocaleString(), icon: 'group', color: '#0057bd' },
          { label: 'Owners', value: adminCount.toLocaleString(), icon: 'admin_panel_settings', color: '#b31b25' },
          { label: 'Staffs', value: staffCount.toLocaleString(), icon: 'shield_person', color: '#3a53b7' },
          { label: 'General Members', value: memberOnlyCount.toLocaleString(), icon: 'person', color: '#6c759e' }
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-xl p-6 shadow-[0_4px_20px_-4px_rgba(36,44,81,0.08)] border border-white">
            <div className="flex items-start justify-between mb-4">
              <div className="p-2 rounded-lg bg-[#F1F5F9]">
                <span className="material-symbols-outlined" style={{ color: stat.color }}>{stat.icon}</span>
              </div>
            </div>
            <h4 className="text-[#6c759e] text-[10px] font-bold uppercase tracking-widest mb-1">{stat.label}</h4>
            <p className="text-2xl font-extrabold text-[#242c51]">{stat.value}</p>
          </div>
        ))}
      </div>
    );
  };

  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  return (
    <div className="space-y-8">
      {/* Sub-navigation Tabs */}
      <div className="w-full overflow-x-auto scrollbar-hide pb-2 -mb-2">
        <nav className="flex items-center gap-1 bg-[#e4e7ff] p-1 rounded-xl w-max shadow-sm">
          {[
            { id: 'Stats', label: t('group.stats', 'Stats') },
            { id: 'Owner', label: t('group.owner', 'Owner') },
            { id: 'Staff', label: t('group.staff', 'Staff') },
            { id: 'Instructor', label: t('group.instructor', 'Instructor') },
            { id: 'Member', label: t('group.member', 'Member') }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveSubTab(tab.id);
                setPageSize(20);
              }}
              className={`px-6 py-2.5 text-sm font-semibold transition-colors rounded-lg ${activeSubTab === tab.id
                  ? "bg-white text-[#0057bd] shadow-sm"
                  : "text-[#515981] hover:text-[#242c51]"
                }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Stats View */}
      {activeSubTab === 'Stats' && renderStats()}

      {/* Staff / Instructor / Owner Views */}
      {(activeSubTab === 'Staff' || activeSubTab === 'Owner' || activeSubTab === 'Instructor') && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
              <div className="col-span-full py-20 text-center text-[#515981] font-medium">
                <div className="mx-auto w-10 h-10 border-4 border-[#0057bd]/10 border-t-[#0057bd] rounded-full animate-spin mb-4"></div>
                {t('group.loading_members')}
              </div>
            ) : currentItems.length === 0 ? (
              <div className="col-span-full py-20 text-center text-[#515981] font-medium bg-white rounded-xl">
                <span className="material-symbols-outlined text-6xl mb-4 block opacity-50">group_off</span>
                {t('group.no_members')}
              </div>
            ) : (
              <>
                {currentItems.map(member => renderStaffCard(member))}
              </>
            )}
          </div>
        </div>
      )}

      {/* Member List View */}
      {activeSubTab === 'Member' && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pt-8">
          {/* Header and Filters */}
          <div className="flex flex-col md:flex-row md:items-center justify-end gap-6">
            <div className="flex flex-wrap items-center gap-3">
              <button 
                onClick={() => setSortBy('joinedAt')}
                className={`flex items-center gap-2 px-4 py-2 bg-white border rounded-lg text-sm font-medium transition-all ${sortBy === 'joinedAt' ? 'border-[#0057bd] text-[#0057bd]' : 'border-[#a3abd7] hover:border-[#0057bd]'}`}
              >
                <span className="material-symbols-outlined text-[18px]">calendar_today</span>
                {t('group.recent_joined', 'Recent Joined')}
              </button>
              <button 
                onClick={() => setSortBy('lastVisitedAt')}
                className={`flex items-center gap-2 px-4 py-2 bg-white border rounded-lg text-sm font-medium transition-all ${sortBy === 'lastVisitedAt' ? 'border-[#0057bd] text-[#0057bd]' : 'border-[#a3abd7] hover:border-[#0057bd]'}`}
              >
                <span className="material-symbols-outlined text-[18px]">history</span>
                {t('group.recent_visit', 'Recent Visit')}
              </button>
            </div>
          </div>

          {/* Member Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                {t('group.load_more_members', 'Load More Members')}
                <span className="material-symbols-outlined">expand_more</span>
              </button>
            </div>
          )}

          {!loading && filteredMembers.length <= pageSize && filteredMembers.length > 0 && (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center gap-3 text-[#a3abd7]">
                <span className="material-symbols-outlined text-sm">check_circle</span>
                <span className="text-[10px] font-bold uppercase tracking-widest">{t('group.end_of_list', "You've reached the end of the list")}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Invitation Modal */}
      {isInviteModalOpen && currentUserProfile && (
        <GroupInvitationModal
          isOpen={isInviteModalOpen}
          onClose={() => setIsInviteModalOpen(false)}
          group={group}
          currentUser={{ id: (currentUserProfile as any).uid, name: currentUserProfile.nickname }}
          existingMemberIds={members.map(m => m.id)}
        />
      )}
    </div>
  );
};

export default GroupMemberManager;
