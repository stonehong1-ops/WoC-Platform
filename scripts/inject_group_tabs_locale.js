const fs = require('fs');
const path = require('path');

const contextPath = path.join(__dirname, 'src', 'contexts', 'LanguageContext.tsx');
let content = fs.readFileSync(contextPath, 'utf8');

const keysToInject = {
  'group.tab.dashboard': { en: 'Dashboard', ko: '대시보드' },
  'group.tab.calendar': { en: 'Calendar', ko: '일정' },
  'group.tab.feed': { en: 'Feed', ko: '피드' },
  'group.tab.notice': { en: 'Notice', ko: '공지사항' },
  'group.tab.about': { en: 'About', ko: '소개' },
  'group.tab.class_user': { en: 'Class', ko: '클래스' },
  'group.tab.class_admin': { en: 'Class Setting', ko: '클래스 설정' },
  'group.tab.members': { en: 'Members', ko: '멤버' },
  'group.tab.settings': { en: 'Settings', ko: '설정' },
  'group.tab.shop': { en: 'Shop', ko: '상점' },
  'group.tab.stay': { en: 'Stay', ko: '숙박' },
  'group.tab.rental': { en: 'Rental', ko: '대여' },
  'group.tab.coupon': { en: 'Coupon', ko: '쿠폰' },
  'group.tab.live': { en: 'Live', ko: '라이브' },
  'group.tab.brand': { en: 'Brand', ko: '브랜드' },
  'group.tab.roles': { en: 'Roles & Permissions', ko: '역할 및 권한' },
  'group.tab.qa': { en: 'Q&A Board', ko: 'Q&A 게시판' },
  'group.tab.polls': { en: 'Polls', ko: '설문조사' },
  'group.tab.attendance': { en: 'Attendance Check', ko: '출석 체크' },
  'group.tab.broadcast': { en: 'Broadcast', ko: '방송' },
  'group.tab.rules': { en: 'Community Rules', ko: '커뮤니티 규칙' },
  'group.tab.surveys': { en: 'Surveys', ko: '설문' },
  'group.tab.anonymous': { en: 'Anonymous Posts', ko: '익명 게시판' },
  'group.tab.classA': { en: 'Class Manager A', ko: '클래스 매니저 A' },
  'group.tab.classB': { en: 'Class Manager B', ko: '클래스 매니저 B' },
  'group.tab.classC': { en: 'Class Manager C', ko: '클래스 매니저 C' },
  'group.tab.homework': { en: 'Homework Tracker', ko: '과제 트래커' },
  'group.tab.studentReports': { en: 'Student Reports', ko: '학생 리포트' },
  'group.tab.tuition': { en: 'Tuition Manager', ko: '학비 관리' },
  'group.tab.gradeSystem': { en: 'Grade System', ko: '성적 시스템' },
  'group.tab.parentNotify': { en: 'Parent Notifications', ko: '학부모 알림' },
  'group.tab.parentConsult': { en: 'Parent Consultation', ko: '학부모 상담' },
  'group.tab.examScheduler': { en: 'Exam Scheduler', ko: '시험 일정' },
  'group.tab.ticketBooking': { en: 'Ticket Booking', ko: '티켓 예매' },
  'group.tab.workshopReg': { en: 'Workshop Registration', ko: '워크샵 등록' },
  'group.tab.qrCheckin': { en: 'QR Check-in', ko: 'QR 체크인' },
  'group.tab.waitlist': { en: 'Waitlist System', ko: '대기자 명단' },
  'group.tab.retreat': { en: 'Retreat Planner', ko: '리트릿 플래너' },
  'group.tab.eventStaff': { en: 'Event Staff Manager', ko: '이벤트 스태프 관리' },
  'group.tab.guestList': { en: 'Guest List Manager', ko: '게스트 리스트 관리' },
  'group.tab.taskManager': { en: 'Task Manager', ko: '업무 관리' },
  'group.tab.internalWiki': { en: 'Internal Wiki', ko: '사내 위키' },
  'group.tab.productInventory': { en: 'Product Inventory', ko: '상품 재고' },
  'group.tab.membershipBilling': { en: 'Membership Billing', ko: '멤버십 결제' },
  'group.tab.donationSupport': { en: 'Donation Support', ko: '후원 지원' },
  'group.tab.subscriptionPlans': { en: 'Subscription Plans', ko: '구독 플랜' },
  'group.tab.settlementReports': { en: 'Settlement Reports', ko: '정산 리포트' },
  'group.tab.mediaGallery': { en: 'Media Gallery', ko: '미디어 갤러리' },
  'group.tab.videoLibrary': { en: 'Video Library', ko: '비디오 라이브러리' },
  'group.tab.editorialPage': { en: 'Editorial Page', ko: '에디토리얼 페이지' },
  'group.tab.newsletter': { en: 'Newsletter', ko: '뉴스레터' },
  'group.tab.podcastFeed': { en: 'Podcast Feed', ko: '팟캐스트 피드' },
  'group.tab.pressKit': { en: 'Press Kit', ko: '프레스 키트' },
  'group.tab.linkHub': { en: 'Link Hub', ko: '링크 허브' },
  'group.tab.socialSync': { en: 'Social Sync', ko: '소셜 동기화' },
  'group.tab.brandAssets': { en: 'Brand Assets', ko: '브랜드 에셋' },
  'group.tab.customLandingPage': { en: 'Custom Landing Page', ko: '맞춤 랜딩 페이지' },
  'group.tab.aiAssistant': { en: 'AI Assistant', ko: 'AI 어시스턴트' },
};

function injectTranslations(lang, dictionary) {
  let targetContent = content;
  
  // Find the start of the dictionary
  const regex = new RegExp(`const ${lang} = {`);
  const match = targetContent.match(regex);
  if (!match) return false;
  
  const startIndex = match.index + match[0].length;
  
  let injectionStr = '\n';
  for (const [key, trans] of Object.entries(dictionary)) {
    injectionStr += `  '${key}': '${trans[lang]}',\n`;
  }
  
  targetContent = targetContent.substring(0, startIndex) + injectionStr + targetContent.substring(startIndex);
  content = targetContent;
  return true;
}

const enDict = {};
const koDict = {};
for (const key of Object.keys(keysToInject)) {
  enDict[key] = { en: keysToInject[key].en };
  koDict[key] = { ko: keysToInject[key].ko };
}

fs.writeFileSync(contextPath + '.bak', content);

let enSuccess = injectTranslations('en', keysToInject);
let koSuccess = injectTranslations('ko', keysToInject);

if (enSuccess && koSuccess) {
  fs.writeFileSync(contextPath, content);
  console.log('Successfully injected group.tab.* keys.');
} else {
  console.log('Failed to inject keys.');
}
