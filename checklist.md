# 📋 월간 패스 제거 및 번들 기능 강화 체크리스트

## 1. 데이터 모델 및 서비스 레이어 정리
- [ ] **`src/types/group.ts` 수정**
  - [ ] `Group` 인터페이스에서 `monthlyPasses` 제거.
  - [ ] `MonthlyPass` 타입 인터페이스 정의 제거.
- [ ] **`src/lib/firebase/groupService.ts` 수정**
  - [ ] `subscribeMonthlyPasses`, `addMonthlyPass`, `updateMonthlyPass`, `deleteMonthlyPass`, `getGlobalMonthlyPassesAll` 함수 제거 및 무효화.

## 2. 수강 신청 화면 수정 (`src/app/class/[groupId]/page.tsx`)
- [ ] **월간 패스 제거 및 UI 연동 정리**
  - [ ] Monthly Pass의 State(`subPasses`) 및 추출 로직 제거.
  - [ ] UI 내에서 "Monthly Pass" 렌더링 카드 및 팝업 트리거 정리.
- [ ] **번들(ClassDiscount) 신청을 위한 1개 이상 선택 및 파트너명 입력 로직 주입**
  - [ ] `isDiscountSelected` (선택한 상품이 번들인 경우) 식별 로직 주입.
  - [ ] `UnifiedCheckoutModal` 내에서 번들에 속한 과목 목록(`includedClassIds`)을 체크박스로 렌더링.
  - [ ] **유효성 검사**: 번들이 선택된 상태에서 참여 클래스가 최소 1개 이상 체크되지 않으면 `Submit Request` 버튼이 비활성화되도록 차단.
  - [ ] **파트너 입력**: 체크박스로 클래스가 선택되면, 해당 클래스 바로 밑에 실시간으로 파트너의 이름을 적을 수 있는 `classPartners` 인풋 필드 렌더링.
  - [ ] **결제 신청 페이로드 바인딩**: 번들 신청 시 `participatingClassIds`와 `participatingClassPartners`를 `payload`에 매핑하여 Firebase DB로 전송하도록 결제 로직 수정.

## 3. 관리자 설정 및 대시보드 화면 정리
- [ ] **`src/components/groups/GroupClassEditor.tsx` 수정**
  - [ ] Monthly Pass 관리용 State(`subPasses`, `allMonthlyPasses`) 제거.
  - [ ] Monthly Pass 생성 버튼 및 탭 카드 렌더링 영역 제거.
  - [ ] `GroupClassMonthlyPassEditor` 오버레이 렌더링 제거 및 임포트 정리.
- [ ] **`src/components/groups/GroupClassMonthlyPassEditor.tsx` 삭제**
  - [ ] 파일 완전 삭제 (DELETE).
- [ ] **`src/components/groups/GroupClassRegistrations.tsx` 수정**
  - [ ] `handleEditPass` 함수 내 `resolvedType === 'discount'` 분기를 추가하여, 신청된 번들 과목 목록 편집 시 "0/0개 선택"으로 나타나던 누락 버그 완벽 수정.
  - [ ] 월간 패스 관련 State 및 바인딩 완전 제거.
- [ ] **`src/components/groups/GroupClassDashboard.tsx` 수정**
  - [ ] 대시보드 내 월간 패스 구독(`subscribeMonthlyPasses`) 및 바인딩 완전 제거.

## 4. 빌드 검증 및 배포
- [ ] 로컬 빌드 컴파일을 수행하여 빌드 오류가 없는지 검증 (`npm run build`).
- [ ] 한국어 설명 및 아티팩트 텍스트 끝자락에 콜론(`:`) 기호 종결을 배제하고 온점(`.`)으로 완벽하게 마무리.
- [ ] 완벽히 패치된 실시간 버전을 Vercel 배포망에 릴리즈 (`npx -y vercel --prod --yes`).
- [ ] 최종 배포 상태(Deployment ID, Exit Code, Live URL)를 명확히 기술하여 보고.
- [ ] 사용자가 직접 라이브에서 테스트해 볼 수 있는 모바일 자가 검증 리스트 제공.
