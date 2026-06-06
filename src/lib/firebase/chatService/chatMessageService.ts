import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  doc, 
  serverTimestamp,
  getDocs,
  getDoc,
  limit,
  arrayUnion,
  writeBatch,
  runTransaction
} from 'firebase/firestore';
import { db } from '../clientApp';
import { ChatMessage } from '@/types/chat';
import { ROOMS_COLLECTION, MESSAGES_COLLECTION, USERS_COLLECTION } from './chatRoomService';

export const chatMessageService = {
  // Subscribe to Messages
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
      callback(messages.reverse());
    }, (error) => {
      console.error("Error subscribing to messages: ", error);
    });
  },

  // Send Message with N+1 parallel query optimization
  sendMessage: async (message: Omit<ChatMessage, 'id' | 'timestamp' | 'readBy'> & { tempId?: string }) => {
    const tempId = message.tempId || `temp_${Date.now()}`;
    const cleanMessage = { ...message };
    delete (cleanMessage as any).tempId;

    try {
      if (typeof window !== 'undefined' && !navigator.onLine) {
        chatMessageService.savePendingMessage({ ...cleanMessage, tempId });
        throw new Error("Offline: Message queued locally");
      }

      const messageData: any = {
        ...cleanMessage,
        readBy: [message.senderId],
        timestamp: serverTimestamp()
      };

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
        lastMessage: message.type === 'text' ? message.text : (message.type === 'sticker' ? '이모티콘' : `[${message.type}]`),
        lastMessageTime: serverTimestamp(),
        lastMessageSenderId: message.senderId,
        unreadCounts: unreadCounts
      });

      // ---- 푸시 알림 전송 로직 시작 ----
      if (message.metadata?.isSilent) {
        return docRef.id;
      }
      try {
        const senderDoc = await getDoc(doc(db, USERS_COLLECTION, message.senderId));
        const senderData = senderDoc.exists() ? senderDoc.data() : {};
        const senderName = senderData.nickname || senderData.displayName || 'User';

        let targetUserIds: string[] = [];

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

        if (targetUserIds.length === 0) {
          targetUserIds = otherParticipants;
        }

        // 대상자들의 FCM 토큰 수집 (N+1 쿼리 루프 병렬 비동기 개선)
        const tokens: string[] = [];
        if (targetUserIds.length > 0) {
          const userDocs = await Promise.all(
            targetUserIds.map(pId => getDoc(doc(db, USERS_COLLECTION, pId)))
          );
          
          for (const pDoc of userDocs) {
            if (pDoc.exists()) {
              const pData = pDoc.data();

              if (pData.notificationSnoozedUntil) {
                const snoozedUntil = pData.notificationSnoozedUntil.toDate?.() || new Date(pData.notificationSnoozedUntil);
                if (snoozedUntil > new Date()) {
                  continue;
                }
              }
              if (pData.fcmTokens && Array.isArray(pData.fcmTokens)) {
                tokens.push(...pData.fcmTokens);
              }
            }
          }
        }

        const uniqueTokens = Array.from(new Set(tokens));

        if (uniqueTokens.length > 0) {
          await fetch('/api/notifications', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              tokens: uniqueTokens,
              title: roomData.type === 'private' ? senderName : (roomData.name || senderName),
              message: message.type === 'text' ? message.text : (message.type === 'sticker' ? '이모티콘' : '📷 Photo'),
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
      if (typeof window !== 'undefined') {
        const alreadyQueued = chatMessageService.getPendingMessages().some((m: any) => m.tempId === tempId);
        if (!alreadyQueued) {
          chatMessageService.savePendingMessage({ ...cleanMessage, tempId });
        }
      }
      throw error;
    }
  },

  // Toggle Reaction
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

  // Update/Delete Message
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

  deleteMessage: async (messageId: string) => {
    try {
      const { deleteDoc } = await import('firebase/firestore');
      const msgRef = doc(db, MESSAGES_COLLECTION, messageId);
      await deleteDoc(msgRef);
    } catch (err) {
      console.error("Error deleting message:", err);
      throw err;
    }
  },

  // Mark single message as read
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

  // Toggle Meetup Attendance
  toggleMeetupAttendance: async (messageId: string, userId: string) => {
    const messageRef = doc(db, MESSAGES_COLLECTION, messageId);
    try {
      await runTransaction(db, async (transaction) => {
        const msgDoc = await transaction.get(messageRef);
        if (!msgDoc.exists()) {
          throw new Error("Message does not exist");
        }

        const data = msgDoc.data() as ChatMessage;
        const metadata = data.metadata || {};
        const attendees = metadata.attendees || [];
        const maxCapacity = metadata.maxCapacity || 0;

        let newAttendees = [...attendees];
        if (newAttendees.includes(userId)) {
          newAttendees = newAttendees.filter(uid => uid !== userId);
        } else {
          if (maxCapacity > 0 && newAttendees.length >= maxCapacity) {
            throw new Error("Meetup is full");
          }
          newAttendees.push(userId);
        }

        transaction.update(messageRef, {
          'metadata.attendees': newAttendees
        });
      });
    } catch (err) {
      console.error("Error toggling meetup attendance:", err);
      throw err;
    }
  },

  // Confirm Meetup Schedule
  confirmMeetupSchedule: async (messageId: string) => {
    const messageRef = doc(db, MESSAGES_COLLECTION, messageId);
    try {
      await updateDoc(messageRef, {
        'metadata.isConfirmed': true
      });
    } catch (err) {
      console.error("Error confirming meetup schedule:", err);
      throw err;
    }
  },

  // Toggle Settlement Payment
  toggleSettlementPayment: async (messageId: string, userId: string) => {
    try {
      const msgRef = doc(db, MESSAGES_COLLECTION, messageId);
      await runTransaction(db, async (transaction) => {
        const msgDoc = await transaction.get(msgRef);
        if (!msgDoc.exists()) {
          throw new Error("Message does not exist");
        }
        const data = msgDoc.data();
        const metadata = data.metadata || {};
        const paidUsers: string[] = metadata.paidUsers || [];

        let updated: string[];
        if (paidUsers.includes(userId)) {
          updated = paidUsers.filter(id => id !== userId);
        } else {
          updated = [...paidUsers, userId];
        }

        transaction.update(msgRef, {
          "metadata.paidUsers": updated
        });
      });
    } catch (err) {
      console.error("Error toggling settlement payment:", err);
      throw err;
    }
  },

  // Toggle Poll Vote
  togglePollVote: async (messageId: string, optionIndex: number, userId: string) => {
    try {
      const msgRef = doc(db, MESSAGES_COLLECTION, messageId);
      await runTransaction(db, async (transaction) => {
        const msgDoc = await transaction.get(msgRef);
        if (!msgDoc.exists()) {
          throw new Error("Message does not exist");
        }
        const data = msgDoc.data() as ChatMessage;
        const metadata = data.metadata || {};
        if (metadata.isClosed) {
          throw new Error("Poll is closed");
        }
        
        const votes = metadata.votes || {};
        const allowMultiple = metadata.allowMultiple || false;
        const key = String(optionIndex);
        
        let newVotes = { ...votes };
        let currentOptionVotes = newVotes[key] || [];
        
        if (currentOptionVotes.includes(userId)) {
          currentOptionVotes = currentOptionVotes.filter(id => id !== userId);
          newVotes[key] = currentOptionVotes;
        } else {
          if (!allowMultiple) {
            Object.keys(newVotes).forEach(k => {
              newVotes[k] = (newVotes[k] || []).filter(id => id !== userId);
            });
          }
          currentOptionVotes = [...currentOptionVotes, userId];
          newVotes[key] = currentOptionVotes;
        }
        
        transaction.update(msgRef, {
          "metadata.votes": newVotes
        });
      });
    } catch (err) {
      console.error("Error toggling poll vote:", err);
      throw err;
    }
  },

  // Close Poll
  closePoll: async (messageId: string) => {
    try {
      const msgRef = doc(db, MESSAGES_COLLECTION, messageId);
      await updateDoc(msgRef, {
        "metadata.isClosed": true
      });
    } catch (err) {
      console.error("Error closing poll:", err);
      throw err;
    }
  },

  // ---- Hybrid Pending Message Queue Helpers ----
  getPendingMessages: (roomId?: string): any[] => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem('woc_pending_messages');
      const all: any[] = stored ? JSON.parse(stored) : [];
      if (roomId) {
        return all.filter((m: any) => m.roomId === roomId);
      }
      return all;
    } catch (e) {
      console.error("Error reading pending messages from localStorage:", e);
      return [];
    }
  },

  savePendingMessage: (message: any) => {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem('woc_pending_messages');
      const all = stored ? JSON.parse(stored) : [];
      
      const exists = all.some((m: any) => m.tempId === message.tempId);
      if (!exists) {
        all.push(message);
        localStorage.setItem('woc_pending_messages', JSON.stringify(all));
      }
    } catch (e) {
      console.error("Error saving pending message:", e);
    }
  },

  removePendingMessage: (tempId: string) => {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem('woc_pending_messages');
      if (!stored) return;
      const all = JSON.parse(stored);
      const filtered = all.filter((m: any) => m.tempId !== tempId);
      localStorage.setItem('woc_pending_messages', JSON.stringify(filtered));
    } catch (e) {
      console.error("Error removing pending message:", e);
    }
  },

  processPendingQueue: async () => {
    if (typeof window === 'undefined' || !navigator.onLine) return;
    try {
      const stored = localStorage.getItem('woc_pending_messages');
      if (!stored) return;
      const all = JSON.parse(stored);
      if (all.length === 0) return;

      for (const item of all) {
        try {
          await chatMessageService.sendMessage(item);
          chatMessageService.removePendingMessage(item.tempId);
        } catch (err) {
          console.error(`[Smart Queue] Failed to resend pending message ${item.tempId}:`, err);
          break;
        }
      }
    } catch (e) {
      console.error("Error processing pending messages queue:", e);
    }
  }
};
