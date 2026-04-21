import { Timestamp } from "firebase/firestore";

export interface Author {
  id: string;
  name: string;
  avatar: string;
  role?: string;
}

export interface Post {
  id: string;
  author: Author;
  title?: string;
  content: string;
  type: 'text' | 'image' | 'video' | 'question' | 'event' | 'info';
  image?: string;
  likes: number;
  comments: number;
  createdAt: any; // Can be Timestamp or string
  tags?: string[];
  updatedAt?: any;
}

export interface Member {
  id: string;
  name: string;
  avatar: string;
}

export interface Community {
  id: string;
  name: string;
  description: string;
  coverImage: string;
  memberCount: number;
  posts: Post[];
  members: Member[];
  venueId?: string;
  ownerId?: string;
  updatedAt?: any;
  tags?: string[];
  logo?: string;
}
