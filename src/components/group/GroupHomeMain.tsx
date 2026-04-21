import React from 'react';
import { Group } from '@/types/group';
import { motion } from 'framer-motion';

interface GroupHomeMainProps {
  group: Group;
}

const GroupHomeMain = ({ group }: GroupHomeMainProps) => {
  return (
    <div className="px-4 md:px-8 max-w-7xl mx-auto group-y-8 pb-32 pt-8">
      {/* Hero Section */}
      <section className="relative rounded-xl overflow-hidden shadow-sm aspect-video max-h-[400px] w-full group">
        <img 
          alt="Freestyle Tango Hero" 
          className="object-cover w-full h-full transition-transform duration-1000 group-hover:scale-105" 
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuDmgTw1z77XdZAmz_0MD3pqggmINudggBz39QJXF77OYWIlyN3OgnZUyAr46RTl6uFXxo8GK09N0_7R9xXywU2ks3z-1_5LXOJooEX1v5l_ptYk-NZ3CsdE33uWUJCCEgSS5zZF2S-ZNG3QngPwtsy_PhOZ43WXx4vZoUDkkeS_INRP93IkgVw6QZkrGK5p1u6-fieCLtMBdiXrMtg1rOJRv5598VC7JghCWTFyQK1VWKHLVXYO9pAgGbw1ntk0-ObPEEmP3R1dHOE" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#020a2f]/80 via-transparent to-transparent flex flex-col justify-end p-6 md:p-8">
          <h2 className="font-headline font-extrabold text-white text-3xl md:text-5xl leading-tight mb-2">Freestyle Tango</h2>
          <p className="text-[#f2f1ff]/90 font-body text-sm md:text-base max-w-2xl">Connect, dance, and express yourself in the heart of our group.</p>
        </div>
      </section>

      {/* Group Pulse & Notice */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Stats Widget */}
        <div className="bg-white rounded-xl p-6 shadow-sm flex flex-col justify-between border border-[#a3abd7]/10 hover:scale-[0.99] transition-transform">
          <h3 className="font-headline font-bold text-lg text-[#242c51] mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-[#0057bd]">analytics</span> Group Pulse
          </h3>
          <div className="group-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-[#515981]">Members (Male / Female)</span>
                <span className="font-medium text-[#0057bd]">45% / 55%</span>
              </div>
              <div className="w-full bg-[#e4e7ff] rounded-full h-2 overflow-hidden flex">
                <div className="bg-[#0057bd] h-2" style={{ width: "45%" }}></div>
                <div className="bg-[#893c92] h-2" style={{ width: "55%" }}></div>
              </div>
            </div>
            <div className="pt-2 border-t border-[#a3abd7]/10 flex justify-between items-center">
              <span className="text-[#515981] text-sm">Today&apos;s Visitors</span>
              <div className="flex items-center gap-1 font-headline font-bold text-lg text-[#242c51]">
                <span className="material-symbols-outlined text-green-500 text-sm">trending_up</span> 142
              </div>
            </div>
          </div>
        </div>

        {/* Notices */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-[#a3abd7]/10 hover:scale-[0.99] transition-transform flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-headline font-bold text-lg text-[#242c51] flex items-center gap-2">
              <span className="material-symbols-outlined text-[#893c92]">campaign</span> Notice
            </h3>
            <button className="text-[#0057bd] text-xs font-bold uppercase tracking-wide hover:underline">View All</button>
          </div>
          <div className="flex-1 flex flex-col justify-center">
            <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-[#F1F5F9] transition-colors cursor-pointer group">
              <div className="bg-[#fb5151]/20 text-[#b31b25] p-2 rounded-lg group-hover:bg-[#fb5151]/30 transition-colors">
                <span className="material-symbols-outlined text-sm">priority_high</span>
              </div>
              <div>
                <h4 className="font-medium text-sm text-[#242c51]">Studio B Closure Today</h4>
                <p className="text-xs text-[#515981] mt-0.5">Maintenance work in Studio B. Evening classes moved to Studio A.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Schedule Section */}
      <section>
        <div className="flex justify-between items-end mb-6">
          <div>
            <h2 className="font-headline font-extrabold text-2xl text-[#242c51]">Today&apos;s Schedule</h2>
            <p className="text-sm text-[#515981] mt-1">Thursday, October 12</p>
          </div>
          <button className="bg-white text-[#242c51] border border-[#a3abd7]/20 px-4 py-2 rounded-full text-sm font-medium shadow-sm hover:bg-[#F1F5F9] transition-colors flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">filter_list</span> Filter
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Class Card 1 */}
          <div className="bg-white p-5 rounded-xl border border-[#a3abd7]/10 shadow-sm hover:shadow-md hover:scale-[0.99] transition-all cursor-pointer relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-1 h-full bg-[#0057bd] group-hover:w-2 transition-all"></div>
            <div className="flex justify-between items-start mb-3 pl-3">
              <span className="bg-[#f199f7]/30 text-[#5e106a] font-label font-bold text-[10px] uppercase tracking-wider py-1 px-2 rounded-full">Beginner</span>
              <span className="text-[#515981] text-sm font-medium flex items-center gap-1"><span className="material-symbols-outlined text-xs">schedule</span> 18:00 - 19:30</span>
            </div>
            <div className="pl-3">
              <h3 className="font-headline font-bold text-lg text-[#242c51] mb-1">Fundamentals & Posture</h3>
              <p className="text-sm text-[#515981] mb-4 flex items-center gap-1">
                <span className="material-symbols-outlined text-xs">person</span> Elena Rojas • Studio A
              </p>
            </div>
          </div>
          {/* Class Card 2 */}
          <div className="bg-white p-5 rounded-xl border border-[#a3abd7]/10 shadow-sm hover:shadow-md hover:scale-[0.99] transition-all cursor-pointer relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-1 h-full bg-[#893c92] group-hover:w-2 transition-all"></div>
            <div className="flex justify-between items-start mb-3 pl-3">
              <span className="bg-[#6e9fff]/30 text-[#002150] font-label font-bold text-[10px] uppercase tracking-wider py-1 px-2 rounded-full">Intermediate</span>
              <span className="text-[#515981] text-sm font-medium flex items-center gap-1"><span className="material-symbols-outlined text-xs">schedule</span> 19:30 - 21:00</span>
            </div>
            <div className="pl-3">
              <h3 className="font-headline font-bold text-lg text-[#242c51] mb-1">Dynamic Giros</h3>
              <p className="text-sm text-[#515981] mb-4 flex items-center gap-1">
                <span className="material-symbols-outlined text-xs">person</span> Javier & Sofia • Studio A
              </p>
            </div>
          </div>
          {/* Class Card 3 */}
          <div className="bg-white p-5 rounded-xl border border-[#a3abd7]/10 shadow-sm hover:shadow-md hover:scale-[0.99] transition-all cursor-pointer relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-1 h-full bg-[#6c759e] group-hover:w-2 transition-all"></div>
            <div className="flex justify-between items-start mb-3 pl-3">
              <span className="bg-[#d6dbff] text-[#515981] font-label font-bold text-[10px] uppercase tracking-wider py-1 px-2 rounded-full">All Levels</span>
              <span className="text-[#515981] text-sm font-medium flex items-center gap-1"><span className="material-symbols-outlined text-xs">schedule</span> 21:00 - 00:00</span>
            </div>
            <div className="pl-3">
              <h3 className="font-headline font-bold text-lg text-[#242c51] mb-1">Practilonga</h3>
              <p className="text-sm text-[#515981] mb-4 flex items-center gap-1">
                <span className="material-symbols-outlined text-xs">music_note</span> DJ Loco • Main Hall
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Feed Section */}
      <section>
        <div className="flex justify-between items-end mb-6">
          <h2 className="font-headline font-extrabold text-2xl text-[#242c51]">Recent Feed</h2>
          <button className="text-[#0057bd] text-xs font-bold uppercase tracking-wide hover:underline">View Group</button>
        </div>
        <div className="group-y-4">
          <div className="bg-white p-4 rounded-xl border border-[#a3abd7]/10 shadow-sm flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#6e9fff] text-white flex items-center justify-center font-bold">MR</div>
              <div>
                <h4 className="font-bold text-sm text-[#242c51]">Maria Rodriguez</h4>
                <p className="text-xs text-[#515981]">2 hours ago</p>
              </div>
            </div>
            <p className="text-sm text-[#242c51]">Anyone interested in practicing sacadas this weekend? Looking for a leader to drill some sequences from last night&apos;s class! 💃🕺</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-[#a3abd7]/10 shadow-sm flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#f199f7] text-[#5e106a] flex items-center justify-center font-bold">TC</div>
              <div>
                <h4 className="font-bold text-sm text-[#242c51]">Tango Collective</h4>
                <p className="text-xs text-[#515981]">5 hours ago</p>
              </div>
            </div>
            <p className="text-sm text-[#242c51]">Just posted some photos from our Sunday Practica! Check out the gallery to find your best poses.</p>
          </div>
        </div>
      </section>

      {/* Open Classes Section */}
      <section>
        <div className="flex justify-between items-end mb-6">
          <h2 className="font-headline font-extrabold text-2xl text-[#242c51]">Open Classes</h2>
          <button className="text-[#0057bd] text-xs font-bold uppercase tracking-wide hover:underline">View All</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-5 rounded-xl border border-[#a3abd7]/10 shadow-sm flex justify-between items-center">
            <div>
              <h3 className="font-headline font-bold text-lg text-[#242c51] mb-1">Fundamentals & Posture</h3>
              <p className="text-sm text-[#515981]">18:00 - 19:30 • Studio A</p>
            </div>
            <button className="bg-[#F1F5F9] text-[#0057bd] font-medium px-4 py-2 rounded-lg text-sm hover:bg-[#0057bd]/10 transition-colors">Book Spot</button>
          </div>
          <div className="bg-white p-5 rounded-xl border border-[#a3abd7]/10 shadow-sm flex justify-between items-center">
            <div>
              <h3 className="font-headline font-bold text-lg text-[#242c51] mb-1">Dynamic Giros</h3>
              <p className="text-sm text-[#515981]">19:30 - 21:00 • Studio A</p>
            </div>
            <button className="bg-[#0057bd] text-white shadow-md shadow-[#0057bd]/20 font-medium px-4 py-2 rounded-lg text-sm hover:bg-[#004ca6] transition-colors">Book Spot</button>
          </div>
        </div>
      </section>

      {/* Upcoming Milonga Section */}
      <section className="bg-gradient-to-br from-[#6e9fff] to-[#f199f7] rounded-xl p-6 md:p-8 text-[#002150] shadow-md relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 opacity-20 pointer-events-none">
          <span className="material-symbols-outlined text-[150px]">celebration</span>
        </div>
        <div className="relative z-10">
          <span className="bg-white/30 font-label font-bold text-[10px] uppercase tracking-wider py-1 px-3 rounded-full mb-3 inline-block text-[#002150]">Featured Event</span>
          <h2 className="font-headline font-extrabold text-2xl md:text-3xl mb-2 text-[#002150]">Grand Summer Milonga</h2>
          <p className="text-sm md:text-base mb-6 max-w-md opacity-90 text-[#002150]">Join us for an unforgettable evening of passion, connection, and rhythm under the stars. Live music by Orquesta Típica.</p>
          <div className="flex items-center gap-4">
            <button className="bg-[#002150] text-white font-bold py-2 px-6 rounded-lg shadow-lg hover:bg-opacity-90 transition-all">Get Tickets</button>
            <p className="text-sm font-medium text-[#002150]">Sat, Nov 18 • 21:00</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default GroupHomeMain;
