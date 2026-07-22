'use client';

import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase/clientApp';
import { groupService } from '@/lib/firebase/groupService';
import { useAuth } from '@/components/providers/AuthProvider';
import { useLanguage } from '@/contexts/LanguageContext';
import { PlatformUser } from '@/types/user';
import { Capacitor } from '@capacitor/core';
import { useBackButtonClose } from '@/hooks/useBackButtonClose';
import Portal from '@/components/common/Portal';
import { useNavigation } from '@/components/providers/NavigationProvider';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface OwnerEntry {
  userId: string;
  name: string;
  avatar?: string;
}

export default function CreateGroupModal({ isOpen, onClose, onSuccess }: CreateGroupModalProps) {
  const { t, language } = useLanguage();
  const { user, profile } = useAuth();
  const { setGlobalNavHidden } = useNavigation();

  // 하단 메뉴바 숨김 처리
  useEffect(() => {
    if (isOpen) {
      setGlobalNavHidden(true);
      return () => setGlobalNavHidden(false);
    }
  }, [isOpen, setGlobalNavHidden]);

  const [step, setStep] = useState(1);
  const TOTAL_STEPS = 2;

  // Step 1 State: Category & Location
  const [category, setCategory] = useState('Studio');
  const [venueType, setVenueType] = useState<'online' | 'venue' | ''>('venue');
  const [venueSearch, setVenueSearch] = useState('');
  const [venueResults, setVenueResults] = useState<any[]>([]);
  const [selectedVenue, setSelectedVenue] = useState<any>(null);
  const [venueSearchLoading, setVenueSearchLoading] = useState(false);

  // Step 2 State: Basic Info & Owners
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [joinPolicy, setJoinPolicy] = useState<'open' | 'approval' | 'invite'>('open');
  const [owners, setOwners] = useState<OwnerEntry[]>([]);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [userResults, setUserResults] = useState<PlatformUser[]>([]);
  const [allUsers, setAllUsers] = useState<PlatformUser[]>([]);
  const [showUserResults, setShowUserResults] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmClose, setShowConfirmClose] = useState(false);

  // 모달 자체 뒤로가기 바인딩 (클래스/이벤트와 동일 패턴)
  useBackButtonClose(isOpen, () => {
    if (showConfirmClose) {
      setShowConfirmClose(false);
    } else if (step > 1) {
      setStep(prev => prev - 1);
    } else {
      setShowConfirmClose(true);
    }
  });

  // 초기 로그인 유저를 기본 오너로 자동 포함
  useEffect(() => {
    if (user && isOpen && owners.length === 0) {
      setOwners([{
        userId: user.uid,
        name: profile?.nickname || (profile as any)?.name || user.displayName || 'Me',
        avatar: profile?.photoURL || user.photoURL || undefined
      }]);
    }
  }, [user, profile, isOpen, owners.length]);

  // 유저 목록 사전 로드 (오너 지정 검색용)
  useEffect(() => {
    if (!isOpen) return;
    const loadUsers = async () => {
      try {
        const snap = await getDocs(query(collection(db, 'users'), limit(100)));
        const list: PlatformUser[] = snap.docs.map(d => ({ id: d.id, ...d.data() } as PlatformUser));
        setAllUsers(list);
      } catch (err) {
        console.error('Failed to load users for group owner search:', err);
      }
    };
    loadUsers();
  }, [isOpen]);

  if (!isOpen) return null;

  // 장소 검색
  const handleVenueSearch = async (val: string) => {
    setVenueSearch(val);
    if (!val.trim()) {
      setVenueResults([]);
      return;
    }
    setVenueSearchLoading(true);
    try {
      const snap = await getDocs(query(collection(db, 'venues'), limit(20)));
      const filtered = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter((v: any) =>
          (v.name && v.name.toLowerCase().includes(val.toLowerCase())) ||
          (v.address && v.address.toLowerCase().includes(val.toLowerCase()))
        );
      setVenueResults(filtered);
    } catch (e) {
      console.error('Venue search error:', e);
    } finally {
      setVenueSearchLoading(false);
    }
  };

  // 오너 검색
  const handleUserSearch = (val: string) => {
    setUserSearchTerm(val);
    if (val.trim().length >= 1) {
      const lower = val.toLowerCase().trim();
      const filtered = allUsers.filter(u =>
        (u.nickname && u.nickname.toLowerCase().includes(lower)) ||
        (u.nativeNickname && u.nativeNickname.toLowerCase().includes(lower)) ||
        ((u as any).name && (u as any).name.toLowerCase().includes(lower))
      );
      setUserResults(filtered.slice(0, 8));
      setShowUserResults(true);
    } else {
      setShowUserResults(false);
      setUserResults([]);
    }
  };

  const handleAddOwner = (u: PlatformUser) => {
    if (owners.some(o => o.userId === u.id)) return;
    setOwners(prev => [...prev, {
      userId: u.id,
      name: u.nickname || u.nativeNickname || (u as any).name || 'User',
      avatar: u.photoURL || undefined
    }]);
    setUserSearchTerm('');
    setShowUserResults(false);
  };

  const handleAddFreeOwner = () => {
    if (!userSearchTerm.trim()) return;
    const text = userSearchTerm.trim();
    if (owners.some(o => o.name.toLowerCase() === text.toLowerCase())) return;
    setOwners(prev => [...prev, {
      userId: `custom_${Date.now()}`,
      name: text
    }]);
    setUserSearchTerm('');
    setShowUserResults(false);
  };

  const handleRemoveOwner = (index: number) => {
    setOwners(prev => prev.filter((_, i) => i !== index));
  };

  // 뒤로 가기 / 닫기
  const handleBack = () => {
    if (step > 1) {
      setStep(prev => prev - 1);
    } else {
      setShowConfirmClose(true);
    }
  };

  const handleConfirmExit = () => {
    setShowConfirmClose(false);
    onClose();
  };

  // 등록 제출
  const handleSubmit = async () => {
    if (!name.trim()) {
      alert(t('groups.alert_name_required') || '모임 이름을 입력해주세요.');
      return;
    }
    if (venueType === 'venue' && !selectedVenue) {
      alert(t('groups.alert_venue_required') || '장소를 선택해주세요.');
      return;
    }

    try {
      setIsSubmitting(true);
      const groupData: Partial<any> = {
        name: name.trim(),
        description: description.trim(),
        category,
        joinPolicy,
        isOnline: venueType === 'online',
        venueId: venueType === 'online' ? 'online' : (selectedVenue?.id || ''),
        address: venueType === 'online' ? 'Online' : (selectedVenue?.address || ''),
        locationDescription: venueType === 'online' ? 'Online' : (`${selectedVenue?.name || ''} (${selectedVenue?.address || ''})`),
        ownerId: user?.uid || '',
        owners: owners.map(o => ({ userId: o.userId, name: o.name, avatar: o.avatar || '' })),
        ownerIds: Array.from(new Set([user?.uid, ...owners.map(o => o.userId)].filter(Boolean))),
        memberIds: user?.uid ? [user.uid] : [],
        createdAt: new Date().toISOString()
      };

      await groupService.createGroup(groupData as any);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Group creation failed:', err);
      alert(err.message || t('groups.alert_create_failed') || '그룹 생성에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const CATEGORIES = [
    { id: 'Studio', label: '스튜디오', icon: 'domain', bg: 'bg-blue-50 text-blue-600' },
    { id: 'Shop', label: '마켓', icon: 'shopping_bag', bg: 'bg-purple-50 text-purple-600' },
    { id: 'Academy', label: '아카데미', icon: 'school', bg: 'bg-indigo-50 text-indigo-600' },
    { id: 'Stay', label: '스테이', icon: 'bed', bg: 'bg-pink-50 text-pink-600' },
    { id: 'Class', label: '클래스', icon: 'edit_road', bg: 'bg-emerald-50 text-emerald-600' },
    { id: 'Event', label: '이벤트', icon: 'calendar_month', bg: 'bg-orange-50 text-orange-600' },
    { id: 'Social', label: '소셜', icon: 'groups', bg: 'bg-amber-50 text-amber-600' },
    { id: 'Others', label: '기타', icon: 'more_horiz', bg: 'bg-slate-50 text-slate-500' }
  ];

  if (!isOpen) return null;

  return (
    <Portal>
      <div className="fixed inset-0 z-[160] bg-white flex flex-col h-full w-full overflow-hidden animate-in slide-in-from-bottom duration-300">
      {/* 표준 헤더 (Capacitor Safe Area 적용) */}
      <header
        className="bg-white px-4 pb-3 border-b border-[#e0e4e5] flex items-center justify-between shrink-0"
        style={{ paddingTop: Capacitor.isNativePlatform() ? 'max(env(safe-area-inset-top), 12px)' : '12px' }}
      >
        <button
          type="button"
          onClick={handleBack}
          className="w-9 h-9 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-700 transition-colors active:scale-95"
        >
          <span className="material-symbols-rounded text-xl">arrow_back</span>
        </button>
        
        <h1 className="text-[16px] font-bold text-slate-800 truncate">
          {t('groups.create_title') || '그룹(모임) 생성'}
        </h1>

        <div className="w-9"></div>
      </header>

      {/* 표준 스텝 바 */}
      <div className="max-w-xl mx-auto w-full px-4 mt-3 flex-shrink-0">
        <div className="flex items-center justify-between border border-slate-100 bg-slate-50/80 backdrop-blur rounded-2xl px-4 py-3 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-slate-700">
              {step} / {TOTAL_STEPS} 단계
            </span>
            <span className="text-xs font-bold text-[#007AFF] bg-[#007AFF]/10 px-2.5 py-0.5 rounded-full">
              {step === 1 ? '카테고리 & 장소' : '기본 정보 & 그룹 오너'}
            </span>
          </div>
          <div className="w-20 h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#007AFF] transition-all duration-300"
              style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* 메인 콘텐트 영역 */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 max-w-xl mx-auto w-full">
        {step === 1 && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* 카드 1: 카테고리 선택 */}
            <div className="border border-[#e0e4e5] rounded-2xl bg-white">
              <div className="bg-[#f8f9fa] px-4 py-3 border-b border-[#e0e4e5] flex items-center justify-between rounded-t-[15px]">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-rounded text-sm text-primary">category</span>
                  <p className="text-[14px] font-bold text-primary">{t('groups.form_category_label') || '카테고리 선택'}</p>
                </div>
              </div>
              <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all active:scale-95 ${
                      category === cat.id
                        ? 'border-primary bg-blue-50/50 text-primary font-bold shadow-sm'
                        : 'border-[#e0e4e5] bg-white text-slate-700 hover:bg-[#f8f9fa]'
                    }`}
                  >
                    <span className="material-symbols-rounded text-xl mb-1">{cat.icon}</span>
                    <span className="text-[12px]">{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 카드 2: 장소 설정 */}
            <div className="border border-[#e0e4e5] rounded-2xl bg-white">
              <div className="bg-[#f8f9fa] px-4 py-3 border-b border-[#e0e4e5] flex items-center justify-between rounded-t-[15px]">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-rounded text-sm text-primary">location_on</span>
                  <p className="text-[14px] font-bold text-primary">{t('groups.form_location_label') || '모임 장소 설정'}</p>
                </div>
              </div>
              <div className="p-4 space-y-4 text-left">
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setVenueType('venue');
                    }}
                    className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl border font-bold text-xs transition-all ${
                      venueType === 'venue'
                        ? 'border-primary bg-blue-50/50 text-primary shadow-sm'
                        : 'border-[#e0e4e5] text-slate-600 hover:bg-[#f8f9fa]'
                    }`}
                  >
                    <span className="material-symbols-rounded text-base">location_on</span>
                    오프라인 장소
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setVenueType('online');
                      setSelectedVenue(null);
                    }}
                    className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl border font-bold text-xs transition-all ${
                      venueType === 'online'
                        ? 'border-primary bg-blue-50/50 text-primary shadow-sm'
                        : 'border-[#e0e4e5] text-slate-600 hover:bg-[#f8f9fa]'
                    }`}
                  >
                    <span className="material-symbols-rounded text-base">laptop_chromebook</span>
                    온라인 모임
                  </button>
                </div>

                {venueType === 'venue' && (
                  <div className="space-y-3 pt-1">
                    <div className="relative">
                      <span className="material-symbols-rounded absolute left-3 top-2.5 text-slate-400 text-lg">search</span>
                      <input
                        type="text"
                        placeholder="등록된 스튜디오 및 베뉴 장소 검색..."
                        value={venueSearch}
                        onChange={e => handleVenueSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-[#e0e4e5] rounded-xl text-sm font-bold focus:outline-none focus:border-primary placeholder:text-[#acb3b4] placeholder:font-normal"
                      />
                    </div>

                    {venueSearchLoading && <p className="text-xs text-slate-400 p-2">검색 중...</p>}

                    {venueResults.length > 0 && (
                      <div className="border border-[#e0e4e5] rounded-xl max-h-40 overflow-y-auto divide-y divide-slate-100 bg-white">
                        {venueResults.map(v => (
                          <div
                            key={v.id}
                            onClick={() => {
                              setSelectedVenue(v);
                              setVenueResults([]);
                              setVenueSearch('');
                            }}
                            className="p-3 text-left hover:bg-[#f8f9fa] cursor-pointer transition-colors"
                          >
                            <p className="text-xs font-bold text-slate-800">{v.name}</p>
                            <p className="text-[10px] text-slate-500 mt-0.5">{v.address}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {selectedVenue && (
                      <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-xl flex justify-between items-center">
                        <div>
                          <p className="text-xs font-bold text-primary">{selectedVenue.name}</p>
                          <p className="text-[10px] text-slate-500 font-medium">{selectedVenue.address}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedVenue(null)}
                          className="text-slate-400 hover:text-slate-600 p-1"
                        >
                          <span className="material-symbols-rounded text-sm">close</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 animate-in fade-in duration-200 text-left">
            {/* 카드 1: 기본 정보 */}
            <div className="border border-[#e0e4e5] rounded-2xl bg-white">
              <div className="bg-[#f8f9fa] px-4 py-3 border-b border-[#e0e4e5] flex items-center justify-between rounded-t-[15px]">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-rounded text-sm text-primary">edit_note</span>
                  <p className="text-[14px] font-bold text-primary">그룹 기본 정보</p>
                </div>
              </div>
              <div className="p-4 space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">모임/그룹 이름</label>
                  <input
                    type="text"
                    placeholder="예: 탱고 서크 서울 (Tango Cirque)"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-[#e0e4e5] rounded-xl text-sm font-bold focus:outline-none focus:border-primary placeholder:text-[#acb3b4] placeholder:font-normal"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">그룹 대표 소개</label>
                  <textarea
                    placeholder="그룹의 활동 목적, 정기 모임 취지 등을 공유해주세요..."
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    rows={4}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-[#e0e4e5] rounded-xl text-sm font-bold focus:outline-none focus:border-primary resize-none placeholder:text-[#acb3b4] placeholder:font-normal"
                  />
                </div>
              </div>
            </div>

            {/* 카드 2: 가입 정책 */}
            <div className="border border-[#e0e4e5] rounded-2xl bg-white">
              <div className="bg-[#f8f9fa] px-4 py-3 border-b border-[#e0e4e5] flex items-center justify-between rounded-t-[15px]">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-rounded text-sm text-primary">shield_person</span>
                  <p className="text-[14px] font-bold text-primary">회원 가입 정책</p>
                </div>
              </div>
              <div className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { id: 'open', label: '자유 가입', icon: 'public', desc: '누구나 자유롭게 가입' },
                  { id: 'approval', label: '승인제', icon: 'verified_user', desc: '운영진 승인 후 가입' },
                  { id: 'invite', label: '초대 전용', icon: 'mail', desc: '초대를 받은 분만 가입' }
                ].map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setJoinPolicy(p.id as any)}
                    className={`p-3.5 rounded-xl border text-left transition-all ${
                      joinPolicy === p.id
                        ? 'border-primary bg-blue-50/50 shadow-sm'
                        : 'border-[#e0e4e5] bg-white hover:bg-[#f8f9fa]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`material-symbols-rounded text-lg ${joinPolicy === p.id ? 'text-primary' : 'text-slate-400'}`}>{p.icon}</span>
                      <div className={`w-4 h-4 rounded-full border-2 ${joinPolicy === p.id ? 'border-primary bg-primary' : 'border-slate-300'}`}></div>
                    </div>
                    <p className="font-bold text-xs text-slate-800">{p.label}</p>
                    <p className="text-[10px] text-slate-500 font-medium">{p.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* 카드 3: 그룹 오너 (관리자) 지정 */}
            <div className="border border-[#e0e4e5] rounded-2xl bg-white">
              <div className="bg-[#f8f9fa] px-4 py-3 border-b border-[#e0e4e5] flex items-center justify-between rounded-t-[15px]">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-rounded text-sm text-primary">stars</span>
                  <p className="text-[14px] font-bold text-primary">그룹 오너 (공동 운영진)</p>
                </div>
              </div>

              {/* 오너 둥근 칩 수평 배지 패널 */}
              {owners.length > 0 && (
                <div className="px-4 pt-3.5 flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                  {owners.map((o, idx) => (
                    <div
                      key={o.userId || idx}
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-[#e0e4e5] rounded-full text-xs font-bold shrink-0 shadow-sm"
                    >
                      <span>{o.name}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveOwner(idx)}
                        className="w-4 h-4 rounded-full bg-blue-200 text-blue-700 flex items-center justify-center hover:bg-blue-300 transition-colors"
                      >
                        <span className="material-symbols-rounded text-[12px]">close</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="p-4 relative">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="오너로 지정할 회원 이름/닉네임 검색..."
                    value={userSearchTerm}
                    onChange={e => handleUserSearch(e.target.value)}
                    className="w-full pl-3.5 pr-20 py-2.5 bg-slate-50 border border-[#e0e4e5] rounded-xl text-sm font-bold focus:outline-none focus:border-primary placeholder:text-[#acb3b4] placeholder:font-normal"
                  />
                  {userSearchTerm.trim() && (
                    <button
                      type="button"
                      onClick={handleAddFreeOwner}
                      className="absolute right-2 top-2 px-2.5 py-1 bg-primary text-white rounded-lg text-xs font-bold shadow-sm"
                    >
                      추가
                    </button>
                  )}
                </div>

                {showUserResults && userResults.length > 0 && (
                  <div className="absolute top-full left-0 w-full mt-1 bg-white border border-[#e0e4e5] rounded-xl shadow-lg max-h-48 overflow-y-auto z-20 divide-y divide-slate-100">
                    {userResults.map(u => (
                      <div
                        key={u.id}
                        onClick={() => handleAddOwner(u)}
                        className="p-3 flex items-center gap-2 hover:bg-[#f8f9fa] cursor-pointer transition-colors"
                      >
                        <div className="w-7 h-7 rounded-full bg-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                          {u.photoURL ? (
                            <img src={u.photoURL} alt={u.nickname || ''} className="w-full h-full object-cover" />
                          ) : (
                            <span className="material-symbols-rounded text-sm text-slate-500">person</span>
                          )}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-800">{u.nickname || u.nativeNickname || (u as any).name}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 표준 하단 버튼 (Capacitor Safe Area 적용) */}
      <div
        className="p-4 bg-white border-t border-[#e0e4e5] shrink-0"
        style={{ paddingBottom: Capacitor.isNativePlatform() ? 'max(env(safe-area-inset-bottom), 16px)' : '16px' }}
      >
        <div className="max-w-xl mx-auto">
          {step < TOTAL_STEPS ? (
            <button
              type="button"
              onClick={() => setStep(prev => prev + 1)}
              className="w-full py-3.5 rounded-full bg-[#007AFF] text-white font-bold text-sm shadow-sm transition-all active:scale-95"
            >
              다음 단계
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full py-3.5 rounded-full bg-[#007AFF] text-white font-bold text-sm shadow-sm transition-all active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? '등록 중...' : (language === 'KR' ? '등록' : 'Register')}
            </button>
          )}
        </div>
      </div>

      {/* 이탈 확인 팝업 */}
      {showConfirmClose && (
        <div className="fixed inset-0 z-[200] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 text-center space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-slate-800">그룹 등록을 중단하시겠습니까?</h3>
            <p className="text-xs text-slate-600">작성 중인 정보는 저장되지 않고 삭제됩니다.</p>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmClose(false)}
                className="flex-1 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-200"
              >
                계속 작성
              </button>
              <button
                type="button"
                onClick={handleConfirmExit}
                className="flex-1 py-2.5 bg-red-500 text-white font-bold rounded-xl text-xs hover:bg-red-600"
              >
                나가기
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </Portal>
  );
}
