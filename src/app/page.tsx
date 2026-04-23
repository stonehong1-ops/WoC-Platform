'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigation } from '@/components/providers/NavigationProvider';
import { db } from '@/lib/firebase/clientApp';
import { collection, query, orderBy, limit, onSnapshot, getCountFromServer, where } from 'firebase/firestore';

export default function LandingPage() {
  const { user, profile, setShowLogin } = useAuth();
  const { toggleDrawer } = useNavigation();
  const router = useRouter();

  // Data States
  const [stats, setStats] = useState({ members: 0, groups: 0 });
  const [notice, setNotice] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [feed, setFeed] = useState<any[]>([]);
  const [gallery, setGallery] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Fetch Stats
    const fetchStats = async () => {
      try {
        const usersSnap = await getCountFromServer(collection(db, 'users'));
        const groupsSnap = await getCountFromServer(collection(db, 'groups'));
        setStats({
          members: usersSnap.data().count,
          groups: groupsSnap.data().count
        });
      } catch (err) {
        console.error("Error fetching stats:", err);
      }
    };

    // 2. Fetch Latest Notice (from feeds with 'plaza' target)
    const noticeQuery = query(
      collection(db, 'feeds'), 
      where('targets', 'array-contains', 'plaza'),
      orderBy('createdAt', 'desc'), 
      limit(1)
    );
    const unsubscribeNotice = onSnapshot(noticeQuery, (snap) => {
      if (!snap.empty) {
        setNotice({ id: snap.docs[0].id, ...snap.docs[0].data() } as any);
      }
    });

    // 3. Fetch Upcoming Events
    const eventsQuery = query(collection(db, 'events'), orderBy('startDate', 'asc'), limit(4));
    const unsubscribeEvents = onSnapshot(eventsQuery, (snap) => {
      const evts = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      setEvents(evts);
    });

    // 4. Fetch Feed (feeds with 'plaza' target)
    const feedQuery = query(
      collection(db, 'feeds'), 
      where('targets', 'array-contains', 'plaza'),
      orderBy('createdAt', 'desc'), 
      limit(5)
    );
    const unsubscribeFeed = onSnapshot(feedQuery, (snap) => {
      const posts = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      setFeed(posts);
      
      // Also use some of these for gallery if they have images
      const galleryItems = posts.filter(p => p.images && p.images.length > 0).slice(0, 5);
      setGallery(galleryItems);
      setLoading(false);
    });

    fetchStats();
    return () => {
      unsubscribeNotice();
      unsubscribeEvents();
      unsubscribeFeed();
    };
  }, []);

  const handleProtectedLink = (e: React.MouseEvent, href: string) => {
    if (!user || !profile?.isRegistered) {
      e.preventDefault();
      localStorage.setItem('woc_context', href);
      setShowLogin(true);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4FBFB] text-[#2D3435] font-inter selection:bg-[#005BC0]/10 antialiased overflow-x-hidden">
      {/* Top Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-md border-b border-[#005BC0]/10 z-50 px-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={toggleDrawer}
            className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-[#005BC0]/5 text-[#2D3435] transition-colors"
          >
            <span className="material-symbols-outlined !text-[24px]">menu</span>
          </button>
          <span className="font-manrope font-extrabold text-xl tracking-tight text-[#005BC0]">WoC</span>
        </div>
        
        <div className="flex items-center gap-3">
          <Link href="/notification" className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-[#005BC0]/5 text-[#2D3435]/40 transition-colors">
            <span className="material-symbols-outlined !text-[20px]">notifications</span>
          </Link>
          <Link href="/chat" className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-[#005BC0]/5 text-[#2D3435]/40 transition-colors">
            <span className="material-symbols-outlined !text-[20px]">chat_bubble</span>
          </Link>
          <Link href="/search" className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-[#005BC0]/5 text-[#2D3435]/40 transition-colors">
            <span className="material-symbols-outlined !text-[20px]">search</span>
          </Link>
          
          {/* Action Button instead of Profile Photo */}
          {!user ? (
            <button 
              onClick={() => setShowLogin(true)}
              className="ml-2 px-4 py-2 bg-[#005BC0] text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-[#005BC0]/90 transition-all active:scale-95"
            >
              Sign In
            </button>
          ) : (
            <Link 
              href="/my-info"
              className="ml-2 w-8 h-8 rounded-full bg-[#005BC0]/10 flex items-center justify-center text-[#005BC0] hover:bg-[#005BC0]/20 transition-colors"
            >
              <span className="material-symbols-outlined !text-[20px]">person</span>
            </Link>
          )}
        </div>
      </nav>

      <div className="flex pt-16">
        {/* Sidebar Navigation (Hidden on Mobile) */}
        <aside className="hidden lg:flex fixed left-0 top-16 bottom-0 w-64 bg-white border-r border-[#005BC0]/10 flex-col p-6 z-40">
          <div className="space-y-1">
            <NavItem href="/home" icon="dashboard" label="The Collective" active />
            <NavItem href="/plaza" icon="analytics" label="Pulse" />
            <NavItem href="/venues" icon="calendar_today" label="Schedule" />
            <NavItem href="/groups" icon="dynamic_feed" label="Feed" />
            <NavItem href="/gallery" icon="photo_library" label="Gallery" />
            <NavItem href="/members" icon="group" label="Members" />
            <NavItem href="/contact" icon="mail" label="Contact" />
          </div>

          <div className="mt-auto pt-6 border-t border-[#005BC0]/10">
            <div className="bg-gradient-to-br from-[#005BC0] to-[#005BC0]/80 rounded-2xl p-5 text-white shadow-lg shadow-[#005BC0]/20">
              <h4 className="font-manrope font-extrabold text-sm mb-2 uppercase tracking-wider">Premium Access</h4>
              <p className="text-[11px] text-white/80 leading-relaxed mb-4 font-medium italic">Unlock exclusive community features and insights.</p>
              <button className="w-full py-2.5 bg-white text-[#005BC0] rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/90 transition-all active:scale-95">
                Upgrade Now
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 lg:ml-64 min-h-[calc(100vh-4rem)] p-4 md:p-8 lg:p-12">
          <div className="max-w-6xl mx-auto space-y-8 md:space-y-12">
            
            {/* Hero Section */}
            <motion.section 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative h-[300px] md:h-[450px] rounded-[2rem] md:rounded-[3rem] overflow-hidden shadow-2xl group border-4 border-white"
            >
              <img 
                src="https://images.unsplash.com/photo-1545128485-c400e7702796?q=80&w=2070&auto=format&fit=crop" 
                alt="Community Hero" 
                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-8 md:p-16">
                <div className="flex items-center gap-3 mb-4">
                  <span className="bg-[#005BC0] text-white text-[10px] font-manrope font-extrabold uppercase tracking-[0.2em] px-4 py-1.5 rounded-full shadow-lg shadow-[#005BC0]/30">Global Platform</span>
                </div>
                <h1 className="font-manrope font-extrabold text-white text-4xl md:text-7xl tracking-tighter mb-6 leading-[0.9]">
                  WORLD OF<br/><span className="text-[#adc7ff]">COMMUNITY</span>
                </h1>
                <p className="text-white/90 text-sm md:text-xl max-w-2xl font-medium leading-relaxed mb-8 italic">
                  "The ultimate ecosystem for niche sub-cultures, shared experiences, and the quiet beauty of collective living."
                </p>
                <div className="flex flex-wrap gap-4">
                  <Link 
                    href="/groups"
                    className="bg-[#005BC0] hover:bg-[#005BC0]/90 text-white font-manrope font-extrabold px-8 py-4 rounded-2xl transition-all shadow-xl shadow-[#005BC0]/20 active:scale-95 text-sm uppercase tracking-widest"
                  >
                    Explore Groups
                  </Link>
                  <button 
                    onClick={() => setShowLogin(true)}
                    className="bg-white/10 backdrop-blur-md hover:bg-white/20 text-white border border-white/30 font-manrope font-extrabold px-8 py-4 rounded-2xl transition-all active:scale-95 text-sm uppercase tracking-widest"
                  >
                    Get Started
                  </button>
                </div>
              </div>
            </motion.section>

            {/* Dashboard Content */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Left Column */}
              <div className="lg:col-span-8 space-y-8 md:space-y-12">
                
                {/* Stats & Notice Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Pulse Widget */}
                  <div className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-black/5 border border-white flex flex-col justify-between group">
                    <h3 className="font-manrope font-extrabold text-2xl mb-8 flex items-center gap-4 text-[#2D3435]">
                      <span className="material-symbols-outlined text-[#005BC0] text-3xl">analytics</span> Global Pulse
                    </h3>
                    <div className="space-y-8">
                      <div>
                        <div className="flex justify-between text-[11px] mb-3 font-black text-[#2D3435]/40 uppercase tracking-widest">
                          <span>Platform Growth</span>
                          <span className="text-[#005BC0]">{stats.members.toLocaleString()} Members</span>
                        </div>
                        <div className="w-full bg-[#F4FBFB] rounded-full h-4 overflow-hidden p-1 shadow-inner">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: stats.members > 0 ? '75%' : '0%' }}
                            className="bg-[#005BC0] h-full rounded-full shadow-lg shadow-[#005BC0]/20 transition-all duration-1000"
                          ></motion.div>
                        </div>
                      </div>
                      <div className="pt-6 border-t border-[#F4FBFB] flex justify-between items-center">
                        <span className="text-[#2D3435]/40 text-[10px] font-black uppercase tracking-widest">Active Groups</span>
                        <div className="flex items-center gap-2 font-manrope font-black text-xl uppercase tracking-tighter text-[#2D3435]">
                          <span className={`w-2.5 h-2.5 rounded-full ${stats.groups > 0 ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`}></span>
                          {stats.groups}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Notice Widget */}
                  <div className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-black/5 border border-white group">
                    <div className="flex justify-between items-center mb-8">
                      <h3 className="font-manrope font-extrabold text-2xl flex items-center gap-4 text-[#2D3435]">
                        <span className="material-symbols-outlined text-orange-500 text-3xl">campaign</span> Global Notice
                      </h3>
                      <button className="text-[#005BC0] text-[10px] font-manrope font-black uppercase tracking-widest hover:underline">All</button>
                    </div>
                    <div className="flex items-start gap-5 p-5 rounded-3xl hover:bg-[#F4FBFB] transition-all cursor-pointer group/item border border-transparent hover:border-[#005BC0]/10">
                      <div className="bg-orange-500/10 text-orange-500 p-4 rounded-2xl group-hover/item:bg-orange-500/20 transition-colors">
                        <span className="material-symbols-outlined text-xl font-bold">
                          {notice ? 'priority_high' : 'notifications_off'}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-extrabold text-lg group-hover/item:text-[#005BC0] transition-colors text-[#2D3435] line-clamp-1">
                          {notice ? notice.title || 'Platform Update' : 'No Recent Notice'}
                        </h4>
                        <p className="text-sm text-[#2D3435]/60 mt-1 leading-relaxed line-clamp-2 italic">
                          {notice ? notice.content : 'Stay tuned for upcoming community announcements.'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Schedule Widget */}
                <section className="bg-white rounded-[3rem] p-8 md:p-12 shadow-xl shadow-black/5 border border-white">
                  <div className="flex justify-between items-center mb-10">
                    <h3 className="font-manrope font-extrabold text-3xl flex items-center gap-4 text-[#2D3435]">
                      <span className="material-symbols-outlined text-[#005BC0] text-4xl">calendar_today</span> Global Schedule
                    </h3>
                    <button className="text-[#005BC0] text-[10px] font-manrope font-black uppercase tracking-widest hover:underline">Full View</button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {events.length > 0 ? (
                      events.map((evt) => {
                        const start = evt.startDate?.toDate ? evt.startDate.toDate() : new Date();
                        const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
                        return (
                          <ScheduleItem 
                            key={evt.id}
                            day={days[start.getDay()]} 
                            date={start.getDate().toString()} 
                            title={evt.title} 
                            time={`${start.getHours()}:${start.getMinutes().toString().padStart(2, '0')}`} 
                            location={evt.location} 
                            tag={evt.type || 'Event'}
                            tagColor={evt.type === 'festival' ? "bg-purple-500/10 text-purple-500" : "bg-[#005BC0]/10 text-[#005BC0]"}
                          />
                        );
                      })
                    ) : (
                      <div className="col-span-full py-12 flex flex-col items-center justify-center text-[#2D3435]/20">
                        <span className="material-symbols-outlined text-5xl mb-4">event_busy</span>
                        <p className="font-manrope font-bold text-sm uppercase tracking-widest">No upcoming events found</p>
                      </div>
                    )}
                  </div>
                </section>

              </div>

              {/* Right Column */}
              <div className="lg:col-span-4 space-y-8 md:space-y-12">
                
                {/* Community Feed Preview */}
                <section className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-black/5 border border-white">
                  <h3 className="font-manrope font-extrabold text-2xl mb-8 flex items-center gap-4 text-[#2D3435]">
                    <span className="material-symbols-outlined text-[#005BC0] text-3xl">dynamic_feed</span> Feed
                  </h3>
                  <div className="space-y-6">
                    {feed.length > 0 ? (
                      feed.map((item) => (
                        <FeedItem 
                          key={item.id}
                          user={item.userName || 'Anonymous'} 
                          content={item.content} 
                          time={item.createdAt?.toDate ? new Intl.RelativeTimeFormat('en').format(-1, 'hour') : 'Recently'}
                        />
                      ))
                    ) : (
                      <div className="py-8 text-center text-[#2D3435]/20">
                        <p className="text-xs font-bold uppercase tracking-widest">No recent activity</p>
                      </div>
                    )}
                  </div>
                  <button className="w-full mt-8 py-4 rounded-2xl bg-[#F4FBFB] text-[#005BC0] font-manrope font-extrabold text-[10px] uppercase tracking-[0.2em] hover:bg-[#005BC0] hover:text-white transition-all active:scale-95 shadow-inner">
                    Explore Feed
                  </button>
                </section>

                {/* Members List */}
                <section className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-black/5 border border-white">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="font-manrope font-extrabold text-2xl flex items-center gap-4 text-[#2D3435]">
                      <span className="material-symbols-outlined text-[#005BC0] text-3xl">group</span> New Members
                    </h3>
                    <span className="bg-[#005BC0]/10 text-[#005BC0] text-[10px] font-manrope font-black px-3 py-1 rounded-full tracking-wider">12+</span>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <div key={i} className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-white shadow-md hover:scale-110 transition-transform cursor-pointer">
                        <img src={`https://i.pravatar.cc/150?u=${i}`} alt="User" className="w-full h-full object-cover" />
                      </div>
                    ))}
                    <div className="w-12 h-12 rounded-2xl bg-[#F4FBFB] border-2 border-dashed border-[#005BC0]/20 flex items-center justify-center text-[#005BC0] text-xs font-black cursor-pointer hover:bg-[#005BC0]/5">
                      +
                    </div>
                  </div>
                </section>

              </div>
            </div>

            {/* Featured Gallery */}
            <section className="bg-white rounded-[3rem] p-8 md:p-12 shadow-xl shadow-black/5 border border-white">
              <div className="flex justify-between items-center mb-10">
                <h3 className="font-manrope font-extrabold text-3xl flex items-center gap-4 text-[#2D3435]">
                  <span className="material-symbols-outlined text-[#005BC0] text-4xl">photo_library</span> Moments
                </h3>
                <button className="text-[#005BC0] text-[10px] font-manrope font-black uppercase tracking-widest hover:underline">View All</button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 h-[400px] md:h-[500px]">
                {gallery.length > 0 ? (
                  <>
                    <div className="col-span-2 row-span-2 relative rounded-[2rem] overflow-hidden group shadow-lg">
                      <img src={gallery[0]?.images?.[0] || "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?q=80&w=2069&auto=format&fit=crop"} alt="Gallery" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-[#005BC0]/20 transition-colors"></div>
                    </div>
                    {gallery.slice(1, 5).map((item, idx) => (
                      <div key={idx} className="relative rounded-[2rem] overflow-hidden group shadow-lg">
                        <img src={item.images?.[0] || `https://images.unsplash.com/photo-${1504609773096 + idx}?q=80&w=2070&auto=format&fit=crop`} alt="Gallery" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
                      </div>
                    ))}
                  </>
                ) : (
                  [1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className={`relative rounded-[2rem] overflow-hidden bg-[#F4FBFB] border border-[#005BC0]/5 ${i === 1 ? 'col-span-2 row-span-2' : ''}`}>
                      <div className="w-full h-full flex items-center justify-center text-[#005BC0]/10">
                        <span className="material-symbols-outlined text-4xl">image</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

          </div>
        </main>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-[#005BC0]/10 py-16 px-8 text-center mt-20">
        <div className="max-w-4xl mx-auto space-y-8">
          <span className="font-manrope font-extrabold text-2xl tracking-tight text-[#005BC0]">WoC</span>
          <p className="text-[#2D3435]/40 text-xs font-bold tracking-[0.2em] uppercase max-w-md mx-auto leading-relaxed">
            A premium digital broadside exploring the intersections of shared experience and niche sub-cultures.
          </p>
          <div className="flex justify-center gap-8 pt-8">
            <Link href="/about" className="text-[10px] font-black uppercase tracking-widest text-[#2D3435]/60 hover:text-[#005BC0]">About</Link>
            <Link href="/privacy" className="text-[10px] font-black uppercase tracking-widest text-[#2D3435]/60 hover:text-[#005BC0]">Privacy</Link>
            <Link href="/terms" className="text-[10px] font-black uppercase tracking-widest text-[#2D3435]/60 hover:text-[#005BC0]">Terms</Link>
          </div>
          <div className="pt-12 border-t border-[#F4FBFB]">
            <p className="text-[8px] font-black tracking-[0.4em] text-[#2D3435]/20 uppercase">World of Community © 2026</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function NavItem({ href, icon, label, active = false }: { href: string; icon: string; label: string; active?: boolean }) {
  return (
    <Link 
      href={href}
      className={`flex items-center gap-4 px-5 py-4 rounded-2xl transition-all font-manrope font-extrabold text-sm tracking-tight ${
        active 
          ? 'bg-[#005BC0] text-white shadow-lg shadow-[#005BC0]/20' 
          : 'text-[#2D3435]/60 hover:bg-[#005BC0]/5 hover:text-[#005BC0]'
      }`}
    >
      <span className="material-symbols-outlined !text-[22px]">{icon}</span>
      <span>{label}</span>
      {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
    </Link>
  );
}

function ScheduleItem({ day, date, title, time, location, tag, tagColor = "bg-[#005BC0]/10 text-[#005BC0]" }: any) {
  return (
    <div className="flex items-center gap-6 p-6 rounded-[2rem] hover:bg-[#F4FBFB] transition-all group cursor-pointer border border-transparent hover:border-[#005BC0]/10">
      <div className="w-16 flex flex-col items-center">
        <span className="text-[10px] font-black text-[#2D3435]/30 uppercase tracking-[0.2em]">{day}</span>
        <span className="text-3xl font-manrope font-extrabold text-[#2D3435]">{date}</span>
      </div>
      <div className="w-px h-12 bg-[#F4FBFB]"></div>
      <div className="flex-1 min-w-0">
        <h4 className="font-extrabold text-xl group-hover:text-[#005BC0] transition-colors text-[#2D3435] truncate">{title}</h4>
        <p className="text-sm text-[#2D3435]/40 mt-1 font-medium">{time} • {location}</p>
      </div>
      <span className={`text-[9px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest ${tagColor}`}>
        {tag}
      </span>
    </div>
  );
}

function FeedItem({ user, content, time }: any) {
  return (
    <div className="p-6 rounded-3xl bg-[#F4FBFB]/50 hover:bg-[#F4FBFB] transition-all cursor-pointer border border-transparent hover:border-[#005BC0]/10 group">
      <div className="flex items-center gap-4 mb-4">
        <div className="w-10 h-10 rounded-xl bg-[#005BC0] flex items-center justify-center text-white font-black text-xs">
          {user.charAt(0)}
        </div>
        <div>
          <h4 className="font-extrabold text-[#2D3435] text-sm group-hover:text-[#005BC0] transition-colors">{user}</h4>
          <p className="text-[10px] text-[#2D3435]/40 font-black uppercase tracking-wider">{time}</p>
        </div>
      </div>
      <p className="text-[#2D3435]/70 text-sm leading-relaxed italic font-medium">
        &quot;{content}&quot;
      </p>
    </div>
  );
}
