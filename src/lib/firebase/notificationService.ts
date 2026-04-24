import { db } from './clientApp';
import { 
  collection, 
  addDoc, 
  Timestamp 
} from 'firebase/firestore';
import { Notification } from '@/types/notification';

const NOTIFICATIONS_COLLECTION = 'notifications';

export const notificationService = {
  // Send group invitation notification
  sendGroupInvitation: async (params: {
    fromUserId: string;
    fromUserName: string;
    targetUserId: string;
    groupId: string;
    groupName: string;
  }): Promise<string> => {
    const { fromUserId, fromUserName, targetUserId, groupId, groupName } = params;
    
    // Formatted message as requested by USER
    const message = `${fromUserName}님께서 '${groupName}' 그룹에 초대하였습니다. 승인하시겠습니까?`;

    const notificationData: Omit<Notification, 'id'> = {
      type: 'GROUP_INVITE',
      status: 'PENDING',
      fromUserId,
      fromUserName,
      targetUserId,
      groupId,
      groupName,
      message,
      createdAt: Date.now()
    };

    const docRef = await addDoc(collection(db, NOTIFICATIONS_COLLECTION), {
      ...notificationData,
      createdAt: Timestamp.now() // Use Firestore Timestamp for the actual DB field
    });

    return docRef.id;
  }
};
