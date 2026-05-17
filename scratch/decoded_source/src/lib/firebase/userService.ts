import { db } from './clientApp';
import { 
  collection, 
  query, 
  where, 
  doc,
  getDoc,
  getDocs, 
  limit,
  orderBy,
  updateDoc,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import { PlatformUser } from '@/types/user';

const USERS_COLLECTION = 'users';

export const userService = {
  // Search users by displayName or email
  searchUsers: async (keyword: string, pageSize = 20): Promise<PlatformUser[]> => {
    if (!keyword || keyword.trim().length < 2) return [];

    const searchKeyword = keyword.trim();
    
    // Firestore doesn't support full-text search easily without external services
    // Using a common prefix search trick for displayName
    const q = query(
      collection(db, USERS_COLLECTION),
      where('nickname', '>=', searchKeyword),
      where('nickname', '<=', searchKeyword + '\uf8ff'),
      limit(pageSize)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as PlatformUser[];
  },

  // Get single user by ID
  getUserById: async (uid: string): Promise<PlatformUser | null> => {
    const docRef = doc(db, USERS_COLLECTION, uid);
    const snapshot = await getDoc(docRef);
    if (!snapshot.exists()) return null;
    return { id: snapshot.id, ...snapshot.data() } as PlatformUser;
  },

  // Get top members (currently mock logic fetching users with photos)
  getTopMembers: async (limitCount = 3): Promise<PlatformUser[]> => {
    const q = query(
      collection(db, USERS_COLLECTION),
      limit(limitCount)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as PlatformUser[];
  },
  
  // Get all users for client-side filtering
  getAllUsers: async (): Promise<PlatformUser[]> => {
    const q = query(collection(db, USERS_COLLECTION));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as PlatformUser[];
  },

  // Toggle Like on a class
  toggleLikeClass: async (uid: string, classId: string, isLiking: boolean): Promise<void> => {
    const docRef = doc(db, USERS_COLLECTION, uid);
    await updateDoc(docRef, {
      likedClassIds: isLiking ? arrayUnion(classId) : arrayRemove(classId)
    });
  },

  // Get user's liked classes
  getLikedClassIds: async (uid: string): Promise<string[]> => {
    const userDoc = await getDoc(doc(db, USERS_COLLECTION, uid));
    if (!userDoc.exists()) return [];
    return userDoc.data().likedClassIds || [];
  },

  // Toggle Like on a stay
  toggleLikeStay: async (uid: string, stayId: string, isLiking: boolean): Promise<void> => {
    const docRef = doc(db, USERS_COLLECTION, uid);
    await updateDoc(docRef, {
      likedStayIds: isLiking ? arrayUnion(stayId) : arrayRemove(stayId)
    });
  },

  // Get user's liked stays
  getLikedStayIds: async (uid: string): Promise<string[]> => {
    const userDoc = await getDoc(doc(db, USERS_COLLECTION, uid));
    if (!userDoc.exists()) return [];
    return userDoc.data().likedStayIds || [];
  }
};
