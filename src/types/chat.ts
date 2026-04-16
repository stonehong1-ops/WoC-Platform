import { Timestamp } from 'firebase/firestore';

export type MessageType = 'text' | 'image' | 'video' | 'voice' | 'location' | 'system';

export interface ChatMessage {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  senderPhoto?: string;
  text: string;
  type: MessageType;
  timestamp: any;
  mediaUrl?: string;
  readBy: string[];
  reactions?: Record<string, string>;
  replyTo?: string; // ID of message being replied to
  isDeleted?: boolean;
  isEdited?: boolean;
}

export interface ChatRoom {
  id: string;
  name: string;
  type: 'public' | 'private' | 'group' | 'notice';
  participants: string[];
  lastMessage?: string;
  lastMessageTime?: any;
  lastMessageSenderId?: string;
  lastMessageReadBy?: string[];
  unreadCounts?: Record<string, number>;
  imageUrl?: string;
  createdAt: any;
  createdBy: string;
  customName?: string;
  description?: string;
}
