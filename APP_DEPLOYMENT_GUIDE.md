# 📱 World of Community (Tango World) 모바일 앱 배포 가이드

이 문서는 World of Community (Tango World) 모바일 앱의 Android 및 iOS 플랫폼 배포 프로세스와 설정값을 총정리한 공식 가이드라인입니다.

---

## 1. 🤖 Android 앱 배포 (Google Play Store)

Android는 소스 보안 정책 및 로컬 컴파일 효율성에 따라 로컬 환경에서 직접 빌드하여 구글 플레이 스토어에 배포합니다.

### 📋 빌드 규격 및 설정
- **앱 ID (Package Name)**: `com.woc.today`
- **배포 버전 코드 (versionCode)**: `3` (Android 빌드 관리용 번호)
- **배포 버전 이름 (versionName)**: `1.0.0`
- **설정 파일**: [build.gradle](file:///c:/Users/stone/WoC/android/app/build.gradle#L22)
- **앱 아이콘**: Tango World 공식 로고 (`mipmap-*` 및 adaptive icon 적용 완료)

### 🚀 배포 절차 (Step-by-Step)
1. **완성된 패키지 확인**:
   - 아래의 링크를 클릭하여 로컬 컴퓨터에 생성된 최종 배포 파일 폴더를 엽니다.
   - [AAB 배포 폴더 열기](file:///c:/Users/stone/WoC/android/app/build/outputs/bundle/release/)
   - 폴더 내의 **`app-release.aab`** 파일이 최종 패키지입니다.
2. **구글 플레이 콘솔 업로드**:
   - [Google Play Console](https://play.google.com/console/)에 로그인합니다.
   - 대상 앱선택 후 왼쪽 메뉴의 **`테스트 및 출시` > `프로덕션`** 메뉴로 이동합니다.
   - 우측 상단의 **`새 버전 만들기`** 버튼을 클릭합니다.
   - 준비된 **`app-release.aab`** 파일을 드래그하여 업로드 영역에 놓습니다.
   - 업로드 및 검사 완료 후 하단의 **`저장`** 및 **`버전 검토`**를 눌러 제출을 완수합니다.

---

## 2. 🍏 iOS 앱 배포 (Apple App Store / TestFlight)

iOS는 클라우드 CI/CD 플랫폼인 Codemagic과 연동하여 서버에서 빌드 및 TestFlight 업로드까지 원스톱으로 처리합니다.

### 📋 빌드 규격 및 설정
- **앱 ID (Bundle ID)**: `com.woc.today`
- **배포 빌드 번호 (Build Version)**: `4` (App Store Connect 업로드 관리용 번호)
- **지원 디바이스군**: **iPhone Only** (iPad 지원 제외 처리 완료)
- **설정 파일**: [project.pbxproj](file:///c:/Users/stone/WoC/ios/App/App.xcodeproj/project.pbxproj) / [Info.plist](file:///c:/Users/stone/WoC/ios/App/App/Info.plist)
- **앱 아이콘**: Tango World 공식 로고 (1024x1024 유니버설 아이콘 교체 완료)

### 🔐 코드 서명 자산 (대시보드 연동 완료)
- **배포 인증서**: `woc_distribution_cert` (ios_distribution.p12)
- **프로비저닝 프로필**: `woc_app_store_profile` (com.woc.today용 App Store 배포 프로필)

### 🚀 배포 절차 (Step-by-Step)
1. **CI 빌드 트리거**:
   - [Codemagic 대시보드](https://codemagic.io/)에 접속하여 프로젝트를 선택합니다.
   - 우측의 **`Start new build`** 버튼을 클릭하여 빌드를 시작합니다.
2. **빌드 완료 및 업로드**:
   - 빌드가 진행되면 소스 컴파일 및 앱 아카이빙을 마친 후 Apple App Store Connect로 자동 전송됩니다.
3. **애플 500 에러 대처법 (체크사항)**:
   - 빌드 로그의 끝부분에 `received status code 500; internal server error.`로 인해 최종 빌드 상태가 `failed`로 표시될 수 있습니다.
   - 이는 애플의 실시간 처리 상태 조회 API가 일시적으로 지연되는 타임아웃 오류일 뿐이며, 로그 상에 **`UPLOAD SUCCEEDED`** 메시지가 확인되면 **실제 업로드는 이미 100% 성공한 상태**입니다.
   - 업로드 완료 약 10~15분 후 [App Store Connect](https://appstoreconnect.apple.com/)의 TestFlight 탭에서 처리 완료된 빌드를 확인하고 테스터 배포 및 심사 제출을 진행하시면 됩니다.

---

## 3. 🎨 브랜드 에셋 및 아이콘 파일 정보
- **로고 원본 파일**: `public/icons/icon-512x512.png`
- **PWA/웹 브라우저 아이콘**: `public/icon-192.png`, `public/icon-512.png`
- **웹 매니페스트 설정**: [manifest.json](file:///c:/Users/stone/WoC/public/manifest.json) / [manifest_en.json](file:///c:/Users/stone/WoC/public/manifest_en.json)
