import { Timestamp } from 'firebase/firestore';

export type BookingStatus = 
  | 'PENDING'               // Legacy
  | 'WAITING_CONFIRMATION'  // Legacy
  | 'CONFIRMED'             // Legacy
  | 'CANCELLED'             // 사용자 또는 타임아웃에 의한 취소
  | 'REFUNDED'              // 환불
  | 'SUBMITTED'             // 신규: 신청/제출 완료
  | 'BANK_TRANSFERRED'      // 신규: 송금 완료 (확인 대기)
  | 'SELLER_CONFIRMED'      // 신규: 판매자 승인 완료
  | 'SELLER_REJECTED'       // 신규: 판매자 거절
  | 'DELIVERED';            // 신규: 배송/전달 완료

export type BookingDomain = 
  | 'shop' 
  | 'rental' 
  | 'stay' 
  | 'class_4w' 
  | 'class_daily' 
  | 'class_pass'
  | 'resale' 
  | 'events'
  | 'class_special';

export interface BaseBooking {
  id: string;               // 예약/주문 ID
  domain: BookingDomain;    // 도메인 (Shop, Rental 등)
  
  itemId: string;           // 상품/클래스/숙소 ID
  itemName: string;         // 아이템 이름
  itemImageUrl?: string;    // 아이템 이미지
  
  buyerId: string;          // 구매자/신청자 ID
  buyerName: string;        // 구매자 이름
  
  hostId: string;           // 판매자/호스트 ID (알림 발송 및 확정 권한)
  
  totalAmount: number;      // 총 금액
  currency: string;         // 통화 (e.g. KRW)
  
  status: BookingStatus;    // 예약 상태
  
  // 상태 변경 기록
  createdAt: Timestamp;
  updatedAt: Timestamp;
  confirmedAt?: Timestamp;
  cancelledAt?: Timestamp;
  
  // 옵션 데이터 (도메인별 특수 데이터. 엔진은 이 데이터를 그대로 저장만 함)
  payload: Record<string, any>; 
}

export interface UnifiedCheckoutData {
  itemId: string;
  itemName: string;
  itemImageUrl?: string;
  hostId: string;
  totalAmount: number;
  currency: string;
  domain: BookingDomain;
  payload: Record<string, any>;
}
