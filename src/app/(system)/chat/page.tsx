'use client';

import React, { useState, useEffect } from 'react';
import PageWrapper from '@/components/layout/PageWrapper';
import ChatList from '@/components/chat/ChatList';
import ChatRoom from '@/components/chat/ChatRoom';
import { useAuth } from '@/components/providers/AuthProvider';
import { motion, AnimatePresence } from 'framer-motion';

export default function ChatPage() {
  const { user } = useAuth();
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);

  return (
    <PageWrapper>
      <div className="flex h-[calc(100vh-124px)] bg-white overflow-hidden font-manrope">
        {/* Left Side: Chat List (Hidden on mobile if a room is selected) */}
        <div className={`w-full md:w-[380px] border-r border-gray-50 flex flex-col ${selectedRoomId ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-6 border-b border-gray-50">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-[28px] font-black text-gray-900 uppercase tracking-tighter">Messages</h2>
              <button className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center hover:bg-gray-100 transition-all">
                <span className="material-symbols-outlined text-[20px] text-gray-500">edit_square</span>
              </button>
            </div>
            <div className="relative mt-4">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-300 text-[20px]">search</span>
              <input 
                type="text" 
                placeholder="Search conversations..."
                className="w-full pl-12 pr-4 py-3 bg-[#f8f9fa] border-none rounded-2xl text-sm font-medium placeholder:text-gray-300 focus:ring-1 focus:ring-primary/10 transition-all"
              />
            </div>
          </div>
          <ChatList 
            onSelectRoom={(id) => setSelectedRoomId(id)} 
            selectedRoomId={selectedRoomId} 
          />
        </div>

        {/* Right Side: Chat Room (Visible on mobile only if a room is selected) */}
        <div className={`flex-1 flex flex-col bg-[#f8f9fa] ${selectedRoomId ? 'flex' : 'hidden md:flex items-center justify-center'}`}>
          {selectedRoomId ? (
            <ChatRoom 
              roomId={selectedRoomId} 
              onBack={() => setSelectedRoomId(null)} 
            />
          ) : (
            <div className="text-center p-10 animate-in fade-in zoom-in duration-500">
              <div className="w-24 h-24 rounded-full bg-white shadow-xl shadow-gray-200/50 flex items-center justify-center mb-8 mx-auto">
                <span className="material-symbols-outlined text-primary/20 text-[40px] animate-pulse">forum</span>
              </div>
              <h3 className="text-[22px] font-black text-gray-900 uppercase tracking-tighter mb-3">Your Dialogue Awaits</h3>
              <p className="text-[13px] text-gray-400 font-medium leading-relaxed max-w-xs mx-auto">
                Select a room to resume your connection with the community. Everything is synchronized in real-time.
              </p>
            </div>
          )}
        </div>
      </div>
    </PageWrapper>
  );
}
