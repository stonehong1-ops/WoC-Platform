export interface FunctionCard {
  id: string;
  icon: string;
  title: string;
  subtitle: string;
  description: string;
  price: string;
  status: 'INSTALLED' | 'ACTIVE' | 'ALPHA' | 'MIGRATE';
}

export interface FunctionSection {
  id: string;
  title: string;
  subtitle: string;
  accentColor: string;
  cards: FunctionCard[];
}

export const FUNCTION_SECTIONS: FunctionSection[] = [
  {
    id: 'admin',
    title: 'ADMIN',
    subtitle: '운영 관리 시스템',
    accentColor: 'bg-primary',
    cards: [
      { id: 'brand-setting', icon: 'palette', title: 'Brand Setting', subtitle: '브랜드 설정', description: '브랜드 색상, 로고 및 고유 아이덴티티 구성', price: '$0/mo', status: 'ACTIVE' },
      { id: 'class-setting', icon: 'school', title: 'Class Setting', subtitle: '수업 설정', description: '수업 커리큘럼 정의 및 강의실 공간 배정', price: '$12/mo', status: 'ALPHA' },
      { id: 'rental-setting', icon: 'key', title: 'Rental Setting', subtitle: '대여 설정', description: '공간 및 장비 대여 규칙, 보증금 시스템 설정', price: '$8/mo', status: 'MIGRATE' },
      { id: 'shop-setting', icon: 'storefront', title: 'Shop Setting', subtitle: '상점 설정', description: '커머스 인프라, 결제 게이트웨이 및 배송 정책', price: '$15/mo', status: 'ACTIVE' },
      { id: 'stay-setting', icon: 'bed', title: 'Stay Setting', subtitle: '스테이 설정', description: '숙박 및 워크스테이 예약 엔진 커스터마이징', price: '$20/mo', status: 'ALPHA' },
      { id: 'member-permissions', icon: 'admin_panel_settings', title: 'Member Permissions', subtitle: '멤버 권한', description: '운영진 권한 체계 및 핵심 관리 도구 접근 제어', price: '$0/mo', status: 'ACTIVE' },
    ],
  },
  {
    id: 'core',
    title: 'CORE',
    subtitle: '핵심 기본 시스템',
    accentColor: 'bg-secondary',
    cards: [
      { id: 'dashboard', icon: 'dashboard', title: 'Dashboard', subtitle: '대시보드', description: '전체 커뮤니티 활동 및 주요 지표 실시간 요약', price: 'Free', status: 'INSTALLED' },
      { id: 'calendar', icon: 'calendar_today', title: 'Calendar', subtitle: '캘린더', description: '공유 일정 및 커뮤니티 이벤트 타임라인', price: '$5/mo', status: 'ACTIVE' },
      { id: 'feed', icon: 'dynamic_feed', title: 'Feed', subtitle: '피드', description: '소셜 뉴스피드 및 멤버 간 소통 타임라인', price: '$0/mo', status: 'ACTIVE' },
      { id: 'live', icon: 'live_tv', title: 'Live', subtitle: '라이브', description: '실시간 스트리밍 및 온라인 세미나 송출', price: '$15/mo', status: 'ACTIVE' },
      { id: 'chat-rooms', icon: 'chat', title: 'Chat Rooms', subtitle: '채팅룸', description: '실시간 주제별 그룹 채팅 및 DM 시스템', price: '$0/mo', status: 'ACTIVE' },
      { id: 'notice', icon: 'campaign', title: 'Notice', subtitle: '공지사항', description: '중요 소식 알림 및 아카이빙 게시판', price: '$0/mo', status: 'ACTIVE' },
      { id: 'about', icon: 'info', title: 'About', subtitle: '소개', description: '커뮤니티 비전 및 가이드라인 소개 페이지', price: '$0/mo', status: 'ACTIVE' },
      { id: 'members', icon: 'groups', title: 'Members', subtitle: '멤버 목록', description: '참여 멤버 프로필 조회 및 디렉토리', price: '$0/mo', status: 'ACTIVE' },
      { id: 'roles-permissions', icon: 'security', title: 'Roles & Permissions', subtitle: '역할 및 권한', description: '멤버 등급별 상세 접근 권한 및 역할 제어', price: '$10/mo', status: 'ACTIVE' },
    ],
  },
  {
    id: 'community',
    title: 'COMMUNITY',
    subtitle: '커뮤니티 및 소통',
    accentColor: 'bg-tertiary',
    cards: [
      { id: 'polls', icon: 'how_to_vote', title: 'Polls', subtitle: '투표', description: '실시간 멤버 의견 수렴 및 결과 분석', price: '$4/mo', status: 'ALPHA' },
      { id: 'qa-board', icon: 'quiz', title: 'Q&A Board', subtitle: '질의응답 게시판', description: '지식 공유 및 아카이빙을 위한 전문 게시판', price: '$0/mo', status: 'ACTIVE' },
      { id: 'group-broadcast', icon: 'podcasts', title: 'Group Broadcast', subtitle: '그룹 방송', description: '특정 타겟 그룹에게만 송출되는 음성/텍스트 알림', price: '$6/mo', status: 'ACTIVE' },
      { id: 'attendance-check', icon: 'check_circle', title: 'Attendance Check', subtitle: '출석 체크', description: '행사 및 수업 참여 여부 자동 기록', price: '$2/mo', status: 'ACTIVE' },
      { id: 'community-rules', icon: 'gavel', title: 'Community Rules', subtitle: '커뮤니티 규정', description: '가입 동의 및 행동 수칙 선언 페이지', price: '$0/mo', status: 'ACTIVE' },
      { id: 'surveys', icon: 'assignment', title: 'Surveys', subtitle: '설문조사', description: '정기 만족도 조사 및 상세 데이터 수집', price: '$8/mo', status: 'ACTIVE' },
      { id: 'reactions-emojis', icon: 'add_reaction', title: 'Reactions & Emojis', subtitle: '리액션 및 이모지', description: '게시글 및 채팅 내 비언어적 소통 강화 시스템', price: '$3/mo', status: 'ACTIVE' },
      { id: 'anonymous-posts', icon: 'visibility_off', title: 'Anonymous Posts', subtitle: '익명 게시판', description: '자유로운 의견 개진을 위한 대나무숲 시스템', price: '$0/mo', status: 'ACTIVE' },
    ],
  },
  {
    id: 'education',
    title: 'EDUCATION',
    subtitle: '교육 및 학원 운영',
    accentColor: 'bg-primary-container',
    cards: [
      { id: 'class-manager-a', icon: 'assignment_ind', title: 'Class Manager A', subtitle: '강좌 관리 A', description: '수강생 명단 및 출결 현황 실시간 관리', price: '$18/mo', status: 'ACTIVE' },
      { id: 'class-manager-b', icon: 'menu_book', title: 'Class Manager B', subtitle: '강좌 관리 B', description: '강의 교안 아카이빙 및 과제 관리 엔진', price: '$18/mo', status: 'ACTIVE' },
      { id: 'class-manager-c', icon: 'auto_stories', title: 'Class Manager C', subtitle: '강좌 관리 C', description: '다중 강좌 스케줄링 및 자동 보강 관리', price: '$22/mo', status: 'ACTIVE' },
      { id: 'homework-tracker', icon: 'task_alt', title: 'Homework Tracker', subtitle: '과제 트래커', description: '수강생별 과제 제출 현황 및 피드백 기록', price: '$8/mo', status: 'ACTIVE' },
      { id: 'student-reports', icon: 'summarize', title: 'Student Reports', subtitle: '성적 리포트', description: '개별 성취도 분석 및 정기 학습 리포트 발행', price: '$10/mo', status: 'ACTIVE' },
      { id: 'tuition-manager', icon: 'payments', title: 'Tuition Manager', subtitle: '수강료 관리', description: '수강료 청구, 납부 확인 및 미납 자동 알림', price: '$12/mo', status: 'ACTIVE' },
      { id: 'grade-system', icon: 'grade', title: 'Grade System', subtitle: '성적 등급 시스템', description: '커스터마이징 가능한 등급제 및 가산점 관리', price: '$5/mo', status: 'ACTIVE' },
      { id: 'parent-notifications', icon: 'notifications_active', title: 'Parent Notifications', subtitle: '학부모 알림', description: '출결 및 학습 현황 학부모 앱 자동 전송', price: '$15/mo', status: 'ACTIVE' },
      { id: 'parent-consultation', icon: 'forum', title: 'Parent Consultation', subtitle: '학부모 상담', description: '비대면 상담 예약 및 개별 상담 일지 기록', price: '$7/mo', status: 'ACTIVE' },
      { id: 'exam-scheduler', icon: 'event_note', title: 'Exam Scheduler', subtitle: '시험 일정 관리', description: '정기 고사 일정 수립 및 고사장 자동 배치', price: '$10/mo', status: 'ACTIVE' },
    ],
  },
  {
    id: 'events',
    title: 'EVENTS',
    subtitle: '행사 및 예약 시스템',
    accentColor: 'bg-secondary-container',
    cards: [
      { id: 'event-manager', icon: 'event_available', title: 'Event Manager', subtitle: '이벤트 관리', description: '다양한 행사 생성, 수정 및 통합 관리 도구', price: '$10/mo', status: 'ACTIVE' },
      { id: 'ticket-booking', icon: 'confirmation_number', title: 'Ticket Booking', subtitle: '티켓 예매', description: '유료 이벤트 좌석 및 입장권 예매 시스템', price: '$12/mo', status: 'ACTIVE' },
      { id: 'workshop-registration', icon: 'app_registration', title: 'Workshop Registration', subtitle: '워크숍 등록', description: '체험형 프로그램 참가 신청 및 정원 관리', price: '$8/mo', status: 'ACTIVE' },
      { id: 'venue-booking', icon: 'location_city', title: 'Venue Booking', subtitle: '장소 예약', description: '외부 및 내부 행사장 대관 예약 시스템', price: '$15/mo', status: 'ACTIVE' },
      { id: 'table-reservation', icon: 'table_restaurant', title: 'Table Reservation', subtitle: '테이블 예약', description: '레스토랑 및 카페 좌석 실시간 예약', price: '$6/mo', status: 'ACTIVE' },
      { id: 'qr-checkin', icon: 'qr_code_scanner', title: 'QR Check-In', subtitle: 'QR 체크인', description: '현장 QR코드 스캔 기반 입장 인증', price: '$3/mo', status: 'ACTIVE' },
      { id: 'waitlist-system', icon: 'pending', title: 'Waitlist System', subtitle: '대기 명단', description: '만석 이벤트 자동 대기열 및 알림 시스템', price: '$4/mo', status: 'ALPHA' },
      { id: 'retreat-planner', icon: 'travel_explore', title: 'Retreat Planner', subtitle: '리트릿 플래너', description: '다일정 합숙 프로그램 기획 및 참가 관리', price: '$20/mo', status: 'ALPHA' },
      { id: 'event-staff-manager', icon: 'badge', title: 'Event Staff Manager', subtitle: '행사 스태프 관리', description: '자원봉사자 및 스태프 배치 스케줄링', price: '$8/mo', status: 'ACTIVE' },
      { id: 'guest-list-manager', icon: 'list_alt', title: 'Guest List Manager', subtitle: '게스트 리스트', description: 'VIP 및 초청 게스트 명단 관리', price: '$5/mo', status: 'ACTIVE' },
    ],
  },
  {
    id: 'commerce',
    title: 'COMMERCE',
    subtitle: '커뮤니티 경제 시스템',
    accentColor: 'bg-error',
    cards: [
      { id: 'group-shop', icon: 'store', title: 'Group Shop', subtitle: '그룹 상점', description: '커뮤니티 전용 상품 판매 및 주문 관리', price: '$15/mo', status: 'ACTIVE' },
      { id: 'product-inventory', icon: 'inventory_2', title: 'Product Inventory', subtitle: '상품 재고', description: '상품별 재고 현황 추적 및 입출고 기록', price: '$10/mo', status: 'ACTIVE' },
      { id: 'rental-system', icon: 'handshake', title: 'Rental System', subtitle: '대여 시스템', description: '장비 및 공간 대여 예약 통합 관리', price: '$8/mo', status: 'ACTIVE' },
      { id: 'resale-market', icon: 'sell', title: 'Resale Market', subtitle: '리세일 마켓', description: '멤버 간 중고 거래 플랫폼', price: '$5/mo', status: 'ALPHA' },
      { id: 'coupon-system', icon: 'local_offer', title: 'Coupon System', subtitle: '쿠폰 시스템', description: '할인 코드 생성 및 캠페인 관리', price: '$6/mo', status: 'ACTIVE' },
      { id: 'membership-billing', icon: 'credit_card', title: 'Membership Billing', subtitle: '멤버십 결제', description: '정기 회비 자동 청구 및 결제 관리', price: '$12/mo', status: 'ACTIVE' },
      { id: 'wallet', icon: 'account_balance_wallet', title: 'Wallet', subtitle: '지갑', description: '포인트 충전, 결제 내역 및 잔액 관리', price: '$8/mo', status: 'ACTIVE' },
      { id: 'donation-support', icon: 'volunteer_activism', title: 'Donation Support', subtitle: '후원 시스템', description: '커뮤니티 후원금 모금 및 기부 관리', price: '$3/mo', status: 'ALPHA' },
      { id: 'subscription-plans', icon: 'autorenew', title: 'Subscription Plans', subtitle: '구독 플랜', description: '등급별 구독 상품 설계 및 운영', price: '$10/mo', status: 'ACTIVE' },
      { id: 'settlement-reports', icon: 'receipt_long', title: 'Settlement Reports', subtitle: '정산 리포트', description: '매출, 수수료 및 정산 내역 분석', price: '$7/mo', status: 'ACTIVE' },
    ],
  },
  {
    id: 'operations',
    title: 'OPERATIONS',
    subtitle: '운영 및 조직 관리',
    accentColor: 'bg-inverse-surface',
    cards: [
      { id: 'task-manager', icon: 'task', title: 'Task Manager', subtitle: '업무 관리', description: '팀 업무 할당, 진행 상황 추적 및 마감일 관리', price: '$8/mo', status: 'ACTIVE' },
      { id: 'internal-wiki', icon: 'article', title: 'Internal Wiki', subtitle: '내부 위키', description: '조직 지식 기반 문서 공유 및 검색', price: '$5/mo', status: 'ACTIVE' },
      { id: 'staff-scheduling', icon: 'calendar_month', title: 'Staff Scheduling', subtitle: '스태프 스케줄링', description: '근무 시간표 작성 및 교대 관리', price: '$10/mo', status: 'ACTIVE' },
      { id: 'payroll-tracker', icon: 'account_balance', title: 'Payroll Tracker', subtitle: '급여 추적', description: '직원별 급여 내역 및 지급 이력 관리', price: '$15/mo', status: 'ALPHA' },
      { id: 'expense-tracker', icon: 'money_off', title: 'Expense Tracker', subtitle: '지출 추적', description: '경비 청구 및 비용 카테고리별 분석', price: '$8/mo', status: 'ACTIVE' },
      { id: 'asset-management', icon: 'inventory', title: 'Asset Management', subtitle: '자산 관리', description: '물리적 자산 등록, 상태 추적 및 감가상각', price: '$10/mo', status: 'ACTIVE' },
      { id: 'recruitment', icon: 'person_add', title: 'Recruitment', subtitle: '채용 관리', description: '채용 공고 게시 및 지원자 파이프라인', price: '$12/mo', status: 'ALPHA' },
      { id: 'approval-workflow', icon: 'rule', title: 'Approval Workflow', subtitle: '승인 워크플로', description: '다단계 결재 및 승인 프로세스 자동화', price: '$6/mo', status: 'ACTIVE' },
      { id: 'crm-lite', icon: 'contacts', title: 'CRM Lite', subtitle: 'CRM 라이트', description: '고객 관계 관리 및 상담 이력 기록', price: '$15/mo', status: 'ALPHA' },
      { id: 'internal-notices', icon: 'notifications', title: 'Internal Notices', subtitle: '내부 공지', description: '조직 내부 전용 공지사항 및 알림', price: '$0/mo', status: 'ACTIVE' },
      { id: 'team-workspace', icon: 'workspaces', title: 'Team Workspace', subtitle: '팀 워크스페이스', description: '부서별 협업 공간 및 파일 공유', price: '$10/mo', status: 'ACTIVE' },
      { id: 'project-roadmap', icon: 'map', title: 'Project Roadmap', subtitle: '프로젝트 로드맵', description: '장기 프로젝트 마일스톤 및 진행 현황', price: '$8/mo', status: 'ACTIVE' },
      { id: 'sprint-board', icon: 'view_kanban', title: 'Sprint Board', subtitle: '스프린트 보드', description: '애자일 스프린트 칸반보드 관리', price: '$8/mo', status: 'ACTIVE' },
      { id: 'okr-tracker', icon: 'track_changes', title: 'OKR Tracker', subtitle: 'OKR 트래커', description: '목표 및 핵심 결과 지표 추적', price: '$10/mo', status: 'ALPHA' },
      { id: 'investor-updates', icon: 'trending_up', title: 'Investor Updates', subtitle: '투자자 업데이트', description: '주기적 투자자 보고 및 지표 공유', price: '$12/mo', status: 'ALPHA' },
      { id: 'meeting-notes', icon: 'edit_note', title: 'Meeting Notes', subtitle: '회의록', description: '회의 기록 작성 및 액션 아이템 추적', price: '$5/mo', status: 'ACTIVE' },
      { id: 'founder-dashboard', icon: 'dashboard_customize', title: 'Founder Dashboard', subtitle: '창업자 대시보드', description: '핵심 경영 지표 실시간 요약', price: '$20/mo', status: 'ALPHA' },
      { id: 'hiring-pipeline', icon: 'work', title: 'Hiring Pipeline', subtitle: '채용 파이프라인', description: '면접 단계별 후보자 관리', price: '$15/mo', status: 'ALPHA' },
      { id: 'document-vault', icon: 'folder_special', title: 'Document Vault', subtitle: '문서 보관함', description: '중요 문서 암호화 저장 및 접근 관리', price: '$8/mo', status: 'ACTIVE' },
      { id: 'company-wiki', icon: 'auto_stories', title: 'Company Wiki', subtitle: '회사 위키', description: '기업 문화, 정책 및 가이드라인 문서화', price: '$5/mo', status: 'ACTIVE' },
    ],
  },
  {
    id: 'brand-media',
    title: 'BRAND & MEDIA',
    subtitle: '브랜딩 및 콘텐츠',
    accentColor: 'bg-tertiary-container',
    cards: [
      { id: 'media-gallery', icon: 'collections', title: 'Media Gallery', subtitle: '미디어 갤러리', description: '사진 및 이미지 라이브러리 관리', price: '$5/mo', status: 'ACTIVE' },
      { id: 'video-library', icon: 'video_library', title: 'Video Library', subtitle: '비디오 라이브러리', description: '교육 및 홍보 영상 아카이브', price: '$10/mo', status: 'ACTIVE' },
      { id: 'editorial-page', icon: 'newspaper', title: 'Editorial Page', subtitle: '에디토리얼 페이지', description: '브랜드 스토리텔링 전용 매거진', price: '$8/mo', status: 'ALPHA' },
      { id: 'newsletter', icon: 'mail', title: 'Newsletter', subtitle: '뉴스레터', description: '정기 이메일 뉴스레터 작성 및 발송', price: '$6/mo', status: 'ACTIVE' },
      { id: 'podcast-feed', icon: 'mic', title: 'Podcast Feed', subtitle: '팟캐스트 피드', description: '오디오 콘텐츠 업로드 및 구독 관리', price: '$10/mo', status: 'ALPHA' },
      { id: 'press-kit', icon: 'folder_open', title: 'Press Kit', subtitle: '프레스 킷', description: '언론 보도용 자료 패키지 관리', price: '$5/mo', status: 'ACTIVE' },
      { id: 'link-hub', icon: 'hub', title: 'Link Hub', subtitle: '링크 허브', description: '주요 외부 링크 모음 및 바이오 페이지', price: '$0/mo', status: 'ACTIVE' },
      { id: 'social-sync', icon: 'share', title: 'Social Sync', subtitle: '소셜 동기화', description: 'SNS 계정 연동 및 자동 포스팅', price: '$8/mo', status: 'ACTIVE' },
      { id: 'brand-assets', icon: 'palette', title: 'Brand Assets', subtitle: '브랜드 에셋', description: '로고, 컬러, 폰트 등 브랜드 가이드라인', price: '$5/mo', status: 'ACTIVE' },
      { id: 'custom-landing-page', icon: 'web', title: 'Custom Landing Page', subtitle: '커스텀 랜딩', description: '그룹 전용 맞춤 랜딩 페이지 빌더', price: '$15/mo', status: 'ALPHA' },
    ],
  },
  {
    id: 'ai-intelligence',
    title: 'AI & INTELLIGENCE',
    subtitle: 'AI 및 인사이트 시스템',
    accentColor: 'bg-surface-tint',
    cards: [
      { id: 'ai-assistant', icon: 'smart_toy', title: 'AI Assistant', subtitle: 'AI 어시스턴트', description: '커뮤니티 운영 AI 비서 및 자동 응답', price: '$25/mo', status: 'ALPHA' },
      { id: 'auto-translation', icon: 'translate', title: 'Auto Translation', subtitle: '자동 번역', description: '다국어 실시간 자동 번역 엔진', price: '$10/mo', status: 'ACTIVE' },
      { id: 'ai-schedule-summary', icon: 'event_repeat', title: 'AI Schedule Summary', subtitle: 'AI 일정 요약', description: '주간/월간 일정 자동 요약 리포트', price: '$8/mo', status: 'ALPHA' },
      { id: 'smart-recommendations', icon: 'recommend', title: 'Smart Recommendations', subtitle: '스마트 추천', description: '멤버 맞춤 콘텐츠 및 이벤트 추천', price: '$12/mo', status: 'ALPHA' },
      { id: 'ai-community-insights', icon: 'insights', title: 'AI Community Insights', subtitle: 'AI 커뮤니티 인사이트', description: '활동 패턴 분석 및 성장 인사이트', price: '$15/mo', status: 'ALPHA' },
      { id: 'ai-moderation', icon: 'shield', title: 'AI Moderation', subtitle: 'AI 모더레이션', description: '유해 콘텐츠 자동 탐지 및 필터링', price: '$10/mo', status: 'ALPHA' },
      { id: 'ai-growth-analytics', icon: 'analytics', title: 'AI Growth Analytics', subtitle: 'AI 성장 분석', description: '커뮤니티 성장 예측 및 트렌드 분석', price: '$18/mo', status: 'ALPHA' },
      { id: 'ai-content-draft', icon: 'edit_note', title: 'AI Content Draft', subtitle: 'AI 콘텐츠 초안', description: '공지사항, 이벤트 소개 글 자동 생성', price: '$8/mo', status: 'ALPHA' },
      { id: 'ai-attendance-prediction', icon: 'psychology', title: 'AI Attendance Prediction', subtitle: 'AI 출석 예측', description: '행사 참석률 예측 및 최적 일정 추천', price: '$10/mo', status: 'ALPHA' },
      { id: 'ai-revenue-forecasting', icon: 'monitoring', title: 'AI Revenue Forecasting', subtitle: 'AI 매출 예측', description: '수익 흐름 예측 및 재무 시나리오 분석', price: '$15/mo', status: 'ALPHA' },
    ],
  },
];
