"use client";

import React, { useState } from 'react';

export default function WalletPage() {
  const [activeTab, setActiveTab] = useState('monthly');

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="bg-surface px-4 py-4 sticky top-0 z-10 border-b border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-extrabold font-manrope">Class Shopping</h1>
          <button className="p-2">
            <span className="material-symbols-outlined text-2xl">search</span>
          </button>
        </div>

        {/* Filter Chips */}
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          <button className="px-4 py-1.5 bg-[#005BC0] text-white rounded-full text-sm font-semibold whitespace-nowrap">
            All Instructors
          </button>
          <button className="px-4 py-1.5 bg-[#f2f4f7] text-[#585c61] rounded-full text-sm font-semibold whitespace-nowrap">
            Hongdae Studio
          </button>
          <button className="px-4 py-1.5 bg-[#f2f4f7] text-[#585c61] rounded-full text-sm font-semibold whitespace-nowrap">
            Gangnam Base
          </button>
          <button className="px-4 py-1.5 bg-[#f2f4f7] text-[#585c61] rounded-full text-sm font-semibold whitespace-nowrap">
            Apgujeong
          </button>
        </div>
      </div>

      {/* Instructor Showcase */}
      <div className="px-4 py-6">
        <h2 className="text-lg font-bold font-manrope mb-4">Instructor Showcase</h2>
        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
          {[
            { name: 'Sebastian', role: 'Tango Master', img: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop' },
            { name: 'Mariana', role: 'Salsa Queen', img: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop' },
            { name: 'Julian', role: 'Yoga Guru', img: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop' },
          ].map((inst, i) => (
            <div key={i} className="flex-shrink-0 w-32">
              <div className="aspect-square rounded-2xl overflow-hidden mb-2 shadow-sm">
                <img src={inst.img} alt={inst.name} className="w-full h-full object-cover" />
              </div>
              <p className="text-sm font-bold text-center">{inst.name}</p>
              <p className="text-[10px] text-gray-500 text-center">{inst.role}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex px-4 border-b border-gray-100 mb-6">
        <button
          onClick={() => setActiveTab('monthly')}
          className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${
            activeTab === 'monthly' ? 'border-[#005BC0] text-[#005BC0]' : 'border-transparent text-gray-400'
          }`}
        >
          Monthly Classes
        </button>
        <button
          onClick={() => setActiveTab('intensive')}
          className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${
            activeTab === 'intensive' ? 'border-[#005BC0] text-[#005BC0]' : 'border-transparent text-gray-400'
          }`}
        >
          Intensive Series
        </button>
        <button
          onClick={() => setActiveTab('popup')}
          className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${
            activeTab === 'popup' ? 'border-[#005BC0] text-[#005BC0]' : 'border-transparent text-gray-400'
          }`}
        >
          Pop-up Specials
        </button>
      </div>

      {/* Class List */}
      <div className="px-4 space-y-4">
        {[
          {
            title: 'Tango Fundamentals',
            instructor: 'Sebastian',
            time: 'Tue, Thu 19:30',
            price: '$120',
            tag: 'Monthly',
            tagColor: 'bg-blue-50 text-blue-600',
            img: 'https://images.unsplash.com/photo-1547153760-18fc86324498?w=800&q=80',
          },
          {
            title: 'Advanced Salsa Spins',
            instructor: 'Mariana',
            time: 'Mon, Wed 20:00',
            price: '$150',
            tag: 'Intensive',
            tagColor: 'bg-purple-50 text-purple-600',
            img: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=800&q=80',
          },
          {
            title: 'Weekend Yoga Flow',
            instructor: 'Julian',
            time: 'Sat 10:00',
            price: '$45',
            tag: 'Pop-up',
            tagColor: 'bg-orange-50 text-orange-600',
            img: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&q=80',
          },
        ].map((item, i) => (activeTab === 'monthly' || i % 2 === 0) && (
          <div key={i} className="bg-surface rounded-3xl p-4 flex gap-4 shadow-sm border border-gray-50">
            <div className="w-24 h-24 rounded-2xl overflow-hidden flex-shrink-0">
              <img src={item.img} alt="" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-1">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${item.tagColor}`}>
                    {item.tag}
                  </span>
                  <span className="text-sm font-extrabold text-[#005BC0]">{item.price}</span>
                </div>
                <h3 className="text-sm font-bold mb-0.5">{item.title}</h3>
                <p className="text-[11px] text-gray-500">with {item.instructor}</p>
              </div>
              <div className="flex items-center text-[10px] text-gray-400">
                <span className="material-symbols-outlined text-xs mr-1">schedule</span>
                {item.time}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Floating Shopping Bag */}
      <div className="fixed bottom-24 right-4 flex flex-col items-center gap-2">
        <button className="w-14 h-14 bg-black text-white rounded-full shadow-xl flex items-center justify-center relative">
          <span className="material-symbols-outlined">shopping_bag</span>
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#005BC0] rounded-full text-[10px] flex items-center justify-center font-bold">
            2
          </span>
        </button>
      </div>
    </div>
  );
}
