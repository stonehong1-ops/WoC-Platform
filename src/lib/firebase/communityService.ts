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
import { Community, Post, Member } from '@/types/community';

const COMMUNITIES_COLLECTION = 'communities';

export const communityService = {
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

    if (Array.isArray(data)) return data.map(i => communityService._convertTimestamps(i));
    
    if (typeof data === 'object' && (data.constructor === Object || !data.constructor)) {
      const converted: any = {};
      for (const [key, value] of Object.entries(data)) {
        converted[key] = communityService._convertTimestamps(value);
      }
      return converted;
    }
    return data;
  },

  // Subscribe to community metadata
  subscribeCommunity: (communityId: string, callback: (community: Community | null) => void) => {
    const docRef = doc(db, COMMUNITIES_COLLECTION, communityId);
    
    return onSnapshot(docRef, async (snapshot) => {
      if (!snapshot.exists()) {
        callback(null);
        return;
      }
      
      const rawData = snapshot.data();
      if (!rawData) return;
      const data = communityService._convertTimestamps(rawData);
      
      // Initially set without posts (we'll fetch posts separately)
      callback({
        id: snapshot.id,
        ...data,
        members: Array.isArray(data.members) ? data.members : [],
        memberCount: typeof data.memberCount === 'number' ? data.memberCount : 0,
        posts: []
      } as Community);
    });
  },

  // Subscribe to community posts
  subscribePosts: (communityId: string, callback: (posts: Post[]) => void) => {
    const postsRef = collection(db, COMMUNITIES_COLLECTION, communityId, 'posts');
    const q = query(postsRef, orderBy('createdAt', 'desc'));
    
    return onSnapshot(q, (snapshot) => {
      const posts = snapshot.docs.map(doc => {
        const data = communityService._convertTimestamps(doc.data());
        return {
          id: doc.id,
          ...data
        };
      }) as Post[];
      callback(posts);
    });
  },

  // Get all communities
  getCommunities: async (): Promise<Community[]> => {
    const q = query(collection(db, COMMUNITIES_COLLECTION));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
      const data = communityService._convertTimestamps(doc.data());
      return {
        id: doc.id,
        ...data,
        members: Array.isArray(data.members) ? data.members : [],
        memberCount: typeof data.memberCount === 'number' ? data.memberCount : 0,
        posts: []
      } as Community;
    });
  },

  // Get community data once (for SSR or initial load)
  getCommunity: async (communityId: string): Promise<Community | null> => {
    const docRef = doc(db, COMMUNITIES_COLLECTION, communityId);
    const snapshot = await getDoc(docRef);
    
    if (!snapshot.exists()) return null;
    
    // Get posts as well
    const postsRef = collection(db, COMMUNITIES_COLLECTION, communityId, 'posts');
    const postsSnap = await getDocs(query(postsRef, orderBy('createdAt', 'desc')));
    const posts = postsSnap.docs.map(d => ({ 
      id: d.id, 
      ...communityService._convertTimestamps(d.data()) 
    })) as Post[];
    
    const data = communityService._convertTimestamps(snapshot.data());
    
    return {
      id: snapshot.id,
      ...data,
      members: Array.isArray(data?.members) ? data?.members : [],
      memberCount: typeof data?.memberCount === 'number' ? data?.memberCount : 0,
      posts
    } as Community;
  },

  // Like a post
  likePost: async (communityId: string, postId: string) => {
    const postRef = doc(db, COMMUNITIES_COLLECTION, communityId, 'posts', postId);
    await updateDoc(postRef, {
      likes: increment(1)
    });
  },

  // Create a post
  createPost: async (communityId: string, postData: Partial<Post>) => {
    const postsRef = collection(db, COMMUNITIES_COLLECTION, communityId, 'posts');
    const docRef = await addDoc(postsRef, {
      ...postData,
      createdAt: Timestamp.now(),
      likes: 0,
      comments: 0
    });
    return docRef.id;
  },

  // Join a community
  joinCommunity: async (communityId: string, member: Member) => {
    const docRef = doc(db, COMMUNITIES_COLLECTION, communityId);
    await updateDoc(docRef, {
      members: arrayUnion(member),
      memberCount: increment(1)
    });
  },

  // Leave a community
  leaveCommunity: async (communityId: string, memberId: string) => {
    const docRef = doc(db, COMMUNITIES_COLLECTION, communityId);
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
