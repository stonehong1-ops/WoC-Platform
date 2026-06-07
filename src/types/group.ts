import { Timestamp } from "firebase/firestore";
import { ShopSettings } from "./shop";

export interface Author {
  id: string;
  name: string;
  avatar: string;
  role?: string;
}

export interface GroupPost {
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
  createdAt: Timestamp | Date | number | null;
  updatedAt?: Timestamp | Date | number | null;
  tags?: string[];
  taggedUserIds?: string[];
  postTags?: { id: string; label: string; kind: string; photo?: string }[];
  bgTheme?: string;
}
/** @deprecated Use GroupPost instead */
export type Post = GroupPost;

export interface GroupComment {
  id: string;
  author: Author;
  content: string;
  createdAt: Timestamp | Date | number | null;
}
/** @deprecated Use GroupComment instead */
export type Comment = GroupComment;

export interface Member {
  id: string;
  name: string;
  avatar: string;
  photoURL?: string;
  role?: string;
  joinedAt?: Timestamp | Date | number | null;
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
  aboutPhotos?: string[];
  memberCount: number;
  posts: GroupPost[];
  members: Member[];
  venueId?: string;
  ownerId?: string;
  updatedAt?: Timestamp | Date | number | null;
  tags?: string[];
  logo?: string;
  gallery?: GallerySection[];
  storageUsed?: number; // in bytes
  representative?: {
    name: string;
    localName?: string;
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
  operatingHours?: {
    label: string;
    time: string;
  }[];
  houseRules?: string[];
  boards?: GroupBoard[];
  staffPermissions?: {
    managePosts: boolean;
    manageMembers: boolean;
    viewAnalytics: boolean;
  };
  classes?: GroupClass[];
  discounts?: ClassDiscount[];
  /** @deprecated Use independent collection */
  shopItems?: ShopItem[];
  /** @deprecated Use independent collection */
  stayRooms?: StayRoom[];
  bankName?: string;
  accountHolder?: string;
  accountNumber?: string;
  memberIds?: string[];
  staySettings?: StaySettings;
  shopSettings?: ShopSettings;
  rentalSettings?: RentalSettings;
  activeServices?: ActiveServices;
  classPaymentSettings?: {
    paymentMethods: {
      bankTransfer: boolean;
      creditCard: boolean;
      overseas: boolean;
    };
    bankDetails?: {
      bankName: string;
      accountHolder: string;
      accountNumber: string;
    };
    closedMonths?: string[];
    openMonths?: string[];
  };
  bankDetails?: {
    bankName: string;
    accountHolder: string;
    accountNumber: string;
  };
  businessRegistrationNumber?: string;
  representativeName?: string;
  isPublished?: boolean;
  headerThemeColor?: string;
  selectedFunctions?: string[];
  menuOrder?: { id: string; type: 'item' | 'divider'; icon?: string; label?: string }[];
}

export interface ShopItem {
  id: string;
  category: string;
  title: string;
  description: string;
  brand?: string;
  currency: string;
  price: number;
  discountPrice?: number;
  images: string[];
  status: 'Active' | 'Stopped';
  createdAt: Timestamp | null;
  options?: string[]; // e.g., ["250", "260", "270"] or ["S", "M", "L"]
  stock?: number;
}

export interface StayRoom {
  id: string;
  title: string;
  description: string;
  
  // Step 1: Space Details
  roomType: string;
  buildingType?: string; // e.g. 아파트, 오피스텔, 빌라, 단독주택
  structure?: string; // e.g. 원룸, 투룸, 쓰리룸+
  floor?: string; // e.g. 1층, 2층, 반지하, 옥탑
  address?: string;
  detailedAddress?: string;
  capacity: number;
  
  // Step 2: Rent & Fees
  currency?: string;
  price: number; // base rent (e.g. monthly)
  discountPrice?: number;
  deposit?: number;
  cleaningFee?: number;
  managementFee?: number;
  includedUtilities?: string[]; // e.g. 전기, 가스, 수도, 인터넷
  
  // Step 3: Options & Amenities
  amenities?: string[];
  parkingPolicy?: string; // e.g. 불가, 1대 무료, 유료
  
  // Step 4: Rules & Policies
  rules?: string[]; // e.g. 반려동물 불가, 실내 흡연 금지
  minStay?: number; // minimum stay duration in days or months
  maxStay?: number;
  
  images: string[];
  status: 'Active' | 'Stopped';
  createdAt: Timestamp | null;
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
  currency: string;
  rentalInfo: string;
  pricePalette: {
    tier1: number;
    tier2: number;
    tier3: number;
    tier4: number;
    tier5: number;
    tier6: number;
    tier7: number;
  };
  timeGrid: {
    [day: number]: string[]; // 0-6 for Mon-Sun, 24 elements for 0-23 hours
  };
}

export interface ActiveServices {
  class: boolean;
  shop: boolean;
  stay: boolean;
  rental: boolean;
  beauty?: boolean;
  wellness?: boolean;
  restaurant?: boolean;
  cafe?: boolean;
  office?: boolean;
  online?: boolean;
}

export interface ClassScheduleEntry {
  week: number;
  date: string | null;
  timeSlot: string;
  content: string;
}

export interface GroupClass {
  id: string;
  groupId?: string;
  title: string;
  description: string;
  level: 'Basic' | 'Beginner' | 'Intermediate' | 'Advanced' | 'Masterclass';
  currency: string;
  /** @deprecated Use price */
  amount: number;
  price?: number;
  instructors: {
    name: string;
    avatar?: string;
    role: string;
    userId?: string;
  }[];
  schedule: ClassScheduleEntry[];
  status: 'Open' | 'Closed';
  
  // Fields added to match legacy registration form
  targetMonth?: string; // e.g. "2026-05"
  imageUrl?: string;
  videoUrl?: string;
  instructorProfile?: string;
  classType?: 'Change Class' | 'Partner Class' | string;
  leaderCount?: number;
  followerCount?: number;
  maxCapacity?: number;
  startTime?: string;
  endTime?: string;
  todayLeaderRemaining?: number;
  todayFollowerRemaining?: number;
  isTodayBookingClosed?: boolean;
  isDailyBookingOpen?: boolean;
  instructorComment?: string;
  dailyClassPrice?: number;
  
  // Newly added fields
  bankName?: string;
  accountNumber?: string;
  accountHolder?: string;
  location?: string;
  registrationOpenDate?: string;
  registrationCloseDate?: string;
  notice?: string;
  feedbacks?: unknown[];
  weeklyMedia?: Record<string, { videoUrl?: string; imageUrl?: string }>;
}

export interface ClassDiscount {
  id: string;
  groupId?: string;
  title: string;
  description: string;
  currency: string;
  amount: number;
  discountDescription: string;
  includedClassIds: string[];
  targetMonth?: string;
  imageUrl?: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startDate: Timestamp | Date | number | null; // Timestamp, Date, or number (millis)
  endDate?: Timestamp | Date | number | null;
  startTime?: string; // "18:00"
  endTime?: string;   // "20:00"
  location?: string;
  type: 'general' | 'class' | 'social' | 'milonga' | 'practice' | 'rental';
  color?: string;
  createdBy: string;
  createdAt: Timestamp | Date | number | null;
  weekPlans?: string[];
  org?: string;
  dj?: string;
}
export const DEFAULT_BOARDS: GroupBoard[] = [
  { id: 'notice', title: 'Notice', permission: 'Only Admin', order: 1 },
  { id: 'freetalk', title: 'Free Talk', permission: 'Everyone', order: 2 },
  { id: 'qna', title: 'Q&A', permission: 'Everyone', order: 3 },
];

export interface ClassRegistration {
  id: string;
  classId: string;
  groupId: string;
  userId: string;
  classTitle: string;
  applicantName: string;
  userAvatar?: string;
  role?: 'Leader' | 'Follower' | 'Couple';
  status: 'PAYMENT_PENDING' | 'PAYMENT_REPORTED' | 'PAYMENT_COMPLETED' | 'CANCELED';
  amount: number;
  currency: string;
  depositorName?: string;
  depositDate?: string;
  appliedAt: Timestamp | null;
  updatedAt: Timestamp | null;
  confirmedAt?: Timestamp | null;          // 관리자가 접수 완료 처리 시 (향후 구현)
  itemType?: 'class' | 'discount';  // 신규 등록 시 저장
  groupName?: string;         // 신규 등록 시 저장
  contactNumber?: string;
  partnerName?: string; // For couple registrations
  selectedClassIds?: string[]; // Custom selection for bundles
  adminMemo?: string;
  applicantMemo?: string;
  paymentAmount?: number;
  paymentStatus?: 'pending' | 'reported' | 'completed' | 'canceled';
  orderNumber?: string;
  participatingClassPartners?: Record<string, string>;
  attendance?: Record<number, boolean>;
  imageUrl?: string;
}

