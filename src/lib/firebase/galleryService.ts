import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  orderBy, 
  getDocs, 
  limit, 
  serverTimestamp,
  increment,
  arrayUnion,
  arrayRemove,
  onSnapshot,
  Timestamp
} from 'firebase/firestore';
import { db } from './config';

export interface GalleryPost {
  id: string;
  authorId: string;
  authorName: string;
  authorPhoto: string;
  media: string[];
  mediaTypes?: ('image' | 'video')[];
  caption: string;
  venueId?: string;
  venueName?: string;
  eventId?: string;
  eventName?: string;
  likesCount: number;
  commentsCount: number;
  likedBy: string[]; // List of user IDs who liked this post
  createdAt: any;
  updatedAt: any;
}

export interface GalleryComment {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  authorPhoto: string;
  text: string;
  likesCount: number;
  createdAt: any;
}

const GALLERY_COLLECTION = 'galleries';
const COMMENTS_COLLECTION = 'gallery_comments';

export const galleryService = {
  // 1. Create Post
  async createPost(post: Omit<GalleryPost, 'id' | 'likesCount' | 'commentsCount' | 'likedBy' | 'createdAt' | 'updatedAt'>) {
    const docRef = await addDoc(collection(db, GALLERY_COLLECTION), {
      ...post,
      likesCount: 0,
      commentsCount: 0,
      likedBy: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  },

  // 2. Subscribe to Feed
  subscribeFeed(callback: (posts: GalleryPost[]) => void) {
    const q = query(
      collection(db, GALLERY_COLLECTION),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    return onSnapshot(q, (snapshot) => {
      const posts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as GalleryPost[];
      callback(posts);
    });
  },

  // 3. Like / Unlike Post
  async toggleLike(postId: string, userId: string, isLiked: boolean) {
    const postRef = doc(db, GALLERY_COLLECTION, postId);
    await updateDoc(postRef, {
      likedBy: isLiked ? arrayRemove(userId) : arrayUnion(userId),
      likesCount: increment(isLiked ? -1 : 1)
    });
  },

  // 4. Add Comment
  async addComment(postId: string, comment: Omit<GalleryComment, 'id' | 'likesCount' | 'createdAt'>) {
    // Add comment to subcollection
    await addDoc(collection(db, COMMENTS_COLLECTION), {
      ...comment,
      postId,
      likesCount: 0,
      createdAt: serverTimestamp(),
    });

    // Increment post comment count
    const postRef = doc(db, GALLERY_COLLECTION, postId);
    await updateDoc(postRef, {
      commentsCount: increment(1)
    });
  },

  // 5. Subscribe to Comments
  subscribeComments(postId: string, callback: (comments: GalleryComment[]) => void) {
    const q = query(
      collection(db, COMMENTS_COLLECTION),
      where('postId', '==', postId),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
      const comments = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as GalleryComment[];
      callback(comments);
    });
  },

  // 6. Delete Post
  async deletePost(postId: string) {
    await deleteDoc(doc(db, GALLERY_COLLECTION, postId));
  },

  // 7. Get Single Post
  async getPost(postId: string) {
    const docRef = doc(db, GALLERY_COLLECTION, postId);
    const snapshot = await getDocs(query(collection(db, GALLERY_COLLECTION), where('__name__', '==', postId)));
    if (snapshot.empty) return null;
    return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as GalleryPost;
  },

  // 8. Update Post
  async updatePost(postId: string, data: Partial<GalleryPost>) {
    const postRef = doc(db, GALLERY_COLLECTION, postId);
    await updateDoc(postRef, {
      ...data,
      updatedAt: serverTimestamp()
    });
  }
};
