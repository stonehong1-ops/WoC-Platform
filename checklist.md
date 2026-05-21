# 알림 내 TODO 로직 완벽 제거 작업 체크리스트

- [ ] **1단계: Notification 타입 정의 리팩토링**
  - [ ] `src/types/notification.ts` 내 `BaseNotificationType`에서 `'TODO'` 옵션 제거 및 관련 주석 정리.
- [ ] **2단계: Firebase 알림 서비스 (`notificationService.ts`) 내 TODO 로직 제거**
  - [ ] `createNotification` 등에서 `baseType: 'TODO'` 제거 혹은 `'INFO'`로 일괄 전환.
  - [ ] `getTodoNotifications` 등 TODO 전용 쿼리 함수 및 미사용 쿼리 조건 정리.
- [ ] **3단계: 알림 페이지 (`src/app/notification/page.tsx`) UI 리팩토링**
  - [ ] `noti.baseType === 'TODO'` 관련 분기 로직 및 렌더링 코드 안전하게 제거.
- [ ] **4단계: 빌드 및 프로덕션 배포**
  - [ ] `npm run build`를 통한 타입 에러 및 컴파일 유효성 검증.
  - [ ] Vercel 프로덕션 배포 진행 및 실서버 배포 상태 보고.
