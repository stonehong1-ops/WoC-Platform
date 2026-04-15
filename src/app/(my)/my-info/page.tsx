"use client";

import React, { useState } from 'react';

export default function MyInfoPage() {
  const [nickname, setNickname] = useState('Hongdae Explorer');
  const [notifications, setNotifications] = useState(true);
  const [locationSharing, setLocationSharing] = useState(false);

  return (
    <div className="min-h-screen bg-[#f8f9fa] pb-24">
      {/* Header */}
      <div className="bg-white px-4 py-6 border-b border-gray-100 mb-6">
        <h1 className="text-xl font-extrabold font-manrope">My Profile</h1>
      </div>

      {/* Profile Section */}
      <div className="px-4 mb-8">
        <div className="bg-white rounded-[40px] p-8 shadow-sm border border-gray-50 flex flex-col items-center text-center">
          <div className="relative mb-4">
            <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-[#ebeeef]">
              <img 
                src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&h=400&fit=crop" 
                alt="Profile" 
                className="w-full h-full object-cover"
              />
            </div>
            <button className="absolute bottom-0 right-0 w-8 h-8 bg-[#005BC0] text-white rounded-full flex items-center justify-center shadow-lg">
              <span className="material-symbols-outlined text-sm">edit</span>
            </button>
          </div>
          <h2 className="text-xl font-bold mb-1">{nickname}</h2>
          <p className="text-sm text-gray-400">Member since May 2024</p>
        </div>
      </div>

      {/* Account Settings */}
      <div className="px-4 space-y-6">
        <section>
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 px-2">Account Settings</h3>
          <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-50">
            <div className="p-4 flex items-center justify-between border-b border-gray-50">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-gray-400">badge</span>
                <span className="text-sm font-bold">Nickname</span>
              </div>
              <input 
                type="text" 
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="text-sm text-[#005BC0] font-bold text-right bg-transparent focus:outline-none"
              />
            </div>
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-gray-400">location_on</span>
                <span className="text-sm font-bold">Preferred Hubs</span>
              </div>
              <div className="flex gap-1">
                <span className="px-2 py-1 bg-[#f2f4f7] rounded-full text-[10px] font-bold">Hongdae</span>
                <span className="px-2 py-1 bg-[#f2f4f7] rounded-full text-[10px] font-bold">Gangnam</span>
              </div>
            </div>
          </div>
        </section>

        <section>
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 px-2">Society Activity Level</h3>
          <div className="bg-white rounded-3xl p-4 shadow-sm border border-gray-50">
            <div className="grid grid-cols-4 gap-2 mb-4">
              {['Diamond', 'Gold', 'Silver', 'Bronze'].map((tier) => (
                <div key={tier} className={`p-2 rounded-2xl text-center ${tier === 'Silver' ? 'bg-[#005BC0] text-white' : 'bg-[#f2f4f7] text-gray-400'}`}>
                  <span className="material-symbols-outlined block text-lg mb-1">
                    {tier === 'Diamond' ? 'diamond' : tier === 'Gold' ? 'military_tech' : tier === 'Silver' ? 'stars' : 'workspace_premium'}
                  </span>
                  <p className="text-[10px] font-bold">{tier}</p>
                </div>
              ))}
            </div>
            <div className="bg-[#f8f9fa] rounded-2xl p-3">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[11px] font-bold text-gray-500">Progress to Gold</span>
                <span className="text-[11px] font-bold text-[#005BC0]">65%</span>
              </div>
              <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div className="w-[65%] h-full bg-[#005BC0]"></div>
              </div>
            </div>
          </div>
        </section>

        <section>
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 px-2">Preferences</h3>
          <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-50">
            <div className="p-4 flex items-center justify-between border-b border-gray-50">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-gray-400">notifications</span>
                <span className="text-sm font-bold">Push Notifications</span>
              </div>
              <button 
                onClick={() => setNotifications(!notifications)}
                className={`w-10 h-5 rounded-full transition-colors relative ${notifications ? 'bg-[#005BC0]' : 'bg-gray-200'}`}
              >
                <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${notifications ? 'right-1' : 'left-1'}`}></div>
              </button>
            </div>
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-gray-400">near_me</span>
                <span className="text-sm font-bold">Location Services</span>
              </div>
              <button 
                onClick={() => setLocationSharing(!locationSharing)}
                className={`w-10 h-5 rounded-full transition-colors relative ${locationSharing ? 'bg-[#005BC0]' : 'bg-gray-200'}`}
              >
                <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${locationSharing ? 'right-1' : 'left-1'}`}></div>
              </button>
            </div>
          </div>
        </section>

        <button className="w-full py-4 text-sm font-bold text-red-500 bg-white rounded-3xl shadow-sm border border-gray-50">
          Sign Out
        </button>
      </div>
    </div>
  );
}
