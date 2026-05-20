# 📋 비활성 월 통제 및 참여 클래스 노출 복구 체크리스트

## 1. 소스코드 수정 단계
- [x] **`src/app/class/[groupId]/page.tsx` 수정**
  - [x] `group.classPaymentSettings?.openMonths` 정보를 기준으로 한 `isRegistrationOpen` CLOSE 상태 판단 계산식 추가하기.
  - [x] 수강 신청 상세 페이지 스크롤 콘텐츠 최상단 영역에 로즈 파스텔톤 경고 배너 (`bg-rose-50 border-rose-200 text-rose-600`) 및 경고 텍스트 조건부 노출하기.
  - [x] `CLASS INFORMATION` 카드 내 이전/다음 달 이동 화살표 `<` 및 `>` 마크업 완전 절개하기.
  - [x] 한국어 로케일 환경(`language === 'KR'`)에서 연월 포맷을 '5월, 2026'으로 표시하도록 개선하기.
  - [x] CLOSE 상태일 시 Monthly Pass 내의 모든 토글 버튼 비활성화(`disabled={!isRegistrationOpen}`) 및 불투명도 50% 회색 처리 적용하기.
  - [x] CLOSE 상태일 시 Bundle Packages 내의 모든 토글 버튼 비활성화 및 회색 처리 적용하기.
  - [x] CLOSE 상태일 시 개별 클래스 리스트(Day-by-Day 및 Flat List) 내의 모든 RESERVE 버튼과 토글 버튼 비활성화 및 회색 처리 적용하기.
  - [x] 월간 패스 신청 팝업 기동 시 참여 클래스 목록이 빈 상태(`0 / 0개 선택`)로 노출되던 버그를 classes 필터 대신 `allGroupClasses`를 타깃으로 연산하도록 개선하여 해결하기.

## 2. 오픈 월 동적 뷰포트 노출 및 파라미터 연동
- [x] **`src/components/groups/GroupClassDashboard.tsx` 수정**
  - [x] `currentDate` 초기 상태 설정 시 `group.classPaymentSettings?.openMonths` 정보를 읽어 활성화된 오픈 월 중 가장 최근의 달을 기본값으로 동적 지정하기.
  - [x] `onApplyClick` 콜백 타입 시그니처에 `monthStr: string`을 추가하고 하단 '수업 신청하기' 버튼 클릭 시 `onApplyClick(currentMonthStr)`을 호출하도록 연계하기.
  - [x] 대시보드 내 개별 아이템(패스, 번들, 클래스) 카드 클릭 시에도 `openClassFlow('apply', { modal: item.id, month: currentMonthStr })`를 적용하여 뷰포트의 달 정보를 명확히 상속하기.
- [x] **`src/components/groups/GroupHome.tsx` 수정**
  - [x] `GroupClassDashboard`에 전달하는 `onApplyClick` 인자를 받아 모달 네비게이션 호출 시 `extraParams`로 `{ month: monthStr }`을 URL 쿼리 매개변수로 안전하게 결합하기.
- [/] **`src/app/class/[groupId]/page.tsx` 수정**
  - [ ] 상세 신청 페이지 내에서 URL의 `month` 쿼리 파라미터 변화(`monthParam`)를 실시간으로 감지하여 `currentDate` 상태에 동기화해주는 `useEffect` 로직을 주입해 6월 수강 신청 시 상세 모달이 6월로 뜨도록 보장하기.

## 3. 예외 및 예방 검증 (QA & 빌드)
- [ ] 로컬 빌드 컴파일을 수행하여 빌드 오류가 없는지 검증하기 (`npm run build`).
- [ ] 한국어 설명 및 아티팩트 텍스트 끝자락에 콜론(`:`) 기호 종결을 배제하고 온점(`.`)으로 완벽하게 마무리하기.

## 4. 라이브 프로덕션 배포 및 최종 보고
- [ ] 완벽히 패치된 실시간 버전을 Vercel 배포망에 릴리즈하기 (`npx -y vercel --prod --yes`).
- [ ] 최종 배포 상태(Deployment ID, Exit Code, Live URL)를 명확히 기술하여 보고하기.
- [ ] 사용자가 직접 라이브에서 테스트해 볼 수 있는 모바일 자가 검증 리스트 제공하기.


