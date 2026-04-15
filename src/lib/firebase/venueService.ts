import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  onSnapshot, 
  query, 
  orderBy,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './clientApp';

export interface Venue {
  id?: string;
  name: string;
  nameNative?: string;
  category: string;
  owner: string;
  isRepresentative?: boolean;
  contact: string;
  address: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  rating?: number;
  price?: string;
  imageUrl?: string;
  createdAt?: any;
  updatedAt?: any;
}

const COLLECTION_NAME = 'venues';

export const venueService = {
  // Add a new venue
  async addVenue(venue: Omit<Venue, 'id' | 'createdAt' | 'updatedAt'>) {
    try {
      const docRef = await addDoc(collection(db, COLLECTION_NAME), {
        ...venue,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error adding venue: ', error);
      throw error;
    }
  },

  // Update an existing venue
  async updateVenue(id: string, venue: Partial<Venue>) {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      await updateDoc(docRef, {
        ...venue,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating venue: ', error);
      throw error;
    }
  },

  // Delete a venue
  async deleteVenue(id: string) {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting venue: ', error);
      throw error;
    }
  },

  // Get all venues with real-time updates
  subscribeVenues(callback: (venues: Venue[]) => void) {
    const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const venues = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Venue[];
      callback(venues);
    });
  }
};
