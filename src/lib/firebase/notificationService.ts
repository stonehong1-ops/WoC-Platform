import { db } from './clientApp';
import { 
  collection, 
  addDoc, 
  Timestamp,
  doc,
  getDoc
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

    // FCM 푸시 발송 로직 추가
    try {
      const userDoc = await getDoc(doc(db, 'users', targetUserId));
      const userData = userDoc.data();
      const tokens = userData?.fcmTokens;

      if (tokens && Array.isArray(tokens) && tokens.length > 0) {
        await fetch('/api/notifications', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            tokens: tokens,
            title: '새로운 그룹 초대',
            message: message,
            data: {
              type: 'GROUP_INVITE',
              groupId: groupId
            }
          })
        });
      }
    } catch (pushError) {
      console.error('FCM 푸시 알림 발송 실패:', pushError);
      // DB 저장 자체는 실패하지 않도록 catch에서 로깅만 함
    }

    return docRef.id;
  }
};
