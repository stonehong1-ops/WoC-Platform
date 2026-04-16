import { Timestamp } from 'firebase/firestore';

export type EventCategory = 'CONFERENCE' | 'WORKSHOP' | 'NETWORKING' | 'PARTY' | 'SOCIAL' | 'ADMIN';

export interface Event {
  id: string;
  title: string;
  description: string;
  category: EventCategory;
  location: string;
  locationEmoji?: string;
  startDate: Timestamp;
  endDate?: Timestamp;
  color?: string; // Optional custom color for calendar bars
  hostId: string;
  hostName: string;
  hostPhoto?: string;
  participants: string[];
  capacity?: number;
  imageUrl?: string;
  createdAt: Timestamp;
}
