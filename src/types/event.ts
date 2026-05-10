import { Timestamp } from 'firebase/firestore';

export type EventCategory = 'CONFERENCE' | 'WORKSHOP' | 'NETWORKING' | 'PARTY' | 'SOCIAL' | 'ADMIN';

// === Program (이벤트의 핵심 콘텐츠 — 클래스/밀롱가 일정) ===
export interface EventProgram {
  id: string;                      // "G1", "C1", "A1" 등 (오거나이저가 지정)
  title: string;                   // "Tango Salon"
  titleNative?: string;            // "탱고 살롱"
  description?: string;            // 영문 상세 설명
  type: 'class' | 'milonga';
  category?: string;               // "일반수업" / "파트너수업" / "세미나리오" (그룹핑용)

  // 일정
  dates: string[];                 // ["2026-07-02","2026-07-09","2026-07-16","2026-07-23"]
  startTime: string;               // "19:30"
  endTime: string;                 // "20:50"
  duration?: number;               // 분 (80분)

  // 수업 정보 (class)
  instructor?: string;
  level?: string;                  // "all" | "adv" | "intermediate" 등
  format?: 'partner_change' | 'fixed_partner' | 'solo';
  isRecommended?: boolean;         // 강사 추천 태그

  // 밀롱가 정보
  djName?: string;
  performanceTime?: string;        // "Special Performance 11:00 PM"

  // 정원
  maxParticipants: number;         // 0 = unlimited
  capacityUnit?: 'person' | 'couple'; // "15명" vs "12팀"

  // 가격 (프로그램별 개별 가격 — 있을 수도 없을 수도)
  price?: number;                  // 이 프로그램의 가격 (시리즈 전체 or 1회)
  priceUnit?: 'total' | 'per_session'; // 시리즈 전체가격 vs 회당가격
}

// === 가격 체계 (이벤트 레벨) ===
export interface EventPricing {
  currency: string;                // "KRW"

  // 2티어 가격 (예매가/현매가)
  classPrice?: {
    advance: number;               // 예매가 (₩45,000)
    door?: number;                 // 현매가 (₩50,000)
  };
  milongaPrice?: {
    advance: number;               // ₩25,000
    door?: number;                 // ₩30,000
  };
  fullPassPrice?: {
    advance: number;               // ₩260,000
    door?: number;
    label?: string;                // "워크숍 6 + 밀롱가"
  };
  privateLessonPrice?: number;

  // 할인
  earlyBirdDeadline?: string;      // ISO date (있으면 advance=early bird)
  multiClassDiscount?: {
    minClasses: number;
    discountPercent: number;
  }[];
}

// === 등록 ===
export type PassType = 'full_pass' | 'individual';

export interface EventRegistration {
  id?: string;
  userId: string;
  userName: string;
  userPhotoURL?: string;
  passType: PassType;
  selectedProgramIds: string[];    // ["G1","G3","S1"] 또는 full_pass면 전체
  totalAmount: number;
  discountApplied?: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  registeredAt: Timestamp;
  note?: string;
}

// === Artist (Maestro / DJ) ===
export interface EventArtist {
  id: string;
  name: string;
  role: 'maestro' | 'dj' | 'performer';
  photoUrl?: string;
  country?: string;
  bio?: string;
}

// === Event Venue (Multiple venues for festival) ===
export interface EventVenueItem {
  id: string;
  name: string;
  address?: string;
  photoUrl?: string;
  latitude?: number;
  longitude?: number;
}

// === Package (Class bundles) ===
export interface EventPackage {
  id: string;
  name: string;
  type?: 'single' | 'couple';  // Single or Couple
  description?: string;
  includedItems: string[];      // List of included events/classes
  includedWorkshopCount?: number;
  price: number;
  priceUsd?: number;
  currency?: string;
  totalTickets?: number;
  soldTickets?: number;
  photoUrl?: string;
}

// === Schedule Day (Timetable image per day) ===
export interface EventScheduleDay {
  dayLabel: string;              // "Day 1", "Day 2", etc.
  date?: string;                 // "2026-06-19"
  timetableImageUrl?: string;    // Uploaded timetable image
}

// === Event ===
export interface Event {
  id: string;
  title: string;           // English title (required)
  titleNative?: string;    // Native language title (optional)
  subtitle?: string;       // "Improvisation & Dynamics"
  description: string;
  category: EventCategory;
  location: string;
  locationEmoji?: string;
  startDate: Timestamp;
  endDate?: Timestamp;
  color?: string; // Optional custom color for calendar bars
  hostId: string;
  hostName: string;
  hostNameNative?: string;
  hostPhoto?: string;
  participants: string[];
  capacity?: number;
  imageUrl?: string;
  createdAt: Timestamp;

  // 프로그램 & 가격
  programs?: EventProgram[];
  pricing?: EventPricing;
  programViewMode?: 'by_date' | 'by_category'; // 프로그램 탭 뷰 모드

  // 장소 & 주최자 정보 (소셜과 통일)
  venueId?: string;
  venueName?: string;
  venueNameNative?: string;
  organizerPhone?: string;
  staffIds?: string[];
  staffNames?: string[];

  // 새 섹션 데이터
  galleryImages?: string[];           // 갤러리 사진들 (메인 이미지 외)
  artists?: EventArtist[];            // 아티스트 (Maestro / DJ)
  eventVenues?: EventVenueItem[];     // 이벤트 베뉴 (복수)
  packages?: EventPackage[];          // 패키지 (클래스 번들)
  scheduleDays?: EventScheduleDay[];  // 스케줄 (일별 시간표 이미지)

  // 기타
  dressCode?: string;
  websiteUrl?: string;
  registrationUrl?: string;       // 외부 등록 폼 (tally.so 등)
  bankInfo?: string;              // 입금 계좌 정보
  tag?: string;                   // 피드/라이브용 태그 정보 (예: 특정 아티스트나 그룹 식별자)
}
