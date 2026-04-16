import { Timestamp } from 'firebase/firestore';

export type ItemCondition = 'S' | 'A' | 'B' | 'C'; // S: New, A: Like New, B: Good, C: Well-used
export type TradeMethod = 'direct' | 'delivery' | 'both';

export interface ResaleItem {
  id: string;
  title: string;
  description: string;
  price: number;
  location: string;
  category: string;
  imageUrl: string;
  sellerId: string;
  sellerName: string;
  condition: ItemCondition;
  tradeMethod: TradeMethod;
  canNegotiate: boolean;
  status: 'active' | 'reserved' | 'sold';
  likesCount: number;
  chatsCount: number;
  createdAt: Timestamp;
}

export interface UserReputation {
  userId: string;
  hobbyScore: number; // 0-100 (Default: 36.5)
  positiveReviews: number;
  tradeCount: number;
}

export interface ResaleLike {
  userId: string;
  itemId: string;
  createdAt: Timestamp;
}
