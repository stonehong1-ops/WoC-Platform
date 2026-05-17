**Summary:** Found **513** instances of hardcoded Korean text across **55** files.

# 🌐 Missing Localization Report (Korean Text Found)

This report lists all hardcoded Korean text found in the `.tsx` and `.ts` files inside `src` directory (excluding comments, `LanguageContext.tsx`, and presentation slides).

### `src/app/@modal/(.)stay/[id]/page.bak.tsx`
| Line | Content |
|---|---|
| 171 | `alert('링크가 복사되었습니다.');` |
| 212 | `alert('선택하신 기간 사이에 예약 불가능한 날짜가 포함되어 있습니다.');` |
| 319 | `<p className="font-body-md">스테이를 찾을 수 없습니다.</p>` |
| 605 | `alert('주소가 복사되었습니다.');` |
| 609 | `title="주소 복사"` |

### `src/app/actions/smsActions.ts`
| Line | Content |
|---|---|
| 13 | `return { success: false, error: 'Solapi 환경 변수 누락 (env.local 확인 필요)' };` |
| 26 | `autoTypeDetect: true, // 메시지 길이에 따라 SMS/LMS/MMS 자동 전환` |
| 33 | `return { success: false, error: error.message \|\| '문자 발송에 실패했습니다.' };` |

### `src/app/admin/banners/page.tsx`
| Line | Content |
|---|---|
| 192 | `<p className="text-sm text-outline mb-4">Home 페이지 &quot;Stories from Seoul&quot; 섹션에 표시될 2개의 포스트를...` |

### `src/app/admin/seed-scenario/page.tsx`
| Line | Content |
|---|---|
| 20 | `alert('Admin 계정과 User 계정을 모두 입력해주세요.');` |
| 26 | `addLog('🚀 시드 시나리오 생성을 시작합니다...');` |
| 30 | `addLog(\`사용자 검색 중: ${adminAccount}, ${userAccount}\`);` |
| 41 | `if (adminSnap.empty) throw new Error(\`Admin 사용자를 찾을 수 없습니다: ${adminAccount}\`);` |
| 42 | `if (userSnap.empty) throw new Error(\`User 사용자를 찾을 수 없습니다: ${userAccount}\`);` |
| 47 | `addLog(\`✅ 유저 매칭 성공! Admin(${adminUser.nickname}), User(${normalUser.nickname})\`);` |
| 57 | `description: '시나리오로 생성된 테스트 그룹입니다.',` |
| 67 | `addLog('✅ [1/5] 그룹 데이터 (Tango Life Seoul) 생성 준비됨.');` |
| 85 | `addLog('✅ [2/5] 그룹 멤버 권한 (owner, active) 부여 준비됨.');` |
| 91 | `title: '밀롱가 초급 집중 클래스 (Seed)',` |
| 92 | `description: '시나리오 생성용 더미 클래스입니다.',` |
| 99 | `instructors: [{ name: adminUser.nickname \|\| '강사', role: 'Main Instructor' }],` |
| 101 | `{ week: 1, date: '2026-05-10', timeSlot: '19:00 - 21:00', content: '밀롱가 베이직' },` |
| 102 | `{ week: 2, date: '2026-05-17', timeSlot: '19:00 - 21:00', content: '밀롱가 리듬' }` |
| 106 | `addLog('✅ [3/5] 그룹 내 클래스 (밀롱가 초급) 생성 준비됨.');` |
| 115 | `classTitle: '밀롱가 초급 집중 클래스 (Seed)',` |
| 118 | `status: 'PAYMENT_REPORTED', // 관리자 승인 대기 상태` |
| 128 | `addLog('✅ [4/5] 일반 사용자의 클래스 수강 신청 내역(History) 생성 준비됨.');` |
| 133 | `addLog('💾 DB Batch 저장 완료!');` |
| 140 | `title: '그룹 가입 승인',` |
| 141 | `message: \`'Tango Life Seoul' 그룹의 가입이 승인되었습니다.\`,` |
| 150 | `title: '새로운 수강 신청',` |
| 151 | `message: \`${normalUser.nickname}님이 '밀롱가 초급 집중 클래스'에 수강 신청(입금보고)을 하였습니다.\`,` |
| 156 | `addLog('✅ [5/5] 두 사용자의 알림(Notifications) 발송 완료!');` |
| 157 | `addLog('🎉 시나리오 씨드 데이터 생성이 성공적으로 완료되었습니다.');` |
| 161 | `addLog(\`❌ 오류 발생: ${error.message}\`);` |
| 168 | `return <div className="p-10 text-center text-red-500 font-bold">접근 권한이 없습니다 (시스템 관리자만 가능).</div>;` |
| 173 | `<h1 className="text-2xl font-black mb-6">🌱 시나리오 기반 씨드 데이터 생성기</h1>` |
| 175 | `이 도구는 상상된 가짜 데이터가 아니라, 실제 서비스의 <code>addDoc</code>, <code>setDoc</code> 구조와 타임스탬프 로직을 그대로 거쳐 그룹, ...` |
| 180 | `<label className="block text-sm font-bold text-gray-700 mb-2">Admin 계정 (이메일 또는 전화번호)</label>` |
| 184 | `placeholder="admin@example.com 또는 +8210..."` |
| 190 | `<label className="block text-sm font-bold text-gray-700 mb-2">User 계정 (이메일 또는 전화번호)</label>` |
| 194 | `placeholder="user@example.com 또는 +8210..."` |
| 204 | `{loading ? '생성 중...' : '시나리오 데이터 주입 실행'}` |

### `src/app/admin/todo/page.tsx`
| Line | Content |
|---|---|
| 255 | `const msg = \`[WoC 신청 안내]\n${guestName}님, '${booking.stayTitle}' 신청이 접수되었습니다.\n\n아래 계좌로 ${totalPri...` |
| 271 | `const msg = \`[WoC 등록 확정]\n${guestName}님, 입금이 확인되어 '${booking.stayTitle}' 등록이 최종 확정되었습니다!\n\n■ 일정:...` |

### `src/app/api/notifications/route.ts`
| Line | Content |
|---|---|
| 31 | `title: title \|\| '알림',` |

### `src/app/api/seed-rentals/route.ts`
| Line | Content |
|---|---|
| 16 | `title: groupData.name \|\| '스튜디오',` |
| 17 | `description: groupData.description \|\| '쾌적한 댄스 스튜디오입니다.',` |
| 18 | `location: groupData.description?.includes('마포구') ? '마포구' :` |
| 19 | `groupData.description?.includes('강남구') ? '강남구' :` |
| 20 | `groupData.description?.includes('성동구') ? '성동구' :` |
| 21 | `groupData.description?.includes('해운대구') ? '해운대구' :` |
| 22 | `groupData.description?.includes('유성구') ? '유성구' :` |
| 23 | `groupData.description?.includes('부산진구') ? '부산진구' : '서울',` |
| 24 | `address: groupData.description?.split('위치한')?.[0]?.trim() \|\| '상세주소 미정',` |
| 25 | `category: '댄스 스튜디오',` |
| 28 | `facilities: ['전면 거울', '블루투스 오디오', '정수기', '마루 바닥'],` |
| 29 | `rules: '실내 전용 운동화(댄스화) 착용 필수, 음식물 반입 금지',` |

### `src/app/events/page.tsx`
| Line | Content |
|---|---|
| 31 | `'korea': 'kr', 'south korea': 'kr', 'korea, republic of': 'kr', '대한민국': 'kr', '한국': 'kr',` |
| 32 | `'japan': 'jp', '일본': 'jp',` |
| 33 | `'china': 'cn', '중국': 'cn',` |
| 34 | `'taiwan': 'tw', '대만': 'tw',` |
| 35 | `'hong kong': 'hk', '홍콩': 'hk',` |
| 36 | `'united states': 'us', 'usa': 'us', 'us': 'us', '미국': 'us',` |
| 37 | `'argentina': 'ar', '아르헨티나': 'ar',` |
| 38 | `'singapore': 'sg', '싱가포르': 'sg',` |
| 39 | `'uk': 'gb', 'united kingdom': 'gb', 'england': 'gb', '영국': 'gb',` |
| 40 | `'france': 'fr', '프랑스': 'fr',` |
| 41 | `'germany': 'de', '독일': 'de',` |
| 42 | `'italy': 'it', '이탈리아': 'it',` |
| 43 | `'spain': 'es', '스페인': 'es',` |
| 44 | `'australia': 'au', '호주': 'au',` |
| 45 | `'canada': 'ca', '캐나다': 'ca',` |
| 46 | `'brazil': 'br', '브라질': 'br',` |
| 47 | `'mexico': 'mx', '멕시코': 'mx',` |
| 48 | `'vietnam': 'vn', '베트남': 'vn',` |
| 49 | `'thailand': 'th', '태국': 'th',` |
| 50 | `'indonesia': 'id', '인도네시아': 'id',` |
| 51 | `'malaysia': 'my', '말레이시아': 'my',` |
| 52 | `'philippines': 'ph', '필리핀': 'ph',` |
| 150 | `return; // 중첩 모달 닫힘` |
| 191 | `'korea': [/\bkr\b/i, /\bkorea\b/i, /대한민국/, /한국/],` |
| 192 | `'japan': [/\bjp\b/i, /\bjapan\b/i, /일본/],` |
| 193 | `'china': [/\bcn\b/i, /\bchina\b/i, /중국/],` |
| 194 | `'taiwan': [/\btw\b/i, /\btaiwan\b/i, /대만/],` |

### `src/app/groups/page.tsx`
| Line | Content |
|---|---|
| 24 | `const dongMatch = address.match(/(\S+동)/);` |

### `src/app/pt/page.tsx`
| Line | Content |
|---|---|
| 25 | `7: '/groups/freestyletango?tab=calendar', // Slide 7: Calendar / 돈은 여기로 흐른다` |
| 26 | `14: '/groups/freestyletango?tab=class', // Slide 14: Booking / 커뮤니티 거대 경제` |

### `src/app/pt/slides-s2.tsx`
| Line | Content |
|---|---|
| 26 | `사람들의 돈은<br/><b className="text-black">여기로</b> 흐른다.` |
| 67 | `{ color: 'bg-[#4285F4]', title: 'Life Money', amount: '700,000 KRW (23.3%)', desc: '취미, 관심사, 커뮤니티...` |
| 68 | `{ color: 'bg-[#F09090]', title: 'Optional Spend', amount: '300,000 KRW (10.0%)', desc: '저축, 투자, 여...` |
| 69 | `{ color: 'bg-[#E53935]', title: 'Dead Spend', amount: '2,000,000 KRW (66.7%)', desc: '통신비, 주거비, 식...` |
| 89 | `취미가 &apos;라이프스타일 그 자체&apos;인 중산층 상층 매니아들에게는{' '}` |
| 90 | `<span className="font-bold text-[#E53935]">20~30%가 매우 표준적</span>이고 합리적인 지출 범위라고 볼 수 있습니다.` |
| 95 | `<p className="text-[11px] font-bold text-black/45">통계청</p>` |
| 96 | `<p className="text-[10px] text-black/30 mt-0.5 leading-[1.4]">최근 소비 트렌드 조사 (2025~2026)</p>` |
| 97 | `<p className="text-[10px] text-black/30 mt-0.5 leading-[1.4]">전문 취미 가구의 소비 구조 (Self-Actualization...` |
| 116 | `{ ko: '세금은 자동이다', en: 'Taxes are automatic.' },` |
| 117 | `{ ko: '통신비는 고정이다', en: 'Telecom bills are fixed.' },` |
| 118 | `{ ko: '대출이자는 의무다', en: 'Loan interests are mandatory.' },` |
| 140 | `하지만<br/>` |
| 142 | `열정은 선택된다` |
| 160 | `사람들은 삶의 상당 부분을<br/>취미와 커뮤니티에 사용합니다.` |
| 166 | `{ label: 'Time', sub: 'Weekly Engagement', desc: '평균 15시간 이상의 활동적 참여' },` |
| 167 | `{ label: 'Emotion', sub: 'Social Connection', desc: '심리적 소속감과 정서적 교류' },` |
| 168 | `{ label: 'Spending', sub: 'Free Spending', desc: '자발적이고 반복적인 자금 투입' },` |
| 199 | `&quot;WoC는 사람(User)이 아닌 그룹(Group)을 중심으로 설계됩니다.&quot;` |
| 212 | `기존 플랫폼은 정보를 저장하고 소비한다<br/>` |
| 214 | `<span className="mt-2 block">WoC는 사람들이 실제로 움직이게 만든다</span>` |

### `src/app/pt/slides-s3.tsx`
| Line | Content |
|---|---|
| 28 | `작은 커뮤니티 하나에도<br/>거대한 경제가 존재한다` |
| 31 | `{['클래스', '워크샵', '공연', '여행', '장비.용품', '공간'].map((t, i) => (` |
| 39 | `단순한 취미 활동은 그 자체로 티켓팅, 예약, 렌탈, 멤버십이라는 거대한 비즈니스 인프라를 요구합니다.` |
| 66 | `{['클래스', '밀롱가', '워크샵', '슈즈', '의상', '여행', '숙박', '식음료', '대관'].map((t) => (` |
| 75 | `{ val: '45만원', label: '1인 평균 월 소비', sub: 'Class, Social, Goods' },` |
| 76 | `{ val: '108억', label: '연간 Activity Economy', sub: 'Estimated Market Size' },` |
| 77 | `{ val: '32억', label: 'WoC Connected GMV', sub: 'Target Transaction' },` |
| 78 | `{ val: '2.2억', label: '예상 플랫폼 매출/yr', sub: 'SaaS + Fee Revenue' },` |
| 90 | `&quot;취미는 단순한 여가가 아닙니다. 그것은 견고하고 반복적인 삶의 경제 체계입니다.&quot;` |
| 110 | `{['예약', '티켓', '클래스', '대관', '숙박', '멤버십', '상품'].map((t, i) => (` |
| 137 | `취미는 소비가 아니라<br/>` |
| 138 | `<span className="text-white">삶의 경제다</span>` |

### `src/app/pt/slides-s4.tsx`
| Line | Content |
|---|---|
| 18 | `Group은<br/>단순 커뮤니티가 아니다` |
| 34 | `<p className="mt-8 text-[24px] font-medium text-black/40 pt1-fu pt1-d3">모든 Group은 서로 다른 시스템을 가진다</p>` |
| 83 | `SalesForce.com 과 같은 서비스 라인업 확장` |
| 93 | `하나의 Group은<br/>하나의 살아있는 세계가 된다` |
| 102 | `<p className="text-[18px] md:text-[24px] text-white font-semibold break-keep">WoC는 커뮤니티를 위한 운영체제를...` |

### `src/app/pt/slides-s5.tsx`
| Line | Content |
|---|---|
| 39 | `<p className="text-[20px] md:text-[28px] text-[#444748] font-semibold break-keep pt1-fu pt1-d8">W...` |
| 58 | `클래스 등록 / 결제 승인 / 워크샵 운영<br/>` |
| 59 | `전문 교육 중심의 워크플로우` |
| 76 | `소셜 등록 / 티켓 / 이벤트 운영 / 테이블 예약<br/>` |
| 77 | `이벤트 및 공간 운영 중심의 워크플로우` |
| 95 | `강사와 오거나이저는<br/>새로운 onboarding node가 된다` |
| 115 | `<p className="text-[18px] md:text-[24px] text-[#1c1b1b] font-semibold break-keep">Group 자체가 onboa...` |
| 125 | `<span className="text-[32px] md:text-[48px] font-bold text-[#444748] pt1-fu pt1-d3">명 규모</span>` |
| 128 | `2개월 내 penetration 가능성 예상` |
| 130 | `<p className="text-[20px] md:text-[28px] text-[#444748] font-medium break-keep pt1-fu pt1-d5">광고보...` |
| 140 | `사람은 하나의 활동으로 살지 않는다` |
| 173 | `활동의 이동이 자연스럽게 새로운 커뮤니티를 만든다.<br/>` |
| 175 | `WoC는 회원을 광고로 모으지 않습니다.` |
| 187 | `사람들은 하나의 활동에만<br/>머물지 않는다` |
| 199 | `WoC는 활동 중심 network structure를 만든다.` |
| 208 | `WoC는 User Acquisition보다<br/>Community Penetration에 가깝다` |
| 212 | `WoC는 group 기반으로 확장된다.` |

### `src/app/pt/slides-s6.tsx`
| Line | Content |
|---|---|
| 24 | `사람들은 이제 거대한 SNS 피드보다,<br/>` |
| 25 | `자신의 취향과 가치가 일치하는 &lsquo;작고 강한 커뮤니티&rsquo;를 원합니다.` |
| 53 | `{ risk: 'Workflow Complexity', desc: '운영 시스템의 복잡도가 사용자 진입 장벽을 높일 위험' },` |
| 54 | `{ risk: 'Onboarding Difficulty', desc: '단순 가입이 아닌 시스템 구축 방식의 어려운 온보딩' },` |
| 55 | `{ risk: 'Slow Network Effects', desc: '그룹 기반 성장의 특성상 개인 유입보다 느린 확장 속도' },` |
| 56 | `{ risk: 'Feature Overload', desc: '광범위한 기능 지원으로 인한 핵심 가치 희석 및 운영 부담' },` |
| 75 | `그룹이 운영체제가 되는 순간` |
| 97 | `{['네이버카페', '밴드', '디스코드', '클래스 플랫폼'].map(t => (` |
| 117 | `{ label: 'Unicorn Platform', pct: '5-10%', desc: '글로벌 커뮤니티 활동을 독점하는 차세대 OS로의 도약' },` |
| 118 | `{ label: 'Strategic M&A', pct: '15-25%', desc: '빅테크 기업의 커뮤니티 데이터 및 비즈니스 레이어 인수' },` |
| 119 | `{ label: 'Infrastructure Leader', pct: '40-60%', desc: '전문 커뮤니티를 위한 가장 강력한 B2B SaaS 인프라 기업' },` |

### `src/app/seed-rentals/page.tsx`
| Line | Content |
|---|---|
| 61 | `rentalInfo: groupData.description \|\| '쾌적한 대관 공간입니다.',` |
| 75 | `title: (groupData.name \|\| '스튜디오') + ' 대관',` |
| 76 | `description: groupData.description \|\| '쾌적한 다목적 공간입니다.',` |
| 77 | `location: '서울',` |
| 78 | `address: groupData.description?.split('위치한')?.[0]?.trim() \|\| '서울',` |
| 82 | `facilities: ['Wi-Fi', '거울', '냉난방기'],` |
| 83 | `rules: '실내화 착용 필수, 음식물 반입 금지',` |

### `src/app/social/page.tsx`
| Line | Content |
|---|---|
| 453 | `if (d === '강북') return 0;` |
| 454 | `if (d === '강남') return 1;` |

### `src/app/stay/[id]/checkout/complete/page.tsx`
| Line | Content |
|---|---|
| 26 | `await stayBookingService.updateBookingStatus(bookingId, 'PAID', user.uid, '입금 완료 보고');` |

### `src/app/stay/[id]/checkout/page.tsx`
| Line | Content |
|---|---|
| 114 | `<p className="font-body-md">{t('stay.not_found', '스테이를 찾을 수 없습니다.')}</p>` |
| 158 | `alert(t('auth.login_required', '로그인이 필요합니다.'));` |
| 162 | `alert(t('checkout.missing_fields', '신청자 성함, 연락처, 입금자명을 모두 입력해주세요.'));` |
| 171 | `alert(t('checkout.no_payment_info', '결제 계좌 정보가 설정되지 않았습니다. 호스트에게 문의해주세요.'));` |
| 226 | `const smsContent = t('checkout.sms_content', '[WoC] 예약이 접수되었습니다.\n숙소: {title}\n일정: {checkIn} - {c...` |
| 279 | `alert(t('checkout.submit_failed', '예약 신청에 실패했습니다. ') + (error.message \|\| ''));` |
| 451 | `alert(t('checkout.account_copied', '계좌번호가 복사되었습니다!'));` |

### `src/components/auth/AuthModal.tsx`
| Line | Content |
|---|---|
| 391 | `setTimeoutCount(0); // 성공 시 카운트 초기화` |
| 800 | `placeholder={t('auth.native_nickname_placeholder', '스칼렛')}` |

### `src/components/chat/ChatRoom.tsx`
| Line | Content |
|---|---|
| 315 | `ORDER_PLACED: ['[ORDER PLACED]', '[새 주문 알림]', '[주문 완료]'],` |
| 316 | `PAYMENT_REPORTED: ['[PAYMENT REPORTED]', '[입금 완료 보고]', '[결제 보고됨]'],` |
| 317 | `PRODUCT_INQUIRY: ['[PRODUCT INQUIRY]', '[상품 문의]'],` |
| 318 | `STAY_BOOKING: ['[STAY BOOKING]', '[숙소 예약]', '[스테이 예약]'],` |
| 319 | `STAY_PAYMENT: ['[STAY PAYMENT]', '[숙소 입금]', '[스테이 결제]'],` |
| 320 | `RENTAL_INQUIRY: ['[RENTAL INQUIRY]', '[대관 문의]', '[렌탈 문의]']` |
| 326 | `const orderNo = getVal(lines, ['Order No', '주문번호', '주문 번호']);` |
| 327 | `const product = getVal(lines, ['Product', '상품명']);` |
| 328 | `const option = getVal(lines, ['Option', '옵션']);` |
| 329 | `const amount = getVal(lines, ['Amount', '결제금액', '수량']);` |
| 330 | `const image = getVal(lines, ['Image', '이미지']);` |
| 361 | `const orderNo = getVal(lines, ['Order No', '주문번호', '주문 번호']);` |
| 362 | `const depositor = getVal(lines, ['Depositor', '입금자명']);` |
| 409 | `const brand = getVal(lines, ['Brand', '브랜드']);` |
| 410 | `const title = getVal(lines, ['Title', '상품명']);` |
| 411 | `const price = getVal(lines, ['Price', '가격']);` |
| 412 | `const link = getVal(lines, ['Link', '링크', '바로가기']);` |
| 413 | `const image = getVal(lines, ['Image', '이미지']);` |
| 451 | `const stayName = getVal(lines, ['Stay', '숙소']);` |
| 452 | `const dates = getVal(lines, ['Dates', '일정']);` |
| 453 | `const nights = getVal(lines, ['Nights', '박', '숙박 일수']);` |
| 454 | `const guests = getVal(lines, ['Guests', '인원']);` |
| 455 | `const amount = getVal(lines, ['Amount', '금액']);` |
| 456 | `const applicant = getVal(lines, ['Applicant', '예약자']);` |
| 457 | `const image = getVal(lines, ['Image', '이미지']);` |
| 486 | `const stayName = getVal(lines, ['Stay', '숙소']);` |
| 487 | `const dates = getVal(lines, ['Dates', '일정']);` |
| 508 | `const space = getVal(lines, ['Space', '공간']);` |
| 509 | `const date = getVal(lines, ['Date', '날짜']);` |
| 510 | `const time = getVal(lines, ['Time', '시간']);` |
| 511 | `const purpose = getVal(lines, ['Purpose', '목적']);` |
| 512 | `const headcount = getVal(lines, ['Headcount', '인원']);` |
| 513 | `const message = getVal(lines, ['Message', '메시지']);` |

### `src/components/class/ClassDetail.tsx`
| Line | Content |
|---|---|
| 66 | `const [todayDistrict, setTodayDistrict] = useState<'ALL' \| '강북' \| '강남'>('ALL');` |
| 374 | `{['ALL', '강북', '강남'].map((district) => (` |
| 377 | `onClick={() => setTodayDistrict(district as 'ALL' \| '강북' \| '강남')}` |

### `src/components/class/ClassPortal.tsx`
| Line | Content |
|---|---|
| 759 | `<span className="text-[11px] font-medium text-[#acb3b4] ml-1">안단테</span>` |

### `src/components/feed/MediaViewerPopup.tsx`
| Line | Content |
|---|---|
| 63 | `history.back(); // popstate 발생 → handlePopState에서 onClose() 호출` |

### `src/components/groups/functionBuilderData.ts`
| Line | Content |
|---|---|
| 24 | `subtitle: '운영 관리 시스템',` |
| 27 | `{ id: 'brand-setting', icon: 'palette', title: 'Brand Setting', subtitle: '브랜드 설정', description: ...` |
| 28 | `{ id: 'class-setting', icon: 'school', title: 'Class Setting', subtitle: '수업 설정', description: '수...` |
| 29 | `{ id: 'rental-setting', icon: 'key', title: 'Rental Setting', subtitle: '대여 설정', description: '공간...` |
| 30 | `{ id: 'shop-setting', icon: 'storefront', title: 'Shop Setting', subtitle: '상점 설정', description: ...` |
| 31 | `{ id: 'stay-setting', icon: 'bed', title: 'Stay Setting', subtitle: '스테이 설정', description: '숙박 및 ...` |
| 37 | `subtitle: '핵심 기본 시스템',` |
| 40 | `{ id: 'dashboard', icon: 'dashboard', title: 'Dashboard', subtitle: '대시보드', description: '전체 커뮤니티...` |
| 41 | `{ id: 'calendar', icon: 'calendar_today', title: 'Calendar', subtitle: '캘린더', description: '공유 일정...` |
| 42 | `{ id: 'feed', icon: 'dynamic_feed', title: 'Feed', subtitle: '피드', description: '소셜 뉴스피드 및 멤버 간 소...` |
| 43 | `{ id: 'live', icon: 'live_tv', title: 'Live', subtitle: '라이브', description: '실시간 스트리밍 및 온라인 세미나 송...` |
| 44 | `{ id: 'notice', icon: 'campaign', title: 'Notice', subtitle: '공지사항', description: '중요 소식 알림 및 아카이...` |
| 45 | `{ id: 'about', icon: 'info', title: 'About', subtitle: '소개', description: '커뮤니티 비전 및 가이드라인 소개 페이지...` |
| 46 | `{ id: 'members', icon: 'groups', title: 'Members', subtitle: '멤버 목록', description: '참여 멤버 프로필 조회 ...` |
| 47 | `{ id: 'roles-permissions', icon: 'security', title: 'Roles & Permissions', subtitle: '역할 및 권한', d...` |
| 53 | `subtitle: '커뮤니티 및 소통',` |
| 56 | `{ id: 'polls', icon: 'how_to_vote', title: 'Polls', subtitle: '투표', description: '실시간 멤버 의견 수렴 및 ...` |
| 57 | `{ id: 'qa-board', icon: 'quiz', title: 'Q&A Board', subtitle: '질의응답 게시판', description: '지식 공유 및 아...` |
| 58 | `{ id: 'group-broadcast', icon: 'podcasts', title: 'Group Broadcast', subtitle: '그룹 방송', descripti...` |
| 59 | `{ id: 'attendance-check', icon: 'check_circle', title: 'Attendance Check', subtitle: '출석 체크', des...` |
| 60 | `{ id: 'community-rules', icon: 'gavel', title: 'Community Rules', subtitle: '커뮤니티 규정', descriptio...` |
| 61 | `{ id: 'surveys', icon: 'assignment', title: 'Surveys', subtitle: '설문조사', description: '정기 만족도 조사 ...` |
| 62 | `{ id: 'anonymous-posts', icon: 'visibility_off', title: 'Anonymous Posts', subtitle: '익명 게시판', de...` |
| 68 | `subtitle: '교육 및 학원 운영',` |
| 71 | `{ id: 'class-manager-a', icon: 'assignment_ind', title: 'Class Manager A', subtitle: '강좌 관리 A', d...` |
| 72 | `{ id: 'class-manager-b', icon: 'menu_book', title: 'Class Manager B', subtitle: '강좌 관리 B', descri...` |
| 73 | `{ id: 'class-manager-c', icon: 'auto_stories', title: 'Class Manager C', subtitle: '강좌 관리 C', des...` |
| 74 | `{ id: 'homework-tracker', icon: 'task_alt', title: 'Homework Tracker', subtitle: '과제 트래커', descri...` |
| 75 | `{ id: 'student-reports', icon: 'summarize', title: 'Student Reports', subtitle: '성적 리포트', descrip...` |
| 76 | `{ id: 'tuition-manager', icon: 'payments', title: 'Tuition Manager', subtitle: '수강료 관리', descript...` |
| 77 | `{ id: 'grade-system', icon: 'grade', title: 'Grade System', subtitle: '성적 등급 시스템', description: '...` |
| 78 | `{ id: 'parent-notifications', icon: 'notifications_active', title: 'Parent Notifications', subtit...` |
| 79 | `{ id: 'parent-consultation', icon: 'forum', title: 'Parent Consultation', subtitle: '학부모 상담', des...` |
| 80 | `{ id: 'exam-scheduler', icon: 'event_note', title: 'Exam Scheduler', subtitle: '시험 일정 관리', descri...` |
| 86 | `subtitle: '행사 및 예약 시스템',` |
| 89 | `{ id: 'event-manager', icon: 'event_available', title: 'Event Manager', subtitle: '이벤트 관리', descr...` |
| 90 | `{ id: 'ticket-booking', icon: 'confirmation_number', title: 'Ticket Booking', subtitle: '티켓 예매', ...` |
| 91 | `{ id: 'workshop-registration', icon: 'app_registration', title: 'Workshop Registration', subtitle...` |
| 92 | `{ id: 'venue-booking', icon: 'location_city', title: 'Venue Booking', subtitle: '장소 예약', descript...` |
| 93 | `{ id: 'table-reservation', icon: 'table_restaurant', title: 'Table Reservation', subtitle: '테이블 예...` |
| 94 | `{ id: 'qr-checkin', icon: 'qr_code_scanner', title: 'QR Check-In', subtitle: 'QR 체크인', descriptio...` |
| 95 | `{ id: 'waitlist-system', icon: 'pending', title: 'Waitlist System', subtitle: '대기 명단', descriptio...` |
| 96 | `{ id: 'retreat-planner', icon: 'travel_explore', title: 'Retreat Planner', subtitle: '리트릿 플래너', d...` |
| 97 | `{ id: 'event-staff-manager', icon: 'badge', title: 'Event Staff Manager', subtitle: '행사 스태프 관리', ...` |
| 98 | `{ id: 'guest-list-manager', icon: 'list_alt', title: 'Guest List Manager', subtitle: '게스트 리스트', d...` |
| 104 | `subtitle: '커뮤니티 경제 시스템',` |
| 107 | `{ id: 'group-shop', icon: 'store', title: 'Group Shop', subtitle: '그룹 상점', description: '커뮤니티 전용 ...` |
| 108 | `{ id: 'product-inventory', icon: 'inventory_2', title: 'Product Inventory', subtitle: '상품 재고', de...` |
| 109 | `{ id: 'rental-system', icon: 'handshake', title: 'Rental System', subtitle: '대여 시스템', description...` |
| 110 | `{ id: 'resale-market', icon: 'sell', title: 'Resale Market', subtitle: '리세일 마켓', description: '멤버...` |
| 111 | `{ id: 'coupon-system', icon: 'local_offer', title: 'Coupon System', subtitle: '쿠폰 시스템', descripti...` |
| 112 | `{ id: 'membership-billing', icon: 'credit_card', title: 'Membership Billing', subtitle: '멤버십 결제',...` |
| 113 | `{ id: 'wallet', icon: 'account_balance_wallet', title: 'Wallet', subtitle: '지갑', description: '포인...` |
| 114 | `{ id: 'donation-support', icon: 'volunteer_activism', title: 'Donation Support', subtitle: '후원 시스...` |
| 115 | `{ id: 'subscription-plans', icon: 'autorenew', title: 'Subscription Plans', subtitle: '구독 플랜', de...` |
| 116 | `{ id: 'settlement-reports', icon: 'receipt_long', title: 'Settlement Reports', subtitle: '정산 리포트'...` |
| 122 | `subtitle: '운영 및 조직 관리',` |
| 125 | `{ id: 'task-manager', icon: 'task', title: 'Task Manager', subtitle: '업무 관리', description: '팀 업무 ...` |
| 126 | `{ id: 'internal-wiki', icon: 'article', title: 'Internal Wiki', subtitle: '내부 위키', description: '...` |
| 127 | `{ id: 'staff-scheduling', icon: 'calendar_month', title: 'Staff Scheduling', subtitle: '스태프 스케줄링'...` |
| 128 | `{ id: 'payroll-tracker', icon: 'account_balance', title: 'Payroll Tracker', subtitle: '급여 추적', de...` |
| 129 | `{ id: 'expense-tracker', icon: 'money_off', title: 'Expense Tracker', subtitle: '지출 추적', descript...` |
| 130 | `{ id: 'asset-management', icon: 'inventory', title: 'Asset Management', subtitle: '자산 관리', descri...` |
| 131 | `{ id: 'recruitment', icon: 'person_add', title: 'Recruitment', subtitle: '채용 관리', description: '채...` |
| 132 | `{ id: 'approval-workflow', icon: 'rule', title: 'Approval Workflow', subtitle: '승인 워크플로', descrip...` |
| 133 | `{ id: 'crm-lite', icon: 'contacts', title: 'CRM Lite', subtitle: 'CRM 라이트', description: '고객 관계 관...` |
| 134 | `{ id: 'internal-notices', icon: 'notifications', title: 'Internal Notices', subtitle: '내부 공지', de...` |
| 135 | `{ id: 'team-workspace', icon: 'workspaces', title: 'Team Workspace', subtitle: '팀 워크스페이스', descri...` |
| 136 | `{ id: 'project-roadmap', icon: 'map', title: 'Project Roadmap', subtitle: '프로젝트 로드맵', description...` |
| 137 | `{ id: 'sprint-board', icon: 'view_kanban', title: 'Sprint Board', subtitle: '스프린트 보드', descriptio...` |
| 138 | `{ id: 'okr-tracker', icon: 'track_changes', title: 'OKR Tracker', subtitle: 'OKR 트래커', descriptio...` |
| 139 | `{ id: 'investor-updates', icon: 'trending_up', title: 'Investor Updates', subtitle: '투자자 업데이트', d...` |
| 140 | `{ id: 'meeting-notes', icon: 'edit_note', title: 'Meeting Notes', subtitle: '회의록', description: '...` |
| 141 | `{ id: 'founder-dashboard', icon: 'dashboard_customize', title: 'Founder Dashboard', subtitle: '창업...` |
| 142 | `{ id: 'hiring-pipeline', icon: 'work', title: 'Hiring Pipeline', subtitle: '채용 파이프라인', descriptio...` |
| 143 | `{ id: 'document-vault', icon: 'folder_special', title: 'Document Vault', subtitle: '문서 보관함', desc...` |
| 144 | `{ id: 'company-wiki', icon: 'auto_stories', title: 'Company Wiki', subtitle: '회사 위키', description...` |
| 150 | `subtitle: '브랜딩 및 콘텐츠',` |
| 153 | `{ id: 'media-gallery', icon: 'collections', title: 'Media Gallery', subtitle: '미디어 갤러리', descript...` |
| 154 | `{ id: 'video-library', icon: 'video_library', title: 'Video Library', subtitle: '비디오 라이브러리', desc...` |
| 155 | `{ id: 'editorial-page', icon: 'newspaper', title: 'Editorial Page', subtitle: '에디토리얼 페이지', descri...` |
| 156 | `{ id: 'newsletter', icon: 'mail', title: 'Newsletter', subtitle: '뉴스레터', description: '정기 이메일 뉴스레...` |
| 157 | `{ id: 'podcast-feed', icon: 'mic', title: 'Podcast Feed', subtitle: '팟캐스트 피드', description: '오디오 ...` |
| 158 | `{ id: 'press-kit', icon: 'folder_open', title: 'Press Kit', subtitle: '프레스 킷', description: '언론 보...` |
| 159 | `{ id: 'link-hub', icon: 'hub', title: 'Link Hub', subtitle: '링크 허브', description: '주요 외부 링크 모음 및 ...` |
| 160 | `{ id: 'social-sync', icon: 'share', title: 'Social Sync', subtitle: '소셜 동기화', description: 'SNS 계...` |
| 161 | `{ id: 'brand-assets', icon: 'palette', title: 'Brand Assets', subtitle: '브랜드 에셋', description: '로...` |
| 162 | `{ id: 'custom-landing-page', icon: 'web', title: 'Custom Landing Page', subtitle: '커스텀 랜딩', descr...` |
| 168 | `subtitle: 'AI 및 인사이트 시스템',` |
| 171 | `{ id: 'ai-assistant', icon: 'smart_toy', title: 'AI Assistant', subtitle: 'AI 어시스턴트', description...` |
| 172 | `{ id: 'auto-translation', icon: 'translate', title: 'Auto Translation', subtitle: '자동 번역', descri...` |
| 173 | `{ id: 'ai-schedule-summary', icon: 'event_repeat', title: 'AI Schedule Summary', subtitle: 'AI 일정...` |
| 174 | `{ id: 'smart-recommendations', icon: 'recommend', title: 'Smart Recommendations', subtitle: '스마트 ...` |
| 175 | `{ id: 'ai-community-insights', icon: 'insights', title: 'AI Community Insights', subtitle: 'AI 커뮤...` |
| 176 | `{ id: 'ai-moderation', icon: 'shield', title: 'AI Moderation', subtitle: 'AI 모더레이션', description:...` |
| 177 | `{ id: 'ai-growth-analytics', icon: 'analytics', title: 'AI Growth Analytics', subtitle: 'AI 성장 분석...` |
| 178 | `{ id: 'ai-content-draft', icon: 'edit_note', title: 'AI Content Draft', subtitle: 'AI 콘텐츠 초안', de...` |
| 179 | `{ id: 'ai-attendance-prediction', icon: 'psychology', title: 'AI Attendance Prediction', subtitle...` |
| 180 | `{ id: 'ai-revenue-forecasting', icon: 'monitoring', title: 'AI Revenue Forecasting', subtitle: 'A...` |

### `src/components/groups/GroupAbout.tsx`
| Line | Content |
|---|---|
| 104 | `role: t("group.about.role.representative", "대표"),` |
| 118 | `role: t(\`group.about.role.${m.role}\`, m.role === 'instructor' ? '강사' : '스탭'),` |
| 477 | `<p className="font-body-md text-on-surface-variant">{t("group.about.no_team", "대표자나 스탭 정보가 없습니다."...` |

### `src/components/groups/GroupAccountEditor.tsx`
| Line | Content |
|---|---|
| 121 | `<option value="KB국민은행" className="bg-[#0a0f1d] text-white font-normal">{t("bank.kb", "KB Kookmin ...` |
| 122 | `<option value="신한은행" className="bg-[#0a0f1d] text-white font-normal">{t("bank.shinhan", "Shinhan ...` |
| 123 | `<option value="하나은행" className="bg-[#0a0f1d] text-white font-normal">{t("bank.hana", "Hana Bank")...` |
| 124 | `<option value="우리은행" className="bg-[#0a0f1d] text-white font-normal">{t("bank.woori", "Woori Bank...` |
| 125 | `<option value="NH농협은행" className="bg-[#0a0f1d] text-white font-normal">{t("bank.nh", "NH Nonghyup...` |
| 126 | `<option value="IBK기업은행" className="bg-[#0a0f1d] text-white font-normal">{t("bank.ibk", "IBK Indus...` |
| 127 | `<option value="카카오뱅크" className="bg-[#0a0f1d] text-white font-normal">{t("bank.kakao", "KakaoBank...` |
| 128 | `<option value="토스뱅크" className="bg-[#0a0f1d] text-white font-normal">{t("bank.toss", "Toss Bank")...` |
| 129 | `<option value="케이뱅크" className="bg-[#0a0f1d] text-white font-normal">{t("bank.kbank", "K Bank")}<...` |
| 132 | `<option value="iM뱅크" className="bg-[#0a0f1d] text-white font-normal">{t("bank.im", "iM Bank (form...` |
| 133 | `<option value="부산은행" className="bg-[#0a0f1d] text-white font-normal">{t("bank.busan", "Busan Bank...` |
| 134 | `<option value="경남은행" className="bg-[#0a0f1d] text-white font-normal">{t("bank.kyongnam", "Kyongna...` |
| 135 | `<option value="광주은행" className="bg-[#0a0f1d] text-white font-normal">{t("bank.kwangju", "Kwangju ...` |
| 136 | `<option value="전북은행" className="bg-[#0a0f1d] text-white font-normal">{t("bank.jeonbuk", "Jeonbuk ...` |
| 137 | `<option value="제주은행" className="bg-[#0a0f1d] text-white font-normal">{t("bank.jeju", "Jeju Bank")...` |
| 140 | `<option value="SC제일은행" className="bg-[#0a0f1d] text-white font-normal">{t("bank.sc", "SC First Ba...` |
| 141 | `<option value="한국씨티은행" className="bg-[#0a0f1d] text-white font-normal">{t("bank.citi", "Citibank ...` |
| 142 | `<option value="수협은행" className="bg-[#0a0f1d] text-white font-normal">{t("bank.suhyup", "Suhyup Ba...` |
| 145 | `<option value="우체국" className="bg-[#0a0f1d] text-white font-normal">{t("bank.post", "Post Office"...` |
| 146 | `<option value="새마을금고" className="bg-[#0a0f1d] text-white font-normal">{t("bank.mg", "MG Community...` |
| 147 | `<option value="신협" className="bg-[#0a0f1d] text-white font-normal">{t("bank.shinhyup", "Shinhyup"...` |
| 148 | `<option value="저축은행" className="bg-[#0a0f1d] text-white font-normal">{t("bank.savings", "Savings ...` |
| 149 | `<option value="산림조합" className="bg-[#0a0f1d] text-white font-normal">{t("bank.forest", "Forestry ...` |

### `src/components/groups/GroupCalendar.tsx`
| Line | Content |
|---|---|
| 90 | `type: s.title.toLowerCase().includes('milonga') \|\| s.title.toLowerCase().includes('밀롱가') ? 'milon...` |
| 105 | `type: s.title.toLowerCase().includes('milonga') \|\| s.title.toLowerCase().includes('밀롱가') ? 'milon...` |

### `src/components/groups/GroupHome.tsx`
| Line | Content |
|---|---|
| 434 | `type: s.title.toLowerCase().includes('milonga') \|\| s.title.toLowerCase().includes('밀롱가') ? 'milon...` |
| 447 | `type: s.title.toLowerCase().includes('milonga') \|\| s.title.toLowerCase().includes('밀롱가') ? 'milon...` |
| 474 | `if (total === 0) return { male: 45, female: 55 }; // 기본 비율 (데이터 없을 시)` |
| 576 | `setShowJoinModal(true); // "환영합니다" 팝업` |
| 579 | `setShowJoinModal(true); // "신청 완료" 팝업` |

### `src/components/groups/GroupHomeConfig.tsx`
| Line | Content |
|---|---|
| 227 | `placeholder={t('group.homeConfig.placeholder.nativeName', 'e.g. 키네틱 스카이')}` |

### `src/components/layout/InAppBrowserGuard.tsx`
| Line | Content |
|---|---|
| 111 | `{t('guard.desc_kr', '외부 브라우저에서 열면 더 안정적으로 이용할 수 있습니다.')}` |

### `src/components/layout/NavigationDrawer.tsx`
| Line | Content |
|---|---|
| 14 | `{ code: 'ko', name: 'Korean', native: '한국어', active: false },` |
| 285 | `<span className="text-[10px] font-medium opacity-50">쨌 {lang.native}</span>` |
| 319 | `<p className="text-[8px] font-black tracking-[0.3em] text-on-surface/20 uppercase">World of Group...` |

### `src/components/providers/AuthProvider.tsx`
| Line | Content |
|---|---|
| 204 | `duration: 15000, // 15초 후 자동 닫힘` |
| 229 | `}, 3000); // 페이지 로딩 후 3초 뒤에 띄움` |

### `src/components/social/SocialHeroCard.tsx`
| Line | Content |
|---|---|
| 11 | `const hasKorean = /[가-힣]/.test(text);` |
| 15 | `main = text.replace(/[가-힣()]+/g, '').replace(/\s+/g, ' ').trim();` |
| 16 | `const subMatch = text.match(/[가-힣]+/g);` |

### `src/components/stay/StayReservationFlow.tsx`
| Line | Content |
|---|---|
| 161 | `const smsContent = t('checkout.sms_content', '[WoC] 예약이 접수되었습니다.\n숙소: {title}\n일정: {checkIn} - {c...` |

### `src/hooks/useBookingEngine.ts`
| Line | Content |
|---|---|
| 184 | `const msg = \`💸 ${t('shop.chat_payment_prefix', '[PAYMENT REPORTED]')}\n${t('shop.chat_order_no',...` |
| 329 | `replyText = \`✅ 감사합니다. 최종 승인 되었습니다.\`;` |
| 331 | `replyText = \`❌ 죄송합니다. 이 요청은 승인되지 않았습니다.\`;` |

### `src/hooks/useHistoryBack.ts`
| Line | Content |
|---|---|
| 88 | `history.back(); // 더미 상태 제거` |

### `src/hooks/useModalNavigation.ts`
| Line | Content |
|---|---|
| 46 | `searchParams // 추가적인 파라미터 제어를 위해 반환` |

### `src/hooks/useNavigationGuard.ts`
| Line | Content |
|---|---|
| 8 | `warningMessage: string = "한 번 더 누르면 방을 나갑니다"` |

### `src/lib/ai/helpDeskAI.ts`
| Line | Content |
|---|---|
| 18 | `KR: \`질문을 남겨주셔서 감사합니다! 🤖` |
| 20 | `저희 팀이 확인 후 곧 답변드리겠습니다.` |
| 21 | `더 빠른 도움이 필요하시면 아래 핵심 메뉴를 참고해 주세요:` |
| 23 | `• **Social**: 밀롱가/프랙티카 확인 및 예약` |
| 24 | `• **Events**: 페스티벌/마라톤 등 특별 이벤트` |
| 25 | `• **Groups**: 커뮤니티 그룹 가입 및 관리` |
| 26 | `• **Live**: 실시간 사진/영상 공유` |
| 27 | `• **My Page → Wallet**: 결제 및 잔액 관리` |
| 28 | `• **My Page → My Info**: 프로필 설정\`,` |
| 46 | `return /[ㄱ-ㅎ\|ㅏ-ㅣ\|가-힣]/.test(content);` |

### `src/lib/constants/navigation.ts`
| Line | Content |
|---|---|
| 20 | `{ id: 'home', label: '홈', group: 'World', icon: Map, href: '/home' },` |
| 21 | `{ id: 'plaza', label: '프라자', group: 'World', icon: Library, href: '/plaza' },` |
| 22 | `{ id: 'venues', label: '장소(베뉴)', group: 'World', icon: MapPin, href: '/venues' },` |
| 23 | `{ id: 'groups', label: '그룹', group: 'World', icon: Users, href: '/groups' },` |
| 26 | `{ id: 'events', label: '이벤트', group: 'Activity', icon: Calendar, href: '/events' },` |
| 27 | `{ id: 'social', label: '소셜', group: 'Activity', icon: Heart, href: '/social' },` |
| 29 | `{ id: 'class', label: '클래스', group: 'Activity', icon: Library, href: '/class' },` |
| 32 | `{ id: 'shop', label: '숍', group: 'Space', icon: ShoppingBag, href: '/shop' },` |
| 33 | `{ id: 'resale', label: '리세일', group: 'Space', icon: Store, href: '/resale' },` |
| 34 | `{ id: 'stay', label: '스테이', group: 'Space', icon: Tent, href: '/stay' },` |
| 35 | `{ id: 'lost', label: '분실물찾기', group: 'Space', icon: MessageSquare, href: '/lost' },` |
| 36 | `{ id: 'hub', label: '이동', group: 'Space', icon: Cpu, href: '/hub' },` |
| 39 | `{ id: 'wallet', label: '지갑', group: 'My Page', icon: Wallet, href: '/wallet' },` |
| 40 | `{ id: 'history', label: '히스토리', group: 'My Page', icon: MessageSquare, href: '/history' },` |
| 41 | `{ id: 'profile', label: '내 정보', group: 'My Page', icon: Settings, href: '/profile' },` |

### `src/lib/constants/socialData.ts`
| Line | Content |
|---|---|
| 11 | `day?: string; // e.g., '03/24(화)'` |
| 16 | `title: 'Lucas & Paula 서울 워크샵',` |
| 17 | `subtitle: '10/25-30 (6일간) / 얼리버드 15% d.c',` |
| 25 | `title: \`탱고 소셜 나이트 #${i + 1}\`,` |
| 26 | `place: '강남 탱고 웍스',` |
| 35 | `day: string; // e.g., '03/24(화)'` |
| 40 | `day: \`03/${24 + i}(${['화', '수', '목', '금', '토', '일', '월'][i]})\`,` |
| 43 | `title: \`밀롱가 엘 불린\`,` |
| 44 | `place: '합정 턴',` |
| 45 | `time: '20:00 - 익일 01:00',` |
| 55 | `title: '부에노스아이레스 마스터 마라톤',` |
| 56 | `place: '인천 파라다이스 시티',` |
| 57 | `time: '48시간 연속 진행',` |
| 66 | `export const REGIONS = ['서울', '경기', '부산', '대전', '대구', '광주', '제주'];` |

### `src/lib/firebase/chatService.ts`
| Line | Content |
|---|---|
| 267 | `lastMessage: type === 'business' ? '상품 문의가 시작되었습니다.' : '대화가 시작되었습니다.'` |

### `src/lib/firebase/feedService.ts`
| Line | Content |
|---|---|
| 167 | `likesCount: increment(-1) // 하위 호환성` |
| 233 | `parentId: commentData.parentId \|\| null, // 명시적으로 null 설정` |
| 283 | `where('parentId', '==', null), // 팁: 기존 데이터가 parentId가 없는 경우 안 나올 수 있음` |

### `src/lib/firebase/galleryService.ts`
| Line | Content |
|---|---|
| 25 | `groupId?: string;       // class가 속한 그룹 ID` |
| 27 | `avatar?: string;        // people용 프로필 사진` |

### `src/lib/firebase/notificationService.ts`
| Line | Content |
|---|---|
| 161 | `groupId: string \| undefined, // undefined면 모든 그룹의 Todo 가져오기` |

### `src/lib/firebase/shopService.ts`
| Line | Content |
|---|---|
| 200 | `throw new Error("운송장 번호가 필요합니다.");` |

### `src/types/booking.ts`
| Line | Content |
|---|---|
| 7 | `\| 'CANCELLED'             // 사용자 또는 타임아웃에 의한 취소` |
| 8 | `\| 'REFUNDED'              // 환불` |
| 9 | `\| 'SUBMITTED'             // 신규: 신청/제출 완료` |
| 10 | `\| 'BANK_TRANSFERRED'      // 신규: 송금 완료 (확인 대기)` |
| 11 | `\| 'SELLER_CONFIRMED'      // 신규: 판매자 승인 완료` |
| 12 | `\| 'SELLER_REJECTED'       // 신규: 판매자 거절` |
| 13 | `\| 'DELIVERED';            // 신규: 배송/전달 완료` |
| 26 | `id: string;               // 예약/주문 ID` |
| 27 | `domain: BookingDomain;    // 도메인 (Shop, Rental 등)` |
| 29 | `itemId: string;           // 상품/클래스/숙소 ID` |
| 30 | `itemName: string;         // 아이템 이름` |
| 31 | `itemImageUrl?: string;    // 아이템 이미지` |
| 33 | `buyerId: string;          // 구매자/신청자 ID` |
| 34 | `buyerName: string;        // 구매자 이름` |
| 36 | `hostId: string;           // 판매자/호스트 ID (알림 발송 및 확정 권한)` |
| 38 | `totalAmount: number;      // 총 금액` |
| 39 | `currency: string;         // 통화 (e.g. KRW)` |
| 41 | `status: BookingStatus;    // 예약 상태` |

### `src/types/event.ts`
| Line | Content |
|---|---|
| 7 | `id: string;                      // "G1", "C1", "A1" 등 (오거나이저가 지정)` |
| 9 | `titleNative?: string;            // "탱고 살롱"` |
| 10 | `description?: string;            // 영문 상세 설명` |
| 12 | `category?: string;               // "일반수업" / "파트너수업" / "세미나리오" (그룹핑용)` |
| 18 | `duration?: number;               // 분 (80분)` |
| 22 | `level?: string;                  // "all" \| "adv" \| "intermediate" 등` |
| 24 | `isRecommended?: boolean;         // 강사 추천 태그` |
| 32 | `capacityUnit?: 'person' \| 'couple'; // "15명" vs "12팀"` |
| 35 | `price?: number;                  // 이 프로그램의 가격 (시리즈 전체 or 1회)` |
| 36 | `priceUnit?: 'total' \| 'per_session'; // 시리즈 전체가격 vs 회당가격` |
| 45 | `advance: number;               // 예매가 (₩45,000)` |
| 46 | `door?: number;                 // 현매가 (₩50,000)` |
| 55 | `label?: string;                // "워크숍 6 + 밀롱가"` |
| 60 | `earlyBirdDeadline?: string;      // ISO date (있으면 advance=early bird)` |
| 76 | `selectedProgramIds: string[];    // ["G1","G3","S1"] 또는 full_pass면 전체` |
| 153 | `programViewMode?: 'by_date' \| 'by_category'; // 프로그램 탭 뷰 모드` |
| 164 | `galleryImages?: string[];           // 갤러리 사진들 (메인 이미지 외)` |
| 165 | `artists?: EventArtist[];            // 아티스트 (Maestro / DJ)` |
| 166 | `eventVenues?: EventVenueItem[];     // 이벤트 베뉴 (복수)` |
| 167 | `packages?: EventPackage[];          // 패키지 (클래스 번들)` |
| 168 | `scheduleDays?: EventScheduleDay[];  // 스케줄 (일별 시간표 이미지)` |
| 176 | `registrationUrl?: string;       // 외부 등록 폼 (tally.so 등)` |
| 177 | `bankInfo?: string;              // 입금 계좌 정보` |
| 178 | `tag?: string;                   // 피드/라이브용 태그 정보 (예: 특정 아티스트나 그룹 식별자)` |

### `src/types/group.ts`
| Line | Content |
|---|---|
| 182 | `buildingType?: string; // e.g. 아파트, 오피스텔, 빌라, 단독주택` |
| 183 | `structure?: string; // e.g. 원룸, 투룸, 쓰리룸+` |
| 184 | `floor?: string; // e.g. 1층, 2층, 반지하, 옥탑` |
| 196 | `includedUtilities?: string[]; // e.g. 전기, 가스, 수도, 인터넷` |
| 200 | `parkingPolicy?: string; // e.g. 불가, 1대 무료, 유료` |
| 203 | `rules?: string[]; // e.g. 반려동물 불가, 실내 흡연 금지` |
| 364 | `confirmedAt?: any;          // 관리자가 접수 완료 처리 시 (향후 구현)` |
| 365 | `itemType?: 'class' \| 'discount' \| 'monthlyPass';  // 신규 등록 시 저장` |
| 366 | `groupName?: string;         // 신규 등록 시 저장` |

### `src/types/lostFound.ts`
| Line | Content |
|---|---|
| 13 | `location: string;       // 클럽, 장소 이름` |
| 14 | `date: string;           // 분실/습득 일자 (YYYY-MM-DD 형식 권장)` |
| 16 | `reward?: number;        // 사례금 (Bounty)` |
| 18 | `authorId: string;       // 작성자 UID` |
| 19 | `authorName?: string;    // 작성자 이름 (표시용)` |
| 20 | `authorPhoto?: string;   // 작성자 프로필 사진` |
| 22 | `isFeatured?: boolean;   // 상단 노출 여부` |
| 24 | `likesCount: number;     // 관심/위시 수` |
| 25 | `viewsCount: number;     // 조회수` |
| 33 | `id: string;             // 문서 ID: {userId}_{itemId}` |

### `src/types/rental.ts`
| Line | Content |
|---|---|
| 10 | `category: string; // e.g., '댄스 스튜디오', '파티룸', '연습실'` |

### `src/types/shop.ts`
| Line | Content |
|---|---|
| 52 | `id: string;             // 문서 ID: {userId}_{productId}` |
| 55 | `status?: 'liked' \| 'pending' \| 'in_progress'; // 추가됨` |
| 74 | `\| 'PENDING'             // 입금 대기 (1시간 이내)` |
| 75 | `\| 'PAYMENT_REPORTED'    // 입금 보고 (legacy compat)` |
| 76 | `\| 'CONFIRMED'           // 입금 확인 (판매자 확인)` |
| 77 | `\| 'IN_PRODUCTION'       // 제작중` |
| 78 | `\| 'READY_PICKUP'        // 매장수령 가능` |
| 79 | `\| 'SHIPPING'            // 배송중` |
| 80 | `\| 'COMPLETED'           // 완료` |
| 81 | `\| 'EXPIRED'             // 1시간 초과 자동 만료` |
| 82 | `\| 'CANCELLED';          // 취소` |
| 160 | `label: string;          // UI label: '발볼', '발등'` |
| 163 | `labels?: string[];      // UI display: ['레귤러', '와이드', '엑스트라 와이드']` |
| 174 | `label: string;           // "5,000원 할인"` |

### `src/types/stay.ts`
| Line | Content |
|---|---|
| 18 | `baseRate: number;          // 1박 기본 요금` |
| 31 | `swiftCode?: string;        // 해외 송금용` |
| 36 | `transferDeadlineHours: number; // 입금 기한 (시간)` |
| 66 | `paymentRequest?: string;   // 입금 요청 템플릿` |
| 67 | `confirmed?: string;        // 계약 확정 템플릿` |
| 68 | `doorCode?: string;         // 비밀번호 전송 템플릿` |
| 86 | `doorCode: string;           // 기본 "9999"` |
| 105 | `status?: 'liked' \| 'pending' \| 'in_progress'; // 비즈니스 파이프라인 상태` |
| 116 | `\| 'APPLIED'               // ① 손님이 예약 신청` |
| 117 | `\| 'PAYMENT_REQUESTED'     // ② 관리자가 입금 요청 SMS 발송` |
| 118 | `\| 'PAID'                  // ③ 손님 입금 → 관리자 확인` |
| 119 | `\| 'CONFIRMED'             // ④ 계약 확정 + 확정 SMS + 캘린더 반영` |
| 120 | `\| 'CODE_SENT'             // ⑤ 체크인 당일 비밀번호 SMS 발송` |
| 121 | `\| 'COMPLETED'             // ⑥ 숙박 완료` |
| 122 | `\| 'REJECTED'              // 관리자 거절` |
| 123 | `\| 'CANCELLED';            // 손님 취소` |
| 135 | `sentBy: string;            // 발송자 userId` |
| 136 | `to: string;                // 수신 전화번호` |
| 156 | `depositorName?: string;    // 입금자명` |
| 157 | `depositDate?: string;      // 입금 예정일` |
| 158 | `transferredAt?: any;       // 실제 입금 시각 (Timestamp)` |
| 159 | `confirmedAt?: any;         // 관리자 확인 시각 (Timestamp)` |
| 165 | `groupId: string;           // FK → groups/{groupId} (Manager Todo 필터)` |
| 166 | `stayTitle: string;         // 비정규화` |
| 173 | `contactNumber: string;     // SMS 발송 대상` |
| 210 | `itemTitle: string;           // 클래스명 or Stay명` |
| 211 | `itemDetail?: string;         // "3 nights" \| "2시간"` |
| 215 | `contactNumber?: string;      // SMS 발송용` |
| 219 | `sourceData?: any;            // 원본 데이터 전체 (액션 처리용)` |

### `src/types/venue.ts`
| Line | Content |
|---|---|
| 8 | `nameKo?: string; // Korean name (e.g. 탱고라이프)` |

