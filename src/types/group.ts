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
  type: 'text' | 'image' | 'video' | 'question' | 'event' | 'info' | 'text-card';
  image?: string;
  video?: string;
  media?: string[];
  likes: number;
  comments: number;
  views: number;
  category?: string; // Board category ID
  createdAt: any;
  updatedAt?: any;
  tags?: string[];
  bgTheme?: string;
}

export interface Comment {
  id: string;
  author: Author;
  content: string;
  createdAt: any;
}

export interface Member {
  id: string;
  name: string;
  avatar: string;
  photoURL?: string;
  role?: string;
  joinedAt?: any;
  status?: 'active' | 'pending' | 'rejected';
}

export interface ServiceItem {
  title: string;
  description: string;
  icon: string;
  color: string;
}

export interface GallerySection {
  id: string;
  title: string;
  type: 'photos' | 'videos';
  media: string[];
}

export interface GroupBoard {
  id: string;
  title: string;
  permission: 'Only Admin' | 'Everyone';
  order: number;
}

export interface Group {
  id: string;
  name: string;
  nativeName?: string;
  slug?: string;
  story?: string;
  description?: string;
  services?: ServiceItem[];
  coverImage: string;
  coverImageDescription?: string;
  memberCount: number;
  posts: Post[];
  members: Member[];
  venueId?: string;
  ownerId?: string;
  updatedAt?: any;
  tags?: string[];
  logo?: string;
  gallery?: GallerySection[];
  storageUsed?: number; // in bytes
  representative?: {
    name: string;
    phone?: string;
    avatar?: string;
  };
  address?: string;
  detailedAddress?: string;
  publicTransport?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  socialLinks?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    website?: string;
  };
  membershipPolicy?: {
    joinStrategy: 'open' | 'approval' | 'invite';
    onboardingEnabled?: boolean;
  };
  boards?: GroupBoard[];
  staffPermissions?: {
    managePosts: boolean;
    manageMembers: boolean;
    viewAnalytics: boolean;
  };
  classes?: GroupClass[];
  discounts?: ClassDiscount[];
  monthlyPasses?: MonthlyPass[];
  shopItems?: ShopItem[];
  staySettings?: StaySettings;
  rentalSettings?: RentalSettings;
  activeServices?: ActiveServices;
}

export interface ShopItem {
  id: string;
  category: string;
  title: string;
  description: string;
  currency: string;
  price: number;
  images: string[];
  status: 'Active' | 'Stopped';
  createdAt: any;
}

export interface StaySettings {
  frequency: 'daily' | 'weekly' | 'monthly';
  minStay: number;
  currency: string;
  baseAmount: number;
  paymentMethod: 'bank_transfer' | 'credit_card';
  bankDetails?: {
    bankName: string;
    ownerName: string;
    accountNumber: string;
    swiftCode?: string;
    additionalDetails?: string;
  };
}

export interface RentalSettings {
  frequency: 'hourly' | 'daily';
  currency: string;
  baseAmount: number;
  paymentMethod: 'bank_transfer' | 'credit_card';
  bankDetails?: {
    bankName: string;
    ownerName: string;
    accountNumber: string;
    swiftCode?: string;
    additionalDetails?: string;
  };
}

export interface ActiveServices {
  class: boolean;
  shop: boolean;
  stay: boolean;
  rental: boolean;
  wellness?: boolean;
  dining?: boolean;
  office?: boolean;
  online?: boolean;
}

export interface ClassScheduleEntry {
  week: number;
  date: string;
  timeSlot: string;
  content: string;
}

export interface GroupClass {
  id: string;
  title: string;
  description: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced' | 'Masterclass';
  currency: string;
  amount: number;
  instructors: {
    name: string;
    avatar?: string;
    role: string;
  }[];
  schedule: ClassScheduleEntry[];
  status: 'Open' | 'Closed';
}

export interface ClassDiscount {
  id: string;
  title: string;
  description: string;
  currency: string;
  amount: number;
  discountDescription: string;
  includedClassIds: string[];
}

export interface MonthlyPass {
  id: string;
  title: string;
  description: string;
  currency: string;
  amount: number;
  includedClassIds: string[];
}

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startDate: any; // Timestamp, Date, or number (millis)
  endDate?: any;
  startTime?: string; // "18:00"
  endTime?: string;   // "20:00"
  location?: string;
  type: 'general' | 'class' | 'social' | 'milonga' | 'practice';
  color?: string;
  createdBy: string;
  createdAt: any;
}
export const DEFAULT_BOARDS: GroupBoard[] = [
  { id: 'notice', title: 'Notice', permission: 'Only Admin', order: 1 },
  { id: 'freetalk', title: 'Free Talk', permission: 'Everyone', order: 2 },
  { id: 'qna', title: 'Q&A', permission: 'Everyone', order: 3 },
];
