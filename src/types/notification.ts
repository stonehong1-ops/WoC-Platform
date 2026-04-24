export type NotificationType = 'GROUP_INVITE' | 'GENERAL' | 'ADMIN';
export type NotificationStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'READ';

export interface Notification {
  id: string;
  type: NotificationType;
  status: NotificationStatus;
  fromUserId: string;
  fromUserName: string;
  targetUserId: string;
  groupId?: string;
  groupName?: string;
  message: string;
  createdAt: number;
}
