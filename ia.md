# World of Community (WoC) Information Architecture (IA)

이 문서는 World of Community (WoC) 플랫폼의 전체 서비스 구조(Global IA)와 개별 그룹(Group IA)의 화면 계층 구조 및 모달/오버레이 매핑을 정의합니다.

---

## 1. Global IA (전체 플랫폼 구조)

### 1.1 메인 서비스 및 내비게이션
- `/` (Landing/Splash)
- `/home` (사용자 홈 / 대시보드)
- `/explore` (전체 탐색)
- `/search` (전역 검색)
- `/notification` (알림 센터)
- `/history` (활동 기록)

### 1.2 소셜 & 커뮤니티 (커뮤니케이션)
- `/plaza` (광장 / 메인 피드)
- `/chat` (채팅 리스트 및 채팅방)
- `/live` (라이브 스트리밍)
  - `/live/create` (라이브 생성)
- `/people` (인물/회원 디렉토리)
  - `/people/register` (회원 등록/초대)
  - `/people/[id]` (회원 프로필 상세)
- `/social` (소셜 이벤트)
- `/events` (일반 이벤트)

### 1.3 마켓플레이스 & 거래 (커머스)
- `/shop` (쇼핑/상점)
- `/resale` (중고 거래)
- `/rental` (공간/물품 대여)
  - `/rental/register` (대여 등록)
  - `/rental/[id]` (대여 상세)
- `/stay` (숙소/스테이)
  - `/stay/[id]` (숙소 상세)
  - `/stay/[id]/checkout` (결제 및 체크아웃)
  - `/stay/[id]/checkout/complete` (예약 완료)
- `/class` (클래스)
  - `/class/[groupId]` (특정 그룹의 클래스 상세)
- `/lost` (분실물 센터)
  - `/lost/register` (분실물 등록)
  - `/lost/[id]` (분실물 상세)

### 1.4 디렉토리 & 정보
- `/groups` (그룹 탐색 및 리스트)
- `/venues` (장소 및 지도)
- `/pics` (사진 갤러리)
- `/helpdesk` (고객 센터/도움말)

### 1.5 사용자 및 관리
- `/profile` (사용자 프로필 및 설정)
- `/wallet` (지갑 및 결제 수단)
- `/privacy` (개인정보 처리방침)
- `/admin` (플랫폼 통합 관리자)
  - `/admin/banners` (배너 관리)
  - `/admin/people` (회원 관리)
  - `/admin/pics` (사진 관리)
  - `/admin/place` (장소 관리)
  - `/admin/others` (기타 설정)

---

## 2. Global Modals, Drawers & Overlays (전역 모달 및 등록창)

### 2.1 레이아웃 및 내비게이션 모달
- **NavigationDrawer**: 전체 햄버거 메뉴 (GlobalNavigation 연동)
- **NotificationTray**: 알림 패널 오버레이
- **LocationSelector**: 지역/위치 선택 바텀시트
- **AppSettingsPopup**: 앱 설정(언어, 테마 등) 팝업
- **MyGroupsTray**: 내 그룹 목록 단축 오버레이

### 2.2 도메인별 등록/상세/결제 흐름 (Flows & Trays)
각 기능별로 등록창, 상세조회, 결제흐름, 위시리스트가 모달/바텀시트 형태로 구현됨:

- **Shop (상점)**
  - `CreateProduct`: 상품 등록 모달
  - `ProductDetail`: 상품 상세 모달
  - `PurchaseFlow`: 결제 및 구매 진행 바텀시트/위저드
  - `WishlistTray`: 찜한 상품 목록 트레이
- **Stay (숙소)**
  - `CreateStay`: 숙소 등록 모달
  - `StayDetail`: 숙소 상세 모달
  - `StayReservationFlow`: 숙소 예약 진행 흐름
  - `StayWishlistTray`: 찜한 숙소 목록
- **Rental (대여)**
  - `CreateRentalSpace`: 대여 공간/물품 등록 모달
  - `RentalDetail`: 대여 상세 모달
  - `RentalRequestFlow`: 대여 요청 진행 흐름
  - `RentalWishlistTray`: 찜한 대여 목록
- **Lost (분실물)**
  - `CreateLostItem`: 분실물/습득물 등록 모달
  - `LostFoundDetail`: 분실물 상세 모달
  - `LostClaimFlow`: 소유권 주장 흐름
  - `LostFoundWishlistTray`: 관심 분실물 목록
- **Resale (중고거래)**
  - `CreateResaleItem`: 중고 물품 등록 모달
  - `ResaleItemDetail`: 중고 물품 상세 모달
  - `ResalePurchaseFlow`: 중고 거래 진행 흐름
  - `ResaleWishlistTray`: 찜한 중고 물품 목록
- **Social & Events (소셜/포스터)**
  - `EditSocialEvent`: 소셜 이벤트 수정/등록 모달
  - `SocialViewer`: 소셜 이벤트 상세 뷰어
  - `SocialDownloadModal`: 소셜 포스터/이미지 다운로드
  - `SocialDjLineupSheet`: DJ 라인업 바텀시트
  - `PosterOverlay`: 포스터 레이아웃 에디터 오버레이

### 2.3 사용자 프로필 모달
- `UserProfileModal` / `UserProfilePopup`: 다른 사용자 프로필 요약 보기
- `MyInfoBottomSheet`: 내 정보 간편 조회 및 설정 바텀시트
- `DeactivateBottomSheet`: 계정 비활성화/탈퇴 흐름 바텀시트

---

## 3. Group IA (개별 그룹 내부 구조)
라우트 경로: `/groups/[id]`

그룹은 `GroupHome`을 진입점으로 하여 다양한 `Module(Function)`을 동적으로 렌더링하는 확장 가능한 구조를 가집니다.

### 3.1 그룹 코어 뷰
- `/groups/[id]` (그룹 메인 화면)
- `/groups/[id]/next` (그룹 다음 단계/추가 정보)
- `/groups/[id]/review` (그룹 리뷰 및 평가)

### 3.2 그룹 설정 및 관리 모달 (Admin & Managers)
- **기본 설정**: `GroupSettings`, `GroupEdit`, `GroupEditor`
- **화면 구성/디자인**: `GroupDesign`, `FunctionBuilder`, `GroupFunctionBuilder`
- **회원 관리**: `GroupManager`, `GuestListManager`
- **재무 및 정산**: `GroupBankSettings`, `MembershipBilling`, `TuitionManager`, `SettlementReports`, `PayrollTracker`

### 3.3 그룹 모듈 (Functions & Tabs)
그룹 내 활성화 여부에 따라 노출되는 탭 및 기능 모듈들입니다.

**커뮤니케이션 & 피드**
- `GroupFeed` (포스트 피드)
- `ChatRoom` (그룹 내부 채팅)
- `GroupNotices` / `AdminNotice` (공지사항)
- `Board` (일반 게시판)
- `Album` / `MediaGallery` / `VideoLibrary` (미디어 갤러리)

**클래스 & 교육 (Education)**
- `GroupClasses` (클래스 목록 뷰어)
- `ClassDetail` (클래스 상세 모달)
- `ClassEditor` / `ClassScheduleEditor` (클래스 관리자 에디터)
- `HomeworkTracker` (과제 관리)
- `StudentReports` (학생 리포트)
- `ParentConsultation` / `ParentNotifications` (학부모 상담 및 알림)

**일정 & 예약 (Events & Booking)**
- `Calendar` (그룹 캘린더)
- `EventPlanner` (이벤트 기획)
- `TicketBooking` (티켓 예매)
- `WorkshopRegistration` (워크샵 등록)
- `WaitlistSystem` (대기열 시스템)
- `Attendance` / `QRCheckIn` (출석 및 QR 체크인)
- `GroupStayEditor` (그룹 숙박/수련회 등록)
- `RetreatPlanner` (리트릿/수련회 플래너)

**업무 및 협업 (Work & Tools)**
- `TeamWorkspace` (팀 협업 공간)
- `ProjectRoadmap` (프로젝트 로드맵)
- `TaskManager` (업무 관리자)
- `SprintBoard` (스프린트 보드)
- `StaffScheduling` (스태프 스케줄)
- `InternalWiki` (내부 위키 문서)
- `InternalNotices` (내부 공지)
- `DailyLog` (일일 업무 일지)
- `CloudStorage` (클라우드 저장소)
- `LinkHub` (중요 링크 모음)

**기타 및 마케팅 (Others & Marketing)**
- `GroupContact` (연락망)
- `GroupSocials` (소셜 이벤트 연동)
- `GroupSurvey` (그룹 설문조사)
- `Newsletter` (뉴스레터 발행)
- `PressKit` (프레스킷/언론홍보)
- `ProductInventory` (상품/인벤토리 연동)
- `Recruitment` (구인구직/채용)
- `PodcastFeed` (팟캐스트 연동)
- `SocialSync` (외부 소셜 계정 연동)

### 3.4 개별 그룹 공통 모달
- `PostEditorModal`: 그룹 포스트 작성/수정
- `PostDetailModal`: 그룹 포스트 상세 보기
- `MemberProfileOverlay`: 그룹 멤버 프로필 요약 오버레이
- `BankSelectionEditor`: 송금/결제를 위한 은행 선택 에디터
