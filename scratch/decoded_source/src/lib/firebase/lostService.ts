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
  Timestamp,
  getDocs
} from 'firebase/firestore';
import { LostItem } from '@/types/lost';

const LOST_COLLECTION = 'lost_items';

export const lostService = {
  // 1. Subscribe to real-time lost/found items
  subscribeItems: (category: string | null, callback: (items: LostItem[]) => void) => {
    let q = query(
      collection(db, LOST_COLLECTION), 
      orderBy('createdAt', 'desc')
    );
    
    if (category && category !== 'All') {
      q = query(q, where('category', '==', category));
    }
    
    return onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as LostItem[];
      callback(items);
    });
  },

  // 2. Register a new item (Report Lost or Found)
  registerItem: async (itemData: Omit<LostItem, 'id' | 'createdAt' | 'status'>) => {
    try {
      const docRef = await addDoc(collection(db, LOST_COLLECTION), {
        ...itemData,
        status: 'active',
        createdAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error("Error registering lost item:", error);
      throw error;
    }
  },

  // 3. Mark as returned
  markAsReturned: async (itemId: string) => {
    try {
      const docRef = doc(db, LOST_COLLECTION, itemId);
      await updateDoc(docRef, {
        status: 'returned',
        returnedAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error updating item status:", error);
      throw error;
    }
  }
};
