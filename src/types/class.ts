import { Timestamp } from 'firebase/firestore';

// ─── WocClass: 최상위 독립 클래스 객체 ───
// Class는 독립된 최상위 객체로, Group에 종속되지 않음.
// Instructor는 교육 주체, Organizer는 신청·결제·승인 주체(= Booking SELLER).

export interface WocClassSession {
  id: string;
  date: string;          // YYYY-MM-DD
  startTime: string;     // HH:MM
  endTime: string;       // HH:MM
}

export interface WocClassSchedule {
  recurrenceType: 'none' | 'weekly';
  startDate: string;     // YYYY-MM-DD
  endDate?: string;      // YYYY-MM-DD
  dayOfWeek?: number;    // 0-6 (일-토)
  startTime?: string;    // HH:MM
  endTime?: string;      // HH:MM
}

export interface WocClassPricing {
  currency: 'KRW' | 'USD';
  dropIn?: number;       // 1회 참가비
  bundle?: number;       // 패키지 등록비
}

export interface WocClass {
  id: string;

  // 기본 정보
  type: 'regular' | 'special';
  title: string;
  description?: string;
  level?: 'Basic' | 'Beginner' | 'Intermediate' | 'Advanced' | 'Masterclass';
  imageUrl?: string;

  // 교육 주체 (강사)
  instructorIds: string[];

  // 비즈니스 운영 주체 (= Booking의 SELLER)
  organizerType: 'person' | 'group';
  organizerId: string;

  // 장소
  venueId?: string;
  location?: string;  // 간단한 텍스트 (venueId 미지정 시 사용)

  // 홍보 연동 캐시 (승인 완료된 그룹 ID 목록)
  // 클라이언트 직접 변경 차단 — 관리자 batch transaction 또는 서버 API로만 갱신
  connectedGroupIds: string[];

  // 스케줄
  schedule: WocClassSchedule;

  // 개별 세션
  sessions: WocClassSession[];

  // 가격
  pricing: WocClassPricing;

  // 상태
  status: 'Open' | 'Closed';

  // 복제 및 월 관리
  sourceClassId?: string;
  targetMonth?: string;    // YYYY-MM

  // ─── 하위 호환성 및 De-normalization 필드 ───
  // 기존 GroupClass 카드 렌더링 및 예약 시스템과의 100% 호환을 보장하기 위한 역정규화 데이터
  instructors?: {
    name: string;
    avatar?: string;
    role: string;
    userId?: string;
  }[];
  amount?: number;           // 패키지 또는 drop-in 가격 (amount/price 동시 대응)
  price?: number;            // 패키지 또는 drop-in 가격
  dailyClassPrice?: number;  // 1회 drop-in 가격

  // 메타
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}


// ─── ClassGroupConnection: 클래스-그룹 연동 관계 ───
// 플랫폼 통합 승인 워크플로우(BookingStatus) 규격을 재사용.

export type ClassGroupConnectionStatus = 'SUBMITTED' | 'SELLER_CONFIRMED' | 'SELLER_REJECTED';

export interface ClassGroupConnection {
  id: string;
  classId: string;
  groupId: string;

  status: ClassGroupConnectionStatus;

  requestedBy: string;
  approvedBy?: string;

  createdAt: Timestamp;
  updatedAt: Timestamp;
}
