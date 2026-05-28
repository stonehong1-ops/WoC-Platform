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
  serverTimestamp,
  writeBatch,
  setDoc,
  increment
} from 'firebase/firestore';
import { Social, SocialType, SocialReservation, SocialWeeklyState } from '@/types/social';
import { notificationService } from './notificationService';

const SOCIALS_COLLECTION = 'socials';
const LIKES_COLLECTION = 'social_likes';

export const socialService = {
  // Get active socials for today (regular by dayOfWeek, popup by date)
  getTodayActiveSocials: async (dayOfWeek: number, todayDate: Date): Promise<Social[]> => {
    try {
      // 1. Regular socials
      const regularSnap = await getDocs(
        query(collection(db, SOCIALS_COLLECTION), where('type', '==', 'regular'))
      );
      const allRegular = regularSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Social[];
      const todayRegular = allRegular.filter(s => Number(s.dayOfWeek) === dayOfWeek);

      // 2. Popup socials
      const popupSnap = await getDocs(
        query(collection(db, SOCIALS_COLLECTION), where('type', '==', 'popup'))
      );
      const allPopup = popupSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Social[];
      const todayPopup = allPopup.filter(s => {
        if (!s.date) return false;
        const sDate = typeof s.date.toDate === 'function' ? s.date.toDate() : new Date((s.date as any).seconds * 1000);
        return sDate.toDateString() === todayDate.toDateString();
      });

      return [...todayRegular, ...todayPopup];
    } catch (error) {
      console.error("Error in getTodayActiveSocials:", error);
      return [];
    }
  },

  // 1-0. Subscribe to all socials (for unified list)
  subscribeAllSocials: (callback: (socials: Social[]) => void) => {
    const q = query(collection(db, SOCIALS_COLLECTION));
    return onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Social[];
      
      docs.sort((a, b) => {
        const tA = a.createdAt ? (typeof a.createdAt.toMillis === 'function' ? a.createdAt.toMillis() : 0) : 0;
        const tB = b.createdAt ? (typeof b.createdAt.toMillis === 'function' ? b.createdAt.toMillis() : 0) : 0;
        return tB - tA;
      });
      callback(docs);
    });
  },

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

  // 1-1. Subscribe to socials by venueId
  subscribeSocialsByVenue: (venueId: string, callback: (socials: Social[]) => void) => {
    const q = query(
      collection(db, SOCIALS_COLLECTION),
      where('venueId', '==', venueId)
    );
    
    return onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Social[];
      
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

  // Subscribe to single social event
  subscribeSocial: (id: string, callback: (social: Social | null) => void) => {
    const docRef = doc(db, SOCIALS_COLLECTION, id);
    return onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        callback({ id: docSnap.id, ...docSnap.data() } as Social);
      } else {
        callback(null);
      }
    }, (error) => {
      console.error("Error subscribing to social:", error);
    });
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
    if (!keyword) return [];
    const lowerKw = keyword.toLowerCase();
    const snapshot = await getDocs(collection(db, SOCIALS_COLLECTION));
    return snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() } as any))
      .filter(s => {
        const title = (s.title || '').toLowerCase();
        const native = (s.titleNative || '').toLowerCase();
        return title.includes(lowerKw) || native.includes(lowerKw);
      });
  },

  // 8. Add Reservation
  async addReservation(socialId: string, data: Omit<SocialReservation, 'id' | 'socialId' | 'createdAt'>) {
    const docRef = doc(collection(db, `${SOCIALS_COLLECTION}/${socialId}/reservations`));
    const batch = writeBatch(db);

    batch.set(docRef, {
      ...data,
      socialId,
      createdAt: serverTimestamp(),
    });

    const socialSnap = await getDoc(doc(db, SOCIALS_COLLECTION, socialId));
    if (socialSnap.exists()) {
      const social = socialSnap.data() as Social;

      // User Notification & Organizer Todo Notification (Disabled as per Stone's request - handled via Chat)
      /*
      await notificationService.createNotification({
        targetUserId: data.userId,
        type: 'SOCIAL_RESERVATION',
        title: 'Social Event Reservation Received',
        message: `'${social.title}' reservation has been successfully received.`,
        actionUrl: `/history`, // Route to user history
        referenceId: docRef.id,
        category: 'SOCIAL'
      }, batch);

      if (social.organizerId) {
        await notificationService.createTodo({
          targetUserId: social.organizerId,
          type: 'SOCIAL_RESERVATION_ADMIN',
          title: 'New Reservation Received',
          message: `${data.userName} has reserved for '${social.title}'.`,
          actionUrl: `/social/${socialId}`, 
          referenceId: docRef.id,
          category: 'SOCIAL'
        }, batch);
      }
      */
    }

    await batch.commit();
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

    if (status === 'approved' || status === 'rejected') {
      await notificationService.markTodosAsCompletedByReference(reservationId);
    }
  },

  // ===== LIKES (FAVORITES) =====

  // Toggle like (찜 토글) — atomic transaction
  toggleLike: async (userId: string, socialId: string): Promise<boolean> => {
    const likeId = `${userId}_${socialId}`;
    const likeRef = doc(db, LIKES_COLLECTION, likeId);
    const socialRef = doc(db, SOCIALS_COLLECTION, socialId);

    try {
      const likeSnap = await getDoc(likeRef);
      
      if (likeSnap.exists()) {
        await deleteDoc(likeRef);
        await updateDoc(socialRef, { likesCount: increment(-1) }).catch(() => {});
        return false;
      } else {
        await setDoc(likeRef, {
          id: likeId,
          userId,
          socialId,
          status: 'liked',
          createdAt: serverTimestamp()
        });
        await updateDoc(socialRef, { likesCount: increment(1) }).catch(() => {});
        return true;
      }
    } catch (error) {
      console.error('Error toggling social like:', error);
      throw error;
    }
  },

  // Update like status (liked -> pending -> in_progress)
  updateLikeStatus: async (userId: string, socialId: string, status: 'liked' | 'pending' | 'in_progress') => {
    const likeId = `${userId}_${socialId}`;
    const likeRef = doc(db, LIKES_COLLECTION, likeId);
    try {
      const snap = await getDoc(likeRef);
      if (snap.exists()) {
        await updateDoc(likeRef, { status, updatedAt: serverTimestamp() });
      }
    } catch (error) {
      console.error('Error updating social like status:', error);
    }
  },

  // Subscribe to user's liked socials (Full objects)
  subscribeMyLikes: (userId: string, callback: (likes: import('@/types/social').SocialLike[]) => void) => {
    const q = query(
      collection(db, LIKES_COLLECTION),
      where('userId', '==', userId)
    );
    return onSnapshot(q, (snapshot) => {
      const likes = snapshot.docs.map(doc => doc.data() as import('@/types/social').SocialLike);
      callback(likes);
    }, (error) => {
      console.error('Error subscribing to social likes:', error);
    });
  },

  // ===== WEEKLY RESERVATION MANAGEMENT =====

  // Subscribe to reservations for a specific week date
  subscribeWeekReservations: (socialId: string, weekStartDate: string, callback: (reservations: SocialReservation[]) => void) => {
    const q = query(
      collection(db, `${SOCIALS_COLLECTION}/${socialId}/reservations`),
      where('weekStartDate', '==', weekStartDate)
    );
    return onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data()
      })) as SocialReservation[];
      docs.sort((a, b) => {
        const tA = a.createdAt ? (typeof a.createdAt.toMillis === 'function' ? a.createdAt.toMillis() : 0) : 0;
        const tB = b.createdAt ? (typeof b.createdAt.toMillis === 'function' ? b.createdAt.toMillis() : 0) : 0;
        return tB - tA;
      });
      callback(docs);
    });
  },

  // Get weekly state (open/closed) for a specific date
  async getWeeklyState(socialId: string, weekStartDate: string): Promise<SocialWeeklyState | null> {
    const stateId = `${socialId}_${weekStartDate}`;
    const stateRef = doc(db, 'social_weekly_states', stateId);
    const snap = await getDoc(stateRef);
    if (snap.exists()) {
      return { id: snap.id, ...snap.data() } as SocialWeeklyState;
    }
    return null;
  },

  // Subscribe to weekly state (real-time)
  subscribeWeeklyState: (socialId: string, weekStartDate: string, callback: (state: SocialWeeklyState | null) => void) => {
    const stateId = `${socialId}_${weekStartDate}`;
    const stateRef = doc(db, 'social_weekly_states', stateId);
    return onSnapshot(stateRef, (snap) => {
      if (snap.exists()) {
        callback({ id: snap.id, ...snap.data() } as SocialWeeklyState);
      } else {
        callback(null);
      }
    });
  },

  // Org: close or reopen table for a specific week
  async setWeekClosed(socialId: string, weekStartDate: string, isClosed: boolean, userId: string) {
    const stateId = `${socialId}_${weekStartDate}`;
    const stateRef = doc(db, 'social_weekly_states', stateId);
    await setDoc(stateRef, {
      socialId,
      weekStartDate,
      isClosed,
      closedAt: isClosed ? serverTimestamp() : null,
      closedBy: isClosed ? userId : null,
    }, { merge: true });
  },

  // Get venue details by venueId (for address / map link)
  async getVenueDetails(venueId: string): Promise<any> {
    if (!venueId) return null;
    try {
      const venueRef = doc(db, 'venues', venueId);
      const snap = await getDoc(venueRef);
      if (snap.exists()) {
        return { id: snap.id, ...snap.data() };
      }
      return null;
    } catch (error) {
      console.error('Error getting venue details:', error);
      return null;
    }
  },

  // Claim ownership of a social
  claimSocial: async (socialId: string, newOrganizer: { uid: string; displayName: string; nativeNickname?: string }, claimedByUid: string) => {
    const ref = doc(db, SOCIALS_COLLECTION, socialId);
    await updateDoc(ref, {
      organizerId: newOrganizer.uid,
      organizerName: newOrganizer.displayName,
      organizerNameNative: newOrganizer.nativeNickname || '',
      claimedAt: serverTimestamp(),
      claimedBy: claimedByUid,
    });
  },
};
