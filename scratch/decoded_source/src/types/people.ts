export type PersonRole = 'Instructor' | 'Organizer' | 'Couple' | 'Touring' | 'Dancer';

export interface TourStop {
  city: string;
  country: string;
  month: string;
  event?: string;
}

export interface ActivityEntry {
  status: 'live' | 'upcoming' | 'past';
  label: string;
  location: string;
  title: string;
  description: string;
  cta?: string;
}

export interface MediaItem {
  type: 'VOD' | 'COURSE' | 'ARTICLE';
  title: string;
  subtitle: string;
  thumbnailUrl: string;
}

export interface Person {
  id: string;
  name: string;
  roles: PersonRole[];
  partnerName?: string;
  partnerPhotoUrl?: string;
  baseCity: string;
  baseCountry: string;
  currentCity?: string;
  currentCountry?: string;
  isLiveNow?: boolean;
  liveStatus?: string;
  heroImageUrl: string;
  profilePhotoUrl: string;
  title: string;               // e.g. "Master Instructor • Global Performer"
  bio: string;
  languages: string[];
  bookingNote?: string;
  style?: string;
  partnerSince?: string;
  festivalCount?: string;
  achievements: string[];
  activityFlow: ActivityEntry[];
  tourStops: TourStop[];
  mediaItems: MediaItem[];
  featuredVideoUrls: string[];
  globalImpact?: {
    award?: string;
    awardSub?: string;
    org?: string;
    orgSub?: string;
    classCount?: string;
    classReach?: string;
    appearances?: string;
  };
  authorId: string;
  authorName: string;
  authorPhoto?: string;
  createdAt?: string;
  updatedAt?: string;
}
