# 작업 관리 (TODO)

## 📌 PWA 접속 차단 및 네이티브 알림 권한 해결

- `[ ]` 1단계: 종속성 및 번역 키 추가
  - `[ ]` `package.json` 에 `@capacitor/push-notifications` 라이브러리 추가
  - `[ ]` `src/i18n/kr.ts` 및 `en.ts` 에 모바일 웹 브라우저 차단 및 강제 업데이트 번역 문구 추가
- `[ ]` 2단계: 모바일 웹 브라우저 전면 차단 및 네이티브 푸시 권한 요청 구현
  - `[ ]` `AuthProvider.tsx` 에 모바일 웹 접속 감지 및 전면 차단 오버레이 뷰 마운트
  - `[ ]` `AuthProvider.tsx` 에 모바일 앱 구동 시 네이티브 푸시 알림 동의 팝업 요청 및 토큰 수집 로직 구현
  - `[ ]` `AuthProvider.tsx` 에 `App.getInfo()` 및 Firestore `configs/app_version` 을 대조하는 강제 업데이트 체크 및 오버레이 뷰 구현
  - `[ ]` `src/app/app/route.ts` 서버 측 초고속 QR 리다이렉트 API 라우터 신설
- `[ ]` 3단계: 무결성 검증 및 패키징 빌드 배포
  - `[ ]` `npm run build` 로컬 빌드 및 다국어 스캔 무결성 통과
  - `[ ]` `npx cap sync android` 자산 안드로이드 싱크 동기화 실행
  - `[ ]` `android/app/build.gradle` 버전 코드를 `versionCode 12` 로 상향
  - `[ ]` `.\gradlew.bat clean` 캐시 소거 및 `.\gradlew.bat bundleRelease` 최종 AAB 빌드 완료
  - `[ ]` 배포 파일 내 60% 크기 픽셀 스캔 교차 검증 통과
