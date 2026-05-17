import { db } from '@/lib/firebase/clientApp';
import { collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, query, orderBy, limit, startAfter, QueryDocumentSnapshot, DocumentData, where } from 'firebase/firestore';
import { Pic } from '@/types/pic';

const COLLECTION_NAME = 'scenes';

export interface GetPicsOptions {
  limitCount?: number;
  lastDoc?: QueryDocumentSnapshot<DocumentData> | null;
  filters?: {
    mood?: string;
    activity?: string;
    season?: string;
    timeOfDay?: string;
  };
}

export interface GetPicsResponse {
  pics: Pic[];
  lastDoc: QueryDocumentSnapshot<DocumentData> | null;
  hasMore: boolean;
}

export const picService = {
  async getPics(): Promise<Pic[]> {
    const q = query(collection(db, COLLECTION_NAME), orderBy('sortOrder', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Pic));
  },

  async getPicsPaginated(options: GetPicsOptions = {}): Promise<GetPicsResponse> {
    const limitCount = options.limitCount || 20;
    
    let constraints: any[] = [];
    
    if (options.filters?.mood && options.filters.mood !== 'All') {
      constraints.push(where('mood', '==', options.filters.mood));
    }
    if (options.filters?.activity && options.filters.activity !== 'All') {
      constraints.push(where('activity', '==', options.filters.activity));
    }
    if (options.filters?.season && options.filters.season !== 'All') {
      constraints.push(where('season', '==', options.filters.season));
    }
    if (options.filters?.timeOfDay && options.filters.timeOfDay !== 'All') {
      constraints.push(where('timeOfDay', '==', options.filters.timeOfDay));
    }

    constraints.push(orderBy('sortOrder', 'asc'));

    if (options.lastDoc) {
      constraints.push(startAfter(options.lastDoc));
    }
    
    constraints.push(limit(limitCount + 1));

    const q = query(collection(db, COLLECTION_NAME), ...constraints);
    const snapshot = await getDocs(q);

    const docs = snapshot.docs;
    const hasMore = docs.length > limitCount;
    
    const resultDocs = hasMore ? docs.slice(0, -1) : docs;
    const lastVisible = resultDocs.length > 0 ? resultDocs[resultDocs.length - 1] : null;

    return {
      pics: resultDocs.map(doc => ({ id: doc.id, ...doc.data() } as Pic)),
      lastDoc: lastVisible,
      hasMore
    };
  },

  async getPic(id: string): Promise<Pic | null> {
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Pic;
    }
    return null;
  },

  async createPic(picData: Omit<Pic, 'id' | 'createdAt' | 'updatedAt'>, customId?: string): Promise<string> {
    const now = Date.now();
    let docRef;
    if (customId) {
      docRef = doc(db, COLLECTION_NAME, customId);
    } else {
      docRef = doc(collection(db, COLLECTION_NAME));
    }
    
    const newPic: Pic = {
      ...picData,
      id: docRef.id,
      createdAt: now,
      updatedAt: now,
    };
    
    await setDoc(docRef, newPic);
    return docRef.id;
  },

  async updatePic(id: string, updates: Partial<Omit<Pic, 'id' | 'createdAt' | 'updatedAt'>>): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: Date.now()
    });
  },

  async deletePic(id: string): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
  }
};
