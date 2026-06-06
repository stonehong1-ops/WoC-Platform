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
  const [sortBy, setSortBy] = useState<'engagement' | 'joinDate' | 'lastVisit'>('lastVisit');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [visibleCount, setVisibleCount] = useState(10);
  const itemsPerPage = 10;
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // 상단 탭 관리 상태
  const [activeTab, setActiveTab] = useState<'people' | 'stats1' | 'stats2' | 'stats3'>('people');
  // 상세 가입자 팝업창 관리 상태
  const [selectedDetail, setSelectedDetail] = useState<{ date: string; users: UserProfile[] } | null>(null);

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
    const q = searchQuery.trim().toLowerCase();
    const nick = (user.nickname || '').toLowerCase();
    const native = (user.nativeNickname || '').toLowerCase();
    const phone = (user.phoneNumber || '');
    const email = (user.email || '').toLowerCase();
    return nick.includes(q) || native.includes(q) || phone.includes(searchQuery) || email.includes(q);
  });

  const sortedUsers = [...filteredUsers].sort((a, b) => {
    const dir = sortDir === 'desc' ? -1 : 1;
    if (sortBy === 'engagement') {
      const sa = getEngagementScore(a);
      const sb = getEngagementScore(b);
      if (sa !== sb) return (sa - sb) * dir;
      return (a.nickname || "").localeCompare(b.nickname || "");
    } else if (sortBy === 'joinDate') {
      const da = Math.floor((safeDate(a.createdAt)?.getTime() || 0) / 1000);
      const db2 = Math.floor((safeDate(b.createdAt)?.getTime() || 0) / 1000);
      if (da !== db2) return (da - db2) * dir;
      return (a.nickname || "").localeCompare(b.nickname || "");
    } else {
      const da = Math.floor((safeDate(a.lastVisitedAt)?.getTime() || 0) / 1000);
      const db2 = Math.floor((safeDate(b.lastVisitedAt)?.getTime() || 0) / 1000);
      if (da !== db2) return (da - db2) * dir;
      return (a.nickname || "").localeCompare(b.nickname || "");
    }
  });

  const currentItems = sortedUsers.slice(0, visibleCount);

  // 날짜별 가입자 통계 가공 함수 (한국 표준시 KST 기준)
  const getStats1Data = () => {
    const statsMap: Record<string, { date: string; count: number; users: UserProfile[] }> = {};
    users.forEach(user => {
      const dateObj = safeDate(user.createdAt);
      if (!dateObj) return;

      // 한국 표준시 (KST, UTC+9) 적용 변환
      const kstDate = new Date(dateObj.getTime() + (9 * 60 * 60 * 1000));
      const yyyy = kstDate.getUTCFullYear();
      const mm = String(kstDate.getUTCMonth() + 1).padStart(2, '0');
      const dd = String(kstDate.getUTCDate()).padStart(2, '0');
      const dateStr = `${yyyy}-${mm}-${dd}`;

      if (!statsMap[dateStr]) {
        statsMap[dateStr] = { date: dateStr, count: 0, users: [] };
      }
      statsMap[dateStr].count += 1;
      statsMap[dateStr].users.push(user);
    });

    const sortedDates = Object.keys(statsMap).sort();
    let cumulative = 0;
    const result = sortedDates.map(date => {
      const item = statsMap[date];
      cumulative += item.count;

      let phoneCount = 0;
      let emailCount = 0;

      item.users.forEach(u => {
        const method = u.authMethod || '';
        const isPhone = method.toLowerCase() === 'phone' || !!u.phoneNumber;
        const isEmail = method.toLowerCase() === 'email' || method.toLowerCase() === 'password' || (!!u.email && !isPhone);
        
        if (isPhone) phoneCount++;
        else if (isEmail) emailCount++;
      });

      return {
        date,
        count: item.count,
        cumulative,
        users: item.users,
        phoneCount,
        emailCount
      };
    });

    // 오늘 날짜가 맨 위에 오도록 내림차순(역순)으로 정렬하여 반환
    return result.reverse();
  };

  // 친숙한 한글 가입 방식 표시 도우미
  const getAuthMethodKo = (user: UserProfile) => {
    const method = user.authMethod || '';
    if (method.toLowerCase() === 'phone') return '전화';
    if (method.toLowerCase() === 'google') return '구글';
    if (method.toLowerCase() === 'email' || method.toLowerCase() === 'password') return '이메일';
    if (method.toLowerCase() === 'apple') return '애플';
    if (user.phoneNumber) return '전화';
    if (user.email) return '이메일';
    return '기타';
  };

  return (
    <main className="max-w-[896px] mx-auto px-4 pt-4 pb-24 space-y-element-gap">
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
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in {
          animation: fadeIn 0.2s ease-out forwards;
        }
      `}</style>

      {/* 4단 탭 내비게이션 바 */}
      <div className="flex border border-outline-variant/30 mb-6 bg-white rounded-2xl p-1 shadow-sm gap-1">
        {(['people', 'stats1', 'stats2', 'stats3'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-3 text-center text-title-sm font-title-sm rounded-xl transition-all ${
              activeTab === tab
                ? 'bg-primary text-on-primary font-bold shadow-md hover:brightness-110'
                : 'text-outline hover:text-on-surface hover:bg-surface-container/40'
            }`}
          >
            {tab === 'people' && '피플'}
            {tab === 'stats1' && '통계1'}
            {tab === 'stats2' && '통계2'}
            {tab === 'stats3' && '통계3'}
          </button>
        ))}
      </div>

      {activeTab === 'people' && (
        <>
          {/* Search Bar Section */}
          <div className="relative group mb-4">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <span className="material-symbols-outlined text-outline">search</span>
            </div>
            <input 
              className="w-full bg-surface-container-lowest border-none h-14 pl-12 pr-14 rounded-xl shadow-sm focus:ring-2 focus:ring-primary-container text-body-md font-body-md" 
              placeholder="Search by nickname or number" 
              type="text" 
              value={searchQuery} 
              onChange={(e) => { setSearchQuery(e.target.value); setVisibleCount(10); }} 
            />
            <button className="absolute right-2 top-2 h-10 w-10 bg-primary-container text-on-primary-container rounded-lg flex items-center justify-center hover:scale-105 transition-transform">
              <span className="material-symbols-outlined">filter_list</span>
            </button>
          </div>

          {/* Filter Row - Unified Dropdown Select */}
          <div className="flex items-center gap-3 mb-6 bg-white p-2 px-3 rounded-2xl border border-outline-variant/30 shadow-sm w-fit">
            <div className="relative flex items-center">
              <span className="material-symbols-outlined absolute left-3 text-outline text-[18px] pointer-events-none">sort</span>
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value as 'engagement' | 'joinDate' | 'lastVisit');
                  setVisibleCount(10);
                }}
                className="bg-surface-container-low border border-outline-variant/50 text-on-surface rounded-xl pl-9 pr-8 py-2 text-xs font-bold focus:ring-2 focus:ring-primary focus:outline-none appearance-none cursor-pointer hover:bg-surface-container/60 transition-colors"
              >
                <option value="engagement">Engagement</option>
                <option value="joinDate">Join Date</option>
                <option value="lastVisit">Last Visit</option>
              </select>
              <span className="material-symbols-outlined absolute right-2.5 text-outline text-[16px] pointer-events-none">keyboard_arrow_down</span>
            </div>
            
            <button
              onClick={() => setSortDir(prev => prev === 'desc' ? 'asc' : 'desc')}
              className="h-8 px-3 bg-surface-container-low border border-outline-variant/50 rounded-xl flex items-center justify-center hover:bg-surface-container/60 transition-colors text-xs font-bold text-on-surface gap-1.5 shadow-sm active:scale-95 transition-all"
              title="정렬 방향 토글"
            >
              <span className="material-symbols-outlined text-[16px] font-bold">
                {sortDir === 'desc' ? 'arrow_downward' : 'arrow_upward'}
              </span>
              {sortDir === 'desc' ? '내림차순' : '오름차순'}
            </button>
          </div>

          {/* Member List */}
          <div className="space-y-6 mt-8">
            {loading ? (
              <div className="py-20 text-center text-outline text-body-md animate-pulse">Loading data...</div>
            ) : currentItems.length === 0 ? (
              <div className="py-20 text-center text-outline">No items found.</div>
            ) : (
              currentItems.map((user) => {
                const effectiveRole = user.role || (user.gender?.toLowerCase() === 'male' || user.gender?.toLowerCase() === 'man' ? 'leader' : 'follower');
                return (
                  <div key={user.id} className="custom-card p-6 shadow-sm hover:shadow-md transition-all group relative">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <div className="w-16 h-16 rounded-2xl bg-surface-container-high overflow-hidden border border-outline-variant/20">
                            <img className="w-full h-full object-cover" src={user.photoURL || '/anonymous-user.png'} alt={user.nickname} onError={handleImageError} />
                          </div>
                        </div>
                        <div>
                          {/* 닉네임 / 자국어 및 배지류 2줄 세로 병합 구조 - 가로 깨짐 방지 */}
                          <div className="flex flex-col gap-1.5 mb-1.5">
                            <h3 className="text-title-md font-title-md text-on-surface flex flex-wrap items-baseline gap-1.5 leading-snug">
                              {user.nickname}
                              {user.nativeNickname && (
                                <span className="text-[13px] text-on-surface-variant font-medium">({user.nativeNickname})</span>
                              )}
                            </h3>
                            <div className="flex flex-wrap gap-1.5">
                              {user.isAdmin && <span className="px-2 py-0.5 bg-error-container text-on-error-container text-[10px] font-bold rounded-md uppercase tracking-wider">ADMIN</span>}
                              {effectiveRole === 'leader' && <span className="px-2 py-0.5 bg-tertiary-container/20 text-on-tertiary-fixed-variant text-[10px] font-bold rounded-md uppercase tracking-wider">Leader</span>}
                              {effectiveRole === 'follower' && <span className="px-2 py-0.5 bg-secondary-container/20 text-on-secondary-fixed-variant text-[10px] font-bold rounded-md uppercase tracking-wider">Follower</span>}
                            </div>
                          </div>
                          <p className="text-body-md font-body-md text-on-surface-variant">{user.phoneNumber || '-'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col items-end">
                          <span className="text-[10px] font-bold text-outline uppercase tracking-widest mb-2">Role Control</span>
                          <div className="flex flex-wrap justify-end gap-3 max-w-[220px]">
                            <label className="flex items-center gap-1 cursor-pointer group">
                              <input type="checkbox" className="w-3.5 h-3.5 text-primary border-gray-300 rounded cursor-pointer" checked={!!user.isAdmin} onChange={(e) => updateUserInfo(user.id, { isAdmin: e.target.checked })} />
                              <span className="text-[11px] font-bold text-on-surface-variant group-hover:text-on-surface">Admin</span>
                            </label>
                            <label className="flex items-center gap-1 cursor-pointer group">
                              <input type="checkbox" className="w-3.5 h-3.5 text-primary border-gray-300 rounded cursor-pointer" checked={!!user.isInstructor} onChange={(e) => updateUserInfo(user.id, { isInstructor: e.target.checked })} />
                              <span className="text-[11px] font-bold text-on-surface-variant group-hover:text-on-surface">Instructor</span>
                            </label>
                            <label className="flex items-center gap-1 cursor-pointer group">
                              <input type="checkbox" className="w-3.5 h-3.5 text-primary border-gray-300 rounded cursor-pointer" checked={!!user.isOrganizer} onChange={(e) => updateUserInfo(user.id, { isOrganizer: e.target.checked })} />
                              <span className="text-[11px] font-bold text-on-surface-variant group-hover:text-on-surface">Organizer</span>
                            </label>
                            <label className="flex items-center gap-1 cursor-pointer group">
                              <input type="checkbox" className="w-3.5 h-3.5 text-primary border-gray-300 rounded cursor-pointer" checked={!!user.isDj} onChange={(e) => updateUserInfo(user.id, { isDj: e.target.checked })} />
                              <span className="text-[11px] font-bold text-on-surface-variant group-hover:text-on-surface">DJ</span>
                            </label>
                            <label className="flex items-center gap-1 cursor-pointer group">
                              <input type="checkbox" className="w-3.5 h-3.5 text-primary border-gray-300 rounded cursor-pointer" checked={!!user.isServiceProvider} onChange={(e) => updateUserInfo(user.id, { isServiceProvider: e.target.checked })} />
                              <span className="text-[11px] font-bold text-on-surface-variant group-hover:text-on-surface">Provider</span>
                            </label>
                          </div>
                        </div>
                        <div className="relative">
                          <button onClick={() => setOpenMenuId(openMenuId === user.id ? null : user.id)} className="h-10 px-3 flex items-center justify-center gap-2 border border-outline-variant rounded-xl hover:bg-surface-container transition-colors">
                            <span className="material-symbols-outlined text-[20px]">more_vert</span>
                          </button>
                          {openMenuId === user.id && (
                            <div ref={menuRef} className="absolute right-0 top-12 w-56 bg-surface-container-lowest rounded-xl shadow-2xl border border-outline-variant z-20 py-2">
                              <div className="px-4 py-2">
                                <button onClick={() => deleteUserAccount(user.id, user.nickname || 'Unknown')} className="w-full flex items-center justify-between py-2 text-label-sm font-label-sm text-error hover:bg-error-container/10 px-2 rounded-lg transition-colors font-bold">Delete Account <span className="material-symbols-outlined text-error text-lg">delete_forever</span></button>
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
                );
              })
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
        </>
      )}

      {/* 통계1 탭: 가입 날짜별 가입자 통계 및 역순 테이블 */}
      {activeTab === 'stats1' && (
        <div className="custom-card p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-outline-variant">
            <div>
              <h2 className="text-title-lg font-title-lg text-on-surface font-bold">날짜별 회원 가입 추이</h2>
              <p className="text-body-sm text-outline mt-1">한국 표준시(KST) 기준으로 실시간 집계된 일자별 신규 회원 및 누적 가입 데이터입니다.</p>
            </div>
            <span className="px-4 py-1.5 bg-primary-container text-on-primary-container text-title-sm font-bold rounded-full shadow-sm">
              총 {users.length}명
            </span>
          </div>
          <div className="overflow-x-auto rounded-xl border border-outline-variant/40">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low border-b border-outline-variant text-label-md font-bold text-outline">
                  <th className="py-4 px-6">가입 날짜 (KST)</th>
                  <th className="py-4 px-6 text-center">신규 가입자 수</th>
                  <th className="py-4 px-6 text-center">누적 회원 수</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/30 text-body-md">
                {getStats1Data().map((row) => (
                  <tr key={row.date} className="hover:bg-surface-container/30 transition-colors">
                    <td className="py-4 px-6 font-semibold text-on-surface">{row.date}</td>
                    <td className="py-4 px-6 text-center">
                      <div className="flex flex-col items-center gap-1.5">
                        <button 
                          onClick={() => setSelectedDetail({ date: row.date, users: row.users })}
                          className="px-4 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary font-extrabold rounded-full transition-all text-body-sm active:scale-95 shadow-sm hover:shadow-md cursor-pointer border border-primary/20"
                        >
                          {row.count}명
                        </button>
                        <span className="text-[10px] text-outline font-medium tracking-tight">
                          전화 {row.phoneCount} / 메일 {row.emailCount}
                        </span>
                        <span className="text-[10px] text-outline-variant font-medium tracking-tight max-w-[180px] truncate" title={row.users.map(u => u.nickname || '-').join(', ')}>
                          {row.users.map(u => u.nickname || '-').slice(0, 3).join(', ')}
                          {row.users.length > 3 ? '...' : ''}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-center text-on-surface-variant font-bold">{row.cumulative}명</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 통계2 탭: 준비 중 페이지 */}
      {activeTab === 'stats2' && (
        <div className="custom-card p-12 text-center shadow-sm flex flex-col items-center justify-center space-y-4 py-24">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-2">
            <span className="material-symbols-outlined text-[40px] text-primary animate-bounce">analytics</span>
          </div>
          <h3 className="text-title-lg font-title-lg text-on-surface font-bold">통계 2 준비 중입니다.</h3>
          <p className="text-body-md text-outline max-w-md">가입 채널별 분석 및 상세 그룹 활동 지수 통계 분석 기능이 추가될 예정입니다.</p>
        </div>
      )}

      {/* 통계3 탭: 준비 중 페이지 */}
      {activeTab === 'stats3' && (
        <div className="custom-card p-12 text-center shadow-sm flex flex-col items-center justify-center space-y-4 py-24">
          <div className="w-16 h-16 rounded-full bg-secondary/10 flex items-center justify-center mb-2">
            <span className="material-symbols-outlined text-[40px] text-secondary animate-pulse">query_stats</span>
          </div>
          <h3 className="text-title-lg font-title-lg text-on-surface font-bold">통계 3 준비 중입니다.</h3>
          <p className="text-body-md text-outline max-w-md">월간 활성 회원수(MAU) 및 일일 활동 회원수(DAU) 통계 등 리포팅 시스템이 구축될 예정입니다.</p>
        </div>
      )}

      {/* 풀스크린 상세 가입자 팝업 모달 */}
      {selectedDetail && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4 md:p-6 animate-fade-in">
          <div className="bg-white w-full max-w-[720px] max-h-[80vh] rounded-3xl shadow-2xl border border-outline-variant overflow-hidden flex flex-col transform scale-100 transition-all duration-300">
            {/* 모달 헤더 */}
            <div className="p-6 border-b border-outline-variant flex items-center justify-between bg-surface-container-lowest">
              <div>
                <h3 className="text-title-lg font-title-lg text-on-surface font-extrabold flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[28px]">calendar_today</span>
                  {selectedDetail.date} 신규 가입자 목록
                </h3>
                <p className="text-body-sm text-outline mt-1">총 {selectedDetail.users.length}명의 회원이 이날 가입했습니다.</p>
              </div>
              <button 
                onClick={() => setSelectedDetail(null)}
                className="w-10 h-10 rounded-full hover:bg-surface-container flex items-center justify-center transition-colors border border-outline-variant cursor-pointer"
              >
                <span className="material-symbols-outlined text-outline hover:text-on-surface">close</span>
              </button>
            </div>
            
            {/* 모달 바디 (표) */}
            <div className="p-6 overflow-y-auto flex-1 no-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-low border-b border-outline-variant text-label-md font-bold text-outline">
                    <th className="py-3 px-4">닉네임</th>
                    <th className="py-3 px-4">자국어 닉네임</th>
                    <th className="py-3 px-4 text-center">가입 방식</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/30 text-body-md">
                  {selectedDetail.users.map((user) => (
                    <tr key={user.id} className="hover:bg-surface-container/20 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-on-surface">{user.nickname || '-'}</td>
                      <td className="py-3.5 px-4 text-on-surface-variant font-medium">{user.nativeNickname || '-'}</td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-block px-3 py-1 rounded-full text-label-sm font-bold shadow-sm border ${
                          user.authMethod?.toLowerCase() === 'google' 
                            ? 'bg-red-50 text-red-600 border-red-100'
                            : user.authMethod?.toLowerCase() === 'phone'
                            ? 'bg-blue-50 text-blue-600 border-blue-100'
                            : 'bg-slate-50 text-slate-600 border-slate-100'
                        }`}>
                          {getAuthMethodKo(user)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* 모달 푸터 */}
            <div className="p-4 border-t border-outline-variant bg-surface-container-lowest flex justify-end gap-2">
              <button 
                onClick={() => setSelectedDetail(null)}
                className="px-6 py-2.5 bg-primary text-on-primary rounded-xl font-bold hover:brightness-110 active:scale-95 transition-all text-body-sm shadow-md cursor-pointer"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Aesthetic Empty/Footer Placeholder */}
      <div className="py-12 flex flex-col items-center justify-center text-center opacity-30">
        <span className="material-symbols-outlined text-[48px] mb-2" style={{ fontVariationSettings: "'FILL' 1" }}>groups_2</span>
        <p className="text-[10px] font-bold uppercase tracking-[0.3em]">Community Pulse System v2.0</p>
      </div>
    </main>
  );
}

