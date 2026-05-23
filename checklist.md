# 클래스 상세 보강 및 버그 해결 체크리스트

이 체크리스트는 클래스 상세 정보 모달(`ClassDetail.tsx`)의 강사 배지 누락을 해결하고 브라우저 뒤로가기 이탈 방지 및 정원 표시 영역의 숫자 '0' 렌더링 결함을 완전히 박멸하기 위한 세부 과제 목록입니다.

---

- [ ] **1단계: 강사 배지 UID 바인딩 키 보강**
  - [ ] `ClassDetail.tsx` 파일 내 강사 목록 `UserBadge` 렌더링 구문을 찾습니다.
  - [ ] `uid` 속성에 `inst.id || inst.uid || inst.userId || ''` 로 `inst.userId` 매핑을 정밀 보강합니다.

- [ ] **2단계: 뒤로가기 popstate 제어 파이프라인 구현**
  - [ ] `ClassDetail.tsx`에 `didPushState` useRef 상태값을 추가합니다.
  - [ ] `isOpen` 라이프사이클에 연동해 모달이 열릴 때 더미 히스토리 `history.pushState`를 실행하도록 처리합니다.
  - [ ] `popstate` 이벤트 리스너를 장착하여 브라우저 뒤로가기 시 `onClose()`가 트리거되도록 구현합니다.
  - [ ] 기존 닫기용 `handleClose`를 보강해 UI 상에서 모달을 수동으로 닫을 시 `history.back()`을 수행하여 가상 히스토리를 정리하게 만듭니다.

- [ ] **3단계: 숫자 '0' 렌더링 결함 전격 박멸**
  - [ ] `ClassDetail.tsx` 내의 Capacity 정원 렌더링 조건식을 점검합니다.
  - [ ] 0 평가값 출력을 예방하기 위해 `!!(itemDetail.maxCapacity || itemDetail.leaderCount || itemDetail.followerCount) && (...)` 로 형변환 처리를 적용합니다.
  - [ ] `sched.content && (...)` 구문을 `sched.content ? <p>...</p> : null` 삼항 연산자 형태로 안전하게 변환합니다.

- [ ] **4단계: 컴파일 및 빌드 무결성 검증**
  - [ ] `npx tsc --noEmit`을 실행하여 TypeScript 타입 무결성을 완전 실증합니다.
  - [ ] `npm run build`를 돌려 Next.js 정적 빌드가 에러 없이 완벽히 끝나는지 테스트합니다.
