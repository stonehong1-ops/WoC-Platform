'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { chatService } from '@/lib/firebase/chatService';
import { userService } from '@/lib/firebase/userService';
import { ChatRoom } from '@/types/chat';
import { PlatformUser } from '@/types/user';
import { useAuth } from '@/components/providers/AuthProvider';
import { safeDate } from '@/lib/utils/safeDate';
import { useLanguage } from '@/contexts/LanguageContext';

interface ChatListProps {
  onSelectRoom: (roomId: string) => void;
  selectedRoomId?: string | null;
  category?: 'Personal' | 'Group' | 'Market';
  onRoomsLoaded?: (counts: { market: number, group: number, personal: number }) => void;
}

export function renderLastMessage(msg: string | null | undefined, t: (key: string, options?: any) => string): string {
  if (!msg) return '';
  if (msg.startsWith('chat.system_join_params::')) {
    try {
      const paramsStr = msg.split('chat.system_join_params::')[1];
      const { name } = JSON.parse(paramsStr);
      return t('chat.system_join', { name });
    } catch (e) {
      return msg;
    }
  }
  if (msg.startsWith('chat.system_leave_params::')) {
    try {
      const paramsStr = msg.split('chat.system_leave_params::')[1];
      const { name } = JSON.parse(paramsStr);
      return t('chat.system_leave', { name });
    } catch (e) {
      return msg;
    }
  }
  if (msg.startsWith('chat.system_kick_params::')) {
    try {
      const paramsStr = msg.split('chat.system_kick_params::')[1];
      const { name } = JSON.parse(paramsStr);
      return t('chat.system_kick', { name });
    } catch (e) {
      return msg;
    }
  }
  if (msg.startsWith('chat.')) {
    return t(msg);
  }
  return msg;
}


function RoomAvatar({ room, currentUserId }: { room: ChatRoom; currentUserId?: string }) {
  const { t } = useLanguage();
  const [otherUser, setOtherUser] = useState<PlatformUser | null>(null);
  const [otherUsers, setOtherUsers] = useState<PlatformUser[]>([]);
  const [loading, setLoading] = useState(true);

  const isGroup = room.participants && room.participants.length > 2;

  useEffect(() => {
    if (isGroup) {
      if (room.imageUrl) {
        setLoading(false);
        return;
      }
      
      const fetchGroupUsers = async () => {
        const otherIds = room.participants.filter(id => id !== currentUserId);
        try {
          const promises = otherIds.map(id => userService.getUserById(id));
          const users = await Promise.all(promises);
          const activeUsers = users.filter(Boolean) as PlatformUser[];
          
          const sorted = activeUsers.sort((a, b) => {
            const aHasPhoto = !!a.photoURL;
            const bHasPhoto = !!b.photoURL;
            if (aHasPhoto && !bHasPhoto) return -1;
            if (!aHasPhoto && bHasPhoto) return 1;
            return 0;
          });
          
          setOtherUsers(sorted.slice(0, 4));
        } catch (e) {
          console.error(e);
        }
        setLoading(false);
      };
      fetchGroupUsers();
      return;
    }

    if (room.imageUrl || (room.type !== 'personal' && room.type !== 'private' && room.type !== 'business')) {
      setLoading(false);
      return;
    }
    
    const fetchOtherUser = async () => {
      const otherId = room.participants.find(id => id !== currentUserId);
      if (otherId) {
        try {
          const user = await userService.getUserById(otherId);
          setOtherUser(user);
        } catch (e) {
          console.error(e);
        }
      }
      setLoading(false);
    };
    fetchOtherUser();
  }, [room, currentUserId, isGroup]);

  if (loading && (!room.imageUrl || isGroup)) {
    return (
      <div className="w-14 h-14 rounded-full bg-gray-50/50 ring-1 ring-gray-100 flex shrink-0 animate-pulse" />
    );
  }

  if (room.imageUrl) {
    return (
      <div className="w-14 h-14 rounded-full overflow-hidden bg-gray-100 ring-1 ring-gray-100 shadow-inner flex items-center justify-center shrink-0">
        <img 
          src={room.imageUrl} 
          alt={room.name || 'Chat'} 
          className="w-full h-full object-cover" 
        />
      </div>
    );
  }

  if ((room.type === 'groups' || room.type === 'group') && !room.imageUrl) {
    return (
      <div className="w-14 h-14 rounded-full overflow-hidden bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-purple-500/15 shadow-sm flex items-center justify-center shrink-0">
        <span className="material-symbols-outlined text-purple-600/80 text-[24px]">
          diversity_3
        </span>
      </div>
    );
  }

  if (isGroup && !room.imageUrl) {
    const list = otherUsers;
    
    if (list.length === 2) {
      return (
        <div className="w-14 h-14 rounded-full overflow-hidden bg-gray-50/50 ring-1 ring-gray-100 flex shrink-0">
          <div className="w-1/2 h-full overflow-hidden border-r border-white flex-shrink-0">
            {list[0].photoURL ? (
              <img src={list[0].photoURL} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-blue-50 text-blue-500 text-[10px] font-black uppercase">
                {list[0].nickname.charAt(0)}
              </div>
            )}
          </div>
          <div className="w-1/2 h-full overflow-hidden flex-shrink-0">
            {list[1].photoURL ? (
              <img src={list[1].photoURL} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-indigo-50 text-indigo-500 text-[10px] font-black uppercase">
                {list[1].nickname.charAt(0)}
              </div>
            )}
          </div>
        </div>
      );
    }

    if (list.length >= 3) {
      return (
        <div className="w-14 h-14 rounded-full overflow-hidden bg-gray-50/50 ring-1 ring-gray-100 flex shrink-0">
          <div className="w-1/2 h-full overflow-hidden border-r border-white flex-shrink-0">
            {list[0].photoURL ? (
              <img src={list[0].photoURL} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-blue-50 text-blue-500 text-[10px] font-black uppercase">
                {list[0].nickname.charAt(0)}
              </div>
            )}
          </div>
          <div className="w-1/2 h-full flex flex-col shrink-0">
            <div className="h-1/2 w-full overflow-hidden border-b border-white">
              {list[1].photoURL ? (
                <img src={list[1].photoURL} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-indigo-50 text-indigo-500 text-[8px] font-black uppercase">
                  {list[1].nickname.charAt(0)}
                </div>
              )}
            </div>
            <div className="h-1/2 w-full overflow-hidden">
              {list[2].photoURL ? (
                <img src={list[2].photoURL} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-purple-50 text-purple-500 text-[8px] font-black uppercase">
                  {list[2].nickname.charAt(0)}
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="w-14 h-14 rounded-full overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-50 ring-1 ring-blue-100/50 shadow-inner flex items-center justify-center shrink-0">
        <span className="material-symbols-outlined text-primary/70 text-[26px]">group</span>
      </div>
    );
  }

  const displayImage = room.imageUrl || otherUser?.photoURL;

  return (
    <div className="w-14 h-14 rounded-full overflow-hidden bg-gray-100 ring-1 ring-gray-100 shadow-inner flex items-center justify-center shrink-0">
      {displayImage ? (
        <img 
          src={displayImage} 
          alt={room.name || otherUser?.nickname || 'Chat'} 
          className="w-full h-full object-cover" 
        />
      ) : (
        <span className="material-symbols-outlined text-gray-400 text-[28px]">
          {room.type === 'notice' ? 'campaign' : 'person'}
        </span>
      )}
    </div>
  );
}

function RoomName({ room, currentUserId }: { room: ChatRoom; currentUserId?: string }) {
  const { t } = useLanguage();
  const [otherUser, setOtherUser] = useState<PlatformUser | null>(null);
  const [otherUsers, setOtherUsers] = useState<PlatformUser[]>([]);
  const [loading, setLoading] = useState(true);

  const isGroup = room.participants && room.participants.length > 2;

  useEffect(() => {
    if (isGroup) {
      if (room.name) {
        setLoading(false);
        return;
      }
      
      const fetchOtherUsers = async () => {
        const otherIds = room.participants.filter(id => id !== currentUserId);
        try {
          const promises = otherIds.map(id => userService.getUserById(id));
          const users = await Promise.all(promises);
          setOtherUsers(users.filter(Boolean) as PlatformUser[]);
        } catch (e) {
          console.error(e);
        }
        setLoading(false);
      };
      fetchOtherUsers();
      return;
    }

    if (room.name || (room.type !== 'personal' && room.type !== 'private' && room.type !== 'business')) {
      setLoading(false);
      return;
    }

    const fetchOtherUser = async () => {
      const otherId = room.participants.find(id => id !== currentUserId);
      if (otherId) {
        try {
          const user = await userService.getUserById(otherId);
          setOtherUser(user);
        } catch (e) {
          console.error(e);
        }
      }
      setLoading(false);
    };
    fetchOtherUser();
  }, [room, currentUserId, isGroup]);

  if (loading && (!room.name || isGroup)) {
    return <span className="h-4 w-24 bg-gray-100 rounded animate-pulse inline-block" />;
  }

  if (isGroup) {
    const displayName = room.name || otherUsers.map(u => u.nickname).join(', ') || t('chatroom.room_chat', '단체방');
    return (
      <span className="flex items-center gap-1">
        <span className="truncate max-w-[200px]">{displayName}</span>
      </span>
    );
  }

  if (room.name) {
    return <>{room.name}</>;
  }

  const nickname = otherUser?.nickname || 'Unknown User';
  const nativeNickname = otherUser?.nativeNickname;

  return (
    <span className="flex items-baseline gap-1.5">
      <span>{nickname}</span>
      {nativeNickname && (
        <span className="text-[11px] text-gray-400 font-normal lowercase">
          {nativeNickname}
        </span>
      )}
    </span>
  );
}

function RoomItem({ room, userId, selectedRoomId, onSelectRoom, onLongPress }: { room: ChatRoom; userId?: string; selectedRoomId?: string | null; onSelectRoom: (id: string) => void; onLongPress: (room: ChatRoom) => void }) {
  const { formatRelativeTime, t } = useLanguage();
  const isSelected = selectedRoomId === room.id;
  const unreadCount = room.unreadCounts?.[userId || ''] || 0;
  const lastTime = (() => {
    const d = safeDate(room.lastMessageTime);
    return d ? formatRelativeTime(d) : '';
  })();

  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const isLongPressActive = useRef(false);
  const touchStartPos = useRef<{ x: number; y: number } | null>(null);

  const startLongPress = (e: React.MouseEvent | React.TouchEvent) => {
    isLongPressActive.current = false;
    if (longPressTimer.current) clearTimeout(longPressTimer.current);

    if ('touches' in e && e.touches.length > 0) {
      touchStartPos.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY
      };
    } else if ('clientX' in e) {
      touchStartPos.current = {
        x: e.clientX,
        y: e.clientY
      };
    } else {
      touchStartPos.current = null;
    }

    longPressTimer.current = setTimeout(() => {
      isLongPressActive.current = true;
      onLongPress(room);
    }, 600); // 600ms threshold
  };

  const cancelLongPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    touchStartPos.current = null;
  };

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!touchStartPos.current || !longPressTimer.current) return;

    let currentX = 0;
    let currentY = 0;

    if ('touches' in e && e.touches.length > 0) {
      currentX = e.touches[0].clientX;
      currentY = e.touches[0].clientY;
    } else if ('clientX' in e) {
      currentX = e.clientX;
      currentY = e.clientY;
    } else {
      return;
    }

    const diffX = Math.abs(currentX - touchStartPos.current.x);
    const diffY = Math.abs(currentY - touchStartPos.current.y);

    // 10px 이상 이동 시 스크롤로 간주하여 롱클릭 취소
    if (diffX > 10 || diffY > 10) {
      cancelLongPress();
    }
  };

  const handleClick = () => {
    if (isLongPressActive.current) {
      isLongPressActive.current = false;
      return;
    }
    onSelectRoom(room.id);
  };

  return (
    <button
      key={room.id}
      onClick={handleClick}
      onMouseDown={startLongPress}
      onMouseUp={cancelLongPress}
      onMouseMove={handleMove}
      onMouseLeave={cancelLongPress}
      onTouchStart={startLongPress}
      onTouchEnd={cancelLongPress}
      onTouchMove={handleMove}
      onContextMenu={(e) => e.preventDefault()}
      style={{ WebkitTouchCallout: 'none', WebkitUserSelect: 'none', userSelect: 'none' }}
      className={`w-full flex items-center gap-4 p-5 transition-all text-left select-none ${isSelected ? 'bg-primary/5' : 'hover:bg-gray-50'}`}
    >
      <div className="relative shrink-0">
        <RoomAvatar room={room} currentUserId={userId} />
        {room.type === 'notice' && (
          <div className="absolute -top-1 -right-1 bg-primary text-white w-6 h-6 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
            <span className="material-symbols-outlined text-[12px] font-black">campaign</span>
          </div>
        )}
        {room.participants && room.participants.length > 2 ? (
          <div className="absolute -bottom-1 -right-1 bg-gradient-to-br from-blue-600 to-indigo-600 text-white min-w-[20px] h-5 rounded-full px-1.5 flex items-center justify-center text-[10px] font-black border-2 border-white shadow-sm">
            {room.participants.length}
          </div>
        ) : (room.type === 'groups' || room.type === 'group') && (
          <div className="absolute -bottom-0.5 -right-0.5 bg-blue-500 text-white w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">
            <span className="material-symbols-outlined text-[10px]">group</span>
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
            <RoomName room={room} currentUserId={userId} />
          </h3>
          <span className="text-[10px] text-gray-400 font-bold ml-2 shrink-0">{lastTime}</span>
        </div>
        <div className="flex justify-between items-center">
          <p className={`text-[13px] truncate font-medium ${unreadCount > 0 ? 'text-gray-500' : 'text-gray-400'}`}>
            {renderLastMessage(room.lastMessage || '', t)}
          </p>
          {(room.type === 'groups' || room.type === 'group') && room.participants && (
            <span className="text-[10px] text-gray-300 font-bold ml-2 shrink-0 flex items-center gap-0.5">
              <span className="material-symbols-outlined text-[12px]">person</span>
              {room.participants.length}
            </span>
          )}
        </div>
      </div>
    </button>

  );
}

export default function ChatList({ onSelectRoom, selectedRoomId, category = 'Personal', onRoomsLoaded }: ChatListProps) {
  const { t } = useLanguage();
  const { user, profile } = useAuth();
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);

  // Group creation states
  const [isGroupCreationModalOpen, setIsGroupCreationModalOpen] = useState(false);
  const [groupChatName, setGroupChatName] = useState('');
  const [groupSearchQuery, setGroupSearchQuery] = useState('');
  const [allPlatformUsers, setAllPlatformUsers] = useState<PlatformUser[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);

  useEffect(() => {
    if (isGroupCreationModalOpen) {
      userService.getAllUsers().then(users => {
        setAllPlatformUsers(users.filter(u => u.id !== user?.uid));
      }).catch(console.error);
    } else {
      setGroupChatName('');
      setGroupSearchQuery('');
      setSelectedUserIds(new Set());
      setAllPlatformUsers([]);
    }
  }, [isGroupCreationModalOpen, user?.uid]);

  const handleCreateGroupChat = async () => {
    if (!user || selectedUserIds.size === 0 || isCreatingGroup) return;
    setIsCreatingGroup(true);
    try {
      const participantIds = Array.from(selectedUserIds);
      let roomId = '';
      if (participantIds.length === 1) {
        roomId = await chatService.getOrCreatePrivateRoom([user.uid, participantIds[0]], user.uid, 'personal');
      } else {
        roomId = await chatService.createGeneralGroupChatRoom(participantIds, user.uid, groupChatName.trim());
      }
      setIsGroupCreationModalOpen(false);
      onSelectRoom(roomId);
    } catch (err) {
      console.error("Failed to create group chat:", err);
      alert(t('common.error', '단체 대화방 개설에 실패했습니다.'));
    } finally {
      setIsCreatingGroup(false);
    }
  };

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
    } catch (err) {
      console.error("Failed to toggle snooze:", err);
    }
  };

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [searchedUsers, setSearchedUsers] = useState<PlatformUser[]>([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [creatingRoom, setCreatingRoom] = useState<string | null>(null);
  
  // Custom Long Press and Resilient Localization cache states
  const [roomParticipantsNicknames, setRoomParticipantsNicknames] = useState<Record<string, { nickname: string; nativeNickname?: string }>>({});
  const [longPressActiveRoom, setLongPressActiveRoom] = useState<ChatRoom | null>(null);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Fetch participant nicknames for case-insensitive local search
  useEffect(() => {
    if (!rooms.length || !user) return;
    
    const fetchParticipantNicknames = async () => {
      const newCache = { ...roomParticipantsNicknames };
      let changed = false;
      
      for (const room of rooms) {
        if (room.type === 'personal' || room.type === 'private' || room.type === 'business') {
          if (newCache[room.id]) continue;
          
          const otherId = room.participants.find(id => id !== user.uid);
          if (otherId) {
            try {
              const u = await userService.getUserById(otherId);
              if (u) {
                newCache[room.id] = { nickname: u.nickname, nativeNickname: u.nativeNickname };
                changed = true;
              }
            } catch (e) {
              console.error(e);
            }
          }
        }
      }
      if (changed) {
        setRoomParticipantsNicknames(newCache);
      }
    };
    
    fetchParticipantNicknames();
  }, [rooms, user]);

  const handleLongPress = (room: ChatRoom) => {
    setLongPressActiveRoom(room);
    setIsLeaveModalOpen(true);
  };

  const handleLeaveRoom = async () => {
    if (!longPressActiveRoom || !user) return;
    setIsLeaving(true);
    try {
      await chatService.leaveRoom(longPressActiveRoom.id, user.uid);
      setIsLeaveModalOpen(false);
      setLongPressActiveRoom(null);
    } catch (e) {
      console.error("Failed to leave room:", e);
    } finally {
      setIsLeaving(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    
    chatService.initializeSystemRooms();
    const unsub = chatService.subscribeRooms(user.uid, (updatedRooms) => {
      setRooms(updatedRooms);
      setLoading(false);
      
      if (onRoomsLoaded) {
        const marketCount = updatedRooms.filter(r => r.type === 'business').reduce((sum, r) => sum + (r.unreadCounts?.[user.uid] || 0), 0);
        const groupCount = updatedRooms.filter(r => r.type === 'group' || r.type === 'groups' || r.type === 'notice' || r.type === 'public').reduce((sum, r) => sum + (r.unreadCounts?.[user.uid] || 0), 0);
        const personalCount = updatedRooms.filter(r => r.type === 'personal' || r.type === 'private').reduce((sum, r) => sum + (r.unreadCounts?.[user.uid] || 0), 0);
        onRoomsLoaded({ market: marketCount, group: groupCount, personal: personalCount });
      }
    });

    return () => unsub();
  }, [user, onRoomsLoaded]);

  // Close search overlay on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Clear search when tab changes
  useEffect(() => {
    setSearchQuery('');
    setIsSearchFocused(false);
    setSearchedUsers([]);
  }, [category]);

  // Debounced user search (Personal tab only)
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);

    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    if (category === 'Personal' && value.trim().length >= 2) {
      setSearchingUsers(true);
      debounceTimer.current = setTimeout(async () => {
        try {
          const results = await userService.searchUsers(value.trim());
          
          // Get all other user IDs from existing 1:1 personal rooms
          const existingPersonalUserIds = new Set<string>();
          rooms.forEach(r => {
            if (r.type === 'personal' || r.type === 'private') {
              if (r.participants && r.participants.length === 2) {
                const otherId = r.participants.find(uid => uid !== user?.uid);
                if (otherId) existingPersonalUserIds.add(otherId);
              }
            }
          });

          // Exclude self AND users we already have an active 1:1 chat room with
          const filtered = results.filter(u => u.id !== user?.uid && !existingPersonalUserIds.has(u.id));
          setSearchedUsers(filtered);
        } catch (err) {
          console.error('User search failed:', err);
          setSearchedUsers([]);
        }
        setSearchingUsers(false);
      }, 300);
    } else {
      setSearchedUsers([]);
      setSearchingUsers(false);
    }
  }, [category, user?.uid, rooms]);

  // Create or navigate to 1:1 room
  const handleUserSelect = async (targetUser: PlatformUser) => {
    if (!user || creatingRoom) return;
    setCreatingRoom(targetUser.id);
    try {
      const roomId = await chatService.getOrCreatePrivateRoom(
        [user.uid, targetUser.id],
        user.uid,
        'personal'
      );
      setIsSearchFocused(false);
      setSearchQuery('');
      setSearchedUsers([]);
      onSelectRoom(roomId);
    } catch (err) {
      console.error('Failed to create/get room:', err);
    }
    setCreatingRoom(null);
  };

  const filteredRooms = rooms.filter(room => {
    if (category === 'Personal') {
      return room.type === 'personal' || room.type === 'private';
    }
    if (category === 'Group') {
      return room.type === 'group' || room.type === 'groups' || room.type === 'notice' || room.type === 'public';
    }
    if (category === 'Market') {
      return room.type === 'business';
    }
    return true;
  });

  // Group tab sub-sections
  const publicRooms = filteredRooms.filter(r => r.type === 'notice' || r.type === 'public');
  const myGroupRooms = filteredRooms.filter(r => (r.type === 'groups' || r.type === 'group') && r.participants?.includes(user?.uid || ''));
  const discoverGroupRooms = filteredRooms.filter(r => (r.type === 'groups' || r.type === 'group') && !r.participants?.includes(user?.uid || ''));

  // Filter rooms by search query (name match & participant name match)
  const searchFilteredRooms = searchQuery.trim()
    ? filteredRooms.filter(room => {
        const queryLower = searchQuery.toLowerCase();
        const roomNameLower = (room.name || '').toLowerCase();
        if (roomNameLower.includes(queryLower)) return true;
        
        // Check participant nickname from cache (personal/business chats)
        const cached = roomParticipantsNicknames[room.id];
        if (cached) {
          const nickLower = (cached.nickname || '').toLowerCase();
          const nativeLower = (cached.nativeNickname || '').toLowerCase();
          if (nickLower.includes(queryLower) || nativeLower.includes(queryLower)) {
            return true;
          }
        }
        return false;
      })
    : filteredRooms;

  // Placeholder text per tab
  const getPlaceholder = () => {
    switch (category) {
      case 'Personal': return t('chat.searchPlaceholder');
      case 'Group': return t('chat.searchGroupsPlaceholder');
      case 'Market': return t('chat.searchMarketPlaceholder');
      default: return t('chat.searchPlaceholder');
    }
  };

  // Should show the search overlay (Personal + focused + has query)
  const showSearchOverlay = category === 'Personal' && isSearchFocused && searchQuery.trim().length > 0;

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
    <div className="flex-1 overflow-y-auto no-scrollbar flex flex-col">
      {/* Search Bar */}
      <div ref={searchRef} className="relative px-6 pb-4">
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-300 text-[20px]">search</span>
          <input 
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            placeholder={getPlaceholder()}
            className={`w-full pl-12 py-3 bg-white border border-slate-100 rounded-2xl text-sm font-medium placeholder:text-gray-300 focus:ring-1 focus:ring-primary/10 focus:border-primary/20 transition-all ${
              category === 'Personal' 
                ? (searchQuery ? 'pr-20' : 'pr-12') 
                : 'pr-10'
            }`}
          />
          {searchQuery && (
            <button 
              onClick={() => { setSearchQuery(''); setSearchedUsers([]); setIsSearchFocused(false); }}
              className={`absolute top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors ${
                category === 'Personal' ? 'right-12' : 'right-3'
              }`}
            >
              <span className="material-symbols-outlined text-gray-400 text-[14px]">close</span>
            </button>
          )}
          {category === 'Personal' && (
            <button 
              onClick={() => setIsGroupCreationModalOpen(true)}
              title={t('chatroom.create_group_button', '그룹 만들기')}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500/10 to-indigo-500/10 hover:from-blue-500/20 hover:to-indigo-500/20 text-primary flex items-center justify-center transition-all active:scale-95 border border-primary/5"
            >
              <span className="material-symbols-outlined text-[18px]">group_add</span>
            </button>
          )}
        </div>

        {/* Search Overlay (Personal tab only) */}
        {showSearchOverlay && (
          <div className="absolute left-6 right-6 top-full mt-1 bg-white rounded-2xl shadow-xl shadow-black/10 border border-slate-100 z-50 max-h-[60vh] overflow-y-auto no-scrollbar animate-in fade-in slide-in-from-top-2 duration-200">
            
            {/* Matching Conversations */}
            {searchFilteredRooms.length > 0 && (
              <div>
                <div className="px-4 pt-4 pb-2">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('chat.conversations')}</span>
                </div>
                {searchFilteredRooms.map(room => (
                  <button
                    key={room.id}
                    onClick={() => { onSelectRoom(room.id); setIsSearchFocused(false); setSearchQuery(''); }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-all text-left"
                  >
                    <RoomAvatar room={room} currentUserId={user?.uid} />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-[14px] font-bold text-gray-800 truncate">
                        <RoomName room={room} currentUserId={user?.uid} />
                      </h4>
                      <p className="text-[12px] text-gray-400 truncate">{renderLastMessage(room.lastMessage, t)}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Divider */}
            {searchFilteredRooms.length > 0 && (searchedUsers.length > 0 || searchingUsers) && (
              <div className="border-t border-gray-100 mx-4" />
            )}

            {/* People search results */}
            <div>
              <div className="px-4 pt-4 pb-2">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('chat.people')}</span>
              </div>

              {searchingUsers ? (
                <div className="flex items-center gap-3 px-4 py-4">
                  <div className="w-10 h-10 rounded-full bg-gray-100 animate-pulse" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3.5 bg-gray-100 rounded w-24 animate-pulse" />
                    <div className="h-3 bg-gray-50 rounded w-16 animate-pulse" />
                  </div>
                </div>
              ) : searchedUsers.length > 0 ? (
                searchedUsers.map(u => (
                  <button
                    key={u.id}
                    onClick={() => handleUserSelect(u)}
                    disabled={creatingRoom === u.id}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-primary/5 transition-all text-left group disabled:opacity-60"
                  >
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 ring-1 ring-gray-100 flex items-center justify-center shrink-0">
                      {u.photoURL ? (
                        <img src={u.photoURL} alt={u.nickname} className="w-full h-full object-cover" />
                      ) : (
                        <span className="material-symbols-outlined text-gray-400 text-[20px]">person</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-1.5">
                        <h4 className="text-[14px] font-bold text-gray-800 truncate">{u.nickname}</h4>
                        {u.nativeNickname && (
                          <span className="text-[11px] text-gray-400 font-normal">{u.nativeNickname}</span>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-400 font-medium">{t('chat.tapToStartChatting')}</p>
                    </div>
                    <div className="shrink-0">
                      {creatingRoom === u.id ? (
                        <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                      ) : (
                        <span className="material-symbols-outlined text-gray-300 group-hover:text-primary text-[20px] transition-colors">arrow_forward_ios</span>
                      )}
                    </div>
                  </button>
                ))
              ) : searchQuery.trim().length >= 2 ? (
                <div className="px-4 py-6 text-center">
                  <span className="material-symbols-outlined text-gray-200 text-[32px] mb-2 block">person_off</span>
                  <p className="text-[12px] text-gray-400 font-medium">{t('chat.noUsersFound', { query: searchQuery })}</p>
                </div>
              ) : (
                <div className="px-4 py-4 text-center">
                  <p className="text-[12px] text-gray-300 font-medium">{t('chat.typeToSearch')}</p>
                </div>
              )}
            </div>

            {/* Bottom safe area */}
            <div className="h-2" />
          </div>
        )}
      </div>

      {/* Room List */}
      {searchFilteredRooms.length === 0 && !showSearchOverlay ? (
        <div className="flex flex-col items-center justify-center h-[60vh] text-center px-10">
          <div className="w-20 h-20 rounded-full bg-gray-50 flex items-center justify-center mb-6">
            <span className="material-symbols-outlined text-gray-200 text-4xl">chat_bubble</span>
          </div>
          <h3 className="text-lg font-black text-gray-900 mb-2 uppercase tracking-tighter">{t('chat.noConversations')}</h3>
          <p className="text-xs text-gray-400 font-medium leading-relaxed">
            {category === 'Personal' 
              ? t('chat.searchToStart')
              : t('chat.noConversationsCategory')}
          </p>
        </div>
      ) : category === 'Group' ? (
        /* === Group Tab: Sectioned Layout === */
        <div className="flex flex-col">
          {/* Public Section */}
          {publicRooms.length > 0 && (
            <div>
              <div className="px-6 pt-4 pb-2">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[14px]">campaign</span>
                  Public
                </span>
              </div>
              <div className="divide-y divide-gray-50">
                {publicRooms.map((room) => <RoomItem key={room.id} room={room} userId={user?.uid} selectedRoomId={selectedRoomId} onSelectRoom={onSelectRoom} onLongPress={handleLongPress} />)}
              </div>
            </div>
          )}

          {/* My Groups Section */}
          {myGroupRooms.length > 0 && (
            <div>
              <div className="px-6 pt-5 pb-2">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[14px]">group</span>
                  My Groups
                  <span className="ml-1 bg-gray-100 text-gray-500 text-[9px] font-black px-1.5 py-0.5 rounded-full">{myGroupRooms.length}</span>
                </span>
              </div>
              <div className="divide-y divide-gray-50">
                {myGroupRooms.map((room) => <RoomItem key={room.id} room={room} userId={user?.uid} selectedRoomId={selectedRoomId} onSelectRoom={onSelectRoom} onLongPress={handleLongPress} />)}
              </div>
            </div>
          )}

          {/* Discover Section */}
          {discoverGroupRooms.length > 0 && (
            <div>
              <div className="px-6 pt-5 pb-2">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[14px]">explore</span>
                  Discover
                  <span className="ml-1 bg-gray-100 text-gray-500 text-[9px] font-black px-1.5 py-0.5 rounded-full">{discoverGroupRooms.length}</span>
                </span>
              </div>
              <div className="divide-y divide-gray-50">
                {discoverGroupRooms.map((room) => <RoomItem key={room.id} room={room} userId={user?.uid} selectedRoomId={selectedRoomId} onSelectRoom={onSelectRoom} onLongPress={handleLongPress} />)}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="divide-y divide-gray-50">
          {searchFilteredRooms.map((room) => <RoomItem key={room.id} room={room} userId={user?.uid} selectedRoomId={selectedRoomId} onSelectRoom={onSelectRoom} onLongPress={handleLongPress} />)}
        </div>
      )}

      {/* Leave Room Confirmation Modal */}
      {isLeaveModalOpen && longPressActiveRoom && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 flex flex-col items-center text-center animate-in zoom-in duration-300">
            <div className="w-16 h-16 rounded-full bg-red-50 text-red-500 flex items-center justify-center mb-4 animate-pulse">
              <span className="material-symbols-outlined text-[32px]">logout</span>
            </div>
            <h3 className="text-[18px] font-black text-gray-900 mb-2 uppercase tracking-tight">
              {t('chat.leave_room_title')}
            </h3>
            <p className="text-[13px] text-gray-400 font-medium leading-relaxed mb-6 max-w-xs">
              {t('chat.leave_room_desc')}
            </p>
            <div className="w-full flex gap-3">
              <button
                disabled={isLeaving}
                onClick={() => { setIsLeaveModalOpen(false); setLongPressActiveRoom(null); }}
                className="flex-1 py-3.5 bg-gray-50 border border-slate-100 text-slate-500 font-bold rounded-2xl text-[13px] hover:bg-gray-100 transition-colors"
              >
                {t('chat.cancel', '취소')}
              </button>
              <button
                disabled={isLeaving}
                onClick={handleLeaveRoom}
                className="flex-1 py-3.5 bg-red-500 text-white font-bold rounded-2xl text-[13px] hover:bg-red-600 active:scale-95 transition-all shadow-lg shadow-red-500/20 disabled:opacity-60 flex items-center justify-center"
              >
                {isLeaving ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  t('chat.leave', '나가기')
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Premium Glassmorphism Bottom Sheet / Modal for Group Chat Creation */}
      {isGroupCreationModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="absolute inset-0" onClick={() => setIsGroupCreationModalOpen(false)} />
          
          <div className="relative w-full max-w-md bg-white/95 backdrop-blur-xl rounded-t-[32px] sm:rounded-[32px] p-6 shadow-2xl border border-white/20 z-10 flex flex-col gap-4 text-gray-800 animate-in slide-in-from-bottom sm:zoom-in duration-300 max-h-[85vh] sm:max-h-[80vh]">
            <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto sm:hidden" />
            
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-black uppercase tracking-tighter text-gray-900">{t('chatroom.create_group_button', 'New Group')}</h3>
              <button 
                onClick={() => setIsGroupCreationModalOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-100 hover:bg-gray-200 transition-all text-gray-500"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>

            {/* Group Name input */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('chatroom.group_name_label', 'Group Name')}</label>
              <input 
                type="text"
                value={groupChatName}
                onChange={(e) => setGroupChatName(e.target.value)}
                placeholder={t('chatroom.group_name_label', 'Group Chat Name (Optional)')}
                className="w-full px-4 py-3 bg-gray-50/50 border border-slate-100 rounded-2xl text-sm font-medium placeholder:text-gray-300 focus:ring-1 focus:ring-primary/10 focus:border-primary/20 transition-all"
              />
            </div>

            {/* User Search inside Modal */}
            <div className="flex flex-col gap-1.5 flex-1 min-h-0">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('chatroom.invite_title', 'Invite Users')}</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-300 text-[18px]">search</span>
                <input 
                  type="text"
                  value={groupSearchQuery}
                  onChange={(e) => setGroupSearchQuery(e.target.value)}
                  placeholder={t('chatroom.search_placeholder', 'Search by name...')}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50/50 border border-slate-100 rounded-2xl text-xs font-medium placeholder:text-gray-300 focus:ring-1 focus:ring-primary/10 focus:border-primary/20 transition-all"
                />
              </div>

              {/* Users Multi-select List */}
              <div className="flex-1 overflow-y-auto no-scrollbar border border-slate-50 rounded-2xl p-2 bg-gray-50/30 space-y-1 mt-2">
                {allPlatformUsers
                  .filter(u => {
                    const q = groupSearchQuery.trim().toLowerCase();
                    if (!q) return true;
                    return (u.nickname || '').toLowerCase().includes(q) || 
                           (u.nativeNickname || '').toLowerCase().includes(q) || 
                           (u.email || '').toLowerCase().includes(q);
                  })
                  .map(u => {
                    const isChecked = selectedUserIds.has(u.id);
                    return (
                      <button
                        key={u.id}
                        onClick={() => {
                          const next = new Set(selectedUserIds);
                          if (next.has(u.id)) next.delete(u.id);
                          else next.add(u.id);
                          setSelectedUserIds(next);
                        }}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left ${isChecked ? 'bg-primary/5 ring-1 ring-primary/10' : 'hover:bg-gray-50/50'}`}
                      >
                        <div className="shrink-0 relative">
                          <div className="w-9 h-9 rounded-full overflow-hidden bg-gray-100 ring-1 ring-gray-100 flex items-center justify-center">
                            {u.photoURL ? (
                              <img src={u.photoURL} alt={u.nickname} className="w-full h-full object-cover" />
                            ) : (
                              <span className="material-symbols-outlined text-gray-400 text-[18px]">person</span>
                            )}
                          </div>
                          {isChecked && (
                            <div className="absolute -top-1 -right-1 bg-primary text-white w-4.5 h-4.5 rounded-full flex items-center justify-center border border-white text-[10px]">
                              <span className="material-symbols-outlined text-[10px] font-black">check</span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-1.5">
                            <h4 className="text-[13px] font-bold text-gray-800 truncate">{u.nickname}</h4>
                            {u.nativeNickname && (
                              <span className="text-[10px] text-gray-400 font-normal">{u.nativeNickname}</span>
                            )}
                          </div>
                          <p className="text-[9px] text-gray-400 font-medium truncate">{u.email || 'No email'}</p>
                        </div>
                        <div className="shrink-0">
                          <input 
                            type="checkbox"
                            checked={isChecked}
                            readOnly
                            className="w-4 h-4 rounded text-primary focus:ring-primary/20 accent-primary"
                          />
                        </div>
                      </button>
                    );
                  })}
              </div>
            </div>

            {/* Create Button */}
            <button
              disabled={selectedUserIds.size === 0 || isCreatingGroup}
              onClick={handleCreateGroupChat}
              className="w-full py-4 bg-primary text-white font-black text-sm uppercase tracking-wider rounded-2xl shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isCreatingGroup ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span className="material-symbols-outlined text-lg">forum</span>
                  <span>{t('chatroom.invite_button', 'Invite')} ({selectedUserIds.size})</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

