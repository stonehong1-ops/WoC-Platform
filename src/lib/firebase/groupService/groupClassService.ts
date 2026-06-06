import { db } from '../clientApp';
import { chatService } from '../chatService';
import {
  collection,
  doc,
  query,
  orderBy,
  onSnapshot,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  Timestamp,
  addDoc,
  updateDoc,
  collectionGroup,
  where,
  writeBatch,
  arrayUnion
} from 'firebase/firestore';
import { GroupClass, ClassDiscount, Group, Member } from '@/types/group';
import { GROUPS_COLLECTION, groupCrudService } from './groupCrudService';

export const groupClassService = {
  // Get single class details
  getClassById: async (groupId: string, classId: string): Promise<GroupClass | null> => {
    try {
      const docRef = doc(db, GROUPS_COLLECTION, groupId, 'classes', classId);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        return { id: snap.id, ...groupCrudService._convertTimestamps(snap.data()) } as GroupClass;
      }
      return null;
    } catch (error) {
      console.error('getClassById error:', error);
      return null;
    }
  },

  // Get single discount details
  getDiscountById: async (groupId: string, discountId: string): Promise<ClassDiscount | null> => {
    try {
      const docRef = doc(db, GROUPS_COLLECTION, groupId, 'discounts', discountId);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        return { id: snap.id, ...groupCrudService._convertTimestamps(snap.data()) } as ClassDiscount;
      }
      return null;
    } catch (error) {
      console.error('getDiscountById error:', error);
      return null;
    }
  },

  // Get all open classes count (classes + bundles across groups)
  getOpenClassesCount: async (): Promise<number> => {
    try {
      const groupsSnap = await getDocs(collection(db, GROUPS_COLLECTION));
      const classCountResults = await Promise.all(
        groupsSnap.docs.map(async groupDoc => {
          const [classSnap, bundleSnap] = await Promise.allSettled([
            getDocs(collection(db, GROUPS_COLLECTION, groupDoc.id, 'classes')),
            getDocs(collection(db, GROUPS_COLLECTION, groupDoc.id, 'bundles')),
          ]);
          return (classSnap.status === 'fulfilled' ? classSnap.value.size : 0)
               + (bundleSnap.status === 'fulfilled' ? bundleSnap.value.size : 0);
        })
      );
      return classCountResults.reduce((sum, c) => sum + c, 0);
    } catch (error) {
      console.error('getOpenClassesCount error:', error);
      return 0;
    }
  },

  // Subscribe to calendar events
  subscribeCalendarEvents: (groupId: string, callback: (events: any[]) => void) => {
    const eventsRef = collection(db, GROUPS_COLLECTION, groupId, 'calendar_events');
    const q = query(eventsRef, orderBy('startDate', 'asc'));

    return onSnapshot(q, (snapshot) => {
      const events = snapshot.docs.map(doc => ({
        id: doc.id,
        ...groupCrudService._convertTimestamps(doc.data())
      }));
      callback(events);
    }, (error) => {
      console.error(`Error subscribing to calendar events for group ${groupId}:`, error);
      callback([]);
    });
  },

  // Add a calendar event
  addCalendarEvent: async (groupId: string, eventData: any) => {
    const eventsRef = collection(db, GROUPS_COLLECTION, groupId, 'calendar_events');
    const docRef = await addDoc(eventsRef, {
      ...eventData,
      createdAt: Timestamp.now()
    });
    return docRef.id;
  },

  // Update a calendar event
  updateCalendarEvent: async (groupId: string, eventId: string, eventData: any) => {
    const eventRef = doc(db, GROUPS_COLLECTION, groupId, 'calendar_events', eventId);
    await updateDoc(eventRef, {
      ...eventData,
      updatedAt: Timestamp.now()
    });
  },

  // Delete a calendar event
  deleteCalendarEvent: async (groupId: string, eventId: string) => {
    const eventRef = doc(db, GROUPS_COLLECTION, groupId, 'calendar_events', eventId);
    await deleteDoc(eventRef);
  },

  // Subscribe to classes
  subscribeClasses: (groupId: string, callback: (classes: GroupClass[]) => void) => {
    const classesRef = collection(db, GROUPS_COLLECTION, groupId, 'classes');
    const q = query(classesRef, orderBy('createdAt', 'desc'));

    return onSnapshot(q, (snapshot) => {
      const classes = snapshot.docs.map(doc => {
        const data = groupCrudService._convertTimestamps(doc.data());
        return {
          ...data,
          id: doc.id
        };
      }) as GroupClass[];
      callback(classes);
    });
  },

  // Add a class
  addClass: async (groupId: string, classData: Partial<GroupClass>) => {
    const classesRef = collection(db, GROUPS_COLLECTION, groupId, 'classes');
    if (classData.id) {
      await setDoc(doc(classesRef, classData.id), {
        ...classData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      return classData.id;
    } else {
      const docRef = await addDoc(classesRef, {
        ...classData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      return docRef.id;
    }
  },

  // Update a class
  updateClass: async (groupId: string, classId: string, classData: Partial<GroupClass>) => {
    const classRef = doc(db, GROUPS_COLLECTION, groupId, 'classes', classId);
    await updateDoc(classRef, {
      ...classData,
      updatedAt: Timestamp.now()
    });
  },

  // Delete a class
  deleteClass: async (groupId: string, classId: string) => {
    const classRef = doc(db, GROUPS_COLLECTION, groupId, 'classes', classId);
    await deleteDoc(classRef);
  },

  // Subscribe to discounts
  subscribeDiscounts: (groupId: string, callback: (discounts: any[]) => void) => {
    const discountsRef = collection(db, GROUPS_COLLECTION, groupId, 'discounts');
    const q = query(discountsRef, orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      callback(snapshot.docs.map(doc => ({ id: doc.id, ...groupCrudService._convertTimestamps(doc.data()) })));
    });
  },

  // Add a discount
  addDiscount: async (groupId: string, discountData: any) => {
    const discountsRef = collection(db, GROUPS_COLLECTION, groupId, 'discounts');
    if (discountData.id) {
      await setDoc(doc(discountsRef, discountData.id), { ...discountData, createdAt: Timestamp.now(), updatedAt: Timestamp.now() });
      return discountData.id;
    } else {
      const docRef = await addDoc(discountsRef, { ...discountData, createdAt: Timestamp.now(), updatedAt: Timestamp.now() });
      return docRef.id;
    }
  },

  // Update a discount
  updateDiscount: async (groupId: string, discountId: string, discountData: any) => {
    const discountRef = doc(db, GROUPS_COLLECTION, groupId, 'discounts', discountId);
    await updateDoc(discountRef, { ...discountData, updatedAt: Timestamp.now() });
  },

  // Delete a discount
  deleteDiscount: async (groupId: string, discountId: string) => {
    await deleteDoc(doc(db, GROUPS_COLLECTION, groupId, 'discounts', discountId));
  },

  // Create a new group
  createGroup: async (groupData: Partial<Group>, userId?: string, memberData?: Omit<Member, 'id'>): Promise<string> => {
    const defaultFunctions = ['feed', 'live', 'calendar', 'class', 'notice', 'about', 'dashboard', 'members', 'brand-setting', 'roles-permissions'];
    const docRef = doc(collection(db, GROUPS_COLLECTION));
    const batch = writeBatch(db);
    
    const initialData: any = {
      ...groupData,
      selectedFunctions: defaultFunctions,
      menuOrder: defaultFunctions.map(id => ({ id, type: 'item' })),
      memberCount: 1,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    if (userId) {
      initialData.memberIds = [userId];
    }

    batch.set(docRef, initialData);

    if (userId) {
      const memberRef = doc(db, GROUPS_COLLECTION, docRef.id, 'members', userId);
      batch.set(memberRef, {
        ...(memberData || {}),
        name: memberData?.name || groupData.representative?.name || 'Owner',
        role: 'owner',
        status: 'active',
        joinedAt: Timestamp.now()
      });

      const userRef = doc(db, 'users', userId);
      batch.update(userRef, {
        joinedGroups: arrayUnion(docRef.id),
      });
    }

    await batch.commit();

    try {
      const joinStrategy = (groupData as any).membershipPolicy?.joinStrategy || 'open';
      await chatService.createGroupChatRoom(docRef.id, groupData.name || docRef.id, userId || 'system1', {
        coverImage: groupData.coverImage,
        description: groupData.description,
        joinStrategy,
      });
    } catch (chatErr) {
      console.error('Failed to create linked group chat room:', chatErr);
    }

    return docRef.id;
  },

  // Get all open classes across all groups
  getGlobalClassesAll: async (): Promise<any[]> => {
    try {
      const q = query(
        collectionGroup(db, 'classes'),
        where('status', '==', 'Open')
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(d => {
        const pathSegments = d.ref.path.split('/');
        const groupId = pathSegments[1] || '';
        return {
          id: d.id,
          groupId,
          ...groupCrudService._convertTimestamps(d.data())
        };
      });
    } catch (error) {
      console.error('getGlobalClassesAll error:', error);
      return [];
    }
  },

  // Get all discounts (bundles) across all groups
  getGlobalDiscountsAll: async (): Promise<any[]> => {
    try {
      const snapshot = await getDocs(collectionGroup(db, 'discounts'));
      return snapshot.docs.map(d => {
        const pathSegments = d.ref.path.split('/');
        const groupId = pathSegments[1] || '';
        return { id: d.id, groupId, ...groupCrudService._convertTimestamps(d.data()) };
      });
    } catch (error) {
      console.error('getGlobalDiscountsAll error:', error);
      return [];
    }
  },

  // Get all classes across all groups happening today
  getGlobalClassesToday: async (): Promise<any[]> => {
    try {
      const now = new Date();
      const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      
      const q = query(
        collectionGroup(db, 'classes'),
        where('status', '==', 'Open')
      );
      
      const snapshot = await getDocs(q);
      const results: any[] = [];
      
      snapshot.docs.forEach(d => {
        const data = d.data();
        const hasToday = data.schedule?.some((s: any) => {
          if (!s.date) return false;
          
          let dStr = '';
          if (typeof s.date === 'string') {
            dStr = s.date.trim();
          } else if (s.date && typeof s.date.toDate === 'function') {
            const dObj = s.date.toDate();
            dStr = `${dObj.getFullYear()}-${String(dObj.getMonth() + 1).padStart(2, '0')}-${String(dObj.getDate()).padStart(2, '0')}`;
          } else if (s.date && s.date.seconds) {
            const dObj = new Date(s.date.seconds * 1000);
            dStr = `${dObj.getFullYear()}-${String(dObj.getMonth() + 1).padStart(2, '0')}-${String(dObj.getDate()).padStart(2, '0')}`;
          }

          if (!dStr) return false;

          const normalizedInput = dStr.replace(/[\.\/]/g, '-');
          const parts = normalizedInput.split('-');
          if (parts.length === 3) {
            const y = parts[0].length === 2 ? `20${parts[0]}` : parts[0];
            const m = parts[1].padStart(2, '0');
            const d = parts[2].padStart(2, '0');
            const finalNormalized = `${y}-${m}-${d}`;
            
            if (finalNormalized === todayStr) return true;
          }

          const digitsOnlyInput = dStr.replace(/\D/g, '');
          const digitsOnlyToday = todayStr.replace(/\D/g, '');
          
          if (digitsOnlyInput.length === 6 && digitsOnlyToday.length === 8) {
            return digitsOnlyToday.endsWith(digitsOnlyInput);
          }

          return digitsOnlyInput === digitsOnlyToday;
        });
        
        if (hasToday) {
          const pathSegments = d.ref.path.split('/');
          const groupId = pathSegments[1] || '';
          results.push({
            id: d.id,
            groupId,
            ...groupCrudService._convertTimestamps(data)
          });
        }
      });
      
      return results;
    } catch (error) {
      console.error('getGlobalClassesToday error:', error);
      return [];
    }
  },

  // Get all special classes across all groups
  getGlobalSpecialClasses: async (): Promise<any[]> => {
    try {
      const q = query(
        collectionGroup(db, 'classes'),
        where('status', '==', 'Open'),
        where('classType', '==', 'special')
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(d => {
        const pathSegments = d.ref.path.split('/');
        const groupId = pathSegments[1] || '';
        return {
          id: d.id,
          groupId,
          ...groupCrudService._convertTimestamps(d.data())
        };
      });
    } catch (error) {
      console.error('getGlobalSpecialClasses error:', error);
      return [];
    }
  }
};
