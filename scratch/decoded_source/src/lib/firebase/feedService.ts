import { db } from './clientApp';
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  serverTimestamp,
  where,
  doc,
  updateDoc,
  increment,
  limit,
  startAfter,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  Timestamp,
  QueryConstraint
} from 'firebase/firestore';
import { Post, Comment, ReactionType, Reaction } from '@/types/feed';

/**
 * [Firestore Composite Index Guide]
 * 다중 필터링과 정렬을 위해 아래 인덱스 설정이 Firebase 콘솔에서 필요합니다.
 * 
 * 1. 컬렉션: feeds
 *    - targets (배열)
 *    - createdAt (내림차순)
 * 
 * 2. 컬렉션: feeds
 *    - targets (배열)
 *    - location.city (오름차순)
 *    - createdAt (내림차순)
 * 
 * 3. 컬렉션: feeds
 *    - targets (배열)
 *    - category (오름차순)
 *    - createdAt (내림차순)
 * 
 * 4. 컬렉션: feeds
 *    - targets (배열)
 *    - category (오름차순)
 *    - location.city (오름차순)
 *    - createdAt (내림차순)
 */

const COLLECTION_NAME = 'feeds';

export const feedService = {
  // 실시간 게시글 목록 구독
  subscribePosts: (
    targetId: string, 
    callback: (posts: Post[]) => void, 
    filters?: { city?: string; category?: string },
    onError?: (error: any) => void
  ) => {
    const constraints: QueryConstraint[] = [
      where('targets', 'array-contains', targetId)
    ];

    if (filters?.city && filters.city !== 'ALL') {
      // 대소문자 구분 없이 검색하기 위해 원본 값을 사용하도록 수정 (DB 저장 방식에 맞춤)
      constraints.push(where('location.city', '==', filters.city));
    }

    if (filters?.category) {
      constraints.push(where('category', '==', filters.category));
    }

    constraints.push(orderBy('createdAt', 'desc'));

    const q = query(collection(db, COLLECTION_NAME), ...constraints);
    
    return onSnapshot(q, (snapshot) => {
      const posts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Post[];
      callback(posts);
    }, (error) => {
      // 에러 메시지를 더 구체적으로 출력하여 원인 파악
      console.error(`[FeedService] Subscription failed for target: ${targetId}`, error);
      if (onError) {
        // 실제 Firebase 에러 메시지를 사용자에게 전달
        onError(error.message || String(error));
      }
    });
  },

  // 페이지네이션 기반 게시글 가져오기
  getPostsPaginated: async (
    targetId: string, 
    pageSize: number = 10, 
    lastDoc?: any,
    filters?: { city?: string; category?: string }
  ) => {
    try {
      const constraints: QueryConstraint[] = [
        where('targets', 'array-contains', targetId)
      ];

      if (filters?.city && filters.city !== 'ALL') {
        constraints.push(where('location.city', '==', filters.city.toUpperCase()));
      }

      if (filters?.category) {
        constraints.push(where('category', '==', filters.category));
      }

      constraints.push(orderBy('createdAt', 'desc'));
      constraints.push(limit(pageSize));

      if (lastDoc) {
        constraints.push(startAfter(lastDoc));
      }

      const q = query(collection(db, COLLECTION_NAME), ...constraints);
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
      console.error(`Error fetching paginated posts for ${targetId}:`, error);
      throw error;
    }
  },

  // 게시글 작성
  createPost: async (postData: Omit<Post, 'id' | 'createdAt' | 'likes' | 'commentsCount'>) => {
    try {
      const docRef = await addDoc(collection(db, COLLECTION_NAME), {
        ...postData,
        likesCount: 0,
        commentsCount: 0,
        createdAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error("Error creating post:", error);
      throw error;
    }
  },

  // 리액션 토글 (좋아요, 최고예요 등 6종)
  toggleReaction: async (postId: string, userId: string, userName: string, type: ReactionType, postAuthorId?: string) => {
    try {
      const reactionRef = doc(db, COLLECTION_NAME, postId, 'reactions', userId);
      const reactionSnap = await getDoc(reactionRef);
      const postRef = doc(db, COLLECTION_NAME, postId);

      if (reactionSnap.exists()) {
        const oldType = reactionSnap.data().type as ReactionType;
        
        if (oldType === type) {
          // 같은 반응이면 취소
          await deleteDoc(reactionRef);
          await updateDoc(postRef, {
            [`reactionCounts.${type}`]: increment(-1),
            likesCount: increment(-1) // 하위 호환성
          });
        } else {
          // 다른 반응으로 변경
          await updateDoc(reactionRef, {
            type,
            updatedAt: serverTimestamp()
          });
          await updateDoc(postRef, {
            [`reactionCounts.${oldType}`]: increment(-1),
            [`reactionCounts.${type}`]: increment(1)
          });
        }
      } else {
        // 새 반응 추가
        await setDoc(reactionRef, {
          userId,
          userName,
          type,
          createdAt: serverTimestamp()
        });
        await updateDoc(postRef, {
          [`reactionCounts.${type}`]: increment(1),
          likesCount: increment(1)
        });

        // Update interactedUserIds and likedPostIds
        if (userId) {
          try {
            const { arrayUnion } = await import('firebase/firestore');
            const userRef = doc(db, 'users', userId);
            await updateDoc(userRef, {
              likedPostIds: arrayUnion(postId),
              ...(postAuthorId && postAuthorId !== userId ? { interactedUserIds: arrayUnion(postAuthorId) } : {})
            });
          } catch (e) {
            console.error('Failed to update user interaction data:', e);
          }
        }
      }
    } catch (error) {
      console.error("Error toggling reaction:", error);
      throw error;
    }
  },

  // legacy: 좋아요 토글 (기존 코드 호환용)
  likePost: async (postId: string, isLike: boolean) => {
    try {
      const postRef = doc(db, COLLECTION_NAME, postId);
      await updateDoc(postRef, {
        likesCount: increment(isLike ? 1 : -1)
      });
    } catch (error) {
      console.error("Error in legacy likePost:", error);
      throw error;
    }
  },

  // 댓글 추가
  addComment: async (postId: string, commentData: Omit<Comment, 'id' | 'createdAt'>, postAuthorId?: string) => {
    try {
      const commentsRef = collection(db, COLLECTION_NAME, postId, 'comments');
      
      const newComment = {
        ...commentData,
        parentId: commentData.parentId || null, // 명시적으로 null 설정
        createdAt: serverTimestamp(),
      };

      await addDoc(commentsRef, newComment);

      const postRef = doc(db, COLLECTION_NAME, postId);
      
      await updateDoc(postRef, {
        commentsCount: increment(1)
      });

      if (commentData.parentId) {
        const parentRef = doc(db, COLLECTION_NAME, postId, 'comments', commentData.parentId);
        await updateDoc(parentRef, {
          repliesCount: increment(1)
        });
      }

      // Update interactedUserIds and commentedPostIds
      if (commentData.userId) {
        try {
          const { arrayUnion } = await import('firebase/firestore');
          const userRef = doc(db, 'users', commentData.userId);
          await updateDoc(userRef, {
            commentedPostIds: arrayUnion(postId),
            ...(postAuthorId && commentData.userId !== postAuthorId ? { interactedUserIds: arrayUnion(postAuthorId) } : {})
          });
        } catch (e) {
          console.error('Failed to update user interaction data:', e);
        }
      }
    } catch (error) {
      console.error("Error adding comment:", error);
      throw error;
    }
  },

  // 댓글 구독 (parentId 필터 추가)
  subscribeComments: (postId: string, callback: (comments: Comment[]) => void, parentId?: string) => {
    let q;
    if (parentId) {
      q = query(
        collection(db, COLLECTION_NAME, postId, 'comments'), 
        where('parentId', '==', parentId),
        orderBy('createdAt', 'asc')
      );
    } else {
      q = query(
        collection(db, COLLECTION_NAME, postId, 'comments'), 
        where('parentId', '==', null), // 팁: 기존 데이터가 parentId가 없는 경우 안 나올 수 있음
        orderBy('createdAt', 'asc')
      );
    }
    
    return onSnapshot(q, (snapshot) => {
      const comments = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Comment[];
      callback(comments);
    });
  },

  // 리액션 목록 구독
  subscribeReactions: (postId: string, callback: (reactions: Reaction[]) => void) => {
    const q = query(
      collection(db, COLLECTION_NAME, postId, 'reactions'),
      orderBy('createdAt', 'desc')
    );
    
    return onSnapshot(q, (snapshot) => {
      const reactions = snapshot.docs.map(doc => ({
        ...doc.data()
      })) as Reaction[];
      callback(reactions);
    });
  },

  // 게시글 삭제
  deletePost: async (postId: string) => {
    try {
      const { deleteDoc } = await import('firebase/firestore');
      const postRef = doc(db, COLLECTION_NAME, postId);
      await deleteDoc(postRef);
    } catch (error) {
      console.error("Error deleting post:", error);
      throw error;
    }
  },

  // 게시글 수정
  updatePost: async (postId: string, postData: Partial<Post>) => {
    try {
      const postRef = doc(db, COLLECTION_NAME, postId);
      await updateDoc(postRef, {
        ...postData,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error updating post:", error);
      throw error;
    }
  },

  // 댓글 삭제
  deleteComment: async (postId: string, commentId: string) => {
    try {
      const { deleteDoc } = await import('firebase/firestore');
      const commentRef = doc(db, COLLECTION_NAME, postId, 'comments', commentId);
      await deleteDoc(commentRef);

      const postRef = doc(db, COLLECTION_NAME, postId);
      await updateDoc(postRef, {
        commentsCount: increment(-1)
      });
    } catch (error) {
      console.error("Error deleting comment:", error);
      throw error;
    }
  },

  // 미디어 업로드
  uploadMedia: async (file: File, folder: string = 'feeds', onProgress?: (progress: number) => void) => {
    try {
      const { getStorage, ref, uploadBytesResumable, getDownloadURL } = await import('firebase/storage');
      const storage = getStorage();
      const filename = `${Date.now()}_${file.name}`;
      const storageRef = ref(storage, `${folder}/${filename}`);
      
      const uploadTask = uploadBytesResumable(storageRef, file);

      return new Promise<string>((resolve, reject) => {
        uploadTask.on('state_changed', 
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            if (onProgress) onProgress(progress);
          }, 
          (error) => {
            console.error("Upload failed:", error);
            reject(error);
          }, 
          async () => {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(downloadURL);
          }
        );
      });
    } catch (error) {
      console.error("Error uploading media:", error);
      throw error;
    }
  },

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
      console.error("Error toggling pin user:", error);
      throw error;
    }
  },

  // 게시물 핀(Pin Post) 상태 토글
  togglePinPost: async (userId: string, postId: string, isPinned: boolean) => {
    try {
      const { doc, updateDoc, arrayUnion, arrayRemove } = await import('firebase/firestore');
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        pinnedPostIds: isPinned ? arrayRemove(postId) : arrayUnion(postId)
      });
      return !isPinned;
    } catch (error) {
      console.error("Error toggling pin post:", error);
      throw error;
    }
  },

  // 최근 스토리가 있는 유저 목록 가져오기 (24시간 이내, targetId 기반)
  getUsersWithRecentPosts: async (targetId?: string) => {
    try {
      const { getDocs, query, collection, where, limit, Timestamp } = await import('firebase/firestore');
      const dayAgo = Timestamp.fromMillis(Date.now() - 24 * 60 * 60 * 1000);
      
      let q = query(
        collection(db, COLLECTION_NAME),
        where('createdAt', '>=', dayAgo),
        limit(50)
      );

      if (targetId) {
        q = query(q, where('targets', 'array-contains', targetId));
      }

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
            hasUnread: true 
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
