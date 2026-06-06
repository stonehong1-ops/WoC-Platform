import { db } from '../clientApp';
import {
  collection,
  doc,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  increment,
  Timestamp
} from 'firebase/firestore';
import { Post, Comment } from '@/types/group';
import { reportError } from '@/lib/utils/errorHandler';
import { GROUPS_COLLECTION, groupCrudService, postsCache } from './groupCrudService';

export const groupPostService = {
  // Subscribe to group posts
  subscribePosts: (groupId: string, callback: (posts: Post[]) => void, errorCallback?: (error: any) => void) => {
    const postsRef = collection(db, GROUPS_COLLECTION, groupId, 'posts');
    const q = query(postsRef, orderBy('createdAt', 'desc'));

    return onSnapshot(q, (snapshot) => {
      const posts = snapshot.docs.map(doc => {
        const data = groupCrudService._convertTimestamps(doc.data());
        return {
          id: doc.id,
          ...data
        };
      }) as Post[];

      postsCache.set(groupId, posts);

      callback(posts);
    }, (error) => {
      console.error(`Error subscribing to posts for group ${groupId}:`, error);
      if (errorCallback) errorCallback(error);
    });
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
    try {
      const postsRef = collection(db, GROUPS_COLLECTION, groupId, 'posts');
      const docRef = await addDoc(postsRef, {
        ...postData,
        createdAt: Timestamp.now(),
        likes: 0,
        comments: 0,
        views: 0
      });
      return docRef.id;
    } catch (error) {
      await reportError(error, 'groupService.createPost');
      throw error;
    }
  },

  // Update a post
  updatePost: async (groupId: string, postId: string, postData: Partial<Post>) => {
    try {
      const postRef = doc(db, GROUPS_COLLECTION, groupId, 'posts', postId);
      await updateDoc(postRef, {
        ...postData,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      await reportError(error, 'groupService.updatePost');
      throw error;
    }
  },

  // Delete a post
  deletePost: async (groupId: string, postId: string) => {
    try {
      const postRef = doc(db, GROUPS_COLLECTION, groupId, 'posts', postId);
      await deleteDoc(postRef);
    } catch (error) {
      await reportError(error, 'groupService.deletePost');
      throw error;
    }
  },

  // Increment view count
  incrementPostViews: async (groupId: string, postId: string) => {
    const postRef = doc(db, GROUPS_COLLECTION, groupId, 'posts', postId);
    await updateDoc(postRef, {
      views: increment(1)
    });
  },

  // Subscribe to comments
  subscribeComments: (groupId: string, postId: string, callback: (comments: Comment[]) => void) => {
    const commentsRef = collection(db, GROUPS_COLLECTION, groupId, 'posts', postId, 'comments');
    const q = query(commentsRef, orderBy('createdAt', 'asc'));

    return onSnapshot(q, (snapshot) => {
      const comments = snapshot.docs.map(doc => ({
        id: doc.id,
        ...groupCrudService._convertTimestamps(doc.data())
      })) as Comment[];
      callback(comments);
    });
  },

  // Add a comment
  addComment: async (groupId: string, postId: string, commentData: Omit<Comment, 'id' | 'createdAt'>) => {
    const commentsRef = collection(db, GROUPS_COLLECTION, groupId, 'posts', postId, 'comments');
    const postRef = doc(db, GROUPS_COLLECTION, groupId, 'posts', postId);

    await addDoc(commentsRef, {
      ...commentData,
      createdAt: Timestamp.now()
    });

    await updateDoc(postRef, {
      comments: increment(1)
    });
  },

  // Delete a comment
  deleteComment: async (groupId: string, postId: string, commentId: string) => {
    const commentRef = doc(db, GROUPS_COLLECTION, groupId, 'posts', postId, 'comments', commentId);
    const postRef = doc(db, GROUPS_COLLECTION, groupId, 'posts', postId);

    await deleteDoc(commentRef);
    await updateDoc(postRef, {
      comments: increment(-1)
    });
  }
};
