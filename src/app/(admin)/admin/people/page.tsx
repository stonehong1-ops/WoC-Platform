"use client";

import React, { useState, useEffect, useRef } from 'react';
import { db } from '@/lib/firebase/clientApp';
import { collection, query, onSnapshot, orderBy, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { format } from 'date-fns';
import { UserProfile } from '@/types/user';
import { toast } from 'sonner';

export default function AdminPeoplePage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'engagement' | 'joinDate' | 'lastVisit'>('engagement');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [visibleCount, setVisibleCount] = useState(10);
  const itemsPerPage = 10;
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const userList = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as UserProfile[];
      setUsers(userList);
      setLoading(false);
    }, () => setLoading(false));
    return () => unsubscribe();
  }, []);

  const toggleSort = (field: 'engagement' | 'joinDate' | 'lastVisit') => {
    if (sortBy === field) setSortDir(prev => prev === 'desc' ? 'asc' : 'desc');
    else { setSortBy(field); setSortDir('desc'); }
    setVisibleCount(10);
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setOpenMenuId(null);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const updateUserInfo = async (userId: string, data: Partial<UserProfile>) => {
    try { await updateDoc(doc(db, 'users', userId), data); } catch { toast.error("An error occurred while updating."); }
  };
  const deleteUserAccount = async (userId: string, nickname: string) => {
    if (!window.confirm(`Are you sure you want to delete ${nickname}'s account?\nThis action cannot be undone.`)) return;
    try { await deleteDoc(doc(db, 'users', userId)); await deleteDoc(doc(db, 'groups', 'freestyle-tango', 'members', userId)); toast.success(`${nickname}'s account has been deleted.`); setOpenMenuId(null); } catch { toast.error("An error occurred while deleting."); }
  };
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => { e.currentTarget.src = '/anonymous-user.png'; };

  const safeDate = (val: any): Date | null => {
    if (!val) return null;
    if (val.toDate) return val.toDate();
    if (val instanceof Date) return val;
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
  };
  const getEngagement = (user: UserProfile) => {
    if (!user.lastVisitedAt) return '-';
    const lastVisit = safeDate(user.lastVisitedAt);
    if (!lastVisit) return '-';
    const days = (Date.now() - lastVisit.getTime()) / (1000 * 60 * 60 * 24);
    if (days <= 1) return 'Top 2%';
    if (days <= 3) return 'Top 10%';
    if (days <= 7) return 'Top 25%';
    if (days <= 14) return 'Top 50%';
    return 'Inactive';
  };

  const getEngagementScore = (user: UserProfile) => {
    if (!user.lastVisitedAt) return 999;
    const lastVisit = safeDate(user.lastVisitedAt);
    if (!lastVisit) return 999;
    return (Date.now() - lastVisit.getTime()) / (1000 * 60 * 60 * 24);
  };

  const filteredUsers = users.filter(user => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return user.nickname?.toLowerCase().includes(q) || user.phoneNumber?.includes(searchQuery) || user.email?.toLowerCase().includes(q);
  });

  const sortedUsers = [...filteredUsers].sort((a, b) => {
    const dir = sortDir === 'desc' ? -1 : 1;
    if (sortBy === 'engagement') {
      const sa = getEngagementScore(a);
      const sb = getEngagementScore(b);
      if (sa !== sb) return (sa - sb) * dir;
      return (a.nickname || "").localeCompare(b.nickname || "");
    } else if (sortBy === 'joinDate') {
      // '초' 단위까지만 비교 (밀리초 무시)
      const da = Math.floor((safeDate(a.createdAt)?.getTime() || 0) / 1000);
      const db2 = Math.floor((safeDate(b.createdAt)?.getTime() || 0) / 1000);
      if (da !== db2) return (da - db2) * dir;
      // 가입 초가 같을 경우 닉네임 순으로 2차 정렬
      return (a.nickname || "").localeCompare(b.nickname || "");
    } else {
      const da = Math.floor((safeDate(a.lastVisitedAt)?.getTime() || 0) / 1000);
      const db2 = Math.floor((safeDate(b.lastVisitedAt)?.getTime() || 0) / 1000);
      if (da !== db2) return (da - db2) * dir;
      return (a.nickname || "").localeCompare(b.nickname || "");
    }
  });

  const currentItems = sortedUsers.slice(0, visibleCount);

  return (
    <main className="max-w-[896px] mx-auto px-6 pt-4 pb-24 space-y-element-gap">
      <style jsx global>{`
        body { background-color: #F3F4F6; }
        .material-symbols-outlined {
          font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
        .custom-card {
          background-color: #FFFFFF;
          border-radius: 12px;
          border: 1px solid rgba(194, 198, 213, 0.3);
        }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* Search Bar Section - 유지하면서 하단 여백 조정 */}
      <div className="relative group">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
          <span className="material-symbols-outlined text-outline">search</span>
        </div>
        <input className="w-full bg-surface-container-lowest border-none h-14 pl-12 pr-14 rounded-xl shadow-sm focus:ring-2 focus:ring-primary-container text-body-md font-body-md" placeholder="Search by nickname or number" type="text" value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setVisibleCount(10); }} />
        <button className="absolute right-2 top-2 h-10 w-10 bg-primary-container text-on-primary-container rounded-lg flex items-center justify-center hover:scale-105 transition-transform">
          <span className="material-symbols-outlined">filter_list</span>
        </button>
      </div>

      {/* Filter Row */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
        <button onClick={() => toggleSort('engagement')} className={`flex items-center gap-1 px-4 py-2 rounded-full text-label-sm font-label-sm transition-all ${sortBy === 'engagement' ? 'bg-primary-container text-on-primary-container shadow-sm hover:shadow-md' : 'bg-white text-on-surface-variant border border-outline-variant hover:bg-surface-container transition-colors'}`}>
          Engagement
          <span className="material-symbols-outlined text-[16px]">{sortBy === 'engagement' ? 'arrow_drop_down' : 'swap_vert'}</span>
        </button>
        <button onClick={() => toggleSort('joinDate')} className={`flex items-center gap-1 px-4 py-2 rounded-full text-label-sm font-label-sm transition-all ${sortBy === 'joinDate' ? 'bg-primary-container text-on-primary-container shadow-sm hover:shadow-md' : 'bg-white text-on-surface-variant border border-outline-variant hover:bg-surface-container transition-colors'}`}>
          Join Date
          <span className="material-symbols-outlined text-[16px]">{sortBy === 'joinDate' ? 'arrow_drop_down' : 'swap_vert'}</span>
        </button>
        <button onClick={() => toggleSort('lastVisit')} className={`flex items-center gap-1 px-4 py-2 rounded-full text-label-sm font-label-sm transition-all ${sortBy === 'lastVisit' ? 'bg-primary-container text-on-primary-container shadow-sm hover:shadow-md' : 'bg-white text-on-surface-variant border border-outline-variant hover:bg-surface-container transition-colors'}`}>
          Last Visit
          <span className="material-symbols-outlined text-[16px]">{sortBy === 'lastVisit' ? 'arrow_drop_down' : 'swap_vert'}</span>
        </button>
      </div>

      {/* Member List - 여백을 시원하게 (mt-12) */}
      <div className="space-y-6 mt-12">
        {loading ? (
          <div className="py-20 text-center text-outline text-body-md animate-pulse">Loading data...</div>
        ) : currentItems.length === 0 ? (
          <div className="py-20 text-center text-outline">No items found.</div>
        ) : (
          /* ── User Cards (쿠폰 리스트와 일관성 있는 디자인) ── */
          currentItems.map((user) => (
            <div key={user.id} className="custom-card p-6 shadow-sm hover:shadow-md transition-all group relative">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-2xl bg-surface-container-high overflow-hidden border border-outline-variant/20">
                      <img className="w-full h-full object-cover" src={user.photoURL || '/anonymous-user.png'} alt={user.nickname} onError={handleImageError} />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-title-md font-title-md text-on-surface">{user.nickname}</h3>
                      {user.isAdmin && <span className="px-2 py-0.5 bg-error-container text-on-error-container text-[10px] font-bold rounded-md uppercase tracking-wider">ADMIN</span>}
                      {user.role === 'leader' && <span className="px-2 py-0.5 bg-tertiary-container/20 text-on-tertiary-fixed-variant text-[10px] font-bold rounded-md uppercase tracking-wider">Leader</span>}
                      {user.role === 'follower' && <span className="px-2 py-0.5 bg-secondary-container/20 text-on-secondary-fixed-variant text-[10px] font-bold rounded-md uppercase tracking-wider">Follower</span>}
                    </div>
                    <p className="text-body-md font-body-md text-on-surface-variant">{user.phoneNumber || '-'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] font-bold text-outline uppercase tracking-widest">Role Control</span>
                    <select className="mt-1 bg-surface-container-low border-none rounded-lg text-label-sm font-label-sm text-primary focus:ring-primary py-1 pl-3 pr-8 cursor-pointer" value={user.isAdmin ? 'admin' : (user.role || 'member')} onChange={(e) => { const v = e.target.value; if (v === 'admin') updateUserInfo(user.id, { isAdmin: true }); else if (v === 'leader') updateUserInfo(user.id, { role: 'leader', isAdmin: false }); else if (v === 'follower') updateUserInfo(user.id, { role: 'follower', isAdmin: false }); else updateUserInfo(user.id, { role: undefined, isAdmin: false }); }}>
                      <option value="admin">Admin</option>
                      <option value="leader">Leader</option>
                      <option value="follower">Follower</option>
                      <option value="member">Member</option>
                    </select>
                  </div>
                  <div className="relative">
                    <button onClick={() => setOpenMenuId(openMenuId === user.id ? null : user.id)} className="h-10 px-3 flex items-center justify-center gap-2 border border-outline-variant rounded-xl hover:bg-surface-container transition-colors">
                      <span className="material-symbols-outlined text-[20px]">more_vert</span>
                    </button>
                    {openMenuId === user.id && (
                      <div ref={menuRef} className="absolute right-0 top-12 w-56 bg-surface-container-lowest rounded-xl shadow-2xl border border-outline-variant z-20 py-2">
                        <div className="px-4 py-2">
                          <button onClick={() => deleteUserAccount(user.id, user.nickname || 'Unknown')} className="w-full flex items-center justify-between py-2 text-label-sm font-label-sm text-error hover:bg-error-container/10 px-2 rounded-lg transition-colors">Delete Account <span className="material-symbols-outlined text-error text-lg">delete_forever</span></button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="mt-6 pt-6 border-t border-slate-100 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-outline uppercase tracking-widest">Join Date</p>
                  <p className="text-body-md font-body-md text-on-surface">{safeDate(user.createdAt) ? format(safeDate(user.createdAt)!, 'yyyy.MM.dd HH:mm') : '-'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-outline uppercase tracking-widest">Notification</p>
                  <p className="text-body-md font-body-md text-on-surface flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-secondary"></span> ON
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-outline uppercase tracking-widest">Last Visit</p>
                  <p className="text-body-md font-body-md text-on-surface">{safeDate(user.lastVisitedAt) ? format(safeDate(user.lastVisitedAt)!, 'yyyy.MM.dd HH:mm') : '-'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-outline uppercase tracking-widest">Engagement</p>
                  <p className="text-body-md font-body-md text-primary font-bold">{getEngagement(user)}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 수동 더 보기 버튼 */}
      {visibleCount < sortedUsers.length && (
        <div className="flex flex-col items-center justify-center py-16 gap-6">
          <div className="w-12 h-1 bg-outline-variant/30 rounded-full"></div>
          <button 
            onClick={() => setVisibleCount(prev => prev + itemsPerPage)}
            className="group relative px-8 py-4 bg-white text-on-surface border border-outline-variant rounded-2xl font-title-md shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all active:scale-95 flex items-center gap-3 overflow-hidden"
          >
            <div className="absolute inset-0 bg-primary-container/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <span className="material-symbols-outlined text-primary group-hover:rotate-180 transition-transform duration-500">expand_more</span>
            <span className="relative z-10">Load More ({currentItems.length} / {sortedUsers.length})</span>
            <span className="material-symbols-outlined text-primary group-hover:rotate-180 transition-transform duration-500">expand_more</span>
          </button>
        </div>
      )}

      {/* Aesthetic Empty/Footer Placeholder */}
      <div className="py-20 flex flex-col items-center justify-center text-center opacity-30">
        <span className="material-symbols-outlined text-[48px] mb-2" style={{ fontVariationSettings: "'FILL' 1" }}>groups_2</span>
        <p className="text-[10px] font-bold uppercase tracking-[0.3em]">Community Pulse System v2.0</p>
      </div>
    </main>
  );
}
