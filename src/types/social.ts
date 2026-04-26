import { Timestamp } from 'firebase/firestore';

export type SocialType = 'regular' | 'popup';

export interface Social {
  id: string;
  type: SocialType;
  title: string;
  titleEn?: string; // English title
  titleNative?: string; // Native language title (e.g. Korean, Spanish)
  organizerId: string;
  organizerName: string;
  organizerNameNative?: string;
  venueId: string;
  venueName: string;
  venueNameNative?: string;
  imageUrl: string;
  startTime: string; // e.g. "19:00"
  endTime: string; // e.g. "23:00"
  country?: string; // Location filter
  city?: string;    // Location filter
  date?: Timestamp; // For popups
  dayOfWeek?: number; // 0-6, For regulars
  recurrence?: string; // e.g. "every", "1st", "2nd", "3rd", "4th", "last"
  description?: string;
  price?: string;
  socialEvents?: string[]; // Titles only
  djName?: string;
  djNameNative?: string;
  createdAt: Timestamp;
}

export interface SocialFilter {
  organizers: string[];
  venues: string[];
  days: number[];
}

export interface SocialReservation {
  id?: string;
  socialId: string;
  userId: string;
  userName: string;
  userPhotoURL?: string;
  peopleCount: number;
  guests: string[];
  notes: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Timestamp;
}
