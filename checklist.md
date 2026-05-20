# 📋 클래스 상세보기 모달 런타임 렌더링 무결성 패치 체크리스트

## 1. 계획 및 기초 설계 수립
- [ ] 스토니님에게 오류 원인 및 세부 구현 계획 설명 완료하기.
- [ ] 스토니님의 명시적 승인(Approval) 획득하기.
- [ ] 아티팩트(`implementation_plan.md`, `checklist.md`, `context-notes.md`, `task.md`) 최신화 완료하기.

## 2. 소스코드 수정 단계
- [ ] **`src/components/groups/GroupHome.tsx` 수정**
  - [ ] `classFlow === 'apply'` 조건부 마운트 영역에서 불필요하고 중복되는 `fixed inset-0 z-[9999] bg-background` 레이아웃 래퍼 div를 깨끗이 걷어내기.
  - [ ] `useSearchParams()`의 안전한 하이드레이션 격리를 위해 `<React.Suspense fallback={null}>` 래퍼 경계 추가하기.
  - [ ] `classFlow`와 `modal` 쿼리 파라미터를 한 번에 동시 제거하고 트랩(`active=true`)을 복구하는 전용 닫기 콜백 함수 `handleCloseClassDetail`를 정의하여 `<ClassDetail>`의 `onClose` 프롭으로 안전하게 주입하기.

## 3. 예외 및 예방 검증 (QA & 빌드)
- [ ] 로컬 빌드 컴파일을 수행하여 오류가 존재하지 않는지 정적 검사하기 (`npm run build`).
- [ ] 모든 한국어 설명 및 아티팩트 텍스트 끝자락에 콜론(`:`) 누락 등의 핵심 언어 규칙을 준수했는지 더블 체크하기.

## 4. 라이브 프로덕션 배포 및 최종 보고
- [ ] 완벽히 패치된 실시간 버전을 Vercel 배포망에 릴리즈하기 (`npx -y vercel --prod --yes`).
- [ ] 최종 배포 상태(Deployment ID, Exit Code, Live URL)를 명확히 기술하여 보고하기.
- [ ] 스토니님이 직접 테스트해 볼 수 있는 모바일 자가 검증 리스트를 제공하기.
