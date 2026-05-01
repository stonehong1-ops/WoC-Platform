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
  Timestamp,
  getDoc,
  getDocs,
  where,
  deleteDoc,
  setDoc,
  increment
} from 'firebase/firestore';
import { LostFoundItem, LostFoundLike, LostFoundStatus, LostFoundType } from '@/types/lostFound';

const LF_COLLECTION = 'lost_found_items';
const LIKES_COLLECTION = 'lost_found_likes';

// Helper: Remove undefined/null fields
function cleanData(obj: any): any {
  if (obj === undefined || obj === null) return obj;
  if (Array.isArray(obj)) return obj.map(item => cleanData(item));
  if (obj instanceof Timestamp) return obj;
  if (typeof obj === 'object' && obj.constructor === Object) {
    const result: any = {};
    for (const key of Object.keys(obj)) {
      if (obj[key] !== undefined && obj[key] !== null) {
        result[key] = cleanData(obj[key]);
      }
    }
    return result;
  }
  return obj;
}

export const lostFoundService = {
  // ===== ITEMS =====

  // Subscribe to all items (with optional filters for type and category)
  subscribeItems: (
    typeFilter: LostFoundType | 'ALL', 
    categoryFilter: string | 'All', 
    callback: (items: LostFoundItem[]) => void
  ) => {
    let q = query(
      collection(db, LF_COLLECTION),
      orderBy('createdAt', 'desc')
    );
    
    return onSnapshot(q, (snapshot) => {
      let items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as LostFoundItem[];
      
      // Client-side filtering (to avoid complex composite index requirements initially)
      if (typeFilter !== 'ALL') {
        items = items.filter(item => item.type === typeFilter);
      }
      if (categoryFilter && categoryFilter !== 'All') {
        items = items.filter(item => item.category === categoryFilter);
      }
      
      callback(items);
    }, (error) => {
      console.error("Error subscribing to lost&found items:", error);
    });
  },

  // Add a new item
  addItem: async (data: Omit<LostFoundItem, 'id' | 'createdAt' | 'updatedAt' | 'likesCount' | 'viewsCount'>) => {
    try {
      const cleaned = cleanData(data);
      const docRef = await addDoc(collection(db, LF_COLLECTION), {
        ...cleaned,
        likesCount: 0,
        viewsCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error("Error adding lost&found item:", error);
      throw error;
    }
  },

  // Update an item
  updateItem: async (itemId: string, updates: Partial<LostFoundItem>) => {
    try {
      const cleaned = cleanData(updates);
      const ref = doc(db, LF_COLLECTION, itemId);
      await updateDoc(ref, {
        ...cleaned,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error updating lost&found item:", error);
      throw error;
    }
  },

  // Delete an item
  deleteItem: async (itemId: string) => {
    try {
      await deleteDoc(doc(db, LF_COLLECTION, itemId));
    } catch (error) {
      console.error("Error deleting lost&found item:", error);
      throw error;
    }
  },

  // Toggle item status (SEARCHING / RESOLVED)
  toggleItemStatus: async (itemId: string, newStatus: LostFoundStatus) => {
    try {
      const ref = doc(db, LF_COLLECTION, itemId);
      await updateDoc(ref, {
        status: newStatus,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error toggling lost&found item status:", error);
      throw error;
    }
  },

  // Get a single item by ID
  getItem: async (itemId: string): Promise<LostFoundItem | null> => {
    try {
      const ref = doc(db, LF_COLLECTION, itemId);
      const snap = await getDoc(ref);
      if (!snap.exists()) return null;
      return { id: snap.id, ...snap.data() } as LostFoundItem;
    } catch (error) {
      console.error('Error getting lost&found item:', error);
      return null;
    }
  },

  // Subscribe to a single item by ID
  subscribeItem: (itemId: string, callback: (item: LostFoundItem | null) => void) => {
    const ref = doc(db, LF_COLLECTION, itemId);
    return onSnapshot(ref, (snap) => {
      if (!snap.exists()) {
        callback(null);
      } else {
        callback({ id: snap.id, ...snap.data() } as LostFoundItem);
      }
    }, (error) => {
      console.error('Error subscribing to lost&found item:', error);
    });
  },

  // Increment view count
  incrementViews: async (itemId: string) => {
    try {
      const ref = doc(db, LF_COLLECTION, itemId);
      await updateDoc(ref, { viewsCount: increment(1) });
    } catch (error) {
      console.error('Error incrementing views:', error);
    }
  },

  // ===== LIKES (WISHLIST) =====

  // Toggle like (관심 등록 토글)
  toggleLike: async (userId: string, itemId: string): Promise<boolean> => {
    const likeId = `${userId}_${itemId}`;
    const likeRef = doc(db, LIKES_COLLECTION, likeId);
    const itemRef = doc(db, LF_COLLECTION, itemId);

    try {
      const likeSnap = await getDoc(likeRef);
      
      if (likeSnap.exists()) {
        await deleteDoc(likeRef);
        await updateDoc(itemRef, { likesCount: increment(-1) });
        return false;
      } else {
        await setDoc(likeRef, {
          userId,
          itemId,
          createdAt: serverTimestamp()
        });
        await updateDoc(itemRef, { likesCount: increment(1) });
        return true;
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      throw error;
    }
  },

  // Subscribe to user's liked items
  subscribeMyLikes: (userId: string, callback: (likes: LostFoundLike[]) => void) => {
    const q = query(
      collection(db, LIKES_COLLECTION),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    return onSnapshot(q, (snapshot) => {
      const likes = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as LostFoundLike[];
      callback(likes);
    }, (error) => {
      console.error('Error subscribing to likes:', error);
    });
  },

  // Clear all likes for a user
  clearAllLikes: async (userId: string) => {
    try {
      const q = query(
        collection(db, LIKES_COLLECTION),
        where('userId', '==', userId)
      );
      const snapshot = await getDocs(q);
      
      const deletePromises = snapshot.docs.map(async (likeDoc) => {
        const likeData = likeDoc.data();
        await deleteDoc(likeDoc.ref);
        const itemRef = doc(db, LF_COLLECTION, likeData.itemId);
        await updateDoc(itemRef, { likesCount: increment(-1) }).catch(() => {});
      });
      
      await Promise.all(deletePromises);
    } catch (error) {
      console.error('Error clearing all likes:', error);
      throw error;
    }
  }
};
