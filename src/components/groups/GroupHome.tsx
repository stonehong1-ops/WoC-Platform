"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { useJsApiLoader } from "@react-google-maps/api";
import { Group, Member, Post } from "@/types/group";
import { useAuth } from "@/components/providers/AuthProvider";
import { format } from "date-fns";
import { groupService } from "@/lib/firebase/groupService";
import { notificationService } from "@/lib/firebase/notificationService";
import { Notification } from "@/types/notification";
import { galleryService, GalleryPost } from "@/lib/firebase/galleryService";
import ImageWithFallback from "@/components/common/ImageWithFallback";
import GroupJoinModal from "./GroupJoinModal";
import { useLanguage } from "@/contexts/LanguageContext";
import { useNavigation } from "@/components/providers/NavigationProvider";
import { getContrastColor } from "@/lib/utils";

type TabType = 'home' | 'calendar' | 'feed' | 'board' | 'about' | 'class' | 'members' | 'settings' | 'shop' | 'stay' | 'rental' | 'coupon' | 'live';

import GroupCalendar from "./GroupCalendar";
import GroupBoard from "./GroupBoard";
import GroupInfo from "./GroupInfo";
import GroupAbout from "./GroupAbout";
import GroupClassEditor from "./GroupClassEditor";
import GroupMemberManager from "./GroupMemberManager";
import GroupFunctionBuilder from "./GroupFunctionBuilder";
import UniversalFeed from "../feed/UniversalFeed";
import GroupShopEditor from "./GroupShopEditor";
import GroupStayEditor from "./GroupStayEditor";
import GroupRentalEditor from "./GroupRentalEditor";
import CouponAdmin from "./CouponAdmin";

import GroupBasicEditor from "./GroupBasicEditor";
import GroupMembershipEditor from "./GroupMembershipEditor";
import GroupContactEditor from "./GroupContactEditor";
import GroupGalleryEditor from "./GroupGalleryEditor";
import GroupBoardEditor from "./GroupBoardEditor";
import GroupAccountEditor from "./GroupAccountEditor";
import LiveFeed from "@/components/live/LiveFeed";
import ClassDetail from "../class/ClassDetail";

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

export default function GroupHome({ group: initialGroup, isModal }: { group: Group, isModal?: boolean }) {
  const router = useRouter();
  const { t } = useLanguage();
  const { user, profile } = useAuth();
  const { setGlobalNavHidden } = useNavigation();
  const [isJoining, setIsJoining] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [memberStatus, setMemberStatus] = useState<'active' | 'pending' | 'rejected' | 'none'>('none');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
   const [selectedAdminIndex, setSelectedAdminIndex] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const [currentGroup, setCurrentGroup] = useState<Group>(initialGroup);

  // 실시간 그룹 메타데이터 연동
  useEffect(() => {
    if (!initialGroup.id) return;
    const unsubscribe = groupService.subscribeGroup(initialGroup.id, (updatedGroup) => {
      if (updatedGroup) {
        setCurrentGroup(updatedGroup);
      }
    });
    return () => unsubscribe();
  }, [initialGroup.id]);

  useEffect(() => {
    setGlobalNavHidden(true);
    return () => setGlobalNavHidden(false);
  }, [setGlobalNavHidden]);

  const containerRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (containerRef.current) {
        const top = containerRef.current.getBoundingClientRect().top;
        // If the container's top is less than -60px, we've scrolled down 60px.
        setIsScrolled(top < -60);
      } else {
        // Fallback to window.scrollY
        setIsScrolled(window.scrollY > 60);
      }
    };
    
    // Use capture: true to catch scroll events from ANY scrollable container
    window.addEventListener('scroll', handleScroll, { passive: true, capture: true });
    // Initial check
    handleScroll();
    
    return () => window.removeEventListener('scroll', handleScroll, { capture: true } as EventListenerOptions);
  }, []);

  const handleExit = () => {
    if (isModal) {
      window.history.back();
    } else {
      router.push('/groups');
    }
  };

  // 데이터 바인딩용 상태
  const [members, setMembers] = useState<Member[]>([]);
  const [noticePost, setNoticePost] = useState<Post | null>(null);
  const [moments, setMoments] = useState<GalleryPost[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [adminTodos, setAdminTodos] = useState<Notification[]>([]);
  const [liveChats, setLiveChats] = useState<Post[]>([]);

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries: ["places"]
  });

  // 실시간 멤버 상태 확인
  useEffect(() => {
    if (!user || !currentGroup.id) {
      setMemberStatus('none');
      return;
    }

    const unsubscribe = groupService.subscribeMembers(currentGroup.id, (fetchedMembers) => {
      setMembers(fetchedMembers);
      const myMemberInfo = fetchedMembers.find(m => m.id === user.uid);
      if (myMemberInfo) {
        setMemberStatus(myMemberInfo.status || 'active');
      } else {
        setMemberStatus('none');
      }
    });

    return () => unsubscribe();
  }, [user, currentGroup.id]);

  // 대시보드 데이터 연동
  useEffect(() => {
    if (!currentGroup.id) return;

    const unsubscribePosts = groupService.subscribePosts(currentGroup.id, (posts) => {
      const notice = posts.find(p => p.category?.toLowerCase() === 'notice') || posts[0] || null;
      setNoticePost(notice);

      const chatPosts = posts.filter(p => p.category !== 'notice' && !p.image).slice(0, 2);
      setLiveChats(chatPosts);
    });

    const unsubscribeGallery = galleryService.subscribeFeed((galleryPosts) => {
      setMoments(galleryPosts.slice(0, 5));
    }, { entityType: 'group', entityId: currentGroup.id });

    const unsubscribeEvents = groupService.subscribeCalendarEvents(currentGroup.id, (events) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const upcoming = events
        .filter(e => {
          const endTime = typeof e.endDate === 'number' ? e.endDate : new Date(e.endDate || 0).getTime();
          return endTime >= today.getTime();
        })
        .sort((a, b) => {
          const timeA = typeof a.startDate === 'number' ? a.startDate : new Date(a.startDate || 0).getTime();
          const timeB = typeof b.startDate === 'number' ? b.startDate : new Date(b.startDate || 0).getTime();
          return timeA - timeB;
        })
        .slice(0, 10);
      setUpcomingEvents(upcoming);
    });

    return () => {
      unsubscribePosts();
      unsubscribeGallery();
      unsubscribeEvents();
    };
  }, [currentGroup.id]);

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
  
  const [isClaiming, setIsClaiming] = useState(false);
  const isOwner = currentGroup.ownerId && user && currentGroup.ownerId === user.uid;
  const isLocked = currentGroup.isPublished === false && !isOwner;

  const admins = React.useMemo(() => {
    const adminMembers = members.filter(m => m.role === 'admin' || m.id === currentGroup.ownerId);
    if (adminMembers.length > 0) return adminMembers;
    if (currentGroup.representative) {
      return [{ id: 'rep', name: currentGroup.representative.name, avatar: currentGroup.representative.avatar, role: 'admin' }];
    }
    return [{ id: 'admin', name: 'Admin', avatar: '', role: 'admin' }];
  }, [members, currentGroup.ownerId, currentGroup.representative]);

  const currentAdmin = admins[selectedAdminIndex] || admins[0];

  const isAdminUser = React.useMemo(() => {
    return admins.some(a => a.id === user?.uid) || currentGroup.ownerId === user?.uid;
  }, [admins, user, currentGroup.ownerId]);

  useEffect(() => {
    if (!user || !isAdminUser) return;
    
    const unsub = notificationService.subscribeToAdminTodos(user.uid, currentGroup.id, (todos) => {
      setAdminTodos(todos);
    });
    
    return () => unsub();
  }, [user, isAdminUser, currentGroup.id]);

  const handleClaimAdmin = async () => {
    if (!user) {
      toast.error("Sign-in required.", { description: "Redirecting to join request.", duration: 3000 });
      setTimeout(() => setShowJoinModal(true), 1000);
      return;
    }

    setIsClaiming(true);
    try {
      const memberData = {
        name: profile?.nickname || user.displayName || 'Admin',
        avatar: profile?.photoURL || user.photoURL || '',
      };

      await groupService.claimGroupAdmin(currentGroup.id, user.uid, memberData);
      toast.success("Admin access granted!", { description: "Please start group setup." });
      
      // Auto reload to refresh server component / permissions
      window.location.reload();
    } catch (error) {
      console.error("Error claiming admin:", error);
      toast.error("An error occurred while claiming admin access.");
    } finally {
      setIsClaiming(false);
    }
  };

  const handleColorChange = async (color: string) => {
    try {
      await groupService.updateGroupMetadata(currentGroup.id, {
        headerThemeColor: color
      });
      toast.success("Theme updated");
      setIsPaletteOpen(false);
    } catch (error) {
      console.error("Error updating theme color:", error);
      toast.error("Failed to update theme");
    }
  };

  const handleJoinAction = async () => {
    if (!user) {
      toast.error("Sign-in required.");
      return;
    }

    const strategy = currentGroup.membershipPolicy?.joinStrategy || 'open';

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
        await groupService.joinGroup(currentGroup.id, user.uid, memberData);
        setShowJoinModal(true); // "환영합니다" 팝업
      } else if (strategy === 'approval') {
        await groupService.requestJoinGroup(currentGroup.id, user.uid, memberData);
        setShowJoinModal(true); // "신청 완료" 팝업
      }
    } catch (error) {
      console.error("Error joining currentGroup:", error);
      toast.error("An error occurred while joining.");
    } finally {
      setIsJoining(false);
    }
  };

  const handleTabClick = (tab: TabType) => {
    // 메인(home)과 About(about)은 누구나 접근 가능
    if (tab === 'home' || tab === 'about') {
      setActiveTab(tab);
      window.scrollTo(0, 0);
      return;
    }

    // 그 외 메뉴는 정회원만 가능
    if (!isFullMember) {
      return; // Do nothing on click, as UI will show a lock
    }

    if (tab === 'class') {
      setActiveTab(tab);
      return;
    }

    if (tab === 'board') {
      setActiveTab('board');
      return;
    }

    setActiveTab(tab);
    window.scrollTo(0, 0);
  };

  const showSolidHeader = isScrolled || activeTab !== 'home';

  return (
    <div ref={containerRef} className="bg-background text-on-background min-h-screen font-body relative pb-24 antialiased">
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



      {/* Atmospheric Background Effects */}
      <div className="fixed inset-0 pointer-events-none bg-blur-tertiary -z-10 bg-blur-primary"></div>

      {/* Header */}
      <header 
        className={`fixed top-0 w-full z-50 flex justify-between items-center px-page-margin h-16 transition-all duration-300 ${
          showSolidHeader 
            ? 'shadow-lg border-b border-white/10' 
            : 'border-b border-transparent shadow-none'
        }`}
        style={{ 
          backgroundColor: showSolidHeader ? (currentGroup.headerThemeColor || "#1a1c23") : 'transparent',
          color: (showSolidHeader && getContrastColor(currentGroup.headerThemeColor || "#1a1c23") === 'black')
            ? "#0a0f1d" 
            : "#ffffff"
        }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={handleExit}
            className="hover:bg-current/10 active:scale-90 transition-transform p-2 rounded-full flex items-center justify-center"
          >
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          </button>
          <h1 className="flex flex-col justify-center">
            <span className="font-headline font-black text-base leading-tight tracking-tight truncate max-w-[200px]">
              {currentGroup.name}
            </span>
            {currentGroup.nativeName && (
              <span className={`text-[10px] font-bold leading-tight ${showSolidHeader && getContrastColor(currentGroup.headerThemeColor || "#1a1c23") === 'black' ? 'opacity-40' : 'opacity-60'}`}>
                {currentGroup.nativeName}
              </span>
            )}
          </h1>
        </div>
        <div className="flex items-center gap-1 relative">
          {isAdminUser && (
            <>
              <button 
                onClick={() => setIsPaletteOpen(!isPaletteOpen)}
                className="hover:bg-current/10 active:scale-90 transition-all p-2 rounded-full flex items-center justify-center relative group/palette"
              >
                <div className="relative flex items-center justify-center">
                  <span className="material-symbols-outlined text-[22px]">palette</span>
                  <div 
                    className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white shadow-sm transition-transform group-hover/palette:scale-125"
                    style={{ backgroundColor: currentGroup.headerThemeColor || "#1a1c23" }}
                  />
                </div>
              </button>

              <AnimatePresence>
                {isPaletteOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-50" 
                      onClick={() => setIsPaletteOpen(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute top-14 right-0 bg-surface-container-high/95 backdrop-blur-3xl border border-white/20 rounded-[2.5rem] p-6 shadow-[0_25px_60px_rgba(0,0,0,0.6)] z-[60] w-[300px]"
                    >
                      <div className="flex justify-between items-center mb-5 px-1">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Theme Customization</span>
                          <span className="text-[14px] font-bold text-white mt-1">Branding Palette</span>
                        </div>
                        <div className="flex gap-1.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-white/30 animate-pulse"></div>
                          <div className="w-1.5 h-1.5 rounded-full bg-white/10"></div>
                        </div>
                      </div>
                      <div className="grid grid-cols-5 gap-3">
                        {PALETTE_COLORS.map((color) => (
                          <button
                            key={color}
                            onClick={() => handleColorChange(color)}
                            className={`w-10 h-10 rounded-full transition-all relative flex items-center justify-center ${currentGroup.headerThemeColor === color ? "ring-2 ring-white scale-110 shadow-lg" : "hover:scale-110 opacity-70 hover:opacity-100"}`}
                            style={{ backgroundColor: color }}
                          >
                            {currentGroup.headerThemeColor === color && (
                              <span className="material-symbols-outlined text-sm" style={{ color: getContrastColor(color) === 'black' ? "#0a0f1d" : "#ffffff" }}>check</span>
                            )}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>

              <button 
                onClick={() => setIsSettingsOpen(true)}
                className="hover:bg-current/10 active:scale-90 transition-all p-2 rounded-full flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-[20px]">settings</span>
              </button>
            </>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-16 pb-12">
        {isLocked ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center mt-10">
             <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-3xl text-slate-400">lock</span>
             </div>
             <h2 className="text-xl font-bold text-slate-800 mb-2">{t('group.unsetup.title') || 'This group has not been set up yet'}</h2>
             <p className="text-slate-500 mb-6 max-w-sm">
                {t('group.unsetup.desc') || 'If you are the admin of this community, please claim your rights and activate the group.'}
             </p>
             {!currentGroup.ownerId && (
               <button 
                 onClick={handleClaimAdmin}
                 disabled={isClaiming}
                 className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-xl transition-colors shadow-sm disabled:opacity-50"
               >
                 {isClaiming ? (t('group.unsetup.claiming') || 'Processing...') : (t('group.unsetup.claim') || 'I am the admin here')}
               </button>
             )}
          </div>
        ) : (
          <>
            {activeTab === 'home' && (
              <section className="relative w-full aspect-[21/9] md:aspect-[3/1] bg-surface-container-high overflow-hidden -mt-16">
                <ImageWithFallback
                  alt={currentGroup.name}
                  className="absolute inset-0 object-cover w-full h-full"
                  src={currentGroup.coverImage}
                  fallbackType="cover"
                  category={currentGroup.tags?.[0] || ''}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
                <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/60 to-transparent pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-full px-6 py-6 flex flex-col gap-2">
                  <div className="font-body text-[18px] text-white font-bold tracking-tight drop-shadow-md flex items-center gap-3">
                    <span>{t('groups.member_count_label') || 'Members'} <span className="text-primary-fixed font-black">{currentGroup.memberCount || members.length || 0}</span></span>
                    <span className="w-1 h-1 rounded-full bg-white/30"></span>
                    <span className="text-white/80 text-[14px]">
                      {t('groups.new_members_label') || 'New this week'} <span className="text-white font-black">{members.filter(m => { const joined = (m as any).joinedAt; return joined && (Date.now() - (typeof joined === 'number' ? joined : new Date(joined).getTime())) < 7 * 24 * 60 * 60 * 1000; }).length}</span>
                    </span>
                  </div>
                  {(memberStatus === 'none' || memberStatus === 'rejected') && (
                    <button
                      onClick={handleJoinAction}
                      disabled={isJoining}
                      className="bg-primary text-on-primary font-bold py-3 px-10 rounded-full shadow-xl hover:opacity-90 transition-all w-fit uppercase tracking-widest text-sm disabled:opacity-50 mt-2"
                    >
                      {isJoining ? 'Processing...' : 'Join Now'}
                    </button>
                  )}
                  {memberStatus === 'pending' && (
                    <button
                      className="bg-amber-500 text-white font-bold py-3 px-10 rounded-full shadow-xl transition-all w-fit uppercase tracking-widest text-sm flex items-center gap-2 mt-2"
                      onClick={() => setShowJoinModal(true)}
                    >
                      <span className="material-symbols-outlined text-sm">schedule</span>
                      Pending Approval
                    </button>
                  )}
                </div>
              </section>
            )}

            {/* Sticky Horizontal Tab Menu */}
            <div className="sticky top-16 z-40 bg-surface border-b border-outline/10 shadow-sm overflow-x-auto hide-scrollbar">
              <div className="flex min-w-full px-2 gap-1">
                {[
                  { id: 'home', key: 'group.tab.dashboard', icon: 'dashboard' },
                  { id: 'live', key: 'group.tab.live', icon: 'play_circle' },
                  { id: 'feed', key: 'group.tab.feed', icon: 'rss_feed', locked: true },
                  { id: 'calendar', key: 'group.tab.calendar', icon: 'calendar_today', locked: true },
                  { id: 'class', key: 'group.tab.class', icon: 'school', locked: true },
                  { id: 'board', key: 'group.tab.notice', icon: 'campaign', locked: true },
                  { id: 'about', key: 'group.tab.about', icon: 'info' },
                ].map((tab) => {
                  const isTabLocked = tab.locked && !isFullMember;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        handleTabClick(tab.id as TabType);
                      }}
                      className={`flex flex-col items-center justify-center py-2 px-1.5 border-b-2 transition-all shrink-0 min-w-[52px] relative ${
                        activeTab === tab.id
                          ? 'border-primary text-primary'
                          : isTabLocked 
                            ? 'border-transparent text-outline hover:text-outline cursor-not-allowed opacity-60'
                            : 'border-transparent text-on-surface-variant hover:text-on-surface'
                      }`}
                    >
                      <div className="relative">
                        <span className="material-symbols-outlined text-[12px] mb-0.5" style={activeTab === tab.id ? { fontVariationSettings: "'FILL' 1" } : {}}>{tab.icon}</span>
                        {isTabLocked && (
                          <span className="material-symbols-outlined text-[10px] absolute -top-1 -right-2 text-outline bg-surface rounded-full">lock</span>
                        )}
                      </div>
                      <span className="text-[7px] font-bold tracking-tight leading-none uppercase">{t(tab.key)}</span>
                    </button>
                  );
                })}
              </div>
            </div>

        <div className={`max-w-7xl mx-auto ${activeTab === 'feed' || activeTab === 'home' || activeTab === 'live' || activeTab === 'calendar' ? 'px-0 md:px-0 mt-0 space-y-0 pb-0' : 'px-4 md:px-8 space-y-10 mt-6 pb-12'}`}>
          {activeTab === 'home' && (
            <div className="flex flex-col gap-10 mt-10">
              {/* Admin Todo Section */}
              {isAdminUser && adminTodos.length > 0 && (
                <section className="px-6">
                  <div className="bg-orange-50 rounded-xl p-4 border border-orange-200 relative overflow-hidden">
                    <h3 className="font-headline font-bold text-orange-800 mb-3 flex items-center gap-2 text-base">
                      <span className="material-symbols-outlined text-orange-600">notification_important</span> Action Required
                    </h3>
                    <div className="flex flex-col gap-2">
                      {adminTodos.map(todo => (
                        <div key={todo.id} className="bg-white rounded-lg p-3 border border-orange-100 flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <h4 className="font-bold text-on-surface text-sm truncate">{todo.title}</h4>
                            <p className="text-xs text-on-surface-variant mt-0.5 truncate">{todo.message}</p>
                          </div>
                          <button 
                            onClick={() => { notificationService.markTodosAsCompletedByReference(todo.referenceId || todo.id); toast.success("Task completed"); }}
                            className="bg-orange-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg shrink-0"
                          >Done</button>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>
              )}

              {/* Notice Board Section */}
              <section className="px-6">
                <div className={`bg-surface-container rounded-xl p-4 flex flex-col gap-4 ${isFullMember ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}`} onClick={() => handleTabClick('board')}>
                  <div className="flex justify-between items-center">
                    <h4 className="font-body text-[12px] font-medium uppercase tracking-widest text-on-surface-variant">Notice</h4>
                    {!isFullMember && <span className="material-symbols-outlined text-[16px] text-outline">lock</span>}
                  </div>
                  <ul className="flex flex-col gap-3">
                    {noticePost ? (
                      <li className="flex flex-col gap-1 border-b border-outline/10 pb-3 last:border-0 last:pb-0">
                        <span className="font-body text-[16px] font-medium text-on-surface font-bold line-clamp-2">{noticePost.title || noticePost.content?.substring(0, 50) || 'Notice'}</span>
                        <div className="flex justify-between items-center">
                          <span className="font-body text-[12px] font-medium text-primary">{noticePost.author?.name || 'Admin'}</span>
                          <span className="font-body text-[12px] font-medium text-outline">{noticePost.createdAt ? format(typeof noticePost.createdAt === 'number' ? noticePost.createdAt : new Date(noticePost.createdAt).getTime(), 'MMM d') : ''}</span>
                        </div>
                      </li>
                    ) : (
                      <li className="flex flex-col gap-1 border-b border-outline/10 pb-3 last:border-0 last:pb-0">
                        <span className="font-body text-[16px] font-medium text-on-surface font-bold">Welcome to our community!</span>
                        <div className="flex justify-between items-center">
                          <span className="font-body text-[12px] font-medium text-primary">Admin</span>
                          <span className="font-body text-[12px] font-medium text-outline">{format(Date.now(), 'MMM d')}</span>
                        </div>
                      </li>
                    )}
                  </ul>
                </div>
              </section>

              {/* SCHEDULE Section */}
              <section className="px-6 flex flex-col gap-4">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="font-headline text-[18px] leading-[1.4] font-bold text-on-background">Schedule</h2>
                  <div className="flex items-center gap-3">
                    {isFullMember ? (
                      <span className="font-body text-[12px] font-medium text-primary cursor-pointer flex items-center" onClick={() => handleTabClick('calendar')}>VIEW ALL <span className="material-symbols-outlined text-[14px]">chevron_right</span></span>
                    ) : (
                      <span className="font-body text-[12px] font-medium text-outline flex items-center cursor-not-allowed opacity-60"><span className="material-symbols-outlined text-[14px] mr-1">lock</span></span>
                    )}
                    <span className="font-body text-[12px] font-bold text-white bg-primary px-3 py-1 rounded-full shadow-sm">{format(Date.now(), 'MMM d').toUpperCase()}</span>
                  </div>
                </div>
                <div className="flex flex-col gap-4">
                  {(() => {
                    const todayStart = new Date();
                    todayStart.setHours(0, 0, 0, 0);
                    const todayEnd = new Date(todayStart);
                    todayEnd.setDate(todayEnd.getDate() + 1);
                    const todayEndMs = todayEnd.getTime();
                    
                    const todayEvents = upcomingEvents.filter(e => {
                      const startTime = typeof e.startDate === 'number' ? e.startDate : new Date(e.startDate || 0).getTime();
                      return startTime >= todayStart.getTime() && startTime < todayEnd.getTime();
                    });

                    if (todayEvents.length > 0) {
                      return todayEvents.map((event, idx) => {
                        const startTime = typeof event.startDate === 'number' ? event.startDate : new Date(event.startDate || 0).getTime();
                        const isNow = startTime <= Date.now() && (typeof event.endDate === 'number' ? event.endDate : new Date(event.endDate || 0).getTime()) >= Date.now();
                        const typeColor = event.type === 'Practica' ? 'text-primary' : (event.type === 'Class' ? 'text-tertiary' : 'text-secondary');
                        const typeBg = event.type === 'Practica' ? 'bg-primary-container' : (event.type === 'Class' ? 'bg-tertiary-fixed' : 'bg-secondary-container');

                        return (
                          <div key={event.id} className={`flex items-start gap-4 relative ${isFullMember ? 'cursor-pointer' : 'cursor-not-allowed opacity-80'}`} onClick={() => handleTabClick('calendar')}>
                            {idx < todayEvents.length - 1 && <div className="absolute left-[23px] top-8 bottom-[-24px] w-0.5 bg-outline/15"></div>}
                            <div className="w-12 pt-2 flex flex-col items-center z-10 bg-background">
                              <div className={`w-4 h-4 rounded-full relative z-10 shrink-0 ${isNow ? 'bg-error shadow-[0_0_12px_rgba(186,26,26,0.8)]' : 'bg-outline/40 border border-outline/60'}`}></div>
                              <span className={`font-body text-[13px] font-black mt-1 ${isNow ? 'text-error' : 'text-on-surface'}`}>{format(startTime, 'HH:mm')}</span>
                            </div>
                            <div className={`flex-1 rounded-xl p-3 cursor-pointer ${isNow ? 'bg-error-container/20 border border-error/20' : 'bg-surface-container-lowest border border-outline/15'}`}>
                              <div className="flex justify-between items-start mb-2">
                                {isNow ? (
                                  <span className="font-body text-[12px] font-medium text-on-primary bg-primary px-2 py-0.5 rounded-3xl tracking-widest">LIVE NOW</span>
                                ) : (
                                  <span className={`font-body text-[11px] font-black px-2.5 py-0.5 rounded-full shadow-sm ${typeColor} ${typeBg}`}>{event.type?.toUpperCase() || 'EVENT'}</span>
                                )}
                                <span className="font-body text-[12px] font-bold text-on-surface-variant flex items-center gap-1">
                                  {isNow && event.type === 'Practica' ? (
                                    <><span className="material-symbols-outlined text-[14px]">music_note</span> Practica</>
                                  ) : (
                                    <><span className="material-symbols-outlined text-[14px]">groups</span> {event.attendeeCount || 0}</>
                                  )}
                                </span>
                              </div>
                              <h3 className={`font-body ${isNow ? 'text-[18px]' : 'text-[16px]'} font-medium text-on-surface font-bold`}>{event.title}</h3>
                            </div>
                          </div>
                        );
                      });
                    } else {
                      // Show NEXT event if today is empty
                      const nextEvent = upcomingEvents.find(e => {
                        const st = typeof e.startDate === 'number' ? e.startDate : new Date(e.startDate || 0).getTime();
                        return st >= todayEndMs;
                      });
                      
                      if (nextEvent) {
                        const nextStart = typeof nextEvent.startDate === 'number' ? nextEvent.startDate : new Date(nextEvent.startDate || 0).getTime();
                        return (
                          <div className={`bg-surface-container-lowest border border-outline/15 rounded-xl p-4 flex items-center justify-between gap-4 ${isFullMember ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}`} onClick={() => handleTabClick('calendar')}>
                            <div className="flex items-center gap-4">
                              <div className="w-16 h-16 rounded-lg bg-surface-variant shrink-0 flex flex-col items-center justify-center">
                                <span className="font-body text-[12px] font-medium text-on-surface-variant uppercase">{format(nextStart, 'EEE')}</span>
                                <span className="font-headline text-[24px] font-extrabold text-on-surface leading-[1.3]">{format(nextStart, 'd')}</span>
                              </div>
                              <div>
                                <h3 className="font-headline text-[20px] font-bold leading-[1.4] text-on-surface">{nextEvent.title}</h3>
                                <p className="font-body text-[16px] font-medium leading-[1.6] text-on-surface-variant">{nextEvent.location || nextEvent.description || ''}</p>
                              </div>
                            </div>
                            {!isFullMember && <span className="material-symbols-outlined text-[20px] text-outline shrink-0">lock</span>}
                          </div>
                        );
                      } else {
                        return (
                          <div className="flex items-start gap-4 relative">
                            <div className="w-12 pt-2 flex flex-col items-center z-10 bg-background">
                              <div className="w-4 h-4 rounded-full bg-outline/30 relative z-10 shrink-0 border border-outline/50"></div>
                              <span className="font-body text-[12px] font-medium text-outline mt-1">--:--</span>
                            </div>
                            <div className="flex-1 bg-surface-container-lowest border border-outline/15 rounded-xl p-3">
                              <h3 className="font-body text-[16px] font-medium text-on-surface-variant font-bold">No upcoming events scheduled</h3>
                            </div>
                          </div>
                        );
                      }
                    }
                  })()}
                </div>
              </section>

              {/* MOMENTS Section */}
              <section className="px-6">
                <h2 className="font-body text-[12px] font-medium uppercase tracking-widest text-on-surface-variant mb-4">{t('group.home.moments') || 'MOMENTS'}</h2>
                <div className="flex flex-col gap-4">
                  {moments.length > 0 ? (
                    <div onClick={() => handleTabClick('live')} className="relative w-full aspect-[4/5] rounded-2xl overflow-hidden shrink-0 bg-surface-container cursor-pointer shadow-sm">
                      <ImageWithFallback src={moments[0].media?.[0] || ''} alt={moments[0].caption || "Moment"} className="absolute inset-0 w-full h-full object-cover" fallbackType="gallery" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                      <div className="absolute bottom-6 left-5 right-5 flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          {moments[0].authorPhoto ? (
                            <img src={moments[0].authorPhoto} alt={moments[0].authorName} className="w-8 h-8 rounded-full border-2 border-white/80 object-cover" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-bold text-xs border-2 border-white/80">
                              {(moments[0].authorName || 'U').substring(0,2).toUpperCase()}
                            </div>
                          )}
                          <span className="font-body text-[14px] font-medium text-white">{moments[0].authorName || 'User'}</span>
                        </div>
                        <p className="font-body text-[18px] font-bold text-white leading-[1.3] drop-shadow-md">{moments[0].caption || ''}</p>
                      </div>
                      <div className="absolute top-4 right-4 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-error animate-pulse"></span>
                        <span className="font-body text-[11px] font-bold text-white tracking-widest uppercase">LIVE</span>
                      </div>
                    </div>
                  ) : (
                    <div className="relative w-full aspect-[21/9] rounded-2xl overflow-hidden shrink-0 bg-surface-container flex items-center justify-center border border-outline/10">
                      <div className="flex flex-col items-center gap-2 opacity-50">
                        <span className="material-symbols-outlined text-4xl">photo_camera</span>
                        <span className="font-body text-sm font-medium">No live moments</span>
                      </div>
                    </div>
                  )}
                </div>
              </section>

              {/* RECENT FEED Section */}
              <section className="px-6">
                <h2 className="font-body text-[12px] font-medium uppercase tracking-widest text-on-surface-variant mb-4">{t('group.tab.feed') || 'RECENT FEED'}</h2>
                <div className="flex flex-col gap-3">
                  {liveChats.length > 0 ? (
                    liveChats.map((chat, idx) => (
                      <div key={chat.id || idx} className={`bg-surface-container-lowest border border-outline/15 rounded-xl p-4 flex justify-between items-center ${isFullMember ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}`} onClick={() => handleTabClick('feed')}>
                        <div className="flex gap-3 items-start flex-1 min-w-0">
                          {chat.author?.avatar ? (
                          <img src={chat.author.avatar} alt={chat.author.name} className="w-10 h-10 rounded-full object-cover shrink-0 border border-outline/20" />
                        ) : (
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 font-bold ${idx === 0 ? 'bg-secondary-container text-on-secondary-container' : 'bg-tertiary-container text-on-tertiary-container'}`}>
                            {(chat.author?.name || 'U').substring(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-baseline gap-2 mb-1">
                            <span className="font-body text-[14px] font-semibold leading-[1.2] text-on-surface truncate">{chat.author?.name || 'Anonymous'}</span>
                            <span className="font-body text-[12px] font-medium leading-[1.2] text-outline shrink-0">{chat.createdAt ? format(typeof chat.createdAt === 'number' ? chat.createdAt : new Date(chat.createdAt).getTime(), 'MMM d') : ''}</span>
                          </div>
                          <p className="font-body text-[16px] font-medium text-on-surface-variant italic truncate">&quot;{chat.content || '...'}&quot;</p>
                        </div>
                        </div>
                        {!isFullMember && <span className="material-symbols-outlined text-[20px] text-outline shrink-0 ml-2">lock</span>}
                      </div>
                    ))
                  ) : members.filter(m => m.status === 'active').slice(0, 2).map((member, idx) => (
                    <div key={member.id || idx} className="bg-surface-container-lowest border border-outline/15 rounded-xl p-4 flex gap-3 items-start">
                      {member.avatar || member.photoURL ? (
                        <img src={member.avatar || member.photoURL} alt={member.name} className="w-10 h-10 rounded-full object-cover shrink-0 border border-outline/20" />
                      ) : (
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 font-bold ${idx === 0 ? 'bg-secondary-container text-on-secondary-container' : 'bg-tertiary-container text-on-tertiary-container'}`}>
                          {(member.name || 'U').substring(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline gap-2 mb-1">
                          <span className="font-body text-[14px] font-semibold leading-[1.2] text-on-surface truncate">{member.name}</span>
                          <span className="font-body text-[12px] font-medium leading-[1.2] text-outline shrink-0">{member.role || 'member'}</span>
                        </div>
                        <p className="font-body text-[16px] font-medium text-on-surface-variant italic truncate">&quot;{member.role === 'admin' ? 'Managing the community' : 'Active in the community'}&quot;</p>
                      </div>
                    </div>
                  ))}
                  {liveChats.length === 0 && members.filter(m => m.status === 'active').length === 0 && (
                    <div className="bg-surface-container-lowest border border-outline/15 rounded-xl p-4 text-center">
                      <p className="font-body text-[16px] font-medium text-on-surface-variant">No active chatter yet</p>
                    </div>
                  )}
                </div>
              </section>

              {/* ACTIVE SPIRITS Section */}
              <section className="px-6 mb-12">
                <h2 className="font-body text-[12px] font-medium uppercase tracking-widest text-on-surface-variant mb-4">ACTIVE SPIRITS</h2>
                <div className="flex flex-col gap-4">
                  {members.filter(m => m.status === 'active').slice(0, 5).map((member, idx) => (
                    <div key={member.id || idx} className="flex items-center gap-3">
                      {member.avatar || member.photoURL ? (
                        <img src={member.avatar || member.photoURL} alt={member.name} className="w-10 h-10 rounded-full object-cover shrink-0 border border-outline/20" />
                      ) : (
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 font-bold ${idx % 3 === 0 ? 'bg-primary-container text-on-primary-container' : idx % 3 === 1 ? 'bg-secondary-container text-on-secondary-container' : 'bg-tertiary-container text-on-tertiary-container'}`}>
                          {(member.name || 'U').substring(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-body text-[16px] font-medium text-on-surface truncate">{member.name}</h4>
                        <p className={`font-body text-[12px] font-medium truncate ${member.role === 'admin' ? 'text-primary' : 'text-on-surface-variant'}`}>{member.role === 'admin' ? 'Group Admin' : 'Active Member'}</p>
                      </div>
                    </div>
                  ))}
                  {members.filter(m => m.status === 'active').length === 0 && (
                    <p className="font-body text-[16px] font-medium text-on-surface-variant">No active members yet</p>
                  )}
                </div>
              </section>
            </div>
          )}

          {activeTab === 'about' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <GroupAbout group={currentGroup} />
            </div>
          )}

          {activeTab === 'live' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 w-full h-[calc(100vh-104px)]">
              <LiveFeed entityType="group" entityId={currentGroup.id} />
            </div>
          )}

          {activeTab === 'calendar' && isFullMember && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <GroupCalendar group={currentGroup} />
            </div>
          )}

          {activeTab === 'feed' && isFullMember && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <UniversalFeed 
                context={{ scope: 'group', scopeId: currentGroup.id }} 
                currentUser={{
                  uid: user?.uid,
                  displayName: profile?.nickname || user?.displayName || 'Anonymous',
                  photoURL: profile?.photoURL || user?.photoURL || ''
                }}
              />
            </div>
          )}

          {activeTab === 'class' && isFullMember && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 w-full">
              <ClassDetail groupId={currentGroup.id} isEmbedded={true} />
            </div>
          )}

          {activeTab === 'board' && isFullMember && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <GroupBoard group={currentGroup} />
            </div>
          )}

        </div>
          </>
        )}
      </main>

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-[100] bg-background overflow-y-auto">
          <GroupFunctionBuilder group={currentGroup} onClose={() => setIsSettingsOpen(false)} />
        </div>
      )}

      {/* Join Modal */}
      <GroupJoinModal
        isOpen={showJoinModal}
        onClose={() => setShowJoinModal(false)}
        groupName={currentGroup.name}
        adminName={currentGroup.representative?.name || 'Admin'}
        adminId={currentAdmin?.id || currentGroup.ownerId}
        strategy={currentGroup.membershipPolicy?.joinStrategy}
        onConfirm={() => {
          setShowJoinModal(false);
          setActiveTab('home');
        }}
      />


    </div>
  );
}
