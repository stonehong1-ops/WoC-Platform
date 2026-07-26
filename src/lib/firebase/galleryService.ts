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
  getDoc, 
  limit, 
  serverTimestamp,
  increment,
  arrayUnion,
  arrayRemove,
  onSnapshot,
  Timestamp
} from 'firebase/firestore';
import { db } from './clientApp';

export interface GalleryTag {
  type: 'group' | 'social' | 'event' | 'class' | 'people';
  id: string;
  name: string;
  groupId?: string;       // class가 속한 그룹 ID
  instructors?: string;   // e.g. "by Geff, Muse"
  avatar?: string;        // people용 프로필 사진
  role?: string;          // people: 'me' | 'organizer' | 'instructor'
}

export interface GalleryPost {
  id: string;
  authorId: string;
  authorName: string;
  authorPhoto: string;
  media: string[];
  mediaTypes?: ('image' | 'video')[];
  caption: string;
  tags?: GalleryTag[];    // Unified TAG system
  showInLive?: boolean;   // true(default) = show in Live feed, false = tagged entity only
  // Legacy fields (backward compat)
  venueId?: string;
  venueName?: string;
  eventId?: string;
  eventName?: string;
  likesCount: number;
  commentsCount: number;
  likedBy: string[];
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

export const dedupeAndSortPosts = (posts: GalleryPost[]): GalleryPost[] => {
  const map = new Map<string, GalleryPost>();
  posts.forEach(p => {
    if (p && p.id) {
      map.set(p.id, p);
    }
  });
  return Array.from(map.values()).sort((a, b) => {
    const timeA = typeof a.createdAt === 'number' ? a.createdAt : (a.createdAt?.toMillis?.() || 0);
    const timeB = typeof b.createdAt === 'number' ? b.createdAt : (b.createdAt?.toMillis?.() || 0);
    return timeB - timeA;
  });
};

/**
 * 스톤님 최고 등급 아키텍처 수술 도우미:
 * 1. Window Shift vs Actual Remote Delete 정밀 분리:
 *    - 새 글 유입으로 20개 윈도우 밖으로 밀려난 글(Window Shift)은 historyPosts로 안전 전이.
 *    - 20개 윈도우 내에서 실제 삭제된 글(Actual Delete)만 historyPosts에서 100% 필터링 제거.
 * 2. History Trimming & Cursor Independence:
 *    - lastDocSnap 커서는 Firestore와 100% 독립 유지하여 페이징 지속 보장.
 *    - historyPosts는 최신 80개만 Trimming하여 스크롤 튀김 및 메모리 오버플로우 방지.
 */
export const mergeRealtimeAndHistory = (
  newRealtime: GalleryPost[],
  prevRealtime: GalleryPost[],
  prevHistory: GalleryPost[]
): { finalPosts: GalleryPost[]; newHistory: GalleryPost[]; hasMoreHistory: boolean } => {
  const newRealtimeIds = new Set(newRealtime.map(p => p.id));
  const prevRealtimeIds = new Set(prevRealtime.map(p => p.id));

  const minRealtimeTime = newRealtime.length > 0
    ? Math.min(...newRealtime.map(p => typeof p.createdAt === 'number' ? p.createdAt : (p.createdAt?.toMillis?.() || 0)))
    : 0;

  const actualDeletedIds = new Set<string>();
  const shiftedFromRealtime: GalleryPost[] = [];

  prevRealtime.forEach(p => {
    if (!newRealtimeIds.has(p.id)) {
      const pTime = typeof p.createdAt === 'number' ? p.createdAt : (p.createdAt?.toMillis?.() || 0);
      if (pTime >= minRealtimeTime) {
        actualDeletedIds.add(p.id);
      } else {
        shiftedFromRealtime.push(p);
      }
    }
  });

  let updatedHistory = prevHistory.filter(
    h => !actualDeletedIds.has(h.id) && !newRealtimeIds.has(h.id)
  );

  updatedHistory = dedupeAndSortPosts([...shiftedFromRealtime, ...updatedHistory]);

  // 스톤님 선택지 A: historyPosts 80개(전체 100개) 도달 시 hasMoreHistory = false로 페이징 종료하여 잘림 방지
  const hasMoreHistory = updatedHistory.length < 80;
  if (updatedHistory.length > 80) {
    updatedHistory = updatedHistory.slice(0, 80);
  }

  const finalPosts = dedupeAndSortPosts([...newRealtime, ...updatedHistory]);

  return { finalPosts, newHistory: updatedHistory, hasMoreHistory };
};

/**
 * 21번째 이후 historyPosts 원격 삭제 2차 방어막:
 * 사용자가 클릭/상호작용 시 해당 다큐먼트의 Firestore 실존 여부를 원격 비동기 검증
 */
export const checkPostExists = async (postId: string): Promise<boolean> => {
  try {
    const postRef = doc(db, GALLERY_COLLECTION, postId);
    const snap = await getDoc(postRef);
    return snap.exists();
  } catch (e) {
    return true; // 네트워크 오류 시 보수적으로 유효 처리
  }
};

const _convertTimestamps = (data: any): any => {
  if (!data) return data;

  if (typeof data.toMillis === 'function') return data.toMillis();
  if (data.seconds !== undefined && data.nanoseconds !== undefined) {
    return data.seconds * 1000 + Math.floor(data.nanoseconds / 1000000);
  }
  if (data instanceof Date) return data.getTime();

  if (Array.isArray(data)) return data.map(item => _convertTimestamps(item));

  if (typeof data === 'object' && (data.constructor === Object || !data.constructor)) {
    const converted: any = {};
    for (const [key, value] of Object.entries(data)) {
      converted[key] = _convertTimestamps(value);
    }
    return converted;
  }
  return data;
};

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

  // 2. Subscribe to Feed (최신 20개 경량 실시간 수신)
  subscribeFeed(
    callback: (posts: GalleryPost[], lastDocSnap?: any) => void,
    options?: { entityType?: string; entityId?: string; userId?: string },
    errorCallback?: (error: any) => void
  ) {
    const q = query(
      collection(db, GALLERY_COLLECTION),
      orderBy('createdAt', 'desc'),
      limit(20) // 최신 20개 경량 페칭으로 5초 지연 해제
    );

    return onSnapshot(q, (snapshot) => {
      let posts = snapshot.docs.map(doc => ({
        id: doc.id,
        ..._convertTimestamps(doc.data())
      })) as GalleryPost[];

      if (options?.userId) {
        posts = posts.filter(post => {
          const isAuthor = post.authorId === options.userId;
          const isTagged = Array.isArray(post.tags) ? post.tags.some(tag => tag && tag.type === 'people' && tag.id === options.userId) : false;
          return isAuthor || isTagged;
        });
      }

      if (options?.entityType) {
        posts = posts.filter(post => {
          if (Array.isArray(post.tags) && post.tags.length > 0) {
            const hasTag = post.tags.some(tag => tag && tag.type === options.entityType && (!options.entityId || tag.id === options.entityId));
            if (hasTag) return true;
          }
          if (options.entityType === 'venue' && (!options.entityId || post.venueId === options.entityId)) return true;
          if (options.entityType === 'event' && (!options.entityId || post.eventId === options.entityId)) return true;
          if (options.entityType === 'group' && (!options.entityId || (post as any).groupId === options.entityId)) return true;
          if (options.entityType === 'social' && (!options.entityId || (post as any).socialId === options.entityId)) return true;
          return false;
        });
      } else if (!options?.userId) {
        posts = posts.filter(post => post.showInLive !== false);
      }

      const lastDocSnap = snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : undefined;
      callback(dedupeAndSortPosts(posts), lastDocSnap);
    }, (error) => {
      console.error("Error in subscribeFeed:", error);
      if (errorCallback) errorCallback(error);
    });
  },

  // 2-B. Fetch More Feed (남은 슬롯 정밀 페이징 수신)
  async fetchMoreFeed(lastDocSnap: any, pageSize = 20): Promise<{ posts: GalleryPost[]; lastDocSnap?: any; hasMore: boolean }> {
    if (!lastDocSnap || pageSize <= 0) return { posts: [], hasMore: false };

    const { startAfter } = await import('firebase/firestore');
    const q = query(
      collection(db, GALLERY_COLLECTION),
      orderBy('createdAt', 'desc'),
      startAfter(lastDocSnap),
      limit(pageSize)
    );

    const snapshot = await getDocs(q);
    const rawPosts = snapshot.docs.map(doc => ({
      id: doc.id,
      ..._convertTimestamps(doc.data())
    })) as GalleryPost[];

    const posts = dedupeAndSortPosts(rawPosts);
    const newLastSnap = snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : undefined;
    const hasMore = snapshot.docs.length >= pageSize;

    return { posts, lastDocSnap: newLastSnap, hasMore };
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
  subscribeComments(postId: string, callback: (comments: GalleryComment[]) => void, errorCallback?: (error: any) => void) {
    const q = query(
      collection(db, COMMENTS_COLLECTION),
      where('postId', '==', postId),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
      const comments = snapshot.docs.map(doc => ({
        id: doc.id,
        ..._convertTimestamps(doc.data())
      })) as GalleryComment[];
      callback(comments);
    }, (error) => {
      console.error("Error in subscribeComments:", error);
      if (errorCallback) errorCallback(error);
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
