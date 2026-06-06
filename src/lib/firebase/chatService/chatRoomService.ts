import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  doc, 
  getDoc,
  updateDoc,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import { db } from '../clientApp';
import { ChatRoom } from '@/types/chat';
import { safeDate } from '@/lib/utils/safeDate';

export const ROOMS_COLLECTION = 'chat_rooms';
export const MESSAGES_COLLECTION = 'chat_messages';
export const USERS_COLLECTION = 'users';

export const GLOBAL_LOUNGE_ID = 'woc_global_lounge';
export const SYSTEM_NOTICE_ID = 'woc_notice';

export const chatRoomService = {
  // Get single chat room
  getChatRoom: async (roomId: string): Promise<ChatRoom | null> => {
    try {
      const docRef = doc(db, ROOMS_COLLECTION, roomId);
      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        return { id: snapshot.id, ...snapshot.data() } as ChatRoom;
      }
      return null;
    } catch (error) {
      console.error("Error getting chat room:", error);
      return null;
    }
  },

  // Subscribe to Chat Rooms List
  subscribeRooms: (userId: string, callback: (rooms: ChatRoom[]) => void) => {
    const roomsRef = collection(db, ROOMS_COLLECTION);
    let publicRooms: ChatRoom[] = [];
    let privateRooms: ChatRoom[] = [];
    let groupRooms: ChatRoom[] = [];

    const handleSnapshot = () => {
      const allRooms = [...publicRooms, ...privateRooms, ...groupRooms];
      const sorted = allRooms.sort((a, b) => {
        if (a.id === SYSTEM_NOTICE_ID) return -1;
        if (b.id === SYSTEM_NOTICE_ID) return 1;
        if (a.id === GLOBAL_LOUNGE_ID) return -1;
        if (b.id === GLOBAL_LOUNGE_ID) return 1;
        
        const timeA = safeDate(a.lastMessageTime)?.getTime() ?? 0;
        const timeB = safeDate(b.lastMessageTime)?.getTime() ?? 0;
        return timeB - timeA;
      });

      const unique = sorted.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);
      callback(unique);
    };

    const publicQ = query(roomsRef, where('type', 'in', ['public', 'notice']));
    const privateQ = query(roomsRef, where('participants', 'array-contains', userId));
    const groupsQ = query(roomsRef, where('type', '==', 'groups'));

    const unsubPublic = onSnapshot(publicQ, (snap) => {
      publicRooms = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChatRoom));
      handleSnapshot(); 
    }, (err) => console.error("Public rooms error:", err));

    const unsubPrivate = onSnapshot(privateQ, (snap) => {
      privateRooms = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChatRoom));
      handleSnapshot();
    }, (err) => console.error("Private rooms error:", err));

    const unsubGroups = onSnapshot(groupsQ, (snap) => {
      groupRooms = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChatRoom));
      handleSnapshot();
    }, (err) => console.error("Groups rooms error:", err));

    return () => {
      unsubPublic();
      unsubPrivate();
      unsubGroups();
    };
  },

  // Reset Unread Count
  resetUnreadCount: async (roomId: string, userId: string) => {
    try {
      const roomRef = doc(db, ROOMS_COLLECTION, roomId);
      await updateDoc(roomRef, {
        [`unreadCounts.${userId}`]: 0
      });
    } catch (err) {
      console.error("Error resetting unread count:", err);
    }
  },

  // Subscribe to Total Unread Count
  subscribeTotalUnreadCount: (userId: string, callback: (count: number) => void) => {
    let chatUnread = 0;
    let todoUnread = 0;
    let businessTodoUnread = 0;

    const fireCallback = () => {
      callback(chatUnread + todoUnread + businessTodoUnread);
    };

    // 1. 대화방 안 읽은 수 및 비즈니스 챗 pending 메시지(투두) 실시간 리스너
    const roomsRef = collection(db, ROOMS_COLLECTION);
    const qRooms = query(roomsRef, where('participants', 'array-contains', userId));
    
    const businessUnsubs: Record<string, () => void> = {};
    const businessCounts: Record<string, number> = {};

    const unsubRooms = onSnapshot(qRooms, (snap) => {
      let total = 0;
      const activeBusinessRoomIds = new Set<string>();

      snap.docs.forEach(doc => {
        const data = doc.data();
        const roomId = doc.id;
        
        const unread = data.unreadCounts?.[userId] || 0;
        total += unread;

        if (data.type === 'business') {
          activeBusinessRoomIds.add(roomId);
          if (!businessUnsubs[roomId]) {
            const msgsRef = collection(db, MESSAGES_COLLECTION);
            const qPendingMsgs = query(
              msgsRef,
              where('roomId', '==', roomId)
            );
            
            businessUnsubs[roomId] = onSnapshot(qPendingMsgs, (mSnap) => {
              const incomingPendingCount = mSnap.docs.filter(mDoc => {
                const mData = mDoc.data();
                if (mData.senderId === userId) return false;
                
                const meta = mData.metadata;
                if (!meta) return false;
                
                return meta.actionType === 'booking_approval' && 
                       meta.sellerId === userId && 
                       meta.status === 'BANK_TRANSFERRED';
              }).length;
              
              businessCounts[roomId] = incomingPendingCount;
              
              let sumBusiness = 0;
              Object.values(businessCounts).forEach(c => sumBusiness += c);
              businessTodoUnread = sumBusiness;
              fireCallback();
            });
          }
        }
      });

      Object.keys(businessUnsubs).forEach(rId => {
        if (!activeBusinessRoomIds.has(rId)) {
          businessUnsubs[rId]();
          delete businessUnsubs[rId];
          delete businessCounts[rId];
        }
      });

      chatUnread = total;
      fireCallback();
    });

    // 2. 가입 대기(Todo) 수 실시간 리스너 (오너 소유 모든 그룹의 pending 멤버 총합)
    const groupsRef = collection(db, 'groups');
    const qGroups = query(groupsRef, where('ownerId', '==', userId));
    
    const groupUnsubs: Record<string, () => void> = {};
    const groupCounts: Record<string, number> = {};

    const unsubGroups = onSnapshot(qGroups, (groupSnap) => {
      const currentGroupIds = new Set(groupSnap.docs.map(d => d.id));
      Object.keys(groupUnsubs).forEach(gId => {
        if (!currentGroupIds.has(gId)) {
          groupUnsubs[gId]();
          delete groupUnsubs[gId];
          delete groupCounts[gId];
        }
      });

      if (groupSnap.docs.length === 0) {
        todoUnread = 0;
        fireCallback();
        return;
      }

      groupSnap.docs.forEach(gDoc => {
        const gId = gDoc.id;
        if (!groupUnsubs[gId]) {
          const membersRef = collection(db, 'groups', gId, 'members');
          const qPending = query(membersRef, where('status', '==', 'pending'));
          groupUnsubs[gId] = onSnapshot(qPending, (mSnap) => {
            groupCounts[gId] = mSnap.docs.length;
            
            let sum = 0;
            Object.values(groupCounts).forEach(c => sum += c);
            todoUnread = sum;
            fireCallback();
          });
        }
      });
    });

    return () => {
      unsubRooms();
      unsubGroups();
      Object.values(groupUnsubs).forEach(unsub => unsub());
      Object.values(businessUnsubs).forEach(unsub => unsub());
    };
  },

  // Pin Room
  pinRoom: async (roomId: string, userId: string, isPinned: boolean) => {
    try {
      const roomRef = doc(db, ROOMS_COLLECTION, roomId);
      await updateDoc(roomRef, {
        pinnedBy: isPinned ? arrayUnion(userId) : arrayRemove(userId)
      });
    } catch (error) {
      console.error("Error pinning room:", error);
      throw error;
    }
  },

  // Leave Room
  leaveRoom: async (roomId: string, userId: string) => {
    try {
      const roomRef = doc(db, ROOMS_COLLECTION, roomId);
      await updateDoc(roomRef, {
        participants: arrayRemove(userId)
      });
    } catch (error) {
      console.error("Error leaving room:", error);
      throw error;
    }
  },

  // Typing Indicator
  setTypingStatus: async (roomId: string, userId: string, isTyping: boolean) => {
    try {
      const roomRef = doc(db, ROOMS_COLLECTION, roomId);
      if (isTyping) {
        await updateDoc(roomRef, { typing: arrayUnion(userId) });
      } else {
        await updateDoc(roomRef, { typing: arrayRemove(userId) });
      }
    } catch (err) {
      console.error("Error setting typing status:", err);
    }
  },

  // Invite User
  inviteUser: async (roomId: string, userIds: string[]) => {
    try {
      const roomRef = doc(db, ROOMS_COLLECTION, roomId);
      await updateDoc(roomRef, {
        participants: arrayUnion(...userIds)
      });
    } catch (err) {
      console.error("Error inviting users:", err);
    }
  }
};
