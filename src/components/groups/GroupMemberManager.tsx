"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Group, Member } from '@/types/group';
import { groupService } from '@/lib/firebase/groupService';
import { useAuth } from '@/components/providers/AuthProvider';
import { UserProfile } from '@/types/user';
import { db } from '@/lib/firebase/clientApp';
import { doc, updateDoc, deleteDoc, collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { format, formatDistanceToNow } from 'date-fns';
import UserBadge from '@/components/common/UserBadge';
import { ko } from 'date-fns/locale';
import GroupInvitationModal from './GroupInvitationModal';

interface MemberWithProfile extends Member {
  profile?: UserProfile | null;
  nickname?: string;
}

const GroupMemberManager = ({ group }: { group: Group }) => {
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
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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
      await updateDoc(userRef, data);
      
      if (data.role || data.nickname || data.photoURL || data.systemRole) {
        const memberRef = doc(db, 'groups', group.id, 'members', userId);
        const memberUpdate: any = {};
        if (data.role) memberUpdate.role = data.role;
        if (data.nickname) memberUpdate.nickname = data.nickname;
        if (data.photoURL) memberUpdate.photoURL = data.photoURL;
        
        try {
          await updateDoc(memberRef, memberUpdate);
        } catch (e) {
          console.warn("Member subcollection update failed (might not exist yet):", e);
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

  const deleteMember = async (userId: string) => {
    if (!window.confirm("Are you sure you want to remove this member from the community? This action cannot be undone.")) {
      return;
    }

    try {
      const memberRef = doc(db, 'groups', group.id, 'members', userId);
      await deleteDoc(memberRef);
      setMembers(prev => prev.filter(m => m.id !== userId));
      alert("Member has been removed.");
    } catch (error) {
      console.error("Error deleting member:", error);
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

    const isAdmin = member.role === 'owner' || member.id === group.ownerId || profile?.systemRole === 'admin' || profile?.isAdmin;
    const isStaff = profile?.isStaff || profile?.systemRole === 'staff' || 
                    profile?.isInstructor || profile?.isSeller || 
                    profile?.isStayHost || profile?.isServiceProvider;
    
    if (activeSubTab === 'Owner') return isAdmin && member.status === 'active';
    if (activeSubTab === 'Staff') return isStaff && !isAdmin && member.status === 'active';
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

  // Engagement badge logic
  const getEngagementBadge = (member: MemberWithProfile) => {
    const joinedMillis = getMillis(member.joinedAt);
    const now = Date.now();
    const daysSinceJoin = (now - joinedMillis) / (1000 * 60 * 60 * 24);
    const lastVisitMillis = getMillis(member.profile?.updatedAt || member.profile?.createdAt);
    const daysSinceVisit = (now - lastVisitMillis) / (1000 * 60 * 60 * 24);

    if (daysSinceJoin < 30) {
      return { label: 'New Member', className: 'bg-[#f199f7]/30 text-[#5e106a]' };
    }
    if (daysSinceVisit > 30) {
      return { label: 'Inactive', className: 'bg-[#fb5151]/20 text-[#b31b25]' };
    }
    if (daysSinceVisit < 7) {
      return { label: 'High Engagement', className: 'bg-[#f199f7]/30 text-[#5e106a]' };
    }
    return { label: 'Regular', className: 'bg-[#e4e7ff] text-[#515981]' };
  };

  const getLastVisitText = (member: MemberWithProfile) => {
    const lastVisitMillis = getMillis(member.profile?.updatedAt || member.profile?.createdAt);
    if (!lastVisitMillis) return '-';
    try {
      return formatDistanceToNow(new Date(lastVisitMillis), { addSuffix: true });
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
      role: member.profile?.role || member.role,
      isAdmin: member.profile?.isAdmin || member.profile?.systemRole === 'admin' || member.role === 'owner' || member.id === group.ownerId,
      isStaff: member.profile?.isStaff || member.profile?.systemRole === 'staff',
      isInstructor: member.profile?.isInstructor,
      isSeller: member.profile?.isSeller,
      isStayHost: member.profile?.isStayHost,
      isServiceProvider: member.profile?.isServiceProvider,
    };

    const isLeader = user.role?.toLowerCase() === 'leader';
    const isFollower = user.role?.toLowerCase() === 'follower';
    const badge = getEngagementBadge(member);

    return (
      <div key={member.id} className="bg-white p-6 rounded-xl shadow-[0_4px_20px_-4px_rgba(36,44,81,0.08)] border border-white hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-4">
            <UserBadge
              uid={user.id}
              nickname={user.nickname}
              nativeNickname={user.nativeNickname}
              photoURL={user.photoURL}
              avatarSize="w-14 h-14"
              nameClassName="font-bold text-[#242c51] leading-tight"
              nativeClassName="text-[11px] text-[#515981] font-medium ml-1.5"
            />
            <div>
              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                {user.isAdmin && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-red-100 text-red-700">
                    <span className="material-symbols-outlined text-[10px]" style={{ fontVariationSettings: "'FILL' 1" }}>shield</span>
                    Owner
                  </span>
                )}
                {user.isStaff && !user.isAdmin && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-100 text-blue-700">
                    <span className="material-symbols-outlined text-[10px]" style={{ fontVariationSettings: "'FILL' 1" }}>badge</span>
                    Staff
                  </span>
                )}
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase ${badge.className} w-fit`}>
                  {badge.label}
                </span>
              </div>
            </div>
          </div>
          {/* Action Menu */}
          <div className="relative">
            <button 
              onClick={() => setOpenMenuId(openMenuId === member.id ? null : member.id)}
              className="text-[#6c759e] hover:text-[#0057bd] transition-colors"
            >
              <span className="material-symbols-outlined">more_vert</span>
            </button>
            
            {openMenuId === member.id && (
              <div 
                ref={menuRef}
                className="absolute right-0 top-8 w-56 bg-white rounded-xl shadow-2xl border border-[#e4e7ff] z-[100] py-2 no-scrollbar max-h-[400px] overflow-y-auto"
              >
                {/* Section: Dance Role */}
                <div className="px-4 py-2 border-b border-[#e4e7ff]">
                  <p className="text-[10px] font-bold text-[#6c759e] tracking-widest uppercase mb-2">Dance Role</p>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => updateUserInfo(member.id, { role: 'leader' })}
                      className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg border transition-all ${isLeader ? 'bg-[#0057bd] text-white border-[#0057bd]' : 'bg-white text-[#242c51] border-[#a3abd7] hover:border-[#0057bd]'}`}
                    >Leader</button>
                    <button 
                      onClick={() => updateUserInfo(member.id, { role: 'follower' })}
                      className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg border transition-all ${isFollower ? 'bg-[#893c92] text-white border-[#893c92]' : 'bg-white text-[#242c51] border-[#a3abd7] hover:border-[#893c92]'}`}
                    >Follower</button>
                  </div>
                </div>

                {/* Section: System Role */}
                <div className="px-4 py-2 border-b border-[#e4e7ff]">
                  <p className="text-[10px] font-bold text-[#6c759e] tracking-widest uppercase mb-2">System Role</p>
                  <button 
                    onClick={() => updateUserInfo(member.id, { systemRole: 'admin', isAdmin: true, isStaff: false })}
                    className={`w-full flex items-center justify-between py-2 text-[13px] font-medium transition-colors ${user.isAdmin ? 'text-[#b31b25] font-bold' : 'text-[#242c51] hover:text-[#b31b25]'}`}
                  >
                    Admin
                    {user.isAdmin && <span className="material-symbols-outlined text-[#b31b25] text-lg">verified</span>}
                  </button>
                  <button 
                    onClick={() => updateUserInfo(member.id, { systemRole: 'staff', isStaff: true, isAdmin: false })}
                    className={`w-full flex items-center justify-between py-2 text-[13px] font-medium transition-colors ${user.isStaff && !user.isAdmin ? 'text-[#0057bd] font-bold' : 'text-[#242c51] hover:text-[#0057bd]'}`}
                  >
                    Staff
                    {user.isStaff && !user.isAdmin && <span className="material-symbols-outlined text-[#0057bd] text-lg">verified</span>}
                  </button>
                  <button 
                    onClick={() => updateUserInfo(member.id, { systemRole: 'member', isStaff: false, isAdmin: false })}
                    className={`w-full flex items-center justify-between py-2 text-[13px] font-medium transition-colors ${!user.isStaff && !user.isAdmin ? 'text-[#0057bd] font-bold' : 'text-[#242c51] hover:text-[#0057bd]'}`}
                  >
                    Member
                    {!user.isStaff && !user.isAdmin && <span className="material-symbols-outlined text-[#0057bd] text-lg">verified</span>}
                  </button>
                </div>

                {/* Section: Staff Roles */}
                <div className="px-4 py-2 border-b border-[#e4e7ff]">
                  <p className="text-[10px] font-bold text-[#6c759e] tracking-widest uppercase mb-2">Service Staff Roles</p>
                  {[
                    { key: 'isInstructor', label: 'Instructor', value: user.isInstructor },
                    { key: 'isSeller', label: 'Seller', value: user.isSeller },
                    { key: 'isStayHost', label: 'Stay Host', value: user.isStayHost },
                    { key: 'isServiceProvider', label: 'Service Provider', value: user.isServiceProvider },
                  ].map((role) => (
                    <button 
                      key={role.key}
                      onClick={() => updateUserInfo(member.id, { [role.key]: !role.value } as any)}
                      className={`w-full flex items-center justify-between py-2 text-[13px] font-medium transition-colors ${role.value ? 'text-[#0057bd] font-bold' : 'text-[#242c51] hover:text-[#0057bd]'}`}
                    >
                      {role.label}
                      {role.value && <span className="material-symbols-outlined text-[#0057bd] text-lg">check_circle</span>}
                    </button>
                  ))}
                </div>

                {/* Section: Delete */}
                <div className="px-4 py-2 bg-red-50/30">
                  <button 
                    onClick={() => deleteMember(member.id)}
                    className="w-full flex items-center justify-between py-2 text-[13px] font-bold text-[#b31b25] hover:text-[#9f0519] transition-colors"
                  >
                    Delete Member
                    <span className="material-symbols-outlined text-lg">delete_forever</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[#e4e7ff]">
          <div>
            <p className="text-[10px] uppercase font-bold text-[#6c759e] tracking-wider mb-0.5">Join Date</p>
            <p className="text-sm font-medium">{member.joinedAt ? format(getMillis(member.joinedAt), 'MMM dd, yyyy') : '-'}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-[#6c759e] tracking-wider mb-0.5">Last Visit</p>
            <p className="text-sm font-medium">{getLastVisitText(member)}</p>
          </div>
          <div className="col-span-2">
            <p className="text-[10px] uppercase font-bold text-[#6c759e] tracking-wider mb-1">Dance Role</p>
            <div className="flex items-center gap-2">
              <span className={`text-xl font-extrabold ${isLeader ? 'text-[#0057bd]' : isFollower ? 'text-[#893c92]' : 'text-[#515981]'}`}>
                {user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'Not Set'}
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
    const staffCount = members.filter(m => (m.profile?.isStaff || m.profile?.systemRole === 'staff' || m.profile?.isInstructor || m.profile?.isSeller || m.profile?.isStayHost || m.profile?.isServiceProvider) && !(m.role === 'owner' || m.id === group.ownerId || m.profile?.systemRole === 'admin' || m.profile?.isAdmin)).length;
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
      <nav className="flex items-center gap-1 bg-[#e4e7ff] p-1 rounded-xl w-fit shadow-sm">
        {['Stats', 'Owner', 'Staff', 'Member'].map((tab) => (
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
            {tab}
          </button>
        ))}
      </nav>

      {/* Stats View */}
      {activeSubTab === 'Stats' && renderStats()}

      {/* Staff / Owner Views */}
      {(activeSubTab === 'Staff' || activeSubTab === 'Owner') && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
              <div className="col-span-full py-20 text-center text-[#515981] font-medium">
                <div className="mx-auto w-10 h-10 border-4 border-[#0057bd]/10 border-t-[#0057bd] rounded-full animate-spin mb-4"></div>
                멤버 목록을 불러오는 중...
              </div>
            ) : currentItems.length === 0 ? (
              <div className="col-span-full py-20 text-center text-[#515981] font-medium bg-white rounded-xl">
                <span className="material-symbols-outlined text-6xl mb-4 block opacity-50">group_off</span>
                해당하는 멤버가 없습니다.
              </div>
            ) : (
              <>
                {currentItems.map(member => renderStaffCard(member))}
              </>
            )}
            {/* Add New Staff Placeholder */}
            {!loading && activeSubTab === 'Staff' && (
              <div
                onClick={() => setIsInviteModalOpen(true)}
                className="border-2 border-dashed border-slate-300 rounded-xl p-6 flex flex-col items-center justify-center gap-3 text-slate-500 hover:border-[#0057bd] hover:text-[#0057bd] transition-all cursor-pointer bg-slate-50/50"
              >
                <span className="material-symbols-outlined text-4xl">person_add</span>
                <span className="font-semibold">Add New Staff Member</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Member List View */}
      {activeSubTab === 'Member' && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Header and Filters */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-[#242c51]">Member Directory</h1>
              <p className="text-sm text-[#515981] mt-1 font-body">Manage and monitor active community members.</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[#6c759e] mb-1 w-full md:w-auto">Sort By</span>
              <button 
                onClick={() => setSortBy('joinedAt')}
                className={`flex items-center gap-2 px-4 py-2 bg-white border rounded-lg text-sm font-medium transition-all ${sortBy === 'joinedAt' ? 'border-[#0057bd] text-[#0057bd]' : 'border-[#a3abd7] hover:border-[#0057bd]'}`}
              >
                <span className="material-symbols-outlined text-[18px]">calendar_today</span>
                Recent Joined
              </button>
              <button 
                onClick={() => setSortBy('lastVisitedAt')}
                className={`flex items-center gap-2 px-4 py-2 bg-white border rounded-lg text-sm font-medium transition-all ${sortBy === 'lastVisitedAt' ? 'border-[#0057bd] text-[#0057bd]' : 'border-[#a3abd7] hover:border-[#0057bd]'}`}
              >
                <span className="material-symbols-outlined text-[18px]">history</span>
                Recent Visit
              </button>
            </div>
          </div>

          {/* Member Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
              <div className="col-span-full py-20 text-center text-[#515981] font-medium">
                <div className="mx-auto w-10 h-10 border-4 border-[#0057bd]/10 border-t-[#0057bd] rounded-full animate-spin mb-4"></div>
                멤버 목록을 불러오는 중...
              </div>
            ) : currentItems.length === 0 ? (
              <div className="col-span-full py-20 text-center text-[#515981] font-medium bg-white rounded-xl">
                <span className="material-symbols-outlined text-6xl mb-4 block opacity-50">group_off</span>
                검색 결과가 없습니다.
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
                Load More Members
                <span className="material-symbols-outlined">expand_more</span>
              </button>
            </div>
          )}

          {!loading && filteredMembers.length <= pageSize && filteredMembers.length > 0 && (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center gap-3 text-[#a3abd7]">
                <span className="material-symbols-outlined text-sm">check_circle</span>
                <span className="text-[10px] font-bold uppercase tracking-widest">You&apos;ve reached the end of the list</span>
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
        />
      )}
    </div>
  );
};

export default GroupMemberManager;
