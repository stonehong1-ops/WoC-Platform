import { Timestamp } from 'firebase/firestore';

// ──────────────────────────────────────
// Stay Types
// ──────────────────────────────────────

export type StayType = 'Couchsurfing' | 'Dormitory' | '1-Room' | '2-Room' | '3-Room' | 'Pension';

export interface StayLocation {
  address: string;
  city: string;
  district: string;
  mapImageUrl?: string;
}

export interface StayPricing {
  currency: string;          // "KRW" | "USD"
  baseRate: number;          // 1박 기본 요금
  weekendSurcharge?: number;
  extraPersonFee?: number;
  cleaningFee?: number;
  baseGuests?: number;
}

export interface StayPaymentMethod {
  type: 'bank_domestic' | 'bank_international' | 'card';
  enabled: boolean;
  bankName?: string;
  accountNumber?: string;
  holderName?: string;
  swiftCode?: string;        // 해외 송금용
}

export interface StayPayment {
  methods: StayPaymentMethod[];
  transferDeadlineHours: number; // 입금 기한 (시간)
}

export interface StayCancellation {
  fullRefundHours: number;
  policyText: string;
}

export interface StayHost {
  userId: string;
  name: string;
  photo: string;
  bio?: string;
  rating?: number;
  reviewCount?: number;
  contacts?: {
    phone?: string;
    whatsapp?: string;
    facebook?: string;
    instagram?: string;
  };
}

export interface StayGuides {
  roomFeatures?: string;
  gettingHere?: string;
  facilityGuide?: string;
}

export interface StaySmsTemplates {
  paymentRequest?: string;   // 입금 요청 템플릿
  confirmed?: string;        // 계약 확정 템플릿
  doorCode?: string;         // 비밀번호 전송 템플릿
}

export interface Stay {
  id: string;
  groupId: string;            // FK → groups/{groupId}
  title: string;
  nativeTitle?: string;
  headline?: string;
  type: StayType;
  location: StayLocation;
  pricing: StayPricing;
  images: string[];
  guides?: StayGuides;
  checkInTime: string;        // "15:00"
  checkOutTime: string;       // "11:00"
  checkInMethod?: string;     // "Self check-in with door code"
  maxGuests: number;
  doorCode: string;           // 기본 "9999"
  payment: StayPayment;
  cancellation?: StayCancellation;
  host: StayHost;
  smsTemplates?: StaySmsTemplates;
  tags?: string[];
  amenities?: string[];
  isActive: boolean;
  isCommunityChoice?: boolean;
  isNewlyListed?: boolean;
  likesCount?: number;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

export interface StayLike {
  id: string;
  userId: string;
  stayId: string;
  status?: 'liked' | 'pending' | 'in_progress'; // 비즈니스 파이프라인 상태
  createdAt: any; // Timestamp
  updatedAt?: any; // Timestamp
}


// ──────────────────────────────────────
// Stay Booking Types
// ──────────────────────────────────────

export type StayBookingStatus =
  | 'APPLIED'               // ① 손님이 예약 신청
  | 'PAYMENT_REQUESTED'     // ② 관리자가 입금 요청 SMS 발송
  | 'PAID'                  // ③ 손님 입금 → 관리자 확인
  | 'CONFIRMED'             // ④ 계약 확정 + 확정 SMS + 캘린더 반영
  | 'CODE_SENT'             // ⑤ 체크인 당일 비밀번호 SMS 발송
  | 'COMPLETED'             // ⑥ 숙박 완료
  | 'REJECTED'              // 관리자 거절
  | 'CANCELLED';            // 손님 취소

export interface BookingStatusHistoryEntry {
  status: StayBookingStatus;
  changedAt: any;            // Timestamp
  changedBy: string;         // userId
  note?: string;
}

export interface BookingSmsLogEntry {
  type: 'applied' | 'payment_request' | 'confirmed' | 'door_code';
  sentAt: any;               // Timestamp
  sentBy: string;            // 발송자 userId
  to: string;                // 수신 전화번호
  message: string;
  status?: 'SUCCESS' | 'FAILED';
  errorMessage?: string;
}

export interface BookingPricing {
  currency: string;
  baseTotal: number;         // baseRate × nights
  weekendSurcharge?: number;
  cleaningFee?: number;
  extraPersonFee?: number;
  grandTotal: number;
}

export interface BookingPaymentInfo {
  method: 'bank_domestic' | 'bank_international';
  bankName?: string;         // Snapshot of bank name
  accountNumber?: string;    // Snapshot of account number
  holderName?: string;       // Snapshot of holder name
  depositorName?: string;    // 입금자명
  depositDate?: string;      // 입금 예정일
  transferredAt?: any;       // 실제 입금 시각 (Timestamp)
  confirmedAt?: any;         // 관리자 확인 시각 (Timestamp)
}

export interface StayBooking {
  id: string;
  stayId: string;            // FK → stays/{stayId}
  groupId: string;           // FK → groups/{groupId} (Manager Todo 필터)
  stayTitle: string;         // 비정규화

  // 사용자 정보
  userId: string;
  applicantName: string;
  userAvatar?: string;
  contactNumber: string;     // SMS 발송 대상

  // 예약 정보
  checkIn: any;              // Timestamp
  checkOut: any;             // Timestamp
  nights: number;
  guests: number;

  // 가격
  pricing: BookingPricing;

  // 결제
  payment: BookingPaymentInfo;

  // 상태
  status: StayBookingStatus;
  statusHistory: BookingStatusHistoryEntry[];
  smsLog: BookingSmsLogEntry[];

  appliedAt: any;            // Timestamp
  updatedAt: any;            // Timestamp
}


// ──────────────────────────────────────
// Manager 통합 Todo 타입
// ──────────────────────────────────────

export type ServiceBadgeType = 'CLASS' | 'STAY' | 'RENTAL';

export interface UnifiedTodoItem {
  id: string;
  serviceType: ServiceBadgeType;
  applicantName: string;
  userAvatar?: string;
  depositorName?: string;
  depositDate?: string;
  itemTitle: string;           // 클래스명 or Stay명
  itemDetail?: string;         // "3 nights" | "2시간"
  groupId: string;
  status: string;
  appliedAt: any;
  contactNumber?: string;      // SMS 발송용
  // 원본 참조
  sourceCollection: 'class_registrations' | 'stay_bookings';
  sourceId: string;
  sourceData?: any;            // 원본 데이터 전체 (액션 처리용)
}
