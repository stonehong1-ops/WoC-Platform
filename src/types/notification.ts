export type BaseNotificationType = 'INFO';
export type NotificationCategory = 'CLASS' | 'STAY' | 'SHOP' | 'FEED' | 'SYSTEM' | 'GROUP' | 'ADMIN' | 'SOCIAL' | 'BOOKING';
export type NotificationType = string; // Legacy: 'GROUP_INVITE' | 'GENERAL' | 'ADMIN', New: 'CLASS_APPLY', etc.
export type NotificationStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'READ'; // Legacy

export interface Notification {
  id: string;
  targetUserId: string;      
  
  // New System Classification
  baseType?: BaseNotificationType; 
  category?: NotificationCategory;
  
  // Legacy / Group specific classification
  type?: NotificationType;
  status?: NotificationStatus;
  
  // Content
  title?: string;
  message: string;
  imageUrl?: string;
  
  // Senders (Legacy / Feed etc)
  fromUserId?: string;
  fromUserName?: string;
  groupId?: string;
  groupName?: string;
  
  // Action
  actionUrl?: string;
  buttonText?: string;
  
  // State Management
  isRead?: boolean;
  isCompleted?: boolean;
  
  // Reference for bulk operations or transaction tracking
  referenceId?: string;
  
  // Metadata
  createdAt: number | any; // number or Firestore Timestamp
  expiresAt?: number | any;
}
