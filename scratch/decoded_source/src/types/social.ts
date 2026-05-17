import { Timestamp } from 'firebase/firestore';

export type SocialType = 'regular' | 'popup';

// Structured sub-event within a Social
export interface SocialSubEvent {
  id: string;
  title: string;
  description?: string;
  maxParticipants: number;          // 1~20
  currentParticipants?: number;     // Runtime count from reservations
}

export interface SocialDj {
  id: string;
  date: string; // YYYY-MM-DD
  djId?: string;
  djName: string;
}

export interface Social {
  id: string;
  type: SocialType;
  title: string;           // English title (required)
  titleNative?: string;    // Native language title (optional)
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
  district?: string;
  date?: Timestamp; // For popups
  dayOfWeek?: number; // 0-6, For regulars
  recurrence?: string; // e.g. "every", "1st", "2nd", "3rd", "4th", "last"
  description?: string;
  price?: string;
  socialEvents?: SocialSubEvent[];  // Structured sub-events (backward compat: old data may be string[])
  djName?: string;
  djNameNative?: string;
  djUpdatedAt?: Timestamp;          // When DJ info was last updated by Org
  djs?: SocialDj[];                 // Array of DJs with dates
  likesCount?: number;
  staffIds?: string[];              // Staff member userIds
  staffNames?: string[];            // Staff display names
  organizerPhone?: string;          // Organizer phone number
  tableCapacity?: number;           // Max table seats (for closure threshold)
  moments?: string[];               // Up to 20 images (Moments)
  posterLayoutId?: string;           // Selected poster template layout ID
  posterExportUrl?: string;          // Pre-generated poster image URL for quick download/share
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
  guests?: string[];
  notes?: string;
  selectedEventId?: string;         // Chosen SocialSubEvent ID (optional)
  weekStartDate: string;            // The event date for this week (YYYY-MM-DD) — weekly key
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Timestamp;
}

// Weekly table open/close state per social
export interface SocialWeeklyState {
  id?: string;                      // Doc ID = `{socialId}_{weekStartDate}`
  socialId: string;
  weekStartDate: string;            // YYYY-MM-DD (the event date of that week)
  isClosed: boolean;                // true when Org clicks "Close Table"
  closedAt?: Timestamp;
  closedBy?: string;                // Org userId
}
// Likes (Favorites)
export interface SocialLike {
  id: string;
  userId: string;
  socialId: string;
  status: 'liked' | 'pending' | 'in_progress';
  createdAt: Timestamp;
}
