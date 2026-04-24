"use client";

import React from 'react';

export default function HomePage() {
  return (
    <main className="py-6 px-4 max-w-7xl mx-auto space-y-10 pb-24">
      {/* Welcome Section */}
      <section className="bg-primary-container/30 rounded-3xl p-8 border border-primary/10">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-extrabold text-slate-900 mb-4 font-headline">Welcome to Tango Society</h2>
          <p className="text-slate-600 leading-relaxed font-body mb-6">
            A collective of innovators, creators, and thinkers building the future of shared living. Our society is built on the values of radical transparency, micro-economies, and creative synergy.
          </p>
          <div className="flex flex-wrap gap-4">
            <span className="flex items-center gap-2 px-4 py-2 bg-white rounded-full text-sm font-semibold text-primary shadow-sm border border-primary/5">
              <span className="material-symbols-outlined text-lg">verified</span> Radical Shared Living
            </span>
            <span className="flex items-center gap-2 px-4 py-2 bg-white rounded-full text-sm font-semibold text-primary shadow-sm border border-primary/5">
              <span className="material-symbols-outlined text-lg">payments</span> Internal Economy
            </span>
          </div>
        </div>
      </section>

      {/* Featured Highlight */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 relative aspect-video rounded-[40px] overflow-hidden shadow-xl group">
          <img 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDt8x-6_x9p_1N-W7l-p9U2A8qP1H_X-B0Tz0z0z0z0z0z0z0z0z0z0z0z0z0z0z0z0z0z0z0z0z0z0" 
            alt="Society Spotlight" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          <div className="absolute bottom-8 left-8 right-8">
            <span className="px-3 py-1 bg-primary text-white text-[10px] font-bold uppercase tracking-widest rounded-full mb-3 inline-block">Society Spotlight</span>
            <h3 className="text-3xl font-black text-white mb-2 leading-tight font-headline">The Oasis: Our First<br/>Self-Sustaining Colony</h3>
            <p className="text-white/80 max-w-lg font-body text-sm md:text-base">Meet the members of 'The Oasis' house and how they built a thriving internal micro-economy.</p>
            <button className="mt-4 px-6 py-3 bg-white text-primary font-bold rounded-xl shadow-lg hover:bg-slate-100 transition-colors">Read Full Story</button>
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
          
          <button className="w-full mt-6 py-3 bg-primary/5 text-primary font-bold hover:bg-primary/10 transition-colors rounded-xl">
            View Regional Reports
          </button>
        </div>
      </section>

      {/* Upcoming Society Events */}
      <section className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-2xl font-extrabold text-slate-900 font-headline">Society Events</h2>
          <a className="text-primary font-bold text-sm hover:underline" href="#">View Calendar</a>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-[32px] overflow-hidden border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="h-40 bg-slate-200">
              <img className="w-full h-full object-cover" src="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&q=80" alt="Event" />
            </div>
            <div className="p-6">
              <span className="px-2 py-0.5 bg-blue-50 text-primary text-[10px] font-bold rounded-md uppercase tracking-wider mb-2 inline-block">Workshop</span>
              <h4 className="text-lg font-bold mb-2 font-headline">Founder Meetup: Scale & Stay</h4>
              <div className="flex items-center text-gray-500 text-sm gap-4 mb-4">
                <span className="flex items-center gap-1 font-medium italic"><span className="material-symbols-outlined text-base text-primary">schedule</span> 14:00</span>
                <span className="flex items-center gap-1 font-medium italic"><span className="material-symbols-outlined text-base text-primary">location_on</span> Main Hall</span>
              </div>
              <button className="w-full py-3 bg-primary text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-sm">Reserve Member Spot</button>
            </div>
          </div>
        </div>
      </section>

      {/* Members & Housing Section */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {/* Society Stays */}
        <div className="lg:col-span-2 space-y-6 px-2">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-extrabold text-slate-900 font-headline">Latest Society Stays</h2>
            <a className="text-primary font-bold text-sm hover:underline" href="#">Explore Properties</a>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="relative group rounded-[32px] overflow-hidden aspect-[4/3] shadow-md">
              <img 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBODkng9cuZIODXbBTDF-1Caae2oXaa-HcK57vYtyx_yB71U5pF05wKfR5JgGNRAxJAo_C4PCVY4N2F5muGWldjdQK0WB4NichWt8wRddBE8aXnrk5NZNMyz3ALlfllHTXwkYMLIE9zm_7qvz_XxezPoBO7FaabxXzHZ0LBw8Y46FiQg9jfr_8o7u7aVC6fxWyhoEO3VGmzlTqn5-G37WSv8HUghV_W1_nY-XAFqquyrO3RSDhRp-Wz44FWympyYwA2LjQDavXMw-g5"
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
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDTm3t3vm1QxxPfe5ylH4qmWvjjRNnq4apbsz9lj1gqtr3rBqWij-Tlhnj8FtCO-zRAYwBLrrhkqEun-PG3ItE_Jh442PrMzDpQtRme7y5EWJxStenrprykCporJeFl3ywBYxEtES2rrQcvpY5yZ5JNFrYHGsmhjYVwmkjdmv1vHYJ4TFxYhhnEaozKBKzhZEaHgB97Qbvy8SgQJDtm4ZmdXoRyGVlOzmN_4vYgGY4rtdbdAX9cVfjupg3TLlYMUWdVPqwTCns80xlF"
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
              {[
                { name: 'Elena Rodriguez', role: 'Founding Member • 2.4k Karma', img: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop', rank: '#1', special: true },
                { name: 'Marcus Chen', role: 'Society Host • 1.9k Karma', img: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop', rank: '#2' },
                { name: 'Sophie Varma', role: 'Active Contributor • 1.7k Karma', img: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop', rank: '#3' },
              ].map((member, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="relative">
                    <img className="w-12 h-12 rounded-full object-cover border-2 border-primary/20" src={member.img} alt={member.name} />
                    {member.special && (
                      <span className="absolute -bottom-1 -right-1 bg-yellow-400 text-white p-0.5 rounded-full border-2 border-white material-symbols-outlined text-[10px]" style={{ fontVariationSettings: "'FILL' 1" }}>stars</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <h5 className="font-bold text-sm text-slate-900">{member.name}</h5>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{member.role}</p>
                  </div>
                  <div className={`text-sm font-black ${i === 0 ? 'text-primary' : 'text-slate-300'}`}>{member.rank}</div>
                </div>
              ))}
            </div>
            <button className="w-full mt-8 py-3 text-primary text-sm font-bold bg-primary/5 rounded-xl hover:bg-primary/10 transition-colors">Society Leaderboard</button>
          </div>
        </div>
      </section>

      {/* Society Marketplace & Games */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-8">
        <div className="bg-primary rounded-[32px] p-8 text-white flex items-center justify-between group overflow-hidden relative shadow-lg">
          <div className="relative z-10">
            <span className="text-white/80 text-[10px] font-bold uppercase tracking-[0.2em] mb-2 block">Member Marketplace</span>
            <h3 className="text-2xl font-extrabold mb-4 leading-tight font-headline">Limited Edition<br/>Society Apparel</h3>
            <a className="inline-flex items-center gap-2 bg-white text-primary px-5 py-2.5 rounded-xl font-bold text-sm hover:gap-3 transition-all shadow-md" href="#">
              Shop Collection <span className="material-symbols-outlined text-sm font-bold">arrow_forward</span>
            </a>
          </div>
          <div className="absolute -right-12 -bottom-12 opacity-10 transform rotate-12 group-hover:scale-110 transition-transform">
            <span className="material-symbols-outlined text-[200px]" style={{ fontVariationSettings: "'FILL' 1" }}>shopping_bag</span>
          </div>
        </div>

        <div className="bg-slate-900 rounded-[32px] p-8 text-white flex items-center justify-between group overflow-hidden relative shadow-lg">
          <div className="relative z-10">
            <span className="text-white/60 text-[10px] font-bold uppercase tracking-[0.2em] mb-2 block">Society Games</span>
            <h3 className="text-2xl font-extrabold mb-4 leading-tight font-headline">Neon Racer<br/>Society Tournament</h3>
            <a className="inline-flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:gap-3 transition-all shadow-md" href="#">
              Enter Arcade <span className="material-symbols-outlined text-sm font-bold">sports_esports</span>
            </a>
          </div>
          <div className="absolute -right-12 -bottom-12 opacity-10 transform -rotate-12 group-hover:scale-110 transition-transform">
            <span className="material-symbols-outlined text-[200px]" style={{ fontVariationSettings: "'FILL' 1" }}>sports_esports</span>
          </div>
        </div>
      </section>
    </main>
  );
}
