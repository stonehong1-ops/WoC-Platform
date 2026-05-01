import { Timestamp } from 'firebase/firestore';

export type LostFoundType = 'LOST' | 'FOUND';
export type LostFoundStatus = 'SEARCHING' | 'RESOLVED';

export interface LostFoundItem {
  id: string;
  type: LostFoundType;
  status: LostFoundStatus;
  title: string;
  description: string;
  category: string;
  location: string;       // 클럽, 장소 이름
  date: string;           // 분실/습득 일자 (YYYY-MM-DD 형식 권장)
  images: string[];
  reward?: number;        // 사례금 (Bounty)
  
  authorId: string;       // 작성자 UID
  authorName?: string;    // 작성자 이름 (표시용)
  authorPhoto?: string;   // 작성자 프로필 사진
  
  isFeatured?: boolean;   // 상단 노출 여부
  
  likesCount: number;     // 관심/위시 수
  viewsCount: number;     // 조회수
  
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ===== Lost&Found Like (Wishlist) =====
export interface LostFoundLike {
  id: string;             // 문서 ID: {userId}_{itemId}
  userId: string;
  itemId: string;
  createdAt: Timestamp;
}
