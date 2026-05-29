'use client';

import React, { useState, useEffect, Suspense, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import PageWrapper from '@/components/layout/PageWrapper';
import ChatList from '@/components/chat/ChatList';
import ChatRoom from '@/components/chat/ChatRoom';
import { useAuth } from '@/components/providers/AuthProvider';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { chatService } from '@/lib/firebase/chatService';
import { toast } from 'sonner';

function ChatContent() {
  const { user, profile } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const roomIdFromUrl = searchParams.get('roomId');
  
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(roomIdFromUrl);
  const [activeTab, setActiveTab] = useState<'Personal' | 'Group' | 'Market'>('Personal');
  const [initialTabSet, setInitialTabSet] = useState(false);
  const [tabCounts, setTabCounts] = useState<{ market: number; group: number; personal: number }>({
    market: 0,
    group: 0,
    personal: 0
  });
  const tabs = ['Personal', 'Group', 'Market'] as const;

  // Smart Snooze Push state
  const [isSnoozed, setIsSnoozed] = useState(false);

  useEffect(() => {
    if (!profile) return;
    const snoozedUntil = (profile as any).notificationSnoozedUntil;
    if (snoozedUntil) {
      const date = snoozedUntil.toDate?.() || new Date(snoozedUntil);
      if (date > new Date()) {
        setIsSnoozed(true);
        return;
      }
    }
    setIsSnoozed(false);
  }, [profile]);

  const handleToggleSnooze = async () => {
    if (!user) return;
    const nextState = !isSnoozed;
    try {
      await chatService.snoozeNotifications(user.uid, nextState);
      setIsSnoozed(nextState);
      if (nextState) {
        toast.info(t('chat.snoozed_title', '알림 잠깐 꺼둠'), {
          description: t('chat.snoozed_desc', '내일 오전 9:00까지 소리/화면 차단'),
          icon: '🔕'
        });
      } else {
        toast.success(t('chat.active_title', '실시간 알림 수신 중'), {
          description: t('chat.active_desc', 'FCM 실시간 푸시 작동 중'),
          icon: '🔔'
        });
      }
    } catch (err) {
      console.error("Failed to toggle snooze:", err);
      toast.error(t('common.error', '오류가 발생했습니다.'));
    }
  };

  useEffect(() => {
    setSelectedRoomId(roomIdFromUrl);
  }, [roomIdFromUrl]);

  const handleRoomsLoaded = useCallback((counts: { market: number, group: number, personal: number }) => {
    setTabCounts(counts);
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
  }, [initialTabSet]);

  const handleSelectRoom = (id: string) => {
    router.push(`/chat?roomId=${id}`);
  };

  const handleBack = () => {
    setSelectedRoomId(null);
    router.replace('/chat');
  };

  return (
    <PageWrapper>
      <div className="flex h-[calc(100vh-124px)] bg-[#FAF8FF] overflow-hidden font-manrope relative">
        {/* Left Side: Chat List (Always visible as background on mobile, side-by-side on desktop) */}
        <div className="w-full md:w-[380px] border-r border-slate-100 flex flex-col">
          <div className="p-6 pb-2">
            {/* Tab Control & Snooze Trigger */}
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar flex-1">
                {tabs.map((tab) => {
                  const count = tabCounts[tab.toLowerCase() as 'market' | 'group' | 'personal'];
                  return (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`flex-shrink-0 px-4 py-2 rounded-lg text-[12px] font-bold tracking-wide transition-all whitespace-nowrap flex items-center gap-1.5 ${
                        activeTab === tab
                          ? 'bg-[#1E293B] text-white shadow-sm'
                          : 'bg-slate-50 text-slate-500 border border-slate-100 hover:bg-slate-100'
                      }`}
                    >
                      <span>{t(`chat.tab_${tab.toLowerCase()}`)}</span>
                      {count > 0 && (
                        <span className="inline-flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full text-[9px] font-black leading-none bg-red-500 text-white animate-in zoom-in">
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Ultra-compact Mini Snooze Button */}
              {user && (
                <button 
                  onClick={handleToggleSnooze}
                  title={isSnoozed ? t('chat.snoozed_desc', '내일 오전 9:00까지 소리/화면 차단') : t('chat.active_title', '실시간 알림 수신 중')}
                  className={`flex-shrink-0 px-2.5 py-1.5 rounded-md text-[11px] font-bold transition-all duration-300 flex items-center gap-1.5 border select-none ${
                    isSnoozed 
                      ? 'bg-amber-50 text-amber-600 border-amber-200 shadow-xs' 
                      : 'bg-slate-50 text-slate-500 border-slate-100 hover:bg-slate-100 hover:text-slate-600'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${isSnoozed ? 'bg-amber-500 animate-pulse' : 'bg-slate-400'}`} />
                  <span className="whitespace-nowrap font-semibold">
                    {isSnoozed ? t('chat.snooze_off', '잠깐 꺼짐') : t('chat.snooze_on', '알림 On')}
                  </span>
                </button>
              )}
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
                key={selectedRoomId}
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
