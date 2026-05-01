'use client';

import React, { useState, useEffect } from 'react';
import { chatService } from '@/lib/firebase/chatService';
import { ChatRoom } from '@/types/chat';
import { useAuth } from '@/components/providers/AuthProvider';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { safeDate } from '@/lib/utils/safeData';

interface ChatListProps {
  onSelectRoom: (roomId: string) => void;
  selectedRoomId?: string | null;
}

export default function ChatList({ onSelectRoom, selectedRoomId }: ChatListProps) {
  const { user } = useAuth();
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    
    chatService.initializeSystemRooms();
    const unsub = chatService.subscribeRooms(user.uid, (updatedRooms) => {
      setRooms(updatedRooms);
      setLoading(false);
    });

    return () => unsub();
  }, [user]);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col gap-4 p-6 animate-pulse">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="flex gap-4 items-center">
            <div className="w-14 h-14 rounded-full bg-gray-100" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-100 rounded w-1/3" />
              <div className="h-3 bg-gray-100 rounded w-2/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto no-scrollbar">
      {rooms.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-[60vh] text-center px-10">
          <div className="w-20 h-20 rounded-full bg-gray-50 flex items-center justify-center mb-6">
            <span className="material-symbols-outlined text-gray-200 text-4xl">chat_bubble</span>
          </div>
          <h3 className="text-lg font-black text-gray-900 mb-2 uppercase tracking-tighter">No Conversations</h3>
          <p className="text-xs text-gray-400 font-medium leading-relaxed">Start a new dialogue with the group or friends.</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-50">
          {rooms.map((room) => {
            const isSelected = selectedRoomId === room.id;
            const unreadCount = room.unreadCounts?.[user?.uid || ''] || 0;
            const lastTime = (() => {
              const d = safeDate(room.lastMessageTime);
              return d ? formatDistanceToNow(d, { addSuffix: true, locale: ko }) : '';
            })();

            return (
              <button
                key={room.id}
                onClick={() => onSelectRoom(room.id)}
                className={`w-full flex items-center gap-4 p-5 transition-all text-left ${isSelected ? 'bg-primary/5' : 'hover:bg-gray-50'}`}
              >
                <div className="relative shrink-0">
                  <div className="w-14 h-14 rounded-full overflow-hidden bg-gray-100 ring-1 ring-gray-100 shadow-inner flex items-center justify-center">
                    {room.imageUrl ? (
                      <img 
                        src={room.imageUrl} 
                        alt={room.name} 
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      <span className="material-symbols-outlined text-gray-400 text-[28px]">person</span>
                    )}
                  </div>
                  {room.type === 'notice' && (
                    <div className="absolute -top-1 -right-1 bg-primary text-white w-6 h-6 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                      <span className="material-symbols-outlined text-[12px] font-black">campaign</span>
                    </div>
                  )}
                  {unreadCount > 0 && (
                    <div className="absolute -top-1 -right-1 bg-red-500 text-white min-w-[20px] h-5 rounded-full px-1.5 flex items-center justify-center text-[10px] font-black border-2 border-white animate-in zoom-in">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-1">
                    <h3 className={`text-[15px] font-black truncate uppercase tracking-tight ${unreadCount > 0 ? 'text-gray-900' : 'text-gray-600'}`}>
                      {room.name}
                    </h3>
                    <span className="text-[10px] text-gray-400 font-bold ml-2 shrink-0">{lastTime}</span>
                  </div>
                  <p className={`text-[13px] truncate font-medium ${unreadCount > 0 ? 'text-gray-500' : 'text-gray-400'}`}>
                    {room.lastMessage}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
