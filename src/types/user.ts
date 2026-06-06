import { Timestamp } from 'firebase/firestore';

export interface UserProfile {
  id: string;
  nickname: string;
  nativeNickname?: string;
  photoURL?: string;
  gender?: string;
  role?: 'leader' | 'follower';
  isInstructor?: boolean;
  isOrganizer?: boolean;
  isDj?: boolean;
  isServiceProvider?: boolean;
  isSeller?: boolean;
  isAdmin?: boolean;
  isStaff?: boolean;
  isStayHost?: boolean;
  systemRole?: 'admin' | 'staff' | 'member';
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
  email?: string;
  phoneNumber?: string;
  joinedGroups?: string[];
  lastVisitedAt?: Timestamp | null;
  authMethod?: string;
  career?: string;
  partnerStatus?: string;
  allowPhoneCalls?: boolean;
  phone?: string;
  contactNumber?: string;
  fcmTokens?: string[];
  language?: string;
  countryCode?: string;
  likedClassIds?: string[];
  likedStayIds?: string[];
  notificationSnoozedUntil?: Timestamp | null;
}

export interface PlatformUser extends UserProfile { }
