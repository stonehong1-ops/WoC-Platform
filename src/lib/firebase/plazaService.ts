import { db } from './clientApp';
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';

export interface Post {
  id: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  content: string;
  images?: string[];
  likes: number;
  commentsCount: number;
  createdAt: Timestamp;
}

const COLLECTION_NAME = 'plaza';

export const plazaService = {
  // 실시간 게시글 목록 가져오기
  subscribePosts: (callback: (posts: Post[]) => void) => {
    const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const posts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Post[];
      callback(posts);
    });
  },

  // 게시글 작성
  createPost: async (postData: Omit<Post, 'id' | 'createdAt' | 'likes' | 'commentsCount'>) => {
    try {
      await addDoc(collection(db, COLLECTION_NAME), {
        ...postData,
        likes: 0,
        commentsCount: 0,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error creating post in Plaza:", error);
      throw error;
    }
  }
};
