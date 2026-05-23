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
  createdAt?: any;
  updatedAt?: any;
  email?: string;
  phoneNumber?: string;
  joinedGroups?: string[];
  lastVisitedAt?: any;
  authMethod?: string;
  career?: string;
  partnerStatus?: string;
  allowPhoneCalls?: boolean;
  allowChatNotifications?: boolean;
}

export interface PlatformUser extends UserProfile { }
