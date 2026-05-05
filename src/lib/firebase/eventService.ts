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
  deleteDoc,
  setDoc,
  getDoc
} from 'firebase/firestore';
import { Event, EventRegistration } from '@/types/event';

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

  // 2. Subscribe to a single event (real-time)
  subscribeEvent: (eventId: string, callback: (event: Event | null) => void) => {
    const eventRef = doc(db, COLLECTION_NAME, eventId);
    return onSnapshot(eventRef, (snapshot) => {
      if (snapshot.exists()) {
        callback({ id: snapshot.id, ...snapshot.data() } as Event);
      } else {
        callback(null);
      }
    });
  },

  // 3. Create a new event
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

  // 4. Update Event
  updateEvent: async (eventId: string, eventData: Partial<Event>) => {
    try {
      const eventRef = doc(db, COLLECTION_NAME, eventId);
      await updateDoc(eventRef, eventData);
    } catch (error) {
      console.error("Error updating event:", error);
      throw error;
    }
  },

  // 5. Delete Event
  deleteEvent: async (eventId: string) => {
    try {
      const eventRef = doc(db, COLLECTION_NAME, eventId);
      await deleteDoc(eventRef);
    } catch (error) {
      console.error("Error deleting event:", error);
      throw error;
    }
  },

  // 6. Toggle RSVP (Join/Leave)
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

  // 7. Search Events by Title
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

  // 8. Get Upcoming Events
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
  },

  // 9. Like Functionality
  toggleLike: async (userId: string, eventId: string) => {
    const likeRef = doc(db, 'users', userId, 'likedEvents', eventId);
    try {
      const snap = await getDoc(likeRef);
      if (snap.exists()) {
        await deleteDoc(likeRef);
      } else {
        await setDoc(likeRef, { id: eventId, createdAt: serverTimestamp() });
      }
    } catch (e) {
      console.error("Error toggling like:", e);
    }
  },

  subscribeMyLikes: (userId: string, callback: (eventIds: string[]) => void) => {
    const q = collection(db, 'users', userId, 'likedEvents');
    return onSnapshot(q, (snapshot) => {
      callback(snapshot.docs.map(d => d.id));
    });
  },

  // === Registration (서브컬렉션) ===

  // 10. Add Registration
  addRegistration: async (eventId: string, data: Omit<EventRegistration, 'id' | 'registeredAt'>) => {
    const colRef = collection(db, COLLECTION_NAME, eventId, 'registrations');
    return await addDoc(colRef, {
      ...data,
      registeredAt: serverTimestamp()
    });
  },

  // 11. Subscribe to registrations
  subscribeRegistrations: (eventId: string, callback: (regs: EventRegistration[]) => void) => {
    const q = query(
      collection(db, COLLECTION_NAME, eventId, 'registrations'),
      orderBy('registeredAt', 'desc')
    );
    return onSnapshot(q, (snapshot) => {
      const regs = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data()
      })) as EventRegistration[];
      callback(regs);
    });
  },

  // 12. Update registration status
  updateRegistrationStatus: async (eventId: string, regId: string, status: 'confirmed' | 'cancelled') => {
    const regRef = doc(db, COLLECTION_NAME, eventId, 'registrations', regId);
    await updateDoc(regRef, { status });
  },

  // 13. Cancel registration
  cancelRegistration: async (eventId: string, regId: string) => {
    const regRef = doc(db, COLLECTION_NAME, eventId, 'registrations', regId);
    await updateDoc(regRef, { status: 'cancelled' });
  },
};
