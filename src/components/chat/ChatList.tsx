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

function RoomAvatar({ room, currentUserId }: { room: ChatRoom; currentUserId?: string }) {
  const [otherUser, setOtherUser] = useState<PlatformUser | null>(null);

  useEffect(() => {
    if (room.imageUrl || (room.type !== 'personal' && room.type !== 'private' && room.type !== 'business')) return;
    
    const fetchOtherUser = async () => {
      const otherId = room.participants.find(id => id !== currentUserId);
      if (otherId) {
        const user = await userService.getUserById(otherId);
        setOtherUser(user);
      }
    };
    fetchOtherUser();
  }, [room, currentUserId]);

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
  const [otherUser, setOtherUser] = useState<PlatformUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
  }, [room, currentUserId]);

  if (room.name) {
    return <>{room.name}</>;
  }

  if (loading && (room.type === 'personal' || room.type === 'private' || room.type === 'business')) {
    return <span className="h-4 w-24 bg-gray-100 rounded animate-pulse inline-block" />;
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

function RoomItem({ room, userId, selectedRoomId, onSelectRoom }: { room: ChatRoom; userId?: string; selectedRoomId?: string | null; onSelectRoom: (id: string) => void }) {
  const { formatRelativeTime } = useLanguage();
  const isSelected = selectedRoomId === room.id;
  const unreadCount = room.unreadCounts?.[userId || ''] || 0;
  const lastTime = (() => {
    const d = safeDate(room.lastMessageTime);
    return d ? formatRelativeTime(d) : '';
  })();

  return (
    <button
      key={room.id}
      onClick={() => onSelectRoom(room.id)}
      className={`w-full flex items-center gap-4 p-5 transition-all text-left ${isSelected ? 'bg-primary/5' : 'hover:bg-gray-50'}`}
    >
      <div className="relative shrink-0">
        <RoomAvatar room={room} currentUserId={userId} />
        {room.type === 'notice' && (
          <div className="absolute -top-1 -right-1 bg-primary text-white w-6 h-6 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
            <span className="material-symbols-outlined text-[12px] font-black">campaign</span>
          </div>
        )}
        {(room.type === 'groups' || room.type === 'group') && (
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
            {room.lastMessage}
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
  const { user } = useAuth();
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [searchedUsers, setSearchedUsers] = useState<PlatformUser[]>([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [creatingRoom, setCreatingRoom] = useState<string | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

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
          // Exclude self
          setSearchedUsers(results.filter(u => u.id !== user?.uid));
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
  }, [category, user?.uid]);

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

  // Filter rooms by search query (name match)
  const searchFilteredRooms = searchQuery.trim()
    ? filteredRooms.filter(room => {
        const name = (room.name || '').toLowerCase();
        return name.includes(searchQuery.toLowerCase());
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
            className="w-full pl-12 pr-10 py-3 bg-white border border-slate-100 rounded-2xl text-sm font-medium placeholder:text-gray-300 focus:ring-1 focus:ring-primary/10 focus:border-primary/20 transition-all"
          />
          {searchQuery && (
            <button 
              onClick={() => { setSearchQuery(''); setSearchedUsers([]); setIsSearchFocused(false); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
            >
              <span className="material-symbols-outlined text-gray-400 text-[14px]">close</span>
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
                      <p className="text-[12px] text-gray-400 truncate">{room.lastMessage}</p>
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
                {publicRooms.map((room) => <RoomItem key={room.id} room={room} userId={user?.uid} selectedRoomId={selectedRoomId} onSelectRoom={onSelectRoom} />)}
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
                {myGroupRooms.map((room) => <RoomItem key={room.id} room={room} userId={user?.uid} selectedRoomId={selectedRoomId} onSelectRoom={onSelectRoom} />)}
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
                {discoverGroupRooms.map((room) => <RoomItem key={room.id} room={room} userId={user?.uid} selectedRoomId={selectedRoomId} onSelectRoom={onSelectRoom} />)}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="divide-y divide-gray-50">
          {searchFilteredRooms.map((room) => <RoomItem key={room.id} room={room} userId={user?.uid} selectedRoomId={selectedRoomId} onSelectRoom={onSelectRoom} />)}
        </div>
      )}
    </div>
  );
}
