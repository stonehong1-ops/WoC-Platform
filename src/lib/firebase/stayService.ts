import { db } from './clientApp';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
  serverTimestamp,
  where,
  Timestamp,
  increment,
  deleteDoc
} from 'firebase/firestore';
import { Stay, StayLike } from '@/types/stay';

const STAYS_COLLECTION = 'stays';
const LIKES_COLLECTION = 'stay_likes';

// Helper: undefined/null 필드 제거 (Firestore 거부 방지)
function cleanData(obj: any): any {
  const result: any = {};
  for (const key of Object.keys(obj)) {
    if (obj[key] !== undefined && obj[key] !== null) {
      if (typeof obj[key] === 'object' && !Array.isArray(obj[key]) && !(obj[key] instanceof Timestamp)) {
        result[key] = cleanData(obj[key]);
      } else {
        result[key] = obj[key];
      }
    }
  }
  return result;
}

export const stayService = {
  // 1. 전체 활성 Stay 실시간 구독 (목록 페이지)
  subscribeActiveStays: (
    filters: { type?: string } | null,
    callback: (stays: Stay[]) => void
  ) => {
    let q = query(
      collection(db, STAYS_COLLECTION),
      where('isActive', '==', true),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
      let stays = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Stay[];

      // 클라이언트 필터 (Firestore 복합 인덱스 회피)
      if (filters?.type && filters.type !== 'All') {
        stays = stays.filter(s => s.type === filters.type);
      }

      callback(stays);
    }, (error) => {
      console.error("Error subscribing to active stays:", error);
    });
  },

  // 2. 그룹 소유 Stay 구독 (GroupStayEditor용)
  subscribeGroupStay: (
    groupId: string,
    callback: (stay: Stay | null) => void
  ) => {
    const q = query(
      collection(db, STAYS_COLLECTION),
      where('groupId', '==', groupId)
    );

    return onSnapshot(q, (snapshot) => {
      if (snapshot.empty) {
        callback(null);
      } else {
        const doc = snapshot.docs[0];
        callback({ id: doc.id, ...doc.data() } as Stay);
      }
    }, (error) => {
      console.error("Error subscribing to group stay:", error);
    });
  },

  // 3. 단일 Stay 가져오기 (상세 페이지)
  getStay: async (stayId: string): Promise<Stay | null> => {
    try {
      const docRef = doc(db, STAYS_COLLECTION, stayId);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) return null;
      return { id: docSnap.id, ...docSnap.data() } as Stay;
    } catch (error) {
      console.error("Error getting stay:", error);
      throw error;
    }
  },

  // 4. 단일 Stay 실시간 구독 (상세 페이지)
  subscribeStay: (
    stayId: string,
    callback: (stay: Stay | null) => void
  ) => {
    const docRef = doc(db, STAYS_COLLECTION, stayId);
    return onSnapshot(docRef, (docSnap) => {
      if (!docSnap.exists()) {
        callback(null);
      } else {
        callback({ id: docSnap.id, ...docSnap.data() } as Stay);
      }
    }, (error) => {
      console.error("Error subscribing to stay:", error);
    });
  },

  // 5. Stay 등록 (GroupStayEditor에서 새로 등록)
  registerStay: async (stayData: Omit<Stay, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    try {
      const cleaned = cleanData(stayData);
      const docRef = await addDoc(collection(db, STAYS_COLLECTION), {
        ...cleaned,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error("Error registering stay:", error);
      throw error;
    }
  },

  // 6. Stay 업데이트 (GroupStayEditor에서 수정)
  updateStay: async (stayId: string, updates: Partial<Stay>): Promise<void> => {
    try {
      const cleaned = cleanData(updates);
      const docRef = doc(db, STAYS_COLLECTION, stayId);
      await updateDoc(docRef, {
        ...cleaned,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error updating stay:", error);
      throw error;
    }
  },

  // 7. Stay 활성/비활성 토글
  toggleStayActive: async (stayId: string, isActive: boolean): Promise<void> => {
    try {
      const docRef = doc(db, STAYS_COLLECTION, stayId);
      await updateDoc(docRef, {
        isActive,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error toggling stay active:", error);
      throw error;
    }
  },

  // 8. 기존 호환: subscribeStays (type 필터 + 전체)
  subscribeStays: (
    filters: { type?: string; maxPrice?: number } | null,
    callback: (stays: Stay[]) => void
  ) => {
    let q = query(
      collection(db, STAYS_COLLECTION),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
      let stays = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Stay[];

      if (filters?.type && filters.type !== 'All') {
        stays = stays.filter(s => s.type === filters.type);
      }

      callback(stays);
    }, (error) => {
      console.error("Error subscribing to stays:", error);
    });
  },

  // ===== LIKES (WISHLIST) =====

  // Toggle like (찜 토글) — atomic transaction
  toggleLike: async (userId: string, stayId: string): Promise<boolean> => {
    const likeId = `${userId}_${stayId}`;
    const likeRef = doc(db, LIKES_COLLECTION, likeId);
    const stayRef = doc(db, STAYS_COLLECTION, stayId);

    try {
      const likeSnap = await getDoc(likeRef);
      
      if (likeSnap.exists()) {
        // Un-like: 찜 해제
        await deleteDoc(likeRef);
        await updateDoc(stayRef, { likesCount: increment(-1) });
        return false; // now unliked
      } else {
        // Like: 찜 추가
        await setDoc(likeRef, {
          userId,
          stayId,
          createdAt: serverTimestamp()
        });
        await updateDoc(stayRef, { likesCount: increment(1) });
        return true; // now liked
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      throw error;
    }
  },

  // Subscribe to user's liked stays (내 찜 목록 실시간 구독)
  subscribeMyLikes: (userId: string, callback: (likes: StayLike[]) => void) => {
    const q = query(
      collection(db, LIKES_COLLECTION),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    return onSnapshot(q, (snapshot) => {
      const likes = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as StayLike[];
      callback(likes);
    }, (error) => {
      console.error('Error subscribing to likes:', error);
    });
  },

  // Clear all likes for a user (찜통 비우기)
  clearAllLikes: async (userId: string) => {
    try {
      const q = query(
        collection(db, LIKES_COLLECTION),
        where('userId', '==', userId)
      );
      const snapshot = await getDocs(q);
      
      // Batch delete all likes and decrement counts
      const deletePromises = snapshot.docs.map(async (likeDoc) => {
        const likeData = likeDoc.data();
        await deleteDoc(likeDoc.ref);
        // Decrement likesCount on the stay
        const stayRef = doc(db, STAYS_COLLECTION, likeData.stayId);
        await updateDoc(stayRef, { likesCount: increment(-1) }).catch(() => {});
      });
      
      await Promise.all(deletePromises);
    } catch (error) {
      console.error('Error clearing all likes:', error);
      throw error;
    }
  }
};
