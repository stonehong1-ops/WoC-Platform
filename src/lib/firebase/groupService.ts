import { db } from './clientApp';
import { 
  collection, 
  doc,
  query, 
  orderBy, 
  onSnapshot, 
  getDoc,
  getDocs,
  Timestamp,
  addDoc,
  updateDoc,
  increment,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import { Group, Post, Member } from '@/types/group';

const GROUPS_COLLECTION = 'groups';

export const groupService = {
  // Helper to convert Firestore Timestamps to plain numbers
  _convertTimestamps: (data: any): any => {
    if (!data) return data;
    
    // Handle Firestore Timestamp specifically
    if (typeof data.toMillis === 'function') return data.toMillis();
    if (data.seconds !== undefined && data.nanoseconds !== undefined) {
      return data.seconds * 1000 + Math.floor(data.nanoseconds / 1000000);
    }
    
    // Handle Date object
    if (data instanceof Date) return data.getTime();

    if (Array.isArray(data)) return data.map(i => groupService._convertTimestamps(i));
    
    if (typeof data === 'object' && (data.constructor === Object || !data.constructor)) {
      const converted: any = {};
      for (const [key, value] of Object.entries(data)) {
        converted[key] = groupService._convertTimestamps(value);
      }
      return converted;
    }
    return data;
  },

  // Subscribe to group metadata
  subscribeGroup: (groupId: string, callback: (group: Group | null) => void) => {
    const docRef = doc(db, GROUPS_COLLECTION, groupId);
    
    return onSnapshot(docRef, async (snapshot) => {
      if (!snapshot.exists()) {
        callback(null);
        return;
      }
      
      const rawData = snapshot.data();
      if (!rawData) return;
      const data = groupService._convertTimestamps(rawData);
      
      // Initially set without posts (we'll fetch posts separately)
      callback({
        id: snapshot.id,
        ...data,
        members: Array.isArray(data.members) ? data.members : [],
        memberCount: typeof data.memberCount === 'number' ? data.memberCount : 0,
        posts: []
      } as Group);
    });
  },

  // Subscribe to group posts
  subscribePosts: (groupId: string, callback: (posts: Post[]) => void) => {
    const postsRef = collection(db, GROUPS_COLLECTION, groupId, 'posts');
    const q = query(postsRef, orderBy('createdAt', 'desc'));
    
    return onSnapshot(q, (snapshot) => {
      const posts = snapshot.docs.map(doc => {
        const data = groupService._convertTimestamps(doc.data());
        return {
          id: doc.id,
          ...data
        };
      }) as Post[];
      callback(posts);
    });
  },

  // Get all communities
  getGroups: async (): Promise<Group[]> => {
    const q = query(collection(db, GROUPS_COLLECTION));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
      const data = groupService._convertTimestamps(doc.data());
      return {
        id: doc.id,
        ...data,
        members: Array.isArray(data.members) ? data.members : [],
        memberCount: typeof data.memberCount === 'number' ? data.memberCount : 0,
        posts: []
      } as Group;
    });
  },

  // Get group data once (for SSR or initial load)
  getGroup: async (groupId: string): Promise<Group | null> => {
    const docRef = doc(db, GROUPS_COLLECTION, groupId);
    const snapshot = await getDoc(docRef);
    
    if (!snapshot.exists()) return null;
    
    // Get posts as well
    const postsRef = collection(db, GROUPS_COLLECTION, groupId, 'posts');
    const postsSnap = await getDocs(query(postsRef, orderBy('createdAt', 'desc')));
    const posts = postsSnap.docs.map(d => ({ 
      id: d.id, 
      ...groupService._convertTimestamps(d.data()) 
    })) as Post[];
    
    const data = groupService._convertTimestamps(snapshot.data());
    
    return {
      id: snapshot.id,
      ...data,
      members: Array.isArray(data?.members) ? data?.members : [],
      memberCount: typeof data?.memberCount === 'number' ? data?.memberCount : 0,
      posts
    } as Group;
  },

  // Like a post
  likePost: async (groupId: string, postId: string) => {
    const postRef = doc(db, GROUPS_COLLECTION, groupId, 'posts', postId);
    await updateDoc(postRef, {
      likes: increment(1)
    });
  },

  // Create a post
  createPost: async (groupId: string, postData: Partial<Post>) => {
    const postsRef = collection(db, GROUPS_COLLECTION, groupId, 'posts');
    const docRef = await addDoc(postsRef, {
      ...postData,
      createdAt: Timestamp.now(),
      likes: 0,
      comments: 0
    });
    return docRef.id;
  },

  // Join a group
  joinGroup: async (groupId: string, member: Member) => {
    const docRef = doc(db, GROUPS_COLLECTION, groupId);
    await updateDoc(docRef, {
      members: arrayUnion(member),
      memberCount: increment(1)
    });
  },

  // Leave a group
  leaveGroup: async (groupId: string, memberId: string) => {
    const docRef = doc(db, GROUPS_COLLECTION, groupId);
    const snapshot = await getDoc(docRef);
    if (!snapshot.exists()) return;

    const data = snapshot.data();
    const members = data.members || [];
    const memberToRemove = members.find((m: Member) => m.id === memberId);

    if (memberToRemove) {
      await updateDoc(docRef, {
        members: arrayRemove(memberToRemove),
        memberCount: increment(-1)
      });
    }
  }
};
