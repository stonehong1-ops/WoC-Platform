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
    let groupRooms: ChatRoom[] = [];

    const handleSnapshot = () => {
      const allRooms = [...publicRooms, ...privateRooms, ...groupRooms];
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
        // sender 정보 가져오기
        const senderDoc = await getDoc(doc(db, USERS_COLLECTION, message.senderId));
        const senderData = senderDoc.exists() ? senderDoc.data() : {};
        const senderName = senderData.nickname || senderData.displayName || 'User';

        let targetUserIds: string[] = [];

        // 그룹채팅방 등록 시, 연동된 그룹 모임의 모든 active 멤버들을 대상으로 전원 푸시 발송
        if (roomData.type === 'groups' || roomData.type === 'group' || roomData.type === 'notice' || roomData.type === 'public') {
          const groupId = roomData.linkedGroupId || message.roomId.replace('group_', '');
          if (groupId) {
            try {
              const membersRef = collection(db, 'groups', groupId, 'members');
              const membersSnap = await getDocs(query(membersRef, where('status', '==', 'active')));
              targetUserIds = membersSnap.docs
                .map(doc => doc.id)
                .filter(uid => uid !== message.senderId);
            } catch (err) {
              console.error("Failed to fetch active group members for push:", err);
            }
          }
        }

        // 만약 그룹이 아니거나 그룹 멤버 조회가 비어있다면, 기존 participants 폴백 사용
        if (targetUserIds.length === 0) {
          targetUserIds = otherParticipants;
        }

        // 대상자들의 FCM 토큰 수집 ( allowChatNotifications 설정이 명시적으로 false인 회원 제외 )
        const tokens: string[] = [];
        for (const pId of targetUserIds) {
          const pDoc = await getDoc(doc(db, USERS_COLLECTION, pId));
          if (pDoc.exists()) {
            const pData = pDoc.data();
            if (pData.allowChatNotifications === false) {
              continue;
            }
            if (pData.fcmTokens && Array.isArray(pData.fcmTokens)) {
              tokens.push(...pData.fcmTokens);
            }
          }
        }

        // 토큰 중복 수집 배제
        const uniqueTokens = Array.from(new Set(tokens));

        // 토큰이 존재할 때 최종 API 호출하여 멀티캐스트 전송
        if (uniqueTokens.length > 0) {
          await fetch('/api/notifications', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              tokens: uniqueTokens,
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
      lastMessage: type === 'business' ? 'chat.last_message_business' : 'chat.last_message_personal'
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
  },

  // 15. Create Group Chat Room (linked to Groups module 1:1)
  createGroupChatRoom: async (groupId: string, groupName: string, ownerId: string, options?: {
    coverImage?: string;
    description?: string;
    joinStrategy?: 'open' | 'approval' | 'invite';
  }) => {
    const chatRoomId = `group_${groupId}`;
    const roomRef = doc(db, ROOMS_COLLECTION, chatRoomId);

    // Check if already exists
    const existing = await getDoc(roomRef);
    if (existing.exists()) return chatRoomId;

    await setDoc(roomRef, {
      name: groupName,
      type: 'groups',
      participants: [],
      linkedGroupId: groupId,
      admins: [ownerId],
      joinPolicy: options?.joinStrategy || 'open',
      imageUrl: options?.coverImage || '',
      description: options?.description || '',
      createdBy: 'system',
      createdAt: serverTimestamp(),
      lastMessageTime: serverTimestamp(),
      lastMessage: `Welcome to ${groupName} group chat!`,
    });

    return chatRoomId;
  },

  // 16. Sync Group Chat Admin (when group owner changes)
  syncGroupChatAdmin: async (groupId: string, newOwnerId: string) => {
    try {
      const chatRoomId = `group_${groupId}`;
      const roomRef = doc(db, ROOMS_COLLECTION, chatRoomId);
      const roomSnap = await getDoc(roomRef);
      if (!roomSnap.exists()) return;

      await updateDoc(roomRef, {
        admins: [newOwnerId],
      });
    } catch (error) {
      console.error("Error syncing group chat admin:", error);
    }
  },

  // 17. Auto-join Group Chat (for open-type groups)
  autoJoinGroupChat: async (groupId: string, userId: string) => {
    try {
      const chatRoomId = `group_${groupId}`;
      const roomRef = doc(db, ROOMS_COLLECTION, chatRoomId);
      const roomSnap = await getDoc(roomRef);
      if (!roomSnap.exists()) return;

      const data = roomSnap.data();
      const participants = data.participants || [];
      if (participants.includes(userId)) return; // already a member

      await updateDoc(roomRef, {
        participants: arrayUnion(userId),
      });

      // Send join system message
      await chatService.sendGroupSystemMessage(chatRoomId, userId, 'join');
    } catch (error) {
      console.error("Error auto-joining group chat:", error);
    }
  },

  // 18. Add/Remove participant from group chat
  addGroupChatParticipant: async (groupId: string, userId: string) => {
    try {
      const chatRoomId = `group_${groupId}`;
      const roomRef = doc(db, ROOMS_COLLECTION, chatRoomId);
      await updateDoc(roomRef, {
        participants: arrayUnion(userId),
      });

      // Send join system message
      await chatService.sendGroupSystemMessage(chatRoomId, userId, 'join');
    } catch (error) {
      console.error("Error adding group chat participant:", error);
    }
  },

  removeGroupChatParticipant: async (groupId: string, userId: string) => {
    try {
      const chatRoomId = `group_${groupId}`;
      const roomRef = doc(db, ROOMS_COLLECTION, chatRoomId);
      await updateDoc(roomRef, {
        participants: arrayRemove(userId),
      });

      // Send leave system message
      await chatService.sendGroupSystemMessage(chatRoomId, userId, 'leave');
    } catch (error) {
      console.error("Error removing group chat participant:", error);
    }
  },

  // 18-b. Kick a participant from group chat (admin action)
  kickGroupChatParticipant: async (groupId: string, userId: string) => {
    try {
      const chatRoomId = `group_${groupId}`;
      const roomRef = doc(db, ROOMS_COLLECTION, chatRoomId);
      await updateDoc(roomRef, {
        participants: arrayRemove(userId),
      });

      // Send kick system message
      await chatService.sendGroupSystemMessage(chatRoomId, userId, 'kick');
    } catch (error) {
      console.error("Error kicking group chat participant:", error);
    }
  },

  // 19. Get Group Chat Room
  getGroupChatRoom: async (groupId: string): Promise<ChatRoom | null> => {
    try {
      const chatRoomId = `group_${groupId}`;
      const roomRef = doc(db, ROOMS_COLLECTION, chatRoomId);
      const roomSnap = await getDoc(roomRef);
      if (!roomSnap.exists()) return null;
      return { id: roomSnap.id, ...roomSnap.data() } as ChatRoom;
    } catch (error) {
      console.error("Error getting group chat room:", error);
      return null;
    }
  },

  // 20. Send join/leave/kick system message to group chat
  sendGroupSystemMessage: async (chatRoomId: string, userId: string, action: 'join' | 'leave' | 'kick') => {
    try {
      // Fetch user nickname
      const userDoc = await getDoc(doc(db, USERS_COLLECTION, userId));
      const userData = userDoc.exists() ? userDoc.data() : {};
      const name = userData.nickname || userData.displayName || 'A member';

      let text = '';
      if (action === 'join') {
        text = `chat.system_join_params::${JSON.stringify({ name })}`;
      } else if (action === 'leave') {
        text = `chat.system_leave_params::${JSON.stringify({ name })}`;
      } else if (action === 'kick') {
        text = `chat.system_kick_params::${JSON.stringify({ name })}`;
      }

      const messageData = {
        roomId: chatRoomId,
        senderId: 'system',
        senderName: 'System',
        text,
        type: 'system',
        readBy: [],
        timestamp: serverTimestamp()
      };

      await addDoc(collection(db, MESSAGES_COLLECTION), messageData);

      const roomRef = doc(db, ROOMS_COLLECTION, chatRoomId);
      await updateDoc(roomRef, {
        lastMessage: text,
        lastMessageTime: serverTimestamp(),
        lastMessageSenderId: 'system'
      });
    } catch (error) {
      console.error("Error sending group system message:", error);
    }
  }
};
