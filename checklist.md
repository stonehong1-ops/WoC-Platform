# 0ms 오버레이 안착 렌더링 파이프라인 리팩토링 체크리스트

이 체크리스트는 `/groups` 오버레이 진입 시의 FOUC(깜빡임), 레이아웃 쉬프트, 첫 로딩 랙 현상을 완벽하게 근절하고 네이티브 앱 수준의 0ms 극강 사용성을 구현하기 위해 수행해야 하는 세부 액션 아이템 목록입니다.

---

- [ ] **1단계: 전역 폰트 시스템 이관 및 로컬 중복 선언 제거**
  - [ ] `src/app/layout.tsx`에서 `Inter` 및 `Plus_Jakarta_Sans`를 `next/font/google` 체계로 불러옵니다.
  - [ ] `src/app/globals.css`에서 `--font-body: var(--font-inter)` 및 `--font-display: var(--font-jakarta)` 연동 설정을 완료하고 body와 전역 클래스들에 일괄 바인딩합니다.
  - [ ] `GroupHome.tsx` 내의 `@import` 및 style jsx global 내부 폰트 하드코딩 선언을 완전히 삭제합니다.

- [ ] **2단계: GroupOverlay 영구 마운트화 및 데이터 지연 해제 가드 확보**
  - [ ] `src/app/groups/page.tsx` 내의 `{selectedGroup && ...}` 조건부 마운트 구조를 제거하고 항상 DOM에 상주하도록 수정합니다.
  - [ ] `selectedGroup`이 없을 때 런타임 크래시가 발생하지 않도록 `GroupDetail` 및 `GroupHome` Props 타입을 `Group | null`로 우아하게 넓힙니다.
  - [ ] `GroupHome.tsx` 내부에 `activeGroup` 지연 상태(Deferred State)를 구축하여, 오버레이가 닫힐 때 직전 그룹 데이터가 고정 유지되며 페이드 아웃되도록 처리합니다.
  - [ ] `useGroupData.ts` 훅 내부에 `initialGroup.id`가 유효하지 않을 때 Firestore 구독 등을 조기 중단(Early Return)시키는 Null-Safety 가드를 안전 장치로 장착합니다.

- [ ] **3단계: Skeleton Branching 제거 및 동일 Layout Shell 정착**
  - [ ] `GroupHome.tsx` 내의 `isLocked` 분기로 컴포넌트 껍데기가 통째로 달라지는 스케줄링을 개선합니다.
  - [ ] 컨텐츠 하위 컴포넌트들에서 로딩 시 Layout 구조 전체를 탈바꿈하는 코드 분기를 배제하고, 고정 레이아웃 내에서 알맹이 데이터만 스왑되도록 개선합니다.

- [ ] **4단계: KeepAlive & Lazy Tabs 구조 정립**
  - [ ] `GroupHome.tsx` 내의 500ms 전체 탭 일괄 비동기 프리마운트 타이머 로직을 완전히 들어냅니다.
  - [ ] 사용자가 탭을 실제로 클릭해 진입할 때만 `mountedTabs` Set에 등록하는 Lazy Mount를 확립합니다.
  - [ ] 마운트된 탭은 unmount되지 않고 `hidden={activeTab !== tabName}`으로 메모리에 상주하는 KeepAlive 아키텍처를 도입합니다.

- [ ] **5단계: GPU 합성 레이어 상주 및 Idle-Time Prewarming 적용**
  - [ ] 오버레이 루트 컨테이너에 `will-change: opacity, transform;` 및 `transform: translateZ(0); contain: layout paint style;` GPU 가속 격리 속성을 반영합니다.
  - [ ] `requestIdleCallback`을 가동하여 메인 목록 로딩 완료 후, 유휴(Idle) 시간에 오버레이 복합 레이어 사전 웜업을 부드럽게 예약 기동시킵니다.
  - [ ] `npm run build` 컴파일 무결성을 통과시킨 후 최종 검증을 완료합니다.
