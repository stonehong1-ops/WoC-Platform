# WoC - Claude 인수인계 문서 (To Claude)
> 최종 업데이트: 2026-05-02 KST

## 🚨 최우선 진행 과제: 전역 UI/UX 디자인 표준화 및 핵심 비즈니스 프로세스 연동

### 배경
- Shop 상세페이지(ProductDetail.tsx) 및 Resale 상세(ResaleItemDetail.tsx) 디자인 표준화가 성공적으로 완료됨. 
- Stitch 디자인 시스템의 의존도를 적절히 낮추고 직접 Tailwind 유틸리티를 활용하여 퀄리티 높은 디자인 패턴이 확립됨.
- 이제 확립된 디자인 패턴과 공통 UI 컴포넌트를 **나머지 서비스 모듈(Class, Stay, Rental, Group 등)**에 적용하여 플랫폼 전체의 디자인 퀄리티를 상향 평준화해야 함.
- 디자인 고도화와 병행하여, 현재 분절되어 있는 **알림, 채팅, 결제/쿠폰 등 핵심 비즈니스 로직**을 '공통 모듈'로 통합하고 실제 동작하도록 연동하는 것이 최우선 목표.

### 최근 완료된 주요 작업 (26년 4월 말 ~ 5월 초)
- [x] **Shop (ProductDetail)**: 갤러리 뷰어, Scarcity Bar, Fit & Options 박스, 픽업/배송 라디오 등 상세페이지 고도화 완료.
- [x] **Resale (ResaleItemDetail)**: Shop 모듈과 동일한 미학 적용(Like 통계 버튼 UI 표준화, 중복 FAB 제거 등).
- [x] **공통 UI 컴포넌트 세트 구축**: `SectionCard`, `InfoRow`, `RadioSelector`, `ChipSelector`, `CollapseSection` 등.
- [x] **Shop 구매 플로우(PurchaseFlow)**: Order Summary → Payment Instructions (타이머) → Order Complete의 상태 라이프사이클 구축.
- [x] **Group 기능 고도화**: 그룹별 서비스 토글 설정, 클래스 스케줄 데이터 바인딩, 그룹 커버 이미지 표준화.

---

## 💼 플랫폼 비즈니스 프로세스 (현재 로직 현황)

### 1. Shop 구매/주문 프로세스 (Order Status Lifecycle)
주문의 상태는 아래 흐름을 따릅니다:
`PENDING` → `CONFIRMED` → `IN_PRODUCTION` → `READY_PICKUP` / `SHIPPING` → `COMPLETED`
- `EXPIRED`: 1시간 내 입금 미확인 시 자동 만료
- `CANCELLED`: 사용자 또는 관리자에 의한 수동 취소
- **Next Step**: 결제 상태 자동 연동 및 상태 전환 시 통합 알림(Notification) 모듈을 통한 유저 리마인드.

### 2. Resale (중고거래) 프로세스
- **Flow**: 상품 탐색 → 상품 상세(ResaleItemDetail) 조회 → 'Like' 찜하기(Wishlist) 등록 / 'Chat with Seller' (판매자 채팅) 진행
- **Next Step**: 'Chat with Seller' 터치 시 새로운 채팅방을 생성함과 동시에, 해당 상품의 정보를 시스템 메시지 형태로 톡방에 자동 전송하는 기능. 실시간 `isLiked` 상태 동기화 처리.

### 3. Class (클래스) / Stay (숙박) / Rental (대관) 신청 프로세스
- **Flow**: 사용자 예약/신청 → 신청 내역 (History 모듈) 확인 → 호스트 승인 및 확정
- **현황**: Class의 Monthly Pass 등록 기능 및 내역 조회는 정상화됨.
- **Next Step**: 예약/신청을 진행하는 각 엔드 유저 뷰(클래스/스테이/렌탈 상세 페이지)를 Shop/Resale 수준의 고퀄리티 UI로 일괄 개편.

---

## 📦 공통 UI 컴포넌트 리스트 (`src/components/ui/`)
- `SectionCard.tsx`: 박스 형태의 카드 (헤더 + 본문 콘텐츠 영역)
- `InfoRow.tsx`: 아이콘 + 제목 + 설명으로 이루어진 정보 안내 행
- `RadioSelector.tsx`: 옵션 선택용 라디오 버튼 그룹 (Store Pickup / Delivery 등)
- `ChipSelector.tsx`: 사이즈, 색상 등 옵션 선택용 칩 형태 UI
- `FullScreenModal.tsx`: 풀스크린 오버레이 베이스 컨테이너
- `CollapseSection.tsx`: 아코디언 방식의 접기/펼치기 영역 (Size Guide, Description 등)

---

## 🔗 통합 구축이 필요한 핵심 공통 모듈 (Common Modules)
> 개별 페이지에 흩어져 있는 비즈니스 로직을 플랫폼 전역에서 재사용 가능한 하나의 모듈로 통합하는 작업

| 우선순위 | 모듈명 | 목표 (기능 요건) | 현황 |
|--------|-------|------|------|
| **1순위** | **채팅 생성 연동 (Chat Init)** | 상품 문의, 서비스 문의 시 1:1 채팅방 자동 생성 및 유저가 보고 있던 대상 아이템의 정보(Summary Card)를 첫 메시지로 자동 첨부 | 버튼 UI만 존재, 실제 연동 개발 필요 |
| **2순위** | **실시간 알림 (Notification)** | 주문 상태 변경, 채팅 메시지 수신, 클래스 확정 시 시스템 전체 통합 알림 및 뱃지 카운트 발송 | 개별 구현 파편화, 통합 필요 |
| 3순위 | **쿠폰 및 리워드 (Coupon)** | 재구매 쿠폰 발급/적용 여부/만료 처리 등 쿠폰 라이프사이클 공통화 | DB 스키마 필드만 존재, 미구현 |
| 4순위 | **좋아요 및 댓글 (Like/Comment)** | 홈 화면의 카툰 좋아요/댓글 UI를 디자인 기준으로 삼아 전체 통합형 바텀시트 개발 적용 | 홈 모듈 일부만 존재 |
| 5순위 | **공유하기 (Web Share)** | Web Share API 기반의 고유 링크 생성, 클립보드 복사 및 SNS 플랫폼 공유 로직 통합 | 기능 부재 |

---

## ⚠️ 절대 규칙 (AI & Developer Rules)
1. `tailwind.config.ts` **절대 수정 금지** — 변경 시 디자인 시스템 전체가 붕괴되는 성역 파일.
2. **Zero Design Deviation (디자인 0픽셀 편차 원칙)** — 제공된 원본 HTML 레이아웃 구조, 클래스 체계 및 에셋 보존 필수. 코드 효율성보다 디자인 원본 유지가 최우선.
3. **English Only** — 글로벌 플랫폼 특성상, 프로덕션 서비스의 모든 UI 텍스트는 영문 작성 원칙.
4. **Approval First** — 코드 작업(기능 추가/수정) 시작 전, 반드시 구현 계획(마크다운 형태 등)을 제시하고 스토니의 명시적인 승인을 득할 것.
5. **Auto Deployment** — 코드 변경 및 기능 구현 후에는 반드시 Vercel 환경에 프로덕션 배포(`npx -y vercel --prod --yes`)하고 배포 링크와 결과를 공유할 것.
