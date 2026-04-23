"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Group, Member } from '@/types/group';
import { groupService } from '@/lib/firebase/groupService';
import { useAuth } from '@/components/providers/AuthProvider';
import { UserProfile } from '@/types/user';
import { db } from '@/lib/firebase/clientApp';
import { doc, updateDoc, deleteDoc, collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { format, formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import GroupInvitationModal from './GroupInvitationModal';

interface MemberWithProfile extends Member {
  profile?: UserProfile | null;
  nickname?: string; // Add this to match Firestore data if present
}

const GroupMemberManager = ({ group }: { group: Group }) => {
  const { profile: currentUserProfile } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState('All');
  const [members, setMembers] = useState<MemberWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Pagination & Sorting State
  const [pageSize, setPageSize] = useState(20);
  const [sortBy, setSortBy] = useState<'joinedAt' | 'lastVisitedAt'>('joinedAt');

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
    // Subscribe to group members to get real-time updates of membership
    const membersRef = collection(db, 'groups', group.id, 'members');
    const q = query(membersRef, orderBy('joinedAt', 'desc'));

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const memberList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Member[];

      // Fetch profiles for all members
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
      // 1. Update global user profile
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, data);
      
      // 2. Update group member subcollection if relevant fields are changed
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

      // Local state update for immediate UI feedback
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
      alert("변경 중 오류가 발생했습니다.");
    }
  };

  const deleteMember = async (userId: string) => {
    if (!window.confirm("정말로 이 멤버를 커뮤니티에서 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.")) {
      return;
    }

    try {
      // 1. Delete from group members subcollection
      const memberRef = doc(db, 'groups', group.id, 'members', userId);
      await deleteDoc(memberRef);

      // Local state update
      setMembers(prev => prev.filter(m => m.id !== userId));
      alert("멤버가 삭제되었습니다.");
    } catch (error) {
      console.error("Error deleting member:", error);
      alert("삭제 중 오류가 발생했습니다.");
    }
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    e.currentTarget.src = '/anonymous-user.png';
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

    // Filter by subtab based on Group System Role
    const isAdmin = member.role === 'owner' || member.id === group.ownerId || profile?.systemRole === 'admin' || profile?.isAdmin;
    const isStaff = profile?.isStaff || profile?.systemRole === 'staff' || 
                    profile?.isInstructor || profile?.isSeller || 
                    profile?.isStayHost || profile?.isServiceProvider;
    
    if (activeSubTab === 'Admin') return isAdmin;
    if (activeSubTab === 'Staff') return isStaff && !isAdmin;
    if (activeSubTab === 'Member') return !isAdmin && !isStaff;
    if (activeSubTab === 'All') return true;
    
    return true;
  }).sort((a, b) => {
    if (sortBy === 'joinedAt') {
      const dateA = getMillis(a.joinedAt);
      const dateB = getMillis(b.joinedAt);
      return dateB - dateA;
    } else {
      const dateA = getMillis(a.profile?.updatedAt || a.profile?.createdAt);
      const dateB = getMillis(b.profile?.updatedAt || b.profile?.createdAt);
      return dateB - dateA;
    }
  });

  const currentItems = filteredMembers.slice(0, pageSize);

  const loadMore = () => {
    setPageSize(prev => prev + 20);
  };

  const renderMemberCard = (member: MemberWithProfile) => {
    // Nickname logic: Ensure English primary
    const isEnglish = (str: string) => /^[a-zA-Z0-9\s._-]+$/.test(str);
    
    let primaryNickname = member.profile?.nickname || member.name || member.nickname || 'Unknown';
    let secondaryNickname = member.profile?.nativeNickname || '';
    
    // If primary is not English, move it to secondary and make a placeholder primary
    if (primaryNickname && !isEnglish(primaryNickname)) {
      if (!secondaryNickname) secondaryNickname = primaryNickname;
      // Use part of ID as temporary English nickname if not already English
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

    return (
      <div key={member.id} className="bg-white rounded-[4px] p-5 shadow-[0px_4px_16px_rgba(22,29,30,0.03)] border-b-4 border-[#004493]/10 relative animate-in fade-in slide-in-from-bottom-2 duration-300">
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-[4px] overflow-hidden bg-slate-100 relative border border-slate-200/50">
              {user.photoURL ? (
                <img 
                  className="h-full w-full object-cover transition-opacity duration-300" 
                  src={user.photoURL} 
                  alt={user.nickname}
                  onError={handleImageError}
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center bg-[#dde4e5] text-[#727784]">
                  <span className="material-symbols-outlined text-2xl">person</span>
                </div>
              )}
              {user.role && (
                <div className={`absolute bottom-0 right-0 px-1 text-[8px] font-black uppercase tracking-tighter shadow-sm ${isLeader ? 'bg-[#004493] text-white' : isFollower ? 'bg-[#7c2e00] text-white' : 'bg-slate-500 text-white'}`}>
                  {user.role[0]}
                </div>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-[#2D3435] font-bold text-lg leading-tight truncate max-w-[150px]">{user.nickname}</h3>
                {user.isAdmin && <span className="bg-[#ff3b30] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-[2px] uppercase tracking-tighter shadow-sm">Admin</span>}
                {user.isStaff && !user.isAdmin && <span className="bg-[#004493] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-[2px] uppercase tracking-tighter shadow-sm">Staff</span>}
              </div>
              <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                {user.nativeNickname && <span className="text-[11px] text-[#727784] font-medium mr-1">{user.nativeNickname}</span>}
                {user.isInstructor && <span className="bg-[#004493]/10 text-[#004493] text-[8px] font-extrabold tracking-widest px-1.5 py-0.5 rounded-[1px] uppercase">Instructor</span>}
                {user.isSeller && <span className="bg-[#34c759]/10 text-[#34c759] text-[8px] font-extrabold tracking-widest px-1.5 py-0.5 rounded-[1px] uppercase">Seller</span>}
                {user.isStayHost && <span className="bg-[#ff9500]/10 text-[#ff9500] text-[8px] font-extrabold tracking-widest px-1.5 py-0.5 rounded-[1px] uppercase">Stay Host</span>}
                {user.isServiceProvider && <span className="bg-[#5856d6]/10 text-[#5856d6] text-[8px] font-extrabold tracking-widest px-1.5 py-0.5 rounded-[1px] uppercase">Service Provider</span>}
              </div>
            </div>
          </div>
          
          {/* More Menu */}
          <div className="relative">
            <button 
              onClick={() => setOpenMenuId(openMenuId === member.id ? null : member.id)}
              className="text-[#727784] hover:text-[#004493] transition-colors p-1 rounded-full hover:bg-slate-100"
            >
              <span className="material-symbols-outlined">more_vert</span>
            </button>
            
            {openMenuId === member.id && (
              <div 
                ref={menuRef}
                className="absolute right-0 top-8 w-56 bg-white rounded-[4px] shadow-2xl border border-[#e8eff0] z-[100] py-2 no-scrollbar max-h-[400px] overflow-y-auto"
              >
                {/* Section: Dance Role */}
                <div className="px-4 py-2 border-b border-[#f4fbfb]">
                  <p className="text-[10px] font-bold text-[#727784] tracking-widest uppercase mb-2">Dance Role</p>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => updateUserInfo(member.id, { role: 'leader' })}
                      className={`flex-1 py-1.5 text-[11px] font-bold rounded-[2px] border transition-all ${isLeader ? 'bg-[#004493] text-white border-[#004493]' : 'bg-white text-[#424753] border-[#e2e9ea] hover:border-[#004493]'}`}
                    >Leader</button>
                    <button 
                      onClick={() => updateUserInfo(member.id, { role: 'follower' })}
                      className={`flex-1 py-1.5 text-[11px] font-bold rounded-[2px] border transition-all ${isFollower ? 'bg-[#7c2e00] text-white border-[#7c2e00]' : 'bg-white text-[#424753] border-[#e2e9ea] hover:border-[#7c2e00]'}`}
                    >Follower</button>
                  </div>
                </div>

                {/* Section: System Role */}
                <div className="px-4 py-2 border-b border-[#f4fbfb]">
                  <p className="text-[10px] font-bold text-[#727784] tracking-widest uppercase mb-2">System Role</p>
                  <button 
                    onClick={() => updateUserInfo(member.id, { systemRole: 'admin', isAdmin: true, isStaff: false })}
                    className={`w-full flex items-center justify-between py-2 text-[13px] font-medium transition-colors ${user.isAdmin ? 'text-[#ff3b30] font-bold' : 'text-[#2D3435] hover:text-[#ff3b30]'}`}
                  >
                    Admin
                    {user.isAdmin && <span className="material-symbols-outlined text-[#ff3b30] text-lg">verified</span>}
                  </button>
                  <button 
                    onClick={() => updateUserInfo(member.id, { systemRole: 'staff', isStaff: true, isAdmin: false })}
                    className={`w-full flex items-center justify-between py-2 text-[13px] font-medium transition-colors ${user.isStaff && !user.isAdmin ? 'text-[#004493] font-bold' : 'text-[#2D3435] hover:text-[#004493]'}`}
                  >
                    Staff
                    {user.isStaff && !user.isAdmin && <span className="material-symbols-outlined text-[#004493] text-lg">verified</span>}
                  </button>
                  <button 
                    onClick={() => updateUserInfo(member.id, { systemRole: 'member', isStaff: false, isAdmin: false })}
                    className={`w-full flex items-center justify-between py-2 text-[13px] font-medium transition-colors ${!user.isStaff && !user.isAdmin ? 'text-[#004493] font-bold' : 'text-[#2D3435] hover:text-[#004493]'}`}
                  >
                    Member
                    {!user.isStaff && !user.isAdmin && <span className="material-symbols-outlined text-[#004493] text-lg">verified</span>}
                  </button>
                </div>

                {/* Section: Staff Roles */}
                <div className="px-4 py-2">
                  <p className="text-[10px] font-bold text-[#727784] tracking-widest uppercase mb-2">Service Staff Roles</p>
                  <button 
                    onClick={() => updateUserInfo(member.id, { isInstructor: !user.isInstructor })}
                    className={`w-full flex items-center justify-between py-2 text-[13px] font-medium transition-colors ${user.isInstructor ? 'text-[#004493] font-bold' : 'text-[#2D3435] hover:text-[#004493]'}`}
                  >
                    Instructor
                    {user.isInstructor && <span className="material-symbols-outlined text-[#004493] text-lg">check_circle</span>}
                  </button>
                  <button 
                    onClick={() => updateUserInfo(member.id, { isSeller: !user.isSeller })}
                    className={`w-full flex items-center justify-between py-2 text-[13px] font-medium transition-colors ${user.isSeller ? 'text-[#004493] font-bold' : 'text-[#2D3435] hover:text-[#004493]'}`}
                  >
                    Seller
                    {user.isSeller && <span className="material-symbols-outlined text-[#004493] text-lg">check_circle</span>}
                  </button>
                  <button 
                    onClick={() => updateUserInfo(member.id, { isStayHost: !user.isStayHost })}
                    className={`w-full flex items-center justify-between py-2 text-[13px] font-medium transition-colors ${user.isStayHost ? 'text-[#004493] font-bold' : 'text-[#2D3435] hover:text-[#004493]'}`}
                  >
                    Stay Host
                    {user.isStayHost && <span className="material-symbols-outlined text-[#004493] text-lg">check_circle</span>}
                  </button>
                  <button 
                    onClick={() => updateUserInfo(member.id, { isServiceProvider: !user.isServiceProvider })}
                    className={`w-full flex items-center justify-between py-2 text-[13px] font-medium transition-colors ${user.isServiceProvider ? 'text-[#004493] font-bold' : 'text-[#2D3435] hover:text-[#004493]'}`}
                  >
                    Service Provider
                    {user.isServiceProvider && <span className="material-symbols-outlined text-[#004493] text-lg">check_circle</span>}
                  </button>
                </div>

                {/* Section: Delete */}
                <div className="px-4 py-2 border-t border-[#f4fbfb] bg-red-50/30">
                  <button 
                    onClick={() => deleteMember(member.id)}
                    className="w-full flex items-center justify-between py-2 text-[13px] font-bold text-[#ff3b30] hover:text-[#d32f2f] transition-colors"
                  >
                    Delete Member
                    <span className="material-symbols-outlined text-lg">delete_forever</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-y-4 gap-x-4 pt-4 border-t border-[#f4fbfb]">
          <div className="space-y-1">
            <p className="font-label text-[10px] font-bold text-[#727784] tracking-widest uppercase">Nickname</p>
            <div className="flex flex-col overflow-hidden">
              <span className="font-semibold text-[#2D3435] truncate">{user.nickname}</span>
              {user.nativeNickname && <span className="text-[10px] text-[#c2c6d5] font-medium truncate">{user.nativeNickname}</span>}
            </div>
          </div>
          <div className="space-y-1">
            <p className="font-label text-[10px] font-bold text-[#727784] tracking-widest uppercase">Dance Role</p>
            <p className={`text-sm font-semibold capitalize ${isLeader ? 'text-[#004493]' : isFollower ? 'text-[#7c2e00]' : 'text-[#2D3435]'}`}>
              {user.role || 'Not Set'}
            </p>
          </div>
          <div className="space-y-1">
            <p className="font-label text-[10px] font-bold text-[#727784] tracking-widest uppercase">Joined Date</p>
            <p className="text-sm font-medium text-[#2D3435]">
              {member.joinedAt ? format(getMillis(member.joinedAt), 'yyyy.MM.dd') : '-'}
            </p>
          </div>
          <div className="space-y-1 overflow-hidden">
            <p className="font-label text-[10px] font-bold text-[#727784] tracking-widest uppercase">Member ID</p>
            <p className="text-xs font-medium text-[#c2c6d5] truncate">
              {member.id.length > 15 ? member.id.substring(0, 15) + '...' : member.id}
            </p>
          </div>
        </div>
      </div>
    );
  };

  const renderSubContent = () => {
    switch (activeSubTab) {
      case 'All':
      case 'Member':
      case 'Staff':
      case 'Admin':
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Search Area */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative group flex-1">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#727784]">search</span>
                <input 
                  className="w-full bg-[#dde4e5] border-none rounded-[4px] py-4 pl-12 pr-4 font-body text-lg placeholder:text-[#727784] focus:bg-white focus:ring-2 focus:ring-[#004493]/40 transition-all duration-200 shadow-sm" 
                  placeholder="Search by name or email" 
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPageSize(20); // Reset page size on search
                  }}
                />
              </div>
              <div className="flex items-center gap-2 bg-[#dde4e5] rounded-[4px] p-1">
                {[
                  { id: 'joinedAt', label: '가입일순', icon: 'calendar_today' },
                  { id: 'lastVisitedAt', label: '방문순', icon: 'history' }
                ].map((option) => (
                  <button
                    key={option.id}
                    onClick={() => setSortBy(option.id as any)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-[2px] text-xs font-bold transition-all ${sortBy === option.id ? 'bg-white text-[#004493] shadow-sm' : 'text-[#727784] hover:text-[#004493]'}`}
                  >
                    <span className="material-symbols-outlined text-[16px]">{option.icon}</span>
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Results Count */}
            {!loading && (
              <div className="flex items-center justify-between px-1">
                <p className="text-[12px] font-bold text-[#727784]">
                  SHOWING <span className="text-[#004493]">{Math.min(currentItems.length, filteredMembers.length)}</span> OF <span className="text-[#004493]">{filteredMembers.length}</span> {activeSubTab.toUpperCase()}S
                </p>
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="text-[11px] font-bold text-[#004493] hover:underline"
                  >
                    Clear Search
                  </button>
                )}
              </div>
            )}

            {/* Member Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {loading ? (
                <div className="col-span-full py-20 text-center text-[#727784] font-medium">
                  <div className="mx-auto w-10 h-10 border-4 border-[#004493]/10 border-t-[#004493] rounded-full animate-spin mb-4"></div>
                  멤버 목록을 불러오는 중...
                </div>
              ) : currentItems.length === 0 ? (
                <div className="col-span-full py-20 text-center text-[#727784] font-medium bg-white rounded-[4px] border-b-4 border-slate-100">
                  <span className="material-symbols-outlined text-6xl mb-4 block opacity-50">group_off</span>
                  검색 결과가 없습니다.
                </div>
              ) : (
                <>
                  {currentItems.map(member => renderMemberCard(member))}
                </>
              )}
            </div>

            {/* Load More Section */}
            {!loading && filteredMembers.length > pageSize && (
              <div className="flex flex-col items-center gap-6 pt-8 pb-12">
                <button 
                  onClick={loadMore}
                  className="w-full md:w-auto px-12 py-4 bg-white border-2 border-[#004493] text-[#004493] rounded-[4px] font-black text-sm uppercase tracking-widest hover:bg-[#004493] hover:text-white transition-all duration-300 shadow-lg shadow-blue-900/5 active:scale-95"
                >
                  Load More ({filteredMembers.length - pageSize} remaining)
                </button>
                
                <div className="flex items-center gap-2">
                  <div className="h-[1px] w-12 bg-slate-200"></div>
                  <span className="text-[10px] font-bold text-[#a3abd7] uppercase tracking-widest">End of visible list</span>
                  <div className="h-[1px] w-12 bg-slate-200"></div>
                </div>
              </div>
            )}

            {!loading && filteredMembers.length <= pageSize && filteredMembers.length > 0 && (
              <div className="flex items-center justify-center py-12">
                <div className="flex items-center gap-3 text-[#a3abd7]">
                  <span className="material-symbols-outlined text-sm">check_circle</span>
                  <span className="text-[10px] font-bold uppercase tracking-widest">You've reached the end of the list</span>
                </div>
              </div>
            )}
          </div>
        );
      case 'Stats':
        const adminCount = members.filter(m => m.role === 'owner' || m.id === group.ownerId || m.profile?.systemRole === 'admin' || m.profile?.isAdmin).length;
        const staffCount = members.filter(m => (m.profile?.isStaff || m.profile?.systemRole === 'staff' || m.profile?.isInstructor || m.profile?.isSeller || m.profile?.isStayHost || m.profile?.isServiceProvider) && !(m.role === 'owner' || m.id === group.ownerId || m.profile?.systemRole === 'admin' || m.profile?.isAdmin)).length;
        const memberOnlyCount = members.length - adminCount - staffCount;

        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in duration-500">
            {[
              { label: 'Total Members', value: members.length.toLocaleString(), icon: 'group', color: '#004493' },
              { label: 'Admins', value: adminCount.toLocaleString(), icon: 'admin_panel_settings', color: '#ff3b30' },
              { label: 'Staffs', value: staffCount.toLocaleString(), icon: 'shield_person', color: '#004493' },
              { label: 'General Members', value: memberOnlyCount.toLocaleString(), icon: 'person', color: '#727784' }
            ].map((stat, i) => (
              <div key={i} className="bg-white rounded-[4px] p-6 shadow-sm border-b-4 border-slate-100">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-2 rounded-[4px] bg-slate-50 text-slate-600">
                    <span className="material-symbols-outlined" style={{ color: stat.color }}>{stat.icon}</span>
                  </div>
                </div>
                <h4 className="text-[#727784] text-[10px] font-bold uppercase tracking-widest mb-1">{stat.label}</h4>
                <p className="text-2xl font-black text-[#2D3435]">{stat.value}</p>
              </div>
            ))}
          </div>
        );
      default:
        return <div className="py-20 text-center text-slate-400">준비 중인 기능입니다.</div>;
    }
  };

  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  return (
    <div className="p-4 md:p-8 space-y-8 bg-[#f4fbfb] min-h-screen">
      <style jsx global>{`
        h1, h2, h3, h4 { font-family: 'Manrope', sans-serif; }
        body { font-family: 'Inter', sans-serif; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-4">
          <h1 className="text-2xl font-extrabold tracking-tight text-[#2D3435]">Member Management</h1>
          <nav className="flex items-center space-x-2 overflow-x-auto no-scrollbar pb-2">
            {['Stats', 'All', 'Admin', 'Staff', 'Member'].map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setActiveSubTab(tab);
                  setPageSize(20); // Reset page size on tab change
                }}
                className={`px-5 py-2 text-[13px] font-bold transition-all rounded-full whitespace-nowrap ${activeSubTab === tab
                    ? "bg-[#004493] text-white shadow-md"
                    : "bg-[#e2e9ea] text-[#424753] hover:bg-[#dde4e5]"
                  }`}
              >
                {tab === 'All' ? '전체' : tab === 'Stats' ? '현황' : tab}
              </button>
            ))}
          </nav>
        </div>

        {activeSubTab === 'Member' && (
          <button
            onClick={() => setIsInviteModalOpen(true)}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-[#004493] text-white rounded-[4px] font-bold shadow-lg shadow-blue-900/10 hover:shadow-xl transition-all active:scale-95 group"
          >
            <span className="material-symbols-outlined text-[20px]">person_add</span>
            <span>Invite Member</span>
          </button>
        )}
      </div>

      {renderSubContent()}

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
