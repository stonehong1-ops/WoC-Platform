import React from 'react';
import UserBadge from '../common/UserBadge';
import type { ChatRoom } from '@/types/chat';
import { UserProfile } from '@/types/user';

export interface ChatHeaderProps {
  room: ChatRoom | null;
  user: UserProfile | any;
  otherUser: any;
  otherUsers: any[];
  t: (key: string, ...args: any[]) => string;
  onBack: () => void;
  setIsSidebarOpen: (isOpen: boolean) => void;
}

export default function ChatHeader({
  room,
  user,
  otherUser,
  otherUsers,
  t,
  onBack,
  setIsSidebarOpen
}: ChatHeaderProps) {
  const isPrivate = room?.participants && room.participants.length <= 2;

  if (isPrivate) {
    const otherParticipantId = room?.participants.find(p => p !== user?.uid) || '';
    return (
      <div className="px-4.5 py-2.5 border-b border-gray-100/50 flex items-center justify-between bg-white/80 backdrop-blur-xl z-20 sticky top-0">
        <div className="flex items-center gap-4.5">
          <button onClick={onBack} className="md:hidden w-8.5 h-8.5 rounded-full flex items-center justify-center bg-gray-50 hover:bg-gray-100 transition-all text-gray-500">
            <span className="material-symbols-outlined text-[18px]">arrow_back_ios_new</span>
          </button>
          <UserBadge
            uid={otherParticipantId}
            nickname={otherUser?.nickname || otherUser?.displayName || t('chatroom.unknown', 'Unknown')}
            nativeNickname={otherUser?.nativeNickname}
            photoURL={otherUser?.photoURL}
            avatarSize="w-9 h-9 ring-2 ring-white shadow-xs"
            nameClassName="text-[15.5px] font-black text-gray-900 uppercase tracking-tighter line-clamp-1 hover:text-primary transition-colors"
            nativeClassName="text-[11px] font-medium text-gray-500 normal-case tracking-normal ml-1.5"
            subText={
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">{otherUser?.location || t('chatroom.default_location', 'Seoul, Korea')}</span>
              </div>
            }
          />
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="w-10 h-10 rounded-full flex items-center justify-center text-gray-400 hover:text-primary hover:bg-primary/5 transition-all"
            title="메뉴"
          >
            <span className="material-symbols-outlined text-[24px]">menu</span>
          </button>
        </div>
      </div>
    );
  }

  const roomName = room?.name || otherUsers.map(u => u.nickname || u.displayName).join(', ') || t('chatroom.room_chat');

  return (
    <div className="px-4.5 py-2.5 border-b border-gray-100/50 flex items-center justify-between bg-white z-20 sticky top-0">
      <div className="flex items-center gap-4.5">
        <button onClick={onBack} className="md:hidden w-8.5 h-8.5 rounded-full flex items-center justify-center bg-gray-50 hover:bg-gray-100 transition-all text-gray-500">
          <span className="material-symbols-outlined text-[18px]">arrow_back_ios_new</span>
        </button>
        <div className="flex flex-col">
          <h2 className="text-[15.5px] font-black text-gray-900 uppercase tracking-tighter line-clamp-1">
            {roomName}
          </h2>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              {room?.participants ? t('chatroom.members_count', { count: room.participants.length }) : t('chatroom.live_syncing')}
            </span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button 
          onClick={() => setIsSidebarOpen(true)}
          className="w-10 h-10 rounded-full flex items-center justify-center text-gray-400 hover:text-primary hover:bg-primary/5 transition-all"
          title="메뉴"
        >
          <span className="material-symbols-outlined text-[24px]">menu</span>
        </button>
      </div>
    </div>
  );
}
