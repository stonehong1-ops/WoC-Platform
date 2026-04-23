"use client";

import React, { useState, useEffect, useRef } from 'react';
import { db } from '@/lib/firebase/clientApp';
import { collection, query, onSnapshot, orderBy, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { format, formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

import { UserProfile } from '@/types/user';

export default function AdminPeoplePage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('All');
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const userList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as UserProfile[];
      setUsers(userList);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching users:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const currentItems = filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

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
      // setOpenMenuId(null); // Keep menu open for multi-select if needed, but for now close it
    } catch (error) {
      console.error("Error updating user:", error);
      alert("변경 중 오류가 발생했습니다.");
    }
  };

  const deleteUserAccount = async (userId: string, nickname: string) => {
    if (!window.confirm(`${nickname} 님의 계정을 정말 삭제하시겠습니까?\n이 작업은 되돌릴 수 없으며 모든 그룹 멤버십에서도 삭제됩니다.`)) {
      return;
    }

    try {
      // 1. Delete from users collection
      const userRef = doc(db, 'users', userId);
      await deleteDoc(userRef);

      // 2. Delete from freestyle-tango group members
      const memberRef = doc(db, 'groups', 'freestyle-tango', 'members', userId);
      await deleteDoc(memberRef);

      alert(`${nickname} 님의 계정이 삭제되었습니다.`);
      setOpenMenuId(null);
    } catch (error) {
      console.error("Error deleting user:", error);
      alert("삭제 중 오류가 발생했습니다.");
    }
  };

  return (
    <main className="min-h-screen px-4 pt-6 pb-20 max-w-2xl mx-auto space-y-8 bg-[#f4fbfb]">
      <style jsx global>{`
        body {
          font-family: 'Inter', sans-serif;
          background-color: #f4fbfb;
        }
        h1, h2, h3 {
          font-family: 'Manrope', sans-serif;
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

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
          {['All', 'Instructors', 'Sellers', 'Stay Hosts', 'Service Providers'].map((tab) => (
            <button 
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setCurrentPage(1);
              }}
              className={`whitespace-nowrap px-6 py-2 rounded-full font-label text-[13px] font-semibold tracking-wide transition-colors ${
                activeTab === tab 
                ? "bg-[#005bc0] text-white" 
                : "bg-[#e2e9ea] text-[#424753] hover:bg-[#dde4e5]"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </section>

      {/* Member Card List */}
      <section className="space-y-4">
        {loading ? (
          <div className="py-20 text-center text-[#727784]">Loading members...</div>
        ) : currentItems.length === 0 ? (
          <div className="py-20 text-center text-[#727784]">No members found.</div>
        ) : (
          currentItems.map((user) => (
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
                    {user.role && (
                      <div className={`absolute bottom-0 right-0 px-1 text-[8px] font-bold uppercase ${user.role === 'leader' ? 'bg-[#004493] text-white' : 'bg-[#7c2e00] text-white'}`}>
                        {user.role[0]}
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-[#2D3435] font-bold text-lg leading-tight">{user.nickname}</h3>
                      {user.isAdmin && <span className="bg-[#ff3b30] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-[2px] uppercase">Admin</span>}
                      {user.isStaff && <span className="bg-[#004493] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-[2px] uppercase">Staff</span>}
                    </div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {user.isInstructor && <span className="bg-[#004493]/10 text-[#004493] text-[9px] font-extrabold tracking-widest px-1.5 py-0.5 rounded-[2px] uppercase">Instructor</span>}
                      {user.isSeller && <span className="bg-[#4b5e86]/10 text-[#4b5e86] text-[9px] font-extrabold tracking-widest px-1.5 py-0.5 rounded-[2px] uppercase">Seller</span>}
                      {user.isStayHost && <span className="bg-[#006644]/10 text-[#006644] text-[9px] font-extrabold tracking-widest px-1.5 py-0.5 rounded-[2px] uppercase">Stay Host</span>}
                      {user.isServiceProvider && <span className="bg-[#7c2e00]/10 text-[#7c2e00] text-[9px] font-extrabold tracking-widest px-1.5 py-0.5 rounded-[2px] uppercase">Service Provider</span>}
                    </div>
                  </div>
                </div>
                
                {/* More Menu */}
                <div className="relative">
                  <button 
                    onClick={() => setOpenMenuId(openMenuId === user.id ? null : user.id)}
                    className="text-[#727784] hover:text-[#004493] transition-colors p-1"
                  >
                    <span className="material-symbols-outlined">more_vert</span>
                  </button>
                  
                  {openMenuId === user.id && (
                    <div 
                      ref={menuRef}
                      className="absolute right-0 top-8 w-56 bg-white rounded-[4px] shadow-2xl border border-[#e8eff0] z-20 py-2 no-scrollbar max-h-[400px] overflow-y-auto"
                    >
                      {/* Section: Dance Role */}
                      <div className="px-4 py-2 border-b border-[#f4fbfb]">
                        <p className="text-[10px] font-bold text-[#727784] tracking-widest uppercase mb-2">Dance Role</p>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => updateUserInfo(user.id, { role: 'leader' })}
                            className={`flex-1 py-1.5 text-[11px] font-bold rounded-[2px] border ${user.role === 'leader' ? 'bg-[#004493] text-white border-[#004493]' : 'bg-white text-[#424753] border-[#e2e9ea]'}`}
                          >Leader</button>
                          <button 
                            onClick={() => updateUserInfo(user.id, { role: 'follower' })}
                            className={`flex-1 py-1.5 text-[11px] font-bold rounded-[2px] border ${user.role === 'follower' ? 'bg-[#7c2e00] text-white border-[#7c2e00]' : 'bg-white text-[#424753] border-[#e2e9ea]'}`}
                          >Follower</button>
                        </div>
                      </div>

                      {/* Section: Staff Roles (Multi) */}
                      <div className="px-4 py-2 border-b border-[#f4fbfb]">
                        <p className="text-[10px] font-bold text-[#727784] tracking-widest uppercase mb-2">Staff Roles</p>
                        {[
                          { key: 'isInstructor', label: 'Instructor' },
                          { key: 'isSeller', label: 'Seller' },
                          { key: 'isStayHost', label: 'Stay Host' },
                          { key: 'isServiceProvider', label: 'Service Provider' }
                        ].map((role) => (
                          <button 
                            key={role.key}
                            onClick={() => updateUserInfo(user.id, { [role.key]: !user[role.key as keyof UserProfile] })}
                            className="w-full flex items-center justify-between py-2 text-[13px] font-medium text-[#2D3435] hover:text-[#004493]"
                          >
                            {role.label}
                            {user[role.key as keyof UserProfile] && <span className="material-symbols-outlined text-[#004493] text-lg">check_circle</span>}
                          </button>
                        ))}
                      </div>

                      {/* Section: System Role */}
                      <div className="px-4 py-2">
                        <p className="text-[10px] font-bold text-[#727784] tracking-widest uppercase mb-2">System Role</p>
                        <button 
                          onClick={() => updateUserInfo(user.id, { isAdmin: !user.isAdmin })}
                          className="w-full flex items-center justify-between py-2 text-[13px] font-medium text-[#2D3435] hover:text-[#ff3b30]"
                        >
                          Administrator
                          {user.isAdmin && <span className="material-symbols-outlined text-[#ff3b30] text-lg">verified</span>}
                        </button>
                        <button 
                          onClick={() => updateUserInfo(user.id, { isStaff: !user.isStaff })}
                          className="w-full flex items-center justify-between py-2 text-[13px] font-medium text-[#2D3435] hover:text-[#004493]"
                        >
                          System Staff
                          {user.isStaff && <span className="material-symbols-outlined text-[#004493] text-lg">verified</span>}
                        </button>
                      </div>

                      {/* Section: Danger Zone */}
                      <div className="px-4 py-2 bg-red-50/50 border-t border-red-100">
                        <p className="text-[10px] font-bold text-red-500 tracking-widest uppercase mb-2">Danger Zone</p>
                        <button 
                          onClick={() => deleteUserAccount(user.id, user.nickname || 'Unknown')}
                          className="w-full flex items-center justify-between py-2 text-[13px] font-bold text-red-600 hover:text-red-700 transition-colors"
                        >
                          Delete Account
                          <span className="material-symbols-outlined text-red-500 text-lg">delete_forever</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                <div className="space-y-1">
                  <p className="font-label text-[10px] font-bold text-[#727784] tracking-widest uppercase">Nickname</p>
                  <div className="flex items-baseline gap-2">
                    <span className="font-semibold text-[#2D3435]">{user.nickname}</span>
                    <span className="text-xs text-[#c2c6d5] font-medium">{user.nativeNickname}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="font-label text-[10px] font-bold text-[#727784] tracking-widest uppercase">Dance Role</p>
                  <p className="text-sm font-semibold text-[#2D3435] capitalize">{user.role || 'Not Set'}</p>
                </div>
                <div className="space-y-1">
                  <p className="font-label text-[10px] font-bold text-[#727784] tracking-widest uppercase">Joined</p>
                  <p className="text-sm font-medium text-[#2D3435]">{user.createdAt ? format(user.createdAt.toDate(), 'MMM dd, yyyy') : '-'}</p>
                </div>
                <div className="space-y-1">
                  <p className="font-label text-[10px] font-bold text-[#727784] tracking-widest uppercase">Visit</p>
                  <p className="text-sm font-medium text-[#2D3435]">{user.updatedAt ? formatDistanceToNow(user.updatedAt.toDate(), { addSuffix: true, locale: ko }) : '-'}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </section>

      {/* Pagination */}
      {totalPages > 1 && (
        <nav className="flex items-center justify-center gap-2 pt-4">
          <button 
            onClick={() => paginate(currentPage - 1)}
            disabled={currentPage === 1}
            className={`h-8 w-8 flex items-center justify-center rounded-[4px] transition-colors ${currentPage === 1 ? "text-[#c2c6d5] cursor-not-allowed" : "hover:bg-[#e2e9ea] text-[#424753]"}`}
          >
            <span className="material-symbols-outlined text-lg">chevron_left</span>
          </button>
          
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((number) => (
            <button 
              key={number}
              onClick={() => paginate(number)}
              className={`h-8 w-8 flex items-center justify-center rounded-[4px] font-bold text-sm transition-all duration-200 ${currentPage === number ? "bg-[#004493] text-white shadow-md transform scale-110" : "hover:bg-[#e2e9ea] text-[#2D3435]"}`}
            >
              {number}
            </button>
          ))}

          <button 
            onClick={() => paginate(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={`h-8 w-8 flex items-center justify-center rounded-[4px] transition-colors ${currentPage === totalPages ? "text-[#c2c6d5] cursor-not-allowed" : "hover:bg-[#e2e9ea] text-[#424753]"}`}
          >
            <span className="material-symbols-outlined text-lg">chevron_right</span>
          </button>
        </nav>
      )}
    </main>
  );
}
