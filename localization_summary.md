# WoC Localization Audit Report

**Total Hardcoded Korean Instances:** 616

## Summary by File
- **\src\components\groups\functionBuilderData.ts**: 99 instances
- **\src\app\admin\seed-scenario\page.tsx**: 34 instances
- **\src\components\chat\ChatRoom.tsx**: 33 instances
- **\src\lib\ai\wocSystemGuide.ts**: 32 instances
- **\src\types\stay.ts**: 29 instances
- **\src\app\events\page.tsx**: 27 instances
- **\src\types\event.ts**: 24 instances
- **\src\components\groups\GroupAccountEditor.tsx**: 23 instances
- **\src\app\pt\slides-s2.tsx**: 21 instances
- **\src\app\pt1\slides-s2.tsx**: 21 instances
- **\src\types\booking.ts**: 18 instances
- **\src\app\pt\slides-s5.tsx**: 17 instances
- **\src\app\pt1\slides-s5.tsx**: 17 instances
- **\src\lib\constants\navigation.ts**: 15 instances
- **\src\lib\constants\socialData.ts**: 14 instances
- **\src\types\shop.ts**: 14 instances
- **\src\app\api\seed-rentals\route.ts**: 12 instances
- **\src\app\pt\slides-s3.tsx**: 12 instances
- **\src\app\pt1\slides-s3.tsx**: 12 instances
- **\src\app\pt\slides-s6.tsx**: 11 instances
- **\src\app\pt1\slides-s6.tsx**: 11 instances
- **\src\lib\ai\helpDeskAI.ts**: 10 instances
- **\src\types\lostFound.ts**: 10 instances
- **\src\types\group.ts**: 9 instances
- **\src\app\seed-rentals\page.tsx**: 7 instances
- **\src\app\stay\[id]\checkout\page.tsx**: 7 instances
- **\src\app\@modal\(.)stay\[id]\page.bak.tsx**: 5 instances
- **\src\app\pt\slides-s4.tsx**: 5 instances
- **\src\app\pt1\slides-s4.tsx**: 5 instances
- **\src\components\groups\GroupHome.tsx**: 5 instances
- **\src\app\actions\smsActions.ts**: 4 instances
- **\src\components\class\ClassDetail.tsx**: 3 instances
- **\src\components\groups\GroupAbout.tsx**: 3 instances
- **\src\components\layout\NavigationDrawer.tsx**: 3 instances
- **\src\components\social\SocialHeroCard.tsx**: 3 instances
- **\src\hooks\useBookingEngine.ts**: 3 instances
- **\src\lib\firebase\feedService.ts**: 3 instances
- **\src\app\admin\todo\page.tsx**: 2 instances
- **\src\app\pt\page.tsx**: 2 instances
- **\src\app\pt1\page.tsx**: 2 instances
- **\src\app\social\page.tsx**: 2 instances
- **\src\components\auth\AuthModal.tsx**: 2 instances
- **\src\components\groups\GroupCalendar.tsx**: 2 instances
- **\src\components\providers\AuthProvider.tsx**: 2 instances
- **\src\lib\firebase\galleryService.ts**: 2 instances
- **\src\app\admin\banners\page.tsx**: 1 instances
- **\src\app\api\notifications\route.ts**: 1 instances
- **\src\app\groups\page.tsx**: 1 instances
- **\src\app\stay\[id]\checkout\complete\page.tsx**: 1 instances
- **\src\components\class\ClassPortal.tsx**: 1 instances
- **\src\components\feed\MediaViewerPopup.tsx**: 1 instances
- **\src\components\groups\GroupHomeConfig.tsx**: 1 instances
- **\src\components\layout\InAppBrowserGuard.tsx**: 1 instances
- **\src\components\stay\StayReservationFlow.tsx**: 1 instances
- **\src\hooks\useHistoryBack.ts**: 1 instances
- **\src\hooks\useModalNavigation.ts**: 1 instances
- **\src\hooks\useNavigationGuard.ts**: 1 instances
- **\src\lib\firebase\chatService.ts**: 1 instances
- **\src\lib\firebase\fcmService.ts**: 1 instances
- **\src\lib\firebase\notificationService.ts**: 1 instances
- **\src\lib\firebase\shopService.ts**: 1 instances
- **\src\scripts\find-venue.ts**: 1 instances
- **\src\types\rental.ts**: 1 instances
- **\src\types\venue.ts**: 1 instances

## Detailed Findings (Top 10 Files)

### \src\components\groups\functionBuilderData.ts
```typescript
Line 24: subtitle: '운영 관리 시스템',
Line 27: { id: 'brand-setting', icon: 'palette', title: 'Brand Setting', subtitle: '브랜드 설정', description: '브랜드 색상, 로고 및 고유 아이덴티티 구성', price: 'Free', status: 'INSTALLED', mandatory: true },
Line 28: { id: 'class-setting', icon: 'school', title: 'Class Setting', subtitle: '수업 설정', description: '수업 커리큘럼 정의 및 강의실 공간 배정', price: 'Free', status: 'ALPHA' },
Line 29: { id: 'rental-setting', icon: 'key', title: 'Rental Setting', subtitle: '대여 설정', description: '공간 및 장비 대여 규칙, 보증금 시스템 설정', price: 'Free', status: 'MIGRATE' },
Line 30: { id: 'shop-setting', icon: 'storefront', title: 'Shop Setting', subtitle: '상점 설정', description: '커머스 인프라, 결제 게이트웨이 및 배송 정책', price: 'Free', status: 'ACTIVE' },
Line 31: { id: 'stay-setting', icon: 'bed', title: 'Stay Setting', subtitle: '스테이 설정', description: '숙박 및 워크스테이 예약 엔진 커스터마이징', price: 'Free', status: 'ALPHA' },
Line 37: subtitle: '핵심 기본 시스템',
Line 40: { id: 'dashboard', icon: 'dashboard', title: 'Dashboard', subtitle: '대시보드', description: '전체 커뮤니티 활동 및 주요 지표 실시간 요약', price: 'Free', status: 'INSTALLED', mandatory: true },
Line 41: { id: 'calendar', icon: 'calendar_today', title: 'Calendar', subtitle: '캘린더', description: '공유 일정 및 커뮤니티 이벤트 타임라인', price: 'Free', status: 'ACTIVE', mandatory: true },
Line 42: { id: 'feed', icon: 'dynamic_feed', title: 'Feed', subtitle: '피드', description: '소셜 뉴스피드 및 멤버 간 소통 타임라인', price: 'Free', status: 'ACTIVE', mandatory: true },
... and 89 more
```

### \src\app\admin\seed-scenario\page.tsx
```typescript
Line 20: alert('Admin 계정과 User 계정을 모두 입력해주세요.');
Line 26: addLog('🚀 시드 시나리오 생성을 시작합니다...');
Line 30: addLog(`사용자 검색 중: ${adminAccount}, ${userAccount}`);
Line 41: if (adminSnap.empty) throw new Error(`Admin 사용자를 찾을 수 없습니다: ${adminAccount}`);
Line 42: if (userSnap.empty) throw new Error(`User 사용자를 찾을 수 없습니다: ${userAccount}`);
Line 47: addLog(`✅ 유저 매칭 성공! Admin(${adminUser.nickname}), User(${normalUser.nickname})`);
Line 57: description: '시나리오로 생성된 테스트 그룹입니다.',
Line 67: addLog('✅ [1/5] 그룹 데이터 (Tango Life Seoul) 생성 준비됨.');
Line 85: addLog('✅ [2/5] 그룹 멤버 권한 (owner, active) 부여 준비됨.');
Line 91: title: '밀롱가 초급 집중 클래스 (Seed)',
... and 24 more
```

### \src\components\chat\ChatRoom.tsx
```typescript
Line 315: ORDER_PLACED: ['[ORDER PLACED]', '[새 주문 알림]', '[주문 완료]'],
Line 316: PAYMENT_REPORTED: ['[PAYMENT REPORTED]', '[입금 완료 보고]', '[결제 보고됨]'],
Line 317: PRODUCT_INQUIRY: ['[PRODUCT INQUIRY]', '[상품 문의]'],
Line 318: STAY_BOOKING: ['[STAY BOOKING]', '[숙소 예약]', '[스테이 예약]'],
Line 319: STAY_PAYMENT: ['[STAY PAYMENT]', '[숙소 입금]', '[스테이 결제]'],
Line 320: RENTAL_INQUIRY: ['[RENTAL INQUIRY]', '[대관 문의]', '[렌탈 문의]']
Line 326: const orderNo = getVal(lines, ['Order No', '주문번호', '주문 번호']);
Line 327: const product = getVal(lines, ['Product', '상품명']);
Line 328: const option = getVal(lines, ['Option', '옵션']);
Line 329: const amount = getVal(lines, ['Amount', '결제금액', '수량']);
... and 23 more
```

### \src\lib\ai\wocSystemGuide.ts
```typescript
Line 154: keywords: ['login', 'log in', 'sign in', 'signin', '로그인', '접속', '인증', 'verification', 'sms', '문자'],
Line 155: responseKR: '로그인 관련 안내입니다 📱\n\n1. 올바른 국가 코드를 선택했는지 확인해 주세요.\n2. SMS 인증 코드를 받지 못했다면 60초 후 다시 시도해 주세요.\n3. 계속 문제가 있다면 사용 중인 전화번호와 함께 상세히 남겨주세요.',
Line 159: keywords: ['register', 'registration', 'book', 'booking', 'ticket', '등록', '예약', '티켓', '신청', 'sign up'],
Line 160: responseKR: '이벤트 등록 방법 안내입니다 🎫\n\n1. 해당 이벤트/소셜 페이지로 이동\n2. **Registration** 탭을 탭\n3. 원하는 패키지를 선택\n4. 결제를 완료하면 등록 완료!\n\n등록 내역은 My Page → History에서 확인 가능합니다.',
Line 164: keywords: ['milonga', 'social', 'practica', '밀롱가', '프랙티카', 'dance', '춤', '소셜'],
Line 165: responseKR: '소셜/밀롱가 관련 안내입니다 💃\n\n**Social** 탭에서 전 세계 밀롱가와 프랙티카를 확인하실 수 있습니다.\n- 도시/날짜별 필터링 가능\n- DJ 라인업, 스케줄, 드레스코드 확인\n- 바로 등록/예약 가능\n\n각 소셜에는 Home / Programs / Feed / Live / Registration 탭이 있습니다.',
Line 169: keywords: ['event', 'festival', 'marathon', 'encuentro', '이벤트', '페스티벌', '마라톤'],
Line 170: responseKR: '이벤트/페스티벌 관련 안내입니다 🎉\n\n**Events** 탭에서 페스티벌, 마라톤, 엔쿠엔트로 등 특별 이벤트를 확인하세요.\n- 아티스트/강사 프로필 확인\n- 상세 프로그램 일정 확인\n- 패키지 선택 및 등록 가능\n\n각 이벤트에는 Home / Programs / Feed / Live / Registration 탭이 있습니다.',
Line 174: keywords: ['group', 'groups', 'join', '그룹', '가입', '소모임', 'member'],
Line 175: responseKR: '그룹 관련 안내입니다 👥\n\n**Groups** 탭에서 커뮤니티 그룹을 찾아 가입하실 수 있습니다.\n- 가입하면 그룹 채팅방이 자동 생성됩니다\n- 그룹 캘린더, 피드, 이벤트 확인 가능\n- 멤버 초대도 가능합니다\n\n새 그룹 개설도 가능합니다!',
... and 22 more
```

### \src\types\stay.ts
```typescript
Line 18: baseRate: number;          // 1박 기본 요금
Line 31: swiftCode?: string;        // 해외 송금용
Line 36: transferDeadlineHours: number; // 입금 기한 (시간)
Line 66: paymentRequest?: string;   // 입금 요청 템플릿
Line 67: confirmed?: string;        // 계약 확정 템플릿
Line 68: doorCode?: string;         // 비밀번호 전송 템플릿
Line 86: doorCode: string;           // 기본 "9999"
Line 105: status?: 'liked' | 'pending' | 'in_progress'; // 비즈니스 파이프라인 상태
Line 116: | 'APPLIED'               // ① 손님이 예약 신청
Line 117: | 'PAYMENT_REQUESTED'     // ② 관리자가 입금 요청 SMS 발송
... and 19 more
```

### \src\app\events\page.tsx
```typescript
Line 31: 'korea': 'kr', 'south korea': 'kr', 'korea, republic of': 'kr', '대한민국': 'kr', '한국': 'kr',
Line 32: 'japan': 'jp', '일본': 'jp',
Line 33: 'china': 'cn', '중국': 'cn',
Line 34: 'taiwan': 'tw', '대만': 'tw',
Line 35: 'hong kong': 'hk', '홍콩': 'hk',
Line 36: 'united states': 'us', 'usa': 'us', 'us': 'us', '미국': 'us',
Line 37: 'argentina': 'ar', '아르헨티나': 'ar',
Line 38: 'singapore': 'sg', '싱가포르': 'sg',
Line 39: 'uk': 'gb', 'united kingdom': 'gb', 'england': 'gb', '영국': 'gb',
Line 40: 'france': 'fr', '프랑스': 'fr',
... and 17 more
```

### \src\types\event.ts
```typescript
Line 7: id: string;                      // "G1", "C1", "A1" 등 (오거나이저가 지정)
Line 9: titleNative?: string;            // "탱고 살롱"
Line 10: description?: string;            // 영문 상세 설명
Line 12: category?: string;               // "일반수업" / "파트너수업" / "세미나리오" (그룹핑용)
Line 18: duration?: number;               // 분 (80분)
Line 22: level?: string;                  // "all" | "adv" | "intermediate" 등
Line 24: isRecommended?: boolean;         // 강사 추천 태그
Line 32: capacityUnit?: 'person' | 'couple'; // "15명" vs "12팀"
Line 35: price?: number;                  // 이 프로그램의 가격 (시리즈 전체 or 1회)
Line 36: priceUnit?: 'total' | 'per_session'; // 시리즈 전체가격 vs 회당가격
... and 14 more
```

### \src\components\groups\GroupAccountEditor.tsx
```typescript
Line 121: <option value="KB국민은행" className="bg-[#0a0f1d] text-white font-normal">{t("bank.kb", "KB Kookmin Bank")}</option>
Line 122: <option value="신한은행" className="bg-[#0a0f1d] text-white font-normal">{t("bank.shinhan", "Shinhan Bank")}</option>
Line 123: <option value="하나은행" className="bg-[#0a0f1d] text-white font-normal">{t("bank.hana", "Hana Bank")}</option>
Line 124: <option value="우리은행" className="bg-[#0a0f1d] text-white font-normal">{t("bank.woori", "Woori Bank")}</option>
Line 125: <option value="NH농협은행" className="bg-[#0a0f1d] text-white font-normal">{t("bank.nh", "NH Nonghyup Bank")}</option>
Line 126: <option value="IBK기업은행" className="bg-[#0a0f1d] text-white font-normal">{t("bank.ibk", "IBK Industrial Bank")}</option>
Line 127: <option value="카카오뱅크" className="bg-[#0a0f1d] text-white font-normal">{t("bank.kakao", "KakaoBank")}</option>
Line 128: <option value="토스뱅크" className="bg-[#0a0f1d] text-white font-normal">{t("bank.toss", "Toss Bank")}</option>
Line 129: <option value="케이뱅크" className="bg-[#0a0f1d] text-white font-normal">{t("bank.kbank", "K Bank")}</option>
Line 132: <option value="iM뱅크" className="bg-[#0a0f1d] text-white font-normal">{t("bank.im", "iM Bank (formerly DGB)")}</option>
... and 13 more
```

### \src\app\pt\slides-s2.tsx
```typescript
Line 26: 사람들의 돈은<br/><b className="text-black">여기로</b> 흐른다.
Line 67: { color: 'bg-[#4285F4]', title: 'Life Money', amount: '700,000 KRW (23.3%)', desc: '취미, 관심사, 커뮤니티' },
Line 68: { color: 'bg-[#F09090]', title: 'Optional Spend', amount: '300,000 KRW (10.0%)', desc: '저축, 투자, 여가 예비' },
Line 69: { color: 'bg-[#E53935]', title: 'Dead Spend', amount: '2,000,000 KRW (66.7%)', desc: '통신비, 주거비, 식비, 교통비, 보험료, 구독료 등' },
Line 89: 취미가 &apos;라이프스타일 그 자체&apos;인 중산층 상층 매니아들에게는{' '}
Line 90: <span className="font-bold text-[#E53935]">20~30%가 매우 표준적</span>이고 합리적인 지출 범위라고 볼 수 있습니다.
Line 95: <p className="text-[11px] font-bold text-black/45">통계청</p>
Line 96: <p className="text-[10px] text-black/30 mt-0.5 leading-[1.4]">최근 소비 트렌드 조사 (2025~2026)</p>
Line 97: <p className="text-[10px] text-black/30 mt-0.5 leading-[1.4]">전문 취미 가구의 소비 구조 (Self-Actualization Spending)</p>
Line 116: { ko: '세금은 자동이다', en: 'Taxes are automatic.' },
... and 11 more
```

### \src\app\pt1\slides-s2.tsx
```typescript
Line 26: 사람들의 돈은<br/><b className="text-black">여기로</b> 흐른다.
Line 67: { color: 'bg-[#4285F4]', title: 'Life Money', amount: '700,000 KRW (23.3%)', desc: '취미, 관심사, 커뮤니티' },
Line 68: { color: 'bg-[#F09090]', title: 'Optional Spend', amount: '300,000 KRW (10.0%)', desc: '저축, 투자, 여가 예비' },
Line 69: { color: 'bg-[#E53935]', title: 'Dead Spend', amount: '2,000,000 KRW (66.7%)', desc: '통신비, 주거비, 식비, 교통비, 보험료, 구독료 등' },
Line 89: 취미가 &apos;라이프스타일 그 자체&apos;인 중산층 상층 매니아들에게는{' '}
Line 90: <span className="font-bold text-[#E53935]">20~30%가 매우 표준적</span>이고 합리적인 지출 범위라고 볼 수 있습니다.
Line 95: <p className="text-[11px] font-bold text-black/45">통계청</p>
Line 96: <p className="text-[10px] text-black/30 mt-0.5 leading-[1.4]">최근 소비 트렌드 조사 (2025~2026)</p>
Line 97: <p className="text-[10px] text-black/30 mt-0.5 leading-[1.4]">전문 취미 가구의 소비 구조 (Self-Actualization Spending)</p>
Line 116: { ko: '세금은 자동이다', en: 'Taxes are automatic.' },
... and 11 more
```
