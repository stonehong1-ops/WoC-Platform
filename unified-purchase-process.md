# 통합 구매 프로세스 (Unified Purchase Process) 아키텍처 및 구현 계획서

## 1. 개요 (Overview)
World of Community (WoC) 플랫폼은 현재 카드 결제가 지원되지 않으므로, 모든 결제/예약 도메인(Shop, Rental, Stay, Class)에서 **무통장 입금(Bank Transfer)** 기반의 표준화된 3단계 오프라인 결제 프로세스를 거쳐야 합니다.
기존 Shop(`PurchaseFlow.tsx`), Rental(`RentalRequestFlow.tsx`), Stay(`StayDetail.tsx`)의 동작 방식을 철저히 분석하여, 이 3단계 결제 흐름을 하나의 완벽한 통합 예약 엔진(Unified Purchase Pipeline)으로 구축합니다.

## 2. 핵심 3단계 결제 흐름 (3-Step Payment Flow)
Shop 분석 결과 도출된 가장 이상적인 UX 흐름으로, 모든 도메인의 결제 시 반드시 아래 절차를 따릅니다.

### 🟢 Step 1: 요약 및 신청 (Order Summary & Request)
- **UI 노출 항목 (Image 1 참조):** 선택한 상품/클래스 정보(사진, 제목, 옵션), 가격, 구매자의 연락처 입력란.
- **액션:** "Confirm" 버튼 클릭 시, 예약 데이터를 DB(Firestore)에 `PENDING` 상태로 생성.

### 🟢 Step 2: 입금 안내 (Payment Instructions)
- **UI 노출 항목 (Image 2 참조):** 결제 제한 시간 타이머(예: 1시간), 주문 번호, 플랫폼/호스트의 은행 계좌 정보(은행명, 계좌번호, 예금주), 정확한 송금 금액.
- **액션:** 유저가 실제 은행 앱을 통해 입금을 완료한 후, **"금액을 송금했습니다(I've Transferred the Payment)"** 버튼을 클릭.
- 이 버튼을 클릭해야만 상태가 `PAYMENT_REPORTED`(또는 `WAITING_CONFIRMATION`)로 업데이트됩니다.

### 🟢 Step 3: 알림 및 완료 (Notification & Complete)
- **시스템 액션:** 유저가 입금 완료를 선언하면, 시스템은 즉시 오너(호스트/판매자)에게 푸시 알림 및 채팅 메시지를 발송하여 "새로운 입금 확인 요청"이 있음을 알립니다.
- **UI 노출 항목:** 예약 접수 완료 성공 화면. (예: "주문이 접수되었습니다. 호스트가 결제를 확인하면 알려드립니다.")

---

## 3. 통합 아키텍처 컴포넌트

1. **`UnifiedPaymentFlow` (통합 결제 모달)**
   - 역할: 위 3단계 흐름을 시각적으로 관장하는 전역 결제 모달 컴포넌트.
   - 기능: 도메인(Class, Shop, Rental, Stay)에 관계없이 주문 내역, 금액, 계좌 정보를 입력받아 동일한 스텝으로 렌더링.
2. **`useBookingEngine` (공통 비즈니스 로직)**
   - 역할: DB 트랜잭션, 예약 데이터 생성, 오너 알림 및 FCM/Chat 발송 기능의 중앙 집중화.
3. **`notificationService` & `chatService`**
   - 예약 확정(Confirm) 등 오너의 액션에 따른 유저 알림.

---

## 4. 도메인별 구현 계획 (Action Plan)

### 🎯 4.1 Class (현재 진행 대상)
- **목표:** 일일 클래스(Daily Booking) 결제 시 기존 1단계 알림 처리 로직을 버리고, 통합된 3단계(Step 1 -> Step 2 -> Step 3) 흐름을 완벽 적용.
- **세부 작업:** 예약 버튼 클릭 시 `UnifiedPaymentFlow`를 호출하여 요약 -> 송금 안내 -> 송금 완료 선언 -> 오너 알림 절차가 문제없이 돌아가도록 `ClassPortal.tsx` 수정.

### 🎯 4.2 Shop (상점)
- 기존 `PurchaseFlow.tsx`가 이미 3단계 흐름을 가지고 있으나, 로직이 Shop에 종속되어 있음. 추후 `UnifiedPaymentFlow`와 `useBookingEngine`을 사용하도록 리팩토링.

### 🎯 4.3 Rental & Stay
- 현재 `RentalRequestFlow.tsx`와 `StayDetail.tsx`/Checkout 로직은 "문의(Inquire)" 또는 1단계 "Request"에 그치고 있음.
- **변경 사항:** Rental과 Stay 역시 시간/날짜 지정 후 결제를 진행할 때 동일한 3단계 무통장 입금 흐름을 거치도록 통합 모달로 교체.

---

## 5. 단계별 마일스톤
- [x] **Phase 1**: 기존 Shop, Rental, Stay 도메인의 결제/예약 흐름 분석 및 통합 3-Step 프로세스 확립.
- [ ] **Phase 2 (현재)**: 확립된 3단계 플로우를 `Class` 일일 예약(Daily Booking)에 적용. (UI 렌더링, 계좌 안내, 오너 채팅 알림 등 완벽 구현)
- [ ] **Phase 3**: Class 도메인 정상 작동 컨펌 후, Shop, Rental, Stay에 순차적으로 통합 엔진 및 모달 이식.

---

## 6. 통합 커뮤니케이션 프로세스 (Unified Communication Process)
기존의 알림 기반 액션 및 분산된 상태 확인 로직을 채팅(Chat) 중심으로 완전히 일원화하여 단순하고 명확한 UX를 제공합니다.

### 💬 6.1 알림(Notification) 단순화
- 알림은 오직 **정보 전달(Notice)** 역할만 수행합니다.
- 알림 목록 내부의 `Completed`, `Verify Payment` 등의 버튼이나 액션 가능한 배지는 모두 삭제합니다.
- 구매자에게 발송되는 알림 텍스트 예시: *"구매가 요청되었습니다. Chat > Market에서 진행상황을 확인할 수 있습니다."*

### 💬 6.2 채팅(Chat) 중심의 액션 및 커뮤니케이션
- 사용자가 구매/예약을 요청(입금 완료)하면, 구매자와 판매자 간의 채팅방(비즈니스 채널)에 즉시 시스템 메시지가 생성됩니다.
- **판매자 측 메시지:**
  - 주문/예약 요약 정보와 함께 **[거절(Reject)] / [승인(Approve)]** 버튼이 포함된 인터랙티브 메시지가 노출됩니다.
  - 판매자는 별도의 관리자 페이지나 알림 탭으로 이동할 필요 없이, 채팅창 안에서 즉시 상태를 변경할 수 있습니다.
- **액션 결과 메시지:**
  - **거절 클릭 시:** 구매자 채팅창으로 *"죄송합니다. 이 요청은 승인되지 않았습니다."* 메시지 전송 및 상태 취소.
  - **승인 클릭 시:** 구매자 채팅창으로 *"감사합니다. 최종 승인 되었습니다."* 메시지 전송 및 상태 확정.

이 단순화된 커뮤니케이션 절차를 **클래스 일강(Daily Class)**에 가장 먼저 시범 적용한 후 특강, 월강, Shop 등으로 확장합니다.
