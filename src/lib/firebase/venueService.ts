import { db } from './config';
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  Timestamp,
  doc,
  setDoc,
  writeBatch
} from 'firebase/firestore';
import { Venue } from '@/types/venue';

const VENUES_COLLECTION = 'venues';

export const venueService = {
  // 1. Single Registration
  async addVenue(venue: Omit<Venue, 'id' | 'createdAt'>) {
    const docRef = await addDoc(collection(db, VENUES_COLLECTION), {
      ...venue,
      createdAt: Timestamp.now(),
    });
    return docRef.id;
  },

  // 2. Batch Registration (For Seed Data)
  async batchAddVenues(venues: Omit<Venue, 'id' | 'createdAt'>[]) {
    const batch = writeBatch(db);
    venues.forEach((v) => {
      const docRef = doc(collection(db, VENUES_COLLECTION));
      batch.set(docRef, {
        ...v,
        createdAt: Timestamp.now(),
      });
    });
    await batch.commit();
  },

  // 3. Get All Venues (Real-time)
  subscribeVenues(callback: (venues: Venue[]) => void) {
    const q = query(collection(db, VENUES_COLLECTION), orderBy('name', 'asc'));
    return onSnapshot(q, (snapshot) => {
      const venues = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Venue[];
      callback(venues);
    });
  },

  // 4. Search Venues by Name
  async searchVenues(keyword: string) {
    const q = query(
      collection(db, VENUES_COLLECTION),
      where('name', '>=', keyword),
      where('name', '<=', keyword + '\uf8ff')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Venue[];
  },

  // 5. Update Venue
  async updateVenue(id: string, venue: Partial<Omit<Venue, 'id' | 'createdAt'>>) {
    const docRef = doc(db, VENUES_COLLECTION, id);
    await setDoc(docRef, { ...venue }, { merge: true });
  },

  // 6. Delete Venue
  async deleteVenue(id: string) {
    const docRef = doc(db, VENUES_COLLECTION, id);
    await setDoc(docRef, { status: 'inactive' }, { merge: true }); // Soft delete for safety
  }
};
