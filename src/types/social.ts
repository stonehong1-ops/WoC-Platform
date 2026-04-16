import { Timestamp } from 'firebase/firestore';

export type SocialType = 'regular' | 'popup';

export interface Social {
  id: string;
  type: SocialType;
  title: string;
  organizerId: string;
  organizerName: string;
  venueId: string;
  venueName: string;
  imageUrl: string;
  startTime: string; // e.g. "19:00"
  endTime: string; // e.g. "23:00"
  date?: Timestamp; // For popups
  dayOfWeek?: number; // 0-6, For regulars
  description?: string;
  djName?: string;
  createdAt: Timestamp;
}

export interface SocialFilter {
  organizers: string[];
  venues: string[];
  days: number[];
}
