import { Timestamp } from 'firebase/firestore';

export type StayType = 'Couchsurfing' | 'Dormitory' | '1-Room' | '2-Room' | '3-Room' | 'Pension';

export interface Stay {
  id: string;
  title: string;
  type: StayType;
  description: string;
  location: string;
  distance?: string; // e.g., "0.5km away"
  pricePerNight: number;
  imageUrl: string;
  hostId: string;
  hostName: string;
  hostPhoto?: string;
  hostRating?: number;
  hostReviewCount?: number;
  hostRole?: string;
  amenities: string[]; // e.g., ["wifi", "desk", "coffee"]
  isCommunityChoice?: boolean;
  isNewlyListed?: boolean;
  createdAt: Timestamp;
}

export interface Booking {
  id: string;
  stayId: string;
  userId: string;
  userName: string;
  checkIn: Timestamp;
  checkOut: Timestamp;
  totalPrice: number;
  status: 'pending' | 'confirmed' | 'stayed' | 'cancelled';
  createdAt: Timestamp;
}
