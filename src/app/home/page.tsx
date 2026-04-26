"use client";

import React, { useState, useEffect } from 'react';
import { Event } from '@/types/event';
import { eventService } from '@/lib/firebase/eventService';
import { userService } from '@/lib/firebase/userService';
import { PlatformUser } from '@/types/user';
import { useAuth } from '@/components/providers/AuthProvider';

export default function HomePage() {
  const { user, profile } = useAuth();
  const [isSafeFloorOpen, setIsSafeFloorOpen] = useState(false);
  const [isRegionalReportsOpen, setIsRegionalReportsOpen] = useState(false);
  const [isRegistrationOpen, setIsRegistrationOpen] = useState(false);
  const [upcomingEvent, setUpcomingEvent] = useState<Event | null>(null);
  const [loadingEvent, setLoadingEvent] = useState(true);
  const [topMembers, setTopMembers] = useState<PlatformUser[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const events = await eventService.getUpcomingEvents(1);
        if (events.length > 0) {
          setUpcomingEvent(events[0]);
        }
      } catch (error) {
        console.error("Failed to fetch upcoming event:", error);
      } finally {
        setLoadingEvent(false);
      }
    };
    const fetchMembers = async () => {
      try {
        const members = await userService.getTopMembers(3);
        setTopMembers(members);
      } catch (error) {
        console.error("Failed to fetch top members:", error);
      } finally {
        setLoadingMembers(false);
      }
    };
    fetchEvent();
    fetchMembers();
  }, []);

  const handleLeaderboardClick = () => {
    setToastMessage("The society is not yet active enough to show the leaderboard.");
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const displayName = profile?.nickname || user?.displayName || 'Dancer';

  return (
    <main className="py-6 px-4 max-w-7xl mx-auto space-y-10 pb-24">
      {/* Welcome Section */}
      <section className="bg-primary-container/30 rounded-3xl p-8 border border-primary/10">
        <div className="max-w-2xl">
          <h2 className="text-2xl font-extrabold text-slate-900 mb-4 font-headline">
            {displayName}, Welcome to the World Tango Society
          </h2>
          <p className="text-slate-600 leading-relaxed font-body mb-6">
            A collective of dancers, artists, and seekers speaking the universal language of the embrace. Our community is built on profound connection, pure improvisation, and the silent conversation of moving as one.
          </p>
          <div className="flex flex-wrap gap-4">
            <span className="flex items-center gap-2 px-4 py-2 bg-white rounded-full text-sm font-semibold text-primary shadow-sm border border-primary/5">
              <span className="material-symbols-outlined text-lg">favorite</span> Connection
            </span>
            <span className="flex items-center gap-2 px-4 py-2 bg-white rounded-full text-sm font-semibold text-primary shadow-sm border border-primary/5">
              <span className="material-symbols-outlined text-lg">public</span> Improvisation
            </span>
          </div>
        </div>
      </section>

      {/* Featured Highlight */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div 
          className="lg:col-span-2 relative aspect-video rounded-[40px] overflow-hidden shadow-xl group cursor-pointer"
          onClick={() => setIsSafeFloorOpen(true)}
        >
          <img 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
            src="https://images.unsplash.com/photo-1518609878373-06d740f60d8b?q=80&w=1200" 
            alt="Safe Floor Policy" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
          <div className="absolute bottom-8 left-8 right-8">
            <span className="px-3 py-1 bg-red-600 text-white text-[10px] font-bold uppercase tracking-widest rounded-full mb-3 inline-block">Zero Tolerance Policy</span>
            <h3 className="text-2xl md:text-3xl font-black text-white mb-2 leading-tight font-headline">
              Safe Floor: Our Zero Tolerance Policy<br/>
              <span className="text-lg md:text-xl font-normal text-white/90">Protecting the trust and safety of our embrace.</span>
            </h3>
            <p className="text-white/80 max-w-lg font-body text-xs md:text-sm mt-3">
              Reaffirming our strict zero-tolerance policy against sexual harassment to protect the trust and safety of our community.
            </p>
            <button className="mt-5 px-6 py-3 bg-white text-slate-900 font-bold rounded-xl shadow-lg hover:bg-slate-100 transition-colors">
              Read Full Story
            </button>
          </div>
        </div>

        {/* Society Hot Issues Sidebar */}
        <div className="bg-surface-container rounded-[40px] p-6 flex flex-col border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <div className="flex flex-col gap-4 w-full">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-extrabold flex items-center gap-2 text-slate-900 font-headline">
                  <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>public</span>
                  Global Stats
                </h3>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500 font-medium">Active Members</span>
                <span className="font-bold text-slate-900">4,281</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500 font-medium">Total Stays</span>
                <span className="font-bold text-slate-900">156</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500 font-medium">Monthly Growth</span>
                <span className="font-bold text-primary text-xs">+482 New</span>
              </div>
            </div>
          </div>
          
          <button 
            onClick={() => setIsRegionalReportsOpen(true)}
            className="w-full mt-6 py-3 bg-primary/5 text-primary font-bold hover:bg-primary/10 transition-colors rounded-xl"
          >
            Tango Hotspots
          </button>
        </div>
      </section>

      {/* Upcoming Society Events */}
      <section className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-2xl font-extrabold text-slate-900 font-headline">Society Events</h2>
          <a className="text-primary font-bold text-sm hover:underline" href="/events">View Calendar</a>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loadingEvent ? (
            <div className="bg-white rounded-[32px] overflow-hidden border border-slate-100 shadow-sm p-6 flex items-center justify-center h-64 animate-pulse">
              <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
            </div>
          ) : upcomingEvent ? (
            <div className="bg-white rounded-[32px] overflow-hidden border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="h-40 bg-slate-200">
                <img 
                  className="w-full h-full object-cover" 
                  src={upcomingEvent.imageUrl || "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&q=80"} 
                  alt={upcomingEvent.title} 
                />
              </div>
              <div className="p-6">
                <span className="px-2 py-0.5 bg-blue-50 text-primary text-[10px] font-bold rounded-md uppercase tracking-wider mb-2 inline-block">
                  {upcomingEvent.category}
                </span>
                <h4 className="text-lg font-bold mb-2 font-headline line-clamp-1">{upcomingEvent.title}</h4>
                <div className="flex items-center text-gray-500 text-sm gap-4 mb-4">
                  <span className="flex items-center gap-1 font-medium italic">
                    <span className="material-symbols-outlined text-base text-primary">schedule</span> 
                    {upcomingEvent.startDate?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || 'TBA'}
                  </span>
                  <span className="flex items-center gap-1 font-medium italic line-clamp-1">
                    <span className="material-symbols-outlined text-base text-primary">location_on</span> 
                    {upcomingEvent.location || 'TBA'}
                  </span>
                </div>
                <button 
                  onClick={() => setIsRegistrationOpen(true)}
                  className="w-full py-3 bg-primary text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
                >
                  Reserve Member Spot
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-[32px] overflow-hidden border border-slate-100 shadow-sm p-8 text-center text-slate-500">
              <span className="material-symbols-outlined text-4xl mb-3 opacity-50">event_busy</span>
              <p className="font-medium">No upcoming events scheduled at the moment.</p>
            </div>
          )}
        </div>
      </section>

      {/* Members & Housing Section */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {/* Society Stays */}
        <div className="lg:col-span-2 space-y-6 px-2">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-extrabold text-slate-900 font-headline">Latest Society Stays</h2>
            <a className="text-primary font-bold text-sm hover:underline" href="/stay">Explore Stay</a>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="relative group rounded-[32px] overflow-hidden aspect-[4/3] shadow-md">
              <img 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                src="https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=800"
                alt="Stay 1"
              />
              <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-primary shadow-sm border border-white/20">$1,200/mo</div>
              <div className="absolute bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-black/80 to-transparent text-white">
                <h5 className="font-bold text-lg font-headline">The Glass House</h5>
                <p className="text-xs text-white/80 font-medium">3 Member Suites Available • Shared Kitchen</p>
              </div>
            </div>
            
            <div className="relative group rounded-[32px] overflow-hidden aspect-[4/3] shadow-md">
              <img 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                src="https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=800"
                alt="Stay 2"
              />
              <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-primary shadow-sm border border-white/20">$850/mo</div>
              <div className="absolute bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-black/80 to-transparent text-white">
                <h5 className="font-bold text-lg font-headline">Industrial Loft #42</h5>
                <p className="text-xs text-white/80 font-medium">1 Studio Suite • Private Balcony</p>
              </div>
            </div>
          </div>
        </div>

        {/* Distinguished Members */}
        <div className="space-y-6">
          <h2 className="text-2xl font-extrabold text-slate-900 font-headline px-2">Distinguished Members</h2>
          <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-6">
            <div className="space-y-6">
              {loadingMembers ? (
                <div className="space-y-4 animate-pulse">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-slate-200"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                        <div className="h-3 bg-slate-200 rounded w-1/3"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : topMembers.map((member, i) => {
                const visitCounts = [124, 86, 42];
                return (
                  <div key={member.id || i} className="flex items-center gap-4">
                    <div className="relative">
                      <img 
                        className="w-12 h-12 rounded-full object-cover border-2 border-primary/20 bg-slate-100" 
                        src={member.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.nickname || 'User')}&background=0f172a&color=fff&font-size=0.33&bold=true`} 
                        alt={member.nickname || 'Member'} 
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(member.nickname || 'User')}&background=0f172a&color=fff&font-size=0.33&bold=true`;
                        }}
                      />
                      {i === 0 && (
                        <span className="absolute -bottom-1 -right-1 bg-yellow-400 text-white p-0.5 rounded-full border-2 border-white material-symbols-outlined text-[10px]" style={{ fontVariationSettings: "'FILL' 1" }}>stars</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <h5 className="font-bold text-sm text-slate-900">{member.nickname || 'Unknown Member'}</h5>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                        {member.role === 'leader' ? 'SOCIETY HOST' : 'ACTIVE CONTRIBUTOR'} • {visitCounts[i] || 10} VISITS
                      </p>
                    </div>
                    <div className={`text-sm font-black ${i === 0 ? 'text-primary' : 'text-slate-300'}`}>#{i + 1}</div>
                  </div>
                );
              })}
            </div>
            <button 
              onClick={handleLeaderboardClick}
              className="w-full mt-8 py-3 text-primary text-sm font-bold bg-primary/5 rounded-xl hover:bg-primary/10 transition-colors"
            >
              Society Leaderboard
            </button>
          </div>
        </div>
      </section>

      {/* Society Marketplace & Games */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-8">
        <div className="bg-primary rounded-[32px] p-8 text-white flex items-center justify-between group overflow-hidden relative shadow-lg">
          <div className="relative z-10">
            <span className="text-white/80 text-[10px] font-bold uppercase tracking-[0.2em] mb-2 block">Member Marketplace</span>
            <h3 className="text-2xl font-extrabold mb-4 leading-tight font-headline">Discover Tango Shoes<br/>and Apparel Globally</h3>
            <a className="inline-flex items-center gap-2 bg-white text-primary px-5 py-2.5 rounded-xl font-bold text-sm hover:gap-3 transition-all shadow-md" href="/shop">
              Shop Collection <span className="material-symbols-outlined text-sm font-bold">arrow_forward</span>
            </a>
          </div>
          <div className="absolute -right-12 -bottom-12 opacity-10 transform rotate-12 group-hover:scale-110 transition-transform">
            <span className="material-symbols-outlined text-[200px]" style={{ fontVariationSettings: "'FILL' 1" }}>shopping_bag</span>
          </div>
        </div>

        <div className="bg-slate-900 rounded-[32px] p-8 text-white flex items-center justify-between group overflow-hidden relative shadow-lg">
          <div className="relative z-10">
            <span className="text-white/60 text-[10px] font-bold uppercase tracking-[0.2em] mb-2 block">Tango Collective</span>
            <h3 className="text-2xl font-extrabold mb-4 leading-tight font-headline">A Premium Multi-Brand<br/>Boutique for Dancers</h3>
            <a className="inline-flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:gap-3 transition-all shadow-md" href="/arcade">
              Enter Arcade <span className="material-symbols-outlined text-sm font-bold">sports_esports</span>
            </a>
          </div>
          <div className="absolute -right-12 -bottom-12 opacity-10 transform -rotate-12 group-hover:scale-110 transition-transform">
            <span className="material-symbols-outlined text-[200px]" style={{ fontVariationSettings: "'FILL' 1" }}>sports_esports</span>
          </div>
        </div>
      </section>

      {/* Full Story Popup */}
      {isSafeFloorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsSafeFloorOpen(false)} />
          <div className="relative w-full max-w-2xl max-h-[85vh] bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 bg-red-50 text-red-600 text-[10px] font-bold uppercase tracking-widest rounded-full">Zero Tolerance Policy</span>
              </div>
              <button 
                onClick={() => setIsSafeFloorOpen(false)}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>
            
            <div className="p-0 overflow-y-auto custom-scrollbar flex-1 bg-white">
              <div className="w-full h-64 sm:h-80 relative">
                <img 
                  src="https://images.unsplash.com/photo-1544078755-3d55ab8336d4?q=80&w=1200" 
                  alt="Tango Embrace" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent flex items-end p-8">
                  <h2 className="text-3xl md:text-4xl font-extrabold text-white font-headline leading-tight">
                    Where Respect is Lacking,<br/>Tango Cannot Exist
                  </h2>
                </div>
              </div>
              
              <div className="p-8 space-y-8">
                <div className="prose prose-slate prose-lg max-w-none">
                  <p className="text-xl font-medium text-slate-800 leading-relaxed font-headline italic border-l-4 border-primary pl-6 py-2 bg-slate-50/50 rounded-r-xl">
                    The essence of tango lies in the 'Abrazo' (embrace), built on deep respect and trust for one another. This beautiful, unspoken dialogue can only be completed when everyone on the floor feels psychologically and physically safe.
                  </p>
                  
                  <div className="my-10 grid grid-cols-1 sm:grid-cols-2 gap-8 items-center">
                    <img 
                      src="https://images.unsplash.com/photo-1508807526345-15e9b5f4eaff?q=80&w=800" 
                      alt="Tango dancers" 
                      className="rounded-3xl shadow-xl w-full h-56 object-cover"
                    />
                    <div className="flex flex-col justify-center">
                      <h3 className="text-xl font-extrabold text-slate-900 mb-4 font-headline">A Safe Environment</h3>
                      <p className="text-slate-600 text-[15px] leading-relaxed">
                        Recent incidents of sexual misconduct and harassment within the tango scene are shaking the foundation of this dance we cherish. Invading another's boundaries using power or status cannot be justified under any circumstances.
                      </p>
                    </div>
                  </div>

                  <h3 className="text-2xl font-extrabold text-slate-900 mt-12 mb-8 font-headline flex items-center gap-3">
                    <span className="material-symbols-outlined text-primary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>verified_user</span>
                    Our Promise for a Safe Embrace
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                      <h4 className="font-extrabold text-slate-900 text-lg mb-3 flex items-center gap-3">
                        <span className="w-10 h-10 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center text-sm font-black">1</span>
                        Zero Tolerance
                      </h4>
                      <p className="text-slate-600 pl-13 text-[15px] leading-relaxed ml-13">If sexual assault, sexual harassment, or unwanted physical/verbal harassment is confirmed, we will take immediate and permanent expulsion measures from the community, regardless of status or position.</p>
                    </div>
                    
                    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                      <h4 className="font-extrabold text-slate-900 text-lg mb-3 flex items-center gap-3">
                        <span className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center text-sm font-black">2</span>
                        Victim Solidarity and Protection
                      </h4>
                      <p className="text-slate-600 pl-13 text-[15px] leading-relaxed ml-13">We will listen to the voices of victims and strictly prohibit secondary victimization (blaming, spreading rumors, etc.). We will stand in solidarity until the end so that those who courageously speak out are not isolated.</p>
                    </div>
                    
                    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                      <h4 className="font-extrabold text-slate-900 text-lg mb-3 flex items-center gap-3">
                        <span className="w-10 h-10 rounded-2xl bg-green-50 text-green-600 flex items-center justify-center text-sm font-black">3</span>
                        Respect for Clear Boundaries
                      </h4>
                      <p className="text-slate-600 pl-13 text-[15px] leading-relaxed ml-13">When someone expresses rejection, it must be accepted immediately. Tango is a connection formed with consent, and no dance should be continued at the expense of one's comfort.</p>
                    </div>
                  </div>

                  <div className="mt-12 p-8 md:p-12 bg-slate-900 text-white rounded-[40px] text-center relative overflow-hidden shadow-2xl">
                    <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1544078755-3d55ab8336d4?q=80&w=1200')] bg-cover bg-center"></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/80 to-transparent"></div>
                    <div className="relative z-10">
                      <h3 className="text-2xl md:text-3xl font-black font-headline mb-6 leading-tight text-white">We must make the floor<br/>the safest place once again.</h3>
                      <p className="text-white/80 max-w-xl mx-auto text-[15px] leading-relaxed">
                        There is no art that blooms on someone's pain. For the day when everyone can make eye contact without fear and embrace each other again in complete trust, the World of Tango community promises to stand in solidarity with resolute action.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button 
                onClick={() => setIsSafeFloorOpen(false)}
                className="px-6 py-2.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors"
              >
                Acknowledge
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Regional Reports Popup */}
      {isRegionalReportsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsRegionalReportsOpen(false)} />
          <div className="relative w-full max-w-lg max-h-[85vh] bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="relative h-48 sm:h-56">
              <img 
                src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1200" 
                alt="Global Network" 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />
              <div className="absolute top-4 right-4">
                <button 
                  onClick={() => setIsRegionalReportsOpen(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-black/20 text-white hover:bg-black/40 backdrop-blur-md transition-colors"
                >
                  <span className="material-symbols-outlined text-lg">close</span>
                </button>
              </div>
              <div className="absolute bottom-6 left-6 right-6">
                <span className="px-3 py-1 bg-white/20 text-white text-[10px] font-bold uppercase tracking-widest rounded-full mb-2 inline-block backdrop-blur-md border border-white/20">Live Data</span>
                <h2 className="text-2xl font-extrabold text-white font-headline leading-tight">
                  Global Member Distribution
                </h2>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1 bg-slate-50">
              <div className="space-y-3">
                {[
                  { region: 'Seoul, South Korea', count: '1,250', percent: '29%', trend: '+12%' },
                  { region: 'Buenos Aires, Argentina', count: '840', percent: '20%', trend: '+5%' },
                  { region: 'Shanghai, China', count: '620', percent: '14%', trend: '+8%' },
                  { region: 'Istanbul, Turkey', count: '430', percent: '10%', trend: '+15%' },
                  { region: 'Tokyo, Japan', count: '280', percent: '7%', trend: '+3%' },
                  { region: 'Other Regions', count: '861', percent: '20%', trend: '+10%' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                        {i + 1}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900">{item.region}</h4>
                        <div className="flex items-center gap-2 text-xs font-medium mt-0.5">
                          <span className="text-slate-500">{item.percent}</span>
                          <span className="text-green-600 flex items-center"><span className="material-symbols-outlined text-[10px] mr-0.5">trending_up</span>{item.trend}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-black text-lg text-slate-900">{item.count}</span>
                      <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Members</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Registration Popup */}
      {isRegistrationOpen && (
        <div className="fixed inset-0 z-50 flex flex-col p-4 sm:p-6 md:p-10">
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" onClick={() => setIsRegistrationOpen(false)} />
          <div className="relative w-full max-w-3xl mx-auto bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-300 h-full max-h-[800px]">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="text-2xl font-extrabold text-slate-900 font-headline">Event Registration</h2>
              <button 
                onClick={() => setIsRegistrationOpen(false)}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>
            
            <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar flex-1 space-y-8 bg-slate-50">
              {upcomingEvent && (
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                  <div className="flex items-start gap-4">
                    <img 
                      src={upcomingEvent.imageUrl || "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&q=80"} 
                      alt={upcomingEvent.title}
                      className="w-24 h-24 rounded-xl object-cover"
                    />
                    <div>
                      <span className="px-2 py-0.5 bg-blue-50 text-primary text-[10px] font-bold rounded-md uppercase tracking-wider mb-2 inline-block">
                        {upcomingEvent.category}
                      </span>
                      <h3 className="text-xl font-bold font-headline mb-1">{upcomingEvent.title}</h3>
                      <p className="text-slate-500 text-sm mb-2">{upcomingEvent.startDate?.toDate().toLocaleString()}</p>
                      <p className="text-slate-600 text-sm line-clamp-2">{upcomingEvent.description}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-6">
                <h4 className="font-bold text-slate-900 text-lg">Attendee Information</h4>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Full Name</label>
                    <input type="text" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors bg-slate-50" placeholder="Enter your full name" disabled />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Email Address</label>
                    <input type="email" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors bg-slate-50" placeholder="your@email.com" disabled />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Special Requirements (Optional)</label>
                    <textarea className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors bg-slate-50 min-h-[100px]" placeholder="Any dietary requirements or special requests?" disabled></textarea>
                  </div>
                </div>
                
                <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 flex gap-3 text-amber-800">
                  <span className="material-symbols-outlined text-amber-600">info</span>
                  <p className="text-sm font-medium">Registration will open shortly. We are currently configuring the payment gateway for this event.</p>
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t border-slate-100 bg-white flex justify-end gap-3">
              <button 
                onClick={() => setIsRegistrationOpen(false)}
                className="px-6 py-3 text-slate-500 font-bold hover:text-slate-900 transition-colors"
              >
                Cancel
              </button>
              <button 
                className="px-8 py-3 bg-slate-200 text-slate-400 font-bold rounded-xl cursor-not-allowed"
                disabled
              >
                Confirm Registration
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Message */}
      {toastMessage && (
        <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="bg-slate-900 text-white px-6 py-3 rounded-full shadow-lg font-medium text-sm">
            {toastMessage}
          </div>
        </div>
      )}
    </main>
  );
}
