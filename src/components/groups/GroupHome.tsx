"use client";
// 그룹 홈 메인 오케스트레이터 컴포넌트 - 전체 레이아웃 구성 및 라우팅 상태를 관리함.

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import { toast } from "sonner";

import { Group, Member } from "@/types/group";
import { useAuth } from "@/components/providers/AuthProvider";
import { useLanguage } from "@/contexts/LanguageContext";
import { useNavigation } from "@/components/providers/NavigationProvider";
import { useModalNavigation } from "@/hooks/useModalNavigation";

import ImageWithFallback from "@/components/common/ImageWithFallback";
import GroupJoinModal from "./GroupJoinModal";
import GroupAppShell from "./shell/GroupAppShell";
import ClubClassSelectionPage from "@/app/class/[groupId]/page";

import { FUNCTION_TAB_MAP, TabType } from '@/constants/groupTabs';
import { useGroupData } from "./hooks/useGroupData";
import GroupFeedSection from "./GroupFeedSection";
import GroupModuleRenderer from "./GroupModuleRenderer";

const MemberProfileOverlay = dynamic(() => import("./MemberProfileOverlay"));
const ChatRoomComponent = dynamic(() => import("../chat/ChatRoom"));

const PALETTE_COLORS = [
  "#0057bd", // WoC Blue
  "#1a1c23", // Dark
  "#2d3436", // Slate
  "#636e72", // Steel
  "#b2bec3", // Silver
  "#d63031", // Ruby
  "#e17055", // Coral
  "#fdcb6e", // Amber
  "#00b894", // Emerald
  "#00cec9", // Turquoise
  "#0984e3", // Azure
  "#6c5ce7", // Iris
  "#a29bfe", // Lavender
  "#e84393", // Fuchsia
  "#fd79a8", // Rose
];

export default function GroupHome({ group: initialGroup, isModal, onClose }: { group: Group, isModal?: boolean, onClose?: () => void }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { t } = useLanguage();
  const { user, profile } = useAuth();
  const { setGlobalNavHidden } = useNavigation();
  const { openModal: openClassFlow } = useModalNavigation('classFlow');

  // 커스텀 훅을 통한 모든 데이터 바인딩 로직 호출
  const {
    currentGroup,
    members,
    memberStatus,
    noticePost,
    moments,
    upcomingEvents,
    adminTodos,
    recentFeedPosts,
    allUsers,
    isJoining,
    isClaiming,
    admins,
    currentAdmin,
    isAdminUser,
    isFullMember,
    isLocked,
    safeFormat,
    safeFormatRelative,
    isPostNew,
    handleClaimAdmin,
    handleColorChange,
    handleJoinAction
  } = useGroupData({ initialGroup });

  const [localClassFlow, setLocalClassFlow] = useState<string | null>(null);
  const [localModalId, setLocalModalId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>(() => (searchParams.get('tab') as TabType) || 'home');

  // Claim Ownership Modal states (Pre-mounted GPU-accelerated)
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [claimOwnerName, setClaimOwnerName] = useState("");
  const [claimOwnerId, setClaimOwnerId] = useState("");
  const [claimResults, setClaimResults] = useState<any[]>([]);
  const [showClaimResults, setShowClaimResults] = useState(false);
  const [visitedTabs, setVisitedTabs] = useState<Set<TabType>>(new Set<TabType>(['home']));
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [selectedMoment, setSelectedMoment] = useState<any | null>(null);

  const [showJoinPromptSheet, setShowJoinPromptSheet] = useState(false);

  // URL searchParams와 로컬 상태(이중 안전 장치) 실시간 동기화
  useEffect(() => {
    const cf = searchParams.get('classFlow');
    const md = searchParams.get('modal');
    setLocalClassFlow(cf);
    setLocalModalId(md);
  }, [searchParams]);

  // URL의 ?tab= 파라미터가 변경되면 activeTab을 동기화
  useEffect(() => {
    const tabParam = searchParams.get('tab') as TabType | null;
    if (tabParam && tabParam !== activeTab) {
      setActiveTab(tabParam);
      setVisitedTabs(prev => { const newSet = new Set(prev); newSet.add(tabParam); return newSet; });
    }
  }, [searchParams]);

  // 모달 제어를 Query String으로 전환
  const showGroupChat = searchParams.get('modal') === 'chat';
  const showJoinModal = searchParams.get('modal') === 'join';
  const isExitModalOpen = searchParams.get('modal') === 'exit';

  const handleGroupChatClose = () => {
    router.back();
  };
  const handleJoinModalClose = () => {
    router.back();
  };
  const handleMomentViewerClose = () => {
    setSelectedMoment(null);
    router.back();
  };

  const handleCloseClassDetail = () => {
    setLocalClassFlow(null);
    setLocalModalId(null);
    const params = new URLSearchParams(searchParams.toString());
    params.delete('classFlow');
    params.delete('modal');
    if (!params.has('active')) {
      params.set('active', 'true');
    }
    const newQuery = params.toString();
    router.replace(`${pathname}${newQuery ? `?${newQuery}` : ''}`, { scroll: false });
  };

  // 안전한 Exit UX (Hybrid Trap + Exit Modal)
  const exitAttempted = useRef(false);
  const trapReady = useRef(false);

  // Trap 초기 셋업: active=true를 push하여 뒤로가기 1회분 방어벽 생성
  useEffect(() => {
    if (!searchParams.has('active') && !searchParams.has('modal')) {
      router.push(pathname + '?active=true', { scroll: false });
    }
  }, []);

  // Trap 준비 완료 감지 및 상태 리셋
  useEffect(() => {
    if (searchParams.has('active')) {
      trapReady.current = true;
      exitAttempted.current = false;
    }
  }, [searchParams]);

  // 이탈 감지: active도 modal도 없을 때 작동
  useEffect(() => {
    if (!trapReady.current) return;
    if (searchParams.has('active') || searchParams.has('modal')) return;

    if (!exitAttempted.current) {
      exitAttempted.current = true;
      router.push(pathname + '?modal=exit', { scroll: false });
    } else {
      if (onClose) {
        onClose();
      } else {
        router.replace('/groups');
      }
    }
  }, [searchParams]);

  // Stay: 트랩 복구 + 모달 닫기
  const handleStay = () => {
    exitAttempted.current = false;
    router.replace(pathname + '?active=true', { scroll: false });
  };

  // Leave: 그룹홈(/groups)으로 안전 이동
  const handleLeave = () => {
    if (onClose) {
      router.replace(pathname, { scroll: false });
      setTimeout(() => {
        onClose();
      }, 50);
    } else {
      router.replace('/groups', { scroll: false });
    }
  };

  useEffect(() => {
    setGlobalNavHidden(true);
    return () => setGlobalNavHidden(false);
  }, [setGlobalNavHidden]);

  // Prefetch: 그룹 활성 탭을 프리마운트하여 깜빡임 최소화
  useEffect(() => {
    const timer = setTimeout(() => {
      setVisitedTabs(prev => {
        const newSet = new Set(prev);
        newSet.add('about' as TabType);
        const selectedFns = initialGroup.selectedFunctions || [];
        selectedFns.forEach((fnId: string) => {
          const mapping = FUNCTION_TAB_MAP[fnId];
          if (mapping) newSet.add(mapping.id as TabType);
        });
        if (isAdminUser) {
          newSet.add('settings' as TabType);
          newSet.add('brand' as TabType);
          newSet.add('roles' as TabType);
        }
        return newSet;
      });
    }, 500);
    return () => clearTimeout(timer);
  }, [isAdminUser, initialGroup.selectedFunctions]);

  const handleExit = () => {
    if (onClose) {
      onClose();
    } else if (isModal) {
      router.back();
    } else {
      router.push('/groups');
    }
  };



  const handleTabClick = (tab: TabType) => {
    if (tab === 'settings' || tab === 'brand') {
      if (!isAdminUser) {
        toast(t('group.admin_only') || 'Admin only feature', { icon: '🔒' });
        return;
      }
    }

    if (tab === 'home' || tab === 'about' || tab === 'brand' || tab === 'settings') {
      setActiveTab(tab);
      setVisitedTabs(prev => { const newSet = new Set(prev); newSet.add(tab); return newSet; });
      const params = new URLSearchParams(searchParams.toString());
      if (tab === 'home') {
        params.delete('tab');
      } else {
        params.set('tab', tab);
      }
      const qs = params.toString();
      router.replace(pathname + (qs ? '?' + qs : ''), { scroll: false });
      return;
    }

    if (!isFullMember && !isAdminUser) {
      setShowJoinPromptSheet(true);
      return;
    }

    setActiveTab(tab);
    setVisitedTabs(prev => { const newSet = new Set(prev); newSet.add(tab); return newSet; });
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tab);
    const qs = params.toString();
    router.replace(pathname + (qs ? '?' + qs : ''), { scroll: false });
  };

  return (
    <div className="bg-background text-on-background min-h-screen font-body relative pb-24 antialiased">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;700;800&family=Inter:wght@400;500;600;700&display=swap');
        
        .font-headline { font-family: 'Plus Jakarta Sans', sans-serif; }
        .font-body { font-family: 'Inter', sans-serif; }

        @keyframes bounce-subtle {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-4px); }
        }
        .animate-bounce-subtle {
            animation: bounce-subtle 2s ease-in-out infinite;
        }

        .hide-scrollbar::-webkit-scrollbar {
            display: none;
        }
        .hide-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
        }

        .moments-placeholder {
            background: linear-gradient(135deg, #e4e7ff 0%, #d6dbff 100%);
            display: flex;
            align-items: center;
            justify-content: center;
        }
      `}</style>

      {/* ===== NEW APP SHELL ===== */}
      <GroupAppShell
        group={currentGroup}
        activeTab={activeTab}
        onTabClick={handleTabClick}
        onExit={handleExit}
        isAdmin={isAdminUser}
        isFullMember={isFullMember}
        members={members}
        paletteColors={PALETTE_COLORS}
        currentColor={currentGroup.headerThemeColor || '#1a1c23'}
        onColorChange={handleColorChange}
      >
        <></>
      </GroupAppShell>

      {/* Main Content */}
      <main className="pt-[120px] md:pt-[176px] pb-12">
        {isLocked ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center mt-10">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-3xl text-slate-400">lock</span>
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">{t('group.unsetup.title') || 'This group has not been set up yet'}</h2>
            <p className="text-slate-500 mb-6 max-w-sm">
              {t('group.unsetup.desc') || 'If you are the admin of this community, please claim your rights and activate the group.'}
            </p>
            <button
              onClick={() => setShowClaimModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-xl transition-colors shadow-sm"
            >
              {t('group.unsetup.claim') || "It's mine."}
            </button>
          </div>
        ) : (
          <div className={`max-w-7xl mx-auto ${activeTab === 'feed' || activeTab === 'home' || activeTab === 'live' || activeTab === 'calendar' || activeTab === 'board' || activeTab === 'members' || activeTab === 'about' || activeTab === 'settings' || activeTab === 'brand' || activeTab === 'class-setting' ? 'px-0 md:px-0 mt-0 space-y-0 pb-0' : 'px-4 md:px-8 space-y-10 mt-6 pb-12'}`}>
            
            {/* 1. 홈 피드 대시보드 탭 (Home) */}
            {visitedTabs.has('home') && (
              <div style={{ display: activeTab === 'home' ? 'block' : 'none' }}>
                <GroupFeedSection
                  currentGroup={currentGroup}
                  members={members}
                  isFullMember={isFullMember}
                  isAdminUser={isAdminUser}
                  noticePost={noticePost}
                  recentFeedPosts={recentFeedPosts}
                  upcomingEvents={upcomingEvents}
                  moments={moments}
                  adminTodos={adminTodos}
                  handleTabClick={handleTabClick}
                  safeFormat={safeFormat}
                  safeFormatRelative={safeFormatRelative}
                  isPostNew={isPostNew}
                  pathname={pathname}
                  t={t}
                />
              </div>
            )}

            {/* 2. 동적 모듈 탭 렌더러 (about, members, calendar, feed, class 등) */}
            <GroupModuleRenderer
              activeTab={activeTab}
              visitedTabs={visitedTabs}
              currentGroup={currentGroup}
              members={members}
              isFullMember={isFullMember}
              isAdminUser={isAdminUser}
              user={user}
              profile={profile}
              setSelectedMember={setSelectedMember}
              openClassFlow={openClassFlow}
              handleTabClick={handleTabClick}
            />

          </div>
        )}
      </main>

      {/* Join Modal */}
      <GroupJoinModal
        isOpen={showJoinModal}
        onClose={handleJoinModalClose}
        groupName={currentGroup.name}
        adminName={currentGroup.representative?.name || 'Admin'}
        adminId={currentAdmin?.id || currentGroup.ownerId}
        strategy={currentGroup.membershipPolicy?.joinStrategy}
        onConfirm={() => {
          handleJoinModalClose();
          handleTabClick('home');
        }}
      />

      {/* Class Detail Modal Overlay */}
      {localClassFlow === 'apply' ? (
        <ClubClassSelectionPage
          propGroupId={currentGroup.id}
          propModalId={localModalId || undefined}
          isOverlay={true}
          onClose={handleCloseClassDetail}
        />
      ) : null}

      {/* Fullscreen Group Chat Overlay */}
      {showGroupChat && (
        <div className="fixed inset-0 z-[9999] bg-background flex flex-col">
          <ChatRoomComponent
            roomId={`group_${currentGroup.id}`}
            onBack={handleGroupChatClose}
          />
        </div>
      )}

      {/* Fullscreen Moment Viewer Overlay */}
      <AnimatePresence>
        {selectedMoment && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[10000] bg-black/95 flex flex-col items-center justify-center backdrop-blur-md"
          >
            {/* Header */}
            <div className="absolute top-0 left-0 right-0 p-6 flex items-center justify-between z-10 bg-gradient-to-b from-black/60 to-transparent">
              <div className="flex items-center gap-3">
                {selectedMoment.authorPhoto ? (
                  <img src={selectedMoment.authorPhoto} alt={selectedMoment.authorName} className="w-10 h-10 rounded-full border-2 border-white/20 object-cover shadow-lg" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm border-2 border-white/20 shadow-lg">
                    {(selectedMoment.authorName || 'U').substring(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="flex flex-col">
                  <span className="font-body text-[15px] font-bold text-white shadow-sm">{selectedMoment.authorName || 'User'}</span>
                  <span className="font-body text-[11px] font-medium text-white/60">{safeFormatRelative(selectedMoment.createdAt)}</span>
                </div>
              </div>
              <button
                onClick={handleMomentViewerClose}
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white backdrop-blur-md border border-white/10 active:scale-90 transition-transform"
              >
                <span className="material-symbols-outlined text-[24px]">close</span>
              </button>
            </div>

            {/* Media Content */}
            <div className="relative w-full h-full flex items-center justify-center p-4" onClick={handleMomentViewerClose}>
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="max-w-full max-h-full rounded-2xl overflow-hidden shadow-2xl shadow-black/50"
                onClick={(e) => e.stopPropagation()}
              >
                <ImageWithFallback
                  src={selectedMoment.media?.[0] || ''}
                  alt={selectedMoment.caption || "Fullscreen"}
                  className="max-w-full max-h-[80vh] object-contain"
                  fallbackType="gallery"
                />
              </motion.div>
            </div>

            {/* Caption & Info Bar */}
            {selectedMoment.caption && (
              <div className="absolute bottom-0 left-0 right-0 p-10 pb-16 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex flex-col items-center gap-4">
                <p className="font-body text-[16px] md:text-[18px] font-medium text-white text-center max-w-2xl mx-auto leading-relaxed drop-shadow-lg">
                  {selectedMoment.caption}
                </p>
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-1.5 text-white/80">
                    <span className="material-symbols-outlined text-[20px]">favorite</span>
                    <span className="text-[14px] font-bold">{(selectedMoment as any).likesCount || 0}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-white/80">
                    <span className="material-symbols-outlined text-[20px]">chat_bubble</span>
                    <span className="text-[14px] font-bold">{(selectedMoment as any).commentsCount || 0}</span>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>



      {/* Exit Confirm Modal */}
      {isExitModalOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-auto overflow-hidden"
          >
            <div className="p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-rounded text-red-500 text-[24px]">logout</span>
              </div>
              <h2 className="text-lg font-black text-[#2d3435] mb-2">{t('group.exit.title')}</h2>
              <p className="text-sm text-[#596061] font-medium">{t('group.exit.message')}</p>
            </div>
            <div className="px-6 pb-6 pt-2 flex gap-3">
              <button
                onClick={handleStay}
                className="flex-1 py-3.5 rounded-xl border border-[#e0e4e5] text-sm font-bold text-[#596061] hover:bg-[#f8f9fa] transition-colors"
              >
                {t('group.exit.stay')}
              </button>
              <button
                onClick={handleLeave}
                className="flex-1 py-3.5 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 transition-colors shadow-sm"
              >
                {t('group.exit.leave')}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Non-Member Join Prompt Bottom Sheet */}
      <AnimatePresence>
        {showJoinPromptSheet && (
          <div className="fixed inset-0 z-[10000] flex flex-col justify-end bg-black/60 backdrop-blur-sm" onClick={() => setShowJoinPromptSheet(false)}>
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="bg-white w-full rounded-t-3xl p-6 shadow-2xl relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button 
                onClick={() => setShowJoinPromptSheet(false)}
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
              
              <div className="flex flex-col items-center text-center mt-6">
                <div className="w-16 h-16 bg-primary/10 flex items-center justify-center rounded-full mb-4">
                  <span className="material-symbols-outlined text-3xl text-primary">lock</span>
                </div>
                <h3 className="text-[18px] font-bold text-[#2d3435] mb-2 font-headline">
                  이 메뉴는 회원만 사용 가능합니다.
                </h3>
                <p className="text-[15px] text-[#596061] mb-8 font-body">
                  회원 가입을 먼저 진행해 주십시요.
                </p>
                
                <button
                  onClick={() => {
                    setShowJoinPromptSheet(false);
                    handleJoinAction();
                  }}
                  className="w-full h-14 bg-primary text-white font-bold rounded-xl text-[16px] active:scale-95 transition-all shadow-md font-body"
                >
                  커뮤니티 가입하기
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedMember && (
          <MemberProfileOverlay
            member={selectedMember}
            onClose={() => setSelectedMember(null)}
          />
        )}
      </AnimatePresence>

      {/* Claim Ownership Modal (GPU-accelerated Pre-mounted Overlay) */}
      <div 
        className={`fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-all duration-300 ${
          showClaimModal ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        style={{ willChange: "opacity" }}
        onClick={() => setShowClaimModal(false)}
      >
        <div 
          className={`bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-auto overflow-hidden transition-all duration-300 transform ${
            showClaimModal ? "scale-100 translate-y-0" : "scale-95 translate-y-4"
          }`}
          style={{ willChange: "transform" }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div className="px-6 pt-6 pb-4 border-b border-[#f2f4f4]">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-lg font-black text-[#2d3435]">{t('group.claim.title') || "Claim Group Admin"}</h2>
              <button
                onClick={() => setShowClaimModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors"
              >
                <span className="material-symbols-rounded text-[#acb3b4] text-[20px]">close</span>
              </button>
            </div>
            <p className="text-xs text-[#acb3b4] font-medium">{t('group.claim.desc') || "Search and designate the owner of this community."}</p>
          </div>

          {/* Group Info */}
          <div className="px-6 py-4 bg-[#f8f9fa] flex items-center gap-3 border-b border-[#f2f4f4]">
            {currentGroup.coverImage ? (
              <img src={currentGroup.coverImage} className="w-10 h-10 rounded-xl object-cover" alt="" />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <span className="material-symbols-rounded text-primary text-[20px]">group</span>
              </div>
            )}
            <div>
              <p className="font-bold text-[#2d3435] text-sm">{currentGroup.name}</p>
              <p className="text-[11px] text-[#acb3b4] font-medium">{t('group.claim.no_owner') || "No current admin"}</p>
            </div>
          </div>

          {/* Owner Search Input */}
          <div className="px-6 pt-5 pb-2">
            <label className="block text-[11px] font-bold text-[#acb3b4] uppercase tracking-wider mb-2">{t('group.claim.owner_label') || "Search Admin User"}</label>
            <div className="relative">
              <div className="relative flex items-center px-4 py-3 border border-[#e0e4e5] rounded-xl bg-[#f8f9fa] focus-within:bg-white focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                <span className="material-symbols-rounded text-[#acb3b4] mr-2 text-[20px]">person_filled</span>
                <input
                  value={claimOwnerName}
                  onChange={(e) => {
                    const val = e.target.value;
                    setClaimOwnerName(val);
                    setClaimOwnerId('');
                    if (val.length >= 1) {
                      const lower = val.toLowerCase();
                      const filtered = allUsers.filter(u =>
                        (u.nickname && u.nickname.toLowerCase().includes(lower)) ||
                        (u.nativeNickname && u.nativeNickname.includes(val))
                      );
                      setClaimResults(filtered.slice(0, 6));
                      setShowClaimResults(filtered.length > 0);
                    } else {
                      setShowClaimResults(false);
                      setClaimResults([]);
                    }
                  }}
                  onFocus={() => claimOwnerName.length >= 1 && setShowClaimResults(claimResults.length > 0)}
                  onBlur={() => setTimeout(() => setShowClaimResults(false), 200)}
                  className="flex-1 bg-transparent border-none p-0 focus:ring-0 text-sm font-bold text-[#2d3435] placeholder:text-[#acb3b4] outline-none"
                  placeholder={t('group.claim.search_placeholder') || "Enter name or nickname"}
                  type="text"
                />
                {claimOwnerId && (
                  <span className="material-symbols-rounded text-emerald-500 text-[18px]">check_circle</span>
                )}
              </div>
              {showClaimResults && (
                <div className="absolute top-full left-0 w-full mt-1 bg-white border border-[#e0e4e5] rounded-xl shadow-lg z-50 overflow-hidden">
                  {claimResults.map(u => (
                    <button
                      key={u.id}
                      onClick={() => {
                        setClaimOwnerName(u.nickname || u.nativeNickname || '');
                        setClaimOwnerId(u.id);
                        setShowClaimResults(false);
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-[#f8f9fa] flex items-center gap-3 group transition-colors border-b border-[#f2f4f4] last:border-0"
                    >
                      <span className="material-symbols-rounded text-[#acb3b4] text-[18px]">person</span>
                      <div className="flex flex-col">
                        <p className="font-bold text-[#2d3435] text-sm group-hover:text-primary leading-tight">{u.nickname}</p>
                        {u.nativeNickname && <span className="text-[10px] text-[#acb3b4] font-medium leading-tight">{u.nativeNickname}</span>}
                      </div>
                      {u.id === user?.uid && (
                        <span className="ml-auto text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">{t('group.claim.me') || "Me"}</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {claimOwnerId && (
              <p className="text-[11px] text-emerald-600 font-bold mt-1.5 flex items-center gap-1">
                <span className="material-symbols-rounded text-[14px]">check_circle</span>
                {t('group.claim.selected_badge') || "User selected successfully"}
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="px-6 pb-6 pt-4 flex gap-2">
            <button
              onClick={() => setShowClaimModal(false)}
              className="flex-1 py-3 rounded-xl border border-[#e0e4e5] text-sm font-bold text-[#596061] hover:bg-[#f8f9fa] transition-colors"
            >
              {t('group.claim.cancel') || "Cancel"}
            </button>
            <button
              onClick={async () => {
                if (!claimOwnerId) {
                  toast.error(t('group.claim.alert_select_user') || 'Please select a user first');
                  return;
                }
                try {
                  await handleClaimAdmin(claimOwnerId, claimOwnerName);
                  setShowClaimModal(false);
                } catch (e) {
                  toast.error(t('group.claim.error') || 'Failed to claim group admin');
                }
              }}
              disabled={isClaiming || !claimOwnerId}
              className="flex-1 py-3 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-colors disabled:opacity-50 shadow-sm"
            >
              {isClaiming ? (t('group.claim.saving') || "Saving...") : (t('group.claim.button') || "Claim")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
