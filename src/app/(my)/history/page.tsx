"use client";

import React, { useState } from 'react';

export default function HistoryPage() {
  const [activeTab, setActiveTab] = useState('All');

  const historyItems = [
    {
      date: '24 May, 2024',
      items: [
        {
          id: 1,
          type: 'Salon',
          title: 'Friday Night Milonga',
          location: 'Hongdae Club Tango',
          status: 'COMPLETED',
          statusColor: 'text-green-600 bg-green-50',
          icon: 'theater_comedy',
          time: '20:00 - 23:30',
        },
        {
          id: 2,
          type: 'Shop',
          title: 'Premium Leather Dance Shoes',
          location: 'Delivery to Home',
          status: 'SHIPPED',
          statusColor: 'text-blue-600 bg-blue-50',
          icon: 'shopping_bag',
          time: 'Order #WOC-9821',
        },
      ],
    },
    {
      date: '22 May, 2024',
      items: [
        {
          id: 3,
          type: 'Stays',
          title: 'Hongdae Traditional House',
          location: 'Seoul, South Korea',
          status: 'BOOKED',
          statusColor: 'text-orange-600 bg-orange-50',
          icon: 'home',
          time: 'Check-in: 15:00',
        },
      ],
    },
    {
      date: '20 May, 2024',
      items: [
        {
          id: 4,
          type: 'Events',
          title: 'World of Group Summit',
          location: 'Grand Ballroom',
          status: 'REGISTERED',
          statusColor: 'text-purple-600 bg-purple-50',
          icon: 'event',
          time: 'All-day Access',
        },
      ],
    },
  ];

  const filteredHistory = activeTab === 'All' 
    ? historyItems 
    : historyItems.map(day => ({
        ...day,
        items: day.items.filter(item => item.type === activeTab)
      })).filter(day => day.items.length > 0);

  return (
    <div className="min-h-screen bg-[#f8f9fa] pb-24">
      {/* Header */}
      <div className="bg-white px-4 py-4 sticky top-0 z-10 border-b border-gray-100">
        <h1 className="text-xl font-extrabold font-manrope mb-4">Activity History</h1>
        
        {/* Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {['All', 'Salon', 'Shop', 'Stays', 'Events'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${
                activeTab === tab 
                  ? 'bg-[#005BC0] text-white' 
                  : 'bg-[#f2f4f7] text-[#585c61]'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline List */}
      <div className="px-4 py-6 space-y-8">
        {filteredHistory.map((day, dayIdx) => (
          <div key={dayIdx}>
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 px-2">
              {day.date}
            </h2>
            <div className="space-y-3">
              {day.items.map((item) => (
                <div key={item.id} className="bg-white rounded-3xl p-4 shadow-sm border border-gray-50 flex gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${item.statusColor}`}>
                    <span className="material-symbols-outlined">{item.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <p className="text-[10px] font-bold text-gray-400 uppercase">{item.type}</p>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${item.statusColor}`}>
                        {item.status}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold mb-0.5 truncate">{item.title}</h3>
                    <p className="text-[11px] text-gray-500 mb-2 truncate">{item.location}</p>
                    <div className="flex items-center text-[10px] text-gray-400">
                      <span className="material-symbols-outlined text-xs mr-1">schedule</span>
                      {item.time}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
