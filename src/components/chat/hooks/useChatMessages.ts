import { useState, useEffect, useMemo } from 'react';
import { chatService } from '@/lib/firebase/chatService';
import type { ChatMessage, ChatRoom } from '@/types/chat';

export interface UseChatMessagesProps {
  roomId: string;
  userId?: string;
  room: ChatRoom | null;
}

export function useChatMessages({ roomId, userId, room }: UseChatMessagesProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    if (typeof window !== 'undefined') {
      const cached = sessionStorage.getItem(`woc_chat_messages_${roomId}`);
      if (cached) {
        try {
          return JSON.parse(cached);
        } catch (e) {
          console.error('Failed to parse cached chat messages:', e);
        }
      }
    }
    return [];
  });
  
  const [messageLimit, setMessageLimit] = useState(50);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [pendingMessages, setPendingMessages] = useState<any[]>([]);

  // 1-a. 대화방 식별키가 전환되는 즉시 기존 상태 소거 및 캐시 정렬
  useEffect(() => {
    if (typeof window !== 'undefined' && roomId) {
      const cached = sessionStorage.getItem(`woc_chat_messages_${roomId}`);
      if (cached) {
        try {
          setMessages(JSON.parse(cached));
          return;
        } catch (e) {
          console.error('Failed to parse cached chat messages on room change:', e);
        }
      }
    }
    setMessages([]);
    setMessageLimit(50);
    setPendingMessages([]);
  }, [roomId]);

  // 1-b. 브라우저 온라인 감지 및 펜딩 큐 동기화
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updatePending = () => {
      if ((chatService as any).getPendingMessages) {
        setPendingMessages((chatService as any).getPendingMessages(roomId));
      }
    };

    updatePending();

    const handleOnlineStatus = async () => {
      if (navigator.onLine && (chatService as any).processPendingQueue) {
        await (chatService as any).processPendingQueue();
        updatePending();
      }
    };

    window.addEventListener('online', handleOnlineStatus);
    const interval = setInterval(handleOnlineStatus, 3000);

    return () => {
      window.removeEventListener('online', handleOnlineStatus);
      clearInterval(interval);
    };
  }, [roomId, messages]);

  const displayMessages = useMemo(() => {
    const localPending = pendingMessages.map(pm => ({
      ...pm,
      id: pm.tempId || `pending_${pm.timestamp?.seconds || Date.now()}`,
      timestamp: pm.timestamp || { seconds: Date.now() / 1000, nanoseconds: 0 },
      isPending: !navigator.onLine || !pm.isFailed,
      isFailed: pm.isFailed || false
    }));

    const filteredPending = localPending.filter(pm => {
      return !messages.some(m => m.senderId === pm.senderId && m.text === pm.text && Math.abs((m.timestamp?.seconds || 0) - (pm.timestamp?.seconds || 0)) < 10);
    });

    return [...messages, ...filteredPending];
  }, [messages, pendingMessages]);

  // Subscribe to Messages & Mark read
  useEffect(() => {
    if (!userId || !roomId) return;

    const unsubMessages = chatService.subscribeMessages(roomId, messageLimit, (newMsgs) => {
      setMessages(newMsgs);
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(`woc_chat_messages_${roomId}`, JSON.stringify(newMsgs));
      }
      
      // Mark as read logic
      chatService.resetUnreadCount(roomId, userId);
      
      // Mark individual messages as read in batch
      const unreadMsgIds = newMsgs
        .filter(msg => msg.readBy && !msg.readBy.includes(userId))
        .map(msg => msg.id);
        
      if (unreadMsgIds.length > 0) {
        if ((chatService as any).markMessagesAsReadBatch) {
          (chatService as any).markMessagesAsReadBatch(unreadMsgIds, userId);
        } else {
          unreadMsgIds.forEach(id => chatService.markMessageAsRead(id, userId));
        }
      }
    });

    return () => {
      unsubMessages();
    };
  }, [roomId, userId, messageLimit]);

  const loadMoreMessages = () => {
    setIsLoadingMore(true);
    setMessageLimit(prev => prev + 50);
  };

  return {
    messages,
    setMessages,
    displayMessages,
    messageLimit,
    setMessageLimit,
    isLoadingMore,
    setIsLoadingMore,
    pendingMessages,
    setPendingMessages,
    loadMoreMessages,
  };
}
