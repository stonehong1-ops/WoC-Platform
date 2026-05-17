import { db } from './clientApp';
import { 
  collection, 
  addDoc, 
  Timestamp,
  doc,
  getDoc,
  setDoc,
  query,
  where,
  getDocs,
  updateDoc,
  onSnapshot,
  writeBatch
} from 'firebase/firestore';
import { Notification } from '@/types/notification';

const NOTIFICATIONS_COLLECTION = 'notifications';

export const notificationService = {
  // --- New Unified Notification System ---

  // 1. 단순 정보성 알림 생성
  createNotification: async (
    data: Omit<Notification, 'id' | 'createdAt' | 'isRead' | 'baseType'>,
    batch?: any // firebase/firestore WriteBatch for atomic writes
  ): Promise<string> => {
    const docRef = doc(collection(db, NOTIFICATIONS_COLLECTION));
    const docData = {
      ...data,
      baseType: 'INFO',
      isRead: false,
      createdAt: Timestamp.now()
    };
    
    if (batch) {
      batch.set(docRef, docData);
    } else {
      await setDoc(docRef, docData);
    }
    
    // 비동기 푸시 발송
    notificationService.sendFCM(data.targetUserId, data.title || 'New Notification', data.message, docData);
    
    return docRef.id;
  },

  // 2. 행동 유도형 Todo 생성
  createTodo: async (
    data: Omit<Notification, 'id' | 'createdAt' | 'isRead' | 'isCompleted' | 'baseType'>,
    batch?: any // firebase/firestore WriteBatch for atomic writes
  ): Promise<string> => {
    const docRef = doc(collection(db, NOTIFICATIONS_COLLECTION));
    const docData = {
      ...data,
      baseType: 'TODO',
      isRead: false,
      isCompleted: false,
      createdAt: Timestamp.now()
    };

    if (batch) {
      batch.set(docRef, docData);
    } else {
      await addDoc(collection(db, NOTIFICATIONS_COLLECTION), docData);
    }

    // 비동기 푸시 발송
    notificationService.sendFCM(data.targetUserId, data.title || 'New Task', data.message, docData);

    return docRef.id;
  },

  // 3. 읽음 처리
  markAsRead: async (notificationId: string): Promise<void> => {
    const docRef = doc(db, NOTIFICATIONS_COLLECTION, notificationId);
    await updateDoc(docRef, { isRead: true });
  },

  // 3-1. 다중 읽음 처리 (Batch Update)
  markMultipleAsRead: async (notificationIds: string[]): Promise<void> => {
    if (!notificationIds || notificationIds.length === 0) return;
    
    // Firestore batch limit is 500, use 400 for safety
    const chunks = [];
    for (let i = 0; i < notificationIds.length; i += 400) {
      chunks.push(notificationIds.slice(i, i + 400));
    }
    
    for (const chunk of chunks) {
      const batch = writeBatch(db);
      for (const id of chunk) {
        const docRef = doc(db, NOTIFICATIONS_COLLECTION, id);
        batch.update(docRef, { isRead: true });
      }
      await batch.commit();
    }
  },

  // 4. Todo 완료 처리 (동기화)
  markAsCompleted: async (notificationId: string, batch?: any): Promise<void> => {
    const docRef = doc(db, NOTIFICATIONS_COLLECTION, notificationId);
    if (batch) {
      batch.update(docRef, { isCompleted: true, isRead: true });
    } else {
      await updateDoc(docRef, { isCompleted: true, isRead: true });
    }
  },

  // 5. 그룹 어드민 다중 발송 (Fan-out)
  createTodoForGroupAdmins: async (
    groupId: string,
    data: Omit<Notification, 'id' | 'createdAt' | 'isRead' | 'isCompleted' | 'baseType' | 'targetUserId'>,
    batch?: any
  ): Promise<string[]> => {
    const membersRef = collection(db, 'groups', groupId, 'members');
    const q = query(membersRef, where('status', '==', 'active'), where('role', 'in', ['admin', 'owner']));
    const snapshot = await getDocs(q);
    
    const createdIds: string[] = [];
    for (const docSnap of snapshot.docs) {
      const adminId = docSnap.id;
      const id = await notificationService.createTodo({
        ...data,
        targetUserId: adminId,
        groupId
      }, batch);
      createdIds.push(id);
    }
    return createdIds;
  },

  // 6. 특정 referenceId에 해당하는 모든 TODO 완료 처리 (어드민 중 한명이 처리 시 동기화)
  markTodosAsCompletedByReference: async (referenceId: string, batch?: any): Promise<void> => {
    const q = query(collection(db, NOTIFICATIONS_COLLECTION), 
      where('referenceId', '==', referenceId),
      where('baseType', '==', 'TODO'),
      where('isCompleted', '==', false)
    );
    const snapshot = await getDocs(q);
    
    for (const docSnap of snapshot.docs) {
      const docRef = doc(db, NOTIFICATIONS_COLLECTION, docSnap.id);
      if (batch) {
        batch.update(docRef, { isCompleted: true, isRead: true });
      } else {
        await updateDoc(docRef, { isCompleted: true, isRead: true });
      }
    }
  },

  // 7. 사용자 알림 실시간 구독
  subscribeToUserNotifications: (
    userId: string,
    callback: (notifications: Notification[]) => void
  ) => {
    const q = query(
      collection(db, NOTIFICATIONS_COLLECTION),
      where('targetUserId', '==', userId)
    );
    
    return onSnapshot(q, (snapshot) => {
      const notifications = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Notification[];
      
      // Sort client-side by createdAt descending
      notifications.sort((a, b) => {
        const timeA = (a.createdAt as any)?.toMillis?.() || a.createdAt || 0;
        const timeB = (b.createdAt as any)?.toMillis?.() || b.createdAt || 0;
        return Number(timeB) - Number(timeA);
      });
      
      callback(notifications);
    });
  },

  // 8. 관리자 Todo 알림 실시간 구독
  subscribeToAdminTodos: (
    adminId: string,
    groupId: string | undefined, // undefined면 모든 그룹의 Todo 가져오기
    callback: (todos: Notification[]) => void
  ) => {
    let q;
    if (groupId) {
      q = query(
        collection(db, NOTIFICATIONS_COLLECTION),
        where('targetUserId', '==', adminId),
        where('groupId', '==', groupId),
        where('baseType', '==', 'TODO'),
        where('isCompleted', '==', false)
      );
    } else {
      q = query(
        collection(db, NOTIFICATIONS_COLLECTION),
        where('targetUserId', '==', adminId),
        where('baseType', '==', 'TODO'),
        where('isCompleted', '==', false)
      );
    }

    return onSnapshot(q, (snapshot) => {
      const todos = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Notification[];
      
      todos.sort((a, b) => {
        const timeA = (a.createdAt as any)?.toMillis?.() || a.createdAt || 0;
        const timeB = (b.createdAt as any)?.toMillis?.() || b.createdAt || 0;
        return Number(timeB) - Number(timeA);
      });
      
      callback(todos);
    });
  },


  // FCM 공통 전송 모듈 (Private처럼 사용)
  sendFCM: async (targetUserId: string, title: string, message: string, dataPayload: any) => {
    try {
      if (!targetUserId) return;
      const userDoc = await getDoc(doc(db, 'users', targetUserId));
      const userData = userDoc.data();
      const tokens = userData?.fcmTokens;

      if (tokens && Array.isArray(tokens) && tokens.length > 0) {
        await fetch('/api/notifications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tokens: tokens,
            title: title,
            message: message,
            data: {
              baseType: dataPayload.baseType,
              category: dataPayload.category || 'SYSTEM',
              actionUrl: dataPayload.actionUrl || ''
            }
          })
        });
      }
    } catch (e) {
      console.error('FCM sending failed (isolated):', e);
    }
  },

  // --- Legacy ---
  // Send group invitation notification
  sendGroupInvitation: async (params: {
    fromUserId: string;
    fromUserName: string;
    targetUserId: string;
    groupId: string;
    groupName: string;
  }): Promise<string> => {
    const { fromUserId, fromUserName, targetUserId, groupId, groupName } = params;
    
    // Formatted message
    const message = `${fromUserName} invited you to the '${groupName}' group. Would you like to approve?`;

    const notificationData: Omit<Notification, 'id'> = {
      baseType: 'TODO',
      category: 'GROUP',
      type: 'GROUP_INVITE',
      status: 'PENDING',
      fromUserId,
      fromUserName,
      targetUserId,
      groupId,
      groupName,
      message,
      isRead: false,
      isCompleted: false,
      createdAt: Date.now()
    };

    const docRef = await addDoc(collection(db, NOTIFICATIONS_COLLECTION), {
      ...notificationData,
      createdAt: Timestamp.now() 
    });

    notificationService.sendFCM(targetUserId, 'New Group Invitation', message, notificationData);

    return docRef.id;
  }
};
