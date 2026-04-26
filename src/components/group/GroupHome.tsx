"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { useJsApiLoader } from "@react-google-maps/api";
import { Group, Member, Post } from "@/types/group";
import { useAuth } from "@/components/providers/AuthProvider";
import { format } from "date-fns";
import { groupService } from "@/lib/firebase/groupService";
import ImageWithFallback from "@/components/common/ImageWithFallback";
import GroupJoinModal from "./GroupJoinModal";

type TabType = 'home' | 'calendar' | 'feed' | 'board' | 'info' | 'class' | 'class-manager' | 'members' | 'settings' | 'shop' | 'stay' | 'rental';

import GroupCalendar from "./GroupCalendar";
import GroupBoard from "./GroupBoard";
import GroupInfo from "./GroupInfo";
import GroupClassEditor from "./GroupClassEditor";
import GroupMemberManager from "./GroupMemberManager";
import GroupSettings from "./GroupSettings";
import UniversalFeed from "../feed/UniversalFeed";
import GroupShopEditor from "./GroupShopEditor";
import GroupStayEditor from "./GroupStayEditor";
import GroupRentalEditor from "./GroupRentalEditor";

export default function GroupHome({ group, isModal }: { group: Group, isModal?: boolean }) {
  const router = useRouter();
  const { user, profile } = useAuth();
  const [isJoining, setIsJoining] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [memberStatus, setMemberStatus] = useState<'active' | 'pending' | 'rejected' | 'none'>('none');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [selectedAdminIndex, setSelectedAdminIndex] = useState(0);
  const [isAdminDropdownOpen, setIsAdminDropdownOpen] = useState(false);

  const handleExit = () => {
    window.location.href = '/groups';
  };

  // 데이터 바인딩용 상태
  const [members, setMembers] = useState<Member[]>([]);
  const [noticePost, setNoticePost] = useState<Post | null>(null);
  const [moments, setMoments] = useState<Post[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries: ["places"]
  });

  // 실시간 멤버 상태 확인
  useEffect(() => {
    if (!user || !group.id) {
      setMemberStatus('none');
      return;
    }

    const unsubscribe = groupService.subscribeMembers(group.id, (fetchedMembers) => {
      setMembers(fetchedMembers);
      const myMemberInfo = fetchedMembers.find(m => m.id === user.uid);
      if (myMemberInfo) {
        setMemberStatus(myMemberInfo.status || 'active');
      } else {
        setMemberStatus('none');
      }
    });

    return () => unsubscribe();
  }, [user, group.id]);

  // 대시보드 데이터 연동
  useEffect(() => {
    if (!group.id) return;

    const unsubscribePosts = groupService.subscribePosts(group.id, (posts) => {
      const notice = posts.find(p => p.category?.toLowerCase() === 'notice') || posts[0] || null;
      setNoticePost(notice);

      const momentsPosts = posts.filter(p => !!p.image).slice(0, 5);
      setMoments(momentsPosts);
    });

    const unsubscribeEvents = groupService.subscribeCalendarEvents(group.id, (events) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const upcoming = events
        .filter(e => {
          const startTime = typeof e.startDate === 'number' ? e.startDate : new Date(e.startDate || 0).getTime();
          return startTime >= today.getTime();
        })
        .sort((a, b) => {
          const timeA = typeof a.startDate === 'number' ? a.startDate : new Date(a.startDate || 0).getTime();
          const timeB = typeof b.startDate === 'number' ? b.startDate : new Date(b.startDate || 0).getTime();
          return timeA - timeB;
        })
        .slice(0, 3);
      setUpcomingEvents(upcoming);
    });

    return () => {
      unsubscribePosts();
      unsubscribeEvents();
    };
  }, [group.id]);

  const genderStats = React.useMemo(() => {
    let male = 0;
    let female = 0;
    members.forEach((m: any) => {
      if (m.gender === 'male' || m.gender === 'M') male++;
      else if (m.gender === 'female' || m.gender === 'F') female++;
    });
    const total = male + female;
    if (total === 0) return { male: 45, female: 55 }; // 기본 비율 (데이터 없을 시)
    return {
      male: Math.round((male / total) * 100),
      female: Math.round((female / total) * 100)
    };
  }, [members]);

  const isFullMember = memberStatus === 'active';

  // Profile Setting completion states
  const profileCompleted = !!(group.name && group.coverImage);
  const membershipCompleted = !!group.membershipPolicy;
  const contactCompleted = !!(group.address || group.representative);
  const galleryCompleted = !!(group.gallery && group.gallery.length > 0);
  const boardCompleted = !!(group.boards && group.boards.length > 0);
  const settingsCompletedCount = [profileCompleted, membershipCompleted, contactCompleted, galleryCompleted, boardCompleted].filter(Boolean).length;
  const settingsProgressPercent = Math.round((settingsCompletedCount / 5) * 100);
  const canGoLive = settingsProgressPercent >= 30 || !!(group.coverImage && group.description);
  const [isPublishing, setIsPublishing] = useState(false);
  
  const [isClaiming, setIsClaiming] = useState(false);
  const isOwner = group.ownerId && user && group.ownerId === user.uid;
  const isLocked = group.isPublished === false && !isOwner;

  const admins = React.useMemo(() => {
    const adminMembers = members.filter(m => m.role === 'admin' || m.id === group.ownerId);
    if (adminMembers.length > 0) return adminMembers;
    if (group.representative) {
      return [{ id: 'rep', name: group.representative.name, avatar: group.representative.avatar, role: 'admin' }];
    }
    return [{ id: 'admin', name: 'Admin', avatar: '', role: 'admin' }];
  }, [members, group.ownerId, group.representative]);

  const currentAdmin = admins[selectedAdminIndex] || admins[0];

  const handleClaimAdmin = async () => {
    if (!user) {
      toast.error("로그인이 필요한 서비스입니다.", { description: "가입 요청 팝업으로 이동합니다.", duration: 3000 });
      setTimeout(() => setShowJoinModal(true), 1000);
      return;
    }

    setIsClaiming(true);
    try {
      const memberData = {
        name: profile?.nickname || user.displayName || 'Admin',
        avatar: profile?.photoURL || user.photoURL || '',
      };

      await groupService.claimGroupAdmin(group.id, user.uid, memberData);
      toast.success("어드민 권한을 획득했습니다!", { description: "그룹 세팅을 시작해 주세요." });
      
      // Auto reload to refresh server component / permissions
      window.location.reload();
    } catch (error) {
      console.error("Error claiming admin:", error);
      toast.error("어드민 권한 획득 중 오류가 발생했습니다.");
    } finally {
      setIsClaiming(false);
    }
  };

  const handleJoinAction = async () => {
    if (!user) {
      toast.error("로그인이 필요한 서비스입니다.");
      return;
    }

    const strategy = group.membershipPolicy?.joinStrategy || 'open';

    if (strategy === 'invite') {
      setShowJoinModal(true);
      return;
    }

    setIsJoining(true);
    try {
      const memberData = {
        name: profile?.nickname || 'Anonymous',
        avatar: profile?.photoURL || '',
        role: 'member',
        joinedAt: Date.now()
      };

      if (strategy === 'open') {
        await groupService.joinGroup(group.id, user.uid, memberData);
        setShowJoinModal(true); // "환영합니다" 팝업
      } else if (strategy === 'approval') {
        await groupService.requestJoinGroup(group.id, user.uid, memberData);
        setShowJoinModal(true); // "신청 완료" 팝업
      }
    } catch (error) {
      console.error("Error joining group:", error);
      toast.error("가입 처리 중 오류가 발생했습니다.");
    } finally {
      setIsJoining(false);
    }
  };

  const handleTabClick = (tab: TabType) => {
    // 메인(home)과 인포(info)는 누구나 접근 가능
    if (tab === 'home' || tab === 'info') {
      setActiveTab(tab);
      return;
    }

    // 그 외 메뉴는 정회원만 가능
    if (!isFullMember) {
      toast.error("가입 멤버만 이용 가능한 메뉴입니다.", {
        description: "가입 요청 팝업으로 이동합니다.",
        duration: 3000,
      });
      setTimeout(() => {
        setShowJoinModal(true);
      }, 1000);
      return;
    }

    if (tab === 'class' || tab === 'class-manager') {
      const isAdminUser = admins.some(a => a.id === user?.uid) || group.ownerId === user?.uid;
      if (!isAdminUser) {
        toast.error("클래스 관리는 관리자 전용 메뉴입니다.", { duration: 3000 });
        return;
      }
      setActiveTab(tab);
      return;
    }

    if (tab === 'board') {
      setActiveTab('board');
      return;
    }

    setActiveTab(tab);
  };

  const handleMenuClick = (tab: TabType) => {
    handleTabClick(tab);
    setIsMenuOpen(false);
  };

  const handleGoLive = async () => {
    if (!canGoLive || isPublishing) return;
    setIsPublishing(true);
    try {
      await groupService.publishGroup(group.id);
      toast.success("Group is now live!");
      // Optionally router.push to the main platform directory or refresh
      window.location.href = '/groups';
    } catch (error) {
      console.error("Error publishing group:", error);
      toast.error("Failed to publish the group.");
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="bg-[#F1F5F9] text-[#242c51] min-h-screen font-body relative pb-24">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;700;800&family=Inter:wght@400;500;600;700&display=swap');
        
        .font-headline { font-family: 'Plus Jakarta Sans', sans-serif; }
        .font-body { font-family: 'Inter', sans-serif; }
        
        .bg-blur-primary {
            background-image: radial-gradient(circle at top left, rgba(59, 130, 246, 0.08), transparent 45%);
        }
        
        .bg-blur-tertiary {
            background-image: radial-gradient(circle at bottom right, rgba(137, 60, 146, 0.08), transparent 45%);
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

      {/* Navigation Drawer (Sidebar) */}
      <aside className={`fixed inset-y-0 left-0 z-[100] flex flex-col py-8 bg-[#ffffff] h-full w-80 rounded-r-3xl shadow-2xl shadow-blue-900/10 font-headline text-sm font-medium transition-transform duration-300 ${isMenuOpen ? "translate-x-0" : "-translate-x-full"}`}>
        {/* Profile Header */}
        <div className="mx-4 mt-4 mb-6 p-5 bg-gradient-to-br from-[#f7f5ff] to-white rounded-2xl border border-[#a3abd7]/20 shadow-sm flex flex-col gap-4">
          <div className="flex items-start gap-4">
            <div className="relative group-header-avatar shrink-0">
              <div className="absolute -inset-1 bg-gradient-to-tr from-primary to-primary-container rounded-2xl blur opacity-15 group-hover:opacity-30 transition duration-1000"></div>
              {currentAdmin.avatar ? (
                <img 
                  src={currentAdmin.avatar} 
                  alt={currentAdmin.name} 
                  className="relative h-14 w-14 rounded-2xl object-cover border-2 border-surface shadow-sm" 
                />
              ) : (
                <div className="relative h-14 w-14 rounded-2xl bg-blue-100 flex items-center justify-center border-2 border-white shadow-sm">
                  <span className="material-symbols-outlined text-blue-500 text-3xl">person</span>
                </div>
              )}
            </div>
            
            <div className="flex flex-col pt-0.5 relative flex-1">
              <div className="flex items-center gap-1 text-left cursor-default">
                <h2 className="text-on-surface font-extrabold text-[18px] tracking-tight leading-none mb-1 line-clamp-1">
                  {currentAdmin.name}
                </h2>
              </div>
              
              <div className="flex flex-col gap-0.5 mt-1">
                <span className="text-emerald-700 text-[10px] font-black uppercase tracking-widest bg-emerald-100 border border-emerald-200/50 w-fit px-2 py-0.5 rounded-md shadow-sm">
                  Group Organizer
                </span>
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex gap-2">
            <button 
              onClick={(e) => {
                e.preventDefault();
                toast.info('채팅 기능은 준비 중입니다.');
              }}
              className="flex-1 flex items-center justify-center gap-1.5 bg-primary/10 hover:bg-primary/20 text-primary py-2 rounded-xl text-xs font-bold transition-colors cursor-not-allowed opacity-60"
            >
              <span className="material-symbols-outlined text-[16px]">chat</span>
              Chat
            </button>
            <a 
              href={group.representative?.phone ? `tel:${group.representative.phone}` : '#'}
              onClick={(e) => {
                if (!group.representative?.phone) {
                  e.preventDefault();
                  toast.error('등록된 전화번호가 없습니다.');
                }
              }}
              className="flex-1 flex items-center justify-center gap-1.5 bg-surface-variant hover:bg-on-surface/10 text-on-surface py-2 rounded-xl text-xs font-bold transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">call</span>
              Call
            </a>
          </div>
        </div>

        {/* Scrollable Menu Content */}
        <nav className="flex-1 overflow-y-auto px-4 space-y-6 hide-scrollbar">
          {/* Section: Navigation */}
          <div>
            <h3 className="px-2 mb-2 text-[10px] uppercase tracking-[0.15em] font-bold text-outline-variant">Navigation</h3>
            <a
              href="/groups"
              className="w-full flex items-center gap-3 px-4 py-3 text-[#242c51] hover:bg-[#f7f5ff] rounded-xl hover:translate-x-1 transition-transform duration-200 text-left"
            >
              <span className="material-symbols-outlined text-[#0057bd]">keyboard_return</span>
              <span>Return to Groups</span>
            </a>
          </div>

          {/* Section: Menu */}
          <div>
            <h3 className="px-2 mb-2 text-[10px] uppercase tracking-[0.15em] font-bold text-outline-variant">Menu</h3>
            <div className="space-y-1">
              {[
                { id: "home", icon: "home", label: "Dashboard" },
                { id: "calendar", icon: "calendar_today", label: "Calendar" },
                { id: "feed", icon: "rss_feed", label: "Feed" },
                { id: "board", icon: "forum", label: "Board" },
                { id: "info", icon: "info", label: "Info" },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleMenuClick(item.id as TabType)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-left ${activeTab === item.id ? 'bg-[#efefff] text-[#0057bd] font-bold' : 'text-[#242c51] hover:bg-[#f7f5ff] hover:translate-x-1'}`}
                >
                  <span className="material-symbols-outlined" style={activeTab === item.id ? { fontVariationSettings: "'FILL' 1" } : {}}>{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Section: App Settings */}
          <div>
            <h3 className="px-2 mb-2 text-[10px] uppercase tracking-[0.15em] font-bold text-outline-variant">App Settings</h3>
            <div className="space-y-1">
              <button
                onClick={() => handleMenuClick("settings")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-left ${activeTab === "settings" ? 'bg-[#efefff] text-[#0057bd] font-bold' : 'text-[#242c51] hover:bg-[#f7f5ff] hover:translate-x-1'}`}
              >
                <span className="material-symbols-outlined">person_edit</span>
                <span>Setup Profile</span>
              </button>

              {/* Toggles */}
              {[
                { id: 'class', label: 'Class Setting', icon: 'school', enabled: group.activeServices?.class },
                { id: 'shop', label: 'Shop Setting', icon: 'shopping_bag', enabled: group.activeServices?.shop },
                { id: 'stay', label: 'Stay Setting', icon: 'bed', enabled: group.activeServices?.stay },
                { id: 'rental', label: 'Rental Setting', icon: 'key', enabled: group.activeServices?.rental },
              ].map((service) => (
                <button
                  key={service.id}
                  onClick={() => handleMenuClick(service.id as TabType)}
                  className={`w-full flex items-center justify-between px-4 py-3 text-[#242c51] hover:bg-[#f7f5ff] rounded-xl group transition-all text-left ${activeTab === service.id ? 'bg-[#efefff] text-[#0057bd] font-bold' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined">{service.icon}</span>
                    <span>{service.label}</span>
                  </div>
                  <div className={`w-8 h-4 rounded-full relative transition-colors ${service.enabled ? 'bg-primary' : 'bg-outline-variant'}`}>
                    <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${service.enabled ? 'right-0.5' : 'left-0.5'}`}></div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Section: Admin */}
          <div className="pb-8">
            <h3 className="px-2 mb-2 text-[10px] uppercase tracking-[0.15em] font-bold text-outline-variant">Admin</h3>
            <button
              onClick={() => handleMenuClick("members")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-left ${activeTab === "members" ? 'bg-[#efefff] text-[#0057bd] font-bold' : 'text-[#242c51] hover:bg-[#f7f5ff] hover:translate-x-1'}`}
            >
              <span className="material-symbols-outlined">group</span>
              <span>Members</span>
              <span className="ml-auto bg-primary/10 text-primary text-[10px] font-black px-1.5 py-0.5 rounded-md">
                {group.memberCount || 0}
              </span>
            </button>
          </div>
        </nav>
      </aside>

      {/* Sidebar Overlay */}
      {isMenuOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[90] transition-opacity" onClick={() => setIsMenuOpen(false)} />
      )}


      {/* Atmospheric Background Effects */}
      <div className="fixed inset-0 pointer-events-none bg-blur-tertiary -z-10 bg-blur-primary"></div>

      {/* Header */}
      <header className="fixed top-0 w-full bg-slate-50/90 backdrop-blur-xl border-b border-slate-200/20 shadow-sm flex justify-between items-center px-4 h-16 z-50">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMenuOpen(true)}
            className="text-blue-600 hover:bg-slate-200/50 scale-95 active:scale-90 transition-transform p-2 rounded-full flex items-center justify-center"
          >
            <span className="material-symbols-outlined">menu</span>
          </button>
          <h1 className="font-headline font-bold text-lg text-blue-600 truncate max-w-[180px] sm:max-w-xs">{group.name}</h1>
        </div>
        <div className="flex items-center gap-1">
          <button className="text-blue-600 hover:bg-slate-200/50 scale-95 active:scale-90 transition-transform p-2 rounded-full flex items-center justify-center">
            <span className="material-symbols-outlined">search</span>
          </button>
          <a 
            href="/groups"
            className="text-blue-600 hover:bg-red-50 hover:text-red-500 scale-95 active:scale-90 transition-all p-2 rounded-full flex items-center justify-center"
          >
            <span className="material-symbols-outlined">logout</span>
          </a>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-16">
        {isLocked ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center mt-10">
             <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-3xl text-slate-400">lock</span>
             </div>
             <h2 className="text-xl font-bold text-slate-800 mb-2">아직 세팅되지 않은 그룹입니다</h2>
             <p className="text-slate-500 mb-6 max-w-sm">
                해당 커뮤니티의 어드민이시라면 권한을 획득하고 그룹을 활성화해 보세요.
             </p>
             {!group.ownerId && (
               <button 
                 onClick={handleClaimAdmin}
                 disabled={isClaiming}
                 className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-xl transition-colors shadow-sm disabled:opacity-50"
               >
                 {isClaiming ? "처리 중..." : "내가 여기 어드민입니다"}
               </button>
             )}
          </div>
        ) : (
          <>
            {activeTab === 'home' && (
          <>
            {/* Hero Section */}
            <section className="relative w-full aspect-[16/10] max-h-[500px]">
              <ImageWithFallback
                alt={group.name}
                className="object-cover w-full h-full"
                src={group.coverImage}
                fallbackType="cover"
                category={group.tags?.[0] || ''}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-6 md:p-12">
                <p className="text-white font-body text-base md:text-xl max-w-xl mb-6">
                  {group.description || "Connect, dance, and express yourself in the heart of our community."}
                </p>
                {memberStatus === 'none' || memberStatus === 'rejected' ? (
                  <button
                    onClick={handleJoinAction}
                    disabled={isJoining}
                    className="bg-[#0057bd] text-white font-bold py-3 px-10 rounded-full shadow-xl hover:bg-[#004ca6] transition-all w-fit uppercase tracking-widest text-sm disabled:opacity-50"
                  >
                    {isJoining ? 'Processing...' : 'Join Now'}
                  </button>
                ) : memberStatus === 'pending' ? (
                  <button
                    className="bg-amber-500 text-white font-bold py-3 px-10 rounded-full shadow-xl transition-all w-fit uppercase tracking-widest text-sm flex items-center gap-2"
                    onClick={() => setShowJoinModal(true)}
                  >
                    <span className="material-symbols-outlined text-sm">schedule</span>
                    Pending Approval
                  </button>
                ) : null}
              </div>
            </section>
          </>
        )}

        <div className={`max-w-7xl mx-auto ${activeTab === 'feed' ? 'px-0 md:px-0 mt-0 space-y-0 pb-0' : 'px-4 md:px-8 space-y-10 mt-8 pb-12'}`}>
          {activeTab === 'home' && (
            <>
              {/* Notice Section */}
              <div onClick={() => handleTabClick('board')} className="bg-white rounded-xl p-6 shadow-sm border border-[#a3abd7]/10 hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-headline font-bold text-xl text-[#242c51] flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#893c92]">campaign</span> Notice
                  </h3>
                </div>
                {noticePost ? (
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-[#b31b25]/5 border border-[#b31b25]/10">
                    <div className="bg-[#fb5151] text-[#ffefee] p-2 rounded-lg shrink-0">
                      <span className="material-symbols-outlined text-sm">priority_high</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-[#242c51] line-clamp-1">{noticePost.title}</h4>
                      <p className="text-xs text-[#515981] mt-0.5 line-clamp-1">{noticePost.content}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-[#b31b25]/5 border border-[#b31b25]/10">
                    <div className="bg-[#fb5151] text-[#ffefee] p-2 rounded-lg shrink-0">
                      <span className="material-symbols-outlined text-sm">priority_high</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-[#242c51]">Welcome to our new home!</h4>
                      <p className="text-xs text-[#515981] mt-0.5">Stay tuned for upcoming events and community updates.</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Moments Section */}
              <section>
                <div className="flex justify-between items-end mb-4">
                  <h2 className="font-headline font-extrabold text-2xl text-[#242c51]">Moments</h2>
                </div>
                <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar -mx-4 px-4 snap-x">
                  {moments.length > 0 ? (
                    moments.map((post) => (
                      <div key={post.id} onClick={() => handleTabClick('board')} className="shrink-0 w-64 aspect-video rounded-xl overflow-hidden shadow-sm snap-start moments-placeholder relative border border-[#a3abd7]/10 cursor-pointer group">
                        <ImageWithFallback src={post.image!} alt={post.title || "Moment"} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" fallbackType="gallery" />
                      </div>
                    ))
                  ) : (
                    [1, 2, 3].map((i) => (
                      <div key={i} className="shrink-0 w-64 aspect-video rounded-xl overflow-hidden shadow-sm snap-start moments-placeholder relative border border-[#a3abd7]/10">
                        <span className="material-symbols-outlined text-[#0057bd]/20 text-4xl">image</span>
                      </div>
                    ))
                  )}
                </div>
              </section>

              {/* Schedule Section Preview */}
              <section>
                <div className="flex justify-between items-end mb-6">
                  <div>
                    <h2 className="font-headline font-extrabold text-[#242c51] text-2xl">Upcoming Schedule</h2>
                    <p className="text-sm text-[#515981] mt-1">
                      {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {upcomingEvents.length > 0 ? (
                    upcomingEvents.map(event => {
                      const startTime = typeof event.startDate === 'number' ? event.startDate : new Date(event.startDate || 0).getTime();
                      const endTime = typeof event.endDate === 'number' ? event.endDate : new Date(event.endDate || 0).getTime();
                      
                      return (
                        <div
                          key={event.id}
                          onClick={() => handleTabClick('calendar')}
                          className="bg-white p-5 rounded-xl border border-[#a3abd7]/10 shadow-sm hover:shadow-md transition-all cursor-pointer relative overflow-hidden group"
                        >
                          <div className="absolute top-0 left-0 w-1 h-full bg-[#0057bd] group-hover:w-2 transition-all"></div>
                          <div className="flex justify-between items-start mb-3 pl-3">
                            <span className="bg-[#0057bd]/10 text-[#0057bd] font-label font-bold text-[10px] uppercase tracking-wider py-1 px-2 rounded-full">{event.type || 'Community'}</span>
                            <span className="text-[#515981] text-sm font-medium flex items-center gap-1">
                              <span className="material-symbols-outlined text-xs">schedule</span> {format(startTime, 'HH:mm')} - {format(endTime, 'HH:mm')}
                            </span>
                          </div>
                          <div className="pl-3">
                            <h3 className="font-headline font-bold text-lg text-[#242c51] mb-1 line-clamp-1">{event.title}</h3>
                            <p className="text-sm text-[#515981] mb-0 flex items-center gap-1 line-clamp-1">
                              <span className="material-symbols-outlined text-xs">location_on</span> {event.location || 'TBA'}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div
                      onClick={() => handleTabClick('calendar')}
                      className="bg-white p-5 rounded-xl border border-[#a3abd7]/10 shadow-sm hover:shadow-md transition-all cursor-pointer relative overflow-hidden group"
                    >
                      <div className="absolute top-0 left-0 w-1 h-full bg-[#0057bd] group-hover:w-2 transition-all"></div>
                      <div className="flex justify-between items-start mb-3 pl-3">
                        <span className="bg-[#0057bd]/10 text-[#0057bd] font-label font-bold text-[10px] uppercase tracking-wider py-1 px-2 rounded-full">Community</span>
                        <span className="text-[#515981] text-sm font-medium flex items-center gap-1">
                          <span className="material-symbols-outlined text-xs">schedule</span> TBA
                        </span>
                      </div>
                      <div className="pl-3">
                        <h3 className="font-headline font-bold text-lg text-[#242c51] mb-1">No upcoming events</h3>
                        <p className="text-sm text-[#515981] mb-0 flex items-center gap-1">
                          <span className="material-symbols-outlined text-xs">info</span> Check back later
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </section>

              {/* Community Pulse */}
              <section className="bg-white rounded-xl p-6 shadow-sm border border-[#a3abd7]/10">
                <h3 className="font-headline font-bold text-[#242c51] mb-6 flex items-center gap-2 text-2xl">
                  <span className="material-symbols-outlined text-[#0057bd]">analytics</span> Community Pulse
                </h3>
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-[#515981]">Members (Male / Female)</span>
                      <span className="font-bold text-[#0057bd]">{genderStats.male}% / {genderStats.female}%</span>
                    </div>
                    <div className="w-full bg-[#e4e7ff] rounded-full h-2.5 overflow-hidden flex">
                      <div className="bg-[#0057bd] h-full transition-all duration-1000" style={{ width: `${genderStats.male}%` }}></div>
                      <div className="bg-[#893c92] h-full transition-all duration-1000" style={{ width: `${genderStats.female}%` }}></div>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-[#a3abd7]/10 flex justify-between items-center">
                    <span className="text-[#515981] text-sm">Total Members</span>
                    <div className="flex items-center gap-1 font-headline font-bold text-xl text-[#242c51]">
                      <span className="material-symbols-outlined text-green-500">trending_up</span> {group.memberCount || members.length || 1}
                    </div>
                  </div>
                </div>
              </section>
            </>
          )}

          {activeTab === 'info' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <GroupInfo group={group} isLoaded={isLoaded} />
            </div>
          )}

          {activeTab === 'calendar' && isFullMember && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pt-4">
              <GroupCalendar group={group} />
            </div>
          )}

          {activeTab === 'feed' && isFullMember && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <UniversalFeed 
                context={{ scope: 'group', scopeId: group.id }} 
                currentUser={{
                  uid: user?.uid,
                  displayName: profile?.nickname || user?.displayName || 'Anonymous',
                  photoURL: profile?.photoURL || user?.photoURL || ''
                }}
              />
            </div>
          )}

          {activeTab === 'board' && isFullMember && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <GroupBoard group={group} />
            </div>
          )}

          {activeTab === 'class' && isFullMember && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <GroupClassEditor
                group={group}
              />
            </div>
          )}



          {activeTab === 'members' && isFullMember && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <GroupMemberManager group={group} />
            </div>
          )}

          {activeTab === 'settings' && isFullMember && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <header className="bg-[#f7f5ff] flex justify-between items-center px-6 py-4 w-full shadow-sm rounded-xl mb-6">
                <div className="flex items-center gap-4">
                  <h1 className="font-headline font-bold tracking-tight text-[#242c51] text-xl">Profile Setting</h1>
                </div>
                <div className="flex items-center gap-3">
                  <button className="hidden md:flex items-center gap-2 px-6 py-2 rounded-full bg-[#e8e6f0] text-[#3B82F6] font-bold text-sm transition-all active:scale-95">
                    <span className="material-symbols-outlined text-[18px]">visibility</span>
                    Preview
                  </button>
                  {group.isPublished ? (
                    <button className="flex items-center gap-2 px-6 py-2 rounded-full bg-emerald-100 text-emerald-700 font-bold text-sm cursor-default">
                      <span className="material-symbols-outlined text-[18px]">check_circle</span>
                      Published
                    </button>
                  ) : (
                    <button 
                      onClick={handleGoLive}
                      disabled={!canGoLive || isPublishing}
                      className={`flex items-center gap-2 px-6 py-2 rounded-full font-bold text-sm transition-all ${
                        canGoLive 
                          ? 'bg-[#3B82F6] text-white hover:bg-blue-600 active:scale-95 cursor-pointer shadow-md hover:shadow-lg' 
                          : 'bg-[#242c51]/10 text-[#242c51]/40 cursor-not-allowed'
                      }`}
                    >
                      {isPublishing ? 'Publishing...' : 'Go Live'}
                    </button>
                  )}
                </div>
              </header>

              <section className="p-6 md:p-10 max-w-6xl mx-auto w-full">
                <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                  <div className="max-w-2xl">
                    <h2 className="font-headline font-bold text-4xl md:text-5xl text-[#242c51] mb-4 leading-tight">Setup your business profile</h2>
                    <p className="text-[#515981] text-lg max-w-lg">Complete the mandatory configurations below to publish your platform and start accepting users.</p>
                  </div>
                  <div className="bg-white p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#a3abd7]/10">
                    <div className="flex items-center gap-4 mb-2">
                      <span className="text-3xl font-black text-[#3B82F6] font-headline">{settingsProgressPercent}%</span>
                      <div className="flex-1 h-3 bg-[#e4e7ff] rounded-full overflow-hidden min-w-[120px]">
                        <div className="h-full bg-gradient-to-r from-[#3B82F6] to-[#93c5fd]" style={{ width: `${settingsProgressPercent}%` }}></div>
                      </div>
                    </div>
                    <p className="text-xs font-bold text-[#515981]/60 uppercase tracking-widest">{settingsCompletedCount} of 5 steps finished</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-6 lg:grid-cols-12 gap-6 items-start">
                  {/* 1. Profile & Branding */}
                  <div className="md:col-span-3 lg:col-span-4 bg-white p-8 rounded-xl shadow-sm flex flex-col h-full border border-gray-100 hover:border-[#3B82F6]/20 transition-all">
                    <div className="mb-auto">
                      <div className="flex items-center justify-between mb-6">
                        <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-[#3B82F6]">
                          <span className="material-symbols-outlined">branding_watermark</span>
                        </div>
                        {profileCompleted ? (
                          <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">Completed</span>
                        ) : (
                          <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">Needs Edit</span>
                        )}
                      </div>
                      <h3 className="font-headline font-bold text-xl text-[#242c51] mb-2">1. Profile &amp; Branding</h3>
                      <p className="text-sm text-[#515981] leading-relaxed">Manage your business logo, brand colors, and public profile descriptions.</p>
                    </div>
                    <div className="mt-8 pt-6 border-t border-gray-50">
                      <button onClick={() => setActiveTab('info')} className="w-full py-3 rounded-lg bg-gray-50 text-[#242c51] font-bold text-sm hover:bg-[#3B82F6] hover:text-white transition-all">Edit</button>
                    </div>
                  </div>

                  {/* 2. Membership Policy */}
                  <div className="md:col-span-3 lg:col-span-4 bg-white p-8 rounded-xl shadow-sm flex flex-col h-full border border-gray-100 hover:border-[#3B82F6]/20 transition-all">
                    <div className="mb-auto">
                      <div className="flex items-center justify-between mb-6">
                        <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-[#3B82F6]">
                          <span className="material-symbols-outlined">verified_user</span>
                        </div>
                        {membershipCompleted ? (
                          <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">Completed</span>
                        ) : (
                          <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">Needs Edit</span>
                        )}
                      </div>
                      <h3 className="font-headline font-bold text-xl text-[#242c51] mb-2">2. Membership Policy</h3>
                      <p className="text-sm text-[#515981] leading-relaxed">Define your membership tiers, access rules, and terms of service for users.</p>
                    </div>
                    <div className="mt-8 pt-6 border-t border-gray-50">
                      <button onClick={() => setActiveTab('info')} className="w-full py-3 rounded-lg bg-gray-50 text-[#242c51] font-bold text-sm hover:bg-[#3B82F6] hover:text-white transition-all">Edit</button>
                    </div>
                  </div>

                  {/* 3. Contact Setting */}
                  <div className="md:col-span-3 lg:col-span-4 bg-white p-8 rounded-xl shadow-sm flex flex-col h-full border border-gray-100 hover:border-[#3B82F6]/20 transition-all">
                    <div className="mb-auto">
                      <div className="flex items-center justify-between mb-6">
                        <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-[#3B82F6]">
                          <span className="material-symbols-outlined">contact_mail</span>
                        </div>
                        {contactCompleted ? (
                          <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">Completed</span>
                        ) : (
                          <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">Needs Edit</span>
                        )}
                      </div>
                      <h3 className="font-headline font-bold text-xl text-[#242c51] mb-2">3. Contact Setting</h3>
                      <p className="text-sm text-[#515981] leading-relaxed">Update support emails, physical addresses, and emergency contact details.</p>
                    </div>
                    <div className="mt-8 pt-6 border-t border-gray-50">
                      <button onClick={() => setActiveTab('info')} className="w-full py-3 rounded-lg bg-gray-50 text-[#242c51] font-bold text-sm hover:bg-[#3B82F6] hover:text-white transition-all">Edit</button>
                    </div>
                  </div>

                  {/* 4. Gallery Setting */}
                  <div className="md:col-span-3 lg:col-span-4 bg-white p-8 rounded-xl shadow-sm flex flex-col h-full border border-gray-100 hover:border-[#3B82F6]/20 transition-all">
                    <div className="mb-auto">
                      <div className="flex items-center justify-between mb-6">
                        <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-[#3B82F6]">
                          <span className="material-symbols-outlined">collections</span>
                        </div>
                        {galleryCompleted ? (
                          <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">Completed</span>
                        ) : (
                          <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">Needs Edit</span>
                        )}
                      </div>
                      <h3 className="font-headline font-bold text-xl text-[#242c51] mb-2">4. Gallery Setting</h3>
                      <p className="text-sm text-[#515981] leading-relaxed">Upload high-resolution business assets, portfolio images, and media files.</p>
                    </div>
                    <div className="mt-8 pt-6 border-t border-gray-50">
                      <button onClick={() => setActiveTab('info')} className="w-full py-3 rounded-lg bg-gray-50 text-[#242c51] font-bold text-sm hover:bg-[#3B82F6] hover:text-white transition-all">Edit</button>
                    </div>
                  </div>

                  {/* 5. Board Setting */}
                  <div className="md:col-span-3 lg:col-span-4 bg-white p-8 rounded-xl shadow-sm flex flex-col h-full border border-gray-100 hover:border-[#3B82F6]/20 transition-all">
                    <div className="mb-auto">
                      <div className="flex items-center justify-between mb-6">
                        <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-[#3B82F6]">
                          <span className="material-symbols-outlined">assignment</span>
                        </div>
                        {boardCompleted ? (
                          <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">Completed</span>
                        ) : (
                          <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">Needs Edit</span>
                        )}
                      </div>
                      <h3 className="font-headline font-bold text-xl text-[#242c51] mb-2">5. Board Setting</h3>
                      <p className="text-sm text-[#515981] leading-relaxed">Configure your internal project boards, task tracking, and team permissions.</p>
                    </div>
                    <div className="mt-8 pt-6 border-t border-gray-50">
                      <button onClick={() => setActiveTab('board')} className="w-full py-3 rounded-lg bg-gray-50 text-[#242c51] font-bold text-sm hover:bg-[#3B82F6] hover:text-white transition-all">Edit</button>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          )}

          {activeTab === 'shop' && isFullMember && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <GroupShopEditor group={group} />
            </div>
          )}

          {activeTab === 'stay' && isFullMember && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <GroupStayEditor group={group} />
            </div>
          )}

          {activeTab === 'class-manager' && isFullMember && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="bg-transparent border-2 border-dashed border-gray-300 rounded-[12px] p-10 text-center flex flex-col items-center justify-center m-4">
                 <span className="material-symbols-outlined text-gray-400 text-4xl mb-2">construction</span>
                 <p className="text-gray-500 font-bold">Class Manager (TBD)</p>
                 <p className="text-gray-400 text-sm mt-2">출석관리, 개인상담기록, 온라인코칭 등의 기능이 제공될 예정입니다.</p>
              </div>
            </div>
          )}

          {activeTab === 'rental' && isFullMember && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <GroupRentalEditor group={group} />
            </div>
          )}

          {/* Footer Credits */}
          <footer className="pt-8 pb-4 text-center">
            <p className="text-xs text-[#515981]/60 font-body">© 2026 {group.name}. All rights reserved.</p>
          </footer>
        </div>
          </>
        )}
      </main>

      {/* Navigation Footer (5+1 Layout) */}
      {!isLocked && (
        <nav className="fixed bottom-0 left-0 w-full z-50 flex items-center px-4 bg-slate-50/95 backdrop-blur-2xl border-t border-slate-200/10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] h-16">
        <div className="flex flex-1 justify-between items-center px-2">
          <button
            onClick={() => handleTabClick('home')}
            className={`flex flex-col items-center gap-0.5 transition-all scale-100 active:scale-95 ${activeTab === 'home' ? 'text-blue-600' : 'text-slate-500'}`}
          >
            <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: activeTab === 'home' ? "'FILL' 1" : "" }}>grid_view</span>
            <span className="text-[9px] font-bold uppercase tracking-tighter">Dashboard</span>
          </button>
          <button
            onClick={() => handleTabClick('calendar')}
            className={`flex flex-col items-center gap-0.5 transition-all scale-100 active:scale-95 ${activeTab === 'calendar' ? 'text-blue-600' : 'text-slate-500'}`}
          >
            <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: activeTab === 'calendar' ? "'FILL' 1" : "" }}>calendar_today</span>
            <span className="text-[9px] font-bold uppercase tracking-tighter">Schedule</span>
          </button>
          <button
            onClick={() => handleTabClick('feed')}
            className={`flex flex-col items-center gap-0.5 transition-all scale-100 active:scale-95 ${activeTab === 'feed' ? 'text-blue-600' : 'text-slate-500'}`}
          >
            <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: activeTab === 'feed' ? "'FILL' 1" : "" }}>rss_feed</span>
            <span className="text-[9px] font-bold uppercase tracking-tighter">Feed</span>
          </button>
          <button
            onClick={() => handleTabClick('board')}
            className={`flex flex-col items-center gap-0.5 transition-all scale-100 active:scale-95 ${activeTab === 'board' ? 'text-blue-600' : 'text-slate-500'}`}
          >
            <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: activeTab === 'board' ? "'FILL' 1" : "" }}>forum</span>
            <span className="text-[9px] font-bold uppercase tracking-tighter">Board</span>
          </button>
          <button
            onClick={() => handleTabClick('info')}
            className={`flex flex-col items-center gap-0.5 transition-all scale-100 active:scale-95 ${activeTab === 'info' ? 'text-blue-600' : 'text-slate-500'}`}
          >
            <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: activeTab === 'info' ? "'FILL' 1" : "" }}>info</span>
            <span className="text-[9px] font-bold uppercase tracking-tighter">Info</span>
          </button>
        </div>
        <div className="w-px h-8 bg-slate-300 mx-3"></div>
        <div className="flex items-center px-2">
          <button
            onClick={() => handleTabClick('class-manager')}
            className={`flex flex-col items-center gap-0.5 transition-all scale-100 active:scale-95 ${activeTab === 'class-manager' ? 'text-blue-600' : 'text-slate-500'}`}
          >
            <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: activeTab === 'class-manager' ? "'FILL' 1" : "" }}>school</span>
            <span className="text-[9px] font-bold uppercase tracking-tighter">Manager</span>
          </button>
        </div>
        </nav>
      )}

      {/* Join Modal */}
      <GroupJoinModal
        isOpen={showJoinModal}
        onClose={() => setShowJoinModal(false)}
        groupName={group.name}
        adminName={group.representative?.name || 'Admin'}
        adminId={currentAdmin?.id || group.ownerId}
        strategy={group.membershipPolicy?.joinStrategy}
        onConfirm={() => {
          setShowJoinModal(false);
          setActiveTab('home');
        }}
      />
    </div>
  );
}
