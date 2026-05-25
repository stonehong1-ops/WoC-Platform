import { Timestamp } from 'firebase/firestore';

export type MessageType = 'text' | 'image' | 'video' | 'voice' | 'location' | 'system' | 'meetup' | 'sticker' | 'remittance' | 'poll';

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
  metadata?: {
    actionType?: string;
    bookingId?: string;
    status?: string;
    // Meetup Scheduler fields
    date?: string;
    location?: string;
    maxCapacity?: number;
    attendees?: string[];
    description?: string;
    isConfirmed?: boolean;
    // Settlement/Remittance fields
    settlementId?: string;
    title?: string;
    totalAmount?: number;
    perPersonAmount?: number;
    bankName?: string;
    accountNumber?: string;
    paidUsers?: string[];
    // Polls fields
    options?: string[];
    votes?: Record<string, string[]>;
    isClosed?: boolean;
    allowMultiple?: boolean;
    [key: string]: any;
  };
}

export interface ChatRoom {
  id: string;
  name: string;
  type: 'public' | 'private' | 'group' | 'notice' | 'personal' | 'groups' | 'business';
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
  pinnedBy?: string[];
  notice?: string; // Pinned sticky notice text
  // Group chat fields (type: 'groups' only)
  linkedGroupId?: string;      // groups module groupId (1:1 mapping)
  admins?: string[];           // chat room admin list (synced with group owner)
  joinPolicy?: 'open' | 'approval' | 'invite';  // mirrors group joinStrategy
}
