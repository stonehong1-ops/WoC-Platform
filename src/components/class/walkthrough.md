# 🚀 Class-Group 아키텍처 개편 완료 보고서 (Walkthrough)

최상위 독립 클래스 객체 모델(`WocClass`) 신규 도입 및 그룹 설정 화면의 정합성 확보, 이중 읽기(Dual Read) 데이터 병합 구조를 포함한 시스템 개편을 완료하고 실서버 배포를 정상적으로 마쳤습니다.

---

## 🛠️ 주요 구현 내용 및 수정 내역 (Walkthrough)

### 1. WocClass 독립 모델 구조화 및 호환성 역정규화 데이터 바인딩
- **신규 데이터 모델** : 최상위 독립 클래스 규격인 `WocClass` 타입을 `src/types/class.ts`에 신규 적용했습니다.
- **호환성 역정규화** : 기존 레거시 `GroupClass` 카드 렌더링 및 예약 시스템과의 100% 하위 호환성을 보장하기 위해 `instructors` 배열 정보 및 가격 호환 필드(`amount`, `price`, `dailyClassPrice`)를 생성 시 역정규화하여 자동 바인딩하도록 구현했습니다.

### 2. 클래스 등록 폼 UX 구현
- `/class` 포털 화면에서 사용자가 정규 클래스 또는 특강 등록 시 호출되는 통합 7단계 등록 폼 에디터(`ClassAddEditor.tsx`)를 구축했습니다.
- 등록 폼 완료 후 데이터 저장 시 최상위 `classes` 컬렉션에 문서를 생성하며 `connectedGroupIds`는 빈 배열로 초기화됩니다.

### 3. ClassPortal 이중 읽기(Dual Read) 및 데이터 병합
- `ClassPortal.tsx` 내의 초기 로딩(`fetchData`) 및 온세이브(`onSave`) 콜백 흐름에서 기존 서브컬렉션 클래스 데이터와 신규 최상위 독립 클래스 데이터를 동시에 읽어와 병합하는 이중 읽기(Dual Read) 알고리즘을 도입했습니다.
- 병합 과정에서 `organizerType === 'group'`인 클래스들의 경우 `groups` 정보와 자동 매핑하여 화면 렌더링에 지장이 없도록 동기화했습니다.

### 4. Booking 신청/결제 연동 호환성 보완
- `ClassPortal.tsx`에서 수강 신청 시 `createBooking`을 수행하는 결제 정보 페이로드(`payload`) 내부에 `groupId` 매핑 값을 누락 없이 동적 바인딩하여, 기존 그룹 관리자 화면의 신청자 대시보드 조회가 정상적으로 유지되도록 보완했습니다.

### 5. 그룹 설정 탭 고정 및 공유 흐름 구현
- `GroupClassEditor.tsx`에서 규칙대로 3개 버튼(Class, Bundle discount, Monthly Pass)을 고정 노출하되, Class 버튼 클릭 시 포털 클래스 등록 메뉴로 라우팅시켜 원본 생성 일원화를 유도하였으며 Monthly Pass는 규정대로 비활성화 배치 완료했습니다.
- 클래스 관리 및 상세 화면에 "그룹에 공유" 기능을 연결하고 그룹 관리자의 승인을 거쳐 `connectedGroupIds`가 안전하게 동기화되도록 비즈니스 흐름을 정비했습니다.

### 6. 보안 규칙 통합 및 배포
- `firestore.rules` 파일 내의 `classes` 및 `classGroupConnections` 중복 정의를 제거하고, 클라이언트의 임의 수정 위조를 방지하기 위해 자신이 소유한 그룹의 승인 관계에 기반할 때만 `connectedGroupIds` 배열 수정을 승인해주는 정밀 보안 가드를 추가하여 Firebase rules 배포를 선행 완료했습니다.

---

## 📦 검증 및 배포 결과
- **로컬 빌드 검증** : 다국어 영한 무결성 스캔 및 TypeScript 컴파일 검사 전원 성공 통과 (`tsc --noEmit && next build` 무결성 검증 완료).
- **Firebase 배포** : `firestore.rules` 보안 규칙 배포 완료 (`Deploy complete!`).
- **프로덕션 배포** : Vercel 프로덕션 릴리즈 정상 완료 (`Aliased https://www.woc.today`).
