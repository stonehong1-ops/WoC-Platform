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
  platform?: string;
  language?: string;
  countryCode?: string;
  likedClassIds?: string[];
  likedStayIds?: string[];
  notificationSnoozedUntil?: Timestamp | null;
  socialLinks?: {
    facebook?: string;
    instagram?: string;
    whatsapp?: string;
  };
}

export interface PlatformUser extends UserProfile { }

/**
 * 공개 프로필 projection (`publicProfiles/{uid}`).
 *
 * Firestore 는 문서 단위로 읽히므로 보안 규칙만으로는 한 문서 안의 특정 필드를 숨길 수 없다.
 * 따라서 민감 정보는 규칙이 아니라 **컬렉션 분리**로 차단한다.
 * email / phoneNumber / fcmTokens / countryCode(전화 국가번호) / 권한 필드는
 * 이 타입에 존재하지 않으며, 원본 `users/{uid}` 에만 남는다.
 *
 * 전화번호가 필요한 화면은 이 projection 이 아니라 `allowPhoneCalls` 동의를 확인하는
 * 별도의 서버 경로를 통해야 한다.
 */
export interface PublicProfile {
  id: string;
  nickname: string;
  nativeNickname?: string;
  photoURL?: string;
  gender?: string;
  role?: 'leader' | 'follower';
  career?: string;
  partnerStatus?: string;
  language?: string;
  isInstructor?: boolean;
  isOrganizer?: boolean;
  isDj?: boolean;
  isServiceProvider?: boolean;
  isSeller?: boolean;
  isStayHost?: boolean;
  socialLinks?: {
    facebook?: string;
    instagram?: string;
    whatsapp?: string;
  };
  updatedAt?: Timestamp | null;
}
