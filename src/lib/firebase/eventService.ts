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
  where,
  limit,
  deleteDoc
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
  },

  // Update Event
  updateEvent: async (eventId: string, eventData: Partial<Event>) => {
    try {
      const eventRef = doc(db, COLLECTION_NAME, eventId);
      await updateDoc(eventRef, eventData);
    } catch (error) {
      console.error("Error updating event:", error);
      throw error;
    }
  },

  // Delete Event
  deleteEvent: async (eventId: string) => {
    try {
      const eventRef = doc(db, COLLECTION_NAME, eventId);
      await deleteDoc(eventRef);
    } catch (error) {
      console.error("Error deleting event:", error);
      throw error;
    }
  },

  // 4. Search Events by Title
  async searchEvents(keyword: string) {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('title', '>=', keyword),
      where('title', '<=', keyword + '\uf8ff')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Event[];
  },

  // 5. Get Upcoming Events
  getUpcomingEvents: async (limitCount: number = 3) => {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('startDate', '>=', Timestamp.now()),
      orderBy('startDate', 'asc'),
      limit(limitCount)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Event[];
  }
};
