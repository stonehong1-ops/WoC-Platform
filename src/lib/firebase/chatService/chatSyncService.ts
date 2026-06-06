import { 
  collection, 
  query, 
  where, 
  addDoc, 
  updateDoc, 
  doc, 
  serverTimestamp,
  getDocs,
  getDoc,
  arrayUnion,
  arrayRemove,
  setDoc
} from 'firebase/firestore';
import { db } from '../clientApp';
import { ChatRoom } from '@/types/chat';
import { ROOMS_COLLECTION, MESSAGES_COLLECTION, USERS_COLLECTION, GLOBAL_LOUNGE_ID, SYSTEM_NOTICE_ID } from './chatRoomService';

export const chatSyncService = {
  // System Initialization (Suda + Notice)
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

  // Private/Business Chat Creation
  getOrCreatePrivateRoom: async (participantIds: string[], creatorId: string, type: 'personal' | 'business' = 'personal') => {
    const sortedIds = [...participantIds].sort();
    const roomsRef = collection(db, ROOMS_COLLECTION);
    
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

  // Leave Room, Pinned, etc. is in chatRoomService, but Nudge belongs to Sync
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

  // Create Group Chat Room (linked to Groups module 1:1)
  createGroupChatRoom: async (groupId: string, groupName: string, ownerId: string, options?: {
    coverImage?: string;
    description?: string;
    joinStrategy?: 'open' | 'approval' | 'invite';
  }) => {
    const chatRoomId = `group_${groupId}`;
    const roomRef = doc(db, ROOMS_COLLECTION, chatRoomId);

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

  // Sync Group Chat Admin
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

  // Auto-join Group Chat
  autoJoinGroupChat: async (groupId: string, userId: string) => {
    try {
      const chatRoomId = `group_${groupId}`;
      const roomRef = doc(db, ROOMS_COLLECTION, chatRoomId);
      const roomSnap = await getDoc(roomRef);
      if (!roomSnap.exists()) return;

      const data = roomSnap.data();
      const participants = data.participants || [];
      if (participants.includes(userId)) return;

      await updateDoc(roomRef, {
        participants: arrayUnion(userId),
      });

      await chatSyncService.sendGroupSystemMessage(chatRoomId, userId, 'join');
    } catch (error) {
      console.error("Error auto-joining group chat:", error);
    }
  },

  // Add/Remove participant from group chat
  addGroupChatParticipant: async (groupId: string, userId: string) => {
    try {
      const chatRoomId = `group_${groupId}`;
      const roomRef = doc(db, ROOMS_COLLECTION, chatRoomId);
      await updateDoc(roomRef, {
        participants: arrayUnion(userId),
      });

      await chatSyncService.sendGroupSystemMessage(chatRoomId, userId, 'join');
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

      await chatSyncService.sendGroupSystemMessage(chatRoomId, userId, 'leave');
    } catch (error) {
      console.error("Error removing group chat participant:", error);
    }
  },

  kickGroupChatParticipant: async (groupId: string, userId: string) => {
    try {
      const chatRoomId = `group_${groupId}`;
      const roomRef = doc(db, ROOMS_COLLECTION, chatRoomId);
      await updateDoc(roomRef, {
        participants: arrayRemove(userId),
      });

      await chatSyncService.sendGroupSystemMessage(chatRoomId, userId, 'kick');
    } catch (error) {
      console.error("Error kicking group chat participant:", error);
    }
  },

  // Get Group Chat Room
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

  // Send join/leave/kick system message to group chat
  sendGroupSystemMessage: async (chatRoomId: string, userId: string, action: 'join' | 'leave' | 'kick') => {
    try {
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
  },

  // Snooze Notifications
  snoozeNotifications: async (userId: string, isSnoozed: boolean) => {
    const userRef = doc(db, USERS_COLLECTION, userId);
    try {
      if (isSnoozed) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(9, 0, 0, 0);
        
        await updateDoc(userRef, {
          notificationSnoozedUntil: tomorrow
        });
      } else {
        await updateDoc(userRef, {
          notificationSnoozedUntil: null
        });
      }
    } catch (err) {
      console.error("Error setting notification snooze:", err);
      throw err;
    }
  },

  // Create General Group Chat Room
  createGeneralGroupChatRoom: async (participantIds: string[], creatorId: string, roomName?: string) => {
    const sortedIds = Array.from(new Set([...participantIds, creatorId])).sort();
    const docRef = await addDoc(collection(db, ROOMS_COLLECTION), {
      type: 'private',
      participants: sortedIds,
      createdBy: creatorId,
      createdAt: serverTimestamp(),
      lastMessageTime: serverTimestamp(),
      lastMessage: 'chat.last_message_personal_group',
      name: roomName || ''
    });
    return docRef.id;
  },

  // Set Room Notice
  setRoomNotice: async (roomId: string, noticeText: string) => {
    try {
      const roomRef = doc(db, ROOMS_COLLECTION, roomId);
      await updateDoc(roomRef, {
        notice: noticeText
      });
    } catch (err) {
      console.error("Error setting room notice:", err);
      throw err;
    }
  },

  // Add Multi Room Notice
  addRoomNotice: async (roomId: string, noticeText: string, existingNotices: string[] = []) => {
    try {
      const roomRef = doc(db, ROOMS_COLLECTION, roomId);
      const updatedNotices = [noticeText, ...existingNotices].slice(0, 5);
      await updateDoc(roomRef, {
        notices: updatedNotices,
        notice: noticeText
      });
    } catch (err) {
      console.error("Error adding room notice:", err);
      throw err;
    }
  },

  // Remove Multi Room Notice
  removeRoomNotice: async (roomId: string, indexToRemove: number, existingNotices: string[] = []) => {
    try {
      const roomRef = doc(db, ROOMS_COLLECTION, roomId);
      const updatedNotices = existingNotices.filter((_, idx) => idx !== indexToRemove);
      await updateDoc(roomRef, {
        notices: updatedNotices,
        notice: updatedNotices.length > 0 ? updatedNotices[0] : ""
      });
    } catch (err) {
      console.error("Error removing room notice:", err);
      throw err;
    }
  },

  // Send Meetup Card
  sendMeetupMessage: async (roomId: string, senderId: string, senderName: string, meetupData: { title: string, date: string, time: string, location: string, maxCapacity: number, description?: string }) => {
    try {
      const messagesRef = collection(db, MESSAGES_COLLECTION);
      const docRef = await addDoc(messagesRef, {
        roomId,
        senderId,
        senderName,
        text: `[약속] ${meetupData.title}`,
        type: 'meetup',
        timestamp: serverTimestamp(),
        readBy: [senderId],
        metadata: {
          meetupId: `meetup_${Date.now()}`,
          title: meetupData.title,
          date: meetupData.date,
          time: meetupData.time,
          location: meetupData.location,
          maxCapacity: meetupData.maxCapacity,
          attendees: [senderId],
          isConfirmed: false,
          description: meetupData.description || ''
        }
      });
      
      const roomRef = doc(db, ROOMS_COLLECTION, roomId);
      await updateDoc(roomRef, {
        lastMessage: `chat.last_message_meetup`,
        lastMessageSenderId: senderId,
        lastMessageTime: serverTimestamp()
      });

      return docRef.id;
    } catch (err) {
      console.error("Error sending meetup message:", err);
      throw err;
    }
  },

  // Propose 1/N Settlement Card
  sendSettlementMessage: async (roomId: string, senderId: string, senderName: string, settlementData: { title: string, totalAmount: number, perPersonAmount: number, bankName: string, accountNumber: string, attendees: string[] }) => {
    try {
      const messagesRef = collection(db, MESSAGES_COLLECTION);
      const docRef = await addDoc(messagesRef, {
        roomId,
        senderId,
        senderName,
        text: `[정산] ${settlementData.title}`,
        type: 'remittance',
        timestamp: serverTimestamp(),
        readBy: [senderId],
        metadata: {
          settlementId: `settlement_${Date.now()}`,
          title: settlementData.title,
          totalAmount: settlementData.totalAmount,
          perPersonAmount: settlementData.perPersonAmount,
          bankName: settlementData.bankName,
          accountNumber: settlementData.accountNumber,
          attendees: settlementData.attendees,
          paidUsers: []
        }
      });
      
      const roomRef = doc(db, ROOMS_COLLECTION, roomId);
      await updateDoc(roomRef, {
        lastMessage: `chat.last_message_remittance`,
        lastMessageSenderId: senderId,
        lastMessageTime: serverTimestamp()
      });

      return docRef.id;
    } catch (err) {
      console.error("Error sending settlement message:", err);
      throw err;
    }
  }
};
