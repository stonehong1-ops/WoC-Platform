"use client";

import React, { useState, useEffect } from "react";
import { Group, Post as GroupPost } from "@/types/group";
import { Post as FeedPost, FeedContext } from "@/types/feed";
import { useAuth } from "@/components/providers/AuthProvider";
import { useRouter } from "next/navigation";
import ImageWithFallback from "@/components/common/ImageWithFallback";
import { groupService } from "@/lib/firebase/groupService";
import { feedService } from "@/lib/firebase/feedService";
import GroupClassSetting from "./GroupClassSetting";
import UniversalFeed from "@/components/feed/UniversalFeed";

export default function GroupHome({ group }: { group: Group }) {
  const router = useRouter();
  const { user, profile } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeView, setActiveView] = useState<'home' | 'search' | 'class-setting' | 'calendar' | 'feed' | 'board' | 'info' | 'class'>('home');
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [classes, setClasses] = useState<any[]>([]);

  // Feed Context for this group
  const groupFeedContext: FeedContext = {
    scope: 'group',
    scopeId: group.id,
    label: group.name,
    category: 'tango' // Default category for this community
  };

  useEffect(() => {
    if (!group.id) return;
    
    // Subscribe to unified feeds instead of legacy group posts
    const unsubscribeFeed = feedService.subscribePosts(group.id, setPosts);
    const unsubscribeClasses = groupService.subscribeClasses(group.id, setClasses);
    
    return () => {
      unsubscribeFeed();
      unsubscribeClasses();
    };
  }, [group.id]);

  const notices = posts.filter(p => p.category === 'notice');
  const latestNotice = notices[0];
  const moments = posts.filter(p => p.images && p.images.length > 0);

  return (
    <div className="bg-surface relative min-h-screen pb-24 font-body bg-blur-primary overflow-x-hidden text-[#242c51]">
      <style jsx global>{`
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

      {/* Navigation Drawer Component (Sidebar) - EXACT RESTORATION */}
      <aside className={`fixed inset-y-0 left-0 z-[100] flex flex-col py-8 bg-white dark:bg-slate-900 h-full w-80 rounded-r-3xl shadow-2xl shadow-blue-900/10 font-headline text-sm font-medium transition-transform duration-300 ${isMenuOpen ? "translate-x-0" : "-translate-x-full"}`}>
        {/* Profile Header */}
        <div className="px-6 mb-8 flex items-center gap-4">
          <div className="relative group cursor-pointer" onClick={() => router.push('/')}>
            <div className="absolute -inset-1 bg-gradient-to-tr from-[#0057bd] to-[#6e9fff] rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
            <ImageWithFallback
              alt={profile?.nickname || "Guest"}
              className="relative h-14 w-14 rounded-full object-cover border-2 border-white shadow-sm"
              src={profile?.photoURL || ""}
              fallbackType="avatar"
              nameForAvatar={profile?.nickname || "G"}
            />
          </div>
          <div className="flex flex-col overflow-hidden">
            <h2 className="text-[#242c51] font-extrabold text-lg tracking-tight truncate max-w-[150px]">
              {profile?.nickname || "Guest User"}
            </h2>
            <span className="text-[#515981] text-xs font-medium truncate max-w-[150px]">
              {profile?.email || "Signed in"}
            </span>
          </div>
        </div>

        {/* Scrollable Menu Content */}
        <nav className="flex-1 overflow-y-auto px-4 space-y-6 no-scrollbar pb-10">
          {/* Section: Menu */}
          <div>
            <div className="flex items-center justify-between px-2 mb-2">
              <h3 className="text-[10px] uppercase tracking-[0.15em] font-bold text-[#a3abd7]">Menu</h3>
              <button
                onClick={() => router.push('/groups')}
                className="text-[10px] font-bold text-[#0057bd] hover:underline flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[14px]">keyboard_return</span>
                HOME
              </button>
            </div>
            <div className="space-y-1">
              {[
                { id: "Home", icon: "home", label: "Home", view: 'home' as const },
                { id: "Calendar", icon: "calendar_today", label: "Calendar", view: 'calendar' as const },
                { id: "Feed", icon: "rss_feed", label: "Feed", view: 'feed' as const },
                { id: "Board", icon: "forum", label: "Board", view: 'board' as const },
                { id: "Info", icon: "info", label: "Info", view: 'info' as const },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveView(item.view);
                    setIsMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 hover:translate-x-1 ${
                    activeView === item.view 
                      ? "bg-primary/10 text-primary font-bold shadow-sm shadow-primary/5" 
                      : "text-[#242c51] dark:text-slate-300 hover:bg-[#f7f5ff] dark:hover:bg-slate-800"
                  }`}
                >
                  <span className="material-symbols-outlined">{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Section: App Setting */}
          <div>
            <h3 className="px-2 mb-2 text-[10px] uppercase tracking-[0.15em] font-bold text-[#a3abd7]">App Setting</h3>
            <div className="space-y-1">
              {[
                { id: "CommunitySettings", icon: "settings_applications", label: "Group Settings", view: 'search' as const },
                { id: "ClassSetting", icon: "school", label: "Class Setting", view: 'class-setting' as const },
                { id: "ShopSetting", icon: "shopping_bag", label: "Shop Setting", view: 'search' as const },
                { id: "StaySetting", icon: "bed", label: "Stay Setting", view: 'search' as const },
                { id: "RentalSetting", icon: "key", label: "Rental Setting", view: 'search' as const },
              ].map((item) => (
                <button 
                  key={item.id} 
                  onClick={() => {
                    setActiveView(item.view);
                    setIsMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 hover:translate-x-1 ${
                    activeView === item.view 
                      ? "bg-primary/10 text-primary font-bold shadow-sm shadow-primary/5" 
                      : "text-[#242c51] dark:text-slate-300 hover:bg-[#f7f5ff] dark:hover:bg-slate-800"
                  }`}
                >
                  <span className="material-symbols-outlined">{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Section: Admin */}
          <div>
            <h3 className="px-2 mb-2 text-[10px] uppercase tracking-[0.15em] font-bold text-[#a3abd7]">Admin</h3>
            <div className="space-y-1">
              {[
                { id: "Members", icon: "group", label: "Members" },
              ].map((item) => (
                <div 
                  key={item.id} 
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-[#242c51] dark:text-slate-300 hover:bg-[#f7f5ff] dark:hover:bg-slate-800 hover:translate-x-1"
                >
                  <span className="material-symbols-outlined">{item.icon}</span>
                  <span>{item.label}</span>
                  <span className="ml-auto bg-[#0057bd]/10 text-[#0057bd] text-[10px] font-black px-1.5 py-0.5 rounded-md">{group.memberCount?.toLocaleString() || 0}</span>
                </div>
              ))}
            </div>
          </div>
        </nav>
      </aside>

      {/* Overlay for sidebar */}
      {isMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[90]" 
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      {/* Atmospheric Background Effects */}
      <div className="fixed inset-0 pointer-events-none bg-blur-tertiary -z-10"></div>

      {/* Header */}
      <header className="fixed top-0 w-full bg-slate-50/90 backdrop-blur-xl border-b border-slate-200/20 shadow-sm flex justify-between items-center px-4 h-16 z-50 transition-colors">
        <div className="flex items-center gap-3">
          <button onClick={() => setIsMenuOpen(true)} className="text-blue-600 hover:bg-slate-200/50 scale-95 active:scale-90 transition-transform p-2 rounded-full flex items-center justify-center">
            <span className="material-symbols-outlined">menu</span>
          </button>
          <h1 className="font-headline font-extrabold tracking-tight text-lg text-blue-600">{group.name}</h1>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setActiveView('search')} className="text-blue-600 hover:bg-slate-200/50 scale-95 active:scale-90 transition-transform p-2 rounded-full flex items-center justify-center">
            <span className="material-symbols-outlined">search</span>
          </button>
          <button onClick={() => router.back()} className="text-blue-600 hover:bg-slate-200/50 scale-95 active:scale-90 transition-transform p-2 rounded-full flex items-center justify-center">
            <span className="material-symbols-outlined">logout</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-16 pb-8">
        {activeView === 'class-setting' ? (
          <GroupClassSetting group={group} onBack={() => setActiveView('home')} />
        ) : activeView === 'feed' ? (
          <div className="bg-[#f8f9fa] min-h-screen">
            <UniversalFeed context={groupFeedContext} currentUser={user} />
          </div>
        ) : activeView !== 'home' ? (
          <div className="max-w-7xl mx-auto px-4 py-20 flex flex-col items-center justify-center text-center">
            <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-6">
              <span className="material-symbols-outlined text-5xl text-primary animate-pulse">
                {activeView === 'class' ? 'school' : 'construction'}
              </span>
            </div>
            <h2 className="text-3xl font-headline font-black text-on-surface mb-2">
              {activeView.charAt(0).toUpperCase() + activeView.slice(1).replace('-', ' ')} Coming Soon
            </h2>
            <p className="text-on-surface-variant max-w-md">
              {activeView === 'class' 
                ? "Our class schedule and booking system is coming soon. Stay tuned!" 
                : "We're working hard to bring you this feature. Please check back later!"}
            </p>
            <button 
              onClick={() => setActiveView('home')}
              className="mt-8 px-8 py-3 bg-primary text-white rounded-full font-bold shadow-lg hover:bg-primary-dim transition-all"
            >
              Back to Home
            </button>
          </div>
        ) : (
          <>
            {/* Hero Section (Full Width Bleed) */}
            <section className="relative w-full aspect-[16/10] max-h-[500px]">
              <img 
                alt={group.name} 
                className="object-cover w-full h-full" 
                src={group.coverImage || "https://lh3.googleusercontent.com/aida-public/AB6AXuDmgTw1z77XdZAmz_0MD3pqggmINudggBz39QJXF77OYWIlyN3OgnZUyAr46RTl6uFXxo8GK09N0_7R9xXywU2ks3z-1_5LXOJooEX1v5l_ptYk-NZ3CsdE33uWUJCCEgSS5zZF2S-ZNG3QngPwtsy_PhOZ43WXx4vZoUDkkeS_INRP93IkgVw6QZkrGK5p1u6-fieCLtMBdiXrMtg1rOJRv5598VC7JghCWTFyQK1VWKHLVXYO9pAgGbw1ntk0-ObPEEmP3R1dHOE"}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-6 md:p-12 pb-10">
                <p className="text-white font-body text-base md:text-xl max-w-xl mb-6">{group.description || "Connect, dance, and express yourself in the heart of our community."}</p>
                <button className="bg-primary text-white font-bold py-2 px-6 rounded-full shadow-xl hover:bg-primary-dim transition-all w-fit uppercase tracking-widest text-xs">Join Now</button>
              </div>
            </section>

            <div className="max-w-7xl mx-auto px-4 md:px-8 space-y-8 mt-8">
              {/* Notice Section */}
              <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm border border-outline-variant/10 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-headline font-bold text-lg text-on-surface flex items-center gap-2">
                    <span className="material-symbols-outlined text-tertiary">campaign</span> Notice
                  </h3>
                </div>
                {latestNotice ? (
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-error-container/5 border border-error-container/10">
                    <div className="bg-error-container text-error p-2 rounded-lg shrink-0">
                      <span className="material-symbols-outlined text-sm">priority_high</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-on-surface">
                        {latestNotice.content.length > 40 
                          ? latestNotice.content.substring(0, 40) + "..." 
                          : latestNotice.content}
                      </h4>
                      <p className="text-xs text-on-surface-variant mt-1 opacity-70">
                        {new Date(latestNotice.createdAt.seconds * 1000).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-100/50 border border-slate-200/50">
                    <div className="bg-slate-200 text-slate-500 p-2 rounded-lg shrink-0">
                      <span className="material-symbols-outlined text-sm">info</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-on-surface">No announcements available</h4>
                      <p className="text-xs text-on-surface-variant mt-0.5">There are no new notices at this time. Stay tuned!</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Moments Section */}
              <section>
                <div className="flex justify-between items-end mb-4">
                  <h2 className="font-headline font-extrabold text-xl text-on-surface">Moments</h2>
                </div>
                <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar -mx-4 px-4 snap-x">
                  {moments.length > 0 ? (
                    moments.map((moment) => (
                      <div key={moment.id} className="shrink-0 w-64 aspect-video rounded-xl overflow-hidden shadow-sm snap-start relative border border-outline-variant/10 bg-slate-100">
                        <img 
                          src={moment.images?.[0] || "https://lh3.googleusercontent.com/aida-public/AB6AXuDmgTw1z77XdZAmz_0MD3pqggmINudggBz39QJXF77OYWIlyN3OgnZUyAr46RTl6uFXxo8GK09N0_7R9xXywU2ks3z-1_5LXOJooEX1v5l_ptYk-NZ3CsdE33uWUJCCEgSS5zZF2S-ZNG3QngPwtsy_PhOZ43WXx4vZoUDkkeS_INRP93IkgVw6QZkrGK5p1u6-fieCLtMBdiXrMtg1rOJRv5598VC7JghCWTFyQK1VWKHLVXYO9pAgGbw1ntk0-ObPEEmP3R1dHOE"} 
                          alt="Moment"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))
                  ) : (
                    <>
                      <div className="shrink-0 w-64 aspect-video rounded-xl overflow-hidden shadow-sm snap-start moments-placeholder relative border border-outline-variant/10 flex flex-col items-center justify-center text-center px-4">
                        <span className="material-symbols-outlined text-primary/20 text-4xl mb-2">image_not_supported</span>
                        <span className="text-[11px] text-on-surface-variant font-bold leading-tight">등록된 사진이나 영상이 없습니다</span>
                      </div>
                      <div className="shrink-0 w-64 aspect-video rounded-xl overflow-hidden shadow-sm snap-start moments-placeholder relative border border-outline-variant/10 flex flex-col items-center justify-center text-center px-4">
                        <span className="material-symbols-outlined text-primary/20 text-4xl mb-2">image_not_supported</span>
                        <span className="text-[11px] text-on-surface-variant font-bold leading-tight">No photos or videos registered</span>
                      </div>
                    </>
                  )}
                </div>
              </section>

              {/* Schedule Section */}
              <section>
                <div className="flex justify-between items-end mb-6">
                  <div>
                    <h2 className="font-headline font-extrabold text-on-surface text-xl">Upcoming Schedule</h2>
                    <p className="text-sm text-on-surface-variant mt-1">Thursday, October 12</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {classes.length > 0 ? (
                    classes.map((cls) => (
                      <div key={cls.id} className="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant/10 shadow-sm hover:shadow-md hover:scale-[0.99] transition-all cursor-pointer relative overflow-hidden group">
                        <div className={`absolute top-0 left-0 w-1 h-full ${cls.status === 'Open' ? 'bg-primary' : 'bg-slate-300'} group-hover:w-2 transition-all`}></div>
                        <div className="flex justify-between items-start mb-3 pl-3">
                          <span className={`font-label font-bold text-[10px] uppercase tracking-wider py-1 px-2 rounded-full ${
                            cls.status === 'Open' ? 'bg-primary/10 text-primary' : 'bg-slate-100 text-slate-500'
                          }`}>
                            {cls.level || 'Class'}
                          </span>
                          <span className="text-on-surface-variant text-sm font-medium flex items-center gap-1">
                            <span className="material-symbols-outlined text-xs">schedule</span> 
                            {cls.schedule?.[0]?.timeSlot || 'TBD'}
                          </span>
                        </div>
                        <div className="pl-3">
                          <h3 className="font-headline font-bold text-lg text-on-surface mb-1">{cls.title}</h3>
                          <p className="text-sm text-on-surface-variant mb-2 flex items-center gap-1">
                            <span className="material-symbols-outlined text-xs">person</span> 
                            {cls.instructors?.map((i: any) => i.name).join(' & ') || 'Staff'}
                          </p>
                          <p className="text-xs text-on-surface-variant/70 line-clamp-2">{cls.description}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full py-12 flex flex-col items-center justify-center text-center bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-200">
                      <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">event_busy</span>
                      <p className="text-slate-500 font-medium">No upcoming classes found</p>
                      <button 
                        onClick={() => setActiveView('class-setting')}
                        className="mt-4 text-primary font-bold text-sm hover:underline"
                      >
                        Set up your first class
                      </button>
                    </div>
                  )}
                </div>
              </section>

              {/* Recent Feed Section */}
              <section>
                <div className="flex justify-between items-end mb-6">
                  <h2 className="font-headline font-extrabold text-on-surface text-xl">Recent Feed</h2>
                </div>
                <div className="space-y-4">
                  {posts.length > 0 ? (
                    posts
                      .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
                      .slice(0, 3)
                      .map((post) => (
                        <div 
                          key={post.id} 
                          onClick={() => setActiveView('feed')}
                          className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/10 shadow-sm flex flex-col gap-3 cursor-pointer hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-center gap-3">
                            {post.userPhoto ? (
                              <ImageWithFallback 
                                src={post.userPhoto} 
                                alt={post.userName} 
                                className="w-10 h-10 rounded-full object-cover"
                                fallbackType="avatar"
                                nameForAvatar={post.userName}
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-bold uppercase">
                                {post.userName?.[0] || '?'}
                              </div>
                            )}
                            <div>
                              <h4 className="font-bold text-sm text-on-surface">{post.userName || "Anonymous"}</h4>
                              <p className="text-xs text-on-surface-variant">
                                {post.createdAt?.seconds 
                                  ? new Date(post.createdAt.seconds * 1000).toLocaleDateString() 
                                  : "Recently"}
                              </p>
                            </div>
                          </div>
                          <p className="text-sm text-on-surface line-clamp-3">{post.content}</p>
                        </div>
                      ))
                  ) : (
                    <div className="bg-surface-container-lowest p-8 rounded-xl border border-dashed border-outline-variant/30 flex flex-col items-center justify-center text-center">
                      <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">rss_feed</span>
                      <p className="text-slate-500 font-medium">등록된 피드가 없습니다</p>
                      <p className="text-xs text-slate-400">No feed available at this time.</p>
                    </div>
                  )}
                </div>
              </section>

              {/* Community Pulse (Stats) */}
              <section className="bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100/50">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[#0057bd] text-[24px]">insert_chart</span>
                  </div>
                  <h3 className="font-headline font-bold text-[#242c51] text-xl tracking-tight">Community Pulse</h3>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between items-end mb-2.5">
                      <span className="text-[#515981] text-[13px] font-medium">Members (Male / Female)</span>
                      <span className="font-bold text-[#0057bd] text-[13px]">45% / 55%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden flex">
                      <div className="bg-[#0057bd] h-full" style={{ width: "45%" }}></div>
                      <div className="bg-[#893c92] h-full" style={{ width: "55%" }}></div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-50 flex justify-between items-center">
                    <span className="text-[#515981] text-[13px] font-medium">Today's Visitors</span>
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#00c853] text-[20px] font-bold">trending_up</span>
                      <span className="font-headline font-black text-2xl text-[#242c51] leading-none">142</span>
                    </div>
                  </div>
                </div>
              </section>

              <footer className="text-center py-4">
                <p className="text-xs text-on-surface-variant/60 font-body">© 2026 Freestyle Tango. All rights reserved.</p>
              </footer>
            </div>
          </>
        )}
      </main>

      {/* BottomNavBar (Icon-Only and Compact) */}
      <nav className="fixed bottom-0 left-0 w-full z-50 flex items-center bg-slate-50/95 backdrop-blur-2xl border-t border-slate-200/10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] h-16 px-6">
        <div className="flex w-full overflow-x-auto hide-scrollbar px-4 items-center h-full">
          <div className="flex w-full justify-between items-center h-full max-w-lg mx-auto">
            <button 
              onClick={() => setActiveView('home')}
              className={`p-2 rounded-xl transition-all scale-100 active:scale-95 ${activeView === 'home' ? 'text-primary bg-primary/10' : 'text-slate-500 hover:text-primary'}`}
            >
              <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: activeView === 'home' ? "'FILL' 1" : "" }}>grid_view</span>
            </button>
            <button 
              onClick={() => setActiveView('calendar')}
              className={`p-2 rounded-xl transition-all scale-100 active:scale-95 ${activeView === 'calendar' ? 'text-primary bg-primary/10' : 'text-slate-500 hover:text-primary'}`}
            >
              <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: activeView === 'calendar' ? "'FILL' 1" : "" }}>calendar_today</span>
            </button>
            <button 
              onClick={() => setActiveView('feed')}
              className={`p-2 rounded-xl transition-all scale-100 active:scale-95 ${activeView === 'feed' ? 'text-primary bg-primary/10' : 'text-slate-500 hover:text-primary'}`}
            >
              <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: activeView === 'feed' ? "'FILL' 1" : "" }}>rss_feed</span>
            </button>
            <button 
              onClick={() => setActiveView('board')}
              className={`p-2 rounded-xl transition-all scale-100 active:scale-95 ${activeView === 'board' ? 'text-primary bg-primary/10' : 'text-slate-500 hover:text-primary'}`}
            >
              <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: activeView === 'board' ? "'FILL' 1" : "" }}>forum</span>
            </button>
            <button 
              onClick={() => setActiveView('info')}
              className={`p-2 rounded-xl transition-all scale-100 active:scale-95 ${activeView === 'info' ? 'text-primary bg-primary/10' : 'text-slate-500 hover:text-primary'}`}
            >
              <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: activeView === 'info' ? "'FILL' 1" : "" }}>info</span>
            </button>
            <div className="w-[1px] h-6 bg-slate-300 mx-2 self-center"></div>
            <button 
              onClick={() => {
                alert('Coming Soon');
                setActiveView('class');
              }}
              className={`p-2 rounded-xl transition-all scale-100 active:scale-95 ${activeView === 'class' ? 'text-primary bg-primary/10' : 'text-slate-500 hover:text-primary'}`}
            >
              <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: activeView === 'class' ? "'FILL' 1" : "" }}>school</span>
            </button>
          </div>
        </div>
      </nav>
    </div>
  );
}
