import { Timestamp } from 'firebase/firestore';

export type ReactionType = 'LIKE' | 'LOVE' | 'HAHA' | 'WOW' | 'SAD' | 'FIRE';

export interface Reaction {
  userId: string;
  userName: string;
  type: ReactionType;
  createdAt: Timestamp;
}

export interface Post {
  id: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  authorName?: string;
  authorPhoto?: string;
  content: string;
  images?: string[];
  media?: { url: string; type: 'image' | 'video' }[];
  taggedUserIds?: string[];
  targets: string[];
  category: string;
  location?: {
    country: string;
    city: string;
  };
  likes: number; // For legacy
  likesCount?: number;
  commentsCount: number;
  reactionCounts?: { [key in ReactionType]?: number };
  myReaction?: ReactionType | null;
  scheduleId?: string;
  createdAt: Timestamp;
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  content: string;
  parentId?: string | null; // For nested comments (1-depth limit)
  repliesCount?: number;
  createdAt: Timestamp;
}

export interface FeedContext {
  scope: 'plaza' | 'group' | 'venue' | 'event';
  scopeId: string;    // e.g., 'tango', 'salsa' (for plaza) or groupId
  label?: string;
  category?: string;  // Optional category filter
  filters?: {
    enableRegion?: boolean;
    tags?: string[];
  };
}
