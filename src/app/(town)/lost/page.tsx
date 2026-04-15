'use client';

import React, { useState } from 'react';

export default function LostPage() {
  const [activeTab, setActiveTab] = useState('found');
  
  const categories = ['All', 'Shoes', 'Accessories', 'Tech', 'Clothing'];
  
  const recentReports = [
    {
      id: 1,
      type: 'found',
      title: 'Black Tango Shoes',
      category: 'Clothing & Shoes',
      location: 'Studio A - Main Hall',
      date: 'Oct 14, 2023',
      postedBy: 'User123',
      img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAtg-35ny4oHwqdf9wYo8kt-ox5vsXkBDdD75SK0J84BtkTiQt66O0JCfHRMFdAUWvDeJ5couza10184OjqRj9MvqDx-hSKQEtu2ODfOqOHmi-Swgqqt1T-6z9Hh6UG9eqmYG-rgF2E3szsXNGG1Zl1cbHloQnmjDylJCDhrgvuOJ3N9z8igTrGLlcX_D3Qa6c3iTVBufgozgQbWAzCKix1IPftp40PAbjpvBAn_mJsmN3GUe674_R2seVU7nWZU8uBMiZi-YNHyrbi'
    },
    {
      id: 2,
      type: 'verifying',
      title: 'Apple Watch Series 7',
      category: 'Tech & Electronics',
      location: 'Changing Room 2',
      date: 'Oct 13, 2023',
      statusMsg: 'Ownership check in progress...',
      img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAySKGRyXmI6yg9c6OS0n69govARhu0e50cRVWrMc96MNV8SRlmCZG5_r6i4ZFRuo2stPdk1cbT9-9hPf_4i8vYdysj_RAB25oXmA64geCMICrDyEPLOSkEBwqxnjdZKZVa3pO2CcYHqxLEgWZyV60l_KjUe25mda5z2MNW_5Ss5OxdSsrKQLyvnK_LYg4ziqwZSGC03MvwNj2XdSE2xDfCGgdn92foXmjvFDazl2JSNLmACFWiVg_GaPj2xAScIE6B--lBvf73Tleu'
    },
    {
      id: 3,
      type: 'claimed',
      title: 'Vintage Coin Purse',
      category: 'Accessories',
      location: 'Studio B',
      date: 'Oct 12, 2023',
      postedBy: 'TangoLover',
      statusMsg: 'Successfully returned Oct 12',
      img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCtnOF040NxN5iae48Of_V-B4E0ur5Jn_qiDquDDXZ1AuMnigFsRGaR5tWTX6quDH7NqArQLsShKW3cFENLQUq8U2u-L_jYNfRsOWombhuS8wKyigsWoEqJE2Hsrzvo4ZGD_gzXqFMrqZsX3llVxJx_APj6v5VV2xN-kedakFr01tFjtVxj6y3bUvS9Fg2Ky8w7R896ehDGhEoSescGXLhOePxYQEQ9MMIMoQ2oG1nZAnMOSyL47nP4qM4mmWZCzozk4IAykdlxusCr'
    }
  ];

  return (
    <main className="max-w-2xl mx-auto min-h-screen flex flex-col pt-16">
      {/* Search and Filter Section */}
      <section className="pt-6 px-6 pb-4 bg-white border-b border-surface-container-highest">
        {/* Specific Lost & Found Search Bar */}
        <div className="relative w-full mb-6">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline">search</span>
          <input 
            className="w-full pl-12 pr-4 py-3 bg-surface-container-low border border-outline-variant rounded text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-body" 
            placeholder="Search for lost items..." 
            type="text"
          />
        </div>
        
        {/* Category Chips */}
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          {categories.map((cat, i) => (
            <button 
              key={cat}
              className={`px-4 py-2 rounded text-sm font-medium whitespace-nowrap transition-all ${
                i === 0 ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* Status Tabs */}
      <section className="px-6 my-6">
        <div className="flex p-1 bg-surface-container-high rounded border border-outline-variant/30">
          <button 
            onClick={() => setActiveTab('found')}
            className={`flex-1 py-2 text-sm font-semibold rounded transition-all ${
              activeTab === 'found' ? 'bg-surface-container-lowest text-primary shadow-sm' : 'text-on-surface-variant'
            }`}
          >
            Found
          </button>
          <button 
            onClick={() => setActiveTab('lost')}
            className={`flex-1 py-2 text-sm font-semibold rounded transition-all ${
              activeTab === 'lost' ? 'bg-surface-container-lowest text-primary shadow-sm' : 'text-on-surface-variant'
            }`}
          >
            Lost
          </button>
        </div>
      </section>

      {/* Suggested Matches Section */}
      <section className="mb-8 px-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-bold uppercase tracking-widest text-outline">Active Matching</h2>
            <span className="px-2 py-0.5 bg-primary-container text-on-primary-container text-[10px] font-bold rounded-full">1 NEW MATCH</span>
          </div>
          <span className="text-xs font-semibold text-primary cursor-pointer hover:underline">View History</span>
        </div>

        {/* Match Detail Card */}
        <div className="bg-surface-container-lowest rounded-xl border border-primary/20 shadow-sm overflow-hidden">
          <div className="p-4 bg-primary/5 flex items-center justify-between border-b border-outline-variant/20">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-xl">auto_awesome</span>
              <span className="text-xs font-bold text-on-surface">Potential Match Found</span>
            </div>
            <div className="flex items-center gap-1.5 px-2 py-1 bg-green-100 rounded text-green-700">
              <span className="text-[10px] font-black">94% SIMILARITY</span>
            </div>
          </div>
          <div className="p-4">
            {/* Side by Side Comparison */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-outline uppercase">Your Lost Item</p>
                <div className="relative aspect-square rounded-lg overflow-hidden border border-outline-variant/30">
                  <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuCtnOF040NxN5iae48Of_V-B4E0ur5Jn_qiDquDDXZ1AuMnigFsRGaR5tWTX6quDH7NqArQLsShKW3cFENLQUq8U2u-L_jYNfRsOWombhuS8wKyigsWoEqJE2Hsrzvo4ZGD_gzXqFMrqZsX3llVxJx_APj6v5VV2xN-kedakFr01tFjtVxj6y3bUvS9Fg2Ky8w7R896ehDGhEoSescGXLhOePxYQEQ9MMIMoQ2oG1nZAnMOSyL47nP4qM4mmWZCzozk4IAykdlxusCr" alt="Lost Wallet" className="w-full h-full object-cover" />
                  <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-error text-[8px] font-bold text-white uppercase rounded-sm">LOST</div>
                </div>
                <p className="text-[11px] font-semibold text-on-surface truncate">Black Leather Wallet</p>
              </div>
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-outline uppercase">Found Match</p>
                <div className="relative aspect-square rounded-lg overflow-hidden border border-primary/30">
                  <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuCtnOF040NxN5iae48Of_V-B4E0ur5Jn_qiDquDDXZ1AuMnigFsRGaR5tWTX6quDH7NqArQLsShKW3cFENLQUq8U2u-L_jYNfRsOWombhuS8wKyigsWoEqJE2Hsrzvo4ZGD_gzXqFMrqZsX3llVxJx_APj6v5VV2xN-kedakFr01tFjtVxj6y3bUvS9Fg2Ky8w7R896ehDGhEoSescGXLhOePxYQEQ9MMIMoQ2oG1nZAnMOSyL47nP4qM4mmWZCzozk4IAykdlxusCr" alt="Found Wallet" className="w-full h-full object-cover" />
                  <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-green-500 text-[8px] font-bold text-white uppercase rounded-sm">MATCH FOUND</div>
                </div>
                <p className="text-[11px] font-semibold text-on-surface truncate">Black Wallet (Lounge)</p>
              </div>
            </div>

            {/* Ownership Verification Flow */}
            <div className="bg-surface-container-low p-3 rounded-lg border border-outline-variant/30 space-y-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-lg">verified_user</span>
                <p className="text-xs font-bold text-on-surface">Step 1: Verify Ownership</p>
              </div>
              <p className="text-[11px] text-on-surface-variant leading-relaxed">
                To protect the finder, please answer the security question: <br/>
                <span className="italic font-medium">"What was inside the card slot?"</span>
              </p>
              <input className="w-full px-3 py-2 text-xs border border-outline-variant rounded bg-white focus:outline-none" placeholder="Type your answer here..." type="text"/>
              <div className="flex gap-2 pt-1">
                <button className="flex-1 bg-primary text-on-primary text-[11px] font-bold py-2 rounded uppercase tracking-wide flex items-center justify-center gap-1 hover:brightness-110 active:scale-95 transition-all">
                  <span className="material-symbols-outlined text-sm">send</span> Submit Answer
                </button>
                <button className="flex-1 border border-primary text-primary text-[11px] font-bold py-2 rounded uppercase tracking-wide hover:bg-primary/5 active:scale-95 transition-all">
                  Contact Finder
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Item List */}
      <section className="px-6 space-y-4 pb-20">
        <div className="flex items-center justify-between pb-2 border-b border-outline-variant/20">
          <h2 className="text-xs font-bold uppercase tracking-widest text-outline">Recent Reports</h2>
          <span className="text-[10px] font-medium text-outline">Sort by: Newest</span>
        </div>

        {recentReports.map((item) => (
          <article 
            key={item.id} 
            className={`bg-surface-container-lowest rounded border overflow-hidden shadow-sm flex gap-4 p-3 group transition-opacity ${
              item.type === 'claimed' ? 'border-outline-variant/40 opacity-70' : 
              item.type === 'verifying' ? 'border-primary/30' : 'border-outline-variant/40'
            }`}
          >
            <div className="relative w-24 h-24 flex-shrink-0">
              <img src={item.img} alt={item.title} className={`w-full h-full object-cover rounded ${item.type === 'claimed' ? 'grayscale' : ''}`} />
              <div className={`absolute top-1 left-1 px-1.5 py-0.5 text-[10px] font-bold text-white uppercase rounded-sm ${
                item.type === 'found' ? 'bg-green-500' : 
                item.type === 'verifying' ? 'bg-amber-500' : 'hidden'
              }`}>
                {item.type}
              </div>
              {item.type === 'claimed' && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <div className="px-2 py-1 bg-white/90 text-[10px] font-black text-black uppercase rounded-sm border border-black">CLAIMED</div>
                </div>
              )}
            </div>

            <div className="flex flex-col justify-between flex-grow py-0.5">
              <div>
                <div className="flex justify-between items-start">
                  <h3 className={`font-bold leading-tight ${item.type === 'claimed' ? 'text-on-surface/60' : 'text-on-surface'}`}>
                    {item.title}
                  </h3>
                  {item.type !== 'claimed' && (
                    <span className={`material-symbols-outlined text-lg ${item.type === 'verifying' ? 'text-primary' : 'text-outline'}`}>
                      bookmark
                    </span>
                  )}
                </div>
                <p className={`text-xs font-medium ${item.type === 'claimed' ? 'text-on-surface-variant/60' : 'text-on-surface-variant'}`}>
                  {item.category}
                </p>
                <div className="mt-2 space-y-0.5">
                  <div className={`flex items-center text-[11px] ${item.type === 'claimed' ? 'text-outline/60' : 'text-outline'}`}>
                    <span className="material-symbols-outlined text-[14px] mr-1">
                      {item.type === 'claimed' ? 'check_circle' : 'location_on'}
                    </span>
                    {item.statusMsg || item.location}
                  </div>
                  {!item.statusMsg && (
                    <div className="flex items-center text-[11px] text-outline">
                      <span className="material-symbols-outlined text-[14px] mr-1">calendar_today</span>
                      {item.date}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center justify-between mt-2">
                <span className={`text-[10px] font-medium ${item.type === 'claimed' ? 'text-outline/60' : 'text-outline'}`}>
                  {item.type === 'claimed' ? `Found by: ${item.postedBy}` : item.type === 'verifying' ? item.statusMsg : `Posted by: ${item.postedBy}`}
                </span>
                {item.type === 'found' && (
                  <button className="bg-primary text-on-primary text-[11px] font-bold px-3 py-1.5 rounded uppercase tracking-wider hover:brightness-110 active:scale-95 transition-all">
                    It's Mine
                  </button>
                )}
                {item.type === 'verifying' && (
                  <button className="bg-surface-container-highest text-on-surface-variant text-[11px] font-bold px-3 py-1.5 rounded uppercase tracking-wider opacity-50 cursor-not-allowed">
                    Pending
                  </button>
                )}
              </div>
            </div>
          </article>
        ))}

        {/* Footer Action */}
        <div className="pt-8 pb-12 text-center">
          <div className="mb-4 flex flex-col items-center">
            <span className="material-symbols-outlined text-outline-variant text-4xl mb-2">find_in_page</span>
            <p className="text-sm text-outline font-medium">Looking for something else?</p>
          </div>
          <button className="inline-flex items-center gap-2 px-6 py-3 bg-on-background text-background font-bold text-sm rounded shadow-lg active:scale-95 transition-transform hover:bg-on-background/90">
            <span className="material-symbols-outlined">add_circle</span>
            Report New Lost Item
          </button>
        </div>
      </section>

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
