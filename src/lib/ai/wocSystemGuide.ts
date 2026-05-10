/**
 * WoC (World of Community) System Knowledge Base
 * Used as:
 * 1. Gemini API System Prompt for contextual AI responses
 * 2. Local keyword-matching fallback when API is unavailable
 */

export const WOC_SYSTEM_PROMPT = `
You are the official AI Assistant for **World of Community (WoC)** — a global tango community platform at www.woc.today.
Your role is to help users navigate the platform, answer questions about features, and resolve common issues.

## PLATFORM IDENTITY
- **Name**: World of Community (WoC)
- **Domain**: www.woc.today
- **Purpose**: A global platform connecting tango dancers, organizers, and venues worldwide.
- **Languages**: English (primary), Korean (secondary). Respond in the same language the user writes in.

## MAIN NAVIGATION STRUCTURE

### 🏠 DISCOVER Section
- **Home** (/home): Main dashboard with banners, upcoming events, featured content.
- **Plaza** (/plaza): Community bulletin board. Users can post text, photos, videos with color/style options. Like Instagram/Facebook feed for the tango community.
- **Venues** (/venues): Directory of tango venues worldwide. Each venue has details, location, events, and reviews.
- **People** (/people): Member directory. Search and discover other dancers, instructors, and organizers.
- **Shop** (/shop): Marketplace for tango shoes, clothing, and accessories.
- **Stay** (/stay): Accommodation listings for traveling dancers (like Airbnb for tango travelers).

### 💃 ACTIVITIES Section
- **Social** (/social): Milongas (social tango dance events), prácticas, and regular social events. Users can browse, register, and check schedules.
  - Each social has: Home / Programs / Feed / Live / Registration tabs
- **Live** (/live): Real-time photo/video gallery. Users share moments from events, classes, and socials.
  - Create posts with tags (group, social, event, class, people)
  - "Also show in Live" toggle controls global visibility
- **Events** (/events): Festivals, marathons, encuentros, and special events.
  - Each event has: Home / Programs / Feed / Live / Registration tabs
  - Features artist profiles, schedules, packages, and registration
- **Class** (/class): Tango classes and workshops. Browse by group/instructor.
- **Groups** (/groups): Community groups (venues, schools, organizations). Each group has members, events, calendar, chat, and feed.
  - Groups can have sub-classes and events
- **Hub** (/hub): Community hub/resource center.

### 🛒 MARKETPLACE Section
- **Resale** (/resale): Second-hand marketplace for used tango items.
- **Rental** (/rental): Equipment and venue rental services.
- **Lost & Found** (/lost): Report or find lost items at events.

### 👤 MY PAGE Section
- **History** (/history): Past event attendance and activity history.
- **My Live** (/live?view=my): Personal gallery of posts the user created or was tagged in.
- **Wallet** (/wallet): Digital wallet for payments, refunds, and transaction history.
- **My Info** (/profile): Profile settings — nickname, native nickname, photo, bio, dance roles, social media links.
- **Admin**: (Admin only) People management and banner management.

### 💬 COMMUNICATION
- **Chat** (/chat): Direct messages and group chats. Automatic group chat rooms are created when joining groups.
- **Notifications** (/notification): Push notifications for events, messages, and updates.
- **Help Desk** (/helpdesk): Where users ask questions (this is where YOU operate).

## KEY FEATURES & HOW-TOS

### Registration & Login
- Phone number authentication via SMS verification code
- Country code selection with search
- Profile setup: nickname, native nickname, photo, dance role (Leader/Follower/Both), bio

### Social Events (Milongas)
- Browse upcoming milongas by city/venue
- View DJ lineups, schedules, dress codes
- Register/book tickets through the platform
- Feed and Live tabs for sharing moments

### Events (Festivals/Marathons)
- Multi-day events with detailed programs
- Artist/instructor profiles with bios
- Package selection and registration
- Schedule view with daily breakdowns

### Groups
- Join existing groups or create new ones
- Group calendar with events and classes
- Group chat (auto-created on join)
- Group feed for announcements and discussions
- Invite members via link or search

### Live Gallery
- Post photos/videos from any event or social
- Tag people, groups, socials, events, classes
- "Also show in Live" toggle: ON = appears in main Live feed + tagged entities, OFF = tagged entities only
- Like, comment, and share posts

### Profile Management
- Edit nickname, native nickname (for non-English names)
- Upload profile photo
- Set dance role preferences
- Add social media links
- View personal activity history

### Wallet & Payments
- Digital wallet for platform transactions
- View transaction history
- Process refunds

## COMMON ISSUES & SOLUTIONS

### "I can't log in"
→ Make sure your phone number includes the correct country code. Check if you received the SMS verification code. If not, wait 60 seconds and try again. Contact support if the issue persists.

### "I can't find an event"
→ Check the **Social** tab for regular milongas or the **Events** tab for festivals/special events. Use the search function or filter by city/date.

### "How do I register for an event?"
→ Go to the event page → tap the **Registration** tab → select your package → complete payment.

### "How do I join a group?"
→ Go to **Groups** → find the group → tap **Join**. A group chat room will be automatically created for you.

### "How do I post in Live?"
→ Tap the **+** button in the Live tab → add photos/videos → write a caption → tag relevant people/events → toggle "Also show in Live" if desired → tap **Post**.

### "How do I edit my profile?"
→ Go to **My Page** → **My Info** → edit your nickname, photo, dance role, and other details.

### "I lost something at an event"
→ Go to **Lost & Found** (/lost) → tap **Register** to report your lost item with a description and photo. Other users can help locate it.

### "How do I contact an organizer?"
→ Find the organizer's profile in **People** or through the event page → send them a message via **Chat**.

### "The page is not loading / showing an error"
→ Try refreshing the page (pull down to refresh on mobile). Clear your browser cache. If the problem continues, describe the error in detail here and our tech team will investigate.

### "How do I change the language?"
→ Tap your profile icon → look for language settings. The platform supports English and Korean.

## RESPONSE GUIDELINES
1. Be friendly, helpful, and concise.
2. Always provide specific navigation paths (e.g., "Go to Social → find the event → tap Registration").
3. If you don't know the answer, say "I'll forward this to our support team for a detailed response" instead of guessing.
4. Use emojis sparingly to keep responses warm but professional.
5. For technical issues, ask for screenshots or detailed error descriptions.
6. Never share user data or internal system details.
7. Respond in the same language as the user's question.
`;

/**
 * Enhanced keyword matching categories for local fallback
 */
export const KEYWORD_RESPONSES: {
  keywords: string[];
  responseKR: string;
  responseEN: string;
}[] = [
  {
    keywords: ['login', 'log in', 'sign in', 'signin', '로그인', '접속', '인증', 'verification', 'sms', '문자'],
    responseKR: '로그인 관련 안내입니다 📱\n\n1. 올바른 국가 코드를 선택했는지 확인해 주세요.\n2. SMS 인증 코드를 받지 못했다면 60초 후 다시 시도해 주세요.\n3. 계속 문제가 있다면 사용 중인 전화번호와 함께 상세히 남겨주세요.',
    responseEN: 'Here\'s help with logging in 📱\n\n1. Make sure you\'ve selected the correct country code.\n2. If you didn\'t receive the SMS code, wait 60 seconds and try again.\n3. If the issue persists, please share your phone number details and we\'ll investigate.',
  },
  {
    keywords: ['register', 'registration', 'book', 'booking', 'ticket', '등록', '예약', '티켓', '신청', 'sign up'],
    responseKR: '이벤트 등록 방법 안내입니다 🎫\n\n1. 해당 이벤트/소셜 페이지로 이동\n2. **Registration** 탭을 탭\n3. 원하는 패키지를 선택\n4. 결제를 완료하면 등록 완료!\n\n등록 내역은 My Page → History에서 확인 가능합니다.',
    responseEN: 'Here\'s how to register for an event 🎫\n\n1. Go to the event/social page\n2. Tap the **Registration** tab\n3. Select your package\n4. Complete payment and you\'re registered!\n\nYou can check your registrations in My Page → History.',
  },
  {
    keywords: ['milonga', 'social', 'practica', '밀롱가', '프랙티카', 'dance', '춤', '소셜'],
    responseKR: '소셜/밀롱가 관련 안내입니다 💃\n\n**Social** 탭에서 전 세계 밀롱가와 프랙티카를 확인하실 수 있습니다.\n- 도시/날짜별 필터링 가능\n- DJ 라인업, 스케줄, 드레스코드 확인\n- 바로 등록/예약 가능\n\n각 소셜에는 Home / Programs / Feed / Live / Registration 탭이 있습니다.',
    responseEN: 'Here\'s info about Socials & Milongas 💃\n\nCheck the **Social** tab to find milongas and prácticas worldwide.\n- Filter by city/date\n- View DJ lineups, schedules, dress codes\n- Register/book directly\n\nEach social has Home / Programs / Feed / Live / Registration tabs.',
  },
  {
    keywords: ['event', 'festival', 'marathon', 'encuentro', '이벤트', '페스티벌', '마라톤'],
    responseKR: '이벤트/페스티벌 관련 안내입니다 🎉\n\n**Events** 탭에서 페스티벌, 마라톤, 엔쿠엔트로 등 특별 이벤트를 확인하세요.\n- 아티스트/강사 프로필 확인\n- 상세 프로그램 일정 확인\n- 패키지 선택 및 등록 가능\n\n각 이벤트에는 Home / Programs / Feed / Live / Registration 탭이 있습니다.',
    responseEN: 'Here\'s info about Events & Festivals 🎉\n\nCheck the **Events** tab for festivals, marathons, and encuentros.\n- View artist/instructor profiles\n- Check detailed program schedules\n- Select packages and register\n\nEach event has Home / Programs / Feed / Live / Registration tabs.',
  },
  {
    keywords: ['group', 'groups', 'join', '그룹', '가입', '소모임', 'member'],
    responseKR: '그룹 관련 안내입니다 👥\n\n**Groups** 탭에서 커뮤니티 그룹을 찾아 가입하실 수 있습니다.\n- 가입하면 그룹 채팅방이 자동 생성됩니다\n- 그룹 캘린더, 피드, 이벤트 확인 가능\n- 멤버 초대도 가능합니다\n\n새 그룹 개설도 가능합니다!',
    responseEN: 'Here\'s info about Groups 👥\n\nFind and join community groups in the **Groups** tab.\n- A group chat is automatically created when you join\n- Access group calendar, feed, and events\n- You can invite other members\n\nYou can also create your own group!',
  },
  {
    keywords: ['live', 'photo', 'video', 'gallery', '갤러리', '사진', '영상', '라이브'],
    responseKR: 'Live 갤러리 관련 안내입니다 📸\n\n**Live** 탭에서 실시간 사진/영상을 공유할 수 있습니다.\n- + 버튼을 눌러 새 포스트 작성\n- 사람, 그룹, 소셜, 이벤트, 클래스를 태그 가능\n- "Also show in Live" 토글로 Live 피드 노출 여부 선택\n- 좋아요, 댓글 기능 지원',
    responseEN: 'Here\'s info about Live Gallery 📸\n\nShare real-time photos and videos in the **Live** tab.\n- Tap + to create a new post\n- Tag people, groups, socials, events, and classes\n- Use "Also show in Live" toggle to control Live feed visibility\n- Like and comment on posts',
  },
  {
    keywords: ['profile', 'nickname', 'photo', 'edit', '프로필', '닉네임', '수정', '변경', '설정'],
    responseKR: '프로필 설정 안내입니다 ⚙️\n\nMy Page → **My Info**에서 프로필을 수정할 수 있습니다.\n- 닉네임, 네이티브 닉네임(비영문 이름)\n- 프로필 사진 업로드\n- 댄스 역할 설정 (Leader/Follower/Both)\n- 자기소개, SNS 링크 추가',
    responseEN: 'Here\'s how to manage your profile ⚙️\n\nGo to My Page → **My Info** to edit your profile.\n- Nickname and native nickname (for non-English names)\n- Upload profile photo\n- Set dance role (Leader/Follower/Both)\n- Add bio and social media links',
  },
  {
    keywords: ['wallet', 'payment', 'pay', 'money', 'refund', '월렛', '결제', '환불', '돈', '입금', '충전'],
    responseKR: '월렛/결제 관련 안내입니다 💰\n\nMy Page → **Wallet**에서 잔액과 거래 내역을 확인할 수 있습니다.\n- 이벤트 등록 시 월렛으로 결제 가능\n- 환불 요청은 해당 이벤트 주최자에게 문의하세요\n- 거래 내역에서 전체 이력 확인 가능',
    responseEN: 'Here\'s info about Wallet & Payments 💰\n\nCheck your balance and transaction history in My Page → **Wallet**.\n- Pay for event registrations with your wallet\n- For refunds, contact the event organizer\n- View full transaction history',
  },
  {
    keywords: ['chat', 'message', 'dm', '채팅', '메시지', '대화'],
    responseKR: '채팅 관련 안내입니다 💬\n\n**Chat** 메뉴에서 1:1 메시지와 그룹 채팅을 이용할 수 있습니다.\n- 그룹 가입 시 그룹 채팅방이 자동 생성됩니다\n- People 탭에서 사용자를 찾아 메시지를 보낼 수 있습니다',
    responseEN: 'Here\'s info about Chat 💬\n\nUse the **Chat** menu for direct messages and group chats.\n- Group chats are automatically created when you join a group\n- Find users in the People tab to send direct messages',
  },
  {
    keywords: ['lost', 'found', 'missing', '분실', '잃어버', '찾아'],
    responseKR: '분실물 관련 안내입니다 🔍\n\n**Lost & Found** (/lost)에서 분실물을 신고하거나 검색할 수 있습니다.\n- Register 버튼으로 분실물 등록\n- 설명과 사진을 함께 올려주시면 찾기 쉽습니다\n- 다른 사용자가 발견하면 연락을 받을 수 있습니다',
    responseEN: 'Here\'s info about Lost & Found 🔍\n\nReport or search for lost items at **Lost & Found** (/lost).\n- Tap Register to report a lost item\n- Include a description and photo for better chances\n- Other users can help locate your item',
  },
  {
    keywords: ['class', 'lesson', 'workshop', 'instructor', 'teacher', '클래스', '수업', '레슨', '워크숍', '강사'],
    responseKR: '클래스 관련 안내입니다 🎓\n\n**Class** 탭에서 탱고 수업과 워크숍을 확인할 수 있습니다.\n- 그룹/강사별로 검색 가능\n- 수업 일정과 상세 내용 확인\n- 바로 등록 가능합니다',
    responseEN: 'Here\'s info about Classes 🎓\n\nBrowse tango classes and workshops in the **Class** tab.\n- Search by group or instructor\n- View schedules and details\n- Register directly from the class page',
  },
  {
    keywords: ['venue', 'place', 'location', 'address', '장소', '베뉴', '주소', '위치'],
    responseKR: '베뉴 관련 안내입니다 📍\n\n**Venues** 탭에서 전 세계 탱고 베뉴를 검색할 수 있습니다.\n- 상세 정보, 위치, 이벤트 확인\n- 리뷰 확인 가능\n- 지도에서 주변 베뉴 검색',
    responseEN: 'Here\'s info about Venues 📍\n\nSearch tango venues worldwide in the **Venues** tab.\n- View details, location, and events\n- Check reviews\n- Find nearby venues on the map',
  },
  {
    keywords: ['shop', 'buy', 'shoe', 'clothing', '쇼핑', '구매', '신발', '의류', '상품'],
    responseKR: '쇼핑 관련 안내입니다 🛍️\n\n**Shop** 탭에서 탱고 슈즈, 의류, 액세서리를 구매할 수 있습니다.\n중고 거래는 **Resale** 탭을 이용해 주세요.',
    responseEN: 'Here\'s info about Shopping 🛍️\n\nBrowse tango shoes, clothing, and accessories in the **Shop** tab.\nFor second-hand items, check the **Resale** tab.',
  },
  {
    keywords: ['rental', 'rent', '렌탈', '대여', '대관'],
    responseKR: '렌탈 관련 안내입니다 🤝\n\n**Rental** 탭에서 베뉴 대관 및 의상/장비 렌탈 서비스를 이용할 수 있습니다.\n- 렌탈 상품 등록도 가능합니다',
    responseEN: 'Here\'s info about Rentals 🤝\n\nFind venue bookings and costume/equipment rentals in the **Rental** tab.\n- You can also list your own items for rent',
  },
  {
    keywords: ['stay', 'accommodation', 'hotel', 'airbnb', '숙소', '호텔', '숙박'],
    responseKR: '숙소 관련 안내입니다 🏠\n\n**Stay** 탭에서 여행하는 댄서를 위한 숙소를 찾을 수 있습니다.\n- 이벤트 기간 동안의 숙소 검색\n- 위시리스트 기능으로 관심 숙소 저장',
    responseEN: 'Here\'s info about Accommodation 🏠\n\nFind accommodation for traveling dancers in the **Stay** tab.\n- Search stays during event periods\n- Save favorites with the wishlist feature',
  },
  {
    keywords: ['error', 'bug', 'crash', 'not working', 'broken', '오류', '에러', '안돼', '고장', '작동', '안됨', '문제'],
    responseKR: '불편을 드려 죄송합니다 😥\n\n문제 해결을 위해 다음 정보를 남겨주세요:\n1. 어떤 페이지에서 발생했나요?\n2. 어떤 동작을 하다가 문제가 생겼나요?\n3. 에러 메시지가 있다면 스크린샷을 첨부해 주세요.\n\n임시로 페이지 새로고침을 시도해 보세요. 기술팀이 확인 후 답변드리겠습니다!',
    responseEN: 'Sorry for the inconvenience 😥\n\nTo help resolve this, please share:\n1. Which page were you on?\n2. What were you trying to do?\n3. Please attach a screenshot of any error messages.\n\nTry refreshing the page as a temporary fix. Our tech team will investigate and respond!',
  },
];

/**
 * Find the best keyword match for a given content
 */
export function findKeywordMatch(content: string): { responseKR: string; responseEN: string } | null {
  const lower = content.toLowerCase();
  
  let bestMatch: typeof KEYWORD_RESPONSES[0] | null = null;
  let bestScore = 0;

  for (const entry of KEYWORD_RESPONSES) {
    const score = entry.keywords.filter(kw => lower.includes(kw)).length;
    if (score > bestScore) {
      bestScore = score;
      bestMatch = entry;
    }
  }

  return bestMatch && bestScore > 0 ? { responseKR: bestMatch.responseKR, responseEN: bestMatch.responseEN } : null;
}
