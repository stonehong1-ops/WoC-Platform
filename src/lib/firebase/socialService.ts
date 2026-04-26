import { db } from './clientApp';
import { 
  collection, 
  query, 
  onSnapshot, 
  where,
  Timestamp,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
  serverTimestamp
} from 'firebase/firestore';
import { Social, SocialType } from '@/types/social';

const SOCIALS_COLLECTION = 'socials';

export const socialService = {
  // 1. Subscribe to specific type of socials (Regular or Popup)
  // NOTE: orderBy 제거 — where + orderBy 복합 인덱스 불필요. 정렬은 클라이언트에서 처리.
  subscribeSocials: (type: SocialType, callback: (socials: Social[]) => void) => {
    const q = query(
      collection(db, SOCIALS_COLLECTION),
      where('type', '==', type)
    );
    
    return onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Social[];
      // 클라이언트 정렬
      docs.sort((a, b) => {
        const tA = a.createdAt ? (typeof a.createdAt.toMillis === 'function' ? a.createdAt.toMillis() : 0) : 0;
        const tB = b.createdAt ? (typeof b.createdAt.toMillis === 'function' ? b.createdAt.toMillis() : 0) : 0;
        return tB - tA;
      });
      callback(docs);
    });
  },

  // 2. Subscribe to socials for a specific day or date
  subscribeDailySocials: (day: number, date?: Date, callback?: (socials: Social[]) => void) => {
    const q = query(
      collection(db, SOCIALS_COLLECTION)
    );

    return onSnapshot(q, (snapshot) => {
      const all = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Social[];
      
      const filtered = all.filter(s => {
        const typeStr = String(s.type || '').toLowerCase();
        const isRegular = typeStr === 'regular';
        const isPopup = typeStr === 'popup';

        if (isRegular) {
            return s.dayOfWeek !== undefined && Number(s.dayOfWeek) === Number(day);
        }
        if (isPopup && date && s.date) {
            const sDate = typeof s.date.toDate === 'function' ? s.date.toDate() : new Date(s.date as any);
            return sDate.toDateString() === date.toDateString();
        }
        return false;
      });
      
      callback?.(filtered);
    });
  },

  // 3. Get single social event
  getSocialById: async (id: string): Promise<Social | null> => {
    try {
      const docRef = doc(db, SOCIALS_COLLECTION, id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Social;
      }
      return null;
    } catch (error) {
      console.error("Error getting social:", error);
      return null;
    }
  },

  // 3. Admin: Create a new social event
  async saveSocial(data: Omit<Social, 'id' | 'createdAt'>) {
    const docRef = await addDoc(collection(db, SOCIALS_COLLECTION), {
      ...data,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  },

  // 4. Update existing social
  async updateSocial(id: string, data: Partial<Omit<Social, 'id' | 'createdAt'>>) {
    await updateDoc(doc(db, SOCIALS_COLLECTION, id), {
      ...data,
      updatedAt: serverTimestamp(),
    });
  },

  // 5. Delete social
  async deleteSocial(id: string) {
    await deleteDoc(doc(db, SOCIALS_COLLECTION, id));
  },

  // 6. Get list of Organizers/Venues for Filter
  getFilterOptions: async () => {
    const q = query(collection(db, SOCIALS_COLLECTION));
    const snapshot = await getDocs(q);
    const data = snapshot.docs.map(d => d.data() as Social);
    
    const organizers = Array.from(new Set(data.map(s => s.organizerName)));
    const venues = Array.from(new Set(data.map(s => s.venueName)));
    
    return { organizers, venues };
  },

  // 7. Search Socials by Title
  async searchSocials(keyword: string) {
    const q = query(
      collection(db, SOCIALS_COLLECTION),
      where('title', '>=', keyword),
      where('title', '<=', keyword + '\uf8ff')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as any[];
  },

  // 8. Add Reservation
  async addReservation(socialId: string, data: Omit<import('@/types/social').SocialReservation, 'id' | 'socialId' | 'createdAt'>) {
    const docRef = await addDoc(collection(db, `${SOCIALS_COLLECTION}/${socialId}/reservations`), {
      ...data,
      socialId,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  },

  // 9. Subscribe to Reservations
  subscribeReservations: (socialId: string, callback: (reservations: import('@/types/social').SocialReservation[]) => void) => {
    const q = query(collection(db, `${SOCIALS_COLLECTION}/${socialId}/reservations`));
    return onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as import('@/types/social').SocialReservation[];
      
      // Sort by creation time descending
      docs.sort((a, b) => {
        const tA = a.createdAt ? (typeof a.createdAt.toMillis === 'function' ? a.createdAt.toMillis() : 0) : 0;
        const tB = b.createdAt ? (typeof b.createdAt.toMillis === 'function' ? b.createdAt.toMillis() : 0) : 0;
        return tB - tA;
      });
      callback(docs);
    });
  },

  // 10. Update Reservation Status
  async updateReservationStatus(socialId: string, reservationId: string, status: 'pending' | 'approved' | 'rejected') {
    await updateDoc(doc(db, `${SOCIALS_COLLECTION}/${socialId}/reservations`, reservationId), {
      status,
      updatedAt: serverTimestamp(),
    });
  }
};
