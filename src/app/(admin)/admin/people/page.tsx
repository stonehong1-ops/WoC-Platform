"use client";

import React, { useState, useEffect, useRef } from 'react';
import { db } from '@/lib/firebase/clientApp';
import { collection, query, onSnapshot, orderBy, doc, updateDoc, deleteDoc, where, getDocs } from 'firebase/firestore';
import { format, formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { groupService } from '@/lib/firebase/groupService';
import { UserProfile } from '@/types/user';
import { Member } from '@/types/group';
import { toast } from 'sonner';

export default function AdminPeoplePage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [pendingMembers, setPendingMembers] = useState<(Member & { userProfile?: UserProfile })[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('All');
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Fetch system users
  useEffect(() => {
    const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const userList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as UserProfile[];
      setUsers(userList);
      if (activeTab !== 'Join Requests') setLoading(false);
    }, (error) => {
      console.error("Error fetching users:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [activeTab]);

  // Fetch pending join requests for the main group (freestyle-tango as default)
  useEffect(() => {
    if (activeTab !== 'Join Requests') return;

    setLoading(true);
    const membersRef = collection(db, 'groups', 'freestyle-tango', 'members');
    const q = query(membersRef, where('status', '==', 'pending'), orderBy('joinedAt', 'desc'));

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const pendingList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Member[];

      // Fetch user profiles for these pending members
      const pendingWithProfiles = await Promise.all(pendingList.map(async (m) => {
        const userSnap = await getDocs(query(collection(db, 'users'), where('__name__', '==', m.id)));
        const userProfile = !userSnap.empty ? { id: userSnap.docs[0].id, ...userSnap.docs[0].data() } as UserProfile : undefined;
        return { ...m, userProfile };
      }));

      setPendingMembers(pendingWithProfiles);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching pending members:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [activeTab]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleApprove = async (memberId: string, name: string) => {
    try {
      await groupService.approveMember('freestyle-tango', memberId);
      toast.success(`${name}님의 가입을 승인했습니다.`);
    } catch (error) {
      console.error("Approval error:", error);
      toast.error("승인 중 오류가 발생했습니다.");
    }
  };

  const handleReject = async (memberId: string, name: string) => {
    if (!window.confirm(`${name}님의 가입 신청을 거절하시겠습니까?`)) return;
    try {
      await groupService.rejectMember('freestyle-tango', memberId);
      toast.success(`${name}님의 가입 신청을 거절했습니다.`);
    } catch (error) {
      console.error("Rejection error:", error);
      toast.error("거절 중 오류가 발생했습니다.");
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.nickname?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.nativeNickname?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;

    if (activeTab === 'All') return true;
    if (activeTab === 'Instructors') return user.isInstructor;
    if (activeTab === 'Sellers') return user.isSeller;
    if (activeTab === 'Stay Hosts') return user.isStayHost;
    if (activeTab === 'Service Providers') return user.isServiceProvider;
    
    return true;
  });

  const displayItems = activeTab === 'Join Requests' ? pendingMembers : filteredUsers;
  const totalPages = Math.ceil(displayItems.length / itemsPerPage);
  const currentItems = displayItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const paginate = (pageNumber: number) => {
    if (pageNumber > 0 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    e.currentTarget.src = '/anonymous-user.png';
  };

  const updateUserInfo = async (userId: string, data: Partial<UserProfile>) => {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, data);
    } catch (error) {
      console.error("Error updating user:", error);
      toast.error("변경 중 오류가 발생했습니다.");
    }
  };

  const deleteUserAccount = async (userId: string, nickname: string) => {
    if (!window.confirm(`${nickname} 님의 계정을 정말 삭제하시겠습니까?\n이 작업은 되돌릴 수 없으며 모든 그룹 멤버십에서도 삭제됩니다.`)) {
      return;
    }

    try {
      const userRef = doc(db, 'users', userId);
      await deleteDoc(userRef);
      const memberRef = doc(db, 'groups', 'freestyle-tango', 'members', userId);
      await deleteDoc(memberRef);
      toast.success(`${nickname} 님의 계정이 삭제되었습니다.`);
      setOpenMenuId(null);
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error("삭제 중 오류가 발생했습니다.");
    }
  };

  return (
    <main className="min-h-screen px-4 pt-6 pb-20 max-w-2xl mx-auto space-y-8 bg-[#f4fbfb]">
      <style jsx global>{`
        body { font-family: 'Inter', sans-serif; background-color: #f4fbfb; }
        h1, h2, h3 { font-family: 'Manrope', sans-serif; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* Header with Title */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">People Management</h1>
        <div className="flex gap-2">
          {activeTab === 'Join Requests' && pendingMembers.length > 0 && (
            <span className="bg-rose-500 text-white text-[10px] font-bold px-2 py-1 rounded-full animate-pulse">
              {pendingMembers.length} NEW
            </span>
          )}
        </div>
      </div>

      {/* Search Section */}
      <section className="space-y-4">
        <div className="relative group">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#727784]">search</span>
          <input 
            className="w-full bg-[#dde4e5] border-none rounded-[4px] py-4 pl-12 pr-4 font-body text-lg placeholder:text-[#727784] focus:bg-white focus:ring-2 focus:ring-[#004493]/40 transition-all duration-200 shadow-sm" 
            placeholder="Search by name, email, or role" 
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>
        
        <div className="flex overflow-x-auto pb-2 gap-2 no-scrollbar">
          {['All', 'Join Requests', 'Instructors', 'Sellers', 'Stay Hosts', 'Service Providers'].map((tab) => (
            <button 
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setCurrentPage(1);
              }}
              className={`whitespace-nowrap px-6 py-2 rounded-full font-label text-[13px] font-semibold tracking-wide transition-colors relative ${
                activeTab === tab 
                ? "bg-[#005bc0] text-white" 
                : "bg-[#e2e9ea] text-[#424753] hover:bg-[#dde4e5]"
              }`}
            >
              {tab}
              {tab === 'Join Requests' && pendingMembers.length > 0 && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-[#f4fbfb]"></span>
              )}
            </button>
          ))}
        </div>
      </section>

      {/* List Content */}
      <section className="space-y-4">
        {loading ? (
          <div className="py-20 text-center text-[#727784]">Loading data...</div>
        ) : currentItems.length === 0 ? (
          <div className="py-20 text-center text-[#727784]">No items found.</div>
        ) : activeTab === 'Join Requests' ? (
          // Join Requests List
          (currentItems as (Member & { userProfile?: UserProfile })[]).map((member) => (
            <div key={member.id} className="bg-white rounded-[4px] p-5 shadow-sm border-l-4 border-amber-400">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-[4px] overflow-hidden bg-slate-100">
                    <img 
                      className="h-full w-full object-cover" 
                      src={member.avatar || member.userProfile?.photoURL || '/anonymous-user.png'} 
                      alt={member.name}
                      onError={handleImageError}
                    />
                  </div>
                  <div>
                    <h3 className="text-[#2D3435] font-bold text-lg leading-tight">{member.name}</h3>
                    <p className="text-xs text-slate-500">{member.userProfile?.email || 'Email not available'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest mb-1">Pending Approval</p>
                  <p className="text-[10px] text-slate-400">{member.joinedAt ? format(new Date(member.joinedAt), 'MMM dd, HH:mm') : 'Recently'}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => handleApprove(member.id, member.name)}
                  className="flex-1 bg-blue-600 text-white font-bold py-2 rounded-[4px] text-sm hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-sm">check_circle</span> 승인
                </button>
                <button 
                  onClick={() => handleReject(member.id, member.name)}
                  className="flex-1 bg-white text-rose-500 border border-rose-200 font-bold py-2 rounded-[4px] text-sm hover:bg-rose-50 transition-colors flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-sm">cancel</span> 거절
                </button>
              </div>
            </div>
          ))
        ) : (
          // General Users List
          (currentItems as UserProfile[]).map((user) => (
            <div key={user.id} className="bg-white rounded-[4px] p-5 shadow-[0px_4px_16px_rgba(22,29,30,0.03)] border-b-4 border-[#004493]/10 relative">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-[4px] overflow-hidden bg-[#e8eff0] relative">
                    <img 
                      className="h-full w-full object-cover" 
                      src={user.photoURL || '/anonymous-user.png'} 
                      alt={user.nickname}
                      onError={handleImageError}
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-[#2D3435] font-bold text-lg leading-tight">
                        {user.nickname}
                        {user.nativeNickname && <span className="text-sm font-normal text-slate-500 ml-1.5">({user.nativeNickname})</span>}
                      </h3>
                      {user.isAdmin && <span className="bg-[#ff3b30] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-[2px] uppercase">Admin</span>}
                    </div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {user.isInstructor && <span className="bg-[#004493]/10 text-[#004493] text-[9px] font-extrabold tracking-widest px-1.5 py-0.5 rounded-[2px] uppercase">Instructor</span>}
                      {user.isSeller && <span className="bg-[#4b5e86]/10 text-[#4b5e86] text-[9px] font-extrabold tracking-widest px-1.5 py-0.5 rounded-[2px] uppercase">Seller</span>}
                    </div>
                  </div>
                </div>
                
                <div className="relative">
                  <button 
                    onClick={() => setOpenMenuId(openMenuId === user.id ? null : user.id)}
                    className="text-[#727784] hover:text-[#004493] transition-colors p-1"
                  >
                    <span className="material-symbols-outlined">more_vert</span>
                  </button>
                  
                  {openMenuId === user.id && (
                    <div ref={menuRef} className="absolute right-0 top-8 w-56 bg-white rounded-[4px] shadow-2xl border border-[#e8eff0] z-20 py-2">
                       {/* Simplified menu content from original */}
                       <div className="px-4 py-2 border-b border-[#f4fbfb]">
                        <p className="text-[10px] font-bold text-[#727784] tracking-widest uppercase mb-2">Dance Role</p>
                        <div className="flex gap-2">
                          <button onClick={() => updateUserInfo(user.id, { role: 'leader' })} className={`flex-1 py-1.5 text-[11px] font-bold rounded-[2px] border ${user.role === 'leader' ? 'bg-[#004493] text-white' : 'bg-white text-[#424753]'}`}>Leader</button>
                          <button onClick={() => updateUserInfo(user.id, { role: 'follower' })} className={`flex-1 py-1.5 text-[11px] font-bold rounded-[2px] border ${user.role === 'follower' ? 'bg-[#7c2e00] text-white' : 'bg-white text-[#424753]'}`}>Follower</button>
                        </div>
                      </div>
                      <div className="px-4 py-2">
                        <button onClick={() => updateUserInfo(user.id, { isAdmin: !user.isAdmin })} className="w-full flex items-center justify-between py-2 text-[13px] font-medium text-[#2D3435]">
                          Admin Access {user.isAdmin && <span className="material-symbols-outlined text-[#ff3b30] text-lg">verified</span>}
                        </button>
                      </div>
                      <div className="px-4 py-2 bg-red-50/50 border-t border-red-100">
                        <button onClick={() => deleteUserAccount(user.id, user.nickname || 'Unknown')} className="w-full flex items-center justify-between py-2 text-[13px] font-bold text-red-600">
                          Delete Account <span className="material-symbols-outlined text-red-500 text-lg">delete_forever</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-y-4">
                <div className="space-y-0.5">
                  <p className="font-label text-[9px] font-bold text-[#727784] tracking-widest uppercase">Nickname</p>
                  <p className="font-semibold text-sm text-[#2D3435]">{user.nickname}</p>
                </div>
                <div className="space-y-0.5">
                  <p className="font-label text-[9px] font-bold text-[#727784] tracking-widest uppercase">Joined</p>
                  <p className="text-sm font-medium text-[#2D3435]">{user.createdAt ? format(user.createdAt.toDate(), 'yyyy.MM.dd') : '-'}</p>
                </div>
                <div className="space-y-0.5">
                  <p className="font-label text-[9px] font-bold text-[#727784] tracking-widest uppercase">Last Visit</p>
                  <p className="text-sm font-medium text-[#2D3435]">{user.lastVisitedAt ? formatDistanceToNow(user.lastVisitedAt.toDate(), { addSuffix: true, locale: ko }) : '-'}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </section>

      {/* Pagination */}
      {totalPages > 1 && (
        <nav className="flex items-center justify-center gap-2 pt-4">
          <button onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1} className="h-8 w-8 flex items-center justify-center rounded-[4px] hover:bg-[#e2e9ea] disabled:opacity-30">
            <span className="material-symbols-outlined">chevron_left</span>
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((number) => (
            <button key={number} onClick={() => paginate(number)} className={`h-8 w-8 rounded-[4px] font-bold text-sm ${currentPage === number ? "bg-[#004493] text-white" : "hover:bg-[#e2e9ea]"}`}>{number}</button>
          ))}
          <button onClick={() => paginate(currentPage + 1)} disabled={currentPage === totalPages} className="h-8 w-8 flex items-center justify-center rounded-[4px] hover:bg-[#e2e9ea] disabled:opacity-30">
            <span className="material-symbols-outlined">chevron_right</span>
          </button>
        </nav>
      )}
    </main>
  );
}
