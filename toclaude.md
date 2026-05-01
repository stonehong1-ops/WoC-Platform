# WoC - Claude 인수인계 문서 (To Claude)
> 최종 업데이트: 2026-04-30 07:25 KST

## 🚨 최우선 진행 과제: 공통 UI 컴포넌트 구축 + 페이지별 디자인 정리

### 배경
- Shop 상세페이지(ProductDetail.tsx)를 Stitch 디자인 시스템에 의존하지 않고 **직접 Tailwind 유틸리티로 디자인**했더니 퀄리티가 훨씬 좋아짐
- 스토니가 이 디자인 스타일을 **다른 페이지에도 동일 적용**하고 싶어함
- 하지만 전역 설정 한방으로는 불가능 → **공통 UI 컴포넌트를 먼저 만들고, 페이지별 적용** 필요

### 현재 진행 상태
- [x] Shop 상세페이지(ProductDetail) — 완료, 프로덕션 배포됨
- [x] **공통 UI 컴포넌트 세트 구축** — 완료 (src/components/ui/)
- [x] **구매 플로우(PurchaseFlow)** — 완료, 프로덕션 배포됨 (dpl_4xTGBPveohKdhFSZhJdSmgAArPZ1)
- [ ] 각 페이지별 디자인 정리 적용 ← 다음 작업

---

## 📦 구축해야 할 공통 UI 컴포넌트

위치: `src/components/ui/`

| 컴포넌트 | 용도 | 참고 원본 |
|---------|------|----------|
| `SectionCard.tsx` | 박스 카드 (헤더 + 내용) | ProductDetail의 "Fit & Options" 박스 |
| `InfoRow.tsx` | 아이콘 + 제목 + 설명 한 줄 | Production/Delivery 정보 행 |
| `RadioSelector.tsx` | 라디오 버튼 그룹 | Store Pickup / Delivery 선택 |
| `ChipSelector.tsx` | 칩형 선택 (사이즈, 옵션) | Size 칩, 커스텀옵션 칩 |
| `FullScreenModal.tsx` | 풀스크린 오버레이 베이스 | ProductDetail 전체 구조 |
| `CollapseSection.tsx` | 접기/펼치기 | Size Guide, Description |

### 디자인 토큰 (Tailwind 인라인 기준)
```
텍스트 컬러:
  - 제목: #2d3435 (text-[#2d3435])
  - 본문: #596061
  - 보조: #acb3b4
  - 브랜드: primary (Stitch 토큰)

배경:
  - 카드 헤더: #f8f9fa
  - 구분선: #f2f4f4
  - 보더: #e0e4e5

모서리: rounded-xl (12px), rounded-2xl (16px)
그림자: shadow-sm
아이콘: Material Symbols Outlined
```

---

## 🔧 최근 완료된 Shop 상세페이지 작업

### ProductDetail.tsx 주요 기능
1. **이미지 캐러셀** — 좌우 화살표 + 카운터(1/N) + 스와이프
2. **Scarcity Bar** — 재고 현황 + "X viewing now"
3. **Fit & Options 박스** — 사이즈 칩 + 커스텀옵션(발볼/굽높이/바닥소재) + 사이즈가이드
4. **가격 + 쿠폰** — 할인가, 재구매 쿠폰("₩5,000 repurchase coupon" or "No coupon"), 계좌이체
5. **픽업/배송 라디오** — Store Pickup(기본) / Delivery 선택, 선택에 따라 정보 변경
6. **제작&배송** — productionDaysMin~Max, 배송비 or "seller pays", 무료교환
7. **상품설명** — 접기/펼치기
8. **판매자 채팅** — 버튼 (아직 실제 연동 미완)

### DB 필드 (102개 상품 일괄 업데이트 완료)
- `productionDaysMin` / `productionDaysMax` — 제작기간 범위
- `deliveryDays` — 배송 소요일
- `shippingFee` — 배송비 (0 = 무료)
- `sellerPaysShipping` — 판매자 배송비 부담 여부
- `repurchaseCouponAmount` — 재구매 쿠폰 금액 (0 = 없음)
- `sizeGuide` — 사이즈가이드 텍스트 (40자 이내)

### M_Shoes / M_Wear 더미 데이터 추가 (9개)
- M_Shoes: Tango Shoes Korea, Sharon, T.Balance, Odile — 각 1개
- M_Wear: Tango Homme(2), Tango Shoes Korea, Odile, T.Balance — 총 5개

---

## ⚠️ 절대 규칙 (항상 지켜야 함)
1. `tailwind.config.ts` **절대 수정 금지** — Stitch 성역 파일
2. 디자인 0픽셀 편차 원칙 — 원본 HTML 구조 변경 금지
3. 영문 사이트 — 모든 UI 텍스트는 영어
4. 작업 전 반드시 계획 제시 → 스토니 승인 후 진행
5. 코드 변경 완료 시 즉시 `npx -y vercel --prod --yes` 배포
6. Firebase 서비스 계정: `woc-platform-seoul-1234-firebase-adminsdk-fbsvc-225cc1138a.json`

---

## 🛒 구매 플로우 (PurchaseFlow) — 완료

### 파일: `src/components/shop/PurchaseFlow.tsx`
3단계 워크플로우:
1. **Order Summary** — 바텀시트, 상품 요약 + 가격 분해 + 확인 버튼
2. **Payment Instructions** — 풀스크린, 1시간 카운트다운 타이머 + 계좌정보(복사 기능) + How It Works 4단계 설명
3. **Order Complete** — 완료 화면, Shop Home 이동 or 쇼핑 계속

### 주문 상태 라이프사이클 (OrderStatus)
`PENDING` → `CONFIRMED` → `IN_PRODUCTION` → `READY_PICKUP`/`SHIPPING` → `COMPLETED`
- `EXPIRED`: 1시간 초과 자동 만료
- `CANCELLED`: 수동 취소

### 관련 타입 변경
- `src/types/shop.ts`: OrderStatus 확장 (PENDING, CONFIRMED, IN_PRODUCTION, READY_PICKUP, EXPIRED 추가)
- `src/types/shop.ts`: ShopOrder에 fulfillmentType, bankName/bankAccount/bankHolder, paymentDeadline, productionStartAt 추가
- `src/lib/firebase/shopService.ts`: updateOrderStatus 상태 전환 타임스탬프 업데이트
- `src/components/group/GroupShopEditor.tsx`: 관리자 주문 관리 UI 신규 상태 반영

---

## 📋 향후 작업 우선순위
1. **각 페이지 디자인 정리** (공통 컴포넌트 활용)
2. **공통 모듈 구축** (아래 목록 참조)
3. Wishlist 채팅 카운트 표시

---

## 🔗 공통 모듈 구축 목록 (Common Modules)
> 스토니 지시: "나중에 한꺼번에 정리" — 아래 모듈들은 플랫폼 전체에서 공유되어야 하며, 하나를 수정하면 모든 곳에 반영되어야 함

| # | 모듈명 | 설명 | 참고 위치 / 현황 |
|---|--------|------|-----------------|
| 1 | **알림 로직 공통** | 주문상태 변경, 채팅, 클래스 등록 등 전체 알림 시스템 통합 | 현재 개별 구현, 통합 필요 |
| 2 | **쿠폰 로직 공통** | 재구매 쿠폰 발급/적용/만료 처리 | Shop repurchaseCouponAmount 필드 존재, 로직 미구현 |
| 3 | **판매자/오너 채팅시작 로직 공통** | 상품 문의, 서비스 문의 시 자동 채팅방 생성 + 상품정보 자동 전송 | Shop 상세 "Chat with Seller" 버튼 존재, 실제 연동 미완 |
| 4 | **이미지/비디오 뷰어 공통** | 풀스크린 이미지 갤러리 + 비디오 플레이어 | 현재 각 페이지별 개별 구현 |
| 5 | **좋아요·댓글 공통 바텀시트** | HOME 카툰의 좋아요/댓글 UI를 기준으로 전체 통합 | HOME 카툰에 이미 기능 존재, 이걸 공통화 |
| 6 | **공유하기 공통** | Web Share API + 딥링크 복사 + SNS 공유 | 미구현 |

---

## 🏗️ 프로젝트 기술 스택
- Frontend: Next.js (16.2.1)
- Backend/DB: Firebase Firestore
- Design: Stitch (기본) + 직접 Tailwind 인라인 (상세 UI)
- Hosting: Vercel
- Live: https://www.woc.today
