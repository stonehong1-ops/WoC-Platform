"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Group, Member } from "@/types/group";
import { useAuth } from "@/components/providers/AuthProvider";
import { groupService } from "@/lib/firebase/groupService";
import ImageWithFallback from "@/components/common/ImageWithFallback";
import GroupJoinModal from "./GroupJoinModal";

type TabType = 'home' | 'schedule' | 'feed' | 'board' | 'info' | 'class';

export default function GroupHome({ group }: { group: Group }) {
  const router = useRouter();
  const { user, profile } = useAuth();
  const [isJoining, setIsJoining] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [memberStatus, setMemberStatus] = useState<'active' | 'pending' | 'rejected' | 'none'>('none');

  // 실시간 멤버 상태 확인
  useEffect(() => {
    if (!user || !group.id) {
      setMemberStatus('none');
      return;
    }

    const unsubscribe = groupService.subscribeMembers(group.id, (members) => {
      const myMemberInfo = members.find(m => m.id === user.uid);
      if (myMemberInfo) {
        setMemberStatus(myMemberInfo.status || 'active');
      } else {
        setMemberStatus('none');
      }
    });

    return () => unsubscribe();
  }, [user, group.id]);

  const isFullMember = memberStatus === 'active';

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

    if (tab === 'board') {
      router.push(`/group/${group.id}/board`);
      return;
    }

    setActiveTab(tab);
  };

  return (
    <div className="bg-[#F1F5F9] text-[#242c51] min-h-screen font-body relative overflow-x-hidden pb-24">
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
      <header className="fixed top-0 w-full bg-slate-50/90 backdrop-blur-xl border-b border-slate-200/20 shadow-sm flex justify-between items-center px-4 h-16 z-50">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => router.push('/groups')}
            className="text-blue-600 hover:bg-slate-200/50 scale-95 active:scale-90 transition-transform p-2 rounded-full flex items-center justify-center"
          >
            <span className="material-symbols-outlined">menu</span>
          </button>
          <h1 className="font-headline font-bold text-2xl text-blue-600">{group.name}</h1>
        </div>
        <div className="flex items-center gap-1">
          <button className="text-blue-600 hover:bg-slate-200/50 scale-95 active:scale-90 transition-transform p-2 rounded-full flex items-center justify-center">
            <span className="material-symbols-outlined">search</span>
          </button>
          <button className="text-blue-600 hover:bg-red-50 hover:text-red-500 scale-95 active:scale-90 transition-all p-2 rounded-full flex items-center justify-center">
            <span className="material-symbols-outlined">logout</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-16">
        {/* Hero Section */}
        <section className="relative w-full aspect-[16/10] max-h-[500px]">
          <ImageWithFallback 
            alt={group.name} 
            className="object-cover w-full h-full" 
            src={group.coverImage} 
            fallbackType="cover"
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
            ) : (
              <button 
                onClick={() => handleTabClick('board')}
                className="bg-white/20 backdrop-blur-md text-white font-bold py-3 px-10 rounded-full shadow-xl hover:bg-white/30 transition-all w-fit uppercase tracking-widest text-sm border border-white/30"
              >
                Enter Group
              </button>
            )}
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-4 md:px-8 space-y-10 mt-8 pb-12">
          {activeTab === 'home' && (
            <>
              {/* Notice Section */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-[#a3abd7]/10 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-headline font-bold text-xl text-[#242c51] flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#893c92]">campaign</span> Notice
                  </h3>
                  <button className="text-[#0057bd] text-xs font-bold uppercase tracking-wide hover:underline">View All</button>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-[#b31b25]/5 border border-[#b31b25]/10">
                  <div className="bg-[#fb5151] text-[#ffefee] p-2 rounded-lg shrink-0">
                    <span className="material-symbols-outlined text-sm">priority_high</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-[#242c51]">Welcome to our new home!</h4>
                    <p className="text-xs text-[#515981] mt-0.5">Stay tuned for upcoming events and community updates.</p>
                  </div>
                </div>
              </div>

              {/* Moments Section */}
              <section>
                <div className="flex justify-between items-end mb-4">
                  <h2 className="font-headline font-extrabold text-2xl text-[#242c51]">Moments</h2>
                </div>
                <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar -mx-4 px-4 snap-x">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="shrink-0 w-64 aspect-video rounded-xl overflow-hidden shadow-sm snap-start moments-placeholder relative border border-[#a3abd7]/10">
                      <span className="material-symbols-outlined text-[#0057bd]/20 text-4xl">image</span>
                    </div>
                  ))}
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
                  <div 
                    onClick={() => handleTabClick('schedule')}
                    className="bg-white p-5 rounded-xl border border-[#a3abd7]/10 shadow-sm hover:shadow-md transition-all cursor-pointer relative overflow-hidden group"
                  >
                    <div className="absolute top-0 left-0 w-1 h-full bg-[#0057bd] group-hover:w-2 transition-all"></div>
                    <div className="flex justify-between items-start mb-3 pl-3">
                      <span className="bg-[#0057bd]/10 text-[#0057bd] font-label font-bold text-[10px] uppercase tracking-wider py-1 px-2 rounded-full">Community</span>
                      <span className="text-[#515981] text-sm font-medium flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">schedule</span> 19:00 - 21:00
                      </span>
                    </div>
                    <div className="pl-3">
                      <h3 className="font-headline font-bold text-lg text-[#242c51] mb-1">Weekly Practice</h3>
                      <p className="text-sm text-[#515981] mb-0 flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">person</span> {group.representative?.name || 'Admin'} • Studio A
                      </p>
                    </div>
                  </div>
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
                      <span className="font-bold text-[#0057bd]">45% / 55%</span>
                    </div>
                    <div className="w-full bg-[#e4e7ff] rounded-full h-2.5 overflow-hidden flex">
                      <div className="bg-[#0057bd] h-full" style={{ width: '45%' }}></div>
                      <div className="bg-[#893c92] h-full" style={{ width: '55%' }}></div>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-[#a3abd7]/10 flex justify-between items-center">
                    <span className="text-[#515981] text-sm">Total Members</span>
                    <div className="flex items-center gap-1 font-headline font-bold text-xl text-[#242c51]">
                      <span className="material-symbols-outlined text-green-500">trending_up</span> {group.memberCount || 1}
                    </div>
                  </div>
                </div>
              </section>
            </>
          )}

          {activeTab === 'info' && (
            <section className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="font-headline font-extrabold text-[#242c51] text-3xl mb-8">Group Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-8">
                  <div>
                    <h3 className="text-sm font-bold text-blue-600 uppercase tracking-widest mb-3">About Us</h3>
                    <p className="text-slate-600 leading-relaxed">{group.story || group.description}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-blue-600 uppercase tracking-widest mb-3">Location</h3>
                    <p className="text-slate-600 flex items-start gap-2">
                      <span className="material-symbols-outlined text-blue-500 shrink-0">location_on</span>
                      {group.address} {group.detailedAddress}
                    </p>
                  </div>
                </div>
                <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest mb-4">Representative</h3>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden">
                      {group.representative?.avatar ? (
                        <img src={group.representative.avatar} alt={group.representative.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="material-symbols-outlined text-blue-500 text-3xl">person</span>
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 text-lg">{group.representative?.name || 'Admin'}</p>
                      <p className="text-sm text-slate-500">{group.representative?.phone || 'Contact via chat'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Placeholder for other tabs (Schedule, Feed, Class) */}
          {activeTab !== 'home' && activeTab !== 'info' && isFullMember && (
            <div className="py-20 text-center space-y-4 animate-in fade-in zoom-in duration-300">
              <div className="w-20 h-20 bg-slate-100 text-slate-300 rounded-full flex items-center justify-center mx-auto">
                <span className="material-symbols-outlined text-4xl">construction</span>
              </div>
              <h3 className="text-xl font-bold text-slate-400 capitalize">{activeTab} section is coming soon</h3>
            </div>
          )}

          {/* Footer Credits */}
          <footer className="pt-8 pb-4 text-center">
            <p className="text-xs text-[#515981]/60 font-body">© 2026 {group.name}. All rights reserved.</p>
          </footer>
        </div>
      </main>

      {/* Navigation Footer (5+1 Layout) */}
      <nav className="fixed bottom-0 left-0 w-full z-50 flex items-center px-4 bg-slate-50/95 backdrop-blur-2xl border-t border-slate-200/10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] h-16">
        <div className="flex flex-1 justify-between items-center px-2">
          <button 
            onClick={() => handleTabClick('home')}
            className={`flex flex-col items-center gap-0.5 transition-all scale-100 active:scale-95 ${activeTab === 'home' ? 'text-blue-600' : 'text-slate-500'}`}
          >
            <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: activeTab === 'home' ? "'FILL' 1" : "" }}>grid_view</span>
            <span className="text-[9px] font-bold uppercase tracking-tighter">Home</span>
          </button>
          <button 
            onClick={() => handleTabClick('schedule')}
            className={`flex flex-col items-center gap-0.5 transition-all scale-100 active:scale-95 ${activeTab === 'schedule' ? 'text-blue-600' : 'text-slate-500'}`}
          >
            <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: activeTab === 'schedule' ? "'FILL' 1" : "" }}>calendar_today</span>
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
            onClick={() => handleTabClick('class')}
            className={`flex flex-col items-center gap-0.5 transition-all scale-100 active:scale-95 ${activeTab === 'class' ? 'text-blue-600' : 'text-slate-500'}`}
          >
            <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: activeTab === 'class' ? "'FILL' 1" : "" }}>school</span>
            <span className="text-[9px] font-bold uppercase tracking-tighter">Class</span>
          </button>
        </div>
      </nav>

      {/* Join Modal */}
      <GroupJoinModal 
        isOpen={showJoinModal}
        onClose={() => setShowJoinModal(false)}
        groupName={group.name}
        adminName={group.representative?.name || 'Admin'}
        strategy={group.membershipPolicy?.joinStrategy}
        onConfirm={() => {
          setShowJoinModal(false);
          setActiveTab('home');
        }}
      />
    </div>
  );
}
