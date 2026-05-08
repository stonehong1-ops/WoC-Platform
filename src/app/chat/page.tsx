'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import PageWrapper from '@/components/layout/PageWrapper';
import ChatList from '@/components/chat/ChatList';
import ChatRoom from '@/components/chat/ChatRoom';
import { useAuth } from '@/components/providers/AuthProvider';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';

function ChatContent() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const roomIdFromUrl = searchParams.get('roomId');
  
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(roomIdFromUrl);
  const [activeTab, setActiveTab] = useState<'Personal' | 'Group' | 'Market'>('Personal');
  const [initialTabSet, setInitialTabSet] = useState(false);
  const tabs = ['Personal', 'Group', 'Market'] as const;

  useEffect(() => {
    setSelectedRoomId(roomIdFromUrl);
  }, [roomIdFromUrl]);

  const handleRoomsLoaded = (counts: { market: number, group: number, personal: number }) => {
    // Set tab only once when initial rooms are loaded
    if (!initialTabSet) {
      if (counts.market > 0) {
        setActiveTab('Market');
      } else if (counts.group > 0) {
        setActiveTab('Group');
      } else {
        setActiveTab('Personal');
      }
      setInitialTabSet(true);
    }
  };

  const handleSelectRoom = (id: string) => {
    router.push(`/chat?roomId=${id}`);
  };

  const handleBack = () => {
    router.replace('/chat');
  };

  return (
    <PageWrapper>
      <div className="flex h-[calc(100vh-124px)] bg-[#FAF8FF] overflow-hidden font-manrope relative">
        {/* Left Side: Chat List (Always visible as background on mobile, side-by-side on desktop) */}
        <div className="w-full md:w-[380px] border-r border-slate-100 flex flex-col">
          <div className="p-6 pb-2">
            {/* Tab Control */}
            <div className="w-full flex items-center gap-1.5 overflow-x-auto no-scrollbar mb-4">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-shrink-0 px-4 py-2 rounded-lg text-[12px] font-bold tracking-wide transition-all whitespace-nowrap ${
                    activeTab === tab
                      ? 'bg-[#1E293B] text-white shadow-sm'
                      : 'bg-slate-50 text-slate-500 border border-slate-100 hover:bg-slate-100'
                  }`}
                >
                  {t(`chat.tab_${tab.toLowerCase()}`)}
                </button>
              ))}
            </div>
          </div>
          <ChatList 
            onSelectRoom={handleSelectRoom} 
            selectedRoomId={selectedRoomId} 
            category={activeTab}
            onRoomsLoaded={handleRoomsLoaded}
          />
        </div>

        {/* Right Side: Desktop placeholder / empty state */}
        {!selectedRoomId && (
          <div className="flex-1 hidden md:flex flex-col bg-[#FAF8FF] items-center justify-center">
            <div className="text-center p-10 animate-in fade-in zoom-in duration-500">
              <div className="w-24 h-24 rounded-full bg-white shadow-xl shadow-gray-200/50 flex items-center justify-center mb-8 mx-auto">
                <span className="material-symbols-outlined text-primary/20 text-[40px] animate-pulse">forum</span>
              </div>
              <h3 className="text-[22px] font-black text-gray-900 uppercase tracking-tighter mb-3">Your Dialogue Awaits</h3>
              <p className="text-[13px] text-gray-400 font-medium leading-relaxed max-w-xs mx-auto">
                Select a room to resume your connection with the group. Everything is synchronized in real-time.
              </p>
            </div>
          </div>
        )}

        {/* Fullscreen Chat Room Popup (Mobile) / Side pane (Desktop) */}
        <AnimatePresence>
          {selectedRoomId && (
            <motion.div 
              key="chat-room-popup"
              initial={{ opacity: 0, y: '100%' }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-0 h-[100dvh] w-full z-[100] bg-white flex flex-col md:relative md:h-auto md:w-auto md:inset-auto md:z-auto md:flex-1 md:shadow-none"
            >
              <ChatRoom 
                roomId={selectedRoomId} 
                onBack={handleBack} 
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageWrapper>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="h-screen bg-[#FAF8FF]" />}>
      <ChatContent />
    </Suspense>
  );
}
