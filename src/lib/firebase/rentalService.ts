import { collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, query, where, orderBy, onSnapshot, serverTimestamp, setDoc, runTransaction } from 'firebase/firestore';
import { db } from './config';
import { RentalSpace, RentalLike, RentalRequest } from '@/types/rental';
import { chatService } from './chatService';

export const rentalService = {
  // --- Rental Spaces ---
  subscribeSpaces: (
    sizeFilter: string | null,
    studioFilter: string | null,
    callback: (spaces: RentalSpace[]) => void
  ) => {
    let q = query(collection(db, 'rental_spaces'), orderBy('createdAt', 'desc'));
    
    // First, let's keep a local cache of groups with rental enabled
    const fetchActiveGroupsAndSpaces = async (snapshotDocs: any[]) => {
      // Fetch all groups to check rental settings and calculate min/max prices
      const groupsSnap = await getDocs(collection(db, 'groups'));
      const activeGroupSettings = new Map<string, any>();
      
      groupsSnap.forEach(doc => {
        const data = doc.data();
        if (data.activeServices?.rental === true) {
          activeGroupSettings.set(doc.id, data.rentalSettings || {});
        }
      });

      let spaces = snapshotDocs.map(doc => {
        const sData = doc.data();
        let minPrice = sData.pricePerHour || 0;
        let maxPrice = sData.pricePerHour || 0;

        if (sData.groupId && activeGroupSettings.has(sData.groupId)) {
          const settings = activeGroupSettings.get(sData.groupId);
          if (settings.pricePalette) {
             const prices = Object.values(settings.pricePalette).filter((p: any) => typeof p === 'number' && p > 0) as number[];
             if (prices.length > 0) {
               minPrice = Math.min(...prices);
               maxPrice = Math.max(...prices);
             }
          }
        }

        return {
          id: doc.id,
          ...sData,
          minPrice,
          maxPrice
        };
      }) as (RentalSpace & { minPrice?: number, maxPrice?: number })[];

      // Filter to only include spaces associated with an active studio group
      spaces = spaces.filter(s => s.groupId && activeGroupSettings.has(s.groupId));

      if (sizeFilter && sizeFilter !== 'All') {
        spaces = spaces.filter(s => s.size === sizeFilter);
      }
      if (studioFilter && studioFilter !== 'All') {
        spaces = spaces.filter(s => (s.studioName || s.location || 'Unknown Studio') === studioFilter);
      }

      callback(spaces);
    };

    return onSnapshot(q, (snapshot) => {
      fetchActiveGroupsAndSpaces(snapshot.docs);
    });
  },

  getSpace: async (id: string): Promise<RentalSpace | null> => {
    const d = await getDoc(doc(db, 'rental_spaces', id));
    if (!d.exists()) return null;
    return { id: d.id, ...d.data() } as RentalSpace;
  },

  addSpace: async (data: Omit<RentalSpace, 'id' | 'createdAt' | 'updatedAt' | 'likesCount'>) => {
    const ref = collection(db, 'rental_spaces');
    const docRef = await addDoc(ref, {
      ...data,
      likesCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return docRef.id;
  },

  updateSpace: async (id: string, data: Partial<RentalSpace>) => {
    const docRef = doc(db, 'rental_spaces', id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp()
    });
  },

  // --- Likes ---
  subscribeMyLikes: (userId: string, callback: (likes: RentalLike[]) => void) => {
    const q = query(collection(db, 'rental_likes'), where('userId', '==', userId));
    return onSnapshot(q, (snapshot) => {
      callback(snapshot.docs.map(doc => doc.data() as RentalLike));
    });
  },

  toggleLike: async (userId: string, spaceId: string) => {
    const likeId = `${userId}_${spaceId}`;
    const likeRef = doc(db, 'rental_likes', likeId);
    const spaceRef = doc(db, 'rental_spaces', spaceId);

    await runTransaction(db, async (transaction) => {
      const likeDoc = await transaction.get(likeRef);
      const spaceDoc = await transaction.get(spaceRef);
      const currentCount = spaceDoc.data()?.likesCount || 0;

      if (likeDoc.exists()) {
        transaction.delete(likeRef);
        transaction.update(spaceRef, { likesCount: Math.max(0, currentCount - 1) });
      } else {
        transaction.set(likeRef, {
          userId,
          spaceId,
          createdAt: serverTimestamp()
        });
        transaction.update(spaceRef, { likesCount: currentCount + 1 });
      }
    });
  },

  clearAllLikes: async (userId: string) => {
    const q = query(collection(db, 'rental_likes'), where('userId', '==', userId));
    const snapshot = await getDocs(q);
    await Promise.all(snapshot.docs.map(d => rentalService.toggleLike(userId, d.data().spaceId)));
  },


  // --- Requests & Negotiation ---
  createRequest: async (data: Omit<RentalRequest, 'id' | 'status' | 'createdAt' | 'chatRoomId'>) => {
    const reqRef = collection(db, 'rental_requests');
    const docRef = await addDoc(reqRef, {
      ...data,
      status: 'PENDING',
      createdAt: serverTimestamp()
    });
    
    // Auto-create chat room or get existing
    let roomId = '';
    try {
       roomId = await chatService.getOrCreatePrivateRoom([data.guestId, data.hostId], data.guestId, 'business');
       
       // Update request with chat room ID
       await updateDoc(doc(db, 'rental_requests', docRef.id), {
         chatRoomId: roomId
       });
       
       // Fetch space details for the message
       const spaceDoc = await getDoc(doc(db, 'rental_spaces', data.spaceId));
       const spaceName = spaceDoc.exists() ? spaceDoc.data().name : 'Unknown Space';

        // Send an automated initial message in the chat
        await chatService.sendMessage({
          roomId,
          senderId: data.guestId,
          senderName: 'Guest',
          type: 'text',
          text: `[Rental Inquiry]\nSpace: ${spaceName}\nDate: ${data.date}\nTime: ${data.startTime} ~ ${data.endTime}\nPurpose: ${data.purpose}\nHeadcount: ${data.headcount} people\n\nMessage: ${data.message}`
        });
    } catch (e) {
       console.error("Failed to create chat room for rental request", e);
    }

    return { requestId: docRef.id, chatRoomId: roomId };
  }
};
