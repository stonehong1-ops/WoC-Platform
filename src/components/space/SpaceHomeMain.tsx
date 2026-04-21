import React from 'react';
import { Community } from '@/types/community';
import CommunityFooter from './CommunityFooter';

interface SpaceHomeMainProps {
  community: Community;
  posts?: any[];
  loading?: boolean;
  handleJoin?: () => void;
  isMember?: boolean;
}

const SpaceHomeMain = ({ 
  community, 
  posts = [], 
  loading = false, 
  handleJoin = () => {}, 
  isMember = false 
}: SpaceHomeMainProps) => {
  return (
    <div className="flex-1 overflow-y-auto no-scrollbar pb-32">
      {/* Main Content Area - Matching Original Design Image */}
      <div className="pt-20 px-4 md:px-8 max-w-7xl mx-auto space-y-8 pb-8">
        
        {/* Hero Section */}
        <section className="relative rounded-xl overflow-hidden shadow-sm aspect-video max-h-[400px] w-full">
          <img 
            alt={community.name} 
            className="object-cover w-full h-full" 
            src={community.coverImage || "https://lh3.googleusercontent.com/aida-public/AB6AXuDmgTw1z77XdZAmz_0MD3pqggmINudggBz39QJXF77OYWIlyN3OgnZUyAr46RTl6uFXxo8GK09N0_7R9xXywU2ks3z-1_5LXOJooEX1v5l_ptYk-NZ3CsdE33uWUJCCEgSS5zZF2S-ZNG3QngPwtsy_PhOZ43WXx4vZoUDkkeS_INRP93IkgVw6QZkrGK5p1u6-fieCLtMBdiXrMtg1rOJRv5598VC7JghCWTFyQK1VWKHLVXYO9pAgGbw1ntk0-ObPEEmP3R1dHOE"}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-6 md:p-8">
            <h2 className="font-headline font-extrabold text-white text-3xl md:text-5xl leading-tight mb-2 uppercase tracking-tight">
              {community.name || "Freestyle Tango"}
            </h2>
            <p className="text-white/90 font-body text-sm md:text-base max-w-2xl">
              {community.description || "Connect, dance, and express yourself in the heart of our community."}
            </p>
          </div>
        </section>

        {/* Community Pulse & Notice */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Stats Widget */}
          <div className="bg-white rounded-xl p-6 shadow-sm flex flex-col justify-between border border-slate-200/50 hover:scale-[0.99] transition-transform">
            <h3 className="font-headline font-bold text-lg text-slate-900 mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-blue-600" style={{ fontVariationSettings: "'FILL' 1" }}>analytics</span> Community Pulse
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-500">Members (Male / Female)</span>
                  <span className="font-medium text-blue-600">45% / 55%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden flex">
                  <div className="bg-blue-600 h-2" style={{ width: '45%' }}></div>
                  <div className="bg-purple-600 h-2" style={{ width: '55%' }}></div>
                </div>
              </div>
              <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
                <span className="text-slate-500 text-sm">Today's Visitors</span>
                <div className="flex items-center gap-1 font-headline font-bold text-lg text-slate-900">
                  <span className="material-symbols-outlined text-green-500 text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>trending_up</span> 142
                </div>
              </div>
            </div>
          </div>

          {/* Notices */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200/50 hover:scale-[0.99] transition-transform flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-headline font-bold text-lg text-slate-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-purple-600" style={{ fontVariationSettings: "'FILL' 1" }}>campaign</span> Notice
              </h3>
              <button className="text-blue-600 text-xs font-bold uppercase tracking-wide hover:underline">View All</button>
            </div>
            <div className="flex-1 flex flex-col justify-center">
              <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer group">
                <div className="bg-red-50 text-red-600 p-2 rounded-lg group-hover:bg-red-100 transition-colors">
                  <span className="material-symbols-outlined text-sm font-bold">priority_high</span>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-slate-900">Studio B Closure Today</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Maintenance work in Studio B. Evening classes moved to Studio A.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Schedule Section */}
        <section>
          <div className="flex justify-between items-end mb-6">
            <div>
              <h2 className="font-headline font-extrabold text-2xl text-slate-900">Today's Schedule</h2>
              <p className="text-sm text-slate-500 mt-1">Thursday, October 12</p>
            </div>
            <button className="bg-white text-slate-900 border border-slate-200 px-4 py-2 rounded-full text-sm font-medium shadow-sm hover:bg-slate-50 transition-colors flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">filter_list</span> Filter
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Class Cards */}
            {[
              { title: "Fundamentals & Posture", level: "Beginner", time: "18:00 - 19:30", color: "bg-blue-600", tagBg: "bg-purple-100 text-purple-700", teacher: "Elena Rojas • Studio A" },
              { title: "Dynamic Giros", level: "Intermediate", time: "19:30 - 21:00", color: "bg-purple-600", tagBg: "bg-blue-100 text-blue-700", teacher: "Javier & Sofia • Studio A" },
              { title: "Practilonga", level: "All Levels", time: "21:00 - 00:00", color: "bg-slate-400", tagBg: "bg-slate-100 text-slate-600", teacher: "DJ Loco • Main Hall" }
            ].map((item, idx) => (
              <div key={idx} className="bg-white p-5 rounded-xl border border-slate-200/50 shadow-sm hover:shadow-md hover:scale-[0.99] transition-all cursor-pointer relative overflow-hidden group">
                <div className={`absolute top-0 left-0 w-1 h-full ${item.color} group-hover:w-2 transition-all`}></div>
                <div className="flex justify-between items-start mb-3 pl-3">
                  <span className={`${item.tagBg} font-label font-bold text-[10px] uppercase tracking-wider py-1 px-2 rounded-full`}>{item.level}</span>
                  <span className="text-slate-500 text-sm font-medium flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">schedule</span> {item.time}
                  </span>
                </div>
                <div className="pl-3">
                  <h3 className="font-headline font-bold text-lg text-slate-900 mb-1">{item.title}</h3>
                  <p className="text-sm text-slate-500 mb-4 flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">person</span> {item.teacher}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Recent Feed Section */}
        <section>
          <div className="flex justify-between items-end mb-6">
            <h2 className="font-headline font-extrabold text-2xl text-slate-900">Recent Feed</h2>
            <button className="text-blue-600 text-xs font-bold uppercase tracking-wide hover:underline">View Community</button>
          </div>
          <div className="space-y-4">
            {posts.length > 0 ? (
              posts.slice(0, 2).map((post: any) => (
                <div key={post.id} className="bg-white p-4 rounded-xl border border-slate-200/50 shadow-sm flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <img src={post.author?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.author?.id || post.id}`} className="w-10 h-10 rounded-full bg-slate-100" alt="" />
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">{post.author?.name || 'Anonymous'}</h4>
                      <p className="text-xs text-slate-500">2 hours ago</p>
                    </div>
                  </div>
                  <p className="text-sm text-slate-900">"{post.content}"</p>
                </div>
              ))
            ) : (
              <>
                <div className="bg-white p-4 rounded-xl border border-slate-200/50 shadow-sm flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">MR</div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">Maria Rodriguez</h4>
                      <p className="text-xs text-slate-500">2 hours ago</p>
                    </div>
                  </div>
                  <p className="text-sm text-slate-900">Anyone interested in practicing sacadas this weekend? Looking for a leader to drill some sequences from last night's class! 💃🕺</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200/50 shadow-sm flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold">TC</div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">Tango Collective</h4>
                      <p className="text-xs text-slate-500">5 hours ago</p>
                    </div>
                  </div>
                  <p className="text-sm text-slate-900">Just posted some photos from our Sunday Practica! Check out the gallery to find your best poses.</p>
                </div>
              </>
            )}
          </div>
        </section>

        {/* Open Classes Section */}
        <section>
          <div className="flex justify-between items-end mb-6">
            <h2 className="font-headline font-extrabold text-2xl text-slate-900">Open Classes</h2>
            <button className="text-blue-600 text-xs font-bold uppercase tracking-wide hover:underline">View All</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200/50 shadow-sm flex justify-between items-center">
              <div>
                <h3 className="font-headline font-bold text-lg text-slate-900 mb-1">Fundamentals & Posture</h3>
                <p className="text-sm text-slate-500">18:00 - 19:30 • Studio A</p>
              </div>
              <button className="bg-slate-50 text-blue-600 font-medium px-4 py-2 rounded-lg text-sm hover:bg-blue-50 transition-colors border border-blue-100">Book Spot</button>
            </div>
            <div className="bg-white p-5 rounded-xl border border-slate-200/50 shadow-sm flex justify-between items-center">
              <div>
                <h3 className="font-headline font-bold text-lg text-slate-900 mb-1">Dynamic Giros</h3>
                <p className="text-sm text-slate-500">19:30 - 21:00 • Studio A</p>
              </div>
              <button className="bg-blue-600 text-white shadow-md shadow-blue-200 font-medium px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors">Book Spot</button>
            </div>
          </div>
        </section>

        {/* Featured Event Section */}
        <section className="bg-gradient-to-br from-blue-400 to-purple-400 rounded-xl p-6 md:p-8 text-white shadow-md relative overflow-hidden">
          <div className="absolute -right-10 -bottom-10 opacity-20 pointer-events-none">
            <span className="material-symbols-outlined text-[150px]">celebration</span>
          </div>
          <div className="relative z-10">
            <span className="bg-white/20 backdrop-blur-sm font-label font-bold text-[10px] uppercase tracking-wider py-1 px-3 rounded-full mb-3 inline-block">Featured Event</span>
            <h2 className="font-headline font-extrabold text-2xl md:text-3xl mb-2">Grand Summer Milonga</h2>
            <p className="text-sm md:text-base mb-6 max-w-md opacity-90">Join us for an unforgettable evening of passion, connection, and rhythm under the stars. Live music by Orquesta Típica.</p>
            <div className="flex items-center gap-4">
              <button 
                onClick={handleJoin}
                className="bg-white text-blue-900 font-bold py-2 px-6 rounded-lg shadow-lg hover:bg-opacity-90 transition-all active:scale-95"
              >
                Get Tickets
              </button>
              <p className="text-sm font-medium">Sat, Nov 18 • 21:00</p>
            </div>
          </div>
        </section>
      </div>
      <CommunityFooter communityName={community.name} />
    </div>
  );
};

export default SpaceHomeMain;
