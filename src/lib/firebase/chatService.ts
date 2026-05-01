import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  doc, 
  Timestamp, 
  serverTimestamp,
  getDocs,
  getDoc,
  limit,
  limitToLast,
  arrayUnion,
  arrayRemove,
  setDoc,
  increment,
  writeBatch
} from 'firebase/firestore';
import { db } from './clientApp';
import { ChatRoom, ChatMessage } from '@/types/chat';

const ROOMS_COLLECTION = 'chat_rooms';
const MESSAGES_COLLECTION = 'chat_messages';
const USERS_COLLECTION = 'users';

// Heritage System IDs
export const GLOBAL_LOUNGE_ID = 'woc_global_lounge';
export const SYSTEM_NOTICE_ID = 'woc_notice';

export const chatService = {
  // 1. Subscribe to Chat Rooms List
  subscribeRooms: (userId: string, callback: (rooms: ChatRoom[]) => void) => {
    const roomsRef = collection(db, ROOMS_COLLECTION);
    let publicRooms: ChatRoom[] = [];
    let privateRooms: ChatRoom[] = [];

    const handleSnapshot = () => {
      const allRooms = [...publicRooms, ...privateRooms];
      const sorted = allRooms.sort((a, b) => {
        if (a.id === SYSTEM_NOTICE_ID) return -1;
        if (b.id === SYSTEM_NOTICE_ID) return 1;
        if (a.id === GLOBAL_LOUNGE_ID) return -1;
        if (b.id === GLOBAL_LOUNGE_ID) return 1;
        
        const timeA = a.lastMessageTime?.toMillis?.() || a.lastMessageTime?.seconds * 1000 || 0;
        const timeB = b.lastMessageTime?.toMillis?.() || b.lastMessageTime?.seconds * 1000 || 0;
        return timeB - timeA;
      });

      const unique = sorted.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);
      callback(unique);
    };

    const publicQ = query(roomsRef, where('type', 'in', ['public', 'notice']));
    const privateQ = query(roomsRef, where('participants', 'array-contains', userId));

    const unsubPublic = onSnapshot(publicQ, (snap) => {
      publicRooms = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChatRoom));
      handleSnapshot(); 
    }, (err) => console.error("Public rooms error:", err));

    const unsubPrivate = onSnapshot(privateQ, (snap) => {
      privateRooms = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChatRoom));
      handleSnapshot();
    }, (err) => console.error("Private rooms error:", err));

    return () => {
      unsubPublic();
      unsubPrivate();
    };
  },

  // 2. Subscribe to Messages
  subscribeMessages: (roomId: string, messageLimit: number, callback: (messages: ChatMessage[]) => void) => {
    const q = query(
      collection(db, MESSAGES_COLLECTION),
      where('roomId', '==', roomId),
      orderBy('timestamp', 'desc'),
      limit(messageLimit)
    );
    
    return onSnapshot(q, (snapshot) => {
      const messages = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data({ serverTimestamps: 'estimate' }) 
      } as ChatMessage));
      // Reverse because we queried DESC to get the latest messages correctly
      callback(messages.reverse());
    }, (error) => {
      console.error("Error subscribing to messages: ", error);
    });
  },

  // 3. Send Message
  sendMessage: async (message: Omit<ChatMessage, 'id' | 'timestamp' | 'readBy'>) => {
    try {
      const messageData: any = {
        ...message,
        readBy: [message.senderId],
        timestamp: serverTimestamp()
      };

      // Firestore 거부 방지: undefined 값 삭제
      Object.keys(messageData).forEach(key => {
        if (messageData[key] === undefined) {
          delete messageData[key];
        }
      });

      const docRef = await addDoc(collection(db, MESSAGES_COLLECTION), messageData);
      
      const roomRef = doc(db, ROOMS_COLLECTION, message.roomId);
      const roomSnap = await getDoc(roomRef);
      const roomData = roomSnap.exists() ? roomSnap.data() : {};
      
      const participants = roomData.participants || [];
      const unreadCounts = roomData.unreadCounts || {};
      
      const otherParticipants = participants.filter((p: string) => p !== message.senderId);
      
      otherParticipants.forEach((p: string) => {
        unreadCounts[p] = (unreadCounts[p] || 0) + 1;
      });

      await updateDoc(roomRef, {
        lastMessage: message.type === 'text' ? message.text : `[${message.type}]`,
        lastMessageTime: serverTimestamp(),
        lastMessageSenderId: message.senderId,
        unreadCounts: unreadCounts
      });

      // ---- 푸시 알림 전송 로직 시작 ----
      try {
        if (otherParticipants.length > 0) {
          // sender 정보 가져오기
          const senderDoc = await getDoc(doc(db, USERS_COLLECTION, message.senderId));
          const senderData = senderDoc.exists() ? senderDoc.data() : {};
          const senderName = senderData.nickname || senderData.displayName || 'User';

          // 상대방들의 FCM 토큰 수집
          const tokens: string[] = [];
          for (const pId of otherParticipants) {
            const pDoc = await getDoc(doc(db, USERS_COLLECTION, pId));
            if (pDoc.exists()) {
              const pData = pDoc.data();
              if (pData.fcmTokens && Array.isArray(pData.fcmTokens)) {
                tokens.push(...pData.fcmTokens);
              }
            }
          }

          // 토큰이 있으면 API 호출
          if (tokens.length > 0) {
            await fetch('/api/notifications', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                tokens,
                title: roomData.type === 'private' ? senderName : (roomData.name || senderName),
                message: message.type === 'text' ? message.text : '📷 Photo',
                data: {
                  url: `/chat?roomId=${message.roomId}`,
                  type: 'chat',
                  roomId: message.roomId
                }
              })
            });
          }
        }
      } catch (pushErr) {
        console.error("Failed to send push notification:", pushErr);
      }
      // ---- 푸시 알림 전송 로직 끝 ----

      return docRef.id;
    } catch (error) {
      console.error("Error in sendMessage:", error);
      throw error;
    }
  },

  // 4. Reset Unread Count
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

  // 5. System Initialization (Suda + Notice)
  initializeSystemRooms: async () => {
    try {
      const noticeRef = doc(db, ROOMS_COLLECTION, SYSTEM_NOTICE_ID);
      const noticeSnap = await getDoc(noticeRef);
      if (!noticeSnap.exists()) {
        await setDoc(noticeRef, {
          name: 'WoC System Notice',
          type: 'notice',
          createdBy: 'system',
          createdAt: serverTimestamp(),
          lastMessageTime: serverTimestamp(),
          lastMessage: 'Welcome to World of Group!',
          participants: []
        });
      }

      const loungeRef = doc(db, ROOMS_COLLECTION, GLOBAL_LOUNGE_ID);
      const loungeSnap = await getDoc(loungeRef);
      if (!loungeSnap.exists()) {
        await setDoc(loungeRef, {
          name: 'Global Lounge',
          type: 'public',
          createdBy: 'system',
          createdAt: serverTimestamp(),
          lastMessageTime: serverTimestamp(),
          lastMessage: 'Welcome to the Global Lounge. Start chatting!',
          participants: []
        });
      }
    } catch (error) {
      console.error('System initialization failed:', error);
    }
  },

  // 6. Private/Business Chat Creation
  getOrCreatePrivateRoom: async (participantIds: string[], creatorId: string, type: 'personal' | 'business' = 'personal') => {
    const sortedIds = [...participantIds].sort();
    const roomsRef = collection(db, ROOMS_COLLECTION);
    
    // Check for existing room of specified type
    if (sortedIds.length === 2) {
      const q = query(
        roomsRef, 
        where('participants', 'array-contains', sortedIds[0]),
        where('type', '==', type)
      );
      const snap = await getDocs(q);
      const existing = snap.docs.find(doc => {
        const p = doc.data().participants as string[];
        return p.length === 2 && p.includes(sortedIds[1]);
      });
      if (existing) return existing.id;
    }

    // Create new
    const docRef = await addDoc(collection(db, ROOMS_COLLECTION), {
      type: type,
      participants: sortedIds,
      createdBy: creatorId,
      createdAt: serverTimestamp(),
      lastMessageTime: serverTimestamp(),
      lastMessage: type === 'business' ? '상품 문의가 시작되었습니다.' : '대화가 시작되었습니다.'
    });
    
    return docRef.id;
  },

  // 7. Subscribe to Total Unread Count
  subscribeTotalUnreadCount: (userId: string, callback: (count: number) => void) => {
    const roomsRef = collection(db, ROOMS_COLLECTION);
    
    // We listen to all rooms where the user is a participant
    const q = query(roomsRef, where('participants', 'array-contains', userId));
    
    return onSnapshot(q, (snap) => {
      let total = 0;
      snap.docs.forEach(doc => {
        const data = doc.data();
        const unread = data.unreadCounts?.[userId] || 0;
        total += unread;
      });
      callback(total);
    });
  },

  // 8. Toggle Reaction
  toggleReaction: async (messageId: string, userId: string, emoji: string | null) => {
    try {
      const msgRef = doc(db, MESSAGES_COLLECTION, messageId);
      const msgSnap = await getDoc(msgRef);
      if (!msgSnap.exists()) return;

      const currentReactions = msgSnap.data().reactions || {};
      
      if (!emoji || currentReactions[userId] === emoji) {
        delete currentReactions[userId];
      } else {
        currentReactions[userId] = emoji;
      }

      await updateDoc(msgRef, { reactions: currentReactions });
    } catch (err) {
      console.error("Error toggling reaction:", err);
    }
  },

  // 9. Update/Delete Message
  updateMessage: async (messageId: string, updates: Partial<ChatMessage>) => {
    try {
      const msgRef = doc(db, MESSAGES_COLLECTION, messageId);
      await updateDoc(msgRef, {
        ...updates,
        isEdited: true
      });
    } catch (err) {
      console.error("Error updating message:", err);
    }
  },

  // 10. Invite User
  inviteUser: async (roomId: string, userIds: string[]) => {
    try {
      const roomRef = doc(db, ROOMS_COLLECTION, roomId);
      await updateDoc(roomRef, {
        participants: arrayUnion(...userIds)
      });
    } catch (err) {
      console.error("Error inviting users:", err);
    }
  },

  // 11. Typing Indicator
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

  // 12. Mark single message as read
  markMessageAsRead: async (messageId: string, userId: string) => {
    try {
      const msgRef = doc(db, MESSAGES_COLLECTION, messageId);
      await updateDoc(msgRef, {
        readBy: arrayUnion(userId)
      });
    } catch (err) {
      console.error("Error marking message as read:", err);
    }
  },

  markMessagesAsReadBatch: async (messageIds: string[], userId: string) => {
    if (!messageIds.length) return;
    try {
      const batch = writeBatch(db);
      messageIds.forEach(id => {
        const msgRef = doc(db, MESSAGES_COLLECTION, id);
        batch.update(msgRef, {
          readBy: arrayUnion(userId)
        });
      });
      await batch.commit();
    } catch (err) {
      console.error("Error marking messages as read in batch:", err);
    }
  },



  // 11. Upload Media for Chat
  uploadChatMedia: async (file: File | Blob, path: string, onProgress?: (progress: number) => void): Promise<string> => {
    try {
      const { getStorage, ref, uploadBytesResumable, getDownloadURL } = await import('firebase/storage');
      const storage = getStorage();
      const storageRef = ref(storage, path);
      const uploadTask = uploadBytesResumable(storageRef, file);

      return new Promise((resolve, reject) => {
        uploadTask.on('state_changed', 
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            if (onProgress) onProgress(progress);
          }, 
          (error) => reject(error), 
          async () => {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(downloadURL);
          }
        );
      });
    } catch (error) {
      console.error("Error uploading chat media:", error);
      throw error;
    }
  },

  // 12. Pin Room
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

  // 13. Leave Room
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

  // 14. Nudge Room
  nudgeRoom: async (roomId: string, senderId: string, senderName: string) => {
    try {
      const messageData = {
        roomId,
        senderId,
        text: `🔔 ${senderName} nudged the chat.`,
        type: 'system',
        readBy: [senderId],
        timestamp: serverTimestamp()
      };

      await addDoc(collection(db, MESSAGES_COLLECTION), messageData);

      const roomRef = doc(db, ROOMS_COLLECTION, roomId);
      await updateDoc(roomRef, {
        lastMessage: `🔔 ${senderName} nudged the chat.`,
        lastMessageTime: serverTimestamp(),
        lastMessageSenderId: senderId
      });
    } catch (error) {
      console.error("Error nudging room:", error);
      throw error;
    }
  }
};
