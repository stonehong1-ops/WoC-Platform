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
import { Stay, Booking } from '@/types/stay';

const STAYS_COLLECTION = 'stays';
const BOOKINGS_COLLECTION = 'bookings';

export const stayService = {
  // 1. Subscribe to real-time stays
  subscribeStays: (filters: { type?: string; maxPrice?: number } | null, callback: (stays: Stay[]) => void) => {
    let q = query(
      collection(db, STAYS_COLLECTION), 
      orderBy('createdAt', 'desc')
    );
    
    if (filters?.type && filters.type !== 'All') {
      q = query(q, where('type', '==', filters.type));
    }
    
    return onSnapshot(q, (snapshot) => {
      const stays = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Stay[];
      callback(stays);
    });
  },

  // 2. Register a new stay
  registerStay: async (stayData: Omit<Stay, 'id' | 'createdAt'>) => {
    try {
      const docRef = await addDoc(collection(db, STAYS_COLLECTION), {
        ...stayData,
        createdAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error("Error registering stay:", error);
      throw error;
    }
  },

  // 3. Create a booking
  createBooking: async (bookingData: Omit<Booking, 'id' | 'createdAt' | 'status'>) => {
    try {
      const docRef = await addDoc(collection(db, BOOKINGS_COLLECTION), {
        ...bookingData,
        status: 'pending',
        createdAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error("Error creating booking:", error);
      throw error;
    }
  },

  // 4. Check availability (Logic from FreestyleTango)
  checkAvailability: async (stayId: string, checkIn: Date, checkOut: Date) => {
    const q = query(
      collection(db, BOOKINGS_COLLECTION),
      where('stayId', '==', stayId),
      where('status', 'not-in', ['cancelled'])
    );
    
    const snapshot = await getDocs(q);
    const existingBookings = snapshot.docs.map(doc => doc.data() as Booking);
    
    // Check for overlaps
    const overlaps = existingBookings.some(b => {
      const bIn = b.checkIn.toDate();
      const bOut = b.checkOut.toDate();
      return (checkIn < bOut && checkOut > bIn);
    });
    
    return !overlaps;
  }
};
