import { db } from './clientApp';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  doc, 
  serverTimestamp,
  where,
  increment,
  writeBatch,
  getDocs,
  setDoc,
  getDoc
} from 'firebase/firestore';
import { ResaleItem, UserReputation } from '@/types/resale';

const RESALE_COLLECTION = 'resale_items';
const REPUTATION_COLLECTION = 'user_reputation';
const LIKES_COLLECTION = 'resale_likes';

export const resaleService = {
  // 1. Subscribe to real-time resale items
  subscribeItems: (category: string | null, callback: (items: ResaleItem[]) => void) => {
    let q = query(
      collection(db, RESALE_COLLECTION), 
      orderBy('createdAt', 'desc')
    );
    
    if (category && category !== 'All') {
      q = query(q, where('category', '==', category));
    }
    
    return onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ResaleItem[];
      callback(items);
    });
  },

  // 2. Register Resale Item
  registerItem: async (itemData: Omit<ResaleItem, 'id' | 'createdAt' | 'likesCount' | 'chatsCount' | 'status'>) => {
    try {
      const docRef = await addDoc(collection(db, RESALE_COLLECTION), {
        ...itemData,
        status: 'active',
        likesCount: 0,
        chatsCount: 0,
        createdAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error("Error registering resale item:", error);
      throw error;
    }
  },

  // 3. Toggle Like (Steam)
  toggleLike: async (userId: string, itemId: string) => {
    const likeId = `${userId}_${itemId}`;
    const likeRef = doc(db, LIKES_COLLECTION, likeId);
    const itemRef = doc(db, RESALE_COLLECTION, itemId);
    
    const likeDoc = await getDoc(likeRef);
    const batch = writeBatch(db);

    if (likeDoc.exists()) {
      batch.delete(likeRef);
      batch.update(itemRef, { likesCount: increment(-1) });
    } else {
      batch.set(likeRef, { userId, itemId, status: 'liked', createdAt: serverTimestamp() });
      batch.update(itemRef, { likesCount: increment(1) });
    }
    
    await batch.commit();
  },

  // 4. Get User Hobby Score
  getUserReputation: async (userId: string): Promise<UserReputation> => {
    const docRef = doc(db, REPUTATION_COLLECTION, userId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data() as UserReputation;
    } else {
      // Initialize if not exists
      const initial: UserReputation = {
        userId,
        hobbyScore: 36.5,
        positiveReviews: 0,
        tradeCount: 0
      };
      await setDoc(docRef, initial);
      return initial;
    }
  },

  // 5. Update Item Status
  updateItemStatus: async (itemId: string, status: 'active' | 'reserved' | 'sold') => {
    const itemRef = doc(db, RESALE_COLLECTION, itemId);
    await updateDoc(itemRef, { status });
  },

  // Get single item
  getItem: async (itemId: string): Promise<ResaleItem | null> => {
    const docRef = doc(db, RESALE_COLLECTION, itemId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return { id: snap.id, ...snap.data() } as ResaleItem;
    }
    return null;
  },

  // Subscribe to My Likes
  subscribeMyLikes: (userId: string, callback: (likes: any[]) => void) => {
    const q = query(
      collection(db, LIKES_COLLECTION),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    return onSnapshot(q, (snapshot) => {
      const likes = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(likes);
    });
  },

  // Clear all likes
  clearAllLikes: async (userId: string) => {
    const q = query(collection(db, LIKES_COLLECTION), where('userId', '==', userId));
    const snapshot = await getDocs(q);
    const batch = writeBatch(db);

    snapshot.docs.forEach((docSnap) => {
      batch.delete(docSnap.ref);
      const data = docSnap.data();
      const itemRef = doc(db, RESALE_COLLECTION, data.itemId);
      batch.update(itemRef, { likesCount: increment(-1) });
    });

    await batch.commit();
  },

  setProductPendingStatus: async (userId: string, itemId: string) => {
    const likeId = `${userId}_${itemId}`;
    const likeRef = doc(db, LIKES_COLLECTION, likeId);
    
    const snap = await getDoc(likeRef);
    if (!snap.exists()) {
      // If not liked, create it directly as pending
      await setDoc(likeRef, {
        userId,
        itemId,
        status: 'pending',
        createdAt: serverTimestamp(),
      });
      const itemRef = doc(db, RESALE_COLLECTION, itemId);
      await updateDoc(itemRef, { likesCount: increment(1) });
    } else {
      await updateDoc(likeRef, { status: 'pending', updatedAt: serverTimestamp() });
    }
  },

  setProductInProgressStatus: async (userId: string, itemId: string) => {
    const likeId = `${userId}_${itemId}`;
    const likeRef = doc(db, LIKES_COLLECTION, likeId);
    
    const snap = await getDoc(likeRef);
    if (!snap.exists()) {
      await setDoc(likeRef, {
        userId,
        itemId,
        status: 'in_progress',
        createdAt: serverTimestamp(),
      });
      const itemRef = doc(db, RESALE_COLLECTION, itemId);
      await updateDoc(itemRef, { likesCount: increment(1) });
    } else {
      await updateDoc(likeRef, { status: 'in_progress', updatedAt: serverTimestamp() });
    }
  }
};
