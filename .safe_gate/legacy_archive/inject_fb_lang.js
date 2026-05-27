const fs = require('fs');

const data = [
  {
    id: "admin", subtitle: "운영 관리 시스템", enSubtitle: "Operation Management System",
    cards: [
      { id: "brand-setting", subtitle: "브랜드 설정", desc: "브랜드 색상, 로고 및 고유 아이덴티티 구성", enSubtitle: "Brand Setting", enDesc: "Configure brand colors, logos, and unique identity" },
      { id: "class-setting", subtitle: "수업 설정", desc: "수업 커리큘럼 정의 및 강의실 공간 배정", enSubtitle: "Class Setting", enDesc: "Define class curriculum and assign room space" },
      { id: "rental-setting", subtitle: "대여 설정", desc: "공간 및 장비 대여 규칙, 보증금 시스템 설정", enSubtitle: "Rental Setting", enDesc: "Set space/equipment rental rules and deposit system" },
      { id: "shop-setting", subtitle: "상점 설정", desc: "커머스 인프라, 결제 게이트웨이 및 배송 정책", enSubtitle: "Shop Setting", enDesc: "Commerce infrastructure, payment gateway, and shipping policy" },
      { id: "stay-setting", subtitle: "스테이 설정", desc: "숙박 및 워크스테이 예약 엔진 커스터마이징", enSubtitle: "Stay Setting", enDesc: "Customize accommodation and workation booking engine" }
    ]
  },
  {
    id: "core", subtitle: "핵심 기본 시스템", enSubtitle: "Core Base System",
    cards: [
      { id: "dashboard", subtitle: "대시보드", desc: "전체 커뮤니티 활동 및 주요 지표 실시간 요약", enSubtitle: "Dashboard", enDesc: "Real-time summary of community activities and key metrics" },
      { id: "calendar", subtitle: "캘린더", desc: "공유 일정 및 커뮤니티 이벤트 타임라인", enSubtitle: "Calendar", enDesc: "Shared schedule and community event timeline" },
      { id: "feed", subtitle: "피드", desc: "소셜 뉴스피드 및 멤버 간 소통 타임라인", enSubtitle: "Feed", enDesc: "Social newsfeed and member communication timeline" },
      { id: "live", subtitle: "라이브", desc: "실시간 스트리밍 및 온라인 세미나 송출", enSubtitle: "Live", enDesc: "Real-time streaming and online seminar broadcast" },
      { id: "notice", subtitle: "공지사항", desc: "중요 소식 알림 및 아카이빙 게시판", enSubtitle: "Notice", enDesc: "Important news announcements and archiving board" },
      { id: "about", subtitle: "소개", desc: "커뮤니티 비전 및 가이드라인 소개 페이지", enSubtitle: "About", enDesc: "Introduction page for community vision and guidelines" },
      { id: "members", subtitle: "멤버 목록", desc: "참여 멤버 프로필 조회 및 디렉토리", enSubtitle: "Members List", enDesc: "View participating member profiles and directory" },
      { id: "roles-permissions", subtitle: "역할 및 권한", desc: "멤버 등급별 상세 접근 권한 및 역할 제어", enSubtitle: "Roles & Permissions", enDesc: "Detailed access rights and role control by member tier" }
    ]
  },
  {
    id: "community", subtitle: "커뮤니티 및 소통", enSubtitle: "Community & Communication",
    cards: [
      { id: "polls", subtitle: "투표", desc: "실시간 멤버 의견 수렴 및 결과 분석", enSubtitle: "Polls", enDesc: "Real-time member opinion gathering and result analysis" },
      { id: "qa-board", subtitle: "질의응답 게시판", desc: "지식 공유 및 아카이빙을 위한 전문 게시판", enSubtitle: "Q&A Board", enDesc: "Professional board for knowledge sharing and archiving" },
      { id: "group-broadcast", subtitle: "그룹 방송", desc: "특정 타겟 그룹에게만 송출되는 음성/텍스트 알림", enSubtitle: "Group Broadcast", enDesc: "Voice/text notifications broadcasted to specific target groups" },
      { id: "attendance-check", subtitle: "출석 체크", desc: "행사 및 수업 참여 여부 자동 기록", enSubtitle: "Attendance Check", enDesc: "Auto-record event and class participation" },
      { id: "community-rules", subtitle: "커뮤니티 규정", desc: "가입 동의 및 행동 수칙 선언 페이지", enSubtitle: "Community Rules", enDesc: "Sign-up agreement and code of conduct declaration page" },
      { id: "surveys", subtitle: "설문조사", desc: "정기 만족도 조사 및 상세 데이터 수집", enSubtitle: "Surveys", enDesc: "Regular satisfaction surveys and detailed data collection" },
      { id: "anonymous-posts", subtitle: "익명 게시판", desc: "자유로운 의견 개진을 위한 대나무숲 시스템", enSubtitle: "Anonymous Posts", enDesc: "Bamboo grove system for free expression of opinions" }
    ]
  },
  {
    id: "education", subtitle: "교육 및 학원 운영", enSubtitle: "Education & Academy Operations",
    cards: [
      { id: "class-manager-a", subtitle: "강좌 관리 A", desc: "수강생 명단 및 출결 현황 실시간 관리", enSubtitle: "Class Manager A", enDesc: "Real-time management of student lists and attendance" },
      { id: "class-manager-b", subtitle: "강좌 관리 B", desc: "강의 교안 아카이빙 및 과제 관리 엔진", enSubtitle: "Class Manager B", enDesc: "Lecture material archiving and assignment management engine" },
      { id: "class-manager-c", subtitle: "강좌 관리 C", desc: "다중 강좌 스케줄링 및 자동 보강 관리", enSubtitle: "Class Manager C", enDesc: "Multi-class scheduling and auto-makeup class management" },
      { id: "homework-tracker", subtitle: "과제 트래커", desc: "수강생별 과제 제출 현황 및 피드백 기록", enSubtitle: "Homework Tracker", enDesc: "Student assignment submission status and feedback tracking" },
      { id: "student-reports", subtitle: "성적 리포트", desc: "개별 성취도 분석 및 정기 학습 리포트 발행", enSubtitle: "Student Reports", enDesc: "Individual achievement analysis and regular learning report issuance" },
      { id: "tuition-manager", subtitle: "수강료 관리", desc: "수강료 청구, 납부 확인 및 미납 자동 알림", enSubtitle: "Tuition Manager", enDesc: "Tuition billing, payment verification, and unpaid auto-notifications" },
      { id: "grade-system", subtitle: "성적 등급 시스템", desc: "커스터마이징 가능한 등급제 및 가산점 관리", enSubtitle: "Grade System", enDesc: "Customizable grading system and bonus point management" },
      { id: "parent-notifications", subtitle: "학부모 알림", desc: "출결 및 학습 현황 학부모 앱 자동 전송", enSubtitle: "Parent Notifications", enDesc: "Auto-send attendance and learning status to parent app" },
      { id: "parent-consultation", subtitle: "학부모 상담", desc: "비대면 상담 예약 및 개별 상담 일지 기록", enSubtitle: "Parent Consultation", enDesc: "Non-face-to-face consultation booking and individual consultation log" },
      { id: "exam-scheduler", subtitle: "시험 일정 관리", desc: "정기 고사 일정 수립 및 고사장 자동 배치", enSubtitle: "Exam Scheduler", enDesc: "Regular exam scheduling and auto test center assignment" }
    ]
  },
  {
    id: "events", subtitle: "행사 및 예약 시스템", enSubtitle: "Event & Booking System",
    cards: [
      { id: "event-manager", subtitle: "이벤트 관리", desc: "다양한 행사 생성, 수정 및 통합 관리 도구", enSubtitle: "Event Manager", enDesc: "Creation, modification, and integrated management tool for various events" },
      { id: "ticket-booking", subtitle: "티켓 예매", desc: "유료 이벤트 좌석 및 입장권 예매 시스템", enSubtitle: "Ticket Booking", enDesc: "Paid event seating and ticket booking system" },
      { id: "workshop-registration", subtitle: "워크숍 등록", desc: "체험형 프로그램 참가 신청 및 정원 관리", enSubtitle: "Workshop Registration", enDesc: "Experiential program participation application and quota management" },
      { id: "venue-booking", subtitle: "장소 예약", desc: "외부 및 내부 행사장 대관 예약 시스템", enSubtitle: "Venue Booking", enDesc: "External and internal venue rental booking system" },
      { id: "table-reservation", subtitle: "테이블 예약", desc: "레스토랑 및 카페 좌석 실시간 예약", enSubtitle: "Table Reservation", enDesc: "Real-time reservation of restaurant and cafe seats" },
      { id: "qr-checkin", subtitle: "QR 체크인", desc: "현장 QR코드 스캔 기반 입장 인증", enSubtitle: "QR Check-In", enDesc: "On-site QR code scan-based entry authentication" },
      { id: "waitlist-system", subtitle: "대기 명단", desc: "만석 이벤트 자동 대기열 및 알림 시스템", enSubtitle: "Waitlist System", enDesc: "Auto-queue and notification system for fully booked events" },
      { id: "retreat-planner", subtitle: "리트릿 플래너", desc: "다일정 합숙 프로그램 기획 및 참가 관리", enSubtitle: "Retreat Planner", enDesc: "Multi-day retreat program planning and participant management" },
      { id: "event-staff-manager", subtitle: "행사 스태프 관리", desc: "자원봉사자 및 스태프 배치 스케줄링", enSubtitle: "Event Staff Manager", enDesc: "Volunteer and staff placement scheduling" },
      { id: "guest-list-manager", subtitle: "게스트 리스트", desc: "VIP 및 초청 게스트 명단 관리", enSubtitle: "Guest List Manager", enDesc: "VIP and invited guest list management" }
    ]
  },
  {
    id: "commerce", subtitle: "커뮤니티 경제 시스템", enSubtitle: "Community Economy System",
    cards: [
      { id: "group-shop", subtitle: "그룹 상점", desc: "커뮤니티 전용 상품 판매 및 주문 관리", enSubtitle: "Group Shop", enDesc: "Community-exclusive product sales and order management" },
      { id: "product-inventory", subtitle: "상품 재고", desc: "상품별 재고 현황 추적 및 입출고 기록", enSubtitle: "Product Inventory", enDesc: "Per-product inventory tracking and in/out records" },
      { id: "rental-system", subtitle: "대여 시스템", desc: "장비 및 공간 대여 예약 통합 관리", enSubtitle: "Rental System", enDesc: "Integrated management of equipment and space rental bookings" },
      { id: "resale-market", subtitle: "리세일 마켓", desc: "멤버 간 중고 거래 플랫폼", enSubtitle: "Resale Market", enDesc: "Member-to-member second-hand trading platform" },
      { id: "coupon-system", subtitle: "쿠폰 시스템", desc: "할인 코드 생성 및 캠페인 관리", enSubtitle: "Coupon System", enDesc: "Discount code generation and campaign management" },
      { id: "membership-billing", subtitle: "멤버십 결제", desc: "정기 회비 자동 청구 및 결제 관리", enSubtitle: "Membership Billing", enDesc: "Auto-billing and payment management for regular membership fees" },
      { id: "wallet", subtitle: "지갑", desc: "포인트 충전, 결제 내역 및 잔액 관리", enSubtitle: "Wallet", enDesc: "Point charging, payment history, and balance management" },
      { id: "donation-support", subtitle: "후원 시스템", desc: "커뮤니티 후원금 모금 및 기부 관리", enSubtitle: "Donation Support", enDesc: "Community sponsorship fundraising and donation management" },
      { id: "subscription-plans", subtitle: "구독 플랜", desc: "등급별 구독 상품 설계 및 운영", enSubtitle: "Subscription Plans", enDesc: "Tier-based subscription product design and operation" },
      { id: "settlement-reports", subtitle: "정산 리포트", desc: "매출, 수수료 및 정산 내역 분석", enSubtitle: "Settlement Reports", enDesc: "Analysis of sales, fees, and settlement history" }
    ]
  },
  {
    id: "operations", subtitle: "운영 및 조직 관리", enSubtitle: "Operations & Organization Management",
    cards: [
      { id: "task-manager", subtitle: "업무 관리", desc: "팀 업무 할당, 진행 상황 추적 및 마감일 관리", enSubtitle: "Task Manager", enDesc: "Team task assignment, progress tracking, and deadline management" },
      { id: "internal-wiki", subtitle: "내부 위키", desc: "조직 지식 기반 문서 공유 및 검색", enSubtitle: "Internal Wiki", enDesc: "Organizational knowledge base document sharing and search" },
      { id: "staff-scheduling", subtitle: "스태프 스케줄링", desc: "근무 시간표 작성 및 교대 관리", enSubtitle: "Staff Scheduling", enDesc: "Work schedule creation and shift management" },
      { id: "payroll-tracker", subtitle: "급여 추적", desc: "직원별 급여 내역 및 지급 이력 관리", enSubtitle: "Payroll Tracker", enDesc: "Employee payroll details and payment history management" },
      { id: "expense-tracker", subtitle: "지출 추적", desc: "경비 청구 및 비용 카테고리별 분석", enSubtitle: "Expense Tracker", enDesc: "Expense claims and cost category analysis" },
      { id: "asset-management", subtitle: "자산 관리", desc: "물리적 자산 등록, 상태 추적 및 감가상각", enSubtitle: "Asset Management", enDesc: "Physical asset registration, status tracking, and depreciation" },
      { id: "recruitment", subtitle: "채용 관리", desc: "채용 공고 게시 및 지원자 파이프라인", enSubtitle: "Recruitment", enDesc: "Job posting and applicant pipeline management" },
      { id: "approval-workflow", subtitle: "승인 워크플로", desc: "다단계 결재 및 승인 프로세스 자동화", enSubtitle: "Approval Workflow", enDesc: "Multi-level approval and authorization process automation" },
      { id: "crm-lite", subtitle: "CRM 라이트", desc: "고객 관계 관리 및 상담 이력 기록", enSubtitle: "CRM Lite", enDesc: "Customer relationship management and consultation history" },
      { id: "internal-notices", subtitle: "내부 공지", desc: "조직 내부 전용 공지사항 및 알림", enSubtitle: "Internal Notices", enDesc: "Internal organization-exclusive notices and announcements" },
      { id: "team-workspace", subtitle: "팀 워크스페이스", desc: "부서별 협업 공간 및 파일 공유", enSubtitle: "Team Workspace", enDesc: "Departmental collaboration space and file sharing" },
      { id: "project-roadmap", subtitle: "프로젝트 로드맵", desc: "장기 프로젝트 마일스톤 및 진행 현황", enSubtitle: "Project Roadmap", enDesc: "Long-term project milestones and progress status" },
      { id: "sprint-board", subtitle: "스프린트 보드", desc: "애자일 스프린트 칸반보드 관리", enSubtitle: "Sprint Board", enDesc: "Agile sprint Kanban board management" },
      { id: "okr-tracker", subtitle: "OKR 트래커", desc: "목표 및 핵심 결과 지표 추적", enSubtitle: "OKR Tracker", enDesc: "Objectives and key results metrics tracking" },
      { id: "investor-updates", subtitle: "투자자 업데이트", desc: "주기적 투자자 보고 및 지표 공유", enSubtitle: "Investor Updates", enDesc: "Periodic investor reporting and metrics sharing" },
      { id: "meeting-notes", subtitle: "회의록", desc: "회의 기록 작성 및 액션 아이템 추적", enSubtitle: "Meeting Notes", enDesc: "Meeting minute creation and action item tracking" },
      { id: "founder-dashboard", subtitle: "창업자 대시보드", desc: "핵심 경영 지표 실시간 요약", enSubtitle: "Founder Dashboard", enDesc: "Real-time summary of key management metrics" },
      { id: "hiring-pipeline", subtitle: "채용 파이프라인", desc: "면접 단계별 후보자 관리", enSubtitle: "Hiring Pipeline", enDesc: "Candidate management by interview stage" },
      { id: "document-vault", subtitle: "문서 보관함", desc: "중요 문서 암호화 저장 및 접근 관리", enSubtitle: "Document Vault", enDesc: "Encrypted storage and access management for critical documents" },
      { id: "company-wiki", subtitle: "회사 위키", desc: "기업 문화, 정책 및 가이드라인 문서화", enSubtitle: "Company Wiki", enDesc: "Documentation of company culture, policies, and guidelines" }
    ]
  },
  {
    id: "brand-media", subtitle: "브랜딩 및 콘텐츠", enSubtitle: "Branding & Media",
    cards: [
      { id: "media-gallery", subtitle: "미디어 갤러리", desc: "사진 및 이미지 라이브러리 관리", enSubtitle: "Media Gallery", enDesc: "Photo and image library management" },
      { id: "video-library", subtitle: "비디오 라이브러리", desc: "교육 및 홍보 영상 아카이브", enSubtitle: "Video Library", enDesc: "Education and promo video archive" },
      { id: "editorial-page", subtitle: "에디토리얼 페이지", desc: "브랜드 스토리텔링 전용 매거진", enSubtitle: "Editorial Page", enDesc: "Brand storytelling exclusive magazine" },
      { id: "newsletter", subtitle: "뉴스레터", desc: "정기 이메일 뉴스레터 작성 및 발송", enSubtitle: "Newsletter", enDesc: "Regular email newsletter creation and sending" },
      { id: "podcast-feed", subtitle: "팟캐스트 피드", desc: "오디오 콘텐츠 업로드 및 구독 관리", enSubtitle: "Podcast Feed", enDesc: "Audio content upload and subscription management" },
      { id: "press-kit", subtitle: "프레스 킷", desc: "언론 보도용 자료 패키지 관리", enSubtitle: "Press Kit", enDesc: "Media press release material package management" },
      { id: "link-hub", subtitle: "링크 허브", desc: "주요 외부 링크 모음 및 바이오 페이지", enSubtitle: "Link Hub", enDesc: "Key external link collection and bio page" },
      { id: "social-sync", subtitle: "소셜 동기화", desc: "SNS 계정 연동 및 자동 포스팅", enSubtitle: "Social Sync", enDesc: "Social media account integration and auto-posting" },
      { id: "brand-assets", subtitle: "브랜드 에셋", desc: "로고, 컬러, 폰트 등 브랜드 가이드라인", enSubtitle: "Brand Assets", enDesc: "Brand guidelines including logo, color, and font" },
      { id: "custom-landing-page", subtitle: "커스텀 랜딩", desc: "그룹 전용 맞춤 랜딩 페이지 빌더", enSubtitle: "Custom Landing Page", enDesc: "Group-exclusive custom landing page builder" }
    ]
  },
  {
    id: "ai-intelligence", subtitle: "AI 및 인사이트 시스템", enSubtitle: "AI & Intelligence System",
    cards: [
      { id: "ai-assistant", subtitle: "AI 어시스턴트", desc: "커뮤니티 운영 AI 비서 및 자동 응답", enSubtitle: "AI Assistant", enDesc: "Community operations AI assistant and auto-reply" },
      { id: "auto-translation", subtitle: "자동 번역", desc: "다국어 실시간 자동 번역 엔진", enSubtitle: "Auto Translation", enDesc: "Multilingual real-time automatic translation engine" },
      { id: "ai-schedule-summary", subtitle: "AI 일정 요약", desc: "주간/월간 일정 자동 요약 리포트", enSubtitle: "AI Schedule Summary", enDesc: "Weekly/monthly schedule auto-summary report" },
      { id: "smart-recommendations", subtitle: "스마트 추천", desc: "멤버 맞춤 콘텐츠 및 이벤트 추천", enSubtitle: "Smart Recommendations", enDesc: "Personalized content and event recommendations for members" },
      { id: "ai-community-insights", subtitle: "AI 커뮤니티 인사이트", desc: "활동 패턴 분석 및 성장 인사이트", enSubtitle: "AI Community Insights", enDesc: "Activity pattern analysis and growth insights" },
      { id: "ai-moderation", subtitle: "AI 모더레이션", desc: "유해 콘텐츠 자동 탐지 및 필터링", enSubtitle: "AI Moderation", enDesc: "Toxic content auto-detection and filtering" },
      { id: "ai-growth-analytics", subtitle: "AI 성장 분석", desc: "커뮤니티 성장 예측 및 트렌드 분석", enSubtitle: "AI Growth Analytics", enDesc: "Community growth prediction and trend analysis" },
      { id: "ai-content-draft", subtitle: "AI 콘텐츠 초안", desc: "공지사항, 이벤트 소개 글 자동 생성", enSubtitle: "AI Content Draft", enDesc: "Auto-generate notices and event intro drafts" },
      { id: "ai-attendance-prediction", subtitle: "AI 출석 예측", desc: "행사 참석률 예측 및 최적 일정 추천", enSubtitle: "AI Attendance Prediction", enDesc: "Event attendance prediction and optimal schedule recommendation" },
      { id: "ai-revenue-forecasting", subtitle: "AI 매출 예측", desc: "수익 흐름 예측 및 재무 시나리오 분석", enSubtitle: "AI Revenue Forecasting", enDesc: "Revenue flow prediction and financial scenario analysis" }
    ]
  }
];

const filePath = './src/contexts/LanguageContext.tsx';
let content = fs.readFileSync(filePath, 'utf-8');

let enEntries = [];
let krEntries = [];

enEntries.push(`    // Function Builder Data`);
krEntries.push(`    // Function Builder Data`);

data.forEach(sec => {
    enEntries.push(`    'fb.sec.${sec.id}.subtitle': '${sec.enSubtitle.replace(/'/g, "\\'")}',`);
    krEntries.push(`    'fb.sec.${sec.id}.subtitle': '${sec.subtitle.replace(/'/g, "\\'")}',`);

    sec.cards.forEach(card => {
        enEntries.push(`    'fb.card.${card.id}.subtitle': '${card.enSubtitle.replace(/'/g, "\\'")}',`);
        krEntries.push(`    'fb.card.${card.id}.subtitle': '${card.subtitle.replace(/'/g, "\\'")}',`);
        enEntries.push(`    'fb.card.${card.id}.desc': '${card.enDesc.replace(/'/g, "\\'")}',`);
        krEntries.push(`    'fb.card.${card.id}.desc': '${card.desc.replace(/'/g, "\\'")}',`);
    });
});

const enInsert = enEntries.join('\n') + '\n';
const krInsert = krEntries.join('\n') + '\n';

// Clean existing entries to prevent duplicates
content = content.replace(/^\s*\/\/ Function Builder Data\s*$/gm, '');
content = content.replace(/^\s*'fb\.(sec|card)\..*$/gm, '');
// Clean up multiple empty lines that might have been left behind
content = content.replace(/\n\s*\n\s*\n/g, '\n\n');

content = content.replace('EN: {', 'EN: {\n' + enInsert);
content = content.replace('KR: {', 'KR: {\n' + krInsert);

fs.writeFileSync(filePath, content, 'utf-8');
console.log('LanguageContext updated successfully!');
