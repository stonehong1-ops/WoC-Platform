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
  arrayUnion,
  arrayRemove,
  Timestamp,
  getDocs,
  where
} from 'firebase/firestore';
import { Event } from '@/types/event';

const COLLECTION_NAME = 'events';

export const eventService = {
  // 1. Subscribe to all events
  subscribeEvents: (callback: (events: Event[]) => void) => {
    const q = query(
      collection(db, COLLECTION_NAME), 
      orderBy('startDate', 'asc')
    );
    
    return onSnapshot(q, (snapshot) => {
      const events = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Event[];
      callback(events);
    });
  },

  // 2. Create a new event
  createEvent: async (eventData: Omit<Event, 'id' | 'createdAt' | 'participants'>) => {
    try {
      const docRef = await addDoc(collection(db, COLLECTION_NAME), {
        ...eventData,
        participants: [eventData.hostId], // Host is the first participant
        createdAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error("Error creating event:", error);
      throw error;
    }
  },

  // 3. Toggle RSVP (Join/Leave)
  toggleRSVP: async (eventId: string, userId: string, isJoining: boolean) => {
    try {
      const eventRef = doc(db, COLLECTION_NAME, eventId);
      await updateDoc(eventRef, {
        participants: isJoining ? arrayUnion(userId) : arrayRemove(userId)
      });
    } catch (error) {
      console.error("Error toggling RSVP:", error);
      throw error;
    }
  }
};
