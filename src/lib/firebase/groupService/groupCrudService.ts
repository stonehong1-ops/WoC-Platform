import { db } from '../clientApp';
import {
  collection,
  doc,
  query,
  getDoc,
  getDocs,
  onSnapshot,
  updateDoc,
  Timestamp,
  orderBy
} from 'firebase/firestore';
import { Group, GroupClass, Post, Member } from '@/types/group';
import { reportError } from '@/lib/utils/errorHandler';

export const GROUPS_COLLECTION = 'groups';

// 전역 인메모리 Warm Cache 저장소
export const groupCache = new Map<string, Group>();
export const membersCache = new Map<string, Member[]>();
export const postsCache = new Map<string, Post[]>();
export const classesCache = new Map<string, GroupClass[]>();
export const discountsCache = new Map<string, any[]>();

export const groupCrudService = {
  // Helper to convert Firestore Timestamps to plain numbers
  _convertTimestamps: (data: any): any => {
    if (!data) return data;

    if (typeof data.toMillis === 'function') return data.toMillis();
    if (data.seconds !== undefined && data.nanoseconds !== undefined) {
      return data.seconds * 1000 + Math.floor(data.nanoseconds / 1000000);
    }

    if (data instanceof Date) return data.getTime();

    if (Array.isArray(data)) return data.map(i => groupCrudService._convertTimestamps(i));

    if (typeof data === 'object' && (data.constructor === Object || !data.constructor)) {
      const converted: any = {};
      for (const [key, value] of Object.entries(data)) {
        converted[key] = groupCrudService._convertTimestamps(value);
      }
      return converted;
    }
    return data;
  },

  // Get group by linked venueId
  getGroupByVenueId: async (venueId: string): Promise<Group | null> => {
    try {
      const { limit, where } = await import('firebase/firestore');
      const q = query(collection(db, GROUPS_COLLECTION), where('venueId', '==', venueId), limit(1));
      const snap = await getDocs(q);
      if (!snap.empty) {
        return { id: snap.docs[0].id, ...groupCrudService._convertTimestamps(snap.docs[0].data()) } as Group;
      }
      return null;
    } catch (error) {
      console.error('getGroupByVenueId error:', error);
      return null;
    }
  },

  getCachedGroup: (groupId: string): Group | null => {
    return groupCache.get(groupId) || null;
  },

  registerGroupToCache: (group: Group): void => {
    if (!group || !group.id) return;
    const existing = groupCache.get(group.id);
    groupCache.set(group.id, {
      ...existing,
      ...group,
      members: existing?.members || group.members || [],
      posts: existing?.posts || group.posts || []
    } as Group);
  },

  // Background prefetching engine
  prefetchGroup: async (groupId: string): Promise<void> => {
    if (!groupId) return;
    try {
      const docRef = doc(db, GROUPS_COLLECTION, groupId);
      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        const data = groupCrudService._convertTimestamps(snapshot.data());

        const [classesSnap, discountsSnap] = await Promise.all([
          getDocs(query(collection(db, GROUPS_COLLECTION, groupId, 'classes'), orderBy('createdAt', 'desc'))),
          getDocs(query(collection(db, GROUPS_COLLECTION, groupId, 'discounts'), orderBy('createdAt', 'desc')))
        ]);

        const subClasses = classesSnap.docs.map(d => ({ ...groupCrudService._convertTimestamps(d.data()), id: d.id })) as GroupClass[];
        const subDiscounts = discountsSnap.docs.map(d => ({ id: d.id, ...groupCrudService._convertTimestamps(d.data()) }));

        const groupObj = {
          id: snapshot.id,
          ...data,
          classes: [...subClasses, ...(data.classes || [])],
          discounts: [...subDiscounts, ...(data.discounts || [])],
          _legacyClasses: data.classes || [],
          _legacyDiscounts: data.discounts || [],
          members: [],
          memberCount: typeof data.memberCount === 'number' ? data.memberCount : 0,
        } as Group;

        const existing = groupCache.get(groupId);
        groupCache.set(groupId, { ...existing, ...groupObj } as Group);
        classesCache.set(groupId, subClasses);
        discountsCache.set(groupId, subDiscounts);
      }

      const membersRef = collection(db, GROUPS_COLLECTION, groupId, 'members');
      const snapshotMembers = await getDocs(query(membersRef));
      const members = snapshotMembers.docs.map(doc => ({
        id: doc.id,
        ...groupCrudService._convertTimestamps(doc.data())
      })) as Member[];
      
      membersCache.set(groupId, members);
    } catch (e) {
      console.error(`[Warm Cache] Prefetch failed for group ${groupId}:`, e);
    }
  },

  // Subscribe to group metadata
  subscribeGroup: (groupId: string, callback: (group: Group | null) => void, errorCallback?: (error: any) => void) => {
    const docRef = doc(db, GROUPS_COLLECTION, groupId);

    return onSnapshot(docRef, async (snapshot) => {
      if (!snapshot.exists()) {
        callback(null);
        return;
      }

      const rawData = snapshot.data();
      if (!rawData) return;
      const data = groupCrudService._convertTimestamps(rawData);

      const groupObj = {
        id: snapshot.id,
        ...data,
        members: [],
        memberCount: typeof data.memberCount === 'number' ? data.memberCount : 0,
        posts: []
      } as Group;

      const existing = groupCache.get(groupId);
      const merged = { ...existing, ...groupObj } as Group;
      groupCache.set(groupId, merged);

      callback(merged);
    }, (error) => {
      console.error(`Error subscribing to group metadata for ${groupId}:`, error);
      if (errorCallback) errorCallback(error);
    });
  },

  // Get all communities
  getGroups: async (): Promise<Group[]> => {
    try {
      const q = query(collection(db, GROUPS_COLLECTION));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => {
        const data = groupCrudService._convertTimestamps(doc.data());
        return {
          id: doc.id,
          ...data,
          members: [],
          memberCount: typeof data.memberCount === 'number' ? data.memberCount : 0,
          posts: []
        } as Group;
      });
    } catch (error) {
      await reportError(error, 'groupService.getGroups');
      return [];
    }
  },

  // Get group data once
  getGroup: async (groupId: string): Promise<Group | null> => {
    try {
      const docRef = doc(db, GROUPS_COLLECTION, groupId);
      const snapshot = await getDoc(docRef);

      if (!snapshot.exists()) return null;

      const data = groupCrudService._convertTimestamps(snapshot.data());

      const { limit } = await import('firebase/firestore');
      const [postsSnap, classesSnap, discountsSnap] = await Promise.all([
        getDocs(query(collection(db, GROUPS_COLLECTION, groupId, 'posts'), orderBy('createdAt', 'desc'), limit(20))),
        getDocs(query(collection(db, GROUPS_COLLECTION, groupId, 'classes'), orderBy('createdAt', 'desc'))),
        getDocs(query(collection(db, GROUPS_COLLECTION, groupId, 'discounts'), orderBy('createdAt', 'desc')))
      ]);

      const posts = postsSnap.docs.map(d => ({ id: d.id, ...groupCrudService._convertTimestamps(d.data()) })) as Post[];
      const subClasses = classesSnap.docs.map(d => ({ ...groupCrudService._convertTimestamps(d.data()), id: d.id })) as GroupClass[];
      const subDiscounts = discountsSnap.docs.map(d => ({ id: d.id, ...groupCrudService._convertTimestamps(d.data()) }));

      const groupObj = {
        id: snapshot.id,
        ...data,
        classes: [...subClasses, ...(data.classes || [])],
        discounts: [...subDiscounts, ...(data.discounts || [])],
        _legacyClasses: data.classes || [],
        _legacyDiscounts: data.discounts || [],
        members: [],
        memberCount: typeof data?.memberCount === 'number' ? data?.memberCount : 0,
        posts
      } as Group;

      groupCache.set(groupId, groupObj);
      postsCache.set(groupId, posts);
      classesCache.set(groupId, subClasses);
      discountsCache.set(groupId, subDiscounts);

      return groupObj;
    } catch (error) {
      await reportError(error, 'groupService.getGroup');
      return null;
    }
  },

  // Update group metadata
  updateGroupMetadata: async (groupId: string, data: Partial<Group>) => {
    const groupRef = doc(db, GROUPS_COLLECTION, groupId);
    const { id, members, posts, ...cleanData } = data as any;
    await updateDoc(groupRef, {
      ...cleanData,
      updatedAt: Timestamp.now()
    });
  },

  // Publish group
  publishGroup: async (groupId: string): Promise<void> => {
    const docRef = doc(db, GROUPS_COLLECTION, groupId);
    await updateDoc(docRef, {
      isPublished: true,
      updatedAt: Timestamp.now(),
    });
  }
};
