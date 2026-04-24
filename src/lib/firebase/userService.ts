import { db } from './clientApp';
import { 
  collection, 
  query, 
  where, 
  doc,
  getDoc,
  getDocs, 
  limit,
  orderBy
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
  }
};
