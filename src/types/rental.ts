export type RentalSpace = {
  id: string;
  hostId: string;
  groupId?: string; // Add groupId to associate space with a specific group
  title: string;
  description: string;
  location: string;
  address: string;
  images: string[];
  category: string; // e.g., '댄스 스튜디오', '파티룸', '연습실'
  pricePerHour: number;
  minHours: number;
  capacity?: number;
  size?: string;
  floorMaterial?: string;
  hasMirror?: boolean;
  studioName?: string;
  facilities: string[];
  rules: string;
  regularClasses: { day: number; start: string; end: string }[]; // day: 0 (Sun) - 6 (Sat)
  createdAt?: any;
  updatedAt?: any;
  likesCount?: number;
};

export type RentalLike = {
  userId: string;
  spaceId: string;
  createdAt: any;
};

export type RentalRequest = {
  id: string;
  spaceId: string;
  guestId: string;
  hostId: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  purpose: string;
  headcount: number;
  message: string;
  status: 'PENDING' | 'REVIEWING' | 'APPROVED' | 'CONFIRMED' | 'REJECTED';
  chatRoomId?: string;
  createdAt?: any;
};
