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

// 수신 사용자의 ID를 이용해 Firestore 에서 language 설정 ('KR' | 'EN')을 조회한 뒤, 다국어 템플릿 치환 적용
async function getTranslatedText(targetUserId: string, key: string, params?: any): Promise<{ title: string; message: string }> {
  try {
    let language: 'KR' | 'EN' = 'KR'; // Default
    if (targetUserId) {
      const userSnap = await getDoc(doc(db, 'users', targetUserId));
      if (userSnap.exists()) {
        const uLang = userSnap.data()?.language;
        if (uLang === 'EN' || uLang === 'KR') {
          language = uLang;
        }
      }
    }

    const { loadDictionary } = await import('@/i18n');
    const dict = (await loadDictionary(language)) as Record<string, string>;
    
    // 알림 전용 키 네이밍 규칙에 맞추어 타이틀과 메시지 획득
    let title = dict[`${key}_title`] || dict[`${key}.title`] || `${key}_title`;
    let message = dict[`${key}_msg`] || dict[`${key}.msg`] || `${key}_msg`;

    // 템플릿 치환
    if (params && typeof params === 'object') {
      Object.keys(params).forEach(p => {
        title = title.replace(new RegExp(`\\{${p}\\}`, 'g'), params[p]);
        message = message.replace(new RegExp(`\\{${p}\\}`, 'g'), params[p]);
      });
    }

    return { title, message };
  } catch (err) {
    console.error('Failed to translate notification for user:', err);
    return { title: key, message: key };
  }
}

export const notificationService = {
  // --- New Unified Notification System ---

  // 1. 단순 정보성 알림 생성
  createNotification: async (
    data: Omit<Notification, 'id' | 'createdAt' | 'isRead' | 'baseType'>,
    batch?: any // firebase/firestore WriteBatch for atomic writes
  ): Promise<string> => {
    let finalTitle = data.title || 'New Notification';
    let finalMessage = data.message;

    if (data.i18nKey) {
      const trans = await getTranslatedText(data.targetUserId, data.i18nKey, data.i18nParams);
      finalTitle = trans.title;
      finalMessage = trans.message;
    }

    const docRef = doc(collection(db, NOTIFICATIONS_COLLECTION));
    const docData = {
      ...data,
      title: finalTitle,
      message: finalMessage,
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
    notificationService.sendFCM(data.targetUserId, finalTitle, finalMessage, docData);
    
    return docRef.id;
  },

  // 2. 행동 유도형 Todo 생성 (INFO 일반 알림으로 통합)
  createTodo: async (
    data: Omit<Notification, 'id' | 'createdAt' | 'isRead' | 'isCompleted' | 'baseType'>,
    batch?: any // firebase/firestore WriteBatch for atomic writes
  ): Promise<string> => {
    let finalTitle = data.title || 'New Notification';
    let finalMessage = data.message;

    if (data.i18nKey) {
      const trans = await getTranslatedText(data.targetUserId, data.i18nKey, data.i18nParams);
      finalTitle = trans.title;
      finalMessage = trans.message;
    }

    const docRef = doc(collection(db, NOTIFICATIONS_COLLECTION));
    const docData = {
      ...data,
      title: finalTitle,
      message: finalMessage,
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
    notificationService.sendFCM(data.targetUserId, finalTitle, finalMessage, docData);

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

  // 4. Todo 완료 처리 (동기화 - INFO 통합에 따라 읽음 처리만 지원)
  markAsCompleted: async (notificationId: string, batch?: any): Promise<void> => {
    const docRef = doc(db, NOTIFICATIONS_COLLECTION, notificationId);
    if (batch) {
      batch.update(docRef, { isRead: true });
    } else {
      await updateDoc(docRef, { isRead: true });
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

  // 6. 특정 referenceId에 해당하는 모든 TODO 완료 처리 (TODO 제거에 따라 Nop 처리)
  markTodosAsCompletedByReference: async (referenceId: string, batch?: any): Promise<void> => {
    return;
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
    const groupsRef = collection(db, 'groups');
    
    // adminId가 ownerId인 그룹 조회
    const qGroups = groupId 
      ? query(groupsRef, where('ownerId', '==', adminId), where('id', '==', groupId))
      : query(groupsRef, where('ownerId', '==', adminId));

    const groupUnsubs: Record<string, () => void> = {};
    let groupTodosMap: Record<string, Notification[]> = {};
    
    const businessUnsubs: Record<string, () => void> = {};
    const businessTodosMap: Record<string, Notification[]> = {};

    const fireCallback = () => {
      const allTodos = [
        ...Object.values(groupTodosMap).flat(),
        ...Object.values(businessTodosMap).flat()
      ];
      allTodos.sort((a, b) => {
        const timeA = (a.createdAt as any)?.toMillis?.() || (a.createdAt as any)?.seconds * 1000 || a.createdAt || 0;
        const timeB = (b.createdAt as any)?.toMillis?.() || (b.createdAt as any)?.seconds * 1000 || b.createdAt || 0;
        return Number(timeB) - Number(timeA);
      });
      callback(allTodos);
    };

    const unsubGroups = onSnapshot(qGroups, (groupSnap) => {
      const currentGroupIds = new Set(groupSnap.docs.map(d => d.id));
      Object.keys(groupUnsubs).forEach(gId => {
        if (!currentGroupIds.has(gId)) {
          groupUnsubs[gId]();
          delete groupUnsubs[gId];
          delete groupTodosMap[gId];
        }
      });

      if (groupSnap.docs.length === 0) {
        groupTodosMap = {};
        fireCallback();
        return;
      }

      groupSnap.docs.forEach(gDoc => {
        const gId = gDoc.id;
        const gName = gDoc.data().name || 'Group';
        
        if (!groupUnsubs[gId]) {
          const membersRef = collection(db, 'groups', gId, 'members');
          const qPending = query(membersRef, where('status', '==', 'pending'));
          
          groupUnsubs[gId] = onSnapshot(qPending, (mSnap) => {
            const groupTodos = mSnap.docs.map(mDoc => {
              const mData = mDoc.data();
              return {
                id: `todo_${gId}_${mDoc.id}`,
                targetUserId: adminId,
                baseType: 'INFO',
                category: 'ADMIN',
                type: 'CLASS_APPLY',
                referenceId: mDoc.id,
                groupId: gId,
                groupName: gName,
                title: '가입 승인 대기',
                message: `${mData.name || 'Anonymous'}님이 '${gName}' 그룹 가입 승인을 요청했습니다.`,
                createdAt: mData.joinedAt || Date.now(),
                isRead: false
              } as Notification;
            });

            groupTodosMap[gId] = groupTodos;
            fireCallback();
          });
        }
      });
    });

    // 비즈니스 챗(마켓 챗) pending 리스너 병합
    const roomsRef = collection(db, 'chat_rooms');
    const qRooms = query(roomsRef, where('participants', 'array-contains', adminId), where('type', '==', 'business'));

    const unsubRooms = onSnapshot(qRooms, (snap) => {
      const currentRoomIds = new Set();
      
      snap.docs.forEach(rDoc => {
        const rId = rDoc.id;
        const rData = rDoc.data();
        
        // groupId 필터 적용
        if (groupId && rData.linkedGroupId !== groupId) {
          return;
        }

        currentRoomIds.add(rId);

        if (!businessUnsubs[rId]) {
          const msgsRef = collection(db, 'chat_messages');
          const qPendingMsgs = query(
            msgsRef,
            where('roomId', '==', rId)
          );

          businessUnsubs[rId] = onSnapshot(qPendingMsgs, (mSnap) => {
            const pendingTodos = mSnap.docs
              .filter(mDoc => {
                const mData = mDoc.data();
                if (mData.senderId === adminId) return false;
                
                const meta = mData.metadata;
                if (!meta) return false;
                
                return meta.actionType === 'booking_approval' && 
                       meta.sellerId === adminId && 
                       meta.status === 'BANK_TRANSFERRED';
              })
              .map(mDoc => {
                const mData = mDoc.data();
                return {
                  id: `todo_business_${rId}_${mDoc.id}`,
                  targetUserId: adminId,
                  baseType: 'INFO',
                  category: 'SHOP',
                  type: 'BUSINESS_CHAT',
                  referenceId: rId,
                  groupId: rData.linkedGroupId || '',
                  groupName: rData.name || 'Market Chat',
                  title: '마켓 가입 승인 대기',
                  message: mData.text || '마켓 가입 승인 요청이 있습니다.',
                  createdAt: mData.timestamp || Date.now(),
                  isRead: false
                } as Notification;
              });

            businessTodosMap[rId] = pendingTodos;
            fireCallback();
          });
        }
      });

      // 제거된 방 리스너 해제
      Object.keys(businessUnsubs).forEach(rId => {
        if (!currentRoomIds.has(rId)) {
          businessUnsubs[rId]();
          delete businessUnsubs[rId];
          delete businessTodosMap[rId];
        }
      });

      if (snap.docs.length === 0) {
        Object.keys(businessTodosMap).forEach(key => delete businessTodosMap[key]);
        fireCallback();
      }
    });

    return () => {
      unsubGroups();
      unsubRooms();
      Object.values(groupUnsubs).forEach(unsub => unsub());
      Object.values(businessUnsubs).forEach(unsub => unsub());
    };
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
    
    // 비동기 번역 처리
    const { title: finalTitle, message: finalMessage } = await getTranslatedText(
      targetUserId,
      'notification.invite',
      { user: fromUserName, group: groupName }
    );

    const notificationData: Omit<Notification, 'id'> = {
      baseType: 'INFO',
      category: 'GROUP',
      type: 'GROUP_INVITE',
      status: 'PENDING',
      fromUserId,
      fromUserName,
      targetUserId,
      groupId,
      groupName,
      title: finalTitle,
      message: finalMessage,
      isRead: false,
      createdAt: Date.now(),
      i18nKey: 'notification.invite',
      i18nParams: { user: fromUserName, group: groupName }
    };

    const docRef = await addDoc(collection(db, NOTIFICATIONS_COLLECTION), {
      ...notificationData,
      createdAt: Timestamp.now() 
    });

    notificationService.sendFCM(targetUserId, finalTitle, finalMessage, notificationData);

    return docRef.id;
  }
};
