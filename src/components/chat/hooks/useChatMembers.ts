import { useState, useEffect, useMemo } from 'react';
import { doc, onSnapshot, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/clientApp';
import { chatService } from '@/lib/firebase/chatService';
import type { ChatRoom, ChatMessage } from '@/types/chat';

export interface UseChatMembersProps {
  roomId: string;
  user: any; // Auth user
  messages: ChatMessage[];
  t: (key: string, ...args: any[]) => string;
}

export function useChatMembers({ roomId, user, messages, t }: UseChatMembersProps) {
  const [room, setRoom] = useState<ChatRoom | null>(null);
  const [otherUser, setOtherUser] = useState<any>(null);
  const [otherUsers, setOtherUsers] = useState<any[]>([]);
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const [isAccessBlocked, setIsAccessBlocked] = useState(false);

  // 0. 대화방 식별키 전환 시 실시간 정보 즉각 소거
  useEffect(() => {
    setRoom(null);
    setOtherUser(null);
    setOtherUsers([]);
    setIsOtherTyping(false);
    setIsAccessBlocked(false);
  }, [roomId]);

  // Subscribe to Room Info & Typing Status
  useEffect(() => {
    if (!user || !roomId) return;

    const roomRef = doc(db, 'chat_rooms', roomId);
    const unsubRoom = onSnapshot(roomRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as any;
        setRoom({ id: docSnap.id, ...data } as ChatRoom);
        
        // Check typing status
        const typingArray = data.typing || [];
        const othersTyping = typingArray.filter((uid: string) => uid !== user.uid);
        setIsOtherTyping(othersTyping.length > 0);
      }
    });

    return () => {
      unsubRoom();
    };
  }, [roomId, user]);

  // Fetch Member Details & Access Control
  useEffect(() => {
    if (!room || !user) return;
    
    const isGroup = room.participants && room.participants.length > 2;

    if (isGroup) {
      const fetchGroupUsers = async () => {
        try {
          const otherIds = room.participants.filter(p => p !== user.uid);
          const promises = otherIds.map(id => getDoc(doc(db, 'users', id)));
          const snaps = await Promise.all(promises);
          const users = snaps.filter(s => s.exists()).map(s => s.data());
          setOtherUsers(users);
        } catch (err) {
          console.error("Failed to fetch group users", err);
        }
      };
      fetchGroupUsers();
    } else if (room.type === 'private' || room.type === 'personal' || room.type === 'business') {
      const otherUserId = room.participants.find(p => p !== user.uid);
      if (otherUserId) {
        const fetchUser = async () => {
          try {
            const userDoc = await getDoc(doc(db, 'users', otherUserId));
            if (userDoc.exists()) {
              setOtherUser(userDoc.data());
            }
          } catch (err) {
            console.error("Failed to fetch other user", err);
          }
        };
        fetchUser();
      }
    }

    // Group chat access control — 그룹 채팅방은 그룹 가입의 결과로만 진입 가능
    if (room.type === 'groups') {
      const isAlreadyMember = room.participants?.includes(user.uid);
      setIsAccessBlocked(!isAlreadyMember);
    }
  }, [room, user]);

  // 톡방 전체 멤버 목록 (나를 포함)
  const allMembers = useMemo(() => {
    const list: any[] = [];
    if (user) {
      list.push({
        id: user.uid,
        name: user.displayName || 'Me',
        photoURL: user.photoURL,
        role: room?.admins?.includes(user.uid) ? 'admin' : 'member',
        joinedAt: null
      });
    }
    otherUsers.forEach((u: any) => {
      list.push({
        id: u.id,
        name: u.nickname || u.displayName || 'User',
        photoURL: u.photoURL,
        role: room?.admins?.includes(u.id) ? 'admin' : 'member',
        joinedAt: u.joinedAt || null
      });
    });
    return list;
  }, [user, otherUsers, room]);

  // 4단계: 실시간 리액티브 기여 스탯 집계 엔진 (메모리상 연산 0% 렉 보증)
  const memberStats = useMemo(() => {
    const stats: Record<string, { textCount: number; stickerCount: number; meetupCount: number; paidCount: number }> = {};
    
    messages.forEach((msg) => {
      const sender = msg.senderId;
      if (!sender) return;
      if (!stats[sender]) {
        stats[sender] = { textCount: 0, stickerCount: 0, meetupCount: 0, paidCount: 0 };
      }
      
      if (msg.type === 'text' || !msg.type) {
        stats[sender].textCount += 1;
      } else if (msg.type === 'sticker') {
        stats[sender].stickerCount += 1;
      } else if (msg.type === 'meetup') {
        stats[sender].meetupCount += 1;
      } else if (msg.type === 'remittance') {
        const paidUsers = msg.metadata?.paidUsers || [];
        paidUsers.forEach((uid: string) => {
          if (!stats[uid]) {
            stats[uid] = { textCount: 0, stickerCount: 0, meetupCount: 0, paidCount: 0 };
          }
          stats[uid].paidCount += 1;
        });
      }
    });
    
    return stats;
  }, [messages]);

  // Merge current user (me) with other participants (online status sync included)
  const allParticipantsList = useMemo(() => {
    const list: any[] = [];
    if (user) {
      list.push({
        id: user.uid,
        nickname: user.displayName || '나',
        nativeNickname: (user as any).nativeNickname || '',
        photoURL: user.photoURL,
        isMe: true,
        isOnline: true
      });
    }
    const isGroup = room?.participants && room.participants.length > 2;
    if (isGroup) {
      otherUsers.forEach(u => {
        list.push({
          id: u.id || u.uid,
          nickname: u.nickname || u.displayName || 'User',
          nativeNickname: u.nativeNickname || '',
          photoURL: u.photoURL,
          isMe: false,
          isOnline: u.isOnline ?? false
        });
      });
    } else if (otherUser) {
      list.push({
        id: otherUser.id || otherUser.uid,
        nickname: otherUser.nickname || otherUser.displayName || 'User',
        nativeNickname: otherUser.nativeNickname || '',
        photoURL: otherUser.photoURL,
        isMe: false,
        isOnline: otherUser.isOnline ?? false
      });
    }
    return list;
  }, [user, room, otherUser, otherUsers]);

  return {
    room,
    otherUser,
    otherUsers,
    isOtherTyping,
    isAccessBlocked,
    allMembers,
    memberStats,
    allParticipantsList,
  };
}
