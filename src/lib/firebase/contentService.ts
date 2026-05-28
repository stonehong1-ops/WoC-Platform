import { 
  collection, 
  query, 
  orderBy, 
  getDocs, 
  addDoc, 
  serverTimestamp, 
  onSnapshot, 
  updateDoc, 
  doc, 
  increment,
  limit
} from 'firebase/firestore';
import { db } from './clientApp';

export interface ContentEntry {
  id: string;
  imageUrl: string;
  episodeNumber: number;
  title?: string;
  category?: string;
  createdAt: any;
  likeCount?: number;
}

export interface Review {
  id: string;
  content: string;
  createdAt: any;
}

/**
 * 1. 특정 컬렉션의 모든 콘텐츠 리스트 페칭 (최신순)
 */
export async function fetchContentEntries(collectionName: string): Promise<ContentEntry[]> {
  const q = query(collection(db, collectionName), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as ContentEntry));
}

/**
 * 2. 특정 컬렉션의 가장 최신 콘텐츠 단일 엔트리 페칭
 */
export async function fetchLatestContentEntry(collectionName: string): Promise<ContentEntry | null> {
  const q = query(collection(db, collectionName), orderBy('createdAt', 'desc'), limit(1));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() } as ContentEntry;
}

/**
 * 3. 특정 콘텐츠 엔트리의 댓글(reviews) 실시간 구독
 */
export function subscribeToReviews(
  collectionName: string,
  entryId: string,
  callback: (reviews: Review[]) => void
): () => void {
  const reviewsRef = collection(db, collectionName, entryId, 'reviews');
  const q = query(reviewsRef, orderBy('createdAt', 'desc'));
  
  return onSnapshot(q, (snapshot) => {
    const reviews = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Review));
    callback(reviews);
  });
}

/**
 * 4. 특정 콘텐츠 엔트리에 댓글 추가
 */
export async function addReview(
  collectionName: string,
  entryId: string,
  content: string
): Promise<void> {
  const reviewsRef = collection(db, collectionName, entryId, 'reviews');
  await addDoc(reviewsRef, {
    content,
    createdAt: serverTimestamp()
  });
}

/**
 * 5. 특정 콘텐츠 엔트리의 좋아요(likeCount) 가감
 */
export async function toggleLike(
  collectionName: string,
  entryId: string,
  isIncrement: boolean
): Promise<void> {
  const entryRef = doc(db, collectionName, entryId);
  await updateDoc(entryRef, {
    likeCount: increment(isIncrement ? 1 : -1)
  });
}

/**
 * 6. 어드민: 새 콘텐츠 엔트리 업로드 등록
 */
export async function addContentEntry(
  collectionName: string,
  imageUrl: string,
  episodeNumber: number,
  category?: string
): Promise<void> {
  const data: Record<string, any> = {
    imageUrl,
    episodeNumber,
    createdAt: serverTimestamp(),
    likeCount: 0
  };
  if (category) {
    data.category = category;
  }
  await addDoc(collection(db, collectionName), data);
}

/**
 * 7. 어드민: 다음 에피소드 넘버 자동 페칭 및 산출
 */
export async function fetchNextEpisodeNumber(
  collectionName: string,
  category?: string
): Promise<number> {
  const q = query(collection(db, collectionName), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  const all = snap.docs.map(d => d.data() as ContentEntry);
  
  const filtered = category 
    ? all.filter(c => (c.category || 'imagination') === category)
    : all;

  if (filtered.length > 0 && filtered[0].episodeNumber) {
    return filtered[0].episodeNumber + 1;
  }
  return 1;
}
