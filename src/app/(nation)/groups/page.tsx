'use client';

import React from 'react';

export default function CommunityPage() {
  return (
    <main className="py-6 px-4 max-w-5xl mx-auto space-y-10 pt-20">
      {/* Search Bar Section */}
      <section>
        <div className="relative group">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <span className="material-symbols-outlined text-[#757c7d]">search</span>
          </div>
          <input 
            className="w-full h-14 pl-12 pr-4 bg-white border-none rounded-xl shadow-sm focus:ring-2 focus:ring-[#1A73E8] outline-none transition-all placeholder:text-[#acb3b4] font-body" 
            placeholder="Search dancers, events, or techniques..." 
            type="text" 
          />
          <div className="absolute inset-y-0 right-4 flex items-center">
            <span className="material-symbols-outlined text-[#1A73E8] cursor-pointer">tune</span>
          </div>
        </div>
      </section>

      {/* Hot 5 Section (Bento Style) */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#9f403d]" style={{ fontVariationSettings: "'FILL' 1" }}>local_fire_department</span>
            <h2 className="text-xl font-extrabold tracking-tight text-[#2d3435]">Hot 5</h2>
          </div>
          <button className="text-sm font-semibold text-[#1A73E8] hover:underline">View trending</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-6 md:grid-rows-2 gap-4 h-auto md:h-[400px]">
          {/* Rank 1 (Featured) */}
          <div className="md:col-span-3 md:row-span-2 relative group overflow-hidden rounded-xl bg-gray-900 text-left">
            <img 
              className="absolute inset-0 w-full h-full object-cover opacity-70 group-hover:scale-105 transition-transform duration-500" 
              alt="Tango dancers" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAHnEAueohoJP_Qf_uhhEKtvzX6YFmqcVoyVIQ_OByAe-7XEPRfFh7pQBo8rKtWCJacyfCn4z3_F0v1vUHY17852MLtMTaRDfC3c9SviPs8jKboR0zy5hjxOXKWfMdq0G-ef4dW6WwORkLbfhRmbIzSqPqjqhfFX2wE2TuFdjBXwDAm1jIDNzGhZHBEwVjHTjWr0kRQKLLmcuiQiIHM1BpbpWI7m2T5vIk5Qu5ACzqLtF6uuxGpgY5aHlgC_o4eo2gwFeW0icQBbHjk" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
            <div className="absolute bottom-0 p-6">
              <span className="bg-[#9f403d] text-white text-[10px] font-bold px-2 py-1 rounded-sm mb-3 inline-block uppercase tracking-widest">Trending Now</span>
              <h3 className="text-2xl font-bold text-white leading-tight mb-2">Mastering the 'Abrazo': 5 Tips for Connection</h3>
              <p className="text-gray-300 text-sm line-clamp-2">The fundamental heart of tango lies in the embrace. Join the discussion on subtle weight shifts...</p>
            </div>
            <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md rounded-full w-8 h-8 flex items-center justify-center text-white font-bold">1</div>
          </div>
          
          {/* Rank 2 */}
          <div className="md:col-span-3 bg-[#f2f4f4] rounded-xl p-5 flex flex-col justify-between border border-[#acb3b4]/10 relative text-left">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#dfe3e8] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[#5b5f64]">theater_comedy</span>
                </div>
                <div>
                  <h4 className="font-bold text-[#2d3435] leading-tight">Summer Milonga 2024 Schedule</h4>
                  <p className="text-xs text-[#596061]">Posted by BuenosAiresAdmin</p>
                </div>
              </div>
              <span className="text-2xl font-black text-[#757c7d]/20">2</span>
            </div>
            <div className="mt-4 flex items-center gap-4 text-xs font-medium text-[#4e5257]">
              <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">chat_bubble</span> 128</span>
              <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">favorite</span> 450</span>
            </div>
          </div>
          
          {/* Rank 3, 4, 5 Grid */}
          <div className="md:col-span-1 bg-[#1A73E8] text-white rounded-xl p-4 flex flex-col justify-between relative overflow-hidden text-left">
            <span className="text-4xl font-black absolute -right-2 -bottom-2 opacity-20">3</span>
            <span className="material-symbols-outlined text-3xl">music_note</span>
            <h4 className="font-bold text-sm leading-snug mt-2">Best Orchestras for Beginners</h4>
          </div>
          <div className="md:col-span-1 bg-[#dde4e5] rounded-xl p-4 flex flex-col justify-between relative text-left">
            <span className="text-4xl font-black absolute -right-2 -bottom-2 opacity-10 text-[#2d3435]">4</span>
            <span className="material-symbols-outlined text-[#2d3435]">shopping_bag</span>
            <h4 className="font-bold text-sm leading-snug mt-2 text-[#2d3435]">Custom Shoe Group Buy</h4>
          </div>
          <div className="md:col-span-1 bg-white border border-[#acb3b4]/20 rounded-xl p-4 flex flex-col justify-between relative text-left">
            <span className="text-4xl font-black absolute -right-2 -bottom-2 opacity-10 text-[#2d3435]">5</span>
            <span className="material-symbols-outlined text-[#1A73E8]">school</span>
            <h4 className="font-bold text-sm leading-snug mt-2 text-[#2d3435]">Online Technique Clinic</h4>
          </div>
        </div>
      </section>

      {/* New Sub-Groups Section */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-extrabold tracking-tight text-[#2d3435]">New Sub-Groups</h2>
          <span className="material-symbols-outlined text-[#757c7d] cursor-pointer">arrow_forward</span>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
          {/* Group 1 */}
          {[
            {
              title: 'Golden Era Vinyls',
              desc: 'Collectors and enthusiasts of 1940s tango recordings.',
              members: '+12',
              img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD6873xjNdf9iTaekPmAYFtyIEoat76QiIOvLnKBk0PW-3c6rd3rTd4IHUSAHKomx7HDFHfRE-887qYM2zlZEuRm3U80yVI5eYYQs9YclT9lvy8P6J8GpLUGgbn_mvxAYs6cLV6_D1kerjU8Y0EWzR6lH_qPtbsbitqPO4b13fTeAWUuz1NcE7InrSXMy-w84cs6ZMSenjeavmYQdVcSpGRCOPVBWjevXVryWrHzXmrTNVsXqWbbO1JfyKQrUnC1E49K9tlH1r6Ybnx'
            },
            {
              title: 'Morning Practica',
              desc: 'Daily 7AM practice sessions for early birds in the city.',
              members: '+45',
              img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC-ExBHR1Rnj6zGlN5cxajUPShhHVTt51d1ZDywj49TKcPIDXFzWNwRJXhS57BkUvPY4qMFA0h0ipdQKAhyZU5g8ZuOv-EDP1x4VFPby-ze7fJOXIlpWr-dSyy1q8i7zlbyO1cEq0X8ow4e5e7C0NWjs-DdaUG_rtjB4XpIjebgx6AFdxiP20s0InlL5CKeaZj1O5DDtEsztmivnBcPVlm2kpKHnkWxwQkstdzgJkkW_W62ctK8E27hFRVGU8IyRqx6CzByWn9TQmeW'
            },
            {
              title: 'Buenos Aires Trip 2025',
              desc: 'Planning the ultimate pilgrimage to the heart of Tango.',
              members: '+88',
              img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAzxXvHnLBz4lUBS6rVrSivOx9CRTWkfZKRNVjgjorrmmdmU3UT35Iv_lnCBXGjMT3-RI773m_rFV9tvOncYGTza3MiXIFEjHk-0U8__pxP6-Oun0j2zF6VS4fHu9pF9fJrNINlYKp2OP_MfJkz-9ziBEGzhnm_mk2J9NLairTYbtTr9sIwcPuZBmibPX6V5oZlaJSR6spwZ5CRTZh4mrFbH6erXvXFgjoLObv1HgxN0D9I-uORvuMuPPeRXHg_ElkoK5K1X-qwcVhG'
            }
          ].map((group, i) => (
            <div key={i} className="flex-none w-64 bg-white rounded-2xl p-4 border border-[#acb3b4]/10 shadow-sm group hover:shadow-md transition-shadow text-left">
              <div className="w-full h-32 rounded-xl mb-4 overflow-hidden">
                <img 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform" 
                  alt={group.title} 
                  src={group.img} 
                />
              </div>
              <h3 className="font-bold text-[#2d3435] mb-1">{group.title}</h3>
              <p className="text-xs text-[#596061] mb-4">{group.desc}</p>
              <div className="flex items-center justify-between">
                <div className="flex -space-x-2">
                  <div className="w-6 h-6 rounded-full border-2 border-white bg-gray-200"></div>
                  <div className="w-6 h-6 rounded-full border-2 border-white bg-gray-300"></div>
                  <div className="w-6 h-6 rounded-full border-2 border-white bg-[#d8e2ff] text-[8px] flex items-center justify-center font-bold text-[#003d85]">{group.members}</div>
                </div>
                <button className="bg-[#d8e2ff] text-[#004fa8] text-xs font-bold px-4 py-1.5 rounded-full hover:bg-[#1A73E8] hover:text-white transition-colors">Join</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Browse by Category Grid */}
      <section className="pb-12 text-left">
        <h2 className="text-xl font-extrabold tracking-tight text-[#2d3435] mb-6">Browse by Category</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { name: 'Q&A', icon: 'help' },
            { name: 'Marketplace', icon: 'storefront' },
            { name: 'General', icon: 'forum' },
            { name: 'Events', icon: 'event' }
          ].map((cat, i) => (
            <div key={i} className="aspect-square bg-[#ebeeef] rounded-2xl flex flex-col items-center justify-center gap-3 hover:bg-[#1A73E8]/5 transition-colors cursor-pointer border border-transparent hover:border-[#1A73E8]/20">
              <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-[#1A73E8] shadow-sm">
                <span className="material-symbols-outlined">{cat.icon}</span>
              </div>
              <span className="text-sm font-bold text-[#2d3435]">{cat.name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Floating Action Button */}
      <button className="fixed bottom-6 right-6 w-14 h-14 bg-[#1A73E8] text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition-transform z-40">
        <span className="material-symbols-outlined text-2xl">add</span>
      </button>

      <style jsx>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </main>
  );
}
