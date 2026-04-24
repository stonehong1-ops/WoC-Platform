export interface UserProfile {
  id: string;
  nickname: string;
  nativeNickname?: string;
  photoURL?: string;
  role?: 'leader' | 'follower';
  isInstructor?: boolean;
  isSeller?: boolean;
  isStayHost?: boolean;
  isServiceProvider?: boolean;
  isAdmin?: boolean;
  isStaff?: boolean;
  systemRole?: 'admin' | 'staff' | 'member';
  createdAt?: any;
  updatedAt?: any;
  email?: string;
  phoneNumber?: string;
  joinedGroups?: string[];
}

export interface PlatformUser extends UserProfile { }
