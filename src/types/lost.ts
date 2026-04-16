import { Timestamp } from 'firebase/firestore';

export type LostStatus = 'active' | 'matching' | 'returned' | 'cancelled';
export type LostCategory = 'Lost' | 'Found';

export interface LostItem {
  id: string;
  category: LostCategory; // Lost or Found
  title: string;
  description: string;
  location: string;
  itemType: string; // e.g. "Camera", "Shoes", "Wallet"
  imageUrl: string;
  reportedById: string;
  reportedByName: string;
  status: LostStatus;
  lostDate?: Timestamp;
  foundDate?: Timestamp;
  createdAt: Timestamp;
}

export interface LostMatch {
  id: string;
  lostItemId: string;
  foundItemId: string;
  confidence: number;
  status: 'pending' | 'confirmed' | 'rejected';
  createdAt: Timestamp;
}
