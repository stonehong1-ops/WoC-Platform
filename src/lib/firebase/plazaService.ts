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
  location?: string;
  likes: number;
  commentsCount: number;
  createdAt: Timestamp;
}

const COLLECTION_NAME = 'plaza';

export const plazaService = {
  // 실시간 게시글 목록 가져오기 (기존 유지용)
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

  // 페이지네이션 기반 게시글 가져오기
  getPostsPaginated: async (pageSize: number = 10, lastDoc?: any) => {
    try {
      const { getDocs, limit, startAfter, query, collection, orderBy } = await import('firebase/firestore');
      let q = query(
        collection(db, COLLECTION_NAME), 
        orderBy('createdAt', 'desc'), 
        limit(pageSize)
      );

      if (lastDoc) {
        q = query(q, startAfter(lastDoc));
      }

      const snapshot = await getDocs(q);
      const posts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Post[];

      return {
        posts,
        lastVisible: snapshot.docs[snapshot.docs.length - 1]
      };
    } catch (error) {
      console.error("Error fetching paginated posts:", error);
      throw error;
    }
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
  },

  // 좋아요 기능
  likePost: async (postId: string) => {
    try {
      const { doc, updateDoc, increment } = await import('firebase/firestore');
      const postRef = doc(db, COLLECTION_NAME, postId);
      await updateDoc(postRef, {
        likes: increment(1)
      });
    } catch (error) {
      console.error("Error liking post:", error);
    }
  },

  // 댓글 추가 (대댓글 포함)
  addComment: async (postId: string, commentData: { 
    userId: string, 
    userName: string, 
    userPhoto: string, 
    content: string, 
    parentId?: string 
  }) => {
    try {
      const { collection, addDoc, doc, updateDoc, increment, serverTimestamp } = await import('firebase/firestore');
      const commentsRef = collection(db, COLLECTION_NAME, postId, 'comments');
      
      await addDoc(commentsRef, {
        ...commentData,
        createdAt: serverTimestamp(),
      });

      // 메인 포스트의 댓글 수 증가
      const postRef = doc(db, COLLECTION_NAME, postId);
      await updateDoc(postRef, {
        commentsCount: increment(1)
      });
    } catch (error) {
      console.error("Error adding comment:", error);
      throw error;
    }
  },

  // 댓글 실시간 보관함
  subscribeComments: (postId: string, callback: (comments: any[]) => void) => {
    const { collection, query, orderBy, onSnapshot } = require('firebase/firestore');
    const q = query(collection(db, COLLECTION_NAME, postId, 'comments'), orderBy('createdAt', 'asc'));
    return onSnapshot(q, (snapshot: any) => {
      const comments = snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(comments);
    });
  },

  // 미디어 업로드 (이미지/동영상)
  uploadMedia: async (file: File, onProgress?: (progress: number) => void) => {
    try {
      const { storageService } = await import('./storageService');
      const filename = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`; // Sanitize filename
      
      // Delegate to the shared storageService which includes image compression
      return await storageService.uploadFile(file, `plaza/${filename}`, onProgress);
    } catch (error) {
      console.error("Error uploading media to plaza:", error);
      throw error;
    }
  },

  // --- Relationship & Affinity Logic ---

  // 핀(Pin) 상태 토글
  togglePinUser: async (userId: string, targetId: string, isPinned: boolean) => {
    try {
      const { doc, updateDoc, arrayUnion, arrayRemove } = await import('firebase/firestore');
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        pinnedUserIds: isPinned ? arrayRemove(targetId) : arrayUnion(targetId)
      });
      return !isPinned;
    } catch (error) {
      console.error("Error toggling pin:", error);
      throw error;
    }
  },

  // 최근 스토리가 있는 유저 목록 가져오기 (24시간 이내)
  getUsersWithRecentPosts: async () => {
    try {
      const { getDocs, query, collection, where, limit, Timestamp } = await import('firebase/firestore');
      const dayAgo = Timestamp.fromMillis(Date.now() - 24 * 60 * 60 * 1000);
      
      const q = query(
        collection(db, COLLECTION_NAME),
        where('createdAt', '>=', dayAgo),
        limit(50)
      );

      const snapshot = await getDocs(q);
      const uniqueUserIds = new Set<string>();
      const userStories: any[] = [];

      snapshot.docs.forEach(doc => {
        const data = doc.data();
        if (!uniqueUserIds.has(data.userId)) {
          uniqueUserIds.add(data.userId);
          userStories.push({
            userId: data.userId,
            userName: data.userName,
            userPhoto: data.userPhoto,
            lastPostAt: data.createdAt,
            hasUnread: true // Default to true for simplicity in this version
          });
        }
      });

      return userStories;
    } catch (error) {
      console.error("Error getting story users:", error);
      return [];
    }
  }
};
